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
// x10 (08-10) — …and the two callers now run it at DIFFERENT RATES, which is
// worth stating plainly because the paragraph above reads like a ban on exactly
// that. It is not: what would read as two machines is two ARITHMETICS — one
// surface pausing between 어절 while the other pauses between sentences, one
// settling on `done` and the other running off the end. The pace is a dial on
// one machine, and it is a dial because the handover is a file the operator is
// waiting to get their hands on rather than a transmission arriving, so it is
// read at a different speed by the same eye. `TypePace` below carries the dial;
// the model is still owned here and only here.
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
 * A pace: real milliseconds per character, and the pause between sentences.
 *
 * The PAIR is the model, and it is the whole model — a rate within a sentence
 * and a beat between two of them. That is what makes a run of sentences read as
 * separate utterances rather than one long string, and it is why the handover's
 * rows land one at a time.
 *
 * x10 — this is a TYPE now, and the two numbers below are one VALUE of it
 * (`READING_PACE`) rather than the only pace the arithmetic can be run at. The
 * reason is that two surfaces type on this desk and 민서 asked for one of them
 * to be quicker (the handover reveal — `components/slot-board.ts`), which is a
 * change to a rate and not to a model. The alternative was a second copy of the
 * arithmetic under different constants, and `windows/agent-file.ts`'s
 * `COVER_MS_PER_CHAR` note is the long argument for why that is only allowed
 * when the SHAPE differs too (the cover pauses between 어절, a beat this model
 * has no term for at all). "The same arithmetic at a different rate" does not
 * earn a second typewriter; it earns a parameter.
 */
export interface TypePace {
  /** Real milliseconds one character costs. */
  readonly msPerChar: number
  /** The pause after a sentence, before the next one opens. */
  readonly msBetween: number
}

/**
 * The desk's READING pace — the feed arriving at the speed a radio delivers it.
 *
 * Still the default of every function here, so a caller that says nothing is
 * paced exactly as it was before the parameter existed: `report-view.ts`, the
 * REPORT body replay, passes nothing and is untouched by x10.
 */
export const MS_PER_CHAR = 11
export const MS_BETWEEN = 130
export const READING_PACE: TypePace = { msPerChar: MS_PER_CHAR, msBetween: MS_BETWEEN }

/** How much elapsed time a cursor position already represents. */
function costOf(state: TypeState, lengths: readonly number[], pace: TypePace): number {
  let ms = 0
  for (let i = 0; i < state.sentence && i < lengths.length; i += 1) {
    ms += (lengths[i] ?? 0) * pace.msPerChar + pace.msBetween
  }
  return ms + state.chars * pace.msPerChar
}

/**
 * Advances the replay cursor by `elapsedMs`. Deterministic, monotonic, and it
 * settles on `done` instead of running past the last sentence ([u6#c2]).
 *
 * `pace` is the only thing a caller may vary. Everything else about a replay —
 * that it is a function of elapsed milliseconds, that it never runs past the
 * last sentence, that a large enough elapsed settles it instantly — is the same
 * whatever rate it is run at, which is the point of the parameter.
 */
export function typeCursor(
  state: TypeState,
  elapsedMs: number,
  lengths: readonly number[],
  pace: TypePace = READING_PACE,
): TypeState {
  if (state.done) return state
  if (lengths.length === 0) return { sentence: 0, chars: 0, done: true }

  let rest = costOf(state, lengths, pace) + Math.max(0, elapsedMs)
  for (let i = 0; i < lengths.length; i += 1) {
    const width = (lengths[i] ?? 0) * pace.msPerChar
    if (rest < width) return { sentence: i, chars: Math.floor(rest / pace.msPerChar), done: false }
    rest -= width
    if (rest < pace.msBetween) return { sentence: i, chars: lengths[i] ?? 0, done: false }
    rest -= pace.msBetween
  }
  return { sentence: lengths.length, chars: 0, done: true }
}

/** The whole cost of typing `lengths` out — what a caller waits for. */
export function typeDuration(lengths: readonly number[], pace: TypePace = READING_PACE): number {
  return lengths.reduce((ms, n) => ms + n * pace.msPerChar + pace.msBetween, 0)
}
