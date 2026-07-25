// TDD-Red gate for u10 — the adapter-driven conversation beat source (PRD §1
// must-prove 1·2, §2.1 "one retry then per-beat stub fallback").
//
// Contract sources: .claude/super/units/u10/spec.md (§1.2 S1–S10, §4 AC table)
// and design.md (§2 D1/D2/D7/D8, §4 exported surface).
//
// Layer split is forced by `vitest.config.ts` (`environment: 'node'`, frozen —
// spec N1/A7): everything here is DOM-free logic against the real
// `src/ai/{contract,adapter,stub}.ts` and the real `data/customers.json`. All
// browser behaviour (card counts, data-verb, observe/craft clicks, the bubble
// frame) is proven in `e2e/conversation.spec.ts`.
//
// RED until `src/screens/conversation/beats.ts` exists: the import below fails
// loudly (module not found), which is the honest starting point — AC1a–AC1h
// *call* the source, they never scan for source text (except AC1e, which is a
// prohibition scan by construction).
//
// IMPORTANT (AC1e): the DOM/timer/network blocklist necessarily *contains* the
// forbidden identifiers. The scan therefore reads `beats.ts` from disk and must
// never be rewritten to walk the tests directory.
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { AIUnavailableError, type AIAdapter } from '../../../src/ai/adapter.ts';
import {
  isDialogueBeat,
  type DialogueBeat,
  type DialogueRequest,
  type PatienceTier,
  type PortraitSheet,
} from '../../../src/ai/contract.ts';
import { createStubAdapter } from '../../../src/ai/stub.ts';
import { loadCustomers } from '../../../src/data/loader.ts';
import type { Customer, DialogueNode, ObservationClue } from '../../../src/data/schema.ts';
import customersData from '../../../data/customers.json';
import {
  composeDialogueRequest,
  createBeatSource,
  normalizeClueReveals,
  toBeat,
  type BeatContext,
  type BeatSource,
} from '../../../src/screens/conversation/beats.ts';

// ── Fixtures: the real shipped customers, loaded through the real loader ─────

const CUSTOMERS: Customer[] = loadCustomers(customersData);
const C1: Customer = CUSTOMERS[0];
const clueIds = (c: Customer): string[] => c.observationClues.map((cl) => cl.id);

/** Seeded fallback deck for C1, index-aligned with the beat cursor (S1). */
const seededFor = (c: Customer): DialogueBeat[] => c.dialogueNodes.map((n) => toBeat(n));

// ── Adapter doubles ─────────────────────────────────────────────────────────

type DialogueImpl = (req: DialogueRequest) => Promise<DialogueBeat>;

/** Minimal live-shaped adapter: only `dialogue` matters to the beat source. */
function fakeAdapter(dialogue: DialogueImpl, mode: 'live' | 'stub' = 'live'): AIAdapter {
  return {
    mode,
    dialogue,
    async portrait(): Promise<PortraitSheet> {
      return { b64: '', prompt: 'fake', url: 'fake.png' };
    },
  };
}

/** Records every request the source composes, in call order. */
function recordingAdapter(dialogue: DialogueImpl): {
  adapter: AIAdapter;
  requests: DialogueRequest[];
} {
  const requests: DialogueRequest[] = [];
  const adapter = fakeAdapter(async (req) => {
    requests.push(req);
    return dialogue(req);
  });
  return { adapter, requests };
}

/** A schema-valid beat that only ever uses clue ids native to `c` (S9 identity). */
function liveBeat(n: number, native: string): DialogueBeat {
  return {
    npcLine: `live-line-${n}`,
    choices: [
      { label: `live-indirect-${n}`, verb: 'indirect', patienceCost: 1, clueReveals: [native] },
      { label: `live-direct-${n}`, verb: 'direct', patienceCost: 2 },
      { label: `live-observe-${n}`, verb: 'observe', patienceCost: 0, clueReveals: [native] },
      { label: '[조제하러 가기]', verb: 'craft', patienceCost: 0 },
    ],
  };
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// ── AC1d — toBeat: u6 data → the one renderer-facing type, verb verbatim ────

describe('toBeat (F4/AC1d — one type reaches the renderer)', () => {
  it('maps every node of the real data/customers.json to a valid DialogueBeat', () => {
    for (const customer of CUSTOMERS) {
      for (const node of customer.dialogueNodes) {
        const beat = toBeat(node);
        expect(
          isDialogueBeat(beat),
          `${customer.id} node "${node.npcLine.slice(0, 12)}…" failed isDialogueBeat`,
        ).toBe(true);
      }
    }
  });

  it('carries npcLine, labels, costs and clueReveals through unchanged', () => {
    const node = C1.dialogueNodes[0];
    const beat = toBeat(node);
    expect(beat.npcLine).toBe(node.npcLine);
    expect(beat.choices.map((c) => c.label)).toEqual(node.choices.map((c) => c.label));
    expect(beat.choices.map((c) => c.patienceCost)).toEqual(
      node.choices.map((c) => c.patienceCost),
    );
    expect(beat.choices.map((c) => c.clueReveals)).toEqual(
      node.choices.map((c) => c.clueReveals),
    );
  });

  it('copies verb verbatim — no cost-based inference (S2: cost 0 ≠ observe)', () => {
    // Deliberately verb/cost-contradictory: an expensive `observe` and a free
    // `direct`. An inference shim would rewrite these; S2 forbids one existing.
    const node: DialogueNode = {
      npcLine: 'contradictory node',
      choices: [
        { label: 'paid observation', verb: 'observe', patienceCost: 3 },
        { label: 'free interrogation', verb: 'direct', patienceCost: 0 },
        { label: 'free craft', verb: 'craft', patienceCost: 0 },
        { label: 'paid hint', verb: 'indirect', patienceCost: 1 },
      ],
    };
    expect(toBeat(node).choices.map((c) => c.verb)).toEqual([
      'observe',
      'direct',
      'craft',
      'indirect',
    ]);
  });
});

// ── S4/S10 — beat budget is the seeded deck length, never the script length ──

describe('createBeatSource — beat budget (S4/S10)', () => {
  it('reports total === seeded.length === customer.dialogueNodes.length', () => {
    const seeded = seededFor(C1);
    const source: BeatSource = createBeatSource({ seeded, customer: C1 });
    expect(source.total).toBe(seeded.length);
    expect(source.total).toBe(C1.dialogueNodes.length);
  });

  it('with no adapter yields the seeded beats in cursor order (today’s app path)', async () => {
    const seeded = seededFor(C1);
    const source = createBeatSource({ seeded, customer: C1 });
    const first = await source.next();
    expect(first).toEqual(seeded[0]);
    expect(source.lastMode).toBe('stub');
    const second = await source.next();
    expect(second).toEqual(seeded[1]);
    expect(source.lastMode).toBe('stub');
  });

  it('never rejects when pulled past the last seeded beat', async () => {
    const seeded = seededFor(C1);
    const source = createBeatSource({ seeded, customer: C1 });
    for (let i = 0; i < seeded.length + 2; i += 1) {
      const beat = await source.next();
      expect(isDialogueBeat(beat), `overdraw pull ${i} produced an invalid beat`).toBe(true);
    }
  });
});

// ── AC1a — the adapter drives the beats ─────────────────────────────────────

describe('AC1a — adapter-driven beats', () => {
  it('serves valid beats through the real stub adapter at zero latency', async () => {
    const adapter = createStubAdapter({
      latencyMs: { dialogueMs: 0, portraitMs: 0 },
      sleep: async () => {},
    });
    const source = createBeatSource({ seeded: seededFor(C1), customer: C1, adapter });
    for (let i = 0; i < source.total; i += 1) {
      const beat = await source.next();
      expect(isDialogueBeat(beat), `stub-driven beat ${i} failed isDialogueBeat`).toBe(true);
      expect(beat.npcLine.length).toBeGreaterThan(0);
    }
  });

  it('reports lastMode "live" and the adapter’s content when the adapter answers', async () => {
    const native = clueIds(C1)[0];
    let call = 0;
    const source = createBeatSource({
      seeded: seededFor(C1),
      customer: C1,
      adapter: fakeAdapter(async () => liveBeat(call++, native)),
    });

    const beat = await source.next();
    expect(beat.npcLine).toBe('live-line-0');
    expect(source.lastMode).toBe('live');
    expect(isDialogueBeat(beat)).toBe(true);
  });

  it('sends the injected buildRequest result to the adapter verbatim (S1)', async () => {
    const native = clueIds(C1)[0];
    const built: DialogueRequest = {
      customer: { personaTraits: ['injected'], problem: 'P', hiddenCause: 'H' },
      patienceTier: 3,
      history: [],
      availableClues: [],
    };
    const { adapter, requests } = recordingAdapter(async () => liveBeat(0, native));
    const source = createBeatSource({
      seeded: seededFor(C1),
      customer: C1,
      adapter,
      buildRequest: () => built,
    });

    await source.next();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual(built);
  });

  it('grows history by one beat per pull so the stub script advances (AC7 floor)', async () => {
    const native = clueIds(C1)[0];
    let call = 0;
    const { adapter, requests } = recordingAdapter(async () => liveBeat(call++, native));
    const source = createBeatSource({ seeded: seededFor(C1), customer: C1, adapter });

    await source.next();
    await source.next();
    expect(requests).toHaveLength(2);
    expect(requests[0].history).toHaveLength(0);
    expect(requests[1].history).toHaveLength(1);
  });

  it('uses the injected patienceTier getter and defaults personaTraits to [] (A4b/A5)', async () => {
    const native = clueIds(C1)[0];
    const { adapter, requests } = recordingAdapter(async () => liveBeat(0, native));
    const tier: () => PatienceTier = () => 2;
    const source = createBeatSource({
      seeded: seededFor(C1),
      customer: C1,
      adapter,
      patienceTier: tier,
    });

    await source.next();
    expect(requests[0].patienceTier).toBe(2);
    expect(requests[0].customer.personaTraits).toEqual([]);
    expect(requests[0].customer.problem).toBe(C1.problem);
    expect(requests[0].customer.hiddenCause).toBe(C1.hiddenCause);
  });
});

// ── AC1b — per-beat silent fallback, adapter kept for the NEXT beat ─────────

describe('AC1b — per-beat fallback then back to live', () => {
  it('substitutes seeded beat i on rejection and uses the adapter again for i+1', async () => {
    const seeded = seededFor(C1);
    const native = clueIds(C1)[0];
    let call = 0;
    const { adapter, requests } = recordingAdapter(async () => {
      if (call++ === 0) throw new AIUnavailableError('dialogue 503');
      return liveBeat(1, native);
    });
    const source = createBeatSource({ seeded, customer: C1, adapter });

    const first = await source.next();
    expect(first).toEqual(seeded[0]);
    expect(source.lastMode).toBe('stub');

    const second = await source.next();
    expect(second.npcLine).toBe('live-line-1');
    expect(source.lastMode).toBe('live');

    expect(requests, 'the adapter was abandoned after one failure').toHaveLength(2);
  });

  it('does not retry the failed beat itself (F3 — the single retry is the adapter’s)', async () => {
    const { adapter, requests } = recordingAdapter(async () => {
      throw new AIUnavailableError('always down');
    });
    const source = createBeatSource({ seeded: seededFor(C1), customer: C1, adapter });

    await source.next();
    expect(requests, 'beats.ts re-requested a failed beat').toHaveLength(1);
  });
});

// ── AC1c — schema-invalid live output degrades silently (no console noise) ──

describe('AC1c — invalid live output is silently seeded-substituted', () => {
  const native = clueIds(C1)[0];
  const invalidShapes: Array<[string, unknown]> = [
    ['two choices', { npcLine: 'x', choices: liveBeat(0, native).choices.slice(0, 2) }],
    [
      'five choices',
      { npcLine: 'x', choices: [...liveBeat(0, native).choices, ...liveBeat(1, native).choices.slice(0, 1)] },
    ],
    [
      'unknown verb',
      {
        npcLine: 'x',
        choices: liveBeat(0, native).choices.map((c, i) =>
          i === 0 ? { ...c, verb: 'interrogate' } : c,
        ),
      },
    ],
    [
      'empty label',
      {
        npcLine: 'x',
        choices: liveBeat(0, native).choices.map((c, i) => (i === 0 ? { ...c, label: '' } : c)),
      },
    ],
    ['empty npcLine', { npcLine: '', choices: liveBeat(0, native).choices }],
    ['missing choices', { npcLine: 'x' }],
  ];

  for (const [name, payload] of invalidShapes) {
    it(`falls back to the seeded beat for: ${name}`, async () => {
      const seeded = seededFor(C1);
      const source = createBeatSource({
        seeded,
        customer: C1,
        adapter: fakeAdapter(async () => payload as DialogueBeat),
      });
      const beat = await source.next();
      expect(beat).toEqual(seeded[0]);
      expect(source.lastMode).toBe('stub');
    });
  }

  it('emits no console.error / console.warn while degrading (F2, e2e AC1 floor)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const source = createBeatSource({
        seeded: seededFor(C1),
        customer: C1,
        adapter: fakeAdapter(async () => {
          throw new AIUnavailableError('down');
        }),
      });
      await source.next();
      const invalid = createBeatSource({
        seeded: seededFor(C1),
        customer: C1,
        adapter: fakeAdapter(async () => ({ npcLine: 'x', choices: [] }) as DialogueBeat),
      });
      await invalid.next();

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});

// ── AC1h — the source never rejects, never leaks an unhandled rejection ────

describe('AC1h — createBeatSource never rejects', () => {
  const cases: Array<[string, () => AIAdapter]> = [
    [
      'throws synchronously',
      () =>
        fakeAdapter((() => {
          throw new Error('sync boom');
        }) as unknown as DialogueImpl),
    ],
    [
      'rejects with a plain Error',
      () =>
        fakeAdapter(async () => {
          throw new Error('async boom');
        }),
    ],
    ['resolves undefined', () => fakeAdapter(async () => undefined as unknown as DialogueBeat)],
    ['resolves null', () => fakeAdapter(async () => null as unknown as DialogueBeat)],
    ['resolves a non-object', () => fakeAdapter(async () => 'nope' as unknown as DialogueBeat)],
  ];

  for (const [name, build] of cases) {
    it(`absorbs an adapter that ${name}`, async () => {
      const seeded = seededFor(C1);
      const source = createBeatSource({ seeded, customer: C1, adapter: build() });
      await expect(source.next()).resolves.toEqual(seeded[0]);
      expect(source.lastMode).toBe('stub');
    });
  }

  it('leaves no unhandled rejection behind', async () => {
    const leaks: unknown[] = [];
    const onUnhandled = (reason: unknown): void => {
      leaks.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    try {
      const source = createBeatSource({
        seeded: seededFor(C1),
        customer: C1,
        adapter: fakeAdapter(async () => {
          throw new AIUnavailableError('down');
        }),
      });
      await source.next();
      await source.next();
      await delay(20);
      expect(leaks, `unhandled rejections: ${leaks.length}`).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });
});

// ── AC1g — out-of-order resolution never rewinds the beat cursor (S6) ──────

describe('AC1g — out-of-order guard', () => {
  it('serves cursor-ordered beats when the adapter resolves in reverse order', async () => {
    const native = clueIds(C1)[0];
    let call = 0;
    const source = createBeatSource({
      seeded: seededFor(C1),
      customer: C1,
      // Beat 0's request resolves LAST; beat 1's resolves immediately.
      adapter: fakeAdapter(async () => {
        const n = call++;
        await delay(n === 0 ? 30 : 0);
        return liveBeat(n, native);
      }),
    });

    const [first, second] = await Promise.all([source.next(), source.next()]);
    expect(first.npcLine).toBe('live-line-0');
    expect(second.npcLine).toBe('live-line-1');
    expect(first.npcLine).not.toBe(second.npcLine);
  });

  it('never serves the same cursor twice under concurrent pulls', async () => {
    const native = clueIds(C1)[0];
    let call = 0;
    const source = createBeatSource({
      seeded: seededFor(C1),
      customer: C1,
      adapter: fakeAdapter(async () => {
        const n = call++;
        await delay(20 - n * 10);
        return liveBeat(n, native);
      }),
    });

    const beats = await Promise.all([source.next(), source.next()]);
    expect(new Set(beats.map((b) => b.npcLine)).size).toBe(2);
  });
});

// ── AC1f — S9 clue-id normalization (pure, at the source boundary) ─────────

describe('AC1f — S9 clue normalization', () => {
  const clues: readonly ObservationClue[] = C1.observationClues;
  const seededBeat0 = (): DialogueBeat => seededFor(C1)[0];
  const seededObserveIds = (): string[] => {
    const observe = seededBeat0().choices.find((c) => c.verb === 'observe');
    return observe?.clueReveals ?? [];
  };
  /** A live-shaped beat whose every clue id is foreign to C1's table (u1 vocabulary). */
  const foreignBeat = (): DialogueBeat => ({
    npcLine: 'foreign ids everywhere',
    choices: [
      { label: 'i', verb: 'indirect', patienceCost: 1, clueReveals: ['clue_racing_mind'] },
      { label: 'd', verb: 'direct', patienceCost: 2, clueReveals: ['clue_cold_hands'] },
      { label: 'o', verb: 'observe', patienceCost: 0, clueReveals: ['clue_dark_circles'] },
      { label: 'c', verb: 'craft', patienceCost: 0, clueReveals: ['clue_racing_mind'] },
    ],
  });

  it('(a) an all-foreign observe card resolves to the seeded beat’s own observe clue', () => {
    const out = normalizeClueReveals(foreignBeat(), clues, new Set<string>(), seededBeat0());
    const observe = out.choices.find((c) => c.verb === 'observe');
    expect(observe?.clueReveals).toEqual(seededObserveIds());
  });

  it('(b) resolves to the first still-unrevealed customer clue when the seeded one is spent', () => {
    const revealed = new Set<string>(seededObserveIds());
    const out = normalizeClueReveals(foreignBeat(), clues, revealed, seededBeat0());
    const ids = out.choices.find((c) => c.verb === 'observe')?.clueReveals ?? [];
    expect(ids.length, 'observing became a wasted turn').toBeGreaterThan(0);
    for (const id of ids) {
      expect(revealed.has(id), `re-revealed an already-known clue ${id}`).toBe(false);
      expect(clueIds(C1)).toContain(id);
    }
  });

  it('(c) resolves to [] without throwing once every customer clue is revealed', () => {
    const revealed = new Set<string>(clueIds(C1));
    let out: DialogueBeat | undefined;
    expect(() => {
      out = normalizeClueReveals(foreignBeat(), clues, revealed, seededBeat0());
    }).not.toThrow();
    expect(out?.choices.find((c) => c.verb === 'observe')?.clueReveals ?? []).toEqual([]);
  });

  it('never lets a foreign id survive, for any verb', () => {
    const out = normalizeClueReveals(foreignBeat(), clues, new Set<string>(), seededBeat0());
    for (const choice of out.choices) {
      for (const id of choice.clueReveals ?? []) {
        expect(clueIds(C1), `foreign id ${id} survived on a ${choice.verb} card`).toContain(id);
      }
    }
  });

  it('substitutes for observe only — a paid card with all-foreign ids gains nothing', () => {
    const out = normalizeClueReveals(foreignBeat(), clues, new Set<string>(), seededBeat0());
    for (const verb of ['indirect', 'direct', 'craft'] as const) {
      expect(out.choices.find((c) => c.verb === verb)?.clueReveals ?? []).toEqual([]);
    }
  });

  it('leaves a beat whose ids are all native untouched', () => {
    const native = seededBeat0();
    const out = normalizeClueReveals(native, clues, new Set<string>(), native);
    expect(out.choices.map((c) => c.clueReveals)).toEqual(
      native.choices.map((c) => c.clueReveals),
    );
    expect(out.npcLine).toBe(native.npcLine);
  });

  it('is pure — it does not mutate the beat it is given', () => {
    const input = foreignBeat();
    const before = JSON.stringify(input);
    normalizeClueReveals(input, clues, new Set<string>(), seededBeat0());
    expect(JSON.stringify(input)).toBe(before);
  });

  it('normalizes every beat leaving the source, live and seeded alike', async () => {
    const source = createBeatSource({
      seeded: seededFor(C1),
      customer: C1,
      adapter: fakeAdapter(async () => foreignBeat()),
    });
    const beat = await source.next();
    for (const choice of beat.choices) {
      for (const id of choice.clueReveals ?? []) {
        expect(clueIds(C1), `source emitted foreign clue id ${id}`).toContain(id);
      }
    }
    const observe = beat.choices.find((c) => c.verb === 'observe');
    expect(observe?.clueReveals?.length, 'observe card yields nothing in live mode').toBeGreaterThan(
      0,
    );
  });

  it('consults the injected revealed-set getter when substituting', async () => {
    const spent = new Set<string>(seededFor(C1)[0].choices.flatMap((c) => c.clueReveals ?? []));
    const source = createBeatSource({
      seeded: seededFor(C1),
      customer: C1,
      adapter: fakeAdapter(async () => foreignBeat()),
      revealed: () => spent,
    });
    const beat = await source.next();
    const ids = beat.choices.find((c) => c.verb === 'observe')?.clueReveals ?? [];
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(spent.has(id), `substituted an already-revealed clue ${id}`).toBe(false);
    }
  });
});

// ── S7 — default request composition (membrane: no typed text anywhere) ────

describe('composeDialogueRequest (S7)', () => {
  const ctx = (over: Partial<BeatContext> = {}): BeatContext => ({
    customer: C1,
    patienceTier: 1,
    history: [{ npcLine: 'prev line', playerChoiceLabel: 'prev card' }],
    revealed: new Set<string>(),
    personaTraits: [],
    ...over,
  });

  it('composes every field from game state / data tables', () => {
    const req = composeDialogueRequest(ctx({ personaTraits: ['조용한', '지친'] }));
    expect(req.customer.personaTraits).toEqual(['조용한', '지친']);
    expect(req.customer.problem).toBe(C1.problem);
    expect(req.customer.hiddenCause).toBe(C1.hiddenCause);
    expect(req.patienceTier).toBe(1);
    expect(req.history).toEqual([{ npcLine: 'prev line', playerChoiceLabel: 'prev card' }]);
  });

  it('offers only still-unrevealed clues, as {id,text} pairs from the customer table', () => {
    const spent = clueIds(C1)[0];
    const req = composeDialogueRequest(ctx({ revealed: new Set([spent]) }));
    expect(req.availableClues.map((c) => c.id)).not.toContain(spent);
    for (const clue of req.availableClues) {
      const source = C1.observationClues.find((c) => c.id === clue.id);
      expect(source, `unknown clue ${clue.id} offered to the model`).toBeTruthy();
      expect(clue.text).toBe(source?.text);
    }
    expect(req.availableClues).toHaveLength(C1.observationClues.length - 1);
  });
});

// ── AC1e — prohibition scan: the beat source is DOM-free and standalone ───

describe('AC1e — beats.ts is DOM-free (N1/N2/D2)', () => {
  const BEATS_REL = 'src/screens/conversation/beats.ts';
  const read = (): string =>
    readFileSync(new URL(`../../../${BEATS_REL}`, import.meta.url), 'utf8');

  /** Strip comments so prose *describing* a forbidden token cannot trip the scan. */
  const code = (): string =>
    read()
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  const forbidden: Array<[string, RegExp]> = [
    ['document', /\bdocument\b/],
    ['window', /\bwindow\b/],
    ['setTimeout', /\bsetTimeout\b/],
    ['fetch', /\bfetch\b/],
  ];

  for (const [name, re] of forbidden) {
    it(`does not reference ${name}`, () => {
      expect(re.test(code()), `${BEATS_REL} references ${name}`).toBe(false);
    });
  }

  it('does not import the conversation screen (one-way dependency, D2)', () => {
    expect(/from\s+['"]\.\/conversation/.test(code())).toBe(false);
    expect(/import\s*\(\s*['"]\.\/conversation/.test(code())).toBe(false);
  });

  it('does not import a CSS file (the renderer owns styling)', () => {
    expect(/\.css['"]/.test(code())).toBe(false);
  });
});
