// Equip harness — mounts the 훈련장 and the 휴식 screen once, on REAL data.
//
// Unlike the primitives harness, this page loads data/ through `loadBundledGameData`:
// the draft pool, the slot capacities and the 휴식 numbers are exactly what ships, so
// the spec can assert wiring (option count, capacity, the duplicate block) without ever
// naming a Korean string. Everything the spec needs to address is published on
// `window.__equip`.
//
// `?scenario=no-prompt` seeds a party holding ZERO Prompt cards — the INV-7 path, where
// Clear must still empty every readout and say nothing about what it could not forget.

import { loadBundledGameData } from '../../../src/data/loader';
import { draftOptions } from '../../../src/equip/draft';
import { createLoadout, equipCard } from '../../../src/equip/loadout';
import type { GaugeEntry } from '../../../src/equip/rest';
import { createRestScreen } from '../../../src/screens/rest/index.ts';
import { createTrainingScreen } from '../../../src/screens/training/index.ts';
import './harness.css';

const { cards, council, heroes, tuning } = loadBundledGameData();

/** The demo party of PRD §2.3, in party order. */
const PARTY_IDS = ['garrett', 'fiona', 'selene'];
/** Harness fixture, not balance: any non-zero start proves 생각정리 moved something. */
const SEEDED_GAUGES = [82, 64, 45];
/** Exactly ONE unit starts pre-equipped, so the meter baseline stays unambiguous. */
const DUP_UNIT_ID = 'fiona';

const units = PARTY_IDS.map((unitId) => {
  const hero = heroes.find((candidate) => candidate.id === unitId);
  if (hero === undefined) {
    throw new Error(`harness party member '${unitId}' is missing from data/heroes.json`);
  }
  return { id: hero.id, name: hero.name };
});

const draftGrant = Object.values(council.rewards).find((grant) => grant.kind === 'draft');
if (draftGrant === undefined) {
  throw new Error('data/council.json carries no draft reward for the 훈련장 harness');
}
const draftCards = draftOptions(draftGrant, cards, tuning);

const noPrompt = new URLSearchParams(window.location.search).get('scenario') === 'no-prompt';

// The pre-equipped card is always one of the draft options, so pressing it in the fan-out
// is what surfaces the duplicate block. On the INV-7 path it must not be a Prompt card.
const dupCard = draftCards.find((card) =>
  noPrompt ? card.slotKind !== 'prompt' : card.slotKind === 'prompt',
);
if (dupCard === undefined) {
  throw new Error('the draft pool cannot seed the pre-equipped unit for this scenario');
}

const party = equipCard(
  createLoadout(units.map((unit) => unit.id)),
  DUP_UNIT_ID,
  dupCard,
  tuning.slots,
);
const gauges: GaugeEntry[] = units.map((unit, index) => ({
  id: unit.id,
  gauge: SEEDED_GAUGES[index] ?? 0,
}));

const cardName = (cardId: string): string =>
  cards.find((card) => card.id === cardId)?.name ?? cardId;

const root = document.getElementById('harness');
if (root) {
  root.append(
    createTrainingScreen({ units, cards: draftCards, party, slots: tuning.slots }),
    createRestScreen({ units, party, gauges, tuning, cardName }),
  );
}

Object.assign(window, {
  __equip: {
    unitIds: units.map((unit) => unit.id),
    draftCardIds: draftCards.map((card) => card.id),
    dupUnitId: DUP_UNIT_ID,
    dupCardId: dupCard.id,
    gauges: gauges.map((entry) => ({ ...entry })),
  },
});
