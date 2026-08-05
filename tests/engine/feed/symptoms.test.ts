// [e4#A3] — contract-engine-composer §8-9: symptom lines carry **no** id.
// "A symptom that becomes minable is a regression, not a feature." Symptoms are
// authored fixed sentences: identical every run, so mining one carries no
// information, and I12 already forbids their numeric source from surfacing.
import { describe, it, expect } from 'vitest'

import { isMintedSentenceId } from '../../../src/shared/id.ts'
import { createIdAllocator, buildFeed } from '../../../src/engine/feed/index.ts'
import { GOLDEN_BEAT, SYMPTOM, CLOCK } from './__fixtures__/beat.ts'

const symptomLines = (beat = GOLDEN_BEAT, run = 1) =>
  buildFeed(beat, createIdAllocator(run)).lines.filter((l) => l.kind === 'symptom')

describe('[e4#A3] a beat whose effects move a variable emits idless symptom lines', () => {
  it('(a) the beat emits at least one kind:"symptom" line', () => {
    expect(symptomLines().map((l) => l.text)).toEqual([SYMPTOM])
  })

  it('(b) every symptom line has sentence_id === undefined', () => {
    for (const line of symptomLines()) {
      expect(line.sentence_id).toBeUndefined()
    }
  })

  it('(c) no symptom line carries a minted id under any name', () => {
    for (const line of symptomLines()) {
      const values = Object.values(line).filter((v): v is string => typeof v === 'string')
      expect(values.filter((v) => isMintedSentenceId(v))).toEqual([])
    }
  })

  it('(d) symptoms are not minable, but the rest of the beat still is (the control)', () => {
    const lines = buildFeed(GOLDEN_BEAT, createIdAllocator(1)).lines
    const withIds = lines.filter((l) => l.sentence_id !== undefined)
    expect(withIds.length).toBeGreaterThan(0)
    expect(withIds.some((l) => l.kind === 'symptom')).toBe(false)
  })

  it('(e) symptom lines still carry the beat clock — only the id is absent', () => {
    for (const line of symptomLines()) expect(line.clock).toBe(CLOCK)
  })

  it('(f) multiple symptoms all stay idless and keep renderSymptoms order', () => {
    const beat = { ...GOLDEN_BEAT, symptoms: ['첫 번째 징후.', '두 번째 징후.'] }
    const lines = symptomLines(beat)
    expect(lines.map((l) => l.text)).toEqual(['첫 번째 징후.', '두 번째 징후.'])
    expect(lines.map((l) => l.sentence_id)).toEqual([undefined, undefined])
  })

  it('(g) a beat with no symptoms emits no symptom line and does not throw', () => {
    expect(symptomLines({ ...GOLDEN_BEAT, symptoms: [] })).toEqual([])
  })
})
