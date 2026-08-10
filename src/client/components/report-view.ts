// [u6] ReportView — spec-client §4 REPORTS row, §3 inv 5, latency rule 4.
//
// Two filed documents side by side on white bond: the objective log on the left
// and the agent's own report on the right. Ported from
// docs/design/phase2-ui/index.html lines 176..218 and app.js `renderReport()` /
// `typewrite()` (lines 505, 523). (x6 — the ledger rule the reference drew down
// the report side is gone; see `win-reports.css`.)
//
// THE TYPEWRITER IS A REPLAY, NOT A STREAM. The `report` event arrives whole —
// one event, already complete — and this module replays it sentence by
// sentence for the operator's benefit. Two consequences, both load-bearing:
//
//   • it owns no timer and no socket. The cursor is a pure function of elapsed
//     milliseconds, and the milliseconds come from the DRIVER's animation pump
//     (`registerAnimation`), which is exactly the surface `freezeAnimations()`
//     gates. Frozen animations ⇒ the whole body is present on the first paint.
//   • nothing here waits on the network to know what the document says.
import { animationsFrozen, registerAnimation } from '../driver/index.ts'
import type { Sentence } from '../driver/index.ts'
import { el } from '../shell/dom.ts'
import { callsignOf } from './dossier.ts'
import type { MarkSets } from './minable-sentence.ts'
import { applyState, isMineKey, sentenceNode, sentenceState } from './minable-sentence.ts'

/** The `report` event as this window holds it (§5.2). */
export interface ReportModel {
  round: number
  facts: Sentence[]
  report_body: Sentence[]
  /**
   * R1 — ids in `report_body` that open a round after the sitting's first. The
   * record breaks a line before each. Absent on a single-round document.
   */
  opens?: string[]
}

// H3 (08-09) — the typewriter itself moved to `components/typewriter.ts`. It
// was this module's outright while REPORTS was the only surface that typed;
// the AGENT FILE's handover now reveals at the same pace, and one desk may not
// have two typewriters running at two speeds. Re-exported here because
// `TypeState` and `TYPE_START` are part of this module's own published surface
// (`tests/windows/reports.test.ts` and the frozen-animation paths read them),
// and moving a definition is not a reason to move its callers.
import { TYPE_START, typeCursor } from './typewriter.ts'
import type { TypeState } from './typewriter.ts'
export type { TypeState }
export { TYPE_START, typeCursor }

/** The pump registration name — one replay at a time, per window. */
const PUMP = 'reports/typewriter'

/* x13 — THE 검인 CHOP IS GONE (민서, 08-10). `ChopState` and `chopDown()` stood
   here: the rule that weighed `sealed` (the day's `score` had landed), `received`
   (the sitting had filed something) and `typed` (the replay had run out), so a
   receipt went on the sheet when the transmission had actually been received.

   The rule was never the hard part; WHEN it first came true was. x5 stamped at
   the end of the round that had just typed itself out, which is the whole
   document only in a stream that files one report a day. x6 widened it to the
   sitting. x11 made the LIVE FEED type, x12 held REPORTS until the paper reached
   the round — and each of those moved the moment the three facts first stood
   together. The chop landed twice, then once but early. Three rules, three wrong
   moments, and no reproduction that survived a probe.

   So it is removed rather than re-timed. What it carried — "this transmission
   arrived" — is said by the transmission being on the page, and by the terminal
   record under it. The signature line `.sig-line` stays; it names who was on
   duty, which nothing else says. */

/** How many of the active report's sentences are mined — both panes, by id. */
export function minedCount(model: ReportModel, marks: MarkSets): number {
  return [...model.facts, ...model.report_body].filter((s) => marks.mined.has(s.id)).length
}

/**
 * W2 — a sitting plus one more round. Pure, and the ONE place the growth rule
 * lives: both panes append in arrival order and the model's `round` becomes
 * the latest one filed. `held === null` is the sitting's first round.
 *
 * Kept here rather than in `windows/reports.ts` because it is the only part of
 * "one sitting, one record" that can be proved under vitest's node
 * environment — the window itself needs a DOM.
 */
export function accumulated(held: ReportModel | null, slice: ReportModel): ReportModel {
  if (held === null) return { round: slice.round, facts: [...slice.facts], report_body: [...slice.report_body] }
  // R1 — the id that OPENS this round, remembered so a redraw can break before
  // it. Omitted on the first round rather than set empty: the document a
  // sitting starts with is the slice itself, and `(a)` in the `[w2]` block
  // asserts exactly that identity.
  const opening = slice.report_body[0]
  const opens = held.opens ?? []
  return {
    round: slice.round,
    facts: [...held.facts, ...slice.facts],
    report_body: [...held.report_body, ...slice.report_body],
    opens: opening === undefined ? [...opens] : [...opens, opening.id],
  }
}

/* ── the DOM side ────────────────────────────────────────────────────────── */

export interface RenderOptions {
  /**
   * Whether this render is the document's FIRST arrival, and so the one the
   * replay belongs to. A re-render caused by anything else — the archive rail
   * gaining an entry when the next day opens, a re-selection on the rail —
   * repaints the document whole (R4 on windows/reports.ts:90). Defaults to
   * `true`: a caller that says nothing gets the arrival behaviour.
   */
  replay?: boolean
}

export interface ReportView {
  /**
   * W2 — appends one round to the sitting already on the page. `slice` is the
   * new round alone (it is what replays); `whole` is the sitting including it,
   * which becomes the model the mined tally counts.
   */
  append(slice: ReportModel, whole: ReportModel, marks: MarkSets): void
  /** Draws a sitting's two documents from scratch, replaying on first arrival. */
  render(model: ReportModel, marks: MarkSets, options?: RenderOptions): void
  /** Repaints every anchor's state and the mined tally, in place. */
  refresh(marks: MarkSets): void
  /** Plays the tear flash on one anchor, keyed by its authored id. */
  tear(id: string): void
  /** W3 — nudge one sentence: the action was refused, and the desk says so. */
  flash(id: string): void
  /** The round currently on the page, or `null` before the first report. */
  round(): number | null
  /**
   * Re-brands the callsign surface — the signature under 무전 기록, and since x5
   * the only one this window has (the pane's subtitle went with `documentHead`).
   */
  brand(callsign: string): void
}

export interface ReportViewOptions {
  /** The window body the shell built — `.win-body.paper.bond`. */
  host: HTMLElement
  /** The archive rail, built by `report-archive.ts` and mounted above the grid. */
  rail: HTMLElement
  /** Called with the authored id when the operator tears a sentence out. */
  onMine(id: string): void
}

interface Anchor {
  sentence: Sentence
  node: HTMLElement
}

/**
 * The two documents' names — and, since x5, the whole of their heads.
 *
 * What left with them: the `가` / `나` file letters the reference boxed in front
 * of each title (`app.js`), and the italic subtitles behind them (`일어난 것 ·
 * 관측된 것`, `ECHO-1 송신 · 1인칭`). The letters index a filing system this game
 * has exactly two entries in — 현장 기록 and 무전 기록 are already told apart by
 * being the left column and the right one — and the subtitles restated the
 * titles in longer words.
 *
 * The callsign therefore has ONE surface left in this window: the signature
 * under the 무전 기록 body, which `brand()` writes (M1).
 */
const FACTS_TITLE = '현장 기록'
const BODY_TITLE = '무전 기록'

/**
 * The window's own standing instruction, at the foot of both panes.
 *
 * x5 — was '문장을 누르면 뜯어내 요원 파일의 빈 칸에 앉힙니다', which described the
 * GESTURE. The gesture is discoverable (every sentence lights under the cursor
 * and the AGENT FILE's blank says where they land); what the operator has no
 * way to work out from the desk is that choosing well is the job. So the line
 * says the job.
 */
const FOOT_LEAD = '기록 중 주요 사항을 선정하여 다음 요원에게 인수인계 하십시오 · '
const FOOT_TAIL = '건 채굴됨'

function documentHead(title: string): HTMLElement {
  const header = el('header', 'doc-hd')
  header.append(el('h3', undefined, title))
  return header
}

export function createReportView(options: ReportViewOptions): ReportView {
  const facts = el('ol', 'facts')
  facts.id = 'factsList'
  const body = el('div', 'rbody')
  body.id = 'bodyList'

  const docFacts = el('article', 'doc doc-facts')
  docFacts.append(documentHead(FACTS_TITLE), facts)

  const sig = el('div', 'sig')
  sig.setAttribute('aria-hidden', 'true')
  // x7 — the signature opens on `callsignOf(1)`, not on a literal `'ECHO-1'`.
  //
  // `brand()` is the real writer and it runs first thing in `drawDocument()`
  // (`windows/reports.ts`), so every document that reaches this sheet arrives
  // already signed and nothing below is ever read off a drawn page. What stands
  // here is the BLANK sheet's signature — the window mounts before the first
  // sitting is active and `drawDocument` returns early until it is — so it is
  // seen, briefly, at boot.
  //
  // Either way it may not be minted here. A second place that spells a callsign
  // by hand is a second place that can disagree with the AGENT FILE about who
  // the operator is watching, and the series has been renumbered under exactly
  // that assumption once already (see `components/dossier.ts`). The name has one
  // owner (D4 — the pack carries none); this window borrows it, unsigned sheet
  // included.
  const sigLine = el('span', 'sig-line', callsignOf(1))
  sig.append(sigLine)

  const docBody = el('article', 'doc doc-body')
  docBody.append(documentHead(BODY_TITLE), body, sig)

  const grid = el('div', 'rep-grid')
  grid.append(docFacts, docBody)

  const count = el('b', undefined, '0')
  count.id = 'minedCount'
  const foot = el('footer', 'rep-foot')
  foot.append(
    document.createTextNode(FOOT_LEAD),
    count,
    document.createTextNode(FOOT_TAIL),
  )

  options.host.append(options.rail, grid, foot)

  let anchors: Anchor[] = []
  let current: ReportModel | null = null
  let stopReplay: (() => void) | null = null
  const caret = el('span', 'caret')
  caret.setAttribute('aria-hidden', 'true')

  function bind(sentence: Sentence, marks: MarkSets): HTMLElement {
    const node = sentenceNode(sentence, sentenceState(sentence.id, marks))
    node.addEventListener('click', () => {
      options.onMine(sentence.id)
    })
    node.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!isMineKey(event.key)) return
      event.preventDefault()
      options.onMine(sentence.id)
    })
    anchors.push({ sentence, node })
    return node
  }

  /**
   * One 현장 기록 row: [번호] [시각] [문장].
   *
   * The sentence sits inside its own cell instead of BEING the third grid cell.
   * A grid item is blockified, and `.min`'s marks are painted as backgrounds —
   * on one block box, a `채굴` rule drawn every 1.35em drifts against a 1.62
   * line box (≈2px per line, so line 3 is struck through) and a `배치`
   * highlight lands on the last line alone. Wrapped in a cell, `.min` stays a
   * real inline box and every line fragment is painted alike, exactly as the
   * 무전 기록 pane's `.sent` already is. The wrap is load-bearing: the pane only
   * looked right on a window wide enough to keep each sentence to one line.
   */
  function factRow(node: HTMLElement): HTMLLIElement {
    const row = el('li', 'min-row')
    const cell = el('div', 'f-s')
    cell.append(node)
    row.append(el('span', 'f-t'), cell)
    return row
  }

  /**
   * The operator asked for no motion, or the determinism gate is closed — in
   * both the document is already whole on paper.
   *
   * The third case used to be "the driver's pump has stopped", which is what
   * killed the beat: the run's own report is released in the same frame the
   * clock reaches 21:04, so the ONE report a player actually sees was the one
   * that never wrote itself out (R4 on windows/reports.ts:55). The pump now
   * outlives the run (`driver/fixture-driver.ts`), so there is no stopped-pump
   * case left to special-case.
   */
  function motionless(): boolean {
    if (animationsFrozen()) return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function paint(cursor: TypeState, sentences: Sentence[], nodes: HTMLElement[]): void {
    sentences.forEach((sentence, i) => {
      const node = nodes[i]
      if (!node) return
      if (cursor.done || i < cursor.sentence) node.textContent = sentence.text
      else if (i === cursor.sentence) node.textContent = sentence.text.slice(0, cursor.chars)
      else node.textContent = ''
    })
    if (cursor.done || cursor.sentence >= nodes.length) {
      caret.remove()
      return
    }
    nodes[cursor.sentence]?.after(caret)
  }

  function replay(sentences: Sentence[], nodes: HTMLElement[], animate: boolean): void {
    const lengths = sentences.map((s) => s.text.length)
    // An empty document is not an unstamped one that will get there — it is a
    // sitting that has filed nothing, and there is no transmission to certify.
    //
    // Read off the SITTING (`current`), not off `sentences`: what replays here
    // is one round, and `append()` replays round 7 of a document that already
    // carries six. Both callers set `current` to the whole sitting first.
    if (!animate || motionless()) {
      paint({ sentence: lengths.length, chars: 0, done: true }, sentences, nodes)
      // The frozen-animation / reduced-motion sheet is whole on its first paint,
      // so it is TYPED the moment it is painted — but it is not certified until
      // the sitting has closed. The seal rule is the same on both paths.
      return
    }
    paint(TYPE_START, sentences, nodes)
    let elapsed = 0
    const unregister = registerAnimation(PUMP, (realMs: number) => {
      elapsed += realMs
      const cursor = typeCursor(TYPE_START, elapsed, lengths)
      paint(cursor, sentences, nodes)
      if (!cursor.done) return
      unregister()
      if (stopReplay === unregister) stopReplay = null
    })
    stopReplay = unregister
  }

  function tally(marks: MarkSets): void {
    count.textContent = current === null ? '0' : String(minedCount(current, marks))
  }

  return {
    append(slice: ReportModel, whole: ReportModel, marks: MarkSets): void {
      // W2 — the sitting grows. The document already on the page is NOT
      // redrawn: the new round's rows are appended, `anchors` accumulates (so
      // `refresh` still repaints every sentence the day has filed), `current`
      // becomes the WHOLE sitting (so the mined tally counts all of it), and
      // the replay runs over the new slice alone.
      if (stopReplay !== null) stopReplay()
      stopReplay = null
      caret.remove()
      current = whole

      for (const sentence of slice.facts) {
        const node = bind(sentence, marks)
        node.textContent = sentence.text
        facts.append(factRow(node))
      }

      // R1 — this round opens below the last one, not beside it. `append()` is
      // only ever reached for a round that is NOT the sitting's first (the
      // window draws whole for that one), so the break is unconditional here.
      body.append(el('span', 'r-brk'))
      const grown = slice.report_body.map((sentence) => {
        const node = bind(sentence, marks)
        body.append(node, document.createTextNode(' '))
        return node
      })

      tally(marks)
      replay(slice.report_body, grown, true)
    },

    render(model: ReportModel, marks: MarkSets, options?: RenderOptions): void {
      if (stopReplay !== null) stopReplay()
      stopReplay = null
      caret.remove()
      anchors = []
      current = model

      // The objective log is already filed when the round opens — only the
      // agent's own report writes itself out (reference: `renderReport()`).
      facts.replaceChildren()
      for (const sentence of model.facts) {
        const node = bind(sentence, marks)
        node.textContent = sentence.text
        facts.append(factRow(node))
      }

      body.replaceChildren()
      const opens = new Set(model.opens ?? [])
      const bodyNodes = model.report_body.map((sentence) => {
        // R1 — a redraw rebuilds the whole sitting from a flat list, so the
        // round boundary has to come from the model. Appending the break only
        // in `append()` below would lose it the first time the operator left
        // this rail tab and came back.
        if (opens.has(sentence.id)) body.append(el('span', 'r-brk'))
        const node = bind(sentence, marks)
        body.append(node, document.createTextNode(' '))
        return node
      })

      tally(marks)
      replay(model.report_body, bodyNodes, options?.replay ?? true)
    },

    refresh(marks: MarkSets): void {
      for (const anchor of anchors) applyState(anchor.node, sentenceState(anchor.sentence.id, marks))
      tally(marks)
    },

    tear(id: string): void {
      const anchor = anchors.find((a) => a.sentence.id === id)
      if (anchor === undefined) return
      const node = anchor.node
      node.classList.add('tear')
      node.addEventListener(
        'animationend',
        () => {
          node.classList.remove('tear')
        },
        { once: true },
      )
    },

    flash(id: string): void {
      const anchor = anchors.find((a) => a.sentence.id === id)
      if (anchor === undefined) return
      anchor.node.classList.remove('refused')
      void anchor.node.offsetWidth
      anchor.node.classList.add('refused')
    },

    round(): number | null {
      return current === null ? null : current.round
    },

    brand(callsign: string): void {
      sigLine.textContent = callsign
    },
  }
}
