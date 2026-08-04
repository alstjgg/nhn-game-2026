// BlockCard — one mined sentence, printed as an index card (spec-client §6).
//
// Ported from docs/design/phase2-ui/app.js `cardNode` (317..356) and
// `data.js` SPECIES (29..36) onto u1's vendored `.bcard` skin. u4 creates this
// module because the AGENT FILE's slots render cards; u4s (BLOCK STORE) extends
// it for the store's own deck ([u4#c8]).
//
// Split model → builder (u4 D1): `blockCardModel` is pure and DOM-free, and it
// is the ONE place a card's species is decided — derived from the id's channel,
// never inferred from the text (spec-client §5.2, `src/shared/species.ts`).
//
// This module also owns the **pick channel** (D8): the store arms a pick, the
// slot board consumes it. Ids only travel here — never sentence text.
import type { Sentence, Species } from '../driver/index.ts'
import type { Channel } from '../../shared/species.ts'
import { AUTHORED_SPECIES, SPECIES_OF } from '../../shared/species.ts'
import { el } from '../shell/dom.ts'

/** Two-digit stamp — run numbers, slot numbers and the RUN stamp all print one. */
export const pad2 = (value: number): string => String(value).padStart(2, '0')

export interface SpeciesDisplay {
  ko: string
  mark: string
  cls: string
}

/**
 * The species vocabulary the paper shows. `src/shared/species.ts` carries the
 * channel→species RULE and nothing else (it is consume-only, C13), so the
 * Korean names and the marks are ported from the design target instead.
 */
export const SPECIES_DISPLAY: Readonly<Record<Species, SpeciesDisplay>> = {
  fact: { ko: '사실', mark: '■', cls: 'sp-fact' },
  selfnarr: { ko: '자기서술', mark: '◇', cls: 'sp-self' },
  emotion: { ko: '감정', mark: '●', cls: 'sp-emo' },
  quote: { ko: '인용', mark: '❝', cls: 'sp-quote' },
}

/** The authored id grammar `b-r<run>-<channel><nn>` (contract-engine-composer §2.0). */
const AUTHORED_ID = /^b-r(\d+)-([a-z])\d+$/

const CHANNELS: readonly string[] = ['f', 'b', 'n', 'q', 'u']
const isChannel = (value: string): value is Channel => CHANNELS.includes(value)

/**
 * F1 (u4 D13) — an id the window cannot resolve to a `Sentence` still renders a
 * card. The seam hands carried blocks over as bare ids, so this is the normal
 * opening state of a run, not an error path.
 */
export const UNRESOLVED_TEXT = '(원문은 부검 기록에 있습니다)'

export interface BlockCardModel {
  id: string
  species: Species
  ko: string
  mark: string
  cls: string
  axis?: string
  /** The run the id names, or null for an id that names none (`t*`). */
  run: number | null
  text: string
}

/** Pure: an authored id (+ whatever the window resolved for it) → what a card prints. */
export function blockCardModel(id: string, sentence: Sentence | null): BlockCardModel {
  const parsed = AUTHORED_ID.exec(id)
  const channel = parsed === null ? '' : parsed[2]
  const species: Species =
    sentence?.species ?? (isChannel(channel) ? SPECIES_OF[channel] : AUTHORED_SPECIES)
  const display = SPECIES_DISPLAY[species]
  const model: BlockCardModel = {
    id,
    species,
    ko: display.ko,
    mark: display.mark,
    cls: display.cls,
    run: parsed === null ? null : Number(parsed[1]),
    text: sentence?.text ?? UNRESOLVED_TEXT,
  }
  if (sentence?.axis !== undefined) model.axis = sentence.axis
  return model
}

/* ══ the pick channel (D8) ═══════════════════════════════════════════════ */

type PickListener = (id: string | null) => void

let picked: string | null = null
const pickListeners = new Set<PickListener>()

export function pickedBlockId(): string | null {
  return picked
}

export function setPickedBlockId(id: string | null): void {
  if (picked === id) return
  picked = id
  for (const listener of [...pickListeners]) listener(id)
}

export function subscribePick(listener: PickListener): () => void {
  pickListeners.add(listener)
  return () => {
    pickListeners.delete(listener)
  }
}

/* ══ the builder half — the only code here that touches the DOM ══════════ */

export interface BlockCardOptions {
  /** A slotted card is flat document art; a store card is a draggable object. */
  inSlot: boolean
}

export function buildBlockCard(model: BlockCardModel, options: BlockCardOptions): HTMLElement {
  const card = el('div', options.inSlot ? 'bcard in-slot' : 'bcard')
  card.dataset.block = model.id

  const top = el('div', 'bc-top')
  const tag = el('span', `bc-sp ${model.cls}`)
  tag.append(el('i', undefined, model.mark), document.createTextNode(model.ko))
  top.append(tag)
  if (model.axis !== undefined) top.append(el('span', 'bc-axis', `축 ${model.axis}`))
  top.append(el('span', 'bc-id', model.id.toUpperCase()))

  card.append(top, el('div', 'bc-text', model.text))

  // D13: the reference's `· at · src` provenance is not at the seam, so the
  // card prints the one field the id itself carries.
  if (model.run !== null) {
    const source = el('div', 'bc-src')
    source.append(el('b', undefined, `런 ${pad2(model.run)}`))
    card.append(source)
  }

  if (!options.inSlot) {
    card.draggable = true
    card.addEventListener('dragstart', (event) => {
      // The drop channel carries the ID, never the text (spec-client §3 inv 3).
      event.dataTransfer?.setData('text/plain', model.id)
      card.classList.add('dragging')
    })
    card.addEventListener('dragend', () => card.classList.remove('dragging'))
  }

  return card
}

/* ══ the store card (u4s) — a decorator, never a second builder ══════════ */

/**
 * The four states spec-client §6 requires to be visually distinct. They are a
 * single union because a card is in exactly one of them: a seated block is
 * `slotted` whatever else is true of it, and a board that cannot take the card
 * (`at-cap`, which a deployed file also produces) outranks the archive mark —
 * it is the state that blocks the interaction.
 */
export type BlockCardState = 'in-store' | 'slotted' | 'at-cap' | 'archived'

/** The class each state wears; `in-store` is the bare card. */
const STORE_STATE_CLASS: Readonly<Record<BlockCardState, string>> = {
  'in-store': '',
  slotted: 'in-slot',
  'at-cap': 'at-cap',
  archived: 'archived',
}

export interface StoreCardOptions {
  state: BlockCardState
  /** This card holds the pick channel's arm. */
  picked: boolean
  /** The file is deployed — nothing in the deck is operable. */
  locked: boolean
  /** Toggle the pick. Never called while the card is frozen. */
  onPick(): void
}

/**
 * A store-deck card: `buildBlockCard` plus the state, the pick and the a11y the
 * deck needs. The base builder is called, never forked — u4 owns what a card
 * IS, u4s owns what the store's copy of it can DO ([u4s#c7]).
 *
 * A11y (PRD §4): the card is a `role=button` with `tabindex=0` and a pressed
 * state, and Enter/Space arm it, so the click-then-click slotting path is
 * operable with no pointer at all. A native `<button>` would need a skin reset
 * this unit is not allowed to write.
 */
export function buildStoreCard(model: BlockCardModel, options: StoreCardOptions): HTMLElement {
  const card = buildBlockCard(model, { inSlot: false })
  const stateClass = STORE_STATE_CLASS[options.state]
  if (stateClass.length > 0) card.classList.add(stateClass)

  // A frozen card is reached by every handler and refuses inside it — the state
  // is what stops the op, never the card's unreachability ([u4s#c3]).
  const frozen = options.locked || options.state === 'at-cap'

  card.setAttribute('role', 'button')
  card.tabIndex = 0
  card.setAttribute('aria-pressed', options.picked ? 'true' : 'false')
  if (options.picked) card.classList.add('picked')
  if (frozen) {
    card.setAttribute('aria-disabled', 'true')
    card.draggable = false
  }

  const pick = (): void => {
    if (frozen) return
    options.onPick()
  }
  card.addEventListener('click', pick)
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    // Space would scroll the deck out from under the card it just armed.
    event.preventDefault()
    pick()
  })

  return card
}
