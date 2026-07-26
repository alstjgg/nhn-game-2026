/*
 * u12 — 훈련장 screen (PRD §2.7): 3 cards fan out → the player picks 1 → the player
 * picks a unit. Two clicks, both the player's: this screen never chooses the card and
 * never chooses the target (A6, free assignment).
 *
 * A9 — the 훈련장 does not touch the gauge at all. It hands out cards and nothing else,
 * so it renders no gauge readout, imports no gauge helper and holds no gauge state; the
 * 휴식 screen is the only owner of those numbers on the page.
 *
 * A8 — 강제 배분 is cut. A unit that cannot take the pressed card is simply a disabled
 * row in the picker, carrying the reason; there is no follow-up branch to resolve.
 */

import { createCard } from '../../ui/index.ts';
import '../../styles/equip.css';

import { targetChoices } from '../../equip/draft';
import { equipCard, remainingCapacity } from '../../equip/loadout';
import type { PartyLoadout } from '../../equip/types';
import type { Card, SlotKind, SlotTuning } from '../../data/schema';

/** The party as the 훈련장 needs it: a name to aim at, nothing else. */
export interface TrainingUnit {
  id: string;
  name: string;
}

export interface TrainingScreenOptions {
  units: readonly TrainingUnit[];
  /** The draft options, already resolved in authored order (see `draftOptions`). */
  cards: readonly Card[];
  party: PartyLoadout;
  slots: SlotTuning;
  onAssign?: (party: PartyLoadout) => void;
}

const SLOT_ORDER: readonly SlotKind[] = ['prompt', 'skill', 'mcp'];
const SLOT_LABELS: Record<SlotKind, string> = { prompt: 'Prompt', skill: 'Skill', mcp: 'MCP' };
const SELECTED = 'dc-card--selected';

export function createTrainingScreen(options: TrainingScreenOptions): HTMLElement {
  const { units, cards, slots, onAssign } = options;
  let party = options.party;

  const root = document.createElement('section');
  root.className = 'dc-training';
  root.dataset.testid = 'training-screen';

  const title = document.createElement('h2');
  title.className = 'dc-training__title';
  title.textContent = '훈련장';

  // The meters are PERSISTENT: built once, repainted in place, never removed — the
  // remaining capacity of every unit stays readable through the whole visit (A7).
  const meters = document.createElement('div');
  meters.className = 'dc-training__meters';
  const meterRows = new Map<string, Map<SlotKind, HTMLElement>>();

  for (const unit of units) {
    const meter = document.createElement('div');
    meter.className = 'dc-slot-meter';
    meter.dataset.testid = 'slot-meter';
    meter.dataset.unitId = unit.id;

    const name = document.createElement('span');
    name.className = 'dc-slot-meter__name';
    name.textContent = unit.name;
    meter.append(name);

    const rows = new Map<SlotKind, HTMLElement>();
    for (const kind of SLOT_ORDER) {
      const row = document.createElement('span');
      row.className = 'dc-slot-meter__row';
      row.dataset.slotKind = kind;
      meter.append(row);
      rows.set(kind, row);
    }
    meterRows.set(unit.id, rows);
    meters.append(meter);
  }

  function paintMeters(): void {
    for (const unit of units) {
      const left = remainingCapacity(party, unit.id, slots);
      for (const kind of SLOT_ORDER) {
        const row = meterRows.get(unit.id)?.get(kind);
        if (row === undefined) continue;
        row.dataset.remaining = String(left[kind]);
        row.textContent = `${SLOT_LABELS[kind]} ${left[kind]}`;
      }
    }
  }

  const draftRow = document.createElement('div');
  draftRow.className = 'dc-training__draft';
  draftRow.dataset.testid = 'draft-row';
  const cardButtons: HTMLButtonElement[] = [];

  let picker: HTMLElement | null = null;
  let done: HTMLButtonElement | null = null;

  function closePicker(): void {
    picker?.remove();
    picker = null;
  }

  function clearSelection(keep: HTMLButtonElement | null): void {
    for (const button of cardButtons) {
      if (button === keep || !button.classList.contains(SELECTED)) continue;
      button.classList.remove(SELECTED);
      button.setAttribute('aria-pressed', 'false');
    }
  }

  /** Step 2: who the pressed card may be aimed at. Reads only — nothing moves yet. */
  function openPicker(card: Card): void {
    closePicker();

    const next = document.createElement('div');
    next.className = 'dc-training__picker anim-phase-fade';
    next.dataset.testid = 'target-picker';

    for (const choice of targetChoices(party, card, slots)) {
      const unit = units.find((candidate) => candidate.id === choice.unitId);

      const target = document.createElement('button');
      target.type = 'button';
      target.className = 'dc-unit-panel';
      target.dataset.unitId = choice.unitId;

      const name = document.createElement('span');
      name.className = 'dc-unit-panel__name';
      name.textContent = unit?.name ?? choice.unitId;
      target.append(name);

      if (choice.enabled) {
        target.addEventListener('click', () => {
          assign(card, choice.unitId);
        });
      } else {
        target.disabled = true;
        if (choice.reason !== undefined) target.dataset.disabledReason = choice.reason;
      }
      next.append(target);
    }

    root.append(next);
    picker = next;
  }

  /** Step 3: the player's own pair lands. One pick per visit (draft.pickCount). */
  function assign(card: Card, unitId: string): void {
    party = equipCard(party, unitId, card, slots);

    closePicker();
    clearSelection(null);
    for (const button of cardButtons) button.disabled = true;
    paintMeters();
    showDone();
    onAssign?.(party);
  }

  function showDone(): void {
    if (done !== null) return;
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'dc-training__done anim-phase-fade';
    control.dataset.testid = 'training-done';
    control.textContent = '계속';
    root.append(control);
    done = control;
  }

  for (const card of cards) {
    const button: HTMLButtonElement = createCard({
      id: card.id,
      type: card.type,
      title: card.name,
      sentence: card.text,
      onToggle: (selected) => {
        if (!selected) {
          closePicker();
          return;
        }
        clearSelection(button);
        openPicker(card);
      },
    });
    cardButtons.push(button);
    draftRow.append(button);
  }

  root.append(title, meters, draftRow);
  paintMeters();
  return root;
}
