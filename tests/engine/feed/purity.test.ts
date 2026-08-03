// [e4#A11][e4#A12] — determinism and import direction.
//
// physical §3.2 / contract-engine-composer §7: neither side may touch DOM,
// `fs`, `fetch`, timers or randomness. `src/engine/feed/**` is compiled by
// `tsconfig.core.json`, which omits the DOM lib, so this suite guards the
// runtime half — plus the structural half A12 asks for, in the style of
// `tests/driver/import-direction.test.ts`: reads the repo from disk, imports no
// product module for the structural assertions.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createIdAllocator,
  buildFeed,
  buildReportSentences,
  assembleExperienced,
} from '../../../src/engine/feed/index.ts'
import { GOLDEN_BEAT, GOLDEN_REPORT, GOLDEN_ROUND } from './__fixtures__/beat.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const FEED_DIR = path.join(REPO, 'src/engine/feed')

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const rel = (p: string) => path.relative(REPO, p).split(path.sep).join('/')
const FILES = () => walk(FEED_DIR)

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
const BARE_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g

function specifiersOf(file: string): string[] {
  const source = fs.readFileSync(file, 'utf8')
  const out: string[] = []
  for (const m of source.matchAll(IMPORT_RE)) out.push(m[1]!)
  for (const m of source.matchAll(BARE_RE)) out.push(m[1]!)
  return out
}

function targetOf(file: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  return rel(path.resolve(path.dirname(file), spec))
}

describe('[e4#A11] the three builders are pure functions of their input', () => {
  it('(a) buildFeed twice on the same input is deep-equal', () => {
    const a = buildFeed(GOLDEN_BEAT, createIdAllocator(1))
    const b = buildFeed(GOLDEN_BEAT, createIdAllocator(1))
    expect(a).toEqual(b)
  })

  it('(b) buildReportSentences twice on the same input is deep-equal', () => {
    expect(buildReportSentences(GOLDEN_REPORT, createIdAllocator(1))).toEqual(
      buildReportSentences(GOLDEN_REPORT, createIdAllocator(1)),
    )
  })

  it('(c) assembleExperienced twice on the same input is deep-equal', () => {
    expect(assembleExperienced(GOLDEN_ROUND)).toEqual(assembleExperienced(GOLDEN_ROUND))
  })

  it('(d) no builder mutates its input', () => {
    const beat = JSON.stringify(GOLDEN_BEAT)
    const report = JSON.stringify(GOLDEN_REPORT)
    const round = JSON.stringify(GOLDEN_ROUND)
    buildFeed(GOLDEN_BEAT, createIdAllocator(1))
    buildReportSentences(GOLDEN_REPORT, createIdAllocator(1))
    assembleExperienced(GOLDEN_ROUND)
    expect(JSON.stringify(GOLDEN_BEAT)).toBe(beat)
    expect(JSON.stringify(GOLDEN_REPORT)).toBe(report)
    expect(JSON.stringify(GOLDEN_ROUND)).toBe(round)
  })

  it('(e) the clock is an input, never computed — it round-trips verbatim', () => {
    const lines = buildFeed({ ...GOLDEN_BEAT, clock: '23:59' }, createIdAllocator(1)).lines
    expect(new Set(lines.map((l) => l.clock))).toEqual(new Set(['23:59']))
  })
})

describe('[e4#A11] source text — no clock, no randomness, no I/O, no DOM', () => {
  const FORBIDDEN: readonly [string, RegExp][] = [
    ['Date', /\bDate\s*\.|new\s+Date\b/],
    ['Math.random', /\bMath\s*\.\s*random\b/],
    ['fetch', /\bfetch\s*\(/],
    ['fs', /from\s*['"](?:node:)?fs['"]/],
    ['document', /\bdocument\b/],
    ['window', /\bwindow\s*\./],
    ['setTimeout', /\bset(?:Timeout|Interval)\b/],
    ['performance.now', /\bperformance\s*\.\s*now\b/],
    ['crypto', /\bcrypto\s*\./],
  ]

  it('(f) the module folder exists (so the guard has something to guard)', () => {
    expect(FILES().length).toBeGreaterThan(0)
  })

  for (const [label, re] of FORBIDDEN) {
    it(`(g) no file under src/engine/feed/ reaches for ${label}`, () => {
      const offenders = FILES()
        .filter((f) => re.test(fs.readFileSync(f, 'utf8')))
        .map(rel)
      expect(offenders).toEqual([])
    })
  }
})

describe('[e4#A12] import direction — feed/ depends only on src/shared and itself', () => {
  it('(h) every relative import lands in src/shared/ or inside src/engine/feed/', () => {
    const offenders: string[] = []
    for (const f of FILES()) {
      for (const spec of specifiersOf(f)) {
        const target = targetOf(f, spec)
        if (!target) continue
        if (target.startsWith('src/shared/') || target.startsWith('src/engine/feed/')) continue
        offenders.push(`${rel(f)} -> ${target}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('(i) nothing under feed/ imports the client, the composer, or the datapack reader', () => {
    const offenders: string[] = []
    for (const f of FILES()) {
      for (const spec of specifiersOf(f)) {
        if (/client|composer|authoring|tools\/|data\//.test(spec)) offenders.push(`${rel(f)} -> ${spec}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('(j) feed/ pulls in no runtime package — dev-dependency-only toolchain', () => {
    const bare = FILES().flatMap((f) => specifiersOf(f).filter((s) => !s.startsWith('.')))
    expect(bare).toEqual([])
  })

  it('(k) the id grammar is consumed from src/shared/id.ts, never re-declared here', () => {
    const minting = /`b-r[^`]*\$\{|padStart\s*\(\s*2/
    const offenders = FILES()
      .filter((f) => minting.test(fs.readFileSync(f, 'utf8')))
      .map(rel)
    expect(offenders, 'the id grammar was re-derived instead of consumed from e0').toEqual([])
    const sources = FILES().map((f) => fs.readFileSync(f, 'utf8'))
    expect(sources.some((s) => /mintSentenceId/.test(s)), 'e0\'s minter is never called').toBe(true)
  })

  it('(l) the report-body segmenter is consumed, not reimplemented', () => {
    const sources = FILES().map((f) => fs.readFileSync(f, 'utf8'))
    expect(sources.some((s) => /segmentReportBody/.test(s))).toBe(true)
    expect(
      FILES().filter((f) => /function\s+segmentReportBody/.test(fs.readFileSync(f, 'utf8'))).map(rel),
    ).toEqual([])
  })

  it('(m) src/engine/feed/index.ts is a barrel for this folder only', () => {
    const barrel = path.join(FEED_DIR, 'index.ts')
    expect(fs.existsSync(barrel), 'src/engine/feed/index.ts is missing').toBe(true)
    const targets = specifiersOf(barrel).map((s) => targetOf(barrel, s))
    expect(
      targets.filter(
        (t) => t !== null && !t.startsWith('src/engine/feed/') && !t.startsWith('src/shared/'),
      ),
    ).toEqual([])
  })

  it('(n) e4 edits no file outside src/engine/feed/ — src/engine/index.ts stays e0\'s', () => {
    const engineIndex = fs.readFileSync(path.join(REPO, 'src/engine/index.ts'), 'utf8')
    expect(engineIndex).not.toMatch(/from\s*['"]\.\/feed/)
  })
})
