import { PublicError } from "./errors.js";

/**
 * Runtime configuration, validated at cold start and never after.
 *
 * Copied from `apothecary-llm-layer/src/config.ts` and narrowed: DDAY binds
 * haiku (game spec §4), so the two-model allowlist and the `structuredOutputMode`
 * branch that went with it are gone. The allowlist *machinery* stays, because
 * the property it enforces is still worth having — `MODEL_ID` must be a member
 * of what the deployed stack's IAM role can actually invoke, so a mismatch fails
 * at cold start rather than as an AccessDenied on the first player's call.
 *
 * Adding a second model is: one entry in SUPPORTED_MODEL_IDS, one branch in the
 * template's IAM policy. The compiler will not stop you; the allowlist will.
 */

export const HAIKU_MODEL_ID =
  "global.anthropic.claude-haiku-4-5-20251001-v1:0";

const SUPPORTED_MODEL_IDS = new Set([HAIKU_MODEL_ID]);

export type RuntimeConfig = {
  region: "ap-northeast-2";
  modelId: string;
  allowedModelIds: string[];
  maxTokens: number;
  modelTimeoutMs: number;
  allowedOrigin: string;
  maxBodyBytes: number;
};

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new PublicError(
      500,
      "invalid_config",
      `Required environment variable ${name} is missing.`,
    );
  }
  return value;
}

function boundedInteger(
  env: NodeJS.ProcessEnv,
  name: string,
  minimum: number,
  maximum: number,
): number {
  const raw = required(env, name);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new PublicError(
      500,
      "invalid_config",
      `${name} must be an integer from ${minimum} to ${maximum}.`,
    );
  }
  return value;
}

function parseOrigin(raw: string): string {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.origin !== raw ||
      url.username ||
      url.password
    ) {
      throw new Error("not an HTTPS origin");
    }
    return raw;
  } catch {
    throw new PublicError(
      500,
      "invalid_config",
      "ALLOWED_ORIGIN must be one exact HTTPS origin without a path.",
    );
  }
}

function parseAllowedModels(raw: string): string[] {
  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    ids.length < 1 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !SUPPORTED_MODEL_IDS.has(id))
  ) {
    throw new PublicError(
      500,
      "invalid_config",
      "ALLOWED_MODEL_IDS must be a unique list of supported profiles.",
    );
  }
  return ids;
}

export function loadConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const region = required(env, "BEDROCK_REGION");
  if (region !== "ap-northeast-2") {
    throw new PublicError(
      500,
      "invalid_config",
      "BEDROCK_REGION must be ap-northeast-2.",
    );
  }

  const modelId = required(env, "MODEL_ID");
  const allowedModelIds = parseAllowedModels(required(env, "ALLOWED_MODEL_IDS"));
  if (!allowedModelIds.includes(modelId)) {
    throw new PublicError(
      500,
      "invalid_config",
      "MODEL_ID is not in the deployed allowlist.",
    );
  }

  return {
    region,
    modelId,
    allowedModelIds,
    // Wider than apothecary's 16..512: a reporter body is 20-30 sentences
    // (call contracts §7-3), which does not fit in 512.
    maxTokens: boundedInteger(env, "MAX_TOKENS", 16, 4_096),
    // API Gateway waits 9 seconds. Keep 2 seconds for validation + fallback.
    modelTimeoutMs: boundedInteger(env, "MODEL_TIMEOUT_MS", 100, 7_000),
    allowedOrigin: parseOrigin(required(env, "ALLOWED_ORIGIN")),
    maxBodyBytes: boundedInteger(env, "MAX_BODY_BYTES", 1_024, 262_144),
  };
}
