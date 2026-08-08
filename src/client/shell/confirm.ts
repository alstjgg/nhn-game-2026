// The portal's confirmation plate — the one thing that stands between a
// finished agent file and the day it goes out on.
//
// WHAT IT IS. 배치 is irreversible: the press locks the file for the sitting
// and opens the day it was built for (W4 merged those two into one control).
// Until now that was a single unguarded click, and the file it commits is the
// only thing the operator authors all day. So the press asks first.
//
// WHAT IT IS NOT. It is not a window. The desk's windows are furniture the
// operator arranges — they drag, collapse, close and stack on a `--z` ladder,
// and every one of them is something you can put down and come back to. This
// is a question, and a question you can put down is not being asked. It has no
// title bar controls, it does not enter `WINDOW_REGISTRY` or the taskbar, and
// `applyLayout` never sees it: it is centred on the screen and it holds the
// screen until it is answered.
//
// It borrows the DOOR's plate instead (`shell/sign-in.ts` / `styles/signin.css`
// — the LED head, the chrome gradient, the sealed rule under the header),
// because the door is the other moment in this portal where the terminal asks
// the operator for something rather than showing them something.
//
// THE MEMBRANE HOLDS HERE TOO (spec-client §3 invariant 1). Two `<button>`s and
// static text. Nothing here is an `<input>`, nothing is contenteditable, and
// `tests/shell/no-free-text.test.ts` holds that line at source level.
import { button, el } from './dom.ts'

/**
 * PLACEHOLDER COPY — replace the strings in this object, not the module.
 *
 * `body` is what the plate asks. It is deliberately a real question rather than
 * "정말 배치하시겠습니까?": the operator is not being asked whether they meant to
 * click, they are being asked whether the file is finished, and the file is the
 * 인수인계 — what this shift hands the next agent. Swapping these strings is the
 * whole edit; nothing below reads anything else.
 *
 * `head` is the plate's own label, `meta` the line at its right edge, and
 * `yes`/`no` the two answers. Keep `no` first in the DOM (see `openConfirm`).
 */
export const CONFIRM_DEPLOY = {
  head: '배치 확인',
  meta: '되돌릴 수 없음',
  body: '인수인계 사항을 잘 작성하셨나요?',
  note: '배치하면 이번 시행 동안 파일이 잠깁니다.',
  yes: '예',
  no: '아니오',
} as const

export interface ConfirmCopy {
  head: string
  meta: string
  body: string
  note: string
  yes: string
  no: string
}

/** The elements the shell must hold still while a question is on the screen. */
const HELD = ['#topbar', '#desktop']

function hold(on: boolean): void {
  for (const sel of HELD) {
    const node = document.querySelector(sel)
    if (!node) continue
    if (on) node.setAttribute('inert', '')
    else node.removeAttribute('inert')
  }
}

/**
 * Puts the question on the screen and resolves with the operator's answer.
 *
 * `true` is 예 and nothing else: the promise resolves `false` for 아니오 and for
 * Escape, so a caller that does not read the value can only ever fail closed.
 *
 * ESCAPE IS 아니오. The plate carries no close control by design — the two
 * answers are the only way out of it, and neither is a dismissal. But a modal
 * layer with no keyboard exit is a keyboard trap (WCAG 2.1.2), and the safe
 * answer to an unanswered question about an irreversible act is "no". So the
 * key is bound to the cancelling button rather than to a third outcome.
 *
 * Re-entrancy: `openConfirm` mounts one plate. A second call while one is open
 * answers the second immediately with `false` rather than stacking two
 * questions over one desk — the caller here is a single button, so this is a
 * guard, not a flow.
 */
export function openConfirm(app: HTMLElement, copy: ConfirmCopy = CONFIRM_DEPLOY): Promise<boolean> {
  if (document.getElementById('confirm')) return Promise.resolve(false)

  const layer = el('div')
  layer.id = 'confirm'
  layer.setAttribute('role', 'alertdialog')
  layer.setAttribute('aria-modal', 'true')
  layer.setAttribute('aria-labelledby', 'cf-head')
  layer.setAttribute('aria-describedby', 'cf-body')

  const plate = el('section', 'cf-plate')

  const led = el('span', 'cf-led')
  led.setAttribute('aria-hidden', 'true')
  const headLabel = el('b', undefined, copy.head)
  headLabel.id = 'cf-head'
  const head = el('div', 'cf-plate-hd')
  head.append(led, headLabel, el('i', undefined, copy.meta))

  const bodyText = el('p', 'cf-ask', copy.body)
  bodyText.id = 'cf-body'
  const body = el('div', 'cf-body')
  body.append(bodyText, el('p', 'cf-note', copy.note))

  // 아니오 is built first and focused first: the opening keystroke on an
  // irreversible act should not be able to confirm it by reflex.
  const no = button('cf-btn cf-no', copy.no, copy.no)
  no.id = 'confirmNo'
  const yes = button('cf-btn cf-yes', copy.yes, copy.yes)
  yes.id = 'confirmYes'
  const foot = el('div', 'cf-foot')
  foot.append(no, yes)

  plate.append(head, body, foot)
  layer.append(plate)
  app.append(layer)
  hold(true)

  requestAnimationFrame(() => no.focus())

  return new Promise<boolean>((resolve) => {
    let answered = false
    const close = (value: boolean): void => {
      if (answered) return
      answered = true
      document.removeEventListener('keydown', onKey, true)
      layer.classList.add('cf-out')
      window.setTimeout(() => layer.remove(), 220)
      hold(false)
      resolve(value)
    }
    // Capture, so the desk's own key handlers never see a keystroke aimed at a
    // question they are behind. Tab is left alone — `inert` on the chrome and
    // the desk already leaves the plate the only focusable thing on screen.
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(false)
      }
    }
    document.addEventListener('keydown', onKey, true)
    no.addEventListener('click', () => close(false))
    yes.addEventListener('click', () => close(true))
  })
}
