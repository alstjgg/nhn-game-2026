// [u6] MinableSentence — spec-client §6 row `MinableSentence`, §3 inv 3 (I1).
//
// A report sentence arrives pre-segmented and pre-classified from the driver
// (§5.2). This module never re-splits it, never decides what kind of sentence
// it is, and never reads what it says: identity is the AUTHORED id and nothing
// else, which is what makes mining, archive highlighting and u8's red thread
// agree with each other across a run switch.
//
// Ported from docs/design/phase2-ui/app.js `minSpan()` / `mine()` /
// `markReportSlots()` (lines 495, 541, 562). The reference kept the marks in a
// module-global `S` and mutated the DOM from inside the click handler; here the
// marks are DERIVED from the driver's own store on every read, and `mine()` is
// a pure reducer that answers with the op to send and the effects to play.
//
// The three functions above `mine()` are DOM-free on purpose — the pure half of
// this unit runs under vitest's node environment.
import type { FixtureStore, MembraneOp, Sentence } from '../driver/index.ts'

/** The three states §6 requires to be visually distinct. */
export type MinableState = 'unmined' | 'mined' | 'slotted'

/** Everything the marks need, as id sets — never positions, never text. */
export interface MarkSets {
  readonly mined: ReadonlySet<string>
  readonly slottedEver: ReadonlySet<string>
}

/** What a successful tear plays: the flash on the page, the card to the store. */
export interface MineEffect {
  readonly tear: string
  readonly card: { sentence_id: string }
}

/** The reducer's answer — ops to send at the seam, effects to play locally. */
export interface MineOutcome {
  readonly ops: MembraneOp[]
  readonly effects: MineEffect[]
}

/** The skin selector every rendered sentence carries (u1's `win-reports.css`). */
const BASE_CLASS = 'min sent'

/**
 * Folds the driver's store and the run's carried ids into two id sets.
 * Reads its inputs and mutates neither ([u6#c5] d).
 */
export function deriveMarks(store: FixtureStore, carried: readonly string[]): MarkSets {
  return {
    mined: new Set(store.mined),
    slottedEver: new Set([...Object.values(store.slots), ...carried]),
  }
}

/** Mined wins over slotted when a sentence is both ([u6#c5] b). */
export function sentenceState(id: string, marks: MarkSets): MinableState {
  if (marks.mined.has(id)) return 'mined'
  if (marks.slottedEver.has(id)) return 'slotted'
  return 'unmined'
}

/** The class list for a state — three distinct lists, all carrying `.min`. */
export function sentenceClass(state: MinableState): string {
  if (state === 'mined') return `${BASE_CLASS} mined`
  if (state === 'slotted') return `${BASE_CLASS} slotted`
  return BASE_CLASS
}

/**
 * The anchor contract u8 threads against, plus the a11y contract §4 requires.
 * Every value is derived from the authored id — no attribute ever carries the
 * sentence's screen text ([u6#c6] b).
 */
export function sentenceAttrs(sentence: Sentence): Readonly<Record<string, string>> {
  return {
    'data-sentence-id': sentence.id,
    // The membrane marker the a11y contract binds on (R2 on e2e/a11y.spec.ts:35):
    // `MEMBRANE_SELECTOR` matched nothing in the shipped desk, so three PRD §4
    // asserts were quantified over the empty set. This anchor IS the `mine` op.
    'data-op': 'mine',
    role: 'button',
    tabindex: '0',
  }
}

/**
 * Tearing a sentence out of the report. Re-mining an already-mined sentence is
 * a no-op — no second op, no second card ([u6#c5] e/f).
 */
export function mine(id: string, marks: MarkSets): MineOutcome {
  if (marks.mined.has(id)) return { ops: [], effects: [] }
  return {
    ops: [{ op: 'mine', sentence_id: id }],
    effects: [{ tear: id, card: { sentence_id: id } }],
  }
}

/** Enter and Space mine a focused sentence; nothing else does ([u6#c6] e). */
export function isMineKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

/* ── the DOM side ────────────────────────────────────────────────────────── */

/** A sentence anchor, unpainted: the view writes the characters onto it. */
export function sentenceNode(sentence: Sentence, state: MinableState): HTMLElement {
  const node = document.createElement('span')
  for (const [name, value] of Object.entries(sentenceAttrs(sentence))) node.setAttribute(name, value)
  applyState(node, state)
  return node
}

/** Repaints one anchor's state — class list plus the mined announcement. */
export function applyState(node: HTMLElement, state: MinableState): void {
  node.className = sentenceClass(state)
  if (state === 'mined') node.setAttribute('aria-disabled', 'true')
  else node.removeAttribute('aria-disabled')
}
