import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer, type IncomingHttpHeaders } from "node:http";

import {
  HAIKU_MODEL_ID,
  NOVA_MODEL_ID,
  loadConfig,
} from "../src/config.js";
import {
  BedrockDialogueProvider,
  createBedrockClient,
} from "../src/dialogue-provider.js";
import { createHandler } from "../src/handler.js";

const hostname = "127.0.0.1";
const port = Number(process.env.LOCAL_AI_PORT ?? "8792");

process.env.BEDROCK_REGION ??= "ap-northeast-2";
process.env.MODEL_ID ??= NOVA_MODEL_ID;
process.env.ALLOWED_MODEL_IDS ??= `${NOVA_MODEL_ID},${HAIKU_MODEL_ID}`;
process.env.MAX_TOKENS ??= "400";
process.env.MODEL_TIMEOUT_MS ??= "22000";
process.env.ALLOWED_ORIGIN ??= "https://alstjgg.github.io";
process.env.MAX_BODY_BYTES ??= "32768";

interface ProcessCredentials {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken?: string;
}

/**
 * AWS CLI v2 can refresh an SSO role even when the JS SDK's cached SSO token
 * has expired. Keep the bridge local-only and in-memory: no credential value is
 * printed or written to disk.
 */
function bridgeCliCredentials(): void {
  const profile = process.env.AWS_PROFILE;
  if (profile === undefined || process.env.AWS_ACCESS_KEY_ID !== undefined) {
    return;
  }
  const raw = execFileSync(
    "aws",
    [
      "configure",
      "export-credentials",
      "--profile",
      profile,
      "--format",
      "process",
    ],
    { encoding: "utf8" },
  );
  const credentials = JSON.parse(raw) as ProcessCredentials;
  if (
    typeof credentials.AccessKeyId !== "string" ||
    typeof credentials.SecretAccessKey !== "string"
  ) {
    throw new Error(`AWS profile ${profile} did not export usable credentials.`);
  }
  process.env.AWS_ACCESS_KEY_ID = credentials.AccessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = credentials.SecretAccessKey;
  if (typeof credentials.SessionToken === "string") {
    process.env.AWS_SESSION_TOKEN = credentials.SessionToken;
  }
  // The Node provider currently prefers AWS_PROFILE when both sources exist,
  // which would route straight back to the expired JS SSO cache.
  delete process.env.AWS_PROFILE;
}

bridgeCliCredentials();

const deployedConfig = loadConfig(process.env);
const localTimeoutMs = Number(
  process.env.LOCAL_MODEL_TIMEOUT_MS ?? deployedConfig.modelTimeoutMs,
);
if (
  !Number.isSafeInteger(localTimeoutMs) ||
  localTimeoutMs < deployedConfig.modelTimeoutMs ||
  localTimeoutMs > 300_000
) {
  throw new Error(
    "LOCAL_MODEL_TIMEOUT_MS must be an integer from the deployed timeout through 300000.",
  );
}
const localConfig = {
  ...deployedConfig,
  modelTimeoutMs: localTimeoutMs,
};
const bedrockClient = createBedrockClient(localConfig);
const localHandler = createHandler({
  config: localConfig,
  dialogueProvider: new BedrockDialogueProvider(bedrockClient, localConfig),
});

function flatHeaders(
  headers: IncomingHttpHeaders,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).flatMap(([name, value]) => {
      if (value === undefined) return [];
      return [[name, Array.isArray(value) ? value.join(", ") : value]];
    }),
  );
}

function context(requestId: string): Context {
  return {
    awsRequestId: requestId,
    callbackWaitsForEmptyEventLoop: false,
    functionName: "nan2026-local-turn",
    functionVersion: "$LATEST",
    invokedFunctionArn: "arn:aws:lambda:local:0:function:nan2026-local-turn",
    logGroupName: "/aws/lambda/nan2026-local-turn",
    logStreamName: "local",
    memoryLimitInMB: "512",
    getRemainingTimeInMillis: () => 25_000,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
  };
}

const server = createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  const url = new URL(request.url ?? "/", `http://${hostname}:${port}`);
  const requestId = randomUUID();
  const method = request.method ?? "GET";
  const headers = flatHeaders(request.headers);
  const event: APIGatewayProxyEventV2 = {
    version: "2.0",
    routeKey: `${method} ${url.pathname}`,
    rawPath: url.pathname,
    rawQueryString: url.searchParams.toString(),
    headers,
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: hostname,
      domainPrefix: "local",
      http: {
        method,
        path: url.pathname,
        protocol: `HTTP/${request.httpVersion}`,
        sourceIp: request.socket.remoteAddress ?? hostname,
        userAgent: headers["user-agent"] ?? "",
      },
      requestId,
      routeKey: `${method} ${url.pathname}`,
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    ...(body === "" ? {} : { body }),
    isBase64Encoded: false,
  };

  try {
    const rawResult = await localHandler(event, context(requestId));
    if (typeof rawResult === "string") {
      response.statusCode = 200;
      response.end(rawResult);
      return;
    }
    const result = rawResult as APIGatewayProxyStructuredResultV2;
    response.statusCode = result.statusCode ?? 200;
    for (const [name, value] of Object.entries(result.headers ?? {})) {
      if (value !== undefined) response.setHeader(name, String(value));
    }
    response.end(result.body ?? "");
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ error: { code: "local_runtime_error" } }));
  }
});

server.listen(port, hostname, () => {
  console.info(`Local Lambda adapter listening at http://${hostname}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      bedrockClient.destroy();
      process.exit(0);
    });
  });
}
