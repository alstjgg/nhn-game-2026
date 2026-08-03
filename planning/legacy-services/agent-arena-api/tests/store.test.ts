import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { ArenaError } from "../src/errors.js";
import { hashRequest } from "../src/identifiers.js";
import { MockProvider } from "../src/providers/mock-provider.js";
import { ArenaRegistry } from "../src/registry.js";
import { ContextCipher, fingerprintSecret } from "../src/security.js";
import { ArenaService } from "../src/service.js";
import { ArenaStore } from "../src/store.js";
import type {
  AgentSession,
  AgentTurnResult,
  ArenaRun,
  ArenaTurn,
  ArenaTurnInput,
  HarnessDefinition,
  LoadoutSnapshot,
} from "../src/types.js";

const CONTEXT_KEY =
  "unit-test-context-encryption-key-with-sufficient-entropy";
const AGENT_IDS = ["vanguard", "guardian", "scout"] as const;

type StoreFixture = {
  directory: string;
  path: string;
  store: ArenaStore;
};

const stores: ArenaStore[] = [];
const inspectors: DatabaseSync[] = [];
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const inspector of inspectors.splice(0).reverse()) {
    inspector.close();
  }
  for (const store of stores.splice(0).reverse()) {
    store.close();
  }
  for (const directory of temporaryDirectories.splice(0).reverse()) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createStore(): StoreFixture {
  const directory = mkdtempSync(join(tmpdir(), "agent-arena-store-test-"));
  const path = join(directory, "arena.sqlite");
  const store = new ArenaStore(path, new ContextCipher(CONTEXT_KEY));
  temporaryDirectories.push(directory);
  stores.push(store);
  return { directory, path, store };
}

function openInspector(path: string): DatabaseSync {
  const inspector = new DatabaseSync(path);
  inspectors.push(inspector);
  return inspector;
}

function harness(): HarnessDefinition {
  return {
    id: "starter-4000",
    displayName: "Starter Harness",
    maxInputTokens: 4000,
    maxOutputTokens: 192,
    maxToolCalls: 3,
    timeoutMs: 15_000,
    fallbackActionId: "wait",
    contextSoftLimitRatio: 0.7,
    contextHardLimitRatio: 0.9,
  };
}

function loadout(agentId: string): LoadoutSnapshot {
  return {
    agentId,
    promptCardIds: ["answer-briefly-v1"],
    skillCardIds: [],
    mcpCardIds: [],
    promptCards: [
      {
        id: "answer-briefly-v1",
        version: 1,
        displayName: "Answer Briefly",
        instruction: "Use terse speech.",
      },
    ],
    skillCards: [],
    mcpCards: [],
  };
}

function createRunFixture(
  store: ArenaStore,
  options: {
    ownerId?: string;
    runId?: string;
    historyByAgent?: Partial<Record<(typeof AGENT_IDS)[number], unknown[]>>;
  } = {},
): { run: ArenaRun; sessions: AgentSession[] } {
  const ownerId = options.ownerId ?? "owner-a";
  const runId = options.runId ?? "run-a";
  const now = "2026-07-23T12:00:00.000Z";
  const run: ArenaRun = {
    id: runId,
    ownerId,
    modelProfile: {
      id: "mock-arena",
      displayName: "Deterministic Mock Arena",
      provider: "mock",
      model: "mock-agent-v1",
      compactModes: ["mock-native"],
      capabilities: {
        streaming: true,
        functionTools: true,
        remoteMcp: true,
        skills: true,
        compaction: true,
      },
    },
    harness: harness(),
    cardsVersion: "test-cards-v1",
    status: "active",
    createdAt: now,
  };
  const sessions: AgentSession[] = AGENT_IDS.map((agentId, partyIndex) => ({
    id: `as_${runId}_${agentId}_1`,
    runId,
    ownerId,
    agentId,
    partyIndex,
    generation: 1,
    loadout: loadout(agentId),
    providerLoadout: {
      cardIds: ["answer-briefly-v1"],
      instructions: ["Use terse speech."],
      functionTools: [],
      hostedSkills: [],
      mcpTools: [],
    },
    history: structuredClone(options.historyByAgent?.[agentId] ?? []),
    estimatedActiveTokens: 0,
    lastMeasuredInputTokens: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  }));
  const createRequest = {
    modelProfileId: run.modelProfile.id,
    harnessId: run.harness.id,
    party: sessions.map((session) => ({
      agentId: session.agentId,
      promptCardIds: session.loadout.promptCardIds,
      skillCardIds: session.loadout.skillCardIds,
      mcpCardIds: session.loadout.mcpCardIds,
    })),
  };
  store.createRun(
    run,
    sessions,
    `create-${runId}-key`,
    hashRequest(createRequest),
  );
  return { run, sessions };
}

function turnRequest(turnNumber = 1): ArenaTurnInput {
  return {
    stageId: "stage-1",
    turnNumber,
    event: {
      type: "enemy-approaches",
      summary: `Training turn ${turnNumber}.`,
      publicState: { enemyHp: 10 },
    },
    allowedActions: [
      { actionId: "attack", targetIds: ["enemy-1"] },
      { actionId: "wait", targetIds: [] },
    ],
  };
}

function queuedTurn(options: {
  id: string;
  runId: string;
  ownerId: string;
  idempotencyKey: string;
  request?: ArenaTurnInput;
}): ArenaTurn {
  const request = options.request ?? turnRequest();
  return {
    id: options.id,
    runId: options.runId,
    ownerId: options.ownerId,
    request,
    status: "queued",
    idempotencyKey: options.idempotencyKey,
    requestHash: hashRequest(request),
    results: [],
    createdAt: "2026-07-23T12:01:00.000Z",
  };
}

function agentResult(
  agentId: string,
  arenaSessionId: string,
  fallbackUsed: boolean,
): AgentTurnResult {
  return {
    agentId,
    arenaSessionId,
    decision: {
      actionId: "wait",
      targetId: null,
      speech: "",
      reasonSummary: "Test result.",
      attributedCardIds: [],
    },
    usage: {
      inputTokens: 0,
      cachedInputTokens: null,
      outputTokens: 0,
      reasoningTokens: null,
      totalTokens: 0,
      source: "unavailable",
    },
    context: {
      estimatedActiveTokens: 0,
      budgetTokens: 4000,
      gauge: 0,
      measurement: "estimated",
      compactedThisTurn: false,
    },
    toolTrace: [],
    latencyMs: 0,
    fallbackUsed,
    ...(fallbackUsed ? { fallbackReason: "test_fallback" } : {}),
    traceId: `trace-${agentId}`,
  };
}

function expectArenaError(
  operation: () => unknown,
  expected: { status: number; code: string },
): ArenaError {
  let caught: unknown;
  try {
    operation();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ArenaError);
  expect(caught).toMatchObject(expected);
  return caught as ArenaError;
}

function circularSafeData(): Record<string, unknown> {
  const safeData: Record<string, unknown> = {};
  safeData.self = safeData;
  return safeData;
}

describe("owner isolation", () => {
  it("scopes runs, sessions, turns, events, and context mutations by owner", () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store);
    const turn = queuedTurn({
      id: "turn-owner-a",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "owner-a-turn-0001",
    });
    store.createTurn(turn);
    store.appendEvent(run.ownerId, turn.id, "turn.queued", {
      runId: run.id,
    });

    expect(store.getRun("owner-b", run.id)).toBeNull();
    expect(store.getActiveSessions("owner-b", run.id)).toEqual([]);
    expect(
      store.getActiveSession("owner-b", run.id, sessions[0]!.agentId),
    ).toBeNull();
    expect(store.getTurn("owner-b", turn.id)).toBeNull();
    expectArenaError(() => store.getEvents("owner-b", turn.id, 0), {
      status: 404,
      code: "turn_not_found",
    });
    expectArenaError(
      () =>
        store.updateSessionContext(
          "owner-b",
          sessions[0]!.id,
          [{ role: "user", content: "foreign mutation" }],
          10,
        ),
      { status: 404, code: "session_not_found" },
    );
    expectArenaError(
      () => store.clearSession("owner-b", run.id, sessions[0]!.agentId),
      { status: 404, code: "session_not_found" },
    );

    expect(store.getRun(run.ownerId, run.id)?.id).toBe(run.id);
    expect(store.getEvents(run.ownerId, turn.id, 0)).toHaveLength(1);
  });
});

describe("encrypted context persistence", () => {
  it("stores initial and replaced active context as authenticated ciphertext", () => {
    const marker = "context-plaintext-canary-never-at-rest";
    const { path, store } = createStore();
    const { run, sessions } = createRunFixture(store, {
      historyByAgent: {
        vanguard: [{ role: "user", content: marker }],
      },
    });
    const session = sessions[0]!;
    const inspector = openInspector(path);

    const initial = inspector
      .prepare(
        "SELECT context_ciphertext FROM sessions WHERE id = ? AND owner_id = ?",
      )
      .get(session.id, run.ownerId) as { context_ciphertext: string };
    expect(initial.context_ciphertext).not.toContain(marker);
    expect(store.getActiveSession(run.ownerId, run.id, session.agentId)?.history)
      .toEqual([{ role: "user", content: marker }]);

    const replacementMarker = "replacement-context-canary-never-at-rest";
    store.updateSessionContext(
      run.ownerId,
      session.id,
      [{ role: "system", content: replacementMarker }],
      17,
    );
    const replaced = inspector
      .prepare(
        "SELECT context_ciphertext FROM sessions WHERE id = ? AND owner_id = ?",
      )
      .get(session.id, run.ownerId) as { context_ciphertext: string };
    expect(replaced.context_ciphertext).not.toContain(replacementMarker);
    expect(replaced.context_ciphertext).not.toBe(initial.context_ciphertext);

    for (const candidate of [path, `${path}-wal`]) {
      if (existsSync(candidate)) {
        const bytes = readFileSync(candidate);
        expect(bytes.includes(Buffer.from(marker))).toBe(false);
        expect(bytes.includes(Buffer.from(replacementMarker))).toBe(false);
      }
    }
  });
});

describe("turn idempotency and active-turn locking", () => {
  it("replays the original turn for the same key and canonical request", () => {
    const { path, store } = createStore();
    const { run } = createRunFixture(store);
    const first = queuedTurn({
      id: "turn-first",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "same-request-key",
    });

    expect(store.createTurn(first)).toEqual({
      turn: first,
      replayed: false,
    });
    store.markTurnRunning(run.ownerId, first.id);
    const replay = store.createTurn({
      ...first,
      id: "turn-must-not-be-created",
      createdAt: "2026-07-23T12:02:00.000Z",
    });

    expect(replay.replayed).toBe(true);
    expect(replay.turn.id).toBe(first.id);
    expect(replay.turn.status).toBe("running");
    expect(store.getTurn(run.ownerId, "turn-must-not-be-created")).toBeNull();

    const inspector = openInspector(path);
    const persisted = inspector
      .prepare(
        "SELECT idempotency_key_hash FROM turns WHERE id = ? AND owner_id = ?",
      )
      .get(first.id, run.ownerId) as { idempotency_key_hash: string };
    expect(persisted.idempotency_key_hash).toBe(
      fingerprintSecret(first.idempotencyKey),
    );
    expect(persisted.idempotency_key_hash).not.toBe(first.idempotencyKey);
    for (const candidate of [path, `${path}-wal`]) {
      if (existsSync(candidate)) {
        expect(
          readFileSync(candidate).includes(Buffer.from(first.idempotencyKey)),
        ).toBe(false);
      }
    }
  });

  it("rejects same-key/different-request conflicts before replay", () => {
    const { store } = createStore();
    const { run } = createRunFixture(store);
    const first = queuedTurn({
      id: "turn-first",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "conflicting-key",
    });
    store.createTurn(first);
    const conflicting = queuedTurn({
      id: "turn-conflicting",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: first.idempotencyKey,
      request: turnRequest(2),
    });

    expectArenaError(() => store.createTurn(conflicting), {
      status: 409,
      code: "idempotency_conflict",
    });
  });

  it("allows only one queued/running turn per run and unlocks terminal turns", () => {
    const { store } = createStore();
    const { run } = createRunFixture(store);
    const first = queuedTurn({
      id: "turn-active",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "active-turn-key",
    });
    store.createTurn(first);

    expect(store.hasActiveTurn(run.ownerId, run.id)).toBe(true);
    expectArenaError(
      () =>
        store.createTurn(
          queuedTurn({
            id: "turn-blocked",
            runId: run.id,
            ownerId: run.ownerId,
            idempotencyKey: "different-turn-key",
          }),
        ),
      { status: 409, code: "run_busy" },
    );

    store.failTurn(run.ownerId, first.id, "test_terminal_failure");
    expect(store.hasActiveTurn(run.ownerId, run.id)).toBe(false);
    expect(
      store.createTurn(
        queuedTurn({
          id: "turn-after-terminal",
          runId: run.id,
          ownerId: run.ownerId,
          idempotencyKey: "after-terminal-key",
        }),
      ).replayed,
    ).toBe(false);
  });

  it("blocks compact, clear, and loadout mutation while a turn is active", async () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store);
    store.createTurn(
      queuedTurn({
        id: "turn-active",
        runId: run.id,
        ownerId: run.ownerId,
        idempotencyKey: "active-state-lock-key",
      }),
    );
    const registry = new ArenaRegistry(resolve(process.cwd(), "config"));
    const service = new ArenaService({
      store,
      registry,
      providers: [new MockProvider()],
    });
    const session = sessions[0]!;

    await expect(
      service.clear(
        run.ownerId,
        run.id,
        session.agentId,
        "clear-active-lock-key",
      ),
    ).rejects.toMatchObject({ status: 409, code: "run_busy" });
    await expect(
      service.compact(
        run.ownerId,
        run.id,
        session.agentId,
        "compact-active-lock-key",
      ),
    ).rejects.toMatchObject({ status: 409, code: "run_busy" });
    expectArenaError(
      () =>
        service.updateLoadout(
          run.ownerId,
          run.id,
          session.agentId,
          session.loadout,
        ),
      { status: 409, code: "run_busy" },
    );
  });

  it("blocks turns and same-agent mutations while compaction is active", async () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store);
    let signalStarted: (() => void) | undefined;
    let releaseCompaction: (() => void) | undefined;
    const started = new Promise<void>((resolveStarted) => {
      signalStarted = resolveStarted;
    });
    const blocked = new Promise<void>((resolveCompaction) => {
      releaseCompaction = resolveCompaction;
    });
    class DelayedCompactProvider extends MockProvider {
      override async compact(
        input: Parameters<MockProvider["compact"]>[0],
      ): ReturnType<MockProvider["compact"]> {
        signalStarted?.();
        await blocked;
        return super.compact(input);
      }
    }
    const service = new ArenaService({
      store,
      registry: new ArenaRegistry(resolve(process.cwd(), "config")),
      providers: [new DelayedCompactProvider()],
    });
    const priorTurn = queuedTurn({
      id: "turn-before-compact",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "turn-before-compact-key",
    });
    store.createTurn(priorTurn);
    store.markTurnRunning(run.ownerId, priorTurn.id);
    store.completeTurn(run.ownerId, priorTurn.id, [], []);
    const session = sessions[0]!;
    const compact = service.compact(
      run.ownerId,
      run.id,
      session.agentId,
      "delayed-compact-key",
    );
    await started;

    expect(
      service.createTurn(
        run.ownerId,
        run.id,
        turnRequest(),
        "turn-before-compact-key",
      ),
    ).toMatchObject({
      turnId: priorTurn.id,
      status: "completed",
      replayed: true,
    });
    expectArenaError(
      () =>
        service.createTurn(
          run.ownerId,
          run.id,
          turnRequest(2),
          "turn-before-compact-key",
        ),
      { status: 409, code: "idempotency_conflict" },
    );
    expectArenaError(
      () =>
        service.createTurn(
          run.ownerId,
          run.id,
          turnRequest(),
          "turn-during-compact-key",
        ),
      { status: 409, code: "run_busy" },
    );
    expectArenaError(
      () =>
        service.updateLoadout(
          run.ownerId,
          run.id,
          session.agentId,
          session.loadout,
        ),
      { status: 409, code: "run_busy" },
    );
    await expect(
      service.clear(
        run.ownerId,
        run.id,
        session.agentId,
        "clear-during-compact-key",
      ),
    ).rejects.toMatchObject({ status: 409, code: "run_busy" });

    releaseCompaction?.();
    await expect(compact).resolves.toMatchObject({
      compactionMode: "mock-native",
    });
  });

  it("does not repeat an indeterminate compact provider call for the same key", async () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store);
    let compactCalls = 0;
    class FailingCompactProvider extends MockProvider {
      override async compact(
        _input: Parameters<MockProvider["compact"]>[0],
      ): ReturnType<MockProvider["compact"]> {
        compactCalls += 1;
        throw new Error("synthetic compact transport failure");
      }
    }
    const service = new ArenaService({
      store,
      registry: new ArenaRegistry(resolve(process.cwd(), "config")),
      providers: [new FailingCompactProvider()],
    });
    const session = sessions[0]!;

    await expect(
      service.compact(
        run.ownerId,
        run.id,
        session.agentId,
        "failed-compact-key",
      ),
    ).rejects.toMatchObject({ status: 502, code: "compact_failed" });
    expect(compactCalls).toBe(1);

    await expect(
      service.compact(
        run.ownerId,
        run.id,
        session.agentId,
        "failed-compact-key",
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: "operation_outcome_unknown",
    });
    expect(compactCalls).toBe(1);
  });
});

describe("event persistence", () => {
  it("assigns gap-free sequences and replays strictly after a cursor", () => {
    const { store } = createStore();
    const { run } = createRunFixture(store);
    const turn = queuedTurn({
      id: "turn-events",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "event-sequence-key",
    });
    store.createTurn(turn);

    const queued = store.appendEvent(
      run.ownerId,
      turn.id,
      "turn.queued",
      { runId: run.id },
    );
    const started = store.appendEvent(
      run.ownerId,
      turn.id,
      "turn.started",
      { agentCount: 3 },
    );
    const completed = store.appendEvent(
      run.ownerId,
      turn.id,
      "turn.completed",
      { status: "completed" },
    );

    expect([queued.sequence, started.sequence, completed.sequence]).toEqual([
      1, 2, 3,
    ]);
    expect(
      store
        .getEvents(run.ownerId, turn.id, 1)
        .map((event) => [event.sequence, event.type]),
    ).toEqual([
      [2, "turn.started"],
      [3, "turn.completed"],
    ]);
    expect(store.getEvents(run.ownerId, turn.id, 3)).toEqual([]);
  });
});

describe("atomic turn lifecycle persistence", () => {
  it("creates the queued turn and event once, then replays without duplicating the event", () => {
    const { store } = createStore();
    const { run } = createRunFixture(store);
    const turn = queuedTurn({
      id: "turn-atomic-create",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "atomic-create-key",
    });

    const created = store.createTurnWithEvent(turn, { runId: run.id });
    const replayed = store.createTurnWithEvent(
      {
        ...turn,
        id: "turn-replay-must-not-exist",
        createdAt: "2026-07-23T12:02:00.000Z",
      },
      circularSafeData(),
    );

    expect(created).toMatchObject({
      turn: { id: turn.id, status: "queued" },
      replayed: false,
      event: {
        turnId: turn.id,
        sequence: 1,
        type: "turn.queued",
        safeData: { runId: run.id },
        createdAt: turn.createdAt,
      },
    });
    expect(replayed).toMatchObject({
      turn: { id: turn.id, status: "queued" },
      replayed: true,
      event: null,
    });
    expect(
      store.getTurn(run.ownerId, "turn-replay-must-not-exist"),
    ).toBeNull();
    expect(store.getEvents(run.ownerId, turn.id, 0)).toHaveLength(1);
  });

  it("rolls back turn creation when its queued event cannot be serialized", () => {
    const { path, store } = createStore();
    const { run } = createRunFixture(store);
    const turn = queuedTurn({
      id: "turn-create-rollback",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "atomic-create-rollback-key",
    });

    expect(() =>
      store.createTurnWithEvent(turn, circularSafeData()),
    ).toThrow();
    expect(store.getTurn(run.ownerId, turn.id)).toBeNull();
    expect(store.hasActiveTurn(run.ownerId, run.id)).toBe(false);

    const inspector = openInspector(path);
    expect(
      inspector.prepare("SELECT COUNT(*) AS count FROM turns").get(),
    ).toEqual({ count: 0 });
    expect(
      inspector.prepare("SELECT COUNT(*) AS count FROM events").get(),
    ).toEqual({ count: 0 });
  });

  it("rolls back running and completion state when either lifecycle event cannot persist", () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store, {
      historyByAgent: {
        vanguard: [{ role: "user", content: "original context" }],
      },
    });
    const turn = queuedTurn({
      id: "turn-transition-rollback",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "atomic-transition-rollback-key",
    });
    store.createTurnWithEvent(turn, { runId: run.id });

    expect(() =>
      store.markTurnRunningWithEvent(
        run.ownerId,
        turn.id,
        circularSafeData(),
      ),
    ).toThrow();
    expect(store.getTurn(run.ownerId, turn.id)).toMatchObject({
      status: "queued",
    });
    expect(store.getEvents(run.ownerId, turn.id, 0)).toHaveLength(1);

    const started = store.markTurnRunningWithEvent(
      run.ownerId,
      turn.id,
      { agentCount: 3 },
    );
    expect(started).toMatchObject({
      turn: { status: "running" },
      event: {
        sequence: 2,
        type: "turn.started",
        safeData: { agentCount: 3 },
      },
    });

    const session = sessions[0]!;
    const results = [agentResult(session.agentId, session.id, false)];
    const updates = [
      {
        sessionId: session.id,
        history: [{ role: "assistant", content: "new context" }],
        estimatedActiveTokens: 23,
        lastMeasuredInputTokens: 17,
      },
    ];
    expect(() =>
      store.completeTurnWithEvent(
        run.ownerId,
        turn.id,
        results,
        updates,
        circularSafeData(),
      ),
    ).toThrow();
    expect(store.getTurn(run.ownerId, turn.id)).toMatchObject({
      status: "running",
      results: [],
    });
    expect(
      store.getActiveSession(run.ownerId, run.id, session.agentId),
    ).toMatchObject({
      history: [{ role: "user", content: "original context" }],
      estimatedActiveTokens: 0,
      lastMeasuredInputTokens: null,
    });
    expect(store.getEvents(run.ownerId, turn.id, 0)).toHaveLength(2);

    const completed = store.completeTurnWithEvent(
      run.ownerId,
      turn.id,
      results,
      updates,
      { status: "completed", fallbackCount: 0 },
    );
    expect(completed).toMatchObject({
      turn: { status: "completed", results },
      event: {
        sequence: 3,
        type: "turn.completed",
        safeData: { status: "completed", fallbackCount: 0 },
      },
    });
    expect(
      store.getActiveSession(run.ownerId, run.id, session.agentId),
    ).toMatchObject({
      history: [{ role: "assistant", content: "new context" }],
      estimatedActiveTokens: 23,
      lastMeasuredInputTokens: 17,
    });
  });

  it("rolls back a failed transition when its event cannot persist", () => {
    const { store } = createStore();
    const { run } = createRunFixture(store);
    const turn = queuedTurn({
      id: "turn-failure-rollback",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "atomic-failure-rollback-key",
    });
    store.createTurnWithEvent(turn, { runId: run.id });
    store.markTurnRunningWithEvent(run.ownerId, turn.id, {
      agentCount: 3,
    });

    expect(() =>
      store.failTurnWithEvent(
        run.ownerId,
        turn.id,
        "provider_timeout",
        circularSafeData(),
      ),
    ).toThrow();
    expect(store.getTurn(run.ownerId, turn.id)).toMatchObject({
      status: "running",
    });
    expect(store.getEvents(run.ownerId, turn.id, 0)).toHaveLength(2);

    const failed = store.failTurnWithEvent(
      run.ownerId,
      turn.id,
      "provider_timeout",
      { reason: "provider_timeout" },
    );
    expect(failed).toMatchObject({
      turn: {
        status: "failed",
        failureReason: "provider_timeout",
      },
      event: {
        sequence: 3,
        type: "turn.failed",
        safeData: { reason: "provider_timeout" },
      },
    });
  });
});

describe("restart recovery", () => {
  it("fails interrupted turns durably and appends one terminal event", () => {
    const fixture = createStore();
    const { run } = createRunFixture(fixture.store);
    const turn = queuedTurn({
      id: "turn-interrupted",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "interrupted-turn-key",
    });
    fixture.store.createTurn(turn);
    fixture.store.appendEvent(run.ownerId, turn.id, "turn.queued", {
      runId: run.id,
    });
    fixture.store.markTurnRunning(run.ownerId, turn.id);
    fixture.store.close();
    stores.splice(stores.indexOf(fixture.store), 1);

    const reopened = new ArenaStore(
      fixture.path,
      new ContextCipher(CONTEXT_KEY),
    );
    stores.push(reopened);

    expect(reopened.recoverInterruptedTurns("server_restarted")).toBe(1);
    expect(reopened.getTurn(run.ownerId, turn.id)).toMatchObject({
      status: "failed",
      failureReason: "server_restarted",
    });
    expect(reopened.hasActiveTurn(run.ownerId, run.id)).toBe(false);
    expect(
      reopened
        .getEvents(run.ownerId, turn.id, 0)
        .map(({ sequence, type, safeData }) => ({
          sequence,
          type,
          safeData,
        })),
    ).toEqual([
      {
        sequence: 1,
        type: "turn.queued",
        safeData: { runId: run.id },
      },
      {
        sequence: 2,
        type: "turn.failed",
        safeData: { reason: "server_restarted" },
      },
    ]);
    expect(reopened.recoverInterruptedTurns("server_restarted")).toBe(0);
  });

  it("restores a missing completed event with a gap-free canonical receipt", () => {
    const fixture = createStore();
    const { run, sessions } = createRunFixture(fixture.store);
    const turn = queuedTurn({
      id: "turn-completed-without-event",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "completed-without-event-key",
    });
    fixture.store.createTurn(turn);
    fixture.store.appendEvent(run.ownerId, turn.id, "turn.queued", {
      runId: run.id,
    });
    fixture.store.appendEvent(run.ownerId, turn.id, "turn.started", {
      agentCount: 3,
    });
    fixture.store.markTurnRunning(run.ownerId, turn.id);
    fixture.store.completeTurn(
      run.ownerId,
      turn.id,
      sessions.map((session, index) =>
        agentResult(session.agentId, session.id, index !== 1),
      ),
      [],
    );
    fixture.store.close();
    stores.splice(stores.indexOf(fixture.store), 1);

    const reopened = new ArenaStore(
      fixture.path,
      new ContextCipher(CONTEXT_KEY),
    );
    stores.push(reopened);
    expect(reopened.recoverMissingTerminalEvents()).toBe(1);
    expect(
      reopened
        .getEvents(run.ownerId, turn.id, 0)
        .map(({ sequence, type, safeData }) => ({
          sequence,
          type,
          safeData,
        })),
    ).toEqual([
      {
        sequence: 1,
        type: "turn.queued",
        safeData: { runId: run.id },
      },
      {
        sequence: 2,
        type: "turn.started",
        safeData: { agentCount: 3 },
      },
      {
        sequence: 3,
        type: "turn.completed",
        safeData: { status: "completed", fallbackCount: 2 },
      },
    ]);
    expect(reopened.recoverMissingTerminalEvents()).toBe(0);
  });

  it("restores only missing failed events and sanitizes their reason", () => {
    const fixture = createStore();
    const { run } = createRunFixture(fixture.store);
    const missing = queuedTurn({
      id: "turn-failed-without-event",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "failed-without-event-key",
    });
    fixture.store.createTurn(missing);
    fixture.store.appendEvent(run.ownerId, missing.id, "turn.queued", {
      runId: run.id,
    });
    fixture.store.failTurn(
      run.ownerId,
      missing.id,
      "unsafe reason with /private/path",
    );

    const existing = queuedTurn({
      id: "turn-failed-with-event",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "failed-with-event-key",
      request: turnRequest(2),
    });
    fixture.store.createTurn(existing);
    fixture.store.failTurn(run.ownerId, existing.id, "provider_timeout");
    fixture.store.appendEvent(run.ownerId, existing.id, "turn.failed", {
      reason: "provider_timeout",
    });
    fixture.store.close();
    stores.splice(stores.indexOf(fixture.store), 1);

    const reopened = new ArenaStore(
      fixture.path,
      new ContextCipher(CONTEXT_KEY),
    );
    stores.push(reopened);
    expect(reopened.recoverMissingTerminalEvents()).toBe(1);
    expect(
      reopened.getEvents(run.ownerId, missing.id, 0).at(-1),
    ).toMatchObject({
      sequence: 2,
      type: "turn.failed",
      safeData: { reason: "turn_execution_failed" },
    });
    expect(
      reopened
        .getEvents(run.ownerId, existing.id, 0)
        .filter(({ type }) => type === "turn.failed"),
    ).toHaveLength(1);
    expect(reopened.recoverMissingTerminalEvents()).toBe(0);
  });
});

describe("durable idempotent operations", () => {
  it("looks up a turn by its owner, run, and unhashed idempotency key", () => {
    const { store } = createStore();
    const { run } = createRunFixture(store);
    const turn = queuedTurn({
      id: "turn-lookup",
      runId: run.id,
      ownerId: run.ownerId,
      idempotencyKey: "turn-lookup-key",
    });
    store.createTurn(turn);

    expect(
      store.getTurnByIdempotencyKey(
        run.ownerId,
        run.id,
        turn.idempotencyKey,
      ),
    ).toMatchObject({
      turn: {
        id: turn.id,
        runId: turn.runId,
        ownerId: turn.ownerId,
        idempotencyKey: fingerprintSecret(turn.idempotencyKey),
      },
      requestHash: turn.requestHash,
    });
    expect(
      store.getTurnByIdempotencyKey(
        "owner-b",
        run.id,
        turn.idempotencyKey,
      ),
    ).toBeNull();
  });

  it("claims operations durably and recovers interrupted claims as indeterminate", () => {
    const fixture = createStore();
    const scope = "compact:run-a:vanguard";
    const key = "durable-compact-key";
    const requestHash = hashRequest({ operation: "compact", runId: "run-a" });

    expect(
      fixture.store.claimIdempotentOperation(
        "owner-a",
        scope,
        key,
        requestHash,
      ),
    ).toEqual({
      claimed: true,
      operation: {
        requestHash,
        status: "in_progress",
        response: {},
      },
    });
    expect(
      fixture.store.claimIdempotentOperation(
        "owner-a",
        scope,
        key,
        requestHash,
      ),
    ).toMatchObject({
      claimed: false,
      operation: { status: "in_progress" },
    });
    expectArenaError(
      () =>
        fixture.store.claimIdempotentOperation(
          "owner-a",
          scope,
          key,
          hashRequest({ operation: "different" }),
        ),
      { status: 409, code: "idempotency_conflict" },
    );

    fixture.store.close();
    stores.splice(stores.indexOf(fixture.store), 1);
    const reopened = new ArenaStore(
      fixture.path,
      new ContextCipher(CONTEXT_KEY),
    );
    stores.push(reopened);

    expect(reopened.recoverInterruptedOperations()).toBe(1);
    expect(reopened.recoverInterruptedOperations()).toBe(0);
    expect(
      reopened.claimIdempotentOperation(
        "owner-a",
        scope,
        key,
        requestHash,
      ),
    ).toEqual({
      claimed: false,
      operation: {
        requestHash,
        status: "indeterminate",
        response: {},
      },
    });
  });

  it("marks only the targeted in-progress operation indeterminate", () => {
    const { store } = createStore();
    const firstHash = hashRequest({ operation: "first" });
    const secondHash = hashRequest({ operation: "second" });
    store.claimIdempotentOperation(
      "owner-a",
      "compact:run-a:vanguard",
      "targeted-first-key",
      firstHash,
    );
    store.claimIdempotentOperation(
      "owner-a",
      "compact:run-a:guardian",
      "targeted-second-key",
      secondHash,
    );

    store.markIdempotentOperationIndeterminate(
      "owner-a",
      "compact:run-a:vanguard",
      "targeted-first-key",
      firstHash,
    );

    expect(
      store.getIdempotentOperation(
        "owner-a",
        "compact:run-a:vanguard",
        "targeted-first-key",
      )?.status,
    ).toBe("indeterminate");
    expect(
      store.getIdempotentOperation(
        "owner-a",
        "compact:run-a:guardian",
        "targeted-second-key",
      )?.status,
    ).toBe("in_progress");
  });

  it("migrates legacy operation receipts to completed status", () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-arena-legacy-test-"));
    const path = join(directory, "arena.sqlite");
    temporaryDirectories.push(directory);
    const legacy = new DatabaseSync(path);
    legacy.exec(`
      CREATE TABLE idempotent_operations (
        owner_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        idempotency_key_hash TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        response_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY(owner_id, scope, idempotency_key_hash)
      )
    `);
    const requestHash = hashRequest({ operation: "legacy" });
    legacy
      .prepare(
        `INSERT INTO idempotent_operations
         (owner_id, scope, idempotency_key_hash, request_hash,
          response_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "owner-a",
        "legacy-scope",
        fingerprintSecret("legacy-operation-key"),
        requestHash,
        JSON.stringify({ receipt: "legacy" }),
        "2026-07-23T12:00:00.000Z",
      );
    legacy.close();

    const store = new ArenaStore(path, new ContextCipher(CONTEXT_KEY));
    stores.push(store);
    expect(
      store.getIdempotentOperation(
        "owner-a",
        "legacy-scope",
        "legacy-operation-key",
      ),
    ).toEqual({
      requestHash,
      status: "completed",
      response: { receipt: "legacy" },
    });
  });
});

describe("compact and clear context state", () => {
  it("commits compacted context and its receipt in one transaction", () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store, {
      historyByAgent: {
        vanguard: [{ role: "user", content: "old context" }],
      },
    });
    const session = sessions[0]!;
    const scope = `compact:${run.id}:${session.agentId}`;
    const key = "atomic-compact-key";
    const requestHash = hashRequest({
      runId: run.id,
      agentId: session.agentId,
      operation: "compact",
    });
    const response = {
      runId: run.id,
      agentId: session.agentId,
      arenaSessionId: session.id,
      generation: session.generation,
      compactionMode: "test-native",
    };
    store.claimIdempotentOperation(
      run.ownerId,
      scope,
      key,
      requestHash,
    );

    expect(
      store.completeCompactOperation(
        run.ownerId,
        scope,
        key,
        requestHash,
        session.id,
        [{ role: "system", content: "compacted context" }],
        23,
        response,
      ),
    ).toMatchObject({
      session: {
        id: session.id,
        history: [{ role: "system", content: "compacted context" }],
        estimatedActiveTokens: 23,
        lastMeasuredInputTokens: null,
      },
      response,
      replayed: false,
    });
    expect(
      store.getIdempotentOperation(run.ownerId, scope, key),
    ).toEqual({
      requestHash,
      status: "completed",
      response,
    });

    expect(
      store.completeCompactOperation(
        run.ownerId,
        scope,
        key,
        requestHash,
        session.id,
        [{ role: "system", content: "must not replace receipt state" }],
        999,
        { receipt: "must not replace" },
      ),
    ).toMatchObject({ response, replayed: true });
    expect(
      store.getActiveSession(run.ownerId, run.id, session.agentId),
    ).toMatchObject({
      history: [{ role: "system", content: "compacted context" }],
      estimatedActiveTokens: 23,
    });
  });

  it("rolls back compact session state when receipt completion cannot commit", () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store, {
      historyByAgent: {
        vanguard: [{ role: "user", content: "original context" }],
      },
    });
    const session = sessions[0]!;
    const scope = `compact:${run.id}:${session.agentId}`;
    const key = "compact-rollback-key";
    const requestHash = hashRequest({ operation: "compact-rollback" });
    store.claimIdempotentOperation(
      run.ownerId,
      scope,
      key,
      requestHash,
    );
    const unserializableResponse: Record<string, unknown> = {};
    unserializableResponse.self = unserializableResponse;

    expect(() =>
      store.completeCompactOperation(
        run.ownerId,
        scope,
        key,
        requestHash,
        session.id,
        [{ role: "system", content: "must roll back" }],
        999,
        unserializableResponse,
      ),
    ).toThrow();
    expect(
      store.getActiveSession(run.ownerId, run.id, session.agentId),
    ).toMatchObject({
      history: [{ role: "user", content: "original context" }],
      estimatedActiveTokens: 0,
    });
    expect(
      store.getIdempotentOperation(run.ownerId, scope, key)?.status,
    ).toBe("in_progress");
  });

  it("clears a generation and persists its replay receipt atomically", () => {
    const { path, store } = createStore();
    const { run, sessions } = createRunFixture(store, {
      historyByAgent: {
        vanguard: [{ role: "user", content: "old active context" }],
      },
    });
    const current = sessions[0]!;
    const scope = `clear:${run.id}:${current.agentId}`;
    const key = "atomic-clear-key";
    const requestHash = hashRequest({
      runId: run.id,
      agentId: current.agentId,
      operation: "clear",
    });
    let responseFactoryCalls = 0;
    const responseForSession = (session: AgentSession) => {
      responseFactoryCalls += 1;
      return {
        runId: run.id,
        agentId: current.agentId,
        arenaSessionId: session.id,
        generation: session.generation,
      };
    };

    const first = store.clearSessionIdempotently(
      run.ownerId,
      run.id,
      current.agentId,
      scope,
      key,
      requestHash,
      responseForSession,
    );
    const replay = store.clearSessionIdempotently(
      run.ownerId,
      run.id,
      current.agentId,
      scope,
      key,
      requestHash,
      responseForSession,
    );

    expect(first).toMatchObject({
      session: { generation: 2, history: [] },
      response: {
        arenaSessionId: first.session.id,
        generation: 2,
      },
      replayed: false,
    });
    expect(replay).toMatchObject({
      session: { id: first.session.id, generation: 2 },
      response: first.response,
      replayed: true,
    });
    expect(responseFactoryCalls).toBe(1);
    const inspector = openInspector(path);
    const generations = inspector
      .prepare(
        `SELECT generation, status FROM sessions
         WHERE run_id = ? AND owner_id = ? AND agent_id = ?
         ORDER BY generation`,
      )
      .all(run.id, run.ownerId, current.agentId);
    expect(generations).toEqual([
      { generation: 1, status: "cleared" },
      { generation: 2, status: "active" },
    ]);
  });

  it("rolls back a clear if its completed receipt cannot be produced", () => {
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store);
    const current = sessions[0]!;
    const scope = `clear:${run.id}:${current.agentId}`;
    const key = "clear-rollback-key";
    const requestHash = hashRequest({ operation: "clear-rollback" });

    expect(() =>
      store.clearSessionIdempotently(
        run.ownerId,
        run.id,
        current.agentId,
        scope,
        key,
        requestHash,
        () => {
          throw new Error("receipt serialization failed");
        },
      ),
    ).toThrow("receipt serialization failed");
    expect(
      store.getActiveSession(run.ownerId, run.id, current.agentId),
    ).toMatchObject({ id: current.id, generation: 1, status: "active" });
    expect(
      store.getIdempotentOperation(run.ownerId, scope, key),
    ).toBeNull();
  });

  it("atomically replaces the active context with the provider compact result", async () => {
    const oldMarker = "old-context-must-not-remain-active";
    const { store } = createStore();
    const { run, sessions } = createRunFixture(store, {
      historyByAgent: {
        vanguard: [
          { role: "user", content: oldMarker },
          { role: "assistant", content: "prior answer" },
          { role: "user", content: "next question" },
        ],
      },
    });
    const registry = new ArenaRegistry(resolve(process.cwd(), "config"));
    const service = new ArenaService({
      store,
      registry,
      providers: [new MockProvider()],
    });
    const session = sessions[0]!;

    const result = await service.compact(
      run.ownerId,
      run.id,
      session.agentId,
      "compact-context-key",
    );
    const updated = store.getActiveSession(
      run.ownerId,
      run.id,
      session.agentId,
    );

    expect(result).toMatchObject({
      runId: run.id,
      agentId: session.agentId,
      arenaSessionId: session.id,
      generation: 1,
      compactionMode: "mock-native",
    });
    expect(updated?.history).toEqual([
      {
        role: "system",
        content: "Compacted 3 prior mock context items.",
      },
    ]);
    expect(JSON.stringify(updated?.history)).not.toContain(oldMarker);
    expect(updated?.estimatedActiveTokens).toBe(16);
    expect(updated?.lastMeasuredInputTokens).toBeNull();
  });

  it("clears only the target agent into one new active generation", () => {
    const { path, store } = createStore();
    const { run, sessions } = createRunFixture(store, {
      historyByAgent: {
        vanguard: [{ role: "user", content: "old active context" }],
        guardian: [{ role: "user", content: "must remain untouched" }],
      },
    });
    const current = sessions[0]!;
    const untouched = sessions[1]!;

    const next = store.clearSession(
      run.ownerId,
      run.id,
      current.agentId,
    );

    expect(next.id).not.toBe(current.id);
    expect(next.generation).toBe(current.generation + 1);
    expect(next.status).toBe("active");
    expect(next.history).toEqual([]);
    expect(next.estimatedActiveTokens).toBe(0);
    expect(next.lastMeasuredInputTokens).toBeNull();
    expect(next.loadout).toEqual(current.loadout);
    expect(
      store.getActiveSession(run.ownerId, run.id, current.agentId)?.id,
    ).toBe(next.id);
    expect(
      store.getActiveSession(run.ownerId, run.id, untouched.agentId)?.id,
    ).toBe(untouched.id);
    expect(store.getActiveSessions(run.ownerId, run.id)).toHaveLength(3);

    const inspector = openInspector(path);
    const generations = inspector
      .prepare(
        `SELECT id, generation, status
         FROM sessions
         WHERE run_id = ? AND owner_id = ? AND agent_id = ?
         ORDER BY generation`,
      )
      .all(run.id, run.ownerId, current.agentId) as unknown as Array<{
      id: string;
      generation: number;
      status: string;
    }>;
    expect(generations).toEqual([
      { id: current.id, generation: 1, status: "cleared" },
      { id: next.id, generation: 2, status: "active" },
    ]);
  });
});
