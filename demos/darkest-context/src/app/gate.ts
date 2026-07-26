// u15 — the automated-gate seam (PRD §5).
//
// The SHIPPED page publishes nothing: without `?gate=1` this module contributes one
// object of parsed defaults and never touches `window`. Everything a spec addresses —
// the boot decision, the registry contents, what is in the slot, the run's state, the
// loadout, and `drain()` — is read here and nowhere else, so no screen unit ever has to
// know a test exists.
//
// `?scenario` and `?seed` are gate-only by construction: they are read off the parsed
// options, which report defaults whenever the gate is off.

import type { BootState } from '../ai/boot.ts';
import type { Director } from './director.ts';
import { screenIds } from './shell.ts';

export type GateScenario = 'default' | 'defeat';

export interface GateOptions {
  readonly enabled: boolean;
  /** `defeat` seeds the party at 1 HP so T1 wipes it — a balance seed, not a rule. */
  readonly scenario: GateScenario;
  /** Replays a recorded run. Absent unless the gate asked for one. */
  readonly seed?: number;
}

const GATE_PARAM = 'gate';
const SCENARIO_PARAM = 'scenario';
const SEED_PARAM = 'seed';

export function readGateOptions(search: string): GateOptions {
  const params = new URLSearchParams(search);
  if (params.get(GATE_PARAM) !== '1') return { enabled: false, scenario: 'default' };

  const scenario: GateScenario = params.get(SCENARIO_PARAM) === 'defeat' ? 'defeat' : 'default';
  const rawSeed = params.get(SEED_PARAM);
  if (rawSeed === null) return { enabled: true, scenario };

  const seed = Number(rawSeed);
  if (!Number.isFinite(seed)) {
    throw new Error(`?${SEED_PARAM} expects an integer, got '${rawSeed}'`);
  }
  return { enabled: true, scenario, seed };
}

export interface GateSeamOptions {
  readonly director: Director;
  readonly boot: BootState;
  readonly bootCount: number;
}

/**
 * Publishes `window.__app`. The live halves are getters, not snapshots: a spec reads
 * them at assertion time, long after boot returned.
 */
export function publishGateSeam(options: GateSeamOptions): void {
  const { director, boot, bootCount } = options;

  const seam = {
    mode: boot.mode,
    tieBreak: boot.tieBreak.policy,
    bootCount,
    screenIds: screenIds(),
  };

  Object.defineProperty(seam, 'mounted', { enumerable: true, get: () => director.mounted() });
  Object.defineProperty(seam, 'state', {
    enumerable: true,
    get: () => {
      const state = director.state();
      return {
        phase: state.phase,
        tileId: state.tileId,
        visited: [...state.visited],
        party: state.party.map((unit) => ({ unitId: unit.unitId, hp: unit.hp })),
      };
    },
  });
  Object.defineProperty(seam, 'loadout', { enumerable: true, get: () => director.loadout() });

  // Non-enumerable: the rest of the seam reads as plain, serialisable data, and a
  // function-valued own key would have to cross that boundary too.
  Object.defineProperty(seam, 'drain', { value: () => director.drain(), enumerable: false });

  Object.assign(window, { __app: seam });
}
