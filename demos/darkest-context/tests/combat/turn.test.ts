// u8 — TDD-Red for the turn loop and the snapshot builder (PRD §2.2, §2.5, INV-4/INV-7).
//
// The turn loop is the ONE async file of the combat core: it builds each hero's snapshot,
// fires every adapter call in parallel (wall clock ≈ one call per turn), sanitises what
// comes back, and hands pure intents to the execution core. It arms no timer of its own —
// all waiting belongs to `src/ai/stub.ts` (INV-6), so this slice runs at latency 0.
//
// Gate words: the parallelism describes carry the lowercase word "parallel"; nothing else
// in this file is `-t` selected.
//
// RED on arrival: src/combat/{types,snapshot,execute,enemy,turn}.ts do not exist yet.
import { describe, expect, it, vi } from 'vitest';

import type {
  AgentDecision,
  AIAdapter,
  DecideRequest,
  GaugeTier,
  SituationSnapshot,
} from '../../src/ai/contract.ts';
import { DEFAULT_KEY } from '../../src/ai/bucket.ts';
import type { BucketConfig, DecisionPool } from '../../src/ai/bucket.ts';
import { ELLIPSIS_SAY, createFallbackDecider, createStubAdapter } from '../../src/ai/stub.ts';
import { createTieBreaker } from '../../src/core/tiebreak.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';
import type { Card, Hero, Monster } from '../../src/data/schema.ts';
import { createLoadout, equipCard } from '../../src/equip/loadout.ts';
import type { PartyLoadout } from '../../src/equip/types.ts';

import { createCombat, runTurn } from '../../src/combat/turn.ts';
import { buildDecideRequests, buildSnapshot } from '../../src/combat/snapshot.ts';
import { STATIC_GAUGE } from '../../src/combat/types.ts';
import type { CombatDeps, CombatEvent, CombatState, GaugePort } from '../../src/combat/types.ts';

const { heroes, cards, encounters, tuning } = loadBundledGameData();

const PARTY = ['garrett', 'fiona', 'selene'] as const;

const heroById = (id: string): Hero => {
  const found = heroes.find((h) => h.id === id);
  if (!found) throw new Error(`hero missing from data/heroes.json: ${id}`);
  return found;
};
const cardById = (id: string): Card => {
  const found = cards.find((c) => c.id === id);
  if (!found) throw new Error(`card missing from data/cards.json: ${id}`);
  return found;
};
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

const GOLEM = monsterById('spam_golem');

const sheetIdsOf = (unitId: string): string[] => {
  const data = heroById(unitId);
  return [data.defaultPrompt.id, data.baseSkill.id, ...cards.map((c) => c.id)];
};

const emptyParty = (): PartyLoadout => createLoadout([...PARTY]);

const deps = (over: Partial<CombatDeps> = {}): CombatDeps => ({
  tuning,
  heroes,
  cards,
  encounters,
  adapter: silentAdapter({}),
  fallbackFor: createFallbackDecider(heroes),
  tieBreak: createTieBreaker({ policy: tuning.tieBreak.test }),
  sheetIdsOf,
  ...over,
});

// ── adapters ────────────────────────────────────────────────────────────────
const answer = (unitId: string, action: string, target?: string): AgentDecision => {
  const base: AgentDecision = {
    action,
    say: '한 발 앞으로.',
    because: [heroById(unitId).defaultPrompt.id],
  };
  return target === undefined ? base : { ...base, target };
};

/** Answers from a per-unit script; records every request it was handed. */
function silentAdapter(script: Record<string, AgentDecision | null>): AIAdapter {
  return {
    mode: 'stub',
    async decide(req: DecideRequest) {
      return script[req.unitId] ?? null;
    },
    async stance() {
      return null;
    },
  };
}

interface RecordingAdapter {
  adapter: AIAdapter;
  seen: DecideRequest[];
}

function recordingAdapter(script: Record<string, AgentDecision | null>): RecordingAdapter {
  const seen: DecideRequest[] = [];
  return {
    seen,
    adapter: {
      mode: 'stub',
      async decide(req: DecideRequest) {
        seen.push(req);
        return script[req.unitId] ?? null;
      },
      async stance() {
        return null;
      },
    },
  };
}

/**
 * Every call must be ISSUED before any of them may resolve. If the loop awaits one call
 * before firing the next, the gate never opens and the test times out — which is exactly
 * the failure "the party's calls are sequential" should produce.
 */
function barrierAdapter(expected: number, script: Record<string, AgentDecision | null>) {
  let arrived = 0;
  let peak = 0;
  let inFlight = 0;
  let open!: () => void;
  const gate = new Promise<void>((resolve) => {
    open = resolve;
  });

  const adapter: AIAdapter = {
    mode: 'stub',
    async decide(req: DecideRequest) {
      arrived += 1;
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      if (arrived >= expected) open();
      await gate;
      inFlight -= 1;
      return script[req.unitId] ?? null;
    },
    async stance() {
      return null;
    },
  };

  return { adapter, arrived: () => arrived, peak: () => peak };
}

// ── gauge ports ─────────────────────────────────────────────────────────────
const suppressing = (suppressedId: string): GaugePort => ({
  tierOf: (id: string) => (id === suppressedId ? 3 : 0) as GaugeTier,
  valueOf: (id: string) => (id === suppressedId ? tuning.gauge.max : 0),
  judgmentSuppressed: (id: string) => id === suppressedId,
});

const PHANTOM_ID = 'spam_golem_2';

const corrupting = (targetId: string): GaugePort => ({
  tierOf: (id: string) => (id === targetId ? 2 : 0) as GaugeTier,
  valueOf: (id: string) => (id === targetId ? tuning.gauge.tiers.limit : 0),
  judgmentSuppressed: () => false,
  corrupt: (snapshot: SituationSnapshot, id: string): SituationSnapshot =>
    id === targetId
      ? {
          ...snapshot,
          corrupted: true,
          enemies: [
            ...snapshot.enemies,
            { id: PHANTOM_ID, name: PHANTOM_ID, hp: GOLEM.hp, hpMax: GOLEM.hp, alive: true },
          ],
        }
      : snapshot,
});

// ── event readers ───────────────────────────────────────────────────────────
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

// ═══════════════ createCombat — state assembled out of data/ ═════════════════
describe('createCombat assembles the fight from data/', () => {
  it('places the tile roster and stamps each enemy with its declared entry index', () => {
    const state = createCombat('t1', emptyParty(), deps());

    expect(state.tileId).toBe('t1');
    expect(state.rosterId).toBe('roster_t1');
    expect(state.turn).toBe(1);
    expect(state.outcome).toBe('ongoing');
    expect(state.enemies).toHaveLength(1);
    expect(state.enemies[0]).toMatchObject({
      id: 't1_spam_golem_1',
      monsterId: 'spam_golem',
      side: 'enemy',
      hp: GOLEM.hp,
      hpMax: GOLEM.hp,
      damage: GOLEM.damage,
      alive: true,
      dataIndex: 0,
    });
  });

  it('seeds every hero from data/heroes.json, keeping its file index for tie-breaks', () => {
    const state = createCombat('t1', emptyParty(), deps());

    expect(state.heroes.map((h) => h.id).sort()).toEqual([...PARTY].sort());
    for (const unit of state.heroes) {
      const data = heroById(unit.id);
      expect(unit.hp).toBe(data.hp);
      expect(unit.hpMax).toBe(data.hp);
      expect(unit.agi).toBe(data.stats.agi);
      expect(unit.classDefaultAction).toBe(data.classDefaultAction);
      expect(unit.dataIndex).toBe(heroes.findIndex((h) => h.id === unit.id));
      expect(unit.alive).toBe(true);
      expect(unit.defending).toBe(false);
    }
  });

  it('seeds consumable charges from the card data and nothing for a persistent card', () => {
    let party = emptyParty();
    for (const id of ['healing_potion_x3', 'flame_scroll', 'mirror_shield']) {
      party = equipCard(party, 'fiona', cardById(id), tuning.slots);
    }
    const state = createCombat('t1', party, deps());
    const fiona = state.heroes.find((h) => h.id === 'fiona');

    expect(fiona?.equippedCardIds).toEqual([
      'healing_potion_x3',
      'flame_scroll',
      'mirror_shield',
    ]);
    expect(fiona?.charges).toEqual({
      healing_potion_x3: cardById('healing_potion_x3').charges,
      flame_scroll: cardById('flame_scroll').charges,
    });
  });

  it('refuses a tile that owns no roster — that is a data bug, not a runtime state', () => {
    expect(() => createCombat('t2', emptyParty(), deps())).toThrow();
  });
});

// ═══════════════ the snapshot handed to the adapter ══════════════════════════
describe('the engine-built snapshot carries ids and numbers only (INV-1)', () => {
  it('shows the acting unit itself, its allies and the enemy line', () => {
    const state = createCombat('t1', emptyParty(), deps());
    const snapshot = buildSnapshot(state, 'garrett', deps());

    expect(snapshot.turn).toBe(state.turn);
    expect(snapshot.self).toMatchObject({
      id: 'garrett',
      hp: heroById('garrett').hp,
      hpMax: heroById('garrett').hp,
      alive: true,
      gaugeTier: 0,
    });
    expect(snapshot.allies.map((a) => a.id)).toEqual(['fiona', 'selene']);
    expect(snapshot.enemies.map((e) => e.id)).toEqual(['t1_spam_golem_1']);
    expect(snapshot.corrupted).toBe(false);
  });

  it('reports a downed unit truthfully rather than hiding it', () => {
    const base = createCombat('t1', emptyParty(), deps());
    const state: CombatState = {
      ...base,
      heroes: base.heroes.map((h) => (h.id === 'selene' ? { ...h, hp: 0, alive: false } : h)),
    };
    const snapshot = buildSnapshot(state, 'garrett', deps());

    expect(snapshot.allies.find((a) => a.id === 'selene')?.alive).toBe(false);
  });

  it('passes the last attacker through so a grudge can resolve to a real id', () => {
    const base = createCombat('t1', emptyParty(), deps());
    const state: CombatState = {
      ...base,
      heroes: base.heroes.map((h) =>
        h.id === 'garrett' ? { ...h, lastHitBy: 't1_spam_golem_1' } : h,
      ),
    };

    expect(buildSnapshot(state, 'garrett', deps()).self.lastHitBy).toBe('t1_spam_golem_1');
    expect(buildSnapshot(base, 'garrett', deps()).self.lastHitBy).toBeUndefined();
  });

  it('defaults to STATIC_GAUGE when no gauge port is injected', () => {
    expect(STATIC_GAUGE.tierOf('garrett')).toBe(0);
    expect(STATIC_GAUGE.valueOf('garrett')).toBe(0);
    expect(STATIC_GAUGE.judgmentSuppressed('garrett')).toBe(false);
    expect(STATIC_GAUGE.corrupt).toBeUndefined();
  });

  it('hands the corrupt hook the judgment input and returns exactly what it produced', () => {
    const state = createCombat('t1', emptyParty(), deps());
    const snapshot = buildSnapshot(state, 'fiona', deps({ gauge: corrupting('fiona') }));

    expect(snapshot.corrupted).toBe(true);
    expect(snapshot.enemies.map((e) => e.id)).toContain(PHANTOM_ID);
    expect(buildSnapshot(state, 'garrett', deps({ gauge: corrupting('fiona') })).corrupted).toBe(
      false,
    );
  });

  it('builds one request per unit still entitled to judge', () => {
    const base = createCombat('t1', emptyParty(), deps());
    const state: CombatState = {
      ...base,
      heroes: base.heroes.map((h) => (h.id === 'selene' ? { ...h, hp: 0, alive: false } : h)),
    };
    const requests = buildDecideRequests(state, deps({ gauge: suppressing('fiona') }));

    expect(requests.map((r) => r.unitId)).toEqual(['garrett']);
    expect(requests[0].equippedCardIds).toEqual([]);
    expect(requests[0].snapshot.availableActions.length).toBeGreaterThan(0);
  });
});

// ═══════════════ the parallel call fan-out ═══════════════════════════════════
describe('the turn issues its adapter calls in parallel', () => {
  it('fires every unit call before awaiting any of them', async () => {
    const barrier = barrierAdapter(PARTY.length, {
      garrett: answer('garrett', 'defend'),
      fiona: answer('fiona', 'defend'),
      selene: answer('selene', 'strike', 't1_spam_golem_1'),
    });
    const d = deps({ adapter: barrier.adapter });
    const state = createCombat('t1', emptyParty(), d);

    const result = await runTurn(state, d);

    expect(barrier.arrived()).toBe(PARTY.length);
    expect(barrier.peak()).toBe(PARTY.length);
    expect(pick(result.events, 'decision')).toHaveLength(PARTY.length);
  });

  it('skips the parallel call entirely for a unit whose judgment is suppressed', async () => {
    const recorder = recordingAdapter({
      garrett: answer('garrett', 'defend'),
      selene: answer('selene', 'defend'),
    });
    const d = deps({ adapter: recorder.adapter, gauge: suppressing('fiona') });
    const state = createCombat('t1', emptyParty(), d);

    const result = await runTurn(state, d);

    expect(recorder.seen.map((r) => r.unitId).sort()).toEqual(['garrett', 'selene']);
    const fiona = decisionFor(result.events, 'fiona');
    expect(fiona.actionId).toBe(heroById('fiona').classDefaultAction);
    expect(fiona.say).toBe(ELLIPSIS_SAY);
    expect(fiona.because).toEqual([heroById('fiona').defaultPrompt.id]);
    expect(fiona.coerced).toBe(true);
  });

  it('skips the parallel call for a unit that is already down', async () => {
    const recorder = recordingAdapter({ garrett: answer('garrett', 'defend') });
    const d = deps({ adapter: recorder.adapter });
    const base = createCombat('t1', emptyParty(), d);
    const state: CombatState = {
      ...base,
      heroes: base.heroes.map((h) =>
        h.id === 'garrett' ? h : { ...h, hp: 0, alive: false },
      ),
    };

    const result = await runTurn(state, d);

    expect(recorder.seen.map((r) => r.unitId)).toEqual(['garrett']);
    expect(pick(result.events, 'decision').map((e) => e.unitId)).toEqual(['garrett']);
  });

  it('degrades one parallel call without touching the others (INV-7)', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const adapter: AIAdapter = {
      mode: 'stub',
      async decide(req: DecideRequest) {
        if (req.unitId === 'fiona') throw new Error('network died mid-turn');
        return answer(req.unitId, 'defend');
      },
      async stance() {
        return null;
      },
    };
    const d = deps({ adapter });
    const state = createCombat('t1', emptyParty(), d);

    const result = await runTurn(state, d);

    expect(decisionFor(result.events, 'fiona').say).toBe(ELLIPSIS_SAY);
    expect(decisionFor(result.events, 'garrett').say).not.toBe(ELLIPSIS_SAY);
    expect(decisionFor(result.events, 'selene').say).not.toBe(ELLIPSIS_SAY);
    expect(errors).not.toHaveBeenCalled();
    expect(warns).not.toHaveBeenCalled();

    errors.mockRestore();
    warns.mockRestore();
  });

  it('never rejects, even when every parallel call fails', async () => {
    const adapter: AIAdapter = {
      mode: 'stub',
      async decide() {
        throw new Error('the proxy is gone');
      },
      async stance() {
        return null;
      },
    };
    const d = deps({ adapter });
    const state = createCombat('t1', emptyParty(), d);

    const result = await runTurn(state, d);
    for (const unitId of PARTY) {
      expect(decisionFor(result.events, unitId).actionId).toBe(
        heroById(unitId).classDefaultAction,
      );
      expect(decisionFor(result.events, unitId).say).toBe(ELLIPSIS_SAY);
      expect(decisionFor(result.events, unitId).because).toEqual([
        heroById(unitId).defaultPrompt.id,
      ]);
    }
  });
});

// ═══════════════ the loop itself ═════════════════════════════════════════════
describe('the turn loop moves the fight forward without arming a timer of its own', () => {
  it('opens with turn_start and hands back a state one turn further on', async () => {
    const d = deps({
      adapter: silentAdapter({
        garrett: answer('garrett', 'strike', 't1_spam_golem_1'),
        fiona: answer('fiona', 'defend'),
        selene: answer('selene', 'defend'),
      }),
    });
    const state = createCombat('t1', emptyParty(), d);
    const result = await runTurn(state, d);

    expect(result.events[0]).toEqual({ type: 'turn_start', turn: 1 });
    expect(result.state.turn).toBe(2);
    expect(state.turn).toBe(1);
  });

  it('emits its decision events in 민첩 descending execution order', async () => {
    const d = deps({
      adapter: silentAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'defend'),
        selene: answer('selene', 'defend'),
      }),
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    expect(pick(result.events, 'decision').map((e) => e.unitId)).toEqual([
      'selene',
      'fiona',
      'garrett',
    ]);
  });

  it('executes on real state even when the judgment input was corrupted (INV-4)', async () => {
    const recorder = recordingAdapter({
      garrett: answer('garrett', 'defend'),
      selene: answer('selene', 'defend'),
      fiona: answer('fiona', 'strike', PHANTOM_ID),
    });
    const d = deps({ adapter: recorder.adapter, gauge: corrupting('fiona') });
    const state = createCombat('t1', emptyParty(), d);

    const result = await runTurn(state, d);

    const fionaRequest = recorder.seen.find((r) => r.unitId === 'fiona');
    expect(fionaRequest?.snapshot.enemies.map((e) => e.id)).toContain(PHANTOM_ID);
    expect(recorder.seen.find((r) => r.unitId === 'garrett')?.snapshot.corrupted).toBe(false);

    expect(pick(result.events, 'phantom_swing').map((e) => e.unitId)).toEqual(['fiona']);
    expect(result.state.enemies[0].hp).toBe(GOLEM.hp);
    expect(decisionFor(result.events, 'fiona').coerced).toBe(false);
  });

  it('runs a real stub adapter at the unit-test latency of 0 with no fake timers', async () => {
    expect(tuning.latency.unit).toBe(0);

    const bucketConfig: BucketConfig = {
      openingTurn: 1,
      hurtBelowRatio: 0.5,
      enemyLowBelowRatio: 0.3,
    };
    const pool: DecisionPool = {
      decisions: {
        garrett: {
          default: {
            [DEFAULT_KEY]: {
              action: 'strike',
              target: 'lowest_hp_enemy',
              say: '내가 먼저 간다.',
              because: ['garrett.default'],
            },
          },
        },
        fiona: {
          default: {
            [DEFAULT_KEY]: { action: 'defend', say: '뒤에 서겠다.', because: ['fiona.default'] },
          },
        },
        selene: {
          default: {
            [DEFAULT_KEY]: { action: 'defend', say: '거리를 둔다.', because: ['selene.default'] },
          },
        },
      },
    };
    const adapter = createStubAdapter({
      pool,
      latencyMs: tuning.latency.unit,
      timeoutMs: tuning.timeout.stub,
      bucketConfig,
    });
    const d = deps({ adapter });

    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    const struck = pick(result.events, 'damage').filter((e) => e.sourceId === 'garrett');
    expect(struck).toHaveLength(1);
    expect(struck[0].amount).toBe(flat('strike'));
    expect(struck[0].targetId).toBe('t1_spam_golem_1');
    expect(decisionFor(result.events, 'garrett').coerced).toBe(false);
  });

  it('lets the enemy phase close the turn after every hero has acted', async () => {
    const d = deps({
      adapter: silentAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'defend'),
        selene: answer('selene', 'defend'),
      }),
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    const hits = pick(result.events, 'hero_hit');
    expect(hits).toHaveLength(1);
    expect(hits[0].spam).toBe(true);
    const lastDecision = pick(result.events, 'decision').at(-1);
    expect(result.events.indexOf(hits[0])).toBeGreaterThan(
      result.events.indexOf(lastDecision as CombatEvent),
    );
  });

  it('is idempotent on its input — the same start state replays identically', async () => {
    const script: Record<string, AgentDecision> = {
      garrett: answer('garrett', 'strike', 't1_spam_golem_1'),
      fiona: answer('fiona', 'defend'),
      selene: answer('selene', 'strike', 't1_spam_golem_1'),
    };
    const d = deps({ adapter: silentAdapter(script) });
    const state = createCombat('t1', emptyParty(), d);

    const first = await runTurn(state, d);
    const second = await runTurn(state, d);

    expect(second.events).toEqual(first.events);
    expect(second.state).toEqual(first.state);
  });
});
