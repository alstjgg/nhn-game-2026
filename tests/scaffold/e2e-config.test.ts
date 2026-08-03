// [u0#c5] — playwright.config.ts shape: chromium only, 1280×800, dev-server webServer (C5/C9).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CONFIG_PATH = path.join(REPO, 'playwright.config.ts')

const EXPECTED_BASE_URL = 'http://localhost:5174/nhn-game-2026/'

function source(): string {
  return fs.readFileSync(CONFIG_PATH, 'utf8')
}

type PwConfig = {
  testDir?: string
  use?: { baseURL?: string; viewport?: { width: number; height: number } | null }
  projects?: Array<{ name?: string; use?: { viewport?: { width: number; height: number } | null } }>
  webServer?: { command?: string; url?: string }
}

async function loadConfig(): Promise<PwConfig> {
  const mod = (await import(pathToFileURL(CONFIG_PATH).href)) as { default: PwConfig }
  return mod.default
}

describe('[u0#c5] playwright.config.ts source', () => {
  it('exists at the repo root', () => {
    expect(fs.existsSync(CONFIG_PATH)).toBe(true)
  })

  it('(e) imports the runner from "playwright/test", not "@playwright/test" (D3)', () => {
    expect(source()).toMatch(/from\s+['"]playwright\/test['"]/)
    expect(source()).not.toMatch(/from\s+['"]@playwright\/test['"]/)
  })

  it('(b) states the 1280×800 viewport explicitly in source (C9)', () => {
    expect(source()).toMatch(/viewport\s*:\s*\{[^}]*width\s*:\s*1280[^}]*height\s*:\s*800[^}]*\}/)
  })
})

describe('[u0#c5] playwright.config.ts resolved value', () => {
  it('(f) testDir is ./e2e', async () => {
    expect((await loadConfig()).testDir).toBe('./e2e')
  })

  it('(a) declares exactly one project, named chromium', async () => {
    const projects = (await loadConfig()).projects ?? []
    expect(projects).toHaveLength(1)
    expect(projects[0]?.name).toBe('chromium')
  })

  it('(b2) the resolved viewport is 1280×800', async () => {
    const cfg = await loadConfig()
    const viewport = cfg.projects?.[0]?.use?.viewport ?? cfg.use?.viewport
    expect(viewport).toEqual({ width: 1280, height: 800 })
  })

  it('(c) webServer runs the vite dev server on fixed port 5174 (C5)', async () => {
    const command = (await loadConfig()).webServer?.command ?? ''
    expect(command).toMatch(/npm run dev/)
    expect(command).toContain('--port 5174')
    expect(command).toContain('--strictPort')
    expect(command, 'e2e must not serve dist/ — §3.7 pack-copy plugin is absent').not.toMatch(/preview/)
  })

  it('(d) baseURL is the dev server plus the vite base', async () => {
    const cfg = await loadConfig()
    expect(cfg.use?.baseURL).toBe(EXPECTED_BASE_URL)

    const viteBase = fs.readFileSync(path.join(REPO, 'vite.config.ts'), 'utf8').match(/base:\s*'([^']+)'/)?.[1]
    expect(viteBase).toBeTruthy()
    expect(cfg.use?.baseURL).toContain(viteBase!)
  })

  it('(d2) webServer.url agrees with baseURL', async () => {
    const cfg = await loadConfig()
    expect(cfg.webServer?.url).toBeTruthy()
    expect(EXPECTED_BASE_URL.startsWith(cfg.webServer!.url!.replace(/\/$/, ''))).toBe(true)
  })
})

describe('[u0#c5] e2e suite is non-empty (A2 — `playwright test` must be a real pass)', () => {
  it('at least one spec lives under e2e/', () => {
    const dir = path.join(REPO, 'e2e')
    expect(fs.existsSync(dir)).toBe(true)
    const specs = fs.readdirSync(dir, { recursive: true } as { recursive: true }) as string[]
    expect(specs.filter((f) => typeof f === 'string' && f.endsWith('.spec.ts')).length).toBeGreaterThan(0)
  })
})
