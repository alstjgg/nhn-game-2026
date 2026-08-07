// Dossier — the AGENT FILE's §0–§5, the document the operator reads
// (spec-client §4). Ported from docs/design/phase2-ui/app.js `renderDossier`
// (203..232) + `data.js` DOSSIER (37..68) onto u1's vendored `.sect` skin.
//
// The copy is DOCUMENT ART, not pack data: the pack carries no callsign and no
// standing orders. Exactly four things are pack-fed, and they arrive as the two
// arguments of `DossierInput` (u4 D2/D4).
//
// §3 기질 is SEALED BY CONSTRUCTION (spec-client §3 inv 4 / I13): `SealedSection`
// has no field an agent's inner disposition could be written into, so no such
// value can reach this window even by accident. The redaction bars are the art —
// there is nothing underneath them to reveal (design README 65..69).
//
// Split model → builder (u4 D1): everything above `buildDossier` is pure.
import { animationsFrozen } from '../driver/index.ts'
import { el } from '../shell/dom.ts'

/** The agent's callsign — document art; the pack carries none (D4). */
export const CALLSIGN = 'ECHO-1'

export const SEALED_COPY = '열람 불가 — 운영자 권한으로 접근되지 않는 구획입니다. (봉인 I13)'

/**
 * The redaction's rhythm, as **percentages** of the strip.
 *
 * The reference sets these widths in `px` (`app.js` 226); C11 / inv 8 forbids a
 * size literal in component code, and `%` is the ratio the reference's rhythm
 * actually encodes. Frozen 10-value pattern, reference widths halved.
 */
const SEALED_BARS: readonly number[] = [46, 27, 70, 34, 55, 22, 63, 40, 29, 52]

/** Reference stagger between bars (`app.js` 226); pinned to one frame when frozen. */
const BAR_STEP = 45

export interface DossierInput {
  /** §4's cap — read from `SLOT_CAP`, so note and board cannot drift (D3). */
  slotCap: number
  /** §1's pack-fed band, `"HH:MM → HH:MM"`; empty until the pack answers. */
  clockBand: string
  /** §4's host. Opaque to the model — only `buildDossier` ever touches it. */
  slotHost: HTMLElement
}

interface SectionHead {
  no: string
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

export type DossierSection = RowsSection | FixedSection | SealedSection | OperableSection

const FLAG: Readonly<Record<DossierSection['state'], string>> = {
  fixed: '고정',
  sealed: '봉인',
  operable: '조작 가능',
}

/** §1's mission line: the band is the pack's, the sentence is the design target's. */
function missionBody(clockBand: string): string {
  const day = clockBand.length > 0 ? `고정 하루(${clockBand})` : '고정 하루'
  return `${day} 안에서, 회선 너머의 발신자가 말하는 재앙의 정체를 확인하고 인명 피해를 줄인다. 요원은 상황실을 벗어나지 않는다.`
}

/** Pure: the six sections §0–§5, in order. */
export function dossierModel(input: DossierInput): DossierSection[] {
  return [
    {
      no: '§0',
      title: '식별',
      state: 'fixed',
      rows: [
        ['호출부호', CALLSIGN],
        ['배치', '위기 대응실(상황실) · 비공개 직통 회선'],
        ['권한', '청취 · 조회 · 요청. 집행권 없음'],
      ],
    },
    { no: '§1', title: '임무', state: 'fixed', body: missionBody(input.clockBand) },
    {
      no: '§2',
      title: '행동 원칙',
      state: 'fixed',
      body: '확인되지 않은 것을 단정하지 않는다. 판단이 필요한 순간에는 판단하고, 왜 그랬는지 남긴다.',
    },
    { no: '§3', title: '기질', state: 'sealed', body: SEALED_COPY, bars: [...SEALED_BARS] },
    {
      no: '§4',
      title: '인수인계 사항',
      state: 'operable',
      note: `주입 슬롯 ${input.slotCap}칸. 배치 후 잠금.`,
    },
    {
      no: '§5',
      title: '교신 지침',
      state: 'fixed',
      body: '라운드 종료 시 현장 기록 최대 8건과 무전 기록 한 편을 송신한다. 판단과 인상은 한 문장에 하나씩, 문장 단위로 완결되게 쓴다.',
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
 * would run its words together (`§3기질봉인열람 불가…`). The separators are
 * whitespace-only text nodes: a flex container drops them, so nothing moves.
 */
function spaced(...nodes: Node[]): Node[] {
  return nodes.flatMap((node, index) => (index === 0 ? [node] : [document.createTextNode(' '), node]))
}

function buildSection(section: DossierSection, slotHost: HTMLElement): HTMLElement {
  const node = el('div', `sect ${section.state}`)
  const head = el('div', 'sect-hd')
  head.append(
    ...spaced(
      el('span', 'sect-no', section.no),
      el('h4', undefined, section.title),
      el('span', 'sect-flag', FLAG[section.state]),
    ),
  )

  if ('rows' in section) {
    const rows = el('dl', 'sect-rows')
    for (const [key, value] of section.rows) {
      rows.append(...spaced(el('dt', undefined, key), el('dd', undefined, value)))
    }
    node.append(...spaced(head, rows))
    return node
  }

  if (section.state === 'sealed') {
    node.append(...spaced(head, buildRedaction(section.bars), el('div', 'sealed-note', section.body)))
    return node
  }

  if (section.state === 'operable') {
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
