// u6 — the stub adapter: adapter-owned waiting, the per-mode decision timeout,
// the silent class-default fallback, and parallel per-unit calls (TDD-Red).
//
// Covers AC3a (the only setTimeout under src/** lives in src/ai/stub.ts) ·
// AC3c (a blown budget resolves null, then the class default action) · AC3d
// (the whole degradation path is silent) · AC3e (latency comes from config; 0
// schedules nothing) · AC5a/AC5b (one wall-clock wait per turn; per-call
// degradation).
//
// PRD §2.2 + INV-6/INV-7: all timing is adapter config out of `data/tuning.json`
// (0 in unit tests), the game never blocks on a decision, and a fallback shows
// "…" — never error text.
//
// Test-name contract: the AC gates run `-t timeout` and `-t parallel`, so every
// timeout-owning describe carries the lowercase word "timeout" and every
// parallelism describe carries "parallel".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { isAgentDecision } from '../../src/ai/contract.ts';
import type {
  AgentDecision,
  AIAdapter,
  DecideRequest,
  EntityView,
  SituationSnapshot,
  StanceRequest,
} from '../../src/ai/contract.ts';
import { DEFAULT_KEY } from '../../src/ai/bucket.ts';
import type { BucketConfig, DecisionPool } from '../../src/ai/bucket.ts';
import {
  ELLIPSIS_SAY,
  createFallbackDecider,
  createStubAdapter,
  decideAll,
  decideOrDefault,
} from '../../src/ai/stub.ts';
import type { Sleep, SleepKind } from '../../src/ai/stub.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..'); // demos/darkest-context/

// ── tunables: test-local only. src/ai/{bucket,stub,boot}.ts may not inline any. ──
const CFG: BucketConfig = { openingTurn: 1, hurtBelowRatio: 0.5, enemyLowBelowRatio: 0.3 };
const NO_LATENCY = 0;
const BUDGET_MS = 3;
const SCRIPT: readonly number[] = [12, 24, 18];

const heroes = loadBundledGameData().heroes;

// ── snapshot / request fixtures ──────────────────────────────────────────────
const entity = (id: string, hp: number, hpMax: number, alive = true): EntityView => ({
  id,
  name: id,
  hp,
  hpMax,
  alive,
});

function snapshot(over: Partial<SituationSnapshot> = {}): SituationSnapshot {
  return {
    turn: 4,
    self: { ...entity('garrett', 10, 10), gaugeTier: 0 },
    allies: [entity('fiona', 10, 10)],
    enemies: [entity('golem', 10, 10)],
    availableActions: [
      { id: 'strike', label: '공격', needsTarget: true },
      { id: 'defend', label: '방어', needsTarget: false },
    ],
    corrupted: false,
    ...over,
  };
}

/** A snapshot that buckets as `ally_hurt` (fiona below the hurt ratio). */
const allyHurtSnapshot = (): SituationSnapshot => snapshot({ allies: [entity('fiona', 2, 10)] });

function req(unitId: string, over: Partial<DecideRequest> = {}): DecideRequest {
  return { unitId, equippedCardIds: [], snapshot: allyHurtSnapshot(), ...over };
}

const decision = (action: string, because: string[]): AgentDecision => ({
  action,
  say: `${action} 한다.`,
  because,
});

const CARD_ID = 'mirror_shield';
const CARD_HIT = decision('reflect', ['garrett.default']);
const BUCKET_HIT = decision('protect', ['garrett.default']);

/** Every hero except mordecai is authored, so mordecai is the built-in miss row. */
function pool(): DecisionPool {
  return {
    decisions: {
      garrett: {
        ally_hurt: { [CARD_ID]: CARD_HIT, [DEFAULT_KEY]: BUCKET_HIT },
        default: { [DEFAULT_KEY]: decision('defend', ['garrett.default']) },
      },
      fiona: { default: { [DEFAULT_KEY]: decision('heal', ['fiona.default']) } },
      selene: { default: { [DEFAULT_KEY]: decision('distract', ['selene.default']) } },
    },
    stances: {
      garrett: {
        ration_split: { [DEFAULT_KEY]: decision('opt_a', ['garrett.default']) },
        default: { [DEFAULT_KEY]: decision('opt_c', ['garrett.default']) },
      },
    },
  };
}

// ── injectable sleeps ────────────────────────────────────────────────────────
interface Wait {
  ms: number;
  kind: SleepKind;
}

/** Records every wait and resolves on the next microtask. */
function immediateSleep(): { sleep: Sleep; waits: Wait[]; cancels: number } {
  const state = {
    waits: [] as Wait[],
    cancels: 0,
    sleep: ((ms: number, kind: SleepKind) => {
      state.waits.push({ ms, kind });
      return {
        done: Promise.resolve(),
        cancel: () => {
          state.cancels += 1;
        },
      };
    }) as Sleep,
  };
  return state;
}

/** Records every wait and holds it open until the test releases it. */
function gatedSleep() {
  const pending: Array<Wait & { release: () => void }> = [];
  const inFlight: Record<string, number> = { latency: 0, timeout: 0 };
  const highWater: Record<string, number> = { latency: 0, timeout: 0 };
  let cancels = 0;

  const sleep: Sleep = (ms: number, kind: SleepKind) => {
    inFlight[kind] += 1;
    highWater[kind] = Math.max(highWater[kind], inFlight[kind]);
    let settle!: () => void;
    const done = new Promise<void>((r) => {
      settle = () => {
        inFlight[kind] -= 1;
        r();
      };
    });
    pending.push({ ms, kind, release: settle });
    return {
      done,
      cancel: () => {
        cancels += 1;
      },
    };
  };

  return {
    sleep,
    pending,
    highWater,
    cancelCount: () => cancels,
    releaseAll: () => {
      for (const p of pending.splice(0)) p.release();
    },
  };
}

/** Drains the microtask queue so every in-flight `decide` reaches its sleep. */
const flush = (): Promise<void> => new Promise((r) => setImmediate(r));

// ═══════════════ AC3a — the only timeout timer lives in stub.ts ═════════════

describe('AC3a — no setTimeout in game logic: src/ai/stub.ts owns the timeout timer', () => {
  const TIMER_OWNER = 'src/ai/stub.ts';

  // Comments AND string literals are scrubbed: a doc line or an error message
  // naming setTimeout must not count as a scheduled timer.
  const scrub = (s: string): string =>
    s
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, '``');

  // Inlined walker, per the repo's guard convention: no shared helper whose
  // single edit could disarm this gate and the INV-6 gate at once.
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

  const rel = (f: string): string => relative(root, f).split('\\').join('/');
  const srcFiles = walk(join(root, 'src'));

  it('found source files to scan (the guard is not vacuously green)', () => {
    expect(srcFiles.length, 'nothing was scanned under src/').toBeGreaterThan(0);
  });

  it(`${TIMER_OWNER} exists and is the declared owner`, () => {
    expect(srcFiles.map(rel)).toContain(TIMER_OWNER);
  });

  it('setTimeout appears in stub.ts and nowhere else under src/**', () => {
    const offenders = srcFiles
      .filter((f) => rel(f) !== TIMER_OWNER)
      .filter((f) => /\bsetTimeout\b/.test(scrub(readFileSync(f, 'utf8'))))
      .map(rel);
    expect(offenders, `setTimeout outside ${TIMER_OWNER}: ${offenders.join(', ')}`).toEqual([]);
  });

  it('stub.ts really schedules the wait (the owner is not an empty claim)', () => {
    const owner = srcFiles.find((f) => rel(f) === TIMER_OWNER);
    expect(owner, `${TIMER_OWNER} is missing`).toBeDefined();
    expect(scrub(readFileSync(owner as string, 'utf8'))).toMatch(/\bsetTimeout\b/);
  });

  it('bucket.ts and boot.ts schedule nothing at all', () => {
    for (const name of ['src/ai/bucket.ts', 'src/ai/boot.ts']) {
      const file = srcFiles.find((f) => rel(f) === name);
      expect(file, `${name} is missing`).toBeDefined();
      const code = scrub(readFileSync(file as string, 'utf8'));
      expect(code, `${name} schedules a timer`).not.toMatch(/\b(setTimeout|setInterval)\b/);
    }
  });
});

// ══════════════════ AC3e — every wait is adapter config ═════════════════════

describe('AC3e — simulated latency is adapter config, never inlined', () => {
  it('latency 0 schedules nothing: the injected sleep is never invoked', async () => {
    const timer = immediateSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    const answer = await adapter.decide(req('garrett', { equippedCardIds: [CARD_ID] }));
    expect(timer.waits, 'a wait was scheduled at latency 0').toEqual([]);
    expect(answer).toEqual(CARD_HIT);
  });

  it('works with no injected sleep at all when latency is 0 (default timer untouched)', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    await expect(adapter.decide(req('garrett'))).resolves.toEqual(BUCKET_HIT);
  });

  it('a scripted latency array is consumed in call order and then cycles', async () => {
    const timer = immediateSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT,
      timeoutMs: Math.max(...SCRIPT) * 10,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    for (let i = 0; i < SCRIPT.length + 1; i += 1) {
      await adapter.decide(req('garrett'));
    }
    const latencyWaits = timer.waits.filter((w) => w.kind === 'latency').map((w) => w.ms);
    expect(latencyWaits).toEqual([...SCRIPT, SCRIPT[0]]);
  });

  it('a scalar latency is used for every call', async () => {
    const timer = immediateSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: SCRIPT[0] * 10,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    await adapter.decide(req('garrett'));
    await adapter.decide(req('fiona'));
    expect(timer.waits.filter((w) => w.kind === 'latency').map((w) => w.ms)).toEqual([
      SCRIPT[0],
      SCRIPT[0],
    ]);
  });

  it('the latency wait is labelled so a test can hang one side of the race', async () => {
    const timer = immediateSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: SCRIPT[0] * 10,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    await adapter.decide(req('garrett'));
    expect(timer.waits.some((w) => w.kind === 'latency')).toBe(true);
  });
});

// ═════════════════ keying: the adapter answers from the pool ════════════════

describe('the stub adapter answers out of the injected pool', () => {
  const build = (): AIAdapter =>
    createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });

  it("reports mode 'stub'", () => {
    expect(build().mode).toBe('stub');
  });

  it('computes the bucket from the request snapshot and keys on it', async () => {
    const adapter = build();
    await expect(adapter.decide(req('garrett'))).resolves.toEqual(BUCKET_HIT);
    // A calm snapshot buckets as `default` → the unit default entry answers.
    await expect(adapter.decide(req('garrett', { snapshot: snapshot() }))).resolves.toEqual(
      decision('defend', ['garrett.default']),
    );
  });

  it('prefers the equipped-card entry over the bucket entry', async () => {
    await expect(
      build().decide(req('garrett', { equippedCardIds: [CARD_ID] })),
    ).resolves.toEqual(CARD_HIT);
  });

  it('resolves null on a total miss — never throws', async () => {
    await expect(build().decide(req('mordecai'))).resolves.toBeNull();
  });

  it('every non-null answer satisfies the shared validator', async () => {
    const answer = await build().decide(req('garrett'));
    expect(isAgentDecision(answer)).toBe(true);
  });

  it('answers a council stance through the same cascade', async () => {
    const stanceReq: StanceRequest = {
      unitId: 'garrett',
      equippedCardIds: [],
      agendaId: 'ration_split',
      options: [
        { id: 'opt_a', label: '나눈다' },
        { id: 'opt_c', label: '기권' },
      ],
    };
    await expect(build().stance(stanceReq)).resolves.toEqual(
      decision('opt_a', ['garrett.default']),
    );
  });

  it('resolves null for a stance it cannot key', async () => {
    const stanceReq: StanceRequest = {
      unitId: 'fiona',
      equippedCardIds: [],
      agendaId: 'ration_split',
      options: [{ id: 'opt_a', label: '나눈다' }],
    };
    await expect(build().stance(stanceReq)).resolves.toBeNull();
  });
});

// ═════ AC3c/AC3d — the decision timeout degrades to the class default ═══════

describe('AC3c — a blown decision timeout resolves null instead of hanging', () => {
  /** Latency never lands; the budget does. */
  const budgetWins: Sleep = (_ms: number, kind: SleepKind) => ({
    done: kind === 'timeout' ? Promise.resolve() : new Promise<void>(() => {}),
    cancel: () => {},
  });

  const stalled = (): AIAdapter =>
    createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
      sleep: budgetWins,
    });

  it('decide resolves null when the budget expires first (it does not reject)', async () => {
    await expect(stalled().decide(req('garrett'))).resolves.toBeNull();
  });

  it('stance resolves null on the same expired timeout', async () => {
    const stanceReq: StanceRequest = {
      unitId: 'garrett',
      equippedCardIds: [],
      agendaId: 'ration_split',
      options: [{ id: 'opt_a', label: '나눈다' }],
    };
    await expect(stalled().stance(stanceReq)).resolves.toBeNull();
  });

  it('cancels the losing latency handle so no timer outlives the timeout', async () => {
    const timer = gatedSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    const inFlight = adapter.decide(req('garrett'));
    await flush();
    // Release only the budget: the timeout wins the race.
    for (const p of timer.pending.filter((w) => w.kind === 'timeout')) p.release();
    await expect(inFlight).resolves.toBeNull();
    expect(timer.cancelCount(), 'the losing sleep handle was not cancelled').toBeGreaterThan(0);
  });

  it('the budget passed to the sleep is the configured timeoutMs', async () => {
    const timer = gatedSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    const inFlight = adapter.decide(req('garrett'));
    await flush();
    expect(timer.pending.filter((w) => w.kind === 'timeout').map((w) => w.ms)).toEqual([BUDGET_MS]);
    timer.releaseAll();
    await inFlight;
  });
});

describe('AC3c — the timeout fallback is that unit\'s class default action with a "…" bubble', () => {
  const budgetWins: Sleep = (_ms: number, kind: SleepKind) => ({
    done: kind === 'timeout' ? Promise.resolve() : new Promise<void>(() => {}),
    cancel: () => {},
  });

  const stalled = (): AIAdapter =>
    createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
      sleep: budgetWins,
    });

  it("exports '…' as the fallback line", () => {
    expect(ELLIPSIS_SAY).toBe('…');
  });

  const rows: ReadonlyArray<[string, string]> = [
    ['garrett', 'defend'],
    ['fiona', 'wait'],
    ['selene', 'evade'],
    ['mordecai', 'analyze'],
  ];

  for (const [unitId, action] of rows) {
    it(`${unitId} degrades to '${action}' after the timeout, citing its default prompt`, async () => {
      const fallbackFor = createFallbackDecider(heroes);
      const answer = await decideOrDefault(stalled(), req(unitId), fallbackFor);
      expect(answer).toEqual({ action, say: ELLIPSIS_SAY, because: [`${unitId}.default`] });
    });
  }

  it('the fallback still passes the shared validator (INV-3: attributable)', () => {
    const fallbackFor = createFallbackDecider(heroes);
    for (const [unitId] of rows) {
      expect(isAgentDecision(fallbackFor(unitId), { sheetIds: [`${unitId}.default`] })).toBe(true);
    }
  });

  it('decideOrDefault never returns null, even on a total pool miss at latency 0', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    const answer = await decideOrDefault(adapter, req('mordecai'), createFallbackDecider(heroes));
    expect(answer).toEqual({ action: 'analyze', say: ELLIPSIS_SAY, because: ['mordecai.default'] });
  });

  it('decideOrDefault keeps a real answer untouched when the pool hits', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    const answer = await decideOrDefault(adapter, req('garrett'), createFallbackDecider(heroes));
    expect(answer).toEqual(BUCKET_HIT);
  });

  it('an unknown unit id is a data bug, not a silent fallback — the decider throws', () => {
    expect(() => createFallbackDecider(heroes)('nobody')).toThrow();
  });
});

describe('AC3d — the timeout degradation is silent: no error text anywhere', () => {
  const budgetWins: Sleep = (_ms: number, kind: SleepKind) => ({
    done: kind === 'timeout' ? Promise.resolve() : new Promise<void>(() => {}),
    cancel: () => {},
  });

  let spies: Array<ReturnType<typeof vi.spyOn>>;

  beforeEach(() => {
    spies = (['error', 'warn', 'log', 'info', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('the whole timeout path records zero console calls', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
      sleep: budgetWins,
    });
    await decideOrDefault(adapter, req('garrett'), createFallbackDecider(heroes));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('a pool miss at latency 0 also records zero console calls', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    await decideOrDefault(adapter, req('mordecai'), createFallbackDecider(heroes));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('the visible line after a timeout is exactly "…" — no error substring', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
      sleep: budgetWins,
    });
    const answer = await decideOrDefault(adapter, req('fiona'), createFallbackDecider(heroes));
    expect(answer.say).toBe('…');
    expect(answer.say).not.toMatch(/error|fail|timeout|오류|실패|에러/i);
    expect(answer.because.join(' ')).not.toMatch(/error|fail|timeout|오류|실패|에러/i);
  });
});

// ═══════════ AC5 — per-unit calls run in parallel, degrade per call ══════════

describe('AC5a — per-unit calls run in parallel: one wall-clock wait per turn', () => {
  const UNITS = ['garrett', 'fiona', 'selene', 'mordecai'];

  it('all four latency waits are in flight at once (high-water mark === 4)', async () => {
    const timer = gatedSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: SCRIPT[0] * 100,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    const inFlight = decideAll(
      adapter,
      UNITS.map((u) => req(u)),
      createFallbackDecider(heroes),
    );
    await flush();
    expect(timer.highWater.latency, 'calls were issued sequentially, not in parallel').toBe(
      UNITS.length,
    );
    timer.releaseAll();
    await inFlight;
  });

  it('the turn costs one latency window, not four (parallel, not serial)', async () => {
    const timer = gatedSleep();
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: SCRIPT[0],
      timeoutMs: SCRIPT[0] * 100,
      bucketConfig: CFG,
      sleep: timer.sleep,
    });
    const inFlight = decideAll(
      adapter,
      UNITS.map((u) => req(u)),
      createFallbackDecider(heroes),
    );
    await flush();
    const latency = timer.pending.filter((w) => w.kind === 'latency');
    expect(latency).toHaveLength(UNITS.length);
    // Overlapping waits ⇒ wall clock is the max, while a serial impl would pay the sum.
    expect(Math.max(...latency.map((w) => w.ms))).toBe(SCRIPT[0]);
    expect(timer.highWater.latency).toBe(UNITS.length);
    timer.releaseAll();
    await inFlight;
  });

  it('answers come back aligned to the request order', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    const answers = await decideAll(
      adapter,
      UNITS.map((u) => req(u)),
      createFallbackDecider(heroes),
    );
    expect(answers).toHaveLength(UNITS.length);
    expect(answers[0]).toEqual(BUCKET_HIT);
    expect(answers[3]).toEqual({
      action: 'analyze',
      say: ELLIPSIS_SAY,
      because: ['mordecai.default'],
    });
  });
});

describe('AC5b — a parallel batch degrades one call only', () => {
  const UNITS = ['garrett', 'fiona', 'selene', 'mordecai'];

  it('the missing unit gets its class default; the other three keep pool decisions', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    const answers = await decideAll(
      adapter,
      UNITS.map((u) => req(u)),
      createFallbackDecider(heroes),
    );
    expect(answers[0]).toEqual(BUCKET_HIT);
    expect(answers[1]).toEqual(decision('heal', ['fiona.default']));
    expect(answers[2]).toEqual(decision('distract', ['selene.default']));
    expect(answers[3].say).toBe(ELLIPSIS_SAY);
    expect(answers[3].action).toBe('analyze');
  });

  it('a rejected call is absorbed at that index only', async () => {
    const inner = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    const flaky: AIAdapter = {
      mode: inner.mode,
      decide: (r, c) =>
        r.unitId === 'selene' ? Promise.reject(new Error('boom')) : inner.decide(r, c),
      stance: (r, c) => inner.stance(r, c),
    };
    const answers = await decideAll(
      flaky,
      UNITS.map((u) => req(u)),
      createFallbackDecider(heroes),
    );
    expect(answers[2]).toEqual({ action: 'evade', say: ELLIPSIS_SAY, because: ['selene.default'] });
    expect(answers[0]).toEqual(BUCKET_HIT);
    expect(answers[1]).toEqual(decision('heal', ['fiona.default']));
  });

  it('a rejected call never escapes the batch as a rejection', async () => {
    const boom: AIAdapter = {
      mode: 'stub',
      decide: () => Promise.reject(new Error('boom')),
      stance: () => Promise.reject(new Error('boom')),
    };
    await expect(
      decideAll(
        boom,
        UNITS.map((u) => req(u)),
        createFallbackDecider(heroes),
      ),
    ).resolves.toHaveLength(UNITS.length);
  });

  it('an empty batch resolves to an empty array', async () => {
    const adapter = createStubAdapter({
      pool: pool(),
      latencyMs: NO_LATENCY,
      timeoutMs: BUDGET_MS,
      bucketConfig: CFG,
    });
    await expect(decideAll(adapter, [], createFallbackDecider(heroes))).resolves.toEqual([]);
  });
});
