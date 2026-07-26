// Stub adapter — canned answers, adapter-owned waiting (PRD §2.2, INV-6/INV-7).
//
// This file is the ONLY place under `src/**` allowed to schedule a timer: every
// wait the game ever performs on a decision is armed here, from adapter config
// that originates in `data/tuning.json` (0 in unit tests, scripted in e2e). Game
// logic downstream never calls `setTimeout`.
//
// Degradation is silent by construction:
//   • a pool miss, a blown budget or a rejected call all resolve to `null`;
//   • `decideOrDefault` turns that `null` into the unit's 직업 기본 행동 with a
//     "…" bubble — never error text, never a console line (INV-7);
//   • `decideAll` fires the party's calls in parallel, so a turn costs one
//     wall-clock latency window and one bad call degrades that call only.

import { computeBucket, lookupDecision, lookupStance } from './bucket.ts';
import type { BucketConfig, DecisionPool } from './bucket.ts';
import type {
  AgentDecision,
  DecideRequest,
  Stance,
  StanceRequest,
  ValidationCtx,
} from './contract.ts';
import type { AIAdapter } from './adapter.ts';
import type { Hero } from '../data/schema.ts';

/** The bubble a degraded unit shows. Never an error string (PRD §2.2). */
export const ELLIPSIS_SAY = '…';

/** Which side of the race a wait belongs to. */
export type SleepKind = 'latency' | 'timeout';

/** A cancellable wait: the loser of the race is always cancelled. */
export interface SleepHandle {
  done: Promise<void>;
  cancel: () => void;
}

/** The injectable timer seam — tests hand in a fake, production gets `timerSleep`. */
export type Sleep = (ms: number, kind: SleepKind) => SleepHandle;

/** The one real timer in `src/**`. */
export const timerSleep: Sleep = (ms) => {
  let handle: ReturnType<typeof setTimeout> | undefined;
  const done = new Promise<void>((resolve) => {
    handle = setTimeout(resolve, ms);
  });
  return {
    done,
    cancel: () => {
      if (handle !== undefined) clearTimeout(handle);
    },
  };
};

export interface StubAdapterConfig {
  /** Canned answers, already parsed. */
  pool: DecisionPool;
  /** Simulated latency: one value, or a script consumed in call order then cycled. */
  latencyMs: number | readonly number[];
  /** Per-mode decision budget (`timeout.stub` in `data/tuning.json`). */
  timeoutMs: number;
  bucketConfig: BucketConfig;
  /** Defaults to the real timer; unit tests inject a controllable one. */
  sleep?: Sleep;
}

/**
 * The stub impl of `AIAdapter`. Answers come from the injected pool; the wait and
 * the budget come from the injected config. Never throws at the caller.
 */
export function createStubAdapter(config: StubAdapterConfig): AIAdapter {
  const sleep = config.sleep ?? timerSleep;
  let callIndex = 0;

  const nextLatencyMs = (): number => {
    const configured = config.latencyMs;
    if (typeof configured === 'number') return configured;
    if (configured.length === 0) return 0;
    const ms = configured[callIndex % configured.length];
    callIndex += 1;
    return ms;
  };

  /**
   * Races the simulated latency against the decision budget. A falsy latency arms
   * nothing at all — automated gates pay no timer, not even a zero-length one.
   */
  async function settle<T>(answer: T | null): Promise<T | null> {
    const waitMs = nextLatencyMs();
    if (!waitMs) return answer;

    const latency = sleep(waitMs, 'latency');
    const budget = sleep(config.timeoutMs, 'timeout');
    const expired = await Promise.race([
      latency.done.then(() => false),
      budget.done.then(() => true),
    ]);
    if (expired) {
      latency.cancel();
      return null;
    }
    budget.cancel();
    return answer;
  }

  return {
    mode: 'stub',
    async decide(req: DecideRequest, ctx?: ValidationCtx): Promise<AgentDecision | null> {
      const bucket = computeBucket(req.snapshot, config.bucketConfig);
      const hit = lookupDecision(config.pool, req.unitId, bucket, req.equippedCardIds, ctx);
      return settle(hit === null ? null : hit.value);
    },
    async stance(req: StanceRequest, ctx?: ValidationCtx): Promise<Stance | null> {
      const hit = lookupStance(config.pool, req.unitId, req.agendaId, req.equippedCardIds, ctx);
      return settle(hit === null ? null : hit.value);
    },
  };
}

/** Builds a unit's 직업 기본 행동 answer. Throws only on an id absent from the data. */
export type FallbackDecider = (unitId: string) => AgentDecision;

/**
 * The silent fallback (PRD §2.2): 기사 방어 · 사제 대기 · 사기꾼 회피, cited to that
 * unit's own default prompt so even a degraded bubble stays attributable (INV-3).
 *
 * An unknown unit id is a data bug, not a runtime condition — it throws rather
 * than inventing an action.
 */
export function createFallbackDecider(heroes: readonly Hero[]): FallbackDecider {
  const byId = new Map(heroes.map((hero) => [hero.id, hero]));
  return (unitId: string): AgentDecision => {
    const hero = byId.get(unitId);
    if (hero === undefined) {
      throw new Error(`unknown unit '${unitId}': not declared in data/heroes.json`);
    }
    return {
      action: hero.classDefaultAction,
      say: ELLIPSIS_SAY,
      because: [hero.defaultPrompt.id],
    };
  };
}

/**
 * One unit's turn, guaranteed to produce a displayable answer: a pool miss, an
 * expired budget or a rejected call all become that unit's class default.
 */
export async function decideOrDefault(
  adapter: AIAdapter,
  req: DecideRequest,
  fallbackFor: FallbackDecider,
  ctx?: ValidationCtx,
): Promise<AgentDecision> {
  let answer: AgentDecision | null = null;
  try {
    answer = await adapter.decide(req, ctx);
  } catch {
    answer = null;
  }
  return answer ?? fallbackFor(req.unitId);
}

/** Builds the validation context for ONE request — sheet ids are per unit (INV-3). */
export type ValidationCtxFor = (req: DecideRequest) => ValidationCtx | undefined;

/**
 * The party's turn: every call is issued before any is awaited, so the wall clock
 * is one latency window rather than the sum. Answers stay aligned to the request
 * order and a failure degrades its own index only (PRD §2.2).
 *
 * `ctxFor` is a FUNCTION, not one context: `sheetIds` are the loadout of a single
 * unit, so one context shared across the party could never be correct for more than
 * one of them — and a batch that hands the adapter no context at all validates the
 * shape of an answer without ever checking that its citations resolve (INV-3).
 */
export function decideAll(
  adapter: AIAdapter,
  requests: readonly DecideRequest[],
  fallbackFor: FallbackDecider,
  ctxFor?: ValidationCtxFor,
): Promise<AgentDecision[]> {
  return Promise.all(
    requests.map((req) => decideOrDefault(adapter, req, fallbackFor, ctxFor?.(req))),
  );
}
