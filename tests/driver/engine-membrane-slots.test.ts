// U5.4 — the slot lookup the radio-line citation is resolved through.
//
// The membrane already kept `slots` so `unslot` could validate against it; this
// pins the reader U5.4 added over it, and above all pins what happens to a
// block the operator never seated — the case that decides whether the mark can
// ever be wrong.
import { describe, it, expect } from 'vitest'
import { createMembrane } from '../../src/driver/membrane.ts'
// `MutableBlockStore` is `import type`-d INTO membrane.ts from `./ports.ts` and
// is therefore not re-exported by it. It comes from ports.ts or nowhere.
import type { MutableBlockStore } from '../../src/driver/ports.ts'

const store = (): MutableBlockStore =>
  ({ has: () => true, absorbLine: () => undefined }) as unknown as MutableBlockStore

describe('[U5.4] the membrane resolves a block id to its slot', () => {
  it('(a) a seated block reports the slot it sits in', () => {
    const membrane = createMembrane(store())
    membrane.submit({ op: 'slot', block_id: 'b-r3-f01', slot: 2 })
    expect(membrane.slotOf('b-r3-f01')).toBe(2)
  })

  it('(b) a block the operator never seated resolves to null', () => {
    const membrane = createMembrane(store())
    membrane.submit({ op: 'slot', block_id: 'b-r3-f01', slot: 0 })
    // The citation case that matters: the model minted an id, so it names no
    // slot, so the line carries no mark. Absent, never wrong.
    expect(membrane.slotOf('b-r3-f99')).toBe(null)
  })

  it('(c) an unslotted block stops resolving', () => {
    const membrane = createMembrane(store())
    membrane.submit({ op: 'slot', block_id: 'b-r3-f01', slot: 1 })
    membrane.submit({ op: 'unslot', slot: 1 })
    expect(membrane.slotOf('b-r3-f01')).toBe(null)
  })
})
