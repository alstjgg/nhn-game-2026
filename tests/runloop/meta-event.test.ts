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

  // [#116 finding E] — `archive[i].run` was `i + 1`, i.e. the array index. Line
  // 78 of run-loop.ts documents that a started run may never end, so the index
  // and the run number genuinely diverge, and the label the client shows for a
  // past report then names the wrong run.
  it('(e2) an abandoned run does not renumber the runs that did end', () => {
    const rl = loop(4)
    rl.startRun() // run 1
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    rl.startRun() // run 2 — never ends
    rl.startRun() // run 3
    rl.endRun({ runId: 'run-0003', reachedClock: null, carried: [] })

    expect(rl.metaEvent().run).toBe(3)
    expect(rl.metaEvent().archive).toEqual([
      { run: 1, label: 'run-0001' },
      { run: 3, label: 'run-0003' },
    ])
  })

  it('(e3) …and the run number is the run in flight, not the count at archive time', () => {
    const rl = loop(4)
    rl.startRun()
    rl.startRun()
    rl.startRun() // three opened, none closed
    rl.endRun({ runId: 'run-0003', reachedClock: null, carried: [] })
    expect(rl.metaEvent().archive).toEqual([{ run: 3, label: 'run-0003' }])
  })

  it('(e4) re-archiving the same run_id keeps its FIRST number, and adds no row', () => {
    const rl = loop(4)
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    expect(rl.metaEvent().archive).toEqual([{ run: 1, label: 'run-0001' }])
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

  // The default is 4, and this is a LITERAL on purpose — deliberately not
  // `DEFAULT_TOTAL_RUNS - 1`. This is the one place the shipped allotment is
  // pinned, and a test that reads the constant it is pinning cannot fail.
  //
  // H3 (08-09) briefly moved it to 5 and moved it back. The bump was covering
  // for the page-turn defect this branch fixes — see `runloop/run-loop.ts`'s
  // own note — so the literal is 4 again, and the reason it is 4 is now that
  // four agents is the allotment rather than that nobody has counted.
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

// The run_id → run number pairing cannot be persisted: the ratified
// `meta-state.schema.json` declares `report_archive` as an array of plain
// strings under `additionalProperties: false`, and `run_id` has no documented
// grammar to encode a number into. These pin what a reload therefore does, so
// the residual is a recorded limit (discovery/e8.md) rather than a surprise.
describe('[#116 E] what survives a reload, and what the schema will not carry', () => {
  const resumed = (store: ReturnType<typeof createMemoryMetaStore>) =>
    createRunLoop({ store, packSlug: SLUG, totalRuns: 4 })

  it('(a) with every started run ended, position IS the run number — reload is exact', () => {
    const store = createMemoryMetaStore()
    const first = resumed(store)
    first.startRun()
    first.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    first.startRun()
    first.endRun({ runId: 'run-0002', reachedClock: null, carried: [] })

    const after = resumed(store)
    expect(after.current().report_archive.length).toBe(after.current().run_count)
    expect(after.metaEvent().archive).toEqual([
      { run: 1, label: 'run-0001' },
      { run: 2, label: 'run-0002' },
    ])
  })

  it('(b) across an abandoned run a reload can only give the lower bound — a recorded limit', () => {
    const store = createMemoryMetaStore()
    const first = resumed(store)
    first.startRun()
    first.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    first.startRun() // abandoned
    first.startRun()
    first.endRun({ runId: 'run-0003', reachedClock: null, carried: [] })
    // In-session the answer is exact…
    expect(first.metaEvent().archive.map((row) => row.run)).toEqual([1, 3])

    const after = resumed(store)
    // …and after a reload the pairing is gone with nowhere in the schema to
    // have kept it. `length < run_count` is the detectable signal that the
    // numbers below are bounds; a schema revision is what lifts this.
    expect(after.current().report_archive.length).toBeLessThan(after.current().run_count)
    expect(after.metaEvent().archive.map((row) => row.run)).toEqual([1, 2])
  })

  it('(c) the persisted shape is unchanged — no number smuggled into the archive', () => {
    const store = createMemoryMetaStore()
    const rl = resumed(store)
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    const saved = store.load()!
    expect(saved.report_archive).toEqual(['run-0001'])
    expect(saved.report_archive.every((entry) => typeof entry === 'string')).toBe(true)
    expect(Object.keys(saved).sort()).toEqual([
      'carried_blocks',
      'exposure_clock_reached',
      'pack_slug',
      'report_archive',
      'run_count',
    ])
  })
})
