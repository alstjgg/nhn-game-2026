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
// u6 — verb costs are balance-as-data: generation.json is the SINGLE SOURCE. No
// numeric literal for a verb cost may appear below except in #14/T17, which exists
// precisely to pin that single source against drift.
import generationData from '../../data/generation.json';
import { loadCustomers, loadIngredients, loadOutcomes } from '../../src/data/loader';
import { resolveOutcome } from '../../src/data/outcome';
// u6 §3-2 — the live contract. Imported (read-only) so the SHIPPED stub data is
// proven to satisfy the very same schema the live adapter emits.
import { isDialogueBeat } from '../../src/ai/contract';
import type { BeatChoice, ChoiceVerb, DialogueBeat } from '../../src/ai/contract';
import type {
  Choice,
  Customer,
  DialogueNode,
  Ingredient,
  Outcome,
  OutcomeTable,
  ChoiceVerb as SchemaChoiceVerb,
} from '../../src/data/schema';

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

// ── u6 multi-verb constants ────────────────────────────────────────────────────
// The verb vocabulary itself lives in contract.ts (ChoiceVerb); this array is the
// runtime mirror, pinned to the union by the `readonly ChoiceVerb[]` annotation —
// a typo or a dropped member is a typecheck error, not a silent content bug.
const ALL_VERBS: readonly ChoiceVerb[] = ['indirect', 'direct', 'observe', 'craft'];
/** The three verbs every single node must offer (craft is positional — see #13). */
const CORE_VERBS: readonly ChoiceVerb[] = ['indirect', 'direct', 'observe'];
const CRAFT_LABEL_TOKEN = '조제';

/** Every choice of every node of every customer, flat. */
const allChoices: Choice[] = customers.flatMap((c) => c.dialogueNodes.flatMap((n) => n.choices));

function choicesWithVerb(verb: ChoiceVerb): Choice[] {
  return allChoices.filter((ch) => ch.verb === verb);
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

// ═══════════════════════════════════════════════════════════════════════════════
// u6 — multi-verb schema + paper-test content quality (#12–#17).
// Everything above this line is the v1 regression floor and is EXTENDED, never
// deleted (AC#5). Below: the stub content must now stand up to the paper test —
// three verbs per beat, indirection that actually opens clues, direct questions
// that get dodged, and a single shared schema with the live adapter.
// ═══════════════════════════════════════════════════════════════════════════════

// ── #12 [F-verb] T13/T14 — every beat offers 3–4 cards across ≥3 verbs ────────
describe('#12 [F-verb] every dialogueNode offers 3–4 choices spanning indirect/direct/observe', () => {
  it('every customer has at least one dialogue node', () => {
    for (const c of customers) {
      expect(c.dialogueNodes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every dialogueNode has between 3 and 4 choices', () => {
    for (const c of customers) {
      c.dialogueNodes.forEach((node, i) => {
        expect(
          node.choices.length,
          `${c.id}.dialogueNodes[${i}] has ${node.choices.length} choices`,
        ).toBeGreaterThanOrEqual(3);
        expect(node.choices.length).toBeLessThanOrEqual(4);
      });
    }
  });

  it('every choice carries a verb from the ChoiceVerb vocabulary', () => {
    for (const ch of allChoices) {
      expect(ALL_VERBS, `unknown verb on "${ch.label}"`).toContain(ch.verb);
    }
  });

  it('every dialogueNode covers all three core verbs (indirect, direct, observe)', () => {
    for (const c of customers) {
      c.dialogueNodes.forEach((node, i) => {
        const verbs = new Set(node.choices.map((ch) => ch.verb));
        for (const required of CORE_VERBS) {
          expect(
            verbs.has(required),
            `${c.id}.dialogueNodes[${i}] is missing a '${required}' choice`,
          ).toBe(true);
        }
      });
    }
  });

  it('no dialogueNode offers the same verb twice for the core verbs', () => {
    for (const c of customers) {
      for (const node of c.dialogueNodes) {
        for (const required of CORE_VERBS) {
          const n = node.choices.filter((ch) => ch.verb === required).length;
          expect(n).toBe(1);
        }
      }
    }
  });

  it('no two choices inside one node share a label (copy-paste detector)', () => {
    for (const c of customers) {
      for (const node of c.dialogueNodes) {
        const labels = node.choices.map((ch) => ch.label);
        expect(new Set(labels).size).toBe(labels.length);
      }
    }
  });
});

// ── #13 [F-craft] T15 — [조제하러 가기] is reachable from the penultimate node ──
describe('#13 [F-craft] a craft choice exists from the penultimate node onward', () => {
  it('every node from dialogueNodes[N-2] to the last has exactly one craft choice', () => {
    for (const c of customers) {
      const n = c.dialogueNodes.length;
      const from = Math.max(0, n - 2);
      for (let i = from; i < n; i += 1) {
        const crafts = c.dialogueNodes[i].choices.filter((ch) => ch.verb === 'craft');
        expect(crafts.length, `${c.id}.dialogueNodes[${i}] craft choices`).toBe(1);
      }
    }
  });

  it("the last node always offers the craft exit (no conversational dead-end)", () => {
    for (const c of customers) {
      const last = c.dialogueNodes[c.dialogueNodes.length - 1];
      expect(last.choices.some((ch) => ch.verb === 'craft')).toBe(true);
    }
  });

  it('every craft choice is labelled with the 조제 token', () => {
    const crafts = choicesWithVerb('craft');
    expect(crafts.length).toBeGreaterThanOrEqual(2);
    for (const ch of crafts) {
      expect(ch.label).toContain(CRAFT_LABEL_TOKEN);
    }
  });
});

// ── #14 [B1] T16/T17 — patienceCost is generation.json/verbCosts, single source ─
describe('#14 [B1] every patienceCost equals generation.json verbCosts[verb]', () => {
  it('verbCosts covers the whole ChoiceVerb union (compile-time + runtime)', () => {
    const costTable: Record<ChoiceVerb, number> = generationData.verbCosts;
    expect(Object.keys(costTable).sort()).toEqual([...ALL_VERBS].sort());
  });

  it('the single source has not drifted: indirect 1 / direct 2 / observe 0 / craft 0', () => {
    expect(generationData.verbCosts.indirect).toBe(1);
    expect(generationData.verbCosts.direct).toBe(2);
    expect(generationData.verbCosts.observe).toBe(0);
    expect(generationData.verbCosts.craft).toBe(0);
  });

  it('every authored choice cost === verbCosts[its verb]', () => {
    const costTable: Record<ChoiceVerb, number> = generationData.verbCosts;
    for (const c of customers) {
      c.dialogueNodes.forEach((node, i) => {
        for (const ch of node.choices) {
          expect(
            ch.patienceCost,
            `${c.id}.dialogueNodes[${i}] "${ch.label}" (${ch.verb})`,
          ).toBe(costTable[ch.verb]);
        }
      });
    }
  });

  it('the cheapest full run (indirect on every node) fits inside every patienceBudget', () => {
    const costTable: Record<ChoiceVerb, number> = generationData.verbCosts;
    for (const c of customers) {
      const cheapest = c.dialogueNodes.length * costTable.indirect;
      expect(cheapest, `${c.id} cannot reach the last node`).toBeLessThanOrEqual(c.patienceBudget);
    }
  });
});

// ── #15 [C-회피] T18–T22 — hidden cause, evasion, indirection opens clues ──────
describe('#15 [C-회피] the hidden cause is real, hidden, and only reachable indirectly', () => {
  it('every customer has a non-empty Korean hiddenCause', () => {
    for (const c of customers) {
      expect(typeof c.hiddenCause, `${c.id}.hiddenCause`).toBe('string');
      expect(c.hiddenCause.trim().length).toBeGreaterThan(0);
      expect(c.hiddenCause).toMatch(HANGUL);
    }
  });

  it('no npcLine spells out its own hiddenCause verbatim', () => {
    for (const c of customers) {
      expect(typeof c.hiddenCause).toBe('string');
      expect(c.hiddenCause.length).toBeGreaterThan(0);
      for (const node of c.dialogueNodes) {
        expect(
          node.npcLine.includes(c.hiddenCause),
          `${c.id} leaks its hiddenCause in an npcLine`,
        ).toBe(false);
      }
    }
  });

  it('a direct question is followed by an evasive answer node', () => {
    for (const c of customers) {
      const dodges = c.dialogueNodes.some(
        (node, i) =>
          node.choices.some((ch) => ch.verb === 'direct') &&
          c.dialogueNodes[i + 1]?.evasive === true,
      );
      expect(dodges, `${c.id} has no 직접질문 → 회피 pair`).toBe(true);
    }
  });

  it('every customer marks at least one node evasive', () => {
    for (const c of customers) {
      expect(c.dialogueNodes.filter((n) => n.evasive === true).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every indirect choice opens at least one clue (우회가 단서를 연다)', () => {
    const indirects = choicesWithVerb('indirect');
    expect(indirects.length).toBeGreaterThanOrEqual(2);
    for (const ch of indirects) {
      expect(ch.clueReveals ?? [], `indirect "${ch.label}" reveals nothing`).not.toHaveLength(0);
    }
  });

  it('no direct choice opens a clue (직접 질문은 회피당한다)', () => {
    const directs = choicesWithVerb('direct');
    expect(directs.length).toBeGreaterThanOrEqual(2);
    for (const ch of directs) {
      expect(ch.clueReveals, `direct "${ch.label}" must not shortcut a clue`).toBeUndefined();
    }
  });
});

// ── #16 [C-관찰] T23–T25 — observation is free, always pays, never orphaned ────
describe('#16 [C-관찰] observation carries clues and no clue is orphaned', () => {
  it('every observe choice opens at least one clue', () => {
    const observes = choicesWithVerb('observe');
    expect(observes.length).toBeGreaterThanOrEqual(2);
    for (const ch of observes) {
      expect(ch.clueReveals ?? [], `observe "${ch.label}" reveals nothing`).not.toHaveLength(0);
    }
  });

  it('every observe choice is labelled with the 관찰 token (renderer contract)', () => {
    const observes = choicesWithVerb('observe');
    expect(observes.length).toBeGreaterThanOrEqual(2);
    for (const ch of observes) {
      expect(ch.label).toContain('관찰');
    }
  });

  it('no craft choice carries clueReveals', () => {
    const crafts = choicesWithVerb('craft');
    expect(crafts.length).toBeGreaterThanOrEqual(2);
    for (const ch of crafts) {
      expect(ch.clueReveals).toBeUndefined();
    }
  });

  it('observationClues ids are unique per customer', () => {
    for (const c of customers) {
      const ids = c.observationClues.map((cl) => cl.id);
      expect(new Set(ids).size, `${c.id} has duplicate clue ids`).toBe(ids.length);
    }
  });

  it('every observationClue is actually revealed by some choice (no orphans)', () => {
    for (const c of customers) {
      const revealed = new Set(
        c.dialogueNodes.flatMap((n) => n.choices.flatMap((ch) => ch.clueReveals ?? [])),
      );
      for (const clue of c.observationClues) {
        expect(revealed.has(clue.id), `${c.id} clue '${clue.id}' is never revealed`).toBe(true);
      }
    }
  });
});

// ── #17 [§3-2] T1–T4/T26/T27 — one schema for stub and live ───────────────────
describe('#17 [§3-2] the shipped stub data satisfies the live AI contract', () => {
  it('schema.ts re-exports the contract ChoiceVerb (same union, both directions)', () => {
    const fromSchema: SchemaChoiceVerb = 'indirect';
    const toContract: ChoiceVerb = fromSchema;
    const backToSchema: SchemaChoiceVerb = toContract;
    expect(backToSchema).toBe('indirect');
    expect([...ALL_VERBS]).toEqual(['indirect', 'direct', 'observe', 'craft']);
  });

  it('a data Choice is assignable to a live BeatChoice and back', () => {
    const stub: Choice = customers[0].dialogueNodes[0].choices[0];
    const asBeat: BeatChoice = stub;
    const backToChoice: Choice = asBeat;
    expect(typeof asBeat.verb).toBe('string');
    expect(ALL_VERBS).toContain(asBeat.verb);
    expect(backToChoice.label).toBe(stub.label);
  });

  it('a data DialogueNode is assignable to a live DialogueBeat', () => {
    const node: DialogueNode = customers[0].dialogueNodes[0];
    const asBeat: DialogueBeat = node;
    expect(asBeat.npcLine).toBe(node.npcLine);
    expect(asBeat.choices).toHaveLength(node.choices.length);
  });

  it('every shipped dialogueNode passes isDialogueBeat (the live response gate)', () => {
    for (const c of customers) {
      c.dialogueNodes.forEach((node, i) => {
        expect(isDialogueBeat(node), `${c.id}.dialogueNodes[${i}] fails isDialogueBeat`).toBe(true);
      });
    }
  });

  it('npcLines are all distinct within a customer (copy-paste detector)', () => {
    for (const c of customers) {
      const lines = c.dialogueNodes.map((n) => n.npcLine);
      expect(new Set(lines).size, `${c.id} repeats an npcLine`).toBe(lines.length);
    }
  });

  it('npcLines are distinct across customers too', () => {
    const lines = customers.flatMap((c) => c.dialogueNodes.map((n) => n.npcLine));
    expect(new Set(lines).size).toBe(lines.length);
  });
});
