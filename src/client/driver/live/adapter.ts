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
import { tickAnimations } from '../test-hooks.ts'

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
   * Whether a further day exists — answered SYNCHRONOUSLY, because `send()` is.
   *
   * `next()` is the authority on opening one, but it cannot be the authority on
   * REFUSING: an op's answer is the only signal the client gets
   * (`windows/tally.ts` renders the refusal and announces it), and by the time a
   * promise settles the desk has already been told `ok`. So the last run has to
   * be knowable before the op is acked, exactly as the fixture loop knows it
   * (`run-loop.ts`: `if (index + 1 >= runs.length) return REFUSED`).
   */
  canOpenNext(): boolean
  /**
   * Opens the next day, or `null` when the allotment is spent. Called from
   * `send({op:'new_run'})` — the same place the fixture loop rebuilds.
   */
  next(close: RunClose): Promise<BoundRun | null>
  /**
   * Closes the day WITHOUT opening another — the refusal path's counterpart to
   * `next()`, which is the only other thing that ends a run.
   *
   * `canOpenNext()` answers false on the last run of a sitting, and the refusal
   * returns before `rebuild()` is ever reached, so `next()` — and with it the
   * run loop's `endRun` — never ran for that run: its report id never entered
   * the archive, its carry-over was never written, and the exposure clock never
   * deepened past the second-to-last day. The refusal is the DESK's answer, not
   * the run's. The day ended either way and the run loop has to hear about it.
   */
  closeRun(close: RunClose): void
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
  /** Whether the run currently bound has already been handed to the run loop. */
  let closed = false

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
      .catch((cause: unknown) => {
        // `LiveDriver` grades its own failures into `fallback` events and never
        // rejects (transport decision 1). A rejection here is therefore a defect
        // rather than a model failure — stop the run instead of spinning on it.
        //
        // AND SAY SO. This swallowed one: `mm()` rejected the authored `21:04+`
        // stamp inside `absorb`, the throw unwound through the emitter into
        // `step()`, and the run died on its final beat — no `run_end`, no
        // score, no TALLY — leaving a desk that looked merely slow. A defect
        // the desk cannot show has to at least leave a trace in the console,
        // which is all this path has while the live chain has no e2e.
        stepping = false
        finished = true
        console.error('live run stopped — the driver rejected mid-beat', cause)
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

  /**
   * What the closing day hands on, whether another one opens or not.
   *
   * Resolved before the driver is swapped — afterwards this store is the new
   * run's and knows nothing of the day being closed.
   */
  function closingState(): RunClose {
    const store = bound.driver.blocks()
    const carried: Block[] = []
    for (const id of deployed) {
      const block = store.get(id)
      if (block !== undefined) carried.push({ id, text: block.text })
    }
    return { reachedClock: clock.at(), carried }
  }

  /** Opens the next day underneath the listeners that are already bound. */
  async function rebuild(): Promise<void> {
    rebuilding = true
    const rate: ClockRate = clock.rate
    const close = closingState()
    let opened: BoundRun | null = null
    try {
      opened = await deps.next(close)
    } finally {
      rebuilding = false
    }
    // `next()` ended the run on its way in, so the day it closed is spoken for
    // either way; only a day that OPENS resets this.
    closed = opened === null
    if (opened === null) return
    detach()
    pending = []
    finished = false
    // The store the desk shows has to be the store the new run HAS.
    //
    // `bindLiveRun` seeds exactly the carried blocks into the new run — it
    // absorbs and mines each one — so those ids, and only those, are its deck.
    // Wiping `mined` while leaving `slots` behind produced a board that drew a
    // card the deck no longer listed, on a slot the new engine has nothing in:
    // the same disagreement the fixture loop already carries a comment about
    // (`run-loop.ts`, R3 on `run-loop.ts:115`), reproduced with the halves the
    // other way round.
    //
    // `slots` clears rather than carries because a new day has not been built
    // yet — which is what `SlotBoard.unlock()` assumes on the run change, and
    // why the fixture loop does not carry `deployed` either.
    mined = close.carried.map((block) => block.id)
    slots = new Map()
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
      if (!started) return
      // THE ANIMATION PUMP IS THE DRIVER'S, on this path too. `report-view.ts`
      // owns no timer by design — its typewriter is a pure function of elapsed
      // milliseconds fed through `registerAnimation`, and `tickAnimations` is
      // the only thing that feeds it. The fixture driver pumped it and this
      // facade did not, so on a player build the agent's report painted its
      // opening cursor — every sentence empty — and stayed there forever, while
      // the objective log beside it filed whole. `freezeAnimations()` still
      // gates the pump, so determinism is unchanged.
      //
      // The condition is the fixture's, verbatim, and for its reason (R4 on
      // windows/reports.ts:55): a PAUSED desk holds everything still, but a
      // desk whose run has CLOSED keeps pumping, because the day's last report
      // arrives on the same frame the clock reaches its terminal minute.
      if (clock.running || clock.ended) tickAnimations(realMs)
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

      // A SET, mirroring the fixture's `if (!mined.includes(...))`. The ack
      // cannot stand in for the check: `blocks.mine()` answers `true` for an id
      // it has already mined, so the membrane acks a second MINE on the same
      // sentence — and this list is what the block store window deals from, so
      // appending blindly dealt the same card twice.
      if (op.op === 'mine' && !mined.includes(op.sentence_id)) mined = [...mined, op.sentence_id]
      if (op.op === 'slot') slots.set(op.slot, op.block_id)
      if (op.op === 'unslot') slots.delete(op.slot)
      if (op.op === 'deploy') deployed = [...new Set(op.blocks)].sort()
      if (op.op === 'new_run') {
        // Refused BEFORE the ack, never after. `rebuild()` settling on `null`
        // would leave the desk already told `ok`, and `tally.ts` reads that
        // answer as "the day turned": it disables NEW RUN before sending and
        // only prints `SPENT` on a refusal, so an `ok` on the last run leaves a
        // dead button under a sheet that never closes.
        if (rebuilding) return REFUSED
        if (!deps.canOpenNext()) {
          // Refused, but CLOSED — the last day of a sitting ends like any other.
          // `next()` is the only other thing that reaches the run loop's
          // `endRun`, and the line above returns before `rebuild()` can call it,
          // so the final run used to leave no record at all: nothing in the
          // archive, no carry-over written, no exposure clock deepened. Guarded
          // rather than repeated, because the desk keeps answering this op for
          // as long as the sheet is open and the clock keeps moving under it.
          if (!closed) {
            closed = true
            deps.closeRun(closingState())
          }
          return REFUSED
        }
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
