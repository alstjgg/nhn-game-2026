// u3 resolver tests — AC4 (exact hit incl. reordered ids), AC5 (total → default,
// never undefined/throw), AC6 (method/declaration matched verbatim). Plus direct
// canonicalKey checks. Pure logic, no DOM (PRD §5, N4).
// TDD-Red: src/data/{schema,outcome}.ts do not exist yet → these fail on import.
import { describe, it, expect } from 'vitest';
import { resolveOutcome, canonicalKey } from '../../src/data/outcome';
import type { Outcome, CraftSelection } from '../../src/data/schema';
import { outcomeTable, craftSelection } from './fixtures/index';

// ── AC4 — exact match on sorted ids + method + declaration (F4/F5) ───────────
describe('AC4 — resolver returns the exact matching outcome', () => {
  it('matches an entry when ids are given in stored order', () => {
    const table = outcomeTable();
    const out = resolveOutcome(
      table,
      craftSelection({ ingredientIds: ['herb_a', 'herb_b'], method: 'boil', declaration: 'orthodox' }),
    );
    expect(out).toEqual(table.entries[0].outcome);
  });

  it('matches the SAME entry when the ingredient id order is reversed (F5)', () => {
    const table = outcomeTable();
    const out = resolveOutcome(
      table,
      craftSelection({ ingredientIds: ['herb_b', 'herb_a'], method: 'boil', declaration: 'orthodox' }),
    );
    expect(out).toEqual(table.entries[0].outcome);
  });

  it('matches a single-ingredient entry too', () => {
    const table = outcomeTable();
    const out = resolveOutcome(
      table,
      craftSelection({ ingredientIds: ['herb_c'], method: 'grind', declaration: 'experiment' }),
    );
    expect(out).toEqual(table.entries[1].outcome);
  });
});

// ── AC5 — total function: any unlisted selection → default, never undefined/throw ─
describe('AC5 — unlisted selections fall through to `default` (no dead-ends)', () => {
  const table = outcomeTable();
  const cases: Array<[string, CraftSelection]> = [
    ['unknown ingredient ids', craftSelection({ ingredientIds: ['zzz'], method: 'boil', declaration: 'orthodox' })],
    ['wrong method', craftSelection({ ingredientIds: ['herb_a', 'herb_b'], method: 'grind', declaration: 'orthodox' })],
    ['wrong declaration', craftSelection({ ingredientIds: ['herb_a', 'herb_b'], method: 'boil', declaration: 'experiment' })],
    ['empty ingredient list', craftSelection({ ingredientIds: [], method: 'boil', declaration: 'orthodox' })],
    ['over-count list (>3)', craftSelection({ ingredientIds: ['herb_a', 'herb_b', 'herb_c', 'herb_a'], method: 'boil', declaration: 'orthodox' })],
  ];

  for (const [label, selection] of cases) {
    it(`returns default and does not throw for: ${label}`, () => {
      let out: Outcome | undefined;
      expect(() => {
        out = resolveOutcome(table, selection);
      }).not.toThrow();
      expect(out).not.toBeUndefined();
      expect(out).not.toBeNull();
      expect(out).toEqual(table.default);
    });
  }
});

// ── AC6 — method / declaration are verbatim (not sorted, not case-folded) ─────
describe('AC6 — method/declaration matched verbatim', () => {
  it('a case-differing method does NOT match the entry (falls to default)', () => {
    const table = outcomeTable();
    const out = resolveOutcome(
      table,
      craftSelection({ ingredientIds: ['herb_a', 'herb_b'], method: 'BOIL', declaration: 'orthodox' }),
    );
    expect(out).toEqual(table.default);
  });

  it('a case-differing declaration does NOT match the entry (falls to default)', () => {
    const table = outcomeTable();
    const out = resolveOutcome(
      table,
      craftSelection({ ingredientIds: ['herb_a', 'herb_b'], method: 'boil', declaration: 'ORTHODOX' }),
    );
    expect(out).toEqual(table.default);
  });

  it('an entry differing only in method is not returned for a mismatching selection', () => {
    const table = outcomeTable();
    // herb_a+herb_b is stored with method 'boil'; asking for 'steep' must miss.
    const out = resolveOutcome(
      table,
      craftSelection({ ingredientIds: ['herb_a', 'herb_b'], method: 'steep', declaration: 'orthodox' }),
    );
    expect(out).toEqual(table.default);
  });
});

// ── canonicalKey — order-insensitive ids, verbatim method/declaration ────────
describe('canonicalKey', () => {
  it('is identical for reordered ingredient ids', () => {
    expect(canonicalKey(['a', 'b'], 'm', 'd')).toBe(canonicalKey(['b', 'a'], 'm', 'd'));
  });

  it('differs when the method differs (verbatim, case-sensitive)', () => {
    expect(canonicalKey(['a', 'b'], 'm', 'd')).not.toBe(canonicalKey(['a', 'b'], 'M', 'd'));
  });

  it('differs when the declaration differs (verbatim, case-sensitive)', () => {
    expect(canonicalKey(['a', 'b'], 'm', 'd')).not.toBe(canonicalKey(['a', 'b'], 'm', 'D'));
  });

  it('differs when the id multiset differs', () => {
    expect(canonicalKey(['a', 'b'], 'm', 'd')).not.toBe(canonicalKey(['a'], 'm', 'd'));
  });
});
