import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";

import { CallService, FallbackError } from "./call-service.js";
import { loadConfig, type RuntimeConfig } from "./config.js";
import { PublicError } from "./errors.js";
import { BedrockCallProvider, createBedrockClient } from "./provider.js";
import { isCallType, type CallRequest } from "./types.js";

/**
 * HTTP skeleton, copied from `apothecary-llm-layer/src/handler.ts`: the origin
 * check, content-type gate, body-size limit, error envelope, and the
 * `x-llm-fallback` header that engine spec §5 rides on.
 *
 * One route, not three. The three call types share every part of this path —
 * auth, validation, timeout, fallback — and differ only in an output schema, so
 * three routes would be three copies of the same handler with one line changed.
 * `call_type` travels in the body. (Physical architecture §3.6's table says
 * "routes", plural; it is being corrected to match this.)
 */

type Logger = {
  info(value: Record<string, unknown>): void;
  warn(value: Record<string, unknown>): void;
  error(value: Record<string, unknown>): void;
};

type HandlerDependencies = {
  config: RuntimeConfig;
  callService: CallService;
  logger?: Logger;
};

const CALL_ROUTE = "/dday/call";
const HEALTH_ROUTE = "/dday/health";

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
  if (!/^application\/json(?:\s*;|$)/i.test(eventContentType(event).trim())) {
    throw new PublicError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }

  const body = decodeBody(event);
  if (body.byteLength > config.maxBodyBytes) {
    throw new PublicError(413, "request_too_large", "Request body is too large.");
  }

  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    throw new PublicError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

/** Envelope shape only. The per-call-type slot contract belongs to CallService. */
function parseCallRequest(value: unknown): CallRequest {
  if (typeof value !== "object" || value === null) {
    throw new PublicError(400, "invalid_request", "Body must be a JSON object.");
  }
  const body = value as Record<string, unknown>;

  if (!isCallType(body.call_type)) {
    throw new PublicError(
      400,
      "invalid_request",
      "call_type must be one of: judgment, narration, reporter.",
    );
  }
  if (
    typeof body.template_version !== "string" ||
    !/^v[0-9]+\.[0-9]+$/.test(body.template_version)
  ) {
    throw new PublicError(
      400,
      "invalid_request",
      "template_version must look like v0.4.",
    );
  }
  if (
    typeof body.slots !== "object" ||
    body.slots === null ||
    Array.isArray(body.slots)
  ) {
    throw new PublicError(400, "invalid_request", "slots must be an object.");
  }

  return {
    call_type: body.call_type,
    template_version: body.template_version,
    slots: body.slots as Record<string, unknown>,
  };
}

export function createHandler({
  config,
  callService,
  logger = consoleLogger,
}: HandlerDependencies) {
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

      if (method === "GET" && path === HEALTH_ROUTE) {
        return jsonResponse(
          200,
          { ok: true, model: config.modelId, calls: true },
          config.allowedOrigin,
          requestId,
        );
      }

      if (method !== "POST" || path !== CALL_ROUTE) {
        throw new PublicError(404, "not_found", "Route not found.");
      }

      const request = parseCallRequest(parseJsonBody(event, config));
      const result = await callService.handle(request);
      logger.info({
        event: "dday_call",
        requestId,
        status: 200,
        ...result.telemetry,
      });
      return jsonResponse(
        200,
        result.response,
        config.allowedOrigin,
        requestId,
        { "x-llm-fallback": String(result.telemetry.fallback) },
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
      // A model-side failure is not the same event as a bad request: the engine
      // answers it by applying its own authored fallback (engine spec §5), so it
      // is flagged in headers rather than left for the caller to infer from a
      // status code. See call-service.ts for why this tier does not build the
      // substitute itself.
      const isFallback = error instanceof FallbackError;
      logger.warn({
        event: isFallback ? "dday_call_fallback" : "dday_request_rejected",
        requestId,
        route:
          path === CALL_ROUTE ? "call" : path === HEALTH_ROUTE ? "health" : "unknown",
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
        isFallback
          ? { "x-llm-fallback": "true", "x-fallback-code": publicError.code }
          : {},
      );
    }
  };
}

let defaultHandler: ReturnType<typeof createHandler> | undefined;

function runtimeHandler(): ReturnType<typeof createHandler> {
  if (!defaultHandler) {
    const config = loadConfig(process.env);
    const client = createBedrockClient(config);
    defaultHandler = createHandler({
      config,
      callService: new CallService(config, new BedrockCallProvider(client, config)),
    });
  }
  return defaultHandler;
}

export async function handler(
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> {
  const requestId =
    event.requestContext?.requestId || context.awsRequestId || "unknown";
  try {
    return await runtimeHandler()(event, context);
  } catch {
    // Cold-start config failure. Fail closed, and do not echo an allowed origin
    // we could not validate.
    consoleLogger.error({
      event: "dday_proxy_init_failed",
      requestId,
      code: "invalid_config",
    });
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
