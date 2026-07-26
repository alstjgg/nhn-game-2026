// u11 — TDD-Red for the council engine: ONE stance round, then a vote (PRD §2.6).
//
// The flow is frozen and deliberately short: authored agenda + closed options → one
// parallel stance round through the adapter → majority → outcome. There is no second
// round, no re-ask, no player intervention — watching the party's values decide is the
// tile's whole point.
//
// This file covers the round itself:
//   · the pool  — data/decisions.json's council entries as `lookupStance` reads them
//   · the hint  — 「번역 렌즈」 on ANY unit reveals the authored line BEFORE the vote,
//                 discovered through the card's `engineHook.kind === 'council_hint'`
//                 rather than a hardcoded card id (INV-8)
//   · the round — one call per unit, all in flight at once, never a second wave
//   · silence   — a missing or out-of-enum answer is an abstention, not an error (INV-7)
//   · the real authored content, end to end, through the real stub adapter
//
// RED on arrival: src/council/{pool,hint,engine,types}.ts do not exist yet.
import { describe, expect, it, vi } from 'vitest';

import decisionsRaw from '../../data/decisions.json';
import { DEFAULT_KEY, lookupStance } from '../../src/ai/bucket';
import type { BucketConfig } from '../../src/ai/bucket';
import type { AIAdapter } from '../../src/ai/adapter';
import type { Stance, StanceRequest, ValidationCtx } from '../../src/ai/contract';
import { ELLIPSIS_SAY, createStubAdapter } from '../../src/ai/stub';
import { createTieBreaker } from '../../src/core/tiebreak';
import { loadBundledGameData, resolveTuningRef } from '../../src/data/loader';
import type { Agenda, Card, Grant } from '../../src/data/schema';

import { runCouncil } from '../../src/council/engine';
import { revealHint } from '../../src/council/hint';
import { buildStancePool } from '../../src/council/pool';
import type { CouncilStanceEntry, CouncilUnit } from '../../src/council/types';

const { cards, council, heroes, tuning } = loadBundledGameData();

const COUNCIL_ENTRIES = decisionsRaw.council as unknown as CouncilStanceEntry[];

/** The council never computes a situation bucket; the stub still wants a shape-valid one. */
const BUCKET_CONFIG: BucketConfig = {
  openingTurn: 1,
  hurtBelowRatio: 0.5,
  enemyLowBelowRatio: 0.3,
};

const agendaById = (id: string): Agenda => {
  const found = council.agendas.find((agenda) => agenda.id === id);
  if (!found) throw new Error(`data/council.json carries no agenda '${id}'`);
  return found;
};

const grantFor = (tileId: string): Grant => {
  const found = council.rewards[tileId];
  if (!found) throw new Error(`data/council.json carries no reward for tile '${tileId}'`);
  return found;
};

const RIDDLE = agendaById('riddle_golem');
const MERCHANT = agendaById('fallen_merchant');

const KNOWLEDGE = 'op_riddle_knowledge';
const GOLD = 'op_riddle_gold';
const SAVE = 'op_merchant_save';
const PASS = 'op_merchant_pass';
const LENS = 'translation_lens';
const GAMBLER = 'gambler';

/** Whatever a degraded path prints, none of it may be this (INV-7). */
const NOISE = /경고|오류|실패|없습니다|warn|error|fail/i;

function unit(id: string, equippedCardIds: readonly string[] = []): CouncilUnit {
  const index = heroes.findIndex((hero) => hero.id === id);
  const hero = heroes[index];
  if (!hero) throw new Error(`data/heroes.json carries no hero '${id}'`);
  return {
    id: hero.id,
    name: hero.name,
    index,
    stats: hero.stats,
    defaultPromptId: hero.defaultPrompt.id,
    equippedCardIds: [...equippedCardIds],
    sheetIds: [hero.defaultPrompt.id, hero.baseSkill.id, ...equippedCardIds],
  };
}

const PARTY = ['garrett', 'fiona', 'selene'] as const;
const party = (equips: Record<string, string[]> = {}): CouncilUnit[] =>
  PARTY.map((id) => unit(id, equips[id] ?? []));

/** The shipped stub adapter, wired to the authored council pool at zero latency. */
const realAdapter = (): AIAdapter =>
  createStubAdapter({
    pool: buildStancePool(COUNCIL_ENTRIES),
    latencyMs: resolveTuningRef(tuning, 'latency.unit'),
    timeoutMs: resolveTuningRef(tuning, 'timeout.stub'),
    bucketConfig: BUCKET_CONFIG,
  });

const gates = () => createTieBreaker({ policy: tuning.tieBreak.test });

/** An adapter whose answers stay in flight until the test lets them go. */
function gatedAdapter(answer: (req: StanceRequest) => Stance | null): {
  adapter: AIAdapter;
  seen: Array<{ req: StanceRequest; ctx?: ValidationCtx }>;
  releaseAll: () => void;
} {
  const seen: Array<{ req: StanceRequest; ctx?: ValidationCtx }> = [];
  const pending: Array<() => void> = [];
  const adapter: AIAdapter = {
    mode: 'stub',
    decide: async (): Promise<never> => {
      throw new Error('the council never calls decide');
    },
    stance: (req: StanceRequest, ctx?: ValidationCtx) => {
      seen.push({ req, ctx });
      return new Promise<Stance | null>((resolve) => {
        pending.push(() => resolve(answer(req)));
      });
    },
  };
  return { adapter, seen, releaseAll: () => pending.splice(0).forEach((release) => release()) };
}

const flush = (): Promise<void> => new Promise<void>((resolve) => setImmediate(resolve));

const backsFirstOption = (req: StanceRequest): Stance => ({
  action: req.options[0].id,
  say: `${req.unitId} 는 첫 안을 민다.`,
  because: [`${req.unitId}.default`],
});

describe('council stance pool — data/decisions.json as the adapter reads it', () => {
  it('nests every authored council entry under unit → agenda → card', () => {
    const pool = buildStancePool(COUNCIL_ENTRIES);
    const selene = pool.stances?.selene;
    expect(selene, 'the authored 셀레네 stances must survive the nesting').toBeTruthy();
    expect(Object.keys(selene?.fallen_merchant ?? {}).sort()).toEqual([DEFAULT_KEY, GAMBLER].sort());
  });

  it('builds only the council half — combat answers are another unit s pool', () => {
    expect(buildStancePool(COUNCIL_ENTRIES).decisions).toEqual({});
  });

  it('resolves the card tier ahead of the unit default for 셀레네+「승부사」', () => {
    const pool = buildStancePool(COUNCIL_ENTRIES);
    expect(lookupStance(pool, 'selene', 'fallen_merchant', [])?.value.action).toBe(PASS);
    const flipped = lookupStance(pool, 'selene', 'fallen_merchant', [GAMBLER]);
    expect(flipped?.value.action).toBe(SAVE);
    expect(flipped?.tier).toBe('card');
  });

  it('reports a miss instead of throwing for a unit or agenda nobody authored', () => {
    const pool = buildStancePool(COUNCIL_ENTRIES);
    expect(lookupStance(pool, 'mordecai', 'riddle_golem', [])).toBeNull();
    expect(lookupStance(pool, 'garrett', 'no_such_agenda', [])).toBeNull();
  });
});

describe('번역 렌즈 hint — revealed off the card hook, not a hardcoded id', () => {
  it('reveals the authored line when the lens sits on ANY unit, including the last', () => {
    const reveal = revealHint(RIDDLE, party({ selene: [LENS] }), cards);
    expect(reveal).not.toBeNull();
    expect(reveal?.line).toBe(RIDDLE.hintLine);
    expect(reveal?.cardId).toBe(LENS);
    expect(reveal?.unitId).toBe('selene');
  });

  it('reveals nothing when no unit carries a council-hint card', () => {
    expect(revealHint(RIDDLE, party(), cards)).toBeNull();
    expect(revealHint(RIDDLE, party({ garrett: ['mirror_shield'] }), cards)).toBeNull();
  });

  it('reveals nothing on an agenda that authored no hint line', () => {
    expect(MERCHANT.hintLine).toBeNull();
    expect(revealHint(MERCHANT, party({ garrett: [LENS] }), cards)).toBeNull();
  });

  it('keys off engineHook.kind, so any future council-hint card works unchanged', () => {
    const invented: Card = {
      id: 'oracle_slate',
      name: '신탁 석판',
      type: 'mcp',
      slotKind: 'mcp',
      text: '한 줄을 읽어낸다.',
      engineHook: { kind: 'council_hint', actionId: 'reveal_hint' },
    };
    const reveal = revealHint(RIDDLE, party({ fiona: [invented.id] }), [...cards, invented]);
    expect(reveal?.cardId).toBe('oracle_slate');
    expect(reveal?.line).toBe(RIDDLE.hintLine);
  });
});

describe('one stance round — no round 2, no re-ask', () => {
  it('fires exactly one call per unit, all in flight together, and never opens a second wave', async () => {
    const { adapter, seen, releaseAll } = gatedAdapter(backsFirstOption);
    const pending = runCouncil({
      agenda: RIDDLE,
      units: party(),
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });

    await flush();
    expect(seen, 'every unit must be asked before any answer lands').toHaveLength(PARTY.length);
    expect(seen.map((call) => call.req.unitId)).toEqual([...PARTY]);

    releaseAll();
    const round = await pending;

    expect(seen, 'the round is one wave; nobody is asked twice').toHaveLength(PARTY.length);
    expect(round.stances).toHaveLength(PARTY.length);
    expect(round.stances.map((stance) => stance.unitId)).toEqual([...PARTY]);
  });

  it('asks with the agenda id, that unit s equipped cards and the closed option list', async () => {
    const { adapter, seen, releaseAll } = gatedAdapter(backsFirstOption);
    const pending = runCouncil({
      agenda: RIDDLE,
      units: party({ selene: [GAMBLER] }),
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });
    await flush();
    releaseAll();
    await pending;

    for (const { req } of seen) {
      expect(req.agendaId).toBe('riddle_golem');
      expect(req.options.map((option) => option.id)).toEqual(
        RIDDLE.options.map((option) => option.id),
      );
      expect(req.options.map((option) => option.label)).toEqual(
        RIDDLE.options.map((option) => option.text),
      );
    }
    const selene = seen.find((call) => call.req.unitId === 'selene');
    expect(selene?.req.equippedCardIds).toEqual([GAMBLER]);
  });

  it('forwards each unit s sheet ids so every displayed line stays attributable', async () => {
    const units = party({ selene: [GAMBLER] });
    const { adapter, seen, releaseAll } = gatedAdapter(backsFirstOption);
    const pending = runCouncil({
      agenda: RIDDLE,
      units,
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });
    await flush();
    releaseAll();
    await pending;

    for (const member of units) {
      const call = seen.find((entry) => entry.req.unitId === member.id);
      expect(call?.ctx?.sheetIds, member.id).toEqual(expect.arrayContaining([...member.sheetIds]));
    }
  });

  it('hands the revealed hint to the round and to every request, before any vote is counted', async () => {
    const { adapter, seen, releaseAll } = gatedAdapter(backsFirstOption);
    const pending = runCouncil({
      agenda: RIDDLE,
      units: party({ garrett: [LENS] }),
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });

    await flush();
    expect(seen.every((call) => call.req.hintId === LENS)).toBe(true);

    releaseAll();
    const round = await pending;
    expect(round.hint?.line).toBe(RIDDLE.hintLine);
  });

  it('sends no hint id at all when the party never picked up the lens', async () => {
    const { adapter, seen, releaseAll } = gatedAdapter(backsFirstOption);
    const pending = runCouncil({
      agenda: RIDDLE,
      units: party(),
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });
    await flush();
    releaseAll();
    const round = await pending;

    expect(seen.every((call) => call.req.hintId === undefined)).toBe(true);
    expect(round.hint).toBeNull();
  });
});

describe('council degradation stays silent', () => {
  it('turns a missing answer into an abstention with the ellipsis line', async () => {
    const { adapter, releaseAll } = gatedAdapter((req) =>
      req.unitId === 'fiona' ? null : backsFirstOption(req),
    );
    const pending = runCouncil({
      agenda: RIDDLE,
      units: party(),
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });
    await flush();
    releaseAll();
    const round = await pending;

    const fiona = round.stances.find((stance) => stance.unitId === 'fiona');
    expect(fiona?.optionId, 'an abstention casts no ballot').toBeNull();
    expect(fiona?.say).toBe(ELLIPSIS_SAY);
    expect(fiona?.because).toEqual(['fiona.default']);
    expect(round.vote.tally[KNOWLEDGE]).toBe(PARTY.length - 1);
  });

  it('treats an answer outside the closed option list as an abstention', async () => {
    const { adapter, releaseAll } = gatedAdapter((req) =>
      req.unitId === 'selene'
        ? { action: 'op_not_on_this_agenda', say: '음.', because: ['selene.default'] }
        : backsFirstOption(req),
    );
    const pending = runCouncil({
      agenda: RIDDLE,
      units: party(),
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });
    await flush();
    releaseAll();
    const round = await pending;

    expect(round.stances.find((stance) => stance.unitId === 'selene')?.optionId).toBeNull();
    expect(round.vote.winningOptionId).toBe(KNOWLEDGE);
  });

  it('says nothing about the failure — no error text, no console noise', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { adapter, releaseAll } = gatedAdapter(() => null);
    const pending = runCouncil({
      agenda: RIDDLE,
      units: party(),
      cards,
      adapter,
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });
    await flush();
    releaseAll();
    const round = await pending;

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    for (const stance of round.stances) {
      expect(NOISE.test(stance.say), stance.say).toBe(false);
    }
    // Even a total blackout still produces a decision: the tie seam resolves the options.
    expect(round.vote.usedTieBreak).toBe(true);
    expect(round.outcome.optionId).toBe(RIDDLE.options[0].id);
  });
});

describe('the authored content, end to end through the shipped stub', () => {
  it('runs the real 1-1-1 퍼즐 split into a wrong answer and the party-wide gauge hit', async () => {
    const round = await runCouncil({
      agenda: RIDDLE,
      units: party(),
      cards,
      adapter: realAdapter(),
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });

    expect(round.vote.tally).toEqual({ [KNOWLEDGE]: 1, [GOLD]: 1, op_riddle_shadow: 1 });
    expect(round.vote.winningOptionId, '셀레네 cha 12 tops the ladder').toBe(GOLD);
    expect(round.vote.decidingUnitId).toBe('selene');
    expect(round.outcome.correct).toBe(false);
    expect(round.outcome.cardId).toBeNull();
    expect(round.outcome.gaugeAll).toBe(resolveTuningRef(tuning, 'gauge.puzzleWrong'));
  });

  it('passes the merchant by default, granting nothing', async () => {
    const round = await runCouncil({
      agenda: MERCHANT,
      units: party(),
      cards,
      adapter: realAdapter(),
      tieBreaker: gates(),
      grant: grantFor('t3b'),
      tuning,
    });

    expect(round.vote.winningOptionId).toBe(PASS);
    expect(round.outcome.cardId).toBeNull();
    expect(round.outcome.gaugeAll).toBe(0);
  });

  it('flips the merchant to 구한다 — and to 「연민」 — once 셀레네 carries 「승부사」', async () => {
    const round = await runCouncil({
      agenda: MERCHANT,
      units: party({ selene: [GAMBLER] }),
      cards,
      adapter: realAdapter(),
      tieBreaker: gates(),
      grant: grantFor('t3b'),
      tuning,
    });

    expect(round.stances.find((stance) => stance.unitId === 'selene')?.optionId).toBe(SAVE);
    expect(round.vote.winningOptionId).toBe(SAVE);
    expect(round.vote.decidingUnitId).toBeNull();
    expect(round.outcome.cardId).toBe('compassion');
  });

  it('reveals the puzzle hint for a party that took 「번역 렌즈」 at T2', async () => {
    const round = await runCouncil({
      agenda: RIDDLE,
      units: party({ fiona: [LENS] }),
      cards,
      adapter: realAdapter(),
      tieBreaker: gates(),
      grant: grantFor('t3a'),
      tuning,
    });

    expect(round.hint?.line).toBe(RIDDLE.hintLine);
    expect(round.hint?.cardId).toBe(LENS);
  });
});
