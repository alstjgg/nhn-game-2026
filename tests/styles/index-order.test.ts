// [u1#c4] `styles/index.css` is the single aggregation point.
//
// @import order: tokens → base → shell → paper → per-window. u10 appends
// exactly one `fonts.css` import later and nothing else, so index.css must stay
// an import manifest: no declarations, no second aggregation point, no sheet
// imported twice and none left orphaned.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
  ALL_SHEETS,
  CORE_SHEETS,
  INDEX_CSS,
  STYLES_DIR,
  WINDOW_SHEETS,
  exists,
  read,
  scannable,
  sheetsOnDisk,
  stripComments,
} from './css-utils.ts'

/** The imported specifiers of `css`, in source order. */
function imports(css: string): string[] {
  return [...stripComments(css).matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g)].map((m) => m[1]!)
}

const indexCss = read(INDEX_CSS)
const imported = imports(indexCss)
const importedFiles = imported.map((s) => s.replace(/^\.\//, ''))

describe('[u1#c4] index.css is an import manifest', () => {
  it('(a) src/client/styles/index.css exists', () => {
    expect(exists(INDEX_CSS)).toBe(true)
  })

  it('(b) it contains @import rules and nothing else (no selectors, no declarations)', () => {
    const leftovers = scannable(indexCss)
      .replace(/@import[^;]+;/g, '')
      .replace(/@charset[^;]+;/g, '')
      .trim()
    expect(leftovers).toBe('')
  })

  it('(c) every import is a relative ./*.css specifier', () => {
    const bad = imported.filter((s) => !/^\.\/[\w-]+\.css$/.test(s))
    expect(bad).toEqual([])
  })
})

describe('[u1#c4] the aggregation order is tokens → base → shell → paper → per-window', () => {
  it('(a) the first four imports are tokens, base, shell, paper in that order', () => {
    expect(importedFiles.slice(0, 4)).toEqual([...CORE_SHEETS])
  })

  it('(b) every remaining import is a per-window skin', () => {
    const tail = importedFiles.slice(4)
    const strays = tail.filter((f) => !(WINDOW_SHEETS as readonly string[]).includes(f))
    expect(strays).toEqual([])
  })

  it('(c) all five per-window skins are imported', () => {
    const missing = WINDOW_SHEETS.filter((f) => !importedFiles.includes(f))
    expect(missing).toEqual([])
  })

  it('(d) exactly the nine u1 sheets are imported, none twice', () => {
    expect(importedFiles).toHaveLength(ALL_SHEETS.length)
    expect(new Set(importedFiles).size).toBe(importedFiles.length)
  })
})

describe('[u1#c4] index.css is the *single* aggregation point', () => {
  it('(a) no other stylesheet contains an @import', () => {
    const offenders = sheetsOnDisk()
      .filter((f) => f !== 'index.css')
      .filter((f) => imports(read(path.join(STYLES_DIR, f))).length > 0)
    expect(offenders).toEqual([])
  })

  it('(b) every .css on disk is imported (no orphan sheet)', () => {
    const orphans = sheetsOnDisk()
      .filter((f) => f !== 'index.css')
      .filter((f) => !importedFiles.includes(f))
    expect(orphans).toEqual([])
  })

  it('(c) every import resolves to a file that exists', () => {
    const dangling = importedFiles.filter((f) => !exists(path.join(STYLES_DIR, f)))
    expect(dangling).toEqual([])
  })
})

describe('[u1#c4] the fonts.css slot is left for u10', () => {
  it('(a) u1 does not import fonts.css', () => {
    expect(importedFiles).not.toContain('fonts.css')
  })

  it('(b) u1 does not create styles/fonts.css', () => {
    expect(exists(path.join(STYLES_DIR, 'fonts.css'))).toBe(false)
  })
})
