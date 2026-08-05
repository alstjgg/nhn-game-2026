/**
 * Call transport — the fixture seam (architecture-map: "swap this one box and
 * everything left of it is testable offline").
 *
 * Owner: 윤석 (architecture track). e0 laid down this folder's public surface
 * as a stub; this unit fills it in with a live binding (proxy over an
 * injected `fetch`) and a fixture binding (canned responses, no key,
 * `src/transport/fixture.ts`).
 *
 * The wire itself is contract-calls §11: `POST <base>/dday/call`, one route
 * for the three call types, `slots` carrying values not prose, a 200 body
 * that *is* the tool payload verbatim, and a non-2xx body always
 * `{error: {code, message, requestId}}`.
 *
 * Two altitudes exist in this folder:
 *   - `src/transport/status-map.ts`'s `gradeStatus()` — a pure lookup over
 *     the §11 table. It never sees a fetch or a retry loop.
 *   - this file's `send()` — the graded OUTCOME: it runs the wire (with the
 *     one-retry budget), reads the two proxy headers, and decides whether the
 *     fallback header is even eligible to be honoured for this status before
 *     handing off to `gradeStatus()`.
 *
 * The transport **never throws and never rejects** (decision 1): every
 * failure — a non-2xx status, an unparseable body, a rejected fetch, a
 * missing `VITE_PROXY_BASE_URL` — becomes an `ok:false` outcome or a
 * degraded (fixture) transport, never an exception. Grading the outcome (is
 * it fatal? local? a supply cut?) is the engine's job (spec-engine §5), not
 * this folder's.
 *
 * Isomorphic (physical §3.1): this folder compiles under `tsconfig.core.json`,
 * which empties `types`, so the ambient `fetch`/`Response` lib types do not
 * resolve here. The request function is therefore an injected dependency
 * (decision 15) rather than a call to a global — the live driver injects a
 * `fetch`-backed one, the Node driver injects a fixture provider, and this
 * module names neither.
 */

import type { CallErrorBody, CallRequest, CallResponse, CallType } from '../shared/contracts.ts'
import { FALLBACK_CODE_HEADER, FALLBACK_HEADER, REQUEST_ID_HEADER } from '../shared/contracts.ts'

import { createFixtureProvider } from './fixture.ts'
import { gradeStatus, STATUS_ROWS } from './status-map.ts'
import type { Grade, GradeHeaders } from './status-map.ts'
import { CALL_PATH, createHttpRequestFn, joinCallUrl } from './wire.ts'
import type { FetchLike, FetchResponseLike, TransportHttpResponse, TransportRequestFn } from './wire.ts'

export { CALL_PATH, createFixtureProvider, createHttpRequestFn, joinCallUrl }
export type { FetchLike, FetchResponseLike, TransportHttpResponse, TransportRequestFn }

/** One retry, two calls total — the only budget literal in this folder. */
export const RETRY_BUDGET: number = 1
const MAX_ATTEMPTS = RETRY_BUDGET + 1

/** contract-calls §11's endpoint configuration — the build-time env key. */
export const PROXY_BASE_URL_ENV_KEY = 'VITE_PROXY_BASE_URL'

/**
 * Pure: takes the env record (the host reads `import.meta.env` or
 * `process.env` and hands it in — decision 5). Missing, undefined, empty or
 * whitespace-only ⇒ `null`, never a throw (§11: "unset is not an error").
 */
export function resolveProxyBaseUrl(env: Record<string, string | undefined>): string | null {
  const raw = env[PROXY_BASE_URL_ENV_KEY]
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * One outcome per contract-calls §11's status-code table, collapsed to what
 * the engine needs to act: a 200 body, or every non-2xx graded into a
 * fallback signal / caller-fixable error, always with the wire's attempt
 * count and (when the proxy sent one) its request id.
 */
export type TransportResult<T extends CallType = CallType> =
  | { ok: true; call_type: T; body: CallResponse[T]; requestId: string | null; attempts: number }
  | {
      ok: false
      call_type: T
      fallback: boolean
      code: string
      status: number | null
      requestId: string | null
      attempts: number
      error: CallErrorBody['error'] | null
    }

export interface Transport {
  readonly mode: 'live' | 'fixture'
  send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>>
}

export type TransportDeps = {
  /** `<PROXY_BASE_URL>` — contract-calls §11's endpoint configuration. */
  baseUrl?: string | null
  /** A pre-built request function; wins over `fetch` when both are given. */
  request?: TransportRequestFn
  /** A raw `FetchLike`, adapted into a request function via `createHttpRequestFn`. */
  fetch?: FetchLike
  /** An explicit provider (e.g. a test double, or the fixture with overrides) — wins over everything else. */
  provider?: Transport
}

/**
 * §11: the fallback header is only ever sent on a status that is already a
 * fallback situation. Everywhere else it is dropped before grading — a 4xx or
 * the hard 500 must never have an injected (or buggy) header override its fixed
 * outcome (decision 2 / A2). Reading this off the row's own flag, rather than
 * naming statuses, keeps a future row a one-row table edit (OCP).
 *
 * The flag read here is `fallback`, not `retry`. It was `retry` while those two
 * were the same set; 504 leaving the retry set (see status-map.ts) separated
 * them, and only `fallback` expresses what this function is for. Reading
 * `retry` would still produce the right answer for today's table — 504's row
 * already sets `fallback: true`, so the dropped header changes nothing — which
 * is exactly why it is worth fixing now rather than after a row makes it wrong.
 */
function headerForGrading(status: number | null, header: GradeHeaders): GradeHeaders {
  if (status === null) return header
  const row = STATUS_ROWS[status]
  if (row && !row.fallback) return { fallback: null, code: header.code }
  return header
}

function extractErrorBody(body: unknown): CallErrorBody['error'] | null {
  if (body === null || typeof body !== 'object' || !('error' in body)) return null
  const error = (body as { error?: unknown }).error
  if (error === null || typeof error !== 'object') return null
  const candidate = error as { code?: unknown; message?: unknown; requestId?: unknown }
  if (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.requestId === 'string'
  ) {
    return { code: candidate.code, message: candidate.message, requestId: candidate.requestId }
  }
  return null
}

type Attempt =
  | { ok: true; requestId: string | null; body: unknown }
  | { ok: false; requestId: string | null; grade: Grade; error: CallErrorBody['error'] | null }

/** One wire round-trip, graded. Never throws — a rejected request is the network row. */
async function performAttempt(requestFn: TransportRequestFn, request: CallRequest): Promise<Attempt> {
  let response: TransportHttpResponse
  try {
    response = await requestFn(request)
  } catch {
    return {
      ok: false,
      requestId: null,
      grade: gradeStatus(null, { fallback: null, code: null }, null),
      error: null,
    }
  }

  const requestId = response.header(REQUEST_ID_HEADER)
  const rawHeader: GradeHeaders = {
    fallback: response.header(FALLBACK_HEADER),
    code: response.header(FALLBACK_CODE_HEADER),
  }

  let parsedBody: unknown
  try {
    parsedBody = await response.json()
  } catch {
    // A11: an unparseable body is a model-side failure, not a caller bug. A
    // 200 that fails to parse behaves like the retryable tier; any other
    // status keeps its own row's fallback/retry — only the code changes.
    const grade: Grade =
      response.status === 200
        ? { fallback: true, retry: true, code: 'invalid_response_body', status: response.status }
        : {
            ...gradeStatus(response.status, headerForGrading(response.status, rawHeader), null),
            code: 'invalid_response_body',
          }
    return { ok: false, requestId, grade, error: null }
  }

  if (response.status === 200) {
    return { ok: true, requestId, body: parsedBody }
  }

  const grade = gradeStatus(response.status, headerForGrading(response.status, rawHeader), parsedBody)
  return { ok: false, requestId, grade, error: extractErrorBody(parsedBody) }
}

/** The retry loop: `RETRY_BUDGET` re-calls of a retryable grade, never more. */
async function performSend<T extends CallType>(
  requestFn: TransportRequestFn,
  request: CallRequest<T>,
): Promise<TransportResult<T>> {
  let callCount = 0
  let outcome: Attempt
  do {
    callCount += 1
    outcome = await performAttempt(requestFn, request)
  } while (!outcome.ok && outcome.grade.retry && callCount < MAX_ATTEMPTS)

  if (outcome.ok) {
    return {
      ok: true,
      call_type: request.call_type,
      body: outcome.body as CallResponse[T],
      requestId: outcome.requestId,
      attempts: callCount,
    }
  }

  return {
    ok: false,
    call_type: request.call_type,
    fallback: outcome.grade.fallback,
    code: outcome.grade.code,
    status: outcome.grade.status,
    requestId: outcome.requestId,
    attempts: callCount,
    error: outcome.error,
  }
}

function createLiveTransport(requestFn: TransportRequestFn): Transport {
  return {
    mode: 'live',
    send: (request) => performSend(requestFn, request),
  }
}

/** A base URL with no way to reach the wire still must not throw (A7) — this is that degraded path. */
function unreachableRequestFn(): Promise<TransportHttpResponse> {
  return Promise.reject(new Error('no request function or fetch configured for this transport'))
}

/**
 * Never throws. A falsy `baseUrl` (missing, null, empty, whitespace) degrades
 * to the fixture provider rather than ever returning a live transport with a
 * broken URL (decision 6). An explicit `provider` wins over everything.
 */
export function createTransport(deps: TransportDeps = {}): Transport {
  if (deps.provider) return deps.provider

  const trimmedBase = typeof deps.baseUrl === 'string' ? deps.baseUrl.trim() : ''
  if (trimmedBase === '') return createFixtureProvider()

  const requestFn: TransportRequestFn =
    deps.request ?? (deps.fetch ? createHttpRequestFn({ baseUrl: trimmedBase, fetch: deps.fetch }) : unreachableRequestFn)

  return createLiveTransport(requestFn)
}
