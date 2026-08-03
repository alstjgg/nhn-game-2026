// [e8#A7] + [e8#A8] — D5 schema conformance. The emitted meta-state validates
// against data/runs/_schema/meta-state.schema.json via the generic walker in
// ./schema.ts (PRD §4: validate against the schema, do not hand-roll the shape),
// and the walker is proved non-vacuous by negative controls.
import { describe, it, expect } from 'vitest'
import type { Block } from '../../src/shared/contracts.ts'
import type { MetaState } from '../../src/runloop/index.ts'
import { createMemoryMetaStore, createRunLoop, emptyMetaState } from '../../src/runloop/index.ts'
import { loadSchema, validate, validateMetaState } from './schema.ts'

const SLUG = 'dday-demo'
const b1: Block = { id: 'blk-alpha', text: '증인은 도착 시각을 기억한다' }

function loop() {
  return createRunLoop({ store: createMemoryMetaStore(), packSlug: SLUG, totalRuns: 4 })
}

/** A conforming baseline to mutate in the negative controls. */
function baseline(): MetaState {
  const rl = loop()
  rl.startRun()
  return rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })
}

describe('[e8#A7] the emitted meta-state conforms to meta-state.schema.json', () => {
  it('(a) the walker implements every keyword the schema uses', () => {
    const { unimplemented } = validateMetaState(emptyMetaState(SLUG))
    expect(unimplemented).toEqual([])
  })

  it('(b) after 0 runs', () => {
    const res = validateMetaState(loop().current())
    expect(res.errors).toEqual([])
    expect(res.unimplemented).toEqual([])
  })

  it('(c) after 1 run', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })
    const res = validateMetaState(rl.current())
    expect(res.errors).toEqual([])
    expect(res.unimplemented).toEqual([])
  })

  it('(d) after 2 runs', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })
    rl.startRun()
    rl.endRun({ runId: 'run-0002', reachedClock: '21:04+', carried: [] })
    const res = validateMetaState(rl.current())
    expect(res.errors).toEqual([])
    expect(res.unimplemented).toEqual([])
    expect(rl.current().exposure_clock_reached).toBe('21:04+')
  })

  it('(e) an unmeasured run still conforms — null, not a fabricated 0', () => {
    const rl = loop()
    rl.startRun()
    const state = rl.endRun({ runId: 'run-0001', reachedClock: null, carried: [] })
    expect(validateMetaState(state).errors).toEqual([])
    expect(state.exposure_clock_reached).toBeNull()
  })

  it('(f) emptyMetaState() is itself schema-valid and carries no extra keys', () => {
    const s = emptyMetaState(SLUG)
    expect(validateMetaState(s).errors).toEqual([])
    expect(Object.keys(s).sort()).toEqual(
      ['carried_blocks', 'exposure_clock_reached', 'pack_slug', 'report_archive', 'run_count'].sort(),
    )
  })
})

describe('[e8#A8] negative controls — the walker is not vacuous', () => {
  const REJECTED: [label: string, mutate: (s: MetaState) => unknown][] = [
    ['exposure_clock_reached: 0 (unmeasurable fabricated as zero)', (s) => ({ ...s, exposure_clock_reached: 0 })],
    ['exposure_clock_reached: "" ', (s) => ({ ...s, exposure_clock_reached: '' })],
    ['exposure_clock_reached: "24:00" (off-pattern)', (s) => ({ ...s, exposure_clock_reached: '24:00' })],
    ['an extra top-level key', (s) => ({ ...s, total_runs: 4 })],
    ['a block with an empty id', (s) => ({ ...s, carried_blocks: [{ id: '', text: 'x' }] })],
    ['a block with an extra key', (s) => ({ ...s, carried_blocks: [{ id: 'a', text: 'x', slot: 1 }] })],
    ['run_count: -1', (s) => ({ ...s, run_count: -1 })],
    ['run_count: 1.5 (non-integer)', (s) => ({ ...s, run_count: 1.5 })],
    ['run_count as a string', (s) => ({ ...s, run_count: '1' })],
    ['pack_slug: ""', (s) => ({ ...s, pack_slug: '' })],
    ['a missing required field', ({ run_count: _drop, ...rest }) => rest],
    ['report_archive holding a non-string', (s) => ({ ...s, report_archive: [1] })],
    ['report_archive holding ""', (s) => ({ ...s, report_archive: [''] })],
    ['carried_blocks as an object', (s) => ({ ...s, carried_blocks: {} })],
  ]

  it('(a) the baseline it mutates is itself valid', () => {
    expect(validateMetaState(baseline()).errors).toEqual([])
  })

  it.each(REJECTED)('(b) rejects: %s', (_label, mutate) => {
    const res = validateMetaState(mutate(baseline()))
    expect(res.errors.length, 'walker accepted an invalid meta-state').toBeGreaterThan(0)
    expect(res.unimplemented).toEqual([])
  })

  it('(c) an unknown keyword in a schema is reported, never silently skipped', () => {
    const res = validate({ type: 'object', properties: { a: { type: 'string', maxLength: 2 } } }, { a: 'abc' })
    expect(res.unimplemented.join('\n')).toMatch(/maxLength/)
  })

  it('(d) the on-disk schema is the source of truth this suite reads', () => {
    const schema = loadSchema() as { required: string[]; additionalProperties: boolean }
    expect(schema.required.sort()).toEqual(
      ['carried_blocks', 'exposure_clock_reached', 'pack_slug', 'report_archive', 'run_count'].sort(),
    )
    expect(schema.additionalProperties).toBe(false)
  })
})
