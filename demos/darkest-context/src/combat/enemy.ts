// u8 — enemy behavior tables and the combat outcome (PRD §2.2, §2.5).
//
// Enemies NEVER call the adapter. A monster's whole brain is the rule its entry in
// `data/encounters.json` declares, resolved here into a target: 스팸 골렘 hunts the
// hurt hero, 환각 정령 goes for whoever is closest to losing their context. Every
// tie — and "nobody is hurt yet" IS a tie — resolves through the injected `tieBreak`
// seam (PRD §2.2), so an automated gate replays a fight exactly.
//
// Candidate indexes are positions in `state.heroes`, which `createCombat` seeds in
// `data/heroes.json` order — so the `index` policy picks the lowest heroes.json
// index, as PRD §2.2 requires.

import { toCandidates } from '../core/tiebreak.ts';
import type { TieCandidate } from '../core/tiebreak.ts';
import type { BehaviorRule } from '../data/schema.ts';

import { gaugeOf } from './types.ts';
import type { CombatDeps, CombatOutcome, CombatState, HeroState, Intent } from './types.ts';

/** The action id an enemy intent carries. Monsters have one verb: they attack. */
export const MONSTER_ATTACK_ACTION = 'attack';

/** How a monster's attack lands: as damage, or as pure context noise. */
export type AttackKind = 'hit' | 'gauge';

export interface BehaviorSpec {
  readonly attack: AttackKind;
  readonly select: (state: CombatState, deps: CombatDeps) => HeroState | null;
}

function livingHeroes(state: CombatState): TieCandidate<HeroState>[] {
  return toCandidates(state.heroes, (hero) => hero.alive);
}

function pick(
  candidates: readonly TieCandidate<HeroState>[],
  deps: CombatDeps,
): HeroState | null {
  return candidates.length === 0 ? null : deps.tieBreak(candidates);
}

/**
 * 도배 hunts damage: the lowest-HP hero AMONG those already hurt, which is what
 * concentrates the gauge on one unit turn after turn (PRD §2.5 early drama). With
 * nobody hurt yet there is no "lowest" to prefer — the party is tied and the seam
 * picks, rather than the golem manufacturing a favourite out of raw HP totals.
 */
function lowestHpHero(state: CombatState, deps: CombatDeps): HeroState | null {
  const hurt = toCandidates(state.heroes, (hero) => hero.alive && hero.hp < hero.hpMax);
  if (hurt.length === 0) return pick(livingHeroes(state), deps);

  const lowest = Math.min(...hurt.map((candidate) => candidate.value.hp));
  return pick(
    hurt.filter((candidate) => candidate.value.hp === lowest),
    deps,
  );
}

function highestGaugeHero(state: CombatState, deps: CombatDeps): HeroState | null {
  const gauge = gaugeOf(deps);
  const living = livingHeroes(state);
  if (living.length === 0) return null;

  const highest = Math.max(...living.map((candidate) => gauge.valueOf(candidate.value.id)));
  return pick(
    living.filter((candidate) => gauge.valueOf(candidate.value.id) === highest),
    deps,
  );
}

/** One entry per rule declared in `data/encounters.json` — no rule, no monster. */
export const BEHAVIOR_TABLE: Record<BehaviorRule, BehaviorSpec> = {
  lowest_hp_hero: { attack: 'hit', select: lowestHpHero },
  highest_gauge_hero: { attack: 'gauge', select: highestGaugeHero },
};

/** 「도발」 pulls every enemy attack onto the taunting unit for the turn. */
function tauntedTarget(state: CombatState, deps: CombatDeps): HeroState | null {
  return pick(
    toCandidates(state.heroes, (hero) => hero.alive && hero.taunting === true),
    deps,
  );
}

/**
 * One intent per living enemy, in roster order. No attribution: an enemy bubble
 * with an empty `because` would contradict INV-3, so enemies get no bubble at all.
 * Called on POST-hero-phase state, so an enemy the party just killed never swings.
 */
export function enemyIntents(state: CombatState, deps: CombatDeps): Intent[] {
  return [...state.enemies]
    .filter((enemy) => enemy.alive)
    .sort((a, b) => a.dataIndex - b.dataIndex)
    .map((enemy) => {
      const target = tauntedTarget(state, deps) ?? BEHAVIOR_TABLE[enemy.behavior.rule].select(state, deps);
      return {
        unitId: enemy.id,
        actionId: MONSTER_ATTACK_ACTION,
        targetId: target === null ? null : target.id,
        say: '',
        because: [],
        coerced: false,
      };
    });
}

/** Defeat when the whole party is down; victory when the roster is (PRD §2.5). */
export function resolveOutcome(state: CombatState): CombatOutcome {
  if (state.heroes.every((hero) => !hero.alive)) return 'defeat';
  if (state.enemies.every((enemy) => !enemy.alive)) return 'victory';
  return 'ongoing';
}
