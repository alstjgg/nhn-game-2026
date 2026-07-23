import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { ArenaError } from "./errors.js";

export type ArenaConfig = {
  host: string;
  port: number;
  apiKeys: string[];
  databasePath: string;
  contextEncryptionKey: string;
  corsOrigins: string[];
  maxBodyBytes: number;
  rateLimitPerMinute: number;
  registryDirectory: string;
  nodeEnv: string;
};

function loadLocalEnvironment(): void {
  if (process.env.ARENA_SKIP_ENV_FILE === "1") {
    return;
  }
  const explicit = process.env.ARENA_ENV_FILE;
  const candidates =
    explicit === undefined
      ? [
          resolve(process.cwd(), ".env.local"),
          resolve(process.cwd(), "../../.env.local"),
        ]
      : [resolve(explicit)];
  const selected = candidates.find((candidate) => existsSync(candidate));
  if (selected !== undefined) {
    loadEnvFile(selected);
  }
}

function parsePositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ArenaError(
      500,
      "invalid_configuration",
      `${name} must be a positive integer.`,
    );
  }
  return value;
}

function databasePathFromUrl(url: string): string {
  if (!url.startsWith("file:")) {
    throw new ArenaError(
      500,
      "invalid_configuration",
      "ARENA_DATABASE_URL must use the file: scheme.",
    );
  }
  const value = url.slice("file:".length);
  if (value === ":memory:") {
    return ":memory:";
  }
  return resolve(process.cwd(), value);
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  const ipv4 = normalized.split(".");
  const ipv4Loopback =
    ipv4.length === 4 &&
    ipv4[0] === "127" &&
    ipv4.every(
      (part) =>
        /^\d{1,3}$/.test(part) &&
        Number(part) >= 0 &&
        Number(part) <= 255,
    );
  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    ipv4Loopback
  );
}

export function loadConfig(
  overrides: Partial<ArenaConfig> = {},
): ArenaConfig {
  loadLocalEnvironment();
  const nodeEnv = overrides.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const host = overrides.host ?? process.env.ARENA_HOST ?? "127.0.0.1";
  const exposed = !isLoopbackHost(host);
  const configuredKeys =
    overrides.apiKeys ??
    (process.env.ARENA_API_KEYS ?? "")
      .split(",")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);
  const apiKeys =
    configuredKeys.length > 0
      ? configuredKeys
      : nodeEnv === "production" || exposed
        ? []
        : ["dev-local-key"];
  if (apiKeys.length === 0) {
    throw new ArenaError(
      500,
      "invalid_configuration",
      "ARENA_API_KEYS is required in production and for non-loopback binding.",
    );
  }
  if (
    (nodeEnv === "production" || exposed) &&
    apiKeys.some(
      (key) =>
        Buffer.byteLength(key, "utf8") < 32 ||
        key === "dev-local-key" ||
        /(?:change[-_ ]?me|replace[-_ ]?with|example)/i.test(key),
    )
  ) {
    throw new ArenaError(
      500,
      "invalid_configuration",
      "Application API keys must contain at least 32 bytes of non-placeholder material in production and for non-loopback binding.",
    );
  }

  const configuredEncryptionKey =
    overrides.contextEncryptionKey ??
    process.env.ARENA_CONTEXT_ENCRYPTION_KEY ??
    "";
  if (
    (nodeEnv === "production" || exposed) &&
    Buffer.byteLength(configuredEncryptionKey, "utf8") < 24
  ) {
    throw new ArenaError(
      500,
      "invalid_configuration",
      "ARENA_CONTEXT_ENCRYPTION_KEY must contain at least 24 bytes in production and for non-loopback binding.",
    );
  }

  return {
    host,
    port: overrides.port ?? parsePositiveInteger("ARENA_PORT", 8790),
    apiKeys,
    databasePath:
      overrides.databasePath ??
      databasePathFromUrl(
        process.env.ARENA_DATABASE_URL ?? "file:./data/agent-arena.sqlite",
      ),
    contextEncryptionKey:
      configuredEncryptionKey || "development-only-context-key",
    corsOrigins:
      overrides.corsOrigins ??
      (process.env.ARENA_CORS_ORIGINS ??
        "http://127.0.0.1:5173,http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    maxBodyBytes:
      overrides.maxBodyBytes ??
      parsePositiveInteger("ARENA_MAX_BODY_BYTES", 262_144),
    rateLimitPerMinute:
      overrides.rateLimitPerMinute ??
      parsePositiveInteger("ARENA_RATE_LIMIT_PER_MINUTE", 120),
    registryDirectory:
      overrides.registryDirectory ??
      resolve(process.cwd(), "config"),
    nodeEnv,
  };
}
