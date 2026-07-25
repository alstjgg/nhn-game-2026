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
 * Boot probe (PRD §2.2): resolves the health payload, or `null` when the proxy
 * is absent/slow — production builds, dev without a key, bad networks — in
 * which case boot picks the stub adapter. 800ms budget so boot never stalls.
 */
export async function probeHealth(timeoutMs = 800): Promise<AIHealth | null> {
  try {
    const res = await fetch('/ai/health', { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const health = (await res.json()) as AIHealth;
    return health.ok ? health : null;
  } catch {
    return null;
  }
}
