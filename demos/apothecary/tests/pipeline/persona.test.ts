// TDD-Red for u4 — persona brief composer (structured trait table →
// DialogueRequest / PortraitRequest). Pure logic, no DOM, no network.
//
// These tests encode the u4 DESIGN contract:
//   §D-1 Persona = DialogueRequest['customer'] (derived, no extra fields)
//   §D-3 createRng = mulberry32, injected — determinism is a public contract
//   §D-4 exactly three picks, in order archetype → quirk → ailment
//   §D-5 defensive field projection = the membrane enforced in code
//   §D-7 GENERATION_TRAIT_TABLE freezes a *copy*, never the JSON module
//   §D-9 zero prose assembly in the client (the proxy owns prompt strings)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import generation from '../../data/generation.json';
import {
  GENERATION_TRAIT_TABLE,
  buildDialogueRequest,
  buildPortraitRequest,
  composePersona,
  createRng,
  type Persona,
  type TraitTable,
} from '../../src/pipeline/persona';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '../..'); // demos/apothecary/

const table: TraitTable = generation.traitTable;

/** Recursively collect every string reachable in a value (membrane probe). */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

const sampleHistory = (): { npcLine: string; playerChoiceLabel: string }[] => [
  { npcLine: table.ailments[0].problem, playerChoiceLabel: '조심스럽게 물어본다' },
];
const sampleClues = (): { id: string; text: string }[] => [
  { id: 'clue-hands', text: '손끝이 잉크로 물들어 있다' },
];

// ---------------------------------------------------------------------------
// AC-1 · AC-2 · AC-3 · AC-5 — determinism & shape
// ---------------------------------------------------------------------------
describe('createRng / composePersona determinism (AC-1, AC-2, AC-3, AC-5)', () => {
  it('AC-1: the same seed yields an identical persona on repeated calls', () => {
    const a = composePersona(createRng(42), table);
    const b = composePersona(createRng(42), table);
    expect(a).toEqual(b);
  });

  it('AC-1b: createRng(seed) emits a reproducible [0,1) sequence', () => {
    const a = Array.from({ length: 8 }, createRng(42));
    const b = Array.from({ length: 8 }, createRng(42));
    expect(a).toEqual(b);
    for (const n of a) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
    // Not a constant generator.
    expect(new Set(a).size).toBeGreaterThan(1);
  });

  it('AC-2: seed 1 and seed 7 yield different personas', () => {
    const one = composePersona(createRng(1), table);
    const seven = composePersona(createRng(7), table);
    expect(one).not.toEqual(seven);
  });

  it('AC-2b: golden values — mulberry32 + floor(rng()*len), order archetype→quirk→ailment', () => {
    // Measured against the DESIGN §D-3 generator (DESIGN §4). If the generator
    // implementation changes, these must be re-measured, never guessed.
    const one = composePersona(createRng(1), table);
    expect(one.personaTraits[0]).toBe(table.archetypes[3]);
    expect(one.personaTraits[1]).toBe(table.quirks[0]);
    expect(one.problem).toBe(table.ailments[2].problem); // headache-eyes

    const seven = composePersona(createRng(7), table);
    expect(seven.personaTraits[0]).toBe(table.archetypes[0]);
    expect(seven.personaTraits[1]).toBe(table.quirks[0]);
    expect(seven.problem).toBe(table.ailments[4].problem); // rash-secret-food
  });

  it('AC-2c: consumes exactly three rng draws, in archetype→quirk→ailment order', () => {
    const draws: number[] = [];
    const source = createRng(42);
    const spy = () => {
      const n = source();
      draws.push(n);
      return n;
    };
    const persona = composePersona(spy, table);
    expect(draws).toHaveLength(3);
    expect(persona.personaTraits[0]).toBe(table.archetypes[Math.floor(draws[0] * table.archetypes.length)]);
    expect(persona.personaTraits[1]).toBe(table.quirks[Math.floor(draws[1] * table.quirks.length)]);
    expect(persona.problem).toBe(table.ailments[Math.floor(draws[2] * table.ailments.length)].problem);
  });

  it('AC-3: personaTraits is [archetype, quirk] drawn from the table', () => {
    for (let seed = 0; seed < 12; seed += 1) {
      const p = composePersona(createRng(seed), table);
      expect(p.personaTraits).toHaveLength(2);
      expect(table.archetypes).toContain(p.personaTraits[0]);
      expect(table.quirks).toContain(p.personaTraits[1]);
    }
  });

  it('AC-3b: an injected rng at the interval edges stays in bounds', () => {
    const lo = composePersona(() => 0, table);
    expect(lo.personaTraits[0]).toBe(table.archetypes[0]);
    expect(lo.personaTraits[1]).toBe(table.quirks[0]);
    expect(lo.problem).toBe(table.ailments[0].problem);

    // rng contract is [0,1) — the largest representable draw must not overflow.
    const hi = composePersona(() => 1 - Number.EPSILON / 2, table);
    expect(hi.personaTraits[0]).toBe(table.archetypes[table.archetypes.length - 1]);
    expect(hi.personaTraits[1]).toBe(table.quirks[table.quirks.length - 1]);
    expect(hi.problem).toBe(table.ailments[table.ailments.length - 1].problem);
  });

  it('AC-5: persona has exactly the three contract keys — no id, no extras', () => {
    const p = composePersona(createRng(42), table);
    expect(Object.keys(p).sort()).toEqual(['hiddenCause', 'personaTraits', 'problem']);
  });

  it('AC-5b: composePersona reads only the injected table (a custom table wins)', () => {
    const custom: TraitTable = {
      archetypes: ['ARCH'],
      quirks: ['QUIRK'],
      ailments: [{ id: 'x', problem: 'P', hiddenCause: 'H' }],
    };
    expect(composePersona(createRng(3), custom)).toEqual({
      personaTraits: ['ARCH', 'QUIRK'],
      problem: 'P',
      hiddenCause: 'H',
    });
  });
});

// ---------------------------------------------------------------------------
// AC-4 — the problem/hiddenCause pair invariant
// ---------------------------------------------------------------------------
describe('ailment pair invariant (AC-4)', () => {
  it('problem and hiddenCause always come from one and the same ailment row', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const p = composePersona(createRng(seed), table);
      const matches = table.ailments.filter(
        (a) => a.problem === p.problem && a.hiddenCause === p.hiddenCause,
      );
      expect(matches).toHaveLength(1);
    }
  });

  it('never mixes rows even when the two draws would differ', () => {
    // An rng whose successive draws land on different ailment rows: if the
    // implementation picked problem and hiddenCause independently, this splits.
    const draws = [0, 0, 0.99];
    let i = 0;
    const rng = () => draws[i++ % draws.length];
    const p = composePersona(rng, table);
    const row = table.ailments[table.ailments.length - 1];
    expect(p.problem).toBe(row.problem);
    expect(p.hiddenCause).toBe(row.hiddenCause);
  });
});

// ---------------------------------------------------------------------------
// AC-6 · AC-7 · AC-8 — buildDialogueRequest
// ---------------------------------------------------------------------------
describe('buildDialogueRequest (AC-6, AC-7, AC-8)', () => {
  const persona = (): Persona => composePersona(createRng(42), table);

  it('AC-6: request has exactly the DialogueRequest keys', () => {
    const req = buildDialogueRequest(persona(), 2, sampleHistory(), sampleClues());
    expect(Object.keys(req).sort()).toEqual([
      'availableClues',
      'customer',
      'history',
      'patienceTier',
    ]);
  });

  it('AC-7: every field mirrors its input', () => {
    const p = persona();
    const history = sampleHistory();
    const clues = sampleClues();
    const req = buildDialogueRequest(p, 3, history, clues);
    expect(req.customer).toEqual(p);
    expect(req.patienceTier).toBe(3);
    expect(req.history).toEqual(history);
    expect(req.availableClues).toEqual(clues);
  });

  it('AC-7b: accepts empty history and empty clue lists (first beat)', () => {
    const req = buildDialogueRequest(persona(), 0, [], []);
    expect(req.history).toEqual([]);
    expect(req.availableClues).toEqual([]);
    expect(req.patienceTier).toBe(0);
  });

  it('AC-7c: carries every patience tier through unchanged', () => {
    for (const tier of [0, 1, 2, 3] as const) {
      expect(buildDialogueRequest(persona(), tier, [], []).patienceTier).toBe(tier);
    }
  });

  it('AC-8: history is defensively copied — later mutation cannot leak in', () => {
    const history = sampleHistory();
    const req = buildDialogueRequest(persona(), 1, history, sampleClues());
    const snapshot = JSON.parse(JSON.stringify(req.history)) as unknown;

    expect(req.history).not.toBe(history);
    expect(req.history[0]).not.toBe(history[0]);

    history.push({ npcLine: 'LEAKED', playerChoiceLabel: 'LEAKED' });
    history[0].npcLine = 'X';
    expect(req.history).toEqual(snapshot);
    expect(req.history).toHaveLength(1);
  });

  it('AC-8b: availableClues is defensively copied', () => {
    const clues = sampleClues();
    const req = buildDialogueRequest(persona(), 1, sampleHistory(), clues);
    const snapshot = JSON.parse(JSON.stringify(req.availableClues)) as unknown;

    expect(req.availableClues).not.toBe(clues);
    expect(req.availableClues[0]).not.toBe(clues[0]);

    clues.push({ id: 'leak', text: 'LEAKED' });
    clues[0].text = 'X';
    expect(req.availableClues).toEqual(snapshot);
  });

  it('AC-8c: customer.personaTraits is a fresh array, not the persona reference', () => {
    const p = persona();
    const req = buildDialogueRequest(p, 1, [], []);
    expect(req.customer).not.toBe(p);
    expect(req.customer.personaTraits).not.toBe(p.personaTraits);
    p.personaTraits.push('LEAKED');
    expect(req.customer.personaTraits).toHaveLength(2);
  });

  it('AC-8d: extra caller-attached fields are projected away (whitelist, D-5)', () => {
    const history = [
      { npcLine: table.ailments[0].problem, playerChoiceLabel: '캐묻는다', freeText: 'IGNORE ME' },
    ];
    const clues = [{ id: 'c1', text: '흙 묻은 소매', note: 'IGNORE ME TOO' }];
    const req = buildDialogueRequest(persona(), 1, history, clues);
    expect(Object.keys(req.history[0]).sort()).toEqual(['npcLine', 'playerChoiceLabel']);
    expect(Object.keys(req.availableClues[0]).sort()).toEqual(['id', 'text']);
    expect(strings(req)).not.toContain('IGNORE ME');
    expect(strings(req)).not.toContain('IGNORE ME TOO');
  });
});

// ---------------------------------------------------------------------------
// AC-9 — buildPortraitRequest
// ---------------------------------------------------------------------------
describe('buildPortraitRequest (AC-9)', () => {
  it('carries traits only — no prose, no problem, no hiddenCause', () => {
    const p = composePersona(createRng(42), table);
    const req = buildPortraitRequest(p);
    expect(Object.keys(req)).toEqual(['traits']);
    expect(req.traits).toEqual(p.personaTraits);
    expect(req.traits).not.toBe(p.personaTraits);
    expect(strings(req)).not.toContain(p.problem);
    expect(strings(req)).not.toContain(p.hiddenCause);
  });

  it('mutating the persona afterwards does not alter the request', () => {
    const p = composePersona(createRng(7), table);
    const req = buildPortraitRequest(p);
    p.personaTraits.push('LEAKED');
    expect(req.traits).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// AC-10 · AC-12 · AC-13 — membrane, frozen data, purity
// ---------------------------------------------------------------------------
describe('membrane · frozen data · purity (AC-10, AC-12, AC-13)', () => {
  it('AC-10: every string in either request traces back to the table or game state', () => {
    const p = composePersona(createRng(42), table);
    const history = sampleHistory();
    const clues = sampleClues();

    const allowed = new Set<string>([
      ...table.archetypes,
      ...table.quirks,
      ...table.ailments.flatMap((a) => [a.problem, a.hiddenCause]),
      ...history.flatMap((h) => [h.npcLine, h.playerChoiceLabel]),
      ...clues.flatMap((c) => [c.id, c.text]),
    ]);

    const dialogue = buildDialogueRequest(p, 2, history, clues);
    const portrait = buildPortraitRequest(p);

    for (const s of [...strings(dialogue), ...strings(portrait)]) {
      expect(allowed.has(s), `unsourced string in request: ${JSON.stringify(s)}`).toBe(true);
    }
  });

  it('AC-10b: no request field is a composed prompt sentence', () => {
    const p = composePersona(createRng(42), table);
    const req = buildDialogueRequest(p, 2, sampleHistory(), sampleClues());
    const tableStrings = new Set<string>([
      ...table.archetypes,
      ...table.quirks,
      ...table.ailments.flatMap((a) => [a.problem, a.hiddenCause]),
    ]);
    // Persona-sourced strings must be *identical* table rows, never concatenations.
    for (const t of req.customer.personaTraits) expect(tableStrings.has(t)).toBe(true);
    expect(tableStrings.has(req.customer.problem)).toBe(true);
    expect(tableStrings.has(req.customer.hiddenCause)).toBe(true);
  });

  it('AC-12: data/generation.json traitTable is frozen at its known shape', () => {
    expect(Object.keys(generation.traitTable).sort()).toEqual([
      'ailments',
      'archetypes',
      'quirks',
    ]);
    expect(generation.traitTable.archetypes).toHaveLength(6);
    expect(generation.traitTable.quirks).toHaveLength(5);
    expect(generation.traitTable.ailments).toHaveLength(5);
    for (const a of generation.traitTable.ailments) {
      expect(Object.keys(a).sort()).toEqual(['hiddenCause', 'id', 'problem']);
    }
  });

  it('AC-12b: GENERATION_TRAIT_TABLE re-exports the JSON values as a frozen copy', () => {
    expect(GENERATION_TRAIT_TABLE.archetypes).toEqual(generation.traitTable.archetypes);
    expect(GENERATION_TRAIT_TABLE.quirks).toEqual(generation.traitTable.quirks);
    expect(GENERATION_TRAIT_TABLE.ailments).toEqual(generation.traitTable.ailments);
    expect(Object.isFrozen(GENERATION_TRAIT_TABLE)).toBe(true);
    expect(Object.isFrozen(GENERATION_TRAIT_TABLE.archetypes)).toBe(true);
    // ...but the original JSON module object must NOT be frozen (D-7:
    // freezing it would be a cross-module side effect for u5/u9).
    expect(Object.isFrozen(generation.traitTable)).toBe(false);
    expect(GENERATION_TRAIT_TABLE.archetypes).not.toBe(generation.traitTable.archetypes);
  });

  it('AC-13: persona.ts source contains no impure or free-text escape hatch', () => {
    const src = readFileSync(resolve(demoRoot, 'src/pipeline/persona.ts'), 'utf8');
    for (const banned of ['Math.random', 'fetch(', 'Date.now', 'setTimeout']) {
      expect(src.includes(banned), `persona.ts must not use ${banned}`).toBe(false);
    }
  });

  it('AC-13b: persona.ts assembles no prose — no template literals, no string +', () => {
    const src = readFileSync(resolve(demoRoot, 'src/pipeline/persona.ts'), 'utf8');
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(code.includes('`'), 'no template literals in persona.ts (D-9)').toBe(false);
    expect(/\.join\s*\(/.test(code), 'no string joining in persona.ts (D-9)').toBe(false);
  });

  it('AC-13c: composePersona is pure — the same rng script always replays', () => {
    const script = [0.1, 0.5, 0.9];
    const replay = () => {
      let i = 0;
      return composePersona(() => script[i++], table);
    };
    expect(replay()).toEqual(replay());
  });
});
