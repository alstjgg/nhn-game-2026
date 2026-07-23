import type { z } from 'zod'

import { GardenApiError } from '../ai/client.ts'
import {
  DoodleLifeHealthResponseValidator,
  DoodleReadingResponseValidator,
  EncounterReactionResponseValidator,
  ResolveQuestResponseValidator,
  SelectQuestResponseValidator,
  SessionBootstrapResponseValidator,
  type DoodleLifeHealthResponse,
  type DoodleReadingRequest,
  type DoodleReadingResponse,
  type EncounterReactionRequest,
  type EncounterReactionResponse,
  type ResolveQuestRequest,
  type ResolveQuestResponse,
  type SessionBootstrapRequest,
  type SessionBootstrapResponse,
  type SelectQuestRequest,
  type SelectQuestResponse,
} from './contracts.ts'

interface ApiErrorPayload {
  readonly error?: {
    readonly code?: string
    readonly message?: string
    readonly requestId?: string
  }
}

export interface DoodleLifeApiOptions {
  readonly baseUrl?: string
  readonly worldTimeoutMs?: number
  readonly readingTimeoutMs?: number
  readonly reactionTimeoutMs?: number
  readonly localTimeoutMs?: number
}

export class DoodleLifeApi {
  readonly #baseUrl: string
  readonly #worldTimeoutMs: number
  readonly #readingTimeoutMs: number
  readonly #reactionTimeoutMs: number
  readonly #localTimeoutMs: number

  constructor(options: DoodleLifeApiOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')
    this.#worldTimeoutMs = options.worldTimeoutMs ?? envTimeout('VITE_WORLD_TIMEOUT_MS', 210_000)
    this.#readingTimeoutMs = options.readingTimeoutMs ?? envTimeout('VITE_VLM_TIMEOUT_MS', 190_000)
    this.#reactionTimeoutMs = options.reactionTimeoutMs ?? envTimeout('VITE_REACTION_TIMEOUT_MS', 70_000)
    this.#localTimeoutMs = options.localTimeoutMs ?? 12_000
  }

  health(signal?: AbortSignal): Promise<DoodleLifeHealthResponse> {
    return this.#request('/api/v2/health', undefined, DoodleLifeHealthResponseValidator, this.#localTimeoutMs, signal)
  }

  createSession(request: SessionBootstrapRequest, signal?: AbortSignal): Promise<SessionBootstrapResponse> {
    return this.#request('/api/v2/sessions', request, SessionBootstrapResponseValidator, this.#worldTimeoutMs, signal)
  }

  selectQuest(request: SelectQuestRequest, signal?: AbortSignal): Promise<SelectQuestResponse> {
    return this.#request('/api/v2/quest-attempts', request, SelectQuestResponseValidator, this.#localTimeoutMs, signal)
  }

  readDoodle(request: DoodleReadingRequest, signal?: AbortSignal): Promise<DoodleReadingResponse> {
    return this.#request('/api/v2/doodle-readings', request, DoodleReadingResponseValidator, this.#readingTimeoutMs, signal)
  }

  resolveQuest(request: ResolveQuestRequest, signal?: AbortSignal): Promise<ResolveQuestResponse> {
    return this.#request('/api/v2/quest-resolutions', request, ResolveQuestResponseValidator, this.#localTimeoutMs, signal)
  }

  createReactions(
    request: EncounterReactionRequest,
    signal?: AbortSignal,
  ): Promise<EncounterReactionResponse> {
    return this.#request(
      '/api/v2/encounter-reactions',
      request,
      EncounterReactionResponseValidator,
      this.#reactionTimeoutMs,
      signal,
    )
  }

  async #request<T>(
    path: string,
    body: unknown,
    validator: z.ZodType<T>,
    timeoutMs: number,
    parentSignal?: AbortSignal,
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(new Error('Doodle Life request timed out.')), timeoutMs)
    const abort = (): void => controller.abort(parentSignal?.reason)
    if (parentSignal?.aborted) abort()
    else parentSignal?.addEventListener('abort', abort, { once: true })
    try {
      const response = await fetch(`${this.#baseUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
      const payload = await parseJson(response)
      if (!response.ok) {
        const error = payload as ApiErrorPayload
        throw new GardenApiError(
          error.error?.message ?? `Doodle Life API returned HTTP ${response.status}.`,
          response.status,
          error.error?.code,
          error.error?.requestId,
        )
      }
      const parsed = validator.safeParse(payload)
      if (!parsed.success) {
        throw new GardenApiError(
          `Doodle Life API response failed validation: ${parsed.error.issues[0]?.message ?? 'unknown schema error'}`,
          502,
          'invalid_api_response',
        )
      }
      return parsed.data
    } catch (error) {
      if (error instanceof GardenApiError) throw error
      if (controller.signal.aborted) {
        throw new GardenApiError('모델 응답 시간이 길어 안전한 기본 연출로 전환합니다.', 504, 'client_timeout')
      }
      throw new GardenApiError(
        error instanceof Error ? error.message : 'Doodle Life API에 연결할 수 없습니다.',
        0,
        'network_error',
      )
    } finally {
      window.clearTimeout(timeout)
      parentSignal?.removeEventListener('abort', abort)
    }
  }
}

function envTimeout(name: string, fallback: number): number {
  const value = Number(import.meta.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown
  } catch {
    throw new GardenApiError('Doodle Life API가 JSON이 아닌 응답을 보냈습니다.', response.status, 'invalid_json')
  }
}
