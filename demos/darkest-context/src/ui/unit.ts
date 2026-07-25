// Unit panel + unit sheet — the "click a unit, read why it is the way it is" pair
// (PRD §2.3).
//
// The panel is the HUD row: name + gauge vial, and it is a <button>, because
// opening a sheet is a verb and every verb is a click target (INV-1). The sheet is
// the detail view: base persona, the sentences its equipped cards added, and its
// stats — with the rows the latest decision cited highlighted, which is what makes
// attribution (INV-3) legible instead of merely present.

import { createVial } from './vial.ts';
import {
  isVialState,
  VIAL_STATES,
  type SheetItemKind,
  type UnitView,
  type VialState,
} from './types.ts';

export interface UnitPanelOptions {
  /**
   * Which tier the vial shows. Derive it with vialStateForGauge() and the
   * thresholds from data/tuning.json — the panel never converts a gauge itself.
   */
  vialState?: VialState;
  onSelect?: (unit: UnitView) => void;
}

export function createUnitPanel(unit: UnitView, options: UnitPanelOptions = {}): HTMLButtonElement {
  const state = options.vialState ?? VIAL_STATES[0];
  if (!isVialState(state)) {
    throw new TypeError(
      `unknown vial state: ${String(state)} (expected ${VIAL_STATES.join(' | ')})`,
    );
  }

  const panel = document.createElement('button');
  panel.type = 'button';
  panel.className = 'dc-unit-panel';
  panel.dataset.unitId = unit.id;
  panel.setAttribute('aria-label', `${unit.name} 상세 보기`);

  const name = document.createElement('span');
  name.className = 'dc-unit-panel__name';
  name.textContent = unit.name;

  panel.append(name, createVial({ state }));

  const { onSelect } = options;
  if (onSelect) {
    panel.addEventListener('click', () => onSelect(unit));
  }
  return panel;
}

export interface UnitSheetOptions {
  /** Sheet-item ids the unit's LATEST decision cited. Every id must resolve (INV-3). */
  because?: readonly string[];
}

interface SheetSection {
  kind: SheetItemKind;
  testid: string;
  title: string;
}

const SECTIONS: readonly SheetSection[] = [
  { kind: 'persona', testid: 'sheet-persona', title: '기본 인격' },
  { kind: 'card', testid: 'sheet-cards', title: '장착 카드' },
  { kind: 'stat', testid: 'sheet-stats', title: '능력치' },
];

export function createUnitSheet(unit: UnitView, options: UnitSheetOptions = {}): HTMLElement {
  const cited = [...(options.because ?? [])];
  const known = new Set(unit.items.map((item) => item.id));
  const unresolved = cited.find((id) => !known.has(id));
  if (unresolved !== undefined) {
    throw new TypeError(
      `because id resolves to no sheet item: "${unresolved}" (unit "${unit.id}")`,
    );
  }
  const citedIds = new Set(cited);

  const sheet = document.createElement('div');
  sheet.className = 'dc-sheet anim-phase-fade';
  sheet.dataset.unitId = unit.id;
  sheet.dataset.testid = 'unit-sheet';

  const head = document.createElement('div');
  head.className = 'dc-sheet__head';
  head.textContent = unit.name;
  sheet.append(head);

  for (const section of SECTIONS) {
    const block = document.createElement('section');
    block.className = 'dc-sheet__section';
    block.dataset.testid = section.testid;

    const title = document.createElement('h3');
    title.className = 'dc-sheet__title';
    title.textContent = section.title;

    const list = document.createElement('ul');
    list.className = 'dc-sheet__items';
    for (const item of unit.items) {
      if (item.kind !== section.kind) continue;
      const row = document.createElement('li');
      row.className = citedIds.has(item.id)
        ? 'dc-sheet__item dc-sheet__item--cited'
        : 'dc-sheet__item';
      row.dataset.itemId = item.id;
      row.textContent = item.text;
      list.append(row);
    }

    block.append(title, list);
    sheet.append(block);
  }

  return sheet;
}
