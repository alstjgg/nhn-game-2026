// [e7#A10·A11] — the membrane: all five `MembraneOp`s round-trip, and `deploy`
// is order-free at the seam.
//
// The membrane rule is the reason this file exists. The player's entire
// out-channel is these five structured ops; the only one that reaches a model
// payload is `deploy`, and it carries ids of sentences the ENGINE minted, never
// text. A11 is the mechanical half of that: architecture §2.1 / contract §8-10
// say a block set is content, not order, so two deploys of the same set must
// compose byte-identical bytes — otherwise a C-BLOCK measurement is comparing
// click order.
import { describe, it, expect } from 'vitest'
import type { CallRequest } from '../../src/shared/contracts.ts'
import type { MembraneOp } from '../../src/shared/view-driver.ts'
import { createFixtureProvider } from '../../src/transport/index.ts'
import { drain, feedLines, makeRig, spyOn } from './engine-fixtures/rig.ts'
import type { Rig } from './engine-fixtures/rig.ts'
import { twoRounds } from './engine-fixtures/pack.ts'

/** The two `n` ids minted on the first beat of the two-round pack. */
const N1 = 'b-r1-n01'
const N2 = 'b-r1-n02'

function judgmentBlocks(sent: CallRequest[]): string[][] {
  return sent.flatMap((request) =>
    request.call_type === 'judgment' && 'BLOCKS' in request.slots
      ? [request.slots.BLOCKS.map((block) => block.id)]
      : [],
  )
}

/** Drives beat 0 (the first gate) so there are mined-able sentences to work with. */
async function afterFirstBeat(): Promise<Rig> {
  const rig = makeRig({ pack: twoRounds(), transport: spyOn(createFixtureProvider()) })
  expect(await rig.driver.step()).toBe(true)
  return rig
}

describe('[e7#A10] `mine`', () => {
  it('(a) a mined id resolves to a block carrying the feed line’s own text', async () => {
    const rig = await afterFirstBeat()
    const source = feedLines(rig.events).find((line) => line.sentence_id === N2)
    expect(rig.driver.submit({ op: 'mine', sentence_id: N2 })).toEqual({ ok: true })
    expect(rig.driver.blocks().get(N2)).toEqual({ id: N2, text: source?.text })
  })

  it('(b) an unknown sentence is not minable, and mutates nothing', async () => {
    const rig = await afterFirstBeat()
    expect(rig.driver.submit({ op: 'mine', sentence_id: 'b-r9-n99' })).toEqual({
      ok: false,
      reason: 'not_minable',
    })
    expect(rig.driver.blocks().get('b-r9-n99')).toBeUndefined()
  })

  it('(c) a symptom line carries no id, so it can never be mined (contract §8-9)', async () => {
    const rig = await afterFirstBeat()
    const symptoms = feedLines(rig.events).filter((line) => line.kind === 'symptom')
    expect(symptoms.length).toBeGreaterThan(0)
    for (const symptom of symptoms) expect(symptom.sentence_id).toBeUndefined()
    // Its text is on the stream, but there is no id to ask for.
    expect(rig.driver.submit({ op: 'mine', sentence_id: '(변화 없음)' })).toEqual({
      ok: false,
      reason: 'not_minable',
    })
  })

  it('(d) report sentences are minable once the round closes', async () => {
    const rig = makeRig()
    const events = await drain(rig)
    const report = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    const fact = report[0]?.facts[0]
    expect(fact).toBeDefined()
    expect(rig.driver.submit({ op: 'mine', sentence_id: fact?.id ?? '' })).toEqual({ ok: true })
    expect(rig.driver.blocks().get(fact?.id ?? '')?.text).toBe(fact?.text)
  })
})

describe('[e7#A10] `slot` / `unslot`', () => {
  it('(a) slotting a mined block changes `slottedIds()` observably', async () => {
    const rig = await afterFirstBeat()
    rig.driver.submit({ op: 'mine', sentence_id: N1 })
    rig.driver.submit({ op: 'mine', sentence_id: N2 })
    expect(rig.driver.slottedIds()).toEqual([])
    expect(rig.driver.submit({ op: 'slot', block_id: N2, slot: 1 })).toEqual({ ok: true })
    expect(rig.driver.submit({ op: 'slot', block_id: N1, slot: 0 })).toEqual({ ok: true })
    expect(rig.driver.slottedIds()).toEqual([N1, N2])
    expect(rig.driver.submit({ op: 'unslot', slot: 0 })).toEqual({ ok: true })
    expect(rig.driver.slottedIds()).toEqual([N2])
  })

  it('(b) an unmined block cannot be slotted, and an empty slot cannot be cleared', async () => {
    const rig = await afterFirstBeat()
    expect(rig.driver.submit({ op: 'slot', block_id: N1, slot: 0 })).toEqual({
      ok: false,
      reason: 'unknown_block',
    })
    expect(rig.driver.slottedIds()).toEqual([])
    expect(rig.driver.submit({ op: 'unslot', slot: 3 })).toEqual({ ok: false, reason: 'empty_slot' })
  })
})

describe('[e7#A10] `deploy`', () => {
  it('(a) the NEXT `composer.judgment` receives exactly the deployed set', async () => {
    const transport = spyOn(createFixtureProvider())
    const rig = makeRig({ pack: twoRounds(), transport })
    await rig.driver.step()
    rig.driver.submit({ op: 'mine', sentence_id: N1 })
    rig.driver.submit({ op: 'mine', sentence_id: N2 })
    expect(rig.driver.submit({ op: 'deploy', blocks: [N2, N1] })).toEqual({ ok: true })
    await drain(rig)

    // ONE judgment, not two. Gate 1 opened before anything had been mined, so
    // x14 resolves it to its authored default with no call made — the empty
    // set is no longer something a payload can carry, because there is no
    // payload. Gate 2 is the first gate this run actually asks about, and it
    // carries exactly what was deployed.
    expect(judgmentBlocks(transport.sent)).toEqual([[N1, N2]])
  })

  it('(b) a set containing an unmined id is refused and changes nothing', async () => {
    const transport = spyOn(createFixtureProvider())
    const rig = makeRig({ pack: twoRounds(), transport })
    await rig.driver.step()
    rig.driver.submit({ op: 'mine', sentence_id: N1 })
    expect(rig.driver.submit({ op: 'deploy', blocks: [N1, 'b-r9-n99'] })).toEqual({
      ok: false,
      reason: 'unknown_block',
    })
    await drain(rig)
    // A refused deploy leaves the handover empty, and an empty handover is now
    // no call at all — so "changes nothing" is visible as NO judgment payload
    // rather than as two empty ones. Both gates took their authored default.
    expect(judgmentBlocks(transport.sent)).toEqual([])
  })
})

describe('[e7#A11] `deploy` is order-free at the seam', () => {
  async function requestFor(order: string[]): Promise<CallRequest | undefined> {
    const transport = spyOn(createFixtureProvider())
    const rig = makeRig({ pack: twoRounds(), transport })
    await rig.driver.step()
    rig.driver.submit({ op: 'mine', sentence_id: N1 })
    rig.driver.submit({ op: 'mine', sentence_id: N2 })
    rig.driver.submit({ op: 'deploy', blocks: order })
    await drain(rig)
    // `[0]`, not `[1]`: gate 1 opened on an empty handover and was never asked
    // (x14), so the first judgment payload this run composes is gate 2's — the
    // one carrying the deployed set, which is the one this suite is about.
    return transport.sent.filter((request) => request.call_type === 'judgment')[0]
  }

  it('(a) the two click orders compose byte-identical `CallRequest`s', async () => {
    const forward = await requestFor([N1, N2])
    const reverse = await requestFor([N2, N1])
    expect(forward).toBeDefined()
    expect(JSON.stringify(reverse)).toBe(JSON.stringify(forward))
  })

  it('(b) a duplicated id does not change the bytes either', async () => {
    const plain = await requestFor([N1, N2])
    const duplicated = await requestFor([N2, N1, N2, N1])
    expect(JSON.stringify(duplicated)).toBe(JSON.stringify(plain))
  })
})

describe('[e7#A10] `new_run`', () => {
  it('(a) between beats: the run ends, `step()` resolves false, one `run_end`', async () => {
    const rig = makeRig({ pack: twoRounds() })
    await rig.driver.step()
    expect(rig.driver.submit({ op: 'new_run' })).toEqual({ ok: true })
    expect(await rig.driver.step()).toBe(false)
    expect(await rig.driver.step()).toBe(false)
    expect(rig.events.filter((event) => event.type === 'run_end').length).toBe(1)
  })

  it('(b) `run_end` carries the run number the driver was built with', async () => {
    const rig = makeRig({ pack: twoRounds(), run: 3 })
    rig.driver.submit({ op: 'new_run' })
    const ends = rig.events.flatMap((event) => (event.type === 'run_end' ? [event.run] : []))
    expect(ends).toEqual([3])
  })

  it('(c) a run that reaches its own end emits `run_end` exactly once, unasked', async () => {
    const events = await drain(makeRig())
    expect(events.filter((event) => event.type === 'run_end').length).toBe(1)
  })
})

describe('[e7#A10 / decision 10] an unhandled op is an answer, never a throw', () => {
  it('(a) an op outside the five returns `{ok:false, reason:"unknown_op"}`', async () => {
    const rig = makeRig()
    const ops = rig.driver.submit
    // A stale client sending an op this build does not know must not take the
    // page down; the seam type forbids it, the runtime answers it anyway.
    const unknown: MembraneOp = JSON.parse('{"op":"teleport"}')
    expect(ops(unknown)).toEqual({ ok: false, reason: 'unknown_op' })
  })
})

describe('[e7#decision 3] `score` is optional', () => {
  it('(a) with no scorer, no `score` event is emitted', async () => {
    const events = await drain(makeRig())
    expect(events.some((event) => event.type === 'score')).toBe(false)
  })

  it('(b) with a scorer, `score` is emitted immediately before `run_end`', async () => {
    const events = await drain(
      makeRig({
        scorer: {
          score: () => ({
            total: 7,
            baseline_total: 9,
            rows: [{ label: '정확도', value: 7, baseline: 9 }],
          }),
        },
      }),
    )
    expect(events.slice(-2).map((event) => event.type)).toEqual(['score', 'run_end'])
  })
})
