// [u0#c3] + [u0#c9] — the isomorphic-core guard (C6) and the "no §3.7 copy plugin" guard.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// D7 — SHA-256 of tsconfig.core.json at spec time. This file is 윤석's standing
// condition: it must come out of this unit byte-identical.
const CORE_TSCONFIG_SHA256 = '72c0613b49951284d006b2480d449e62e80ae9369ea62c94c9c595837bffb062'

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

  it('(c) its include is exactly the three core areas', () => {
    const cfg = parseJsonc(read('tsconfig.core.json')) as { include?: unknown }
    expect(cfg.include).toEqual(['src/shared', 'src/engine', 'src/composer'])
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

describe('[u0#c9] vite.config.ts carries no §3.7 pack-copy plugin', () => {
  it('git reports vite.config.ts unmodified', () => {
    expect(git(['status', '--porcelain', '--', 'vite.config.ts']).trim()).toBe('')
  })

  it('source declares no plugins array and no closeBundle hook', () => {
    const source = read('vite.config.ts')
    expect(source).not.toMatch(/closeBundle/)
    expect(source).not.toMatch(/(^|\s)plugins\s*:/)
  })

  it('still pins the GitHub-Pages base', () => {
    expect(read('vite.config.ts')).toMatch(/base:\s*'\/nhn-game-2026\/'/)
  })
})
