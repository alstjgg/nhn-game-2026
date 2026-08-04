// [u7] The run-loop driver — what `new_run` means when the day starts over.
//
// `fixture-driver.ts` says of the op: *"the fixture keeps the scripted run; a
// live driver would rebuild it"*. This is that rebuild, as a FACADE over the
// fixture driver rather than an edit to it: one `FixtureDriver` in, one out,
// so nothing upstream of the seam can tell the difference (inv 12) and the
// ratified driver stays untouched.
//
// Two things have to survive the swap, because the shell binds them once at
// boot and never looks again:
//
// - **the listener set** — `game-clock`, the five windows and the run counter
//   all subscribed to the facade, so the facade keeps the set and re-binds the
//   inner driver underneath them;
// - **the clock** — `shell/boot.ts` hands `driver.clock` to the game clock and
//   pumps `driver.advance()` off the frame callback, so `clock` here is a
//   stable proxy whose getters delegate inward.
//
// The op itself is answered by the run's own canned response first: the client
// asked the membrane, and only a driver that said yes rebuilds. The last run
// answers `{ok:false}` — there is no next day to open.
import type { MembraneOp, ViewEvent } from '../../shared/view-driver.ts'
import type { Clock, ClockRate } from './clock.ts'
import { createFixtureDriver } from './fixture-driver.ts'
import type { FixtureDriver, FixtureStore, Frame, ViewListener } from './fixture-driver.ts'
import type { FixtureRun, OpResponse } from './fixtures/types.ts'

/** The run refused: the allotment is spent and no further day opens. */
const REFUSED: OpResponse = { ok: false }

export interface RunLoopOptions {
  /**
   * Open on the day whose `meta` names this run instead of on the first one —
   * what a mid-loop refresh restores (spec-client §7 #8). An unknown run (or
   * `null`) opens the loop at its head, so a stale slot degrades to a cold boot.
   */
  openAt?: number | null
}

/** The run number a day opens with, read off its own `meta` event. */
export function openingRun(run: FixtureRun): number | null {
  for (const event of run.events) if (event.type === 'meta') return event.run
  return null
}

export function createRunLoopDriver(
  runs: readonly FixtureRun[],
  options: RunLoopOptions = {},
): FixtureDriver {
  if (runs.length === 0) throw new Error('run loop: no run to open')

  const listeners = new Set<ViewListener>()
  const seen: ViewEvent[] = []
  const wanted = options.openAt ?? null
  const found = wanted === null ? -1 : runs.findIndex((run) => openingRun(run) === wanted)
  let index = found === -1 ? 0 : found
  let inner = createFixtureDriver(runs[index]!)
  let started = false

  function fanout(event: ViewEvent): void {
    seen.push(event)
    for (const listener of [...listeners]) listener(event)
  }

  let detach = inner.subscribe(fanout)

  /** Opens the next day underneath the listeners that are already bound. */
  function rebuild(): void {
    const rate: ClockRate = inner.clock.rate
    // What the operator built stays theirs across the swap. `frame()` already
    // merges the EVENT stream across runs; leaving the store behind made the
    // two halves of the same snapshot disagree — mine a block, open the next
    // day, and the card was deleted off the desk while the slot board still
    // showed it (R3 on run-loop.ts:115, boot.ts:109). `deployed` is NOT carried:
    // a new day has not been deployed, which is what `SlotBoard.unlock()`
    // already assumes on the run change.
    const kept: FixtureStore = inner.store()
    detach()
    index += 1
    inner = createFixtureDriver(runs[index]!)
    detach = inner.subscribe(fanout)
    if (!started) return
    inner.start()
    // The opening minute's events — the new run's `meta` above all — arrive as
    // real events, exactly as they did at boot. The operator's speed carries
    // over: a desk that was paused stays paused, and 08:50 waits for ▶.
    inner.advance(0)
    inner.clock.setRate(rate)
    carry(kept)
  }

  /** Replays the kept meta-state into the new day through the ops that made it. */
  function carry(kept: FixtureStore): void {
    for (const id of kept.mined) inner.send({ op: 'mine', sentence_id: id })
    for (const [slot, id] of Object.entries(kept.slots)) {
      inner.send({ op: 'slot', block_id: id, slot: Number(slot) })
    }
  }

  const clock: Clock = {
    get minute() {
      return inner.clock.minute
    },
    get rate() {
      return inner.clock.rate
    },
    get running() {
      return inner.clock.running
    },
    get ended() {
      return inner.clock.ended
    },
    at: () => inner.clock.at(),
    pause: () => inner.clock.pause(),
    resume: () => inner.clock.resume(),
    setRate: (rate: ClockRate) => inner.clock.setRate(rate),
    seed: (at: string | number) => inner.clock.seed(at),
    advance: (realMs: number) => inner.clock.advance(realMs),
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
      inner.start()
    },

    advance(realMs: number) {
      inner.advance(realMs)
    },

    drain() {
      inner.drain()
    },

    send(op: MembraneOp): OpResponse {
      const response = inner.send(op)
      if (op.op !== 'new_run' || !response.ok) return response
      if (index + 1 >= runs.length) return REFUSED
      rebuild()
      return response
    },

    store: (): FixtureStore => inner.store(),

    frame(): Frame {
      // The stream the desk has seen is the whole loop's, not the current day's:
      // the archive, the run counter and the tally all read backwards through it.
      return { ...inner.frame(), events: [...seen] }
    },
  }
}

export interface DemoLoopOptions {
  /**
   * DEV DRILL — open the loop on days that file NO `report`, so the tally's hold
   * runs to `PACE.HOLD_CEIL` and lapses. The authored loop files one every day,
   * which leaves the lapse — a release the operator is told about and nothing
   * else on the desk echoes — with no way to be exercised from a booted desk
   * (R2 on `windows/tally.ts:135`). The caller that sets it is `shell/boot.ts`,
   * off a DEV-only query flag; the flag, this option and the stream behind it
   * are all folded out of the player build with `import.meta.env.DEV`.
   */
  withoutReports?: boolean
}

/** The authored demo LOOP in a DEV build; `null` in a player build (§5.4). */
export async function demoRunLoop(options: DemoLoopOptions = {}): Promise<FixtureRun[] | null> {
  if (!import.meta.env.DEV) return null
  if (options.withoutReports === true) {
    const drill = await import('./fixtures/no-report.ts')
    return drill.noReportRunLoop
  }
  const demo = await import('./fixtures/run-loop.ts')
  return demo.woodariRunLoop
}
