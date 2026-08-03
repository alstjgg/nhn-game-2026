/**
 * The live driver — binds engine + composer + transport and speaks the
 * view-driver seam (spec-client §5.2): `ViewEvent`s out, `MembraneOp`s in.
 *
 * Owner: 윤석 (architecture track). Stub — the e0 skeleton: the full public
 * surface as exported types, with a stub factory. Behaviour lands with the
 * unit that implements it; nothing here runs yet.
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
