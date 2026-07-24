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
  // u6/T9 — `hiddenCause` joins the frozen top-level customer fields (same name and
  // meaning as contract.ts DialogueRequest.customer.hiddenCause). One table row buys
  // both the omitted and the mistyped case.
  ['hiddenCause', 42],
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

// Element-level checks mirroring the propertyTags case above: the array shell can
// be valid while a nested element is not (e.g. a clue with a numeric `id`, a choice
// with a non-numeric `patienceCost`). These must throw too, instead of silently
// casting the bad element through as if it were well-typed.
describe('AC2 — loadCustomers fails loudly on malformed nested elements', () => {
  it("throws naming 'id' when an observationClues element has a non-string id", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].observationClues as Rec[])[0].id = 42;
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('id');
  });

  it("throws naming 'text' when an observationClues element has a non-string text", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].observationClues as Rec[])[0].text = 42;
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('text');
  });

  it("throws naming 'observationClues' when an element is not an object", () => {
    const arr = validCustomers() as unknown as Rec[];
    arr[0].observationClues = [42];
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('observationClues');
  });

  it("throws naming 'npcLine' when a dialogueNodes element has a non-string npcLine", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].npcLine = 42;
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('npcLine');
  });

  it("throws naming 'choices' when a dialogueNodes element's choices is not an array", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].choices = {};
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('choices');
  });

  it("throws naming 'patienceCost' when a choice has a non-numeric patienceCost", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].choices = [{ label: 'x', patienceCost: 'nope' }];
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('patienceCost');
  });

  it("throws naming 'clueReveals' when a choice's clueReveals element is not a string", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].choices = [
      { label: 'x', patienceCost: 1, clueReveals: [42] },
    ];
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('clueReveals');
  });
});

// ── u6 T5–T8 — `choice.verb` is a REQUIRED enum ──────────────────────────────
// Multi-verb schema (PRD §1 must-prove 2): every choice card declares which act it
// performs. The loader is the seam where a hand-authored or model-generated choice
// with a missing / unknown verb must fail LOUDLY instead of silently degrading into
// a verb-less card. Allowed set mirrors contract.ts ChoiceVerb.
const VALID_VERBS = ['indirect', 'direct', 'observe', 'craft'] as const;

/** c1 node[0] choices, as a mutable record array, for surgical pollution. */
function firstChoices(arr: Rec[]): Rec[] {
  return (arr[0].dialogueNodes as Rec[])[0].choices as Rec[];
}

describe('u6 AC1/T5–T8 — loadCustomers fails loudly on a bad choice `verb`', () => {
  it("throws naming 'verb' when a choice omits it", () => {
    const arr = validCustomers() as unknown as Rec[];
    delete firstChoices(arr)[0].verb;
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('verb');
  });

  it("throws naming 'verb' and echoing the offending value on an unknown verb", () => {
    const arr = validCustomers() as unknown as Rec[];
    firstChoices(arr)[0].verb = 'shout';
    const msg = messageWhenThrows(() => loadCustomers(arr));
    expect(msg).toContain('verb');
    expect(msg).toContain('shout');
  });

  it('names the allowed verb set in the message (self-describing failure)', () => {
    const arr = validCustomers() as unknown as Rec[];
    firstChoices(arr)[0].verb = 'shout';
    const msg = messageWhenThrows(() => loadCustomers(arr));
    for (const verb of VALID_VERBS) {
      expect(msg).toContain(verb);
    }
  });

  it("throws naming 'verb' when it is not a string", () => {
    const arr = validCustomers() as unknown as Rec[];
    firstChoices(arr)[0].verb = 42;
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('verb');
  });

  it("throws naming 'verb' when it is null", () => {
    const arr = validCustomers() as unknown as Rec[];
    firstChoices(arr)[0].verb = null;
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('verb');
  });

  it("throws naming 'verb' when it is the empty string", () => {
    const arr = validCustomers() as unknown as Rec[];
    firstChoices(arr)[0].verb = '';
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('verb');
  });

  it('carries the full customer → node → choice index path in the message', () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].choices = [
      { label: '오늘 하루는 어떠셨어요?', verb: 'indirect', patienceCost: 1 },
      { label: '왜 그러신데요?', verb: 'shout', patienceCost: 2 },
    ];
    const msg = messageWhenThrows(() => loadCustomers(arr));
    expect(msg).toContain('customers[0].dialogueNodes[0].choices[1]');
  });
});

// ── u6 T10 — the four valid verbs round-trip (no false positives) ─────────────
describe('u6 T10 — every ChoiceVerb loads and is preserved on the Choice', () => {
  it('accepts indirect / direct / observe / craft and keeps them in order', () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].choices = [
      { label: '자기 전에는 보통 무얼 하세요?', verb: 'indirect', patienceCost: 1 },
      { label: '왜 못 주무시는데요?', verb: 'direct', patienceCost: 2 },
      { label: '[관찰] 손끝을 본다', verb: 'observe', patienceCost: 0 },
      { label: '[조제하러 가기]', verb: 'craft', patienceCost: 0 },
    ];
    const loaded = loadCustomers(arr);
    expect(loaded[0].dialogueNodes[0].choices.map((c) => c.verb)).toEqual([
      'indirect',
      'direct',
      'observe',
      'craft',
    ]);
  });

  for (const verb of VALID_VERBS) {
    it(`accepts a lone '${verb}' choice`, () => {
      const arr = validCustomers() as unknown as Rec[];
      (arr[0].dialogueNodes as Rec[])[0].choices = [{ label: '무언가', verb, patienceCost: 0 }];
      const loaded = loadCustomers(arr);
      expect(loaded[0].dialogueNodes[0].choices[0].verb).toBe(verb);
    });
  }
});

// ── u6 T11 — `evasive` is an OPTIONAL boolean on a dialogue node ──────────────
// Machine-checkable marker for "this npcLine is the customer dodging a direct
// question" (concept doc §5.1). Optional, so DialogueNode stays assignable to
// contract.ts DialogueBeat.
describe('u6 T11 — dialogueNode.evasive is an optional boolean', () => {
  it('loads fine when evasive is absent', () => {
    const arr = validCustomers() as unknown as Rec[];
    delete (arr[0].dialogueNodes as Rec[])[0].evasive;
    expect(() => loadCustomers(arr)).not.toThrow();
    expect(loadCustomers(arr)[0].dialogueNodes[0].evasive).toBeUndefined();
  });

  it('preserves evasive: true', () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].evasive = true;
    expect(loadCustomers(arr)[0].dialogueNodes[0].evasive).toBe(true);
  });

  it('preserves evasive: false', () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].evasive = false;
    expect(loadCustomers(arr)[0].dialogueNodes[0].evasive).toBe(false);
  });

  it("throws naming 'evasive' when it is a non-boolean truthy value", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].evasive = 'yes';
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('evasive');
  });

  it("throws naming 'evasive' when it is a number", () => {
    const arr = validCustomers() as unknown as Rec[];
    (arr[0].dialogueNodes as Rec[])[0].evasive = 1;
    expect(messageWhenThrows(() => loadCustomers(arr))).toContain('evasive');
  });
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

  // Element-level check: the array shell can be valid while a leaf element is not
  // (e.g. `propertyTags: [42]`). This must also throw, naming 'propertyTags', instead
  // of silently casting the bad element through as if it were a string.
  it("throws naming 'propertyTags' when an element is not a string", () => {
    const arr = validIngredients() as unknown as Rec[];
    arr[0].propertyTags = [42];
    expect(messageWhenThrows(() => loadIngredients(arr))).toContain('propertyTags');
  });
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

// ── AC2 — a malformed ENTRY outcome / entry field also throws, naming it ─────
// F2/A3 freeze the entry-level fields (ingredients, method, declaration, outcome
// {channel,text,arrivalTrigger}); a bad one inside entries[0] must fail loudly too,
// not just the table `default`.
describe('AC2 — loadOutcomes fails loudly on malformed entry fields', () => {
  for (const field of ['channel', 'text', 'arrivalTrigger']) {
    it(`throws naming '${field}' when entries[0].outcome.${field} is missing`, () => {
      const o = validOutcomes() as unknown as Record<string, { entries: Array<{ outcome: Rec }> }>;
      delete o.c1.entries[0].outcome[field];
      expect(messageWhenThrows(() => loadOutcomes(o))).toContain(field);
    });
  }

  it("throws naming 'method' when entries[0].method is mistyped", () => {
    const o = validOutcomes() as unknown as Record<string, { entries: Rec[] }>;
    o.c1.entries[0].method = 42;
    expect(messageWhenThrows(() => loadOutcomes(o))).toContain('method');
  });

  it("throws naming 'declaration' when entries[0].declaration is mistyped", () => {
    const o = validOutcomes() as unknown as Record<string, { entries: Rec[] }>;
    o.c1.entries[0].declaration = 42;
    expect(messageWhenThrows(() => loadOutcomes(o))).toContain('declaration');
  });

  it("throws naming 'ingredients' when entries[0].ingredients is not an array", () => {
    const o = validOutcomes() as unknown as Record<string, { entries: Rec[] }>;
    o.c1.entries[0].ingredients = {};
    expect(messageWhenThrows(() => loadOutcomes(o))).toContain('ingredients');
  });

  it('throws when an entry ingredient id is not a string', () => {
    const o = validOutcomes() as unknown as Record<string, { entries: Array<{ ingredients: unknown[] }> }>;
    o.c1.entries[0].ingredients = [42];
    expect(() => loadOutcomes(o as never)).toThrow();
  });
});

// ── AC2 — a non-array / non-object TOP-LEVEL input throws (loud at the seam) ──
describe('AC2 — malformed top-level input throws loudly', () => {
  it('loadCustomers throws when the top level is not an array', () => {
    expect(messageWhenThrows(() => loadCustomers({}))).toContain('customers');
  });

  it('loadCustomers throws when an element is not an object', () => {
    expect(() => loadCustomers([42])).toThrow();
  });

  it('loadIngredients throws when the top level is not an array', () => {
    expect(messageWhenThrows(() => loadIngredients('nope'))).toContain('ingredients');
  });

  it('loadOutcomes throws when the top level is not an object map', () => {
    expect(messageWhenThrows(() => loadOutcomes([]))).toContain('outcomes');
  });
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
