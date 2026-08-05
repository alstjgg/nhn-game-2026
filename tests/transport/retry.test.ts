// [e6#A4] [e6#A5] — "one retry, two calls total, and the engine owns the counter"
// (contract-calls §11 · engine spec §5).
//
// A4 counts the stub's invocations, because `attempts` reporting 2 while the
// wire saw 3 would satisfy a naive assertion. A5 is a source scan: the budget
// must be ONE exported constant, never a literal sprinkled through the loop.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { FALLBACK_CODE_HEADER, FALLBACK_HEADER } from '../../src/shared/contracts.ts'
import { RETRY_BUDGET, createTransport } from '../../src/transport/index.ts'

import { BASE_URL, JUDGMENT_200, JUDGMENT_REQUEST, errorBody, stubFetch } from './_helpers.ts'
import type { StubStep } from './_helpers.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const TRANSPORT_DIR = path.join(REPO, 'src/transport')

const fallbackHeaders = (code: string): Record<string, string> => ({
  [FALLBACK_HEADER]: 'true',
  [FALLBACK_CODE_HEADER]: code,
})

async function run(steps: readonly StubStep[]) {
  const stub = stubFetch(steps)
  const transport = createTransport({ baseUrl: BASE_URL, fetch: stub.fetch })
  const result = await transport.send(JUDGMENT_REQUEST)
  return { result, wireCalls: stub.calls.length }
}

// ─── A4 — the retry set is {502, network}, and nothing else ──────────────────

describe('[e6#A4] retryable failures are called exactly twice', () => {
  const retryable: readonly { label: string; steps: readonly StubStep[] }[] = [
    { label: '502 invalid_model_output', steps: [{ status: 502, headers: fallbackHeaders('invalid_model_output'), body: errorBody('invalid_model_output') }] },
    { label: 'a rejected fetch', steps: [{ reject: 'ECONNRESET' }] },
  ]

  for (const { label, steps } of retryable) {
    it(`${label} ⇒ the wire saw 2 calls and attempts === 2`, async () => {
      const { result, wireCalls } = await run(steps)
      expect(wireCalls, `${label} did not use exactly the retry budget`).toBe(2)
      expect(result.attempts).toBe(2)
      expect(result.ok).toBe(false)
    })
  }

  it('a 502 followed by a 200 succeeds on the retry — ok:true, attempts:2', async () => {
    const { result, wireCalls } = await run([
      { status: 502, headers: fallbackHeaders('invalid_model_output'), body: errorBody('invalid_model_output') },
      { status: 200, body: JSON.stringify(JUDGMENT_200) },
    ])
    expect(wireCalls).toBe(2)
    expect(result.ok).toBe(true)
    expect(result.attempts).toBe(2)
    if (!result.ok) return
    expect(result.body).toEqual(JUDGMENT_200)
  })
})

describe('[e6#A4] non-retryable failures are called exactly once', () => {
  const once: readonly { label: string; status: number; code: string }[] = [
    { label: '400 invalid_request', status: 400, code: 'invalid_request' },
    { label: '403 origin_forbidden', status: 403, code: 'origin_forbidden' },
    { label: '404 not_found', status: 404, code: 'not_found' },
    { label: '413 request_too_large', status: 413, code: 'request_too_large' },
    { label: '415 unsupported_media_type', status: 415, code: 'unsupported_media_type' },
    { label: '500 internal_error', status: 500, code: 'internal_error' },
    // 504 is a fallback situation but NOT a retry one: the model missed a
    // deadline that now sits well above its measured cost (#138), so a re-call
    // spends another full deadline on a cause likely to repeat. engine spec §5
    // — only hard validation failures trigger a re-call.
    { label: '504 bedrock_timeout', status: 504, code: 'bedrock_timeout' },
  ]

  for (const { label, status, code } of once) {
    it(`${label} ⇒ the wire saw 1 call and attempts === 1`, async () => {
      const { result, wireCalls } = await run([{ status, body: errorBody(code) }])
      expect(wireCalls, `${label} was retried — the same request produces the same ${status}`).toBe(1)
      expect(result.attempts).toBe(1)
    })
  }

  it('a 200 is never retried', async () => {
    const { result, wireCalls } = await run([{ status: 200, body: JSON.stringify(JUDGMENT_200) }])
    expect(wireCalls).toBe(1)
    expect(result.attempts).toBe(1)
    expect(result.ok).toBe(true)
  })

  it('a 4xx with x-llm-fallback:true injected is still called once', async () => {
    const { wireCalls } = await run([
      { status: 400, headers: fallbackHeaders('invalid_model_output'), body: errorBody('invalid_request') },
    ])
    expect(wireCalls).toBe(1)
  })
})

// ─── A5 — one named constant, no scattered literals ──────────────────────────

/** Every `.ts` under `src/transport/`, comment-stripped. */
function transportSources(): { rel: string; code: string }[] {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      return entry.isFile() && full.endsWith('.ts') ? [full] : []
    })

  return walk(TRANSPORT_DIR).map((file) => ({
    rel: path.relative(REPO, file),
    code: fs
      .readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/.*$/gm, '$1'),
  }))
}

describe('[e6#A5] the retry budget is one named constant', () => {
  it('RETRY_BUDGET is exported and equals 1 — one retry, two calls total', () => {
    expect(RETRY_BUDGET).toBe(1)
  })

  it('no budget is compared against a bare number anywhere in src/transport/**', () => {
    // e.g. `attempts < 2`, `retries <= 1`, `budget === 3` — the scattered-literal
    // failure mode A5 exists to prevent. `attempts += 1` is not a comparison and
    // is deliberately not matched.
    const offenders: string[] = []
    const comparison = /(?:attempts?|retr(?:y|ies)|budget)\s*[<>=!]+\s*\d/i
    for (const { rel, code } of transportSources()) {
      if (comparison.test(code)) offenders.push(`${rel} compares a budget to a literal`)
    }
    expect(offenders).toEqual([])
  })

  it('RETRY_BUDGET is the only budget-shaped constant bound to a number', () => {
    const offenders: string[] = []
    const binding = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*(\d+)\b/g
    for (const { rel, code } of transportSources()) {
      for (const match of code.matchAll(binding)) {
        const name = match[1]!
        if (!/attempt|retr|budget/i.test(name)) continue
        if (name === 'RETRY_BUDGET') continue
        offenders.push(`${rel} binds ${name} = ${match[2]} instead of deriving it from RETRY_BUDGET`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('the retry loop is driven by RETRY_BUDGET, not by a hard-coded status check', () => {
    const named = transportSources().filter(({ code }) => /\bRETRY_BUDGET\b/.test(code))
    expect(named.length, 'no file under src/transport/** names RETRY_BUDGET').toBeGreaterThan(0)
    const offenders: string[] = []
    for (const { rel, code } of transportSources()) {
      // 502/504 must be table rows (design D-i), not an `if` in the loop.
      if (/if\s*\([^)]*\b(?:status|code)\b[^)]*===\s*50[24]/.test(code)) {
        offenders.push(`${rel} branches on 502/504 instead of reading the row's retry flag`)
      }
    }
    expect(offenders).toEqual([])
  })
})
