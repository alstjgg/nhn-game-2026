// u12 — slot capacity and the two assignment rules of PRD §2.3.
//
// Every function here is pure and returns new state: the engine NEVER picks a card and
// NEVER picks a target (A6). It only answers two questions the player's click asks —
// "how much room is left" and "may this card go on this unit" — and stamps the equip
// with the next seq so 휴식 ②Clear stays deterministic.
//
// Capacity numbers come in as `SlotTuning` (data/tuning.json, INV-8); no literal
// 3 · 2 · 3 lives in this file.

import type { Card, SlotKind, SlotTuning } from '../data/schema';
import type { EquipCheck, PartyLoadout, UnitLoadout } from './types';

/** A party of empty loadouts, in the order the caller listed its units. */
export function createLoadout(unitIds: readonly string[]): PartyLoadout {
  return {
    units: unitIds.map((unitId) => ({ unitId, equipped: [] })),
    nextSeq: 0,
  };
}

function findUnit(party: PartyLoadout, unitId: string): UnitLoadout | undefined {
  return party.units.find((unit) => unit.unitId === unitId);
}

function requireUnit(party: PartyLoadout, unitId: string): UnitLoadout {
  const unit = findUnit(party, unitId);
  if (unit === undefined) {
    throw new Error(`unknown unit '${unitId}' — the party holds no loadout for it`);
  }
  return unit;
}

/** Slots still free on one unit, per kind — what the 훈련장 meter renders (A7). */
export function remainingCapacity(
  party: PartyLoadout,
  unitId: string,
  slots: SlotTuning,
): Record<SlotKind, number> {
  const unit = requireUnit(party, unitId);
  const spent = (kind: SlotKind): number =>
    unit.equipped.filter((entry) => entry.slotKind === kind).length;

  return {
    prompt: slots.prompt - spent('prompt'),
    skill: slots.skill - spent('skill'),
    mcp: slots.mcp - spent('mcp'),
  };
}

/**
 * May this card go on this unit? Read-only — it moves nothing.
 *
 * The rule order is the player-facing one: an unknown unit is a programming error, the
 * duplicate rule (PRD §2.3) outranks capacity so the picker names the real cause, and
 * `full` is the last thing left to say.
 */
export function canEquip(
  party: PartyLoadout,
  unitId: string,
  card: Card,
  slots: SlotTuning,
): EquipCheck {
  const unit = findUnit(party, unitId);
  if (unit === undefined) return { ok: false, reason: 'unknown-unit' };

  if (unit.equipped.some((entry) => entry.cardId === card.id)) {
    return { ok: false, reason: 'duplicate' };
  }
  if (remainingCapacity(party, unitId, slots)[card.slotKind] <= 0) {
    return { ok: false, reason: 'full' };
  }
  return { ok: true };
}

/**
 * Puts the card the player chose on the unit the player chose, and hands back a new
 * party. Throws on an illegal pair — the UI asks `canEquip` first and disables the
 * target, so reaching this throw means the caller ignored the answer.
 */
export function equipCard(
  party: PartyLoadout,
  unitId: string,
  card: Card,
  slots: SlotTuning,
): PartyLoadout {
  const check = canEquip(party, unitId, card, slots);
  if (!check.ok) {
    throw new Error(`cannot equip '${card.id}' on '${unitId}': ${check.reason}`);
  }

  return {
    units: party.units.map((unit) =>
      unit.unitId === unitId
        ? {
            unitId: unit.unitId,
            equipped: [
              ...unit.equipped,
              { cardId: card.id, slotKind: card.slotKind, seq: party.nextSeq },
            ],
          }
        : unit,
    ),
    nextSeq: party.nextSeq + 1,
  };
}
