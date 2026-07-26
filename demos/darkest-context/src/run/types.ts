// u13 — the run slice's public shapes (PRD §2.4, §2.5).
//
// One vocabulary for the whole slice: the map graph walks `Tile`s, the FSM
// publishes `RunEvent`s, and the shell reads `RunState`. Nothing here knows how
// long a walk takes in wall-clock terms — a walk ends when `walk-complete`
// arrives, never when a clock says so (INV-6).

import type { AgentDecision } from '../ai/contract.ts';
import type { Tile } from '../data/schema.ts';

/**
 * Where a run stands.
 *
 * `idle` → not started (or freshly restarted) · `walking` → between tiles,
 * waiting on the walk-complete event · `tile` → the arrived tile's event is in
 * play · `branch` → the single player input point of a run · `clear` / `defeat`
 * → terminal, every further input is refused.
 */
export type RunPhase = 'idle' | 'walking' | 'tile' | 'branch' | 'clear' | 'defeat';

/** One party member as the run tracks it — identity plus current HP (PRD §2.5). */
export interface RunPartyUnit {
  readonly unitId: string;
  readonly hp: number;
}

/** What a tile event hands back when it finishes. Omitted fields mean "unchanged". */
export interface TileResult {
  /** Party HP after the tile played out. All at 0 ⇒ defeat (PRD §2.5). */
  readonly party?: readonly RunPartyUnit[];
}

/** A frozen snapshot of the run. Mutating it is impossible — ask the controller instead. */
export interface RunState {
  /** Drawn ONCE per run via `core/rng.ts::createSeed()` and never re-drawn (PRD §2.2). */
  readonly seed: number;
  readonly phase: RunPhase;
  /** The tile being walked to, or standing on. */
  readonly tileId: string;
  /** Tiles whose events have RESOLVED, in visit order — 7 per completed run. */
  readonly visited: readonly string[];
  readonly party: readonly RunPartyUnit[];
  /** The forks on offer while `phase === 'branch'`; empty otherwise. */
  readonly branchOptions: readonly string[];
}

/** A decision requested before arrival (prefire). Resolves `null` when there is none (INV-7). */
export type PrefiredAnswer = Promise<AgentDecision | null>;

/**
 * Everything the FSM publishes. The transition half of INV-6 lives in the pair
 * `walk-start` → `walk-complete`: the FSM emits the first and waits for the
 * second to be handed back to it, so nothing advances on a timer.
 */
export type RunEvent =
  | { readonly type: 'run-start'; readonly seed: number }
  | {
      readonly type: 'walk-start';
      readonly tileId: string;
      /** The declared walk budget in ms — reported for the view, never waited on. */
      readonly durationMs: number;
      /** Whether the first decision request went out early for this walk (PRD §2.4). */
      readonly prefired: boolean;
    }
  | { readonly type: 'walk-complete'; readonly tileId: string }
  | {
      readonly type: 'tile-event';
      /** The whole authored tile — the dispatcher decides what its kind means. */
      readonly tile: Tile;
      /** The prefired answer for this tile, or `null` when nothing was prefired. */
      readonly prefired: PrefiredAnswer | null;
    }
  | { readonly type: 'tile-resolved'; readonly tileId: string }
  | {
      readonly type: 'branch-request';
      readonly fromTileId: string;
      readonly options: readonly string[];
    }
  | { readonly type: 'branch-chosen'; readonly fromTileId: string; readonly tileId: string }
  | { readonly type: 'clear'; readonly tileId: string }
  | { readonly type: 'defeat'; readonly tileId: string };

export type RunListener = (event: RunEvent) => void;

/** Drops a listener. Calling it twice is harmless. */
export type Unsubscribe = () => void;

/**
 * The run's only input surface. Every method is synchronous and event-driven:
 * the caller reports what happened (`walkComplete`, `resolveTile`,
 * `chooseBranch`) and the FSM decides what comes next.
 */
export interface RunController {
  getState(): RunState;
  on(listener: RunListener): Unsubscribe;
  /** Begins the run from `idle`. Refused in any other phase. */
  start(): void;
  /** The walk in flight arrived — fires the tile's event. */
  walkComplete(): void;
  /** The current tile's event finished; `result` reports what it changed. */
  resolveTile(result?: TileResult): void;
  /** The single player input point of a run — pick one of `branchOptions`. */
  chooseBranch(tileId: string): void;
  /** Abandons whatever is in flight and returns to a fresh, pre-start run. */
  restart(): void;
}
