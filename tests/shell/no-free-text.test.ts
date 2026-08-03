// [u3#c7] spec-client §3 invariant 1 — the membrane.
//
// The shell introduces no `<input>`, no `contenteditable`, no free-text surface
// anywhere; the rate control and the window controls are real `<button>`s.
// (The DOM half of this lives in `e2e/shell.spec.ts` › 'a11y'; this is the
// source-level guard, so a regression is caught before a browser is involved.)
//
// Also pins run-wide C4: sessionStorage is the ONLY storage allowed and
// localStorage is forbidden everywhere.
import { describe, it, expect } from 'vitest'
import {
  CLIENT,
  COMPONENTS_DIR,
  INDEX_HTML,
  SHELL_DIR,
  WINDOWS_DIR,
  clientSources,
  read,
  rel,
  stripComments,
} from './shell-utils.ts'

interface Scan {
  readonly file: string
  readonly text: string
}

/** index.html plus every `.ts` the shell owns or could reach. */
function surfaces(): Scan[] {
  const out: Scan[] = [{ file: 'index.html', text: read(INDEX_HTML) }]
  for (const f of clientSources()) out.push({ file: rel(f), text: read(f) })
  return out
}

/** The shell's own sources — the files this unit writes. */
function shellSources(): Scan[] {
  return clientSources()
    .filter((f) => f.startsWith(SHELL_DIR) || f.startsWith(COMPONENTS_DIR) || f.startsWith(WINDOWS_DIR) || f === `${CLIENT}/main.ts`)
    .map((f) => ({ file: rel(f), text: read(f) }))
}

const FREE_TEXT_TAGS = /<\s*(input|textarea|select)\b/i
const CREATE_FREE_TEXT = /createElement\s*\(\s*['"`](input|textarea|select)['"`]/i
const CONTENTEDITABLE = /contenteditable/i
const DESIGN_MODE = /designMode/

function hits(scans: Scan[], re: RegExp): string[] {
  return scans.filter((s) => re.test(stripComments(s.text))).map((s) => s.file)
}

describe('[u3#c7] no free-text surface reaches the player build', () => {
  it('(a) the scan is non-vacuous — index.html and the client sources are readable', () => {
    const scans = surfaces()
    expect(scans.length).toBeGreaterThan(1)
    expect(scans[0]!.text.length).toBeGreaterThan(0)
  })

  it('(b) no <input>, <textarea> or <select> markup anywhere', () => {
    expect(hits(surfaces(), FREE_TEXT_TAGS)).toEqual([])
  })

  it('(c) nothing constructs one at runtime either', () => {
    expect(hits(surfaces(), CREATE_FREE_TEXT)).toEqual([])
  })

  it('(d) no contenteditable and no designMode', () => {
    expect(hits(surfaces(), CONTENTEDITABLE)).toEqual([])
    expect(hits(surfaces(), DESIGN_MODE)).toEqual([])
  })

  it('(e) index.html declares no form surface', () => {
    const html = read(INDEX_HTML)
    expect(html).not.toMatch(/<\s*form\b/i)
    expect(html).not.toMatch(FREE_TEXT_TAGS)
  })
})

describe('[u3#c7] the controls are buttons', () => {
  it('(a) the shell builds real buttons', () => {
    const text = shellSources().map((s) => stripComments(s.text)).join('\n')
    expect(text.length, 'the shell owns no source yet').toBeGreaterThan(0)
    expect(text).toMatch(/button/)
  })

  it('(b) nothing fakes a button with role="button" on a non-button', () => {
    const offenders = hits(shellSources(), /role\s*[=:]\s*['"`]button['"`]/)
    expect(offenders).toEqual([])
  })

  it('(c) no clickable div/span is wired with an inline handler in the markup', () => {
    const html = stripComments(read(INDEX_HTML))
    expect(html).not.toMatch(/\son(click|keydown|keyup|input|change)\s*=/i)
  })
})

describe('[C4] storage — sessionStorage only, never localStorage', () => {
  it('(a) no client source touches localStorage', () => {
    expect(hits(surfaces(), /\blocalStorage\b/)).toEqual([])
  })

  it('(b) no client source touches document.cookie or indexedDB', () => {
    expect(hits(surfaces(), /document\.cookie|\bindexedDB\b/)).toEqual([])
  })
})
