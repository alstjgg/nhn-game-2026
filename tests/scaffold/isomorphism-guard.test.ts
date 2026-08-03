// [u0#c3] + [u0#c9] — the isomorphic-core guard (C6) and the "no §3.7 copy plugin" guard.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// D7 — 윤석's standing condition on tsconfig.core.json (C6).
//
// The condition is "*this run* does not touch the file", NOT "the file never
// changes". 윤석 owns it and will change it again upstream — PR #114 already did.
// So the guard measures a diff against the commit this run branched from, rather
// than pinning a hash: any upstream edit moves the baseline with it, and only a
// change introduced *here* can fail. See the header of this file's rewrite commit.
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

/**
 * The commit this run branched from. Everything at or below it is upstream work
 * (윤석's), so it is the baseline the run must not diverge from. Once main is
 * merged into the integration branch this resolves to main's head, which is
 * exactly right — the run still owns no change to the file.
 */
function runMergeBase(): string {
  const errors: string[] = []
  for (const ref of ['origin/main', 'main']) {
    try {
      return git(['merge-base', 'HEAD', ref]).trim()
    } catch (err) {
      errors.push(`${ref}: ${(err as Error).message}`)
    }
  }
  throw new Error(
    `cannot resolve a merge-base against main — is this a shallow clone?\n${errors.join('\n')}`,
  )
}

describe('[u0#c3] tsconfig.core.json is untouched (C6 standing condition)', () => {
  it('(a) this run introduces no diff to tsconfig.core.json, measured against the run merge-base', () => {
    const base = runMergeBase()
    const upstream = git(['show', `${base}:tsconfig.core.json`])
    expect(read('tsconfig.core.json')).toBe(upstream)
  })

  it('(b) git reports no modification to tsconfig.core.json', () => {
    expect(git(['status', '--porcelain', '--', 'tsconfig.core.json']).trim()).toBe('')
  })

  // (a) already proves byte-identity with upstream, so this asserts the part the
  // CLIENT run actually depends on and that no upstream edit may take away:
  // core still covers the shared seam, and it never reaches into src/client
  // (which is what keeps the client out of the isomorphic core — inv 12).
  it('(c) core covers the shared areas and never includes src/client', () => {
    const cfg = parseJsonc(read('tsconfig.core.json')) as { include?: string[] }
    expect(cfg.include).toEqual(expect.arrayContaining(['src/shared', 'src/engine', 'src/composer']))
    expect(cfg.include?.some((i) => i.startsWith('src/client'))).toBe(false)
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

// u0's charter was "do not build the §3.7 pack-copy plugin — it is 윤석's".
// It landed upstream in PR #114, so "the file contains no copy plugin" is now
// false by design. What still binds is that *this run* adds no copy plugin of
// its own — so the assert reads the diff against the merge-base, not the file.
// Diff-based rather than byte-identity because u9d is licensed to add the debug
// flag define to this same file.
describe('[u0#c9] this run adds no §3.7 pack-copy plugin of its own', () => {
  const addedLines = () =>
    git(['diff', `${runMergeBase()}...HEAD`, '--', 'vite.config.ts'])
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
      .join('\n')

  it('introduces no closeBundle hook, plugins array, or pack copy', () => {
    const added = addedLines()
    expect(added).not.toMatch(/closeBundle/)
    expect(added).not.toMatch(/(^|\s)plugins\s*:/)
    expect(added).not.toMatch(/cpSync|copyFile|data\/scenario/)
  })

  it('still pins the GitHub-Pages base', () => {
    expect(read('vite.config.ts')).toMatch(/base:\s*'\/nhn-game-2026\/'/)
  })
})
