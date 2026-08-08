// [u1#c3] design README 'Notes' — one stacking context for every window.
//
// `#desktop` keeps `display:contents` and creates no stacking context of its
// own; a context on `#desktop` (or on a .win ancestor) would pin one window
// permanently on top and break window focus ordering. Every `.win` must be
// z-ordered by the same runtime `--z` custom property. (BLOCK STORE, the
// window that once sat outside `#desktop`, was retired by T1.)
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { STYLES_DIR, declarations, read, ruleBodies, scannable, sheetsOnDisk } from './css-utils.ts'

interface Sheet { readonly file: string; readonly css: string }

function sheets(): Sheet[] {
  return sheetsOnDisk().map((f) => ({ file: `src/client/styles/${f}`, css: read(path.join(STYLES_DIR, f)) }))
}

/** Every rule body whose selector list mentions `selectorRe`, tagged with its file. */
function bodiesFor(selectorRe: RegExp): { file: string; body: string }[] {
  return sheets().flatMap(({ file, css }) => ruleBodies(css, selectorRe).map((body) => ({ file, body })))
}

/**
 * Declarations in `body` that would make the element a stacking context.
 * (CSS 2.1 §9.9 + css-position-3 / css-contain-2 additions.)
 */
function stackingContextDecls(body: string): string[] {
  const out: string[] = []
  for (const d of declarations(body)) {
    const v = d.value.toLowerCase().trim()
    switch (d.prop.toLowerCase()) {
      case 'z-index':
        if (v !== 'auto') out.push(`${d.prop}: ${v}`)
        break
      case 'position':
        if (v === 'fixed' || v === 'sticky') out.push(`${d.prop}: ${v}`)
        break
      case 'opacity':
        if (v !== '1' && v !== '100%') out.push(`${d.prop}: ${v}`)
        break
      case 'transform':
      case 'rotate':
      case 'scale':
      case 'translate':
      case 'filter':
      case 'backdrop-filter':
      case 'perspective':
      case 'mix-blend-mode':
        if (v !== 'none' && v !== 'normal') out.push(`${d.prop}: ${v}`)
        break
      case 'isolation':
        if (v === 'isolate') out.push(`${d.prop}: ${v}`)
        break
      case 'will-change':
        out.push(`${d.prop}: ${v}`)
        break
      case 'contain':
        if (/(paint|layout|strict|content)/.test(v)) out.push(`${d.prop}: ${v}`)
        break
      default:
        break
    }
  }
  return out
}

/**
 * Rule bodies whose *subject* (the last compound of the selector) is a window
 * root — `.win`, `.win.focused`, `.win-file.win` … Chrome descendants such as
 * `.win-grip` are NOT window roots and may order inside the window freely.
 */
function windowRootBodies(css: string): string[] {
  const out: string[] = []
  for (const m of scannable(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const isRoot = m[1]!
      .split(',')
      .map((s) => s.trim().split(/[\s>+~]+/).pop() ?? '')
      .some((subject) => /\.win(?![\w-])/.test(subject))
    if (isRoot) out.push(m[2]!)
  }
  return out
}

const DESKTOP_RE = /(^|[\s,>+~])#desktop(?![\w-])/
const WIN_ANCESTOR_RE = /^(html|body|html\s*,\s*body|body\s*,\s*html|#app|#root|#shell|#screen)$/

describe('[u1#c3] #desktop is display:contents', () => {
  it('(a) exactly one stylesheet owns the #desktop rule', () => {
    const owners = sheets().filter(({ css }) => ruleBodies(css, DESKTOP_RE).length > 0).map((s) => s.file)
    expect(owners).toHaveLength(1)
  })

  it('(b) #desktop declares display:contents', () => {
    const decls = bodiesFor(DESKTOP_RE).flatMap(({ body }) => declarations(body))
    const display = decls.filter((d) => d.prop.toLowerCase() === 'display').map((d) => d.value.trim())
    expect(display).toEqual(['contents'])
  })

  it('(c) no later rule re-declares #desktop with a different display', () => {
    const bad = bodiesFor(DESKTOP_RE)
      .flatMap(({ file, body }) =>
        declarations(body)
          .filter((d) => d.prop.toLowerCase() === 'display' && d.value.trim() !== 'contents')
          .map((d) => `${file}: display: ${d.value}`),
      )
    expect(bad).toEqual([])
  })
})

describe('[u1#c3] nothing above .win creates a stacking context', () => {
  it('(a) #desktop creates no stacking context', () => {
    const offenders = bodiesFor(DESKTOP_RE).flatMap(({ file, body }) =>
      stackingContextDecls(body).map((d) => `${file}: #desktop { ${d} }`),
    )
    expect(offenders).toEqual([])
  })

  it('(b) html / body / #app / #shell create no stacking context either', () => {
    const offenders = sheets().flatMap(({ file, css }) =>
      ruleBodies(css, WIN_ANCESTOR_RE).flatMap((body) =>
        stackingContextDecls(body).map((d) => `${file}: ${d}`),
      ),
    )
    expect(offenders).toEqual([])
  })
})

describe('[u1#c3] every .win shares one z-order', () => {
  it('(a) the .win shell is z-ordered by the runtime --z custom property', () => {
    const bodies = bodiesFor(/(^|[\s,>+~])\.win(?![\w-])/)
    const zIndexes = bodies
      .flatMap(({ body }) => declarations(body))
      .filter((d) => d.prop.toLowerCase() === 'z-index')
      .map((d) => d.value.trim())
    expect(zIndexes.some((v) => v.includes('var(--z'))).toBe(true)
  })

  it('(b) the .win shell is positioned (fixed) so --z applies', () => {
    const positions = bodiesFor(/(^|[\s,>+~])\.win(?![\w-])/)
      .flatMap(({ body }) => declarations(body))
      .filter((d) => d.prop.toLowerCase() === 'position')
      .map((d) => d.value.trim())
    expect(positions).toContain('fixed')
  })

  it('(c) no window-root rule pins a literal z-index (no window may float)', () => {
    const offenders = sheets().flatMap(({ file, css }) =>
      windowRootBodies(css).flatMap((body) =>
        declarations(body)
          .filter((d) => d.prop.toLowerCase() === 'z-index' && !d.value.includes('var(') && d.value.trim() !== 'auto')
          .map((d) => `${file}: z-index: ${d.value}`),
      ),
    )
    expect(offenders).toEqual([])
  })

  it('(d) per-window skins order only inside their own window (z-index < 10)', () => {
    const offenders = ['win-agent-file.css', 'win-live-feed.css', 'win-reports.css']
      .flatMap((f) => {
        const css = read(path.join(STYLES_DIR, f))
        return declarations(css)
          .filter((d) => d.prop.toLowerCase() === 'z-index')
          .filter((d) => {
            const v = d.value.trim()
            if (v === 'auto' || v.includes('var(')) return false
            return !(Number.isFinite(Number(v)) && Math.abs(Number(v)) < 10)
          })
          .map((d) => `${f}: z-index: ${d.value}`)
      })
    expect(offenders).toEqual([])
  })
})
