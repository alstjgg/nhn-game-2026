// u4 — synthetic fixtures for the data-layer loader tests.
//
// DELIBERATELY NOT the shipped content: ids are opaque (`hero_a`, `card_b`, `x1`) so the
// loaders cannot branch on real ids, and the omit/mistype matrix can mutate freely.
// Every factory returns a DEEP-FRESH object per call (structuredClone) — no cross-test bleed.
//
// The one place real values appear is `validTuning()`: the tuning *keys* are frozen by
// spec, and a fixture that disagreed with the shipped file would be misleading. The
// `no inline tunables` src scan never reads tests/, so these literals are harmless.

export type Rec = Record<string, unknown>;

// ── heroes.json — bare top-level array (ctx `heroes[0]`) ─────────────────────
export function validHeroes(): Rec[] {
  return structuredClone([
    {
      id: 'hero_a',
      name: '알파',
      className: '방패기사',
      stats: { str: 12, agi: 8, int: 8, wis: 10, cha: 10, con: 12 },
      hp: 24,
      defaultPrompt: { id: 'hero_a.default', lines: ['첫째 줄.', '둘째 줄.', '셋째 줄.'] },
      baseSkill: { id: 'skill_a', name: '방패 올리기', text: '방패를 든다.' },
      classDefaultAction: 'defend',
    },
    {
      id: 'hero_b',
      name: '베타',
      className: '순례 사제',
      stats: { str: 8, agi: 10, int: 10, wis: 12, cha: 11, con: 9 },
      hp: 18,
      defaultPrompt: { id: 'hero_b.default', lines: ['첫째 줄.', '둘째 줄.', '셋째 줄.'] },
      baseSkill: { id: 'skill_b', name: '응급 처치', text: '상처를 살핀다.' },
      classDefaultAction: 'wait',
    },
  ]);
}

// ── cards.json — bare top-level array (ctx `cards[0]`) ───────────────────────
// `engineHook` is a REQUIRED key with a nullable value: prompt cards carry `null`
// (sentence-only, no mechanical effect). Omitting the key must still throw — a
// missing structural field is never silently defaulted (spec decision 1).
export function validCards(): Rec[] {
  return structuredClone([
    {
      id: 'card_a',
      name: '알파 카드',
      type: 'prompt',
      slotKind: 'prompt',
      text: '한 문장이 시트에 추가된다.',
      engineHook: null,
    },
    {
      id: 'card_b',
      name: '베타 카드',
      type: 'skill',
      slotKind: 'skill',
      text: '전투 행동이 추가된다.',
      engineHook: { kind: 'combat_action', actionId: 'act_b' },
    },
    {
      id: 'card_c',
      name: '감마 카드',
      type: 'mcp',
      slotKind: 'mcp',
      text: '소지품이 추가된다.',
      engineHook: { kind: 'consumable', actionId: 'act_c' },
      charges: 3,
    },
  ]);
}

// ── map.json — object root (ctx `map`, `map.tiles[0]`) ───────────────────────
export function validMap(): Rec {
  return structuredClone({
    startTileId: 'x1',
    tiles: [
      {
        id: 'x1',
        kind: 'combat',
        next: ['x2'],
        walkDurationRef: 'walk.durationMs',
        rosterId: 'roster_x1',
        rewardId: 'x1',
      },
      {
        id: 'x2',
        kind: 'puzzle',
        next: ['x3'],
        walkDurationRef: 'walk.durationMs',
        agendaId: 'ag_a',
        rewardId: 'x2',
      },
      {
        id: 'x3',
        kind: 'training',
        next: ['x4'],
        walkDurationRef: 'walk.durationMs',
        rewardId: 'x3',
      },
      {
        id: 'x4',
        kind: 'rest',
        next: [],
        walkDurationRef: 'walk.durationMs',
        rewardId: 'x4',
      },
    ],
  });
}

// ── encounters.json — object root (ctx `encounters.monsters[0]`, `.rosters[0]`) ──
export function validEncounters(): Rec {
  return structuredClone({
    monsters: [
      {
        id: 'mon_a',
        name: '알파 괴물',
        hp: 36,
        damage: 4,
        gaugeOnHitExtraRef: 'gauge.spamGolemExtra',
        behavior: { rule: 'lowest_hp_hero' },
      },
      {
        id: 'mon_b',
        name: '베타 괴물',
        hp: 20,
        damage: 0,
        gaugeOnAttackRef: 'gauge.spiritAttack',
        behavior: { rule: 'highest_gauge_hero' },
      },
    ],
    rosters: [
      {
        id: 'roster_x1',
        tileId: 'x1',
        entries: [
          { instanceId: 'mon_a_1', monsterId: 'mon_a' },
          { instanceId: 'mon_b_1', monsterId: 'mon_b' },
        ],
      },
    ],
  });
}

// ── council.json — object root (ctx `council.agendas[0]`, `council.rewards.x1`) ──
// `answerOptionId` / `hintLine` are required keys with nullable values (a 선택이벤트
// agenda has no authored answer) — same presence rule as `engineHook` above.
export function validCouncil(): Rec {
  return structuredClone({
    agendas: [
      {
        id: 'ag_a',
        kind: 'puzzle',
        prompt: '수수께끼 한 줄.',
        answerOptionId: 'op_a',
        hintLine: '힌트 한 줄.',
        options: [
          { id: 'op_a', text: '첫째 답.', relatedStat: 'int' },
          { id: 'op_b', text: '둘째 답.', relatedStat: 'wis' },
          { id: 'op_c', text: '셋째 답.', relatedStat: 'cha' },
        ],
      },
      {
        id: 'ag_b',
        kind: 'choice',
        prompt: '선택 한 줄.',
        answerOptionId: null,
        hintLine: null,
        options: [
          { id: 'op_yes', text: '한다.', relatedStat: 'cha' },
          { id: 'op_no', text: '지나친다.', relatedStat: 'wis' },
        ],
      },
    ],
    rewards: {
      x1: { kind: 'fixed', cardId: 'card_a' },
      x2: {
        kind: 'conditional',
        on: 'ag_a',
        branches: {
          correct: { cardId: 'card_c' },
          wrong: { gaugeAllRef: 'gauge.puzzleWrong' },
        },
      },
      x3: {
        kind: 'draft',
        optionCardIds: ['card_a', 'card_b', 'card_c'],
        countRef: 'draft.optionCount',
        pickCountRef: 'draft.pickCount',
      },
      x4: { kind: 'none' },
    },
  });
}

// ── tuning.json — object root (ctx `tuning`, `tuning.gauge`) ─────────────────
export function validTuning(): Rec {
  return structuredClone({
    gauge: {
      onHit: 10,
      spamGolemExtra: 10,
      spiritAttack: 25,
      puzzleWrong: 15,
      max: 100,
      tiers: { calm: 0, uneasy: 40, limit: 70, overload: 100 },
      rest: { think: -50, clearTo: 0 },
    },
    damage: {
      strike: 3,
      defend: 50,
      card_b: 4,
      card_c: 6,
    },
    latency: { stub: 900, unit: 0, e2e: 'scripted', scripted: [0, 0, 0] },
    timeout: { stub: 3000, live: 8000, healthProbe: 800 },
    walk: { durationMs: 4000, testDurationMs: 0 },
    slots: { prompt: 3, skill: 2, mcp: 3 },
    draft: { optionCount: 3, pickCount: 1 },
    tieBreak: { stub: 'index', live: 'random', test: 'index' },
    chatter: { minPerWalk: 2, maxPerWalk: 3 },
  });
}

// ── the whole coherent bundle (cross-file references all resolve) ────────────
export function validBundle(): Rec {
  return {
    heroes: validHeroes(),
    cards: validCards(),
    map: validMap(),
    encounters: validEncounters(),
    council: validCouncil(),
    tuning: validTuning(),
  };
}

// ── path mutators (dot/bracket paths: `tiles[0].kind`, `gauge.tiers.limit`) ──
function walk(root: Rec, path: string): { parent: Rec; key: string } {
  // `[0].id` → ['0','id'] · `gauge.tiers.limit` → ['gauge','tiers','limit'].
  // The leading empty segment produced by an array-rooted path must be dropped.
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter((p) => p !== '');
  let cur: unknown = root;
  for (const part of parts.slice(0, -1)) {
    cur = (cur as Rec)[part];
    if (cur === null || typeof cur !== 'object') {
      throw new Error(`fixture path '${path}' does not exist (stopped at '${part}')`);
    }
  }
  return { parent: cur as Rec, key: parts[parts.length - 1] };
}

/** Deep-clones `root` and sets `path` to `value` — the "mistyped field" half. */
export function withField<T>(root: T, path: string, value: unknown): T {
  const copy = structuredClone(root) as unknown as Rec;
  const { parent, key } = walk(copy, path);
  parent[key] = value;
  return copy as unknown as T;
}

/** Deep-clones `root` and deletes `path` — the "omitted field" half. */
export function withoutField<T>(root: T, path: string): T {
  const copy = structuredClone(root) as unknown as Rec;
  const { parent, key } = walk(copy, path);
  delete parent[key];
  return copy as unknown as T;
}
