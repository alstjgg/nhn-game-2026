// u4 content tests — asserts the SHIPPED data files (data/*.json) against the u3
// real loader + real resolver. Complements u3's fixture-based loader/outcome tests
// (this suite validates the actual authored content, not fixtures).
// TDD-Red: data/{customers,ingredients,outcomes}.json do not exist yet →
// the JSON imports below fail to resolve, so the whole suite is RED until u4-GREEN
// authors the three content files. Maps 1:1 to spec acceptance #1–#11 (+ bonuses).
import { describe, it, expect } from 'vitest';
import customersData from '../../data/customers.json';
import ingredientsData from '../../data/ingredients.json';
import outcomesData from '../../data/outcomes.json';
import { loadCustomers, loadIngredients, loadOutcomes } from '../../src/data/loader';
import { resolveOutcome } from '../../src/data/outcome';
import type { Customer, Ingredient, Outcome, OutcomeTable } from '../../src/data/schema';

// ── Content vocabulary constants (C4). schema.ts exposes NO enum for
// method/declaration (both are free `string`) — the Korean vocabulary is a content
// constraint enforced here, not by the type system. See DISCOVERY.md. ──────────
const METHODS = ['우리기', '달이기', '빻기'] as const;
const DECLARATIONS = ['정석', '실험'] as const;
const CHANNEL_BY_CUSTOMER: Record<string, string> = { c1: '재방문', c2: '문앞 쪽지' };
const HANGUL = /[가-힣]/;
const ID_RE = /^[a-z0-9_]+$/;

// Materialize once through the REAL loaders (C7/C11): if any file is malformed the
// loader throws here and every downstream test surfaces the loud failure.
const customers: Customer[] = loadCustomers(customersData);
const ingredients: Ingredient[] = loadIngredients(ingredientsData);
const tables = loadOutcomes(outcomesData);

const ingredientIds = new Set(ingredients.map((i) => i.id));

/** All outcomes for a customer table = every entry outcome + the required default. */
function allOutcomes(table: OutcomeTable): Outcome[] {
  return [...table.entries.map((e) => e.outcome), table.default];
}

// ── #1 [F1] — exactly 2 customers, ids c1 & c2 ─────────────────────────────────
describe('#1 [F1] customers.json loads via the real loader with exactly 2 customers', () => {
  it('returns an array of length 2', () => {
    expect(Array.isArray(customers)).toBe(true);
    expect(customers).toHaveLength(2);
  });
  it('has customer ids c1 and c2', () => {
    expect(customers.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });
});

// ── #2 [F2/A3] — 7..9 ingredients (target 8), each id/name/propertyTags[] ──────
describe('#2 [F2] ingredients.json loads with 7–9 ingredients, each well-shaped', () => {
  it('has 7 to 9 ingredients', () => {
    expect(ingredients.length).toBeGreaterThanOrEqual(7);
    expect(ingredients.length).toBeLessThanOrEqual(9);
  });
  it('each ingredient has id, name and a propertyTags array', () => {
    for (const ing of ingredients) {
      expect(typeof ing.id).toBe('string');
      expect(typeof ing.name).toBe('string');
      expect(Array.isArray(ing.propertyTags)).toBe(true);
    }
  });
  it('has unique ingredient ids', () => {
    expect(ingredientIds.size).toBe(ingredients.length);
  });
});

// ── #3 [F3] — per-customer table with a defined `default` outcome ──────────────
describe('#3 [F3] outcomes.json exposes c1 & c2 tables each with a default outcome', () => {
  it('defines a table for c1 and c2', () => {
    expect(tables.c1).toBeDefined();
    expect(tables.c2).toBeDefined();
  });
  it('each table has a defined default outcome', () => {
    expect(tables.c1.default).toBeDefined();
    expect(tables.c2.default).toBeDefined();
    expect(typeof tables.c1.default.channel).toBe('string');
    expect(typeof tables.c2.default.channel).toBe('string');
  });
});

// ── #4 [F5] — numeric patienceCost on every choice; [관찰] resolves to cost 0 ──
describe('#4 [F5] every choice has a numeric patienceCost; [관찰] observation is cost 0', () => {
  it('every dialogue choice has a numeric patienceCost', () => {
    for (const c of customers) {
      for (const node of c.dialogueNodes) {
        for (const choice of node.choices) {
          expect(typeof choice.patienceCost).toBe('number');
          expect(Number.isNaN(choice.patienceCost)).toBe(false);
        }
      }
    }
  });
  it('every [관찰] choice has patienceCost 0', () => {
    for (const c of customers) {
      for (const node of c.dialogueNodes) {
        for (const choice of node.choices) {
          if (choice.label.includes('관찰')) {
            expect(choice.patienceCost).toBe(0);
          }
        }
      }
    }
  });
  it('every customer has at least one [관찰] observation choice', () => {
    for (const c of customers) {
      const observeChoices = c.dialogueNodes
        .flatMap((n) => n.choices)
        .filter((ch) => ch.label.includes('관찰'));
      expect(observeChoices.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── #5 [C2] — every outcome text ≤ 80 chars ────────────────────────────────────
describe('#5 [C2] every outcome text (entries + defaults, both customers) is ≤ 80 chars', () => {
  for (const cid of ['c1', 'c2']) {
    it(`${cid} outcomes are all ≤ 80 chars`, () => {
      for (const o of allOutcomes(tables[cid])) {
        expect(o.text.length).toBeLessThanOrEqual(80);
      }
    });
  }
});

// ── #6 [C3] — per-customer channel: c1 재방문, c2 문앞 쪽지 ─────────────────────
describe('#6 [C3] every outcome uses its customer channel (c1 재방문 / c2 문앞 쪽지)', () => {
  for (const cid of ['c1', 'c2']) {
    it(`every ${cid} outcome uses channel ${CHANNEL_BY_CUSTOMER[cid]}`, () => {
      for (const o of allOutcomes(tables[cid])) {
        expect(o.channel).toBe(CHANNEL_BY_CUSTOMER[cid]);
      }
    });
  }
});

// ── #7 [C1] — Hangul in game-facing text; ids/triggers are ASCII English ───────
describe('#7 [C1] game-facing text is Korean; ids & triggers are ASCII English', () => {
  it('customer name & problem, npc lines, choice labels, clue text contain Hangul', () => {
    for (const c of customers) {
      expect(c.name).toMatch(HANGUL);
      expect(c.problem).toMatch(HANGUL);
      for (const node of c.dialogueNodes) {
        expect(node.npcLine).toMatch(HANGUL);
        for (const choice of node.choices) {
          expect(choice.label).toMatch(HANGUL);
        }
      }
      for (const clue of c.observationClues) {
        expect(clue.text).toMatch(HANGUL);
      }
    }
  });
  it('ingredient names contain Hangul', () => {
    for (const ing of ingredients) {
      expect(ing.name).toMatch(HANGUL);
    }
  });
  it('every outcome text contains Hangul', () => {
    for (const cid of ['c1', 'c2']) {
      for (const o of allOutcomes(tables[cid])) {
        expect(o.text).toMatch(HANGUL);
      }
    }
  });
  it('customer, ingredient and clue ids are ASCII English (^[a-z0-9_]+$)', () => {
    for (const c of customers) {
      expect(c.id).toMatch(ID_RE);
      for (const clue of c.observationClues) {
        expect(clue.id).toMatch(ID_RE);
      }
    }
    for (const ing of ingredients) {
      expect(ing.id).toMatch(ID_RE);
    }
  });
  it('every arrivalTrigger is an ASCII English machine token (^[a-z0-9_]+$)', () => {
    for (const cid of ['c1', 'c2']) {
      for (const o of allOutcomes(tables[cid])) {
        expect(o.arrivalTrigger).toMatch(ID_RE);
      }
    }
  });
});

// ── #8 [F4/R4] — ≥1 non-default entry per customer; unlisted combo → default ───
describe('#8 [F4/R4] each customer has intended entries and no dead-ends', () => {
  for (const cid of ['c1', 'c2']) {
    it(`${cid} has at least one non-default lookup entry`, () => {
      expect(tables[cid].entries.length).toBeGreaterThanOrEqual(1);
    });
    it(`${cid}: an unlisted combination resolves to default via the real resolver`, () => {
      const bogus = resolveOutcome(tables[cid], {
        ingredientIds: ['__no_such_ingredient__'],
        method: '우리기',
        declaration: '정석',
      });
      expect(bogus).toBe(tables[cid].default);
    });
  }
});

// ── #9 [R1] — every referenced ingredient id exists in ingredients.json ────────
describe('#9 [R1] every ingredient id in outcomes.json exists in ingredients.json', () => {
  for (const cid of ['c1', 'c2']) {
    it(`${cid} entry ingredient ids all resolve to a known ingredient`, () => {
      for (const entry of tables[cid].entries) {
        for (const id of entry.ingredients) {
          expect(ingredientIds.has(id)).toBe(true);
        }
      }
    });
  }
});

// ── Bonus [PRD §2] — crafting picks 1–3 ingredient cards per entry ─────────────
describe('[PRD §2] every entry uses between 1 and 3 ingredients (pick 1–3 ingredient cards)', () => {
  for (const cid of ['c1', 'c2']) {
    it(`${cid} entries each have 1 to 3 ingredients`, () => {
      for (const entry of tables[cid].entries) {
        expect(entry.ingredients.length).toBeGreaterThanOrEqual(1);
        expect(entry.ingredients.length).toBeLessThanOrEqual(3);
      }
    });
  }
});

// ── #10 [C4] — method ∈ METHODS, declaration ∈ DECLARATIONS ────────────────────
describe('#10 [C4] every entry uses a valid method and declaration', () => {
  for (const cid of ['c1', 'c2']) {
    it(`${cid} entries use method ∈ METHODS and declaration ∈ DECLARATIONS`, () => {
      for (const entry of tables[cid].entries) {
        expect(METHODS).toContain(entry.method as (typeof METHODS)[number]);
        expect(DECLARATIONS).toContain(entry.declaration as (typeof DECLARATIONS)[number]);
      }
    });
  }
});

// ── #11 [C7] — the real loaders run against the real files without throwing ────
describe('#11 [C7] real loaders run against the shipped data files without throwing', () => {
  it('loadCustomers does not throw', () => {
    expect(() => loadCustomers(customersData)).not.toThrow();
  });
  it('loadIngredients does not throw', () => {
    expect(() => loadIngredients(ingredientsData)).not.toThrow();
  });
  it('loadOutcomes does not throw', () => {
    expect(() => loadOutcomes(outcomesData)).not.toThrow();
  });
});

// ── Bonus [R3] — every clueReveals id belongs to that customer's clue namespace ─
describe('[R3] every clueReveals id exists in that customer observationClues set', () => {
  it('choice clueReveals ⊆ customer observationClues ids', () => {
    for (const c of customers) {
      const clueIds = new Set(c.observationClues.map((cl) => cl.id));
      for (const node of c.dialogueNodes) {
        for (const choice of node.choices) {
          for (const rid of choice.clueReveals ?? []) {
            expect(clueIds.has(rid)).toBe(true);
          }
        }
      }
    }
  });
});

// ── Bonus [F4 sorted] — authored ingredient id lists are pre-sorted ────────────
describe('[F4] every entry ingredient id list is authored already sorted', () => {
  for (const cid of ['c1', 'c2']) {
    it(`${cid} entry ingredient lists equal their own sorted copy`, () => {
      for (const entry of tables[cid].entries) {
        expect(entry.ingredients).toEqual([...entry.ingredients].sort());
      }
    });
  }
});
