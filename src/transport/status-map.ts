/**
 * The contract-calls §11 status→outcome table, as data — plus the pure lookup
 * over it.
 *
 * Two altitudes live in this folder (index.ts's docstring), and this module is
 * the lower one: `gradeStatus()` never sees a fetch, a retry loop, or an
 * attempt counter. It only ever answers "given this status, this pair of
 * headers, and this parsed body, what does §11 say the outcome is". The
 * *caller* (index.ts) decides whether the proxy's fallback header is even
 * eligible to be read for a given status — see its `headerForGrading` — so
 * this table stays a one-purpose lookup.
 *
 * Isomorphic (physical §3.1): no DOM, no fs, no globals, no timers.
 */

import type { CallErrorBody } from '../shared/contracts.ts'

/** One row of the §11 table, keyed by status in `STATUS_ROWS`. */
export type StatusRow = {
  /** Whether THIS row is, by itself, an authored-fallback situation. */
  fallback: boolean
  /** Whether this status is in the retry set (§11: 502, 504 only). */
  retry: boolean
  /** Every `error.code` contract-calls §11 documents for this status. */
  codes: readonly string[]
}

/** The eight mapped statuses. 200 is the success path and carries no row. */
export const STATUS_ROWS: Readonly<Record<number, StatusRow>> = {
  400: {
    fallback: false,
    retry: false,
    codes: ['invalid_json', 'invalid_request', 'invalid_slots', 'unknown_template_version'],
  },
  403: { fallback: false, retry: false, codes: ['origin_forbidden'] },
  404: { fallback: false, retry: false, codes: ['not_found'] },
  413: { fallback: false, retry: false, codes: ['request_too_large'] },
  415: { fallback: false, retry: false, codes: ['unsupported_media_type'] },
  500: {
    fallback: false,
    retry: false,
    codes: ['invalid_config', 'unfilled_slot', 'internal_error'],
  },
  502: { fallback: true, retry: true, codes: ['invalid_model_output'] },
  504: { fallback: true, retry: true, codes: ['bedrock_timeout'] },
}

/** The graded outcome of one wire attempt, before attempts/requestId land. */
export type Grade = {
  fallback: boolean
  retry: boolean
  code: string
  status: number | null
}

/** The two proxy headers `gradeStatus` reads, already extracted by the caller. */
export type GradeHeaders = {
  fallback: string | null
  code: string | null
}

function errorCodeOf(body: unknown): string | null {
  if (body === null || typeof body !== 'object' || !('error' in body)) return null
  const error = (body as { error?: unknown }).error
  if (error === null || typeof error !== 'object') return null
  const code = (error as CallErrorBody['error']).code
  return typeof code === 'string' ? code : null
}

/**
 * The pure §11 lookup. `status: null` means the fetch itself never produced a
 * response (a network failure) — that is its own row, not absence of one.
 *
 *   status <  500            → fallback always false; header never consulted.
 *   status === a mapped 5xx  → fallback = the row's own value, raised further
 *                               if the header says so (`header.fallback === 'true'`).
 *   status is an unmapped 5xx → fallback true unconditionally (a gateway the
 *                               proxy never documented still means "the model
 *                               tier is unreachable", not "the caller is wrong").
 */
export function gradeStatus(status: number | null, header: GradeHeaders, body: unknown): Grade {
  if (status === null) {
    return { fallback: true, retry: true, code: 'network_error', status: null }
  }

  const row = STATUS_ROWS[status]
  const code = header.code ?? errorCodeOf(body) ?? `upstream_${status}`

  if (status < 500) {
    return { fallback: false, retry: row ? row.retry : false, code, status }
  }

  if (row) {
    return { fallback: row.fallback || header.fallback === 'true', retry: row.retry, code, status }
  }

  return { fallback: true, retry: false, code, status }
}
