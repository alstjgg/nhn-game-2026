// u6 — boot: one decision picks the adapter mode AND the tie-break policy (TDD-Red).
// Covers AC4a (probe ok ⇒ live+random, every failure mode ⇒ stub+index, silently) ·
// AC4b (an automated gate makes no network call at all) · AC4c (the two modes are
// indistinguishable to a caller and share one validator) · AC4d (the probe budget
// comes from loaded tuning, never a literal) · AC4e (seed reproducibility).
//
// PRD §2.2: "Boot: probe /ai/health (800ms timeout) → live if ok, else stub."
// PRD §5 + INV-6: automated gates run stub mode with adapter latency 0 and
// tieBreak policy `index`; the seeded `random` policy is the live default.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isAgentDecision } from '../../src/ai/contract.ts';
import type { AgentDecision, AIHealth, DecideRequest, ValidationCtx } from '../../src/ai/contract.ts';
import { DEFAULT_KEY } from '../../src/ai/bucket.ts';
import { bucketConfigOf } from '../../src/ai/bucket.ts';
import type { BucketConfig, DecisionPool } from '../../src/ai/bucket.ts';
import { bootAdapter } from '../../src/ai/boot.ts';
import { tieBreak } from '../../src/core/tiebreak.ts';
import type { TieCandidate } from '../../src/core/tiebreak.ts';
import { loadBundledGameData, resolveTuningRef } from '../../src/data/loader.ts';

const { tuning, heroes } = loadBundledGameData();

const CFG: BucketConfig = bucketConfigOf(tuning);
const SEED = 0xc0ffee;
const OTHER_SEED = 0x0badf00d;
const GATE_BUDGET_MS = 300; // a gate boot must not pay the 900ms stub latency

const STUB_ANSWER: AgentDecision = {
  action: 'defend',
  say: '앞을 막는다.',
  because: ['garrett.default'],
};
const LIVE_ANSWER: AgentDecision = {
  action: 'strike',
  target: 'golem',
  say: '먼저 친다.',
  because: ['garrett.default'],
};
const SHARED_CTX: ValidationCtx = { sheetIds: ['garrett.default'], actionIds: ['defend', 'strike'] };

const HEALTH_OK: AIHealth = {
  ok: true,
  decide: true,
  stance: true,
  models: { decide: 'm', stance: 'm' },
};

function pool(): DecisionPool {
  return { decisions: { garrett: { default: { [DEFAULT_KEY]: STUB_ANSWER } } } };
}

function req(): DecideRequest {
  return {
    unitId: 'garrett',
    equippedCardIds: [],
    snapshot: {
      turn: 4,
      self: { id: 'garrett', name: 'garrett', hp: 10, hpMax: 10, alive: true, gaugeTier: 0 },
      allies: [{ id: 'fiona', name: 'fiona', hp: 10, hpMax: 10, alive: true }],
      enemies: [{ id: 'golem', name: 'golem', hp: 10, hpMax: 10, alive: true }],
      availableActions: [{ id: 'defend', label: '방어', needsTarget: false }],
      corrupted: false,
    },
  };
}

const baseOptions = () => ({ tuning, pool: pool(), bucketConfig: CFG, heroes });

/** Own + inherited function-valued members, so a class impl compares like a literal. */
function methodNames(o: object): string[] {
  const names = new Set<string>();
  for (let cur: object | null = o; cur && cur !== Object.prototype; cur = Object.getPrototypeOf(cur)) {
    for (const key of Object.getOwnPropertyNames(cur)) {
      if (key === 'constructor') continue;
      const d = Object.getOwnPropertyDescriptor(cur, key);
      if (d && typeof d.value === 'function') names.add(key);
    }
  }
  return [...names].sort();
}

// ══════════════════ AC4a — the probe decides mode and policy ═════════════════

describe('AC4a — a healthy probe boots live with the seeded random policy', () => {
  it("returns mode 'live' and the live tie-break policy from tuning", async () => {
    const state = await bootAdapter({ ...baseOptions(), probe: async () => HEALTH_OK });
    expect(state.mode).toBe('live');
    expect(state.adapter.mode).toBe('live');
    expect(state.tieBreak.policy).toBe(tuning.tieBreak.live);
    expect(state.tieBreak.policy).toBe('random');
  });

  it("carries a seeded rng, because the 'random' policy needs one", async () => {
    const state = await bootAdapter({ ...baseOptions(), probe: async () => HEALTH_OK });
    expect(state.tieBreak.rng).toBeDefined();
    expect(typeof state.tieBreak.rng?.seed).toBe('number');
  });

  it('builds the live adapter on the live timeout from tuning', async () => {
    const createLive = vi.fn((_cfg: { timeoutMs: number }) => ({
      mode: 'live' as const,
      decide: async () => LIVE_ANSWER,
      stance: async () => LIVE_ANSWER,
    }));
    await bootAdapter({ ...baseOptions(), probe: async () => HEALTH_OK, createLive });
    expect(createLive).toHaveBeenCalledTimes(1);
    expect(createLive.mock.calls[0][0]).toEqual({ timeoutMs: tuning.timeout.live });
    expect(createLive.mock.calls[0][0].timeoutMs).toBe(resolveTuningRef(tuning, 'timeout.live'));
  });
});

describe('AC4a — every probe failure mode falls back to stub, silently', () => {
  let spies: Array<ReturnType<typeof vi.spyOn>>;

  beforeEach(() => {
    spies = (['error', 'warn', 'log', 'info', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const rows: ReadonlyArray<[string, () => Promise<AIHealth | null>]> = [
    ['the probe resolves null', async () => null],
    [
      'the probe rejects',
      async () => {
        throw new Error('ECONNREFUSED');
      },
    ],
  ];

  for (const [label, probe] of rows) {
    it(`${label} ⇒ stub mode with the index policy`, async () => {
      const state = await bootAdapter({ ...baseOptions(), probe });
      expect(state.mode).toBe('stub');
      expect(state.adapter.mode).toBe('stub');
      expect(state.tieBreak.policy).toBe(tuning.tieBreak.stub);
      expect(state.tieBreak.policy).toBe('index');
    });

    it(`${label} ⇒ no console output at all`, async () => {
      await bootAdapter({ ...baseOptions(), probe });
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    });
  }

  it('stub mode draws no entropy: no rng on the ctx, no seed invented', async () => {
    const random = vi.spyOn(Math, 'random');
    const state = await bootAdapter({ ...baseOptions(), probe: async () => null });
    expect(state.tieBreak.rng).toBeUndefined();
    expect(state.seed).toBeUndefined();
    expect(random).not.toHaveBeenCalled();
  });

  it('a caller-supplied seed is still echoed back for run state in stub mode', async () => {
    const state = await bootAdapter({ ...baseOptions(), probe: async () => null, seed: SEED });
    expect(state.seed).toBe(SEED);
    expect(state.tieBreak.policy).toBe('index');
  });
});

describe('AC4a — the real fetch probe drives the same decision', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const stubFetch = (impl: () => unknown): void => {
    fetchMock = vi.fn(impl);
    vi.stubGlobal('fetch', fetchMock);
  };

  it('a 200 /ai/health with ok:true boots live', async () => {
    stubFetch(async () => ({ ok: true, status: 200, json: async () => HEALTH_OK }));
    const state = await bootAdapter(baseOptions());
    expect(fetchMock).toHaveBeenCalled();
    expect(String(fetchMock.mock.calls[0][0])).toContain('/ai/health');
    expect(state.mode).toBe('live');
  });

  it('a 500 response boots stub', async () => {
    stubFetch(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    expect((await bootAdapter(baseOptions())).mode).toBe('stub');
  });

  it('a 200 response carrying ok:false boots stub', async () => {
    stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ ...HEALTH_OK, ok: false }) }));
    expect((await bootAdapter(baseOptions())).mode).toBe('stub');
  });

  it('an aborted (timed-out) probe boots stub', async () => {
    stubFetch(async () => {
      throw new DOMException('The operation was aborted.', 'TimeoutError');
    });
    expect((await bootAdapter(baseOptions())).mode).toBe('stub');
  });
});

// ═══════════════ AC4b — automated gates never touch the network ══════════════

describe('AC4b — an automated gate short-circuits the probe entirely', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => HEALTH_OK }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('makes zero fetch calls', async () => {
    await bootAdapter({ ...baseOptions(), automatedGate: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never invokes the injected probe port either', async () => {
    const probe = vi.fn(async () => HEALTH_OK);
    await bootAdapter({ ...baseOptions(), automatedGate: true, probe });
    expect(probe).not.toHaveBeenCalled();
  });

  it("boots stub with the gate policy from tuning.tieBreak.test", async () => {
    const state = await bootAdapter({ ...baseOptions(), automatedGate: true });
    expect(state.mode).toBe('stub');
    expect(state.tieBreak.policy).toBe(tuning.tieBreak.test);
    expect(state.tieBreak.policy).toBe('index');
    expect(state.tieBreak.rng).toBeUndefined();
  });

  it('runs at the unit-test latency, not the 900ms stub latency', async () => {
    const state = await bootAdapter({ ...baseOptions(), automatedGate: true });
    const started = Date.now();
    await state.adapter.decide(req());
    expect(Date.now() - started).toBeLessThan(GATE_BUDGET_MS);
  });

  it('the gate adapter still answers out of the pool', async () => {
    const state = await bootAdapter({ ...baseOptions(), automatedGate: true });
    await expect(state.adapter.decide(req())).resolves.toEqual(STUB_ANSWER);
  });
});

// ══════════ AC4c — no caller can tell the two modes apart ═══════════════════

describe('AC4c — both boots return the same adapter surface', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('the live and stub adapters expose an identical method set', async () => {
    const live = await bootAdapter({ ...baseOptions(), probe: async () => HEALTH_OK });
    const stub = await bootAdapter({ ...baseOptions(), automatedGate: true });
    expect(methodNames(live.adapter)).toEqual(methodNames(stub.adapter));
    expect(methodNames(stub.adapter)).toEqual(['decide', 'stance']);
  });

  it("both report a mode string, and it is the ONLY field that differs", async () => {
    const live = await bootAdapter({ ...baseOptions(), probe: async () => HEALTH_OK });
    const stub = await bootAdapter({ ...baseOptions(), automatedGate: true });
    expect(live.adapter.mode).toBe('live');
    expect(stub.adapter.mode).toBe('stub');
    expect(Object.keys(live.adapter).sort()).toEqual(Object.keys(stub.adapter).sort());
  });

  it('a live-shaped answer and a stub answer pass the same validator with the same ctx', async () => {
    const stub = await bootAdapter({ ...baseOptions(), automatedGate: true });
    const stubAnswer = await stub.adapter.decide(req());
    expect(isAgentDecision(stubAnswer, SHARED_CTX)).toBe(true);
    expect(isAgentDecision(LIVE_ANSWER, SHARED_CTX)).toBe(true);
  });

  it('every boot returns a usable tie-break context', async () => {
    const candidates: TieCandidate<string>[] = [
      { value: 'a', index: 0 },
      { value: 'b', index: 1 },
    ];
    for (const state of [
      await bootAdapter({ ...baseOptions(), automatedGate: true }),
      await bootAdapter({ ...baseOptions(), probe: async () => HEALTH_OK, seed: SEED }),
    ]) {
      expect(() => tieBreak(candidates, state.tieBreak)).not.toThrow();
      expect(candidates.map((c) => c.value)).toContain(tieBreak(candidates, state.tieBreak));
    }
  });
});

// ═══════════ AC4d — the probe budget is read from loaded tuning ══════════════

describe('AC4d — the probe budget comes from data/tuning.json', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("calls the probe with resolveTuningRef(tuning, 'timeout.healthProbe')", async () => {
    const probe = vi.fn(async () => null);
    await bootAdapter({ ...baseOptions(), probe });
    expect(probe).toHaveBeenCalledTimes(1);
    expect(probe).toHaveBeenCalledWith(resolveTuningRef(tuning, 'timeout.healthProbe'));
  });

  it('the budget tracks the loaded file, not a copy of the number', async () => {
    const probe = vi.fn(async () => null);
    const patched = { ...tuning, timeout: { ...tuning.timeout, healthProbe: 1234 } };
    await bootAdapter({ ...baseOptions(), tuning: patched, probe });
    expect(probe).toHaveBeenCalledWith(1234);
  });
});

// ═════════════════════ AC4e — seeded reproducibility ════════════════════════

describe('AC4e — a supplied seed makes the live policy reproducible', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const bootLive = (seed?: number) =>
    bootAdapter({ ...baseOptions(), probe: async () => HEALTH_OK, ...(seed === undefined ? {} : { seed }) });

  it('echoes the supplied seed back in run state', async () => {
    const state = await bootLive(SEED);
    expect(state.seed).toBe(SEED);
    expect(state.tieBreak.rng?.seed).toBe(SEED);
  });

  it('two boots on the same seed draw the identical stream', async () => {
    const a = await bootLive(SEED);
    const b = await bootLive(SEED);
    const draw = (s: typeof a): number[] =>
      Array.from({ length: 8 }, () => s.tieBreak.rng?.next() ?? Number.NaN);
    expect(draw(a)).toEqual(draw(b));
  });

  it('two boots on the same seed resolve a tie the same way; a different seed may not', async () => {
    const candidates: TieCandidate<number>[] = Array.from({ length: 6 }, (_, i) => ({
      value: i,
      index: i,
    }));
    const picks = async (seed: number): Promise<number[]> => {
      const state = await bootLive(seed);
      return Array.from({ length: 12 }, () => tieBreak(candidates, state.tieBreak));
    };
    const first = await picks(SEED);
    expect(await picks(SEED)).toEqual(first);
    expect(await picks(OTHER_SEED)).not.toEqual(first);
  });

  it('omitting the seed in live mode still produces one, recorded in run state', async () => {
    const state = await bootLive();
    expect(typeof state.seed).toBe('number');
    expect(Number.isInteger(state.seed)).toBe(true);
    expect(state.tieBreak.rng?.seed).toBe(state.seed);
  });
});
