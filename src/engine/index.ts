/**
 * State engine — deterministic, isomorphic, DOM-free.
 *
 * Owner: 윤석 (architecture track). Stub until the minimal engine spec merges.
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
 */

export {}
