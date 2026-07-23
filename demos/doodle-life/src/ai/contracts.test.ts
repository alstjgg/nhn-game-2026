import { describe, expect, it } from 'vitest'

import {
  CharacterBibleSchema,
  CriticReviewSchema,
  DialoguePassSchema,
  GeneratedSceneSchema,
  NPCIntentSchema,
  WorldStateSchema,
} from './contracts.ts'

describe('Responses API schemas', () => {
  it('normalizes unions to the Structured Outputs subset', () => {
    for (const schema of [
      CharacterBibleSchema,
      CriticReviewSchema,
      DialoguePassSchema,
      GeneratedSceneSchema,
      NPCIntentSchema,
      WorldStateSchema,
    ]) {
      const serialized = JSON.stringify(schema)
      expect(serialized).not.toContain('"oneOf"')
      expect(serialized).not.toContain('"$schema"')
    }
  })

  it('keeps every generated object closed', () => {
    const objects = collectObjects(GeneratedSceneSchema)
    expect(objects.length).toBeGreaterThan(5)
    expect(objects.every((schema) => schema.additionalProperties === false)).toBe(true)
  })
})

function collectObjects(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(collectObjects)
  if (typeof value !== 'object' || value === null) return []
  const record = value as Record<string, unknown>
  const nested = Object.values(record).flatMap(collectObjects)
  return record.type === 'object' ? [record, ...nested] : nested
}
