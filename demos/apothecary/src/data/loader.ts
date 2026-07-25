// u3 — data loaders. Validate the frozen top-level shapes (PRD §3) and FAIL LOUDLY,
// naming the offending entity + field, so a malformed data file surfaces at startup
// (this is the seam a future LLM proxy plugs into). No silent coercion, no defaults
// for missing structural fields.
import type {
  Choice,
  ChoiceVerb,
  Customer,
  DialogueNode,
  Ingredient,
  ObservationClue,
  Outcome,
  OutcomeEntry,
  OutcomeTable,
  OutcomeTables,
} from './schema';

function typeName(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function requireString(v: unknown, ctx: string, field: string): string {
  if (typeof v !== 'string') {
    throw new Error(`${ctx}: field '${field}' must be a string (got ${typeName(v)})`);
  }
  return v;
}

function requireNumber(v: unknown, ctx: string, field: string): number {
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new Error(`${ctx}: field '${field}' must be a number (got ${typeName(v)})`);
  }
  return v;
}

function requireBoolean(v: unknown, ctx: string, field: string): boolean {
  if (typeof v !== 'boolean') {
    throw new Error(`${ctx}: field '${field}' must be a boolean (got ${typeName(v)})`);
  }
  return v;
}

// u6 — the ChoiceVerb vocabulary, runtime side. Mirrors contract.ts ChoiceVerb.
// Derived from a `Record<ChoiceVerb, true>` so completeness is enforced BY
// CONSTRUCTION: a dropped member is a TS2741 (missing property) and a typo'd
// key is excess-property-checked — both compile-time errors. (A bare
// `readonly ChoiceVerb[]` annotation looks like it would do this but does not:
// it constrains element TYPE, not SET completeness, so `['indirect', 'direct',
// 'observe']` — craft dropped — still type-checks clean; confirmed by direct
// tsc reproduction. And the failure direction if a member were silently
// dropped is the opposite of "silently-permissive": the loader would REJECT
// valid data carrying the missing verb, not accept invalid data.)
const CHOICE_VERB_SET = {
  indirect: true,
  direct: true,
  observe: true,
  craft: true,
} satisfies Record<ChoiceVerb, true>;
const CHOICE_VERBS: readonly ChoiceVerb[] = Object.keys(CHOICE_VERB_SET) as ChoiceVerb[];

// Enum fields fail SELF-DESCRIBINGLY: the message names the field, lists every
// allowed value, and echoes the offending one, so a hand-authored typo or a
// model-generated verb outside the vocabulary is diagnosable from the message alone.
function isChoiceVerb(v: unknown): v is ChoiceVerb {
  return CHOICE_VERBS.some((verb) => verb === v);
}

function requireChoiceVerb(v: unknown, ctx: string, field: string): ChoiceVerb {
  if (!isChoiceVerb(v)) {
    throw new Error(
      `${ctx}: field '${field}' must be one of ${CHOICE_VERBS.join(' | ')} ` +
        `(got ${JSON.stringify(v)})`,
    );
  }
  return v;
}

function requireArrayOf<T>(v: unknown, ctx: string, field: string): T[] {
  if (!Array.isArray(v)) {
    throw new Error(`${ctx}: field '${field}' must be an array (got ${typeName(v)})`);
  }
  return v as T[];
}

// Leaf string[] fields (e.g. propertyTags) must have every element validated —
// requireArrayOf only checks the array shell, so a bad element (e.g. `[42]`) would
// otherwise be cast through as `string[]` uninspected. Mirrors the entry-ingredient
// per-element check in validateEntry (below).
function requireArrayOfStrings(v: unknown, ctx: string, field: string): string[] {
  const arr = requireArrayOf<unknown>(v, ctx, field);
  return arr.map((item, i) => requireString(item, ctx, `${field}[${i}]`));
}

// Element validators for the nested customer fields: `requireArrayOf` only checks
// the array shell, so each element must be inspected too (same reasoning as
// `requireArrayOfStrings` above) — otherwise a malformed element (e.g. a clue with
// a numeric `id`, or a choice with a non-numeric `patienceCost`) casts straight
// through as if well-typed.
function validateObservationClue(v: unknown, ctx: string): ObservationClue {
  if (!isRecord(v)) throw new Error(`${ctx}: clue must be an object (got ${typeName(v)})`);
  return {
    id: requireString(v.id, ctx, 'id'),
    text: requireString(v.text, ctx, 'text'),
  };
}

function validateChoice(v: unknown, ctx: string): Choice {
  if (!isRecord(v)) throw new Error(`${ctx}: choice must be an object (got ${typeName(v)})`);
  // Field order is load-bearing: the structural fields shared with v1 are checked
  // FIRST so a v1-shaped malformed choice still reports its own broken field rather
  // than the (newer) missing `verb`.
  const label = requireString(v.label, ctx, 'label');
  const patienceCost = requireNumber(v.patienceCost, ctx, 'patienceCost');
  const clueReveals =
    v.clueReveals === undefined
      ? undefined
      : requireArrayOfStrings(v.clueReveals, ctx, 'clueReveals');
  const verb = requireChoiceVerb(v.verb, ctx, 'verb');
  const choice: Choice = { label, verb, patienceCost };
  if (clueReveals !== undefined) choice.clueReveals = clueReveals;
  return choice;
}

function validateDialogueNode(v: unknown, ctx: string): DialogueNode {
  if (!isRecord(v)) throw new Error(`${ctx}: dialogue node must be an object (got ${typeName(v)})`);
  const npcLine = requireString(v.npcLine, ctx, 'npcLine');
  const rawChoices = requireArrayOf<unknown>(v.choices, ctx, 'choices');
  const choices = rawChoices.map((c, i) => validateChoice(c, `${ctx}.choices[${i}]`));
  const node: DialogueNode = { npcLine, choices };
  // `evasive` is optional but NOT truthy-tested: an authored `false` must survive
  // the round trip, and a non-boolean (`'yes'`, `1`) must fail loudly.
  if (v.evasive !== undefined) node.evasive = requireBoolean(v.evasive, ctx, 'evasive');
  return node;
}

// ── Customers ────────────────────────────────────────────────────────────────
export function loadCustomers(input: unknown): Customer[] {
  if (!Array.isArray(input)) {
    throw new Error(`customers: must be an array (got ${typeName(input)})`);
  }
  return input.map((raw, i): Customer => {
    const ctx = `customers[${i}]`;
    if (!isRecord(raw)) throw new Error(`${ctx}: must be an object (got ${typeName(raw)})`);
    const rawDialogueNodes = requireArrayOf<unknown>(raw.dialogueNodes, ctx, 'dialogueNodes');
    const rawObservationClues = requireArrayOf<unknown>(raw.observationClues, ctx, 'observationClues');
    return {
      id: requireString(raw.id, ctx, 'id'),
      name: requireString(raw.name, ctx, 'name'),
      portrait: requireString(raw.portrait, ctx, 'portrait'),
      problem: requireString(raw.problem, ctx, 'problem'),
      hiddenCause: requireString(raw.hiddenCause, ctx, 'hiddenCause'),
      patienceBudget: requireNumber(raw.patienceBudget, ctx, 'patienceBudget'),
      dialogueNodes: rawDialogueNodes.map((n, i2) => validateDialogueNode(n, `${ctx}.dialogueNodes[${i2}]`)),
      observationClues: rawObservationClues.map((c, i2) =>
        validateObservationClue(c, `${ctx}.observationClues[${i2}]`),
      ),
    };
  });
}

// ── Ingredients ──────────────────────────────────────────────────────────────
export function loadIngredients(input: unknown): Ingredient[] {
  if (!Array.isArray(input)) {
    throw new Error(`ingredients: must be an array (got ${typeName(input)})`);
  }
  return input.map((raw, i): Ingredient => {
    const ctx = `ingredients[${i}]`;
    if (!isRecord(raw)) throw new Error(`${ctx}: must be an object (got ${typeName(raw)})`);
    return {
      id: requireString(raw.id, ctx, 'id'),
      name: requireString(raw.name, ctx, 'name'),
      propertyTags: requireArrayOfStrings(raw.propertyTags, ctx, 'propertyTags'),
    };
  });
}

// ── Outcomes ─────────────────────────────────────────────────────────────────
function validateOutcome(v: unknown, ctx: string): Outcome {
  if (!isRecord(v)) throw new Error(`${ctx}: outcome must be an object (got ${typeName(v)})`);
  const channel = requireString(v.channel, ctx, 'channel');
  const text = requireString(v.text, ctx, 'text');
  const arrivalTrigger = requireString(v.arrivalTrigger, ctx, 'arrivalTrigger');
  return { channel, text, arrivalTrigger };
}

function validateEntry(v: unknown, ctx: string): OutcomeEntry {
  if (!isRecord(v)) throw new Error(`${ctx}: entry must be an object (got ${typeName(v)})`);
  const rawIngredients = requireArrayOf<unknown>(v.ingredients, ctx, 'ingredients');
  const ingredients = rawIngredients.map((id, i) => requireString(id, `${ctx}.ingredients[${i}]`, 'ingredient'));
  const method = requireString(v.method, ctx, 'method');
  const declaration = requireString(v.declaration, ctx, 'declaration');
  const outcome = validateOutcome(v.outcome, `${ctx}.outcome`);
  return { ingredients, method, declaration, outcome };
}

export function loadOutcomes(input: unknown): OutcomeTables {
  if (!isRecord(input)) {
    throw new Error(`outcomes: must be an object mapping customer id → table (got ${typeName(input)})`);
  }
  const result: OutcomeTables = {};
  for (const [customerId, rawTable] of Object.entries(input)) {
    const ctx = `outcomes[${customerId}]`;
    if (!isRecord(rawTable)) throw new Error(`${ctx}: table must be an object (got ${typeName(rawTable)})`);
    const entries = requireArrayOf<unknown>(rawTable.entries, ctx, 'entries').map(
      (e, i): OutcomeEntry => validateEntry(e, `${ctx}.entries[${i}]`),
    );
    if (!('default' in rawTable)) {
      throw new Error(`${ctx}: required 'default' outcome is missing for customer ${customerId}`);
    }
    const table: OutcomeTable = {
      entries,
      default: validateOutcome(rawTable.default, `${ctx}.default`),
    };
    result[customerId] = table;
  }
  return result;
}
