import { randomUUID } from 'node:crypto'
import type { TraceSummary } from '../../src/ai/contracts.ts'

export type ProviderKind = 'openai' | 'mock'
export type ReasoningEffort = 'low' | 'medium'
export type JsonSchema = Readonly<Record<string, unknown>>

export type ModelInputContent =
  | { readonly type: 'input_text'; readonly text: string }
  | { readonly type: 'input_image'; readonly image_url: string; readonly detail: 'high' }

export interface TokenUsage {
  readonly inputTokens: number
  readonly cachedInputTokens: number
  readonly outputTokens: number
  readonly reasoningTokens: number
  readonly totalTokens: number
}

export interface ModelTrace {
  readonly id: string
  readonly role: string
  readonly provider: ProviderKind
  readonly model: string
  readonly startedAt: string
  readonly latencyMs: number
  readonly usage: TokenUsage
}

export interface StructuredRequest<T> {
  readonly role: string
  readonly instructions: string
  readonly input: readonly ModelInputContent[]
  readonly schemaName: string
  readonly schema: JsonSchema
  readonly reasoning?: ReasoningEffort
  readonly maxOutputTokens?: number
  readonly signal?: AbortSignal
  readonly mock: () => T
}

export interface StructuredResult<T> {
  readonly value: T
  readonly trace: ModelTrace
}

export interface StructuredProvider {
  readonly kind: ProviderKind
  generate<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>
}

export interface ProviderOptions {
  readonly apiKey?: string
  readonly provider?: string
  readonly timeoutMs?: number
  readonly model?: string
  readonly roleModels?: Readonly<Record<string, string | undefined>>
}

const DEFAULT_ROLE_MODELS: Readonly<Record<string, string>> = {
  'world-author': 'gpt-5.6-terra',
  'doodle-vision': 'gpt-5.6-sol',
  'npc-mind': 'gpt-5.6-terra',
  'world-director': 'gpt-5.6-sol',
  'continuity-critic': 'gpt-5.6-terra',
  'dialogue-writer': 'gpt-5.6-terra',
  'world-and-quest-author': 'gpt-5.6-terra',
  'doodle-reader': 'gpt-5.6-sol',
  'quest-owner-reaction': 'gpt-5.6-terra',
  'quest-observer-reaction': 'gpt-5.6-terra',
}

const DEFAULT_ROLE_REQUESTS: Readonly<Record<string, {
  readonly reasoning: ReasoningEffort
  readonly maxOutputTokens: number
}>> = {
  'world-author': { reasoning: 'medium', maxOutputTokens: 8_000 },
  'doodle-vision': { reasoning: 'low', maxOutputTokens: 4_000 },
  'npc-mind': { reasoning: 'low', maxOutputTokens: 1_200 },
  'world-director': { reasoning: 'medium', maxOutputTokens: 5_000 },
  'continuity-critic': { reasoning: 'low', maxOutputTokens: 5_000 },
  'dialogue-writer': { reasoning: 'low', maxOutputTokens: 1_600 },
  'world-and-quest-author': { reasoning: 'medium', maxOutputTokens: 6_000 },
  'doodle-reader': { reasoning: 'low', maxOutputTokens: 2_400 },
  'quest-owner-reaction': { reasoning: 'low', maxOutputTokens: 900 },
  'quest-observer-reaction': { reasoning: 'low', maxOutputTokens: 900 },
}

export interface ProviderEvaluationConfig {
  readonly provider: ProviderKind
  readonly roles: Readonly<Record<string, {
    readonly model: string
    readonly reasoning: ReasoningEffort
    readonly maxOutputTokens: number
  }>>
}

export function providerEvaluationConfig(provider: ProviderKind): ProviderEvaluationConfig {
  return {
    provider,
    roles: Object.fromEntries(Object.entries(DEFAULT_ROLE_REQUESTS).map(([role, defaults]) => [
      role,
      {
        model: configuredRoleModel(role),
        reasoning: configuredOpenAIReasoning(role, defaults.reasoning),
        maxOutputTokens: configuredOpenAIMaxOutput(role, defaults.maxOutputTokens),
      },
    ])),
  }
}

interface OpenAIResponse {
  readonly id?: string
  readonly model?: string
  readonly status?: 'completed' | 'failed' | 'incomplete' | 'cancelled' | 'in_progress' | 'queued'
  readonly incomplete_details?: { readonly reason?: string }
  readonly output?: readonly {
    readonly type?: string
    readonly content?: readonly {
      readonly type?: string
      readonly text?: string
      readonly refusal?: string
    }[]
  }[]
  readonly usage?: {
    readonly input_tokens?: number
    readonly output_tokens?: number
    readonly total_tokens?: number
    readonly input_tokens_details?: { readonly cached_tokens?: number }
    readonly output_tokens_details?: { readonly reasoning_tokens?: number }
  }
  readonly error?: { readonly message?: string }
}

export class ModelProviderError extends Error {
  readonly code: string
  readonly status: number
  readonly trace?: ModelTrace
  readonly partialTrace?: TraceSummary

  constructor(
    message: string,
    code = 'model_error',
    status = 502,
    trace?: ModelTrace,
    partialTrace?: TraceSummary,
  ) {
    super(message)
    this.name = 'ModelProviderError'
    this.code = code
    this.status = status
    this.trace = trace
    this.partialTrace = partialTrace
  }
}

export function createProvider(options: ProviderOptions = {}): StructuredProvider {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY
  const forcedProvider = (options.provider ?? process.env.AI_PROVIDER)?.trim().toLowerCase()

  if (forcedProvider === 'mock') return createMockProvider(options)
  if (forcedProvider === 'openai' || forcedProvider === 'api') {
    if (!apiKey) {
      throw new ModelProviderError(
        'AI_PROVIDER=openai requires OPENAI_API_KEY in the server environment.',
        'missing_openai_api_key',
        500,
      )
    }
    return createOpenAIProvider(apiKey, options)
  }
  if (forcedProvider && forcedProvider !== 'auto') {
    throw new ModelProviderError(
      `Unsupported AI_PROVIDER value: ${forcedProvider}.`,
      'invalid_provider_config',
      500,
    )
  }
  return apiKey ? createOpenAIProvider(apiKey, options) : createMockProvider(options)
}

function createMockProvider(options: ProviderOptions): StructuredProvider {
  return {
    kind: 'mock',
    async generate<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
      const startedAt = new Date().toISOString()
      const started = performance.now()
      const value = request.mock()
      const validation = validateAgainstSchema(value, request.schema)
      if (!validation.valid) {
        throw new ModelProviderError(`Mock output failed ${request.schemaName}: ${validation.errors.join('; ')}`, 'mock_schema_error', 500)
      }
      assertNoExecutableMarkup(value)
      await Promise.resolve()
      return {
        value,
        trace: {
          id: randomUUID(),
          role: request.role,
          provider: 'mock',
          model: options.model ?? 'deterministic-mock-v1',
          startedAt,
          latencyMs: Math.max(0, Math.round(performance.now() - started)),
          usage: emptyUsage(),
        },
      }
    },
  }
}

function createOpenAIProvider(apiKey: string, options: ProviderOptions): StructuredProvider {
  const timeoutMs = options.timeoutMs ?? numberFromEnv('AI_TIMEOUT_MS', 180_000)
  const defaultModel = options.model ?? process.env.OPENAI_MODEL ?? 'gpt-5.6-terra'

  return {
    kind: 'openai',
    async generate<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
      const model = options.roleModels?.[request.role]
        ?? process.env[`OPENAI_MODEL_${request.role.toUpperCase().replaceAll('-', '_')}`]
        ?? DEFAULT_ROLE_MODELS[request.role]
        ?? defaultModel
      const reasoning = configuredOpenAIReasoning(request.role, request.reasoning ?? 'low')
      const maxOutputTokens = configuredOpenAIMaxOutput(request.role, request.maxOutputTokens ?? 2_400)
      const startedAt = new Date().toISOString()
      const started = performance.now()
      let responseTrace: ModelTrace | undefined
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(new Error('OpenAI request timed out.')), timeoutMs)
      const abortFromParent = (): void => controller.abort(request.signal?.reason)
      if (request.signal?.aborted) abortFromParent()
      else request.signal?.addEventListener('abort', abortFromParent, { once: true })

      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            instructions: request.instructions,
            input: [{ role: 'user', content: request.input }],
            text: {
              format: {
                type: 'json_schema',
                name: request.schemaName,
                strict: true,
                schema: request.schema,
              },
            },
            reasoning: { effort: reasoning },
            max_output_tokens: maxOutputTokens,
            prompt_cache_key: `doodle-life:${request.role}`,
            store: false,
          }),
          signal: controller.signal,
        })

        const payload = await readOpenAIResponse(response)
        responseTrace = openAITrace(payload, request.role, model, startedAt, started)
        if (!response.ok) {
          throw publicOpenAIError(response.status)
        }
        assertCompletedResponse(payload)

        const output = extractOutputText(payload)
        let parsed: unknown
        try {
          parsed = JSON.parse(output)
        } catch {
          throw new ModelProviderError('OpenAI returned invalid JSON.', 'invalid_model_json')
        }

        const validation = validateAgainstSchema(parsed, request.schema)
        if (!validation.valid) {
          throw new ModelProviderError(
            `OpenAI output failed ${request.schemaName}: ${validation.errors.slice(0, 4).join('; ')}`,
            'model_schema_error',
          )
        }
        assertNoExecutableMarkup(parsed)

        return {
          value: parsed as T,
          trace: responseTrace,
        }
      } catch (error) {
        if (error instanceof ModelProviderError) {
          if (error.trace || !responseTrace) throw error
          throw new ModelProviderError(error.message, error.code, error.status, responseTrace, error.partialTrace)
        }
        if (controller.signal.aborted) {
          throw new ModelProviderError('The model request timed out or was cancelled.', 'model_timeout', 504, responseTrace)
        }
        throw new ModelProviderError('The AI service request failed.', 'model_network_error', 502, responseTrace)
      } finally {
        clearTimeout(timeout)
        request.signal?.removeEventListener('abort', abortFromParent)
      }
    },
  }
}

function openAITrace(
  payload: OpenAIResponse,
  role: string,
  fallbackModel: string,
  startedAt: string,
  started: number,
): ModelTrace {
  return {
    id: payload.id ?? randomUUID(),
    role,
    provider: 'openai',
    model: payload.model ?? fallbackModel,
    startedAt,
    latencyMs: Math.max(0, Math.round(performance.now() - started)),
    usage: normalizeUsage(payload.usage),
  }
}

function assertCompletedResponse(payload: OpenAIResponse): void {
  if (payload.status === 'completed') return
  if (payload.status === 'incomplete') {
    if (payload.incomplete_details?.reason === 'max_output_tokens') {
      throw new ModelProviderError(
        'The model reached its output-token limit before completing the structured result.',
        'model_output_incomplete',
        502,
      )
    }
    if (payload.incomplete_details?.reason === 'content_filter') {
      throw new ModelProviderError('The model output was stopped by a safety filter.', 'model_content_filtered', 422)
    }
    throw new ModelProviderError('The model returned an incomplete structured result.', 'model_output_incomplete', 502)
  }
  if (payload.status === 'failed') {
    throw new ModelProviderError('The model failed to produce a structured result.', 'model_response_failed', 502)
  }
  if (payload.status === 'cancelled') {
    throw new ModelProviderError('The model response was cancelled.', 'model_response_cancelled', 502)
  }
  throw new ModelProviderError('The AI service returned a non-terminal response.', 'invalid_openai_response', 502)
}

function publicOpenAIError(status: number): ModelProviderError {
  if (status === 401 || status === 403) {
    return new ModelProviderError('The AI service credential was rejected. Check the server-only environment.', 'openai_auth_error', 502)
  }
  if (status === 429) {
    return new ModelProviderError('The AI service is temporarily rate limited. Try again shortly.', 'openai_rate_limit', 429)
  }
  if (status >= 500) {
    return new ModelProviderError('The AI service is temporarily unavailable.', 'openai_unavailable', 502)
  }
  return new ModelProviderError('The AI service rejected the structured request.', 'openai_request_rejected', 502)
}

async function readOpenAIResponse(response: Response): Promise<OpenAIResponse> {
  try {
    return await response.json() as OpenAIResponse
  } catch {
    throw new ModelProviderError(`OpenAI returned a non-JSON response (HTTP ${response.status}).`, 'invalid_openai_response')
  }
}

function extractOutputText(payload: OpenAIResponse): string {
  for (const item of payload.output ?? []) {
    if (item.type !== 'message') continue
    for (const content of item.content ?? []) {
      if (content.type === 'refusal') {
        throw new ModelProviderError(content.refusal ?? 'The model refused this request.', 'model_refusal', 422)
      }
      if (content.type === 'output_text' && content.text) return content.text
    }
  }
  throw new ModelProviderError('OpenAI returned no structured output.', 'empty_model_output')
}

function normalizeUsage(usage: OpenAIResponse['usage']): TokenUsage {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    cachedInputTokens: usage?.input_tokens_details?.cached_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  }
}

function emptyUsage(): TokenUsage {
  return { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, reasoningTokens: 0, totalTokens: 0 }
}

function numberFromEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function configuredRoleModel(role: string): string {
  return process.env[`OPENAI_MODEL_${roleEnvironmentSuffix(role)}`]?.trim()
    || DEFAULT_ROLE_MODELS[role]
    || process.env.OPENAI_MODEL?.trim()
    || 'unconfigured'
}

function configuredOpenAIReasoning(role: string, fallback: ReasoningEffort): ReasoningEffort {
  const roleName = `OPENAI_REASONING_EFFORT_${roleEnvironmentSuffix(role)}`
  const raw = process.env[roleName]?.trim() || process.env.OPENAI_REASONING_EFFORT?.trim()
  if (!raw) return fallback
  if (raw === 'low' || raw === 'medium') return raw
  throw new ModelProviderError(`${roleName} / OPENAI_REASONING_EFFORT must be low or medium.`, 'invalid_provider_config', 500)
}

function configuredOpenAIMaxOutput(role: string, fallback: number): number {
  const roleName = `OPENAI_MAX_OUTPUT_TOKENS_${roleEnvironmentSuffix(role)}`
  const raw = process.env[roleName]?.trim() || process.env.OPENAI_MAX_OUTPUT_TOKENS?.trim()
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed < 16) {
    throw new ModelProviderError(`${roleName} / OPENAI_MAX_OUTPUT_TOKENS must be an integer of at least 16.`, 'invalid_provider_config', 500)
  }
  return parsed
}

function roleEnvironmentSuffix(role: string): string {
  return role.toUpperCase().replaceAll('-', '_')
}

export interface SchemaValidation {
  readonly valid: boolean
  readonly errors: readonly string[]
}

/** Small runtime validator for the JSON-Schema subset used by this demo. */
export function validateAgainstSchema(value: unknown, schema: JsonSchema): SchemaValidation {
  const errors: string[] = []
  validateNode(value, schema, schema, '$', errors)
  return { valid: errors.length === 0, errors }
}

function validateNode(value: unknown, schema: JsonSchema, root: JsonSchema, path: string, errors: string[]): void {
  if (errors.length >= 12) return
  if (typeof schema.$ref === 'string') {
    const resolved = resolveLocalRef(root, schema.$ref)
    if (!resolved) errors.push(`${path} uses an unresolved schema reference`)
    else validateNode(value, resolved, root, path, errors)
    return
  }
  if ('const' in schema && !Object.is(schema.const, value)) {
    errors.push(`${path} must equal the declared constant`)
    return
  }
  if (Array.isArray(schema.anyOf)) {
    const valid = schema.anyOf.some((candidate) => {
      if (!isRecord(candidate)) return false
      const candidateErrors: string[] = []
      validateNode(value, candidate, root, path, candidateErrors)
      return candidateErrors.length === 0
    })
    if (!valid) errors.push(`${path} does not match any allowed schema`)
    return
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((entry) => Object.is(entry, value))) {
    errors.push(`${path} must be one of the declared enum values`)
    return
  }

  const type = schema.type
  if (type === 'object') {
    if (!isRecord(value)) {
      errors.push(`${path} must be an object`)
      return
    }
    const properties = isRecord(schema.properties) ? schema.properties : {}
    const required = Array.isArray(schema.required) ? schema.required.filter((key): key is string => typeof key === 'string') : []
    for (const key of required) if (!(key in value)) errors.push(`${path}.${key} is required`)
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!(key in properties)) errors.push(`${path}.${key} is not allowed`)
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (key in value && isRecord(childSchema)) validateNode(value[key], childSchema, root, `${path}.${key}`, errors)
    }
    return
  }
  if (type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`)
      return
    }
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) errors.push(`${path} has too few items`)
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) errors.push(`${path} has too many items`)
    if (schema.uniqueItems === true && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${path} must contain unique items`)
    }
    if (isRecord(schema.items)) value.forEach((item, index) => validateNode(item, schema.items as JsonSchema, root, `${path}[${index}]`, errors))
    return
  }
  if (type === 'string') {
    if (typeof value !== 'string') errors.push(`${path} must be a string`)
    else {
      if (typeof schema.minLength === 'number' && value.length < schema.minLength) errors.push(`${path} is too short`)
      if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) errors.push(`${path} is too long`)
    }
  }
  if (type === 'number' || type === 'integer') {
    if (typeof value !== 'number' || (type === 'integer' && !Number.isInteger(value))) errors.push(`${path} must be a ${type}`)
    else {
      if (typeof schema.minimum === 'number' && value < schema.minimum) errors.push(`${path} is below its minimum`)
      if (typeof schema.maximum === 'number' && value > schema.maximum) errors.push(`${path} is above its maximum`)
    }
  }
  if (type === 'boolean' && typeof value !== 'boolean') errors.push(`${path} must be a boolean`)
}

function resolveLocalRef(root: JsonSchema, ref: string): JsonSchema | undefined {
  if (!ref.startsWith('#/')) return undefined
  let value: unknown = root
  for (const encodedPart of ref.slice(2).split('/')) {
    const part = encodedPart.replaceAll('~1', '/').replaceAll('~0', '~')
    if (!isRecord(value) || !(part in value)) return undefined
    value = value[part]
  }
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertNoExecutableMarkup(value: unknown, path = '$'): void {
  if (typeof value === 'string') {
    const unsafe = /<\/?(?:script|style|iframe|object|embed|svg)\b|javascript\s*:|on(?:click|load|error)\s*=|```(?:html|javascript|js|css)/iu
    if (unsafe.test(value)) {
      throw new ModelProviderError(`Model output contains forbidden executable markup at ${path}.`, 'unsafe_model_output', 422)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoExecutableMarkup(item, `${path}[${index}]`))
    return
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) assertNoExecutableMarkup(child, `${path}.${key}`)
  }
}
