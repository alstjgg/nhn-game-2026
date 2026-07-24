// u3 — data loaders. Validate the frozen top-level shapes (PRD §3) and FAIL LOUDLY,
// naming the offending entity + field, so a malformed data file surfaces at startup
// (this is the seam a future LLM proxy plugs into). No silent coercion, no defaults
// for missing structural fields.
import type {
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

// ── Customers ────────────────────────────────────────────────────────────────
export function loadCustomers(input: unknown): Customer[] {
  if (!Array.isArray(input)) {
    throw new Error(`customers: must be an array (got ${typeName(input)})`);
  }
  return input.map((raw, i): Customer => {
    const ctx = `customers[${i}]`;
    if (!isRecord(raw)) throw new Error(`${ctx}: must be an object (got ${typeName(raw)})`);
    return {
      id: requireString(raw.id, ctx, 'id'),
      name: requireString(raw.name, ctx, 'name'),
      portrait: requireString(raw.portrait, ctx, 'portrait'),
      problem: requireString(raw.problem, ctx, 'problem'),
      patienceBudget: requireNumber(raw.patienceBudget, ctx, 'patienceBudget'),
      dialogueNodes: requireArrayOf<DialogueNode>(raw.dialogueNodes, ctx, 'dialogueNodes'),
      observationClues: requireArrayOf<ObservationClue>(raw.observationClues, ctx, 'observationClues'),
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
