// u10 — sequential presentation of a fight (PRD §2.5, INV-3/INV-4/INV-6/INV-7).
//
// The engine resolves a whole turn at once (`runTurn`); a player watches it land
// ONE unit at a time. This module is that gap: it resolves a turn, keeps the
// decisions in execution order, and hands the screen exactly one beat per `step()`.
//
// It arms no timer. A beat advances because the caller asked for one — the shell
// on a click or a scheduled tick, an automated gate by calling `step()` — so no
// spec ever has to race a clock (INV-6).
//
// It also owns the two READ-ONLY provenance facts the render layer needs and the
// engine's event stream does not carry: WHICH canned bucket answered, and whether
// the snapshot that answer was judged on was poisoned. Both are read off the
// requests the adapter actually saw, never re-derived from real state — that
// distinction is the whole of INV-4.

import { computeBucket } from '../../ai/bucket.ts';
import type { BucketConfig } from '../../ai/bucket.ts';
import { isAgentDecision } from '../../ai/contract.ts';
import type {
  AgentDecision,
  AIAdapter,
  DecideRequest,
  SituationSnapshot,
} from '../../ai/contract.ts';
import type { FallbackDecider } from '../../ai/stub.ts';
import { createCombat, runTurn } from '../../combat/turn.ts';
import type { CombatDeps, CombatEvent, CombatOutcome, CombatState } from '../../combat/types.ts';
import type { PartyLoadout } from '../../equip/types.ts';
import type { VialState } from '../../ui/index.ts';

import type { CombatBeat, CombatScreen } from './screen.ts';

/** The screen ANNOUNCES; the reward and the defeat UI belong to other units. */
export const COMBAT_VICTORY_EVENT = 'combat:victory';
export const COMBAT_DEFEAT_EVENT = 'combat:defeat';

export interface CombatVictoryDetail {
  tileId: string;
  rosterId: string;
}

export interface CombatDefeatDetail {
  tileId: string;
}

/** The bucket label a judgment that was never asked for carries (PRD §2.5, 폭주). */
export const SUPPRESSED_BUCKET = 'overload';

export interface CombatDecisionRecord {
  unitId: string;
  actionId: string;
  targetId: string | null;
  because: string[];
  coerced: boolean;
  /** Which canned bucket answered, or null when nothing was asked. */
  bucket: string | null;
  /** Whether the snapshot this unit judged on was poisoned (PRD §2.5, INV-4). */
  corrupted: boolean;
}

export interface CombatDamageRecord {
  sourceId: string;
  targetId: string;
  amount: number;
}

export interface CombatTurnRecord {
  turn: number;
  decisions: CombatDecisionRecord[];
  /** Ids that existed ONLY inside a corrupted snapshot. */
  phantomIds: string[];
  damage: CombatDamageRecord[];
  gauge: Record<string, number>;
}

export interface CombatHandoff {
  type: 'victory' | 'defeat';
  tileId: string;
  rosterId?: string;
}

/** The read-only state of a fight in progress. Plain data — serialisable as-is. */
export interface CombatFixture {
  tileId: string;
  rosterId: string;
  heroIds: string[];
  enemyIds: string[];
  outcome: CombatOutcome;
  turns: CombatTurnRecord[];
  handoffs: CombatHandoff[];
}

// ── the recording adapter ────────────────────────────────────────────────────

/** One ask, and what came back of it. */
export interface RecordedAsk {
  request: DecideRequest;
  /**
   * False when the adapter produced nothing — a pool miss, an expired budget, a
   * rejected call. The engine substitutes the 직업 기본 행동 for all three, and
   * cannot tell them apart from a genuine answer that happens to name the same
   * action; only this boundary can (INV-7).
   */
  answered: boolean;
}

export interface RecordingAdapter {
  adapter: AIAdapter;
  /** Everything asked since the last call, then cleared. */
  take: () => RecordedAsk[];
}

/**
 * Wraps any adapter and keeps what crossed it. The screen needs the SNAPSHOT a
 * unit judged on — that is where `corrupted` and the situation bucket live — and
 * the engine's event stream deliberately does not carry it.
 */
export function createRecordingAdapter(inner: AIAdapter): RecordingAdapter {
  let seen: RecordedAsk[] = [];
  return {
    take: () => {
      const out = seen;
      seen = [];
      return out;
    },
    adapter: {
      mode: inner.mode,
      decide: async (req, ctx) => {
        const ask: RecordedAsk = { request: req, answered: false };
        seen.push(ask);
        const answer = await inner.decide(req, ctx);
        ask.answered = answer !== null;
        return answer;
      },
      stance: (req, ctx) => inner.stance(req, ctx),
    },
  };
}

// ── the 폭주 pool ─────────────────────────────────────────────────────────────

/** One authored row of `data/decisions.json`'s `overload` pool. */
export interface OverloadRow {
  unitId: string;
  decision: unknown;
}

export interface OverloadFallbackOptions {
  /** The 직업 기본 행동 decider every other degraded path uses (u8). */
  base: FallbackDecider;
  authored: readonly OverloadRow[];
  /** True while this unit's judgment is skipped entirely (gauge 100). */
  isOverloaded: (unitId: string) => boolean;
  sheetIdsOf: (unitId: string) => readonly string[];
}

/**
 * The 100 tier says the FIXED 폭주 line instead of a bare "…", while still running
 * the 직업 기본 행동 the engine forces. A malformed or unattributable authored row
 * is a silent miss and the base decider answers (INV-7).
 */
export function createOverloadFallback(options: OverloadFallbackOptions): FallbackDecider {
  const { base, authored, isOverloaded, sheetIdsOf } = options;
  const byId = new Map<string, AgentDecision>();
  for (const row of authored) {
    if (isAgentDecision(row.decision, { sheetIds: sheetIdsOf(row.unitId) })) {
      byId.set(row.unitId, row.decision);
    }
  }
  return (unitId: string): AgentDecision => {
    const line = byId.get(unitId);
    if (line !== undefined && isOverloaded(unitId)) return line;
    return base(unitId);
  };
}

// ── the player ───────────────────────────────────────────────────────────────

/** The gauge reads the player needs. A subset of u9's tracker, so a stub fits too. */
export interface GaugeReader {
  valueOf: (unitId: string) => number;
  tierNameOf: (unitId: string) => VialState;
}

export interface CombatPlayerOptions {
  tileId: string;
  party: PartyLoadout;
  deps: CombatDeps;
  gauge: GaugeReader;
  screen: CombatScreen;
  /** The recorder's `take` — every ask of the turn just resolved. */
  requests: () => RecordedAsk[];
  bucketConfig: BucketConfig;
  /**
   * How many turns a playthrough may resolve. A stalemate — a party that has
   * coerced its way out of every offensive action — is drama, not a hang: the
   * fight simply stops advancing rather than spinning forever.
   */
  maxTurns: number;
}

export interface CombatPlayer {
  fixture: CombatFixture;
  /** Nothing resolves until this is called. */
  start: () => void;
  /** Exactly one presentation beat. */
  step: () => Promise<void>;
  /** Plays to an outcome (or to `maxTurns`). */
  drain: () => Promise<void>;
}

/** Ids a corrupted snapshot showed that real state never carried (INV-4). */
function phantomsOf(snapshot: SituationSnapshot, state: CombatState): string[] {
  const real = new Set(state.enemies.map((enemy) => enemy.id));
  return snapshot.enemies.filter((enemy) => !real.has(enemy.id)).map((enemy) => enemy.id);
}

export function createCombatPlayer(options: CombatPlayerOptions): CombatPlayer {
  const { tileId, party, deps, gauge, screen, requests, bucketConfig, maxTurns } = options;

  let state = createCombat(tileId, party, deps);
  const heroIds = state.heroes.map((hero) => hero.id);

  const fixture: CombatFixture = {
    tileId: state.tileId,
    rosterId: state.rosterId,
    heroIds,
    enemyIds: state.enemies.map((enemy) => enemy.id),
    outcome: 'ongoing',
    turns: [],
    handoffs: [],
  };

  const queue: CombatBeat[] = [];
  let started = false;
  let turnsPlayed = 0;
  let announced = false;

  const announce = (): void => {
    if (announced || state.outcome === 'ongoing') return;
    announced = true;
    if (state.outcome === 'victory') {
      const detail: CombatVictoryDetail = { tileId: state.tileId, rosterId: state.rosterId };
      fixture.handoffs.push({ type: 'victory', ...detail });
      screen.element.dispatchEvent(
        new CustomEvent<CombatVictoryDetail>(COMBAT_VICTORY_EVENT, { detail, bubbles: true }),
      );
      return;
    }
    const detail: CombatDefeatDetail = { tileId: state.tileId };
    fixture.handoffs.push({ type: 'defeat', ...detail });
    screen.element.dispatchEvent(
      new CustomEvent<CombatDefeatDetail>(COMBAT_DEFEAT_EVENT, { detail, bubbles: true }),
    );
  };

  /**
   * Health and context, straight off the state the turn just produced. The screen is a
   * readout and owns no state: it is TOLD the numbers, exactly like every other beat.
   */
  const paintVitals = (): void => {
    for (const hero of state.heroes) {
      screen.setVitals(hero.id, {
        hp: hero.hp,
        hpMax: hero.hpMax,
        gauge: gauge.valueOf(hero.id),
        gaugeMax: deps.tuning.gauge.max,
      });
    }
    for (const enemy of state.enemies) {
      screen.setVitals(enemy.id, { hp: enemy.hp, hpMax: enemy.hpMax });
    }
  };

  const canResolve = (): boolean => fixture.outcome === 'ongoing' && turnsPlayed < maxTurns;

  const resolveTurn = async (): Promise<void> => {
    // The tier that PRODUCED each line — read before the turn, because accrual
    // lands at the end of it.
    const tiers = new Map(heroIds.map((id) => [id, gauge.tierNameOf(id)]));
    const judged = state;

    requests();
    const result = await runTurn(judged, deps);
    const asked = new Map(requests().map((ask) => [ask.request.unitId, ask]));
    state = result.state;

    const phantomIds: string[] = [];
    for (const ask of asked.values()) {
      if (!ask.request.snapshot.corrupted) continue;
      for (const id of phantomsOf(ask.request.snapshot, judged)) {
        if (!phantomIds.includes(id)) phantomIds.push(id);
      }
    }

    const swung = new Set(
      result.events
        .filter((event): event is Extract<CombatEvent, { type: 'phantom_swing' }> =>
          event.type === 'phantom_swing',
        )
        .map((event) => event.unitId),
    );

    const decisions: CombatDecisionRecord[] = [];
    for (const event of result.events) {
      if (event.type !== 'decision') continue;
      const ask = asked.get(event.unitId);
      const corrupted = ask?.request.snapshot.corrupted ?? false;
      // The engine flags a judgment it had to REWRITE; a judgment that never
      // arrived is degraded too, and only this boundary saw the silence (INV-7).
      const coerced = event.coerced || (ask !== undefined && !ask.answered);
      decisions.push({
        unitId: event.unitId,
        actionId: event.actionId,
        targetId: event.targetId,
        because: [...event.because],
        coerced,
        // Nothing was asked ⇒ judgment was skipped ⇒ the 폭주 pool answered.
        bucket:
          ask === undefined ? SUPPRESSED_BUCKET : computeBucket(ask.request.snapshot, bucketConfig),
        corrupted,
      });
      queue.push({
        unitId: event.unitId,
        say: event.say,
        because: [...event.because],
        actionId: event.actionId,
        targetId: event.targetId,
        coerced,
        tier: tiers.get(event.unitId) ?? 'calm',
        sawPhantom: corrupted,
        phantomSwing: swung.has(event.unitId),
      });
    }

    fixture.turns.push({
      turn: judged.turn,
      decisions,
      phantomIds,
      damage: result.events
        .filter((event): event is Extract<CombatEvent, { type: 'damage' }> =>
          event.type === 'damage',
        )
        .map((event) => ({
          sourceId: event.sourceId,
          targetId: event.targetId,
          amount: event.amount,
        })),
      gauge: Object.fromEntries(heroIds.map((id) => [id, gauge.valueOf(id)])),
    });
    turnsPlayed += 1;

    for (const id of heroIds) screen.setTier(id, gauge.tierNameOf(id));
    for (const hero of state.heroes) if (!hero.alive) screen.markDown(hero.id);
    paintVitals();
    screen.setTurn(state.turn);

    fixture.outcome = state.outcome;
    screen.setOutcome(state.outcome);
    announce();
  };

  const step = async (): Promise<void> => {
    if (!started) return;
    if (queue.length === 0) {
      if (!canResolve()) return;
      await resolveTurn();
    }
    const beat = queue.shift();
    if (beat === undefined) return;
    screen.playBeat(beat);
  };

  const drain = async (): Promise<void> => {
    if (!started) return;
    // Bounded by construction: every pass either plays a queued beat or resolves a
    // turn, and both are capped.
    const bound = maxTurns * (heroIds.length + 1) + heroIds.length + 1;
    for (let pass = 0; pass < bound; pass += 1) {
      if (queue.length === 0 && !canResolve()) return;
      await step();
    }
  };

  // The opening frame already knows who is standing and how loud the context is.
  paintVitals();

  return {
    fixture,
    start: () => {
      started = true;
    },
    step,
    drain,
  };
}
