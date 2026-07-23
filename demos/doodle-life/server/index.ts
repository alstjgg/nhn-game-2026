import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'
import { ZodError } from 'zod'
import type {
  BootstrapRequest,
  DoodleBirthRequest,
  TraceSummary,
  WorldTurnRequest,
} from '../src/ai/contracts.ts'
import { createAutonomousGarden, type AutonomousGarden } from './ai/orchestrator.ts'
import { ModelProviderError, providerEvaluationConfig } from './ai/provider.ts'
import {
  createDoodleLifeService,
  type DoodleLifeService,
} from './doodle-life/service.ts'
import { DoodleLifeDomainError } from './doodle-life/quest-engine.ts'

const inheritedEnvironment = new Set(Object.keys(process.env))
const fileEnvironment: Record<string, string> = {}
const blankFileValuesThatFallThrough = new Set([
  'OPENAI_API_KEY',
  'AI_PROVIDER',
])

for (const environmentUrl of [
  new URL('../.env', import.meta.url),
  new URL('../../../.env.local', import.meta.url),
]) {
  try {
    const parsed = parseEnv(readFileSync(fileURLToPath(environmentUrl), 'utf8'))
    for (const [name, value] of Object.entries(parsed)) {
      if (value === undefined) continue
      const existing = fileEnvironment[name]
      const replacesBlankFallback = blankFileValuesThatFallThrough.has(name)
        && existing !== undefined
        && existing.trim() === ''
        && value.trim() !== ''
      if (!Object.hasOwn(fileEnvironment, name) || replacesBlankFallback) {
        fileEnvironment[name] = value
      }
    }
  } catch (error) {
    if (!isMissingFileError(error)) throw error
  }
}
for (const [name, value] of Object.entries(fileEnvironment)) {
  if (!inheritedEnvironment.has(name)) process.env[name] = value
}

const MAX_BODY_BYTES = 1024 * 1024
const REQUEST_TIMEOUT_MS = envNumber('SERVER_REQUEST_TIMEOUT_MS', 660_000)

interface ApiErrorBody {
  readonly error: {
    readonly code: string
    readonly message: string
    readonly requestId: string
    readonly trace?: TraceSummary
  }
}

export interface ApiServerOptions {
  readonly garden?: AutonomousGarden
  readonly doodleLife?: DoodleLifeService
  readonly allowedOrigins?: readonly string[]
}

export function createApiServer(options: ApiServerOptions = {}) {
  const garden = options.garden ?? createAutonomousGarden()
  const doodleLife = options.doodleLife ?? createDoodleLifeService()
  const allowedOrigins = new Set(options.allowedOrigins ?? configuredOrigins())

  return createServer(async (request, response) => {
    const requestId = headerValue(request, 'x-request-id') ?? randomUUID()
    setBaseHeaders(response, requestId)

    const origin = headerValue(request, 'origin')
    if (origin) {
      if (!allowedOrigins.has(origin)) {
        writeError(response, 403, 'origin_not_allowed', 'This origin is not allowed.', requestId)
        return
      }
      response.setHeader('access-control-allow-origin', origin)
      response.setHeader('vary', 'Origin')
    }

    if (request.method === 'OPTIONS') {
      response.statusCode = 204
      response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
      response.setHeader('access-control-allow-headers', 'content-type, x-request-id')
      response.setHeader('access-control-max-age', '600')
      response.end()
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new Error('API request timed out.')), REQUEST_TIMEOUT_MS)
    const abortOnClose = (): void => controller.abort(new Error('Client disconnected.'))
    const abortOnResponseClose = (): void => {
      if (!response.writableEnded) controller.abort(new Error('Client disconnected.'))
    }
    request.once('aborted', abortOnClose)
    response.once('close', abortOnResponseClose)

    try {
      const url = new URL(request.url ?? '/', 'http://localhost')

      if (request.method === 'GET' && url.pathname === '/api/v1/health') {
        writeJson(response, 200, {
          ok: true,
          service: 'doodle-life-autonomous-garden',
          provider: garden.providerKind,
          modelCallsEnabled: garden.providerKind !== 'mock',
          evaluationConfig: providerEvaluationConfig(garden.providerKind),
          time: new Date().toISOString(),
        })
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/v2/health') {
        writeJson(response, 200, {
          ok: true,
          service: 'doodle-life-request-first',
          provider: doodleLife.providerKind,
          modelCallsEnabled: doodleLife.providerKind !== 'mock',
          evaluationConfig: providerEvaluationConfig(doodleLife.providerKind),
          time: new Date().toISOString(),
        })
        return
      }

      if (request.method !== 'POST') {
        writeError(response, 404, 'not_found', 'API route not found.', requestId)
        return
      }

      const body = await readJsonBody(request, MAX_BODY_BYTES)
      switch (url.pathname) {
        case '/api/v1/bootstrap':
          writeJson(response, 200, await garden.bootstrap(body as BootstrapRequest, controller.signal))
          return
        case '/api/v1/doodle-birth':
          writeJson(response, 200, await garden.doodleBirth(body as DoodleBirthRequest, controller.signal))
          return
        case '/api/v1/world-turn':
          writeJson(response, 200, await garden.worldTurn(body as WorldTurnRequest, controller.signal))
          return
        case '/api/v2/sessions':
          writeJson(response, 200, await doodleLife.bootstrap(
            body as Parameters<DoodleLifeService['bootstrap']>[0],
            controller.signal,
          ))
          return
        case '/api/v2/quest-attempts':
          writeJson(response, 200, doodleLife.selectQuest(
            body as Parameters<DoodleLifeService['selectQuest']>[0],
          ))
          return
        case '/api/v2/doodle-readings':
          writeJson(response, 200, await doodleLife.readDoodle(
            body as Parameters<DoodleLifeService['readDoodle']>[0],
            controller.signal,
          ))
          return
        case '/api/v2/quest-resolutions':
          writeJson(response, 200, doodleLife.resolveQuest(
            body as Parameters<DoodleLifeService['resolveQuest']>[0],
          ))
          return
        case '/api/v2/encounter-reactions':
          writeJson(response, 200, await doodleLife.createReactions(
            body as Parameters<DoodleLifeService['createReactions']>[0],
            controller.signal,
          ))
          return
        default:
          writeError(response, 404, 'not_found', 'API route not found.', requestId)
      }
    } catch (error) {
      const normalized = normalizeError(error, controller.signal.aborted)
      writeError(response, normalized.status, normalized.code, normalized.message, requestId, normalized.trace)
    } finally {
      clearTimeout(timeout)
      request.removeListener('aborted', abortOnClose)
      response.removeListener('close', abortOnResponseClose)
    }
  })
}

async function readJsonBody(request: IncomingMessage, maxBytes: number): Promise<unknown> {
  const contentType = headerValue(request, 'content-type')?.split(';', 1)[0]?.trim()
  if (contentType !== 'application/json') throw new HttpError(415, 'unsupported_media_type', 'Expected application/json.')

  const announcedLength = Number(headerValue(request, 'content-length'))
  if (Number.isFinite(announcedLength) && announcedLength > maxBytes) {
    throw new HttpError(413, 'payload_too_large', `Request body exceeds ${maxBytes} bytes.`)
  }

  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.byteLength
    if (total > maxBytes) throw new HttpError(413, 'payload_too_large', `Request body exceeds ${maxBytes} bytes.`)
    chunks.push(buffer)
  }

  if (total === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body is not valid JSON.')
  }
}

function setBaseHeaders(response: ServerResponse, requestId: string): void {
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('cache-control', 'no-store')
  response.setHeader('x-content-type-options', 'nosniff')
  response.setHeader('x-request-id', requestId)
}

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.writableEnded) return
  response.statusCode = status
  response.end(JSON.stringify(body))
}

function writeError(
  response: ServerResponse,
  status: number,
  code: string,
  message: string,
  requestId: string,
  trace?: TraceSummary,
): void {
  const body: ApiErrorBody = { error: { code, message, requestId, ...(trace ? { trace } : {}) } }
  writeJson(response, status, body)
}

function normalizeError(error: unknown, aborted: boolean): { status: number; code: string; message: string; trace?: TraceSummary } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      code: 'invalid_request',
      message: 'The request payload did not satisfy the API contract.',
    }
  }
  if (error instanceof HttpError || error instanceof ModelProviderError || error instanceof DoodleLifeDomainError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      ...(error instanceof ModelProviderError && error.partialTrace ? { trace: error.partialTrace } : {}),
    }
  }
  if (aborted) return { status: 504, code: 'request_timeout', message: 'The API request timed out.' }
  return {
    status: 500,
    code: 'internal_error',
    message: error instanceof Error ? error.message : 'Unexpected server error.',
  }
}

class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}

function headerValue(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name]
  return Array.isArray(value) ? value[0] : value
}

function configuredOrigins(): readonly string[] {
  const fromEnv = process.env.AI_CORS_ORIGINS ?? process.env.CORS_ORIGINS
  if (fromEnv) return fromEnv.split(',').map((origin) => origin.trim()).filter(Boolean)
  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ]
}

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const entryPath = process.argv[1]
if (entryPath && fileURLToPath(import.meta.url) === entryPath) {
  const port = envNumber('AI_PORT', envNumber('PORT', 8787))
  createApiServer().listen(port, '127.0.0.1', () => {
    console.log(`Doodle Life AI server listening on http://127.0.0.1:${port}`)
  })
}
