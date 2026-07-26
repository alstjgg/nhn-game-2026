// Asset harness — mounts one element per PRD §2.8 slot plus the sheet-cell grids, so a
// browser can prove what a text test cannot: what each slot actually PAINTS.
//
// It adds no styling of its own. Every pixel number comes from u7 (`slots.css`); the
// cells set `--cell-col` / `--cell-row` only, and the pack urls come from `assets.css`
// through `src/assets/slots.ts`. With a pack file absent its slot simply keeps u7's
// CSS-only fallback — which is the assertion `e2e/assets.spec.ts` makes.
import '../../../src/styles/tokens.css';
import '../../../src/styles/slots.css';
import {
  ASSET_SLOTS,
  HERO_SLOT_BY_ID,
  MONSTER_SLOT_BY_ID,
  type AssetSlot,
} from '../../../src/assets/slots.ts';

// `window.__assets` is declared once, by the spec that reads it (e2e/assets.spec.ts).

/** slot id → the domain id `assets.css` keys that sheet off (heroes and monsters only). */
const UNIT_ID_BY_SLOT: Record<string, string> = Object.fromEntries(
  [...Object.entries(HERO_SLOT_BY_ID), ...Object.entries(MONSTER_SLOT_BY_ID)].map(
    ([unitId, slotId]) => [slotId, unitId],
  ),
);

const root = document.querySelector<HTMLElement>('#harness');
if (root === null) {
  throw new Error('asset harness: no #harness mount point');
}

/** The u7 class name behind a slot's `.slot-*` selector. */
const className = (slot: AssetSlot): string => slot.cls.replace(/^\./, '');

function createSlot(slot: AssetSlot): HTMLElement {
  const el = document.createElement('div');
  el.className = className(slot);
  el.dataset.testid = `slot-${slot.id}`;
  el.dataset.slotId = slot.id;
  el.dataset.file = slot.file;
  const unitId = UNIT_ID_BY_SLOT[slot.id];
  if (unitId !== undefined) el.dataset.unitId = unitId;
  return el;
}

function createGrid(testid: string, slot: AssetSlot): HTMLElement {
  const grid = document.createElement('div');
  grid.dataset.testid = testid;
  const unitId = UNIT_ID_BY_SLOT[slot.id];
  for (let row = 0; row < slot.rows; row += 1) {
    for (let col = 0; col < slot.cols; col += 1) {
      const cell = document.createElement('div');
      cell.className = className(slot);
      cell.dataset.col = String(col);
      cell.dataset.row = String(row);
      if (unitId !== undefined) cell.dataset.unitId = unitId;
      cell.style.setProperty('--cell-col', String(col));
      cell.style.setProperty('--cell-row', String(row));
      grid.append(cell);
    }
  }
  return grid;
}

/** The four gauge tiers `slots.css` gives the vial sheet a cell each. */
const VIAL_STATES = ['calm', 'uneasy', 'limit', 'overload'] as const;

function createVialRow(slot: AssetSlot): HTMLElement {
  const row = document.createElement('div');
  row.dataset.testid = 'vial-cells';
  for (const state of VIAL_STATES) {
    const vial = document.createElement('div');
    vial.className = className(slot);
    vial.dataset.state = state;
    row.append(vial);
  }
  return row;
}

const slots = document.createElement('div');
slots.dataset.testid = 'slot-list';
for (const slot of ASSET_SLOTS) slots.append(createSlot(slot));
root.append(slots);

const gridOf = (id: string): AssetSlot => {
  const slot = ASSET_SLOTS.find((entry) => entry.id === id);
  if (slot === undefined) throw new Error(`asset harness: no slot "${id}"`);
  return slot;
};

root.append(
  createGrid('hero-cells', gridOf('hero-garrett')),
  createGrid('mob-cells', gridOf('mob-spam-golem')),
  createGrid('icon-cells', gridOf('card-icons')),
  createVialRow(gridOf('ui-vial')),
);

window.__assets = { slots: [...ASSET_SLOTS] };
