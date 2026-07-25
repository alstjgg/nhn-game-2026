// TDD-Red contract for the ASSET-SLOT CSS SEAM (u7 AC4) — the seam the asset-pack unit
// fills later without touching a line of u7's CSS.
//
// The deal, from PRD §2.8 (render column) and its "if a listed file is missing at build
// time, agents keep the CSS fallback for that slot" rule:
//
//   · every sprite / frame in the asset table has ONE documented class in slots.css
//   · the image itself arrives through a CSS custom property (--slot-*), set by the
//     consumer — slots.css itself references NO file, so u7 stays asset-free
//   · with the property unset the slot must still render acceptably (CSS-only fallback)
//   · sheet cells are chosen with background-position, frames with border-image 9-slice
//   · walk / attack loops are steps(4) / steps(3) classes
//   · image-rendering: pixelated is a TOKEN, never a literal
//
// Pure text analysis (vitest node env). The rendered half — four vials computing four
// distinct background-positions, fallbacks painting something visible — is in
// e2e/primitives.spec.ts.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..'); // demos/darkest-context/

const RAW = (): string => readFileSync(resolve(root, 'src/styles/slots.css'), 'utf8');
/** Comment-free CSS: a comment must never be able to satisfy a source assertion. */
const CSS = (): string => RAW().replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Every declaration block whose selector mentions `cls`, concatenated. A slot may spread
 * its declarations over several rules (base + state rules); the contract is about what
 * the class ends up carrying, not about rule count.
 */
function slotBody(cls: string): string {
  const bodies: string[] = [];
  const rules = CSS().matchAll(/([^{}]+)\{([^{}]*)\}/g);
  const token = new RegExp(`\\${cls}(?![\\w-])`);
  for (const [, selector, body] of rules) {
    if (token.test(selector ?? '')) bodies.push(body ?? '');
  }
  return bodies.join('\n');
}

/** The declaration blocks for a slot, keyed by the selector they came from. */
function slotRules(cls: string): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = [];
  const token = new RegExp(`\\${cls}(?![\\w-])`);
  for (const [, selector, body] of CSS().matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (token.test(selector ?? '')) out.push({ selector: (selector ?? '').trim(), body: body ?? '' });
  }
  return out;
}

// The asset table of PRD §2.8, one row per slot. `file` is what the documentation comment
// must name so a reader can trace a slot back to the pack.
const SLOTS = [
  { cls: '.slot-bg-dungeon', prop: '--slot-bg-dungeon', file: 'bg-dungeon.png', kind: 'strip' },
  { cls: '.slot-hero', prop: '--slot-hero', file: 'hero-', kind: 'sheet' },
  { cls: '.slot-mob', prop: '--slot-mob', file: 'mob-', kind: 'sheet' },
  { cls: '.slot-bubble-frame', prop: '--slot-bubble-frame', file: 'ui-bubble.png', kind: 'frame' },
  { cls: '.slot-card-frame', prop: '--slot-card-frame', file: 'ui-card-frame.png', kind: 'frame' },
  { cls: '.slot-card-icon', prop: '--slot-card-icon', file: 'card-icons.png', kind: 'sheet' },
  { cls: '.slot-vial', prop: '--slot-vial', file: 'ui-vial.png', kind: 'sheet' },
] as const;

const SHEETS = SLOTS.filter((s) => s.kind === 'sheet');
const FRAMES = SLOTS.filter((s) => s.kind === 'frame');

describe('slots.css: one documented class per asset-pack row (PRD §2.8)', () => {
  for (const { cls, file } of SLOTS) {
    it(`declares ${cls}`, () => {
      expect(slotBody(cls), `no rule declares ${cls}`).not.toBe('');
    });

    it(`documents ${cls} with the asset file it expects (${file})`, () => {
      // Raw read on purpose: "documented" means a comment naming the pack file.
      expect(RAW(), `slots.css never mentions ${file}`).toContain(file);
    });
  }

  it('covers every row of the asset table and nothing else', () => {
    const declared = new Set((CSS().match(/\.slot-[a-z0-9-]+/g) ?? []).map((s) => s));
    for (const { cls } of SLOTS) expect(declared.has(cls), `missing slot class ${cls}`).toBe(true);
  });
});

describe('slots.css: the image arrives through a custom property, never a hardcoded file', () => {
  for (const { cls, prop } of SLOTS) {
    it(`${cls} reads its image from var(${prop}, …)`, () => {
      expect(slotBody(cls), `${cls} does not read ${prop}`).toMatch(
        new RegExp(`var\\(\\s*${prop}\\s*,`),
      );
    });

    it(`${cls} supplies a non-empty fallback inside that var()`, () => {
      const m = slotBody(cls).match(new RegExp(`var\\(\\s*${prop}\\s*,([^)]*)`));
      expect((m?.[1] ?? '').trim(), `var(${prop}) has an empty fallback`).not.toBe('');
    });
  }

  it('never references a pack file itself — that is the consumer unit’s job', () => {
    expect(CSS(), 'slots.css hardcodes an image path').not.toMatch(/\.png|\.webp|\.jpe?g/i);
    expect(CSS(), 'slots.css points url() at the asset dir').not.toMatch(/url\(\s*['"]?[^'")]*assets\//i);
  });

  it('binds no --slot-* property to a value (only the consumer sets them)', () => {
    for (const { prop } of SLOTS) {
      expect(CSS(), `slots.css assigns ${prop} instead of leaving the seam open`).not.toMatch(
        new RegExp(`${prop}\\s*:`),
      );
    }
  });
});

describe('slots.css: every slot renders acceptably with no image set', () => {
  const FALLBACK_PAINT = /background-color\s*:|linear-gradient\(|repeating-linear-gradient\(|box-shadow\s*:|border\s*:|border-color\s*:|outline\s*:/;

  for (const { cls } of SLOTS) {
    it(`${cls} paints a CSS-only fallback`, () => {
      expect(slotBody(cls), `${cls} would be invisible without its image`).toMatch(FALLBACK_PAINT);
    });

    it(`${cls} reserves its own box so layout does not collapse`, () => {
      expect(slotBody(cls), `${cls} declares no width/height/aspect-ratio`).toMatch(
        /(^|[\s;])(width|height|min-width|min-height|aspect-ratio|block-size|inline-size)\s*:/,
      );
    });
  }
});

describe('slots.css: sheet cells are chosen with background-position', () => {
  for (const { cls } of SHEETS) {
    it(`${cls} positions its cell with background-position`, () => {
      expect(slotBody(cls), `${cls} does not use background-position`).toMatch(
        /background-position\s*:/,
      );
    });

    it(`${cls} drives the cell from --cell-col / --cell-row custom properties`, () => {
      const body = slotBody(cls);
      const pos = body.match(/background-position\s*:([^;]*);/);
      expect(pos?.[1] ?? '', `${cls} background-position is not cell-driven`).toMatch(
        /var\(\s*--cell-col/,
      );
      expect(pos?.[1] ?? '').toMatch(/var\(\s*--cell-row/);
    });

    it(`${cls} declares the sheet geometry as --sheet-cols / --sheet-rows`, () => {
      const body = slotBody(cls);
      expect(body, `${cls} has no --sheet-cols`).toMatch(/--sheet-cols\s*:\s*\d+/);
      expect(body, `${cls} has no --sheet-rows`).toMatch(/--sheet-rows\s*:\s*\d+/);
    });

    it(`${cls} defaults to cell 0,0 so an unconfigured slot still renders`, () => {
      const body = slotBody(cls);
      expect(body, `${cls} has no --cell-col default`).toMatch(/--cell-col\s*:\s*0/);
      expect(body, `${cls} has no --cell-row default`).toMatch(/--cell-row\s*:\s*0/);
    });
  }

  it('.slot-hero is the 4×3 sheet the pack ships (walk · gauge poses · actions)', () => {
    const body = slotBody('.slot-hero');
    expect(body).toMatch(/--sheet-cols\s*:\s*4/);
    expect(body).toMatch(/--sheet-rows\s*:\s*3/);
  });

  it('.slot-card-icon is the 4×3 sheet (11 icons + the card back)', () => {
    const body = slotBody('.slot-card-icon');
    expect(body).toMatch(/--sheet-cols\s*:\s*4/);
    expect(body).toMatch(/--sheet-rows\s*:\s*3/);
  });

  it('.slot-vial maps all four gauge states to their own cell', () => {
    for (const state of ['calm', 'uneasy', 'limit', 'overload']) {
      const rule = slotRules('.slot-vial').find((r) =>
        new RegExp(`\\[data-state\\s*=\\s*['"]?${state}['"]?\\s*\\]`).test(r.selector),
      );
      expect(rule, `.slot-vial has no cell rule for state "${state}"`).toBeTruthy();
      expect(rule?.body ?? '', `state "${state}" selects no cell`).toMatch(
        /--cell-(col|row)\s*:\s*\d+/,
      );
    }
  });

  it('the four vial states land on four DIFFERENT cells', () => {
    const cells = ['calm', 'uneasy', 'limit', 'overload'].map((state) => {
      const rule = slotRules('.slot-vial').find((r) =>
        new RegExp(`\\[data-state\\s*=\\s*['"]?${state}['"]?\\s*\\]`).test(r.selector),
      );
      const col = rule?.body.match(/--cell-col\s*:\s*(\d+)/)?.[1] ?? '0';
      const row = rule?.body.match(/--cell-row\s*:\s*(\d+)/)?.[1] ?? '0';
      return `${col},${row}`;
    });
    expect(new Set(cells).size, `vial cells collide: ${cells.join(' | ')}`).toBe(4);
  });
});

describe('slots.css: frames are 9-slice, the background is a tileable strip', () => {
  for (const { cls } of FRAMES) {
    it(`${cls} uses border-image (9-slice, PRD §2.8)`, () => {
      expect(slotBody(cls), `${cls} does not use border-image`).toMatch(/border-image/);
    });

    it(`${cls} declares a slice so the frame corners survive`, () => {
      expect(slotBody(cls)).toMatch(/border-image-slice|border-image\s*:[^;]*\d/);
    });
  }

  it('.slot-bg-dungeon repeats horizontally for the walk scroll', () => {
    expect(slotBody('.slot-bg-dungeon')).toMatch(/background-repeat\s*:[^;]*repeat-x/);
  });
});

describe('slots.css: the pixel pipeline is a token, and the sprite loops are classes', () => {
  it('applies image-rendering through the --dc-pixelated token', () => {
    const css = CSS();
    expect(css, 'slots.css never sets image-rendering').toMatch(/image-rendering\s*:/);
    for (const [, value] of css.matchAll(/image-rendering\s*:([^;]*);/g)) {
      expect(value, 'image-rendering hardcodes its value instead of using the token').toMatch(
        /var\(\s*--dc-pixelated/,
      );
    }
  });

  it('every slot inherits pixelated rendering', () => {
    for (const { cls } of SLOTS) {
      expect(slotBody(cls), `${cls} is not pixel-rendered`).toMatch(/image-rendering\s*:/);
    }
  });

  it('.sprite-walk loops the 4-frame walk cycle with steps(4)', () => {
    expect(CSS(), 'no .sprite-walk class').toMatch(/\.sprite-walk(?![\w-])/);
    expect(slotBody('.sprite-walk'), '.sprite-walk is not a steps(4) loop').toMatch(
      /steps\(\s*4\s*[,)]/,
    );
    expect(slotBody('.sprite-walk'), '.sprite-walk does not loop').toMatch(/infinite/);
  });

  it('.sprite-attack loops the 3-frame attack with steps(3)', () => {
    expect(CSS(), 'no .sprite-attack class').toMatch(/\.sprite-attack(?![\w-])/);
    expect(slotBody('.sprite-attack'), '.sprite-attack is not a steps(3) loop').toMatch(
      /steps\(\s*3\s*[,)]/,
    );
  });

  it('declares the sprite-loop keyframes next to the classes that use them', () => {
    for (const name of ['sprite-walk', 'sprite-attack']) {
      expect(CSS(), `@keyframes ${name} is missing from slots.css`).toMatch(
        new RegExp(`@keyframes\\s+${name}\\s*\\{`),
      );
    }
  });
});
