// u8 — the combat execution core (PRD §2.5, §2.2, INV-4/INV-8).
//
// Pure and synchronous: no timer, no adapter, no RNG. The adapter names an
// enumerated action id and a target id and nothing else (INV-4) — `sanitizeIntent`
// is the gate that enforces it, and everything past that gate is engine-owned.
//
// Three readings this file freezes, in the order they apply to one answer:
//   (a) shape + attribution — a malformed answer, or one citing an id the unit does
//       not carry (INV-3), is replaced WHOLESALE by that unit's 직업 기본 행동 with a
//       "…" bubble (INV-7).
//   (b) enum + target — an action outside what the snapshot offered, or a target
//       that does not resolve, keeps the (already attributable) line and swaps the
//       action for the 직업 기본 행동. `coerced: true`.
//   (c) phantom — a target the unit was SHOWN but that does not exist in real state
//       is gauge noise, not a bad answer: the action stands, the swing lands on
//       nothing and renders as 허공을 벤다 (INV-4). `coerced: false`.
//
// Every damage, heal and reduction value is read from `data/tuning.json` (INV-8):
// base actions key on the action id, card actions on the CARD id.

import { isAgentDecision } from '../ai/contract.ts';
import type { ActionOption, DecideRequest, SituationSnapshot } from '../ai/contract.ts';
import type { TieCandidate } from '../core/tiebreak.ts';
import type { Card, DamageValue, Tuning } from '../data/schema.ts';

import { BEHAVIOR_TABLE, enemyIntents, resolveOutcome } from './enemy.ts';
import type {
  CombatDeps,
  CombatEvent,
  CombatState,
  CombatUnit,
  EnemyState,
  HeroState,
  Intent,
  TurnResult,
} from './types.ts';

// ── the action catalog ───────────────────────────────────────────────────────

/** Always available to every unit, every turn (PRD §2.5). */
export const BASE_ACTION_IDS = ['strike', 'defend', 'guard_ally'] as const;

export type BaseActionId = (typeof BASE_ACTION_IDS)[number];

const BASE_ACTION_LABELS: Record<BaseActionId, string> = {
  strike: '공격',
  defend: '방어',
  guard_ally: '동료 보호',
};

/** Card hook kinds that register a combat action; anything else registers none. */
const COMBAT_HOOK_KINDS = ['combat_action', 'consumable_action'] as const;
const CONSUMABLE_HOOK_KIND = 'consumable_action';
const REFLECT_HOOK_KIND = 'passive_reflect';

/** One action as the engine can run it: what it does and which numbers it reads. */
interface ResolvedAction {
  id: string;
  label: string;
  effect: ActionEffect;
  /** The card that registered it — also the `data/tuning.json` key. */
  cardId: string | null;
  consumable: boolean;
  tuningKey: string;
}

interface TurnScope {
  state: CombatState;
  events: CombatEvent[];
  deps: CombatDeps;
}

interface ActionEffect {
  readonly needsTarget: boolean;
  readonly run: (
    scope: TurnScope,
    actor: HeroState,
    action: ResolvedAction,
    targetId: string | null,
  ) => void;
}

function damageSeries(tuning: Tuning, key: string): number[] {
  const value: DamageValue | undefined = tuning.damage[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? [...value] : [value];
}

function damageAmount(tuning: Tuning, key: string): number {
  const [first] = damageSeries(tuning, key);
  return first ?? 0;
}

/** A single blow or a declared multi-hit sequence (「이단 베기」), in order. */
const strikeEffect: ActionEffect = {
  needsTarget: true,
  run: (scope, actor, action, targetId) => {
    const target = livingUnit(scope.state, targetId);
    if (target === undefined) return;
    for (const hit of damageSeries(scope.deps.tuning, action.tuningKey)) {
      if (!target.alive) break;
      applyDamage(scope, actor.id, target, hit, action.id);
    }
  },
};

const defendEffect: ActionEffect = {
  needsTarget: false,
  run: (_scope, actor) => {
    actor.defending = true;
  },
};

const guardAllyEffect: ActionEffect = {
  needsTarget: true,
  run: (scope, actor, _action, targetId) => {
    const ally = livingUnit(scope.state, targetId);
    if (ally === undefined || ally.side !== 'hero' || ally.id === actor.id) return;
    actor.guardingId = ally.id;
  },
};

const tauntEffect: ActionEffect = {
  needsTarget: false,
  run: (_scope, actor) => {
    actor.taunting = true;
  },
};

/** 「화염 두루마리」 — every living enemy burns for the same declared value. */
const burnAllEffect: ActionEffect = {
  needsTarget: false,
  run: (scope, actor, action) => {
    const amount = damageAmount(scope.deps.tuning, action.tuningKey);
    for (const enemy of scope.state.enemies.filter((candidate) => candidate.alive)) {
      applyDamage(scope, actor.id, enemy, amount, action.id);
    }
  },
};

/** 「치유 물약 ×3」 — restores up to hpMax and reports what actually landed. */
const healEffect: ActionEffect = {
  needsTarget: true,
  run: (scope, actor, action, targetId) => {
    const target = livingUnit(scope.state, targetId);
    if (target === undefined) return;
    const amount = Math.max(
      0,
      Math.min(damageAmount(scope.deps.tuning, action.tuningKey), target.hpMax - target.hp),
    );
    target.hp += amount;
    scope.events.push({
      type: 'heal',
      sourceId: actor.id,
      targetId: target.id,
      amount,
      actionId: action.id,
    });
  },
};

/** A card action whose effect this engine does not implement: offered, inert. */
const inertEffect: ActionEffect = { needsTarget: false, run: () => {} };

const ACTION_EFFECTS: Record<string, ActionEffect> = {
  strike: strikeEffect,
  defend: defendEffect,
  guard_ally: guardAllyEffect,
  dual_slash: strikeEffect,
  taunt: tauntEffect,
  flame_scroll: burnAllEffect,
  heal_potion: healEffect,
};

function cardById(deps: CombatDeps, cardId: string): Card | undefined {
  return deps.cards.find((card) => card.id === cardId);
}

/**
 * Everything this unit may do right now: the base three, plus one action per
 * equipped Skill/MCP card that declares a combat hook. A consumable drops off the
 * list the moment its last charge is gone (PRD §2.3).
 */
export function combatActionsFor(unit: HeroState, deps: CombatDeps): ResolvedAction[] {
  const actions: ResolvedAction[] = BASE_ACTION_IDS.map((id) => ({
    id,
    label: BASE_ACTION_LABELS[id],
    effect: ACTION_EFFECTS[id],
    cardId: null,
    consumable: false,
    tuningKey: id,
  }));

  for (const cardId of unit.equippedCardIds) {
    const card = cardById(deps, cardId);
    const hook = card?.engineHook;
    if (card === undefined || hook === null || hook === undefined) continue;
    if (!COMBAT_HOOK_KINDS.some((kind) => kind === hook.kind)) continue;
    if (hook.actionId === undefined) continue;

    const consumable = hook.kind === CONSUMABLE_HOOK_KIND;
    if (consumable && (unit.charges[card.id] ?? 0) <= 0) continue;

    actions.push({
      id: hook.actionId,
      label: card.name,
      effect: ACTION_EFFECTS[hook.actionId] ?? inertEffect,
      cardId: card.id,
      consumable,
      tuningKey: card.id,
    });
  }

  return actions;
}

/** The offered form of the catalog — ids, labels and targeting, nothing else. */
export function toActionOptions(actions: readonly ResolvedAction[]): ActionOption[] {
  return actions.map((action) => ({
    id: action.id,
    label: action.label,
    needsTarget: action.effect.needsTarget,
  }));
}

// ── targets ──────────────────────────────────────────────────────────────────

/**
 * The symbolic targets an answer may name instead of a raw id. `phantom_enemy`
 * resolves to nothing on purpose: it is the gauge-noise target (PRD §2.5).
 */
export const TARGET_SELECTORS = Object.freeze({
  self: 'self',
  last_hit_by: 'last_hit_by',
  first_enemy: 'first_enemy',
  lowest_hp_enemy: 'lowest_hp_enemy',
  highest_hp_enemy: 'highest_hp_enemy',
  lowest_hp_ally: 'lowest_hp_ally',
  first_ally: 'first_ally',
  phantom_enemy: 'phantom_enemy',
} as const);

export type TargetSelector = keyof typeof TARGET_SELECTORS;

/** `ok: true, id: null` is a resolved swing at nothing; `ok: false` is unusable. */
export type TargetResolution = { ok: true; id: string | null } | { ok: false };

const RESOLVED_NOTHING: TargetResolution = { ok: true, id: null };
const UNRESOLVABLE: TargetResolution = { ok: false };

function found(unit: CombatUnit | undefined): TargetResolution {
  return unit === undefined ? UNRESOLVABLE : { ok: true, id: unit.id };
}

function livingUnits(state: CombatState): CombatUnit[] {
  return [
    ...state.heroes.filter((hero) => hero.alive),
    ...state.enemies.filter((enemy) => enemy.alive),
  ];
}

function livingUnit(state: CombatState, id: string | null): CombatUnit | undefined {
  if (id === null) return undefined;
  return livingUnits(state).find((unit) => unit.id === id);
}

function lowestHp(units: readonly CombatUnit[]): CombatUnit | undefined {
  return units.reduce<CombatUnit | undefined>(
    (best, unit) => (best === undefined || unit.hp < best.hp ? unit : best),
    undefined,
  );
}

function highestHp(units: readonly CombatUnit[]): CombatUnit | undefined {
  return units.reduce<CombatUnit | undefined>(
    (best, unit) => (best === undefined || unit.hp > best.hp ? unit : best),
    undefined,
  );
}

/**
 * Selector resolvers. Ties inside a selector keep the owning array's order, which
 * is the same winner the `index` policy would pick (PRD §2.2); a genuine numeric
 * tie between UNITS — execution order, enemy targeting — goes through the seam.
 */
const SELECTOR_RESOLVERS: Record<
  TargetSelector,
  (state: CombatState, actor: HeroState) => TargetResolution
> = {
  self: (_state, actor) => ({ ok: true, id: actor.id }),
  last_hit_by: (state, actor) =>
    found(livingUnits(state).find((unit) => unit.id === actor.lastHitBy)),
  first_enemy: (state) => found(state.enemies.find((enemy) => enemy.alive)),
  lowest_hp_enemy: (state) => found(lowestHp(state.enemies.filter((enemy) => enemy.alive))),
  highest_hp_enemy: (state) => found(highestHp(state.enemies.filter((enemy) => enemy.alive))),
  lowest_hp_ally: (state, actor) =>
    found(lowestHp(state.heroes.filter((hero) => hero.alive && hero.id !== actor.id))),
  first_ally: (state, actor) =>
    found(state.heroes.find((hero) => hero.alive && hero.id !== actor.id)),
  phantom_enemy: () => RESOLVED_NOTHING,
};

function isSelector(raw: string): raw is TargetSelector {
  return Object.prototype.hasOwnProperty.call(TARGET_SELECTORS, raw);
}

/** Resolves a symbolic selector or a raw id against REAL state — never a snapshot. */
export function resolveTarget(
  state: CombatState,
  actor: HeroState,
  raw: string,
): TargetResolution {
  if (isSelector(raw)) return SELECTOR_RESOLVERS[raw](state, actor);
  return found(livingUnit(state, raw));
}

// ── the intent split (INV-4) ─────────────────────────────────────────────────

function shownInSnapshot(snapshot: SituationSnapshot, id: string): boolean {
  if (snapshot.self.id === id) return true;
  return (
    snapshot.allies.some((ally) => ally.id === id) ||
    snapshot.enemies.some((enemy) => enemy.id === id)
  );
}

function existsInState(state: CombatState, id: string): boolean {
  return state.heroes.some((hero) => hero.id === id) || state.enemies.some((foe) => foe.id === id);
}

function requireHero(state: CombatState, unitId: string): HeroState {
  const hero = state.heroes.find((candidate) => candidate.id === unitId);
  if (hero === undefined) throw new Error(`unit '${unitId}' is not in this combat`);
  return hero;
}

/**
 * Turns whatever the adapter said into an Intent the engine can run. Takes the
 * whole request, because "what this unit was offered" and "what this unit was
 * shown" both live in the snapshot it was handed — that provenance is the only
 * thing separating gauge noise from a bad answer.
 */
export function sanitizeIntent(
  raw: unknown,
  request: DecideRequest,
  state: CombatState,
  deps: CombatDeps,
): Intent {
  const unitId = request.unitId;
  const actor = requireHero(state, unitId);

  // (a) shape + attribution — anything that fails is replaced wholesale.
  if (!isAgentDecision(raw, { sheetIds: deps.sheetIdsOf(unitId) })) {
    const fallback = deps.fallbackFor(unitId);
    return {
      unitId,
      actionId: fallback.action,
      targetId: null,
      say: fallback.say,
      because: [...fallback.because],
      coerced: true,
    };
  }

  const say = raw.say;
  const because = [...raw.because];
  const coerced: Intent = {
    unitId,
    actionId: actor.classDefaultAction,
    targetId: null,
    say,
    because,
    coerced: true,
  };

  // (b) enum — the action must be one the engine offered this unit this turn.
  const offered = request.snapshot.availableActions.find((option) => option.id === raw.action);
  if (offered === undefined) return coerced;

  const kept = (targetId: string | null): Intent => ({
    unitId,
    actionId: offered.id,
    targetId,
    say,
    because,
    coerced: false,
  });

  if (!offered.needsTarget) return kept(null);
  if (raw.target === undefined) return coerced;

  const resolution = resolveTarget(state, actor, raw.target);
  if (resolution.ok) return kept(resolution.id);

  // (c) phantom — shown to this unit, absent from real state: gauge noise, not a
  // bad answer. A corpse it could see, or an id it was never shown, is coerced.
  if (shownInSnapshot(request.snapshot, raw.target) && !existsInState(state, raw.target)) {
    return kept(null);
  }
  return coerced;
}

// ── execution order ──────────────────────────────────────────────────────────

interface OrderEntry {
  intent: Intent;
  agi: number;
  index: number;
}

/**
 * 민첩 descending, ties through the injected seam — never through sort stability
 * (PRD §2.5). Enemies always act after every hero, in roster order. Dead actors
 * are dropped, and the caller's array is left exactly as it was handed over.
 */
export function orderIntents(
  state: CombatState,
  intents: readonly Intent[],
  deps: CombatDeps,
): Intent[] {
  const heroes: OrderEntry[] = [];
  const enemies: OrderEntry[] = [];

  for (const intent of intents) {
    const hero = state.heroes.find((candidate) => candidate.id === intent.unitId);
    if (hero !== undefined) {
      if (hero.alive) heroes.push({ intent, agi: hero.agi, index: hero.dataIndex });
      continue;
    }
    const enemy = state.enemies.find((candidate) => candidate.id === intent.unitId);
    if (enemy !== undefined && enemy.alive) {
      enemies.push({ intent, agi: 0, index: enemy.dataIndex });
    }
  }

  const ordered: Intent[] = [];
  let pool = heroes;
  while (pool.length > 0) {
    const fastest = Math.max(...pool.map((entry) => entry.agi));
    const tied: TieCandidate<OrderEntry>[] = pool
      .filter((entry) => entry.agi === fastest)
      .sort((a, b) => a.index - b.index)
      .map((entry) => ({ value: entry, index: entry.index }));

    const winner = deps.tieBreak(tied);
    ordered.push(winner.intent);
    pool = pool.filter((entry) => entry !== winner);
  }

  return [
    ...ordered,
    ...[...enemies].sort((a, b) => a.index - b.index).map((entry) => entry.intent),
  ];
}

// ── damage, heals and the turn itself ────────────────────────────────────────

function cloneState(state: CombatState): CombatState {
  return {
    ...state,
    heroes: state.heroes.map((hero) => ({
      ...hero,
      equippedCardIds: [...hero.equippedCardIds],
      charges: { ...hero.charges },
    })),
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
  };
}

/** Lands a blow on real state and reports what actually got through. */
function applyDamage(
  scope: TurnScope,
  sourceId: string,
  target: CombatUnit,
  raw: number,
  actionId: string,
): number {
  const guarded =
    target.side === 'hero' && target.defending
      ? raw - damageAmount(scope.deps.tuning, 'defend')
      : raw;
  const amount = Math.max(0, guarded);

  scope.events.push({ type: 'damage', sourceId, targetId: target.id, amount, actionId });
  if (target.side === 'hero') target.lastHitBy = sourceId;

  target.hp = Math.max(0, target.hp - amount);
  if (target.hp === 0 && target.alive) {
    target.alive = false;
    scope.events.push({ type: 'unit_down', unitId: target.id, side: target.side });
  }
  return amount;
}

function reflectCardFor(unit: HeroState, deps: CombatDeps): Card | undefined {
  for (const cardId of unit.equippedCardIds) {
    const card = cardById(deps, cardId);
    if (card?.engineHook?.kind === REFLECT_HOOK_KIND) return card;
  }
  return undefined;
}

/** 「거울 방패」 — a share of what a defending carrier took goes straight back. */
function reflectBack(scope: TurnScope, victim: HeroState, attacker: EnemyState, taken: number): void {
  if (!victim.defending || taken <= 0 || !attacker.alive) return;
  const card = reflectCardFor(victim, scope.deps);
  if (card === undefined) return;

  const share = damageAmount(scope.deps.tuning, card.id);
  const amount = Math.ceil((taken * share) / 100);
  if (amount <= 0) return;
  applyDamage(scope, victim.id, attacker, amount, card.id);
}

/** Whoever stepped in front of this hero this turn, if anyone did. */
function guardOf(state: CombatState, hero: HeroState): HeroState | undefined {
  return state.heroes.find(
    (candidate) => candidate.alive && candidate.id !== hero.id && candidate.guardingId === hero.id,
  );
}

/** 도배 — this monster buries the party's context as well as its HP (PRD §2.5). */
function isSpam(enemy: EnemyState, deps: CombatDeps): boolean {
  const monster = deps.encounters.monsters.find((candidate) => candidate.id === enemy.monsterId);
  return monster?.gaugeOnHitExtraRef !== undefined;
}

function applyEnemyAttack(scope: TurnScope, enemy: EnemyState, targetId: string | null): void {
  const chosen = livingUnit(scope.state, targetId);
  if (chosen === undefined || chosen.side !== 'hero') return;

  if (BEHAVIOR_TABLE[enemy.behavior.rule].attack === 'gauge') {
    scope.events.push({ type: 'gauge_attack', heroId: chosen.id, monsterId: enemy.monsterId });
    return;
  }

  const victim = guardOf(scope.state, chosen) ?? chosen;
  const taken = applyDamage(scope, enemy.id, victim, enemy.damage, 'attack');
  scope.events.push({
    type: 'hero_hit',
    heroId: victim.id,
    monsterId: enemy.monsterId,
    spam: isSpam(enemy, scope.deps),
  });
  reflectBack(scope, victim, enemy, taken);
}

function spendCharge(scope: TurnScope, actor: HeroState, cardId: string): void {
  const remaining = Math.max(0, (actor.charges[cardId] ?? 0) - 1);
  actor.charges[cardId] = remaining;
  scope.events.push({ type: 'consumable_spent', unitId: actor.id, cardId, remaining });
}

function applyIntent(scope: TurnScope, intent: Intent): void {
  const enemy = scope.state.enemies.find((candidate) => candidate.id === intent.unitId);
  if (enemy !== undefined) {
    if (enemy.alive) applyEnemyAttack(scope, enemy, intent.targetId);
    return;
  }

  const actor = scope.state.heroes.find((candidate) => candidate.id === intent.unitId);
  if (actor === undefined || !actor.alive) return;

  // An action the unit cannot run right now — an engine-only 직업 기본 행동 stance,
  // or a card whose charges are gone — simply produces nothing.
  const action = combatActionsFor(actor, scope.deps).find(
    (candidate) => candidate.id === intent.actionId,
  );
  if (action === undefined) return;

  if (action.effect.needsTarget && intent.targetId === null) {
    scope.events.push({ type: 'phantom_swing', unitId: actor.id, actionId: action.id });
    return;
  }

  action.effect.run(scope, actor, action, intent.targetId);
  if (action.consumable && action.cardId !== null) spendCharge(scope, actor, action.cardId);
}

/** 한 턴간 stances expire together, at the end of the turn that opened them. */
function clearStances(state: CombatState): void {
  for (const hero of state.heroes) {
    hero.defending = false;
    hero.guardingId = undefined;
    hero.taunting = undefined;
  }
}

/**
 * Plays one whole turn on real state: heroes in execution order, then the enemy
 * phase on what is left standing. Pure — the state handed in is never touched.
 */
export function executeTurn(
  state: CombatState,
  heroIntents: readonly Intent[],
  deps: CombatDeps,
): TurnResult {
  if (state.outcome !== 'ongoing') return { state, events: [] };

  const scope: TurnScope = { state: cloneState(state), events: [], deps };
  scope.events.push({ type: 'turn_start', turn: state.turn });

  for (const intent of orderIntents(scope.state, heroIntents, deps)) {
    if (scope.state.heroes.some((hero) => hero.id === intent.unitId)) {
      scope.events.push({
        type: 'decision',
        unitId: intent.unitId,
        actionId: intent.actionId,
        targetId: intent.targetId,
        say: intent.say,
        because: [...intent.because],
        coerced: intent.coerced,
      });
    }
    applyIntent(scope, intent);
  }

  for (const intent of enemyIntents(scope.state, deps)) applyIntent(scope, intent);

  clearStances(scope.state);

  const outcome = resolveOutcome(scope.state);
  scope.state.outcome = outcome;
  if (outcome === 'victory') {
    scope.events.push({
      type: 'victory',
      tileId: scope.state.tileId,
      rosterId: scope.state.rosterId,
    });
  } else if (outcome === 'defeat') {
    scope.events.push({ type: 'defeat', tileId: scope.state.tileId });
  }
  scope.state.turn = state.turn + 1;

  return { state: scope.state, events: scope.events };
}
