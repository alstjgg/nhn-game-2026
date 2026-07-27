// u11 — counting the council (PRD §2.6 tie ladder, §2.2 tie-break seam).
//
// Ballots in, a winner out. The ladder has exactly three rungs and never guesses:
//
//   1. majority   — one option leads outright; the seam is not touched.
//   2. deciding vote — on a tie, every voter backing a TIED option is graded on the stat
//      that voter's own option declares (`AgendaOption.relatedStat`), and the top holder's
//      ballot carries.
//   3. the seam   — only when the deciding stat itself ties. Candidates are the tied UNITS,
//      indexed by their row in data/heroes.json. With nobody left to grade (a total
//      abstention) the seam resolves the agenda's OPTIONS in council.json order instead.
//
// Pure: neither the ballots nor the units handed in are ever mutated.

import { toCandidates } from '../core/tiebreak.ts';
import type { Agenda } from '../data/schema.ts';

import type { CouncilBallot, CouncilUnit, CouncilVote, TieBreaker } from './types.ts';

export interface VoteInput {
  agenda: Agenda;
  units: readonly CouncilUnit[];
  ballots: readonly CouncilBallot[];
  tieBreaker: TieBreaker;
}

/** A voter whose option is tied for the lead, already graded on that option's stat. */
interface Contender {
  unit: CouncilUnit;
  optionId: string;
  score: number;
}

/**
 * A fresh tally over the agenda's CLOSED option list — every authored option is present,
 * zeros included, so a reader never has to know which ids were possible.
 *
 * @throws RangeError on a ballot naming an option the agenda does not offer.
 */
export function tallyBallots(
  agenda: Agenda,
  ballots: readonly CouncilBallot[],
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const option of agenda.options) {
    tally[option.id] = 0;
  }
  for (const ballot of ballots) {
    if (!Object.hasOwn(tally, ballot.optionId)) {
      throw new RangeError(
        `agenda '${agenda.id}' offers no option '${ballot.optionId}' to vote for`,
      );
    }
    tally[ballot.optionId] += 1;
  }
  return tally;
}

function assertWellFormed(input: VoteInput): Map<string, CouncilUnit> {
  const { agenda, units, ballots } = input;
  if (agenda.options.length === 0) {
    throw new RangeError(`agenda '${agenda.id}' authored no options to vote on`);
  }
  if (units.length === 0) {
    throw new RangeError(`agenda '${agenda.id}': an empty council cannot hold a vote`);
  }
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const cast = new Set<string>();
  for (const ballot of ballots) {
    if (!byId.has(ballot.unitId)) {
      throw new RangeError(`'${ballot.unitId}' is not at the table for agenda '${agenda.id}'`);
    }
    if (cast.has(ballot.unitId)) {
      throw new RangeError(`'${ballot.unitId}' voted twice — one stance round means one vote`);
    }
    cast.add(ballot.unitId);
  }
  return byId;
}

/** The voters backing a tied option, each graded on the stat their own option declares. */
function gradeContenders(
  agenda: Agenda,
  byId: ReadonlyMap<string, CouncilUnit>,
  ballots: readonly CouncilBallot[],
  leaderIds: ReadonlySet<string>,
): Contender[] {
  const statOf = new Map(agenda.options.map((option) => [option.id, option.relatedStat]));
  const contenders: Contender[] = [];
  for (const ballot of ballots) {
    if (!leaderIds.has(ballot.optionId)) continue;
    const unit = byId.get(ballot.unitId);
    const stat = statOf.get(ballot.optionId);
    if (unit === undefined || stat === undefined) continue;
    contenders.push({ unit, optionId: ballot.optionId, score: unit.stats[stat] });
  }
  return contenders;
}

/**
 * Settles one agenda.
 *
 * @throws RangeError on an empty council, an unknown voter, a double ballot or an option
 *         the agenda never offered — a malformed vote is a bug, not a degraded path.
 */
export function resolveVote(input: VoteInput): CouncilVote {
  const { agenda, ballots, tieBreaker } = input;
  const byId = assertWellFormed(input);
  const tally = tallyBallots(agenda, ballots);

  const top = Math.max(...agenda.options.map((option) => tally[option.id]));
  const leaders = agenda.options.filter((option) => tally[option.id] === top);
  if (leaders.length === 1) {
    return {
      tally,
      winningOptionId: leaders[0].id,
      decidingUnitId: null,
      usedTieBreak: false,
    };
  }

  const leaderIds = new Set(leaders.map((option) => option.id));
  const contenders = gradeContenders(agenda, byId, ballots, leaderIds);

  // Nobody voted at all (INV-7): there is no deciding voter to grade, so the seam
  // resolves the authored options themselves.
  if (contenders.length === 0) {
    const winner = tieBreaker(toCandidates(agenda.options, (option) => leaderIds.has(option.id)));
    return { tally, winningOptionId: winner.id, decidingUnitId: null, usedTieBreak: true };
  }

  const best = Math.max(...contenders.map((contender) => contender.score));
  const holders = contenders.filter((contender) => contender.score === best);
  if (holders.length === 1) {
    return {
      tally,
      winningOptionId: holders[0].optionId,
      decidingUnitId: holders[0].unit.id,
      usedTieBreak: false,
    };
  }

  const winner = tieBreaker(
    holders.map((contender) => ({ value: contender, index: contender.unit.index })),
  );
  return {
    tally,
    winningOptionId: winner.optionId,
    decidingUnitId: winner.unit.id,
    usedTieBreak: true,
  };
}
