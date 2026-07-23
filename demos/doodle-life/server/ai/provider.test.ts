import { afterEach, describe, expect, it, vi } from 'vitest'

import { ModelProviderError, createProvider, type StructuredRequest } from './provider.ts'

const schema = {
  type: 'object',
  properties: { ok: { type: 'boolean' } },
  required: ['ok'],
  additionalProperties: false,
} as const

function request(signal?: AbortSignal): StructuredRequest<{ readonly ok: boolean }> {
  return {
    role: 'test-role',
    instructions: 'Return the test object.',
    input: [
      { type: 'input_text', text: 'test' },
      { type: 'input_image', image_url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'high' },
    ],
    schemaName: 'test_result',
    schema,
    reasoning: 'medium',
    maxOutputTokens: 3_210,
    signal,
    mock: () => ({ ok: true }),
  }
}

function responseBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'resp_test',
    model: 'gpt-test',
    status: 'completed',
    output: [{ type: 'message', content: [{ type: 'output_text', text: '{"ok":true}' }] }],
    usage: {
      input_tokens: 21,
      output_tokens: 8,
      total_tokens: 29,
      input_tokens_details: { cached_tokens: 5 },
      output_tokens_details: { reasoning_tokens: 3 },
    },
    ...overrides,
  }
}

function stubResponse(body: Record<string, unknown>, status = 200): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe.sequential('OpenAI structured provider lifecycle', () => {
  it('accepts only a completed structured response and preserves usage', async () => {
    const fetchMock = stubResponse(responseBody())
    const provider = createProvider({
      apiKey: 'server-test-key',
      provider: 'openai',
      model: 'gpt-fallback',
      roleModels: { 'test-role': 'gpt-test' },
    })

    const result = await provider.generate(request())

    expect(result.value).toEqual({ ok: true })
    expect(result.trace.usage).toEqual({
      inputTokens: 21,
      cachedInputTokens: 5,
      outputTokens: 8,
      reasoningTokens: 3,
      totalTokens: 29,
    })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body).toMatchObject({
      store: false,
      model: 'gpt-test',
      max_output_tokens: 3_210,
      prompt_cache_key: 'doodle-life:test-role',
      reasoning: { effort: 'medium' },
      text: {
        format: {
          type: 'json_schema',
          name: 'test_result',
          strict: true,
          schema,
        },
      },
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: 'test' },
          { type: 'input_image', image_url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'high' },
        ],
      }],
    })
    expect(JSON.stringify(body)).not.toContain('server-test-key')
  })

  it('reports max-output incomplete responses with their billable usage', async () => {
    stubResponse(responseBody({
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output: [],
    }))
    const provider = createProvider({ apiKey: 'server-test-key', provider: 'openai' })

    const error = await provider.generate(request()).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ModelProviderError)
    expect(error).toMatchObject({ code: 'model_output_incomplete', status: 502 })
    expect((error as ModelProviderError).trace?.usage.totalTokens).toBe(29)
  })

  it('applies role-specific reasoning and output limits for recorded tuning conditions', async () => {
    const fetchMock = stubResponse(responseBody())
    vi.stubEnv('OPENAI_REASONING_EFFORT', 'medium')
    vi.stubEnv('OPENAI_REASONING_EFFORT_TEST_ROLE', 'low')
    vi.stubEnv('OPENAI_MAX_OUTPUT_TOKENS', '2400')
    vi.stubEnv('OPENAI_MAX_OUTPUT_TOKENS_TEST_ROLE', '777')
    const provider = createProvider({ apiKey: 'server-test-key', provider: 'openai' })

    await provider.generate(request())

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body).toMatchObject({
      reasoning: { effort: 'low' },
      max_output_tokens: 777,
    })
  })

  it('distinguishes failed and refused terminal responses', async () => {
    stubResponse(responseBody({ status: 'failed', output: [] }))
    const provider = createProvider({ apiKey: 'server-test-key', provider: 'openai' })
    await expect(provider.generate(request())).rejects.toMatchObject({ code: 'model_response_failed' })

    stubResponse(responseBody({
      output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }],
    }))
    await expect(provider.generate(request())).rejects.toMatchObject({ code: 'model_refusal', status: 422 })
  })

  it('propagates an already-aborted parent signal before fetch begins', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal?.aborted).toBe(true)
      throw new DOMException('aborted', 'AbortError')
    })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    controller.abort(new Error('test cancellation'))
    const provider = createProvider({ apiKey: 'server-test-key', provider: 'openai' })

    await expect(provider.generate(request(controller.signal))).rejects.toMatchObject({ code: 'model_timeout', status: 504 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe.sequential('provider selection', () => {
  it('fails fast for explicit OpenAI without a key and unknown providers', () => {
    expect(() => createProvider({ provider: 'openai', apiKey: '' })).toThrowError(
      expect.objectContaining({ code: 'missing_openai_api_key' }),
    )
    expect(() => createProvider({ provider: 'not-a-provider', apiKey: '' })).toThrowError(
      expect.objectContaining({ code: 'invalid_provider_config' }),
    )
    expect(createProvider({ provider: 'api', apiKey: 'test-key' }).kind).toBe('openai')
    expect(createProvider({ provider: 'mock', apiKey: '' }).kind).toBe('mock')
  })
})
