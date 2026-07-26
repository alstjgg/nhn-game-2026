// u9 — the context gauge (PRD §2.5, INV-4/INV-7/INV-8).
//
// Engine-managed, deterministic, level-designable state: numbers in, tier out. This
// file owns the §2.5 accrual rules and the four boundaries, and it owns NO number —
// every one of them is read out of `data/tuning.json`, so balance stays data (INV-8)
// and 40 / 70 / 100 have exactly one home.
//
// Two rules are enforced rather than documented:
//   · a reading only ever rises. `add`/`addAll` reject a negative delta, so the ONLY
//     way a gauge falls is `setAll` fed by the 휴식 tile (§2.7).
//   · noise is gated here, not in `noise.ts`. The gauge knows the boundary; the noise
//     module knows the corruption. A gauge built without a `noise` injector produces a
//     port that never corrupts anything, which is what every non-combat caller wants.

import type { GaugeTier, SituationSnapshot } from '../ai/contract.ts';
import { resolveTuningRef } from '../data/loader.ts';
import type { Encounters, Tuning } from '../data/schema.ts';

import type { CombatEvent, GaugePort } from './types.ts';
import type { NoiseInjector } from './noise.ts';

/** The four bands of §2.5, ascending — the names the HUD vial already uses. */
export const GAUGE_TIER_NAMES = ['calm', 'uneasy', 'limit', 'overload'] as const;
export type GaugeTierName = (typeof GAUGE_TIER_NAMES)[number];

/** One unit's reading — the shape the 휴식 tile hands back (`equip/rest.ts`). */
export interface GaugeReading {
  id: string;
  gauge: number;
}

// ── pure readers ─────────────────────────────────────────────────────────────

function requireReadable(value: number, tuning: Tuning): number {
  const { tiers, max } = tuning.gauge;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`gauge must be a finite number, got ${String(value)}`);
  }
  if (value < tiers.calm || value > max) {
    throw new RangeError(`gauge must be within ${tiers.calm}–${max}, got ${String(value)}`);
  }
  return value;
}

/** Folds a raw number into the legal band. The floor is 평온, the ceiling `gauge.max`. */
export function clampGauge(value: number, tuning: Tuning): number {
  const { tiers, max } = tuning.gauge;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`gauge must be a finite number, got ${String(value)}`);
  }
  return Math.min(Math.max(value, tiers.calm), max);
}

/**
 * The band a reading sits in. Every boundary is inclusive-lower, so a unit sitting
 * exactly on 70 has already entered 한계. An out-of-range reading is a wiring bug,
 * not a band to guess at.
 */
export function gaugeTierIndex(value: number, tuning: Tuning): GaugeTier {
  const { tiers } = tuning.gauge;
  requireReadable(value, tuning);

  if (value >= tiers.overload) return 3;
  if (value >= tiers.limit) return 2;
  if (value >= tiers.uneasy) return 1;
  return 0;
}

export function gaugeTierName(value: number, tuning: Tuning): GaugeTierName {
  return GAUGE_TIER_NAMES[gaugeTierIndex(value, tuning)];
}

/** ≥70 한계 — the judgment INPUT is poisoned from here up (PRD §2.5). */
export function isNoiseTier(value: number, tuning: Tuning): boolean {
  return gaugeTierIndex(value, tuning) >= 2;
}

/** 100 폭주 — judgment is skipped and the 직업 기본 행동 is forced (PRD §2.5). */
export function isJudgmentSuppressed(value: number, tuning: Tuning): boolean {
  return gaugeTierIndex(value, tuning) === 3;
}

// ── accrual ──────────────────────────────────────────────────────────────────

interface Accrual {
  unitId: string;
  delta: number;
}

/**
 * What one combat event costs a unit's context. The extra numbers are read off the
 * monster's declared tuning refs — 도배 and 환각 are authored in `data/encounters.json`
 * (INV-8), never branched on here by monster id.
 *
 * A hit whose monster is not in the data still accrues the plain 피격: a hit is a hit.
 */
function accrualFor(
  event: CombatEvent,
  tuning: Tuning,
  encounters: Encounters,
): Accrual | null {
  switch (event.type) {
    case 'hero_hit': {
      const monster = encounters.monsters.find((candidate) => candidate.id === event.monsterId);
      const extraRef = monster?.gaugeOnHitExtraRef;
      const extra = extraRef === undefined ? 0 : resolveTuningRef(tuning, extraRef);
      return { unitId: event.heroId, delta: tuning.gauge.onHit + extra };
    }
    case 'gauge_attack': {
      const monster = encounters.monsters.find((candidate) => candidate.id === event.monsterId);
      const attackRef = monster?.gaugeOnAttackRef;
      if (attackRef === undefined) return null;
      return { unitId: event.heroId, delta: resolveTuningRef(tuning, attackRef) };
    }
    default:
      return null;
  }
}

// ── the tracker ──────────────────────────────────────────────────────────────

export interface GaugeOptions {
  /** The party this gauge tracks, in seed order — `entries()` reports that order. */
  unitIds: readonly string[];
  tuning: Tuning;
  encounters: Encounters;
  /** Wire this to poison the judgment input from 한계 up. Omitted → never corrupts. */
  noise?: NoiseInjector;
}

export interface Gauge {
  valueOf: (unitId: string) => number;
  tierOf: (unitId: string) => GaugeTier;
  tierNameOf: (unitId: string) => GaugeTierName;
  entries: () => GaugeReading[];
  /** Rises only — the 휴식 tile is the single relief (PRD §2.5). */
  add: (unitId: string, delta: number) => void;
  /** 퍼즐 오답 — the whole party at once. */
  addAll: (delta: number) => void;
  /** The 휴식 seam: takes the relieved readings back verbatim, clamped. */
  setAll: (readings: readonly GaugeReading[]) => void;
  accrue: (events: readonly CombatEvent[]) => void;
  /** The read-only face the combat core holds. Live — it shares this tracker's state. */
  port: () => GaugePort;
}

export function createGauge(options: GaugeOptions): Gauge {
  const { unitIds, tuning, encounters, noise } = options;
  const values = new Map<string, number>(unitIds.map((id) => [id, tuning.gauge.tiers.calm]));

  const read = (unitId: string): number => {
    const value = values.get(unitId);
    if (value === undefined) {
      throw new RangeError(`unit '${unitId}' is not tracked by this gauge`);
    }
    return value;
  };

  const write = (unitId: string, next: number): void => {
    values.set(unitId, clampGauge(next, tuning));
  };

  const requireRise = (delta: number): number => {
    if (typeof delta !== 'number' || !Number.isFinite(delta) || delta < 0) {
      throw new RangeError(
        `a gauge only rises — the 휴식 tile is the only relief (PRD §2.5), got ${String(delta)}`,
      );
    }
    return delta;
  };

  /** INV-7: an event about a unit outside this party is not this gauge's business. */
  const bump = (unitId: string, delta: number): void => {
    const current = values.get(unitId);
    if (current === undefined) return;
    write(unitId, current + delta);
  };

  const valueAt = (unitId: string): number => read(unitId);
  const tierAt = (unitId: string): GaugeTier => gaugeTierIndex(read(unitId), tuning);

  const accrue = (events: readonly CombatEvent[]): void => {
    for (const event of events) {
      const accrual = accrualFor(event, tuning, encounters);
      if (accrual !== null) bump(accrual.unitId, accrual.delta);
    }
  };

  const port: GaugePort = {
    tierOf: tierAt,
    valueOf: valueAt,
    judgmentSuppressed: (unitId) => isJudgmentSuppressed(read(unitId), tuning),
    accrue,
    ...(noise === undefined
      ? {}
      : {
          corrupt: (snapshot: SituationSnapshot, unitId: string) =>
            isNoiseTier(read(unitId), tuning) ? noise(snapshot, unitId) : snapshot,
        }),
  };

  return {
    valueOf: valueAt,
    tierOf: tierAt,
    tierNameOf: (unitId) => gaugeTierName(read(unitId), tuning),
    entries: () => [...values].map(([id, gauge]) => ({ id, gauge })),
    add: (unitId, delta) => {
      write(unitId, read(unitId) + requireRise(delta));
    },
    addAll: (delta) => {
      requireRise(delta);
      for (const id of values.keys()) bump(id, delta);
    },
    setAll: (readings) => {
      for (const reading of readings) {
        if (values.has(reading.id)) write(reading.id, reading.gauge);
      }
    },
    accrue,
    port: () => port,
  };
}
