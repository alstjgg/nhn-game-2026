import { resolve } from "node:path";
import { expect } from "vitest";

import { loadConfig, type ArenaConfig } from "../src/config.js";
import { EventHub } from "../src/events.js";
import { ArenaHttpServer } from "../src/http-server.js";
import {
  MockProvider,
  type MockProviderOptions,
} from "../src/providers/mock-provider.js";
import { ArenaRegistry } from "../src/registry.js";
import { ContextCipher } from "../src/security.js";
import { ArenaService } from "../src/service.js";
import { ArenaStore } from "../src/store.js";
import type { AgentProvider } from "../src/types.js";

export type TestApplication = {
  baseUrl: string;
  service: ArenaService;
  store: ArenaStore;
  provider: AgentProvider;
  close: () => Promise<void>;
};

export async function createTestApplication(
  providerOptions: MockProviderOptions = {},
  configOverrides: Partial<ArenaConfig> = {},
  providerOverride?: AgentProvider,
): Promise<TestApplication> {
  process.env.ARENA_SKIP_ENV_FILE = "1";
  const config = loadConfig({
    host: "127.0.0.1",
    port: 0,
    apiKeys: ["test-owner-key", "other-owner-key"],
    databasePath: ":memory:",
    contextEncryptionKey: "test-context-encryption-key",
    registryDirectory: resolve(process.cwd(), "config"),
    nodeEnv: "test",
    rateLimitPerMinute: 10_000,
    ...configOverrides,
  });
  const store = new ArenaStore(
    config.databasePath,
    new ContextCipher(config.contextEncryptionKey),
  );
  const provider = providerOverride ?? new MockProvider(providerOptions);
  const service = new ArenaService({
    store,
    registry: new ArenaRegistry(config.registryDirectory),
    providers: [provider],
    events: new EventHub(),
  });
  const server = new ArenaHttpServer(config, service);
  await server.listen(0, "127.0.0.1");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Test server did not expose a TCP address.");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    service,
    store,
    provider,
    close: async () => {
      await server.close();
      store.close();
    },
  };
}

export async function apiRequest(
  app: TestApplication,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    key?: string;
    idempotencyKey?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${options.key ?? "test-owner-key"}`,
    ...options.headers,
  };
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (options.idempotencyKey !== undefined) {
    headers["idempotency-key"] = options.idempotencyKey;
  }
  return fetch(`${app.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
}

export const runRequest = {
  modelProfileId: "mock-arena",
  harnessId: "starter-4000",
  party: [
    {
      agentId: "guardian",
      promptCardIds: ["protect-weakest-v1"],
      skillCardIds: [],
      mcpCardIds: [],
    },
    {
      agentId: "solver",
      promptCardIds: ["answer-briefly-v1"],
      skillCardIds: ["risk-check-v1"],
      mcpCardIds: [],
    },
    {
      agentId: "scout",
      promptCardIds: ["avoid-high-risk-v1"],
      skillCardIds: ["arena-tactics-v1"],
      mcpCardIds: ["calculator-mcp-v1"],
    },
  ],
};

export function turnRequest(turnNumber: number) {
  return {
    stageId: "combat-03",
    turnNumber,
    event: {
      type: "combat",
      summary: "The enemy prepares an area attack.",
      publicState: {
        enemyId: "enemy-1",
        partyHp: { guardian: 82, solver: 31, scout: 55 },
      },
    },
    allowedActions: [
      { actionId: "attack", targetIds: ["enemy-1"] },
      { actionId: "defend", targetIds: ["guardian", "solver", "scout"] },
      { actionId: "wait", targetIds: [] },
    ],
  };
}

export async function createRun(
  app: TestApplication,
  idempotencyKey = "create-run-key",
  key = "test-owner-key",
): Promise<{
  runId: string;
  agents: Array<{
    agentId: string;
    arenaSessionId: string;
    generation: number;
  }>;
}> {
  const response = await apiRequest(app, "/v1/runs", {
    method: "POST",
    body: runRequest,
    idempotencyKey,
    key,
  });
  expect(response.status).toBe(201);
  return (await response.json()) as {
    runId: string;
    agents: Array<{
      agentId: string;
      arenaSessionId: string;
      generation: number;
    }>;
  };
}

export async function waitForTurn(
  app: TestApplication,
  turnId: string,
  key = "test-owner-key",
): Promise<{
  status: string;
  results: Array<{
    agentId: string;
    fallbackUsed: boolean;
    fallbackReason?: string;
    arenaSessionId: string;
    decision: {
      actionId: string;
      reasonSummary: string;
    };
    toolTrace: unknown[];
  }>;
}> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const response = await apiRequest(app, `/v1/turns/${turnId}`, { key });
    const body = (await response.json()) as {
      status: string;
      results: Array<{
        agentId: string;
        fallbackUsed: boolean;
        fallbackReason?: string;
        arenaSessionId: string;
        decision: {
          actionId: string;
          reasonSummary: string;
        };
        toolTrace: unknown[];
      }>;
    };
    if (body.status === "completed" || body.status === "failed") {
      return body;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`Turn ${turnId} did not reach a terminal status.`);
}
