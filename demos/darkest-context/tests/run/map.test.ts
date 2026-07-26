// u13 — the map graph: 9 authored entries, 1 branch, 7 tiles per run (TDD-Red).
// Covers AC2 (both forks traverse exactly 7 tiles and rejoin; the branch is the
// ONLY player input point in traversal) and feeds AC1 (the tests/run/ slice gate).
//
// PRD §2.4: "T1 전투 → T2 훈련장 → branch → path A: T3a 퍼즐 → T4a 훈련장 /
// path B: T3b 선택이벤트 → T4b 휴식 → rejoin → T5 전투 → T6 휴식 → T7 최종 전투"
// and "Player input only at the branch card pair."
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { buildMapGraph } from '../../src/run/map.ts';
import { createRun } from '../../src/run/fsm.ts';
import type { GameMap, Tile } from '../../src/data/schema.ts';
import { MAP, PARTY, PATH_A, PATH_B, TEST_WALK_REF, TUNING, recorder, traverse } from './support.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..'); // demos/darkest-context/

const run = () => createRun({ map: MAP, tuning: TUNING, party: PARTY, walkDurationRef: TEST_WALK_REF });

const graph = () => buildMapGraph(MAP);

const tile = (id: string, kind: Tile['kind'], next: string[]): Tile => ({
  id,
  kind,
  next,
  walkDurationRef: 'walk.durationMs',
});

describe('AC2: data/map.json authors 9 tile entries with exactly one branch', () => {
  it('declares exactly 9 tile entries', () => {
    const raw = JSON.parse(readFileSync(join(root, 'data/map.json'), 'utf8')) as GameMap;
    expect(raw.tiles).toHaveLength(9);
    expect(MAP.tiles).toHaveLength(9);
  });

  it('starts the run at t1', () => {
    expect(MAP.startTileId).toBe('t1');
    expect(graph().startTileId).toBe('t1');
  });

  it('authors the PRD §2.4 tile kinds', () => {
    const kinds = Object.fromEntries(MAP.tiles.map((t) => [t.id, t.kind]));
    expect(kinds).toEqual({
      t1: 'combat',
      t2: 'training',
      t3a: 'puzzle',
      t3b: 'choice',
      t4a: 'training',
      t4b: 'rest',
      t5: 'combat',
      t6: 'rest',
      t7: 'combat_final',
    });
  });

  it('has exactly one branching tile — t2, offering both forks', () => {
    const g = graph();
    const branches = MAP.tiles.filter((t) => g.isBranch(t.id)).map((t) => t.id);
    expect(branches).toEqual(['t2']);
    expect(g.next('t2')).toEqual(['t3a', 't3b']);
  });

  it('has exactly one terminal tile — t7, the final combat', () => {
    const g = graph();
    const terminals = MAP.tiles.filter((t) => g.isTerminal(t.id)).map((t) => t.id);
    expect(terminals).toEqual(['t7']);
    expect(g.tile('t7').kind).toBe('combat_final');
  });

  it('resolves every declared successor id to a declared tile', () => {
    const ids = new Set(MAP.tiles.map((t) => t.id));
    const dangling = MAP.tiles.flatMap((t) => t.next.filter((n) => !ids.has(n)));
    expect(dangling).toEqual([]);
  });

  it('reaches all 9 declared tiles from the start (no orphan entries)', () => {
    const g = graph();
    const seen = new Set<string>();
    const stack = [g.startTileId];
    while (stack.length > 0) {
      const id = stack.pop() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...g.next(id));
    }
    expect([...seen].sort()).toEqual(MAP.tiles.map((t) => t.id).sort());
  });
});

describe('AC2: buildMapGraph rejects a graph it cannot traverse', () => {
  it('throws when startTileId names no declared tile', () => {
    expect(() => buildMapGraph({ startTileId: 'nowhere', tiles: [tile('t1', 'combat', [])] })).toThrow(
      /nowhere/,
    );
  });

  it('throws on a dangling successor id', () => {
    expect(() =>
      buildMapGraph({ startTileId: 't1', tiles: [tile('t1', 'combat', ['ghost'])] }),
    ).toThrow(/ghost/);
  });

  it('throws on a duplicate tile id', () => {
    expect(() =>
      buildMapGraph({
        startTileId: 't1',
        tiles: [tile('t1', 'combat', ['t2']), tile('t2', 'rest', []), tile('t2', 'rest', [])],
      }),
    ).toThrow(/t2/);
  });

  it('throws on a cycle — a run must terminate', () => {
    expect(() =>
      buildMapGraph({
        startTileId: 't1',
        tiles: [tile('t1', 'combat', ['t2']), tile('t2', 'rest', ['t1'])],
      }),
    ).toThrow(/cycle|cyclic/i);
  });

  it('tile() throws on an unknown id rather than returning undefined', () => {
    expect(() => graph().tile('t99')).toThrow(/t99/);
  });
});

describe('AC2: both forks traverse exactly 7 of the 9 tiles and rejoin', () => {
  it('enumerates exactly two start→terminal paths', () => {
    expect(graph().paths()).toHaveLength(2);
  });

  it('path A is T1→T2→T3a→T4a→T5→T6→T7 — 7 tiles', () => {
    const [a] = graph().paths();
    expect(a).toEqual([...PATH_A]);
    expect(a).toHaveLength(7);
  });

  it('path B is T1→T2→T3b→T4b→T5→T6→T7 — 7 tiles', () => {
    const [, b] = graph().paths();
    expect(b).toEqual([...PATH_B]);
    expect(b).toHaveLength(7);
  });

  it('each fork skips exactly the two tiles of the other fork', () => {
    const [a, b] = graph().paths();
    expect([...a].filter((id) => !b.includes(id))).toEqual(['t3a', 't4a']);
    expect([...b].filter((id) => !a.includes(id))).toEqual(['t3b', 't4b']);
  });

  it('rejoins at t5 and shares the T5→T7 tail', () => {
    const [a, b] = graph().paths();
    expect(a.slice(4)).toEqual(['t5', 't6', 't7']);
    expect(b.slice(4)).toEqual(['t5', 't6', 't7']);
    expect(graph().next('t4a')).toEqual(['t5']);
    expect(graph().next('t4b')).toEqual(['t5']);
  });
});

describe('AC2: the FSM walks the graph — the same 7 tiles, in order', () => {
  it('taking t3a visits path A exactly', () => {
    const r = run();
    traverse(r, { branchTo: 't3a' });
    expect(r.getState().visited).toEqual([...PATH_A]);
  });

  it('taking t3b visits path B exactly', () => {
    const r = run();
    traverse(r, { branchTo: 't3b' });
    expect(r.getState().visited).toEqual([...PATH_B]);
  });

  it('fires exactly one tile event per visited tile — 7 per run, none repeated', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3b' });
    const fired = rec.ofType('tile-event').map((e) => e.tile.id);
    expect(fired).toEqual([...PATH_B]);
    expect(new Set(fired).size).toBe(7);
  });

  it('never visits the fork it did not take', () => {
    const r = run();
    traverse(r, { branchTo: 't3a' });
    expect(r.getState().visited).not.toContain('t3b');
    expect(r.getState().visited).not.toContain('t4b');
  });

  it('walks once per tile — 7 walk-starts, 7 walk-completes', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3a' });
    expect(rec.ofType('walk-start').map((e) => e.tileId)).toEqual([...PATH_A]);
    expect(rec.ofType('walk-complete').map((e) => e.tileId)).toEqual([...PATH_A]);
  });
});

describe('AC2: the branch is the only player input point in traversal', () => {
  it('requests a player choice exactly once per run', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3a' });
    const requests = rec.ofType('branch-request');
    expect(requests).toHaveLength(1);
    expect(requests[0].fromTileId).toBe('t2');
  });

  it('offers both forks in declared order', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3b' });
    expect(rec.ofType('branch-request')[0].options).toEqual(['t3a', 't3b']);
  });

  it('enters the branch phase only after T2 resolves — every other tile auto-advances', () => {
    const r = run();
    const branchPhases: string[] = [];
    r.start();
    for (let step = 0; step < 100; step++) {
      const state = r.getState();
      if (state.phase === 'walking') r.walkComplete();
      else if (state.phase === 'tile') r.resolveTile();
      else if (state.phase === 'branch') {
        branchPhases.push(state.tileId);
        r.chooseBranch('t3a');
      } else break;
    }
    expect(branchPhases).toEqual(['t2']);
  });

  it('rejects a fork that is not on offer', () => {
    const r = run();
    traverse(r, { branchTo: 't3a', stopAtTile: 't2' });
    r.resolveTile();
    expect(r.getState().phase).toBe('branch');
    expect(() => r.chooseBranch('t5')).toThrow(/t5/);
    expect(r.getState().phase).toBe('branch');
  });

  it('rejects a branch choice made outside the branch phase', () => {
    const r = run();
    r.start();
    expect(r.getState().phase).toBe('walking');
    expect(() => r.chooseBranch('t3a')).toThrow(/phase|branch/i);
  });

  it('leaves the branch phase only through chooseBranch — walk-complete is refused there', () => {
    const r = run();
    traverse(r, { branchTo: 't3a', stopAtTile: 't2' });
    r.resolveTile();
    expect(() => r.walkComplete()).toThrow(/phase|walk/i);
    expect(r.getState().phase).toBe('branch');
  });
});
