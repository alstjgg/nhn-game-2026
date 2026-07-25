// TDD-Red gate for u12 — tier tone content (stub tier variants + live tone hint).
//
// Contract sources: .claude/super/units/u12/spec.md (§1.2 F1–F9, §3 D-1…D-6,
// §4 AC1–AC15) and design.md (§3 module surface, §4 test plan).
//
// Layer split is forced by `vitest.config.ts` (`environment: 'node'`, frozen —
// spec §1.4): everything here is pure data + pure function + fake adapters
// against the real `data/*.json`, the real `src/ai/contract.ts` and the real
// `src/screens/conversation/beats.ts`. The one DOM proof (a tier bump actually
// changing the rendered line) lives in `e2e/patience.spec.ts`.
//
// RED until the build lands: `data/tier-variants.json` and
// `src/data/tier-variants.ts` do not exist yet, so the two imports below fail to
// resolve and the whole suite is red — the same starting point
// `tests/data/content.test.ts` used for u4.
//
// Every test CALLS the module; the only source-text test is AC8's membrane scan,
// which is a prohibition scan by construction (it necessarily contains the
// forbidden tokens, so it reads `src/**/*.ts` from disk and must never be
// rewritten to walk `tests/`).
import { describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import customersData from '../../data/customers.json';
import generationData from '../../data/generation.json';
import tierVariantsData from '../../data/tier-variants.json';
import type { AIAdapter } from '../../src/ai/adapter';
import {
  isDialogueBeat,
  type BeatChoice,
  type DialogueBeat,
  type DialogueRequest,
  type PatienceTier,
  type PortraitSheet,
} from '../../src/ai/contract';
import { loadCustomers } from '../../src/data/loader';
import type { Customer } from '../../src/data/schema';
import {
  assertVariantCoverage,
  buildTierVariantIndex,
  loadTierVariants,
  selectTierLine,
  shippedTierVariantIndex,
  type TierVariantRow,
  type TierVariantTable,
} from '../../src/data/tier-variants';
import { createBeatSource, toBeat } from '../../src/screens/conversation/beats';

// ── Fixtures: the real shipped content through the real loaders ──────────────

const CUSTOMERS: Customer[] = loadCustomers(customersData);
const TIERS: readonly PatienceTier[] = [0, 1, 2, 3];

/** The table under test, materialized once through its own loud loader (F5). */
const TABLE: TierVariantTable = loadTierVariants(tierVariantsData);

/** Code points, trimmed — the unit F4/AC2 measures length in (never UTF-16). */
function cp(s: string): number {
  return [...s.trim()].length;
}

function rowsOf(customerId: string): readonly TierVariantRow[] {
  const rows = TABLE[customerId];
  expect(rows, `tier-variants.json has no rows for ${customerId}`).toBeDefined();
  return rows;
}

/** Every authored variant string, flattened in (customer, beat, tier) order. */
function allVariants(table: TierVariantTable): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  for (const [cid, rows] of Object.entries(table)) {
    rows.forEach((row, beat) => {
      row.forEach((text, tier) => out.push({ key: `${cid}/beat ${beat}/tier ${tier}`, text }));
    });
  }
  return out;
}

/** A deep-fresh mutable clone of the shipped JSON, for the loud-failure cases. */
function rawClone(): Record<string, string[][]> {
  return structuredClone(tierVariantsData) as Record<string, string[][]>;
}

/** A `isDialogueBeat`-valid beat carrying an arbitrary line. */
function beatWith(npcLine: string): DialogueBeat {
  const choices: BeatChoice[] = [
    { label: '에둘러 묻는다', verb: 'indirect', patienceCost: 1 },
    { label: '곧장 묻는다', verb: 'direct', patienceCost: 2 },
    { label: '[관찰] 얼굴빛을 살핀다', verb: 'observe', patienceCost: 0 },
    { label: '[조제하러 가기]', verb: 'craft', patienceCost: 0 },
  ];
  return { npcLine, choices };
}

// ── Adapter doubles (D-5) — no network, no timers ───────────────────────────

type DialogueImpl = (req: DialogueRequest, call: number) => Promise<DialogueBeat>;

function fakeAdapter(dialogue: DialogueImpl, mode: 'live' | 'stub' = 'live'): {
  adapter: AIAdapter;
  requests: DialogueRequest[];
} {
  const requests: DialogueRequest[] = [];
  const adapter: AIAdapter = {
    mode,
    async dialogue(req) {
      const call = requests.length;
      requests.push(req);
      return dialogue(req, call);
    },
    async portrait(): Promise<PortraitSheet> {
      return { b64: '', prompt: 'fake', url: 'fake.png' };
    },
  };
  return { adapter, requests };
}

// ── AC1 · F1/F2/F3 — shape + exact coverage against customers.json ──────────

describe('AC1 the shipped table covers every customer beat with 4 variants', () => {
  it('loads through its own validator without throwing', () => {
    expect(() => loadTierVariants(tierVariantsData)).not.toThrow();
  });

  it('has exactly the customer ids customers.json ships — no more, no fewer', () => {
    expect(Object.keys(TABLE).sort()).toEqual(CUSTOMERS.map((c) => c.id).sort());
  });

  it('gives every customer one row per dialogue node', () => {
    for (const customer of CUSTOMERS) {
      expect(
        rowsOf(customer.id).length,
        `${customer.id}: row count does not match dialogueNodes`,
      ).toBe(customer.dialogueNodes.length);
    }
  });

  it('gives every row exactly 4 non-empty string variants', () => {
    for (const customer of CUSTOMERS) {
      rowsOf(customer.id).forEach((row, beat) => {
        expect(row.length, `${customer.id} beat ${beat}: not 4 variants`).toBe(4);
        row.forEach((text, tier) => {
          expect(typeof text, `${customer.id} beat ${beat} tier ${tier}: not a string`).toBe(
            'string',
          );
          expect(cp(text), `${customer.id} beat ${beat} tier ${tier}: empty variant`).toBeGreaterThan(
            0,
          );
        });
      });
    }
  });

  it('pins tier 0 byte-identically to the authored npcLine (F2 — one source of truth)', () => {
    for (const customer of CUSTOMERS) {
      const rows = rowsOf(customer.id);
      customer.dialogueNodes.forEach((node, beat) => {
        expect(rows[beat][0], `${customer.id} beat ${beat}: tier 0 drifted from customers.json`).toBe(
          node.npcLine,
        );
      });
    }
  });

  it('passes the cross-file coverage assertion (F3)', () => {
    expect(() => assertVariantCoverage(TABLE, CUSTOMERS)).not.toThrow();
  });
});

// ── AC2 · F4 — the prose tightens as the tier rises ────────────────────────

describe('AC2 variant length is non-increasing across tiers and strictly shorter at 한계', () => {
  it('never grows from tier to tier', () => {
    for (const customer of CUSTOMERS) {
      rowsOf(customer.id).forEach((row, beat) => {
        for (let tier = 1; tier < 4; tier++) {
          expect(
            cp(row[tier]),
            `${customer.id} beat ${beat}: tier ${tier} is longer than tier ${tier - 1} ` +
              `(${row.map(cp).join(' → ')})`,
          ).toBeLessThanOrEqual(cp(row[tier - 1]));
        }
      });
    }
  });

  it('is strictly shorter at tier 3 than at tier 0', () => {
    for (const customer of CUSTOMERS) {
      rowsOf(customer.id).forEach((row, beat) => {
        expect(
          cp(row[3]),
          `${customer.id} beat ${beat}: 한계 is not shorter than 평온 (${row.map(cp).join(' → ')})`,
        ).toBeLessThan(cp(row[0]));
      });
    }
  });

  it('keeps every variant Korean prose — no numerals, no tier/patience meta text', () => {
    for (const { key, text } of allVariants(TABLE)) {
      expect(/[가-힣]/.test(text), `${key}: no Hangul in "${text}"`).toBe(true);
      expect(/\d/.test(text), `${key}: a numeral leaked into "${text}"`).toBe(false);
      expect(/tier|티어|인내심|참을성/i.test(text), `${key}: meta text in "${text}"`).toBe(false);
    }
  });
});

// ── AC3 · F5/F6 — the selector is exact on known lines, total on unknown ───

describe('AC3 selectTierLine returns the row variant for the tier, and is total', () => {
  it('maps every (customer, beat, tier) of the shipped data to its variant', () => {
    let pinned = 0;
    for (const customer of CUSTOMERS) {
      const rows = rowsOf(customer.id);
      customer.dialogueNodes.forEach((node, beat) => {
        for (const tier of TIERS) {
          expect(
            selectTierLine(shippedTierVariantIndex, node.npcLine, tier),
            `${customer.id} beat ${beat} tier ${tier}: wrong variant selected`,
          ).toBe(rows[beat][tier]);
          pinned += 1;
        }
      });
    }
    expect(pinned, 'fewer cases pinned than the shipped content has').toBeGreaterThanOrEqual(16);
  });

  it('is idempotent — a toned line re-tones to the same row (D-2b)', () => {
    for (const customer of CUSTOMERS) {
      rowsOf(customer.id).forEach((row, beat) => {
        for (const from of TIERS) {
          for (const to of TIERS) {
            expect(
              selectTierLine(shippedTierVariantIndex, row[from], to),
              `${customer.id} beat ${beat}: tier ${from} line does not re-tone to ${to}`,
            ).toBe(row[to]);
          }
        }
      });
    }
  });

  it('indexes all four strings of every row', () => {
    const expected = Object.values(TABLE).reduce((sum, rows) => sum + rows.length * 4, 0);
    expect(shippedTierVariantIndex.size, 'index does not cover 4 × Σ beats').toBe(expected);
  });

  it('returns an unknown line unchanged at every tier (F6 — u13 / live lines)', () => {
    const foreign = '이 대사는 어느 표에도 없어요. 손님 셋의 대사이지요.';
    for (const tier of TIERS) {
      expect(selectTierLine(shippedTierVariantIndex, foreign, tier)).toBe(foreign);
    }
  });

  it('never returns empty/undefined and never throws on degenerate input (F6/N7)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const tier of TIERS) {
      expect(() => selectTierLine(shippedTierVariantIndex, '', tier)).not.toThrow();
      expect(selectTierLine(shippedTierVariantIndex, '', tier)).toBe('');
      expect(selectTierLine(shippedTierVariantIndex, '   ', tier)).toBe('   ');
    }
    expect(warn, 'the pass-through path logged (N7)').not.toHaveBeenCalled();
    expect(error, 'the pass-through path logged (N7)').not.toHaveBeenCalled();
    warn.mockRestore();
    error.mockRestore();
  });

  it('selects against an injected synthetic table, not only the shipped one', () => {
    const table = loadTierVariants({ cx: [['가장 긴 문장입니다요.', '짧아진 대답이오.', '됐소이다.', '약이나.']] });
    const index = buildTierVariantIndex(table);
    expect(selectTierLine(index, '가장 긴 문장입니다요.', 2)).toBe('됐소이다.');
    expect(selectTierLine(index, '가장 긴 문장입니다요.', 0)).toBe('가장 긴 문장입니다요.');
    // …and the shipped lines are foreign to it: no cross-index bleed.
    expect(selectTierLine(index, CUSTOMERS[0].dialogueNodes[0].npcLine, 3)).toBe(
      CUSTOMERS[0].dialogueNodes[0].npcLine,
    );
  });
});

// ── AC4 · A2 — global uniqueness makes the reverse index unambiguous ───────

describe('AC4 every variant string is globally unique', () => {
  it('has no duplicate among the shipped 4 × Σ beats strings', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const { key, text } of allVariants(TABLE)) {
      const first = seen.get(text);
      if (first !== undefined) clashes.push(`${first} ↔ ${key}: "${text}"`);
      else seen.set(text, key);
    }
    expect(clashes, `duplicate variants: ${clashes.join(' | ')}`).toEqual([]);
  });

  it('makes buildTierVariantIndex throw on a duplicate line', () => {
    const dup = '같은 문장이 두 번 나옵니다요.';
    const table = loadTierVariants({
      ca: [[dup, '짧아진 말이오.', '재촉하오.', '약이나.']],
      cb: [[dup, '다른 짧은 말.', '다른 재촉.', '주시오.']],
    });
    expect(() => buildTierVariantIndex(table)).toThrow(/tier-variants/);
  });
});

// ── AC5 · F7/D-3 — the seeded / no-adapter path is toned ──────────────────

describe('AC5 a seeded-only beat source emits the variant for the current tier', () => {
  it('tones every seeded beat at every tier and stays schema-valid', async () => {
    const customer = CUSTOMERS[0];
    const rows = rowsOf(customer.id);
    for (const tier of TIERS) {
      const source = createBeatSource({
        seeded: customer.dialogueNodes.map(toBeat),
        patienceTier: () => tier,
      });
      for (let beat = 0; beat < customer.dialogueNodes.length; beat++) {
        const emitted = await source.next();
        expect(emitted.npcLine, `beat ${beat} at tier ${tier} was not toned`).toBe(rows[beat][tier]);
        expect(isDialogueBeat(emitted), `beat ${beat} at tier ${tier} left the schema`).toBe(true);
      }
      expect(source.lastMode, 'the seeded path is not stub mode').toBe('stub');
    }
  });

  it('keeps the choices of the seeded beat untouched while toning the line', async () => {
    const customer = CUSTOMERS[0];
    const seeded = customer.dialogueNodes.map(toBeat);
    const source = createBeatSource({ seeded, customer, patienceTier: () => 2 });
    const emitted = await source.next();
    expect(emitted.npcLine).toBe(rowsOf(customer.id)[0][2]);
    expect(emitted.choices.map((c) => c.label)).toEqual(seeded[0].choices.map((c) => c.label));
    expect(emitted.choices.map((c) => c.verb)).toEqual(seeded[0].choices.map((c) => c.verb));
  });

  it('reads the tier at beat production, not at construction (D-3)', async () => {
    const customer = CUSTOMERS[0];
    const rows = rowsOf(customer.id);
    let tier: PatienceTier = 0;
    const source = createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      patienceTier: () => tier,
    });
    expect((await source.next()).npcLine).toBe(rows[0][0]);
    tier = 2;
    expect((await source.next()).npcLine).toBe(rows[1][2]);
  });

  it('accepts an injected index through the optional option (N6 default keeps u10 green)', async () => {
    const line = '주인장, 좀 봐 주시겠습니까요.';
    const table = loadTierVariants({ cz: [[line, '봐 주시오.', '어서 좀.', '어서.']] });
    const source = createBeatSource({
      seeded: [beatWith(line)],
      patienceTier: () => 3,
      tierVariants: buildTierVariantIndex(table),
    });
    expect((await source.next()).npcLine).toBe('어서.');
  });
});

// ── AC6/AC7 · F8/F7 — the live half is wiring proof, tone-free (D-5) ──────

describe('AC6 the live request carries the current patience tier', () => {
  it.each([...TIERS])('records patienceTier === %i', async (tier) => {
    const customer = CUSTOMERS[0];
    const { adapter, requests } = fakeAdapter(async () => beatWith('모델이 지은 대사입니다.'));
    const source = createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      customer,
      adapter,
      patienceTier: () => tier,
    });
    await source.next();
    expect(requests.length, 'the adapter was never asked').toBe(1);
    expect(requests[0].patienceTier, 'the request lost the tier').toBe(tier);
  });

  it('re-reads the tier for every beat', async () => {
    const customer = CUSTOMERS[0];
    let tier: PatienceTier = 0;
    let call = 0;
    const { adapter, requests } = fakeAdapter(async () => {
      call += 1;
      return beatWith(`모델 대사 ${call}.`);
    });
    const source = createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      customer,
      adapter,
      patienceTier: () => tier,
    });
    await source.next();
    tier = 3;
    await source.next();
    expect(requests.map((r) => r.patienceTier)).toEqual([0, 3]);
  });
});

describe('AC7 an adapter beat is never re-toned', () => {
  it('returns a live line verbatim even when that line IS in the variant table', async () => {
    const customer = CUSTOMERS[0];
    const rows = rowsOf(customer.id);
    const { adapter } = fakeAdapter(async () => beatWith(rows[0][0]));
    const source = createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      customer,
      adapter,
      patienceTier: () => 3,
    });
    const emitted = await source.next();
    expect(source.lastMode, 'the live beat was not taken').toBe('live');
    expect(emitted.npcLine, 'the live line was re-toned by the stub table (F7)').toBe(rows[0][0]);
    expect(emitted.npcLine).not.toBe(rows[0][3]);
  });
});

// ── AC14 · C1/F7 — u1's stub adapter keeps its own tone authority ─────────

describe('AC14 a stub-mode adapter line passes through verbatim', () => {
  it.each([...TIERS])('leaves a foreign stub line untouched at tier %i', async (tier) => {
    const customer = CUSTOMERS[0];
    // Shaped like u1's `lineForTier` output: already toned, never in u12's table.
    const stubLine = `잠이 안 온다고 했잖소. (스텁 티어 ${'!'.repeat(tier + 1)})`;
    const { adapter } = fakeAdapter(async () => beatWith(stubLine), 'stub');
    const source = createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      customer,
      adapter,
      patienceTier: () => tier,
    });
    const emitted = await source.next();
    expect(emitted.npcLine, 'a stub-adapter line was re-toned').toBe(stubLine);
    expect(emitted.npcLine.length, 'the line was emptied').toBeGreaterThan(0);
    expect(isDialogueBeat(emitted)).toBe(true);
  });
});

// ── AC15 · C1 — the per-beat fallback path is the one that renders u12 ────

describe('AC15 a rejecting adapter degrades to the toned seeded beat', () => {
  it('tones beat 0 on rejection and still passes the live beat 1 verbatim', async () => {
    const customer = CUSTOMERS[0];
    const rows = rowsOf(customer.id);
    const liveLine = '모델이 지은 둘째 대사입니다.';
    const { adapter } = fakeAdapter(async (_req, call) => {
      if (call === 0) throw new Error('proxy down');
      return beatWith(liveLine);
    });
    const source = createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      customer,
      adapter,
      patienceTier: () => 2,
    });

    const first = await source.next();
    expect(source.lastMode, 'the rejection did not degrade to stub').toBe('stub');
    expect(first.npcLine, 'the fallback beat was not toned').toBe(rows[0][2]);
    expect(isDialogueBeat(first), 'the fallback beat left the schema').toBe(true);

    const second = await source.next();
    expect(source.lastMode).toBe('live');
    expect(second.npcLine).toBe(liveLine);
  });

  it('tones the fallback when the adapter answers schema-invalid data', async () => {
    const customer = CUSTOMERS[0];
    const rows = rowsOf(customer.id);
    const { adapter } = fakeAdapter(async () => ({ npcLine: '', choices: [] }) as DialogueBeat);
    const source = createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      customer,
      adapter,
      patienceTier: () => 1,
    });
    const emitted = await source.next();
    expect(emitted.npcLine, 'a schema-invalid answer did not fall back to the toned seed').toBe(
      rows[0][1],
    );
    expect(isDialogueBeat(emitted)).toBe(true);
  });
});

// ── AC8 · F9/N4 — the membrane: no client code ships a tone string ────────

describe('AC8 no tone string or tierTones access lives under src/', () => {
  const toneSentences: string[] = (generationData as { tierTones: string[] }).tierTones;

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return entry.name.endsWith('.ts') ? [path] : [];
    });
  }

  /** Comments explain the data model; only CODE may not touch it. */
  function codeOf(path: string): string {
    return readFileSync(path, 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
  }

  it('pins the four canonical tone sentences as the read-only source (sanity)', () => {
    expect(toneSentences.length, 'generation.json lost its 4 tierTones').toBe(4);
  });

  it('never reads generation.json tierTones from client code', () => {
    const offenders = sourceFiles('src').filter((path) => codeOf(path).includes('tierTones'));
    expect(offenders, `client code reads tierTones: ${offenders.join(', ')}`).toEqual([]);
  });

  it('ships none of the four tone sentences anywhere under src/', () => {
    const hits: string[] = [];
    for (const path of sourceFiles('src')) {
      const text = readFileSync(path, 'utf-8');
      toneSentences.forEach((sentence, tier) => {
        if (text.includes(sentence)) hits.push(`${path} (tier ${tier})`);
      });
    }
    expect(hits, `tone prose leaked into the client: ${hits.join(', ')}`).toEqual([]);
  });

  it('composes no tone hint client-side: the variant prose lives only in data/', () => {
    const sample = rowsOf(CUSTOMERS[0].id)[0][3];
    const offenders = sourceFiles('src').filter((path) => readFileSync(path, 'utf-8').includes(sample));
    expect(offenders, `a tier variant is hard-coded in src: ${offenders.join(', ')}`).toEqual([]);
  });
});

// ── AC9 · F5 — loud failure, naming customer + beat (+ tier) ──────────────

describe('AC9 the loader fails loudly and names the offender', () => {
  it('rejects a non-object payload', () => {
    for (const bad of [null, undefined, 42, 'c1', [], true]) {
      expect(() => loadTierVariants(bad), `accepted ${JSON.stringify(bad)}`).toThrow(
        /tier-variants/,
      );
    }
  });

  it('rejects a customer whose value is not an array of rows', () => {
    const raw = rawClone();
    (raw as Record<string, unknown>).c1 = { 0: ['가', '나', '다', '라'] };
    expect(() => loadTierVariants(raw)).toThrow(/tier-variants.*c1/s);
  });

  it.each([3, 5])('rejects a row of %i variants, naming the beat', (length) => {
    const raw = rawClone();
    raw.c1[1] = Array.from({ length }, (_, i) => `변형 ${'가'.repeat(i + 1)}`);
    let message = '';
    try {
      loadTierVariants(raw);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message, `a row of ${length} was accepted`).toMatch(/tier-variants/);
    expect(message).toContain('c1');
    expect(message, 'the message does not name the beat index').toMatch(/beat\s*1/);
  });

  it('rejects a non-string element, naming the beat and the tier', () => {
    const raw = rawClone();
    (raw.c1[0] as unknown[])[2] = 7;
    let message = '';
    try {
      loadTierVariants(raw);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toMatch(/tier-variants/);
    expect(message).toContain('c1');
    expect(message, 'the message does not name the beat index').toMatch(/beat\s*0/);
    expect(message, 'the message does not name the tier index').toMatch(/tier\s*2/);
  });

  it('rejects an empty / whitespace-only variant', () => {
    for (const blank of ['', '   ']) {
      const raw = rawClone();
      raw.c1[0][3] = blank;
      expect(() => loadTierVariants(raw), `accepted ${JSON.stringify(blank)}`).toThrow(
        /tier-variants/,
      );
    }
  });

  it('rejects a customer with zero rows', () => {
    const raw = rawClone();
    raw.c1 = [];
    expect(() => loadTierVariants(raw)).toThrow(/tier-variants.*c1/s);
  });

  it('flags a missing customer key through the coverage assertion (F3)', () => {
    const raw = rawClone();
    delete (raw as Record<string, unknown>).c2;
    const table = loadTierVariants(raw);
    let message = '';
    try {
      assertVariantCoverage(table, CUSTOMERS);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message, 'a missing customer passed coverage').toMatch(/tier-variants/);
    expect(message).toContain('c2');
  });

  it('flags an extra customer id no customers.json ships', () => {
    const raw = rawClone();
    raw.c9 = [['긴 문장이 여기 있습니다요.', '짧은 말이오.', '어서 좀.', '어서.']];
    const table = loadTierVariants(raw);
    expect(() => assertVariantCoverage(table, CUSTOMERS)).toThrow(/c9/);
  });

  it('flags a beat-count mismatch, naming the customer', () => {
    const raw = rawClone();
    raw.c1 = [raw.c1[0]];
    const table = loadTierVariants(raw);
    expect(() => assertVariantCoverage(table, CUSTOMERS)).toThrow(/tier-variants.*c1/s);
  });

  it('flags a tier-0 line that drifted from customers.json, naming the beat', () => {
    const raw = rawClone();
    raw.c1[1][0] = `${raw.c1[1][0]} 어긋난 사본입니다.`;
    const table = loadTierVariants(raw);
    let message = '';
    try {
      assertVariantCoverage(table, CUSTOMERS);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message, 'a drifted tier-0 line passed coverage').toMatch(/tier-variants/);
    expect(message).toContain('c1');
    expect(message, 'the message does not name the beat index').toMatch(/beat\s*1/);
  });
});
