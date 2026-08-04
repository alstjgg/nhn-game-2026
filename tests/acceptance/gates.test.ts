// [e10] A1 and A20 — the suite's own census, and the discovery record.
//
// The five integration gates (A14–A19) are COMMANDS, not vitest cases: `cd
// proxy && npm ci` mutates `proxy/node_modules`, and shelling out would make
// this suite non-hermetic (design D6). What is testable here is that each gate
// was run and its result written down, so a green suite cannot hide a gate
// nobody executed.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../..')
const SUITE = HERE
const E10 = path.join(REPO, 'discovery', 'e10.md')
const DISCOVERY = path.join(REPO, 'DISCOVERY.md')

/** Every `it('…')` / `it("…")` title in this directory's test files. */
function titles(): string[] {
  const out: string[] = []
  for (const file of fs.readdirSync(SUITE)) {
    if (!file.endsWith('.test.ts')) continue
    const text = fs.readFileSync(path.join(SUITE, file), 'utf8')
    for (const match of text.matchAll(/\bit\(\s*(['"`])([\s\S]*?)\1/g)) out.push(match[2]!)
  }
  return out
}

describe('A1 the suite transcribes contract-engine-composer §8', () => {
  it('A1 has at least one test named for each of §8 criteria 1 through 10', () => {
    const named = titles()
    const missing: string[] = []
    for (let n = 1; n <= 10; n += 1) {
      if (!named.some((title) => title.includes(`§8-${n} `) || title.startsWith(`§8-${n}`))) {
        missing.push(`§8-${n}`)
      }
    }
    expect(missing, 'criteria with no test named for them').toEqual([])
  })

  it('A1 the census reads real files — an empty scan is a broken scan', () => {
    expect(titles().length).toBeGreaterThan(20)
  })
})

describe('A20 the discovery record', () => {
  it('A20 discovery/e10.md exists and is not empty', () => {
    expect(fs.existsSync(E10), 'discovery/e10.md is missing').toBe(true)
    expect(fs.readFileSync(E10, 'utf8').trim().length).toBeGreaterThan(0)
  })

  it('A20 it records the result of every one of the five integration gates', () => {
    const text = fs.readFileSync(E10, 'utf8')
    for (const gate of [
      'npm test',
      'npm run check',
      'npm run build',
      'npm run probe:selftest',
      'npm ci',
    ]) {
      expect(text, `no result recorded for \`${gate}\``).toContain(gate)
    }
  })

  it('A20 it logs K1 — §8-1’s union needs a sixth term for the player-supplied BLOCKS', () => {
    const text = fs.readFileSync(E10, 'utf8')
    expect(text).toContain('BLOCKS')
    expect(text).toMatch(/PLAYER_SUPPLIED_SLOTS/)
  })

  it('A20 it logs the stale contract-engine-composer §2.1 / AGENT_UTTERANCE warning', () => {
    const text = fs.readFileSync(E10, 'utf8')
    expect(text).toContain('AGENT_UTTERANCE')
    expect(text).toMatch(/§2\.1/)
  })

  it('A20 the surviving defaults reach the root DISCOVERY.md too', () => {
    const text = fs.readFileSync(DISCOVERY, 'utf8')
    expect(text, 'no [e10] entry in the root record').toMatch(/\[e10\]/)
  })
})
