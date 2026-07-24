// u4 — persona brief composer.
//
// Structured trait table -> DialogueRequest / PortraitRequest. Pure logic:
// no DOM, no network, no ambient clock or entropy. The membrane (PRD §1) is
// enforced physically here — every string that leaves this module is either a
// verbatim row of data/generation.json or a value already held in game state,
// and every request is built by explicit field projection so caller-attached
// extras cannot ride along. Prompt prose is the proxy's job, not ours.

import generation from '../../data/generation.json';
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

/** Pick one element with a single draw. Never overflows for draws in [0, 1). */
function pick<T>(rng: Rng, rows: readonly T[]): T {
  const index = Math.min(rows.length - 1, Math.floor(rng() * rows.length));
  return rows[index];
}

/**
 * Compose a customer from the injected table with exactly three draws, in the
 * order archetype -> quirk -> ailment. problem and hiddenCause always come
 * from one and the same ailment row (they are a pair, never independent picks).
 */
export function composePersona(rng: Rng, table: TraitTable): Persona {
  const archetype = pick(rng, table.archetypes);
  const quirk = pick(rng, table.quirks);
  const ailment = pick(rng, table.ailments);
  return {
    personaTraits: [archetype, quirk],
    problem: ailment.problem,
    hiddenCause: ailment.hiddenCause,
  };
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
  archetypes: Object.freeze(generation.traitTable.archetypes.slice()),
  quirks: Object.freeze(generation.traitTable.quirks.slice()),
  ailments: Object.freeze(
    generation.traitTable.ailments.map((ailment) =>
      Object.freeze({
        id: ailment.id,
        problem: ailment.problem,
        hiddenCause: ailment.hiddenCause,
      }),
    ),
  ),
});
