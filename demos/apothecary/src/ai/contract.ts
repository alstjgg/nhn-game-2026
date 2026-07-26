// AI contract — the ONE renderer-facing schema shared by bundled and live
// dialogue (PRD §2.1, invariant §3-2). The Lambda validates the same response
// invariants before returning a beat.

import { verbCosts } from '../../data/generation.json';

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

/** Portrait selection request: traits deterministically select a bundled sheet. */
export interface PortraitRequest {
  traits: string[];
}

/**
 * A 4×2 expression sheet reference plus provenance metadata.
 *
 * Runtime portraits are bundled assets and therefore set `url` while leaving
 * `b64` empty. The base64 form remains supported for compatibility. Never read
 * either field directly to build an `<img>` src — use `portraitSrc()`.
 *
 * `prompt` is REQUIRED of every producer: it is the only machine-checkable tie
 * between a sheet and the prose that produced it, i.e. the provenance CLAUDE.md
 * rule 5 exists for (the bundled pack points at assets-manifest.json instead of
 * inventing one). It is deliberately NOT part of image validity — see
 * `isPortraitSheet`, which never inspects it — so a payload that arrives without
 * it still renders; the requirement binds the code that BUILDS a sheet.
 */
export interface PortraitSheet {
  b64: string;
  prompt: string;
  url?: string;
}

/**
 * Base64 payload charset (RFC 4648 + the whitespace providers wrap long payloads
 * with). Anything outside it cannot be image bytes, and IS how a `"` or a `)`
 * would escape the `url("…")` literal the sheet is eventually painted into
 * (src/ui/portrait.ts, src/ui/sprite.ts).
 */
const B64_RE = /^[A-Za-z0-9+/\s]*={0,2}$/;

/**
 * A sheet `url` may only be an asset path this build owns: a relative path, a
 * root-relative path, or a `data:image/...` payload. Never a remote scheme (an
 * attacker-chosen `https://…` in a portrait response is a beacon that discloses
 * the player's IP/UA to a third party) and never a character that can terminate
 * a CSS `url("…")` literal or start a second layer.
 */
const CSS_UNSAFE_RE = /["'()\\\s<>]/;

function isAssetUrl(url: string): boolean {
  if (CSS_UNSAFE_RE.test(url)) return false;
  if (url.startsWith('data:image/')) return true;
  // Any other scheme (or a protocol-relative //host) is out: a bare relative or
  // root-relative path is what Vite emits for a bundled asset.
  if (url.startsWith('//')) return false;
  return !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
}

/** The one way to build an <img> src: bundled sheet first, inline base64 otherwise. */
export function portraitSrc(sheet: PortraitSheet): string {
  return sheet.url !== undefined && sheet.url.length > 0
    ? sheet.url
    : `data:image/png;base64,${sheet.b64}`;
}

/**
 * THE single portrait value gate — shared by the prefetch pipeline and the
 * bundled provider's self-check. Do not fork this check: a second copy is
 * exactly how a b64-only track can silently discard every url-only sheet.
 *
 * A sheet with an empty `b64` AND no/empty `url` is invalid — that is exactly
 * the shape `portraitSrc()` cannot turn into a real image. `prompt` is never
 * checked here: it is manifest metadata, not image validity, so a missing,
 * empty or malformed `prompt` must not cost us an otherwise-valid image.
 *
 * VALUE shape, not just type (PR #33, R2 on src/ui/portrait.ts:253): both fields
 * end up interpolated into a CSS `url("…")` literal, and §3-5's silent degrade
 * hands an undecodable payload through un-pixelated, verbatim. So a `b64` outside
 * the base64 charset and a `url` that is not an asset path this build owns are
 * rejected HERE — the one gate every mode shares — instead of being trusted by
 * three sinks downstream. (The sinks encode as well; this is the primary check.)
 */
export function isPortraitSheet(v: unknown): v is PortraitSheet {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  if (typeof s.b64 !== 'string') return false;
  if (s.url !== undefined && typeof s.url !== 'string') return false;
  if (!B64_RE.test(s.b64)) return false;
  const hasB64 = s.b64.length > 0;
  const hasUrl = typeof s.url === 'string' && s.url.length > 0;
  if (hasUrl && !isAssetUrl(s.url as string)) return false;
  return hasB64 || hasUrl;
}

/** GET /ai/health response. */
export interface AIHealth {
  ok: boolean;
  dialogue: boolean;
  portrait: boolean;
  models: { dialogue: string; portrait: string };
}

/**
 * Validator shared by the live adapter, authored beats and stub tests.
 *
 * Every beat must contain the four verbs exactly once, with patience costs from
 * the game-owned table. This keeps malformed or model-selected costs out of the
 * reducer and makes the client boundary match the Lambda response contract.
 */
const DIALOGUE_VERBS: readonly ChoiceVerb[] = ['indirect', 'direct', 'observe', 'craft'];
const CLUE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const VERB_COSTS: Readonly<Record<ChoiceVerb, number>> = verbCosts;

/**
 * When `availableClueIds` is supplied (the live request boundary), revealed
 * clues must be members of that request. Callers validating authored data can
 * omit it and still receive the structural and identifier checks.
 */
export function isDialogueBeat(
  v: unknown,
  availableClueIds?: Iterable<string>,
): v is DialogueBeat {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Record<string, unknown>;
  if (typeof b.npcLine !== 'string' || !b.npcLine) return false;
  if (!Array.isArray(b.choices) || b.choices.length !== DIALOGUE_VERBS.length) return false;

  const allowedClueIds =
    availableClueIds === undefined ? undefined : new Set(availableClueIds);
  const seenVerbs = new Set<ChoiceVerb>();
  const choicesAreValid = b.choices.every((c) => {
    if (typeof c !== 'object' || c === null) return false;
    const ch = c as Record<string, unknown>;
    if (
      typeof ch.label !== 'string' ||
      ch.label.length === 0 ||
      typeof ch.verb !== 'string' ||
      !DIALOGUE_VERBS.includes(ch.verb as ChoiceVerb)
    ) {
      return false;
    }

    const verb = ch.verb as ChoiceVerb;
    if (seenVerbs.has(verb) || ch.patienceCost !== VERB_COSTS[verb]) return false;
    seenVerbs.add(verb);

    if (ch.clueReveals === undefined) return true;
    if (!Array.isArray(ch.clueReveals) || ch.clueReveals.length > 4) return false;
    const clues = ch.clueReveals;
    return (
      new Set(clues).size === clues.length &&
      clues.every(
        (id) =>
          typeof id === 'string' &&
          CLUE_ID_PATTERN.test(id) &&
          (allowedClueIds === undefined || allowedClueIds.has(id)),
      )
    );
  });
  return choicesAreValid && seenVerbs.size === DIALOGUE_VERBS.length;
}
