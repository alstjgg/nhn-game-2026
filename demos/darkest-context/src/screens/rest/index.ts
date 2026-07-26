// u12 — 휴식 screen (PRD §2.7): two option cards, one resolution per visit.
//
// ① 생각정리 trims every unit's gauge. ② Clear empties it completely and forgets the
// earliest-equipped Prompt card. Both are one click, and the outcome is rendered from
// the value `applyRest` returns — this screen decides nothing about the rules.
//
// INV-7: when Clear finds no Prompt card to forget, the ONLY difference on screen is
// that the forgotten-card line is not rendered. The result banner is byte-identical
// either way, so the fallback cannot leak a warning, an error or an apology.

import { createVial, vialStateForGauge } from '../../ui/index.ts';
import '../../styles/equip.css';

import { applyRest } from '../../equip/rest';
import type { GaugeEntry, RestOption, RestResult } from '../../equip/rest';
import type { PartyLoadout } from '../../equip/types';
import type { Tuning } from '../../data/schema';

/** The party as the 휴식 tile needs it: a name next to each reading. */
export interface RestUnit {
  id: string;
  name: string;
}

export interface RestScreenOptions {
  units: readonly RestUnit[];
  party: PartyLoadout;
  gauges: readonly GaugeEntry[];
  tuning: Tuning;
  /** Display name for a forgotten card id; the data lookup stays with the caller. */
  cardName?: (cardId: string) => string;
  onResolve?: (result: RestResult) => void;
}

interface RestOptionView {
  option: RestOption;
  testid: string;
  title: string;
  sentence: string;
}

const OPTION_VIEWS: readonly RestOptionView[] = [
  {
    option: 'think',
    testid: 'rest-option-think',
    title: '생각정리',
    sentence: '머릿속을 조금 덜어낸다.',
  },
  {
    option: 'clear',
    testid: 'rest-option-clear',
    title: 'Clear',
    sentence: '머릿속을 전부 비운다. 기억까지.',
  },
];

export function createRestScreen(options: RestScreenOptions): HTMLElement {
  const { units, tuning, cardName, onResolve } = options;
  let party = options.party;
  let gauges: readonly GaugeEntry[] = options.gauges;
  let resolved = false;

  const thresholds = {
    uneasy: tuning.gauge.tiers.uneasy,
    limit: tuning.gauge.tiers.limit,
    overload: tuning.gauge.tiers.overload,
  };

  const root = document.createElement('section');
  root.className = 'dc-rest';
  root.dataset.testid = 'rest-screen';

  const title = document.createElement('h2');
  title.className = 'dc-rest__title';
  title.textContent = '휴식';

  const optionRow = document.createElement('div');
  optionRow.className = 'dc-rest__options';
  const optionButtons: HTMLButtonElement[] = [];

  for (const view of OPTION_VIEWS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dc-card dc-rest-option slot-card-frame';
    button.dataset.testid = view.testid;

    const label = document.createElement('span');
    label.className = 'dc-card__title';
    label.textContent = view.title;

    const sentence = document.createElement('span');
    sentence.className = 'dc-card__sentence';
    sentence.textContent = view.sentence;

    button.append(label, sentence);
    button.addEventListener('click', () => {
      pick(view.option);
    });
    optionButtons.push(button);
    optionRow.append(button);
  }

  // The readouts are the 휴식 tile's own: rendered from first paint, one per unit, and
  // the only place on the page where a context number exists at all.
  const partyRow = document.createElement('div');
  partyRow.className = 'dc-rest__party';
  const readouts = new Map<string, HTMLElement>();

  for (const unit of units) {
    const readout = document.createElement('div');
    readout.className = 'dc-gauge-readout';
    readout.dataset.testid = 'gauge-readout';
    readout.dataset.unitId = unit.id;
    readouts.set(unit.id, readout);
    partyRow.append(readout);
  }

  function valueFor(unitId: string): number {
    return gauges.find((entry) => entry.id === unitId)?.gauge ?? 0;
  }

  function paint(): void {
    for (const unit of units) {
      const readout = readouts.get(unit.id);
      if (readout === undefined) continue;
      const value = valueFor(unit.id);
      readout.dataset.gauge = String(value);

      const name = document.createElement('span');
      name.className = 'dc-gauge-readout__name';
      name.textContent = unit.name;

      const amount = document.createElement('span');
      amount.className = 'dc-gauge-readout__value';
      amount.textContent = String(value);

      readout.replaceChildren(name, createVial({ state: vialStateForGauge(value, thresholds) }), amount);
    }
  }

  function pick(option: RestOption): void {
    if (resolved) return;
    resolved = true;

    const result = applyRest(option, party, gauges, tuning);
    party = result.party;
    gauges = result.gauges;
    paint();

    // Both options stay on screen, disabled: one resolution per visit, and the player
    // can still read what the other one would have been.
    for (const button of optionButtons) button.disabled = true;
    for (const readout of readouts.values()) readout.classList.add('anim-gauge-tint');

    const banner = document.createElement('p');
    banner.className = 'dc-rest__result anim-phase-fade';
    banner.dataset.testid = 'rest-result';
    banner.textContent = '휴식을 마쳤다.';
    root.append(banner);

    if (result.forgottenCardId !== null) {
      const forgotten = document.createElement('p');
      forgotten.className = 'dc-rest__forgotten anim-phase-fade';
      forgotten.dataset.testid = 'forgotten-card';
      forgotten.dataset.cardId = result.forgottenCardId;
      const shown = cardName?.(result.forgottenCardId) ?? result.forgottenCardId;
      forgotten.textContent = `「${shown}」 — 기억까지 지워졌다.`;
      root.append(forgotten);
    }

    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'dc-rest__done anim-phase-fade';
    done.dataset.testid = 'rest-done';
    done.textContent = '계속';
    root.append(done);

    onResolve?.(result);
  }

  root.append(title, optionRow, partyRow);
  paint();
  return root;
}
