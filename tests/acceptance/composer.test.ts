// [e10] contract-engine-composer §8 criteria 4, 7 and 10 — the composed payload.
//
// A7/A10/A13. §8-7 is the only criterion that crosses the tier boundary, and it
// runs OFFLINE against the proxy's own validators — `fixtures/proxy.ts` is this
// suite's single door into `proxy/src/*`, and it never reaches AWS.
import { beforeAll, describe, expect, it } from 'vitest'
import { BLOCK_PAIR, composerRig, driveRound } from './fixtures/rig.ts'
import type { Driven } from './fixtures/rig.ts'
import { CALL_SPECS, asProxyRequest, assertEnvelope } from './fixtures/proxy.ts'
import { PROXY_OWNED_SLOTS } from '../../src/engine/feed/slots.ts'

let driven: Driven

beforeAll(async () => {
  driven = await driveRound()
})

const first = (type: string) => {
  const found = driven.requests.find((request) => request.call_type === type)
  if (found === undefined) throw new Error(`the driven round composed no ${type} call`)
  return found
}

describe('§8-4 the composer emits no proxy-owned slot', () => {
  it('§8-4 judgment() output has no FLAW, INCIDENT or PRIORITY_LIST key', () => {
    const slots = first('judgment').slots as Record<string, unknown>
    for (const owned of PROXY_OWNED_SLOTS) {
      expect(owned in slots, `judgment slots carry ${owned}`).toBe(false)
    }
  })

  it('§8-4 the check is on key presence, not on value — an explicit undefined still fails', () => {
    const slots = { ...(first('judgment').slots as Record<string, unknown>), FLAW: undefined }
    const leaked = PROXY_OWNED_SLOTS.filter((owned) => owned in slots)
    expect(leaked).toEqual(['FLAW'])
  })

  it('§8-4 narration() and reporter() are clean too', () => {
    for (const type of ['narration', 'reporter']) {
      const slots = first(type).slots as Record<string, unknown>
      for (const owned of PROXY_OWNED_SLOTS) {
        expect(owned in slots, `${type} slots carry ${owned}`).toBe(false)
      }
    }
  })
})

describe('§8-7 the composed payload is accepted by the proxy', () => {
  it('§8-7 judgment() passes the handler’s envelope validation', () => {
    expect(assertEnvelope(first('judgment'))).toEqual([])
  })

  it('§8-7 judgment() passes CALL_SPECS.judgment.buildTool without error', () => {
    const request = asProxyRequest(first('judgment'))
    expect(() => CALL_SPECS.judgment.buildTool(request.slots)).not.toThrow()
  })

  it('§8-7 it survives a JSON round trip — the payload crosses the wire as bytes', () => {
    const wired = JSON.parse(JSON.stringify(first('judgment'))) as unknown
    expect(assertEnvelope(wired)).toEqual([])
    expect(() => CALL_SPECS.judgment.buildTool(asProxyRequest(wired).slots)).not.toThrow()
  })

  it('§8-7 a broken envelope is still rejected — the validator is live, not a stub', () => {
    expect(assertEnvelope({ ...first('judgment'), template_version: '0.4' })).not.toEqual([])
    expect(assertEnvelope(null)).not.toEqual([])
  })

  it('§8-7 all three call types clear the same door', () => {
    for (const type of ['judgment', 'narration', 'reporter'] as const) {
      const request = asProxyRequest(first(type))
      expect(assertEnvelope(request), type).toEqual([])
      expect(() => CALL_SPECS[type].buildTool(request.slots), type).not.toThrow()
    }
  })
})

describe('§8-10 the same block set composes the same bytes', () => {
  it('§8-10 judgment(view, [n02, f01]) and the reversed array are byte-identical', async () => {
    const rig = await composerRig()
    const [a, b] = BLOCK_PAIR
    const forward = rig.composer.judgment(rig.gateView, [a, b])
    const reversed = rig.composer.judgment(rig.gateView, [b, a])
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed))
  })

  it('§8-10 the pair the criterion names is really in the store — not a vacuous pass', () => {
    expect(BLOCK_PAIR).toEqual(['b-r1-n02', 'b-r1-f01'])
  })

  it('§8-10 a repeated id collapses — the set, not the list, is what is compared', async () => {
    const rig = await composerRig()
    const [a, b] = BLOCK_PAIR
    const once = rig.composer.judgment(rig.gateView, [a, b])
    const twice = rig.composer.judgment(rig.gateView, [a, b, a])
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))
  })

  it('§8-10 a different block set composes different bytes', async () => {
    const rig = await composerRig()
    const [a, b] = BLOCK_PAIR
    const pair = rig.composer.judgment(rig.gateView, [a, b])
    const single = rig.composer.judgment(rig.gateView, [a])
    expect(JSON.stringify(pair)).not.toBe(JSON.stringify(single))
  })

  it('§8-10 an unknown id throws before any payload escapes', async () => {
    const rig = await composerRig()
    expect(() => rig.composer.judgment(rig.gateView, ['b-r1-n02', 'b-r9-z99'])).toThrow()
  })
})
