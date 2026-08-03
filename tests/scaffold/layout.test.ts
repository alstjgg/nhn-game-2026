// [u0#c1] + [u0#c8] — src/client/ module layout, boot chain, import direction, file census.
// Structural only: reads the repo from disk, imports nothing from src/.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CLIENT = path.join(REPO, 'src/client')

const MODULE_DIRS = ['driver', 'shell', 'windows', 'components', 'styles', 'debug'] as const

/** Every file under `dir`, repo-relative, excluding nothing. */
function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(path.relative(REPO, full).split(path.sep).join('/'))
  }
  return out
}

/** Resolve a relative import specifier against an importing file. */
function resolveSpecifier(fromFile: string, spec: string): string | null {
  const base = path.resolve(path.dirname(fromFile), spec)
  const candidates = [base, `${base}.ts`, `${base}.js`, path.join(base, 'index.ts')]
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g

function specifiersOf(source: string): string[] {
  const out: string[] = []
  for (const m of source.matchAll(IMPORT_RE)) out.push(m[1]!)
  for (const m of source.matchAll(BARE_IMPORT_RE)) out.push(m[1]!)
  return out
}

describe('[u0#c1] src/client scaffold layout', () => {
  it('(a) has the six spec-client §2.1 module dirs under src/client/', () => {
    const missing = MODULE_DIRS.filter(
      (d) => !fs.existsSync(path.join(CLIENT, d)) || !fs.statSync(path.join(CLIENT, d)).isDirectory(),
    )
    expect(missing).toEqual([])
  })

  it('(a2) each module dir is tracked (contains at least a .gitkeep)', () => {
    const empty = MODULE_DIRS.filter((d) => {
      const p = path.join(CLIENT, d)
      return !fs.existsSync(p) || fs.readdirSync(p).length === 0
    })
    expect(empty).toEqual([])
  })

  it('(b) src/client/main.ts exists at the client boot root', () => {
    expect(fs.existsSync(path.join(CLIENT, 'main.ts'))).toBe(true)
  })

  it('(c) repo-root index.html declares a single type="module" entry script', () => {
    const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8')
    const scripts = [...html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/g)]
    expect(scripts).toHaveLength(1)
    expect(scripts[0]![1]).toMatch(/^\/src\//)
  })

  it('(c2) the index.html entry reaches src/client/main.ts transitively', () => {
    const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8')
    const src = html.match(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/)?.[1]
    expect(src, 'no module script in index.html').toBeTruthy()

    const entry = path.join(REPO, src!.replace(/^\//, ''))
    expect(fs.existsSync(entry), `entry ${src} does not exist on disk`).toBe(true)

    const target = path.join(CLIENT, 'main.ts')
    const seen = new Set<string>()
    const queue = [entry]
    let reached = false
    while (queue.length) {
      const file = queue.shift()!
      if (seen.has(file)) continue
      seen.add(file)
      if (path.resolve(file) === path.resolve(target)) {
        reached = true
        break
      }
      if (!/\.(ts|js|mts|mjs)$/.test(file)) continue
      const source = fs.readFileSync(file, 'utf8')
      for (const spec of specifiersOf(source)) {
        if (!spec.startsWith('.')) continue
        const resolved = resolveSpecifier(file, spec)
        if (resolved) queue.push(resolved)
      }
    }
    expect(reached, `src/client/main.ts is not reachable from ${src}`).toBe(true)
  })

  it('(d) nothing in src/shared, src/engine, src/composer imports client (import direction)', () => {
    const offenders: string[] = []
    for (const area of ['src/shared', 'src/engine', 'src/composer']) {
      for (const rel of walk(path.join(REPO, area))) {
        if (!rel.endsWith('.ts')) continue
        const source = fs.readFileSync(path.join(REPO, rel), 'utf8')
        if (specifiersOf(source).some((s) => /client/.test(s))) offenders.push(rel)
      }
    }
    expect(offenders).toEqual([])
  })

  it('(e) nothing under src/client outside driver/ imports engine or composer (inv 12 / C8)', () => {
    const offenders: string[] = []
    for (const rel of walk(CLIENT)) {
      if (!rel.endsWith('.ts')) continue
      if (rel.startsWith('src/client/driver/')) continue
      const source = fs.readFileSync(path.join(REPO, rel), 'utf8')
      if (specifiersOf(source).some((s) => /(engine|composer)/.test(s))) offenders.push(rel)
    }
    expect(offenders).toEqual([])
  })
})

describe('[u0#c8] empty-modules-only census', () => {
  // Pre-existing files this unit must not touch (u1 retires them).
  const PREEXISTING = new Set(['src/client/placeholder.ts', 'src/client/style.css'])

  it('every file under src/client/ is a .gitkeep, main.ts, or pre-existing', () => {
    const unexpected = walk(CLIENT).filter((rel) => {
      if (PREEXISTING.has(rel)) return false
      const base = path.basename(rel)
      return base !== '.gitkeep' && rel !== 'src/client/main.ts'
    })
    expect(unexpected).toEqual([])
  })

  it('no stylesheet or design token is introduced by this unit', () => {
    const styles = walk(CLIENT).filter((rel) => /\.(css|scss|less)$/.test(rel) && !PREEXISTING.has(rel))
    expect(styles).toEqual([])
  })

  it('src/client/main.ts is a thin boot root (<= 5 code statements)', () => {
    const file = path.join(CLIENT, 'main.ts')
    expect(fs.existsSync(file)).toBe(true)
    const source = fs.readFileSync(file, 'utf8')
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '')
    const code = stripped
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//'))
    expect(code.length).toBeLessThanOrEqual(5)
  })
})
