// The sheet the portal issues at sign-in — the last thing between a judge and
// the desk itself.
//
// x5b (08-09) — IT IS A PLATE NOW, NOT A WINDOW.
//
// It never was a desk window (it is outside `WINDOW_REGISTRY`, `applyLayout` and
// the taskbar, because it is a document the portal issues once rather than an
// instrument the operator keeps), but it still WORE the window frame: a file
// tab, a title bar, a close control, a scrolling bond sheet and a footer. That
// is a lot of furniture for something you read once and dismiss, and every
// piece of it was a promise the sheet does not keep — the tab implied a filing
// system, the title bar implied it could be moved, the close control implied it
// could be put down and come back to. It cannot. It is a question the portal
// asks before it hands over the desk, which is exactly what `shell/confirm.ts`
// already is, so it wears that plate: same head, same body, same button.
//
// x5c — AND THERE ARE THREE OF THEM. x10 (08-10) — NO, TWO.
//
// One plate, advanced ONCE: 임용 → 모의 과정, with 다음 · 시뮬레이션 시작. Two
// plates still make each one a beat the operator has to press through, which is
// the only pacing an onboarding gets; what changed is that there are no longer
// three things worth a beat.
//
// WHAT WAS CUT, AND WHY. x5c's middle plate was 시뮬레이션 대상 / '실제 사건을
// 재구성한 시뮬레이션입니다.' — it said that the first simulation replays the real
// incident and that the operator should watch it, and then the third plate
// explained 파견 and 재시도. Both were written when this plate was the only
// surface on the desk that could explain anything. It is not any more:
// `shell/tutorial.ts` walks EIGHT coach marks over the live windows (plated by
// `shell/coach.ts`), pointing at the feed, the two report sections, the
// extraction, the 인수인계 slots and the 파견 button, in the order the operator
// actually uses them. A plate that narrates the mechanics in front of a desk
// that is about to demonstrate them is a wall between the judge and the game,
// and the judge has sixty seconds.
//
// So nothing survived x5c's plates 2 and 3, and step 2 below is NEW copy rather
// than a merge of them: 모의 과정 안내 says what the terminal IS and what the
// allotment is, and never what to do with either.
//
// THE DROPPED CONTENT IS GONE ON PURPOSE (민서, 08-10). Do not fold "the first
// run replays the real incident, watch it" back into either surviving plate. The
// first run demonstrates that BY BEING it, and a briefing that announces it in
// advance spends the only surprise the opening has.
//
// What is left is the two things a notice genuinely has to say before a
// simulator starts. First, who the operator is — and, load-bearing, that they do
// NOT go to the scene; that is the one fact about the job the desk itself cannot
// show, because a desk that never dispatches the operator looks the same as a
// desk whose operator has not been dispatched yet. Second, that what follows is
// a rehearsal, with a fixed number of attempts and one thing to maximise.
//
// The plate is NOT rebuilt between steps: its head, its body and its button
// label are rewritten in place. Remounting would replay the entrance animation
// and the veil on every step, and would drop focus off the control the operator
// is pressing — the whole briefing is meant to be walkable by pressing Enter.
//
// It borrows `confirm.css`'s `.cf-*` classes outright rather than restating
// them — `styles/win-manual.css` carries only the layer, the entrance, the step
// transition and what a one-button foot needs, and `index.css` imports it AFTER
// `confirm.css` so those few overrides land. Nothing here builds a `.win`, so
// `body.booting .win{visibility:hidden}` no longer has to be opted out of, and
// `audio/index.ts`'s window-open observer cannot see it at all.
import { button, el } from './dom.ts'
import { PORTAL } from './portal-identity.ts'

/** One plate of the briefing. */
export interface ManualStep {
  /** The plate's own title, left of the head. */
  head: string
  /** The one line set in white — what this plate is actually saying. */
  lead: string
  /** The lines under it, in the head's own grey. One paragraph each. */
  body: readonly string[]
}

/**
 * THE BRIEFING (민서, 08-09; recut to two plates x10, 08-10). Replace these
 * strings, not the module.
 *
 * Each step is one plate: a title, one line in white, and the rest in grey. The
 * split is not decoration — the white line is the CLAIM the plate is making and
 * the grey lines are what follows from it, so a reader who only takes in the
 * two white lines still leaves with 임용 → 모의 과정: you have been appointed to
 * the room, and what you are about to operate is a drill. That is the frame the
 * whole sitting hangs in, and it is all the briefing is now for — the mechanics
 * are the coach walk's job (see the header).
 *
 * The `n / 2` counter is NOT in these strings. It rides the head's own meta slot
 * (`CONFIRM_DEPLOY` uses the same slot for 되돌릴 수 없음) so it lands in one
 * fixed column across both plates and reads as progress rather than as part of a
 * title that happens to end in a fraction. `counterOf` derives it from this
 * array's length, so dropping x5c's middle plate re-counted the walk from 3 to 2
 * with no other edit anywhere.
 */
export const MANUAL_STEPS: readonly ManualStep[] = [
  {
    head: '신규 운영자 안내',
    lead: '긴급상황대응실 운영자 임용을 축하합니다.',
    body: [
      '긴급상황 발생 시 본부는 현장 요원을 파견합니다.',
      '운영자는 직접 출동하지 않으며, 대응실에서 현장 요원의 교신을 받습니다.',
    ],
  },
  {
    head: '모의 과정 안내',
    lead: '실제 상황 투입에 앞서 모의 과정을 실시합니다.',
    body: [
      '본 단말은 귀하의 상황 대응 능력을 시험하고 개선하기 위한 모의 장치이며, 실제 회선과 연결되어 있지 않습니다.',
      // `3` IS ARITHMETIC, NOT COPY. `src/runloop/run-loop.ts` publishes
      // `DEFAULT_TOTAL_RUNS = 4`, and run 1 is the baseline that replays the
      // real incident — so what the operator may RE-run is
      // `DEFAULT_TOTAL_RUNS - 1`, which is 3. Move that constant and this
      // sentence becomes a lie the plate tells before the first press, in the
      // one place the operator has no way to check it.
      //
      // The constant is deliberately NOT imported to derive the digit. This
      // module is a copy deck — "replace these strings, not the module" — every
      // other number and particle in it is authored, and a sentence assembled at
      // runtime out of a runloop export would be the one line here that cannot
      // be rewritten by whoever owns the copy. The binding is this comment;
      // keep the two in step by hand, and `tests/shell/manual.test.ts` fails if
      // you do not.
      '최대 3번까지 시뮬레이션을 재시행할 수 있습니다.',
      '최대한 많은 생환자를 확보하십시오.',
    ],
  },
]

/**
 * The one control's two labels: every step but the last, and the last.
 *
 * x10 — still two labels at two plates, and `paint()` needs no edit for it: the
 * rule is "the last step says 시뮬레이션 시작", not "step 3 does". With the walk
 * cut to two that reads 다음 · 시뮬레이션 시작, which is the shortest walk these
 * two labels can describe. A ONE-plate walk would collapse them — the only
 * press would be the last — and that is the point at which this pair, and the
 * counter below, stop earning their place.
 */
export const MANUAL_NEXT = '다음'
export const MANUAL_START = '시뮬레이션 시작'

/** `1 / 2` — the head's meta slot, and the only place the count is written. */
function counterOf(index: number): string {
  return `${index + 1} / ${MANUAL_STEPS.length}`
}

/**
 * Walks the briefing and resolves the moment the last plate is answered.
 *
 * It resolves as the exit animation STARTS, not after it: the caller reveals the
 * desk on that resolution, so the sheet lifts off the desk it uncovers instead
 * of the screen going empty between the two.
 *
 * ESCAPE SKIPS THE WHOLE BRIEFING, and does not merely close the plate in front
 * of it. A modal layer with no keyboard exit is a keyboard trap (WCAG 2.1.2),
 * and unlike the confirmation plate there is no irreversible act on the other
 * side of this button to fail closed against — the worst Escape can cost is two
 * plates of notice. The walk itself is fully keyboard-operable without it: the
 * control holds focus across every step, so since x10 cut the middle plate,
 * Enter twice is the whole briefing.
 */
export function openManual(app: HTMLElement): Promise<void> {
  const root = el('div')
  root.id = 'manual'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-labelledby', 'man-head')
  root.setAttribute('aria-describedby', 'man-body')

  const plate = el('section', 'cf-plate man-plate')

  const led = el('span', 'cf-led')
  led.setAttribute('aria-hidden', 'true')
  const headLabel = el('b')
  headLabel.id = 'man-head'
  const counter = el('i')
  const head = el('div', 'cf-plate-hd')
  head.append(led, headLabel, counter)

  const body = el('div', 'cf-body')
  body.id = 'man-body'
  // The step changes under a reader who is not looking at the head, so the
  // region announces itself. `aria-describedby` above points at this same
  // container rather than at one paragraph inside it, so the description
  // follows the walk instead of going stale on step 1's lead.
  body.setAttribute('aria-live', 'polite')

  const go = button('cf-btn cf-yes man-go', MANUAL_NEXT, MANUAL_NEXT)
  go.id = 'manualGo'
  const foot = el('div', 'cf-foot')
  foot.append(go)

  plate.append(head, body, foot)
  root.append(plate)
  app.append(root)

  let at = 0

  function paint(): void {
    const step = MANUAL_STEPS[at]
    if (step === undefined) return
    const last = at === MANUAL_STEPS.length - 1

    headLabel.textContent = step.head
    counter.textContent = counterOf(at)
    body.replaceChildren(
      el('p', 'cf-ask', step.lead),
      ...step.body.map((line) => el('p', 'cf-note', line)),
    )

    go.textContent = last ? MANUAL_START : MANUAL_NEXT
    go.title = last ? `${MANUAL_START} — ${PORTAL.portal}` : MANUAL_NEXT
    // The op the press performs, so the walk is legible to a test and to the
    // reader of a DOM dump: since x10, two presses, and only the last one starts
    // a day. `data-step` is 1-based off `at`, so it counted the walk down with
    // `MANUAL_STEPS` and needed no edit.
    go.dataset.step = String(at + 1)
    go.dataset.op = last ? 'start' : 'next'

    // Re-trigger the step animation. Removing the class and reading a layout
    // property is what makes the SAME animation run again on an element that
    // was never detached — the plate persists across steps by design (see the
    // header), so there is no remount to restart it for us.
    body.classList.remove('man-step')
    void body.offsetWidth
    body.classList.add('man-step')
  }

  paint()
  requestAnimationFrame(() => go.focus())

  return new Promise<void>((resolve) => {
    let closed = false
    const dismiss = (): void => {
      if (closed) return
      closed = true
      root.classList.add('man-out')
      window.setTimeout(() => root.remove(), 460)
      document.removeEventListener('keydown', onKey)
      resolve()
    }
    const advance = (): void => {
      if (closed) return
      if (at < MANUAL_STEPS.length - 1) {
        at += 1
        paint()
        return
      }
      dismiss()
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') dismiss()
    }
    go.addEventListener('click', advance)
    document.addEventListener('keydown', onKey)
  })
}
