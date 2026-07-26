// Stage harness — one full run on REAL data, driven as an automated gate.
//
// The screen renders; this page plays the PLAYER and the tile events. Both scripts
// are here on purpose: `src/screens/stage/**` must contain no auto-picker and no
// tile resolver, or it would be deciding the run instead of drawing it.
//
// Every advance is an explicit hand-back, never a clock (INV-6). The run is created
// with `walkDurationRef: 'walk.testDurationMs'` (0 ms), and the scripted steps are
// drained through a trampoline so the FSM is never re-entered from inside its own
// emit.
//
//   ?path=a|b          [a]      which fork the auto-picker takes
//   ?branch=auto|hold  [auto]   `hold` leaves the fork standing for a spec click
//   ?scenario=clear|defeat [clear]
//   ?walk=auto|manual  [auto]   `manual` holds every walk open for inspection
//   ?gauge=<0-100>     [0]      context gauge applied to every hero

import decisionsRaw from '../../../data/decisions.json';
import { loadBundledGameData } from '../../../src/data/loader.ts';
import { createRun } from '../../../src/run/fsm.ts';
import type { RunPartyUnit, TileResult } from '../../../src/run/types.ts';
import { loadChatterPool, type ChatterPlay } from '../../../src/screens/stage/chatter.ts';
import { createStageScreen } from '../../../src/screens/stage/index.ts';
import { branchLabelFor } from '../../../src/screens/stage/labels.ts';
import type { WalkUnitView } from '../../../src/screens/stage/walk.ts';
import './harness.css';

const { heroes, map, tuning } = loadBundledGameData();

/** The demo party of PRD §2.3, in party order. */
const PARTY_IDS = ['garrett', 'fiona', 'selene'];

/** Which tile resolution wipes the party under `?scenario=defeat` — the third. */
const DEFEAT_AT_TILE_INDEX = 2;

const params = new URLSearchParams(window.location.search);

const forkTileId = params.get('path') === 'b' ? 't3b' : 't3a';
const holdBranch = params.get('branch') === 'hold';
const wipes = params.get('scenario') === 'defeat';
const manualWalk = params.get('walk') === 'manual';

const rawGauge = params.get('gauge');
const gauge = rawGauge === null ? 0 : Number(rawGauge);
if (!Number.isFinite(gauge) || gauge < 0 || gauge > 100) {
  throw new Error(`?gauge expects a number in 0–100, got '${String(rawGauge)}'`);
}

const roster = PARTY_IDS.map((unitId) => {
  const hero = heroes.find((entry) => entry.id === unitId);
  if (hero === undefined) {
    throw new Error(`harness party member '${unitId}' is missing from data/heroes.json`);
  }
  return hero;
});

const party: WalkUnitView[] = roster.map((hero) => ({
  unitId: hero.id,
  name: hero.name,
  gauge,
}));

const startParty: RunPartyUnit[] = roster.map((hero) => ({ unitId: hero.id, hp: hero.hp }));

/** One entry per walk — what the deterministic picker played, in walk order. */
const chatterLog: Array<{ tileIndex: number; ids: string[] }> = [];

const controller = createRun({
  map,
  tuning,
  party: startParty,
  walkDurationRef: 'walk.testDurationMs',
});

/**
 * The scripted steps, drained one at a time. A listener may only ENQUEUE — running
 * `walkComplete()` straight out of a `walk-start` handler would re-enter the FSM
 * mid-emit, and the run would unwind in the wrong order.
 */
const queue: Array<() => void> = [];
let pumping = false;

function pump(): void {
  if (pumping) return;
  pumping = true;
  try {
    for (let step = queue.shift(); step !== undefined; step = queue.shift()) step();
  } finally {
    pumping = false;
  }
}

let resolvedTiles = 0;

function nextTileResult(): TileResult | undefined {
  const index = resolvedTiles;
  resolvedTiles += 1;
  if (wipes && index === DEFEAT_AT_TILE_INDEX) {
    return { party: startParty.map((unit) => ({ unitId: unit.unitId, hp: 0 })) };
  }
  return undefined;
}

controller.on((event) => {
  if (event.type === 'run-start') {
    resolvedTiles = 0;
    chatterLog.length = 0;
    return;
  }
  if (event.type === 'walk-start' && !manualWalk) {
    queue.push(() => {
      controller.walkComplete();
    });
    return;
  }
  if (event.type === 'tile-event') {
    queue.push(() => {
      controller.resolveTile(nextTileResult());
    });
    return;
  }
  if (event.type === 'branch-request' && !holdBranch) {
    queue.push(() => {
      controller.chooseBranch(forkTileId);
    });
  }
});

let runId = 0;

const screen = createStageScreen({
  controller,
  party,
  chatter: loadChatterPool(decisionsRaw.chatter),
  tuning,
  branchLabel: branchLabelFor(map.tiles),
  onBranchPick: (tileId) => {
    controller.chooseBranch(tileId);
    pump();
  },
  onRestart: () => {
    controller.restart();
    runId += 1;
    controller.start();
    pump();
  },
  onChatter: (play: ChatterPlay) => {
    chatterLog.push({
      tileIndex: play.tileIndex,
      ids: play.exchanges.map((exchange) => exchange.id),
    });
  },
});

const root = document.getElementById('harness');
if (root) root.append(screen);

controller.start();
pump();

const fixture = {
  chatterLog,
  unitIds: party.map((unit) => unit.unitId),
};

// `state` is read at assertion time, so it has to be live rather than a snapshot
// taken at boot. `runId` is harness-owned: RunState carries none, and A12 needs a
// countable proof that 재시작 began a NEW run.
Object.defineProperty(fixture, 'state', {
  enumerable: true,
  get: () => ({ ...controller.getState(), runId }),
});

// Non-enumerable: the spec reads the fixture as data, and a function-valued own key
// would have to cross that boundary too.
Object.defineProperty(fixture, 'completeWalk', {
  value: (): void => {
    if (controller.getState().phase !== 'walking') return;
    controller.walkComplete();
    pump();
  },
});

Object.assign(window, { __stage: fixture });
