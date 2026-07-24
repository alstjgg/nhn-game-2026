// Static/structural TDD-Red tests for u5 — shared UI primitives.
// Contract (PRD §1.2 card-feel + §1.3 animation vocabulary, §4.1/§4.5 invariants):
//   src/styles/base.css       — foundational design tokens (:root)
//   src/styles/cards.css      — .card with hover / press(:active) / .card--selected states
//   src/styles/animations.css — animation vocabulary keyframes + transition tokens
//   src/ui/*.ts               — card factory: interactive (button/role=button), toggles
//                               selected state, NEVER creates native <select>/<input>/<textarea>
//
// These are pure file/CSS/source-text checks (vitest node env, no DOM) — the honest
// behavioral proof (hover/selected in a real browser) lives in e2e/cards.spec.ts.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..'); // demos/apothecary/

const p = (rel: string) => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');

// Recursively collect *.ts source files under src/ui/ (empty if the dir is absent).
function uiSources(): { rel: string; src: string }[] {
  const dir = p('src/ui');
  if (!existsSync(dir)) return [];
  const out: { rel: string; src: string }[] = [];
  const walk = (abs: string, rel: string): void => {
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      const childAbs = join(abs, ent.name);
      const childRel = `${rel}/${ent.name}`;
      if (ent.isDirectory()) walk(childAbs, childRel);
      else if (ent.name.endsWith('.ts')) out.push({ rel: childRel, src: readFileSync(childAbs, 'utf8') });
    }
  };
  walk(dir, 'src/ui');
  return out;
}

describe('u5 primitives: required files exist', () => {
  const required = ['src/styles/base.css', 'src/styles/cards.css', 'src/styles/animations.css'];
  for (const f of required) {
    it(`has ${f}`, () => {
      expect(existsSync(p(f)), `missing ${f}`).toBe(true);
    });
  }

  it('ships at least one card component module under src/ui/', () => {
    expect(uiSources().length, 'no *.ts files under src/ui/').toBeGreaterThan(0);
  });
});

describe('base.css: foundational design tokens', () => {
  it('declares a :root token block (shared foundation, not per-screen inline)', () => {
    expect(read('src/styles/base.css')).toMatch(/:root\s*{/);
  });
});

describe('cards.css: card-feel state vocabulary (PRD §1.2)', () => {
  const css = () => read('src/styles/cards.css');

  it('defines a base .card selector', () => {
    expect(css()).toMatch(/\.card\b/);
  });

  it('defines a hover state on .card', () => {
    expect(css()).toMatch(/\.card[^,{}]*:hover/);
  });

  it('defines a press state on .card (:active)', () => {
    expect(css()).toMatch(/\.card[^,{}]*:active/);
  });

  it('defines a selected state (.card--selected)', () => {
    expect(css()).toMatch(/\.card--selected\b/);
  });
});

describe('animations.css: animation vocabulary (PRD §1.3)', () => {
  const css = () => read('src/styles/animations.css');

  it('defines a portrait enter keyframe', () => {
    expect(css()).toMatch(/@keyframes\s+portrait[-_]?enter\b/i);
  });

  it('defines a portrait exit keyframe', () => {
    expect(css()).toMatch(/@keyframes\s+portrait[-_]?exit\b/i);
  });

  it('defines a dialogue type-on keyframe', () => {
    expect(css()).toMatch(/@keyframes\s+type[-_]?on\b/i);
  });

  it('defines a patience-meter (draining) keyframe', () => {
    expect(css()).toMatch(/@keyframes\s+meter[-_]?(drain|down|deplete)\b/i);
  });

  it('declares reusable transition/easing/duration tokens (shared transition vocabulary)', () => {
    const combined = read('src/styles/animations.css') + read('src/styles/base.css');
    expect(combined).toMatch(/--(transition|ease|duration)[\w-]*\s*:/i);
  });
});

describe('card component (src/ui): interactive control, never a native form field', () => {
  it('exports a card factory', () => {
    const anyExport = uiSources().some(({ src }) => /export\s+(?:function|const)\s+\w*[Cc]ard\w*/.test(src));
    expect(anyExport, 'no exported *card* factory found under src/ui/').toBe(true);
  });

  it('builds an interactive element (button or role="button"), not a bare div', () => {
    const interactive = uiSources().some(({ src }) =>
      /createElement\(\s*['"]button['"]/.test(src) ||
      /role['"]?\s*[,:=]\s*['"]button['"]/.test(src) ||
      /<button/.test(src),
    );
    expect(interactive, 'card is not rendered as a button / role="button"').toBe(true);
  });

  it('reflects the selected state via a class or aria-pressed', () => {
    const selectable = uiSources().some(({ src }) => /card--selected|aria-pressed/.test(src));
    expect(selectable, 'no card--selected / aria-pressed wiring found').toBe(true);
  });

  it('NEVER creates native <select>/<input>/<textarea> (membrane §4.1 + cards-never-forms §4.5)', () => {
    for (const { rel, src } of uiSources()) {
      expect(
        /createElement\(\s*['"](?:select|input|textarea)['"]/.test(src),
        `${rel} creates a native form control via createElement`,
      ).toBe(false);
      expect(
        /<\s*(?:select|input|textarea)\b/.test(src),
        `${rel} contains a native form-control tag`,
      ).toBe(false);
    }
  });

  it('never emits a contenteditable surface (free-text is forbidden, §4.1)', () => {
    for (const { rel, src } of uiSources()) {
      expect(/contenteditable/i.test(src), `${rel} references contenteditable`).toBe(false);
    }
  });
});

// AC1 — the frozen contract name (u3/u4 depend on `CardOptions`).
describe('card component (src/ui): frozen contract surface (AC1)', () => {
  it('exports the CardOptions interface', () => {
    const hasType = uiSources().some(({ src }) => /export\s+interface\s+CardOptions\b/.test(src));
    expect(hasType, 'no exported `CardOptions` interface found under src/ui/').toBe(true);
  });

  it('exports a `createCard` factory returning an HTMLButtonElement', () => {
    const hasFactory = uiSources().some(({ src }) =>
      /export\s+function\s+createCard\s*\(/.test(src) &&
      /:\s*HTMLButtonElement\b/.test(src),
    );
    expect(hasFactory, 'no `createCard(...): HTMLButtonElement` export found').toBe(true);
  });

  it('imports the three CSS layers so consumers pull in tokens + states + motion for free', () => {
    const importsAll = uiSources().some(({ src }) =>
      /base\.css/.test(src) && /cards\.css/.test(src) && /animations\.css/.test(src),
    );
    expect(importsAll, 'card factory does not import base + cards + animations CSS').toBe(true);
  });

  it('makes no runtime network call (no fetch/XHR/WebSocket — §4.2)', () => {
    for (const { rel, src } of uiSources()) {
      expect(/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(src), `${rel} performs a network call`).toBe(false);
    }
  });
});

// AC8 — the exact motion-token names screens/consumers reference.
describe('base.css: exact motion token vocabulary (AC8)', () => {
  const css = () => read('src/styles/base.css');
  for (const token of [
    '--duration-fast',
    '--duration-base',
    '--duration-slow',
    '--ease-standard',
    '--ease-emphasized',
    '--transition-base',
  ]) {
    it(`declares ${token}`, () => {
      expect(css()).toMatch(new RegExp(`${token}\\s*:`));
    });
  }

  it('scopes --transition-base to specific properties, not `all`', () => {
    const m = css().match(/--transition-base\s*:\s*([^;]+);/);
    expect(m, '--transition-base not declared').not.toBeNull();
    expect(/\ball\b/.test(m![1]), '--transition-base uses `all` (should list properties)').toBe(false);
    expect(/transform/.test(m![1]), '--transition-base omits transform').toBe(true);
  });
});

// AC9 — the `.anim-*` utility classes that pair with the keyframes.
describe('animations.css: .anim-* utility class vocabulary (AC9)', () => {
  const css = () => read('src/styles/animations.css');
  for (const cls of ['anim-portrait-enter', 'anim-portrait-exit', 'anim-type-on', 'anim-meter-drain']) {
    it(`defines a .${cls} utility class`, () => {
      expect(css()).toMatch(new RegExp(`\\.${cls}\\b`));
    });
  }
});

// AC10 — reduced-motion guard neutralizes motion globally.
describe('animations.css: reduced-motion guard (AC10)', () => {
  const css = () => read('src/styles/animations.css');

  it('includes a @media (prefers-reduced-motion: reduce) block', () => {
    expect(css()).toMatch(/@media[^{]*prefers-reduced-motion\s*:\s*reduce/);
  });

  it('neutralizes both animation and transition durations inside that block', () => {
    const block = css().match(/@media[^{]*prefers-reduced-motion[^{]*\{([\s\S]*)\}\s*$/);
    const body = block ? block[1] : css();
    expect(/animation-duration\s*:/.test(body), 'no animation-duration override').toBe(true);
    expect(/transition-duration\s*:/.test(body), 'no transition-duration override').toBe(true);
  });
});

// AC12 — no remote resources anywhere in the shared style layer (§4.2).
describe('CSS layer: no remote resources (AC12 / §4.2)', () => {
  for (const f of ['src/styles/base.css', 'src/styles/cards.css', 'src/styles/animations.css']) {
    it(`${f} has no url(http…) or remote @import`, () => {
      const css = read(f);
      expect(/url\(\s*['"]?https?:/i.test(css), `${f} references a remote url()`).toBe(false);
      expect(/@import\s+(?:url\()?\s*['"]?https?:/i.test(css), `${f} has a remote @import`).toBe(false);
    });
  }
});
