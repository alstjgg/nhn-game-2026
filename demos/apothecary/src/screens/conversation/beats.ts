// beats.ts — the conversation's beat source (PRD §1 must-prove 1·2, §2.1).
//
// ONE renderer-facing type: whether a beat came from the live model, the canned
// stub adapter, or the seeded `data/customers.json` slice, the screen always
// receives a `DialogueBeat` that passed `isDialogueBeat` (invariant §3-2). The
// renderer therefore has no mode branch and no error state.
//
// Failure policy (PRD §2.1 "one retry then per-beat stub fallback"): the single
// retry belongs to the adapter. This module never re-requests a beat — a throw,
// a rejection or a schema-invalid payload silently substitutes the seeded beat
// for THAT beat only, and the very next pull goes back to the adapter. Nothing
// is logged: a degraded beat is content, not an incident.
//
// Pure logic on purpose (N1/N2/D2): no DOM, no timers, no network, no import of
// the screen it feeds. Every clock lives behind the injected `AIAdapter`.
import type { AIAdapter } from '../../ai/adapter.ts';
import {
  isDialogueBeat,
  type BeatChoice,
  type DialogueBeat,
  type DialogueRequest,
  type PatienceTier,
} from '../../ai/contract.ts';
import type { Customer, DialogueNode, ObservationClue } from '../../data/schema.ts';

/** One prior exchange: what the customer said, which card the player pressed. */
export interface DialogueTurn {
  npcLine: string;
  playerChoiceLabel: string;
}

/**
 * Everything a request is composed FROM — all of it game state or data tables,
 * never typed text (the membrane, §4.1).
 */
export interface BeatContext {
  customer: Customer;
  patienceTier: PatienceTier;
  history: readonly DialogueTurn[];
  /** Clue ids already on the shelf; they are never offered to the model twice. */
  revealed: ReadonlySet<string>;
  /** Trait strings from data/generation.json; defaults to none. */
  personaTraits?: readonly string[];
}

/** The screen's window onto the conversation: pull the next beat, forever. */
export interface BeatSource {
  /** How many beats this conversation runs for — the seeded deck's length. */
  readonly total: number;
  /** Where the LAST served beat came from. Presentation-free bookkeeping. */
  readonly lastMode: 'live' | 'stub';
  /** Never rejects: an unusable adapter answer degrades to the seeded beat. */
  next(): Promise<DialogueBeat>;
  /** Name the card the player just pressed, so the next request carries it. */
  recordChoice(playerChoiceLabel: string): void;
}

export interface BeatSourceOptions {
  /** Fallback deck, index-aligned with the beat cursor. Must not be empty. */
  seeded: readonly DialogueBeat[];
  /** The customer being served — the clue vocabulary and the request's subject. */
  customer?: Customer;
  /** Absent (or without a customer) ⇒ a seeded-only source, today's app path. */
  adapter?: AIAdapter;
  /** Request composer; defaults to `composeDialogueRequest`. */
  buildRequest?: (context: BeatContext) => DialogueRequest;
  /** Current patience tier getter (u2's derivation); defaults to 평온. */
  patienceTier?: () => PatienceTier;
  /** Clue ids already revealed; defaults to none. */
  revealed?: () => ReadonlySet<string>;
}

const NOTHING_REVEALED: ReadonlySet<string> = new Set<string>();

/** u6 data node → the one renderer-facing beat type. `verb` is copied verbatim. */
export function toBeat(node: DialogueNode): DialogueBeat {
  return {
    npcLine: node.npcLine,
    choices: node.choices.map((choice) => {
      const card: BeatChoice = {
        label: choice.label,
        verb: choice.verb,
        patienceCost: choice.patienceCost,
      };
      if (choice.clueReveals !== undefined) card.clueReveals = [...choice.clueReveals];
      return card;
    }),
  };
}

/** Compose a dialogue request out of game state + data tables only. */
export function composeDialogueRequest(context: BeatContext): DialogueRequest {
  const { customer, revealed } = context;
  return {
    customer: {
      personaTraits: [...(context.personaTraits ?? [])],
      problem: customer.problem,
      hiddenCause: customer.hiddenCause,
    },
    patienceTier: context.patienceTier,
    history: context.history.map((turn) => ({ ...turn })),
    availableClues: customer.observationClues
      .filter((clue) => !revealed.has(clue.id))
      .map((clue) => ({ id: clue.id, text: clue.text })),
  };
}

/**
 * What an observe card falls back to when it names no clue this customer owns:
 * the seeded beat's own observation first (label and clue stay related), then
 * any still-unknown clue of this customer, then nothing (all clues are out).
 */
function substituteObserveClue(
  clues: readonly ObservationClue[],
  revealed: ReadonlySet<string>,
  native: ReadonlySet<string>,
  seededObserve: BeatChoice | undefined,
): string[] {
  const fromSeed = (seededObserve?.clueReveals ?? []).filter(
    (id) => native.has(id) && !revealed.has(id),
  );
  if (fromSeed.length > 0) return fromSeed;
  const spare = clues.find((clue) => !revealed.has(clue.id));
  return spare === undefined ? [] : [spare.id];
}

/**
 * Pure clue-id normalization at the source boundary (S9). A generated beat may
 * name clue ids from the model's own vocabulary, which the clue shelf cannot
 * render — every foreign id is dropped. Only the observe card earns a
 * substitute, because observing must never be a wasted turn; a paid card that
 * named nothing real simply reveals nothing.
 */
export function normalizeClueReveals(
  beat: DialogueBeat,
  clues: readonly ObservationClue[],
  revealed: ReadonlySet<string>,
  seeded: DialogueBeat,
): DialogueBeat {
  const native: ReadonlySet<string> = new Set(clues.map((clue) => clue.id));
  const seededObserve = seeded.choices.find((choice) => choice.verb === 'observe');
  return {
    npcLine: beat.npcLine,
    choices: beat.choices.map((choice) => {
      const card: BeatChoice = {
        label: choice.label,
        verb: choice.verb,
        patienceCost: choice.patienceCost,
      };
      const kept = (choice.clueReveals ?? []).filter((id) => native.has(id));
      if (choice.verb === 'observe' && kept.length === 0) {
        card.clueReveals = substituteObserveClue(clues, revealed, native, seededObserve);
      } else if (choice.clueReveals !== undefined) {
        card.clueReveals = kept;
      }
      return card;
    }),
  };
}

/**
 * Build the beat source. Cursor order is claimed synchronously per `next()`, so
 * an adapter that resolves out of order can never rewind or repeat a beat.
 */
export function createBeatSource(options: BeatSourceOptions): BeatSource {
  const {
    seeded,
    customer,
    adapter,
    buildRequest = composeDialogueRequest,
    patienceTier = (): PatienceTier => 0,
    revealed = (): ReadonlySet<string> => NOTHING_REVEALED,
  } = options;
  // A source with nothing to fall back to could not honour "never rejects" —
  // that is a wiring bug, so it fails loudly here rather than mid-conversation.
  if (seeded.length === 0) {
    throw new Error('beats: createBeatSource needs at least one seeded beat');
  }

  const history: DialogueTurn[] = [];
  let cursor = 0;
  let mode: 'live' | 'stub' = 'stub';

  /** Overdrawing the deck re-serves its last beat rather than failing. */
  function seededAt(index: number): DialogueBeat {
    return seeded[Math.min(index, seeded.length - 1)];
  }

  /** One adapter attempt. Resolves `undefined` for every unusable answer. */
  async function pullLive(
    index: number,
    subject: Customer,
    live: AIAdapter,
  ): Promise<DialogueBeat | undefined> {
    try {
      const beat = await live.dialogue(
        buildRequest({
          customer: subject,
          patienceTier: patienceTier(),
          history: history.slice(0, index),
          revealed: revealed(),
        }),
      );
      return isDialogueBeat(beat) ? beat : undefined;
    } catch {
      // Silent per-beat degradation (§3-5): the seeded beat takes over and the
      // next pull tries the adapter again. Never logged, never surfaced.
      return undefined;
    }
  }

  return {
    get total(): number {
      return seeded.length;
    },
    get lastMode(): 'live' | 'stub' {
      return mode;
    },
    recordChoice(playerChoiceLabel: string): void {
      const last = history[history.length - 1];
      if (last !== undefined) last.playerChoiceLabel = playerChoiceLabel;
    },
    async next(): Promise<DialogueBeat> {
      const index = cursor;
      cursor += 1;
      // Reserve this beat's history slot up front so a concurrent pull sees the
      // same cursor ordering the beats are served in.
      const turn: DialogueTurn = { npcLine: '', playerChoiceLabel: '' };
      history[index] = turn;

      const fallback = seededAt(index);
      const generated =
        adapter !== undefined && customer !== undefined
          ? await pullLive(index, customer, adapter)
          : undefined;
      mode = generated === undefined ? 'stub' : 'live';
      const chosen = generated ?? fallback;
      turn.npcLine = chosen.npcLine;

      if (customer === undefined) return chosen;
      return normalizeClueReveals(chosen, customer.observationClues, revealed(), fallback);
    },
  };
}
