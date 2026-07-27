// u13 — run FSM: event-driven transitions, one seed per run, clear/defeat (TDD-Red).
// Covers AC3 (INV-6 transition half: walk-complete event → tile event; zero
// scheduling under src/run/**; no wall-clock dependency in this slice) and
// AC5 (seed drawn once via createSeed(), stored in run state, never re-drawn;
// clear at T7 and defeat at all-HP-0 both terminal; restart = a fresh run).
//
// PRD §2.4: "Tile transitions are event-driven (walk-complete event → event
// fires) — never wall-clock in logic or tests." PRD §2.5: "Defeat (all heroes at
// 0 HP) → defeat screen → 재시작 (fresh run)." INV-6: no game-logic setTimeout;
// Math.random exists in exactly one place — seed creation.
//
// Fake timers appear below as an ASSERTION, not a dependency: advancing a clock
// by an hour must change nothing, which is how "event-driven" is proven.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const seedState = vi.hoisted(() => ({ next: 0 }));
const FIRST_SEED = 0xa11ce;

vi.mock('../../src/core/rng.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/rng.ts')>();
  return { ...actual, createSeed: vi.fn(() => FIRST_SEED + seedState.next++) };
});

import { createSeed } from '../../src/core/rng.ts';
import { createRun } from '../../src/run/fsm.ts';
import {
  MAP,
  ONE_SURVIVOR,
  PARTY,
  PATH_A,
  PATH_B,
  PLAY_WALK_REF,
  TEST_WALK_REF,
  TUNING,
  WIPED,
  recorder,
  traverse,
} from './support.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..'); // demos/darkest-context/
const createSeedMock = vi.mocked(createSeed);

const run = (walkDurationRef = TEST_WALK_REF) =>
  createRun({ map: MAP, tuning: TUNING, party: PARTY, walkDurationRef });

beforeEach(() => {
  seedState.next = 0;
  createSeedMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AC3: event-driven transitions — nothing advances until walk-complete', () => {
  it('starts a walk toward the start tile without firing its event', () => {
    const r = run();
    const rec = recorder(r);
    r.start();
    expect(r.getState().phase).toBe('walking');
    expect(r.getState().tileId).toBe('t1');
    expect(rec.types()).toEqual(['run-start', 'walk-start']);
  });

  it('fires no tile event no matter how much clock time passes', () => {
    vi.useFakeTimers();
    const r = run();
    const rec = recorder(r);
    r.start();
    vi.advanceTimersByTime(3_600_000);
    expect(rec.ofType('tile-event')).toEqual([]);
    expect(r.getState().phase).toBe('walking');
  });

  it('fires exactly the arrived tile event when walk-complete is emitted', () => {
    const r = run();
    const rec = recorder(r);
    r.start();
    r.walkComplete();
    expect(r.getState().phase).toBe('tile');
    expect(rec.ofType('tile-event').map((e) => e.tile.id)).toEqual(['t1']);
    expect(rec.ofType('tile-event')[0].tile.kind).toBe('combat');
  });

  it('reports the tunable walk duration but never waits on it (4s ref advances on the event alone)', () => {
    vi.useFakeTimers();
    const r = run(PLAY_WALK_REF);
    const rec = recorder(r);
    r.start();
    expect(rec.ofType('walk-start')[0].durationMs).toBe(4000);
    vi.advanceTimersByTime(10_000);
    expect(rec.ofType('tile-event')).toEqual([]);
    r.walkComplete();
    expect(rec.ofType('tile-event').map((e) => e.tile.id)).toEqual(['t1']);
  });

  it('walks at duration 0 under the gate ref, and still needs the event', () => {
    const r = run();
    const rec = recorder(r);
    r.start();
    expect(rec.ofType('walk-start')[0].durationMs).toBe(0);
    expect(rec.ofType('tile-event')).toEqual([]);
    r.walkComplete();
    expect(r.getState().phase).toBe('tile');
  });

  it('refuses a walk-complete that no walk is waiting on', () => {
    const r = run();
    expect(() => r.walkComplete()).toThrow(/phase|walk/i);
    r.start();
    r.walkComplete();
    expect(() => r.walkComplete()).toThrow(/phase|walk/i);
  });

  it('refuses a tile resolution while the party is still walking', () => {
    const r = run();
    r.start();
    expect(() => r.resolveTile()).toThrow(/phase|tile/i);
  });

  it('emits the full ordered trace of a run — one cycle per tile, one branch', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3a' });
    const cycle = ['walk-start', 'walk-complete', 'tile-event', 'tile-resolved'];
    expect(rec.types()).toEqual([
      'run-start',
      ...cycle, // t1
      ...cycle, // t2
      'branch-request',
      'branch-chosen',
      ...cycle, // t3a
      ...cycle, // t4a
      ...cycle, // t5
      ...cycle, // t6
      ...cycle, // t7
      'clear',
    ]);
  });

  it('event-driven dispatch hands the whole authored tile to the listener', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3a' });
    const dispatched = rec.ofType('tile-event').map((e) => e.tile);
    expect(dispatched.map((t) => t.kind)).toEqual([
      'combat',
      'training',
      'puzzle',
      'training',
      'combat',
      'rest',
      'combat_final',
    ]);
    expect(dispatched[0].rosterId).toBe('roster_t1');
    expect(dispatched[2].agendaId).toBe('riddle_golem');
  });

  it('event-driven dispatch on the other fork carries the 선택이벤트 agenda', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3b' });
    const dispatched = rec.ofType('tile-event').map((e) => e.tile);
    expect(dispatched.map((t) => t.kind)).toEqual([
      'combat',
      'training',
      'choice',
      'rest',
      'combat',
      'rest',
      'combat_final',
    ]);
    expect(dispatched[2].agendaId).toBe('fallen_merchant');
  });

  it('unsubscribing stops delivery without stopping the run', () => {
    const r = run();
    const seen: string[] = [];
    const off = r.on((e) => seen.push(e.type));
    r.start();
    off();
    r.walkComplete();
    expect(seen).toEqual(['run-start', 'walk-start']);
    expect(r.getState().phase).toBe('tile');
  });
});

// ── INV-6 grep half ─────────────────────────────────────────────────────────
// Inlined walker on purpose: this guard must not share a helper file whose edit
// would disarm it together with the tests/core no-math-random guard.
const stripComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const walk = (dir: string): string[] => {
  let out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(e.name)) out.push(full);
  }
  return out;
};

const rel = (file: string): string => relative(root, file).split('\\').join('/');
const body = (file: string): string => stripComments(readFileSync(file, 'utf8'));

const SCHEDULERS = /\b(setTimeout|setInterval|setImmediate|requestAnimationFrame|requestIdleCallback)\b/;
const CLOCKS = /\b(Date\s*\.\s*now|performance\s*\.\s*now|new\s+Date)\b/;

const runSrcFiles = walk(join(root, 'src/run'));
// Every run spec except this one: the patterns above are spelled out here, so
// scanning this file would make the guard hit itself.
const runTestFiles = walk(join(root, 'tests/run')).filter((f) => !f.endsWith('fsm.test.ts'));

describe('AC3: no-setTimeout guard — src/run/** schedules nothing', () => {
  it('found run sources to scan (the guard is not vacuously green)', () => {
    expect(runSrcFiles.map(rel), 'no source files under src/run/').not.toEqual([]);
  });

  it('schedules no timer anywhere in the run slice', () => {
    const offenders = runSrcFiles.filter((f) => SCHEDULERS.test(body(f))).map(rel);
    expect(offenders, `scheduling in: ${offenders.join(', ')}`).toEqual([]);
  });

  it('reads no wall clock anywhere in the run slice', () => {
    const offenders = runSrcFiles.filter((f) => CLOCKS.test(body(f))).map(rel);
    expect(offenders, `clock reads in: ${offenders.join(', ')}`).toEqual([]);
  });

  it('draws no entropy of its own — no Math.random under src/run/**', () => {
    const offenders = runSrcFiles.filter((f) => /Math\s*\.\s*random/.test(body(f))).map(rel);
    expect(offenders, `Math.random in: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('AC3: no-setTimeout guard — the run test slice has no wall-clock dependency', () => {
  it('found run specs to scan (the guard is not vacuously green)', () => {
    expect(runTestFiles.map(rel), 'no other spec files under tests/run/').not.toEqual([]);
  });

  it('no run spec schedules a timer', () => {
    const offenders = runTestFiles.filter((f) => SCHEDULERS.test(body(f))).map(rel);
    expect(offenders, `scheduling in: ${offenders.join(', ')}`).toEqual([]);
  });

  it('no run spec reads a wall clock', () => {
    const offenders = runTestFiles.filter((f) => CLOCKS.test(body(f))).map(rel);
    expect(offenders, `clock reads in: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('AC5: the run seed is drawn once at run start and stored in run state', () => {
  it('draws exactly one seed when the run is created', () => {
    const r = run();
    expect(createSeedMock).toHaveBeenCalledTimes(1);
    expect(r.getState().seed).toBe(FIRST_SEED);
  });

  it('stores a uint32 integer seed', () => {
    const seed = run().getState().seed;
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(0x100000000);
  });

  it('never re-draws the seed across a full traversal', () => {
    const r = run();
    const before = r.getState().seed;
    traverse(r, { branchTo: 't3a' });
    expect(createSeedMock).toHaveBeenCalledTimes(1);
    expect(r.getState().seed).toBe(before);
  });

  it('start() does not draw a second seed', () => {
    const r = run();
    r.start();
    expect(createSeedMock).toHaveBeenCalledTimes(1);
  });

  it('replays a recorded seed without drawing one', () => {
    const r = createRun({
      map: MAP,
      tuning: TUNING,
      party: PARTY,
      walkDurationRef: TEST_WALK_REF,
      seed: 0xc0ffee,
    });
    expect(createSeedMock).not.toHaveBeenCalled();
    expect(r.getState().seed).toBe(0xc0ffee);
    traverse(r, { branchTo: 't3b' });
    expect(r.getState().seed).toBe(0xc0ffee);
    expect(createSeedMock).not.toHaveBeenCalled();
  });

  it('publishes the seed on the run-start event', () => {
    const r = run();
    const rec = recorder(r);
    r.start();
    expect(rec.ofType('run-start')[0].seed).toBe(r.getState().seed);
  });

  it('seed source: the FSM imports createSeed from src/core/rng.ts', () => {
    const importers = runSrcFiles.filter((f) => /createSeed/.test(body(f)));
    expect(importers.map(rel), 'no file under src/run/ mentions createSeed').not.toEqual([]);
    for (const f of importers) {
      expect(body(f), `${rel(f)} must import createSeed from core/rng`).toMatch(
        /from\s+['"][^'"]*core\/rng(\.ts)?['"]/,
      );
    }
  });

  it('exposes a frozen state snapshot — callers cannot rewrite the seed', () => {
    const r = run();
    const state = r.getState();
    expect(Object.isFrozen(state)).toBe(true);
  });
});

describe('AC5: terminal state — clear is reached at T7 and stops the run', () => {
  it('reaches clear only after T7 resolves', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3a' });
    expect(r.getState().phase).toBe('clear');
    expect(rec.ofType('clear').map((e) => e.tileId)).toEqual(['t7']);
    expect(r.getState().visited).toHaveLength(7);
  });

  it('reports no clear before T7', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3b', stopAtTile: 't7' });
    expect(rec.ofType('clear')).toEqual([]);
    expect(r.getState().phase).toBe('tile');
  });

  it('is terminal: every further input is refused', () => {
    const r = run();
    traverse(r, { branchTo: 't3a' });
    expect(() => r.walkComplete()).toThrow(/phase|clear/i);
    expect(() => r.resolveTile()).toThrow(/phase|clear/i);
    expect(() => r.chooseBranch('t3b')).toThrow(/phase|clear/i);
    expect(() => r.start()).toThrow(/phase|clear|restart/i);
    expect(r.getState().phase).toBe('clear');
  });
});

describe('AC5: terminal state — defeat when all heroes reach 0 HP', () => {
  it('ends the run where the party fell', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3a', resultFor: (id) => (id === 't1' ? { party: WIPED } : undefined) });
    expect(r.getState().phase).toBe('defeat');
    expect(rec.ofType('defeat').map((e) => e.tileId)).toEqual(['t1']);
    expect(rec.ofType('clear')).toEqual([]);
    expect(r.getState().visited).toEqual(['t1']);
  });

  it('stores the reported party HP in run state', () => {
    const r = run();
    traverse(r, { branchTo: 't3a', resultFor: (id) => (id === 't1' ? { party: WIPED } : undefined) });
    expect(r.getState().party.every((u) => u.hp === 0)).toBe(true);
  });

  it('a single survivor is not defeat — the run walks on', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, {
      branchTo: 't3a',
      resultFor: (id) => (id === 't1' ? { party: ONE_SURVIVOR } : undefined),
    });
    expect(rec.ofType('defeat')).toEqual([]);
    expect(r.getState().phase).toBe('clear');
    expect(r.getState().visited).toEqual([...PATH_A]);
  });

  it('a wipe on the final tile is defeat, not clear', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3b', resultFor: (id) => (id === 't7' ? { party: WIPED } : undefined) });
    expect(r.getState().phase).toBe('defeat');
    expect(rec.ofType('clear')).toEqual([]);
    expect(rec.ofType('defeat').map((e) => e.tileId)).toEqual(['t7']);
  });

  it('is terminal: every further input is refused', () => {
    const r = run();
    traverse(r, { branchTo: 't3a', resultFor: (id) => (id === 't1' ? { party: WIPED } : undefined) });
    expect(() => r.walkComplete()).toThrow(/phase|defeat/i);
    expect(() => r.resolveTile()).toThrow(/phase|defeat/i);
    expect(r.getState().phase).toBe('defeat');
  });
});

describe('AC5: restart produces a fresh run', () => {
  it('draws exactly one new seed', () => {
    const r = run();
    traverse(r, { branchTo: 't3a' });
    const cleared = r.getState().seed;
    r.restart();
    expect(createSeedMock).toHaveBeenCalledTimes(2);
    expect(r.getState().seed).not.toBe(cleared);
  });

  it('resets phase, tile and visited to a pre-start run', () => {
    const r = run();
    traverse(r, { branchTo: 't3a' });
    r.restart();
    const state = r.getState();
    expect(state.phase).toBe('idle');
    expect(state.tileId).toBe(MAP.startTileId);
    expect(state.visited).toEqual([]);
    expect(state.branchOptions).toEqual([]);
  });

  it('restores the party to its starting HP after a defeat', () => {
    const r = run();
    traverse(r, { branchTo: 't3a', resultFor: (id) => (id === 't1' ? { party: WIPED } : undefined) });
    r.restart();
    expect(r.getState().party).toEqual([...PARTY]);
  });

  it('is playable again — and may take the other fork', () => {
    const r = run();
    traverse(r, { branchTo: 't3a' });
    r.restart();
    traverse(r, { branchTo: 't3b' });
    expect(r.getState().phase).toBe('clear');
    expect(r.getState().visited).toEqual([...PATH_B]);
  });

  // Also pins what `visited` means: a tile joins it when its event RESOLVES, so
  // t5 — dispatched but still in play — is not in the list yet.
  it('restart mid-run abandons the run in flight', () => {
    const r = run();
    traverse(r, { branchTo: 't3a', stopAtTile: 't5' });
    expect(r.getState().visited).toEqual(['t1', 't2', 't3a', 't4a']);
    r.restart();
    expect(r.getState().visited).toEqual([]);
    expect(r.getState().phase).toBe('idle');
  });

  it('keeps listeners subscribed across the restart', () => {
    const r = run();
    const rec = recorder(r);
    traverse(r, { branchTo: 't3a' });
    rec.clear();
    r.restart();
    r.start();
    expect(rec.types()).toEqual(['run-start', 'walk-start']);
    expect(rec.ofType('run-start')[0].seed).toBe(r.getState().seed);
  });
});
