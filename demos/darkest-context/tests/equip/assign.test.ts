// u12 — TDD-Red for the equip core: slot capacity, the duplicate rule, free assignment.
// Covers A6 (engine never picks), A8 (no discard flow), A10 (duplicate), A12 (capacity).
//
// GATE NOTE — `npx vitest run tests/equip/assign.test.ts -t duplicate` is an acceptance
// criterion, so the word "duplicate" appears in a describe/it title ONLY inside the block
// that tests PRD §2.3's duplicate rule. Everywhere else the rule is named in prose.
//
// Pure node env (vitest.config.ts is `environment: 'node'`): this file may import
// `src/equip/**` only — those modules touch no `document` and import no CSS.
//
// RED on arrival: src/equip/{types,loadout}.ts do not exist yet, so this module fails to
// resolve and every run — filtered or not — fails with it.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canEquip, createLoadout, equipCard, remainingCapacity } from '../../src/equip/loadout';
import type { PartyLoadout } from '../../src/equip/types';

import { loadBundledGameData } from '../../src/data/loader';
import type { Card, SlotKind } from '../../src/data/schema';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '../..'); // demos/darkest-context/

const { cards, tuning } = loadBundledGameData();
const slots = tuning.slots;

/** Real cards, grouped by the slot they consume — fixtures stay data-driven. */
const byKind = (kind: SlotKind): Card[] => cards.filter((c) => c.slotKind === kind);
const card = (id: string): Card => {
  const found = cards.find((c) => c.id === id);
  if (!found) throw new Error(`fixture card missing from data/cards.json: ${id}`);
  return found;
};

const PARTY = ['garrett', 'fiona', 'selene'] as const;
const fresh = (): PartyLoadout => createLoadout([...PARTY]);

/** Total cards held by one unit — used to prove nothing moved. */
const heldBy = (party: PartyLoadout, unitId: string): string[] =>
  party.units.find((u) => u.unitId === unitId)?.equipped.map((e) => e.cardId) ?? [];

describe('createLoadout', () => {
  it('gives every requested unit an empty loadout, in party order', () => {
    const party = fresh();
    expect(party.units.map((u) => u.unitId)).toEqual([...PARTY]);
    expect(party.units.every((u) => u.equipped.length === 0)).toBe(true);
  });

  it('starts a finite monotonic seq counter (the determinism seam — no RNG)', () => {
    const party = fresh();
    expect(Number.isFinite(party.nextSeq)).toBe(true);
  });
});

describe('remainingCapacity', () => {
  it('reports the full per-kind capacity from tuning.slots for an empty unit', () => {
    const party = fresh();
    expect(remainingCapacity(party, 'garrett', slots)).toEqual({
      prompt: slots.prompt,
      skill: slots.skill,
      mcp: slots.mcp,
    });
  });

  it('spends only the equipped card kind, and only on the unit that got it', () => {
    const skill = byKind('skill')[0];
    const after = equipCard(fresh(), 'garrett', skill, slots);

    expect(remainingCapacity(after, 'garrett', slots)).toEqual({
      prompt: slots.prompt,
      skill: slots.skill - 1,
      mcp: slots.mcp,
    });
    expect(remainingCapacity(after, 'fiona', slots)).toEqual({
      prompt: slots.prompt,
      skill: slots.skill,
      mcp: slots.mcp,
    });
  });
});

describe('canEquip / equipCard — the assignment rules of PRD §2.3', () => {
  it('accepts any card onto any empty unit', () => {
    const party = fresh();
    for (const c of cards) {
      for (const unitId of PARTY) {
        expect(canEquip(party, unitId, c, slots), `${c.id} → ${unitId}`).toEqual({ ok: true });
      }
    }
  });

  it('A6 free assignment: every card reaches every unit the player aims it at', () => {
    // The engine narrows nothing. Each (card, unit) pair below is chosen by the caller,
    // never by the module, and each one lands.
    for (const c of cards) {
      for (const unitId of PARTY) {
        const after = equipCard(fresh(), unitId, c, slots);
        expect(heldBy(after, unitId)).toEqual([c.id]);
      }
    }
  });

  it('A6 engine never picks: reading capacity or legality mutates no loadout', () => {
    const party = fresh();
    const before = JSON.stringify(party);
    canEquip(party, 'garrett', cards[0], slots);
    remainingCapacity(party, 'garrett', slots);
    expect(JSON.stringify(party)).toBe(before);
  });

  it('returns a new party and leaves the input untouched (pure, new-state-returning)', () => {
    const party = fresh();
    const snapshot = JSON.stringify(party);
    const after = equipCard(party, 'garrett', cards[0], slots);

    expect(after).not.toBe(party);
    expect(JSON.stringify(party), 'equipCard mutated its input').toBe(snapshot);
    expect(heldBy(after, 'garrett')).toEqual([cards[0].id]);
  });

  it('stamps a strictly increasing seq and advances nextSeq on every equip', () => {
    const [p1, p2, p3] = byKind('prompt');
    const a = equipCard(fresh(), 'garrett', p1, slots);
    const b = equipCard(a, 'fiona', p2, slots);
    const c = equipCard(b, 'garrett', p3, slots);

    const seqs = c.units.flatMap((u) => u.equipped.map((e) => e.seq));
    expect(new Set(seqs).size, 'seq collision — the earliest-equipped pick would tie').toBe(
      seqs.length,
    );
    expect([...seqs].sort((x, y) => x - y)).toEqual(seqs.slice().sort((x, y) => x - y));
    expect(c.nextSeq).toBeGreaterThan(b.nextSeq);
    expect(b.nextSeq).toBeGreaterThan(a.nextSeq);
  });

  it('records the slot kind the card consumed on the equipped entry', () => {
    const mcp = byKind('mcp')[0];
    const after = equipCard(fresh(), 'selene', mcp, slots);
    expect(after.units.find((u) => u.unitId === 'selene')!.equipped[0].slotKind).toBe(mcp.slotKind);
  });

  it('rejects an unknown unit id instead of inventing a loadout', () => {
    expect(canEquip(fresh(), 'nobody', cards[0], slots)).toEqual({
      ok: false,
      reason: 'unknown-unit',
    });
    expect(() => equipCard(fresh(), 'nobody', cards[0], slots)).toThrow();
  });

  it("A12 reports 'full' once the kind's capacity on that unit is spent", () => {
    const prompts = byKind('prompt');
    expect(prompts.length, 'need capacity+1 distinct prompt cards in data').toBeGreaterThan(
      slots.prompt,
    );

    let party = fresh();
    for (let i = 0; i < slots.prompt; i += 1) {
      party = equipCard(party, 'garrett', prompts[i], slots);
    }
    const overflow = prompts[slots.prompt];

    expect(canEquip(party, 'garrett', overflow, slots)).toEqual({ ok: false, reason: 'full' });
    expect(() => equipCard(party, 'garrett', overflow, slots)).toThrow();
    // A full unit blocks nothing elsewhere — the same card still reaches a fresh unit.
    expect(canEquip(party, 'fiona', overflow, slots)).toEqual({ ok: true });
  });

  it('a full kind never blocks a different kind on the same unit', () => {
    const prompts = byKind('prompt');
    let party = fresh();
    for (let i = 0; i < slots.prompt; i += 1) {
      party = equipCard(party, 'garrett', prompts[i], slots);
    }
    expect(canEquip(party, 'garrett', byKind('skill')[0], slots)).toEqual({ ok: true });
  });
});

// ── PRD §2.3 duplicate rule — the ONLY block whose titles carry the gate word ──────────
describe('duplicate', () => {
  it('blocks a second copy on the unit that already holds the card', () => {
    const c = card('fearless');
    const party = equipCard(fresh(), 'garrett', c, slots);
    expect(canEquip(party, 'garrett', c, slots)).toEqual({ ok: false, reason: 'duplicate' });
    expect(() => equipCard(party, 'garrett', c, slots)).toThrow();
  });

  it('still lets a different unit take the second copy — the party may hold both', () => {
    const c = card('fearless');
    const one = equipCard(fresh(), 'garrett', c, slots);
    expect(canEquip(one, 'fiona', c, slots)).toEqual({ ok: true });

    const two = equipCard(one, 'fiona', c, slots);
    expect(heldBy(two, 'garrett')).toEqual([c.id]);
    expect(heldBy(two, 'fiona')).toEqual([c.id]);
  });

  it('wins over a full slot when both apply, so the picker reports the real cause', () => {
    const prompts = byKind('prompt');
    let party = fresh();
    for (let i = 0; i < slots.prompt; i += 1) {
      party = equipCard(party, 'garrett', prompts[i], slots);
    }
    // garrett's prompt slots are full AND he already holds prompts[0].
    expect(canEquip(party, 'garrett', prompts[0], slots)).toEqual({
      ok: false,
      reason: 'duplicate',
    });
  });

  it('is keyed by card id, not by slot kind — a sibling card of the same kind is fine', () => {
    const [p1, p2] = byKind('prompt');
    const party = equipCard(fresh(), 'garrett', p1, slots);
    expect(canEquip(party, 'garrett', p2, slots)).toEqual({ ok: true });
  });
});

// ── A8 — 강제 배분 is cut: no discard flow exists anywhere in this unit's source ───────
describe('no discard flow exists (강제 배분 cut)', () => {
  const ROOTS = ['src/equip', 'src/screens/training', 'src/screens/rest'];

  const walk = (dir: string): string[] => {
    if (!existsSync(dir)) return [];
    let out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(walk(full));
      else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full);
    }
    return out;
  };

  const files = ROOTS.flatMap((r) => walk(resolve(demoRoot, r))).concat(
    existsSync(resolve(demoRoot, 'src/styles/equip.css'))
      ? [resolve(demoRoot, 'src/styles/equip.css')]
      : [],
  );

  it('found u12 sources to scan (the guard is not vacuously green)', () => {
    expect(files.length, 'nothing scanned — src/equip and src/screens are missing').toBeGreaterThan(
      0,
    );
  });

  it('mentions no discard module, class, testid or deny reason', () => {
    const hits: string[] = [];
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (/discard/i.test(line)) {
            hits.push(`${relative(demoRoot, file)}:${i + 1}: ${line.trim()}`);
          }
        });
    }
    expect(hits, `discard flow leaked back in:\n${hits.join('\n')}`).toEqual([]);
  });

  it('never surfaces a discard deny reason: over-capacity is reported as full', () => {
    const prompts = byKind('prompt');
    let party = fresh();
    for (let i = 0; i < slots.prompt; i += 1) {
      party = equipCard(party, 'garrett', prompts[i], slots);
    }
    const check = canEquip(party, 'garrett', prompts[slots.prompt], slots);
    expect(check.ok).toBe(false);
    expect(JSON.stringify(check)).not.toMatch(/discard/i);
  });
});
