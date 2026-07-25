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
import type {
  BeatChoice,
  ChoiceVerb,
  DialogueBeat,
  DialogueRequest,
  PatienceTier,
  PortraitRequest,
  PortraitSheet,
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
  return {
    latency: parseLatency(root.latency),
    portraitPromptPrefix,
    scripts: scripts.map((script, i) => parseScript(script, `script ${i}`)),
    fallback: parseScript(root.default, 'default script'),
  };
}

// ── Pure selectors ──────────────────────────────────────────────────────────

/** Exact problem match only — no trimming, no fuzzy matching. */
export function selectScript(data: StubDialogueData, problem: string): StubScript {
  return data.scripts.find((script) => script.problem === problem) ?? data.fallback;
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
 * offers them; an observe card left with nothing falls back to the first
 * available clue so observing is never a wasted turn.
 */
function clueRevealsFor(choice: StubChoice, availableClues: { id: string }[]): string[] {
  const canned = choice.clueReveals ?? [];
  if (availableClues.length === 0) return [...canned];
  const offered = new Set(availableClues.map((clue) => clue.id));
  const kept = canned.filter((id) => offered.has(id));
  if (kept.length === 0 && choice.verb === 'observe') return [availableClues[0].id];
  return kept;
}

function toBeatChoice(choice: StubChoice, availableClues: { id: string }[]): BeatChoice {
  const card: BeatChoice = {
    label: choice.label,
    verb: choice.verb,
    patienceCost: VERB_COSTS[choice.verb],
  };
  const reveals = clueRevealsFor(choice, availableClues);
  if (reveals.length > 0) card.clueReveals = reveals;
  return card;
}

/** Pure request → beat. Always returns freshly built objects (no shared state). */
export function resolveBeat(data: StubDialogueData, req: DialogueRequest): DialogueBeat {
  const script = selectScript(data, req.customer.problem);
  const beat = script.beats[beatIndexFor(req.history.length, script.beats.length)];
  return {
    npcLine: lineForTier(beat, req.patienceTier),
    choices: beat.choices.map((choice) => toBeatChoice(choice, req.availableClues)),
  };
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
      return {
        b64: '',
        prompt: `${data.portraitPromptPrefix}${req.traits.join(', ')}`,
        url: pickPortraitUrl(req.traits, pool),
      };
    },
  };
}
