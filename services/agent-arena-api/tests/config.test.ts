import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config.js";

const strongApplicationKey =
  "configured-application-key-with-at-least-32-bytes";
const strongContextKey =
  "production-context-encryption-key-with-enough-material";

describe("production configuration", () => {
  it("fails closed without application credentials", () => {
    expect(() =>
      loadConfig({
        nodeEnv: "production",
        apiKeys: [],
        contextEncryptionKey: strongContextKey,
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 500,
        code: "invalid_configuration",
      }),
    );
  });

  it("fails closed with a short context encryption key", () => {
    expect(() =>
      loadConfig({
        nodeEnv: "production",
        apiKeys: [strongApplicationKey],
        contextEncryptionKey: "too-short",
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 500,
        code: "invalid_configuration",
      }),
    );
  });

  it("accepts explicit production secrets without exposing them in config errors", () => {
    const config = loadConfig({
      nodeEnv: "production",
      apiKeys: [strongApplicationKey],
      contextEncryptionKey: strongContextKey,
      databasePath: ":memory:",
    });

    expect(config.nodeEnv).toBe("production");
    expect(config.apiKeys).toHaveLength(1);
    expect(config.contextEncryptionKey.length).toBeGreaterThanOrEqual(24);
  });

  it("rejects weak or placeholder production application keys", () => {
    for (const apiKey of [
      "short-key",
      "change-me-with-padding-change-me-123",
      "replace-with-a-long-random-team-key",
    ]) {
      expect(() =>
        loadConfig({
          nodeEnv: "production",
          apiKeys: [apiKey],
          contextEncryptionKey: strongContextKey,
        }),
      ).toThrowError(
        expect.objectContaining({
          status: 500,
          code: "invalid_configuration",
        }),
      );
    }
  });
});

describe("network binding configuration", () => {
  it("allows local development defaults only on a loopback host", () => {
    const config = loadConfig({
      nodeEnv: "development",
      host: "127.0.0.1",
      apiKeys: [],
      contextEncryptionKey: "",
      databasePath: ":memory:",
    });

    expect(config.apiKeys).toEqual(["dev-local-key"]);
    expect(config.contextEncryptionKey).toBe("development-only-context-key");
  });

  it("fails closed on a non-loopback host without explicit strong secrets", () => {
    expect(() =>
      loadConfig({
        nodeEnv: "development",
        host: "0.0.0.0",
        apiKeys: [],
        contextEncryptionKey: "",
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 500,
        code: "invalid_configuration",
      }),
    );
  });

  it("does not mistake a hostname beginning with 127 for loopback", () => {
    expect(() =>
      loadConfig({
        nodeEnv: "development",
        host: "127.attacker.example",
        apiKeys: [],
        contextEncryptionKey: "",
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 500,
        code: "invalid_configuration",
      }),
    );
  });

  it("accepts a non-loopback host only with explicit strong secrets", () => {
    const config = loadConfig({
      nodeEnv: "development",
      host: "0.0.0.0",
      apiKeys: [strongApplicationKey],
      contextEncryptionKey: strongContextKey,
      databasePath: ":memory:",
    });

    expect(config.host).toBe("0.0.0.0");
    expect(config.apiKeys).toEqual([strongApplicationKey]);
  });
});
