// [u9#c4] spec-client §3 invariant 12 (driver seam integrity) — C8.
//
// "Windows and components consume `ViewEvent`s only; no module outside
// `driver/` may import engine or composer. This is what keeps fixture and live
// modes pixel-identical."
//
// SCOPE (P1-D scoping rule, [u9#c6]): **repo-scoped, no allowlist**. The
// import graph is built over every `.ts` under `src/`, so no directory can
// opt out. What this adds over `tests/driver/import-direction.test.ts` (u2,
// which walks `src/client` + the three core dirs and reports `from -> to`):
// dynamic `import()` and bare-specifier edges are included, the `index.html`
// entry graph is checked, and every offender is reported as `file:line`.
import { describe, expect, it } from 'vitest'
import {
  DRIVER,
  SRC,
  abs,
  blank,
  filesUnder,
  formatAll,
  htmlEntries,
  locate,
  playerBuildGraph,
  read,
  rel,
  resolveSpecifier,
  specifiersOf,
} from './invariant-utils.ts'
import type { Hit } from './invariant-utils.ts'

const DRIVER_PREFIX = 'src/client/driver/'
const CLIENT_PREFIX = 'src/client/'
const CORE_RE = /^src\/(engine|composer)(\/|$)/

function allSources(): string[] {
  return filesUnder(SRC, '.ts').map(rel)
}

interface Edge {
  readonly from: string
  readonly to: string
  readonly spec: string
  readonly line: number
}

/** Every relative import/re-export/`import()` edge, with the line it sits on. */
function graph(files: string[]): Edge[] {
  const out: Edge[] = []
  for (const file of files) {
    const text = blank(read(abs(file)), 'ts')
    for (const spec of specifiersOf(file)) {
      const to = resolveSpecifier(file, spec)
      if (!to) continue
      const at = locate(file, text, new RegExp(`['"]${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`))
      out.push({ from: file, to, spec, line: at[0]?.line ?? 0 })
    }
  }
  return out
}

function asHits(edges: Edge[]): Hit[] {
  return edges.map((e) => ({ file: e.from, line: e.line, match: `imports ${e.to}` }))
}

describe('[u9#c4] inv 12 — the import graph is non-vacuous', () => {
  it('(a) the sweep finds every .ts under src/ and resolves real edges', () => {
    const files = allSources()
    expect(files.length, 'no TypeScript source found under src/').toBeGreaterThan(5)
    expect(files, 'the seam module is missing').toContain('src/shared/view-driver.ts')
    expect(graph(files).length, 'the graph resolved zero edges — the resolver is broken').toBeGreaterThan(3)
  })

  it('(b) driver/ exists and is the only sanctioned seam crossing point', () => {
    expect(filesUnder(DRIVER, '.ts').length, 'src/client/driver/ is empty').toBeGreaterThan(0)
  })
})

describe('[u9#c4] nothing outside driver/ imports engine or composer', () => {
  it('(a) no module outside src/client/driver/ reaches engine or composer', () => {
    const outside = allSources().filter((f) => !f.startsWith(DRIVER_PREFIX))
    const offenders = graph(outside).filter((e) => CORE_RE.test(e.to))
    expect(formatAll(asHits(offenders))).toEqual([])
  })

  it('(b) the ban covers dynamic import() too, not just static specifiers', () => {
    const offenders: Hit[] = []
    for (const file of allSources().filter((f) => !f.startsWith(DRIVER_PREFIX))) {
      const text = blank(read(abs(file)), 'ts')
      offenders.push(...locate(file, text, /\bimport\(\s*['"][^'"]*\/(engine|composer)(\/|['"])/))
    }
    expect(formatAll(offenders)).toEqual([])
  })

  it('(c) no module outside driver/ names an engine or composer symbol via a bare specifier', () => {
    const offenders: Hit[] = []
    for (const file of allSources().filter((f) => !f.startsWith(DRIVER_PREFIX))) {
      const bare = specifiersOf(file).filter((s) => !s.startsWith('.') && /^(engine|composer)(\/|$)/.test(s))
      for (const spec of bare) {
        const text = blank(read(abs(file)), 'ts')
        offenders.push(...locate(file, text, new RegExp(`['"]${spec}['"]`)))
      }
    }
    expect(formatAll(offenders)).toEqual([])
  })
})

describe('[u9#c4] nothing imports src/client/', () => {
  it('(a) engine, composer and shared stay client-free', () => {
    const core = allSources().filter((f) => CORE_RE.test(f) || f.startsWith('src/shared/'))
    const offenders = graph(core).filter((e) => e.to.startsWith(CLIENT_PREFIX))
    expect(formatAll(asHits(offenders))).toEqual([])
  })

  it('(b) no module outside src/client/ imports into src/client/ at all', () => {
    const outside = allSources().filter((f) => !f.startsWith(CLIENT_PREFIX) && f !== 'src/main.ts')
    const offenders = graph(outside).filter((e) => e.to.startsWith(CLIENT_PREFIX))
    expect(formatAll(asHits(offenders))).toEqual([])
  })

  it('(c) src/main.ts is the ONLY module allowed to reach into src/client (it is the entry)', () => {
    // The Vite entry has to hand off to the client boot root; that single edge
    // is the sanctioned exception, and it must stay single.
    const entries = htmlEntries()
    expect(entries, 'index.html declares no module entry').toContain('src/main.ts')
    const crossers = allSources()
      .filter((f) => !f.startsWith(CLIENT_PREFIX))
      .filter((f) => graph([f]).some((e) => e.to.startsWith(CLIENT_PREFIX)))
    expect(crossers).toEqual(['src/main.ts'])
  })
})

describe('[u9#c4] the driver seam is the only path to the view', () => {
  it('(a) src/shared/view-driver.ts is a leaf — it imports nothing', () => {
    expect(specifiersOf('src/shared/view-driver.ts')).toEqual([])
  })

  it('(b) every relative import out of driver/ lands in driver/ or src/shared/', () => {
    const driverFiles = filesUnder(DRIVER, '.ts').map(rel)
    const offenders = graph(driverFiles).filter(
      (e) => !e.to.startsWith(DRIVER_PREFIX) && !e.to.startsWith('src/shared/'),
    )
    expect(formatAll(asHits(offenders))).toEqual([])
  })

  it('(c) the player build graph contains no engine or composer module', () => {
    const inBuild = [...playerBuildGraph()].filter((f) => CORE_RE.test(f)).sort()
    expect(inBuild, 'engine/composer code reached the player bundle (C8: fixture-only)').toEqual([])
  })
})

describe('[u9#c4] the graph walker has teeth', () => {
  it('(a) it resolves a relative specifier to a repo path', () => {
    expect(resolveSpecifier('src/client/main.ts', './shell/boot.ts')).toBe('src/client/shell/boot.ts')
    expect(resolveSpecifier('src/client/main.ts', 'node:fs')).toBeNull()
  })

  it('(b) it sees `import type` and re-export edges, not just plain imports', () => {
    expect(specifiersOf('src/client/shell/window-registry.ts')).toContain('../driver/index.ts')
    expect(specifiersOf('src/client/driver/index.ts').some((s) => s.includes('view-driver'))).toBe(true)
  })

  it('(c) the CORE_RE pattern matches engine/composer paths and nothing else', () => {
    expect(CORE_RE.test('src/engine/index.ts')).toBe(true)
    expect(CORE_RE.test('src/composer/index.ts')).toBe(true)
    expect(CORE_RE.test('src/client/driver/index.ts')).toBe(false)
    expect(CORE_RE.test('src/shared/view-driver.ts')).toBe(false)
  })
})
