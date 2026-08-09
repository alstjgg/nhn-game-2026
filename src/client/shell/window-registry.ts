// [u3#c6] The shell-owned window registry — the m3 merge surface.
//
// This is the ONLY module in the client that imports `windows/`. Each later
// unit (u4 · u4s · u5 · u6 · u7) fills exactly one file under `windows/` and
// touches nothing else: no shared barrel, no edit to index.html, no second
// module knowing the set of five. The shell reads the list from here to build
// the desk, the taskbar and the default layout, in this order.
import type { FixtureDriver } from '../driver/index.ts'
import type { WindowKey } from './layout.ts'
import { mount as mountLiveFeed } from '../windows/live-feed.ts'
import { mount as mountAgentFile } from '../windows/agent-file.ts'
import { mount as mountReports } from '../windows/reports.ts'

export interface WindowDef {
  /** Desk key — `data-win`, taskbar order, applyLayout key. */
  key: WindowKey
  /** DOM id, always `w-<key>`. */
  id: string
  /**
   * Title-bar and taskbar name — and, since x5, the ONLY name either carries.
   *
   * The reference gave every window a short Korean name for the taskbar (`ko`)
   * and a long Korean subtitle for the title bar (`sub`): `무전` / `실시간 무전
   * · 열람 전용`, `요원 파일` / `요원 파일 — 프롬프트 편성`, `부검` / `부검 —
   * 시행 기록`. Both are gone (민서, 08-08). Three windows on one desk do not
   * need six names for three things, and the subtitles were the desk explaining
   * itself to a reader who is already looking at the window — the LIVE FEED
   * announcing it is 열람 전용 above a pane with nothing to press in it.
   *
   * x10 (민서, 08-10) finished that cut on the third label. `tab` — the
   * two-letter code the frame printed on a trapezoid above the title bar, `LF` /
   * `AF` / `RP` — is gone with `.win-tab` itself: 제목 위의 RP · LF · AF 태그를
   * 없애고, 창 위치는 그대로 둘 것. It was never read anywhere else (the taskbar
   * chips print `en`), so once the element went the field was a REQUIRED label on
   * the registry that nothing rendered, which is worse than an absent one — a
   * fourth window would have had to invent a code for a surface that does not
   * exist. `en` is now the one and only name a window carries.
   */
  en: string
  /** The paper stock this window's body is printed on (u1's `paper.css`). */
  stock: string
  /** Whether the window carries the live dot (LIVE FEED does). */
  live?: boolean
  /**
   * A fixed sheet: no corner grip, no Shift+arrow resize. Absent means
   * resizable, so only the window that opts out says so. The AGENT FILE does —
   * its two pages are sized to its body, so any shrink clips the page-turn
   * control off the window and takes page 2 with it (C9).
   */
  resizable?: boolean
  /** The window's own contents — a stub until its unit lands. */
  mount: (host: HTMLElement, driver: FixtureDriver) => void
}

export const WINDOW_REGISTRY: readonly WindowDef[] = [
  { key: 'feed', id: 'w-feed', en: 'LIVE FEED', stock: 'fanfold', live: true, mount: mountLiveFeed },
  { key: 'file', id: 'w-file', en: 'AGENT FILE', stock: 'paper kraft', resizable: false, mount: mountAgentFile },
  { key: 'rep', id: 'w-rep', en: 'REPORTS', stock: 'paper bond', mount: mountReports },
]
