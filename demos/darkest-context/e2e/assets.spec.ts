// Behavioral TDD-Red e2e for u16 — ASSET PACK INTEGRATION (PRD §2.8).
// Playwright, chromium/headless, served from the real build (playwright.config.ts), so the
// url()s in src/styles/assets.css go through vite's asset pipeline exactly as they will on
// Pages (base './', nested subpath).
//
// What only a browser can prove, and therefore what lives here:
//   · a present pack file actually PAINTS (computed background-image is a url that 200s)
//   · an absent pack file keeps the u7 CSS fallback (computed value is the gradient)
//   · sheet CELLS are addressed by background-position — 12 / 6 / 12 / 4 distinct values
//   · the two frames are 9-slice border-image
//   · the dungeon strip TILES horizontally
//   · image-rendering resolves to `pixelated` on every slot
//
// The suite is filesystem-driven (Playwright specs run in node), so it is the OWN-SLICE
// GATE both ways: pack present → sprites; pack absent → fallbacks. Nothing here hardcodes
// "the pack exists".
//
// ─────────────────────────── HARNESS CONTRACT (u16 must build) ───────────────────────────
// Page: e2e/harness/assets/index.html + main.ts → served at /e2e/harness/assets/
// It is picked up automatically by the `e2e/harness/*/index.html` glob in vite.config.ts —
// no shared file is edited to add it (that file is frozen for this unit anyway).
//
// main.ts imports src/assets/slots.ts (which imports ../styles/assets.css) plus u7's
// src/styles/slots.css + tokens.css, and mounts, with NO extra styling of its own:
//
//   [data-testid="slot-<id>"]   one element per ASSET_SLOTS entry, carrying that slot's u7
//                               class, plus data-slot-id / data-file. Hero elements also
//                               carry the hero id, monster elements the monster id, in
//                               whatever attribute assets.css keys off — the spec reads the
//                               element, never the selector.
//   [data-testid="hero-cells"]  4×3 = 12 × .slot-hero[data-col][data-row] (one sheet, garrett)
//   [data-testid="mob-cells"]   3×2 =  6 × .slot-mob[data-col][data-row]  (one sheet)
//   [data-testid="icon-cells"]  4×3 = 12 × .slot-card-icon[data-col][data-row]
//   [data-testid="vial-cells"]  4 × .slot-vial[data-state] (calm|uneasy|limit|overload)
//
//   window.__assets = { slots: { id: string; file: string; prop: string; cls: string;
//                                cols: number; rows: number }[] }   // = ASSET_SLOTS
//
// Cell elements set --cell-col / --cell-row only; every pixel number stays u7's.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '..'); // demos/darkest-context/
const ASSET_DIR = resolve(demo, 'assets');

const HARNESS = '/e2e/harness/assets/';

interface SlotInfo {
  id: string;
  file: string;
  prop: string;
  cls: string;
  cols: number;
  rows: number;
}

declare global {
  interface Window {
    __assets?: { slots: SlotInfo[] };
  }
}

const onDisk = (file: string): boolean => existsSync(join(ASSET_DIR, file));

async function open(page: Page): Promise<SlotInfo[]> {
  const response = await page.goto(HARNESS);
  expect(response, `no navigation response for ${HARNESS}`).toBeTruthy();
  expect(response!.ok(), `harness status ${response!.status()} — is the page built?`).toBeTruthy();
  const slots = await page.evaluate(() => window.__assets?.slots);
  expect(slots, 'harness exposes no window.__assets.slots').toBeTruthy();
  expect(slots!.length, 'the harness mounts fewer than the 10 pack slots').toBe(10);
  return slots!;
}

const styleOf = (el: Locator, prop: string): Promise<string> =>
  el.evaluate((node, p) => getComputedStyle(node as Element).getPropertyValue(p).trim(), prop);

/** The image a slot ends up painting, whichever property carries it. */
async function paintedImage(el: Locator, cls: string): Promise<string> {
  const prop = cls.includes('frame') && !cls.includes('card-icon') ? 'border-image-source' : 'background-image';
  return styleOf(el, prop);
}

test.describe('asset pack → u7 slot seam', () => {
  test('every present pack file paints a real image; every absent one keeps the CSS fallback', async ({
    page,
  }) => {
    const slots = await open(page);
    for (const slot of slots) {
      const el = page.getByTestId(`slot-${slot.id}`);
      await expect(el, `slot-${slot.id} is not mounted`).toBeAttached();
      const painted = await paintedImage(el, slot.cls);
      if (onDisk(slot.file)) {
        expect(painted, `${slot.file} is on disk but ${slot.id} paints no url()`).toMatch(/url\(/);
        expect(await styleOf(el, slot.prop), `${slot.prop} is unset on ${slot.id}`).not.toBe('');
      } else {
        expect(painted, `${slot.file} is absent but ${slot.id} still points at a url()`).not.toMatch(
          /url\(/,
        );
        expect(painted, `${slot.id} lost its CSS-only fallback`).toMatch(/gradient/);
      }
    }
  });

  test('no pack image 404s — every requested asset URL is served', async ({ page }) => {
    const bad: string[] = [];
    page.on('response', (res) => {
      if (/\.(png|webp|jpe?g)(\?|$)/i.test(res.url()) && res.status() >= 400) {
        bad.push(`${res.status()} ${res.url()}`);
      }
    });
    await open(page);
    await page.waitForLoadState('networkidle');
    expect(bad, `broken asset requests: ${bad.join(', ')}`).toEqual([]);
  });

  test('the asset harness logs no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    await open(page);
    await page.waitForLoadState('networkidle');
    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('pixel pipeline: every slot upscales with image-rendering: pixelated', async ({ page }) => {
    const slots = await open(page);
    for (const slot of slots) {
      expect(
        await styleOf(page.getByTestId(`slot-${slot.id}`), 'image-rendering'),
        `${slot.id} is not pixelated`,
      ).toBe('pixelated');
    }
  });
});

// ── sheet cells (the -g 'cells' half of AC3) ────────────────────────────────────────────
interface CellGrid {
  testid: string;
  slotId: string;
  cols: number;
  rows: number;
  label: string;
}
const GRIDS: CellGrid[] = [
  { testid: 'hero-cells', slotId: 'hero-garrett', cols: 4, rows: 3, label: 'hero sheet 4×3' },
  { testid: 'mob-cells', slotId: 'mob-spam-golem', cols: 3, rows: 2, label: 'monster sheet 3×2' },
  { testid: 'icon-cells', slotId: 'card-icons', cols: 4, rows: 3, label: 'card-icon sheet 4×3' },
];

test.describe('sheet cells are addressed by background-position', () => {
  for (const grid of GRIDS) {
    test(`${grid.label}: ${grid.cols * grid.rows} cells resolve to that many distinct background-position values`, async ({
      page,
    }) => {
      await open(page);
      const cells = page.getByTestId(grid.testid).locator('[data-col][data-row]');
      await expect(cells, `${grid.testid} does not mount ${grid.cols}×${grid.rows} cells`).toHaveCount(
        grid.cols * grid.rows,
      );
      const positions = await cells.evaluateAll((nodes) =>
        nodes.map((n) => getComputedStyle(n).backgroundPosition),
      );
      expect(
        new Set(positions).size,
        `${grid.label} cells collide: ${positions.join(' | ')}`,
      ).toBe(grid.cols * grid.rows);
    });

    test(`${grid.label}: cells are laid out on one sheet, background-size = cols × rows cells`, async ({
      page,
    }) => {
      await open(page);
      const first = page.getByTestId(grid.testid).locator('[data-col][data-row]').first();
      const [size, cellW, cellH] = await Promise.all([
        styleOf(first, 'background-size'),
        styleOf(first, '--cell-w'),
        styleOf(first, '--cell-h'),
      ]);
      const [w, h] = size.split(/\s+/).map((v) => parseFloat(v));
      expect(w, `${grid.label} sheet width`).toBeCloseTo(grid.cols * parseFloat(cellW), 1);
      expect(h, `${grid.label} sheet height`).toBeCloseTo(grid.rows * parseFloat(cellH), 1);
    });

    test(`${grid.label}: each cell steps by exactly one cell width/height`, async ({ page }) => {
      await open(page);
      const cells = page.getByTestId(grid.testid).locator('[data-col][data-row]');
      const data = await cells.evaluateAll((nodes) =>
        nodes.map((n) => {
          const s = getComputedStyle(n);
          return {
            col: Number((n as HTMLElement).dataset.col),
            row: Number((n as HTMLElement).dataset.row),
            x: parseFloat(s.backgroundPositionX),
            y: parseFloat(s.backgroundPositionY),
            w: parseFloat(s.getPropertyValue('--cell-w')),
            h: parseFloat(s.getPropertyValue('--cell-h')),
          };
        }),
      );
      for (const cell of data) {
        expect(cell.x, `cell ${cell.col},${cell.row} x offset`).toBeCloseTo(-cell.col * cell.w, 1);
        expect(cell.y, `cell ${cell.col},${cell.row} y offset`).toBeCloseTo(-cell.row * cell.h, 1);
      }
    });
  }

  test('vial cells: the four gauge states land on four distinct background-position values', async ({
    page,
  }) => {
    await open(page);
    const vials = page.getByTestId('vial-cells').locator('.slot-vial[data-state]');
    await expect(vials, 'the vial row does not mount 4 states').toHaveCount(4);
    const states = await vials.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.state),
    );
    expect(states.slice().sort()).toEqual(['calm', 'limit', 'overload', 'uneasy']);
    const positions = await vials.evaluateAll((nodes) =>
      nodes.map((n) => getComputedStyle(n).backgroundPosition),
    );
    expect(new Set(positions).size, `vial cells collide: ${positions.join(' | ')}`).toBe(4);
  });

  test('vial cells: the sheet is 4 states wide and 1 tall', async ({ page }) => {
    await open(page);
    const vial = page.getByTestId('vial-cells').locator('.slot-vial[data-state]').first();
    const [size, cellW, cellH] = await Promise.all([
      styleOf(vial, 'background-size'),
      styleOf(vial, '--cell-w'),
      styleOf(vial, '--cell-h'),
    ]);
    const [w, h] = size.split(/\s+/).map((v) => parseFloat(v));
    expect(w).toBeCloseTo(4 * parseFloat(cellW), 1);
    expect(h).toBeCloseTo(1 * parseFloat(cellH), 1);
  });

  test('sheet cells never distort the pixel grid — the displayed sheet keeps the file aspect ratio', async ({
    page,
  }) => {
    const slots = await open(page);
    for (const grid of GRIDS) {
      const slot = slots.find((s) => s.id === grid.slotId);
      if (!slot || !onDisk(slot.file)) continue;
      const first = page.getByTestId(grid.testid).locator('[data-col][data-row]').first();
      const size = await styleOf(first, 'background-size');
      const [w, h] = size.split(/\s+/).map((v) => parseFloat(v));
      const natural = await page.evaluate(
        (url) =>
          new Promise<{ w: number; h: number }>((res, rej) => {
            const img = new Image();
            img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => rej(new Error(`cannot load ${url}`));
            img.src = url;
          }),
        (await styleOf(first, 'background-image')).match(/url\(["']?([^"')]+)/)?.[1] ?? '',
      );
      expect(w / h, `${grid.label} is stretched (${size} vs ${natural.w}×${natural.h})`).toBeCloseTo(
        natural.w / natural.h,
        1,
      );
    }
  });
});

// ── 9-slice frames (the -g '9-slice' half of AC3) ───────────────────────────────────────
test.describe('frames are 9-slice border-image', () => {
  for (const [slotId, label] of [
    ['ui-bubble', '말풍선 frame'],
    ['ui-card-frame', '카드 frame'],
  ] as const) {
    test(`${label}: 9-slice border-image with a non-zero slice and border width`, async ({
      page,
    }) => {
      await open(page);
      const el = page.getByTestId(`slot-${slotId}`);
      const slice = await styleOf(el, 'border-image-slice');
      const width = await styleOf(el, 'border-top-width');
      expect(slice, `${label} has no border-image-slice`).toMatch(/\d/);
      expect(parseFloat(slice), `${label} slice is 0 — corners would be lost`).toBeGreaterThan(0);
      expect(parseFloat(width), `${label} reserves no border box for the 9-slice`).toBeGreaterThan(0);
    });
  }

  test('말풍선 frame: 9-slice fills its interior so the bubble body comes from the art', async ({
    page,
  }) => {
    await open(page);
    expect(await styleOf(page.getByTestId('slot-ui-bubble'), 'border-image-slice')).toMatch(/fill/);
  });

  test('카드 frame: 9-slice leaves its interior open so the CSS type tint shows through', async ({
    page,
  }) => {
    await open(page);
    expect(await styleOf(page.getByTestId('slot-ui-card-frame'), 'border-image-slice')).not.toMatch(
      /fill/,
    );
  });
});

// ── tileable background strip (the -g 'tiling' half of AC3) ─────────────────────────────
test.describe('dungeon background tiling', () => {
  test('tiling: the strip repeats horizontally and never vertically', async ({ page }) => {
    await open(page);
    const bg = page.getByTestId('slot-bg-dungeon');
    expect(await styleOf(bg, 'background-repeat'), 'the strip does not tile horizontally').toMatch(
      /^repeat-x$|^repeat no-repeat$/,
    );
  });

  test('tiling: the strip is scaled to the slot height, so its width is free to repeat', async ({
    page,
  }) => {
    await open(page);
    const bg = page.getByTestId('slot-bg-dungeon');
    const size = await styleOf(bg, 'background-size');
    expect(size, `background-size "${size}" pins the width and would break the walk scroll`).toMatch(
      /^auto\s+100%$|^auto\s+\d/,
    );
    const box = await bg.boundingBox();
    expect(box?.height ?? 0, 'the strip reserves no height').toBeGreaterThan(0);
  });
});
