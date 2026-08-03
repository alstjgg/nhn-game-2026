// [u9d#c4] spec-client §3 invariant 1 (the membrane) — the pane introduces no
// free-text surface EVEN FLAG-ON. Raw tables and, at most, real `<button>`s;
// no `<input>`, no `<textarea>`, no `<select>`, no `contenteditable`, no
// `prompt()`.
//
// Source-level half (the DOM half lives in `e2e/debug-pane.spec.ts`), mirroring
// the u3 precedent in `tests/shell/no-free-text.test.ts`.
import { describe, it, expect } from 'vitest'
import { DEBUG_DIR, debugSources, stripComments, tsFiles, rel } from './debug-utils.ts'

interface Scan {
  readonly file: string
  readonly text: string
}

const scans = (): Scan[] => debugSources().map((s) => ({ file: s.file, text: stripComments(s.text) }))

function hits(re: RegExp): string[] {
  return scans().filter((s) => re.test(s.text)).map((s) => s.file)
}

const FREE_TEXT_TAGS = /<\s*(input|textarea|select|form)\b/i
const CREATE_FREE_TEXT = /createElement\s*\(\s*['"`](input|textarea|select|form)['"`]/i

describe('[u9d#c4] the pane opens no free-text surface', () => {
  it('(a) the scan is non-vacuous — the pane owns readable source', () => {
    expect(tsFiles(DEBUG_DIR).map(rel), 'the debug pane owns no source yet').not.toEqual([])
    expect(scans().some((s) => s.text.trim().length > 0)).toBe(true)
  })

  it('(b) no <input>, <textarea>, <select> or <form> markup', () => {
    expect(hits(FREE_TEXT_TAGS)).toEqual([])
  })

  it('(c) nothing constructs one at runtime either', () => {
    expect(hits(CREATE_FREE_TEXT)).toEqual([])
    expect(hits(/insertAdjacentHTML[\s\S]{0,200}<\s*(input|textarea|select)\b/i)).toEqual([])
  })

  it('(d) no contenteditable and no designMode', () => {
    expect(hits(/contenteditable/i)).toEqual([])
    expect(hits(/designMode/)).toEqual([])
  })

  it('(e) no prompt()/confirm() text entry', () => {
    expect(hits(/\b(window\.)?(prompt|confirm)\s*\(/)).toEqual([])
  })

  it('(f) no clipboard read that would round-trip operator text back in', () => {
    expect(hits(/clipboard\s*\.\s*read/)).toEqual([])
  })
})

describe('[u9d#c4] whatever controls it has are real buttons', () => {
  it('(a) nothing fakes a button with role="button" on a non-button', () => {
    expect(hits(/role\s*[=:]\s*['"`]button['"`]/)).toEqual([])
  })

  it('(b) nothing fakes a text field with role="textbox" either', () => {
    expect(hits(/role\s*[=:]\s*['"`](textbox|searchbox|combobox)['"`]/)).toEqual([])
  })

  it('(c) it never sets tabindex on a non-interactive node to fake focus entry', () => {
    expect(hits(/contentEditable/)).toEqual([])
  })
})
