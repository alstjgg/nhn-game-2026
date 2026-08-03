// [u1#c1] spec-client §3 inv 8 (style-as-data) + run constraint C11.
//
// Every color, paper stock, type face/size and spacing step lives in
// `styles/tokens.css` as a custom property. No literal hex/rgb/px-size/
// font-family may appear in any other stylesheet or in any component .ts.
//
// Structural lint only: reads the repo from disk, imports nothing from src/.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
  ALL_SHEETS,
  DESIGN_CSS,
  INDEX_CSS,
  REPO,
  RUNTIME_PROPS,
  STYLES_DIR,
  TOKENS_CSS,
  colorLiteralsInValues,
  customProps,
  declarations,
  exists,
  read,
  rel,
  rootProps,
  scannable,
  selectors,
  sheetsOnDisk,
  varRefs,
  walk,
} from './css-utils.ts'

/** Sheets that must obey the no-literal rule = everything except tokens.css. */
function nonTokenSheets(): { file: string; css: string }[] {
  return sheetsOnDisk()
    .filter((f) => f !== 'tokens.css')
    .map((f) => ({ file: `src/client/styles/${f}`, css: read(path.join(STYLES_DIR, f)) }))
}

/** Component .ts = the six spec-client §2.1 module dirs (u0's scaffold roots stay out). */
const COMPONENT_DIRS = ['shell', 'windows', 'components', 'driver', 'debug']
function componentSources(): { file: string; src: string }[] {
  return COMPONENT_DIRS.flatMap((d) => walk(path.join(REPO, 'src/client', d)))
    .filter((p) => p.endsWith('.ts'))
    .map((p) => ({ file: rel(p), src: read(p) }))
}

/** Split a declaration value on top-level whitespace (keeps `calc(a + b)` intact). */
function parts(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth === 0 && /\s/.test(ch)) {
      if (cur) out.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur) out.push(cur)
  return out
}

const LENGTH_VALUE_RE = /^-?\d*\.?\d+(px|rem|em)$/
const SPACING_PROP_RE =
  /^(padding|margin|gap|row-gap|column-gap|(padding|margin)-(top|right|bottom|left|block|inline)(-(start|end))?)$/
const FONT_PROP_RE = /^(font|font-family|font-size)$/
const VAR_ONLY_RE = /^var\(\s*--[\w-]+\s*(,[^)]*)?\)$/

describe('[u1#c1] tokens.css is the single style-as-data source', () => {
  it('(a) src/client/styles/tokens.css exists', () => {
    expect(exists(TOKENS_CSS)).toBe(true)
  })

  it('(b) the nine u1 stylesheets + index.css exist', () => {
    const missing = [...ALL_SHEETS, 'index.css'].filter(
      (f) => !exists(path.join(STYLES_DIR, f)),
    )
    expect(missing).toEqual([])
  })

  it('(c) tokens.css declares its palette under :root', () => {
    const root = rootProps(read(TOKENS_CSS))
    expect(root.size).toBeGreaterThanOrEqual(20)
  })

  it('(d) tokens.css contains ONLY custom-property declarations (it declares, never paints)', () => {
    const painting = declarations(scannable(read(TOKENS_CSS)))
      .filter((d) => !d.prop.startsWith('--'))
      .map((d) => `${d.prop}: ${d.value}`)
    expect(painting).toEqual([])
  })

  it('(e) tokens.css only targets :root (no element/class rules)', () => {
    const foreign = selectors(read(TOKENS_CSS)).filter((s) => !/^:root$/.test(s.replace(/\s+/g, '')))
    expect(foreign).toEqual([])
  })
})

describe('[u1#c1] no color literal outside tokens.css', () => {
  it('(a) no hex / rgb() / hsl() / named color in any other stylesheet', () => {
    const offenders = nonTokenSheets()
      .flatMap(({ file, css }) => colorLiteralsInValues(css).map((c) => `${file}: ${c}`))
    expect(offenders).toEqual([])
  })

  it('(b) index.css carries no color literal either (it is an import manifest)', () => {
    expect(colorLiteralsInValues(read(INDEX_CSS))).toEqual([])
  })

  it('(c) no color literal in any component .ts under src/client', () => {
    const offenders = componentSources().flatMap(({ file, src }) => {
      const hex = [...src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)]
        .map((m) => m[0])
        .filter((h) => [4, 5, 7, 9].includes(h.length))
      const fns = [...src.matchAll(/\b(rgba?|hsla?|oklch|oklab)\s*\(/g)].map((m) => m[0])
      return [...hex, ...fns].map((c) => `${file}: ${c}`)
    })
    expect(offenders).toEqual([])
  })
})

describe('[u1#c1] type faces and type sizes are tokens', () => {
  it('(a) font-family / font-size / font values outside tokens.css are var()-driven', () => {
    const offenders = nonTokenSheets().flatMap(({ file, css }) =>
      declarations(scannable(css))
        .filter((d) => FONT_PROP_RE.test(d.prop))
        .filter((d) => !VAR_ONLY_RE.test(d.value) && !/^(inherit|initial|unset|revert)$/.test(d.value))
        .map((d) => `${file}: ${d.prop}: ${d.value}`),
    )
    expect(offenders).toEqual([])
  })

  it('(b) no font-family / font-size string literal in any component .ts', () => {
    const offenders = componentSources()
      .filter(({ src }) => /font-(family|size)\s*[:=]/i.test(src))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it('(c) tokens.css declares a type-size scale (>= 5 named size tokens)', () => {
    const scale = [...rootProps(read(TOKENS_CSS))].filter(
      ([name, value]) => /^--(fs|font-size|type|text)/.test(name) && LENGTH_VALUE_RE.test(value),
    )
    expect(scale.length).toBeGreaterThanOrEqual(5)
  })
})

describe('[u1#c1] the spacing scale lives in tokens.css', () => {
  it('(a) tokens.css declares a spacing scale (>= 4 named spacing tokens)', () => {
    const scale = [...rootProps(read(TOKENS_CSS))].filter(
      ([name, value]) => /^--(space|spacing|gap|pad|step|unit)/.test(name) && LENGTH_VALUE_RE.test(value),
    )
    expect(scale.length).toBeGreaterThanOrEqual(4)
  })

  it('(b) padding / margin / gap outside tokens.css use tokens, 0, auto or %', () => {
    const offenders = nonTokenSheets().flatMap(({ file, css }) =>
      declarations(scannable(css))
        .filter((d) => SPACING_PROP_RE.test(d.prop))
        .filter((d) =>
          parts(d.value).some(
            (p) => !(p.includes('var(') || /^0$/.test(p) || p === 'auto' || /%$/.test(p)),
          ),
        )
        .map((d) => `${file}: ${d.prop}: ${d.value}`),
    )
    expect(offenders).toEqual([])
  })
})

describe('[u1#c1] the lint has teeth (guards against a vacuous rule set)', () => {
  // If someone pasted desktop.css in unchanged, every rule above must fire.
  const design = read(DESIGN_CSS)

  it('(a) it finds the un-tokenized colors in the design reference', () => {
    expect(colorLiteralsInValues(design).length).toBeGreaterThan(50)
  })

  it('(b) it finds the un-tokenized font-size / font-family in the design reference', () => {
    const hits = declarations(scannable(design))
      .filter((d) => FONT_PROP_RE.test(d.prop))
      .filter((d) => !VAR_ONLY_RE.test(d.value) && !/^(inherit|initial|unset|revert)$/.test(d.value))
    expect(hits.length).toBeGreaterThan(10)
  })

  it('(c) it finds the un-tokenized spacing in the design reference', () => {
    const hits = declarations(scannable(design))
      .filter((d) => SPACING_PROP_RE.test(d.prop))
      .filter((d) => parts(d.value).some((p) => LENGTH_VALUE_RE.test(p)))
    expect(hits.length).toBeGreaterThan(10)
  })
})

describe('[u1#c1] every var() reference resolves', () => {
  it('(a) no stylesheet references a custom property nobody declares', () => {
    const declaredInTokens = new Set(customProps(read(TOKENS_CSS)).keys())
    const offenders = sheetsOnDisk().flatMap((f) => {
      const css = read(path.join(STYLES_DIR, f))
      const local = new Set(customProps(css).keys())
      return varRefs(css)
        .filter((v) => !declaredInTokens.has(v) && !local.has(v) && !RUNTIME_PROPS.has(v))
        .map((v) => `src/client/styles/${f}: var(${v})`)
    })
    expect(offenders).toEqual([])
  })

  it('(b) no token is declared empty', () => {
    const empty = [...customProps(read(TOKENS_CSS))]
      .filter(([, value]) => value.length === 0)
      .map(([name]) => name)
    expect(empty).toEqual([])
  })
})
