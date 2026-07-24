// selection.ts — pure crafting selection model (design §4). No DOM: the model is
// the single source of truth the view renders. Updates are immutable (return a new
// SelectionModel, never mutate) and identity-equal no-ops on illegal moves, mirroring
// the state reducer convention (src/state/index.ts).
import type { CraftSelection } from '../../data/schema';

export interface SelectionModel {
  /** Chosen ingredient ids in insertion order; length ≤ max. */
  readonly ingredientIds: readonly string[];
  /** One of CRAFTING_CONFIG.methods, or null until a method is picked. */
  readonly method: string | null;
  /** Always set; starts at the supplied default declaration. */
  readonly declaration: string;
}

/** Empty selection with no method and the supplied default declaration (F4/AC6). */
export function createSelection(defaultDeclaration: string): SelectionModel {
  return { ingredientIds: [], method: null, declaration: defaultDeclaration };
}

/**
 * Toggle an ingredient id (F2/AC4). Present → removed; absent with room → added;
 * absent at the cap → identity no-op (SAME reference, so a blocked 4th never mutates).
 */
export function toggleIngredient(m: SelectionModel, id: string, max: number): SelectionModel {
  if (m.ingredientIds.includes(id)) {
    return { ...m, ingredientIds: m.ingredientIds.filter((x) => x !== id) };
  }
  if (m.ingredientIds.length >= max) {
    return m;
  }
  return { ...m, ingredientIds: [...m.ingredientIds, id] };
}

/** Single-select replace of the method (F3). */
export function setMethod(m: SelectionModel, method: string): SelectionModel {
  return { ...m, method };
}

/** Two-state replace of the declaration (F4). */
export function setDeclaration(m: SelectionModel, declaration: string): SelectionModel {
  return { ...m, declaration };
}

/** Enable predicate for [건네기] (F5/AC7): ≥min ingredients AND a chosen method. */
export function isCommitReady(m: SelectionModel, min: number): boolean {
  return m.ingredientIds.length >= min && m.method !== null;
}

/**
 * Build the canonical CraftSelection to resolve (AC9). Ingredient ids are sorted
 * (order-independent key, PRD §2); method/declaration pass through verbatim.
 * Precondition: isCommitReady(m) — method is non-null at commit.
 */
export function buildCraftSelection(m: SelectionModel): CraftSelection {
  if (m.method === null) {
    throw new Error('buildCraftSelection: called before a method was selected');
  }
  return {
    ingredientIds: [...m.ingredientIds].sort(),
    method: m.method,
    declaration: m.declaration,
  };
}
