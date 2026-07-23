import type {
  BootstrapRequest,
  BootstrapResponse,
  DoodleBirthRequest,
  DoodleBirthResponse,
  TraceSummary,
  WorldTurnRequest,
  WorldTurnResponse,
} from './contracts.ts'

export interface HealthResponse {
  readonly ok: boolean
  readonly service: string
  readonly provider: 'openai' | 'mock'
  readonly modelCallsEnabled: boolean
  readonly time: string
}

interface ApiErrorPayload {
  readonly error?: {
    readonly code?: string
    readonly message?: string
    readonly requestId?: string
    readonly trace?: TraceSummary
  }
}

export class GardenApiError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId?: string
  readonly trace?: TraceSummary

  constructor(message: string, status: number, code = 'api_error', requestId?: string, trace?: TraceSummary) {
    super(message)
    this.name = 'GardenApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
    this.trace = trace
  }
}

export interface GardenApiOptions {
  readonly baseUrl?: string
  readonly timeoutMs?: number
}

/** Browser-only client. The OpenAI credential remains behind this same-origin proxy. */
export class GardenApi {
  readonly #baseUrl: string
  readonly #timeoutMs: number

  constructor(options: GardenApiOptions = {}) {
    this.#baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')
    this.#timeoutMs = options.timeoutMs ?? clientTimeoutFromEnvironment()
  }

  health(signal?: AbortSignal): Promise<HealthResponse> {
    return this.#request<HealthResponse>('/api/v1/health', undefined, signal)
  }

  bootstrap(request: BootstrapRequest, signal?: AbortSignal): Promise<BootstrapResponse> {
    return this.#request<BootstrapResponse>('/api/v1/bootstrap', request, signal)
  }

  doodleBirth(request: DoodleBirthRequest, signal?: AbortSignal): Promise<DoodleBirthResponse> {
    return this.#request<DoodleBirthResponse>('/api/v1/doodle-birth', request, signal)
  }

  worldTurn(request: WorldTurnRequest, signal?: AbortSignal): Promise<WorldTurnResponse> {
    return this.#request<WorldTurnResponse>('/api/v1/world-turn', request, signal)
  }

  async #request<T>(path: string, body: unknown, parentSignal?: AbortSignal): Promise<T> {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(new Error('AI proxy timed out.')), this.#timeoutMs)
    const abortFromParent = (): void => controller.abort(parentSignal?.reason)
    if (parentSignal?.aborted) abortFromParent()
    else parentSignal?.addEventListener('abort', abortFromParent, { once: true })

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
          error.error?.message ?? `AI proxy returned HTTP ${response.status}.`,
          response.status,
          error.error?.code,
          error.error?.requestId,
          error.error?.trace,
        )
      }
      return payload as T
    } catch (error) {
      if (error instanceof GardenApiError) throw error
      if (controller.signal.aborted) {
        throw new GardenApiError('AI 응답 시간이 너무 길어 요청을 멈췄어요.', 504, 'client_timeout')
      }
      throw new GardenApiError(
        error instanceof Error ? error.message : 'AI 프록시에 연결할 수 없어요.',
        0,
        'network_error',
      )
    } finally {
      window.clearTimeout(timeout)
      parentSignal?.removeEventListener('abort', abortFromParent)
    }
  }
}

function clientTimeoutFromEnvironment(): number {
  const parsed = Number(import.meta.env.VITE_AI_CLIENT_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 720_000
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown
  } catch {
    throw new GardenApiError('AI 프록시가 JSON이 아닌 응답을 보냈어요.', response.status, 'invalid_json')
  }
}
