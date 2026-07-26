// u9 — TDD-Red for the EARLY-DRAMA RULE (PRD §2.5, §1 must-prove 4, §5 gate ①).
//
// The rule is fixed and the numbers serve it: at default tunables at least one unit must
// reach ≥70 INSIDE the T1 combat, and there must still be a turn left for the corrupted
// judgment to render. A judge must never finish the demo without seeing a noise turn.
//
// This is the unit-level twin of u17's gate ①. It fails the moment `data/tuning.json`,
// `data/heroes.json` or `data/encounters.json` drift out of the rule — which is the point:
// the rule is fixed, the balance numbers are what move.
//
// RED on arrival: src/combat/gauge.ts and src/combat/noise.ts do not exist yet.
import { describe, expect, it } from 'vitest';

import type { AgentDecision, AIAdapter, DecideRequest, ValidationCtx } from '../../src/ai/contract.ts';
import type { BucketConfig, DecisionPool, PoolSection } from '../../src/ai/bucket.ts';
import { DEFAULT_KEY } from '../../src/ai/bucket.ts';
import { createFallbackDecider, createStubAdapter } from '../../src/ai/stub.ts';
import { createTieBreaker } from '../../src/core/tiebreak.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';
import type { Hero } from '../../src/data/schema.ts';
import { createLoadout } from '../../src/equip/loadout.ts';
import type { PartyLoadout } from '../../src/equip/types.ts';

import { createCombat, runTurn } from '../../src/combat/turn.ts';
import type { CombatDeps, CombatEvent, CombatState } from '../../src/combat/types.ts';

import { createGauge } from '../../src/combat/gauge.ts';
import { createNoiseInjector } from '../../src/combat/noise.ts';

import decisionsRaw from '../../data/decisions.json';

const { heroes, cards, encounters, tuning } = loadBundledGameData();

const PARTY = ['garrett', 'fiona', 'selene'] as const;
const GAUGE = tuning.gauge;
const CFG: BucketConfig = { openingTurn: 1, hurtBelowRatio: 0.5, enemyLowBelowRatio: 0.3 };

/** How many 도배 hits the accrual rate needs to carry one hero to 한계. */
const HITS_TO_LIMIT = Math.ceil(GAUGE.tiers.limit / (GAUGE.onHit + GAUGE.spamGolemExtra));
/**
 * The sim plays only as far as the rule needs: the crossing turn, the turn that judges
 * on the corrupted snapshot, and one spare. Whether T1 is ultimately won or lost belongs
 * to another unit's slice — this file asserts the drama, not the outcome.
 */
const SIM_TURNS = HITS_TO_LIMIT + 2;

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

const flat = (key: string): number => {
  const value = tuning.damage[key];
  if (typeof value !== 'number') throw new Error(`tuning.damage.${key} is not a flat number`);
  return value;
};

const t1Roster = (() => {
  const found = encounters.rosters.find((r) => r.tileId === 't1');
  if (!found) throw new Error('data/encounters.json declares no roster for t1');
  return found;
})();

const monsterById = (id: string) => {
  const found = encounters.monsters.find((m) => m.id === id);
  if (!found) throw new Error(`monster missing from data/encounters.json: ${id}`);
  return found;
};

// ── the shipped stub answers, nested the way the adapter reads them ─────────
interface CombatRow {
  unitId: string;
  bucket: string;
  cardId: string | null;
  decision: unknown;
}

const COMBAT_ROWS = decisionsRaw.combat as unknown as readonly CombatRow[];

function combatPool(rows: readonly CombatRow[]): DecisionPool {
  const decisions: Record<string, PoolSection> = {};
  for (const row of rows) {
    const unit = (decisions[row.unitId] ??= {});
    const section = (unit[row.bucket] ??= {});
    section[row.cardId ?? DEFAULT_KEY] = row.decision;
  }
  return { decisions };
}

/** The shipped stub adapter, with every request it was handed kept for inspection. */
function shippedAdapter() {
  const seen: DecideRequest[] = [];
  const inner = createStubAdapter({
    pool: combatPool(COMBAT_ROWS),
    latencyMs: tuning.latency.unit,
    timeoutMs: tuning.timeout.stub,
    bucketConfig: CFG,
  });
  const adapter: AIAdapter = {
    mode: 'stub',
    async decide(req: DecideRequest, ctx?: ValidationCtx): Promise<AgentDecision | null> {
      seen.push(structuredClone(req));
      return inner.decide(req, ctx);
    },
    async stance() {
      return null;
    },
  };
  return { adapter, seen };
}

// ── one whole T1 combat, played out at latency 0 ────────────────────────────
interface Simulation {
  turns: number;
  outcome: CombatState['outcome'];
  peak: number;
  peakUnitId: string;
  /** The turn number on which some unit first touched 한계. */
  crossedOnTurn: number | null;
  /** Whether a corrupted snapshot was actually handed to the adapter. */
  noiseRendered: boolean;
  events: CombatEvent[];
  seen: DecideRequest[];
}

async function simulateT1(): Promise<Simulation> {
  const recorder = shippedAdapter();
  const gauge = createGauge({
    unitIds: [...PARTY],
    tuning,
    encounters,
    noise: createNoiseInjector({ encounters }),
  });
  const deps: CombatDeps = {
    tuning,
    heroes,
    cards,
    encounters,
    adapter: recorder.adapter,
    fallbackFor: createFallbackDecider(heroes),
    tieBreak: createTieBreaker({ policy: tuning.tieBreak.test }),
    sheetIdsOf,
    gauge: gauge.port(),
  };

  let state = createCombat('t1', emptyParty(), deps);
  const events: CombatEvent[] = [];
  let turns = 0;
  let peak = 0;
  let peakUnitId: string = PARTY[0];
  let crossedOnTurn: number | null = null;

  while (state.outcome === 'ongoing' && turns < SIM_TURNS) {
    const played = state.turn;
    const result = await runTurn(state, deps);
    state = result.state;
    events.push(...result.events);
    turns += 1;

    for (const id of PARTY) {
      const value = gauge.valueOf(id);
      if (value > peak) {
        peak = value;
        peakUnitId = id;
      }
      if (crossedOnTurn === null && value >= GAUGE.tiers.limit) crossedOnTurn = played;
    }
  }

  return {
    turns,
    outcome: state.outcome,
    peak,
    peakUnitId,
    crossedOnTurn,
    noiseRendered: recorder.seen.some((req) => req.snapshot.corrupted),
    events,
    seen: recorder.seen,
  };
}

const pick = <T extends CombatEvent['type']>(
  events: readonly CombatEvent[],
  type: T,
): Extract<CombatEvent, { type: T }>[] =>
  events.filter((e) => e.type === type) as Extract<CombatEvent, { type: T }>[];

// ══════════════════ the rule itself ═════════════════════════════════════════
describe('early-drama rule — one unit must blow past 한계 inside the T1 combat', () => {
  it('drives at least one unit to 한계 within the first few turns of T1', async () => {
    const run = await simulateT1();
    expect(
      run.peak,
      `no unit reached ${GAUGE.tiers.limit} in the first ${SIM_TURNS} turns of T1 — ` +
        'must-prove 4 is unobservable. Adjust the balance numbers (HP / damage) in data/, ' +
        'never the rule (PRD §2.5).',
    ).toBeGreaterThanOrEqual(GAUGE.tiers.limit);
  });

  it('crosses on the turn the accrual rate implies, not eventually', async () => {
    const run = await simulateT1();
    expect(run.crossedOnTurn).not.toBeNull();
    expect(
      run.crossedOnTurn ?? Number.POSITIVE_INFINITY,
      'the 도배 hits are not landing on one hero every turn — the gauge is being spread',
    ).toBeLessThanOrEqual(HITS_TO_LIMIT);
  });

  it('renders a noise turn inside the same combat — gate ①', async () => {
    const run = await simulateT1();
    expect(
      run.noiseRendered,
      'the gauge crossed 한계 with no turn left to judge on: no corrupted snapshot ever ' +
        'reached the adapter, so the demo shows no noise turn (PRD §5 gate ①).',
    ).toBe(true);
  });

  it('concentrates the drama on the 스팸 골렘 target rather than spreading it', async () => {
    const run = await simulateT1();
    const hits = pick(run.events, 'hero_hit');
    const tally = new Map<string, number>();
    for (const event of hits) tally.set(event.heroId, (tally.get(event.heroId) ?? 0) + 1);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((event) => event.spam)).toBe(true);
    const busiest = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    expect(busiest[0]).toBe(run.peakUnitId);
  });

  it('leaves the units nobody hit far below 한계', async () => {
    const run = await simulateT1();
    const hit = new Set(pick(run.events, 'hero_hit').map((e) => e.heroId));
    expect(hit.size).toBeLessThan(PARTY.length);
  });
});

// ══════════════ the drift alarm, independent of what the party says ═════════
describe('T1 balance keeps the rule reachable however the party plays', () => {
  it('lets the 스팸 골렘 land enough 도배 hits even against a full-attack party', () => {
    const golem = monsterById(t1Roster.entries[0].monsterId);
    const bestCaseDamagePerTurn = PARTY.length * flat('strike');
    const turnsToKill = Math.ceil(golem.hp / bestCaseDamagePerTurn);

    // The roster swings on every turn but the one it dies on, and the crossing turn
    // still needs a turn after it for the corrupted judgment to be handed out.
    expect(
      turnsToKill,
      `T1 balance drift: ${HITS_TO_LIMIT} 도배 hits are needed to cross ${GAUGE.tiers.limit}, ` +
        `plus one turn to judge on — but the fastest party ends the fight in ${turnsToKill} turns. ` +
        'Raise the roster HP (or lower the party damage) in data/, never the rule (PRD §2.5).',
    ).toBeGreaterThan(HITS_TO_LIMIT);
  });

  it('keeps the 스팸 골렘 target alive long enough to carry the gauge', () => {
    const golem = monsterById(t1Roster.entries[0].monsterId);
    const frailest = Math.min(...PARTY.map((id) => heroById(id).hp));

    expect(
      Math.ceil(frailest / golem.damage),
      'the 스팸 골렘 kills its target before the gauge can reach 한계 — the drama would be ' +
        'a corpse, not a noise turn.',
    ).toBeGreaterThan(HITS_TO_LIMIT);
  });

  it('files the 도배 and 환각 accrual as data refs, not as engine constants (INV-8)', () => {
    const golem = monsterById('spam_golem');
    const spirit = monsterById('hallucination_spirit');
    expect(golem.gaugeOnHitExtraRef).toBe('gauge.spamGolemExtra');
    expect(spirit.gaugeOnAttackRef).toBe('gauge.spiritAttack');
  });
});
