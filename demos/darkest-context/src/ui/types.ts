// The shared vocabulary of the primitive layer: the value types every factory
// speaks and the guards they validate with.
//
// Nothing here reads `document`. That is deliberate — every factory validates its
// input through these guards BEFORE it builds a node, so invalid data can never
// leave a half-built element behind (and the error contract stays testable in a
// DOM-less environment).

/** Card kinds. Told apart visually by CSS tint alone — PRD §2.8. */
export type CardType = 'prompt' | 'skill' | 'mcp';

/** Context-gauge tiers, ascending: 평온 / 불안 / 한계 / 폭주 — PRD §2.5. */
export type VialState = 'calm' | 'uneasy' | 'limit' | 'overload';

/** Which half of the stage a unit stands on — PRD §2.5 (heroes left, enemies right). */
export type UnitSide = 'hero' | 'enemy';

/** What a sheet row is: base persona line, an equipped card sentence, or a stat. */
export type SheetItemKind = 'persona' | 'card' | 'stat';

export const CARD_TYPES: readonly CardType[] = ['prompt', 'skill', 'mcp'];
export const VIAL_STATES: readonly VialState[] = ['calm', 'uneasy', 'limit', 'overload'];

/**
 * One addressable line of a unit's sheet. `id` is what a decision's `because`
 * cites (INV-3), so it must be stable and unique inside the unit.
 */
export interface SheetItem {
  id: string;
  kind: SheetItemKind;
  text: string;
}

/** Everything a primitive needs to draw one unit. */
export interface UnitView {
  id: string;
  name: string;
  side: UnitSide;
  /** Context gauge, 0–100. Tier thresholds are data, not UI — see vialStateForGauge. */
  gauge: number;
  items: SheetItem[];
  /**
   * Enemy-only: the MONSTER id (data/encounters.json), as opposed to `id`, which for an
   * enemy is the per-encounter instance id (so two of the same monster stay addressable).
   * The stage puts this on `data-monster-id`, which is what src/styles/assets.css keys
   * the `--slot-mob` asset off — one sheet per monster, shared across its instances.
   */
  monsterId?: string;
}

export function isCardType(value: unknown): value is CardType {
  return typeof value === 'string' && (CARD_TYPES as readonly string[]).includes(value);
}

export function isVialState(value: unknown): value is VialState {
  return typeof value === 'string' && (VIAL_STATES as readonly string[]).includes(value);
}

export function isUnitSide(value: unknown): value is UnitSide {
  return value === 'hero' || value === 'enemy';
}
