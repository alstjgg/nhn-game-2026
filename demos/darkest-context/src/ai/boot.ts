// Boot — one decision picks the adapter mode AND the tie-break policy (PRD §2.2).
//
// `/ai/health` answers within the budget declared in `data/tuning.json` ⇒ live mode
// with the seeded `random` policy; anything else — no proxy, no key, a slow network,
// a 500, a rejected probe — falls back to stub mode with `index`, silently. An
// automated gate (vitest/Playwright) short-circuits the probe entirely: no network
// call is made at all, and the adapter runs at the unit-test latency (PRD §5).
//
// Both branches return the same `AIAdapter` surface, so no caller downstream can
// tell the modes apart (INV-5); `mode` is the only field that differs.
//
// This file schedules nothing and reads no tunable inline: every number comes from
// the loaded tuning through `resolveTuningRef`, and all waiting belongs to the
// adapter (INV-6).

import { probeHealth } from './adapter.ts';
import type { AIAdapter } from './adapter.ts';
import type { AIHealth, Mode } from './contract.ts';
import { createLiveAdapter } from './live.ts';
import { createFallbackDecider, createStubAdapter } from './stub.ts';
import type { FallbackDecider } from './stub.ts';
import type { BucketConfig, DecisionPool } from './bucket.ts';
import { createRng, createSeed } from '../core/rng.ts';
import type { TieBreakContext, TieBreakPolicy } from '../core/tiebreak.ts';
import { resolveTuningRef } from '../data/loader.ts';
import type { Hero, Tuning } from '../data/schema.ts';

/** Tuning refs this boot reads — the balance-as-data seam (INV-8). */
const HEALTH_PROBE_REF = 'timeout.healthProbe';
const LIVE_TIMEOUT_REF = 'timeout.live';
const STUB_TIMEOUT_REF = 'timeout.stub';
const STUB_LATENCY_REF = 'latency.stub';
const GATE_LATENCY_REF = 'latency.unit';

/** The boot probe port: given a budget in ms, resolve the health payload or `null`. */
export type HealthProbe = (timeoutMs: number) => Promise<AIHealth | null>;

/** The live-adapter factory port, so a test can boot live without a proxy. */
export type LiveAdapterFactory = (config: { timeoutMs: number }) => AIAdapter;

export interface BootOptions {
  tuning: Tuning;
  pool: DecisionPool;
  bucketConfig: BucketConfig;
  heroes: readonly Hero[];
  /** Defaults to the real `/ai/health` fetch probe. */
  probe?: HealthProbe;
  /** Defaults to the real live adapter. */
  createLive?: LiveAdapterFactory;
  /** vitest/Playwright: skip the probe, run stub at latency 0 with `index` ties. */
  automatedGate?: boolean;
  /** Reuse a recorded seed to replay a run; live mode draws one when omitted. */
  seed?: number;
}

/** What boot hands the rest of the app — the composition root's whole output. */
export interface BootState {
  mode: Mode;
  adapter: AIAdapter;
  tieBreak: TieBreakContext;
  /** Present whenever a stream exists (live), plus any seed the caller supplied. */
  seed?: number;
  fallbackFor: FallbackDecider;
}

function stubState(
  options: BootOptions,
  policy: TieBreakPolicy,
  latencyRef: string,
): BootState {
  const { tuning } = options;
  return {
    mode: 'stub',
    adapter: createStubAdapter({
      pool: options.pool,
      latencyMs: resolveTuningRef(tuning, latencyRef),
      timeoutMs: resolveTuningRef(tuning, STUB_TIMEOUT_REF),
      bucketConfig: options.bucketConfig,
    }),
    // `index` needs no entropy: stub mode never invents a seed (INV-6).
    tieBreak: { policy },
    seed: options.seed,
    fallbackFor: createFallbackDecider(options.heroes),
  };
}

/**
 * Probes once, then builds the adapter and the tie-break context together — mode
 * and policy are one decision, never two. Never throws and never logs: a failed
 * probe is the expected production path, not an error.
 */
export async function bootAdapter(options: BootOptions): Promise<BootState> {
  const { tuning } = options;

  if (options.automatedGate === true) {
    return stubState(options, tuning.tieBreak.test, GATE_LATENCY_REF);
  }

  const probe = options.probe ?? probeHealth;
  let health: AIHealth | null = null;
  try {
    health = await probe(resolveTuningRef(tuning, HEALTH_PROBE_REF));
  } catch {
    health = null;
  }
  if (health === null) {
    return stubState(options, tuning.tieBreak.stub, STUB_LATENCY_REF);
  }

  const seed = options.seed ?? createSeed();
  const createLive = options.createLive ?? createLiveAdapter;
  return {
    mode: 'live',
    adapter: createLive({ timeoutMs: resolveTuningRef(tuning, LIVE_TIMEOUT_REF) }),
    tieBreak: { policy: tuning.tieBreak.live, rng: createRng(seed) },
    seed,
    fallbackFor: createFallbackDecider(options.heroes),
  };
}
