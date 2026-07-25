// Single-page entry + BOOT WIRING (PRD §2.1/§2.3). It owns exactly the two
// decisions the app shell must not make for itself:
//
//   1. WHICH ADAPTER. `createBootAdapter` probes the dev-proxy's health and takes
//      the live adapter only when it answers ok. Production ships no middleware
//      (the proxy plugin is `apply: 'serve'`), so a built demo must not even ask:
//      the probe is dev-only, which makes the deployed Pages build stub-mode by
//      construction — no request, no secrets, no failed fetch in the console.
//      The resulting instance is injected ONCE and shared by the whole app; no
//      screen ever builds its own.
//   2. HOW LONG THE SHOP WAITS. Deadlines are data. The live spec is 25s, but a
//      judge playing the deployed stub build must never be parked that long, so
//      boot hands the shell the stub deadline instead — same code path, same
//      door-idle beat, shorter fence. The canned adapter's simulated generation
//      cost comes from the same data file, so the deployed build plays the real
//      async choreography instead of pretending generation is instant.
//
// No routing — phases are animated DOM states inside #app (the app shell's job).
import { probeHealth } from './ai/adapter.ts';
import { createBootAdapter } from './ai/boot.ts';
import { createRealClock } from './pipeline/clock.ts';
import { mountApp } from './app/index.ts';
import { LIVE_DEADLINE_MS, SIMULATED_GENERATION_MS, STUB_DEADLINE_MS } from './app/roster.ts';

async function boot(container: HTMLElement): Promise<void> {
  const adapter = await createBootAdapter({
    probe: import.meta.env.DEV ? probeHealth : () => Promise.resolve(null),
    stubConfig: { latencyMs: SIMULATED_GENERATION_MS },
  });
  mountApp(container, {
    adapter,
    clock: createRealClock(),
    generatedDeadlineMs: adapter.mode === 'live' ? LIVE_DEADLINE_MS : STUB_DEADLINE_MS,
  });
}

const app = document.getElementById('app');
if (app) {
  void boot(app);
}
