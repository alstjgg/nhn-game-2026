// The sheet the portal issues at sign-in — the one window on the desk when the
// session opens, and the last thing between a judge and the desk itself.
//
// It is NOT a sixth desk window. `WINDOW_REGISTRY` is the m3 merge surface and
// `applyLayout` returns a `Record<WindowKey, WinRect>`; adding a key to either
// would widen a contract that four suites pin, to model something that is not
// an instrument. A document the portal hands over once, and that closes for
// good, only needs the frame — so this module borrows the frame's classes and
// centres itself, and the registry, the taskbar and the layout stay untouched.
//
// Geometry is written the way every window's is: custom properties only, never
// `style.width` (`tests/shell/shell-source.test.ts` [C12/inv 8] (c)).
import { button, el } from './dom.ts'
import { PORTAL, SIGN_IN } from './portal-identity.ts'

/**
 * PLACEHOLDER COPY — replace this object wholesale.
 *
 * It is deliberately real enough to read and be screenshotted (a judge meets it
 * before anything else), and it is stamped 초안 on the sheet so nobody mistakes
 * the draft for the issued text. Nothing else in the module reads anything but
 * these strings: swapping them is the whole edit, and deleting `chop` removes
 * the draft stamp.
 */
export const MANUAL = {
  docNo: 'ERR-2 / OM-01',
  issued: '모의운영과',
  grade: '내부용',
  title: '신규 운영자 운용 안내서',
  note: '최초 접속 시 1회 표시',
  lede:
    '본 단말은 이미 종료된 하루를 다시 돌려보는 모의 장치입니다. 운영자는 상황실을 벗어나지 않고, ' +
    '회선 너머에서 들어오는 말과 기록만으로 판단합니다. 아래 내용을 확인한 뒤 창을 닫으면 단말이 인수되고 ' +
    '첫 시행이 시작됩니다.',
  sections: [
    {
      head: '단말 인수',
      body:
        '이 안내서는 최초 접속에만 표시됩니다. 닫은 뒤에는 다시 열리지 않으므로, 필요한 내용은 지금 확인하십시오.',
    },
    {
      head: '책상 구성',
      body:
        '무전(LIVE FEED)은 하루를 실시간으로 받아 적습니다. 부검(REPORTS)은 지나간 시행의 기록이고, ' +
        '기록에서 채굴한 문장을 집어 요원 파일의 빈 칸에 앉힙니다. 요원 파일(AGENT FILE)은 요원을 편성하는 자리입니다.',
    },
    {
      head: '요원 편성',
      body:
        '운영자는 요원에게 직접 지시하지 않습니다. 기록에서 문장을 골라 요원 파일의 칸에 배치하면, ' +
        '그 문장이 요원의 판단 기준이 됩니다. 무엇을 넣었는지가 곧 그날의 결과입니다.',
    },
    {
      head: '시행과 집계',
      body:
        '하루는 08:50에 시작해 21:04에 닫힙니다. 시행이 끝나면 집계가 열리고, 남은 시행 횟수만큼 다시 편성할 수 있습니다.',
    },
  ],
  office: '상황대응본부 모의운영과장',
  chop: '초안',
  foot: '확인 후 창을 닫으면 단말이 인수됩니다.',
  ack: '확인 — 단말 인수',
} as const

/** The sheet's box, in the desk's own terms (`layout.ts`: chrome band 94, gutter 14). */
const CHROME_BAND = 94
const GUTTER = 14
const MAX_W = 760
/** Tall enough that the issued text is read, not scrolled past, at 1280×800. */
const MAX_H = 648
/** Above every desk window (z base 30), below the top bar (500) and the door. */
const Z = 480

interface Viewport {
  width: number
  height: number
}

const setPx = (node: HTMLElement, prop: string, value: number): void => {
  node.style.setProperty(prop, `${Math.round(value)}px`)
}

function place(root: HTMLElement, viewport: Viewport): void {
  const deskH = Math.max(1, viewport.height - CHROME_BAND - GUTTER)
  const w = Math.min(MAX_W, viewport.width - GUTTER * 2)
  const h = Math.min(MAX_H, deskH)
  setPx(root, '--x', Math.max(GUTTER, (viewport.width - w) / 2))
  setPx(root, '--y', CHROME_BAND + Math.max(0, (deskH - h) / 2))
  setPx(root, '--w', w)
  setPx(root, '--h', h)
}

function masthead(): HTMLElement {
  const meta = el('div', 'man-meta')
  meta.append(
    el('span', undefined, `문서번호 ${MANUAL.docNo}`),
    el('span', undefined, `발행 ${SIGN_IN.agency} · ${MANUAL.issued}`),
    el('span', 'man-grade', MANUAL.grade),
  )

  const head = el('div', 'man-hd')
  head.append(el('h3', undefined, MANUAL.title), el('i', undefined, MANUAL.note))

  const wrap = el('div')
  wrap.append(meta, head, el('p', 'man-lede', MANUAL.lede))
  return wrap
}

function clauses(): HTMLElement {
  const list = el('ol', 'man-secs')
  for (const section of MANUAL.sections) {
    const item = el('li')
    const body = el('div')
    body.append(el('b', undefined, section.head), el('p', undefined, section.body))
    item.append(body)
    list.append(item)
  }
  return list
}

function signature(): HTMLElement {
  const sig = el('div', 'man-sig')
  const chop = el('span', 'man-chop', MANUAL.chop)
  chop.setAttribute('aria-hidden', 'true')
  sig.append(el('span', 'man-sigline', MANUAL.office), chop)
  return sig
}

/**
 * Opens the sheet and resolves the moment it is dismissed.
 *
 * It resolves as the exit animation STARTS, not after it: the caller reveals the
 * desk on that resolution, so the sheet lifts off the desk it uncovers instead
 * of the screen going empty between the two.
 */
export function openManual(app: HTMLElement, viewport: Viewport): Promise<void> {
  const root = el('section', 'win win-manual')
  root.id = 'w-manual'
  root.setAttribute('aria-label', `${MANUAL.title} — ${PORTAL.portal}`)
  root.style.setProperty('--z', String(Z))
  place(root, viewport)

  const bar = el('header', 'win-bar')
  const dot = el('span', 'win-dot')
  dot.setAttribute('aria-hidden', 'true')
  const title = el('h2')
  title.append(document.createTextNode('ONBOARDING MANUAL'), el('i', undefined, MANUAL.title))
  const close = button('wc wc-close', `${MANUAL.title} 닫기`, '×')
  const ctl = el('div', 'win-ctl')
  ctl.append(close)
  bar.append(dot, title, ctl)

  const sheet = el('div', 'man-sheet')
  sheet.append(masthead(), clauses(), signature())

  const foot = el('div', 'man-foot')
  const ack = button('man-ack', MANUAL.ack, '')
  ack.append(document.createTextNode(MANUAL.ack), el('em', undefined, '↵'))
  foot.append(el('span', undefined, MANUAL.foot), ack)

  const body = el('div', 'win-body paper bond')
  body.append(sheet, foot)

  root.append(el('div', 'win-tab', 'OM'), bar, body)
  app.append(root)

  requestAnimationFrame(() => ack.focus())

  return new Promise<void>((resolve) => {
    let closed = false
    const dismiss = (): void => {
      if (closed) return
      closed = true
      root.classList.add('is-closing')
      window.setTimeout(() => root.remove(), 460)
      document.removeEventListener('keydown', onKey)
      resolve()
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') dismiss()
    }
    close.addEventListener('click', dismiss)
    ack.addEventListener('click', dismiss)
    document.addEventListener('keydown', onKey)
  })
}
