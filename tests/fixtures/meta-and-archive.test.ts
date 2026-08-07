// [u2f#c6] — spec-client §5.2 (meta) + §7 #5: `meta` supplies the run counter,
// runs_left, the carried blocks and the archive list, labelled by RUN and TIME
// only. Inv 6: no gate label may appear anywhere the player can see.
import { describe, it, expect } from 'vitest'
import { nfc, streamTexts } from './fixture-utils.ts'
import {
  woodariRun03,
  reportOf,
  RUN,
  RUNS_LEFT,
  ARCHIVE,
  CARRIED,
  WOODARI_BLOCKS,
  WOODARI_TALLY,
} from '../../src/client/driver/fixtures/index.ts'

const ARCHIVE_LABEL = /^RUN 0[12] \/ \d{2}:\d{2} — \d{2}:\d{2}$/
const GATE_LABEL = /\bG[1-9]\b|갈림길|게이트|gate/i

const metaEvents = () => woodariRun03.events.flatMap((e) => (e.type === 'meta' ? [e] : []))
const scoreEvents = () => woodariRun03.events.flatMap((e) => (e.type === 'score' ? [e] : []))

describe('[u2f#c6] meta carries the run-loop state', () => {
  it('(a) at least one `meta` event is emitted', () => {
    expect(metaEvents().length).toBeGreaterThan(0)
  })

  it('(b) run counter and runs_left match the design target run state', () => {
    expect(RUN).toBe(3)
    expect(RUNS_LEFT).toBe(7)
    for (const m of metaEvents()) {
      expect(m.run).toBe(RUN)
      expect(m.runs_left).toBe(RUNS_LEFT)
    }
  })

  it('(c) nine blocks are carried in from runs 01–02', () => {
    expect(CARRIED.length).toBe(9)
    for (const m of metaEvents()) expect([...m.carried]).toEqual([...CARRIED])
  })

  it('(d) every carried id names a run-01/02 report sentence with identical text', () => {
    const archived = new Map<string, string>()
    for (const run of [1, 2] as const) {
      const r = reportOf(run)
      for (const s of [...r.facts, ...r.report_body]) archived.set(s.id, nfc(s.text))
    }
    const blocks = new Map(WOODARI_BLOCKS.map((b) => [b.id, nfc(b.text)]))
    const bad: string[] = []
    for (const id of CARRIED) {
      const inReport = archived.get(id)
      if (inReport === undefined) bad.push(`${id}: not in the run-01/02 archive reports`)
      else if (blocks.get(id) !== undefined && blocks.get(id) !== inReport)
        bad.push(`${id}: block text ≠ report text`)
    }
    expect(bad).toEqual([])
  })

  it('(e) the block store keeps the slot state the `meta` shape cannot carry (D3)', () => {
    expect(WOODARI_BLOCKS.length).toBe(9)
    expect(WOODARI_BLOCKS.map((b) => b.id).sort()).toEqual([...CARRIED].sort())
    const slotted = WOODARI_BLOCKS.filter((b) => b.slot !== null && b.slot !== undefined)
    expect(slotted.length).toBe(2)
    expect(slotted.map((b) => b.slot).sort()).toEqual([0, 1])
    for (const b of slotted) expect(b.run).toBe(2)
  })
})

describe('[u2f#c6] archive is labelled by run and time only', () => {
  it('(f) two archive entries, one per completed run', () => {
    expect(ARCHIVE.length).toBe(2)
    expect(ARCHIVE.map((a) => a.run)).toEqual([1, 2])
    for (const m of metaEvents()) {
      expect(m.archive.length).toBe(2)
      expect(m.archive.map((a) => a.run)).toEqual([1, 2])
    }
  })

  it('(g) every archive label matches `RUN 0N / HH:MM — HH:MM`', () => {
    const labels = [...ARCHIVE.map((a) => a.label), ...metaEvents().flatMap((m) => m.archive.map((a) => a.label))]
    const bad = labels.filter((l) => !ARCHIVE_LABEL.test(nfc(l)))
    expect(bad).toEqual([])
  })

  it('(h) NO GATE LABEL appears in any string the fixture renders (inv 6)', () => {
    const strings = [
      ...streamTexts(woodariRun03.events),
      ...ARCHIVE.map((a) => a.label),
      ...WOODARI_BLOCKS.flatMap((b) => [b.text, b.axis ?? '', b.src, b.at]),
      ...WOODARI_TALLY.flatMap((r) => [r.label, String(r.value), String(r.baseline)]),
      ...([1, 2, 3] as const).flatMap((run) => {
        const r = reportOf(run)
        return [...r.facts, ...r.report_body].flatMap((s) => [s.text, s.axis ?? ''])
      }),
    ]
    const leaked = strings.filter((s) => GATE_LABEL.test(s))
    expect(leaked).toEqual([])
  })
})

describe('[u2f#c6] the score event is scenario-backed (D3 row 4 / A4)', () => {
  it('(i) exactly one `score` event, total 7', () => {
    expect(scoreEvents().length).toBe(1)
    expect(scoreEvents()[0]?.total).toBe(7)
  })

  it('(j) its rows carry values, not the display sentence — and only 사망 counts', () => {
    // `총계` is the sum of the NUMERIC values (`src/driver/scorer.ts` `totalOf`),
    // so a row that is not a body count has to be a word or it joins the
    // headline. All three were numbers against a total of 7 — 200 + 7 + 19
    // summing to 226 — until the feed's closing 집계 line began printing the
    // breakdown beside the headline and the two had to agree.
    const rows = scoreEvents()[0]?.rows ?? []
    expect(rows.map((r) => nfc(r.label))).toEqual(['진입', '사망', '부상'])
    expect(rows.map((r) => (typeof r.value === 'string' ? nfc(r.value) : r.value))).toEqual([
      '200명',
      7,
      '19명',
    ])
    const counted = rows.filter((r) => typeof r.value === 'number')
    expect(counted.reduce((sum, r) => sum + (r.value as number), 0)).toBe(scoreEvents()[0]?.total)
    // The display sentence stays out of the seam: `진입 200 · 사망 7 · 부상 19`
    // is `WOODARI_TALLY`'s, and no row value is a rendered line.
    for (const r of rows) expect(String(r.value)).not.toContain('·')
  })

  it('(k) the full display tally survives beside it', () => {
    expect(WOODARI_TALLY.length).toBe(8)
  })
})
