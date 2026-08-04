// [u3#c6 → u5] LIVE FEED — the window body, and the one handle that drives it.
//
// 실시간 무전 피드. u3 owns the frame; u5 fills this file and only this file,
// so no later unit has to touch a shared barrel or index.html.
//
// This module is deliberately thin: `run-feed.ts` owns the fanfold and every
// line it prints, and everything here is the seam between that component and
// the shell. Two rules bind it:
//
//  * [u5#c6] the window owns NO clock. `seek` and `rate` move the DRIVER's
//    clock and then let the driver release what is due — they never land a line
//    themselves, never hold a timer, and never read the wall clock. Pausing the
//    driver's clock therefore stops the feed dead, which is the whole point.
//  * [u5#c9] nothing here touches run text at all — it never sees one.
//
// Import-safe by contract: no DOM at module scope, no stylesheet import, no
// sibling window import, nothing from engine or composer (C8 / inv 12).
import type { ClockRate, FixtureDriver } from '../driver/index.ts'
import { createRunFeed } from '../components/run-feed.ts'
import type { RunFeed } from '../components/run-feed.ts'

/**
 * The dev/test handle, the feed's counterpart to the shell's `window.__shell`:
 * what has landed (`count` · `kinds` · `stamps`) and the two clock controls a
 * run needs to be driven at test speed. ×1 is ~77 s of real time for the whole
 * day, so `seek` is the only way to reach the run's terminal inside an e2e
 * budget — it is a jump of the driver's clock, not a replay of its own.
 */
export interface FeedHandle extends RunFeed {
  seek(at: string): void
  rate(to: number): void
}

declare global {
  interface Window {
    __feed?: FeedHandle
  }
}

/** The three speeds the driver's clock accepts; 0 is pause. */
const RATES: readonly ClockRate[] = [0, 1, 4]

function asRate(value: number): ClockRate {
  const rate = RATES.find((r) => r === value)
  if (rate === undefined) throw new Error(`live feed: ${value} is not a driver clock rate`)
  return rate
}

/**
 * Pin the driver's clock to `at` and let the DRIVER release everything now due.
 *
 * `advance(0)` gains no sim minute (the clock ignores a non-positive step) and
 * exists only so the driver runs its own release at the seeded minute — the
 * rate is lifted across that call because a paused driver releases nothing, and
 * put straight back. At the run's terminal the driver's own rule is to flush
 * the remainder, which `drain()` is.
 */
function seek(driver: FixtureDriver, at: string): void {
  const rate = driver.clock.rate
  driver.clock.seed(at)
  if (driver.clock.ended) {
    driver.drain()
    return
  }
  driver.clock.setRate(rate === 0 ? 1 : rate)
  driver.advance(0)
  driver.clock.setRate(rate)
}

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  const feed = createRunFeed(host, driver)
  // DEV/TEST only, on the same rule `shell/boot.ts` applies to `window.__shell`:
  // a surface that exists to test the desk does not ship with the desk (inv 11).
  // `import.meta.env.DEV` is a constant the bundler folds, so the player build
  // drops the whole assignment and every name in it; `preview-smoke.spec.ts`'s
  // inv-11 needle list names `__feed` to keep it that way. The mount itself stays
  // unconditional — only the handle is gated.
  if (import.meta.env.DEV) {
    window.__feed = {
      count: () => feed.count(),
      kinds: () => feed.kinds(),
      stamps: () => feed.stamps(),
      seek: (at: string) => seek(driver, at),
      rate: (to: number) => driver.clock.setRate(asRate(to)),
    }
  }
}
