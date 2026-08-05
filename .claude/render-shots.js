#!/usr/bin/env node
//
// P0-B/P0-C reference shot renderer — the design target (docs/design/phase2-ui)
// rendered at the run's viewport, one shot per name u11 compares against.
//
// SETTLE PROTOCOL (pinned 08-04, 민서):
//   install-after-first-paint → tick to a fixed frame.
//   `page.clock.install()` BEFORE `goto` stalls this page's boot (the scanline
//   sweep and the sim clock are both rAF/timer driven and never get their first
//   frame), which is the stall u8 reported. Installing after the first paint
//   lets boot complete, then hands the page a deterministic clock. If install
//   fails at all we fall back to wallclock settle and RECORD which one ran —
//   all ten shots must use ONE protocol, never a mix.
//
// ANIMATION FREEZE: seek-and-pause (negative animation-delay + paused), never
// `animation:none` — several reveals in desktop.css start at opacity:0 and are
// brought in by `animation … both`, so disabling animation hides them entirely.
//
// DEBUG PANE: the reference has none, and a build shot with the pane visible is
// an INVALID shot, not a finding. The build-side renderer must run flag-off.

import fs from 'fs';
import path from 'path';
import http from 'http';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = path.resolve(__dirname, '..');
const DESIGN_DIR = path.join(REPO_ROOT, 'docs/design/phase2-ui');
const SHOTS_DIR = path.join(REPO_ROOT, '.claude/super/reference-shots');

const VIEWPORT = { width: 1280, height: 800 };

// The ten names u11 compares. `after` runs before the shot is taken and may
// drive the page to a later state (only TALLY needs it).
const SHOTS = [
  { name: 'boot-scanline', tick_ms: 400, selector: null, seek_ms: 400 },
  { name: 'shell-desktop-1280x800', tick_ms: 3000, selector: null },
  { name: 'topbar-clock-dday', tick_ms: 3000, selector: '#topbar' },
  { name: 'win-agent-file', tick_ms: 3000, selector: '#w-file' },
  { name: 'win-live-feed', tick_ms: 3000, selector: '#w-feed' },
  { name: 'win-reports', tick_ms: 3000, selector: '#w-rep' },
  { name: 'win-block-store', tick_ms: 3000, selector: '#w-store' },
  // The red thread is drawn at boot (the demo opens with two slotted blocks),
  // so the overlay is captured in context over the desk rather than as a bare
  // transparent SVG — geometry is only meaningful against the windows it pins.
  { name: 'red-thread-overlay', tick_ms: 3000, selector: null },
  // TALLY only exists after the clock reaches 21:04 → endRun() → openWin('tally').
  { name: 'win-tally', tick_ms: 3000, selector: '#w-tally', after: 'runToTally' },
  // …and the count-up settles ~9 s after that.
  { name: 'tally-countup-final', tick_ms: 3000, selector: '#w-tally', after: 'runToTallyFinal' },
];

let server = null;
let PORT = 0;

function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const rel = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(DESIGN_DIR, rel);
      if (!filePath.startsWith(DESIGN_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
        const ext = path.extname(filePath);
        const type = { '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml',
          '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }[ext] || 'text/html';
        res.writeHead(200, { 'Content-Type': type });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => { PORT = server.address().port; resolve(); });
    server.on('error', reject);
  });
}

const closeServer = () => new Promise((r) => (server ? server.close(r) : r()));

/** install-after-first-paint. Returns 'virtual-clock' | 'wallclock'. */
async function bootAndInstallClock(page, shot) {
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
  // First paint must have happened before the clock is swapped out, or boot stalls.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  // ANIMATION FREEZE — seek-and-pause, NOT `animation:none`.
  //
  // `animation:none` looked deterministic and was wrong: desktop.css:574-575 puts
  // `.tly-table tr` at opacity:0 and relies on `animation: rowIn … both` to reveal
  // it, so disabling the animation leaves every tally row invisible. A build shot
  // frozen the same way is invisible in the same way — a false match, the worst
  // kind of capture defect. Seeking past the end with fill-mode intact lands each
  // animation on its true final frame; a negative delay picks the frame.
  const seek = shot && shot.seek_ms != null ? shot.seek_ms : 2000;
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-play-state:paused!important;` +
             `animation-delay:-${seek}ms!important;` +
             `transition-duration:0s!important;transition-delay:0s!important}`,
  });
  try {
    await page.clock.install();
    return 'virtual-clock';
  } catch {
    return 'wallclock';
  }
}

async function advance(page, mode, ms) {
  if (mode === 'virtual-clock') await page.clock.runFor(ms);
  else await page.waitForTimeout(ms);
}

/** Drive the sim clock to 21:04 so endRun() fires and TALLY opens. */
async function runToTally(page, mode) {
  await page.click('.rate-btn[data-rate="4"]').catch(() => {});
  // 13:05 → 21:04 is 479 sim minutes; ×4 at 105 ms/min ≈ 12.6 s. One generous
  // 25 s advance overshot by ~12 s, and the ~9 s count-up completed inside the
  // overshoot — so the "mid" name captured the FINAL frame and the pair came
  // out byte-identical (INT-7). Advance in 1 s slices and stop the moment
  // TALLY opens instead.
  for (let i = 0; i < 20; i++) {
    if (await page.$('#w-tally:not(.hidden)')) break;
    await advance(page, mode, 1000);
  }
  await page.waitForSelector('#w-tally:not(.hidden)', { timeout: 15000 });
  // 2.5 s into the 500 ms + rows×640 ms count-up (app.js runTally): some
  // ledger rows revealed, some still to come — a genuinely mid frame.
  await advance(page, mode, 2500);
}

async function renderShot(page, shot, mode) {
  if (shot.after === 'runToTally' || shot.after === 'runToTallyFinal') {
    await runToTally(page, mode);
    // the count-up is 500 + rows*640 ms (app.js runTally); ~9 s covers it
    if (shot.after === 'runToTallyFinal') await advance(page, mode, 11000);
  } else {
    await advance(page, mode, shot.tick_ms);
  }
  const out = path.join(SHOTS_DIR, `${shot.name}.png`);
  if (shot.selector) {
    const el = await page.$(shot.selector);
    if (!el) throw new Error(`selector ${shot.selector} not found for ${shot.name}`);
    await el.screenshot({ path: out });
  } else {
    await page.screenshot({ path: out, fullPage: false });
  }
  return out;
}

async function main() {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  let settle = 'unknown';
  const done = [];
  const failed = [];
  try {
    await startServer();
    const browser = await chromium.launch();
    for (const shot of SHOTS) {
      // Fresh page per shot: the TALLY shots mutate run state irreversibly, and a
      // shared page would leak that state into every shot rendered after them.
      const page = await browser.newPage({ viewport: VIEWPORT });
      try {
        const mode = await bootAndInstallClock(page, shot);
        if (settle === 'unknown') settle = mode;
        else if (settle !== mode) throw new Error(`settle protocol drifted: ${settle} → ${mode}`);
        await renderShot(page, shot, mode);
        done.push(shot.name);
        console.log(`  ✓ ${shot.name} (${mode})`);
      } catch (err) {
        failed.push({ name: shot.name, reason: err.message });
        console.error(`  ✗ ${shot.name}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
    await browser.close();
    const result = { ok: failed.length === 0, shots: done, failed, dir: SHOTS_DIR, settle };
    console.log('\n' + JSON.stringify(result, null, 2));
  } finally {
    await closeServer();
  }
}

main();
