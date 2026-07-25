// u1 RED — createStubAdapter + pure selectors (spec AC1–AC13).
//
// Contract under test (design §3.3, src/ai/stub.ts):
//   createStubAdapter(config?): AIAdapter          — mode 'stub', never rejects
//   loadStubDialogue(input): StubDialogueData      — throws on bad data
//   selectScript / beatIndexFor / resolveBeat / stableHash / pickPortraitUrl
//
// vitest environment is 'node' (vitest.config.ts) — no DOM here.
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import generation from '../../data/generation.json';
import { isDialogueBeat, portraitSrc } from '../../src/ai/contract';
import type { BeatChoice, DialogueBeat, PatienceTier } from '../../src/ai/contract';
import {
  beatIndexFor,
  createStubAdapter,
  loadStubDialogue,
  pickPortraitUrl,
  resolveBeat,
  selectScript,
  stableHash,
} from '../../src/ai/stub';
import {
  C1_CLUE_IDS,
  C1_PROBLEM,
  C2_PROBLEM,
  UNKNOWN_PROBLEM,
  c1Clues,
  c2Clues,
  dialogueRequest,
  fakeSleep,
  historyOf,
  portraitRequest,
  validBeat,
  validStubRaw,
} from './fixtures';

const VERB_COSTS = generation.verbCosts as Record<string, number>;
const NO_LATENCY = { dialogueMs: 0, portraitMs: 0 };

/** Adapter wired for deterministic unit tests: zero latency, injected scheduler. */
function stub(extra: Record<string, unknown> = {}) {
  return createStubAdapter({ latencyMs: NO_LATENCY, sleep: fakeSleep().sleep, ...extra });
}

// AC12 — the stub path must never touch the network: any call is both counted
// and loud.
const fetchSpy = vi.fn((): never => {
  throw new Error('stub adapter must not call fetch');
});

beforeEach(() => {
  fetchSpy.mockClear();
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ── AC1 — implements AIAdapter ─────────────────────────────────────────────
describe('AC1 createStubAdapter implements AIAdapter', () => {
  it('reports mode "stub"', () => {
    expect(stub().mode).toBe('stub');
  });

  it('exposes dialogue() and portrait() as functions', () => {
    const adapter = stub();
    expect(typeof adapter.dialogue).toBe('function');
    expect(typeof adapter.portrait).toBe('function');
  });

  it('constructs with no config at all (bundled data + default scheduler)', () => {
    expect(() => createStubAdapter()).not.toThrow();
    expect(createStubAdapter().mode).toBe('stub');
  });
});

// ── AC2 — every canned beat validates ──────────────────────────────────────
describe('AC2 canned beats pass isDialogueBeat', () => {
  for (const problem of [C1_PROBLEM, C2_PROBLEM]) {
    it(`validates every beat for "${problem}" across history depths`, async () => {
      const adapter = stub();
      const clues = problem === C1_PROBLEM ? c1Clues() : c2Clues();
      for (let depth = 0; depth <= 6; depth += 1) {
        const beat = await adapter.dialogue(
          dialogueRequest({
            customer: {
              personaTraits: ['지쳐 보이는'],
              problem,
              hiddenCause: '숨은 원인',
            },
            history: historyOf(depth),
            availableClues: clues,
          }),
        );
        expect(isDialogueBeat(beat), `depth ${depth} of ${problem}`).toBe(true);
      }
    });
  }

  it('falls back to the default script for an unknown problem — still valid', async () => {
    const beat = await stub().dialogue(
      dialogueRequest({
        customer: { personaTraits: ['낯선'], problem: UNKNOWN_PROBLEM, hiddenCause: '?' },
        availableClues: [],
      }),
    );
    expect(isDialogueBeat(beat)).toBe(true);
  });

  it('offers exactly one craft card per beat (A1 — the loop always completes)', async () => {
    const beat = await stub().dialogue(dialogueRequest());
    expect(beat.choices.filter((c: BeatChoice) => c.verb === 'craft')).toHaveLength(1);
  });
});

// ── AC3 — beat index advances then clamps ──────────────────────────────────
describe('AC3 beat index is monotonic and clamps (no exhaustion)', () => {
  it('beatIndexFor advances with history and clamps at the last beat', () => {
    expect(beatIndexFor(0, 3)).toBe(0);
    expect(beatIndexFor(1, 3)).toBe(1);
    expect(beatIndexFor(2, 3)).toBe(2);
    expect(beatIndexFor(3, 3)).toBe(2);
    expect(beatIndexFor(99, 3)).toBe(2);
  });

  it('never returns a negative or out-of-range index', () => {
    expect(beatIndexFor(-1, 3)).toBe(0);
    expect(beatIndexFor(0, 1)).toBe(0);
    expect(beatIndexFor(5, 1)).toBe(0);
  });

  it('advances the npcLine as history grows and then holds the terminal beat', async () => {
    const adapter = stub();
    const lines: string[] = [];
    for (let depth = 0; depth <= 8; depth += 1) {
      const beat = await adapter.dialogue(dialogueRequest({ history: historyOf(depth) }));
      lines.push(beat.npcLine);
    }
    // at least one advance happened …
    expect(new Set(lines).size).toBeGreaterThan(1);
    // … and the tail is a stable terminal beat (clamped, never undefined/empty)
    expect(lines[lines.length - 1]).toBe(lines[lines.length - 2]);
    expect(lines.every((l) => typeof l === 'string' && l.length > 0)).toBe(true);
  });
});

// ── AC4 — determinism ──────────────────────────────────────────────────────
describe('AC4 identical requests are deeply equal', () => {
  it('returns deep-equal beats for two identical calls', async () => {
    const adapter = stub();
    const a = await adapter.dialogue(dialogueRequest({ history: historyOf(1) }));
    const b = await adapter.dialogue(dialogueRequest({ history: historyOf(1) }));
    expect(a).toEqual(b);
  });

  it('hands back a fresh object each call (mutation cannot poison the next)', async () => {
    const adapter = stub();
    const first = await adapter.dialogue(dialogueRequest());
    const originalLabel = first.choices[0].label;
    first.choices[0].label = '오염된 라벨';
    first.choices.pop();
    const second = await adapter.dialogue(dialogueRequest());
    expect(second.choices[0].label).toBe(originalLabel);
  });
});

// ── AC5 — patienceCost is derived from generation.json ─────────────────────
describe('AC5 patienceCost comes from generation.json.verbCosts', () => {
  it('stamps every card with the frozen verb cost', async () => {
    const adapter = stub();
    for (const problem of [C1_PROBLEM, C2_PROBLEM, UNKNOWN_PROBLEM]) {
      for (let depth = 0; depth <= 4; depth += 1) {
        const beat = await adapter.dialogue(
          dialogueRequest({
            customer: { personaTraits: ['x'], problem, hiddenCause: 'y' },
            history: historyOf(depth),
            availableClues: [],
          }),
        );
        for (const choice of beat.choices) {
          expect(choice.patienceCost, `${problem} depth ${depth} verb ${choice.verb}`).toBe(
            VERB_COSTS[choice.verb],
          );
        }
      }
    }
  });

  it('does not hardcode patienceCost in the canned data (single tuning source)', () => {
    const raw = readFileSync(new URL('../../data/stub-dialogue.json', import.meta.url), 'utf8');
    expect(raw).not.toContain('patienceCost');
  });
});

// ── AC6 — tier variants ────────────────────────────────────────────────────
describe('AC6 patienceTier picks a distinct tierLines variant', () => {
  it('yields four different npcLines across tiers 0..3 for a tierLines beat', async () => {
    const adapter = stub();
    const seen = new Set<string>();
    for (const tier of [0, 1, 2, 3] as PatienceTier[]) {
      const beat = await adapter.dialogue(dialogueRequest({ patienceTier: tier }));
      seen.add(beat.npcLine);
    }
    expect(seen.size).toBe(4);
  });

  it('resolveBeat falls back to base npcLine when the beat has no tierLines', () => {
    const raw = validStubRaw();
    const scripts = raw.scripts as { problem: string; beats: Record<string, unknown>[] }[];
    scripts[0].beats = [validBeat('티어 없는 비트')]; // no tierLines
    const data = loadStubDialogue(raw);
    for (const tier of [0, 1, 2, 3] as PatienceTier[]) {
      const beat = resolveBeat(data, dialogueRequest({ patienceTier: tier }));
      expect(beat.npcLine).toBe('티어 없는 비트');
    }
  });
});

// ── AC7 — clue filtering ───────────────────────────────────────────────────
describe('AC7 clueReveals stay inside availableClues', () => {
  it('drops ids the request has not made available', async () => {
    const only = [{ id: C1_CLUE_IDS[0], text: '눈 밑 그늘' }];
    const adapter = stub();
    for (let depth = 0; depth <= 3; depth += 1) {
      const beat = await adapter.dialogue(
        dialogueRequest({ history: historyOf(depth), availableClues: only }),
      );
      for (const choice of beat.choices) {
        for (const id of choice.clueReveals ?? []) {
          expect(id).toBe(C1_CLUE_IDS[0]);
        }
      }
    }
  });

  it('leaves an observe card with something to reveal (substitutes availableClues[0])', async () => {
    const only = [{ id: C1_CLUE_IDS[1], text: '차가운 손끝' }];
    const beat = await stub().dialogue(dialogueRequest({ availableClues: only }));
    const observe = beat.choices.find((c: BeatChoice) => c.verb === 'observe');
    expect(observe).toBeDefined();
    expect(observe?.clueReveals).toEqual([C1_CLUE_IDS[1]]);
  });

  it('does not apply the rule when availableClues is empty (canned ids survive)', async () => {
    const beat = await stub().dialogue(dialogueRequest({ availableClues: [] }));
    const revealed = beat.choices.flatMap((c: BeatChoice) => c.clueReveals ?? []);
    expect(revealed.length).toBeGreaterThan(0);
  });
});

// ── AC8 / AC9 / AC10 — latency only via injected scheduler + config ────────
describe('AC8 zero latency creates no real timer', () => {
  it('asks the injected scheduler for 0ms only', async () => {
    const spy = fakeSleep();
    const adapter = createStubAdapter({ latencyMs: NO_LATENCY, sleep: spy.sleep });
    await adapter.dialogue(dialogueRequest());
    await adapter.portrait(portraitRequest());
    expect(spy.calls.every((ms) => ms === 0)).toBe(true);
  });

  it('resolves with the default scheduler under fake timers without scheduling one', async () => {
    vi.useFakeTimers();
    const adapter = createStubAdapter({ latencyMs: NO_LATENCY }); // default sleep
    await adapter.dialogue(dialogueRequest());
    await adapter.portrait(portraitRequest());
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('AC9 configured latency is passed through verbatim', () => {
  it('forwards dialogueMs to the scheduler on dialogue()', async () => {
    const spy = fakeSleep();
    const adapter = createStubAdapter({
      latencyMs: { dialogueMs: 1234, portraitMs: 4321 },
      sleep: spy.sleep,
    });
    await adapter.dialogue(dialogueRequest());
    expect(spy.calls).toEqual([1234]);
  });

  it('forwards portraitMs to the scheduler on portrait()', async () => {
    const spy = fakeSleep();
    const adapter = createStubAdapter({
      latencyMs: { dialogueMs: 1234, portraitMs: 4321 },
      sleep: spy.sleep,
    });
    await adapter.portrait(portraitRequest());
    expect(spy.calls).toEqual([4321]);
  });

  it('defaults to data/stub-dialogue.json latency when config omits it', async () => {
    const spy = fakeSleep();
    const rawJson = JSON.parse(
      readFileSync(new URL('../../data/stub-dialogue.json', import.meta.url), 'utf8'),
    ) as { latency: { dialogueMs: number; portraitMs: number } };
    const adapter = createStubAdapter({ sleep: spy.sleep });
    await adapter.dialogue(dialogueRequest());
    await adapter.portrait(portraitRequest());
    expect(spy.calls).toEqual([rawJson.latency.dialogueMs, rawJson.latency.portraitMs]);
  });
});

describe('AC10 setTimeout lives only in the stub scheduler', () => {
  // Scope note: repo-wide "src/** has zero setTimeout" is NOT achievable in u1 —
  // src/app/index.ts and src/screens/crafting/index.ts already use window.setTimeout
  // and are out of this unit's edit scope (u13). Asserted over src/ai/** instead.
  const AI_DIR = new URL('../../src/ai/', import.meta.url);

  it('no src/ai module other than stub.ts mentions setTimeout', () => {
    const offenders = readdirSync(AI_DIR)
      .filter((f) => f.endsWith('.ts') && f !== 'stub.ts')
      .filter((f) => /\bsetTimeout\s*\(/.test(readFileSync(new URL(f, AI_DIR), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('stub.ts contains exactly one setTimeout call (the default scheduler)', () => {
    const src = readFileSync(new URL('../../src/ai/stub.ts', import.meta.url), 'utf8');
    expect(src.match(/\bsetTimeout\s*\(/g) ?? []).toHaveLength(1);
  });
});

// ── AC11 / AC12 / AC13 — portraits ─────────────────────────────────────────
describe('AC11 portrait() returns a bundled fallback sheet', () => {
  it('returns a PortraitSheet shape with b64, prompt and url', async () => {
    const sheet = await stub().portrait(portraitRequest());
    expect(typeof sheet.b64).toBe('string');
    expect(typeof sheet.prompt).toBe('string');
    expect(sheet.prompt.length).toBeGreaterThan(0);
    expect(typeof sheet.url).toBe('string');
  });

  it('portraitSrc(sheet) points at a bundled fallback-portrait asset', async () => {
    const sheet = await stub().portrait(portraitRequest());
    expect(portraitSrc(sheet)).toMatch(/fallback-portrait-[12]\.png/);
  });

  it('does not inline the PNG as base64 in the source (bundle-size guard NF4)', () => {
    const src = readFileSync(new URL('../../src/ai/stub.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/data:image\/png;base64,[A-Za-z0-9+/]{100}/);
  });
});

describe('AC12 the stub path never hits the network', () => {
  it('makes zero fetch calls across dialogue() and portrait()', async () => {
    const adapter = stub();
    await adapter.dialogue(dialogueRequest());
    await adapter.portrait(portraitRequest());
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('AC13 portrait choice is deterministic', () => {
  it('maps identical traits to an identical url', async () => {
    const adapter = stub();
    const a = await adapter.portrait(portraitRequest(['조용한', '지친']));
    const b = await adapter.portrait(portraitRequest(['조용한', '지친']));
    expect(a.url).toBe(b.url);
    expect(portraitSrc(a)).toBe(portraitSrc(b));
  });

  it('stableHash is pure, non-negative and order-sensitive', () => {
    expect(stableHash('조용한|지친')).toBe(stableHash('조용한|지친'));
    expect(stableHash('조용한|지친')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(stableHash('조용한|지친'))).toBe(true);
    expect(stableHash('a|b')).not.toBe(stableHash('b|a'));
  });

  it('pickPortraitUrl always returns a member of the pool', () => {
    const pool = ['/one.png', '/two.png'];
    for (const traits of [['a'], ['b'], ['c', 'd'], []]) {
      expect(pool).toContain(pickPortraitUrl(traits, pool));
    }
  });

  it('spreads different traits across the pool (not all on one slot)', () => {
    const pool = ['/one.png', '/two.png'];
    const picked = new Set(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((t) => pickPortraitUrl([t], pool)),
    );
    expect(picked.size).toBe(2);
  });

  it('uses no Math.random / Date.now in the stub source', () => {
    const src = readFileSync(new URL('../../src/ai/stub.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/Date\.now/);
  });
});

// ── loadStubDialogue guards (D3 — bad data throws at load, never at runtime) ──
describe('loadStubDialogue validates at load time', () => {
  it('accepts well-formed raw data', () => {
    expect(() => loadStubDialogue(validStubRaw())).not.toThrow();
  });

  it('normalizes patienceCost from verbCosts', () => {
    const data = loadStubDialogue(validStubRaw());
    const beat = resolveBeat(data, dialogueRequest());
    for (const choice of beat.choices) {
      expect(choice.patienceCost).toBe(VERB_COSTS[choice.verb]);
    }
  });

  it('rejects a non-object input', () => {
    expect(() => loadStubDialogue(null)).toThrow(/stub-dialogue/);
    expect(() => loadStubDialogue('nope')).toThrow(/stub-dialogue/);
  });

  it('rejects missing default script', () => {
    const raw = validStubRaw();
    delete raw.default;
    expect(() => loadStubDialogue(raw)).toThrow(/stub-dialogue/);
  });

  it('rejects a beat with fewer than 3 choices', () => {
    const raw = validStubRaw();
    const scripts = raw.scripts as { beats: Record<string, unknown>[] }[];
    const beat = scripts[0].beats[0];
    (beat.choices as unknown[]).splice(2);
    expect(() => loadStubDialogue(raw)).toThrow(/stub-dialogue/);
  });

  it('rejects a verb outside the whitelist', () => {
    const raw = validStubRaw();
    const scripts = raw.scripts as { beats: Record<string, unknown>[] }[];
    (scripts[0].beats[0].choices as { verb: string }[])[0].verb = 'shout';
    expect(() => loadStubDialogue(raw)).toThrow(/stub-dialogue/);
  });

  it('rejects a beat without exactly one craft card (A1)', () => {
    const raw = validStubRaw();
    const scripts = raw.scripts as { beats: Record<string, unknown>[] }[];
    (scripts[0].beats[0].choices as { verb: string }[])[3].verb = 'direct';
    expect(() => loadStubDialogue(raw)).toThrow(/stub-dialogue/);
  });

  it('rejects tierLines that are not exactly 4 entries', () => {
    const raw = validStubRaw();
    const scripts = raw.scripts as { beats: Record<string, unknown>[] }[];
    scripts[0].beats[0].tierLines = ['하나', '둘'];
    expect(() => loadStubDialogue(raw)).toThrow(/stub-dialogue/);
  });

  it('rejects an empty npcLine', () => {
    const raw = validStubRaw();
    const scripts = raw.scripts as { beats: Record<string, unknown>[] }[];
    scripts[0].beats[0].npcLine = '';
    expect(() => loadStubDialogue(raw)).toThrow(/stub-dialogue/);
  });

  it('rejects latency that is not numeric', () => {
    const raw = validStubRaw();
    raw.latency = { dialogueMs: 'soon', portraitMs: 10 };
    expect(() => loadStubDialogue(raw)).toThrow(/stub-dialogue/);
  });

  it('createStubAdapter throws on injected bad data (fails loud at boot, D3)', () => {
    const raw = validStubRaw();
    delete raw.scripts;
    expect(() => createStubAdapter({ data: raw })).toThrow(/stub-dialogue/);
  });
});

// ── selectScript (pure) ────────────────────────────────────────────────────
describe('selectScript matches problem exactly, else default', () => {
  it('picks the exact-match script', () => {
    const data = loadStubDialogue(validStubRaw());
    expect(selectScript(data, C1_PROBLEM).problem).toBe(C1_PROBLEM);
  });

  it('falls back to the default script for anything else', () => {
    const data = loadStubDialogue(validStubRaw());
    expect(selectScript(data, UNKNOWN_PROBLEM).problem).toBe('');
    // exact match only — no trimming / fuzzy matching
    expect(selectScript(data, ` ${C1_PROBLEM}`).problem).toBe('');
  });

  it('ships scripts for both seeded customers in the real data file', () => {
    const data = loadStubDialogue(
      JSON.parse(readFileSync(new URL('../../data/stub-dialogue.json', import.meta.url), 'utf8')),
    );
    expect(selectScript(data, C1_PROBLEM).problem).toBe(C1_PROBLEM);
    expect(selectScript(data, C2_PROBLEM).problem).toBe(C2_PROBLEM);
    for (const script of [
      selectScript(data, C1_PROBLEM),
      selectScript(data, C2_PROBLEM),
      selectScript(data, UNKNOWN_PROBLEM),
    ]) {
      expect(script.beats.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ── F1 — neither method ever rejects (silent degradation, §3-5) ────────────
describe('F1 stub promises never reject', () => {
  it('resolves for a degenerate request (empty traits, empty history, unknown problem)', async () => {
    const adapter = stub();
    const beat: DialogueBeat = await adapter.dialogue(
      dialogueRequest({
        customer: { personaTraits: [], problem: UNKNOWN_PROBLEM, hiddenCause: '' },
        history: [],
        availableClues: [],
      }),
    );
    expect(isDialogueBeat(beat)).toBe(true);
    await expect(stub().portrait(portraitRequest([]))).resolves.toBeDefined();
  });

  it('resolves even when the history is absurdly long', async () => {
    await expect(
      stub().dialogue(dialogueRequest({ history: historyOf(500) })),
    ).resolves.toBeDefined();
  });
});
