// u11 — TDD-Red for the council vote (PRD §2.6 tie ladder, §2.2 tie-break seam).
//
// The engine presents an authored agenda + closed options, collects ONE stance round and
// then counts. This file owns the counting half only: ballots in, a winner out.
//
//   majority          → the option with the most votes; the tie seam is never touched.
//   tie               → the highest agenda-related stat casts the DECIDING VOTE. Every
//                       voter backing a tied option is graded on the stat their own
//                       option declares (`AgendaOption.relatedStat`), and the top holder's
//                       ballot wins.
//   stat tie          → falls through to the injected `tieBreak` seam. The candidates are
//                       the tied UNITS, indexed by their position in data/heroes.json —
//                       §2.2's `index` policy is "lowest array index in the owning file",
//                       and the party's owning file is heroes.json.
//   nobody voted      → there is no deciding voter to grade, so the seam resolves over the
//                       agenda's own OPTIONS, indexed by their position in council.json.
//
// Every scenario below is built from real data/ content: the 1-1-1 three-option split is
// the authored 수수께끼 골렘 stances, not a fixture.
//
// Test-name contract: the AC gate runs `npx vitest run tests/council/vote.test.ts -t tie`,
// so every tie-owning describe carries the lowercase word "tie".
//
// RED on arrival: src/council/{vote,types}.ts do not exist yet.
import { describe, expect, it } from 'vitest';

import { createTieBreaker } from '../../src/core/tiebreak';
import type { TieBreakPolicy, TieCandidate } from '../../src/core/tiebreak';
import { loadBundledGameData } from '../../src/data/loader';
import type { Agenda } from '../../src/data/schema';

import { resolveVote, tallyBallots } from '../../src/council/vote';
import type { CouncilBallot, CouncilUnit, TieBreaker } from '../../src/council/types';

const { council, heroes } = loadBundledGameData();

const agendaById = (id: string): Agenda => {
  const found = council.agendas.find((agenda) => agenda.id === id);
  if (!found) throw new Error(`data/council.json carries no agenda '${id}'`);
  return found;
};

const RIDDLE = agendaById('riddle_golem');
const MERCHANT = agendaById('fallen_merchant');

const KNOWLEDGE = 'op_riddle_knowledge';
const GOLD = 'op_riddle_gold';
const SHADOW = 'op_riddle_shadow';
const SAVE = 'op_merchant_save';
const PASS = 'op_merchant_pass';

/** A council voter built from the real hero row, carrying its heroes.json position. */
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

const ballot = (unitId: string, optionId: string): CouncilBallot => ({ unitId, optionId });

/** The seam, wrapped so a test can prove it was — or was not — reached. */
function spyTieBreaker(policy: TieBreakPolicy = 'index'): {
  fn: TieBreaker;
  calls: Array<readonly TieCandidate<unknown>[]>;
} {
  const inner = createTieBreaker({ policy });
  const calls: Array<readonly TieCandidate<unknown>[]> = [];
  const fn = <T,>(candidates: readonly TieCandidate<T>[]): T => {
    calls.push(candidates as readonly TieCandidate<unknown>[]);
    return inner(candidates);
  };
  return { fn, calls };
}

const indices = (candidates: readonly TieCandidate<unknown>[]): number[] =>
  candidates.map((candidate) => candidate.index).sort((a, b) => a - b);

describe('council vote — a plain majority never reaches the seam', () => {
  it('backs the option that collected the most stances', () => {
    // The authored 쓰러진 상인 defaults: 가렛 구한다 · 피오나 지나친다 · 셀레네 지나친다.
    const seam = spyTieBreaker();
    const result = resolveVote({
      agenda: MERCHANT,
      units: [unit('garrett'), unit('fiona'), unit('selene')],
      ballots: [ballot('garrett', SAVE), ballot('fiona', PASS), ballot('selene', PASS)],
      tieBreaker: seam.fn,
    });

    expect(result.winningOptionId).toBe(PASS);
    expect(result.tally).toEqual({ [SAVE]: 1, [PASS]: 2 });
    expect(result.decidingUnitId).toBeNull();
    expect(result.usedTieBreak).toBe(false);
    expect(seam.calls, 'a clean majority must not spend a tie-break draw').toHaveLength(0);
  });

  it('counts every authored option, zeros included, in a fresh tally object', () => {
    const seam = spyTieBreaker();
    const tally = tallyBallots(RIDDLE, [ballot('garrett', SHADOW), ballot('fiona', SHADOW)]);

    expect(Object.keys(tally).sort()).toEqual([GOLD, KNOWLEDGE, SHADOW].sort());
    expect(tally).toEqual({ [KNOWLEDGE]: 0, [GOLD]: 0, [SHADOW]: 2 });

    const second = tallyBallots(RIDDLE, []);
    expect(second).not.toBe(tally);
    expect(second).toEqual({ [KNOWLEDGE]: 0, [GOLD]: 0, [SHADOW]: 0 });
    expect(seam.calls).toHaveLength(0);
  });

  it('is pure: neither the ballots nor the units it was handed are mutated', () => {
    const units = [unit('garrett'), unit('fiona'), unit('selene')];
    const ballots = [ballot('garrett', SAVE), ballot('fiona', PASS), ballot('selene', PASS)];
    const unitsBefore = JSON.stringify(units);
    const ballotsBefore = JSON.stringify(ballots);

    resolveVote({ agenda: MERCHANT, units, ballots, tieBreaker: spyTieBreaker().fn });

    expect(JSON.stringify(units)).toBe(unitsBefore);
    expect(JSON.stringify(ballots)).toBe(ballotsBefore);
  });
});

describe('council vote — the tie ladder on a real 1-1-1 split', () => {
  it('lets the highest agenda-related stat cast the deciding vote, no tie seam spent', () => {
    // The authored 수수께끼 골렘 defaults are a genuine three-way split (PRD §2.6):
    //   가렛 그림자(wis 10) · 피오나 지식(int 10) · 셀레네 금화(cha 12).
    const seam = spyTieBreaker();
    const result = resolveVote({
      agenda: RIDDLE,
      units: [unit('garrett'), unit('fiona'), unit('selene')],
      ballots: [ballot('garrett', SHADOW), ballot('fiona', KNOWLEDGE), ballot('selene', GOLD)],
      tieBreaker: seam.fn,
    });

    expect(result.tally).toEqual({ [KNOWLEDGE]: 1, [GOLD]: 1, [SHADOW]: 1 });
    expect(result.winningOptionId).toBe(GOLD);
    expect(result.decidingUnitId).toBe('selene');
    expect(result.usedTieBreak).toBe(false);
    expect(seam.calls, 'a decisive stat needs no tie-break draw').toHaveLength(0);
  });

  it('falls through to the injected tie seam when the deciding stat itself ties', () => {
    // 가렛 그림자(wis 10) · 피오나 지식(int 10) · 모데카이 금화(cha 9): the ladder tops out
    // at 10, shared. Only then is the seam allowed to speak.
    const seam = spyTieBreaker('index');
    const result = resolveVote({
      agenda: RIDDLE,
      units: [unit('garrett'), unit('fiona'), unit('mordecai')],
      ballots: [ballot('garrett', SHADOW), ballot('fiona', KNOWLEDGE), ballot('mordecai', GOLD)],
      tieBreaker: seam.fn,
    });

    expect(seam.calls, 'the stat tie must be resolved by the seam, exactly once').toHaveLength(1);
    // §2.2 `index` = lowest position in the owning data file; the party's file is heroes.json,
    // where 가렛 is row 0 and 피오나 row 1.
    expect(indices(seam.calls[0])).toEqual([0, 1]);
    expect(result.usedTieBreak).toBe(true);
    expect(result.decidingUnitId).toBe('garrett');
    expect(result.winningOptionId).toBe(SHADOW);
  });

  it('grades only the voters whose option is tied for the lead', () => {
    // 지식 2 · 그림자 1: no tie at all, so 셀레네's cha 12 is irrelevant to the outcome.
    const seam = spyTieBreaker();
    const result = resolveVote({
      agenda: RIDDLE,
      units: [unit('garrett'), unit('fiona'), unit('selene')],
      ballots: [ballot('garrett', KNOWLEDGE), ballot('fiona', KNOWLEDGE), ballot('selene', SHADOW)],
      tieBreaker: seam.fn,
    });

    expect(result.winningOptionId).toBe(KNOWLEDGE);
    expect(result.decidingUnitId).toBeNull();
    expect(seam.calls).toHaveLength(0);
  });

  it('breaks an even two-option tie with the top stat holder among the tied voters', () => {
    // 2-2 on 쓰러진 상인: 구한다 → wis (가렛 10, 모데카이 11) · 지나친다 → int (피오나 10,
    // 셀레네 10). 모데카이's wis 11 tops the ladder, so 구한다 carries.
    const seam = spyTieBreaker();
    const result = resolveVote({
      agenda: MERCHANT,
      units: [unit('garrett'), unit('fiona'), unit('selene'), unit('mordecai')],
      ballots: [
        ballot('garrett', SAVE),
        ballot('fiona', PASS),
        ballot('selene', PASS),
        ballot('mordecai', SAVE),
      ],
      tieBreaker: seam.fn,
    });

    expect(result.tally).toEqual({ [SAVE]: 2, [PASS]: 2 });
    expect(result.winningOptionId).toBe(SAVE);
    expect(result.decidingUnitId).toBe('mordecai');
    expect(result.usedTieBreak).toBe(false);
    expect(seam.calls).toHaveLength(0);
  });

  it('resolves over the authored options when every unit abstained, with no deciding voter', () => {
    // Total degradation (INV-7): the vote still produces a winner, silently. There is no
    // voter left to grade, so the seam resolves the OPTIONS in council.json order.
    const seam = spyTieBreaker('index');
    const result = resolveVote({
      agenda: RIDDLE,
      units: [unit('garrett'), unit('fiona'), unit('selene')],
      ballots: [],
      tieBreaker: seam.fn,
    });

    expect(seam.calls).toHaveLength(1);
    expect(indices(seam.calls[0])).toEqual([0, 1, 2]);
    expect(result.winningOptionId).toBe(RIDDLE.options[0].id);
    expect(result.decidingUnitId).toBeNull();
    expect(result.usedTieBreak).toBe(true);
    expect(result.tally).toEqual({ [KNOWLEDGE]: 0, [GOLD]: 0, [SHADOW]: 0 });
  });
});

describe('council vote — malformed input throws instead of guessing', () => {
  const units = () => [unit('garrett'), unit('fiona'), unit('selene')];

  it('rejects a ballot naming an option the agenda does not offer', () => {
    expect(() =>
      resolveVote({
        agenda: MERCHANT,
        units: units(),
        ballots: [ballot('garrett', KNOWLEDGE)],
        tieBreaker: spyTieBreaker().fn,
      }),
    ).toThrow(RangeError);
  });

  it('rejects a ballot from a unit that is not at the table', () => {
    expect(() =>
      resolveVote({
        agenda: MERCHANT,
        units: units(),
        ballots: [ballot('mordecai', SAVE)],
        tieBreaker: spyTieBreaker().fn,
      }),
    ).toThrow(RangeError);
  });

  it('rejects a second ballot from the same unit — one stance round means one vote each', () => {
    expect(() =>
      resolveVote({
        agenda: MERCHANT,
        units: units(),
        ballots: [ballot('garrett', SAVE), ballot('garrett', PASS)],
        tieBreaker: spyTieBreaker().fn,
      }),
    ).toThrow(RangeError);
  });

  it('rejects an empty council', () => {
    expect(() =>
      resolveVote({
        agenda: MERCHANT,
        units: [],
        ballots: [],
        tieBreaker: spyTieBreaker().fn,
      }),
    ).toThrow(RangeError);
  });
});
