// DeployButton — the run gate at the foot of the AGENT FILE, and the 배치 완료
// stamp that lands on the paper when it closes (spec-client §6).
//
// Ported from docs/design/phase2-ui/index.html 132..143 + `app.js` `syncDeployUI`
// (292..303) onto u1's vendored `.deploy-zone` / `.stamp` skin.
//
// Split model → builder (u4 D1): `deployView` is pure and is the only place the
// five readable states are decided — the counter, the note, the board's
// `data-state`, the button's, and whether the stamp is down (D11).
import { pad2 } from './block-card.ts'
import { boardState, SLOT_CAP, usedIds } from './slot-board.ts'
import type { BoardState } from './slot-board.ts'
import { button, el } from '../shell/dom.ts'

const NOTE_EMPTY = '편성 없음 — 빈 파일로도 배치됩니다'
const NOTE_PARTIAL = '편성 중 — 배치를 기다립니다'
const NOTE_LOCKED = '배치됨 — 이번 시행에서 잠김'

export interface DeployView {
  used: number
  cap: number
  /** `"2 / 4"` — what `#slotCount` prints. */
  count: string
  /** What `#deployState` prints. */
  note: string
  stampOn: boolean
  /** `"RUN 03 · 08:50"` — the run the file was committed for. */
  stampLine: string
  boardState: BoardState
  buttonState: 'ready' | 'deployed'
}

export interface DeployState {
  slots: readonly (string | null)[]
  deployed: boolean
  /** The run the file deployed for (`meta`), never a literal. */
  run: number
  /** `"HH:MM"` the run opens on — the pack's own stamp. */
  at: string
}

/** Pure: board + run state → every string and flag the foot of the file shows. */
export function deployView(state: DeployState): DeployView {
  const used = usedIds(state.slots).length
  return {
    used,
    cap: SLOT_CAP,
    count: `${used} / ${SLOT_CAP}`,
    note: state.deployed ? NOTE_LOCKED : used > 0 ? NOTE_PARTIAL : NOTE_EMPTY,
    stampOn: state.deployed,
    stampLine: `RUN ${pad2(state.run)} · ${state.at}`,
    boardState: boardState(state.slots, state.deployed),
    buttonState: state.deployed ? 'deployed' : 'ready',
  }
}

/* ══ the builder half ════════════════════════════════════════════════════ */

export interface DeployPart {
  readonly root: HTMLElement
  render(view: DeployView): void
}

export function buildDeployZone(onDeploy: () => void): DeployPart {
  const count = el('span')
  count.id = 'slotCount'
  const state = el('span')
  state.id = 'deployState'

  const meta = el('div', 'dz-meta')
  meta.append(count, document.createTextNode(' 슬롯 사용 · '), state)

  const deploy = button('btn-deploy', '배치 — 요원 파일을 이번 시행 동안 잠급니다', '')
  deploy.id = 'btnDeploy'
  deploy.append(el('span', 'bd-main', 'DEPLOY'), el('span', 'bd-sub', '배치 · 파일 잠금'))
  deploy.addEventListener('click', onDeploy)

  const root = el('div', 'deploy-zone')
  root.append(meta, deploy)

  return {
    root,
    render(view) {
      count.textContent = view.count
      state.textContent = view.note
      deploy.dataset.state = view.buttonState
      deploy.disabled = view.stampOn
    },
  }
}

export function buildDeployStamp(): DeployPart {
  const line = el('em')
  const root = el('div', 'stamp stamp-deploy')
  root.id = 'deployStamp'
  root.append(el('span', undefined, '배 치 완 료'), line)

  return {
    root,
    render(view) {
      root.classList.toggle('on', view.stampOn)
      root.dataset.on = view.stampOn ? 'yes' : 'no'
      if (view.stampOn) line.textContent = view.stampLine
    },
  }
}
