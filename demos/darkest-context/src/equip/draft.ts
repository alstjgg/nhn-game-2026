// u12 — the 훈련장 draft (PRD §2.7): 3 cards fan out, the player picks one, the player
// picks a unit.
//
// Nothing here shuffles: the options are rendered in the order data/council.json
// authored them, so a run is reproducible and a reviewer can read the tile's pool off
// the data file (A4). `targetChoices` is the free-assignment half — it lists EVERY unit
// and only marks the ones the rules of PRD §2.3 block, with the reason attached.

import { resolveTuningRef } from '../data/loader';
import type { Card, Grant, SlotTuning, Tuning } from '../data/schema';
import { canEquip } from './loadout';
import type { PartyLoadout, TargetChoice } from './types';

function requireDraft(grant: Grant): Extract<Grant, { kind: 'draft' }> {
  if (grant.kind !== 'draft') {
    throw new Error(`grant is not a draft (kind '${grant.kind}') — nothing to fan out`);
  }
  return grant;
}

/** The cards a draft tile offers, resolved and in authored order. */
export function draftOptions(grant: Grant, cards: readonly Card[], tuning: Tuning): Card[] {
  const draft = requireDraft(grant);

  const options = draft.optionCardIds.map((cardId) => {
    const found = cards.find((card) => card.id === cardId);
    if (found === undefined) {
      throw new Error(`draft option '${cardId}' is absent from the card table`);
    }
    return found;
  });

  const count = resolveTuningRef(tuning, draft.countRef);
  if (options.length !== count) {
    throw new Error(
      `draft offers ${options.length} options but '${draft.countRef}' says ${count}`,
    );
  }
  return options;
}

/** How many of those options the player keeps — one per 훈련장 visit. */
export function draftPickCount(grant: Grant, tuning: Tuning): number {
  return resolveTuningRef(tuning, requireDraft(grant).pickCountRef);
}

/**
 * Every unit the picked card may be aimed at. Read-only: the list is the same for
 * every card the player could have pressed, minus the units the duplicate rule or a
 * spent slot kind blocks — and a blocked unit is nothing but a disabled row.
 */
export function targetChoices(
  party: PartyLoadout,
  card: Card,
  slots: SlotTuning,
): TargetChoice[] {
  return party.units.map((unit) => {
    const check = canEquip(party, unit.unitId, card, slots);
    return check.ok
      ? { unitId: unit.unitId, enabled: true }
      : { unitId: unit.unitId, enabled: false, reason: check.reason };
  });
}
