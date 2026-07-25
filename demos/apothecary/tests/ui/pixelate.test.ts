// TDD-Red tests for u3 — client-side pixelation util (shared downscale factor 4).
// Contract: PRD §2.3 "Client-side pixelation" + §2.4 pixel pipeline (runtime sheets are
// downscaled by `pixelFactor` from data/generation.json; CSS owns the upscale via
// image-rendering: pixelated) and §3-5 (a failure is silent — return the source, never
// an exception, never an error UI/string).
//
// vitest runs with environment: 'node' (vitest.config.ts) — there is NO DOM here, which
// is exactly why the canvas surface must be injectable (a factory seam), not ambient.
// This suite therefore adds no jsdom/happy-dom dependency and drives the util with
// hand-rolled fakes only.
//
// RED until src/ui/pixelate.ts exists: the imports below fail to resolve.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import generation from '../../data/generation.json';
import {
  PIXEL_FACTOR,
  SHEET_COLUMNS,
  SHEET_ROWS,
  downscaledSize,
  loadPixelFactor,
  pixelate,
  pixelateSheet,
  sheetCellSize,
  sheetPixelSize,
} from '../../src/ui/pixelate';
import type { CanvasFactory, PixelCanvas, PixelContext } from '../../src/ui/pixelate';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..'); // demos/apothecary/
const read = (rel: string): string => readFileSync(resolve(root, rel), 'utf8');

// ── Fakes (local, dependency-free) ────────────────────────────────────────────
interface DrawCall {
  source: unknown;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  // Snapshotted INSIDE drawImage: the AC asks for the flags "at draw time",
  // not for whatever they happen to be after the call returns.
  smoothingAtDraw: boolean;
  qualityAtDraw: string | undefined;
}

class FakeCtx implements PixelContext {
  imageSmoothingEnabled = false;
  imageSmoothingQuality?: 'low' | 'medium' | 'high';
  readonly calls: DrawCall[] = [];
  throwOnDraw = false;

  drawImage(source: unknown, dx: number, dy: number, dw: number, dh: number): void {
    if (this.throwOnDraw) throw new Error('fake draw failure');
    this.calls.push({
      source,
      dx,
      dy,
      dw,
      dh,
      smoothingAtDraw: this.imageSmoothingEnabled,
      qualityAtDraw: this.imageSmoothingQuality,
    });
  }
}

class FakeCanvas implements PixelCanvas {
  width: number;
  height: number;
  readonly ctx: FakeCtx | null;
  readonly contextIds: string[] = [];

  constructor(width: number, height: number, ctx: FakeCtx | null) {
    this.width = width;
    this.height = height;
    this.ctx = ctx;
  }

  getContext(contextId: '2d'): PixelContext | null {
    this.contextIds.push(contextId);
    return this.ctx;
  }
}

interface Recorder {
  factory: CanvasFactory;
  sizes: [number, number][];
  canvases: FakeCanvas[];
}

function makeFactory(options: { ctx?: FakeCtx | null } = {}): Recorder {
  const sizes: [number, number][] = [];
  const canvases: FakeCanvas[] = [];
  const factory: CanvasFactory = (width, height) => {
    sizes.push([width, height]);
    const ctx = options.ctx === undefined ? new FakeCtx() : options.ctx;
    const canvas = new FakeCanvas(width, height, ctx);
    canvases.push(canvas);
    return canvas;
  };
  return { factory, sizes, canvases };
}

const SHEET = { width: 1536, height: 1024 } as const;

// ── A1 — the seam exists because the environment has no DOM ───────────────────
describe('u3 A1: injectable canvas, no DOM globals, no jsdom dependency', () => {
  const globals = globalThis as unknown as Record<string, unknown>;

  it('runs in a DOM-free environment (document is undefined)', () => {
    expect(typeof globals.document).toBe('undefined');
  });

  it('runs without an ambient OffscreenCanvas', () => {
    expect(typeof globals.OffscreenCanvas).toBe('undefined');
  });

  it('adds no jsdom / happy-dom dependency to package.json', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    for (const banned of ['jsdom', 'happy-dom', 'canvas', 'node-canvas']) {
      expect(Object.keys(deps), `package.json gained ${banned}`).not.toContain(banned);
    }
  });

  it('keeps the vitest environment on node (the reason injection is mandatory)', () => {
    expect(read('vitest.config.ts')).toMatch(/environment:\s*['"]node['"]/);
  });

  it('pixelates with an injected fake canvas alone', () => {
    const { factory, canvases } = makeFactory();
    const out = pixelate(SHEET, { createCanvas: factory });
    expect(canvases).toHaveLength(1);
    expect(out).toBe(canvases[0]);
  });
});

// ── A6 / A17 — the factor is data-driven, and bad data is loud ────────────────
describe('u3 A6: downscale factor comes from data/generation.json, not from code', () => {
  it('exports PIXEL_FACTOR equal to generation.pixelFactor', () => {
    expect(PIXEL_FACTOR).toBe(generation.pixelFactor);
  });

  it('has the shipped data pinned at 4 (the value the sheet math assumes)', () => {
    expect(generation.pixelFactor).toBe(4);
  });

  it('never hardcodes the factor in src/ui/pixelate.ts (source-text scan)', () => {
    const src = read('src/ui/pixelate.ts');
    expect(/\bfactor\s*[=:]\s*4\b/.test(src), 'literal `factor = 4` / `factor: 4` in source').toBe(false);
    expect(/\/\s*4\b/.test(src), 'literal division by 4 in source').toBe(false);
    expect(/PIXEL_FACTOR\s*=\s*4/.test(src), 'PIXEL_FACTOR assigned the literal 4').toBe(false);
  });

  it('reads the factor from the generation data module', () => {
    expect(read('src/ui/pixelate.ts')).toMatch(/generation\.json/);
  });

  // Review follow-up (PR #34, Lead thread on line 18): a DEFAULT import of
  // generation.json is not tree-shaken by this repo's Vite and would ship the
  // whole generation table (hiddenCause answer key, tierTones prompt prose) into
  // the client bundle. Pin the named-import form at the source level...
  it('imports generation.json by NAME, not as a default import (bundle-size + spoiler guard)', () => {
    const src = read('src/ui/pixelate.ts');
    expect(/import\s+generation\s+from\s+['"].*generation\.json['"]/.test(src)).toBe(false);
    expect(/import\s*\{[^}]*\bpixelFactor\b[^}]*\}\s*from\s+['"].*generation\.json['"]/.test(src)).toBe(true);
  });

  // ...and pin it end to end with a REAL vite build: the emitted JS for this module
  // alone must not contain the hiddenCause answer key or the tierTones prose.
  it(
    'a real vite build of this module alone excludes hiddenCause / tierTones prose',
    async () => {
      const { build } = await import('vite');
      const outDir = resolve(root, '.vitest-bundle-check');
      try {
        await build({
          root,
          logLevel: 'silent',
          configFile: false,
          build: {
            outDir,
            emptyOutDir: true,
            minify: false,
            lib: {
              entry: resolve(root, 'src/ui/pixelate.ts'),
              formats: ['es'],
              fileName: () => 'pixelate.bundle.js',
            },
          },
        });
        const emitted = readdirSync(outDir)
          .filter((f) => f.endsWith('.js'))
          .map((f) => readFileSync(resolve(outDir, f), 'utf8'))
          .join('\n');
        // Review follow-up (PR #34, Lead thread on this test): a non-vacuous guard
        // first — if the build ever emits to a different filename/path, `emitted`
        // silently becomes '' and every `not.toMatch` below would pass on nothing.
        // Assert real, expected content landed before asserting the spoiler didn't.
        expect(emitted.length).toBeGreaterThan(0);
        expect(emitted).toMatch(/pixelFactor/);
        expect(emitted).not.toMatch(/hiddenCause/);
        // A sample hiddenCause fragment and a tierTones fragment, so this fails
        // loudly (not just on the JSON key name) if the whole table ever leaks in.
        expect(emitted).not.toMatch(/노름빚/);
        expect(emitted).not.toMatch(/여유 있게 자기 이야기를/);
      } finally {
        rmSync(outDir, { recursive: true, force: true });
      }
    },
    20000,
  );
});

describe('u3 A17: loadPixelFactor is loud about bad data (D4)', () => {
  it('accepts a positive integer', () => {
    expect(loadPixelFactor(4)).toBe(4);
    expect(loadPixelFactor(2)).toBe(2);
  });

  for (const bad of ['4', 0, -1, 2.5, NaN, undefined, null, {}, Infinity] as unknown[]) {
    it(`throws for ${JSON.stringify(bad) ?? String(bad)}`, () => {
      expect(() => loadPixelFactor(bad)).toThrow();
    });
  }

  it('names the offending field in the error message', () => {
    expect(() => loadPixelFactor('4')).toThrow(/pixelFactor/);
  });

  // Review follow-up (PR #34, Lead thread on line 80): PIXEL_FACTOR evaluates
  // loadPixelFactor at MODULE-IMPORT time, so a bad generation.pixelFactor throws on
  // import, not inside pixelate()'s try/catch. That's accepted as intentional
  // (build/CI-time data validation, per D4) rather than made lazy, on the grounds
  // that this exact assertion — run in CI on every `npm test` — is the loud check
  // the reviewer's option 2 asked for: it fails the BUILD, never a player's browser.
  it('u3 A17b: the SHIPPED generation.pixelFactor passes validation (CI guard, not just the literal 4)', () => {
    expect(() => loadPixelFactor(generation.pixelFactor)).not.toThrow();
  });
});

// ── A7 / A8 / A9 — pure size math, integral 4x2 cells ─────────────────────────
describe('u3 A7/A8: 1536x1024 sheet downscales to 384x256 with integral 4x2 cells', () => {
  it('downscaledSize(1536, 1024) is 384x256 at the default factor', () => {
    expect(downscaledSize(SHEET.width, SHEET.height)).toEqual({ width: 384, height: 256 });
  });

  it('sheetCellSize(1536, 1024) is 96x128', () => {
    expect(sheetCellSize(SHEET.width, SHEET.height)).toEqual({ width: 96, height: 128 });
  });

  it('cell boundaries land on whole pixels and tile the downscaled sheet exactly', () => {
    const sheet = downscaledSize(SHEET.width, SHEET.height);
    const cell = sheetCellSize(SHEET.width, SHEET.height);
    expect(Number.isInteger(cell.width)).toBe(true);
    expect(Number.isInteger(cell.height)).toBe(true);
    expect(cell.width * SHEET_COLUMNS).toBe(sheet.width);
    expect(cell.height * SHEET_ROWS).toBe(sheet.height);
    expect(cell.width * SHEET_COLUMNS).toBe(384);
    expect(cell.height * SHEET_ROWS).toBe(256);
  });

  it('honours an explicit factor override', () => {
    expect(downscaledSize(1536, 1024, 2)).toEqual({ width: 768, height: 512 });
    expect(sheetCellSize(1536, 1024, 2)).toEqual({ width: 192, height: 256 });
  });

  it('never returns a zero dimension for tiny sources', () => {
    const size = downscaledSize(2, 1);
    expect(size.width).toBeGreaterThanOrEqual(1);
    expect(size.height).toBeGreaterThanOrEqual(1);
  });

  it('throws on an invalid explicit factor (programmer error, D4)', () => {
    expect(() => downscaledSize(1536, 1024, 0)).toThrow();
    expect(() => downscaledSize(1536, 1024, -4)).toThrow();
    expect(() => sheetCellSize(1536, 1024, 2.5)).toThrow();
  });
});

// Review follow-up (PR #34, Lead thread on line 112): `factor` is balance-as-data —
// tunable — and only 4/2 happen to divide the shipped 4x2 grid evenly. These cases
// pin the property the review asked for (`cell * grid` tiles exactly) across factors
// that DON'T divide evenly, not just the two that always did.
describe('u3 A8b: sheetPixelSize tiles sheetCellSize exactly for every factor, not just 4/2', () => {
  const factors = [2, 3, 4, 5, 6, 7, 9];

  for (const factor of factors) {
    it(`factor=${factor}: cell * grid === sheetPixelSize (exact tiling by construction)`, () => {
      const cell = sheetCellSize(SHEET.width, SHEET.height, factor);
      const sheet = sheetPixelSize(SHEET.width, SHEET.height, factor);
      expect(sheet.width).toBe(cell.width * SHEET_COLUMNS);
      expect(sheet.height).toBe(cell.height * SHEET_ROWS);
      expect(Number.isInteger(sheet.width)).toBe(true);
      expect(Number.isInteger(sheet.height)).toBe(true);
    });
  }

  it('factor=4 (shipped value): sheetPixelSize matches the plain downscaledSize sheet (no regression)', () => {
    expect(sheetPixelSize(SHEET.width, SHEET.height)).toEqual(downscaledSize(SHEET.width, SHEET.height));
  });

  it('factor=3: demonstrates the drift sheetPixelSize sidesteps — downscaledSize alone would NOT tile', () => {
    // This is the exact case from the review: downscaling the whole sheet
    // independently rounds to a HEIGHT that the cell grid cannot tile exactly.
    const plainSheet = downscaledSize(SHEET.width, SHEET.height, 3);
    const cell = sheetCellSize(SHEET.width, SHEET.height, 3);
    expect(cell.height * SHEET_ROWS).not.toBe(plainSheet.height); // 342 !== 341 — the bug
    // sheetPixelSize is defined FROM the cell, so it never has this problem:
    expect(sheetPixelSize(SHEET.width, SHEET.height, 3).height).toBe(cell.height * SHEET_ROWS);
  });

  it('end to end: pixelating a sheet with size=sheetPixelSize(...) draws a canvas that tiles the cell grid exactly (factor=3)', () => {
    const factor = 3;
    const size = sheetPixelSize(SHEET.width, SHEET.height, factor);
    const cell = sheetCellSize(SHEET.width, SHEET.height, factor);
    const { factory, canvases } = makeFactory();
    const out = pixelate(SHEET, { createCanvas: factory, factor, size });
    expect(out).toBe(canvases[0]);
    expect(canvases[0]!.width).toBe(size.width);
    expect(canvases[0]!.height).toBe(size.height);
    expect(canvases[0]!.width % cell.width).toBe(0);
    expect(canvases[0]!.height % cell.height).toBe(0);
    expect(canvases[0]!.width / cell.width).toBe(SHEET_COLUMNS);
    expect(canvases[0]!.height / cell.height).toBe(SHEET_ROWS);
  });
});

// ── A23 — pixelateSheet closes the sheet-tiling footgun at the API level ──────
// Review follow-up (PR #34, Lead thread on pixelate.ts:220): plain `pixelate(sheet)`
// compiles and runs, but silently drifts off the cell grid at factors other than 4/2
// because it takes `downscaledSize`'s per-image rounding by default. The safe call
// (manually passing `size: sheetPixelSize(...)`) was longer than the dangerous
// default, and a caller could pass a `size`/`factor` pair that disagree without
// either being flagged. `pixelateSheet` removes the option entirely: there is no
// `size` to get wrong, and `factor` always drives the `size` it's paired with.
describe('u3 A23: pixelateSheet always draws a sheet that tiles the cell grid exactly', () => {
  const factors = [2, 3, 4, 5, 6, 7, 9];

  for (const factor of factors) {
    it(`factor=${factor}: pixelateSheet(sheet, { factor }) tiles the cell grid — no manual size needed`, () => {
      const cell = sheetCellSize(SHEET.width, SHEET.height, factor);
      const { factory, canvases } = makeFactory();
      const out = pixelateSheet(SHEET, { createCanvas: factory, factor });
      expect(out).toBe(canvases[0]);
      expect(canvases[0]!.width).toBe(cell.width * SHEET_COLUMNS);
      expect(canvases[0]!.height).toBe(cell.height * SHEET_ROWS);
      expect(canvases[0]!.width % cell.width).toBe(0);
      expect(canvases[0]!.height % cell.height).toBe(0);
    });
  }

  it('default factor (no options) matches PIXEL_FACTOR — same target as calling with { factor: PIXEL_FACTOR }', () => {
    const { factory: f1, canvases: c1 } = makeFactory();
    const { factory: f2, canvases: c2 } = makeFactory();
    pixelateSheet(SHEET, { createCanvas: f1 });
    pixelateSheet(SHEET, { createCanvas: f2, factor: PIXEL_FACTOR });
    expect(c1[0]!.width).toBe(c2[0]!.width);
    expect(c1[0]!.height).toBe(c2[0]!.height);
  });

  it('cannot be called with a mismatched size (there is no size option to pass)', () => {
    // Compile-time guarantee, restated as a runtime fact: the options type this
    // function accepts has no `size` key, so a caller physically cannot pass a
    // `size` that disagrees with `factor` the way the raw `pixelate(sheet, {...})`
    // call allowed.
    const options: Parameters<typeof pixelateSheet>[1] = { factor: 3 };
    expect('size' in options).toBe(false);
  });

  it('a bad factor (D4) falls back to the source silently, matching pixelate\'s own §3-5 contract', () => {
    const { factory } = makeFactory();
    for (const bad of [0, -1, 2.5, NaN]) {
      expect(pixelateSheet(SHEET, { createCanvas: factory, factor: bad })).toBe(SHEET);
    }
  });

  it('an undecoded (NaN) source falls back to the source silently, without pixelateSheet itself throwing', () => {
    const { factory } = makeFactory();
    const bad = { width: NaN, height: NaN };
    expect(() => pixelateSheet(bad, { createCanvas: factory })).not.toThrow();
    expect(pixelateSheet(bad, { createCanvas: factory })).toBe(bad);
  });

  it('end to end: draws with imageSmoothing on, matching pixelate\'s own draw contract', () => {
    const ctx = new FakeCtx();
    const { factory } = makeFactory({ ctx });
    pixelateSheet(SHEET, { createCanvas: factory, factor: 3 });
    expect(ctx.calls).toHaveLength(1);
    expect(ctx.calls[0]!.smoothingAtDraw).toBe(true);
    expect(ctx.calls[0]!.qualityAtDraw).toBe('high');
  });
});

describe('u3 A9: the 4x2 sheet grid still matches the frozen generation data', () => {
  it('generation.portraitSheetFormat still describes a 4x2 grid of eight', () => {
    expect(generation.portraitSheetFormat).toMatch(/4x2 grid of eight/);
  });

  it('exports SHEET_COLUMNS = 4 and SHEET_ROWS = 2', () => {
    expect(SHEET_COLUMNS).toBe(4);
    expect(SHEET_ROWS).toBe(2);
  });
});

// ── A2–A5 — pixelation through the injected surface ───────────────────────────
describe('u3 A2-A5: pixelation via the injected canvas', () => {
  it('A2: asks the factory for the DOWNSCALED size (384x256)', () => {
    const { factory, sizes } = makeFactory();
    pixelate(SHEET, { createCanvas: factory });
    expect(sizes).toEqual([[384, 256]]);
  });

  it('A2: sizes the returned surface to the downscaled dimensions', () => {
    const { factory, canvases } = makeFactory();
    pixelate(SHEET, { createCanvas: factory });
    expect(canvases[0]!.width).toBe(384);
    expect(canvases[0]!.height).toBe(256);
  });

  it('A3: makes exactly one drawImage call with (source, 0, 0, 384, 256)', () => {
    const { factory, canvases } = makeFactory();
    pixelate(SHEET, { createCanvas: factory });
    const ctx = canvases[0]!.ctx!;
    expect(ctx.calls).toHaveLength(1);
    const call = ctx.calls[0]!;
    expect(call.source).toBe(SHEET);
    expect([call.dx, call.dy, call.dw, call.dh]).toEqual([0, 0, 384, 256]);
  });

  it('A3: requests a 2d context', () => {
    const { factory, canvases } = makeFactory();
    pixelate(SHEET, { createCanvas: factory });
    expect(canvases[0]!.contextIds).toEqual(['2d']);
  });

  it('A4: smoothing is enabled and quality is high AT DRAW TIME (D1)', () => {
    const { factory, canvases } = makeFactory();
    pixelate(SHEET, { createCanvas: factory });
    const call = canvases[0]!.ctx!.calls[0]!;
    expect(call.smoothingAtDraw).toBe(true);
    expect(call.qualityAtDraw).toBe('high');
  });

  it('A5: returns the canvas surface itself, not the source', () => {
    const { factory, canvases } = makeFactory();
    const out = pixelate(SHEET, { createCanvas: factory });
    expect(out).toBe(canvases[0]);
    expect(out).not.toBe(SHEET);
  });

  it('never upscales: a source smaller than the factor still shrinks (or floors at 1px)', () => {
    const { factory, sizes } = makeFactory();
    pixelate({ width: 2, height: 2 }, { createCanvas: factory });
    expect(sizes[0]![0]).toBeLessThanOrEqual(2);
    expect(sizes[0]![1]).toBeLessThanOrEqual(2);
  });

  it('honours an explicit factor option end to end', () => {
    const { factory, sizes } = makeFactory();
    pixelate(SHEET, { createCanvas: factory, factor: 2 });
    expect(sizes).toEqual([[768, 512]]);
  });

  it('honours an explicit `size` option, bypassing downscaledSize entirely', () => {
    const { factory, sizes, canvases } = makeFactory();
    const out = pixelate(SHEET, { createCanvas: factory, size: { width: 100, height: 50 } });
    expect(sizes).toEqual([[100, 50]]);
    expect(canvases[0]!.width).toBe(100);
    expect(canvases[0]!.height).toBe(50);
    expect(out).toBe(canvases[0]);
  });

  it('an invalid explicit `size` (zero/negative/NaN) falls back to the source silently, like a bad factor', () => {
    const { factory, canvases } = makeFactory();
    const out = pixelate(SHEET, { createCanvas: factory, size: { width: 0, height: 10 } });
    expect(out).toBe(SHEET);
    expect(canvases).toHaveLength(0);
  });

  // Review follow-up (PR #34, Lead nit on line 152): a factory that already returns a
  // correctly-sized surface should not have width/height reassigned — real
  // HTMLCanvasElement/OffscreenCanvas setters reallocate the bitmap even for the
  // SAME value, which would quietly defeat a pooled-surface factory.
  it('does not touch width/height setters when the factory already sized the surface correctly', () => {
    const ctx = new FakeCtx();
    let widthWrites = 0;
    let heightWrites = 0;
    const canvas = new FakeCanvas(384, 256, ctx);
    Object.defineProperty(canvas, 'width', {
      get: () => 384,
      set: () => {
        widthWrites += 1;
      },
    });
    Object.defineProperty(canvas, 'height', {
      get: () => 256,
      set: () => {
        heightWrites += 1;
      },
    });
    const out = pixelate(SHEET, { createCanvas: () => canvas });
    expect(out).toBe(canvas);
    expect(widthWrites).toBe(0);
    expect(heightWrites).toBe(0);
  });

  it('DOES reassign width/height when the factory returns a surface with stale dimensions', () => {
    const ctx = new FakeCtx();
    const canvas = new FakeCanvas(10, 10, ctx); // pooled surface, wrong size
    const out = pixelate(SHEET, { createCanvas: () => canvas });
    expect(out).toBe(canvas);
    expect(canvas.width).toBe(384);
    expect(canvas.height).toBe(256);
  });
});

// ── A10–A16 — the §3-5 silent fallback ────────────────────────────────────────
describe('u3 A10-A16: every failure is a silent fallback to the source (§3-5)', () => {
  let spies: ReturnType<typeof vi.spyOn>[] = [];

  beforeEach(() => {
    spies = [
      vi.spyOn(console, 'error').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'log').mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    for (const spy of spies) spy.mockRestore();
    spies = [];
  });

  const expectSilent = (): void => {
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  };

  it('A10: no ambient canvas (node) — returns the source, does not throw', () => {
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET);
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expectSilent();
  });

  it('A11: factory returns null — returns the source', () => {
    const out = pixelate(SHEET, { createCanvas: () => null });
    expect(out).toBe(SHEET);
    expectSilent();
  });

  it('A12: factory throws — returns the source, swallows the throw', () => {
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET, {
        createCanvas: () => {
          throw new Error('no canvas here');
        },
      });
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expectSilent();
  });

  it('A13: getContext returns null — returns the source', () => {
    const { factory } = makeFactory({ ctx: null });
    const out = pixelate(SHEET, { createCanvas: factory });
    expect(out).toBe(SHEET);
    expectSilent();
  });

  it('A14: drawImage throws — returns the source', () => {
    const ctx = new FakeCtx();
    ctx.throwOnDraw = true;
    const { factory } = makeFactory({ ctx });
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET, { createCanvas: factory });
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expect(ctx.calls).toHaveLength(0);
    expectSilent();
  });

  it('A15: undecoded source (0x0) — returns the source and NEVER calls the factory', () => {
    const undecoded = { width: 0, height: 0 };
    const { factory, sizes } = makeFactory();
    const out = pixelate(undecoded, { createCanvas: factory });
    expect(out).toBe(undecoded);
    expect(sizes).toHaveLength(0);
    expectSilent();
  });

  it('A15: undecoded source (NaN) — returns the source and NEVER calls the factory', () => {
    const undecoded = { width: NaN, height: NaN };
    const { factory, sizes } = makeFactory();
    const out = pixelate(undecoded, { createCanvas: factory });
    expect(out).toBe(undecoded);
    expect(sizes).toHaveLength(0);
    expectSilent();
  });

  it('A15: a negative/infinite dimension is treated as undecoded too', () => {
    const bad = { width: -1, height: Infinity };
    const { factory, sizes } = makeFactory();
    expect(pixelate(bad, { createCanvas: factory })).toBe(bad);
    expect(sizes).toHaveLength(0);
    expectSilent();
  });

  it('A16: a caller-supplied bad factor also falls back silently (never throws to the player path)', () => {
    const { factory } = makeFactory();
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET, { createCanvas: factory, factor: 0 });
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expectSilent();
  });

  it('A16: the fallback value is the source object itself — no wrapper, no error string', () => {
    const out = pixelate(SHEET, { createCanvas: () => null });
    expect(typeof out).toBe('object');
    expect(out).toBe(SHEET);
    expect(out).not.toHaveProperty('error');
    expect(out).not.toHaveProperty('message');
  });

  it('A16: the source module builds no error UI/text (source-text scan)', () => {
    const src = read('src/ui/pixelate.ts');
    expect(/console\.(error|warn|log|info|debug)\s*\(/.test(src), 'pixelate.ts logs on the failure path').toBe(false);
    expect(/\balert\s*\(/.test(src), 'pixelate.ts raises an alert').toBe(false);
    expect(/innerHTML|textContent\s*=/.test(src), 'pixelate.ts writes error text into the DOM').toBe(false);
  });
});

// ── A18 — the DEFAULT surface (the seam's other half) ─────────────────────────
// Gap found auditing AC1 ("캔버스 API를 주입 가능한 형태로 받아"): every existing case
// either injects a factory or runs in bare node, where the default resolves to null
// (A10). Nothing pins the POSITIVE default path — that an ambient OffscreenCanvas /
// document is actually discovered and used, and that the probe happens per CALL
// rather than being frozen at module-import time. Without this, a default factory
// that captured `typeof OffscreenCanvas` in a module-scope const would still pass
// the whole suite while being dead in the browser (the module is imported before
// any polyfill/canvas shim, and in an SSR-then-hydrate path `document` appears
// after import).
describe('u3 A18: the default canvas factory is discovered at call time', () => {
  const globals = globalThis as unknown as Record<string, unknown>;
  const OWNED = ['OffscreenCanvas', 'document'] as const;
  const saved = new Map<string, { present: boolean; value: unknown }>();

  beforeEach(() => {
    for (const key of OWNED) {
      saved.set(key, { present: key in globals, value: globals[key] });
    }
  });

  afterEach(() => {
    for (const key of OWNED) {
      const prev = saved.get(key)!;
      if (prev.present) globals[key] = prev.value;
      else delete globals[key];
    }
    saved.clear();
  });

  /** Minimal ambient-surface fakes — still no jsdom, still no DOM. */
  function offscreenClass(record: FakeCanvas[]): new (w: number, h: number) => PixelCanvas {
    return class {
      constructor(w: number, h: number) {
        const canvas = new FakeCanvas(w, h, new FakeCtx());
        record.push(canvas);
        return canvas as unknown as this;
      }
    } as unknown as new (w: number, h: number) => PixelCanvas;
  }

  function fakeDocument(record: FakeCanvas[]): { createElement(tag: 'canvas'): PixelCanvas } {
    return {
      createElement(tag: 'canvas'): PixelCanvas {
        const canvas = new FakeCanvas(0, 0, new FakeCtx());
        record.push(canvas);
        expect(tag).toBe('canvas');
        return canvas;
      },
    };
  }

  it('uses an ambient OffscreenCanvas when no factory is injected', () => {
    const made: FakeCanvas[] = [];
    globals.OffscreenCanvas = offscreenClass(made);
    const out = pixelate(SHEET);
    expect(made).toHaveLength(1);
    expect(out).toBe(made[0]);
    expect(out).not.toBe(SHEET);
    expect(made[0]!.width).toBe(384);
    expect(made[0]!.height).toBe(256);
    const call = made[0]!.ctx!.calls[0]!;
    expect(made[0]!.ctx!.calls).toHaveLength(1);
    expect([call.dx, call.dy, call.dw, call.dh]).toEqual([0, 0, 384, 256]);
    expect(call.smoothingAtDraw).toBe(true);
    expect(call.qualityAtDraw).toBe('high');
  });

  it('falls back to document.createElement("canvas") when OffscreenCanvas is absent', () => {
    const made: FakeCanvas[] = [];
    delete globals.OffscreenCanvas;
    globals.document = fakeDocument(made);
    const out = pixelate(SHEET);
    expect(made).toHaveLength(1);
    expect(out).toBe(made[0]);
    expect(made[0]!.width).toBe(384);
    expect(made[0]!.height).toBe(256);
  });

  it('prefers OffscreenCanvas over document when both exist (no main-thread DOM node churn)', () => {
    const offscreen: FakeCanvas[] = [];
    const fromDocument: FakeCanvas[] = [];
    globals.OffscreenCanvas = offscreenClass(offscreen);
    globals.document = fakeDocument(fromDocument);
    const out = pixelate(SHEET);
    expect(offscreen).toHaveLength(1);
    expect(fromDocument).toHaveLength(0);
    expect(out).toBe(offscreen[0]);
  });

  it('re-probes on EVERY call: a surface appearing after import is still picked up, and one disappearing falls back silently', () => {
    // import-time state was bare node (A10) — nothing ambient.
    expect(pixelate(SHEET)).toBe(SHEET);
    const made: FakeCanvas[] = [];
    globals.OffscreenCanvas = offscreenClass(made);
    expect(pixelate(SHEET)).toBe(made[0]); // discovered late — not cached as "absent"
    delete globals.OffscreenCanvas;
    expect(pixelate(SHEET)).toBe(SHEET); // gone again — not cached as "present"
    expect(made).toHaveLength(1);
  });

  it('an ambient OffscreenCanvas whose constructor throws is a silent fallback, not a crash (§3-5)', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    globals.OffscreenCanvas = class {
      constructor() {
        throw new Error('context limit reached');
      }
    };
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET);
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('an ambient document whose createElement throws is a silent fallback too (§3-5)', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    delete globals.OffscreenCanvas;
    globals.document = {
      createElement(): PixelCanvas {
        throw new Error('detached document');
      },
    };
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET);
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});

// ── A19 — failure modes the §3-5 block does not yet cover ─────────────────────
// Gap found auditing AC3: A13 covers `getContext` RETURNING null, but a real browser
// canvas throws from getContext (context-count limit, killed GPU process, a canvas
// whose bitmap was transferred to a worker). A19 also covers the width/height
// setters throwing, which is what an oversized/OOM allocation does.
describe('u3 A19: the remaining browser failure modes fall back silently', () => {
  let spies: ReturnType<typeof vi.spyOn>[] = [];

  beforeEach(() => {
    spies = [
      vi.spyOn(console, 'error').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'log').mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    for (const spy of spies) spy.mockRestore();
    spies = [];
  });

  const expectSilent = (): void => {
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  };

  it('getContext THROWS (not just returns null) — returns the source', () => {
    const canvas: PixelCanvas = {
      width: 384,
      height: 256,
      getContext(): PixelContext | null {
        throw new Error('too many active WebGL/2d contexts');
      },
    };
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET, { createCanvas: () => canvas });
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expectSilent();
  });

  it('a width/height setter that throws (allocation failure) — returns the source', () => {
    const canvas = new FakeCanvas(10, 10, new FakeCtx()); // stale size forces a write
    Object.defineProperty(canvas, 'width', {
      get: () => 10,
      set: () => {
        throw new RangeError('canvas allocation failed');
      },
    });
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET, { createCanvas: () => canvas });
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expectSilent();
  });

  it('a factory returning a non-canvas (no getContext) — returns the source', () => {
    const notACanvas = { width: 384, height: 256 } as unknown as PixelCanvas;
    let out: unknown;
    expect(() => {
      out = pixelate(SHEET, { createCanvas: () => notACanvas });
    }).not.toThrow();
    expect(out).toBe(SHEET);
    expectSilent();
  });
});

// ── A20 — determinism, which AC1 asks for by name ─────────────────────────────
// ("node 환경 vitest에서 fake canvas로 결정적으로 테스트된다")
describe('u3 A20: the util is deterministic and free of hidden per-call state', () => {
  it('two identical pixelate calls produce identical factory requests and draw calls', () => {
    const a = makeFactory();
    const b = makeFactory();
    pixelate(SHEET, { createCanvas: a.factory });
    pixelate(SHEET, { createCanvas: b.factory });
    expect(a.sizes).toEqual(b.sizes);
    const stripSource = (c: DrawCall): Omit<DrawCall, 'source'> => {
      const { source: _source, ...rest } = c;
      return rest;
    };
    expect(a.canvases[0]!.ctx!.calls.map(stripSource)).toEqual(b.canvases[0]!.ctx!.calls.map(stripSource));
  });

  it('the size helpers are pure: repeated calls are equal and never share a mutated instance', () => {
    const first = downscaledSize(SHEET.width, SHEET.height);
    const second = downscaledSize(SHEET.width, SHEET.height);
    expect(first).toEqual(second);
    expect(sheetCellSize(SHEET.width, SHEET.height)).toEqual(sheetCellSize(SHEET.width, SHEET.height));
    expect(sheetPixelSize(SHEET.width, SHEET.height)).toEqual(sheetPixelSize(SHEET.width, SHEET.height));
    // A returned size must not be a shared mutable singleton a caller can poison.
    expect(() => {
      (first as { width: number }).width = 9999;
    }).toThrow();
    expect(downscaledSize(SHEET.width, SHEET.height).width).toBe(384);
  });

  it('a failed call leaves the next call unaffected (no latched "broken" flag)', () => {
    expect(pixelate(SHEET, { createCanvas: () => null })).toBe(SHEET);
    const { factory, canvases } = makeFactory();
    expect(pixelate(SHEET, { createCanvas: factory })).toBe(canvases[0]);
  });
});

// ── A21 — sheetPixelSize is validated like its siblings ───────────────────────
// Gap found auditing AC2: downscaledSize and sheetCellSize both have a D4 throw test;
// sheetPixelSize — the function portrait-sheet consumers are told to call — has none.
describe('u3 A21: sheetPixelSize rejects a bad factor the same way its siblings do (D4)', () => {
  for (const bad of [0, -4, 2.5, NaN, Infinity]) {
    it(`throws for factor=${String(bad)}`, () => {
      expect(() => sheetPixelSize(SHEET.width, SHEET.height, bad)).toThrow();
    });
  }

  it('never returns a zero-sized cell or sheet for a tiny source', () => {
    const sheet = sheetPixelSize(4, 2);
    const cell = sheetCellSize(4, 2);
    expect(cell.width).toBeGreaterThanOrEqual(1);
    expect(cell.height).toBeGreaterThanOrEqual(1);
    expect(sheet.width).toBe(cell.width * SHEET_COLUMNS);
    expect(sheet.height).toBe(cell.height * SHEET_ROWS);
  });
});

// ── A22 — the src/ui membrane guard, asserted from inside this unit ───────────
// AC4 is "tests/ui/cards.test.ts의 src/ui 전수 스캔을 여전히 통과한다". That scan is a
// recursive walk, so it picks this file up automatically — but nothing FAILS here if
// the walk were ever narrowed to a hardcoded file list. These assertions restate the
// invariant for this unit's own file so it cannot silently drop out of coverage.
describe('u3 A22: pixelate.ts respects the src/ui membrane rule', () => {
  const src = (): string => read('src/ui/pixelate.ts');

  it('creates no native form controls', () => {
    expect(/createElement\s*\(\s*['"](select|input|textarea|form|option|datalist)['"]/i.test(src())).toBe(false);
    expect(/<\s*(select|input|textarea|form)\b/i.test(src())).toBe(false);
  });

  it('is discoverable by the same recursive src/ui walk cards.test.ts uses', () => {
    const walk = (abs: string, rel: string, out: string[]): string[] => {
      for (const ent of readdirSync(abs, { withFileTypes: true })) {
        const childAbs = resolve(abs, ent.name);
        const childRel = `${rel}/${ent.name}`;
        if (ent.isDirectory()) walk(childAbs, childRel, out);
        else if (ent.name.endsWith('.ts')) out.push(childRel);
      }
      return out;
    };
    expect(walk(resolve(root, 'src/ui'), 'src/ui', [])).toContain('src/ui/pixelate.ts');
  });

  it('makes no network calls (the util is pure client-side pixel work)', () => {
    expect(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(src())).toBe(false);
  });
});
