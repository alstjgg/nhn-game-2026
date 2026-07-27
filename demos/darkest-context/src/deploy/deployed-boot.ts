// The DEPLOYED build's boot (PRD §2.1, INV-2).
//
// `vite.config.ts` declares the AI middleware `apply: 'serve'`, so a production bundle
// physically lacks `/ai/decide`, `/ai/stance` and `/ai/health` — "the deployed Pages
// demo is stub-mode by construction". There is no mode to select: probing would be a
// request that cannot succeed.
//
// WHY THIS MODULE EXISTS AT ALL. `src/ai/boot.ts` reaches the live adapter and the
// health probe through STATIC imports, so anything that imports it carries the three
// route strings into `dist/` — which `tests/ai/contract.test.ts`'s dist gate refuses,
// and rightly: a shipped bundle should not even describe an endpoint it can never call.
// `src/app/boot-app.ts` therefore reaches `bootAdapter` through a `import.meta.env.DEV`
// branch, and this module is the other arm. Mode SELECTION still lives in one place —
// there is simply nothing to select once the proxy cannot exist.
//
// It returns the same `BootState`, so nothing downstream can tell which arm ran (INV-5).

import type { BootOptions, BootState } from '../ai/boot.ts';
import { createFallbackDecider, createStubAdapter } from '../ai/stub.ts';
import { resolveTuningRef } from '../data/loader.ts';

/** The same tuning refs `bootAdapter`'s stub branch reads (INV-8). */
const STUB_TIMEOUT_REF = 'timeout.stub';
const STUB_LATENCY_REF = 'latency.stub';
const GATE_LATENCY_REF = 'latency.unit';

/**
 * u17 adds ONE knob, and it is a duration: `?pace=default` runs the automated gate at
 * the authored `latency.stub` delay instead of the unit-test one. Mode, policy and the
 * skipped probe are untouched — it is the same boot decision, only slower, which is what
 * makes it a legal boot to measure §1-3's "3–5 minutes" rule on.
 */
export interface DeployedBootOptions extends BootOptions {
  readonly defaultPace?: boolean;
}

/**
 * Builds the stub-mode boot state. The policy travels with the mode exactly as it does
 * in `bootAdapter`: an automated gate takes `tieBreak.test` at unit latency, play takes
 * `tieBreak.stub` at stub latency. `index` needs no entropy, so no seed is drawn (INV-6).
 */
export function bootDeployed(options: DeployedBootOptions): Promise<BootState> {
  const { tuning } = options;
  const gated = options.automatedGate === true;
  // u17 `?pace=default`: a gate that watches at authored speed. The POLICY still travels
  // with the mode — only the latency moves.
  const fast = gated && options.defaultPace !== true;

  return Promise.resolve({
    mode: 'stub',
    adapter: createStubAdapter({
      pool: options.pool,
      latencyMs: resolveTuningRef(tuning, fast ? GATE_LATENCY_REF : STUB_LATENCY_REF),
      timeoutMs: resolveTuningRef(tuning, STUB_TIMEOUT_REF),
      bucketConfig: options.bucketConfig,
    }),
    tieBreak: { policy: gated ? tuning.tieBreak.test : tuning.tieBreak.stub },
    seed: options.seed,
    fallbackFor: createFallbackDecider(options.heroes),
  });
}
