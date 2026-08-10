// [x11] the feed's drain — `shell/feed-drain.ts` — and the ending gate that
// waits on it.
//
// WHAT BREAKS IF THIS IS WRONG, and why it is worth a suite of its own. The day
// used to end by DUMPING: `run_end` arrived, `components/run-feed.ts` flushed
// its whole queue in one frame, and the veil came down on a fanfold that had
// just printed its tail all at once. The dump is gone (민서, 08-10 — "if the
// tail is still typing, nothing should stop it, not even the ending"), so the
// paper now finishes at its own pace and `shell/ending.ts` waits for it.
//
// That wait has two failure modes and BOTH are silent:
//
//  * it never ends. Nothing publishes zero — a feed that stops republishing, a
//    count left standing by a window that went away — and the walk sits there
//    for the rest of the sitting. No error, no log, no curtain: the operator
//    finishes a day, watches the record land, and is simply never told the
//    simulation is over. `installEnding` swallows exceptions by design, so a
//    hang produces even less noise than a throw would.
//  * it never happens. Somebody drops the `await`, or moves it behind the veil,
//    and the ending goes back to covering a tail mid-line — the exact thing the
//    change removed, and invisible to every suite that only reads the plate's
//    copy.
//
// Neither is catchable by `e2e/ending.spec.ts` without waiting out a real
// sitting, and a suite that can only fail by TIMING OUT is a suite nobody
// trusts. So the slot's contract is proved here directly, in `environment:
// 'node'` — the module is import-safe by construction, which is itself pinned
// below — and the ORDER inside `walkEnding` is proved structurally, the way
// `ending.test.ts` proves the frame seed it cannot mount.
import { beforeEach, describe, expect, it } from 'vitest'
import path from 'node:path'
import { SHELL_DIR, read, stripComments, tsFiles, rel } from './shell-utils.ts'
import {
  feedDrained,
  feedPending,
  publishFeedPending,
  resetFeedDrain,
} from '../../src/client/shell/feed-drain.ts'

const DRAIN_TS = path.join(SHELL_DIR, 'feed-drain.ts')
const ENDING_TS = path.join(SHELL_DIR, 'ending.ts')

/** Comments stripped, so a rule fires on code and never on the note above it. */
const code = (p: string): string => stripComments(read(p))

/**
 * A promise's settlement as a value a synchronous assertion can read.
 *
 * `expect(promise).resolves` can only prove the HAPPY half — a promise that
 * never settles fails it by timing out, which is the useless failure this suite
 * exists to avoid. Watching a flag lets "it is still waiting" be an assertion
 * that passes instantly and fails instantly.
 */
function watch(promise: Promise<void>): { settled: () => boolean; count: () => number } {
  let times = 0
  void promise.then(() => {
    times += 1
  })
  return { settled: () => times > 0, count: () => times }
}

/**
 * Let every queued microtask run.
 *
 * A macrotask and not a fixed number of `await Promise.resolve()`s: a resolution
 * can be several `.then` links deep, and a test that guessed the depth would
 * report "still waiting" for a promise that had merely not caught up yet — a
 * false GREEN in half these cases and a false RED in the other half.
 */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  // The slot is per-document and this file is one process — see `resetFeedDrain`.
  resetFeedDrain()
})

/* ══ 1 — the slot ═════════════════════════════════════════════════════════ */

describe('[x11] what the feed still owes', () => {
  it('(a) a desk with no fanfold owes nothing, and the waiter resolves at once', async () => {
    // THE HANG THAT MATTERS MOST, because it is the one an ordinary desk can
    // reach. Nothing guarantees a `run-feed.ts` was ever mounted: the placeholder
    // boot, a pack that failed to fetch, a lane with the window closed — none of
    // them publish a count, and an ending that waited for a first publication
    // from a window that does not exist would never raise its veil at all.
    //
    // So the opening state is DRAINED, not unknown. Arriving early is a
    // recoverable disappointment; never arriving is not.
    const drained = watch(feedDrained())
    await flush()
    expect(feedPending()).toBe(0)
    expect(drained.settled(), 'a desk with no feed hung the ending').toBe(true)
  })

  it('(b) it resolves on the transition to zero, and not before', async () => {
    publishFeedPending(3)
    const drained = watch(feedDrained())
    await flush()
    expect(drained.settled(), 'the ending stopped waiting while the paper was busy').toBe(false)

    // The backlog SHRINKING is not the paper stopping. Every one of these is a
    // published change and none of them is the one being waited for.
    for (const owed of [2, 1]) {
      publishFeedPending(owed)
      await flush()
      expect(drained.settled(), `a count of ${owed} was read as an empty queue`).toBe(false)
    }

    publishFeedPending(0)
    await flush()
    expect(drained.settled(), 'the ending never woke up').toBe(true)
  })

  it('(c) the backlog can be watched growing, which is why it is a count', async () => {
    // The slot publishes a NUMBER rather than a boolean because the feed already
    // knows the number, and a boolean would put "what counts as busy" in this
    // module instead of in the window that can see the queue.
    publishFeedPending(1)
    expect(feedPending()).toBe(1)
    publishFeedPending(9)
    expect(feedPending()).toBe(9)
    publishFeedPending(0)
    expect(feedPending()).toBe(0)
  })

  it('(d) every waiter is woken, and each of them exactly once', async () => {
    // More than one is not hypothetical even today: the walk arms one, and any
    // lane that installs the ending twice (`installEnding` is idempotent only in
    // its `raised` flag) arms a second on the same slot. A set that woke the
    // first and dropped the rest would strand a walk that had no way to notice.
    publishFeedPending(4)
    const waiters = [watch(feedDrained()), watch(feedDrained()), watch(feedDrained())]
    await flush()
    expect(waiters.map((w) => w.settled())).toEqual([false, false, false])

    publishFeedPending(0)
    await flush()
    expect(waiters.map((w) => w.settled())).toEqual([true, true, true])

    // A promise cannot resolve twice, so this is really a claim about the SET:
    // a second drain must not find yesterday's waiters still in it.
    publishFeedPending(2)
    publishFeedPending(0)
    await flush()
    expect(waiters.map((w) => w.count())).toEqual([1, 1, 1])
  })

  it('(e) a waiter that re-arms from its own continuation does not corrupt the set', async () => {
    // `publishFeedPending` TAKES AND CLEARS the set before it resolves anything,
    // so a waiter that asks again the moment it is woken lands in a fresh set
    // rather than in the one being walked.
    //
    // Stated honestly: through this module's public surface the re-arm is always
    // a microtask, because the only way to hold a waiter is a promise
    // continuation and those cannot run inside the loop that resolved them. The
    // take-and-clear is cheap insurance against a future writer resolving
    // synchronously — what a CALLER can observe is asserted here, and it is the
    // half that would actually be noticed: the second wait must be a real wait,
    // must survive the feed picking up again, and must fire on its own zero.
    publishFeedPending(2)
    let second: { settled: () => boolean; count: () => number } | null = null
    const first = watch(
      feedDrained().then(() => {
        // The feed is printing again before the re-arm — a real second day, or
        // the tail of a run the operator started over.
        publishFeedPending(5)
        second = watch(feedDrained())
      }),
    )

    publishFeedPending(0)
    await flush()
    expect(first.settled(), 'the first waiter never woke').toBe(true)
    expect(second, 'the continuation never ran').not.toBeNull()
    expect(second!.settled(), 'the re-armed waiter was resolved by the loop it joined').toBe(false)
    expect(feedPending()).toBe(5)

    publishFeedPending(0)
    await flush()
    expect(second!.settled(), 'the re-armed waiter was dropped instead of kept').toBe(true)
    expect(second!.count()).toBe(1)
    expect(first.count(), 'the first waiter fired twice').toBe(1)
  })

  it('(f) republishing the same count changes nothing either way', async () => {
    // The feed publishes on every change and the pump ticks on every frame, so
    // an unchanged count arriving twice is the ordinary case, not an edge.
    publishFeedPending(3)
    const drained = watch(feedDrained())
    publishFeedPending(3)
    await flush()
    expect(drained.settled()).toBe(false)

    publishFeedPending(0)
    publishFeedPending(0)
    await flush()
    expect(drained.count()).toBe(1)
  })

  it('(g) a waiter armed after the paper stopped resolves immediately', async () => {
    // The ending arms this AFTER the ledger's ~9 s count (see `walkEnding`), by
    // which time a short day's feed has usually finished on its own. That path
    // is the common one, not the exception, and it must not depend on one more
    // publication ever arriving.
    publishFeedPending(6)
    publishFeedPending(0)
    const drained = watch(feedDrained())
    await flush()
    expect(drained.settled()).toBe(true)
  })

  it('(h) a reset drops waiters WITHOUT waking them — tests only, never a desk', async () => {
    // Stated rather than assumed, because it is the one way this module can hang
    // a caller on purpose. `resetFeedDrain` exists because the slot is
    // per-document and a suite is one process; on a real page load the whole
    // module is new. A product path that called it while the ending was waiting
    // would silently throw the walk away.
    publishFeedPending(2)
    const drained = watch(feedDrained())
    resetFeedDrain()
    publishFeedPending(0)
    await flush()
    expect(feedPending()).toBe(0)
    expect(drained.settled()).toBe(false)
  })
})

/* ══ 2 — the slot is import-safe ══════════════════════════════════════════ */

describe('[x11] the drain is a slot, not a surface', () => {
  it('(a) it reads no DOM, owns no timer and never asks the wall clock', () => {
    // Its own header claims all three, and the claim is what lets this suite run
    // in `environment: 'node'` and lets `shell/ending.ts` import it above any
    // desk. `shell/feed-clock.ts` carries the same promise for the same reason.
    const src = code(DRAIN_TS)
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
      expect(src, `feed-drain.ts reaches for ${String(forbidden)}`).not.toMatch(forbidden)
    }
  })

  it('(b) it imports nothing at all', () => {
    // A slot both ends of a C8 seam talk to has no business having a dependency:
    // whatever it imported would become something `components/run-feed.ts` and
    // `shell/ending.ts` shared through it.
    expect(code(DRAIN_TS)).not.toMatch(/\bfrom\s*['"]/)
  })

  it('(c) inside the shell, only the ending waits on it', () => {
    // The publisher is the feed's window and the waiter is the curtain; neither
    // reaches the other (C8), which is the whole reason this module exists. A
    // second shell module waiting on the paper would be a new claim about who
    // the feed is pacing for, and should not arrive silently.
    const waiters = tsFiles(SHELL_DIR)
      .filter((f) => f !== DRAIN_TS)
      .filter((f) => /from\s+'\.\/feed-drain\.ts'/.test(code(f)))
      .map((f) => rel(f))
    expect(waiters).toEqual([rel(ENDING_TS)])
  })

  it('(d) the ending only READS the count — it never publishes or resets one', () => {
    // Same contract the ending keeps with the ledger it waits on
    // (`ending.test.ts` (f)): a curtain that wrote to the count would be deciding
    // when the paper was finished instead of being told.
    const src = code(ENDING_TS)
    expect(src).not.toMatch(/publishFeedPending/)
    expect(src).not.toMatch(/resetFeedDrain/)
  })
})

/* ══ 3 — the ending gate ══════════════════════════════════════════════════ */

describe('[x11] the ending waits for the tail', () => {
  /** `walkEnding`'s body, comments stripped — the whole of the ordering claim. */
  function walk(): string {
    const found = /async function walkEnding\b[\s\S]*?\n}/.exec(code(ENDING_TS))
    expect(found, 'walkEnding is gone — re-aim this guard at whatever replaced it').not.toBeNull()
    return found![0]
  }

  it('(a) it awaits the drain at all', () => {
    const src = walk()
    expect(src, 'the ending stopped waiting for the paper').toMatch(/await\s+feedDrained\s*\(\s*\)/)
  })

  it('(b) the drain sits between the ledger and the held beat', () => {
    // THE ORDER IS THE TEST, and each boundary is a different failure.
    //
    // BEFORE `ledgerLanded()` — the ending hangs. That wait is a
    // `MutationObserver` with no synchronous first look, deliberately (a `final`
    // already on the DOM belongs to an earlier day), so it must be armed while
    // the record is still `pending`. A drain that outlasted the ledger's own
    // count would arm the observer onto an attribute that had already reached
    // its last value, and the mutation it is waiting for would never come.
    //
    // AFTER `sleep(HELD_BEAT_MS)` — the beat is spent. HELD_BEAT_MS is not a
    // delay, it is a held frame: the finished number sitting alone on a desk
    // that has stopped moving. Burned while the fanfold was still printing, it
    // would buy no stillness at all and the veil would land on the same frame as
    // the tail's last line.
    const src = walk()
    const ledger = src.indexOf('ledgerLanded()')
    const drain = src.indexOf('feedDrained()')
    const beat = src.indexOf('HELD_BEAT_MS')
    const veil = src.lastIndexOf('raise(')
    expect(ledger, 'the ending no longer waits for the record').toBeGreaterThan(-1)
    expect(drain, 'the ending no longer waits for the paper').toBeGreaterThan(-1)
    expect(beat, 'the held beat is gone').toBeGreaterThan(-1)
    expect(drain, 'the drain was moved in front of the ledger observer').toBeGreaterThan(ledger)
    expect(beat, 'the held beat was moved in front of the drain').toBeGreaterThan(drain)
    expect(veil, 'the veil rises before the desk has finished').toBeGreaterThan(beat)
  })

  it('(c) the forced preview lane does NOT wait, and that is on purpose', () => {
    // `?ending=good|bad` skips the score, the ledger and the beat because there
    // is no day behind the plate. The drain is a wait of the same family: what
    // it protects is a record ENDING, and this lane has no last lines — it
    // interrupts a day that is still running, or one that was never started.
    // Queueing the review behind the fanfold's pacing would make the preview
    // wait on the one thing it exists not to wait for.
    const src = walk()
    const forced = /if\s*\(\s*forced\s*!==\s*null\s*\)\s*\{[\s\S]*?\n\s*\}/.exec(src)
    expect(forced, 'the forced lane is gone — re-aim this guard').not.toBeNull()
    expect(forced![0], 'the preview lane now queues behind the paper').not.toMatch(/feedDrained/)
  })
})

/* ══ 4 — what actually holds the boot's clock ═════════════════════════════ */

describe('[x11] the desk boots held, and a committed file is what starts it', () => {
  const BOOT_TS = path.join(SHELL_DIR, 'boot.ts')
  const AGENT_FILE_TS = path.join(SHELL_DIR, '../windows/agent-file.ts')

  it('(a) the boot sets one rate, and it is the hold', () => {
    // The note beside this line spent a while describing a ▶ the top bar has not
    // carried since W4 retired the ×1 / ×4 / pause controls with the unit that
    // owned them. The prose is corrected; this is the part of it a future edit
    // cannot quietly falsify.
    const rates = [...code(BOOT_TS).matchAll(/clock\.setRate\s*\(\s*(\d)\s*\)/g)].map((m) => m[1])
    expect(rates, 'the boot no longer holds the desk at 0').toEqual(['0'])
  })

  it('(b) the AGENT FILE is what takes the hold off', () => {
    // W4 — the press IS the start: a day is not a recording the operator scrubs,
    // it is something they commit a file to and then watch. If this moves, the
    // boot's note about what releases the clock has to move with it.
    const src = code(AGENT_FILE_TS)
    const start = /function startDay\b[\s\S]*?\n  \}/.exec(src)
    expect(start, 'startDay is gone — re-aim the boot`s note as well').not.toBeNull()
    expect(start![0]).toMatch(/clock\.setRate\s*\(\s*1\s*\)/)
  })
})
