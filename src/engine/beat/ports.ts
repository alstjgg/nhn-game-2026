/**
 * The seams the beat driver is built on — PRD decision 15: every cross-module
 * dependency arrives by injection.
 *
 * This file is **types only**. It emits no runtime value, which is what lets
 * `src/engine/beat/` reach the state core without ever importing it: the
 * driver holds a `StateCorePort`, and whoever constructs the driver decides
 * whether that port is the real core or a recording double.
 */

import type { Characters, Gates, Temperament, Timeline } from '../../shared/datapack.ts'

/**
 * One entry of the per-beat delta journal — the state core's record of what a
 * cause changed. `before`/`after` are numbers for variables and booleans for
 * flags; the symptom renderer reads the journal, the driver only closes it.
 */
export type DeltaEntry = {
  variable: string
  before: number | boolean
  after: number | boolean
  cause: string
}

/**
 * The state core, as the beat driver sees it.
 *
 * Ordering matters more than any single method here: the driver must call
 * `applyDeltas`/`applyFlags` before it calls `read`/`readFlag` for edge
 * routing (spec-engine §4.1), and must close the journal and render symptoms
 * before Call 2 is reachable (§4.2).
 */
export type StateCorePort = {
  /** Add signed deltas to scalar variables, attributed to `cause`. */
  applyDeltas(deltas: Record<string, number>, cause: string): void
  /** Set/unset flags, attributed to `cause`. */
  applyFlags(flags: Record<string, boolean>, cause: string): void
  /** Current value of a scalar variable. An unset variable reads as zero. */
  read(variable: string): number
  /** Current value of a flag. An unset flag reads as false. */
  readFlag(id: string): boolean
  /** This beat's delta journal, in application order. */
  journal(): DeltaEntry[]
  /** Symptom sentences for this beat's journal — never empty (§2.3-5). */
  renderSymptoms(): string[]
  /** A plain-data copy of the whole run state. */
  snapshot(): Record<string, number | boolean>
}

/**
 * The round event assembler (contract engine ⟷ composer §5). Owned elsewhere;
 * the beat driver only asks it for one round's worth of experienced lines.
 */
export type RoundAssemblerPort = {
  experienced(roundIndex: number): string[]
}

/**
 * The parts of one scenario datapack the beat driver reads. Already parsed —
 * nothing in this module touches a file system.
 */
export type BeatPack = {
  timeline: Timeline
  gates: Gates
  characters: Characters
  temperament: Temperament
}
