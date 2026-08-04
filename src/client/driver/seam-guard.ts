// The invariant-12 enforcement point — spec-client §3 inv 12 and the §5.2
// closing paragraph: the driver, not the windows, is where the guarantee lives
// that the private half of a call never reaches a view.
//
// The seam types already make the banned fields unspeakable, but fixtures and
// (later) a live engine bind hand it plain objects, so the shape is re-checked
// at run time on the way out of the driver and before any subscriber sees it.
//
// The RULE now lives in `src/shared/seam-keys.ts`, shared with the live driver's
// guard at `src/driver/seam-guard.ts`. The two used to hold separate copies that
// had drifted on `truths` — a whole key here, a key family there — so
// `truths_hidden` passed this driver and threw in the live one. See that
// module's header. This file keeps the seam-TYPED entry point; the walk is
// shared.
import { assertNoBannedSeamKeys } from '../../shared/seam-keys.ts'
import type { ViewEvent } from '../../shared/view-driver.ts'

/**
 * Throws — naming the offending key — if anything reachable from `event`
 * carries a field the seam forbids. Deep, array-aware and cycle-safe.
 */
export function assertSeamClean(event: ViewEvent): void {
  assertNoBannedSeamKeys(event)
}
