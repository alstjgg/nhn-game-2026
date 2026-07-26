// u4 — data loaders. Validate the frozen shapes of PRD §3 and FAIL LOUDLY, naming the
// offending entity + field, so a malformed data file surfaces at startup instead of
// half-loading into the engine. No silent coercion, no defaults for missing structural
// fields — a required key with a nullable VALUE (engineHook, answerOptionId, hintLine)
// must still be present.
//
// Cross-file references (grants → cards, rosters → tiles, every "*Ref" → tuning) are
// checked in ONE pass inside `loadGameData`; `loadBundledGameData` is the memoized seam
// the rest of the demo imports.
import {
  BEHAVIOR_RULES,
  CARD_TYPES,
  CLASS_DEFAULT_ACTIONS,
  AGENDA_KINDS,
  GRANT_KINDS,
  STAT_KEYS,
  TILE_KINDS,
  TIE_BREAK_POLICIES,
} from './schema';
import type {
  Agenda,
  AgendaOption,
  BaseSkill,
  BucketTuning,
  Card,
  ChatterTuning,
  Council,
  DamageValue,
  DefaultPrompt,
  DraftTuning,
  Encounters,
  EngineHook,
  GameData,
  GameMap,
  GaugeTuning,
  Grant,
  GrantBranch,
  Hero,
  LatencyTuning,
  Monster,
  Roster,
  RosterEntry,
  SlotTuning,
  Stats,
  Tile,
  TimeoutTuning,
  TieBreakTuning,
  Tuning,
  WalkTuning,
} from './schema';

import heroesJson from '../../data/heroes.json';
import cardsJson from '../../data/cards.json';
import mapJson from '../../data/map.json';
import encountersJson from '../../data/encounters.json';
import councilJson from '../../data/council.json';
import tuningJson from '../../data/tuning.json';

// ── primitive field validators ───────────────────────────────────────────────

function typeName(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function requireString(v: unknown, ctx: string, field: string): string {
  if (typeof v !== 'string') {
    throw new Error(`${ctx}: field '${field}' must be a string (got ${typeName(v)})`);
  }
  return v;
}

function requireNumber(v: unknown, ctx: string, field: string): number {
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new Error(`${ctx}: field '${field}' must be a number (got ${typeName(v)})`);
  }
  return v;
}

function requireArray(v: unknown, ctx: string, field: string): unknown[] {
  if (!Array.isArray(v)) {
    throw new Error(`${ctx}: field '${field}' must be an array (got ${typeName(v)})`);
  }
  return v;
}

function requireRecord(v: unknown, ctx: string, field: string): Record<string, unknown> {
  if (!isRecord(v)) {
    throw new Error(`${ctx}: field '${field}' must be an object (got ${typeName(v)})`);
  }
  return v;
}

function requireEnum<T extends string>(
  v: unknown,
  ctx: string,
  field: string,
  allowed: readonly T[],
): T {
  const raw = requireString(v, ctx, field);
  const match = allowed.find((candidate) => candidate === raw);
  if (match === undefined) {
    throw new Error(`${ctx}: field '${field}' must be one of ${allowed.join(' | ')} (got '${raw}')`);
  }
  return match;
}

function requireStringArray(v: unknown, ctx: string, field: string): string[] {
  return requireArray(v, ctx, field).map((item, i) => requireString(item, ctx, `${field}[${i}]`));
}

function requireNumberArray(v: unknown, ctx: string, field: string): number[] {
  return requireArray(v, ctx, field).map((item, i) => requireNumber(item, ctx, `${field}[${i}]`));
}

/** A required key whose value may be `null` — presence is still mandatory. */
function readNullableString(raw: Record<string, unknown>, ctx: string, field: string): string | null {
  if (!(field in raw)) {
    throw new Error(`${ctx}: required field '${field}' is missing (it may be null, not absent)`);
  }
  const v = raw[field];
  return v === null ? null : requireString(v, ctx, field);
}

function readOptionalString(
  raw: Record<string, unknown>,
  ctx: string,
  field: string,
): string | undefined {
  return raw[field] === undefined ? undefined : requireString(raw[field], ctx, field);
}

function requireObjectAt(v: unknown, ctx: string): Record<string, unknown> {
  if (!isRecord(v)) throw new Error(`${ctx}: must be an object (got ${typeName(v)})`);
  return v;
}

function requireUniqueId(seen: Set<string>, id: string, ctx: string, entity: string): string {
  if (seen.has(id)) throw new Error(`${ctx}: duplicate ${entity} id '${id}' — ids must be unique`);
  seen.add(id);
  return id;
}

// ── heroes.json ──────────────────────────────────────────────────────────────

function validateStats(v: unknown, ctx: string): Stats {
  const rec = requireRecord(v, ctx, 'stats');
  const statCtx = `${ctx}.stats`;
  return {
    str: requireNumber(rec.str, statCtx, 'str'),
    agi: requireNumber(rec.agi, statCtx, 'agi'),
    int: requireNumber(rec.int, statCtx, 'int'),
    wis: requireNumber(rec.wis, statCtx, 'wis'),
    cha: requireNumber(rec.cha, statCtx, 'cha'),
    con: requireNumber(rec.con, statCtx, 'con'),
  };
}

function validateDefaultPrompt(v: unknown, ctx: string): DefaultPrompt {
  const rec = requireRecord(v, ctx, 'defaultPrompt');
  const promptCtx = `${ctx}.defaultPrompt`;
  const lines = requireStringArray(rec.lines, promptCtx, 'lines');
  return { id: requireString(rec.id, promptCtx, 'id'), lines };
}

function validateBaseSkill(v: unknown, ctx: string): BaseSkill {
  const rec = requireRecord(v, ctx, 'baseSkill');
  const skillCtx = `${ctx}.baseSkill`;
  return {
    id: requireString(rec.id, skillCtx, 'id'),
    name: requireString(rec.name, skillCtx, 'name'),
    text: requireString(rec.text, skillCtx, 'text'),
  };
}

export function loadHeroes(input: unknown): Hero[] {
  if (!Array.isArray(input)) {
    throw new Error(`heroes: must be an array (got ${typeName(input)})`);
  }
  const seen = new Set<string>();
  return input.map((raw, i): Hero => {
    const ctx = `heroes[${i}]`;
    const rec = requireObjectAt(raw, ctx);
    return {
      id: requireUniqueId(seen, requireString(rec.id, ctx, 'id'), ctx, 'hero'),
      name: requireString(rec.name, ctx, 'name'),
      className: requireString(rec.className, ctx, 'className'),
      stats: validateStats(rec.stats, ctx),
      hp: requireNumber(rec.hp, ctx, 'hp'),
      defaultPrompt: validateDefaultPrompt(rec.defaultPrompt, ctx),
      baseSkill: validateBaseSkill(rec.baseSkill, ctx),
      classDefaultAction: requireEnum(
        rec.classDefaultAction,
        ctx,
        'classDefaultAction',
        CLASS_DEFAULT_ACTIONS,
      ),
    };
  });
}

// ── cards.json ───────────────────────────────────────────────────────────────

function readEngineHook(raw: Record<string, unknown>, ctx: string): EngineHook | null {
  if (!('engineHook' in raw)) {
    throw new Error(`${ctx}: required field 'engineHook' is missing (it may be null, not absent)`);
  }
  const v = raw.engineHook;
  if (v === null) return null;
  const rec = requireRecord(v, ctx, 'engineHook');
  const hookCtx = `${ctx}.engineHook`;
  const hook: EngineHook = { kind: requireString(rec.kind, hookCtx, 'kind') };
  const actionId = readOptionalString(rec, hookCtx, 'actionId');
  if (actionId !== undefined) hook.actionId = actionId;
  return hook;
}

export function loadCards(input: unknown): Card[] {
  if (!Array.isArray(input)) {
    throw new Error(`cards: must be an array (got ${typeName(input)})`);
  }
  const seen = new Set<string>();
  return input.map((raw, i): Card => {
    const ctx = `cards[${i}]`;
    const rec = requireObjectAt(raw, ctx);
    const card: Card = {
      id: requireUniqueId(seen, requireString(rec.id, ctx, 'id'), ctx, 'card'),
      name: requireString(rec.name, ctx, 'name'),
      type: requireEnum(rec.type, ctx, 'type', CARD_TYPES),
      slotKind: requireEnum(rec.slotKind, ctx, 'slotKind', CARD_TYPES),
      text: requireString(rec.text, ctx, 'text'),
      engineHook: readEngineHook(rec, ctx),
    };
    if (rec.charges !== undefined) card.charges = requireNumber(rec.charges, ctx, 'charges');
    return card;
  });
}

// ── map.json ─────────────────────────────────────────────────────────────────

export function loadMap(input: unknown): GameMap {
  if (!isRecord(input)) {
    throw new Error(`map: must be an object (got ${typeName(input)})`);
  }
  const startTileId = requireString(input.startTileId, 'map', 'startTileId');
  const seen = new Set<string>();
  const tiles = requireArray(input.tiles, 'map', 'tiles').map((raw, i): Tile => {
    const ctx = `map.tiles[${i}]`;
    const rec = requireObjectAt(raw, ctx);
    const tile: Tile = {
      id: requireUniqueId(seen, requireString(rec.id, ctx, 'id'), ctx, 'tile'),
      kind: requireEnum(rec.kind, ctx, 'kind', TILE_KINDS),
      next: requireStringArray(rec.next, ctx, 'next'),
      walkDurationRef: requireString(rec.walkDurationRef, ctx, 'walkDurationRef'),
    };
    const rosterId = readOptionalString(rec, ctx, 'rosterId');
    if (rosterId !== undefined) tile.rosterId = rosterId;
    const agendaId = readOptionalString(rec, ctx, 'agendaId');
    if (agendaId !== undefined) tile.agendaId = agendaId;
    const rewardId = readOptionalString(rec, ctx, 'rewardId');
    if (rewardId !== undefined) tile.rewardId = rewardId;
    return tile;
  });
  return { startTileId, tiles };
}

// ── encounters.json ──────────────────────────────────────────────────────────

function validateMonster(raw: unknown, ctx: string): Monster {
  const rec = requireObjectAt(raw, ctx);
  const behaviorRec = requireRecord(rec.behavior, ctx, 'behavior');
  const monster: Monster = {
    id: requireString(rec.id, ctx, 'id'),
    name: requireString(rec.name, ctx, 'name'),
    hp: requireNumber(rec.hp, ctx, 'hp'),
    damage: requireNumber(rec.damage, ctx, 'damage'),
    behavior: {
      rule: requireEnum(behaviorRec.rule, `${ctx}.behavior`, 'rule', BEHAVIOR_RULES),
    },
  };
  const onHitExtra = readOptionalString(rec, ctx, 'gaugeOnHitExtraRef');
  if (onHitExtra !== undefined) monster.gaugeOnHitExtraRef = onHitExtra;
  const onAttack = readOptionalString(rec, ctx, 'gaugeOnAttackRef');
  if (onAttack !== undefined) monster.gaugeOnAttackRef = onAttack;
  return monster;
}

function validateRoster(raw: unknown, ctx: string): Roster {
  const rec = requireObjectAt(raw, ctx);
  const entries = requireArray(rec.entries, ctx, 'entries').map((entryRaw, i): RosterEntry => {
    const entryCtx = `${ctx}.entries[${i}]`;
    const entryRec = requireObjectAt(entryRaw, entryCtx);
    return {
      instanceId: requireString(entryRec.instanceId, entryCtx, 'instanceId'),
      monsterId: requireString(entryRec.monsterId, entryCtx, 'monsterId'),
    };
  });
  return {
    id: requireString(rec.id, ctx, 'id'),
    tileId: requireString(rec.tileId, ctx, 'tileId'),
    entries,
  };
}

export function loadEncounters(input: unknown): Encounters {
  if (!isRecord(input)) {
    throw new Error(`encounters: must be an object (got ${typeName(input)})`);
  }
  const monsters = requireArray(input.monsters, 'encounters', 'monsters').map((raw, i) =>
    validateMonster(raw, `encounters.monsters[${i}]`),
  );
  const rosters = requireArray(input.rosters, 'encounters', 'rosters').map((raw, i) =>
    validateRoster(raw, `encounters.rosters[${i}]`),
  );
  return { monsters, rosters };
}

// ── council.json ─────────────────────────────────────────────────────────────

function validateAgenda(raw: unknown, ctx: string): Agenda {
  const rec = requireObjectAt(raw, ctx);
  const options = requireArray(rec.options, ctx, 'options').map((optionRaw, i): AgendaOption => {
    const optionCtx = `${ctx}.options[${i}]`;
    const optionRec = requireObjectAt(optionRaw, optionCtx);
    return {
      id: requireString(optionRec.id, optionCtx, 'id'),
      text: requireString(optionRec.text, optionCtx, 'text'),
      relatedStat: requireEnum(optionRec.relatedStat, optionCtx, 'relatedStat', STAT_KEYS),
    };
  });
  return {
    id: requireString(rec.id, ctx, 'id'),
    kind: requireEnum(rec.kind, ctx, 'kind', AGENDA_KINDS),
    prompt: requireString(rec.prompt, ctx, 'prompt'),
    answerOptionId: readNullableString(rec, ctx, 'answerOptionId'),
    hintLine: readNullableString(rec, ctx, 'hintLine'),
    options,
  };
}

function validateGrantBranch(raw: unknown, ctx: string): GrantBranch {
  const rec = requireObjectAt(raw, ctx);
  const branch: GrantBranch = {};
  const cardId = readOptionalString(rec, ctx, 'cardId');
  if (cardId !== undefined) branch.cardId = cardId;
  const gaugeAllRef = readOptionalString(rec, ctx, 'gaugeAllRef');
  if (gaugeAllRef !== undefined) branch.gaugeAllRef = gaugeAllRef;
  return branch;
}

function validateGrant(raw: unknown, ctx: string): Grant {
  const rec = requireObjectAt(raw, ctx);
  const kind = requireEnum(rec.kind, ctx, 'kind', GRANT_KINDS);
  switch (kind) {
    case 'none':
      return { kind: 'none' };
    case 'fixed':
      return { kind: 'fixed', cardId: requireString(rec.cardId, ctx, 'cardId') };
    case 'draft':
      return {
        kind: 'draft',
        optionCardIds: requireStringArray(rec.optionCardIds, ctx, 'optionCardIds'),
        countRef: requireString(rec.countRef, ctx, 'countRef'),
        pickCountRef: requireString(rec.pickCountRef, ctx, 'pickCountRef'),
      };
    case 'conditional': {
      const on = requireString(rec.on, ctx, 'on');
      const branchesRec = requireRecord(rec.branches, ctx, 'branches');
      const branches: Record<string, GrantBranch> = {};
      for (const [key, value] of Object.entries(branchesRec)) {
        branches[key] = validateGrantBranch(value, `${ctx}.branches.${key}`);
      }
      return { kind: 'conditional', on, branches };
    }
  }
}

export function loadCouncil(input: unknown): Council {
  if (!isRecord(input)) {
    throw new Error(`council: must be an object (got ${typeName(input)})`);
  }
  const agendas = requireArray(input.agendas, 'council', 'agendas').map((raw, i) =>
    validateAgenda(raw, `council.agendas[${i}]`),
  );
  const rewardsRec = requireRecord(input.rewards, 'council', 'rewards');
  const rewards: Record<string, Grant> = {};
  for (const [tileId, raw] of Object.entries(rewardsRec)) {
    rewards[tileId] = validateGrant(raw, `council.rewards.${tileId}`);
  }
  return { agendas, rewards };
}

// ── tuning.json ──────────────────────────────────────────────────────────────

function validateGauge(rec: Record<string, unknown>): GaugeTuning {
  const ctx = 'tuning.gauge';
  const tiersRec = requireRecord(rec.tiers, ctx, 'tiers');
  const restRec = requireRecord(rec.rest, ctx, 'rest');
  return {
    onHit: requireNumber(rec.onHit, ctx, 'onHit'),
    spamGolemExtra: requireNumber(rec.spamGolemExtra, ctx, 'spamGolemExtra'),
    spiritAttack: requireNumber(rec.spiritAttack, ctx, 'spiritAttack'),
    puzzleWrong: requireNumber(rec.puzzleWrong, ctx, 'puzzleWrong'),
    max: requireNumber(rec.max, ctx, 'max'),
    tiers: {
      calm: requireNumber(tiersRec.calm, `${ctx}.tiers`, 'calm'),
      uneasy: requireNumber(tiersRec.uneasy, `${ctx}.tiers`, 'uneasy'),
      limit: requireNumber(tiersRec.limit, `${ctx}.tiers`, 'limit'),
      overload: requireNumber(tiersRec.overload, `${ctx}.tiers`, 'overload'),
    },
    rest: {
      think: requireNumber(restRec.think, `${ctx}.rest`, 'think'),
      clearTo: requireNumber(restRec.clearTo, `${ctx}.rest`, 'clearTo'),
    },
  };
}

function validateDamage(rec: Record<string, unknown>): Record<string, DamageValue> {
  const ctx = 'tuning.damage';
  const damage: Record<string, DamageValue> = {};
  for (const [key, value] of Object.entries(rec)) {
    damage[key] = Array.isArray(value)
      ? requireNumberArray(value, ctx, key)
      : requireNumber(value, ctx, key);
  }
  return damage;
}

function validateLatency(rec: Record<string, unknown>): LatencyTuning {
  const ctx = 'tuning.latency';
  return {
    stub: requireNumber(rec.stub, ctx, 'stub'),
    unit: requireNumber(rec.unit, ctx, 'unit'),
    e2e: requireString(rec.e2e, ctx, 'e2e'),
    scripted: requireNumberArray(rec.scripted, ctx, 'scripted'),
  };
}

function validateTimeout(rec: Record<string, unknown>): TimeoutTuning {
  const ctx = 'tuning.timeout';
  return {
    stub: requireNumber(rec.stub, ctx, 'stub'),
    live: requireNumber(rec.live, ctx, 'live'),
    healthProbe: requireNumber(rec.healthProbe, ctx, 'healthProbe'),
  };
}

function validateWalk(rec: Record<string, unknown>): WalkTuning {
  const ctx = 'tuning.walk';
  return {
    durationMs: requireNumber(rec.durationMs, ctx, 'durationMs'),
    testDurationMs: requireNumber(rec.testDurationMs, ctx, 'testDurationMs'),
  };
}

function validateSlots(rec: Record<string, unknown>): SlotTuning {
  const ctx = 'tuning.slots';
  return {
    prompt: requireNumber(rec.prompt, ctx, 'prompt'),
    skill: requireNumber(rec.skill, ctx, 'skill'),
    mcp: requireNumber(rec.mcp, ctx, 'mcp'),
  };
}

function validateDraft(rec: Record<string, unknown>): DraftTuning {
  const ctx = 'tuning.draft';
  return {
    optionCount: requireNumber(rec.optionCount, ctx, 'optionCount'),
    pickCount: requireNumber(rec.pickCount, ctx, 'pickCount'),
  };
}

function validateTieBreak(rec: Record<string, unknown>): TieBreakTuning {
  const ctx = 'tuning.tieBreak';
  return {
    stub: requireEnum(rec.stub, ctx, 'stub', TIE_BREAK_POLICIES),
    live: requireEnum(rec.live, ctx, 'live', TIE_BREAK_POLICIES),
    test: requireEnum(rec.test, ctx, 'test', TIE_BREAK_POLICIES),
  };
}

function validateChatter(rec: Record<string, unknown>): ChatterTuning {
  const ctx = 'tuning.chatter';
  return {
    minPerWalk: requireNumber(rec.minPerWalk, ctx, 'minPerWalk'),
    maxPerWalk: requireNumber(rec.maxPerWalk, ctx, 'maxPerWalk'),
  };
}

function validateBucket(rec: Record<string, unknown>): BucketTuning {
  const ctx = 'tuning.bucket';
  return {
    openingTurn: requireNumber(rec.openingTurn, ctx, 'openingTurn'),
    hurtBelowRatio: requireNumber(rec.hurtBelowRatio, ctx, 'hurtBelowRatio'),
    enemyLowBelowRatio: requireNumber(rec.enemyLowBelowRatio, ctx, 'enemyLowBelowRatio'),
  };
}

export function loadTuning(input: unknown): Tuning {
  if (!isRecord(input)) {
    throw new Error(`tuning: must be an object (got ${typeName(input)})`);
  }
  const gauge = requireRecord(input.gauge, 'tuning', 'gauge');
  const damage = requireRecord(input.damage, 'tuning', 'damage');
  const latency = requireRecord(input.latency, 'tuning', 'latency');
  const timeout = requireRecord(input.timeout, 'tuning', 'timeout');
  const walk = requireRecord(input.walk, 'tuning', 'walk');
  const slots = requireRecord(input.slots, 'tuning', 'slots');
  const draft = requireRecord(input.draft, 'tuning', 'draft');
  const tieBreak = requireRecord(input.tieBreak, 'tuning', 'tieBreak');
  const chatter = requireRecord(input.chatter, 'tuning', 'chatter');
  const bucket = requireRecord(input.bucket, 'tuning', 'bucket');
  return {
    gauge: validateGauge(gauge),
    damage: validateDamage(damage),
    latency: validateLatency(latency),
    timeout: validateTimeout(timeout),
    walk: validateWalk(walk),
    slots: validateSlots(slots),
    draft: validateDraft(draft),
    tieBreak: validateTieBreak(tieBreak),
    chatter: validateChatter(chatter),
    bucket: validateBucket(bucket),
  };
}

// ── tuning references + grant helpers ────────────────────────────────────────

/**
 * Reads a dotted path (`gauge.onHit`, `walk.durationMs`) out of the tuning object.
 * The single seam through which logic may read a tunable number (INV-8).
 */
export function resolveTuningRef(tuning: Tuning, ref: string): number {
  let cursor: unknown = tuning;
  for (const part of ref.split('.')) {
    if (!isRecord(cursor)) {
      cursor = undefined;
      break;
    }
    cursor = cursor[part];
  }
  if (typeof cursor !== 'number' || Number.isNaN(cursor)) {
    throw new Error(
      `tuning ref '${ref}' does not resolve to a number in data/tuning.json (got ${typeName(cursor)})`,
    );
  }
  return cursor;
}

/** Every card id a grant can hand out, across all its variants. */
export function grantedCardIds(grant: Grant): string[] {
  switch (grant.kind) {
    case 'none':
      return [];
    case 'fixed':
      return [grant.cardId];
    case 'draft':
      return [...grant.optionCardIds];
    case 'conditional':
      return Object.values(grant.branches)
        .map((branch) => branch.cardId)
        .filter((cardId): cardId is string => typeof cardId === 'string');
  }
}

// ── cross-file reference pass ────────────────────────────────────────────────

function requireMember(set: Set<string>, id: string, what: string): void {
  if (!set.has(id)) throw new Error(`${what} '${id}' is not declared in the data files`);
}

function crossValidate(data: GameData): void {
  const cardIds = new Set(data.cards.map((card) => card.id));
  const tileIds = new Set(data.map.tiles.map((tile) => tile.id));
  const monsterIds = new Set(data.encounters.monsters.map((monster) => monster.id));
  const rosterIds = new Set(data.encounters.rosters.map((roster) => roster.id));
  const agendaIds = new Set(data.council.agendas.map((agenda) => agenda.id));
  const rewardIds = new Set(Object.keys(data.council.rewards));

  requireMember(tileIds, data.map.startTileId, 'map.startTileId → tile');
  for (const tile of data.map.tiles) {
    resolveTuningRef(data.tuning, tile.walkDurationRef);
    for (const next of tile.next) requireMember(tileIds, next, `map.tiles[${tile.id}].next → tile`);
    if (tile.rosterId !== undefined) {
      requireMember(rosterIds, tile.rosterId, `map.tiles[${tile.id}].rosterId → roster`);
    }
    if (tile.agendaId !== undefined) {
      requireMember(agendaIds, tile.agendaId, `map.tiles[${tile.id}].agendaId → agenda`);
    }
    if (tile.rewardId !== undefined) {
      requireMember(rewardIds, tile.rewardId, `map.tiles[${tile.id}].rewardId → grant`);
    }
  }

  for (const monster of data.encounters.monsters) {
    if (monster.gaugeOnHitExtraRef !== undefined) {
      resolveTuningRef(data.tuning, monster.gaugeOnHitExtraRef);
    }
    if (monster.gaugeOnAttackRef !== undefined) {
      resolveTuningRef(data.tuning, monster.gaugeOnAttackRef);
    }
  }
  for (const roster of data.encounters.rosters) {
    requireMember(tileIds, roster.tileId, `encounters.rosters[${roster.id}].tileId → tile`);
    for (const entry of roster.entries) {
      requireMember(
        monsterIds,
        entry.monsterId,
        `encounters roster entry '${entry.instanceId}' → monster`,
      );
    }
  }

  for (const agenda of data.council.agendas) {
    if (agenda.answerOptionId !== null) {
      const optionIds = new Set(agenda.options.map((option) => option.id));
      requireMember(
        optionIds,
        agenda.answerOptionId,
        `council.agendas[${agenda.id}].answerOptionId → own option`,
      );
    }
  }

  for (const [tileId, grant] of Object.entries(data.council.rewards)) {
    const where = `council.rewards.${tileId}`;
    for (const cardId of grantedCardIds(grant)) {
      requireMember(cardIds, cardId, `${where} → card`);
    }
    if (grant.kind === 'draft') {
      resolveTuningRef(data.tuning, grant.countRef);
      resolveTuningRef(data.tuning, grant.pickCountRef);
    }
    if (grant.kind === 'conditional') {
      requireMember(agendaIds, grant.on, `${where}.on → agenda`);
      for (const branch of Object.values(grant.branches)) {
        if (branch.gaugeAllRef !== undefined) resolveTuningRef(data.tuning, branch.gaugeAllRef);
      }
    }
  }
}

// ── bundle entry points ──────────────────────────────────────────────────────

export function loadGameData(input: unknown): GameData {
  if (!isRecord(input)) {
    throw new Error(`game data: must be an object (got ${typeName(input)})`);
  }
  const data: GameData = {
    heroes: loadHeroes(input.heroes),
    cards: loadCards(input.cards),
    map: loadMap(input.map),
    encounters: loadEncounters(input.encounters),
    council: loadCouncil(input.council),
    tuning: loadTuning(input.tuning),
  };
  crossValidate(data);
  return data;
}

let bundled: GameData | undefined;

/** The downstream seam: the six shipped files, validated once and memoized. */
export function loadBundledGameData(): GameData {
  if (bundled === undefined) {
    bundled = loadGameData({
      heroes: heroesJson,
      cards: cardsJson,
      map: mapJson,
      encounters: encountersJson,
      council: councilJson,
      tuning: tuningJson,
    });
  }
  return bundled;
}
