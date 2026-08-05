// [e4#A10] — D1 id stability.
//
// This is the gate against the run's real failure mode: re-splitting one
// sentence renumbers every id after it, and archive highlighting keyed on those
// ids then silently points at the wrong text in **every stored run**. So the
// golden pins id ⟷ text pairs, not ids alone — an id that survives while its
// text moves is exactly the regression that would otherwise ship silently.
//
// Changing `__golden__/id.golden.json` is a BREAKING CHANGE, not a test fix.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createIdAllocator,
  buildFeed,
  buildReportSentences,
} from '../../../src/engine/feed/index.ts'
import { GOLDEN_BEAT, GOLDEN_REPORT } from './__fixtures__/beat.ts'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const GOLDEN_PATH = path.join(HERE, '__golden__/id.golden.json')

type GoldenLine = {
  kind: string
  clock: string
  text: string
  speaker?: string
  sentence_id?: string
}
type GoldenSentence = { id: string; text: string; species: string }
type Golden = {
  _header: string[]
  run: number
  feed: GoldenLine[]
  drops: { index: number; raw: string; reason: string }[]
  facts: GoldenSentence[]
  report_body: GoldenSentence[]
}

const golden = JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8')) as Golden

/** One run: the beat first, then the round-end report, over ONE allocator. */
function produce() {
  const ids = createIdAllocator(golden.run)
  const feed = buildFeed(GOLDEN_BEAT, ids)
  const report = buildReportSentences(GOLDEN_REPORT, ids)
  return { feed, report }
}

describe('[e4#A10] the D1 golden', () => {
  it('(a) the golden file exists and still carries its breaking-change header', () => {
    expect(fs.existsSync(GOLDEN_PATH)).toBe(true)
    expect(golden._header.join(' ')).toMatch(/BREAKING CHANGE/i)
  })

  it('(b) the fixture beat\'s feed lines are byte-identical to the golden', () => {
    const actual = produce().feed.lines.map((l) => JSON.parse(JSON.stringify(l)))
    expect(actual).toEqual(golden.feed)
  })

  it('(c) the emitted id sequence is byte-identical, in emission order', () => {
    const actual = produce().feed.lines.map((l) => l.sentence_id ?? null)
    expect(actual).toEqual(golden.feed.map((l) => l.sentence_id ?? null))
  })

  it('(d) every golden id still points at the same text (the archive-highlight gate)', () => {
    const actual = new Map(
      produce()
        .feed.lines.filter((l) => l.sentence_id !== undefined)
        .map((l) => [l.sentence_id!, l.text] as const),
    )
    for (const line of golden.feed) {
      if (line.sentence_id === undefined) continue
      expect(actual.get(line.sentence_id), `id ${line.sentence_id} moved off its text`).toBe(
        line.text,
      )
    }
  })

  it('(e) the drop record is byte-identical (a drop that stops dropping renumbers `q`)', () => {
    expect(JSON.parse(JSON.stringify(produce().feed.drops))).toEqual(golden.drops)
  })

  it('(f) `facts` sentences are byte-identical to the golden', () => {
    expect(JSON.parse(JSON.stringify(produce().report.facts))).toEqual(golden.facts)
  })

  it('(g) `report_body` sentences are byte-identical — the re-split gate', () => {
    expect(JSON.parse(JSON.stringify(produce().report.report_body))).toEqual(golden.report_body)
  })

  it('(h) the golden covers everything A10 requires it to cover', () => {
    expect(golden.report_body.length).toBeGreaterThanOrEqual(4)
    expect(golden.report_body.some((s) => s.text === '비상문은 잠겨 있었다.')).toBe(true) // bullet
    expect(golden.report_body.some((s) => !/[.!?…]$/.test(s.text))).toBe(true) // no-terminator tail
    expect(golden.facts.length).toBeGreaterThanOrEqual(2)
    expect(golden.feed.filter((l) => l.kind === 'event' && l.sentence_id?.startsWith('b-r')).length)
      .toBeGreaterThanOrEqual(2) // timeline_entries
    expect(golden.feed.filter((l) => l.kind === 'npc').length + golden.drops.length)
      .toBeGreaterThanOrEqual(3) // >=3 npc_lines, one of which drops
    expect(golden.drops.length).toBe(1)
    expect(golden.feed.filter((l) => l.kind === 'radio')).toHaveLength(1) // the utterance
    expect(golden.feed.filter((l) => l.kind === 'symptom')).toHaveLength(1)
    expect(golden.feed.filter((l) => l.sentence_id === 't3')).toHaveLength(1) // the t* script line
  })

  it('(i) producing it twice in one process yields the same bytes', () => {
    expect(JSON.stringify(produce())).toBe(JSON.stringify(produce()))
  })
})
