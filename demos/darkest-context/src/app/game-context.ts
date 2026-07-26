// u15 — the state one RUN carries between tiles (PRD §2.3, §2.5).
//
// Three things outlive a tile and nothing else does: the party's loadout, the context
// gauge, and the boot decision. Screens are rebuilt per tile from this context, so a
// card equipped at T2 is visible on the sheet at T5 without any screen holding state
// across a mount.
//
// `reset()` is 재시작 (PRD §2.5): a fresh run means a fresh loadout and a fresh gauge,
// but never a fresh boot — mode and tie-break policy are chosen once per page load.

import type { BootState } from '../ai/boot.ts';
import { bucketConfigOf } from '../ai/bucket.ts';
import type { BucketConfig } from '../ai/bucket.ts';
import { createGauge } from '../combat/gauge.ts';
import type { Gauge } from '../combat/gauge.ts';
import { createNoiseInjector } from '../combat/noise.ts';
import type { TieBreak } from '../combat/types.ts';
import { createTieBreaker } from '../core/tiebreak.ts';
import type { Card, GameData, Hero } from '../data/schema.ts';
import { createLoadout } from '../equip/loadout.ts';
import type { PartyLoadout } from '../equip/types.ts';
import { buildHeroSheet } from '../screens/combat/index.ts';
import type { HeroSheet } from '../screens/combat/index.ts';

/** The demo party of PRD §2.3, in party order. */
export const PARTY_IDS: readonly string[] = ['garrett', 'fiona', 'selene'];

export interface GameContext {
  readonly data: GameData;
  readonly partyIds: readonly string[];
  /** The party as the engine reads it — seeded per scenario, never re-derived. */
  readonly heroes: readonly Hero[];
  readonly boot: BootState;
  readonly bucketConfig: BucketConfig;
  readonly tieBreak: TieBreak;
  heroById(unitId: string): Hero;
  loadout(): PartyLoadout;
  setLoadout(next: PartyLoadout): void;
  /** unitId → equipped card ids, in equip order. */
  loadoutMap(): Record<string, string[]>;
  gauge(): Gauge;
  sheetOf(unitId: string): HeroSheet;
  sheetIdsOf(unitId: string): readonly string[];
  cardName(cardId: string): string;
  reset(): void;
}

export interface GameContextOptions {
  readonly data: GameData;
  readonly boot: BootState;
  /** Overrides the shipped hero rows — the gate's forced-KO seed (balance, not rules). */
  readonly heroes?: readonly Hero[];
}

export function createGameContext(options: GameContextOptions): GameContext {
  const { data, boot } = options;
  const heroes = options.heroes ?? data.heroes;
  const tieBreak = createTieBreaker(boot.tieBreak);

  const freshGauge = (): Gauge =>
    createGauge({
      unitIds: PARTY_IDS,
      tuning: data.tuning,
      encounters: data.encounters,
      noise: createNoiseInjector({ encounters: data.encounters }),
    });

  let party: PartyLoadout = createLoadout(PARTY_IDS);
  let gauge: Gauge = freshGauge();

  const heroById = (unitId: string): Hero => {
    const hero = heroes.find((candidate) => candidate.id === unitId);
    if (hero === undefined) {
      throw new Error(`party member '${unitId}' is missing from data/heroes.json`);
    }
    return hero;
  };

  const equippedIds = (unitId: string): string[] =>
    party.units.find((unit) => unit.unitId === unitId)?.equipped.map((entry) => entry.cardId) ?? [];

  const sheetOf = (unitId: string): HeroSheet =>
    buildHeroSheet(heroById(unitId), equippedIds(unitId), data.cards);

  const cardById = (cardId: string): Card | undefined =>
    data.cards.find((card) => card.id === cardId);

  return {
    data,
    partyIds: PARTY_IDS,
    heroes,
    boot,
    bucketConfig: bucketConfigOf(data.tuning),
    tieBreak,
    heroById,
    loadout: () => party,
    setLoadout: (next) => {
      party = next;
    },
    loadoutMap: () => Object.fromEntries(PARTY_IDS.map((id) => [id, equippedIds(id)])),
    gauge: () => gauge,
    sheetOf,
    sheetIdsOf: (unitId) => sheetOf(unitId).ids,
    cardName: (cardId) => cardById(cardId)?.name ?? cardId,
    reset: () => {
      party = createLoadout(PARTY_IDS);
      gauge = freshGauge();
    },
  };
}
