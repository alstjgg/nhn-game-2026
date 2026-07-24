// u2 — Phase state machine (pure TS). Barrel surface consumed by tests/state/*.
//
// The apothecary loop runs a single customer through a fixed 5-phase shell
// (§1.1). Patience is spent during conversation and, when it hits zero, the
// impatient customer forces crafting (§2). A separate deterministic predicate
// decides when a previous customer's delayed outcome is "due" while the next
// customer's visit overlaps (§1.4).
//
// Everything here is pure: no wall clock, timers, randomness, DOM, or I/O.

/** The five phases of a single customer visit, in fixed forward order. */
export type Phase =
  | 'entrance'
  | 'conversation'
  | 'crafting'
  | 'handover'
  | 'outcome';

/** Canonical phase chain — the only source of ordering (F1). */
export const PHASE_ORDER = [
  'entrance',
  'conversation',
  'crafting',
  'handover',
  'outcome',
] as const satisfies readonly Phase[];

/** Minimal machine state: current phase + remaining patience budget. */
export interface MachineState {
  readonly phase: Phase;
  readonly patience: number;
}

/** Events the machine reduces over. `chooseDialogue` carries a patience cost. */
export type GameEvent =
  | { type: 'advance' }
  | { type: 'proceedToCrafting' }
  | { type: 'commit' }
  | { type: 'deliverOutcome' }
  | { type: 'chooseDialogue'; cost: number };

/** Snapshot for the overlap predicate: is C1's outcome pending, where is C2. */
export interface OverlapState {
  readonly customer1OutcomePending: boolean;
  readonly customer2Phase: Phase;
}

/** Position of a phase within PHASE_ORDER (0..4). */
export function phaseIndex(phase: Phase): number {
  return PHASE_ORDER.indexOf(phase);
}

/** `a >= b` on phase position — level-triggered "has reached b" (D5). */
export function isAtOrAfter(a: Phase, b: Phase): boolean {
  return phaseIndex(a) >= phaseIndex(b);
}

/** Only an adjacent forward single step is a legal phase transition (F1). */
export function canTransition(from: Phase, to: Phase): boolean {
  return phaseIndex(to) === phaseIndex(from) + 1;
}

/** Factory: a fresh visit starts at entrance with the supplied patience budget. */
export function createMachine(patienceBudget: number): MachineState {
  return { phase: 'entrance', patience: patienceBudget };
}

/**
 * Pure reducer. Illegal (state, event) pairs return the SAME reference (D3 —
 * an identity-equal no-op); legal transitions return a NEW object and never
 * mutate the input (NF5).
 */
export function reduce(state: MachineState, event: GameEvent): MachineState {
  switch (event.type) {
    case 'advance':
      // `advance` is the generic step only where a bespoke event is absent:
      // entrance -> conversation, and the delayed handover -> outcome.
      if (state.phase === 'entrance') {
        return { phase: 'conversation', patience: state.patience };
      }
      if (state.phase === 'handover') {
        return { phase: 'outcome', patience: state.patience };
      }
      return state;

    case 'proceedToCrafting':
      // Manual conversation -> crafting; patience is left untouched (AC6).
      if (state.phase !== 'conversation') return state;
      return { phase: 'crafting', patience: state.patience };

    case 'commit':
      if (state.phase !== 'crafting') return state;
      return { phase: 'handover', patience: state.patience };

    case 'deliverOutcome':
      if (state.phase !== 'handover') return state;
      return { phase: 'outcome', patience: state.patience };

    case 'chooseDialogue': {
      if (state.phase !== 'conversation') return state;
      const patience = Math.max(0, state.patience - event.cost);
      // A real deduction (cost > 0) that lands on zero forces crafting (F3).
      // A no-cost observe ([관찰]) never advances on its own — reaches-zero is
      // the trigger, not already-zero.
      const phase: Phase =
        event.cost > 0 && patience === 0 ? 'crafting' : 'conversation';
      return { phase, patience };
    }
  }
}

/** True iff the customer is committed but not yet delivered (handover) (D6). */
export function isOutcomePending(state: MachineState): boolean {
  return state.phase === 'handover';
}

/**
 * Deterministic overlap trigger (§1.4): C1's delayed outcome is due once it is
 * pending AND the next customer's conversation has begun (level-triggered `>=`
 * on 'conversation', per D5). Same input always yields the same result (AC9).
 */
export function isOutcomeDue(overlap: OverlapState): boolean {
  return (
    overlap.customer1OutcomePending &&
    isAtOrAfter(overlap.customer2Phase, 'conversation')
  );
}
