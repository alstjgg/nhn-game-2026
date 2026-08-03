// [u9d#c6] HARD CONSTRAINT — this unit is the ONLY one permitted to edit
// `vite.config.ts`, and only to add the debug-pane build flag. `base` must stay
// '/nhn-game-2026/' and the §3.7 pack-copy plugin must NOT appear here.
//
// Also pins the shape of the flag itself ([u9d#c2] depends on it): a vite
// `define` that constant-folds to `false` in the production build, so the
// bundler can drop the guarded branch — a runtime `if` over an env lookup would
// leave the pane's code in the player bundle.
import { describe, it, expect } from 'vitest'
import { DEBUG_DIR, FLAG, VITE_CONFIG, exists, read, stripComments, tsFiles, walk, rel } from './debug-utils.ts'

const config = (): string => read(VITE_CONFIG)
const code = (): string => stripComments(config())

describe('[u9d#c6] vite.config.ts — what must not change', () => {
  it('(a) the config is readable and still the project-site config', () => {
    expect(config().length, 'vite.config.ts is missing').toBeGreaterThan(0)
    expect(code()).toMatch(/defineConfig/)
  })

  it('(b) base stays exactly /nhn-game-2026/', () => {
    expect(code()).toMatch(/base\s*:\s*'\/nhn-game-2026\/'|base\s*:\s*"\/nhn-game-2026\/"/)
  })

  it('(c) no pack-copy PLUGIN PACKAGE is smuggled in with the flag', () => {
    // Deliberately not a blanket `no plugins:` ban: the §3.7 copy plugin may
    // arrive from upstream and this unit must leave it exactly as it is. What
    // this unit may never do is pull a plugin package in (inv 9, and c6's
    // "must not add the pack-copy plugin").
    expect(code()).not.toMatch(/viteStaticCopy|rollup-plugin-copy|vite-plugin-static-copy/)
  })

  it('(e) no resolve aliases are introduced (c6)', () => {
    const src = code()
    expect(src, 'c6 forbids adding aliases').not.toMatch(/\balias\s*:/)
    expect(src).not.toMatch(/\bresolve\s*:\s*\{[\s\S]*\balias\b/)
  })

  it('(d) the config still pulls in nothing but vite itself (inv 9)', () => {
    const bare: string[] = []
    for (const m of code().matchAll(/from\s*['"]([^'"]+)['"]/g)) if (!m[1]!.startsWith('.')) bare.push(m[1]!)
    expect(bare.filter((s) => s !== 'vite' && !s.startsWith('node:'))).toEqual([])
  })
})

describe('[u9d#c6] vite.config.ts — the debug flag define', () => {
  it('(a) the config declares a `define` carrying the flag', () => {
    const src = code()
    expect(src, 'no `define` block').toMatch(/\bdefine\s*:/)
    expect(src, `the ${FLAG} define is missing`).toContain(FLAG)
  })

  it('(b) the flag is not hard-wired on — it is derived from mode/command/env', () => {
    const src = code()
    expect(src).not.toMatch(new RegExp(`${FLAG}['"]?\\s*:\\s*(JSON\\.stringify\\()?\\s*true`))
    expect(src, 'the flag must key off the build mode, not a constant').toMatch(
      /mode\s*!==\s*['"]production['"]|command\s*===\s*['"]serve['"]|process\.env\.[A-Z_]*DEBUG[A-Z_]*/,
    )
  })

  it('(c) the defined value is a literal the bundler can fold (JSON.stringify or a boolean expression)', () => {
    const src = code()
    const assignment = new RegExp(`${FLAG}['"]?\\s*:\\s*([^,\\n}]+)`).exec(src)
    expect(assignment, `no value assigned to ${FLAG}`).not.toBeNull()
    const value = assignment![1]!
    expect(value, 'the define must not be a function/lazy lookup').not.toMatch(/=>|\bfunction\b/)
    expect(value).toMatch(/JSON\.stringify|true|false|!==|===/)
  })
})

describe('[u9d#c6] the flag is declared for the type-checker', () => {
  it('(a) some file this unit owns declares the ambient flag const', () => {
    const owned = [...tsFiles(DEBUG_DIR), ...walk(DEBUG_DIR).filter((f) => f.endsWith('.d.ts'))]
    const declaring = owned.filter((f) => new RegExp(`declare\\s+(?:const|global|var)[\\s\\S]{0,200}${FLAG}`).test(read(f)))
    expect(
      declaring.map(rel),
      `nothing under src/client/debug/ declares ${FLAG} — tsc cannot see the guard`,
    ).not.toEqual([])
  })

  it('(b) the declaration types it as a boolean, not a string', () => {
    const owned = tsFiles(DEBUG_DIR).concat(walk(DEBUG_DIR).filter((f) => f.endsWith('.d.ts')))
    const text = owned.map(read).join('\n')
    expect(text).toMatch(new RegExp(`${FLAG}\\s*:\\s*boolean`))
  })

  it('(c) src/client/debug/ exists at all (non-vacuity)', () => {
    expect(exists(DEBUG_DIR)).toBe(true)
    expect(tsFiles(DEBUG_DIR).length, 'the debug pane owns no source yet').toBeGreaterThan(0)
  })
})
