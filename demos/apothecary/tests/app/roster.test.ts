// Roster faces (PR #33, R1 on src/app/roster.ts:111 + R3 on the same line).
//
// The bundled pack ships TWO 4×2 sheets and the shop plays THREE customers, so
// `(portraitPoolIndex + slot) % urls.length` collided by construction: slot 0 and
// slot 2 wore a pixel-identical face in the deployed build (the PR's own stills,
// 02-conversation.png vs 08-c3-conversation.png). At the same time every
// customer's authored `portrait` was schema-required, pointed at a file that does
// not exist, and was read by no code path at all.
//
// Both halves are pinned here: the face a customer wears comes from its own
// authored field, and no two customers of one playthrough look like the same
// person.
import { describe, expect, it } from 'vitest';
import customersData from '../../data/customers.json';
import fallbackNpcs from '../../data/fallback-npcs.json';
import { buildRoster } from '../../src/app/roster';
import { loadCustomers } from '../../src/data/loader';

const roster = buildRoster();

describe('every customer of one playthrough has their own face', () => {
  it('no two slots share a face (sheet + palette variant)', () => {
    const faces = roster.map((entry) => entry.portraitFace);
    expect(new Set(faces).size, `repeated face in ${JSON.stringify(faces)}`).toBe(roster.length);
  });

  it('every slot resolves to a real bundled sheet URL (never a permanent silhouette)', () => {
    for (const entry of roster) {
      expect(entry.bundledPortraitUrl, `slot ${entry.slot}`).toMatch(/fallback-portrait-[12]/);
    }
  });

  it('the two customers that share a sheet are told apart by a palette variant', () => {
    const bySheet = new Map<string, string[]>();
    for (const entry of roster) {
      const variants = bySheet.get(entry.bundledPortraitUrl) ?? [];
      variants.push(entry.portraitVariant ?? 'as-generated');
      bySheet.set(entry.bundledPortraitUrl, variants);
    }
    for (const [sheet, variants] of bySheet) {
      expect(new Set(variants).size, `${sheet} is worn twice under one variant`).toBe(
        variants.length,
      );
    }
  });
});

describe('Customer.portrait is READ, and its values resolve', () => {
  it('each slot wears the sheet its own customer data names', () => {
    for (const entry of roster) {
      expect(
        entry.bundledPortraitUrl.includes(entry.customer.portrait.replace(/\.png$/, '')),
        `slot ${entry.slot} (${entry.customer.id}) wears ${entry.bundledPortraitUrl}, ` +
          `not the authored ${entry.customer.portrait}`,
      ).toBe(true);
    }
  });

  it('every authored portrait names a sheet the pack actually ships', () => {
    const shipped = new Set(fallbackNpcs.portraitPool);
    for (const customer of [...loadCustomers(customersData), fallbackNpcs.customer]) {
      expect(shipped.has(customer.portrait), `${customer.id}: ${customer.portrait}`).toBe(true);
    }
  });

  it('the pack adapter serves each customer its own sheet', async () => {
    for (const entry of roster) {
      const sheet = await entry.packAdapter.portrait({ traits: [] });
      expect(sheet.url, `slot ${entry.slot} pack sheet`).toBe(entry.bundledPortraitUrl);
      // Provenance is required of every producer (CLAUDE.md rule 5).
      expect(sheet.prompt.length).toBeGreaterThan(0);
    }
  });
});
