// [u0#c3] + [u0#c9] — the isomorphic-core guard (C6) and the §3.7 pack-copy guard.
//
// ⚠️ **Repaired by e0** (plan-engine-build §1: "if that test does not yet assert
// all six folders, extending it is e0's job and nobody else's"). Three
// assertions here were pinned by the client run's u0 against a world that `main`
// #114 legitimately changed, and they were red at this run's base:
//
//   (a) `CORE_TSCONFIG_SHA256` — physical §3.1 added `src/transport`,
//       `src/driver` and `src/runloop` to `include`, so the byte pin moved.
//   (c) "its include is exactly the three core areas" — there are six
//       isomorphic folders now, not three.
//   (c9) "vite.config.ts declares no plugins array and no closeBundle hook" —
//       #114 landed the physical §3.7 pack-copy plugin, so the guard's premise
//       ("this unit must not introduce one") is stale. What the guard is
//       actually for survives and is re-aimed below: the copy stays **by name**,
//       build-only, with no hand-rolled dev file server.
//
// The inspected files — `tsconfig.core.json`, `vite.config.ts` — are frozen
// inputs (PRD §9). e0 moves these expectations, never the files.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// D7 — SHA-256 of tsconfig.core.json as it stands on `main` after #114. This
// file is 윤석's standing condition: it must come out of this run byte-identical.
const CORE_TSCONFIG_SHA256 = '876a7313e70e221c2619de88fbf91507c92483301c91688b65afd8453b736fcd'

// physical §3.1 / spec-physical-architecture §2 table — the six isomorphic
// folders, in declaration order. `tsconfig.core.json` is the mechanical
// isomorphism guard; a folder missing here compiles with the DOM lib.
const ISOMORPHIC_FOLDERS = [
  'src/shared',
  'src/engine',
  'src/composer',
  'src/transport',
  'src/driver',
  'src/runloop',
] as const

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), 'utf8')
}

/** tsconfig files carry comments; strip them before JSON.parse. */
function parseJsonc(source: string): unknown {
  const noBlock = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const noLine = noBlock.replace(/(^|\s)\/\/.*$/gm, '$1')
  const noTrailingComma = noLine.replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(noTrailingComma)
}

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' })
}

describe('[u0#c3] tsconfig.core.json is untouched (C6 standing condition)', () => {
  it('(a) SHA-256 matches the pinned constant', () => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, 'tsconfig.core.json'))).digest('hex')
    expect(hash).toBe(CORE_TSCONFIG_SHA256)
  })

  it('(b) git reports no modification to tsconfig.core.json', () => {
    expect(git(['status', '--porcelain', '--', 'tsconfig.core.json']).trim()).toBe('')
  })

  it('(c) its include is exactly the six isomorphic folders', () => {
    const cfg = parseJsonc(read('tsconfig.core.json')) as { include?: unknown }
    expect(cfg.include).toEqual([...ISOMORPHIC_FOLDERS])
  })

  it('(c1) no isomorphic folder is ever dropped from include (standing condition)', () => {
    const cfg = parseJsonc(read('tsconfig.core.json')) as { include?: string[] }
    for (const folder of ISOMORPHIC_FOLDERS) {
      expect(cfg.include, `${folder} left the isomorphic core`).toContain(folder)
    }
  })

  it('(c2) it still omits DOM lib and all ambient types', () => {
    const cfg = parseJsonc(read('tsconfig.core.json')) as {
      compilerOptions?: { lib?: unknown; types?: unknown }
    }
    expect(cfg.compilerOptions?.lib).toEqual(['ES2023'])
    expect(cfg.compilerOptions?.types).toEqual([])
  })
})

describe('[u0#c3] no path alias anywhere (C6)', () => {
  const tsconfigs = () =>
    fs
      .readdirSync(REPO)
      .filter((f) => /^tsconfig.*\.json$/.test(f))
      .sort()

  it('(d) no repo-root tsconfig*.json declares compilerOptions.paths', () => {
    const offenders = tsconfigs().filter((f) => {
      const cfg = parseJsonc(read(f)) as { compilerOptions?: Record<string, unknown> }
      return cfg.compilerOptions != null && 'paths' in cfg.compilerOptions
    })
    expect(offenders).toEqual([])
  })

  it('(d2) tsconfig.test.json exists, extends tsconfig.json, and adds no paths', () => {
    expect(tsconfigs()).toContain('tsconfig.test.json')
    const cfg = parseJsonc(read('tsconfig.test.json')) as {
      extends?: unknown
      include?: unknown
      compilerOptions?: Record<string, unknown>
    }
    expect(cfg.extends).toBe('./tsconfig.json')
    expect(cfg.compilerOptions ?? {}).not.toHaveProperty('paths')
    expect(Array.isArray(cfg.include) && (cfg.include as string[]).some((i) => i.includes('tests'))).toBe(true)
  })

  it('(e) no build/test config declares a resolve alias', () => {
    for (const f of ['vite.config.ts', 'vitest.config.ts', 'playwright.config.ts']) {
      expect(fs.existsSync(path.join(REPO, f)), `${f} is missing`).toBe(true)
      const source = read(f)
      expect(source, `${f} declares an alias`).not.toMatch(/resolve\s*:\s*\{[\s\S]*alias/)
      expect(source, `${f} declares an alias`).not.toMatch(/(^|\s)alias\s*:/)
    }
  })
})

describe('[u0#c9] vite.config.ts carries the §3.7 pack-copy plugin, by name and build-only', () => {
  // The u0-era `git status --porcelain -- vite.config.ts` freeze stood here and
  // is retired (08-06). It asserted a rule, not a behaviour: it failed any edit
  // to the file, deliberate or not, and passed the moment one was committed —
  // so it caught careless *uncommitted* work and nothing else. The four asserts
  // below already state the properties it was standing in for, and this one
  // states the property whose absence let the answer key ship.
  it('publishes by FILE, not by directory — no authoring surface rides along', () => {
    const source = read('vite.config.ts')
    // The directory form was `cpSync(data/scenario → dist/data/scenario,
    // { recursive: true })`, which published every authoring surface beside the
    // six files the run fetches — `draft.md` above all, the compile SOURCE,
    // 44 kB carrying every gate, key condition and truth in the case. It was
    // readable on the deployed site. A recursive directory copy cannot express
    // "the pack, but not the source it was compiled from"; an enumerated file
    // list can. `tests/scaffold/published-data.test.ts` holds the list itself
    // to the loaders' `PACK_FILES`.
    // Aimed at the COPY, not at `recursive` generally — `mkdirSync(dirname(to),
    // { recursive: true })` is how a file copy makes its parent and is fine.
    expect(source, 'a recursive copy publishes whatever sits beside the pack').not.toMatch(
      /\bcpSync\b/,
    )
    expect(source, 'the copy is not file-at-a-time').toMatch(/\bcopyFileSync\b/)
    expect(source, 'the published set is no longer enumerated by file').toMatch(
      /publishedDataFiles/,
    )
  })

  it('the plugin #114 landed is present — a plugins array with a closeBundle hook', () => {
    const source = read('vite.config.ts')
    expect(source).toMatch(/(^|\s)plugins\s*:/)
    expect(source).toMatch(/closeBundle/)
  })

  it('copies published pack dirs BY NAME, never `data/` wholesale (§3.7 · §3.9)', () => {
    const source = read('vite.config.ts')
    // `data/` is inputs; a wholesale copy would publish anything that ever
    // lands there as an output on the next deploy.
    expect(source).toMatch(/\bscenario\b/)
    expect(source).toMatch(/\bpolicy\b/)
    expect(source).not.toMatch(/cpSync\(\s*join\([^)]*['"]data['"]\s*\)/)
  })

  it('adds no dev middleware — Vite already serves the project root', () => {
    // The first version hand-rolled one and its prefix check ran on the
    // still-encoded path, so `%2e%2e%2f` decoded into a traversal out of
    // `data/`. Removed rather than patched; this keeps it removed.
    const source = read('vite.config.ts')
    expect(source).not.toMatch(/configureServer/)
    expect(source).not.toMatch(/middlewares/)
  })

  it('still pins the GitHub-Pages base', () => {
    expect(read('vite.config.ts')).toMatch(/base:\s*'\/nhn-game-2026\/'/)
  })
})
