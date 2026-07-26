// u8 — the engine-built situation snapshot (PRD §2.2, INV-1/INV-4).
//
// Ids, numbers and short labels only: prose composition is server-side, so nothing
// here writes a sentence. The snapshot is JUDGMENT INPUT — the gauge port may
// poison it (a phantom enemy at ≥70) and execution still runs on real state.
//
// Corpses are listed truthfully rather than hidden: the engine, not the model,
// decides that a corpse is not a legal target.

import type {
  ActionOption,
  DecideRequest,
  EntityView,
  SituationSnapshot,
} from '../ai/contract.ts';

import { combatActionsFor, toActionOptions } from './execute.ts';
import { gaugeOf } from './types.ts';
import type { CombatDeps, CombatState, CombatUnit, HeroState } from './types.ts';

function entityView(unit: CombatUnit): EntityView {
  return { id: unit.id, name: unit.name, hp: unit.hp, hpMax: unit.hpMax, alive: unit.alive };
}

function requireHero(state: CombatState, unitId: string): HeroState {
  const hero = state.heroes.find((candidate) => candidate.id === unitId);
  if (hero === undefined) throw new Error(`unit '${unitId}' is not in this combat`);
  return hero;
}

/** What this unit may pick this turn: the base three plus whatever its cards add. */
export function offeredActions(
  state: CombatState,
  unitId: string,
  deps: CombatDeps,
): ActionOption[] {
  return toActionOptions(combatActionsFor(requireHero(state, unitId), deps));
}

/**
 * The situation as one unit sees it. `corrupt` gets the finished snapshot and its
 * answer is taken verbatim — u8 owns no gauge threshold, so the noise rule can
 * change without touching this file.
 */
export function buildSnapshot(
  state: CombatState,
  unitId: string,
  deps: CombatDeps,
): SituationSnapshot {
  const gauge = gaugeOf(deps);
  const self = requireHero(state, unitId);

  const snapshot: SituationSnapshot = {
    turn: state.turn,
    self: {
      ...entityView(self),
      gaugeTier: gauge.tierOf(unitId),
      ...(self.lastHitBy === undefined ? {} : { lastHitBy: self.lastHitBy }),
    },
    allies: state.heroes.filter((hero) => hero.id !== unitId).map(entityView),
    enemies: state.enemies.map(entityView),
    availableActions: offeredActions(state, unitId, deps),
    corrupted: false,
  };

  return gauge.corrupt === undefined ? snapshot : gauge.corrupt(snapshot, unitId);
}

/**
 * One request per unit still entitled to judge. A downed unit does not act and a
 * unit at gauge 100 has its judgment skipped (PRD §2.5) — neither costs a call.
 */
export function buildDecideRequests(state: CombatState, deps: CombatDeps): DecideRequest[] {
  const gauge = gaugeOf(deps);
  return state.heroes
    .filter((hero) => hero.alive && !gauge.judgmentSuppressed(hero.id))
    .map((hero) => ({
      unitId: hero.id,
      equippedCardIds: [...hero.equippedCardIds],
      snapshot: buildSnapshot(state, hero.id, deps),
    }));
}
