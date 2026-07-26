// u9 — TDD-Red for the context gauge (PRD §2.5, INV-4/INV-7/INV-8).
//
// The gauge is engine-managed, deterministic, level-designable state: numbers in,
// tier out. It owns the §2.5 accrual rules and the four boundaries — nothing else in
// the codebase may hold a copy of 40 / 70 / 100, and no number is written here that
// `data/tuning.json` does not already declare (INV-8).
//
// Gate words (vitest `-t`): the ONLY tests carrying the lowercase word "accrual" are
// in the first block; the ONLY tests carrying "tiers" are in the second. Nothing else
// in this file may use either word in a title.
//
// RED on arrival: src/combat/gauge.ts and src/combat/noise.ts do not exist yet, and
// `runTurn` does not yet feed the port its post-hit events.
import { describe, expect, it } from 'vitest';

import type { AgentDecision, AIAdapter, DecideRequest } from '../../src/ai/contract.ts';
import { ELLIPSIS_SAY, createFallbackDecider } from '../../src/ai/stub.ts';
import { createTieBreaker } from '../../src/core/tiebreak.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';
import type { Encounters, Hero, Tuning } from '../../src/data/schema.ts';
import { createLoadout } from '../../src/equip/loadout.ts';
import { applyRest } from '../../src/equip/rest.ts';
import type { PartyLoadout } from '../../src/equip/types.ts';
import { vialStateForGauge } from '../../src/ui/vial.ts';

import { buildDecideRequests } from '../../src/combat/snapshot.ts';
import { createCombat, runTurn } from '../../src/combat/turn.ts';
import type { CombatDeps, CombatEvent } from '../../src/combat/types.ts';

import {
  clampGauge,
  createGauge,
  gaugeTierIndex,
  gaugeTierName,
  isJudgmentSuppressed,
  isNoiseTier,
} from '../../src/combat/gauge.ts';
import type { GaugeOptions } from '../../src/combat/gauge.ts';
import { createNoiseInjector } from '../../src/combat/noise.ts';

const { heroes, cards, encounters, tuning } = loadBundledGameData();

const PARTY = ['garrett', 'fiona', 'selene'] as const;
const GAUGE = tuning.gauge;
const SPAM_GOLEM = 'spam_golem';
const SPIRIT = 'hallucination_spirit';

const heroById = (id: string): Hero => {
  const found = heroes.find((h) => h.id === id);
  if (!found) throw new Error(`hero missing from data/heroes.json: ${id}`);
  return found;
};

const sheetIdsOf = (unitId: string): string[] => {
  const data = heroById(unitId);
  return [data.defaultPrompt.id, data.baseSkill.id, ...cards.map((c) => c.id)];
};

const emptyParty = (): PartyLoadout => createLoadout([...PARTY]);

// ── fixtures ────────────────────────────────────────────────────────────────
/** A monster that hits but files no 도배 ref — the plain 피격 case (PRD §2.5). */
const PLAIN_BEAST = 'plain_beast';

const withPlainBeast = (): Encounters => ({
  ...encounters,
  monsters: [
    ...encounters.monsters,
    {
      id: PLAIN_BEAST,
      name: '들짐승',
      hp: 10,
      damage: 3,
      behavior: { rule: 'lowest_hp_hero' as const },
    },
  ],
});

const newGauge = (over: Partial<GaugeOptions> = {}) =>
  createGauge({ unitIds: [...PARTY], tuning, encounters, ...over });

const hit = (heroId: string, monsterId: string): CombatEvent => ({
  type: 'hero_hit',
  heroId,
  monsterId,
  spam: monsterId === SPAM_GOLEM,
});

const gaugeAttack = (heroId: string, monsterId = SPIRIT): CombatEvent => ({
  type: 'gauge_attack',
  heroId,
  monsterId,
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

/** A deep copy of the shipped tunables, so a test may re-point a number (INV-8). */
const retuned = (edit: (draft: Tuning) => void): Tuning => {
  const draft = structuredClone(tuning) as Tuning;
  edit(draft);
  return draft;
};

// ══════════════ accrual — the §2.5 numbers, clamped, relief only at 휴식 ══════════════
describe('gauge accrual', () => {
  it('starts every unit of the party at the floor', () => {
    const gauge = newGauge();
    for (const id of PARTY) expect(gauge.valueOf(id)).toBe(GAUGE.tiers.calm);
  });

  it('adds 피격 for a hit from a monster that files no 도배 ref', () => {
    const gauge = newGauge({ encounters: withPlainBeast() });
    gauge.accrue([hit('garrett', PLAIN_BEAST)]);
    expect(gauge.valueOf('garrett')).toBe(GAUGE.onHit);
  });

  it('adds 도배 on top of 피격 for a 스팸 골렘 hit — both numbers, one event', () => {
    const gauge = newGauge();
    gauge.accrue([hit('garrett', SPAM_GOLEM)]);
    expect(gauge.valueOf('garrett')).toBe(GAUGE.onHit + GAUGE.spamGolemExtra);
    expect(gauge.valueOf('garrett')).toBeGreaterThan(GAUGE.onHit);
  });

  it('adds 환각 정령 for a gauge attack, which lands no damage at all', () => {
    const gauge = newGauge();
    gauge.accrue([gaugeAttack('fiona')]);
    expect(gauge.valueOf('fiona')).toBe(GAUGE.spiritAttack);
    expect(gauge.valueOf('garrett')).toBe(GAUGE.tiers.calm);
  });

  it('adds 퍼즐 오답 to every unit of the party at once', () => {
    const gauge = newGauge();
    gauge.addAll(GAUGE.puzzleWrong);
    for (const id of PARTY) expect(gauge.valueOf(id)).toBe(GAUGE.puzzleWrong);
  });

  it('leaves the units that were not hit exactly where they were', () => {
    const gauge = newGauge();
    gauge.accrue([hit('garrett', SPAM_GOLEM), hit('garrett', SPAM_GOLEM)]);
    expect(gauge.valueOf('fiona')).toBe(GAUGE.tiers.calm);
    expect(gauge.valueOf('selene')).toBe(GAUGE.tiers.calm);
  });

  it('clamps at the ceiling however many hits land', () => {
    const gauge = newGauge();
    for (let i = 0; i < 20; i += 1) gauge.accrue([hit('garrett', SPAM_GOLEM)]);
    expect(gauge.valueOf('garrett')).toBe(GAUGE.max);
  });

  it('clamps a raw reading into 0–max on both sides', () => {
    expect(clampGauge(-40, tuning)).toBe(GAUGE.tiers.calm);
    expect(clampGauge(GAUGE.max + 40, tuning)).toBe(GAUGE.max);
    expect(clampGauge(GAUGE.tiers.limit, tuning)).toBe(GAUGE.tiers.limit);
  });

  it('ignores an event about a unit outside this party instead of throwing (INV-7)', () => {
    const gauge = newGauge();
    expect(() => gauge.accrue([hit('mordecai', SPAM_GOLEM)])).not.toThrow();
    for (const id of PARTY) expect(gauge.valueOf(id)).toBe(GAUGE.tiers.calm);
  });

  it('still counts 피격 for a hit whose monster id is not in the encounter data', () => {
    const gauge = newGauge();
    gauge.accrue([hit('garrett', 'no_such_monster')]);
    expect(gauge.valueOf('garrett')).toBe(GAUGE.onHit);
  });

  it('refuses to read a unit that is not in this party — that is a wiring bug', () => {
    expect(() => newGauge().valueOf('mordecai')).toThrow(RangeError);
  });

  it('refuses a negative delta: the 휴식 tile is the only relief (PRD §2.5)', () => {
    const gauge = newGauge();
    expect(() => gauge.add('garrett', -1)).toThrow(RangeError);
    expect(() => gauge.addAll(-GAUGE.puzzleWrong)).toThrow(RangeError);
  });

  it('never lowers a reading across a whole run of combat events', () => {
    const gauge = newGauge();
    const seen: number[] = [];
    const script: CombatEvent[] = [
      hit('garrett', SPAM_GOLEM),
      gaugeAttack('garrett'),
      { type: 'damage', sourceId: 't1_spam_golem_1', targetId: 'garrett', amount: 4, actionId: 'attack' },
      { type: 'heal', sourceId: 'fiona', targetId: 'garrett', amount: 6, actionId: 'heal_potion' },
      { type: 'unit_down', unitId: 'selene', side: 'hero' },
      { type: 'phantom_swing', unitId: 'fiona', actionId: 'strike' },
      hit('garrett', SPAM_GOLEM),
    ];
    for (const event of script) {
      gauge.accrue([event]);
      seen.push(gauge.valueOf('garrett'));
    }
    for (let i = 1; i < seen.length; i += 1) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
  });

  it('hands its readings to the 휴식 tile and takes the relieved numbers back', () => {
    const gauge = newGauge();
    gauge.accrue([hit('garrett', SPAM_GOLEM), hit('garrett', SPAM_GOLEM), hit('garrett', SPAM_GOLEM)]);
    const before = gauge.valueOf('garrett');

    const relieved = applyRest('think', emptyParty(), gauge.entries(), tuning);
    gauge.setAll(relieved.gauges);

    expect(gauge.valueOf('garrett')).toBe(Math.max(before + GAUGE.rest.think, GAUGE.tiers.calm));
    expect(gauge.valueOf('garrett')).toBeLessThan(before);
  });

  it('takes a Clear straight back down to the floor', () => {
    const gauge = newGauge();
    gauge.addAll(GAUGE.max);
    gauge.setAll(applyRest('clear', emptyParty(), gauge.entries(), tuning).gauges);
    for (const id of PARTY) expect(gauge.valueOf(id)).toBe(GAUGE.rest.clearTo);
  });

  it('reports one entry per unit, in the order the party was seeded', () => {
    const gauge = newGauge();
    gauge.accrue([hit('fiona', SPAM_GOLEM)]);
    expect(gauge.entries()).toEqual([
      { id: 'garrett', gauge: GAUGE.tiers.calm },
      { id: 'fiona', gauge: GAUGE.onHit + GAUGE.spamGolemExtra },
      { id: 'selene', gauge: GAUGE.tiers.calm },
    ]);
  });

  it('reads every number out of data/tuning.json rather than owning one (INV-8)', () => {
    const custom = retuned((draft) => {
      draft.gauge.onHit = 7;
      draft.gauge.spamGolemExtra = 3;
      draft.gauge.spiritAttack = 1;
    });
    const gauge = createGauge({ unitIds: [...PARTY], tuning: custom, encounters });

    gauge.accrue([hit('garrett', SPAM_GOLEM), gaugeAttack('fiona')]);
    expect(gauge.valueOf('garrett')).toBe(10);
    expect(gauge.valueOf('fiona')).toBe(1);
  });

  it('pins the shipped §2.5 numbers — 피격 10 · 도배 +10 · 환각 25 · 오답 15 · 0–100', () => {
    expect(GAUGE.onHit).toBe(10);
    expect(GAUGE.spamGolemExtra).toBe(10);
    expect(GAUGE.spiritAttack).toBe(25);
    expect(GAUGE.puzzleWrong).toBe(15);
    expect(GAUGE.tiers.calm).toBe(0);
    expect(GAUGE.max).toBe(100);
  });

  it('lets the port the combat core holds carry the same readings', () => {
    const gauge = newGauge();
    const port = gauge.port();
    gauge.accrue([hit('garrett', SPAM_GOLEM)]);
    expect(port.valueOf('garrett')).toBe(gauge.valueOf('garrett'));
  });

  it('is fed by the turn loop itself — one turn of 도배 moves the port (PRD §2.5 hook)', async () => {
    const gauge = newGauge();
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'defend'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    const hits = pick(result.events, 'hero_hit');
    expect(hits).toHaveLength(1);
    expect(gauge.valueOf(hits[0].heroId)).toBe(GAUGE.onHit + GAUGE.spamGolemExtra);
  });

  it('counts each turn once — replaying the same start state does not double-count', async () => {
    const gauge = newGauge();
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        fiona: answer('fiona', 'defend'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const state = createCombat('t1', emptyParty(), d);
    const first = await runTurn(state, d);
    const hitId = pick(first.events, 'hero_hit')[0].heroId;
    const afterOne = gauge.valueOf(hitId);

    await runTurn(first.state, d);
    expect(gauge.valueOf(hitId)).toBe(afterOne + GAUGE.onHit + GAUGE.spamGolemExtra);
  });
});

// ══════════════ tiers — the exact boundaries 40 / 70 / 100 (PRD §2.5) ══════════════
describe('gauge tiers', () => {
  it('reads anything below the 불안 boundary as 평온, index 0', () => {
    for (const value of [0, 1, GAUGE.tiers.uneasy - 1]) {
      expect(gaugeTierIndex(value, tuning)).toBe(0);
      expect(gaugeTierName(value, tuning)).toBe('calm');
      expect(isNoiseTier(value, tuning)).toBe(false);
      expect(isJudgmentSuppressed(value, tuning)).toBe(false);
    }
  });

  it('enters 불안 at exactly the boundary and holds it up to one below 한계', () => {
    for (const value of [GAUGE.tiers.uneasy, GAUGE.tiers.limit - 1]) {
      expect(gaugeTierIndex(value, tuning)).toBe(1);
      expect(gaugeTierName(value, tuning)).toBe('uneasy');
    }
  });

  it('keeps the 불안 band presentation-only — no noise, no suppression', () => {
    for (const value of [GAUGE.tiers.uneasy, GAUGE.tiers.limit - 1]) {
      expect(isNoiseTier(value, tuning)).toBe(false);
      expect(isJudgmentSuppressed(value, tuning)).toBe(false);
    }
  });

  it('enters 한계 at exactly the boundary and injects noise from there up', () => {
    for (const value of [GAUGE.tiers.limit, GAUGE.tiers.overload - 1]) {
      expect(gaugeTierIndex(value, tuning)).toBe(2);
      expect(gaugeTierName(value, tuning)).toBe('limit');
      expect(isNoiseTier(value, tuning)).toBe(true);
      expect(isJudgmentSuppressed(value, tuning)).toBe(false);
    }
  });

  it('enters 폭주 at exactly the ceiling, where judgment stops', () => {
    expect(gaugeTierIndex(GAUGE.tiers.overload, tuning)).toBe(3);
    expect(gaugeTierName(GAUGE.tiers.overload, tuning)).toBe('overload');
    expect(isNoiseTier(GAUGE.tiers.overload, tuning)).toBe(true);
    expect(isJudgmentSuppressed(GAUGE.tiers.overload, tuning)).toBe(true);
  });

  it('refuses a reading outside 0–max instead of guessing a band', () => {
    expect(() => gaugeTierIndex(-1, tuning)).toThrow(RangeError);
    expect(() => gaugeTierIndex(GAUGE.max + 1, tuning)).toThrow(RangeError);
  });

  it('agrees with the HUD vial primitive on every boundary value', () => {
    const thresholds = {
      uneasy: GAUGE.tiers.uneasy,
      limit: GAUGE.tiers.limit,
      overload: GAUGE.tiers.overload,
    };
    const boundaries = [
      0,
      GAUGE.tiers.uneasy - 1,
      GAUGE.tiers.uneasy,
      GAUGE.tiers.limit - 1,
      GAUGE.tiers.limit,
      GAUGE.tiers.overload - 1,
      GAUGE.tiers.overload,
    ];
    for (const value of boundaries) {
      expect(gaugeTierName(value, tuning)).toBe(vialStateForGauge(value, thresholds));
    }
  });

  it('reports the same band through the tracker as through the pure reader', () => {
    const gauge = newGauge();
    gauge.add('garrett', GAUGE.tiers.limit);
    expect(gauge.tierOf('garrett')).toBe(gaugeTierIndex(GAUGE.tiers.limit, tuning));
    expect(gauge.tierNameOf('garrett')).toBe('limit');
    expect(gauge.port().tierOf('garrett')).toBe(2);
  });

  it('reads its boundaries out of data/tuning.json rather than owning them (INV-8)', () => {
    const custom = retuned((draft) => {
      draft.gauge.tiers = { calm: 0, uneasy: 20, limit: 30, overload: 40 };
      draft.gauge.max = 40;
    });
    expect(gaugeTierIndex(30, custom)).toBe(2);
    expect(gaugeTierIndex(30, tuning)).toBe(0);
    expect(isJudgmentSuppressed(40, custom)).toBe(true);
  });

  it('pins the shipped boundaries — 0 / 40 / 70 / 100, strictly ascending', () => {
    expect(GAUGE.tiers).toEqual({ calm: 0, uneasy: 40, limit: 70, overload: 100 });
    expect(GAUGE.tiers.overload).toBe(GAUGE.max);
  });

  it('poisons nothing while a unit sits one point below 한계', () => {
    const gauge = newGauge({ noise: createNoiseInjector({ encounters }) });
    gauge.add('fiona', GAUGE.tiers.limit - 1);
    const d = deps({ gauge: gauge.port() });
    const requests = buildDecideRequests(createCombat('t1', emptyParty(), d), d);

    const fiona = requests.find((r) => r.unitId === 'fiona');
    expect(fiona?.snapshot.corrupted).toBe(false);
    expect(fiona?.snapshot.enemies).toHaveLength(1);
    expect(fiona?.snapshot.self.gaugeTier).toBe(1);
  });

  it('poisons the judgment input the moment a unit touches 한계', () => {
    const gauge = newGauge({ noise: createNoiseInjector({ encounters }) });
    gauge.add('fiona', GAUGE.tiers.limit);
    const d = deps({ gauge: gauge.port() });
    const requests = buildDecideRequests(createCombat('t1', emptyParty(), d), d);

    const fiona = requests.find((r) => r.unitId === 'fiona');
    expect(fiona?.snapshot.corrupted).toBe(true);
    expect(fiona?.snapshot.self.gaugeTier).toBe(2);
  });

  it('skips the judgment of a unit at the ceiling — it costs no adapter call', async () => {
    const gauge = newGauge();
    gauge.add('fiona', GAUGE.max);
    const recorder = recordingAdapter({
      garrett: answer('garrett', 'defend'),
      selene: answer('selene', 'defend'),
    });
    const d = deps({ gauge: gauge.port(), adapter: recorder.adapter });

    expect(gauge.port().judgmentSuppressed('fiona')).toBe(true);
    await runTurn(createCombat('t1', emptyParty(), d), d);

    expect(recorder.seen.map((r) => r.unitId).sort()).toEqual(['garrett', 'selene']);
  });

  it('forces the 직업 기본 행동 with the fixed bubble at the ceiling', async () => {
    const gauge = newGauge();
    gauge.add('fiona', GAUGE.max);
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'defend'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    const forced = decisionFor(result.events, 'fiona');
    expect(forced.actionId).toBe(heroById('fiona').classDefaultAction);
    expect(forced.say).toBe(ELLIPSIS_SAY);
    expect(forced.because).toEqual([heroById('fiona').defaultPrompt.id]);
    expect(forced.coerced).toBe(true);
  });

  it('leaves the rest of the party judging while one unit is at the ceiling', async () => {
    const gauge = newGauge();
    gauge.add('fiona', GAUGE.max);
    const d = deps({
      gauge: gauge.port(),
      adapter: recordingAdapter({
        garrett: answer('garrett', 'strike', 't1_spam_golem_1'),
        selene: answer('selene', 'defend'),
      }).adapter,
    });
    const result = await runTurn(createCombat('t1', emptyParty(), d), d);

    expect(decisionFor(result.events, 'garrett').coerced).toBe(false);
    expect(decisionFor(result.events, 'garrett').actionId).toBe('strike');
    expect(decisionFor(result.events, 'selene').coerced).toBe(false);
  });
});
