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
//
// x9 — THE OPERATOR TYPES THE CARD IN, and that is the membrane stated out loud
// rather than a hole in it. The fields used to arrive pre-filled and LOGIN was
// live on the first frame, which made the door a picture of a login: the one
// thing on screen was already done, and the press was a formality. So the wells
// start empty and each keystroke lands one character — `OP-2291`, then eight
// mask glyphs — and LOGIN is dead until the fifteenth.
//
// WHAT was pressed never reaches WHAT appears. `doorFill()` below takes a COUNT
// and returns `SIGN_IN`'s own two lines sliced to it; the key's identity is read
// exactly once, by `countsAsStroke()`, and only to decide whether the press was
// a press at all. Mash the keyboard and the terminal still types its own badge
// number. That is the membrane as a MECHANIC — the player's hands are on this
// desk, their words are not in it — and it is why this screen can ask for
// fifteen keystrokes without becoming a text field.
//
// A TAP COUNTS AS A KEYSTROKE. There is no focused field here to summon a soft
// keyboard, so on a touch screen `keydown` never fires and a key-only door would
// be a dead end for every phone that opens the deployed site. `pointerdown` on
// the layer is the same gesture by another instrument, and on a desktop it pays
// again: the player who clicks the empty well instead of typing is taught the
// mechanic by the character that appears under their cursor.
import { button, el } from './dom.ts'
import { sfxKeyTick, sfxLoginStatic } from './radio-sfx.ts'
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

/* ═══ THE CARD THE DOOR TYPES ═══════════════════════════════════════════════
   The two lines, in the order the keystrokes fill them. `as const` so the pair
   stays a pair: `doorFill` indexes it against the two wells positionally, and a
   third line would have to arrive with a third well or not at all. ══════════ */
const LINES = [SIGN_IN.userId, SIGN_IN.secret] as const

/**
 * How many presses the door asks for before it will open.
 *
 * DERIVED, never a literal. 7 + 8 = 15 today because that is how long a badge
 * number and a mask are; writing 15 down would let one of them be edited into a
 * door that opens early or never.
 */
export const STROKES = LINES[0].length + LINES[1].length

/** What the two wells show after `n` presses, and whether LOGIN is live yet. */
export interface DoorFill {
  /** The visible text of well 0 (the id) and well 1 (the mask). */
  readonly lines: readonly [string, string]
  /** Which well is taking the next press, or `null` once both are full. */
  readonly armed: 0 | 1 | null
  /** `true` exactly when both lines have landed in full. */
  readonly ready: boolean
}

/**
 * The whole state machine of the door, as a function of a COUNT.
 *
 * This signature is the membrane guard (see the module header): there is no
 * parameter here through which a pressed character could travel, so the text
 * that appears is `SIGN_IN`'s and nothing else, whatever was pressed to advance
 * it. `tests/shell/sign-in.test.ts` is the oracle — it can prove the entire
 * mechanic in a node env, because the mechanic is arithmetic and only its
 * PAINTING needs a browser.
 *
 * Out-of-range counts clamp rather than throw: this is display state, and a
 * door that threw would take the whole boot with it.
 *
 * `isFinite` FIRST, and not as a formality. `Math.min`/`Math.max` propagate NaN
 * instead of clamping it, so a NaN count fell all the way through to `armed:
 * null` with two empty lines — a door showing no caret, no character and no way
 * forward, which is the one state this screen must never reach. Nothing inside
 * the module can produce it (the counter starts at 0 and only ever gains 1), but
 * this function is exported and its contract is a `number`, so the floor is
 * written here rather than assumed at every call site.
 */
export function doorFill(strokes: number): DoorFill {
  const n = Number.isFinite(strokes) ? Math.min(STROKES, Math.max(0, Math.trunc(strokes))) : 0
  const first = Math.min(n, LINES[0].length)
  return {
    lines: [LINES[0].slice(0, first), LINES[1].slice(0, n - first)],
    // `<` and not `<=`: the moment the id is full the caret has already moved on
    // to the mask, so the seventh press both completes well 0 and arms well 1.
    armed: n < LINES[0].length ? 0 : n < STROKES ? 1 : null,
    ready: n >= STROKES,
  }
}

/** The keydown fields `countsAsStroke` reads — a `KeyboardEvent`, minus the rest. */
export interface KeyPress {
  readonly key: string
  readonly ctrlKey: boolean
  readonly metaKey: boolean
  readonly altKey: boolean
}

/**
 * What an IME reports instead of a character while it is composing.
 *
 * Load-bearing for the audience this game is FOR. A player with the 두벌식
 * keyboard on presses ㅁ and Chrome hands us `key: 'Process'` on some platforms
 * — one press, no character — so a plain "single-character key" rule would give
 * a Korean operator a door that ignores them. Both of these mean "a key went
 * down and the IME ate it", which is a keystroke by every measure this screen
 * cares about. Nothing composed is ever read: see the module header.
 */
const IME_KEYS = new Set(['Process', 'Unidentified'])

/**
 * Whether a keydown is one of the door's presses.
 *
 * A single-character `key` is the whole rule, and it is the rule because of what
 * it excludes for free: `Shift`, `Tab`, `Enter`, `ArrowLeft`, `F5` and every
 * other named key is longer than one character, so navigating to the button and
 * pressing it can never also type into the wells. `[...key]` rather than
 * `key.length` — an astral character (an emoji off a touch bar) is one keystroke
 * and two UTF-16 units.
 *
 * A modifier held down means the press was aimed at the BROWSER — ⌘R, ⌃C, ⌥Tab
 * — and reloading the page or copying is not signing in.
 */
export function countsAsStroke(press: KeyPress): boolean {
  if (press.ctrlKey || press.metaKey || press.altKey) return false
  return [...press.key].length === 1 || IME_KEYS.has(press.key)
}

/* ═══ WHAT THE BUTTON SAYS IN EITHER STATE ══════════════════════════════════
   The locked sub-label is not an instruction, it is a STATUS, in the register
   the rest of this screen already speaks (`세션 미개시` two corners over). The
   door does not tell the operator to press a key; it reports that it is waiting
   for one, and the blinking caret in the armed well says where.

   The armed pair is the copy this button has always carried. It is restored and
   not merely revealed, because `↵ ENTER` on a dead button is a lie: Enter does
   nothing at all until the fifteenth press, and a control that advertises a
   shortcut it will not honour is worse than a control that says nothing. ═══ */
const LOCKED_NAME = '인증 대기 — 인증 정보가 입력되지 않았습니다'
const LOCKED_HINT = '인증 대기'
const READY_NAME = '로그인 — 모의 세션을 개시합니다'
const READY_HINT = '↵ ENTER'

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

/** A label and an empty well, plus the two nodes the typer writes through. */
interface Well {
  /** The row `.is-armed` lands on — it drives the label, the ring and the caret. */
  readonly row: HTMLElement
  /** The span the characters are appended to, one child element each. */
  readonly value: HTMLElement
}

/**
 * A label + an empty, inert well. Display only — see the module header.
 *
 * BOTH wells now carry a caret; `signin.css` shows only the armed one. It used
 * to be built for the id alone because the mask's right-hand end was occupied by
 * `저장됨` — a label saying the password was remembered, on a field that is now
 * visibly being entered by hand. The two claims cannot both be true, and the one
 * the mechanic makes wins, so the lock label is gone.
 *
 * `aria-live` on the id and NOT on the mask. Every press is silent for a sighted
 * operator — the character is the feedback — and an operator who cannot see it
 * would otherwise press fifteen keys into nothing. A polite region with atomic
 * off announces only the node that arrived, so this is keyboard echo exactly:
 * "O", "P", … and then the mask stays quiet, which is what a masked field is for.
 */
function field(label: string, secret: boolean): Well {
  const row = el('div', 'si-field')
  const well = el('span', 'si-well')
  const value = el('span', secret ? 'si-value si-secret' : 'si-value')
  if (!secret) value.setAttribute('aria-live', 'polite')
  const caret = el('span', 'si-caret')
  caret.setAttribute('aria-hidden', 'true')
  well.append(value, caret)
  row.append(el('span', 'si-label', label), well)
  return { row, value }
}

/**
 * Binds the presses to the wells. Returns the detach the caller owns.
 *
 * `paint` is written to be IDEMPOTENT and to catch up from any count rather than
 * to append "the next character": it asks `doorFill` what the wells should read
 * and adds whatever spans are missing. A press is one character today, so the
 * loop runs once — but a door that can be repainted from its count alone is a
 * door that cannot drift out of step with its own state, and the one-character
 * rule stays a property of `doorFill` instead of being spread across a renderer.
 *
 * One span per character rather than one text node rewritten: an appended node
 * is what the live region announces, and it is what `siChar` animates. Rewriting
 * `textContent` would re-animate the whole line on every press.
 */
function typeDoor(layer: HTMLElement, wells: readonly [Well, Well], onReady: () => void): () => void {
  let strokes = 0

  function stop(): void {
    window.removeEventListener('keydown', onKey)
    layer.removeEventListener('pointerdown', onTap)
  }

  function paint(): void {
    const fill = doorFill(strokes)
    wells.forEach((well, i) => {
      const text = fill.lines[i] as string
      for (let c = well.value.childElementCount; c < text.length; c += 1) {
        well.value.append(el('span', 'si-ch', text[c] as string))
      }
      well.row.classList.toggle('is-armed', fill.armed === i)
    })
    if (!fill.ready) return
    // Detached at the fifteenth press, not at the LOGIN click: from here the
    // keyboard belongs to the button (Enter and Space activate it), and a
    // sixteenth press must not be swallowed by a layer that is done listening.
    stop()
    onReady()
  }

  function stroke(): void {
    if (strokes >= STROKES) return
    strokes += 1
    sfxKeyTick()
    paint()
  }

  function onKey(ev: KeyboardEvent): void {
    if (!countsAsStroke(ev)) return
    // Space is the one single-character key with a job of its own — it scrolls,
    // and it presses whatever has focus. Neither is what a press at the door
    // means, and the button it would press is disabled until the door is done.
    ev.preventDefault()
    stroke()
  }

  function onTap(): void {
    stroke()
  }

  window.addEventListener('keydown', onKey)
  layer.addEventListener('pointerdown', onTap)
  // The opening paint arms well 0. Nothing is written — `doorFill(0)` is two
  // empty lines — so this is the caret taking its position, and it happens here
  // rather than in the markup so that "which well is live" has exactly one
  // author.
  paint()
  return stop
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

  const wells: readonly [Well, Well] = [field('아이디', false), field('비밀번호', true)]
  const form = el('div', 'si-form')
  form.append(wells[0].row, wells[1].row)

  // Dead on the first frame, and dead in the DOM sense rather than the CSS one:
  // `disabled` takes the button out of the tab order as well as out of reach, so
  // while the door is locked the dialog has nothing to tab to and Enter has
  // nothing to fire. That is correct — there is exactly one thing to do here and
  // it is not on this button yet.
  const login = button('si-login', LOCKED_NAME, '')
  const hint = el('i', undefined, LOCKED_HINT)
  login.append(el('b', undefined, 'LOGIN'), hint)
  login.disabled = true

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

  // The LAYER takes focus, not the button — the button is disabled and cannot.
  // `tabindex="-1"` is what makes that possible, and it is what puts assistive
  // tech inside the dialog so its title is read; a modal whose focus stayed on
  // `<body>` is a modal AT never enters. Presses are heard on `window`, so
  // nothing depends on where focus actually sits.
  layer.tabIndex = -1
  requestAnimationFrame(() => layer.focus())

  /** The fifteenth press: the card is in, so the control comes alive. */
  const arm = (): void => {
    login.disabled = false
    login.title = READY_NAME
    hint.textContent = READY_HINT
    // The one orchestrated moment on this screen — `signin.css` flashes the slab
    // from grey to hot and settles it on the seal's red. Focus lands with it, so
    // an operator who cannot see the flash hears the button instead: it is the
    // only announcement this door makes, and it is the only one it owes.
    login.classList.add('is-armed')
    login.focus()
  }

  const stopTyping = typeDoor(layer, wells, arm)

  return new Promise<void>((resolve) => {
    let entered = false
    login.addEventListener('click', () => {
      if (entered) return
      entered = true
      login.disabled = true
      // Already detached by the fifteenth press; called again so that the one
      // path out of this layer is also the one place its listeners are known to
      // be gone, whatever a future edit does to the arming rule.
      stopTyping()
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
