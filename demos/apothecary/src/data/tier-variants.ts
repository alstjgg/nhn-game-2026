// u12 — tier tone content, stub half (PRD §2.2 "tightens the customer's written
// tone").
//
// The LIVE half needs no code here: `DialogueRequest.patienceTier` already
// carries the tier to the proxy, and the proxy alone turns that number into a
// tone hint (it owns data/generation.json). The client therefore never composes
// tone prose — this module only SELECTS an authored sentence, and every sentence
// lives in data/tier-variants.json, never in source (membrane, §4.1).
//
// The table is keyed by customer id, one row per dialogue node, four variants per
// row indexed by `PatienceTier`. Tier 0 repeats data/customers.json's `npcLine`
// byte for byte, so `assertVariantCoverage` can prove the two files never drift.
//
// Pure data + pure functions: no DOM, no timers, no network, no logging.
import type { PatienceTier } from '../ai/contract.ts';
import type { Customer } from './schema.ts';
import shippedData from '../../data/tier-variants.json';

/** One beat's four authored lines, indexed by `PatienceTier`. */
export type TierVariantRow = readonly [string, string, string, string];

/** customer id → its beat rows, index-aligned with `Customer.dialogueNodes`. */
export type TierVariantTable = Readonly<Record<string, readonly TierVariantRow[]>>;

/** Reverse lookup: any authored variant → the row it belongs to. */
export type TierVariantIndex = ReadonlyMap<string, TierVariantRow>;

const PREFIX = 'tier-variants';
const TIERS_PER_ROW = 4;

function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(where: string, message: string): never {
  throw new Error(`${PREFIX}: ${where}: ${message}`);
}

function requireRow(value: unknown, customerId: string, beat: number): TierVariantRow {
  const where = `${customerId} beat ${beat}`;
  if (!Array.isArray(value) || value.length !== TIERS_PER_ROW) {
    fail(
      where,
      `must be exactly ${TIERS_PER_ROW} tier variants ` +
        `(got ${Array.isArray(value) ? `${value.length}` : typeName(value)})`,
    );
  }
  const texts: string[] = value.map((variant, tier) => {
    if (typeof variant !== 'string') {
      fail(`${where} tier ${tier}`, `variant must be a string (got ${typeName(variant)})`);
    }
    if (variant.trim().length === 0) {
      fail(`${where} tier ${tier}`, 'variant is empty');
    }
    return variant;
  });
  return [texts[0], texts[1], texts[2], texts[3]];
}

/**
 * Validate a raw tier-variant payload and FAIL LOUDLY, naming the customer, the
 * beat and (where it applies) the tier — a malformed content edit must surface
 * at startup, never as a blank line mid-conversation.
 */
export function loadTierVariants(payload: unknown): TierVariantTable {
  if (!isRecord(payload)) {
    fail('table', `must be an object keyed by customer id (got ${typeName(payload)})`);
  }
  const table: Record<string, readonly TierVariantRow[]> = {};
  for (const [customerId, rows] of Object.entries(payload)) {
    if (!Array.isArray(rows)) {
      fail(customerId, `must be an array of beat rows (got ${typeName(rows)})`);
    }
    if (rows.length === 0) {
      fail(customerId, 'has no beat rows');
    }
    table[customerId] = rows.map((row, beat) => requireRow(row, customerId, beat));
  }
  return table;
}

/**
 * Cross-file check (kept out of the loader so a synthetic table stays loadable):
 * the table covers exactly the shipped customers, one row per dialogue node, and
 * every tier-0 variant still equals the authored `npcLine`.
 */
export function assertVariantCoverage(
  table: TierVariantTable,
  customers: readonly Customer[],
): void {
  const known = new Set(customers.map((customer) => customer.id));
  for (const customerId of Object.keys(table)) {
    if (!known.has(customerId)) {
      fail(customerId, 'no customer with that id in data/customers.json');
    }
  }
  for (const customer of customers) {
    if (!Object.hasOwn(table, customer.id)) {
      fail(customer.id, 'no rows for a customer data/customers.json ships');
    }
    const rows = table[customer.id];
    if (rows.length !== customer.dialogueNodes.length) {
      fail(
        customer.id,
        `has ${rows.length} rows but data/customers.json ships ` +
          `${customer.dialogueNodes.length} dialogue nodes`,
      );
    }
    customer.dialogueNodes.forEach((node, beat) => {
      if (rows[beat][0] !== node.npcLine) {
        fail(
          `${customer.id} beat ${beat} tier 0`,
          'variant does not match the npcLine in data/customers.json',
        );
      }
    });
  }
}

/**
 * Build the reverse index. Every variant of a row is a key of that row, so a
 * line already toned for one tier re-tones to any other (the screen re-renders
 * the CURRENT line whenever the tier moves). Global uniqueness is what makes
 * that unambiguous, so a duplicate is a loud content bug, not a silent winner.
 */
export function buildTierVariantIndex(table: TierVariantTable): TierVariantIndex {
  const index = new Map<string, TierVariantRow>();
  const origin = new Map<string, string>();
  for (const [customerId, rows] of Object.entries(table)) {
    rows.forEach((row, beat) => {
      row.forEach((variant, tier) => {
        const where = `${customerId} beat ${beat} tier ${tier}`;
        const first = origin.get(variant);
        if (first !== undefined) {
          fail(where, `variant is a duplicate of ${first}: ${JSON.stringify(variant)}`);
        }
        origin.set(variant, where);
        index.set(variant, row);
      });
    });
  }
  return index;
}

/**
 * The variant of `line`'s row authored for `tier`. TOTAL by design: a line the
 * table does not know — a model-generated beat, the stub adapter's own toned
 * script — passes through unchanged and unlogged. Retoning is not an incident.
 */
export function selectTierLine(index: TierVariantIndex, line: string, tier: PatienceTier): string {
  const row = index.get(line);
  return row === undefined ? line : row[tier];
}

/** The shipped table, validated at import time. */
export const shippedTierVariants: TierVariantTable = loadTierVariants(shippedData);

/** The shipped reverse index — the default the beat source tones through. */
export const shippedTierVariantIndex: TierVariantIndex =
  buildTierVariantIndex(shippedTierVariants);
