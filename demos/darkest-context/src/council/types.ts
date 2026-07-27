// u11 — the council's own vocabulary (PRD §2.6).
//
// The tile is deliberately short: an authored agenda + a CLOSED option list, ONE parallel
// stance round, a majority count, and a tie ladder that ends at the §2.2 seam. Nothing
// here knows about the DOM — the screen composes these values, and the payout leaves as
// an event so the draft UI never has to be reached into.

import type { Stance } from '../ai/contract.ts';
import type { TieCandidate } from '../core/tiebreak.ts';
import type { Stats } from '../data/schema.ts';

/**
 * One voter at the table. `index` is its row in `data/heroes.json` — the owning file
 * for the party, and therefore the key the `index` tie-break policy reads (PRD §2.2).
 */
export interface CouncilUnit {
  id: string;
  name: string;
  index: number;
  stats: Stats;
  /** Cited when this unit abstains, so even a silent bubble stays attributable (INV-3). */
  defaultPromptId: string;
  equippedCardIds: readonly string[];
  /** Everything this unit's answer may cite: default prompt + base skill + equipped cards. */
  sheetIds: readonly string[];
}

/** One cast vote. An abstention produces no ballot at all. */
export interface CouncilBallot {
  unitId: string;
  optionId: string;
}

/** The §2.2 tie-break seam as the council consumes it: candidates in, one winner out. */
export interface TieBreaker {
  <T>(candidates: readonly TieCandidate<T>[]): T;
}

/** A settled count. `decidingUnitId` is null whenever a plain majority carried it. */
export interface CouncilVote {
  /** Every authored option, zeros included. */
  tally: Record<string, number>;
  winningOptionId: string;
  decidingUnitId: string | null;
  usedTieBreak: boolean;
}

/** What the settled vote is worth (PRD §2.5). `correct` is null for a 선택이벤트. */
export interface CouncilOutcome {
  agendaId: string;
  optionId: string;
  correct: boolean | null;
  cardId: string | null;
  gaugeAll: number;
}

/** The `council:grant` detail — a snapshot, never the live outcome object. */
export type CouncilGrantDetail = CouncilOutcome;

/** One unit's stance as the round recorded it. `optionId` is null on an abstention. */
export interface CouncilStance {
  unitId: string;
  optionId: string | null;
  say: string;
  because: readonly string[];
}

/** The clue 「번역 렌즈」 (or any future council-hint card) put on the table. */
export interface CouncilHint {
  unitId: string;
  cardId: string;
  line: string;
}

/** Everything one visit to the tile produced. */
export interface CouncilRound {
  hint: CouncilHint | null;
  stances: readonly CouncilStance[];
  vote: CouncilVote;
  outcome: CouncilOutcome;
}

/** One authored row of `data/decisions.json`'s council half. */
export interface CouncilStanceEntry {
  unitId: string;
  agendaId: string;
  /** The equipped card this answer belongs to; null = the unit's default stance. */
  cardId: string | null;
  stance: Stance;
}
