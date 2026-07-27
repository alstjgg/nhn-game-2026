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

/**
 * `test` zeroes every duration the run watches — the fast, deterministic boot. `default`
 * (u17, `?pace=default`) runs the same boot DECISION at the authored durations instead:
 * the `walk.durationMs` walk, the `latency.stub` adapter delay, a readable hold per
 * bubble. It is the only boot §1-3's "3–5 minutes" rule can be measured on, because the
 * fast one deliberately zeroes the very numbers that rule is about.
 */
export type GatePace = 'test' | 'default';

export interface GateOptions {
  readonly enabled: boolean;
  /** `defeat` seeds the party at 1 HP so T1 wipes it — a balance seed, not a rule. */
  readonly scenario: GateScenario;
  /** Durations only. It never moves the mode or the tie-break policy. */
  readonly pace: GatePace;
  /** Replays a recorded run. Absent unless the gate asked for one. */
  readonly seed?: number;
}

const GATE_PARAM = 'gate';
const SCENARIO_PARAM = 'scenario';
const SEED_PARAM = 'seed';
const PACE_PARAM = 'pace';

export function readGateOptions(search: string): GateOptions {
  const params = new URLSearchParams(search);
  // `?pace` is gate-only by the same construction as `?scenario` and `?seed`: the
  // shipped page reads the parsed defaults and never sees the query string at all.
  if (params.get(GATE_PARAM) !== '1') {
    return { enabled: false, scenario: 'default', pace: 'default' };
  }

  const scenario: GateScenario = params.get(SCENARIO_PARAM) === 'defeat' ? 'defeat' : 'default';
  const pace: GatePace = params.get(PACE_PARAM) === 'default' ? 'default' : 'test';
  const rawSeed = params.get(SEED_PARAM);
  if (rawSeed === null) return { enabled: true, scenario, pace };

  const seed = Number(rawSeed);
  if (!Number.isFinite(seed)) {
    throw new Error(`?${SEED_PARAM} expects an integer, got '${rawSeed}'`);
  }
  return { enabled: true, scenario, pace, seed };
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
  // u17: every RESOLVED combat turn of the run so far, each tagged with the tile whose
  // fight produced it. A must-prove that spans three separate fights (the ≥70 noise turn,
  // the two authored attribution flips) has no other way to read a number or a fact out
  // of a fight whose screen has long since been replaced.
  Object.defineProperty(seam, 'turns', { enumerable: true, get: () => director.turns() });

  // Non-enumerable: the rest of the seam reads as plain, serialisable data, and a
  // function-valued own key would have to cross that boundary too.
  Object.defineProperty(seam, 'drain', { value: () => director.drain(), enumerable: false });

  Object.assign(window, { __app: seam });
}
