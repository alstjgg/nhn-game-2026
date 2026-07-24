// AI contract — the ONE schema stub and live modes share (PRD §2.1, invariant
// §3-2). Mirrored by the dev-proxy (server/ai-proxy.mjs); any renderer-facing
// type lives here and only here. PROVIDED INPUT for the v2 run: extend via new
// fields if a unit needs them, but keep stub and live emitting the same shape.

/** Choice verbs (PRD §1-2). Patience costs per verb live in data/generation.json. */
export type ChoiceVerb = 'indirect' | 'direct' | 'observe' | 'craft';

/** Patience expression tier index: 0 평온 · 1 심드렁 · 2 짜증 · 3 한계 (PRD §2.2). */
export type PatienceTier = 0 | 1 | 2 | 3;

/** One generated choice card. Superset-compatible with the v1 data `Choice`. */
export interface BeatChoice {
  label: string;
  verb: ChoiceVerb;
  patienceCost: number;
  clueReveals?: string[];
}

/** One conversation beat: the customer's line plus the cards it offers. */
export interface DialogueBeat {
  npcLine: string;
  choices: BeatChoice[];
}

/**
 * Structured dialogue request (membrane: every field is composed from game
 * state / data tables — the player never types any of this).
 */
export interface DialogueRequest {
  customer: {
    /** Trait strings picked from data/generation.json traitTable. */
    personaTraits: string[];
    /** Stated symptom (ailment.problem). */
    problem: string;
    /** Hidden truth steering the 회피/우회 dialogue (ailment.hiddenCause). */
    hiddenCause: string;
  };
  patienceTier: PatienceTier;
  /** Prior beats: what the customer said, which card the player clicked. */
  history: { npcLine: string; playerChoiceLabel: string }[];
  /** Observation clues not yet revealed — the model may attach their ids. */
  availableClues: { id: string; text: string }[];
}

/** Portrait request: trait strings only; the proxy composes the prose prompt. */
export interface PortraitRequest {
  traits: string[];
}

/** A generated 4×2 expression sheet (PNG base64) + the prompt used (manifest). */
export interface PortraitSheet {
  b64: string;
  prompt: string;
}

/** GET /ai/health response. */
export interface AIHealth {
  ok: boolean;
  dialogue: boolean;
  portrait: boolean;
  models: { dialogue: string; portrait: string };
}

/** Validator shared by live adapter (response gate) and stub tests. */
export function isDialogueBeat(v: unknown): v is DialogueBeat {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Record<string, unknown>;
  if (typeof b.npcLine !== 'string' || !b.npcLine) return false;
  if (!Array.isArray(b.choices) || b.choices.length < 3 || b.choices.length > 4) return false;
  const verbs: string[] = ['indirect', 'direct', 'observe', 'craft'];
  return b.choices.every((c) => {
    if (typeof c !== 'object' || c === null) return false;
    const ch = c as Record<string, unknown>;
    return (
      typeof ch.label === 'string' &&
      ch.label.length > 0 &&
      typeof ch.verb === 'string' &&
      verbs.includes(ch.verb) &&
      typeof ch.patienceCost === 'number' &&
      (ch.clueReveals === undefined ||
        (Array.isArray(ch.clueReveals) && ch.clueReveals.every((id) => typeof id === 'string')))
    );
  });
}
