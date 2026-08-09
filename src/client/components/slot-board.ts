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

/**
 * The blank's own copy.
 *
 * x4 — was '부검 창에서 문장을 누르면 이 칸에 앉습니다', ported from the design
 * target (`app.js` 262) back when it was printed four times, once per empty box.
 * There is one blank now (below), so the line can say what the file is FOR
 * rather than what a box does: the operator is writing a handover, and the
 * sentences come out of the record.
 */
const EMPTY_HINT = '다음 요원에게 인수인계할 사항을 기록에서 가져오세요'
/** …and what the blank says once the file is committed and nothing went in. */
const LOCKED_HINT = '인수인계 사항 없음 — 잠김'

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
  // x5b — moved with the chop (`deploy-button.ts`). This line and that stamp
  // report the same instant to two different senses, and an operator driving by
  // ear must not be told 배치 완료 while the paper says 파견 완료.
  if (action.kind === 'deploy') return '파견 완료 — 요원 파일이 잠겼습니다'
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

  /** Where the next sentence would sit, or `null` when the file is full. */
  function firstFree(): number | null {
    const seat = slotCells(slots).find((cell) => cell.blockId === null)
    return seat === undefined ? null : seat.slot
  }

  /**
   * One seated sentence, as a RUN OF TEXT rather than a card in a box.
   *
   * x4 — the four boxes are gone. What the operator is assembling is a handover
   * paragraph, and it now reads as one: 01 · the sentence · 해제 · 02 · the
   * sentence · 해제 · … in a single justified flow. The boxes made four
   * sentences look like four objects off a deck — the same reading T1 already
   * took the card FACE away for. What is left is the file's own prose, with the
   * slot number and its release sitting in the margin of the line they belong
   * to. Every attribute a filled slot carried is carried still (`data-slot`,
   * `data-no`, `data-block-id`, the `.slot-pin` anchor, the `[data-op=unslot]`
   * control), because the thread layer, the membrane census and the tutorial
   * all reach for them by name.
   */
  function buildSeat(cell: SlotCell, blockId: string): HTMLElement {
    const node = el('span', 'slot filled')
    const no = pad2(cell.slot + 1)
    node.dataset.slot = String(cell.slot)
    node.dataset.no = no
    // I1 (spec-client §3 inv 3): the slot holds an authored ID, and the pin
    // anchor carries the same one — u8's RedThread pins to it.
    node.dataset.blockId = blockId
    if (deployed) node.classList.add('locked')

    node.append(buildBlockCard(blockCardModel(blockId, options.resolve(blockId)), { inSlot: true }))

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

    // The thread's anchor CLOSES the run rather than opening it.
    //
    // It sat between the number and the sentence to begin with, and a paragraph
    // has soft-wrap opportunities the four boxes never did: the line broke
    // between the dot and the first word, leaving `02 ●` stranded on the end of
    // the line ABOVE the sentence it numbers. Last, it can only ever be orphaned
    // from a `해제` — which is invisible, because it is a dot.
    const pin = el('span', 'slot-pin')
    pin.dataset.blockId = blockId
    pin.setAttribute('aria-hidden', 'true')
    node.append(pin)

    return node
  }

  /**
   * The blank — ONE of them, and only while the file is empty (민서, 08-08).
   *
   * Four permanent boxes were four promises the file kept whether or not the
   * operator had anything to put in them. The cap is not lost with them: the
   * deploy zone's `#slotCount` has always printed `0 / 4` a few lines below, and
   * that is where the remaining seats are read now.
   *
   * It stays a real `<button>` so the `slot` op is reachable by keyboard alone
   * (inv 1 + PRD §4 a11y) — Enter and Space both fire its click — and it seats
   * into `firstFree()`, which on an empty board is seat 0.
   */
  function buildBlank(): HTMLElement {
    const node = el('div', 'slot slot-blank')
    const seat = firstFree() ?? 0
    const no = pad2(seat + 1)
    node.dataset.slot = String(seat)
    node.dataset.no = no

    if (deployed) {
      node.classList.add('locked')
      node.append(el('div', 'slot-empty', LOCKED_HINT))
      return node
    }

    const target = button('slot-empty slot-target', `슬롯 ${no}에 배치`, EMPTY_HINT)
    // The `slot` op's control, marked for the PRD §4 membrane census.
    target.dataset.op = 'slot'
    node.append(target)

    node.addEventListener('click', () => {
      const armed = pickedBlockId()
      if (armed === null) return
      setPickedBlockId(null)
      apply({ kind: 'place', blockId: armed, slot: seat })
    })
    node.addEventListener('dragover', (event) => {
      event.preventDefault()
      node.classList.add('droppable')
    })
    node.addEventListener('dragleave', () => node.classList.remove('droppable'))
    node.addEventListener('drop', (event) => {
      event.preventDefault()
      node.classList.remove('droppable')
      const dropped = event.dataTransfer?.getData('text/plain') ?? ''
      if (dropped.length > 0) apply({ kind: 'place', blockId: dropped, slot: seat })
    })

    return node
  }

  function render(): void {
    root.dataset.state = boardState(slots, deployed)
    const seated = slotCells(slots).flatMap((cell) =>
      cell.blockId === null ? [] : [buildSeat(cell, cell.blockId)],
    )
    // Built element by element, the runs would abut with no separator and the
    // paragraph would read `…앉힙니다해제02…`. The same whitespace-text-node
    // trick `components/dossier.ts` uses, and for the same reason.
    const flow: Node[] = seated.flatMap((node, index) =>
      index === 0 ? [node] : [document.createTextNode(' '), node],
    )
    root.replaceChildren(...(seated.length === 0 ? [buildBlank()] : flow))
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
