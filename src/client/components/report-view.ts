// [u6] ReportView — spec-client §4 REPORTS row, §3 inv 5, latency rule 4.
//
// Two filed documents side by side on white bond: the objective log on the left
// and the agent's own report on the right, under the red margin rule u1's
// `win-reports.css` paints. Ported from docs/design/phase2-ui/index.html lines
// 176..218 and app.js `renderReport()` / `typewrite()` (lines 505, 523).
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
import type { MarkSets } from './minable-sentence.ts'
import { applyState, isMineKey, sentenceNode, sentenceState } from './minable-sentence.ts'

/** The `report` event as this window holds it (§5.2). */
export interface ReportModel {
  round: number
  facts: Sentence[]
  report_body: Sentence[]
}

/** Where the replay has got to. `sentence === lengths.length` ⇒ finished. */
export interface TypeState {
  sentence: number
  chars: number
  done: boolean
}

/** The replay's opening position — nothing painted yet. */
export const TYPE_START: TypeState = { sentence: 0, chars: 0, done: false }

/** Real milliseconds per character, and the pause between sentences. */
const MS_PER_CHAR = 11
const MS_BETWEEN = 130

/** The pump registration name — one replay at a time, per window. */
const PUMP = 'reports/typewriter'

/** How much elapsed time a cursor position already represents. */
function costOf(state: TypeState, lengths: readonly number[]): number {
  let ms = 0
  for (let i = 0; i < state.sentence && i < lengths.length; i += 1) {
    ms += (lengths[i] ?? 0) * MS_PER_CHAR + MS_BETWEEN
  }
  return ms + state.chars * MS_PER_CHAR
}

/**
 * Advances the replay cursor by `elapsedMs`. Deterministic, monotonic, and it
 * settles on `done` instead of running past the last sentence ([u6#c2]).
 */
export function typeCursor(
  state: TypeState,
  elapsedMs: number,
  lengths: readonly number[],
): TypeState {
  if (state.done) return state
  if (lengths.length === 0) return { sentence: 0, chars: 0, done: true }

  let rest = costOf(state, lengths) + Math.max(0, elapsedMs)
  for (let i = 0; i < lengths.length; i += 1) {
    const width = (lengths[i] ?? 0) * MS_PER_CHAR
    if (rest < width) return { sentence: i, chars: Math.floor(rest / MS_PER_CHAR), done: false }
    rest -= width
    if (rest < MS_BETWEEN) return { sentence: i, chars: lengths[i] ?? 0, done: false }
    rest -= MS_BETWEEN
  }
  return { sentence: lengths.length, chars: 0, done: true }
}

/** How many of the active report's sentences are mined — both panes, by id. */
export function minedCount(model: ReportModel, marks: MarkSets): number {
  return [...model.facts, ...model.report_body].filter((s) => marks.mined.has(s.id)).length
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
  /** Draws a round's two documents from scratch, replaying on first arrival. */
  render(model: ReportModel, marks: MarkSets, options?: RenderOptions): void
  /** Repaints every anchor's state and the mined tally, in place. */
  refresh(marks: MarkSets): void
  /** Plays the tear flash on one anchor, keyed by its authored id. */
  tear(id: string): void
  /** W3 — nudge one sentence: the action was refused, and the desk says so. */
  flash(id: string): void
  /** The round currently on the page, or `null` before the first report. */
  round(): number | null
  /** Re-brands the callsign surfaces — `나`'s sub and the signature (M1). */
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

/** `가` / `나` — the two documents' file letters, as the reference prints them. */
const FACTS_HEAD = { no: '가', title: '현장 기록', sub: '일어난 것 · 관측된 것' }
/** The callsign half of `나`'s sub and the signature re-brands per sitting (M1). */
const BODY_SUB_TAIL = ' 송신 · 1인칭'
const BODY_HEAD = { no: '나', title: '무전 기록', sub: `ECHO-1${BODY_SUB_TAIL}` }

function documentHead(head: { no: string; title: string; sub: string }): HTMLElement {
  const header = el('header', 'doc-hd')
  header.append(el('span', 'doc-no', head.no), el('h3', undefined, head.title), el('i', undefined, head.sub))
  return header
}

export function createReportView(options: ReportViewOptions): ReportView {
  const facts = el('ol', 'facts')
  facts.id = 'factsList'
  const body = el('div', 'rbody')
  body.id = 'bodyList'

  const docFacts = el('article', 'doc doc-facts')
  docFacts.append(documentHead(FACTS_HEAD), facts)

  const sig = el('div', 'sig')
  sig.setAttribute('aria-hidden', 'true')
  const sigLine = el('span', 'sig-line', 'ECHO-1')
  sig.append(sigLine, el('span', 'sig-stamp', '검 인'))

  const docBody = el('article', 'doc doc-body')
  const bodyHead = documentHead(BODY_HEAD)
  const bodySub = bodyHead.querySelector('i')
  docBody.append(bodyHead, body, sig)

  const grid = el('div', 'rep-grid')
  grid.append(docFacts, docBody)

  const count = el('b', undefined, '0')
  count.id = 'minedCount'
  const foot = el('footer', 'rep-foot')
  foot.append(
    document.createTextNode('문장을 누르면 뜯어내고, 한 번 더 누르면 요원 파일의 빈 칸에 앉습니다 · '),
    count,
    document.createTextNode('건 채굴됨'),
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
    if (!animate || motionless()) {
      paint({ sentence: lengths.length, chars: 0, done: true }, sentences, nodes)
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
        const row = el('li', 'min-row')
        row.append(el('span', 'f-t'), node)
        facts.append(row)
      }

      body.replaceChildren()
      const bodyNodes = model.report_body.map((sentence) => {
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
      const node = anchors.find((a) => a.getAttribute('data-sentence-id') === id)
      if (node === undefined) return
      node.classList.remove('refused')
      void node.offsetWidth
      node.classList.add('refused')
    },

    round(): number | null {
      return current === null ? null : current.round
    },

    brand(callsign: string): void {
      sigLine.textContent = callsign
      if (bodySub !== null) bodySub.textContent = `${callsign}${BODY_SUB_TAIL}`
    },
  }
}
