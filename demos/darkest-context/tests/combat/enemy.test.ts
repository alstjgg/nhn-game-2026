// u8 — TDD-Red for the enemy behavior tables and the combat outcome (PRD §2.2, §2.5).
//
// Enemies NEVER call the adapter: monsters run authored deterministic tables out of
// `data/encounters.json` (스팸 골렘 → lowest-HP hero · 환각 정령 → highest-gauge hero),
// ties resolve through the injected `tieBreak` seam, and the run ends on defeat (all
// heroes at 0 HP) or victory (a reward-handoff event carrying tile + roster).
//
// The whole file is one AC gate, so no `-t` word is reserved here. Every stat is read
// from `data/encounters.json`; no monster HP or damage literal appears below.
//
// RED on arrival: src/combat/{types,execute,enemy}.ts do not exist yet.
import { describe, expect, it } from 'vitest';

import type { AIAdapter, GaugeTier } from '../../src/ai/contract.ts';
import { createFallbackDecider } from '../../src/ai/stub.ts';
import { createTieBreaker } from '../../src/core/tiebreak.ts';
import type { TieCandidate } from '../../src/core/tiebreak.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';
import { BEHAVIOR_RULES } from '../../src/data/schema.ts';
import type { Hero, Monster, Roster } from '../../src/data/schema.ts';

import { executeTurn } from '../../src/combat/execute.ts';
import { BEHAVIOR_TABLE, enemyIntents, resolveOutcome } from '../../src/combat/enemy.ts';
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
const rosterById = (id: string): Roster => {
  const found = encounters.rosters.find((r) => r.id === id);
  if (!found) throw new Error(`roster missing from data/encounters.json: ${id}`);
  return found;
};

const GOLEM = monsterById('spam_golem');
const SPIRIT = monsterById('hallucination_spirit');

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

/** Counts every adapter touch — the enemy phase must leave it at zero. */
const spyAdapter = (): { adapter: AIAdapter; calls: () => number } => {
  let calls = 0;
  return {
    calls: () => calls,
    adapter: {
      mode: 'stub',
      async decide() {
        calls += 1;
        throw new Error('an enemy called the adapter: PRD §2.2 forbids it');
      },
      async stance() {
        calls += 1;
        throw new Error('an enemy called the adapter: PRD §2.2 forbids it');
      },
    },
  };
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
  adapter: spyAdapter().adapter,
  fallbackFor: createFallbackDecider(heroes),
  tieBreak: indexTieBreak,
  sheetIdsOf,
  ...over,
});

const maxIndexTieBreak = <T>(candidates: readonly TieCandidate<T>[]): T =>
  candidates.reduce((best, cur) => (cur.index > best.index ? cur : best)).value;

const gaugeWith = (values: Record<string, number>): GaugePort => ({
  tierOf: () => 0 as GaugeTier,
  valueOf: (id: string) => values[id] ?? 0,
  judgmentSuppressed: () => false,
});

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

const targetOf = (intents: readonly Intent[], unitId: string): string | null => {
  const found = intents.find((i) => i.unitId === unitId);
  if (!found) throw new Error(`no intent produced for ${unitId}`);
  return found.targetId;
};

// ═══════════════ the behavior table is the whole enemy brain ═════════════════
describe('enemy behavior tables replace judgment entirely', () => {
  it('covers exactly the behavior rules declared in the data schema', () => {
    expect(Object.keys(BEHAVIOR_TABLE).sort()).toEqual([...BEHAVIOR_RULES].sort());
  });

  it('never touches the adapter while choosing enemy intents', () => {
    const spy = spyAdapter();
    const s = combat([hero('garrett'), hero('fiona')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);

    expect(() => enemyIntents(s, deps({ adapter: spy.adapter }))).not.toThrow();
    expect(spy.calls()).toBe(0);
  });

  it('never touches the adapter while executing a whole turn', () => {
    const spy = spyAdapter();
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);

    executeTurn(
      s,
      [
        {
          unitId: 'garrett',
          actionId: 'strike',
          targetId: 't1_spam_golem_1',
          say: '막아선다.',
          because: ['garrett.default'],
          coerced: false,
        },
      ],
      deps({ adapter: spy.adapter }),
    );
    expect(spy.calls()).toBe(0);
  });

  it('produces one intent per living enemy, in roster order, with no attribution', () => {
    const roster = rosterById('roster_t7');
    const s = combat(
      [hero('garrett')],
      roster.entries.map((e, i) => foe(e.instanceId, e.monsterId, i)),
      { tileId: roster.tileId, rosterId: roster.id },
    );

    const intents = enemyIntents(s, deps());
    expect(intents.map((i) => i.unitId)).toEqual(roster.entries.map((e) => e.instanceId));
    expect(intents.every((i) => i.because.length === 0)).toBe(true);
    expect(intents.every((i) => i.coerced === false)).toBe(true);
  });

  it('produces no intent for an enemy that is already down', () => {
    const s = combat(
      [hero('garrett')],
      [
        foe('t5_spam_golem_1', 'spam_golem', 0, { hp: 0, alive: false }),
        foe('t5_hallucination_spirit_1', 'hallucination_spirit', 1),
      ],
      { tileId: 't5', rosterId: 'roster_t5' },
    );

    expect(enemyIntents(s, deps()).map((i) => i.unitId)).toEqual(['t5_hallucination_spirit_1']);
  });
});

// ═══════════════ 스팸 골렘 — lowest-HP hero ═══════════════════════════════════
describe('스팸 골렘 hits the lowest-HP hero', () => {
  it('picks the wounded hero over the healthy one', () => {
    const s = combat(
      [hero('garrett'), hero('fiona', { hp: 3 }), hero('selene')],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    expect(targetOf(enemyIntents(s, deps()), 't1_spam_golem_1')).toBe('fiona');
  });

  it('ignores heroes that are already down, however low their hp reads', () => {
    const s = combat(
      [hero('garrett', { hp: 9 }), hero('fiona', { hp: 0, alive: false })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    expect(targetOf(enemyIntents(s, deps()), 't1_spam_golem_1')).toBe('garrett');
  });

  it('resolves an hp tie through the injected tieBreak seam', () => {
    const tied = [hero('garrett', { hp: 5 }), hero('selene', { hp: 5 })];
    const s = combat(tied, [foe('t1_spam_golem_1', 'spam_golem', 0)]);

    expect(targetOf(enemyIntents(s, deps()), 't1_spam_golem_1')).toBe('garrett');
    expect(targetOf(enemyIntents(s, deps({ tieBreak: maxIndexTieBreak })), 't1_spam_golem_1')).toBe(
      'selene',
    );
  });

  it('deals the damage value declared in data/encounters.json and marks the hit as 도배', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(s, [], deps());

    const hits = pick(turn.events, 'damage');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      sourceId: 't1_spam_golem_1',
      targetId: 'garrett',
      amount: GOLEM.damage,
    });
    expect(pick(turn.events, 'hero_hit')).toEqual([
      { type: 'hero_hit', heroId: 'garrett', monsterId: 'spam_golem', spam: true },
    ]);
    expect(heroIn(turn.state, 'garrett').hp).toBe(heroById('garrett').hp - GOLEM.damage);
  });

  it('keeps concentrating on the same hero as its hp keeps falling (§2.5 early drama)', () => {
    let state = combat(
      [hero('garrett'), hero('fiona', { hp: 8 }), hero('selene')],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    const struck: string[] = [];

    for (let i = 0; i < 2; i += 1) {
      const turn = executeTurn(state, [], deps());
      struck.push(...pick(turn.events, 'hero_hit').map((e) => e.heroId));
      state = turn.state;
    }
    expect(struck).toEqual(['fiona', 'fiona']);
  });
});

// ═══════════════ 환각 정령 — highest-gauge hero ═══════════════════════════════
describe('환각 정령 gauge-attacks the highest-gauge hero', () => {
  const spiritState = (party: HeroState[]): CombatState =>
    combat(party, [foe('t5_hallucination_spirit_1', 'hallucination_spirit', 0)], {
      tileId: 't5',
      rosterId: 'roster_t5',
    });

  it('reads the gauge through the injected port, not through hp', () => {
    const s = spiritState([hero('garrett', { hp: 2 }), hero('fiona'), hero('selene')]);
    const gauge = gaugeWith({ garrett: 10, fiona: 65, selene: 30 });

    expect(targetOf(enemyIntents(s, deps({ gauge })), 't5_hallucination_spirit_1')).toBe('fiona');
  });

  it('resolves a gauge tie through the injected tieBreak seam', () => {
    const s = spiritState([hero('garrett'), hero('selene')]);
    const gauge = gaugeWith({ garrett: 40, selene: 40 });

    expect(targetOf(enemyIntents(s, deps({ gauge })), 't5_hallucination_spirit_1')).toBe('garrett');
    expect(
      targetOf(
        enemyIntents(s, deps({ gauge, tieBreak: maxIndexTieBreak })),
        't5_hallucination_spirit_1',
      ),
    ).toBe('selene');
  });

  it('falls back to STATIC_GAUGE when no gauge port is injected — an all-zero tie', () => {
    const s = spiritState([hero('garrett'), hero('fiona')]);
    expect(STATIC_GAUGE.valueOf('garrett')).toBe(0);
    expect(targetOf(enemyIntents(s, deps()), 't5_hallucination_spirit_1')).toBe('garrett');
  });

  it('emits a gauge_attack and no damage — its damage value in data is zero', () => {
    const s = spiritState([hero('garrett')]);
    const turn = executeTurn(s, [], deps());

    expect(SPIRIT.damage).toBe(0);
    expect(pick(turn.events, 'damage')).toHaveLength(0);
    expect(pick(turn.events, 'gauge_attack')).toEqual([
      { type: 'gauge_attack', heroId: 'garrett', monsterId: 'hallucination_spirit' },
    ]);
    expect(heroIn(turn.state, 'garrett').hp).toBe(heroById('garrett').hp);
  });

  it('never targets a hero who is already down', () => {
    const s = spiritState([hero('garrett', { hp: 0, alive: false }), hero('fiona')]);
    const gauge = gaugeWith({ garrett: 100, fiona: 5 });
    expect(targetOf(enemyIntents(s, deps({ gauge })), 't5_hallucination_spirit_1')).toBe('fiona');
  });
});

// ═══════════════ the enemy phase inside a turn ═══════════════════════════════
describe('the enemy phase runs after every hero, on live state only', () => {
  it('skips an enemy the party killed earlier in the same turn', () => {
    const s = combat(
      [hero('selene')],
      [foe('t1_spam_golem_1', 'spam_golem', 0, { hp: 1 })],
    );
    const turn = executeTurn(
      s,
      [
        {
          unitId: 'selene',
          actionId: 'strike',
          targetId: 't1_spam_golem_1',
          say: '먼저 끝낸다.',
          because: ['selene.default'],
          coerced: false,
        },
      ],
      deps(),
    );

    expect(foeIn(turn.state, 't1_spam_golem_1').alive).toBe(false);
    expect(pick(turn.events, 'hero_hit')).toHaveLength(0);
    expect(heroIn(turn.state, 'selene').hp).toBe(heroById('selene').hp);
  });

  it('emits no decision event for an enemy — only heroes get an attributable bubble', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(s, [], deps());
    expect(pick(turn.events, 'decision')).toHaveLength(0);
  });

  it('lets every living enemy in the roster act once, in declared order', () => {
    const roster = rosterById('roster_t7');
    const s = combat(
      [hero('garrett'), hero('fiona', { hp: 12 })],
      roster.entries.map((e, i) => foe(e.instanceId, e.monsterId, i)),
      { tileId: roster.tileId, rosterId: roster.id },
    );
    const turn = executeTurn(s, [], deps());

    const actors = [
      ...pick(turn.events, 'damage').map((e) => e.sourceId),
      ...pick(turn.events, 'gauge_attack').map(() => 't7_hallucination_spirit_1'),
    ];
    expect(actors).toEqual(roster.entries.map((e) => e.instanceId));
  });
});

// ═══════════════ outcome — defeat, victory, and the reward handoff ═══════════
describe('combat outcome ends the run or hands off the reward', () => {
  it('reads ongoing while both sides still stand', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    expect(resolveOutcome(s)).toBe('ongoing');
  });

  it('reads defeat once every hero is at 0 HP', () => {
    const s = combat(
      [hero('garrett', { hp: 0, alive: false }), hero('fiona', { hp: 0, alive: false })],
      [foe('t1_spam_golem_1', 'spam_golem', 0)],
    );
    expect(resolveOutcome(s)).toBe('defeat');
  });

  it('reads victory once every enemy is down', () => {
    const s = combat(
      [hero('garrett')],
      [foe('t1_spam_golem_1', 'spam_golem', 0, { hp: 0, alive: false })],
    );
    expect(resolveOutcome(s)).toBe('victory');
  });

  it('emits a defeat event carrying the tile when the party wipes', () => {
    const s = combat([hero('fiona', { hp: 1 })], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(s, [], deps());

    expect(turn.state.outcome).toBe('defeat');
    expect(pick(turn.events, 'defeat')).toEqual([{ type: 'defeat', tileId: 't1' }]);
    expect(pick(turn.events, 'victory')).toHaveLength(0);
  });

  it('emits a victory event carrying tile and roster — the reward handoff', () => {
    const s = combat(
      [hero('selene')],
      [foe('t1_spam_golem_1', 'spam_golem', 0, { hp: 1 })],
    );
    const turn = executeTurn(
      s,
      [
        {
          unitId: 'selene',
          actionId: 'strike',
          targetId: 't1_spam_golem_1',
          say: '이걸로 끝이다.',
          because: ['selene.default'],
          coerced: false,
        },
      ],
      deps(),
    );

    expect(turn.state.outcome).toBe('victory');
    expect(pick(turn.events, 'victory')).toEqual([
      { type: 'victory', tileId: 't1', rosterId: 'roster_t1' },
    ]);
  });

  it('emits neither ending while the fight is still on', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const turn = executeTurn(s, [], deps());

    expect(turn.state.outcome).toBe('ongoing');
    expect(pick(turn.events, 'victory')).toHaveLength(0);
    expect(pick(turn.events, 'defeat')).toHaveLength(0);
  });

  it('runs no further turn once the combat has already ended', () => {
    const s = combat(
      [hero('garrett')],
      [foe('t1_spam_golem_1', 'spam_golem', 0, { hp: 0, alive: false })],
      { outcome: 'victory' },
    );
    const turn = executeTurn(s, [], deps());

    expect(turn.events).toHaveLength(0);
    expect(turn.state).toEqual(s);
  });

  it('never mutates the state handed to the enemy phase', () => {
    const s = combat([hero('garrett')], [foe('t1_spam_golem_1', 'spam_golem', 0)]);
    const before = structuredClone(s);

    enemyIntents(s, deps());
    executeTurn(s, [], deps());
    expect(s).toEqual(before);
  });
});
