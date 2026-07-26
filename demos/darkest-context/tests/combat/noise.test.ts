// u9 — TDD-Red for the ≥70 noise injection (PRD §2.5, §4-4 / INV-4).
//
// INV-4 in one line: noise corrupts the JUDGMENT INPUT and nothing else. The snapshot
// handed to the adapter grows a phantom enemy; real state never hears about it, and a
// unit that honestly swings at what it was shown misses into 허공 instead of hitting a
// real body. A phantom swing is therefore NOT a coercion — the unit judged correctly on
// bad input, which is the whole point of must-prove 4.
//
// The tier gate (≥70) lives in gauge.ts; this file owns what the corruption IS.
//
// RED on arrival: src/combat/noise.ts and src/combat/gauge.ts do not exist yet.
import { describe, expect, it } from 'vitest';

import type { AgentDecision, AIAdapter, DecideRequest } from '../../src/ai/contract.ts';
import type { BucketConfig } from '../../src/ai/bucket.ts';
import { computeBucket } from '../../src/ai/bucket.ts';
import { createFallbackDecider } from '../../src/ai/stub.ts';
import { createTieBreaker } from '../../src/core/tiebreak.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';
import type { Hero } from '../../src/data/schema.ts';
import { createLoadout } from '../../src/equip/loadout.ts';
import type { PartyLoadout } from '../../src/equip/types.ts';

import { buildSnapshot } from '../../src/combat/snapshot.ts';
import { createCombat, runTurn } from '../../src/combat/turn.ts';
import type { CombatDeps, CombatEvent } from '../../src/combat/types.ts';

import { createGauge } from '../../src/combat/gauge.ts';
import { PHANTOM_MISS_SAY, createNoiseInjector, injectNoise, phantomIdFor } from '../../src/combat/noise.ts';

const { heroes, cards, encounters, tuning } = loadBundledGameData();

const PARTY = ['garrett', 'fiona', 'selene'] as const;
const GAUGE = tuning.gauge;
const T1_GOLEM = 't1_spam_golem_1';
const CFG: BucketConfig = { openingTurn: 1, hurtBelowRatio: 0.5, enemyLowBelowRatio: 0.3 };

const heroById = (id: string): Hero => {
  const found = heroes.find((h) => h.id === id);
  if (!found) throw new Error(`hero missing from data/heroes.json: ${id}`);
  return found;
};

const golemHp = (() => {
  const found = encounters.monsters.find((m) => m.id === 'spam_golem');
  if (!found) throw new Error('monster missing from data/encounters.json: spam_golem');
  return found.hp;
})();

/** A flat damage number out of data/tuning.json — never an inline literal (INV-8). */
const flat = (key: string): number => {
  const value = tuning.damage[key];
  if (typeof value !== 'number') throw new Error(`tuning.damage.${key} is not a flat number`);
  return value;
};

const sheetIdsOf = (unitId: string): string[] => {
  const data = heroById(unitId);
  return [data.defaultPrompt.id, data.baseSkill.id, ...cards.map((c) => c.id)];
};

const emptyParty = (): PartyLoadout => createLoadout([...PARTY]);

const answer = (unitId: string, action: string, target?: string): AgentDecision => {
  const base: AgentDecision = {
    action,
    say: '저건… 뭐지?',
    because: [heroById(unitId).defaultPrompt.id],
  };
  return target === undefined ? base : { ...base, target };
};

function recordingAdapter(script: Record<string, AgentDecision | null>) {
  const seen: DecideRequest[] = [];
  const adapter: AIAdapter = {
    mode: 'stub',
    async decide(req: DecideRequest) {
      seen.push(req);
      return script[req.unitId] ?? null;
    },
    async stance() {
      return null;
    },
  };
  return { adapter, seen };
}

const deps = (over: Partial<CombatDeps> = {}): CombatDeps => ({
  tuning,
  heroes,
  cards,
  encounters,
  adapter: recordingAdapter({}).adapter,
  fallbackFor: createFallbackDecider(heroes),
  tieBreak: createTieBreaker({ policy: tuning.tieBreak.test }),
  sheetIdsOf,
  ...over,
});

const pick = <T extends CombatEvent['type']>(
  events: readonly CombatEvent[],
  type: T,
): Extract<CombatEvent, { type: T }>[] =>
  events.filter((e) => e.type === type) as Extract<CombatEvent, { type: T }>[];

const decisionFor = (events: readonly CombatEvent[], unitId: string) => {
  const found = pick(events, 'decision').find((e) => e.unitId === unitId);
  if (!found) throw new Error(`no decision event for ${unitId}`);
  return found;
};

/** A gauge with the noise injector wired, holding one unit at the 한계 boundary. */
const gaugeAt = (unitId: string, value: number) => {
  const gauge = createGauge({
    unitIds: [...PARTY],
    tuning,
    encounters,
    noise: createNoiseInjector({ encounters }),
  });
  gauge.add(unitId, value);
  return gauge;
};

/** An honest T1 snapshot, built with no gauge at all. */
const honestSnapshot = (unitId: string, tileId = 't1') => {
  const d = deps();
  return buildSnapshot(createCombat(tileId, emptyParty(), d), unitId, d);
};

// ══════════════════ what the corruption IS ══════════════════════════════════
describe('the phantom the gauge injects', () => {
  it('adds exactly one enemy and marks the snapshot corrupted', () => {
    const honest = honestSnapshot('fiona');
    const poisoned = injectNoise(honest, encounters);

    expect(honest.corrupted).toBe(false);
    expect(poisoned.corrupted).toBe(true);
    expect(poisoned.enemies).toHaveLength(honest.enemies.length + 1);
  });

  it('names the phantom after the monster it doubles — spam_golem_2 for 피오나 (PRD §2.5)', () => {
    const poisoned = injectNoise(honestSnapshot('fiona'), encounters);
    const phantom = poisoned.enemies.at(-1);

    expect(phantom?.id).toBe('spam_golem_2');
    expect(phantom?.id).toBe(phantomIdFor('spam_golem', 2));
  });

  it('counts the copies already on the line before it names the next one', () => {
    const poisoned = injectNoise(honestSnapshot('fiona', 't7'), encounters);
    expect(poisoned.enemies.at(-1)?.id).toBe(phantomIdFor('spam_golem', 3));
  });

  it('gives the phantom a whole, living body so the input reads as ordinary', () => {
    const phantom = injectNoise(honestSnapshot('fiona'), encounters).enemies.at(-1);
    expect(phantom).toMatchObject({ hp: golemHp, hpMax: golemHp, alive: true });
  });

  it('is deterministic — the same input corrupts identically, with no RNG', () => {
    const honest = honestSnapshot('fiona');
    expect(injectNoise(honest, encounters)).toEqual(injectNoise(honest, encounters));
  });

  it('never mutates the snapshot it was handed', () => {
    const honest = honestSnapshot('fiona');
    const before = structuredClone(honest);
    injectNoise(honest, encounters);
    expect(honest).toEqual(before);
  });

  it('doubles nothing when there is no living enemy to double', () => {
    const honest = honestSnapshot('fiona');
    const empty = { ...honest, enemies: [] };
    const result = injectNoise(empty, encounters);

    expect(result.enemies).toHaveLength(0);
    expect(result.corrupted).toBe(false);
  });

  it('renders the swing that finds nothing as 허공을 벤다', () => {
    expect(PHANTOM_MISS_SAY).toBe('허공을 벤다');
  });
});

// ══════════════════ who sees it — the tier gate ═════════════════════════════
describe('noise reaches only the unit that earned it', () => {
  it('corrupts the ≥70 unit and leaves its calm allies an honest line-up', async () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit);
    const recorder = recordingAdapter({
      garrett: answer('garrett', 'defend'),
      fiona: answer('fiona', 'defend'),
      selene: answer('selene', 'defend'),
    });
    const d = deps({ gauge: gauge.port(), adapter: recorder.adapter });

    await runTurn(createCombat('t1', emptyParty(), d), d);

    const fiona = recorder.seen.find((r) => r.unitId === 'fiona');
    const garrett = recorder.seen.find((r) => r.unitId === 'garrett');
    expect(fiona?.snapshot.corrupted).toBe(true);
    expect(fiona?.snapshot.enemies.map((e) => e.id)).toContain('spam_golem_2');
    expect(garrett?.snapshot.corrupted).toBe(false);
    expect(garrett?.snapshot.enemies.map((e) => e.id)).toEqual([T1_GOLEM]);
  });

  it('hands out an honest snapshot one point below the boundary', () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit - 1);
    const d = deps({ gauge: gauge.port() });
    const snapshot = buildSnapshot(createCombat('t1', emptyParty(), d), 'fiona', d);

    expect(snapshot.corrupted).toBe(false);
    expect(snapshot.enemies.map((e) => e.id)).toEqual([T1_GOLEM]);
  });

  it('sends the corrupted turn to the gauge_noise answer bucket (u6)', () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit);
    const d = deps({ gauge: gauge.port() });
    const snapshot = buildSnapshot(createCombat('t1', emptyParty(), d), 'fiona', d);

    expect(computeBucket(snapshot, CFG)).toBe('gauge_noise');
    expect(computeBucket(honestSnapshot('fiona'), CFG)).not.toBe('gauge_noise');
  });
});

// ══════════════════ execution stays on real state (INV-4) ═══════════════════
describe('execution resolves against real state whatever the snapshot said', () => {
  it('degrades a swing at the phantom into a miss that touches no real HP', async () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit);
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'strike', 'spam_golem_2'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    expect(pick(result.events, 'phantom_swing').map((e) => e.unitId)).toEqual(['fiona']);
    expect(pick(result.events, 'damage').filter((e) => e.sourceId === 'fiona')).toHaveLength(0);
    expect(result.state.enemies).toHaveLength(1);
    expect(result.state.enemies[0].hp).toBe(golemHp);
  });

  it('does not read a phantom swing as a coercion — the unit judged honestly', async () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit);
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'strike', 'spam_golem_2'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    const said = decisionFor(result.events, 'fiona');
    expect(said.coerced).toBe(false);
    expect(said.actionId).toBe('strike');
    expect(said.say).toBe('저건… 뭐지?');
  });

  it('treats the phantom_enemy selector the same way as a phantom id', async () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit);
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'strike', 'phantom_enemy'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    expect(pick(result.events, 'phantom_swing').map((e) => e.unitId)).toEqual(['fiona']);
    expect(result.state.enemies[0].hp).toBe(golemHp);
  });

  it('still lands a real target that a corrupted unit named', async () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit);
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'strike', T1_GOLEM),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    expect(pick(result.events, 'phantom_swing')).toHaveLength(0);
    expect(result.state.enemies[0].hp).toBe(golemHp - flat('strike'));
  });

  it('leaves the phantom out of the roster the next turn starts from', async () => {
    const gauge = gaugeAt('fiona', GAUGE.tiers.limit);
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'strike', 'spam_golem_2'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    expect(result.state.enemies.map((e) => e.id)).toEqual([T1_GOLEM]);
  });
});
