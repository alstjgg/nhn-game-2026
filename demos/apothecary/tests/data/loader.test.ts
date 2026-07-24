// u3 loader tests — AC1 (valid load), AC2 (loud throw naming entity+field),
// AC3 (required `default` per customer). Pure logic, no DOM (PRD §5, N4).
// TDD-Red: src/data/{schema,loader}.ts do not exist yet → these fail loudly on import.
import { describe, it, expect } from 'vitest';
import { loadCustomers, loadIngredients, loadOutcomes } from '../../src/data/loader';
import { validCustomers, validIngredients, validOutcomes } from './fixtures/index';

type Rec = Record<string, unknown>;

// Runs `fn`, returns the thrown Error message. Fails the test if it does NOT throw —
// so this single helper asserts both "throws loudly" and lets us inspect the message.
function messageWhenThrows(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('expected the loader to throw, but it returned normally');
}

// ── AC1 — well-formed fixtures load and return values typed per schema.ts ────
describe('AC1 — valid fixtures load without throwing', () => {
  it('loadCustomers returns the 2 typed customers', () => {
    const customers = loadCustomers(validCustomers());
    expect(Array.isArray(customers)).toBe(true);
    expect(customers).toHaveLength(2);
    expect(customers[0].id).toBe('c1');
    expect(customers[1].id).toBe('c2');
    expect(typeof customers[0].name).toBe('string');
    expect(typeof customers[0].portrait).toBe('string');
    expect(typeof customers[0].problem).toBe('string');
    expect(typeof customers[0].patienceBudget).toBe('number');
    expect(Array.isArray(customers[0].dialogueNodes)).toBe(true);
    expect(Array.isArray(customers[0].observationClues)).toBe(true);
  });

  it('loadIngredients returns typed ingredients with string[] property tags', () => {
    const ingredients = loadIngredients(validIngredients());
    expect(Array.isArray(ingredients)).toBe(true);
    expect(ingredients.length).toBeGreaterThan(0);
    expect(ingredients[0].id).toBe('herb_a');
    expect(typeof ingredients[0].name).toBe('string');
    expect(Array.isArray(ingredients[0].propertyTags)).toBe(true);
  });

  it('loadOutcomes returns a per-customer table map with entries + default', () => {
    const tables = loadOutcomes(validOutcomes());
    expect(tables.c1).toBeDefined();
    expect(tables.c2).toBeDefined();
    expect(Array.isArray(tables.c1.entries)).toBe(true);
    expect(tables.c1.default).toBeDefined();
    expect(typeof tables.c1.default.channel).toBe('string');
  });
});

// ── AC2 — omitting OR mistyping each frozen top-level field throws, naming it ─
// String fields get a numeric wrong-value; number fields a string; array fields an object.
const customerFields: Array<[string, unknown]> = [
  ['id', 42],
  ['name', 42],
  ['portrait', 42],
  ['problem', 42],
  ['patienceBudget', 'not-a-number'],
  ['dialogueNodes', {}],
  ['observationClues', {}],
];

describe('AC2 — loadCustomers fails loudly, naming the offending field', () => {
  for (const [field, wrong] of customerFields) {
    it(`throws naming '${field}' when it is omitted`, () => {
      const arr = validCustomers() as unknown as Rec[];
      delete arr[0][field];
      expect(messageWhenThrows(() => loadCustomers(arr))).toContain(field);
    });
    it(`throws naming '${field}' when it is mistyped`, () => {
      const arr = validCustomers() as unknown as Rec[];
      arr[0][field] = wrong;
      expect(messageWhenThrows(() => loadCustomers(arr))).toContain(field);
    });
  }
});

const ingredientFields: Array<[string, unknown]> = [
  ['id', 42],
  ['name', 42],
  ['propertyTags', {}],
];

describe('AC2 — loadIngredients fails loudly, naming the offending field', () => {
  for (const [field, wrong] of ingredientFields) {
    it(`throws naming '${field}' when it is omitted`, () => {
      const arr = validIngredients() as unknown as Rec[];
      delete arr[0][field];
      expect(messageWhenThrows(() => loadIngredients(arr))).toContain(field);
    });
    it(`throws naming '${field}' when it is mistyped`, () => {
      const arr = validIngredients() as unknown as Rec[];
      arr[0][field] = wrong;
      expect(messageWhenThrows(() => loadIngredients(arr))).toContain(field);
    });
  }
});

describe('AC2 — loadOutcomes fails loudly on malformed table / outcome fields', () => {
  it("throws naming 'entries' when a customer's entries is not an array", () => {
    const o = validOutcomes() as unknown as Record<string, Rec>;
    o.c2.entries = {};
    expect(messageWhenThrows(() => loadOutcomes(o))).toContain('entries');
  });

  for (const field of ['channel', 'text', 'arrivalTrigger']) {
    it(`throws naming '${field}' when default.${field} is missing`, () => {
      const o = validOutcomes() as unknown as Record<string, { default: Rec }>;
      delete o.c2.default[field];
      expect(messageWhenThrows(() => loadOutcomes(o))).toContain(field);
    });
  }
});

// ── AC3 — every customer's table MUST define a `default` (no dead-ends, F3) ───
describe('AC3 — missing required `default` throws loudly', () => {
  it('throws naming the offending customer and `default` when a table omits it', () => {
    const o = validOutcomes() as unknown as Record<string, Rec>;
    delete o.c2.default;
    const msg = messageWhenThrows(() => loadOutcomes(o));
    expect(msg).toContain('default');
    expect(msg).toContain('c2');
  });

  it('throws when `default` is present but not a well-formed outcome object', () => {
    const o = validOutcomes() as unknown as Record<string, Rec>;
    o.c2.default = 'not-an-outcome';
    expect(messageWhenThrows(() => loadOutcomes(o))).toContain('default');
  });
});
