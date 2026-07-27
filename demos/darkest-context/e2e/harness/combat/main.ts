// Combat harness — one scripted fight on REAL data, driven as an automated gate.
//
// The screen renders; this page plays the SCRIPT. Both scripts are here on purpose:
// `src/screens/combat/**` must contain no scenario seeding and no query parsing, or
// it would be deciding the fight instead of drawing it.
//
// Stub mode, adapter latency 0, `tieBreak` policy `index` (PRD §5) — so the fight
// replays identically and no spec races a clock (INV-6).
//
//   ?tile=t1|t5|t7                default: t1        which roster fights
//   ?gauge=<unitId>:<0-100>       repeatable         seeds ONE hero's starting gauge
//   ?equip=<unitId>:<cardId>      repeatable         seeds one card on one unit
//   ?scenario=default|victory|defeat|silent          default: default
//       victory — roster HP seeded to 1 so the party wins on the opening turn
//       defeat  — hero HP seeded to 1 so the whole party goes down
//       silent  — the adapter never answers; every judgment must degrade (INV-7)
//
// Playback is HELD until `window.__combat.start()`, and then advances one beat per
// `step()`. Both are harness affordances, never player controls: nothing in the DOM
// invokes them, and they are defined non-enumerably so the published fixture stays
// plain, serialisable data.

import decisionsRaw from '../../../data/decisions.json';
import { bucketConfigOf } from '../../../src/ai/bucket.ts';
import type { BucketConfig, DecisionPool, PoolSection } from '../../../src/ai/bucket.ts';
import { DEFAULT_KEY } from '../../../src/ai/bucket.ts';
import type { AIAdapter } from '../../../src/ai/contract.ts';
import { createFallbackDecider, createStubAdapter } from '../../../src/ai/stub.ts';
import { createGauge } from '../../../src/combat/gauge.ts';
import { createNoiseInjector } from '../../../src/combat/noise.ts';
import type { CombatDeps } from '../../../src/combat/types.ts';
import { createTieBreaker } from '../../../src/core/tiebreak.ts';
import { loadBundledGameData, resolveTuningRef } from '../../../src/data/loader.ts';
import type { Encounters, Hero } from '../../../src/data/schema.ts';
import { createLoadout, equipCard } from '../../../src/equip/loadout.ts';
import type { PartyLoadout } from '../../../src/equip/types.ts';
import {
  buildHeroSheet,
  createCombatPlayer,
  createCombatScreen,
  createOverloadFallback,
  createRecordingAdapter,
  type HeroSheet,
} from '../../../src/screens/combat/index.ts';
import type { UnitView } from '../../../src/ui/index.ts';
import './harness.css';

const { cards, encounters, heroes, tuning } = loadBundledGameData();

/** The demo party of PRD §2.3, in party order. */
const PARTY_IDS = ['garrett', 'fiona', 'selene'];

/** The situation thresholds every stub caller in this repo runs on (PRD §2.2). */
const BUCKET_CONFIG: BucketConfig = bucketConfigOf(tuning);

/**
 * How far a gate playthrough runs. A party that has coerced its way out of every
 * offensive action can hold a stalemate forever; the harness stops watching rather
 * than hanging, and every scenario that HAS an outcome reaches it well inside this.
 */
const MAX_TURNS = 10;

const TILE_IDS = ['t1', 't5', 't7'];
const SCENARIOS = ['default', 'victory', 'defeat', 'silent'];

const params = new URLSearchParams(window.location.search);

const tileId = params.get('tile') ?? TILE_IDS[0];
if (!TILE_IDS.includes(tileId)) {
  throw new Error(`?tile expects one of ${TILE_IDS.join(' | ')}, got '${tileId}'`);
}

const scenario = params.get('scenario') ?? SCENARIOS[0];
if (!SCENARIOS.includes(scenario)) {
  throw new Error(`?scenario expects one of ${SCENARIOS.join(' | ')}, got '${scenario}'`);
}

/** `?equip=selene:gambler`, repeatable. A typo is loud on purpose — this is a gate page. */
const equipped = new Map<string, string[]>();
for (const pair of params.getAll('equip')) {
  const [unitId, cardId] = pair.split(':');
  if (!unitId || !cardId) throw new Error(`?equip expects <unitId>:<cardId>, got '${pair}'`);
  if (!PARTY_IDS.includes(unitId)) throw new Error(`?equip names no party unit: '${unitId}'`);
  if (!cards.some((card) => card.id === cardId)) {
    throw new Error(`data/cards.json carries no card '${cardId}'`);
  }
  equipped.set(unitId, [...(equipped.get(unitId) ?? []), cardId]);
}

/** `?gauge=fiona:70`, repeatable. Seeds a STARTING reading; the gauge still rises. */
const seededGauge = new Map<string, number>();
for (const pair of params.getAll('gauge')) {
  const [unitId, raw] = pair.split(':');
  if (!unitId || raw === undefined) {
    throw new Error(`?gauge expects <unitId>:<0-100>, got '${pair}'`);
  }
  if (!PARTY_IDS.includes(unitId)) throw new Error(`?gauge names no party unit: '${unitId}'`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > tuning.gauge.max) {
    throw new Error(`?gauge expects a number in 0–${tuning.gauge.max}, got '${raw}'`);
  }
  seededGauge.set(unitId, value);
}

// ── the scenario seeds: balance numbers, never a rule change ─────────────────

/** `defeat` — the party is one blow from the floor, so a total KO is reachable. */
const fightHeroes: Hero[] =
  scenario === 'defeat' ? heroes.map((hero) => ({ ...hero, hp: 1 })) : [...heroes];

/** `victory` — the roster is one blow from the floor, so the opening turn wins it. */
const fightEncounters: Encounters =
  scenario === 'victory'
    ? {
        ...encounters,
        monsters: encounters.monsters.map((monster) => ({ ...monster, hp: 1 })),
      }
    : encounters;

// ── the canned pool, nested the way the adapter reads it ────────────────────

interface CombatRow {
  unitId: string;
  bucket: string;
  cardId: string | null;
  decision: unknown;
}

function combatPool(rows: readonly CombatRow[]): DecisionPool {
  const decisions: Record<string, PoolSection> = {};
  for (const row of rows) {
    const unit = (decisions[row.unitId] ??= {});
    const section = (unit[row.bucket] ??= {});
    section[row.cardId ?? DEFAULT_KEY] = row.decision;
  }
  return { decisions };
}

const stub = createStubAdapter({
  pool: combatPool(decisionsRaw.combat as unknown as readonly CombatRow[]),
  latencyMs: resolveTuningRef(tuning, 'latency.unit'),
  timeoutMs: resolveTuningRef(tuning, 'timeout.stub'),
  bucketConfig: BUCKET_CONFIG,
});

/** `silent` — the budget expires on every ask, which the adapter reports as `null`. */
const silent: AIAdapter = {
  mode: 'stub',
  decide: () => Promise.resolve(null),
  stance: () => Promise.resolve(null),
};

const recorder = createRecordingAdapter(scenario === 'silent' ? silent : stub);

// ── the party, its sheets, and the engine deps ──────────────────────────────

function heroById(unitId: string): Hero {
  const hero = fightHeroes.find((candidate) => candidate.id === unitId);
  if (hero === undefined) {
    throw new Error(`harness party member '${unitId}' is missing from data/heroes.json`);
  }
  return hero;
}

let party: PartyLoadout = createLoadout(PARTY_IDS);
for (const [unitId, cardIds] of equipped) {
  for (const cardId of cardIds) {
    const card = cards.find((candidate) => candidate.id === cardId);
    if (card === undefined) throw new Error(`data/cards.json carries no card '${cardId}'`);
    party = equipCard(party, unitId, card, tuning.slots);
  }
}

const sheets = new Map<string, HeroSheet>(
  PARTY_IDS.map((unitId) => [
    unitId,
    buildHeroSheet(heroById(unitId), equipped.get(unitId) ?? [], cards),
  ]),
);

function sheetOf(unitId: string): HeroSheet {
  const sheet = sheets.get(unitId);
  if (sheet === undefined) throw new Error(`no sheet was built for '${unitId}'`);
  return sheet;
}

const sheetIdsOf = (unitId: string): readonly string[] =>
  sheets.get(unitId)?.ids ?? [];

const gauge = createGauge({
  unitIds: PARTY_IDS,
  tuning,
  encounters: fightEncounters,
  noise: createNoiseInjector({ encounters: fightEncounters }),
});
gauge.setAll([...seededGauge].map(([id, value]) => ({ id, gauge: value })));

const deps: CombatDeps = {
  tuning,
  heroes: fightHeroes,
  cards,
  encounters: fightEncounters,
  adapter: recorder.adapter,
  fallbackFor: createOverloadFallback({
    base: createFallbackDecider(fightHeroes),
    authored: decisionsRaw.overload,
    isOverloaded: (unitId) =>
      PARTY_IDS.includes(unitId) && gauge.tierNameOf(unitId) === 'overload',
    sheetIdsOf,
  }),
  tieBreak: createTieBreaker({ policy: tuning.tieBreak.test }),
  sheetIdsOf,
  gauge: gauge.port(),
};

// ── the stage line-up: REAL entities only, never a phantom (INV-4) ──────────

const roster = fightEncounters.rosters.find((entry) => entry.tileId === tileId);
if (roster === undefined) {
  throw new Error(`tile '${tileId}' declares no roster in data/encounters.json`);
}

const heroViews: UnitView[] = PARTY_IDS.map((unitId) => {
  const hero = heroById(unitId);
  return {
    id: hero.id,
    name: hero.name,
    side: 'hero',
    gauge: gauge.valueOf(hero.id),
    items: sheetOf(hero.id).items,
  };
});

const enemyViews: UnitView[] = roster.entries.map((entry) => {
  const monster = fightEncounters.monsters.find((candidate) => candidate.id === entry.monsterId);
  if (monster === undefined) {
    throw new Error(`monster '${entry.monsterId}' is not declared in data/encounters.json`);
  }
  return { id: entry.instanceId, name: monster.name, side: 'enemy', gauge: 0, items: [] };
});

const screen = createCombatScreen({
  tileId,
  heroes: heroViews,
  enemies: enemyViews,
  tiers: Object.fromEntries(PARTY_IDS.map((id) => [id, gauge.tierNameOf(id)])),
  labels: Object.fromEntries(PARTY_IDS.map((id) => [id, sheetOf(id).labels])),
});

const player = createCombatPlayer({
  tileId,
  party,
  deps,
  gauge,
  screen,
  requests: recorder.take,
  bucketConfig: BUCKET_CONFIG,
  maxTurns: MAX_TURNS,
});

const root = document.getElementById('harness');
if (root) root.append(screen.element);

// Non-enumerable: the spec reads `window.__combat` as a serialisable value, so a
// function-valued own key would have to cross that boundary too.
const { fixture } = player;
Object.defineProperty(fixture, 'start', { value: () => player.start(), enumerable: false });
Object.defineProperty(fixture, 'step', { value: () => player.step(), enumerable: false });
Object.defineProperty(fixture, 'drain', { value: () => player.drain(), enumerable: false });

Object.assign(window, { __combat: fixture });
