// TDD-Red contract for u17 — the SHIP deliverables that are files, not screens.
//
// Everything here is pure text/JSON analysis (vitest node env): the assembled
// DISCOVERY.md, the human live-smoke checklist, the juice stylesheet, and the ship
// wiring in package.json. Anything that needs a rendered box lives in
// e2e/must-prove.spec.ts / e2e/full-run.spec.ts.
//
// What this unit must add:
//   · demos/darkest-context/DISCOVERY.md   assembled from every discovery/*.md fragment,
//                                          plus the spectating observation PRD §7 asks for
//   · src/styles/juice.css                 the motion layer, imported once, reduced-motion
//                                          aware
//   · e2e/artifacts/                       the declared home of the screenshot set
//   · e2e/live-smoke.md                    finalised as the PRE-BAKE-OFF checklist: it runs
//                                          AFTER the automated gates are green, and says so
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '..', '..'); // demos/darkest-context/

const p = (rel: string) => resolve(demo, rel);
const read = (rel: string): string => readFileSync(p(rel), 'utf8');

const DISCOVERY = 'DISCOVERY.md';
const FRAGMENT_DIR = 'discovery';
const LIVE_SMOKE = 'e2e/live-smoke.md';
const JUICE = 'src/styles/juice.css';
const ARTIFACTS = 'e2e/artifacts';

const fragmentIds = (): string[] =>
  readdirSync(p(FRAGMENT_DIR))
    .filter((name) => /^u\d+\.md$/.test(name))
    .map((name) => name.replace(/\.md$/, ''))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

// ─────────────────────────── DISCOVERY.md — the assembled log ──────────────────────────

describe('DISCOVERY.md is assembled from every fragment', () => {
  it('exists at the demo root', () => {
    expect(existsSync(p(DISCOVERY)), `${DISCOVERY} is a first-class deliverable (PRD §7)`).toBe(
      true,
    );
  });

  it('names every discovery/*.md fragment', () => {
    const text = read(DISCOVERY);
    const ids = fragmentIds();
    expect(ids.length, 'the fragments themselves must exist').toBeGreaterThan(0);
    for (const id of ids) {
      expect(text, `${id} is missing from ${DISCOVERY}`).toMatch(new RegExp(`\\b${id}\\b`));
    }
  });

  it('carries the fragments’ content, not just a list of links', () => {
    const text = read(DISCOVERY);
    const fragmentBytes = fragmentIds().reduce(
      (total, id) => total + statSync(p(join(FRAGMENT_DIR, `${id}.md`))).size,
      0,
    );
    // A link index would be a few hundred bytes against ~90 KB of fragments.
    expect(
      Buffer.byteLength(text, 'utf8'),
      'DISCOVERY.md reads as an index, not an assembly of the fragments',
    ).toBeGreaterThan(fragmentBytes * 0.4);
  });

  it('records the spectating observation about a persistent 100-gauge unit', () => {
    const text = read(DISCOVERY);
    // PRD §7 names this observation explicitly; it is the one finding that comes from
    // watching the demo rather than from building it.
    const heading = text.split('\n').find((line) => /^#{2,4}.*100/.test(line));
    expect(heading, 'no DISCOVERY.md section headline mentions the 100 gauge').toBeTruthy();

    const start = text.indexOf(heading!);
    const rest = text.slice(start + heading!.length);
    const body = rest.split(/\n#{2,4} /)[0];
    expect(body, 'the 100-gauge section must talk about the gauge/overload state').toMatch(
      /gauge|게이지|overload|과부하/i,
    );
    expect(body.trim().length, 'the observation must be written out, not stubbed').toBeGreaterThan(
      200,
    );
  });

  it('logs this unit’s own read-scope gaps as a fragment too', () => {
    expect(existsSync(p(join(FRAGMENT_DIR, 'u17.md'))), 'discovery/u17.md is missing').toBe(true);
  });
});

// ───────────────────────── live-smoke.md — the human pre-bake-off pass ─────────────────

describe('live-smoke.md is the human pre-bake-off checklist', () => {
  it('exists and is never picked up as an automated spec', () => {
    expect(existsSync(p(LIVE_SMOKE))).toBe(true);
    // testDir is ./e2e, so a .md sitting there must stay a document.
    expect(LIVE_SMOKE.endsWith('.md')).toBe(true);
  });

  it('covers every live must-prove PRD §5 lists', () => {
    const text = read(LIVE_SMOKE);
    const boxes = text.match(/^\s*- \[ \]/gm) ?? [];
    expect(boxes.length, 'a checklist needs unchecked boxes to tick').toBeGreaterThanOrEqual(6);

    for (const topic of [
      /because/i, // live decisions with because chips
      /gauge|게이지/i, // gauge-noise turn
      /fallback|폴백|degrad/i, // silent stub fallback on network kill
      /ANTHROPIC|secret|키/i, // bundle stays clean
    ]) {
      expect(text, `live-smoke.md never mentions ${topic}`).toMatch(topic);
    }
  });

  it('states that the automated gates come first', () => {
    // "pre-bake-off" is an ordering claim: a human walks this only once the stub-mode
    // suite is green, so the file has to name that prerequisite.
    const text = read(LIVE_SMOKE);
    expect(text, 'no prerequisite section').toMatch(/prerequisite|사전|before/i);
    expect(
      text,
      'the checklist must name the automated gate it runs after (npm run test:e2e)',
    ).toMatch(/npm run test:e2e/);
  });

  it('has a result table a runner signs', () => {
    const text = read(LIVE_SMOKE);
    expect(text).toMatch(/\|\s*-{3,}/); // a markdown table
    expect(text).toMatch(/PASS/);
    expect(text).toMatch(/Runner|실행자/i);
  });
});

// ───────────────────────────────── the juice layer ─────────────────────────────────────

describe('juice.css is a real, reduced-motion-aware layer', () => {
  it('exists', () => {
    expect(existsSync(p(JUICE)), `${JUICE} is the unit's motion pass`).toBe(true);
  });

  it('is imported exactly once from src/', () => {
    const importers: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|css)$/.test(entry.name) && readFileSync(full, 'utf8').includes('juice.css')) {
          importers.push(full);
        }
      }
    };
    walk(p('src'));
    // The file itself never counts.
    const external = importers.filter((file) => resolve(file) !== p(JUICE));
    expect(
      external.length,
      `juice.css must be imported once (found: ${external.join(', ') || 'nowhere'})`,
    ).toBe(1);
  });

  it('declares its own keyframes rather than re-using the u2 vocabulary', () => {
    const juice = read(JUICE);
    const names = [...juice.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    expect(names.length, 'a juice pass with no keyframes is not a juice pass').toBeGreaterThanOrEqual(
      3,
    );
    const existing = [...read('src/styles/animations.css').matchAll(/@keyframes\s+([\w-]+)/g)].map(
      (m) => m[1],
    );
    for (const name of names) {
      expect(existing, `@keyframes ${name} already exists in animations.css`).not.toContain(name);
    }
  });

  it('turns itself off under prefers-reduced-motion', () => {
    const juice = read(JUICE);
    expect(juice, 'no reduced-motion block').toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('adds no game-logic timing of its own (INV-6)', () => {
    // A stylesheet cannot hold a setTimeout, but the pass that adds it can leak one into
    // the module that imports it; this is the cheap guard that it did not.
    const juice = read(JUICE);
    expect(juice).not.toMatch(/setTimeout|requestAnimationFrame/);
  });
});

// ───────────────────────────────── ship wiring ─────────────────────────────────────────

describe('ship wiring', () => {
  it('keeps every gate command the definition of done names', () => {
    const pkg = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    for (const script of ['build', 'test', 'test:e2e', 'typecheck', 'gate:secrets']) {
      expect(pkg.scripts?.[script], `package.json script '${script}' is missing`).toBeTruthy();
    }
  });

  it('ships no runtime dependency — no engine, no framework (INV-8)', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([]);
  });

  it('declares e2e/artifacts/ as the screenshot home', () => {
    // The directory alone proves nothing — a Playwright run creates it as a side effect.
    // A committed marker is what makes it a DECLARED destination a reviewer can find.
    const marker = ['.gitkeep', 'README.md'].find((name) => existsSync(p(join(ARTIFACTS, name))));
    expect(
      marker,
      'e2e/artifacts/ needs a committed .gitkeep or README.md so the screenshot set has a ' +
        'declared, reviewable home (PRD §7 deliverables)',
    ).toBeTruthy();
  });
});
