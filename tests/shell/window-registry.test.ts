// [u3#c6] The merge surface for m3.
//
// `windows/{agent-file,block-store,live-feed,reports,tally}.ts` exist as stubs
// exporting `mount(host, driver)`, and a SHELL-owned registry is the single
// place that knows about all five. That is what keeps u4/u4s/u5/u6/u7 off a
// shared barrel and off `index.html` — each later unit fills exactly one file.
//
// The suite runs under vitest `environment: 'node'`: a stub that reached for
// `document` at module scope, or dragged a CSS import in, would fail the
// dynamic imports below. That import-safety IS part of the contract.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
  INDEX_HTML,
  REGISTRY_TS,
  WINDOWS_DIR,
  WINDOW_KEYS,
  WINDOW_MODULES,
  clientSources,
  exists,
  importable,
  read,
  rel,
  specifiers,
  tsFiles,
} from './shell-utils.ts'

interface WindowDef {
  key: string
  id: string
  en: string
  ko: string
  mount: (host: unknown, driver: unknown) => void
}

const modulePath = (key: (typeof WINDOW_KEYS)[number]): string =>
  path.join(WINDOWS_DIR, WINDOW_MODULES[key])

async function loadRegistry(): Promise<{ WINDOW_REGISTRY: readonly WindowDef[] }> {
  return (await import(importable(REGISTRY_TS))) as { WINDOW_REGISTRY: readonly WindowDef[] }
}

describe('[u3#c6] the five window stubs exist', () => {
  it('(a) every windows/<module>.ts is on disk', () => {
    const missing = WINDOW_KEYS.filter((k) => !exists(modulePath(k))).map((k) => WINDOW_MODULES[k])
    expect(missing).toEqual([])
  })

  it('(b) windows/ holds exactly the five modules and no barrel', () => {
    const files = tsFiles(WINDOWS_DIR).map((f) => path.basename(f)).sort()
    expect(files).toEqual([...Object.values(WINDOW_MODULES)].sort())
    expect(exists(path.join(WINDOWS_DIR, 'index.ts'))).toBe(false)
  })

  it.each([...WINDOW_KEYS])('(c) windows/%s exports a mount(host, driver)', async (key) => {
    const mod = (await import(importable(modulePath(key)))) as { mount?: unknown }
    expect(typeof mod.mount).toBe('function')
    expect((mod.mount as (h: unknown, d: unknown) => void).length).toBe(2)
  })

  it('(d) importing a stub is side-effect free (no DOM, no CSS, in node)', async () => {
    expect(typeof globalThis.document).toBe('undefined')
    for (const key of WINDOW_KEYS) await import(importable(modulePath(key)))
    expect(typeof globalThis.document).toBe('undefined')
  })

  it('(e) a stub imports no CSS and never reaches engine/composer (C8, inv 12)', () => {
    const offenders: string[] = []
    for (const key of WINDOW_KEYS) {
      for (const spec of specifiers(read(modulePath(key)))) {
        if (spec.endsWith('.css')) offenders.push(`${WINDOW_MODULES[key]} → ${spec}`)
        if (/(^|\/)(engine|composer)(\/|$)/.test(spec)) offenders.push(`${WINDOW_MODULES[key]} → ${spec}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('(f) a stub imports no sibling window (one unit, one file)', () => {
    const offenders: string[] = []
    for (const key of WINDOW_KEYS) {
      for (const spec of specifiers(read(modulePath(key)))) {
        if (/^\.\/[\w-]+\.ts$/.test(spec)) offenders.push(`${WINDOW_MODULES[key]} → ${spec}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('[u3#c6] the registry is shell-owned', () => {
  it('(a) src/client/shell/window-registry.ts exists', () => {
    expect(exists(REGISTRY_TS)).toBe(true)
  })

  it('(b) it exports WINDOW_REGISTRY with one entry per window', async () => {
    const { WINDOW_REGISTRY } = await loadRegistry()
    expect(Array.isArray(WINDOW_REGISTRY)).toBe(true)
    expect(WINDOW_REGISTRY).toHaveLength(WINDOW_KEYS.length)
  })

  it('(c) the entries are keyed and ordered as the taskbar renders them', async () => {
    const { WINDOW_REGISTRY } = await loadRegistry()
    expect(WINDOW_REGISTRY.map((w) => w.key)).toEqual([...WINDOW_KEYS])
  })

  it('(d) every entry carries a unique w-<key> dom id and both labels', async () => {
    const { WINDOW_REGISTRY } = await loadRegistry()
    for (const def of WINDOW_REGISTRY) {
      expect(def.id).toBe(`w-${def.key}`)
      expect(typeof def.en).toBe('string')
      expect(def.en.trim().length).toBeGreaterThan(0)
      expect(typeof def.ko).toBe('string')
      expect(def.ko.trim().length).toBeGreaterThan(0)
    }
    expect(new Set(WINDOW_REGISTRY.map((w) => w.id)).size).toBe(WINDOW_KEYS.length)
  })

  it('(e) every entry mounts the module that owns that window', async () => {
    const { WINDOW_REGISTRY } = await loadRegistry()
    for (const def of WINDOW_REGISTRY) {
      const mod = (await import(
        importable(modulePath(def.key as (typeof WINDOW_KEYS)[number]))
      )) as { mount: unknown }
      expect(typeof def.mount).toBe('function')
      expect(def.mount).toBe(mod.mount)
    }
  })

  it('(f) the registry is the only module that imports windows/', () => {
    const offenders = clientSources()
      .filter((f) => path.resolve(f) !== path.resolve(REGISTRY_TS))
      .filter((f) => !f.startsWith(WINDOWS_DIR))
      .filter((f) => specifiers(read(f)).some((s) => /(^|\/)windows\//.test(s)))
      .map(rel)
    expect(offenders).toEqual([])
  })

  it('(g) no window module is named in index.html (u3 owns the only edit, [u3#c9])', () => {
    const html = read(INDEX_HTML)
    for (const file of Object.values(WINDOW_MODULES)) {
      expect(html).not.toContain(file)
    }
  })
})
