// TDD-Red pure-logic slice for u7 — crafting selection model + config.
// Pure, node env, no DOM (the browser behaviour lives in e2e/crafting.spec.ts).
// Binds to the frozen §4 API in .claude/super/units/u7/design.md:
//   createSelection / toggleIngredient / setMethod / setDeclaration /
//   isCommitReady / buildCraftSelection, and the balance-as-data CRAFTING_CONFIG.
// These fail loudly on import until src/screens/crafting/{selection,config}.ts exist.
import { describe, expect, it } from 'vitest';
import {
  createSelection,
  toggleIngredient,
  setMethod,
  setDeclaration,
  isCommitReady,
  buildCraftSelection,
  type SelectionModel,
} from '../../../src/screens/crafting/selection';
import { CRAFTING_CONFIG } from '../../../src/screens/crafting/config';

const DEF = '정석';

describe('CRAFTING_CONFIG (balance-as-data, N6)', () => {
  it('carries the canonical method verbs, declarations, default, and 1–3 bounds', () => {
    expect(CRAFTING_CONFIG.methods).toEqual(['우리기', '달이기', '빻기']);
    expect(CRAFTING_CONFIG.declarations).toEqual(['정석', '실험']);
    expect(CRAFTING_CONFIG.defaultDeclaration).toBe('정석');
    expect(CRAFTING_CONFIG.minIngredients).toBe(1);
    expect(CRAFTING_CONFIG.maxIngredients).toBe(3);
  });

  it('is frozen (data authors edit JSON, not runtime state)', () => {
    expect(Object.isFrozen(CRAFTING_CONFIG)).toBe(true);
  });
});

describe('createSelection', () => {
  it('starts empty with no method and the supplied default declaration (F4/AC6)', () => {
    const m = createSelection(DEF);
    expect(m.ingredientIds).toEqual([]);
    expect(m.method).toBeNull();
    expect(m.declaration).toBe(DEF);
  });
});

describe('toggleIngredient (1–3 clamp, F2/AC4)', () => {
  it('adds an absent id', () => {
    const m = toggleIngredient(createSelection(DEF), 'gamcho', 3);
    expect(m.ingredientIds).toEqual(['gamcho']);
  });

  it('removes a present id', () => {
    let m = createSelection(DEF);
    m = toggleIngredient(m, 'gamcho', 3);
    m = toggleIngredient(m, 'gamcho', 3);
    expect(m.ingredientIds).toEqual([]);
  });

  it('is an identity no-op when adding a 4th over the max', () => {
    let m = createSelection(DEF);
    for (const id of ['a', 'b', 'c']) m = toggleIngredient(m, id, 3);
    expect(m.ingredientIds).toHaveLength(3);
    const blocked = toggleIngredient(m, 'd', 3);
    expect(blocked, 'over-cap toggle must return the SAME reference (no-op)').toBe(m);
    expect(blocked.ingredientIds).toHaveLength(3);
  });

  it('still removes at the cap (a present id can be toggled off even when full)', () => {
    let m = createSelection(DEF);
    for (const id of ['a', 'b', 'c']) m = toggleIngredient(m, id, 3);
    const removed = toggleIngredient(m, 'b', 3);
    expect(removed.ingredientIds).toEqual(['a', 'c']);
  });

  it('does not mutate the input model (immutable update)', () => {
    const m = createSelection(DEF);
    const next = toggleIngredient(m, 'gamcho', 3);
    expect(m.ingredientIds).toEqual([]);
    expect(next).not.toBe(m);
  });
});

describe('setMethod / setDeclaration (single-select replace, F3/F4)', () => {
  it('setMethod replaces the method', () => {
    let m = setMethod(createSelection(DEF), '우리기');
    expect(m.method).toBe('우리기');
    m = setMethod(m, '달이기');
    expect(m.method).toBe('달이기');
  });

  it('setDeclaration replaces the declaration', () => {
    const m = setDeclaration(createSelection(DEF), '실험');
    expect(m.declaration).toBe('실험');
  });
});

describe('isCommitReady (enable predicate, F5/AC7)', () => {
  const base: SelectionModel = { ingredientIds: ['a'], method: '우리기', declaration: DEF };

  it('is true with >=min ingredients and a method', () => {
    expect(isCommitReady(base, 1)).toBe(true);
  });

  it('is false with no method', () => {
    expect(isCommitReady({ ...base, method: null }, 1)).toBe(false);
  });

  it('is false below the min ingredient count', () => {
    expect(isCommitReady({ ...base, ingredientIds: [] }, 1)).toBe(false);
  });
});

describe('buildCraftSelection (canonical CraftSelection, AC9)', () => {
  it('sorts ingredient ids and passes method/declaration verbatim', () => {
    const m: SelectionModel = {
      ingredientIds: ['gukhwa', 'daechu', 'bakha'],
      method: '달이기',
      declaration: '실험',
    };
    const sel = buildCraftSelection(m);
    expect(sel.ingredientIds).toEqual(['bakha', 'daechu', 'gukhwa']);
    expect(sel.method).toBe('달이기');
    expect(sel.declaration).toBe('실험');
  });
});
