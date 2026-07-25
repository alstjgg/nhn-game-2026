// u3 — outcome resolver. Lookup key = SORTED ingredient ids + method + declaration
// (PRD §2). Ingredient order must not matter (F5); method/declaration are matched
// VERBATIM (case-sensitive, not sorted). Every lookup is total: an unlisted
// selection resolves to the table's required `default` — never undefined, never a
// throw (F3, no dead-ends).
import type { CraftSelection, Outcome, OutcomeTable } from './schema';

/**
 * Canonicalize a craft into a comparable key. Ingredient ids are sorted (so the
 * player may send them in any order), while method + declaration are kept
 * verbatim — a differing multiset of ids, or a differing (case-sensitive)
 * method/declaration, yields a different key.
 */
export function canonicalKey(
  ingredientIds: readonly string[],
  method: string,
  declaration: string,
): string {
  const sortedIds = [...ingredientIds].sort();
  // JSON-encode the id list (bracketed, quoted) then NUL-separate the verbatim
  // method/declaration so no field boundary can collide with another's content.
  return `${JSON.stringify(sortedIds)}\u0000${method}\u0000${declaration}`;
}

/**
 * Resolve a committed craft against a customer's outcome table. Returns the exact
 * matching entry's outcome; failing that the table's `nearMiss` when the craft got
 * the INGREDIENTS of an intended remedy right and only prepared them differently
 * (PR #33, R3 — the diagnosis is the ingredient list, so that much of the player's
 * clue work is answered rather than flattened into "no effect"); failing that the
 * required `default`. Total by construction: always returns an Outcome, never
 * throws, and the exact-match result is unchanged.
 */
export function resolveOutcome(table: OutcomeTable, selection: CraftSelection): Outcome {
  const key = canonicalKey(selection.ingredientIds, selection.method, selection.declaration);
  for (const entry of table.entries) {
    if (canonicalKey(entry.ingredients, entry.method, entry.declaration) === key) {
      return entry.outcome;
    }
  }
  if (table.nearMiss !== undefined && matchesIntendedIngredients(table, selection)) {
    return table.nearMiss;
  }
  return table.default;
}

/**
 * Did the craft pick exactly the ingredient multiset of SOME intended remedy?
 * Order-insensitive (F5), like the full key — only `method`/`declaration` differ.
 */
function matchesIntendedIngredients(table: OutcomeTable, selection: CraftSelection): boolean {
  const chosen = ingredientKey(selection.ingredientIds);
  return table.entries.some((entry) => ingredientKey(entry.ingredients) === chosen);
}

function ingredientKey(ids: readonly string[]): string {
  return JSON.stringify([...ids].sort());
}
