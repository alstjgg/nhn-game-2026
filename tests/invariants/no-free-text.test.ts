// [u9#c1] spec-client §3 invariant 1 (the membrane) — run constraint C11.
//
// "No `<input>`, no `contenteditable`, no free-text surface, anywhere in the
// player build. Player input is the five `MembraneOp`s and window management
// only."
//
// SCOPE (P1-D scoping rule, [u9#c6]): **repo-scoped with a proven-dead
// allowlist**. The scan covers `index.html` plus every module reachable from
// its Vite entry — that reachable set *is* the player build. `ALLOWLIST`
// entries are exempt, and describe-block (f) proves each one is unreachable
// from the entry, so the allowlist can never quietly cover a live module.
//
// The rendered-DOM half of this invariant lives in `e2e/a11y.spec.ts`
// (`inv 1 · rendered DOM`): vitest runs in `environment: 'node'`, so a browser
// assert cannot live here.
//
// Every offender is reported as `file:line — match`.
import { describe, expect, it } from 'vitest'
import {
  INDEX_HTML,
  abs,
  blank,
  exists,
  formatAll,
  locate,
  playerBuildGraph,
  read,
  rel,
} from './invariant-utils.ts'
import type { Hit } from './invariant-utils.ts'

/**
 * Files exempt from the membrane scan.
 *
 * Empty on purpose: nothing in the player build has ever needed an exemption,
 * and (f) below makes any future entry pay for itself by proving the file is
 * unreachable from the Vite entry.
 */
const ALLOWLIST: readonly string[] = []

/** `<input>`, `<textarea>`, `<select>`, `<form>` — markup-level free text. */
const FREE_TEXT_TAG_RE = /<\s*(input|textarea|select|form)\b/i
/** The same surfaces, constructed at runtime. */
const CREATE_FREE_TEXT_RE = /createElement\s*\(\s*['"`](input|textarea|select|form)['"`]/i
/** The same surfaces, injected as a markup string. */
const HTML_INJECT_RE = /(innerHTML|outerHTML|insertAdjacentHTML)[\s\S]{0,80}?<\s*(input|textarea|select|form)\b/i
const CONTENTEDITABLE_RE = /contenteditable|contentEditable/
/** The other three ways a page becomes editable. */
const EDITABLE_ESCAPE_RE = /designMode|execCommand|\binputmode\b|isContentEditable/i

interface Scan {
  readonly file: string
  readonly text: string
  readonly kind: 'ts' | 'css' | 'html'
}

/** index.html + every module the player build actually loads, minus the allowlist. */
function playerSurfaces(): Scan[] {
  const out: Scan[] = [{ file: 'index.html', text: blank(read(INDEX_HTML), 'html'), kind: 'html' }]
  for (const file of [...playerBuildGraph()].sort()) {
    if (ALLOWLIST.includes(file)) continue
    const kind = file.endsWith('.css') ? 'css' : 'ts'
    out.push({ file, text: blank(read(abs(file)), kind), kind })
  }
  return out
}

function hits(scans: Scan[], re: RegExp): Hit[] {
  return scans.flatMap((s) => locate(s.file, s.text, re))
}

describe('[u9#c1] inv 1 — the membrane: no free-text surface in the player build', () => {
  it('(a) the scan is non-vacuous — index.html and the reachable module graph are readable', () => {
    const scans = playerSurfaces()
    expect(exists(INDEX_HTML), 'index.html is missing — the scan would pass vacuously').toBe(true)
    expect(scans[0]!.text.length).toBeGreaterThan(0)
    expect(scans.length, 'the player build graph resolved to nothing').toBeGreaterThan(3)
    expect(
      scans.some((s) => s.file.endsWith('.ts')),
      'the graph walk found no TypeScript module — the resolver is broken, not the tree',
    ).toBe(true)
  })

  it('(b) no <input>, <textarea>, <select> or <form> markup anywhere', () => {
    expect(formatAll(hits(playerSurfaces(), FREE_TEXT_TAG_RE))).toEqual([])
  })

  it('(c) nothing constructs a free-text surface at runtime', () => {
    expect(formatAll(hits(playerSurfaces(), CREATE_FREE_TEXT_RE))).toEqual([])
  })

  it('(d) nothing injects one as a markup string either', () => {
    expect(formatAll(hits(playerSurfaces(), HTML_INJECT_RE))).toEqual([])
  })

  it('(e) no contenteditable, designMode, execCommand or inputmode', () => {
    const scans = playerSurfaces()
    expect(formatAll(hits(scans, CONTENTEDITABLE_RE))).toEqual([])
    expect(formatAll(hits(scans, EDITABLE_ESCAPE_RE))).toEqual([])
  })

  it('(f) index.html declares no form surface and no inline event handler', () => {
    const html = blank(read(INDEX_HTML), 'html')
    expect(formatAll(locate('index.html', html, FREE_TEXT_TAG_RE))).toEqual([])
    expect(formatAll(locate('index.html', html, /\son(click|keydown|keyup|input|change|paste)\s*=/i))).toEqual([])
  })
})

describe('[u9#c1] the offender report carries file:line', () => {
  // The value of this assert is the location it prints. A scanner that finds
  // an offender but reports "true !== false" is not worth having, so the
  // reporting contract is pinned against synthetic in-memory samples — the
  // tree on disk is never edited to make a test fire.
  const SAMPLE = ['const a = 1', 'const b = 2', 'el.innerHTML = "<input type=text>"', ''].join('\n')

  it('(a) locate() reports the 1-based line of the offending source', () => {
    const found = locate('sample.ts', SAMPLE, FREE_TEXT_TAG_RE)
    expect(found).toHaveLength(1)
    expect(found[0]!.line).toBe(3)
    expect(format0(found)).toMatch(/^sample\.ts:3 — /)
  })

  it('(b) comments are blanked without shifting line numbers', () => {
    const withComment = ['// <input> in prose is not a surface', 'const x = 1', '<input>'].join('\n')
    const blanked = blank(withComment, 'ts')
    expect(blanked.split('\n')).toHaveLength(3)
    const found = locate('sample.ts', blanked, FREE_TEXT_TAG_RE)
    expect(found.map((h) => h.line)).toEqual([3])
  })

  it('(c) the scanner is not blind — it fires on every shape it claims to catch', () => {
    const shapes: [string, RegExp][] = [
      ['<textarea rows="3">', FREE_TEXT_TAG_RE],
      ["document.createElement('input')", CREATE_FREE_TEXT_RE],
      ['host.innerHTML = `<select></select>`', HTML_INJECT_RE],
      ['el.setAttribute("contenteditable", "true")', CONTENTEDITABLE_RE],
      ['document.designMode = "on"', EDITABLE_ESCAPE_RE],
    ]
    const missed = shapes.filter(([sample, re]) => locate('s.ts', sample, re).length === 0).map(([s]) => s)
    expect(missed, 'the membrane scanner does not catch these shapes').toEqual([])
  })
})

describe('[u9#c1] the allowlist is proven, not asserted', () => {
  it('(a) every allowlisted file exists on disk', () => {
    expect(ALLOWLIST.filter((f) => !exists(abs(f)))).toEqual([])
  })

  it('(b) every allowlisted file is unreachable from the Vite entry (it ships in no bundle)', () => {
    const graph = playerBuildGraph()
    const live = ALLOWLIST.filter((f) => graph.has(f))
    expect(live, 'an allowlisted file IS in the player build — the exemption is a hole').toEqual([])
  })

  it('(c) the graph walk actually starts somewhere — index.html declares a module entry', () => {
    const graph = playerBuildGraph()
    expect([...graph].some((f) => f.startsWith('src/'))).toBe(true)
    expect(rel(abs('src'))).toBe('src')
  })
})

function format0(hits: Hit[]): string {
  return `${hits[0]!.file}:${hits[0]!.line} — ${hits[0]!.match}`
}
