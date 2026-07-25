// Synthetic fixtures for u3 loader/resolver tests (A5: NOT the real 2-customer content).
// Every factory returns a DEEP-FRESH object each call (structuredClone) so a test can
// clone-and-mutate to build each malformed / mismatching case without cross-test bleed.
//
// Tokens are deliberately English + opaque (A2): the resolver must not branch on Korean
// method/declaration vocabulary, so exercising it with 'boil'/'orthodox' proves it.
import type {
  Customer,
  Ingredient,
  OutcomeTable,
  OutcomeTables,
  CraftSelection,
} from '../../../src/data/schema';

// ── Customers ──────────────────────────────────────────────────────────────
// Two customers keyed c1 / c2 to line up with the per-customer outcome tables.
export function validCustomers(): Customer[] {
  return structuredClone([
    {
      id: 'c1',
      name: '손님 하나',
      portrait: 'portraits/c1.png',
      problem: '잠이 오지 않아요',
      hiddenCause: '...',
      patienceBudget: 5,
      dialogueNodes: [
        { npcLine: '...', choices: [{ label: '...', verb: 'indirect', patienceCost: 1 }] },
      ],
      observationClues: [{ id: 'clue-c1', text: '...' }],
    },
    {
      id: 'c2',
      name: '손님 둘',
      portrait: 'portraits/c2.png',
      problem: '기침이 멎지 않아요',
      hiddenCause: '...',
      patienceBudget: 3,
      dialogueNodes: [{ npcLine: '...', choices: [] }],
      observationClues: [{ id: 'clue-c2', text: '...' }],
    },
  ]);
}

// ── Ingredients ────────────────────────────────────────────────────────────
export function validIngredients(): Ingredient[] {
  return structuredClone([
    { id: 'herb_a', name: '약초 갑', propertyTags: ['warm', 'calming'] },
    { id: 'herb_b', name: '약초 을', propertyTags: ['cool'] },
    { id: 'herb_c', name: '약초 병', propertyTags: ['sharp', 'bitter'] },
  ]);
}

// ── Outcomes (per-customer table map, A4) ───────────────────────────────────
export function validOutcomes(): OutcomeTables {
  return structuredClone({
    c1: {
      entries: [
        {
          ingredients: ['herb_a', 'herb_b'],
          method: 'boil',
          declaration: 'orthodox',
          outcome: { channel: 'revisit', text: '고요한 탕약', arrivalTrigger: 'revisit' },
        },
      ],
      default: { channel: 'revisit', text: '이상한 약', arrivalTrigger: 'revisit' },
    },
    c2: {
      entries: [
        {
          ingredients: ['herb_c'],
          method: 'grind',
          declaration: 'experiment',
          outcome: { channel: 'note', text: '날카로운 가루', arrivalTrigger: 'note' },
        },
      ],
      default: { channel: 'note', text: '문 앞의 쪽지', arrivalTrigger: 'note' },
    },
  });
}

// ── Resolver fixtures ───────────────────────────────────────────────────────
// A single well-known table used by outcome.test.ts. entries[0] is the sole hit;
// anything else must fall through to `default`.
export function outcomeTable(): OutcomeTable {
  return structuredClone({
    entries: [
      {
        ingredients: ['herb_a', 'herb_b'], // stored in a-b order; player may send b-a
        method: 'boil',
        declaration: 'orthodox',
        outcome: { channel: 'revisit', text: '고요한 탕약', arrivalTrigger: 'revisit' },
      },
      {
        ingredients: ['herb_c'],
        method: 'grind',
        declaration: 'experiment',
        outcome: { channel: 'note', text: '날카로운 가루', arrivalTrigger: 'note' },
      },
    ],
    default: { channel: 'revisit', text: '이상한 약', arrivalTrigger: 'revisit' },
  });
}

// Fresh selection each call; override any field for the mismatch cases.
export function craftSelection(overrides: Partial<CraftSelection> = {}): CraftSelection {
  return {
    ingredientIds: ['herb_a', 'herb_b'],
    method: 'boil',
    declaration: 'orthodox',
    ...overrides,
  };
}
