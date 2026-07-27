// u15 — the four non-combat tiles, composed (PRD §2.6, §2.7, §2.5).
//
// 훈련장 · 휴식 · 평의회 · 종료. Each factory hands the shipped screen exactly the data
// it declares and reports the player's verb back up; none of them decides anything about
// the run.
//
// Two of the screens publish their 계속 button without a listener — u12 deliberately does
// not own "what happens next". The composition supplies it, and does so by DELEGATION
// from the screen root rather than by reaching for the node, so the button can be
// re-rendered underneath us without the wiring going stale.

import { COUNCIL_GRANT_EVENT } from '../council/outcome.ts';
import type { CouncilUnit } from '../council/types.ts';
import type { Agenda, Card, Grant, Tile } from '../data/schema.ts';
import { draftOptions } from '../equip/draft.ts';
import type { GaugeEntry, RestResult } from '../equip/rest.ts';
import { createCouncilScreen } from '../screens/council/index.ts';
import { createEndScreen } from '../screens/end/index.ts';
import type { EndResult } from '../screens/end/index.ts';
import { createRestScreen } from '../screens/rest/index.ts';
import { createTrainingScreen } from '../screens/training/index.ts';

import type { GameContext } from './game-context.ts';
import type { ScreenView } from './screen-view.ts';

/** What the composition needs off a settled council: the payout it has to apply. */
export interface CouncilPayout {
  readonly cardId: string | null;
  readonly gaugeAll: number;
}

/** Fires `onDone` when a click lands anywhere inside the element carrying `testid`. */
function onTestIdClick(root: HTMLElement, testid: string, onDone: () => void): void {
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest(`[data-testid="${testid}"]`) === null) return;
    onDone();
  });
}

/** The `council:grant` detail, read defensively — the event crosses an untyped seam. */
function payoutOf(event: Event): CouncilPayout | null {
  if (!(event instanceof CustomEvent)) return null;
  const detail: unknown = event.detail;
  if (typeof detail !== 'object' || detail === null) return null;
  if (!('cardId' in detail) || !('gaugeAll' in detail)) return null;
  const { cardId, gaugeAll } = detail;
  if (typeof gaugeAll !== 'number') return null;
  return { cardId: typeof cardId === 'string' ? cardId : null, gaugeAll };
}

// ── 훈련장 ───────────────────────────────────────────────────────────────────

export interface TrainingViewOptions {
  readonly context: GameContext;
  /** The tile's authored grant — `fixed` pays one card, `draft` fans out three. */
  readonly grant: Grant;
  readonly onDone: () => void;
}

/** The cards a grant puts on the table, in authored order. Nothing is shuffled (A4). */
function grantedCards(grant: Grant, context: GameContext): Card[] {
  const { cards, tuning } = context.data;
  if (grant.kind === 'draft') return draftOptions(grant, cards, tuning);
  if (grant.kind === 'fixed') {
    const card = cards.find((candidate) => candidate.id === grant.cardId);
    if (card === undefined) {
      throw new Error(`grant names card '${grant.cardId}', absent from data/cards.json`);
    }
    return [card];
  }
  throw new Error(`grant kind '${grant.kind}' is not handed out at a 훈련장`);
}

export function createTrainingView(options: TrainingViewOptions): ScreenView {
  const { context, grant, onDone } = options;
  const units = context.partyIds.map((unitId) => ({
    id: unitId,
    name: context.heroById(unitId).name,
  }));

  const element = createTrainingScreen({
    units,
    cards: grantedCards(grant, context),
    party: context.loadout(),
    slots: context.data.tuning.slots,
    onAssign: (party) => {
      context.setLoadout(party);
    },
  });

  onTestIdClick(element, 'training-done', onDone);
  return { element };
}

// ── 휴식 ─────────────────────────────────────────────────────────────────────

export interface RestViewOptions {
  readonly context: GameContext;
  readonly onDone: () => void;
}

export function createRestView(options: RestViewOptions): ScreenView {
  const { context, onDone } = options;
  const gauge = context.gauge();
  const units = context.partyIds.map((unitId) => ({
    id: unitId,
    name: context.heroById(unitId).name,
  }));
  const gauges: GaugeEntry[] = gauge.entries();

  const element = createRestScreen({
    units,
    party: context.loadout(),
    gauges,
    tuning: context.data.tuning,
    cardName: (cardId) => context.cardName(cardId),
    onResolve: (result: RestResult) => {
      context.setLoadout(result.party);
      gauge.setAll(result.gauges);
    },
  });

  onTestIdClick(element, 'rest-done', onDone);
  return { element };
}

// ── 평의회 (퍼즐 · 선택이벤트) ────────────────────────────────────────────────

export interface CouncilViewOptions {
  readonly context: GameContext;
  readonly tile: Tile;
  readonly grant: Grant;
  readonly onSettled: (payout: CouncilPayout) => void;
  readonly onDone: () => void;
}

function agendaOf(tile: Tile, agendas: readonly Agenda[]): Agenda {
  const agenda = agendas.find((candidate) => candidate.id === tile.agendaId);
  if (agenda === undefined) {
    throw new Error(`tile '${tile.id}' names no agenda declared in data/council.json`);
  }
  return agenda;
}

export function createCouncilView(options: CouncilViewOptions): ScreenView {
  const { context, tile, grant, onSettled, onDone } = options;
  const { cards, council, heroes, tuning } = context.data;
  const agenda = agendaOf(tile, council.agendas);

  const units: CouncilUnit[] = context.partyIds.map((unitId) => {
    const index = heroes.findIndex((hero) => hero.id === unitId);
    const hero = context.heroById(unitId);
    const sheet = context.sheetOf(unitId);
    const equippedCardIds =
      context
        .loadout()
        .units.find((unit) => unit.unitId === unitId)
        ?.equipped.map((entry) => entry.cardId) ?? [];
    return {
      id: hero.id,
      name: hero.name,
      index,
      stats: hero.stats,
      defaultPromptId: hero.defaultPrompt.id,
      equippedCardIds,
      sheetIds: sheet.ids,
    };
  });

  const screen = createCouncilScreen({
    agenda,
    units,
    cards,
    adapter: context.boot.adapter,
    tieBreaker: context.tieBreak,
    grant,
    tuning,
    onDone,
  });

  // The round is one async beat; `advance` is the composition's handle on it, and the
  // grant event is the only signal that every stance, the tally and the payout have
  // landed on screen.
  let settle: () => void = () => {};
  const round = new Promise<void>((resolve) => {
    settle = resolve;
  });

  screen.element.addEventListener(COUNCIL_GRANT_EVENT, (event) => {
    const payout = payoutOf(event);
    if (payout !== null) onSettled(payout);
    settle();
  });

  screen.start();
  return { element: screen.element, advance: () => round };
}

// ── 종료 (답파 · 전멸) ───────────────────────────────────────────────────────

export interface EndViewOptions {
  readonly result: EndResult;
  readonly onRestart: () => void;
}

export function createEndView(options: EndViewOptions): ScreenView {
  return {
    element: createEndScreen({ result: options.result, onRestart: options.onRestart }),
  };
}
