// [u2f#c2] — spec-client §5.2 amendment (sentence identity is engine-minted):
// minted ids are `b-r<run>-<channel><nn>`; authored script lines keep
// timeline.json's `t*` ids and are run-independent, so the same sentence keeps
// the same block id across runs — which is what makes archive highlighting work.
import { describe, it, expect } from 'vitest'
import {
  feedLines,
  minableLines,
  nfc,
  streamSentences,
  timelineEvents,
} from './fixture-utils.ts'
import {
  woodariRun03,
  reportOf,
  CARRIED,
  WOODARI_BLOCKS,
} from '../../src/client/driver/fixtures/index.ts'

/** A1: c2 lists `{f,b,n,q}`; C13 mints `u` (Call-1 utterance) as a fifth. */
const MINTED = /^b-r[1-9]\d*-([fbnqu])(\d{2})$/
const AUTHORED = /^t\d+$/

interface Identified {
  id: string
  text: string
  where: string
}

const all = (): Identified[] => [
  ...streamSentences(woodariRun03.events).map((s) => ({ id: s.id, text: s.text, where: s.where })),
  ...minableLines(woodariRun03.events),
  ...([1, 2, 3] as const).flatMap((run) => {
    const r = reportOf(run)
    return [
      ...r.facts.map((s) => ({ id: s.id, text: s.text, where: `reportOf(${run}).facts` })),
      ...r.report_body.map((s) => ({ id: s.id, text: s.text, where: `reportOf(${run}).report_body` })),
    ]
  }),
  ...WOODARI_BLOCKS.map((b) => ({ id: b.id, text: b.text, where: 'WOODARI_BLOCKS' })),
]

describe('[u2f#c2] id scheme', () => {
  it('(a) every id is either `b-r<run>-<ch><nn>` (ch ∈ f,b,n,q,u) or an authored `t*`', () => {
    const bad = all()
      .filter((s) => !MINTED.test(s.id) && !AUTHORED.test(s.id))
      .map((s) => `${s.where}: ${s.id}`)
    expect(bad).toEqual([])
  })

  it('(b) every `sentence_id` on a feed line follows the same scheme', () => {
    const bad = feedLines(woodariRun03.events)
      .filter((l) => l.sentence_id !== undefined)
      .filter((l) => !MINTED.test(l.sentence_id as string) && !AUTHORED.test(l.sentence_id as string))
      .map((l) => `${l.clock} ${l.kind}: ${l.sentence_id}`)
    expect(bad).toEqual([])
  })

  it('(c) `symptom` / `wait` / `mark` / `fallback` lines are not minable (D1, inv 2)', () => {
    const bad = feedLines(woodariRun03.events)
      .filter((l) => ['symptom', 'wait', 'mark', 'fallback'].includes(l.kind))
      .filter((l) => l.sentence_id !== undefined)
      .map((l) => `${l.clock} ${l.kind}`)
    expect(bad).toEqual([])
  })

  it('(d) authored `t*` ids exist in timeline.json and the line clock matches the authored time', () => {
    const byId = new Map(timelineEvents().map((e) => [e.id, e]))
    const used = feedLines(woodariRun03.events).filter(
      (l) => typeof l.sentence_id === 'string' && AUTHORED.test(l.sentence_id),
    )
    expect(used.length).toBeGreaterThan(0)
    const bad: string[] = []
    for (const l of used) {
      const authored = byId.get(l.sentence_id as string)
      if (!authored) bad.push(`${l.sentence_id} is not a timeline.json event`)
      else if (authored.time !== l.clock)
        bad.push(`${l.sentence_id}: line clock ${l.clock} ≠ authored time ${authored.time}`)
    }
    expect(bad).toEqual([])
  })

  // ADDED 08-05 (R1 on woodari-run03.ts:121). (d) checked that a claimed `t*` id
  // EXISTS in timeline.json and that the clocks agree — not that the line says
  // what the pack says. Eleven of the thirteen did not: 09:25 claimed `t2` for a
  // sentence the pack never wrote, 19:10 claimed `t15` for another scene. The id
  // is the identity (§5.2 — same sentence, same block, every run), so this pins
  // the text itself.
  it('(k) an authored `t*` id carries timeline.json’s sentence, verbatim', () => {
    const byId = new Map(timelineEvents().map((e) => [e.id, e]))
    const used = feedLines(woodariRun03.events).filter(
      (l) => typeof l.sentence_id === 'string' && AUTHORED.test(l.sentence_id),
    )
    expect(used.length, 'the fixture claims no `t*` id at all — the check is vacuous').toBeGreaterThan(0)
    const wrong: string[] = []
    for (const line of used) {
      const authored = byId.get(line.sentence_id as string)
      if (!authored) {
        wrong.push(`${line.sentence_id} is not a timeline.json event`)
        continue
      }
      if (nfc(authored.text) !== nfc(line.text)) {
        wrong.push(`${line.sentence_id}: the fixture line is not the authored sentence`)
      }
    }
    expect(wrong, 'a `t*` id names prose the pack never wrote').toEqual([])
  })

  it('(e) an authored `t*` id carries exactly one text across the whole fixture', () => {
    const texts = new Map<string, Set<string>>()
    for (const s of all()) {
      if (!AUTHORED.test(s.id)) continue
      const set = texts.get(s.id) ?? new Set<string>()
      set.add(nfc(s.text))
      texts.set(s.id, set)
    }
    const split = [...texts].filter(([, v]) => v.size > 1).map(([k, v]) => `${k}: ${v.size} texts`)
    expect(split).toEqual([])
  })

  it('(f) no id anywhere maps to two different texts (archive highlighting is keyed on the id)', () => {
    const texts = new Map<string, Set<string>>()
    for (const s of all()) {
      const set = texts.get(s.id) ?? new Set<string>()
      set.add(nfc(s.text))
      texts.set(s.id, set)
    }
    const split = [...texts]
      .filter(([, v]) => v.size > 1)
      .map(([k, v]) => `${k}: ${[...v].join(' | ')}`)
    expect(split).toEqual([])
  })

  it('(g) minted `<nn>` is contiguous from 01 within each (run, channel)', () => {
    const seq = new Map<string, Set<number>>()
    for (const s of all()) {
      const m = MINTED.exec(s.id)
      if (!m) continue
      const key = `${s.id.slice(0, s.id.lastIndexOf('-'))}${m[1]}`
      const set = seq.get(key) ?? new Set<number>()
      set.add(Number(m[2]))
      seq.set(key, set)
    }
    expect(seq.size).toBeGreaterThan(0)
    const gaps: string[] = []
    for (const [key, set] of seq) {
      const nums = [...set].sort((a, b) => a - b)
      const want = nums.map((_, i) => i + 1)
      if (nums.join(',') !== want.join(',')) gaps.push(`${key}: ${nums.join(',')}`)
    }
    expect(gaps).toEqual([])
  })

  it('(h) all five channels are exercised (D1)', () => {
    const channels = new Set<string>()
    for (const s of all()) {
      const m = MINTED.exec(s.id)
      if (m) channels.add(m[1] as string)
    }
    expect([...channels].sort()).toEqual(['b', 'f', 'n', 'q', 'u'])
  })

  it('(i) a report sentence carries the run it belongs to', () => {
    for (const run of [1, 2, 3] as const) {
      const r = reportOf(run)
      const wrong = [...r.facts, ...r.report_body]
        .filter((s) => !s.id.startsWith(`b-r${run}-`))
        .map((s) => s.id)
      expect(wrong).toEqual([])
    }
  })

  it('(j) carried block ids follow the scheme and name run-01/02 sentences', () => {
    const bad = CARRIED.filter((id) => !MINTED.test(id))
    expect(bad).toEqual([])
    const foreign = CARRIED.filter((id) => !/^b-r[12]-/.test(id))
    expect(foreign).toEqual([])
  })
})
