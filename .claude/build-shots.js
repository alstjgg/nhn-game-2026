#!/usr/bin/env node
//
// P0-B BUILD-side shot renderer — the same ten names as .claude/render-shots.js,
// rendered from the running client so the comparison is like-for-like.
//
// It MUST mirror the reference protocol exactly (C14), or the diff is noise:
//   · SETTLE  install-after-first-paint → virtual clock. Installing before goto
//             stalls boot and yields a BLACK frame — that is what the old
//             after-wave-1 shots on #110 actually captured.
//   · FREEZE  seek-and-pause, never `animation:none` (which hides every
//             `animation … both` reveal and produces a false match).
//   · PANE    the debug pane is hidden for every shot. The reference has none, so
//             a shot with the pane visible is an invalid shot, not a finding.
//
// HOST: `npm run dev`. Fixtures are DEV-only by design (demo-run.ts returns null
// when !import.meta.env.DEV; inv 11 / §5.4), so the fixture round cannot be
// captured from a player build — C5(d) puts P0-B captures on the dev host.

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = process.env.SHOT_OUT || path.join(REPO_ROOT, '.claude/super/build-shots');
const BASE = process.env.SHOT_URL || 'http://localhost:4321/nhn-game-2026/';
const VIEWPORT = { width: 1280, height: 800 };

const SHOTS = [
  { name: 'boot-scanline', tick_ms: 400, selector: null, seek_ms: 400 },
  { name: 'shell-desktop-1280x800', tick_ms: 3000, selector: null },
  { name: 'topbar-clock-dday', tick_ms: 3000, selector: '#topbar' },
  { name: 'win-agent-file', tick_ms: 3000, selector: '#w-file' },
  { name: 'win-live-feed', tick_ms: 3000, selector: '#w-feed' },
  { name: 'win-reports', tick_ms: 3000, selector: '#w-rep' },
  { name: 'win-block-store', tick_ms: 3000, selector: '#w-store' },
  { name: 'red-thread-overlay', tick_ms: 3000, selector: null },
  { name: 'win-tally', tick_ms: 3000, selector: '#w-tally', after: 'runToTally' },
  { name: 'tally-countup-final', tick_ms: 3000, selector: '#w-tally', after: 'runToTallyFinal' },
];

async function boot(page, shot) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const seek = shot.seek_ms != null ? shot.seek_ms : 2000;
  await page.addStyleTag({
    content:
      `*,*::before,*::after{animation-play-state:paused!important;` +
      `animation-delay:-${seek}ms!important;` +
      `transition-duration:0s!important;transition-delay:0s!important}` +
      // pane suppression is capture-side only; the build itself is untouched
      `#debug-pane,.debug-pane{display:none!important}`,
  });
  let mode = 'wallclock';
  // The build boots PAUSED (boot.ts:108 `driver.clock.setRate(0)`) and pumps via
  // rAF, so page.clock cannot drive it — the rate control is the only lever.
  if (!process.env.SHOT_WALLCLOCK) {
    try { await page.clock.install(); mode = 'virtual-clock'; } catch { /* keep wallclock */ }
  }
  return { mode, errors };
}

const advance = (page, mode, ms) =>
  mode === 'virtual-clock' ? page.clock.runFor(ms) : page.waitForTimeout(ms);

async function runToTally(page, mode) {
  await page.click('.rate-btn[data-rate="4"]').catch(() => {});
  await advance(page, mode, 30000);
  await page.waitForSelector('#w-tally:not(.hidden)', { timeout: 15000 });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const done = [], failed = [], pageErrors = [];
  let settle = 'unknown';
  for (const shot of SHOTS) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    try {
      const { mode, errors } = await boot(page, shot);
      if (settle === 'unknown') settle = mode;
      if (shot.after) {
        await runToTally(page, mode);
        if (shot.after === 'runToTallyFinal') await advance(page, mode, 11000);
      } else {
        await advance(page, mode, shot.tick_ms);
      }
      // A window count is the cheap guard against silently shooting a stalled boot.
      const mounted = await page.evaluate(() => document.querySelectorAll('.win').length);
      if (mounted < 5 && shot.name !== 'boot-scanline') {
        throw new Error(`only ${mounted}/5 windows mounted — boot did not complete`);
      }
      const out = path.join(OUT_DIR, `${shot.name}.png`);
      if (shot.selector) {
        const el = await page.$(shot.selector);
        if (!el) throw new Error(`selector ${shot.selector} not found`);
        await el.screenshot({ path: out });
      } else {
        await page.screenshot({ path: out, fullPage: false });
      }
      if (errors.length) pageErrors.push({ shot: shot.name, errors });
      done.push(shot.name);
      console.log(`  ✓ ${shot.name} (${mode}, ${mounted} windows)`);
    } catch (err) {
      failed.push({ name: shot.name, reason: err.message });
      console.error(`  ✗ ${shot.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
  console.log('\n' + JSON.stringify({ ok: !failed.length, shots: done, failed, pageErrors, settle, dir: OUT_DIR }, null, 2));
}

main();
