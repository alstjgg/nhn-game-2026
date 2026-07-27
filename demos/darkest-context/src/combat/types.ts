// u8 — the value types of the combat core (PRD §2.2, §2.5).
//
// Combat state is plain data: ids, numbers and flags. Nothing here knows how a
// prompt is written and nothing here reads a clock — the ONE async step of a turn
// is the adapter fan-out in `turn.ts`, and every wait belongs to `src/ai/stub.ts`
// (INV-6). Every number an action produces is read from `data/tuning.json` through
// `CombatDeps.tuning` (INV-8), never inlined.
//
// The gauge itself is NOT this unit's: combat reads it through the injected
// `GaugePort` seam and defaults to `STATIC_GAUGE`, so the gauge unit can swap a
// live port in without touching a line of the execution core.

import type { AIAdapter, GaugeTier, SituationSnapshot } from '../ai/contract.ts';
import type { FallbackDecider } from '../ai/stub.ts';
import type { TieCandidate } from '../core/tiebreak.ts';
import type {
  Card,
  ClassDefaultAction,
  Encounters,
  Hero,
  MonsterBehavior,
  Tuning,
} from '../data/schema.ts';

export type Side = 'hero' | 'enemy';

/** `victory` hands the reward off (PRD §2.5); `defeat` ends the run. */
export type CombatOutcome = 'ongoing' | 'victory' | 'defeat';

export interface UnitState {
  id: string;
  /**
   * Position in the data file that owns this unit — `data/heroes.json` for the
   * party, the encounter's roster order for enemies. The `index` tie-break key
   * (PRD §2.2).
   */
  dataIndex: number;
  name: string;
  hp: number;
  hpMax: number;
  alive: boolean;
  side: Side;
}

export interface HeroState extends UnitState {
  side: 'hero';
  /** 민첩 — execution order runs on this, descending (PRD §2.5). */
  agi: number;
  equippedCardIds: string[];
  /** 직업 기본 행동: what a coerced or suppressed judgment falls back to. */
  classDefaultAction: ClassDefaultAction;
  /** Consumable charges, keyed by card id. Engine-owned (PRD §2.3). */
  charges: Record<string, number>;
  /** Set by `defend`, cleared at the end of the turn — 한 턴간 only. */
  defending: boolean;
  /** Whoever landed the last hit, so `last_hit_by` resolves to a real id. */
  lastHitBy?: string;
  /** Set by `guard_ally`: incoming damage on that ally lands here instead. */
  guardingId?: string;
  /** Set by 「도발」: enemy attacks are pulled onto this unit for the turn. */
  taunting?: boolean;
}

export interface EnemyState extends UnitState {
  side: 'enemy';
  monsterId: string;
  damage: number;
  /** The authored table that replaces judgment entirely (PRD §2.2). */
  behavior: MonsterBehavior;
}

export type CombatUnit = HeroState | EnemyState;

export interface CombatState {
  tileId: string;
  rosterId: string;
  turn: number;
  heroes: HeroState[];
  enemies: EnemyState[];
  outcome: CombatOutcome;
}

/**
 * What one unit does this turn. Carries NO numbers (INV-4): the adapter names an
 * enumerated action id and a target id, the engine owns every value and every
 * state change. `coerced` marks an answer the engine had to replace.
 */
export interface Intent {
  unitId: string;
  actionId: string;
  targetId: string | null;
  say: string;
  /** ≥1 sheet-item id for heroes (INV-3); empty for enemies, which never judge. */
  because: string[];
  coerced: boolean;
}

export type CombatEvent =
  | { type: 'turn_start'; turn: number }
  | {
      type: 'decision';
      unitId: string;
      actionId: string;
      targetId: string | null;
      say: string;
      because: string[];
      coerced: boolean;
    }
  | { type: 'damage'; sourceId: string; targetId: string; amount: number; actionId: string }
  | { type: 'heal'; sourceId: string; targetId: string; amount: number; actionId: string }
  | { type: 'unit_down'; unitId: string; side: Side }
  | { type: 'consumable_spent'; unitId: string; cardId: string; remaining: number }
  /** 허공을 벤다 — the target existed only in a corrupted snapshot (INV-4). */
  | { type: 'phantom_swing'; unitId: string; actionId: string }
  /** A monster landed a hit. `spam` marks 도배 — the gauge unit reads this. */
  | { type: 'hero_hit'; heroId: string; monsterId: string; spam: boolean }
  | { type: 'gauge_attack'; heroId: string; monsterId: string }
  | { type: 'victory'; tileId: string; rosterId: string }
  | { type: 'defeat'; tileId: string };

export interface TurnResult {
  state: CombatState;
  events: CombatEvent[];
}

/** The one tie-break seam, bound at boot (PRD §2.2). */
export type TieBreak = <T>(candidates: readonly TieCandidate<T>[]) => T;

/**
 * The gauge as combat sees it: four reads and one hook. Combat owns no threshold
 * and no gauge arithmetic — it only asks.
 */
export interface GaugePort {
  tierOf: (unitId: string) => GaugeTier;
  valueOf: (unitId: string) => number;
  /** 100 → judgment skipped, 직업 기본 행동 forced (PRD §2.5). */
  judgmentSuppressed: (unitId: string) => boolean;
  /** ≥70 → the JUDGMENT INPUT is poisoned. Execution still runs on real state. */
  corrupt?: (snapshot: SituationSnapshot, unitId: string) => SituationSnapshot;
  /**
   * The post-turn hook: the turn loop hands over the events it just produced and the
   * gauge decides what each one costs. Combat owns no accrual number (PRD §2.5).
   */
  accrue?: (events: readonly CombatEvent[]) => void;
}

/** The port combat runs on when no gauge is injected: a calm, silent, honest one. */
export const STATIC_GAUGE: GaugePort = {
  tierOf: () => 0,
  valueOf: () => 0,
  judgmentSuppressed: () => false,
};

export interface CombatDeps {
  tuning: Tuning;
  heroes: readonly Hero[];
  cards: readonly Card[];
  encounters: Encounters;
  adapter: AIAdapter;
  fallbackFor: FallbackDecider;
  tieBreak: TieBreak;
  /** Which ids this unit's answer may cite (INV-3). */
  sheetIdsOf: (unitId: string) => readonly string[];
  gauge?: GaugePort;
}

/** The gauge port in force for these deps. */
export function gaugeOf(deps: CombatDeps): GaugePort {
  return deps.gauge ?? STATIC_GAUGE;
}
