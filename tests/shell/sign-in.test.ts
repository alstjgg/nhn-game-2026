// [x9] the door types itself in — `shell/sign-in.ts`.
//
// The split is the one `ending.test.ts` and `tutorial-observer.test.ts` both
// make: what a node-env run can PROVE, and what only a browser can. The plate,
// the caret hand-off, the grey slab going hot and the door actually opening are
// DOM and live in `e2e/signin.spec.ts`. What is proved here is the half that
// decides whether the door is CORRECT rather than whether it is handsome:
//
//  1. **The count arithmetic.** `doorFill` is the entire state machine, and its
//     off-by-ones are the ones that matter: a door that arms LOGIN at fourteen
//     opens on a half-typed card, and one that arms at sixteen never opens at
//     all. Pinned at every boundary, plus the two the design turns on — the
//     seventh press, which completes the id AND moves the caret in one move, and
//     the fifteenth, which is the only press that changes the button.
//
//  2. **That the lengths are 7 and 8 by DERIVATION.** The brief said "first 7
//     inputs" and "the next 8" because that is how long a badge number and a
//     mask are. `STROKES` is a sum, never a literal, so the guard is that the
//     two card values still add up to the door the brief describes — edit
//     `SIGN_IN.secret` to nine glyphs and this suite says so.
//
//  3. **Which presses count.** `countsAsStroke` is what keeps Tab and Enter for
//     the button and ⌘R for the browser, and what keeps the door open to a
//     Korean IME. Its rule is one line and every clause of it is load-bearing,
//     so every clause is tested.
//
//  4. **THE MEMBRANE (spec-client §3 invariant 1).** The strongest statement
//     available is structural and it is asserted as such: `doorFill` takes a
//     `number`. There is no parameter through which a pressed character could
//     travel, so what appears in the wells is `SIGN_IN`'s and cannot be the
//     player's, whatever they mashed to advance it. (b) below is the behavioural
//     restatement — the same count always paints the same two lines.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { SHELL_DIR, read, stripComments } from './shell-utils.ts'
import { STROKES, countsAsStroke, doorFill } from '../../src/client/shell/sign-in.ts'
import { PORTAL, SIGN_IN } from '../../src/client/shell/portal-identity.ts'

const SIGN_IN_TS = path.join(SHELL_DIR, 'sign-in.ts')
const SIGNIN_CSS = path.join(SHELL_DIR, '../styles/signin.css')

/** A `KeyPress` with the modifiers down — the shape `countsAsStroke` reads. */
function press(key: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey', boolean>> = {}) {
  return { key, ctrlKey: false, metaKey: false, altKey: false, ...mods }
}

describe('[x9] the card the door types', () => {
  it('(a) the id is the operator badge, and it is seven presses long', () => {
    expect(SIGN_IN.userId).toBe('OP-2291')
    expect(SIGN_IN.userId).toBe(PORTAL.operatorId)
    expect(SIGN_IN.userId).toHaveLength(7)
  })

  it('(b) the mask is eight glyphs, and every one of them is a mask', () => {
    expect(SIGN_IN.secret).toBe('********')
    expect(SIGN_IN.secret).toHaveLength(8)
    // A mask that leaked a character of a real secret would be a mask that was
    // not one. Nothing here is a credential — see `portal-identity.ts` — and the
    // assert is what keeps it that way if someone ever decides it should look
    // more convincing.
    expect(new Set(SIGN_IN.secret).size).toBe(1)
  })

  it('(c) the door asks for fifteen presses, and 15 is nowhere written down', () => {
    expect(STROKES).toBe(15)
    expect(STROKES).toBe(SIGN_IN.userId.length + SIGN_IN.secret.length)
    // The literal `15` must not appear in the module: the brief's two counts are
    // the lengths of two strings, and a hard-coded total is how those two facts
    // drift apart.
    expect(stripComments(read(SIGN_IN_TS))).not.toMatch(/\b15\b/)
  })
})

describe('[x9] doorFill — the whole state machine, as a function of a count', () => {
  it('(a) nothing typed: both wells empty, the id armed, LOGIN dead', () => {
    expect(doorFill(0)).toEqual({ lines: ['', ''], armed: 0, ready: false })
  })

  it('(b) the same count always paints the same two lines (the membrane, behaviourally)', () => {
    // Called twice with nothing between them but the number. There is no other
    // input, which is the point: whatever the player pressed to get from 3 to 4
    // is not an argument to this function and cannot have been.
    expect(doorFill(4)).toEqual(doorFill(4))
    expect(doorFill(4).lines[0]).toBe('OP-2')
  })

  it('(c) the id fills one character per press and the mask stays empty', () => {
    expect(doorFill(1).lines).toEqual(['O', ''])
    expect(doorFill(3).lines).toEqual(['OP-', ''])
    expect(doorFill(6).lines).toEqual(['OP-229', ''])
    for (let n = 0; n < 7; n += 1) {
      expect(doorFill(n).armed, `press ${n} must still be aimed at the id`).toBe(0)
      expect(doorFill(n).ready).toBe(false)
    }
  })

  it('(d) the seventh press completes the id AND moves the caret to the mask', () => {
    // The one press that does two things. `armed` is computed with `<` rather
    // than `<=` precisely for this: a caret that waited for the eighth press
    // would sit at the end of a finished line for one whole keystroke.
    expect(doorFill(7)).toEqual({ lines: ['OP-2291', ''], armed: 1, ready: false })
  })

  it('(e) the mask then fills one glyph per press, id untouched', () => {
    expect(doorFill(8).lines).toEqual(['OP-2291', '*'])
    expect(doorFill(11).lines).toEqual(['OP-2291', '****'])
    for (let n = 7; n < STROKES; n += 1) {
      expect(doorFill(n).armed, `press ${n} must be aimed at the mask`).toBe(1)
      expect(doorFill(n).lines[0]).toBe(SIGN_IN.userId)
      expect(doorFill(n).lines[1]).toHaveLength(n - 7)
    }
  })

  it('(f) the fourteenth press does NOT open the door', () => {
    const one = doorFill(STROKES - 1)
    expect(one.lines).toEqual(['OP-2291', '*******'])
    expect(one.ready, 'a half-typed card opened the door').toBe(false)
    expect(one.armed).toBe(1)
  })

  it('(g) the fifteenth fills both lines, drops the caret and arms LOGIN', () => {
    expect(doorFill(STROKES)).toEqual({
      lines: ['OP-2291', '********'],
      armed: null,
      ready: true,
    })
  })

  it('(h) counts outside the run clamp — display state never throws at the boot', () => {
    expect(doorFill(-4)).toEqual(doorFill(0))
    expect(doorFill(99)).toEqual(doorFill(STROKES))
    expect(doorFill(2.7).lines[0]).toBe('OP')
    expect(doorFill(Number.NaN)).toEqual(doorFill(0))
  })
})

describe('[x9] countsAsStroke — which presses the door hears', () => {
  it('(a) any single character does, whatever it is', () => {
    for (const key of ['a', 'Z', '7', ' ', '-', '가', 'ㅁ', '😀']) {
      expect(countsAsStroke(press(key)), `${key} should count`).toBe(true)
    }
  })

  it('(b) a named key never does — which is what leaves the button its keyboard', () => {
    // Tab reaches LOGIN once it is live and Enter/Space press it. If any of them
    // also typed, the last press of the card would fire the button it enabled.
    for (const key of ['Tab', 'Enter', 'Shift', 'Escape', 'ArrowLeft', 'F5', 'CapsLock', 'Backspace']) {
      expect(countsAsStroke(press(key)), `${key} should not count`).toBe(false)
    }
  })

  it('(c) an IME swallowing the character still counts as a press', () => {
    // The Korean-keyboard case. `Process` is one key down with no character
    // attached; ignoring it would give a 두벌식 operator a door that never opens.
    expect(countsAsStroke(press('Process'))).toBe(true)
    expect(countsAsStroke(press('Unidentified'))).toBe(true)
  })

  it('(d) a modifier held means the press was aimed at the browser', () => {
    expect(countsAsStroke(press('r', { metaKey: true }))).toBe(false)
    expect(countsAsStroke(press('c', { ctrlKey: true }))).toBe(false)
    expect(countsAsStroke(press('a', { altKey: true }))).toBe(false)
    // …and the IME keys are not an exception to that.
    expect(countsAsStroke(press('Process', { ctrlKey: true }))).toBe(false)
  })
})

describe('[x9] what the door removed', () => {
  it('(a) `저장됨` is gone from the module and from the sheet', () => {
    // The mask said it was remembered, on a field the operator now types by
    // hand. Both claims cannot hold and the mechanic is the one telling the
    // truth — so the label went, and `.si-lock` went with it.
    // Comments stripped first: the module's own header now EXPLAINS the removal
    // by name, and a scan that read prose would fail on the record of the fix.
    expect(stripComments(read(SIGN_IN_TS))).not.toMatch(/저장됨/)
    expect(read(SIGNIN_CSS)).not.toMatch(/\.si-lock\b/)
  })

  it('(b) LOGIN is disabled in the source, not merely styled as if it were', () => {
    // `pointer-events:none` was the whole of the old locked state, which left a
    // button that was reachable by Tab and fireable by Enter while the card was
    // empty. The real attribute is what takes it out of the tab order too.
    expect(stripComments(read(SIGN_IN_TS))).toMatch(/login\.disabled\s*=\s*true/)
  })

  it('(c) the caret survives reduced motion on TWO absences, so both are pinned', () => {
    // C18, and the one place x9 makes the caret load-bearing: it is the only
    // thing on the screen that says where the next press goes, and the door does
    // not open until fifteen have gone somewhere. `base.css` collapses every
    // animation to a single 1 ms pass, so a caret that settled dark would leave
    // exactly the operator who asked for less movement unable to read the screen.
    //
    // It settles LIT instead — but only because of two things that are not
    // written anywhere, which is why they are asserted here rather than trusted.
    const css = stripComments(read(SIGNIN_CSS))

    // 1. The blink is UNFILLED. `coach.css` records the opposite case: `litPulse`
    //    was `animation … both`, and a filled animation holds its end keyframe
    //    forever — which for a blink is the dark half. Unfilled, `opacity` falls
    //    back to the `.85` on `.si-caret` itself when the 1 ms pass ends.
    const blink = css.match(/animation:\s*siBlink[^;}]*/)?.[0] ?? ''
    expect(blink, 'signin.css no longer animates the caret with siBlink').not.toBe('')
    expect(blink, 'a filled blink settles on its dark keyframe').not.toMatch(/both|forwards/)
    expect(css).toMatch(/\.si-caret\{[^}]*opacity:\.85/)

    // 2. Shown/hidden is `display`, never `opacity`. Opacity is the blink's
    //    channel; a hidden state sharing it would be a state the blink argues
    //    with, and under the collapse the argument is settled by whichever
    //    declaration happens to win.
    expect(css).toMatch(/\.si-caret\{[^}]*display:none/)
    expect(css).toMatch(/\.si-field\.is-armed\s+\.si-caret\{[^}]*display:/)
  })
})
