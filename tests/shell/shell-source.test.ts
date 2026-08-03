// u3 source-level guards that the browser suite cannot express.
//
// [u3#c9]  repo-root `index.html` — u3 owns the only edit after u0.
// [u3#c3]  the clock is DRIVER-fed: the shell may not own a timer or a clock.
// [u3#c10] the window bodies stay empty in this unit.
// C12/inv 8 — no color or font literal outside `styles/tokens.css`.
// C8/inv 12 — nothing outside `driver/` imports engine or composer.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
  CLIENT,
  COMPONENTS_DIR,
  INDEX_HTML,
  SHELL_DIR,
  WINDOWS_DIR,
  clientSources,
  exists,
  read,
  rel,
  specifiers,
  stripComments,
  tsFiles,
} from './shell-utils.ts'

const html = (): string => read(INDEX_HTML)

/** Every source this unit writes. */
function unitSources(): { file: string; text: string }[] {
  return [...tsFiles(SHELL_DIR), ...tsFiles(COMPONENTS_DIR), ...tsFiles(WINDOWS_DIR), path.join(CLIENT, 'main.ts')]
    .filter((f) => exists(f))
    .map((f) => ({ file: rel(f), text: stripComments(read(f)) }))
}

describe('[u3#c9] index.html carries the shell containers and nothing more', () => {
  it('(a) it still declares exactly one type="module" entry script', () => {
    const scripts = [...html().matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/g)]
    expect(scripts).toHaveLength(1)
    expect(scripts[0]![1]).toBe('/src/main.ts')
  })

  it('(b) it hosts the desktop dressing and the u8 overlay hosts', () => {
    const doc = html()
    for (const id of ['wallpaper', 'threads', 'grain', 'vignette', 'sweep', 'toast']) {
      expect(doc, `index.html is missing #${id}`).toMatch(new RegExp(`id=["']${id}["']`))
    }
  })

  it('(c) it hard-positions nothing — no inline --x/--y/--w/--h geometry', () => {
    expect(html()).not.toMatch(/style=["'][^"']*--[xywh]\s*:/)
    expect(html()).not.toMatch(/style=["'][^"']*(?:^|;)\s*(?:top|left)\s*:/)
  })

  it('(d) it pulls no third-party origin (inv 10 — fonts are self-hosted)', () => {
    const doc = html()
    expect(doc).not.toMatch(/https?:\/\/fonts\.(googleapis|gstatic)\.com/)
    expect(doc).not.toMatch(/<link\b[^>]*href=["']https?:\/\//)
  })

  it('(e) it inlines no script and no style block', () => {
    expect(html()).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/)
    expect(html()).not.toMatch(/<style\b/)
  })
})

describe('[u3#c3] the clock is driver-fed', () => {
  it('(a) the shell owns no view-local timer', () => {
    const offenders = unitSources()
      .filter((s) => /\bsetInterval\s*\(/.test(s.text))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })

  it('(b) the shell never derives sim time from the wall clock', () => {
    const offenders = unitSources()
      .filter((s) => /\bnew Date\s*\(|\bDate\.now\s*\(/.test(s.text))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })

  it('(c) the shell never builds its own clock — it reads the driver`s', () => {
    const offenders = unitSources()
      .filter((s) => /\bcreateClock\s*\(/.test(s.text))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })

  it('(d) the shell subscribes to the driver seam', () => {
    const text = unitSources().map((s) => s.text).join('\n')
    expect(text.length, 'the shell owns no source yet').toBeGreaterThan(0)
    expect(text).toMatch(/subscribe\s*\(/)
  })
})

describe('[u3#c10] the windows are stubs in this unit', () => {
  it('(a) no window module renders content into its host', () => {
    for (const f of tsFiles(WINDOWS_DIR)) {
      const text = stripComments(read(f))
      expect(text, `${rel(f)} must stay a stub in u3`).not.toMatch(/appendChild|append\s*\(|innerHTML/)
    }
  })

  it('(b) the window stubs stay small', () => {
    for (const f of tsFiles(WINDOWS_DIR)) {
      expect(read(f).split('\n').length, `${rel(f)} is not a stub`).toBeLessThan(40)
    }
  })
})

describe('[C8/inv 12] the seam holds', () => {
  it('(a) nothing outside driver/ imports engine or composer', () => {
    const offenders = clientSources()
      .filter((f) => !f.startsWith(path.join(CLIENT, 'driver')))
      .filter((f) => specifiers(read(f)).some((s) => /(^|\/)(engine|composer)(\/|$)/.test(s)))
      .map(rel)
    expect(offenders).toEqual([])
  })

  it('(b) the shell reaches the seam through the driver barrel, not into it', () => {
    const offenders = unitSources()
      .flatMap((s) => specifiers(s.text).map((spec) => ({ file: s.file, spec })))
      .filter(({ spec }) => /driver\/(?!index\.ts$)[\w-]+/.test(spec))
      .map(({ file, spec }) => `${file} → ${spec}`)
    expect(offenders).toEqual([])
  })
})

describe('[C12/inv 8] style-as-data', () => {
  it('(a) no color literal in the shell`s TypeScript', () => {
    const offenders = unitSources()
      .filter((s) => /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\s*\(/.test(s.text))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })

  it('(b) no font literal in the shell`s TypeScript', () => {
    const offenders = unitSources()
      .filter((s) => /font-family|fontFamily/.test(s.text))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })

  it('(c) the shell writes geometry as custom properties only', () => {
    const offenders = unitSources()
      .filter((s) => /\.style\.(top|left|width|height)\s*=/.test(s.text))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })
})
