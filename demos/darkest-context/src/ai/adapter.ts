// AIAdapter — the seam every AI answer crosses (PRD §2.1–2.2). Two impls sit
// behind it: `live.ts` (fetches the dev proxy) and the stub a later unit builds
// on canned `data/` JSON. The renderer is mode-blind (INV-5).
//
// Both impls resolve `null` instead of throwing when an answer cannot be had:
// the caller falls back to that unit's 직업 기본 행동, silently (INV-7).

import type {
  AgentDecision,
  AIHealth,
  DecideRequest,
  Mode,
  Stance,
  StanceRequest,
  ValidationCtx,
} from './contract.ts';

export interface AIAdapter {
  readonly mode: Mode;
  /** Combat turn. `null` = no usable answer; the caller degrades silently. */
  decide(req: DecideRequest, ctx?: ValidationCtx): Promise<AgentDecision | null>;
  /** Council vote. `null` = no usable answer; the caller degrades silently. */
  stance(req: StanceRequest, ctx?: ValidationCtx): Promise<Stance | null>;
}

/**
 * Kept for callers that prefer an exception at their own boundary (u6). The
 * adapter itself never throws it out of `decide`/`stance`.
 */
export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

/**
 * The budget that keeps boot from stalling is a tunable, so INV-8
 * (balance-as-data) puts it in `data/tuning.json` and reads it through u4's
 * seam rather than inlining it here. Imported lazily: the AI seam's module
 * graph stays independent of the data layer, so CLI tools that import the
 * contract for its types never pull in six JSON files. The data layer imports
 * nothing from `src/ai/`, so this direction is acyclic either way.
 */
async function healthProbeBudgetMs(): Promise<number> {
  const { loadBundledGameData, resolveTuningRef } = await import('../data/loader.ts');
  return resolveTuningRef(loadBundledGameData().tuning, 'timeout.healthProbe');
}

/**
 * Boot probe (PRD §2.2): resolves the health payload, or `null` when the proxy
 * is absent/slow — production builds, dev without a key, bad networks — in
 * which case boot picks the stub adapter. Omit `timeoutMs` to use the tuned
 * budget, so no caller has to know the number.
 */
export async function probeHealth(timeoutMs?: number): Promise<AIHealth | null> {
  try {
    const budgetMs = timeoutMs ?? (await healthProbeBudgetMs());
    const res = await fetch('/ai/health', { signal: AbortSignal.timeout(budgetMs) });
    if (!res.ok) return null;
    const health = (await res.json()) as AIHealth;
    return health.ok ? health : null;
  } catch {
    return null;
  }
}
