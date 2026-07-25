// u4 — persona brief composer.
//
// Structured trait table -> DialogueRequest / PortraitRequest. Pure logic:
// no DOM, no network, no ambient clock or entropy. The membrane (PRD §1) is
// enforced physically here — every string that leaves this module is either a
// verbatim row of data/generation.json or a value already held in game state,
// and every request is built by explicit field projection so caller-attached
// extras cannot ride along. Prompt prose is the proxy's job, not ours.

// Named import, never `import generation from '...'` (the rule written in
// src/ui/pixelate.ts:18-24): a default import is NOT tree-shaken by this repo's
// Vite, so it would ship the WHOLE generation table — `styleBible`,
// `portraitSheetFormat` and `tierTones`, i.e. the prompt scaffolding the proxy
// owns — into the client bundle. `traitTable` is the only row the client needs
// here; e2e/generation.spec.ts (AC-13) asserts the other three never reach dist/.
import { traitTable } from '../../data/generation.json';
import type { DialogueRequest, PatienceTier, PortraitRequest } from '../ai/contract.ts';

/** Injected deterministic source in [0, 1). */
export type Rng = () => number;

/** One ailment row: the stated symptom plus the truth behind it. */
export interface Ailment {
  readonly id: string;
  readonly problem: string;
  readonly hiddenCause: string;
}

/** The structured pick-lists a persona is drawn from. */
export interface TraitTable {
  readonly archetypes: readonly string[];
  readonly quirks: readonly string[];
  readonly ailments: readonly Ailment[];
}

/** A composed customer — exactly the contract's customer payload, nothing more. */
export type Persona = DialogueRequest['customer'];

/** A prior conversation beat, as the request carries it. */
export type HistoryBeat = DialogueRequest['history'][number];

/** An observation clue, as the request carries it. */
export type Clue = DialogueRequest['availableClues'][number];

/**
 * mulberry32 — a seeded 32-bit generator. Determinism is a public contract:
 * the same seed must replay the same persona for reproducible demos and tests.
 *
 * @param seed Truncated to a 32-bit signed integer (`seed | 0`) before use.
 *   Only the truncated value distinguishes streams: non-integer seeds are
 *   floored toward zero, values outside `[-2**31, 2**31)` wrap, and the
 *   sequence itself repeats with period `2**32`. Two different seeds that
 *   share the same truncated value (e.g. `1` and `1 + 2**32`) replay an
 *   identical persona — callers deriving seeds from hashes/timestamps should
 *   reduce into this domain deliberately rather than relying on wraparound.
 */
export function createRng(seed: number): Rng {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick one element with a single draw. `emptyMessage` is a literal,
 * call-site-supplied error naming the source list, so a failure points at
 * which table is malformed instead of just "composePersona blew up two
 * lines away". Passed as a whole literal (not interpolated in here) so this
 * function stays free of the prose-assembly this file forbids (D-9): no
 * template literals, no `+`, no `.join`, even for diagnostics.
 *
 * Both failure modes are real for the table-injecting public API (AC-5b):
 * an empty list (e.g. a caller excluding an already-seen ailment down to
 * zero) or a misbehaving injected rng must throw here, loudly, rather than
 * let `undefined` ride out through the membrane as a "trait" string.
 */
function pick<T>(rng: Rng, rows: readonly T[], emptyMessage: string): T {
  if (rows.length === 0) {
    throw new RangeError(emptyMessage);
  }
  const draw = rng();
  if (!(draw >= 0 && draw < 1)) {
    throw new RangeError('persona rng draw out of [0, 1) contract');
  }
  return rows[Math.floor(draw * rows.length)];
}

/**
 * Compose a customer *and* the identity of the ailment row it was drawn
 * from, with exactly three draws, in the order archetype -> quirk ->
 * ailment. problem and hiddenCause always come from one and the same
 * ailment row (they are a pair, never independent picks).
 *
 * `ailmentId` is not part of the DialogueRequest/PortraitRequest contract
 * (D-1) — Persona stays exactly `{personaTraits, problem, hiddenCause}` —
 * but outcome judging (does the prepared remedy match the true cause?) is the
 * natural consumer of a stable row identifier. Without this, a consumer is
 * pushed toward recovering the row via `problem`/`hiddenCause` prose-string
 * equality, which silently breaks the moment a table sentence is reworded.
 */
export function composeCase(rng: Rng, table: TraitTable): { persona: Persona; ailmentId: string } {
  const archetype = pick(rng, table.archetypes, 'persona trait table has no rows for "archetypes"');
  const quirk = pick(rng, table.quirks, 'persona trait table has no rows for "quirks"');
  const ailment = pick(rng, table.ailments, 'persona trait table has no rows for "ailments"');
  return {
    persona: {
      personaTraits: [archetype, quirk],
      problem: ailment.problem,
      hiddenCause: ailment.hiddenCause,
    },
    ailmentId: ailment.id,
  };
}

/**
 * Compose a customer from the injected table. Thin wrapper over
 * `composeCase` for callers that only need the contract payload — same
 * three draws, same order, `ailmentId` simply dropped.
 */
export function composePersona(rng: Rng, table: TraitTable): Persona {
  return composeCase(rng, table).persona;
}

/**
 * Project game state onto the dialogue contract. Every field is copied field
 * by field: the request holds no reference to the caller's objects, and any
 * property outside the contract is physically dropped rather than passed on.
 */
export function buildDialogueRequest(
  persona: Persona,
  patienceTier: PatienceTier,
  history: readonly HistoryBeat[],
  availableClues: readonly Clue[],
): DialogueRequest {
  return {
    customer: {
      personaTraits: persona.personaTraits.slice(),
      problem: persona.problem,
      hiddenCause: persona.hiddenCause,
    },
    patienceTier,
    history: history.map((beat) => ({
      npcLine: beat.npcLine,
      playerChoiceLabel: beat.playerChoiceLabel,
    })),
    availableClues: availableClues.map((clue) => ({ id: clue.id, text: clue.text })),
  };
}

/** Portrait requests carry trait strings only — the proxy composes the prompt. */
export function buildPortraitRequest(persona: Persona): PortraitRequest {
  return { traits: persona.personaTraits.slice() };
}

/**
 * The shipped table: a frozen *copy* of data/generation.json. The JSON module
 * object itself is left untouched — freezing it would be a cross-module side
 * effect for every other consumer of the same import.
 */
export const GENERATION_TRAIT_TABLE: TraitTable = Object.freeze({
  archetypes: Object.freeze(traitTable.archetypes.slice()),
  quirks: Object.freeze(traitTable.quirks.slice()),
  ailments: Object.freeze(
    traitTable.ailments.map((ailment) =>
      Object.freeze({
        id: ailment.id,
        problem: ailment.problem,
        hiddenCause: ailment.hiddenCause,
      }),
    ),
  ),
});
