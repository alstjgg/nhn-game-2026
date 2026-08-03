import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { describe, expect, it, vi } from "vitest";

import { CallService } from "../src/call-service.js";
import { createHandler, handler as lambdaHandler } from "../src/handler.js";
import type { CallProvider } from "../src/provider.js";
import { PublicError } from "../src/errors.js";
import {
  ALLOWED_ORIGIN,
  context,
  event,
  validCallBody,
  validConfig,
} from "./fixtures.js";

/** Transport-level behavior. Rendering and fallback live in their own files. */

const silentLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const JUDGMENT_OK = {
  inner_note: "숨소리가 걸린다.",
  stance: "a",
  because_referent: "회선 A의 발신자를 두고 판단했다.",
  because_block_ids: [],
  rejected_stance: "b",
  rejected_reason: "확인이 먼저면 끊긴다.",
  utterance: "천천히 말해 주세요.",
};

const okProvider = (payload: unknown = JUDGMENT_OK): CallProvider => ({
  generate: async () => ({
    payload,
    latencyMs: 12,
    usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
  }),
});

const failingProvider = (error: unknown): CallProvider => ({
  generate: async () => {
    throw error;
  },
});

function build(provider: CallProvider = okProvider()) {
  return createHandler({
    config: validConfig,
    callService: new CallService(validConfig, provider),
    logger: silentLogger,
  });
}

const result = (r: unknown) => r as APIGatewayProxyStructuredResultV2;
const body = (r: unknown) => JSON.parse(result(r).body ?? "{}");

describe("DDAY proxy HTTP skeleton", () => {
  it("serves the cost-free health route", async () => {
    const res = result(
      await build()(
        event("", {
          rawPath: "/dday/health",
          requestContext: {
            ...event("").requestContext,
            http: { ...event("").requestContext.http, method: "GET", path: "/dday/health" },
          },
        }),
        context,
      ),
    );
    expect(res.statusCode).toBe(200);
    expect(body(res).ok).toBe(true);
    expect(res.headers?.["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  });

  it("rejects a foreign origin before doing anything else", async () => {
    const res = result(
      await build()(
        event(validCallBody, {
          headers: { "content-type": "application/json", origin: "https://evil.example" },
        }),
        context,
      ),
    );
    expect(res.statusCode).toBe(403);
    expect(body(res).error.code).toBe("origin_forbidden");
  });

  it("rejects a non-JSON content type", async () => {
    const res = result(
      await build()(
        event(validCallBody, {
          headers: { "content-type": "text/plain", origin: ALLOWED_ORIGIN },
        }),
        context,
      ),
    );
    expect(res.statusCode).toBe(415);
  });

  it("rejects an oversized body before parsing JSON", async () => {
    const huge = "x".repeat(validConfig.maxBodyBytes + 1);
    const res = result(await build()(event(huge), context));
    expect(res.statusCode).toBe(413);
    expect(body(res).error.code).toBe("request_too_large");
  });

  it("rejects malformed JSON", async () => {
    const res = result(await build()(event("{"), context));
    expect(res.statusCode).toBe(400);
    expect(body(res).error.code).toBe("invalid_json");
  });

  it("supports API Gateway base64 bodies", async () => {
    const res = result(
      await build()(
        event(Buffer.from(validCallBody, "utf8").toString("base64"), {
          isBase64Encoded: true,
        }),
        context,
      ),
    );
    expect(res.statusCode).toBe(200);
  });

  it("rejects an unknown call_type", async () => {
    const res = result(
      await build()(
        event(JSON.stringify({ call_type: "grader", template_version: "v0.4", slots: {} })),
        context,
      ),
    );
    expect(res.statusCode).toBe(400);
    expect(body(res).error.message).toMatch(/judgment, narration, reporter/);
  });

  it("rejects a malformed template_version", async () => {
    const res = result(
      await build()(
        event(JSON.stringify({ call_type: "judgment", template_version: "latest", slots: {} })),
        context,
      ),
    );
    expect(res.statusCode).toBe(400);
  });

  it("rejects unconfigured routes", async () => {
    const res = result(
      await build()(event(validCallBody, { rawPath: "/ai/dialogue" }), context),
    );
    expect(res.statusCode).toBe(404);
  });

  it("serves a validated judgment and marks it not-a-fallback", async () => {
    const res = result(await build()(event(validCallBody), context));
    expect(res.statusCode).toBe(200);
    expect(body(res).stance).toBe("a");
    expect(res.headers?.["x-llm-fallback"]).toBe("false");
  });

  // Engine spec §5: the engine owns every fallback (two of the three need
  // gates.json or the objective log). This tier's job is to say so in headers.
  it("flags a provider failure with the fallback headers", async () => {
    const res = result(
      await build(
        failingProvider(new PublicError(504, "bedrock_timeout", "too slow")),
      )(event(validCallBody), context),
    );
    expect(res.statusCode).toBe(504);
    expect(res.headers?.["x-llm-fallback"]).toBe("true");
    expect(res.headers?.["x-fallback-code"]).toBe("bedrock_timeout");
  });

  it("flags model output that fails validation as a fallback, not a 500", async () => {
    const res = result(
      await build(okProvider({ ...JUDGMENT_OK, stance: "nope" }))(
        event(validCallBody),
        context,
      ),
    );
    expect(res.statusCode).toBe(502);
    expect(res.headers?.["x-fallback-code"]).toBe("invalid_model_output");
  });

  // A malformed request must not look like a model failure: the engine would
  // absorb it with an authored default and the bug would never surface.
  it("does not mark a client-side slot error as a fallback", async () => {
    const res = result(
      await build()(
        event(
          JSON.stringify({
            call_type: "judgment",
            template_version: "v0.4",
            slots: { STANCE_SET: [{ id: "only", label: "하나" }] },
          }),
        ),
        context,
      ),
    );
    expect(res.statusCode).toBe(400);
    expect(res.headers?.["x-llm-fallback"]).toBeUndefined();
  });

  it("rejects a template version that does not exist", async () => {
    const res = result(
      await build()(
        event(JSON.stringify({ call_type: "judgment", template_version: "v9.9", slots: {} })),
        context,
      ),
    );
    expect(res.statusCode).toBe(400);
    expect(body(res).error.code).toBe("unknown_template_version");
  });

  it("fails closed, without an origin header, when cold-start config is invalid", async () => {
    const saved = process.env.BEDROCK_REGION;
    delete process.env.BEDROCK_REGION;
    try {
      const res = result(await lambdaHandler(event(validCallBody), context));
      expect(res.statusCode).toBe(500);
      expect(body(res).error.code).toBe("invalid_config");
      expect(res.headers?.["access-control-allow-origin"]).toBeUndefined();
    } finally {
      if (saved !== undefined) process.env.BEDROCK_REGION = saved;
    }
  });
});
