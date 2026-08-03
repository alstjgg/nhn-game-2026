/**
 * The beat module's magic numbers, all of them, in one file.
 *
 * Design D-G: a bare numeral may appear in exactly one source file under
 * `src/engine/beat/`, and this is that file. Everything else imports from
 * here — which is why `clock.ts` does not spell out how many minutes an hour
 * holds either.
 */

/**
 * How many timeline lines Call 1 and Call 2 may carry (engine spec §3.2).
 * The window never severs a beat: a beat is included whole or dropped whole,
 * so a beat that alone exceeds the cap is still emitted whole.
 */
export const TIMELINE_CAP_LINES = 6

/** Minutes in one hour — `clock.ts` folds `HH:MM` into a sortable count. */
export const MINUTES_PER_HOUR = 60
