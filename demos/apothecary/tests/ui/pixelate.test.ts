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
import { readFileSync } from 'node:fs';
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
  sheetCellSize,
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
