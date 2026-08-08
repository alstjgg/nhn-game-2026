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
// x5c — AND THERE ARE THREE OF THEM.
//
// One plate, advanced three times: 임용 → 시뮬레이션 대상 → 파견과 재시도, with
// 다음 · 다음 · 시뮬레이션 시작. The briefing has three separate things to say —
// who the operator is, what they are about to watch, and what they are expected
// to do about it — and stacked on one plate they read as a wall the button is
// on the other side of. Three plates make each one a beat the operator has to
// press through, which is the only pacing an onboarding gets.
//
// The plate is NOT rebuilt between steps: its head, its body and its button
// label are rewritten in place. Remounting would replay the entrance animation
// and the veil three times, and would drop focus off the control the operator
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
 * THE BRIEFING (민서, 08-09). Replace these strings, not the module.
 *
 * Each step is one plate: a title, one line in white, and the rest in grey. The
 * split is not decoration — the white line is the CLAIM the plate is making and
 * the grey lines are what follows from it, so a reader who only takes in the
 * three white lines still leaves with 임용 → 재구성된 실제 사건 → 대응하십시오,
 * which is the whole game.
 *
 * The `n / 3` counter is NOT in these strings. It rides the head's own meta slot
 * (`CONFIRM_DEPLOY` uses the same slot for 되돌릴 수 없음) so it lands in one
 * fixed column across all three plates and reads as progress rather than as part
 * of a title that happens to end in a fraction.
 */
export const MANUAL_STEPS: readonly ManualStep[] = [
  {
    head: '신규 운영자 임용',
    lead: '긴급상황대응실 임용을 축하드립니다.',
    body: [
      '운영자는 직접 출동하지 않으며, 현장 요원을 파견하여 상황에 대응하는 업무를 맡게 됩니다.',
      '본 단말은 귀하의 상황 대응 능력을 시험하고 개선하기 위한 모의 장치이며, 실제 회선과 연결되어 있지 않습니다.',
    ],
  },
  {
    head: '시뮬레이션 대상',
    lead: '실제 사건을 재구성한 시뮬레이션입니다.',
    body: [
      '단말의 첫 시뮬레이션에서는 과거 사건이 그대로 실행됩니다. 지켜보십시오.',
      '그날 다수가 돌아오지 못했고, 사건 기록은 이미 종결되었습니다.',
    ],
  },
  {
    head: '파견과 재시도',
    lead: '긴급 상황에 대응하십시오.',
    body: [
      '이전 시뮬레이션의 현장 기록과 요원 보고에서 인수인계 사항을 작성하여 요원을 파견하십시오.',
      '시뮬레이션은 반복할 수 있습니다. 한 명이라도 더 돌아오게 하는 것이 귀하의 임무입니다.',
    ],
  },
]

/** The one control's two labels: every step but the last, and the last. */
export const MANUAL_NEXT = '다음'
export const MANUAL_START = '시뮬레이션 시작'

/** `1 / 3` — the head's meta slot, and the only place the count is written. */
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
 * side of this button to fail closed against — the worst Escape can cost is
 * three paragraphs. The walk itself is fully keyboard-operable without it: the
 * control holds focus across every step, so Enter three times is the whole
 * briefing.
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
    // reader of a DOM dump: three presses, and only the last one starts a day.
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
