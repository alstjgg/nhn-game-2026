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

/**
 * Exactly one origin, and HTTPS — with one narrow exception: plain HTTP on
 * `localhost` / `127.0.0.1`, so the handler can be driven from a local dev
 * server. Without it the client loop is untestable off AWS, which is how a wire
 * contract stays unexercised — verified 08-03 by driving the real handler from a
 * browser.
 *
 * The exception is not a hole in production. `template.yaml` declares
 * `AllowedOrigin` with `AllowedPattern: ^https://…`, so CloudFormation refuses a
 * non-HTTPS value at deploy time — the guard that matters sits a layer up, and
 * this one is about what a running function will accept.
 */
function parseOrigin(raw: string): string {
  try {
    const url = new URL(raw);
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const scheme = url.protocol === "https:" || (url.protocol === "http:" && loopback);
    if (!scheme || url.origin !== raw || url.username || url.password) {
      throw new Error("not an allowed origin");
    }
    return raw;
  } catch {
    throw new PublicError(
      500,
      "invalid_config",
      "ALLOWED_ORIGIN must be one exact HTTPS origin without a path (or http on localhost for dev).",
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
