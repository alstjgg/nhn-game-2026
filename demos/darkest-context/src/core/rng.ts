// Seeded RNG core (PRD §2.2 / invariant 6).
//
// Randomness in this demo is confined to tie-breaking, and every draw comes from
// an Rng created here. The seed is drawn once at run start and kept in run state,
// so one run stays reproducible: same seed ⇒ same stream ⇒ same tie resolutions.
//
// Algorithm: mulberry32. It is pinned by a hardcoded sequence in
// tests/core/rng.test.ts — swapping it silently is a build failure.

/** A seeded pseudo-random source. Deterministic per seed, with observable draw accounting. */
export interface Rng {
  /** The uint32 seed this stream was created from. */
  readonly seed: number;
  /** How many values have been drawn so far (next() and nextInt() each count 1). */
  readonly draws: number;
  /** Next value in [0, 1). */
  next(): number;
  /** Next integer in [0, maxExclusive) — exactly one draw, no rejection sampling. */
  nextInt(maxExclusive: number): number;
}

/**
 * Creates a seeded stream. Any integer seed is accepted and normalised to uint32,
 * so a XOR-perturbed seed (which may go negative in int32) needs no caller handling.
 *
 * @throws RangeError if the seed is not an integer.
 */
export function createRng(seed: number): Rng {
  if (!Number.isInteger(seed)) {
    throw new RangeError(`createRng: seed must be an integer, got ${seed}`);
  }
  const normalised = seed >>> 0;
  let state = normalised;
  let draws = 0;

  const next = (): number => {
    draws++;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (maxExclusive: number): number => {
    // Validate before drawing: a rejected call must not perturb the stream.
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
      throw new RangeError(`nextInt: maxExclusive must be an integer >= 1, got ${maxExclusive}`);
    }
    return Math.floor(next() * maxExclusive);
  };

  return Object.freeze({
    get seed(): number {
      return normalised;
    },
    get draws(): number {
      return draws;
    },
    next,
    nextInt,
  });
}

/**
 * The single entropy entry point of this demo (invariant 6): the ONLY place
 * `Math.random` may appear anywhere under `src/**` — enforced by
 * tests/core/no-math-random.test.ts. Everything downstream takes an injected Rng.
 *
 * @returns a uint32 seed — JSON-safe, printable, storable in run state.
 */
export function createSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}
