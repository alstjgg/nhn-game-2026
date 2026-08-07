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
const AUTHORED_ID = /^b-r([1-9]\d*)-([a-z])(\d{2})$/

/** An authored SCRIPT id — `timeline.json`'s `t*`, run-independent by contract. */
const SCRIPT_ID = /^t\d+$/

/**
 * The channel set, DERIVED rather than copied (R1 on block-card.ts:70). It used
 * to be a hand-written `['f','b','n','q','u']` beside an import of `SPECIES_OF`
 * itself, so a channel added upstream would have fallen silently through to the
 * default instead of failing to compile — the duplicated-union drift risk
 * `src/shared/species.ts` names in its own header.
 */
const CHANNELS: readonly string[] = Object.keys(SPECIES_OF)
const isChannel = (value: string): value is Channel => CHANNELS.includes(value)

/**
 * What a card prints for an id it cannot resolve to a channel at all.
 *
 * This expression used to fail OPEN onto `AUTHORED_SPECIES` — `'fact'`, one of
 * the two CERTIFIED species that `contract-datapack` E2 lets onto the solution
 * path. An id the client cannot parse is exactly the one thing it must not
 * certify, and it was reachable: `driver/fixtures/minimal.ts` ships `m-s01` /
 * `m-r1-f01`, and either rendered as a card printed 사실. `AUTHORED_SPECIES` is
 * right for `t*` ids, which is where it now applies and nowhere else.
 */
export const UNKNOWN_DISPLAY: SpeciesDisplay = { ko: '미상', mark: '?', cls: 'sp-unknown' }

/**
 * F1 (u4 D13) — an id the window cannot resolve to a `Sentence` still renders a
 * card. The seam hands carried blocks over as bare ids, so this is the normal
 * opening state of a run, not an error path.
 */
export const UNRESOLVED_TEXT = '(원문은 부검 기록에 있습니다)'

export interface BlockCardModel {
  id: string
  /** `null` for an id whose channel the client cannot read — never a guess. */
  species: Species | null
  ko: string
  mark: string
  cls: string
  axis?: string
  /** The run the id names, or null for an id that names none (`t*`). */
  run: number | null
  text: string
}

/**
 * The species an id NAMES, or `null` when it names none.
 *
 * "Species derives from the channel, never from classification" (spec-client
 * §5.2) — so when the id parses, the channel is the answer and the payload's own
 * `species` field does not get to overrule it. The payload is only ever a value
 * for an id the grammar cannot read, and such an id is not certified either.
 */
export function speciesOfId(id: string): Species | null {
  const parsed = AUTHORED_ID.exec(id)
  if (parsed !== null) {
    const channel = parsed[2] ?? ''
    return isChannel(channel) ? SPECIES_OF[channel] : null
  }
  return SCRIPT_ID.test(id) ? AUTHORED_SPECIES : null
}

/** Pure: an authored id (+ whatever the window resolved for it) → what a card prints. */
export function blockCardModel(id: string, sentence: Sentence | null): BlockCardModel {
  const parsed = AUTHORED_ID.exec(id)
  const species = speciesOfId(id)
  const display = species === null ? UNKNOWN_DISPLAY : SPECIES_DISPLAY[species]
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
  tag.append(el('i', undefined, model.mark))
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
