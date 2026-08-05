/**
 * The request block of contract-calls §11 — building the URL and adapting an
 * injected `FetchLike` into e0's `TransportRequestFn`.
 *
 * `origin` is a browser-forbidden header (§11) and there is no auth header on
 * this route, so the only header this folder ever sets is `content-type`.
 *
 * Isomorphic (physical §3.1): no DOM, no fs, no globals, no timers. `fetch` is
 * never named bare — it always arrives as an injected `FetchLike`.
 */

import type { CallRequest } from '../shared/contracts.ts'

/** The single route contract-calls §11 defines for every call type. */
export const CALL_PATH = '/dday/call'

/** The minimal shape this module needs back from whatever performs the POST. */
export type FetchResponseLike = {
  status: number
  headers: { get(name: string): string | null }
  text(): Promise<string>
}

/** The injected HTTP boundary — never a bare global `fetch`. */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: unknown },
) => Promise<FetchResponseLike>

/** The minimal shape e0's transport needs back from whatever performs the POST. */
export type TransportHttpResponse = {
  status: number
  header(name: string): string | null
  json(): Promise<unknown>
}

/** Given a request, returns whatever came back. e0's injected HTTP boundary. */
export type TransportRequestFn = (body: CallRequest) => Promise<TransportHttpResponse>

/** `<base>` with any number of trailing slashes stripped, then `CALL_PATH` appended once. */
export function joinCallUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${CALL_PATH}`
}

/**
 * Adapts a raw `FetchLike` into e0's `TransportRequestFn`: fixes the URL,
 * method and the one header §11 specifies, and turns a parse failure into a
 * REJECTED `json()` — the signal the caller (index.ts) reads as
 * `invalid_response_body` (design D-e).
 */
export function createHttpRequestFn(cfg: {
  baseUrl: string
  fetch: FetchLike
  signal?: unknown
}): TransportRequestFn {
  const url = joinCallUrl(cfg.baseUrl)
  return async (body: CallRequest): Promise<TransportHttpResponse> => {
    const init: { method: string; headers: Record<string, string>; body: string; signal?: unknown } = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }
    if (cfg.signal !== undefined) init.signal = cfg.signal
    const response = await cfg.fetch(url, init)
    return {
      status: response.status,
      header: (name: string) => response.headers.get(name),
      json: async () => {
        const text = await response.text()
        try {
          return JSON.parse(text) as unknown
        } catch {
          throw new Error('invalid_response_body')
        }
      },
    }
  }
}
