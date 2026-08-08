// [u3#c1] [u3#c4] The window manager — the desk's only owner of window state.
//
// Rewritten in TS from docs/design/phase2-ui/app.js lines 51..97 (WINS,
// buildTaskbar, syncTaskbar, focusWin, openWin, toggleWin) and 123..170
// (initWindows — title-bar drag, corner-grip resize, collapse, close). The
// reference kept the set of windows in a module-global map; here the set comes
// from the shell-owned registry ([u3#c6]) and the default arrangement from the
// pure `applyLayout` ([u3#c2]).
//
// Geometry is written ONLY as custom properties (`--x --y --w --h --z`) — u1's
// skin reads them, and every `.win` shares one stacking context because
// `#desktop` is `display:contents` (design README 'Notes').
import type { FixtureDriver } from '../driver/index.ts'
import type { WindowDef } from './window-registry.ts'
import type { Viewport, WindowKey, WinRect } from './layout.ts'
import { applyLayout, DESK_ORDER } from './layout.ts'
import { buildWindowFrame } from '../components/window-frame.ts'
import type { WindowFrame } from '../components/window-frame.ts'
import { button, el } from './dom.ts'

/** Smallest box a resize may leave behind (reference: 300×140). */
const MIN_W = 300
const MIN_H = 140
/** How far one arrow key nudges a window ([u3#c5] keyboard move). */
const KEY_STEP = 12
/**
 * Drag clamps. A window may hang off an edge by at most a title bar's worth —
 * past that it is out of reach, and the desk has to stay recoverable by drag
 * alone (there is no "move to front" menu anywhere in this build). The top is
 * clamped harder: nothing may slide under the chrome.
 */
const EDGE_SLACK = 40
const CHROME_BAND = 76
/** The desk's z floor; focus raises above every window already on the desk. */
const Z_BASE = 30

export interface WindowManager {
  /** Every frame on the desk, in registry order. */
  readonly frames: readonly WindowFrame[]
  /** Re-computes the default arrangement for `viewport` ([u3#c2]). */
  arrange(viewport: Viewport): void
  focus(key: WindowKey): void
}

interface Deps {
  desk: HTMLElement
  taskbar: HTMLElement
  registry: readonly WindowDef[]
  driver: FixtureDriver
  /** Taskbar footer hint — the reference's `.tb-hint`. */
  hint: string
}

const setPx = (node: HTMLElement, prop: string, value: number): void => {
  node.style.setProperty(prop, `${Math.round(value)}px`)
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export function createWindowManager(deps: Deps): WindowManager {
  const frames = deps.registry.map(buildWindowFrame)
  const byKey = new Map<WindowKey, WindowFrame>(frames.map((f) => [f.def.key, f]))
  const tasks = new Map<WindowKey, HTMLButtonElement>()
  let zTop = Z_BASE + frames.length

  function syncTaskbar(): void {
    for (const frame of frames) {
      const task = tasks.get(frame.def.key)
      if (!task) continue
      task.classList.toggle('open', !frame.root.classList.contains('hidden'))
      task.classList.toggle('focused', frame.root.classList.contains('focused'))
    }
  }

  function focus(key: WindowKey): void {
    const frame = byKey.get(key)
    if (!frame) return
    for (const other of frames) other.root.classList.remove('focused')
    frame.root.classList.add('focused')
    zTop += 1
    frame.root.style.setProperty('--z', String(zTop))
    syncTaskbar()
  }

  function open(key: WindowKey): void {
    const frame = byKey.get(key)
    if (!frame) return
    frame.root.classList.remove('hidden', 'collapsed')
    focus(key)
  }

  function toggle(key: WindowKey): void {
    const frame = byKey.get(key)
    if (!frame) return
    if (frame.root.classList.contains('hidden')) return open(key)
    if (!frame.root.classList.contains('focused')) return focus(key)
    frame.root.classList.add('hidden')
    syncTaskbar()
  }

  function move(frame: WindowFrame, x: number, y: number): void {
    const rect = frame.root.getBoundingClientRect()
    const maxX = Math.max(-EDGE_SLACK, window.innerWidth - rect.width + EDGE_SLACK)
    const maxY = Math.max(CHROME_BAND, window.innerHeight - rect.height + EDGE_SLACK)
    setPx(frame.root, '--x', clamp(x, -EDGE_SLACK, maxX))
    setPx(frame.root, '--y', clamp(y, CHROME_BAND, maxY))
  }

  function wireDrag(frame: WindowFrame): void {
    frame.bar.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('.wc')) return
      event.preventDefault()
      const rect = frame.root.getBoundingClientRect()
      const ox = event.clientX - rect.left
      const oy = event.clientY - rect.top
      frame.root.classList.add('dragging')
      frame.bar.setPointerCapture(event.pointerId)

      const onMove = (ev: PointerEvent): void => move(frame, ev.clientX - ox, ev.clientY - oy)
      const onUp = (): void => {
        frame.root.classList.remove('dragging')
        frame.bar.removeEventListener('pointermove', onMove)
        frame.bar.removeEventListener('pointerup', onUp)
      }
      frame.bar.addEventListener('pointermove', onMove)
      frame.bar.addEventListener('pointerup', onUp)
    })

    frame.bar.addEventListener('keydown', (event: KeyboardEvent) => {
      const step: Record<string, [number, number]> = {
        ArrowLeft: [-KEY_STEP, 0],
        ArrowRight: [KEY_STEP, 0],
        ArrowUp: [0, -KEY_STEP],
        ArrowDown: [0, KEY_STEP],
      }
      const delta = step[event.key]
      if (!delta) return
      event.preventDefault()
      const rect = frame.root.getBoundingClientRect()
      // Shift+arrow RESIZES where arrow moves (R2 on window-frame.ts:55): resize
      // was pointer-only, and two of the four booted windows ship clipped — the
      // block deck is 843 px tall inside a 257 px body — so a keyboard operator
      // could not see the deck at all (WCAG 2.1.1, Level A). Same MIN_W/MIN_H
      // clamp as the drag; the bar's accessible name says so.
      //
      // A fixed sheet is the one exception, and it is gated HERE rather than
      // desk-wide for exactly the reason above: this branch exists BECAUSE a
      // pointer-only resize left clipped content unreachable, so a window that
      // still resizes by pointer must keep it. The sheet resizes by neither.
      if (event.shiftKey) {
        if (frame.def.resizable === false) return
        resize(frame, rect.width + delta[0], rect.height + delta[1])
        return
      }
      move(frame, rect.left + delta[0], rect.top + delta[1])
    })
  }

  function resize(frame: WindowFrame, width: number, height: number): void {
    setPx(frame.root, '--w', Math.max(MIN_W, width))
    setPx(frame.root, '--h', Math.max(MIN_H, height))
  }

  function wireResize(frame: WindowFrame): void {
    // A fixed sheet builds no grip, so there is nothing to wire. The pointer
    // path and the keyboard path leave together: a window that resized by mouse
    // only would be the WCAG 2.1.1 failure the Shift+arrow branch above was
    // added to fix. Bound to a local `const` because a narrowed readonly
    // property does not stay narrowed inside these callbacks.
    const grip = frame.grip
    if (grip === null) return
    grip.addEventListener('pointerdown', (event: PointerEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = frame.root.getBoundingClientRect()
      const sx = event.clientX
      const sy = event.clientY
      grip.setPointerCapture(event.pointerId)

      const onMove = (ev: PointerEvent): void => {
        resize(frame, rect.width + ev.clientX - sx, rect.height + ev.clientY - sy)
      }
      const onUp = (): void => {
        grip.removeEventListener('pointermove', onMove)
        grip.removeEventListener('pointerup', onUp)
      }
      grip.addEventListener('pointermove', onMove)
      grip.addEventListener('pointerup', onUp)
    })
  }

  function wire(frame: WindowFrame): void {
    const key = frame.def.key
    frame.root.addEventListener('pointerdown', () => focus(key), true)
    frame.collapse.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation()
      frame.root.classList.toggle('collapsed')
    })
    frame.close.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation()
      frame.root.classList.add('hidden')
      syncTaskbar()
    })
    wireDrag(frame)
    wireResize(frame)
  }

  function buildTaskbar(): void {
    deps.taskbar.replaceChildren()
    for (const frame of frames) {
      const def = frame.def
      const task = button('task', `${def.en} 창 열기 · 닫기`, '')
      task.dataset.win = def.key
      task.append(el('b', undefined, def.en), el('span', 't-ko', def.ko))
      task.addEventListener('click', () => toggle(def.key))
      tasks.set(def.key, task)
      deps.taskbar.append(task)
    }
    deps.taskbar.append(el('div', 'tb-hint', deps.hint))
  }

  function place(frame: WindowFrame, rect: WinRect): void {
    setPx(frame.root, '--x', rect.x)
    setPx(frame.root, '--y', rect.y)
    setPx(frame.root, '--w', rect.w)
    setPx(frame.root, '--h', rect.h)
  }

  function arrange(viewport: Viewport): void {
    const desk = applyLayout(viewport)
    for (const frame of frames) place(frame, desk[frame.def.key])
  }

  frames.forEach((frame, index) => {
    frame.root.style.setProperty('--z', String(Z_BASE + index))
    frame.def.mount(frame.body, deps.driver)
    wire(frame)
  })
  // Mounted in REGISTRY order (the taskbar's), placed on the desk in READING
  // order: `#desktop`'s child order is the tab order, and it has to match what
  // `applyLayout` puts on screen (WCAG 2.4.3 — see `DESK_ORDER`). Stacking is
  // unaffected: every `.win` is z-ordered by its own `--z`.
  for (const key of DESK_ORDER) {
    const frame = byKey.get(key)
    if (frame) deps.desk.append(frame.root)
  }
  // A registry entry `DESK_ORDER` does not name still reaches the desk.
  for (const frame of frames) if (!frame.root.isConnected) deps.desk.append(frame.root)
  buildTaskbar()
  syncTaskbar()

  return { frames, arrange, focus }
}
