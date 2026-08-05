// [e4#A9] — contract-engine-composer §8-6 transcribed at e4's seam: Call 1 and
// Call 3 get the same temperament. §2.0: "`TEMPERAMENT` crosses as structured
// data, not prose, and both views carry the identical object" — passing the same
// value twice makes that structural instead of a rule someone has to remember.
//
// So the assertion is reference identity, not deep equality: the round
// assembler must never copy, clone, or re-render the pack.
import { describe, it, expect } from 'vitest'

import { roundSlots, assembleExperienced } from '../../../src/engine/feed/index.ts'
import { GOLDEN_ROUND, TEMPERAMENT } from './__fixtures__/beat.ts'

describe('[e4#A9] the TemperamentPack crosses the round seam by reference', () => {
  it('(a) roundSlots().TEMPERAMENT is the very object handed in (===)', () => {
    expect(roundSlots(GOLDEN_ROUND).TEMPERAMENT).toBe(TEMPERAMENT)
  })

  it('(b) it is the same object the gate side holds, not a structural twin', () => {
    const gateSide = GOLDEN_ROUND.temperament
    expect(roundSlots(GOLDEN_ROUND).TEMPERAMENT).toBe(gateSide)
  })

  it('(c) JSON.stringify-equal to the gate-side value, byte for byte', () => {
    expect(JSON.stringify(roundSlots(GOLDEN_ROUND).TEMPERAMENT)).toBe(JSON.stringify(TEMPERAMENT))
  })

  it('(d) nested members are the same objects too — no deep clone anywhere', () => {
    const out = roundSlots(GOLDEN_ROUND).TEMPERAMENT
    expect(out.clauses).toBe(TEMPERAMENT.clauses)
    expect(out.clauses[0]).toBe(TEMPERAMENT.clauses[0])
    expect(out.clauses[0]!.axis_vocabulary).toBe(TEMPERAMENT.clauses[0]!.axis_vocabulary)
  })

  it('(e) it is not re-rendered to prose — the slot stays structured data', () => {
    expect(typeof roundSlots(GOLDEN_ROUND).TEMPERAMENT).toBe('object')
  })

  it('(f) two calls on the same round return the identical pack', () => {
    expect(roundSlots(GOLDEN_ROUND).TEMPERAMENT).toBe(roundSlots(GOLDEN_ROUND).TEMPERAMENT)
  })

  it('(g) the assembler does not mutate the pack it was handed', () => {
    const before = JSON.stringify(TEMPERAMENT)
    assembleExperienced(GOLDEN_ROUND)
    roundSlots(GOLDEN_ROUND)
    expect(JSON.stringify(TEMPERAMENT)).toBe(before)
  })

  it('(h) roundSlots also carries the assembled EXPERIENCED, and nothing else', () => {
    const slots = roundSlots(GOLDEN_ROUND)
    expect(Object.keys(slots).sort()).toEqual(['EXPERIENCED', 'TEMPERAMENT'])
    expect(slots.EXPERIENCED).toEqual(assembleExperienced(GOLDEN_ROUND))
  })
})
