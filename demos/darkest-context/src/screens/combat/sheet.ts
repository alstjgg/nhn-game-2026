// u10 — the unit sheet a combat decision cites (PRD §2.3, §2.8, INV-3).
//
// One place builds BOTH halves of attribution: the rows the sheet renders and the
// id list the engine validates an answer against (`CombatDeps.sheetIdsOf`). They
// are the same list by construction, so a chip on screen can never point at a row
// that does not exist — which is exactly what INV-3 asks the render half to prove.
//
// Nothing here reads `document`: it is data in, data out, so the sheet stays
// testable without a DOM.

import { STAT_KEYS } from '../../data/schema.ts';
import type { Card, Hero, StatKey } from '../../data/schema.ts';
import type { SheetItem } from '../../ui/index.ts';

/** 능력치 row labels — display text for the six stat keys of `data/heroes.json`. */
const STAT_LABELS: Record<StatKey, string> = {
  str: '힘',
  agi: '민첩',
  int: '지능',
  wis: '지혜',
  cha: '매력',
  con: '체력',
};

/** The chip label of a unit's base persona row. */
const PERSONA_LABEL = '기본 인격';

export interface HeroSheet {
  /** The rows `createUnitSheet` renders, in section order. */
  items: SheetItem[];
  /** Chip id → short label, so a bubble reads as game text instead of an id. */
  labels: Record<string, string>;
  /** Every id an answer may cite — exactly the ids of `items` (INV-3). */
  ids: string[];
}

/** The sheet-row id of one stat, namespaced so two units never collide. */
export function statItemId(unitId: string, stat: StatKey): string {
  return `${unitId}.stat.${stat}`;
}

/**
 * Assembles one hero's sheet: base persona, its base skill, the sentences its
 * equipped cards added, then its stats. A card id the catalog does not carry is
 * skipped silently — a missing card is not something to tell the player about
 * (INV-7).
 */
export function buildHeroSheet(
  hero: Hero,
  equippedCardIds: readonly string[],
  cards: readonly Card[],
): HeroSheet {
  const items: SheetItem[] = [
    { id: hero.defaultPrompt.id, kind: 'persona', text: hero.defaultPrompt.lines.join(' ') },
    { id: hero.baseSkill.id, kind: 'card', text: `${hero.baseSkill.name} — ${hero.baseSkill.text}` },
  ];
  const labels: Record<string, string> = {
    [hero.defaultPrompt.id]: PERSONA_LABEL,
    [hero.baseSkill.id]: hero.baseSkill.name,
  };

  for (const cardId of equippedCardIds) {
    const card = cards.find((candidate) => candidate.id === cardId);
    if (card === undefined) continue;
    items.push({ id: card.id, kind: 'card', text: `${card.name} — ${card.text}` });
    labels[card.id] = card.name;
  }

  for (const stat of STAT_KEYS) {
    const id = statItemId(hero.id, stat);
    items.push({ id, kind: 'stat', text: `${STAT_LABELS[stat]} ${hero.stats[stat]}` });
    labels[id] = STAT_LABELS[stat];
  }

  return { items, labels, ids: items.map((item) => item.id) };
}
