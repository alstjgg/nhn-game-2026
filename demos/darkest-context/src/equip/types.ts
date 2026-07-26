// u12 — the value types of the equip core (PRD §2.3).
//
// A loadout is plain data: which cards a unit carries, which slot kind each one spent,
// and the order the party equipped them in. That order — `seq` — is the whole
// determinism seam of 휴식 ②Clear (PRD §2.7): "the earliest-equipped Prompt card across
// the party" is then a stable fact of the state, so the pick needs no RNG and no
// tie-break policy at all.

import type { SlotKind } from '../data/schema';

/** One equipped card. `seq` is monotonic across the WHOLE party, never per unit. */
export interface EquippedCard {
  cardId: string;
  slotKind: SlotKind;
  seq: number;
}

export interface UnitLoadout {
  unitId: string;
  equipped: EquippedCard[];
}

export interface PartyLoadout {
  units: UnitLoadout[];
  /** The seq the next equip will stamp. */
  nextSeq: number;
}

/**
 * Why a unit may not take a card. 강제 배분 is cut (PRD §1 does-NOT-do), so an
 * over-capacity unit is reported as `full` and simply sits disabled in the picker —
 * there is no third branch for the player to resolve.
 */
export type DenyReason = 'unknown-unit' | 'duplicate' | 'full';

export type EquipCheck = { ok: true } | { ok: false; reason: DenyReason };

/** One row of the 훈련장 target picker: free assignment, legality decided per unit. */
export interface TargetChoice {
  unitId: string;
  enabled: boolean;
  reason?: DenyReason;
}
