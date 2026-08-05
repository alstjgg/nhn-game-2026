// [e8#A1] + [e8#A2] — two consecutive runs: carried blocks survive into run 2's
// Call 1 BLOCKS, and the report archive grows in completion order.
import { describe, it, expect } from 'vitest'
import type { Block, JudgmentSlots } from '../../src/shared/contracts.ts'
import { createMemoryMetaStore, createRunLoop } from '../../src/runloop/index.ts'

const SLUG = 'dday-demo'

const b1: Block = { id: 'blk-alpha', text: '증인은 도착 시각을 기억한다' }
const b2: Block = { id: 'blk-beta', text: '문은 안에서 잠겨 있었다' }
const b3: Block = { id: 'blk-gamma', text: '기록은 한 번 수정되었다' }

function loop() {
  return createRunLoop({ store: createMemoryMetaStore(), packSlug: SLUG, totalRuns: 4 })
}

describe('[e8#A1] carried blocks survive into the next run', () => {
  it('(a) run 1 starts with nothing carried', () => {
    const rl = loop()
    const begun = rl.startRun()
    expect(begun.run).toBe(1)
    expect(begun.carried).toEqual([])
    expect(begun.exposureClock).toBeNull()
  })

  it('(b) blocks handed to endRun() come back from run 2 startRun(), id+text intact', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1, b2] })

    const second = rl.startRun()
    expect(second.run).toBe(2)
    expect(second.carried).toEqual([b1, b2])
    expect(second.carried.map((b) => b.id)).toEqual(['blk-alpha', 'blk-beta'])
    expect(second.carried.map((b) => b.text)).toEqual([b1.text, b2.text])
  })

  it('(c) the carried set is what a Call 1 JudgmentSlots.BLOCKS array is built from', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1, b2] })
    const second = rl.startRun()

    // compile-time: `carried` is Block[], assignable to the frozen slot type
    const slots: Pick<JudgmentSlots, 'BLOCKS'> = { BLOCKS: second.carried }
    expect(slots.BLOCKS).toHaveLength(2)
    for (const b of slots.BLOCKS) {
      expect(typeof b.id).toBe('string')
      expect(typeof b.text).toBe('string')
      expect(Object.keys(b).sort()).toEqual(['id', 'text'])
    }
  })

  it('(d) endRun() replaces the carried set wholesale — it does not accumulate', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [b1, b2] })
    rl.startRun()
    rl.endRun({ runId: 'run-0002', reachedClock: null, carried: [b3] })

    expect(rl.startRun().carried).toEqual([b3])
    expect(rl.current().carried_blocks).toEqual([b3])
  })

  it('(e) an empty carried set is legal and clears the carry-over', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [b1] })
    rl.startRun()
    rl.endRun({ runId: 'run-0002', reachedClock: null, carried: [] })

    expect(rl.startRun().carried).toEqual([])
  })

  it('(f) run_count advances on startRun(), so a run that never ends still counts', () => {
    const rl = loop()
    expect(rl.current().run_count).toBe(0)
    rl.startRun()
    expect(rl.current().run_count).toBe(1)
    // no endRun — a crashed/abandoned run
    rl.startRun()
    expect(rl.current().run_count).toBe(2)
  })
})

describe('[e8#A2] the report archive grows in completion order', () => {
  it('(a) 0 → 1 → 2 across two finished runs', () => {
    const rl = loop()
    expect(rl.current().report_archive).toEqual([])

    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '12:00', carried: [] })
    expect(rl.current().report_archive).toEqual(['run-0001'])

    rl.startRun()
    rl.endRun({ runId: 'run-0002', reachedClock: '13:05', carried: [] })
    expect(rl.current().report_archive).toEqual(['run-0001', 'run-0002'])
  })

  it('(b) startRun() never touches the archive — only finished runs are indexed', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    rl.startRun()
    expect(rl.current().report_archive).toEqual(['run-0001'])
  })

  it('(c) no duplicates — re-ending the same run id does not double-index', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    expect(rl.current().report_archive).toEqual(['run-0001'])
  })

  it('(d) endRun() returns the persisted state it just wrote', () => {
    const rl = loop()
    rl.startRun()
    const returned = rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })
    expect(returned).toEqual(rl.current())
    expect(returned.pack_slug).toBe(SLUG)
    expect(returned.run_count).toBe(1)
  })
})
