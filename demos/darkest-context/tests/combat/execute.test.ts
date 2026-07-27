// u8 — TDD-Red for the combat execution core (PRD §2.5, §2.2, INV-4/INV-6).
//
// This file owns four AC gates, each selected by a vitest `-t` word:
//   `intent split` — INV-4: the adapter names an enumerated action id and nothing else;
//                    every number and state change is engine-side; an out-of-enum or
//                    unknown-target intent is coerced to the unit's 직업 기본 행동.
//   `order`        — 민첩 descending, ties through the INJECTED tieBreak seam only.
//   `damage`       — fixed values out of data/tuning.json; no RNG anywhere in outcomes.
//   `actions`      — base strike|defend|guard_ally always offered; cards register more.
//   `consumable`   — charges live in the engine and decrement there.
//
// Nothing here awaits: `executeTurn` / `sanitizeIntent` / `orderIntents` are pure and
// synchronous, so ordering and damage are asserted with no timers and no adapter. The
// deps carry an adapter that THROWS on use — execution must never reach for it.
//
// Every number is read from `data/tuning.json` / `data/encounters.json`; no literal
// damage value appears below (INV-8 balance-as-data).
//
// RED on arrival: src/combat/{types,snapshot,execute,enemy}.ts do not exist yet.
import { describe, expect, it } from 'vitest';

import type { AgentDecision, AIAdapter, DecideRequest, GaugeTier } from '../../src/ai/contract.ts';
import { ELLIPSIS_SAY, createFallbackDecider } from '../../src/ai/stub.ts';
import { createTieBreaker } from '../../src/core/tiebreak.ts';
import type { TieCandidate } from '../../src/core/tiebreak.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';
import type { Hero, Monster } from '../../src/data/schema.ts';

import {
  BASE_ACTION_IDS,
  TARGET_SELECTORS,
  executeTurn,
  orderIntents,
  resolveTarget,
  sanitizeIntent,
} from '../../src/combat/execute.ts';
import { buildSnapshot, offeredActions } from '../../src/combat/snapshot.ts';
import { STATIC_GAUGE } from '../../src/combat/types.ts';
import type {
  CombatDeps,
  CombatEvent,
  CombatState,
  EnemyState,
  GaugePort,
  HeroState,
  Intent,
} from '../../src/combat/types.ts';

const { heroes, cards, encounters, tuning } = loadBundledGameData();

// ── data readers: no combat number is ever typed as a literal here ───────────
const heroById = (id: string): Hero => {
  const found = heroes.find((h) => h.id === id);
  if (!found) throw new Error(`hero missing from data/heroes.json: ${id}`);
  return found;
};
const heroIndex = (id: string): number => heroes.findIndex((h) => h.id === id);
const monsterById = (id: string): Monster => {
  const found = encounters.monsters.find((m) => m.id === id);
  if (!found) throw new Error(`monster missing from data/encounters.json: ${id}`);
  return found;
};
const flat = (key: string): number => {
  const value = tuning.damage[key];
  if (typeof value !== 'number') throw new Error(`tuning.damage.${key} is not a flat number`);
  return value;
};
const multi = (key: string): number[] => {
  const value = tuning.damage[key];
  if (!Array.isArray(value)) throw new Error(`tuning.damage.${key} is not a multi-hit list`);
  return value;
};

const GOLEM = monsterById('spam_golem');
const SPIRIT = monsterById('hallucination_spirit');

// ── state fixtures: plain data, built here so execution stays testable alone ──
const hero = (id: string, over: Partial<HeroState> = {}): HeroState => {
  const data = heroById(id);
  return {
    id,
    dataIndex: heroIndex(id),
    name: data.name,
    hp: data.hp,
    hpMax: data.hp,
    alive: true,
    side: 'hero',
    agi: data.stats.agi,
    equippedCardIds: [],
    classDefaultAction: data.classDefaultAction,
    charges: {},
    defending: false,
    ...over,
  };
};

const foe = (
  instanceId: string,
  monsterId: string,
  dataIndex: number,
  over: Partial<EnemyState> = {},
): EnemyState => {
  const data = monsterById(monsterId);
  return {
    id: instanceId,
    dataIndex,
    name: data.name,
    hp: data.hp,
    hpMax: data.hp,
    alive: true,
    side: 'enemy',
    monsterId,
    damage: data.damage,
    behavior: data.behavior,
    ...over,
  };
};

const combat = (
  party: HeroState[],
  foes: EnemyState[],
  over: Partial<CombatState> = {},
): CombatState => ({
  tileId: 't1',
  rosterId: 'roster_t1',
  turn: 1,
  heroes: party,
  enemies: foes,
  outcome: 'ongoing',
  ...over,
});

/** Execution must never touch the adapter — reaching for it is the failure. */
const forbiddenAdapter: AIAdapter = {
  mode: 'stub',
  decide() {
    throw new Error('execution called the adapter: INV-4 / PRD §2.2 forbid it');
  },
  stance() {
    throw new Error('execution called the adapter: INV-4 / PRD §2.2 forbid it');
  },
};

const sheetIdsOf = (unitId: string): string[] => {
  const data = heroById(unitId);
  return [data.defaultPrompt.id, data.baseSkill.id, ...cards.map((c) => c.id)];
};

const indexTieBreak = createTieBreaker({ policy: tuning.tieBreak.test });

const deps = (over: Partial<CombatDeps> = {}): CombatDeps => ({
  tuning,
  heroes,
  cards,
  encounters,
  adapter: forbiddenAdapter,
  fallbackFor: createFallbackDecider(heroes),
  tieBreak: indexTieBreak,
  sheetIdsOf,
  ...over,
});

/** A tie seam that deliberately picks the HIGHEST data index — proves the seam is used. */
const maxIndexTieBreak = <T>(candidates: readonly TieCandidate<T>[]): T =>
  candidates.reduce((best, cur) => (cur.index > best.index ? cur : best)).value;

/** Wraps the `index` policy and records the candidate index sets it was handed. */
const recordingTieBreak = (): {
  fn: <T>(candidates: readonly TieCandidate<T>[]) => T;
  seen: number[][];
} => {
  const seen: number[][] = [];
  return {
    seen,
    fn: <T>(candidates: readonly TieCandidate<T>[]): T => {
      seen.push(candidates.map((c) => c.index));
      return indexTieBreak(candidates);
    },
  };
};

const gaugeWith = (values: Record<string, number>): GaugePort => ({
  tierOf: () => 0 as GaugeTier,
  valueOf: (id: string) => values[id] ?? 0,
  judgmentSuppressed: () => false,
});

// ── intent / decision fixtures ───────────────────────────────────────────────
const SAY = '내가 앞에 선다.';

const decision = (action: string, target?: string, because?: string[]): AgentDecision => {
  const base: AgentDecision = { action, say: SAY, because: because ?? ['garrett.default'] };
  return target === undefined ? base : { ...base, target };
};

const requestFor = (state: CombatState, unitId: string, d: CombatDeps): DecideRequest => {
  const unit = state.heroes.find((h) => h.id === unitId);
  if (!unit) throw new Error(`unit not in combat state: ${unitId}`);
  return {
    unitId,
    equippedCardIds: [...unit.equippedCardIds],
    snapshot: buildSnapshot(state, unitId, d),
  };
};

/** The gauge-noise case: the unit was SHOWN an enemy that does not exist (PRD §2.5). */
const withPhantom = (req: DecideRequest, phantomId: string): DecideRequest => ({
  ...req,
  snapshot: {
    ...req.snapshot,
    corrupted: true,
    enemies: [
      ...req.snapshot.enemies,
      { id: phantomId, name: phantomId, hp: 1, hpMax: 1, alive: true },
    ],
  },
});

const intent = (
  unitId: string,
  actionId: string,
  targetId: string | null = null,
  over: Partial<Intent> = {},
): Intent => ({
  unitId,
  actionId,
  targetId,
  say: SAY,
  because: [heroById(unitId).defaultPrompt.id],
  coerced: false,
  ...over,
});

// ── event readers ────────────────────────────────────────────────────────────
const pick = <T extends CombatEvent['type']>(
  events: readonly CombatEvent[],
  type: T,
): Extract<CombatEvent, { type: T }>[] =>
  events.filter((e) => e.type === type) as Extract<CombatEvent, { type: T }>[];

const heroIn = (state: CombatState, id: string): HeroState => {
  const found = state.heroes.find((h) => h.id === id);
  if (!found) throw new Error(`hero absent from result state: ${id}`);
  return found;
};
const foeIn = (state: CombatState, id: string): EnemyState => {
  const found = state.enemies.find((e) => e.id === id);
  if (!found) throw new Error(`enemy absent from result state: ${id}`);
  return found;
};

// ═══════════════ INV-4 — the intent split (adapter names an id, engine owns the rest)
describe('intent split — the adapter names an enumerated action id and nothing else', () => {
  const state = (): CombatState =>
    combat([hero('garrett'), hero('fiona')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);

  it('keeps a well-formed in-enum decision untouched and resolves its target', () => {
    const s = state();
    const d = deps();
    const result = sanitizeIntent(
      decision('strike', 't1_spam_golem_1'),
      requestFor(s, 'garrett', d),
      s,
      d,
    );

    expect(result.actionId).toBe('strike');
    expect(result.targetId).toBe('t1_spam_golem_1');
    expect(result.say).toBe(SAY);
    expect(result.because).toEqual(['garrett.default']);
    expect(result.coerced).toBe(false);
  });

  it('produces an Intent carrying no numbers at all — the shape is exactly the contract', () => {
    const s = state();
    const d = deps();
    const result = sanitizeIntent(
      decision('strike', 't1_spam_golem_1'),
      requestFor(s, 'garrett', d),
      s,
      d,
    );

    expect(Object.keys(result).sort()).toEqual(
      ['actionId', 'because', 'coerced', 'say', 'targetId', 'unitId'].sort(),
    );
  });

  it('ignores numeric fields the adapter invented — damage stays the tuning value', () => {
    const s = state();
    const d = deps();
    const greedy = { ...decision('strike', 't1_spam_golem_1'), damage: 999, hp: 0 };
    const result = sanitizeIntent(greedy, requestFor(s, 'garrett', d), s, d);

    expect(result).not.toHaveProperty('damage');
    expect(result).not.toHaveProperty('hp');

    const turn = executeTurn(s, [result], d);
    const hits = pick(turn.events, 'damage').filter((e) => e.sourceId === 'garrett');
    expect(hits).toHaveLength(1);
    expect(hits[0].amount).toBe(flat('strike'));
  });

  it('coerces an out-of-enum action id to the 직업 기본 행동 and keeps the line attributable', () => {
    const s = state();
    const d = deps();
    const result = sanitizeIntent(
      decision('nuke_everything', 't1_spam_golem_1'),
      requestFor(s, 'garrett', d),
      s,
      d,
    );

    expect(result.actionId).toBe(heroById('garrett').classDefaultAction);
    expect(result.targetId).toBeNull();
    expect(result.coerced).toBe(true);
    expect(result.say).toBe(SAY);
    expect(result.because).toEqual(['garrett.default']);
  });

  it('coerces a card action the unit does not carry — offered comes from the snapshot', () => {
    const s = state();
    const d = deps();
    const result = sanitizeIntent(
      decision('dual_slash', 't1_spam_golem_1'),
      requestFor(s, 'garrett', d),
      s,
      d,
    );

    expect(result.actionId).toBe(heroById('garrett').classDefaultAction);
    expect(result.coerced).toBe(true);
  });

  it('coerces an unknown target id that the unit was never shown', () => {
    const s = state();
    const d = deps();
    const result = sanitizeIntent(decision('strike', 'ghost_9'), requestFor(s, 'garrett', d), s, d);

    expect(result.actionId).toBe(heroById('garrett').classDefaultAction);
    expect(result.targetId).toBeNull();
    expect(result.coerced).toBe(true);
  });

  it('coerces a target that is already down — a corpse is not a live entity', () => {
    const s = combat(
      [hero('garrett'), hero('fiona', { hp: 0, alive: false })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const d = deps();
    const result = sanitizeIntent(decision('guard_ally', 'fiona'), requestFor(s, 'garrett', d), s, d);

    expect(result.actionId).toBe(heroById('garrett').classDefaultAction);
    expect(result.coerced).toBe(true);
  });

  it('coerces a target-taking action that named no target at all', () => {
    const s = state();
    const d = deps();
    const result = sanitizeIntent(decision('strike'), requestFor(s, 'garrett', d), s, d);

    expect(result.actionId).toBe(heroById('garrett').classDefaultAction);
    expect(result.coerced).toBe(true);
  });

  it('replaces a malformed answer wholesale with the silent class default (INV-7)', () => {
    const s = state();
    const d = deps();
    const req = requestFor(s, 'garrett', d);

    for (const broken of [null, undefined, 'strike', 42, [], {}, { action: 'strike' }]) {
      const result = sanitizeIntent(broken, req, s, d);
      expect(result.actionId).toBe(heroById('garrett').classDefaultAction);
      expect(result.say).toBe(ELLIPSIS_SAY);
      expect(result.because).toEqual([heroById('garrett').defaultPrompt.id]);
      expect(result.coerced).toBe(true);
    }
  });

  it('replaces an answer whose because id resolves to nothing (INV-3)', () => {
    const s = state();
    const d = deps();
    const result = sanitizeIntent(
      decision('strike', 't1_spam_golem_1', ['no_such_sheet_item']),
      requestFor(s, 'garrett', d),
      s,
      d,
    );

    expect(result.say).toBe(ELLIPSIS_SAY);
    expect(result.because).toEqual([heroById('garrett').defaultPrompt.id]);
    expect(result.actionId).toBe(heroById('garrett').classDefaultAction);
    expect(result.coerced).toBe(true);
  });

  it('keeps the action when the target existed only in the corrupted snapshot (INV-4)', () => {
    const s = state();
    const d = deps();
    const req = withPhantom(requestFor(s, 'fiona', d), 'spam_golem_2');
    const result = sanitizeIntent(decision('strike', 'spam_golem_2', ['fiona.default']), req, s, d);

    expect(result.actionId).toBe('strike');
    expect(result.targetId).toBeNull();
    expect(result.coerced).toBe(false);
  });

  it('renders a phantom target as 허공을 벤다 — no damage reaches real state (INV-4)', () => {
    const s = state();
    const d = deps();
    const req = withPhantom(requestFor(s, 'fiona', d), 'spam_golem_2');
    const phantomIntent = sanitizeIntent(
      decision('strike', 'spam_golem_2', ['fiona.default']),
      req,
      s,
      d,
    );

    const turn = executeTurn(s, [phantomIntent], d);
    expect(pick(turn.events, 'phantom_swing').map((e) => e.unitId)).toEqual(['fiona']);
    expect(pick(turn.events, 'damage').filter((e) => e.sourceId === 'fiona')).toHaveLength(0);
    expect(foeIn(turn.state, 't1_spam_golem_1').hp).toBe(GOLEM.hp);
  });

  it('exposes the symbolic target selectors as a frozen enumerated set', () => {
    expect(Object.keys(TARGET_SELECTORS).sort()).toEqual(
      [
        'self',
        'last_hit_by',
        'first_enemy',
        'lowest_hp_enemy',
        'highest_hp_enemy',
        'lowest_hp_ally',
        'first_ally',
        'phantom_enemy',
      ].sort(),
    );
  });

  it('resolves symbolic selectors against real state, and phantom_enemy to nothing', () => {
    const s = combat(
      [hero('garrett'), hero('fiona', { hp: 2 }), hero('selene', { hp: 3, lastHitBy: 't1_spam_golem_2' })],
      [
        foe('t1_spam_golem_1', 'spam_golem', 0, { hp: 30 }),
        foe('t1_spam_golem_2', 'spam_golem', 1),
        foe('t1_spam_golem_3', 'spam_golem', 2, { hp: 0, alive: false }),
      ],
    );
    const actor = heroIn(s, 'selene');

    expect(resolveTarget(s, actor, 'self')).toEqual({ ok: true, id: 'selene' });
    expect(resolveTarget(s, actor, 'last_hit_by')).toEqual({ ok: true, id: 't1_spam_golem_2' });
    expect(resolveTarget(s, actor, 'first_ally')).toEqual({ ok: true, id: 'garrett' });
    expect(resolveTarget(s, actor, 'first_enemy')).toEqual({ ok: true, id: 't1_spam_golem_1' });
    expect(resolveTarget(s, actor, 'lowest_hp_enemy')).toEqual({ ok: true, id: 't1_spam_golem_1' });
    expect(resolveTarget(s, actor, 'highest_hp_enemy')).toEqual({ ok: true, id: 't1_spam_golem_2' });
    expect(resolveTarget(s, actor, 'lowest_hp_ally')).toEqual({ ok: true, id: 'fiona' });
    expect(resolveTarget(s, actor, 'phantom_enemy')).toEqual({ ok: true, id: null });

    expect(resolveTarget(s, actor, 'garrett')).toEqual({ ok: true, id: 'garrett' });
    expect(resolveTarget(s, actor, 't1_spam_golem_3')).toEqual({ ok: false });
    expect(resolveTarget(s, actor, 'not_a_selector')).toEqual({ ok: false });
  });

  it('never reads the adapter while splitting an intent', () => {
    const s = state();
    const d = deps();
    expect(() =>
      sanitizeIntent(decision('strike', 't1_spam_golem_1'), requestFor(s, 'garrett', d), s, d),
    ).not.toThrow();
  });
});

// ═══════════════ execution order — 민첩 desc, ties through the injected seam ══
describe('execution order runs 민첩 descending with ties through the tieBreak seam', () => {
  const four = (): HeroState[] => [hero('garrett'), hero('fiona'), hero('selene'), hero('mordecai')];

  it('orders distinct 민첩 strictly descending regardless of the caller list order', () => {
    const s = combat(four(), [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const intents = [
      intent('garrett', 'defend'),
      intent('fiona', 'defend'),
      intent('selene', 'defend'),
      intent('mordecai', 'defend'),
    ];

    const ordered = orderIntents(s, intents, deps());
    expect(ordered.map((i) => i.unitId)).toEqual(['selene', 'fiona', 'mordecai', 'garrett']);
  });

  it('resolves an 민첩 tie through the injected seam, not through sort stability', () => {
    const tied = [hero('garrett', { agi: 9 }), hero('mordecai', { agi: 9 })];
    const s = combat(tied, [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const intents = [intent('mordecai', 'defend'), intent('garrett', 'defend')];

    const byIndex = orderIntents(s, intents, deps());
    expect(byIndex.map((i) => i.unitId)).toEqual(['garrett', 'mordecai']);

    const byMaxIndex = orderIntents(s, intents, deps({ tieBreak: maxIndexTieBreak }));
    expect(byMaxIndex.map((i) => i.unitId)).toEqual(['mordecai', 'garrett']);
  });

  it('hands the seam candidates carrying their data/heroes.json index', () => {
    const tied = [hero('garrett', { agi: 9 }), hero('mordecai', { agi: 9 })];
    const s = combat(tied, [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const recorder = recordingTieBreak();

    orderIntents(
      s,
      [intent('garrett', 'defend'), intent('mordecai', 'defend')],
      deps({ tieBreak: recorder.fn }),
    );

    expect(recorder.seen.length).toBeGreaterThanOrEqual(1);
    expect(recorder.seen[0]).toEqual([heroIndex('garrett'), heroIndex('mordecai')]);
  });

  it('drains a three-way 민첩 tie by repeated seam calls', () => {
    const tied = [
      hero('garrett', { agi: 10 }),
      hero('selene', { agi: 10 }),
      hero('mordecai', { agi: 10 }),
    ];
    const s = combat(tied, [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const recorder = recordingTieBreak();
    const ordered = orderIntents(
      s,
      [intent('mordecai', 'defend'), intent('selene', 'defend'), intent('garrett', 'defend')],
      deps({ tieBreak: recorder.fn }),
    );

    expect(ordered.map((i) => i.unitId)).toEqual(['garrett', 'selene', 'mordecai']);
    expect(recorder.seen.length).toBeGreaterThanOrEqual(2);
  });

  it('drops intents whose actor is already down before ordering', () => {
    const s = combat(
      [hero('selene'), hero('fiona', { hp: 0, alive: false })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const ordered = orderIntents(s, [intent('fiona', 'defend'), intent('selene', 'defend')], deps());
    expect(ordered.map((i) => i.unitId)).toEqual(['selene']);
  });

  it('always places enemy intents after every hero, in roster order', () => {
    const s = combat(
      [hero('garrett')],
      [foe('t5_spam_golem_1', 'spam_golem', 0), foe('t5_hallucination_spirit_1', 'hallucination_spirit', 1)],
      { tileId: 't5', rosterId: 'roster_t5' },
    );
    const enemyIntent = (id: string): Intent => ({
      unitId: id,
      actionId: 'strike',
      targetId: 'garrett',
      say: '',
      because: [],
      coerced: false,
    });

    const ordered = orderIntents(
      s,
      [enemyIntent('t5_hallucination_spirit_1'), enemyIntent('t5_spam_golem_1'), intent('garrett', 'defend')],
      deps(),
    );
    expect(ordered.map((i) => i.unitId)).toEqual([
      'garrett',
      't5_spam_golem_1',
      't5_hallucination_spirit_1',
    ]);
  });

  it('leaves the caller array untouched while ordering', () => {
    const s = combat([hero('garrett'), hero('selene')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const intents = [intent('garrett', 'defend'), intent('selene', 'defend')];
    const before = intents.map((i) => i.unitId);

    orderIntents(s, intents, deps());
    expect(intents.map((i) => i.unitId)).toEqual(before);
  });

  it('emits decision events in execution order, and none for enemies (INV-3)', () => {
    const s = combat([hero('garrett'), hero('selene')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(
      s,
      [intent('garrett', 'defend'), intent('selene', 'strike', 't1_spam_golem_1')],
      deps(),
    );

    expect(pick(turn.events, 'decision').map((e) => e.unitId)).toEqual(['selene', 'garrett']);
    expect(turn.events[0]).toEqual({ type: 'turn_start', turn: s.turn });
    expect(turn.state.turn).toBe(s.turn + 1);
  });
});

// ═══════════════ damage — fixed values from data/tuning.json, no RNG ═════════
describe('damage resolution reads fixed values from data/tuning.json', () => {
  it('applies the strike damage value to the named enemy only', () => {
    const s = combat(
      [hero('garrett')],
      [foe('t5_spam_golem_1', 'spam_golem', 0), foe('t5_hallucination_spirit_1', 'hallucination_spirit', 1)],
      { tileId: 't5', rosterId: 'roster_t5' },
    );
    const turn = executeTurn(s, [intent('garrett', 'strike', 't5_spam_golem_1')], deps());

    const hits = pick(turn.events, 'damage').filter((e) => e.sourceId === 'garrett');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      sourceId: 'garrett',
      targetId: 't5_spam_golem_1',
      amount: flat('strike'),
      actionId: 'strike',
    });
    expect(foeIn(turn.state, 't5_spam_golem_1').hp).toBe(GOLEM.hp - flat('strike'));
    expect(foeIn(turn.state, 't5_hallucination_spirit_1').hp).toBe(SPIRIT.hp);
  });

  it('replays a multi-hit damage list in declared order (「이단 베기」)', () => {
    const s = combat(
      [hero('selene', { equippedCardIds: ['dual_slash'] })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('selene', 'dual_slash', 't1_spam_golem_1')], deps());

    const hits = pick(turn.events, 'damage').filter((e) => e.sourceId === 'selene');
    expect(hits.map((e) => e.amount)).toEqual(multi('dual_slash'));
    const total = multi('dual_slash').reduce((a, b) => a + b, 0);
    expect(foeIn(turn.state, 't1_spam_golem_1').hp).toBe(GOLEM.hp - total);
  });

  it('reduces incoming damage by the defend value for the turn the unit defended', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(s, [intent('garrett', 'defend')], deps());

    const taken = pick(turn.events, 'damage').filter((e) => e.targetId === 'garrett');
    expect(taken).toHaveLength(1);
    expect(taken[0].amount).toBe(GOLEM.damage - flat('defend'));
    expect(heroIn(turn.state, 'garrett').hp).toBe(heroById('garrett').hp - taken[0].amount);
  });

  it('clears the defend stance at the end of the turn — 한 턴간 only', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(s, [intent('garrett', 'defend')], deps());
    expect(heroIn(turn.state, 'garrett').defending).toBe(false);
  });

  it('never lets a damage reduction turn into healing or a negative amount', () => {
    const s = combat(
      [hero('garrett')],
      [foe('t5_hallucination_spirit_1', 'hallucination_spirit', 0)],
      { tileId: 't5', rosterId: 'roster_t5' },
    );
    const turn = executeTurn(s, [intent('garrett', 'defend')], deps());

    for (const e of pick(turn.events, 'damage')) expect(e.amount).toBeGreaterThanOrEqual(0);
    expect(heroIn(turn.state, 'garrett').hp).toBe(heroById('garrett').hp);
  });

  it('redirects damage aimed at a guarded ally onto the guard (guard_ally)', () => {
    const s = combat(
      [hero('garrett'), hero('fiona', { hp: 5 })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('garrett', 'guard_ally', 'fiona')], deps());

    const taken = pick(turn.events, 'damage').filter((e) => e.sourceId === 't1_spam_golem_1');
    expect(taken).toHaveLength(1);
    expect(taken[0].targetId).toBe('garrett');
    expect(heroIn(turn.state, 'fiona').hp).toBe(5);
    expect(pick(turn.events, 'hero_hit').map((e) => e.heroId)).toEqual(['garrett']);
    expect(heroIn(turn.state, 'garrett').guardingId).toBeUndefined();
  });

  it('records who landed the last hit so last_hit_by can resolve next turn', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(s, [intent('garrett', 'defend')], deps());
    expect(heroIn(turn.state, 'garrett').lastHitBy).toBe('t1_spam_golem_1');
  });

  it('caps a heal at hpMax and reports the amount actually restored', () => {
    const potion = 'healing_potion_x3';
    const wounded = heroById('fiona').hp - 1;
    const s = combat(
      [
        hero('selene', { equippedCardIds: [potion], charges: { [potion]: 3 } }),
        hero('fiona', { hp: wounded }),
      ],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('selene', 'heal_potion', 'fiona')], deps());

    const heals = pick(turn.events, 'heal');
    expect(heals).toHaveLength(1);
    expect(heals[0].amount).toBe(1);
    expect(heroIn(turn.state, 'fiona').hp).toBe(heroById('fiona').hp);
  });

  it('burns every enemy for the scroll damage value (「화염 두루마리」)', () => {
    const s = combat(
      [hero('mordecai', { equippedCardIds: ['flame_scroll'], charges: { flame_scroll: 1 } })],
      [foe('t5_spam_golem_1', 'spam_golem', 0), foe('t5_hallucination_spirit_1', 'hallucination_spirit', 1)],
      { tileId: 't5', rosterId: 'roster_t5' },
    );
    const turn = executeTurn(s, [intent('mordecai', 'flame_scroll')], deps());

    const burns = pick(turn.events, 'damage').filter((e) => e.actionId === 'flame_scroll');
    expect(burns.map((e) => e.targetId)).toEqual([
      't5_spam_golem_1',
      't5_hallucination_spirit_1',
    ]);
    expect(burns.every((e) => e.amount === flat('flame_scroll'))).toBe(true);
  });

  it('reflects part of the damage taken while defending (「거울 방패」), never a flat 30', () => {
    const s = combat(
      [hero('garrett', { equippedCardIds: ['mirror_shield'] })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('garrett', 'defend')], deps());

    const reflected = pick(turn.events, 'damage').filter((e) => e.actionId === 'mirror_shield');
    expect(reflected).toHaveLength(1);
    expect(reflected[0].sourceId).toBe('garrett');
    expect(reflected[0].targetId).toBe('t1_spam_golem_1');
    expect(reflected[0].amount).toBeGreaterThan(0);
    expect(reflected[0].amount).toBeLessThan(flat('mirror_shield'));
    expect(foeIn(turn.state, 't1_spam_golem_1').hp).toBe(GOLEM.hp - reflected[0].amount);
  });

  it('reflects nothing when the 「거울 방패」 carrier did not defend', () => {
    const s = combat(
      [hero('garrett', { equippedCardIds: ['mirror_shield'] })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('garrett', 'strike', 't1_spam_golem_1')], deps());
    expect(pick(turn.events, 'damage').filter((e) => e.actionId === 'mirror_shield')).toHaveLength(0);
  });

  it('floors hp at zero, emits unit_down once and marks the unit not alive', () => {
    const s = combat(
      [hero('fiona', { hp: 1 })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('fiona', 'wait')], deps());

    expect(heroIn(turn.state, 'fiona').hp).toBe(0);
    expect(heroIn(turn.state, 'fiona').alive).toBe(false);
    expect(pick(turn.events, 'unit_down')).toEqual([
      { type: 'unit_down', unitId: 'fiona', side: 'hero' },
    ]);
  });

  it('produces byte-identical damage events on a repeat run — no RNG in outcomes', () => {
    const build = (): CombatState =>
      combat(
        [hero('garrett'), hero('selene', { equippedCardIds: ['dual_slash'] })],
        [foe('t5_spam_golem_1', 'spam_golem', 0), foe('t5_hallucination_spirit_1', 'hallucination_spirit', 1)],
        { tileId: 't5', rosterId: 'roster_t5' },
      );
    const intents = (): Intent[] => [
      intent('garrett', 'strike', 't5_spam_golem_1'),
      intent('selene', 'dual_slash', 't5_spam_golem_1'),
    ];

    const first = executeTurn(build(), intents(), deps());
    const second = executeTurn(build(), intents(), deps());
    expect(second.events).toEqual(first.events);
    expect(second.state).toEqual(first.state);
  });

  it('never mutates the state it was handed while computing damage', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const before = structuredClone(s);
    executeTurn(s, [intent('garrett', 'strike', 't1_spam_golem_1')], deps());
    expect(s).toEqual(before);
  });
});

// ═══════════════ actions — base three always, cards register more ════════════
describe('actions offered to the adapter — base three always, cards register more', () => {
  it('freezes the base action ids at strike | defend | guard_ally', () => {
    expect([...BASE_ACTION_IDS]).toEqual(['strike', 'defend', 'guard_ally']);
  });

  it('offers exactly the base actions to a unit carrying no cards', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    expect(offeredActions(s, 'garrett', deps()).map((a) => a.id)).toEqual([...BASE_ACTION_IDS]);
  });

  it('marks which base actions need a target', () => {
    const s = combat([hero('garrett'), hero('fiona')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const byId = new Map(offeredActions(s, 'garrett', deps()).map((a) => [a.id, a]));

    expect(byId.get('strike')?.needsTarget).toBe(true);
    expect(byId.get('guard_ally')?.needsTarget).toBe(true);
    expect(byId.get('defend')?.needsTarget).toBe(false);
    expect(byId.get('strike')?.label.length).toBeGreaterThan(0);
  });

  it('never offers the engine-only 직업 기본 행동 stances to the adapter', () => {
    const s = combat([hero('fiona'), hero('selene')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const d = deps();
    const fionaIds = offeredActions(s, 'fiona', d).map((a) => a.id);
    const seleneIds = offeredActions(s, 'selene', d).map((a) => a.id);

    expect(fionaIds).not.toContain('wait');
    expect(seleneIds).not.toContain('evade');
  });

  it('registers the combat action a Skill card declares', () => {
    const s = combat(
      [hero('selene', { equippedCardIds: ['dual_slash', 'taunt'] })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const ids = offeredActions(s, 'selene', deps()).map((a) => a.id);

    expect(ids).toEqual([...BASE_ACTION_IDS, 'dual_slash', 'taunt']);
  });

  it('registers the consumable action an MCP card declares', () => {
    const s = combat(
      [hero('fiona', { equippedCardIds: ['healing_potion_x3'], charges: { healing_potion_x3: 3 } })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    expect(offeredActions(s, 'fiona', deps()).map((a) => a.id)).toContain('heal_potion');
  });

  it('registers no action for a card whose hook is not a combat hook', () => {
    const s = combat(
      [
        hero('mordecai', {
          equippedCardIds: ['mirror_shield', 'translation_lens', 'fearless'],
          charges: { translation_lens: 1 },
        }),
      ],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const ids = offeredActions(s, 'mordecai', deps()).map((a) => a.id);

    expect(ids).toEqual([...BASE_ACTION_IDS]);
    expect(ids).not.toContain('reveal_hint');
  });

  it('puts the offered actions into the snapshot the adapter receives', () => {
    const s = combat(
      [hero('selene', { equippedCardIds: ['dual_slash'] })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const d = deps();
    expect(buildSnapshot(s, 'selene', d).availableActions).toEqual(offeredActions(s, 'selene', d));
  });
});

// ═══════════════ consumables — charges decrement engine-side ═════════════════
describe('consumable charges decrement engine-side', () => {
  const potion = 'healing_potion_x3';

  it('spends one charge per use and reports the remaining count', () => {
    const s = combat(
      [hero('fiona', { equippedCardIds: [potion], charges: { [potion]: 3 } }), hero('garrett', { hp: 4 })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('fiona', 'heal_potion', 'garrett')], deps());

    expect(pick(turn.events, 'consumable_spent')).toEqual([
      { type: 'consumable_spent', unitId: 'fiona', cardId: potion, remaining: 2 },
    ]);
    expect(heroIn(turn.state, 'fiona').charges[potion]).toBe(2);
  });

  it('stops offering a consumable action once its charges hit zero', () => {
    const s = combat(
      [hero('fiona', { equippedCardIds: [potion], charges: { [potion]: 0 } })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    expect(offeredActions(s, 'fiona', deps()).map((a) => a.id)).not.toContain('heal_potion');
  });

  it('coerces an intent that reaches for a spent consumable', () => {
    const s = combat(
      [hero('fiona', { equippedCardIds: [potion], charges: { [potion]: 0 } }), hero('garrett', { hp: 4 })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const d = deps();
    const result = sanitizeIntent(
      decision('heal_potion', 'garrett', ['fiona.default']),
      requestFor(s, 'fiona', d),
      s,
      d,
    );

    expect(result.actionId).toBe(heroById('fiona').classDefaultAction);
    expect(result.coerced).toBe(true);
  });

  it('drops a one-shot consumable to zero on its single use (「화염 두루마리」)', () => {
    const s = combat(
      [hero('mordecai', { equippedCardIds: ['flame_scroll'], charges: { flame_scroll: 1 } })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const d = deps();
    const turn = executeTurn(s, [intent('mordecai', 'flame_scroll')], d);

    expect(pick(turn.events, 'consumable_spent')).toEqual([
      { type: 'consumable_spent', unitId: 'mordecai', cardId: 'flame_scroll', remaining: 0 },
    ]);
    expect(offeredActions(turn.state, 'mordecai', d).map((a) => a.id)).not.toContain('flame_scroll');
  });

  it('never spends a charge for the persistent 「거울 방패」 — it has none to spend', () => {
    const s = combat(
      [hero('garrett', { equippedCardIds: ['mirror_shield'] })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const first = executeTurn(s, [intent('garrett', 'defend')], deps());
    expect(pick(first.events, 'consumable_spent')).toHaveLength(0);
    expect(heroIn(first.state, 'garrett').charges).not.toHaveProperty('mirror_shield');

    const second = executeTurn(first.state, [intent('garrett', 'defend')], deps());
    expect(pick(second.events, 'damage').filter((e) => e.actionId === 'mirror_shield')).toHaveLength(1);
  });

  it('leaves an unrelated unit charges untouched when another unit spends one', () => {
    const s = combat(
      [
        hero('fiona', { equippedCardIds: [potion], charges: { [potion]: 3 } }),
        hero('selene', { equippedCardIds: [potion], charges: { [potion]: 3 } }),
      ],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const turn = executeTurn(s, [intent('fiona', 'heal_potion', 'fiona')], deps());
    expect(heroIn(turn.state, 'selene').charges[potion]).toBe(3);
  });

  it('reads the gauge port only through the injected seam, defaulting to STATIC_GAUGE', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const withPort = buildSnapshot(s, 'garrett', deps({ gauge: gaugeWith({ garrett: 80 }) }));
    const withoutPort = buildSnapshot(s, 'garrett', deps());

    expect(withoutPort.self.gaugeTier).toBe(STATIC_GAUGE.tierOf('garrett'));
    expect(withPort.corrupted).toBe(false);
  });
});
