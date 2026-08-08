// The desk's shown time — the stamp the LIVE FEED has most recently PRINTED.
//
// x6 — the top bar used to paint `driver.clock.at()`, which is the sim clock's
// own running minute and NOT the time the operator can see. The fanfold reveals
// its lines through a paced queue (`run-feed.ts`'s reveal pump, plus a hold on
// the beat a report lands in), so the chrome ran ahead of the paper by however
// much the queue was holding: two clocks on one desk, disagreeing, with the
// authoritative-looking one wrong. The chrome now follows the paper.
//
// A shell-owned slot is what makes that legal. `run-feed.ts` publishes a stamp
// as it lands in the DOM and `components/game-clock.ts` subscribes; neither
// reaches the other, because a window may not reach a sibling (C8) and the top
// bar is not a window at all. Both ends talk to this module and to nothing else,
// exactly as `shell/run-state.ts` is the slot the desk's phase lives in.
//
// Import-safe: no DOM, no timer, no wall-clock read. The stamp is a STRING off
// the seam — this module never parses one, so `21:04+` and `09:25` are alike to
// it and `displayStamp` stays the one place the trailing `+` is resolved.

type FeedStampListener = (stamp: string) => void

let current = ''
const listeners = new Set<FeedStampListener>()

/**
 * The newest stamp the feed has printed, or `''` before its first line.
 *
 * Empty stamps are refused rather than published: a `mark` line carries none
 * (`run-feed.ts`'s envelope gives it `null`), and a clock that blanked itself
 * every time one landed would be reporting that time had stopped.
 */
export function publishFeedStamp(stamp: string): void {
  if (stamp === '' || stamp === current) return
  current = stamp
  for (const listener of listeners) listener(stamp)
}

/** The stamp now shown, for a caller that wants it once rather than on change. */
export function feedStamp(): string {
  return current
}

/**
 * Follow the feed's stamp. Returns the unsubscribe the caller owns.
 *
 * A listener is called immediately with whatever has already landed, so a late
 * subscriber is not left blank until the next line — the top bar mounts before
 * the windows do (`shell/boot.ts` steps 3 and 4), so today it always arrives
 * first, and this is what keeps that ordering from being load-bearing.
 */
export function subscribeFeedStamp(listener: FeedStampListener): () => void {
  listeners.add(listener)
  if (current !== '') listener(current)
  return () => {
    listeners.delete(listener)
  }
}

/** A page load is a new sitting — the slot is per-document, so tests reset it. */
export function resetFeedClock(): void {
  current = ''
  listeners.clear()
}
