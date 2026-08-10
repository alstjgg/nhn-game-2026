// Whether the LIVE FEED still has paper to print — the one thing outside the
// feed that needs to know, and the only way it is allowed to ask.
//
// x11 (08-10) — the day used to end by DUMPING. `run_end` arrived, `run-feed.ts`
// flushed its whole queue in a single frame, and the ending veil came down over
// a fanfold that had just printed its tail all at once. That was tolerable only
// because the reveal pump ran a crowd divisor that kept the backlog small; the
// divisor is gone (민서, 08-10 — the beats with the most to read were the ones
// going by fastest), so the backlog is real and the dump would be a wall.
//
// So the feed drains at its own pace after the clock ends, and the ending waits
// for it. 민서: "If the tail is still typing, nothing should stop it, not even
// the ending."
//
// A shell-owned slot is what makes that legal, exactly as `shell/feed-clock.ts`
// is for the stamp: `components/run-feed.ts` publishes, `shell/ending.ts`
// awaits, and neither reaches the other — a window may not reach a sibling (C8)
// and the ending is not a window at all.
//
// Import-safe: no DOM, no timer, no wall-clock read.

let pending = 0
const waiters = new Set<() => void>()

/**
 * How much the feed still owes the paper — queued events plus the line being
 * typed. Published on every change; the transition that matters is to ZERO.
 *
 * A count and not a boolean because the feed already knows the number and a
 * boolean would make it decide what "busy" means. This module only cares that
 * the number reached 0, and the caller that wants to see the backlog grow can.
 */
export function publishFeedPending(count: number): void {
  if (count === pending) return
  pending = count
  if (pending > 0) return
  // Taken and cleared before resolving: a waiter that re-arms from its own
  // continuation must not land back in the set this loop is walking.
  const settled = [...waiters]
  waiters.clear()
  for (const resolve of settled) resolve()
}

/** What the feed still owes, for a caller that wants it once rather than on change. */
export function feedPending(): number {
  return pending
}

/**
 * Resolves when the feed has nothing left to print.
 *
 * Resolves IMMEDIATELY when nothing is pending, which is also what a caller
 * gets when no feed has ever published — a desk with no fanfold owes no paper,
 * and an ending that hung waiting for a window that was never mounted would be
 * a worse failure than one that arrived early.
 */
export function feedDrained(): Promise<void> {
  if (pending === 0) return Promise.resolve()
  return new Promise<void>((resolve) => {
    waiters.add(resolve)
  })
}

/** A page load is a new sitting — the slot is per-document, so tests reset it. */
export function resetFeedDrain(): void {
  pending = 0
  waiters.clear()
}
