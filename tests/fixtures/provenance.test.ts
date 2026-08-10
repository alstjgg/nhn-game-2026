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
 * The sanctioned divergences from the design target. The target itself is
 * frozen (`docs/design/` — [u2f#c10] in dev-only.test.ts), so a copy revision
 * that supersedes a reference line is recorded here, never written back.
 *  1. spec D3 row 3: inv 2 forbids a digit in an `npc` line, so 20:22's
 *     `20분` is spelled out.
 *  2. plan-playtest G2 (g1-1, 08-07): the fatal-fallback line stays in
 *     fiction instead of narrating the mechanism.
 * Every other reference line is ported verbatim.
 */
const PORTED_DEVIATIONS = [
  {
    from: '영장 없이는 못 엽니다. ……20분만 줘요.',
    to: '영장 없이는 못 엽니다. ……스무 분만 줘요.',
    reason: 'inv 2 / [u2f#c4]: no digit may appear in an `npc` line text',
  },
  {
    from: '회신 실패 — 기본 응답으로 대체. 요원은 상황실에 잔류.',
    to: '회신 불량. 요원은 상황실에 잔류.',
    reason: 'plan-playtest G2 / g1-1: fallback copy stays in fiction; the frozen target keeps the old line',
  },
] as const

/**
 * Reference rows the port no longer carries AT ALL. `PORTED_DEVIATIONS` is a
 * substitution valve; this is a removal, and it needs one of its own for exactly
 * the same reason — `docs/design/` is frozen ([u2f#c10] in `dev-only.test.ts`),
 * so a mechanism the client dropped cannot be edited out of the target.
 *
 * x6 (민서, 08-09): the waiting marker was removed outright — no feed line, no
 * screen-reader toast, no CSS, and `components/waiting-marker.ts` deleted. The
 * target's six `wait` rows (`무전 회신 대기 중`, app.js:428's `……` + breathing
 * dots) were the whole of its content, so the port drops them and the paper
 * shows nothing for a call in flight.
 *
 * What is NOT dropped is the seam's `waiting` bracket: `shared/view-driver.ts`
 * is frozen, `driver/live-driver.ts` still emits it and the live adapter's queue
 * is built around it, so `woodari-run03.ts` still opens and closes one — off the
 * row that placed the call (`call: true`) now that there is no marker line to
 * hang it on. `feed-shape.test.ts` (k) is what holds that.
 */
const DROPPED_KINDS = new Set<string>(['wait'])

/**
 * Non-FEED copy revisions that supersede design-target vocabulary (the target
 * is frozen — see PORTED_DEVIATIONS above). These feed the trace haystack for
 * (b)/(d) only; they are not feed lines, so (g)/(h) do not read them.
 */
const COPY_DEVIATIONS = [
  {
    from: '객관 로그',
    to: '현장 기록',
    reason: 'plan-playtest C4 / g1-4: the record reads as fieldwork; the frozen target keeps the old name',
  },
] as const

const DEVIATED = [...PORTED_DEVIATIONS, ...COPY_DEVIATIONS].map((d) => nfc(d.to))
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
    const reference = designTarget().FEED
    // Non-vacuity for the valve: if the target ever stops carrying a dropped
    // kind, the exclusion is dead and must come out rather than sit here
    // silently widening what this guard will accept.
    for (const kind of DROPPED_KINDS) {
      expect(
        reference.some((r) => r.kind === kind),
        `DROPPED_KINDS excludes '${kind}', which the design target no longer has`,
      ).toBe(true)
    }
    const expected = reference
      .filter((r) => !DROPPED_KINDS.has(r.kind))
      .map((r) => ({
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
