// [u7] RunState — the run loop as a PROJECTION of the §5.2 stream.
//
// spec-client §5.1 names the states `BUILD → (deploy) RUN → (per round) REPORT
// → … → (21:04) TALLY → (new_run) BUILD`. This module is the only place that
// decides which one the desk is in, and it decides it from events alone: the
// surface below exports no mutator at all, so no window can move the desk by
// hand ([u7#c8]). `run`, `runs_left`, `carried` and `archive` are copied off
// the `meta` event verbatim — the client mirrors no state and does no
// arithmetic on the authority's numbers (§5.3, [u7#c3]).
//
// Persistence is C4's: the last `meta` event goes to `sessionStorage` under one
// key, verbatim, so a refresh mid-run finds the run counter, the carried blocks
// and the archive where it left them (spec-client §7 #8). The score does not
// persist — it belongs to the run that produced it. `localStorage` appears
// nowhere in this unit.
//
// Import-safe by contract (u3): no DOM at module scope, no stylesheet import,
// no sibling window import, nothing from engine or composer (C8 / inv 12). The
// injected `Storage` is what lets the node-env suite exercise the round trip.
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'

/** The four run states of spec-client §5.1. */
export type RunPhase = 'build' | 'run' | 'report' | 'tally'

/** The run-loop numbers, exactly as the `meta` event carries them. */
export interface MetaState {
  run: number
  runsLeft: number
  carried: string[]
  archive: { run: number; label: string }[]
}

/** The closing tally, exactly as the `score` event carries it. */
export interface ScoreState {
  total: number
  /** §5.2 amendment g — a scored unit's value may be a word, not only a count. */
  rows: { label: string; value: string | number }[]
}

export interface RunState {
  phase: RunPhase
  meta: MetaState
  score: ScoreState | null
  /**
   * The round of the last `report` event seen, or `null` when the current run
   * has not filed one yet. A report that lands during TALLY does not move the
   * phase — but it is the event the ledger's "the report is on the desk" line
   * and NEW RUN both wait on, so it is recorded rather than dropped
   * (R4 on score-tally.ts:258). It is a ROUND, never a run — see
   * `hasFiledReport()` below for why the difference is load-bearing.
   */
  report: number | null
}

/**
 * Has the run now on the desk filed its report?
 *
 * The honest predicate is "a `report` event has been seen since this run's
 * `meta`" — which is exactly what `report` records, because the `meta` case
 * below resets it to `null` on every run. It is deliberately NOT
 * `state.report === state.meta.run`: `report.round` is a ROUND and `meta.run`
 * is a RUN, and §5.2 (`spec-client.md:153`, `:179`) makes no guarantee that a
 * day's last round carries its run's number — the demo fixture happens to set
 * `round = run`, which is a property of one fixture and not of the seam. A
 * client that keyed the wait on that equality hung forever on any day whose
 * last round was numbered otherwise (R4 on score-tally.ts:258, round 2).
 */
export function hasFiledReport(state: RunState): boolean {
  return state.report !== null
}

/** The one persistence key this unit owns (C4). */
export const META_KEY = 'ndsp:meta:v1'

/** The desk opens in BUILD with no score in hand and nothing carried. */
export function initialRunState(): RunState {
  return {
    phase: 'build',
    meta: { run: 0, runsLeft: 0, carried: [], archive: [] },
    score: null,
    report: null,
  }
}

/**
 * The reducer — pure, total, and the only rule set for the loop.
 *
 * Deviation from §5.1's literal wording (discovery/u7.md): the BUILD→RUN edge
 * is named `deploy` there, but `deploy` is a `MembraneOp` with no event echo on
 * the ratified seam. The run's first beat is its observable equivalent, and
 * keeping the edge on an event is what keeps this module write-free.
 */
export function reduce(state: RunState, event: ViewEvent): RunState {
  switch (event.type) {
    case 'meta':
      return {
        phase: 'build',
        meta: {
          run: event.run,
          runsLeft: event.runs_left,
          carried: [...event.carried],
          archive: event.archive.map((entry) => ({ run: entry.run, label: entry.label })),
        },
        score: null,
        report: null,
      }
    case 'score':
      return {
        phase: 'tally',
        meta: state.meta,
        score: { total: event.total, rows: event.rows.map((row) => ({ label: row.label, value: row.value })) },
        report: state.report,
      }
    case 'run_end':
      return { phase: 'tally', meta: state.meta, score: state.score, report: state.report }
    case 'report':
      return state.phase === 'tally'
        ? { ...state, report: event.round }
        : { phase: 'report', meta: state.meta, score: state.score, report: event.round }
    case 'beat_start':
    case 'feed':
      return state.phase === 'tally'
        ? state
        : { phase: 'run', meta: state.meta, score: state.score, report: state.report }
    default:
      return state
  }
}

/** Read-only access for the windows that render the loop but never move it. */
export interface RunStore {
  get(): RunState
  subscribe(fn: (state: RunState) => void): () => void
}

export interface RunStateOptions {
  /** Defaults to the tab's own `sessionStorage`; injected under node. */
  storage?: Storage
}

/** The tab's session store, or nothing at all when the environment has none. */
function defaultStorage(): Storage | null {
  try {
    const holder = globalThis as { sessionStorage?: Storage }
    return holder.sessionStorage ?? null
  } catch {
    return null
  }
}

/** A `meta` event as it was persisted, or `null` when the slot is empty/corrupt. */
function restored(storage: Storage | null): ViewEvent | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(META_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const candidate = parsed as { type?: unknown }
    return candidate.type === 'meta' ? (parsed as ViewEvent) : null
  } catch {
    // A private-mode Storage throws on read and a half-written slot does not
    // parse. Neither is worth a crashed boot: the desk simply opens cold.
    return null
  }
}

/**
 * The run a refresh should re-open on, or `null` for a cold desk.
 *
 * The restore used to lose a race it could not see: `createRunState` rebuilt
 * the state from the slot inside `tally.mount()`, and the driver — always
 * opened at `runs[0]` — then emitted the pack's opening `meta` in the same boot
 * tick and overwrote it (R3 on run-state.ts:151). The persisted run is now read
 * BEFORE the driver is built, so the loop opens on the day the operator left.
 */
export function restoredRun(options: RunStateOptions = {}): number | null {
  const event = restored(options.storage ?? defaultStorage())
  return event !== null && event.type === 'meta' ? event.run : null
}

/** Writes the `meta` event verbatim; a refusing Storage degrades to memory. */
function persist(storage: Storage | null, event: ViewEvent): void {
  if (!storage) return
  try {
    storage.setItem(META_KEY, JSON.stringify(event))
  } catch {
    return
  }
}

let store: RunStore | null = null

/**
 * Binds a run store to the driver. The store owns no timer and sends no op —
 * it folds the stream and hands the result to whoever asked to be told.
 */
export function createRunState(driver: FixtureDriver, options: RunStateOptions = {}): RunStore {
  const storage = options.storage ?? defaultStorage()
  const listeners = new Set<(state: RunState) => void>()

  const remembered = restored(storage)
  let state = remembered === null ? initialRunState() : reduce(initialRunState(), remembered)
  let openedAt = driver.clock.minute

  /**
   * The stream a run opens with lands before the operator has done anything:
   * `advance(0)` releases the opening minute so the desk is not blank, and the
   * clock then waits on ▶. That opening batch is still BUILD — the day has not
   * begun until it moves. Everything else is the reducer's, unconditionally.
   */
  function begun(event: ViewEvent): boolean {
    if (event.type !== 'feed' && event.type !== 'beat_start') return true
    return driver.clock.minute > openedAt
  }

  driver.subscribe((event: ViewEvent) => {
    if (event.type === 'meta') openedAt = driver.clock.minute
    if (begun(event)) state = reduce(state, event)
    if (event.type === 'meta') persist(storage, event)
    for (const listener of [...listeners]) listener(state)
  })

  const bound: RunStore = {
    get: () => state,
    subscribe(fn: (state: RunState) => void): () => void {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
  }
  store = bound
  return bound
}

/** The bound store, for the windows that read the loop (u4 · u4s · u5 · u6). */
export function getRunState(): RunStore | null {
  return store
}
