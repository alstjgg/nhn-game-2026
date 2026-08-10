// [u1#c4] `styles/index.css` is the single aggregation point.
//
// @import order: tokens → base → shell → paper → per-window. u10 appends
// exactly one `fonts.css` import later and nothing else, so index.css must stay
// an import manifest: no declarations, no second aggregation point, no sheet
// imported twice and none left orphaned.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
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
import { existedAtUnit, fileAtUnit } from '../acceptance/unit-range.ts'

/** The imported specifiers of `css`, in source order. */
function imports(css: string): string[] {
  return [...stripComments(css).matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g)].map((m) => m[1]!)
}

const indexCss = read(INDEX_CSS)
const imported = imports(indexCss)
const importedFiles = imported.map((s) => s.replace(/^\.\//, ''))

// C17 / [u11#c12] — the u1-SCOPED half of this file is measured at u1's own
// merge (08-04). u10 landed `fonts.css` and its one `@import`, exactly as this
// file's header says it would, so the live manifest is now ten sheets and the
// two census asserts below plus the "slot left for u10" pair can only ever be
// true of the tree u1 handed over. Re-aimed, never deleted or skipped: the
// live manifest is still bound by (a)/(c) above and by the whole "single
// aggregation point" block, and u10's own suite binds the fonts.css import.
const u1ImportedFiles = imports(fileAtUnit('u1', 'src/client/styles/index.css')).map((s) => s.replace(/^\.\//, ''))

/**
 * U3 (playtest g3-1) retired `win-tally.css`; T1 (playtest g5-1) retired
 * `win-block-store.css` — `WINDOW_SHEETS` (css-utils.ts) now reflects the
 * CURRENT three window sheets. The block below pins u1's OWN historical
 * merge — nine sheets on disk, five of them window skins — which is frozen
 * by definition (it reads `fileAtUnit('u1', …)`) and must not move just
 * because later units retired two of the five. Hard-coded rather than
 * derived: a frozen set must not track a live constant.
 */
const U1_WINDOW_SHEETS = [
  'win-agent-file.css',
  'win-block-store.css',
  'win-live-feed.css',
  'win-reports.css',
  'win-tally.css',
]
const U1_ALL_SHEETS = [...CORE_SHEETS, ...U1_WINDOW_SHEETS]

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
    const tail = u1ImportedFiles.slice(4)
    const strays = tail.filter((f) => !U1_WINDOW_SHEETS.includes(f))
    expect(strays).toEqual([])
  })

  it('(c) all four per-window skins are imported', () => {
    const missing = WINDOW_SHEETS.filter((f) => !importedFiles.includes(f))
    expect(missing).toEqual([])
  })

  it('(d) exactly the nine u1 sheets are imported, none twice', () => {
    expect(u1ImportedFiles).toHaveLength(U1_ALL_SHEETS.length)
    expect(new Set(u1ImportedFiles).size).toBe(u1ImportedFiles.length)
    // the live manifest never imports one sheet twice either
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

describe('[u1#c4] the fonts.css slot is left for u10 (re-aimed to u1\'s own range — C17)', () => {
  it('(a) u1 does not import fonts.css', () => {
    expect(u1ImportedFiles).not.toContain('fonts.css')
  })

  it('(b) u1 does not create styles/fonts.css', () => {
    expect(existedAtUnit('u1', 'src/client/styles/fonts.css')).toBe(false)
  })
})
