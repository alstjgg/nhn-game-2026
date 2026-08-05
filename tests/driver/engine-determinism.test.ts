// [e7#A12] — determinism (decision 16).
//
// The same scripted round, driven twice in one process, must produce the same
// stream. This is not a nicety: the headless policy-bot run (e9) and the
// browser run must be indistinguishable, and archive highlighting is keyed on
// minted sentence ids. A shared allocator, a module-level counter, or a
// `Map` iterated in insertion order that happens to differ would all show up
// here and nowhere else.
import { describe, it, expect } from 'vitest'
import { createFixtureProvider } from '../../src/transport/index.ts'
import { drain, feedLines, makeRig, spyOn } from './engine-fixtures/rig.ts'
import { twoRounds } from './engine-fixtures/pack.ts'

describe('[e7#A12] two runs in one process agree', () => {
  it('(a) the ViewEvent arrays are deep-equal', async () => {
    const first = await drain(makeRig({ pack: twoRounds() }))
    const second = await drain(makeRig({ pack: twoRounds() }))
    expect(second).toEqual(first)
  })

  it('(b) and byte-equal — no key order or numeric drift either', async () => {
    const first = await drain(makeRig({ pack: twoRounds() }))
    const second = await drain(makeRig({ pack: twoRounds() }))
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
  })

  it('(c) the composed payloads are byte-equal too', async () => {
    const a = spyOn(createFixtureProvider())
    const b = spyOn(createFixtureProvider())
    await drain(makeRig({ pack: twoRounds(), transport: a }))
    await drain(makeRig({ pack: twoRounds(), transport: b }))
    expect(JSON.stringify(b.sent)).toBe(JSON.stringify(a.sent))
  })

  it('(d) the id counters are per-run, so run 2 mints run-2 ids', async () => {
    const first = await drain(makeRig({ pack: twoRounds(), run: 1 }))
    const second = await drain(makeRig({ pack: twoRounds(), run: 2 }))
    const idsOf = (events: typeof first): string[] =>
      feedLines(events).flatMap((line) => (line.sentence_id ?? '').match(/^b-r\d+/) ?? [])
    expect(new Set(idsOf(first))).toEqual(new Set(['b-r1']))
    expect(new Set(idsOf(second))).toEqual(new Set(['b-r2']))
    // …and the two runs are otherwise the same stream, id prefix aside.
    expect(JSON.stringify(second).split('b-r2').length).toBe(
      JSON.stringify(first).split('b-r1').length,
    )
  })

  it('(e) the same run driven step-by-step and drained in one go agree', async () => {
    const stepped = makeRig({ pack: twoRounds() })
    for (;;) {
      const more = await stepped.driver.step()
      if (!more) break
    }
    const drained = await drain(makeRig({ pack: twoRounds() }))
    expect(stepped.events).toEqual(drained)
  })
})
