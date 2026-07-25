// roster.ts — the customer roster and its bundled fallback pack (PRD §2.3).
//
// ONE code path, three customers. Slots 1–2 are the seeded customers of
// `data/customers.json`; slot 3 is the AI-generated visitor, whose *bundled*
// stand-in (canned dialogue deck, portrait pool, outcome table, deadlines) lives
// in `data/fallback-npcs.json`. Nothing here branches on the adapter's mode: in
// live mode the injected adapter answers slot 3's prefetch and the pack is never
// consumed; in the deployed stub build the pack answers instead. Same roster,
// same screens, same transitions — only the adapter differs (AC-11).
//
// Three rules shape this module:
//   • The membrane (§1). Every string that can reach the model is either a row of
//     `data/generation.json`'s trait table (via u4's composer) or a value already
//     held in game state. This module composes requests by field projection only.
//   • Balance-as-data. Deadlines, the ambient waiting line, the continue label,
//     the portrait pool and the whole third customer are data; the code holds no
//     copy and no tuning numbers of its own.
//   • Determinism (§NFR-6). The persona draw runs on a seeded rng from the data
//     file — no ambient entropy, no host clock, no timer anywhere in this file.
import customersData from '../../data/customers.json';
import fallbackNpcs from '../../data/fallback-npcs.json';
import outcomesData from '../../data/outcomes.json';
import fallbackPortraitA from '../../assets/fallback-portrait-1.png';
import fallbackPortraitB from '../../assets/fallback-portrait-2.png';

import { AIUnavailableError, type AIAdapter } from '../ai/adapter.ts';
import { portraitSrc, type DialogueBeat, type PortraitSheet } from '../ai/contract.ts';
import { loadCustomers, loadOutcomes } from '../data/loader.ts';
import type { Customer, OutcomeTable } from '../data/schema.ts';
import {
  buildDialogueRequest,
  buildPortraitRequest,
  composePersona,
  createRng,
  GENERATION_TRAIT_TABLE,
  type Persona,
  type Rng,
} from '../pipeline/persona.ts';
import type { PrefetchRequest } from '../pipeline/prefetch.ts';
import { toBeat } from '../screens/conversation/beats.ts';
import type { ConversationOptions } from '../screens/conversation/conversation.ts';
import { pixelateSheet, type CanvasFactory } from '../ui/pixelate.ts';

/** Ambient copy for the door-idle beat — data, never authored here (§2.3). */
export const WAITING_LINE: string = fallbackNpcs.waitingLine;
/** Label of the explicit "next customer" affordance (FR-9). */
export const CONTINUE_LABEL: string = fallbackNpcs.continueLabel;
/**
 * The day's CLOSING beat (PR #33, R3). The last frame used to be a door note with
 * no affordance at all — the demo did not end, it stopped, and that was the taste
 * left in a judge's mouth as they went to score the entry. All three strings are
 * data, like every other line the shop speaks.
 */
export const CLOSING_LABEL: string = fallbackNpcs.closingLabel;
export const CLOSING_LINE: string = fallbackNpcs.closingLine;
export const REOPEN_LABEL: string = fallbackNpcs.reopenLabel;
/**
 * How long the door-idle beat is HELD when the next customer's generation has
 * already handed over to the bundled pack (PR #33, R3).
 *
 * The deadline race alone never produced a felt beat at judge pace: every slot's
 * fallback lands within 8s while a human takes 15-20s per customer, so on the
 * deployed path a judge met three customers arriving instantly, one after another
 * — and the PoC question this run exists to answer (does an async generation beat
 * read as staging?) could not be shown on the play link or in a 30-60s video. A
 * customer whose generation is READY still walks straight in (§2.3); this holds
 * the shop's own beat only when there is nothing left to wait for.
 */
export const DOOR_IDLE_HOLD_MS: number = fallbackNpcs.doorIdleHoldMs;
/** The generated slot's deadline in each mode; boot picks one (§2.3, G-4). */
export const STUB_DEADLINE_MS: number = fallbackNpcs.stubDeadlineMs;
export const LIVE_DEADLINE_MS: number = fallbackNpcs.liveDeadlineMs;
/**
 * Simulated generation cost for the canned adapter. The deployed build has no
 * proxy, so the stub *stands in for the generator* — including its duration
 * (PRD §2.1 "configurable simulated latency"). Kept above every deadline on
 * purpose: the stub demo then plays the same async choreography a live run does
 * (door-idle beat → silent fallback to the bundled pack) instead of pretending
 * generation is instant.
 */
export const SIMULATED_GENERATION_MS: { dialogueMs: number; portraitMs: number } =
  fallbackNpcs.simulatedGenerationMs;

/** Bundled 4×2 expression sheets, by file name — the pool `data` selects from. */
const BUNDLED_SHEETS: Readonly<Record<string, string>> = {
  'fallback-portrait-1.png': fallbackPortraitA,
  'fallback-portrait-2.png': fallbackPortraitB,
};

/** One roster slot: everything the shell needs to play that customer. */
export interface RosterEntry {
  /** Position in the roster; slot 0 is the customer the shop opens on. */
  readonly slot: number;
  readonly customer: Customer;
  readonly outcomeTable: OutcomeTable;
  /** Both halves of this customer's generation, composed from game state only. */
  readonly request: PrefetchRequest;
  /** The bundled pack's answer for this customer — u5's `fallbackAdapter`. */
  readonly packAdapter: AIAdapter;
  /** This customer's bundled sheet (`Customer.portrait`); the portrait of last resort. */
  readonly bundledPortraitUrl: string;
  /**
   * Palette/mirror variant for this slot's sheet cell, or `undefined` for the
   * sheet as generated. Two customers may share one bundled sheet (the pack ships
   * two for three slots), so this is what keeps them visibly two different people;
   * `portraitFace` below is the identity the roster guarantees is unique.
   */
  readonly portraitVariant?: string;
  /**
   * What the player sees as "this customer's face": the sheet plus its variant.
   * UNIQUE across the roster by construction — no two customers of one playthrough
   * may look like the same person (PR #33, R1/R3), which `buildRoster` asserts.
   */
  readonly portraitFace: string;
  /** How long the shop may keep waiting for this slot's generation (§2.3). */
  readonly deadlineMs: number;
}

export interface RosterOptions {
  /** Uniform per-slot override (the e2e harness scripts the deadline). */
  readonly deadlineMs?: number;
  /** The generated slot's deadline — boot passes the live or the stub value. */
  readonly generatedDeadlineMs?: number;
}

function fail(what: string): never {
  throw new Error(`fallback-npcs: ${what}`);
}

/** The pool as resolved bundle URLs, in the data file's order. */
function poolUrls(): readonly string[] {
  const urls = fallbackNpcs.portraitPool
    .map((file) => BUNDLED_SHEETS[file])
    .filter((url): url is string => url !== undefined);
  if (urls.length === 0) fail('portraitPool names no bundled sheet');
  return urls;
}

/**
 * Which pool sheet a slot wears when its customer names no bundled sheet of its
 * own. `portraitPoolIndex` is the FIXED base index the data pins for determinism.
 *
 * This is a LAST RESORT, not the face assignment (PR #33, R1/R3): the pool holds
 * two sheets and the roster is three slots long, so `(index + slot) % length`
 * necessarily repeats — slot 0 and slot 2 collided, and the deployed demo showed
 * the pedlar wearing the scholar's face. The face a customer wears now comes from
 * its own `portrait` field (`bundledSheetFor`).
 */
function poolSheetFor(slot: number): string {
  const urls = poolUrls();
  return urls[(fallbackNpcs.portraitPoolIndex + slot) % urls.length];
}

/**
 * The bundled sheet this CUSTOMER wears: `Customer.portrait` names a file in the
 * pack (schema.ts), so the authored field is what the render path reads. A name
 * the pack does not ship degrades to the pool rather than leaving a slot faceless.
 */
function bundledSheetFor(customer: Customer, slot: number): string {
  return BUNDLED_SHEETS[customer.portrait] ?? poolSheetFor(slot);
}

/**
 * The persona brief: traits drawn from the structured trait table, the ailment
 * taken from the customer already in game state. Three rng draws per slot, in
 * u4's order, so the whole roster replays from `seed`.
 */
function personaFor(customer: Customer, rng: Rng): Persona {
  const drawn = composePersona(rng, GENERATION_TRAIT_TABLE);
  return {
    personaTraits: drawn.personaTraits.slice(),
    problem: customer.problem,
    hiddenCause: customer.hiddenCause,
  };
}

/**
 * The bundled pack, as an adapter. It answers instantly and never rejects: the
 * canned opening beat is this customer's own authored deck, and the portrait is
 * its pool sheet. `prompt` is manifest metadata (CLAUDE.md rule 5), so it points
 * at where the real prompt is recorded rather than inventing one.
 */
function createPackAdapter(customer: Customer, sheetUrl: string): AIAdapter {
  const opening = customer.dialogueNodes[0];
  if (opening === undefined) fail(`customer ${customer.id} has no canned dialogue node`);
  return {
    mode: 'stub',
    dialogue: () => Promise.resolve(toBeat(opening)),
    portrait: () =>
      Promise.resolve({ b64: '', prompt: fallbackNpcs.portraitPoolPrompt, url: sheetUrl }),
  };
}

/**
 * Replays ONE already-fetched beat through the conversation screen's existing
 * adapter seam (u6/u10), so a prefetched dialogue seed becomes the customer's
 * opening line while the screen keeps owning its own beat source — and with it
 * the patience-tier toning and the clue bookkeeping the source needs closures
 * over. Later beats are the authored deck's: the seam's documented per-beat
 * degradation (beats.ts, §2.1) takes over as soon as this adapter is spent, and
 * the app shell never hands the *injected* adapter to a live screen, which is
 * what keeps a pending prefetch physically unable to block input (FR-6).
 */
function createSeedAdapter(seed: DialogueBeat): AIAdapter {
  let spent = false;
  const spentError = (): Promise<never> =>
    Promise.reject(new AIUnavailableError('prefetched seed is spent'));
  return {
    mode: 'stub',
    dialogue: () => {
      if (spent) return spentError();
      spent = true;
      return Promise.resolve(seed);
    },
    portrait: spentError,
  };
}

/** The identity of a painted face: which sheet, under which palette variant. */
function portraitFaceOf(url: string, variant: string | undefined): string {
  return `${url}#${variant ?? 'as-generated'}`;
}

/** Build the three-slot roster. Pure and deterministic — call it once at mount. */
export function buildRoster(options: RosterOptions = {}): RosterEntry[] {
  const seededCustomers = loadCustomers(customersData);
  const seededTables = loadOutcomes(outcomesData);
  const [packCustomer] = loadCustomers([fallbackNpcs.customer]);
  if (packCustomer === undefined) fail('customer is missing');
  const packTables = loadOutcomes({ [packCustomer.id]: fallbackNpcs.outcomeTable });

  const customers: Customer[] = [...seededCustomers, packCustomer];
  const generatedSlot = customers.length - 1;
  const generatedDeadlineMs = options.generatedDeadlineMs ?? STUB_DEADLINE_MS;
  const rng = createRng(fallbackNpcs.seed);

  const entries = customers.map((customer, slot): RosterEntry => {
    const table = seededTables[customer.id] ?? packTables[customer.id];
    if (table === undefined) fail(`customer ${customer.id} has no outcome table`);
    const persona = personaFor(customer, rng);
    const bundledPortraitUrl = bundledSheetFor(customer, slot);
    return {
      slot,
      customer,
      outcomeTable: table,
      request: {
        dialogue: buildDialogueRequest(persona, 0, [], customer.observationClues),
        portrait: buildPortraitRequest(persona),
      },
      packAdapter: createPackAdapter(customer, bundledPortraitUrl),
      bundledPortraitUrl,
      ...(customer.portraitVariant === undefined
        ? {}
        : { portraitVariant: customer.portraitVariant }),
      portraitFace: portraitFaceOf(bundledPortraitUrl, customer.portraitVariant),
      deadlineMs:
        options.deadlineMs ??
        (slot === generatedSlot ? generatedDeadlineMs : fallbackNpcs.seededDeadlineMs),
    };
  });

  // A repeated face is a CONTENT bug the player meets 45 seconds in ("a new
  // customer was generated" — wearing the first customer's face), so it fails
  // loudly at boot instead of shipping: give the new customer its own sheet, or a
  // variant of a shared one.
  const faces = new Set(entries.map((entry) => entry.portraitFace));
  if (faces.size !== entries.length) {
    fail('two customers wear the same face (portrait + portraitVariant must be unique per slot)');
  }
  return entries;
}

/**
 * How a customer's conversation is mounted. A prefetched seed rides in through
 * the screen's own adapter seam; without one the screen plays its authored deck,
 * which is exactly what slot 0 (never prefetched — there is no customer before
 * it) and every degraded slot get.
 */
export function conversationOptionsFor(seed: DialogueBeat | undefined): ConversationOptions {
  return seed === undefined ? {} : { adapter: createSeedAdapter(seed) };
}

/** Surface factory for the pixel pipeline — an element, so a URL can be read back. */
const createCanvas: CanvasFactory = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * Client-side pixelation of a RUNTIME sheet (§2.4): downscale by the shared
 * factor so a generated face matches the asset pack's pixel density, then hand
 * back a URL the portrait cell can paint. Every failure degrades to the original
 * image silently (§3-5) — a slightly-too-smooth portrait is not worth a blank one.
 */
async function pixelatedSheetUrl(src: string): Promise<string> {
  const image = new Image();
  image.src = src;
  const decoded = await image.decode().then(
    () => true,
    () => false,
  );
  if (!decoded) return src;
  const pixelated = pixelateSheet(image, { createCanvas });
  return pixelated instanceof HTMLCanvasElement ? pixelated.toDataURL('image/png') : src;
}

/**
 * The URL a slot's portrait cell should paint, given whatever the prefetch
 * decided. A bundled sheet (pack answer) is already pre-downscaled and is used
 * verbatim; a generated sheet arrives as base64 and goes through the pixel
 * pipeline first; nothing usable at all falls back to this slot's pool sheet, so
 * the cell always resolves to a real image (never a permanent silhouette).
 */
export async function portraitUrlFor(
  entry: RosterEntry,
  sheet: PortraitSheet | null,
): Promise<string> {
  if (sheet === null) return entry.bundledPortraitUrl;
  if (sheet.url !== undefined && sheet.url.length > 0) return sheet.url;
  if (sheet.b64.length === 0) return entry.bundledPortraitUrl;
  return pixelatedSheetUrl(portraitSrc(sheet));
}
