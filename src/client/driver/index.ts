// The driver barrel — spec-client §2.1 / §5.2. Everything upstream of the seam
// imports from here and from nowhere deeper: the six seam types are re-exported
// straight out of `src/shared/view-driver.ts` (they are declared once, there),
// and the runtime below is the driver's own.
//
// Nothing here reaches into engine or composer. When the live driver lands it
// binds them behind exactly this surface, and no window can tell the difference.
export type {
  Species,
  Sentence,
  FeedKind,
  FeedLine,
  ViewEvent,
  MembraneOp,
} from '../../shared/view-driver.ts'

export { assertSeamClean } from './seam-guard.ts'

export { MS_PER_SIM_MIN, mm, hhmm, createClock } from './clock.ts'
export type { Clock, ClockOptions, ClockRate } from './clock.ts'

export { createFixtureDriver } from './fixture-driver.ts'
export type { FixtureDriver, FixtureStore, Frame, ViewListener } from './fixture-driver.ts'

export type { FixtureRun, OpResponse } from './fixtures/types.ts'

export { demoRun } from './demo-run.ts'

export { createRunLoopDriver, demoRunLoop } from './run-loop.ts'

export {
  freezeAnimations,
  thawAnimations,
  animationsFrozen,
  registerAnimation,
  serializeFrame,
  tickAnimations,
  // C16 — u2's charter completion: the sim-clock half of the determinism hooks.
  installClockHook,
  clockHookOf,
} from './test-hooks.ts'
export type { AnimationTick, ClockDriver, ClockHook } from './test-hooks.ts'
