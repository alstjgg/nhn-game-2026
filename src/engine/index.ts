/**
 * State engine — deterministic, isomorphic, DOM-free.
 *
 * Owner: 윤석 (architecture track). Stub.
 *
 * Its **public surface** — what the composer may call — is fixed by
 * [contract-engine-composer.md](../../docs/contract-engine-composer.md) §2:
 * `gateView()` · `beatView()` · `roundView()`, each returning a snapshot of
 * plain data, never a live handle into state. That contract also assigns this
 * module the round event assembler (§5). Its internals are this spec's:
 *
 * What lands here, per that spec: the run state, the per-beat delta journal
 * (`{variable, before, after, cause}`), the symptom renderer, and the beat
 * chain — *stance → apply its (gate, stance) delta → resolve the outcome
 * bucket → evaluate that bucket's edge predicates against the **updated**
 * state*. The delta lands before the predicate is read; reversing it changes
 * routing while still looking deterministic, which is why it gets a test of
 * its own.
 *
 * Two properties this module exists to preserve:
 *
 * 1. **Free text has no state authority.** The engine consumes exactly one
 *    field of model output — `stance`. Utterances, inner notes, NPC lines,
 *    reports: rendered, never read for state (W4 / I3).
 * 2. **The engine is indifferent to the variable list.** Variables, delta
 *    tables, and predicates are data. Binding a concrete list with the winning
 *    scenario must touch no code in here; if it does, the engine has absorbed
 *    scenario content.
 *
 * Compiled by `tsconfig.core.json`, which omits the DOM lib — `document`,
 * `window`, and `fetch` do not resolve in this folder, by design.
 *
 * This file is the e0 skeleton: the full public surface as exported types,
 * with a stub factory. The behaviour above lands with the unit that
 * implements the engine's body; nothing here runs yet.
 */

import type { FeedLine } from '../shared/view-driver.ts'
import type { Stance, PresentNpc } from '../shared/contracts.ts'
import type { Temperament } from '../shared/datapack.ts'

/**
 * The engine's temperament view — contract-engine-composer §2's
 * `TemperamentPack`, aliased to `datapack.ts`'s `Temperament` rather than
 * re-declared: that file is the one place the shape is authored (§4.1's
 * `default_disposition` + up to 2 `clauses` of
 * `{axis, axis_vocabulary, condition, defeat_condition}`).
 */
export type TemperamentPack = Temperament

/** Everything Call 1 needs that is not the proxy's and not the player's. */
export type GateView = {
  GATE_QUESTION: string
  STANCE_SET: Stance[]
  /** Most recent 6 lines, never a severed beat (§3.2). */
  TIMELINE_EXCERPT: string[]
  /** Structured; the composer renders it (§4). */
  TEMPERAMENT: TemperamentPack
}

/** Everything Call 2 needs. Valid only after the beat's effects are applied. */
export type BeatView = {
  /** Most recent 6 lines, never a severed beat. */
  TIMELINE_TAIL: string[]
  /** This beat's Call 1 `utterance`; `""` on a script beat. */
  AGENT_UTTERANCE: string
  FIXED_NPC_ACTION: string
  PRESENT_NPCS: PresentNpc[]
  /** `renderSymptoms` output — never empty (§2.3-5). */
  SCENE_SYMPTOMS: string[]
}

/** Everything Call 3 needs. Valid only at a round boundary. */
export type RoundView = {
  /** The round event assembler's output (§5). */
  EXPERIENCED: string[]
  /** The SAME value `GateView` carried for this round. */
  TEMPERAMENT: TemperamentPack
}

/**
 * What the engine needs to construct — decision 15: every cross-module
 * dependency is injected. The concrete shape (pack data, run seed, …) is
 * fixed by the unit that implements the engine's body; the skeleton only
 * commits to "the factory takes one deps object".
 */
export type EngineDeps = Record<string, unknown>

export interface Engine {
  gateView(): GateView
  beatView(): BeatView
  roundView(): RoundView
  /** This beat's feed lines, in order, ids already minted. */
  feed(): FeedLine[]
}

export function createEngine(_deps: EngineDeps): Engine {
  throw new Error('unimplemented: createEngine')
}
