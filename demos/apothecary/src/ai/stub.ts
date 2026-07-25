// Stub AI adapter (PRD §2.1) — the deployed Pages build has no dev-proxy, so this
// is the mode judges actually play. It answers from canned data
// (data/stub-dialogue.json) through the SAME AIAdapter seam and the SAME
// contract validators as the live path, so the renderer cannot tell them apart.
//
// Two invariants shape this file:
//   - determinism: identical requests produce deeply-equal beats; portrait choice
//     is a pure hash of the traits. No clocks, no randomness (§2.3).
//   - all timing flows through the injected scheduler (`config.sleep`); the only
//     real timer in the demo's AI path is `realSleep` below, and unit tests run
//     it at 0ms so nothing is ever scheduled.

import fallbackPortraitA from '../../assets/fallback-portrait-1.png';
import fallbackPortraitB from '../../assets/fallback-portrait-2.png';
import generation from '../../data/generation.json';
import rawStubDialogue from '../../data/stub-dialogue.json';
import type { AIAdapter } from './adapter.ts';
import {
  isDialogueBeat,
  isPortraitSheet,
  type BeatChoice,
  type ChoiceVerb,
  type DialogueBeat,
  type DialogueRequest,
  type PatienceTier,
  type PortraitRequest,
  type PortraitSheet,
} from './contract.ts';

/** Single tuning source for card costs — the canned data never states a cost. */
const VERB_COSTS: Record<ChoiceVerb, number> = generation.verbCosts;

/** Bundled expression sheets used whenever no portrait was generated. */
const FALLBACK_PORTRAITS: readonly string[] = [fallbackPortraitA, fallbackPortraitB];

// ── Canned-data shapes (JSON mirror of DialogueBeat, minus derived fields) ───

export interface StubChoice {
  label: string;
  verb: ChoiceVerb;
  clueReveals?: string[];
}

export interface StubBeat {
  npcLine: string;
  /** Optional per-patience-tier rewrites of npcLine — exactly 4 when present. */
  tierLines?: string[];
  choices: StubChoice[];
}

export interface StubScript {
  problem: string;
  beats: StubBeat[];
}

export interface StubLatency {
  dialogueMs: number;
  portraitMs: number;
}

export interface StubDialogueData {
  latency: StubLatency;
  portraitPromptPrefix: string;
  scripts: StubScript[];
  /** Script used when the customer's problem has no exact match. */
  fallback: StubScript;
}

export interface StubAdapterConfig {
  /** Raw canned data override; defaults to the bundled data/stub-dialogue.json. */
  data?: unknown;
  /** Simulated latency; defaults to the data file's `latency` block. */
  latencyMs?: StubLatency;
  /** Injected scheduler — unit tests pass a resolve-immediately double. */
  sleep?: (ms: number) => Promise<void>;
  /** Portrait pool override (tests); defaults to the bundled fallback sheets. */
  portraitPool?: readonly string[];
}

// ── Load-time validation (D3: bad data fails loudly at boot, never mid-beat) ──

function fail(what: string): never {
  throw new Error(`stub-dialogue: ${what}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${where} must be an object`);
  return value;
}

/** The verb whitelist IS the key set of generation.json's verbCosts. */
function isVerb(value: unknown): value is ChoiceVerb {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(VERB_COSTS, value);
}

function asStrings(value: unknown, where: string): string[] {
  if (!Array.isArray(value)) fail(`${where} must be an array of strings`);
  const strings = value.filter((entry): entry is string => typeof entry === 'string');
  if (strings.length !== value.length) fail(`${where} must contain only strings`);
  return strings;
}

function parseChoice(raw: unknown, where: string): StubChoice {
  const choice = asRecord(raw, where);
  const { label, verb, clueReveals } = choice;
  if (typeof label !== 'string' || label.length === 0) fail(`${where} needs a non-empty label`);
  if (!isVerb(verb)) fail(`${where} has an unknown verb`);
  const parsed: StubChoice = { label, verb };
  if (clueReveals !== undefined) parsed.clueReveals = asStrings(clueReveals, `${where}.clueReveals`);
  return parsed;
}

function parseBeat(raw: unknown, where: string): StubBeat {
  const beat = asRecord(raw, where);
  const { npcLine, choices, tierLines } = beat;
  if (typeof npcLine !== 'string' || npcLine.length === 0) fail(`${where} needs a non-empty npcLine`);
  if (!Array.isArray(choices) || choices.length < 3 || choices.length > 4) {
    fail(`${where} needs 3–4 choices`);
  }
  const parsedChoices = choices.map((choice, i) => parseChoice(choice, `${where} choice ${i}`));
  if (parsedChoices.filter((choice) => choice.verb === 'craft').length !== 1) {
    fail(`${where} needs exactly one craft card`);
  }
  const parsed: StubBeat = { npcLine, choices: parsedChoices };
  if (tierLines !== undefined) {
    const lines = asStrings(tierLines, `${where}.tierLines`);
    if (lines.length !== 4 || lines.some((line) => line.length === 0)) {
      fail(`${where}.tierLines must be exactly 4 non-empty strings`);
    }
    parsed.tierLines = lines;
  }
  return parsed;
}

function parseScript(raw: unknown, where: string): StubScript {
  const script = asRecord(raw, where);
  const { problem, beats } = script;
  if (typeof problem !== 'string') fail(`${where} needs a problem string`);
  if (!Array.isArray(beats) || beats.length === 0) fail(`${where} needs at least one beat`);
  return { problem, beats: beats.map((beat, i) => parseBeat(beat, `${where} beat ${i}`)) };
}

function parseLatency(raw: unknown): StubLatency {
  const latency = asRecord(raw, 'latency');
  const { dialogueMs, portraitMs } = latency;
  if (typeof dialogueMs !== 'number' || !Number.isFinite(dialogueMs)) {
    fail('latency.dialogueMs must be a number');
  }
  if (typeof portraitMs !== 'number' || !Number.isFinite(portraitMs)) {
    fail('latency.portraitMs must be a number');
  }
  return { dialogueMs, portraitMs };
}

/** Validate + normalize raw canned data. Throws (never returns partial data). */
export function loadStubDialogue(input: unknown): StubDialogueData {
  const root = asRecord(input, 'data');
  const { portraitPromptPrefix, scripts } = root;
  if (typeof portraitPromptPrefix !== 'string' || portraitPromptPrefix.length === 0) {
    fail('portraitPromptPrefix must be a non-empty string');
  }
  if (!Array.isArray(scripts)) fail('scripts must be an array');
  if (scripts.length === 0) fail('scripts must not be empty');
  const parsedScripts = scripts.map((script, i) => parseScript(script, `script ${i}`));
  const seenProblems = new Set<string>();
  parsedScripts.forEach((script, i) => {
    if (script.problem.length === 0) fail(`script ${i} must not have an empty problem (that is the fallback script's job)`);
    if (seenProblems.has(script.problem)) fail(`duplicate script problem: "${script.problem}"`);
    seenProblems.add(script.problem);
  });
  return {
    latency: parseLatency(root.latency),
    portraitPromptPrefix,
    scripts: parsedScripts,
    // JSON key is `fallback` — same name as the TS field, on purpose (D3
    // review: a `default`-keyed JSON with a `fallback`-named field made the
    // next reader grep for "fallback" in the data and find nothing).
    fallback: parseScript(root.fallback, 'fallback script'),
  };
}

// ── Pure selectors ──────────────────────────────────────────────────────────

/**
 * Exact problem match only — no trimming, no fuzzy matching. `data/stub-
 * dialogue.json` scripts are keyed byte-for-byte to `data/customers.json`
 * problems ONLY — a `selectScript` drift guard (tests/ai/stub.test.ts) pins
 * this. `data/generation.json`'s `traitTable.ailments` problems are a
 * DIFFERENT, larger pool (used to procedurally spawn customers, not the two
 * seeded ones) and are deliberately NOT covered by canned scripts in v1: most
 * of them fall through to `data.fallback`, which is a valid (if generic)
 * beat, not a crash. If a future unit starts spawning customers from
 * `traitTable.ailments`, extend the canned scripts (or accept the generic
 * fallback) rather than assuming coverage.
 */
export function selectScript(data: StubDialogueData, problem: string): StubScript {
  return data.scripts.find((script) => script.problem === problem) ?? data.fallback;
}

/** Every clue id that ANY beat of this script can reveal — the substitution
 * pool for `clueRevealsFor` below, so an observe fallback can never surface a
 * clue that belongs to a different customer's script. */
function scriptClueIds(script: StubScript): Set<string> {
  return new Set(script.beats.flatMap((beat) => beat.choices.flatMap((choice) => choice.clueReveals ?? [])));
}

/** History depth → beat index, clamped so the script can never be exhausted. */
export function beatIndexFor(historyLength: number, beatCount: number): number {
  const last = Math.max(0, beatCount - 1);
  if (!Number.isFinite(historyLength) || historyLength < 0) return 0;
  return Math.min(Math.floor(historyLength), last);
}

function lineForTier(beat: StubBeat, tier: PatienceTier): string {
  return beat.tierLines?.[tier] ?? beat.npcLine;
}

/**
 * Clue ids the card may reveal. Canned ids survive only while the request still
 * offers them — an empty `availableClues` means "everything is already
 * revealed" (matches the frozen proxy's rule, server/ai-proxy.mjs: "없으면
 * clueReveals를 비운다"), so it filters to `[]` like any other case, never to
 * "return every canned id unfiltered".
 *
 * An observe card left with nothing to reveal falls back to an available clue
 * so observing is never a wasted turn — but ONLY a clue that belongs to this
 * same script (`scriptClues`), so a customer's observe card can never surface
 * a different customer's clue (the label and the revealed clue would drift
 * apart with nothing to keep them related).
 */
function clueRevealsFor(
  choice: StubChoice,
  availableClues: { id: string }[],
  scriptClues: Set<string>,
): string[] {
  const canned = choice.clueReveals ?? [];
  const offered = new Set(availableClues.map((clue) => clue.id));
  const kept = canned.filter((id) => offered.has(id));
  if (kept.length === 0 && choice.verb === 'observe') {
    const candidate = availableClues.find((clue) => scriptClues.has(clue.id));
    if (candidate !== undefined) return [candidate.id];
  }
  return kept;
}

function toBeatChoice(
  choice: StubChoice,
  availableClues: { id: string }[],
  scriptClues: Set<string>,
): BeatChoice {
  const card: BeatChoice = {
    label: choice.label,
    verb: choice.verb,
    patienceCost: VERB_COSTS[choice.verb],
  };
  const reveals = clueRevealsFor(choice, availableClues, scriptClues);
  if (reveals.length > 0) card.clueReveals = reveals;
  return card;
}

/** Pure request → beat. Always returns freshly built objects (no shared state). */
export function resolveBeat(data: StubDialogueData, req: DialogueRequest): DialogueBeat {
  const script = selectScript(data, req.customer.problem);
  const beat = script.beats[beatIndexFor(req.history.length, script.beats.length)];
  const scriptClues = scriptClueIds(script);
  const built: DialogueBeat = {
    npcLine: lineForTier(beat, req.patienceTier),
    choices: beat.choices.map((choice) => toBeatChoice(choice, req.availableClues, scriptClues)),
  };
  // Defensive self-check only — loadStubDialogue already validated every
  // field this builds from, so this should never fire on real data. It
  // exists so a future bug in this construction logic (not the data) fails
  // loudly instead of silently shipping a beat the live path's own gate
  // (isDialogueBeat) would have rejected.
  if (!isDialogueBeat(built)) {
    fail(`internal: resolved beat for "${script.problem}" failed isDialogueBeat (construction bug, not a data error)`);
  }
  return built;
}

/** FNV-1a — deterministic across runs and platforms, order-sensitive. */
export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Same traits → same bundled sheet, forever. */
export function pickPortraitUrl(traits: string[], pool: readonly string[]): string {
  if (pool.length === 0) fail('portrait pool is empty');
  return pool[stableHash(traits.join('|')) % pool.length];
}

// ── Adapter ─────────────────────────────────────────────────────────────────

/** Default scheduler: the one real timer on the AI path (§3-3). */
function realSleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Canned adapter. Never rejects and never touches the network: every failure
 * mode is a data problem, and those throw at construction time instead.
 */
export function createStubAdapter(config: StubAdapterConfig = {}): AIAdapter {
  const data = loadStubDialogue(config.data ?? rawStubDialogue);
  const latency = config.latencyMs ?? data.latency;
  const sleep = config.sleep ?? realSleep;
  const pool = config.portraitPool ?? FALLBACK_PORTRAITS;

  return {
    mode: 'stub',
    async dialogue(req: DialogueRequest): Promise<DialogueBeat> {
      await sleep(latency.dialogueMs);
      return resolveBeat(data, req);
    },
    async portrait(req: PortraitRequest): Promise<PortraitSheet> {
      await sleep(latency.portraitMs);
      const sheet: PortraitSheet = {
        b64: '',
        prompt: `${data.portraitPromptPrefix}${req.traits.join(', ')}`,
        url: pickPortraitUrl(req.traits, pool),
      };
      // Defensive self-check, same rationale as resolveBeat's above: this
      // should never fire (pickPortraitUrl always returns a non-empty pool
      // member), but a stub PortraitSheet the live path's own gate would
      // reject (empty b64 AND empty/missing url) must never reach a caller.
      if (!isPortraitSheet(sheet)) {
        fail('internal: generated portrait sheet failed isPortraitSheet (construction bug, not a data error)');
      }
      return sheet;
    },
  };
}
