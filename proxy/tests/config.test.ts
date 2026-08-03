import { describe, expect, it } from "vitest";

import { HAIKU_MODEL_ID, loadConfig } from "../src/config.js";
import { validEnv } from "./fixtures.js";

const env = (overrides: Record<string, string | undefined> = {}) =>
  ({ ...validEnv, ...overrides }) as NodeJS.ProcessEnv;

describe("loadConfig", () => {
  it("loads the deployed allowlist", () => {
    const config = loadConfig(env());
    expect(config.modelId).toBe(HAIKU_MODEL_ID);
    expect(config.allowedModelIds).toEqual([HAIKU_MODEL_ID]);
  });

  it("fails closed when MODEL_ID is outside the deployed allowlist", () => {
    expect(() =>
      loadConfig(env({ ALLOWED_MODEL_IDS: "global.amazon.nova-2-lite-v1:0" })),
    ).toThrow(/supported profiles/);
  });

  // DDAY binds haiku (game spec §4). An unrecognised profile must not slip
  // through as a string — the IAM policy in template.yaml only names haiku, so
  // anything else would fail as AccessDenied on a player's first call instead.
  it("rejects a model the stack cannot invoke", () => {
    expect(() =>
      loadConfig(env({ MODEL_ID: "global.amazon.nova-2-lite-v1:0" })),
    ).toThrow(/not in the deployed allowlist/);
  });

  it("allows plain http on loopback, for the dev server", () => {
    expect(loadConfig(env({ ALLOWED_ORIGIN: "http://localhost:5173" })).allowedOrigin).toBe(
      "http://localhost:5173",
    );
    expect(loadConfig(env({ ALLOWED_ORIGIN: "http://127.0.0.1:5173" })).allowedOrigin).toBe(
      "http://127.0.0.1:5173",
    );
  });

  it("does not extend the http exception past loopback", () => {
    expect(() => loadConfig(env({ ALLOWED_ORIGIN: "http://evil.example" }))).toThrow(
      /exact HTTPS origin/,
    );
    expect(() => loadConfig(env({ ALLOWED_ORIGIN: "http://localhost.evil.example" }))).toThrow(
      /exact HTTPS origin/,
    );
  });

  it("requires an exact HTTPS origin", () => {
    expect(() => loadConfig(env({ ALLOWED_ORIGIN: "https://a.example/path" }))).toThrow(
      /exact HTTPS origin/,
    );
    expect(() => loadConfig(env({ ALLOWED_ORIGIN: "https://a.example/path" }))).toThrow(
      /exact HTTPS origin/,
    );
  });

  it("pins the region", () => {
    expect(() => loadConfig(env({ BEDROCK_REGION: "us-east-1" }))).toThrow(
      /ap-northeast-2/,
    );
  });

  it("bounds MAX_TOKENS to what a reporter body needs", () => {
    expect(loadConfig(env({ MAX_TOKENS: "4096" })).maxTokens).toBe(4096);
    expect(() => loadConfig(env({ MAX_TOKENS: "4097" }))).toThrow(/MAX_TOKENS/);
  });

  it("keeps the model timeout inside the API Gateway budget", () => {
    expect(() => loadConfig(env({ MODEL_TIMEOUT_MS: "7001" }))).toThrow(
      /MODEL_TIMEOUT_MS/,
    );
  });

  it("reports a missing variable by name", () => {
    expect(() => loadConfig(env({ MAX_BODY_BYTES: undefined }))).toThrow(
      /MAX_BODY_BYTES is missing/,
    );
  });
});
