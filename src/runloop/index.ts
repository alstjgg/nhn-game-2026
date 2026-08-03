/**
 * The run-loop manager — the multi-run shell (contract-engine-composer §9,
 * architecture-map's "Run-loop Manager").
 *
 * Owner: 윤석 (architecture track). Stub — the e0 skeleton: the full public
 * surface as exported types, with a stub factory. Behaviour (run counter,
 * carried-block prompt carry-over, report archive, exposure-clock gating,
 * `meta` events) lands with e8; nothing here runs yet.
 *
 * Isomorphic (physical §3.1): the policy bot drives this headless, so
 * persistence is behind an injected `MetaStore` adapter (decision 15) rather
 * than a call to `sessionStorage` — the browser binds a `sessionStorage`
 * adapter (physical §1.1), the headless driver substitutes its own.
 *
 * `MetaState`'s field names are `data/runs/_schema/meta-state.schema.json`'s —
 * that schema is the authority on the persisted shape, not this file.
 */

export type MetaState = {
  pack_slug: string
  run_count: number
  /** Max clock ever reached across runs, or `null` before any run has one. */
  exposure_clock_reached: string | null
  /** Blocks carried into the next run's prompt. */
  carried_blocks: { id: string; text: string }[]
  /** Archived run ids — the index for past-report browsing/mining. */
  report_archive: string[]
}

export interface MetaStore {
  load(): MetaState | null
  save(state: MetaState): void
}

export type RunLoopDeps = {
  store: MetaStore
}

export interface RunLoop {
  /** The persisted meta-state as of the last save. */
  current(): MetaState
  /** Begins a new run — advances `run_count`, rotates `carried_blocks` in. */
  startRun(): void
}

export function createRunLoop(_deps: RunLoopDeps): RunLoop {
  throw new Error('unimplemented: createRunLoop')
}
