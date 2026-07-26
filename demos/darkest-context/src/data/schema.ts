// u4 — data-layer schema. Structural types for the six frozen data files (PRD §3).
//
// Ids are ascii snake_case everywhere; Korean strings are display text only.
// Every "*Ref" field is a dotted path into data/tuning.json — the balance-as-data
// seam (INV-8): logic reads numbers through `resolveTuningRef`, never inline.

// ── heroes.json ──────────────────────────────────────────────────────────────

export const STAT_KEYS = ['str', 'agi', 'int', 'wis', 'cha', 'con'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

/** 직업 기본 행동 — the action a unit falls back to on timeout / gauge 100 (PRD §2.2). */
export const CLASS_DEFAULT_ACTIONS = ['defend', 'wait', 'evade', 'analyze'] as const;
export type ClassDefaultAction = (typeof CLASS_DEFAULT_ACTIONS)[number];

export interface DefaultPrompt {
  id: string;
  lines: string[];
}

export interface BaseSkill {
  id: string;
  name: string;
  text: string;
}

export interface Hero {
  id: string;
  name: string;
  className: string;
  stats: Stats;
  hp: number;
  defaultPrompt: DefaultPrompt;
  baseSkill: BaseSkill;
  classDefaultAction: ClassDefaultAction;
}

// ── cards.json ───────────────────────────────────────────────────────────────

export const CARD_TYPES = ['prompt', 'skill', 'mcp'] as const;
export type CardType = (typeof CARD_TYPES)[number];
export type SlotKind = CardType;

/** Prompt cards are sentence-only and carry `null`; skill/mcp cards name an engine effect. */
export interface EngineHook {
  kind: string;
  actionId?: string;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  slotKind: SlotKind;
  text: string;
  engineHook: EngineHook | null;
  charges?: number;
}

// ── map.json ─────────────────────────────────────────────────────────────────

export const TILE_KINDS = [
  'combat',
  'combat_final',
  'training',
  'puzzle',
  'choice',
  'rest',
] as const;
export type TileKind = (typeof TILE_KINDS)[number];

export interface Tile {
  id: string;
  kind: TileKind;
  next: string[];
  walkDurationRef: string;
  rosterId?: string;
  agendaId?: string;
  rewardId?: string;
}

export interface GameMap {
  startTileId: string;
  tiles: Tile[];
}

// ── encounters.json ──────────────────────────────────────────────────────────

/** Monsters never call the adapter — behaviour is a declared table (PRD §2.2). */
export const BEHAVIOR_RULES = ['lowest_hp_hero', 'highest_gauge_hero'] as const;
export type BehaviorRule = (typeof BEHAVIOR_RULES)[number];

export interface MonsterBehavior {
  rule: BehaviorRule;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  damage: number;
  behavior: MonsterBehavior;
  gaugeOnHitExtraRef?: string;
  gaugeOnAttackRef?: string;
}

export interface RosterEntry {
  instanceId: string;
  monsterId: string;
}

/** Declared entry order is the `index` tieBreak key for enemies (PRD §2.2). */
export interface Roster {
  id: string;
  tileId: string;
  entries: RosterEntry[];
}

export interface Encounters {
  monsters: Monster[];
  rosters: Roster[];
}

// ── council.json ─────────────────────────────────────────────────────────────

export const AGENDA_KINDS = ['puzzle', 'choice'] as const;
export type AgendaKind = (typeof AGENDA_KINDS)[number];

export interface AgendaOption {
  id: string;
  text: string;
  /** The stat whose highest holder casts the deciding vote on a tie (PRD §2.6). */
  relatedStat: StatKey;
}

export interface Agenda {
  id: string;
  kind: AgendaKind;
  prompt: string;
  /** Authored answer for 퍼즐; `null` for 선택이벤트 — required key, nullable value. */
  answerOptionId: string | null;
  hintLine: string | null;
  options: AgendaOption[];
}

export const GRANT_KINDS = ['none', 'fixed', 'draft', 'conditional'] as const;
export type GrantKind = (typeof GRANT_KINDS)[number];

export interface GrantBranch {
  cardId?: string;
  gaugeAllRef?: string;
}

export interface NoGrant {
  kind: 'none';
}

export interface FixedGrant {
  kind: 'fixed';
  cardId: string;
}

export interface DraftGrant {
  kind: 'draft';
  optionCardIds: string[];
  countRef: string;
  pickCountRef: string;
}

export interface ConditionalGrant {
  kind: 'conditional';
  on: string;
  branches: Record<string, GrantBranch>;
}

export type Grant = NoGrant | FixedGrant | DraftGrant | ConditionalGrant;

export interface Council {
  agendas: Agenda[];
  /** Keyed by tile id — the reward table of PRD §2.5. */
  rewards: Record<string, Grant>;
}

// ── tuning.json ──────────────────────────────────────────────────────────────

export interface GaugeTiers {
  calm: number;
  uneasy: number;
  limit: number;
  overload: number;
}

export interface GaugeRest {
  think: number;
  clearTo: number;
}

export interface GaugeTuning {
  onHit: number;
  spamGolemExtra: number;
  spiritAttack: number;
  puzzleWrong: number;
  max: number;
  tiers: GaugeTiers;
  rest: GaugeRest;
}

/** A single hit, or a deterministic multi-hit sequence (「이단 베기」 = 2연격). */
export type DamageValue = number | number[];

export interface LatencyTuning {
  stub: number;
  unit: number;
  e2e: string;
  scripted: number[];
}

export interface TimeoutTuning {
  stub: number;
  live: number;
  healthProbe: number;
}

export interface WalkTuning {
  durationMs: number;
  testDurationMs: number;
}

export interface SlotTuning {
  prompt: number;
  skill: number;
  mcp: number;
}

export interface DraftTuning {
  optionCount: number;
  pickCount: number;
}

export const TIE_BREAK_POLICIES = ['index', 'random'] as const;
export type TieBreakPolicy = (typeof TIE_BREAK_POLICIES)[number];

export interface TieBreakTuning {
  stub: TieBreakPolicy;
  live: TieBreakPolicy;
  test: TieBreakPolicy;
}

export interface ChatterTuning {
  minPerWalk: number;
  maxPerWalk: number;
}

/**
 * The situation thresholds every stub lookup runs on (PRD §2.2).
 *
 * They decide WHICH authored line a unit says on a given turn, so they are run-outcome
 * balance data exactly like a damage number — a drift here flips a run from clear to
 * defeat, and it belongs in data/ where the gates can see it (INV-8).
 */
export interface BucketTuning {
  /** Turn number that still counts as the opening beat. */
  openingTurn: number;
  /** hp/hpMax below which a unit reads as hurt. */
  hurtBelowRatio: number;
  /** hp/hpMax below which an enemy reads as nearly down. */
  enemyLowBelowRatio: number;
}

export interface Tuning {
  gauge: GaugeTuning;
  /** Keyed by base action id and by card id — no dice, fixed values (PRD §2.5). */
  damage: Record<string, DamageValue>;
  latency: LatencyTuning;
  timeout: TimeoutTuning;
  walk: WalkTuning;
  slots: SlotTuning;
  draft: DraftTuning;
  tieBreak: TieBreakTuning;
  chatter: ChatterTuning;
  bucket: BucketTuning;
}

// ── the coherent bundle ──────────────────────────────────────────────────────

export interface GameData {
  heroes: Hero[];
  cards: Card[];
  map: GameMap;
  encounters: Encounters;
  council: Council;
  tuning: Tuning;
}
