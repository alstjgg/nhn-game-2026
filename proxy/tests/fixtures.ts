import type { APIGatewayProxyEventV2 } from "aws-lambda";

import type { RuntimeConfig } from "../src/config.js";

export const ALLOWED_ORIGIN = "https://alstjgg.github.io";

export const validEnv = {
  BEDROCK_REGION: "ap-northeast-2",
  MODEL_ID: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  ALLOWED_MODEL_IDS: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  MAX_TOKENS: "2048",
  MODEL_TIMEOUT_MS: "7000",
  ALLOWED_ORIGIN,
  MAX_BODY_BYTES: "131072",
} satisfies NodeJS.ProcessEnv;

export const validConfig: RuntimeConfig = {
  region: "ap-northeast-2",
  modelId: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  allowedModelIds: ["global.anthropic.claude-haiku-4-5-20251001-v1:0"],
  maxTokens: 2048,
  modelTimeoutMs: 7000,
  allowedOrigin: ALLOWED_ORIGIN,
  maxBodyBytes: 131072,
};

export const judgmentSlots = {
  TEMPERAMENT: "기록된 것을 믿는다.",
  TIMELINE_EXCERPT: ["09:40 회선 A 착신."],
  BLOCKS: [{ id: "f1", text: "겁내고 있다." }],
  GATE_QUESTION: "첫 마디로 무엇을 하는가?",
  STANCE_SET: [
    { id: "a", label: "듣는다" },
    { id: "b", label: "확인한다" },
  ],
};

export const validCallBody = JSON.stringify({
  call_type: "judgment",
  template_version: "v0.4",
  slots: judgmentSlots,
});

export function event(
  body: string,
  overrides: Partial<APIGatewayProxyEventV2> = {},
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "POST /dday/call",
    rawPath: "/dday/call",
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
      origin: ALLOWED_ORIGIN,
    },
    requestContext: {
      accountId: "141840355276",
      apiId: "test",
      domainName: "test",
      domainPrefix: "test",
      requestId: "test-request",
      routeKey: "POST /dday/call",
      stage: "$default",
      time: "01/Jan/2026:00:00:00 +0000",
      timeEpoch: 1767225600000,
      http: {
        method: "POST",
        path: "/dday/call",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
    },
    body,
    isBase64Encoded: false,
    ...overrides,
  } as APIGatewayProxyEventV2;
}

export const context = { awsRequestId: "test-context" } as never;
