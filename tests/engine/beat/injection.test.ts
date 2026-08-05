// [e3] A10 — the state core is INJECTED (PRD decision 15 · design D-B).
// A source grep, not a behavioural test: nothing under src/engine/beat/ may
// value-import the state core, so the port is the only way in.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as beatIndex from '../../../src/engine/beat/index.ts'
import { REPO } from './fixtures/packs.ts'

const BEAT_DIR = path.join(REPO, 'src/engine/beat')

function sources(): Array<{ rel: string; text: string }> {
  if (!fs.existsSync(BEAT_DIR)) return []
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
      const p = path.join(dir, d.name)
      return d.isDirectory() ? walk(p) : [p]
    })
  return walk(BEAT_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => ({ rel: path.relative(BEAT_DIR, f), text: fs.readFileSync(f, 'utf8') }))
}

/** Every `import … from '…'` / `export … from '…'` statement, with its specifier. */
function importStatements(text: string): Array<{ statement: string; specifier: string; typeOnly: boolean }> {
  const re = /(?:^|\n)\s*(import|export)\b([\s\S]*?)from\s*['"]([^'"]+)['"]/g
  const out: Array<{ statement: string; specifier: string; typeOnly: boolean }> = []
  for (const m of text.matchAll(re)) {
    const head = m[2] ?? ''
    out.push({
      statement: `${m[1]}${head}from '${m[3]}'`,
      specifier: m[3]!,
      typeOnly: /^\s*type\b/.test(head),
    })
  }
  return out
}

describe('[e3#A10] src/engine/beat never value-imports the state core', () => {
  it('has source files to check (the grep is not vacuous)', () => {
    expect(sources().length).toBeGreaterThan(0)
  })

  it('imports nothing from src/engine/state except as `import type`', () => {
    const offenders: string[] = []
    for (const f of sources()) {
      for (const imp of importStatements(f.text)) {
        if (!/engine\/state|(^|\/)state(\.ts)?$/.test(imp.specifier)) continue
        if (!imp.typeOnly) offenders.push(`${f.rel}: ${imp.statement}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('uses no runtime require/dynamic-import of the state core either', () => {
    for (const f of sources()) {
      expect(f.text, f.rel).not.toMatch(/import\s*\(\s*['"][^'"]*engine\/state/)
      expect(f.text, f.rel).not.toMatch(/require\s*\(\s*['"][^'"]*engine\/state/)
    }
  })

  it('declares the injected ports in ports.ts, and ports.ts emits no runtime value', () => {
    const ports = sources().find((f) => f.rel === 'ports.ts')
    expect(ports, 'src/engine/beat/ports.ts is missing').toBeDefined()
    expect(ports!.text).toMatch(/StateCorePort/)
    expect(ports!.text).toMatch(/RoundAssemblerPort/)
    expect(ports!.text, 'ports.ts must be types only').not.toMatch(
      /^\s*export\s+(?:const|let|var|function|class|enum)\b/m,
    )
  })

  it('value-imports only the beat folder itself and node-free type sources', () => {
    for (const f of sources()) {
      for (const imp of importStatements(f.text)) {
        if (imp.typeOnly) continue
        expect(
          imp.specifier.startsWith('.'),
          `${f.rel} value-imports a package: ${imp.statement}`,
        ).toBe(true)
      }
    }
  })

  it('exposes the driver, the schedule builder and the cap through index.ts', () => {
    const surface = beatIndex as Record<string, unknown>
    expect(typeof surface.createBeatDriver).toBe('function')
    expect(typeof surface.buildSchedule).toBe('function')
    expect(typeof surface.parseClock).toBe('function')
    expect(surface.TIMELINE_CAP_LINES).toBe(6)
  })

  it('the driver accepts a fake state core and a fake assembler — no concrete engine needed', async () => {
    const { rig } = await import('./harness.ts')
    const { roundPack } = await import('./fixtures/packs.ts')
    const r = rig(roundPack())
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    r.driver.applyBeatEffects()
    r.driver.advance()
    r.driver.applyBeatEffects()
    expect(r.driver.roundView().EXPERIENCED.length).toBeGreaterThan(0)
    expect(r.assembler.log.map((e) => e.op)).toContain('experienced')
    expect(r.assembler.log[0]!.args[0]).toBe(0)
  })
})
