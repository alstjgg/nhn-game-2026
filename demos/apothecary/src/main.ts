// Single-page entry + BOOT WIRING (PRD §2.1/§2.3). It owns exactly the two
// decisions the app shell must not make for itself:
//
//   1. WHICH ADAPTER. `createBootAdapter` probes the dev-proxy's health and takes
//      the live adapter only when it answers ok and advertises dialogue support.
//      Local Lambda mode reaches AWS through Vite's same-origin proxy. A Pages
//      build opts into the deployed endpoint with VITE_AI_BASE_URL; builds with
//      no endpoint remain stub-only and make no request.
//      The health decision runs behind a deferred adapter so the first entrance
//      paints immediately; a cold start can never leave a blank page. The
//      bundled stub is validated synchronously before that mount, so malformed
//      static data still fails loudly instead of becoming a silent fallback.
//      After validation, network/live failures select that known-good stub. The
//      resulting selected instance is injected ONCE and shared by the whole app.
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
import { createDeferredAdapter } from './ai/deferred.ts';
import { createRealClock } from './pipeline/clock.ts';
import { mountApp } from './app/index.ts';
import { LIVE_DEADLINE_MS, SIMULATED_GENERATION_MS, STUB_DEADLINE_MS } from './app/roster.ts';

function boot(container: HTMLElement): void {
  const liveEndpointConfigured =
    import.meta.env.DEV || Boolean(import.meta.env.VITE_AI_BASE_URL);
  const selected = createBootAdapter({
    probe: liveEndpointConfigured ? probeHealth : () => Promise.resolve(null),
    stubConfig: {
      latencyMs: liveEndpointConfigured
        ? { dialogueMs: 0, portraitMs: 0 }
        : SIMULATED_GENERATION_MS,
    },
  });
  const adapter = createDeferredAdapter(selected);
  mountApp(container, {
    adapter,
    clock: createRealClock(),
    // A prefetch started while health is still pending must outlive the probe.
    // Offline production keeps the authored short deadlines and choreography.
    ...(liveEndpointConfigured ? { deadlineMs: LIVE_DEADLINE_MS } : {}),
    generatedDeadlineMs: liveEndpointConfigured ? LIVE_DEADLINE_MS : STUB_DEADLINE_MS,
  });
}

const app = document.getElementById('app');
if (app) {
  boot(app);
}
