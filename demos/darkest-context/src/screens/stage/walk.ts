// u14 — the walk view: one side-view stage the party never crosses (PRD §2.4, §2.8).
//
// The whole illusion is one swap of responsibility: the BACKGROUND moves and the
// heroes do not. Each sprite runs `.sprite-walk` (the `steps(4)` cell loop u7 put
// in slots.css) in a fixed box, and `.dc-walk__bg--scrolling` scrolls the dungeon
// strip underneath them — so "walking" is a state on two elements, never a
// translation of a unit.
//
// The 고게이지 walking read is dressing, not a frame (PRD §2.8: "걷기 중 게이지
// 표현은 별도 프레임이 아니라 CSS overlay + vial HUD"): the wrapper takes
// `--overload`, a tint overlay carries `.anim-gauge-tint`, the vial HUD carries the
// tier — and the sprite keeps stepping through sheet row 0 exactly as before.
//
// This view holds no run logic: it renders what it is handed and reports clicks.

import { createVial, vialStateForGauge, type GaugeThresholds } from '../../ui/index.ts';
import type { ChatterExchange } from './chatter.ts';

/** One party member as the walk screen needs it: identity, name, current gauge. */
export interface WalkUnitView {
  readonly unitId: string;
  readonly name: string;
  /** 0–100. Tier thresholds arrive as data — this view never guesses them. */
  readonly gauge: number;
}

export interface WalkViewOptions {
  readonly party: readonly WalkUnitView[];
  readonly thresholds: GaugeThresholds;
  /** Display name for a fork's destination tile. Defaults to the tile id. */
  readonly branchLabel?: (tileId: string) => string;
}

export interface WalkView {
  readonly element: HTMLElement;
  /** Drives the `data-phase` attribute and, with it, whether the strip scrolls. */
  setPhase(phase: string): void;
  /** Replaces the bubble rail with this walk's exchanges (empty clears it). */
  setChatter(exchanges: readonly ChatterExchange[]): void;
  /** Replaces the fork rail. An empty option list leaves no card behind. */
  setFork(options: readonly string[], onPick: (tileId: string) => void): void;
}

/** The tiers whose walking read is dressed up — 한계 and above (PRD §2.5). */
const DRESSED_TIERS = ['limit', 'overload'];

const WALKING_PHASE = 'walking';
const SCROLLING = 'dc-walk__bg--scrolling';
const OVERLOAD = 'dc-walk__unit--overload';

/** The one sentence a fork card says under its destination's name. */
const BRANCH_SENTENCE = '이 길로 간다.';

function createUnit(unit: WalkUnitView, thresholds: GaugeThresholds): HTMLElement {
  const state = vialStateForGauge(unit.gauge, thresholds);
  const dressed = DRESSED_TIERS.includes(state);

  const wrapper = document.createElement('div');
  wrapper.className = dressed ? `dc-walk__unit ${OVERLOAD}` : 'dc-walk__unit';
  wrapper.dataset.testid = 'walk-unit';
  wrapper.dataset.unitId = unit.unitId;

  const sprite = document.createElement('div');
  sprite.className = 'dc-walk__hero slot-hero sprite-walk';
  sprite.dataset.testid = 'walk-hero';
  sprite.dataset.unitId = unit.unitId;
  sprite.setAttribute('aria-hidden', 'true');
  wrapper.append(sprite);

  if (dressed) {
    const tint = document.createElement('span');
    tint.className = 'dc-walk__tint anim-gauge-tint';
    tint.dataset.testid = 'walk-tint';
    tint.dataset.unitId = unit.unitId;
    tint.setAttribute('aria-hidden', 'true');
    wrapper.append(tint);
  }

  const hud = document.createElement('div');
  hud.className = 'dc-walk__hud';

  const vial = createVial({ state });
  vial.classList.add('dc-walk__vial');
  vial.dataset.testid = 'walk-vial';
  vial.dataset.unitId = unit.unitId;

  const name = document.createElement('span');
  name.className = 'dc-walk__name';
  name.textContent = unit.name;

  hud.append(vial, name);
  wrapper.append(hud);
  return wrapper;
}

function createBubble(exchange: ChatterExchange): HTMLElement {
  const bubble = document.createElement('div');
  bubble.className = 'dc-chatter slot-bubble-frame anim-bubble-in';
  bubble.dataset.testid = 'chatter-bubble';
  bubble.dataset.exchangeId = exchange.id;

  for (const line of exchange.lines) {
    const said = document.createElement('p');
    said.className = 'dc-chatter__line';
    said.dataset.testid = 'chatter-line';
    said.dataset.unitId = line.unitId;
    said.textContent = line.text;
    bubble.append(said);
  }
  return bubble;
}

export function createWalkView(options: WalkViewOptions): WalkView {
  const { party, thresholds } = options;
  const label = options.branchLabel ?? ((tileId: string): string => tileId);

  const element = document.createElement('section');
  element.className = 'dc-walk anim-phase-fade';
  element.dataset.testid = 'stage-screen';
  element.dataset.phase = 'idle';

  const bg = document.createElement('div');
  bg.className = 'dc-walk__bg slot-bg-dungeon';
  bg.dataset.testid = 'walk-bg';
  bg.setAttribute('aria-hidden', 'true');

  const line = document.createElement('div');
  line.className = 'dc-walk__party';
  for (const unit of party) line.append(createUnit(unit, thresholds));

  const rail = document.createElement('div');
  rail.className = 'dc-walk__chatter';

  const fork = document.createElement('div');
  fork.className = 'dc-walk__fork';

  element.append(bg, line, rail, fork);

  const setPhase = (phase: string): void => {
    element.dataset.phase = phase;
    bg.classList.toggle(SCROLLING, phase === WALKING_PHASE);
  };

  const setChatter = (exchanges: readonly ChatterExchange[]): void => {
    rail.replaceChildren(...exchanges.map(createBubble));
  };

  const setFork = (tileIds: readonly string[], onPick: (tileId: string) => void): void => {
    fork.replaceChildren(
      ...tileIds.map((tileId) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'dc-branch-card slot-card-frame';
        card.dataset.testid = 'branch-card';
        card.dataset.tileId = tileId;

        const title = document.createElement('span');
        title.className = 'dc-branch-card__title';
        title.textContent = label(tileId);

        const sentence = document.createElement('span');
        sentence.className = 'dc-branch-card__sentence';
        sentence.textContent = BRANCH_SENTENCE;

        card.append(title, sentence);
        card.addEventListener('click', () => {
          onPick(tileId);
        });
        return card;
      }),
    );
  };

  return { element, setPhase, setChatter, setFork };
}
