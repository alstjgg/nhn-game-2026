// u15 — `data/decisions.json` nested the way the adapter reads it (PRD §2.2).
//
// One adapter answers both halves of the game, so one pool has to carry both sections:
// `decisions` keyed by situation bucket (combat) and `stances` keyed by agenda id (the
// council). The council half already has a reshaper of its own — u11's `buildStancePool`
// — so only the combat nesting is built here.
//
// Every row is shape-checked and a malformed one is simply not nested: a miss falls
// through the cascade to the unit's default, silently (INV-7).

import { DEFAULT_KEY } from '../ai/bucket.ts';
import type { DecisionPool, PoolSection } from '../ai/bucket.ts';
import { buildStancePool } from '../council/pool.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** One authored row of the `combat` section, shape-checked only. */
interface CombatRow {
  unitId: string;
  bucket: string;
  cardId: string | null;
  decision: unknown;
}

function readCombatRow(value: unknown): CombatRow | null {
  if (!isRecord(value)) return null;
  if (!isId(value.unitId) || !isId(value.bucket)) return null;
  if (!isRecord(value.decision)) return null;
  const cardId = value.cardId;
  if (cardId !== null && cardId !== undefined && !isId(cardId)) return null;
  return {
    unitId: value.unitId,
    bucket: value.bucket,
    cardId: isId(cardId) ? cardId : null,
    decision: value.decision,
  };
}

/** The whole canned pool: combat answers plus council stances, one lookup surface. */
export function buildDecisionPool(
  combat: readonly unknown[],
  council: readonly unknown[],
): DecisionPool {
  const decisions: Record<string, PoolSection> = {};
  for (const raw of combat) {
    const row = readCombatRow(raw);
    if (row === null) continue;
    const unit = (decisions[row.unitId] ??= {});
    const section = (unit[row.bucket] ??= {});
    section[row.cardId ?? DEFAULT_KEY] = row.decision;
  }
  return { decisions, stances: buildStancePool(council).stances };
}
