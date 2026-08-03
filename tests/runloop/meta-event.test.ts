// [e8#A9] — metaEvent() fills the ratified `meta` member of the frozen
// src/shared/view-driver.ts ViewEvent union (consume, never rewrite): this unit
// fixes the payload VALUES, not the type. `carried` is block ids (D5),
// `archive[i].label` is the archived run_id, `runs_left` comes from config.
import { describe, it, expect } from 'vitest'
import type { Block } from '../../src/shared/contracts.ts'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import { createMemoryMetaStore, createRunLoop } from '../../src/runloop/index.ts'

type MetaEvent = Extract<ViewEvent, { type: 'meta' }>

const SLUG = 'dday-demo'
const b1: Block = { id: 'blk-alpha', text: '증인은 도착 시각을 기억한다' }
const b2: Block = { id: 'blk-beta', text: '문은 안에서 잠겨 있었다' }

function loop(totalRuns?: number) {
  return createRunLoop({ store: createMemoryMetaStore(), packSlug: SLUG, totalRuns })
}

describe('[e8#A9] metaEvent() is a ViewEvent `meta` member', () => {
  it('(a) compile-time: the return type is assignable to Extract<ViewEvent, {type:"meta"}>', () => {
    const ev: MetaEvent = loop(4).metaEvent()
    expect(ev.type).toBe('meta')
    expect(Object.keys(ev).sort()).toEqual(['archive', 'carried', 'run', 'runs_left', 'type'])
  })

  it('(b) at run 2 of 4 it equals the ratified payload exactly', () => {
    const rl = loop(4)
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1, b2] })
    rl.startRun()

    expect(rl.metaEvent()).toEqual({
      type: 'meta',
      run: 2,
      runs_left: 2,
      carried: ['blk-alpha', 'blk-beta'],
      archive: [{ run: 1, label: 'run-0001' }],
    })
  })

  it('(c) `carried` is ids only — never the block objects, never the texts', () => {
    const rl = loop(4)
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [b1] })
    rl.startRun()

    const ev = rl.metaEvent()
    expect(ev.carried).toEqual(['blk-alpha'])
    for (const c of ev.carried) expect(typeof c).toBe('string')
    expect(JSON.stringify(ev)).not.toContain(b1.text)
  })

  it('(d) before any run: run 0, nothing carried, empty archive, full runs_left', () => {
    expect(loop(4).metaEvent()).toEqual({
      type: 'meta',
      run: 0,
      runs_left: 4,
      carried: [],
      archive: [],
    })
  })

  it('(e) the archive rows are 1-based run numbers paired with their run_id labels', () => {
    const rl = loop(4)
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    rl.startRun()
    rl.endRun({ runId: 'run-0002', reachedClock: null, carried: [] })

    expect(rl.metaEvent().archive).toEqual([
      { run: 1, label: 'run-0001' },
      { run: 2, label: 'run-0002' },
    ])
  })

  it('(f) runs_left floors at 0 once the last run is spent', () => {
    const rl = loop(2)
    rl.startRun()
    expect(rl.metaEvent().runs_left).toBe(1)
    rl.startRun()
    expect(rl.metaEvent().runs_left).toBe(0)
    rl.startRun()
    expect(rl.metaEvent().runs_left).toBe(0)
    expect(rl.metaEvent().run).toBe(3)
  })

  it('(g) totalRuns defaults to 4 when the caller omits it (spec assumption 1)', () => {
    const rl = loop()
    rl.startRun()
    expect(rl.metaEvent().runs_left).toBe(3)
  })

  it('(h) totalRuns is config, never persisted — it stays out of the meta-state', () => {
    const rl = loop(7)
    rl.startRun()
    expect(JSON.stringify(rl.current())).not.toContain('7')
    expect(Object.keys(rl.current())).not.toContain('total_runs')
  })
})
