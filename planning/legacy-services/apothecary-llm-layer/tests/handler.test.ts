import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import { describe, expect, it, vi } from "vitest";

import {
  createHandler,
  handler as defaultLambdaHandler,
} from "../src/handler.js";
import type { DialogueProvider } from "../src/dialogue-types.js";
import {
  validConfig,
  validDialogueRequest,
} from "./fixtures.js";

function dialogueProvider(): DialogueProvider {
  return {
    generate: async () => ({
      rawBeat: {
        npcLine: "생각이 많아 밤마다 잠들기가 어렵습니다.",
        choices: [
          {
            label: "무엇이 마음에 걸리시나요?",
            verb: "indirect",
            clueReveals: [],
          },
          {
            label: "빚 때문에 그러신가요?",
            verb: "direct",
            clueReveals: [],
          },
          {
            label: "[관찰] 품 안의 종이를 살핀다",
            verb: "observe",
            clueReveals: ["clue-debt-letter"],
          },
          {
            label: "[조제하러 가기]",
            verb: "craft",
            clueReveals: [],
          },
        ],
      },
      latencyMs: 10,
      usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 },
    }),
  };
}

function event(
  body: string,
  overrides: Partial<APIGatewayProxyEventV2> = {},
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "POST /ai/dialogue",
    rawPath: "/ai/dialogue",
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
      origin: "https://alstjgg.github.io",
    },
    requestContext: {
      accountId: "test",
      apiId: "test",
      domainName: "test",
      domainPrefix: "test",
      http: {
        method: "POST",
        path: "/ai/dialogue",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "request-1",
      routeKey: "POST /ai/dialogue",
      stage: "$default",
      time: "",
      timeEpoch: 0,
    },
    body,
    isBase64Encoded: false,
    ...overrides,
  };
}

function routeEvent(
  path: string,
  method: string,
  body = "",
): APIGatewayProxyEventV2 {
  const base = event(body);
  return {
    ...base,
    routeKey: `${method} ${path}`,
    rawPath: path,
    requestContext: {
      ...base.requestContext,
      routeKey: `${method} ${path}`,
      http: {
        ...base.requestContext.http,
        method,
        path,
      },
    },
  };
}

const context = {
  awsRequestId: "lambda-request-1",
} as Context;

function structured(
  result: Awaited<ReturnType<ReturnType<typeof createHandler>>>,
): APIGatewayProxyStructuredResultV2 {
  return result as APIGatewayProxyStructuredResultV2;
}

describe("Lambda HTTP handler", () => {
  it("serves the cost-free health route", async () => {
    const handler = createHandler({
      config: validConfig(),
      dialogueProvider: dialogueProvider(),
    });

    const result = structured(
      await handler(routeEvent("/ai/health", "GET"), context),
    );
    const body = JSON.parse(result.body ?? "{}") as {
      ok: boolean;
      dialogue: boolean;
      portrait: boolean;
      models: { dialogue: string; portrait: string };
    };

    expect(result.statusCode).toBe(200);
    expect(body).toEqual({
      ok: true,
      dialogue: true,
      portrait: false,
      models: {
        dialogue: validConfig().modelId,
        portrait: "pre-generated-assets",
      },
    });
  });

  it("serves validated dialogue and logs only safe telemetry", async () => {
    const logs: Record<string, unknown>[] = [];
    const handler = createHandler({
      config: validConfig(),
      dialogueProvider: dialogueProvider(),
      logger: {
        info: (value) => logs.push(value),
        warn: (value) => logs.push(value),
        error: (value) => logs.push(value),
      },
    });

    const result = structured(
      await handler(event(JSON.stringify(validDialogueRequest())), context),
    );
    const body = JSON.parse(result.body ?? "{}") as {
      npcLine: string;
      choices: Array<{ verb: string; patienceCost: number }>;
    };

    expect(result.statusCode).toBe(200);
    expect(result.headers).toMatchObject({
      "access-control-allow-origin": "https://alstjgg.github.io",
      "x-llm-fallback": "false",
      "x-request-id": "request-1",
    });
    expect(body.choices.map((choice) => choice.verb)).toEqual([
      "indirect",
      "direct",
      "observe",
      "craft",
    ]);
    expect(body.choices.map((choice) => choice.patienceCost)).toEqual([
      1, 2, 0, 0,
    ]);
    expect(JSON.stringify(logs)).not.toContain("노름빚");
    expect(JSON.stringify(logs)).not.toContain(body.npcLine);
  });

  it("supports API Gateway base64 bodies", async () => {
    const handler = createHandler({
      config: validConfig(),
      dialogueProvider: dialogueProvider(),
    });
    const encoded = Buffer.from(
      JSON.stringify(validDialogueRequest()),
    ).toString("base64");

    const result = structured(
      await handler(event(encoded, { isBase64Encoded: true }), context),
    );

    expect(result.statusCode).toBe(200);
  });

  it("returns a deterministic playable fallback when Bedrock fails", async () => {
    const failingProvider: DialogueProvider = {
      generate: async () => {
        throw new Error("provider failed with private details");
      },
    };
    const handler = createHandler({
      config: validConfig(),
      dialogueProvider: failingProvider,
    });

    const result = structured(
      await handler(event(JSON.stringify(validDialogueRequest())), context),
    );
    const body = JSON.parse(result.body ?? "{}") as {
      choices: Array<{ verb: string }>;
    };

    expect(result.statusCode).toBe(200);
    expect(result.headers).toMatchObject({ "x-llm-fallback": "true" });
    expect(body.choices.map((choice) => choice.verb)).toEqual([
      "indirect",
      "direct",
      "observe",
      "craft",
    ]);
    expect(result.body).not.toContain("private details");
  });

  it.each([
    [
      event(JSON.stringify(validDialogueRequest()), {
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
      }),
      403,
      "origin_forbidden",
    ],
    [
      event(JSON.stringify(validDialogueRequest()), {
        headers: {
          "content-type": "text/plain",
          origin: "https://alstjgg.github.io",
        },
      }),
      415,
      "unsupported_media_type",
    ],
    [
      event(JSON.stringify(validDialogueRequest()), {
        headers: {
          "content-type": "application/jsonp",
          origin: "https://alstjgg.github.io",
        },
      }),
      415,
      "unsupported_media_type",
    ],
    [event("{"), 400, "invalid_json"],
  ])("rejects invalid HTTP input", async (input, status, code) => {
    const handler = createHandler({
      config: validConfig(),
      dialogueProvider: dialogueProvider(),
    });

    const result = structured(await handler(input, context));
    const body = JSON.parse(result.body ?? "{}") as {
      error: { code: string };
    };

    expect(result.statusCode).toBe(status);
    expect(body.error.code).toBe(code);
  });

  it("rejects an oversized body before parsing JSON", async () => {
    const handler = createHandler({
      config: validConfig({ maxBodyBytes: 1_024 }),
      dialogueProvider: dialogueProvider(),
    });

    const result = structured(await handler(event("x".repeat(1_025)), context));
    const body = JSON.parse(result.body ?? "{}") as {
      error: { code: string };
    };

    expect(result.statusCode).toBe(413);
    expect(body.error.code).toBe("request_too_large");
  });

  it("rejects unconfigured routes", async () => {
    const handler = createHandler({
      config: validConfig(),
      dialogueProvider: dialogueProvider(),
    });

    const result = structured(
      await handler(routeEvent("/not-configured", "POST", "{}"), context),
    );
    const body = JSON.parse(result.body ?? "{}") as {
      error: { code: string };
    };

    expect(result.statusCode).toBe(404);
    expect(body.error.code).toBe("not_found");
  });

  it("fails closed with a safe response when cold-start config is invalid", async () => {
    const previousRegion = process.env.BEDROCK_REGION;
    delete process.env.BEDROCK_REGION;
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const result = structured(
        await defaultLambdaHandler(
          event(JSON.stringify(validDialogueRequest())),
          context,
        ),
      );
      const body = JSON.parse(result.body ?? "{}") as {
        error: { code: string; message: string };
      };

      expect(result.statusCode).toBe(500);
      expect(body.error).toEqual({
        code: "invalid_config",
        message: "The service configuration is invalid.",
        requestId: "request-1",
      });
    } finally {
      errorLog.mockRestore();
      if (previousRegion === undefined) {
        delete process.env.BEDROCK_REGION;
      } else {
        process.env.BEDROCK_REGION = previousRegion;
      }
    }
  });
});
