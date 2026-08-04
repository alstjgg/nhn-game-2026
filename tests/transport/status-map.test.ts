// [e6#A1] [e6#A2] [e6#A3] [e6#A11] — contract-calls §11's status table, row for row.
//
// Two altitudes, deliberately separate:
//   · `gradeStatus()` — the pure table lookup (design D-g), no fetch, no retry.
//   · `createTransport().send()` — the graded OUTCOME, which is the only place
//     `ok`, `status`, `requestId` and `attempts` exist.
// A row asserted at one altitude is not re-asserted at the other.
import { describe, it, expect } from 'vitest'

import {
  FALLBACK_HEADER,
  FALLBACK_CODE_HEADER,
  REQUEST_ID_HEADER,
} from '../../src/shared/contracts.ts'
import { createTransport } from '../../src/transport/index.ts'
import { STATUS_ROWS, gradeStatus } from '../../src/transport/status-map.ts'

import {
  BASE_URL,
  JUDGMENT_200,
  JUDGMENT_REQUEST,
  errorBody,
  stubFetch,
} from './_helpers.ts'

const REQUEST_ID = 'req-e6-0001'

/** The §11 table, transcribed. One representative `code` per status row. */
type Row = {
  label: string
  /** null ⇒ the fetch itself rejected (no HTTP status at all). */
  status: number | null
  code: string | null
  ok: boolean
  fallback: boolean
  /** headers the proxy actually sends on this row */
  headers: Record<string, string>
}

const ROWS: readonly Row[] = [
  {
    label: '200 — the payload verbatim',
    status: 200,
    code: null,
    ok: true,
    fallback: false,
    headers: { [FALLBACK_HEADER]: 'false', [REQUEST_ID_HEADER]: REQUEST_ID },
  },
  {
    label: '400 invalid_request — fix the caller',
    status: 400,
    code: 'invalid_request',
    ok: false,
    fallback: false,
    headers: { [REQUEST_ID_HEADER]: REQUEST_ID },
  },
  {
    label: '403 origin_forbidden',
    status: 403,
    code: 'origin_forbidden',
    ok: false,
    fallback: false,
    headers: { [REQUEST_ID_HEADER]: REQUEST_ID },
  },
  {
    label: '404 not_found',
    status: 404,
    code: 'not_found',
    ok: false,
    fallback: false,
    headers: { [REQUEST_ID_HEADER]: REQUEST_ID },
  },
  {
    label: '413 request_too_large',
    status: 413,
    code: 'request_too_large',
    ok: false,
    fallback: false,
    headers: { [REQUEST_ID_HEADER]: REQUEST_ID },
  },
  {
    label: '415 unsupported_media_type',
    status: 415,
    code: 'unsupported_media_type',
    ok: false,
    fallback: false,
    headers: { [REQUEST_ID_HEADER]: REQUEST_ID },
  },
  {
    label: '500 internal_error — this tier’s bug, NOT a fallback',
    status: 500,
    code: 'internal_error',
    ok: false,
    fallback: false,
    headers: { [REQUEST_ID_HEADER]: REQUEST_ID },
  },
  {
    label: '502 invalid_model_output — apply the authored fallback',
    status: 502,
    code: 'invalid_model_output',
    ok: false,
    fallback: true,
    headers: {
      [FALLBACK_HEADER]: 'true',
      [FALLBACK_CODE_HEADER]: 'invalid_model_output',
      [REQUEST_ID_HEADER]: REQUEST_ID,
    },
  },
  {
    label: '504 bedrock_timeout — apply the authored fallback',
    status: 504,
    code: 'bedrock_timeout',
    ok: false,
    fallback: true,
    headers: {
      [FALLBACK_HEADER]: 'true',
      [FALLBACK_CODE_HEADER]: 'bedrock_timeout',
      [REQUEST_ID_HEADER]: REQUEST_ID,
    },
  },
  {
    label: 'the fetch rejected — no status at all',
    status: null,
    code: 'network_error',
    ok: false,
    fallback: true,
    headers: {},
  },
]

function transportFor(row: Row) {
  const steps =
    row.status === null
      ? [{ reject: 'ECONNREFUSED' } as const]
      : [
          {
            status: row.status,
            headers: row.headers,
            body: row.status === 200 ? JSON.stringify(JUDGMENT_200) : errorBody(row.code!, REQUEST_ID),
          },
        ]
  const stub = stubFetch(steps)
  return { stub, transport: createTransport({ baseUrl: BASE_URL, fetch: stub.fetch }) }
}

// ─── A1 — every row, end to end ──────────────────────────────────────────────

describe('[e6#A1] every contract-calls §11 row grades to the listed outcome', () => {
  for (const row of ROWS) {
    it(`${row.label} ⇒ ok:${row.ok} fallback:${row.fallback}`, async () => {
      const { transport } = transportFor(row)
      const result = await transport.send(JUDGMENT_REQUEST)

      expect(result.ok, `row ${row.label} produced the wrong ok`).toBe(row.ok)
      expect(result.attempts).toBeGreaterThanOrEqual(1)

      if (result.ok) {
        expect(result.call_type).toBe('judgment')
        return
      }
      expect(result.call_type).toBe('judgment')
      expect(result.fallback).toBe(row.fallback)
      expect(result.code).toBe(row.code)
      expect(result.status).toBe(row.status)
    })
  }

  it('never throws and never rejects — a rejected fetch resolves to ok:false', async () => {
    const stub = stubFetch([{ reject: 'boom' }])
    const transport = createTransport({ baseUrl: BASE_URL, fetch: stub.fetch })
    await expect(transport.send(JUDGMENT_REQUEST)).resolves.toMatchObject({ ok: false })
  })

  it('every 400 code and every 500 code lands on its row', async () => {
    const cases = [
      { status: 400, codes: ['invalid_json', 'invalid_request', 'invalid_slots', 'unknown_template_version'] },
      { status: 500, codes: ['invalid_config', 'unfilled_slot', 'internal_error'] },
    ] as const
    for (const { status, codes } of cases) {
      for (const code of codes) {
        const stub = stubFetch([{ status, body: errorBody(code) }])
        const transport = createTransport({ baseUrl: BASE_URL, fetch: stub.fetch })
        const result = await transport.send(JUDGMENT_REQUEST)
        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code, `${status} ${code}`).toBe(code)
        expect(result.fallback, `${status} ${code} must not be a fallback`).toBe(false)
        expect(result.status).toBe(status)
      }
    }
  })
})

// ─── A2 — a 4xx is forced to fallback:false even if the header lies ───────────

describe('[e6#A2] a 4xx never sets fallback, even with x-llm-fallback: true injected', () => {
  for (const status of [400, 403, 404, 413, 415, 500]) {
    it(`${status} + x-llm-fallback:true ⇒ fallback === false`, async () => {
      const stub = stubFetch([
        {
          status,
          headers: {
            [FALLBACK_HEADER]: 'true',
            [FALLBACK_CODE_HEADER]: 'invalid_model_output',
            [REQUEST_ID_HEADER]: REQUEST_ID,
          },
          body: errorBody('invalid_request'),
        },
      ])
      const transport = createTransport({ baseUrl: BASE_URL, fetch: stub.fetch })
      const result = await transport.send(JUDGMENT_REQUEST)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.fallback, 'a client bug must not be absorbed by an authored default').toBe(false)
    })
  }
})

// ─── A3 — headers land in metadata only; the 200 body is verbatim ────────────

describe('[e6#A3] the headers are read without touching the output schema', () => {
  it('a 200 body is the payload VERBATIM — same value, same keys, no injected metadata', async () => {
    const stub = stubFetch([
      {
        status: 200,
        headers: {
          [FALLBACK_HEADER]: 'false',
          [REQUEST_ID_HEADER]: REQUEST_ID,
        },
        body: JSON.stringify(JUDGMENT_200),
      },
    ])
    const transport = createTransport({ baseUrl: BASE_URL, fetch: stub.fetch })
    const result = await transport.send(JUDGMENT_REQUEST)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.body).toEqual(JUDGMENT_200)
    expect(
      Object.keys(result.body),
      'a header key leaked into the response schema',
    ).toEqual(Object.keys(JUDGMENT_200))
  })

  it('requestId comes from x-request-id, on success and on failure alike', async () => {
    const ok = stubFetch([
      { status: 200, headers: { [REQUEST_ID_HEADER]: 'req-ok' }, body: JSON.stringify(JUDGMENT_200) },
    ])
    const bad = stubFetch([
      { status: 400, headers: { [REQUEST_ID_HEADER]: 'req-bad' }, body: errorBody('invalid_request') },
    ])
    const a = await createTransport({ baseUrl: BASE_URL, fetch: ok.fetch }).send(JUDGMENT_REQUEST)
    const b = await createTransport({ baseUrl: BASE_URL, fetch: bad.fetch }).send(JUDGMENT_REQUEST)
    expect(a.requestId).toBe('req-ok')
    expect(b.requestId).toBe('req-bad')
  })

  it('requestId is null when the header is absent', async () => {
    const stub = stubFetch([{ status: 400, body: errorBody('invalid_request') }])
    const result = await createTransport({ baseUrl: BASE_URL, fetch: stub.fetch }).send(JUDGMENT_REQUEST)
    expect(result.requestId).toBe(null)
  })

  it('code prefers x-fallback-code over the body’s error.code', async () => {
    const stub = stubFetch([
      {
        status: 502,
        headers: { [FALLBACK_HEADER]: 'true', [FALLBACK_CODE_HEADER]: 'invalid_model_output' },
        body: errorBody('something_else'),
      },
    ])
    const result = await createTransport({ baseUrl: BASE_URL, fetch: stub.fetch }).send(JUDGMENT_REQUEST)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('invalid_model_output')
  })

  it('code falls back to the body’s error.code when the header is absent', async () => {
    const stub = stubFetch([{ status: 415, body: errorBody('unsupported_media_type') }])
    const result = await createTransport({ baseUrl: BASE_URL, fetch: stub.fetch }).send(JUDGMENT_REQUEST)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('unsupported_media_type')
  })
})

// ─── A11 — an unparseable body ───────────────────────────────────────────────

describe('[e6#A11] a body that is not JSON is a model-side failure, not a caller bug', () => {
  it('a 200 with a truncated body ⇒ ok:false, fallback:true, invalid_response_body, retried once', async () => {
    const stub = stubFetch([
      { status: 200, headers: { [REQUEST_ID_HEADER]: REQUEST_ID }, body: '{"inner_note":"trunc' },
    ])
    const transport = createTransport({ baseUrl: BASE_URL, fetch: stub.fetch })
    const result = await transport.send(JUDGMENT_REQUEST)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('invalid_response_body')
    expect(result.fallback).toBe(true)
    expect(result.attempts).toBe(2)
    expect(stub.calls.length).toBe(2)
  })

  it('a 400 with an unparseable body keeps the row’s fallback:false', async () => {
    const stub = stubFetch([{ status: 400, body: '<html>gateway</html>' }])
    const result = await createTransport({ baseUrl: BASE_URL, fetch: stub.fetch }).send(JUDGMENT_REQUEST)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('invalid_response_body')
    expect(result.fallback).toBe(false)
    expect(stub.calls.length).toBe(1)
  })
})

// ─── the pure table (design D-g / D-h / D-i) ─────────────────────────────────

describe('[e6#A1] gradeStatus() is a pure lookup over the §11 table', () => {
  const noHeaders = { fallback: null, code: null }

  it('STATUS_ROWS carries exactly the eight mapped statuses', () => {
    expect(Object.keys(STATUS_ROWS).map(Number).sort((a, b) => a - b)).toEqual([
      400, 403, 404, 413, 415, 500, 502, 504,
    ])
  })

  it('retry is a property of the row — only 502 carries it', () => {
    const retryable = Object.entries(STATUS_ROWS)
      .filter(([, row]) => row.retry)
      .map(([status]) => Number(status))
      .sort((a, b) => a - b)
    expect(retryable).toEqual([502])
  })

  // The two flags used to select the same set, and this asserts that they no
  // longer do — 504 is a fallback situation without being a retry one. A change
  // that quietly re-merged them would pass every other test in this file.
  it('fallback and retry are separate properties — 504 has one without the other', () => {
    expect(STATUS_ROWS[504]).toMatchObject({ fallback: true, retry: false })
    expect(STATUS_ROWS[502]).toMatchObject({ fallback: true, retry: true })
    const fallbackRows = Object.entries(STATUS_ROWS)
      .filter(([, row]) => row.fallback)
      .map(([status]) => Number(status))
      .sort((a, b) => a - b)
    expect(fallbackRows).toEqual([502, 504])
  })

  it('every mapped row lists the §11 codes for its status', () => {
    expect([...STATUS_ROWS[400]!.codes].sort()).toEqual(
      ['invalid_json', 'invalid_request', 'invalid_slots', 'unknown_template_version'].sort(),
    )
    expect([...STATUS_ROWS[500]!.codes].sort()).toEqual(
      ['internal_error', 'invalid_config', 'unfilled_slot'].sort(),
    )
    expect(STATUS_ROWS[502]!.codes).toContain('invalid_model_output')
    expect(STATUS_ROWS[504]!.codes).toContain('bedrock_timeout')
  })

  it('a null status is the network row: fallback, retryable, network_error', () => {
    expect(gradeStatus(null, noHeaders, null)).toEqual({
      fallback: true,
      retry: true,
      code: 'network_error',
      status: null,
    })
  })

  it('an unmapped 4xx degrades without a fallback and without a retry', () => {
    const grade = gradeStatus(429, noHeaders, null)
    expect(grade).toEqual({ fallback: false, retry: false, code: 'upstream_429', status: 429 })
  })

  it('an unmapped 5xx (gateway 503) degrades WITH a fallback but no retry', () => {
    const grade = gradeStatus(503, noHeaders, null)
    expect(grade).toEqual({ fallback: true, retry: false, code: 'upstream_503', status: 503 })
  })

  it('the header can only ever raise fallback on a 5xx, never on a 4xx', () => {
    expect(gradeStatus(400, { fallback: 'true', code: null }, null).fallback).toBe(false)
    expect(gradeStatus(500, { fallback: 'true', code: null }, null).fallback).toBe(true)
    expect(gradeStatus(500, { fallback: null, code: null }, null).fallback).toBe(false)
  })

  it('code resolution order: header, then body error.code, then upstream_<status>', () => {
    expect(gradeStatus(502, { fallback: 'true', code: 'from_header' }, { error: { code: 'from_body', message: '', requestId: '' } }).code).toBe('from_header')
    expect(gradeStatus(502, { fallback: 'true', code: null }, { error: { code: 'from_body', message: '', requestId: '' } }).code).toBe('from_body')
    expect(gradeStatus(502, { fallback: 'true', code: null }, null).code).toBe('upstream_502')
  })
})
