// u13 — the run FSM (PRD §2.4, §2.5).
//
// The run advances on events, never on a clock (INV-6): `start()` emits
// `walk-start` and then waits — only when the caller reports `walkComplete()`
// does the arrived tile's event fire, and only when the caller reports
// `resolveTile()` does the run move on. The declared walk budget travels on the
// event for the view to animate against; this module never waits on it.
//
// Randomness enters exactly once (PRD §2.2): the run seed is drawn at
// construction from `core/rng.ts::createSeed()`, stored in run state, and never
// re-drawn — a restart is a new run, so it draws its own.

import { createSeed } from '../core/rng.ts';
import { resolveTuningRef } from '../data/loader.ts';
import type { GameMap, Tile, TileKind, Tuning } from '../data/schema.ts';
import { buildMapGraph } from './map.ts';
import type { PrefireSlot } from './prefire.ts';
import type {
  PrefiredAnswer,
  RunController,
  RunEvent,
  RunListener,
  RunPartyUnit,
  RunPhase,
  RunState,
  TileResult,
  Unsubscribe,
} from './types.ts';

/** Only a fight is worth a head start — the other tile kinds have no opening request. */
const PREFIRE_KINDS: readonly TileKind[] = ['combat', 'combat_final'];

export interface CreateRunOptions {
  map: GameMap;
  tuning: Tuning;
  /** Starting party — restored as-is on restart. */
  party: readonly RunPartyUnit[];
  /**
   * Overrides each tile's own walk budget ref (INV-8). Automated gates pass
   * `walk.testDurationMs` (0); play uses the tile's declared `walk.durationMs`.
   */
  walkDurationRef?: string;
  /** Replays a recorded run. When given, no seed is ever drawn — not even on restart. */
  seed?: number;
  /** Optional latency cover: the walk toward a combat tile issues its first request early. */
  prefire?: PrefireSlot;
}

export function createRun(options: CreateRunOptions): RunController {
  const graph = buildMapGraph(options.map);
  const startParty: readonly RunPartyUnit[] = options.party.map((unit) => ({ ...unit }));
  const listeners = new Set<RunListener>();
  const slot = options.prefire;

  const drawSeed = (): number => options.seed ?? createSeed();

  let seed = drawSeed();
  let phase: RunPhase = 'idle';
  let tileId = graph.startTileId;
  let visited: readonly string[] = [];
  let party: readonly RunPartyUnit[] = startParty;
  let branchOptions: readonly string[] = [];

  const refusal = (action: string): Error =>
    new Error(`run: ${action} is not allowed in phase '${phase}'`);

  const emit = (event: RunEvent): void => {
    for (const listener of [...listeners]) listener(event);
  };

  const walkBudgetMs = (tile: Tile): number =>
    resolveTuningRef(options.tuning, options.walkDurationRef ?? tile.walkDurationRef);

  const beginWalk = (target: string): void => {
    const tile = graph.tile(target);
    tileId = target;
    phase = 'walking';
    let prefired = false;
    if (slot !== undefined && PREFIRE_KINDS.includes(tile.kind)) {
      slot.issue(tile);
      prefired = slot.pendingTileId === tile.id;
    }
    emit({ type: 'walk-start', tileId: target, durationMs: walkBudgetMs(tile), prefired });
  };

  const isWipe = (units: readonly RunPartyUnit[]): boolean =>
    units.length > 0 && units.every((unit) => unit.hp <= 0);

  const start = (): void => {
    if (phase !== 'idle') {
      throw new Error(`run: start is not allowed in phase '${phase}' — restart() first`);
    }
    emit({ type: 'run-start', seed });
    beginWalk(graph.startTileId);
  };

  const walkComplete = (): void => {
    if (phase !== 'walking') throw refusal('walkComplete');
    const tile = graph.tile(tileId);
    phase = 'tile';
    emit({ type: 'walk-complete', tileId: tile.id });
    const prefired: PrefiredAnswer | null =
      slot !== undefined && slot.pendingTileId === tile.id ? slot.claim(tile.id) : null;
    emit({ type: 'tile-event', tile, prefired });
  };

  const resolveTile = (result?: TileResult): void => {
    if (phase !== 'tile') throw refusal('resolveTile');
    const tile = graph.tile(tileId);
    if (result?.party !== undefined) {
      party = result.party.map((unit) => ({ ...unit }));
    }
    visited = [...visited, tile.id];
    emit({ type: 'tile-resolved', tileId: tile.id });

    if (isWipe(party)) {
      phase = 'defeat';
      emit({ type: 'defeat', tileId: tile.id });
      return;
    }
    if (graph.isTerminal(tile.id)) {
      phase = 'clear';
      emit({ type: 'clear', tileId: tile.id });
      return;
    }
    const successors = graph.next(tile.id);
    if (graph.isBranch(tile.id)) {
      phase = 'branch';
      branchOptions = [...successors];
      emit({ type: 'branch-request', fromTileId: tile.id, options: [...successors] });
      return;
    }
    beginWalk(successors[0]);
  };

  const chooseBranch = (target: string): void => {
    if (phase !== 'branch') throw refusal('chooseBranch');
    if (!branchOptions.includes(target)) {
      throw new Error(
        `run: '${target}' is not on offer at '${tileId}' (offered: ${branchOptions.join(', ')})`,
      );
    }
    const fromTileId = tileId;
    branchOptions = [];
    emit({ type: 'branch-chosen', fromTileId, tileId: target });
    beginWalk(target);
  };

  const restart = (): void => {
    // Anything still in flight belongs to the run being abandoned.
    slot?.discard();
    seed = drawSeed();
    phase = 'idle';
    tileId = graph.startTileId;
    visited = [];
    party = startParty;
    branchOptions = [];
  };

  const getState = (): RunState =>
    Object.freeze({
      seed,
      phase,
      tileId,
      visited: Object.freeze([...visited]),
      party: Object.freeze(party.map((unit) => Object.freeze({ ...unit }))),
      branchOptions: Object.freeze([...branchOptions]),
    });

  const on = (listener: RunListener): Unsubscribe => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return Object.freeze({ getState, on, start, walkComplete, resolveTile, chooseBranch, restart });
}
