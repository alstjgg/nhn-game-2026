// The browser binder — the one place the merged `src/**` modules are wired into
// a runnable desk, and the only place `createLiveDriver` is called from the
// client. The twin of `tools/driver/run/bind.mjs`, which does the same job for
// the headless run; keeping the two symmetrical is what makes a headless replay
// evidence about the thing the judge plays.
//
// WHAT THIS IS NOT. There is no engine logic here, and no view logic either.
// Every delta, symptom, id, feed line and routing decision comes out of
// `createEngine`; every pixel is the shell's. This file only threads pack data
// in and hands back the three things the adapter needs to open a day.
//
// Import direction (physical §3.1, revised 08-03): `client → driver → composer
// → engine → shared`. `src/client/driver/` is the ONE place under `src/client/`
// allowed to name engine or composer — `tests/scaffold/layout.test.ts (e)`
// enforces the rest, and this wiring is the reason that exemption exists.

import type { Block } from '../../../shared/contracts.ts'
import type { ReportGuidance } from '../../../shared/report-guidance.ts'
import { createEngine } from '../../../engine/index.ts'
import { createComposer } from '../../../composer/index.ts'
import { baselineState, createBlockStore, createLiveDriver, createScorer } from '../../../driver/index.ts'
import type { MutableBlockStore } from '../../../driver/index.ts'
import { createTransport } from '../../../transport/index.ts'
import type { FetchLike } from '../../../transport/index.ts'
import type { LivePack } from './pack.ts'
import type { BoundRun } from './adapter.ts'

export type BindDeps = {
  pack: LivePack
  guidance: ReportGuidance
  /**
   * `VITE_PROXY_BASE_URL`. Empty or absent degrades to e6's fixture provider
   * rather than crashing (contract-calls §11: "unset is not an error"), which
   * is also what lets the whole live chain be exercised offline.
   */
  proxyBaseUrl: string | null
  fetch: FetchLike
}

export type OpenRunDeps = {
  run: number
  carried: readonly Block[]
  /** Every sentence shown so far, seeded minable-but-unmined (`RunClose.shown`). */
  shown: readonly Block[]
  /** `"HH:MM"` bounds for this run's clock, read off the pack's meta. */
  start: string
  end: string
  /** The run/meta view e8 folds onto the stream. */
  meta: BoundRun['meta']
}

/**
 * Every sentence the desk has already shown, into this run's `seen` tier only.
 *
 * NOT mined — `mine()` reads `seen` and `has()`/`get()` read `mined`, so an
 * absorbed-but-unmined sentence is exactly "minable, not deployed". That is
 * what lets an operator mine out of a past sitting's report on a later day
 * without any of it reaching Call 1 unbidden.
 *
 * There is deliberately no throw here, unlike `seedCarried`: a carried block
 * that cannot be seeded is a broken carry-over, but a shown sentence that
 * cannot be is just a line the next day will refuse to mine, which is the
 * behaviour this unit is replacing rather than a corruption of it.
 */
export function seedShown(blocks: MutableBlockStore, shown: readonly Block[]): void {
  for (const block of shown) {
    blocks.absorbLine({ kind: 'mark', clock: '00:00', text: block.text, sentence_id: block.id })
  }
}

/**
 * Carry-over, wired into the run — the same absorb-then-mine path
 * `tools/driver/run/bind.mjs` takes, for the same reason: the store's only
 * public route into the mined tier is through a line it has seen, and reaching
 * past that would let the composer resolve a block the driver cannot.
 *
 * The seeded line is never emitted, never enters the feed, never reaches the
 * timeline; `kind`/`clock` exist only to satisfy the `FeedLine` shape.
 */
function seedCarried(blocks: MutableBlockStore, carried: readonly Block[]): void {
  for (const block of carried) {
    blocks.absorbLine({ kind: 'mark', clock: '00:00', text: block.text, sentence_id: block.id })
    if (!blocks.mine(block.id)) {
      throw new Error(`carried block ${JSON.stringify(block.id)} could not be seeded into the run`)
    }
  }
}

/** Wires one run and hands back what the adapter needs to open it. */
export function bindLiveRun(deps: BindDeps, open: OpenRunDeps): BoundRun {
  const blocks = createBlockStore()
  // Order matters: `shown` only absorbs, `seedCarried` absorbs AND mines. A
  // carried block appears in both and must end up mined, so it goes last.
  seedShown(blocks, open.shown)
  seedCarried(blocks, open.carried)

  const engine = createEngine({ pack: deps.pack, run: open.run })
  const composer = createComposer({ blocks, reportGuidance: deps.guidance })
  const transport = createTransport({ baseUrl: deps.proxyBaseUrl, fetch: deps.fetch })

  // The scorer reads the state the day ENDED in, so it is handed the engine's
  // accessor rather than a snapshot: `createLiveDriver` calls `score()` once,
  // immediately before `run_end` (transport decision 3). Built here rather than
  // inside the driver because the pack is this file's to thread — the driver
  // knows ports, never files.
  // The baseline day is a property of the PACK, not of this run, so it is
  // computed once per bound run from the same pack the engine got.
  const scorer = createScorer(deps.pack.score, () => engine.snapshot(), baselineState(deps.pack))

  const driver = createLiveDriver({ engine, composer, transport, blocks, scorer, run: open.run })

  return { driver, start: open.start, end: open.end, meta: open.meta }
}
