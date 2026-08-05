// The sim clock — spec-client §8: pacing belongs to the DRIVER, not to a view.
//
// Ported from the phase-2 design reference (docs/design/phase2-ui/app.js, the
// "SIM CLOCK LOOP" block): a real-millisecond accumulator drained at
// MS_PER_SIM_MIN per sim minute, rates ×1 / ×4 / pause, hard stop at the run's
// end stamp. The reference drove it from the browser's frame callback and kept
// the accumulator in a module global; here the pump is an explicit `advance()`
// so the driver stays view-agnostic and deterministic under test.

/** Real milliseconds per sim minute — the reference pacing constant. */
export const MS_PER_SIM_MIN = 105

/** The three speed controls the reference exposes; 0 is pause. */
export type ClockRate = 0 | 1 | 4

/**
 * Minutes since midnight for an `"HH:MM"` seam stamp.
 *
 * THE TRAILING `+` IS PART OF THE VOCABULARY, not a typo. `우는다리`'s timeline
 * closes on `21:04+` — "immediately after that minute" — and `engine/beat/
 * clock.ts` gives it a sub-minute sort weight rather than a minute of its own.
 * `buildSchedule` keeps the authored string verbatim on `Beat.clock`, so the
 * live driver emits it on that beat's `beat_start`/`beat_end`, and this parser
 * is what the live adapter measures those stamps with.
 *
 * Rejecting it therefore killed the RUN, not the parse: the throw unwound
 * through the adapter's `absorb` subscriber into `step()`, whose rejection the
 * adapter grades as a defect and stops on — so the final beat, `run_end` and
 * the whole TALLY never happened on a player build. `shell/pack.ts` already
 * strips the same `+` off the clock band for exactly this reason; the seam's
 * stamps needed it too.
 *
 * A whole-minute clock has nowhere to put the weight, and it never needed one:
 * `21:04+` releases with `21:04` and stream order keeps them apart, which is
 * the ordering the `+` was carrying in the first place.
 */
export function mm(stamp: string): number {
  const match = /^(\d{1,2}):(\d{2})\+?$/.exec(stamp)
  if (!match) throw new Error(`clock: '${stamp}' is not an "HH:MM" stamp`)
  return Number(match[1]) * 60 + Number(match[2])
}

/** The `"HH:MM"` seam stamp for minutes since midnight. */
export function hhmm(minute: number): string {
  const wrapped = ((Math.trunc(minute) % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface ClockOptions {
  /** `"HH:MM"` the run opens on. */
  start: string
  /** `"HH:MM"` the run closes on — the clock never passes it. */
  end: string
  /** Defaults to ×1. */
  rate?: ClockRate
}

export interface Clock {
  /** Minutes since midnight. */
  readonly minute: number
  readonly rate: ClockRate
  /** Ticking right now: not paused, rate above 0, end not yet reached. */
  readonly running: boolean
  readonly ended: boolean
  /** The current `"HH:MM"` stamp. */
  at(): string
  pause(): void
  resume(): void
  setRate(rate: ClockRate): void
  /** Pin the clock to an exact minute, dropping any sub-minute remainder. */
  seed(at: string | number): void
  /** Feed real elapsed milliseconds in; answers the sim minutes gained. */
  advance(realMs: number): number
}

export function createClock(options: ClockOptions): Clock {
  const endMinute = mm(options.end)
  let minute = mm(options.start)
  let rate: ClockRate = options.rate ?? 1
  let paused = false
  let acc = 0

  const isEnded = (): boolean => minute >= endMinute
  const isRunning = (): boolean => !paused && rate > 0 && !isEnded()

  return {
    get minute() {
      return minute
    },
    get rate() {
      return rate
    },
    get running() {
      return isRunning()
    },
    get ended() {
      return isEnded()
    },
    at() {
      return hhmm(minute)
    },
    pause() {
      paused = true
    },
    resume() {
      paused = false
    },
    setRate(next: ClockRate) {
      rate = next
    },
    seed(at: string | number) {
      minute = typeof at === 'number' ? at : mm(at)
      acc = 0
    },
    advance(realMs: number) {
      if (!isRunning() || realMs <= 0) return 0
      acc += realMs * rate
      let gained = 0
      while (acc >= MS_PER_SIM_MIN && minute < endMinute) {
        acc -= MS_PER_SIM_MIN
        minute += 1
        gained += 1
      }
      if (isEnded()) acc = 0
      return gained
    },
  }
}
