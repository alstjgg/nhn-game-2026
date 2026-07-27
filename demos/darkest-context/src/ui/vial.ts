// The gauge vial: the HUD read of a unit's context gauge (PRD §2.5).
//
// The vial primitive knows the four TIERS but none of the NUMBERS. Thresholds are
// a required argument, never a default baked in here — balance-as-data (INV-8)
// puts them in data/tuning.json, and a UI module that guessed 40/70/100 would
// quietly become a second source of truth.

import { isVialState, VIAL_STATES, type VialState } from './types.ts';

/** Lower bound of each tier above 평온, ascending. Comes from data/tuning.json. */
export interface GaugeThresholds {
  uneasy: number;
  limit: number;
  overload: number;
}

const VIAL_LABELS: Record<VialState, string> = {
  calm: '평온',
  uneasy: '불안',
  limit: '한계',
  overload: '폭주',
};

/**
 * Map a 0–100 gauge onto its tier. Every threshold is inclusive-lower, so a gauge
 * sitting exactly on a boundary has already entered the tier it names.
 */
export function vialStateForGauge(gauge: number, thresholds: GaugeThresholds): VialState {
  if (typeof gauge !== 'number' || !Number.isFinite(gauge) || gauge < 0 || gauge > 100) {
    throw new RangeError(`gauge must be a finite number in 0–100, got ${String(gauge)}`);
  }

  const { uneasy, limit, overload } = thresholds;
  const ascending = [uneasy, limit, overload];
  if (!ascending.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    throw new RangeError(`gauge thresholds must be finite numbers, got ${ascending.join(' / ')}`);
  }
  if (!(uneasy < limit && limit < overload)) {
    throw new RangeError(
      `gauge thresholds must ascend (uneasy < limit < overload), got ${ascending.join(' / ')}`,
    );
  }

  if (gauge >= overload) return 'overload';
  if (gauge >= limit) return 'limit';
  if (gauge >= uneasy) return 'uneasy';
  return 'calm';
}

export interface VialOptions {
  state: VialState;
}

/**
 * The tinted vial itself. It carries `.slot-vial` (the asset seam picks the sheet
 * cell from `data-state`) and nothing else — a vial never handles a click, so it
 * stays a plain element.
 */
export function createVial(options: VialOptions): HTMLElement {
  const { state } = options;
  if (!isVialState(state)) {
    throw new TypeError(
      `unknown vial state: ${String(state)} (expected ${VIAL_STATES.join(' | ')})`,
    );
  }

  const vial = document.createElement('span');
  vial.className = 'dc-vial slot-vial';
  vial.dataset.state = state;
  vial.setAttribute('role', 'img');
  vial.setAttribute('aria-label', `컨텍스트 게이지 ${VIAL_LABELS[state]}`);
  return vial;
}
