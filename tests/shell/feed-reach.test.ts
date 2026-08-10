// [x12] where the paper has GOT TO — `shell/feed-reach.ts`, the publisher in
// `components/run-feed.ts`, and the two windows that wait on it.
//
// WHAT BREAKS IF THIS IS WRONG. Since x11 the fanfold TYPES its lines and paces
// them, so it reaches a round's report tens of seconds after the seam emits it.
// `windows/reports.ts` subscribed straight to the driver, so the write-up typed
// itself — and the terminal record began counting — while the paper was still
// printing the beats they describe: the day's outcome above a fanfold still
// printing what caused it. The gate closes that, and it has two failure modes,
// both silent:
//
//  * IT NEVER OPENS. Nobody publishes the cue — no LIVE FEED was ever mounted,
//    the run number on one side does not match the other, a flush path lands the
//    paper without going through `apply` — and the day's report is simply never
//    readable. No error, no log: a window that stays blank.
//  * IT OPENS EARLY, or does not close at all. A cue keyed without its sitting
//    lets yesterday's round 1 release today's; a wait dropped from the arrival
//    path puts the document back in front of its own beats. Neither is visible
//    to a suite that only reads what the document eventually says.
//
// Neither is catchable from `e2e/reports.spec.ts` without waiting out a real
// day's paper, and a suite that can only fail by TIMING OUT is a suite nobody
// trusts. So the slot's contract is proved here directly in `environment:
// 'node'` — the module is import-safe by construction, which is itself pinned
// below — and the wiring at both ends is proved structurally, exactly as
// `feed-drain.test.ts` proves the order inside `walkEnding`.
import { beforeEach, describe, expect, it } from 'vitest'
import path from 'node:path'
import { CLIENT, SHELL_DIR, read, rel, stripComments, tsFiles } from './shell-utils.ts'
import {
  feedReached,
  hasFeedReached,
  publishFeedMounted,
  publishFeedReached,
  resetFeedReach,
} from '../../src/client/shell/feed-reach.ts'

const REACH_TS = path.join(SHELL_DIR, 'feed-reach.ts')
const RUN_FEED_TS = path.join(CLIENT, 'components/run-feed.ts')
const REPORTS_TS = path.join(CLIENT, 'windows/reports.ts')
const AGENT_FILE_TS = path.join(CLIENT, 'windows/agent-file.ts')

/** Comments stripped, so a rule fires on code and never on the note above it. */
const code = (p: string): string => stripComments(read(p))

/** A named `const <name> = …` arrow body, at the indentation the file uses. */
function block(source: string, opener: string, indent = '  '): string {
  const found = new RegExp(`${opener}[\\s\\S]*?\\n${indent}\\}`).exec(source)
  expect(found, `${opener} is gone — re-aim this guard at whatever replaced it`).not.toBeNull()
  return found![0]
}

/**
 * A promise's settlement as a value a synchronous assertion can read — the same
 * device `feed-drain.test.ts` uses, and for the same reason: "it is still
 * waiting" has to be an assertion that passes instantly, not one that times out.
 */
function watch(promise: Promise<void>): { settled: () => boolean; count: () => number } {
  let times = 0
  void promise.then(() => {
    times += 1
  })
  return { settled: () => times > 0, count: () => times }
}

/** Let every queued microtask run — a macrotask, never a guessed `.then` depth. */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  // The slot is per-document and this file is one process — see `resetFeedReach`.
  resetFeedReach()
})

/* ══ 1 — the slot ═════════════════════════════════════════════════════════ */

describe('[x12] what the feed has reached', () => {
  it('(a) a desk with no fanfold has reached everything, and the waiter resolves at once', async () => {
    // THE HANG THAT MATTERS MOST, because it is the one an ordinary desk can
    // reach. Nothing guarantees a `run-feed.ts` was ever mounted — the
    // placeholder boot, a pack that failed to fetch, a lane with the window
    // closed — and a desk with no paper will never reach anything at all. A
    // report gated behind one would never be readable.
    //
    // Arriving early is a recoverable disappointment; never arriving is not, and
    // `feedDrained()` refuses the same hang for the same reason.
    const waiting = watch(feedReached({ at: 'report', run: 3, round: 1 }))
    const scored = watch(feedReached({ at: 'score', run: 3 }))
    await flush()
    expect(waiting.settled(), 'a desk with no feed hung the day’s report').toBe(true)
    expect(scored.settled(), 'a desk with no feed hung the terminal record').toBe(true)
  })

  it('(b) once a fanfold is on the desk, a cue is a real wait', async () => {
    publishFeedMounted()
    const waiting = watch(feedReached({ at: 'report', run: 3, round: 1 }))
    await flush()
    expect(waiting.settled(), 'the report drew before the paper reached it').toBe(false)
    expect(hasFeedReached({ at: 'report', run: 3, round: 1 })).toBe(false)

    // A DIFFERENT cue is not this one. The paper walking past round 2 says
    // nothing about round 1, and the day's score is not a round at all.
    publishFeedReached({ at: 'report', run: 3, round: 2 })
    publishFeedReached({ at: 'score', run: 3 })
    await flush()
    expect(waiting.settled(), 'another cue released this one').toBe(false)

    publishFeedReached({ at: 'report', run: 3, round: 1 })
    await flush()
    expect(waiting.settled(), 'the report never landed').toBe(true)
    expect(hasFeedReached({ at: 'report', run: 3, round: 1 })).toBe(true)
  })

  it('(c) the SITTING is part of the cue — yesterday’s round 1 does not release today’s', async () => {
    // THE RE-RUN GUARD, and the reason `FeedCue` carries a run at all. The seam
    // types `report` with a ROUND and a day files seven of them, so the numbers
    // repeat every time the operator presses 파견. Keyed on the round alone, the
    // second day's round 1 would find yesterday's cue already reached and draw
    // in the frame it arrived — the exact defect this module removes, restored
    // on every sitting after the first.
    publishFeedMounted()
    publishFeedReached({ at: 'report', run: 3, round: 1 })
    publishFeedReached({ at: 'score', run: 3 })

    const next = watch(feedReached({ at: 'report', run: 4, round: 1 }))
    const record = watch(feedReached({ at: 'score', run: 4 }))
    await flush()
    expect(next.settled(), 'a stale cue released the new day’s report').toBe(false)
    expect(record.settled(), 'a stale cue started the new day’s count-up').toBe(false)

    publishFeedReached({ at: 'report', run: 4, round: 1 })
    await flush()
    expect(next.settled()).toBe(true)
    expect(record.settled(), 'the round released the day’s record').toBe(false)
  })

  it('(d) a report cue and a score cue of one sitting are different places', async () => {
    // They are the same `run`, and the paper reaches them at different moments —
    // every report first, the score last. A key that collapsed them would start
    // the record's count-up on the day's first round.
    publishFeedMounted()
    publishFeedReached({ at: 'report', run: 3, round: 1 })
    expect(hasFeedReached({ at: 'score', run: 3 })).toBe(false)
    publishFeedReached({ at: 'score', run: 3 })
    expect(hasFeedReached({ at: 'score', run: 3 })).toBe(true)
  })

  it('(e) every waiter on a cue is woken, and each of them exactly once', async () => {
    // More than one is the ordinary case, not an edge: REPORTS waits on the
    // score for the count-up and the AGENT FILE waits on the same cue to start
    // the settle it derives from that count (`windows/agent-file.ts`). A set that
    // woke the first and dropped the rest would strand the desk's turn.
    publishFeedMounted()
    const waiters = [
      watch(feedReached({ at: 'score', run: 3 })),
      watch(feedReached({ at: 'score', run: 3 })),
      watch(feedReached({ at: 'score', run: 3 })),
    ]
    await flush()
    expect(waiters.map((w) => w.settled())).toEqual([false, false, false])

    publishFeedReached({ at: 'score', run: 3 })
    await flush()
    expect(waiters.map((w) => w.settled())).toEqual([true, true, true])

    // A promise cannot resolve twice, so this is a claim about the SET: a
    // republished cue must not find yesterday's waiters still in it.
    publishFeedReached({ at: 'score', run: 3 })
    await flush()
    expect(waiters.map((w) => w.count())).toEqual([1, 1, 1])
  })

  it('(f) a waiter that re-arms from its own continuation does not corrupt the set', async () => {
    // `publishFeedReached` TAKES AND CLEARS the cue's waiters before it resolves
    // any of them, so a caller that asks for the next cue the moment it is woken
    // lands in a fresh set rather than in the one being walked. That is exactly
    // what `windows/reports.ts` does: its arrival queue chains one wait off the
    // last one's continuation, so this is the shape of every day after round 1.
    publishFeedMounted()
    let second: { settled: () => boolean; count: () => number } | null = null
    const first = watch(
      feedReached({ at: 'report', run: 3, round: 1 }).then(() => {
        second = watch(feedReached({ at: 'report', run: 3, round: 2 }))
      }),
    )

    publishFeedReached({ at: 'report', run: 3, round: 1 })
    await flush()
    expect(first.settled(), 'the first waiter never woke').toBe(true)
    expect(second, 'the continuation never ran').not.toBeNull()
    expect(second!.settled(), 'the re-armed waiter was resolved by the cue it chained off').toBe(false)

    publishFeedReached({ at: 'report', run: 3, round: 2 })
    await flush()
    expect(second!.settled(), 'the re-armed waiter was dropped instead of kept').toBe(true)
    expect(second!.count()).toBe(1)
    expect(first.count(), 'the first waiter fired twice').toBe(1)
  })

  it('(g) a waiter armed after the paper passed the cue resolves immediately', async () => {
    // THE ORDINARY CASE ON EVERY FLUSHED DESK. Reduced motion, frozen
    // animations, a seek and a halted clock all land the whole queue in one
    // call, so the feed is usually past the cue before the window that wants it
    // has come back round to ask.
    publishFeedMounted()
    publishFeedReached({ at: 'report', run: 3, round: 1 })
    const waiting = watch(feedReached({ at: 'report', run: 3, round: 1 }))
    await flush()
    expect(waiting.settled()).toBe(true)
  })

  it('(h) a publication from a feed that never announced itself still counts', async () => {
    // The announcement and the cues are two calls, so they can be got out of
    // order by an edit. A feed that published without announcing must not leave
    // the slot looking absent — that would answer every UNREACHED cue as reached
    // and release the very documents this gate holds.
    publishFeedReached({ at: 'report', run: 3, round: 1 })
    const later = watch(feedReached({ at: 'report', run: 3, round: 2 }))
    await flush()
    expect(later.settled(), 'a publishing feed was read as an absent one').toBe(false)
  })

  it('(i) a reset drops waiters WITHOUT waking them — tests only, never a desk', async () => {
    // Stated rather than assumed, because it is the one way this module can hang
    // a caller on purpose. `resetFeedReach` exists because the slot is
    // per-document and a suite is one process; on a real page load the whole
    // module is new, and within one page load the run in every cue is what keeps
    // two sittings apart — so a desk has nothing to reset.
    publishFeedMounted()
    const waiting = watch(feedReached({ at: 'report', run: 3, round: 1 }))
    resetFeedReach()
    publishFeedReached({ at: 'report', run: 3, round: 1 })
    await flush()
    expect(waiting.settled()).toBe(false)
  })
})

/* ══ 2 — the slot is import-safe, and who is on each end ══════════════════ */

describe('[x12] the reach is a slot, not a surface', () => {
  it('(a) it reads no DOM, owns no timer and never asks the wall clock', () => {
    // Its own header claims all three, and the claim is what lets this suite run
    // in `environment: 'node'`. `shell/feed-clock.ts` and `shell/feed-drain.ts`
    // carry the same promise for the same reason.
    const src = code(REACH_TS)
    for (const forbidden of [
      /\bdocument\b/,
      /\bwindow\b/,
      /\bsetTimeout\s*\(/,
      /\bsetInterval\s*\(/,
      /requestAnimationFrame/,
      /\bDate\.now\s*\(/,
      /\bnew Date\s*\(/,
      /performance\.now/,
    ]) {
      expect(src, `feed-reach.ts reaches for ${String(forbidden)}`).not.toMatch(forbidden)
    }
  })

  it('(b) it imports nothing at all', () => {
    // A slot both ends of a C8 seam talk to has no business having a dependency:
    // whatever it imported would become something the feed and the two windows
    // shared through it.
    expect(code(REACH_TS)).not.toMatch(/\bfrom\s*['"]/)
  })

  it('(c) inside the shell, nothing waits on it — the ends are a component and two windows', () => {
    // The publisher is the LIVE FEED's fanfold and the waiters are the windows
    // whose documents describe what it prints; neither reaches the other (C8),
    // which is the whole reason this module exists. A SHELL module waiting on
    // the paper would be a new claim about who the feed is pacing for and should
    // not arrive silently — the ending already has its own slot for the tail.
    const shellWaiters = tsFiles(SHELL_DIR)
      .filter((f) => f !== REACH_TS)
      .filter((f) => /from\s+'\.\/feed-reach\.ts'/.test(code(f)))
      .map((f) => rel(f))
    expect(shellWaiters).toEqual([])

    const readers = tsFiles(CLIENT)
      .filter((f) => f !== REACH_TS)
      .filter((f) => /from\s+'\.\.\/shell\/feed-reach\.ts'/.test(code(f)))
      .map((f) => rel(f))
      .sort()
    expect(readers).toEqual([rel(RUN_FEED_TS), rel(AGENT_FILE_TS), rel(REPORTS_TS)].sort())
  })

  it('(d) the waiters only READ — neither window publishes a cue or resets the slot', () => {
    // Same contract the ending keeps with the count it waits on
    // (`feed-drain.test.ts` (d)): a window that wrote to this slot would be
    // deciding where the paper had got to instead of being told.
    for (const waiter of [REPORTS_TS, AGENT_FILE_TS]) {
      const src = code(waiter)
      expect(src, `${rel(waiter)} publishes a cue`).not.toMatch(/publishFeedReached|publishFeedMounted/)
      expect(src, `${rel(waiter)} resets the slot`).not.toMatch(/resetFeedReach/)
    }
  })
})

/* ══ 3 — the publisher ════════════════════════════════════════════════════ */

describe('[x12] the fanfold publishes where it has printed to', () => {
  it('(a) every cue is published from `apply`, which is what makes a flush release them', () => {
    // THE LOAD-BEARING STRUCTURAL CLAIM. `flush()` is a run through `apply`, so
    // a seek, reduced motion, frozen animations, a halted desk and the
    // mount-time prefill all land the cues with the lines they belong to —
    // without any of those paths knowing the slot exists. Publish from `receive`
    // instead and the gate opens on ARRIVAL, which is the bug; publish from the
    // pump alone and every flush path strands whatever was waiting.
    const src = code(RUN_FEED_TS)
    const apply = block(src, 'const apply = ')
    const published = [...src.matchAll(/publishFeedReached\(/g)].length
    const inApply = [...apply.matchAll(/publishFeedReached\(/g)].length
    expect(inApply, 'the cues are gone from `apply`').toBe(2)
    expect(published, 'a cue is published outside `apply` — some flush path will not release it').toBe(inApply)
    expect(block(src, 'const receive = '), 'the cue moved back onto arrival').not.toMatch(/publishFeedReached/)
    // …and the flush really does go through `apply`, rather than emptying the
    // queue some other way.
    expect(block(src, 'const flush = '), 'the flush stopped applying what it drops').toMatch(/apply\(/)
  })

  it('(b) both places the paper can be reached are published', () => {
    const apply = block(code(RUN_FEED_TS), 'const apply = ')
    expect(apply, 'the round’s report is no longer announced').toMatch(/at: 'report'/)
    expect(apply, 'the day’s score is no longer announced').toMatch(/at: 'score'/)
    // Every cue carries the sitting — see the slot's own (c).
    for (const cue of [...apply.matchAll(/publishFeedReached\(\{([^}]*)\}/g)]) {
      expect(cue[1], `a cue was published without its sitting: ${cue[0]}`).toMatch(/\brun\b/)
    }
  })

  it('(c) the run a cue carries is the one the paper has APPLIED, never the one that arrived', () => {
    // A queued report belongs to the day whose `meta` the paper has already got
    // past. Read off an arrival and a report still queued from yesterday would
    // be announced under today's run — a cue nobody is waiting for, and a day
    // that never draws.
    const apply = block(code(RUN_FEED_TS), 'const apply = ')
    expect(apply, 'the applied run is no longer tracked').toMatch(/run = event\.run/)
  })

  it('(d) the fanfold announces itself before it lays down its prefill', () => {
    // The slot answers every cue as reached until a feed says it exists, so a
    // window in which this window is mounted and its cues are answered for an
    // absent one is a window in which the first report of the sitting draws
    // early. The announcement is above the prefill; the prefill is what publishes
    // the first cues.
    const src = code(RUN_FEED_TS)
    const mounted = src.indexOf('publishFeedMounted()')
    const prefill = src.indexOf('driver.frame().events')
    const subscribe = src.indexOf('driver.subscribe(receive)')
    expect(mounted, 'nothing announces the fanfold — every cue answers as reached').toBeGreaterThan(-1)
    expect(prefill, 'the prefill is gone — re-aim this guard').toBeGreaterThan(-1)
    expect(mounted, 'the announcement fell behind the prefill').toBeLessThan(prefill)
    expect(mounted, 'the announcement fell behind the subscription').toBeLessThan(subscribe)
  })

  it('(e) the report hold is gone, and nothing holds the paper for a document again', () => {
    // `REPORT_HOLD_MS = 9000` stopped the FANFOLD while a report typed. Once the
    // paper became a typewriter that was holding the surface which was already
    // behind, for the benefit of the one that had overtaken it — and the gate
    // replaced it rather than joining it: a hold is the paper waiting for the
    // document, the gate is the document waiting for the paper, and both at once
    // is two surfaces each waiting for the other.
    const src = code(RUN_FEED_TS)
    expect(src, 'the report hold is back — it would deepen the very lag the gate closes').not.toMatch(
      /REPORT_HOLD|holdMs/,
    )
  })
})

/* ══ 4 — the waiters ══════════════════════════════════════════════════════ */

describe('[x12] the arriving document waits for the paper', () => {
  it('(a) the report that ARRIVES is gated, and the whole of it is', () => {
    // Filing the round early and drawing it late would leave the two out of
    // step, and a rail reconcile in between reaches `drawDocument()` — which
    // would paint a round the paper has not printed the beats of, defeating the
    // gate by the one path that does not go through it. So the round is filed
    // inside the wait, not before it.
    const src = code(REPORTS_TS)
    expect(src, 'the arrival queue is gone').toMatch(/const afterPaper = /)
    const gate = /afterPaper\(\{ at: 'report'[\s\S]*?\n {4}\}\)/.exec(src)
    expect(gate, 'the arriving report is no longer gated on the paper').not.toBeNull()
    for (const owned of ['rounds.set(', 'filed.set(', 'view.append(', 'sync()']) {
      expect(gate![0], `${owned} was lifted out of the wait`).toContain(owned)
    }
  })

  it('(b) the terminal record mounts on the event and COUNTS on the paper', () => {
    // The record is on the desk the moment the day closes — `open()` leaves it
    // `pending`, which is the waiting state — and the count-up runs when the
    // fanfold reaches the same `score` it mints the 집계 line from. The two are
    // one count, printed twice.
    const src = code(REPORTS_TS)
    const scored = /if \(event\.type === 'score'\) \{[\s\S]*?\n {6}return\n {4}\}/.exec(src)
    expect(scored, 'the score branch is gone — re-aim this guard').not.toBeNull()
    expect(scored![0], 'the record no longer mounts when the day closes').toMatch(/tally\.open\(\)/)
    expect(scored![0], 'the count-up no longer waits for the paper').toMatch(
      /afterPaper\(\{ at: 'score'[\s\S]*?tally\.run\(/,
    )
    // The MODEL is built on the event. By the time the paper catches up the desk
    // may be on the next sitting, and a model read late would score this day's
    // event against whatever `run` had become.
    expect(scored![0], 'the record’s model is built inside the wait').toMatch(/=\s*scoreModel\(event\)/)
  })

  it('(c) the ARCHIVE and the RAIL wait for nothing', () => {
    // A report already filed, one the operator picks off the rail, a document
    // redrawn because the rail reconciled — all of them draw synchronously. What
    // the gate protects is the ORDER two surfaces say a thing in, and a document
    // being re-read has no order left to protect.
    const src = code(REPORTS_TS)
    for (const owner of ['function drawDocument', 'function sync', 'function mountRecord']) {
      const body = new RegExp(`${owner}[\\s\\S]*?\\n {2}\\}`).exec(src)?.[0] ?? ''
      expect(body, `${owner} is gone`).not.toBe('')
      expect(body, `${owner} now queues behind the fanfold`).not.toMatch(/afterPaper|feedReached/)
    }
    const select = /onSelect: \([\s\S]*?\n {4}\}/.exec(src)?.[0] ?? ''
    expect(select, 'the rail’s select handler is gone').not.toBe('')
    expect(select, 'selecting a past day now waits on the paper').not.toMatch(/afterPaper|feedReached/)
  })

  it('(d) the AGENT FILE’s settle timer starts on the count-up, not on the event', () => {
    // It derives `counted` from wall-clock time since the record began counting
    // (design #4 — no cross-window callback). The count-up now starts when the
    // paper reaches the `score`, so a timer still started off the EVENT would
    // release the settle — turning the page and unlocking NEW RUN — with the
    // record still blank beside it.
    const src = code(AGENT_FILE_TS)
    const armed = /if \(state\.score !== null && !scoreSeen\) \{[\s\S]*?\n {4}\}/.exec(src)
    expect(armed, 'the count timer is gone — re-aim this guard').not.toBeNull()
    expect(armed![0], 'the settle timer no longer waits for the paper').toMatch(
      /feedReached\(\{ at: 'score'[\s\S]*?setTimeout\(/,
    )
  })
})
