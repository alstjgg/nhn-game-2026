// u15 — the 전투 tile, composed (PRD §2.5).
//
// Everything here is wiring: u8's turn loop, u9's gauge, u10's screen and sequential
// player, and the boot adapter, bound together for ONE tile. No rule is decided in this
// file — the fight's outcome leaves as a callback and the composition decides what a
// victory is worth.
//
// The recording adapter is per fight on purpose: it is what lets the player report WHICH
// canned bucket answered and whether the snapshot was poisoned (INV-4), and those facts
// belong to this fight only.

import { createRecordingAdapter } from '../screens/combat/index.ts';
import {
  COMBAT_DEFEAT_EVENT,
  COMBAT_VICTORY_EVENT,
  createCombatPlayer,
  createCombatScreen,
  createOverloadFallback,
} from '../screens/combat/index.ts';
import type { OverloadRow } from '../screens/combat/index.ts';
import type { CombatDeps } from '../combat/types.ts';
import type { Tile } from '../data/schema.ts';
import type { UnitView } from '../ui/index.ts';

import type { GameContext } from './game-context.ts';
import type { ScreenView } from './screen-view.ts';

export type FightOutcome = 'victory' | 'defeat';

/**
 * How far one playthrough may run before the composition stops watching. A party that
 * has coerced its way out of every offensive action holds a stalemate forever; this is
 * the guard against that, not a balance number — every authored roster settles well
 * inside it.
 */
const MAX_TURNS = 60;

/** A monster carries no context of its own — the absence of a reading, not a tunable. */
const NO_GAUGE = 0;

export interface FightViewOptions {
  readonly context: GameContext;
  readonly tile: Tile;
  /** The authored 폭주 pool (`data/decisions.json` → `overload`). */
  readonly overload: readonly OverloadRow[];
  readonly onOutcome: (outcome: FightOutcome) => void;
}

export function createFightView(options: FightViewOptions): ScreenView {
  const { context, tile, overload, onOutcome } = options;
  const { cards, encounters, tuning } = context.data;
  const gauge = context.gauge();

  const recorder = createRecordingAdapter(context.boot.adapter);

  const deps: CombatDeps = {
    tuning,
    heroes: context.heroes,
    cards,
    encounters,
    adapter: recorder.adapter,
    fallbackFor: createOverloadFallback({
      base: context.boot.fallbackFor,
      authored: overload,
      isOverloaded: (unitId) =>
        context.partyIds.includes(unitId) && gauge.tierNameOf(unitId) === 'overload',
      sheetIdsOf: context.sheetIdsOf,
    }),
    tieBreak: context.tieBreak,
    sheetIdsOf: context.sheetIdsOf,
    gauge: gauge.port(),
  };

  const roster = encounters.rosters.find((entry) => entry.tileId === tile.id);
  if (roster === undefined) {
    throw new Error(`tile '${tile.id}' declares no roster in data/encounters.json`);
  }

  // The line-up carries REAL entities only. A phantom exists inside a corrupted
  // judgment snapshot and never on the stage (INV-4).
  const heroViews: UnitView[] = context.partyIds.map((unitId) => ({
    id: unitId,
    name: context.heroById(unitId).name,
    side: 'hero',
    gauge: gauge.valueOf(unitId),
    items: context.sheetOf(unitId).items,
  }));

  const enemyViews: UnitView[] = roster.entries.map((entry) => {
    const monster = encounters.monsters.find((candidate) => candidate.id === entry.monsterId);
    if (monster === undefined) {
      throw new Error(`monster '${entry.monsterId}' is not declared in data/encounters.json`);
    }
    return {
      id: entry.instanceId,
      name: monster.name,
      side: 'enemy',
      gauge: NO_GAUGE,
      items: [],
    };
  });

  const screen = createCombatScreen({
    tileId: tile.id,
    heroes: heroViews,
    enemies: enemyViews,
    tiers: Object.fromEntries(context.partyIds.map((id) => [id, gauge.tierNameOf(id)])),
    labels: Object.fromEntries(context.partyIds.map((id) => [id, context.sheetOf(id).labels])),
  });

  const player = createCombatPlayer({
    tileId: tile.id,
    party: context.loadout(),
    deps,
    gauge,
    screen,
    requests: recorder.take,
    bucketConfig: context.bucketConfig,
    maxTurns: MAX_TURNS,
  });

  screen.element.addEventListener(COMBAT_VICTORY_EVENT, () => {
    onOutcome('victory');
  });
  screen.element.addEventListener(COMBAT_DEFEAT_EVENT, () => {
    onOutcome('defeat');
  });

  player.start();
  return { element: screen.element, advance: () => player.drain() };
}
