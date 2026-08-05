// [u2f#c7] — spec-client §5.2 (shared segmenter): report_body sentence splitting
// is EQUIVALENT to `src/shared/segment.ts`'s `segmentReportBody`. C1/C13: the
// module landed on main and is CONSUME-ONLY — this test runs for real against
// it, never against a local re-implementation, a stub or a mock.
import { describe, it, expect } from 'vitest'
import { segmentReportBody } from '../../src/shared/segment.ts'
import { SPECIES_OF } from '../../src/shared/species.ts'
import { designTarget, nfc, unitSources } from './fixture-utils.ts'
import { RAW_BODY, reportOf } from '../../src/client/driver/fixtures/index.ts'

const RUNS = [1, 2, 3] as const

/** The reference bodies, keyed by run — the ids and texts the split must reproduce. */
function referenceBody(run: 1 | 2 | 3) {
  const d = designTarget()
  const report = run === 3 ? d.REPORT_R3 : d.REPORTS.find((r) => r.run === run)
  if (!report) throw new Error(`no reference report for run ${run}`)
  return report.body
}

describe('[u2f#c7] report_body is the shared segmenter applied to the raw body', () => {
  it('(a) the segmenter is the landed shared module, called for real', () => {
    expect(typeof segmentReportBody).toBe('function')
    expect(segmentReportBody('한 문장이다. 두 문장이다.')).toEqual(['한 문장이다.', '두 문장이다.'])
  })

  for (const run of RUNS) {
    it(`(b${run}) run 0${run}: segmentReportBody(RAW_BODY) deep-equals report_body texts`, () => {
      const raw = RAW_BODY[run]
      expect(typeof raw).toBe('string')
      expect(raw.trim().length).toBeGreaterThan(0)
      expect(segmentReportBody(raw).map(nfc)).toEqual(
        reportOf(run).report_body.map((s) => nfc(s.text)),
      )
    })

    it(`(c${run}) run 0${run}: the split reproduces the reference sentences and ids exactly`, () => {
      const ref = referenceBody(run)
      const got = reportOf(run).report_body
      expect(got.map((s) => nfc(s.text))).toEqual(ref.map((s) => nfc(s.text)))
      expect(got.map((s) => s.id)).toEqual(ref.map((s) => s.id))
      expect(got.map((s) => s.id)).toEqual(
        ref.map((_, i) => `b-r${run}-b${String(i + 1).padStart(2, '0')}`),
      )
    })

    it(`(d${run}) run 0${run}: every body sentence is b-channel species, derived not written`, () => {
      for (const s of reportOf(run).report_body) expect(s.species).toBe(SPECIES_OF.b)
    })

    it(`(e${run}) run 0${run}: facts are Call-3 array items and are NOT segmented`, () => {
      const ref = run === 3 ? designTarget().REPORT_R3.facts : referenceFacts(run)
      const got = reportOf(run).facts
      expect(got.map((s) => nfc(s.text))).toEqual(ref.map((s) => nfc(s.text)))
      expect(got.map((s) => s.id)).toEqual(ref.map((s) => s.id))
      for (const s of got) expect(s.species).toBe(SPECIES_OF.f)
    })
  }

  it('(f) the reference body counts are 6 / 7 / 7', () => {
    expect(RUNS.map((r) => reportOf(r).report_body.length)).toEqual([6, 7, 7])
  })

  it('(g) no module in the unit re-implements or wraps the splitter', () => {
    const users = unitSources().filter((s) => /\bsegmentReportBody\b/.test(s.text))
    expect(users.length).toBe(1)
    const offenders = unitSources()
      .filter((s) => /function\s+segment[A-Za-z]*\s*\(|const\s+segment[A-Za-z]*\s*=\s*\(/.test(s.text))
      .map((s) => s.rel)
    expect(offenders).toEqual([])
  })

  it('(h) RAW_BODY is the authored artefact — every reference sentence is inside it', () => {
    for (const run of RUNS) {
      const raw = nfc(RAW_BODY[run])
      for (const s of referenceBody(run)) expect(raw).toContain(nfc(s.text))
    }
  })
})

function referenceFacts(run: 1 | 2) {
  const report = designTarget().REPORTS.find((r) => r.run === run)
  if (!report) throw new Error(`no reference report for run ${run}`)
  return report.facts
}
