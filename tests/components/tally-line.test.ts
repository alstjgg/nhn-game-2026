// The LIVE FEED's closing 집계 line — and the disagreement it exists to close.
//
// Driven against the REAL pack, on the same reasoning as `tests/driver/
// scorer.test.ts`: the property worth pinning is that two SURFACES report one
// run identically, and a synthetic ledger would satisfy that by construction.
//
// DOM-free by design (vitest runs `environment: 'node'`): `tallyLineText` is
// pure, and the rendering half — that the line lands in the fanfold on `score`
// — is `e2e/run-loop.spec.ts`'s.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tallyLineText } from '../../src/client/components/tally-line.ts'
import { baselineState, createScorer } from '../../src/driver/scorer.ts'
import type { OutcomePack, ScorePack } from '../../src/driver/scorer.ts'
import type { PredicateState } from '../../src/shared/predicates.ts'
import type { ViewEvent } from '../../src/shared/view-driver.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (rel: string): string => fs.readFileSync(path.join(REPO, rel), 'utf8')

const PACK = JSON.parse(read('data/scenario/우는다리/score.json')) as ScorePack
const TIMELINE = JSON.parse(read('data/scenario/우는다리/timeline.json')) as {
  events: { id: string; time: string; text: string }[]
}
const BASELINE: PredicateState = baselineState({ timeline: TIMELINE } as unknown as OutcomePack)

/** The `score` event a run ending in `state` puts on the seam. */
const ledgerOf = (state: PredicateState): Extract<ViewEvent, { type: 'score' }> => {
  const scored = createScorer(PACK, () => state, BASELINE).score()
  return { type: 'score', ...scored }
}

/** Every day the death axis can land on — the three G6 outcomes, plus G7. */
const DAYS: Record<string, PredicateState> = {
  baseline: BASELINE,
  capped: { ...BASELINE, entry_capped: true },
  cancelled: { ...BASELINE, cancel_requested: true },
  witnessed: { ...BASELINE, hatch_opened: true, caretaker_evacuated: true },
}

describe('the feed’s 집계 line and the ledger report ONE run', () => {
  it('(a) the headline in the line is the ledger’s own total, on every day', () => {
    // The defect this closes. `timeline.json`'s t19 printed 사망 26 on all four
    // of these, because a fixed event is printed without reading state; the
    // ledger counted 26 · 9 · 0 · 25. Same 21:04, two numbers.
    for (const [day, state] of Object.entries(DAYS)) {
      const ledger = ledgerOf(state)
      expect(tallyLineText(ledger), `${day}: the line dropped the ledger's total`).toContain(
        `사망 ${ledger.total}`,
      )
    }
  })

  it('(b) the four days really do score differently — else (a) proves nothing', () => {
    const totals = Object.fromEntries(
      Object.entries(DAYS).map(([day, state]) => [day, ledgerOf(state).total]),
    )
    expect(totals).toEqual({ baseline: 26, capped: 9, cancelled: 0, witnessed: 25 })
  })

  it('(c) the breakdown names the counting axes, and only those', () => {
    const ledger = ledgerOf(BASELINE)
    const line = tallyLineText(ledger)
    // 24 + 1 + 1. `강필주` resolves to 6시간 구금 and `부상자` to 71명 — words,
    // not counts, so they are the ledger's rows and never the headline's parts.
    expect(line).toBe('집계. 사망 26(다리 위의 인파 24 · 임차복 1 · 둔치의 사람들 1).')
    expect(line).not.toContain('강필주')
    expect(line).not.toContain('부상자')
  })

  it('(d) the parts sum to the headline — the line never does its own arithmetic', () => {
    for (const state of Object.values(DAYS)) {
      const ledger = ledgerOf(state)
      const summed = ledger.rows
        .map((row) => row.value)
        .filter((value): value is number => typeof value === 'number')
        .reduce((a, b) => a + b, 0)
      expect(summed).toBe(ledger.total)
    }
  })

  it('(e) a ledger with nothing to count prints the headline alone', () => {
    const empty: Extract<ViewEvent, { type: 'score' }> = {
      type: 'score',
      total: 0,
      baseline_total: 0,
      rows: [{ label: '결말', value: '미확인', baseline: null }],
    }
    expect(tallyLineText(empty)).toBe('집계. 사망 0.')
  })
})

describe('what the authored timeline still claims — NOT asserted, recorded', () => {
  it('(f) a fixed event states a count, and that count is the BASELINE, not the run’s', () => {
    // Deliberately not a guard: the scenario is being rewritten, so this asserts
    // nothing about its content. It pins the RELATIONSHIP that makes the derived
    // line necessary — `scriptLinesOf` prints every event verbatim with no state
    // read, so a count authored into one is the same number on every run, and
    // the only run it is true of is the one where nothing moved.
    const stated = TIMELINE.events.filter((event) => /(사망|부상)\s*\d/.test(event.text))
    if (stated.length === 0) return // the rewrite dropped them; nothing to relate
    const baseline = ledgerOf(BASELINE)
    for (const event of stated) {
      const numbers = [...event.text.matchAll(/사망\s*(\d+)/g)].map((m) => Number(m[1]))
      for (const n of numbers) {
        expect(
          n,
          `${event.id} states 사망 ${n}, which is neither the baseline (${baseline.baseline_total}) ` +
            'nor anything the ledger can produce — the two surfaces would disagree by construction',
        ).toBe(baseline.baseline_total)
      }
    }
  })
})
