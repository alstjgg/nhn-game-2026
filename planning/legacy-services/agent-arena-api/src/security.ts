import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { ArenaError } from "./errors.js";

const REDACTED = "[REDACTED]";

function isSecretField(key: string): boolean {
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replaceAll("-", "_")
    .toLowerCase();
  const segments = normalized.split("_");
  return (
    segments.some((segment) =>
      ["authorization", "password", "secret", "credential"].includes(segment),
    ) ||
    normalized === "token" ||
    normalized.endsWith("_token") ||
    normalized.startsWith("token_") ||
    normalized === "api_key" ||
    normalized.endsWith("_api_key") ||
    normalized.startsWith("api_key_")
  );
}

export function fingerprintSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeSecretEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function authenticateBearer(
  authorization: string | undefined,
  allowedKeys: string[],
): string {
  if (authorization === undefined || !authorization.startsWith("Bearer ")) {
    throw new ArenaError(401, "unauthorized", "A Bearer token is required.");
  }
  const candidate = authorization.slice("Bearer ".length);
  const matched = allowedKeys.some((key) => safeSecretEquals(candidate, key));
  if (!matched) {
    throw new ArenaError(401, "unauthorized", "Invalid Bearer token.");
  }
  return fingerprintSecret(candidate);
}

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isSecretField(key) ? REDACTED : redactSecrets(entry),
      ]),
    );
  }
  if (typeof value === "string") {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, `Bearer ${REDACTED}`)
      .replace(/\b(sk-[A-Za-z0-9_-]{8,})\b/g, REDACTED);
  }
  return value;
}

export function containsRuntimeSensitiveValue(
  value: unknown,
  candidates: string[],
): boolean {
  const sensitiveValues = candidates.filter(
    (candidate) => candidate.length >= 4,
  );
  if (sensitiveValues.length === 0) {
    return false;
  }
  if (typeof value === "string") {
    return sensitiveValues.some((candidate) => value.includes(candidate));
  }
  if (Array.isArray(value)) {
    return value.some((entry) =>
      containsRuntimeSensitiveValue(entry, sensitiveValues),
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).some((entry) =>
      containsRuntimeSensitiveValue(entry, sensitiveValues),
    );
  }
  return false;
}

export class ContextCipher {
  readonly #key: Buffer;

  constructor(secret: string) {
    this.#key = createHash("sha256").update(secret).digest();
  }

  seal(value: unknown): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.#key, iv);
    const plaintext = Buffer.from(JSON.stringify(value), "utf8");
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString("base64");
  }

  open<T>(sealed: string): T {
    try {
      const payload = Buffer.from(sealed, "base64");
      const iv = payload.subarray(0, 12);
      const tag = payload.subarray(12, 28);
      const ciphertext = payload.subarray(28);
      const decipher = createDecipheriv("aes-256-gcm", this.#key, iv);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString("utf8");
      return JSON.parse(plaintext) as T;
    } catch {
      throw new ArenaError(
        500,
        "context_decryption_failed",
        "Stored context could not be decrypted.",
      );
    }
  }
}
