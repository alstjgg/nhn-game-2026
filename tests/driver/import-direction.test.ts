// [u2#c6] — spec-client §2.1 / invariant 12: import direction is
// client → composer → engine → shared, nothing imports client, and NO module
// outside `driver/` may import engine or composer. Structural only: reads the
// repo from disk, imports no product module.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = path.join(REPO, 'src')
const DRIVER = path.join(SRC, 'client/driver')

const DRIVER_FILES = [
  'src/client/driver/index.ts',
  'src/client/driver/fixture-driver.ts',
  'src/client/driver/clock.ts',
  'src/client/driver/test-hooks.ts',
  'src/client/driver/fixtures/types.ts',
  'src/client/driver/fixtures/minimal.ts',
] as const

const SEAM_NAMES = ['Species', 'Sentence', 'FeedKind', 'FeedLine', 'ViewEvent', 'MembraneOp'] as const

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

const rel = (p: string) => path.relative(REPO, p).split(path.sep).join('/')

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
const BARE_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g

function specifiersOf(file: string): string[] {
  const source = fs.readFileSync(path.join(REPO, file), 'utf8')
  const out: string[] = []
  for (const m of source.matchAll(IMPORT_RE)) out.push(m[1]!)
  for (const m of source.matchAll(BARE_RE)) out.push(m[1]!)
  return out
}

/** Repo-relative target of a relative specifier, or null for bare/package ids. */
function targetOf(file: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  return path.relative(REPO, path.resolve(path.dirname(path.join(REPO, file)), spec)).split(path.sep).join('/')
}

function edges(files: string[]): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = []
  for (const f of files) {
    for (const s of specifiersOf(f)) {
      const t = targetOf(f, s)
      if (t) out.push({ from: f, to: t })
    }
  }
  return out
}

describe('[u2#c6] the driver module census', () => {
  it('(a) the six driver files this unit owns exist', () => {
    const missing = DRIVER_FILES.filter((f) => !fs.existsSync(path.join(REPO, f)))
    expect(missing).toEqual([])
  })

  it('(b) the seam types are NOT redeclared under driver/ — they live in src/shared', () => {
    const offenders: string[] = []
    for (const f of walk(DRIVER)) {
      const source = fs.readFileSync(path.join(REPO, f), 'utf8')
      for (const n of SEAM_NAMES) {
        if (new RegExp(`(?:type|interface)\\s+${n}\\b`).test(source)) offenders.push(`${f}:${n}`)
      }
    }
    expect(offenders, 'a seam type was re-declared inside driver/').toEqual([])
  })

  it('(c) driver/index.ts re-exports every seam type from src/shared/view-driver.ts', () => {
    const source = fs.readFileSync(path.join(REPO, 'src/client/driver/index.ts'), 'utf8')
    expect(source, 'index.ts does not re-export from the shared seam module').toMatch(
      /from\s*['"]\.\.\/\.\.\/shared\/view-driver(\.ts)?['"]/,
    )
    const missing = SEAM_NAMES.filter((n) => !new RegExp(`\\b${n}\\b`).test(source))
    expect(missing, 'driver/index.ts does not surface these seam types').toEqual([])
  })
})

describe('[u2#c6] nothing outside driver/ imports engine or composer', () => {
  it('(d) no src/client file outside driver/ reaches into engine or composer', () => {
    const outside = walk(path.join(SRC, 'client')).filter((f) => !f.startsWith('src/client/driver/'))
    const offenders = edges(outside).filter((e) => /^src\/(engine|composer)\b/.test(e.to))
    expect(offenders.map((o) => `${o.from} -> ${o.to}`)).toEqual([])
  })

  it('(e) this unit ships no live driver — even driver/ imports neither engine nor composer yet', () => {
    const offenders = edges(walk(DRIVER)).filter((e) => /^src\/(engine|composer)\b/.test(e.to))
    expect(offenders.map((o) => `${o.from} -> ${o.to}`)).toEqual([])
  })

  it('(f) nothing imports client — engine, composer and shared stay client-free', () => {
    const core = [...walk(path.join(SRC, 'engine')), ...walk(path.join(SRC, 'composer')), ...walk(path.join(SRC, 'shared'))]
    const offenders = edges(core).filter((e) => e.to.startsWith('src/client'))
    expect(offenders.map((o) => `${o.from} -> ${o.to}`)).toEqual([])
  })

  it('(g) src/shared/view-driver.ts is a leaf — it imports nothing at all', () => {
    expect(specifiersOf('src/shared/view-driver.ts')).toEqual([])
  })
})

describe('[u2#c6] the driver depends only on shared', () => {
  it('(h) every relative import out of driver/ lands in src/shared or inside driver/', () => {
    const offenders = edges(walk(DRIVER))
      .filter((e) => !e.to.startsWith('src/client/driver/') && !e.to.startsWith('src/shared/'))
      .map((o) => `${o.from} -> ${o.to}`)
    expect(offenders).toEqual([])
  })

  it('(i) driver/ pulls in no runtime package (dev-dependency-only toolchain, inv 9)', () => {
    const bare = walk(DRIVER).flatMap((f) => specifiersOf(f).filter((s) => !s.startsWith('.')))
    expect(bare.filter((s) => !s.startsWith('node:'))).toEqual([])
  })

  it('(j) the fixture driver touches no DOM global — it is view-agnostic (inv 12)', () => {
    for (const f of walk(DRIVER)) {
      const source = fs.readFileSync(path.join(REPO, f), 'utf8')
      for (const g of ['document', 'window\\.', 'requestAnimationFrame', 'performance\\.now']) {
        expect(source, `${f} reaches for the DOM (${g})`).not.toMatch(new RegExp(`\\b${g}`))
      }
    }
  })

  it('(k) fixtures ship dev-only — main.ts does not statically import them (§5.4)', () => {
    const main = path.join(REPO, 'src/client/main.ts')
    if (!fs.existsSync(main)) return
    const statics = specifiersOf('src/client/main.ts')
    expect(statics.filter((s) => s.includes('fixtures/'))).toEqual([])
  })
})
