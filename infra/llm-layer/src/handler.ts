import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";

import {
  loadConfig,
  MODEL_LABELS,
  MODEL_REASONING_EFFORTS,
  type RuntimeConfig,
} from "./config.js";
import {
  BedrockDialogueProvider,
  createBedrockClient,
} from "./dialogue-provider.js";
import { DialogueService } from "./dialogue-service.js";
import type {
  DialogueProvider,
  DialogueTelemetry,
} from "./dialogue-types.js";
import { PublicError } from "./errors.js";

type Logger = {
  info(value: Record<string, unknown>): void;
  warn(value: Record<string, unknown>): void;
  error(value: Record<string, unknown>): void;
};

type HandlerDependencies = {
  config: RuntimeConfig;
  dialogueProvider: DialogueProvider;
  logger?: Logger;
};

const consoleLogger: Logger = {
  info: (value) => console.info(JSON.stringify(value)),
  warn: (value) => console.warn(JSON.stringify(value)),
  error: (value) => console.error(JSON.stringify(value)),
};

function jsonResponse(
  statusCode: number,
  body: unknown,
  allowedOrigin?: string,
  requestId?: string,
  extraHeaders: Record<string, string> = {},
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(requestId ? { "x-request-id": requestId } : {}),
      ...extraHeaders,
      ...(allowedOrigin
          ? {
            "access-control-allow-origin": allowedOrigin,
            "access-control-expose-headers":
              "x-request-id, x-llm-fallback, x-llm-model, x-llm-reasoning-effort, x-llm-latency-ms, x-llm-input-tokens, x-llm-output-tokens",
            vary: "origin",
          }
        : {}),
    },
    body: JSON.stringify(body),
  };
}

function eventOrigin(event: APIGatewayProxyEventV2): string | undefined {
  return event.headers.origin ?? event.headers.Origin;
}

function eventContentType(event: APIGatewayProxyEventV2): string {
  return event.headers["content-type"] ?? event.headers["Content-Type"] ?? "";
}

function decodeBody(event: APIGatewayProxyEventV2): Buffer {
  return Buffer.from(
    event.body ?? "",
    event.isBase64Encoded ? "base64" : "utf8",
  );
}

function eventPath(event: APIGatewayProxyEventV2): string {
  return event.rawPath || event.requestContext?.http?.path || "";
}

function eventMethod(event: APIGatewayProxyEventV2): string {
  return event.requestContext?.http?.method || "";
}

function parseJsonBody(
  event: APIGatewayProxyEventV2,
  config: RuntimeConfig,
): unknown {
  if (
    !/^application\/json(?:\s*;|$)/i.test(eventContentType(event).trim())
  ) {
    throw new PublicError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }

  const body = decodeBody(event);
  if (body.byteLength > config.maxBodyBytes) {
    throw new PublicError(
      413,
      "request_too_large",
      "Request body is too large.",
    );
  }

  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    throw new PublicError(
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }
}

export function createHandler({
  config,
  dialogueProvider,
  logger = consoleLogger,
}: HandlerDependencies) {
  const dialogueService = new DialogueService(config, dialogueProvider);

  return async (
    event: APIGatewayProxyEventV2,
    context: Context,
  ): Promise<APIGatewayProxyResultV2> => {
    const requestId =
      event.requestContext?.requestId || context.awsRequestId || "unknown";
    const path = eventPath(event);
    const method = eventMethod(event);

    try {
      if (eventOrigin(event) !== config.allowedOrigin) {
        throw new PublicError(
          403,
          "origin_forbidden",
          "Request origin is not allowed.",
        );
      }

      if (method === "GET" && path === "/ai/health") {
        return jsonResponse(
          200,
          {
            ok: true,
            dialogue: true,
            portrait: false,
            models: {
              dialogue: config.modelId,
              portrait: "pre-generated-assets",
            },
            inference: {
              default: {
                modelId: config.modelId,
                reasoningEffort: "off",
              },
              models: config.allowedModelIds.map((modelId) => ({
                id: modelId,
                label: MODEL_LABELS[modelId] ?? modelId,
                reasoningEfforts:
                  MODEL_REASONING_EFFORTS[modelId] ?? ["off"],
              })),
            },
          },
          config.allowedOrigin,
          requestId,
        );
      }

      if (method !== "POST" || path !== "/ai/dialogue") {
        throw new PublicError(404, "not_found", "Route not found.");
      }

      const value = parseJsonBody(event, config);
      const result = await dialogueService.handle(value);
      const telemetry: DialogueTelemetry = result.telemetry;
      logger.info({
        event: "llm_dialogue",
        requestId,
        status: 200,
        ...telemetry,
      });
      return jsonResponse(
        200,
        result.response,
        config.allowedOrigin,
        requestId,
        {
          "x-llm-fallback": String(telemetry.fallback),
          "x-llm-model": telemetry.model,
          "x-llm-reasoning-effort": telemetry.reasoningEffort,
          "x-llm-latency-ms": String(telemetry.latencyMs),
          "x-llm-input-tokens": String(telemetry.inputTokens),
          "x-llm-output-tokens": String(telemetry.outputTokens),
        },
      );
    } catch (error) {
      const publicError =
        error instanceof PublicError
          ? error
          : new PublicError(
              500,
              "internal_error",
              "The request could not be processed.",
            );
      logger.warn({
        event: "llm_request_rejected",
        requestId,
        route:
          path === "/ai/dialogue"
            ? "dialogue"
            : path === "/ai/health"
              ? "health"
              : "unknown",
        status: publicError.status,
        code: publicError.code,
      });
      return jsonResponse(
        publicError.status,
        {
          error: {
            code: publicError.code,
            message: publicError.message,
            requestId,
          },
        },
        config.allowedOrigin,
        requestId,
      );
    }
  };
}

let defaultHandler:
  | ReturnType<typeof createHandler>
  | undefined;

function runtimeHandler(): ReturnType<typeof createHandler> {
  if (!defaultHandler) {
    const config = loadConfig(process.env);
    const client = createBedrockClient(config);
    const dialogueProvider = new BedrockDialogueProvider(client, config);
    defaultHandler = createHandler({ config, dialogueProvider });
  }
  return defaultHandler;
}

export async function handler(
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> {
  try {
    return await runtimeHandler()(event, context);
  } catch {
    consoleLogger.error({
      event: "llm_layer_init_failed",
      requestId:
        event.requestContext?.requestId || context.awsRequestId || "unknown",
      code: "invalid_config",
    });
    const requestId =
      event.requestContext?.requestId || context.awsRequestId || "unknown";
    return jsonResponse(
      500,
      {
        error: {
          code: "invalid_config",
          message: "The service configuration is invalid.",
          requestId,
        },
      },
      undefined,
      requestId,
    );
  }
}
