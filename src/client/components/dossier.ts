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
// 기질 is SEALED BY CONSTRUCTION (spec-client §3 inv 4 / I13): `SealedSection`
// has no field an agent's inner disposition could be written into, so no such
// value can reach this window even by accident. The redaction bars are the art —
// there is nothing underneath them to reveal (design README 65..69).
//
// Split model → builder (u4 D1): everything above `buildDossier` is pure.
import { animationsFrozen } from '../driver/index.ts'
import { el } from '../shell/dom.ts'

/** The sitting's callsign, `ECHO-n` — document art; the pack carries none (D4). */
export function callsignOf(run: number): string {
  return `ECHO-${Math.max(1, run)}`
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
 */
export function nextCallsignOf(run: number): string {
  return callsignOf(run + 1)
}

export const SEALED_COPY = '열람 불가 — 운영자 권한으로 접근되지 않는 구획입니다. (봉인 I13)'

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

/**
 * The redaction's rhythm, as **percentages** of the strip.
 *
 * The reference sets these widths in `px` (`app.js` 226); C11 / inv 8 forbids a
 * size literal in component code, and `%` is the ratio the reference's rhythm
 * actually encodes.
 *
 * x5 — TWO LINES, down from six. Ten bars filled roughly six rows of the strip,
 * which is a paragraph's worth of blacked-out text: the page spent more height
 * on what the operator may not read than on 임무 and 행동 원칙 together, and read
 * as the file's main event. There is nothing underneath it to reveal (I13), so
 * length was never carrying information — two lines say 봉인 just as completely
 * and give the page back to the sections that have something in them. The last
 * bar is the widest so the block ends ragged, the way a redacted paragraph's
 * final line does.
 */
const SEALED_BARS: readonly number[] = [58, 34, 71]

/** Reference stagger between bars (`app.js` 226); pinned to one frame when frozen. */
const BAR_STEP = 45

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
 * THE COVER'S FOUR UNSEALED SECTIONS (민서's own words, x6).
 *
 * One rule governs all four: **the file is issued TO the agent**, so every line
 * is something a dispatcher writes to a person being posted, never something
 * the game says about itself. That is why none of them names a run, a slot, a
 * round or a tally — the operator learns what they may do by reading what the
 * agent was told, and a word that only makes sense from outside the fiction
 * breaks the one surface that has to be believed.
 *
 * **The `\n`s are load-bearing.** These read as a posting order's numbered
 * clauses, one per line, not as justified prose; `win-agent-file.css` gives
 * `.sect-body` `white-space: pre-line` and the newlines survive to the page.
 *
 * Kept at module scope rather than inline in `coverModel` so the model half
 * stays a value, which `agent-file.test.ts (d)` reads the source of.
 */
/**
 * 임무 — three clauses: the posting, what it is for, and how far the radio
 * reaches back.
 *
 * The third clause is the one that makes the loop legible. Nothing on the desk
 * said the operator cannot reach the agent once the file is committed; the
 * player had to infer it from the DEPLOY button going quiet. Said in the
 * agent's own orders it costs no meta-language at all — the radio is one-way,
 * and the file IS the briefing.
 *
 * It sits INSIDE 임무 rather than in a 지휘 관계 section of its own (which x6
 * drafted and 민서 folded back): the posting and the silence that follows it
 * are one fact, and a fifth heading bought a second scroll on the cover to say
 * so twice.
 *
 * 파견되었다, not 파견된다 — the file is read by someone already posted.
 */
const MISSION =
  '긴급 상황 신고에 따라 현장 위기 대응실에 파견되었다.\n' +
  '비공개 직통 회선을 받으며 회선 너머의 발신자가 말하는 긴급 상황의 정체를 확인하고, 인명 피해를 줄여야 한다.\n' +
  '본부는 요원의 교신을 받으나, 회신하지 않는다. 파견 시각 이후 하달되는 지시는 없다. 이 파일에 적힌 것이 요원이 받은 지시의 전부다.'

/**
 * 행동 원칙 — G4's person, keeping her voice.
 *
 * G4 rewrote this section as someone speaking rather than a manual, and x6 does
 * not take that back. What changes is where the judgment GOES: it is sent to
 * 본부, which is the operator's only sight of it. The closing clause answers
 * 식별's own `권한 — 청취 · 조회 · 요청. 집행권 없음` in the agent's words, and
 * it is one line — 임무 carries three now, and a conduct that ran as long
 * stopped reading as the one thing the agent is meant to hold on to.
 */
const CONDUCT =
  '확인되지 않은 것을 단정하지 않으며, 자체 판단 시 해당 내용을 본부에 송신한다. 집행은 요원의 일이 아니지만, 판단은 요원의 일이다.'

/**
 * 교신 지침's standing orders (민서's own words, x5; x6 names the recipient).
 *
 * The line it replaces was an AGENT'S PROMPT wearing a dossier's clothes: it
 * named the round loop and the seam's own per-round budget ('라운드 종료 시
 * 현장 기록 최대 8건과 무전 기록 한 편을 송신한다'), which is scheduling the
 * player can neither see nor change, printed on a page that is meant to read as
 * standing orders issued to a person on a radio. Worse, it exposed the shape of
 * the machine at exactly the point where the fiction asks to be believed.
 *
 * The replacement says what a real comms instruction would — and it hands the
 * one-sentence-per-line rule the one thing it never had: a reason a field agent
 * would accept for writing that way.
 *
 * x6 — 본부 is named (it is now a place 임무's third clause has established) and
 * the signal 약해질, not 약할: it degrades over the day rather than being poor
 * from the start, which is what the agent is being warned about.
 */
const COMMS_ORDERS =
  '회선이 열려 있는 동안 수시로 본부에 상황을 보고한다.\n' +
  '관측한 것과 판단한 것을 구분하여 송신하며, 수신 신호가 약해질 수 있으니 문장을 짧게 끝맺는다.'

interface SectionHead {
  title: string
}

export interface RowsSection extends SectionHead {
  state: 'fixed'
  rows: [string, string][]
}

export interface FixedSection extends SectionHead {
  state: 'fixed'
  body: string
}

export interface SealedSection extends SectionHead {
  state: 'sealed'
  body: string
  bars: number[]
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

export type DossierSection =
  | RowsSection
  | FixedSection
  | SealedSection
  | OperableSection
  | FiledSection

const FLAG: Readonly<Record<DossierSection['state'], string>> = {
  fixed: '고정',
  sealed: '봉인',
  operable: '조작 가능',
  filed: '열람',
}

/**
 * Pure: the cover's sections — everything true of every agent, in order.
 *
 * x6 — the four headings are unchanged, and the order is the order a posting
 * order is read in: where you are sent and how far the radio reaches back
 * (임무), how you decide inside that (행동 원칙), what nobody may look at
 * (기질), and what you send back (교신 지침).
 *
 * It takes no argument. 임무 used to print the pack's clock band; a posting
 * order does not print the shift's hours, the topbar clock does
 * (`components/game-clock.ts`), and the window's pack-fed value is its doc
 * number.
 */
export function coverModel(): DossierSection[] {
  return [
    { title: '임무', state: 'fixed', body: MISSION },
    { title: '행동 원칙', state: 'fixed', body: CONDUCT },
    { title: '기질', state: 'sealed', body: SEALED_COPY, bars: [...SEALED_BARS] },
    { title: '교신 지침', state: 'fixed', body: COMMS_ORDERS },
  ]
}

/** Pure: one agent's own page — who they are, and what they were handed. */
export function agentModel(input: AgentInput): DossierSection[] {
  return [
    {
      title: '식별',
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
 * READS that way; markup built element by element carries none, so the section
 * would run its words together (`기질봉인열람 불가…`). The separators are
 * whitespace-only text nodes: a flex container drops them, so nothing moves.
 */
function spaced(...nodes: Node[]): Node[] {
  return nodes.flatMap((node, index) => (index === 0 ? [node] : [document.createTextNode(' '), node]))
}

function buildSection(section: DossierSection, slotHost: HTMLElement): HTMLElement {
  const node = el('div', `sect ${section.state}`)
  const head = el('div', 'sect-hd')
  // C1 — no `§n`. The titles are distinct words and carry the document on
  // their own; a number that has to be kept in step with a page order is one
  // more thing that can contradict the page it is printed on.
  head.append(
    ...spaced(el('h4', undefined, section.title), el('span', 'sect-flag', FLAG[section.state])),
  )

  if ('rows' in section) {
    const rows = el('dl', 'sect-rows')
    for (const [key, value] of section.rows) {
      const dd = el('dd', key === CALLSIGN_KEY ? CALLSIGN_CLASS : undefined, value)
      rows.append(...spaced(el('dt', undefined, key), dd))
    }
    node.append(...spaced(head, rows))
    return node
  }

  if (section.state === 'sealed') {
    node.append(...spaced(head, buildRedaction(section.bars), el('div', 'sealed-note', section.body)))
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

  node.append(...spaced(head, el('div', 'sect-body', section.body)))
  return node
}

function buildRedaction(bars: readonly number[]): HTMLElement {
  const strip = el('div', 'redact')
  const frozen = animationsFrozen()
  bars.forEach((width, index) => {
    const bar = el('i')
    // `.redact` is a flex row, so a bar is sized by its basis — a RATIO of the
    // strip, never a length (inv 8; `.style.width` is banned outright, C12).
    bar.style.flexBasis = `${width}%`
    bar.style.animationDelay = frozen ? '0ms' : `${index * BAR_STEP}ms`
    strip.append(bar)
  })
  return strip
}
