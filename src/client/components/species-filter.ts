// SpeciesFilter — the BLOCK STORE's 전체 + 4종 button group (spec-client §6
// `BlockStore`, PRD §4 a11y).
//
// Ported from docs/design/phase2-ui/app.js `renderFilter` (361..373) onto u1's
// vendored `.store-filter / .fbtn / .on` skin. The reference rebuilt the row on
// every repaint; here the five buttons are built once and only their count,
// their `.on` class and their `aria-pressed` are written, so a focused button
// survives a repaint (the keyboard path in [u4s#c5] presses Enter on one).
//
// Split model → builder (u4 D1 precedent): `filterOptions` is pure and DOM-free.
// The vocabulary is NOT re-declared here — the Korean names and the marks come
// from u4's `SPECIES_DISPLAY`, so the card and the filter can never drift.
//
// Counts are taken over the WHOLE deck, slotted blocks included (app.js:368);
// the *list* is what drops them (`visibleBlocks`, u4s design D4).
import type { Species } from '../driver/index.ts'
import { button, el } from '../shell/dom.ts'
import { SPECIES_DISPLAY } from './block-card.ts'

export type FilterKey = 'all' | Species

/** 전체 first, then the four species in the design target's order (data.js 29..36). */
export const FILTER_ORDER: readonly FilterKey[] = ['all', 'fact', 'selfnarr', 'emotion', 'quote']

/** The one label the species vocabulary does not carry. */
const ALL_DISPLAY = { ko: '전체', mark: '▤' }

/** The group's accessible name — the row is a named button group, not a toolbar. */
const GROUP_LABEL = '종 필터'

export interface FilterOption {
  key: FilterKey
  ko: string
  mark: string
  count: number
}

/** Anything the filter can count: it reads `species` and nothing else (inv 3). */
export type Countable = { species: Species | null }

/** Pure: the five options with their counts over the whole deck. */
export function filterOptions(blocks: readonly Countable[]): FilterOption[] {
  return FILTER_ORDER.map((key) => {
    const display = key === 'all' ? ALL_DISPLAY : SPECIES_DISPLAY[key]
    const count = key === 'all' ? blocks.length : blocks.filter((b) => b.species === key).length
    return { key, ko: display.ko, mark: display.mark, count }
  })
}

/** Pure: does a block survive `filter`? The `species` field decides (inv 3). */
export function matchesFilter(block: Countable, filter: FilterKey): boolean {
  return filter === 'all' || block.species === filter
}

/* ══ the builder half — the only code here that touches the DOM ══════════ */

export interface SpeciesFilter {
  /** The `#storeFilter` host the window embeds. */
  readonly root: HTMLElement
  render(active: FilterKey, blocks: readonly Countable[]): void
}

interface FilterButton {
  key: FilterKey
  node: HTMLButtonElement
  count: HTMLElement
}

export function buildSpeciesFilter(onPick: (key: FilterKey) => void): SpeciesFilter {
  const root = el('div', 'store-filter')
  root.id = 'storeFilter'
  root.setAttribute('role', 'group')
  root.setAttribute('aria-label', GROUP_LABEL)

  const buttons: FilterButton[] = filterOptions([]).map((option) => {
    const label = option.key === 'all' ? '전체 보기' : `${option.ko}만 보기`
    const node = button('fbtn', label, '')
    node.append(el('i', undefined, option.mark), document.createTextNode(option.ko))
    const count = el('span', undefined, ` ${option.count}`)
    node.append(count)
    node.addEventListener('click', () => onPick(option.key))
    root.append(node)
    return { key: option.key, node, count }
  })

  return {
    root,
    render(active, blocks) {
      const options = filterOptions(blocks)
      for (const [index, entry] of buttons.entries()) {
        const on = entry.key === active
        entry.count.textContent = ` ${options[index]?.count ?? 0}`
        entry.node.classList.toggle('on', on)
        entry.node.setAttribute('aria-pressed', on ? 'true' : 'false')
      }
    },
  }
}
