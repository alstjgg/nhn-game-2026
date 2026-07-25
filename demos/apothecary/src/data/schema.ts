// u3 — data schema types (top-level fields frozen by PRD §3; sub-structure is
// the implementer's call). Pure type declarations: `import type`-only from tests,
// erased at runtime. Loader (loader.ts) validates these shapes and fails loudly.

// u6 — the verb vocabulary is owned by the AI contract (contract.ts) and merely
// re-exported here, so stub data and live-generated beats share ONE union
// (invariant §3-2). Type-only re-export: erased at runtime, no import cycle.
export type { ChoiceVerb } from '../ai/contract';
import type { ChoiceVerb } from '../ai/contract';

/** One selectable dialogue choice card (PRD §2: each carries a patience cost). */
export interface Choice {
  label: string;
  /**
   * Which act this card performs (PRD §1-2). Costs live in data/generation.json.
   *
   * NOTE (out of this unit's file_globs, tracked for the conversation-screen
   * owner): `src/screens/conversation/conversation.ts` currently distinguishes
   * the free [관찰] card from paid cards by `patienceCost === 0` rather than
   * `verb === 'observe'`. Before u6, cost 0 implied observe (the only free
   * verb); this unit adds a second cost-0 verb (`craft`), so that heuristic no
   * longer uniquely identifies observation — it should be migrated to dispatch
   * on `verb` instead. See PR #39 review thread for the concrete failure mode.
   */
  verb: ChoiceVerb;
  patienceCost: number;
  /**
   * Ids of clues this choice reveals, from `Customer.observationClues`
   * (optional; display-time). Despite the field's name, revealed clues are no
   * longer exclusive to the free [관찰] action as of u6 — an `indirect` choice
   * can reveal one too. See `ObservationClue`'s doc comment.
   */
  clueReveals?: string[];
}

/** A node of an NPC conversation: one line plus the choice cards it offers. */
export interface DialogueNode {
  npcLine: string;
  choices: Choice[];
  /** Marks this line as the customer dodging a direct question (concept doc §5.1). */
  evasive?: boolean;
}

/**
 * A clue this customer can yield — via the free [관찰] action OR an `indirect`
 * question (as of u6, both verbs can populate a choice's `clueReveals`; the
 * top-level field name `observationClues` is frozen by PRD §3 and predates
 * that, so it no longer describes only its contents). `direct` never reveals
 * one (#15 below pins that).
 */
export interface ObservationClue {
  id: string;
  text: string;
}

/** A customer: stated problem, patience budget, dialogue tree, observation clues. */
export interface Customer {
  id: string;
  name: string;
  /** Reference to portrait art (relative asset path). */
  portrait: string;
  problem: string;
  /** The truth behind `problem`; never stated outright, only circled (PRD §2.5). */
  hiddenCause: string;
  patienceBudget: number;
  dialogueNodes: DialogueNode[];
  observationClues: ObservationClue[];
}

/** A craftable ingredient card. `propertyTags` are display-only in the demo. */
export interface Ingredient {
  id: string;
  name: string;
  propertyTags: string[];
}

/** The result of handing a brew over: which channel delivers it and its text. */
export interface Outcome {
  channel: string;
  text: string;
  arrivalTrigger: string;
}

/** One lookup row: a specific ingredient set + method + declaration → outcome. */
export interface OutcomeEntry {
  ingredients: string[];
  method: string;
  declaration: string;
  outcome: Outcome;
}

/**
 * Per-customer outcome table. `default` is REQUIRED (PRD §2, F3): any unlisted
 * combination resolves to it, so no craft can dead-end.
 */
export interface OutcomeTable {
  entries: OutcomeEntry[];
  default: Outcome;
}

/** Map of customer id → that customer's outcome table. */
export type OutcomeTables = Record<string, OutcomeTable>;

/** What the player committed at [건네기]: chosen ingredient ids + method + declaration. */
export interface CraftSelection {
  ingredientIds: string[];
  method: string;
  declaration: string;
}
