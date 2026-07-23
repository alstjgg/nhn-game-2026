import { describe, expect, it } from 'vitest'

import {
  DoodleWorldValidator,
  QuestPublicViewValidator,
} from '../../src/doodle-life/contracts.ts'
import {
  ModelProviderError,
  createProvider,
  type StructuredProvider,
} from '../ai/provider.ts'
import {
  createDoodleLifeService,
  type DoodleLifeService,
} from './service.ts'

describe('request-first failure paths', () => {
  it('turns a World provider failure into a validated fallback session', async () => {
    const mock = createProvider({ provider: 'mock' })
    const calls: string[] = []
    const provider: StructuredProvider = {
      kind: 'mock',
      async generate(request) {
        calls.push(request.role)
        const result = await mock.generate(request)
        if (request.role === 'world-and-quest-author') {
          throw new ModelProviderError(
            'world generation failed',
            'test_world_failure',
            502,
            result.trace,
          )
        }
        return result
      },
    }
    const service = createDoodleLifeService({ provider })

    const bootstrap = await service.bootstrap({
      sessionId: 'failure-world-fallback',
      locale: 'ko-KR',
    })

    expect(bootstrap).toMatchObject({
      cached: false,
      usedFallback: true,
      fallbackReason: 'test_world_failure',
    })
    expect(DoodleWorldValidator.safeParse(bootstrap.world).success).toBe(true)
    expect(bootstrap.world.residents).toHaveLength(3)
    expect(bootstrap.quests).toHaveLength(3)
    expect(bootstrap.quests.every((quest) => QuestPublicViewValidator.safeParse(quest).success)).toBe(true)
    expect(calls).toEqual(['world-and-quest-author'])
    expect(bootstrap.trace.calls.map((call) => call.role)).toEqual(['world-and-quest-author'])

    const inspection = service.inspectionSnapshot('failure-world-fallback')
    expect(Object.keys(inspection.questHashes)).toHaveLength(3)
    expect(inspection.quests).toHaveLength(3)
    const selected = service.selectQuest({
      sessionId: 'failure-world-fallback',
      questId: bootstrap.quests[0]?.questId ?? 'missing',
      expectedRevision: 0,
    })
    expect(selected.worldRevision).toBe(0)
  })

  it('uses a zero-affordance VLM fallback and still records an unexpected resolution', async () => {
    const mock = createProvider({ provider: 'mock' })
    const provider: StructuredProvider = {
      kind: 'mock',
      async generate(request) {
        const result = await mock.generate(request)
        if (request.role === 'doodle-reader') {
          throw new ModelProviderError(
            'vision generation failed',
            'test_vlm_failure',
            502,
            result.trace,
          )
        }
        return result
      },
    }
    const service = createDoodleLifeService({ provider })
    const sessionId = 'failure-vlm-fallback'
    const bootstrap = await service.bootstrap({ sessionId, locale: 'ko-KR' })
    const quest = bootstrap.quests[0]
    if (!quest) throw new Error('The fallback garden did not contain a quest.')
    service.selectQuest({ sessionId, questId: quest.questId, expectedRevision: 0 })

    const reading = await service.readDoodle(readRequest(sessionId, 'failure-vlm-read'))

    expect(reading).toMatchObject({
      usedFallback: true,
      fallbackReason: 'test_vlm_failure',
    })
    expect(reading.reading.visibleFeatures).toHaveLength(2)
    expect(service.inspectionSnapshot(sessionId).readingAffordances).toEqual([])

    const resolved = service.resolveQuest({
      requestId: 'failure-vlm-resolve',
      sessionId,
      expectedRevision: 0,
    })

    expect(resolved.result.verdict).toBe('unexpected')
    expect(resolved.result.questResolved).toBe(false)
    expect(resolved.result.relationshipRecord).toMatchObject({
      questId: quest.questId,
      verdict: 'unexpected',
    })
    expect(resolved.nextWorld.revision).toBe(1)
    expect(resolved.nextWorld.creatures).toHaveLength(1)
    expect(resolved.nextWorld.records).toHaveLength(1)
    expect(resolved.trace.calls).toEqual([])
  })

  it.each([
    ['quest-owner-reaction', 'npc_soso'],
    ['quest-observer-reaction', 'npc_dari'],
  ] as const)(
    'completes the scene when %s fails, while starting both reactions in parallel',
    async (failedRole, expectedFallbackActorId) => {
      const mock = createProvider({ provider: 'mock' })
      let activeReactionCalls = 0
      let maximumConcurrentReactionCalls = 0
      const provider: StructuredProvider = {
        kind: 'mock',
        async generate(request) {
          const isReaction = request.role === 'quest-owner-reaction'
            || request.role === 'quest-observer-reaction'
          if (!isReaction) return mock.generate(request)

          activeReactionCalls += 1
          maximumConcurrentReactionCalls = Math.max(
            maximumConcurrentReactionCalls,
            activeReactionCalls,
          )
          try {
            await delay(15)
            const result = await mock.generate(request)
            if (request.role === failedRole) {
              throw new ModelProviderError(
                `${failedRole} failed`,
                `test_${failedRole.replaceAll('-', '_')}_failure`,
                502,
                result.trace,
              )
            }
            return result
          } finally {
            activeReactionCalls -= 1
          }
        },
      }
      const service = createDoodleLifeService({
        provider,
        reactionTimeoutMs: 1_000,
      })
      const sessionId = `failure-${failedRole}`
      await prepareResolvedSosoRound(service, sessionId)

      const reacted = await service.createReactions({
        requestId: `react-${failedRole}`,
        sessionId,
        expectedRevision: 1,
      })

      expect(maximumConcurrentReactionCalls).toBe(2)
      expect(reacted.worldRevision).toBe(1)
      expect(reacted.encounter.participantIds).toEqual([
        'npc_soso',
        'npc_dari',
        expect.stringMatching(/^doodle_/),
      ])
      expect(reacted.encounter.commands.length).toBeGreaterThan(0)
      expect(reacted.encounter.fallbackActorIds).toEqual([expectedFallbackActorId])
      expect(reacted.trace.calls.map((call) => call.role).sort()).toEqual([
        'quest-observer-reaction',
        'quest-owner-reaction',
      ])
      expect(service.inspectionSnapshot(sessionId).encounterCreated).toBe(true)
    },
  )
})

async function prepareResolvedSosoRound(
  service: DoodleLifeService,
  sessionId: string,
): Promise<void> {
  const bootstrap = await service.bootstrap({ sessionId, locale: 'ko-KR' })
  const quest = bootstrap.quests.find((candidate) => candidate.questId === 'quest_soso_last_note')
  if (!quest) throw new Error('The tutorial Soso quest is missing.')
  service.selectQuest({ sessionId, questId: quest.questId, expectedRevision: 0 })
  await service.readDoodle(readRequest(sessionId, `read-${sessionId}`))
  service.resolveQuest({
    requestId: `resolve-${sessionId}`,
    sessionId,
    expectedRevision: 0,
  })
}

function readRequest(sessionId: string, requestId: string) {
  return {
    requestId,
    sessionId,
    readIndex: 0 as const,
    image: {
      dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
      mimeType: 'image/png' as const,
      width: 720,
      height: 480,
      sha256: `image-${sessionId}`,
    },
    drawingMetrics: null,
  }
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}
