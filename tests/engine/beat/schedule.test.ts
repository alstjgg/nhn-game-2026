// [e3] A6 · A7 — the beat schedule (timeline.json × gate clocks) and the round
// boundaries, against the FROZEN 우는다리 pack plus D1/D2/D3/D5/D6/D7 fixtures.
import { describe, it, expect } from 'vitest'
import { buildSchedule } from '../../../src/engine/beat/schedule.ts'
import { parseClock } from '../../../src/engine/beat/clock.ts'
import { ClockFormatError, PredicateSyntaxError, BeatPhaseError } from '../../../src/engine/beat/errors.ts'
import type { Timeline, Gates } from '../../../src/shared/datapack.ts'
import { beatAt, driveAll, rig } from './harness.ts'
import { ev, gate, pack, realPack, trustPack, TRUST_SEED } from './fixtures/packs.ts'

const real = realPack()
const schedule = buildSchedule(real.timeline, real.gates)

/** A7's pinned boundaries — [first clock … last clock] of each round. */
const ROUNDS: Array<{ clocks: string[] }> = [
  { clocks: ['09:25', '09:40', '10:40', '11:07'] },
  { clocks: ['11:30', '12:00', '13:05'] },
  { clocks: ['14:20', '15:10'] },
  { clocks: ['16:40'] },
  { clocks: ['17:30', '18:20'] },
  { clocks: ['19:10', '19:40'] },
  { clocks: ['20:10', '20:30', '21:04', '21:04+'] },
]

describe('[e3#D1/D2/D3] one clock tick = one beat; a gate absorbs its co-timed event', () => {
  it('turns 우는다리 19 events + 7 gates into 19 beats (18 event beats + 1 gate-only)', () => {
    expect(real.timeline.events).toHaveLength(19)
    expect(real.gates.gates).toHaveLength(7)
    expect(schedule).toHaveLength(19)
    expect(schedule.filter((b) => b.kind === 'gate')).toHaveLength(7)
  })

  it('groups the two 10:40 events into one beat, in events[] order (D1)', () => {
    const b = beatAt(schedule, '10:40')
    expect(b.events.map((e) => e.id)).toEqual(['t4', 't5'])
    expect(schedule.filter((x) => x.clock === '10:40')).toHaveLength(1)
  })

  it('absorbs G1 and t2 at 09:25 into a single gate beat (D2)', () => {
    const b = beatAt(schedule, '09:25')
    expect(b.kind).toBe('gate')
    expect(b.gate?.id).toBe('G1')
    expect(b.events.map((e) => e.id)).toEqual(['t2'])
  })

  it('gives G7 at 20:10 a gate-only beat with no events (D3)', () => {
    const b = beatAt(schedule, '20:10')
    expect(b.kind).toBe('gate')
    expect(b.gate?.id).toBe('G7')
    expect(b.events).toEqual([])
  })

  it('indexes beats 0..n-1 in clock order', () => {
    expect(schedule.map((b) => b.index)).toEqual(schedule.map((_, i) => i))
    const mins = schedule.map((b) => b.minutes)
    expect(mins).toEqual([...mins].sort((a, b) => a - b))
  })

  it('places every gate clock on a gate beat and nowhere else', () => {
    const gateClocks = real.gates.gates.map((g) => g.clock)
    expect(schedule.filter((b) => b.kind === 'gate').map((b) => b.clock)).toEqual(gateClocks)
  })
})

describe('[e3#D7] clock parsing and the 21:04+ tie-break', () => {
  it('parses HH:MM to minutes', () => {
    expect(parseClock('00:00')).toBe(0)
    expect(parseClock('08:50')).toBe(530)
    expect(parseClock('21:04')).toBe(1264)
  })

  it('gives a trailing + a +0.5 ordering weight', () => {
    expect(parseClock('21:04+')).toBe(1264.5)
    expect(parseClock('21:04+')).toBeGreaterThan(parseClock('21:04'))
  })

  it('throws ClockFormatError on garbage', () => {
    for (const bad of ['', '9:25', '21-04', 'noon', '21:04++', '25:00', '09:60']) {
      expect(() => parseClock(bad), bad).toThrow(ClockFormatError)
    }
  })

  it('sorts 21:04+ after 21:04 in the real schedule', () => {
    const i04 = schedule.findIndex((b) => b.clock === '21:04')
    const iPlus = schedule.findIndex((b) => b.clock === '21:04+')
    expect(i04).toBeGreaterThanOrEqual(0)
    expect(iPlus).toBe(i04 + 1)
    expect(iPlus).toBe(schedule.length - 1)
  })
})

describe('[e3#A6] a beat before the first gate belongs to no round', () => {
  it('gives 08:50 roundIndex null', () => {
    expect(beatAt(schedule, '08:50').roundIndex).toBeNull()
    expect(beatAt(schedule, '08:50').isRoundLast).toBe(false)
    expect(beatAt(schedule, '08:50').index).toBe(0)
  })

  it('is the ONLY beat with a null roundIndex', () => {
    expect(schedule.filter((b) => b.roundIndex === null).map((b) => b.clock)).toEqual(['08:50'])
  })

  it('makes roundView() throw on it', () => {
    const r = rig(real)
    expect(r.driver.current().clock).toBe('08:50')
    expect(() => r.driver.roundView()).toThrow(BeatPhaseError)
    r.driver.applyBeatEffects()
    expect(() => r.driver.roundView()).toThrow(BeatPhaseError)
  })

  it('emits no report step before the first gate', () => {
    const r = rig(real)
    r.driver.applyBeatEffects()
    expect(r.driver.steps().filter((s) => s.kind === 'report')).toHaveLength(0)
    r.driver.advance()
    expect(r.driver.current().clock).toBe('09:25')
    expect(r.driver.steps().filter((s) => s.kind === 'report')).toHaveLength(0)
  })
})

describe('[e3#A7] round boundary = just before the next gate', () => {
  it('assigns the pinned 우는다리 round membership', () => {
    ROUNDS.forEach((round, i) => {
      expect(
        schedule.filter((b) => b.roundIndex === i).map((b) => b.clock),
        `round ${i}`,
      ).toEqual(round.clocks)
    })
    expect(Math.max(...schedule.map((b) => b.roundIndex ?? -1))).toBe(6)
  })

  it('marks exactly one isRoundLast beat per round, at the round s last clock', () => {
    expect(schedule.filter((b) => b.isRoundLast).map((b) => b.clock)).toEqual(
      ROUNDS.map((r) => r.clocks[r.clocks.length - 1]!),
    )
  })

  it('emits exactly 7 report steps, one per round, immediately after that round s last beat', () => {
    const r = rig(real)
    driveAll(r)
    const reports = r.driver.steps().filter((s) => s.kind === 'report')
    expect(reports).toHaveLength(7)
    expect(reports.map((s) => (s as { round: number }).round)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(reports.map((s) => s.beat)).toEqual(
      ROUNDS.map((round) => beatAt(schedule, round.clocks[round.clocks.length - 1]!).index),
    )
  })

  it('emits no report step before 09:25', () => {
    const r = rig(real)
    driveAll(r)
    const firstGateIndex = beatAt(schedule, '09:25').index
    const early = r.driver.steps().filter((s) => s.kind === 'report' && s.beat < firstGateIndex)
    expect(early).toHaveLength(0)
  })

  it('puts each report step after that beat s narration step and before the next beat s steps', () => {
    const r = rig(real)
    driveAll(r)
    const steps = r.driver.steps()
    for (let i = 0; i < steps.length; i += 1) {
      const s = steps[i]!
      if (s.kind !== 'report') continue
      const prev = steps[i - 1]
      expect(prev?.kind).toBe('narration')
      expect(prev?.beat).toBe(s.beat)
      const next = steps[i + 1]
      if (next) expect(next.beat).toBeGreaterThan(s.beat)
    }
  })

  it('emits one judgment step per gate beat, 7 in all, before that beat s narration step', () => {
    const r = rig(real)
    driveAll(r)
    const steps = r.driver.steps()
    const judgments = steps.filter((s) => s.kind === 'judgment')
    expect(judgments).toHaveLength(7)
    expect(judgments.map((s) => s.beat)).toEqual(
      schedule.filter((b) => b.kind === 'gate').map((b) => b.index),
    )
    for (const j of judgments) {
      const narrationIdx = steps.findIndex((s) => s.kind === 'narration' && s.beat === j.beat)
      expect(steps.indexOf(j)).toBeLessThan(narrationIdx)
    }
  })

  it('emits one narration step per beat, 19 in all (§3.1: script beats run Call 2 without exception)', () => {
    const r = rig(real)
    driveAll(r)
    const narration = r.driver.steps().filter((s) => s.kind === 'narration')
    expect(narration.map((s) => s.beat)).toEqual(schedule.map((b) => b.index))
  })

  it('makes roundView() legal only on the round s last beat', () => {
    const r = rig(real)
    const seen: Array<{ clock: string; ok: boolean }> = []
    driveAll(r, (driver, beat) => {
      let ok = true
      try {
        driver.roundView()
      } catch {
        ok = false
      }
      seen.push({ clock: beat.clock, ok })
    })
    expect(seen.filter((s) => s.ok).map((s) => s.clock)).toEqual(
      ROUNDS.map((round) => round.clocks[round.clocks.length - 1]!),
    )
  })
})

describe('[e3#D5/D6] edge predicates compile at schedule-build time', () => {
  const one = (predicates: string[]): Gates => ({ gates: [gate('G1', '09:00', { edge_predicates: predicates })] })
  const line: Timeline = { events: [ev('x1', '09:00')] }

  it('an empty array compiles to zero edges and routes to null (D5)', () => {
    const s = buildSchedule(line, one([]))
    expect(s[0]!.gate!.edges).toEqual([])
    const r = rig(pack([ev('x1', '09:00')], [gate('G1', '09:00', { edge_predicates: [] })]))
    expect(r.driver.submitStance({ stance: 'a', utterance: 'u' }).nextNode).toBeNull()
  })

  it('all seven 우는다리 gates ship empty edge_predicates', () => {
    expect(schedule.filter((b) => b.kind === 'gate').map((b) => b.gate!.edges)).toEqual([[], [], [], [], [], [], []])
  })

  it('parses the five comparison operators plus <flag> == true', () => {
    const s = buildSchedule(
      line,
      one(['trust >= 55 -> n1', 'trust <= 10 -> n2', 'fear > 3 -> n3', 'fear < 1 -> n4', 'trust == 0 -> n5', 'sealed == true -> n6', 'else -> n7']),
    )
    expect(s[0]!.gate!.edges).toEqual([
      { kind: 'cmp', variable: 'trust', op: '>=', value: 55, node: 'n1' },
      { kind: 'cmp', variable: 'trust', op: '<=', value: 10, node: 'n2' },
      { kind: 'cmp', variable: 'fear', op: '>', value: 3, node: 'n3' },
      { kind: 'cmp', variable: 'fear', op: '<', value: 1, node: 'n4' },
      { kind: 'cmp', variable: 'trust', op: '==', value: 0, node: 'n5' },
      { kind: 'flag', flag: 'sealed', node: 'n6' },
      { kind: 'else', node: 'n7' },
    ])
  })

  it('throws PredicateSyntaxError at build time when else is missing from a non-empty array (D5)', () => {
    expect(() => buildSchedule(line, one(['trust >= 55 -> n1']))).toThrow(PredicateSyntaxError)
  })

  it('throws PredicateSyntaxError at build time on an unparseable line (D6)', () => {
    for (const bad of ['trust >= 55 and fear < 3 -> n1', 'trust ~ 55 -> n1', 'trust >= five -> n1', 'n1']) {
      expect(() => buildSchedule(line, one([bad, 'else -> n2'])), bad).toThrow(PredicateSyntaxError)
    }
  })

  it('rejects an else that is not the last line', () => {
    expect(() => buildSchedule(line, one(['else -> n1', 'trust >= 55 -> n2']))).toThrow(PredicateSyntaxError)
  })

  it('evaluates first-true, top to bottom', () => {
    const p = pack(
      [ev('x1', '09:00')],
      [
        gate('G1', '09:00', {
          buckets: [{ id: 'b1', stances: ['a'], deltas: { trust: 1 }, flags: {} }],
          edge_predicates: ['trust >= 10 -> high', 'trust >= 5 -> mid', 'else -> low'],
        }),
      ],
    )
    expect(rig(p, { trust: 20 }).driver.submitStance({ stance: 'a', utterance: '' }).nextNode).toBe('high')
    expect(rig(p, { trust: 5 }).driver.submitStance({ stance: 'a', utterance: '' }).nextNode).toBe('mid')
    expect(rig(p, { trust: 0 }).driver.submitStance({ stance: 'a', utterance: '' }).nextNode).toBe('low')
  })

  it('throws when the submitted stance resolves to no bucket', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    expect(() => r.driver.submitStance({ stance: 'zzz', utterance: '' })).toThrow()
  })
})
