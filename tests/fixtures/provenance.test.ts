// [u2f#c1] — spec-client §5.4: the demo fixture is the design target's RUN 03
// material REGENERATED against `data/scenario/우는다리/` (authored sentences with
// real ids, never lorem). Every Korean string on screen traces to a frozen
// scenario file or to the design target's authored material.
import { describe, it, expect } from 'vitest'
import {
  HANGUL,
  authoredTexts,
  designTarget,
  feedLines,
  nfc,
  stringLiterals,
  streamTexts,
  tracesToAuthored,
  unitSources,
} from './fixture-utils.ts'
import { woodariRun03, reportOf, WOODARI_BLOCKS, WOODARI_TALLY } from '../../src/client/driver/fixtures/index.ts'

/**
 * The ONLY sanctioned divergence from the design target (spec D3 row 3):
 * inv 2 forbids a digit in an `npc` line, so 20:22's `20분` is spelled out.
 * Every other reference line is ported verbatim.
 */
const PORTED_DEVIATIONS = [
  {
    from: '영장 없이는 못 엽니다. ……20분만 줘요.',
    to: '영장 없이는 못 엽니다. ……스무 분만 줘요.',
    reason: 'inv 2 / [u2f#c4]: no digit may appear in an `npc` line text',
  },
] as const

const DEVIATED = PORTED_DEVIATIONS.map((d) => nfc(d.to))
const HAYSTACK = [...authoredTexts(), ...DEVIATED]

/** Reference row → the text the fixture is expected to carry. */
const ported = (text: string): string => {
  const hit = PORTED_DEVIATIONS.find((d) => nfc(d.from) === nfc(text))
  return hit ? hit.to : text
}

const SYNTHETIC = /lorem|ipsum|synthetic|placeholder|dummy|샘플|테스트용|TODO|FIXME/i

describe('[u2f#c1] every Korean string in the fixture traces to authored material', () => {
  it('(a) the unit ships the woodari fixture modules', () => {
    const bases = unitSources().map((s) => s.base)
    expect(bases).toEqual(
      expect.arrayContaining([
        'woodari-run03.ts',
        'woodari-reports.ts',
        'woodari-meta.ts',
        'index.ts',
      ]),
    )
  })

  it('(b) every Korean string literal in the fixture sources traces to the pack or the design target', () => {
    const untraced: string[] = []
    for (const src of unitSources()) {
      for (const lit of stringLiterals(src.text)) {
        if (!HANGUL.test(lit)) continue
        if (!tracesToAuthored(lit, HAYSTACK)) untraced.push(`${src.rel}: ${JSON.stringify(lit)}`)
      }
    }
    expect(untraced).toEqual([])
  })

  it('(c) every string the stream renders traces to authored material', () => {
    const untraced = streamTexts(woodariRun03.events).filter(
      (t) => HANGUL.test(t) && !tracesToAuthored(t, HAYSTACK),
    )
    expect(untraced).toEqual([])
  })

  it('(d) archive reports, block store and tally trace too', () => {
    const texts = [
      ...([1, 2, 3] as const).flatMap((run) => {
        const r = reportOf(run)
        return [...r.facts, ...r.report_body].map((s) => s.text)
      }),
      ...WOODARI_BLOCKS.flatMap((b) => [b.text, b.axis ?? '', b.at, b.src]),
      ...WOODARI_TALLY.flatMap((r) => [r.label, String(r.value), String(r.baseline)]),
    ]
    const untraced = texts.filter((t) => HANGUL.test(t) && !tracesToAuthored(t, HAYSTACK))
    expect(untraced).toEqual([])
  })

  it('(e) no lorem / synthetic / placeholder string survives anywhere in the unit', () => {
    const offenders: string[] = []
    for (const src of unitSources())
      for (const lit of stringLiterals(src.text))
        if (SYNTHETIC.test(lit)) offenders.push(`${src.rel}: ${JSON.stringify(lit)}`)
    expect(offenders).toEqual([])
  })
})

describe('[u2f#c1] the stream IS the design target RUN 03 material', () => {
  it('(f) the run spans the authored day', () => {
    expect(woodariRun03.start).toBe('08:50')
    expect(woodariRun03.end).toBe('21:04')
  })

  it('(g) the feed lines are the reference FEED rows, in order, kind and clock intact', () => {
    const expected = designTarget().FEED.map((r) => ({
      kind: r.kind,
      clock: r.t,
      text: nfc(ported(r.text)),
      speaker: r.who ?? undefined,
    }))
    const actual = feedLines(woodariRun03.events).map((l) => ({
      kind: l.kind,
      clock: l.clock,
      text: nfc(l.text),
      speaker: l.speaker,
    }))
    expect(actual).toEqual(expected)
  })

  it('(h) the one sanctioned deviation is present and the reference text is gone', () => {
    const texts = feedLines(woodariRun03.events).map((l) => nfc(l.text))
    for (const d of PORTED_DEVIATIONS) {
      expect(texts).toContain(nfc(d.to))
      expect(texts).not.toContain(nfc(d.from))
    }
  })

  it('(i) run 03 report content is REPORT_R3, not invented', () => {
    const ref = designTarget().REPORT_R3
    const got = reportOf(3)
    expect(got.facts.map((s) => nfc(s.text))).toEqual(ref.facts.map((s) => nfc(s.text)))
    expect(got.report_body.map((s) => nfc(s.text))).toEqual(ref.body.map((s) => nfc(s.text)))
  })

  it('(j) runs 01/02 archive reports are the reference REPORTS', () => {
    for (const ref of designTarget().REPORTS) {
      const got = reportOf(ref.run as 1 | 2)
      expect(got.facts.map((s) => nfc(s.text))).toEqual(ref.facts.map((s) => nfc(s.text)))
      expect(got.report_body.map((s) => nfc(s.text))).toEqual(ref.body.map((s) => nfc(s.text)))
    }
  })
})
