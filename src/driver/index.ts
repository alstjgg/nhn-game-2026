/**
 * The live driver — binds engine + composer + transport and speaks the
 * view-driver seam (spec-client §5.2): `ViewEvent`s out, `MembraneOp`s in.
 *
 * Owner: 윤석 (architecture track). IMPLEMENTED. `createDriver` below is still
 * the e0 skeleton's poll-shaped factory and still throws — the scaffold suite
 * pins that surface — but the driver the run actually uses, `createLiveDriver`,
 * is bound and exercised end to end by `tools/driver/drive-run.mjs`. The
 * "nothing here runs yet" this header used to carry has not been true since e7.
 *
 * Isomorphic (physical §3.1): the same binding also drives the headless
 * policy-bot run (e9), so it takes its three collaborators as injected
 * dependencies (decision 15) rather than importing concrete engine/composer
 * modules — a fixture driver can stand in for any of the three without this
 * module's source changing.
 */

import type { ViewEvent, MembraneOp } from '../shared/view-driver.ts'
import type { Engine } from '../engine/index.ts'
import type { Composer } from '../composer/index.ts'
import type { Transport } from '../transport/index.ts'

export type DriverDeps = {
  engine: Engine
  composer: Composer
  transport: Transport
}

export interface Driver {
  /** View events produced since the last poll, in occurrence order. */
  poll(): ViewEvent[]
  /** A player-issued membrane op — `slot` · `unslot` · `mine` · `deploy` · `new_run`. */
  submit(op: MembraneOp): void
}

export function createDriver(_deps: DriverDeps): Driver {
  throw new Error('unimplemented: createDriver')
}

// ─── the live binding (e7) ───────────────────────────────────────────────────
//
// Added beside the skeleton above, never in place of it: `createDriver` is the
// poll-shaped surface e0 froze and the scaffold suite still pins, while
// `createLiveDriver` is the subscribe-shaped one the run actually drives. The
// deps of the second are an intersection of the first's, so a host that can
// build one can build the other.

export { createLiveDriver, UNUSABLE_PAYLOAD_CODE } from './live-driver.ts'
export { assertSeamClean } from './seam-guard.ts'
export { createBlockStore } from './blocks.ts'
export { createEmitter } from './emitter.ts'
export { createMembrane } from './membrane.ts'
export { createScorer, scoreRecord, scoreUnits, totalOf, untouchedState } from './scorer.ts'
export type { OutcomePack, ScoredUnit, ScorePack, ScoreUnit } from './scorer.ts'

export type {
  BeatCursor,
  BlockStore,
  ComposerPort,
  EnginePort,
  LiveDriver,
  LiveDriverDeps,
  MutableBlockStore,
  OpAck,
  ReportSentences,
  ScorerPort,
  TransportPort,
  ViewListener,
} from './ports.ts'
export type { Emitter, SeamGuard } from './emitter.ts'
export type { Membrane } from './membrane.ts'
