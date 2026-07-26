// u12 — 휴식 (PRD §2.7): ①생각정리 and ②Clear.
//
// ① 생각정리 — every unit drops by `gauge.rest.think`, clamped at the 평온 floor.
//    Safe trim: nothing is forgotten.
// ② Clear     — every unit drops to `gauge.rest.clearTo`, but ONE equipped Prompt card
//    is forgotten. The pick is the earliest-equipped one across the party: the lowest
//    `seq` in the whole loadout, which is a fact of the state and therefore needs no
//    RNG and no tie-break policy (A15).
//
// INV-7: with zero Prompt cards equipped, Clear still zeroes everything and reports
// `forgottenCardId: null`. There is no warning field, no thrown error and no third
// result shape — the degradation is silent by construction, not by a screen choosing
// to stay quiet.

import type { Tuning } from '../data/schema';
import type { PartyLoadout } from './types';

/** One unit's context reading. The 휴식 tile is the only owner of these numbers. */
export interface GaugeEntry {
  id: string;
  gauge: number;
}

export interface RestResult {
  party: PartyLoadout;
  gauges: GaugeEntry[];
  /** The card Clear forgot, or null — 생각정리 and the INV-7 fallback both report null. */
  forgottenCardId: string | null;
}

export type RestOption = 'think' | 'clear';

/** The forgotten card, located: which unit held it and at which seq. */
export interface EarliestPrompt {
  unitId: string;
  cardId: string;
  seq: number;
}

/**
 * The deterministic seam itself: the lowest-seq card sitting in a Prompt slot,
 * scanned across the whole party — unit order is irrelevant, only seq decides.
 */
export function earliestEquippedPrompt(party: PartyLoadout): EarliestPrompt | null {
  let earliest: EarliestPrompt | null = null;

  for (const unit of party.units) {
    for (const entry of unit.equipped) {
      if (entry.slotKind !== 'prompt') continue;
      if (earliest === null || entry.seq < earliest.seq) {
        earliest = { unitId: unit.unitId, cardId: entry.cardId, seq: entry.seq };
      }
    }
  }
  return earliest;
}

/** ① 생각정리 — relief only. Every loadout comes back exactly as it went in. */
export function applyThinkTidy(
  party: PartyLoadout,
  gauges: readonly GaugeEntry[],
  tuning: Tuning,
): RestResult {
  const step = tuning.gauge.rest.think;
  const floor = tuning.gauge.tiers.calm;

  return {
    party,
    gauges: gauges.map((entry) => ({ id: entry.id, gauge: Math.max(entry.gauge + step, floor) })),
    forgottenCardId: null,
  };
}

/** ② Clear — everything to `clearTo`, at the cost of the earliest-equipped Prompt card. */
export function applyClear(
  party: PartyLoadout,
  gauges: readonly GaugeEntry[],
  tuning: Tuning,
): RestResult {
  const clearTo = tuning.gauge.rest.clearTo;
  const cleared = gauges.map((entry) => ({ id: entry.id, gauge: clearTo }));
  const forgotten = earliestEquippedPrompt(party);

  if (forgotten === null) {
    return { party, gauges: cleared, forgottenCardId: null };
  }

  return {
    party: {
      units: party.units.map((unit) =>
        unit.unitId === forgotten.unitId
          ? {
              unitId: unit.unitId,
              equipped: unit.equipped.filter((entry) => entry.seq !== forgotten.seq),
            }
          : unit,
      ),
      nextSeq: party.nextSeq,
    },
    gauges: cleared,
    forgottenCardId: forgotten.cardId,
  };
}

/** The one entry point the 휴식 screen calls — two option cards, one resolution. */
export function applyRest(
  option: RestOption,
  party: PartyLoadout,
  gauges: readonly GaugeEntry[],
  tuning: Tuning,
): RestResult {
  switch (option) {
    case 'think':
      return applyThinkTidy(party, gauges, tuning);
    case 'clear':
      return applyClear(party, gauges, tuning);
    default:
      throw new Error(`unknown 휴식 option: '${String(option)}'`);
  }
}
