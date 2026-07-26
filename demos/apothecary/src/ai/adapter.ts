// AIAdapter is the seam every AI feature flows through (PRD §2.1). Boot probes
// once, live dialogue makes one request without retrying, and callers silently
// fall back to authored beats when that request is unavailable. All timing
// flows through this interface rather than game-logic timers (§3-3).

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
 * dev-proxy. A Pages build that should use the hosted Lambda endpoint sets
 * VITE_AI_BASE_URL at build time, e.g.
 * `VITE_AI_BASE_URL=https://ai.example.com npm run build`. No trailing slash.
 */
const AI_BASE_URL: string = (import.meta.env?.VITE_AI_BASE_URL ?? '').replace(/\/$/, '');
export const HEALTH_PROBE_TIMEOUT_MS = 8_000;
export const DIALOGUE_TIMEOUT_MS = 8_500;

/** Thrown when the live path fails; callers degrade to stub, never show errors. */
export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

function isAIHealth(value: unknown): value is AIHealth {
  if (typeof value !== 'object' || value === null) return false;
  const health = value as Record<string, unknown>;
  if (
    typeof health.ok !== 'boolean' ||
    typeof health.dialogue !== 'boolean' ||
    typeof health.portrait !== 'boolean' ||
    typeof health.models !== 'object' ||
    health.models === null
  ) {
    return false;
  }
  const models = health.models as Record<string, unknown>;
  return (
    typeof models.dialogue === 'string' &&
    models.dialogue.length > 0 &&
    typeof models.portrait === 'string' &&
    models.portrait.length > 0
  );
}

/**
 * Boot probe (PRD §2.1): resolves the health payload, or null when the proxy
 * is absent/slow — i.e. builds without an endpoint, local dev, bad networks —
 * in which case boot picks the stub adapter.
 */
export async function probeHealth(timeoutMs = HEALTH_PROBE_TIMEOUT_MS): Promise<AIHealth | null> {
  try {
    const res = await fetch(`${AI_BASE_URL}/ai/health`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const health: unknown = await res.json();
    return isAIHealth(health) && health.ok === true ? health : null;
  } catch {
    return null;
  }
}

/** Live adapter: one dialogue request, no retry. Runtime portraits are disabled;
 * rejecting that track makes the prefetch pipeline select a bundled portrait. */
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
      const beat = await postJson<unknown>('/ai/dialogue', req, DIALOGUE_TIMEOUT_MS);
      if (isDialogueBeat(beat, req.availableClues.map((clue) => clue.id))) return beat;
      throw new AIUnavailableError('/ai/dialogue → schema-invalid');
    },
    async portrait(_req) {
      throw new AIUnavailableError('runtime portrait generation is disabled');
    },
  };
}
