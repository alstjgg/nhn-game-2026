// u13 — the map graph (PRD §2.4).
//
// `data/map.json` authors 9 tile entries; a run walks 7 of them, because the one
// branching tile (T2) sends the party down exactly one of two forks that rejoin
// at T5. This module is the read model over that data: it validates the graph
// once, up front, and then answers the questions the FSM asks while walking.
//
// Validation is deliberately strict — a dangling successor or a cycle would show
// up as a hung run rather than a loud failure, so both throw at build time.

import type { GameMap, Tile } from '../data/schema.ts';

/** A validated, acyclic view over the authored map. */
export interface MapGraph {
  readonly startTileId: string;
  /** Every declared tile, in authored order. */
  readonly tiles: readonly Tile[];
  /** @throws Error when `id` names no declared tile — never returns undefined. */
  tile(id: string): Tile;
  /** The declared successors of `id`, in authored order. */
  next(id: string): readonly string[];
  /** A tile that offers a choice — more than one successor (PRD §2.4: only T2). */
  isBranch(id: string): boolean;
  /** A tile the run ends on — no successors (PRD §2.4: only T7). */
  isTerminal(id: string): boolean;
  /** Every start→terminal path, forks in authored order. */
  paths(): string[][];
}

type Mark = 'visiting' | 'done';

/**
 * Builds the read model, rejecting any graph a run could not traverse.
 *
 * @throws Error on a duplicate tile id, an unknown `startTileId`, a dangling
 *   successor, or a cycle.
 */
export function buildMapGraph(map: GameMap): MapGraph {
  const byId = new Map<string, Tile>();
  for (const entry of map.tiles) {
    if (byId.has(entry.id)) {
      throw new Error(`map: duplicate tile id '${entry.id}'`);
    }
    byId.set(entry.id, entry);
  }

  const tile = (id: string): Tile => {
    const found = byId.get(id);
    if (found === undefined) {
      throw new Error(`map: unknown tile id '${id}'`);
    }
    return found;
  };

  if (!byId.has(map.startTileId)) {
    throw new Error(`map: startTileId '${map.startTileId}' names no declared tile`);
  }

  for (const entry of map.tiles) {
    for (const successor of entry.next) {
      if (!byId.has(successor)) {
        throw new Error(`map: tile '${entry.id}' points at undeclared successor '${successor}'`);
      }
    }
  }

  // Depth-first colouring: hitting a tile that is still 'visiting' means the
  // trail closed on itself, and a run that loops never reaches T7.
  const marks = new Map<string, Mark>();
  const detectCycle = (id: string, trail: readonly string[]): void => {
    const mark = marks.get(id);
    if (mark === 'done') return;
    if (mark === 'visiting') {
      throw new Error(`map: cycle at '${[...trail, id].join(' -> ')}' — a run must terminate`);
    }
    marks.set(id, 'visiting');
    const here = [...trail, id];
    for (const successor of tile(id).next) detectCycle(successor, here);
    marks.set(id, 'done');
  };
  for (const entry of map.tiles) detectCycle(entry.id, []);

  const next = (id: string): readonly string[] => [...tile(id).next];

  const paths = (): string[][] => {
    const found: string[][] = [];
    const extend = (id: string, trail: readonly string[]): void => {
      const here = [...trail, id];
      const successors = tile(id).next;
      if (successors.length === 0) {
        found.push(here);
        return;
      }
      for (const successor of successors) extend(successor, here);
    };
    extend(map.startTileId, []);
    return found;
  };

  return Object.freeze({
    startTileId: map.startTileId,
    tiles: Object.freeze([...map.tiles]),
    tile,
    next,
    isBranch: (id: string): boolean => tile(id).next.length > 1,
    isTerminal: (id: string): boolean => tile(id).next.length === 0,
    paths,
  });
}
