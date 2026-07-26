// TDD-Red tests for u9 — portrait component (4x2 expression-sheet slicing, tier
// columns, blink, backlit silhouette, framed panel).
//
// Contract pinned here (PRD §2.1 sheet paragraph · §2.2 tier columns · §2.3
// "Generated frames are for expressions + blink only" / "Portraits render inside a
// framed card panel" / §3-3 injected-timing rule):
//
//   src/ui/portrait.ts
//     PORTRAIT_COLUMNS / PORTRAIT_ROWS   — re-exported grid, identical to u3's
//     BLINK_INTERVAL_MS / BLINK_DURATION_MS — inclusive [min, max] ranges
//     portraitCell(tier, blink)          — pure background-size/-position, or undefined
//     nextBlink(rng)                     — pure {delayMs, durationMs} from one Rng
//     startBlinking({clock, rng, onBlink}) — CancelTimer; ONLY the injected clock ticks
//     mountPortrait(parent, opts)        — thin DOM layer (proved in e2e, not here)
//   src/styles/portrait.css              — framed panel, pixelated cell, brightness(0)
//                                          silhouette + animated resolve
//   vite.config.ts                       — ONE new build input, aiProxy untouched
//
// vitest runs with environment: 'node' (vitest.config.ts) — there is NO DOM here, by
// design. Every browser-truth assertion (computed background-position actually moving,
// getBoundingClientRect not changing, filter: brightness(0), image-rendering) lives in
// e2e/portrait.spec.ts. This file covers the pure math, the injected-timing schedule,
// and the static/structural contract.
//
// RED until src/ui/portrait.ts, src/styles/portrait.css and the harness exist.
import { describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import generation from '../../data/generation.json';
import { SHEET_COLUMNS, SHEET_ROWS, sheetCellSize, sheetPixelSize } from '../../src/ui/pixelate';
import { createManualClock } from '../../src/pipeline/clock';
import { resolveBuildInputs } from '../../vite.build-inputs.ts';
import { createRng } from '../../src/pipeline/persona';
import type { Rng } from '../../src/pipeline/persona';
import {
  PORTRAIT_COLUMNS,
  PORTRAIT_ROWS,
  BLINK_INTERVAL_MS,
  BLINK_DURATION_MS,
  portraitCell,
  nextBlink,
  startBlinking,
  mountPortrait,
} from '../../src/ui/portrait';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..'); // demos/apothecary/
const p = (rel: string) => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');

const PORTRAIT_TS = 'src/ui/portrait.ts';
const PORTRAIT_CSS = 'src/styles/portrait.css';
const HARNESS_HTML = 'e2e/harness/portrait/index.html';
const HARNESS_MAIN = 'e2e/harness/portrait/main.ts';
const VITE_CONFIG = 'vite.config.ts';

/** `"33.3333% 100%"` -> [33.3333, 100]. Fails loudly on px / keyword values. */
function percentPair(value: string, label: string): [number, number] {
  const parts = value.trim().split(/\s+/);
  expect(parts.length, `${label}: expected two axis values, got "${value}"`).toBe(2);
  return parts.map((part) => {
    expect(part, `${label}: "${part}" must be a percentage (px breaks on resize)`).toMatch(
      /^-?\d+(\.\d+)?%$/,
    );
    return Number.parseFloat(part);
  }) as [number, number];
}

/** Records every draw so a test can pin how many the unit consumed, and in what order. */
function scriptedRng(draws: readonly number[]): Rng & { calls: number } {
  let i = 0;
  const fn = (() => {
    const value = draws[Math.min(i, draws.length - 1)];
    i++;
    fn.calls = i;
    return value;
  }) as Rng & { calls: number };
  fn.calls = 0;
  return fn;
}

// ── AC1 · the 4x2 grid, all eight cells ──────────────────────────────────────
describe('u9 AC1 — portraitCell(): 4 columns x 2 rows, every combination pinned', () => {
  it('the grid constants are u3s grid, not a second copy of the numbers', () => {
    expect(PORTRAIT_COLUMNS).toBe(SHEET_COLUMNS);
    expect(PORTRAIT_ROWS).toBe(SHEET_ROWS);
    expect(PORTRAIT_COLUMNS).toBe(4);
    expect(PORTRAIT_ROWS).toBe(2);
  });

  it('the frozen sheet prose in data/generation.json still describes a 4x2 grid', () => {
    // If someone re-generates portraits at another grid, this fails before the
    // slicing math silently starts showing half a face.
    expect(generation.portraitSheetFormat).toMatch(/4x2/i);
    expect(generation.portraitSheetFormat).toMatch(/four columns/i);
    expect(generation.portraitSheetFormat).toMatch(/two rows/i);
  });

  it('background-size scales the sheet so exactly one cell fills the element', () => {
    for (const tier of [0, 1, 2, 3] as const) {
      for (const blink of [false, true]) {
        const cell = portraitCell(tier, blink);
        expect(cell, `tier=${tier} blink=${blink}`).toBeDefined();
        const [w, h] = percentPair(cell!.backgroundSize, `tier=${tier} blink=${blink} size`);
        expect(w).toBeCloseTo(PORTRAIT_COLUMNS * 100, 4);
        expect(h).toBeCloseTo(PORTRAIT_ROWS * 100, 4);
      }
    }
  });

  it('each tier maps to its own column and each blink state to its own row (8/8)', () => {
    // index/(extent-1) percentage positioning: cols -> 0 / 33.3333 / 66.6667 / 100,
    // rows -> 0 (eyes open, top) / 100 (mid-blink, bottom).
    const expectedX = [0, 100 / 3, 200 / 3, 100];
    const expectedY = { open: 0, blink: 100 };

    for (const tier of [0, 1, 2, 3] as const) {
      for (const blink of [false, true]) {
        const cell = portraitCell(tier, blink);
        const [x, y] = percentPair(cell!.backgroundPosition, `tier=${tier} blink=${blink} pos`);
        expect(x, `tier ${tier} column offset`).toBeCloseTo(expectedX[tier], 2);
        expect(y, `blink=${blink} row offset`).toBeCloseTo(blink ? expectedY.blink : expectedY.open, 2);
      }
    }
  });

  it('the boundary cells are the sheet corners (tier 0 open, tier 3 mid-blink)', () => {
    const [firstX, firstY] = percentPair(portraitCell(0, false)!.backgroundPosition, 'first cell');
    expect(firstX).toBeCloseTo(0, 4);
    expect(firstY).toBeCloseTo(0, 4);

    const [lastX, lastY] = percentPair(portraitCell(3, true)!.backgroundPosition, 'last cell');
    expect(lastX).toBeCloseTo(100, 4);
    expect(lastY).toBeCloseTo(100, 4);
  });

  it('all eight cells are distinct — no two tier/blink pairs show the same art', () => {
    const seen = new Set<string>();
    for (const tier of [0, 1, 2, 3] as const) {
      for (const blink of [false, true]) {
        const cell = portraitCell(tier, blink)!;
        seen.add(`${cell.backgroundSize}|${cell.backgroundPosition}`);
      }
    }
    expect(seen.size).toBe(PORTRAIT_COLUMNS * PORTRAIT_ROWS);
  });

  it('column offsets increase strictly with the tier (calm -> limit, left -> right)', () => {
    const xs = ([0, 1, 2, 3] as const).map(
      (tier) => percentPair(portraitCell(tier, false)!.backgroundPosition, `tier ${tier}`)[0],
    );
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i], `tier ${i} must sit right of tier ${i - 1}`).toBeGreaterThan(xs[i - 1]);
    }
  });

  it('blink only moves the row: the column offset is identical open vs mid-blink', () => {
    for (const tier of [0, 1, 2, 3] as const) {
      const open = percentPair(portraitCell(tier, false)!.backgroundPosition, 'open');
      const shut = percentPair(portraitCell(tier, true)!.backgroundPosition, 'blink');
      expect(shut[0], `tier ${tier} column must not move on blink`).toBeCloseTo(open[0], 4);
      expect(shut[1]).not.toBeCloseTo(open[1], 4);
    }
  });

  it('returns undefined for an out-of-range or non-integer tier (never a wrong cell)', () => {
    for (const bad of [-1, 4, 99, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(portraitCell(bad as 0, false), `tier=${String(bad)}`).toBeUndefined();
      expect(portraitCell(bad as 0, true), `tier=${String(bad)} blink`).toBeUndefined();
    }
  });

  it('is pure: repeated calls return equal values and never share a mutable object', () => {
    const a = portraitCell(2, false)!;
    const b = portraitCell(2, false)!;
    expect(a).toEqual(b);
    expect(() => {
      (a as { backgroundPosition: string }).backgroundPosition = 'hacked';
    }).toThrow();
    expect(portraitCell(2, false)!.backgroundPosition).toBe(b.backgroundPosition);
  });
});

// ── AC2 · blink schedule: injected clock + rng only ──────────────────────────
describe('u9 AC2 — nextBlink(): ranges, mapping, determinism', () => {
  it('the ranges are the PRD numbers: 3-6s interval, 120-200ms duration', () => {
    expect(BLINK_INTERVAL_MS).toEqual([3000, 6000]);
    expect(BLINK_DURATION_MS).toEqual([120, 200]);
  });

  it('a draw of 0 maps to both minimums', () => {
    const blink = nextBlink(scriptedRng([0]));
    expect(blink.delayMs).toBe(BLINK_INTERVAL_MS[0]);
    expect(blink.durationMs).toBe(BLINK_DURATION_MS[0]);
  });

  it('a draw just under 1 maps to both maximums (never past them)', () => {
    const blink = nextBlink(scriptedRng([1 - Number.EPSILON]));
    expect(blink.delayMs).toBeLessThanOrEqual(BLINK_INTERVAL_MS[1]);
    expect(blink.delayMs).toBeGreaterThanOrEqual(BLINK_INTERVAL_MS[1] - 1);
    expect(blink.durationMs).toBeLessThanOrEqual(BLINK_DURATION_MS[1]);
    expect(blink.durationMs).toBeGreaterThanOrEqual(BLINK_DURATION_MS[1] - 1);
  });

  it('interval is drawn before duration (frozen draw order = frozen sequence)', () => {
    // [0, ~1] -> shortest wait, longest blink. Swapping the draws inside the
    // implementation would flip this and break every seeded expectation.
    const blink = nextBlink(scriptedRng([0, 1 - Number.EPSILON]));
    expect(blink.delayMs).toBe(BLINK_INTERVAL_MS[0]);
    expect(blink.durationMs).toBeGreaterThanOrEqual(BLINK_DURATION_MS[1] - 1);
  });

  it('a mid draw lands mid-range', () => {
    const blink = nextBlink(scriptedRng([0.5]));
    expect(blink.delayMs).toBeGreaterThanOrEqual(4499);
    expect(blink.delayMs).toBeLessThanOrEqual(4501);
    expect(blink.durationMs).toBeGreaterThanOrEqual(159);
    expect(blink.durationMs).toBeLessThanOrEqual(161);
  });

  it('both values are whole milliseconds', () => {
    for (const draw of [0, 0.137, 0.5, 0.9812, 1 - Number.EPSILON]) {
      const blink = nextBlink(scriptedRng([draw]));
      expect(Number.isInteger(blink.delayMs), `delay for ${draw}`).toBe(true);
      expect(Number.isInteger(blink.durationMs), `duration for ${draw}`).toBe(true);
    }
  });

  it('every draw of a seeded rng stays inside both ranges', () => {
    const rng = createRng(20260725);
    for (let i = 0; i < 500; i++) {
      const blink = nextBlink(rng);
      expect(blink.delayMs).toBeGreaterThanOrEqual(BLINK_INTERVAL_MS[0]);
      expect(blink.delayMs).toBeLessThanOrEqual(BLINK_INTERVAL_MS[1]);
      expect(blink.durationMs).toBeGreaterThanOrEqual(BLINK_DURATION_MS[0]);
      expect(blink.durationMs).toBeLessThanOrEqual(BLINK_DURATION_MS[1]);
    }
  });

  it('the same seed replays the identical blink sequence', () => {
    const run = (seed: number) => {
      const rng = createRng(seed);
      return Array.from({ length: 24 }, () => nextBlink(rng));
    };
    expect(run(7)).toEqual(run(7));
  });

  it('different seeds diverge (the interval is actually randomized)', () => {
    const run = (seed: number) => {
      const rng = createRng(seed);
      return Array.from({ length: 24 }, () => nextBlink(rng).delayMs);
    };
    expect(run(7)).not.toEqual(run(8));
    // and a single seed does not degenerate into one constant interval
    expect(new Set(run(7)).size).toBeGreaterThan(1);
  });

  it('rejects an rng that draws outside [0, 1) instead of scheduling nonsense', () => {
    for (const bad of [1, 1.5, -0.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => nextBlink(scriptedRng([bad])), `draw=${String(bad)}`).toThrow();
    }
  });
});

describe('u9 AC2 — startBlinking(): every wait flows through the injected clock', () => {
  const setup = (seed = 42) => {
    const clock = createManualClock();
    const rng = createRng(seed);
    const events: Array<{ at: number; blink: boolean }> = [];
    const cancel = startBlinking({
      clock,
      rng,
      onBlink: (blink: boolean) => events.push({ at: clock.now(), blink }),
    });
    return { clock, events, cancel };
  };

  it('books the first blink on the clock and does not blink on mount', () => {
    const { clock, events } = setup();
    expect(events).toEqual([]);
    expect(clock.pending).toBe(1);
  });

  it('stays open until the drawn interval elapses, then closes the eyes', () => {
    const { clock, events } = setup();
    clock.advance(BLINK_INTERVAL_MS[0] - 1);
    expect(events, 'blinked earlier than the 3s floor').toEqual([]);

    clock.advance(BLINK_INTERVAL_MS[1] - BLINK_INTERVAL_MS[0] + 1);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].blink).toBe(true);
    expect(events[0].at).toBeGreaterThanOrEqual(BLINK_INTERVAL_MS[0]);
    expect(events[0].at).toBeLessThanOrEqual(BLINK_INTERVAL_MS[1]);
  });

  it('reopens the eyes after the drawn duration and re-arms the next blink', () => {
    const { clock, events } = setup();
    clock.advance(BLINK_INTERVAL_MS[1]);
    clock.advance(BLINK_DURATION_MS[1]);

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].blink).toBe(true);
    expect(events[1].blink).toBe(false);
    const held = events[1].at - events[0].at;
    expect(held).toBeGreaterThanOrEqual(BLINK_DURATION_MS[0]);
    expect(held).toBeLessThanOrEqual(BLINK_DURATION_MS[1]);
    expect(clock.pending, 'next blink must already be booked').toBe(1);
  });

  it('keeps blinking indefinitely, every interval and hold inside the PRD ranges', () => {
    const { clock, events } = setup();
    clock.advance(120_000); // two minutes of idle conversation

    const closes = events.filter((e) => e.blink);
    const opens = events.filter((e) => !e.blink);
    expect(closes.length).toBeGreaterThan(15); // ~120s / up to 6s
    expect(opens.length).toBe(closes.length);

    // strict open/close alternation — never two closes in a row
    events.forEach((event, i) => expect(event.blink).toBe(i % 2 === 0));

    for (let i = 0; i < closes.length; i++) {
      const hold = opens[i].at - closes[i].at;
      expect(hold, `blink ${i} hold`).toBeGreaterThanOrEqual(BLINK_DURATION_MS[0]);
      expect(hold, `blink ${i} hold`).toBeLessThanOrEqual(BLINK_DURATION_MS[1]);
      if (i > 0) {
        const gap = closes[i].at - opens[i - 1].at;
        expect(gap, `gap before blink ${i}`).toBeGreaterThanOrEqual(BLINK_INTERVAL_MS[0]);
        expect(gap, `gap before blink ${i}`).toBeLessThanOrEqual(BLINK_INTERVAL_MS[1]);
      }
    }
  });

  it('is deterministic under a fixed seed and diverges under another', () => {
    const timeline = (seed: number) => {
      const { clock, events } = setup(seed);
      clock.advance(60_000);
      return events;
    };
    expect(timeline(1234)).toEqual(timeline(1234));
    expect(timeline(1234)).not.toEqual(timeline(4321));
  });

  it('cancel() stops the schedule: no bookings left, no further blinks', () => {
    const { clock, events, cancel } = setup();
    clock.advance(30_000);
    const before = events.length;
    expect(before).toBeGreaterThan(0);

    cancel();
    expect(clock.pending).toBe(0);
    clock.advance(60_000);
    expect(events.length).toBe(before);
  });

  it('cancel() is idempotent', () => {
    const { cancel } = setup();
    expect(() => {
      cancel();
      cancel();
    }).not.toThrow();
  });

  it('cancel() mid-blink reopens the eyes — never leaves a frozen closed-eye face', () => {
    const clock = createManualClock();
    const events: boolean[] = [];
    const cancel = startBlinking({
      clock,
      rng: createRng(99),
      onBlink: (blink: boolean) => events.push(blink),
    });

    // land inside a blink: advance to the first close, then only part of the hold
    clock.advance(BLINK_INTERVAL_MS[1]);
    expect(events.at(-1)).toBe(true);
    clock.advance(BLINK_DURATION_MS[0] - 1);
    expect(events.at(-1), 'still mid-blink').toBe(true);

    cancel();
    expect(events.at(-1), 'cancel must hand back an open-eyed portrait').toBe(false);
    expect(clock.pending).toBe(0);
  });

  it('never touches host timers: the schedule runs with globalThis.setTimeout stubbed out', () => {
    const timeout = vi.spyOn(globalThis, 'setTimeout');
    const interval = vi.spyOn(globalThis, 'setInterval');
    const random = vi.spyOn(Math, 'random');
    try {
      const { clock, events } = setup();
      clock.advance(30_000);
      expect(events.length).toBeGreaterThan(0);
      expect(timeout).not.toHaveBeenCalled();
      expect(interval).not.toHaveBeenCalled();
      expect(random).not.toHaveBeenCalled();
    } finally {
      timeout.mockRestore();
      interval.mockRestore();
      random.mockRestore();
    }
  });
});

// ── AC2 · §3-3 source scan ───────────────────────────────────────────────────
describe('u9 AC2 — src/ui/portrait.ts holds no ambient timing or randomness (§3-3)', () => {
  it('the module exists', () => {
    expect(existsSync(p(PORTRAIT_TS)), `${PORTRAIT_TS} missing`).toBe(true);
  });

  it('references no timer / wall-clock / random API', () => {
    const src = read(PORTRAIT_TS);
    for (const banned of [
      'setTimeout',
      'setInterval',
      'requestAnimationFrame',
      'Date.now',
      'performance.now',
      'Math.random',
    ]) {
      expect(src.includes(banned), `portrait.ts references ${banned} — inject it instead`).toBe(false);
    }
  });

  it('takes its clock and rng from the existing injected seams', () => {
    const src = read(PORTRAIT_TS);
    expect(src).toMatch(/from\s+['"](\.\.\/)+pipeline\/clock(\.ts)?['"]/);
    expect(src).toMatch(/\bRng\b/);
  });

  it('imports its own stylesheet (screens never hand-roll portrait CSS)', () => {
    expect(read(PORTRAIT_TS)).toMatch(/import\s+['"](\.\.\/)+styles\/portrait\.css['"]/);
  });

  it('exports a DOM mount seam for the screens to use', () => {
    expect(typeof mountPortrait).toBe('function');
  });
});

// ── AC4/AC5 · the stylesheet: framed panel, silhouette, pixelated ────────────
describe('u9 AC4/AC5 — src/styles/portrait.css', () => {
  it('exists', () => {
    expect(existsSync(p(PORTRAIT_CSS)), `${PORTRAIT_CSS} missing`).toBe(true);
  });

  it('gives the frame a size that does not depend on the portrait (no reflow on arrival)', () => {
    const css = read(PORTRAIT_CSS);
    expect(css).toMatch(/\.portrait-frame\b/);
    // aspect-ratio or an explicit box — either way the panel is sized by CSS, not
    // by whatever image happens to have loaded.
    expect(css).toMatch(/(aspect-ratio\s*:)|(\bwidth\s*:[^;]+;[\s\S]{0,400}?\bheight\s*:)/);
  });

  it('slices the sheet with background-position on a no-repeat cell', () => {
    const css = read(PORTRAIT_CSS);
    expect(css).toMatch(/\.portrait-frame__cell\b/);
    expect(css).toMatch(/background-repeat\s*:\s*no-repeat/);
  });

  it('renders the cell pixelated (CSS owns the upscale, u3 owns the downscale)', () => {
    expect(read(PORTRAIT_CSS)).toMatch(/image-rendering\s*:\s*pixelated/);
  });

  it('does the silhouette with filter: brightness(0) — no compositing, no cutout', () => {
    const css = read(PORTRAIT_CSS);
    expect(css).toMatch(/filter\s*:\s*brightness\(\s*0(\.0+)?\s*\)/);
    for (const banned of [/mix-blend-mode/, /-?webkit-mask/, /\bmask-image/, /\bclip-path/]) {
      expect(banned.test(css), `silhouette must not use ${banned} (PRD: no compositing)`).toBe(false);
    }
  });

  it('animates the silhouette -> portrait resolve on filter', () => {
    const css = read(PORTRAIT_CSS);
    const transitions = css.match(/transition[^;}]*/g) ?? [];
    const animated =
      transitions.some((t) => /filter|all/.test(t)) || /@keyframes\s+[\w-]*(resolve|arriv)/i.test(css);
    expect(animated, 'no transition/keyframes carry the silhouette resolve').toBe(true);
  });

  it('honours prefers-reduced-motion', () => {
    expect(read(PORTRAIT_CSS)).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });

  it('loads no remote resource (§4.2 offline)', () => {
    expect(read(PORTRAIT_CSS)).not.toMatch(/url\(\s*['"]?(https?:)?\/\//i);
  });
});

// ── AC5 · vite.config.ts — one added line, aiProxy untouched ─────────────────
describe('u9 AC5 — vite.config.ts change is one harness build input and nothing else', () => {
  const config = () => read(VITE_CONFIG);

  // PR #33 (R2 on vite.config.ts:29): the harness inputs moved behind the E2E
  // flag so the deployed dist/ is the demo home alone. The build-input map now
  // lives in ./vite.build-inputs.ts, so this asserts the RESOLVED inputs (the
  // real rule, exercised) rather than a source pattern in vite.config.ts.
  it('registers the portrait harness page as a build input for the e2e build', () => {
    expect(resolveBuildInputs({ E2E: '1' }).portrait).toBe('./e2e/harness/portrait/index.html');
  });

  it('does NOT register it in a plain (deployed) build', () => {
    expect(resolveBuildInputs({})).toEqual({ main: './index.html' });
  });

  // u14 (final integration): the count was u9's "I added exactly one" receipt, and
  // u13 has since added its own generation harness page (which must be a build
  // input to be served from dist/ at the path its spec navigates to). The guard
  // that still matters is that every input is an ACCOUNTED-FOR harness page and no
  // input was dropped — so the set is enumerated, one entry per unit that owns a
  // harness, instead of frozen at a number one unit happened to leave behind.
  it('keeps the pre-existing inputs and adds only accounted-for harness pages', () => {
    const keys = Object.keys(resolveBuildInputs({ E2E: '1' }));
    // main = the demo itself; the rest are e2e harness pages (u6, u7, u9, u13).
    const expected = ['main', 'conversation', 'crafting', 'portrait', 'generation'];
    expect(new Set(keys)).toEqual(new Set(expected));
    expect(keys.length).toBe(expected.length);
  });

  it('keeps the legacy aiProxy for normal dev and isolates the Lambda proxy mode', () => {
    const src = config();
    expect(src).toMatch(/import\s*\{\s*aiProxy\s*\}\s*from\s*'\.\/server\/ai-proxy\.mjs';/);
    expect(src).toMatch(
      /plugins\s*:\s*lambdaUpstream\s*\?\s*\[loopbackOnlyAiProxy\(\)\]\s*:\s*\[aiProxy\(\)\],/,
    );
    expect(src).toMatch(/mode\s*===\s*'lambda'/);
    expect(src).toMatch(/headers:\s*\{\s*Origin:\s*PAGES_ORIGIN\s*\}/);
    expect(src).toMatch(/base\s*:\s*'\.\/',/);
  });
});

// ── AC3/AC4/AC5 · the browser harness the e2e spec drives ────────────────────
describe('u9 AC3 — the portrait e2e harness page exists and follows the D10 pattern', () => {
  it('has an index.html mounting a sibling main.ts module', () => {
    expect(existsSync(p(HARNESS_HTML)), `${HARNESS_HTML} missing`).toBe(true);
    const html = read(HARNESS_HTML);
    expect(html).toMatch(/<div id="app">/);
    expect(html).toMatch(/<script type="module" src="\.\/main\.ts">/);
    // e2e/portrait.spec.ts pins this title: `vite preview` answers 200 with the demo
    // home for an unregistered path, so the title is how the spec tells a missing
    // build input apart from a real harness page.
    expect(html).toMatch(/<title>[^<]*Portrait Harness[^<]*<\/title>/i);
  });

  it('main.ts drives the real component and exposes the window.__portrait test API', () => {
    expect(existsSync(p(HARNESS_MAIN)), `${HARNESS_MAIN} missing`).toBe(true);
    const main = read(HARNESS_MAIN);
    expect(main).toMatch(/mountPortrait/);
    expect(main).toMatch(/__portrait/);
    // the harness must exercise u3's real pixelation path, not fake it
    expect(main).toMatch(/pixelate/);
  });
});

// ── AC5 · the pixel target the harness/e2e assert against is u3's, from data ──
describe('u9 AC5 — the runtime sheet target size comes from u3 + generation.json', () => {
  it('a 1536x1024 sheet downscales to the u3 cell grid at the shipped factor', () => {
    const factor = generation.pixelFactor;
    const cell = sheetCellSize(1536, 1024, factor);
    const sheet = sheetPixelSize(1536, 1024, factor);
    expect(cell.width * PORTRAIT_COLUMNS).toBe(sheet.width);
    expect(cell.height * PORTRAIT_ROWS).toBe(sheet.height);
    expect(sheet.width).toBeLessThan(1536);
    expect(sheet.height).toBeLessThan(1024);
  });
});
