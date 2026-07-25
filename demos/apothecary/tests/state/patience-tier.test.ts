// u2 TDD-Red — patience → expression-tier pure core (thresholds as balance-as-data).
// Covers AC1 (boundary semantics of tierFor), AC2 (loader guards + no inline threshold
// literal in the source), AC3 (monotonicity property + patience 0 ⇒ tier 3), AC5
// (non-finite input throws), and F6 (tier arity pinned 1:1 to generation.json tierTones).
//
// Binding rule under test (spec §1.2 / design D-4), in this exact order:
//   0. non-finite patience or budget            → throw
//   1. patience <= 0                            → 3
//   2. budget   <= 0                            → 3
//   3. ratio = min(1, patience / budget); >= t0 → 0, >= t1 → 1, >= t2 → 2
//   4. otherwise                                → 3
// Comparisons are `>=`: at exactly a threshold you stay in the calmer tier.
//
// A3: the shipped default triple is a tunable, NOT a behavioural contract — every
// behavioural assertion below passes its thresholds explicitly. The shipped data is
// only checked against the loader's invariants, never against specific numbers.
import { describe, expect, it } from 'vitest';
import {
  PATIENCE_TIERS,
  TIER_COUNT,
  loadPatienceTiers,
  tierFor,
} from '../../src/state/patience-tier';
import type { PatienceThresholds, PatienceTierConfig } from '../../src/state/patience-tier';
import type { PatienceTier } from '../../src/ai/contract';
import generation from '../../data/generation.json';
import patienceTiersData from '../../data/patience-tiers.json';

// Exactly-representable binary fractions, so `patience / budget === threshold` is an
// exact IEEE-754 equality and the boundary tests below cannot be flaky.
const T: PatienceThresholds = [0.5, 0.25, 0.125];
const B = 8; // budget: ratio steps of 1/8 are exact

const VALID = {
  thresholds: [0.5, 0.25, 0.125],
  tierLabels: ['평온', '심드렁', '짜증', '한계'],
};

// tierFor only accepts a *validated* config (PR #37 review: a raw threshold triple
// bypassed the loader's invariants). Build one from an arbitrary threshold triple —
// tierLabels never affects tierFor's arithmetic, so VALID's labels are reused.
const configOf = (thresholds: PatienceThresholds): PatienceTierConfig =>
  loadPatienceTiers({ thresholds, tierLabels: VALID.tierLabels });

const CFG = configOf(T);

// ---------------------------------------------------------------------------
// AC1 — tierFor boundary semantics
// ---------------------------------------------------------------------------

describe('AC1 — tierFor boundaries (explicit thresholds, documented rule §1.2)', () => {
  it('returns tier 0 at full patience (ratio 1)', () => {
    expect(tierFor(B, B, CFG)).toBe(0);
  });

  it('stays in the calmer tier at exactly t0 (>= comparison)', () => {
    expect(4 / B).toBe(T[0]); // guard: the boundary really is exact
    expect(tierFor(4, B, CFG)).toBe(0);
  });

  it('drops to tier 1 just below t0', () => {
    expect(tierFor(3.9, B, CFG)).toBe(1);
  });

  it('stays in the calmer tier at exactly t1 (>= comparison)', () => {
    expect(2 / B).toBe(T[1]);
    expect(tierFor(2, B, CFG)).toBe(1);
  });

  it('drops to tier 2 just below t1', () => {
    expect(tierFor(1.9, B, CFG)).toBe(2);
  });

  it('stays in the calmer tier at exactly t2 (>= comparison)', () => {
    expect(1 / B).toBe(T[2]);
    expect(tierFor(1, B, CFG)).toBe(2);
  });

  it('drops to tier 3 just below t2 while patience is still positive', () => {
    // Q1 default = yes: tier 3 is an expression state and carries no phase authority.
    expect(tierFor(0.9, B, CFG)).toBe(3);
  });

  it('returns tier 3 when patience is exactly 0 (hard rule, checked first)', () => {
    expect(tierFor(0, B, CFG)).toBe(3);
  });

  it('returns tier 3 for negative patience (data anomaly, never throws)', () => {
    expect(tierFor(-1, B, CFG)).toBe(3);
    expect(tierFor(-100, B, CFG)).toBe(3);
  });

  it('returns tier 3 when budget is 0 (no divide-by-zero, no NaN leak)', () => {
    expect(tierFor(5, 0, CFG)).toBe(3);
  });

  it('returns tier 3 when budget is negative', () => {
    expect(tierFor(5, -3, CFG)).toBe(3);
  });

  it('returns tier 3 when both patience and budget are 0', () => {
    expect(tierFor(0, 0, CFG)).toBe(3);
  });

  it('clamps patience > budget to ratio 1 → tier 0, and does not throw', () => {
    expect(() => tierFor(99, B, CFG)).not.toThrow();
    expect(tierFor(99, B, CFG)).toBe(0);
    expect(tierFor(B + 1, B, CFG)).toBe(0);
  });

  it('handles budget 1 (the smallest sane budget) deterministically', () => {
    expect(tierFor(1, 1, CFG)).toBe(0);
    expect(tierFor(0, 1, CFG)).toBe(3);
  });

  it('only ever returns 0 | 1 | 2 | 3', () => {
    for (let patience = -2; patience <= B + 2; patience += 0.25) {
      expect([0, 1, 2, 3]).toContain(tierFor(patience, B, CFG));
    }
  });

  it('is pure: repeated calls with the same input agree', () => {
    expect(tierFor(3, B, CFG)).toBe(tierFor(3, B, CFG));
    expect(tierFor(0, B, CFG)).toBe(tierFor(0, B, CFG));
  });

  it('does not mutate the config it is given', () => {
    const custom = configOf([0.75, 0.5, 0.25]);
    tierFor(3, B, custom);
    expect(custom.thresholds).toEqual([0.75, 0.5, 0.25]);
  });

  it('honours a caller-supplied threshold triple over the shipped defaults', () => {
    const strict = configOf([0.99, 0.98, 0.97]);
    const lax = configOf([0.03, 0.02, 0.01]);
    expect(tierFor(4, B, strict)).toBe(3); // ratio 0.5 is below every strict floor
    expect(tierFor(4, B, lax)).toBe(0); // ratio 0.5 clears every lax floor
  });

  it('defaults its third argument to the shipped thresholds (still a total function)', () => {
    const tier: PatienceTier = tierFor(B, B);
    expect([0, 1, 2, 3]).toContain(tier);
    expect(tierFor(0, B)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// AC2 — thresholds come only from data; the loader fails loudly
// ---------------------------------------------------------------------------

describe('AC2 — shipped PATIENCE_TIERS satisfies its own invariants', () => {
  it('accepts a well-formed config', () => {
    expect(() => loadPatienceTiers(VALID)).not.toThrow();
  });

  it('exposes exactly 3 finite thresholds', () => {
    expect(PATIENCE_TIERS.thresholds).toHaveLength(3);
    for (const t of PATIENCE_TIERS.thresholds) {
      expect(Number.isFinite(t)).toBe(true);
    }
  });

  it('keeps every threshold within [0, 1]', () => {
    for (const t of PATIENCE_TIERS.thresholds) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
    }
  });

  it('keeps thresholds strictly descending', () => {
    const [t0, t1, t2] = PATIENCE_TIERS.thresholds;
    expect(t0).toBeGreaterThan(t1);
    expect(t1).toBeGreaterThan(t2);
  });

  it('ships one non-empty label per tier', () => {
    expect(PATIENCE_TIERS.tierLabels).toHaveLength(TIER_COUNT);
    for (const label of PATIENCE_TIERS.tierLabels) {
      expect(typeof label).toBe('string');
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('AC2 — loadPatienceTiers guard tests (one per §1.3 rule)', () => {
  it('rule 1: rejects a non-object root', () => {
    expect(() => loadPatienceTiers(null)).toThrow(/patience-tiers:/);
    expect(() => loadPatienceTiers(undefined)).toThrow(/patience-tiers:/);
    expect(() => loadPatienceTiers(42)).toThrow(/patience-tiers:/);
    expect(() => loadPatienceTiers('nope')).toThrow(/patience-tiers:.*root.*object/);
  });

  it('rule 2: rejects thresholds that are not an array', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: 0.5 })).toThrow(
      /patience-tiers:.*thresholds/,
    );
    expect(() => loadPatienceTiers({ ...VALID, thresholds: undefined })).toThrow(
      /patience-tiers:.*thresholds/,
    );
  });

  it('rule 2: rejects the wrong number of thresholds', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [0.5, 0.25] })).toThrow(
      /patience-tiers:.*thresholds/,
    );
    expect(() =>
      loadPatienceTiers({ ...VALID, thresholds: [0.8, 0.5, 0.25, 0.125] }),
    ).toThrow(/patience-tiers:.*thresholds/);
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [] })).toThrow(
      /patience-tiers:.*thresholds/,
    );
  });

  it('rule 2: rejects non-finite / non-numeric threshold entries', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [0.5, Number.NaN, 0.125] })).toThrow(
      /patience-tiers:.*thresholds/,
    );
    expect(() =>
      loadPatienceTiers({ ...VALID, thresholds: [Number.POSITIVE_INFINITY, 0.25, 0.125] }),
    ).toThrow(/patience-tiers:.*thresholds/);
    expect(() => loadPatienceTiers({ ...VALID, thresholds: ['0.5', 0.25, 0.125] })).toThrow(
      /patience-tiers:.*thresholds/,
    );
  });

  it('rule 3: rejects a threshold outside [0, 1]', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [1.5, 0.25, 0.125] })).toThrow(
      /patience-tiers:.*thresholds/,
    );
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [0.5, 0.25, -0.1] })).toThrow(
      /patience-tiers:.*thresholds/,
    );
  });

  it('rule 3: accepts the inclusive endpoints 0 and 1', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [1, 0.5, 0] })).not.toThrow();
  });

  it('rule 4: rejects thresholds that are not strictly descending', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [0.25, 0.5, 0.75] })).toThrow(
      /patience-tiers:.*descending/,
    );
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [0.5, 0.5, 0.25] })).toThrow(
      /patience-tiers:.*descending/,
    );
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [0.5, 0.25, 0.25] })).toThrow(
      /patience-tiers:.*descending/,
    );
  });

  it('rule 5: rejects tierLabels that are not an array of exactly 4 entries', () => {
    expect(() => loadPatienceTiers({ ...VALID, tierLabels: undefined })).toThrow(
      /patience-tiers:.*tierLabels/,
    );
    expect(() => loadPatienceTiers({ ...VALID, tierLabels: '평온' })).toThrow(
      /patience-tiers:.*tierLabels/,
    );
    expect(() => loadPatienceTiers({ ...VALID, tierLabels: ['평온', '짜증', '한계'] })).toThrow(
      /patience-tiers:.*tierLabels/,
    );
    expect(() =>
      loadPatienceTiers({ ...VALID, tierLabels: ['평온', '심드렁', '짜증', '한계', '폭발'] }),
    ).toThrow(/patience-tiers:.*tierLabels/);
  });

  it('rule 5: rejects empty / whitespace-only / non-string labels', () => {
    expect(() =>
      loadPatienceTiers({ ...VALID, tierLabels: ['평온', '', '짜증', '한계'] }),
    ).toThrow(/patience-tiers:.*tierLabels/);
    expect(() =>
      loadPatienceTiers({ ...VALID, tierLabels: ['평온', '   ', '짜증', '한계'] }),
    ).toThrow(/patience-tiers:.*tierLabels/);
    expect(() =>
      loadPatienceTiers({ ...VALID, tierLabels: ['평온', 3, '짜증', '한계'] }),
    ).toThrow(/patience-tiers:.*tierLabels/);
  });

  it('rule 6: freezes the result and its nested arrays', () => {
    const cfg = loadPatienceTiers(VALID);
    expect(Object.isFrozen(cfg)).toBe(true);
    expect(Object.isFrozen(cfg.thresholds)).toBe(true);
    expect(Object.isFrozen(cfg.tierLabels)).toBe(true);
    expect(Object.isFrozen(PATIENCE_TIERS)).toBe(true);
    expect(Object.isFrozen(PATIENCE_TIERS.thresholds)).toBe(true);
    expect(Object.isFrozen(PATIENCE_TIERS.tierLabels)).toBe(true);
  });

  it('does not alias the input object it was handed', () => {
    const input = { thresholds: [0.5, 0.25, 0.125], tierLabels: [...VALID.tierLabels] };
    const cfg = loadPatienceTiers(input);
    input.thresholds[0] = 0.9;
    expect(cfg.thresholds[0]).toBe(0.5);
  });
});

// PR #37 review: asserting on the *source text* (e.g. "no decimal literal appears")
// is both unsound (`7/10`, `.7`, `7e-1` all dodge a literal-shaped regex) and brittle
// (any unrelated decimal — a comment example, a future epsilon constant — breaks it).
// The behavioural claim balance-as-data actually makes is: classification tracks the
// data, not a constant baked into the module. Prove that directly instead.
describe('AC2 — balance-as-data: classification follows data, not a baked-in constant', () => {
  it('changing the threshold data changes the classification for the same input', () => {
    // Same (patience, budget); only the config differs. If a threshold were hardcoded
    // in tierFor's logic, both calls would agree regardless of which config is passed.
    const strict = configOf([0.99, 0.98, 0.97]);
    const lax = configOf([0.03, 0.02, 0.01]);
    expect(tierFor(4, B, strict)).not.toBe(tierFor(4, B, lax));
  });

  it('PATIENCE_TIERS is exactly what loadPatienceTiers(data/patience-tiers.json) produces', () => {
    // Ties the shipped singleton to the actual data file end-to-end, without caring
    // what the numbers are (that's PATIENCE_TIERS's own invariant tests, above).
    expect(PATIENCE_TIERS).toEqual(loadPatienceTiers(patienceTiersData));
  });
});

// ---------------------------------------------------------------------------
// AC3 — monotonicity property
// ---------------------------------------------------------------------------

describe('AC3 — property: tier is non-decreasing as patience falls, and 0 ⇒ tier 3', () => {
  const configs: PatienceTierConfig[] = [
    PATIENCE_TIERS,
    configOf([0.5, 0.25, 0.125]),
    configOf([0.9, 0.6, 0.3]),
    configOf([1, 0.5, 0]),
    configOf([0.05, 0.02, 0.01]),
  ];

  it('walks patience budget → 0 in integer steps without a tier ever decreasing', () => {
    for (const config of configs) {
      for (let budget = 1; budget <= 20; budget++) {
        let previous = tierFor(budget, budget, config);
        for (let patience = budget; patience >= 0; patience--) {
          const tier = tierFor(patience, budget, config);
          expect([0, 1, 2, 3]).toContain(tier);
          expect(
            tier,
            `tier decreased at patience=${patience}/${budget} with ${config.thresholds.join(',')}`,
          ).toBeGreaterThanOrEqual(previous);
          previous = tier;
        }
        expect(tierFor(0, budget, config)).toBe(3);
      }
    }
  });

  it('stays non-decreasing under a fine-grained (fractional) walk', () => {
    const steps = 40;
    for (const config of configs) {
      for (let budget = 1; budget <= 20; budget++) {
        let previous = tierFor(budget, budget, config);
        for (let i = steps; i >= 0; i--) {
          const patience = (budget * i) / steps;
          const tier = tierFor(patience, budget, config);
          expect(tier).toBeGreaterThanOrEqual(previous);
          previous = tier;
        }
      }
    }
  });

  it('always reports tier 3 at exhaustion, for every budget and threshold set', () => {
    for (const config of configs) {
      for (let budget = 1; budget <= 20; budget++) {
        expect(tierFor(0, budget, config)).toBe(3);
        expect(tierFor(-1, budget, config)).toBe(3);
      }
    }
  });

  it('reports tier 0 at full patience whenever the top floor is reachable', () => {
    const topFloor = configOf([1, 0.5, 0.25]);
    for (let budget = 1; budget <= 20; budget++) {
      expect(tierFor(budget, budget, topFloor)).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// AC5 — non-finite input throws (never a silent tier)
// ---------------------------------------------------------------------------

describe('AC5 — non-finite input throws instead of returning a tier', () => {
  it('throws on non-finite patience', () => {
    expect(() => tierFor(Number.NaN, B, CFG)).toThrow();
    expect(() => tierFor(Number.POSITIVE_INFINITY, B, CFG)).toThrow();
    expect(() => tierFor(Number.NEGATIVE_INFINITY, B, CFG)).toThrow();
  });

  it('throws on non-finite budget', () => {
    expect(() => tierFor(4, Number.NaN, CFG)).toThrow();
    expect(() => tierFor(4, Number.POSITIVE_INFINITY, CFG)).toThrow();
    expect(() => tierFor(4, Number.NEGATIVE_INFINITY, CFG)).toThrow();
  });

  it('throws on NaN even though NaN would otherwise fall through to tier 3 (D-4 ordering)', () => {
    // The finiteness guard must run BEFORE the `patience <= 0` rule; otherwise NaN
    // silently lands on tier 3 and the failure is invisible.
    expect(() => tierFor(Number.NaN, Number.NaN, CFG)).toThrow();
  });

  it('throws an Error (not a string / undefined rejection)', () => {
    expect(() => tierFor(Number.NaN, B, CFG)).toThrow(Error);
  });
});

// ---------------------------------------------------------------------------
// F6 — tier arity is pinned 1:1 to generation.json tierTones
// ---------------------------------------------------------------------------

describe('F6 — tier count is 1:1 with generation.json tierTones', () => {
  it('TIER_COUNT matches the PatienceTier union arity (0|1|2|3)', () => {
    expect(TIER_COUNT).toBe(4);
  });

  it('generation.json ships exactly TIER_COUNT tone lines', () => {
    expect(Array.isArray(generation.tierTones)).toBe(true);
    expect(generation.tierTones).toHaveLength(TIER_COUNT);
  });

  it('tierLabels, tierTones and TIER_COUNT all agree', () => {
    expect(PATIENCE_TIERS.tierLabels.length).toBe(TIER_COUNT);
    expect(PATIENCE_TIERS.tierLabels.length).toBe(generation.tierTones.length);
  });

  it('every tier index returned by tierFor indexes a label and a tone', () => {
    for (let patience = 0; patience <= B; patience++) {
      const tier = tierFor(patience, B, CFG);
      expect(PATIENCE_TIERS.tierLabels[tier]).toBeTruthy();
      expect(generation.tierTones[tier]).toBeTruthy();
    }
  });

  // PR #37 review: tierFor's ladder used to be hand-unrolled (`if (ratio >= t0) return
  // 0; ...`), so a config declaring N thresholds could still silently leave the last
  // one unread and never report the tier past it. tierFor now walks config.thresholds
  // in a loop, but that guarantee is only worth something if every position on the
  // ladder is provably reachable — not just the first and the last.
  it('every threshold position on the ladder is reachable, not only the endpoints', () => {
    const seen = new Set<PatienceTier>();
    for (let i = 0; i <= 40; i++) {
      seen.add(tierFor((B * i) / 40, B, CFG));
    }
    expect(seen.size).toBe(TIER_COUNT);
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });
});
