// u17 — how long the composed run lets a human LOOK at things (PRD §1-3, §7).
//
// The run has always been event-driven: a beat happens because the composition asked
// for one, never because a clock fired (INV-6). That is what makes the automated gate
// deterministic — and it is also why the fast gate boot finishes a whole run in seconds,
// which is exactly the property §1-3's "3–5 minutes" rule is NOT about.
//
// So the pace is a PROFILE, chosen once at boot and threaded down:
//
//   · TEST_PACE     — every hold is zero. `?gate=1`, vitest, every other spec.
//   · defaultPace() — the authored walk read plus a readable hold per bubble. What a
//                     judge sees at `/`, and the only boot §1-3 can be timed on.
//
// A hold is a Web Animation on a real element, never a `setTimeout`: the same device
// `transition.ts` already uses, so `src/ai/stub.ts` stays the only module in `src/**`
// that arms a timer (INV-6). Nothing here decides a rule — a hold that cannot play
// resolves anyway, so a run never stops because a frame was dropped (INV-7).

import type { Tuning } from '../data/schema.ts';

/**
 * How long one decision bubble stays on screen before the next unit speaks.
 *
 * Motion design in the same register as `transition.ts`'s arrival/outcome beats, not
 * balance: no rule reads it, and zeroing it changes nothing but the clock. It is the
 * dominant term in §1-3's run length — a fight is a column of bubbles, and this is how
 * long each one is readable.
 */
const READABLE_BEAT_MS = 1450;

export interface PaceProfile {
  /** Held on the 전진 screen after the party arrives, before the tile takes the slot. */
  readonly arrivalHoldMs: number;
  /** Held after each combat bubble lands. */
  readonly beatHoldMs: number;
}

/** Every hold zeroed — the deterministic boot every spec but the pacing gate uses. */
export const TEST_PACE: PaceProfile = { arrivalHoldMs: 0, beatHoldMs: 0 };

/** The authored pace: `walk.durationMs` for the walk, a readable hold per bubble. */
export function defaultPace(tuning: Tuning): PaceProfile {
  return { arrivalHoldMs: tuning.walk.durationMs, beatHoldMs: READABLE_BEAT_MS };
}

/**
 * Waits `durationMs` by playing a no-op animation on `element`. Zero (or less) is not a
 * wait at all — it resolves without giving up the task, so the fast gate keeps its
 * frame-exact determinism.
 */
export function hold(element: HTMLElement, durationMs: number): Promise<void> {
  if (durationMs <= 0) return Promise.resolve();
  const animation = element.animate([{ opacity: 1 }, { opacity: 1 }], {
    duration: durationMs,
    fill: 'none',
  });
  return animation.finished.then(
    () => undefined,
    () => undefined,
  );
}
