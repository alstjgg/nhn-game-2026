// u2 TDD-Red — deterministic overlap predicate + purity guarantees.
// Covers AC7 (due-true), AC8 (due-false cases), AC9 (repeat-call determinism + banned-identifier
// grep), AC10 (no DOM/Node-I/O imports in src/state — source scan).
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { isOutcomeDue } from '../../src/state/index';
import type { OverlapState, Phase } from '../../src/state/index';

const os = (customer1OutcomePending: boolean, customer2Phase: Phase): OverlapState => ({
  customer1OutcomePending,
  customer2Phase,
});

describe('AC7 — overlap due-true: C1 outcome pending AND C2 has entered conversation', () => {
  it('is true when C1 pending and C2 is in conversation (the signature trigger)', () => {
    expect(isOutcomeDue(os(true, 'conversation'))).toBe(true);
  });

  it("stays true once C2 has advanced past conversation while C1 is still pending (level-triggered 'has begun')", () => {
    // D5: "conversation has begun" is level-triggered (>=), not a strict equality on the phase.
    expect(isOutcomeDue(os(true, 'crafting'))).toBe(true);
    expect(isOutcomeDue(os(true, 'handover'))).toBe(true);
    expect(isOutcomeDue(os(true, 'outcome'))).toBe(true);
  });
});

describe('AC8 — overlap due-false', () => {
  it('is false while C2 is still in entrance (conversation not begun)', () => {
    expect(isOutcomeDue(os(true, 'entrance'))).toBe(false);
  });

  it('is false when C1 outcome is not pending / already delivered, even in conversation', () => {
    expect(isOutcomeDue(os(false, 'conversation'))).toBe(false);
  });

  it('is false when C2 is past conversation but the outcome was already delivered', () => {
    expect(isOutcomeDue(os(false, 'crafting'))).toBe(false);
    expect(isOutcomeDue(os(false, 'outcome'))).toBe(false);
  });

  it('is false when nothing pending and C2 still in entrance', () => {
    expect(isOutcomeDue(os(false, 'entrance'))).toBe(false);
  });
});

describe('AC9 — determinism: identical inputs always return identical results', () => {
  it('repeated calls with the same input agree (true case)', () => {
    const input = os(true, 'conversation');
    const first = isOutcomeDue(input);
    const second = isOutcomeDue(input);
    expect(first).toBe(second);
    expect(first).toBe(true);
  });

  it('repeated calls with the same input agree (false case)', () => {
    const input = os(false, 'conversation');
    expect(isOutcomeDue(input)).toBe(isOutcomeDue(input));
    expect(isOutcomeDue(input)).toBe(false);
  });
});

// ---- source-scan guards (AC9 banned identifiers, AC10 purity) ----

const here = dirname(fileURLToPath(import.meta.url));
const stateDir = resolve(here, '../../src/state'); // demos/apothecary/src/state

function collectTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('AC9 — no non-deterministic identifiers in src/state (grep)', () => {
  const banned = ['Date.now', 'performance.now', 'setTimeout', 'setInterval', 'Math.random'];

  it('src/state contains .ts source to scan', () => {
    expect(collectTsFiles(stateDir).length).toBeGreaterThan(0);
  });

  it('no source file references a wall-clock/timer/random API', () => {
    for (const file of collectTsFiles(stateDir)) {
      const src = readFileSync(file, 'utf8');
      for (const bad of banned) {
        expect(src.includes(bad), `${file} references ${bad}`).toBe(false);
      }
    }
  });
});

describe('AC10 — purity: src/state imports no DOM / browser / Node-I/O modules', () => {
  const bannedModules = [
    /from\s+['"]node:fs['"]/,
    /from\s+['"]node:path['"]/,
    /from\s+['"]fs['"]/,
    /from\s+['"]path['"]/,
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
  ];

  it('no source file touches DOM globals or Node I/O modules', () => {
    for (const file of collectTsFiles(stateDir)) {
      const src = readFileSync(file, 'utf8');
      for (const pattern of bannedModules) {
        expect(pattern.test(src), `${file} matches forbidden ${pattern}`).toBe(false);
      }
    }
  });
});
