import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiRequest,
  createRun,
  createTestApplication,
  runRequest,
  turnRequest,
  waitForTurn,
  type TestApplication,
} from "./helpers.js";

describe("HTTP boundary security", () => {
  let app: TestApplication | undefined;
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await app?.close();
    app = undefined;
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it("enforces media type, body size, and CORS allowlists", async () => {
    app = await createTestApplication({}, { maxBodyBytes: 128 });

    const unsupported = await fetch(`${app.baseUrl}/v1/runs`, {
      method: "POST",
      headers: {
        authorization: "Bearer test-owner-key",
        "content-type": "text/plain",
        "idempotency-key": "unsupported-media-key",
      },
      body: "{}",
    });
    expect(unsupported.status).toBe(415);
    expect(await unsupported.json()).toMatchObject({
      error: { code: "unsupported_media_type" },
    });

    const oversized = await apiRequest(app, "/v1/runs", {
      method: "POST",
      body: {
        ...runRequest,
        padding: "x".repeat(512),
      },
      idempotencyKey: "oversized-request-key",
    });
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({
      error: { code: "request_too_large" },
    });

    const forbiddenOrigin = await apiRequest(app, "/v1/capabilities", {
      headers: { origin: "https://attacker.example" },
    });
    expect(forbiddenOrigin.status).toBe(403);
    expect(await forbiddenOrigin.json()).toMatchObject({
      error: { code: "origin_forbidden" },
    });

    const allowedOrigin = await apiRequest(app, "/v1/capabilities", {
      headers: { origin: "http://127.0.0.1:5173" },
    });
    expect(allowedOrigin.status).toBe(200);
    expect(allowedOrigin.headers.get("access-control-allow-origin")).toBe(
      "http://127.0.0.1:5173",
    );
  });

  it("rate-limits by authenticated owner", async () => {
    app = await createTestApplication({}, { rateLimitPerMinute: 1 });

    expect((await apiRequest(app, "/v1/capabilities")).status).toBe(200);
    const limited = await apiRequest(app, "/v1/capabilities");
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({
      error: { code: "rate_limited" },
    });
    expect((await fetch(`${app.baseUrl}/healthz`)).status).toBe(200);
  });

  it("keeps authorization and idempotency canaries out of DB, SSE, errors, and logs", async () => {
    const directory = mkdtempSync(join(tmpdir(), "arena-secret-scan-"));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, "arena.sqlite");
    const applicationKey = "arena-application-credential-canary";
    const encryptionKey =
      "arena-context-encryption-credential-canary-material";
    const runKey = "arena-run-idempotency-canary";
    const turnKey = "arena-turn-idempotency-canary";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    app = await createTestApplication(
      {},
      {
        apiKeys: [applicationKey],
        contextEncryptionKey: encryptionKey,
        databasePath,
      },
    );

    const run = await createRun(app, runKey, applicationKey);
    const acceptedResponse = await apiRequest(
      app,
      `/v1/runs/${run.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(1),
        key: applicationKey,
        idempotencyKey: turnKey,
      },
    );
    const acceptedText = await acceptedResponse.text();
    const accepted = JSON.parse(acceptedText) as { turnId: string };
    const turn = await waitForTurn(app, accepted.turnId, applicationKey);
    const eventResponse = await apiRequest(
      app,
      `/v1/turns/${accepted.turnId}/events`,
      { key: applicationKey },
    );
    const eventText = await eventResponse.text();
    const errorResponse = await apiRequest(app, "/v1/runs", {
      method: "POST",
      body: { rawModel: "not-allowed" },
      key: applicationKey,
      idempotencyKey: "arena-error-idempotency-canary",
    });
    const errorText = await errorResponse.text();

    await app.close();
    app = undefined;
    const persisted = readdirSync(directory)
      .filter((name) => name.startsWith("arena.sqlite"))
      .filter((name) => existsSync(join(directory, name)))
      .map((name) => readFileSync(join(directory, name)))
      .reduce((left, right) => Buffer.concat([left, right]), Buffer.alloc(0))
      .toString("utf8");
    const serializedSurfaces = [
      acceptedText,
      JSON.stringify(turn),
      eventText,
      errorText,
      persisted,
      JSON.stringify(consoleError.mock.calls),
      JSON.stringify(consoleWarn.mock.calls),
    ].join("\n");

    for (const canary of [
      applicationKey,
      encryptionKey,
      runKey,
      turnKey,
    ]) {
      expect(serializedSurfaces).not.toContain(canary);
    }
    expect(eventText).toContain("event: turn.completed");
    expect(errorResponse.status).toBe(400);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});
