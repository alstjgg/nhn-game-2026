// [u2f#c9] — spec §5.4: fixtures ship in DEV builds only and must be tree-shaken
// out of the player build. [u2f#c10] — the frozen scenario pack, the design
// target and the shared modules are read-only inputs (C1/C13).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { REPO, designTarget } from './fixture-utils.ts'

const SRC = path.join(REPO, 'src')
const FIXTURES_REL = 'src/client/driver/fixtures'

const rel = (p: string) => path.relative(REPO, p).split(path.sep).join('/')

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(rel(full))
  }
  return out
}

/** Every emitted bundle artefact (js/css/html), repo-relative. */
function bundleFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...bundleFiles(full))
    else if (/\.(js|mjs|css|html)$/.test(entry.name)) out.push(rel(full))
  }
  return out
}

const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
const DYNAMIC_IMPORT = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' })
}

/** The commit this run branched from — the same idiom as the isomorphism guard. */
function runMergeBase(): string {
  const errors: string[] = []
  for (const ref of ['origin/main', 'main']) {
    try {
      return git(['merge-base', 'HEAD', ref]).trim()
    } catch (err) {
      errors.push(`${ref}: ${(err as Error).message}`)
    }
  }
  throw new Error(`cannot resolve a merge-base against main\n${errors.join('\n')}`)
}

describe('[u2f#c9] the demo fixture is reachable from dev only', () => {
  it('(a) no module outside the fixtures directory statically imports a `woodari-*` module', () => {
    const offenders: string[] = []
    for (const file of walk(SRC)) {
      if (file.startsWith(`${FIXTURES_REL}/`)) continue
      const source = fs.readFileSync(path.join(REPO, file), 'utf8')
      for (const m of source.matchAll(STATIC_IMPORT))
        if (/woodari/.test(m[1] as string)) offenders.push(`${file} → ${m[1]}`)
    }
    expect(offenders).toEqual([])
  })

  it('(b) any dynamic import of the fixtures sits behind `import.meta.env.DEV`', () => {
    const offenders: string[] = []
    for (const file of walk(SRC)) {
      if (file.startsWith(`${FIXTURES_REL}/`)) continue
      const source = fs.readFileSync(path.join(REPO, file), 'utf8')
      const dynamic = [...source.matchAll(DYNAMIC_IMPORT)].filter((m) =>
        /woodari|driver\/fixtures/.test(m[1] as string),
      )
      if (dynamic.length > 0 && !source.includes('import.meta.env.DEV'))
        offenders.push(`${file}: imports fixtures with no DEV guard`)
    }
    expect(offenders).toEqual([])
  })

  it('(c) the fixture barrel is imported by nothing in the player entry chain', () => {
    const entry = path.join(REPO, 'src/client/main.ts')
    if (!fs.existsSync(entry)) return
    const source = fs.readFileSync(entry, 'utf8')
    const statics = [...source.matchAll(STATIC_IMPORT)].map((m) => m[1] as string)
    expect(statics.filter((s) => /fixtures/.test(s))).toEqual([])
  })

  it('(d) if a build exists, no fixture string reached it', () => {
    const dist = path.join(REPO, 'dist')
    if (!fs.existsSync(dist)) {
      // A unit test must not shell out to the bundler; VERIFY runs
      // `npm run build` before this suite. Recorded, not silently passed.
      expect(fs.existsSync(dist)).toBe(false)
      return
    }
    const needles = ['woodari', 'b-r3-b01', designTarget().FEED[0]?.text ?? '첫 전화']
    const hits: string[] = []
    // `dist/data/**` is the pack copy the §3.7 plugin emits (C5) — the fixture
    // ban is about bundled CODE, not about the scenario data the app loads.
    const files = bundleFiles(dist).filter((f) => !f.startsWith('dist/data/'))
    for (const f of files) {
      const source = fs.readFileSync(path.join(REPO, f), 'utf8')
      for (const n of needles) if (source.includes(n)) hits.push(`${f} ← ${JSON.stringify(n)}`)
    }
    expect(hits).toEqual([])
  })
})

describe('[u2f#c10] frozen inputs are read, never written', () => {
  // progress.json's `frozen_globs` + the design target. NOTE: `src/shared/` as a
  // whole is NOT frozen — `view-driver.ts` is this run's own seam (u2). The two
  // consume-only modules of C13 are.
  const FROZEN = [
    'data/scenario/',
    'docs/design/',
    'src/shared/segment.ts',
    'src/shared/species.ts',
    'tools/tests/segment.golden.mjs',
    'docs/spec-client.md',
  ]

  it('(e) this unit introduces no diff under any frozen path', () => {
    const base = runMergeBase()
    const changed = git(['diff', '--name-only', base, '--'])
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const touched = changed.filter((f) => FROZEN.some((p) => f.startsWith(p)))
    expect(touched).toEqual([])
  })

  it('(f) the working tree has no uncommitted edit under a frozen path either', () => {
    const dirty = git(['status', '--porcelain', '--', ...FROZEN])
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    expect(dirty).toEqual([])
  })
})
