// The live driver, wearing the shape the desk already binds.
//
// `createRunLoopDriver` established the pattern: a FACADE over a `FixtureDriver`
// rather than an edit to one, so nothing upstream of the §5.2 seam can tell the
// difference (inv 12). This is the same move with a different inside — e7's
// `LiveDriver` instead of the fixture — and the shell's boot sequence does not
// change shape because of it.
//
// ── The one design decision here: who leads, the clock or the engine ─────────
//
// The fixture holds its whole stream up front, so the CLOCK leads and events are
// released as their stamps come due. A live run cannot do that: a beat's events
// do not exist until the model has answered, 3–4 s for a gate beat and 6.8–10.0 s
// for a round's report (measured 2026-08-04; PR 138).
//
// So the clock follows the engine, and is CLAMPED to the frontier — the latest
// beat stamp the engine has actually produced. Within a beat the fixture's rule
// is unchanged (events release as the clock reaches their stamps, so the desk
// still reads at a human pace); at a beat boundary the clock simply stops until
// the next beat exists. Three things fall out of that, and none of them needed
// special-casing:
//
//   · Waiting is diegetic (architecture §4 latency rule 3) — the desk sits at a
//     stamp with a `waiting` marker rather than freezing mid-animation.
//   · Prefetch (rule 2) — once the current beat's events have all been released
//     the next `step()` is already in flight, so the model thinks during the
//     player's reading time. This is not an optimisation bolted on; it is what
//     "kick as soon as the queue is drained" means.
//   · A paused desk (rate 0) never runs ahead: the clock cannot reach the next
//     frontier, so no further step is kicked. The operator's ▶ is the throttle.
//
// DOM-free, like every module under `src/client/driver/` — the globals guard
// in `tests/driver/import-direction.test.ts (j)` covers this folder too. Real
// elapsed milliseconds arrive through `advance()` from the shell's frame
// callback, exactly as the fixture's do.

import type { Block } from '../../../shared/contracts.ts'
import type { MembraneOp, ViewEvent } from '../../../shared/view-driver.ts'
import type { LiveDriver } from '../../../driver/index.ts'
import { createClock, MS_PER_SIM_MIN, mm } from '../clock.ts'
import type { Clock, ClockRate } from '../clock.ts'
import type { FixtureDriver, FixtureStore, Frame, ViewListener } from '../fixture-driver.ts'
import type { OpResponse } from '../fixtures/types.ts'

/** The run refused: the allotment is spent and no further day opens. */
const REFUSED: OpResponse = { ok: false }

/** One bound run — what `open` hands back, and what a `new_run` replaces. */
export type BoundRun = {
  driver: LiveDriver
  /** `"HH:MM"` this run opens on. */
  start: string
  /** `"HH:MM"` this run closes on. */
  end: string
  /** Folded onto the stream ahead of the run's own events (§5.2 amendment d). */
  meta: ViewEvent
}

/** What the closing run hands the run loop so the next one can inherit it. */
export type RunClose = {
  /** `"HH:MM"` the desk reached — e8 deepens timeline exposure from this. */
  reachedClock: string
  /**
   * The carry-over: the blocks the player DEPLOYED this run, resolved to text.
   * "Prompt carry-over" (plan-pipeline §1) is the composed prompt surviving the
   * day, and the deployed set is that prompt — not everything mined, which
   * would carry material the player looked at and rejected.
   */
  carried: Block[]
}

export type LiveAdapterDeps = {
  /** The first run, already bound. */
  first: BoundRun
  /**
   * Opens the next day, or `null` when the allotment is spent. Called from
   * `send({op:'new_run'})` — the same place the fixture loop rebuilds.
   */
  next(close: RunClose): Promise<BoundRun | null>
}

/**
 * The `"HH:MM"` an event is due at, or null when it rides the one before it —
 * the same rule `fixture-driver.ts` applies, so a live stream and a fixture
 * stream pace identically.
 */
function stampOf(event: ViewEvent): string | null {
  if (event.type === 'beat_start' || event.type === 'beat_end') return event.clock
  if (event.type === 'feed') return event.line.clock
  return null
}

type Pending = { minute: number | null; event: ViewEvent }

export function createLiveAdapter(deps: LiveAdapterDeps): FixtureDriver {
  const listeners = new Set<ViewListener>()
  const seen: ViewEvent[] = []

  let bound: BoundRun = deps.first
  let clock: Clock = createClock({ start: bound.start, end: bound.end })
  let detach: () => void = () => {}

  let pending: Pending[] = []
  /** The latest stamp the engine has produced. The clock never passes it. */
  let frontier = mm(bound.start)
  let stepping = false
  let finished = false
  let started = false
  let rebuilding = false

  // Mirrored from the ops this facade passes through, because `LiveDriver`'s
  // surface answers a different question than the desk asks. It exposes
  // `slottedIds()` — ids in ascending SLOT ORDER — and neither the mined list
  // nor the deployed set, having no reason to; only a view renders those.
  //
  // Slot NUMBERS have to be kept here rather than recovered from that array:
  // a board with one block in slot 2 yields `['b1']`, and re-indexing it from 0
  // would draw the card, and the thread anchored to it, on the wrong slot.
  let mined: string[] = []
  let deployed: string[] = []
  let slots = new Map<number, string>()

  const storeSnapshot = (): FixtureStore => ({
    mined: [...mined],
    slots: Object.fromEntries([...slots.entries()].sort((a, b) => a[0] - b[0])),
    deployed: [...deployed],
  })

  function fanout(event: ViewEvent): void {
    seen.push(event)
    for (const listener of [...listeners]) listener(event)
  }

  /** Queues an emitted event and moves the frontier if it carries a stamp. */
  function absorb(event: ViewEvent): void {
    const stamp = stampOf(event)
    const minute = stamp === null ? null : mm(stamp)
    if (minute !== null && minute > frontier) frontier = minute
    pending.push({ minute, event })
  }

  /** Releases everything now due; an unstamped event rides the one before it. */
  function release(all = false): void {
    if (pending.length === 0) return
    const held: Pending[] = []
    let releasing = true
    for (const item of pending) {
      if (!releasing) {
        held.push(item)
        continue
      }
      if (!all && item.minute !== null && item.minute > clock.minute) {
        releasing = false
        held.push(item)
        continue
      }
      fanout(item.event)
    }
    pending = held
  }

  /**
   * Starts the next beat when there is nothing left to show and the clock has
   * caught up to the engine. Both halves matter: stepping with events still
   * queued would race the desk, and stepping before the clock reaches the
   * frontier would let a paused desk run the whole run in the background.
   */
  function kick(): void {
    if (!started || stepping || finished || rebuilding) return
    if (pending.length > 0 || clock.minute < frontier) return
    stepping = true
    void bound.driver
      .step()
      .then((more) => {
        stepping = false
        if (!more) finished = true
        // A beat's events land during `step()`; releasing here is what makes
        // the opening beat visible without waiting for the next frame.
        release()
        kick()
      })
      .catch(() => {
        // `LiveDriver` grades its own failures into `fallback` events and never
        // rejects (transport decision 1). A rejection here is therefore a defect
        // rather than a model failure — stop the run instead of spinning on it.
        stepping = false
        finished = true
      })
  }

  function bind(run: BoundRun): void {
    bound = run
    detach = run.driver.subscribe(absorb)
    // The run's own `meta` leads its stream: the counter and pips read it, and
    // the fixture loop puts it first for the same reason.
    absorb(run.meta)
  }

  bind(bound)

  /** Opens the next day underneath the listeners that are already bound. */
  async function rebuild(): Promise<void> {
    rebuilding = true
    const rate: ClockRate = clock.rate
    // Resolved before the driver is swapped — afterwards this store is the new
    // run's and knows nothing of the day being closed.
    const store = bound.driver.blocks()
    const carried: Block[] = []
    for (const id of deployed) {
      const block = store.get(id)
      if (block !== undefined) carried.push({ id, text: block.text })
    }
    let opened: BoundRun | null = null
    try {
      opened = await deps.next({ reachedClock: clock.at(), carried })
    } finally {
      rebuilding = false
    }
    if (opened === null) return
    detach()
    pending = []
    finished = false
    mined = []
    deployed = []
    clock = createClock({ start: opened.start, end: opened.end, rate })
    frontier = mm(opened.start)
    bind(opened)
    release()
    kick()
  }

  /** A stable proxy: the shell binds `driver.clock` once and never looks again. */
  const clockProxy: Clock = {
    get minute() {
      return clock.minute
    },
    get rate() {
      return clock.rate
    },
    get running() {
      return clock.running
    },
    get ended() {
      return clock.ended
    },
    at: () => clock.at(),
    pause: () => clock.pause(),
    resume: () => clock.resume(),
    setRate: (rate: ClockRate) => clock.setRate(rate),
    seed: (at: string | number) => clock.seed(at),
    advance: (realMs: number) => clock.advance(realMs),
  }

  return {
    clock: clockProxy,

    subscribe(listener: ViewListener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    start() {
      started = true
      release()
      kick()
    },

    advance(realMs: number) {
      // The clamp. `room` is whole sim minutes to the frontier; converting it
      // back to real milliseconds at the current rate is what stops the clock
      // landing past a beat the engine has not produced yet.
      const room = frontier - clock.minute
      if (room > 0) {
        const cap = clock.rate > 0 ? (room * MS_PER_SIM_MIN) / clock.rate : 0
        clock.advance(Math.min(realMs, cap))
      }
      release()
      kick()
    },

    drain() {
      // Everything already produced, regardless of the clock. It cannot pull
      // the REST of the run forward the way the fixture's can — those events do
      // not exist yet, and manufacturing them would mean calling a model — so
      // this drains the queue and lets `kick` carry on from there.
      release(true)
      kick()
    },

    send(op: MembraneOp): OpResponse {
      const ack = bound.driver.submit(op)
      if (!ack.ok) return { ok: false }

      if (op.op === 'mine') mined = [...mined, op.sentence_id]
      if (op.op === 'slot') slots.set(op.slot, op.block_id)
      if (op.op === 'unslot') slots.delete(op.slot)
      if (op.op === 'deploy') deployed = [...new Set(op.blocks)].sort()
      if (op.op === 'new_run') {
        if (rebuilding) return REFUSED
        void rebuild()
      }
      return { ok: true }
    },

    store: storeSnapshot,

    frame(): Frame {
      return {
        clock: clock.at(),
        minute: clock.minute,
        rate: clock.rate,
        running: clock.running,
        ended: clock.ended,
        // The stream the desk has SEEN — released only. A queued event has not
        // reached a window, so a snapshot that carried it would describe a desk
        // nobody is looking at.
        events: [...seen],
        store: storeSnapshot(),
      }
    },
  }
}
