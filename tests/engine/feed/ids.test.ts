// [e4#A1][e4#A2] — contract-engine-composer §8-8: every generated feed line
// carries a well-formed, engine-minted id on the channel that produced it, and
// authored `t*` script lines carry `timeline.json`'s id verbatim, unchanged
// across two runs.
//
// The channel→species map and the grammar are consumed from `src/shared/`
// (e0's merged minter) — never re-declared here, because a second table is the
// drift the map exists to prevent.
import { describe, it, expect } from 'vitest'

import { SPECIES_OF } from '../../../src/shared/species.ts'
import { parseSentenceId, isAuthoredSentenceId } from '../../../src/shared/id.ts'
import { segmentReportBody } from '../../../src/shared/segment.ts'
import {
  createIdAllocator,
  buildFeed,
  buildReportSentences,
} from '../../../src/engine/feed/index.ts'
import type { FeedLine, Sentence } from '../../../src/shared/view-driver.ts'
import {
  GOLDEN_BEAT,
  GOLDEN_REPORT,
  SCRIPT_LINE,
  UTTERANCE,
  TIMELINE_ENTRIES,
  SYMPTOM,
} from './__fixtures__/beat.ts'

/** A1's regex, as written in the criterion. */
const MINTED = /^b-r\d+-[fbnqu]\d{2,}$/

const minted = (lines: readonly FeedLine[]) =>
  lines.filter((l) => l.sentence_id !== undefined && !isAuthoredSentenceId(l.sentence_id))

function feedOf(run: number) {
  return buildFeed(GOLDEN_BEAT, createIdAllocator(run))
}

describe('[e4#A1] every generated feed line carries a minted id on its own channel', () => {
  it('(a) every minted feed id matches ^b-r\\d+-[fbnqu]\\d{2,}$', () => {
    const bad = minted(feedOf(1).lines).filter((l) => !MINTED.test(l.sentence_id!))
    expect(bad.map((l) => l.sentence_id)).toEqual([])
  })

  it('(b) the utterance mints on channel `u`', () => {
    const line = feedOf(1).lines.find((l) => l.text === UTTERANCE)
    expect(line, 'the Call 1 utterance produced no feed line').toBeDefined()
    expect(parseSentenceId(line!.sentence_id!).channel).toBe('u')
  })

  it('(c) every timeline_entry mints on channel `n`, in array order', () => {
    const lines = feedOf(1).lines.filter((l) => TIMELINE_ENTRIES.includes(l.text as never))
    expect(lines.map((l) => l.text)).toEqual([...TIMELINE_ENTRIES])
    expect(lines.map((l) => parseSentenceId(l.sentence_id!).channel)).toEqual(['n', 'n'])
    expect(lines.map((l) => parseSentenceId(l.sentence_id!).index)).toEqual([1, 2])
  })

  it('(d) every surviving npc line mints on channel `q`', () => {
    const lines = feedOf(1).lines.filter((l) => l.kind === 'npc')
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.map((l) => parseSentenceId(l.sentence_id!).channel)).toEqual(
      lines.map(() => 'q'),
    )
  })

  it('(e) the run component of every minted id is the allocator run', () => {
    const runs = minted(feedOf(7).lines).map((l) => parseSentenceId(l.sentence_id!).run)
    expect(new Set(runs)).toEqual(new Set([7]))
  })

  it('(f) `<nn>` is 1-based and zero-padded to at least two digits', () => {
    const ids = minted(feedOf(1).lines).map((l) => l.sentence_id!)
    expect(ids.every((id) => /(\d{2,})$/.test(id))).toBe(true)
    expect(ids.map((id) => parseSentenceId(id).index).every((i) => i >= 1)).toBe(true)
  })

  it('(g) the species of every minted line derives from its channel via SPECIES_OF', () => {
    for (const line of minted(feedOf(1).lines)) {
      const parsed = parseSentenceId(line.sentence_id!)
      expect(parsed.species).toBe(SPECIES_OF[parsed.channel])
    }
  })
})

describe('[e4#A1] Call 3 mints `f` and `b` on the Sentence path (decision 4)', () => {
  const report = () => buildReportSentences(GOLDEN_REPORT, createIdAllocator(1))

  it('(h) every `facts` sentence is minted on `f`, in array order', () => {
    const facts: Sentence[] = report().facts
    expect(facts.map((s) => s.text)).toEqual([...GOLDEN_REPORT.facts])
    expect(facts.map((s) => parseSentenceId(s.id).channel)).toEqual(['f', 'f'])
    expect(facts.map((s) => parseSentenceId(s.id).index)).toEqual([1, 2])
  })

  it('(i) `report_body` is minted on `b`, one sentence per segmentReportBody output', () => {
    const expected = segmentReportBody(GOLDEN_REPORT.report_body)
    const body: Sentence[] = report().report_body
    expect(body.map((s) => s.text)).toEqual(expected)
    expect(body.map((s) => parseSentenceId(s.id).channel)).toEqual(expected.map(() => 'b'))
    expect(body.map((s) => parseSentenceId(s.id).index)).toEqual(expected.map((_, i) => i + 1))
  })

  it('(j) species comes from SPECIES_OF, not from classification', () => {
    const { facts, report_body } = report()
    expect(new Set(facts.map((s) => s.species))).toEqual(new Set([SPECIES_OF.f]))
    expect(new Set(report_body.map((s) => s.species))).toEqual(new Set([SPECIES_OF.b]))
  })

  it('(k) `f` is allocated entirely before `b` (decision 2 round-end order)', () => {
    const ids = createIdAllocator(1)
    buildReportSentences(GOLDEN_REPORT, ids)
    expect(ids.used('f')).toBe(GOLDEN_REPORT.facts.length)
    expect(ids.used('b')).toBe(segmentReportBody(GOLDEN_REPORT.report_body).length)
  })
})

describe('[e4#A1] the per-(run, channel) counter (decision 1)', () => {
  it('(l) counters are independent per channel and monotonic across a run', () => {
    const ids = createIdAllocator(2)
    expect([ids.next('n'), ids.next('q'), ids.next('n')]).toEqual([
      'b-r2-n01',
      'b-r2-q01',
      'b-r2-n02',
    ])
  })

  it('(m) two beats in one run continue the counter rather than resetting it', () => {
    const ids = createIdAllocator(1)
    const first = buildFeed(GOLDEN_BEAT, ids)
    const second = buildFeed(GOLDEN_BEAT, ids)
    const nOf = (r: { lines: FeedLine[] }) =>
      minted(r.lines)
        .map((l) => parseSentenceId(l.sentence_id!))
        .filter((p) => p.channel === 'n')
        .map((p) => p.index)
    expect(nOf(first)).toEqual([1, 2])
    expect(nOf(second)).toEqual([3, 4])
  })

  it('(n) the counter widens past 99 rather than truncating or wrapping', () => {
    const ids = createIdAllocator(1)
    let last = ''
    for (let i = 0; i < 100; i += 1) last = ids.next('f')
    expect(last).toBe('b-r1-f100')
  })

  it('(o) the allocator is not module-global — two allocators do not share state', () => {
    const a = createIdAllocator(1)
    const b = createIdAllocator(1)
    expect([a.next('u'), b.next('u')]).toEqual(['b-r1-u01', 'b-r1-u01'])
  })
})

describe('[e4#A2] `t*` authored ids are never minted and never renumbered', () => {
  it('(p) the script line carries timeline.json\'s id verbatim', () => {
    const line = feedOf(1).lines.find((l) => l.text === SCRIPT_LINE.text)
    expect(line?.sentence_id).toBe(SCRIPT_LINE.id)
    expect(isAuthoredSentenceId(line!.sentence_id!)).toBe(true)
  })

  it('(q) the script line is byte-identical across two runs with different run numbers', () => {
    const pick = (run: number) => feedOf(run).lines.find((l) => l.text === SCRIPT_LINE.text)
    expect(JSON.stringify(pick(1))).toBe(JSON.stringify(pick(42)))
  })

  it('(r) minted ids DO differ across those two runs (the control for (q))', () => {
    const u = (run: number) => feedOf(run).lines.find((l) => l.text === UTTERANCE)!.sentence_id
    expect(u(1)).not.toBe(u(42))
  })

  it('(s) no id is ever minted on channel `t`', () => {
    const ids = createIdAllocator(1)
    expect(() => (ids as { next(c: string): string }).next('t')).toThrow()
  })

  it('(t) `t*` consumes no sequence number on any minted channel', () => {
    const ids = createIdAllocator(1)
    buildFeed(GOLDEN_BEAT, ids)
    // one utterance, two timeline_entries, two surviving npc lines — the script
    // line and the symptom take nothing.
    expect([ids.used('u'), ids.used('n'), ids.used('q')]).toEqual([1, 2, 2])
  })

  it('(u) the symptom line consumes no sequence number either', () => {
    const withSymptom = createIdAllocator(1)
    buildFeed(GOLDEN_BEAT, withSymptom)
    const without = createIdAllocator(1)
    buildFeed({ ...GOLDEN_BEAT, symptoms: [] }, without)
    for (const c of ['u', 'n', 'q'] as const) {
      expect(withSymptom.used(c), `symptoms moved the ${c} counter`).toBe(without.used(c))
    }
    expect(SYMPTOM.length).toBeGreaterThan(0)
  })
})
