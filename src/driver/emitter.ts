/**
 * The one choke point every `ViewEvent` leaves the driver through.
 *
 * There is exactly one `emit` in `src/driver/`, and it runs the seam guard on
 * the way past — so "every emitted event was checked" is a property of the call
 * graph rather than a rule five call sites have to remember. A leak therefore
 * throws before any subscriber sees the event, not after.
 *
 * The guard arrives as a parameter so it can be counted or tightened from a
 * test without the emitter growing a mode flag; the default is the real one.
 */

import type { ViewEvent } from '../shared/view-driver.ts'
import type { ViewListener } from './ports.ts'
import { assertSeamClean } from './seam-guard.ts'

export type SeamGuard = (event: ViewEvent) => ViewEvent

export type Emitter = {
  subscribe(fn: ViewListener): () => void
  /** Guards, then hands the event to every current subscriber in order. */
  emit(event: ViewEvent): void
}

export function createEmitter(guard: SeamGuard = assertSeamClean): Emitter {
  const listeners = new Set<ViewListener>()

  return {
    subscribe(fn: ViewListener): () => void {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },

    emit(event: ViewEvent): void {
      const checked = guard(event)
      // A snapshot: a subscriber that unsubscribes mid-dispatch must not
      // reorder or skip the delivery of this event to the others.
      for (const listener of [...listeners]) listener(checked)
    },
  }
}
