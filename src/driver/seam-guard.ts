/**
 * The invariant-12 enforcement point for the LIVE driver — spec-client §5.2's
 * closing paragraph: the driver, not the windows, is where the guarantee lives
 * that the private half of a call never reaches a view.
 *
 * `src/client/driver/seam-guard.ts` holds the same rule for the fixture driver.
 * The duplication used to be deliberate (spec decision 7): `src/client/**` was a
 * frozen glob for the engine run and the isomorphic core may not reach into it,
 * so the rule was re-stated here rather than imported. `discovery/e7.md` recorded
 * the consolidation as a later unit's call, and this is it — the rule now lives
 * once, in `src/shared/seam-keys.ts`, which neither side reaches into and both
 * already depend on. The copies had drifted on `truths`; see that module.
 *
 * The whole `JudgmentResponse` legitimately crosses into the engine (its
 * `inner_note` is Call 3's input, contract-engine-composer §5), which is exactly
 * why the check belongs on the driver's *out*-edge and nowhere else.
 */

import { assertNoBannedSeamKeys } from '../shared/seam-keys.ts'
import type { ViewEvent } from '../shared/view-driver.ts'

/**
 * Throws — naming the offending key — if anything reachable from `event` carries
 * a field the seam forbids. Deep, array-aware and cycle-safe.
 *
 * Returns the event it was given, so the guarded value is the only thing a
 * caller has to emit: skipping the guard becomes a visible edit, not an
 * omission.
 */
export function assertSeamClean(event: ViewEvent): ViewEvent {
  assertNoBannedSeamKeys(event)
  return event
}
