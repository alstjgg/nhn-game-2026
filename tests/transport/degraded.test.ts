// [e6#A6] [e6#A7] [e6#A9] — "an unset value is not an error" (contract-calls §11,
// Endpoint configuration). VITE_PROXY_BASE_URL missing must leave the client
// running with LLM features DEGRADED, never crashed — that is what keeps a Pages
// deploy green while the proxy stack is down.
import { describe, it, expect } from 'vitest'

import {
  PROXY_BASE_URL_ENV_KEY,
  createFixtureProvider,
  createTransport,
  resolveProxyBaseUrl,
} from '../../src/transport/index.ts'

import {
  JUDGMENT_KEY_ORDER,
  JUDGMENT_REQUEST,
  NARRATION_KEY_ORDER,
  NARRATION_REQUEST,
  REPORTER_KEY_ORDER,
  REPORTER_REQUEST,
} from './_helpers.ts'

// ─── A6 — resolveProxyBaseUrl is pure and takes the env record ───────────────

describe('[e6#A6] resolveProxyBaseUrl reads the env record it is handed', () => {
  it('names the build-time key contract-calls §11 specifies', () => {
    expect(PROXY_BASE_URL_ENV_KEY).toBe('VITE_PROXY_BASE_URL')
  })

  const nullish: readonly { label: string; env: Record<string, string | undefined> }[] = [
    { label: 'the key is absent', env: {} },
    { label: 'the key is undefined', env: { [PROXY_BASE_URL_ENV_KEY]: undefined } },
    { label: 'the value is empty', env: { [PROXY_BASE_URL_ENV_KEY]: '' } },
    { label: 'the value is whitespace', env: { [PROXY_BASE_URL_ENV_KEY]: '   ' } },
    { label: 'the value is a tab/newline', env: { [PROXY_BASE_URL_ENV_KEY]: '\t\n' } },
  ]

  for (const { label, env } of nullish) {
    it(`${label} ⇒ null (not an error, not a throw)`, () => {
      expect(() => resolveProxyBaseUrl(env)).not.toThrow()
      expect(resolveProxyBaseUrl(env)).toBe(null)
    })
  }

  it('a set value round-trips, trimmed', () => {
    expect(resolveProxyBaseUrl({ [PROXY_BASE_URL_ENV_KEY]: 'https://proxy.example.test' })).toBe(
      'https://proxy.example.test',
    )
    expect(resolveProxyBaseUrl({ [PROXY_BASE_URL_ENV_KEY]: '  https://proxy.example.test  ' })).toBe(
      'https://proxy.example.test',
    )
  })

  it('ignores every other key in the record', () => {
    expect(resolveProxyBaseUrl({ VITE_AI_BASE_URL: 'https://wrong.example.test' })).toBe(null)
  })
})

// ─── A7 — a falsy baseUrl degrades to the fixture provider ──────────────────

describe('[e6#A7] createTransport degrades rather than throwing', () => {
  const degraded: readonly { label: string; deps: Parameters<typeof createTransport>[0] }[] = [
    { label: 'no deps at all', deps: {} },
    { label: 'baseUrl: null', deps: { baseUrl: null } },
    { label: 'baseUrl: undefined', deps: { baseUrl: undefined } },
    { label: 'baseUrl: ""', deps: { baseUrl: '' } },
    { label: 'baseUrl: "   "', deps: { baseUrl: '   ' } },
  ]

  for (const { label, deps } of degraded) {
    it(`${label} ⇒ no throw, mode === 'fixture'`, () => {
      expect(() => createTransport(deps)).not.toThrow()
      expect(createTransport(deps).mode).toBe('fixture')
    })
  }

  it('a base URL WITH an injected fetch is live, not fixture', () => {
    const transport = createTransport({
      baseUrl: 'https://proxy.example.test',
      fetch: () => Promise.reject(new Error('unused')),
    })
    expect(transport.mode).toBe('live')
  })

  it('a base URL with no way to reach the wire still does not throw', () => {
    expect(() => createTransport({ baseUrl: 'https://proxy.example.test' })).not.toThrow()
  })

  it('the degraded transport answers all three call types with ok:true', async () => {
    const transport = createTransport({})
    const judgment = await transport.send(JUDGMENT_REQUEST)
    const narration = await transport.send(NARRATION_REQUEST)
    const reporter = await transport.send(REPORTER_REQUEST)

    for (const result of [judgment, narration, reporter]) {
      expect(result.ok, 'the fixture provider must never fail').toBe(true)
      expect(result.attempts).toBe(1)
      expect(result.requestId).toBe(null)
    }
    expect(judgment.call_type).toBe('judgment')
    expect(narration.call_type).toBe('narration')
    expect(reporter.call_type).toBe('reporter')
  })

  it('an explicitly supplied provider wins over the fixture default', async () => {
    const provider = createFixtureProvider({
      judgment: {
        inner_note: 'stub note',
        stance: 'hold',
        because_referent: 'stub',
        because_block_ids: [],
        rejected_stance: 'evacuate',
        rejected_reason: 'stub',
        utterance: 'stub utterance',
      },
    })
    const result = await createTransport({ provider }).send(JUDGMENT_REQUEST)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.body.stance).toBe('hold')
    expect(result.body.inner_note).toBe('stub note')
  })
})

// ─── A9 — the fixture provider is deterministic and schema-complete ─────────

describe('[e6#A9] the fixture provider is deterministic', () => {
  it('declares itself as the fixture mode', () => {
    expect(createFixtureProvider().mode).toBe('fixture')
  })

  it('the same request twice ⇒ byte-identical JSON, for every call type', async () => {
    const provider = createFixtureProvider()
    for (const request of [JUDGMENT_REQUEST, NARRATION_REQUEST, REPORTER_REQUEST]) {
      const first = await provider.send(request)
      const second = await provider.send(request)
      expect(first.ok && second.ok).toBe(true)
      if (!first.ok || !second.ok) return
      expect(JSON.stringify(second.body)).toBe(JSON.stringify(first.body))
    }
  })

  it('two independently constructed providers agree byte for byte', async () => {
    const a = await createFixtureProvider().send(JUDGMENT_REQUEST)
    const b = await createFixtureProvider().send(JUDGMENT_REQUEST)
    expect(a.ok && b.ok).toBe(true)
    if (!a.ok || !b.ok) return
    expect(JSON.stringify(b.body)).toBe(JSON.stringify(a.body))
  })

  it('a caller mutating the returned body cannot poison the next call', async () => {
    const provider = createFixtureProvider()
    const first = await provider.send(JUDGMENT_REQUEST)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const before = JSON.stringify(first.body)
    first.body.inner_note = 'MUTATED'
    first.body.because_block_ids.push('b-poison')

    const second = await provider.send(JUDGMENT_REQUEST)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(JSON.stringify(second.body)).toBe(before)
  })

  it('the judgment fixture carries the §2 fields IN CONTRACT ORDER', async () => {
    const result = await createFixtureProvider().send(JUDGMENT_REQUEST)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.keys(result.body)).toEqual([...JUDGMENT_KEY_ORDER])
    expect(typeof result.body.inner_note).toBe('string')
    expect(typeof result.body.stance).toBe('string')
    expect(typeof result.body.because_referent).toBe('string')
    expect(Array.isArray(result.body.because_block_ids)).toBe(true)
    expect(typeof result.body.rejected_stance).toBe('string')
    expect(typeof result.body.rejected_reason).toBe('string')
    expect(typeof result.body.utterance).toBe('string')
  })

  it('the judgment fixture picks a stance that exists in the request’s stance set', async () => {
    const result = await createFixtureProvider().send(JUDGMENT_REQUEST)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const ids = JUDGMENT_REQUEST.slots.STANCE_SET.map((stance) => stance.id)
    expect(ids).toContain(result.body.stance)
    expect(result.body.stance).not.toBe(result.body.rejected_stance)
  })

  it('the narration fixture carries the §3 fields', async () => {
    const result = await createFixtureProvider().send(NARRATION_REQUEST)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.keys(result.body)).toEqual([...NARRATION_KEY_ORDER])
    expect(result.body.timeline_entries.length).toBeGreaterThan(0)
    expect(result.body.npc_lines.length).toBeGreaterThan(0)
    // §3: "<npc_id>: <line>" — prefixed strings, because nested objects are banned.
    for (const line of result.body.npc_lines) expect(line).toMatch(/^[^:]+:\s?.+/)
  })

  it('the reporter fixture carries the §4 fields', async () => {
    const result = await createFixtureProvider().send(REPORTER_REQUEST)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.keys(result.body)).toEqual([...REPORTER_KEY_ORDER])
    expect(result.body.facts.length).toBeGreaterThan(0)
    expect(result.body.report_body.length).toBeGreaterThan(0)
  })
})
