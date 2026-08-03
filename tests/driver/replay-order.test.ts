// [u2#c3] — spec-client §5.4: a fixture run is an ordered ViewEvent[] with clock
// stamps plus canned responses for each MembraneOp the script expects. The driver
// replays the stream IN ORDER and answers every expected op from the canned set.
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ViewEvent, MembraneOp } from '../../src/shared/view-driver.ts'
import type { FixtureRun } from '../../src/client/driver/fixtures/types.ts'
import { createFixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import { MS_PER_SIM_MIN } from '../../src/client/driver/clock.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * A synthetic stream that touches all 8 ViewEvent members exactly once, in an
 * order the assertions can pin. No authored content — [u2#c9] keeps the 우는다리
 * fixture in u2f.
 */
function syntheticRun(): FixtureRun {
  const events: ViewEvent[] = [
    { type: 'beat_start', beat: 1, clock: '13:05' },
    { type: 'feed', line: { kind: 'event', clock: '13:05', text: 'E1' } },
    { type: 'waiting', active: true, for: 'judgment' },
    { type: 'waiting', active: false, for: 'judgment' },
    { type: 'feed', line: { kind: 'radio', clock: '13:06', text: 'R1', speaker: 'SP', sentence_id: 's-1' } },
    { type: 'fallback', call: 2, code: 'LOCAL', beat: 1 },
    { type: 'beat_end', beat: 1, clock: '13:07' },
    {
      type: 'report',
      round: 1,
      facts: [{ id: 'b-r1-f01', text: 'F1', species: 'fact' }],
      report_body: [{ id: 'b-r1-b01', text: 'B1', species: 'selfnarr' }],
    },
    { type: 'score', total: 10, rows: [{ label: 'L', value: 10 }] },
    { type: 'meta', run: 1, runs_left: 9, carried: [], archive: [] },
    { type: 'run_end', run: 1 },
  ]
  return {
    id: 'synthetic',
    start: '13:05',
    end: '13:07',
    events,
    responses: {
      slot: { ok: true },
      unslot: { ok: true },
      mine: { ok: true },
      deploy: { ok: true },
      new_run: { ok: true },
    },
  }
}

function collect(run: FixtureRun): ViewEvent[] {
  const seen: ViewEvent[] = []
  const driver = createFixtureDriver(run)
  driver.subscribe((e) => seen.push(e))
  driver.start()
  driver.drain()
  return seen
}

describe('[u2#c3] stream order', () => {
  let run: FixtureRun

  beforeEach(() => {
    run = syntheticRun()
  })

  it('(a) every event is delivered, none dropped, none duplicated', () => {
    expect(collect(run)).toHaveLength(run.events.length)
  })

  it('(b) delivery order is the array order, member for member', () => {
    expect(collect(run)).toEqual([...run.events])
  })

  it('(c) all 8 ViewEvent members survive the replay', () => {
    const kinds = new Set(collect(run).map((e) => e.type))
    for (const t of ['beat_start', 'beat_end', 'feed', 'waiting', 'fallback', 'report', 'score', 'run_end', 'meta']) {
      expect(kinds, `replay dropped '${t}'`).toContain(t)
    }
  })

  it('(d) nothing is emitted before start()', () => {
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(run)
    driver.subscribe((e) => seen.push(e))
    expect(seen).toEqual([])
  })

  it('(e) an unsubscribed listener stops receiving', () => {
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(run)
    const off = driver.subscribe((e) => seen.push(e))
    driver.start()
    off()
    driver.drain()
    expect(seen.length).toBeLessThan(run.events.length)
  })

  it('(f) draining twice does not replay the stream a second time', () => {
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(run)
    driver.subscribe((e) => seen.push(e))
    driver.start()
    driver.drain()
    driver.drain()
    expect(seen).toHaveLength(run.events.length)
  })

  it('(g) two drivers over the same run emit identical streams (replay is pure)', () => {
    expect(JSON.stringify(collect(syntheticRun()))).toBe(JSON.stringify(collect(syntheticRun())))
  })
})

describe('[u2#c3] clock-gated release', () => {
  it('(h) a clock-stamped event is withheld until the sim clock reaches its stamp', () => {
    const run = syntheticRun()
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(run)
    driver.subscribe((e) => seen.push(e))
    driver.start()
    driver.advance(MS_PER_SIM_MIN) // 13:05 -> 13:06
    expect(seen.some((e) => e.type === 'beat_end')).toBe(false)
  })

  it('(i) advancing past the last stamp releases the rest of the stream', () => {
    const run = syntheticRun()
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(run)
    driver.subscribe((e) => seen.push(e))
    driver.start()
    driver.advance(MS_PER_SIM_MIN * 60)
    expect(seen).toEqual([...run.events])
  })
})

describe('[u2#c3] canned MembraneOp responses', () => {
  let run: FixtureRun

  beforeEach(() => {
    run = syntheticRun()
  })

  it('(j) every one of the 5 ops gets an answer from the canned set', () => {
    const driver = createFixtureDriver(run)
    driver.start()
    const ops: MembraneOp[] = [
      { op: 'slot', block_id: 'b-r1-f01', slot: 0 },
      { op: 'unslot', slot: 0 },
      { op: 'mine', sentence_id: 's-1' },
      { op: 'deploy', blocks: ['b-r1-f01'] },
      { op: 'new_run' },
    ]
    for (const op of ops) {
      expect(driver.send(op), `no canned response for '${op.op}'`).toMatchObject({ ok: true })
    }
  })

  it('(k) mine is acknowledged into the store (§5.4)', () => {
    const driver = createFixtureDriver(run)
    driver.start()
    driver.send({ op: 'mine', sentence_id: 's-1' })
    expect(driver.store().mined).toContain('s-1')
  })

  it('(l) slot/unslot move the block in and out of the store', () => {
    const driver = createFixtureDriver(run)
    driver.start()
    driver.send({ op: 'slot', block_id: 'b-r1-f01', slot: 0 })
    expect(driver.store().slots[0]).toBe('b-r1-f01')
    driver.send({ op: 'unslot', slot: 0 })
    expect(driver.store().slots[0] ?? null).toBeNull()
  })

  it('(m) deploy carries a SET — order is not preserved, content is (§5.2)', () => {
    const a = createFixtureDriver(syntheticRun())
    const b = createFixtureDriver(syntheticRun())
    a.start()
    b.start()
    a.send({ op: 'deploy', blocks: ['x', 'y', 'z'] })
    b.send({ op: 'deploy', blocks: ['z', 'y', 'x'] })
    expect(a.store().deployed).toEqual(b.store().deployed)
  })

  it('(n) an op the script does not expect is refused, not silently accepted', () => {
    const bare = syntheticRun()
    bare.responses = { mine: { ok: true } }
    const driver = createFixtureDriver(bare)
    driver.start()
    expect(() => driver.send({ op: 'new_run' })).toThrow(/new_run/)
  })

  it('(o) sending before start() is refused', () => {
    const driver = createFixtureDriver(run)
    expect(() => driver.send({ op: 'mine', sentence_id: 's-1' })).toThrow()
  })
})

describe('[u2#c9] fixture content stays out of this unit', () => {
  const FIXTURES = path.join(REPO, 'src/client/driver/fixtures')

  it('(p) fixtures/ holds only the shape module and the minimal synthetic stream', () => {
    const files = fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.ts')).sort()
    expect(files).toEqual(['minimal.ts', 'types.ts'])
  })

  it('(q) the minimal fixture carries no 우는다리 material', async () => {
    const source = fs.readFileSync(path.join(FIXTURES, 'minimal.ts'), 'utf8')
    expect(source, 'the 우는다리 fixture belongs to u2f').not.toContain('우는다리')
    expect(source.split('\n').length, 'minimal.ts is not minimal').toBeLessThan(120)
  })

  it('(r) the minimal fixture is a well-formed FixtureRun the driver can replay', async () => {
    const { minimalRun } = (await import('../../src/client/driver/fixtures/minimal.ts')) as {
      minimalRun: FixtureRun
    }
    expect(Array.isArray(minimalRun.events)).toBe(true)
    expect(minimalRun.events.length).toBeGreaterThan(0)
    expect(collect(minimalRun)).toEqual([...minimalRun.events])
  })
})
