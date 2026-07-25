import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ArenaRegistry } from "../src/registry.js";
import { ContextCipher } from "../src/security.js";
import { ArenaService } from "../src/service.js";
import { ArenaStore } from "../src/store.js";

const ENVIRONMENT_NAMES = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "OPENAI_SKILL_ID",
  "OPENAI_SKILL_VERSION",
  "ANTHROPIC_SKILL_ID",
  "ANTHROPIC_SKILL_VERSION",
  "ARENA_CALCULATOR_MCP_URL",
  "ARENA_CALCULATOR_MCP_TOKEN",
] as const;
const originalEnvironment = new Map(
  ENVIRONMENT_NAMES.map((name) => [name, process.env[name]]),
);
const temporaryDirectories: string[] = [];

type RegistryDocuments = {
  modelProfiles: unknown;
  cards: unknown;
  harnesses: unknown;
};

afterEach(() => {
  for (const [name, value] of originalEnvironment) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function registry(): ArenaRegistry {
  return new ArenaRegistry(resolve(process.cwd(), "config"));
}

function objectValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("Expected a fixture object.");
  }
  return value as Record<string, unknown>;
}

function arrayValue(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Expected a fixture array.");
  }
  return value;
}

function temporaryRegistry(
  mutate: (documents: RegistryDocuments) => void,
): string {
  const source = resolve(process.cwd(), "config");
  const directory = mkdtempSync(join(tmpdir(), "arena-registry-"));
  temporaryDirectories.push(directory);
  const documents: RegistryDocuments = {
    modelProfiles: JSON.parse(
      readFileSync(join(source, "model-profiles.json"), "utf8"),
    ) as unknown,
    cards: JSON.parse(
      readFileSync(join(source, "cards.json"), "utf8"),
    ) as unknown,
    harnesses: JSON.parse(
      readFileSync(join(source, "harnesses.json"), "utf8"),
    ) as unknown,
  };
  mutate(documents);
  for (const [file, value] of [
    ["model-profiles.json", documents.modelProfiles],
    ["cards.json", documents.cards],
    ["harnesses.json", documents.harnesses],
  ] as const) {
    writeFileSync(
      join(directory, file),
      `${JSON.stringify(value)}\n`,
      "utf8",
    );
  }
  return directory;
}

function expectInvalidRegistry(
  mutate: (documents: RegistryDocuments) => void,
): void {
  expect(() => new ArenaRegistry(temporaryRegistry(mutate))).toThrowError(
    expect.objectContaining({
      status: 500,
      code: "invalid_registry",
    }),
  );
}

describe("allowlisted registries", () => {
  it("publishes only aliases and configuration booleans, never raw resources", () => {
    process.env.OPENAI_API_KEY = "sk-openai-public-canary";
    process.env.OPENAI_MODEL = "raw-openai-model-canary";
    process.env.ANTHROPIC_API_KEY = "sk-ant-public-canary";
    process.env.ANTHROPIC_MODEL = "raw-anthropic-model-canary";
    process.env.OPENAI_SKILL_ID = "openai-skill-secret-canary";
    process.env.OPENAI_SKILL_VERSION = "7";
    process.env.ANTHROPIC_SKILL_ID = "anthropic-skill-secret-canary";
    process.env.ANTHROPIC_SKILL_VERSION = "1750000000";
    process.env.ARENA_CALCULATOR_MCP_URL =
      "https://mcp-secret-canary.example.test/messages";
    process.env.ARENA_CALCULATOR_MCP_TOKEN = "mcp-token-secret-canary";

    const arenaRegistry = registry();
    const published = {
      profiles: arenaRegistry.publicCapabilities(),
      cards: arenaRegistry.publicCards(),
    };
    const serialized = JSON.stringify(published);

    expect(published.profiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "openai-arena",
          configured: true,
        }),
        expect.objectContaining({
          id: "claude-arena",
          configured: true,
        }),
      ]),
    );
    expect(serialized).toContain('"configuredProviders"');
    expect(serialized).not.toContain("public-canary");
    expect(serialized).not.toContain("raw-openai-model-canary");
    expect(serialized).not.toContain("raw-anthropic-model-canary");
    expect(serialized).not.toContain("skill-secret-canary");
    expect(serialized).not.toContain("mcp-secret-canary");
    expect(serialized).not.toContain("mcp-token-secret-canary");
  });

  it("requires a provider-specific pinned version for hosted Skills", () => {
    process.env.OPENAI_SKILL_ID = "skill-configured-for-test";
    delete process.env.OPENAI_SKILL_VERSION;
    const arenaRegistry = registry();
    const snapshot = arenaRegistry.snapshotLoadout({
      agentId: "solver",
      promptCardIds: [],
      skillCardIds: ["arena-tactics-v1"],
      mcpCardIds: [],
    });

    expect(() =>
      arenaRegistry.resolveProviderLoadout(snapshot, "openai"),
    ).toThrowError(
      expect.objectContaining({
        status: 422,
        code: "skill_not_configured",
      }),
    );

    process.env.OPENAI_SKILL_VERSION = "latest";
    expect(() =>
      arenaRegistry.resolveProviderLoadout(snapshot, "openai"),
    ).toThrowError(
      expect.objectContaining({
        status: 422,
        code: "skill_not_configured",
      }),
    );

    process.env.OPENAI_SKILL_VERSION = "not-a-version";
    expect(() =>
      arenaRegistry.resolveProviderLoadout(snapshot, "openai"),
    ).toThrowError(
      expect.objectContaining({
        status: 422,
        code: "skill_not_configured",
      }),
    );
  });

  it("rejects non-HTTPS MCP targets and write-capable registry entries", () => {
    process.env.ARENA_CALCULATOR_MCP_URL = "http://127.0.0.1:9000/mcp";
    const arenaRegistry = registry();
    const snapshot = arenaRegistry.snapshotLoadout({
      agentId: "solver",
      promptCardIds: [],
      skillCardIds: [],
      mcpCardIds: ["calculator-mcp-v1"],
    });
    expect(() =>
      arenaRegistry.resolveProviderLoadout(snapshot, "openai"),
    ).toThrowError(
      expect.objectContaining({
        status: 422,
        code: "invalid_mcp_configuration",
      }),
    );

    process.env.OPENAI_SKILL_ID = "skill-configured-for-test";
    process.env.OPENAI_SKILL_VERSION = "latest";
    const publicCards = arenaRegistry.publicCards() as {
      skillCards: Array<{
        id: string;
        configuredProviders?: Record<string, boolean>;
      }>;
      mcpCards: Array<{ id: string; configured: boolean }>;
    };
    expect(
      publicCards.skillCards.find(({ id }) => id === "arena-tactics-v1")
        ?.configuredProviders?.openai,
    ).toBe(false);
    expect(
      publicCards.mcpCards.find(({ id }) => id === "calculator-mcp-v1")
        ?.configured,
    ).toBe(false);

    expectInvalidRegistry((documents) => {
      const cards = objectValue(documents.cards);
      const mcp = objectValue(arrayValue(cards.mcpCards)[0]);
      mcp.readOnly = false;
    });
  });

  it("fails closed on malformed model profiles and capabilities", () => {
    const mutations: Array<(documents: RegistryDocuments) => void> = [
      (documents) => {
        documents.modelProfiles = {};
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        model.unknown = true;
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        model.provider = "unregistered-provider";
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        model.apiKeyEnv = "MOCK_API_KEY";
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[1]);
        delete model.apiKeyEnv;
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        model.modelEnv = "MOCK_MODEL";
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[1]);
        model.modelEnv = " INVALID ENV ";
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        model.displayName = ` ${String(model.displayName)}`;
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        const capabilities = objectValue(model.capabilities);
        delete capabilities.streaming;
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        const capabilities = objectValue(model.capabilities);
        capabilities.skills = "yes";
      },
      (documents) => {
        const model = objectValue(arrayValue(documents.modelProfiles)[0]);
        const capabilities = objectValue(model.capabilities);
        capabilities.futureCapability = true;
      },
    ];

    for (const mutate of mutations) {
      expectInvalidRegistry(mutate);
    }
  });

  it("fails closed on malformed, ambiguous, or write-capable cards", () => {
    const mutations: Array<(documents: RegistryDocuments) => void> = [
      (documents) => {
        const cards = objectValue(documents.cards);
        cards.promptCards = {};
      },
      (documents) => {
        const cards = objectValue(documents.cards);
        const prompt = objectValue(arrayValue(cards.promptCards)[0]);
        prompt.instruction = ` ${String(prompt.instruction)}`;
      },
      (documents) => {
        const cards = objectValue(documents.cards);
        const skill = objectValue(arrayValue(cards.skillCards)[0]);
        skill.bindings = {};
      },
      (documents) => {
        const cards = objectValue(documents.cards);
        const hosted = objectValue(arrayValue(cards.skillCards)[1]);
        const bindings = objectValue(hosted.bindings);
        bindings.mock = {
          skillIdEnv: "MOCK_SKILL_ID",
          versionEnv: "MOCK_SKILL_VERSION",
        };
      },
      (documents) => {
        const cards = objectValue(documents.cards);
        const hosted = objectValue(arrayValue(cards.skillCards)[1]);
        const bindings = objectValue(hosted.bindings);
        const openai = objectValue(bindings.openai);
        delete openai.versionEnv;
      },
      (documents) => {
        const cards = objectValue(documents.cards);
        const mcp = objectValue(arrayValue(cards.mcpCards)[0]);
        const tools = arrayValue(mcp.allowedTools);
        tools.push(tools[0]);
      },
      (documents) => {
        const cards = objectValue(documents.cards);
        const mcp = objectValue(arrayValue(cards.mcpCards)[0]);
        mcp.readOnly = false;
      },
      (documents) => {
        const cards = objectValue(documents.cards);
        const prompt = objectValue(arrayValue(cards.promptCards)[0]);
        const skill = objectValue(arrayValue(cards.skillCards)[0]);
        skill.id = prompt.id;
      },
    ];

    for (const mutate of mutations) {
      expectInvalidRegistry(mutate);
    }
  });

  it("fails closed on malformed harness limits and context ratios", () => {
    const mutations: Array<(documents: RegistryDocuments) => void> = [
      (documents) => {
        documents.harnesses = {};
      },
      (documents) => {
        const harness = objectValue(arrayValue(documents.harnesses)[0]);
        harness.maxInputTokens = 0;
      },
      (documents) => {
        const harness = objectValue(arrayValue(documents.harnesses)[0]);
        harness.timeoutMs = Number.MAX_SAFE_INTEGER + 1;
      },
      (documents) => {
        const harness = objectValue(arrayValue(documents.harnesses)[0]);
        harness.contextSoftLimitRatio = 0.9;
        harness.contextHardLimitRatio = 0.9;
      },
      (documents) => {
        const harness = objectValue(arrayValue(documents.harnesses)[0]);
        harness.contextHardLimitRatio = 1.01;
      },
      (documents) => {
        const harness = objectValue(arrayValue(documents.harnesses)[0]);
        harness.extraLimit = 1;
      },
    ];

    for (const mutate of mutations) {
      expectInvalidRegistry(mutate);
    }
  });

  it("derives Anthropic compact modes from the hidden target and freezes the snapshot", () => {
    const unsupportedTarget = "claude-3-5-haiku-unsupported-canary";
    const supportedTarget = "claude-sonnet-4-6-supported-canary";
    process.env.ANTHROPIC_API_KEY = "anthropic-key-for-mode-test";
    process.env.ANTHROPIC_MODEL = unsupportedTarget;

    const arenaRegistry = registry();
    const unsupportedPublic = arenaRegistry
      .publicCapabilities()
      .find(({ id }) => id === "claude-arena");
    const unsupportedSnapshot =
      arenaRegistry.resolveModelProfile("claude-arena");

    expect(unsupportedPublic?.compactModes).toEqual([
      "explicit-summary-fallback",
    ]);
    expect(unsupportedSnapshot.compactModes).toEqual([
      "explicit-summary-fallback",
    ]);
    expect(JSON.stringify(unsupportedPublic)).not.toContain(
      unsupportedTarget,
    );

    process.env.ANTHROPIC_MODEL = supportedTarget;
    const supportedPublic = arenaRegistry
      .publicCapabilities()
      .find(({ id }) => id === "claude-arena");
    const supportedSnapshot =
      arenaRegistry.resolveModelProfile("claude-arena");

    expect(supportedPublic?.compactModes).toEqual([
      "native",
      "explicit-summary-fallback",
    ]);
    expect(supportedSnapshot.compactModes).toEqual([
      "native",
      "explicit-summary-fallback",
    ]);
    expect(JSON.stringify(supportedPublic)).not.toContain(supportedTarget);
    expect(unsupportedSnapshot.compactModes).toEqual([
      "explicit-summary-fallback",
    ]);
  });

  it("encrypts and freezes resolved Skill/MCP resources at run creation", () => {
    const skillId = "skill-resource-snapshot-canary-a";
    const mcpUrl = "https://mcp-resource-snapshot-canary-a.example.test/rpc";
    const mcpToken = "mcp-resource-snapshot-token-canary-a";
    process.env.OPENAI_API_KEY = "sk-openai-snapshot-test";
    process.env.OPENAI_MODEL = "openai-model-snapshot-a";
    process.env.OPENAI_SKILL_ID = skillId;
    process.env.OPENAI_SKILL_VERSION = "7";
    process.env.ARENA_CALCULATOR_MCP_URL = mcpUrl;
    process.env.ARENA_CALCULATOR_MCP_TOKEN = mcpToken;

    const temporary = mkdtempSync(join(tmpdir(), "arena-snapshot-"));
    temporaryDirectories.push(temporary);
    const databasePath = join(temporary, "arena.sqlite");
    const store = new ArenaStore(
      databasePath,
      new ContextCipher("snapshot-test-encryption-key-material"),
    );
    const service = new ArenaService({
      store,
      registry: registry(),
      providers: [],
    });
    const request = {
      modelProfileId: "openai-arena",
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
          skillCardIds: ["arena-tactics-v1"],
          mcpCardIds: ["calculator-mcp-v1"],
        },
        {
          agentId: "scout",
          promptCardIds: ["avoid-high-risk-v1"],
          skillCardIds: [],
          mcpCardIds: [],
        },
      ],
    };
    const created = service.createRun(
      "snapshot-owner",
      request,
      "snapshot-create-run-key",
    );

    process.env.OPENAI_SKILL_ID = "skill-resource-snapshot-canary-b";
    process.env.OPENAI_SKILL_VERSION = "8";
    process.env.ARENA_CALCULATOR_MCP_URL =
      "https://mcp-resource-snapshot-canary-b.example.test/rpc";
    process.env.ARENA_CALCULATOR_MCP_TOKEN =
      "mcp-resource-snapshot-token-canary-b";
    const session = store.getActiveSession(
      "snapshot-owner",
      created.runId,
      "solver",
    );

    expect(session?.providerLoadout).toMatchObject({
      hostedSkills: [{ skillId, version: "7" }],
      mcpTools: [
        {
          serverUrl: mcpUrl,
          authorization: `Bearer ${mcpToken}`,
          readOnly: true,
        },
      ],
    });
    expect(JSON.stringify(created)).not.toContain(skillId);
    expect(JSON.stringify(created)).not.toContain(mcpUrl);
    expect(JSON.stringify(created)).not.toContain(mcpToken);

    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_SKILL_ID;
    delete process.env.OPENAI_SKILL_VERSION;
    delete process.env.ARENA_CALCULATOR_MCP_URL;
    delete process.env.ARENA_CALCULATOR_MCP_TOKEN;
    expect(
      service.createRun(
        "snapshot-owner",
        request,
        "snapshot-create-run-key",
      ),
    ).toMatchObject({
      runId: created.runId,
      replayed: true,
    });

    store.close();
    const persisted = [
      databasePath,
      `${databasePath}-wal`,
      `${databasePath}-shm`,
    ]
      .filter((path) => {
        try {
          readFileSync(path);
          return true;
        } catch {
          return false;
        }
      })
      .map((path) => readFileSync(path))
      .reduce((left, right) => Buffer.concat([left, right]), Buffer.alloc(0));
    expect(persisted.includes(Buffer.from(skillId))).toBe(false);
    expect(persisted.includes(Buffer.from(mcpUrl))).toBe(false);
    expect(persisted.includes(Buffer.from(mcpToken))).toBe(false);
  });
});
