import { describe, expect, it } from 'vitest'

import { buildPublicWorldContext } from '../../src/world/context-builder.ts'
import { createAutonomousGarden } from './orchestrator.ts'
import { createProvider } from './provider.ts'

describe('prompt context budget', () => {
  it('keeps visual identity but omits render geometry and caps shared memory history', async () => {
    const garden = createAutonomousGarden({ provider: createProvider({ provider: 'mock' }) })
    const { world } = await garden.bootstrap({
      sessionId: 'context-budget',
      locale: 'ko-KR',
      autonomy: 'full-max',
    })
    const ownerId = world.residents[0]?.id
    expect(ownerId).toBeTruthy()
    const withHistory = {
      ...world,
      memories: Array.from({ length: 30 }, (_, index) => ({
        id: `memory_${index}`,
        ownerId: ownerId as string,
        sceneId: `scene_${index}`,
        summary: `공유 기억 ${index}`,
        interpretation: `해석 ${index}`,
        visibility: 'shared' as const,
        salience: .5,
      })),
    }

    const context = buildPublicWorldContext(withHistory) as {
      readonly residents: readonly { readonly design: Record<string, unknown> }[]
      readonly sharedMemories: readonly unknown[]
    }

    expect(context.sharedMemories).toHaveLength(24)
    expect(context.residents[0]?.design).toEqual({
      silhouette: world.residents[0]?.design.silhouette,
      palette: world.residents[0]?.design.palette,
    })
    expect(JSON.stringify(context)).not.toContain('"parts"')
    expect(JSON.stringify(context)).not.toContain('"idleMotions"')
  })
})
