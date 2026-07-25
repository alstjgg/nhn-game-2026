// u4 — data-layer tests (TDD-Red). Pure logic / file checks, no DOM (PRD §5).
//
// Test-name filters used by the unit gates — the four top-level describe titles below
// are EXACT and load-bearing:
//   -t 'content shape'      → AC2  ·  -t 'no inline tunables' → AC3
//   -t encounters           → AC4  ·  -t 'rewards resolve'    → AC5
//   (no filter)             → AC1, the whole file
// Therefore: the strings "content shape", "no inline tunables", "encounters" and
// "rewards resolve" must NOT appear in ANY other describe/it title in this file.
// Elsewhere the monster/roster file is referred to by prose only, never by that word.
//
// RED on arrival: src/data/{schema,loader}.ts and the six data/*.json files do not
// exist yet, so this module fails to resolve and every filtered run fails with it.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  grantedCardIds,
  loadBundledGameData,
  loadCards,
  loadCouncil,
  loadEncounters,
  loadGameData,
  loadHeroes,
  loadMap,
  loadTuning,
  resolveTuningRef,
} from '../../src/data/loader';

import heroesJson from '../../data/heroes.json';
import cardsJson from '../../data/cards.json';
import mapJson from '../../data/map.json';
import encountersJson from '../../data/encounters.json';
import councilJson from '../../data/council.json';
import tuningJson from '../../data/tuning.json';

import {
  validBundle,
  validCards,
  validCouncil,
  validEncounters,
  validHeroes,
  validMap,
  validTuning,
  withField,
  withoutField,
} from './fixtures/index';
import type { Rec } from './fixtures/index';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '../..'); // demos/darkest-context/

/** Runs `fn`, returns the thrown Error message; fails the test if it returns normally. */
function messageWhenThrows(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('expected the loader to throw, but it returned normally');
}

const ID_RE = /^[a-z0-9_]+$/; // spec decision 6 — ASCII ids, Korean is display text only

// ═════════════════════ AC1 — every shipped file loads through its validator ═══════════

describe('AC1 — each shipped data file parses through its own loader', () => {
  it('loadHeroes accepts the shipped heroes file', () => {
    const heroes = loadHeroes(heroesJson);
    expect(Array.isArray(heroes)).toBe(true);
    expect(heroes.length).toBeGreaterThan(0);
  });

  it('loadCards accepts the shipped cards file', () => {
    const cards = loadCards(cardsJson);
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('loadMap accepts the shipped map file', () => {
    const map = loadMap(mapJson);
    expect(typeof map.startTileId).toBe('string');
    expect(Array.isArray(map.tiles)).toBe(true);
  });

  it('the monster/roster loader accepts its shipped file', () => {
    const enc = loadEncounters(encountersJson);
    expect(Array.isArray(enc.monsters)).toBe(true);
    expect(Array.isArray(enc.rosters)).toBe(true);
  });

  it('loadCouncil accepts the shipped council file', () => {
    const council = loadCouncil(councilJson);
    expect(Array.isArray(council.agendas)).toBe(true);
    expect(typeof council.rewards).toBe('object');
  });

  it('loadTuning accepts the shipped tuning file', () => {
    const tuning = loadTuning(tuningJson);
    expect(typeof tuning).toBe('object');
  });
});

describe('AC1 — synthetic fixtures load and return the typed shapes', () => {
  it('loadHeroes returns the 2 fixture heroes with 6-key stats', () => {
    const heroes = loadHeroes(validHeroes());
    expect(heroes).toHaveLength(2);
    expect(heroes[0].id).toBe('hero_a');
    expect(Object.keys(heroes[0].stats)).toHaveLength(6);
    expect(heroes[0].defaultPrompt.lines).toHaveLength(3);
    expect(heroes[0].classDefaultAction).toBe('defend');
  });

  it('loadCards returns the 3 fixture cards, prompt cards carrying a null engine hook', () => {
    const cards = loadCards(validCards());
    expect(cards).toHaveLength(3);
    expect(cards[0].type).toBe('prompt');
    expect(cards[0].slotKind).toBe('prompt');
    expect(cards[0].engineHook).toBeNull();
    expect(cards[1].engineHook).not.toBeNull();
  });

  it('loadMap returns tiles in declared order with their walk-duration reference', () => {
    const map = loadMap(validMap());
    expect(map.startTileId).toBe('x1');
    expect(map.tiles.map((t) => t.id)).toEqual(['x1', 'x2', 'x3', 'x4']);
    expect(map.tiles[0].walkDurationRef).toBe('walk.durationMs');
  });

  it('the monster/roster loader returns monsters plus per-tile rosters', () => {
    const enc = loadEncounters(validEncounters());
    expect(enc.monsters.map((m) => m.id)).toEqual(['mon_a', 'mon_b']);
    expect(enc.monsters[0].behavior.rule).toBe('lowest_hp_hero');
    expect(enc.rosters[0].entries.map((e) => e.monsterId)).toEqual(['mon_a', 'mon_b']);
  });

  it('loadCouncil returns agendas plus the tile-keyed grant table', () => {
    const council = loadCouncil(validCouncil());
    expect(council.agendas.map((a) => a.id)).toEqual(['ag_a', 'ag_b']);
    expect(council.agendas[1].answerOptionId).toBeNull();
    expect(Object.keys(council.rewards).sort()).toEqual(['x1', 'x2', 'x3', 'x4']);
  });

  it('loadTuning returns the nine frozen top-level groups', () => {
    const tuning = loadTuning(validTuning()) as unknown as Rec;
    for (const key of [
      'gauge',
      'damage',
      'latency',
      'timeout',
      'walk',
      'slots',
      'draft',
      'tieBreak',
      'chatter',
    ]) {
      expect(tuning[key], `tuning.${key} missing`).toBeDefined();
    }
  });
});

// ── the omit/mistype matrix: every required field, both halves, field-level error ──
// A required key with a nullable VALUE (engineHook, answerOptionId, hintLine) still
// has to be present — a missing structural field is never silently defaulted.

type Case = [path: string, wrong: unknown, ctx: string];

function runMatrix(
  title: string,
  load: (input: unknown) => unknown,
  factory: () => unknown,
  cases: Case[],
): void {
  describe(title, () => {
    for (const [path, wrong, ctx] of cases) {
      const field = path.replace(/\[\d+\]/g, '').split('.').pop() as string;

      // NOTE: `ctx` is asserted in the body but deliberately kept OUT of the test title —
      // several ctx values contain the word used by the AC4 `-t` filter.
      it(`throws naming the entity + '${field}' when ${path} is omitted`, () => {
        const msg = messageWhenThrows(() => load(withoutField(factory(), path)));
        expect(msg).toContain(field);
        expect(msg).toContain(ctx);
      });

      it(`throws naming the entity + '${field}' when ${path} is mistyped`, () => {
        const msg = messageWhenThrows(() => load(withField(factory(), path, wrong)));
        expect(msg).toContain(field);
        expect(msg).toContain(ctx);
      });
    }
  });
}

runMatrix('AC1 — loadHeroes rejects malformed input, naming entity + field', loadHeroes, validHeroes, [
  ['[0].id', 42, 'heroes[0]'],
  ['[0].name', 42, 'heroes[0]'],
  ['[0].className', 42, 'heroes[0]'],
  ['[0].stats', 'nope', 'heroes[0]'],
  ['[0].hp', 'nope', 'heroes[0]'],
  ['[0].defaultPrompt', 'nope', 'heroes[0]'],
  ['[0].baseSkill', 'nope', 'heroes[0]'],
  ['[0].classDefaultAction', 42, 'heroes[0]'],
  ['[1].stats.con', 'nope', 'heroes[1]'],
  ['[1].defaultPrompt.id', 42, 'heroes[1]'],
  ['[1].defaultPrompt.lines', {}, 'heroes[1]'],
  ['[1].baseSkill.id', 42, 'heroes[1]'],
  ['[1].baseSkill.name', 42, 'heroes[1]'],
  ['[1].baseSkill.text', 42, 'heroes[1]'],
]);

runMatrix('AC1 — loadCards rejects malformed input, naming entity + field', loadCards, validCards, [
  ['[0].id', 42, 'cards[0]'],
  ['[0].name', 42, 'cards[0]'],
  ['[0].type', 42, 'cards[0]'],
  ['[0].text', 42, 'cards[0]'],
  ['[0].slotKind', 42, 'cards[0]'],
  ['[0].engineHook', 42, 'cards[0]'],
  ['[1].engineHook.kind', 42, 'cards[1]'],
]);

runMatrix('AC1 — loadMap rejects malformed input, naming entity + field', loadMap, validMap, [
  ['startTileId', 42, 'map'],
  ['tiles', {}, 'map'],
  ['tiles[0].id', 42, 'map.tiles[0]'],
  ['tiles[0].kind', 42, 'map.tiles[0]'],
  ['tiles[0].next', {}, 'map.tiles[0]'],
  ['tiles[0].walkDurationRef', 42, 'map.tiles[0]'],
]);

runMatrix(
  'AC1 — the monster/roster loader rejects malformed input, naming entity + field',
  loadEncounters,
  validEncounters,
  [
    ['monsters', {}, 'encounters'],
    ['rosters', {}, 'encounters'],
    ['monsters[0].id', 42, 'encounters.monsters[0]'],
    ['monsters[0].name', 42, 'encounters.monsters[0]'],
    ['monsters[0].hp', 'nope', 'encounters.monsters[0]'],
    ['monsters[0].damage', 'nope', 'encounters.monsters[0]'],
    ['monsters[0].behavior', 'nope', 'encounters.monsters[0]'],
    ['monsters[0].behavior.rule', 42, 'encounters.monsters[0]'],
    ['rosters[0].id', 42, 'encounters.rosters[0]'],
    ['rosters[0].tileId', 42, 'encounters.rosters[0]'],
    ['rosters[0].entries', {}, 'encounters.rosters[0]'],
    ['rosters[0].entries[0].instanceId', 42, 'encounters.rosters[0]'],
    ['rosters[0].entries[0].monsterId', 42, 'encounters.rosters[0]'],
  ],
);

runMatrix(
  'AC1 — loadCouncil rejects malformed input, naming entity + field',
  loadCouncil,
  validCouncil,
  [
    ['agendas', {}, 'council'],
    ['rewards', [], 'council'],
    ['agendas[0].id', 42, 'council.agendas[0]'],
    ['agendas[0].kind', 42, 'council.agendas[0]'],
    ['agendas[0].prompt', 42, 'council.agendas[0]'],
    ['agendas[0].answerOptionId', 42, 'council.agendas[0]'],
    ['agendas[0].hintLine', 42, 'council.agendas[0]'],
    ['agendas[0].options', {}, 'council.agendas[0]'],
    ['agendas[0].options[0].id', 42, 'council.agendas[0]'],
    ['agendas[0].options[0].text', 42, 'council.agendas[0]'],
    ['agendas[0].options[0].relatedStat', 42, 'council.agendas[0]'],
    ['rewards.x1.kind', 42, 'council.rewards.x1'],
    ['rewards.x1.cardId', 42, 'council.rewards.x1'],
    ['rewards.x2.on', 42, 'council.rewards.x2'],
    ['rewards.x2.branches', 'nope', 'council.rewards.x2'],
    ['rewards.x3.optionCardIds', {}, 'council.rewards.x3'],
    ['rewards.x3.countRef', 42, 'council.rewards.x3'],
    ['rewards.x3.pickCountRef', 42, 'council.rewards.x3'],
  ],
);

runMatrix('AC1 — loadTuning rejects malformed input, naming entity + field', loadTuning, validTuning, [
  ['gauge', 'nope', 'tuning'],
  ['damage', 'nope', 'tuning'],
  ['latency', 'nope', 'tuning'],
  ['timeout', 'nope', 'tuning'],
  ['walk', 'nope', 'tuning'],
  ['slots', 'nope', 'tuning'],
  ['draft', 'nope', 'tuning'],
  ['tieBreak', 'nope', 'tuning'],
  ['chatter', 'nope', 'tuning'],
  ['gauge.onHit', 'nope', 'tuning.gauge'],
  ['gauge.spamGolemExtra', 'nope', 'tuning.gauge'],
  ['gauge.spiritAttack', 'nope', 'tuning.gauge'],
  ['gauge.puzzleWrong', 'nope', 'tuning.gauge'],
  ['walk.durationMs', 'nope', 'tuning.walk'],
  ['walk.testDurationMs', 'nope', 'tuning.walk'],
  ['slots.prompt', 'nope', 'tuning.slots'],
  ['slots.skill', 'nope', 'tuning.slots'],
  ['slots.mcp', 'nope', 'tuning.slots'],
  ['draft.optionCount', 'nope', 'tuning.draft'],
  ['draft.pickCount', 'nope', 'tuning.draft'],
  ['timeout.stub', 'nope', 'tuning.timeout'],
  ['timeout.live', 'nope', 'tuning.timeout'],
  ['latency.stub', 'nope', 'tuning.latency'],
  ['latency.unit', 'nope', 'tuning.latency'],
  ['tieBreak.stub', 42, 'tuning.tieBreak'],
  ['tieBreak.live', 42, 'tuning.tieBreak'],
  ['tieBreak.test', 42, 'tuning.tieBreak'],
]);

describe('AC1 — loaders reject wrong container types and duplicate ids', () => {
  it('loadHeroes throws when the root is not an array', () => {
    expect(messageWhenThrows(() => loadHeroes({ heroes: [] }))).toContain('heroes');
  });

  it('loadCards throws when the root is not an array', () => {
    expect(messageWhenThrows(() => loadCards('nope'))).toContain('cards');
  });

  it('loadMap throws when the root is not an object', () => {
    expect(messageWhenThrows(() => loadMap([]))).toContain('map');
  });

  it('loadHeroes throws when two heroes share an id', () => {
    const dup = withField(validHeroes(), '[1].id', 'hero_a');
    expect(messageWhenThrows(() => loadHeroes(dup))).toContain('hero_a');
  });

  it('loadCards throws when two cards share an id', () => {
    const dup = withField(validCards(), '[1].id', 'card_a');
    expect(messageWhenThrows(() => loadCards(dup))).toContain('card_a');
  });
});

// ── cross-file references: the one pass that lives in loadGameData ───────────

describe('AC1 — loadGameData resolves the coherent bundle', () => {
  it('returns all six typed slices', () => {
    const data = loadGameData(validBundle() as never);
    expect(data.heroes).toHaveLength(2);
    expect(data.cards).toHaveLength(3);
    expect(data.map.tiles).toHaveLength(4);
    expect(data.council.agendas).toHaveLength(2);
    expect(data.tuning).toBeDefined();
    expect(data.encounters.monsters).toHaveLength(2);
  });
});

const crossRefCases: Array<[label: string, path: string, wrong: unknown, needle: string]> = [
  ['a grant cites an unknown card', 'council.rewards.x1.cardId', 'card_ghost', 'card_ghost'],
  [
    'a draft option cites an unknown card',
    'council.rewards.x3.optionCardIds',
    ['card_a', 'card_ghost', 'card_c'],
    'card_ghost',
  ],
  [
    'a roster entry cites an unknown monster',
    'encounters.rosters[0].entries[0].monsterId',
    'mon_ghost',
    'mon_ghost',
  ],
  ['a roster cites an unknown tile', 'encounters.rosters[0].tileId', 'x_ghost', 'x_ghost'],
  ['a tile cites an unknown roster', 'map.tiles[0].rosterId', 'roster_ghost', 'roster_ghost'],
  ['a tile cites an unknown agenda', 'map.tiles[1].agendaId', 'ag_ghost', 'ag_ghost'],
  ['a tile cites an unknown grant', 'map.tiles[0].rewardId', 'x_ghost', 'x_ghost'],
  ['a tile links to an unknown successor', 'map.tiles[0].next', ['x_ghost'], 'x_ghost'],
  ['the start tile does not exist', 'map.startTileId', 'x_ghost', 'x_ghost'],
  [
    'an agenda answer is not one of its own options',
    'council.agendas[0].answerOptionId',
    'op_ghost',
    'op_ghost',
  ],
  [
    'a conditional grant cites an unknown agenda',
    'council.rewards.x2.on',
    'ag_ghost',
    'ag_ghost',
  ],
  [
    'a tile walk-duration reference is not a tuning path',
    'map.tiles[0].walkDurationRef',
    'walk.nope',
    'walk.nope',
  ],
  [
    'a gauge grant reference is not a tuning path',
    'council.rewards.x2.branches.wrong.gaugeAllRef',
    'gauge.nope',
    'gauge.nope',
  ],
  [
    'a draft count reference is not a tuning path',
    'council.rewards.x3.countRef',
    'draft.nope',
    'draft.nope',
  ],
  [
    'a monster gauge reference is not a tuning path',
    'encounters.monsters[0].gaugeOnHitExtraRef',
    'gauge.nope',
    'gauge.nope',
  ],
];

describe('AC1 — loadGameData rejects unresolvable cross-file references', () => {
  for (const [label, path, wrong, needle] of crossRefCases) {
    it(`throws when ${label}`, () => {
      const msg = messageWhenThrows(() =>
        loadGameData(withField(validBundle(), path, wrong) as never),
      );
      expect(msg).toContain(needle);
    });
  }
});

describe('AC1 — loadBundledGameData is the downstream seam', () => {
  it('loads the six shipped files and cross-validates them', () => {
    const data = loadBundledGameData();
    expect(data.heroes.length).toBe(4);
    expect(data.cards.length).toBe(11);
    expect(data.map.tiles.length).toBe(9);
    expect(data.encounters.monsters.length).toBe(2);
    expect(data.council.agendas.length).toBeGreaterThanOrEqual(2);
    expect(data.tuning).toBeDefined();
  });

  it('is memoized — repeated calls hand back the same object', () => {
    expect(loadBundledGameData()).toBe(loadBundledGameData());
  });
});

describe('AC1 — tuning reference + grant helpers', () => {
  it('resolveTuningRef reads a dotted path out of the tuning object', () => {
    const tuning = loadTuning(tuningJson);
    expect(resolveTuningRef(tuning, 'walk.durationMs')).toBe(4000);
    expect(resolveTuningRef(tuning, 'walk.testDurationMs')).toBe(0);
    expect(resolveTuningRef(tuning, 'gauge.puzzleWrong')).toBe(15);
    expect(resolveTuningRef(tuning, 'draft.pickCount')).toBe(1);
  });

  it('resolveTuningRef throws naming the path when it does not exist', () => {
    const tuning = loadTuning(tuningJson);
    const msg = messageWhenThrows(() => resolveTuningRef(tuning, 'walk.nope'));
    expect(msg).toContain('walk.nope');
  });

  it('resolveTuningRef throws when the path resolves to a non-number', () => {
    const tuning = loadTuning(tuningJson);
    expect(messageWhenThrows(() => resolveTuningRef(tuning, 'tieBreak.stub'))).toContain(
      'tieBreak.stub',
    );
  });

  it('grantedCardIds flattens every grant variant', () => {
    expect(grantedCardIds({ kind: 'none' })).toEqual([]);
    expect(grantedCardIds({ kind: 'fixed', cardId: 'card_a' })).toEqual(['card_a']);
    expect(
      grantedCardIds({
        kind: 'draft',
        optionCardIds: ['card_a', 'card_b', 'card_c'],
        countRef: 'draft.optionCount',
        pickCountRef: 'draft.pickCount',
      }),
    ).toEqual(['card_a', 'card_b', 'card_c']);
    expect(
      grantedCardIds({
        kind: 'conditional',
        on: 'ag_a',
        branches: { correct: { cardId: 'card_c' }, wrong: { gaugeAllRef: 'gauge.puzzleWrong' } },
      }),
    ).toEqual(['card_c']);
  });
});

// ═══════════════════════════════ AC2 — content shape ══════════════════════════════════

describe('content shape', () => {
  const heroes = loadHeroes(heroesJson);
  const cards = loadCards(cardsJson);
  const map = loadMap(mapJson);

  // ── heroes: 4 of them, verbatim from docs/agent-arena-examples.md §2 ──
  const HERO_TABLE: Array<{
    id: string;
    name: string;
    className: string;
    stats: [number, number, number, number, number, number]; // 힘 민 지능 지혜 매력 건강
    baseSkillName: string;
    classDefaultAction: string;
  }> = [
    {
      id: 'garrett',
      name: '가렛',
      className: '방패기사',
      stats: [12, 8, 8, 10, 10, 12],
      baseSkillName: '방패 올리기',
      classDefaultAction: 'defend',
    },
    {
      id: 'fiona',
      name: '피오나',
      className: '순례 사제',
      stats: [8, 10, 10, 12, 11, 9],
      baseSkillName: '응급 처치',
      classDefaultAction: 'wait',
    },
    {
      id: 'selene',
      name: '셀레네',
      className: '은퇴한 사기꾼',
      stats: [8, 11, 10, 9, 12, 10],
      baseSkillName: '그럴싸한 거짓말',
      classDefaultAction: 'evade',
    },
    {
      id: 'mordecai',
      name: '모데카이',
      className: '고서 수집가',
      stats: [8, 9, 12, 11, 9, 11],
      baseSkillName: '약점 분석',
      classDefaultAction: 'analyze',
    },
  ];

  const STAT_KEYS = ['str', 'agi', 'int', 'wis', 'cha', 'con'] as const;

  const DEFAULT_PROMPT_LINES: Record<string, string[]> = {
    garrett: [
      '동료가 위험하면 네 안전보다 동료를 지키는 것을 우선한다.',
      '정면 승부를 선호하고, 속임수와 우회를 경멸한다.',
      '한번 정한 상대는 끝까지 물고 늘어진다.',
    ],
    fiona: [
      '겁이 많다. 자신이 다칠 상황을 본능적으로 피한다.',
      '아군의 부상 상태에 과민하다. 누군가 다치면 그것부터 신경 쓴다.',
      '싸움보다 수습이 네 일이라고 믿는다.',
    ],
    selene: [
      '말로 풀 수 있는 일은 절대 힘으로 풀지 않는다.',
      '규칙은 참고사항이다. 이득이 되면 우회한다.',
      '상대의 허영과 약점을 빠르게 읽는다.',
    ],
    mordecai: [
      '행동 전에 반드시 분석한다. 분석 없이 움직이는 것을 견디지 못한다.',
      '자신의 지식에 과신이 있다. 모른다고 인정하는 것을 싫어한다.',
      '처음 보는 것 앞에서는 위험보다 호기심이 앞선다.',
    ],
  };

  it('ships exactly 4 heroes, 모데카이 included, in the documented order', () => {
    expect(heroes).toHaveLength(4);
    expect(heroes.map((h) => h.id)).toEqual(HERO_TABLE.map((h) => h.id));
    expect(heroes.map((h) => h.id)).toContain('mordecai');
  });

  for (const row of HERO_TABLE) {
    describe(`hero ${row.id}`, () => {
      const hero = () => heroes.find((h) => h.id === row.id)!;

      it('carries the documented name / class / base skill / class default action', () => {
        expect(hero()).toBeDefined();
        expect(hero().name).toBe(row.name);
        expect(hero().className).toBe(row.className);
        expect(hero().baseSkill.name).toBe(row.baseSkillName);
        expect(hero().baseSkill.text.length).toBeGreaterThan(0);
        expect(hero().classDefaultAction).toBe(row.classDefaultAction);
      });

      it('has 6 stats matching the roster table and summing to 60', () => {
        const stats = hero().stats as unknown as Record<string, number>;
        expect(Object.keys(stats).sort()).toEqual([...STAT_KEYS].sort());
        STAT_KEYS.forEach((key, i) => {
          expect(stats[key], `${row.id}.stats.${key}`).toBe(row.stats[i]);
        });
        expect(STAT_KEYS.reduce((sum, k) => sum + stats[k], 0)).toBe(60);
      });

      it('derives hp as 건강 × 2, written literally into the file', () => {
        expect(hero().hp).toBe(row.stats[5] * 2);
      });

      it('carries the 3 verbatim default-prompt lines under the `<hero>.default` id', () => {
        expect(hero().defaultPrompt.id).toBe(`${row.id}.default`);
        expect(hero().defaultPrompt.lines).toHaveLength(3);
        expect(hero().defaultPrompt.lines).toEqual(DEFAULT_PROMPT_LINES[row.id]);
      });
    });
  }

  // ── cards: exactly 11, 5 prompt / 2 skill / 4 mcp ──
  const PROMPT_CARDS: Array<[name: string, text: string]> = [
    ['겁이 없다', '위험을 계산하지 않는다. 먼저 부딪힌다.'],
    ['원한', '너를 마지막으로 공격한 적을 잊지 못한다.'],
    ['동료를 먼저', '자신의 이득보다 파티의 안전을 우선한다.'],
    ['승부사', '확률이 반반이면 건다. 도박을 즐긴다.'],
    ['연민', '곤경에 빠진 이를 지나치지 못한다.'],
  ];
  const SKILL_CARDS = ['이단 베기', '도발'];
  const MCP_CARDS = ['화염 두루마리', '치유 물약 ×3', '거울 방패', '번역 렌즈'];

  it('ships exactly 11 cards split 5 prompt / 2 skill / 4 mcp', () => {
    expect(cards).toHaveLength(11);
    expect(cards.filter((c) => c.type === 'prompt')).toHaveLength(5);
    expect(cards.filter((c) => c.type === 'skill')).toHaveLength(2);
    expect(cards.filter((c) => c.type === 'mcp')).toHaveLength(4);
  });

  it('names the exact 11 cards, without the 「」 prose brackets', () => {
    const names = cards.map((c) => c.name);
    expect([...names].sort()).toEqual(
      [...PROMPT_CARDS.map(([n]) => n), ...SKILL_CARDS, ...MCP_CARDS].sort(),
    );
    for (const name of names) expect(name).not.toMatch(/[「」]/);
  });

  it('omits the cut 저주성 prompt cards entirely — no name, id or text mentions them', () => {
    const blob = JSON.stringify(cardsJson);
    expect(blob).not.toContain('허세');
    expect(blob).not.toContain('수다스러움');
  });

  it('gives every card a slotKind equal to its type', () => {
    for (const card of cards) expect(card.slotKind).toBe(card.type);
  });

  it('carries the 5 prompt-card sentences verbatim, with no engine hook', () => {
    for (const [name, text] of PROMPT_CARDS) {
      const card = cards.find((c) => c.name === name);
      expect(card, `prompt card ${name} missing`).toBeDefined();
      expect(card!.type).toBe('prompt');
      expect(card!.text).toBe(text);
      expect(card!.engineHook).toBeNull();
    }
  });

  it('gives every skill and mcp card a Korean text plus a real engine hook', () => {
    for (const name of [...SKILL_CARDS, ...MCP_CARDS]) {
      const card = cards.find((c) => c.name === name);
      expect(card, `card ${name} missing`).toBeDefined();
      expect(card!.text.length).toBeGreaterThan(0);
      expect(card!.engineHook, `${name}.engineHook`).not.toBeNull();
      expect(typeof card!.engineHook!.kind).toBe('string');
    }
  });

  it('gives the consumables their charge counts and leaves 거울 방패 persistent', () => {
    const byName = (n: string) => cards.find((c) => c.name === n)!;
    expect(byName('화염 두루마리').charges).toBe(1);
    expect(byName('치유 물약 ×3').charges).toBe(3);
    expect(byName('번역 렌즈').charges).toBe(1);
    expect(byName('거울 방패').charges).toBeUndefined();
  });

  it('uses ascii snake_case ids everywhere — Korean is display text only', () => {
    for (const hero of heroes) expect(hero.id).toMatch(ID_RE);
    for (const card of cards) expect(card.id).toMatch(ID_RE);
    for (const tile of map.tiles) expect(tile.id).toMatch(ID_RE);
  });

  // ── map: 9 tile entries, 1 branch, 7 tiles per run ──
  const TILE_KINDS: Record<string, string> = {
    t1: 'combat',
    t2: 'training',
    t3a: 'puzzle',
    t3b: 'choice',
    t4a: 'training',
    t4b: 'rest',
    t5: 'combat',
    t6: 'rest',
    t7: 'combat_final',
  };

  it('ships 9 tile entries with the documented kinds', () => {
    expect(map.tiles).toHaveLength(9);
    expect([...map.tiles.map((t) => t.id)].sort()).toEqual(Object.keys(TILE_KINDS).sort());
    for (const tile of map.tiles) expect(tile.kind).toBe(TILE_KINDS[tile.id]);
  });

  it('starts at t1 and links every successor to a real tile', () => {
    const ids = new Set(map.tiles.map((t) => t.id));
    expect(map.startTileId).toBe('t1');
    expect(ids.has(map.startTileId)).toBe(true);
    for (const tile of map.tiles) {
      for (const nxt of tile.next) expect(ids.has(nxt), `${tile.id} → ${nxt}`).toBe(true);
    }
  });

  it('has exactly one branching tile — t2, with 2 successors', () => {
    const branching = map.tiles.filter((t) => t.next.length === 2);
    expect(branching).toHaveLength(1);
    expect(branching[0].id).toBe('t2');
    expect([...branching[0].next].sort()).toEqual(['t3a', 't3b']);
  });

  it('walks 7 tiles per run on both paths, rejoining at t5 and ending at t7', () => {
    const byId = new Map(map.tiles.map((t) => [t.id, t]));
    const paths: string[][] = [];
    const walkFrom = (id: string, acc: string[]): void => {
      const tile = byId.get(id)!;
      const next = [...acc, id];
      if (tile.next.length === 0) {
        paths.push(next);
        return;
      }
      for (const nxt of tile.next) walkFrom(nxt, next);
    };
    walkFrom(map.startTileId, []);

    expect(paths).toHaveLength(2);
    for (const path of paths) {
      expect(path).toHaveLength(7);
      expect(path[path.length - 1]).toBe('t7');
      expect(path).toContain('t5');
    }
    expect(paths.map((p) => p.join('>')).sort()).toEqual(
      ['t1>t2>t3a>t4a>t5>t6>t7', 't1>t2>t3b>t4b>t5>t6>t7'].sort(),
    );
  });

  it('gives every tile a walk-duration reference instead of an inline number', () => {
    for (const tile of map.tiles) {
      expect(typeof tile.walkDurationRef).toBe('string');
      expect(tile.walkDurationRef.length).toBeGreaterThan(0);
    }
    expect(JSON.stringify(mapJson)).not.toContain('4000');
  });
});

// ══════════════════════════ AC3 — no inline tunables ══════════════════════════════════

describe('no inline tunables', () => {
  const tuning = loadTuning(tuningJson) as unknown as Rec;
  const group = (k: string) => tuning[k] as Record<string, unknown>;

  it('carries the gauge numbers from PRD §2.5', () => {
    const gauge = group('gauge');
    expect(gauge.onHit).toBe(10); // 피격 +10
    expect(gauge.spamGolemExtra).toBe(10); // 스팸 골렘 도배 +10 extra
    expect(gauge.spiritAttack).toBe(25); // 환각 정령 +25
    expect(gauge.puzzleWrong).toBe(15); // 퍼즐 오답 +15, all party
    expect(gauge.max).toBe(100);
    expect(gauge.tiers).toEqual({ calm: 0, uneasy: 40, limit: 70, overload: 100 });
    expect(gauge.rest).toEqual({ think: -50, clearTo: 0 });
  });

  it('carries the fixed damage values, keyed by base action and by card id', () => {
    const cards = loadCards(cardsJson);
    const damage = group('damage');
    const idOf = (name: string) => cards.find((c) => c.name === name)!.id;

    expect(damage.strike).toBe(3);
    expect(typeof damage.defend).toBe('number');
    expect(damage[idOf('이단 베기')]).toEqual([2, 3]); // 2연격, deterministic — not 2~3 random
    expect(damage[idOf('화염 두루마리')]).toBe(4);
    expect(damage[idOf('치유 물약 ×3')]).toBe(6);
    expect(damage[idOf('거울 방패')]).toBe(30);
  });

  it('carries the latency simulation: stub 900 / unit 0 / scripted e2e', () => {
    const latency = group('latency');
    expect(latency.stub).toBe(900);
    expect(latency.unit).toBe(0);
    expect(latency.e2e).toBe('scripted');
    expect(Array.isArray(latency.scripted)).toBe(true);
  });

  it('carries the per-mode decision timeouts and the health-probe budget', () => {
    const timeout = group('timeout');
    expect(timeout.stub).toBe(3000);
    expect(timeout.live).toBe(8000);
    expect(timeout.healthProbe).toBe(800);
  });

  it('carries the walk duration — 4s live, 0 under automated gates', () => {
    const walk = group('walk');
    expect(walk.durationMs).toBe(4000);
    expect(walk.testDurationMs).toBe(0);
  });

  it('carries the slot counts 3 · 2 · 3 and the draft pick count', () => {
    expect(group('slots')).toEqual({ prompt: 3, skill: 2, mcp: 3 });
    expect(group('draft')).toEqual({ optionCount: 3, pickCount: 1 });
  });

  it('carries the per-mode tieBreak policy — index under automated gates', () => {
    expect(group('tieBreak')).toEqual({ stub: 'index', live: 'random', test: 'index' });
  });

  it('carries the chatter bounds — 2–3 exchanges per walk', () => {
    expect(group('chatter')).toEqual({ minPerWalk: 2, maxPerWalk: 3 });
  });

  // ── the grep gate: no tunable literal may be inlined anywhere in src/** ──
  // 0 scanned files ⇒ pass (u4 may land before the consumer units exist).
  const DENY_LITERALS = [900, 3000, 8000, 4000, 800, 70, 40, 25, 15, 50];
  const TUNABLE_ASSIGN =
    /\b(gauge|damage|dmg|hp|slot|latency|timeout|walk|draft|tieBreak|heal|reflect)\w*\s*(?:[:=]|[+\-]=|===|>=|<=|>|<)\s*-?\d+/i;

  // Two carve-outs, both about numbers that are STRUCTURE rather than balance. They are
  // deliberately operand/line-shaped, never file-shaped: no source file is ever exempt.
  //
  // 1. A type-level declaration states the shape of a value, not its value:
  //    `export type GaugeTier = 0 | 1 | 2 | 3` names the four tiers, it does not tune them.
  const TYPE_DECL = /^\s*(?:export\s+)?(?:declare\s+)?(?:type|interface)\b/;
  // 2. An operand of a shift/bitwise operator is an algorithm constant: the `15` in a PRNG's
  //    `state >>> 15` is not the puzzle-gauge 15, and moving it to tuning.json would be a bug.
  const BITWISE_OPERAND = /(?:>>>|>>|<<|[&|^])\s*\(?\s*$/;

  function sourceFiles(): string[] {
    const srcRoot = resolve(demoRoot, 'src');
    const skipped = resolve(srcRoot, 'data');
    const out: string[] = [];
    const walkDir = (dir: string): void => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (full !== skipped) walkDir(full);
        } else if (entry.isFile() && full.endsWith('.ts')) {
          out.push(full);
        }
      }
    };
    walkDir(srcRoot);
    return out;
  }

  // Comments and string literals are stripped first, so prose that merely mentions a
  // number (or an asset path like "sprite-3000.png") never trips the scan.
  function scrub(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, '``');
  }

  /** The scanner itself, over one file's source — extracted so it is testable below. */
  function scanSource(rel: string, source: string): string[] {
    const violations: string[] = [];
    scrub(source)
      .split('\n')
      .forEach((line, i) => {
        for (const literal of DENY_LITERALS) {
          const scan = new RegExp(`(?<![\\w.])${literal}(?![\\w.])`, 'g');
          for (let hit = scan.exec(line); hit !== null; hit = scan.exec(line)) {
            if (BITWISE_OPERAND.test(line.slice(0, hit.index))) continue;
            violations.push(`${rel}:${i + 1} — literal ${literal} belongs in data/tuning.json`);
            break; // one report per literal per line
          }
        }
        if (!TYPE_DECL.test(line) && TUNABLE_ASSIGN.test(line)) {
          violations.push(`${rel}:${i + 1} — tunable assigned a number literal: ${line.trim()}`);
        }
      });
    return violations;
  }

  it('finds no inlined tunable literal in src/** (src/data/** excluded)', () => {
    const violations: string[] = [];
    for (const file of sourceFiles()) {
      const rel = relative(demoRoot, file);
      violations.push(...scanSource(rel, readFileSync(file, 'utf8')));
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  // ── the scanner keeps its teeth: the carve-outs above must not become an escape hatch ──

  it('still catches a real inlined tunable — a literal and a tunable assignment', () => {
    expect(scanSource('src/fake.ts', 'const budget = 8000;')).toHaveLength(1);
    expect(scanSource('src/fake.ts', 'let timeoutMs = 1234;')).toHaveLength(1);
    expect(scanSource('src/fake.ts', 'const gaugeOnHit = 25;')).toHaveLength(2); // both rules
    // a bitwise operator elsewhere on the line does not launder an inlined tunable
    expect(scanSource('src/fake.ts', 'const budget = 8000 | flags;')).toHaveLength(1);
  });

  it('does not flag a type-level declaration or a bit-twiddling constant', () => {
    expect(scanSource('src/fake.ts', 'export type GaugeTier = 0 | 1 | 2 | 3;')).toEqual([]);
    expect(scanSource('src/fake.ts', 'const t = state ^ (state >>> 15);')).toEqual([]);
    expect(scanSource('src/fake.ts', 'const mask = value & 50;')).toEqual([]);
    // …and prose/strings are still scrubbed before the scan
    expect(scanSource('src/fake.ts', '// the 900ms stub latency')).toEqual([]);
    expect(scanSource('src/fake.ts', "const src = 'sprite-3000.png';")).toEqual([]);
  });

  it('reads tunables through resolveTuningRef rather than a second copy', () => {
    const loaded = loadTuning(tuningJson);
    expect(resolveTuningRef(loaded, 'gauge.onHit')).toBe(10);
    expect(resolveTuningRef(loaded, 'gauge.spamGolemExtra')).toBe(10);
    expect(resolveTuningRef(loaded, 'gauge.spiritAttack')).toBe(25);
    expect(resolveTuningRef(loaded, 'timeout.live')).toBe(8000);
    expect(resolveTuningRef(loaded, 'slots.mcp')).toBe(3);
  });
});

// ═════════════════════════════════ AC4 — encounters ═══════════════════════════════════

describe('encounters', () => {
  const enc = loadEncounters(encountersJson);
  const map = loadMap(mapJson);
  const monsterIds = new Set(enc.monsters.map((m) => m.id));
  const byId = (id: string) => enc.monsters.find((m) => m.id === id)!;
  const rosterFor = (tileId: string) => enc.rosters.find((r) => r.tileId === tileId)!;

  it('ships exactly the 2 monsters the run uses', () => {
    expect(enc.monsters).toHaveLength(2);
    expect([...monsterIds].sort()).toEqual(['hallucination_spirit', 'spam_golem']);
    for (const monster of enc.monsters) expect(monster.id).toMatch(ID_RE);
  });

  it('gives 스팸 골렘 the lowest-HP targeting rule plus its 도배 gauge reference', () => {
    const golem = byId('spam_golem');
    expect(golem.behavior.rule).toBe('lowest_hp_hero');
    expect(golem.hp).toBe(36);
    expect(golem.damage).toBe(4);
    expect(golem.gaugeOnHitExtraRef).toBe('gauge.spamGolemExtra');
  });

  it('gives 환각 정령 the highest-gauge targeting rule and no hp damage', () => {
    const spirit = byId('hallucination_spirit');
    expect(spirit.behavior.rule).toBe('highest_gauge_hero');
    expect(spirit.damage).toBe(0);
    expect(spirit.hp).toBeGreaterThan(0);
    expect(spirit.gaugeOnAttackRef).toBe('gauge.spiritAttack');
  });

  it('holds behaviour as a declared table only — no monster carries an adapter hook', () => {
    const blob = JSON.stringify(encountersJson);
    expect(blob).not.toContain('adapter');
    expect(blob).not.toContain('prompt');
  });

  it('rosters T1 / T5 / T7 with 1 / 2 / 3 entries', () => {
    expect(rosterFor('t1').entries).toHaveLength(1);
    expect(rosterFor('t5').entries).toHaveLength(2);
    expect(rosterFor('t7').entries).toHaveLength(3);
  });

  it('declares roster order explicitly, so a tieBreak policy of `index` is well-defined', () => {
    expect(rosterFor('t1').entries.map((e) => e.monsterId)).toEqual(['spam_golem']);
    expect(rosterFor('t5').entries.map((e) => e.monsterId)).toEqual([
      'spam_golem',
      'hallucination_spirit',
    ]);
    expect(rosterFor('t7').entries.map((e) => e.monsterId)).toEqual([
      'spam_golem',
      'spam_golem',
      'hallucination_spirit',
    ]);
  });

  it('gives every roster entry a unique instance id, so index and identity agree', () => {
    for (const roster of enc.rosters) {
      const instanceIds = roster.entries.map((e) => e.instanceId);
      expect(new Set(instanceIds).size).toBe(instanceIds.length);
      for (const instanceId of instanceIds) expect(instanceId).toMatch(ID_RE);
    }
  });

  it('resolves every roster monsterId and tileId against the other files', () => {
    const tileIds = new Set(map.tiles.map((t) => t.id));
    for (const roster of enc.rosters) {
      expect(tileIds.has(roster.tileId), `roster ${roster.id} → tile ${roster.tileId}`).toBe(true);
      for (const entry of roster.entries) {
        expect(monsterIds.has(entry.monsterId), `entry ${entry.instanceId}`).toBe(true);
      }
    }
  });

  it('points every combat tile at a declared roster', () => {
    for (const tile of map.tiles) {
      if (tile.kind === 'combat' || tile.kind === 'combat_final') {
        expect(tile.rosterId, `${tile.id}.rosterId`).toBeDefined();
        expect(enc.rosters.some((r) => r.id === tile.rosterId)).toBe(true);
      }
    }
  });

  it('keeps monster gauge deltas as tuning references, never inline numbers', () => {
    const tuning = loadTuning(tuningJson);
    expect(resolveTuningRef(tuning, byId('spam_golem').gaugeOnHitExtraRef!)).toBe(10);
    expect(resolveTuningRef(tuning, byId('hallucination_spirit').gaugeOnAttackRef!)).toBe(25);
  });
});

// ═══════════════════════════════ AC5 — rewards resolve ════════════════════════════════

describe('rewards resolve', () => {
  const council = loadCouncil(councilJson);
  const cards = loadCards(cardsJson);
  const map = loadMap(mapJson);
  const tuning = loadTuning(tuningJson);

  const cardIds = new Set(cards.map((c) => c.id));
  const idOf = (name: string) => cards.find((c) => c.name === name)!.id;
  const agenda = (id: string) => council.agendas.find((a) => a.id === id)!;
  const grant = (tileId: string) => council.rewards[tileId];

  // ── agendas ──
  it('authors the 수수께끼 골렘 puzzle: 3 options, one answer, one hint line', () => {
    const riddle = agenda('riddle_golem');
    expect(riddle, 'riddle_golem agenda missing').toBeDefined();
    expect(riddle.kind).toBe('puzzle');
    expect(riddle.prompt.length).toBeGreaterThan(0);
    expect(riddle.options).toHaveLength(3);
    expect(riddle.answerOptionId).not.toBeNull();
    expect(riddle.options.map((o) => o.id)).toContain(riddle.answerOptionId);
    expect(typeof riddle.hintLine).toBe('string');
    expect((riddle.hintLine ?? '').length).toBeGreaterThan(0);
  });

  it('authors the 쓰러진 상인 choice: 구한다 / 지나친다, no authored answer', () => {
    const merchant = agenda('fallen_merchant');
    expect(merchant, 'fallen_merchant agenda missing').toBeDefined();
    expect(merchant.kind).toBe('choice');
    expect(merchant.options).toHaveLength(2);
    expect(merchant.options.map((o) => o.text)).toEqual(['구한다', '지나친다']);
    expect(merchant.answerOptionId).toBeNull();
  });

  it('gives every option an id and a stat the deciding vote can key off', () => {
    const statKeys = ['str', 'agi', 'int', 'wis', 'cha', 'con'];
    for (const item of council.agendas) {
      for (const option of item.options) {
        expect(option.id).toMatch(ID_RE);
        expect(option.text.length).toBeGreaterThan(0);
        expect(statKeys).toContain(option.relatedStat);
      }
    }
  });

  it('wires each council tile to its agenda', () => {
    const tile = (id: string) => map.tiles.find((t) => t.id === id)!;
    expect(tile('t3a').agendaId).toBe('riddle_golem');
    expect(tile('t3b').agendaId).toBe('fallen_merchant');
  });

  // ── the tile grant table (PRD §2.5) ──
  it('covers T1 · T2 · T3a · T3b · T4a · T5', () => {
    for (const tileId of ['t1', 't2', 't3a', 't3b', 't4a', 't5']) {
      expect(grant(tileId), `no grant for ${tileId}`).toBeDefined();
    }
  });

  it('T1 승리 hands over 도발 as a fixed grant', () => {
    const t1 = grant('t1');
    expect(t1.kind).toBe('fixed');
    expect(grantedCardIds(t1)).toEqual([idOf('도발')]);
  });

  it('T2 훈련장 offers the branch-preparation 3택1', () => {
    const t2 = grant('t2');
    expect(t2.kind).toBe('draft');
    expect(grantedCardIds(t2).sort()).toEqual(
      [idOf('겁이 없다'), idOf('승부사'), idOf('번역 렌즈')].sort(),
    );
  });

  it('T4a 훈련장 offers the path-A 3택1', () => {
    const t4a = grant('t4a');
    expect(t4a.kind).toBe('draft');
    expect(grantedCardIds(t4a).sort()).toEqual(
      [idOf('원한'), idOf('동료를 먼저'), idOf('화염 두루마리')].sort(),
    );
  });

  it('T5 승리 offers the 3택1 with a second shot at 승부사', () => {
    const t5 = grant('t5');
    expect(t5.kind).toBe('draft');
    expect(grantedCardIds(t5).sort()).toEqual(
      [idOf('이단 베기'), idOf('치유 물약 ×3'), idOf('승부사')].sort(),
    );
  });

  it('reads every draft size from tuning, not from an inline count', () => {
    for (const tileId of ['t2', 't4a', 't5']) {
      const draft = grant(tileId) as { optionCardIds: string[]; countRef: string; pickCountRef: string };
      expect(draft.optionCardIds).toHaveLength(3);
      expect(resolveTuningRef(tuning, draft.countRef)).toBe(3);
      expect(resolveTuningRef(tuning, draft.pickCountRef)).toBe(1);
    }
  });

  it('T3a splits on the puzzle answer: 정답 → 거울 방패, 오답 → gauge +15 all, no card', () => {
    const t3a = grant('t3a') as {
      kind: string;
      on: string;
      branches: Record<string, { cardId?: string; gaugeAllRef?: string }>;
    };
    expect(t3a.kind).toBe('conditional');
    expect(t3a.on).toBe('riddle_golem');

    const branches = Object.values(t3a.branches);
    expect(branches).toHaveLength(2);

    const withCard = branches.filter((b) => b.cardId);
    const withGauge = branches.filter((b) => b.gaugeAllRef);
    expect(withCard).toHaveLength(1);
    expect(withGauge).toHaveLength(1);
    expect(withCard[0].cardId).toBe(idOf('거울 방패'));
    expect(withGauge[0].cardId).toBeUndefined();
    expect(resolveTuningRef(tuning, withGauge[0].gaugeAllRef!)).toBe(15);
  });

  it('T3b splits on the merchant vote: 구한다 → 연민, 지나친다 → nothing', () => {
    const t3b = grant('t3b') as {
      kind: string;
      on: string;
      branches: Record<string, { cardId?: string; gaugeAllRef?: string }>;
    };
    expect(t3b.kind).toBe('conditional');
    expect(t3b.on).toBe('fallen_merchant');

    const optionIds = agenda('fallen_merchant').options.map((o) => o.id);
    expect(Object.keys(t3b.branches).sort()).toEqual([...optionIds].sort());

    const branches = Object.values(t3b.branches);
    const withCard = branches.filter((b) => b.cardId);
    expect(withCard).toHaveLength(1);
    expect(withCard[0].cardId).toBe(idOf('연민'));
    expect(branches.filter((b) => b.gaugeAllRef)).toHaveLength(0);
  });

  it('resolves every granted card id against cards.json', () => {
    for (const [tileId, g] of Object.entries(council.rewards)) {
      for (const cardId of grantedCardIds(g)) {
        expect(cardIds.has(cardId), `${tileId} grants unknown card '${cardId}'`).toBe(true);
      }
    }
  });

  it('makes all 11 cards reachable within one run — the union covers the whole pool', () => {
    const reachable = new Set<string>();
    for (const g of Object.values(council.rewards)) {
      for (const cardId of grantedCardIds(g)) reachable.add(cardId);
    }
    expect([...reachable].sort()).toEqual([...cardIds].sort());
    expect(reachable.size).toBe(11);
  });

  it('hands both T3 card interactions out at T2, before the tile that uses them', () => {
    // 「번역 렌즈」 (T3a hint) and 「승부사」 (T3b merchant flip) must be draftable at T2.
    expect(grantedCardIds(grant('t2'))).toContain(idOf('번역 렌즈'));
    expect(grantedCardIds(grant('t2'))).toContain(idOf('승부사'));
  });

  it('grants nothing on the tiles PRD §2.5 leaves empty', () => {
    for (const tileId of ['t4b', 't6', 't7']) {
      const g = council.rewards[tileId];
      if (g !== undefined) expect(grantedCardIds(g)).toEqual([]);
    }
  });
});
