// Boot factory (PRD §2.1) — decides live vs stub ONCE, at startup.
//
// Rule: probe the configured health endpoint with a cold-start-aware budget;
// take the live adapter only when dialogue is available, otherwise use the stub.
//
// Everything is injectable and this module is side-effect free at import time —
// nothing here runs until a caller invokes the factory.

import {
  createLiveAdapter,
  HEALTH_PROBE_TIMEOUT_MS,
  probeHealth,
  type AIAdapter,
} from './adapter.ts';
import type { AIHealth } from './contract.ts';
import type { InferenceController } from './inference.ts';
import { createStubAdapter, type StubAdapterConfig } from './stub.ts';

export type HealthProbe = (timeoutMs?: number) => Promise<AIHealth | null>;

export interface BootDeps {
  probe?: HealthProbe;
  /** Health-probe budget; allows one Lambda cold start without retrying. */
  timeoutMs?: number;
  createLive?: (runtime?: InferenceController) => AIAdapter;
  createStub?: (config?: StubAdapterConfig) => AIAdapter;
  stubConfig?: StubAdapterConfig;
  runtime?: InferenceController;
}

const DEFAULT_PROBE_TIMEOUT_MS = HEALTH_PROBE_TIMEOUT_MS;

/** Pure decision: only an ok health payload earns the live adapter. */
export function chooseMode(health: AIHealth | null): 'live' | 'stub' {
  return health !== null && health.ok === true && health.dialogue === true ? 'live' : 'stub';
}

/** Runs the probe defensively: any throw/rejection reads as "no proxy". */
function probeSafely(probe: HealthProbe, timeoutMs: number): Promise<AIHealth | null> {
  return Promise.resolve()
    .then(() => probe(timeoutMs))
    .catch(() => null);
}

/**
 * Builds the adapter the app runs with. The bundled stub is constructed before
 * the asynchronous health probe starts. That keeps malformed bundled data a
 * synchronous boot failure, so deferred mounting cannot accidentally turn a
 * static-data bug into a per-track fallback.
 *
 * Once that validation succeeds, every *runtime* failure degrades silently to
 * the already-validated stub (§3-5): a dead/rejecting/throwing probe or a
 * `createLive()` construction error. See tests/ai/boot.test.ts AC16 vs AC16b.
 */
export function createBootAdapter(deps: BootDeps = {}): Promise<AIAdapter> {
  const {
    probe = probeHealth,
    timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
    createLive = createLiveAdapter,
    createStub = createStubAdapter,
    stubConfig,
    runtime,
  } = deps;

  // Deliberately before the first Promise: bad bundled data must throw at the
  // boot call site, before main.ts mounts the app.
  const stub = createStub(stubConfig);

  return probeSafely(probe, timeoutMs).then((health) => {
    if (chooseMode(health) === 'live') {
      try {
        runtime?.connect(health as AIHealth);
        return createLive(runtime);
      } catch {
        runtime?.disconnect();
        return stub;
      }
    }
    runtime?.disconnect();
    return stub;
  });
}
