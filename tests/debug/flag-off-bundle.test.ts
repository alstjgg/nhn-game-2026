// [u9d#c2] spec-client §3 invariant 11 + §7 item 12 — the FLAG-OFF (player)
// build contains NONE of the pane's code.
//
// The check is a real one: this suite runs `vite build --mode production` into
// `dist-flag-off/` and greps every emitted asset for the pane's module
// markers. A source-level guard alone would not prove exclusion — only the
// bundler's output does. The source guard is here too, because it is what makes
// the exclusion possible: a static `__DEBUG_PANE__` guard around a DYNAMIC
// import is the only shape the bundler can drop whole.
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  DEBUG_DIR,
  ENTRY_EXPORT,
  FLAG,
  MAIN_TS,
  PANE_ID,
  PANE_MARKER,
  REPO,
  debugSources,
  nonDebugClientSources,
  read,
  rel,
  specifiers,
  stringLiterals,
  stripComments,
  targetOf,
  tsFiles,
  walk,
} from './debug-utils.ts'

// C17 / [u11#c12] — RE-AIMED (08-04), never deleted: the OUT DIR moved out of
// `dist/`. Nested inside it, this hermetic check build (a) was greped by
// u10's inv-10 dist walk as if it were the artefact, (b) raced that suite's
// own `rm -rf dist` + rebuild inside one `vitest run`, and (c) left `dist/`
// without an `index.html` for the next `vite preview` — u4s finding 19,
// which the C5 preview host turned from a nuisance into a gate failure.
// The claim under test is unchanged; only where it builds is.
const OUT_REL = 'dist-flag-off'
const OUT_ABS = path.join(REPO, OUT_REL)
const VITE_BIN = path.join(REPO, 'node_modules/vite/bin/vite.js')

interface Asset {
  readonly file: string
  readonly text: string
}

let assets: Asset[] = []
let buildError: string | null = null

beforeAll(() => {
  try {
    execFileSync(
      process.execPath,
      [VITE_BIN, 'build', '--mode', 'production', '--outDir', OUT_REL, '--emptyOutDir', '--logLevel', 'error'],
      // NODE_ENV first, `--mode` second: vitest's own `NODE_ENV=test` would
      // otherwise leave `import.meta.env.DEV` true and this would not be the
      // PLAYER build whose emptiness inv 11 is about.
      { cwd: REPO, stdio: 'pipe', encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production' } },
    )
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string; message?: string }
    buildError = `${err.message ?? ''}\n${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim()
    return
  }
  assets = walk(OUT_ABS)
    .filter((f) => /\.(js|mjs|css|html|map)$/.test(f))
    .map((f) => ({ file: path.relative(OUT_ABS, f).split(path.sep).join('/'), text: fs.readFileSync(f, 'utf8') }))
}, 600_000)

/** Common DOM/CSS vocabulary a literal scan must not trip over. */
const COMMON = new Set([
  'beforeend',
  'afterbegin',
  'textContent',
  'className',
  'undefined',
  'readonly',
  'disabled',
  'position',
  'absolute',
  'relative',
  'hidden',
  'display',
  'DOMContentLoaded',
  'click',
  'keydown',
  'button',
  'section',
  'header',
  'table',
  'thead',
  'tbody',
  'string',
  'number',
  'object',
  'boolean',
  'function',
  'aria-hidden',
  'aria-label',
  'application/json',
])

describe('[u9d#c2] the production build succeeds', () => {
  it('(a) `vite build --mode production` is green', () => {
    expect(buildError, `the flag-off build failed:\n${buildError}`).toBeNull()
  })

  it('(b) it emitted assets the grep can actually read (non-vacuity)', () => {
    expect(assets.length, 'no assets emitted').toBeGreaterThan(0)
    const all = assets.map((a) => a.text).join('\n')
    expect(all.length).toBeGreaterThan(1000)
    expect(all, 'the bundle does not even contain the shell — the grep is reading the wrong thing').toMatch(
      /desktop|taskbar|portalName/,
    )
  })
})

describe('[u9d#c2] no pane code reaches the flag-off bundle', () => {
  it('(a) the markers exist in source at all (non-vacuity)', () => {
    const src = debugSources().map((s) => s.text).join('\n')
    expect(tsFiles(DEBUG_DIR).length, 'the debug pane owns no source yet').toBeGreaterThan(0)
    expect(src, `the pane never names its marker '${PANE_MARKER}'`).toContain(PANE_MARKER)
    expect(src, `the pane never names its root id '${PANE_ID}'`).toContain(PANE_ID)
    expect(src, `the pane does not export ${ENTRY_EXPORT}`).toMatch(
      new RegExp(`export\\s+(?:async\\s+)?(?:function|const)\\s+${ENTRY_EXPORT}\\b|export\\s*\\{[^}]*\\b${ENTRY_EXPORT}\\b`),
    )
  })

  it('(b) no emitted asset is named after the pane', () => {
    expect(assets.filter((a) => /debug/i.test(a.file)).map((a) => a.file)).toEqual([])
  })

  for (const marker of [PANE_MARKER, PANE_ID, ENTRY_EXPORT]) {
    it(`(c:${marker}) no emitted asset contains '${marker}'`, () => {
      expect(assets.filter((a) => a.text.includes(marker)).map((a) => a.file)).toEqual([])
    })
  }

  it('(d) none of the pane\'s own distinctive string literals survive', () => {
    const mine = new Set(
      debugSources()
        .flatMap((s) => stringLiterals(s.text))
        .filter((s) => s.length >= 8 && !COMMON.has(s) && !s.startsWith('.') && !s.includes('${')),
    )
    const leaked: string[] = []
    for (const lit of mine) for (const a of assets) if (a.text.includes(lit)) leaked.push(`${a.file}: ${lit}`)
    expect(leaked).toEqual([])
  })

  it('(e) the flag itself is folded away — no `__DEBUG_PANE__` survives in the bundle', () => {
    expect(assets.filter((a) => a.text.includes(FLAG)).map((a) => a.file)).toEqual([])
  })
})

describe('[u9d#c2] the reference guard that makes exclusion possible', () => {
  const debugTargets = (file: string, text: string): string[] =>
    specifiers(text)
      .map((s) => ({ s, t: targetOf(file, s) }))
      .filter((e) => e.t !== null && e.t.startsWith('src/client/debug'))
      .map((e) => e.s)

  it('(a) main.ts is the single client module that references the pane', () => {
    const offenders = nonDebugClientSources()
      .filter((s) => s.file !== rel(MAIN_TS))
      .filter((s) => debugTargets(s.file, s.text).length > 0)
      .map((s) => s.file)
    expect(offenders, 'only src/client/main.ts may reach the debug pane').toEqual([])
  })

  it('(b) main.ts reaches it by DYNAMIC import only — never a static one', () => {
    const text = stripComments(read(MAIN_TS))
    expect(text, 'main.ts does not reference the debug pane at all').toMatch(/debug\//)
    const statics = [
      ...text.matchAll(/(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g),
      ...text.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g),
    ].map((m) => m[1]!)
    expect(statics.filter((s) => s.includes('debug/')), 'a static import pins the pane into the bundle').toEqual([])
    expect(text).toMatch(/import\(\s*['"][^'"]*debug\/[^'"]*['"]\s*\)/)
  })

  it('(c) the dynamic import sits behind a static `__DEBUG_PANE__` guard', () => {
    const text = stripComments(read(MAIN_TS))
    expect(text, `main.ts never tests ${FLAG}`).toContain(FLAG)
    const guard = new RegExp(`if\\s*\\(\\s*${FLAG}\\s*\\)[\\s\\S]{0,200}?import\\(`)
    expect(text, 'the dynamic import is not wrapped in a foldable if (__DEBUG_PANE__) guard').toMatch(guard)
  })

  it('(d) index.html loads no debug entry of its own', () => {
    expect(read(path.join(REPO, 'index.html'))).not.toMatch(/debug/i)
  })

  it('(e) nothing outside src/client/debug re-exports the pane', () => {
    const offenders = nonDebugClientSources()
      .filter((s) => /export[\s\S]{0,120}from\s*['"][^'"]*debug\//.test(stripComments(s.text)))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })
})
