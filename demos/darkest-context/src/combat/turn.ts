// u8 — the turn loop (PRD §2.2, §2.5, INV-6/INV-7).
//
// The ONE async file of the combat core. It builds each unit's judgment input,
// fires the party's adapter calls IN PARALLEL — wall clock ≈ one call per turn —
// splits every answer into an engine-owned intent, and hands the pure execution
// core a plain list. It arms no timer of its own: all waiting lives in the adapter
// (INV-6), so an automated gate runs this at latency 0 with no fake clock.
//
// A unit that cannot answer never blocks the turn: a rejected call, a blown budget
// or a suppressed judgment all become that unit's 직업 기본 행동 with a "…" bubble,
// silently — no console line, no error text (INV-7).

import { decideAll } from '../ai/stub.ts';
import type { PartyLoadout } from '../equip/types.ts';

import { executeTurn, sanitizeIntent } from './execute.ts';
import { buildDecideRequests } from './snapshot.ts';
import { gaugeOf } from './types.ts';
import type {
  CombatDeps,
  CombatState,
  EnemyState,
  HeroState,
  Intent,
  TurnResult,
} from './types.ts';

/**
 * Assembles a fight out of `data/`: the tile's roster, the party as it stands, and
 * the charges every consumable card brought with it. A tile with no roster is a
 * data bug, not a runtime state — it throws rather than starting an empty fight.
 */
export function createCombat(
  tileId: string,
  party: PartyLoadout,
  deps: CombatDeps,
): CombatState {
  const roster = deps.encounters.rosters.find((candidate) => candidate.tileId === tileId);
  if (roster === undefined) {
    throw new Error(`tile '${tileId}' declares no roster in data/encounters.json`);
  }

  const heroes: HeroState[] = party.units
    .map((unit) => {
      const dataIndex = deps.heroes.findIndex((hero) => hero.id === unit.unitId);
      const data = deps.heroes[dataIndex];
      if (data === undefined) {
        throw new Error(`unit '${unit.unitId}' is not declared in data/heroes.json`);
      }

      const equipped = [...unit.equipped].sort((a, b) => a.seq - b.seq);
      const charges: Record<string, number> = {};
      for (const slot of equipped) {
        const card = deps.cards.find((candidate) => candidate.id === slot.cardId);
        if (card?.charges !== undefined) charges[card.id] = card.charges;
      }

      return {
        id: data.id,
        dataIndex,
        name: data.name,
        hp: data.hp,
        hpMax: data.hp,
        alive: true,
        side: 'hero' as const,
        agi: data.stats.agi,
        equippedCardIds: equipped.map((slot) => slot.cardId),
        classDefaultAction: data.classDefaultAction,
        charges,
        defending: false,
      };
    })
    // heroes.json order, so the `index` tie-break policy picks the lowest file
    // index however the party was assembled (PRD §2.2).
    .sort((a, b) => a.dataIndex - b.dataIndex);

  const enemies: EnemyState[] = roster.entries.map((entry, dataIndex) => {
    const monster = deps.encounters.monsters.find((candidate) => candidate.id === entry.monsterId);
    if (monster === undefined) {
      throw new Error(`monster '${entry.monsterId}' is not declared in data/encounters.json`);
    }
    return {
      id: entry.instanceId,
      dataIndex,
      name: monster.name,
      hp: monster.hp,
      hpMax: monster.hp,
      alive: true,
      side: 'enemy' as const,
      monsterId: monster.id,
      damage: monster.damage,
      behavior: { ...monster.behavior },
    };
  });

  return { tileId, rosterId: roster.id, turn: 1, heroes, enemies, outcome: 'ongoing' };
}

/** The silent 직업 기본 행동 of a unit that never got to judge (PRD §2.5). */
function suppressedIntent(unit: HeroState, deps: CombatDeps): Intent {
  const fallback = deps.fallbackFor(unit.id);
  return {
    unitId: unit.id,
    actionId: fallback.action,
    targetId: null,
    say: fallback.say,
    because: [...fallback.because],
    coerced: true,
  };
}

/**
 * One turn: judge in parallel, execute in 민첩 order. The returned state is a new
 * one turn further on — the state handed in is never touched, so the same start
 * state replays identically.
 */
export async function runTurn(state: CombatState, deps: CombatDeps): Promise<TurnResult> {
  const requests = buildDecideRequests(state, deps);
  // Every call is issued before any is awaited; one failure degrades its own
  // index only, and the party's turn costs one latency window.
  const answers = await decideAll(deps.adapter, requests, deps.fallbackFor);

  const asked = new Map(requests.map((request, index) => [request.unitId, index]));
  const intents: Intent[] = [];

  for (const unit of state.heroes) {
    if (!unit.alive) continue;
    const index = asked.get(unit.id);
    if (index === undefined) {
      intents.push(suppressedIntent(unit, deps));
      continue;
    }
    intents.push(sanitizeIntent(answers[index], requests[index], state, deps));
  }

  const result = executeTurn(state, intents, deps);
  // The post-hit half of the gauge hook: one call per turn, on that turn's events, so
  // replaying the same start state accrues exactly once (PRD §2.5).
  gaugeOf(deps).accrue?.(result.events);
  return result;
}
