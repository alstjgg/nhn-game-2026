// [e8#A10] — accessors hand out deep copies. A caller (the client shell, the
// headless driver) must not be able to reach through a returned array and
// rewrite persisted meta-state.
import { describe, it, expect } from 'vitest'
import type { Block } from '../../src/shared/contracts.ts'
import type { MetaState } from '../../src/runloop/index.ts'
import { cloneMetaState, createMemoryMetaStore, createRunLoop } from '../../src/runloop/index.ts'

const SLUG = 'dday-demo'
const b1: Block = { id: 'blk-alpha', text: '증인은 도착 시각을 기억한다' }
const b2: Block = { id: 'blk-beta', text: '문은 안에서 잠겨 있었다' }

function seeded() {
  const rl = createRunLoop({ store: createMemoryMetaStore(), packSlug: SLUG, totalRuns: 4 })
  rl.startRun()
  rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })
  return rl
}

describe('[e8#A10] state() / startRun() results cannot mutate the loop', () => {
  it('(a) pushing into current().carried_blocks does not change the next current()', () => {
    const rl = seeded()
    rl.current().carried_blocks.push(b2)
    expect(rl.current().carried_blocks).toEqual([b1])
  })

  it('(b) pushing into current().report_archive does not change the next current()', () => {
    const rl = seeded()
    rl.current().report_archive.push('run-fake')
    expect(rl.current().report_archive).toEqual(['run-0001'])
  })

  it('(c) editing a block object reached through current() does not change stored text', () => {
    const rl = seeded()
    const block = rl.current().carried_blocks[0]!
    block.text = 'tampered'
    expect(rl.current().carried_blocks[0]!.text).toBe(b1.text)
  })

  it('(d) two current() calls hand out distinct objects', () => {
    const rl = seeded()
    expect(rl.current()).not.toBe(rl.current())
    expect(rl.current().carried_blocks).not.toBe(rl.current().carried_blocks)
  })

  it('(e) mutating startRun().carried does not change the next run', () => {
    const rl = seeded()
    const begun = rl.startRun()
    begun.carried.push(b2)
    begun.carried[0]!.text = 'tampered'
    expect(rl.current().carried_blocks).toEqual([b1])
  })

  it('(f) mutating the array handed to endRun() afterwards does not change stored state', () => {
    const rl = createRunLoop({ store: createMemoryMetaStore(), packSlug: SLUG, totalRuns: 4 })
    rl.startRun()
    const carried = [b1]
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried })
    carried.push(b2)
    expect(rl.current().carried_blocks).toEqual([b1])
  })

  it('(g) mutating the endRun() return value does not change stored state', () => {
    const rl = createRunLoop({ store: createMemoryMetaStore(), packSlug: SLUG, totalRuns: 4 })
    rl.startRun()
    const returned = rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [b1] })
    returned.report_archive.push('run-fake')
    expect(rl.current().report_archive).toEqual(['run-0001'])
  })

  it('(h) mutating the seed handed to createMemoryMetaStore() does not change stored state', () => {
    const seed: MetaState = {
      pack_slug: SLUG,
      run_count: 1,
      exposure_clock_reached: '13:05',
      carried_blocks: [b1],
      report_archive: ['run-0001'],
    }
    const rl = createRunLoop({ store: createMemoryMetaStore(seed), packSlug: SLUG, totalRuns: 4 })
    seed.carried_blocks.push(b2)
    seed.run_count = 99
    expect(rl.current().carried_blocks).toEqual([b1])
    expect(rl.current().run_count).toBe(1)
  })

  it('(i) cloneMetaState() is a deep copy, not a reference share', () => {
    const original: MetaState = {
      pack_slug: SLUG,
      run_count: 1,
      exposure_clock_reached: null,
      carried_blocks: [b1],
      report_archive: ['run-0001'],
    }
    const copy = cloneMetaState(original)
    expect(copy).toEqual(original)
    expect(copy).not.toBe(original)
    expect(copy.carried_blocks).not.toBe(original.carried_blocks)
    expect(copy.carried_blocks[0]).not.toBe(original.carried_blocks[0])
    copy.carried_blocks[0]!.text = 'tampered'
    copy.report_archive.push('x')
    expect(original.carried_blocks[0]!.text).toBe(b1.text)
    expect(original.report_archive).toEqual(['run-0001'])
  })
})
