// u12 — TDD-Red for the 훈련장 draft: 3택1 fan-out and the free-assignment target list.
// Covers A4 (option count + data order), A6 (engine never picks), A9 (훈련장 is gauge-blind),
// A11's logic half (a duplicate-holding unit comes back disabled, with a reason).
//
// Titles here must NOT contain the word "duplicate" (that string is the vitest gate for
// tests/equip/assign.test.ts) — the rule is named in prose instead.
//
// RED on arrival: src/equip/{draft,loadout}.ts do not exist yet.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { draftOptions, draftPickCount, targetChoices } from '../../src/equip/draft';
import { createLoadout, equipCard } from '../../src/equip/loadout';
import type { PartyLoadout } from '../../src/equip/types';

import { loadBundledGameData, resolveTuningRef } from '../../src/data/loader';
import type { Card, DraftGrant, Grant } from '../../src/data/schema';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '../..'); // demos/darkest-context/

const { cards, council, tuning } = loadBundledGameData();
const slots = tuning.slots;

const PARTY = ['garrett', 'fiona', 'selene'] as const;
const fresh = (): PartyLoadout => createLoadout([...PARTY]);

const draftGrants = Object.entries(council.rewards).filter(
  (entry): entry is [string, DraftGrant] => entry[1].kind === 'draft',
);
const firstDraft = (): DraftGrant => {
  const found = draftGrants[0];
  if (!found) throw new Error('data/council.json carries no draft reward to test against');
  return found[1];
};
const cardById = (id: string): Card => {
  const found = cards.find((c) => c.id === id);
  if (!found) throw new Error(`card missing from data/cards.json: ${id}`);
  return found;
};

describe('draftOptions — the 3 cards that fan out', () => {
  it('found draft rewards in data/council.json (the suite is not vacuously green)', () => {
    expect(draftGrants.length).toBeGreaterThan(0);
  });

  it('A4 hands back exactly countRef options for every draft tile in the map', () => {
    for (const [tileId, grant] of draftGrants) {
      const options = draftOptions(grant, cards, tuning);
      expect(options.length, `tile ${tileId}`).toBe(resolveTuningRef(tuning, grant.countRef));
    }
  });

  it('A4 keeps data order — optionCardIds is rendered as authored, never shuffled', () => {
    for (const [tileId, grant] of draftGrants) {
      expect(
        draftOptions(grant, cards, tuning).map((c) => c.id),
        `tile ${tileId}`,
      ).toEqual(grant.optionCardIds);
    }
  });

  it('is deterministic: repeated calls on one grant return the identical order', () => {
    const grant = firstDraft();
    const runs = Array.from({ length: 20 }, () => draftOptions(grant, cards, tuning).map((c) => c.id));
    for (const run of runs) expect(run).toEqual(runs[0]);
  });

  it('resolves whole card records, not bare ids', () => {
    const grant = firstDraft();
    for (const option of draftOptions(grant, cards, tuning)) {
      expect(option).toEqual(cardById(option.id));
    }
  });

  it('throws when a listed option is absent from the card table (data-integrity guard)', () => {
    const grant = firstDraft();
    const thinned = cards.filter((c) => c.id !== grant.optionCardIds[0]);
    expect(() => draftOptions(grant, thinned, tuning)).toThrow();
  });

  it('throws on a grant that is not a draft, instead of silently returning nothing', () => {
    const fixed: Grant = { kind: 'fixed', cardId: cards[0].id };
    expect(() => draftOptions(fixed, cards, tuning)).toThrow();
  });
});

describe('draftPickCount', () => {
  it('reads pickCountRef through the tuning seam — one pick per 훈련장 visit', () => {
    for (const [tileId, grant] of draftGrants) {
      expect(draftPickCount(grant, tuning), `tile ${tileId}`).toBe(
        resolveTuningRef(tuning, grant.pickCountRef),
      );
    }
  });
});

describe('targetChoices — who the picked card may be aimed at', () => {
  it('A6 lists every party unit, in party order, all enabled on a fresh party', () => {
    const choices = targetChoices(fresh(), cards[0], slots);
    expect(choices.map((c) => c.unitId)).toEqual([...PARTY]);
    expect(choices.every((c) => c.enabled)).toBe(true);
    expect(choices.every((c) => c.reason === undefined)).toBe(true);
  });

  it('A6 free assignment: every draft option reaches every unit — the engine narrows nothing', () => {
    const grant = firstDraft();
    for (const option of draftOptions(grant, cards, tuning)) {
      const enabled = targetChoices(fresh(), option, slots)
        .filter((c) => c.enabled)
        .map((c) => c.unitId);
      expect(enabled, `option ${option.id}`).toEqual([...PARTY]);
    }
  });

  it('disables only the unit already holding that card, and says why', () => {
    const c = cardById('fearless');
    const party = equipCard(fresh(), 'fiona', c, slots);
    const choices = targetChoices(party, c, slots);

    const fiona = choices.find((x) => x.unitId === 'fiona')!;
    expect(fiona.enabled).toBe(false);
    expect(fiona.reason).toBe('duplicate');
    expect(choices.filter((x) => x.unitId !== 'fiona').every((x) => x.enabled)).toBe(true);
  });

  it("disables a unit whose slot kind is spent, with reason 'full'", () => {
    const prompts = cards.filter((c) => c.slotKind === 'prompt');
    let party = fresh();
    for (let i = 0; i < slots.prompt; i += 1) {
      party = equipCard(party, 'garrett', prompts[i], slots);
    }
    const overflow = prompts[slots.prompt];
    const garrett = targetChoices(party, overflow, slots).find((x) => x.unitId === 'garrett')!;

    expect(garrett.enabled).toBe(false);
    expect(garrett.reason).toBe('full');
  });

  it('never offers a discard branch: a blocked unit is just a disabled choice (A8)', () => {
    const c = cardById('fearless');
    const party = equipCard(fresh(), 'fiona', c, slots);
    expect(JSON.stringify(targetChoices(party, c, slots))).not.toMatch(/discard/i);
  });

  it('reads only — building the choice list mutates no loadout', () => {
    const party = equipCard(fresh(), 'fiona', cards[0], slots);
    const snapshot = JSON.stringify(party);
    targetChoices(party, cards[0], slots);
    expect(JSON.stringify(party)).toBe(snapshot);
  });
});

// ── A9 — 훈련장 does not touch the gauge at all (PRD §2.7) ─────────────────────────────
// Structural half: the modules that run the 훈련장 must not even be able to reach a gauge.
// The rendered half (readouts byte-identical across a full draft→assign) is in
// e2e/equip.spec.ts.
describe('훈련장 is gauge-blind by construction', () => {
  const TARGETS = ['src/equip/draft.ts', 'src/equip/loadout.ts', 'src/equip/types.ts'];
  const SCREEN_DIR = 'src/screens/training';

  const walk = (dir: string): string[] => {
    if (!existsSync(dir)) return [];
    let out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(walk(full));
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
    }
    return out;
  };

  /** Comments and string literals blanked: prose naming the invariant is not a hit. */
  const blank = (m: string): string => m.replace(/[^\n]/g, ' ');
  const scrub = (source: string): string =>
    source
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, blank);

  const files = TARGETS.map((t) => resolve(demoRoot, t))
    .filter((f) => existsSync(f))
    .concat(walk(resolve(demoRoot, SCREEN_DIR)));

  it('found the 훈련장 sources to scan (the guard is not vacuously green)', () => {
    expect(files.length, 'src/equip and src/screens/training are missing').toBeGreaterThan(0);
  });

  it('carries no gauge reference in executable code', () => {
    const hits: string[] = [];
    for (const file of files) {
      scrub(readFileSync(file, 'utf8'))
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (/\bgauge/i.test(line)) hits.push(`${relative(demoRoot, file)}:${i + 1}`);
        });
    }
    expect(hits, `훈련장 source reaches for the gauge at:\n${hits.join('\n')}`).toEqual([]);
  });
});
