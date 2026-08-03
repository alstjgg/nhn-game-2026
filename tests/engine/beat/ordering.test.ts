// [e3] A1–A5 — the two ordering invariants (spec-engine §4.1 · §4.2), asserted
// on the injected recording double's ORDERED LOG, not on the outcome.
import { describe, it, expect } from 'vitest'
import { evaluateEdges } from '../../../src/engine/beat/predicates.ts'
import { BeatPhaseError } from '../../../src/engine/beat/errors.ts'
import { createRecordingState, firstReadIndex } from './recording-double.ts'
import { rig } from './harness.ts'
import { TRUST_SEED, multiEventPack, nullEffectsPack, trustPack } from './fixtures/packs.ts'

describe('[e3#A1] delta-before-predicate — proven by call order', () => {
  it('logs applyDeltas BEFORE the first state read made by predicate evaluation', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u' })

    const deltaIdx = r.state.firstIndex('applyDeltas')
    const readIdx = firstReadIndex(r.state)

    expect(deltaIdx, 'applyDeltas never reached the state core').toBeGreaterThanOrEqual(0)
    expect(readIdx, 'the double logged no state read — the assertion would be vacuous').toBeGreaterThanOrEqual(0)
    expect(deltaIdx).toBeLessThan(readIdx)
  })

  it('runs the §4.1 chain as applyDeltas → applyFlags → reads, with no read before the deltas', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u' })

    const ops = r.state.ops()
    expect(ops[0]).toBe('applyDeltas')
    expect(ops[1]).toBe('applyFlags')
    expect(ops.slice(2)).toContain('read')
  })

  it('reads the routing variable through the injected port (so the log can see it)', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    expect(r.state.entries('read').map((e) => e.args[0])).toContain('trust')
  })
})

describe('[e3#A2] the ordering changes the route, not just the log', () => {
  it('returns the UPDATED-state branch (trust 50 +15 >= 55 → n_trusted)', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    const out = r.driver.submitStance({ stance: 'a', utterance: 'u' })
    expect(out.bucketId).toBe('heard')
    expect(out.nextNode).toBe('n_trusted')
  })

  it('a PRE-delta evaluation of the same compiled edges returns n_plain — the fixture cannot rot', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    const edges = r.schedule[0]!.gate!.edges
    const pristine = createRecordingState({ ...TRUST_SEED })
    expect(evaluateEdges(edges, pristine)).toBe('n_plain')

    const r2 = rig(trustPack(), { ...TRUST_SEED })
    expect(r2.driver.submitStance({ stance: 'a', utterance: 'u' }).nextNode).toBe('n_trusted')
  })

  it('the other stance routes to the else branch — the predicate really is state-dependent', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    const out = r.driver.submitStance({ stance: 'b', utterance: 'u' })
    expect(out.bucketId).toBe('pressed')
    expect(out.nextNode).toBe('n_plain')
  })
})

describe('[e3#A3] effects land before Call 2 (§4.2)', () => {
  it('logs applyDeltas → applyFlags → journal → renderSymptoms, in that order, for a script beat', () => {
    const r = rig(multiEventPack())
    expect(r.state.log, 'nothing may touch state before applyBeatEffects').toHaveLength(0)

    r.driver.applyBeatEffects()

    const ops = r.state.ops()
    expect(ops.filter((o) => o === 'journal')).toHaveLength(1)
    expect(ops.filter((o) => o === 'renderSymptoms')).toHaveLength(1)
    expect(r.state.lastIndex('applyDeltas')).toBeLessThan(r.state.firstIndex('journal'))
    expect(r.state.lastIndex('applyFlags')).toBeLessThan(r.state.firstIndex('journal'))
    expect(r.state.firstIndex('journal')).toBeLessThan(r.state.firstIndex('renderSymptoms'))
  })

  it('the narration step (Call 2) is appended only after every effect op has landed', () => {
    const r = rig(multiEventPack())
    const before = r.driver.steps().filter((s) => s.kind === 'narration')
    expect(before).toHaveLength(0)

    r.driver.applyBeatEffects()

    const after = r.driver.steps().filter((s) => s.kind === 'narration')
    expect(after).toHaveLength(1)
    expect(after[0]!.beat).toBe(0)
    // The whole effect chain was already on the log when Call 2 became reachable.
    expect(r.state.ops()).toEqual([
      'applyDeltas',
      'applyFlags',
      'applyDeltas',
      'applyFlags',
      'journal',
      'renderSymptoms',
    ])
  })

  it('beatView (the Call-2 payload) is unreachable until the effects have been applied', () => {
    const r = rig(multiEventPack())
    expect(() => r.driver.beatView()).toThrow(BeatPhaseError)
    r.driver.applyBeatEffects()
    expect(() => r.driver.beatView()).not.toThrow()
  })

  it('building the Call-2 payload adds no further state ops — symptoms were rendered in the chain', () => {
    const r = rig(multiEventPack())
    r.driver.applyBeatEffects()
    const len = r.state.log.length
    r.driver.beatView()
    expect(r.state.log.length).toBe(len)
  })

  it('on a gate beat the §4.1 chain completes before the §4.2 chain starts, neither interleaved', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    const afterStance = r.state.log.length
    r.driver.applyBeatEffects()

    const tail = r.state.ops().slice(afterStance)
    expect(tail[tail.length - 2]).toBe('journal')
    expect(tail[tail.length - 1]).toBe('renderSymptoms')
    expect(r.state.ops().slice(0, afterStance)).not.toContain('journal')
  })
})

describe('[e3#A4] multi-event beats apply in events[] array order', () => {
  it('applies t4 then t5 at the shared 10:40 clock', () => {
    const r = rig(multiEventPack())
    r.driver.applyBeatEffects()

    const deltas = r.state.entries('applyDeltas').map((e) => e.args[0])
    expect(deltas).toEqual([{ alpha: 1 }, { beta: 2 }])

    const flags = r.state.entries('applyFlags').map((e) => e.args[0])
    expect(flags).toEqual([{ fa: true }, { fb: true }])
  })

  it('each event applies its own deltas before its own flags', () => {
    const r = rig(multiEventPack())
    r.driver.applyBeatEffects()
    expect(r.state.ops().slice(0, 4)).toEqual(['applyDeltas', 'applyFlags', 'applyDeltas', 'applyFlags'])
  })

  it('groups both events into ONE beat, not two', () => {
    const r = rig(multiEventPack())
    expect(r.schedule).toHaveLength(1)
    expect(r.schedule[0]!.events.map((e) => e.id)).toEqual(['t4', 't5'])
    expect(r.driver.advance()).toBe(false)
  })
})

describe('[e3#A5] effects === null', () => {
  it('makes zero applyDeltas / applyFlags calls', () => {
    const r = rig(nullEffectsPack())
    r.driver.applyBeatEffects()
    expect(r.state.entries('applyDeltas')).toHaveLength(0)
    expect(r.state.entries('applyFlags')).toHaveLength(0)
  })

  it('still renders symptoms and still reaches Call 2', () => {
    const r = rig(nullEffectsPack(), {}, ['(변화 없음)'])
    r.driver.applyBeatEffects()
    expect(r.state.entries('renderSymptoms')).toHaveLength(1)
    expect(r.driver.steps().filter((s) => s.kind === 'narration')).toHaveLength(1)
    expect(r.driver.beatView().SCENE_SYMPTOMS).toEqual(['(변화 없음)'])
  })

  it('leaves the state core untouched', () => {
    const r = rig(nullEffectsPack(), { trust: 50 })
    r.driver.applyBeatEffects()
    expect(r.state.peek()).toEqual({ trust: 50 })
  })
})

describe('[e3] phase machine — wrong-phase calls throw (design D-D)', () => {
  it('a gate beat starts in phase stance; a script beat starts in phase effects', () => {
    expect(rig(trustPack(), { ...TRUST_SEED }).driver.phase()).toBe('stance')
    expect(rig(multiEventPack()).driver.phase()).toBe('effects')
  })

  it('applyBeatEffects before the stance throws on a gate beat', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    expect(() => r.driver.applyBeatEffects()).toThrow(BeatPhaseError)
  })

  it('submitStance on a script beat throws', () => {
    const r = rig(multiEventPack())
    expect(() => r.driver.submitStance({ stance: 'a', utterance: 'u' })).toThrow(BeatPhaseError)
  })

  it('gateView on a script beat throws', () => {
    const r = rig(multiEventPack())
    expect(() => r.driver.gateView()).toThrow(BeatPhaseError)
  })

  it('submitStance twice on the same beat throws', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    expect(() => r.driver.submitStance({ stance: 'a', utterance: 'u' })).toThrow(BeatPhaseError)
  })

  it('advance() returns false on the last beat and leaves phase done', () => {
    const r = rig(nullEffectsPack())
    r.driver.applyBeatEffects()
    expect(r.driver.advance()).toBe(false)
    expect(r.driver.phase()).toBe('done')
  })
})

describe('[e3] AGENT_UTTERANCE comes from the caller, and is empty on a script beat', () => {
  it('carries the gate beat utterance into the Call-2 payload', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: '들어보겠습니다' })
    r.driver.applyBeatEffects()
    expect(r.driver.beatView().AGENT_UTTERANCE).toBe('들어보겠습니다')
  })

  it('is the empty string on a script beat', () => {
    const r = rig(multiEventPack())
    r.driver.applyBeatEffects()
    expect(r.driver.beatView().AGENT_UTTERANCE).toBe('')
  })
})
