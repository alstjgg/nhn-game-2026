// [x10] the onboarding briefing — `shell/manual.ts` + `styles/win-manual.css`.
//
// The module had NO suite of its own before this one: a grep for `manual.ts`
// found exactly one mention in the whole of `tests/`, and it was
// `tutorial-observer.test.ts` reading `#manual`'s z-index out of the stylesheet.
// Everything the briefing says to a judge in the first ten seconds of the game
// was therefore unpinned, which is how x10 found it — three plates whose module
// header argued at length for a walk the copy had already outgrown.
//
// The split is the one `ending.test.ts` and `sign-in.test.ts` both make: what a
// node-env run can PROVE, and what only a browser can. The plate, the veil, the
// page-turn, the focus that rides the button across the walk and the actual
// wrapping of Korean at 468px are DOM, and belong in `e2e/`. What is proved here
// is the half that decides whether the briefing is CORRECT:
//
//  1. **The copy.** It is the deliverable — the first prose a judge reads, and a
//     typo in it is not recoverable by the time anyone notices. Pinned verbatim,
//     exactly as `ending.test.ts` pins both endings.
//  2. **THE ARITHMETIC INSIDE THE COPY.** `최대 3번까지` is not a string, it is
//     `DEFAULT_TOTAL_RUNS - 1` written out in Korean: run 1 is the baseline that
//     replays the real incident, so 4 runs is 3 re-runs. `shell/manual.ts` is a
//     copy deck and deliberately does not import the constant to derive the digit
//     (a sentence assembled at runtime is a sentence its owner cannot edit), so
//     this suite is the binding. Move the allotment and this fails, which is the
//     entire point of it existing.
//  3. **That the walk still counts itself.** The `n / 2` in the head and the two
//     button labels are derived from `MANUAL_STEPS.length`. Cutting a plate must
//     re-count the walk with no other edit; a literal would silently lie.
//  4. **That the dropped plate stays dropped.** x5c's middle plate said the first
//     simulation replays the real incident and the operator should watch it.
//     Removing it was 민서's instruction (08-10) and the reason is that the first
//     run demonstrates it by being it. Copy that drifts back is the likeliest way
//     for that decision to be undone by someone who never heard it.
//  5. **The type and the geometry, as far as text on disk can carry them.** The
//     foot being shorter than the head is arithmetic over tokens, so it is
//     checkable here and pinned here. So is the ×1.2 step, the shared face, and
//     that neither leaks past `.man-plate`.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { SHELL_DIR, read, stripComments } from './shell-utils.ts'
import { ruleBodies, rootProps } from '../styles/css-utils.ts'
import { MANUAL_NEXT, MANUAL_START, MANUAL_STEPS } from '../../src/client/shell/manual.ts'
import { DEFAULT_TOTAL_RUNS } from '../../src/runloop/run-loop.ts'

const MANUAL_TS = path.join(SHELL_DIR, 'manual.ts')
const STYLES = path.join(SHELL_DIR, '../styles')
const CONFIRM_CSS = path.join(STYLES, 'confirm.css')
const WIN_MANUAL_CSS = path.join(STYLES, 'win-manual.css')
const WIN_ENDING_CSS = path.join(STYLES, 'win-ending.css')
const TOKENS_CSS = path.join(STYLES, 'tokens.css')

/** `--space-6` → 6. Reads the scale rather than restating it. */
function token(name: string): number {
  const raw = rootProps(read(TOKENS_CSS)).get(name)
  expect(raw, `tokens.css declares no ${name}`).toBeDefined()
  return Number.parseFloat(raw!)
}

/** The last declaration of `prop` in the rule whose selector is exactly `selector`. */
function decl(cssPath: string, selector: string, prop: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const bodies = ruleBodies(read(cssPath), new RegExp(`^${escaped}$`))
  expect(bodies.length, `${path.basename(cssPath)} has no rule for '${selector}'`).toBeGreaterThan(0)
  const hits = [...bodies.join(';').matchAll(new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, 'g'))]
  expect(hits.length, `'${selector}' declares no ${prop}`).toBeGreaterThan(0)
  return hits[hits.length - 1]![1]!.trim()
}

/** A length in px, whether it is written `24px` or `var(--space-6)`. */
function px(value: string): number {
  const v = value.trim()
  const asVar = /^var\(\s*(--[\w-]+)\s*\)$/.exec(v)
  if (asVar) return token(asVar[1]!)
  return Number.parseFloat(v)
}

/** A `padding` shorthand as [top, right, bottom, left], in px. */
function box(shorthand: string): [number, number, number, number] {
  const p = shorthand.trim().split(/\s+(?![^(]*\))/).map(px)
  const [a, b, c, d] = [p[0]!, p[1] ?? p[0]!, p[2] ?? p[0]!, p[3] ?? p[1] ?? p[0]!]
  return [a, b, c, d]
}

describe('[x10] the briefing is two plates', () => {
  it('(a) there are exactly two, and the count is nowhere written down', () => {
    expect(MANUAL_STEPS).toHaveLength(2)
    // The counter, the button labels and `data-step` all ride
    // `MANUAL_STEPS.length`. A literal `/ 2` (or a surviving `/ 3`) would be a
    // head that disagrees with the array under it.
    const src = stripComments(read(MANUAL_TS))
    expect(src).toMatch(/MANUAL_STEPS\.length/)
    expect(src).not.toMatch(/['"`]\s*\/\s*[23]/)
  })

  it('(b) step 1 is the appointment, verbatim', () => {
    expect(MANUAL_STEPS[0]).toEqual({
      head: '신규 운영자 안내',
      lead: '긴급상황대응실 운영자 임용을 축하합니다.',
      body: [
        '긴급상황 발생 시 본부는 현장 요원을 파견합니다.',
        '운영자는 직접 출동하지 않으며, 대응실에서 현장 요원의 교신을 받습니다.',
      ],
    })
  })

  it('(c) step 2 is the drill, verbatim', () => {
    expect(MANUAL_STEPS[1]).toEqual({
      head: '모의 과정 안내',
      lead: '실제 상황 투입에 앞서 모의 과정을 실시합니다.',
      body: [
        '본 단말은 귀하의 상황 대응 능력을 시험하고 개선하기 위한 모의 장치이며, 실제 회선과 연결되어 있지 않습니다.',
        '최대 3번까지 시뮬레이션을 재시행할 수 있습니다.',
        '최대한 많은 생환자를 확보하십시오.',
      ],
    })
  })

  it('(d) the two labels are both reachable — one 다음, then 시뮬레이션 시작', () => {
    expect(MANUAL_NEXT).toBe('다음')
    expect(MANUAL_START).toBe('시뮬레이션 시작')
    // `paint()` reads "the LAST step says 시뮬레이션 시작", so two steps is the
    // shortest walk in which both labels are ever painted. At one they collapse.
    expect(MANUAL_STEPS.length).toBeGreaterThanOrEqual(2)
  })
})

describe('[x10] 최대 3번까지 is DEFAULT_TOTAL_RUNS - 1, not a string', () => {
  it('(a) the digit the plate prints is the re-run allotment', () => {
    const line = MANUAL_STEPS.flatMap((s) => s.body).find((b) => b.includes('재시행'))
    expect(line, 'no plate mentions 재시행 any more').toBeDefined()
    // run 1 replays the real incident, so the re-runs are the rest of the deck.
    expect(line).toBe(`최대 ${DEFAULT_TOTAL_RUNS - 1}번까지 시뮬레이션을 재시행할 수 있습니다.`)
  })

  it('(b) the module does NOT import the constant to derive it (it is a copy deck)', () => {
    // Deliberate, and asserted so the comment cannot be "fixed" into an import:
    // every other number in this file is authored, and a sentence assembled at
    // runtime out of a runloop export is the one line here that whoever owns the
    // copy could not rewrite. The binding is the comment plus (a).
    expect(stripComments(read(MANUAL_TS))).not.toMatch(/DEFAULT_TOTAL_RUNS|runloop/)
    // …and the comment that carries the binding is still there.
    expect(read(MANUAL_TS)).toMatch(/DEFAULT_TOTAL_RUNS/)
  })
})

describe('[x10] the plate x10 cut stays cut (민서, 08-10)', () => {
  it('(a) no plate narrates that the first run replays the real incident', () => {
    // x5c's middle plate: 시뮬레이션 대상 / '실제 사건을 재구성한 시뮬레이션입니다.'
    // / '단말의 첫 시뮬레이션에서는 과거 사건이 그대로 실행됩니다. 지켜보십시오.'
    // The first run demonstrates that by BEING it, and saying so in advance
    // spends the only surprise the opening has. Anything from that plate turning
    // up in the copy again is the decision being undone by someone who did not
    // hear it, so the words it turned on are named here.
    const all = MANUAL_STEPS.flatMap((s) => [s.head, s.lead, ...s.body]).join('\n')
    for (const word of ['재구성', '지켜보십시오', '과거 사건', '종결', '시뮬레이션 대상']) {
      expect(all, `the dropped plate's '${word}' is back in the briefing`).not.toContain(word)
    }
  })

  it('(b) the mechanics are the coach walk\'s job, and it is still there', () => {
    // The cut is only safe because `shell/tutorial.ts` teaches 파견 / 인수인계 /
    // 재시도 over the live desk. If that walk ever goes, the briefing is the only
    // explanation left and this suite should be the thing that says so.
    const tutorial = read(path.join(SHELL_DIR, 'tutorial.ts'))
    expect(tutorial, 'the coach walk is gone — the briefing no longer explains 파견').toMatch(/says:/)
    expect(tutorial).toMatch(/파견/)
  })
})

describe('[x10] the foot is shorter than the head (민서, 08-10)', () => {
  // One change to the shared template, so this holds for the 파견 confirmation,
  // the briefing and both endings at once. Computed from the tokens rather than
  // restated, so a padding step or a button height that drifts fails here.
  const headHeight = px(decl(CONFIRM_CSS, '.cf-plate-hd', 'height'))
  const [padTop, , padBottom] = box(decl(CONFIRM_CSS, '.cf-foot', 'padding'))
  const btnHeight = px(decl(CONFIRM_CSS, '.cf-btn', 'height'))
  const rule = px(decl(CONFIRM_CSS, '.cf-foot', 'border-top').split(/\s+/)[0]!)
  const footHeight = padTop + btnHeight + padBottom + rule

  it('(a) the head is 42 and the foot is 37 — visibly less, not a hair less', () => {
    expect(headHeight).toBe(42)
    expect(footHeight).toBe(37)
    expect(footHeight).toBeLessThan(headHeight)
    // The brief's window. Above it the proportion reads as an accident; below it
    // the button stops being a button.
    expect(footHeight).toBeGreaterThanOrEqual(34)
    expect(footHeight).toBeLessThanOrEqual(38)
  })

  it('(b) the focus ring fits inside the padding it was given', () => {
    // `outline` + `outline-offset` reach past the box on every side. Nothing in
    // this stack clips (no `overflow:hidden`), so the failure mode is a ring
    // printed ON the foot's rule, which reads as a rendering fault.
    const ring =
      px(decl(CONFIRM_CSS, '.cf-btn:focus-visible', 'outline').split(/\s+/)[0]!) +
      px(decl(CONFIRM_CSS, '.cf-btn:focus-visible', 'outline-offset'))
    expect(ring).toBeLessThan(padTop)
    expect(ring).toBeLessThan(padBottom)
  })

  it('(c) the two one-button feet inherit the height — they set inline padding only', () => {
    for (const [sheet, selector] of [
      [WIN_MANUAL_CSS, '.man-plate .cf-btn'],
      [WIN_ENDING_CSS, '.end-plate .cf-btn'],
    ] as const) {
      const body = ruleBodies(read(sheet), new RegExp(`^${selector.replace(/\./g, '\\.')}$`)).join(';')
      expect(body, `${path.basename(sheet)} has no rule for '${selector}'`).not.toBe('')
      const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
      expect(props).toEqual(['padding'])
      const [top, , bottom] = box(decl(sheet, selector, 'padding'))
      expect([top, bottom]).toEqual([0, 0])
    }
  })
})

describe('[x10] the briefing\'s type — one face, ×1.2, and no leak', () => {
  it('(a) no alert plate is set in the serif, and the face is declared exactly once', () => {
    // RE-AIMED (C17, x10 08-10), never weakened — and it is STRONGER than what it
    // replaced. This asserted `.man-plate .cf-ask` was `--mono` while
    // `confirm.css`'s stayed `--myeong`: the briefing had one face and the
    // confirmation and endings kept the serif, on the reading that a question and a
    // verdict are somebody speaking. 민서 overruled the scope the same day — 명조
    // leaves the alert plates entirely — so pinning the briefing's own override
    // would now pin a rule that must NOT exist, and pinning the confirmation's
    // `--myeong` would pin the exact thing that was removed.
    //
    // So the claim moves up to what the ruling actually is, which is also the form
    // that cannot rot: no alert sheet may name the serif at all, and the face is
    // declared once on the shared template. That survives the next re-scope, where
    // three per-family assertions would each have to be found and edited.
    const SHEETS = [
      ['confirm.css', CONFIRM_CSS],
      ['win-manual.css', WIN_MANUAL_CSS],
      ['win-ending.css', WIN_ENDING_CSS],
    ] as const

    // Declared once, on the template every plate family inherits.
    expect(decl(CONFIRM_CSS, '.cf-ask', 'font-family')).toBe('var(--mono)')

    // …and nowhere else. Comments are stripped first: all three sheets discuss
    // `--myeong` at length (the argument it replaced is on the record), and a guard
    // that read prose would fire on the reasoning instead of on a declaration.
    for (const [name, sheet] of SHEETS) {
      const css = stripComments(read(sheet))
      expect(css, `${name} still sets a plate in the serif`).not.toMatch(/--myeong/)
    }

    // The briefing's own override is GONE, not merely equal to the template — a
    // redundant one claims the plate needs its own face and goes stale in silence.
    expect(ruleBodies(read(WIN_MANUAL_CSS), /\.cf-ask/).join(';')).not.toMatch(/font-family/)
    expect(ruleBodies(read(WIN_ENDING_CSS), /\.cf-ask/).join(';')).not.toMatch(/font-family/)
  })

  it('(b) the sub text is one scale step up, and it is the nearest step to ×1.2', () => {
    const was = token('--fs-8-5')
    const now = px(decl(WIN_MANUAL_CSS, '.man-plate .cf-note', 'font-size'))
    expect(was).toBe(10.2)
    expect(now).toBe(12.6)
    // ×1.2 exactly is 12.24px, which is off the scale and cannot be written
    // outside tokens.css (inv 8 forbids a calc() in a font-size). 12.6 is
    // ×1.235 — the nearest step, rounded UP so the increase that was asked for
    // is granted rather than missed.
    expect(now / was).toBeGreaterThan(1.2)
    expect(now / was).toBeLessThan(1.25)
    // …and it did not leak: the ending's prose is still the caption size.
    expect(ruleBodies(read(WIN_ENDING_CSS), /\.cf-note/).join(';')).not.toMatch(/font-size/)
  })

  it('(c) the plate is floored at the TALLER step, so the button never walks', () => {
    // The one press on each plate is seconds from the other and lands on the same
    // control, so the two bodies must occupy the same box. Derived from the type
    // this sheet sets plus the line counts at 468px of measure — the wrapping
    // itself is a browser's business and lives in e2e/.
    //
    // RE-AIMED (C17, x10 08-10) — THE LEAD IS ONE LINE, NOT TWO. This derivation
    // shipped with `2 * askLh * askSize` and a floor of 226px, on the reasoning
    // that switching `.cf-ask` to `--mono` would push step 2's lead onto a second
    // line. Measured on the built page at 1280×800 with the floor lifted, it does
    // not: step 2's natural body is 195px and step 1's is 142px. 실제 상황 투입에
    // 앞서 모의 과정을 실시합니다. is 21 syllables ≈ 454px at 1.2em of 18px, inside
    // 468px of measure by 14px — the arithmetic was one wrap away from correct and
    // guessed the wrong side, which is precisely the thing a node-env test cannot
    // check for itself.
    //
    // The CLAIM is untouched: the floor equals the taller step and carries no
    // slack, and both bounds below still bite. Only the line count feeding it is
    // corrected to what a browser actually renders. Do not "simplify" this back
    // into the literal 195 — the derivation is what makes the sheet's number fail
    // when the type tokens move under it.
    const askLh = Number.parseFloat(decl(CONFIRM_CSS, '.cf-ask', 'line-height'))
    const noteLh = Number.parseFloat(decl(WIN_MANUAL_CSS, '.man-plate .cf-note', 'line-height'))
    const askSize = px(decl(CONFIRM_CSS, '.cf-ask', 'font-size'))
    const noteSize = px(decl(WIN_MANUAL_CSS, '.man-plate .cf-note', 'font-size'))
    const [bodyTop, , bodyBottom] = box(decl(CONFIRM_CSS, '.cf-body', 'padding'))
    const firstGap = px(decl(CONFIRM_CSS, '.cf-note', 'margin-top'))
    const betweenGap = px(decl(WIN_MANUAL_CSS, '.man-plate .cf-note + .cf-note', 'margin-top'))

    const lines = [2, 1, 1] // step 2's three paragraphs
    const tallest =
      1 * askLh * askSize +
      firstGap +
      lines.reduce((sum, n) => sum + n * noteLh * noteSize, 0) +
      (lines.length - 1) * betweenGap +
      // `box-sizing:border-box` (base.css) — the body's own padding is inside
      // the min-height, not on top of it.
      bodyTop +
      bodyBottom

    const floor = px(decl(WIN_MANUAL_CSS, '.man-plate .cf-body', 'min-height'))
    expect(floor).toBeGreaterThanOrEqual(tallest)
    // …and not so far over it that the slack becomes the design. 126px was the
    // stale floor no step ever reached; an over-tall one is the same defect
    // pointing the other way.
    expect(floor).toBeLessThan(tallest + 12)
  })
})
