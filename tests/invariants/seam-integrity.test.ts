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

// RE-AIMED (C17) when the engine build landed. inv 12 governs what crosses the
// view-driver seam FROM THE VIEW SIDE: "windows and components consume
// `ViewEvent`s only". It was written while `src/engine` and `src/composer` were
// empty stubs, so "everything that is not `src/client/driver/`" was an exact
// description of the view side. It stopped being one the moment the isomorphic
// tier (physical §3.1) was implemented: `src/engine`, `src/composer`,
// `src/transport`, `src/driver` and `src/runloop` live BELOW the seam, and an
// edge among them is the architecture, not a breach of it.
//
// Nothing is skipped or excluded to go green — the ban still covers every
// module above the seam, which is the set the invariant was ever about.
const BELOW_SEAM_RE = /^src\/(engine|composer|transport|driver|runloop)(\/|$)/

/** The view side: everything that is neither a seam module nor below the seam. */
function aboveSeam(file: string): boolean {
  return !file.startsWith(DRIVER_PREFIX) && !BELOW_SEAM_RE.test(file)
}

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
    const outside = allSources().filter(aboveSeam)
    const offenders = graph(outside).filter((e) => CORE_RE.test(e.to))
    expect(formatAll(asHits(offenders))).toEqual([])
  })

  it('(b) the ban covers dynamic import() too, not just static specifiers', () => {
    const offenders: Hit[] = []
    for (const file of allSources().filter(aboveSeam)) {
      const text = blank(read(abs(file)), 'ts')
      offenders.push(...locate(file, text, /\bimport\(\s*['"][^'"]*\/(engine|composer)(\/|['"])/))
    }
    expect(formatAll(offenders)).toEqual([])
  })

  it('(c) no module outside driver/ names an engine or composer symbol via a bare specifier', () => {
    const offenders: Hit[] = []
    for (const file of allSources().filter(aboveSeam)) {
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

  // RE-AIMED (C17): `src/client/driver/` is the ONE module spec-client §2.1
  // licenses to reach the core — "(later) live driver binding engine+composer …
  // may import: `shared`; live driver only: `engine`, `composer`". Landing in the
  // isomorphic tier is therefore the seam working, not a leak. Everything else
  // out of `driver/` is still confined to `driver/` and `src/shared/`.
  it('(b) every relative import out of driver/ lands in driver/, src/shared/ or the isomorphic tier', () => {
    const driverFiles = filesUnder(DRIVER, '.ts').map(rel)
    const offenders = graph(driverFiles).filter(
      (e) =>
        !e.to.startsWith(DRIVER_PREFIX) && !e.to.startsWith('src/shared/') && !BELOW_SEAM_RE.test(e.to),
    )
    expect(formatAll(asHits(offenders))).toEqual([])
  })

  // RE-AIMED (C17). This asserted that NO core module may appear in the player
  // build graph at all, with the message "C8: fixture-only". C8 was a scope
  // exclusion of the client run, not a structural rule —
  // `docs/plan-client-build.md` §1: "**Does NOT do (run-level):** the live
  // driver's engine/composer binding (*engine does not exist yet*; build to the
  // seam, fixture-only)". The premise expired when the engine landed, and
  // `docs/spec-client.md` has always planned the opposite (§2.1 module table;
  // §5.1 "connect driver: fixture (default until proxy lands) | live"; §5.2 "the
  // same seam, live … windows cannot tell the difference").
  //
  // What was ever structural survives, and is now measured on the BUILD GRAPH
  // instead of the source tree: a core module may ship, but only a driver module
  // may be what pulled it in. A window or component reaching past the seam still
  // fails here, which is the thing inv 12 exists to catch.
  it('(c) in the player build graph, only driver modules reach engine or composer', () => {
    const offenders = [...playerBuildGraph()]
      .filter(aboveSeam)
      .flatMap((file) => graph([file]).filter((e) => CORE_RE.test(e.to)))
    expect(formatAll(asHits(offenders))).toEqual([])
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
