import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import type { ArenaConfig } from "./config.js";
import { asArenaError, ArenaError } from "./errors.js";
import { createId } from "./identifiers.js";
import { authenticateBearer, redactSecrets } from "./security.js";
import { ArenaService } from "./service.js";
import type { TraceEvent } from "./types.js";
import {
  parseCreateRunInput,
  parseEmptyObject,
  parseLoadoutInput,
  parseTurnInput,
} from "./validation.js";

type RouteMatch = {
  runId?: string;
  agentId?: string;
  turnId?: string;
};

type RateEntry = {
  startedAt: number;
  count: number;
};

class OwnerRateLimiter {
  readonly #limit: number;
  readonly #entries = new Map<string, RateEntry>();

  constructor(limit: number) {
    this.#limit = limit;
  }

  consume(ownerId: string): void {
    const now = Date.now();
    const current = this.#entries.get(ownerId);
    const entry =
      current === undefined || now - current.startedAt >= 60_000
        ? { startedAt: now, count: 0 }
        : current;
    entry.count += 1;
    this.#entries.set(ownerId, entry);
    if (entry.count > this.#limit) {
      throw new ArenaError(
        429,
        "rate_limited",
        "Request rate limit exceeded.",
      );
    }
  }
}

function match(
  pathname: string,
  pattern: RegExp,
  names: Array<keyof RouteMatch>,
): RouteMatch | null {
  const result = pattern.exec(pathname);
  if (result === null) {
    return null;
  }
  return Object.fromEntries(
    names.map((name, index) => [name, decodeURIComponent(result[index + 1]!)]),
  );
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): void {
  if (response.writableEnded) {
    return;
  }
  const payload = JSON.stringify(redactSecrets(body));
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": String(Buffer.byteLength(payload)),
    "cache-control": "no-store",
    ...extraHeaders,
  });
  response.end(payload);
}

async function readJsonBody(
  request: IncomingMessage,
  maxBytes: number,
  allowEmptyBody = false,
): Promise<unknown> {
  const contentType = request.headers["content-type"] ?? "";
  const isJson = contentType.toLowerCase().startsWith("application/json");
  if (!isJson && !allowEmptyBody) {
    throw new ArenaError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new ArenaError(
        413,
        "request_too_large",
        "Request body exceeds the configured limit.",
      );
    }
    chunks.push(buffer);
  }
  if (chunks.length === 0) {
    return {};
  }
  if (!isJson) {
    throw new ArenaError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new ArenaError(
      400,
      "invalid_json",
      "Request body is not valid JSON.",
    );
  }
}

function parseLastEventId(request: IncomingMessage, url: URL): number {
  const raw =
    request.headers["last-event-id"] ??
    url.searchParams.get("after") ??
    "0";
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ArenaError(
      400,
      "invalid_event_cursor",
      "Last-Event-ID must be a non-negative integer.",
    );
  }
  return value;
}

function requireIdempotencyKey(request: IncomingMessage): string {
  const value = request.headers["idempotency-key"];
  if (value === undefined || Array.isArray(value)) {
    throw new ArenaError(
      400,
      "idempotency_key_required",
      "Idempotency-Key header is required.",
    );
  }
  return value;
}

function writeSseEvent(response: ServerResponse, event: TraceEvent): void {
  response.write(`id: ${event.sequence}\n`);
  response.write(`event: ${event.type}\n`);
  response.write(
    `data: ${JSON.stringify({
      turnId: event.turnId,
      sequence: event.sequence,
      type: event.type,
      createdAt: event.createdAt,
      data: redactSecrets(event.safeData),
    })}\n\n`,
  );
}

export class ArenaHttpServer {
  readonly #config: ArenaConfig;
  readonly #service: ArenaService;
  readonly #server: Server;
  readonly #limiter: OwnerRateLimiter;

  constructor(config: ArenaConfig, service: ArenaService) {
    this.#config = config;
    this.#service = service;
    this.#limiter = new OwnerRateLimiter(config.rateLimitPerMinute);
    this.#server = createServer((request, response) => {
      void this.#handle(request, response);
    });
    this.#server.requestTimeout = 30_000;
    this.#server.headersTimeout = 10_000;
    this.#server.keepAliveTimeout = 5_000;
  }

  async listen(port = this.#config.port, host = this.#config.host): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => {
        this.#server.off("listening", onListening);
        reject(error);
      };
      const onListening = (): void => {
        this.#server.off("error", onError);
        resolve();
      };
      this.#server.once("error", onError);
      this.#server.once("listening", onListening);
      this.#server.listen(port, host);
    });
  }

  address(): ReturnType<Server["address"]> {
    return this.#server.address();
  }

  async close(): Promise<void> {
    if (!this.#server.listening) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      this.#server.close((error) => {
        if (error === undefined) {
          resolve();
        } else {
          reject(error);
        }
      });
    });
  }

  async #handle(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const traceId = createId("http");
    try {
      this.#applyCors(request, response);
      if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
      }
      const url = new URL(request.url ?? "/", "http://arena.invalid");
      if (request.method === "GET" && url.pathname === "/healthz") {
        sendJson(response, 200, { status: "ok" });
        return;
      }
      if (request.method === "GET" && url.pathname === "/readyz") {
        sendJson(response, 200, { status: "ready" });
        return;
      }

      const ownerId = authenticateBearer(
        request.headers.authorization,
        this.#config.apiKeys,
      );
      this.#limiter.consume(ownerId);

      if (request.method === "GET" && url.pathname === "/v1/capabilities") {
        sendJson(response, 200, this.#service.capabilities());
        return;
      }
      if (request.method === "POST" && url.pathname === "/v1/runs") {
        const input = parseCreateRunInput(
          await readJsonBody(request, this.#config.maxBodyBytes),
        );
        sendJson(
          response,
          201,
          this.#service.createRun(
            ownerId,
            input,
            requireIdempotencyKey(request),
          ),
        );
        return;
      }

      const loadoutRoute = match(
        url.pathname,
        /^\/v1\/runs\/([^/]+)\/agents\/([^/]+)\/loadout$/,
        ["runId", "agentId"],
      );
      if (request.method === "PUT" && loadoutRoute !== null) {
        const input = parseLoadoutInput(
          loadoutRoute.agentId!,
          await readJsonBody(request, this.#config.maxBodyBytes),
        );
        const snapshot = this.#service.snapshotLoadout(input);
        const session = this.#service.updateLoadout(
          ownerId,
          loadoutRoute.runId!,
          loadoutRoute.agentId!,
          snapshot,
        );
        sendJson(response, 200, {
          runId: session.runId,
          agentId: session.agentId,
          arenaSessionId: session.id,
          generation: session.generation,
          loadout: {
            promptCardIds: session.loadout.promptCardIds,
            skillCardIds: session.loadout.skillCardIds,
            mcpCardIds: session.loadout.mcpCardIds,
          },
        });
        return;
      }

      const turnCreateRoute = match(
        url.pathname,
        /^\/v1\/runs\/([^/]+)\/turns$/,
        ["runId"],
      );
      if (request.method === "POST" && turnCreateRoute !== null) {
        const input = parseTurnInput(
          await readJsonBody(request, this.#config.maxBodyBytes),
        );
        const idempotencyKey = requireIdempotencyKey(request);
        sendJson(
          response,
          202,
          this.#service.createTurn(
            ownerId,
            turnCreateRoute.runId!,
            input,
            idempotencyKey,
          ),
        );
        return;
      }

      const turnRoute = match(url.pathname, /^\/v1\/turns\/([^/]+)$/, [
        "turnId",
      ]);
      if (request.method === "GET" && turnRoute !== null) {
        sendJson(response, 200, this.#service.getTurn(ownerId, turnRoute.turnId!));
        return;
      }

      const eventRoute = match(
        url.pathname,
        /^\/v1\/turns\/([^/]+)\/events$/,
        ["turnId"],
      );
      if (request.method === "GET" && eventRoute !== null) {
        await this.#streamEvents(
          request,
          response,
          url,
          ownerId,
          eventRoute.turnId!,
        );
        return;
      }

      const compactRoute = match(
        url.pathname,
        /^\/v1\/runs\/([^/]+)\/agents\/([^/]+)\/compact$/,
        ["runId", "agentId"],
      );
      if (request.method === "POST" && compactRoute !== null) {
        parseEmptyObject(
          await readJsonBody(request, this.#config.maxBodyBytes, true),
          "compact",
        );
        sendJson(
          response,
          200,
          await this.#service.compact(
            ownerId,
            compactRoute.runId!,
            compactRoute.agentId!,
            requireIdempotencyKey(request),
          ),
        );
        return;
      }

      const clearRoute = match(
        url.pathname,
        /^\/v1\/runs\/([^/]+)\/agents\/([^/]+)\/clear$/,
        ["runId", "agentId"],
      );
      if (request.method === "POST" && clearRoute !== null) {
        parseEmptyObject(
          await readJsonBody(request, this.#config.maxBodyBytes, true),
          "clear",
        );
        sendJson(
          response,
          200,
          await this.#service.clear(
            ownerId,
            clearRoute.runId!,
            clearRoute.agentId!,
            requireIdempotencyKey(request),
          ),
        );
        return;
      }

      throw new ArenaError(404, "not_found", "Route not found.");
    } catch (error) {
      const arenaError = asArenaError(error);
      sendJson(response, arenaError.status, {
        error: {
          code: arenaError.code,
          message: arenaError.message,
          traceId,
          ...(arenaError.safeDetails === undefined
            ? {}
            : { details: arenaError.safeDetails }),
        },
      });
    }
  }

  async #streamEvents(
    request: IncomingMessage,
    response: ServerResponse,
    url: URL,
    ownerId: string,
    turnId: string,
  ): Promise<void> {
    const requestedAfter = parseLastEventId(request, url);
    const allAtOpen = this.#service.getEvents(ownerId, turnId, 0);
    const maximumAtOpen = allAtOpen.at(-1)?.sequence ?? 0;
    if (requestedAfter > maximumAtOpen) {
      throw new ArenaError(
        409,
        "invalid_event_cursor",
        "Event cursor is ahead of the persisted stream.",
      );
    }

    response.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    response.flushHeaders();

    let lastSent = requestedAfter;
    let replaying = true;
    let ended = false;
    const pending: TraceEvent[] = [];
    const terminal = new Set(["turn.completed", "turn.failed"]);

    const finish = (): void => {
      if (ended) {
        return;
      }
      ended = true;
      clearInterval(heartbeat);
      unsubscribe();
      if (!response.writableEnded) {
        response.end();
      }
    };
    const deliver = (event: TraceEvent): void => {
      if (event.sequence <= lastSent || ended) {
        return;
      }
      lastSent = event.sequence;
      writeSseEvent(response, event);
      if (terminal.has(event.type)) {
        finish();
      }
    };
    const unsubscribe = this.#service.subscribe(ownerId, turnId, (event) => {
      if (replaying) {
        pending.push(event);
      } else {
        deliver(event);
      }
    });
    const heartbeat = setInterval(() => {
      if (!ended) {
        response.write(": heartbeat\n\n");
      }
    }, 15_000);
    heartbeat.unref();
    request.once("close", finish);

    for (const event of this.#service.getEvents(ownerId, turnId, requestedAfter)) {
      deliver(event);
    }
    replaying = false;
    for (const event of pending.sort(
      (left, right) => left.sequence - right.sequence,
    )) {
      deliver(event);
    }
    const turn = this.#service.getTurn(ownerId, turnId);
    if (
      !ended &&
      (turn.status === "completed" || turn.status === "failed")
    ) {
      finish();
    }
  }

  #applyCors(request: IncomingMessage, response: ServerResponse): void {
    const origin = request.headers.origin;
    if (origin === undefined) {
      return;
    }
    if (!this.#config.corsOrigins.includes(origin)) {
      throw new ArenaError(403, "origin_forbidden", "Origin is not allowed.");
    }
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "Origin");
    response.setHeader(
      "access-control-allow-headers",
      "Authorization, Content-Type, Idempotency-Key, Last-Event-ID",
    );
    response.setHeader(
      "access-control-allow-methods",
      "GET, POST, PUT, OPTIONS",
    );
  }
}
