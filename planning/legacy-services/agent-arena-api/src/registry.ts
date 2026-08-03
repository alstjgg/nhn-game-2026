import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ArenaError } from "./errors.js";
import { compactModesForModel } from "./provider-capabilities.js";
import type {
  AgentLoadoutInput,
  FeatureCapabilities,
  HarnessDefinition,
  LoadoutSnapshot,
  McpCardDefinition,
  ModelProfileDefinition,
  ModelProfileSnapshot,
  ProviderId,
  PublicModelCapability,
  ResolvedMcpTool,
  ResolvedProviderLoadout,
  SkillCardDefinition,
  PromptCardDefinition,
  ResolvedHostedSkill,
} from "./types.js";

type CardFile = {
  promptCards: PromptCardDefinition[];
  skillCards: SkillCardDefinition[];
  mcpCards: McpCardDefinition[];
};

type JsonObject = Record<string, unknown>;

const PROVIDERS = ["mock", "openai", "anthropic"] as const;
const HOSTED_SKILL_PROVIDERS = ["openai", "anthropic"] as const;
const CAPABILITY_KEYS = [
  "streaming",
  "functionTools",
  "remoteMcp",
  "skills",
  "compaction",
] as const satisfies readonly (keyof FeatureCapabilities)[];
const ID_MAX_LENGTH = 128;
const DISPLAY_NAME_MAX_LENGTH = 160;
const INSTRUCTION_MAX_LENGTH = 8_000;
const ENVIRONMENT_NAME_MAX_LENGTH = 128;
const MODEL_MAX_LENGTH = 256;
const TOOL_NAME_MAX_LENGTH = 128;
const ENVIRONMENT_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isNonBlank(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function invalidRegistry(path: string, detail: string): never {
  throw new ArenaError(
    500,
    "invalid_registry",
    `Invalid registry value at ${path}: ${detail}`,
  );
}

function asObject(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidRegistry(path, "expected an object.");
  }
  return value as JsonObject;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    return invalidRegistry(path, "expected an array.");
  }
  return value;
}

function assertOnlyKeys(
  value: JsonObject,
  allowedKeys: readonly string[],
  path: string,
): void {
  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
  if (unknownKey !== undefined) {
    invalidRegistry(path, `unknown key ${unknownKey}.`);
  }
}

function boundedString(
  value: unknown,
  path: string,
  maxLength: number,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maxLength ||
    value !== value.trim()
  ) {
    return invalidRegistry(
      path,
      `expected a trimmed string between 1 and ${maxLength} characters.`,
    );
  }
  return value;
}

function optionalBoundedString(
  value: unknown,
  path: string,
  maxLength: number,
): string | undefined {
  return value === undefined
    ? undefined
    : boundedString(value, path, maxLength);
}

function registryId(value: unknown, path: string): string {
  return boundedString(value, path, ID_MAX_LENGTH);
}

function environmentName(value: unknown, path: string): string {
  const result = boundedString(
    value,
    path,
    ENVIRONMENT_NAME_MAX_LENGTH,
  );
  if (!ENVIRONMENT_NAME_PATTERN.test(result)) {
    return invalidRegistry(path, "expected an environment variable name.");
  }
  return result;
}

function optionalEnvironmentName(
  value: unknown,
  path: string,
): string | undefined {
  return value === undefined ? undefined : environmentName(value, path);
}

function positiveSafeInteger(value: unknown, path: string): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return invalidRegistry(path, "expected a positive safe integer.");
  }
  return value;
}

function booleanValue(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    return invalidRegistry(path, "expected a boolean.");
  }
  return value;
}

function providerId(value: unknown, path: string): ProviderId {
  if (
    typeof value !== "string" ||
    !(PROVIDERS as readonly string[]).includes(value)
  ) {
    return invalidRegistry(path, "expected a supported provider.");
  }
  return value as ProviderId;
}

function validateCapabilities(
  value: unknown,
  path: string,
): FeatureCapabilities {
  const object = asObject(value, path);
  assertOnlyKeys(object, CAPABILITY_KEYS, path);
  for (const key of CAPABILITY_KEYS) {
    if (!Object.hasOwn(object, key)) {
      invalidRegistry(path, `missing capability ${key}.`);
    }
  }
  return {
    streaming: booleanValue(object.streaming, `${path}.streaming`),
    functionTools: booleanValue(
      object.functionTools,
      `${path}.functionTools`,
    ),
    remoteMcp: booleanValue(object.remoteMcp, `${path}.remoteMcp`),
    skills: booleanValue(object.skills, `${path}.skills`),
    compaction: booleanValue(object.compaction, `${path}.compaction`),
  };
}

function validateModelProfiles(value: unknown): ModelProfileDefinition[] {
  return asArray(value, "model-profiles").map((entry, index) => {
    const path = `model-profiles[${index}]`;
    const object = asObject(entry, path);
    assertOnlyKeys(
      object,
      [
        "id",
        "displayName",
        "provider",
        "model",
        "modelEnv",
        "apiKeyEnv",
        "capabilities",
      ],
      path,
    );
    const model = optionalBoundedString(
      object.model,
      `${path}.model`,
      MODEL_MAX_LENGTH,
    );
    const modelEnv = optionalEnvironmentName(
      object.modelEnv,
      `${path}.modelEnv`,
    );
    if ((model === undefined) === (modelEnv === undefined)) {
      invalidRegistry(path, "expected exactly one of model or modelEnv.");
    }
    const apiKeyEnv = optionalEnvironmentName(
      object.apiKeyEnv,
      `${path}.apiKeyEnv`,
    );
    const provider = providerId(object.provider, `${path}.provider`);
    if (
      provider === "mock" &&
      (model === undefined ||
        modelEnv !== undefined ||
        apiKeyEnv !== undefined)
    ) {
      invalidRegistry(
        path,
        "mock profiles require a direct model and no credential environment.",
      );
    }
    if (provider !== "mock" && apiKeyEnv === undefined) {
      invalidRegistry(
        path,
        "provider profiles require a credential environment.",
      );
    }
    return {
      id: registryId(object.id, `${path}.id`),
      displayName: boundedString(
        object.displayName,
        `${path}.displayName`,
        DISPLAY_NAME_MAX_LENGTH,
      ),
      provider,
      ...(model === undefined ? {} : { model }),
      ...(modelEnv === undefined ? {} : { modelEnv }),
      ...(apiKeyEnv === undefined ? {} : { apiKeyEnv }),
      capabilities: validateCapabilities(
        object.capabilities,
        `${path}.capabilities`,
      ),
    };
  });
}

function validatePromptCards(value: unknown): PromptCardDefinition[] {
  return asArray(value, "cards.promptCards").map((entry, index) => {
    const path = `cards.promptCards[${index}]`;
    const object = asObject(entry, path);
    assertOnlyKeys(
      object,
      ["id", "version", "displayName", "instruction"],
      path,
    );
    return {
      id: registryId(object.id, `${path}.id`),
      version: positiveSafeInteger(object.version, `${path}.version`),
      displayName: boundedString(
        object.displayName,
        `${path}.displayName`,
        DISPLAY_NAME_MAX_LENGTH,
      ),
      instruction: boundedString(
        object.instruction,
        `${path}.instruction`,
        INSTRUCTION_MAX_LENGTH,
      ),
    };
  });
}

function validateSkillCards(value: unknown): SkillCardDefinition[] {
  return asArray(value, "cards.skillCards").map((entry, index) => {
    const path = `cards.skillCards[${index}]`;
    const object = asObject(entry, path);
    const base = {
      id: registryId(object.id, `${path}.id`),
      version: positiveSafeInteger(object.version, `${path}.version`),
      displayName: boundedString(
        object.displayName,
        `${path}.displayName`,
        DISPLAY_NAME_MAX_LENGTH,
      ),
      instruction: boundedString(
        object.instruction,
        `${path}.instruction`,
        INSTRUCTION_MAX_LENGTH,
      ),
    };
    if (object.kind === "instruction") {
      assertOnlyKeys(
        object,
        ["id", "version", "displayName", "kind", "instruction"],
        path,
      );
      return { ...base, kind: "instruction" };
    }
    if (object.kind === "function") {
      assertOnlyKeys(
        object,
        [
          "id",
          "version",
          "displayName",
          "kind",
          "instruction",
          "functionName",
        ],
        path,
      );
      const functionName = boundedString(
        object.functionName,
        `${path}.functionName`,
        TOOL_NAME_MAX_LENGTH,
      );
      if (functionName !== "arena_risk_check") {
        invalidRegistry(`${path}.functionName`, "unknown function tool.");
      }
      return { ...base, kind: "function", functionName };
    }
    if (object.kind === "hosted") {
      assertOnlyKeys(
        object,
        [
          "id",
          "version",
          "displayName",
          "kind",
          "instruction",
          "bindings",
        ],
        path,
      );
      const bindingsObject = asObject(object.bindings, `${path}.bindings`);
      assertOnlyKeys(
        bindingsObject,
        HOSTED_SKILL_PROVIDERS,
        `${path}.bindings`,
      );
      if (Object.keys(bindingsObject).length === 0) {
        invalidRegistry(`${path}.bindings`, "expected at least one binding.");
      }
      const bindings: SkillCardDefinition & { kind: "hosted" } =
        {
          ...base,
          kind: "hosted",
          bindings: {},
        };
      for (const provider of HOSTED_SKILL_PROVIDERS) {
        const bindingValue = bindingsObject[provider];
        if (bindingValue === undefined) {
          continue;
        }
        const bindingPath = `${path}.bindings.${provider}`;
        const binding = asObject(bindingValue, bindingPath);
        assertOnlyKeys(binding, ["skillIdEnv", "versionEnv"], bindingPath);
        bindings.bindings[provider] = {
          skillIdEnv: environmentName(
            binding.skillIdEnv,
            `${bindingPath}.skillIdEnv`,
          ),
          versionEnv: environmentName(
            binding.versionEnv,
            `${bindingPath}.versionEnv`,
          ),
        };
      }
      return bindings;
    }
    return invalidRegistry(
      `${path}.kind`,
      "expected instruction, function, or hosted.",
    );
  });
}

function validateMcpCards(value: unknown): McpCardDefinition[] {
  return asArray(value, "cards.mcpCards").map((entry, index) => {
    const path = `cards.mcpCards[${index}]`;
    const object = asObject(entry, path);
    assertOnlyKeys(
      object,
      [
        "id",
        "version",
        "displayName",
        "serverLabel",
        "urlEnv",
        "tokenEnv",
        "allowedTools",
        "readOnly",
      ],
      path,
    );
    const allowedTools = asArray(
      object.allowedTools,
      `${path}.allowedTools`,
    ).map((tool, toolIndex) =>
      boundedString(
        tool,
        `${path}.allowedTools[${toolIndex}]`,
        TOOL_NAME_MAX_LENGTH,
      ),
    );
    if (allowedTools.length === 0) {
      invalidRegistry(`${path}.allowedTools`, "expected at least one tool.");
    }
    if (new Set(allowedTools).size !== allowedTools.length) {
      invalidRegistry(`${path}.allowedTools`, "tool names must be unique.");
    }
    const readOnly = booleanValue(object.readOnly, `${path}.readOnly`);
    if (!readOnly) {
      invalidRegistry(`${path}.readOnly`, "MCP cards must be read-only.");
    }
    const tokenEnv = optionalEnvironmentName(
      object.tokenEnv,
      `${path}.tokenEnv`,
    );
    return {
      id: registryId(object.id, `${path}.id`),
      version: positiveSafeInteger(object.version, `${path}.version`),
      displayName: boundedString(
        object.displayName,
        `${path}.displayName`,
        DISPLAY_NAME_MAX_LENGTH,
      ),
      serverLabel: boundedString(
        object.serverLabel,
        `${path}.serverLabel`,
        ID_MAX_LENGTH,
      ),
      urlEnv: environmentName(object.urlEnv, `${path}.urlEnv`),
      ...(tokenEnv === undefined ? {} : { tokenEnv }),
      allowedTools,
      readOnly,
    };
  });
}

function validateCards(value: unknown): CardFile {
  const object = asObject(value, "cards");
  assertOnlyKeys(
    object,
    ["promptCards", "skillCards", "mcpCards"],
    "cards",
  );
  const cards = {
    promptCards: validatePromptCards(object.promptCards),
    skillCards: validateSkillCards(object.skillCards),
    mcpCards: validateMcpCards(object.mcpCards),
  };
  const seen = new Map<string, string>();
  for (const [kind, entries] of [
    ["prompt card", cards.promptCards],
    ["skill card", cards.skillCards],
    ["MCP card", cards.mcpCards],
  ] as const) {
    for (const card of entries) {
      const previous = seen.get(card.id);
      if (previous !== undefined) {
        invalidRegistry(
          "cards",
          `card id ${card.id} is shared by ${previous} and ${kind}.`,
        );
      }
      seen.set(card.id, kind);
    }
  }
  return cards;
}

function validateHarnesses(value: unknown): HarnessDefinition[] {
  return asArray(value, "harnesses").map((entry, index) => {
    const path = `harnesses[${index}]`;
    const object = asObject(entry, path);
    assertOnlyKeys(
      object,
      [
        "id",
        "displayName",
        "maxInputTokens",
        "maxOutputTokens",
        "maxToolCalls",
        "timeoutMs",
        "fallbackActionId",
        "contextSoftLimitRatio",
        "contextHardLimitRatio",
      ],
      path,
    );
    const soft = object.contextSoftLimitRatio;
    const hard = object.contextHardLimitRatio;
    if (
      typeof soft !== "number" ||
      !Number.isFinite(soft) ||
      typeof hard !== "number" ||
      !Number.isFinite(hard) ||
      soft <= 0 ||
      soft >= hard ||
      hard > 1
    ) {
      invalidRegistry(
        path,
        "expected 0 < contextSoftLimitRatio < contextHardLimitRatio <= 1.",
      );
    }
    return {
      id: registryId(object.id, `${path}.id`),
      displayName: boundedString(
        object.displayName,
        `${path}.displayName`,
        DISPLAY_NAME_MAX_LENGTH,
      ),
      maxInputTokens: positiveSafeInteger(
        object.maxInputTokens,
        `${path}.maxInputTokens`,
      ),
      maxOutputTokens: positiveSafeInteger(
        object.maxOutputTokens,
        `${path}.maxOutputTokens`,
      ),
      maxToolCalls: positiveSafeInteger(
        object.maxToolCalls,
        `${path}.maxToolCalls`,
      ),
      timeoutMs: positiveSafeInteger(
        object.timeoutMs,
        `${path}.timeoutMs`,
      ),
      fallbackActionId: registryId(
        object.fallbackActionId,
        `${path}.fallbackActionId`,
      ),
      contextSoftLimitRatio: soft,
      contextHardLimitRatio: hard,
    };
  });
}

function configuredModel(
  definition: ModelProfileDefinition,
): string | undefined {
  const value =
    definition.model ??
    (definition.modelEnv === undefined
      ? undefined
      : process.env[definition.modelEnv]);
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= MODEL_MAX_LENGTH &&
    value === value.trim()
    ? value
    : undefined;
}

function isPinnedSkillVersion(
  provider: ProviderId,
  version: string | undefined,
): boolean {
  if (
    !isNonBlank(version) ||
    version !== version.trim() ||
    version.toLowerCase() === "latest"
  ) {
    return false;
  }
  if (provider !== "openai") {
    return true;
  }
  if (!/^[1-9]\d*$/.test(version)) {
    return false;
  }
  const numeric = Number(version);
  return Number.isSafeInteger(numeric);
}

function isValidMcpUrl(value: string | undefined): boolean {
  if (value === undefined || value === "") {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

function parseJson<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    throw new ArenaError(
      500,
      "invalid_registry",
      `Registry file could not be loaded: ${path}`,
    );
  }
}

function uniqueById<T extends { id: string }>(
  entries: T[],
  label: string,
): Map<string, T> {
  const result = new Map<string, T>();
  for (const entry of entries) {
    if (result.has(entry.id)) {
      throw new ArenaError(
        500,
        "invalid_registry",
        `Duplicate ${label} id: ${entry.id}`,
      );
    }
    result.set(entry.id, structuredClone(entry));
  }
  return result;
}

export class ArenaRegistry {
  readonly #models: Map<string, ModelProfileDefinition>;
  readonly #prompts: Map<string, PromptCardDefinition>;
  readonly #skills: Map<string, SkillCardDefinition>;
  readonly #mcps: Map<string, McpCardDefinition>;
  readonly #harnesses: Map<string, HarnessDefinition>;

  constructor(directory: string) {
    const models = validateModelProfiles(parseJson<unknown>(
      join(directory, "model-profiles.json"),
    ));
    const cards = validateCards(
      parseJson<unknown>(join(directory, "cards.json")),
    );
    const harnesses = validateHarnesses(parseJson<unknown>(
      join(directory, "harnesses.json"),
    ));
    this.#models = uniqueById(models, "model profile");
    this.#prompts = uniqueById(cards.promptCards, "prompt card");
    this.#skills = uniqueById(cards.skillCards, "skill card");
    this.#mcps = uniqueById(cards.mcpCards, "MCP card");
    this.#harnesses = uniqueById(harnesses, "harness");
  }

  publicCapabilities(): PublicModelCapability[] {
    return [...this.#models.values()].map((definition) => {
      const unavailableReasons: string[] = [];
      const model = configuredModel(definition);
      if (model === undefined) {
        unavailableReasons.push("model_not_configured");
      }
      if (
        definition.apiKeyEnv !== undefined &&
        !isNonBlank(process.env[definition.apiKeyEnv])
      ) {
        unavailableReasons.push("provider_key_not_configured");
      }
      return {
        id: definition.id,
        displayName: definition.displayName,
        provider: definition.provider,
        implemented: false,
        configured: unavailableReasons.length === 0,
        liveVerified: false,
        supports: structuredClone(definition.capabilities),
        compactModes: compactModesForModel(
          definition.provider,
          definition.capabilities,
          model,
        ),
        unavailableReasons,
      };
    });
  }

  resolveModelProfile(id: string): ModelProfileSnapshot {
    const definition = this.#models.get(id);
    if (definition === undefined) {
      throw new ArenaError(
        422,
        "unknown_model_profile",
        `Unknown model profile: ${id}`,
      );
    }
    const model = configuredModel(definition);
    if (model === undefined) {
      throw new ArenaError(
        422,
        "model_profile_unavailable",
        `Model profile is not configured: ${id}`,
      );
    }
    if (
      definition.apiKeyEnv !== undefined &&
      !isNonBlank(process.env[definition.apiKeyEnv])
    ) {
      throw new ArenaError(
        422,
        "model_profile_unavailable",
        `Provider credentials are not configured for profile: ${id}`,
      );
    }
    return {
      id: definition.id,
      displayName: definition.displayName,
      provider: definition.provider,
      model,
      capabilities: structuredClone(definition.capabilities),
      compactModes: compactModesForModel(
        definition.provider,
        definition.capabilities,
        model,
      ),
    };
  }

  resolveHarness(id: string): HarnessDefinition {
    const harness = this.#harnesses.get(id);
    if (harness === undefined) {
      throw new ArenaError(422, "unknown_harness", `Unknown harness: ${id}`);
    }
    return structuredClone(harness);
  }

  snapshotLoadout(input: AgentLoadoutInput): LoadoutSnapshot {
    return {
      agentId: input.agentId,
      promptCardIds: [...input.promptCardIds],
      skillCardIds: [...input.skillCardIds],
      mcpCardIds: [...input.mcpCardIds],
      promptCards: input.promptCardIds.map((id) =>
        this.#required(this.#prompts, id, "prompt card"),
      ),
      skillCards: input.skillCardIds.map((id) =>
        this.#required(this.#skills, id, "skill card"),
      ),
      mcpCards: input.mcpCardIds.map((id) =>
        this.#required(this.#mcps, id, "MCP card"),
      ),
    };
  }

  resolveProviderLoadout(
    snapshot: LoadoutSnapshot,
    provider: ProviderId,
  ): ResolvedProviderLoadout {
    const instructions = snapshot.promptCards.map((card) => card.instruction);
    const functionTools: ResolvedProviderLoadout["functionTools"] = [];
    const hostedSkills: ResolvedHostedSkill[] = [];
    for (const skill of snapshot.skillCards) {
      instructions.push(skill.instruction);
      if (skill.kind === "function") {
        functionTools.push(this.#functionTool(skill.functionName));
      }
      if (skill.kind === "hosted" && provider !== "mock") {
        const binding = skill.bindings[provider];
        if (binding === undefined) {
          throw new ArenaError(
            422,
            "skill_not_supported",
            `Skill ${skill.id} has no binding for ${provider}.`,
          );
        }
        const skillId = process.env[binding.skillIdEnv];
        if (!isNonBlank(skillId)) {
          throw new ArenaError(
            422,
            "skill_not_configured",
            `Skill ${skill.id} is not configured for ${provider}.`,
          );
        }
        const version = process.env[binding.versionEnv];
        if (version === undefined || !isPinnedSkillVersion(provider, version)) {
          throw new ArenaError(
            422,
            "skill_not_configured",
            `Skill ${skill.id} has no pinned version for ${provider}.`,
          );
        }
        hostedSkills.push({
          cardId: skill.id,
          name: skill.displayName,
          skillId,
          version,
        });
      }
    }

    const mcpTools: ResolvedMcpTool[] =
      provider === "mock"
        ? snapshot.mcpCards.map((card) => ({
            cardId: card.id,
            serverLabel: card.serverLabel,
            serverUrl: "mock://read-only-mcp",
            allowedTools: [...card.allowedTools],
            readOnly: card.readOnly,
          }))
        : snapshot.mcpCards.map((card) => {
            if (!card.readOnly) {
              throw new ArenaError(
                422,
                "mcp_not_read_only",
                `MCP ${card.id} is not approved for read-only use.`,
              );
            }
            const serverUrl = process.env[card.urlEnv];
            if (!serverUrl) {
              throw new ArenaError(
                422,
                "mcp_not_configured",
                `MCP ${card.id} is not configured.`,
              );
            }
            let parsedServerUrl: URL;
            try {
              parsedServerUrl = new URL(serverUrl);
            } catch {
              throw new ArenaError(
                422,
                "invalid_mcp_configuration",
                `MCP ${card.id} does not use a valid URL.`,
              );
            }
            if (
              parsedServerUrl.protocol !== "https:" ||
              parsedServerUrl.username !== "" ||
              parsedServerUrl.password !== ""
            ) {
              throw new ArenaError(
                422,
                "invalid_mcp_configuration",
                `MCP ${card.id} must use an HTTPS URL without embedded credentials.`,
              );
            }
            const token =
              card.tokenEnv === undefined
                ? undefined
                : process.env[card.tokenEnv];
            return {
              cardId: card.id,
              serverLabel: card.serverLabel,
              serverUrl,
              ...(token === undefined || token === ""
                ? {}
                : { authorization: `Bearer ${token}` }),
              allowedTools: [...card.allowedTools],
              readOnly: card.readOnly,
            };
          });

    return {
      cardIds: [
        ...snapshot.promptCardIds,
        ...snapshot.skillCardIds,
        ...snapshot.mcpCardIds,
      ],
      instructions,
      functionTools,
      hostedSkills:
        provider === "mock"
          ? snapshot.skillCards
              .filter((skill) => skill.kind === "hosted")
              .map((skill) => ({
                cardId: skill.id,
                name: skill.displayName,
                skillId: "mock-skill",
                version: "1",
              }))
          : hostedSkills,
      mcpTools,
    };
  }

  publicCards(): Record<string, unknown> {
    return {
      promptCards: [...this.#prompts.values()].map(
        ({ id, version, displayName }) => ({ id, version, displayName }),
      ),
      skillCards: [...this.#skills.values()].map((card) => ({
        id: card.id,
        version: card.version,
        displayName: card.displayName,
        kind: card.kind,
        ...(card.kind !== "hosted"
          ? {}
          : {
              configuredProviders: Object.fromEntries(
                (["openai", "anthropic"] as const).map((provider) => {
                  const binding = card.bindings[provider];
                  return [
                    provider,
                    binding !== undefined &&
                      isNonBlank(process.env[binding.skillIdEnv]) &&
                      isPinnedSkillVersion(
                        provider,
                        process.env[binding.versionEnv],
                      ),
                  ];
                }),
              ),
            }),
      })),
      mcpCards: [...this.#mcps.values()].map((card) => ({
        id: card.id,
        version: card.version,
        displayName: card.displayName,
        readOnly: card.readOnly,
        configured: isValidMcpUrl(process.env[card.urlEnv]),
      })),
      harnesses: [...this.#harnesses.values()].map((harness) =>
        structuredClone(harness),
      ),
    };
  }

  #required<T>(
    map: Map<string, T>,
    id: string,
    label: string,
  ): T {
    const value = map.get(id);
    if (value === undefined) {
      throw new ArenaError(422, "unknown_card", `Unknown ${label}: ${id}`);
    }
    return structuredClone(value);
  }

  #functionTool(name: string): ResolvedProviderLoadout["functionTools"][number] {
    if (name !== "arena_risk_check") {
      throw new ArenaError(
        500,
        "invalid_registry",
        `Unknown function tool: ${name}`,
      );
    }
    return {
      name,
      description:
        "Select the action id with the lowest numeric risk. This function is deterministic and read-only.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          actions: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                actionId: { type: "string" },
                risk: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["actionId", "risk"],
            },
          },
        },
        required: ["actions"],
      },
    };
  }
}

export function hasCapability(
  capabilities: FeatureCapabilities,
  key: keyof FeatureCapabilities,
): boolean {
  return capabilities[key];
}
