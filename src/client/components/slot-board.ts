// SlotBoard — §4 인수인계 사항: the membrane the operator actually operates
// (spec-client §6 · §5.2). Ported from docs/design/phase2-ui/app.js
// `buildSlots`/`placeInSlot`/`unslot` (235..291) onto u1's vendored `.slots`
// skin, rewritten against the seam.
//
// Split model → builder (u4 D1): `planOps` is the ONE place a slot/unslot/deploy
// sequence is decided. It is pure — it emits nothing, it only says what would be
// emitted and what the board would then hold — so the DOM half below owns no
// second rule set and neither can u4s (D7: `place`/`clear` are the only mutators).
//
// Every op leaves through `emit()`, which treats a throwing or refusing seam as
// a rejection and keeps the board's state untouched (R4).
import type { MembraneOp, Sentence } from '../driver/index.ts'
import { announce } from '../shell/announcer.ts'
import { button, el } from '../shell/dom.ts'
import { blockCardModel, buildBlockCard, pad2, pickedBlockId, setPickedBlockId } from './block-card.ts'

/** spec-client §9 dev value, not a guess. */
export const SLOT_CAP = 4

/** The slot's own copy, ported verbatim from the design target (`app.js` 262). */
const EMPTY_HINT = '부검 창에서 문장을 누르면 이 칸에 앉습니다'
const LOCKED_HINT = '— 비어 있음 (잠김)'

export interface SlotCell {
  slot: number
  blockId: string | null
}

/** Exactly `SLOT_CAP` cells, whatever length the caller hands in. */
export function slotCells(slots: readonly (string | null)[]): SlotCell[] {
  return Array.from({ length: SLOT_CAP }, (_, slot) => ({ slot, blockId: slots[slot] ?? null }))
}

/** The authored ids a board holds, in slot order, deduplicated. */
export function usedIds(slots: readonly (string | null)[]): string[] {
  const ids = slots.filter((id): id is string => typeof id === 'string' && id.length > 0)
  return [...new Set(ids)]
}

export type BoardState = 'empty' | 'partial' | 'full' | 'locked'

/** D11 — the four `.slots[data-state]` values, decided once, here. */
export function boardState(slots: readonly (string | null)[], deployed: boolean): BoardState {
  if (deployed) return 'locked'
  const used = usedIds(slots).length
  if (used === 0) return 'empty'
  return used < SLOT_CAP ? 'partial' : 'full'
}

export type SlotAction =
  | { kind: 'place'; blockId: string; slot: number }
  | { kind: 'clear'; slot: number }
  | { kind: 'deploy' }

/** What the desk says out loud when the membrane accepts an action (PRD §4). */
export function announcementOfAction(action: SlotAction): string {
  if (action.kind === 'deploy') return '배치 완료 — 요원 파일이 잠겼습니다'
  const no = pad2(action.slot + 1)
  return action.kind === 'place' ? `슬롯 ${no} 배치` : `슬롯 ${no} 해제`
}

export interface OpPlan {
  ops: MembraneOp[]
  slots: (string | null)[]
  deployed: boolean
}

/**
 * Pure: what an action would emit and what the board would then hold.
 *
 * A deployed file absorbs everything (spec-client §5.2 — the run is committed),
 * an id never sits in two slots at once, and deploy carries the slotted SET.
 */
export function planOps(
  state: { slots: readonly (string | null)[]; deployed: boolean },
  action: SlotAction,
): OpPlan {
  const slots = slotCells(state.slots).map((cell) => cell.blockId)
  if (state.deployed) return { ops: [], slots, deployed: true }

  const ops: MembraneOp[] = []

  if (action.kind === 'deploy') {
    ops.push({ op: 'deploy', blocks: usedIds(slots) })
    return { ops, slots, deployed: true }
  }

  if (action.slot < 0 || action.slot >= SLOT_CAP) return { ops, slots, deployed: false }

  if (action.kind === 'clear') {
    if (slots[action.slot] === null) return { ops, slots, deployed: false }
    slots[action.slot] = null
    ops.push({ op: 'unslot', slot: action.slot })
    return { ops, slots, deployed: false }
  }

  // place — free the id's old seat, then the target seat's occupant.
  const held = slots.indexOf(action.blockId)
  if (held >= 0 && held !== action.slot) {
    slots[held] = null
    ops.push({ op: 'unslot', slot: held })
  }
  const occupant = slots[action.slot]
  if (occupant !== null && occupant !== action.blockId) {
    ops.push({ op: 'unslot', slot: action.slot })
  }
  slots[action.slot] = action.blockId
  ops.push({ op: 'slot', block_id: action.blockId, slot: action.slot })
  return { ops, slots, deployed: false }
}

/* ══ the builder half — the DOM the plan drives ══════════════════════════ */

export interface SlotBoardOptions {
  /** `false` ⇒ the seam refused; the board keeps its state (R4). */
  emit(op: MembraneOp): boolean
  /** The window's id→Sentence index; `null` ⇒ F1's fallback card. */
  resolve(blockId: string): Sentence | null
  /** Fired after a mutation the seam accepted. */
  onChange(slots: (string | null)[], deployed: boolean): void
}

export interface SlotBoard {
  /** The `#slotBoard` host §4 embeds — the board owns it, nothing else writes it. */
  readonly root: HTMLElement
  place(blockId: string, slot: number): void
  clear(slot: number): void
  deploy(): void
  /** The run moved on: the file opens again (D10). */
  unlock(): void
  isLocked(): boolean
  cells(): (string | null)[]
  render(): void
}

let mounted: SlotBoard | null = null

/** One desk, one AGENT FILE, one board (D7). */
export function getSlotBoard(): SlotBoard | null {
  return mounted
}

export function createSlotBoard(options: SlotBoardOptions): SlotBoard {
  const root = el('div', 'slots')
  root.id = 'slotBoard'

  let slots: (string | null)[] = slotCells([]).map((cell) => cell.blockId)
  let deployed = false

  function emit(op: MembraneOp): boolean {
    try {
      return options.emit(op)
    } catch (rejection) {
      // R4 — an op the run scripts no response for throws at the seam. A
      // rejected op is a no-op for the file, never a crashed desk.
      void rejection
      return false
    }
  }

  function apply(action: SlotAction): void {
    const plan = planOps({ slots, deployed }, action)
    if (plan.ops.length === 0) return
    for (const op of plan.ops) {
      if (!emit(op)) {
        render()
        return
      }
    }
    slots = plan.slots
    deployed = plan.deployed
    render()
    // The membrane ACCEPTED it. `deploy` and `unslot` have no event echo on the
    // ratified seam, so the op's own answer is the only signal an operator
    // driving by ear ever gets (R2 on index.html:125).
    announce(announcementOfAction(action))
    options.onChange([...slots], deployed)
  }

  function buildSlot(cell: SlotCell): HTMLElement {
    const node = el('div', 'slot')
    const no = pad2(cell.slot + 1)
    node.dataset.slot = String(cell.slot)
    node.dataset.no = no
    if (deployed) node.classList.add('locked')

    if (cell.blockId !== null) {
      node.classList.add('filled')
      // I1 (spec-client §3 inv 3): the slot holds an authored ID, and the pin
      // anchor carries the same one — u8's RedThread pins to it.
      node.dataset.blockId = cell.blockId
      const card = buildBlockCard(blockCardModel(cell.blockId, options.resolve(cell.blockId)), {
        inSlot: true,
      })
      const pin = el('span', 'slot-pin')
      pin.dataset.blockId = cell.blockId
      pin.setAttribute('aria-hidden', 'true')
      node.append(card, pin)
      if (!deployed) {
        const unset = button('slot-unset', `슬롯 ${no} 해제`, '해제')
        // The `unslot` op's control, marked for the PRD §4 membrane census.
        unset.dataset.op = 'unslot'
        unset.addEventListener('click', (event) => {
          event.stopPropagation()
          apply({ kind: 'clear', slot: cell.slot })
        })
        node.append(unset)
      }
    } else if (deployed) {
      node.append(el('div', 'slot-empty', LOCKED_HINT))
    } else {
      // A real button, so the membrane op is reachable by keyboard alone
      // (inv 1 + PRD §4 a11y). Enter and Space both fire its click.
      const target = button('slot-empty slot-target', `슬롯 ${no}에 배치`, EMPTY_HINT)
      // The `slot` op's control, marked for the PRD §4 membrane census.
      target.dataset.op = 'slot'
      node.append(target)
    }

    node.addEventListener('click', () => {
      if (deployed) return
      const armed = pickedBlockId()
      if (armed === null) return
      setPickedBlockId(null)
      apply({ kind: 'place', blockId: armed, slot: cell.slot })
    })
    node.addEventListener('dragover', (event) => {
      if (deployed) return
      event.preventDefault()
      node.classList.add('droppable')
    })
    node.addEventListener('dragleave', () => node.classList.remove('droppable'))
    node.addEventListener('drop', (event) => {
      event.preventDefault()
      node.classList.remove('droppable')
      if (deployed) return
      const dropped = event.dataTransfer?.getData('text/plain') ?? ''
      if (dropped.length > 0) apply({ kind: 'place', blockId: dropped, slot: cell.slot })
    })

    return node
  }

  function render(): void {
    root.dataset.state = boardState(slots, deployed)
    root.replaceChildren(...slotCells(slots).map(buildSlot))
  }

  const board: SlotBoard = {
    root,
    place: (blockId, slot) => apply({ kind: 'place', blockId, slot }),
    clear: (slot) => apply({ kind: 'clear', slot }),
    deploy: () => apply({ kind: 'deploy' }),
    unlock: () => {
      if (!deployed) return
      deployed = false
      render()
      options.onChange([...slots], deployed)
    },
    isLocked: () => deployed,
    cells: () => [...slots],
    render,
  }

  mounted = board
  render()
  return board
}
