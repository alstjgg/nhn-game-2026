// Build-surface gate (PR #33, R2 on vite.config.ts:29). The e2e harness pages
// install internal hooks and are driven by URL parameters, so they must exist for
// the Playwright gate and NOWHERE else — publishing them puts a parameter-driven
// build of the game (including "freeze generation forever" states) next to the
// judged demo on the Pages site.
//
// Behavioural, not a source grep: it calls the rule vite.config.ts calls.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  HARNESS_INPUTS,
  MAIN_INPUT,
  resolveBuildInputs,
} from '../../vite.build-inputs.ts';

const demoRoot = resolve(import.meta.dirname, '../..');

describe('build inputs — the deployed artifact is the demo home alone', () => {
  it('a plain build (no E2E flag) emits only index.html', () => {
    expect(resolveBuildInputs({})).toEqual({ main: './index.html' });
    expect(resolveBuildInputs({ E2E: undefined })).toEqual(MAIN_INPUT);
    expect(resolveBuildInputs({ E2E: '0' })).toEqual(MAIN_INPUT);
    expect(resolveBuildInputs({ CI: 'true' })).toEqual(MAIN_INPUT);
  });

  it('E2E=1 adds every harness page the specs goto', () => {
    const inputs = resolveBuildInputs({ E2E: '1' });
    expect(Object.keys(inputs).sort()).toEqual(
      ['main', ...Object.keys(HARNESS_INPUTS)].sort(),
    );
    for (const [name, path] of Object.entries(HARNESS_INPUTS)) {
      expect(inputs[name], `${name} harness input`).toBe(path);
    }
  });

  it('no harness input is ever a plain-build input (no leak by aliasing)', () => {
    const plain = Object.values(resolveBuildInputs({}));
    for (const path of Object.values(HARNESS_INPUTS)) {
      expect(plain, `${path} must not be in a plain build`).not.toContain(path);
    }
  });

  it('the playwright webServer really builds with the flag', () => {
    const config = readFileSync(resolve(demoRoot, 'playwright.config.ts'), 'utf8');
    expect(config, 'playwright must build the harness pages it navigates to').toMatch(
      /E2E=1\s+npm run build/,
    );
  });
});
