// patience-tier.ts — patience → expression tier, pure projection (PRD §2.2).
//
// EXTENDS-only module: the v1 state machine in ./index.ts stays the single source
// of the patience arithmetic; this file only *reads* a patience/budget pair and
// derives which of the four faces (0 평온 · 1 심드렁 · 2 짜증 · 3 한계) the customer
// is wearing. Nothing here mutates state and nothing here is imported by ./index.
//
// Balance-as-data (CLAUDE.md): every threshold lives in data/patience-tiers.json.
// This module contains no tuning literal of its own — only the shape rules that
// make bad data fail loudly at import time.
//
// Documented tier rules, in evaluation order:
//   1. a non-finite patience or budget throws (a silent tier would hide the bug);
//   2. an exhausted (patience at or below zero) or absent (budget at or below
//      zero) patience pool is always the limit tier — checked before the ladder,
//      so no threshold triple can report a calm face at exhaustion;
//   3. otherwise the remaining fraction (patience over budget, clamped at one for
//      an over-full pool) walks the descending threshold ladder: at a value equal
//      to a threshold the customer stays in the CALMER tier (the comparison is
//      >=), and falling under the last threshold gives the limit tier.
// The tier is therefore non-decreasing as patience falls, for any valid triple.
import raw from '../../data/patience-tiers.json';
import type { PatienceTier } from '../ai/contract';

/** Arity of the frozen PatienceTier union — also the length of tierLabels and of generation.json's tierTones. */
export const TIER_COUNT = 4;

/** One floor per non-limit tier: the limit tier is "below everything". */
const THRESHOLD_COUNT = TIER_COUNT - 1;

/** The calmest and the harshest faces, named so the ladder reads without indices. */
const CALM_TIER: PatienceTier = 0;
const LIMIT_TIER: PatienceTier = 3;

/** Descending remaining-fraction floors: [tier-0 floor, tier-1 floor, tier-2 floor]. */
export type PatienceThresholds = readonly [number, number, number];

export interface PatienceTiersConfig {
  readonly thresholds: PatienceThresholds;
  readonly tierLabels: readonly string[];
}

function typeName(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function requireThresholds(v: unknown): PatienceThresholds {
  if (!Array.isArray(v) || v.length !== THRESHOLD_COUNT) {
    throw new Error(
      `patience-tiers: thresholds must be an array of exactly ${THRESHOLD_COUNT} finite numbers (got ${typeName(v)} of length ${Array.isArray(v) ? v.length : 'n/a'})`,
    );
  }
  v.forEach((item: unknown, i: number) => {
    if (typeof item !== 'number' || !Number.isFinite(item)) {
      throw new Error(
        `patience-tiers: thresholds[${i}] must be a finite number (got ${typeName(item)})`,
      );
    }
  });
  const values: number[] = v;
  values.forEach((value, i) => {
    if (value < 0 || value > 1) {
      throw new Error(
        `patience-tiers: thresholds[${i}] must be within [0, 1] inclusive (got ${value})`,
      );
    }
  });
  if (!(values[0] > values[1] && values[1] > values[2])) {
    throw new Error(
      `patience-tiers: thresholds must be strictly descending (got ${values.join(', ')})`,
    );
  }
  return [values[0], values[1], values[2]];
}

function requireTierLabels(v: unknown): readonly string[] {
  if (!Array.isArray(v) || v.length !== TIER_COUNT) {
    throw new Error(
      `patience-tiers: tierLabels must be an array of exactly ${TIER_COUNT} non-empty strings (got ${typeName(v)} of length ${Array.isArray(v) ? v.length : 'n/a'})`,
    );
  }
  v.forEach((item: unknown, i: number) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new Error(
        `patience-tiers: tierLabels[${i}] must be a non-empty string (got ${typeName(item)})`,
      );
    }
  });
  const labels: string[] = [...v];
  return labels;
}

/**
 * Exported for direct invariant testing: callers should use the frozen
 * PATIENCE_TIERS singleton below rather than loading data themselves.
 */
export function loadPatienceTiers(input: unknown): PatienceTiersConfig {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error(`patience-tiers: root must be an object (got ${typeName(input)})`);
  }
  const record = input as { thresholds?: unknown; tierLabels?: unknown };
  const thresholds = requireThresholds(record.thresholds);
  const tierLabels = requireTierLabels(record.tierLabels);
  return Object.freeze({
    thresholds: Object.freeze(thresholds),
    tierLabels: Object.freeze(tierLabels),
  });
}

/** The shipped, validated, frozen tier configuration. */
export const PATIENCE_TIERS: PatienceTiersConfig = loadPatienceTiers(raw);

/**
 * Which face the customer is wearing at `patience` out of `budget`.
 * Pure and deterministic; see the rule list at the top of this file.
 */
export function tierFor(
  patience: number,
  budget: number,
  thresholds: PatienceThresholds = PATIENCE_TIERS.thresholds,
): PatienceTier {
  if (!Number.isFinite(patience) || !Number.isFinite(budget)) {
    throw new Error(
      `patience-tier: patience and budget must be finite (got patience=${patience}, budget=${budget})`,
    );
  }
  if (patience <= 0 || budget <= 0) return LIMIT_TIER;
  const remaining = patience > budget ? 1 : patience / budget;
  if (remaining >= thresholds[0]) return CALM_TIER;
  if (remaining >= thresholds[1]) return 1;
  if (remaining >= thresholds[2]) return 2;
  return LIMIT_TIER;
}
