// [e10] contract-engine-composer §8 criteria 8 and 9 — the minted id surface.
//
// A11/A12. The channel letter is not decoration: it says which call produced
// the sentence, and archive highlighting is keyed on the whole id. §8-9 is the
// negative half — a symptom that became minable is a regression, not a feature.
import { beforeAll, describe, expect, it } from 'vitest'
import { driveRound } from './fixtures/rig.ts'
import type { Driven } from './fixtures/rig.ts'

/** §8-8's grammar, verbatim. `t*` script ids are a separate family. */
const MINTED = /^b-r\d+-[fbnqu]\d{2}$/
const AUTHORED = /^t\d+$/

/** Which channel letter each generated feed kind must carry. */
const CHANNEL_OF_KIND: Record<string, string> = {
  radio: 'u', // Call 1 `utterance`
  npc: 'q', // Call 2 `npc_lines`
  event: 'n', // Call 2 `timeline_entries` — authored events are handled apart
}

const channelOf = (id: string) => id.slice(id.lastIndexOf('-') + 1, id.lastIndexOf('-') + 2)

let driven: Driven
let second: Driven

beforeAll(async () => {
  driven = await driveRound()
  second = await driveRound()
})

/** Every `{ type: 'report' }` event's two minted families. */
function reportSentences(run: Driven) {
  const facts: { id: string; text: string }[] = []
  const body: { id: string; text: string }[] = []
  for (const event of run.events) {
    if (event.type !== 'report') continue
    facts.push(...(event.facts as { id: string; text: string }[]))
    body.push(...(event.report_body as { id: string; text: string }[]))
  }
  return { facts, body }
}

describe('§8-8 every generated feed line carries a well-formed, engine-minted id', () => {
  it('§8-8 the run generated lines on every channel — the census is not vacuous', () => {
    const kinds = new Set(driven.feed.map((line) => line.kind))
    expect(kinds).toContain('radio')
    expect(kinds).toContain('npc')
    expect(kinds).toContain('event')
    const { facts, body } = reportSentences(driven)
    expect(facts.length).toBeGreaterThan(0)
    expect(body.length).toBeGreaterThan(0)
  })

  it('§8-8 every Call 1·2 feed line matches the grammar with its producing channel', () => {
    for (const line of driven.feed) {
      if (!(line.kind in CHANNEL_OF_KIND)) continue
      const id = line.sentence_id
      expect(id, `${line.kind} line has no id: ${line.text}`).toBeDefined()
      if (line.kind === 'event' && AUTHORED.test(id!)) continue // authored script line
      expect(id, `${line.kind}: ${id}`).toMatch(MINTED)
      expect(channelOf(id!), `${line.kind}: ${id}`).toBe(CHANNEL_OF_KIND[line.kind])
    }
  })

  it('§8-8 the run emits no feed kind this census does not cover', () => {
    const covered = new Set([...Object.keys(CHANNEL_OF_KIND), 'symptom'])
    const uncovered = [...new Set(driven.feed.map((line) => line.kind))].filter(
      (kind) => !covered.has(kind),
    )
    expect(uncovered, 'an uncovered kind would slip past the id grammar').toEqual([])
  })

  it('§8-8 Call 3 facts mint on `f` and the report body on `b`', () => {
    const { facts, body } = reportSentences(driven)
    for (const sentence of facts) {
      expect(sentence.id).toMatch(MINTED)
      expect(channelOf(sentence.id)).toBe('f')
    }
    for (const sentence of body) {
      expect(sentence.id).toMatch(MINTED)
      expect(channelOf(sentence.id)).toBe('b')
    }
  })

  it('§8-8 no id is minted twice in one run', () => {
    const { facts, body } = reportSentences(driven)
    const ids = [
      ...driven.feed.map((line) => line.sentence_id),
      ...facts.map((sentence) => sentence.id),
      ...body.map((sentence) => sentence.id),
    ].filter((id): id is string => typeof id === 'string')
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('§8-8 every minted id names the same run', () => {
    const runs = new Set(
      driven.feed
        .map((line) => line.sentence_id)
        .filter((id): id is string => typeof id === 'string' && MINTED.test(id))
        .map((id) => id.split('-')[1]),
    )
    expect([...runs]).toEqual(['r1'])
  })

  it('§8-8 authored script lines carry their `t*` id unchanged across two runs', () => {
    const authored = (run: Driven) =>
      run.feed
        .map((line) => line.sentence_id)
        .filter((id): id is string => typeof id === 'string' && AUTHORED.test(id))
    expect(authored(driven).length).toBeGreaterThan(0)
    expect(authored(second)).toEqual(authored(driven))
  })

  it('§8-8 the two runs agree on every id, in order — the allocator is per-run, not global', () => {
    const ids = (run: Driven) => run.feed.map((line) => line.sentence_id ?? null)
    expect(ids(second)).toEqual(ids(driven))
  })
})

describe('§8-9 symptom lines carry no id', () => {
  it('§8-9 a symptom line from an effect-bearing beat has sentence_id === undefined', () => {
    const symptoms = driven.feed.filter((line) => line.kind === 'symptom')
    expect(symptoms.length, 'the run rendered no symptom to check').toBeGreaterThan(0)
    for (const line of symptoms) {
      expect(line.sentence_id, `minable symptom: ${line.text}`).toBeUndefined()
    }
  })

  it('§8-9 the absence is structural — the key is missing, not set to undefined', () => {
    for (const line of driven.feed) {
      if (line.kind !== 'symptom') continue
      expect('sentence_id' in line, `symptom carries the key: ${line.text}`).toBe(false)
    }
  })

  it('§8-9 the allocator minted nothing on the symptom beats — counts agree across two runs', () => {
    const count = (run: Driven) => run.feed.filter((line) => line.kind === 'symptom').length
    expect(count(second)).toBe(count(driven))
  })
})
