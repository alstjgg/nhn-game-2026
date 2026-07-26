// u11 — what a settled vote is worth (PRD §2.5 T3a/T3b).
//
//   퍼즐 정답  → 「거울 방패」   · 오답     → gauge on the WHOLE party, no card
//   선택 구한다 → 「연민」        · 지나친다 → nothing at all
//
// Both are authored as `conditional` grants in data/council.json, and the gauge number is
// a `gaugeAllRef` into data/tuning.json — nothing here carries its own copy (INV-8).
//
// The council RESOLVES the grant and stops: it announces the payout as an event and never
// reaches into the screen that hands out cards.

import { resolveTuningRef } from '../data/loader.ts';
import type { Agenda, Grant, GrantBranch, Tuning } from '../data/schema.ts';

import type { CouncilGrantDetail, CouncilOutcome } from './types.ts';

/** The one name every listener imports — the council never spells it inline twice. */
export const COUNCIL_GRANT_EVENT = 'council:grant';

/** Branch keys a 퍼즐 grant is authored against. */
const CORRECT_BRANCH = 'correct';
const WRONG_BRANCH = 'wrong';

export interface OutcomeInput {
  agenda: Agenda;
  grant: Grant;
  /** The option the vote landed on. */
  optionId: string;
  tuning: Tuning;
}

/**
 * A branch's worth, still expressed the way it was authored: a gauge hit is a REF, and no
 * gauge hit at all is the absence of one. Nothing in this file ever names a gauge number,
 * so `data/tuning.json` stays its only home (INV-8).
 */
interface Payout {
  cardId: string | null;
  gaugeAllRef: string | null;
}

const NOTHING: Payout = { cardId: null, gaugeAllRef: null };

/** What an unreferenced gauge is worth — an absence, not a tunable. */
const UNCHANGED = 0;

function payoutOf(branch: GrantBranch): Payout {
  return {
    cardId: branch.cardId ?? null,
    gaugeAllRef: branch.gaugeAllRef ?? null,
  };
}

function resolvePayout(input: OutcomeInput, correct: boolean | null): Payout {
  const { agenda, grant, optionId } = input;
  switch (grant.kind) {
    case 'none':
      return NOTHING;
    case 'fixed':
      return { cardId: grant.cardId, gaugeAllRef: null };
    case 'draft':
      // The 3택1 fan-out is the 훈련장 screen's job; the council would have to invent a
      // choice it is explicitly forbidden to offer.
      throw new TypeError(
        `agenda '${agenda.id}': the council cannot resolve a draft grant — it offers no picks`,
      );
    case 'conditional': {
      if (grant.on !== agenda.id) {
        throw new RangeError(
          `grant is wired to agenda '${grant.on}', not '${agenda.id}' — refusing to guess`,
        );
      }
      const key = correct === null ? optionId : correct ? CORRECT_BRANCH : WRONG_BRANCH;
      const branch = Object.hasOwn(grant.branches, key) ? grant.branches[key] : undefined;
      return branch === undefined ? NOTHING : payoutOf(branch);
    }
    default: {
      throw new TypeError(`unsupported grant for agenda '${agenda.id}': ${JSON.stringify(grant)}`);
    }
  }
}

/**
 * Turns a winning option into the payout PRD §2.5 authored for it.
 *
 * @throws RangeError on an option the agenda never offered, or a conditional grant wired
 *         to a different agenda.
 * @throws TypeError  on a grant shape the council does not resolve (a draft).
 */
export function resolveOutcome(input: OutcomeInput): CouncilOutcome {
  const { agenda, optionId, tuning } = input;
  if (!agenda.options.some((option) => option.id === optionId)) {
    throw new RangeError(`agenda '${agenda.id}' offers no option '${optionId}' to reward`);
  }
  // 선택이벤트 authors no answer, so there is no correctness to report at all.
  const correct = agenda.answerOptionId === null ? null : optionId === agenda.answerOptionId;
  const payout = resolvePayout(input, correct);
  return {
    agendaId: agenda.id,
    optionId,
    correct,
    cardId: payout.cardId,
    gaugeAll:
      payout.gaugeAllRef === null ? UNCHANGED : resolveTuningRef(tuning, payout.gaugeAllRef),
  };
}

/**
 * The payout as it leaves the screen. The detail is a SNAPSHOT: a later mutation of the
 * outcome object cannot rewrite what a listener already received.
 */
export function createGrantEvent(outcome: CouncilOutcome): CustomEvent<CouncilGrantDetail> {
  const detail: CouncilGrantDetail = {
    agendaId: outcome.agendaId,
    optionId: outcome.optionId,
    correct: outcome.correct,
    cardId: outcome.cardId,
    gaugeAll: outcome.gaugeAll,
  };
  return new CustomEvent<CouncilGrantDetail>(COUNCIL_GRANT_EVENT, { detail, bubbles: true });
}
