// Live adapter — the client half of the seam (PRD §2.1–2.2).
//
// It posts STRUCTURED FIELDS ONLY to the dev proxy: unit id, equipped card ids,
// the engine-built snapshot (INV-1). No prompt prose, no tone rules and no key
// exist on this side of the membrane; the proxy composes all of that from
// server-side data. The request bodies below are built field by field on
// purpose — whatever a caller hangs off a request object never leaves the tab.
//
// Failure policy (INV-7): one retry on a schema-invalid answer, then `null`.
// A non-200, an abort, a dead network or a non-JSON body resolve `null` at
// once — retrying cannot fix any of them. Nothing ever throws at the caller.

import { isAgentDecision } from './contract.ts';
import type {
  ActionOption,
  AgentDecision,
  DecideRequest,
  EntityView,
  SelfView,
  Stance,
  StanceRequest,
  ValidationCtx,
} from './contract.ts';
import type { AIAdapter } from './adapter.ts';

/** Live decision budget (PRD §2.2): a call has 8_000ms before it is abandoned. */
const LIVE_TIMEOUT_MS = 8_000;

const DECIDE_PATH = '/ai/decide';
const STANCE_PATH = '/ai/stance';

const entityBody = (e: EntityView) => ({
  id: e.id,
  name: e.name,
  hp: e.hp,
  hpMax: e.hpMax,
  alive: e.alive,
});

const selfBody = (s: SelfView) => ({
  ...entityBody(s),
  gaugeTier: s.gaugeTier,
  ...(s.lastHitBy === undefined ? {} : { lastHitBy: s.lastHitBy }),
});

const actionBody = (a: ActionOption) => ({ id: a.id, label: a.label, needsTarget: a.needsTarget });

const decideBody = (req: DecideRequest) => ({
  unitId: req.unitId,
  equippedCardIds: [...req.equippedCardIds],
  snapshot: {
    turn: req.snapshot.turn,
    self: selfBody(req.snapshot.self),
    allies: req.snapshot.allies.map(entityBody),
    enemies: req.snapshot.enemies.map(entityBody),
    availableActions: req.snapshot.availableActions.map(actionBody),
    corrupted: req.snapshot.corrupted,
  },
});

const stanceBody = (req: StanceRequest) => ({
  unitId: req.unitId,
  equippedCardIds: [...req.equippedCardIds],
  agendaId: req.agendaId,
  options: req.options.map((o) => ({ id: o.id, label: o.label })),
  ...(req.hintId === undefined ? {} : { hintId: req.hintId }),
});

export interface LiveAdapterConfig {
  /** Per-call budget. Defaults to the PRD's live timeout. */
  timeoutMs?: number;
}

export function createLiveAdapter(config: LiveAdapterConfig = {}): AIAdapter {
  const timeoutMs = config.timeoutMs ?? LIVE_TIMEOUT_MS;

  async function ask(
    path: string,
    body: unknown,
    ctx: ValidationCtx | undefined,
  ): Promise<AgentDecision | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let payload: unknown;
      try {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) return null;
        payload = await res.json();
      } catch {
        return null;
      }
      if (isAgentDecision(payload, ctx)) return payload;
    }
    return null;
  }

  return {
    mode: 'live',
    async decide(req, ctx) {
      return ask(DECIDE_PATH, decideBody(req), ctx);
    },
    async stance(req, ctx): Promise<Stance | null> {
      const answer = await ask(STANCE_PATH, stanceBody(req), ctx);
      if (answer === null) return null;
      return { action: answer.action, say: answer.say, because: answer.because };
    },
  };
}
