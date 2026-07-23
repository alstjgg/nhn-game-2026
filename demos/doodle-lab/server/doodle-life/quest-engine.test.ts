import { describe, expect, it } from 'vitest'

import type { NpcReaction } from '../../src/doodle-life/contracts.ts'
import {
  applyResolution,
  evaluateQuest,
  lockQuest,
  questContractHash,
  resolveEncounter,
  validReadingAffordances,
  validateGeneratedGarden,
} from './quest-engine.ts'
import { sosoQuest, tutorialGarden, tutorialReading } from './tutorial-fixture.ts'

describe('locked quest engine', () => {
  it('accepts the three distinct residents and three solvable tutorial quests', () => {
    const garden = validateGeneratedGarden(tutorialGarden())
    expect(garden.world.residents).toHaveLength(3)
    expect(garden.quests).toHaveLength(3)
    expect(new Set(garden.world.residents.map((resident) => resident.silhouetteFamily)).size).toBe(3)
  })

  it('locks a canonical SHA-256 contract without changing after evaluation', () => {
    const locked = lockQuest(sosoQuest())
    const before = locked.hash
    evaluateQuest(locked.contract, tutorialReading('full'), 'doodle_hash')
    expect(questContractHash(locked.contract)).toBe(before)
    expect(before).toMatch(/^[a-f0-9]{64}$/)
    expect(Object.isFrozen(locked.contract)).toBe(true)
  })

  it.each([
    ['full', 'full'],
    ['success', 'success'],
    ['partial', 'partial'],
    ['unexpected', 'unexpected'],
  ] as const)('deterministically resolves the %s golden reading', (fixture, verdict) => {
    const first = evaluateQuest(sosoQuest(), tutorialReading(fixture), `doodle_${fixture}`)
    const second = evaluateQuest(sosoQuest(), tutorialReading(fixture), `doodle_${fixture}`)
    expect(first).toEqual(second)
    expect(first.verdict).toBe(verdict)
  })

  it('accepts a second visual solution family for the same locked request', () => {
    const reading = structuredClone(tutorialReading('full'))
    const reach = reading.visibleFeatures.find((feature) => feature.id === 'wide_membrane')
    if (!reach) throw new Error('fixture is missing its reach feature')
    reach.affordances = ['stretch']
    const result = evaluateQuest(sosoQuest(), reading, 'doodle_stretch_echo')
    expect(result.verdict).toBe('full')
    expect(result.matchedPrimarySolution).toBe(1)
  })

  it('does not use affordances whose evidence rectangle leaves the image', () => {
    const reading = structuredClone(tutorialReading('full'))
    const feature = reading.visibleFeatures[0]
    if (!feature) throw new Error('fixture feature is missing')
    feature.region = { x: 0.8, y: 0.2, width: 0.4, height: 0.3 }
    expect(validReadingAffordances(reading)).not.toContain('glide')
    expect(evaluateQuest(sosoQuest(), reading, 'doodle_oob').verdict).toBe('partial')
  })

  it('applies only the effects selected from the locked outcome', () => {
    const garden = tutorialGarden()
    const reading = tutorialReading('success')
    const result = evaluateQuest(sosoQuest(), reading, 'doodle_apply')
    const applied = applyResolution(garden.world, sosoQuest(), reading, 'sha-success', result)
    expect(applied.world.revision).toBe(1)
    expect(applied.world.records).toContainEqual(applied.record)
    expect(applied.world.creatures[0]).toMatchObject({ id: 'doodle_apply', verdict: 'success' })
    expect(applied.world.props.find((prop) => prop.id === 'far_bell')?.state).toBe('세 번째 소리까지 도착')
  })

  it('discards unknown prop commands and keeps a bounded fallback-safe scene', () => {
    const garden = tutorialGarden()
    const reading = tutorialReading('success')
    const result = evaluateQuest(sosoQuest(), reading, 'doodle_resolver')
    const invalid: NpcReaction = {
      actorId: 'npc_soso',
      emotion: 'relieved',
      grounding: '고정 결과에 반응한다.',
      commands: [
        { kind: 'prop-motion', actorId: 'npc_soso', targetId: 'missing_prop', motion: 'ring' },
        { kind: 'speak', actorId: 'npc_soso', text: '마지막 소리가 왔어.' },
      ],
    }
    const scene = resolveEncounter(garden.world, sosoQuest(), result, [
      { expectedActorId: 'npc_soso', value: invalid },
      { expectedActorId: 'npc_dari', value: null },
    ])
    expect(scene.discardedCommandCount).toBe(1)
    expect(scene.commands).not.toContainEqual(expect.objectContaining({ targetId: 'missing_prop' }))
    expect(scene.fallbackActorIds).toContain('npc_dari')
    expect(scene.participantIds).toHaveLength(3)
  })
})
