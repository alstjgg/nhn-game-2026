// u9 — what the ≥70 noise injection IS (PRD §2.5, §4-4 / INV-4).
//
// Noise corrupts the JUDGMENT INPUT and nothing else. The snapshot handed to the
// adapter grows one phantom enemy; real state never hears about it, so a unit that
// honestly swings at what it was shown misses into 허공 (`execute.ts` renders that)
// instead of touching a real body. A phantom swing is therefore NOT a coercion —
// the unit judged correctly on bad input, which is the whole point of must-prove 4.
//
// This module owns no threshold: it corrupts whatever it is handed, unconditionally.
// The ≥70 gate is a gauge number and lives in `gauge.ts`, so `data/tuning.json` stays
// the single owner of the boundary (INV-8).

import type { EntityView, SituationSnapshot } from '../ai/contract.ts';
import type { Encounters } from '../data/schema.ts';

/** 허공을 벤다 — how a swing that found nothing renders (PRD §2.5). */
export const PHANTOM_MISS_SAY = '허공을 벤다';

/**
 * The phantom's id: the monster it doubles plus its place on the line, so T1's
 * single 스팸 골렘 produces `spam_golem_2` (PRD §2.5) and T7's pair `spam_golem_3`.
 */
export function phantomIdFor(monsterId: string, ordinal: number): string {
  return `${monsterId}_${ordinal}`;
}

/** Which monster an instance id was built from — the rosters are the only record. */
function monsterIdOf(encounters: Encounters, instanceId: string): string | undefined {
  for (const roster of encounters.rosters) {
    const entry = roster.entries.find((candidate) => candidate.instanceId === instanceId);
    if (entry !== undefined) return entry.monsterId;
  }
  return undefined;
}

/**
 * Doubles the first living enemy of the line-up into a phantom. Pure, deterministic
 * and RNG-free: the same snapshot always corrupts identically, and the snapshot handed
 * in is never touched.
 *
 * A snapshot with nothing to double — no living enemy, or an instance id no roster
 * declares — comes back untouched and uncorrupted: a `corrupted` turn with no phantom
 * in it would route to the `gauge_noise` bucket for no visible reason.
 */
export function injectNoise(
  snapshot: SituationSnapshot,
  encounters: Encounters,
): SituationSnapshot {
  const living = snapshot.enemies.filter((enemy) => enemy.alive);
  const doubled = living[0];
  if (doubled === undefined) return snapshot;

  const monsterId = monsterIdOf(encounters, doubled.id);
  if (monsterId === undefined) return snapshot;

  const monster = encounters.monsters.find((candidate) => candidate.id === monsterId);
  if (monster === undefined) return snapshot;

  const copies = living.filter(
    (enemy) => monsterIdOf(encounters, enemy.id) === monsterId,
  ).length;

  // A whole, living body, so the poisoned line-up reads as ordinary to the model.
  const phantom: EntityView = {
    id: phantomIdFor(monsterId, copies + 1),
    name: monster.name,
    hp: monster.hp,
    hpMax: monster.hp,
    alive: true,
  };

  return { ...snapshot, enemies: [...snapshot.enemies, phantom], corrupted: true };
}

/** `GaugePort.corrupt`'s shape: the gauge decides WHO, this decides WHAT. */
export type NoiseInjector = (snapshot: SituationSnapshot, unitId: string) => SituationSnapshot;

export interface NoiseInjectorOptions {
  encounters: Encounters;
}

/** Binds the roster data an injection needs, leaving the tier gate to the gauge. */
export function createNoiseInjector(options: NoiseInjectorOptions): NoiseInjector {
  const { encounters } = options;
  return (snapshot) => injectNoise(snapshot, encounters);
}
