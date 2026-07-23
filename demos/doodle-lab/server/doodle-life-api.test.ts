import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type {
  DoodleReadingResponse,
  EncounterReactionResponse,
  ResolveQuestResponse,
  SelectQuestResponse,
  SessionBootstrapResponse,
} from '../src/doodle-life/contracts.ts'
import { createProvider } from './ai/provider.ts'
import { createDoodleLifeService } from './doodle-life/service.ts'
import { createApiServer } from './index.ts'

describe('Doodle Life request-first API', () => {
  const service = createDoodleLifeService({ provider: createProvider({ provider: 'mock' }) })
  const server = createApiServer({
    doodleLife: service,
    allowedOrigins: ['http://localhost:5173'],
  })
  let baseUrl = ''

  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}/api/v2`
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  })

  it('finishes one locked request without a model-authored verdict', async () => {
    const health = await fetch(`${baseUrl}/health`)
    expect(health.status).toBe(200)
    expect(await health.json()).toMatchObject({ service: 'doodle-life-request-first', provider: 'mock' })

    const sessionId = 'api-request-first'
    const bootstrap = await post<SessionBootstrapResponse>('/sessions', {
      sessionId,
      locale: 'ko-KR',
    })
    expect(bootstrap.world.residents).toHaveLength(3)
    expect(bootstrap.quests).toHaveLength(3)
    expect(JSON.stringify(bootstrap.quests)).not.toContain('primarySolutions')

    const quest = bootstrap.quests[0]
    if (!quest) throw new Error('missing quest')
    const selected = await post<SelectQuestResponse>('/quest-attempts', {
      sessionId,
      questId: quest.questId,
      expectedRevision: bootstrap.world.revision,
    })
    expect(selected.quest.status).toBe('active')

    const reading = await post<DoodleReadingResponse>('/doodle-readings', {
      requestId: 'api-read',
      sessionId,
      readIndex: 0,
      image: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        width: 720,
        height: 480,
        sha256: 'api-request-first-image',
      },
      drawingMetrics: null,
    })
    expect(reading.trace.calls.map((call) => call.role)).toEqual(['doodle-reader'])
    expect(JSON.stringify(reading.reading)).not.toContain('affordances')

    const resolved = await post<ResolveQuestResponse>('/quest-resolutions', {
      requestId: 'api-resolve',
      sessionId,
      expectedRevision: bootstrap.world.revision,
    })
    expect(resolved.trace.calls).toEqual([])
    expect(resolved.result.verdict).toBe('full')
    expect(resolved.nextWorld.records).toHaveLength(1)

    const reaction = await post<EncounterReactionResponse>('/encounter-reactions', {
      requestId: 'api-reaction',
      sessionId,
      expectedRevision: resolved.nextWorld.revision,
    })
    expect(reaction.trace.calls.map((call) => call.role).sort()).toEqual([
      'quest-observer-reaction',
      'quest-owner-reaction',
    ])
    expect(reaction.encounter.participantIds).toHaveLength(3)
  })

  it('maps invalid input and an unknown session to stable client-facing errors', async () => {
    const invalid = await postError('/sessions', {
      sessionId: 'not a valid id',
      locale: 'ko-KR',
    })
    expect(invalid.status).toBe(400)
    expect(invalid.body).toMatchObject({
      error: {
        code: 'invalid_request',
        message: 'The request payload did not satisfy the API contract.',
      },
    })

    const missing = await postError('/quest-attempts', {
      sessionId: 'missing-session',
      questId: 'missing-quest',
      expectedRevision: 0,
    })
    expect(missing.status).toBe(404)
    expect(missing.body).toMatchObject({
      error: { code: 'session_not_found' },
    })
  })

  it('returns explicit missing-state errors before resolve and reactions', async () => {
    const sessionId = 'api-missing-state-errors'
    const bootstrap = await post<SessionBootstrapResponse>('/sessions', {
      sessionId,
      locale: 'ko-KR',
    })
    const quest = bootstrap.quests[0]
    if (!quest) throw new Error('missing quest')
    await post<SelectQuestResponse>('/quest-attempts', {
      sessionId,
      questId: quest.questId,
      expectedRevision: 0,
    })

    const resolution = await postError('/quest-resolutions', {
      requestId: 'missing-reading-resolve',
      sessionId,
      expectedRevision: 0,
    })
    expect(resolution.status).toBe(409)
    expect(resolution.body).toMatchObject({
      error: { code: 'reading_required' },
    })

    const reaction = await postError('/encounter-reactions', {
      requestId: 'missing-resolution-reaction',
      sessionId,
      expectedRevision: 0,
    })
    expect(reaction.status).toBe(409)
    expect(reaction.body).toMatchObject({
      error: { code: 'resolution_required' },
    })
  })

  it('returns revision_conflict instead of 500 for a stale reaction request', async () => {
    const sessionId = 'api-stale-reaction'
    const bootstrap = await post<SessionBootstrapResponse>('/sessions', {
      sessionId,
      locale: 'ko-KR',
    })
    const quest = bootstrap.quests[0]
    if (!quest) throw new Error('missing quest')
    await post<SelectQuestResponse>('/quest-attempts', {
      sessionId,
      questId: quest.questId,
      expectedRevision: 0,
    })
    await post<DoodleReadingResponse>('/doodle-readings', {
      requestId: 'stale-reaction-read',
      sessionId,
      readIndex: 0,
      image: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        width: 720,
        height: 480,
        sha256: 'stale-reaction-image',
      },
      drawingMetrics: null,
    })
    await post<ResolveQuestResponse>('/quest-resolutions', {
      requestId: 'stale-reaction-resolve',
      sessionId,
      expectedRevision: 0,
    })

    const stale = await postError('/encounter-reactions', {
      requestId: 'stale-reaction-request',
      sessionId,
      expectedRevision: 0,
    })
    expect(stale.status).toBe(409)
    expect(stale.body).toMatchObject({
      error: { code: 'revision_conflict' },
    })
  })

  async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      body: JSON.stringify(body),
    })
    const value = await response.json()
    expect(response.status, JSON.stringify(value)).toBe(200)
    return value as T
  }

  async function postError(
    path: string,
    body: unknown,
  ): Promise<{ readonly status: number; readonly body: ApiErrorPayload }> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      body: JSON.stringify(body),
    })
    return {
      status: response.status,
      body: await response.json() as ApiErrorPayload,
    }
  }
})

interface ApiErrorPayload {
  readonly error: {
    readonly code: string
    readonly message: string
    readonly requestId: string
  }
}
