// U2 is deferred (plan-playtest §1 Deferred): the C-BLOCK effect was measured
// at ONE injected sentence — the cap does not move without a probe behind it.
// This pin survived tests/windows/block-store.test.ts, which T1 retired.
import { describe, it, expect } from 'vitest'
import { SLOT_CAP } from '../../src/client/components/slot-board.ts'

describe('[t1] the slot cap pin', () => {
  it('SLOT_CAP is 4 until a probe moves it (U2)', () => {
    expect(SLOT_CAP).toBe(4)
  })
})
