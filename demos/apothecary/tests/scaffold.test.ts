// Scaffold invariant tests for apothecary demo unit u1.
// TDD-Red: these assert the frozen scaffold constraints (PRD §2 + demo contract).
// Pure file/config checks — no DOM (DOM smoke lives in e2e/smoke.spec.ts).
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // demos/apothecary/

const p = (rel: string) => resolve(root, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');
// Strip // line- and /* */ block-comments so JSON-with-comments (tsconfig) parses.
const stripJsonComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('scaffold: required files exist', () => {
  const required = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'index.html',
    'src/main.ts',
    '.gitignore',
  ];
  for (const f of required) {
    it(`has ${f}`, () => {
      expect(existsSync(p(f)), `missing ${f}`).toBe(true);
    });
  }
});

describe('package.json: scripts, module type, deps', () => {
  const pkg = () => JSON.parse(read('package.json')) as Record<string, any>;

  it('is an ESM package (type: module)', () => {
    expect(pkg().type).toBe('module');
  });

  it('exposes dev / build / preview scripts (contract build interface)', () => {
    const s = pkg().scripts ?? {};
    expect(s.dev, 'scripts.dev').toBeTruthy();
    expect(s.build, 'scripts.build').toBeTruthy();
    expect(s.preview, 'scripts.preview').toBeTruthy();
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

  it('installs NO game engine / UI framework (PRD invariant #3)', () => {
    const dev = { ...(pkg().dependencies ?? {}), ...(pkg().devDependencies ?? {}) };
    const banned = ['react', 'react-dom', 'vue', 'svelte', '@angular/core', 'phaser', 'pixi.js', 'three', '@babylonjs/core'];
    for (const name of banned) {
      expect(dev[name], `banned dependency present: ${name}`).toBeUndefined();
    }
  });
});

describe('tsconfig.json: strict mode', () => {
  it('sets compilerOptions.strict = true (PRD §2, frozen)', () => {
    const cfg = JSON.parse(stripJsonComments(read('tsconfig.json'))) as any;
    expect(cfg.compilerOptions?.strict).toBe(true);
  });
});

describe('vite.config.ts: subpath-safe base', () => {
  it("sets base: './' so dist works under a Pages subpath (frozen)", () => {
    const src = read('vite.config.ts');
    expect(src).toMatch(/base\s*:\s*['"]\.\/['"]/);
  });

  it("does NOT hardcode the repo-name base ('/nhn-game-2026/') like the root", () => {
    expect(read('vite.config.ts')).not.toMatch(/\/nhn-game-2026\//);
  });
});

describe('playwright.config.ts: chromium-only, headless', () => {
  const src = () => read('playwright.config.ts');

  it('targets chromium', () => {
    expect(src()).toMatch(/chromium|Desktop Chrome/i);
  });

  it('does NOT enable firefox or webkit (chromium only, frozen)', () => {
    expect(src()).not.toMatch(/firefox|webkit/i);
  });

  it('does NOT force headed mode (headless, frozen)', () => {
    expect(src()).not.toMatch(/headless\s*:\s*false/);
  });

  it('points testDir at e2e/', () => {
    expect(src()).toMatch(/testDir\s*:\s*['"][.\/]*e2e['"]?/);
  });
});

describe('index.html: single-page mount point', () => {
  const html = () => read('index.html');

  it('has the #app root element the smoke test renders into', () => {
    expect(html()).toMatch(/id\s*=\s*["']app["']/);
  });

  it('loads src/main.ts as an ES module', () => {
    expect(html()).toMatch(/<script[^>]*type\s*=\s*["']module["'][^>]*main\.ts/);
  });
});

describe('src/main.ts: minimal single-page entry', () => {
  const main = () => read('src/main.ts');

  it('targets the #app root element', () => {
    expect(main()).toMatch(/getElementById\(\s*['"]app['"]\s*\)|querySelector\(\s*['"]#app['"]\s*\)/);
  });

  it('writes into the DOM (renders something, not an empty entry)', () => {
    expect(main()).toMatch(/innerHTML|appendChild|textContent|insertAdjacentHTML|createElement/);
  });
});

describe('.gitignore: build + deps ignored', () => {
  const gi = () => read('.gitignore');
  it('ignores node_modules', () => {
    expect(gi()).toMatch(/(^|\n)\s*node_modules\s*(\n|$)/);
  });
  it('ignores dist', () => {
    expect(gi()).toMatch(/(^|\n)\s*dist\s*(\n|$)/);
  });
});
