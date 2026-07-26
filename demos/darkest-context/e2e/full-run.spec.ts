// full-run.spec.ts — u17, TDD-Red. The DELIVERABLE gate: one settled screenshot per phase
// written to e2e/artifacts/, and the juice pass that makes those frames worth looking at.
//
// Why this file exists at all, in one sentence from apothecary DISCOVERY §2: *the whole
// suite was green while every screenshot was unusable* — every capture caught a
// mid-cross-fade frame, and no functional assertion can catch that, because it is a
// property of the rendered frame and not of the DOM. So the capture is a gate here, and it
// is built on a settle signal rather than on Playwright's notion of "visible" (which
// happily calls an `opacity: 0` element visible).
//
// Test-title filters the unit gate uses (keep these words OUT of every other title):
//   -g screenshots   → the per-phase artifact set
//   -g juice         → the motion pass those frames are the still evidence of
//
// CONTRACT (delta on u15 — the same three seams e2e/must-prove.spec.ts documents):
//   ?gate=1&pace=default                     authored durations, so a settled frame is a
//                                            frame a human would actually have looked at
//   window.__app.turns                       (unused here)
//   [data-testid="app-shell"][data-settled]  "false" while anything inside the screen slot
//                                            is animating or transitioning, "true" after.
//                                            It must be a MEASURED signal, not a timer:
//                                            the third spec below fails a hardcoded "true".
import { expect, test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = resolve(here, 'artifacts');

const GATE = '/?gate=1';
const GATE_DEFAULT_PACE = '/?gate=1&pace=default';

/** One still per phase — the set a judge (and a reviewer) flips through. */
const PHASE_SHOTS = [
  { file: '01-stage.png', screen: 'stage' },
  { file: '02-combat.png', screen: 'combat' },
  { file: '03-training.png', screen: 'training' },
  { file: '04-council.png', screen: 'council' },
  { file: '05-rest.png', screen: 'rest' },
  { file: '06-end.png', screen: 'end' },
] as const;

const T1_FIXED_CARD = 'taunt';
const T4A_DRAFT_CARD = 'grudge';
const T5_DRAFT_CARD = 'dual_slash';

interface AppState {
  phase: string;
  tileId: string;
  visited: string[];
  party: { unitId: string; hp: number }[];
}

/** Read through a cast — u15's run-flow.spec.ts owns the ambient `window.__app`. */
interface AppSeam {
  mounted: string | null;
  state: AppState;
  loadout: Record<string, string[]>;
  drain: () => Promise<void>;
}

declare global {
  interface Window {
    /** Test-side only: every value `[data-settled]` ever held, in order. */
    __settle?: string[];
  }
}

const mounted = (page: Page): Promise<string | null> =>
  page.evaluate(() => (window as unknown as { __app?: AppSeam }).__app?.mounted ?? null);

const drain = (page: Page): Promise<void> =>
  page.evaluate(() => (window as unknown as { __app: AppSeam }).__app.drain());

async function waitForScreen(page: Page, id: string, timeout = 60_000): Promise<void> {
  await expect
    .poll(() => mounted(page), { message: `screen '${id}' never mounted`, timeout })
    .toBe(id);
}

/** Records the whole history of the settle flag — test-side, via addInitScript. */
async function observeSettle(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const history: string[] = [];
    (window as unknown as { __settle: string[] }).__settle = history;
    const push = (value: string | null): void => {
      if (value !== null && history[history.length - 1] !== value) history.push(value);
    };
    new MutationObserver(() => {
      push(document.querySelector('[data-testid="app-shell"]')?.getAttribute('data-settled') ?? null);
      // `document`, not `document.documentElement`: an init script runs before the
      // document element exists, and observing `null` throws.
    }).observe(document, {
      attributes: true,
      attributeFilter: ['data-settled'],
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Waits for the phase to stop moving, then captures. This is the whole point of the
 * file: `toBeVisible()` is true of a frame a human would call blank.
 */
async function captureSettled(page: Page, file: string): Promise<void> {
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-settled', 'true', {
    timeout: 30_000,
  });
  await page.screenshot({ path: join(ARTIFACT_DIR, file) });
}

async function grantCardTo(page: Page, cardId: string, unitId: string): Promise<void> {
  await page.locator(`[data-testid="draft-row"] [data-card-id="${cardId}"]`).click();
  await page.locator(`[data-testid="target-picker"] [data-unit-id="${unitId}"]`).click();
  await page.getByTestId('training-done').click();
}

test.describe('deliverables: the artifact set', () => {
  test.beforeAll(() => {
    // Clear the STILLS, not the directory: `e2e/artifacts/` is a committed, declared
    // destination (its marker file is what makes it reviewable), so a capture run must
    // not delete the thing that declares it.
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    for (const name of readdirSync(ARTIFACT_DIR)) {
      if (name.endsWith('.png')) rmSync(join(ARTIFACT_DIR, name), { force: true });
    }
  });

  test('screenshots: one settled still per phase lands in e2e/artifacts/', async ({ page }) => {
    test.setTimeout(8 * 60_000);
    await observeSettle(page);
    await page.goto(GATE_DEFAULT_PACE);

    // T1 전투 — captured on the SHIPPED page, with decisions actually on screen. The
    // gate boot holds turn 1 until a spec drains it, so the old still was a 턴-1 frame
    // with zero bubbles: the one thing must-prove 2 is about never reached the review
    // set, and the unreadable-bubble regression hid behind that.
    await page.goto('/');
    await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('combat-bubble').nth(1)).toBeVisible({ timeout: 60_000 });
    await captureSettled(page, '02-combat.png');

    await page.goto(GATE_DEFAULT_PACE);
    await waitForScreen(page, 'combat');
    await drain(page);

    // T1 보상 + T2 훈련장.
    await waitForScreen(page, 'training');
    await captureSettled(page, '03-training.png');
    await grantCardTo(page, T1_FIXED_CARD, 'selene');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'translation_lens', 'selene');

    // 전진 / 분기 — the only place the walk screen is held long enough to be read.
    await drain(page);
    await waitForScreen(page, 'stage');
    await captureSettled(page, '01-stage.png');
    await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();

    // T3a 퍼즐 회의 — captured WITH the lens hint on screen, so the still shows the
    // mechanic and not an empty agenda.
    await drain(page);
    await waitForScreen(page, 'council');
    await expect(page.getByTestId('council-hint')).toBeVisible();
    await captureSettled(page, '04-council.png');
    await page.getByTestId('council-done').click();

    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T4A_DRAFT_CARD, 'garrett');
    await drain(page);
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T5_DRAFT_CARD, 'selene');

    // T6 휴식.
    await drain(page);
    await waitForScreen(page, 'rest');
    await captureSettled(page, '05-rest.png');
    await page.getByTestId('rest-option-think').click();
    await page.getByTestId('rest-done').click();

    // T7 → clear.
    await drain(page);
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'end');
    await expect(page.getByTestId('end-screen')).toHaveAttribute('data-result', 'clear');
    await captureSettled(page, '06-end.png');

    for (const { file } of PHASE_SHOTS) {
      const path = join(ARTIFACT_DIR, file);
      expect(existsSync(path), `${file} was never captured`).toBe(true);
      expect(statSync(path).size, `${file} is too small to be a rendered phase`).toBeGreaterThan(
        8 * 1024,
      );
    }
  });

  test('screenshots: the artifact dir holds the phase set and nothing stale', async ({ page }) => {
    // Edge: a green run that silently stopped writing one phase, or left last week's
    // files behind, would still "have screenshots".
    expect(existsSync(ARTIFACT_DIR), 'e2e/artifacts/ must exist as a declared location').toBe(
      true,
    );
    const pngs = readdirSync(ARTIFACT_DIR).filter((name) => name.endsWith('.png'));
    expect(pngs.sort()).toEqual(PHASE_SHOTS.map((shot) => shot.file).sort());

    // Real PNGs at the viewport size, not 1×1 placeholders: read the IHDR header.
    const viewport = page.viewportSize()!;
    for (const { file } of PHASE_SHOTS) {
      const buffer = readFileSync(join(ARTIFACT_DIR, file));
      expect(buffer.subarray(1, 4).toString('latin1'), `${file} is not a PNG`).toBe('PNG');
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      expect(width, `${file} width`).toBeGreaterThanOrEqual(viewport.width);
      expect(height, `${file} height`).toBeGreaterThan(0);
    }
  });

  test('screenshots: the settle flag is measured, not a constant', async ({ page }) => {
    // Drains a whole T1 fight at AUTHORED pace, which is minutes of readable holds by
    // design (§1-3) — the default 30 s budget is a harness limit, not an assertion.
    test.setTimeout(4 * 60_000);
    // The capture gate is only worth anything if `data-settled` actually goes false while
    // a phase is moving. A hardcoded "true" passes every capture above and reproduces the
    // exact apothecary §2 failure, so it is asserted here directly.
    await observeSettle(page);
    await page.goto(GATE_DEFAULT_PACE);
    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-settled', 'true');
    await drain(page);
    await waitForScreen(page, 'training');
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-settled', 'true');

    const history = await page.evaluate(() => window.__settle ?? []);
    expect(
      history.filter((value) => value === 'false').length,
      `[data-settled] never read "false" (history: ${history.join(' → ')}) — a constant ` +
        'flag makes the screenshot gate blind (apothecary DISCOVERY §2)',
    ).toBeGreaterThanOrEqual(2);
    expect(history[history.length - 1]).toBe('true');
  });
});

test.describe('the juice pass', () => {
  test('juice: entering a phase runs a named animation from the juice layer', async ({ page }) => {
    await page.goto(GATE);
    await waitForScreen(page, 'combat');

    // Something in the mounted screen must actually be animating on entry — the
    // "no instant DOM swaps between phases" half of INV-8.
    const animated = await page.evaluate(() => {
      const slot = document.querySelector('[data-testid="screen-slot"]');
      if (slot === null) return [];
      return [slot, ...slot.querySelectorAll('*')]
        .map((node) => getComputedStyle(node).animationName)
        .filter((name) => name !== '' && name !== 'none');
    });
    expect(
      animated.length,
      'no element in the mounted screen carries an animation — phases swap instantly',
    ).toBeGreaterThan(0);

    // And the juice layer is a real stylesheet the build ships, not inline styles.
    const juiceRules = await page.evaluate(() =>
      [...document.styleSheets].flatMap((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText);
        } catch {
          return [];
        }
      }),
    );
    expect(
      juiceRules.some((text) => text.startsWith('@keyframes')),
      'no @keyframes reached the built page',
    ).toBe(true);
  });

  test('juice: prefers-reduced-motion stops the motion and still shows the phase', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await observeSettle(page);
    await page.goto(GATE);
    await waitForScreen(page, 'combat');

    const moving = await page.evaluate(() => {
      const slot = document.querySelector('[data-testid="screen-slot"]');
      if (slot === null) return ['no slot'];
      return [slot, ...slot.querySelectorAll('*')]
        .filter((node) => {
          const style = getComputedStyle(node);
          const duration = parseFloat(style.animationDuration) || 0;
          const transition = parseFloat(style.transitionDuration) || 0;
          return duration > 0.01 || transition > 0.01;
        })
        .map((node) => (node as HTMLElement).className || node.nodeName);
    });
    expect(
      moving,
      'reduced motion must switch the juice layer off (a11y + INV-8 readability)',
    ).toEqual([]);

    // Off, not broken: the phase is on screen and the settle flag still resolves.
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-settled', 'true');
  });
});
