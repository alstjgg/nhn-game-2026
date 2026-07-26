// u15 — the composition root (PRD §2.2, §2.4).
//
// ONE decision, ONE time: `bootAdapter` picks the adapter mode and the tie-break policy
// together, and this is its only call site in `src/**`. Nothing downstream re-probes,
// re-picks or re-boots — 재시작 replays the RUN, never the boot.
//
// Order matters and is the whole file:
//   ① claim the screen ids on the u1 registry, ② boot the adapter, ③ build the run
//   context, ④ hand it to the director, ⑤ start.
//
// The shell is already up when this runs (`src/main.ts` mounts it and hands over its
// slot): a boot that has to wait for `/ai/health` to time out must not leave the page
// blank while it does (PRD §1-3).

import decisionsRaw from '../../data/decisions.json';
import type { BootState } from '../ai/boot.ts';
// u16's asset pack (src/styles/assets.css) rides in on this import. Nothing here uses
// the module's exports — the composition root is simply the one place in `src/**`
// guaranteed to be in every real page load, so it is where the pack's CSS actually
// reaches the shipped app instead of only the unit's own e2e harness.
import '../assets/slots.ts';
import { bootDeployed } from '../deploy/deployed-boot.ts';
import type { DeployedBootOptions } from '../deploy/deployed-boot.ts';
import type { Hero } from '../data/schema.ts';
import { loadBundledGameData } from '../data/loader.ts';

import { createDirector } from './director.ts';
import { createGameContext, BUCKET_CONFIG } from './game-context.ts';
import { publishGateSeam, readGateOptions } from './gate.ts';
import { defaultPace, TEST_PACE } from './pace.ts';
import { buildDecisionPool } from './pool.ts';
import { registerRoutes } from './routes.ts';
import { createSettleTracker, NO_SETTLE } from './settle.ts';

/**
 * The forced-KO seed: one hit point, so the opening turn wipes the party. A balance
 * seed for the gate, never a rule change — the same turn loop resolves the same way.
 */
const KO_SEED = 1;

/**
 * The one boot decision, taken once (PRD §2.2).
 *
 * A DEV page can reach the proxy, so it probes: `bootAdapter` picks the mode and the
 * tie-break policy together. A BUILT page cannot — the middleware is `apply: 'serve'`
 * — so it is stub-mode by construction (PRD §2.1) and the probe is skipped. The branch
 * is on `import.meta.env.DEV`, which the build folds to a constant, so a production
 * bundle never even carries the `/ai/*` route strings (INV-2, the dist gate).
 */
async function bootOnce(options: DeployedBootOptions): Promise<BootState> {
  // This branch — and it alone — must stay statically foldable: `import.meta.env.DEV`
  // is a build-time constant, so a production bundle drops everything after it, the
  // dynamic import included, and never carries a proxy route string (INV-2, dist gate).
  if (!import.meta.env.DEV) return bootDeployed(options);
  // A PACED gate (u17 `?pace=default`) takes the deployed arm even in dev: its whole
  // point is to be the shipped decision at authored durations, and a probe would make
  // the pacing measurement depend on whether a proxy happened to be running.
  if (options.defaultPace === true) return bootDeployed(options);
  const { bootAdapter } = await import('../ai/boot.ts');
  return bootAdapter(options);
}

/** How many times boot has run on this page load. Always 1 — the seam proves it. */
let bootCount = 0;

export interface BootAppOptions {
  /** The shell's boot slot (u1). */
  readonly slot: HTMLElement;
  /** Defaults to the page's own query string. */
  readonly search?: string;
}

export async function bootApp(options: BootAppOptions): Promise<void> {
  const { slot } = options;

  registerRoutes();

  const gate = readGateOptions(options.search ?? window.location.search);
  const data = loadBundledGameData();

  const heroes: readonly Hero[] =
    gate.scenario === 'defeat' ? data.heroes.map((hero) => ({ ...hero, hp: KO_SEED })) : data.heroes;

  // The shipped page is always watched at authored speed; only a gate may ask for the
  // fast one, and `?pace=default` opts a gate back into the authored durations (u17).
  const authoredPace = gate.pace === 'default';

  const boot = await bootOnce({
    tuning: data.tuning,
    pool: buildDecisionPool(decisionsRaw.combat, decisionsRaw.council),
    bucketConfig: BUCKET_CONFIG,
    heroes,
    automatedGate: gate.enabled,
    defaultPace: authoredPace,
    seed: gate.seed,
  });
  bootCount += 1;

  const shell = slot.closest<HTMLElement>('[data-testid="app-shell"]');

  const context = createGameContext({ data, boot, heroes });
  const director = createDirector({
    context,
    slot,
    chatter: decisionsRaw.chatter,
    overload: decisionsRaw.overload,
    // Durations only: `?pace=default` still boots the gate's stub adapter and `index`
    // tie-break, it just spends the authored walk and the readable bubble holds.
    automatedGate: gate.enabled && !authoredPace,
    pace: authoredPace ? defaultPace(data.tuning) : TEST_PACE,
    settle: shell === null ? NO_SETTLE : createSettleTracker(shell, slot),
    seed: gate.seed,
  });

  director.start();

  if (gate.enabled) publishGateSeam({ director, boot, bootCount });
}
