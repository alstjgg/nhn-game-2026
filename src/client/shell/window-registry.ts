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
import { mount as mountBlockStore } from '../windows/block-store.ts'
import { mount as mountReports } from '../windows/reports.ts'
import { mount as mountTally } from '../windows/tally.ts'

export interface WindowDef {
  /** Desk key — `data-win`, taskbar order, applyLayout key. */
  key: WindowKey
  /** DOM id, always `w-<key>`. */
  id: string
  /** Title-bar and taskbar name. */
  en: string
  /** The short Korean name the taskbar carries (reference: `WINS[].ko`). */
  ko: string
  /** The long Korean subtitle the title bar carries. */
  sub: string
  /** The file-tab code above the frame. */
  tab: string
  /** The paper stock this window's body is printed on (u1's `paper.css`). */
  stock: string
  /** Whether the window carries the live dot (LIVE FEED does). */
  live?: boolean
  /** The window's own contents — a stub until its unit lands. */
  mount: (host: HTMLElement, driver: FixtureDriver) => void
}

export const WINDOW_REGISTRY: readonly WindowDef[] = [
  { key: 'feed', id: 'w-feed', en: 'LIVE FEED', ko: '무전', sub: '실시간 무전 · 열람 전용', tab: 'LF', stock: 'fanfold', live: true, mount: mountLiveFeed },
  { key: 'file', id: 'w-file', en: 'AGENT FILE', ko: '요원 파일', sub: '요원 파일 — 프롬프트 편성', tab: 'AF', stock: 'paper kraft', mount: mountAgentFile },
  { key: 'store', id: 'w-store', en: 'BLOCK STORE', ko: '보관함', sub: '보관함 — 채굴한 문장', tab: 'BS', stock: 'paper card-stock', mount: mountBlockStore },
  { key: 'rep', id: 'w-rep', en: 'REPORTS', ko: '부검', sub: '부검 — 시행 기록', tab: 'RP', stock: 'paper bond', mount: mountReports },
  { key: 'tally', id: 'w-tally', en: 'TALLY', ko: '집계', sub: '집계 — 시행 결과', tab: 'TL', stock: 'paper ledger', mount: mountTally },
]
