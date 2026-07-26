// u10 — the 전투 render surface (PRD §2.5, §2.8, INV-3/INV-4/INV-7).
//
// A READOUT, not a control surface. The screen never resolves a turn, never asks
// the adapter anything and owns no clock: it is handed one presentation BEAT at a
// time and draws it. `player.ts` is what feeds it, so "one bubble per beat, in
// 민첩 order" is provable without racing a timer (INV-6).
//
// Three §2.5 promises are structural here rather than decorative:
//
//   · NOBODY MOVES. The line-up is u7's `createStage` and the bubble log is an
//     absolutely-positioned overlay, so a bubble landing can never reflow a unit.
//   · The phantom of a ≥70 turn is drawn in the BUBBLE only. The stage is built
//     from real roster ids and this file never adds a body to it (INV-4).
//   · Nothing degraded ever reads as an error. A suppressed judgment is a "…"
//     bubble and a swing that found nothing is 허공을 벤다 (INV-7).
//
// Sprite cells go through the u1/u7 `--cell-row` / `--cell-col` seam of
// `slots.css`; this file picks a NUMBER, never a pixel offset and never a second
// sheet geometry.

import { PHANTOM_MISS_SAY } from '../../combat/noise.ts';
import type { CombatOutcome } from '../../combat/types.ts';
import { createBubble, createStage, createUnitPanel, createUnitSheet } from '../../ui/index.ts';
import type { UnitView, VialState } from '../../ui/index.ts';
import '../../styles/combat.css';

/** PRD §2.8 hero sheet, 4×3: row 1 = 게이지 tier 대기-포즈, row 2 = 액션 4종. */
const POSE_ROW = 1;
const ACTION_ROW = 2;
const POSE_COL: Record<VialState, number> = { calm: 0, uneasy: 1, limit: 2, overload: 3 };

/** 액션 row cells, in §2.8 order: 공격 · 방어 · 피격 · 쓰러짐. */
export const SPRITE_ACTIONS = ['idle', 'attack', 'defend', 'hit', 'down'] as const;
export type SpriteAction = (typeof SPRITE_ACTIONS)[number];

const ACTION_COL: Record<SpriteAction, number> = {
  // `idle` never reaches the action row — it is drawn from the 대기-포즈 row.
  idle: 0,
  attack: 0,
  defend: 1,
  hit: 2,
  down: 3,
};

/**
 * Which 액션 cell an executed action id shows. An action with no cell of its own
 * (대기 / 회피 / a card the sheet has no frame for) simply stays on the 대기-포즈
 * row — the tier read is never lost to a missing frame.
 */
const ACTION_CELL_FOR: Record<string, SpriteAction> = {
  strike: 'attack',
  dual_slash: 'attack',
  flame_scroll: 'attack',
  heal_potion: 'attack',
  defend: 'defend',
  guard_ally: 'defend',
  taunt: 'defend',
};

const SCREEN_TITLE = '전투';
const TURN_LABEL = '턴';
const HP_LABEL = '체력';
/** The gauge is the game's title mechanic; an unlabelled vial is not a readout. */
const GAUGE_LABEL = '컨텍스트';
/** The one line that says what the panels under the line-up are FOR. */
const SHEET_HINT = '유닛을 누르면 그 판단이 인용한 행동 지침 시트가 열린다.';

/** One unit's turn as the screen draws it. Every field is already engine-owned. */
export interface CombatBeat {
  unitId: string;
  say: string;
  because: readonly string[];
  actionId: string;
  targetId: string | null;
  coerced: boolean;
  /** The gauge tier that produced this line. */
  tier: VialState;
  /** The snapshot this line was judged on carried a phantom (PRD §2.5). */
  sawPhantom: boolean;
  /** The swing found nothing — 허공을 벤다 (INV-4). */
  phantomSwing: boolean;
}

export interface CombatScreenOptions {
  tileId: string;
  heroes: readonly UnitView[];
  enemies: readonly UnitView[];
  /** Opening tier per hero. Derived from the gauge by the caller, never here. */
  tiers: Readonly<Record<string, VialState>>;
  /** unitId → (chip id → short label). */
  labels: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/** What the HUD says out loud about a unit: its health, and its context reading. */
export interface UnitVitals {
  hp: number;
  hpMax: number;
  /** Heroes only — a monster carries no context of its own. */
  gauge?: number;
  gaugeMax?: number;
}

export interface CombatScreen {
  element: HTMLElement;
  setTurn: (turn: number) => void;
  setOutcome: (outcome: CombatOutcome) => void;
  setTier: (unitId: string, tier: VialState) => void;
  /** The readable numbers: who is winning, and how loud the context is (PRD §2.5). */
  setVitals: (unitId: string, vitals: UnitVitals) => void;
  playBeat: (beat: CombatBeat) => void;
  /** 쓰러짐 — the unit holds the down cell for the rest of the fight. */
  markDown: (unitId: string) => void;
}

interface HeroSlot {
  view: UnitView;
  panelHost: HTMLElement;
  vitalsHost: HTMLElement;
  sheetHost: HTMLElement;
  sprite: HTMLElement;
  tier: VialState;
  action: SpriteAction;
  down: boolean;
}

function requireElement(root: ParentNode, selector: string, what: string): HTMLElement {
  const found = root.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`combat screen: ${what} is missing (selector '${selector}')`);
  }
  return found;
}

function block(className: string, testid?: string): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  if (testid !== undefined) el.dataset.testid = testid;
  return el;
}

export function createCombatScreen(options: CombatScreenOptions): CombatScreen {
  const { tileId, heroes, enemies, tiers, labels } = options;

  const element = document.createElement('section');
  element.className = 'dc-combat';
  element.dataset.testid = 'combat-screen';
  element.dataset.tileId = tileId;
  element.dataset.turn = '1';
  element.dataset.outcome = 'ongoing';

  const head = block('dc-combat__head');
  const title = document.createElement('h2');
  title.className = 'dc-combat__title';
  title.textContent = SCREEN_TITLE;
  const turnRead = document.createElement('span');
  turnRead.className = 'dc-combat__turn';
  turnRead.textContent = `${TURN_LABEL} 1`;
  const hint = document.createElement('span');
  hint.className = 'dc-combat__hint';
  hint.dataset.testid = 'combat-sheet-hint';
  hint.textContent = SHEET_HINT;
  head.append(title, turnRead, hint);

  const hud = block('dc-combat__hud', 'combat-hud');
  const field = block('dc-combat__field');
  const log = block('dc-combat__log', 'combat-log');
  const sheets = block('dc-combat__sheets');

  const stage = createStage({ heroes: [...heroes], enemies: [...enemies] });
  field.append(stage, log);
  element.append(head, hud, field, sheets);

  const slots = new Map<string, HeroSlot>();
  /** Line-up position per hero — which column that unit's bubble hangs over. */
  const speakerOrder = new Map(heroes.map((hero, index) => [hero.id, index]));

  /** Puts the sprite on the cell its current pose / action names (PRD §2.8). */
  const applyCell = (slot: HeroSlot): void => {
    const action: SpriteAction = slot.down ? 'down' : slot.action;
    const onActionRow = action !== 'idle';
    slot.sprite.dataset.pose = slot.tier;
    slot.sprite.dataset.action = action;
    slot.sprite.style.setProperty('--cell-row', String(onActionRow ? ACTION_ROW : POSE_ROW));
    slot.sprite.style.setProperty(
      '--cell-col',
      String(onActionRow ? ACTION_COL[action] : POSE_COL[slot.tier]),
    );
  };

  const renderSheet = (slot: HeroSlot, because: readonly string[]): void => {
    slot.sheetHost.replaceChildren(createUnitSheet(slot.view, { because }));
  };

  /** One sheet at a time: opening a unit's reasons closes the previous read. */
  const openSheet = (slot: HeroSlot, because: readonly string[]): void => {
    for (const other of slots.values()) other.sheetHost.dataset.open = 'false';
    renderSheet(slot, because);
    slot.sheetHost.dataset.open = 'true';
  };

  const toggleSheet = (slot: HeroSlot): void => {
    const wasOpen = slot.sheetHost.dataset.open === 'true';
    if (wasOpen) {
      slot.sheetHost.dataset.open = 'false';
      return;
    }
    // A panel press clears the citation — reading a sheet whole is a verb too.
    openSheet(slot, []);
  };

  const renderPanel = (slot: HeroSlot): void => {
    const panel = createUnitPanel(slot.view, {
      vialState: slot.tier,
      onSelect: () => toggleSheet(slot),
    });
    slot.panelHost.replaceChildren(panel, slot.vitalsHost);
  };

  for (const hero of heroes) {
    const unitEl = requireElement(
      stage,
      `.dc-unit[data-unit-id="${hero.id}"]`,
      `staged unit '${hero.id}'`,
    );
    const sprite = requireElement(unitEl, '.dc-unit__sprite', `sprite of '${hero.id}'`);
    sprite.dataset.testid = 'combat-sprite';
    sprite.dataset.unitId = hero.id;

    const panelHost = block('dc-combat__panel');
    const vitalsHost = block('dc-combat__vitals', 'combat-vitals');
    vitalsHost.dataset.unitId = hero.id;
    panelHost.append(vitalsHost);
    hud.append(panelHost);
    // The persona sheet is the answer to "why did it do that", not the opening view:
    // printed always-open it filled the bottom half of the first painted frame and told
    // the personality the fight is supposed to SHOW. It opens on a press (PRD §2.3).
    const sheetHost = block('dc-combat__sheet');
    sheetHost.dataset.open = 'false';
    sheets.append(sheetHost);

    const slot: HeroSlot = {
      view: hero,
      panelHost,
      vitalsHost,
      sheetHost,
      sprite,
      tier: tiers[hero.id] ?? 'calm',
      action: 'idle',
      down: false,
    };
    slots.set(hero.id, slot);
    renderPanel(slot);
    renderSheet(slot, []);
    applyCell(slot);
  }

  const setTurn = (turn: number): void => {
    element.dataset.turn = String(turn);
    turnRead.textContent = `${TURN_LABEL} ${turn}`;
  };

  const setOutcome = (outcome: CombatOutcome): void => {
    element.dataset.outcome = outcome;
  };

  /**
   * The numbers a watcher needs and the DOM did not carry: party health, enemy health,
   * and the gauge as a VALUE next to its vial. Without them the fight is three names
   * and an unlabelled icon, and no one can tell who is winning (PRD §2.5).
   */
  const enemyVitals = new Map<string, HTMLElement>();
  for (const enemy of enemies) {
    const unitEl = stage.querySelector<HTMLElement>(`.dc-unit[data-unit-id="${enemy.id}"]`);
    if (unitEl === null) continue;
    const read = block('dc-combat__enemy-vitals', 'combat-vitals');
    read.dataset.unitId = enemy.id;
    unitEl.append(read);
    enemyVitals.set(enemy.id, read);
  }

  const setVitals = (unitId: string, vitals: UnitVitals): void => {
    const health = `${HP_LABEL} ${vitals.hp}/${vitals.hpMax}`;
    const enemyRead = enemyVitals.get(unitId);
    if (enemyRead !== undefined) {
      enemyRead.textContent = health;
      return;
    }
    const slot = slots.get(unitId);
    if (slot === undefined) return;
    const gauge =
      vitals.gauge === undefined || vitals.gaugeMax === undefined
        ? ''
        : ` · ${GAUGE_LABEL} ${vitals.gauge}/${vitals.gaugeMax}`;
    slot.vitalsHost.textContent = `${health}${gauge}`;
  };

  const setTier = (unitId: string, tier: VialState): void => {
    const slot = slots.get(unitId);
    if (slot === undefined) return;
    slot.tier = tier;
    renderPanel(slot);
    applyCell(slot);
  };

  const markDown = (unitId: string): void => {
    const slot = slots.get(unitId);
    if (slot === undefined) return;
    slot.down = true;
    applyCell(slot);
  };

  /**
   * One LIVE line per speaker, in that speaker's own column.
   *
   * The rail used to show every line it had ever rendered: nine overlapping panels by
   * turn 4, stacked down the middle of the line-up, so the bubble physically deleted the
   * sprite pose — the third channel must-prove 2 reads personality from. A unit's older
   * line is retired when its next one lands, and `--speaker-order` hangs each live
   * bubble over its own unit while the DOM keeps 민첩 order.
   *
   * Retired, not removed: the log is also the RECORD of the fight (a spec reads the
   * bubble a unit said three turns ago, and the composition reads the rendered count as
   * its progress signal). Nothing is destroyed; it simply stops being on stage.
   */
  const retireLineOf = (unitId: string): void => {
    for (const node of log.querySelectorAll(`[data-unit-id="${unitId}"]`)) {
      if (node instanceof HTMLElement) node.dataset.retired = 'true';
    }
  };

  const playBeat = (beat: CombatBeat): void => {
    retireLineOf(beat.unitId);
    const bubble = createBubble({
      unitId: beat.unitId,
      say: beat.say,
      because: beat.because,
      labels: labels[beat.unitId],
    });
    bubble.style.setProperty('--speaker-order', String(speakerOrder.get(beat.unitId) ?? 0));
    bubble.dataset.testid = 'combat-bubble';
    bubble.dataset.actionId = beat.actionId;
    bubble.dataset.coerced = String(beat.coerced);
    bubble.dataset.tier = beat.tier;
    bubble.dataset.sawPhantom = String(beat.sawPhantom);
    // 40–70 is acting and nothing else: a presentation flag, never an input change.
    bubble.dataset.stutter = String(beat.tier === 'uneasy');
    if (beat.targetId !== null) bubble.dataset.targetId = beat.targetId;

    for (const chip of bubble.querySelectorAll('.dc-chip')) {
      if (!(chip instanceof HTMLElement)) continue;
      const itemId = chip.dataset.itemId;
      if (itemId === undefined) continue;
      chip.addEventListener('click', () => {
        const slot = slots.get(beat.unitId);
        if (slot !== undefined) openSheet(slot, [itemId]);
      });
    }
    log.append(bubble);

    if (beat.phantomSwing) {
      const miss = block('dc-combat__phantom', 'phantom-swing');
      miss.dataset.unitId = beat.unitId;
      miss.textContent = PHANTOM_MISS_SAY;
      log.append(miss);
    }

    const slot = slots.get(beat.unitId);
    if (slot !== undefined) {
      slot.action = ACTION_CELL_FOR[beat.actionId] ?? 'idle';
      applyCell(slot);
    }
  };

  return { element, setTurn, setOutcome, setTier, setVitals, playBeat, markDown };
}
