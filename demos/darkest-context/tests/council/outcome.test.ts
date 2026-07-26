// u11 — TDD-Red for the council outcome: what a settled vote is worth (PRD §2.5 T3a/T3b).
//
//   퍼즐 정답  → 「거울 방패」            · 오답     → gauge +15 on the WHOLE party, no card
//   선택 구한다 → 「연민」                 · 지나친다 → nothing at all
//
// Both rewards are authored in `data/council.json` as conditional grants, and the gauge
// number is a `gaugeAllRef` into `data/tuning.json` — no number is written here (INV-8).
//
// The screen hands the result on as an EVENT and stops there: the draft/grant UI belongs
// to u12. That contract is a DOM-free value here (the event name + its detail), so the
// council never has to reach into another unit's screen to pay out.
//
// RED on arrival: src/council/outcome.ts does not exist yet.
import { describe, expect, it } from 'vitest';

import { loadBundledGameData, resolveTuningRef } from '../../src/data/loader';
import type { Agenda, Grant } from '../../src/data/schema';

import { COUNCIL_GRANT_EVENT, createGrantEvent, resolveOutcome } from '../../src/council/outcome';
import type { CouncilGrantDetail, CouncilOutcome } from '../../src/council/types';

const { council, tuning } = loadBundledGameData();

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
const PUZZLE_GRANT = grantFor('t3a');
const CHOICE_GRANT = grantFor('t3b');

const KNOWLEDGE = 'op_riddle_knowledge';
const GOLD = 'op_riddle_gold';
const SHADOW = 'op_riddle_shadow';
const SAVE = 'op_merchant_save';
const PASS = 'op_merchant_pass';

const PUZZLE_WRONG_GAUGE = resolveTuningRef(tuning, 'gauge.puzzleWrong');

const outcomeOf = (agenda: Agenda, grant: Grant, optionId: string): CouncilOutcome =>
  resolveOutcome({ agenda, grant, optionId, tuning });

describe('퍼즐 outcome — T3a', () => {
  it('grants 「거울 방패」 and touches no gauge when the vote lands on the authored answer', () => {
    expect(RIDDLE.answerOptionId, 'the puzzle must ship an authored answer').toBe(KNOWLEDGE);
    const outcome = outcomeOf(RIDDLE, PUZZLE_GRANT, KNOWLEDGE);

    expect(outcome).toEqual({
      agendaId: 'riddle_golem',
      optionId: KNOWLEDGE,
      correct: true,
      cardId: 'mirror_shield',
      gaugeAll: 0,
    });
  });

  it('grants no card and adds the authored gauge to the whole party on a wrong answer', () => {
    for (const optionId of [GOLD, SHADOW]) {
      const outcome = outcomeOf(RIDDLE, PUZZLE_GRANT, optionId);
      expect(outcome.correct, optionId).toBe(false);
      expect(outcome.cardId, optionId).toBeNull();
      expect(outcome.gaugeAll, optionId).toBe(PUZZLE_WRONG_GAUGE);
    }
  });

  it('reads the gauge number out of tuning.json rather than carrying its own copy', () => {
    // The ref is authored on the grant; nothing in src/ may hardcode 15 (INV-8).
    expect(PUZZLE_WRONG_GAUGE).toBeGreaterThan(0);
    expect(outcomeOf(RIDDLE, PUZZLE_GRANT, GOLD).gaugeAll).toBe(
      resolveTuningRef(tuning, 'gauge.puzzleWrong'),
    );
  });
});

describe('선택이벤트 outcome — T3b', () => {
  it('grants 「연민」 when the council decides 구한다', () => {
    expect(outcomeOf(MERCHANT, CHOICE_GRANT, SAVE)).toEqual({
      agendaId: 'fallen_merchant',
      optionId: SAVE,
      correct: null,
      cardId: 'compassion',
      gaugeAll: 0,
    });
  });

  it('grants nothing — no card, no gauge — when the council decides 지나친다', () => {
    expect(outcomeOf(MERCHANT, CHOICE_GRANT, PASS)).toEqual({
      agendaId: 'fallen_merchant',
      optionId: PASS,
      correct: null,
      cardId: null,
      gaugeAll: 0,
    });
  });

  it('reports no correctness for an agenda that authored no answer', () => {
    expect(MERCHANT.answerOptionId).toBeNull();
    expect(outcomeOf(MERCHANT, CHOICE_GRANT, SAVE).correct).toBeNull();
  });
});

describe('outcome — grant shapes the council does not resolve itself', () => {
  it('passes a fixed grant straight through', () => {
    const outcome = outcomeOf(MERCHANT, grantFor('t1'), SAVE);
    expect(outcome.cardId).toBe('taunt');
    expect(outcome.gaugeAll).toBe(0);
  });

  it('yields nothing for an explicit `none` grant', () => {
    const outcome = outcomeOf(MERCHANT, { kind: 'none' }, PASS);
    expect(outcome.cardId).toBeNull();
    expect(outcome.gaugeAll).toBe(0);
  });

  it('refuses a draft grant — the 3택1 fan-out is u12 territory, not the council', () => {
    expect(() => outcomeOf(MERCHANT, grantFor('t2'), SAVE)).toThrow(TypeError);
  });

  it('refuses a conditional grant wired to a different agenda', () => {
    expect(() => outcomeOf(MERCHANT, PUZZLE_GRANT, SAVE)).toThrow();
  });

  it('refuses a winning option the agenda never offered', () => {
    expect(() => outcomeOf(MERCHANT, CHOICE_GRANT, KNOWLEDGE)).toThrow(RangeError);
  });
});

describe('outcome — the grant leaves the screen as an event', () => {
  const outcome = (): CouncilOutcome => outcomeOf(RIDDLE, PUZZLE_GRANT, KNOWLEDGE);

  it('names the event once, as a constant every listener can import', () => {
    expect(COUNCIL_GRANT_EVENT).toBe('council:grant');
  });

  it('carries the whole outcome as the event detail', () => {
    const event = createGrantEvent(outcome());
    expect(event.type).toBe(COUNCIL_GRANT_EVENT);
    expect(event.bubbles, 'a parent screen must be able to catch it').toBe(true);

    const detail: CouncilGrantDetail = event.detail;
    expect(detail).toEqual({
      agendaId: 'riddle_golem',
      optionId: KNOWLEDGE,
      correct: true,
      cardId: 'mirror_shield',
      gaugeAll: 0,
    });
  });

  it('snapshots the detail so a later mutation of the outcome cannot rewrite it', () => {
    const settled = outcome();
    const event = createGrantEvent(settled);
    (settled as { cardId: string | null }).cardId = 'flame_scroll';
    expect(event.detail.cardId).toBe('mirror_shield');
  });

  it('dispatches on a plain EventTarget — no DOM required to observe the grant', () => {
    const target = new EventTarget();
    const seen: CouncilGrantDetail[] = [];
    target.addEventListener(COUNCIL_GRANT_EVENT, (event) => {
      seen.push((event as CustomEvent<CouncilGrantDetail>).detail);
    });

    target.dispatchEvent(createGrantEvent(outcomeOf(RIDDLE, PUZZLE_GRANT, GOLD)));

    expect(seen).toHaveLength(1);
    expect(seen[0].cardId).toBeNull();
    expect(seen[0].gaugeAll).toBe(PUZZLE_WRONG_GAUGE);
  });
});
