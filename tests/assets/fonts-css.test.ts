// [u10#c1] the three families are self-hosted under `public/assets/fonts/`
//          and declared by `src/client/styles/fonts.css` (spec-client §3 inv 10).
// [u10#c4] every face is `font-display: swap` (the ~1 s load budget).
// [u10#c8] HARD CONSTRAINT — u1's stylesheets stay byte-identical; index.css
//          gains exactly one `./fonts.css` import and nothing else.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import crypto from 'node:crypto'
import {
  ALL_FAMILIES,
  EXPECTED_FACES,
  FONTS_CSS,
  FONTS_DIR,
  INDEX_CSS,
  REPO,
  STYLES_DIR,
  THIRD_PARTY_MARKERS,
  TOKENS_CSS,
  exists,
  fileSize,
  fontFilesOnDisk,
  isWoff2,
  parseFontFaces,
  publicFontPath,
  read,
  readJson,
  rel,
  stripComments,
  walk,
} from './font-assets.ts'
import { dirAtUnit, fileAtUnit, unitDiff } from '../acceptance/unit-range.ts'

const baseline = () =>
  readJson<{ sha256: Record<string, string>; indexImports: string[] }>(
    path.join(REPO, 'tests/assets/baseline/u1-styles-baseline.json'),
  )

const sha = (text: string): string => crypto.createHash('sha256').update(text).digest('hex')
const faces = () => parseFontFaces(read(FONTS_CSS))

describe('[u10#c1] the unit ships a fonts.css and a self-hosted font directory', () => {
  it('(a) src/client/styles/fonts.css exists', () => {
    expect(exists(FONTS_CSS)).toBe(true)
  })

  it('(b) public/assets/fonts/ exists and carries at least one font binary', () => {
    expect(exists(FONTS_DIR)).toBe(true)
    expect(fontFilesOnDisk().length).toBeGreaterThan(0)
  })

  it('(c) fonts.css declares @font-face blocks', () => {
    expect(faces().length).toBeGreaterThan(0)
  })

  it('(d) all three design-target families are declared, named exactly as tokens.css spells them', () => {
    const declared = new Set(faces().map((f) => f.family))
    for (const family of ALL_FAMILIES) {
      expect([...declared], `family "${family}" has no @font-face`).toContain(family)
    }
    const tokens = read(TOKENS_CSS)
    for (const family of ALL_FAMILIES) {
      expect(tokens, `tokens.css stack no longer mentions ${family}`).toContain(family)
    }
  })

  it('(e) the exact weight/style set of the design-target Google Fonts link is covered', () => {
    const declared = faces().map((f) => `${f.family}|${f.weight}|${f.style}`)
    const missing = EXPECTED_FACES.filter(
      (want) => !declared.some((d) => d === `${want.family}|${want.weight}|${want.style}`),
    ).map((w) => `${w.family} ${w.weight} ${w.style}`)
    expect(missing).toEqual([])
  })
})

describe('[u10#c1] nothing is loaded from a third party', () => {
  it('(a) fonts.css contains no absolute/protocol-relative URL', () => {
    const css = stripComments(read(FONTS_CSS))
    expect(css).not.toMatch(/https?:\/\//i)
    expect(css).not.toMatch(/url\(\s*['"]?\/\//i)
  })

  it('(b) fonts.css names no third-party host', () => {
    const css = read(FONTS_CSS).toLowerCase()
    const hits = THIRD_PARTY_MARKERS.filter((h) => css.includes(h))
    expect(hits).toEqual([])
  })

  it('(c) no u1 stylesheet gained a third-party host either', () => {
    const offenders = walk(STYLES_DIR)
      .filter((p) => p.endsWith('.css'))
      .filter((p) => THIRD_PARTY_MARKERS.some((h) => read(p).toLowerCase().includes(h)))
      .map(rel)
    expect(offenders).toEqual([])
  })

  it('(d) every src url resolves into public/assets/fonts and is a .woff2', () => {
    const bad: string[] = []
    for (const face of faces()) {
      if (face.srcUrls.length === 0) bad.push(`face #${face.index} (${face.family}) declares no src url()`)
      for (const url of face.srcUrls) {
        if (!publicFontPath(url)) bad.push(`face #${face.index}: "${url}" is not under assets/fonts/`)
        else if (!/\.woff2(\?.*)?$/i.test(url)) bad.push(`face #${face.index}: "${url}" is not a .woff2`)
      }
    }
    expect(bad).toEqual([])
  })

  it('(e) every referenced font file exists on disk, is non-empty and is really WOFF2', () => {
    const bad: string[] = []
    for (const face of faces()) {
      for (const url of face.srcUrls) {
        const tail = publicFontPath(url)
        if (!tail) continue
        const abs = path.join(FONTS_DIR, tail.replace(/^assets\/fonts\//, ''))
        if (!exists(abs)) bad.push(`missing: ${url}`)
        else if (fileSize(abs) === 0) bad.push(`empty: ${url}`)
        else if (!isWoff2(abs)) bad.push(`not a WOFF2 payload: ${url}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('(f) no orphan font binary ships unreferenced, and no legacy format ships at all', () => {
    const referenced = new Set(
      faces().flatMap((f) => f.srcUrls.map(publicFontPath).filter(Boolean).map((p) => `public/${p}`)),
    )
    const onDisk = fontFilesOnDisk()
    expect(onDisk.filter((p) => !/\.woff2$/i.test(p)), 'only .woff2 may ship').toEqual([])
    expect(onDisk.filter((p) => !referenced.has(p)), 'font file not referenced by fonts.css').toEqual([])
  })
})

describe('[u10#c4] first-render behaviour is declared in the sheet', () => {
  it('(a) every @font-face sets font-display: swap', () => {
    const bad = faces()
      .filter((f) => f.display.toLowerCase() !== 'swap')
      .map((f) => `face #${f.index} (${f.family} ${f.weight}) → font-display: "${f.display}"`)
    expect(bad).toEqual([])
  })

  it('(b) no face falls back to a locally installed copy (local() would hide a missing slice)', () => {
    expect(stripComments(read(FONTS_CSS))).not.toMatch(/\blocal\(/i)
  })

  it('(c) each face declares an explicit font-weight and font-style', () => {
    const bad = faces()
      .filter((f) => f.weight === '' || f.style === '')
      .map((f) => `face #${f.index} (${f.family})`)
    expect(bad).toEqual([])
  })
})

// C17 / [u11#c12] — RE-AIMED (08-04), never deleted. The claim is "**u10** may
// not edit a stylesheet u1 owns", and the baseline hashes were taken on u10's
// own RED-time base. They no longer match the live tree because **u3** —
// which merged after that baseline was taken (507669c, PR #117) — edited
// `shell.css`, which is u3's own chrome work and none of u10's business.
// Comparing the live tree to u10's baseline therefore measures u3, not u10.
// Re-aimed at u10's own merge, where the claim is exactly what it says: the
// files u10's merge touched under `styles/` are index.css and fonts.css only.
describe('[u10#c8] HARD CONSTRAINT — u1 stylesheets are untouched (re-aimed to u10\'s own range — C17)', () => {
  it('(a) every u1 sheet except index.css is byte-identical to its RED-time hash', () => {
    const { sha256 } = baseline()
    const owned = Object.keys(sha256).filter((file) => file !== 'index.css')
    const changed = unitDiff('u10', 'src/client/styles/')
      .map((f) => path.basename(f))
      .filter((f) => owned.includes(f))
    expect(changed, 'u10 may not edit any stylesheet u1 owns').toEqual([])
    // and what u10 DID land under styles/ is the one sheet it owns.
    expect(unitDiff('u10', 'src/client/styles/').map((f) => path.basename(f)).sort()).toEqual([
      'fonts.css',
      'index.css',
    ])
  })

  // C17 — RE-AIMED (08-08), never deleted, and for the same reason (a) already
  // was: these three read the LIVE tree to prove a claim about **u10**, so any
  // later unit that legitimately touches `styles/` fails them in u10's name.
  // The opening (plan-playtest O1) is that unit: it adds `--fs-26 / --fs-34` to
  // the scale and two sheets, `signin.css` and `win-manual.css`. Re-aimed at
  // u10's own range — where (b) and (f) say exactly what they claim — and, for
  // (c), at the part of the claim that must hold on the live tree forever: u1's
  // surviving imports (eight, since U3 retired win-tally.css) are still there,
  // still first, still in order. A later sheet may append after them; none may
  // displace or drop one.
  it('(b) tokens.css in particular is unchanged', () => {
    const { sha256 } = baseline()
    expect(sha(fileAtUnit('u10', 'src/client/styles/tokens.css'))).toBe(sha256['tokens.css'])
    expect(unitDiff('u10', 'src/client/styles/tokens.css'), 'u10 may not edit tokens.css').toEqual([])
  })

  it('(c) index.css keeps u1’s surviving imports, in order, unremoved', () => {
    const imports = [...read(INDEX_CSS).matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
    const { indexImports } = baseline()
    expect(imports.filter((i) => i !== './fonts.css').slice(0, indexImports.length)).toEqual(indexImports)
  })

  it('(d) index.css imports ./fonts.css exactly once', () => {
    const imports = [...read(INDEX_CSS).matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
    expect(imports.filter((i) => i === './fonts.css')).toHaveLength(1)
  })

  it('(e) index.css gains no rule beyond the import list', () => {
    expect(stripComments(read(INDEX_CSS))).not.toMatch(/\{/)
  })

  it('(f) fonts.css is the only file this unit adds under src/client/styles', () => {
    const added = dirAtUnit('u10', 'src/client/styles')
      .filter((f) => f.endsWith('.css'))
      // The baseline lost its win-tally.css row when U3 retired the live
      // sheet, and its win-block-store.css row when T1 retired that one; at
      // u10's own merge both were still u1 files, not u10 additions.
      .filter(
        (f) =>
          !Object.keys(baseline().sha256).includes(f) &&
          f !== 'win-tally.css' &&
          f !== 'win-block-store.css',
      )
    expect(added).toEqual(['fonts.css'])
  })
})
