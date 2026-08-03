// [u0#c4] — dev-dependencies-only toolchain (PRD §2, inv 9, C2) + script wiring.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

type Pkg = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

const pkg = (): Pkg => JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')) as Pkg

// Allowlist per PRD §2 + A1 (@types/node needed by the structural tests).
const DEV_ALLOWLIST = new Set(['vitest', 'playwright', 'typescript', 'vite', '@types/node'])

// Scripts that existed before this unit and must survive byte-identical.
const FROZEN_SCRIPTS: Record<string, string> = {
  dev: 'vite',
  check: 'tsc -p tsconfig.core.json && tsc && npm run typecheck:test && npm run datapack:check && npm run test:shared',
  build: 'npm run check && vite build',
  preview: 'vite preview',
  'datapack:types': 'node authoring/generate-datapack-types.mjs',
  'datapack:check': 'node authoring/generate-datapack-types.mjs --check',
  'datapack:compile': 'node authoring/compile-datapack.mjs',
  'datapack:lint': 'node authoring/lint-datapack.mjs',
  probe: 'node tools/probe/run.mjs',
  'probe:selftest': 'node tools/probe/lib/selftest.mjs',
  'drive:beat': 'node tools/driver/drive-beat.mjs',
}

describe('[u0#c4] dependency shape', () => {
  it('(a) runtime dependencies stay empty (inv 9)', () => {
    const deps = pkg().dependencies
    expect(deps === undefined || Object.keys(deps).length === 0).toBe(true)
  })

  it('(b) vitest and playwright are devDependencies', () => {
    const dev = pkg().devDependencies ?? {}
    expect(Object.keys(dev)).toEqual(expect.arrayContaining(['vitest', 'playwright']))
  })

  it('(c) devDependencies stay inside the allowlist', () => {
    const extra = Object.keys(pkg().devDependencies ?? {}).filter((d) => !DEV_ALLOWLIST.has(d))
    expect(extra).toEqual([])
  })

  it('(d) @playwright/test is NOT added (D3 — runner comes from playwright/test)', () => {
    const p = pkg()
    expect(p.devDependencies ?? {}).not.toHaveProperty('@playwright/test')
    expect(p.dependencies ?? {}).not.toHaveProperty('@playwright/test')
  })

  it('(e) vitest and playwright resolve from the repo root', () => {
    const req = createRequire(path.join(REPO, 'package.json'))
    expect(() => req.resolve('vitest')).not.toThrow()
    expect(() => req.resolve('playwright')).not.toThrow()
  })
})

describe('[u0#c4] runners execute', () => {
  it('(f) `playwright test --list` exits 0 (config is loadable, at least one spec)', () => {
    expect(() =>
      execFileSync('npx', ['playwright', 'test', '--list'], {
        cwd: REPO,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
    ).not.toThrow()
  })
})

describe('[u0#c4] script wiring', () => {
  it('(g) the three test scripts are added', () => {
    const scripts = pkg().scripts ?? {}
    expect(scripts).toHaveProperty('test')
    expect(scripts).toHaveProperty('test:e2e')
    expect(scripts).toHaveProperty('typecheck:test')
    expect(scripts['test']).toMatch(/vitest/)
    expect(scripts['test:e2e']).toMatch(/playwright/)
    expect(scripts['typecheck:test']).toMatch(/tsconfig\.test\.json/)
  })

  it('(g2) pre-existing scripts are unchanged', () => {
    const scripts = pkg().scripts ?? {}
    for (const [name, command] of Object.entries(FROZEN_SCRIPTS)) {
      expect(scripts[name], `script "${name}" changed`).toBe(command)
    }
  })
})

describe('[u0#c4] vitest.config.ts scopes the suite to this repo', () => {
  // Without an explicit exclude, the default glob also picks up
  // demos/*/tests/scaffold.test.ts, so `vitest run tests/scaffold` gates on
  // unrelated demo suites (observed at RED time).
  const config = () => fs.readFileSync(path.join(REPO, 'vitest.config.ts'), 'utf8')

  it('exists at the repo root', () => {
    expect(fs.existsSync(path.join(REPO, 'vitest.config.ts'))).toBe(true)
  })

  it('runs in the node environment and includes only tests/**/*.test.ts', () => {
    expect(config()).toMatch(/environment\s*:\s*['"]node['"]/)
    expect(config()).toMatch(/include\s*:\s*\[\s*['"]tests\/\*\*\/\*\.test\.ts['"]/)
  })

  it('excludes demos/** and e2e/** from the vitest run', () => {
    expect(config()).toMatch(/demos\//)
    expect(config()).toMatch(/e2e\//)
  })
})

describe('[u0] test artifacts stay out of git', () => {
  it('.gitignore covers playwright/vitest output dirs', () => {
    const ignore = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8')
    for (const entry of ['test-results', 'playwright-report', 'blob-report']) {
      expect(ignore, `.gitignore missing ${entry}`).toMatch(new RegExp(`^\\s*/?${entry}/?\\s*$`, 'm'))
    }
  })
})
