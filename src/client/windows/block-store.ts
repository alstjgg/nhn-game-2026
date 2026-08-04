// [u4s] BLOCK STORE — 채굴한 문장 보관함 (spec-client §4 · §6).
//
// Ported from docs/design/phase2-ui/app.js `renderStore` / `renderFilter` /
// `initStoreDrop` (375..403) and index.html 271..275 (`#storeFilter` ·
// `#storeList` · `#storeEmpty`) onto u1's vendored `.store-*` skin.
//
// What this window OWNS: the deck (which blocks exist, which are shown), the
// species filter, the empty state, the pick, and the store's own drop target.
//
// What it deliberately does NOT own: the membrane. The slot board keeps the
// board's state inside its own closure and runs every mutation through
// `planOps` → `driver.send` itself, so a store that sent a `slot` op directly
// would desync it. The store therefore drives `place()` / `clear()` and emits
// nothing (u4s design X2). `slotOpFor` / `unslotOpFor` below are the same
// decision made visible for the unit tests — they wrap u4's `planOps` and are
// never a second rule set.
//
// Split pure core → DOM layer (u4 D1 precedent): everything above `mount` is
// DOM-free, so the model half runs under vitest's node environment.
//
// Import-safe by contract (u3): no DOM at module scope, no stylesheet import,
// no sibling window import, nothing from engine or composer (C8 / inv 12), and
// no fixture module — carried ids resolve through the report index (u4 D13).
import type { FixtureDriver, MembraneOp, Sentence, Species } from '../driver/index.ts'
import { el } from '../shell/dom.ts'
import { blockCardModel, buildStoreCard, pickedBlockId, setPickedBlockId, subscribePick } from '../components/block-card.ts'
import type { BlockCardState } from '../components/block-card.ts'
import { SLOT_CAP, getSlotBoard, planOps, slotCells, usedIds } from '../components/slot-board.ts'
import { buildSpeciesFilter, matchesFilter } from '../components/species-filter.ts'
import type { FilterKey } from '../components/species-filter.ts'

/** spec-client §6 `BlockStore` — the empty state's copy, verbatim. */
const EMPTY_COPY = '아직 채굴한 문장이 없습니다.'

/* ══ the pure core ═══════════════════════════════════════════════════════ */

export interface StoreBlock {
  id: string
  species: Species
  /** The run opened holding this one — it was mined in an earlier run. */
  carried: boolean
}

export interface SlotState {
  slots: readonly (string | null)[]
  deployed: boolean
}

export interface StoreModelInput {
  /** Mined this run, in mining order (`driver.store().mined`). */
  mined: readonly string[]
  /** Held from earlier runs, in meta order (`meta.carried`). */
  carried: readonly string[]
  /** The window's id→Sentence index; `null` ⇒ u4's F1 fallback card. */
  resolve(id: string): Sentence | null
}

/**
 * The deck: carried ∪ mined, each id once, each source keeping its own order.
 * Species is `blockCardModel`'s — derived from the id's channel, never from the
 * text, and never decided a second time here (spec-client §3 inv 3, C13).
 */
export function buildStoreModel(input: StoreModelInput): StoreBlock[] {
  const blocks: StoreBlock[] = []
  const seen = new Set<string>()
  const add = (id: string, carried: boolean): void => {
    if (id.length === 0 || seen.has(id)) return
    seen.add(id)
    blocks.push({ id, species: blockCardModel(id, input.resolve(id)).species, carried })
  }
  for (const id of input.carried) add(id, true)
  for (const id of input.mined) add(id, false)
  return blocks
}

/** What the list shows: the seated blocks leave the deck, then the filter cuts. */
export function visibleBlocks(
  blocks: readonly StoreBlock[],
  slots: readonly (string | null)[],
  filter: FilterKey,
): StoreBlock[] {
  const seated = new Set(usedIds(slots))
  return blocks.filter((block) => !seated.has(block.id)).filter((block) => matchesFilter(block, filter))
}

/** `true` while the board could still take another block (u4s design D8). */
export function canSlot(state: SlotState): boolean {
  return !state.deployed && usedIds(state.slots).length < SLOT_CAP
}

/** The one place a card's state is decided — precedence: slotted > at-cap > archived. */
export function cardStateOf(block: StoreBlock, state: SlotState): BlockCardState {
  if (state.slots.includes(block.id)) return 'slotted'
  if (!canSlot(state)) return 'at-cap'
  return block.carried ? 'archived' : 'in-store'
}

/** What seating `id` in `slot` would emit — u4's plan, not a second one (D1). */
export function slotOpFor(state: SlotState, id: string, slot: number): MembraneOp[] {
  return planOps(state, { kind: 'place', blockId: id, slot }).ops
}

/** What releasing `id` would emit; an id no seat holds emits nothing. */
export function unslotOpFor(state: SlotState, id: string): MembraneOp[] {
  const seat = state.slots.indexOf(id)
  if (seat < 0) return []
  return planOps(state, { kind: 'clear', slot: seat }).ops
}

/* ══ the DOM layer ═══════════════════════════════════════════════════════ */

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  const sentences = new Map<string, Sentence>()
  let carried: readonly string[] = []
  let filter: FilterKey = 'all'
  let painted = ''

  const filterRow = buildSpeciesFilter((key) => {
    filter = key
    paint(true)
  })
  const list = el('div', 'store-list')
  list.id = 'storeList'
  const empty = el('div', 'store-empty', EMPTY_COPY)
  empty.id = 'storeEmpty'
  host.append(filterRow.root, list, empty)

  const resolve = (id: string): Sentence | null => sentences.get(id) ?? null

  /**
   * D3 — the board is the live truth while it is mounted; the driver's own
   * store is the fallback, so the deck is right even before the file is up.
   */
  function slotState(): SlotState {
    const board = getSlotBoard()
    if (board !== null) return { slots: board.cells(), deployed: board.isLocked() }
    const store = driver.store()
    return {
      slots: slotCells([]).map((cell) => store.slots[cell.slot] ?? null),
      deployed: store.deployed.length > 0,
    }
  }

  /** Everything a repaint depends on, as one comparable string. */
  function stamp(state: SlotState, mined: readonly string[]): string {
    return [filter, carried.join(','), mined.join(','), state.slots.join(','), String(state.deployed)].join('|')
  }

  function paint(force: boolean): void {
    const state = slotState()
    const mined = driver.store().mined
    const next = stamp(state, mined)
    if (!force && next === painted) return
    painted = next

    const blocks = buildStoreModel({ mined, carried, resolve })
    filterRow.render(filter, blocks)

    const shown = visibleBlocks(blocks, state.slots, filter)
    const armed = pickedBlockId()
    list.replaceChildren(
      ...shown.map((block) =>
        buildStoreCard(blockCardModel(block.id, resolve(block.id)), {
          state: cardStateOf(block, state),
          picked: armed === block.id,
          locked: state.deployed,
          onPick: () => setPickedBlockId(pickedBlockId() === block.id ? null : block.id),
        }),
      ),
    )
    empty.classList.toggle('on', shown.length === 0)
  }

  // The pick moves far more often than the deck does, and re-dealing the cards
  // under a focused one would break the keyboard path — so it is written onto
  // the cards in place. Identity is the id on the card, never its text (inv 3).
  subscribePick((id) => {
    for (const node of list.querySelectorAll<HTMLElement>('.bcard')) {
      const armed = node.dataset.block === id
      node.classList.toggle('picked', armed)
      node.setAttribute('aria-pressed', armed ? 'true' : 'false')
    }
  })

  // The store body is a drop target: dropping a seated block here releases it
  // (app.js `initStoreDrop`, 394..403). The id travels, the text never does.
  host.addEventListener('dragover', (event) => {
    if (getSlotBoard()?.isLocked() === true) return
    event.preventDefault()
  })
  host.addEventListener('drop', (event) => {
    event.preventDefault()
    const board = getSlotBoard()
    if (board === null || board.isLocked()) return
    const dropped = event.dataTransfer?.getData('text/plain') ?? ''
    if (dropped.length === 0) return
    const seat = board.cells().indexOf(dropped)
    if (seat < 0) return
    board.clear(seat)
    paint(true)
  })

  driver.subscribe((event) => {
    if (event.type === 'report') {
      for (const sentence of [...event.facts, ...event.report_body]) sentences.set(sentence.id, sentence)
      paint(true)
      return
    }
    if (event.type !== 'meta') return
    carried = event.carried
    paint(true)
  })

  // Mining and slotting both land at the seam, not on this window's stream: the
  // REPORTS window sends `mine` and the AGENT FILE's board sends `slot`, and
  // neither reaches across to a sibling (C8). So the deck WATCHES instead of
  // being told, and every repaint is guarded by `stamp` — nothing below repaints
  // a deck that did not change.
  //
  // The board is watched directly, because a seated block must leave the deck in
  // the same turn it was seated: the board repaints its own root on every
  // accepted op, and this observer runs on that mutation. Everything else (a
  // sentence mined in REPORTS) is picked up on the next frame.
  const board = getSlotBoard()
  if (board !== null) {
    new MutationObserver(() => paint(false)).observe(board.root, { childList: true, subtree: true })
  }
  const watch = (): void => {
    paint(false)
    requestAnimationFrame(watch)
  }
  requestAnimationFrame(watch)

  paint(true)
}
