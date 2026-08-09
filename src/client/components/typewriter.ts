// The desk's typewriter — how fast paper fills with characters, and where a
// replay has got to.
//
// H3 (08-09) — extracted from `components/report-view.ts`, which owned this
// outright while it was the only surface that typed. It is not any more: the
// AGENT FILE's handover reveals itself the same way when the day settles
// (`components/slot-board.ts`), and two typewriters on one desk running at
// different speeds would read as two different machines. So the arithmetic has
// one owner and both callers import it.
//
// Pure by construction: no DOM, no timer, no wall-clock read. A cursor is a
// function of ELAPSED MILLISECONDS and the lengths it is typing, which is what
// lets the whole thing be proved under vitest's `environment: 'node'` and what
// lets a caller settle it instantly by handing it a large enough elapsed.

/** Where a replay has got to. `sentence === lengths.length` ⇒ finished. */
export interface TypeState {
  sentence: number
  chars: number
  done: boolean
}

/** The replay's opening position — nothing painted yet. */
export const TYPE_START: TypeState = { sentence: 0, chars: 0, done: false }

/**
 * Real milliseconds per character, and the pause between sentences.
 *
 * These are the reading pace of the desk and they are deliberately shared. The
 * pause is what makes a run of sentences read as separate utterances rather
 * than one long string, and it is why the handover's rows land one at a time.
 */
export const MS_PER_CHAR = 11
export const MS_BETWEEN = 130

/** How much elapsed time a cursor position already represents. */
function costOf(state: TypeState, lengths: readonly number[]): number {
  let ms = 0
  for (let i = 0; i < state.sentence && i < lengths.length; i += 1) {
    ms += (lengths[i] ?? 0) * MS_PER_CHAR + MS_BETWEEN
  }
  return ms + state.chars * MS_PER_CHAR
}

/**
 * Advances the replay cursor by `elapsedMs`. Deterministic, monotonic, and it
 * settles on `done` instead of running past the last sentence ([u6#c2]).
 */
export function typeCursor(
  state: TypeState,
  elapsedMs: number,
  lengths: readonly number[],
): TypeState {
  if (state.done) return state
  if (lengths.length === 0) return { sentence: 0, chars: 0, done: true }

  let rest = costOf(state, lengths) + Math.max(0, elapsedMs)
  for (let i = 0; i < lengths.length; i += 1) {
    const width = (lengths[i] ?? 0) * MS_PER_CHAR
    if (rest < width) return { sentence: i, chars: Math.floor(rest / MS_PER_CHAR), done: false }
    rest -= width
    if (rest < MS_BETWEEN) return { sentence: i, chars: lengths[i] ?? 0, done: false }
    rest -= MS_BETWEEN
  }
  return { sentence: lengths.length, chars: 0, done: true }
}

/** The whole cost of typing `lengths` out — what a caller waits for. */
export function typeDuration(lengths: readonly number[]): number {
  return lengths.reduce((ms, n) => ms + n * MS_PER_CHAR + MS_BETWEEN, 0)
}
