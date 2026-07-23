import { describe, expect, it } from 'vitest'

import { createAutonomousGarden } from './orchestrator.ts'
import {
  ModelProviderError,
  createProvider,
  type StructuredProvider,
} from './provider.ts'

describe('orchestration telemetry', () => {
  it('keeps completed and failed call traces when a later role fails', async () => {
    const mock = createProvider({ provider: 'mock' })
    const failsAtCritic: StructuredProvider = {
      kind: 'openai',
      async generate(request) {
        const result = await mock.generate(request)
        if (request.role === 'continuity-critic') {
          throw new ModelProviderError('critic failed', 'test_critic_failure', 502, result.trace)
        }
        return result
      },
    }
    const garden = createAutonomousGarden({ provider: failsAtCritic })
    const bootstrap = await garden.bootstrap({
      sessionId: 'partial-trace-session',
      locale: 'ko-KR',
      autonomy: 'full-max',
    })
    const birth = await garden.doodleBirth({
      requestId: 'partial-trace-birth',
      expectedRevision: bootstrap.world.revision,
      autonomy: 'full-max',
      image: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        width: 720,
        height: 480,
        sha256: 'partial-trace-doodle',
      },
      drawingMetrics: null,
    })
    const world = { ...bootstrap.world, residents: [...bootstrap.world.residents, birth.character] }

    const error = await garden.worldTurn({
      requestId: 'partial-trace-turn',
      expectedRevision: world.revision,
      autonomy: 'full-max',
      world,
      signal: {
        kind: 'newcomer-arrived',
        actorId: birth.character.id,
        detail: '새 주민이 처음 정원에 도착했다.',
      },
    }).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ModelProviderError)
    expect((error as ModelProviderError).partialTrace?.calls.map((call) => call.role)).toEqual([
      'npc-mind', 'npc-mind', 'npc-mind', 'npc-mind', 'world-director', 'continuity-critic',
    ])
  })
})
