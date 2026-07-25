// patience-tier.ts — classifies the customer's patience bar into an expression
// tier (PRD §2.2: 평온 · 심드렁 · 짜증 · 한계). Read-only derivation: the single
// source of patience arithmetic stays in src/state/index.ts (chooseDialogue);
// this module never mutates state and never decides a phase.
//
// Balance-as-data: every tuning number comes from data/patience-tiers.json, so
// no threshold literal is inlined here. The binding rule, in this exact order:
//   1. non-finite patience or budget      -> throw (never a silent tier)
//   2. patience at or below zero          -> LIMIT tier (hard rule, checked first)
//   3. budget at or below zero            -> LIMIT tier (no divide-by-zero)
//   4. ratio = min(1, patience / budget); walk the descending threshold ladder
//      and return the first tier whose floor the ratio clears
//   5. clearing none of them               -> LIMIT tier
// Comparisons use `>=`: exactly on a threshold the calmer tier wins. The tier
// index is 1:1 with data/generation.json `tierTones` (index order is frozen).
import raw from '../../data/patience-tiers.json';
import type { PatienceTier } from '../ai/contract';

/** Descending ratio floors for tiers 0, 1 and 2; anything below t2 is the limit tier. */
export type PatienceThresholds = readonly [number, number, number];

export interface PatienceTierConfig {
  readonly thresholds: PatienceThresholds;
  readonly tierLabels: readonly string[];
}

/** Arity of the PatienceTier union (0 | 1 | 2 | 3) — pinned to generation.json tierTones. */
export const TIER_COUNT = 4;

/** One floor per tier except the last: the limit tier is the fallthrough. */
const THRESHOLD_COUNT = TIER_COUNT - 1;

/** The harshest tier: derived from TIER_COUNT, not hand-pinned, so it moves with the arity. */
const LIMIT_TIER: PatienceTier = (TIER_COUNT - 1) as PatienceTier;

/**
 * Tier reported when the ratio clears thresholds[i] but no earlier one, in
 * ladder order. Length is derived from THRESHOLD_COUNT (itself derived from
 * TIER_COUNT), so tierFor's loop below always walks exactly as many floors as
 * requireThresholds requires — growing TIER_COUNT can no longer leave a
 * threshold unread while a hand-unrolled branch keeps reporting the old limit
 * tier forever (see PR #37 review).
 */
const NON_LIMIT_TIERS: readonly PatienceTier[] = Array.from(
  { length: THRESHOLD_COUNT },
  (_unused, tier) => tier as PatienceTier,
);

const FULL_RATIO = 1;
const EMPTY_RATIO = 0;

const PREFIX = 'patience-tiers:';

function typeName(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function requireThresholds(v: unknown): PatienceThresholds {
  if (!Array.isArray(v)) {
    throw new Error(`${PREFIX} field 'thresholds' must be an array (got ${typeName(v)})`);
  }
  // Re-bind through `readonly unknown[]`: `Array.isArray` narrows `unknown` to `any[]`,
  // which would silently defeat every element-access check below (see PR #37 review).
  const arr: readonly unknown[] = v;
  if (arr.length !== THRESHOLD_COUNT) {
    throw new Error(
      `${PREFIX} field 'thresholds' must hold exactly ${THRESHOLD_COUNT} entries (got ${arr.length})`,
    );
  }
  const nums: number[] = arr.map((entry, i): number => {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) {
      throw new Error(
        `${PREFIX} 'thresholds[${i}]' must be a finite number (got ${typeName(entry)})`,
      );
    }
    if (entry < EMPTY_RATIO || entry > FULL_RATIO) {
      throw new Error(
        `${PREFIX} 'thresholds[${i}]' must be a ratio within [${EMPTY_RATIO}, ${FULL_RATIO}] (got ${entry})`,
      );
    }
    return entry;
  });
  for (let i = 1; i < nums.length; i++) {
    if (!(nums[i - 1] > nums[i])) {
      throw new Error(
        `${PREFIX} 'thresholds' must be strictly descending (${nums[i - 1]} is not above ${nums[i]})`,
      );
    }
  }
  return [nums[0], nums[1], nums[2]];
}

function requireTierLabels(v: unknown): readonly string[] {
  if (!Array.isArray(v)) {
    throw new Error(`${PREFIX} field 'tierLabels' must be an array (got ${typeName(v)})`);
  }
  // Same narrowing hazard as requireThresholds: keep element access behind `unknown`.
  const arr: readonly unknown[] = v;
  if (arr.length !== TIER_COUNT) {
    throw new Error(
      `${PREFIX} field 'tierLabels' must hold exactly ${TIER_COUNT} entries (got ${arr.length})`,
    );
  }
  return arr.map((label, i): string => {
    if (typeof label !== 'string') {
      throw new Error(`${PREFIX} 'tierLabels[${i}]' must be a string (got ${typeName(label)})`);
    }
    if (label.trim().length === 0) {
      throw new Error(`${PREFIX} 'tierLabels[${i}]' must not be empty`);
    }
    return label;
  });
}

/**
 * Validates and freezes a patience-tier config. Exported so the shipped data and
 * any future variant can be invariant-tested directly; runtime callers should use
 * the PATIENCE_TIERS singleton below. Fails loudly — a bad tuning file must not
 * degrade into a silently wrong expression.
 */
export function loadPatienceTiers(input: unknown): PatienceTierConfig {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error(`${PREFIX} root must be an object (got ${typeName(input)})`);
  }
  const thresholds = requireThresholds((input as { thresholds: unknown }).thresholds);
  const tierLabels = requireTierLabels((input as { tierLabels: unknown }).tierLabels);
  return Object.freeze({
    thresholds: Object.freeze(thresholds),
    tierLabels: Object.freeze(tierLabels),
  });
}

/** The shipped tuning, validated at module load. */
export const PATIENCE_TIERS: PatienceTierConfig = loadPatienceTiers(raw);

/**
 * Pure classifier: patience + its budget -> expression tier. Total for every
 * finite input (negative or over-budget values are clamped, never thrown on);
 * non-finite input throws, because a NaN patience would otherwise masquerade as
 * an exhausted customer.
 *
 * `config` must be a validated `PatienceTierConfig` (i.e. the return value of
 * `loadPatienceTiers`, or the shipped `PATIENCE_TIERS` default) — never a raw
 * threshold triple. Requiring the validated shape here, rather than an
 * unchecked `PatienceThresholds`, closes off a public API path that could
 * otherwise bypass AC2's balance-as-data guarantees and AC3's monotonicity
 * guarantee (both hold only for thresholds that passed `requireThresholds`).
 */
export function tierFor(
  patience: number,
  budget: number,
  config: PatienceTierConfig = PATIENCE_TIERS,
): PatienceTier {
  if (!Number.isFinite(patience) || !Number.isFinite(budget)) {
    throw new Error(
      `${PREFIX} tierFor needs finite numbers (patience=${patience}, budget=${budget})`,
    );
  }
  if (patience <= EMPTY_RATIO) return LIMIT_TIER;
  if (budget <= EMPTY_RATIO) return LIMIT_TIER;
  const ratio = Math.min(FULL_RATIO, patience / budget);
  for (let i = 0; i < config.thresholds.length; i++) {
    if (ratio >= config.thresholds[i]) return NON_LIMIT_TIERS[i];
  }
  return LIMIT_TIER;
}
