import { describe, expect, it } from 'vitest'

import { createProvider, type StructuredProvider } from '../ai/provider.ts'
import { createDoodleLifeService } from './service.ts'

describe('request-first Doodle Life service', () => {
  it('runs world, quest-blind reading, local resolve, and two bounded reactions', async () => {
    const mock = createProvider({ provider: 'mock' })
    const roles: string[] = []
    const provider: StructuredProvider = {
      kind: 'mock',
      async generate(request) {
        roles.push(request.role)
        return mock.generate(request)
      },
    }
    const service = createDoodleLifeService({ provider })
    const sessionId = 'request-first-test'
    const bootstrap = await service.bootstrap({ sessionId, locale: 'ko-KR' })
    expect(bootstrap.world.residents).toHaveLength(3)
    expect(bootstrap.quests).toHaveLength(3)
    expect(JSON.stringify(bootstrap.quests)).not.toContain('primarySolutions')
    expect(roles).toEqual(['world-and-quest-author'])

    const quest = bootstrap.quests[0]
    if (!quest) throw new Error('missing quest')
    service.selectQuest({ sessionId, questId: quest.questId, expectedRevision: 0 })
    expect(roles).toHaveLength(1)

    const reading = await service.readDoodle({
      requestId: 'read-request-first',
      sessionId,
      readIndex: 0,
      image: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        width: 720,
        height: 480,
        sha256: 'request-first-image-sha',
      },
      drawingMetrics: null,
    })
    expect(reading.reading.visibleFeatures).toHaveLength(3)
    expect(JSON.stringify(reading.reading)).not.toContain('affordances')
    expect(roles.at(-1)).toBe('doodle-reader')

    const rolesBeforeResolve = roles.length
    const before = service.inspectionSnapshot(sessionId)
    const resolved = service.resolveQuest({
      requestId: 'resolve-request-first',
      sessionId,
      expectedRevision: 0,
    })
    const after = service.inspectionSnapshot(sessionId)
    expect(roles).toHaveLength(rolesBeforeResolve)
    expect(resolved.result.verdict).toBe('full')
    expect(resolved.nextWorld.records).toHaveLength(1)
    expect(after.currentQuestHash).toBe(before.currentQuestHash)

    const reacted = await service.createReactions({
      requestId: 'react-request-first',
      sessionId,
      expectedRevision: 1,
    })
    expect(roles.slice(-2).sort()).toEqual(['quest-observer-reaction', 'quest-owner-reaction'])
    expect(reacted.encounter.participantIds).toHaveLength(3)
    expect(reacted.encounter.fallbackActorIds).toEqual([])
  })

  it('rejects a third reading before making a provider call', async () => {
    const mock = createProvider({ provider: 'mock' })
    let calls = 0
    const provider: StructuredProvider = {
      kind: 'mock',
      async generate(request) {
        calls++
        return mock.generate(request)
      },
    }
    const service = createDoodleLifeService({ provider })
    const sessionId = 'reread-limit'
    const bootstrap = await service.bootstrap({ sessionId, locale: 'ko-KR' })
    const quest = bootstrap.quests[0]
    if (!quest) throw new Error('missing quest')
    service.selectQuest({ sessionId, questId: quest.questId, expectedRevision: 0 })
    await service.readDoodle(readRequest(sessionId, 'read-zero', 0, 'image-zero'))
    await service.readDoodle(readRequest(sessionId, 'read-one', 1, 'image-one'))
    const before = calls
    await expect(service.readDoodle(readRequest(sessionId, 'read-two', 1, 'image-two')))
      .rejects.toMatchObject({ code: 'reread_limit_reached' })
    expect(calls).toBe(before)
  })
})

function readRequest(sessionId: string, requestId: string, readIndex: 0 | 1, sha256: string) {
  return {
    requestId,
    sessionId,
    readIndex,
    image: {
      dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
      mimeType: 'image/png' as const,
      width: 720,
      height: 480,
      sha256,
    },
    drawingMetrics: null,
  }
}
