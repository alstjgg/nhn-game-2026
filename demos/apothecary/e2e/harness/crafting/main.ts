// Isolated e2e harness for u7 — mounts mountCrafting() with seeded ingredients
// (validated through the real loadIngredients) and a fixture OutcomeTable, then
// exposes the window.__crafting test API the crafting.spec.ts contract reads.
// This stands in for the future app shell (design D-2): it persists the commit
// result and flips the phase marker crafting → handover.
import { loadIngredients } from '../../../src/data/loader';
import type { CraftSelection, Outcome, OutcomeTable } from '../../../src/data/schema';
import { mountCrafting } from '../../../src/screens/crafting/index';
import rawIngredients from '../../../data/ingredients.json';

interface Combo {
  ingredientIds: string[];
  method: string;
  declaration: string;
}

interface CraftingApi {
  phase: 'crafting' | 'handover';
  lastCommit: { selection: CraftSelection; outcome: Outcome } | null;
  defaultOutcome: Outcome;
  matchCombo: Combo;
  weirdCombo: Combo;
}

const defaultOutcome: Outcome = {
  channel: '까마귀',
  text: '고개를 갸웃하며 무언가 어정쩡한 것을 받아 들고 떠난다.',
  arrivalTrigger: 'next-day',
};

// A specific, non-default row that matchCombo lands on (canonicalKey sorts ids).
const matchOutcome: Outcome = {
  channel: '비둘기',
  text: '국화와 대추를 우린 차가 마음을 가라앉혔다.',
  arrivalTrigger: 'same-evening',
};

const outcomeTable: OutcomeTable = {
  entries: [
    {
      ingredients: ['gukhwa', 'daechu'],
      method: '우리기',
      declaration: '정석',
      outcome: matchOutcome,
    },
  ],
  default: defaultOutcome,
};

const matchCombo: Combo = {
  ingredientIds: ['gukhwa', 'daechu'],
  method: '우리기',
  declaration: '정석',
};

// A valid 1–3 selection that matches NO entry → resolves to `default` (AC11).
const weirdCombo: Combo = {
  ingredientIds: ['bakha', 'sanjoin'],
  method: '빻기',
  declaration: '실험',
};

const api: CraftingApi = {
  phase: 'crafting',
  lastCommit: null,
  defaultOutcome,
  matchCombo,
  weirdCombo,
};

(window as unknown as { __crafting: CraftingApi }).__crafting = api;

const app = document.getElementById('app');
if (app) {
  const ingredients = loadIngredients(rawIngredients);
  mountCrafting(app, {
    ingredients,
    customerId: 'harness-customer',
    outcomeTable,
    onCommit: (result) => {
      // App-shell seam (D-2): persist the result, then advance the machine
      // (crafting → handover). Here we only mirror that into the test marker.
      api.lastCommit = { selection: result.selection, outcome: result.outcome };
      api.phase = 'handover';
    },
  });
}
