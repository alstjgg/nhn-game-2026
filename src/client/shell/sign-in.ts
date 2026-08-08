// The portal's front door — plan-playtest O1, the opening.
//
// A judge who opens the page lands on a portal they have to sign into, not on
// a desk they have to decode. That is the whole job of this module: establish
// WHO the operator is and WHAT the terminal is for, in the same CRT the desk
// lives in, and then get out of the way. It owns no run state, reads no pack
// and never touches the driver.
//
// THE HOLD IS NOT OURS. `desktop-dressing.ts` already holds the desk
// (`body.booting`) and reveals it; O1's constraint is that the opening must not
// build a second one. So the desk boots at full speed BEHIND this layer and
// `bootShell` simply defers its existing `revealDesk` call until the door — and
// then the manual — is done with the screen.
//
// THE MEMBRANE HOLDS AT THE DOOR TOO (spec-client §3 invariant 1). The two
// fields are `<span>`s carrying `SIGN_IN`'s text; nothing here is an `<input>`,
// nothing is contenteditable, and the one control is a real `<button>`.
import { button, el } from './dom.ts'
import { sfxLoginStatic } from './radio-sfx.ts'
import { PORTAL, SIGN_IN } from './portal-identity.ts'

/** SVG namespace — the crest is drawn, not marked up (cf. thread-layer.ts). */
const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * How long one authentication line waits behind the one above it.
 *
 * x1 (08-08) — 190 → 280. Five lines at 190 ms plus a 520 ms tail was 1.47 s,
 * and a terminal that authenticates in a second and a half does not read as a
 * terminal that is checking anything. The lines are the only place the portal
 * says what it is before the desk arrives, so they are given time to be read:
 * 2.4 s total, still well inside the patience of someone who just pressed a
 * button.
 */
const STEP_MS = 280
/** Air after the last line, so the readout is read rather than glimpsed. */
const TAIL_MS = 1000

/**
 * Who gets the door, and who is let straight through to the desk.
 *
 * `?signin=skip` — the developer's way past it, and `?signin=show` forces it
 * back on. `navigator.webdriver` is the e2e lane: every spec under `e2e/` goes
 * `page.goto('./')` and then measures the DESK — the door is a modal layer over
 * the whole viewport, so leaving it up would make every one of those specs
 * assert against a curtain. The suite's contract is the desk; this keeps it
 * pointed at the desk, exactly as `dev-surface.ts` keeps it off the debug pane.
 */
export function signInSkipped(host: Window): boolean {
  const flag = new URLSearchParams(host.location.search).get('signin')
  if (flag === 'skip') return true
  if (flag === 'show') return false
  return host.navigator.webdriver === true
}

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** The 緊 seal the top bar wears, at the size a front door wants it. */
function crest(): HTMLElement {
  const host = el('div', 'si-crest')
  host.setAttribute('aria-hidden', 'true')

  const ring = svg('svg', { viewBox: '0 0 100 100' })
  ring.append(svg('circle', { class: 'si-ring', cx: '50', cy: '50', r: '47' }))

  const seal = svg('svg', { viewBox: '0 0 100 100', class: 'si-seal' })
  seal.append(
    svg('circle', { cx: '50', cy: '50', r: '38' }),
    svg('circle', { cx: '50', cy: '50', r: '31' }),
  )
  const glyph = svg('text', { x: '50', y: '62', 'text-anchor': 'middle' })
  glyph.textContent = '緊'
  seal.append(glyph)

  host.append(ring, seal)
  return host
}

/** One corner marking — the furniture that makes this a terminal, not a page. */
function mark(where: string, lines: readonly (readonly [string, string])[]): HTMLElement {
  const host = el('div', `si-mark ${where}`)
  host.setAttribute('aria-hidden', 'true')
  for (const [lead, value] of lines) {
    const row = el('div')
    row.append(document.createTextNode(`${lead} `), el('b', undefined, value))
    host.append(row)
  }
  return host
}

/** A label + a filled, inert well. Display only — see the module header. */
function field(label: string, value: string, secret: boolean, trailing: string): HTMLElement {
  const row = el('div', 'si-field')
  const well = el('span', 'si-well')
  well.append(el('span', secret ? 'si-value si-secret' : 'si-value', value))
  if (secret) well.append(el('span', 'si-lock', trailing))
  else well.append(el('span', 'si-caret'))
  row.append(el('span', 'si-label', label), well)
  return row
}

/** What the plate reports while it pretends to authenticate. */
function authLines(): readonly (readonly [string, string])[] {
  return [
    [`인증 회선 개설 — ${PORTAL.portalCode}`, '연결'],
    [`사용자 조회 — ${PORTAL.operatorId} ${PORTAL.operator}`, '확인'],
    [`권한 등급 ${PORTAL.clearance}`, '승인'],
    [`단말 배정 — ${SIGN_IN.terminal}`, '완료'],
    ['모의 세션 개시', '개시'],
  ]
}

function authReadout(): HTMLElement {
  const host = el('div', 'si-auth')
  authLines().forEach(([text, state], index) => {
    const line = el('div', 'si-line')
    line.style.setProperty('--delay', `${index * STEP_MS}ms`)
    line.append(el('span', undefined, text), el('s'), el('u', undefined, state))
    host.append(line)
  })
  const bar = el('div', 'si-bar')
  bar.append(el('i'))
  host.append(bar)
  return host
}

/** The chrome the door hides while it is up: the top bar and the desk itself. */
function holdChrome(on: boolean): void {
  for (const sel of ['#topbar', '#desktop']) {
    const node = document.querySelector(sel)
    if (!node) continue
    if (on) node.setAttribute('inert', '')
    else node.removeAttribute('inert')
  }
}

/**
 * Mounts the door and resolves once the operator is through it.
 *
 * The caller keeps the desk held until then — nothing on screen moves without
 * the LOGIN press, which is the point: the first frame has exactly one thing
 * to do on it.
 */
export function openSignIn(app: HTMLElement, body: HTMLElement): Promise<void> {
  body.classList.add('signin')
  holdChrome(true)

  const layer = el('div')
  layer.id = 'signin'
  layer.setAttribute('role', 'dialog')
  layer.setAttribute('aria-modal', 'true')
  layer.setAttribute('aria-labelledby', 'si-title')

  const frame = el('div', 'si-frame')
  frame.setAttribute('aria-hidden', 'true')

  layer.append(
    frame,
    mark('si-tl', [
      ['', SIGN_IN.agency],
      ['모의운영과 ·', '운영자 단말'],
    ]),
    mark('si-tr', [
      ['단말', SIGN_IN.terminal],
      ['세션', '미개시'],
    ]),
    mark('si-bl', [
      ['포털', `${PORTAL.portalCode} · 정기점검 완료`],
      ['회선', '전용 / 암호화'],
    ]),
    mark('si-br', [
      ['', '모의 전용'],
      ['', '실제 상황 아님'],
    ]),
  )

  const stack = el('div', 'si-stack')

  const title = el('h1', 'si-title', PORTAL.portal)
  title.id = 'si-title'

  const code = el('div', 'si-code')
  code.append(
    document.createTextNode(PORTAL.portalCode),
    el('i', undefined, '운영자 단말 접속'),
  )

  const plate = el('section', 'si-plate')

  const head = el('div', 'si-plate-hd')
  const led = el('span', 'si-led')
  led.setAttribute('aria-hidden', 'true')
  head.append(led, el('b', undefined, '사용자 인증'), el('i', undefined, `보안 등급 ${PORTAL.clearance}`))

  const form = el('div', 'si-form')
  form.append(
    field('아이디', SIGN_IN.userId, false, ''),
    field('비밀번호', SIGN_IN.secret, true, '저장됨'),
  )

  const login = button('si-login', '로그인 — 모의 세션을 개시합니다', '')
  login.append(el('b', undefined, 'LOGIN'), el('i', undefined, '↵ ENTER'))

  const note = el('div', 'si-note')
  note.append(
    el('em', undefined, '※'),
    el('span', undefined, '본 포털은 상황 대응 모의훈련 전용입니다. 실제 신고·구조 요청은 119.'),
  )

  const readout = authReadout()
  plate.append(head, form, login, note, readout)
  stack.append(crest(), title, el('div', 'si-latin', 'EMERGENCY RESPONSE ROOM'), el('div', 'si-rule'), code, plate)
  layer.append(stack)
  app.append(layer)

  requestAnimationFrame(() => login.focus())

  return new Promise<void>((resolve) => {
    let entered = false
    login.addEventListener('click', () => {
      if (entered) return
      entered = true
      login.disabled = true
      // The readout is built already — the class is what starts it, so every
      // line's `animation-delay` is measured from the same press.
      plate.classList.add('is-auth')
      const runway = authLines().length * STEP_MS + TAIL_MS
      sfxLoginStatic(runway)
      window.setTimeout(() => {
        layer.classList.add('si-out')
        window.setTimeout(() => layer.remove(), 500)
        // The top bar's `barDrop` replays the moment this class comes off —
        // the operator's name and clearance arrive with the session.
        body.classList.remove('signin')
        holdChrome(false)
        resolve()
      }, runway)
    })
  })
}
