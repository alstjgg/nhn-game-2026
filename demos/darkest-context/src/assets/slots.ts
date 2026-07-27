// The asset-slot inventory (PRD §2.8) — the one place that maps a domain id onto the
// PROVIDED pack file and the u7 slot it paints into.
//
// Data only: no DOM, no fetch, no generation. Importing it also pulls `assets.css`
// into the app graph, which is what actually fills u7's seam — `slots.css` names the
// `--slot-*` properties, `assets.css` assigns them, this module is the bridge.
import '../styles/assets.css';

export interface AssetSlot {
  /** Stable slot id, e.g. 'hero-garrett'. */
  readonly id: string;
  /** Filename under demos/darkest-context/assets/. */
  readonly file: string;
  /** u7 custom property the image arrives through. Never a new name. */
  readonly prop: string;
  /** u7 class that paints the slot. Never a new name. */
  readonly cls: string;
  /** Sheet columns — 1 when the asset is not a sheet. */
  readonly cols: number;
  /** Sheet rows — 1 when the asset is not a sheet. */
  readonly rows: number;
}

/**
 * The ten pack files, in PRD §2.8 asset-table order.
 *
 * The monster sheet's "2×3" is read as 3 cols × 2 rows — u7's reading, the only one
 * that fits "idle · 피격 · 사망 / 공격 3프레임" plus the steps(3) attack loop.
 */
export const ASSET_SLOTS: readonly AssetSlot[] = [
  { id: 'bg-dungeon', file: 'bg-dungeon.png', prop: '--slot-bg-dungeon', cls: '.slot-bg-dungeon', cols: 1, rows: 1 },
  { id: 'hero-garrett', file: 'hero-garrett.png', prop: '--slot-hero', cls: '.slot-hero', cols: 4, rows: 3 },
  { id: 'hero-fiona', file: 'hero-fiona.png', prop: '--slot-hero', cls: '.slot-hero', cols: 4, rows: 3 },
  { id: 'hero-selene', file: 'hero-selene.png', prop: '--slot-hero', cls: '.slot-hero', cols: 4, rows: 3 },
  { id: 'mob-spam-golem', file: 'mob-spam-golem.png', prop: '--slot-mob', cls: '.slot-mob', cols: 3, rows: 2 },
  { id: 'mob-halluc-wisp', file: 'mob-halluc-wisp.png', prop: '--slot-mob', cls: '.slot-mob', cols: 3, rows: 2 },
  { id: 'ui-bubble', file: 'ui-bubble.png', prop: '--slot-bubble-frame', cls: '.slot-bubble-frame', cols: 1, rows: 1 },
  { id: 'ui-card-frame', file: 'ui-card-frame.png', prop: '--slot-card-frame', cls: '.slot-card-frame', cols: 1, rows: 1 },
  { id: 'card-icons', file: 'card-icons.png', prop: '--slot-card-icon', cls: '.slot-card-icon', cols: 4, rows: 3 },
  { id: 'ui-vial', file: 'ui-vial.png', prop: '--slot-vial', cls: '.slot-vial', cols: 4, rows: 1 },
];

/** hero id (data/heroes.json) → slot id. One sheet per hero, never shared. */
export const HERO_SLOT_BY_ID: Readonly<Record<string, string>> = {
  garrett: 'hero-garrett',
  fiona: 'hero-fiona',
  selene: 'hero-selene',
};

/** monster id (data/encounters.json) → slot id. One sheet per monster. */
export const MONSTER_SLOT_BY_ID: Readonly<Record<string, string>> = {
  spam_golem: 'mob-spam-golem',
  hallucination_spirit: 'mob-halluc-wisp',
};

/** The slot for a slot id. Throws rather than handing back `undefined`. */
export function slotFor(id: string): AssetSlot {
  const slot = ASSET_SLOTS.find((entry) => entry.id === id);
  if (slot === undefined) {
    throw new RangeError(`unknown asset slot id: "${id}"`);
  }
  return slot;
}
