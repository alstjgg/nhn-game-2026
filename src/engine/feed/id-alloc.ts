/**
 * The per-run sentence-id allocator.
 *
 * Owner: e4. The grammar itself belongs to `src/shared/id.ts` (e0's merged
 * minter) and is consumed, never re-derived: a second copy of the padding rule
 * is exactly the drift the single minting site exists to prevent.
 *
 * What this file adds is the **counter**, and its scope is the load-bearing
 * decision: one counter per (run, channel), monotonic across the whole run in
 * emission order. Not per beat — a per-beat reset would mint the same id twice
 * in one run, and archive highlighting is keyed on that id.
 *
 * The allocator is an object the caller creates and threads, never module
 * state. Two consequences worth the extra parameter:
 *
 * - two runs can be built in one process (the fixture generator does exactly
 *   that), and
 * - a test file cannot leak its counter into the next one, which is what would
 *   make the D1 golden pass or fail depending on test order.
 *
 * `next` mints before it advances, so a rejected channel (`t`, say — authored
 * script ids are a separate family and are never minted) throws without
 * consuming a sequence number.
 */

import { mintSentenceId } from '../../shared/id.ts'
import type { Channel } from '../../shared/species.ts'

export type IdAllocator = {
  readonly run: number
  /** The next id on `channel`, 1-based. Throws if `channel` is not a minted one. */
  next(channel: Channel): string
  /** How many ids this run has minted on `channel` so far. */
  used(channel: Channel): number
}

export function createIdAllocator(run: number): IdAllocator {
  const counters = new Map<Channel, number>()

  return {
    run,

    next(channel: Channel): string {
      const index = (counters.get(channel) ?? 0) + 1
      // Mint first: an off-grammar channel throws here, before the counter moves.
      const id = mintSentenceId(run, channel, index)
      counters.set(channel, index)
      return id
    },

    used(channel: Channel): number {
      return counters.get(channel) ?? 0
    },
  }
}
