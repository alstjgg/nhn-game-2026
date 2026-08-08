// DeployButton — the run gate at the foot of the AGENT FILE, and the 파견 완료
// stamp that lands on the paper when it closes (spec-client §6).
//
// Ported from docs/design/phase2-ui/index.html 132..143 + `app.js` `syncDeployUI`
// (292..303) onto u1's vendored `.deploy-zone` / `.stamp` skin.
//
// Split model → builder (u4 D1): `deployView` is pure and is the only place the
// five readable states are decided — the counter, the note, the board's
// `data-state`, the button's, and whether the stamp is down (D11).
//
// U3 (playtest g3-1) — TALLY dissolves: this control now also carries the
// day's turn. Once the run closes (`shell/run-state.ts`'s `'tally'` phase),
// the SAME button becomes NEW RUN — what used to be `windows/tally.ts`'s own
// deleted new-run button. `deployView` resolves which of four faces the
// control wears (`deploy` · `settling` · `next` · `spent`); `buildDeployZone` paints
// whichever one it is handed and decides nothing itself. The settling/next/
// spent note text (WAITING/FILED_TAIL/LAPSED_TAIL/SPENT) is not decided here
// — it is written directly by `windows/agent-file.ts`'s ported hold/settle
// wiring, the same way `windows/tally.ts` once owned its wait line outright.
import { callsignOf } from './dossier.ts'
import { boardState, SLOT_CAP, usedIds } from './slot-board.ts'
import type { BoardState } from './slot-board.ts'
import { button, el } from '../shell/dom.ts'

const NOTE_EMPTY = '편성 없음 — 빈 파일로도 배치됩니다'
const NOTE_PARTIAL = '편성 중 — 배치를 기다립니다'
const NOTE_LOCKED = '배치됨 — 이번 시행에서 잠김'

const DEPLOY_MAIN = 'DEPLOY'
const DEPLOY_SUB = '배치 · 파일 잠금'

/**
 * W4 — the second label is gone; only the sub line survives. `NEW RUN` was the
 * NAME of the second press, and there is no second press: the same 배치 both
 * commits the file and opens the day it was built for.
 */
const NEW_RUN_SUB = '다음 시행 · '
const NEW_RUN_SUB_TAIL = '으로'

/** The four faces the merged control wears. */
export type DeployMode = 'deploy' | 'settling' | 'next' | 'spent'

export interface DeployView {
  used: number
  cap: number
  /** `"2 / 4"` — what `#slotCount` prints. */
  count: string
  /** What `#deployState` prints — blank once the day has closed (see header). */
  note: string
  stampOn: boolean
  /** `"ECHO-3 · 08:50"` — the sitting the file was committed for. */
  stampLine: string
  boardState: BoardState
  buttonState: 'ready' | 'deployed'
  mode: DeployMode
  /** `bd-main` — `DEPLOY` or `NEW RUN`. */
  mainLabel: string
  /** `bd-sub` — `배치 · 파일 잠금` or `다음 시행 · HH:MM으로`. */
  subLine: string
}

export interface DeployState {
  slots: readonly (string | null)[]
  deployed: boolean
  /** The run the file deployed for (`meta`), never a literal. */
  run: number
  /** `"HH:MM"` the run opens on — the pack's own stamp. */
  at: string
  /** The day has closed (run-state's `'tally'` phase) — absent means false. */
  closed?: boolean
  /** The hold has released, filed or lapsed — absent means false. */
  releasable?: boolean
  /** The allotment is spent — `new_run` was refused; absent means false. */
  spent?: boolean
  /** `"HH:MM"` the NEXT day opens on — absent means `''`. */
  nextAt?: string
}

/** Pure: board + run state → every string and flag the foot of the file shows. */
export function deployView(state: DeployState): DeployView {
  const used = usedIds(state.slots).length
  const closed = state.closed ?? false
  const releasable = state.releasable ?? false
  const spent = state.spent ?? false
  const nextAt = state.nextAt ?? ''
  const mode: DeployMode = spent ? 'spent' : closed ? (releasable ? 'next' : 'settling') : 'deploy'

  return {
    used,
    cap: SLOT_CAP,
    count: `${used} / ${SLOT_CAP}`,
    note: mode === 'deploy' ? (state.deployed ? NOTE_LOCKED : used > 0 ? NOTE_PARTIAL : NOTE_EMPTY) : '',
    stampOn: state.deployed,
    stampLine: `${callsignOf(state.run)} · ${state.at}`,
    boardState: boardState(state.slots, state.deployed),
    buttonState: state.deployed ? 'deployed' : 'ready',
    mode,
    // W4 — ONE button. The main label never changes: every press of it is a
    // 배치, and the sub line is the only thing that says which day it commits
    // for. `mode` still drives `data-op`, because the op the press actually
    // sends does change — and the membrane census reads it (see the builder).
    mainLabel: DEPLOY_MAIN,
    subLine: mode === 'deploy' ? DEPLOY_SUB : `${NEW_RUN_SUB}${nextAt}${NEW_RUN_SUB_TAIL}`,
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

  // x5 — the counter and the note are two lines, and the note gets the PAGE's
  // width rather than the column left over beside the button.
  //
  // They used to be one run joined by `·`: `0 / 4 슬롯 사용 · 편성 중`. That
  // worked while the note was two words. It stopped working when the settled
  // note became a full instruction — '인수 인계 완료 후 요원을 파견하여 시뮬레이션을
  // 재시도 하십시오' — which in a third-width window wrapped to three lines and
  // ran under the page-turn strip, and read as a sentence beginning with a
  // fraction. The counter is a READING and the note is a DIRECTION; they are
  // not one sentence and no longer set as one. Both ids are unchanged.
  const meta = el('div', 'dz-meta')
  meta.append(count, document.createTextNode(' 슬롯 사용'))

  const mainEl = el('span', 'bd-main')
  const subEl = el('span', 'bd-sub')
  const deploy = button('btn-deploy', '배치 — 요원 파일을 이번 시행 동안 잠급니다', '')
  deploy.id = 'btnDeploy'
  deploy.append(mainEl, subEl)
  deploy.addEventListener('click', onDeploy)

  const row = el('div', 'dz-row')
  row.append(meta, deploy)

  const root = el('div', 'deploy-zone')
  root.append(row, state)

  return {
    root,
    render(view) {
      count.textContent = view.count
      state.textContent = view.note
      mainEl.textContent = view.mainLabel
      subEl.textContent = view.subLine
      // The op the control performs rides its mode, for the PRD §4 membrane
      // census — one physical control, never both ops at once.
      deploy.dataset.op = view.mode === 'next' || view.mode === 'spent' ? 'new_run' : 'deploy'
      deploy.dataset.state = view.buttonState
      deploy.disabled = view.mode === 'next' ? false : view.mode === 'deploy' ? view.stampOn : true
    },
  }
}

export function buildDeployStamp(): DeployPart {
  const line = el('em')
  const root = el('div', 'stamp stamp-deploy')
  root.id = 'deployStamp'
  // x5b — 파견, not 배치. The confirmation plate already asks the operator to
  // send an agent 파견 and its button says so; the chop that lands a moment
  // later was still
  // reporting a 배치, which is warehouse vocabulary for a person going out on a
  // shift. One act, one word.
  root.append(el('span', undefined, '파 견 완 료'), line)

  return {
    root,
    render(view) {
      root.classList.toggle('on', view.stampOn)
      root.dataset.on = view.stampOn ? 'yes' : 'no'
      if (view.stampOn) line.textContent = view.stampLine
    },
  }
}
