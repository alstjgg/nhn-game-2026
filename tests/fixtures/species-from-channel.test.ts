// [u2f#c3] — spec-client §5.2: species DERIVES FROM THE CHANNEL, never from
// classification. The derivation map is a single exported table
// (`src/shared/species.ts`, consume-only per C13) and the fixture contains no
// hand-classified species.
import { describe, it, expect } from 'vitest'
import { AUTHORED_SPECIES, SPECIES_OF } from '../../src/shared/species.ts'
import type { Channel } from '../../src/shared/species.ts'
import { stringLiterals, streamSentences, unitSources } from './fixture-utils.ts'
import { woodariRun03, reportOf } from '../../src/client/driver/fixtures/index.ts'

const SPECIES_LITERALS = ['fact', 'selfnarr', 'emotion', 'quote'] as const

const channelOf = (id: string): Channel | null => {
  const m = /^b-r[1-9]\d*-([fbnqu])\d{2}$/.exec(id)
  return m ? (m[1] as Channel) : null
}

const expected = (id: string): string => {
  const ch = channelOf(id)
  return ch === null ? AUTHORED_SPECIES : SPECIES_OF[ch]
}

const sentences = () => [
  ...streamSentences(woodariRun03.events),
  ...([1, 2, 3] as const).flatMap((run) => {
    const r = reportOf(run)
    return [...r.facts, ...r.report_body].map((s) => ({ ...s, where: `reportOf(${run})` }))
  }),
]

describe('[u2f#c3] species derives from the channel', () => {
  it('(a) every sentence species equals the table entry for its channel', () => {
    const wrong = sentences()
      .filter((s) => s.species !== expected(s.id))
      .map((s) => `${s.where} ${s.id}: ${s.species} ≠ ${expected(s.id)}`)
    expect(wrong).toEqual([])
    expect(sentences().length).toBeGreaterThan(0)
  })

  it('(b) the f-channel is `fact` and the b-channel is `selfnarr` — the reference classification is overridden (D3)', () => {
    // b-r2-f02 / b-r2-f07 read `quote` in the design target; b-r1-b06,
    // b-r2-b03, b-r2-b06, b-r3-b05, b-r3-b06 read `emotion`. Channel wins.
    const byId = new Map(sentences().map((s) => [s.id, s]))
    for (const id of ['b-r2-f02', 'b-r2-f07']) expect(byId.get(id)?.species).toBe(SPECIES_OF.f)
    for (const id of ['b-r1-b06', 'b-r2-b03', 'b-r2-b06', 'b-r3-b05', 'b-r3-b06'])
      expect(byId.get(id)?.species).toBe(SPECIES_OF.b)
  })

  it('(c) no species literal appears in any fixture source of this unit', () => {
    const offenders: string[] = []
    for (const src of unitSources())
      for (const lit of stringLiterals(src.text))
        if ((SPECIES_LITERALS as readonly string[]).includes(lit))
          offenders.push(`${src.rel}: '${lit}'`)
    expect(offenders).toEqual([])
  })

  it('(d) no fixture source declares a local channel→species table', () => {
    const offenders: string[] = []
    for (const src of unitSources()) {
      const code = src.text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
      if (/\b(SPECIES_OF|AUTHORED_SPECIES|Species)\b\s*[:=]\s*(\{|'|")/.test(code))
        offenders.push(`${src.rel}: re-declares the species table`)
    }
    expect(offenders).toEqual([])
  })

  it('(e) the derivation happens in exactly one module (single derivation point)', () => {
    const users = unitSources()
      .filter((s) => /\bSPECIES_OF\b/.test(s.text))
      .map((s) => s.rel)
    expect(users.length).toBe(1)
  })

  it('(f) axis is authored metadata, never a species', () => {
    const axes = sentences()
      .map((s) => s.axis)
      .filter((a): a is string => typeof a === 'string')
    const leaked = axes.filter((a) => (SPECIES_LITERALS as readonly string[]).includes(a))
    expect(leaked).toEqual([])
  })
})
