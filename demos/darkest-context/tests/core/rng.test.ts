// u3 — seeded RNG core (TDD-Red). Covers AC4 + AC5.
//
// AC4: one seed from createSeed() replayed twice through the SAME 200-tie script
//      produces identical results and identical draw accounting; a perturbed seed
//      diverges. ("one run stays reproducible", PRD §2.2)
// AC5: the PRNG is pinned by a hardcoded 8-value sequence so a silent algorithm
//      swap fails the build; nextInt() range + guard behaviour.
//
// NOTE: this file is one of the TWO files on the AC2b allowlist that may mention
// the `random` tie-break policy (PRD §5: "nothing else in the suite ever sees it").
// The allowlist lives in tests/core/tiebreak.test.ts.
import { describe, expect, it } from 'vitest';
import { createRng, createSeed } from '../../src/core/rng.ts';
import { tieBreak, toCandidates } from '../../src/core/tiebreak.ts';

const PINNED_SEED = 0xc0ffee;

// mulberry32 output for seed 0xC0FFEE — the algorithm contract. If these change,
// every other pinned sequence in the suite (tiebreak.test.ts) changes too.
const PINNED_SEQUENCE = [
  0.021141508361324668, 0.6661099966149777, 0.7799714196007699, 0.7395844468846917,
  0.10705656302161515, 0.5010192445479333, 0.1459578308276832, 0.3637241143733263,
];

// ───────────────────────────── createSeed (AC3 companion / AC4 input) ─────────────────────────────

describe('createSeed: the single entropy entry point', () => {
  it('returns a uint32 (JSON-safe, printable, storable in run state)', () => {
    for (let i = 0; i < 1000; i++) {
      const s = createSeed();
      expect(Number.isInteger(s), `not an integer: ${s}`).toBe(true);
      expect(s >= 0 && s < 2 ** 32, `outside uint32: ${s}`).toBe(true);
    }
  });

  it('does not return a constant (it really draws entropy)', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 64; i++) seen.add(createSeed());
    expect(seen.size, 'createSeed() returned the same value 64 times').toBeGreaterThan(1);
  });

  it('produces a seed createRng accepts without normalisation by the caller', () => {
    expect(() => createRng(createSeed())).not.toThrow();
  });
});

// ───────────────────────────── AC5 — algorithm pinned ─────────────────────────────

describe('createRng: pinned PRNG stream', () => {
  it('matches the hardcoded 8-value sequence for seed 0xC0FFEE', () => {
    const rng = createRng(PINNED_SEED);
    const got = Array.from({ length: PINNED_SEQUENCE.length }, () => rng.next());
    expect(got).toEqual(PINNED_SEQUENCE);
  });

  it('exposes the seed it was created with', () => {
    expect(createRng(PINNED_SEED).seed).toBe(PINNED_SEED);
  });

  it('normalises a negative int32 seed to uint32 (AC4 perturbs with a XOR)', () => {
    const raw = PINNED_SEED ^ 0x9e3779b9; // negative int32
    expect(raw).toBeLessThan(0);
    expect(createRng(raw).seed).toBe(raw >>> 0);
    // …and the stream is the stream of the normalised seed, not a second one.
    expect(createRng(raw).next()).toBe(createRng(raw >>> 0).next());
  });

  it('accepts seed 0', () => {
    expect(() => createRng(0)).not.toThrow();
    expect(createRng(0).seed).toBe(0);
  });

  it('keeps 10k draws inside [0, 1)', () => {
    const rng = createRng(PINNED_SEED);
    let violations = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next();
      if (!(v >= 0 && v < 1)) violations++;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    expect(violations, `draws outside [0,1): ${violations} (min ${min}, max ${max})`).toBe(0);
    expect(max).toBeLessThan(1);
    expect(min).toBeGreaterThanOrEqual(0);
  });

  it('holds no module-level state — a fresh Rng of the same seed restarts the stream', () => {
    const warm = createRng(7);
    warm.next();
    warm.next();
    expect(createRng(7).next()).toBe(createRng(7).next());
  });
});

// ───────────────────────────── AC5 — nextInt contract ─────────────────────────────

describe('Rng.nextInt: bounded integer draw', () => {
  it('returns an integer in [0, n) for n = 1..8', () => {
    const rng = createRng(42);
    for (let n = 1; n <= 8; n++) {
      for (let i = 0; i < 500; i++) {
        const v = rng.nextInt(n);
        expect(Number.isInteger(v), `nextInt(${n}) = ${v} is not an integer`).toBe(true);
        expect(v >= 0 && v < n, `nextInt(${n}) = ${v} outside [0,${n})`).toBe(true);
      }
    }
  });

  it('is exactly floor(next() * n) — one draw, no rejection sampling (draw count must not depend on n)', () => {
    for (const n of [2, 3, 4, 5, 7]) {
      expect(createRng(PINNED_SEED).nextInt(n)).toBe(Math.floor(createRng(PINNED_SEED).next() * n));
    }
  });

  it('nextInt(1) always returns 0 and still consumes a draw', () => {
    const rng = createRng(PINNED_SEED);
    expect(rng.nextInt(1)).toBe(0);
    expect(rng.draws).toBe(1);
  });

  it.each([0, -1, -8, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'throws RangeError for maxExclusive = %p',
    (bad) => {
      expect(() => createRng(PINNED_SEED).nextInt(bad)).toThrow(RangeError);
    },
  );

  it('validates before drawing — a rejected call never perturbs the stream', () => {
    const rng = createRng(PINNED_SEED);
    expect(() => rng.nextInt(0)).toThrow(RangeError);
    expect(rng.draws, 'a rejected nextInt() consumed a draw').toBe(0);
    expect(rng.next()).toBe(PINNED_SEQUENCE[0]);
  });
});

describe('createRng: seed validation', () => {
  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'throws RangeError for seed = %p',
    (bad) => {
      expect(() => createRng(bad)).toThrow(RangeError);
    },
  );
});

// ───────────────────────────── AC5 — draw accounting ─────────────────────────────

describe('Rng.draws: draw accounting is observable and unforgeable', () => {
  it('counts every next() and every nextInt()', () => {
    const rng = createRng(PINNED_SEED);
    expect(rng.draws).toBe(0);
    rng.next();
    rng.next();
    expect(rng.draws).toBe(2);
    rng.nextInt(3);
    expect(rng.draws).toBe(3);
  });

  it('is read-only — a caller cannot rewrite the counter or the seed', () => {
    const rng = createRng(PINNED_SEED);
    rng.next();
    const mutable = rng as unknown as { draws: number; seed: number };
    try {
      mutable.draws = 999;
      mutable.seed = 0;
    } catch {
      /* strict-mode setter-less assignment throws — also acceptable */
    }
    expect(rng.draws).toBe(1);
    expect(rng.seed).toBe(PINNED_SEED);
  });
});

// ───────────────────────────── AC4 — a run stays reproducible ─────────────────────────────

const POOL = ['garrett', 'fiona', 'selene', 'novice'];

/** The 200-tie script: 200 ties of size 2/3/4, resolved through the `random` policy. */
const runScript = (seed: number): { picks: string[]; draws: number } => {
  const rng = createRng(seed);
  const ctx = { policy: 'random' as const, rng };
  const picks: string[] = [];
  for (let i = 0; i < 200; i++) {
    const n = 2 + (i % 3);
    picks.push(tieBreak(toCandidates(POOL.slice(0, n), () => true), ctx));
  }
  return { picks, draws: rng.draws };
};

describe('AC4: one seed replays a whole run identically', () => {
  const seed = createSeed();
  const first = runScript(seed);
  const second = runScript(seed);

  it('resolved 200 ties (sanity: the script actually ran)', () => {
    expect(first.picks).toHaveLength(200);
    expect(first.picks.every((p) => POOL.includes(p))).toBe(true);
  });

  it('two independent runs of the same seed produce identical results', () => {
    expect(second.picks).toEqual(first.picks);
  });

  it('two independent runs of the same seed consume identical draw counts', () => {
    expect(second.draws).toBe(first.draws);
    expect(first.draws, 'exactly one draw per multi-candidate tie').toBe(200);
  });

  it('a perturbed seed diverges in at least one position', () => {
    const other = runScript(seed ^ 0x9e3779b9);
    const differs = other.picks.some((p, i) => p !== first.picks[i]);
    expect(differs, `perturbed seed reproduced the base run (seed ${seed})`).toBe(true);
  });
});
