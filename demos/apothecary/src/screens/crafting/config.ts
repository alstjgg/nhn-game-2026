// config.ts — crafting balance-as-data (PRD N6). The method/declaration verbs,
// the default declaration, and the 1–3 ingredient bounds live in
// data/crafting-config.json; this module validates the shape, freezes it, and
// exports the typed CRAFTING_CONFIG so no verb/bound literal is scattered in logic.
//
// The verb strings ('우리기'/'달이기'/'빻기', '정석'/'실험') are the canonical
// outcome-key literals (design D-3): resolveOutcome matches them verbatim and
// case-sensitively, so any future outcome-table author must match byte-for-byte.
import raw from '../../../data/crafting-config.json';

export interface CraftingConfig {
  readonly methods: readonly string[];
  readonly declarations: readonly string[];
  readonly defaultDeclaration: string;
  readonly minIngredients: number;
  readonly maxIngredients: number;
}

function typeName(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function requireStringArray(v: unknown, field: string): readonly string[] {
  if (!Array.isArray(v)) {
    throw new Error(`crafting-config: field '${field}' must be an array (got ${typeName(v)})`);
  }
  v.forEach((item, i) => {
    if (typeof item !== 'string') {
      throw new Error(`crafting-config: '${field}[${i}]' must be a string (got ${typeName(item)})`);
    }
  });
  return v as readonly string[];
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== 'string') {
    throw new Error(`crafting-config: field '${field}' must be a string (got ${typeName(v)})`);
  }
  return v;
}

function requireNumber(v: unknown, field: string): number {
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new Error(`crafting-config: field '${field}' must be a number (got ${typeName(v)})`);
  }
  return v;
}

function loadConfig(input: unknown): CraftingConfig {
  const methods = requireStringArray((input as { methods: unknown }).methods, 'methods');
  const declarations = requireStringArray(
    (input as { declarations: unknown }).declarations,
    'declarations',
  );
  const defaultDeclaration = requireString(
    (input as { defaultDeclaration: unknown }).defaultDeclaration,
    'defaultDeclaration',
  );
  if (!declarations.includes(defaultDeclaration)) {
    throw new Error(
      `crafting-config: defaultDeclaration '${defaultDeclaration}' is not one of declarations`,
    );
  }
  const minIngredients = requireNumber(
    (input as { minIngredients: unknown }).minIngredients,
    'minIngredients',
  );
  const maxIngredients = requireNumber(
    (input as { maxIngredients: unknown }).maxIngredients,
    'maxIngredients',
  );
  return Object.freeze({
    methods: Object.freeze([...methods]),
    declarations: Object.freeze([...declarations]),
    defaultDeclaration,
    minIngredients,
    maxIngredients,
  });
}

export const CRAFTING_CONFIG: CraftingConfig = loadConfig(raw);
