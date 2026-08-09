// [x3] the onboarding walk — structural, not behavioural.
//
// The behaviour is proved in `e2e/tutorial.spec.ts`, in a browser, where a plate
// is a thing you can read. What is proved HERE is the set of properties that
// make the walk safe to have in the tree this close to the deadline.
//
// RE-AIMED (08-09), never deleted. This suite was written against a walk whose
// mark was ONE CLASS — `is-lit`, a pulsing red ring on whatever the step pointed
// at — and its central claim was that the walk "can only watch": it mounted no
// DOM at all, and its only import was a type. That walk was silent, and silence
// is what it was replaced for. A window glowing red tells a first-time operator
// that something is WRONG; it does not tell them to turn the page, and the desk
// has about sixty seconds to teach three windows, a page turn, a commit and a
// mine. Only copy carries that, and printed copy needs a plate. A plate is DOM.
//
// So exactly one clause of the old contract is spent, and it is named as spent
// below rather than quietly dropped: the walk mounts DOM. Everything else in it
// was load-bearing and is held here, widened to cover `shell/coach.ts` — the
// layer is new surface that did not exist when these guards were written, and a
// guard that still only reads `tutorial.ts` would be watching the half of the
// walk that cannot do any damage.
//
// Three claims are NOT restated here because another suite already owns them,
// and duplicating a guard is how two guards drift apart:
//
//   the membrane      `tests/shell/no-free-text.test.ts` scans every file under
//                     `shell/`, so the plate's "two buttons and static text" is
//                     already pinned there — no `<input>`, nothing
//                     contenteditable, no `designMode`.
//   geometry-as-data  `tests/shell/shell-source.test.ts [C12/inv 8] (c)` bans
//                     `.style.top|left|width|height =` across `shell/`, which is
//                     what forces the plate's box through `--coach-x`/`--coach-y`.
//                     (a) and (b) there ban colour and font literals in the same
//                     scope.
//   no self-paced timer
//                     `[u3#c3] (a)` there pins the shell's ONE `setInterval` to
//                     the driver pump in `boot.ts`, so the layer's
//                     rAF/observer-driven measure pass cannot become a timer.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { CLIENT, SHELL_DIR, exists, read, rel, tsFiles, walk } from './shell-utils.ts'

const TUTORIAL_TS = path.join(SHELL_DIR, 'tutorial.ts')
const COACH_TS = path.join(SHELL_DIR, 'coach.ts')
const COACH_CSS = path.join(CLIENT, 'styles/coach.css')
const INDEX_CSS = path.join(CLIENT, 'styles/index.css')
const BOOT_TS = path.join(SHELL_DIR, 'boot.ts')

/** The walk is TWO modules now — the script and the layer it drives. */
const WALK = [TUTORIAL_TS, COACH_TS] as const

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

/** A stylesheet with its comments taken out — same reason as `code`. */
function css(p: string): string {
  return read(p).replace(/\/\*[\s\S]*?\*\//g, ' ')
}

/** Every `import` line in a source, comments included (they cannot contain one). */
function importLines(p: string): string[] {
  return [...read(p).matchAll(/^import\s+(?:type\s+)?[^\n]*$/gm)].map((m) => m[0])
}

/** The `'…'` specifier of every import that pulls a RUNTIME value, not a type. */
function runtimeSpecifiers(p: string): string[] {
  return importLines(p)
    .filter((line) => !/^import\s+type\b/.test(line))
    .flatMap((line) => [...line.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!))
}

/** The `z-index` a stylesheet gives a selector, as a number. */
function zIndexOf(sheet: string, selector: string): number {
  // Escaped, so a class selector's leading `.` is a dot and not "any char" —
  // otherwise `.skip-link` would also match `askip-link`.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rule = new RegExp(`${escaped}\\s*\\{[^}]*?z-index\\s*:\\s*(\\d+)`).exec(css(sheet))
  expect(rule, `${selector} declares no z-index in ${rel(sheet)}`).not.toBeNull()
  return Number(rule![1])
}

describe('[x3] the walk exists and is wired exactly once', () => {
  it('(a) both halves of it exist — the script and the layer', () => {
    expect(exists(TUTORIAL_TS)).toBe(true)
    expect(exists(COACH_TS)).toBe(true)
  })

  it('(b) exactly one module imports the walk, and it is the shell boot', () => {
    const importers = clientFiles()
      .filter(({ src }) => /from\s+'\.{1,2}\/(shell\/)?tutorial\.ts'/.test(src))
      .map(({ file }) => file)
    expect(importers).toEqual([rel(BOOT_TS)])
  })

  it('(c) exactly one module imports the LAYER, and it is the walk', () => {
    // New with the rewrite. The coach is a general-purpose overlay — a plate
    // beside an arbitrary selector — and that makes it exactly the sort of thing
    // a later unit would reach for to explain something else on the desk. It is
    // not a shared facility: it dims the desk, it takes focus, and it assumes one
    // plate at a time, so a second caller would be two walks over one operator.
    // If a second surface ever genuinely needs it, that is a design decision, and
    // this line is where it gets made rather than discovered.
    const importers = clientFiles()
      .filter(({ src }) => /from\s+'\.{1,2}\/(shell\/)?coach\.ts'/.test(src))
      .map(({ file }) => file)
    expect(importers).toEqual([rel(TUTORIAL_TS)])
  })

  it('(d) the boot mounts it, and does not await it', () => {
    const src = code(BOOT_TS)
    expect(src, 'boot.ts never calls installTutorial').toMatch(/installTutorial\s*\(/)
    // The walk outlives boot by minutes. An `await` here would hold the desk.
    expect(src).not.toMatch(/await\s+installTutorial/)
    expect(src).not.toMatch(/await\s+runTutorial/)
  })
})

describe('[x3] the walk can only watch — the clause the rewrite did not spend', () => {
  it('(a) it sends no membrane op', () => {
    for (const file of WALK) {
      const src = code(file)
      expect(src, `${rel(file)} reaches the op channel`).not.toMatch(/\.send\s*\(/)
      // The five op literals, by name. A walk that mints one is not an observer.
      for (const op of ['slot', 'unslot', 'deploy', 'mine', 'new_run']) {
        expect(src, `${rel(file)} mints the '${op}' op`).not.toMatch(new RegExp(`op\\s*:\\s*'${op}'`))
      }
    }
  })

  it('(b) it drives no clock and opens no run', () => {
    for (const file of WALK) {
      const src = code(file)
      expect(src, `${rel(file)} sets the clock rate`).not.toMatch(/setRate\s*\(/)
      expect(src, `${rel(file)} drives the driver`).not.toMatch(/\bdriver\.(start|advance|drain)\s*\(/)
    }
  })

  it('(c) it imports no component and no window module', () => {
    // Still true and still doing real work. It is the reason the walk gates its
    // ninth plate on `#w-file .slot.filled` read off the DOM rather than
    // importing `components/slot-board.ts` to ask the same question: the walk
    // watches the desk, it does not consult it.
    for (const file of WALK) {
      const src = read(file)
      expect(src, `${rel(file)} imports a component`).not.toMatch(/from\s+'\.\.\/components\//)
      expect(src, `${rel(file)} imports a window`).not.toMatch(/from\s+'\.\.\/windows\//)
    }
  })

  it('(d) its runtime imports are shell-local and enumerated', () => {
    // REPLACES the old '(e) its only import is a TYPE'. That guard's premise is
    // spent — the script imports `createCoach` and `must`, and the layer imports
    // the DOM helpers — but the risk it was really covering is untouched: the
    // walk must never be the route by which the desk grows a dependency. So the
    // allowed set is spelled out instead of the count being pinned at zero, and
    // a new runtime import is a line changed here on purpose rather than a thing
    // that happened.
    const allowed = ['./coach.ts', './dom.ts']
    for (const file of WALK) {
      const specs = runtimeSpecifiers(file)
      expect(specs.sort(), `${rel(file)} pulls an unlisted runtime value into the bundle`).toEqual(
        specs.filter((s) => allowed.includes(s)).sort(),
      )
    }
    // …and the scan is not vacuous: the script really does import the layer.
    expect(runtimeSpecifiers(TUTORIAL_TS)).toContain('./coach.ts')
  })

  it('(e) it derives no sim time and reads no wall clock', () => {
    // The old walk was a stopwatch — an eight-second hold on the file, a
    // two-second pause after the turn, a ten-second ceiling on 해제 — and the new
    // one is driven entirely by what the operator does and what the §5.2 stream
    // says. `[u3#c3] (b)` bans `Date`/`Date.now` across the shell already; what
    // is banned HERE is the shape that made the old walk a stopwatch at all, so
    // a re-added `sleep()` cannot quietly put a plate back on a timer.
    for (const file of WALK) {
      const src = code(file)
      expect(src, `${rel(file)} paces a plate with a timer`).not.toMatch(/setTimeout\s*\(/)
    }
  })
})

describe('[x3] the mark cannot come between the operator and the desk', () => {
  it('(a) the layer takes no pointer events — only the plate takes them back', () => {
    // THE load-bearing safety property of the whole rewrite, and the one the old
    // design got for free by not existing. Most plates come down when the
    // operator presses the very thing the mark points at — the page control, the
    // sentence, DEPLOY — so a scrim that swallowed that press would deadlock the
    // walk it is running. The browser proves the press lands
    // (`e2e/tutorial.spec.ts`); this proves the declaration it depends on.
    const sheet = css(COACH_CSS)
    expect(sheet, '#coach does not disclaim pointer events').toMatch(
      /#coach\s*\{[^}]*pointer-events\s*:\s*none/,
    )
    expect(sheet, 'the scrim/leader SVG does not disclaim pointer events').toMatch(
      /\.coach-cut\s*\{[^}]*pointer-events\s*:\s*none/,
    )
    // Exactly one selector takes them back, and it is the plate. A second one
    // would be a second thing on this layer that can eat a click.
    const takers = [...sheet.matchAll(/([^{}]+)\{[^}]*pointer-events\s*:\s*auto/g)].map((m) =>
      m[1]!.trim().split(/\s+/).pop(),
    )
    expect(takers).toEqual(['.coach-plate'])
  })

  it('(b) nothing pulses', () => {
    // A decision, not an omission — 민서 declined the pulsing ring outright. A
    // throbbing red outline reads as an ALARM on a desk where red means 관인, and
    // the mark's job is to point, not to alert.
    //
    // It is also a boot hazard, which is why the guard is here and not only in
    // review: `revealDesk` awaits the animations on the desk it uncovers, and an
    // infinite one never settles. That is the exact regression
    // `e2e/tutorial.spec.ts`'s 'the desk is uncovered BEFORE the first plate'
    // was written for — the old ring's 1.6 s pulse held the desk at
    // `visibility:hidden` for the whole of step 1.
    const sheet = css(COACH_CSS)
    expect(sheet, 'coach.css declares an endless animation').not.toMatch(
      /animation[^;}]*\binfinite\b/,
    )
    expect(sheet).not.toMatch(/animation-iteration-count\s*:\s*infinite/)
  })

  it('(c) the mark is never the thing on top of an irreversible question', () => {
    // `coach.css`'s header claims a place on the desk's z-ladder. That claim is
    // about OTHER sheets, so it is the kind of comment that goes stale silently
    // — and the way it goes stale is a coach plate landing on top of the 배치
    // 확인 question, which is the one press on this desk that cannot be undone.
    const coach = zIndexOf(COACH_CSS, '#coach')
    const shell = path.join(CLIENT, 'styles/shell.css')
    // Under the mark: the furniture it explains.
    for (const [sheet, selector] of [
      [shell, '#topbar'],
      [shell, '#threads'],
      [path.join(CLIENT, 'styles/win-manual.css'), '#manual'],
    ] as const) {
      expect(coach, `#coach is not above ${selector}`).toBeGreaterThan(zIndexOf(sheet, selector))
    }
    // Over the mark: the door, the film, and above all the question.
    for (const [sheet, selector] of [
      [path.join(CLIENT, 'styles/signin.css'), '#signin'],
      [shell, '#grain'],
      [path.join(CLIENT, 'styles/confirm.css'), '#confirm'],
    ] as const) {
      expect(coach, `#coach is not below ${selector}`).toBeLessThan(zIndexOf(sheet, selector))
    }
    // The TOAST is above the mark and that is harmless, because x6b took its
    // visible panel away: what is left at 950 is a 1×1 live region. Asserted, so
    // that if a visible toast ever comes back it lands here as a failure and not
    // as a plate with an announcement across it — which is exactly what happened
    // while the panel still existed (it is centred at 50%/50%, and plate 1 sits
    // beside the AGENT FILE's head line, which on a wide desk is mid-screen).
    const toast = /#toast\s*\{[^}]*\}/.exec(css(shell))?.[0] ?? ''
    expect(toast, '#toast has no rule to read').not.toBe('')
    expect(toast, 'the toast is painted again — re-check it against the coach plate').toMatch(
      /width\s*:\s*1px/,
    )
    // A window rides `--z`, which the manager assigns from a base far below all
    // of these, so it is asserted by shape rather than by number.
    expect(css(shell)).toMatch(/\.win\s*\{[^}]*z-index\s*:\s*var\(--z\)/)
  })
})

describe('[x3] the sheet that paints the mark is loaded, and the ring is gone', () => {
  it('(a) coach.css exists and index.css imports it', () => {
    expect(exists(COACH_CSS)).toBe(true)
    expect(read(INDEX_CSS)).toMatch(/@import\s+'\.\/coach\.css'/)
  })

  it('(b) tutorial.css is gone, and nothing still imports it', () => {
    expect(exists(path.join(CLIENT, 'styles/tutorial.css'))).toBe(false)
    // Comments stripped before the scan, and the distinction is not pedantry:
    // `index.css` NAMES the deleted sheet in the note above the new `@import`,
    // to say what this sheet replaced and why it is still ordered last. That
    // sentence is the record of the change and must survive the guard that
    // proves the change happened.
    expect(css(INDEX_CSS)).not.toMatch(/@import[^;]*tutorial\.css/)
  })

  it('(c) no stylesheet claims `.is-lit`, and no client source applies it', () => {
    // KEPT from the old suite, where it proved that ONE sheet owned the mark.
    // With that sheet deleted it proves something better and stricter: the ring
    // is not painted anywhere at all. `coach.css` discusses `is-lit` by name in
    // its own prose — deliberately without the leading dot, so this guard can go
    // on reading a selector rather than a mention.
    expect(tsFiles(path.join(CLIENT, 'styles'))).toEqual([])
    const sheets = walk(path.join(CLIENT, 'styles'))
      .filter((p) => p.endsWith('.css') && /\.is-lit\b/.test(css(p)))
      .map((p) => rel(p))
    expect(sheets).toEqual([])
    // …and nothing in the client puts the class on an element any more.
    const appliers = clientFiles()
      .filter(({ src }) => /is-lit/.test(src))
      .map(({ file }) => file)
    expect(appliers).toEqual([])
  })
})
