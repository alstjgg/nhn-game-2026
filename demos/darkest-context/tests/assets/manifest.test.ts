// TDD-Red contract for u16 — ASSET PACK INTEGRATION.
//
// u7 shipped the seam (src/styles/slots.css: one `.slot-*` class per PRD §2.8 asset-table
// row, each reading its image from a `--slot-*` custom property it never assigns). This
// unit is the CONSUMER that fills it, and nothing else:
//
//   · src/styles/assets.css  — assigns the `--slot-*` properties, one url() per pack file
//   · src/assets/slots.ts    — the slot inventory (domain id → pack file → u7 class/prop)
//   · discovery/u16.md       — the missing-slot log PRD §2.8 mandates
//
// Hard rules this file polices, straight out of the PRD and REPO RULE 5:
//   1. NEVER GENERATE IN-RUN — the unit adds no image and never touches tools/asset-gen.
//   2. INV-8 — every file under demos/darkest-context/assets/ is manifested; the manifest
//      is APPEND-ONLY and this unit edits ZERO lines of it (PR #53 already manifested the
//      whole pack).
//   3. MISSING-SLOT POLICY — a pack file that is absent keeps its CSS fallback (assets.css
//      must not reference it) AND is named in discovery/u16.md. Both halves are derived
//      from the filesystem, so this suite passes with the pack present OR absent.
//
// Pure text/JSON analysis (vitest node env, u1's config). Anything that needs a rendered
// box — computed background-position per cell, border-image on the frames, the strip
// tiling — is in e2e/assets.spec.ts.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '..', '..'); // demos/darkest-context/
const repo = resolve(demo, '..', '..'); // repo root

const ASSET_DIR = resolve(demo, 'assets');
const MANIFEST_PATH = resolve(repo, 'assets-manifest.json');
const ASSETS_CSS_PATH = resolve(demo, 'src/styles/assets.css');
const SLOTS_CSS_PATH = resolve(demo, 'src/styles/slots.css');
const SLOTS_TS_PATH = resolve(demo, 'src/assets/slots.ts');
const DISCOVERY_PATH = resolve(demo, 'discovery/u16.md');

const MANIFEST_REL = 'demos/darkest-context/assets';

// ───────────────────────────── the PRD §2.8 pack, frozen ─────────────────────────────
// `cols`/`rows` are the sheet geometry the render column demands; 1×1 means "not a sheet"
// (the tileable strip and the two 9-slice frames). The monster sheet's "2×3" is read as
// 3 cols × 2 rows — the reading u7 already froze in slots.css, and the only one that fits
// "idle · 피격 · 사망 / 공격 3프레임" plus the steps(3) attack loop.
const PACK = [
  { id: 'bg-dungeon', file: 'bg-dungeon.png', prop: '--slot-bg-dungeon', cls: '.slot-bg-dungeon', cols: 1, rows: 1, kind: 'strip' },
  { id: 'hero-garrett', file: 'hero-garrett.png', prop: '--slot-hero', cls: '.slot-hero', cols: 4, rows: 3, kind: 'sheet' },
  { id: 'hero-fiona', file: 'hero-fiona.png', prop: '--slot-hero', cls: '.slot-hero', cols: 4, rows: 3, kind: 'sheet' },
  { id: 'hero-selene', file: 'hero-selene.png', prop: '--slot-hero', cls: '.slot-hero', cols: 4, rows: 3, kind: 'sheet' },
  { id: 'mob-spam-golem', file: 'mob-spam-golem.png', prop: '--slot-mob', cls: '.slot-mob', cols: 3, rows: 2, kind: 'sheet' },
  { id: 'mob-halluc-wisp', file: 'mob-halluc-wisp.png', prop: '--slot-mob', cls: '.slot-mob', cols: 3, rows: 2, kind: 'sheet' },
  { id: 'ui-bubble', file: 'ui-bubble.png', prop: '--slot-bubble-frame', cls: '.slot-bubble-frame', cols: 1, rows: 1, kind: 'frame' },
  { id: 'ui-card-frame', file: 'ui-card-frame.png', prop: '--slot-card-frame', cls: '.slot-card-frame', cols: 1, rows: 1, kind: 'frame' },
  { id: 'card-icons', file: 'card-icons.png', prop: '--slot-card-icon', cls: '.slot-card-icon', cols: 4, rows: 3, kind: 'sheet' },
  { id: 'ui-vial', file: 'ui-vial.png', prop: '--slot-vial', cls: '.slot-vial', cols: 4, rows: 1, kind: 'sheet' },
] as const;

const PACK_FILES: string[] = PACK.map((p) => p.file);
const SLOT_PROPS = [...new Set(PACK.map((p) => p.prop))];

/** Hero / monster domain ids as data/ spells them — the map slots.ts must carry. */
const HERO_IDS = ['garrett', 'fiona', 'selene'] as const;
const MONSTER_IDS = ['spam_golem', 'hallucination_spirit'] as const;

/** The 29 manifest entries that exist before this unit. APPEND-ONLY = unchanged prefix. */
const MANIFEST_PREFIX = [
  'demos/apothecary/assets/bg-shop.png',
  'demos/apothecary/assets/ui-bubble.png',
  'demos/apothecary/assets/ui-shelf.png',
  'demos/apothecary/assets/ingredients-1.png',
  'demos/apothecary/assets/ingredients-2.png',
  'demos/apothecary/assets/equip-teapot.png',
  'demos/apothecary/assets/equip-pot.png',
  'demos/apothecary/assets/equip-mortar.png',
  'demos/apothecary/assets/potions.png',
  'demos/apothecary/assets/fallback-portrait-1.png',
  'demos/apothecary/assets/fallback-portrait-2.png',
  'demos/darkest-context/tools/asset-gen/review/initial-prompt/A.png',
  'demos/darkest-context/tools/asset-gen/review/initial-prompt/B.png',
  'demos/darkest-context/tools/asset-gen/review/initial-prompt/C.png',
  'demos/darkest-context/tools/asset-gen/review/initial-prompt/D.png',
  'demos/darkest-context/tools/asset-gen/review/revised-pipeline/A.png',
  'demos/darkest-context/tools/asset-gen/review/revised-pipeline/B.png',
  'demos/darkest-context/tools/asset-gen/review/revised-pipeline/C.png',
  'demos/darkest-context/tools/asset-gen/review/revised-pipeline/D.png',
  'demos/darkest-context/assets/bg-dungeon.png',
  'demos/darkest-context/assets/hero-garrett.png',
  'demos/darkest-context/assets/hero-fiona.png',
  'demos/darkest-context/assets/hero-selene.png',
  'demos/darkest-context/assets/mob-spam-golem.png',
  'demos/darkest-context/assets/mob-halluc-wisp.png',
  'demos/darkest-context/assets/ui-bubble.png',
  'demos/darkest-context/assets/ui-card-frame.png',
  'demos/darkest-context/assets/card-icons.png',
  'demos/darkest-context/assets/ui-vial.png',
];

// ───────────────────────────────────── helpers ─────────────────────────────────────
const read = (p: string): string => (existsSync(p) ? readFileSync(p, 'utf8') : '');
/** Comment-free CSS: a comment must never be able to satisfy a source assertion. */
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

const RAW_ASSETS_CSS = (): string => read(ASSETS_CSS_PATH);
const ASSETS_CSS = (): string => stripComments(RAW_ASSETS_CSS());
const SLOTS_CSS = (): string => stripComments(read(SLOTS_CSS_PATH));

interface Rule {
  selector: string;
  body: string;
}
function rules(css: string): Rule[] {
  const out: Rule[] = [];
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push({ selector: (selector ?? '').trim(), body: body ?? '' });
  }
  return out;
}

/** Every rule of assets.css that assigns `prop` (as a declaration, not as a var() read). */
function rulesAssigning(prop: string): Rule[] {
  const assign = new RegExp(`(^|[;{\\s])${prop}\\s*:`);
  return rules(ASSETS_CSS()).filter((r) => assign.test(r.body));
}

/** The url() target assigned to `prop` inside a rule body, if any. */
function assignedUrl(body: string, prop: string): string | undefined {
  const decl = body.match(new RegExp(`(?:^|[;{\\s])${prop}\\s*:([^;]*)`));
  return decl?.[1]?.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1]?.trim();
}

/** Declaration property names in a body, e.g. ['--slot-hero', 'background-size']. */
function declaredProps(body: string): string[] {
  return [...body.matchAll(/(^|[;{\s])([-a-zA-Z][-a-zA-Z0-9]*)\s*:/g)].map((m) => m[2]!);
}

interface ManifestEntry {
  file?: string;
  tool?: string;
  source?: string;
  prompt?: string;
  license?: string;
}
function manifest(): { assets: ManifestEntry[] } {
  return JSON.parse(read(MANIFEST_PATH) || '{}') as { assets: ManifestEntry[] };
}
const manifestFiles = (): string[] => (manifest().assets ?? []).map((e) => e.file ?? '');

const IMAGE_RE = /\.(png|webp|jpe?g|gif|svg|avif)$/i;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'test-results', 'playwright-report']);

function walkImages(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkImages(full, acc);
    else if (IMAGE_RE.test(name)) acc.push(full);
  }
  return acc;
}

/** On-disk state of the pack — the whole suite branches on this, never on a hardcode. */
const presentFiles = (): string[] => PACK_FILES.filter((f) => existsSync(join(ASSET_DIR, f)));
const missingFiles = (): string[] => PACK_FILES.filter((f) => !existsSync(join(ASSET_DIR, f)));

// ══════════════════════════════════════════════════════════════════════════════════════
// A. assets-manifest.json — REPO RULE 5 / INV-8. Every test name contains "manifest".
// ══════════════════════════════════════════════════════════════════════════════════════
describe('assets-manifest.json coverage (REPO RULE 5 / INV-8)', () => {
  it('parses and exposes `assets` as an array', () => {
    expect(existsSync(MANIFEST_PATH), `no ${MANIFEST_PATH}`).toBe(true);
    expect(Array.isArray(manifest().assets), 'manifest.assets is not an array').toBe(true);
  });

  it('has an entry for EVERY file under demos/darkest-context/assets/', () => {
    const listed = new Set(manifestFiles());
    const onDisk = existsSync(ASSET_DIR) ? readdirSync(ASSET_DIR) : [];
    const unmanifested = onDisk.filter((f) => !listed.has(`${MANIFEST_REL}/${f}`));
    expect(unmanifested, `unmanifested asset files: ${unmanifested.join(', ')}`).toEqual([]);
  });

  it('gives every pack entry {file, source/tool, prompt, license}', () => {
    for (const entry of (manifest().assets ?? []).filter((e) =>
      (e.file ?? '').startsWith(`${MANIFEST_REL}/`),
    )) {
      expect((entry.tool ?? entry.source ?? '').trim(), `${entry.file}: no tool/source`).not.toBe('');
      expect((entry.prompt ?? '').trim(), `${entry.file}: no prompt`).not.toBe('');
      expect((entry.license ?? '').trim(), `${entry.file}: no license`).not.toBe('');
    }
  });

  it('lists each file exactly once (no duplicate manifest entries)', () => {
    const files = manifestFiles();
    const dupes = files.filter((f, i) => files.indexOf(f) !== i);
    expect(dupes, `duplicate manifest entries: ${dupes.join(', ')}`).toEqual([]);
  });

  it('is APPEND-ONLY — the pre-existing 29 entries survive unchanged, in order', () => {
    expect(manifestFiles().slice(0, MANIFEST_PREFIX.length)).toEqual(MANIFEST_PREFIX);
  });

  it('needs ZERO manifest edits from this unit — the pack is already the PR #53 set', () => {
    const packEntries = manifestFiles().filter((f) => f.startsWith(`${MANIFEST_REL}/`));
    expect(packEntries.sort()).toEqual(PACK_FILES.map((f) => `${MANIFEST_REL}/${f}`).sort());
  });

  it('has no manifest entry pointing at a pack file that is not on disk', () => {
    const phantom = manifestFiles()
      .filter((f) => f.startsWith(`${MANIFEST_REL}/`))
      .filter((f) => !existsSync(resolve(repo, f)));
    // A phantom is only legal if the PRD's missing-slot rule covers it, i.e. the file is a
    // known pack member (then discovery/u16.md logs it — see section E).
    const unknown = phantom.filter((f) => !PACK_FILES.includes(f.slice(MANIFEST_REL.length + 1)));
    expect(unknown, `manifest points at files that never existed: ${unknown.join(', ')}`).toEqual([]);
  });

  it('manifests every file src/styles/assets.css points a url() at', () => {
    const listed = new Set(manifestFiles());
    const referenced = [...ASSETS_CSS().matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) =>
      (m[1] ?? '').split('/').pop(),
    );
    expect(referenced.length, 'assets.css references no pack file at all').toBeGreaterThan(0);
    for (const file of referenced) {
      expect(listed.has(`${MANIFEST_REL}/${file}`), `${file} is used but not manifested`).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════
// B. PRD §2.8 hard rule. Test names contain "no generated files" for the -t filter.
// ══════════════════════════════════════════════════════════════════════════════════════
describe('no generated files (PRD §2.8: never generate assets during the run)', () => {
  it('no generated files: the assets dir is exactly the 10 provided pack files', () => {
    const onDisk = (existsSync(ASSET_DIR) ? readdirSync(ASSET_DIR) : []).sort();
    const expected = presentFiles().slice().sort();
    expect(onDisk, 'a file appeared in assets/ that is not part of the provided pack').toEqual(
      expected,
    );
  });

  it('no generated files: nothing this unit owns invokes tools/asset-gen', () => {
    const owned = [ASSETS_CSS_PATH, SLOTS_TS_PATH, resolve(demo, 'e2e/assets.spec.ts'), DISCOVERY_PATH];
    const FORBIDDEN = /asset-gen\/|generateAsset|gpt-image|images\/generations|openai/i;
    for (const path of owned) {
      const body = read(path);
      if (!body) continue; // absence is section C/D/E's failure to report, not this one's
      const hits = body
        .split('\n')
        .filter((line) => FORBIDDEN.test(line) && !/never|금지|not invoke|하지 않/i.test(line));
      expect(hits, `${path} reaches for the generator: ${hits.join(' / ')}`).toEqual([]);
    }
  });

  it('no generated files: every image under demos/darkest-context/ is manifested', () => {
    const listed = new Set(manifestFiles());
    const stray = walkImages(demo)
      .map((abs) => abs.slice(repo.length + 1))
      .filter((rel) => !listed.has(rel));
    expect(stray, `unmanifested images (generated in-run?): ${stray.join(', ')}`).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════
// C. src/assets/slots.ts — the inventory that maps domain ids onto u7's seam.
// ══════════════════════════════════════════════════════════════════════════════════════
interface AssetSlot {
  id: string;
  file: string;
  prop: string;
  cls: string;
  cols: number;
  rows: number;
}
interface SlotsModule {
  ASSET_SLOTS: readonly AssetSlot[];
  HERO_SLOT_BY_ID: Readonly<Record<string, string>>;
  MONSTER_SLOT_BY_ID: Readonly<Record<string, string>>;
  slotFor: (id: string) => AssetSlot;
}
/** Dynamic so a missing module fails THESE tests instead of collapsing the whole file. */
const loadSlots = async (): Promise<SlotsModule> =>
  (await import('../../src/assets/slots.ts')) as unknown as SlotsModule;

describe('src/assets/slots.ts: the slot inventory', () => {
  it('exists', () => {
    expect(existsSync(SLOTS_TS_PATH), 'no src/assets/slots.ts').toBe(true);
  });

  it('exports ASSET_SLOTS covering all 10 pack files, in PRD §2.8 table order', async () => {
    const { ASSET_SLOTS } = await loadSlots();
    expect(ASSET_SLOTS.map((s) => s.file)).toEqual(PACK_FILES);
  });

  it('gives every slot a unique id', async () => {
    const { ASSET_SLOTS } = await loadSlots();
    expect(new Set(ASSET_SLOTS.map((s) => s.id)).size).toBe(ASSET_SLOTS.length);
  });

  it('invents no class or property name — every one is already declared in slots.css', async () => {
    const { ASSET_SLOTS } = await loadSlots();
    const css = SLOTS_CSS();
    for (const slot of ASSET_SLOTS) {
      expect(css, `${slot.cls} is not a u7 class`).toMatch(
        new RegExp(`\\${slot.cls}(?![\\w-])`),
      );
      expect(css, `${slot.prop} is not a u7 slot property`).toContain(slot.prop);
      expect(SLOT_PROPS, `${slot.prop} is outside the §2.8 slot set`).toContain(slot.prop);
    }
  });

  it('carries the sheet geometry PRD §2.8 states (hero 4×3, mob 3×2, icons 4×3, vial 4×1)', async () => {
    const { ASSET_SLOTS } = await loadSlots();
    for (const expectedSlot of PACK) {
      const actual = ASSET_SLOTS.find((s) => s.file === expectedSlot.file);
      expect(actual, `no slot for ${expectedSlot.file}`).toBeTruthy();
      expect(
        [actual!.cols, actual!.rows],
        `${expectedSlot.file} geometry`,
      ).toEqual([expectedSlot.cols, expectedSlot.rows]);
    }
  });

  it('maps each hero id from data/heroes.json onto its own sheet', async () => {
    const { HERO_SLOT_BY_ID, ASSET_SLOTS } = await loadSlots();
    const files = new Set<string>();
    for (const heroId of HERO_IDS) {
      const slotId = HERO_SLOT_BY_ID[heroId];
      expect(slotId, `no hero sheet mapped for "${heroId}"`).toBeTruthy();
      const slot = ASSET_SLOTS.find((s) => s.id === slotId);
      expect(slot?.prop, `${heroId} is not on the hero slot`).toBe('--slot-hero');
      files.add(slot!.file);
    }
    expect(files.size, 'two heroes share one sheet').toBe(3);
  });

  it('maps each monster id from data/encounters.json onto its own sheet', async () => {
    const { MONSTER_SLOT_BY_ID, ASSET_SLOTS } = await loadSlots();
    const files = new Set<string>();
    for (const monsterId of MONSTER_IDS) {
      const slotId = MONSTER_SLOT_BY_ID[monsterId];
      expect(slotId, `no monster sheet mapped for "${monsterId}"`).toBeTruthy();
      const slot = ASSET_SLOTS.find((s) => s.id === slotId);
      expect(slot?.prop, `${monsterId} is not on the mob slot`).toBe('--slot-mob');
      files.add(slot!.file);
    }
    expect(files.size, 'both monsters share one sheet').toBe(2);
  });

  it('slotFor() returns the slot for a known id', async () => {
    const { slotFor, ASSET_SLOTS } = await loadSlots();
    expect(slotFor(ASSET_SLOTS[0]!.id)).toEqual(ASSET_SLOTS[0]);
  });

  it('slotFor() throws on an unknown id instead of returning undefined', async () => {
    const { slotFor } = await loadSlots();
    expect(() => slotFor('hero-nobody')).toThrow();
  });

  it('stays data-only — no DOM access, so the node test slice can import it', () => {
    const body = read(SLOTS_TS_PATH);
    expect(body, 'slots.ts touches the DOM at module scope').not.toMatch(
      /(^|[^\w.])document\.|(^|[^\w.])window\./,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════
// D. src/styles/assets.css — fills the seam and does nothing else.
// ══════════════════════════════════════════════════════════════════════════════════════
describe('src/styles/assets.css: fills the u7 slot contract', () => {
  it('exists', () => {
    expect(existsSync(ASSETS_CSS_PATH), 'no src/styles/assets.css').toBe(true);
  });

  it('is reachable from the app — src/assets/slots.ts imports it', () => {
    expect(read(SLOTS_TS_PATH), 'nothing imports assets.css, so the seam is never filled').toMatch(
      /import\s+['"]\.\.\/styles\/assets\.css['"]/,
    );
  });

  for (const prop of SLOT_PROPS) {
    it(`assigns ${prop} (the seam slots.css deliberately leaves open)`, () => {
      const files = PACK.filter((p) => p.prop === prop).map((p) => p.file);
      const anyPresent = files.some((f) => presentFiles().includes(f));
      const assigned = rulesAssigning(prop).length > 0;
      // Missing-slot policy: with no file on disk the property must stay UNSET so the
      // slots.css fallback keeps painting (section E asserts the log side of the rule).
      expect(assigned, anyPresent ? `${prop} is never assigned` : `${prop} is assigned but its pack file is absent — the fallback must stay active`).toBe(anyPresent);
    });
  }

  it('declares ONLY custom properties — geometry and paint stay u7-owned', () => {
    for (const rule of rules(ASSETS_CSS())) {
      const offenders = declaredProps(rule.body).filter((p) => !p.startsWith('--'));
      expect(offenders, `"${rule.selector}" redeclares u7 style: ${offenders.join(', ')}`).toEqual(
        [],
      );
    }
  });

  it('invents no new slot class — every .slot-* it selects is declared in slots.css', () => {
    const css = SLOTS_CSS();
    const used = new Set((ASSETS_CSS().match(/\.slot-[a-z0-9-]+/g) ?? []));
    for (const cls of used) {
      expect(css, `${cls} does not exist in slots.css`).toMatch(new RegExp(`\\${cls}(?![\\w-])`));
    }
  });

  it('never restates the pixel pipeline — image-rendering stays in slots.css', () => {
    expect(ASSETS_CSS(), 'assets.css sets image-rendering itself').not.toMatch(/image-rendering\s*:/);
    expect(ASSETS_CSS(), 'assets.css hardcodes the pixelated literal').not.toMatch(
      /:\s*pixelated/,
    );
  });

  it('points every url() at a real file inside the pack directory', () => {
    const urls = [...ASSETS_CSS().matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) =>
      (m[1] ?? '').trim(),
    );
    expect(urls.length, 'assets.css assigns no image at all').toBeGreaterThan(0);
    for (const url of urls) {
      expect(url, `${url} does not resolve into the pack dir`).toMatch(/(^|\/)assets\//);
      const file = url.split('/').pop()!.split('?')[0]!;
      expect(PACK_FILES, `${file} is not a PRD §2.8 pack file`).toContain(file);
      expect(existsSync(resolve(dirname(ASSETS_CSS_PATH), url)), `${url} resolves to nothing`).toBe(
        true,
      );
    }
  });

  it('gives each of the three heroes its own sheet, keyed by the hero id', () => {
    const heroRules = rulesAssigning('--slot-hero');
    const wanted = PACK.filter((p) => p.prop === '--slot-hero' && presentFiles().includes(p.file));
    expect(heroRules.length, 'hero sheets are not assigned one rule each').toBe(wanted.length);
    const seen = new Set<string>();
    for (const heroId of HERO_IDS) {
      const rule = heroRules.find((r) => new RegExp(`\\b${heroId}\\b`).test(r.selector));
      if (!wanted.some((w) => w.file.includes(heroId))) continue;
      expect(rule, `no rule keys --slot-hero off the hero id "${heroId}"`).toBeTruthy();
      const url = assignedUrl(rule!.body, '--slot-hero');
      expect(url, `${heroId}'s rule assigns no url()`).toBeTruthy();
      expect(url!.split('/').pop(), `${heroId} points at the wrong sheet`).toBe(`hero-${heroId}.png`);
      seen.add(url!);
    }
    expect(seen.size, 'two heroes share one sheet url').toBe(wanted.length);
  });

  it('gives each of the two monsters its own sheet, keyed by the encounter id', () => {
    const mobRules = rulesAssigning('--slot-mob');
    const wanted = PACK.filter((p) => p.prop === '--slot-mob' && presentFiles().includes(p.file));
    expect(mobRules.length, 'monster sheets are not assigned one rule each').toBe(wanted.length);
    const byMonster: Record<string, string> = {
      spam_golem: 'mob-spam-golem.png',
      hallucination_spirit: 'mob-halluc-wisp.png',
    };
    const seen = new Set<string>();
    for (const monsterId of MONSTER_IDS) {
      if (!wanted.some((w) => w.file === byMonster[monsterId])) continue;
      const rule = mobRules.find((r) => new RegExp(`\\b${monsterId}\\b`).test(r.selector));
      expect(rule, `no rule keys --slot-mob off the monster id "${monsterId}"`).toBeTruthy();
      const url = assignedUrl(rule!.body, '--slot-mob');
      expect(url?.split('/').pop(), `${monsterId} points at the wrong sheet`).toBe(
        byMonster[monsterId],
      );
      seen.add(url!);
    }
    expect(seen.size, 'both monsters share one sheet url').toBe(wanted.length);
  });

  it('assigns each single-image slot exactly once', () => {
    const SHARED = ['--slot-hero', '--slot-mob'];
    for (const slot of PACK.filter((p) => !SHARED.includes(p.prop))) {
      if (!presentFiles().includes(slot.file)) continue;
      const assigning = rulesAssigning(slot.prop);
      expect(assigning.length, `${slot.prop} is assigned ${assigning.length}×, expected 1`).toBe(1);
      expect(assignedUrl(assigning[0]!.body, slot.prop)?.split('/').pop()).toBe(slot.file);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════
// E. Missing-slot policy. Test names contain "missing slots logged" for the -t filter.
// ══════════════════════════════════════════════════════════════════════════════════════
describe('missing slots logged in discovery/u16.md (PRD §2.8)', () => {
  const MISSING_HEADING = /^#{1,6}\s*missing slots\b/im;

  it('discovery/u16.md exists', () => {
    expect(existsSync(DISCOVERY_PATH), 'no discovery/u16.md').toBe(true);
  });

  it('has a "Missing slots" section listing the ten expected filenames it audited', () => {
    const doc = read(DISCOVERY_PATH);
    expect(doc, 'discovery/u16.md has no "## Missing slots" section').toMatch(MISSING_HEADING);
  });

  it('names every absent pack file, with the exact filename the slot expects', () => {
    const doc = read(DISCOVERY_PATH);
    for (const file of missingFiles()) {
      expect(doc, `${file} is missing but never logged`).toContain(file);
    }
  });

  it('keeps the CSS fallback for every absent file (assets.css must not reference it)', () => {
    const css = ASSETS_CSS();
    for (const file of missingFiles()) {
      expect(css, `${file} is absent but assets.css still points a url() at it`).not.toContain(file);
    }
  });

  it('says so explicitly when the whole pack is present, instead of leaving the log blank', () => {
    if (missingFiles().length > 0) return;
    const section = read(DISCOVERY_PATH).split(MISSING_HEADING)[1] ?? '';
    expect(section.trim(), 'the Missing slots section is empty').not.toBe('');
    expect(section, 'no explicit "none missing" statement').toMatch(/none|없음|0\s*missing|all\s+ten|all\s+10/i);
  });

  it('never logs a file that is actually on disk as missing', () => {
    const section = read(DISCOVERY_PATH).split(MISSING_HEADING)[1] ?? '';
    const claimed = PACK_FILES.filter((f) => section.includes(f));
    const wrong = claimed.filter((f) => presentFiles().includes(f));
    // A present file may still be *mentioned*; what is forbidden is being listed as absent.
    for (const file of wrong) {
      const line = section.split('\n').find((l) => l.includes(file)) ?? '';
      expect(
        /missing|absent|없음|누락/i.test(line),
        `${file} is on disk but the log calls it missing: "${line.trim()}"`,
      ).toBe(false);
    }
  });

  it('fills the slot for every file that IS present (own-slice gate, pack present)', () => {
    const css = ASSETS_CSS();
    for (const file of presentFiles()) {
      expect(css, `${file} is on disk but no slot uses it`).toContain(file);
    }
  });
});
