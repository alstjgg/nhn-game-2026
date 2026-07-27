// u11 — the council round (PRD §2.6). ONE stance round, then a vote. That is the whole
// flow, and its shortness is the point:
//
//   authored agenda + CLOSED options
//     → the hint, if the party carries a council-hint card (revealed BEFORE anyone speaks)
//     → one `/ai/stance` call per unit, ALL in flight together — no round 2, no re-ask,
//       no player intervention seam to reach for
//     → majority, then the §2.6 tie ladder
//     → the authored payout
//
// Degradation is silent (INV-7): a missing answer, a rejected call or an answer outside
// the closed option list all become an abstention with the "…" line, cited to that unit's
// own default prompt. Nothing is logged and nothing on screen says a thing went wrong.

import type { AIAdapter } from '../ai/adapter.ts';
import type { Stance, StanceOption, StanceRequest, ValidationCtx } from '../ai/contract.ts';
import { ELLIPSIS_SAY } from '../ai/stub.ts';
import type { Agenda, Card, Grant, Tuning } from '../data/schema.ts';

import { revealHint } from './hint.ts';
import { resolveOutcome } from './outcome.ts';
import type {
  CouncilBallot,
  CouncilHint,
  CouncilRound,
  CouncilStance,
  CouncilUnit,
  TieBreaker,
} from './types.ts';
import { resolveVote } from './vote.ts';

export interface CouncilRoundInput {
  agenda: Agenda;
  units: readonly CouncilUnit[];
  cards: readonly Card[];
  adapter: AIAdapter;
  tieBreaker: TieBreaker;
  /** The tile's authored reward (PRD §2.5). */
  grant: Grant;
  tuning: Tuning;
}

function buildRequest(
  unit: CouncilUnit,
  agenda: Agenda,
  options: readonly StanceOption[],
  hint: CouncilHint | null,
): StanceRequest {
  const request: StanceRequest = {
    unitId: unit.id,
    equippedCardIds: [...unit.equippedCardIds],
    agendaId: agenda.id,
    options: [...options],
  };
  // Absent, not null: a party that never picked up the lens sends no hint id at all.
  return hint === null ? request : { ...request, hintId: hint.cardId };
}

/** One unit's ask. Never throws: a rejected call is just a missing answer. */
async function askStance(
  adapter: AIAdapter,
  request: StanceRequest,
  ctx: ValidationCtx,
): Promise<Stance | null> {
  try {
    return await adapter.stance(request, ctx);
  } catch {
    return null;
  }
}

function toStance(
  unit: CouncilUnit,
  answer: Stance | null,
  optionIds: readonly string[],
): CouncilStance {
  if (answer !== null && optionIds.includes(answer.action) && answer.because.length > 0) {
    return {
      unitId: unit.id,
      optionId: answer.action,
      say: answer.say,
      because: [...answer.because],
    };
  }
  return {
    unitId: unit.id,
    optionId: null,
    say: ELLIPSIS_SAY,
    because: [unit.defaultPromptId],
  };
}

/**
 * Runs the tile once. Every call is issued before any is awaited, so the round costs one
 * latency window and a unit that fails degrades its own bubble only.
 */
export async function runCouncil(input: CouncilRoundInput): Promise<CouncilRound> {
  const { agenda, units, cards, adapter, tieBreaker, grant, tuning } = input;

  const hint = revealHint(agenda, units, cards);
  const options: StanceOption[] = agenda.options.map((option) => ({
    id: option.id,
    label: option.text,
  }));
  const optionIds = options.map((option) => option.id);

  const answers = await Promise.all(
    units.map((unit) =>
      askStance(adapter, buildRequest(unit, agenda, options, hint), {
        sheetIds: unit.sheetIds,
        actionIds: optionIds,
      }),
    ),
  );

  const stances = units.map((unit, position) => toStance(unit, answers[position], optionIds));
  const ballots: CouncilBallot[] = [];
  for (const stance of stances) {
    if (stance.optionId !== null) ballots.push({ unitId: stance.unitId, optionId: stance.optionId });
  }

  const vote = resolveVote({ agenda, units, ballots, tieBreaker });
  const outcome = resolveOutcome({ agenda, grant, optionId: vote.winningOptionId, tuning });
  return { hint, stances, vote, outcome };
}
