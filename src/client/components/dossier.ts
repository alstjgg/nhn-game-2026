// Dossier — the AGENT FILE's sections, the document the operator reads
// (spec-client §4). Ported from docs/design/phase2-ui/app.js `renderDossier`
// (203..232) + `data.js` DOSSIER (37..68) onto u1's vendored `.sect` skin.
//
// The copy is DOCUMENT ART, not pack data: the pack carries no callsign and no
// standing orders. What IS pack-fed arrives as the models' own arguments — the
// callsign and slot cap to `agentModel` (u4 D2/D4). The cover takes none: x6's
// 임무 is a posting order, and a posting order does not print the shift's hours.
// The window's pack-fed value is its doc number (`windows/agent-file.ts`, off
// the fetched slug), which is what `e2e/agent-file.spec.ts` (d) guards.
//
// x7 — 기질 IS GONE FROM THE COVER, and the cover was the only place it appeared,
// so the sealed section has left the product (민서, 08-09; the consequence was
// stated when the call was made). `SealedSection`, `SEALED_COPY`, `SEALED_BARS`
// and `buildRedaction` went with it — nothing outside this file imported them.
//
// The seal's INVARIANT is untouched, and it never was the section's to carry:
// I13 (spec-client §3 inv 4) says 기질 data never reaches the view, and it never
// could, because no model in this file has a field one could be written into.
// That was always the load-bearing half; the bars were art on top of it, and
// `agent-file.test.ts [u4#c2](a)` now holds the invariant on its own. (This
// paragraph deliberately says 기질 and not the English word — [u4#c2](b) fails
// any client source that names the pack's own vocabulary, comments included.)
//
// NOTE FOR A DOC PASS — not done here, no doc is edited by this change:
// `docs/spec-client.md` 105..106 and 149 and `docs/design/phase2-ui/README.md`
// 65..66 all still describe §3 기질 as a rendered sealed block.
//
// Split model → builder (u4 D1): everything above `buildDossier` is pure.
import { el } from '../shell/dom.ts'

/**
 * The sitting's callsign — document art; the pack carries none (D4).
 *
 * x7 — THE SERIES STARTS UNNUMBERED. It was `ECHO-${Math.max(1, run)}`, which
 * made the very first agent ECHO-1 and spent the bare name `ECHO` on nothing.
 * The first deploy is the DEFAULT one — the operator has handed over nothing
 * yet — so the agent who flies it is just ECHO, and the numbering begins with
 * the second agent, the first one the operator actually shaped:
 *
 *   run 1 → ECHO · run 2 → ECHO-1 · run 3 → ECHO-2 · run 4 → ECHO-3
 *
 * The `Math.max` fallback is gone with it. It existed to keep a run of 0 (the
 * pre-first-press desk) off `ECHO-0`, and `run <= 1` already answers that with
 * the same name the first real sitting gets — there is no second spelling of
 * "the agent who has not been shaped yet" left to drift.
 *
 * 사건 개요 on the cover names 요원 ECHO by hand. That is not a coincidence to
 * be tidied away: the file's opening paragraph and run 1's callsign are the
 * same agent, and if this mapping changes the paragraph is wrong.
 */
export function callsignOf(run: number): string {
  return run <= 1 ? 'ECHO' : `ECHO-${run - 1}`
}

/**
 * The agent AFTER the one `run` sent out — the file's next page (H3, 08-09).
 *
 * WHY IT LIVES HERE. At 21:04 the day is over and the file the operator starts
 * mining into belongs to the agent who has not gone out yet — but the run loop
 * does not name that agent until the press opens their day, so between the
 * close and the press the desk has to head a page for someone the authority has
 * not announced. [u7#c3] forbids the WINDOW doing that arithmetic on the
 * authority's numbers, and rightly: `run`, `runs_left`, `carried` and `archive`
 * are the run loop's and the client mirrors them.
 *
 * A callsign is not one of those numbers. The ECHO series is document art this
 * module already mints (`callsignOf` above — the pack carries no callsign at
 * all, D4), so "who comes after ECHO-3" is a question about the DOCUMENT's own
 * numbering and this is where it is answered. Nothing here reaches the seam,
 * decides a run, or survives into a `meta` field; the window still owns only
 * the choice of WHICH agent a page is about, which is a choice and not a sum.
 *
 * The desk never offers this page on the last day of an allotment — `runs_left`
 * is 0 there and `windows/agent-file.ts` reads it before turning — so no agent
 * is ever named who cannot be sent.
 *
 * x7 — it is STILL `callsignOf(run + 1)` and deliberately nothing more. The
 * series renumbered underneath it (run 1 is now plain ECHO), and the one place
 * an off-by-one could hide is the unnumbered → numbered boundary: after ECHO
 * comes ECHO-1, not ECHO-2. Composing rather than re-deriving is what makes
 * that free — there is one mapping and this reads it. `agent-file.test.ts
 * [u4#c2](g)` pins the boundary so a second copy of the arithmetic cannot be
 * introduced here without failing.
 */
export function nextCallsignOf(run: number): string {
  return callsignOf(run + 1)
}

/**
 * 식별's first row — the one value on an agent's page that IDENTIFIES them.
 *
 * x4 (08-08) — the callsign is printed in seal red and bold, and this constant
 * is what decides which row gets it. The decision lives HERE, beside the copy,
 * rather than as a `dd[data-key='호출부호']` selector in the sheet: the row key
 * is Korean document art this module owns, and a stylesheet that had to spell it
 * would be reading copy it does not own (inv 8 — the sheet gets a class name).
 *
 * Both `agentModel` and `filedModel` open on this same key, so the live agent's
 * page and every past agent's page mark the callsign alike. That is the point —
 * the pages are one document and flipping between them compares like with like.
 */
const CALLSIGN_KEY = '호출부호'

/** The class the sheet paints the callsign with. */
const CALLSIGN_CLASS = 'rd-code'

/** What one agent's page needs. The cover takes nothing — its copy is standing. */
export interface AgentInput {
  /** 인수인계 사항's cap — read from `SLOT_CAP`, so note and board cannot drift (D3). */
  slotCap: number
  /** 식별's 호출부호 — `ECHO-n` for the agent this page belongs to (M1). */
  callsign: string
}

/** What a finished agent's page needs — no cap, because nothing can be placed. */
export interface FiledInput {
  /** 식별's 호출부호 — the agent whose sitting this page records (M1). */
  callsign: string
}

/** A past page's 인수인계 사항 note — the sitting is over and nothing is operable. */
const FILED_NOTE = '파견 종료. 열람 전용'

/**
 * THE COVER'S THREE SECTIONS (민서's own words, x7).
 *
 * x7 replaces the four x6 ratified (임무 · 행동 원칙 · 기질 · 교신 지침). What
 * changes is not the wording but WHAT THE COVER IS FOR. x6's cover was a
 * posting order and nothing else — it opened on orders addressed to the agent,
 * so a reader arriving at the desk cold was told what to do before being told
 * what had happened. x7 puts the INCIDENT first and keeps only the two orders
 * that the incident makes sense of: what the agent is for, and how they talk.
 * 행동 원칙 went with 기질 — a principle the operator cannot act on is a third
 * screenful between the incident and the radio.
 *
 * One rule still governs every line: **the file is issued about and to the
 * agent**, so nothing here names a run, a slot, a round or a tally. The
 * operator learns what they may do by reading what the agent was told, and a
 * word that only makes sense from outside the fiction breaks the one surface
 * that has to be believed. `agent-file.test.ts [u4#c2](e)` enforces that.
 *
 * **The `\n`s are load-bearing, and they are no longer only typography.** Each
 * line becomes its own element in `buildSection` below — see the comment there
 * for the reveal that depends on it.
 *
 * Kept at module scope rather than inline in `coverModel` so the model half
 * stays a value, which `agent-file.test.ts [u4#c2](d)` reads the source of.
 */

/**
 * 사건 개요 — the three-line incident record the whole file hangs off.
 *
 * The date is written 20XX년 XX월 XX일 on purpose. A real date would place the
 * game in a year and invite the reader to check it against a tunnel that does
 * not exist; the redacted form is what a declassified incident summary looks
 * like, and it dates the file without dating the world. The TIME is exact
 * (20시 47분) because a minute is what an incident log actually pins.
 *
 * It names 요원 ECHO in prose. That is the same agent `callsignOf(1)` mints —
 * see the note there; the two are one fact written twice and must not drift.
 */
const INCIDENT =
  '20XX년 XX월 XX일 20시 47분,\n' +
  '해원터널 하행 4.2km 지점에서 흰 연기가 보인다는 신고가 접수된다.\n' +
  '긴급상황대응실 본부는 즉시 현장에 요원 ECHO를 파견하여 상황 파악을 시작했다.'

/**
 * 사건 개요's footing — the one line on the cover that is not in the fiction.
 *
 * It says the operator is reading a RECONSTRUCTION of ECHO's radio log, which
 * is the only honest way to explain why a past incident can be replayed with
 * different handovers each time. Printed as body prose it would read as a
 * fourth incident clause and quietly contradict the three above it; it is a
 * small red note under the rule instead, which is how a form footnotes itself.
 * `.sect-note` is what the sheet paints that with.
 */
// x7 — the ※ is part of the STRING, not a `::before` (민서, 08-09). The cover's
// reveal prints text nodes, and a mark painted by the sheet would be on the page
// before the sentence it belongs to had a character — the one glyph that would
// give away that the line was coming. It types with the rest.
const INCIDENT_NOTE = '※ 본 시뮬레이션은 당시 ECHO의 현장 무전 기록을 토대로 재구성되었습니다.'

/**
 * 현장 요원 임무 — one line, and it is the whole posting.
 *
 * x6's 임무 ran three clauses: the posting, what it is for, and the one-way
 * radio. The first is now 사건 개요's third line (본부 파견한다 is the incident's
 * own event, not an order), and the third is a fact the desk teaches by going
 * quiet. What is left is the only clause an operator can hold in their head
 * while choosing what to hand over: find out what it is, and keep people alive.
 */
const MISSION = '파견된 현장 위기 대응실에서 긴급 상황의 정체를 파악하고, 인명 피해를 최소화한다.'

/**
 * 현장 요원 교신 지침's standing orders (민서's own words, x5; x6 named 본부).
 *
 * The line these replaced was an AGENT'S PROMPT wearing a dossier's clothes: it
 * named the round loop and the seam's own per-round budget ('라운드 종료 시
 * 현장 기록 최대 8건과 무전 기록 한 편을 송신한다'), which is scheduling the
 * player can neither see nor change, printed on a page that is meant to read as
 * standing orders issued to a person on a radio.
 *
 * The second line hands the one-sentence-per-line rule the one thing it never
 * had: a reason a field agent would accept for writing that way. 약해질, not
 * 약할 — the signal degrades over the day rather than being poor from the start.
 *
 * x7 — 상황을 무전으로 보고한다, was 상황을 보고한다. The heading now says 교신
 * 지침 of a 현장 요원 and the medium is the thing the whole file is a record of
 * (see `INCIDENT_NOTE`), so the order names it rather than leaving 보고 to mean
 * whatever a reader assumes reporting is.
 */
const COMMS_ORDERS =
  '회선이 열려 있는 동안 수시로 본부에 상황을 무전으로 보고한다.\n' +
  '관측한 것과 판단한 것을 구분하여 송신하며, 수신 신호가 약해질 수 있으니 문장을 짧게 끝맺는다.'

interface SectionHead {
  title: string
  /**
   * The section's stable ASCII name, printed as `data-sect` by the builder.
   *
   * It exists for callers OUTSIDE this window that have to point at one
   * section: the coach-mark walk anchors a plate on 인수인계 사항, and that
   * section is `.sect.operable` on the live agent's page and `.sect.filed` on a
   * past one. Those are two STATES of one section, not two sections, and
   * `.sect.fixed` covers four unrelated ones — so state cannot serve as a name.
   * The slug is what does not move when the state does.
   *
   * It is NOT the title, and it is never derived from one. The Korean titles are
   * document art this module owns, exactly as the row key is (see `CALLSIGN_KEY`
   * above, which is the same ruling in the same file): a selector that spelled
   * `인수인계 사항` would have a stylesheet or a tutorial reading copy it does not
   * own, and x5 reworded half of this page's copy without touching a single
   * section's identity — which is the property the slug preserves.
   *
   * OPTIONAL, and the cover uses none. A slug is earned by being pointed at from
   * outside, so the rule is "name what someone else has to find", not "name
   * everything": today that is `identity` and `handover` on the agent's page and
   * its filed copies, and nothing at all on the cover. `ui/tutorial-coach` did
   * slug the cover's three sections, for three plates x8 then cut — see the note
   * at `coverModel`. A slug with no caller is a selector nobody is holding, which
   * is worse than no selector: it reads as a contract when it is a leftover.
   */
  slug?: string
}

export interface RowsSection extends SectionHead {
  state: 'fixed'
  rows: [string, string][]
}

export interface FixedSection extends SectionHead {
  state: 'fixed'
  /** `\n`-separated; every line becomes its own element (`buildSection`). */
  body: string
  /**
   * A small red footnote under the body — 사건 개요's is the only one (x7).
   *
   * THE NAME IS SHARED WITH A DIFFERENT THING — read this before reusing it.
   * `OperableSection.note` and `FiledSection.note` are 인수인계 사항's standing
   * instruction and render as ordinary `.sect-body` prose. THIS one renders as
   * its own `.sect-note` element, small and red. Nothing tells them apart but
   * `state`, and `buildSection` is the only reader of either — so do not write
   * a helper that takes "a section's note" and expects one behaviour.
   */
  note?: string
}

export interface OperableSection extends SectionHead {
  state: 'operable'
  note: string
}

/** U5.3 — an operable section whose sitting is over. Same shape, no gestures. */
export interface FiledSection extends SectionHead {
  state: 'filed'
  note: string
}

export type DossierSection = RowsSection | FixedSection | OperableSection | FiledSection

// x7 — THE SECTION FLAGS ARE GONE (민서, 08-09). `고정` · `조작 가능` · `열람`
// were a badge in the corner of every section head on every page, and earlier
// the same day `봉인` left with the sealed section.
//
// They were the form telling the operator what kind of field it was about to
// show them, next to a heading that already says it: 인수인계 사항 is the only
// thing on the desk that can be operated, and it is operable because it has
// slots in it, not because a chip says so. What is left is the heading and its
// rule, which is what the page was always read by.
//
// `state` survives on the model and on the element's class — the sheet still
// paints `.sect.fixed .sect-body` a shade down from the operable one, so the
// distinction is carried by the ink rather than announced by a label.

/**
 * Pure: the cover's sections — everything true of every agent, in order.
 *
 * x7 — THREE, and the order is a case file's, not a posting order's: what
 * happened (사건 개요), who was sent for it and what for (현장 요원 임무), and
 * how they were told to talk (현장 요원 교신 지침). The two 임무/교신 headings
 * carry 현장 요원 explicitly now, because 사건 개요 above them speaks about the
 * agent in the third person and the reader has to be handed the switch from
 * "this is what happened" to "this is what they were ordered".
 *
 * It takes no argument. 임무 used to print the pack's clock band; a posting
 * order does not print the shift's hours, the topbar clock does
 * (`components/game-clock.ts`), and the window's pack-fed value is its doc
 * number.
 */
export function coverModel(): DossierSection[] {
  return [
    // No slugs on the cover, and that is a decision the merge made rather than
    // inherited. `ui/tutorial-coach` slugged all three of these (`mission`,
    // `conduct`, `comms`) back when three of the walk's plates opened ON the
    // cover; x8 cut those plates — the cover types its own incident brief now,
    // and a plate narrating a document mid-performance is a second voice over
    // the first. Nothing outside this window points here any more, so nothing
    // here needs a name. `handover` below is the one slug still earning its keep.
    { title: '사건 개요', state: 'fixed', body: INCIDENT, note: INCIDENT_NOTE },
    { title: '현장 요원 임무', state: 'fixed', body: MISSION },
    { title: '현장 요원 교신 지침', state: 'fixed', body: COMMS_ORDERS },
  ]
}

/** Pure: one agent's own page — who they are, and what they were handed. */
export function agentModel(input: AgentInput): DossierSection[] {
  return [
    {
      title: '식별',
      slug: 'identity',
      state: 'fixed',
      rows: [
        ['호출부호', input.callsign],
        ['배치', '위기 대응실(상황실) · 비공개 직통 회선'],
        ['권한', '청취 · 조회 · 요청. 집행권 없음'],
      ],
    },
    {
      // x5 — was '주입 슬롯 4칸. 배치 후 잠금.', which described the MECHANISM: a
      // slot, an injection, a lock. None of those are things one shift tells the
      // next. The cap still comes from `slotCap` and not from a literal (D3), so
      // the note and the board it sits above cannot drift.
      title: '인수인계 사항',
      // …and the SAME slug the past-page version below carries. That sameness is
      // the whole point of having a slug at all: the live sheet and every filed
      // sheet are one section in two states, so whatever points at the handover
      // finds it on either page.
      slug: 'handover',
      state: 'operable',
      note: `요원에게 최대 ${input.slotCap}가지 주요 사항을 전달하십시오`,
    },
  ]
}

/**
 * Pure: a FINISHED agent's page — the same document, closed.
 *
 * U5.3. 식별 is identical in shape to the live agent's, because it is the same
 * document art with a different callsign; what changes is 인수인계 사항, which
 * is no longer something the operator can operate. It is a record of what went
 * out, and its flag says so.
 */
export function filedModel(input: FiledInput): DossierSection[] {
  return [
    {
      title: '식별',
      slug: 'identity',
      state: 'fixed',
      rows: [
        ['호출부호', input.callsign],
        ['배치', '위기 대응실(상황실) · 비공개 직통 회선'],
        ['권한', '청취 · 조회 · 요청. 집행권 없음'],
      ],
    },
    {
      // x5 — was '배치 N건. 시행 종료 — 열람 전용.' The count is printed by the
      // page itself now (the handover is a paragraph of N sentences, right
      // below), so the note said out loud what the reader can see, and 배치 is
      // the vocabulary the confirmation plate retired in favour of 파견.
      title: '인수인계 사항',
      // The live page's slug, unchanged — see `agentModel`. `state` is what says
      // the sitting is over; the name says which section it is.
      slug: 'handover',
      state: 'filed',
      note: FILED_NOTE,
    },
  ]
}

/* ══ the builder half ════════════════════════════════════════════════════ */

export function buildDossier(model: readonly DossierSection[], slotHost: HTMLElement): HTMLElement {
  const root = el('div')
  root.id = 'dossier'
  for (const section of model) root.append(buildSection(section, slotHost))
  return root
}

/**
 * Hand-authored markup separates its elements with whitespace and a document
 * READS that way; markup built element by element carries none, so a section's
 * text would run together (`사건 개요고정20XX년…`). The separators are
 * whitespace-only text nodes: a flex container drops them, so nothing moves.
 *
 * x7 — it is now also used BETWEEN the body's per-line elements, where the
 * separator must be a space and never a `\n`. `.sect-body` is `pre-line`, which
 * collapses spaces (so a space-only node yields no box) but PRESERVES newlines
 * — a `\n` separator would print a blank line between every clause.
 */
/**
 * The series name, set apart where a section's BODY says it (x7, 민서 08-09).
 *
 * Bodies only. The red note is already set entirely in the seal's red, so a
 * bold inside it would be emphasis with nothing to contrast against — it is
 * rendered as plain text and left alone.
 *
 * 사건 개요 names the agent the file is about, and that name is the one word on
 * the page the operator will be reading for the rest of the sitting — on the
 * dossier's own 호출부호 row, on the report's signature, on every rail tab. The
 * sheet paints `.rd-echo` in the seal's red and bold, the same ink `.rd-code`
 * already gives the callsign row, so the brief and the identity agree.
 *
 * `ECHO` and not `callsignOf(...)`: this is the SERIES, not a sitting. The
 * incident summary is about the agent programme, and the run it is eventually
 * read beside may be ECHO-2. A literal is the honest thing here, and it is the
 * one place the bare series name is set in prose rather than minted.
 *
 * Returns nodes rather than markup so the caller keeps control of the row, and
 * so the cover's reveal still sees plain text runs it can print into — the
 * `<b>` simply makes the sentence three text nodes instead of one, which
 * `collectCover` handles by keying its line pause to the ROW.
 */
const CALLSIGN_SERIES = 'ECHO'

function callsignMarked(line: string): Node[] {
  const parts = line.split(CALLSIGN_SERIES)
  if (parts.length === 1) return [document.createTextNode(line)]
  const out: Node[] = []
  for (const [index, part] of parts.entries()) {
    if (index > 0) out.push(el('b', 'rd-echo', CALLSIGN_SERIES))
    if (part.length > 0) out.push(document.createTextNode(part))
  }
  return out
}

function spaced(...nodes: Node[]): Node[] {
  return nodes.flatMap((node, index) => (index === 0 ? [node] : [document.createTextNode(' '), node]))
}

function buildSection(section: DossierSection, slotHost: HTMLElement): HTMLElement {
  const node = el('div', `sect ${section.state}`)
  // The state is a CLASS and the name is a DATA ATTRIBUTE, on purpose: the sheet
  // paints states (`.sect.operable .sect-flag`) and never asks which section it
  // has, while everything that asks which section it has (the coach-mark walk)
  // never paints. Two readers, two channels, and neither can be mistaken for the
  // other the way a second class in `sect ${state}` could be.
  if (section.slug !== undefined) node.dataset.sect = section.slug
  const head = el('div', 'sect-hd')
  // C1 — no `§n`. The titles are distinct words and carry the document on
  // their own; a number that has to be kept in step with a page order is one
  // more thing that can contradict the page it is printed on.
  head.append(el('h4', undefined, section.title))

  if ('rows' in section) {
    const rows = el('dl', 'sect-rows')
    for (const [key, value] of section.rows) {
      const dd = el('dd', key === CALLSIGN_KEY ? CALLSIGN_CLASS : undefined, value)
      rows.append(...spaced(el('dt', undefined, key), dd))
    }
    node.append(...spaced(head, rows))
    return node
  }

  // A filed section renders exactly like an operable one — a note and a host —
  // and differs only in what the caller puts in that host and what the flag
  // says. U5.3's past pages hand it read-only cards; the live page hands the
  // operable section the one SlotBoard (D7).
  if (section.state === 'operable' || section.state === 'filed') {
    node.append(...spaced(head, el('div', 'sect-body', section.note), slotHost))
    return node
  }

  // x7 — ONE ELEMENT PER AUTHORED LINE, inside the `.sect-body` the section
  // already had. The body used to be a single text node and `white-space:
  // pre-line` in the sheet turned the `\n`s into breaks, which is enough for
  // typography and not enough for the cover's reveal: the reveal holds longer
  // between LINES than between words, and it cannot pause at a break it cannot
  // address. `.sect-body` stays the one wrapper (e2e reads its text as a whole)
  // and the lines are `.sect-line` children of it.
  const body = el('div', 'sect-body')
  body.append(
    ...spaced(
      ...section.body.split('\n').map((line) => {
        const row = el('div', 'sect-line')
        row.append(...callsignMarked(line))
        return row
      }),
    ),
  )

  // The note is a SIBLING of the body, never a span inside its last line: the
  // sheet paints it small and red and the reveal treats it as its own beat.
  const parts = section.note === undefined ? [body] : [body, el('div', 'sect-note', section.note)]
  node.append(...spaced(head, ...parts))
  return node
}
