import { EventHub } from "./events.js";
import { ArenaError } from "./errors.js";
import { createId, hashRequest } from "./identifiers.js";
import { ArenaRegistry } from "./registry.js";
import {
  containsRuntimeSensitiveValue,
  redactSecrets,
} from "./security.js";
import type {
  ArenaRepository,
  IdempotentOperationRecord,
  SessionUpdate,
} from "./store.js";
import type {
  AgentDecision,
  AgentProvider,
  AgentSession,
  AgentTurnResult,
  ArenaRun,
  ArenaTurnInput,
  CreateRunInput,
  LoadoutSnapshot,
  NormalizedProviderEvent,
  ProviderTurnOutput,
  PublicModelCapability,
  TokenUsage,
  ToolTrace,
  TraceEvent,
} from "./types.js";
import { parseDecision } from "./validation.js";

type AgentExecution = {
  result: AgentTurnResult;
  update: SessionUpdate;
};

type ObservedProviderTelemetry = {
  usage?: TokenUsage;
  toolTrace: ToolTrace[];
  toolStarts: Map<string, number[]>;
};

type FallbackTelemetry = {
  usage?: TokenUsage;
  toolTrace?: ToolTrace[];
  history?: unknown[];
  lastInputTokens?: number | null;
};

type IdempotentExecution = {
  response: Record<string, unknown>;
  replayed: boolean;
};

export type CreateTurnResult = {
  turnId: string;
  status: "queued" | "running" | "completed" | "failed";
  replayed: boolean;
  eventsUrl: string;
};

function zeroUsage(): TokenUsage {
  return {
    inputTokens: 0,
    cachedInputTokens: null,
    outputTokens: 0,
    reasoningTokens: null,
    totalTokens: 0,
    source: "unavailable",
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function approximateTokens(value: unknown): number {
  const serialized = JSON.stringify(value);
  return serialized === undefined
    ? 0
    : Math.max(1, Math.ceil(serialized.length / 4));
}

function conservativeTokenUpperBound(value: unknown): number {
  const serialized = JSON.stringify(value);
  return serialized === undefined
    ? 0
    : Math.max(1, Buffer.byteLength(serialized, "utf8"));
}

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function nullableNonNegativeInteger(
  value: unknown,
): number | null | undefined {
  return value === null ? null : nonNegativeInteger(value) ?? undefined;
}

function tokenUsageFromSafeData(
  safeData: Record<string, unknown>,
): TokenUsage | null {
  const inputTokens = nonNegativeInteger(safeData.inputTokens);
  const outputTokens = nonNegativeInteger(safeData.outputTokens);
  const totalTokens = nonNegativeInteger(safeData.totalTokens);
  const cachedInputTokens = nullableNonNegativeInteger(
    safeData.cachedInputTokens,
  );
  const reasoningTokens = nullableNonNegativeInteger(
    safeData.reasoningTokens,
  );
  const source = safeData.source;
  if (
    inputTokens === null ||
    outputTokens === null ||
    totalTokens === null ||
    cachedInputTokens === undefined ||
    reasoningTokens === undefined ||
    !["provider_measured", "mock_measured", "unavailable"].includes(
      String(source),
    )
  ) {
    return null;
  }
  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens,
    source: source as TokenUsage["source"],
  };
}

function normalizedToolType(value: unknown): ToolTrace["type"] | null {
  return value === "function" || value === "mcp" || value === "skill"
    ? value
    : null;
}

function safeFailureReason(error: unknown, sensitiveValues: string[]): string {
  if (isAbortError(error)) {
    return "provider_timeout";
  }
  if (
    error instanceof ArenaError &&
    /^[a-z0-9_]{1,64}$/.test(error.code) &&
    !containsRuntimeSensitiveValue(error.code, sensitiveValues)
  ) {
    return error.code;
  }
  return "provider_unavailable";
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError"
  );
}

export class ArenaService {
  readonly #store: ArenaRepository;
  readonly #registry: ArenaRegistry;
  readonly #providers: Map<string, AgentProvider>;
  readonly #events: EventHub;
  readonly #idempotentOperations = new Map<
    string,
    {
      requestHash: string;
      promise: Promise<IdempotentExecution>;
    }
  >();
  readonly #stateMutationLocks = new Set<string>();

  constructor(options: {
    store: ArenaRepository;
    registry: ArenaRegistry;
    providers: AgentProvider[];
    events?: EventHub;
  }) {
    this.#store = options.store;
    this.#registry = options.registry;
    this.#providers = new Map(
      options.providers.map((provider) => [provider.providerId, provider]),
    );
    this.#events = options.events ?? new EventHub();
  }

  capabilities(): {
    modelProfiles: PublicModelCapability[];
    cardsVersion: string;
    limits: Record<string, number>;
    registry: Record<string, unknown>;
  } {
    return {
      modelProfiles: this.#registry.publicCapabilities().map((profile) => {
        const implemented = this.#providers.has(profile.provider);
        const verifiedEnvironment =
          profile.provider === "openai"
            ? "OPENAI_LIVE_VERIFIED"
            : profile.provider === "anthropic"
              ? "ANTHROPIC_LIVE_VERIFIED"
              : undefined;
        return {
          ...profile,
          implemented,
          configured: implemented && profile.configured,
          liveVerified:
            profile.provider === "mock" ||
            (verifiedEnvironment !== undefined &&
              process.env[verifiedEnvironment] === "1"),
          unavailableReasons: implemented
            ? profile.unavailableReasons
            : [...profile.unavailableReasons, "adapter_not_implemented"],
        };
      }),
      cardsVersion: "2026-07-23.1",
      limits: {
        partySize: 3,
        maxConcurrentTurnsPerRun: 1,
      },
      registry: this.#registry.publicCards(),
    };
  }

  createRun(ownerId: string, input: CreateRunInput, idempotencyKey: string): {
    runId: string;
    modelProfileId: string;
    cardsVersion: string;
    replayed: boolean;
    agents: Array<{
      agentId: string;
      arenaSessionId: string;
      generation: number;
    }>;
  } {
    this.#validateIdempotencyKey(idempotencyKey);
    const requestHash = hashRequest(input);
    const existing = this.#store.getRunByIdempotencyKey(
      ownerId,
      idempotencyKey,
    );
    if (existing !== null) {
      if (existing.requestHash !== requestHash) {
        throw new ArenaError(
          409,
          "idempotency_conflict",
          "Idempotency key was already used with a different request.",
        );
      }
      return {
        runId: existing.run.id,
        modelProfileId: existing.run.modelProfile.id,
        cardsVersion: existing.run.cardsVersion,
        replayed: true,
        agents: existing.sessions.map((session) => ({
          agentId: session.agentId,
          arenaSessionId: session.id,
          generation: session.generation,
        })),
      };
    }
    const modelProfile = this.#registry.resolveModelProfile(
      input.modelProfileId,
    );
    const harness = this.#registry.resolveHarness(input.harnessId);
    const loadouts = input.party.map((loadout) =>
      this.#registry.snapshotLoadout(loadout),
    );
    const providerLoadouts = loadouts.map((loadout) =>
      this.#registry.resolveProviderLoadout(loadout, modelProfile.provider),
    );
    const now = new Date().toISOString();
    const run: ArenaRun = {
      id: createId("run"),
      ownerId,
      modelProfile,
      harness,
      cardsVersion: "2026-07-23.1",
      status: "active",
      createdAt: now,
    };
    const sessions: AgentSession[] = loadouts.map((loadout, partyIndex) => ({
      id: createId("as"),
      runId: run.id,
      ownerId,
      agentId: loadout.agentId,
      partyIndex,
      generation: 1,
      loadout,
      providerLoadout: providerLoadouts[partyIndex]!,
      history: [],
      estimatedActiveTokens: 0,
      lastMeasuredInputTokens: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    }));
    const stored = this.#store.createRun(
      run,
      sessions,
      idempotencyKey,
      requestHash,
    );
    return {
      runId: stored.run.id,
      modelProfileId: stored.run.modelProfile.id,
      cardsVersion: stored.run.cardsVersion,
      replayed: stored.replayed,
      agents: stored.sessions.map((session) => ({
        agentId: session.agentId,
        arenaSessionId: session.id,
        generation: session.generation,
      })),
    };
  }

  updateLoadout(
    ownerId: string,
    runId: string,
    agentId: string,
    loadout: LoadoutSnapshot,
  ): AgentSession {
    const run = this.#requiredRun(ownerId, runId);
    this.#assertRunIdle(ownerId, runId);
    this.#assertAgentStateIdle(runId, agentId);
    if (loadout.agentId !== agentId) {
      throw new ArenaError(
        400,
        "invalid_request",
        "Loadout agent ID does not match the route.",
      );
    }
    const providerLoadout = this.#registry.resolveProviderLoadout(
      loadout,
      run.modelProfile.provider,
    );
    return this.#store.updateLoadout(
      ownerId,
      runId,
      agentId,
      loadout,
      providerLoadout,
    );
  }

  snapshotLoadout(input: Parameters<ArenaRegistry["snapshotLoadout"]>[0]) {
    return this.#registry.snapshotLoadout(input);
  }

  createTurn(
    ownerId: string,
    runId: string,
    input: ArenaTurnInput,
    idempotencyKey: string,
  ): CreateTurnResult {
    this.#requiredRun(ownerId, runId);
    this.#validateIdempotencyKey(idempotencyKey);
    const requestHash = hashRequest(input);
    const existing = this.#store.getTurnByIdempotencyKey(
      ownerId,
      runId,
      idempotencyKey,
    );
    if (existing !== null) {
      if (existing.requestHash !== requestHash) {
        throw new ArenaError(
          409,
          "idempotency_conflict",
          "Idempotency key was already used with a different request.",
        );
      }
      return {
        turnId: existing.turn.id,
        status: existing.turn.status,
        replayed: true,
        eventsUrl: `/v1/turns/${existing.turn.id}/events`,
      };
    }
    this.#assertRunStateIdle(runId);
    const turnId = createId("turn");
    const created = this.#store.createTurnWithEvent(
      {
        id: turnId,
        runId,
        ownerId,
        request: input,
        status: "queued",
        idempotencyKey,
        requestHash,
        results: [],
        createdAt: new Date().toISOString(),
      },
      redactSecrets({ runId }) as Record<string, unknown>,
    );
    if (!created.replayed) {
      if (created.event !== null) {
        this.#events.publish(created.event);
      }
      queueMicrotask(() => {
        void this.#executeTurn(ownerId, turnId);
      });
    }
    return {
      turnId: created.turn.id,
      status: created.turn.status,
      replayed: created.replayed,
      eventsUrl: `/v1/turns/${created.turn.id}/events`,
    };
  }

  getTurn(ownerId: string, turnId: string) {
    const turn = this.#store.getTurn(ownerId, turnId);
    if (turn === null) {
      throw new ArenaError(404, "turn_not_found", "Turn not found.");
    }
    return {
      turnId: turn.id,
      runId: turn.runId,
      status: turn.status,
      results: turn.results,
      ...(turn.failureReason === undefined
        ? {}
        : { failureReason: turn.failureReason }),
      createdAt: turn.createdAt,
      ...(turn.startedAt === undefined ? {} : { startedAt: turn.startedAt }),
      ...(turn.completedAt === undefined
        ? {}
        : { completedAt: turn.completedAt }),
    };
  }

  getEvents(
    ownerId: string,
    turnId: string,
    afterSequence: number,
  ): TraceEvent[] {
    return this.#store.getEvents(ownerId, turnId, afterSequence);
  }

  subscribe(
    ownerId: string,
    turnId: string,
    listener: (event: TraceEvent) => void,
  ): () => void {
    if (this.#store.getTurn(ownerId, turnId) === null) {
      throw new ArenaError(404, "turn_not_found", "Turn not found.");
    }
    return this.#events.subscribe(turnId, listener);
  }

  async compact(
    ownerId: string,
    runId: string,
    agentId: string,
    idempotencyKey: string,
  ): Promise<Record<string, unknown>> {
    this.#validateIdempotencyKey(idempotencyKey);
    const scope = `compact:${runId}:${agentId}`;
    const requestHash = hashRequest({
      runId,
      agentId,
      operation: "compact",
    });
    const lockKey = `${ownerId}:${scope}:${hashRequest(idempotencyKey)}`;
    const running = this.#idempotentOperations.get(lockKey);
    if (running !== undefined) {
      if (running.requestHash !== requestHash) {
        throw new ArenaError(
          409,
          "idempotency_conflict",
          "Idempotency key is in use for a different request.",
        );
      }
      return { ...(await running.promise).response, replayed: true };
    }
    const existing = this.#store.getIdempotentOperation(
      ownerId,
      scope,
      idempotencyKey,
    );
    if (existing !== null) {
      return this.#replayOperation(existing, requestHash);
    }
    const promise = this.#withStateMutation(
      `state:${runId}:${agentId}`,
      async () =>
        this.#compactOnce(
          ownerId,
          runId,
          agentId,
          scope,
          idempotencyKey,
          requestHash,
        ),
    );
    this.#idempotentOperations.set(lockKey, { requestHash, promise });
    try {
      const executed = await promise;
      return { ...executed.response, replayed: executed.replayed };
    } finally {
      this.#idempotentOperations.delete(lockKey);
    }
  }

  async #compactOnce(
    ownerId: string,
    runId: string,
    agentId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<IdempotentExecution> {
    const run = this.#requiredRun(ownerId, runId);
    this.#assertRunIdle(ownerId, runId);
    const session = this.#requiredSession(ownerId, runId, agentId);
    const provider = this.#requiredProvider(run.modelProfile.provider);
    const claim = this.#store.claimIdempotentOperation(
      ownerId,
      scope,
      idempotencyKey,
      requestHash,
    );
    if (!claim.claimed) {
      const replay = this.#replayOperation(claim.operation, requestHash);
      const { replayed: _replayed, ...response } = replay;
      return { response, replayed: true };
    }
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      run.harness.timeoutMs,
    );
    timeout.unref();
    let compacted: Awaited<ReturnType<AgentProvider["compact"]>>;
    try {
      compacted = await provider.compact({
        model: run.modelProfile,
        history: session.history,
        harness: run.harness,
        signal: controller.signal,
      });
    } catch (error) {
      this.#markCompactIndeterminate(
        ownerId,
        scope,
        idempotencyKey,
        requestHash,
      );
      throw new ArenaError(
        isAbortError(error) ? 504 : 502,
        isAbortError(error) ? "provider_timeout" : "compact_failed",
        isAbortError(error)
          ? "Provider compaction timed out."
          : "Provider compaction failed.",
      );
    } finally {
      clearTimeout(timeout);
    }
    const response = {
      runId,
      agentId,
      arenaSessionId: session.id,
      generation: session.generation,
      compactionMode: compacted.mode,
      context: this.#contextTelemetry(
        compacted.estimatedActiveTokens,
        run.harness.maxInputTokens,
        true,
        compacted.mode,
      ),
    };
    try {
      const completed = this.#store.completeCompactOperation(
        ownerId,
        scope,
        idempotencyKey,
        requestHash,
        session.id,
        compacted.history,
        compacted.estimatedActiveTokens,
        response,
      );
      return {
        response: completed.response,
        replayed: completed.replayed,
      };
    } catch (error) {
      this.#markCompactIndeterminate(
        ownerId,
        scope,
        idempotencyKey,
        requestHash,
      );
      throw error;
    }
  }

  async clear(
    ownerId: string,
    runId: string,
    agentId: string,
    idempotencyKey: string,
  ): Promise<Record<string, unknown>> {
    this.#validateIdempotencyKey(idempotencyKey);
    const scope = `clear:${runId}:${agentId}`;
    const requestHash = hashRequest({
      runId,
      agentId,
      operation: "clear",
    });
    const existing = this.#store.getIdempotentOperation(
      ownerId,
      scope,
      idempotencyKey,
    );
    if (existing !== null) {
      return this.#replayOperation(existing, requestHash);
    }
    return this.#withStateMutation(
      `state:${runId}:${agentId}`,
      async () => {
        const run = this.#requiredRun(ownerId, runId);
        this.#assertRunIdle(ownerId, runId);
        const cleared = this.#store.clearSessionIdempotently(
          ownerId,
          runId,
          agentId,
          scope,
          idempotencyKey,
          requestHash,
          (session) => ({
            runId,
            agentId,
            arenaSessionId: session.id,
            generation: session.generation,
            context: this.#contextTelemetry(
              0,
              run.harness.maxInputTokens,
              false,
            ),
          }),
        );
        return { ...cleared.response, replayed: cleared.replayed };
      },
    );
  }

  async #executeTurn(ownerId: string, turnId: string): Promise<void> {
    try {
      const queuedTurn = this.#store.getTurn(ownerId, turnId);
      if (queuedTurn === null) {
        throw new ArenaError(404, "turn_not_found", "Turn not found.");
      }
      const run = this.#requiredRun(ownerId, queuedTurn.runId);
      const sessions = this.#store.getActiveSessions(ownerId, run.id);
      if (sessions.length !== 3) {
        throw new ArenaError(
          500,
          "invalid_run_state",
          "An active run must contain exactly three agent sessions.",
        );
      }
      const started = this.#store.markTurnRunningWithEvent(
        ownerId,
        turnId,
        redactSecrets({
          runId: run.id,
          agentCount: sessions.length,
        }) as Record<string, unknown>,
      );
      const turn = started.turn;
      this.#events.publish(started.event);

      let releaseGate: (() => void) | undefined;
      const gate = new Promise<void>((resolve) => {
        releaseGate = resolve;
      });
      const executions = sessions.map(async (session) => {
        await gate;
        return this.#executeAgent(ownerId, turnId, run, session, turn.request);
      });
      releaseGate?.();
      const settled = await Promise.allSettled(executions);
      const completed: AgentExecution[] = settled.map((entry, index) => {
        if (entry.status === "fulfilled") {
          return entry.value;
        }
        const session = sessions[index]!;
        return this.#fallbackExecution(
          run,
          session,
          turn.request,
          "internal_agent_error",
          0,
          createId("trace"),
        );
      });
      const fallbackCount = completed.filter(
        (entry) => entry.result.fallbackUsed,
      ).length;
      const completion = this.#store.completeTurnWithEvent(
        ownerId,
        turnId,
        completed.map((entry) => entry.result),
        completed.map((entry) => entry.update),
        redactSecrets({
          status: "completed",
          fallbackCount,
        }) as Record<string, unknown>,
      );
      this.#events.publish(completion.event);
    } catch (error) {
      const code =
        error instanceof ArenaError ? error.code : "turn_execution_failed";
      try {
        const failed = this.#store.failTurnWithEvent(
          ownerId,
          turnId,
          code,
          redactSecrets({ reason: code }) as Record<string, unknown>,
        );
        this.#events.publish(failed.event);
      } catch {
        // The original failure remains authoritative. No secret data is logged.
      }
    }
  }

  async #executeAgent(
    ownerId: string,
    turnId: string,
    run: ArenaRun,
    session: AgentSession,
    request: ArenaTurnInput,
  ): Promise<AgentExecution> {
    const provider = this.#requiredProvider(run.modelProfile.provider);
    const loadout =
      session.providerLoadout ??
      this.#registry.resolveProviderLoadout(
        session.loadout,
        run.modelProfile.provider,
      );
    const instructions = this.#compileInstructions(
      session,
      loadout.instructions,
    );
    const userInput = JSON.stringify({
      stageId: request.stageId,
      turnNumber: request.turnNumber,
      event: request.event,
      allowedActions: request.allowedActions,
    });
    const sensitiveValues = this.#runtimeSensitiveValues(run, loadout);
    const traceId = createId("trace");
    const startedAt = performance.now();
    this.#emit(ownerId, turnId, "agent.started", {
      agentId: session.agentId,
      traceId,
    });
    const projectedActiveTokens = Math.max(
      conservativeTokenUpperBound({
        history: session.history,
        instructions,
        userInput,
        functionTools: loadout.functionTools,
        hostedSkills: loadout.hostedSkills.map(({ cardId, name, version }) => ({
          cardId,
          name,
          version,
        })),
        mcpTools: loadout.mcpTools.map(
          ({ cardId, serverLabel, allowedTools, readOnly }) => ({
            cardId,
            serverLabel,
            allowedTools,
            readOnly,
          }),
        ),
      }),
      session.estimatedActiveTokens + conservativeTokenUpperBound(userInput),
      session.lastMeasuredInputTokens === null
        ? 0
        : session.lastMeasuredInputTokens +
          conservativeTokenUpperBound(userInput),
    );
    const softLimit = Math.floor(
      run.harness.maxInputTokens * run.harness.contextSoftLimitRatio,
    );
    const hardLimit = Math.floor(
      run.harness.maxInputTokens * run.harness.contextHardLimitRatio,
    );
    if (projectedActiveTokens >= softLimit) {
      this.#emit(ownerId, turnId, "agent.context.warning", {
        agentId: session.agentId,
        traceId,
        projectedActiveTokens,
        softLimitTokens: softLimit,
        hardLimitTokens: hardLimit,
      });
    }
    if (projectedActiveTokens >= hardLimit) {
      const fallback = this.#fallbackExecution(
        run,
        session,
        request,
        "context_hard_limit",
        performance.now() - startedAt,
        traceId,
      );
      this.#emit(ownerId, turnId, "agent.fallback", {
        agentId: session.agentId,
        traceId,
        reason: "context_hard_limit",
      });
      this.#emit(ownerId, turnId, "agent.completed", {
        agentId: session.agentId,
        traceId,
        fallbackUsed: true,
      });
      return fallback;
    }
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      run.harness.timeoutMs,
    );
    timeout.unref();
    const observed: ObservedProviderTelemetry = {
      toolTrace: [],
      toolStarts: new Map(),
    };
    let output: ProviderTurnOutput;
    try {
      output = await provider.runTurn({
        traceId,
        model: run.modelProfile,
        agentId: session.agentId,
        history: session.history,
        instructions,
        userInput,
        allowedActions: request.allowedActions,
        loadout,
        harness: run.harness,
        signal: controller.signal,
        onEvent: async (event) => {
          this.#observeProviderEvent(event, observed, sensitiveValues);
          this.#emitProviderEvent(
            ownerId,
            turnId,
            session.agentId,
            traceId,
            event,
            sensitiveValues,
          );
        },
      });
    } catch (error) {
      clearTimeout(timeout);
      this.#finalizeObservedToolStarts(observed);
      const reason = safeFailureReason(error, sensitiveValues);
      const fallback = this.#fallbackExecution(
        run,
        session,
        request,
        reason,
        performance.now() - startedAt,
        traceId,
        {
          ...(observed.usage === undefined
            ? {}
            : { usage: observed.usage }),
          toolTrace: observed.toolTrace,
        },
      );
      this.#emit(ownerId, turnId, "agent.fallback", {
        agentId: session.agentId,
        traceId,
        reason,
      });
      this.#emit(ownerId, turnId, "agent.completed", {
        agentId: session.agentId,
        traceId,
        fallbackUsed: true,
      });
      return fallback;
    } finally {
      clearTimeout(timeout);
    }

    const usage =
      output.usage !== null && typeof output.usage === "object"
        ? tokenUsageFromSafeData(
            output.usage as unknown as Record<string, unknown>,
          )
        : null;
    const lastInputTokens =
      output.lastInputTokens === null
        ? null
        : nonNegativeInteger(output.lastInputTokens);
    const toolTrace = this.#normalizeToolTrace(
      output.toolTrace,
      sensitiveValues,
    );
    const hadPendingToolEvents = observed.toolStarts.size > 0;
    if (hadPendingToolEvents) {
      this.#finalizeObservedToolStarts(observed);
    }
    const observedToolFailure = observed.toolTrace.some(
      (trace) => trace.status === "failed",
    );
    const returnedToolFailure =
      toolTrace?.some((trace) => trace.status !== "completed") ?? false;
    const invalidLastInputTokens =
      output.lastInputTokens !== null && lastInputTokens === null;
    const invalidProviderOutput =
      !Array.isArray(output.history) ||
      usage === null ||
      invalidLastInputTokens ||
      toolTrace === null ||
      hadPendingToolEvents ||
      observedToolFailure ||
      returnedToolFailure;
    const sensitiveProviderOutput = containsRuntimeSensitiveValue(
      {
        rawDecision: output.rawDecision,
        toolTrace: output.toolTrace,
      },
      sensitiveValues,
    );
    let decision: AgentDecision;
    try {
      if (invalidProviderOutput) {
        throw new ArenaError(
          502,
          "invalid_model_output",
          "Provider output failed normalization.",
        );
      }
      if (sensitiveProviderOutput) {
        throw new ArenaError(
          502,
          "sensitive_provider_output",
          "Provider output contained a server-owned runtime value.",
        );
      }
      decision = parseDecision(
        output.rawDecision,
        request.allowedActions,
        loadout.cardIds,
      );
    } catch (error) {
      const reason =
        error instanceof ArenaError &&
        error.code === "sensitive_provider_output"
          ? "sensitive_provider_output"
          : "invalid_model_output";
      const fallbackUsage = usage ?? observed.usage;
      const fallbackToolTrace =
        observedToolFailure || hadPendingToolEvents
          ? observed.toolTrace
          : (toolTrace ?? observed.toolTrace);
      const fallback = this.#fallbackExecution(
        run,
        session,
        request,
        reason,
        performance.now() - startedAt,
        traceId,
        {
          ...(fallbackUsage === undefined ? {} : { usage: fallbackUsage }),
          toolTrace: fallbackToolTrace,
        },
      );
      this.#emit(ownerId, turnId, "agent.fallback", {
        agentId: session.agentId,
        traceId,
        reason,
      });
      this.#emit(ownerId, turnId, "agent.completed", {
        agentId: session.agentId,
        traceId,
        fallbackUsed: true,
      });
      return fallback;
    }

    // The guards above make these values non-null while keeping the runtime
    // validation explicit at the provider boundary.
    const normalizedUsage = usage!;
    const normalizedToolTrace = toolTrace!;
    const normalizedLastInputTokens = lastInputTokens;
    const historyEstimate = approximateTokens(output.history);
    const measuredInputPlusOutput =
      normalizedLastInputTokens === null
        ? 0
        : normalizedLastInputTokens + normalizedUsage.outputTokens;
    const estimatedActiveTokens = Math.max(
      measuredInputPlusOutput,
      historyEstimate,
    );
    const result: AgentTurnResult = {
      agentId: session.agentId,
      arenaSessionId: session.id,
      decision,
      usage: normalizedUsage,
      context: this.#contextTelemetry(
        estimatedActiveTokens,
        run.harness.maxInputTokens,
        false,
        undefined,
        normalizedLastInputTokens !== null &&
          normalizedUsage.outputTokens === 0 &&
          normalizedLastInputTokens >= historyEstimate
          ? "measured_input"
          : "estimated_after_output",
      ),
      toolTrace: normalizedToolTrace,
      latencyMs: Math.round(performance.now() - startedAt),
      fallbackUsed: false,
      traceId,
    };
    this.#emit(ownerId, turnId, "agent.decision.accepted", {
      agentId: session.agentId,
      traceId,
      actionId: decision.actionId,
      targetId: decision.targetId,
    });
    this.#emit(ownerId, turnId, "agent.completed", {
      agentId: session.agentId,
      traceId,
      fallbackUsed: false,
    });
    return {
      result,
      update: {
        sessionId: session.id,
        history: output.history,
        estimatedActiveTokens,
        lastMeasuredInputTokens: normalizedLastInputTokens,
      },
    };
  }

  #fallbackExecution(
    run: ArenaRun,
    session: AgentSession,
    request: ArenaTurnInput,
    reason: string,
    latencyMs: number,
    traceId: string,
    telemetry: FallbackTelemetry = {},
  ): AgentExecution {
    const configured = request.allowedActions.find(
      (action) => action.actionId === run.harness.fallbackActionId,
    );
    const action = configured ?? request.allowedActions[0]!;
    const decision: AgentDecision = {
      actionId: action.actionId,
      targetId: action.targetIds[0] ?? null,
      speech: `${session.agentId} falls back to ${action.actionId}.`,
      reasonSummary: "Deterministic fallback applied by the arena harness.",
      attributedCardIds: [],
    };
    const usage = telemetry.usage ?? zeroUsage();
    const history = telemetry.history ?? session.history;
    const estimatedActiveTokens =
      telemetry.history === undefined
        ? session.estimatedActiveTokens
        : Math.max(
            telemetry.lastInputTokens ?? 0,
            approximateTokens(history),
          );
    const lastMeasuredInputTokens =
      telemetry.history === undefined
        ? session.lastMeasuredInputTokens
        : (telemetry.lastInputTokens ?? null);
    return {
      result: {
        agentId: session.agentId,
        arenaSessionId: session.id,
        decision,
        usage,
        context: this.#contextTelemetry(
          estimatedActiveTokens,
          run.harness.maxInputTokens,
          false,
        ),
        toolTrace: telemetry.toolTrace ?? [],
        latencyMs: Math.round(latencyMs),
        fallbackUsed: true,
        fallbackReason: reason,
        traceId,
      },
      update: {
        sessionId: session.id,
        history,
        estimatedActiveTokens,
        lastMeasuredInputTokens,
      },
    };
  }

  #compileInstructions(
    session: AgentSession,
    cardInstructions: string[],
  ): string {
    return [
      "You are one autonomous party agent in Agent Arena.",
      "Select exactly one legal action from the current allowedActions.",
      "Return only the requested structured decision. Never modify game state.",
      "Keep speech and reasonSummary short. Do not reveal hidden reasoning.",
      `Agent ID: ${session.agentId}`,
      ...cardInstructions.map((instruction) => `Equipped card: ${instruction}`),
    ].join("\n");
  }

  #contextTelemetry(
    estimatedActiveTokens: number,
    budgetTokens: number,
    compactedThisTurn: boolean,
    compactionMode?: AgentTurnResult["context"]["compactionMode"],
    measurement: AgentTurnResult["context"]["measurement"] = "estimated_after_output",
  ): AgentTurnResult["context"] {
    return {
      estimatedActiveTokens,
      budgetTokens,
      gauge: clamp(estimatedActiveTokens / budgetTokens, 0, 1),
      measurement,
      compactedThisTurn,
      ...(compactionMode === undefined ? {} : { compactionMode }),
    };
  }

  #runtimeSensitiveValues(
    run: ArenaRun,
    loadout: NonNullable<AgentSession["providerLoadout"]>,
  ): string[] {
    const authorizationValues = loadout.mcpTools.flatMap((tool) => {
      if (tool.authorization === undefined) {
        return [];
      }
      const token = tool.authorization.replace(/^Bearer\s+/i, "");
      return token === tool.authorization
        ? [tool.authorization]
        : [tool.authorization, token];
    });
    return [
      run.modelProfile.model,
      ...loadout.hostedSkills.map((skill) => skill.skillId),
      ...loadout.mcpTools.map((tool) => tool.serverUrl),
      ...authorizationValues,
    ].filter((value) => value.length >= 4);
  }

  #normalizeToolTrace(
    value: unknown,
    sensitiveValues: string[],
  ): ToolTrace[] | null {
    if (!Array.isArray(value) || value.length > 100) {
      return null;
    }
    const result: ToolTrace[] = [];
    for (const candidate of value) {
      if (candidate === null || typeof candidate !== "object") {
        return null;
      }
      const entry = candidate as Record<string, unknown>;
      const type = normalizedToolType(entry.type);
      const status = entry.status;
      const name = entry.name;
      const durationMs =
        entry.durationMs === undefined
          ? undefined
          : nonNegativeInteger(entry.durationMs);
      const safeSummary = entry.safeSummary;
      if (
        type === null ||
        !["started", "completed", "failed"].includes(String(status)) ||
        typeof name !== "string" ||
        name.length === 0 ||
        name.length > 128 ||
        durationMs === null ||
        (safeSummary !== undefined &&
          (typeof safeSummary !== "string" || safeSummary.length > 256)) ||
        containsRuntimeSensitiveValue(
          { name, safeSummary },
          sensitiveValues,
        )
      ) {
        return null;
      }
      result.push({
        type,
        name,
        status: status as ToolTrace["status"],
        ...(durationMs === undefined ? {} : { durationMs }),
        ...(safeSummary === undefined ? {} : { safeSummary }),
      });
    }
    return result;
  }

  #observeProviderEvent(
    event: NormalizedProviderEvent,
    observed: ObservedProviderTelemetry,
    sensitiveValues: string[],
  ): void {
    if (event.type === "usage.final") {
      const usage = tokenUsageFromSafeData(event.safeData);
      if (usage !== null) {
        observed.usage = usage;
      }
      return;
    }
    if (!event.type.startsWith("tool.")) {
      return;
    }
    const type = normalizedToolType(event.safeData.type);
    const rawName = event.safeData.name;
    if (type === null || typeof rawName !== "string" || rawName.length === 0) {
      return;
    }
    const name = containsRuntimeSensitiveValue(rawName, sensitiveValues)
      ? "[REDACTED]"
      : rawName.slice(0, 128);
    const key = `${type}:${name}`;
    if (event.type === "tool.started") {
      const starts = observed.toolStarts.get(key) ?? [];
      starts.push(performance.now());
      observed.toolStarts.set(key, starts);
      return;
    }
    const starts = observed.toolStarts.get(key);
    const startedAt = starts?.pop();
    if (starts !== undefined && starts.length === 0) {
      observed.toolStarts.delete(key);
    }
    observed.toolTrace.push({
      type,
      name,
      status: event.type === "tool.completed" ? "completed" : "failed",
      ...(startedAt === undefined
        ? {}
        : { durationMs: Math.round(performance.now() - startedAt) }),
    });
  }

  #finalizeObservedToolStarts(observed: ObservedProviderTelemetry): void {
    for (const [key, starts] of observed.toolStarts) {
      const separator = key.indexOf(":");
      const type = normalizedToolType(key.slice(0, separator));
      const name = key.slice(separator + 1);
      if (type === null || name.length === 0) {
        continue;
      }
      for (const startedAt of starts) {
        observed.toolTrace.push({
          type,
          name,
          status: "failed",
          durationMs: Math.round(performance.now() - startedAt),
        });
      }
    }
    observed.toolStarts.clear();
  }

  #emitProviderEvent(
    ownerId: string,
    turnId: string,
    agentId: string,
    traceId: string,
    event: NormalizedProviderEvent,
    sensitiveValues: string[],
  ): void {
    const typeByProviderType: Record<NormalizedProviderEvent["type"], string> = {
      "output.delta": "agent.output.delta",
      "tool.started": "agent.tool.started",
      "tool.completed": "agent.tool.completed",
      "tool.failed": "agent.tool.failed",
      "usage.final": "agent.usage.final",
    };
    let safeData: Record<string, unknown>;
    if (event.type === "output.delta") {
      const delta = event.safeData.delta;
      safeData = {
        characters: typeof delta === "string" ? delta.length : 0,
      };
    } else if (event.type === "usage.final") {
      const usage = tokenUsageFromSafeData(event.safeData);
      if (usage === null) {
        return;
      }
      safeData = { ...usage };
    } else {
      const type = normalizedToolType(event.safeData.type);
      const rawName = event.safeData.name;
      if (type === null || typeof rawName !== "string" || rawName.length === 0) {
        return;
      }
      safeData = {
        type,
        name: containsRuntimeSensitiveValue(rawName, sensitiveValues)
          ? "[REDACTED]"
          : rawName.slice(0, 128),
      };
    }
    this.#emit(ownerId, turnId, typeByProviderType[event.type], {
      agentId,
      traceId,
      ...safeData,
    });
  }

  #emit(
    ownerId: string,
    turnId: string,
    type: string,
    safeData: Record<string, unknown>,
  ): TraceEvent {
    const event = this.#store.appendEvent(
      ownerId,
      turnId,
      type,
      redactSecrets(safeData) as Record<string, unknown>,
    );
    this.#events.publish(event);
    return event;
  }

  #requiredRun(ownerId: string, runId: string): ArenaRun {
    const run = this.#store.getRun(ownerId, runId);
    if (run === null) {
      throw new ArenaError(404, "run_not_found", "Run not found.");
    }
    if (run.status !== "active") {
      throw new ArenaError(409, "run_ended", "Run is not active.");
    }
    return run;
  }

  #requiredSession(
    ownerId: string,
    runId: string,
    agentId: string,
  ): AgentSession {
    const session = this.#store.getActiveSession(ownerId, runId, agentId);
    if (session === null) {
      throw new ArenaError(404, "session_not_found", "Agent session not found.");
    }
    return session;
  }

  #requiredProvider(providerId: string): AgentProvider {
    const provider = this.#providers.get(providerId);
    if (provider === undefined) {
      throw new ArenaError(
        503,
        "provider_unavailable",
        "Configured provider adapter is unavailable.",
      );
    }
    return provider;
  }

  #assertRunIdle(ownerId: string, runId: string): void {
    if (this.#store.hasActiveTurn(ownerId, runId)) {
      throw new ArenaError(409, "run_busy", "The run has an active turn.");
    }
  }

  #assertAgentStateIdle(runId: string, agentId: string): void {
    if (this.#stateMutationLocks.has(`state:${runId}:${agentId}`)) {
      throw new ArenaError(
        409,
        "run_busy",
        "A state mutation is already running for this agent.",
      );
    }
  }

  #assertRunStateIdle(runId: string): void {
    const prefix = `state:${runId}:`;
    if (
      [...this.#stateMutationLocks].some((resource) =>
        resource.startsWith(prefix),
      )
    ) {
      throw new ArenaError(
        409,
        "run_busy",
        "A context mutation is already running for this run.",
      );
    }
  }

  #validateIdempotencyKey(idempotencyKey: string): void {
    if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
      throw new ArenaError(
        400,
        "invalid_idempotency_key",
        "Idempotency-Key must contain 8 to 200 characters.",
      );
    }
  }

  #replayOperation(
    operation: IdempotentOperationRecord,
    requestHash: string,
  ): Record<string, unknown> {
    if (operation.requestHash !== requestHash) {
      throw new ArenaError(
        409,
        "idempotency_conflict",
        "Idempotency key was already used with a different request.",
      );
    }
    if (operation.status === "completed") {
      return { ...operation.response, replayed: true };
    }
    if (operation.status === "indeterminate") {
      throw new ArenaError(
        409,
        "operation_outcome_unknown",
        "The prior operation was interrupted; use a new idempotency key to retry explicitly.",
      );
    }
    throw new ArenaError(
      409,
      "operation_in_progress",
      "The idempotent operation is still in progress.",
    );
  }

  #markCompactIndeterminate(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
  ): void {
    try {
      this.#store.markIdempotentOperationIndeterminate(
        ownerId,
        scope,
        idempotencyKey,
        requestHash,
      );
    } catch {
      // Preserve the provider/storage failure. Startup recovery will convert a
      // durable in-progress claim if this targeted update could not be written.
    }
  }

  async #withStateMutation<T>(
    resource: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    if (this.#stateMutationLocks.has(resource)) {
      throw new ArenaError(
        409,
        "run_busy",
        "A state mutation is already running for this agent.",
      );
    }
    this.#stateMutationLocks.add(resource);
    try {
      return await operation();
    } finally {
      this.#stateMutationLocks.delete(resource);
    }
  }
}
