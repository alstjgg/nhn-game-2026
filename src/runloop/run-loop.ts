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

/**
 * How many runs a sitting gets when the caller does not say.
 *
 * H3 (08-09) — STAYS 4. This was briefly 5, and the reason it was raised is
 * the reason it goes back: four "read as three from the desk" because the
 * file's pages turned on the press rather than at 21:04, so the last day's file
 * was always built on the previous agent's page. That is a page-turn defect,
 * not an allotment that is one short, and the rest of this branch fixes it
 * (`windows/agent-file.ts`). A number raised to paper over a bug has to come
 * back down when the bug does, or the compensation outlives its cause and
 * nobody remembers it was one (민서, 08-09).
 *
 * A run is an AGENT — the sitting hands the operator one file per day and that
 * day is the agent's whole life — so this is how many agents a judge outfits
 * before the deck is spent. Four, with the pages turning where they should.
 */
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

  /**
   * `run_id` → the run number that produced it, for runs THIS session closed.
   *
   * `report_archive` is an append-ordered list of run ids, and its position is
   * not the run number: `startRun` advances the counter (see its comment — a run
   * that never ends still counts) while `endRun` appends, so start 3 and end
   * only 1 and 3 and the second archived id belongs to run 3, not run 2.
   *
   * The pairing is recorded at `endRun`, where `run_count` still holds the run
   * in flight — nothing advances it between a run's start and its end.
   *
   * **It cannot be persisted, and that is a schema limit, not an oversight.**
   * `data/runs/_schema/meta-state.schema.json` fixes `report_archive` as
   * `{"type": "array", "items": {"type": "string", "minLength": 1}}` under
   * `additionalProperties: false`, so the ratified shape has nowhere to put a
   * number; and `run_id` is `{"type": "string", "minLength": 1}` with no
   * documented grammar anywhere in `docs/`, so no number can be read back out
   * of it either. `metaEvent` therefore falls back to position for ids archived
   * by a PREVIOUS session — which is exact whenever
   * `report_archive.length === run_count` (every started run ended) and a lower
   * bound otherwise. Recorded in `discovery/e8.md`; lifting it needs a
   * `data/runs/_schema` revision, which is not this module's to make.
   */
  const runOf = new Map<string, number>()

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
      if (!next.report_archive.includes(runId)) {
        next.report_archive.push(runId)
        // The run in flight: `run_count` last moved when this run started.
        runOf.set(runId, next.run_count)
      }
      return persist(next)
    },

    metaEvent: () => ({
      type: 'meta',
      run: state.run_count,
      runs_left: Math.max(0, totalRuns - state.run_count),
      carried: state.carried_blocks.map((b) => b.id),
      archive: state.report_archive.map((label, i) => ({ run: runOf.get(label) ?? i + 1, label })),
    }),
  }
}
