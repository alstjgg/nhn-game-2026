// u3 — INV-6 grep guard (TDD-Red). Covers AC3.
//
// PRD §4-6: "Math.random appears in exactly one place — seed creation — and
// nowhere else (grep-able)." This file IS that grep, wired to the build: a
// second occurrence anywhere under src/ fails the suite.
//
// Pure filesystem scan — imports nothing from src/, so it also fails loudly if
// src/core/rng.ts is missing entirely.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..'); // demos/darkest-context/
const RNG_MODULE = 'src/core/rng.ts';

// Comments are stripped before scanning so that the JSDoc on createSeed may name
// the invariant ("the only Math.random in src/**") without becoming a second hit.
// The scan is about executable code, not prose.
const stripComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

// Inlined walker (not a shared helper): this guard and the AC2b guard in
// tiebreak.test.ts must not share a single file whose edit disarms both.
const walk = (dir: string): string[] => {
  let out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (/\.(ts|tsx|mts)$/.test(e.name)) out.push(full);
  }
  return out;
};

const rel = (file: string): string => relative(root, file).split('\\').join('/');
const countMatches = (text: string, re: RegExp): number => text.match(re)?.length ?? 0;

const srcFiles = walk(join(root, 'src'));

describe('AC3: Math.random has exactly one site in src/**', () => {
  it('found source files to scan (guard is not vacuously green)', () => {
    expect(srcFiles.length, 'no .ts files under src/ — nothing was scanned').toBeGreaterThan(0);
  });

  it('src/core/rng.ts exists — the one legal site', () => {
    expect(existsSync(join(root, RNG_MODULE)), `missing ${RNG_MODULE}`).toBe(true);
  });

  it('yields exactly one occurrence across all of src/**', () => {
    const hits: string[] = [];
    let total = 0;
    for (const file of srcFiles) {
      const n = countMatches(stripComments(readFileSync(file, 'utf8')), /Math\s*\.\s*random/g);
      if (n > 0) {
        total += n;
        hits.push(`${rel(file)} (${n})`);
      }
    }
    expect(total, `Math.random occurrences: ${hits.join(', ') || 'none'}`).toBe(1);
  });

  it('that occurrence lives in src/core/rng.ts', () => {
    const offenders = srcFiles
      .filter((f) => rel(f) !== RNG_MODULE)
      .filter((f) => /Math\s*\.\s*random/.test(stripComments(readFileSync(f, 'utf8'))))
      .map(rel);
    expect(offenders, `Math.random outside ${RNG_MODULE}: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('AC3: the one occurrence is inside the createSeed body', () => {
  const source = (): string => stripComments(readFileSync(join(root, RNG_MODULE), 'utf8'));

  const createSeedBody = (): string => {
    const src = source();
    const start = src.search(/export\s+function\s+createSeed\b/);
    expect(start, 'no `export function createSeed` declaration in src/core/rng.ts').toBeGreaterThan(
      -1,
    );
    const end = src.indexOf('\n}', start);
    expect(end, 'createSeed body has no column-0 closing brace').toBeGreaterThan(start);
    return src.slice(start, end);
  };

  it('createSeed contains the Math.random call', () => {
    expect(createSeedBody()).toMatch(/Math\s*\.\s*random/);
  });

  it('nothing at module scope calls Math.random (modules stay side-effect-free)', () => {
    const src = source();
    const body = createSeedBody();
    const outside = src.replace(body, '');
    expect(outside, 'Math.random appears outside createSeed in rng.ts').not.toMatch(
      /Math\s*\.\s*random/,
    );
  });

  it('createSeed draws from Math.random only — no Date.now, no crypto, no performance clock', () => {
    const body = createSeedBody();
    expect(body, 'createSeed mixes in Date.now').not.toMatch(/Date\s*\.\s*now/);
    expect(body, 'createSeed mixes in a performance clock').not.toMatch(/performance\s*\.\s*now/);
    expect(body, 'createSeed uses crypto').not.toMatch(/crypto/i);
  });
});

describe('AC3: no alternative entropy source sneaks in', () => {
  it('crypto.getRandomValues appears nowhere in src/**', () => {
    const offenders = srcFiles
      .filter((f) => /getRandomValues|randomUUID/.test(stripComments(readFileSync(f, 'utf8'))))
      .map(rel);
    expect(offenders, `web-crypto entropy in: ${offenders.join(', ')}`).toEqual([]);
  });

  it('node:crypto is never imported in src/**', () => {
    const offenders = srcFiles
      .filter((f) => /from\s+['"](node:)?crypto['"]/.test(stripComments(readFileSync(f, 'utf8'))))
      .map(rel);
    expect(offenders, `node:crypto imported in: ${offenders.join(', ')}`).toEqual([]);
  });
});
