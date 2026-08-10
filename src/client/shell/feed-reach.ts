// How far down the day's stream the LIVE FEED has PRINTED — the one thing a
// window may ask about a sibling's paper, and the only way it is allowed to ask.
//
// x12 (민서, 08-10) — THE OUTCOME WAS ARRIVING BEFORE ITS CAUSE. `windows/
// reports.ts` subscribes straight to the §5.2 stream, so a `report` event typed
// the day's write-up — and a `score` started the terminal record's count-up —
// in the frame the seam emitted them. Since x11 the fanfold TYPES its lines and
// paces them, so at that moment it is still tens of seconds back, printing the
// beats the write-up is about. The operator read the conclusion of a round over
// a paper that had not yet said what happened in it.
//
// The old answer was a hold in the other direction: `run-feed.ts` carried a
// `REPORT_HOLD_MS = 9000` that STOPPED THE FEED while a report typed, sized when
// the feed lagged the seam by a beat or two. Once the paper became a typewriter
// that hold was making the thing that was already behind fall further behind the
// thing that had overtaken it. It is gone, and it is not what this replaces: the
// gate runs the other way round now — the paper is never held for the document,
// the document waits for the paper.
//
// THE CUE IS THE DEQUEUE ITSELF, and that is why this module is so small.
// `createRunFeed`'s `receive` pushes EVERY `ViewEvent` onto the reveal queue,
// `report` and `score` included, and since x11 an event that prints nothing
// costs the pump no time. So the feed already walks past the `report` event in
// stream order, at exactly the moment it has finished printing everything before
// it — which is that round's last beat. Nothing here counts events, compares
// clocks or is told a beat index: the feed says where it is, and REPORTS waits
// for the place its document belongs to.
//
// A shell-owned slot is what makes that legal, exactly as `shell/feed-clock.ts`
// is for the stamp and `shell/feed-drain.ts` is for the tail: `components/
// run-feed.ts` publishes, `windows/reports.ts` awaits, and neither reaches the
// other — a window may not reach a sibling (C8).
//
// Import-safe: no DOM, no timer, no wall-clock read, and no import at all.

/**
 * A place in the day the paper can be at.
 *
 * BOTH CARRY THE SITTING, and that is the whole of the re-run guard. The seam
 * types `report` with a ROUND (§5.2) and a day files seven of them, so round
 * numbers repeat every time the operator presses 파견 — a cue keyed on the round
 * alone would have yesterday's round 1 releasing today's round 1 the instant it
 * arrived, which is the exact defect this module exists to remove, restored on
 * the second day of every sitting. The run is the discriminator both ends
 * already hold: REPORTS pairs the report with the run its last `meta` named
 * (`windows/reports.ts`'s `sitting`), and the feed reads the same number off the
 * same `meta` as it applies it — in stream order, so the two cannot disagree
 * about which day a report belongs to.
 *
 * There is deliberately no cue for a `feed` line. What a caller wants to know is
 * "has the paper reached the thing my document is about", and the only documents
 * on this desk are a round's report and the day's record.
 */
export type FeedCue =
  | { at: 'report'; run: number; round: number }
  | { at: 'score'; run: number }

/** One cue, as the reached set and the waiter map key it. */
const keyOf = (cue: FeedCue): string =>
  cue.at === 'report' ? `report:${cue.run}:${cue.round}` : `score:${cue.run}`

/**
 * Has a fanfold ever spoken? See `feedReached` — this is what keeps a desk with
 * no LIVE FEED from hanging every document on the desk behind it.
 */
let mounted = false
const reached = new Set<string>()
const waiters = new Map<string, Set<() => void>>()

/**
 * A fanfold is on the desk and will report where it gets to.
 *
 * Called once, as the window is built and BEFORE it lays down its prefill, so
 * there is no window in which the feed exists and its cues are answered as
 * already-reached. Everything a caller can ask about is in the future at that
 * point, which is what makes the announcement safe to make so early.
 *
 * `publishFeedReached` sets the same flag, so a feed that somehow published
 * without announcing itself is still not mistaken for an absent one. The
 * separate call is for the gap that matters — mounted, but with nothing printed
 * yet, which is where the first report of the sitting lands.
 */
export function publishFeedMounted(): void {
  mounted = true
}

/**
 * The paper has printed everything up to and including `cue`.
 *
 * Published as the event is APPLIED, never as it arrives: the whole claim is
 * about what is on the page. `run-feed.ts` calls this from `apply` and from
 * nowhere else, which is what makes every flush path — a seek, reduced motion,
 * frozen animations, a halted desk, the mount-time prefill — release the cues
 * without any of them knowing this module exists. A `flush` is a run through
 * `apply`, so it is a run through here.
 *
 * A cue is reached ONCE and stays reached. A replayed stream that applies the
 * same `report` twice publishes the same key twice, and the second publication
 * is a no-op rather than a second round of resolutions.
 */
export function publishFeedReached(cue: FeedCue): void {
  mounted = true
  const key = keyOf(cue)
  if (reached.has(key)) return
  reached.add(key)
  const settled = waiters.get(key)
  if (settled === undefined) return
  // Taken and cleared before resolving, exactly as `feed-drain.ts` does it: a
  // waiter that re-arms from its own continuation must not land back in the set
  // this loop is walking.
  waiters.delete(key)
  for (const resolve of settled) resolve()
}

/** Whether the paper is already past `cue`, for a caller that wants it once. */
export function hasFeedReached(cue: FeedCue): boolean {
  return reached.has(keyOf(cue))
}

/**
 * Resolves when the feed has printed its way to `cue`.
 *
 * Resolves IMMEDIATELY when no feed has ever published, which is the property
 * that keeps this from being able to strand a document. Nothing guarantees a
 * `run-feed.ts` was ever mounted — the placeholder boot, a pack that failed to
 * fetch, a lane with the window closed — and none of those desks will ever reach
 * anything. A report that waited for a fanfold that does not exist would simply
 * never be readable, which is a worse failure than one that arrives early;
 * `feedDrained()` refuses the same hang for the same reason and says so at
 * length.
 *
 * Resolves immediately for a cue already reached, too, so a caller that arms
 * late is not left waiting on a publication that has already happened — the
 * ordinary case on every flushed desk, where the paper lands the whole day
 * before REPORTS has come back round to ask.
 */
export function feedReached(cue: FeedCue): Promise<void> {
  if (!mounted) return Promise.resolve()
  const key = keyOf(cue)
  if (reached.has(key)) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const held = waiters.get(key) ?? new Set<() => void>()
    held.add(resolve)
    waiters.set(key, held)
  })
}

/**
 * A page load is a new sitting — the slot is per-document, so tests reset it.
 *
 * NOT a product path, and the reason is the one `resetFeedDrain` records: this
 * drops waiters without waking them, so a desk that called it while a report was
 * gated would leave that document unrendered for the rest of the day. A real
 * page load builds the module fresh, and within one page load the run number in
 * every cue is what keeps two sittings apart (see `FeedCue`) — so there is
 * nothing for a desk to reset.
 */
export function resetFeedReach(): void {
  mounted = false
  reached.clear()
  waiters.clear()
}
