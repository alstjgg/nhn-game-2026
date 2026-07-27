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

/** Where the boot-probe budget is declared (PRD §2.2, INV-6 — timing lives in data/). */
const HEALTH_PROBE_REF = 'timeout.healthProbe';

/**
 * The declared boot-probe budget in ms.
 *
 * The data layer is pulled in lazily on purpose: `contract.ts` re-exports `probeHealth`,
 * and node-run tooling (`tools/ai-smoke`) imports that module directly, where the
 * bundler-only data layer would not resolve. A dynamic import keeps the data seam out of
 * the module graph until a probe actually runs.
 */
async function healthProbeBudgetMs(): Promise<number> {
  const { loadBundledGameData, resolveTuningRef } = await import('../data/loader.ts');
  return resolveTuningRef(loadBundledGameData().tuning, HEALTH_PROBE_REF);
}

/**
 * Boot probe (PRD §2.2): resolves the health payload, or `null` when the proxy
 * is absent/slow — production builds, dev without a key, bad networks — in
 * which case boot picks the stub adapter. The budget comes from
 * `data/tuning.json` (`timeout.healthProbe`) so boot never stalls.
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
