// Static/structural + pure-function TDD-Red tests for u7 — asset-pack integration.
// Contract (spec §5 / design §4–§5):
//   data/sprites.json           — sheet meta (file/cols/rows), ingredient cell table,
//                                 quantity→state thresholds, method→equipment map,
//                                 equipment frame coords, potion cell table (balance-as-data)
//   src/ui/sprite.ts            — pure `cellOffsets` / `spriteCell` / `stateForQuantity`
//                                 + thin `applySprite` DOM layer, fallback = `undefined`
//   src/styles/base.css         — bg-shop on <body> + pixelated
//   src/screens/crafting/*.css  — shelf backdrop, equip in-use keyframes, reduced-motion guard
//
// vitest runs with `environment: 'node'` — there is NO DOM here. The honest browser
// proof (computed background-image / image-rendering) lives in e2e/assets.spec.ts.
// AC coverage: AC1 (coordinate strings), AC3 (thresholds live in data), AC4 (fallback).
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  SPRITES,
  SHEET_URLS,
  loadSpriteData,
  cellOffsets,
  contentRectOffsets,
  spriteCell,
  stateForQuantity,
  ingredientSprite,
  methodSprite,
  potionSprite,
  applySprite,
} from '../../src/ui/sprite';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..'); // demos/apothecary/

const p = (rel: string) => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');

const SPRITES_JSON = 'data/sprites.json';
const SPRITE_TS = 'src/ui/sprite.ts';
const CRAFTING_CSS = 'src/screens/crafting/crafting.css';
const BASE_CSS = 'src/styles/base.css';
const CARDS_CSS = 'src/styles/cards.css';

interface RawContentRect {
  imageW: number;
  imageH: number;
  cellW: number;
  cellH: number;
  originX: number;
  originY: number;
  pitchX: number;
  pitchY: number;
}
interface RawSheet { file: string; cols: number; rows: number; contentRect?: RawContentRect }
interface RawState { state: string; row: number; min: number }
interface RawSprites {
  sheets: Record<string, RawSheet>;
  ingredientCells: Record<string, { sheet: string; col: number }>;
  quantityStates: RawState[];
  defaultQuantity: number;
  methodEquip: Record<string, string>;
  equipFrames: { idle: [number, number]; inUse: [number, number][] };
  equipFrameMs: number;
  potionCells: Record<string, [number, number]>;
  defaultPotion: string;
}

/** Lazy raw read — keeps a missing file from exploding at collection time. */
function rawSprites(): RawSprites {
  expect(existsSync(p(SPRITES_JSON)), `missing ${SPRITES_JSON}`).toBe(true);
  return JSON.parse(read(SPRITES_JSON)) as RawSprites;
}

interface RawIngredient { id: string; name: string; propertyTags: string[] }
function rawIngredients(): RawIngredient[] {
  return JSON.parse(read('data/ingredients.json')) as RawIngredient[];
}

/** A stand-in for HTMLElement good enough for the thin `applySprite` seam (node env). */
function stubElement(): {
  el: HTMLElement;
  style: Record<string, string>;
  props: Record<string, string>;
} {
  const style: Record<string, string> = {
    backgroundImage: '',
    backgroundSize: '',
    backgroundPosition: '',
  };
  const props: Record<string, string> = {};
  Object.defineProperty(style, 'setProperty', {
    value: (name: string, value: string): void => {
      props[name] = value;
    },
    enumerable: false,
  });
  Object.defineProperty(style, 'getPropertyValue', {
    value: (name: string): string => props[name] ?? '',
    enumerable: false,
  });
  return { el: { style } as unknown as HTMLElement, style, props };
}

// ─────────────────────────────────────────────────────────────────────────────
// T1 — data file exists, validates, and registers exactly the u7 sheets
// ─────────────────────────────────────────────────────────────────────────────
describe('data/sprites.json: sheet metadata (AC1)', () => {
  it(`ships ${SPRITES_JSON}`, () => {
    expect(existsSync(p(SPRITES_JSON)), `missing ${SPRITES_JSON}`).toBe(true);
  });

  it('parses through loadSpriteData() and matches the frozen SPRITES singleton', () => {
    const data = loadSpriteData(rawSprites());
    expect(Object.keys(data.sheets).sort()).toEqual(Object.keys(SPRITES.sheets).sort());
    expect(data.equipFrameMs).toBe(SPRITES.equipFrameMs);
  });

  it('registers the eight u7 sheets with their measured grids (spec §1.1)', () => {
    const expectedGrids: Record<string, { cols: number; rows: number }> = {
      'bg-shop': { cols: 1, rows: 1 },
      'ui-shelf': { cols: 1, rows: 1 },
      'ingredients-1': { cols: 4, rows: 3 },
      'ingredients-2': { cols: 4, rows: 3 },
      'equip-teapot': { cols: 2, rows: 2 },
      'equip-pot': { cols: 2, rows: 2 },
      'equip-mortar': { cols: 2, rows: 2 },
      potions: { cols: 3, rows: 2 },
    };
    const sheets = rawSprites().sheets;
    for (const [id, grid] of Object.entries(expectedGrids)) {
      expect(sheets[id], `sheets['${id}'] missing`).toBeTruthy();
      expect(sheets[id].cols, `sheets['${id}'].cols`).toBe(grid.cols);
      expect(sheets[id].rows, `sheets['${id}'].rows`).toBe(grid.rows);
      expect(sheets[id].file, `sheets['${id}'].file`).toBe(`${id}.png`);
    }
  });

  it('does NOT register out-of-scope sheets (ui-bubble / fallback-portrait-*, A5)', () => {
    const ids = Object.keys(rawSprites().sheets);
    for (const forbidden of ['ui-bubble', 'fallback-portrait-1', 'fallback-portrait-2']) {
      expect(ids.includes(forbidden), `${forbidden} is out of u7 scope`).toBe(false);
    }
  });

  it('rejects malformed data with a contextual `sprites: …` error (loader.ts convention)', () => {
    expect(() => loadSpriteData(null)).toThrow(/sprites:/);
    expect(() => loadSpriteData({})).toThrow(/sprites:/);
    const broken = rawSprites() as unknown as RawSprites;
    broken.sheets['ingredients-1'] = { file: 'ingredients-1.png', cols: 0, rows: -3 };
    expect(() => loadSpriteData(broken)).toThrow(/sprites:/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T1b — loadSpriteData() enforces the contract stateForQuantity() relies on
// (PR #41 review, sprite.ts:335): `states.find((s) => quantity >= s.min)` is only
// correct if `quantityStates` is strictly descending by `min`, the last band is a
// `min: 0` catch-all, and every band's `row` exists on every sheet it can paint.
// Previously only the *shipped data* happened to satisfy this; nothing enforced
// it, so a well-meaning reorder would silently paint the wrong row.
// ─────────────────────────────────────────────────────────────────────────────
describe('loadSpriteData(): quantityStates order/catch-all/row-range are enforced', () => {
  it('rejects a quantityStates table that is not strictly descending by min', () => {
    const broken = rawSprites() as unknown as RawSprites;
    // Swap the two highest bands so `min` goes 3, 7, 0 instead of 7, 3, 0.
    const [full, half, low] = broken.quantityStates;
    broken.quantityStates = [half, full, low];
    expect(() => loadSpriteData(broken)).toThrow(/sprites:.*quantityStates\[1\]\.min/);
  });

  it('rejects a quantityStates table whose lowest band is not min: 0', () => {
    const broken = rawSprites() as unknown as RawSprites;
    broken.quantityStates = broken.quantityStates.map((s, i) =>
      i === broken.quantityStates.length - 1 ? { ...s, min: 1 } : s,
    );
    expect(() => loadSpriteData(broken)).toThrow(/sprites:.*min: 0.*catch-all/);
  });

  it('rejects a quantityStates row that is out of range for a sheet it actually paints', () => {
    const broken = rawSprites() as unknown as RawSprites;
    const sheetId = broken.ingredientCells[Object.keys(broken.ingredientCells)[0]].sheet;
    const outOfRangeRow = broken.sheets[sheetId].rows; // one past the last valid row index
    broken.quantityStates = broken.quantityStates.map((s, i) =>
      i === 0 ? { ...s, row: outOfRangeRow } : s,
    );
    expect(() => loadSpriteData(broken)).toThrow(/sprites:.*quantityStates\[0\]\.row/);
  });

  it('still accepts the shipped data/sprites.json unchanged', () => {
    expect(() => loadSpriteData(rawSprites())).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T2 — ingredient cell table is 1:1 with data/ingredients.json (order included)
// ─────────────────────────────────────────────────────────────────────────────
describe('data/sprites.json: ingredient cell table matches the ingredient data', () => {
  it('has exactly one cell per ingredient, in data order', () => {
    const ids = rawIngredients().map((i) => i.id);
    expect(Object.keys(rawSprites().ingredientCells)).toEqual(ids);
  });

  it('points every ingredient at a registered sheet with an in-range column', () => {
    const { sheets, ingredientCells } = rawSprites();
    for (const [id, cell] of Object.entries(ingredientCells)) {
      const sheet = sheets[cell.sheet];
      expect(sheet, `${id} → unknown sheet '${cell.sheet}'`).toBeTruthy();
      expect(cell.col, `${id}.col out of range`).toBeGreaterThanOrEqual(0);
      expect(cell.col, `${id}.col out of range`).toBeLessThan(sheet.cols);
    }
  });

  it('maps every crafting method verb to a registered equipment sheet', () => {
    const { sheets, methodEquip } = rawSprites();
    const verbs = Object.keys(methodEquip);
    expect(verbs).toEqual(expect.arrayContaining(['우리기', '달이기', '빻기']));
    for (const [verb, sheetId] of Object.entries(methodEquip)) {
      expect(sheets[sheetId], `method '${verb}' → unknown sheet '${sheetId}'`).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T3 — AC1: the exact background-size / background-position strings are frozen
// ─────────────────────────────────────────────────────────────────────────────
describe('cellOffsets(): frozen percent-formula coordinate strings (AC1)', () => {
  it('4×3 ingredient sheet: size 400% 300%, x 0/33.3333/66.6667/100, y 0/50/100', () => {
    const size = '400% 300%';
    const xs = ['0%', '33.3333%', '66.6667%', '100%'];
    const ys = ['0%', '50%', '100%'];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const got = cellOffsets(4, 3, col, row);
        expect(got, `cellOffsets(4,3,${col},${row}) returned undefined`).toBeDefined();
        expect(got!.backgroundSize).toBe(size);
        expect(got!.backgroundPosition).toBe(`${xs[col]} ${ys[row]}`);
      }
    }
  });

  it('2×2 equipment sheet: size 200% 200%, x 0/100, y 0/100', () => {
    expect(cellOffsets(2, 2, 0, 0)).toEqual({
      backgroundSize: '200% 200%',
      backgroundPosition: '0% 0%',
    });
    expect(cellOffsets(2, 2, 1, 0)!.backgroundPosition).toBe('100% 0%');
    expect(cellOffsets(2, 2, 0, 1)!.backgroundPosition).toBe('0% 100%');
    expect(cellOffsets(2, 2, 1, 1)!.backgroundPosition).toBe('100% 100%');
  });

  it('3×2 potion sheet: size 300% 200%, x 0/50/100, y 0/100', () => {
    const xs = ['0%', '50%', '100%'];
    const ys = ['0%', '100%'];
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const got = cellOffsets(3, 2, col, row);
        expect(got!.backgroundSize).toBe('300% 200%');
        expect(got!.backgroundPosition).toBe(`${xs[col]} ${ys[row]}`);
      }
    }
  });

  it('1×1 sheet: no division by zero — size 100% 100%, position 0% 0%', () => {
    expect(cellOffsets(1, 1, 0, 0)).toEqual({
      backgroundSize: '100% 100%',
      backgroundPosition: '0% 0%',
    });
  });

  it('single-axis grids clamp only the degenerate axis to 0%', () => {
    expect(cellOffsets(4, 1, 2, 0)!.backgroundPosition).toBe('66.6667% 0%');
    expect(cellOffsets(1, 3, 0, 2)!.backgroundPosition).toBe('0% 100%');
  });

  it('emits no px units (256/3 is not an integer — percent formula only, §3.1)', () => {
    const got = cellOffsets(4, 3, 1, 1)!;
    expect(got.backgroundPosition).not.toMatch(/px/);
    expect(got.backgroundSize).not.toMatch(/px/);
  });
});

describe('spriteCell(): sheet id + cell → CSS style object (AC1)', () => {
  it('resolves a real sheet to size/position/image/pixelated (exact-grid sheet)', () => {
    // equip-teapot has no `contentRect` — an exact 2×2 division — so this exercises
    // spriteCell()'s plumbing independent of the ingredient sheets' measured geometry.
    const style = spriteCell('equip-teapot', 1, 1);
    expect(style, 'spriteCell("equip-teapot",1,1) returned undefined').toBeDefined();
    expect(style!.backgroundSize).toBe('200% 200%');
    expect(style!.backgroundPosition).toBe('100% 100%');
    // Bundled URL is hashed in dist and `/assets/…` in dev — only the stem is stable.
    expect(style!.backgroundImage).toContain('equip-teapot');
    expect(style!.imageRendering).toBe('pixelated');
  });

  it('resolves a `contentRect` sheet through contentRectOffsets(), not the plain grid division', () => {
    const rect = rawSprites().sheets['ingredients-1'].contentRect;
    expect(rect, "sheets['ingredients-1'].contentRect missing").toBeTruthy();
    const style = spriteCell('ingredients-1', 1, 1);
    const expected = contentRectOffsets(rect!, 1, 1)!;
    expect(style!.backgroundSize).toBe(expected.backgroundSize);
    expect(style!.backgroundPosition).toBe(expected.backgroundPosition);
    expect(style!.backgroundImage).toContain('ingredients-1');
    expect(style!.imageRendering).toBe('pixelated');
  });

  it('reads grid meta from data only (equip 2×2, potions 3×2)', () => {
    expect(spriteCell('equip-teapot', 1, 1)!.backgroundSize).toBe('200% 200%');
    expect(spriteCell('potions', 2, 1)!.backgroundPosition).toBe('100% 100%');
    expect(spriteCell('bg-shop', 0, 0)!.backgroundSize).toBe('100% 100%');
  });

  it('exposes a basename-keyed bundle URL map for every registered sheet', () => {
    for (const meta of Object.values(rawSprites().sheets)) {
      expect(SHEET_URLS[meta.file], `SHEET_URLS['${meta.file}'] missing`).toBeTruthy();
    }
  });
});

describe('domain sprite helpers use the data tables (AC1)', () => {
  it('ingredientSprite() resolves every ingredient id at the default quantity', () => {
    const { ingredientCells, sheets, defaultQuantity } = rawSprites();
    for (const ing of rawIngredients()) {
      const style = ingredientSprite(ing.id);
      expect(style, `ingredientSprite('${ing.id}') returned undefined`).toBeDefined();
      const cell = ingredientCells[ing.id];
      const sheet = sheets[cell.sheet];
      const row = stateForQuantity(defaultQuantity).row;
      // Every ingredient sheet ships a measured `contentRect` (T-content-rect below) —
      // fall back to the plain division only for a sheet that doesn't declare one.
      const expected =
        sheet.contentRect !== undefined
          ? contentRectOffsets(sheet.contentRect, cell.col, row)!
          : cellOffsets(sheet.cols, sheet.rows, cell.col, row)!;
      expect(style!.backgroundPosition).toBe(expected.backgroundPosition);
      expect(style!.backgroundImage).toContain(cell.sheet);
    }
  });

  it('methodSprite() defaults to the idle frame of the mapped equipment sheet', () => {
    const { methodEquip, equipFrames } = rawSprites();
    for (const [verb, sheetId] of Object.entries(methodEquip)) {
      const style = methodSprite(verb);
      expect(style, `methodSprite('${verb}') returned undefined`).toBeDefined();
      expect(style!.backgroundImage).toContain(sheetId);
      expect(style!.backgroundPosition).toBe(
        cellOffsets(2, 2, equipFrames.idle[0], equipFrames.idle[1])!.backgroundPosition,
      );
    }
  });

  it('methodSprite() accepts an explicit in-use frame', () => {
    const { equipFrames } = rawSprites();
    for (const [col, row] of equipFrames.inUse) {
      const style = methodSprite('우리기', [col, row]);
      expect(style!.backgroundPosition).toBe(cellOffsets(2, 2, col, row)!.backgroundPosition);
    }
  });

  it('potionSprite() defaults to the empty vessel cell (A4)', () => {
    const { potionCells, defaultPotion } = rawSprites();
    const cell = potionCells[defaultPotion];
    expect(cell, `potionCells['${defaultPotion}'] missing`).toBeTruthy();
    const style = potionSprite();
    expect(style, 'potionSprite() returned undefined').toBeDefined();
    expect(style!.backgroundImage).toContain('potions');
    expect(style!.backgroundPosition).toBe(cellOffsets(3, 2, cell[0], cell[1])!.backgroundPosition);
  });

  it('potionSprite() resolves every declared outcome cell', () => {
    for (const [key, cell] of Object.entries(rawSprites().potionCells)) {
      const style = potionSprite(key);
      expect(style, `potionSprite('${key}') returned undefined`).toBeDefined();
      expect(style!.backgroundPosition).toBe(cellOffsets(3, 2, cell[0], cell[1])!.backgroundPosition);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-content-rect — AC1/AC2: each ingredient cell's crop window actually contains
// the whole jar, not a sliver of its neighbour (PR #41 review, sprite.ts:274).
//
// `background-image`/`background-size`/`background-position` are computed CSS
// strings, not pixels — vitest runs `environment: 'node'` (no DOM, no canvas), so
// this cannot re-derive the crop window by rendering. Instead it checks the crop
// window *as pixels* (converting `contentRectOffsets()`'s percent formula back
// with the sheet's own `imageW`/`imageH`) against the ingredients' actual alpha
// bounding boxes, measured once, directly, off the shipped PNGs:
//
//   python3 -c "
//   from PIL import Image; import numpy as np
//   im = Image.open('assets/ingredients-1.png').convert('RGBA')
//   a = np.array(im)[:, :, 3] > 0
//   # column runs = np.where(a.any(axis=0))[0] contiguous runs; rows likewise.
//   "
//
// giving column content ranges `[52,107) [127,182) [202,257) [276,331)` and row
// content ranges `[19,90) [98,168) [175,244)` for ingredients-1.png, and column
// `[54,114) [127,187) [200,260) [272,332)` / row `[15,96) [105,185) [194,249)`
// for ingredients-2.png (both 384×256). If `data/sprites.json`'s `contentRect`
// is ever retuned, this is what must still hold.
// ─────────────────────────────────────────────────────────────────────────────
describe('ingredient sheets: measured content rect fully contains every jar (AC1/AC2)', () => {
  interface Bbox { readonly x: [number, number]; readonly y: [number, number] }

  // [start, end) pixel ranges of non-transparent content, per nominal column/row —
  // measured directly off the alpha channel of the shipped PNGs (see module doc above).
  const MEASURED: Record<string, { cols: Bbox['x'][]; rows: Bbox['y'][] }> = {
    'ingredients-1': {
      cols: [[52, 107], [127, 182], [202, 257], [276, 331]],
      rows: [[19, 90], [98, 168], [175, 244]],
    },
    'ingredients-2': {
      cols: [[54, 114], [127, 187], [200, 260], [272, 332]],
      rows: [[15, 96], [105, 185], [194, 249]],
    },
  };

  /** The crop window `contentRectOffsets()` actually produces, back in pixels. */
  function cropWindow(
    rect: RawContentRect,
    col: number,
    row: number,
  ): { x: [number, number]; y: [number, number] } {
    const offsets = contentRectOffsets(rect, col, row)!;
    const [posXPct, posYPct] = offsets.backgroundPosition.split(' ').map((s) => parseFloat(s));
    const spanX = rect.imageW - rect.cellW;
    const spanY = rect.imageH - rect.cellH;
    const startX = spanX > 0 ? (posXPct / 100) * spanX : 0;
    const startY = spanY > 0 ? (posYPct / 100) * spanY : 0;
    return { x: [startX, startX + rect.cellW], y: [startY, startY + rect.cellH] };
  }

  // `percent()` rounds to 4 decimals before the test parses the string back to a
  // pixel offset, so a window that lands exactly on a content edge can round-trip
  // ~0.0002px "short" — nowhere near a real clip (sub-pixel, invisible at any
  // realistic display size), but enough to fail a bit-exact comparison. Tolerate it.
  const EPSILON_PX = 0.01;

  it.each(Object.keys(MEASURED))('%s: every (col, row) crop window ⊇ the measured jar bbox', (sheetId) => {
    const sheet = rawSprites().sheets[sheetId];
    const rect = sheet.contentRect;
    expect(rect, `sheets['${sheetId}'].contentRect missing`).toBeTruthy();
    const { cols, rows } = MEASURED[sheetId];

    for (let row = 0; row < rows.length; row += 1) {
      for (let col = 0; col < cols.length; col += 1) {
        const window = cropWindow(rect!, col, row);
        const [contentX0, contentX1] = cols[col];
        const [contentY0, contentY1] = rows[row];
        const label = `${sheetId}(col=${col},row=${row})`;
        expect(window.x[0], `${label}: crop left ${window.x[0]} clips content left ${contentX0}`).toBeLessThanOrEqual(contentX0 + EPSILON_PX);
        expect(window.x[1], `${label}: crop right ${window.x[1]} clips content right ${contentX1}`).toBeGreaterThanOrEqual(contentX1 - EPSILON_PX);
        expect(window.y[0], `${label}: crop top ${window.y[0]} clips content top ${contentY0}`).toBeLessThanOrEqual(contentY0 + EPSILON_PX);
        expect(window.y[1], `${label}: crop bottom ${window.y[1]} clips content bottom ${contentY1}`).toBeGreaterThanOrEqual(contentY1 - EPSILON_PX);
      }
    }
  });

  it('ingredientCells actually point at the measured sheets (no silent drift)', () => {
    const { ingredientCells } = rawSprites();
    const sheetIds = new Set(Object.values(ingredientCells).map((c) => c.sheet));
    for (const sheetId of sheetIds) {
      expect(Object.hasOwn(MEASURED, sheetId), `no measured bbox fixture for '${sheetId}'`).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T4/T5 — AC3: quantity thresholds live in data, never inline in src/
// ─────────────────────────────────────────────────────────────────────────────
describe('stateForQuantity(): thresholds come from data/sprites.json only (AC3)', () => {
  it('declares a descending threshold table reaching 0', () => {
    const states = rawSprites().quantityStates;
    expect(states.length, 'need at least full/half/low').toBeGreaterThanOrEqual(3);
    for (let i = 1; i < states.length; i += 1) {
      expect(states[i].min, `quantityStates[${i}].min must be < [${i - 1}].min`).toBeLessThan(
        states[i - 1].min,
      );
    }
    expect(states[states.length - 1].min, 'lowest threshold must reach 0').toBe(0);
    // rows walk the sheet top-down: 0 = full, 1 = half, 2 = low (A3)
    states.forEach((s, i) => {
      expect(s.row, `quantityStates[${i}].row must be its sheet row index`).toBe(i);
    });
  });

  it('returns, for each threshold, exactly the state the DATA declares (no re-typed numbers)', () => {
    const states = rawSprites().quantityStates;
    states.forEach((s, i) => {
      const at = stateForQuantity(s.min);
      expect(at.state, `quantity ${s.min} → state`).toBe(s.state);
      expect(at.row, `quantity ${s.min} → row`).toBe(s.row);

      // One below this threshold falls through to the next (lower) band; the
      // bottom band absorbs everything below it.
      const below = stateForQuantity(s.min - 1);
      const expected = states[i + 1] ?? states[states.length - 1];
      expect(below.state, `quantity ${s.min - 1} → state`).toBe(expected.state);
      expect(below.row, `quantity ${s.min - 1} → row`).toBe(expected.row);
    });
  });

  it('clamps out-of-band quantities to the top and bottom rows', () => {
    const states = rawSprites().quantityStates;
    const top = states[0];
    const bottom = states[states.length - 1];
    expect(stateForQuantity(top.min * 10 + 1).row).toBe(top.row);
    expect(stateForQuantity(0).row).toBe(bottom.row);
    expect(stateForQuantity(-5).row).toBe(bottom.row);
  });

  it('the default quantity renders the full row (A2 — no stock system in v1)', () => {
    const { defaultQuantity, quantityStates } = rawSprites();
    expect(stateForQuantity(defaultQuantity).row).toBe(quantityStates[0].row);
  });

  it('src/ui/sprite.ts inlines no numeric threshold comparison (AC3, D7)', () => {
    // `=>` is stripped first so arrow functions are not read as comparisons.
    const src = read(SPRITE_TS).split('=>').join(';');
    const inlineCompare = src.match(/[><]=?\s*(?:[2-9]|\d{2,})/);
    expect(
      inlineCompare,
      `sprite.ts compares against an inline literal ("${inlineCompare?.[0] ?? ''}") — thresholds belong in data/sprites.json`,
    ).toBeNull();
  });

  it('src/ui/sprite.ts does not re-type the grid/threshold numbers as its own constants', () => {
    const src = read(SPRITE_TS);
    expect(/quantityStates/.test(src), 'sprite.ts never reads quantityStates from data').toBe(true);
    expect(/sprites\.json/.test(src), 'sprite.ts never imports data/sprites.json').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T6–T9 — AC4: missing sheet / missing file / out-of-range → undefined, never throw
// ─────────────────────────────────────────────────────────────────────────────
describe('fallback: unresolvable sprites return undefined and never throw (AC4)', () => {
  it('unknown sheet id → undefined', () => {
    expect(() => spriteCell('no-such-sheet', 0, 0)).not.toThrow();
    expect(spriteCell('no-such-sheet', 0, 0)).toBeUndefined();
    expect(spriteCell('', 0, 0)).toBeUndefined();
  });

  it('missing asset FILE (empty URL map) → undefined, so the v1 CSS look survives', () => {
    // The URL-map seam proves the missing-file path without touching assets/** (C1).
    expect(() => spriteCell('bg-shop', 0, 0, {})).not.toThrow();
    expect(spriteCell('bg-shop', 0, 0, {})).toBeUndefined();
    expect(spriteCell('ingredients-1', 0, 0, {})).toBeUndefined();
  });

  it('out-of-range / non-integer cells → undefined', () => {
    expect(spriteCell('ingredients-1', -1, 0)).toBeUndefined();
    expect(spriteCell('ingredients-1', 4, 0)).toBeUndefined();
    expect(spriteCell('ingredients-1', 0, 3)).toBeUndefined();
    expect(spriteCell('ingredients-1', 1.5, 0)).toBeUndefined();
    expect(cellOffsets(0, 3, 0, 0)).toBeUndefined();
    expect(cellOffsets(4, 3, Number.NaN, 0)).toBeUndefined();
  });

  it('unknown ingredient / method / potion keys → undefined (no exception, no blank box)', () => {
    expect(() => ingredientSprite('no-such-ingredient')).not.toThrow();
    expect(ingredientSprite('no-such-ingredient')).toBeUndefined();
    expect(methodSprite('허깨비')).toBeUndefined();
    expect(potionSprite('no-such-potion')).toBeUndefined();
  });

  it('applySprite(el, undefined) is a no-op — the v1 CSS fallback stays intact', () => {
    const { el, style, props } = stubElement();
    expect(() => applySprite(el, undefined)).not.toThrow();
    expect(style.backgroundImage).toBe('');
    expect(style.backgroundSize).toBe('');
    expect(style.backgroundPosition).toBe('');
    expect(Object.keys(props)).toEqual([]);
  });

  it('applySprite(el, style) paints image + geometry + pixelated', () => {
    const { el, style, props } = stubElement();
    const sprite = spriteCell('potions', 0, 0)!;
    applySprite(el, sprite);
    expect(style.backgroundImage).toContain('potions');
    expect(style.backgroundSize).toBe('300% 200%');
    expect(style.backgroundPosition).toBe('0% 0%');
    const rendering = props['image-rendering'] ?? (style as Record<string, string>).imageRendering;
    expect(rendering, 'applySprite did not set image-rendering: pixelated').toBe('pixelated');
  });

  it('every registered sheet file that exists on disk resolves; missing ones fall back (T9)', () => {
    for (const [id, meta] of Object.entries(rawSprites().sheets)) {
      const onDisk = existsSync(p(`assets/${meta.file}`));
      const style = spriteCell(id, 0, 0);
      if (onDisk) {
        expect(style, `${meta.file} exists but spriteCell('${id}') is undefined`).toBeDefined();
      } else {
        expect(style, `${meta.file} is absent — spriteCell('${id}') must fall back`).toBeUndefined();
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T10–T12 — CSS skin: keyframes match the data, tokens match, reduced-motion guard
// ─────────────────────────────────────────────────────────────────────────────
describe('crafting.css: equipment in-use loop is driven by the data frames (D4)', () => {
  const keyframeBlock = (): string => {
    const css = read(CRAFTING_CSS);
    const m = css.match(/@keyframes\s+equip-inuse\s*\{([\s\S]*?)\n\}/);
    expect(m, 'no `@keyframes equip-inuse` block in crafting.css').not.toBeNull();
    return m![1];
  };

  it('steps through exactly the sprites.json inUse frames (discrete, no interpolation)', () => {
    const { equipFrames } = rawSprites();
    const expected = equipFrames.inUse.map(
      ([col, row]) => cellOffsets(2, 2, col, row)!.backgroundPosition,
    );
    const stops = [...keyframeBlock().matchAll(/background-position\s*:\s*([^;]+);/g)].map((m) =>
      m[1].trim().replace(/\s+/g, ' '),
    );
    expect(stops.length, 'expected at least one stop per in-use frame').toBeGreaterThanOrEqual(
      expected.length,
    );
    expect(stops.slice(0, expected.length)).toEqual(expected);
    for (const stop of stops) {
      expect(expected, `keyframe stop "${stop}" is not a declared inUse frame`).toContain(stop);
    }
  });

  it('holds each frame (step-end / steps(1)) instead of interpolating', () => {
    const css = read(CRAFTING_CSS);
    expect(/step-end|steps\(\s*1\s*/.test(css), 'in-use loop interpolates between cells').toBe(true);
  });

  it('publishes a per-frame duration token that matches sprites.json equipFrameMs (D6)', () => {
    const m = read(CRAFTING_CSS).match(/--sprite-equip-frame\s*:\s*(\d+)ms/);
    expect(m, 'no `--sprite-equip-frame: <n>ms` token in crafting.css').not.toBeNull();
    expect(Number(m![1])).toBe(rawSprites().equipFrameMs);
  });

  it('the loop duration multiplier (`--sprite-equip-frame * N`) equals equipFrames.inUse.length', () => {
    // PR #41 review (crafting.css:173): the `* 3` is really `inUse.length` — nothing
    // ties it to the data, so a 4th in-use frame would paint correctly (previous test)
    // but play back at the wrong speed with no red test. Guard the multiplier itself.
    const css = read(CRAFTING_CSS);
    const m = css.match(
      /\.card--selected\s+\.card__sprite--equip\s*\{[^}]*animation:\s*equip-inuse\s+calc\(\s*var\(--sprite-equip-frame\)\s*\*\s*(\d+)\s*\)/,
    );
    expect(m, 'no `calc(var(--sprite-equip-frame) * <n>)` animation duration found').not.toBeNull();
    expect(Number(m![1])).toBe(rawSprites().equipFrames.inUse.length);
  });

  it('animates only the selected method card sprite', () => {
    const css = read(CRAFTING_CSS);
    expect(/\.card__sprite--equip\b/.test(css), 'no .card__sprite--equip rule').toBe(true);
    expect(/\.card--selected[^{]*\.card__sprite--equip/.test(css), 'loop is not gated on .card--selected').toBe(true);
  });

  it('guards the new loop behind prefers-reduced-motion (NF4 — animations.css is not loaded here)', () => {
    const css = read(CRAFTING_CSS);
    const m = css.match(/@media[^{]*prefers-reduced-motion\s*:\s*reduce[^{]*\{([\s\S]*?\n\})/);
    expect(m, 'crafting.css has no prefers-reduced-motion guard').not.toBeNull();
    const body = m![1];
    expect(/card__sprite--equip/.test(body), 'guard does not cover .card__sprite--equip').toBe(true);
    expect(/animation\s*:\s*none|animation-play-state|animation-duration/.test(body), 'guard does not stop the animation').toBe(true);
  });
});

describe('CSS skin: the asset pack is actually referenced (AC2 static half)', () => {
  it('base.css paints bg-shop on <body> with pixelated rendering', () => {
    const css = read(BASE_CSS);
    expect(/url\(\s*['"]?[^)'"]*bg-shop\.png/.test(css), 'base.css does not reference bg-shop.png').toBe(true);
    expect(/image-rendering\s*:\s*pixelated/.test(css), 'base.css sets no image-rendering: pixelated').toBe(true);
    expect(/:root\s*{/.test(css), 'base.css lost its :root token block').toBe(true);
  });

  it('crafting.css backs the ingredient shelf with ui-shelf', () => {
    const css = read(CRAFTING_CSS);
    expect(/url\(\s*['"]?[^)'"]*ui-shelf\.png/.test(css), 'crafting.css does not reference ui-shelf.png').toBe(true);
    expect(/image-rendering\s*:\s*pixelated/.test(css), 'crafting.css sets no image-rendering: pixelated').toBe(true);
  });

  it('cards.css lays out the decorative sprite child', () => {
    expect(/\.card__sprite\b/.test(read(CARDS_CSS)), 'no .card__sprite rule in cards.css').toBe(true);
  });

  it('no CSS layer references a remote resource (§4.2)', () => {
    for (const f of [BASE_CSS, CARDS_CSS, CRAFTING_CSS]) {
      const css = read(f);
      expect(/url\(\s*['"]?https?:/i.test(css), `${f} references a remote url()`).toBe(false);
      expect(/@import\s+(?:url\()?\s*['"]?https?:/i.test(css), `${f} has a remote @import`).toBe(false);
    }
  });

  // PR #41 review (data/sprites.json:3): `bg-shop`/`ui-shelf` are registered as
  // `sheets` entries (so their file existing/getting bundled is still proven, see
  // T9 in the fallback describe below) but base.css/crafting.css paint them via a
  // hardcoded `url()`, not `spriteCell()`. That's two independent spellings of the
  // same filename with no code path forcing them to agree — a rename in
  // sprites.json alone would leave the CSS 404ing with nothing red. Pin the CSS
  // filename to `sheets['<id>'].file` so the two can't silently drift apart.
  it("base.css's bg-shop url matches sheets['bg-shop'].file (no CSS/data drift)", () => {
    const { sheets } = rawSprites();
    const m = read(BASE_CSS).match(/url\(\s*['"]?[^)'"]*\/(bg-shop\.png)['"]?\s*\)/);
    expect(m, 'base.css has no bg-shop.png url()').not.toBeNull();
    expect(m![1]).toBe(sheets['bg-shop'].file);
  });

  it("crafting.css's ui-shelf url matches sheets['ui-shelf'].file (no CSS/data drift)", () => {
    const { sheets } = rawSprites();
    const m = read(CRAFTING_CSS).match(/url\(\s*['"]?[^)'"]*\/(ui-shelf\.png)['"]?\s*\)/);
    expect(m, 'crafting.css has no ui-shelf.png url()').not.toBeNull();
    expect(m![1]).toBe(sheets['ui-shelf'].file);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Membrane / bundling invariants the new module must not break (§1.4, C4)
// ─────────────────────────────────────────────────────────────────────────────
describe('src/ui/sprite.ts: membrane + bundling invariants', () => {
  const src = (): string => read(SPRITE_TS);

  it('makes no runtime network call (sprites.json is a static import, C4)', () => {
    expect(/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(src()), 'sprite.ts performs a network call').toBe(false);
  });

  it('creates no native form control and no contenteditable surface (C3)', () => {
    const s = src();
    expect(/createElement\(\s*['"](?:select|input|textarea)['"]/.test(s)).toBe(false);
    expect(/<\s*(?:select|input|textarea)\b/.test(s)).toBe(false);
    expect(/contenteditable/i.test(s)).toBe(false);
  });

  it('resolves asset URLs through import.meta.glob, never a runtime-built path (§3.3)', () => {
    const s = src();
    expect(/import\.meta\.glob\(/.test(s), 'sprite.ts does not use import.meta.glob').toBe(true);
    expect(/\?url/.test(s), 'sprite.ts does not request ?url bundle URLs').toBe(true);
    expect(/`\/assets\/\$\{/.test(s), 'sprite.ts builds an asset path at runtime (404 risk)').toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// view.ts wiring (source-level; the browser proof is e2e/assets.spec.ts)
// ─────────────────────────────────────────────────────────────────────────────
describe('crafting view.ts: sprites are attached additively (C5)', () => {
  const src = (): string => read('src/screens/crafting/view.ts');

  it('pulls its sprites from src/ui/sprite', () => {
    expect(/from\s+['"][^'"]*ui\/sprite['"]/.test(src()), 'view.ts does not import the sprite module').toBe(true);
    expect(/applySprite/.test(src()), 'view.ts never calls applySprite').toBe(true);
  });

  it('marks the sprite layers decorative and tags them for e2e', () => {
    const s = src();
    expect(/card__sprite/.test(s), 'view.ts adds no .card__sprite layer').toBe(true);
    expect(/aria-hidden|ariaHidden/.test(s), 'sprite layers are not aria-hidden (A6)').toBe(true);
    expect(/dataset\.sprite|data-sprite/.test(s), 'sprite layers carry no data-sprite hook').toBe(true);
    expect(/vessel/.test(s), 'view.ts renders no potion vessel element').toBe(true);
  });

  it('keeps the frozen DOM contract untouched (data-group / data-id / data-value / commit)', () => {
    const s = src();
    for (const token of [
      "makeCard('ingredient'",
      "makeCard('method'",
      "makeCard('declaration'",
      'dataset.group',
      'dataset.id',
      'dataset.value',
      "dataset.action = 'commit'",
      'card--selected',
      'aria-pressed',
    ]) {
      expect(s.includes(token), `view.ts no longer contains \`${token}\``).toBe(true);
    }
  });
});
