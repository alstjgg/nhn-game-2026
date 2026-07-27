// The stage — side-scroll line view: heroes left, enemies right, nobody moves
// (PRD §2.5).
//
// "Nobody moves" is a rendering promise, not just a design note: the only motion a
// unit carries here is the breathing bob, which is vertical, so a unit's horizontal
// position is fixed for the whole encounter. Walking is a different screen and
// scrolls the background, not the line-up.

import { isUnitSide, type UnitView } from './types.ts';

export interface StageOptions {
  heroes: readonly UnitView[];
  enemies: readonly UnitView[];
}

function createStageUnit(unit: UnitView): HTMLElement {
  const el = document.createElement('div');
  el.className = 'dc-unit';
  el.dataset.unitId = unit.id;
  el.dataset.side = unit.side;
  // The CSS asset slot is keyed off the MONSTER id, not the per-encounter instance id
  // `unit.id` carries for an enemy (src/styles/assets.css, PRD §2.8 seam with u16).
  if (unit.monsterId !== undefined) el.dataset.monsterId = unit.monsterId;

  const sprite = document.createElement('div');
  const slot = unit.side === 'hero' ? 'slot-hero' : 'slot-mob';
  sprite.className = `dc-unit__sprite ${slot} anim-breathe-bob`;
  sprite.setAttribute('aria-hidden', 'true');

  const name = document.createElement('span');
  name.className = 'dc-unit__name';
  name.textContent = unit.name;

  el.append(sprite, name);
  return el;
}

function createSide(units: readonly UnitView[], side: 'heroes' | 'enemies'): HTMLElement {
  const el = document.createElement('div');
  el.className = `dc-stage__side dc-stage__side--${side}`;
  el.dataset.testid = `stage-${side}`;
  for (const unit of units) el.append(createStageUnit(unit));
  return el;
}

export function createStage(options: StageOptions): HTMLElement {
  const heroes = [...options.heroes];
  const enemies = [...options.enemies];

  for (const unit of [...heroes, ...enemies]) {
    if (!isUnitSide(unit.side)) {
      throw new TypeError(`unknown unit side: ${String(unit.side)} (unit "${unit.id}")`);
    }
  }
  const misplaced =
    heroes.find((u) => u.side !== 'hero') ?? enemies.find((u) => u.side !== 'enemy');
  if (misplaced !== undefined) {
    throw new TypeError(
      `unit "${misplaced.id}" is side "${misplaced.side}" but was staged on the other side`,
    );
  }

  const stage = document.createElement('div');
  stage.className = 'dc-stage';
  stage.dataset.testid = 'stage';

  const bg = document.createElement('div');
  bg.className = 'dc-stage__bg slot-bg-dungeon';
  bg.dataset.testid = 'stage-bg';
  bg.setAttribute('aria-hidden', 'true');

  stage.append(bg, createSide(heroes, 'heroes'), createSide(enemies, 'enemies'));
  return stage;
}
