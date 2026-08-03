// PLACEHOLDER boot stream (run-wide constraint C3).
//
// ⚠ PLACEHOLDER — SYNTHETIC, NOT AUTHORED CONTENT. The shell has to hand the
// driver a `FixtureRun` to open on, and the authored demo run is u2f's work,
// blocked on `src/shared/segment.ts`. So this is the smallest stream that is
// still a real one: the run's opening `meta`, and nothing else. No test may
// assert its numbers — the chrome is verified by the relations between them
// (pips === run + runs_left), never by their values.
//
// What is NOT synthetic: the clock band. `end` is the scenario's own terminal
// out of the pack, so the desk really does run toward the case's 21:04.
import type { FixtureRun } from '../driver/index.ts'
import type { ScenarioIdentity } from './pack.ts'

/**
 * PLACEHOLDER — the desk opens mid-run, exactly as the design target's demo
 * does (docs/design/phase2-ui/data.js `RUNSTATE.startAt`), so the clock band
 * shows real progress instead of an empty gauge.
 */
const OPENS_AT = '13:05'

/** PLACEHOLDER — the allotment the D-DAY pips render (design target: RUN 03 / 10). */
const RUN = 3
const RUNS_LEFT = 7

export function placeholderBootRun(identity: ScenarioIdentity): FixtureRun {
  return {
    id: 'placeholder-boot',
    start: OPENS_AT,
    end: identity.end,
    events: [{ type: 'meta', run: RUN, runs_left: RUNS_LEFT, carried: [], archive: [] }],
    responses: {
      slot: { ok: true },
      unslot: { ok: true },
      mine: { ok: true },
      deploy: { ok: true },
      new_run: { ok: true },
    },
  }
}
