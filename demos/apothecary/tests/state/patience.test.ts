// u2 TDD-Red — patience: deduction table, clamp, auto-advance at zero.
// Covers AC3 (deduction incl. cost 0), AC4 (never negative), AC5 (auto-advance both directions).
import { describe, expect, it } from 'vitest';
import { reduce } from '../../src/state/index';
import type { MachineState, Phase } from '../../src/state/index';

const conv = (patience: number): MachineState => ({ phase: 'conversation', patience });

describe('AC3 — chooseDialogue deducts cost from patience (max(0, before - c))', () => {
  it.each<[number, number, number]>([
    // [before, cost, expectedAfter]
    [5, 0, 5], // [관찰] costs nothing
    [5, 1, 4],
    [5, 2, 3],
    [5, 5, 0],
    [10, 3, 7],
    [1, 1, 0],
  ])('patience %i minus cost %i -> %i', (before, cost, after) => {
    const s = reduce(conv(before), { type: 'chooseDialogue', cost });
    expect(s.patience).toBe(after);
  });

  it('cost 0 ([관찰]) keeps the machine in conversation and patience unchanged', () => {
    const s = reduce(conv(3), { type: 'chooseDialogue', cost: 0 });
    expect(s.patience).toBe(3);
    expect(s.phase).toBe('conversation');
  });
});

describe('AC4 — patience never goes negative (clamp to 0, no overshoot) (A5)', () => {
  it.each<[number, number]>([
    [3, 10],
    [1, 99],
    [2, 3],
    [0, 5],
  ])('before %i, cost %i lands exactly on 0', (before, cost) => {
    const s = reduce(conv(before), { type: 'chooseDialogue', cost });
    expect(s.patience).toBe(0);
    expect(s.patience).toBeGreaterThanOrEqual(0);
  });
});

describe('reducer clamps a negative cost to 0 — a data typo must never heal patience', () => {
  it('a negative cost never raises patience above its current value', () => {
    const s = reduce(conv(3), { type: 'chooseDialogue', cost: -5 });
    expect(s.patience).toBe(3);
    expect(s.phase).toBe('conversation');
  });

  it('a negative cost behaves exactly like cost 0 (no deduction, no auto-advance)', () => {
    const s = reduce(conv(0), { type: 'chooseDialogue', cost: -1 });
    expect(s.patience).toBe(0);
    expect(s.phase).toBe('conversation');
  });
});

describe('AC5 — auto-advance conversation -> crafting exactly when patience reaches 0 (F3)', () => {
  it('a choice that brings patience to exactly 0 forces crafting in the same reduction', () => {
    const s = reduce(conv(2), { type: 'chooseDialogue', cost: 2 });
    expect(s.patience).toBe(0);
    expect(s.phase).toBe('crafting');
  });

  it('a choice whose cost exceeds patience clamps to 0 AND auto-advances', () => {
    const s = reduce(conv(2), { type: 'chooseDialogue', cost: 5 });
    expect(s.patience).toBe(0);
    expect(s.phase).toBe('crafting');
  });

  it('a choice that leaves patience > 0 stays in conversation', () => {
    const s = reduce(conv(5), { type: 'chooseDialogue', cost: 2 });
    expect(s.patience).toBe(3);
    expect(s.phase).toBe('conversation');
  });

  it('cost 0 at patience 0 does NOT advance (no deduction, still conversation)', () => {
    // reaches-zero is the trigger; already-zero with a no-cost observe is not a fresh deduction.
    // Guard the documented edge: cost 0 never forces an advance on its own.
    const s = reduce(conv(0), { type: 'chooseDialogue', cost: 0 });
    expect(s.patience).toBe(0);
    expect(s.phase).toBe('conversation');
  });
});

describe('chooseDialogue is conversation-only (illegal elsewhere = no-op)', () => {
  it.each<Phase>(['entrance', 'crafting', 'handover', 'outcome'])(
    'in %s, chooseDialogue is a same-ref no-op',
    (phase) => {
      const s: MachineState = { phase, patience: 5 };
      const out = reduce(s, { type: 'chooseDialogue', cost: 2 });
      expect(out).toBe(s);
      expect(out.patience).toBe(5);
    },
  );
});

describe('NF5 — chooseDialogue returns a new object, never mutates input', () => {
  it('input state is unchanged after a deduction', () => {
    const s = conv(5);
    const out = reduce(s, { type: 'chooseDialogue', cost: 2 });
    expect(out).not.toBe(s);
    expect(s.patience).toBe(5); // original untouched
    expect(out.patience).toBe(3);
  });
});
