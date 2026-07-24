// TDD slice for u7 — crafting config invariant hardening (Lead review, PR #27).
// loadConfig now validates value invariants beyond shape (min>=1, min<=max,
// non-empty methods/declarations) in addition to the pre-existing shape/type
// and defaultDeclaration-membership checks. These tests exercise both the
// shipped CRAFTING_CONFIG (positive path) and loadConfig directly with
// injected bad shapes (negative path, via the exported loader).
import { describe, expect, it } from 'vitest';
import { CRAFTING_CONFIG, loadConfig } from '../../../src/screens/crafting/config';

const VALID = {
  methods: ['우리기', '달이기', '빻기'],
  declarations: ['정석', '실험'],
  defaultDeclaration: '정석',
  minIngredients: 1,
  maxIngredients: 3,
};

describe('CRAFTING_CONFIG invariants (loadConfig hardening, Lead review PR #27)', () => {
  it('has at least one method', () => {
    expect(CRAFTING_CONFIG.methods.length).toBeGreaterThan(0);
  });

  it('has at least one declaration', () => {
    expect(CRAFTING_CONFIG.declarations.length).toBeGreaterThan(0);
  });

  it('has minIngredients >= 1', () => {
    expect(CRAFTING_CONFIG.minIngredients).toBeGreaterThanOrEqual(1);
  });

  it('has minIngredients <= maxIngredients', () => {
    expect(CRAFTING_CONFIG.minIngredients).toBeLessThanOrEqual(CRAFTING_CONFIG.maxIngredients);
  });

  it('has a defaultDeclaration that is one of declarations', () => {
    expect(CRAFTING_CONFIG.declarations).toContain(CRAFTING_CONFIG.defaultDeclaration);
  });
});

describe('loadConfig (direct guard tests, Lead review PR #27)', () => {
  it('accepts a well-formed config', () => {
    expect(() => loadConfig(VALID)).not.toThrow();
  });

  it('rejects an empty methods array', () => {
    expect(() => loadConfig({ ...VALID, methods: [] })).toThrow(/methods.*non-empty/);
  });

  it('rejects an empty declarations array', () => {
    expect(() => loadConfig({ ...VALID, declarations: [] })).toThrow(/declarations.*non-empty/);
  });

  it('rejects minIngredients < 1', () => {
    expect(() => loadConfig({ ...VALID, minIngredients: 0 })).toThrow(/minIngredients.*>= 1/);
  });

  it('rejects a negative minIngredients', () => {
    expect(() => loadConfig({ ...VALID, minIngredients: -1 })).toThrow(/minIngredients.*>= 1/);
  });

  it('rejects minIngredients > maxIngredients', () => {
    expect(() => loadConfig({ ...VALID, minIngredients: 3, maxIngredients: 1 })).toThrow(
      /minIngredients.*maxIngredients/,
    );
  });

  it('rejects defaultDeclaration not present in declarations', () => {
    expect(() => loadConfig({ ...VALID, defaultDeclaration: '없음' })).toThrow(
      /defaultDeclaration/,
    );
  });
});
