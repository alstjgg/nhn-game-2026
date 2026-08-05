// The scorer — `score.json`'s units, read against the state the run ended in.
//
// It computes nothing about the world. Every value here is a predicate the pack
// authored (`contract-datapack` §3.6) resolved by `src/shared/predicates.ts`
// against `EngineHandle.snapshot()`. If a run's ledger is wrong, the fix is in
// the pack or in the gate that failed to set a flag — never here.
//
// ── Why the shared step is `scoreUnits` and not the port ────────────────────
//
// The two things that consume a score want different halves of it. §5.2's
// `score` event carries `rows: {label, value}[]` — a rendered sheet shows
// labels and has no use for a `u4` — while `contract-run-artifacts`' record has
// `units: {id, value}[]`, because an archive is indexed and prose labels move
// when the scenario is edited. Neither can be derived from the other, so the
// work happens once, here, and each caller takes the half it needs.

import type { PredicateState, PredicateValue } from '../shared/predicates.ts'
import { resolve } from '../shared/predicates.ts'
import type { ScorerPort } from './ports.ts'

/** One `score.json` unit, as much of it as scoring reads. */
export type ScoreUnit = {
  id: string
  label: string
  predicates: readonly string[]
}

/** `score.json`. Its baseline prose and variance notes are authoring surfaces. */
export type ScorePack = { units: readonly ScoreUnit[] }

/** A unit that resolved. */
export type ScoredUnit = { id: string; label: string; value: PredicateValue }

/**
 * Every unit whose rules matched, in the pack's order.
 *
 * A unit that matches nothing is DROPPED rather than given a stand-in. Its
 * `baseline` is prose for a human ("812명 진입, 사망 24 · 부상 71"), not a
 * value, and inventing one would put a number on the tally that no rule
 * produced. It also cannot happen to a linted pack: E-P4 makes a missing
 * fallback an ERROR, so a dropped unit means the pack shipped unlinted, and a
 * short ledger is the honest way for that to show.
 */
export function scoreUnits(pack: ScorePack, state: PredicateState): ScoredUnit[] {
  const scored: ScoredUnit[] = []
  for (const unit of pack.units) {
    const value = resolve(unit.predicates, state)
    if (value !== null) scored.push({ id: unit.id, label: unit.label, value })
  }
  return scored
}

/**
 * The tally headline: the sum of the NUMERIC values, and nothing else.
 *
 * `windows/tally.ts` labels this 사망 · 명, so what sums has to be deaths. That
 * is the whole reason §5.2 amendment g widened a row's value and left `total`
 * alone: authoring writes a death count as a number and everything else as a
 * word — 강필주 resolves to `6시간 구금` rather than `6`, because six hours of
 * detention added to six deaths is a headline that lies. On 우는다리's
 * no-intervention run this is 24 + 1 + 1 = 26, which is what `score.json`'s own
 * `baseline_summary` says.
 */
export function totalOf(units: readonly ScoredUnit[]): number {
  let total = 0
  for (const unit of units) if (typeof unit.value === 'number') total += unit.value
  return total
}

/**
 * The port `createLiveDriver` takes — the §5.2 half.
 *
 * `read` is called when `score()` is, not when the scorer is built: the driver
 * asks at the close of the day, and the state it wants is the state the day
 * ENDED in. A scorer that captured a snapshot at construction would score the
 * opening beat every time.
 */
export function createScorer(pack: ScorePack, read: () => PredicateState): ScorerPort {
  // Checked HERE rather than in `score()`. A composition root that forgot to
  // thread `score.json` in is a wiring defect, and the difference between the
  // two places is when the run finds out: at boot, loudly, or at 21:04 — inside
  // the emitter, on the day's last beat, where a throw has already been shown to
  // take the whole run with it (`mm()` and the `21:04+` stamp, PR #141).
  if (!pack?.units) throw new Error('scorer: the pack carries no `score.units`')
  return {
    score() {
      const units = scoreUnits(pack, read())
      return {
        total: totalOf(units),
        rows: units.map((unit) => ({ label: unit.label, value: unit.value })),
      }
    },
  }
}

/**
 * The `contract-run-artifacts` half — `run-record.schema.json`'s `score`.
 *
 * `null` when no unit resolved, which is what the schema's `["object","null"]`
 * is for: a run with nothing to score records that it had nothing, rather than
 * an empty ledger that reads like a scored run with no casualties.
 */
export function scoreRecord(
  pack: ScorePack,
  state: PredicateState,
): { units: { id: string; value: PredicateValue }[]; total: number } | null {
  const units = scoreUnits(pack, state)
  if (units.length === 0) return null
  return { units: units.map((unit) => ({ id: unit.id, value: unit.value })), total: totalOf(units) }
}
