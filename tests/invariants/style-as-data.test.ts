// [u9#c3] spec-client §3 invariant 8 (style-as-data) — run constraint C12.
//
// "Colors, paper stocks, type faces/sizes, spacing live in `styles/tokens.css`
// as custom properties; no literal color/size in component code."
//
// SCOPE (P1-D scoping rule, [u9#c6]): **repo-scoped with a proven-dead
// allowlist**, which is what this assert adds over `tests/styles/token-lint.
// test.ts` (u1). u1's lint scopes to `src/client/styles/*.css` plus the six
// §2.1 module dirs; this one sweeps **every** `.css` and **every** `.ts` under
// `src/`, plus `index.html`, so a literal cannot hide in a file that simply
// sits outside those two lists. Files that are genuinely not in the player
// build are named in `ALLOWLIST` and (c) below proves each one unreachable
// from the Vite entry.
//
// Every offender is reported as `file:line — match`.
import { describe, expect, it } from 'vitest'
import {
  COLOR_FN_RE,
  FONT_LITERAL_RE,
  INDEX_HTML,
  LENGTH_RE,
  NAMED_COLOR_RE,
  SRC,
  STYLES_DIR,
  TOKENS_CSS,
  abs,
  blank,
  exists,
  filesUnder,
  formatAll,
  hexHits,
  locate,
  playerBuildGraph,
  read,
  rel,
  stripUrls,
} from './invariant-utils.ts'
import type { Hit } from './invariant-utils.ts'

/**
 * Exempt from the literal scan. Every entry must be UNREACHABLE from the Vite
 * entry — (c) below fails the moment one of them enters the player build.
 *
 * `src/client/placeholder.ts` + `src/client/style.css` are the u0 scaffold's
 * pipeline-proof render loop. `src/client/main.ts` retired them (its comment
 * says so), nothing imports them, and they ship in no bundle. They are logged
 * in DISCOVERY.md as dead scaffold for their owning unit to delete — [u9#c8]:
 * this unit reports defects, it does not fix them.
 */
const ALLOWLIST: readonly string[] = ['src/client/placeholder.ts', 'src/client/style.css']

const TOKENS = 'src/client/styles/tokens.css'

/** Properties whose length values are structure (hairlines, insets), not scale. */
const STRUCTURAL_PROP_RE =
  /^(border(-(top|right|bottom|left|block|inline))?(-width)?|outline(-width|-offset)?|stroke-width|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height|flex|flex-basis|background-size|background-position|transform|translate|box-shadow|text-shadow|filter|backdrop-filter|clip-path|mask|border-radius|transition|animation|scroll-margin|scroll-padding|grid-template-columns|grid-template-rows|grid-auto-rows|grid-auto-columns|object-position|stroke-dasharray|stroke-dashoffset|will-change|content|z-index)$/

/**
 * The scale properties inv 8 actually binds: type faces/sizes + the spacing
 * steps. Deliberately the SAME property list u1's `token-lint.test.ts` ratified
 * — `letter-spacing` / `line-height` are per-rule typographic micro-adjustments
 * carried over verbatim from the design reference, not scale steps, and u1
 * merged with them literal. This assert widens the FILE scope, not the rule.
 */
const SCALE_PROP_RE =
  /^(font|font-family|font-size|padding|margin|gap|row-gap|column-gap|(padding|margin)-(top|right|bottom|left|block|inline)(-(start|end))?)$/

interface Sheet {
  readonly file: string
  readonly css: string
}

/** Every `.css` under `src/`, minus tokens.css and the allowlist. */
function scannedSheets(): Sheet[] {
  return filesUnder(SRC, '.css')
    .map((p) => ({ file: rel(p), css: stripUrls(blank(read(p), 'css')) }))
    .filter((s) => s.file !== TOKENS && !ALLOWLIST.includes(s.file))
}

/** Every `.ts` under `src/`, minus the allowlist. */
function scannedSources(): { file: string; text: string }[] {
  return filesUnder(SRC, '.ts')
    .map((p) => ({ file: rel(p), text: blank(read(p), 'ts') }))
    .filter((s) => !ALLOWLIST.includes(s.file))
}

interface Declaration {
  readonly prop: string
  readonly value: string
  readonly line: number
}

/** Naive declaration scan that keeps line numbers. */
function declarationsWithLines(css: string): Declaration[] {
  const out: Declaration[] = []
  for (const m of css.matchAll(/(--[\w-]+|[a-zA-Z-]+)\s*:\s*([^;{}]+)(?=[;}])/g)) {
    out.push({
      prop: m[1]!.trim(),
      value: m[2]!.trim().replace(/\s+/g, ' '),
      line: css.slice(0, m.index ?? 0).split('\n').length,
    })
  }
  return out
}

function decl(file: string, d: Declaration): Hit {
  return { file, line: d.line, match: `${d.prop}: ${d.value}` }
}

/**
 * Blank out `@font-face` blocks, keeping line numbers.
 *
 * `@font-face { font-family: 'Nanum Myeongjo' }` is where a face is *declared*
 * — it is the definition inv 8 points `--myeong` at, not a consumption-site
 * literal. Scanning it would make the invariant self-contradictory: there
 * would be no legal place to name a font at all.
 *
 * NOTE ([u9#c8], defect reported not fixed): `tests/styles/token-lint.test.ts`
 * (a) does NOT make this exemption and is RED on the current tree for exactly
 * these 500-odd generated `@font-face` lines. Logged in DISCOVERY.md for u1/u10.
 */
function withoutFontFace(css: string): string {
  return css.replace(/@font-face\s*\{[^}]*\}/g, (m) => m.replace(/[^\n]/g, ' '))
}

/** Split on top-level whitespace (keeps `calc(a + b)` and `var(--x, 1px)` intact). */
function parts(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth += 1
    if (ch === ')') depth -= 1
    if (depth === 0 && /\s/.test(ch)) {
      if (cur) out.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur) out.push(cur)
  return out
}

describe('[u9#c3] inv 8 — the scan covers the whole tree, not just the styles dir', () => {
  it('(a) tokens.css exists and is the only exempt sheet', () => {
    expect(exists(TOKENS_CSS)).toBe(true)
    expect(scannedSheets().map((s) => s.file)).not.toContain(TOKENS)
  })

  it('(b) the sweep reaches .css files outside src/client/styles and .ts outside the module dirs', () => {
    const cssOutsideStyles = filesUnder(SRC, '.css').map(rel).filter((f) => !f.startsWith(rel(STYLES_DIR)))
    const allCss = filesUnder(SRC, '.css').map(rel)
    expect(allCss.length, 'no stylesheet found at all').toBeGreaterThan(1)
    // Non-vacuity: the sweep is defined over the whole tree, so this list is
    // allowed to be empty — but the *scan surface* must never be.
    expect(scannedSheets().length + cssOutsideStyles.length).toBeGreaterThan(0)
    expect(scannedSources().length, 'the .ts sweep found nothing').toBeGreaterThan(3)
  })

  it('(c) every allowlisted file exists AND is unreachable from the Vite entry', () => {
    expect(ALLOWLIST.filter((f) => !exists(abs(f))), 'a stale allowlist entry').toEqual([])
    const graph = playerBuildGraph()
    expect(
      ALLOWLIST.filter((f) => graph.has(f)),
      'an allowlisted file IS in the player build — the exemption is a hole in inv 8',
    ).toEqual([])
  })
})

describe('[u9#c3] no color literal outside tokens.css', () => {
  it('(a) no hex / color-function / named color in any other stylesheet value', () => {
    const offenders: Hit[] = []
    for (const { file, css } of scannedSheets()) {
      for (const d of declarationsWithLines(css)) {
        const v = d.value
        if (hexHits(file, v).length > 0 || COLOR_FN_RE.test(v) || NAMED_COLOR_RE.test(v)) {
          offenders.push(decl(file, d))
        }
      }
    }
    expect(formatAll(offenders)).toEqual([])
  })

  it('(b) no color literal in any .ts under src/', () => {
    const offenders: Hit[] = []
    for (const { file, text } of scannedSources()) {
      offenders.push(...hexHits(file, text))
      offenders.push(...locate(file, text, COLOR_FN_RE))
    }
    expect(formatAll(offenders)).toEqual([])
  })

  it('(c) index.html carries no <style> block and no inline style attribute', () => {
    const html = blank(read(INDEX_HTML), 'html')
    expect(formatAll(locate('index.html', html, /<\s*style\b/i))).toEqual([])
    expect(formatAll(locate('index.html', html, /\sstyle\s*=\s*["'][^"']+["']/i))).toEqual([])
  })
})

describe('[u9#c3] type faces, type sizes and spacing are tokens', () => {
  it('(a) every scale-property value outside tokens.css is var()-driven, 0, auto or %', () => {
    const offenders: Hit[] = []
    for (const { file, css } of scannedSheets()) {
      for (const d of declarationsWithLines(withoutFontFace(css))) {
        if (d.prop.startsWith('--') || !SCALE_PROP_RE.test(d.prop)) continue
        const bad = parts(d.value).some(
          (p) =>
            !p.includes('var(') &&
            !/^0$/.test(p) &&
            p !== 'auto' &&
            !/%$/.test(p) &&
            !/^(inherit|initial|unset|revert|normal|none)$/.test(p) &&
            (LENGTH_RE.test(p) || /^\d*\.?\d+$/.test(p) || /['"]/.test(p)),
        )
        if (bad) offenders.push(decl(file, d))
      }
    }
    expect(formatAll(offenders)).toEqual([])
  })

  it('(b) no font-family / font-size literal in any .ts under src/', () => {
    const offenders: Hit[] = []
    for (const { file, text } of scannedSources()) offenders.push(...locate(file, text, FONT_LITERAL_RE))
    expect(formatAll(offenders)).toEqual([])
  })

  it('(c) no .ts under src/ writes a raw length into a style property', () => {
    // `el.style.width = '320px'` is the inv-8 hole a CSS-only lint misses.
    const offenders: Hit[] = []
    for (const { file, text } of scannedSources()) {
      offenders.push(...locate(file, text, /\.style\b[^\n=]{0,60}=\s*[`'"][^`'"\n]*\d+(px|rem|em|pt)\b/))
      offenders.push(...locate(file, text, /setProperty\s*\(\s*['"][^'"]+['"]\s*,\s*[`'"][^`'"\n]*\d+(px|rem|em|pt)\b/))
    }
    expect(formatAll(offenders)).toEqual([])
  })
})

describe('[u9#c3] the lint has teeth', () => {
  // Synthetic samples — the tree on disk is never edited to make a test fire.
  it('(a) it fires on a hex, an rgb(), a named color and a px font-size', () => {
    const sample = ['.x{color:#4fc3f7}', '.y{background:rgba(0,0,0,.5)}', '.z{color:white}', '.w{font-size:12px}'].join('\n')
    const decls = declarationsWithLines(sample)
    const colored = decls.filter(
      (d) => hexHits('s.css', d.value).length > 0 || COLOR_FN_RE.test(d.value) || NAMED_COLOR_RE.test(d.value),
    )
    expect(colored.map((d) => d.line)).toEqual([1, 2, 3])
    const sized = decls.filter((d) => SCALE_PROP_RE.test(d.prop) && parts(d.value).some((p) => LENGTH_RE.test(p)))
    expect(sized.map((d) => d.line)).toEqual([4])
  })

  it('(b) it does NOT fire on var()-driven values or on structural lengths', () => {
    const sample = ['.x{color:var(--ink)}', '.y{font-size:var(--fs-12)}', '.z{border:1px solid var(--line)}'].join('\n')
    const offenders = declarationsWithLines(sample).filter(
      (d) =>
        (hexHits('s.css', d.value).length > 0 || COLOR_FN_RE.test(d.value)) ||
        (SCALE_PROP_RE.test(d.prop) && parts(d.value).some((p) => !p.includes('var(') && LENGTH_RE.test(p))),
    )
    expect(offenders.map((d) => `${d.prop}: ${d.value}`)).toEqual([])
    expect(STRUCTURAL_PROP_RE.test('border')).toBe(true)
  })

  it('(c) the @font-face exemption removes face declarations and nothing else', () => {
    const sample = [
      "@font-face{font-family:'Nanum Myeongjo';src:url(x.woff2)}",
      '.x{font-size:12px}',
    ].join('\n')
    const kept = declarationsWithLines(withoutFontFace(sample))
    expect(kept.map((d) => `${d.line}:${d.prop}`)).toEqual(['2:font-size'])
    expect(withoutFontFace(sample).split('\n')).toHaveLength(2)
  })

  it('(d) `#ddayNum` is a DOM id, not a hex color', () => {
    expect(hexHits('s.ts', "must('#ddayNum')")).toEqual([])
    expect(hexHits('s.ts', "ctx.fillStyle = '#4fc3f7'").length).toBe(1)
  })

  it('(e) the allowlisted scaffold really does contain the literals it is exempted for', () => {
    // If someone empties `placeholder.ts` instead of deleting it, the exemption
    // has become a lie — this fails and the allowlist entry must go.
    const carriers = ALLOWLIST.filter((f) => {
      const text = f.endsWith('.css') ? stripUrls(blank(read(abs(f)), 'css')) : blank(read(abs(f)), 'ts')
      return hexHits(f, text).length > 0 || COLOR_FN_RE.test(text) || LENGTH_RE.test(text)
    })
    expect(carriers.sort()).toEqual([...ALLOWLIST].sort())
  })
})
