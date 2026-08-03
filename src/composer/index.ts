/**
 * Payload composer — datapack + engine state + injected blocks → call slots.
 *
 * Owner: 윤석 (architecture track). Stub — but **not blocked on the engine**:
 * its input shape is fixed by
 * [contract-engine-composer.md](../../docs/contract-engine-composer.md) §3, so
 * this can be built against that contract before an engine exists.
 *
 * It does **not** read the datapack. Every scenario value arrives through an
 * engine view, so run position lives in one place (contract §7). And it does not
 * render prose: physical §3.10 puts both message layers in the proxy, so this
 * module assembles slot *values* into a `CallRequest`. The one exception is
 * `TEMPERAMENT`, which the proxy passes through as a string — see contract §4.
 *
 * Same purity requirement as the engine (§2 constraint 1): the Node driver
 * composes byte-identical payloads to the ones the browser composes, so no
 * DOM, no `fs`, no `fetch`, no clock, no randomness in here.
 *
 * This file is the e0 skeleton: the full public surface as exported types,
 * with a stub factory. Behaviour lands with the unit that implements the
 * composer's body; nothing here runs yet.
 */

import type { GateView, BeatView, RoundView } from '../engine/index.ts'
import type { CallRequest } from '../shared/contracts.ts'

/**
 * Everything that is not engine state arrives at construction (§3). The
 * canonical `reportGuidance` shape is `e1`'s
 * (`data/policy/report-guidance.json`'s type) — that unit's `file_globs` own
 * it and this skeleton must not pre-empt the declaration, so the field is
 * typed structurally rather than against a second copy. Whichever unit
 * reconciles the two re-points this at the canonical type; see `discovery/e0.md`.
 */
export type ComposerDeps = {
  reportGuidance: unknown
}

export interface Composer {
  /** `deploy`'s slotted set, as ids — resolution and canonical ordering are this module's. */
  judgment(view: GateView, blockIds: string[]): CallRequest
  narration(view: BeatView): CallRequest
  reporter(view: RoundView): CallRequest
}

export function createComposer(_deps: ComposerDeps): Composer {
  throw new Error('unimplemented: createComposer')
}
