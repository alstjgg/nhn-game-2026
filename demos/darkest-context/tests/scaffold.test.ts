// Scaffold invariant tests — darkest-context demo, unit u1 (TDD-Red).
//
// Pure file / config / module checks — no DOM (DOM smoke lives under e2e/).
// Test-name filters used by the unit gate:
//   -t harness  → the vite rollup-input glob seam (AC3)
//   -t shell    → the src/app/shell.ts screen-mount registry seam (AC4)
// Keep the words "harness" and "shell" OUT of every other describe/it name.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // demos/darkest-context/

const p = (rel: string) => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');
// Strip /* */ and // comments so JSON-with-comments parses and so source-shape
// assertions never trip on a comment that merely mentions a banned pattern.
const stripComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

// ───────────────────────────── AC1 — own-slice scaffold ─────────────────────────────

describe('scaffold: required files exist', () => {
  const required = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tsconfig.test.json',
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'index.html',
    '.gitignore',
    'scripts/gate-secrets.mjs',
    'src/main.ts',
    'src/app/shell.ts',
    'src/styles/base.css',
  ];
  for (const f of required) {
    it(`has ${f}`, () => {
      expect(existsSync(p(f)), `missing ${f}`).toBe(true);
    });
  }
});

type PkgJson = {
  name?: string;
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

describe('package.json: self-contained demo package', () => {
  const pkg = (): PkgJson => JSON.parse(read('package.json')) as PkgJson;

  it('is an ESM package (type: module)', () => {
    expect(pkg().type).toBe('module');
  });

  it('exposes the full script interface the gates call', () => {
    const s = pkg().scripts ?? {};
    for (const name of ['dev', 'build', 'preview', 'test', 'test:e2e', 'typecheck']) {
      expect(s[name], `scripts.${name}`).toBeTruthy();
    }
  });

  it('build script runs tsc then vite build (type-checked build)', () => {
    const build = String(pkg().scripts?.build ?? '');
    expect(build).toMatch(/tsc/);
    expect(build).toMatch(/vite build/);
  });

  it('declares vite + typescript + vitest + @playwright/test as devDependencies', () => {
    const dev = { ...(pkg().dependencies ?? {}), ...(pkg().devDependencies ?? {}) };
    expect(dev.vite, 'vite').toBeTruthy();
    expect(dev.typescript, 'typescript').toBeTruthy();
    expect(dev.vitest, 'vitest').toBeTruthy();
    expect(dev['@playwright/test'], '@playwright/test').toBeTruthy();
  });

  it('has NO runtime dependencies (deployed build is plain ES modules)', () => {
    expect(Object.keys(pkg().dependencies ?? {})).toEqual([]);
  });
});

describe('tsconfig: strict, and tests are type-checked too', () => {
  it('sets compilerOptions.strict = true', () => {
    const cfg = JSON.parse(stripComments(read('tsconfig.json'))) as {
      compilerOptions?: { strict?: boolean };
    };
    expect(cfg.compilerOptions?.strict).toBe(true);
  });

  it('tsconfig.test.json extends tsconfig.json and covers tests/ + e2e/', () => {
    const cfg = JSON.parse(stripComments(read('tsconfig.test.json'))) as {
      extends?: string;
      include?: string[];
    };
    expect(String(cfg.extends ?? '')).toMatch(/tsconfig\.json$/);
    const include = (cfg.include ?? []).join(' ');
    expect(include).toMatch(/tests/);
    expect(include).toMatch(/e2e/);
  });

  it('typecheck script covers the test tsconfig as well as src', () => {
    const pkg = JSON.parse(read('package.json')) as PkgJson;
    expect(String(pkg.scripts?.typecheck ?? '')).toMatch(/tsconfig\.test\.json/);
  });
});

describe('vitest.config.ts: unit slice points at tests/', () => {
  it('includes tests/**/*.test.ts', () => {
    // Raw read on purpose: the glob's own `/**/` IS a well-formed block-comment
    // span, so stripComments() would rewrite any valid config's
    // 'tests/**/*.test.ts' to 'tests*.test.ts' and this could never pass. The
    // strip exists to stop a *comment* from satisfying a source assertion; here
    // it would only ever destroy the thing being asserted. See discovery/u1.md.
    expect(read('vitest.config.ts')).toMatch(/tests\/\*\*\/\*\.test\.ts/);
  });
});

describe('index.html: single-page mount point', () => {
  const html = () => read('index.html');

  it('has the #app root element the boot renders into', () => {
    expect(html()).toMatch(/id\s*=\s*["']app["']/);
  });

  it('loads src/main.ts as an ES module', () => {
    expect(html()).toMatch(/<script[^>]*type\s*=\s*["']module["'][^>]*main\.ts/);
  });

  it('declares no native text-input control (PRD §4-1 membrane, scaffold level)', () => {
    expect(html()).not.toMatch(/<(input|textarea)\b|contenteditable/i);
  });
});

describe('.gitignore: build + deps + test output ignored', () => {
  const gi = () => read('.gitignore');
  for (const entry of ['node_modules', 'dist']) {
    it(`ignores ${entry}`, () => {
      expect(gi()).toMatch(new RegExp(`(^|\\n)\\s*${entry}\\s*(\\n|$)`));
    });
  }
  it('ignores playwright output', () => {
    expect(gi()).toMatch(/playwright-report|test-results/);
  });
});

// ─────────────────── AC2 — INV-8: repo-wide build rules (this unit owns) ───────────────────

describe('INV-8: no engine or UI framework anywhere in the dependency tree', () => {
  const banned = [
    'react',
    'react-dom',
    'vue',
    'svelte',
    '@angular/core',
    'phaser',
    'pixi.js',
    'three',
    '@babylonjs/core',
    'excalibur',
    'melonjs',
    'kaboom',
  ];

  it('package.json declares none of them', () => {
    const pkg = JSON.parse(read('package.json')) as PkgJson;
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    for (const name of banned) {
      expect(deps[name], `banned dependency present: ${name}`).toBeUndefined();
    }
  });

  it('package-lock.json resolves none of them either (transitive guard)', () => {
    const lock = JSON.parse(read('package-lock.json')) as {
      packages?: Record<string, unknown>;
    };
    const paths = Object.keys(lock.packages ?? {});
    for (const name of banned) {
      const hit = paths.find((k) => k === `node_modules/${name}`);
      expect(hit, `banned package in lockfile: ${hit}`).toBeUndefined();
    }
  });
});

describe('INV-8: vite base is subpath-safe', () => {
  const src = () => stripComments(read('vite.config.ts'));

  it("sets base: './' so every emitted asset URL stays relative", () => {
    expect(src()).toMatch(/base\s*:\s*['"]\.\/['"]/);
  });

  it("does NOT hardcode the repo-name base ('/nhn-game-2026/') like the root config", () => {
    expect(src()).not.toMatch(/\/nhn-game-2026\//);
  });
});

// ─────────────────── AC3 — PARALLELISM SEAM (gate: vitest -t harness) ───────────────────

type ViteInput = string | string[] | Record<string, string> | undefined;

const HARNESS_DIR = p('e2e/harness');
const PROBE = `_probe-${process.pid}`;
const probeDir = join(HARNESS_DIR, PROBE);

describe('vite rollup inputs are discovered by globbing the harness dir', () => {
  let inputs: string[] = [];
  let loadError: unknown;

  beforeAll(async () => {
    // Create a harness dir the config has never heard of BEFORE loading the
    // config, so a glob picks it up and a hardcoded list cannot.
    mkdirSync(probeDir, { recursive: true });
    writeFileSync(
      join(probeDir, 'index.html'),
      '<!doctype html><html><body><div id="app">probe</div></body></html>\n',
      'utf8',
    );
    try {
      const mod = (await import('../vite.config.ts')) as { default: unknown };
      const raw = mod.default as
        | { build?: { rollupOptions?: { input?: ViteInput } } }
        | ((env: { command: string; mode: string }) => unknown);
      const cfg = (
        typeof raw === 'function' ? await raw({ command: 'build', mode: 'production' }) : raw
      ) as { build?: { rollupOptions?: { input?: ViteInput } } };
      const input = cfg?.build?.rollupOptions?.input;
      inputs =
        typeof input === 'string'
          ? [input]
          : Array.isArray(input)
            ? input
            : Object.values(input ?? {});
    } catch (err) {
      loadError = err;
    }
  });

  afterAll(() => {
    rmSync(probeDir, { recursive: true, force: true });
  });

  it('vite.config.ts loads and declares build.rollupOptions.input', () => {
    expect(loadError, `vite.config.ts failed to load: ${String(loadError)}`).toBeUndefined();
    expect(inputs.length, 'no rollupOptions.input entries resolved').toBeGreaterThan(0);
  });

  it('includes the demo home page as a build input', () => {
    expect(inputs.some((i) => i.replace(/\\/g, '/').endsWith('darkest-context/index.html'))).toBe(
      true,
    );
  });

  it('picks up the committed dummy harness dir', () => {
    expect(
      inputs.some((i) => i.replace(/\\/g, '/').endsWith('e2e/harness/_scaffold/index.html')),
      `inputs: ${inputs.join(' | ')}`,
    ).toBe(true);
  });

  it('picks up a brand-new harness dir the config never names (no config edit needed)', () => {
    expect(
      inputs.some((i) => i.replace(/\\/g, '/').endsWith(`e2e/harness/${PROBE}/index.html`)),
      `probe dir not discovered — inputs: ${inputs.join(' | ')}`,
    ).toBe(true);
  });

  it('vite.config.ts globs the harness dir instead of listing pages by name', () => {
    const src = stripComments(read('vite.config.ts'));
    expect(src, 'no e2e/harness/*/index.html glob pattern found').toMatch(
      /e2e\/harness\/\*\/index\.html/,
    );
    // A literal named page under e2e/harness/ means the next screen unit would
    // have to edit this file — exactly the coupling this seam removes.
    expect(src, 'vite.config.ts names a harness page literally').not.toMatch(
      /e2e\/harness\/(?!\*)[A-Za-z0-9_-]+\//,
    );
  });
});

// ─────────────────── AC4 — SHELL SEAM (gate: vitest -t shell) ───────────────────

describe('app shell: screen-mount registry', () => {
  it('exports the registry surface screen units mount through', async () => {
    const m = (await import('../src/app/shell.ts')) as Record<string, unknown>;
    for (const fn of ['registerScreen', 'mountScreen', 'hasScreen', 'screenIds', 'mountShell']) {
      expect(typeof m[fn], `shell.${fn} should be a function`).toBe('function');
    }
  });

  it('mountScreen forwards the container and deps to the registered mount fn', async () => {
    const { registerScreen, mountScreen } = await import('../src/app/shell.ts');
    const calls: Array<[unknown, unknown]> = [];
    const container = { tagName: 'DIV' } as unknown as HTMLElement;
    const deps = { seed: 7 };
    registerScreen('t-forward', (c, d) => {
      calls.push([c, d]);
    });
    mountScreen('t-forward', container, deps);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe(container);
    expect(calls[0]?.[1]).toBe(deps);
  });

  it('mountScreen returns the unmount fn the screen handed back', async () => {
    const { registerScreen, mountScreen } = await import('../src/app/shell.ts');
    const unmount = () => {};
    registerScreen('t-unmount', () => unmount);
    expect(mountScreen('t-unmount', {} as HTMLElement, {})).toBe(unmount);
  });

  it('registerScreen rejects a duplicate id (two units cannot claim one screen)', async () => {
    const { registerScreen } = await import('../src/app/shell.ts');
    registerScreen('t-dup', () => {});
    expect(() => registerScreen('t-dup', () => {})).toThrow(/t-dup/);
  });

  it('mountScreen throws a named error for an unknown screen id', async () => {
    const { mountScreen } = await import('../src/app/shell.ts');
    expect(() => mountScreen('t-missing', {} as HTMLElement, {})).toThrow(/t-missing/);
  });

  it('hasScreen and screenIds reflect what has been registered', async () => {
    const { registerScreen, hasScreen, screenIds } = await import('../src/app/shell.ts');
    expect(hasScreen('t-listed')).toBe(false);
    registerScreen('t-listed', () => {});
    expect(hasScreen('t-listed')).toBe(true);
    expect(screenIds()).toContain('t-listed');
  });

  it('shell module imports no screen module (screens self-register, shell stays generic)', () => {
    const src = stripComments(read('src/app/shell.ts'));
    expect(src, 'shell.ts imports a screen module').not.toMatch(
      /from\s+['"][^'"]*\/screens\/[^'"]+['"]/,
    );
  });

  it('src/main.ts renders only the shell + boot slot, importing no screen module', () => {
    const src = stripComments(read('src/main.ts'));
    expect(src, 'main.ts should target #app').toMatch(
      /getElementById\(\s*['"]app['"]\s*\)|querySelector\(\s*['"]#app['"]\s*\)/,
    );
    expect(src, 'main.ts should delegate rendering to the shell').toMatch(/mountShell\s*\(/);
    expect(src, 'main.ts imports a screen module — screen units must not edit it').not.toMatch(
      /from\s+['"][^'"]*\/screens\/[^'"]+['"]/,
    );
  });
});

// ─────────────────── AC5 — GATE PLUMBING ───────────────────

describe('playwright config fences live specs behind LIVE=1', () => {
  const src = () => stripComments(read('playwright.config.ts'));

  it('sets grepInvert on the @live tag unless process.env.LIVE is set', () => {
    const s = src();
    expect(s).toMatch(/grepInvert/);
    expect(s).toMatch(/@live/);
    expect(s).toMatch(/process\.env\.LIVE/);
  });

  it('targets chromium only, headless', () => {
    const s = src();
    expect(s).toMatch(/chromium|Desktop Chrome/i);
    expect(s).not.toMatch(/firefox|webkit/i);
    expect(s).not.toMatch(/headless\s*:\s*false/);
  });

  it('points testDir at e2e/ and builds before previewing', () => {
    const s = src();
    expect(s).toMatch(/testDir\s*:\s*['"][.\/]*e2e['"]/);
    expect(s, 'webServer must build first — preview only serves an existing dist/').toMatch(
      /npm run build[\s\S]*preview/,
    );
  });
});

describe('gate-secrets script fails closed on provider keys in dist', () => {
  // Contract: `node scripts/gate-secrets.mjs [dir]` — scans `dir` (default
  // ./dist relative to the demo root) and exits non-zero if ANTHROPIC|OPENAI
  // appears in any file. PRD §4-2.
  const script = p('scripts/gate-secrets.mjs');
  const run = (dir?: string): { code: number; out: string } => {
    try {
      const out = execFileSync('node', dir ? [script, dir] : [script], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { code: 0, out };
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
    }
  };

  let clean = '';
  let dirty = '';
  let deep = '';

  beforeAll(() => {
    clean = mkdtempSync(join(tmpdir(), 'dc-clean-'));
    writeFileSync(join(clean, 'index.html'), '<!doctype html><div id="app"></div>', 'utf8');
    writeFileSync(join(clean, 'app.js'), 'export const mode = "stub";\n', 'utf8');

    dirty = mkdtempSync(join(tmpdir(), 'dc-dirty-'));
    writeFileSync(join(dirty, 'index.html'), '<!doctype html><div id="app"></div>', 'utf8');
    writeFileSync(join(dirty, 'bundle.js'), 'const k="ANTHROPIC_API_KEY";\n', 'utf8');

    deep = mkdtempSync(join(tmpdir(), 'dc-deep-'));
    mkdirSync(join(deep, 'assets', 'nested'), { recursive: true });
    writeFileSync(join(deep, 'index.html'), '<!doctype html>', 'utf8');
    writeFileSync(join(deep, 'assets', 'nested', 'chunk.js'), 'var x = "OPENAI_API_KEY";\n', 'utf8');
  });

  afterAll(() => {
    for (const d of [clean, dirty, deep]) rmSync(d, { recursive: true, force: true });
  });

  it('exists and is executable by node', () => {
    expect(existsSync(script)).toBe(true);
  });

  it('exits 0 on a clean output dir', () => {
    const r = run(clean);
    expect(r.code, r.out).toBe(0);
  });

  it('exits non-zero and names the offending file when ANTHROPIC appears', () => {
    const r = run(dirty);
    expect(r.code, 'should have failed').not.toBe(0);
    expect(r.out).toMatch(/bundle\.js/);
    expect(r.out).toMatch(/ANTHROPIC/);
  });

  it('scans nested subdirectories, not just the top level (OPENAI in assets/nested)', () => {
    const r = run(deep);
    expect(r.code, 'should have failed on a nested file').not.toBe(0);
    expect(r.out).toMatch(/chunk\.js/);
  });

  it('exits non-zero when the target dir is missing (cannot verify ⇒ fail closed)', () => {
    const missing = join(tmpdir(), `dc-nope-${process.pid}`);
    const r = run(missing);
    expect(r.code, 'missing dir must not pass silently').not.toBe(0);
    // …and it must be the script's own diagnostic, not node failing to load it.
    expect(r.out, 'script did not load at all').not.toMatch(/MODULE_NOT_FOUND/);
    expect(r.out).toMatch(/dc-nope|not found|missing|no such/i);
  });

  it('defaults to ./dist so the gate command needs no argument', () => {
    expect(stripComments(readFileSync(script, 'utf8'))).toMatch(/['"`]dist['"`]|['"`]\.\/dist['"`]/);
  });
});
