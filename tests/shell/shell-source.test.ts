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
import { dirAtUnit, fileAtUnit } from '../acceptance/unit-range.ts'

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
  // RE-AIMED (08-08), never deleted — and narrowed, not loosened.
  //
  // What this bans is a SELF-PACED timer: a view that decides for itself when
  // the desk moves. It was never the PUMP. `runPump` in `boot.ts` has always
  // fed the driver real elapsed milliseconds off a host callback; the only
  // question is which callback, and a flat ban on `setInterval` answered that
  // question by accident rather than on purpose.
  //
  // It answered it wrong. A hidden document — a background tab, a minimised
  // window, a window another app fully covers — gets NO frame callbacks at all,
  // so a rAF-only pump stopped the day dead the moment the desk was switched
  // away from, and only resumed when it was looked at again. The pump now hands
  // over to an interval while hidden and back on return. That interval computes
  // no time and paces nothing: it samples `performance.now()` and hands the
  // delta to `driver.advance()`, which is precisely what the frame callback
  // does with the timestamp it is handed. (b) below still holds the line that
  // actually matters — no `Date.now()`, no wall clock, no sim time derived in
  // a view — and it is untouched.
  //
  // So the shape is PINNED instead of the name banned: exactly one interval in
  // the whole shell, in `boot.ts`, inside `runPump`, feeding the driver. A
  // second one anywhere, or this one drifting out of the pump, still fails.
  it('(a) the shell owns no self-paced timer — its one interval is the driver pump', () => {
    const withInterval = unitSources().filter((s) => /\bsetInterval\s*\(/.test(s.text))
    expect(withInterval.map((s) => s.file)).toEqual(['src/client/shell/boot.ts'])

    const boot = withInterval[0]!.text
    expect([...boot.matchAll(/\bsetInterval\s*\(/g)], 'the shell grew a second interval').toHaveLength(1)

    const pump = /function runPump\b[\s\S]*?\n}/.exec(boot)
    expect(pump, 'runPump is gone — re-aim this guard at whatever replaced it').not.toBeNull()
    expect(pump![0], 'the interval left the pump').toMatch(/\bsetInterval\s*\(/)
    expect(pump![0], 'the pump stopped feeding the driver').toMatch(/driver\.advance\s*\(/)
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

// C17 / [u11#c12] — RE-AIMED (08-04), never deleted. "The windows are stubs"
// was true of u3 and is false of the finished desk on purpose: u4–u7 were
// commissioned to fill exactly these five modules. Measured at u3's own merge
// the claim stays permanently true, and no live coverage is lost — each window
// is bound today by its own unit's suite and by `e2e/acceptance.spec.ts`.
describe('[u3#c10] the windows are stubs in this unit (re-aimed to u3\'s own range — C17)', () => {
  /** The five window modules as u3's merge left them. */
  function u3Windows(): { file: string; text: string }[] {
    return dirAtUnit('u3', 'src/client/windows')
      .filter((f) => f.endsWith('.ts'))
      .map((f) => ({ file: f, text: fileAtUnit('u3', `src/client/windows/${f}`) }))
  }

  it('(a) no window module renders content into its host', () => {
    const windows = u3Windows()
    expect(windows.length, 'u3 landed no window module — the range is wrong').toBeGreaterThan(0)
    for (const { file, text } of windows) {
      expect(stripComments(text), `${file} must stay a stub in u3`).not.toMatch(/appendChild|append\s*\(|innerHTML/)
    }
  })

  it('(b) the window stubs stay small', () => {
    for (const { file, text } of u3Windows()) {
      expect(text.split('\n').length, `${file} is not a stub`).toBeLessThan(40)
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
