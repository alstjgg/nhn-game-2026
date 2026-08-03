/**
 * Call transport — the fixture seam (architecture-map: "swap this one box and
 * everything left of it is testable offline").
 *
 * Owner: 윤석 (architecture track). Stub — the e0 skeleton: the full public
 * surface as exported types, with a stub factory. Behaviour lands with the
 * unit that implements a live binding (Lambda) and a fixture binding (canned
 * responses, no key); nothing here runs yet.
 *
 * The wire itself is contract-calls §11: `POST <base>/dday/call`, one route
 * for the three call types, `slots` carrying values not prose, a 200 body
 * that *is* the tool payload verbatim, and a non-2xx body always
 * `{error: {code, message, requestId}}`.
 *
 * Isomorphic (physical §3.1): this folder compiles under `tsconfig.core.json`,
 * which empties `types`, so the ambient `fetch`/`Response` lib types do not
 * resolve here. The request function is therefore an injected dependency
 * (decision 15) rather than a call to a global — the live driver injects a
 * `fetch`-backed one, the Node driver injects a fixture provider, and this
 * module names neither.
 */

import type { CallRequest, CallResponse, CallErrorBody, CallType } from '../shared/contracts.ts'

/** The minimal shape this module needs back from whatever performs the POST. */
export type TransportHttpResponse = {
  status: number
  header(name: string): string | null
  json(): Promise<unknown>
}

/** The injected HTTP boundary. Given a request, returns whatever came back. */
export type TransportRequestFn = (body: CallRequest) => Promise<TransportHttpResponse>

export type TransportDeps = {
  /** `<PROXY_BASE_URL>` — contract-calls §11's endpoint configuration. */
  baseUrl: string
  request: TransportRequestFn
}

/**
 * One outcome per contract-calls §11's status-code table, collapsed to what
 * the engine needs to act: a 200 body, an authored-fallback signal (5xx with
 * `x-llm-fallback: true`), or every other non-2xx.
 */
export type TransportResult<T extends CallType = CallType> =
  | { ok: true; requestId: string; body: CallResponse[T] }
  | { ok: false; requestId: string; fallback: true; fallbackCode: string }
  | { ok: false; requestId: string; fallback: false; error: CallErrorBody['error'] }

export interface Transport {
  send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>>
}

export function createTransport(_deps: TransportDeps): Transport {
  throw new Error('unimplemented: createTransport')
}
