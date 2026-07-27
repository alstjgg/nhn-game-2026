// u13 — prefire hook: the walk doubles as latency cover (TDD-Red). Covers AC4.
//
// PRD §2.4: "In live mode the walk doubles as latency cover: the engine may
// prefire the first combat request on walk start." The hook is only worth having
// if a prefire that is no longer wanted costs nothing — so the load-bearing case
// here is the superseded one: its answer is dropped, silently (INV-7), without
// a second adapter call and without touching what actually executes.
//
// Nothing waits: every adapter answer is settled by hand (support.gatedAdapter),
// which is also why this slice needs no clock at all (INV-6).
import { describe, expect, it } from 'vitest';
import { createPrefireSlot } from '../../src/run/prefire.ts';
import { createRun } from '../../src/run/fsm.ts';
import type { Tile } from '../../src/data/schema.ts';
import {
  MAP,
  PARTY,
  TEST_WALK_REF,
  TUNING,
  decideRequest,
  decision,
  gatedAdapter,
  recorder,
  traverse,
} from './support.ts';

const tileOf = (id: string): Tile => {
  const t = MAP.tiles.find((x) => x.id === id);
  if (t === undefined) throw new Error(`no tile ${id} in map.json`);
  return t;
};

const T1 = tileOf('t1');
const T5 = tileOf('t5');

const EARLY = decision('먼저 친다.');
const LATE = decision('낡은 판단.');
const FRESH = decision('새 판단.');

describe('AC4: the prefire slot issues the first decision request early', () => {
  it('calls the adapter once, with the request built for that tile', () => {
    const adapter = gatedAdapter();
    const built: string[] = [];
    const slot = createPrefireSlot({
      adapter,
      buildRequest: (tile) => {
        built.push(tile.id);
        return decideRequest();
      },
    });
    slot.issue(T1);
    expect(built).toEqual(['t1']);
    expect(adapter.requests).toHaveLength(1);
    expect(slot.pendingTileId).toBe('t1');
    expect(slot.stats.issued).toBe(1);
  });

  it('declines the tile when buildRequest returns null — no adapter call at all', () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => null });
    slot.issue(T1);
    expect(adapter.requests).toEqual([]);
    expect(slot.pendingTileId).toBeNull();
    expect(slot.stats.issued).toBe(0);
  });

  it('is idempotent per tile — re-issuing reuses the in-flight call', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    slot.issue(T1);
    expect(adapter.requests).toHaveLength(1);
    adapter.gate(0).resolve(EARLY);
    await expect(slot.claim('t1')).resolves.toEqual(EARLY);
  });

  it('hands the prefired answer to the tile that claims it — no second adapter call', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    adapter.gate(0).resolve(EARLY);
    await expect(slot.claim('t1')).resolves.toEqual(EARLY);
    expect(adapter.requests).toHaveLength(1);
    expect(slot.stats.claimed).toBe(1);
  });

  it('claims an answer that settles only after the claim (arrival beat the proxy)', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    const claimed = slot.claim('t1');
    adapter.gate(0).resolve(EARLY);
    await expect(claimed).resolves.toEqual(EARLY);
  });

  it('returns null when nothing was prefired', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    await expect(slot.claim('t1')).resolves.toBeNull();
    expect(adapter.requests).toEqual([]);
  });

  it('degrades silently when the adapter answers null', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    adapter.gate(0).resolve(null);
    await expect(slot.claim('t1')).resolves.toBeNull();
  });

  it('degrades silently when the adapter rejects — the claim never throws (INV-7)', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    adapter.gate(0).reject(new Error('proxy died mid-walk'));
    await expect(slot.claim('t1')).resolves.toBeNull();
  });
});

describe('AC4: a prefired-then-superseded response is discarded', () => {
  it('returns null to the tile that was prefired for, once another tile takes the slot', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    slot.issue(T5);
    await expect(slot.claim('t1')).resolves.toBeNull();
    expect(slot.stats.discarded).toBe(1);
    adapter.gate(1).resolve(FRESH);
    await expect(slot.claim('t5')).resolves.toEqual(FRESH);
  });

  it('drops a discarded answer even when it settles afterwards', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    slot.discard();
    adapter.gate(0).resolve(LATE);
    await expect(slot.claim('t1')).resolves.toBeNull();
    expect(slot.pendingTileId).toBeNull();
    expect(slot.stats.discarded).toBe(1);
    expect(slot.stats.claimed).toBe(0);
  });

  it('swallows a rejection that lands after the discard (no unhandled rejection)', async () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    slot.discard();
    adapter.gate(0).reject(new Error('proxy died after the branch'));
    await expect(slot.claim('t1')).resolves.toBeNull();
  });

  it('discarding twice is harmless', () => {
    const adapter = gatedAdapter();
    const slot = createPrefireSlot({ adapter, buildRequest: () => decideRequest() });
    slot.issue(T1);
    slot.discard();
    expect(() => slot.discard()).not.toThrow();
    expect(slot.stats.discarded).toBe(1);
  });
});

describe('AC4: the FSM prefires on walk start toward a combat tile', () => {
  const wired = () => {
    const adapter = gatedAdapter();
    const issuedFor: string[] = [];
    const slot = createPrefireSlot({
      adapter,
      buildRequest: (tile) => {
        issuedFor.push(tile.id);
        return decideRequest();
      },
    });
    const run = createRun({
      map: MAP,
      tuning: TUNING,
      party: PARTY,
      walkDurationRef: TEST_WALK_REF,
      prefire: slot,
    });
    return { adapter, issuedFor, slot, run, rec: recorder(run) };
  };

  it('issues the request when the walk toward T1 starts, before arrival', () => {
    const { adapter, issuedFor, run, rec } = wired();
    run.start();
    expect(issuedFor).toEqual(['t1']);
    expect(adapter.requests).toHaveLength(1);
    expect(rec.ofType('tile-event')).toEqual([]);
    expect(rec.ofType('walk-start')[0].prefired).toBe(true);
  });

  it('prefires only the combat tiles of a run — T1, T5 and the final T7', () => {
    const { issuedFor, run } = wired();
    traverse(run, { branchTo: 't3a' });
    expect(issuedFor).toEqual(['t1', 't5', 't7']);
  });

  it('never prefires a 훈련장 · 퍼즐 · 휴식 walk', () => {
    const { run, rec } = wired();
    traverse(run, { branchTo: 't3b' });
    const byTile = Object.fromEntries(rec.ofType('walk-start').map((e) => [e.tileId, e.prefired]));
    expect(byTile).toEqual({
      t1: true,
      t2: false,
      t3b: false,
      t4b: false,
      t5: true,
      t6: false,
      t7: true,
    });
  });

  it('hands the prefired answer to the combat tile event', async () => {
    const { adapter, run, rec } = wired();
    run.start();
    adapter.gate(0).resolve(EARLY);
    run.walkComplete();
    const event = rec.ofType('tile-event')[0];
    expect(event.tile.id).toBe('t1');
    await expect(event.prefired).resolves.toEqual(EARLY);
  });

  it('hands null to a tile event that was never prefired', () => {
    const { run, rec } = wired();
    traverse(run, { branchTo: 't3a', stopAtTile: 't2' });
    const event = rec.ofType('tile-event').at(-1);
    expect(event?.tile.id).toBe('t2');
    expect(event?.prefired).toBeNull();
  });

  it('runs without a prefire slot at all — no prefire, no adapter, no change in traversal', () => {
    const run = createRun({ map: MAP, tuning: TUNING, party: PARTY, walkDurationRef: TEST_WALK_REF });
    const rec = recorder(run);
    traverse(run, { branchTo: 't3a' });
    expect(rec.ofType('walk-start').every((e) => e.prefired === false)).toBe(true);
    expect(rec.ofType('tile-event').every((e) => e.prefired === null)).toBe(true);
    expect(run.getState().phase).toBe('clear');
  });

  it('a prefire superseded by 재시작 is discarded — the fresh run uses its own answer', async () => {
    const { adapter, run, rec } = wired();
    run.start();
    expect(adapter.requests).toHaveLength(1);
    run.restart();
    run.start();
    expect(adapter.requests).toHaveLength(2);
    adapter.gate(1).resolve(FRESH);
    adapter.gate(0).resolve(LATE); // the abandoned run answers late
    run.walkComplete();
    const event = rec.ofType('tile-event').at(-1);
    expect(event?.tile.id).toBe('t1');
    await expect(event?.prefired).resolves.toEqual(FRESH);
  });

  it('a superseded prefire changes nothing downstream — no extra call, run still clears', async () => {
    const { adapter, issuedFor, run } = wired();
    run.start();
    run.restart();
    adapter.gate(0).resolve(LATE);
    traverse(run, { branchTo: 't3b' });
    expect(issuedFor).toEqual(['t1', 't1', 't5', 't7']);
    expect(adapter.requests).toHaveLength(4);
    expect(run.getState().phase).toBe('clear');
    expect(run.getState().visited).toHaveLength(7);
  });
});
