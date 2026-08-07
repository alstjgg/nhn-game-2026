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

/**
 * What computing the BASELINE day needs: the flags every run ends holding no
 * matter what anyone does. `timeline.json`, narrowed to the one field that
 * answers it.
 */
export type OutcomePack = {
  timeline: { events: readonly { effects: { flags?: Record<string, boolean> } | null }[] }
}

/**
 * The state the day ends in when NOTHING the agent did set a flag.
 *
 * The fixed timeline's flags, and only those: they are the events that fire on
 * every run regardless of any stance, so they are the one part of an ending
 * that is not a choice. Everything else a gate can set is left absent, and an
 * absent flag reads false (`predicates.ts` `met()`), so every unit falls to its
 * unconditional rule — which is exactly what the pack's `baseline_summary`
 * describes. On 우는다리 that is 사망 24 + 1 + 1 = 26.
 *
 * ── Why this no longer reads `gates.json` ───────────────────────────────────
 *
 * It used to fold in each gate's `default_stance` bucket, on the reading that
 * "무개입 ⇒ every gate falls to its default". That reading does not survive
 * contact with the engine: `default_stance` is what `submitStance` substitutes
 * when CALL 1 FAILED (`src/engine/index.ts` — `fallback`), and nothing else. A
 * run where the player injects no block still puts all seven gates to the
 * agent, which answers them from the prompt and the timeline; `default_stance`
 * is never consulted on a healthy run. Deriving the game's baseline from it
 * meant defining the yardstick as "what a network error would have scored".
 *
 * The floor is the honest counterfactual instead: no gate flag is guaranteed,
 * so none is assumed. It is also stabler — adding a gate, or re-authoring a
 * default, can no longer move the baseline out from under the ledger.
 *
 * Flags only: no predicate reads a scalar today, and twelve of the fourteen
 * meters are unbound (lint F2), so a scalar baseline would be describing
 * variables that do not exist.
 */
export function baselineState(pack: OutcomePack): PredicateState {
  const state: PredicateState = {}
  for (const event of pack.timeline.events) {
    for (const [flag, on] of Object.entries(event.effects?.flags ?? {})) state[flag] = on
  }
  return state
}

/** A unit that resolved, beside what the baseline day scored on its axis. */
export type ScoredUnit = {
  id: string
  label: string
  value: PredicateValue
  /** §5.2 amendment h. `null` when the same rules matched nothing at baseline. */
  baseline: PredicateValue | null
}

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
export function scoreUnits(
  pack: ScorePack,
  state: PredicateState,
  baseline: PredicateState = state,
): ScoredUnit[] {
  const scored: ScoredUnit[] = []
  for (const unit of pack.units) {
    const value = resolve(unit.predicates, state)
    if (value === null) continue
    scored.push({
      id: unit.id,
      label: unit.label,
      value,
      // The SAME rules, read against the day nothing moved. Not the unit's
      // authored `baseline`, which is prose for a human — "812명 진입, 사망 24 ·
      // 부상 71" is four numbers in one sentence and no run produces it as a
      // value. Deriving it instead means the two can never disagree, which is
      // exactly how the pack's u6 baseline came to be wrong.
      baseline: resolve(unit.predicates, baseline),
    })
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
 * detention added to six deaths is a headline that lies. On 우는다리's baseline
 * day this is 24 + 1 + 1 = 26, which is what `score.json`'s own
 * `baseline_summary` says. A PLAYED run is whatever its own stances scored —
 * the two agree only when the day moved nothing, and the ledger prints both.
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
export function createScorer(
  pack: ScorePack,
  read: () => PredicateState,
  baseline: PredicateState,
): ScorerPort {
  // Checked HERE rather than in `score()`. A composition root that forgot to
  // thread `score.json` in is a wiring defect, and the difference between the
  // two places is when the run finds out: at boot, loudly, or at 21:04 — inside
  // the emitter, on the day's last beat, where a throw has already been shown to
  // take the whole run with it (`mm()` and the `21:04+` stamp, PR #141).
  if (!pack?.units) throw new Error('scorer: the pack carries no `score.units`')
  return {
    score() {
      const units = scoreUnits(pack, read(), baseline)
      return {
        total: totalOf(units),
        // The headline the day would have had. Computed here rather than summed
        // by the client, which does no arithmetic on the authority's numbers
        // (§5.3) — the same rule that makes `total` a field.
        baseline_total: totalOf(
          units.map((unit) => ({ ...unit, value: unit.baseline ?? unit.value })),
        ),
        rows: units.map((unit) => ({
          label: unit.label,
          value: unit.value,
          baseline: unit.baseline,
        })),
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
  baseline: PredicateState = state,
): { units: { id: string; value: PredicateValue }[]; total: number } | null {
  // The record carries no baseline: `run-record.schema.json` is
  // `additionalProperties: false` over `{units, total}`, and a baseline is
  // recomputable from the pack at any time. `baseline` is threaded anyway so
  // both halves come from one `scoreUnits` call shape.
  const units = scoreUnits(pack, state, baseline)
  if (units.length === 0) return null
  return { units: units.map((unit) => ({ id: unit.id, value: unit.value })), total: totalOf(units) }
}
