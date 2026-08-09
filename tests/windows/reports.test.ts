// u6 — REPORTS window: the PURE half.
//
// vitest runs `environment: 'node'` (vitest.config.ts), so this file asserts
// only what is DOM-free: the mark sets, the sentence state map, the mine
// reducer, the archive segmentation, the typewriter cursor — plus the
// source-level guards the browser cannot express. The DOM half is
// `e2e/reports.spec.ts` (u6 design D1).
//
// Covers [u6#c3] mine op carries authored id · [u6#c5] minable states ·
// [u6#c6] sentence anchors expose data-sentence-id · [u6#c9] never
// re-segments/re-classifies · [u6#c10] run-wide hard constraints.
//
// Test titles are load-bearing — the unit's verification commands filter with
// `-t 'mine op carries authored id'`, `-t 'minable states'` and
// `-t 'sentence anchors expose data-sentence-id'`. Do not rename a describe
// block without updating `.claude/super/units/u6.md`.
//
// C3: nothing here asserts fixture CONTENT. Every sentence id and every label
// used below is read out of whatever fixture run ships in the tree, so the
// suite survives u2f replacing placeholder content wholesale.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import type { MembraneOp, Sentence, ViewEvent } from '../../src/shared/view-driver.ts'
import type { FixtureStore } from '../../src/client/driver/fixture-driver.ts'
import { createFixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import type { FixtureRun } from '../../src/client/driver/fixtures/types.ts'
import { CLIENT, exists, importable, read, rel, stripComments, tsFiles } from '../shell/shell-utils.ts'

/* ── the four modules this unit owns ─────────────────────────────────────── */

const MINABLE_TS = path.join(CLIENT, 'components/minable-sentence.ts')
const ARCHIVE_TS = path.join(CLIENT, 'components/report-archive.ts')
const VIEW_TS = path.join(CLIENT, 'components/report-view.ts')
const REPORTS_TS = path.join(CLIENT, 'windows/reports.ts')
const UNIT_FILES = [MINABLE_TS, ARCHIVE_TS, VIEW_TS, REPORTS_TS] as const
/**
 * NOT a unit file — u4's, and deliberately outside every scan above.
 *
 * x7 — the rail's tab is a CALLSIGN, and the callsign has one owner
 * (`callsignOf`, D4: the pack carries none, so the whole series is document
 * art). This file used to pin the strings that owner happened to return, which
 * proved only that the assertion and the mint were written on the same day; see
 * `[u6#c4] (b)` for what it costs.
 */
const DOSSIER_TS = path.join(CLIENT, 'components/dossier.ts')
const FIXTURES_DIR = path.join(CLIENT, 'driver/fixtures')

interface Source {
  readonly file: string
  readonly text: string
}

/** The unit's own sources, comment-stripped. Empty entries are NOT tolerated. */
function unitSources(): Source[] {
  return UNIT_FILES.filter((f) => exists(f)).map((f) => ({ file: rel(f), text: stripComments(read(f)) }))
}

/** Fails loudly (never vacuously) when a source-level scan has nothing to read. */
function scannedSources(): Source[] {
  const sources = unitSources()
  expect(
    UNIT_FILES.filter((f) => !exists(f)).map(rel),
    'the scan is vacuous — u6 has not written these files yet',
  ).toEqual([])
  expect(sources.every((s) => s.text.trim().length > 0)).toBe(true)
  return sources
}

function offenders(re: RegExp): string[] {
  return scannedSources()
    .filter((s) => re.test(s.text))
    .map((s) => s.file)
}

/* ── the exported surface (u6 design §4) ─────────────────────────────────── */

type MinableState = 'unmined' | 'mined' | 'slotted' | 'carried'

interface MarkSets {
  mined: ReadonlySet<string>
  slotted: ReadonlySet<string>
  carried: ReadonlySet<string>
}

interface MineEffect {
  tear: string
  card: { sentence_id: string }
}

interface MineOutcome {
  ops: MembraneOp[]
  effects: MineEffect[]
}

interface MinableModule {
  deriveMarks(store: FixtureStore, carried: readonly string[]): MarkSets
  sentenceState(id: string, marks: MarkSets): MinableState
  sentenceClass(state: MinableState): string
  sentenceAttrs(sentence: Sentence): Readonly<Record<string, string>>
  mine(id: string, marks: MarkSets): MineOutcome
  isMineKey(key: string): boolean
}

interface ArchiveSegment {
  run: number
  runLabel: string
  span: string
  selected: boolean
}

interface ArchiveModule {
  archiveSegments(
    archive: readonly { run: number; label: string }[],
    activeRun: number,
  ): ArchiveSegment[]
  railKeyIndex(count: number, current: number, key: string): number | null
}

/** u4's — the one mint of the ECHO series. See `DOSSIER_TS`. */
interface DossierModule {
  callsignOf(run: number): string
}

interface TypeState {
  sentence: number
  chars: number
  done: boolean
}

/** A shadow of `components/report-view.ts`'s own — keep the two in step. */
interface ReportModel {
  round: number
  facts: Sentence[]
  report_body: Sentence[]
  opens?: string[]
}

interface ChopState {
  sealed: boolean
  received: boolean
  typed: boolean
}

interface ViewModule {
  typeCursor(state: TypeState, elapsedMs: number, lengths: readonly number[]): TypeState
  minedCount(model: ReportModel, marks: MarkSets): number
  accumulated(held: ReportModel | null, slice: ReportModel): ReportModel
  chopDown(state: ChopState): boolean
}

async function minable(): Promise<MinableModule> {
  return (await import(importable(MINABLE_TS))) as unknown as MinableModule
}

async function archive(): Promise<ArchiveModule> {
  return (await import(importable(ARCHIVE_TS))) as unknown as ArchiveModule
}

async function dossier(): Promise<DossierModule> {
  return (await import(importable(DOSSIER_TS))) as unknown as DossierModule
}

async function view(): Promise<ViewModule> {
  return (await import(importable(VIEW_TS))) as unknown as ViewModule
}

/* ── fixtures: read, never authored (C3) ─────────────────────────────────── */

interface FixtureReport {
  fixture: string
  round: number
  facts: Sentence[]
  report_body: Sentence[]
}

/** Every `report` event carried by every fixture run that ships in the tree. */
async function fixtureReports(): Promise<FixtureReport[]> {
  const out: FixtureReport[] = []
  for (const file of tsFiles(FIXTURES_DIR).filter((f) => !f.endsWith('types.ts'))) {
    const mod = (await import(importable(file))) as Record<string, unknown>
    for (const value of Object.values(mod)) {
      const run = value as Partial<FixtureRun>
      if (!run || !Array.isArray(run.events)) continue
      for (const event of run.events as ViewEvent[]) {
        if (event.type !== 'report') continue
        out.push({
          fixture: rel(file),
          round: event.round,
          facts: event.facts,
          report_body: event.report_body,
        })
      }
    }
  }
  return out
}

/** The fixture sentences of both panes, flattened. */
async function fixtureSentences(): Promise<Sentence[]> {
  return (await fixtureReports()).flatMap((r) => [...r.facts, ...r.report_body])
}

function store(over: Partial<FixtureStore> = {}): FixtureStore {
  return { mined: [], slots: {}, deployed: [], ...over }
}

/** A synthetic, content-free stream — enough to answer a `mine` op. */
function opRun(): FixtureRun {
  return {
    id: 'u6-op-spy',
    start: '13:05',
    end: '13:09',
    events: [{ type: 'meta', run: 1, runs_left: 0, carried: [], archive: [] }],
    responses: { mine: { ok: true } },
  }
}

/* ══ [u6#c3] mine op carries authored id ════════════════════════════════ */

describe('[u6#c3] mine op carries authored id', () => {
  it('(a) the pure surface is exported and DOM-free — importing it under node works', async () => {
    const m = await minable()
    for (const fn of ['deriveMarks', 'sentenceState', 'sentenceClass', 'sentenceAttrs', 'mine', 'isMineKey']) {
      expect(typeof (m as unknown as Record<string, unknown>)[fn], `minable-sentence.ts must export ${fn}()`).toBe(
        'function',
      )
    }
  })

  it('(b) mining an unmined sentence yields exactly one op, keyed by the authored id', async () => {
    const m = await minable()
    const sentences = await fixtureSentences()
    expect(sentences.length, 'no fixture report to mine — the scan is vacuous').toBeGreaterThan(0)

    const target = sentences[0]!
    const outcome = m.mine(target.id, m.deriveMarks(store(), []))
    expect(outcome.ops).toEqual([{ op: 'mine', sentence_id: target.id }])
    expect(outcome.ops[0]).not.toHaveProperty('text')
  })

  it('(c) the id is the authored id, never the screen text', async () => {
    const m = await minable()
    for (const s of await fixtureSentences()) {
      const op = m.mine(s.id, m.deriveMarks(store(), [])).ops[0] as { sentence_id: string }
      expect(op.sentence_id).toBe(s.id)
      expect(op.sentence_id).not.toBe(s.text)
      expect(JSON.stringify(op)).not.toContain(s.text)
    }
  })

  it('(d) two sentences with identical text still mine as two distinct ids', async () => {
    const m = await minable()
    const marks = m.deriveMarks(store(), [])
    const a = m.mine('b-r2-f03', marks).ops[0] as { sentence_id: string }
    const b = m.mine('b-r2-f04', marks).ops[0] as { sentence_id: string }
    expect(a.sentence_id).toBe('b-r2-f03')
    expect(b.sentence_id).toBe('b-r2-f04')
  })

  it('(e) the tear / card side-effects are returned as id-keyed descriptors', async () => {
    const m = await minable()
    const outcome = m.mine('b-r2-f03', m.deriveMarks(store(), []))
    expect(outcome.effects).toEqual([{ tear: 'b-r2-f03', card: { sentence_id: 'b-r2-f03' } }])
  })

  it('(f) the returned op is accepted by the driver and lands in store().mined', async () => {
    const m = await minable()
    const driver = createFixtureDriver(opRun())
    driver.start()

    const sent: MembraneOp[] = []
    const send = (op: MembraneOp): void => {
      sent.push(op)
      driver.send(op)
    }

    for (const op of m.mine('b-r2-f03', m.deriveMarks(driver.store(), [])).ops) send(op)
    expect(sent).toEqual([{ op: 'mine', sentence_id: 'b-r2-f03' }])
    expect(driver.store().mined).toEqual(['b-r2-f03'])
  })

  it('(g) no code path READS textContent/innerText — identity is the id (inv 3 / I1)', () => {
    for (const source of scannedSources()) {
      const all = source.text.match(/\.(?:textContent|innerText)\b/g) ?? []
      const writes = source.text.match(/\.(?:textContent|innerText)\s*(?:\+=|=(?!=))/g) ?? []
      expect(all.length, `${source.file} reads .textContent/.innerText`).toBe(writes.length)
    }
  })
})

/* ══ [u6#c5] minable states ═════════════════════════════════════════════ */

describe('[u6#c5] minable states', () => {
  it('(a) unmined · mined · slotted · carried are four distinct states', async () => {
    const m = await minable()
    // `id-slotted` is mined TOO, because that is the only way a sentence gets
    // into a slot: an unmined block cannot be slotted (`engine-ops.test.ts (b)`).
    // This used to seat an unmined id — a state the app cannot produce — so the
    // assert passed over a combination that never occurs.
    const marks = m.deriveMarks(
      store({ mined: ['id-mined', 'id-slotted'], slots: { 0: 'id-slotted' } }),
      ['id-carried'],
    )
    expect(m.sentenceState('id-plain', marks)).toBe('unmined')
    expect(m.sentenceState('id-mined', marks)).toBe('mined')
    expect(m.sentenceState('id-slotted', marks)).toBe('slotted')
    expect(m.sentenceState('id-carried', marks)).toBe('carried')
  })

  it('(b) slotted wins over carried wins over mined when a sentence is several', async () => {
    // REVERSED (08-06). [u6#c5] b had mined win, which made `'slotted'`
    // unreachable — every slotted id is also mined (see (a)) — so `.min.slotted`
    // in `win-reports.css` never rendered and the operator got no sign that a
    // sentence had been placed. The more specific state reads first.
    //
    // `carried` split out of `slotted` (08-08): TODAY's file and an EARLIER
    // day's are different facts about the desk, and the rail shows both at
    // once. A carried id seated again today reads 배치, not 과거 배치.
    const m = await minable()
    const both = m.deriveMarks(store({ mined: ['id-x'], slots: { 2: 'id-x' } }), ['id-x'])
    expect(m.sentenceState('id-x', both)).toBe('slotted')

    const past = m.deriveMarks(store({ mined: ['id-x'] }), ['id-x'])
    expect(m.sentenceState('id-x', past)).toBe('carried')
  })

  it('(c) the four classes are distinct and carry the skin selectors u1 shipped', async () => {
    const m = await minable()
    const states: MinableState[] = ['unmined', 'mined', 'slotted', 'carried']
    const classes = states.map((s) => m.sentenceClass(s))
    expect(new Set(classes).size).toBe(4)
    for (const c of classes) expect(c.split(/\s+/)).toContain('min')
    expect(classes[0]!.split(/\s+/)).not.toContain('mined')
    expect(classes[0]!.split(/\s+/)).not.toContain('slotted')
    expect(classes[0]!.split(/\s+/)).not.toContain('carried')
    expect(classes[1]!.split(/\s+/)).toContain('mined')
    expect(classes[2]!.split(/\s+/)).toContain('slotted')
    expect(classes[3]!.split(/\s+/)).toContain('carried')
  })

  it('(d) deriveMarks folds store.mined, the slot values and meta.carried — and mutates nothing', async () => {
    const m = await minable()
    const snapshot = store({ mined: ['a'], slots: { 0: 'b', 3: 'c' } })
    const carried = ['d']
    const marks = m.deriveMarks(snapshot, carried)

    expect([...marks.mined].sort()).toEqual(['a'])
    expect([...marks.slotted].sort()).toEqual(['b', 'c'])
    expect([...marks.carried].sort()).toEqual(['d'])
    expect(snapshot).toEqual(store({ mined: ['a'], slots: { 0: 'b', 3: 'c' } }))
    expect(carried).toEqual(['d'])
  })

  it('(e) re-mining an already-mined sentence is a no-op — no op, no card', async () => {
    const m = await minable()
    const marks = m.deriveMarks(store({ mined: ['id-mined'] }), [])
    expect(m.mine('id-mined', marks)).toEqual({ ops: [], effects: [] })
  })

  it('(f) two clicks on the same sentence send exactly one op and make exactly one card', async () => {
    const m = await minable()
    const driver = createFixtureDriver(opRun())
    driver.start()

    const sent: MembraneOp[] = []
    const cards: string[] = []
    const click = (id: string): void => {
      const outcome = m.mine(id, m.deriveMarks(driver.store(), []))
      for (const op of outcome.ops) {
        sent.push(op)
        driver.send(op)
      }
      for (const effect of outcome.effects) cards.push(effect.card.sentence_id)
    }

    click('id-x')
    click('id-x')
    expect(sent).toHaveLength(1)
    expect(cards).toEqual(['id-x'])
  })

  it('(g) marks follow ids, not positions — mining one sentence leaves the others alone', async () => {
    const m = await minable()
    const marks = m.deriveMarks(store({ mined: ['id-2'], slots: { 0: 'id-3' } }), [])
    expect(m.sentenceState('id-1', marks)).toBe('unmined')
    expect(m.sentenceState('id-2', marks)).toBe('mined')
    expect(m.sentenceState('id-3', marks)).toBe('slotted')
  })

  it('(h) minedCount counts the active report by id, across both panes', async () => {
    const m = await minable()
    const v = await view()
    const model: ReportModel = {
      round: 2,
      facts: [{ id: 'f1', text: 'a', species: 'fact' }],
      report_body: [
        { id: 'b1', text: 'b', species: 'selfnarr' },
        { id: 'b2', text: 'c', species: 'emotion' },
      ],
    }
    expect(v.minedCount(model, m.deriveMarks(store(), []))).toBe(0)
    expect(v.minedCount(model, m.deriveMarks(store({ mined: ['f1', 'b2', 'elsewhere'] }), []))).toBe(2)
  })
})

/* ══ [u6#c6] sentence anchors expose data-sentence-id ═══════════════════ */

describe('[u6#c6] sentence anchors expose data-sentence-id', () => {
  it('(a) every fixture sentence in both panes maps to its authored id', async () => {
    const m = await minable()
    const reports = await fixtureReports()
    expect(reports.length, 'no fixture report event — the scan is vacuous').toBeGreaterThan(0)

    let seen = 0
    for (const report of reports) {
      for (const s of [...report.facts, ...report.report_body]) {
        expect(m.sentenceAttrs(s)['data-sentence-id']).toBe(s.id)
        seen += 1
      }
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('(b) the anchor never carries screen text in any attribute value', async () => {
    const m = await minable()
    for (const s of await fixtureSentences()) {
      for (const value of Object.values(m.sentenceAttrs(s))) expect(value).not.toBe(s.text)
    }
  })

  it('(c) the anchor carries the a11y contract — role=button, tabindex=0', async () => {
    const m = await minable()
    const attrs = m.sentenceAttrs({ id: 'b-r1-b01', text: '문장', species: 'selfnarr' })
    expect(attrs['role']).toBe('button')
    expect(attrs['tabindex']).toBe('0')
  })

  it('(d) ids are unique within a report, so u8 can thread one anchor per sentence', async () => {
    for (const report of await fixtureReports()) {
      const ids = [...report.facts, ...report.report_body].map((s) => s.id)
      expect(new Set(ids).size, `duplicate sentence id in ${report.fixture} round ${report.round}`).toBe(ids.length)
    }
  })

  it('(e) Enter and Space mine; nothing else does', async () => {
    const m = await minable()
    expect(m.isMineKey('Enter')).toBe(true)
    expect(m.isMineKey(' ')).toBe(true)
    for (const key of ['a', 'Tab', 'Escape', 'ArrowRight', 'Spacebar', 'Space']) {
      expect(m.isMineKey(key), `${key} must not mine`).toBe(false)
    }
  })

  it('(f) source: data-sentence-id is assigned from sentence.id and from nothing else', () => {
    for (const source of scannedSources()) {
      const lines = source.text.split('\n').filter((l) => /dataset\.sentenceId|['"]data-sentence-id['"]/.test(l))
      for (const line of lines) {
        expect(line, `${source.file}: data-sentence-id must come from the authored id`).not.toMatch(
          /\.text\b|textContent|innerText/,
        )
      }
    }
  })
})

/* ══ [u6#c4-pure] archive segmentation ═════════════════════════════════ */

describe('[u6#c4] archive segmentation is pure and gate-free', () => {
  it('(a) one segment per archive entry, in stream order', async () => {
    const a = await archive()
    const segments = a.archiveSegments(
      [
        { run: 1, label: '08:50 — 21:04' },
        { run: 2, label: '09:10 — 21:04' },
      ],
      2,
    )
    expect(segments.map((s) => s.run)).toEqual([1, 2])
  })

  it("(b) the run label is the sitting's callsign, derived from the number", async () => {
    const a = await archive()
    const { callsignOf } = await dossier()
    const segments = a.archiveSegments(
      [
        { run: 1, label: '08:50 — 21:04' },
        { run: 12, label: '09:10 — 21:04' },
      ],
      1,
    )
    // x7 — asserted against `callsignOf`, not against the two strings it
    // happened to return the day this was written (`'ECHO-1'` / `'ECHO-12'`).
    // What the rail promises is that the tab is THE SAME NAME the AGENT FILE
    // prints for that sitting; a literal here proved that only by coincidence,
    // and when the series was renumbered (the unshaped first agent is plain
    // `ECHO` now) it was this assertion that went red while the two surfaces it
    // guards still agreed perfectly.
    expect(segments[0]!.runLabel).toBe(callsignOf(1))
    expect(segments[1]!.runLabel).toBe(callsignOf(12))
    // …and not vacuously: a callsign in shape, DELIBERATELY LITERAL on `ECHO`
    // because that is the shipped name of the series and nothing else here says
    // it out loud — renaming it should not be able to pass in silence. The
    // number is the part that may move.
    expect(segments[0]!.runLabel).toMatch(/^ECHO(?:-\d+)?$/)
    expect(segments[1]!.runLabel).not.toBe(segments[0]!.runLabel)
  })

  /**
   * x5 — the tab prints the CALLSIGN and nothing else, so the doubled-prefix
   * defect this case was written for cannot be reached at all: there is no
   * second line for a label to be normalised onto.
   *
   * It holds the stronger claim that replaced it. The seam's `label` is whatever
   * the authority put there — `RUN 01 / 08:50 — 21:04` from the fixture loop,
   * `전구간정상-r1` from the live adapter (`driver/live/index.ts`), and neither is
   * something this window promises to print well. A segment must carry no trace
   * of it, so nothing about the tab can drift when the label's format does.
   */
  it('(c) no part of the seam label reaches a segment — the tab is the callsign alone', async () => {
    const a = await archive()
    const { callsignOf } = await dossier()
    const segments = a.archiveSegments(
      [
        { run: 1, label: 'RUN 01 / 08:50 — 21:04' },
        { run: 2, label: '전구간정상-r2' },
      ],
      1,
    )
    const printed = segments.map((s) => JSON.stringify(s))
    expect(printed[0]).not.toMatch(/08:50|21:04|RUN\s*01/)
    expect(printed[1]).not.toMatch(/전구간정상|-r2/)
    // x7 — same substitution as (b): what is left on the tab after the seam's
    // label has been refused is the callsign, whatever `callsignOf` currently
    // makes of a run. This case is about what did NOT reach the tab.
    expect(segments.map((s) => s.runLabel)).toEqual([callsignOf(1), callsignOf(2)])
  })

  it('(d) exactly one segment is selected — the active run', async () => {
    const a = await archive()
    const segments = a.archiveSegments(
      [
        { run: 1, label: '08:50 — 21:04' },
        { run: 2, label: '09:10 — 21:04' },
      ],
      2,
    )
    expect(segments.filter((s) => s.selected).map((s) => s.run)).toEqual([2])
  })

  it('(e) NO GATE LABEL reaches a player surface (spec-client §3 inv 6)', async () => {
    const a = await archive()
    const segments = a.archiveSegments([{ run: 1, label: '08:50 — 21:04' }], 1)
    for (const s of segments) expect(JSON.stringify(s)).not.toMatch(/gate|게이트/i)
    expect(() => a.archiveSegments([{ run: 1, label: 'GATE A / 08:50' }], 1)).toThrow()
  })

  it('(f) the rail is a roving-focus listbox: ←/→/Home/End move, anything else is not handled', async () => {
    const a = await archive()
    expect(a.railKeyIndex(3, 0, 'ArrowRight')).toBe(1)
    expect(a.railKeyIndex(3, 2, 'ArrowRight')).toBe(2)
    expect(a.railKeyIndex(3, 1, 'ArrowLeft')).toBe(0)
    expect(a.railKeyIndex(3, 0, 'ArrowLeft')).toBe(0)
    expect(a.railKeyIndex(3, 2, 'Home')).toBe(0)
    expect(a.railKeyIndex(3, 0, 'End')).toBe(2)
    expect(a.railKeyIndex(3, 0, 'ArrowDown')).toBeNull()
    expect(a.railKeyIndex(0, 0, 'ArrowRight')).toBeNull()
  })
})

/* ══ [u6#c2-pure] the typewriter cursor is a pure reducer ═══════════════ */

describe('[u6#c2] the typewriter is a replay cursor, not a stream', () => {
  const START: TypeState = { sentence: 0, chars: 0, done: false }

  it('(a) elapsed time advances characters deterministically', async () => {
    const v = await view()
    const lengths = [3, 2]
    const a = v.typeCursor(START, 100, lengths)
    const b = v.typeCursor(START, 100, lengths)
    expect(a).toEqual(b)
    expect(a.chars).toBeGreaterThan(0)
  })

  it('(b) the cursor never runs past the last sentence and settles on done', async () => {
    const v = await view()
    const lengths = [3, 2]
    const end = v.typeCursor(START, 60_000, lengths)
    expect(end.done).toBe(true)
    expect(end.sentence).toBeLessThanOrEqual(lengths.length)
    expect(v.typeCursor(end, 60_000, lengths)).toEqual(end)
  })

  it('(c) zero elapsed time paints nothing new (monotonic, no jitter)', async () => {
    const v = await view()
    expect(v.typeCursor(START, 0, [4, 4])).toEqual(START)
  })

  it('(d) an empty report is already done', async () => {
    const v = await view()
    expect(v.typeCursor(START, 0, []).done).toBe(true)
  })

  it('(e) chars never exceed the sentence it is typing', async () => {
    const v = await view()
    const lengths = [5, 5]
    let state = START
    for (let i = 0; i < 200; i += 1) {
      state = v.typeCursor(state, 7, lengths)
      if (state.done) break
      expect(state.chars).toBeLessThanOrEqual(lengths[state.sentence] ?? 0)
    }
  })
})

/* ══ [u6#c9] never re-segments, never re-classifies ════════════════════ */

describe('[u6#c9] sentences arrive pre-segmented and pre-classified', () => {
  it('(a) u6 never calls the segmenter (C1/C13 — consume-only, and not from here)', () => {
    expect(offenders(/\bsegmentReportBody\b/)).toEqual([])
    expect(offenders(/shared\/segment(\.ts)?['"]/)).toEqual([])
  })

  it('(b) u6 never re-splits report text into sentences', () => {
    expect(offenders(/\btext\b[^\n]{0,40}\.split\s*\(/)).toEqual([])
    expect(offenders(/\.split\s*\(\s*\//)).toEqual([])
  })

  it('(c) u6 never assigns a species — the seam already carries it', () => {
    expect(offenders(/['"](?:selfnarr|emotion|quote)['"]/)).toEqual([])
    expect(offenders(/\bspecies\s*=(?!=)/)).toEqual([])
    expect(offenders(/shared\/species(\.ts)?['"]/)).toEqual([])
  })
})

/* ══ [u6#c10] run-wide hard constraints ════════════════════════════════ */

describe('[u6#c10] run-wide hard constraints hold in this unit', () => {
  it('(a) the unit wrote exactly the four files its globs allow', () => {
    expect(UNIT_FILES.filter((f) => !exists(f)).map(rel)).toEqual([])
  })

  it('(b) C4 — sessionStorage only; localStorage appears nowhere', () => {
    expect(offenders(/\blocalStorage\b/)).toEqual([])
  })

  it('(c) C8 — the seam is reached through driver/index.ts, never engine or composer', () => {
    for (const source of scannedSources()) {
      const specs = [...source.text.matchAll(/from\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      for (const spec of specs) {
        expect(spec, `${source.file} imports ${spec}`).not.toMatch(/engine|composer/)
        expect(spec, `${source.file} bypasses the driver barrel`).not.toMatch(/shared\/view-driver/)
      }
    }
  })

  it('(d) C10 — no free-text surface: no input/textarea/select, no contenteditable', () => {
    expect(offenders(/createElement\s*\(\s*['"`](?:input|textarea|select)['"`]/i)).toEqual([])
    expect(offenders(/contenteditable/i)).toEqual([])
    expect(offenders(/<\s*(?:input|textarea|select)\b/i)).toEqual([])
  })

  it('(e) C11 — no color/size/font literal in TS; the skin is class-driven', () => {
    expect(offenders(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/)).toEqual([])
    expect(offenders(/\b(?:rgb|rgba|hsl|hsla)\s*\(/)).toEqual([])
    expect(offenders(/['"`][^'"`]*\b\d+(?:\.\d+)?(?:px|rem|em|vw|vh)\b/)).toEqual([])
    expect(offenders(/\.style\.[A-Za-z]/)).toEqual([])
    expect(offenders(/['"]\.\.?\/[^'"]*\.css['"]/)).toEqual([])
  })

  it('(f) u6 imports no sibling window and owns no shared state module', () => {
    for (const source of scannedSources()) {
      const specs = [...source.text.matchAll(/from\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      for (const spec of specs) {
        expect(spec, `${source.file} imports a sibling window`).not.toMatch(
          /windows\/(?:live-feed|agent-file|block-store|tally)/,
        )
      }
    }
  })

  it('(g) C5/C6 — u6 edits neither runner config nor vitest.config.ts', () => {
    expect(read(path.join(CLIENT, '../../playwright.config.ts'))).not.toMatch(/reports\.spec|u6/)
    expect(read(path.join(CLIENT, '../../vitest.config.ts'))).not.toMatch(/jsdom|happy-dom/)
  })
})

/* ══ [w2] one sitting, one accumulating record ══════════════════════════ */

describe('[w2] a sitting accumulates its rounds into one document', () => {
  const s = (id: string): Sentence => ({ id, text: `${id} 문장`, species: 'fact' })

  it('(a) the first round of a sitting is the document', async () => {
    const v = await view()
    const round = { round: 0, facts: [s('f1')], report_body: [s('b1')] }
    expect(v.accumulated(null, round)).toEqual(round)
  })

  it('(b) each further round appends to both panes, in arrival order', async () => {
    const v = await view()
    const one = v.accumulated(null, { round: 0, facts: [s('f1')], report_body: [s('b1')] })
    const two = v.accumulated(one, { round: 1, facts: [s('f2')], report_body: [s('b2'), s('b3')] })

    expect(two.facts.map((x) => x.id)).toEqual(['f1', 'f2'])
    expect(two.report_body.map((x) => x.id)).toEqual(['b1', 'b2', 'b3'])
  })

  it('(c) the model carries the LATEST round filed — that is the replay key', async () => {
    const v = await view()
    const one = v.accumulated(null, { round: 0, facts: [], report_body: [s('b1')] })
    expect(v.accumulated(one, { round: 6, facts: [], report_body: [s('b2')] }).round).toBe(6)
  })

  it('(d) it mutates neither side — the held document and the slice are untouched', async () => {
    const v = await view()
    const held = { round: 0, facts: [s('f1')], report_body: [s('b1')] }
    const slice = { round: 1, facts: [s('f2')], report_body: [s('b2')] }
    v.accumulated(held, slice)
    expect(held.facts.map((x) => x.id)).toEqual(['f1'])
    expect(held.report_body.map((x) => x.id)).toEqual(['b1'])
    expect(slice.facts.map((x) => x.id)).toEqual(['f2'])
  })

  it('(e) a seven-round day is ONE document, and the mined tally counts all of it', async () => {
    const v = await view()
    const m = await minable()
    let doc: ReportModel | null = null
    for (let round = 0; round < 7; round += 1) {
      doc = v.accumulated(doc, {
        round,
        facts: [s(`f${round}`)],
        report_body: [s(`b${round}`)],
      })
    }
    expect(doc!.facts).toHaveLength(7)
    expect(doc!.report_body).toHaveLength(7)
    expect(v.minedCount(doc!, m.deriveMarks(store({ mined: ['f3', 'b5'] }), []))).toBe(2)
  })

  it('(f) the window keys its rail on the run, never on the round', () => {
    // The defect was `railEntries(archive, [...filed.keys()])` being handed
    // ROUND numbers. `filed` is now keyed by the sitting, and the only write
    // to it takes its key from the run `meta` last named.
    const window = scannedSources().find((s) => s.file.endsWith('windows/reports.ts'))
    expect(window, 'the REPORTS window is not in the scanned set').toBeTruthy()
    expect(window!.text, 'the report handler no longer names the sitting').toMatch(/const sitting = run/)
    expect(window!.text, 'a report is still filed under its round').not.toMatch(/filed\.set\(\s*event\.round/)
  })

  it('(g) each round after the first records the id it opens on', async () => {
    const v = await view()
    const one = v.accumulated(null, { round: 0, facts: [], report_body: [s('b1'), s('b2')] })
    // A single-round document carries no boundary at all — `(a)` above pins
    // that identity, and a break before the very first sentence would open the
    // record with a blank line.
    expect(one.opens).toBeUndefined()

    const two = v.accumulated(one, { round: 1, facts: [], report_body: [s('b3')] })
    const three = v.accumulated(two, { round: 2, facts: [], report_body: [s('b4'), s('b5')] })
    expect(three.opens).toEqual(['b3', 'b4'])
    // The boundary is an id in the body, never an index into it: `render()`
    // rebuilds the flat list and matches by id, so an id that is not there is
    // simply no break rather than a break in the wrong place.
    expect(three.report_body.map((x) => x.id)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5'])
  })
})

/* ══ [x6] the 검인 chop is the SITTING's receipt ═════════════════════════ */

describe('[x6] the 검인 chop goes down when the sitting has been received', () => {
  const s = (id: string): Sentence => ({ id, text: `${id} 문장`, species: 'fact' })

  /**
   * The defect, stated: x5 stamped at the end of the round that had just typed
   * itself out. A live day files SEVEN rounds into one document
   * (`tests/driver/live-desk.test.ts:126`), so the receipt went down under
   * round 1 and stood there while six more transmissions wrote themselves out
   * beneath it. The day's terminal is the driver's `score`.
   */
  it('(a) a round finishing does NOT stamp — the day is still open', async () => {
    const v = await view()
    let doc: ReportModel | null = null
    for (let round = 0; round < 7; round += 1) {
      doc = v.accumulated(doc, { round, facts: [], report_body: [s(`b${round}`)] })
      // …the round's replay has just run to its end, and the document is real.
      expect(
        v.chopDown({ sealed: false, received: doc.report_body.length > 0, typed: true }),
        `the chop went down after round ${round}, with six transmissions still to come`,
      ).toBe(false)
    }
    expect(doc!.report_body, 'the seven rounds are one document — the receipt is that document’s').toHaveLength(7)
  })

  it("(b) the run's `score` is what stamps it, once the replay has finished", async () => {
    const v = await view()
    expect(v.chopDown({ sealed: true, received: true, typed: true })).toBe(true)
  })

  it('(c) seal and replay land in EITHER order — whichever is second stamps', async () => {
    const v = await view()
    // `score` first: it rides the same beat as the day's last report, which at
    // that moment is still writing itself out (`e2e/reports.spec.ts:334`).
    expect(v.chopDown({ sealed: true, received: true, typed: false })).toBe(false)
    expect(v.chopDown({ sealed: true, received: true, typed: true })).toBe(true)
    // the replay first: an archived sitting repaints whole, then is sealed.
    expect(v.chopDown({ sealed: false, received: true, typed: true })).toBe(false)
    expect(v.chopDown({ sealed: true, received: true, typed: true })).toBe(true)
  })

  it('(d) a sitting that filed nothing stays unstamped, closed or not', async () => {
    // `?drill=tally-lapse` — a day that files no report has no transmission to
    // certify, and its record still lands. The guard predates x6 and survives it.
    const v = await view()
    expect(v.chopDown({ sealed: true, received: false, typed: true })).toBe(false)
    expect(v.chopDown({ sealed: false, received: false, typed: true })).toBe(false)
  })

  it('(e) source: `stamped()` is still the single writer of `.on`', () => {
    const src = scannedSources().find((x) => x.file.endsWith('components/report-view.ts'))
    expect(src, 'report-view.ts is not in the scanned set').toBeTruthy()
    // one declaration and exactly one call, and the call is the rule.
    expect(src!.text.match(/\bstamped\s*\(/g) ?? []).toHaveLength(2)
    expect(src!.text).toMatch(/stamped\(\s*chopDown\(/)
    expect(src!.text, 'a second writer of the chop class').not.toMatch(
      /stamp\.classList[\s\S]{0,80}\n[\s\S]*stamp\.classList/,
    )
  })

  it('(f) source: the window seals from the draw AND from `score`, and never from the archive', () => {
    const win = scannedSources().find((x) => x.file.endsWith('windows/reports.ts'))
    expect(win, 'the REPORTS window is not in the scanned set').toBeTruthy()
    expect(win!.text, 'the seal is not fed from the `score` event').toMatch(/scored\.add\(\s*run\s*\)/)
    // twice: `drawDocument()` (so a rail re-selection is right) and the `score`
    // handler (which takes `draw: false` and so never reaches the draw).
    expect((win!.text.match(/view\.seal\(/g) ?? []).length).toBeGreaterThanOrEqual(2)
    // Seeding from `event.archive` would seal the LIVE day at boot: the fixture
    // loop lists the run just opened in its own archive
    // (`driver/fixtures/run-loop.ts` — `archiveThrough` walks `RUN..run`).
    expect(win!.text, 'the seal is seeded from the archive').not.toMatch(/scored\.add[^\n]*(?:archive|entry)/)
  })
})
