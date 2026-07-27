// u12 — TDD-Red for 휴식 (PRD §2.7): ①생각정리 and ②Clear.
// Covers A13 (생각정리 −50 with a floor), A14 (Clear zeroes the gauge and forgets exactly one
// Prompt card), A15 (the pick is the earliest-equipped prompt party-wide — no RNG, no tieBreak),
// A16 / INV-7 (zero Prompt cards equipped ⇒ gauge only, forgotten null, no error path).
//
// Titles here must NOT contain the word "duplicate" (vitest gate word for assign.test.ts).
//
// RED on arrival: src/equip/rest.ts does not exist yet.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyClear,
  applyRest,
  applyThinkTidy,
  earliestEquippedPrompt,
} from '../../src/equip/rest';
import { createLoadout, equipCard } from '../../src/equip/loadout';
import type { GaugeEntry } from '../../src/equip/rest';
import type { PartyLoadout } from '../../src/equip/types';

import { loadBundledGameData } from '../../src/data/loader';
import type { Card } from '../../src/data/schema';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '../..'); // demos/darkest-context/

const { cards, tuning } = loadBundledGameData();
const slots = tuning.slots;
const THINK = tuning.gauge.rest.think; // data ref, never a literal −50
const CLEAR_TO = tuning.gauge.rest.clearTo;
const FLOOR = tuning.gauge.tiers.calm;

const PARTY = ['garrett', 'fiona', 'selene'] as const;
const fresh = (): PartyLoadout => createLoadout([...PARTY]);

const cardById = (id: string): Card => {
  const found = cards.find((c) => c.id === id);
  if (!found) throw new Error(`card missing from data/cards.json: ${id}`);
  return found;
};
const prompts = cards.filter((c) => c.slotKind === 'prompt');
const nonPrompts = cards.filter((c) => c.slotKind !== 'prompt');

const gauges = (...values: number[]): GaugeEntry[] =>
  PARTY.map((id, i) => ({ id, gauge: values[i] ?? 0 }));

const gaugeOf = (list: readonly GaugeEntry[], id: string): number =>
  list.find((g) => g.id === id)!.gauge;

const allEquipped = (party: PartyLoadout): string[] =>
  party.units.flatMap((u) => u.equipped.map((e) => e.cardId));

/** Equips in the given (unitId, cardId) order, so seq order is the test's own fixture. */
const equipInOrder = (pairs: readonly (readonly [string, string])[]): PartyLoadout =>
  pairs.reduce<PartyLoadout>(
    (party, [unitId, cardId]) => equipCard(party, unitId, cardById(cardId), slots),
    fresh(),
  );

// ── A13 — ①생각정리 ────────────────────────────────────────────────────────────────────
describe('생각정리 (think-tidy)', () => {
  it('drops every unit by the tuned step', () => {
    const before = gauges(100, 90, 70);
    const { gauges: after } = applyThinkTidy(fresh(), before, tuning);

    for (const entry of before) {
      expect(gaugeOf(after, entry.id)).toBe(Math.max(entry.gauge + THINK, FLOOR));
    }
  });

  it('clamps at the calm floor — no unit ever reads below it', () => {
    const { gauges: after } = applyThinkTidy(fresh(), gauges(10, 0, 49), tuning);
    for (const entry of after) expect(entry.gauge).toBeGreaterThanOrEqual(FLOOR);
    expect(gaugeOf(after, 'garrett')).toBe(FLOOR);
    expect(gaugeOf(after, 'fiona')).toBe(FLOOR);
  });

  it('leaves every loadout untouched and forgets nothing', () => {
    const party = equipInOrder([
      ['garrett', 'fearless'],
      ['fiona', 'grudge'],
    ]);
    const snapshot = JSON.stringify(party);
    const result = applyThinkTidy(party, gauges(80, 80, 80), tuning);

    expect(result.forgottenCardId).toBeNull();
    expect(JSON.stringify(result.party)).toBe(snapshot);
    expect(allEquipped(result.party)).toEqual(['fearless', 'grudge']);
  });

  it('is pure: the input gauge list is not mutated and a fresh array comes back', () => {
    const before = gauges(100, 90, 70);
    const snapshot = JSON.stringify(before);
    const result = applyThinkTidy(fresh(), before, tuning);

    expect(result.gauges).not.toBe(before);
    expect(JSON.stringify(before), 'applyThinkTidy mutated its input').toBe(snapshot);
  });

  it('keeps the party roster and its order in the returned gauge list', () => {
    const { gauges: after } = applyThinkTidy(fresh(), gauges(100, 90, 70), tuning);
    expect(after.map((g) => g.id)).toEqual([...PARTY]);
  });
});

// ── A14 / A15 — ②Clear ────────────────────────────────────────────────────────────────
describe('Clear', () => {
  const equippedParty = (): PartyLoadout =>
    equipInOrder([
      ['fiona', 'grudge'], // earliest prompt, seq 0
      ['garrett', 'dual_slash'], // skill — never eligible
      ['garrett', 'fearless'],
      ['selene', 'allies_first'],
    ]);

  it('zeroes every unit to the tuned clear target', () => {
    const { gauges: after } = applyClear(equippedParty(), gauges(100, 90, 70), tuning);
    for (const entry of after) expect(entry.gauge).toBe(CLEAR_TO);
  });

  it('forgets exactly one equipped card, party-wide', () => {
    const party = equippedParty();
    const result = applyClear(party, gauges(100, 90, 70), tuning);

    expect(allEquipped(result.party).length).toBe(allEquipped(party).length - 1);
    expect(result.forgottenCardId).not.toBeNull();
    expect(allEquipped(result.party)).not.toContain(result.forgottenCardId);
  });

  it('only ever forgets a Prompt card — skill and mcp cards survive', () => {
    const party = equipInOrder([
      ['garrett', 'dual_slash'], // skill first: lowest seq overall
      ['fiona', 'translation_lens'], // mcp
      ['selene', 'fearless'], // the only prompt
    ]);
    const result = applyClear(party, gauges(100, 100, 100), tuning);

    expect(result.forgottenCardId).toBe('fearless');
    expect(cardById(result.forgottenCardId!).type).toBe('prompt');
    expect(allEquipped(result.party).sort()).toEqual(['dual_slash', 'translation_lens'].sort());
  });

  it('A15 forgets the earliest-equipped prompt across the party, whatever the unit order', () => {
    const party = equipInOrder([
      ['selene', 'compassion'], // earliest prompt, but the LAST unit in party order
      ['garrett', 'fearless'],
      ['fiona', 'grudge'],
    ]);
    const result = applyClear(party, gauges(50, 50, 50), tuning);
    expect(result.forgottenCardId).toBe('compassion');
  });

  it('A15 is reproducible: 100 identical runs give byte-identical results (no RNG)', () => {
    const runs = Array.from({ length: 100 }, () =>
      JSON.stringify(applyClear(equippedParty(), gauges(100, 90, 70), tuning)),
    );
    expect(new Set(runs).size, 'Clear is not deterministic').toBe(1);
    expect(JSON.parse(runs[0]).forgottenCardId).toBe('grudge');
  });

  it('is pure: the input party and gauge list are untouched', () => {
    const party = equippedParty();
    const before = gauges(100, 90, 70);
    const partySnapshot = JSON.stringify(party);
    const gaugeSnapshot = JSON.stringify(before);

    const result = applyClear(party, before, tuning);

    expect(result.party).not.toBe(party);
    expect(JSON.stringify(party), 'applyClear mutated the party').toBe(partySnapshot);
    expect(JSON.stringify(before), 'applyClear mutated the gauge list').toBe(gaugeSnapshot);
  });

  it('takes the forgotten card off exactly one unit and leaves the rest as they were', () => {
    const party = equippedParty();
    const result = applyClear(party, gauges(0, 0, 0), tuning);

    expect(result.party.units.map((u) => u.unitId)).toEqual([...PARTY]);
    const fiona = result.party.units.find((u) => u.unitId === 'fiona')!;
    expect(fiona.equipped.map((e) => e.cardId)).toEqual([]);
    const garrett = result.party.units.find((u) => u.unitId === 'garrett')!;
    expect(garrett.equipped.map((e) => e.cardId)).toEqual(['dual_slash', 'fearless']);
  });
});

// ── A15 — earliestEquippedPrompt, the deterministic seam itself ───────────────────────
describe('earliestEquippedPrompt', () => {
  it('returns the lowest-seq prompt with the unit that holds it', () => {
    const party = equipInOrder([
      ['fiona', 'grudge'],
      ['garrett', 'fearless'],
    ]);
    expect(earliestEquippedPrompt(party)).toEqual({
      unitId: 'fiona',
      cardId: 'grudge',
      seq: expect.any(Number),
    });
  });

  it('skips non-prompt cards even when they were equipped first', () => {
    const party = equipInOrder([
      ['garrett', 'taunt'], // skill
      ['garrett', 'healing_potion_x3'], // mcp
      ['fiona', 'allies_first'], // prompt
    ]);
    expect(earliestEquippedPrompt(party)!.cardId).toBe('allies_first');
  });

  it('returns null on an empty party loadout', () => {
    expect(earliestEquippedPrompt(fresh())).toBeNull();
  });

  it('returns null when only skill and mcp cards are equipped', () => {
    const party = equipInOrder([
      ['garrett', 'taunt'],
      ['fiona', 'flame_scroll'],
    ]);
    expect(earliestEquippedPrompt(party)).toBeNull();
  });

  it('found both prompt and non-prompt cards in data (fixtures are meaningful)', () => {
    expect(prompts.length).toBeGreaterThan(1);
    expect(nonPrompts.length).toBeGreaterThan(1);
  });
});

// ── A16 / INV-7 — the silent fallback, logic half ─────────────────────────────────────
describe('Clear with no Prompt card equipped (INV-7 silent fallback)', () => {
  it('still zeroes every gauge and forgets nothing', () => {
    const party = fresh();
    const result = applyClear(party, gauges(100, 90, 70), tuning);

    for (const entry of result.gauges) expect(entry.gauge).toBe(CLEAR_TO);
    expect(result.forgottenCardId).toBeNull();
  });

  it('leaves the loadouts exactly as they were', () => {
    const party = equipInOrder([
      ['garrett', 'taunt'],
      ['fiona', 'flame_scroll'],
      ['selene', 'mirror_shield'],
    ]);
    const snapshot = JSON.stringify(party);
    const result = applyClear(party, gauges(100, 100, 100), tuning);

    expect(result.forgottenCardId).toBeNull();
    expect(JSON.stringify(result.party)).toBe(snapshot);
  });

  it('does not throw and returns no warning field — degradation is silent', () => {
    const result = applyClear(fresh(), gauges(100, 90, 70), tuning);
    expect(Object.keys(result).sort()).toEqual(['forgottenCardId', 'gauges', 'party']);
    expect(JSON.stringify(result)).not.toMatch(/warn|error|fail/i);
  });
});

// ── applyRest — the one entry point the 휴식 screen calls ──────────────────────────────
describe('applyRest', () => {
  const party = (): PartyLoadout =>
    equipInOrder([
      ['fiona', 'grudge'],
      ['garrett', 'fearless'],
    ]);

  it("routes 'think' to 생각정리", () => {
    const via = applyRest('think', party(), gauges(100, 90, 70), tuning);
    const direct = applyThinkTidy(party(), gauges(100, 90, 70), tuning);
    expect(JSON.stringify(via)).toBe(JSON.stringify(direct));
  });

  it("routes 'clear' to Clear", () => {
    const via = applyRest('clear', party(), gauges(100, 90, 70), tuning);
    const direct = applyClear(party(), gauges(100, 90, 70), tuning);
    expect(JSON.stringify(via)).toBe(JSON.stringify(direct));
  });

  it('rejects an unknown option instead of silently picking one', () => {
    expect(() =>
      // @ts-expect-error — programming-error guard, not a player-facing path
      applyRest('nap', party(), gauges(100, 90, 70), tuning),
    ).toThrow();
  });
});

// ── A15 — structural determinism: no RNG, no tieBreak, anywhere under src/equip/** ────
describe('src/equip/** is RNG-free', () => {
  const walk = (dir: string): string[] => {
    if (!existsSync(dir)) return [];
    let out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(walk(full));
      else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
    }
    return out;
  };

  const blank = (m: string): string => m.replace(/[^\n]/g, ' ');
  const scrub = (source: string): string =>
    source
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  const files = walk(resolve(demoRoot, 'src/equip'));

  it('found equip sources to scan (the guard is not vacuously green)', () => {
    expect(files.length, 'src/equip/** is missing — nothing was scanned').toBeGreaterThan(0);
  });

  it('calls no Math.random and imports no tieBreak — determinism is the seq counter', () => {
    const hits: string[] = [];
    for (const file of files) {
      scrub(readFileSync(file, 'utf8'))
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (/Math\.random|tieBreak/.test(line)) {
            hits.push(`${relative(demoRoot, file)}:${i + 1}: ${line.trim()}`);
          }
        });
    }
    expect(hits, `non-deterministic seam in src/equip:\n${hits.join('\n')}`).toEqual([]);
  });
});
