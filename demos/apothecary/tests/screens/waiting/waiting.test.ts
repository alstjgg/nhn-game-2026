// TDD-Red gate for u8 — the door-idle waiting beat (PRD §2.3).
//
// Contract sources: .claude/super/units/u8/spec.md (§5 AC table) and
// .claude/super/units/u8/design.md (§4 API contract). Three layers, per design §D-6:
//   1. behavioural — the pure, DOM-free `createSettleLatch` is *called*, not scanned;
//   2. structural  — source-text proof that the view renders the injected line with the
//                    contracted testids (vitest.config.ts is `environment: 'node'`, so
//                    there is no DOM here; the browser proof is u13's e2e);
//   3. prohibition — the N1/N2/N3/N4/A1 blocklists, table-driven so a failure names the
//                    offending token.
//
// IMPORTANT: the blocklists below necessarily *contain* the forbidden words. Every scan
// therefore reads the two owned files from disk (`src/screens/waiting/*`) and never this
// file. Do not rewrite a scan to walk the tests directory.
//
// These fail loudly (missing file / missing export) until
// src/screens/waiting/{waiting.ts,waiting.css} exist.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..', '..'); // demos/apothecary/

const p = (rel: string) => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');

const TS_REL = 'src/screens/waiting/waiting.ts';
const CSS_REL = 'src/screens/waiting/waiting.css';
const DIR_REL = 'src/screens/waiting';

const ts = (): string => read(TS_REL);
const css = (): string => read(CSS_REL);
const both = (): string => `${ts()}\n${css()}`;

// For the N1/N1.5/N2 forbidden-*word* blocklists only: this repo's convention
// (AC2.1 §D-6) is that scans read source text, so a comment that *describes*
// why a word is absent (e.g. "this screen owns no timeout") would otherwise
// trip the same regex that guards against actually using it. Structural /
// wiring scans below deliberately do NOT use this — they need the raw text.
const stripComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

type WaitingModule = typeof import('../../../src/screens/waiting/waiting');
const loadWaiting = (): Promise<WaitingModule> => import('../../../src/screens/waiting/waiting');

// ---------------------------------------------------------------------------
// AC1.1 / AC5.1 / AC5.4 — the unit ships exactly its two source files
// ---------------------------------------------------------------------------

describe('u8 files (AC1.1, AC5.1, AC5.4)', () => {
  it.each([TS_REL, CSS_REL])('%s exists', (rel) => {
    expect(existsSync(p(rel))).toBe(true);
  });

  it('src/screens/waiting/ holds nothing but the two owned files', () => {
    expect(readdirSync(p(DIR_REL)).sort()).toEqual(['waiting.css', 'waiting.ts']);
  });

  it('waiting.ts imports its own stylesheet (AC5.1)', () => {
    expect(ts()).toMatch(/import\s+['"]\.\/waiting\.css['"]/);
  });

  it('waiting.ts imports the shared token layer (design D-5)', () => {
    expect(ts()).toMatch(/import\s+['"]\.\.\/\.\.\/styles\/base\.css['"]/);
  });

  it('leaves the shared style layer untouched — base.css/animations.css never mention waiting (AC5.4)', () => {
    expect(read('src/styles/base.css')).not.toMatch(/waiting/i);
    expect(read('src/styles/animations.css')).not.toMatch(/waiting/i);
  });
});

// ---------------------------------------------------------------------------
// AC1.1 / AC1.4 — module surface + the pure settle latch, exercised for real
// ---------------------------------------------------------------------------

describe('u8 module surface (AC1.1, design §4)', () => {
  it('exports mountWaiting as a function', async () => {
    const mod = await loadWaiting();
    expect(typeof mod.mountWaiting).toBe('function');
  });

  it('mountWaiting takes (container, deps) — arity 2 (AC1.2)', async () => {
    const mod = await loadWaiting();
    expect(mod.mountWaiting.length).toBe(2);
  });

  it('exports createSettleLatch as a function (AC1.4, design D-2)', async () => {
    const mod = await loadWaiting();
    expect(typeof mod.createSettleLatch).toBe('function');
  });

  it('exports nothing else at runtime — u13 import surface stays minimal (design §4)', async () => {
    const mod = await loadWaiting();
    expect(Object.keys(mod).sort()).toEqual(['createSettleLatch', 'mountWaiting']);
  });

  it('module load performs no DOM work (importable in the node gate)', async () => {
    await expect(loadWaiting()).resolves.toBeDefined();
  });
});

describe('createSettleLatch — caller-driven, exactly-once (AC1.4, F4)', () => {
  it('starts unsettled and does not fire spontaneously', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
    });
    expect(latch.settled).toBe(false);
    expect(calls).toBe(0);
  });

  it('never fires without a settle() call, even after the event loop turns (F4)', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toBe(0);
    expect(latch.settled).toBe(false);
  });

  it('fires onSettled once on the first settle()', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
    });
    latch.settle();
    expect(calls).toBe(1);
  });

  it('flips settled false -> true on the same object (AC1.4)', async () => {
    const { createSettleLatch } = await loadWaiting();
    const latch = createSettleLatch(() => {});
    expect(latch.settled).toBe(false);
    latch.settle();
    expect(latch.settled).toBe(true);
  });

  it('fires exactly once for N=3 settle() calls (AC1.4)', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
    });
    latch.settle();
    latch.settle();
    latch.settle();
    expect(calls).toBe(1);
    expect(latch.settled).toBe(true);
  });

  it('invokes onSettled with no arguments (A3 — no generation payload crosses the seam)', async () => {
    const { createSettleLatch } = await loadWaiting();
    const seen: unknown[][] = [];
    const latch = createSettleLatch((...args: unknown[]) => {
      seen.push(args);
    });
    latch.settle();
    expect(seen).toEqual([[]]);
  });

  it('seal() disarms the latch — a later settle() never fires (destroy ordering)', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
    });
    latch.seal();
    latch.settle();
    expect(calls).toBe(0);
    expect(latch.settled).toBe(false);
  });

  it('seal() after settle() does not re-fire or un-settle', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
    });
    latch.settle();
    latch.seal();
    latch.settle();
    expect(calls).toBe(1);
    expect(latch.settled).toBe(true);
  });

  it('seal() is idempotent', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
    });
    latch.seal();
    latch.seal();
    latch.settle();
    expect(calls).toBe(0);
  });

  it('tolerates a latch created without a callback (A3 — onSettled optional)', async () => {
    const { createSettleLatch } = await loadWaiting();
    const latch = createSettleLatch();
    expect(() => latch.settle()).not.toThrow();
    expect(latch.settled).toBe(true);
    expect(() => latch.settle()).not.toThrow();
  });

  it('keeps two latches independent (no module-level state)', async () => {
    const { createSettleLatch } = await loadWaiting();
    let a = 0;
    let b = 0;
    const first = createSettleLatch(() => {
      a += 1;
    });
    const second = createSettleLatch(() => {
      b += 1;
    });
    first.settle();
    expect(a).toBe(1);
    expect(b).toBe(0);
    expect(second.settled).toBe(false);
    second.settle();
    expect(b).toBe(1);
  });

  it('does not swallow a throwing callback into a silent retry loop (fires once, propagates)', async () => {
    const { createSettleLatch } = await loadWaiting();
    let calls = 0;
    const latch = createSettleLatch(() => {
      calls += 1;
      throw new Error('caller blew up');
    });
    try {
      latch.settle();
    } catch {
      /* the caller owns its own failure; the latch must not re-arm */
    }
    latch.settle();
    expect(calls).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// AC1.2 / AC1.3 / D-3 / F5 — the view renders the injected line (source proof)
// ---------------------------------------------------------------------------

describe('mountWaiting view contract (AC1.2, AC1.3, D-3, F5)', () => {
  it('declares mountWaiting as an exported function', () => {
    expect(ts()).toMatch(/export\s+function\s+mountWaiting\s*\(/);
  });

  it('types deps with both line and onSettled (AC1.2)', () => {
    const src = ts();
    expect(src).toMatch(/\bline\s*:\s*string/);
    expect(src).toMatch(/\bonSettled\?\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  it('writes the injected line into the DOM via textContent (AC1.3)', () => {
    expect(ts()).toMatch(/textContent\s*=\s*(deps\.)?line\b/);
  });

  it('actually wires the line element into the tree it returns, not just an orphan node (AC1.3)', () => {
    // Catches the element carrying the injected line being built (and given
    // textContent) but never appended anywhere — the previous regex above
    // only proves the assignment exists in source, not that it reaches root.
    expect(ts()).toMatch(/root\.append\([\s\S]{0,80}?\blineEl\b[\s\S]{0,20}?\);/);
  });

  it('never uses innerHTML (injected copy stays inert — mirrors renderDoorNote)', () => {
    expect(ts()).not.toMatch(/innerHTML/);
  });

  it('carries the contracted testids for u13 e2e selectors (D-3)', () => {
    const src = ts();
    expect(src).toMatch(/['"]waiting['"]/);
    expect(src).toMatch(/['"]waiting-line['"]/);
    expect(src).toMatch(/dataset\.testid/);
  });

  it('appends its own root to container unconditionally, never clearing it (A4)', () => {
    const src = ts();
    // Exact-indentation match: `container.append(root);` must sit as a
    // direct, unconditional statement at mountWaiting's top level (2-space
    // indent). Moving it inside an if/ternary/loop guard would push it to a
    // deeper indent level and fail this, unlike a bare "does this substring
    // exist anywhere" check — see PR #35 review: a mutation that gated this
    // call behind an always-false condition previously passed the gate.
    expect(src).toMatch(/\n {2}container\.append\(root\);\n/);
    expect(src).not.toMatch(/container\.innerHTML/);
    expect(src).not.toMatch(/container\.replaceChildren/);
  });

  it('returns a handle exposing root, settle and destroy (F5, design §4)', () => {
    const src = ts();
    expect(src).toMatch(/readonly\s+root\s*:\s*HTMLElement/);
    expect(src).toMatch(/\bsettle\s*\(\s*\)\s*:\s*void/);
    expect(src).toMatch(/\bdestroy\s*\(\s*\)\s*:\s*void/);
  });

  it('destroy() detaches only the element u8 created (A4)', () => {
    expect(ts()).toMatch(/root\.remove\s*\(\s*\)/);
  });

  it('settle() flips data-phase to settling before firing the latch (D-1, WaitingHandle.settle contract)', () => {
    // The settling visual (waiting.css) is gated entirely on this attribute;
    // node has no DOM to render it in, so this pins the wiring by source
    // scan. Whether the transition ever *paints* is the caller's (u13)
    // responsibility per the settle() docstring — see that JSDoc for the
    // full contract this line only partially proves.
    expect(ts()).toMatch(
      /settle\(\):\s*void\s*\{\s*root\.dataset\.phase\s*=\s*['"]settling['"];\s*latch\.settle\(\);/,
    );
  });

  it('owns no Korean copy of its own — the line is injected (AC1.3, A2, design D-2)', () => {
    expect(ts()).not.toMatch(/[ㄱ-ㆎ가-힣]/);
  });

  it('owns no Korean copy in the stylesheet either (design D-2)', () => {
    expect(css()).not.toMatch(/[ㄱ-ㆎ가-힣]/);
  });
});

describe('the screen is a pure view (F6)', () => {
  it.each([
    ['data/', /from\s+['"][^'"]*\/data\//],
    ['state/', /from\s+['"][^'"]*\/state\//],
    ['ai/', /from\s+['"][^'"]*\/ai\//],
    ['data/*.json', /from\s+['"][^'"]*\.json['"]/],
  ])('does not import %s', (_label, re) => {
    expect(ts()).not.toMatch(re);
  });
});

// ---------------------------------------------------------------------------
// AC2.1 / AC1.5 / A1 — the beat owns no time
// ---------------------------------------------------------------------------

describe('waiting.ts owns no timer or clock (AC2.1, N1, §3-3)', () => {
  it.each([
    ['setTimeout', /setTimeout/],
    ['setInterval', /setInterval/],
    ['requestAnimationFrame', /requestAnimationFrame/],
    ['Date.now', /Date\.now/],
    ['performance.now', /performance\.now/],
    ['new Date', /new\s+Date\b/],
  ])('contains no %s', (_label, re) => {
    expect(stripComments(ts())).not.toMatch(re);
  });

  it('never gates the callback on animationend (D-1)', () => {
    const src = ts();
    const gated = /animationend[\s\S]{0,200}onSettled/.test(src) || /onSettled[\s\S]{0,200}animationend/.test(src);
    expect(gated).toBe(false);
  });
});

describe('the 25s deadline lives in u5/u13, not here (AC1.5, A1)', () => {
  it.each([
    ['25000', /25000/],
    ['25_000', /25_000/],
    ['deadline', /deadline/i],
    ['timeout', /timeout/i],
    ['a bare ms duration word', /\bms\b/i],
  ])('waiting.ts contains no %s', (_label, re) => {
    expect(stripComments(ts())).not.toMatch(re);
  });
});

// ---------------------------------------------------------------------------
// AC3.1 / AC3.2 — waiting is staging, not a status readout (§3-5, invariant 5)
// ---------------------------------------------------------------------------

describe('no loading / error vocabulary anywhere (AC3.1, N2, §3-5)', () => {
  it.each([
    ['로딩', /로딩/],
    ['생성 중', /생성\s*중/],
    ['불러오는', /불러오는/],
    ['기다려', /기다려/],
    ['오류', /오류/],
    ['에러', /에러/],
    ['실패', /실패/],
    ['재시도', /재시도/],
    ['loading', /loading/i],
    ['error', /error/i],
    ['retry', /retry/i],
    ['failed', /failed/i],
    ['spinner', /spinner/i],
  ])('waiting.ts + waiting.css contain no %s', (_label, re) => {
    expect(stripComments(both())).not.toMatch(re);
  });
});

describe('no status/progress semantics in the markup (AC3.2, N3)', () => {
  it.each([
    ['role="progressbar"', /role\s*=?\s*['"]?progressbar/i],
    ['role="status"', /role\s*=?\s*['"]?status/i],
    ['role="alert"', /role\s*=?\s*['"]?alert/i],
    ['aria-busy', /aria-busy/i],
    ['aria-live', /aria-live/i],
    ['aria-valuenow', /aria-valuenow/i],
    ['ariaBusy property form', /ariaBusy/],
    ['ariaLive property form', /ariaLive/],
    ['setAttribute("role", ...)', /setAttribute\(\s*['"]role['"]/],
  ])('waiting.ts contains no %s', (_label, re) => {
    expect(ts()).not.toMatch(re);
  });

  it('decorative scenery is hidden from assistive tech (design D-3)', () => {
    expect(ts()).toMatch(/aria-hidden|ariaHidden/);
  });
});

// ---------------------------------------------------------------------------
// AC4.1 / AC4.2 — membrane · cards-never-forms
// ---------------------------------------------------------------------------

describe('no native form controls (AC4.1, N4, membrane)', () => {
  it.each(['input', 'select', 'textarea', 'form', 'option', 'label'])(
    'never calls createElement("%s")',
    (tag) => {
      expect(ts()).not.toMatch(new RegExp(`createElement\\(\\s*['"\`]${tag}['"\`]`, 'i'));
    },
  );

  it.each(['input', 'select', 'textarea', 'form', 'option', 'label'])(
    'contains no bare "%s" tag literal',
    (tag) => {
      expect(ts()).not.toMatch(new RegExp(`['"\`]${tag}['"\`]`, 'i'));
    },
  );

  it('composes no prompt string for an LLM (N5, membrane)', () => {
    expect(ts()).not.toMatch(/prompt/i);
  });
});

describe('interactive vocabulary is card/button only (AC4.2)', () => {
  it('registers a click listener only if it also builds a button or role=button', () => {
    const src = ts();
    const hasClick = /addEventListener\(\s*['"]click['"]/.test(src) || /\bonclick\b/.test(src);
    if (!hasClick) {
      expect(hasClick).toBe(false); // D-4: zero interactive elements — vacuously satisfied
      return;
    }
    const buttonish =
      /createElement\(\s*['"`]button['"`]/.test(src) ||
      /role\s*=?\s*['"]?button/i.test(src) ||
      /createCard\(/.test(src);
    expect(buttonish).toBe(true);
  });

  it('ships no dismiss affordance — the pipeline dismisses the beat (D-4, Q1)', () => {
    expect(ts()).not.toMatch(/addEventListener\(\s*['"]click['"]/);
  });
});

// ---------------------------------------------------------------------------
// AC5.2 / AC5.3 — the stylesheet reuses tokens and respects reduced motion
// ---------------------------------------------------------------------------

describe('waiting.css (AC5.2, AC5.3, N6, N7)', () => {
  it('styles the contracted root class', () => {
    expect(css()).toMatch(/\.waiting\b/);
  });

  it('uses at least one base.css token (AC5.2)', () => {
    expect(css()).toMatch(/var\(--/);
  });

  it('hard-codes no hex colour that duplicates a base.css token (AC5.2)', () => {
    const tokenHexes = [...read('src/styles/base.css').matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) =>
      m[0].toLowerCase(),
    );
    const cssHexes = [...css().matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase());
    const duplicated = cssHexes.filter((h) => tokenHexes.includes(h));
    expect(duplicated).toEqual([]);
  });

  it('declares a reduced-motion block for any keyframe it introduces (AC5.3, N7)', () => {
    const src = css();
    if (!/@keyframes/.test(src)) {
      expect(/@keyframes/.test(src)).toBe(false);
      return;
    }
    expect(src).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });

  it('imports no other stylesheet and pulls no remote asset (R1)', () => {
    const src = css();
    expect(src).not.toMatch(/@import/);
    expect(src).not.toMatch(/url\(/);
  });
});
