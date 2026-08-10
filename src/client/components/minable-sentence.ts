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

/**
 * The states §6 requires to be visually distinct.
 *
 * `carried` split out of `slotted` (08-08 playtest): a sentence the operator
 * deployed on an EARLIER day and one sitting in today's file are not the same
 * fact about the desk, and the rail makes both visible at once. Today's is
 * 배치; a previous sitting's is 과거 배치.
 *
 * `mined` is no longer a resting state on the main path — one activation now
 * mines AND seats (`windows/reports.ts`). It survives for the one way back
 * into it: 해제 frees the seat without un-mining the sentence.
 */
export type MinableState = 'unmined' | 'mined' | 'slotted' | 'carried'

/** Everything the marks need, as id sets — never positions, never text. */
export interface MarkSets {
  readonly mined: ReadonlySet<string>
  /** Seated in TODAY's file. */
  readonly slotted: ReadonlySet<string>
  /** Deployed on an earlier day and carried into this one. */
  readonly carried: ReadonlySet<string>
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
    slotted: new Set(Object.values(store.slots)),
    carried: new Set(carried),
  }
}

/**
 * Slotted wins over carried wins over mined — the more specific state reads
 * first, and each implies the one below it.
 *
 * REVERSED from [u6#c5] b (08-06), which had mined win.
 *
 * That ordering made `'slotted'` unreachable and `.min.slotted` dead CSS. A
 * sentence cannot be slotted without being mined first — the board only seats
 * cards off the deck, and the deck is `carried ∪ mined`
 * (`windows/block-store.ts` `buildStoreModel`, and `engine-ops.test.ts (b)`,
 * "an unmined block cannot be slotted"). So every slotted id was also in
 * `mined` and left at the first branch, and `carried` closed the last way
 * round: `driver/run-loop.ts` `carry()` replays every carried id as a `mine`
 * op into the new run's store.
 *
 * Slotted is the more specific state — it implies mined — so it reads first.
 * `unmined → slotted → carried` is then monotone in what the operator did with
 * the sentence, which is what §6 asks the states to be distinct ABOUT.
 */
export function sentenceState(id: string, marks: MarkSets): MinableState {
  if (marks.slotted.has(id)) return 'slotted'
  if (marks.carried.has(id)) return 'carried'
  if (marks.mined.has(id)) return 'mined'
  return 'unmined'
}

/** The class list for a state — four distinct lists, all carrying `.min`. */
export function sentenceClass(state: MinableState): string {
  if (state === 'mined') return `${BASE_CLASS} mined`
  if (state === 'slotted') return `${BASE_CLASS} slotted`
  if (state === 'carried') return `${BASE_CLASS} carried`
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

/**
 * Repaints one anchor's state — class list plus the mined announcement.
 *
 * `held` is the DESK's answer rather than the sentence's: the tear is
 * unavailable to every sentence at once, for as long as the previous ECHO's
 * 인수인계 사항 is typing itself onto the incoming page (x10, 민서 08-10 —
 * `components/slot-board.ts`'s `isRevealing()`). It is a separate argument and
 * not a fifth `MinableState` because it is not a fact about the sentence: the
 * state is what the operator has DONE with it, it survives the day and it is
 * what the marks are painted from, whereas this passes in a second and leaves
 * the sentence exactly as it found it.
 *
 * Both reasons write the same attribute, which is the point — `aria-disabled` is
 * written HERE and nowhere else on the desk's sentences, so there is one answer
 * to "is this control operable" however many reasons it may have.
 */
export function applyState(node: HTMLElement, state: MinableState, held = false): void {
  node.className = sentenceClass(state)
  // A settled sentence is a dead end: it is already in a file — today's
  // (`slotted`) or an earlier day's (`carried`). `mined` is operable again,
  // because the only way back into it is 해제 freeing the seat.
  const settled = state === 'slotted' || state === 'carried'
  // Recomputed WHOLE on every call, both ways round. A repaint that only ever
  // added the attribute would need somebody to remember to take it off again;
  // this one cannot leave a sentence disabled once `held` is false, because it
  // does not read what the node already says.
  if (settled || held) node.setAttribute('aria-disabled', 'true')
  else node.removeAttribute('aria-disabled')
}

/**
 * The `mine` anchors under `host` — the membrane marker `sentenceAttrs` writes.
 *
 * Read off the DOM rather than off a list, because the list belongs to
 * `components/report-view.ts` (its `anchors`) and this is the one repaint that
 * has to reach every sentence on the page whoever built it.
 */
const MINE_ANCHOR = '[data-op="mine"]'

/**
 * Repaints every sentence under `host` from the marks and the desk's hold.
 *
 * x10 — the gate's TELLING. `windows/reports.ts` refuses a held tear in
 * `onMine`, which is what actually stops the op; a control that merely ignored
 * presses would leave an operator on assistive tech pressing a thing that looks
 * live, so the same fact is painted here as `aria-disabled` on every anchor.
 *
 * TOTAL, and that is what makes the release safe: each node's attribute is
 * derived afresh from `marks` and `held`, so the call that lifts the hold
 * restores each sentence's own state in the same pass — there is no undo step to
 * skip. Identity is the authored id off the anchor, never its text (I1).
 */
export function repaintMines(host: ParentNode, marks: MarkSets, held: boolean): void {
  for (const node of host.querySelectorAll<HTMLElement>(MINE_ANCHOR)) {
    applyState(node, sentenceState(node.dataset.sentenceId ?? '', marks), held)
  }
}
