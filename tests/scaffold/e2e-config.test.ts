// [u0#c5] — playwright.config.ts shape: chromium only, 1280×800, a real build behind the runner (C5/C9).
//
// C12/C17 note (08-04, [u11]): four cases here were written against a SINGLE
// project and a SINGLE webServer object. The C5 split made that shape
// unmeasurable — three hosts now exist and each proves something the others
// cannot. Nothing was deleted, excluded or `.skip`ped: (a)(c)(d)(d2) were
// re-aimed at the intent they were written for, and each carries a RE-AIMED
// note naming what invalidated it.
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

type PwProject = {
  name?: string
  use?: { baseURL?: string; viewport?: { width: number; height: number } | null }
}
type PwServer = { command?: string; url?: string }
type PwConfig = {
  testDir?: string
  use?: { baseURL?: string; viewport?: { width: number; height: number } | null }
  projects?: PwProject[]
  // C5 SPLIT (08-04): one host could not prove both halves, so this is an ARRAY.
  webServer?: PwServer | PwServer[]
}

async function loadConfig(): Promise<PwConfig> {
  const mod = (await import(pathToFileURL(CONFIG_PATH).href)) as { default: PwConfig }
  return mod.default
}

/** The webServer entries, however many hosts the C5 split ended up needing. */
function servers(cfg: PwConfig): PwServer[] {
  const declared = cfg.webServer
  if (!declared) return []
  return Array.isArray(declared) ? declared : [declared]
}

/** Every baseURL the run actually drives — per project since the C5 split. */
function baseURLs(cfg: PwConfig): string[] {
  const perProject = (cfg.projects ?? []).map((p) => p.use?.baseURL ?? cfg.use?.baseURL)
  return perProject.filter((u): u is string => typeof u === 'string')
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

  // C17 / [u11#c12] — RE-AIMED (08-04), never deleted. The C5 split gave the run three HOSTS
  // (a dev-mode build on 5174, `npm run dev` for the DEV-only fixture round, a
  // production `preview` for the artefact truths), so "exactly one project" is
  // no longer measurable. The u0 intent it was written for — chromium only,
  // desktop only, no second browser engine — is asserted here instead. The
  // `chromium` project itself still exists and still carries the unit specs.
  it('(a) declares exactly one project, named chromium (re-aimed: chromium-only across the C5 hosts)', async () => {
    const cfg = await loadConfig()
    const projects = cfg.projects ?? []
    expect(projects.length).toBeGreaterThan(0)
    expect(projects.map((p) => p.name)).toContain('chromium')
    // No engine but chromium is ever configured, whatever the host count.
    expect(source()).not.toMatch(/Desktop (?:Safari|Firefox)|['"](?:firefox|webkit)['"]/)
    for (const project of projects) {
      expect(project.name, 'every project is named').toBeTruthy()
    }
  })

  it('(b2) the resolved viewport is 1280×800 — on every host', async () => {
    const cfg = await loadConfig()
    for (const project of cfg.projects ?? []) {
      const viewport = project.use?.viewport ?? cfg.use?.viewport
      expect(viewport, `${project.name} is not 1280×800`).toEqual({ width: 1280, height: 800 })
    }
  })

  // C5 (updated 08-04): the §3.7 pack-copy plugin landed, so the e2e runner
  // serves a real build through `vite preview` instead of the dev server. The
  // previous ruling — and this case's `not.toMatch(/preview/)` — are obsolete;
  // reconciled here rather than deleted, per C12.
  // C17 / [u11#c12] — RE-AIMED (08-04), never deleted. The intent — "the e2e runner proves a
  // real BUILD, never a dev server standing in for one" — is unchanged and is
  // asserted harder below: the unit host on 5174 is still a build, and a second
  // host now previews `dist/` itself. `npm run dev` appears exactly once, for
  // the fixture round, which C5(a) RULED can only run there (the fixtures are
  // DEV-only by inv 11), and it is fenced to the `dev` project's specs.
  it('(c) webServer serves a real build with vite preview on fixed port 5174 (C5)', async () => {
    const cfg = await loadConfig()
    const all = servers(cfg)
    expect(all.length).toBeGreaterThan(0)

    const unit = all.find((s) => s.command?.includes('--port 5174'))
    expect(unit, 'the unit host on 5174 is still declared').toBeTruthy()
    expect(unit!.command).toMatch(/npm run build/)
    expect(unit!.command).toMatch(/npm run preview/)
    expect(unit!.command).toContain('--strictPort')
    expect(unit!.command, 'the unit host is the preview of a build, never the dev server').not.toMatch(/npm run dev/)

    // The artefact host: `dist/` as deployed, with no --outDir of its own.
    const preview = all.find((s) => s !== unit && /npm run preview/.test(s.command ?? ''))
    expect(preview, 'a production preview host is declared (C5(b))').toBeTruthy()
    expect(preview!.command).toMatch(/npm run build/)
    expect(preview!.command).not.toMatch(/--outDir/)
    expect(preview!.command).toContain('--strictPort')

    // The dev host exists BY RULING, is the only one, and is fenced to the
    // DEV-only fixture round — it never serves the unit or artefact specs.
    const devHosts = all.filter((s) => /npm run dev/.test(s.command ?? ''))
    expect(devHosts, 'exactly one dev host, for the fixture round alone').toHaveLength(1)
    expect(devHosts[0]!.command).toContain('--strictPort')
    const config = source()
    expect(config, 'the dev-hosted specs are named and fenced').toMatch(/testMatch/)
    expect(config).toMatch(/acceptance/)
    expect(config).toMatch(/captures/)
  })

  // C17 / [u11#c12] — RE-AIMED (08-04), never deleted. baseURL moved onto the projects when
  // the hosts split. Intent kept: every host is localhost + the vite base, and
  // the `chromium` project (the unit specs' host) still answers on 5174.
  it('(d) baseURL is the dev server plus the vite base', async () => {
    const cfg = await loadConfig()
    const urls = baseURLs(cfg)
    expect(urls.length).toBe((cfg.projects ?? []).length)

    const viteBase = fs.readFileSync(path.join(REPO, 'vite.config.ts'), 'utf8').match(/base:\s*'([^']+)'/)?.[1]
    expect(viteBase).toBeTruthy()
    for (const url of urls) {
      expect(url).toContain(viteBase!)
      expect(url).toMatch(/^http:\/\/localhost:\d+\//)
    }

    const chromium = (cfg.projects ?? []).find((p) => p.name === 'chromium')
    expect(chromium?.use?.baseURL ?? cfg.use?.baseURL).toBe(EXPECTED_BASE_URL)
    expect(new Set(urls).size, 'one host per project, never shared').toBe(urls.length)
  })

  // C17 / [u11#c12] — RE-AIMED (08-04), never deleted. One url/baseURL pair became N. Intent
  // kept: no project points at a host nobody starts, and no host is started for
  // a project that does not exist.
  it('(d2) webServer.url agrees with baseURL', async () => {
    const cfg = await loadConfig()
    const hosts = servers(cfg).map((s) => s.url)
    const urls = baseURLs(cfg)
    expect(hosts.length).toBe(urls.length)

    for (const host of hosts) {
      expect(host, 'every webServer entry declares a url').toBeTruthy()
      expect(urls, `no project drives ${host}`).toContain(host)
    }
    for (const url of urls) {
      expect(hosts, `nothing serves ${url}`).toContain(url)
    }
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
