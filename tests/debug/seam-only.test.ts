// [u9d#c3] spec-client §3 invariant 12 + §2.1 (`debug/` may import `driver`
// and nothing else) — the pane is a READER. It consumes driver output only: it
// never imports engine or composer, never reaches into the shell's DOM, and
// never mutates state (not the driver's, not the meta-state, not the desk).
//
// Structural only: reads the repo from disk, imports no product module (vitest
// runs in `node`, and the pane is a DOM module — its behaviour is pinned in
// `e2e/debug-pane.spec.ts`).
import { describe, it, expect } from 'vitest'
import {
  DEBUG_DIR,
  debugSources,
  edges,
  rel,
  stripComments,
  specifiers,
  tsFiles,
} from './debug-utils.ts'

const sources = () => debugSources()
const codeOf = () => sources().map((s) => ({ file: s.file, text: stripComments(s.text) }))
const allCode = () => codeOf().map((s) => s.text).join('\n')

function offenders(re: RegExp): string[] {
  return codeOf().filter((s) => re.test(s.text)).map((s) => s.file)
}

describe('[u9d#c3] the pane owns source, and only under debug/', () => {
  it('(a) src/client/debug/ carries at least one module (non-vacuity)', () => {
    expect(tsFiles(DEBUG_DIR).map(rel), 'the debug pane owns no source yet').not.toEqual([])
  })

  it('(b) every file this unit ships lives under src/client/debug/', () => {
    expect(sources().filter((s) => !s.file.startsWith('src/client/debug/')).map((s) => s.file)).toEqual([])
  })
})

describe('[u9d#c3] import direction — driver and shared only', () => {
  it('(a) no relative import leaves debug/, driver/ or shared/', () => {
    const bad = edges(sources())
      .filter(
        (e) =>
          !e.to.startsWith('src/client/debug/') &&
          !e.to.startsWith('src/client/driver') &&
          !e.to.startsWith('src/shared/'),
      )
      .map((e) => `${e.from} -> ${e.to}`)
    expect(bad).toEqual([])
  })

  it('(b) it never imports engine or composer (inv 12 — only driver/ may)', () => {
    const bad = edges(sources())
      .filter((e) => /^src\/(engine|composer)\b/.test(e.to))
      .map((e) => `${e.from} -> ${e.to}`)
    expect(bad).toEqual([])
  })

  it('(c) it never imports the shell, the windows or the components', () => {
    const bad = edges(sources())
      .filter((e) => /^src\/client\/(shell|windows|components|styles)\b/.test(e.to))
      .map((e) => `${e.from} -> ${e.to}`)
    expect(bad).toEqual([])
  })

  it('(d) it pulls in no runtime package (inv 9 — zero runtime deps)', () => {
    const bare = sources().flatMap((s) => specifiers(s.text).filter((x) => !x.startsWith('.')))
    expect(bare.filter((s) => !s.startsWith('node:'))).toEqual([])
  })

  it('(e) it re-declares no seam type — those live in src/shared/view-driver.ts', () => {
    const bad: string[] = []
    for (const s of codeOf()) {
      for (const n of ['Species', 'Sentence', 'FeedKind', 'FeedLine', 'ViewEvent', 'MembraneOp']) {
        if (new RegExp(`(?:type|interface)\\s+${n}\\b`).test(s.text)) bad.push(`${s.file}:${n}`)
      }
    }
    expect(bad).toEqual([])
  })
})

describe('[u9d#c3] read-only against the driver', () => {
  it('(a) it never drives the stream — no start/advance/drain call', () => {
    expect(offenders(/\.\s*(start|advance|drain)\s*\(/)).toEqual([])
  })

  it('(b) it never sends a membrane op', () => {
    expect(offenders(/\.\s*send\s*\(/)).toEqual([])
  })

  it('(c) it never touches the clock rate', () => {
    expect(offenders(/setRate|\.clock\s*\.\s*\w+\s*\(/)).toEqual([])
  })

  it('(d) it consumes driver OUTPUT — the frame snapshot / the event stream', () => {
    expect(allCode(), 'the pane reads nothing from the driver').toMatch(/frame\s*\(\s*\)|subscribe\s*\(/)
  })

  it('(e) it never writes into the driver frame or the fixture store', () => {
    expect(offenders(/\.\s*(store|frame)\s*(\(\s*\))?\s*\.\s*\w+\s*=[^=]/)).toEqual([])
    expect(offenders(/\.\s*(mined|slots|deployed)\s*\.\s*(push|splice|sort|shift|pop)\s*\(/)).toEqual([])
  })
})

describe('[u9d#c3] no state mutation outside its own root', () => {
  it('(a) it never queries or writes a shell surface', () => {
    expect(offenders(/#desktop|#taskbar|#w-(feed|file|store|rep|tally)|#clockUnit|#ddayUnit|#app\b/)).toEqual([])
  })

  it('(b) it never replaces document.body / document.title wholesale', () => {
    expect(offenders(/document\s*\.\s*(body|documentElement)\s*\.\s*innerHTML\s*=/)).toEqual([])
    expect(offenders(/document\s*\.\s*title\s*=/)).toEqual([])
  })

  it('(c) it never persists anything — sessionStorage writes and localStorage are both out (C4)', () => {
    expect(offenders(/\blocalStorage\b/)).toEqual([])
    expect(offenders(/sessionStorage\s*\.\s*(setItem|removeItem|clear)/)).toEqual([])
    expect(offenders(/document\.cookie|\bindexedDB\b/)).toEqual([])
  })

  it('(d) it never mutates the shell handle it reads', () => {
    expect(offenders(/window\s*\.\s*__shell\s*(\.\s*\w+)?\s*=[^=]/)).toEqual([])
  })

  it('(e) it makes no network request (the player build makes none; nor does the pane)', () => {
    expect(offenders(/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/)).toEqual([])
  })
})
