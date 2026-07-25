// Static / module-contract TDD-Red tests for u7 — UI primitives + animation vocabulary.
//
// `.claude/super/units/u7/` carried neither design.md nor spec.md, so this file (with
// tests/ui/slots.test.ts and e2e/primitives.spec.ts) IS the API contract. See
// discovery/u7.md for the frozen signatures and the rationale.
//
// Split follows u1 / apothecary: vitest runs in the `node` environment (vitest.config.ts
// says so explicitly — "DOM smoke lives in e2e/"), so this slice covers file shape, CSS
// source text, module exports and PURE functions only. Everything that needs a rendered
// document is proved in e2e/primitives.spec.ts.
//
// One contract consequence of the node environment, and it is deliberate: every factory
// VALIDATES ITS INPUT BEFORE TOUCHING `document`. That is what makes the "throws on bad
// input" cases below runnable here at all, and it is the behaviour we want anyway —
// invalid data must never produce a half-built DOM node.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..'); // demos/darkest-context/

const p = (rel: string) => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');

/** CSS has only block comments. Strip them so a comment can never satisfy an assertion. */
const cssBody = (rel: string): string => read(rel).replace(/\/\*[\s\S]*?\*\//g, '');

/** Escape a literal selector for use inside a RegExp. */
const sel = (s: string): RegExp => new RegExp(s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'));

const STYLE_FILES = ['tokens.css', 'ui.css', 'animations.css', 'slots.css'] as const;

/** Every *.ts under src/ui/ (empty list if the dir does not exist yet). */
function uiSources(): { rel: string; src: string }[] {
  const dir = p('src/ui');
  if (!existsSync(dir)) return [];
  const out: { rel: string; src: string }[] = [];
  const walk = (abs: string, rel: string): void => {
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      const childAbs = join(abs, ent.name);
      const childRel = `${rel}/${ent.name}`;
      if (ent.isDirectory()) walk(childAbs, childRel);
      else if (ent.name.endsWith('.ts')) {
        out.push({ rel: childRel, src: readFileSync(childAbs, 'utf8') });
      }
    }
  };
  walk(dir, 'src/ui');
  return out;
}

// The public surface later screen units import. Frozen here so u8+ can rely on it.
type UiModule = Record<string, unknown>;
let uiCache: Promise<UiModule> | undefined;
const loadUi = (): Promise<UiModule> => {
  uiCache ??= import('../../src/ui/index.ts') as Promise<UiModule>;
  return uiCache;
};

// ───────────────────────── AC1 — the own-slice file shape ─────────────────────────

describe('u7 primitives: the style layer exists as four separate files', () => {
  for (const f of STYLE_FILES) {
    it(`has src/styles/${f}`, () => {
      expect(existsSync(p(`src/styles/${f}`)), `missing src/styles/${f}`).toBe(true);
    });
  }

  it('ships a src/ui/index.ts barrel so consumers import one path', () => {
    expect(existsSync(p('src/ui/index.ts')), 'missing src/ui/index.ts').toBe(true);
  });

  it('ships the primitive modules under src/ui/', () => {
    expect(uiSources().length, 'no *.ts files under src/ui/').toBeGreaterThan(1);
  });

  it('leaves the u1 base layer alone (tokens live in tokens.css, not base.css)', () => {
    // base.css is u1-owned. u7 adds a layer; it does not rewrite the ground tone.
    expect(cssBody('src/styles/base.css')).not.toMatch(/--dc-tint-|--dc-pixelated/);
  });
});

// ───────────────────────── tokens.css — the shared token layer ─────────────────────────

describe('tokens.css: design tokens the other three layers consume', () => {
  const css = () => cssBody('src/styles/tokens.css');

  it('declares a :root token block', () => {
    expect(css()).toMatch(/:root\s*{/);
  });

  it('exposes image-rendering as a token (--dc-pixelated: pixelated) — PRD §2.8', () => {
    expect(css()).toMatch(/--dc-pixelated\s*:\s*pixelated\s*;/);
  });

  for (const kind of ['prompt', 'skill', 'mcp']) {
    it(`declares the --dc-tint-${kind} card tint token`, () => {
      expect(css()).toMatch(sel(`--dc-tint-${kind}`));
    });
  }

  it('gives Prompt / Skill / MCP three DIFFERENT tint values', () => {
    const value = (kind: string): string => {
      const m = css().match(new RegExp(`--dc-tint-${kind}\\s*:\\s*([^;]+);`));
      expect(m, `--dc-tint-${kind} has no value`).toBeTruthy();
      return (m?.[1] ?? '').trim().toLowerCase();
    };
    const [a, b, c] = ['prompt', 'skill', 'mcp'].map(value);
    expect(new Set([a, b, c]).size, `tints are not distinct: ${a} / ${b} / ${c}`).toBe(3);
  });

  for (const token of ['--dc-dur-fast', '--dc-dur-slow', '--dc-ease-out']) {
    it(`declares the motion token ${token}`, () => {
      expect(css()).toMatch(sel(token));
    });
  }
});

// ─────────────── AC5 — animations.css: the vocabulary, declared exactly once ───────────────

// bubble in/out · hit shake · breathing bob · gauge tint overlay · phase cross-fade.
const VOCAB = ['bubble-in', 'bubble-out', 'hit-shake', 'breathe-bob', 'gauge-tint', 'phase-fade'];

describe('animations.css: the named animation vocabulary', () => {
  const css = () => cssBody('src/styles/animations.css');

  for (const name of VOCAB) {
    it(`declares @keyframes ${name}`, () => {
      expect(css()).toMatch(new RegExp(`@keyframes\\s+${name}\\s*{`));
    });

    it(`exposes it as the reusable class .anim-${name}`, () => {
      expect(css()).toMatch(sel(`.anim-${name}`));
    });
  }

  it('each vocabulary keyframe is declared ONCE across the whole style layer', () => {
    // The point of a vocabulary: later screens reuse it instead of redefining it.
    for (const name of VOCAB) {
      const hits = STYLE_FILES.flatMap((f) => {
        const matches = cssBody(`src/styles/${f}`).match(
          new RegExp(`@keyframes\\s+${name}\\s*{`, 'g'),
        );
        return (matches ?? []).map(() => f);
      });
      expect(hits, `@keyframes ${name} declared in: ${hits.join(', ') || 'nowhere'}`).toEqual([
        'animations.css',
      ]);
    }
  });

  it('times itself from the motion tokens, not from inline durations', () => {
    const body = css();
    const varUses = body.match(/var\(\s*--dc-(dur|ease)[a-z-]*/g) ?? [];
    expect(varUses.length, 'animations.css never references a motion token').toBeGreaterThanOrEqual(
      VOCAB.length,
    );
  });

  it('keeps the prefers-reduced-motion guard at the vocabulary layer', () => {
    expect(css()).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });
});

// ─────────────── AC2 — ui.css: the component class vocabulary ───────────────

describe('ui.css: component classes for stage / panel / sheet / bubble / card / vial', () => {
  const css = () => cssBody('src/styles/ui.css');

  const required = [
    '.dc-stage',
    '.dc-stage__side--heroes',
    '.dc-stage__side--enemies',
    '.dc-unit',
    '.dc-unit-panel',
    '.dc-sheet',
    '.dc-sheet__item',
    '.dc-sheet__item--cited',
    '.dc-bubble',
    '.dc-bubble__say',
    '.dc-chip',
    '.dc-card',
    '.dc-card--prompt',
    '.dc-card--skill',
    '.dc-card--mcp',
    '.dc-vial',
  ];
  for (const cls of required) {
    it(`declares ${cls}`, () => {
      expect(css(), `no rule for ${cls}`).toMatch(sel(cls));
    });
  }

  it('lays the stage out side-view: heroes left, enemies right', () => {
    // Whatever the mechanism (flex row / grid), the two sides must be ordered by CSS,
    // not by DOM luck — the honest left/right proof is the e2e bounding-box check.
    expect(css()).toMatch(/\.dc-stage\s*{[^}]*display\s*:\s*(flex|grid)/);
  });

  it('paints each card type from its tint token instead of a literal colour', () => {
    for (const kind of ['prompt', 'skill', 'mcp']) {
      const block = css().match(new RegExp(`\\.dc-card--${kind}\\s*{([^}]*)}`));
      expect(block, `.dc-card--${kind} has no rule body`).toBeTruthy();
      expect(block?.[1] ?? '', `.dc-card--${kind} ignores --dc-tint-${kind}`).toMatch(
        new RegExp(`var\\(\\s*--dc-tint-${kind}`),
      );
    }
  });

  it('styles no native form control (the membrane has nothing to style)', () => {
    expect(css()).not.toMatch(/(^|[\s,>+~])(input|textarea|select|form)\b/m);
  });
});

// ─────────────── AC3 — INV-1 membrane, source half ───────────────

describe('INV-1 membrane: no primitive can ever build a text-entry control', () => {
  it('has sources to check', () => {
    expect(uiSources().length, 'no *.ts under src/ui/').toBeGreaterThan(0);
  });

  it('never creates input / textarea / select / form / option elements', () => {
    const banned = /createElement\(\s*['"`](input|textarea|select|form|option)['"`]/i;
    for (const { rel, src } of uiSources()) {
      expect(src.match(banned)?.[0], `${rel} builds a native form control`).toBeUndefined();
    }
  });

  it('never sets contenteditable', () => {
    for (const { rel, src } of uiSources()) {
      expect(/contenteditable/i.test(src), `${rel} mentions contenteditable`).toBe(false);
    }
  });

  it('builds its click targets as real <button> elements', () => {
    const all = uiSources()
      .map((f) => f.src)
      .join('\n');
    expect(all, 'no <button> is ever created — verbs are not click targets').toMatch(
      /createElement\(\s*['"`]button['"`]/,
    );
  });
});

// ─────────────── The module contract later screens import ───────────────

const FACTORIES = [
  'createStage',
  'createUnitPanel',
  'createUnitSheet',
  'createBubble',
  'createCard',
  'createVial',
] as const;

describe('src/ui/index.ts: the frozen public surface', () => {
  for (const name of FACTORIES) {
    it(`exports ${name}()`, async () => {
      const m = await loadUi();
      expect(typeof m[name], `ui.${name} should be a function`).toBe('function');
    });
  }

  it('exports vialStateForGauge()', async () => {
    expect(typeof (await loadUi()).vialStateForGauge).toBe('function');
  });

  it('exports CARD_TYPES = prompt | skill | mcp', async () => {
    expect((await loadUi()).CARD_TYPES).toEqual(['prompt', 'skill', 'mcp']);
  });

  it('exports the four VIAL_STATES in ascending gauge order', async () => {
    // 평온 / 불안 / 한계 / 폭주 — PRD §2.5 tiers and §2.8's 4-cell vial sheet.
    expect((await loadUi()).VIAL_STATES).toEqual(['calm', 'uneasy', 'limit', 'overload']);
  });
});

// ─────────────── vialStateForGauge — the one pure function in the slice ───────────────

// Thresholds are a REQUIRED argument: balance-as-data (INV-8) forbids the UI layer from
// baking gauge numbers. These fixtures mirror the PRD §2.5 tiers (<40 · 40–70 · ≥70 · 100)
// but live here, not in src/.
const T = { uneasy: 40, limit: 70, overload: 100 };

describe('vialStateForGauge(gauge, thresholds)', () => {
  const call = async (g: number, t: unknown = T): Promise<unknown> => {
    const fn = (await loadUi()).vialStateForGauge as (g: number, t: unknown) => unknown;
    return fn(g, t);
  };

  it('maps a calm gauge below the first threshold', async () => {
    await expect(call(0)).resolves.toBe('calm');
    await expect(call(12)).resolves.toBe('calm');
  });

  it('maps the middle tier to uneasy and the high tier to limit', async () => {
    await expect(call(55)).resolves.toBe('uneasy');
    await expect(call(85)).resolves.toBe('limit');
  });

  it('treats every threshold as inclusive-lower (39→calm, 40→uneasy, 69→uneasy, 70→limit)', async () => {
    await expect(call(39)).resolves.toBe('calm');
    await expect(call(40)).resolves.toBe('uneasy');
    await expect(call(69)).resolves.toBe('uneasy');
    await expect(call(70)).resolves.toBe('limit');
  });

  it('only a full gauge is overload (99→limit, 100→overload)', async () => {
    await expect(call(99)).resolves.toBe('limit');
    await expect(call(100)).resolves.toBe('overload');
  });

  it('follows the thresholds it is given rather than the PRD defaults', async () => {
    await expect(call(30, { uneasy: 20, limit: 25, overload: 30 })).resolves.toBe('overload');
  });

  it('rejects a gauge outside 0–100', async () => {
    await expect(call(-1)).rejects.toThrow(/gauge/i);
    await expect(call(101)).rejects.toThrow(/gauge/i);
  });

  it('rejects a non-finite gauge', async () => {
    await expect(call(Number.NaN)).rejects.toThrow(/gauge/i);
    await expect(call(Number.POSITIVE_INFINITY)).rejects.toThrow(/gauge/i);
  });

  it('rejects thresholds that do not ascend', async () => {
    await expect(call(50, { uneasy: 70, limit: 40, overload: 100 })).rejects.toThrow(/threshold/i);
  });
});

// ─────────────── Validation-before-DOM: the error contract ───────────────

describe('primitive factories reject invalid input before building any DOM', () => {
  it('createCard throws on an unknown card type, naming it', async () => {
    const createCard = (await loadUi()).createCard as (o: unknown) => unknown;
    expect(() =>
      createCard({ id: 'c-x', type: 'curse', title: '허세', sentence: '…' }),
    ).toThrow(/curse/);
  });

  it('createVial throws on an unknown state, naming it', async () => {
    const createVial = (await loadUi()).createVial as (o: unknown) => unknown;
    expect(() => createVial({ state: 'molten' })).toThrow(/molten/);
  });

  it('createBubble refuses a decision with no because id (INV-3)', async () => {
    const createBubble = (await loadUi()).createBubble as (o: unknown) => unknown;
    expect(() => createBubble({ unitId: 'fiona', say: '물러서지 않는다.', because: [] })).toThrow(
      /because/i,
    );
  });

  it('createUnitSheet refuses a because id that resolves to no sheet item (INV-3)', async () => {
    const createUnitSheet = (await loadUi()).createUnitSheet as (u: unknown, o: unknown) => unknown;
    const unit = {
      id: 'fiona',
      name: '피오나',
      side: 'hero',
      gauge: 10,
      items: [
        { id: 'persona:fiona', kind: 'persona', text: '순례 사제.' },
        { id: 'card:fearless', kind: 'card', text: '「겁이 없다」' },
      ],
    };
    expect(() => createUnitSheet(unit, { because: ['card:ghost'] })).toThrow(/card:ghost/);
  });
});
