// The fixture run file's shape — spec-client §5.4: "an ordered ViewEvent[] with
// clock stamps plus canned responses for each MembraneOp the script expects".
// Fixture files live under `driver/fixtures/` and ship only in dev builds.
import type { MembraneOp, ViewEvent } from '../../../shared/view-driver.ts'

/** What the driver hands back for an op the script expects. */
export interface OpResponse {
  ok: boolean
}

export interface FixtureRun {
  /** Identifies the run file; carried into errors, never rendered. */
  id: string
  /** `"HH:MM"` the run opens on. */
  start: string
  /** `"HH:MM"` the run closes on. */
  end: string
  /** The stream, in the order the script means it to arrive. */
  events: ViewEvent[]
  /** Canned answers, keyed by op — an op with no entry is not expected. */
  responses: Partial<Record<MembraneOp['op'], OpResponse>>
}
