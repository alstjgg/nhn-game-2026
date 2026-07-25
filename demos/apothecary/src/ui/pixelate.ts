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
// Named import: pulls only `pixelFactor` out of the JSON module graph. A default
// import (`import generation from '...'`) is NOT tree-shaken by this repo's Vite
// (verified against the built chunk) and would ship the ENTIRE generation table —
// including `ailments[].hiddenCause` (the game's answer key) and `tierTones` — into
// the client bundle the moment any screen imports this module. The named form
// inlines the single numeric literal instead; `tests/ui/pixelate.test.ts` pins this
// with a built-bundle regression check.
import { pixelFactor } from '../../data/generation.json';

/**
 * Anything with decoded pixel dimensions: an image bitmap, an <img>, a canvas.
 * This is intentionally the WEAKEST contract that satisfies the module's own size
 * math (`downscaledSize`/`sheetCellSize`), so plain `{width, height}` test fakes are
 * assignable without a DOM. `pixelate`'s browser-facing call sites should still only
 * ever pass real drawable sources (`CanvasImageSource`) — see the note on
 * `pixelate` below for what happens when they don't, and DISCOVERY.md ("u3 —
 * PixelSource contract") for the consumer-facing contract this implies.
 */
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
  /** Overrides the data-driven downscale divisor. Defaults to PIXEL_FACTOR. Ignored when `size` is given. */
  factor?: number;
  /**
   * Overrides the computed downscale target, bypassing `downscaledSize` entirely.
   * Portrait-sheet consumers MUST pass `sheetPixelSize(source.width, source.height,
   * factor)` here — see that function's doc comment for why the default per-image
   * downscale can drift a pixel from the cell grid at factors other than 4/2.
   */
  size?: PixelSize;
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

// PIXEL_FACTOR is evaluated at module-import time, so a corrupt `pixelFactor` in
// data/generation.json throws THERE — the one spot in this file that isn't behind
// the pixelate() try/catch (see the note above pixelate). That's intentional, not an
// oversight: data/generation.json is checked-in, build-time data, not something a
// player's session can corrupt at runtime, so the loud D4 throw fires in CI/`npm
// test`/`vite build` — every one of which imports this module — long before it could
// ever reach a browser. `tests/ui/pixelate.test.ts` ("u3 A17b") pins
// `loadPixelFactor(pixelFactor)` not throwing for the shipped value specifically (not
// just the literal 4) so a future edit to generation.json fails CI loudly instead of
// blanking the player's screen.
/** Shared downscale divisor — read from data, never written as a literal here. */
export const PIXEL_FACTOR: number = loadPixelFactor(pixelFactor);

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

/**
 * Pixel dimensions of ONE cell of a downscaled portrait sheet. Throws on a bad
 * factor (D4).
 *
 * Computed DIRECTLY from the raw sheet dimensions (`round(raw / grid / factor)`),
 * never by downscaling the whole sheet first and then dividing — that two-step path
 * (round once for the sheet, round again for the cell) drifts by a pixel at factors
 * that don't divide the grid evenly. `factor` is balance-as-data (tunable), and only
 * 4 and 2 happen to divide the shipped 4x2 grid cleanly; e.g. at factor=3 a
 * sheet-then-divide sheet of 512x341 wants a 128x171 cell, but 171*2=342 ≠ 341 — a
 * silent 1px seam in whatever consumes these cells via CSS `background-position`.
 * Computing the cell first sidesteps the mismatch: see `sheetPixelSize`, which
 * derives the whole-sheet target FROM this cell so the two can never disagree.
 */
export function sheetCellSize(
  sheetWidth: number,
  sheetHeight: number,
  factor: number = PIXEL_FACTOR,
): PixelSize {
  const divisor = loadPixelFactor(factor);
  return Object.freeze({
    width: Math.max(1, Math.round(sheetWidth / SHEET_COLUMNS / divisor)),
    height: Math.max(1, Math.round(sheetHeight / SHEET_ROWS / divisor)),
  });
}

/**
 * Pixel dimensions of the WHOLE downscaled portrait sheet, derived FROM
 * `sheetCellSize` (`cell * grid`) rather than computed independently — this is the
 * size that tiles the cell grid exactly, for every factor, by construction.
 *
 * Consumers pixelating a full sheet image (u4/u5's render path) MUST pass this as
 * `pixelate`'s `size` option instead of relying on the default per-image
 * `downscaledSize`, which rounds the whole image independently of the cell grid and
 * can be off by a pixel from `sheetCellSize`'s own tiling at factors other than 4/2
 * (see `sheetCellSize`'s doc comment). Passing this here is what makes
 * `cell.width * SHEET_COLUMNS === <the actual drawn canvas width>` a guarantee
 * instead of a coincidence of the shipped factor being 4.
 */
export function sheetPixelSize(
  sheetWidth: number,
  sheetHeight: number,
  factor: number = PIXEL_FACTOR,
): PixelSize {
  const cell = sheetCellSize(sheetWidth, sheetHeight, factor);
  return Object.freeze({
    width: cell.width * SHEET_COLUMNS,
    height: cell.height * SHEET_ROWS,
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
 *
 * `source` is typed as the weak `PixelSource` (see its doc comment) so DOM-free unit
 * tests can inject plain `{width, height}` fakes. In a real browser, passing
 * something with matching `width`/`height` but that isn't actually drawable
 * (`CanvasImageSource`) makes `ctx.drawImage` throw — which this function's own
 * try/catch swallows per §3-5, so the caller gets `source` back unchanged. There is
 * no console signal by design; callers who need to detect "did this actually get
 * pixelated" should compare `result === source`.
 */
export function pixelate<T extends PixelSource>(source: T, options: PixelateOptions = {}): PixelCanvas | T {
  // Outside the try: an undecoded source must not even reach the factory.
  if (!isDecodedDimension(source.width) || !isDecodedDimension(source.height)) return source;

  try {
    const size = options.size ?? downscaledSize(source.width, source.height, options.factor ?? PIXEL_FACTOR);
    if (!isDecodedDimension(size.width) || !isDecodedDimension(size.height)) return source;
    const createCanvas = options.createCanvas ?? defaultCanvasFactory;
    const canvas = createCanvas(size.width, size.height);
    if (canvas === null) return source;
    // Only reassign when the factory's surface doesn't already match: setting
    // width/height on a real HTMLCanvasElement/OffscreenCanvas reallocates and
    // clears the bitmap even when assigned the SAME value, which would quietly
    // defeat a factory that hands back a pooled/pre-sized surface.
    if (canvas.width !== size.width) canvas.width = size.width;
    if (canvas.height !== size.height) canvas.height = size.height;

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
