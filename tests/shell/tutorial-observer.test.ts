// [x3] the onboarding walk is an OBSERVER — structural, not behavioural.
//
// The behaviour is proved in `e2e/tutorial.spec.ts`, in a browser, where a mark
// is a thing you can see. What is proved HERE is the property that makes the
// walk safe to have shipped this close to the deadline: it can only watch.
//
// It is the same contract `audio/index.ts` holds (plan-audio §2) and it is
// worth the same guard. A walk that could send an op would be a second hand on
// the membrane; a walk that anything imported would be a dependency the desk
// carries whether or not it runs. Neither is true, and neither may become true
// by accident — every claim below is a source scan, so it stays true for the
// reader as well as for the runtime.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { CLIENT, SHELL_DIR, exists, read, rel, tsFiles, walk } from './shell-utils.ts'

const TUTORIAL_TS = path.join(SHELL_DIR, 'tutorial.ts')
const BOOT_TS = path.join(SHELL_DIR, 'boot.ts')

/** Every client `.ts`, source text and repo-relative path. */
function clientFiles(): { file: string; src: string }[] {
  return walk(CLIENT)
    .filter((p) => p.endsWith('.ts'))
    .map((p) => ({ file: rel(p), src: read(p) }))
}

/** Comments stripped, so a rule fires on code and never on the note above it. */
function code(p: string): string {
  return read(p)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

describe('[x3] the walk exists and is wired exactly once', () => {
  it('(a) src/client/shell/tutorial.ts exists', () => {
    expect(exists(TUTORIAL_TS)).toBe(true)
  })

  it('(b) exactly one module imports it, and it is the shell boot', () => {
    const importers = clientFiles()
      .filter(({ src }) => /from\s+'\.{1,2}\/(shell\/)?tutorial\.ts'/.test(src))
      .map(({ file }) => file)
    expect(importers).toEqual([rel(BOOT_TS)])
  })

  it('(c) the boot mounts it, and does not await it', () => {
    const src = code(BOOT_TS)
    expect(src, 'boot.ts never calls installTutorial').toMatch(/installTutorial\s*\(/)
    // The walk outlives boot by minutes. An `await` here would hold the desk.
    expect(src).not.toMatch(/await\s+installTutorial/)
    expect(src).not.toMatch(/await\s+runTutorial/)
  })
})

describe('[x3] the walk can only watch', () => {
  it('(a) it sends no membrane op', () => {
    const src = code(TUTORIAL_TS)
    expect(src, 'the walk reaches the op channel').not.toMatch(/\.send\s*\(/)
    // The five op literals, by name. A walk that mints one is not an observer.
    for (const op of ['slot', 'unslot', 'deploy', 'mine', 'new_run']) {
      expect(src, `the walk mints the '${op}' op`).not.toMatch(new RegExp(`op\\s*:\\s*'${op}'`))
    }
  })

  it('(b) it drives no clock and opens no run', () => {
    const src = code(TUTORIAL_TS)
    expect(src).not.toMatch(/setRate\s*\(/)
    expect(src).not.toMatch(/\bdriver\.(start|advance|drain)\s*\(/)
  })

  it('(c) it mounts nothing — no element is created and none is removed', () => {
    const src = code(TUTORIAL_TS)
    expect(src, 'the walk builds DOM of its own').not.toMatch(/createElement\s*\(/)
    expect(src).not.toMatch(/\.append(Child)?\s*\(/)
    expect(src).not.toMatch(/\.remove\s*\(\s*\)/)
    expect(src).not.toMatch(/innerHTML|textContent\s*=/)
  })

  it('(d) it imports no component and no window module', () => {
    const src = read(TUTORIAL_TS)
    expect(src).not.toMatch(/from\s+'\.\.\/components\//)
    expect(src).not.toMatch(/from\s+'\.\.\/windows\//)
  })

  it('(e) its only import is a TYPE — it pulls in no runtime value at all', () => {
    const imports = [...read(TUTORIAL_TS).matchAll(/^import\s+(type\s+)?[^\n]*$/gm)].map((m) => m[0])
    expect(imports.length, 'the walk imports nothing at all — the scan is vacuous').toBeGreaterThan(0)
    const runtime = imports.filter((line) => !/^import\s+type\b/.test(line))
    expect(runtime, 'the walk pulls a runtime value into the bundle').toEqual([])
  })
})

describe('[x3] the mark is a class, and the sheet that paints it is loaded', () => {
  it('(a) tutorial.css exists and index.css imports it', () => {
    const sheet = path.join(CLIENT, 'styles/tutorial.css')
    expect(exists(sheet)).toBe(true)
    expect(read(path.join(CLIENT, 'styles/index.css'))).toMatch(/@import\s+'\.\/tutorial\.css'/)
  })

  it('(b) the sheet paints no layout property — a mark must not move the desk', () => {
    // `outline` and `box-shadow` are outside the box model on purpose: a
    // sentence marked mid-paragraph must not re-wrap the paragraph, and a
    // marked window must not move on the desk.
    const css = read(path.join(CLIENT, 'styles/tutorial.css')).replace(/\/\*[\s\S]*?\*\//g, ' ')
    for (const prop of ['width', 'height', 'margin', 'padding', 'border', 'top', 'left', 'position', 'display']) {
      expect(css, `tutorial.css sets ${prop}, which moves what it marks`).not.toMatch(
        new RegExp(`(^|[;{\\s])${prop}\\s*:`, 'm'),
      )
    }
  })

  it('(c) no other stylesheet claims `.is-lit`', () => {
    const others = tsFiles(path.join(CLIENT, 'styles'))
    expect(others).toEqual([])
    const sheets = walk(path.join(CLIENT, 'styles'))
      .filter((p) => p.endsWith('.css') && !p.endsWith('tutorial.css'))
      .filter((p) => /\.is-lit\b/.test(read(p)))
      .map((p) => rel(p))
    expect(sheets).toEqual([])
  })
})
