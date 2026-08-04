// [u1#c6] CSS only — no .ts logic in this unit.
// [u1#c7] No @font-face and no font file here: u10 owns `styles/fonts.css` and
//         `public/assets/fonts/`. tokens.css keeps the font-family stacks only.
// [u1#c8] run-wide constraint C11 (no color/size/font literal outside tokens.css)
//         is enforced in token-lint.test.ts; this suite covers the u1-local pair.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { STYLES_DIR, read, rel, sheetsOnDisk, walk } from './css-utils.ts'
import { dirAtUnit, existedAtUnit, fileAtUnit } from '../acceptance/unit-range.ts'

describe('[u1#c6] src/client/styles ships CSS only', () => {
  it('(a) no .ts / .js file lives under src/client/styles', () => {
    const code = walk(STYLES_DIR)
      .filter((p) => /\.(ts|tsx|js|mjs|cjs)$/.test(p))
      .map(rel)
    expect(code).toEqual([])
  })

  it('(b) every non-.gitkeep file under src/client/styles is a .css file', () => {
    const foreign = walk(STYLES_DIR)
      .filter((p) => !p.endsWith('.css') && path.basename(p) !== '.gitkeep' && path.basename(p) !== 'RENAME-MAP.md')
      .map(rel)
    expect(foreign).toEqual([])
  })

  it('(c) the unit ships at least the nine sheets + index.css', () => {
    expect(sheetsOnDisk().length).toBeGreaterThanOrEqual(10)
  })
})

// C17 / [u11#c12] — RE-AIMED (08-04), never deleted. "Fonts belong to u10" is
// a statement about what U1 shipped, and it was measured on the live styles
// directory — which u10 has since filled with `fonts.css` and
// `public/assets/fonts/`, precisely as this file's header says it must. Measured
// at u1's own merge the claim stays permanently true; the live self-hosting is
// bound by u10's own suite (`tests/assets/fonts-css.test.ts`) and by
// `e2e/acceptance.spec.ts` #11, so nothing goes unchecked.
describe('[u1#c7] fonts belong to u10 (re-aimed to u1\'s own range — C17)', () => {
  /** Every stylesheet as u1's merge left it. */
  function u1Sheets(): { file: string; css: string }[] {
    const files = dirAtUnit('u1', 'src/client/styles').filter((f) => f.endsWith('.css'))
    expect(files.length, 'u1 landed no stylesheet — the range is wrong').toBeGreaterThan(0)
    return files.map((file) => ({ file, css: fileAtUnit('u1', `src/client/styles/${file}`) }))
  }

  it('(a) no @font-face in any u1 stylesheet', () => {
    const offenders = u1Sheets().filter(({ css }) => /@font-face/i.test(css)).map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it('(b) no font-file reference in any u1 stylesheet', () => {
    const offenders = u1Sheets()
      .filter(({ css }) => /\.(woff2?|ttf|otf|eot)\b/i.test(css))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it('(c) u1 does not create public/assets/fonts/', () => {
    expect(existedAtUnit('u1', 'public/assets/fonts')).toBe(false)
  })

  it('(d) tokens.css still carries the font-family stacks (the part u1 does own)', () => {
    const tokens = read(path.join(STYLES_DIR, 'tokens.css')).toLowerCase()
    expect(tokens).toContain('ibm plex mono')
    expect(tokens).toContain('nanum myeongjo')
  })
})
