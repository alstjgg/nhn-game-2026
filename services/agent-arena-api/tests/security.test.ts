import { describe, expect, it } from "vitest";

import { ArenaError } from "../src/errors.js";
import {
  authenticateBearer,
  containsRuntimeSensitiveValue,
  ContextCipher,
  fingerprintSecret,
  redactSecrets,
  safeSecretEquals,
} from "../src/security.js";

function expectArenaError(
  operation: () => unknown,
  expected: { status: number; code: string },
): ArenaError {
  let caught: unknown;
  try {
    operation();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ArenaError);
  expect(caught).toMatchObject(expected);
  return caught as ArenaError;
}

describe("Bearer authentication", () => {
  it("maps a valid application token to a stable, non-secret owner ID", () => {
    const token = "arena-owner-a-super-secret";

    const ownerId = authenticateBearer(`Bearer ${token}`, [
      "arena-owner-b-super-secret",
      token,
    ]);

    expect(ownerId).toBe(fingerprintSecret(token));
    expect(ownerId).toMatch(/^[a-f0-9]{64}$/);
    expect(ownerId).not.toContain(token);
    expect(authenticateBearer(`Bearer ${token}`, [token])).toBe(ownerId);
  });

  it.each([
    [undefined, "A Bearer token is required."],
    ["Basic arena-owner-a-super-secret", "A Bearer token is required."],
    ["Bearer wrong-owner-token", "Invalid Bearer token."],
  ])("rejects missing, malformed, and unknown credentials", (header, message) => {
    const error = expectArenaError(
      () => authenticateBearer(header, ["arena-owner-a-super-secret"]),
      { status: 401, code: "unauthorized" },
    );

    expect(error.message).toBe(message);
    expect(error.message).not.toContain("arena-owner-a-super-secret");
  });

  it("compares unequal and equal secrets without throwing on length mismatch", () => {
    expect(safeSecretEquals("same-secret", "same-secret")).toBe(true);
    expect(safeSecretEquals("short", "a-much-longer-secret")).toBe(false);
    expect(safeSecretEquals("first-secret", "other-secret")).toBe(false);
  });
});

describe("secret redaction", () => {
  it("recursively redacts sensitive fields and embedded bearer/provider keys", () => {
    const arenaToken = "arena-owner-a-super-secret";
    const providerKey = "sk-ant-api03-keyless-test-canary-123456";
    const input = {
      authorization: `Bearer ${arenaToken}`,
      safe: "visible",
      nested: {
        apiKey: providerKey,
        password: "database-password",
        providerError: `request failed with Bearer ${arenaToken}`,
        detail: `provider returned ${providerKey}`,
      },
      items: [
        { access_token: arenaToken },
        `Authorization: Bearer ${arenaToken}`,
      ],
    };

    const redacted = redactSecrets(input) as typeof input;
    const serialized = JSON.stringify(redacted);

    expect(redacted.safe).toBe("visible");
    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted.nested.apiKey).toBe("[REDACTED]");
    expect(redacted.nested.password).toBe("[REDACTED]");
    expect(redacted.items[0]).toEqual({ access_token: "[REDACTED]" });
    expect(redacted.nested.providerError).toContain("Bearer [REDACTED]");
    expect(redacted.nested.detail).toContain("[REDACTED]");
    expect(serialized).not.toContain(arenaToken);
    expect(serialized).not.toContain(providerKey);
    expect(serialized).not.toContain("database-password");
  });

  it("does not mutate the value supplied by the caller", () => {
    const input = {
      nested: {
        token: "secret-value",
      },
    };

    const redacted = redactSecrets(input);

    expect(input.nested.token).toBe("secret-value");
    expect(redacted).toEqual({ nested: { token: "[REDACTED]" } });
  });

  it("preserves token telemetry while redacting singular credential fields", () => {
    expect(
      redactSecrets({
        inputTokens: 120,
        cachedInputTokens: 40,
        output_tokens: 12,
        reasoning_tokens: null,
        totalTokens: 132,
        estimatedActiveTokens: 90,
        access_token: "credential-value",
        authorizationToken: "credential-value",
      }),
    ).toEqual({
      inputTokens: 120,
      cachedInputTokens: 40,
      output_tokens: 12,
      reasoning_tokens: null,
      totalTokens: 132,
      estimatedActiveTokens: 90,
      access_token: "[REDACTED]",
      authorizationToken: "[REDACTED]",
    });
  });

  it("detects server-owned runtime values recursively without echoing them", () => {
    const runtimeValues = [
      "https://private.example.test/mcp",
      "provider-skill-id",
      "Bearer runtime-token-canary",
    ];

    expect(
      containsRuntimeSensitiveValue(
        {
          decision: {
            speech: "Use https://private.example.test/mcp directly.",
          },
        },
        runtimeValues,
      ),
    ).toBe(true);
    expect(
      containsRuntimeSensitiveValue(
        { decision: { speech: "No private resource was named." } },
        runtimeValues,
      ),
    ).toBe(false);
  });
});

describe("context encryption", () => {
  it("round-trips structured context without exposing plaintext in the envelope", () => {
    const cipher = new ContextCipher(
      "unit-test-context-encryption-key-with-sufficient-entropy",
    );
    const context = [
      {
        role: "user",
        content: "context-plaintext-canary",
        nested: { turn: 3 },
      },
    ];

    const sealed = cipher.seal(context);

    expect(sealed).not.toContain("context-plaintext-canary");
    expect(sealed).not.toBe(JSON.stringify(context));
    expect(cipher.open(sealed)).toEqual(context);
    expect(cipher.seal(context)).not.toBe(sealed);
  });

  it("authenticates ciphertext and rejects tampering or the wrong key", () => {
    const cipher = new ContextCipher(
      "unit-test-context-encryption-key-with-sufficient-entropy",
    );
    const wrongCipher = new ContextCipher(
      "different-unit-test-context-encryption-key-material",
    );
    const sealed = cipher.seal([{ role: "assistant", content: "safe" }]);
    const tamperedBytes = Buffer.from(sealed, "base64");
    const lastIndex = tamperedBytes.length - 1;
    tamperedBytes[lastIndex] = tamperedBytes[lastIndex]! ^ 0xff;
    const tampered = tamperedBytes.toString("base64");

    expectArenaError(() => cipher.open(tampered), {
      status: 500,
      code: "context_decryption_failed",
    });
    expectArenaError(() => wrongCipher.open(sealed), {
      status: 500,
      code: "context_decryption_failed",
    });
  });
});
