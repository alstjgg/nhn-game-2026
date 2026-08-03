/**
 * The beat module's error classes.
 *
 * Distinct classes rather than one `Error`: a caller that mishandles the phase
 * machine and a datapack that fails to compile are different bugs with
 * different owners, and the tests name them apart.
 */

/**
 * A driver method was called in a phase where it is not legal — `submitStance`
 * on a script beat, `applyBeatEffects` before the stance, `beatView` before
 * the effects have landed, `roundView` off a round boundary (design D-D).
 */
export class BeatPhaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BeatPhaseError'
  }
}

/** A clock string is neither `HH:MM` nor `HH:MM+` (decision D7). */
export class ClockFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClockFormatError'
  }
}

/**
 * An `edge_predicates` line does not parse, or a non-empty array does not end
 * with `else`. Raised at schedule-build time, never mid-run — see
 * `predicates.ts` for the vocabulary these two rules guard.
 */
export class PredicateSyntaxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PredicateSyntaxError'
  }
}

/** The submitted stance belongs to no outcome bucket of this gate. */
export class StanceResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StanceResolutionError'
  }
}
