// AIAdapter — the seam every AI feature flows through (PRD §2.1). PROVIDED
// INPUT for the v2 run:
//   - probeHealth + createLiveAdapter are implemented and live-smoke-verified.
//   - unit v1 implements createStubAdapter (canned v1 data + configurable
//     simulated latency) and the boot wiring: probeHealth(800ms) → live if
//     ok, else stub. Live-call failures surface as thrown AIUnavailableError;
//     the CALLER falls back to the stub adapter per-beat, silently (§3-5).
//   - ALL timing (simulated latency, prefetch waits) flows through this
//     interface — never setTimeout in game logic (§3-3).

import {
  isDialogueBeat,
  type AIHealth,
  type DialogueBeat,
  type DialogueRequest,
  type PortraitRequest,
  type PortraitSheet,
} from './contract.ts';

export interface AIAdapter {
  readonly mode: 'live' | 'stub';
  dialogue(req: DialogueRequest): Promise<DialogueBeat>;
  portrait(req: PortraitRequest): Promise<PortraitSheet>;
}

/**
 * Where the /ai/* endpoints live. Empty (default) means same-origin — the Vite
 * dev-proxy. A Pages build that should use a hosted standalone server
 * (server/standalone.mjs) sets VITE_AI_BASE_URL at build time, e.g.
 * `VITE_AI_BASE_URL=https://ai.example.com npm run build`. No trailing slash.
 */
const AI_BASE_URL: string = (import.meta.env?.VITE_AI_BASE_URL ?? '').replace(/\/$/, '');

/** Thrown when the live path fails; callers degrade to stub, never show errors. */
export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

/**
 * Boot probe (PRD §2.1): resolves the health payload, or null when the proxy
 * is absent/slow — i.e. production builds, dev without keys, bad networks —
 * in which case boot picks the stub adapter.
 */
export async function probeHealth(timeoutMs = 800): Promise<AIHealth | null> {
  try {
    const res = await fetch(`${AI_BASE_URL}/ai/health`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const health = (await res.json()) as AIHealth;
    return health.ok ? health : null;
  } catch {
    return null;
  }
}

/** Live adapter: fetches the dev-proxy. One retry on schema-invalid dialogue
 * output (PRD §2.1), then throws AIUnavailableError for the caller's stub
 * fallback. No keys here — they exist only in the proxy's process.env. */
export function createLiveAdapter(): AIAdapter {
  async function postJson<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
    const res = await fetch(`${AI_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new AIUnavailableError(`${path} → ${res.status}`);
    return (await res.json()) as T;
  }

  return {
    mode: 'live',
    async dialogue(req) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const beat = await postJson<unknown>('/ai/dialogue', req, 35_000);
        if (isDialogueBeat(beat)) return beat;
      }
      throw new AIUnavailableError('/ai/dialogue → schema-invalid twice');
    },
    async portrait(req) {
      const sheet = await postJson<PortraitSheet>('/ai/portrait', req, 180_000);
      if (typeof sheet.b64 !== 'string' || !sheet.b64) {
        throw new AIUnavailableError('/ai/portrait → no image payload');
      }
      return sheet;
    },
  };
}
