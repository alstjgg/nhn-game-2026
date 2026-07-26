// u11 — data/decisions.json's council half, nested the way the adapter reads it.
//
// The cascade itself is u6's (`lookupStance`: card → agenda default → unit default); this
// file only reshapes the authored rows into the pool that cascade walks:
//
//   unitId → agendaId → (cardId | DEFAULT_KEY) → stance
//
// Entries arrive as raw JSON, so every row is shape-checked here. A malformed row is a
// silent MISS — it is simply not nested — exactly like every other pool miss (INV-7).

import { DEFAULT_KEY } from '../ai/bucket.ts';
import type { DecisionPool, PoolSection } from '../ai/bucket.ts';

interface NestableEntry {
  unitId: string;
  agendaId: string;
  cardId: string | null;
  stance: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Shape only — whether the stance itself is usable is `isAgentDecision`'s call, later. */
function readEntry(value: unknown): NestableEntry | null {
  if (!isRecord(value)) return null;
  if (!isId(value.unitId) || !isId(value.agendaId)) return null;
  if (!isRecord(value.stance)) return null;
  const cardId = value.cardId;
  if (cardId !== null && cardId !== undefined && !isId(cardId)) return null;
  return {
    unitId: value.unitId,
    agendaId: value.agendaId,
    cardId: isId(cardId) ? cardId : null,
    stance: value.stance,
  };
}

/**
 * The council-only pool. `decisions` stays empty on purpose: combat answers live in
 * another section of the same file and belong to another unit's adapter wiring.
 */
export function buildStancePool(entries: readonly unknown[]): DecisionPool {
  const stances: Record<string, PoolSection> = {};
  for (const raw of entries) {
    const entry = readEntry(raw);
    if (entry === null) continue;
    const unit = (stances[entry.unitId] ??= {});
    const section = (unit[entry.agendaId] ??= {});
    section[entry.cardId ?? DEFAULT_KEY] = entry.stance;
  }
  return { decisions: {}, stances };
}
