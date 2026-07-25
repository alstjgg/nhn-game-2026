// Injected clock seam (PRD §3-3: every wait flows through an injected
// dependency). Game logic asks a Clock; it never reaches for host timing APIs
// itself. Tests drive a deterministic ManualClock, boot wires createRealClock —
// which is the ONLY function in the codebase allowed below the sentinel to
// touch host timing, and is fenced off at the bottom of this file.

/** Booking handle: idempotent, and a safe no-op once the callback has fired. */
export type CancelTimer = () => void;

export interface Clock {
  /** Milliseconds on this clock's own timeline (monotonic; origin unspecified). */
  now(): number;
  /**
   * Runs `cb` exactly once, `ms` milliseconds from now. A non-positive delay is
   * clamped so the callback fires as soon as the clock's time moves at all.
   */
  after(ms: number, cb: () => void): CancelTimer;
}

/**
 * Deterministic clock for tests: time only moves when advance() is called.
 *
 * DIVERGENCE FROM createRealClock (read this before racing a live result
 * against the deadline in a test): advance() fires every due booking's
 * callback SYNCHRONOUSLY and inline, in scheduling order. createRealClock's
 * callbacks run via the host's own delayed-timer primitive (see the bottom
 * of this file) — a macrotask, which the JS job queue always runs *after*
 * every microtask already queued at the moment the timer fires. A
 * ManualClock does not give that guarantee for free: if you resolve/reject
 * an adapter promise and then call advance() before that promise's `.then`
 * has had a turn to run, the deadline callback can fire first even though
 * the live result "arrived" first in wall-clock terms — an ordering the
 * browser can never produce. Tests exercising a race between a live result
 * and the deadline MUST `await` a microtask turn (e.g. `await flush()`)
 * after resolving/rejecting before calling advance(), or they can pin an
 * ordering production never sees. See the "N2 — production ordering" block
 * in tests/pipeline/prefetch.test.ts for a createRealClock-driven pin of the
 * actual guarantee this module relies on.
 */
export interface ManualClock extends Clock {
  /** Moves time forward by `ms`, firing every booking due at or before the target. */
  advance(ms: number): void;
  /** Lifetime total of bookings ever made (cancelled ones included). */
  readonly scheduled: number;
  /** Bookings still live: neither fired nor cancelled. */
  readonly pending: number;
}

interface Booking {
  due: number;
  seq: number;
  cb: () => void;
}

/**
 * Ceiling on callbacks drained by a single advance(). A well-behaved pipeline
 * never approaches this; it exists so a callback that keeps re-arming itself
 * (chain-scheduling forever inside the same window) fails LOUDLY instead of
 * hanging the test runner. Hitting the cap throws rather than degrading into
 * a silent capped run — a fake clock's whole job is to catch exactly this
 * class of bug, so going quiet here would defeat the point of it.
 */
const MAX_CALLBACKS_PER_ADVANCE = 10_000;

export function createManualClock(start = 0): ManualClock {
  let current = start;
  let seq = 0;
  let lifetime = 0;
  let bookings: Booking[] = [];

  const drop = (booking: Booking): void => {
    bookings = bookings.filter((b) => b !== booking);
  };

  /** Earliest booking due at or before `limit`; ties break on scheduling order. */
  const nextDue = (limit: number): Booking | null => {
    let best: Booking | null = null;
    for (const booking of bookings) {
      if (booking.due > limit) continue;
      if (best === null || booking.due < best.due || (booking.due === best.due && booking.seq < best.seq)) {
        best = booking;
      }
    }
    return best;
  };

  return {
    now: () => current,

    after(ms: number, cb: () => void): CancelTimer {
      const booking: Booking = { due: current + Math.max(0, ms), seq: seq++, cb };
      lifetime++;
      bookings.push(booking);
      return () => drop(booking);
    },

    advance(ms: number): void {
      const target = current + Math.max(0, ms);
      let drained = 0;
      for (;;) {
        const booking = nextDue(target);
        if (booking === null) break;
        if (drained === MAX_CALLBACKS_PER_ADVANCE) {
          throw new Error(
            `ManualClock.advance() drained ${MAX_CALLBACKS_PER_ADVANCE} callbacks without settling — runaway rescheduling?`,
          );
        }
        drop(booking);
        if (booking.due > current) current = booking.due;
        drained++;
        booking.cb(); // may chain another booking inside this same window
      }
      if (target > current) current = target;
    },

    get scheduled(): number {
      return lifetime;
    },

    get pending(): number {
      return bookings.length;
    },
  };
}

// >>> REAL-CLOCK BOUNDARY <<<
// Everything below is the single seam allowed to touch host timing APIs.
// Nothing above this line may, and nothing else in src/pipeline may either —
// the AC2 source scan enforces both halves of that rule.

export function createRealClock(): Clock {
  return {
    now: () => Date.now(),

    after(ms: number, cb: () => void): CancelTimer {
      const id = setTimeout(cb, Math.max(0, ms));
      let live = true;
      return () => {
        if (!live) return;
        live = false;
        clearTimeout(id);
      };
    },
  };
}
