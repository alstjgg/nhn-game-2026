// sprite.ts — u7 sprite primitives for the provided asset pack (PRD §2.4).
//
// The asset pack ships sheets, not single images: every visual is one cell of a
// grid. This module is the ONLY place that knows how a (sheet, col, row) triple
// becomes CSS. Everything it knows about the pack — grid sizes, which cell an
// ingredient owns, the quantity thresholds, the equipment frames, the potion
// cells — lives in `data/sprites.json` (balance-as-data). Nothing numeric about
// the pack is re-typed here.
//
// Fallback contract (AC4): an unresolvable sprite is `undefined`, never an
// exception and never a blank box. Callers simply skip painting, so the v1
// CSS-placeholder look survives a missing or renamed asset file.
//
// Bundling: asset URLs come from `import.meta.glob(..., '?url')`, so Vite emits
// and fingerprints every sheet. A path built at runtime would 404 under the
// Pages subpath, so it is never done here.
//
// Membrane: pure data in, CSS strings out. No network, no form controls.
import rawSpriteData from '../../data/sprites.json';

// ── Types ────────────────────────────────────────────────────────────────────

/** A cell address inside a sheet: `[col, row]`. */
export type Cell = readonly [number, number];

/**
 * A sheet's real content geometry, for sheets whose cells are NOT an exact
 * `imageW/cols × imageH/rows` division (e.g. the ingredient jars, which were
 * measured directly off the generated PNG's alpha channel — see
 * `tests/ui/sprite.test.ts` "ingredient sheets: measured content rect" for the
 * source bounding boxes). `col`/`row` still index the same grid as `cols`/`rows`;
 * only the pixel math changes. Optional: a sheet without one keeps the plain
 * `cellOffsets(cols, rows, col, row)` division (equip/potions/1×1 sheets).
 */
export interface ContentRect {
  /** Full sheet pixel dimensions (not the nominal cell size). */
  readonly imageW: number;
  readonly imageH: number;
  /** The crop window's fixed pixel size — big enough to hold every cell's content. */
  readonly cellW: number;
  readonly cellH: number;
  /** Top-left pixel of cell (0, 0)'s crop window. */
  readonly originX: number;
  readonly originY: number;
  /** Pixel distance between consecutive cells' crop windows on each axis. */
  readonly pitchX: number;
  readonly pitchY: number;
}

export interface SheetMeta {
  /** Basename of the file in `assets/` — the key into `SHEET_URLS`. */
  readonly file: string;
  readonly cols: number;
  readonly rows: number;
  /** Measured crop geometry, when the sheet isn't an exact equal-division grid. */
  readonly contentRect?: ContentRect;
}

export interface IngredientCell {
  readonly sheet: string;
  readonly col: number;
}

/** One quantity band: everything at or above `min` renders sheet row `row`. */
export interface QuantityState {
  readonly state: string;
  readonly row: number;
  readonly min: number;
}

export interface EquipFrames {
  readonly idle: Cell;
  readonly inUse: readonly Cell[];
}

export interface SpriteData {
  readonly sheets: Readonly<Record<string, SheetMeta>>;
  readonly ingredientCells: Readonly<Record<string, IngredientCell>>;
  /** Descending threshold table (highest `min` first). */
  readonly quantityStates: readonly QuantityState[];
  readonly defaultQuantity: number;
  readonly methodEquip: Readonly<Record<string, string>>;
  readonly equipFrames: EquipFrames;
  readonly equipFrameMs: number;
  readonly potionSheet: string;
  readonly potionCells: Readonly<Record<string, Cell>>;
  readonly defaultPotion: string;
}

/** The geometry half of a sprite — what `background-position/size` must be. */
export interface CellOffsets {
  readonly backgroundSize: string;
  readonly backgroundPosition: string;
}

/** A paintable sprite: geometry + the bundled sheet + the pixel-art hint. */
export interface SpriteStyle extends CellOffsets {
  readonly backgroundImage: string;
  readonly imageRendering: string;
}

// ── Validation (mirrors data/loader.ts: fail loudly, name the field) ──────────

const CTX = 'sprites';

const err = (message: string): Error => new Error(`${CTX}: ${message}`);

function typeName(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function requireRecord(v: unknown, field: string): Record<string, unknown> {
  if (!isRecord(v)) throw err(`field '${field}' must be an object (got ${typeName(v)})`);
  return v;
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== 'string' || v === '') {
    throw err(`field '${field}' must be a non-empty string (got ${typeName(v)})`);
  }
  return v;
}

/** Grid extents: a sheet always has at least one column and one row. */
function requireCount(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    throw err(`field '${field}' must be a positive integer (got ${String(v)})`);
  }
  return v;
}

/** Cell indices and thresholds: zero is legal, negatives and fractions are not. */
function requireIndex(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw err(`field '${field}' must be a non-negative integer (got ${String(v)})`);
  }
  return v;
}

const CELL_LENGTH = 2;

function requireCell(v: unknown, field: string): Cell {
  if (!Array.isArray(v) || v.length !== CELL_LENGTH) {
    throw err(`field '${field}' must be a [col, row] pair`);
  }
  return [requireIndex(v[0], `${field}[0]`), requireIndex(v[1], `${field}[1]`)];
}

function requireKnownSheet(
  sheets: Readonly<Record<string, SheetMeta>>,
  id: string,
  field: string,
): string {
  if (!Object.hasOwn(sheets, id)) throw err(`field '${field}' names unknown sheet '${id}'`);
  return id;
}

/** Positive pixel dimension: the geometry fields of a content rect are never 0. */
function requirePixels(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
    throw err(`field '${field}' must be a positive number (got ${String(v)})`);
  }
  return v;
}

/** Non-negative pixel offset: origins/pitches may legitimately be 0. */
function requirePixelOffset(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw err(`field '${field}' must be a non-negative number (got ${String(v)})`);
  }
  return v;
}

function requireContentRect(v: unknown, field: string): ContentRect {
  const r = requireRecord(v, field);
  const imageW = requirePixels(r.imageW, `${field}.imageW`);
  const imageH = requirePixels(r.imageH, `${field}.imageH`);
  const cellW = requirePixels(r.cellW, `${field}.cellW`);
  const cellH = requirePixels(r.cellH, `${field}.cellH`);
  if (cellW > imageW) throw err(`field '${field}.cellW' (${cellW}) exceeds imageW (${imageW})`);
  if (cellH > imageH) throw err(`field '${field}.cellH' (${cellH}) exceeds imageH (${imageH})`);
  return {
    imageW,
    imageH,
    cellW,
    cellH,
    originX: requirePixelOffset(r.originX, `${field}.originX`),
    originY: requirePixelOffset(r.originY, `${field}.originY`),
    pitchX: requirePixelOffset(r.pitchX, `${field}.pitchX`),
    pitchY: requirePixelOffset(r.pitchY, `${field}.pitchY`),
  };
}

/** Validate a raw `data/sprites.json` payload into the frozen sprite tables. */
export function loadSpriteData(input: unknown): SpriteData {
  if (!isRecord(input)) throw err(`must be an object (got ${typeName(input)})`);

  const rawSheets = requireRecord(input.sheets, 'sheets');
  const sheets: Record<string, SheetMeta> = {};
  for (const [id, value] of Object.entries(rawSheets)) {
    const meta = requireRecord(value, `sheets['${id}']`);
    sheets[id] = {
      file: requireString(meta.file, `sheets['${id}'].file`),
      cols: requireCount(meta.cols, `sheets['${id}'].cols`),
      rows: requireCount(meta.rows, `sheets['${id}'].rows`),
      ...(meta.contentRect !== undefined
        ? { contentRect: requireContentRect(meta.contentRect, `sheets['${id}'].contentRect`) }
        : {}),
    };
  }
  if (Object.keys(sheets).length < 1) throw err(`field 'sheets' declares no sheet`);

  const rawCells = requireRecord(input.ingredientCells, 'ingredientCells');
  const ingredientCells: Record<string, IngredientCell> = {};
  for (const [id, value] of Object.entries(rawCells)) {
    const cell = requireRecord(value, `ingredientCells['${id}']`);
    const sheetId = requireString(cell.sheet, `ingredientCells['${id}'].sheet`);
    ingredientCells[id] = {
      sheet: requireKnownSheet(sheets, sheetId, `ingredientCells['${id}'].sheet`),
      col: requireIndex(cell.col, `ingredientCells['${id}'].col`),
    };
  }

  const rawStates = input.quantityStates;
  if (!Array.isArray(rawStates) || rawStates.length < 1) {
    throw err(`field 'quantityStates' must be a non-empty array`);
  }
  const quantityStates: QuantityState[] = rawStates.map((value, i): QuantityState => {
    const s = requireRecord(value, `quantityStates[${i}]`);
    return {
      state: requireString(s.state, `quantityStates[${i}].state`),
      row: requireIndex(s.row, `quantityStates[${i}].row`),
      min: requireIndex(s.min, `quantityStates[${i}].min`),
    };
  });

  // stateForQuantity() walks this table with `states.find((s) => quantity >= s.min)`,
  // which is only correct if the bands are strictly descending by `min` and the last
  // one is a `min: 0` catch-all — enforce the contract the comment only used to state.
  quantityStates.forEach((s, i) => {
    if (i === 0) return;
    const prev = quantityStates[i - 1];
    if (s.min >= prev.min) {
      throw err(
        `field 'quantityStates[${i}].min' (${s.min}) must be less than ` +
          `quantityStates[${i - 1}].min (${prev.min}) — the table must be strictly ` +
          `descending by 'min'`,
      );
    }
  });
  const lowestBand = quantityStates[quantityStates.length - 1];
  if (lowestBand.min !== 0) {
    throw err(
      `field 'quantityStates' must end with a 'min: 0' catch-all band ` +
        `(last band is '${lowestBand.state}' with min ${lowestBand.min})`,
    );
  }
  // Every band's `row` must exist on every sheet a quantity band can actually paint —
  // i.e. every sheet an ingredient cell points at.
  const ingredientSheetIds = new Set(Object.values(ingredientCells).map((c) => c.sheet));
  for (const sheetId of ingredientSheetIds) {
    const sheet = sheets[sheetId];
    quantityStates.forEach((s, i) => {
      if (s.row >= sheet.rows) {
        throw err(
          `field 'quantityStates[${i}].row' (${s.row}) is out of range for sheet ` +
            `'${sheetId}' (rows=${sheet.rows})`,
        );
      }
    });
  }

  const rawEquip = requireRecord(input.methodEquip, 'methodEquip');
  const methodEquip: Record<string, string> = {};
  for (const [verb, value] of Object.entries(rawEquip)) {
    const sheetId = requireString(value, `methodEquip['${verb}']`);
    methodEquip[verb] = requireKnownSheet(sheets, sheetId, `methodEquip['${verb}']`);
  }

  const rawFrames = requireRecord(input.equipFrames, 'equipFrames');
  const rawInUse = rawFrames.inUse;
  if (!Array.isArray(rawInUse) || rawInUse.length < 1) {
    throw err(`field 'equipFrames.inUse' must be a non-empty array`);
  }
  const equipFrames: EquipFrames = {
    idle: requireCell(rawFrames.idle, 'equipFrames.idle'),
    inUse: rawInUse.map((c, i) => requireCell(c, `equipFrames.inUse[${i}]`)),
  };

  const potionSheet = requireKnownSheet(
    sheets,
    requireString(input.potionSheet, 'potionSheet'),
    'potionSheet',
  );
  const rawPotions = requireRecord(input.potionCells, 'potionCells');
  const potionCells: Record<string, Cell> = {};
  for (const [key, value] of Object.entries(rawPotions)) {
    potionCells[key] = requireCell(value, `potionCells['${key}']`);
  }
  const defaultPotion = requireString(input.defaultPotion, 'defaultPotion');
  if (!Object.hasOwn(potionCells, defaultPotion)) {
    throw err(`field 'defaultPotion' names unknown potion cell '${defaultPotion}'`);
  }

  return Object.freeze({
    sheets: Object.freeze(sheets),
    ingredientCells: Object.freeze(ingredientCells),
    quantityStates: Object.freeze(quantityStates),
    defaultQuantity: requireIndex(input.defaultQuantity, 'defaultQuantity'),
    methodEquip: Object.freeze(methodEquip),
    equipFrames: Object.freeze(equipFrames),
    equipFrameMs: requireCount(input.equipFrameMs, 'equipFrameMs'),
    potionSheet,
    potionCells: Object.freeze(potionCells),
    defaultPotion,
  });
}

/** The validated pack tables — the single source of truth for every helper here. */
export const SPRITES: SpriteData = loadSpriteData(rawSpriteData);

// ── Bundled sheet URLs ───────────────────────────────────────────────────────

// Eager `?url` glob: Vite emits + fingerprints each sheet at build time and hands
// back the final URL, so the demo works under the Pages subpath as well as in dev.
const sheetModules = import.meta.glob('../../assets/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const basename = (path: string): string => path.slice(path.lastIndexOf('/') + 1);

/** Bundled URL of every pack file, keyed by basename (`SheetMeta.file`). */
export const SHEET_URLS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(Object.entries(sheetModules).map(([path, url]) => [basename(path), url])),
);

// ── Pure geometry ────────────────────────────────────────────────────────────

const FULL_PERCENT = 100;
// Four decimals keep a 1/3 column exact enough that no seam of the neighbouring
// cell shows, while staying a percentage — px offsets would be wrong the moment
// the element is resized.
const PERCENT_DECIMALS = 4;

function percent(value: number): string {
  const fixed = value.toFixed(PERCENT_DECIMALS);
  const trimmed = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
  return `${trimmed}%`;
}

function isGridExtent(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function isCellIndex(i: number, extent: number): boolean {
  return Number.isInteger(i) && i >= 0 && i < extent;
}

/**
 * The CSS background offsets for one cell of a `cols × rows` sheet.
 *
 * The sheet is scaled so a single cell fills the element (`cols * 100%`), and the
 * cell is chosen by the percentage-positioning formula `index / (extent - 1)`.
 * A single-cell axis has no span to divide, so it pins to `0%`.
 * Returns `undefined` for a degenerate grid or an out-of-range cell (AC4).
 */
export function cellOffsets(
  cols: number,
  rows: number,
  col: number,
  row: number,
): CellOffsets | undefined {
  if (!isGridExtent(cols) || !isGridExtent(rows)) return undefined;
  if (!isCellIndex(col, cols) || !isCellIndex(row, rows)) return undefined;

  const axis = (index: number, extent: number): string => {
    const span = extent - 1;
    return percent(span > 0 ? (index / span) * FULL_PERCENT : 0);
  };

  return {
    backgroundSize: `${percent(cols * FULL_PERCENT)} ${percent(rows * FULL_PERCENT)}`,
    backgroundPosition: `${axis(col, cols)} ${axis(row, rows)}`,
  };
}

/**
 * The CSS background offsets for one cell of a sheet whose cells are a measured
 * `ContentRect`, not an exact equal-division grid (AC1/AC2 fix — see review thread
 * on `cellOffsets()`: the ingredient sheets' jars don't sit on `imageW/cols ×
 * imageH/rows` boundaries).
 *
 * Same percentage-positioning technique as `cellOffsets()`, generalized: the crop
 * window is `cellW × cellH` pixels starting at `(originX + col*pitchX, originY +
 * row*pitchY)`. With `origin=0` and `pitch=cellW=imageW/cols` this reduces to
 * exactly `cellOffsets()`'s formula, so `cellOffsets()` itself needn't change for
 * the sheets that ARE an exact grid (equip/potions/1×1 backdrops).
 */
export function contentRectOffsets(
  rect: ContentRect,
  col: number,
  row: number,
): CellOffsets | undefined {
  const spanX = rect.imageW - rect.cellW;
  const spanY = rect.imageH - rect.cellH;
  const offsetX = rect.originX + col * rect.pitchX;
  const offsetY = rect.originY + row * rect.pitchY;
  const posX = spanX > 0 ? (offsetX / spanX) * FULL_PERCENT : 0;
  const posY = spanY > 0 ? (offsetY / spanY) * FULL_PERCENT : 0;

  return {
    backgroundSize: `${percent((rect.imageW / rect.cellW) * FULL_PERCENT)} ${percent(
      (rect.imageH / rect.cellH) * FULL_PERCENT,
    )}`,
    backgroundPosition: `${percent(posX)} ${percent(posY)}`,
  };
}

// ── Sheet-level resolution ───────────────────────────────────────────────────

const PIXELATED = 'pixelated';

/**
 * Resolve `(sheet id, col, row)` to a paintable style, or `undefined` when the
 * sheet is unregistered, its file is absent from the bundle, or the cell is out
 * of range. `urls` is injectable so the missing-file path is testable without
 * touching the read-only asset pack.
 */
export function spriteCell(
  sheetId: string,
  col: number,
  row: number,
  urls: Readonly<Record<string, string>> = SHEET_URLS,
): SpriteStyle | undefined {
  if (!Object.hasOwn(SPRITES.sheets, sheetId)) return undefined;
  const sheet = SPRITES.sheets[sheetId];

  if (!Object.hasOwn(urls, sheet.file)) return undefined;
  const url = urls[sheet.file];
  if (url === '') return undefined;

  // Range-check against the logical grid first — a ContentRect sheet still has
  // `cols`/`rows` bounds even though its pixel math doesn't divide the sheet
  // evenly, and out-of-range must still be a no-op (AC4), not an extrapolated crop.
  if (!isCellIndex(col, sheet.cols) || !isCellIndex(row, sheet.rows)) return undefined;

  const offsets =
    sheet.contentRect !== undefined
      ? contentRectOffsets(sheet.contentRect, col, row)
      : cellOffsets(sheet.cols, sheet.rows, col, row);
  if (offsets === undefined) return undefined;

  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: offsets.backgroundSize,
    backgroundPosition: offsets.backgroundPosition,
    imageRendering: PIXELATED,
  };
}

// ── Domain helpers ───────────────────────────────────────────────────────────

/**
 * Which sheet row a stock quantity renders. The bands come from
 * `quantityStates` in the data file — this function only walks them, so
 * retuning 가득/절반/바닥 never touches code.
 */
export function stateForQuantity(quantity: number): QuantityState {
  const states = SPRITES.quantityStates;
  const band = states.find((s) => quantity >= s.min);
  return band ?? states[states.length - 1];
}

/** The jar sprite for an ingredient at a given stock quantity. */
export function ingredientSprite(
  id: string,
  quantity: number = SPRITES.defaultQuantity,
): SpriteStyle | undefined {
  if (!Object.hasOwn(SPRITES.ingredientCells, id)) return undefined;
  const cell = SPRITES.ingredientCells[id];
  return spriteCell(cell.sheet, cell.col, stateForQuantity(quantity).row);
}

/** The equipment sprite for a crafting verb; defaults to the idle frame. */
export function methodSprite(verb: string, frame?: Cell): SpriteStyle | undefined {
  if (!Object.hasOwn(SPRITES.methodEquip, verb)) return undefined;
  const [col, row] = frame ?? SPRITES.equipFrames.idle;
  return spriteCell(SPRITES.methodEquip[verb], col, row);
}

/** The vessel/result sprite; defaults to the empty bottle. */
export function potionSprite(key: string = SPRITES.defaultPotion): SpriteStyle | undefined {
  if (!Object.hasOwn(SPRITES.potionCells, key)) return undefined;
  const [col, row] = SPRITES.potionCells[key];
  return spriteCell(SPRITES.potionSheet, col, row);
}

// ── DOM seam ─────────────────────────────────────────────────────────────────

/**
 * Paint a resolved sprite onto an element. `undefined` is a deliberate no-op:
 * the element keeps whatever the CSS layer already gave it (AC4 fallback).
 */
export function applySprite(el: HTMLElement, style: SpriteStyle | undefined): void {
  if (style === undefined) return;
  el.style.backgroundImage = style.backgroundImage;
  el.style.backgroundSize = style.backgroundSize;
  el.style.backgroundPosition = style.backgroundPosition;
  el.style.setProperty('image-rendering', style.imageRendering);
}
