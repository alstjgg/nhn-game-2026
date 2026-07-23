import { describe, expect, it } from 'vitest'

import {
  DoodleReadingSchema,
  GeneratedGardenSchema,
  NpcReactionSchema,
  NpcReactionValidator,
  QuestPublicViewValidator,
} from './contracts.ts'

describe('Doodle Life generated contracts', () => {
  it('uses closed Structured Outputs schemas without oneOf', () => {
    for (const schema of [
      DoodleReadingSchema,
      GeneratedGardenSchema,
      NpcReactionSchema,
    ]) {
      const serialized = JSON.stringify(schema)
      expect(serialized).not.toContain('"oneOf"')
      expect(serialized).not.toContain('"$schema"')

      const objects = collectObjects(schema)
      expect(objects.length).toBeGreaterThan(0)
      expect(objects.every((object) => object.additionalProperties === false)).toBe(true)
    }
  })

  it('keeps locked quest rules and outcomes out of QuestPublicView', () => {
    expect(Object.keys(QuestPublicViewValidator.shape).sort()).toEqual([
      'clues',
      'ownerNpcId',
      'primaryPurpose',
      'problemState',
      'questId',
      'status',
      'title',
    ])

    for (const privateField of [
      'observerNpcId',
      'primarySolutions',
      'bonusPurpose',
      'bonusSolutions',
      'partialAffordances',
      'unexpectedEffects',
      'outcomes',
    ]) {
      expect(privateField in QuestPublicViewValidator.shape).toBe(false)
    }
  })

  it('does not let an NPC reaction declare a verdict or world mutation', () => {
    const properties = NpcReactionSchema.properties as Record<string, unknown>
    expect(properties).not.toHaveProperty('verdict')
    expect(properties).not.toHaveProperty('effects')
    expect(properties).not.toHaveProperty('mutations')

    const attemptedOverride = NpcReactionValidator.safeParse({
      actorId: 'npc_soso',
      emotion: 'relieved',
      grounding: '확정된 결과를 보고 안도한다.',
      commands: [
        {
          kind: 'speak',
          actorId: 'npc_soso',
          text: '마지막 소리가 도착했어.',
        },
      ],
      verdict: 'full',
      mutations: [],
    })
    expect(attemptedOverride.success).toBe(false)
  })
})

function collectObjects(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(collectObjects)
  if (typeof value !== 'object' || value === null) return []
  const record = value as Record<string, unknown>
  const nested = Object.values(record).flatMap(collectObjects)
  return record.type === 'object' ? [record, ...nested] : nested
}
