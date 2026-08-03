// [e8#A6] — src/runloop/ stays isomorphic: no host globals (the literal
// `sessionStorage` above all — the adapter is injected, decision 15/D1), and no
// import that leaves `src/runloop/**` or `src/shared/**`. Structural only:
// reads the repo from disk, imports nothing from src/.
//
// Mirrors the walk/import-regex helpers of tests/scaffold/layout.test.ts and the
// BANNED list of tests/scaffold/skeleton.test.ts so the two cannot drift apart.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const RUNLOOP = path.join(REPO, 'src/runloop')

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return walk(full)
    return e.isFile() && full.endsWith('.ts') ? [full] : []
  })
}

const rel = (p: string): string => path.relative(REPO, p).split(path.sep).join('/')

/** Source with block and line comments stripped — prose may explain absences. */
function code(file: string): string {
  return fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g

function specifiersOf(source: string): string[] {
  const out: string[] = []
  for (const m of source.matchAll(IMPORT_RE)) out.push(m[1]!)
  for (const m of source.matchAll(BARE_IMPORT_RE)) out.push(m[1]!)
  return out
}

function resolveSpecifier(fromFile: string, spec: string): string | null {
  const base = path.resolve(path.dirname(fromFile), spec)
  const candidates = [base, `${base}.ts`, `${base}.js`, path.join(base, 'index.ts')]
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null
}

const BANNED = [
  /\bsessionStorage\b/,
  /\blocalStorage\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\bglobalThis\b/,
  /\bprocess\b/,
  /\bconsole\./,
  /from\s+['"]node:/,
]

describe('[e8#A6] src/runloop/ is DOM-free and host-global-free', () => {
  it('(a) the folder exists and carries source', () => {
    expect(fs.existsSync(RUNLOOP)).toBe(true)
    expect(walk(RUNLOOP).length).toBeGreaterThan(0)
  })

  it('(b) no file names a host global — the storage adapter is injected, never reached for', () => {
    const offenders: string[] = []
    for (const file of walk(RUNLOOP)) {
      const src = code(file)
      for (const re of BANNED) if (re.test(src)) offenders.push(`${rel(file)} → ${re}`)
    }
    expect(offenders).toEqual([])
  })

  it('(c) every import resolves inside src/runloop/** or src/shared/**', () => {
    const offenders: string[] = []
    for (const file of walk(RUNLOOP)) {
      for (const spec of specifiersOf(fs.readFileSync(file, 'utf8'))) {
        if (!spec.startsWith('.')) {
          offenders.push(`${rel(file)} imports bare specifier "${spec}"`)
          continue
        }
        const target = resolveSpecifier(file, spec)
        if (!target) {
          offenders.push(`${rel(file)} imports unresolvable "${spec}"`)
          continue
        }
        const r = rel(target)
        if (!r.startsWith('src/runloop/') && !r.startsWith('src/shared/')) {
          offenders.push(`${rel(file)} imports out of bounds → ${r}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('(d) the §5.2 seam types are imported, never re-declared here', () => {
    const offenders: string[] = []
    for (const file of walk(RUNLOOP)) {
      const src = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      for (const name of ['Species', 'Sentence', 'FeedKind', 'FeedLine', 'ViewEvent', 'MembraneOp', 'Block']) {
        const re = new RegExp(`^\\s*(?:export\\s+)?(?:type|interface)\\s+${name}\\b`, 'm')
        if (re.test(src)) offenders.push(`${rel(file)} re-declares ${name}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
