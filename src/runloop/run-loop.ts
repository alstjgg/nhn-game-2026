/**
 * The run-loop manager — the multi-run shell (contract-engine-composer §9,
 * architecture-map's "Run-loop Manager").
 *
 * Owns exactly four things across runs: the run counter, the blocks carried
 * into the next run's prompt, the report archive, and the deepest exposure
 * clock ever reached. All four live in one `MetaState`, persisted through the
 * injected `MetaStore` — nothing here knows which adapter it got.
 *
 * `totalRuns` is configuration, not state: it shapes `runs_left` in the `meta`
 * event and is deliberately absent from the persisted shape.
 */

import type { Block } from '../shared/contracts.ts'
import type { ViewEvent } from '../shared/view-driver.ts'
import type { MetaState } from './meta-state.ts'
import { cloneMetaState, deeperClock, emptyMetaState } from './meta-state.ts'
import type { MetaStore } from './store.ts'

/** How many runs a sitting gets when the caller does not say. */
export const DEFAULT_TOTAL_RUNS = 4

export type RunLoopDeps = {
  store: MetaStore
  packSlug: string
  /** Defaults to `DEFAULT_TOTAL_RUNS`. Config — never persisted. */
  totalRuns?: number
}

/** What a caller needs to open a run: its number, its carry-over, its depth. */
export type BegunRun = {
  run: number
  carried: Block[]
  exposureClock: string | null
}

/** What a caller reports when a run finishes. */
export type RunEnd = {
  runId: string
  reachedClock: string | null
  carried: Block[]
}

/** The `meta` member of the frozen §5.2 event union — consumed, never redefined. */
export type MetaEvent = Extract<ViewEvent, { type: 'meta' }>

export interface RunLoop {
  /** The persisted meta-state as of the last save — a copy, always. */
  current(): MetaState
  /** Begins a new run — advances `run_count`, rotates `carried_blocks` in. */
  startRun(): BegunRun
  /** Closes a run — replaces the carry-over, indexes the report, deepens the clock. */
  endRun(end: RunEnd): MetaState
  /** The run/meta view for the client, folded onto the §5.2 event stream. */
  metaEvent(): MetaEvent
}

export function createRunLoop(deps: RunLoopDeps): RunLoop {
  const { store, packSlug } = deps
  const totalRuns = deps.totalRuns ?? DEFAULT_TOTAL_RUNS

  // A payload belonging to another pack is not ours to resume from.
  const loaded = store.load()
  let state: MetaState =
    loaded !== null && loaded.pack_slug === packSlug ? cloneMetaState(loaded) : emptyMetaState(packSlug)

  /** Commit `next` and hand back an independent copy of what was written. */
  function persist(next: MetaState): MetaState {
    state = next
    store.save(cloneMetaState(next))
    return cloneMetaState(next)
  }

  return {
    current: () => cloneMetaState(state),

    startRun: () => {
      // The counter advances here, so a run that never ends still counts.
      const next = cloneMetaState(state)
      next.run_count += 1
      const written = persist(next)
      return {
        run: written.run_count,
        carried: written.carried_blocks,
        exposureClock: written.exposure_clock_reached,
      }
    },

    endRun: ({ runId, reachedClock, carried }) => {
      const next = cloneMetaState(state)
      next.carried_blocks = carried.map((b) => ({ id: b.id, text: b.text }))
      next.exposure_clock_reached = deeperClock(next.exposure_clock_reached, reachedClock)
      if (!next.report_archive.includes(runId)) next.report_archive.push(runId)
      return persist(next)
    },

    metaEvent: () => ({
      type: 'meta',
      run: state.run_count,
      runs_left: Math.max(0, totalRuns - state.run_count),
      carried: state.carried_blocks.map((b) => b.id),
      archive: state.report_archive.map((label, i) => ({ run: i + 1, label })),
    }),
  }
}
