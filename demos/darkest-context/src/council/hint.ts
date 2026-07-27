// u11 — the 「번역 렌즈」 clue (PRD §2.6).
//
// The lens is never named here. A hint is revealed when ANY unit at the table carries a
// card whose `engineHook.kind` is `council_hint`, so a future card with the same hook
// works unchanged and no card id is hardcoded into the engine (INV-8).

import type { Agenda, Card } from '../data/schema.ts';

import type { CouncilHint, CouncilUnit } from './types.ts';

/** The hook a card declares to put a clue on the table. */
export const COUNCIL_HINT_HOOK = 'council_hint';

/**
 * The clue the party already holds, or null when nobody carries a hint card — or when the
 * agenda authored no line to reveal. Party order decides which card speaks when two would.
 */
export function revealHint(
  agenda: Agenda,
  units: readonly CouncilUnit[],
  cards: readonly Card[],
): CouncilHint | null {
  const line = agenda.hintLine;
  if (line === null || line === '') return null;

  const hintCardIds = new Set(
    cards.filter((card) => card.engineHook?.kind === COUNCIL_HINT_HOOK).map((card) => card.id),
  );
  if (hintCardIds.size === 0) return null;

  for (const unit of units) {
    for (const cardId of unit.equippedCardIds) {
      if (hintCardIds.has(cardId)) return { unitId: unit.id, cardId, line };
    }
  }
  return null;
}
