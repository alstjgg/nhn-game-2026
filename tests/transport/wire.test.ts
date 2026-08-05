// [e6#A8] — the request block of contract-calls §11:
//   POST <PROXY_BASE_URL>/dday/call
//   content-type: application/json
// and nothing else. `origin` is set by the browser and is forbidden to script;
// the transport must never try. There is no auth header on this route.
import { describe, it, expect } from 'vitest'

import { CALL_PATH, createHttpRequestFn, createTransport } from '../../src/transport/index.ts'
import { joinCallUrl } from '../../src/transport/wire.ts'

import { JUDGMENT_200, JUDGMENT_REQUEST, stubFetch } from './_helpers.ts'

const BASE = 'https://proxy.example.test'

async function post(baseUrl: string) {
  const stub = stubFetch([{ status: 200, body: JSON.stringify(JUDGMENT_200) }])
  await createTransport({ baseUrl, fetch: stub.fetch }).send(JUDGMENT_REQUEST)
  const call = stub.calls[0]
  expect(call, 'the transport never reached the wire').toBeDefined()
  return call!
}

describe('[e6#A8] the URL is <base>/dday/call', () => {
  it('CALL_PATH is the single route §11 defines', () => {
    expect(CALL_PATH).toBe('/dday/call')
  })

  it('joinCallUrl tolerates any number of trailing slashes on the base', () => {
    expect(joinCallUrl(BASE)).toBe(`${BASE}/dday/call`)
    expect(joinCallUrl(`${BASE}/`)).toBe(`${BASE}/dday/call`)
    expect(joinCallUrl(`${BASE}///`)).toBe(`${BASE}/dday/call`)
  })

  it('a base with a stage path keeps the path and appends the route once', () => {
    expect(joinCallUrl(`${BASE}/prod`)).toBe(`${BASE}/prod/dday/call`)
    expect(joinCallUrl(`${BASE}/prod/`)).toBe(`${BASE}/prod/dday/call`)
  })

  it('the live transport POSTs to exactly that URL', async () => {
    expect((await post(BASE)).url).toBe(`${BASE}/dday/call`)
    expect((await post(`${BASE}/`)).url).toBe(`${BASE}/dday/call`)
  })
})

describe('[e6#A8] the method, headers and body are §11 verbatim', () => {
  it('the method is POST', async () => {
    expect((await post(BASE)).init.method).toBe('POST')
  })

  it('content-type is application/json', async () => {
    const { init } = await post(BASE)
    const entries = Object.entries(init.headers).map(([k, v]) => [k.toLowerCase(), v] as const)
    expect(entries.find(([k]) => k === 'content-type')?.[1]).toMatch(/^application\/json/)
  })

  it('no origin and no authorization header is set by the transport', async () => {
    const { init } = await post(BASE)
    const names = Object.keys(init.headers).map((k) => k.toLowerCase())
    expect(names, 'origin is forbidden to script; the browser sets it').not.toContain('origin')
    expect(names).not.toContain('authorization')
    expect(names, 'the request block lists exactly one header').toEqual(['content-type'])
  })

  it('the body is JSON.stringify(request) byte for byte — no wrapper, no re-ordering', async () => {
    const { init } = await post(BASE)
    expect(init.body).toBe(JSON.stringify(JUDGMENT_REQUEST))
  })

  it('template_version and slots cross untouched', async () => {
    const { init } = await post(BASE)
    const sent = JSON.parse(init.body) as typeof JUDGMENT_REQUEST
    expect(sent).toEqual(JUDGMENT_REQUEST)
    expect(sent.template_version).toBe(JUDGMENT_REQUEST.template_version)
  })
})

describe('[e6#A8] createHttpRequestFn adapts a FetchLike into e0’s TransportRequestFn', () => {
  it('returns the status and a header reader', async () => {
    const stub = stubFetch([
      { status: 502, headers: { 'x-request-id': 'req-wire' }, body: '{"error":{"code":"invalid_model_output","message":"","requestId":"req-wire"}}' },
    ])
    const request = createHttpRequestFn({ baseUrl: BASE, fetch: stub.fetch })
    const response = await request(JUDGMENT_REQUEST)
    expect(response.status).toBe(502)
    expect(response.header('x-request-id')).toBe('req-wire')
    expect(response.header('x-absent')).toBe(null)
    expect(stub.calls[0]!.url).toBe(`${BASE}/dday/call`)
  })

  it('json() resolves the parsed body', async () => {
    const stub = stubFetch([{ status: 200, body: JSON.stringify(JUDGMENT_200) }])
    const request = createHttpRequestFn({ baseUrl: BASE, fetch: stub.fetch })
    await expect((await request(JUDGMENT_REQUEST)).json()).resolves.toEqual(JUDGMENT_200)
  })

  it('json() REJECTS on an unparseable body — that is the A11 signal', async () => {
    const stub = stubFetch([{ status: 200, body: 'not json at all' }])
    const request = createHttpRequestFn({ baseUrl: BASE, fetch: stub.fetch })
    await expect((await request(JUDGMENT_REQUEST)).json()).rejects.toBeInstanceOf(Error)
  })

  it('a transport built from a pre-supplied request fn uses it instead of fetch', async () => {
    let seen = 0
    const transport = createTransport({
      baseUrl: BASE,
      request: () => {
        seen += 1
        return Promise.resolve({
          status: 200,
          header: () => null,
          json: () => Promise.resolve(JUDGMENT_200),
        })
      },
    })
    const result = await transport.send(JUDGMENT_REQUEST)
    expect(seen).toBe(1)
    expect(result.ok).toBe(true)
    expect(transport.mode).toBe('live')
  })
})
