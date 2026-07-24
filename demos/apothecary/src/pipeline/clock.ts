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

/** Deterministic clock for tests: time only moves when advance() is called. */
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
 * Ceiling on callbacks drained by a single advance(), so a self-rescheduling
 * callback degrades into a capped run instead of hanging the test runner.
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
      while (drained < MAX_CALLBACKS_PER_ADVANCE) {
        const booking = nextDue(target);
        if (booking === null) break;
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
