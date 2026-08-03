import { afterEach, describe, expect, it } from "vitest";

import { ArenaError } from "../src/errors.js";
import { MockProvider } from "../src/providers/mock-provider.js";
import { fingerprintSecret } from "../src/security.js";
import {
  apiRequest,
  createRun,
  createTestApplication,
  runRequest,
  turnRequest,
  waitForTurn,
  type TestApplication,
} from "./helpers.js";

describe("Agent Arena HTTP vertical slice", () => {
  let app: TestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("runs three agents in parallel and preserves isolated context", async () => {
    const starts = new Map<string, number>();
    app = await createTestApplication({
      delayMs: 80,
      onStart: (agentId, startedAt) => starts.set(agentId, startedAt),
    });
    const run = await createRun(app);

    const firstResponse = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "turn-one-key",
    });
    expect(firstResponse.status).toBe(202);
    const firstAccepted = (await firstResponse.json()) as {
      turnId: string;
      eventsUrl: string;
    };
    const first = await waitForTurn(app, firstAccepted.turnId);
    expect(first.status).toBe("completed");
    expect(first.results.map((result) => result.agentId)).toEqual([
      "guardian",
      "solver",
      "scout",
    ]);
    expect(first.results.every((result) => !result.fallbackUsed)).toBe(true);
    expect(starts.size).toBe(3);
    const startValues = [...starts.values()];
    expect(Math.max(...startValues) - Math.min(...startValues)).toBeLessThan(40);
    expect(first.results[1]?.toolTrace.length).toBeGreaterThan(0);
    expect(first.results[2]?.toolTrace.length).toBeGreaterThan(0);

    const streamResponse = await apiRequest(app, firstAccepted.eventsUrl);
    expect(streamResponse.status).toBe(200);
    expect(streamResponse.headers.get("content-type")).toContain(
      "text/event-stream",
    );
    const stream = await streamResponse.text();
    expect(stream).toContain("event: turn.started");
    expect(stream).toContain("event: turn.completed");
    expect(stream).not.toContain("authorization");

    const replayResponse = await apiRequest(app, firstAccepted.eventsUrl, {
      headers: { "Last-Event-ID": "1" },
    });
    expect(replayResponse.status).toBe(200);
    const replayStream = await replayResponse.text();
    const replayedIds = [...replayStream.matchAll(/^id: (\d+)$/gm)].map(
      (match) => Number(match[1]),
    );
    expect(replayedIds.length).toBeGreaterThan(0);
    expect(replayedIds.every((id) => id > 1)).toBe(true);
    expect(replayStream).toContain("event: turn.completed");

    const secondResponse = await apiRequest(
      app,
      `/v1/runs/${run.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(2),
        idempotencyKey: "turn-two-key",
      },
    );
    const secondAccepted = (await secondResponse.json()) as { turnId: string };
    const second = await waitForTurn(app, secondAccepted.turnId);
    expect(
      second.results.every((result) =>
        result.decision.reasonSummary.includes("1 prior turn"),
      ),
    ).toBe(true);
  });

  it("supports compact, clear, and a fresh agent context generation", async () => {
    app = await createTestApplication();
    const run = await createRun(app);
    const turnResponse = await apiRequest(
      app,
      `/v1/runs/${run.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(1),
        idempotencyKey: "compact-seed-turn",
      },
    );
    const accepted = (await turnResponse.json()) as { turnId: string };
    await waitForTurn(app, accepted.turnId);

    const compact = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/compact`,
      {
        method: "POST",
        idempotencyKey: "compact-guardian-key",
      },
    );
    expect(compact.status).toBe(200);
    expect(await compact.json()).toMatchObject({
      agentId: "guardian",
      compactionMode: "mock-native",
      context: { compactedThisTurn: true },
      replayed: false,
    });

    const original = run.agents.find(
      (agent) => agent.agentId === "guardian",
    )!;
    const compactReplay = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/compact`,
      {
        method: "POST",
        body: {},
        idempotencyKey: "compact-guardian-key",
      },
    );
    expect(await compactReplay.json()).toMatchObject({
      arenaSessionId: original.arenaSessionId,
      compactionMode: "mock-native",
      replayed: true,
    });

    const postCompactResponse = await apiRequest(
      app,
      `/v1/runs/${run.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(2),
        idempotencyKey: "post-compact-turn",
      },
    );
    const postCompactAccepted = (await postCompactResponse.json()) as {
      turnId: string;
    };
    const postCompact = await waitForTurn(app, postCompactAccepted.turnId);
    expect(
      postCompact.results.find((result) => result.agentId === "guardian")
        ?.decision.reasonSummary,
    ).toContain("compacted context");

    const clear = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/clear`,
      {
        method: "POST",
        idempotencyKey: "clear-guardian-key",
      },
    );
    expect(clear.status).toBe(200);
    const cleared = (await clear.json()) as {
      arenaSessionId: string;
      generation: number;
    };
    expect(cleared.arenaSessionId).not.toBe(original.arenaSessionId);
    expect(cleared.generation).toBe(2);

    const clearReplay = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/clear`,
      {
        method: "POST",
        body: {},
        idempotencyKey: "clear-guardian-key",
      },
    );
    expect(await clearReplay.json()).toMatchObject({
      arenaSessionId: cleared.arenaSessionId,
      generation: 2,
      replayed: true,
    });

    const nextResponse = await apiRequest(
      app,
      `/v1/runs/${run.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(3),
        idempotencyKey: "post-clear-turn",
      },
    );
    const nextAccepted = (await nextResponse.json()) as { turnId: string };
    const next = await waitForTurn(app, nextAccepted.turnId);
    const guardian = next.results.find(
      (result) => result.agentId === "guardian",
    )!;
    const solver = next.results.find((result) => result.agentId === "solver")!;
    expect(guardian.arenaSessionId).toBe(cleared.arenaSessionId);
    expect(guardian.decision.reasonSummary).toContain("0 prior turn");
    expect(solver.decision.reasonSummary).toContain("2 prior turn");
  });

  it("enforces owner isolation and turn idempotency", async () => {
    app = await createTestApplication({ delayMs: 40 });
    const run = await createRun(app);

    const runReplay = await apiRequest(app, "/v1/runs", {
      method: "POST",
      body: runRequest,
      idempotencyKey: "create-run-key",
    });
    expect(runReplay.status).toBe(201);
    expect(await runReplay.json()).toMatchObject({
      runId: run.runId,
      replayed: true,
    });

    const conflictingRun = await apiRequest(app, "/v1/runs", {
      method: "POST",
      body: {
        ...runRequest,
        party: runRequest.party.map((member, index) =>
          index === 0
            ? { ...member, promptCardIds: ["answer-briefly-v1"] }
            : member,
        ),
      },
      idempotencyKey: "create-run-key",
    });
    expect(conflictingRun.status).toBe(409);
    expect(await conflictingRun.json()).toMatchObject({
      error: { code: "idempotency_conflict" },
    });

    const first = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "same-turn-request",
    });
    const firstBody = (await first.json()) as { turnId: string };

    const replay = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "same-turn-request",
    });
    expect(replay.status).toBe(202);
    expect(await replay.json()).toMatchObject({
      turnId: firstBody.turnId,
      replayed: true,
    });

    const conflict = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(2),
      idempotencyKey: "same-turn-request",
    });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: { code: "idempotency_conflict" },
    });

    const foreign = await apiRequest(app, `/v1/turns/${firstBody.turnId}`, {
      key: "other-owner-key",
    });
    expect(foreign.status).toBe(404);
    await waitForTurn(app, firstBody.turnId);
  });

  it("applies deterministic fallback without failing the whole turn", async () => {
    app = await createTestApplication({
      faults: new Map([
        ["guardian", "timeout"],
        ["solver", "invalid"],
        ["scout", "tool-error"],
      ]),
    });
    const run = await createRun(app);
    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "fallback-turn",
    });
    const accepted = (await response.json()) as { turnId: string };
    const turn = await waitForTurn(app, accepted.turnId);
    expect(turn.status).toBe("completed");
    expect(
      turn.results.find((result) => result.agentId === "guardian"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "provider_timeout",
      decision: { actionId: "wait" },
    });
    expect(
      turn.results.find((result) => result.agentId === "solver"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "invalid_model_output",
      decision: { actionId: "wait" },
    });
    expect(
      turn.results.find((result) => result.agentId === "scout"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "tool_failed",
      decision: { actionId: "wait" },
    });
    expect(
      turn.results.find((result) => result.agentId === "scout")?.toolTrace,
    ).toEqual([
      expect.objectContaining({
        type: "mcp",
        status: "failed",
      }),
    ]);
  });

  it("enforces the context hard limit before spending a provider request", async () => {
    const startedAgents = new Set<string>();
    app = await createTestApplication({
      onStart: (agentId) => startedAgents.add(agentId),
    });
    const run = await createRun(app);
    const ownerId = fingerprintSecret("test-owner-key");
    const solver = app.store.getActiveSession(ownerId, run.runId, "solver");
    expect(solver).not.toBeNull();
    app.store.updateSessionContext(
      ownerId,
      solver!.id,
      [{ role: "system", content: "large-context-placeholder" }],
      3_599,
    );

    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "context-hard-limit-turn",
    });
    const accepted = (await response.json()) as {
      turnId: string;
      eventsUrl: string;
    };
    const turn = await waitForTurn(app, accepted.turnId);
    expect(
      turn.results.find((result) => result.agentId === "solver"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "context_hard_limit",
    });
    expect(startedAgents.has("solver")).toBe(false);
    expect(startedAgents).toEqual(new Set(["guardian", "scout"]));

    const stream = await (
      await apiRequest(app, accepted.eventsUrl)
    ).text();
    expect(stream).toContain("event: agent.context.warning");
    expect(stream).toContain('"hardLimitTokens":3600');
  });

  it("uses a conservative preflight bound for large non-ASCII input", async () => {
    const startedAgents = new Set<string>();
    app = await createTestApplication({
      onStart: (agentId) => startedAgents.add(agentId),
    });
    const run = await createRun(app);
    const oversized = turnRequest(1);
    oversized.event.summary = "가".repeat(2_000);

    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: oversized,
      idempotencyKey: "non-ascii-context-limit-turn",
    });
    const accepted = (await response.json()) as { turnId: string };
    const turn = await waitForTurn(app, accepted.turnId);

    expect(startedAgents.size).toBe(0);
    expect(turn.results).toHaveLength(3);
    expect(
      turn.results.every(
        (result) =>
          result.fallbackUsed &&
          result.fallbackReason === "context_hard_limit",
      ),
    ).toBe(true);
  });

  it("does not expose raw output deltas or server-owned provider resources", async () => {
    class RuntimeLeakProvider extends MockProvider {
      override async runTurn(
        input: Parameters<MockProvider["runTurn"]>[0],
      ): ReturnType<MockProvider["runTurn"]> {
        const result = await super.runTurn(input);
        if (input.agentId !== "scout") {
          return result;
        }
        const canary = input.loadout.mcpTools[0]!.serverUrl;
        await input.onEvent({
          type: "output.delta",
          safeData: { delta: `provider leaked ${canary}` },
        });
        return {
          ...result,
          rawDecision: {
            ...(result.rawDecision as Record<string, unknown>),
            speech: `provider leaked ${canary}`,
          },
        };
      }
    }
    app = await createTestApplication({}, {}, new RuntimeLeakProvider());
    const run = await createRun(app);
    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "runtime-resource-leak-turn",
    });
    const accepted = (await response.json()) as {
      turnId: string;
      eventsUrl: string;
    };
    const turn = await waitForTurn(app, accepted.turnId);
    expect(
      turn.results.find((result) => result.agentId === "scout"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "sensitive_provider_output",
    });

    const resultText = JSON.stringify(turn);
    const streamText = await (
      await apiRequest(app, accepted.eventsUrl)
    ).text();
    expect(resultText).not.toContain("mock://read-only-mcp");
    expect(streamText).not.toContain("mock://read-only-mcp");
    expect(streamText).not.toContain("provider leaked");
    expect(streamText).toContain('"characters":');
  });

  it("contains an upstream provider failure to the affected agent", async () => {
    app = await createTestApplication({
      faults: new Map([["guardian", "provider-error"]]),
    });
    const run = await createRun(app);
    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "provider-failure-turn",
    });
    const accepted = (await response.json()) as { turnId: string };
    const turn = await waitForTurn(app, accepted.turnId);

    expect(turn.status).toBe("completed");
    expect(
      turn.results.find((result) => result.agentId === "guardian"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "provider_unavailable",
      decision: { actionId: "wait" },
    });
    expect(
      turn.results
        .filter((result) => result.agentId !== "guardian")
        .every((result) => !result.fallbackUsed),
    ).toBe(true);
  });

  it("retains measured usage and failed tool telemetry after provider failure", async () => {
    class MeasuredFailureProvider extends MockProvider {
      override async runTurn(
        input: Parameters<MockProvider["runTurn"]>[0],
      ): ReturnType<MockProvider["runTurn"]> {
        if (input.agentId !== "guardian") {
          return super.runTurn(input);
        }
        await input.onEvent({
          type: "tool.started",
          safeData: { type: "function", name: "arena_risk_check" },
        });
        await input.onEvent({
          type: "tool.failed",
          safeData: { type: "function", name: "arena_risk_check" },
        });
        await input.onEvent({
          type: "usage.final",
          safeData: {
            inputTokens: 17,
            cachedInputTokens: 3,
            outputTokens: 2,
            reasoningTokens: 0,
            totalTokens: 19,
            source: "provider_measured",
          },
        });
        throw new ArenaError(
          502,
          "provider_incomplete",
          "Synthetic measured provider failure.",
        );
      }
    }
    app = await createTestApplication({}, {}, new MeasuredFailureProvider());
    const run = await createRun(app);
    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "measured-provider-failure-turn",
    });
    const accepted = (await response.json()) as { turnId: string };
    const turn = await waitForTurn(app, accepted.turnId);
    expect(
      turn.results.find((result) => result.agentId === "guardian"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "provider_incomplete",
      usage: {
        inputTokens: 17,
        cachedInputTokens: 3,
        outputTokens: 2,
        totalTokens: 19,
        source: "provider_measured",
      },
      toolTrace: [
        {
          type: "function",
          name: "arena_risk_check",
          status: "failed",
        },
      ],
    });
  });

  it("fails closed when a provider returns with unsettled or failed tools", async () => {
    class InvalidToolCompletionProvider extends MockProvider {
      override async runTurn(
        input: Parameters<MockProvider["runTurn"]>[0],
      ): ReturnType<MockProvider["runTurn"]> {
        const result = await super.runTurn(input);
        if (input.agentId === "guardian") {
          await input.onEvent({
            type: "tool.started",
            safeData: { type: "function", name: "arena_risk_check" },
          });
          return { ...result, toolTrace: [] };
        }
        if (input.agentId === "solver") {
          return {
            ...result,
            toolTrace: result.toolTrace.map((trace, index) =>
              index === 0 ? { ...trace, status: "failed" as const } : trace,
            ),
          };
        }
        return result;
      }
    }
    app = await createTestApplication(
      {},
      {},
      new InvalidToolCompletionProvider(),
    );
    const run = await createRun(app);
    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "unsettled-tool-provider-turn",
    });
    const accepted = (await response.json()) as { turnId: string };
    const turn = await waitForTurn(app, accepted.turnId);

    expect(
      turn.results.find((result) => result.agentId === "guardian"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "invalid_model_output",
      toolTrace: [
        {
          type: "function",
          name: "arena_risk_check",
          status: "failed",
        },
      ],
    });
    expect(
      turn.results.find((result) => result.agentId === "solver"),
    ).toMatchObject({
      fallbackUsed: true,
      fallbackReason: "invalid_model_output",
      toolTrace: [expect.objectContaining({ status: "failed" })],
    });
  });

  it("does not carry context across distinct runs for the same owner", async () => {
    app = await createTestApplication();
    const firstRun = await createRun(app, "cross-run-a-key");
    const firstTurnResponse = await apiRequest(
      app,
      `/v1/runs/${firstRun.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(1),
        idempotencyKey: "cross-run-a-turn",
      },
    );
    const firstTurnAccepted = (await firstTurnResponse.json()) as {
      turnId: string;
    };
    await waitForTurn(app, firstTurnAccepted.turnId);

    const secondRun = await createRun(app, "cross-run-b-key");
    const secondTurnResponse = await apiRequest(
      app,
      `/v1/runs/${secondRun.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(1),
        idempotencyKey: "cross-run-b-turn",
      },
    );
    const secondTurnAccepted = (await secondTurnResponse.json()) as {
      turnId: string;
    };
    const secondTurn = await waitForTurn(app, secondTurnAccepted.turnId);

    expect(
      secondTurn.results.every((result) =>
        result.decision.reasonSummary.includes("0 prior turn"),
      ),
    ).toBe(true);
  });

  it("applies an allowlisted loadout update to the next turn", async () => {
    app = await createTestApplication();
    const run = await createRun(app);
    const original = run.agents.find(
      (agent) => agent.agentId === "guardian",
    )!;
    const update = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/loadout`,
      {
        method: "PUT",
        body: {
          promptCardIds: ["answer-briefly-v1"],
          skillCardIds: ["risk-check-v1"],
          mcpCardIds: [],
        },
      },
    );
    expect(update.status).toBe(200);
    expect(await update.json()).toMatchObject({
      arenaSessionId: original.arenaSessionId,
      generation: 1,
      loadout: { skillCardIds: ["risk-check-v1"] },
    });

    const response = await apiRequest(app, `/v1/runs/${run.runId}/turns`, {
      method: "POST",
      body: turnRequest(1),
      idempotencyKey: "updated-loadout-turn",
    });
    const accepted = (await response.json()) as { turnId: string };
    const turn = await waitForTurn(app, accepted.turnId);
    expect(
      turn.results.find((result) => result.agentId === "guardian")?.toolTrace,
    ).toEqual([
      expect.objectContaining({
        type: "function",
        name: "arena_risk_check",
        status: "completed",
      }),
    ]);
  });

  it("fails closed on malformed requests and unavailable profiles", async () => {
    app = await createTestApplication();
    const malformed = await apiRequest(app, "/v1/runs", {
      method: "POST",
      body: { ...runRequest, party: runRequest.party.slice(0, 2) },
      idempotencyKey: "malformed-run-key",
    });
    expect(malformed.status).toBe(400);

    const unavailable = await apiRequest(app, "/v1/runs", {
      method: "POST",
      body: { ...runRequest, modelProfileId: "openai-arena" },
      idempotencyKey: "unavailable-run-key",
    });
    expect(unavailable.status).toBe(422);

    const capabilities = await apiRequest(app, "/v1/capabilities");
    expect(capabilities.status).toBe(200);
    const body = (await capabilities.json()) as {
      modelProfiles: Array<{ id: string; configured: boolean }>;
    };
    expect(
      body.modelProfiles.find((profile) => profile.id === "mock-arena"),
    ).toMatchObject({ configured: true });

    const run = await createRun(app);
    const missingIdempotencyKey = await apiRequest(
      app,
      `/v1/runs/${run.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(1),
      },
    );
    expect(missingIdempotencyKey.status).toBe(400);
    expect(await missingIdempotencyKey.json()).toMatchObject({
      error: { code: "idempotency_key_required" },
    });

    for (const operation of ["compact", "clear"]) {
      const unknownBody = await apiRequest(
        app,
        `/v1/runs/${run.runId}/agents/guardian/${operation}`,
        {
          method: "POST",
          body: { rawProviderValue: "must-not-be-accepted" },
          idempotencyKey: `${operation}-strict-body-key`,
        },
      );
      expect(unknownBody.status).toBe(400);
      expect(await unknownBody.json()).toMatchObject({
        error: { code: "invalid_request" },
      });
    }
  });
});
