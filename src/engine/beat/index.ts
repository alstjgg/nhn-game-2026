/**
 * The beat & round driver's public surface.
 *
 * Everything a caller needs to walk one scenario run: build the schedule from
 * a datapack, hand the driver a state core and a round assembler, and step it.
 * Nothing here reaches a file system, a DOM, or a network.
 */

export { TIMELINE_CAP_LINES } from './caps.ts'
export { parseClock } from './clock.ts'
export { buildSchedule } from './schedule.ts'
export { createBeatDriver, eventExposed, EVENT_CAUSE_PREFIX, FALLBACK_CALL1_CAUSE } from './driver.ts'
export { compileEdges, evaluateEdges } from './predicates.ts'
export {
  BeatPhaseError,
  ClockFormatError,
  PredicateSyntaxError,
  StanceResolutionError,
} from './errors.ts'

export type { Beat, BeatKind, OutcomeBucket, ScheduledGate, TimelineEvent } from './schedule.ts'
export type { CompareOp, CompiledEdge } from './predicates.ts'
export type {
  BeatCursor,
  BeatDriver,
  BeatDriverDeps,
  BeatPhase,
  BeatStep,
  StanceOutcome,
  StanceSubmission,
} from './driver.ts'
export type { BeatPack, DeltaEntry, RoundAssemblerPort, StateCorePort } from './ports.ts'
