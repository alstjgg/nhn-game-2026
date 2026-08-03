// The fixture driver — spec-client §5.4. It replays an ordered `ViewEvent[]` in
// stream order, gated on the sim clock, and answers every `MembraneOp` the
// script expects from the run file's canned set. Windows cannot tell it from
// the live driver (invariant 12), which is the whole point of the seam.
import type { MembraneOp, ViewEvent } from '../../shared/view-driver.ts'
import type { FixtureRun, OpResponse } from './fixtures/types.ts'
import type { Clock } from './clock.ts'
import { createClock, mm } from './clock.ts'
import { assertSeamClean } from './seam-guard.ts'
import { tickAnimations } from './test-hooks.ts'

/** The meta-state the fixture acknowledges ops into (§5.3, §5.4). */
export interface FixtureStore {
  /** Mined sentence ids, in the order they were mined. */
  mined: string[]
  /** Slot index → block id. */
  slots: Record<number, string>
  /** Deployed blocks as a SET — canonically sorted, order carries no meaning. */
  deployed: string[]
}

/** A deterministic snapshot of everything a view could render right now. */
export interface Frame {
  clock: string
  minute: number
  rate: number
  running: boolean
  ended: boolean
  events: ViewEvent[]
  store: FixtureStore
}

export type ViewListener = (event: ViewEvent) => void

export interface FixtureDriver {
  readonly clock: Clock
  subscribe(listener: ViewListener): () => void
  start(): void
  /** Pumps real elapsed milliseconds through clock, animations and stream. */
  advance(realMs: number): void
  /** Releases the rest of the stream regardless of the clock. */
  drain(): void
  send(op: MembraneOp): OpResponse
  store(): FixtureStore
  frame(): Frame
}

/** The `"HH:MM"` an event is due at, or null when it rides the one before it. */
function stampOf(event: ViewEvent): string | null {
  if (event.type === 'beat_start' || event.type === 'beat_end') return event.clock
  if (event.type === 'feed') return event.line.clock
  return null
}

export function createFixtureDriver(run: FixtureRun): FixtureDriver {
  const clock = createClock({ start: run.start, end: run.end })
  const startMinute = mm(run.start)

  // Due minute per event, resolved once: an unstamped event rides the stamp of
  // the last stamped event before it, so stream order is never reordered.
  const due: number[] = []
  let carried = startMinute
  for (const event of run.events) {
    const stamp = stampOf(event)
    if (stamp !== null) carried = mm(stamp)
    due.push(carried)
  }

  const listeners = new Set<ViewListener>()
  const emitted: ViewEvent[] = []
  const mined: string[] = []
  const slots: Record<number, string> = {}
  let deployed: string[] = []
  let cursor = 0
  let started = false

  function emit(event: ViewEvent): void {
    // Invariant 12: the guard runs before any subscriber can see the event.
    assertSeamClean(event)
    emitted.push(event)
    for (const listener of [...listeners]) listener(event)
  }

  function release(upTo: number | null): void {
    while (cursor < run.events.length) {
      if (upTo !== null && due[cursor]! > upTo) return
      emit(run.events[cursor]!)
      cursor += 1
    }
  }

  function snapshot(): FixtureStore {
    return { mined: [...mined], slots: { ...slots }, deployed: [...deployed] }
  }

  function apply(op: MembraneOp): void {
    switch (op.op) {
      case 'slot':
        slots[op.slot] = op.block_id
        break
      case 'unslot':
        delete slots[op.slot]
        break
      case 'mine':
        if (!mined.includes(op.sentence_id)) mined.push(op.sentence_id)
        break
      case 'deploy':
        // A SET (§5.2): content carries meaning, order does not.
        deployed = [...new Set(op.blocks)].sort()
        break
      case 'new_run':
        // The fixture keeps the scripted run; a live driver would rebuild it.
        break
    }
  }

  return {
    clock,

    subscribe(listener: ViewListener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    start() {
      started = true
    },

    advance(realMs: number) {
      if (!started || !clock.running) return
      tickAnimations(realMs)
      clock.advance(realMs)
      // The reference flushes what is left when the run closes (endRun).
      release(clock.ended ? null : clock.minute)
    },

    drain() {
      if (!started) return
      release(null)
    },

    send(op: MembraneOp): OpResponse {
      if (!started) throw new Error(`fixture driver: op '${op.op}' sent before start()`)
      const response = run.responses[op.op]
      if (!response) {
        throw new Error(`fixture run '${run.id}' scripts no response for op '${op.op}'`)
      }
      apply(op)
      return response
    },

    store: snapshot,

    frame(): Frame {
      return {
        clock: clock.at(),
        minute: clock.minute,
        rate: clock.rate,
        running: clock.running,
        ended: clock.ended,
        events: [...emitted],
        store: snapshot(),
      }
    },
  }
}
