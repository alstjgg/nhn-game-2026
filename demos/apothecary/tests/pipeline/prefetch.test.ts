// u5 TDD-Red — prefetch orchestrator (N+1) + injected clock.
// Covers AC1 (concurrent start / independent tracks), AC2 (injected clock, 25s boundary,
// source-scan guards), AC3 (deadline fallback + late-arrival race), AC4 (silent degradation),
// AC5 (cancellation), plus ManualClock unit contracts (C2-C5) and an unhandled-rejection watchdog.
//
// NOTE (TDD Red): src/pipeline/clock.ts and src/pipeline/prefetch.ts do not exist yet.
// This file is expected to fail to resolve its imports until IMPLEMENT lands them.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { createManualClock, createRealClock } from '../../src/pipeline/clock.ts';
import type { ManualClock } from '../../src/pipeline/clock.ts';
import { DEADLINE_MS, isPortraitSheet, startPrefetch } from '../../src/pipeline/prefetch.ts';
import type { PrefetchHandle, PrefetchState } from '../../src/pipeline/prefetch.ts';
import { AIUnavailableError } from '../../src/ai/adapter.ts';
import type { AIAdapter } from '../../src/ai/adapter.ts';
import type {
  DialogueBeat,
  DialogueRequest,
  PortraitRequest,
  PortraitSheet,
} from '../../src/ai/contract.ts';

// ---------------------------------------------------------------------------
// inline fixtures (file_globs allow exactly one test file — no fixture module)
// ---------------------------------------------------------------------------

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Drains the microtask queue (state transitions settle inside promise handlers). */
function flush(): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, 0));
}

function validBeat(npcLine = '어깨가 무겁습니다'): DialogueBeat {
  return {
    npcLine,
    choices: [
      { label: '조심스레 묻는다', verb: 'indirect', patienceCost: 1 },
      { label: '바로 캐묻는다', verb: 'direct', patienceCost: 2 },
      { label: '손끝을 살핀다', verb: 'observe', patienceCost: 1, clueReveals: ['c1'] },
    ],
  };
}

function validSheet(b64 = 'iVBORw0KGgoAAAANS'): PortraitSheet {
  return { b64, prompt: 'weary merchant, 4x2 expression sheet' };
}

function makeRequest(): { dialogue: DialogueRequest; portrait: PortraitRequest } {
  return {
    dialogue: {
      customer: {
        personaTraits: ['지친 눈', '급한 말투'],
        problem: '잠이 오지 않는다',
        hiddenCause: '빚 독촉',
      },
      patienceTier: 1,
      history: [],
      availableClues: [{ id: 'c1', text: '손끝이 떨린다' }],
    },
    portrait: { traits: ['지친 눈', '급한 말투'] },
  };
}

interface ControlledAdapter {
  adapter: AIAdapter;
  calls: { dialogue: number; portrait: number };
  seen: { dialogue: DialogueRequest[]; portrait: PortraitRequest[] };
  d: Deferred<DialogueBeat>;
  p: Deferred<PortraitSheet>;
}

/** Live adapter whose two tracks are resolved/rejected by hand. */
function makeControlledAdapter(): ControlledAdapter {
  const calls = { dialogue: 0, portrait: 0 };
  const seen = { dialogue: [] as DialogueRequest[], portrait: [] as PortraitRequest[] };
  const d = deferred<DialogueBeat>();
  const p = deferred<PortraitSheet>();
  const adapter: AIAdapter = {
    mode: 'live',
    dialogue(req) {
      calls.dialogue++;
      seen.dialogue.push(req);
      return d.promise;
    },
    portrait(req) {
      calls.portrait++;
      seen.portrait.push(req);
      return p.promise;
    },
  };
  return { adapter, calls, seen, d, p };
}

interface StubAdapter {
  adapter: AIAdapter;
  calls: { dialogue: number; portrait: number };
  beat: DialogueBeat;
  sheet: PortraitSheet;
}

/** Bundled fallback pack: always resolves immediately with the same object refs. */
function makeStubAdapter(beat = validBeat('가만히 기다립니다'), sheet = validSheet('c3R1Yg==')): StubAdapter {
  const calls = { dialogue: 0, portrait: 0 };
  const adapter: AIAdapter = {
    mode: 'stub',
    dialogue() {
      calls.dialogue++;
      return Promise.resolve(beat);
    },
    portrait() {
      calls.portrait++;
      return Promise.resolve(sheet);
    },
  };
  return { adapter, calls, beat, sheet };
}

/** Live adapter that resolves with arbitrary (possibly schema-invalid) payloads. */
function makeResolvingAdapter(beat: unknown, sheet: unknown): AIAdapter {
  return {
    mode: 'live',
    dialogue() {
      return Promise.resolve(beat as DialogueBeat);
    },
    portrait() {
      return Promise.resolve(sheet as PortraitSheet);
    },
  };
}

function makeRejectingAdapter(message: string): AIAdapter {
  return {
    mode: 'live',
    dialogue() {
      return Promise.reject(new AIUnavailableError(message));
    },
    portrait() {
      return Promise.reject(new AIUnavailableError(message));
    },
  };
}

/** Adapter that throws synchronously instead of returning a rejected promise. */
function makeThrowingAdapter(message: string): AIAdapter {
  return {
    mode: 'live',
    dialogue(): Promise<DialogueBeat> {
      throw new AIUnavailableError(message);
    },
    portrait(): Promise<PortraitSheet> {
      throw new AIUnavailableError(message);
    },
  };
}

/** Fallback pack that is itself broken (A4 / AC4-e). */
function makeFailingFallback(message = 'FALLBACK-PACK-MISSING-9137'): AIAdapter {
  return {
    mode: 'stub',
    dialogue() {
      return Promise.reject(new Error(message));
    },
    portrait() {
      return Promise.reject(new Error(message));
    },
  };
}

function watch(handle: PrefetchHandle): { seen: PrefetchState[]; off: () => void } {
  const seen: PrefetchState[] = [];
  const off = handle.subscribe((s) => {
    seen.push(s);
  });
  return { seen, off };
}

/** Every key name reachable in a snapshot (AC4-d structural check). */
function allKeys(v: unknown, out: string[] = []): string[] {
  if (typeof v !== 'object' || v === null) return out;
  for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
    out.push(k);
    allKeys(child, out);
  }
  return out;
}

// ---------------------------------------------------------------------------
// AC1 — concurrent start, independent tracks
// ---------------------------------------------------------------------------

describe('AC1 — startPrefetch starts both tracks at once and exposes them independently', () => {
  it('AC1-a — calls adapter.dialogue and adapter.portrait exactly once BEFORE returning', () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const request = makeRequest();

    const handle = startPrefetch({ adapter: live.adapter, fallbackAdapter: fallback.adapter, clock, request });

    // read synchronously — no await between the call and the assertion
    expect(live.calls.dialogue).toBe(1);
    expect(live.calls.portrait).toBe(1);
    expect(fallback.calls.dialogue).toBe(0);
    expect(fallback.calls.portrait).toBe(0);
    expect(live.seen.dialogue[0]).toBe(request.dialogue);
    expect(live.seen.portrait[0]).toBe(request.portrait);
    handle.cancel();
  });

  it('AC1-a — returns a handle synchronously with both tracks pending and nothing settled', () => {
    const live = makeControlledAdapter();
    const clock = createManualClock();

    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock,
      request: makeRequest(),
    });

    expect(handle.getState()).toEqual({
      dialogue: { status: 'pending', value: null },
      portrait: { status: 'pending', value: null },
      settled: false,
      cancelled: false,
    });
    handle.cancel();
  });

  it('AC1-b — dialogue-ready / portrait-pending is observable as a distinct state', async () => {
    const live = makeControlledAdapter();
    const beat = validBeat();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    live.d.resolve(beat);
    await flush();

    const state = handle.getState();
    expect(state.dialogue.status).toBe('ready');
    expect(state.dialogue.value).toBe(beat);
    expect(state.portrait.status).toBe('pending');
    expect(state.portrait.value).toBeNull();
    expect(state.settled).toBe(false);
    handle.cancel();
  });

  it('AC1-c — each track change notifies subscribers once, without waiting for the other track', async () => {
    const live = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });
    const sub = watch(handle);

    expect(sub.seen).toHaveLength(0); // A5: subscribe does not replay the current state

    live.d.resolve(validBeat());
    await flush();
    expect(sub.seen).toHaveLength(1);
    expect(sub.seen[0]!.dialogue.status).toBe('ready');
    expect(sub.seen[0]!.portrait.status).toBe('pending');
    expect(sub.seen[0]!.settled).toBe(false);

    const sheet = validSheet();
    live.p.resolve(sheet);
    await flush();
    expect(sub.seen).toHaveLength(2);
    expect(sub.seen[1]!.portrait.status).toBe('ready');
    expect(sub.seen[1]!.portrait.value).toBe(sheet);
    expect(sub.seen[1]!.settled).toBe(true);
    handle.cancel();
  });

  it('AC1-b — getState() hands out a fresh snapshot that cannot mutate internal state', async () => {
    const live = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    const a = handle.getState();
    const b = handle.getState();
    expect(a).not.toBe(b);
    expect(a.dialogue).not.toBe(b.dialogue);

    a.dialogue.status = 'ready';
    a.settled = true;
    expect(handle.getState().dialogue.status).toBe('pending');
    expect(handle.getState().settled).toBe(false);

    live.d.resolve(validBeat());
    await flush();
    expect(handle.getState().dialogue.status).toBe('ready');
    handle.cancel();
  });
});

// ---------------------------------------------------------------------------
// AC2 — all waiting flows through the injected clock; the 25s boundary is exact
// ---------------------------------------------------------------------------

const here = dirname(fileURLToPath(import.meta.url));
const pipelineDir = resolve(here, '../../src/pipeline'); // demos/apothecary/src/pipeline
const REAL_CLOCK_SENTINEL = '// >>> REAL-CLOCK BOUNDARY <<<';
const BANNED_TIMING = [
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'Date.now',
  'performance.now',
  'Math.random',
];

function collectTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('AC2 — injected clock only (source scan) and an exact 25_000ms deadline', () => {
  it('AC2-a — src/pipeline contains .ts source to scan', () => {
    expect(collectTsFiles(pipelineDir).length).toBeGreaterThan(0);
  });

  it('AC2-a — prefetch.ts references no wall-clock / timer / random API at all (§3-3)', () => {
    const src = readFileSync(join(pipelineDir, 'prefetch.ts'), 'utf8');
    for (const bad of BANNED_TIMING) {
      expect(src.includes(bad), `src/pipeline/prefetch.ts references ${bad}`).toBe(false);
    }
  });

  it('AC2-b — clock.ts confines every timing API to createRealClock, below the sentinel', () => {
    const src = readFileSync(join(pipelineDir, 'clock.ts'), 'utf8');
    const at = src.indexOf(REAL_CLOCK_SENTINEL);
    expect(at, 'clock.ts must carry the REAL-CLOCK BOUNDARY sentinel').toBeGreaterThan(-1);
    expect(src.indexOf(REAL_CLOCK_SENTINEL, at + 1), 'sentinel must appear exactly once').toBe(-1);

    const aboveSentinel = src.slice(0, at);
    for (const bad of BANNED_TIMING) {
      expect(aboveSentinel.includes(bad), `clock.ts references ${bad} outside createRealClock`).toBe(false);
    }
    expect(src.slice(at)).toContain('createRealClock');
  });

  it('AC2-a — no other file under src/pipeline reaches for a timing API', () => {
    for (const file of collectTsFiles(pipelineDir)) {
      if (file.endsWith('clock.ts')) continue; // covered by AC2-b's sentinel slice
      const src = readFileSync(file, 'utf8');
      for (const bad of BANNED_TIMING) {
        expect(src.includes(bad), `${file} references ${bad}`).toBe(false);
      }
    }
  });

  it('AC2-e — DEADLINE_MS is the 25s waiting beat from PRD §2.3', () => {
    expect(DEADLINE_MS).toBe(25_000);
  });

  it('AC2-c — 24_999ms changes nothing; the very next millisecond flips pending tracks to fallback', async () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });
    const sub = watch(handle);

    clock.advance(24_999);
    await flush();
    expect(sub.seen).toHaveLength(0);
    expect(handle.getState().dialogue.status).toBe('pending');
    expect(handle.getState().portrait.status).toBe('pending');
    expect(fallback.calls.dialogue).toBe(0);

    clock.advance(1); // t = 25_000 exactly
    await flush();
    expect(handle.getState().dialogue.status).toBe('fallback');
    expect(handle.getState().portrait.status).toBe('fallback');
    expect(sub.seen).toHaveLength(2);
    handle.cancel();
  });

  it('AC2-d — exactly one timer is ever scheduled for a customer (no polling, no re-arming)', async () => {
    const live = makeControlledAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock,
      request: makeRequest(),
    });

    expect(clock.scheduled).toBe(1);
    clock.advance(25_000);
    await flush();
    expect(clock.scheduled).toBe(1);
    clock.advance(60_000);
    await flush();
    expect(clock.scheduled).toBe(1);
    handle.cancel();
  });

  it('AC2-e — an injected deadlineMs replaces the default and fires on its own boundary', async () => {
    const live = makeControlledAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock,
      request: makeRequest(),
      deadlineMs: 1_000,
    });

    clock.advance(999);
    await flush();
    expect(handle.getState().dialogue.status).toBe('pending');

    clock.advance(1);
    await flush();
    expect(handle.getState().dialogue.status).toBe('fallback');
    expect(handle.getState().portrait.status).toBe('fallback');
    handle.cancel();
  });

  it('AC2-c — the deadline is measured from startPrefetch, not from clock zero', async () => {
    const live = makeControlledAdapter();
    const clock = createManualClock(500_000); // clock already far along
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock,
      request: makeRequest(),
    });

    clock.advance(24_999);
    await flush();
    expect(handle.getState().dialogue.status).toBe('pending');
    clock.advance(1);
    await flush();
    expect(handle.getState().dialogue.status).toBe('fallback');
    handle.cancel();
  });
});

// ---------------------------------------------------------------------------
// AC3 — deadline fallback + late-arrival race
// ---------------------------------------------------------------------------

describe('AC3 — deadline expiry degrades silently and late live results never swap the customer', () => {
  it('AC3-a — both tracks land on the fallback pack payloads (same object refs)', async () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });

    clock.advance(DEADLINE_MS);
    await flush();

    const state = handle.getState();
    expect(state.dialogue).toEqual({ status: 'fallback', value: fallback.beat });
    expect(state.dialogue.value).toBe(fallback.beat);
    expect(state.portrait.value).toBe(fallback.sheet);
    expect(state.settled).toBe(true);
    expect(fallback.calls.dialogue).toBe(1);
    expect(fallback.calls.portrait).toBe(1);
    handle.cancel();
  });

  it('AC3-b — a live dialogue that resolves AFTER the fallback is discarded', async () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });
    const sub = watch(handle);

    clock.advance(DEADLINE_MS);
    await flush();
    const settled = JSON.stringify(handle.getState());
    const notifications = sub.seen.length;

    live.d.resolve(validBeat('너무 늦게 도착한 대사'));
    live.p.resolve(validSheet('bGF0ZQ=='));
    await flush();
    await flush();

    expect(JSON.stringify(handle.getState())).toBe(settled);
    expect(handle.getState().dialogue.value).toBe(fallback.beat);
    expect(handle.getState().portrait.value).toBe(fallback.sheet);
    expect(sub.seen).toHaveLength(notifications);
    expect(fallback.calls.dialogue).toBe(1); // no second fallback request
    handle.cancel();
  });

  it('AC3-c — a live promise rejecting AFTER the fallback changes nothing and escapes nowhere', async () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });
    const sub = watch(handle);

    clock.advance(DEADLINE_MS);
    await flush();
    const settled = JSON.stringify(handle.getState());
    const notifications = sub.seen.length;

    live.d.reject(new AIUnavailableError('LATE-REJECT-4471'));
    live.p.reject(new AIUnavailableError('LATE-REJECT-4471'));
    await flush();
    await flush();

    expect(JSON.stringify(handle.getState())).toBe(settled);
    expect(JSON.stringify(handle.getState())).not.toContain('LATE-REJECT-4471');
    expect(sub.seen).toHaveLength(notifications);
    expect(fallback.calls.dialogue).toBe(1);
    handle.cancel();
  });

  it('AC3-d — a track already ready at deadline keeps its live value; only the pending one degrades', async () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });

    const beat = validBeat('제때 도착한 대사');
    live.d.resolve(beat);
    await flush();
    expect(handle.getState().dialogue.status).toBe('ready');

    clock.advance(DEADLINE_MS);
    await flush();

    const state = handle.getState();
    expect(state.dialogue).toEqual({ status: 'ready', value: beat });
    expect(state.dialogue.value).toBe(beat);
    expect(state.portrait).toEqual({ status: 'fallback', value: fallback.sheet });
    expect(fallback.calls.dialogue).toBe(0); // the ready track never asked for a stub
    expect(fallback.calls.portrait).toBe(1);
    expect(state.settled).toBe(true);
    handle.cancel();
  });
});

// ---------------------------------------------------------------------------
// AC4 — silent degradation: nothing throws, no error strings leak into state
// ---------------------------------------------------------------------------

describe('AC4 — failures are absorbed into the fallback, never surfaced (§3-5)', () => {
  it('AC4-a — AIUnavailableError degrades immediately, without waiting out the deadline', async () => {
    const fallback = makeStubAdapter();
    const clock = createManualClock();

    const handle = startPrefetch({
      adapter: makeRejectingAdapter('ORACLE-BOOM-1234'),
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });

    await flush();
    // clock has NOT advanced at all
    expect(clock.now()).toBe(0);
    expect(handle.getState().dialogue.status).toBe('fallback');
    expect(handle.getState().portrait.status).toBe('fallback');
    expect(handle.getState().settled).toBe(true);
    handle.cancel();
  });

  it('AC4-a — an adapter that throws synchronously does not throw out of startPrefetch', async () => {
    const fallback = makeStubAdapter();
    const adapter = makeThrowingAdapter('SYNC-THROW-8802');

    let handle: PrefetchHandle | null = null;
    expect(() => {
      handle = startPrefetch({
        adapter,
        fallbackAdapter: fallback.adapter,
        clock: createManualClock(),
        request: makeRequest(),
      });
    }).not.toThrow();

    await flush();
    const live = handle as unknown as PrefetchHandle;
    expect(live.getState().dialogue.status).toBe('fallback');
    expect(live.getState().portrait.status).toBe('fallback');
    expect(JSON.stringify(live.getState())).not.toContain('SYNC-THROW-8802');
    live.cancel();
  });

  it.each<[string, unknown]>([
    ['too few choices', { npcLine: '음...', choices: [{ label: 'a', verb: 'direct', patienceCost: 1 }] }],
    ['empty npcLine', { ...validBeat(), npcLine: '' }],
    ['unknown verb', { ...validBeat(), choices: validBeat().choices.map((c) => ({ ...c, verb: 'shout' })) }],
    ['not an object', 'a plain string'],
    ['null payload', null],
  ])('AC4-b — schema-invalid dialogue (%s) degrades to the fallback instead of going ready', async (_label, payload) => {
    const fallback = makeStubAdapter();
    const handle = startPrefetch({
      adapter: makeResolvingAdapter(payload, validSheet()),
      fallbackAdapter: fallback.adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    await flush();
    expect(handle.getState().dialogue.status).toBe('fallback');
    expect(handle.getState().dialogue.value).toBe(fallback.beat);
    expect(handle.getState().portrait.status).toBe('ready'); // the healthy track is untouched
    handle.cancel();
  });

  it.each<[string, unknown]>([
    ['empty b64', { b64: '', prompt: 'p' }],
    ['missing b64', { prompt: 'p' }],
    ['b64 not a string', { b64: 12, prompt: 'p' }],
    ['prompt not a string', { b64: 'aaa', prompt: 7 }],
    ['null payload', null],
  ])('AC4-c — an invalid portrait sheet (%s) degrades to the fallback', async (_label, payload) => {
    const fallback = makeStubAdapter();
    const handle = startPrefetch({
      adapter: makeResolvingAdapter(validBeat(), payload),
      fallbackAdapter: fallback.adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    await flush();
    expect(handle.getState().portrait.status).toBe('fallback');
    expect(handle.getState().portrait.value).toBe(fallback.sheet);
    expect(handle.getState().dialogue.status).toBe('ready');
    handle.cancel();
  });

  it('AC4-c — isPortraitSheet accepts a real sheet and rejects every malformed shape', () => {
    expect(isPortraitSheet(validSheet())).toBe(true);
    expect(isPortraitSheet({ b64: 'aaa', prompt: '' })).toBe(true); // prompt is manifest metadata
    expect(isPortraitSheet({ b64: '', prompt: 'p' })).toBe(false);
    expect(isPortraitSheet({ prompt: 'p' })).toBe(false);
    expect(isPortraitSheet({ b64: 'aaa' })).toBe(false);
    expect(isPortraitSheet(null)).toBe(false);
    expect(isPortraitSheet(undefined)).toBe(false);
    expect(isPortraitSheet('aaa')).toBe(false);
  });

  it('AC4-d — no adapter error message or error-shaped key ever reaches the state', async () => {
    const secret = 'ORACLE-BOOM-1234';
    const handle = startPrefetch({
      adapter: makeRejectingAdapter(secret),
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    await flush();
    expect(handle.getState().dialogue.status).toBe('fallback'); // the failure really happened
    expect(handle.getState().portrait.status).toBe('fallback');

    const json = JSON.stringify(handle.getState());
    expect(json).not.toContain(secret);
    expect(json).not.toContain('AIUnavailableError');

    const keys = allKeys(handle.getState());
    for (const forbidden of ['error', 'message', 'stack', 'reason', 'cause']) {
      expect(keys, `state exposes a "${forbidden}" key`).not.toContain(forbidden);
    }
    handle.cancel();
  });

  it('AC4-e — when the fallback pack fails too, the track settles at value:null without throwing', async () => {
    const handle = startPrefetch({
      adapter: makeRejectingAdapter('ORACLE-BOOM-1234'),
      fallbackAdapter: makeFailingFallback(),
      clock: createManualClock(),
      request: makeRequest(),
    });
    const sub = watch(handle);

    await flush();
    await flush();

    expect(handle.getState().dialogue).toEqual({ status: 'fallback', value: null });
    expect(handle.getState().portrait).toEqual({ status: 'fallback', value: null });
    expect(handle.getState().settled).toBe(true);
    expect(JSON.stringify(handle.getState())).not.toContain('FALLBACK-PACK-MISSING-9137');
    expect(sub.seen).toHaveLength(2); // one terminal transition per track
    handle.cancel();
  });

  it('AC4-e — a fallback pack that resolves garbage settles at value:null, not at the garbage', async () => {
    const brokenPack: AIAdapter = {
      mode: 'stub',
      dialogue() {
        return Promise.resolve({ npcLine: '', choices: [] } as unknown as DialogueBeat);
      },
      portrait() {
        return Promise.resolve({ b64: '' } as unknown as PortraitSheet);
      },
    };
    const handle = startPrefetch({
      adapter: makeRejectingAdapter('ORACLE-BOOM-1234'),
      fallbackAdapter: brokenPack,
      clock: createManualClock(),
      request: makeRequest(),
    });

    await flush();
    await flush();
    expect(handle.getState().dialogue).toEqual({ status: 'fallback', value: null });
    expect(handle.getState().portrait).toEqual({ status: 'fallback', value: null });
    handle.cancel();
  });

  it('AC4-a — a live failure before the deadline does not trigger a second fallback request at 25s', async () => {
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: makeRejectingAdapter('ORACLE-BOOM-1234'),
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });
    const sub = watch(handle);

    await flush();
    expect(fallback.calls.dialogue).toBe(1);
    const notifications = sub.seen.length;

    clock.advance(DEADLINE_MS);
    await flush();
    expect(fallback.calls.dialogue).toBe(1);
    expect(fallback.calls.portrait).toBe(1);
    expect(sub.seen).toHaveLength(notifications);
    handle.cancel();
  });
});

// ---------------------------------------------------------------------------
// AC5 — cancellation (customer already left / app unmounted)
// ---------------------------------------------------------------------------

describe('AC5 — cancel() stops in-flight work from ever touching state again', () => {
  it('AC5-a — a live result arriving after cancel() fires no callback and changes no state', async () => {
    const live = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });
    const sub = watch(handle);

    handle.cancel();
    expect(handle.getState().cancelled).toBe(true);

    live.d.resolve(validBeat());
    live.p.resolve(validSheet());
    await flush();
    await flush();

    expect(sub.seen).toHaveLength(0);
    expect(handle.getState().dialogue.status).toBe('pending');
    expect(handle.getState().portrait.status).toBe('pending');
    expect(handle.getState().cancelled).toBe(true);
  });

  it('AC5-a — a live rejection after cancel() is swallowed too', async () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: fallback.adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });
    const sub = watch(handle);

    handle.cancel();
    live.d.reject(new AIUnavailableError('CANCELLED-REJECT-5150'));
    live.p.reject(new AIUnavailableError('CANCELLED-REJECT-5150'));
    await flush();
    await flush();

    expect(sub.seen).toHaveLength(0);
    expect(fallback.calls.dialogue).toBe(0); // cancelled means cancelled — no stub request either
    expect(handle.getState().dialogue.status).toBe('pending');
  });

  // The two tests below cover the window the other AC5 cases cannot reach: once
  // degrade() has already issued the pack request, the live-path `claimed` gate
  // is behind us and the pack's own await is the only thing left in flight. If
  // the customer leaves right there, the settle handler is the last guard.
  it('AC5-a — cancel() during an in-flight fallback request discards the pack result', async () => {
    const live = makeControlledAdapter();
    const pack = makeControlledAdapter(); // fallback we can hold open by hand
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: pack.adapter,
      clock,
      request: makeRequest(),
    });
    const sub = watch(handle);

    // Deadline fires with the live tracks still silent -> the pack is requested
    // but does not answer yet.
    clock.advance(DEADLINE_MS);
    await flush();
    expect(pack.calls.dialogue).toBe(1);
    expect(pack.calls.portrait).toBe(1);
    expect(handle.getState().dialogue.status).toBe('pending');

    handle.cancel();

    pack.d.resolve(validBeat('너무 늦게 도착한 스텁'));
    pack.p.resolve(validSheet('bGF0ZS1zdHVi'));
    await flush();
    await flush();

    expect(sub.seen).toHaveLength(0);
    expect(handle.getState().dialogue.status).toBe('pending');
    expect(handle.getState().dialogue.value).toBeNull();
    expect(handle.getState().portrait.status).toBe('pending');
    expect(handle.getState().portrait.value).toBeNull();
    expect(handle.getState().settled).toBe(false);
    expect(handle.getState().cancelled).toBe(true);
  });

  it('AC5-a — cancel() during an in-flight fallback that then REJECTS stays silent too', async () => {
    const pack = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: makeRejectingAdapter('LIVE-DOWN-4471'),
      fallbackAdapter: pack.adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });
    const sub = watch(handle);

    // Live rejection degrades immediately, so the pack request is in flight
    // without the deadline having fired at all.
    await flush();
    expect(pack.calls.dialogue).toBe(1);

    handle.cancel();

    pack.d.reject(new AIUnavailableError('PACK-DOWN-4472'));
    pack.p.reject(new AIUnavailableError('PACK-DOWN-4472'));
    await flush();
    await flush();

    expect(sub.seen).toHaveLength(0);
    expect(handle.getState().dialogue.status).toBe('pending');
    expect(handle.getState().portrait.status).toBe('pending');
    expect(handle.getState().cancelled).toBe(true);
    expect(JSON.stringify(handle.getState())).not.toContain('PACK-DOWN-4472');
  });

  it('AC5-b — cancel() releases the deadline timer; later time travel is inert', async () => {
    const live = makeControlledAdapter();
    const fallback = makeStubAdapter();
    const clock = createManualClock();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: fallback.adapter,
      clock,
      request: makeRequest(),
    });
    const sub = watch(handle);

    expect(clock.pending).toBe(1);
    handle.cancel();
    expect(clock.pending).toBe(0);

    clock.advance(60_000);
    await flush();
    expect(sub.seen).toHaveLength(0);
    expect(handle.getState().dialogue.status).toBe('pending');
    expect(fallback.calls.portrait).toBe(0);
  });

  it('AC5-c — cancel() is idempotent, and safe after the prefetch already settled', async () => {
    const live = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    live.d.resolve(validBeat());
    live.p.resolve(validSheet());
    await flush();
    expect(handle.getState().settled).toBe(true);

    expect(() => {
      handle.cancel();
      handle.cancel();
      handle.cancel();
    }).not.toThrow();
    expect(handle.getState().cancelled).toBe(true);
    // the already-settled values survive cancellation (the customer is on screen)
    expect(handle.getState().dialogue.status).toBe('ready');
  });

  it('AC5-d — unsubscribing stops that subscriber only; the others keep receiving updates', async () => {
    const live = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    const a: PrefetchState[] = [];
    const b: PrefetchState[] = [];
    const offA = handle.subscribe((s) => a.push(s));
    handle.subscribe((s) => b.push(s));

    offA();
    live.d.resolve(validBeat());
    await flush();

    expect(a).toHaveLength(0);
    expect(b).toHaveLength(1);
    expect(() => {
      offA();
      offA();
    }).not.toThrow();
    handle.cancel();
  });

  it('AC5-d — unsubscribe handles handed out before cancel() stay safe no-ops afterwards', async () => {
    const live = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });
    const off = handle.subscribe(() => {});

    handle.cancel();
    expect(() => off()).not.toThrow();
    live.d.resolve(validBeat());
    await flush();
    expect(handle.getState().cancelled).toBe(true);
  });

  it('AC5-a — a subscriber that throws does not break the other subscribers or leak out', async () => {
    const live = makeControlledAdapter();
    const handle = startPrefetch({
      adapter: live.adapter,
      fallbackAdapter: makeStubAdapter().adapter,
      clock: createManualClock(),
      request: makeRequest(),
    });

    const good: PrefetchState[] = [];
    handle.subscribe(() => {
      throw new Error('BAD-SUBSCRIBER-3311');
    });
    handle.subscribe((s) => good.push(s));

    live.d.resolve(validBeat());
    await flush();
    await flush();

    expect(good).toHaveLength(1);
    expect(handle.getState().dialogue.status).toBe('ready');
    handle.cancel();
  });
});

// ---------------------------------------------------------------------------
// ManualClock — the determinism seam the AC2 tests stand on (C2-C5)
// ---------------------------------------------------------------------------

describe('ManualClock — deterministic timing seam', () => {
  it('C5 — starts at 0 (or at the given start) and only moves when advanced', () => {
    expect(createManualClock().now()).toBe(0);
    const clock = createManualClock(1_234);
    expect(clock.now()).toBe(1_234);
    clock.advance(66);
    expect(clock.now()).toBe(1_300);
  });

  it('C3 — fires on the inclusive boundary: at+ms fires, one millisecond earlier does not', () => {
    const clock: ManualClock = createManualClock();
    const hits: string[] = [];
    clock.after(25_000, () => hits.push('deadline'));

    clock.advance(24_999);
    expect(hits).toEqual([]);
    clock.advance(1);
    expect(hits).toEqual(['deadline']);
    expect(clock.now()).toBe(25_000);
  });

  it('C3 — callbacks due at the same instant run in scheduling order, and time lands on the target', () => {
    const clock = createManualClock();
    const hits: string[] = [];
    clock.after(10, () => hits.push('a'));
    clock.after(10, () => hits.push('b'));
    clock.after(5, () => hits.push('early'));

    clock.advance(50);
    expect(hits).toEqual(['early', 'a', 'b']);
    expect(clock.now()).toBe(50);
  });

  it('C3 — each scheduled callback fires exactly once, no matter how far time is advanced', () => {
    const clock = createManualClock();
    let n = 0;
    clock.after(10, () => {
      n++;
    });
    clock.advance(1_000);
    clock.advance(1_000);
    expect(n).toBe(1);
  });

  it('C2 — the cancel handle is idempotent and prevents a pending callback from firing', () => {
    const clock = createManualClock();
    let fired = 0;
    const cancel = clock.after(100, () => {
      fired++;
    });

    expect(clock.pending).toBe(1);
    cancel();
    expect(clock.pending).toBe(0);
    expect(() => cancel()).not.toThrow();

    clock.advance(1_000);
    expect(fired).toBe(0);
    expect(clock.scheduled).toBe(1); // lifetime counter still records the booking
  });

  it('C2 — cancelling after the callback already fired is a safe no-op', () => {
    const clock = createManualClock();
    let fired = 0;
    const cancel = clock.after(10, () => {
      fired++;
    });
    clock.advance(10);
    expect(fired).toBe(1);
    expect(clock.pending).toBe(0);
    expect(() => cancel()).not.toThrow();
    clock.advance(1_000);
    expect(fired).toBe(1);
  });

  it('C5 — scheduled is a lifetime total while pending tracks only live bookings', () => {
    const clock = createManualClock();
    const c1 = clock.after(10, () => {});
    clock.after(20, () => {});
    clock.after(30, () => {});
    expect(clock.scheduled).toBe(3);
    expect(clock.pending).toBe(3);

    c1();
    expect(clock.pending).toBe(2);
    clock.advance(20);
    expect(clock.pending).toBe(1);
    clock.advance(100);
    expect(clock.pending).toBe(0);
    expect(clock.scheduled).toBe(3);
  });

  it('C4 — a callback may chain another booking inside the same advance window', () => {
    const clock = createManualClock();
    const hits: number[] = [];
    clock.after(10, () => {
      hits.push(clock.now());
      clock.after(10, () => {
        hits.push(clock.now());
      });
    });

    clock.advance(30);
    expect(hits).toEqual([10, 20]);
    expect(clock.scheduled).toBe(2);
  });

  it('C4 — a runaway self-rescheduling callback is capped instead of hanging the runner', () => {
    const clock = createManualClock();
    let n = 0;
    const tick = (): void => {
      n++;
      clock.after(0, tick);
    };
    clock.after(0, tick);

    expect(() => clock.advance(1)).not.toThrow();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(10_000);
  });

  it('C3 — a non-positive delay is clamped to "as soon as time moves"', () => {
    const clock = createManualClock();
    const hits: string[] = [];
    clock.after(0, () => hits.push('zero'));
    clock.after(-5, () => hits.push('negative'));
    clock.advance(0);
    expect(hits).toEqual(['zero', 'negative']);
  });
});

describe('createRealClock — the single seam allowed to touch real time', () => {
  it('N1 — reports a monotonic now() and fires an ms-delayed callback', async () => {
    const clock = createRealClock();
    const t0 = clock.now();
    expect(typeof t0).toBe('number');

    let fired = 0;
    clock.after(1, () => {
      fired++;
    });
    await flush();
    await flush();
    expect(fired).toBe(1);
    expect(clock.now()).toBeGreaterThanOrEqual(t0);
  });

  it('C2 — its cancel handle is idempotent and stops the callback', async () => {
    const clock = createRealClock();
    let fired = 0;
    const cancel = clock.after(1, () => {
      fired++;
    });
    cancel();
    expect(() => cancel()).not.toThrow();
    await flush();
    await flush();
    expect(fired).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// N3 — nothing in this module ever produces an unhandled rejection
// ---------------------------------------------------------------------------

const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown): void => {
  unhandled.push(reason);
};

beforeAll(() => {
  process.on('unhandledRejection', onUnhandled);
});

afterAll(() => {
  process.off('unhandledRejection', onUnhandled);
});

describe('N3 — unhandled-rejection watchdog', () => {
  it('records no unhandled rejection across every failure scenario above', async () => {
    await flush();
    await flush();
    expect(unhandled).toEqual([]);
  });
});
