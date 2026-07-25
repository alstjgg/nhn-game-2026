// u1 RED — boot factory (spec AC14–AC17).
//
// Contract under test (design §3.4, src/ai/boot.ts):
//   chooseMode(health: AIHealth | null): 'live' | 'stub'
//   createBootAdapter(deps?): Promise<AIAdapter>   — never rejects on a
//     probe/live-adapter FAILURE (AC16); DOES reject when createStub() throws
//     on bad canned data (AC16b) — that is a boot-time crash by design.
//
// Everything injectable: probe / timeoutMs / createLive / createStub. The unit
// must not perform a real health request and must not modify main.ts or app/index.ts.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIAdapter } from '../../src/ai/adapter';
import { chooseMode, createBootAdapter } from '../../src/ai/boot';
import { fakeProbe, healthDown, healthOk } from './fixtures';

const fetchSpy = vi.fn((): never => {
  throw new Error('boot must not touch the network when a probe is injected');
});

function marker(mode: 'live' | 'stub', tag: string): AIAdapter {
  return {
    mode,
    dialogue: () => Promise.reject(new Error(`unused ${tag}`)),
    portrait: () => Promise.reject(new Error(`unused ${tag}`)),
  } as unknown as AIAdapter;
}

const liveDouble = () => marker('live', 'live');
const stubDouble = () => marker('stub', 'stub');

beforeEach(() => {
  fetchSpy.mockClear();
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ── AC14 — chooseMode ──────────────────────────────────────────────────────
describe('AC14 chooseMode', () => {
  it('returns "live" only for an ok health payload', () => {
    expect(chooseMode(healthOk())).toBe('live');
  });

  it('returns "stub" for ok:false', () => {
    expect(chooseMode(healthDown())).toBe('stub');
  });

  it('returns "stub" for a null probe result (no proxy / production build)', () => {
    expect(chooseMode(null)).toBe('stub');
  });
});

// ── AC15 — injected probe, default 800ms timeout ───────────────────────────
describe('AC15 createBootAdapter uses the injected probe', () => {
  it('calls the injected probe exactly once and never fetches', async () => {
    const spy = fakeProbe(healthOk());
    await createBootAdapter({ probe: spy.probe, createLive: liveDouble, createStub: stubDouble });
    expect(spy.args).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('passes the PRD §2.1 default timeout of 800ms', async () => {
    const spy = fakeProbe(healthOk());
    await createBootAdapter({ probe: spy.probe, createLive: liveDouble, createStub: stubDouble });
    expect(spy.args[0]).toBe(800);
  });

  it('honours an explicit timeoutMs override', async () => {
    const spy = fakeProbe(healthOk());
    await createBootAdapter({
      probe: spy.probe,
      timeoutMs: 120,
      createLive: liveDouble,
      createStub: stubDouble,
    });
    expect(spy.args[0]).toBe(120);
  });

  it('returns the live adapter when health is ok', async () => {
    const adapter = await createBootAdapter({
      probe: fakeProbe(healthOk()).probe,
      createLive: liveDouble,
      createStub: stubDouble,
    });
    expect(adapter.mode).toBe('live');
  });

  it('returns the stub adapter when health is not ok', async () => {
    const adapter = await createBootAdapter({
      probe: fakeProbe(healthDown()).probe,
      createLive: liveDouble,
      createStub: stubDouble,
    });
    expect(adapter.mode).toBe('stub');
  });

  it('returns the stub adapter when the probe resolves null', async () => {
    const adapter = await createBootAdapter({
      probe: fakeProbe(null).probe,
      createLive: liveDouble,
      createStub: stubDouble,
    });
    expect(adapter.mode).toBe('stub');
  });

  it('does not construct the live adapter in stub mode', async () => {
    const createLive = vi.fn(liveDouble);
    await createBootAdapter({
      probe: fakeProbe(null).probe,
      createLive,
      createStub: stubDouble,
    });
    expect(createLive).not.toHaveBeenCalled();
  });

  it('forwards stubConfig to the stub factory', async () => {
    const createStub = vi.fn(stubDouble);
    const stubConfig = { latencyMs: { dialogueMs: 0, portraitMs: 0 } };
    await createBootAdapter({ probe: fakeProbe(null).probe, createStub, stubConfig });
    expect(createStub).toHaveBeenCalledWith(stubConfig);
  });
});

// ── AC16 — every *runtime* failure (probe/live) degrades to the stub ───────
// Bad canned DATA is deliberately NOT covered here — see AC16b below, which
// pins the opposite behaviour: createBootAdapter propagates that rejection.
describe('AC16 failures degrade silently to the stub adapter', () => {
  it('falls back when the probe rejects', async () => {
    const adapter = await createBootAdapter({
      probe: fakeProbe(new Error('network down')).probe,
      createLive: liveDouble,
      createStub: stubDouble,
    });
    expect(adapter.mode).toBe('stub');
  });

  it('falls back when the probe throws synchronously', async () => {
    const adapter = await createBootAdapter({
      probe: () => {
        throw new Error('boom');
      },
      createLive: liveDouble,
      createStub: stubDouble,
    });
    expect(adapter.mode).toBe('stub');
  });

  it('falls back when createLive() throws', async () => {
    const adapter = await createBootAdapter({
      probe: fakeProbe(healthOk()).probe,
      createLive: () => {
        throw new Error('live construction failed');
      },
      createStub: stubDouble,
    });
    expect(adapter.mode).toBe('stub');
  });

  it('resolves (never rejects) for every probe/live failure shape', async () => {
    await expect(
      createBootAdapter({
        probe: fakeProbe(new Error('down')).probe,
        createLive: liveDouble,
        createStub: stubDouble,
      }),
    ).resolves.toBeDefined();
  });

  it('uses the real stub adapter by default when the probe reports nothing', async () => {
    const adapter = await createBootAdapter({ probe: fakeProbe(null).probe });
    expect(adapter.mode).toBe('stub');
    expect(typeof adapter.dialogue).toBe('function');
    expect(typeof adapter.portrait).toBe('function');
  });
});

// ── AC16b — bad canned DATA is a boot-time crash, not a stub fallback ──────
// createStub() is trusted to fail loudly (D3); createBootAdapter must not
// swallow that the way it swallows a probe/live failure above.
describe('AC16b a broken stubConfig/data propagates instead of degrading', () => {
  it('rejects when the injected createStub throws', async () => {
    await expect(
      createBootAdapter({
        probe: fakeProbe(null).probe,
        createStub: () => {
          throw new Error('stub-dialogue: scripts must be an array');
        },
      }),
    ).rejects.toThrow(/stub-dialogue/);
  });

  it('rejects when the real createStub is handed malformed canned data', async () => {
    await expect(
      createBootAdapter({ probe: () => Promise.resolve(null), stubConfig: { data: { nope: 1 } } }),
    ).rejects.toThrow(/stub-dialogue/);
  });

  it('also rejects on the live-health path (not just the null-health path)', async () => {
    await expect(
      createBootAdapter({
        probe: fakeProbe(healthOk()).probe,
        createLive: () => {
          throw new Error('live construction failed');
        },
        createStub: () => {
          throw new Error('stub-dialogue: bad canned data');
        },
      }),
    ).rejects.toThrow(/stub-dialogue/);
  });
});

// ── AC17 — importing boot.ts has zero side effects ─────────────────────────
describe('AC17 boot.ts is side-effect free at import time', () => {
  it('has not fetched or scheduled anything merely by being imported', async () => {
    vi.useFakeTimers();
    const mod = await import('../../src/ai/boot');
    expect(typeof mod.createBootAdapter).toBe('function');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('declares no top-level probe/await call in the source', () => {
    const src = readFileSync(new URL('../../src/ai/boot.ts', import.meta.url), 'utf8');
    // no top-level statement that immediately invokes the boot path
    expect(src).not.toMatch(/^\s*(await|createBootAdapter\(|probeHealth\()/m);
    expect(src).not.toMatch(/\bsetTimeout\s*\(/);
  });
});

// ── AC20 guard — the wiring files stay untouched in this unit ──────────────
// u14 (final integration) retired the first assertion's "…yet": u13 landed the
// wiring, so "main.ts must not import the boot factory" became a receipt for a
// hand-off that has happened. Same guard, post-hand-off form — boot wiring lives
// in main.ts and ONLY there, which is the invariant the pair always protected
// (the app shell is handed an adapter; it never builds one). Nothing is dropped:
// the app/index.ts half below is untouched.
describe('AC20 the boot factory is wired in main.ts and nowhere else', () => {
  it('main.ts is the single boot site (imports the factory exactly once)', () => {
    const src = readFileSync(new URL('../../src/main.ts', import.meta.url), 'utf8');
    expect([...src.matchAll(/from\s*'[^']*ai\/boot[^']*'/g)]).toHaveLength(1);
    expect(src).toMatch(/createBootAdapter/);
  });

  it('app/index.ts does not import the boot factory', () => {
    const src = readFileSync(new URL('../../src/app/index.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/ai\/boot/);
  });
});
