// Behavioral TDD-Red e2e for u9 — portrait component in a real browser
// (Playwright, chromium/headless). Drives the standalone harness page
// (e2e/harness/portrait/index.html, a vite build input served from dist/) and pins
// the browser-truth half of the unit contract:
//
//   AC3  setTier(n) actually moves the computed background-position by a column,
//        and the layout box (getBoundingClientRect) does not change — swapping the
//        portrait must never reflow.
//   AC4  silhouette is `filter: brightness(0)` on the cell (no compositing, no
//        transparent-background generation), the resolve is animated, and it happens
//        inside the SAME framed panel — identical position and size before/after.
//   AC5  a runtime sheet is displayed only AFTER it passes u3's pixelation, and the
//        cell renders with image-rendering: pixelated.
//
// Harness contract this spec reads (design D10 pattern, same as
// e2e/harness/conversation): the page mounts the real mountPortrait() and exposes
//
//   window.__portrait = {
//     setTier(tier: number): void        // no-op for an out-of-range tier
//     setBlink(blink: boolean): void
//     arrive(): Promise<void>            // load raw sheet -> u3 pixelate -> display
//     cellFor(tier, blink): { backgroundSize, backgroundPosition } | undefined
//     readonly tier: number
//     readonly blink: boolean
//     readonly silhouette: boolean
//     readonly rawUrl: string            // the UN-pixelated runtime sheet (1536x1024)
//     readonly pixelation: {
//       calls: number
//       raw:      { width, height } | null   // source handed to u3
//       expected: { width, height } | null   // u3 sheetPixelSize(raw, pixelFactor)
//       out:      { width, height } | null   // what was actually drawn/displayed
//     }
//   }
//
// testids: portrait-frame (the framed card panel) · portrait-cell (the sliced sheet)
//          layout-probe   (a sibling AFTER the frame — proves nothing below moved)
//
// RED until src/ui/portrait.ts, src/styles/portrait.css, the harness page and its
// vite build-input line exist: `goto` 404s and the testids are absent.
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/portrait/index.html';

// Playwright gate runs with cwd = demos/apothecary.
const GENERATION_JSON = 'data/generation.json';

const TIERS = [0, 1, 2, 3] as const;

interface Size {
  width: number;
  height: number;
}
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface CellStyle {
  backgroundSize: string;
  backgroundPosition: string;
}
interface Pixelation {
  calls: number;
  raw: Size | null;
  expected: Size | null;
  out: Size | null;
}
interface PortraitHarness {
  setTier(tier: number): void;
  setBlink(blink: boolean): void;
  arrive(): Promise<void>;
  cellFor(tier: number, blink: boolean): CellStyle | undefined;
  readonly tier: number;
  readonly blink: boolean;
  readonly silhouette: boolean;
  readonly rawUrl: string;
  readonly pixelation: Pixelation;
}

/** The harness handle, as seen from inside page.evaluate. */
const api = (): PortraitHarness =>
  (window as unknown as { __portrait: PortraitHarness }).__portrait;

function attachErrorCapture(page: Page): { console: string[]; page: string[] } {
  const sink = { console: [] as string[], page: [] as string[] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') sink.console.push(msg.text());
  });
  page.on('pageerror', (err) => sink.page.push(err.message));
  return sink;
}

async function openHarness(page: Page): Promise<{ console: string[]; page: string[] }> {
  const errs = attachErrorCapture(page);
  const response = await page.goto(HARNESS);
  expect(response, 'no navigation response').toBeTruthy();
  expect(response!.ok(), `bad status ${response!.status()} for ${HARNESS}`).toBeTruthy();
  // `preview` falls back to the demo home for an unknown path, which would answer 200
  // with the wrong page — pin the title so a missing build input fails here, loudly and
  // immediately, instead of timing out below.
  expect(await page.title(), `${HARNESS} is not registered as a vite build input`).toMatch(
    /portrait harness/i,
  );
  await page.waitForFunction(
    () => (window as unknown as { __portrait?: unknown }).__portrait !== undefined,
    undefined,
    { timeout: 10_000 },
  );
  await expect(page.getByTestId('portrait-frame')).toBeVisible();
  await expect(page.getByTestId('portrait-cell')).toBeVisible();
  return errs;
}

function css(locator: Locator, prop: string): Promise<string> {
  return locator.evaluate(
    (el, p) => getComputedStyle(el as Element).getPropertyValue(p).trim(),
    prop,
  );
}

/** Rounded layout box — sub-pixel jitter from a repaint is not a reflow. */
async function box(locator: Locator): Promise<Box> {
  const rect = await locator.boundingBox();
  expect(rect, 'element has no layout box').toBeTruthy();
  const round = (n: number) => Math.round(n * 100) / 100;
  return { x: round(rect!.x), y: round(rect!.y), width: round(rect!.width), height: round(rect!.height) };
}

/**
 * First numeric component of a computed `background-position` axis pair.
 * Chromium keeps percentages here, but px would also be a legal computed value, so
 * this returns a comparable number and the assertions only rely on ordering.
 */
function axisValues(position: string): [number, number] {
  const parts = position.trim().split(/\s+/);
  expect(parts.length, `unexpected background-position "${position}"`).toBeGreaterThanOrEqual(2);
  return [Number.parseFloat(parts[0]), Number.parseFloat(parts[1])];
}

function strictlyMonotonic(values: readonly number[]): boolean {
  const up = values.every((v, i) => i === 0 || v > values[i - 1]);
  const down = values.every((v, i) => i === 0 || v < values[i - 1]);
  return up || down;
}

const setTier = (page: Page, tier: number) => page.evaluate((t) => api().setTier(t), tier);
const setBlink = (page: Page, blink: boolean) => page.evaluate((b) => api().setBlink(b), blink);
const state = (page: Page) =>
  page.evaluate(() => ({
    tier: api().tier,
    blink: api().blink,
    silhouette: api().silhouette,
    pixelation: api().pixelation,
    rawUrl: api().rawUrl,
  }));

// ── AC3 — tier columns move, the layout box does not ─────────────────────────
test.describe('portrait component (u9) — AC3 tier columns without reflow', () => {
  test('AC3a harness loads the real component with no console errors', async ({ page }) => {
    const errs = await openHarness(page);
    const cell = page.getByTestId('portrait-cell');
    expect(await css(cell, 'background-repeat')).toContain('no-repeat');
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(errs.console, `console errors: ${errs.console.join(' | ')}`).toEqual([]);
  });

  test('AC3b setTier walks four distinct columns, matching the pure calculation', async ({ page }) => {
    await openHarness(page);
    await page.evaluate(() => api().arrive());
    const cell = page.getByTestId('portrait-cell');

    const xs: number[] = [];
    const ys: number[] = [];
    for (const tier of TIERS) {
      await setTier(page, tier);

      const expected = await page.evaluate((t) => api().cellFor(t, false), tier);
      expect(expected, `cellFor(${tier}, false) must be defined`).toBeTruthy();

      // the component applied exactly the calculated cell...
      const inline = await cell.evaluate((el) => ({
        backgroundSize: (el as HTMLElement).style.backgroundSize,
        backgroundPosition: (el as HTMLElement).style.backgroundPosition,
      }));
      expect(inline.backgroundPosition.replace(/\s+/g, ' ')).toBe(
        expected!.backgroundPosition.replace(/\s+/g, ' '),
      );
      expect(inline.backgroundSize.replace(/\s+/g, ' ')).toBe(
        expected!.backgroundSize.replace(/\s+/g, ' '),
      );

      // ...and the browser actually took it
      const [x, y] = axisValues(await css(cell, 'background-position'));
      xs.push(x);
      ys.push(y);
    }

    expect(new Set(xs).size, `column offsets not distinct: ${xs.join(', ')}`).toBe(4);
    expect(strictlyMonotonic(xs), `columns must step in one direction: ${xs.join(', ')}`).toBe(true);
    expect(new Set(ys).size, 'row must not move while only the tier changes').toBe(1);
  });

  test('AC3c background-size never changes: one cell always fills the panel', async ({ page }) => {
    await openHarness(page);
    await page.evaluate(() => api().arrive());
    const cell = page.getByTestId('portrait-cell');

    const sizes = new Set<string>();
    for (const tier of TIERS) {
      for (const blink of [false, true]) {
        await setTier(page, tier);
        await setBlink(page, blink);
        sizes.add(await css(cell, 'background-size'));
      }
    }
    expect(sizes.size, `background-size drifted: ${[...sizes].join(' / ')}`).toBe(1);
  });

  test('AC3d blink swaps the row of the current column only', async ({ page }) => {
    await openHarness(page);
    await page.evaluate(() => api().arrive());
    const cell = page.getByTestId('portrait-cell');

    for (const tier of TIERS) {
      await setTier(page, tier);
      await setBlink(page, false);
      const open = axisValues(await css(cell, 'background-position'));

      await setBlink(page, true);
      const shut = axisValues(await css(cell, 'background-position'));

      expect(shut[0], `tier ${tier}: column moved on blink`).toBeCloseTo(open[0], 2);
      expect(shut[1], `tier ${tier}: row did not move on blink`).not.toBeCloseTo(open[1], 2);

      const expected = await page.evaluate((t) => api().cellFor(t, true), tier);
      const inline = await cell.evaluate((el) => (el as HTMLElement).style.backgroundPosition);
      expect(inline.replace(/\s+/g, ' ')).toBe(expected!.backgroundPosition.replace(/\s+/g, ' '));

      await setBlink(page, false);
    }
  });

  test('AC3e every tier/blink swap leaves the layout untouched (no reflow)', async ({ page }) => {
    await openHarness(page);
    await page.evaluate(() => api().arrive());

    const frame = page.getByTestId('portrait-frame');
    const cell = page.getByTestId('portrait-cell');
    const probe = page.getByTestId('layout-probe');
    await expect(probe, 'harness must render a sibling below the frame').toBeVisible();

    const baseline = {
      frame: await box(frame),
      cell: await box(cell),
      probe: await box(probe),
      scroll: await page.evaluate(() => document.documentElement.scrollHeight),
    };

    for (const tier of TIERS) {
      for (const blink of [false, true]) {
        await setTier(page, tier);
        await setBlink(page, blink);

        expect(await box(frame), `frame box moved at tier ${tier} blink ${blink}`).toEqual(baseline.frame);
        expect(await box(cell), `cell box moved at tier ${tier} blink ${blink}`).toEqual(baseline.cell);
        expect(await box(probe), `content below moved at tier ${tier} blink ${blink}`).toEqual(baseline.probe);
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(baseline.scroll);
      }
    }
  });

  test('AC3f an out-of-range tier is a silent no-op, not a broken cell', async ({ page }) => {
    const errs = await openHarness(page);
    await page.evaluate(() => api().arrive());
    const cell = page.getByTestId('portrait-cell');

    await setTier(page, 2);
    const before = await css(cell, 'background-position');

    for (const bad of [-1, 4, 99, 1.5, Number.NaN]) {
      await setTier(page, bad);
      expect(await css(cell, 'background-position'), `tier ${bad} changed the cell`).toBe(before);
    }
    expect(await page.evaluate(() => api().tier)).toBe(2);
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
  });
});

// ── AC4 — backlit silhouette resolving inside the same framed panel ──────────
test.describe('portrait component (u9) — AC4 silhouette entry', () => {
  test('AC4a before arrival the cell is filter: brightness(0), with no compositing', async ({ page }) => {
    await openHarness(page);
    expect(await page.evaluate(() => api().silhouette)).toBe(true);

    const cell = page.getByTestId('portrait-cell');
    expect(await css(cell, 'filter')).toMatch(/brightness\(\s*0\s*\)/);

    // "no compositing, no transparent-background generation" (PRD §2.3): the
    // silhouette must not be faked with a blend mode, a mask or a cutout.
    expect(await css(cell, 'mix-blend-mode')).toBe('normal');
    expect(await css(cell, 'mask-image')).toBe('none');
    expect(await css(cell, 'clip-path')).toBe('none');
    expect(await css(cell, 'opacity')).toBe('1');
  });

  test('AC4b arrival clears the silhouette and shows the portrait', async ({ page }) => {
    await openHarness(page);
    const cell = page.getByTestId('portrait-cell');
    expect(await css(cell, 'filter')).toMatch(/brightness\(\s*0\s*\)/);

    await page.evaluate(() => api().arrive());

    expect(await page.evaluate(() => api().silhouette)).toBe(false);
    const filter = await css(cell, 'filter');
    expect(filter === 'none' || /brightness\(\s*1\s*\)/.test(filter), `filter still darkening: ${filter}`).toBe(true);
    expect(await css(cell, 'background-image')).toMatch(/^url\(/);
  });

  test('AC4c the resolve is animated, not an instant pop', async ({ page }) => {
    await openHarness(page);
    const cell = page.getByTestId('portrait-cell');

    const property = await css(cell, 'transition-property');
    const duration = await css(cell, 'transition-duration');
    expect(property, `transition-property: ${property}`).toMatch(/filter|all/);
    const seconds = Math.max(
      ...duration.split(',').map((d) => Number.parseFloat(d) * (d.includes('ms') ? 0.001 : 1)),
    );
    expect(seconds, `transition-duration: ${duration}`).toBeGreaterThan(0);
  });

  test('AC4d the framed panel is the same box before and after arrival', async ({ page }) => {
    await openHarness(page);
    const frame = page.getByTestId('portrait-frame');
    const cell = page.getByTestId('portrait-cell');
    const probe = page.getByTestId('layout-probe');

    const before = { frame: await box(frame), cell: await box(cell), probe: await box(probe) };

    await page.evaluate(() => api().arrive());
    // let any transition settle before re-measuring
    await page.waitForTimeout(600);

    expect(await box(frame), 'the portrait arrived into a different panel').toEqual(before.frame);
    expect(await box(cell), 'the cell resized on arrival').toEqual(before.cell);
    expect(await box(probe), 'arrival pushed the page around').toEqual(before.probe);
  });
});

// ── AC5 — pixelation gate + pixelated rendering ──────────────────────────────
test.describe('portrait component (u9) — AC5 u3 pixelation gate', () => {
  test('AC5a nothing is displayed before pixelation runs', async ({ page }) => {
    await openHarness(page);
    const cell = page.getByTestId('portrait-cell');

    const s = await state(page);
    expect(s.pixelation.calls, 'pixelation ran before arrival').toBe(0);
    expect(s.rawUrl.length, 'harness must provide a raw runtime sheet').toBeGreaterThan(0);

    // the raw, un-pixelated sheet must never reach the element
    const shown = await css(cell, 'background-image');
    expect(shown.includes(s.rawUrl), 'the raw sheet was displayed un-pixelated').toBe(false);
  });

  test('AC5b arrival pixelates through u3 and shows only the pixelated result', async ({ page }) => {
    await openHarness(page);
    await page.evaluate(() => api().arrive());

    const s = await state(page);
    expect(s.pixelation.calls, 'u3 pixelation was skipped').toBe(1);
    expect(s.pixelation.raw, 'no raw size recorded').toBeTruthy();
    expect(s.pixelation.expected, 'no u3 target size recorded').toBeTruthy();
    expect(s.pixelation.out, 'nothing was drawn').toBeTruthy();

    // what was drawn is exactly u3's sheetPixelSize target...
    expect(s.pixelation.out).toEqual(s.pixelation.expected);
    // ...and it really is a downscale, not a pass-through
    expect(s.pixelation.out!.width).toBeLessThan(s.pixelation.raw!.width);
    expect(s.pixelation.out!.height).toBeLessThan(s.pixelation.raw!.height);

    const shown = await css(page.getByTestId('portrait-cell'), 'background-image');
    expect(shown).toMatch(/^url\(/);
    expect(shown.includes(s.rawUrl), 'the displayed sheet is the un-pixelated original').toBe(false);
  });

  test('AC5c the pixel target follows data/generation.json pixelFactor', async ({ page }) => {
    const factor = (JSON.parse(readFileSync(GENERATION_JSON, 'utf8')) as { pixelFactor: number }).pixelFactor;
    expect(Number.isInteger(factor) && factor >= 1, `bad pixelFactor ${factor}`).toBe(true);

    await openHarness(page);
    await page.evaluate(() => api().arrive());
    const { pixelation } = await state(page);

    // sheetCellSize -> sheetPixelSize, recomputed here from the data so a factor
    // change in generation.json fails this gate instead of silently drifting.
    const cellW = Math.max(1, Math.round(pixelation.raw!.width / 4 / factor));
    const cellH = Math.max(1, Math.round(pixelation.raw!.height / 2 / factor));
    expect(pixelation.out).toEqual({ width: cellW * 4, height: cellH * 2 });
  });

  test('AC5d the arrived sheet renders with image-rendering: pixelated', async ({ page }) => {
    await openHarness(page);
    await page.evaluate(() => api().arrive());
    expect(await css(page.getByTestId('portrait-cell'), 'image-rendering')).toBe('pixelated');
  });

  test('AC5e the pixelated sheet still slices into all eight cells after arrival', async ({ page }) => {
    await openHarness(page);
    await page.evaluate(() => api().arrive());
    const cell = page.getByTestId('portrait-cell');

    const seen = new Set<string>();
    for (const tier of TIERS) {
      for (const blink of [false, true]) {
        await setTier(page, tier);
        await setBlink(page, blink);
        seen.add(await css(cell, 'background-position'));
      }
    }
    expect(seen.size, `only ${seen.size} distinct cells: ${[...seen].join(' / ')}`).toBe(8);
  });
});
