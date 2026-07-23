import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { BootstrapResponse, DoodleBirthResponse, WorldTurnResponse } from '../src/ai/contracts.ts'
import { createAutonomousGarden } from './ai/orchestrator.ts'
import { ModelProviderError, createProvider } from './ai/provider.ts'
import { createApiServer } from './index.ts'

describe('autonomous garden API', () => {
  const server = createApiServer({
    garden: createAutonomousGarden({ provider: createProvider({ provider: 'mock' }) }),
    allowedOrigins: ['http://localhost:5173'],
  })
  let baseUrl = ''

  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', () => resolve())
    })
    const address = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}/api/v1`
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  })

  it('runs bootstrap, doodle birth, parallel minds, direction, critique, and memory', async () => {
    const healthResponse = await fetch(`${baseUrl}/health`)
    expect(healthResponse.status).toBe(200)
    expect(await healthResponse.json()).toMatchObject({ ok: true, provider: 'mock' })

    const bootstrap = await post<BootstrapResponse>('/bootstrap', {
      sessionId: 'vitest-session',
      locale: 'ko-KR',
      autonomy: 'full-max',
    })
    expect(bootstrap.world.residents).toHaveLength(4)
    expect(bootstrap.trace.calls.map((call) => call.role)).toEqual(['world-author'])

    const birth = await post<DoodleBirthResponse>('/doodle-birth', {
      requestId: 'birth-test',
      expectedRevision: bootstrap.world.revision,
      autonomy: 'full-max',
      image: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        width: 720,
        height: 480,
        sha256: 'vitest-doodle-1234',
      },
      drawingMetrics: drawingMetrics(),
    })
    expect(birth.character.kind).toBe('player')
    expect(birth.character.traits.map((trait) => trait.label)).toContain('색 사이의 공명')

    const world = { ...bootstrap.world, residents: [...bootstrap.world.residents, birth.character] }
    const turn = await post<WorldTurnResponse>('/world-turn', {
      requestId: 'turn-test',
      expectedRevision: world.revision,
      autonomy: 'full-max',
      world,
      signal: {
        kind: 'newcomer-arrived',
        actorId: birth.character.id,
        detail: `${birth.character.name}이 정원에 처음 나타났다.`,
      },
    })

    expect(turn.intents).toHaveLength(world.residents.filter((resident) => resident.kind === 'npc').length)
    expect(turn.trace.calls.map((call) => call.role)).toEqual([
      ...world.residents.filter((resident) => resident.kind === 'npc').map(() => 'npc-mind'),
      'world-director',
      'continuity-critic',
    ])
    expect(turn.scene.participantIds).toContain(birth.character.id)
    expect(turn.scene.beats.length).toBeGreaterThanOrEqual(2)
    expect(turn.nextWorld.revision).toBe(world.revision + 1)
    expect(turn.nextWorld.memories.length).toBeGreaterThan(0)
    expect(turn.nextWorld.recentScenes.at(-1)?.id).toBe(turn.scene.id)
  })

  it('is deterministic for the same mock bootstrap seed', async () => {
    const request = { sessionId: 'same-seed', locale: 'ko-KR', autonomy: 'full-max' }
    const first = await post<BootstrapResponse>('/bootstrap', request)
    const second = await post<BootstrapResponse>('/bootstrap', request)
    expect(second.world).toEqual(first.world)
  })

  it('keeps lower-autonomy modes honest about which model roles run', async () => {
    const bootstrap = await post<BootstrapResponse>('/bootstrap', {
      sessionId: 'low-autonomy-seed',
      locale: 'ko-KR',
      autonomy: 'off',
    })
    expect(bootstrap.trace.calls).toEqual([])

    const birth = await post<DoodleBirthResponse>('/doodle-birth', {
      requestId: 'low-autonomy-birth',
      expectedRevision: bootstrap.world.revision,
      autonomy: 'off',
      image: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mimeType: 'image/png',
        width: 720,
        height: 480,
        sha256: 'low-autonomy-doodle',
      },
      drawingMetrics: drawingMetrics(),
    })
    expect(birth.trace.calls).toEqual([])

    const world = { ...bootstrap.world, residents: [...bootstrap.world.residents, birth.character] }
    const baseTurn = {
      expectedRevision: world.revision,
      world,
      signal: {
        kind: 'newcomer-arrived' as const,
        actorId: birth.character.id,
        detail: `${birth.character.name}이 정원에 처음 나타났다.`,
      },
    }

    const off = await post<WorldTurnResponse>('/world-turn', {
      ...baseTurn,
      requestId: 'low-autonomy-off',
      autonomy: 'off',
    })
    expect(off.trace.calls).toEqual([])
    expect(off.scene.participantIds).toContain(birth.character.id)

    const dialogueOnly = await post<WorldTurnResponse>('/world-turn', {
      ...baseTurn,
      requestId: 'low-autonomy-dialogue',
      autonomy: 'dialogue-only',
    })
    expect(dialogueOnly.trace.calls.map((call) => call.role)).toEqual(['dialogue-writer'])

    const directorOnly = await post<WorldTurnResponse>('/world-turn', {
      ...baseTurn,
      requestId: 'low-autonomy-director',
      autonomy: 'director-only',
    })
    expect(directorOnly.trace.calls.map((call) => call.role)).toEqual(['world-director', 'continuity-critic'])

    const selective = await post<WorldTurnResponse>('/world-turn', {
      ...baseTurn,
      requestId: 'low-autonomy-selective',
      autonomy: 'full-selective',
    })
    expect(selective.trace.calls.map((call) => call.role)).toEqual([
      'npc-mind', 'npc-mind', 'npc-mind', 'world-director', 'continuity-critic',
    ])
  })

  it('rejects unlisted origins and oversized bodies with JSON errors', async () => {
    const forbidden = await fetch(`${baseUrl}/health`, { headers: { origin: 'https://unlisted.example' } })
    expect(forbidden.status).toBe(403)
    expect(await forbidden.json()).toMatchObject({ error: { code: 'origin_not_allowed' } })

    const oversized = await fetch(`${baseUrl}/bootstrap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ padding: 'x'.repeat(1024 * 1024) }),
    })
    expect(oversized.status).toBe(413)
    expect(await oversized.json()).toMatchObject({ error: { code: 'payload_too_large' } })
  })

  it('returns partial model usage in a failed API response', async () => {
    const usage = { inputTokens: 17, cachedInputTokens: 3, outputTokens: 4, reasoningTokens: 2, totalTokens: 21 }
    const trace = {
      mode: 'full-max' as const,
      calls: [{
        id: 'failed-call',
        role: 'world-author',
        provider: 'openai' as const,
        model: 'gpt-test',
        startedAt: new Date(0).toISOString(),
        latencyMs: 12,
        usage,
      }],
      usage,
      totalLatencyMs: 12,
      wallClockMs: 14,
    }
    const fail = async (): Promise<never> => {
      throw new ModelProviderError('test failure', 'test_failure', 502, undefined, trace)
    }
    const failingServer = createApiServer({
      garden: { providerKind: 'openai', bootstrap: fail, doodleBirth: fail, worldTurn: fail },
      allowedOrigins: ['http://localhost:5173'],
    })
    await new Promise<void>((resolve, reject) => {
      failingServer.once('error', reject)
      failingServer.listen(0, '127.0.0.1', resolve)
    })
    try {
      const address = failingServer.address() as AddressInfo
      const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/bootstrap`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
        body: '{}',
      })
      expect(response.status).toBe(502)
      expect(await response.json()).toMatchObject({
        error: { code: 'test_failure', trace: { calls: [{ role: 'world-author' }], usage } },
      })
    } finally {
      await new Promise<void>((resolve, reject) => failingServer.close((error) => error ? reject(error) : resolve()))
    }
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
})

function drawingMetrics() {
  return {
    strokeCount: 10,
    pointCount: 90,
    totalLength: 1400,
    horizontalRatio: 0.31,
    verticalRatio: 0.69,
    overlap: 0.24,
    density: 0.18,
    centerX: 360,
    centerY: 210,
    extent: 310,
    rhythm: 0.82,
    colorCount: 4,
    warmColorRatio: 0.3,
    coolColorRatio: 0.5,
    brightColorRatio: 0.7,
    dominantColor: '#8d72ad',
  }
}
