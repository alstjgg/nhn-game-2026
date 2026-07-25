// Primitives harness — mounts every u7 primitive once, from a LOCAL fixture.
//
// The fixture is the harness's own business on purpose: e2e/primitives.spec.ts
// reads ids out of `window.__primitives` instead of hardcoding them, so the spec
// asserts WIRING and never which Korean line this page happens to carry. Nothing
// here reads data/ — a screen unit's data wiring is not what this page proves.

import {
  CARD_TYPES,
  VIAL_STATES,
  createBubble,
  createCard,
  createStage,
  createUnitPanel,
  createUnitSheet,
  createVial,
  vialStateForGauge,
  type CardType,
  type UnitView,
} from '../../../src/ui/index.ts';
import './harness.css';

// PRD §2.5 tiers, as a HARNESS FIXTURE — the shipped numbers live in
// data/tuning.json (INV-8), and no src/ module is allowed to know them.
const THRESHOLDS = { uneasy: 40, limit: 70, overload: 100 };

const HEROES: UnitView[] = [
  {
    id: 'garrett',
    name: '가렛',
    side: 'hero',
    gauge: 22,
    items: [
      { id: 'persona:garrett', kind: 'persona', text: '앞장서는 방패병. 물러서는 법을 배운 적이 없다.' },
      { id: 'card:provoke', kind: 'card', text: '「도발」 — 적의 시선은 내가 전부 가져간다.' },
      { id: 'stat:garrett-agi', kind: 'stat', text: '민첩 6' },
      { id: 'stat:garrett-hp', kind: 'stat', text: '체력 34 / 34' },
    ],
  },
  {
    id: 'fiona',
    name: '피오나',
    side: 'hero',
    gauge: 55,
    items: [
      { id: 'persona:fiona', kind: 'persona', text: '순례 사제. 등불을 들고 맨 뒤에 선다.' },
      { id: 'card:fearless', kind: 'card', text: '「겁이 없다」 — 두려움을 계산에 넣지 않는다.' },
      { id: 'stat:fiona-agi', kind: 'stat', text: '민첩 8' },
      { id: 'stat:fiona-hp', kind: 'stat', text: '체력 26 / 30' },
    ],
  },
  {
    id: 'selene',
    name: '셀레네',
    side: 'hero',
    gauge: 78,
    items: [
      { id: 'persona:selene', kind: 'persona', text: '떠돌이 계산가. 이득이 없으면 칼을 뽑지 않는다.' },
      { id: 'card:gambler', kind: 'card', text: '「승부사」 — 판이 커질수록 손이 가벼워진다.' },
      { id: 'stat:selene-agi', kind: 'stat', text: '민첩 11' },
      { id: 'stat:selene-hp', kind: 'stat', text: '체력 21 / 24' },
    ],
  },
];

const ENEMIES: UnitView[] = [
  {
    id: 'spam-golem',
    name: '스팸 골렘',
    side: 'enemy',
    gauge: 0,
    items: [
      { id: 'persona:spam-golem', kind: 'persona', text: '쓸모없는 문장을 퍼부어 머리를 채운다.' },
      { id: 'stat:spam-golem-hp', kind: 'stat', text: '체력 40 / 40' },
    ],
  },
  {
    id: 'halluc-wisp',
    name: '환각 정령',
    side: 'enemy',
    gauge: 0,
    items: [
      { id: 'persona:halluc-wisp', kind: 'persona', text: '없는 것을 보여주고 있는 것을 지운다.' },
      { id: 'stat:halluc-wisp-hp', kind: 'stat', text: '체력 22 / 22' },
    ],
  },
];

const CARD_FIXTURE: { id: string; type: CardType; title: string; sentence: string }[] = [
  { id: 'fearless', type: 'prompt', title: '「겁이 없다」', sentence: '두려움을 계산에 넣지 않는다.' },
  { id: 'heretic-cut', type: 'skill', title: '「이단 베기」', sentence: '한 호흡에 두 번 벤다.' },
  { id: 'lens', type: 'mcp', title: '「번역 렌즈」', sentence: '읽을 수 없던 문장을 읽어낸다.' },
];

// The decision currently on screen: whose bubble it is and what it cites (INV-3).
const BUBBLE_UNIT = HEROES[0];
const BUBBLE_SAY = '내가 앞에 선다. 뒤는 맡긴다.';
const CITED_ITEM_IDS = ['persona:garrett', 'card:provoke'];

const UNITS = [...HEROES, ...ENEMIES];

/** Short chip labels, so a because chip reads as game text instead of an id. */
const CHIP_LABELS: Record<string, string> = {
  'persona:garrett': '앞장서는 방패병',
  'card:provoke': '「도발」',
};

function block(label: string, testid?: string): { section: HTMLElement; row: HTMLElement } {
  const section = document.createElement('section');
  section.className = 'harness-block';

  const heading = document.createElement('p');
  heading.className = 'harness-block__label';
  heading.textContent = label;

  const row = document.createElement('div');
  row.className = 'harness-row';
  if (testid !== undefined) row.dataset.testid = testid;

  section.append(heading, row);
  return { section, row };
}

function mount(root: HTMLElement): void {
  // ── stage: heroes left, enemies right, nobody moves ──
  const stage = block('전투 무대');
  stage.row.append(createStage({ heroes: HEROES, enemies: ENEMIES }));

  // ── unit panels: click one to open its sheet ──
  const panels = block('유닛 패널', 'panel-row');
  const sheetSlot = document.createElement('div');
  sheetSlot.className = 'harness-slot';

  const openSheet = (unit: UnitView): void => {
    const because = unit.id === BUBBLE_UNIT.id ? CITED_ITEM_IDS : [];
    sheetSlot.replaceChildren(createUnitSheet(unit, { because }));
  };

  for (const hero of HEROES) {
    panels.row.append(
      createUnitPanel(hero, {
        vialState: vialStateForGauge(hero.gauge, THRESHOLDS),
        onSelect: openSheet,
      }),
    );
  }
  panels.section.append(sheetSlot);

  // ── the decision on screen + its because chips ──
  const bubble = block('말풍선');
  bubble.row.append(
    createBubble({
      unitId: BUBBLE_UNIT.id,
      say: BUBBLE_SAY,
      because: CITED_ITEM_IDS,
      labels: CHIP_LABELS,
    }),
  );

  // ── one card per type ──
  const cards = block('카드', 'card-row');
  for (const card of CARD_FIXTURE) cards.row.append(createCard(card));

  // ── every gauge tier ──
  const vials = block('게이지 vial', 'vial-row');
  for (const state of VIAL_STATES) vials.row.append(createVial({ state }));

  root.append(stage.section, panels.section, bubble.section, cards.section, vials.section);
}

const root = document.getElementById('harness');
if (root) {
  mount(root);
}

Object.assign(window, {
  __primitives: {
    heroIds: HEROES.map((u) => u.id),
    enemyIds: ENEMIES.map((u) => u.id),
    bubbleUnitId: BUBBLE_UNIT.id,
    citedItemIds: CITED_ITEM_IDS,
    // Handy for a later screen unit reading this page as a reference.
    cardTypes: [...CARD_TYPES],
    unitIds: UNITS.map((u) => u.id),
  },
});
