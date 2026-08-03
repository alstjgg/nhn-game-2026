// WindowFrame — the chrome every desk window reuses (spec-client §6).
//
// Ported from docs/design/phase2-ui/index.html lines 105..120 + 146..148: the
// file tab, the title bar (dot ·名 · controls), the body and the corner grip,
// on u1's `.win / .win-tab / .win-bar / .win-ctl / .win-body / .win-grip`
// selectors. The reference pinned each window's geometry in the markup; here
// the frame is built with no geometry at all — applyLayout writes `--x/--y/
// --w/--h` and the manager writes `--z`, so nothing is hard-positioned.
//
// A11y ([u3#c5]): the frame is a named region, the title bar is a focusable
// move handle, and both controls are real buttons with accessible names.
import type { WindowDef } from '../shell/window-registry.ts'
import { button, el } from '../shell/dom.ts'

export interface WindowFrame {
  readonly def: WindowDef
  readonly root: HTMLElement
  readonly bar: HTMLElement
  readonly body: HTMLElement
  readonly grip: HTMLElement
  readonly collapse: HTMLButtonElement
  readonly close: HTMLButtonElement
}

export function buildWindowFrame(def: WindowDef): WindowFrame {
  const root = el('section', `win win-${def.key}`)
  root.id = def.id
  root.dataset.win = def.key
  root.setAttribute('aria-label', `${def.en} · ${def.sub}`)

  const tab = el('div', 'win-tab', def.tab)

  const bar = el('header', 'win-bar')
  bar.tabIndex = 0
  bar.setAttribute('aria-label', `${def.en} 창 이동 — 방향키로 옮깁니다`)

  const dot = el('span', def.live === true ? 'win-dot live' : 'win-dot')
  dot.setAttribute('aria-hidden', 'true')

  const title = el('h2')
  title.append(document.createTextNode(def.en), el('i', undefined, def.sub))

  const collapse = button('wc wc-min', `${def.en} 접기`, '—')
  const close = button('wc wc-close', `${def.en} 닫기`, '×')
  const ctl = el('div', 'win-ctl')
  ctl.append(collapse, close)
  bar.append(dot, title, ctl)

  // The stock is the frame's, not the contents': u1 shipped `paper.css` for it
  // and the reference prints it in the markup (`<div class="win-body paper
  // kraft">`). The body stays EMPTY here — u4 · u4s · u5 · u6 · u7 fill it.
  const body = el('div', `win-body ${def.stock}`)

  const grip = el('div', 'win-grip')
  grip.setAttribute('aria-hidden', 'true')

  root.append(tab, bar, body, grip)
  return { def, root, bar, body, grip, collapse, close }
}
