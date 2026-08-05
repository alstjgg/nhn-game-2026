// [e10] contract-engine-composer §8 criteria 2 and 3 — the view surface.
//
// A5/A6. Driven over the real 우는다리 pack through `viewRig()` (the beat driver
// wired to the pack's own state core), not a hand-built fixture: §8-2 asks for
// "a beat whose effect moves `trust`", and that pack's `gates.json` carries
// trust deltas on every bucket of G1.
import { describe, expect, it } from 'vitest'
import { viewRig } from './fixtures/rig.ts'
import type { ViewRig } from './fixtures/rig.ts'

/** `src/engine/state`'s sentinel for "this beat's journal moved nothing". */
const NO_CHANGE = '(변화 없음)'

/** Does this gate carry a bucket whose deltas move `trust`? */
function trustBucket(rig: ViewRig): { stance: string } | null {
  const beat = rig.schedule[rig.current().index]
  const gate = beat?.gate ?? null
  if (gate === null) return null
  for (const bucket of gate.buckets) {
    const moved = bucket.deltas?.['trust']
    if (typeof moved === 'number' && moved !== 0) {
      const stance = bucket.stances[0]
      if (stance !== undefined) return { stance }
    }
  }
  return null
}

/**
 * Walk the schedule to the first gate beat whose stance moves `trust`, leaving
 * the rig parked in phase `'stance'` on that beat. Every beat before it is
 * stepped with its authored default, so state arrives the way a real run does.
 */
function parkOnTrustGate(rig: ViewRig): { stance: string } {
  for (let guard = 0; guard < rig.schedule.length; guard += 1) {
    if (rig.phase() === 'stance') {
      const found = trustBucket(rig)
      if (found !== null) return found
      const gate = rig.schedule[rig.current().index]?.gate
      rig.submitStance({ stance: gate!.defaultStance, utterance: '' })
    }
    rig.applyBeatEffects()
    if (!rig.advance()) break
  }
  throw new Error('우는다리 carries no gate bucket that moves `trust` — fixture assumption 3 broke')
}

describe('§8-2 beatView() reflects this beat’s effects', () => {
  it('§8-2 a beat whose effect moves `trust` yields a non-(변화 없음) SCENE_SYMPTOMS', () => {
    const rig = viewRig()
    const { stance } = parkOnTrustGate(rig)

    rig.submitStance({ stance, utterance: '' })
    rig.applyBeatEffects()

    const symptoms = rig.beatView().SCENE_SYMPTOMS
    expect(symptoms.length).toBeGreaterThan(0)
    expect(symptoms).not.toEqual([NO_CHANGE])
  })

  it('§8-2 the pre-effect view fails — an implementation that served it would pass wrongly', () => {
    const rig = viewRig()
    const { stance } = parkOnTrustGate(rig)

    expect(() => rig.beatView(), 'before the stance').toThrow()
    rig.submitStance({ stance, utterance: '' })
    expect(() => rig.beatView(), 'after the stance, before the effects').toThrow()
  })

  it('§8-2 SCENE_SYMPTOMS is never empty, even on a beat that moves nothing', () => {
    const rig = viewRig()
    // Beat 0 of 우는다리 is a script beat; whether it moves state or not, the
    // renderer owes a sentence (§2.3-5).
    rig.applyBeatEffects()
    expect(rig.beatView().SCENE_SYMPTOMS.length).toBeGreaterThan(0)
  })
})

describe('§8-3 views are snapshots', () => {
  it('§8-3 mutating a GateView leaves the next view and engine state deep-equal', () => {
    const rig = viewRig()
    parkOnTrustGate(rig)

    const before = structuredClone(rig.gateView())
    const stateBefore = structuredClone(rig.snapshot())

    const escaped = rig.gateView()
    escaped.GATE_QUESTION = '오염된 질문'
    escaped.TIMELINE_EXCERPT.push('오염된 줄')
    escaped.STANCE_SET.push({ id: 'x', label: '오염' })
    ;(escaped.TEMPERAMENT as Record<string, unknown>)['default_disposition'] = '오염'

    expect(rig.gateView()).toEqual(before)
    expect(rig.snapshot()).toEqual(stateBefore)
  })

  it('§8-3 mutating a BeatView leaves the next view and engine state deep-equal', () => {
    const rig = viewRig()
    const { stance } = parkOnTrustGate(rig)
    rig.submitStance({ stance, utterance: '발화' })
    rig.applyBeatEffects()

    const before = structuredClone(rig.beatView())
    const stateBefore = structuredClone(rig.snapshot())

    const escaped = rig.beatView()
    escaped.AGENT_UTTERANCE = '오염된 발화'
    escaped.SCENE_SYMPTOMS.push('오염된 증상')
    escaped.TIMELINE_TAIL.push('오염된 줄')
    escaped.PRESENT_NPCS.push({ id: 'x', name: '오염', side: 'room' })

    expect(rig.beatView()).toEqual(before)
    expect(rig.snapshot()).toEqual(stateBefore)
  })

  it('§8-3 two calls to the same view hand back distinct objects, not one shared handle', () => {
    const rig = viewRig()
    parkOnTrustGate(rig)
    const a = rig.gateView()
    const b = rig.gateView()
    expect(a).not.toBe(b)
    expect(a.STANCE_SET).not.toBe(b.STANCE_SET)
    expect(a.TEMPERAMENT).not.toBe(b.TEMPERAMENT)
  })
})
