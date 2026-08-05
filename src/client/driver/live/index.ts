// The live desk — pack in, `FixtureDriver` out.
//
// `demo-run.ts` offers the authored fixture loop in DEV builds; this is its
// counterpart for the build the judge plays, and the shell chooses between them
// the same way it always has: it asks, and takes what it is given.
//
// Everything DOM-shaped is injected. Modules under `src/client/driver/` are held
// free of DOM globals by `tests/driver/import-direction.test.ts (j)`, so the
// base URL, `fetch` and the session storage all arrive from the shell.

import type { Block } from '../../../shared/contracts.ts'
import { createRunLoop } from '../../../runloop/index.ts'
import type { RunLoop } from '../../../runloop/index.ts'
import { createWebStorageMetaStore } from '../../../runloop/index.ts'
import type { StorageLike } from '../../../runloop/index.ts'
import type { ReportGuidance } from '../../../shared/report-guidance.ts'
import type { FixtureDriver } from '../fixture-driver.ts'
import { createLiveAdapter } from './adapter.ts'
import type { BoundRun, RunClose } from './adapter.ts'
import { bindLiveRun, type BindDeps } from './bind.ts'
import { fetchGuidance, fetchPack } from './pack.ts'

export type LiveRunDeps = {
  /** The deployed base, read by the shell. */
  baseUrl: string
  /**
   * The browser's own `fetch`, injected. It satisfies both shapes this path
   * needs — the pack's plain GET and the transport's POST — because its second
   * parameter is optional.
   */
  fetch: typeof globalThis.fetch
  /** `sessionStorage`. Meta-state is per-tab by design (physical §1.1). */
  storage: StorageLike
  slug: string
  /** `"HH:MM"` bounds from the pack meta the shell already fetched. */
  start: string
  end: string
  /** `VITE_PROXY_BASE_URL`; `null` degrades to the transport's fixture provider. */
  proxyBaseUrl: string | null
}

/**
 * The run id the archive indexes, and the shape run-record provenance parses:
 * `mined_from_run` is derived by matching `/-r([0-9]+)$/`, so a run id that does
 * not end that way silently loses provenance
 * (`discovery/live-provider-prerequisites.md` §5).
 */
const runIdOf = (slug: string, run: number): string => `${slug}-r${run}`

/**
 * Opens the live desk. Throws only if the pack cannot be fetched — a missing
 * proxy URL is not an error (contract-calls §11), it degrades to e6's fixture
 * provider, which is also how the whole chain is exercised offline.
 */
export async function createLiveRunDriver(deps: LiveRunDeps): Promise<FixtureDriver> {
  const source = { baseUrl: deps.baseUrl, fetch: deps.fetch }
  const [pack, guidance] = await Promise.all([
    fetchPack(source, deps.slug),
    // Policy data, shape-checked by `renderReportGuidance` at first use rather
    // than here: a second validator would be a second definition of the same
    // contract, and `data/policy/` is authored data under lint (README §3).
    fetchGuidance(source) as Promise<ReportGuidance>,
  ])

  const bindDeps: BindDeps = {
    pack,
    guidance,
    proxyBaseUrl: deps.proxyBaseUrl,
    // The isomorphism boundary, narrowed on the DOM side where it belongs.
    // `src/transport` compiles under `tsconfig.core.json`, which empties `types`,
    // so it cannot name `AbortSignal` and types its init's `signal` as `unknown`.
    // That is wider than `RequestInit` accepts, and this is the one place that
    // knows both halves — putting the cast here keeps the transport isomorphic
    // instead of loosening the guard to make an assignment compile.
    fetch: (url, init) => deps.fetch(url, init as RequestInit),
  }

  const runLoop: RunLoop = createRunLoop({
    store: createWebStorageMetaStore(deps.storage, deps.slug),
    packSlug: deps.slug,
  })

  /**
   * Begins a day: the run loop advances the counter and rotates the carry-over
   * in, then the binder wires an engine seeded with both. The `meta` event is
   * taken AFTER `startRun` so the counter the desk renders is this run's.
   */
  function openRun(carried: readonly Block[], run: number): BoundRun {
    return bindLiveRun(bindDeps, {
      run,
      carried,
      start: deps.start,
      end: deps.end,
      meta: runLoop.metaEvent(),
    })
  }

  const begun = runLoop.startRun()
  const first = openRun(begun.carried, begun.run)
  let current = begun.run

  return createLiveAdapter({
    first,
    async next(close: RunClose): Promise<BoundRun | null> {
      runLoop.endRun({
        runId: runIdOf(deps.slug, current),
        reachedClock: close.reachedClock,
        carried: close.carried,
      })
      // The allotment is spent — `new_run` is refused and the desk stays on the
      // day it is on, exactly as the fixture loop's last run answers. Read off
      // the meta event rather than `current()`: `runs_left` is derived from the
      // configured total, which the persisted `MetaState` deliberately does not
      // carry (config is never persisted).
      const remaining = runLoop.metaEvent()
      if (remaining.type === 'meta' && remaining.runs_left <= 0) return null

      const next = runLoop.startRun()
      current = next.run
      return openRun(next.carried, next.run)
    },
  })
}
