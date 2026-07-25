// u3 — the single tie-break seam (TDD-Red). Covers AC2a (R1–R10 + pinned
// fixed-seed pick sequence) and AC2b (suite-wide guard: the `random` policy
// appears in exactly two files).
//
// PRD §2.2 / §5: every numeric tie in this demo resolves through tieBreak();
// policy `index` is the default under automated gates and stub mode, policy
// `random` is the live default and gets its own fixed-seed test here.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { createRng } from '../../src/core/rng.ts';
import {
  DEFAULT_TIEBREAK_POLICY,
  createTieBreaker,
  tieBreak,
  toCandidates,
} from '../../src/core/tiebreak.ts';
import type { TieBreakPolicy, TieCandidate } from '../../src/core/tiebreak.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..'); // demos/darkest-context/

const PINNED_SEED = 0xc0ffee;

const cand = <T,>(value: T, index: number): TieCandidate<T> => ({ value, index });
/** Candidates in data-file order: index 0..n-1. */
const ordered = (...values: string[]): TieCandidate<string>[] => values.map((v, i) => cand(v, i));

// ───────────────────────────── policy surface ─────────────────────────────

describe('policy surface: exactly two policies exist', () => {
  it('declares TieBreakPolicy as a 2-member union — index | random', () => {
    const src = readFileSync(join(root, 'src/core/tiebreak.ts'), 'utf8');
    const decl = /export\s+type\s+TieBreakPolicy\s*=\s*([^;]+);/.exec(src);
    expect(decl, 'no `export type TieBreakPolicy = ...;` declaration found').not.toBeNull();
    const members = String(decl?.[1] ?? '')
      .split('|')
      .map((m) => m.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
      .sort();
    expect(members).toEqual(['index', 'random']);
  });

  it('defaults to `index` — the policy automated gates and stub mode run on', () => {
    expect(DEFAULT_TIEBREAK_POLICY).toBe('index');
  });
});

// ───────────────────────────── R1 / R2 — degenerate inputs ─────────────────────────────

describe('R1: empty candidate list', () => {
  it('throws RangeError under the index policy', () => {
    expect(() => tieBreak([], { policy: DEFAULT_TIEBREAK_POLICY })).toThrow(RangeError);
  });

  it('throws RangeError under the random policy too (before drawing)', () => {
    const rng = createRng(PINNED_SEED);
    expect(() => tieBreak([], { policy: 'random', rng })).toThrow(RangeError);
    expect(rng.draws, 'a rejected tie consumed a draw').toBe(0);
  });
});

describe('R2: a single candidate is not a tie', () => {
  it('returns it under the index policy', () => {
    expect(tieBreak([cand('solo', 3)], { policy: 'index' })).toBe('solo');
  });

  it('returns it under the random policy and consumes NO draw', () => {
    const rng = createRng(PINNED_SEED);
    expect(tieBreak([cand('solo', 3)], { policy: 'random', rng })).toBe('solo');
    expect(rng.draws, 'a 1-candidate "tie" burned entropy').toBe(0);
    // …and the stream is untouched, so the next real tie sees draw #1.
    expect(rng.next()).toBe(0.021141508361324668);
  });
});

// ───────────────────────────── R3 — the index policy ─────────────────────────────

describe('R3: index policy picks the lowest data-file index', () => {
  it('picks the lowest .index regardless of array order', () => {
    const candidates = [cand('c', 7), cand('a', 2), cand('b', 5)];
    expect(tieBreak(candidates, { policy: 'index' })).toBe('a');
  });

  it('picks the lowest .index when the list is already ascending', () => {
    expect(tieBreak(ordered('a', 'b', 'c'), { policy: 'index' })).toBe('a');
  });

  it('accepts index 0 as the winner (no falsy-index bug)', () => {
    expect(tieBreak([cand('zero', 0), cand('one', 1)], { policy: 'index' })).toBe('zero');
  });

  it('on a duplicate lowest index, returns the first one in array order', () => {
    const candidates = [cand('later', 4), cand('first', 1), cand('shadow', 1)];
    expect(tieBreak(candidates, { policy: 'index' })).toBe('first');
  });

  it('never touches ctx.rng — gates run this policy and must not desync a live replay', () => {
    const rng = createRng(PINNED_SEED);
    tieBreak(ordered('a', 'b', 'c', 'd'), { policy: 'index', rng });
    expect(rng.draws, 'the index policy drew from the rng').toBe(0);
  });
});

// ───────────────────────────── R4 / R6 — malformed ctx ─────────────────────────────

describe('R4: random policy without an rng', () => {
  it('throws TypeError (malformed ctx, not an out-of-range value)', () => {
    expect(() => tieBreak(ordered('a', 'b'), { policy: 'random' })).toThrow(TypeError);
  });

  it('names the missing dependency in the message', () => {
    expect(() => tieBreak(ordered('a', 'b'), { policy: 'random' })).toThrow(/rng/i);
  });
});

describe('R6: unknown policy', () => {
  it('throws TypeError for a policy string that crossed a JSON boundary', () => {
    const ctx = { policy: 'shuffle' as TieBreakPolicy, rng: createRng(PINNED_SEED) };
    expect(() => tieBreak(ordered('a', 'b'), ctx)).toThrow(TypeError);
  });

  it('throws TypeError for a missing policy', () => {
    const ctx = {} as { policy: TieBreakPolicy };
    expect(() => tieBreak(ordered('a', 'b'), ctx)).toThrow(TypeError);
  });
});

// ───────────────────────────── R8 — candidate index validation ─────────────────────────────

describe('R8: candidate indexes must be non-negative integers', () => {
  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'throws RangeError for index %p under the index policy',
    (bad) => {
      expect(() => tieBreak([cand('a', 0), cand('bad', bad)], { policy: 'index' })).toThrow(
        RangeError,
      );
    },
  );

  it('throws RangeError under the random policy before drawing', () => {
    const rng = createRng(PINNED_SEED);
    expect(() => tieBreak([cand('a', 0), cand('bad', -2)], { policy: 'random', rng })).toThrow(
      RangeError,
    );
    expect(rng.draws).toBe(0);
  });

  it('validates before the single-candidate fast path (validate first, then shortcut)', () => {
    expect(() => tieBreak([cand('solo', -1)], { policy: 'index' })).toThrow(RangeError);
  });
});

// ───────────────────────────── R5 / R10 — the random policy ─────────────────────────────

describe('R5: random policy draws exactly once from the injected rng', () => {
  it('consumes one draw per multi-candidate tie', () => {
    const rng = createRng(PINNED_SEED);
    tieBreak(ordered('a', 'b', 'c'), { policy: 'random', rng });
    expect(rng.draws).toBe(1);
    tieBreak(ordered('a', 'b', 'c', 'd'), { policy: 'random', rng });
    expect(rng.draws, 'draw count must not depend on candidate count').toBe(2);
  });

  it('picks the nth of the index-sorted set, where n = rng.nextInt(size)', () => {
    const probe = createRng(PINNED_SEED);
    const expectedSlot = probe.nextInt(3);
    const rng = createRng(PINNED_SEED);
    expect(tieBreak(ordered('a', 'b', 'c'), { policy: 'random', rng })).toBe(
      ['a', 'b', 'c'][expectedSlot],
    );
  });

  it('pins an exact 8-pick sequence for seed 0xC0FFEE over a 4-way tie', () => {
    const rng = createRng(PINNED_SEED);
    const ctx = { policy: 'random' as const, rng };
    const picks = Array.from({ length: 8 }, () => tieBreak(ordered('a', 'b', 'c', 'd'), ctx));
    expect(picks).toEqual(['a', 'c', 'd', 'c', 'a', 'c', 'a', 'b']);
    expect(rng.draws).toBe(8);
  });

  it('pins an exact 12-pick sequence for seed 0xC0FFEE over ties of size 2/3/4', () => {
    const rng = createRng(PINNED_SEED);
    const ctx = { policy: 'random' as const, rng };
    const pool = ['a', 'b', 'c', 'd'];
    const picks = Array.from({ length: 12 }, (_, i) =>
      tieBreak(toCandidates(pool.slice(0, 2 + (i % 3)), () => true), ctx),
    );
    expect(picks).toEqual(['a', 'b', 'd', 'b', 'a', 'c', 'a', 'b', 'd', 'a', 'b', 'a']);
  });

  it('spreads picks across all candidates (deterministic uniformity smoke, 30k fixed-seed ties)', () => {
    // Seeded ⇒ this assertion cannot flake; it only catches a broken mapping
    // (e.g. an off-by-one that can never return the last candidate).
    const N = 30_000;
    const rng = createRng(PINNED_SEED);
    const ctx = { policy: 'random' as const, rng };
    const tally: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < N; i++) {
      const winner = tieBreak(ordered('a', 'b', 'c'), ctx);
      tally[winner] = (tally[winner] ?? 0) + 1;
    }
    for (const key of ['a', 'b', 'c']) {
      const share = (tally[key] ?? 0) / N;
      expect(share, `bucket ${key} share ${share}`).toBeGreaterThanOrEqual(0.3);
      expect(share, `bucket ${key} share ${share}`).toBeLessThanOrEqual(0.36);
    }
    expect(rng.draws).toBe(N);
  });
});

describe('R10: the random result depends on the candidate SET, not caller order', () => {
  it('resolves the same winner for a scrambled assembly order', () => {
    const ascending = [cand('a', 0), cand('b', 1), cand('c', 2), cand('d', 3)];
    const scrambled = [cand('c', 2), cand('a', 0), cand('d', 3), cand('b', 1)];
    const one = tieBreak(ascending, { policy: 'random', rng: createRng(PINNED_SEED) });
    const two = tieBreak(scrambled, { policy: 'random', rng: createRng(PINNED_SEED) });
    expect(two).toBe(one);
  });

  it('holds across a whole sequence, not just the first pick', () => {
    const values = ['a', 'b', 'c', 'd'];
    const rngA = createRng(PINNED_SEED);
    const rngB = createRng(PINNED_SEED);
    const seqA = Array.from({ length: 20 }, () =>
      tieBreak(
        values.map((v, i) => cand(v, i)),
        { policy: 'random', rng: rngA },
      ),
    );
    const seqB = Array.from({ length: 20 }, () =>
      tieBreak(
        values.map((v, i) => cand(v, i)).reverse(),
        { policy: 'random', rng: rngB },
      ),
    );
    expect(seqB).toEqual(seqA);
  });
});

// ───────────────────────────── R7 / R9 — purity ─────────────────────────────

describe('R7: the caller\u2019s array is never mutated or reordered in place', () => {
  it('leaves element order untouched under the random policy', () => {
    const candidates = [cand('c', 2), cand('a', 0), cand('d', 3), cand('b', 1)];
    const snapshot = [...candidates];
    tieBreak(candidates, { policy: 'random', rng: createRng(PINNED_SEED) });
    expect(candidates).toEqual(snapshot);
    expect(candidates[0]).toBe(snapshot[0]);
  });

  it('leaves element order untouched under the index policy', () => {
    const candidates = [cand('c', 2), cand('a', 0), cand('b', 1)];
    const snapshot = [...candidates];
    tieBreak(candidates, { policy: 'index' });
    expect(candidates).toEqual(snapshot);
  });

  it('accepts a frozen array (an in-place sort would throw)', () => {
    const frozen = Object.freeze([cand('c', 2), cand('a', 0), cand('b', 1)]);
    expect(() => tieBreak(frozen, { policy: 'random', rng: createRng(PINNED_SEED) })).not.toThrow();
    expect(() => tieBreak(frozen, { policy: 'index' })).not.toThrow();
  });
});

describe('R9: ctx.reason is a debug label only', () => {
  it('does not change the index-policy result', () => {
    const candidates = ordered('a', 'b', 'c');
    expect(tieBreak(candidates, { policy: 'index', reason: 'lowest-hp target' })).toBe(
      tieBreak(candidates, { policy: 'index' }),
    );
  });

  it('does not change the random-policy result or the draw count', () => {
    const candidates = ordered('a', 'b', 'c');
    const withReason = createRng(PINNED_SEED);
    const without = createRng(PINNED_SEED);
    const a = tieBreak(candidates, {
      policy: 'random',
      rng: withReason,
      reason: 'council deciding vote',
    });
    const b = tieBreak(candidates, { policy: 'random', rng: without });
    expect(a).toBe(b);
    expect(withReason.draws).toBe(without.draws);
  });
});

// ───────────────────────────── helpers: toCandidates / createTieBreaker ─────────────────────────────

describe('toCandidates: builds candidates carrying their data-file position', () => {
  const heroes = ['garrett', 'fiona', 'selene'];

  it('keeps the source position as .index, not the position in the filtered subset', () => {
    const kept = toCandidates(heroes, (v) => v !== 'garrett');
    expect(kept).toEqual([
      { value: 'fiona', index: 1 },
      { value: 'selene', index: 2 },
    ]);
  });

  it('passes both value and source position to the predicate', () => {
    const seen: Array<[string, number]> = [];
    toCandidates(heroes, (v, i) => {
      seen.push([v, i]);
      return true;
    });
    expect(seen).toEqual([
      ['garrett', 0],
      ['fiona', 1],
      ['selene', 2],
    ]);
  });

  it('returns [] when nothing matches (the caller then hits R1)', () => {
    expect(toCandidates(heroes, () => false)).toEqual([]);
    expect(() => tieBreak(toCandidates(heroes, () => false), { policy: 'index' })).toThrow(
      RangeError,
    );
  });

  it('does not mutate the source array', () => {
    const source = [...heroes];
    toCandidates(source, () => true);
    expect(source).toEqual(heroes);
  });

  it('offsets indexes when a caller needs one index space across two arrays', () => {
    const enemies = ['golem', 'spirit'];
    const merged = [...toCandidates(heroes, () => true), ...toCandidates(enemies, () => true, 3)];
    expect(merged.map((c) => c.index)).toEqual([0, 1, 2, 3, 4]);
    expect(tieBreak(merged, { policy: 'index' })).toBe('garrett');
  });
});

describe('createTieBreaker: binds a ctx once at boot', () => {
  it('returns a function that applies the bound policy', () => {
    const pickLowest = createTieBreaker({ policy: 'index' });
    expect(pickLowest([cand('c', 2), cand('a', 0)])).toBe('a');
  });

  it('keeps using the same injected rng across calls (draws accumulate)', () => {
    const rng = createRng(PINNED_SEED);
    const pick = createTieBreaker({ policy: 'random', rng });
    const picks = Array.from({ length: 8 }, () => pick(ordered('a', 'b', 'c', 'd')));
    expect(picks).toEqual(['a', 'c', 'd', 'c', 'a', 'c', 'a', 'b']);
    expect(rng.draws).toBe(8);
  });

  it('is generic — one bound breaker serves heroes, enemies and council options', () => {
    const pick = createTieBreaker({ policy: 'index' });
    expect(pick([cand({ id: 'hero' }, 1), cand({ id: 'enemy' }, 0)])).toEqual({ id: 'enemy' });
    expect(pick([cand(10, 5), cand(20, 4)])).toBe(20);
  });

  it('propagates the same errors as tieBreak', () => {
    expect(() => createTieBreaker({ policy: 'index' })([])).toThrow(RangeError);
    expect(() => createTieBreaker({ policy: 'random' })(ordered('a', 'b'))).toThrow(TypeError);
  });
});

// ───────────────────────────── AC2b — suite-wide guard ─────────────────────────────

describe('AC2b: the random policy appears in exactly two files of the suite', () => {
  // PRD §5: "All automated gates run stub mode … and tieBreak policy index …
  // The random policy gets its own unit test with a fixed seed; nothing else in
  // the suite ever sees it." Extending this allowlist is a reviewed one-line
  // change — see discovery/u3.md. No comment-marker escape hatch.
  const ALLOWLIST = ['tests/core/tiebreak.test.ts', 'tests/core/rng.test.ts'];
  const BANNED = [/policy\s*:\s*['"]random['"]/, /['"]random['"]\s+as\s+TieBreakPolicy/];

  // Inlined on purpose (not a shared helper): a shared walker is one file whose
  // edit would neuter both guards in this unit at once.
  const walk = (dir: string): string[] => {
    let out: string[] = [];
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return out; // dir absent in this checkout — skipped, not fatal
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) out = out.concat(walk(full));
      else if (/\.(ts|tsx|mts|js|mjs)$/.test(e.name)) out.push(full);
    }
    return out;
  };

  const files = [...walk(join(root, 'tests')), ...walk(join(root, 'e2e'))];

  it('found suite files to scan (guard is not vacuously green)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('finds zero hits outside the allowlist', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = relative(root, file).split('\\').join('/');
      if (ALLOWLIST.includes(rel)) continue;
      const text = readFileSync(file, 'utf8');
      if (BANNED.some((re) => re.test(text))) offenders.push(rel);
    }
    expect(offenders, `random tie-break policy leaked into: ${offenders.join(', ')}`).toEqual([]);
  });

  it('the allowlisted files really do exercise the random policy', () => {
    for (const rel of ALLOWLIST) {
      const text = readFileSync(join(root, rel), 'utf8');
      expect(BANNED.some((re) => re.test(text)), `${rel} no longer covers the random policy`).toBe(
        true,
      );
    }
  });
});
