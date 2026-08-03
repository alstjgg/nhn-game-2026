// [u2#c4] — spec-client §3 invariant 12 + §5.2 "what never appears in ViewEvent":
// inner_note · because_* / rejected_* · temperament · truths beyond exposure.
// The DRIVER, not the windows, is where that guarantee is enforced — so the guard
// is tested twice: as a property of the type text, and as runtime behaviour of the
// driver when a polluted fixture is fed to it.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import type { FixtureRun } from '../../src/client/driver/fixtures/types.ts'
import { createFixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import { assertSeamClean } from '../../src/client/driver/index.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SEAM = path.join(REPO, 'src/shared/view-driver.ts')

/** The forbidden vocabulary, §5.2 closing paragraph. */
const FORBIDDEN = ['inner_note', 'because_', 'rejected_', 'temperament', 'truths'] as const

function baseRun(events: ViewEvent[]): FixtureRun {
  return {
    id: 'leak',
    start: '13:05',
    end: '13:10',
    events,
    responses: { slot: { ok: true }, unslot: { ok: true }, mine: { ok: true }, deploy: { ok: true }, new_run: { ok: true } },
  }
}

describe('[u2#c4] the seam type text admits none of the banned fields', () => {
  const source = () => fs.readFileSync(SEAM, 'utf8')

  for (const banned of FORBIDDEN) {
    it(`(a:${banned}) src/shared/view-driver.ts never names \`${banned}\``, () => {
      expect(source().toLowerCase(), `the seam leaks ${banned}`).not.toContain(banned)
    })
  }

  it('(b) it carries no index signature that would let anything through', () => {
    expect(source()).not.toMatch(/\[\s*\w+\s*:\s*string\s*\]\s*:/)
  })

  it('(c) it does not re-export the Call payloads (those carry inner_note, W1)', () => {
    expect(source()).not.toMatch(/contracts/)
    expect(source()).not.toMatch(/\bEXPERIENCED\b/)
  })
})

describe('[u2#c4] the driver refuses a polluted event at the seam', () => {
  for (const banned of ['inner_note', 'because_gate', 'rejected_option', 'temperament'] as const) {
    it(`(d:${banned}) a top-level \`${banned}\` on an event is rejected`, () => {
      const dirty = { type: 'run_end', run: 1, [banned]: 'x' } as unknown as ViewEvent
      const driver = createFixtureDriver(baseRun([dirty]))
      driver.start()
      expect(() => driver.drain()).toThrow(new RegExp(banned))
    })
  }

  it('(e) a nested leak (inside FeedLine) is caught too — the walk is deep', () => {
    const dirty = {
      type: 'feed',
      line: { kind: 'radio', clock: '13:05', text: 'x', inner_note: 'why he did it' },
    } as unknown as ViewEvent
    const driver = createFixtureDriver(baseRun([dirty]))
    driver.start()
    expect(() => driver.drain()).toThrow(/inner_note/)
  })

  it('(f) a leak inside an array member (report.facts[]) is caught', () => {
    const dirty = {
      type: 'report',
      round: 1,
      facts: [{ id: 'b-r1-f01', text: 'F', species: 'fact', because_gate: 'g1' }],
      report_body: [],
    } as unknown as ViewEvent
    const driver = createFixtureDriver(baseRun([dirty]))
    driver.start()
    expect(() => driver.drain()).toThrow(/because_/)
  })

  it('(g) the guard fires BEFORE the listener sees the event', () => {
    const seen: ViewEvent[] = []
    const dirty = { type: 'run_end', run: 1, temperament: 'cold' } as unknown as ViewEvent
    const driver = createFixtureDriver(baseRun([dirty]))
    driver.subscribe((e) => seen.push(e))
    driver.start()
    expect(() => driver.drain()).toThrow()
    expect(seen, 'a polluted event reached a subscriber').toEqual([])
  })

  it('(h) a clean stream passes untouched', () => {
    const clean: ViewEvent[] = [
      { type: 'beat_start', beat: 1, clock: '13:05' },
      { type: 'feed', line: { kind: 'event', clock: '13:05', text: 'ok', sentence_id: 's-1' } },
      { type: 'run_end', run: 1 },
    ]
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(baseRun(clean))
    driver.subscribe((e) => seen.push(e))
    driver.start()
    expect(() => driver.drain()).not.toThrow()
    expect(seen).toEqual(clean)
  })
})

describe('[u2#c4] the guard is a reusable, exported predicate', () => {
  it('(i) assertSeamClean accepts a lawful event', () => {
    expect(() => assertSeamClean({ type: 'run_end', run: 1 } as ViewEvent)).not.toThrow()
  })

  for (const banned of FORBIDDEN) {
    it(`(j:${banned}) assertSeamClean throws naming \`${banned}\``, () => {
      const probe = banned.endsWith('_') ? `${banned}why` : banned
      expect(() => assertSeamClean({ type: 'run_end', run: 1, [probe]: 'x' } as unknown as ViewEvent)).toThrow(
        new RegExp(banned),
      )
    })
  }

  it('(k) it survives a cyclic object without hanging', () => {
    const cyclic: Record<string, unknown> = { type: 'run_end', run: 1 }
    cyclic.self = cyclic
    expect(() => assertSeamClean(cyclic as unknown as ViewEvent)).not.toThrow()
  })
})
