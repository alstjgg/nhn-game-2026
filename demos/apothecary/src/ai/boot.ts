// Boot factory (PRD §2.1) — decides live vs stub ONCE, at startup.
//
// Rule: probe the dev-proxy health endpoint with an 800ms budget; take the live
// adapter only when it answers ok, otherwise the stub. Production builds ship no
// middleware, so the deployed demo is stub-mode by construction.
//
// Everything is injectable and this module is side-effect free at import time —
// nothing here runs until a caller (u13's wiring) awaits the factory.

import { createLiveAdapter, probeHealth, type AIAdapter } from './adapter.ts';
import type { AIHealth } from './contract.ts';
import { createStubAdapter, type StubAdapterConfig } from './stub.ts';

export type HealthProbe = (timeoutMs?: number) => Promise<AIHealth | null>;

export interface BootDeps {
  probe?: HealthProbe;
  /** Health-probe budget; PRD §2.1 fixes the default at 800ms. */
  timeoutMs?: number;
  createLive?: () => AIAdapter;
  createStub?: (config?: StubAdapterConfig) => AIAdapter;
  stubConfig?: StubAdapterConfig;
}

const DEFAULT_PROBE_TIMEOUT_MS = 800;

/** Pure decision: only an ok health payload earns the live adapter. */
export function chooseMode(health: AIHealth | null): 'live' | 'stub' {
  return health !== null && health.ok ? 'live' : 'stub';
}

/** Runs the probe defensively: any throw/rejection reads as "no proxy". */
function probeSafely(probe: HealthProbe, timeoutMs: number): Promise<AIHealth | null> {
  return Promise.resolve()
    .then(() => probe(timeoutMs))
    .catch(() => null);
}

/**
 * Builds the adapter the app runs with. Degrades silently to the canned stub
 * (§3-5) for every *runtime* failure — a dead/rejecting/throwing probe, a
 * `createLive()` construction error. It does NOT swallow a bad stub config or
 * a malformed `data/stub-dialogue.json`: `createStub()` is trusted to throw
 * loudly on bad data (D3, `loadStubDialogue` → `fail()`), and that rejection
 * propagates out of `createBootAdapter` on purpose — a canned-data bug is a
 * boot-time crash, not a mode to fall back from. See tests/ai/boot.test.ts
 * AC16 vs AC16b.
 */
export async function createBootAdapter(deps: BootDeps = {}): Promise<AIAdapter> {
  const {
    probe = probeHealth,
    timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
    createLive = createLiveAdapter,
    createStub = createStubAdapter,
    stubConfig,
  } = deps;

  const health = await probeSafely(probe, timeoutMs);
  if (chooseMode(health) === 'live') {
    try {
      return createLive();
    } catch {
      return createStub(stubConfig);
    }
  }
  return createStub(stubConfig);
}
