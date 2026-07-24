// u2 TDD-Red — phase FSM: legal chain, illegal no-op (identity), manual advance, commit/deliver.
// Binds to the frozen §4 surface (design.md). Pure logic, node env, no DOM.
// Covers AC1 (legal chain), AC2 (illegal rejected + identity), AC6 (manual advance), F5 (commit/deliver).
import { describe, expect, it } from 'vitest';
import {
  PHASE_ORDER,
  phaseIndex,
  isAtOrAfter,
  canTransition,
  createMachine,
  reduce,
  isOutcomePending,
} from '../../src/state/index';
import type { GameEvent, MachineState, Phase } from '../../src/state/index';

// Build a machine state literal at an arbitrary phase (reduce is pure — any valid state is fair input).
const st = (phase: Phase, patience = 5): MachineState => ({ phase, patience });

describe('PHASE_ORDER + createMachine (F1, factory)', () => {
  it('is the exact 5-phase chain in fixed order', () => {
    expect([...PHASE_ORDER]).toEqual([
      'entrance',
      'conversation',
      'crafting',
      'handover',
      'outcome',
    ]);
  });

  it('createMachine starts at entrance with patience = budget arg (from data, not hard-coded)', () => {
    const m = createMachine(7);
    expect(m.phase).toBe('entrance');
    expect(m.patience).toBe(7);
  });

  it('createMachine honors an arbitrary budget (budget is an input, NF3)', () => {
    expect(createMachine(0).patience).toBe(0);
    expect(createMachine(42).patience).toBe(42);
  });
});

describe('phaseIndex / isAtOrAfter (linear-order helpers)', () => {
  it('phaseIndex returns position within PHASE_ORDER', () => {
    expect(phaseIndex('entrance')).toBe(0);
    expect(phaseIndex('conversation')).toBe(1);
    expect(phaseIndex('crafting')).toBe(2);
    expect(phaseIndex('handover')).toBe(3);
    expect(phaseIndex('outcome')).toBe(4);
  });

  it('isAtOrAfter is a >= comparison on phase position', () => {
    expect(isAtOrAfter('conversation', 'conversation')).toBe(true); // equal
    expect(isAtOrAfter('crafting', 'conversation')).toBe(true); // after
    expect(isAtOrAfter('entrance', 'conversation')).toBe(false); // before
    expect(isAtOrAfter('outcome', 'entrance')).toBe(true);
  });
});

describe('canTransition — only forward single steps are legal (F1)', () => {
  it.each<[Phase, Phase]>([
    ['entrance', 'conversation'],
    ['conversation', 'crafting'],
    ['crafting', 'handover'],
    ['handover', 'outcome'],
  ])('allows the adjacent forward step %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each<[Phase, Phase]>([
    ['entrance', 'crafting'], // skip ahead
    ['entrance', 'handover'], // skip ahead
    ['conversation', 'handover'], // skip ahead
    ['conversation', 'entrance'], // backward
    ['crafting', 'entrance'], // backward
    ['crafting', 'conversation'], // backward
    ['outcome', 'handover'], // backward from terminal
    ['entrance', 'entrance'], // self-loop
    ['crafting', 'crafting'], // self-loop
  ])('rejects the illegal transition %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('outcome is terminal — no forward step exists', () => {
    for (const to of PHASE_ORDER) {
      expect(canTransition('outcome', to)).toBe(false);
    }
  });
});

describe('AC1 — legal event chain drives entrance -> ... -> outcome', () => {
  it('walks the full chain one step per legal event', () => {
    let s = createMachine(5);
    expect(s.phase).toBe('entrance');

    s = reduce(s, { type: 'advance' }); // entrance -> conversation
    expect(s.phase).toBe('conversation');

    s = reduce(s, { type: 'proceedToCrafting' }); // conversation -> crafting (patience > 0)
    expect(s.phase).toBe('crafting');

    s = reduce(s, { type: 'commit' }); // crafting -> handover
    expect(s.phase).toBe('handover');

    s = reduce(s, { type: 'deliverOutcome' }); // handover -> outcome
    expect(s.phase).toBe('outcome');
  });

  it("'advance' also carries handover -> outcome (the delayed-outcome step)", () => {
    expect(reduce(st('handover'), { type: 'advance' }).phase).toBe('outcome');
  });
});

describe('F5 — commit / handover / deliver transitions', () => {
  it('commit: crafting -> handover', () => {
    expect(reduce(st('crafting'), { type: 'commit' }).phase).toBe('handover');
  });

  it('deliverOutcome: handover -> outcome', () => {
    expect(reduce(st('handover'), { type: 'deliverOutcome' }).phase).toBe('outcome');
  });
});

describe('AC6 — manual conversation -> crafting leaves patience untouched (A1)', () => {
  it('proceedToCrafting while patience > 0 advances and preserves patience', () => {
    const s = reduce(st('conversation', 4), { type: 'proceedToCrafting' });
    expect(s.phase).toBe('crafting');
    expect(s.patience).toBe(4);
  });

  it('proceedToCrafting is illegal outside conversation (no-op)', () => {
    const s = st('entrance', 4);
    expect(reduce(s, { type: 'proceedToCrafting' })).toBe(s);
  });
});

describe('AC2 — illegal events are rejected: phase unchanged AND same reference (A4, NF5)', () => {
  const illegal: Array<[MachineState, GameEvent, string]> = [
    [st('entrance'), { type: 'commit' }, 'commit before crafting'],
    [st('entrance'), { type: 'deliverOutcome' }, 'deliver from entrance'],
    [st('entrance'), { type: 'chooseDialogue', cost: 1 }, 'dialogue outside conversation'],
    [st('entrance'), { type: 'proceedToCrafting' }, 'proceed from entrance'],
    [st('conversation'), { type: 'commit' }, 'commit before crafting'],
    [st('conversation'), { type: 'deliverOutcome' }, 'deliver before handover'],
    [st('conversation'), { type: 'advance' }, 'advance is not a generic conversation step'],
    [st('crafting'), { type: 'advance' }, 'advance is not a generic crafting step'],
    [st('crafting'), { type: 'deliverOutcome' }, 'deliver before handover'],
    [st('crafting'), { type: 'proceedToCrafting' }, 'proceed outside conversation'],
    [st('crafting'), { type: 'chooseDialogue', cost: 1 }, 'dialogue outside conversation'],
    [st('handover'), { type: 'commit' }, 'commit after crafting'],
    [st('outcome'), { type: 'advance' }, 'advance from terminal' ],
    [st('outcome'), { type: 'commit' }, 'commit from terminal'],
    [st('outcome'), { type: 'deliverOutcome' }, 'deliver from terminal'],
    [st('outcome'), { type: 'chooseDialogue', cost: 1 }, 'dialogue from terminal'],
  ];

  it.each(illegal)('rejects %s#1 with %s#2 (%s)', (state, event) => {
    const before = state.phase;
    const result = reduce(state, event);
    expect(result.phase).toBe(before); // phase unchanged
    expect(result).toBe(state); // identity-equal no-op (D3)
  });
});

describe('NF5 — accepted transitions return a NEW object; input is never mutated', () => {
  it('a legal transition does not mutate the input state', () => {
    const s = st('crafting', 3);
    const out = reduce(s, { type: 'commit' });
    expect(out).not.toBe(s); // new object
    expect(s.phase).toBe('crafting'); // original untouched
    expect(out.phase).toBe('handover');
  });
});

describe('isOutcomePending — bridges FSM to overlap predicate (D6)', () => {
  it('is true exactly in handover (committed but not delivered)', () => {
    expect(isOutcomePending(st('handover'))).toBe(true);
  });

  it('is false in every non-handover phase', () => {
    for (const phase of PHASE_ORDER) {
      if (phase === 'handover') continue;
      expect(isOutcomePending(st(phase))).toBe(false);
    }
  });
});
