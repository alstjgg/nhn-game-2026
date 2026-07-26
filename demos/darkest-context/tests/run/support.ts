// u13 — shared fixtures for the run slice. Not a spec file: vitest collects
// `tests/**/*.test.ts` only, so nothing here runs on its own.
//
// Two rules this module exists to keep:
//   · every automated gate walks at duration 0 (`walk.testDurationMs`, PRD §5), and
//   · nothing in the run slice may wait on a clock (INV-6) — so the "slow thing"
//     stand-in here is a manually settled promise, never a timer.
import { loadBundledGameData } from '../../src/data/loader.ts';
import type { AgentDecision, DecideRequest, SituationSnapshot } from '../../src/ai/contract.ts';
import type { AIAdapter } from '../../src/ai/adapter.ts';
import type { RunController, RunEvent, RunPartyUnit, TileResult } from '../../src/run/types.ts';

const data = loadBundledGameData();

export const MAP = data.map;
export const TUNING = data.tuning;
export const HEROES = data.heroes;

/** The gate walk ref — `data/tuning.json` declares it as 0 (PRD §2.4 "0 in tests"). */
export const TEST_WALK_REF = 'walk.testDurationMs';
/** The shipped default ref — 4s, for asserting the FSM reports it without waiting on it. */
export const PLAY_WALK_REF = 'walk.durationMs';

/** A 3-unit party (PRD §2.6 "with a 3-unit party"), at authored full HP. */
export const PARTY: readonly RunPartyUnit[] = HEROES.slice(0, 3).map((h) => ({
  unitId: h.id,
  hp: h.hp,
}));

/** Every unit at 0 HP — the defeat condition of PRD §2.5. */
export const WIPED: readonly RunPartyUnit[] = PARTY.map((u) => ({ ...u, hp: 0 }));

/** One survivor left standing — the near-miss that must NOT read as defeat. */
export const ONE_SURVIVOR: readonly RunPartyUnit[] = PARTY.map((u, i) => ({
  ...u,
  hp: i === PARTY.length - 1 ? 1 : 0,
}));

export const PATH_A = ['t1', 't2', 't3a', 't4a', 't5', 't6', 't7'] as const;
export const PATH_B = ['t1', 't2', 't3b', 't4b', 't5', 't6', 't7'] as const;

/** A promise the test settles by hand — the event-driven stand-in for a timer. */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason?: unknown): void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Records the FSM's emissions so a spec can assert the whole ordered trace. */
export interface Recorder {
  events: RunEvent[];
  types(): string[];
  ofType<T extends RunEvent['type']>(type: T): Extract<RunEvent, { type: T }>[];
  clear(): void;
}

export function recorder(run: RunController): Recorder {
  const events: RunEvent[] = [];
  run.on((event) => events.push(event));
  return {
    events,
    types: () => events.map((e) => e.type),
    ofType: <T extends RunEvent['type']>(type: T) =>
      events.filter((e): e is Extract<RunEvent, { type: T }> => e.type === type),
    clear: () => {
      events.length = 0;
    },
  };
}

export interface TraverseOptions {
  /** Which fork to take at the single input point of the run. */
  branchTo: string;
  /** Per-tile outcome handed back to the FSM when its event finishes. */
  resultFor?: (tileId: string) => TileResult | undefined;
  /** Stop before resolving this tile's event (leaves the run mid-flight). */
  stopAtTile?: string;
}

/**
 * Drives a run the way the app does: emit walk-complete, resolve the tile event,
 * answer the one branch request. Never reads a clock. Throws instead of spinning
 * forever, so a stuck FSM fails as a test rather than a hang.
 */
export function traverse(run: RunController, options: TraverseOptions): void {
  run.start();
  for (let step = 0; step < 100; step++) {
    const state = run.getState();
    if (options.stopAtTile !== undefined && state.tileId === options.stopAtTile && state.phase === 'tile') {
      return;
    }
    switch (state.phase) {
      case 'walking':
        run.walkComplete();
        break;
      case 'tile':
        run.resolveTile(options.resultFor?.(state.tileId));
        break;
      case 'branch':
        run.chooseBranch(options.branchTo);
        break;
      default:
        return;
    }
  }
  throw new Error(`traverse: run did not terminate in 100 steps (phase=${run.getState().phase})`);
}

export const SNAPSHOT: SituationSnapshot = {
  turn: 1,
  self: { id: 'garrett', name: '가렛', hp: 24, hpMax: 24, alive: true, gaugeTier: 0 },
  allies: [{ id: 'fiona', name: '피오나', hp: 18, hpMax: 18, alive: true }],
  enemies: [{ id: 'spam_golem_1', name: '스팸 골렘', hp: 12, hpMax: 12, alive: true }],
  availableActions: [
    { id: 'strike', label: '공격', needsTarget: true },
    { id: 'defend', label: '방어', needsTarget: false },
  ],
  corrupted: false,
};

export function decideRequest(unitId = 'garrett'): DecideRequest {
  return { unitId, equippedCardIds: [], snapshot: SNAPSHOT };
}

export function decision(say: string): AgentDecision {
  return { action: 'strike', target: 'spam_golem_1', say, because: ['garrett.default'] };
}

/** An adapter whose every `decide` hangs until the spec settles it by hand. */
export interface GatedAdapter extends AIAdapter {
  readonly requests: DecideRequest[];
  /** The nth in-flight call's settle handle. */
  gate(index: number): Deferred<AgentDecision | null>;
}

export function gatedAdapter(): GatedAdapter {
  const requests: DecideRequest[] = [];
  const gates: Deferred<AgentDecision | null>[] = [];
  return {
    mode: 'stub',
    requests,
    gate: (index) => {
      const g = gates[index];
      if (g === undefined) throw new Error(`gatedAdapter: no call #${index} was made`);
      return g;
    },
    decide: (req: DecideRequest) => {
      requests.push(req);
      const g = deferred<AgentDecision | null>();
      gates.push(g);
      return g.promise;
    },
    stance: async () => null,
  };
}
