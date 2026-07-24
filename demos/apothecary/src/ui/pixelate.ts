// pixelate.ts — client-side pixelation of RUNTIME portrait sheets (PRD §2.3
// "Client-side pixelation" + §2.4 pixel pipeline). Only sheets that arrive at
// runtime are processed here; the shipped asset pack is already pixel-art.
//
// The pipeline is: downscale the sheet by the shared `pixelFactor` from
// data/generation.json onto a small surface, then let CSS own the upscale via
// `image-rendering: pixelated`. Downscaling with smoothing ON (D1) is what
// averages the source into chunky, readable pixels; the crisp blow-up is the
// stylesheet's job, never this module's.
//
// Two rules shape the API:
//   * The canvas surface is INJECTED (`PixelateOptions.createCanvas`). Unit tests
//     run in a DOM-free node environment, so an ambient surface cannot be assumed
//     and the seam has to be explicit rather than sniffed at import time.
//   * Per PRD §3-5 a failure is silent: `pixelate` never throws, never logs and
//     never produces error text. It returns the SAME object it was given, so
//     `result === source` is the documented "not pixelated" signal.
import generation from '../../data/generation.json';

/** Anything with decoded pixel dimensions: an image bitmap, an <img>, a canvas. */
export interface PixelSource {
  readonly width: number;
  readonly height: number;
}

export interface PixelSize {
  readonly width: number;
  readonly height: number;
}

/**
 * The slice of a 2D drawing context this module uses. `source` is `unknown`
 * because the real `drawImage` accepts a union of image types this module has no
 * reason to name; method-shorthand bivariance keeps real browser contexts
 * assignable.
 */
export interface PixelContext {
  imageSmoothingEnabled: boolean;
  imageSmoothingQuality?: 'low' | 'medium' | 'high';
  drawImage(source: unknown, dx: number, dy: number, dw: number, dh: number): void;
}

/** The slice of a canvas surface this module uses (HTMLCanvasElement / OffscreenCanvas both fit). */
export interface PixelCanvas extends PixelSource {
  width: number;
  height: number;
  getContext(contextId: '2d'): PixelContext | null;
}

export type CanvasFactory = (width: number, height: number) => PixelCanvas | null;

export interface PixelateOptions {
  /** Overrides the data-driven downscale divisor. Defaults to PIXEL_FACTOR. */
  factor?: number;
  /** The surface seam. Defaults to an ambient canvas when one exists. */
  createCanvas?: CanvasFactory;
}

function typeName(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/**
 * Validates the downscale divisor coming out of the generation data (D4).
 * Bad DATA is a programmer/authoring error, so this is loud — the silent §3-5
 * fallback lives in `pixelate`, which swallows this throw on the player path.
 */
export function loadPixelFactor(input: unknown): number {
  if (typeof input !== 'number' || !Number.isInteger(input) || input < 1) {
    throw new Error(
      `generation: field 'pixelFactor' must be a positive integer (got ${typeName(input)}: ${String(input)})`,
    );
  }
  return input;
}

/** Shared downscale divisor — read from data, never written as a literal here. */
export const PIXEL_FACTOR: number = loadPixelFactor(generation.pixelFactor);

// The portrait sheet grid. `generation.portraitSheetFormat` states it in prose
// ("a 4x2 grid of eight bust portraits"), which is not machine-readable, so the
// grid lives here as named constants and tests assert the data still agrees —
// a desync fails CI instead of throwing on the player path.
/** Columns per sheet: one expression per column. */
export const SHEET_COLUMNS = 4;
/** Rows per sheet: eyes-open on top, mid-blink underneath. */
export const SHEET_ROWS = 2;

function shrink(dimension: number, factor: number): number {
  return Math.max(1, Math.round(dimension / factor));
}

/** Pixel dimensions of `width`x`height` after the downscale. Throws on a bad factor (D4). */
export function downscaledSize(width: number, height: number, factor: number = PIXEL_FACTOR): PixelSize {
  const divisor = loadPixelFactor(factor);
  return Object.freeze({ width: shrink(width, divisor), height: shrink(height, divisor) });
}

/** Pixel dimensions of ONE cell of a downscaled portrait sheet. Throws on a bad factor (D4). */
export function sheetCellSize(
  sheetWidth: number,
  sheetHeight: number,
  factor: number = PIXEL_FACTOR,
): PixelSize {
  const sheet = downscaledSize(sheetWidth, sheetHeight, factor);
  return Object.freeze({
    width: Math.max(1, Math.round(sheet.width / SHEET_COLUMNS)),
    height: Math.max(1, Math.round(sheet.height / SHEET_ROWS)),
  });
}

function isDecodedDimension(v: number): boolean {
  return Number.isFinite(v) && v > 0;
}

// Probed lazily, inside the call — module scope stays side-effect free and the
// node test environment genuinely exercises the "no surface" path.
const defaultCanvasFactory: CanvasFactory = (width, height) => {
  const scope = globalThis as unknown as {
    OffscreenCanvas?: new (w: number, h: number) => PixelCanvas;
    document?: { createElement(tag: 'canvas'): PixelCanvas };
  };
  if (typeof scope.OffscreenCanvas === 'function') {
    return new scope.OffscreenCanvas(width, height);
  }
  if (scope.document !== undefined) {
    const canvas = scope.document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return null;
};

/**
 * Downscales `source` onto a small surface and returns that surface.
 * On ANY failure — no surface available, no context, an undecoded source, a bad
 * caller factor, a throwing draw — returns `source` unchanged and silently (§3-5).
 */
export function pixelate<T extends PixelSource>(source: T, options: PixelateOptions = {}): PixelCanvas | T {
  // Outside the try: an undecoded source must not even reach the factory.
  if (!isDecodedDimension(source.width) || !isDecodedDimension(source.height)) return source;

  try {
    const size = downscaledSize(source.width, source.height, options.factor ?? PIXEL_FACTOR);
    const createCanvas = options.createCanvas ?? defaultCanvasFactory;
    const canvas = createCanvas(size.width, size.height);
    if (canvas === null) return source;
    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext('2d');
    if (ctx === null) return source;

    // Smoothing ON while shrinking (D1) — this is the averaging that produces the
    // chunky pixels. The crisp upscale is CSS's job.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, size.width, size.height);
    return canvas;
  } catch {
    return source;
  }
}
