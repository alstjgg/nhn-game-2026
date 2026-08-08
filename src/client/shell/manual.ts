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
// ONE ANSWER, not two. The confirmation plate has 취소 because 파견 is
// irreversible and refusing is a real outcome; there is nothing to refuse here,
// and a plate that offers 아니오 to an onboarding sheet is asking a question it
// will not honour. So: one seal-red button, 시뮬레이션 시작.
//
// It borrows `confirm.css`'s `.cf-*` classes outright rather than restating
// them — `styles/win-manual.css` carries only the layer, the entrance and what
// a one-button foot needs, and `index.css` imports it AFTER `confirm.css` so
// those few overrides land. Nothing here builds a `.win`, so
// `body.booting .win{visibility:hidden}` no longer has to be opted out of, and
// `audio/index.ts`'s window-open observer cannot see it at all.
import { button, el } from './dom.ts'
import { PORTAL } from './portal-identity.ts'

/**
 * PLACEHOLDER COPY — replace the strings in this object, not the module.
 *
 * `body` is TBD ON PURPOSE (민서, 08-09): the onboarding text is not written
 * yet, and the sheet that shipped before this was a four-clause draft stamped
 * 초안 to say so — a page of provisional prose that a judge would read as the
 * game explaining itself badly. An honest placeholder is smaller than a
 * dishonest document. The written copy lands here, in the grey block under the
 * welcome, and nothing else in the module has to move for it.
 *
 * The head carries no meta line. `CONFIRM_DEPLOY`'s is 되돌릴 수 없음, which is
 * the one fact its plate exists to state; this plate has no such fact yet, and
 * a header that says more than the body is how a placeholder starts pretending.
 */
export const MANUAL = {
  head: 'Onboarding Manual',
  welcome: '긴급상황대응실에 신규 입사를 축하드립니다.',
  body: 'TBD',
  start: '시뮬레이션 시작',
} as const

/**
 * Opens the sheet and resolves the moment it is dismissed.
 *
 * It resolves as the exit animation STARTS, not after it: the caller reveals the
 * desk on that resolution, so the sheet lifts off the desk it uncovers instead
 * of the screen going empty between the two.
 *
 * ESCAPE STILL CLOSES IT. There is only one answer, so Escape is not a second
 * outcome — it is the same one, reached without the mouse. A modal layer with no
 * keyboard exit is a keyboard trap (WCAG 2.1.2), and unlike the confirmation
 * plate there is no irreversible act on the other side of this button to fail
 * closed against.
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
  const headLabel = el('b', undefined, MANUAL.head)
  headLabel.id = 'man-head'
  const head = el('div', 'cf-plate-hd')
  head.append(led, headLabel)

  const welcome = el('p', 'cf-ask', MANUAL.welcome)
  welcome.id = 'man-body'
  const body = el('div', 'cf-body')
  body.append(welcome, el('p', 'cf-note', MANUAL.body))

  const start = button('cf-btn cf-yes man-start', `${MANUAL.start} — ${PORTAL.portal}`, MANUAL.start)
  start.id = 'manualStart'
  const foot = el('div', 'cf-foot')
  foot.append(start)

  plate.append(head, body, foot)
  root.append(plate)
  app.append(root)

  requestAnimationFrame(() => start.focus())

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
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') dismiss()
    }
    start.addEventListener('click', dismiss)
    document.addEventListener('keydown', onKey)
  })
}
