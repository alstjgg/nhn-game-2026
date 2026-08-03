// [u1#c6] CSS only — no .ts logic in this unit.
// [u1#c7] No @font-face and no font file here: u10 owns `styles/fonts.css` and
//         `public/assets/fonts/`. tokens.css keeps the font-family stacks only.
// [u1#c8] run-wide constraint C11 (no color/size/font literal outside tokens.css)
//         is enforced in token-lint.test.ts; this suite covers the u1-local pair.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { REPO, STYLES_DIR, exists, read, rel, sheetsOnDisk, walk } from './css-utils.ts'

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

describe('[u1#c7] fonts belong to u10', () => {
  it('(a) no @font-face in any u1 stylesheet', () => {
    const offenders = sheetsOnDisk().filter((f) => /@font-face/i.test(read(path.join(STYLES_DIR, f))))
    expect(offenders).toEqual([])
  })

  it('(b) no font-file reference in any u1 stylesheet', () => {
    const offenders = sheetsOnDisk().filter((f) =>
      /\.(woff2?|ttf|otf|eot)\b/i.test(read(path.join(STYLES_DIR, f))),
    )
    expect(offenders).toEqual([])
  })

  it('(c) u1 does not create public/assets/fonts/', () => {
    expect(exists(path.join(REPO, 'public/assets/fonts'))).toBe(false)
  })

  it('(d) tokens.css still carries the font-family stacks (the part u1 does own)', () => {
    const tokens = read(path.join(STYLES_DIR, 'tokens.css')).toLowerCase()
    expect(tokens).toContain('ibm plex mono')
    expect(tokens).toContain('nanum myeongjo')
  })
})
