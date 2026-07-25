// u2 TDD-Red — 인내심 → 표정 티어 순수 코어 (PRD §2.2, spec §1.2/§1.3).
//
// RED until u2-BUILD creates:
//   - demos/apothecary/data/patience-tiers.json
//   - demos/apothecary/src/state/patience-tier.ts
// (both imports below fail to resolve, so the whole suite is red.)
//
// Maps 1:1 to spec acceptance AC1/AC2/AC3/AC5 + F4/F6 pins.
// A3: the core must never be assumed to ship any particular threshold triple, so
// every *behavioral* test passes explicit fixture thresholds. Only the clearly
// labelled "shipped defaults" block asserts data/patience-tiers.json values.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import generationData from '../../data/generation.json';
import tiersData from '../../data/patience-tiers.json';
import type { PatienceTier } from '../../src/ai/contract';
import {
  PATIENCE_TIERS,
  TIER_COUNT,
  loadPatienceTiers,
  tierFor,
} from '../../src/state/patience-tier';
import type { PatienceThresholds } from '../../src/state/patience-tier';

// Fixture thresholds chosen so every "ratio === threshold" boundary is an EXACT
// binary float (n/8), i.e. the boundary tests can never be fooled by rounding.
const TH: PatienceThresholds = [0.75, 0.5, 0.25];
const BUDGET = 8;

const VALID = {
  thresholds: [0.7, 0.4, 0.15],
  tierLabels: ['평온', '심드렁', '짜증', '한계'],
};

const TIERS = [0, 1, 2, 3];

// ── AC1 — tierFor: exported, pure, documented boundary rules (spec §1.2) ──────
describe('AC1 — tierFor is an exported pure function returning 0|1|2|3', () => {
  it('is a function of arity >= 2 (patience, budget, thresholds?)', () => {
    expect(typeof tierFor).toBe('function');
    expect(tierFor.length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic: the same inputs always give the same tier', () => {
    for (let p = 0; p <= BUDGET; p++) {
      const first = tierFor(p, BUDGET, TH);
      expect(tierFor(p, BUDGET, TH)).toBe(first);
      expect(tierFor(p, BUDGET, TH)).toBe(first);
    }
  });

  it('never mutates the thresholds it is given', () => {
    const before: PatienceThresholds = [0.75, 0.5, 0.25];
    const snapshot = [...before];
    tierFor(3, BUDGET, before);
    expect([...before]).toEqual(snapshot);
  });

  it('always returns a member of {0,1,2,3}', () => {
    for (let p = -3; p <= BUDGET + 3; p++) {
      expect(TIERS).toContain(tierFor(p, BUDGET, TH));
    }
  });
});

describe('AC1 — boundary: at exactly a threshold you stay in the CALMER tier (>=)', () => {
  it.each<[string, number, PatienceTier]>([
    // [why, patience (budget 8, thresholds .75/.5/.25), expected tier]
    ['ratio 1.0 (full budget) -> calmest tier', 8, 0],
    ['ratio === t0 exactly (0.75) -> stays tier 0', 6, 0],
    ['ratio just below t0 (0.625) -> tier 1', 5, 1],
    ['ratio === t1 exactly (0.5) -> stays tier 1', 4, 1],
    ['ratio just below t1 (0.375) -> tier 2', 3, 2],
    ['ratio === t2 exactly (0.25) -> stays tier 2', 2, 2],
    ['ratio just below t2 (0.125) -> tier 3', 1, 3],
  ])('%s', (_why, patience, expected) => {
    expect(tierFor(patience, BUDGET, TH)).toBe(expected);
  });
});

describe('AC1 — boundary: patience === 0 is ALWAYS tier 3 (hard rule, checked first)', () => {
  it.each<number>([1, 2, 3, 5, 8, 20, 999])('budget %i, patience 0 -> tier 3', (budget) => {
    expect(tierFor(0, budget, TH)).toBe(3);
  });

  it('patience 0 is tier 3 even when the threshold triple would allow tier 0 at ratio 0', () => {
    // A degenerate-but-valid triple (all floors at 0) must NOT be able to report
    // a calm tier at exhaustion: rule 1 short-circuits before the ladder.
    const permissive: PatienceThresholds = [0, 0, 0];
    expect(tierFor(0, 5, permissive)).toBe(3);
  });
});

describe('AC1 — boundary: budget === 0 -> tier 3 (no divide-by-zero, never throws)', () => {
  it('budget 0 with positive patience is tier 3', () => {
    expect(tierFor(5, 0, TH)).toBe(3);
  });

  it('budget 0 and patience 0 is tier 3', () => {
    expect(tierFor(0, 0, TH)).toBe(3);
  });

  it('a negative budget (data anomaly) is tier 3 rather than a throw or NaN tier', () => {
    expect(tierFor(5, -4, TH)).toBe(3);
  });

  it('never yields NaN or a non-integer for a zero budget', () => {
    expect(TIERS).toContain(tierFor(5, 0, TH));
  });
});

describe('AC1 — boundary: patience > budget clamps to ratio 1 -> tier 0, never throws', () => {
  it.each<number>([9, 12, 100])('patience %i over budget 8 -> tier 0', (patience) => {
    expect(() => tierFor(patience, BUDGET, TH)).not.toThrow();
    expect(tierFor(patience, BUDGET, TH)).toBe(0);
  });
});

describe('AC1 — boundary: negative patience -> tier 3 (treated as exhausted, no throw)', () => {
  it.each<number>([-1, -5, -100])('patience %i -> tier 3', (patience) => {
    expect(() => tierFor(patience, BUDGET, TH)).not.toThrow();
    expect(tierFor(patience, BUDGET, TH)).toBe(3);
  });
});

describe('AC1 — the thresholds argument is optional and defaults to PATIENCE_TIERS.thresholds', () => {
  it('a 2-arg call equals the explicit 3-arg call with the shipped thresholds', () => {
    for (let budget = 1; budget <= 8; budget++) {
      for (let p = 0; p <= budget; p++) {
        expect(tierFor(p, budget)).toBe(tierFor(p, budget, PATIENCE_TIERS.thresholds));
      }
    }
  });
});

// ── AC5 — non-finite input throws; a silent tier is forbidden ─────────────────
describe('AC5 — non-finite patience or budget throws Error (never returns a tier)', () => {
  it.each<[string, number, number]>([
    ['patience NaN', NaN, 5],
    ['patience Infinity', Infinity, 5],
    ['patience -Infinity', -Infinity, 5],
    ['budget NaN', 5, NaN],
    ['budget Infinity', 5, Infinity],
    ['budget -Infinity', 5, -Infinity],
    ['both NaN', NaN, NaN],
  ])('%s throws', (_why, patience, budget) => {
    expect(() => tierFor(patience, budget, TH)).toThrow(Error);
  });

  it('NaN patience throws even though the patience <= 0 rule would swallow it', () => {
    // Regression guard for the ordering trap: `NaN <= 0` is false and `NaN >= t`
    // is false, so a NaN reaching the ladder would silently report tier 3.
    expect(() => tierFor(NaN, 5, TH)).toThrow();
  });

  it('non-finite input throws with the 2-arg (default thresholds) call too', () => {
    expect(() => tierFor(NaN, 5)).toThrow(Error);
    expect(() => tierFor(5, NaN)).toThrow(Error);
  });
});

// ── AC3 — property: monotone in patience, always in range, 0 ⇒ tier 3 ─────────
const PROPERTY_TRIPLES: ReadonlyArray<readonly [string, PatienceThresholds]> = [
  ['shipped defaults', PATIENCE_TIERS.thresholds],
  ['fixture .75/.5/.25', [0.75, 0.5, 0.25]],
  ['wide .9/.5/.1', [0.9, 0.5, 0.1]],
  ['tight .55/.5/.45', [0.55, 0.5, 0.45]],
  ['edge 1/.5/0', [1, 0.5, 0]],
];

describe('AC3 — property: tier is non-decreasing as patience falls budget -> 0', () => {
  it.each(PROPERTY_TRIPLES)('%s: monotone for every budget 1..20', (_name, thresholds) => {
    for (let budget = 1; budget <= 20; budget++) {
      let previous = tierFor(budget, budget, thresholds);
      for (let patience = budget; patience >= 0; patience--) {
        const tier = tierFor(patience, budget, thresholds);
        expect(TIERS, `budget ${budget}, patience ${patience}`).toContain(tier);
        expect(tier, `budget ${budget}, patience ${patience} must not calm down`).toBeGreaterThanOrEqual(
          previous,
        );
        previous = tier;
      }
    }
  });

  it.each(PROPERTY_TRIPLES)('%s: patience 0 is tier 3 for every budget 1..20', (_name, thresholds) => {
    for (let budget = 1; budget <= 20; budget++) {
      expect(tierFor(0, budget, thresholds), `budget ${budget}`).toBe(3);
    }
  });

  it.each(PROPERTY_TRIPLES)('%s: a full budget is never worse than tier 0', (_name, thresholds) => {
    for (let budget = 1; budget <= 20; budget++) {
      expect(tierFor(budget, budget, thresholds), `budget ${budget}`).toBe(0);
    }
  });
});

// ── AC2 / F4 — thresholds come ONLY from data/patience-tiers.json ────────────
const here = dirname(fileURLToPath(import.meta.url));
const sourceFile = resolve(here, '../../src/state/patience-tier.ts');

describe('AC2 / F4 — balance-as-data: no threshold literal inlined in the module', () => {
  it('src/state/patience-tier.ts contains no decimal literal anywhere (comments included)', () => {
    const src = readFileSync(sourceFile, 'utf8');
    const hits = src.split('\n').flatMap((line, i) => {
      const m = line.match(/0\.[0-9]+/);
      return m ? [`${i + 1}: ${line.trim()}`] : [];
    });
    expect(hits, `inline threshold literal(s) found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('imports the thresholds from the JSON data file', () => {
    const src = readFileSync(sourceFile, 'utf8');
    expect(src).toMatch(/from\s+['"][^'"]*data\/patience-tiers\.json['"]/);
  });

  it('PATIENCE_TIERS is exactly what the shipped JSON declares (no code-side override)', () => {
    expect([...PATIENCE_TIERS.thresholds]).toEqual(tiersData.thresholds);
    expect([...PATIENCE_TIERS.tierLabels]).toEqual(tiersData.tierLabels);
  });
});

// ── AC2 — loadPatienceTiers fails loudly, one test per §1.3 rule ─────────────
describe('AC2 — loadPatienceTiers accepts well-formed data', () => {
  it('does not throw on the canonical shape', () => {
    expect(() => loadPatienceTiers(VALID)).not.toThrow();
  });

  it('returns the parsed thresholds and labels unchanged', () => {
    const cfg = loadPatienceTiers(VALID);
    expect([...cfg.thresholds]).toEqual(VALID.thresholds);
    expect([...cfg.tierLabels]).toEqual(VALID.tierLabels);
  });

  it('accepts the boundary-legal triple [1, 0.5, 0]', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [1, 0.5, 0] })).not.toThrow();
  });
});

describe('AC2 rule 1 — root must be an object', () => {
  it.each<[string, unknown]>([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a string', 'patience'],
    ['an array', [0.7, 0.4, 0.15]],
  ])('rejects %s', (_why, input) => {
    expect(() => loadPatienceTiers(input)).toThrow(/patience-tiers:.*root must be an object/);
  });
});

describe('AC2 rule 2 — thresholds must be an array of exactly 3 finite numbers', () => {
  it.each<[string, unknown]>([
    ['missing', undefined],
    ['not an array', 0.7],
    ['an object', { 0: 0.7, 1: 0.4, 2: 0.15 }],
    ['only 2 entries', [0.7, 0.4]],
    ['4 entries', [0.7, 0.4, 0.15, 0.05]],
    ['empty', []],
    ['containing a string', [0.7, '0.4', 0.15]],
    ['containing null', [0.7, null, 0.15]],
    ['containing NaN', [0.7, NaN, 0.15]],
    ['containing Infinity', [Infinity, 0.4, 0.15]],
  ])('rejects thresholds %s', (_why, thresholds) => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds })).toThrow(
      /patience-tiers:.*thresholds/,
    );
  });
});

describe('AC2 rule 3 — every threshold must be within [0, 1] inclusive', () => {
  it.each<[string, number[]]>([
    ['a negative floor', [0.7, 0.4, -0.1]],
    ['a floor above 1', [1.5, 0.4, 0.15]],
    ['all out of range', [9, 5, 2]],
  ])('rejects %s', (_why, thresholds) => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds })).toThrow(
      /patience-tiers:.*thresholds.*\[0, 1\]/,
    );
  });

  it('accepts the inclusive endpoints 1 and 0', () => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds: [1, 0.4, 0] })).not.toThrow();
  });
});

describe('AC2 rule 4 — thresholds must be strictly descending (t0 > t1 > t2)', () => {
  it.each<[string, number[]]>([
    ['ascending', [0.15, 0.4, 0.7]],
    ['unsorted', [0.4, 0.7, 0.15]],
    ['t0 equal to t1', [0.5, 0.5, 0.2]],
    ['t1 equal to t2', [0.7, 0.4, 0.4]],
    ['all equal', [0.5, 0.5, 0.5]],
  ])('rejects %s', (_why, thresholds) => {
    expect(() => loadPatienceTiers({ ...VALID, thresholds })).toThrow(
      /patience-tiers:.*strictly descending/,
    );
  });
});

describe('AC2 rule 5 — tierLabels must be an array of exactly 4 non-empty strings', () => {
  it.each<[string, unknown]>([
    ['missing', undefined],
    ['not an array', '평온'],
    ['only 3 labels', ['평온', '심드렁', '짜증']],
    ['5 labels', ['평온', '심드렁', '짜증', '한계', '폭발']],
    ['empty', []],
    ['containing a number', ['평온', '심드렁', '짜증', 4]],
    ['containing an empty string', ['평온', '심드렁', '짜증', '']],
    ['containing a whitespace-only string', ['평온', '심드렁', '짜증', '   ']],
  ])('rejects tierLabels %s', (_why, tierLabels) => {
    expect(() => loadPatienceTiers({ ...VALID, tierLabels })).toThrow(
      /patience-tiers:.*tierLabels/,
    );
  });
});

describe('AC2 rule 6 — the result and its nested arrays are frozen', () => {
  it('freezes the config object and both arrays', () => {
    const cfg = loadPatienceTiers(VALID);
    expect(Object.isFrozen(cfg)).toBe(true);
    expect(Object.isFrozen(cfg.thresholds)).toBe(true);
    expect(Object.isFrozen(cfg.tierLabels)).toBe(true);
  });

  it('freezes the shipped PATIENCE_TIERS singleton too', () => {
    expect(Object.isFrozen(PATIENCE_TIERS)).toBe(true);
    expect(Object.isFrozen(PATIENCE_TIERS.thresholds)).toBe(true);
    expect(Object.isFrozen(PATIENCE_TIERS.tierLabels)).toBe(true);
  });

  it('mutating a frozen threshold throws in strict mode', () => {
    const cfg = loadPatienceTiers(VALID);
    expect(() => {
      (cfg.thresholds as unknown as number[])[0] = 0.99;
    }).toThrow(TypeError);
    expect(cfg.thresholds[0]).toBe(VALID.thresholds[0]);
  });

  it('does not alias the caller-supplied input arrays', () => {
    const input = { thresholds: [0.7, 0.4, 0.15], tierLabels: [...VALID.tierLabels] };
    const cfg = loadPatienceTiers(input);
    input.thresholds[0] = 0.1; // the raw input stays mutable; the config must not follow
    expect(cfg.thresholds[0]).toBe(0.7);
  });
});

// ── F6 — tier index order is 1:1 with generation.json › tierTones ─────────────
describe('F6 — TIER_COUNT pins the 1:1 type ↔ labels ↔ tones arity', () => {
  it('TIER_COUNT is 4 (arity of the frozen PatienceTier union)', () => {
    expect(TIER_COUNT).toBe(4);
  });

  it('tierLabels has exactly TIER_COUNT entries', () => {
    expect(PATIENCE_TIERS.tierLabels.length).toBe(TIER_COUNT);
  });

  it('generation.json tierTones has exactly TIER_COUNT entries', () => {
    expect(generationData.tierTones.length).toBe(TIER_COUNT);
  });

  it('every tier index returned by tierFor is a valid index into both arrays', () => {
    for (let budget = 1; budget <= 10; budget++) {
      for (let patience = 0; patience <= budget; patience++) {
        const tier: PatienceTier = tierFor(patience, budget);
        expect(PATIENCE_TIERS.tierLabels[tier]).toBeTypeOf('string');
        expect(generationData.tierTones[tier]).toBeTypeOf('string');
      }
    }
  });
});

// ── Shipped defaults (data pin, NOT core behavior — see A3) ───────────────────
describe('shipped defaults produce the spec §1.3 tier tables', () => {
  it('budget 5 walks 0,0,1,1,2,3 as patience falls 5 -> 0', () => {
    const walk = [5, 4, 3, 2, 1, 0].map((p) => tierFor(p, 5));
    expect(walk).toEqual([0, 0, 1, 1, 2, 3]);
  });

  it('budget 3 walks 0,1,2,3 as patience falls 3 -> 0', () => {
    const walk = [3, 2, 1, 0].map((p) => tierFor(p, 3));
    expect(walk).toEqual([0, 1, 2, 3]);
  });
});

// ── AC4 — EXTENDS only: src/state/index.ts must stay untouched ───────────────
describe('AC4 — the v1 reducer module is not modified or re-exported through', () => {
  const indexFile = resolve(here, '../../src/state/index.ts');

  it('src/state/index.ts does not reference the new tier module', () => {
    const src = readFileSync(indexFile, 'utf8');
    expect(src).not.toMatch(/patience-tier/);
    expect(src).not.toMatch(/tierFor/);
  });

  it('src/state/index.ts still owns the patience arithmetic (single source, F3)', () => {
    const src = readFileSync(indexFile, 'utf8');
    expect(src).toMatch(/chooseDialogue/);
  });

  it('the tier module does not import or re-implement the reducer (read-only projection)', () => {
    const src = readFileSync(sourceFile, 'utf8');
    expect(src).not.toMatch(/from\s+['"]\.\/index['"]/);
    expect(src).not.toMatch(/\breduce\b/);
  });
});
