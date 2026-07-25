// portrait.ts — u9 portrait component: 4x2 expression-sheet slicing, tier
// columns, idle blinking, backlit silhouette, framed panel (PRD §2.1 sheet
// paragraph · §2.3 "Generated frames are for expressions + blink only" /
// "Portraits render inside a framed card panel" · §3-3 injected timing).
//
// The sheet is ONE image: four columns (one patience tier each, calm -> fed up)
// x two rows (eyes open on top, mid-blink underneath). Swapping the visible cell
// is a `background-position` move on a CSS-sized box, so a portrait change is a
// repaint and never a reflow — nothing else on the screen moves.
//
// Three rules shape this module:
//   * The grid is u3's (`SHEET_COLUMNS`/`SHEET_ROWS`), re-exported, never a second
//     copy of the numbers. A regenerated sheet at another grid then breaks in one
//     place instead of silently showing half a face.
//   * Every wait flows through the injected `Clock` seam and every random number
//     through an injected `Rng` (§3-3). This file references no host timing or
//     entropy API at all, so the blink schedule is replayable from a seed.
//   * The look lives in `../styles/portrait.css` — screens never hand-roll
//     portrait CSS. The stylesheet owns the framed panel, the pixelated upscale
//     and the `filter: brightness(0)` silhouette; this module only toggles a
//     class and writes the two computed background properties.
//
// Pixelation boundary: a RUNTIME sheet must already have passed u3's
// `pixelateSheet()` before it reaches `setSheet()` — turning the returned
// `PixelCanvas` into a URL is the consumer's job (see the `pixelate` doc
// comment), so this component takes a URL and renders it, gated by the caller.
import '../styles/base.css';
import '../styles/portrait.css';
import { SHEET_COLUMNS, SHEET_ROWS } from './pixelate';
import type { CancelTimer, Clock } from '../pipeline/clock';
import type { Rng } from '../pipeline/persona';

// ── The grid ─────────────────────────────────────────────────────────────────

/** Columns per sheet — one expression per patience tier. */
export const PORTRAIT_COLUMNS = SHEET_COLUMNS;
/** Rows per sheet — eyes open (top), mid-blink (bottom). */
export const PORTRAIT_ROWS = SHEET_ROWS;

const LAST_COLUMN = PORTRAIT_COLUMNS - 1;
const LAST_ROW = PORTRAIT_ROWS - 1;

/** The two CSS properties that pick one cell out of the sheet. */
export interface PortraitCell {
  readonly backgroundSize: string;
  readonly backgroundPosition: string;
}

/**
 * Percentages, not pixels: the panel is sized by CSS and may be responsive, so a
 * px offset would slide off the intended cell at any other panel size. Trailing
 * zeros are dropped so the value the component writes inline is the value tests
 * and reviewers read back.
 */
function percent(value: number): string {
  return `${Number(value.toFixed(4))}%`;
}

// One cell fills the element: scale the sheet to grid x 100% on each axis.
const SHEET_BACKGROUND_SIZE = `${percent(PORTRAIT_COLUMNS * 100)} ${percent(PORTRAIT_ROWS * 100)}`;

/**
 * The cell for `tier` (column) in the open/mid-blink row — pure, frozen, and
 * `undefined` for anything that is not one of the four tiers, so a bad tier can
 * never paint a half-cell (the caller simply keeps the cell it already had).
 *
 * `index / (extent - 1)` percentage positioning is what CSS backgrounds mean by
 * a percentage: 0% aligns the sheet's left edge with the box's, 100% its right
 * edge — which lands exactly on the last column.
 */
export function portraitCell(tier: number, blink: boolean): PortraitCell | undefined {
  if (!Number.isInteger(tier) || tier < 0 || tier > LAST_COLUMN) return undefined;
  const row = blink ? LAST_ROW : 0;
  return Object.freeze({
    backgroundSize: SHEET_BACKGROUND_SIZE,
    backgroundPosition: `${percent((tier / LAST_COLUMN) * 100)} ${percent((row / LAST_ROW) * 100)}`,
  });
}

// ── The blink schedule ───────────────────────────────────────────────────────

/** Inclusive range of the wait between blinks, in ms (PRD: 3–6s). */
export const BLINK_INTERVAL_MS = Object.freeze([3000, 6000] as const);
/** Inclusive range a blink holds the eyes shut, in ms (PRD: 120–200ms). */
export const BLINK_DURATION_MS = Object.freeze([120, 200] as const);

/** One drawn blink: how long to wait, then how long to hold it. */
export interface BlinkTiming {
  readonly delayMs: number;
  readonly durationMs: number;
}

/**
 * One draw mapped onto an inclusive ms range. A draw outside the `Rng` contract
 * throws instead of scheduling nonsense (a negative wait would blink forever in
 * the same instant, a draw > 1 would hold the eyes shut past the range).
 */
function drawMs(rng: Rng, range: readonly [number, number]): number {
  const value = rng();
  if (!(value >= 0 && value < 1)) {
    throw new RangeError('portrait blink rng draw out of [0, 1) contract');
  }
  return range[0] + Math.round(value * (range[1] - range[0]));
}

/**
 * Draws the next blink from `rng`: interval FIRST, duration second. That order is
 * part of the contract — flipping it would silently re-shuffle every seeded
 * replay of a demo run.
 */
export function nextBlink(rng: Rng): BlinkTiming {
  const delayMs = drawMs(rng, BLINK_INTERVAL_MS);
  const durationMs = drawMs(rng, BLINK_DURATION_MS);
  return Object.freeze({ delayMs, durationMs });
}

export interface BlinkScheduleOptions {
  /** The injected timing seam — the ONLY thing this schedule waits on (§3-3). */
  readonly clock: Clock;
  /** Injected entropy: the same seed must replay the same blinks. */
  readonly rng: Rng;
  /** `true` closes the eyes (bottom row), `false` opens them again. */
  readonly onBlink: (blink: boolean) => void;
}

/**
 * Runs the idle blink loop on the injected clock: close the eyes for the drawn
 * hold, open them, wait the drawn interval, repeat. Nothing fires on mount — a
 * portrait that blinks the instant it appears reads as a glitch, so the first
 * close waits the full interval (`BLINK_INTERVAL_MS[1]`) and the arriving face
 * holds a steady open-eyed gaze before the randomized loop takes over. From that
 * first blink on, every hold and every wait is drawn from `rng`.
 *
 * The returned canceller is idempotent, leaves no booking behind and, if it lands
 * mid-blink, hands the eyes back OPEN — a cancelled schedule must never freeze a
 * face with its eyes shut.
 */
export function startBlinking({ clock, rng, onBlink }: BlinkScheduleOptions): CancelTimer {
  let cancelPending: CancelTimer | null = null;
  let closed = false;
  let stopped = false;

  const armClose = (delayMs: number): void => {
    cancelPending = clock.after(delayMs, () => {
      cancelPending = null;
      closed = true;
      onBlink(true);
      // One draw pair per blink: this blink's hold, plus the wait until the next.
      const timing = nextBlink(rng);
      cancelPending = clock.after(timing.durationMs, () => {
        cancelPending = null;
        closed = false;
        onBlink(false);
        armClose(timing.delayMs);
      });
    });
  };

  armClose(BLINK_INTERVAL_MS[1]);

  return () => {
    if (stopped) return;
    stopped = true;
    if (cancelPending !== null) {
      cancelPending();
      cancelPending = null;
    }
    if (closed) {
      closed = false;
      onBlink(false);
    }
  };
}

// ── The DOM layer ────────────────────────────────────────────────────────────

const FRAME_CLASS = 'portrait-frame';
const CELL_CLASS = 'portrait-frame__cell';
const SILHOUETTE_CLASS = 'portrait-frame__cell--silhouette';
const ARRIVED_CLASS = 'portrait-frame__cell--arrived';

export interface PortraitOptions {
  /** Starting column; anything out of range keeps tier 0. */
  readonly tier?: number;
  /**
   * An ALREADY-pixelated sheet URL. Omit it to mount the backlit silhouette and
   * call `setSheet()` when the portrait arrives.
   */
  readonly sheetUrl?: string;
  /** Provide both to run the idle blink loop; omit for a still portrait. */
  readonly blinkClock?: Clock;
  readonly blinkRng?: Rng;
}

export interface PortraitHandle {
  /** The framed panel element — the box that must never change size. */
  readonly frame: HTMLElement;
  /** Moves to the tier's column. Out-of-range tiers are a silent no-op. */
  setTier(tier: number): void;
  /** Switches the row (eyes open / mid-blink). */
  setBlink(blink: boolean): void;
  /** Shows a pixelated sheet and resolves the silhouette inside the same panel. */
  setSheet(url: string): void;
  readonly tier: number;
  readonly blink: boolean;
  readonly silhouette: boolean;
  /** Stops the blink loop and removes the panel. */
  destroy(): void;
}

/**
 * Builds the framed panel and its sliced cell inside `parent` and returns the
 * handle screens drive. The panel's size comes from the stylesheet, never from
 * the image, so the silhouette, the arrival and every tier/blink swap all resolve
 * inside one box that never moves.
 */
export function mountPortrait(parent: HTMLElement, options: PortraitOptions = {}): PortraitHandle {
  const doc = parent.ownerDocument;
  const frame = doc.createElement('div');
  frame.className = FRAME_CLASS;
  frame.dataset.testid = 'portrait-frame';

  const cell = doc.createElement('div');
  cell.className = CELL_CLASS;
  cell.dataset.testid = 'portrait-cell';
  frame.append(cell);
  parent.append(frame);

  let tier = 0;
  let blink = false;
  let silhouette = true;
  cell.classList.add(SILHOUETTE_CLASS);

  const paint = (next: number, nextBlinkState: boolean): void => {
    const style = portraitCell(next, nextBlinkState);
    if (style === undefined) return;
    tier = next;
    blink = nextBlinkState;
    cell.style.backgroundSize = style.backgroundSize;
    cell.style.backgroundPosition = style.backgroundPosition;
  };

  // Tier 0 first, so an out-of-range `options.tier` degrades to a painted calm
  // column instead of a cell with no offsets at all.
  paint(0, false);
  if (options.tier !== undefined) paint(options.tier, false);

  // The arrival is a class swap, so the panel it resolves inside is the panel it
  // was already occupying. (The resolve keyframes fill forwards, which is also
  // what would mask a later dim — a future "next customer" reset has to drop
  // ARRIVED_CLASS again when it re-adds the silhouette.)
  const showSheet = (url: string): void => {
    cell.style.backgroundImage = `url("${url}")`;
    cell.classList.remove(SILHOUETTE_CLASS);
    cell.classList.add(ARRIVED_CLASS);
    silhouette = false;
  };

  if (options.sheetUrl !== undefined) showSheet(options.sheetUrl);

  const setBlink = (next: boolean): void => paint(tier, next);

  const stopBlinking =
    options.blinkClock !== undefined && options.blinkRng !== undefined
      ? startBlinking({ clock: options.blinkClock, rng: options.blinkRng, onBlink: setBlink })
      : null;

  return {
    frame,
    setTier: (next: number) => paint(next, blink),
    setBlink,
    setSheet: showSheet,
    get tier() {
      return tier;
    },
    get blink() {
      return blink;
    },
    get silhouette() {
      return silhouette;
    },
    destroy() {
      if (stopBlinking !== null) stopBlinking();
      frame.remove();
    },
  };
}
