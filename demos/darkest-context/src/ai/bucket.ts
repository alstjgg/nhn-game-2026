// Situation bucket keying + the three-tier lookup cascade (PRD §2.2).
//
// The engine hands the adapter a `SituationSnapshot`; this module turns it into
// one member of a FROZEN enumerated set and then resolves an authored answer out
// of the canned pool in the PRD's declared order:
//
//   (unitId, bucket, equippedCardId) → (unitId, bucket) → (unitId, 'default')
//
// Two rules hold every step of the way:
//   • every miss is silent — a malformed entry is a MISS, not an error, and the
//     cascade simply continues to the next tier (INV-7);
//   • nothing here reads a tunable. Thresholds arrive as a required `BucketConfig`
//     parameter, so `data/tuning.json` stays the only home of a number (INV-8).
//
// Pure, synchronous, side-effect free: no timers live in this file.

import { isAgentDecision } from './contract.ts';
import type {
  AgentDecision,
  EntityView,
  SituationSnapshot,
  Stance,
  ValidationCtx,
} from './contract.ts';

/** The frozen situation set, in PRD order (PRD §2.2). */
export const SITUATION_BUCKETS = [
  'opening',
  'ally_hurt',
  'self_hurt',
  'enemy_low',
  'gauge_noise',
  'default',
] as const;

export type SituationBucket = (typeof SITUATION_BUCKETS)[number];

/** The in-bucket key an authored entry uses when it answers for any card. */
export const DEFAULT_KEY = '_';

/** The unit-wide section every unit must author — no combination dead-ends. */
const DEFAULT_SECTION = 'default';

/** Thresholds the caller supplies; every number originates in `data/tuning.json`. */
export interface BucketConfig {
  /** Turns at or below this index are still the opening. */
  openingTurn: number;
  /** Strictly-below this hp ratio counts as hurt (self and allies). */
  hurtBelowRatio: number;
  /** Strictly-below this hp ratio counts as a finishable enemy. */
  enemyLowBelowRatio: number;
}

/** Which tier of the cascade answered. */
export type PoolTier = 'card' | 'bucket' | 'default';

/** A resolved entry plus the path it was found at (debug/telemetry only). */
export interface PoolHit<T> {
  value: T;
  tier: PoolTier;
  /** Resolved lookup path, e.g. `garrett.ally_hurt.mirror_shield`. */
  key: string;
}

/** Leaf map: equipped card id (or `DEFAULT_KEY`) → authored answer, unvalidated. */
export type PoolEntries = Record<string, unknown>;

/** One unit's sections: bucket / agenda id (or `default`) → leaf map. */
export type PoolSection = Record<string, PoolEntries>;

/** The canned answer pool — `data/decisions.json` as the adapter reads it. */
export interface DecisionPool {
  decisions: Record<string, PoolSection>;
  stances?: Record<string, PoolSection>;
}

const KEY_SEPARATOR = '.';

/**
 * Strictly-below the ratio, and only while alive. A non-positive `hpMax` can never
 * be "hurt", so no snapshot can divide by zero.
 */
function isBelowRatio(view: EntityView, ratio: number): boolean {
  if (!view.alive) return false;
  if (!(view.hpMax > 0)) return false;
  return view.hp / view.hpMax < ratio;
}

/**
 * The deterministic situation bucket (PRD §2.2). Precedence is frozen: noise first
 * (a corrupted turn is noise whatever else is true), then the opening, then damage
 * read from nearest to furthest — self, allies, enemies.
 *
 * Pure: the snapshot is only read.
 */
export function computeBucket(snapshot: SituationSnapshot, config: BucketConfig): SituationBucket {
  if (snapshot.corrupted) return 'gauge_noise';
  if (snapshot.turn <= config.openingTurn) return 'opening';
  if (isBelowRatio(snapshot.self, config.hurtBelowRatio)) return 'self_hurt';
  if (snapshot.allies.some((ally) => isBelowRatio(ally, config.hurtBelowRatio))) return 'ally_hurt';
  if (snapshot.enemies.some((foe) => isBelowRatio(foe, config.enemyLowBelowRatio))) {
    return 'enemy_low';
  }
  return 'default';
}

function hitAt(
  entries: PoolEntries | undefined,
  leafKey: string,
  tier: PoolTier,
  path: readonly string[],
  ctx: ValidationCtx | undefined,
): PoolHit<AgentDecision> | null {
  if (entries === undefined) return null;
  const entry = entries[leafKey];
  // A malformed entry is a MISS, never an error: the next tier answers (INV-7).
  if (!isAgentDecision(entry, ctx)) return null;
  return { value: entry, tier, key: [...path, leafKey].join(KEY_SEPARATOR) };
}

/**
 * The shared cascade. `sectionKey` is a situation bucket for combat and an agenda id
 * for the council — the resolution order is identical in both halves.
 */
function lookupSection(
  sections: Record<string, PoolSection> | undefined,
  unitId: string,
  sectionKey: string,
  equippedCardIds: readonly string[],
  ctx: ValidationCtx | undefined,
): PoolHit<AgentDecision> | null {
  const unit = sections?.[unitId];
  if (unit === undefined) return null;

  const section = unit[sectionKey];
  // Tier 1 — the authored flips: equipped cards in the caller's slot order.
  for (const cardId of equippedCardIds) {
    const hit = hitAt(section, cardId, 'card', [unitId, sectionKey], ctx);
    if (hit !== null) return hit;
  }
  // Tier 2 — this bucket's own default.
  const bucketHit = hitAt(section, DEFAULT_KEY, 'bucket', [unitId, sectionKey], ctx);
  if (bucketHit !== null) return bucketHit;
  // Tier 3 — the unit-wide default.
  return hitAt(unit[DEFAULT_SECTION], DEFAULT_KEY, 'default', [unitId, DEFAULT_SECTION], ctx);
}

/**
 * Resolves a combat decision: `(unitId, bucket, cardId)` → `(unitId, bucket)` →
 * `(unitId, 'default')`. `null` on a total miss — the caller degrades silently.
 *
 * Pure: the pool is only read.
 */
export function lookupDecision(
  pool: DecisionPool,
  unitId: string,
  bucket: SituationBucket,
  equippedCardIds: readonly string[],
  ctx?: ValidationCtx,
): PoolHit<AgentDecision> | null {
  return lookupSection(pool.decisions, unitId, bucket, equippedCardIds, ctx);
}

/** The council half: the same three tiers, keyed by agenda id instead of bucket. */
export function lookupStance(
  pool: DecisionPool,
  unitId: string,
  agendaId: string,
  equippedCardIds: readonly string[],
  ctx?: ValidationCtx,
): PoolHit<Stance> | null {
  return lookupSection(pool.stances, unitId, agendaId, equippedCardIds, ctx);
}
