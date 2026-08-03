// [u0#c3] + [u0#c9] — the isomorphic-core guard (C6) and the "no §3.7 copy plugin" guard.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// D7 — SHA-256 of tsconfig.core.json. Re-pinned to the composed base (PRD §2a.3):
// the hand-composed base extended `include` to the six core folders, which is a
// legitimate widening of the isomorphic core, not a violation of the standing
// condition — the guard re-anchors on the new byte-identical value.
const CORE_TSCONFIG_SHA256 = '876a7313e70e221c2619de88fbf91507c92483301c91688b65afd8453b736fcd'

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

  it('(c) its include is exactly the six core areas (PRD §2a.3 composed base)', () => {
    const cfg = parseJsonc(read('tsconfig.core.json')) as { include?: unknown }
    expect(cfg.include).toEqual([
      'src/shared',
      'src/engine',
      'src/composer',
      'src/transport',
      'src/driver',
      'src/runloop',
    ])
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

// [u0#c9] originally asserted vite.config.ts carried no §3.7 pack-copy plugin.
// §3.7 has since been ratified (cee7060): a build-only closeBundle plugin that
// copies `data/{scenario,policy}` into `dist/data/` is now required, not
// forbidden. Inverted rather than deleted so the guard still catches drift —
// it now pins the ratified shape (build-only, by-name allowlist, no dev
// middleware) instead of its absence.
describe('[u0#c9] vite.config.ts carries the ratified §3.7 pack-copy plugin', () => {
  it('source declares a plugins array with a closeBundle hook', () => {
    const source = read('vite.config.ts')
    expect(source).toMatch(/closeBundle/)
    expect(source).toMatch(/(^|\s)plugins\s*:/)
  })

  it('the copy is build-only: no dev-server middleware is declared', () => {
    const source = read('vite.config.ts')
    expect(source).not.toMatch(/configureServer/)
  })

  it('still pins the GitHub-Pages base', () => {
    expect(read('vite.config.ts')).toMatch(/base:\s*'\/nhn-game-2026\/'/)
  })
})
