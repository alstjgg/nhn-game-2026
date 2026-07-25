// AI contract — the ONE schema stub mode, live mode and the dev-proxy share
// (PRD §2.1–2.2, invariants §4-3 / §4-5). Every renderer-facing AI type lives
// here and only here; `server/ai-proxy.mjs` imports `isAgentDecision` from this
// very file so a live answer and a canned stub answer pass the same gate.
//
// Nothing in this file knows how a prompt is written: prose composition lives
// server-side (INV-1). The client only ever moves ids, numbers and short labels.

/** Gauge tier index: 0 평온 · 1 긴장 · 2 격앙 · 3 한계 (PRD §2.2, §2.5). */
export type GaugeTier = 0 | 1 | 2 | 3;

/** Adapter mode. Boot probes `/ai/health` and picks one (PRD §2.2). */
export type Mode = 'live' | 'stub';

/** One combatant as the deciding unit sees it. Ids + numbers, never prose. */
export interface EntityView {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  alive: boolean;
}

/** The acting unit's own view: an EntityView plus what only it knows. */
export interface SelfView extends EntityView {
  gaugeTier: GaugeTier;
  /** Id of whoever hit it last — a target hint the engine already resolved. */
  lastHitBy?: string;
}

/** An action the engine offers this turn. `id` is what the model may pick. */
export interface ActionOption {
  id: string;
  label: string;
  needsTarget: boolean;
}

/**
 * Engine-built situation snapshot (INV-1: structured fields only). `corrupted`
 * marks a gauge-noise turn — noise distorts JUDGMENT INPUT only; execution
 * always runs on real state (INV-4).
 */
export interface SituationSnapshot {
  turn: number;
  self: SelfView;
  allies: EntityView[];
  enemies: EntityView[];
  availableActions: ActionOption[];
  corrupted: boolean;
}

/** POST /ai/decide — combat turn. Ids in, decision out. */
export interface DecideRequest {
  unitId: string;
  equippedCardIds: string[];
  snapshot: SituationSnapshot;
}

/** One council agenda option the unit may back. */
export interface StanceOption {
  id: string;
  label: string;
}

/** POST /ai/stance — council vote. */
export interface StanceRequest {
  unitId: string;
  equippedCardIds: string[];
  agendaId: string;
  options: StanceOption[];
  /** Id of a clue the party already holds (e.g. 「번역 렌즈」 output). */
  hintId?: string;
}

/** A council stance: an enumerated option id, a line, and its attribution. */
export interface Stance {
  action: string;
  say: string;
  /** ≥1 sheet-item id — INV-3: every displayed decision is attributable. */
  because: string[];
}

/** A combat decision: a stance plus the target the engine will resolve. */
export interface AgentDecision extends Stance {
  target?: string;
}

/** One line of the unit's assembled sheet, as the detail panel renders it. */
export interface SheetRef {
  id: string;
  kind: 'prompt' | 'skill' | 'mcp';
  text: string;
}

/**
 * What ids an answer is allowed to cite. Omit it entirely to check shape only
 * (fixture/authoring mode); supply `sheetIds` to enforce INV-3 resolvability.
 */
export interface ValidationCtx {
  sheetIds: readonly string[];
  actionIds?: readonly string[];
}

/** GET /ai/health response (dev proxy only; absent in the deployed build). */
export interface AIHealth {
  ok: boolean;
  decide: boolean;
  stance: boolean;
  models: { decide: string; stance: string };
}

/**
 * The shared schema gate (INV-3 + INV-5). Stub data, live answers and the
 * proxy's own tool output all pass through this one function.
 */
export function isAgentDecision(v: unknown, ctx?: ValidationCtx): v is AgentDecision {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const d = v as Record<string, unknown>;

  if (typeof d.action !== 'string' || d.action.length === 0) return false;
  if (typeof d.say !== 'string' || d.say.length === 0) return false;
  if (d.target !== undefined && typeof d.target !== 'string') return false;
  if (!Array.isArray(d.because) || d.because.length === 0) return false;
  if (!d.because.every((id) => typeof id === 'string' && id.length > 0)) return false;

  if (ctx === undefined) return true;
  if (!d.because.every((id) => ctx.sheetIds.includes(id as string))) return false;
  if (ctx.actionIds !== undefined && !ctx.actionIds.includes(d.action)) return false;
  return true;
}

export type { AIAdapter } from './adapter.ts';
export { probeHealth } from './adapter.ts';
