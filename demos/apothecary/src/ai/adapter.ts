// AIAdapter is the seam every AI feature flows through (PRD §2.1). Boot probes
// once, live dialogue makes one request without retrying, and callers silently
// fall back to authored beats when that request is unavailable. All timing
// flows through this interface rather than game-logic timers (§3-3).

import {
  REASONING_EFFORTS,
  isDialogueBeat,
  type AIHealth,
  type DialogueBeat,
  type DialogueRequest,
  type InferenceCapabilities,
  type PortraitRequest,
  type PortraitSheet,
  type ReasoningEffort,
} from './contract.ts';
import type { InferenceController } from './inference.ts';

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
const configuredDialogueTimeout = Number(
  import.meta.env?.VITE_DIALOGUE_TIMEOUT_MS,
);
export const DIALOGUE_TIMEOUT_MS =
  Number.isSafeInteger(configuredDialogueTimeout) &&
  configuredDialogueTimeout >= 23_500 &&
  configuredDialogueTimeout <= 300_000
    ? configuredDialogueTimeout
    : 23_500;

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
  const coreIsValid =
    typeof models.dialogue === 'string' &&
    models.dialogue.length > 0 &&
    typeof models.portrait === 'string' &&
    models.portrait.length > 0;
  if (!coreIsValid) return false;
  return health.inference === undefined || isInferenceCapabilities(health.inference);
}

function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return (
    typeof value === 'string' &&
    (REASONING_EFFORTS as readonly string[]).includes(value)
  );
}

function isInferenceCapabilities(value: unknown): value is InferenceCapabilities {
  if (typeof value !== 'object' || value === null) return false;
  const capabilities = value as Record<string, unknown>;
  if (
    typeof capabilities.default !== 'object' ||
    capabilities.default === null ||
    !Array.isArray(capabilities.models) ||
    capabilities.models.length < 1
  ) {
    return false;
  }
  const defaultSelection = capabilities.default as Record<string, unknown>;
  if (
    typeof defaultSelection.modelId !== 'string' ||
    !isReasoningEffort(defaultSelection.reasoningEffort)
  ) {
    return false;
  }
  const validModels = capabilities.models.every((entry) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const model = entry as Record<string, unknown>;
    return (
      typeof model.id === 'string' &&
      model.id.length > 0 &&
      typeof model.label === 'string' &&
      model.label.length > 0 &&
      Array.isArray(model.reasoningEfforts) &&
      model.reasoningEfforts.length > 0 &&
      model.reasoningEfforts.every(isReasoningEffort)
    );
  });
  if (!validModels) return false;
  const defaultModel = capabilities.models.find(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      (entry as Record<string, unknown>).id === defaultSelection.modelId,
  ) as Record<string, unknown> | undefined;
  return (
    defaultModel !== undefined &&
    (defaultModel.reasoningEfforts as unknown[]).includes(
      defaultSelection.reasoningEffort,
    )
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
export function createLiveAdapter(runtime?: InferenceController): AIAdapter {
  async function postJson<T>(
    path: string,
    body: unknown,
    timeoutMs: number,
  ): Promise<{ value: T; response: Response }> {
    const res = await fetch(`${AI_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new AIUnavailableError(`${path} → ${res.status}`);
    return { value: (await res.json()) as T, response: res };
  }

  return {
    mode: 'live',
    async dialogue(req) {
      const run = runtime?.begin() ?? null;
      const body =
        run === null ? req : { ...req, inference: run.selection };
      try {
        const { value: beat, response } = await postJson<unknown>(
          '/ai/dialogue',
          body,
          DIALOGUE_TIMEOUT_MS,
        );
        if (!isDialogueBeat(beat, req.availableClues.map((clue) => clue.id))) {
          throw new AIUnavailableError('/ai/dialogue → schema-invalid');
        }
        if (run !== null) {
          const nonNegativeHeader = (name: string): number | undefined => {
            const raw = response.headers.get(name);
            if (raw === null || raw.trim() === '') return undefined;
            const value = Number(raw);
            return Number.isFinite(value) && value >= 0 ? value : undefined;
          };
          runtime?.finish(run.id, {
            fallback: response.headers.get('x-llm-fallback') === 'true',
            latencyMs: nonNegativeHeader('x-llm-latency-ms'),
            inputTokens: nonNegativeHeader('x-llm-input-tokens'),
            outputTokens: nonNegativeHeader('x-llm-output-tokens'),
          });
        }
        return beat;
      } catch (error) {
        if (run !== null) runtime?.fail(run.id);
        throw error;
      }
    },
    async portrait(_req) {
      throw new AIUnavailableError('runtime portrait generation is disabled');
    },
  };
}
