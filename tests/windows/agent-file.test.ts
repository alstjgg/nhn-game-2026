// u4 — AGENT FILE window: the model half.
//
// SCOPE (unit-scoped, u4): this suite reads only the five sources u4 owns
// (`components/{block-card,slot-board,dossier,deploy-button}.ts` +
// `windows/agent-file.ts`) plus repo-level guards C2/C13 that name them.
//
// The suite runs under vitest `environment: 'node'` (u3/u9d precedent, u4 D1):
// **no DOM assert lives here** — every one of those is in `e2e/agent-file.spec.ts`.
// Each component therefore splits `pure model → DOM builder`, and only the model
// half is imported below. Modules are loaded with a dynamic `import()` off an
// absolute path (the `tests/shell/window-registry.test.ts` precedent) so a
// missing file fails one test with a readable message instead of the file.
//
// Test titles are load-bearing — the unit's verification commands filter with
//   -t 'sealed by construction'            (c2)
//   -t 'membrane ops'                      (c3)
//   -t 'slot anchors expose data-block-id' (c5)
// Do not rename a describe without updating `.claude/super/units/u4.md`.
//
// C3: nothing here asserts synthetic fixture CONTENT. The ids used
// (`b-r2-f03`, `b-r2-b03`, …) are the *authored id grammar* `b-r<run>-<channel><nn>`
// which C3 itself freezes, and the Korean strings are design-target document art
// (`docs/design/phase2-ui/data.js` 37–68) or spec-named copy, not fixture text.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { CLIENT, REPO, clientSources, exists, importable, read, rel, stripComments } from '../shell/shell-utils.ts'
import { createFixtureDriver } from '../../src/client/driver/index.ts'
import type { FixtureRun, MembraneOp, Sentence, Species } from '../../src/client/driver/index.ts'

/* ══ the five sources this unit owns ═════════════════════════════════════ */

const COMPONENTS = path.join(CLIENT, 'components')
const BLOCK_CARD_TS = path.join(COMPONENTS, 'block-card.ts')
const SLOT_BOARD_TS = path.join(COMPONENTS, 'slot-board.ts')
const DOSSIER_TS = path.join(COMPONENTS, 'dossier.ts')
const DEPLOY_BUTTON_TS = path.join(COMPONENTS, 'deploy-button.ts')
const AGENT_FILE_TS = path.join(CLIENT, 'windows/agent-file.ts')
/**
 * u2's inv-12 enforcement point. It is the ONE client source that may name a
 * banned key: `BANNED_EXACT` lists `temperament` precisely so the driver can
 * reject any event carrying it (`driver/seam-guard.ts:11`). Scanning it would
 * make the guard fail the invariant it enforces, so the scan below skips it —
 * the exemption is one named file, not a pattern.
 */
const SEAM_GUARD_TS = path.join(CLIENT, 'driver/seam-guard.ts')

/**
 * The live composition root. It names `temperament.json` and `gates.json`
 * because it FETCHES them and hands them to the engine — that is what wiring a
 * datapack means, and `tools/driver/run/pack.mjs` names the same six files for
 * the same reason.
 *
 * This does not loosen the seal. §3 기질 is sealed in the DOSSIER — what the
 * player is shown — and (c) below still pins that section's every string. The
 * pack itself has never been secret: physical §2 constraint 3 ships it to the
 * browser deliberately, so it is readable in devtools with or without this
 * folder. What must never happen is a WINDOW naming it, and every window is
 * still scanned.
 */
const LIVE_BINDER = path.join(CLIENT, 'driver/live')

const U4_SOURCES = [BLOCK_CARD_TS, SLOT_BOARD_TS, DOSSIER_TS, DEPLOY_BUTTON_TS, AGENT_FILE_TS]

/** `{ file, text }` for every u4 source that is on disk, comments stripped. */
function u4Sources(): { file: string; text: string }[] {
  return U4_SOURCES.filter((f) => exists(f)).map((f) => ({ file: rel(f), text: stripComments(read(f)) }))
}

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' })
}

/* ══ the model surfaces under test (u4/design.md §4 + D1's pure core) ════ */

interface SlotCell {
  slot: number
  blockId: string | null
}

type SlotAction =
  | { kind: 'place'; blockId: string; slot: number }
  | { kind: 'clear'; slot: number }
  | { kind: 'deploy' }

interface OpPlan {
  ops: MembraneOp[]
  slots: (string | null)[]
  deployed: boolean
}

interface SlotBoardModule {
  SLOT_CAP: number
  slotCells(slots: readonly (string | null)[]): SlotCell[]
  /**
   * D1's pure core for c3: the one place slot/unslot/deploy op sequences are
   * decided. `createSlotBoard`'s `place`/`clear`/deploy path must route through
   * it (asserted by source-scan below), so the DOM half owns no second rule set.
   */
  planOps(state: { slots: readonly (string | null)[]; deployed: boolean }, action: SlotAction): OpPlan
  createSlotBoard: unknown
  getSlotBoard: unknown
}

interface SpeciesDisplay {
  ko: string
  mark: string
  cls: string
}

interface BlockCardModel {
  id: string
  species: Species
  ko: string
  mark: string
  cls: string
  axis?: string
  run: number | null
  text: string
}

interface BlockCardModule {
  SPECIES_DISPLAY: Readonly<Record<Species, SpeciesDisplay>>
  blockCardModel(id: string, sentence: Sentence | null): BlockCardModel
  buildBlockCard: unknown
  pickedBlockId(): string | null
  setPickedBlockId(id: string | null): void
  subscribePick(cb: (id: string | null) => void): () => void
}

interface DossierSection {
  title: string
  // U5.3 — `'filed'` is the fourth state. This mirror is what `tsc` reads and
  // `vitest` does not (§5.3), so it goes out of step silently if left.
  // x7 — `'sealed'` is gone: the cover was the only section that ever carried
  // it and the cover no longer has it (see the describe below). `bars?` went
  // with it — nothing in the union has a redaction strip any more.
  state: 'fixed' | 'operable' | 'filed'
  rows?: [string, string][]
  body?: string
  // x7 — on a fixed section this is 사건 개요's red `.sect-note`; on an
  // operable/filed one it is 인수인계 사항's standing instruction. Two meanings,
  // one field, told apart by `state` (see `FixedSection` in dossier.ts).
  note?: string
}

interface DossierModule {
  // x6 — no argument. 임무 was the clock band's one reader on this window and
  // it is a posting order now; the band is the topbar clock's.
  coverModel(): DossierSection[]
  agentModel(input: { slotCap: number; callsign: string }): DossierSection[]
  // x5 — `deployed` left `FiledInput` with the count that used to be printed
  // from it. The page's own paragraph is where a past sitting's size is read.
  filedModel(input: { callsign: string }): DossierSection[]
  // x7 — the ECHO series is document art this module mints (D4). `deploy-button`,
  // `report-archive`, `reports` and `announcer` all read it, so the mapping is
  // pinned here, at its one source, rather than in each caller's suite.
  callsignOf(run: number): string
  nextCallsignOf(run: number): string
  buildDossier: unknown
}

interface DeployView {
  used: number
  cap: number
  count: string
  note: string
  stampOn: boolean
  stampLine: string
  boardState: 'empty' | 'partial' | 'full' | 'locked'
  buttonState: 'ready' | 'deployed'
}

interface DeployButtonModule {
  deployView(s: { slots: readonly (string | null)[]; deployed: boolean; run: number; at: string }): DeployView
  buildDeployZone: unknown
  buildDeployStamp: unknown
}

const loadSlotBoard = async (): Promise<SlotBoardModule> =>
  (await import(importable(SLOT_BOARD_TS))) as unknown as SlotBoardModule
const loadBlockCard = async (): Promise<BlockCardModule> =>
  (await import(importable(BLOCK_CARD_TS))) as unknown as BlockCardModule
const loadDossier = async (): Promise<DossierModule> =>
  (await import(importable(DOSSIER_TS))) as unknown as DossierModule
const loadDeployButton = async (): Promise<DeployButtonModule> =>
  (await import(importable(DEPLOY_BUTTON_TS))) as unknown as DeployButtonModule

/* ══ [u4#c2] spec-client §3 inv 4 (I13) ══════════════════════════════════ */

/** Anything shaped like temperament data, in either vocabulary. */
const TEMPERAMENT_KEY = /temper|trait|성향|disposition|기질값|기질_/i

/** Every key name reachable from `value`, recursively. */
function deepKeys(value: unknown, seen = new Set<unknown>()): string[] {
  if (value === null || typeof value !== 'object' || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) return value.flatMap((v) => deepKeys(v, seen))
  const record = value as Record<string, unknown>
  return Object.keys(record).flatMap((k) => [k, ...deepKeys(record[k], seen)])
}

/*
 * x7 — THE DESCRIBE KEPT ITS TITLE AND LOST ITS SECTION.
 *
 * 기질 was a sealed block on the AGENT FILE's cover; x7's rewrite replaced the
 * cover's sections outright (사건 개요 · 현장 요원 임무 · 현장 요원 교신 지침)
 * and the cover was the only place 기질 appeared, so the sealed section has left
 * the product. 민서 made that call on 08-09 with the consequence stated.
 *
 * The CLAIM survives that intact, because the claim was never "a black bar is
 * drawn". I13 / spec-client §3 inv 4 is that no temperament-shaped DATA reaches
 * the view, and the two things that made it true are still here: (a) scans every
 * model this window renders and finds no such key or value, and (b) scans every
 * client source and finds nothing that even names the pack files. The bars were
 * art on top of that; (c), which pinned the bars and the sealed copy, is deleted
 * — see the marker where it stood.
 *
 * The title stays literally as-is because `.claude/super/units/u4.md` filters
 * this suite with `-t 'sealed by construction'` (see the header note).
 */
describe('[u4#c2] §3 기질 is sealed by construction', () => {
  it('(a) neither the dossier input nor any section carries a temperament-shaped key', async () => {
    const { coverModel, agentModel, filedModel } = await loadDossier()
    const input = { slotCap: 4, callsign: 'ECHO-1' }
    const sections = [...coverModel(), ...agentModel(input), ...filedModel({ callsign: 'ECHO' })]
    const keys = deepKeys(sections)

    // x7 — THE VACUITY GUARD, and it is why this test needed touching at all.
    // The claim used to end by asserting the sealed section's exact key set,
    // which incidentally proved `deepKeys` had walked something real. With that
    // section gone, a `coverModel` that returned `[]` — or a `deepKeys` that
    // silently stopped recursing — would satisfy every `toEqual([])` below while
    // checking nothing at all. So the walk is proved before it is trusted.
    expect(sections.length, 'the models must render sections to scan').toBeGreaterThan(0)
    expect(keys, 'deepKeys must actually reach section fields').toContain('title')
    expect(keys).toContain('state')

    expect(deepKeys(input).filter((k) => TEMPERAMENT_KEY.test(k))).toEqual([])
    expect(keys.filter((k) => TEMPERAMENT_KEY.test(k))).toEqual([])

    // …and no VALUE either. A key scan alone would pass a disposition smuggled
    // through as document copy, and copy is exactly what this window prints.
    expect(TEMPERAMENT_KEY.test(JSON.stringify(sections)), 'a section prints temperament vocabulary').toBe(
      false,
    )
  })

  it('(b) no client source names temperament, truths or gates data', () => {
    const forbidden = [/temperament/i, /truths\.json/i, /gates\.json/i]
    const hits: string[] = []
    const exempt = (f: string) => f === SEAM_GUARD_TS || f.startsWith(LIVE_BINDER)
    for (const file of clientSources().filter((f) => !exempt(f))) {
      const text = read(file)
      for (const re of forbidden) if (re.test(text)) hits.push(`${rel(file)} ~ ${String(re)}`)
    }
    expect(hits).toEqual([])
  })

  // x7 — (c) IS DELETED, NOT MOVED. It read `the sealed section carries the
  // redaction copy and nothing else`: it pinned `SEALED_COPY`, the `기질`
  // heading, and that every bar width was a ratio rather than a pixel (inv 8).
  //
  // There is nowhere for it to go. The sealed section is out of the product
  // (see the describe's note), so `SEALED_COPY`, `SEALED_BARS` and
  // `buildRedaction` were deleted from `components/dossier.ts` with it, and a
  // test of a deleted constant is not a weaker test — it is a test of nothing.
  // What (c) uniquely protected beyond that was inv 8 on those bar widths, and
  // that survives repo-wide in `[u4#c9](e)` below, which fails any px literal
  // in a u4 source. Nothing was lost by deleting it.
  //
  // Its DOM twin, `e2e/agent-file.spec.ts [u4#c1](f)`, is owned by another lane
  // and still asserts `.sect.sealed`; that suite is not this file's to edit.

  it('(d) both models are pure — frozen input in, deep-equal input out, no document', async () => {
    const { coverModel, agentModel } = await loadDossier()
    const input = Object.freeze({ slotCap: 4, callsign: 'ECHO-1' })
    const before = JSON.stringify({ slotCap: input.slotCap, callsign: input.callsign })

    const firstAgent = agentModel(input)
    const secondAgent = agentModel({ slotCap: 4, callsign: 'ECHO-1' })
    const firstCover = coverModel()
    const secondCover = coverModel()

    expect(JSON.stringify({ slotCap: input.slotCap, callsign: input.callsign })).toBe(before)
    expect(JSON.stringify(secondAgent)).toBe(JSON.stringify(firstAgent))
    expect(JSON.stringify(secondCover)).toBe(JSON.stringify(firstCover))
    // C17 — RE-AIMED (08-09), never deleted. These two read `String(fn)` raw,
    // which includes the function's own COMMENTS, so the guard failed the moment
    // `coverModel` grew a comment using the word "document" in its ordinary
    // sense — the note recording why the cover carries no slugs, which says a
    // plate must not narrate a document mid-performance. That is prose about a
    // paper document; the claim being made here is that neither model touches
    // `window.document`. Stripped, these measure code, which is what they meant.
    //
    // They are the weaker half of a check this test already makes properly four
    // lines down — that scan strips comments, covers the whole model half of the
    // file rather than two functions, and matches `\bdocument\b` on a word
    // boundary. These are kept because a closure that captured a DOM node from
    // an enclosing scope would show up in `String(fn)` and not in a source slice.
    expect(stripComments(String(agentModel))).not.toMatch(/\bdocument\b/)
    expect(stripComments(String(coverModel))).not.toMatch(/\bdocument\b/)

    // The model half of the file precedes the builder half: no `document.` may
    // appear before `buildDossier` is declared.
    const source = stripComments(read(DOSSIER_TS))
    const builderAt = source.indexOf('function buildDossier')
    expect(builderAt, 'dossier.ts must declare buildDossier').toBeGreaterThan(-1)
    const modelHalf = source.slice(0, builderAt)
    expect(modelHalf).not.toMatch(/\bdocument\b/)
  })

  it('(e) the two models carry the ratified titles and flags, and no numbers', async () => {
    const { coverModel, agentModel } = await loadDossier()
    const cover = coverModel()
    const agent = agentModel({ slotCap: 4, callsign: 'ECHO-1' })

    // C1 — the document reads the cover first, then the agent's own page, and
    // none of them carries a `§n` any more. There is deliberately no assertion
    // about a combined order across the two pages — there is no such order.
    expect(
      [...cover, ...agent].every((s) => !('no' in s)),
      'a section still carries a number',
    ).toBe(true)

    // x7 — THREE headings, replacing x6's four (임무 · 행동 원칙 · 기질 · 교신
    // 지침). The cover leads with the incident now instead of with orders, and
    // 행동 원칙 left with the sealed 기질: a principle the operator cannot act on
    // was a screenful between the incident and the radio. Every section is
    // `fixed` — the cover is standing document art and nothing on it is
    // operable, which is what makes `agentModel` the only page with a board.
    expect(cover.map((s) => s.title)).toEqual(['사건 개요', '현장 요원 임무', '현장 요원 교신 지침'])
    expect(cover.map((s) => s.state)).toEqual(['fixed', 'fixed', 'fixed'])
    expect(agent.map((s) => s.title)).toEqual(['식별', '인수인계 사항'])
    expect(agent.map((s) => s.state)).toEqual(['fixed', 'operable'])

    // x7 — 사건 개요 is the ONE section with a red footnote, and it must be its
    // own field rather than a fourth line of the body: `buildDossier` renders it
    // as a `.sect-note` element that the sheet paints red and the cover's reveal
    // times as its own beat. Folded back into `body` it would print as a fourth
    // incident clause in the incident's own voice, which is the opposite of what
    // it says (that the incident is being reconstructed).
    expect(cover[0]!.note, '사건 개요 must carry the reconstruction note').toBeTruthy()
    expect(cover[0]!.body).not.toContain('시뮬레이션')
    expect(cover.slice(1).map((s) => s.note)).toEqual([undefined, undefined])

    // The bodies are `\n`-joined clauses and `buildDossier` splits on that, so a
    // section that lost its breaks would silently become one run-on element.
    expect(cover[0]!.body!.split('\n')).toHaveLength(3)
    expect(cover[2]!.body!.split('\n')).toHaveLength(2)

    // x6 — the cover is a posting order ISSUED TO THE AGENT, so no section may
    // name the machinery the operator drives it with. This is the guard that
    // makes that a property of the file rather than a note in a PRD: the words
    // below are the vocabulary two rewrites (x5, x6) removed, and the reason
    // each one has to stay out is that it is knowable only from outside the
    // fiction — an agent is not told which 시행 they are.
    // x7 — the sealed section's exemption is gone with the section, so the loop
    // has no `continue` and every string on the cover is scanned, notes as well
    // as bodies. That is stricter than x6's guard, not looser.
    const META = ['시행', '라운드', '슬롯', '집계', '주입', '블록', '문장 카드']
    for (const section of cover) {
      for (const word of META) {
        expect(section.body, `${section.title} names the machinery: ${word}`).not.toContain(word)
        expect(section.note ?? '', `${section.title}'s note names the machinery: ${word}`).not.toContain(word)
      }
    }

    // 인수인계 사항's note reads the cap, so the two cannot drift.
    expect(agent[1]!.note).toContain('4')
    // 식별 carries the callsign it was handed (M1).
    expect(JSON.stringify(agent[0]!.rows)).toContain('ECHO-1')
  })

  /*
   * x7 — THE ECHO SERIES STARTS UNNUMBERED, and these two tests are the whole
   * record of it. It was `ECHO-${Math.max(1, run)}`, so run 1 flew as ECHO-1 and
   * the bare name `ECHO` was spent on nothing. The first deploy is the DEFAULT
   * one — the operator has handed nothing over yet — so its agent is just ECHO,
   * and the numbering begins with the second, the first the operator shaped.
   */
  it('(f) callsignOf mints ECHO first and numbers from the second sitting', async () => {
    const { callsignOf } = await loadDossier()

    expect(callsignOf(1)).toBe('ECHO')
    expect(callsignOf(2)).toBe('ECHO-1')
    expect(callsignOf(3)).toBe('ECHO-2')
    expect(callsignOf(4)).toBe('ECHO-3')

    // The pre-first-press desk sits at run 0 (`windows/agent-file.ts` boots held
    // there). It used to be caught by a `Math.max(1, run)` fallback that existed
    // only to keep `ECHO-0` off the page; the unnumbered first name answers it
    // now, and there is no second spelling of "not yet shaped" left to drift.
    expect(callsignOf(0)).toBe('ECHO')

    // No number is ever suffixed to the first agent, and none is ever 0.
    expect(callsignOf(1)).not.toMatch(/-/)
    for (const run of [1, 2, 3, 4, 10, 99]) expect(callsignOf(run)).not.toBe('ECHO-0')
  })

  it('(g) nextCallsignOf composes across the ECHO → ECHO-1 boundary', async () => {
    const { callsignOf, nextCallsignOf } = await loadDossier()

    // THE ONE PLACE AN OFF-BY-ONE HIDES. Everywhere else `nextCallsignOf` walks
    // n → n+1 inside the numbered run and a stray ±1 shows up as an obviously
    // wrong number; at the boundary a wrong answer is still a well-formed
    // callsign. After ECHO comes ECHO-1 — not ECHO-2, and not ECHO again.
    expect(nextCallsignOf(1)).toBe('ECHO-1')
    expect(nextCallsignOf(0)).toBe('ECHO')

    // And it stays a COMPOSITION, never a second copy of the arithmetic: if
    // someone re-derives the suffix inside `nextCallsignOf` this diverges.
    for (const run of [0, 1, 2, 3, 9, 41]) expect(nextCallsignOf(run)).toBe(callsignOf(run + 1))
  })
})

/* ══ [u4#c3] spec-client §5.2 ════════════════════════════════════════════ */

/** A run that answers every op — the recorder wraps `send` around it. */
const OP_RUN: FixtureRun = {
  id: 'u4-op-recorder',
  start: '08:50',
  end: '21:04',
  events: [{ type: 'meta', run: 3, runs_left: 7, carried: [], archive: [] }],
  responses: {
    slot: { ok: true },
    unslot: { ok: true },
    mine: { ok: true },
    deploy: { ok: true },
    new_run: { ok: true },
  },
}

/** A recording stub of `send` sitting in front of the real seam. */
function recorder(run: FixtureRun = OP_RUN): {
  sent: MembraneOp[]
  send(op: MembraneOp): { ok: boolean }
  store(): { mined: string[]; slots: Record<number, string>; deployed: string[] }
} {
  const driver = createFixtureDriver(run)
  driver.start()
  const sent: MembraneOp[] = []
  return {
    sent,
    send(op: MembraneOp) {
      sent.push(op)
      return driver.send(op)
    },
    store: () => driver.store(),
  }
}

const empty = (cap: number): (string | null)[] => Array.from({ length: cap }, () => null)

describe('[u4#c3] membrane ops — slot · unslot · deploy', () => {
  it('(a) slotting emits exactly one {op:slot, block_id, slot}', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const plan = planOps({ slots: empty(SLOT_CAP), deployed: false }, { kind: 'place', blockId: 'b-r2-f03', slot: 1 })
    expect(plan.ops).toEqual([{ op: 'slot', block_id: 'b-r2-f03', slot: 1 }])
    expect(plan.slots[1]).toBe('b-r2-f03')
    expect(plan.slots).toHaveLength(SLOT_CAP)
    expect(plan.deployed).toBe(false)
  })

  it('(b) unslotting emits exactly one {op:unslot, slot}', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const slots = empty(SLOT_CAP)
    slots[1] = 'b-r2-f03'
    const plan = planOps({ slots, deployed: false }, { kind: 'clear', slot: 1 })
    expect(plan.ops).toEqual([{ op: 'unslot', slot: 1 }])
    expect(plan.slots[1]).toBeNull()
  })

  it('(c) clearing an already-empty slot emits nothing', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const plan = planOps({ slots: empty(SLOT_CAP), deployed: false }, { kind: 'clear', slot: 2 })
    expect(plan.ops).toEqual([])
    expect(plan.slots).toEqual(empty(SLOT_CAP))
  })

  it('(d) re-placing a slotted id emits unslot(old) then slot(new) — never two slots for one id', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const slots = empty(SLOT_CAP)
    slots[0] = 'b-r2-f03'
    const plan = planOps({ slots, deployed: false }, { kind: 'place', blockId: 'b-r2-f03', slot: 2 })

    expect(plan.ops).toEqual([
      { op: 'unslot', slot: 0 },
      { op: 'slot', block_id: 'b-r2-f03', slot: 2 },
    ])
    expect(plan.slots.filter((id) => id === 'b-r2-f03')).toHaveLength(1)
    expect(plan.slots[2]).toBe('b-r2-f03')
    expect(plan.slots[0]).toBeNull()
  })

  it('(e) placing onto an occupied slot frees the occupant first', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const slots = empty(SLOT_CAP)
    slots[1] = 'b-r2-b03'
    const plan = planOps({ slots, deployed: false }, { kind: 'place', blockId: 'b-r2-f03', slot: 1 })

    expect(plan.ops.filter((o) => o.op === 'unslot')).toEqual([{ op: 'unslot', slot: 1 }])
    expect(plan.ops.at(-1)).toEqual({ op: 'slot', block_id: 'b-r2-f03', slot: 1 })
    expect(plan.slots[1]).toBe('b-r2-f03')
    expect(plan.slots).not.toContain('b-r2-b03')
  })

  it('(f) re-placing an id into the slot it already holds leaves it there, once', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const slots = empty(SLOT_CAP)
    slots[3] = 'b-r2-f03'
    const plan = planOps({ slots, deployed: false }, { kind: 'place', blockId: 'b-r2-f03', slot: 3 })

    expect(plan.slots[3]).toBe('b-r2-f03')
    expect(plan.slots.filter((id) => id === 'b-r2-f03')).toHaveLength(1)
    for (const op of plan.ops) if (op.op === 'slot') expect(op.slot).toBe(3)
  })

  it('(g) deploy emits one {op:deploy, blocks} whose blocks SET-equal the slotted ids', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const slots = empty(SLOT_CAP)
    slots[0] = 'b-r2-f03'
    slots[2] = 'b-r1-b02'
    slots[3] = 'b-r2-b03'

    const plan = planOps({ slots, deployed: false }, { kind: 'deploy' })
    expect(plan.ops).toHaveLength(1)
    const op = plan.ops[0]!
    expect(op.op).toBe('deploy')
    const blocks = (op as { op: 'deploy'; blocks: string[] }).blocks
    // Order carries no meaning (§5.2): a shuffled expectation still passes.
    expect(new Set(blocks)).toEqual(new Set(['b-r2-b03', 'b-r2-f03', 'b-r1-b02']))
    expect(blocks.length).toBe(new Set(blocks).size)
    expect(plan.deployed).toBe(true)
  })

  it('(h) deploy on an empty board is legal and emits blocks: []', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const plan = planOps({ slots: empty(SLOT_CAP), deployed: false }, { kind: 'deploy' })
    expect(plan.ops).toEqual([{ op: 'deploy', blocks: [] }])
    expect(plan.deployed).toBe(true)
  })

  it('(i) every op after deploy is suppressed — 0 further sends, state untouched', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const slots = empty(SLOT_CAP)
    slots[0] = 'b-r2-f03'
    const locked = { slots, deployed: true }

    for (const action of [
      { kind: 'place', blockId: 'b-r1-f01', slot: 1 },
      { kind: 'clear', slot: 0 },
      { kind: 'deploy' },
    ] as SlotAction[]) {
      const plan = planOps(locked, action)
      expect(plan.ops, `a locked file must emit nothing for ${action.kind}`).toEqual([])
      expect(plan.slots).toEqual([...slots])
      expect(plan.deployed).toBe(true)
    }
  })

  it('(j) the planned ops are the ops the seam applies — recorded through send()', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const rec = recorder()
    let state = { slots: empty(SLOT_CAP) as (string | null)[], deployed: false }

    const run = (action: SlotAction): void => {
      const plan = planOps(state, action)
      for (const op of plan.ops) rec.send(op)
      state = { slots: plan.slots, deployed: plan.deployed }
    }

    run({ kind: 'place', blockId: 'b-r2-f03', slot: 0 })
    run({ kind: 'place', blockId: 'b-r2-b03', slot: 1 })
    run({ kind: 'place', blockId: 'b-r2-f03', slot: 2 }) // moves 0 → 2
    run({ kind: 'clear', slot: 1 })
    run({ kind: 'deploy' })

    expect(rec.sent).toEqual([
      { op: 'slot', block_id: 'b-r2-f03', slot: 0 },
      { op: 'slot', block_id: 'b-r2-b03', slot: 1 },
      { op: 'unslot', slot: 0 },
      { op: 'slot', block_id: 'b-r2-f03', slot: 2 },
      { op: 'unslot', slot: 1 },
      { op: 'deploy', blocks: ['b-r2-f03'] },
    ])
    expect(rec.store().slots).toEqual({ 2: 'b-r2-f03' })
    expect(new Set(rec.store().deployed)).toEqual(new Set(['b-r2-f03']))
  })

  it('(k) planOps sends nothing itself — it is pure, the caller emits', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const rec = recorder()
    planOps({ slots: empty(SLOT_CAP), deployed: false }, { kind: 'place', blockId: 'b-r2-f03', slot: 0 })
    planOps({ slots: empty(SLOT_CAP), deployed: false }, { kind: 'deploy' })
    expect(rec.sent).toEqual([])
    expect(String(planOps)).not.toMatch(/\bsend\b|\bdocument\b/)
  })

  it('(l) an unscripted op response throws at the seam — the board must treat it as rejected', async () => {
    const rec = recorder({ ...OP_RUN, responses: { mine: { ok: true } } })
    expect(() => rec.send({ op: 'slot', block_id: 'b-r2-f03', slot: 0 })).toThrow()
    // R4: the only path that may reach `send` is wrapped, so a throw cannot
    // escape into the desk.
    const board = stripComments(read(SLOT_BOARD_TS))
    expect(board).toMatch(/try\s*\{/)
    expect(board).toMatch(/catch\s*\(/)
  })

  it('(m) createSlotBoard routes its mutators through planOps — no second rule set', () => {
    const board = stripComments(read(SLOT_BOARD_TS))
    expect(board, 'slot-board.ts must declare the pure planner').toMatch(/function planOps\s*\(/)
    // The declaration plus at least one call: the DOM half decides no op itself.
    expect([...board.matchAll(/\bplanOps\b/g)].length, 'place/clear/deploy must call planOps').toBeGreaterThan(1)
    // And no other u4 source mints a membrane op literal.
    for (const s of u4Sources().filter((x) => x.file !== rel(SLOT_BOARD_TS))) {
      expect(s.text, `${s.file} mints a membrane op outside planOps`).not.toMatch(
        /op\s*:\s*['"](?:slot|unslot|deploy)['"]/,
      )
    }
  })
})

/* ══ [u4#c5] spec-client §3 inv 3 (I1) ═══════════════════════════════════ */

describe('[u4#c5] slot anchors expose data-block-id', () => {
  it('(a) SLOT_CAP is the bound dev value 4 (spec-client §9)', async () => {
    const { SLOT_CAP } = await loadSlotBoard()
    expect(SLOT_CAP).toBe(4)
  })

  it('(b) slotCells always returns exactly SLOT_CAP cells, indexed 0..cap-1', async () => {
    const { slotCells, SLOT_CAP } = await loadSlotBoard()
    for (const input of [[], [null], ['b-r2-f03'], ['a', 'b', 'c', 'd', 'e', 'f']] as (string | null)[][]) {
      const cells = slotCells(input)
      expect(cells).toHaveLength(SLOT_CAP)
      expect(cells.map((c) => c.slot)).toEqual([0, 1, 2, 3])
    }
  })

  it('(c) filled cells carry the authored id verbatim, empty cells carry null', async () => {
    const { slotCells } = await loadSlotBoard()
    const cells = slotCells(['b-r2-f03', null, 'b-r1-u07', null])
    expect(cells).toEqual([
      { slot: 0, blockId: 'b-r2-f03' },
      { slot: 1, blockId: null },
      { slot: 2, blockId: 'b-r1-u07' },
      { slot: 3, blockId: null },
    ])
  })

  it('(d) the ids are handed in, never derived — an opaque id survives round-trip', async () => {
    const { slotCells } = await loadSlotBoard()
    const odd = 'b-r10-q99'
    expect(slotCells([odd])[0]!.blockId).toBe(odd)
  })

  it('(e) the pin anchor writes data-block-id from the model', () => {
    const board = stripComments(read(SLOT_BOARD_TS))
    expect(board).toMatch(/data-block-id|dataset\.blockId/)
    expect(board).toMatch(/slot-pin/)
  })

  it('(f) no identification path ever reads textContent or innerText', () => {
    const scanned = [SLOT_BOARD_TS, BLOCK_CARD_TS].filter((f) => exists(f))
    expect(scanned.length, 'slot-board.ts and block-card.ts must exist').toBe(2)
    for (const file of scanned) {
      const text = stripComments(read(file))
      expect(text, `${rel(file)} reads innerText`).not.toMatch(/innerText/)
      // A read is any use of textContent that is not a plain assignment.
      expect(text, `${rel(file)} compares against textContent`).not.toMatch(
        /textContent\s*(?:===|!==|==|\.trim|\.includes|\.indexOf|\.startsWith)/,
      )
      expect(text, `${rel(file)} searches by textContent`).not.toMatch(
        /(?:indexOf|find|filter|includes|some)\s*\([^)]*textContent/,
      )
    }
  })
})

/* ══ [u4#c4] the deploy view model (DOM asserts live in e2e) ═════════════ */

describe('[u4#c4] deployView states — empty · partial · full · locked', () => {
  const at = '08:50'

  it('(a) an empty board is ready, and says an empty file still deploys', async () => {
    const { deployView } = await loadDeployButton()
    const v = deployView({ slots: [null, null, null, null], deployed: false, run: 3, at })
    expect(v.used).toBe(0)
    expect(v.cap).toBe(4)
    expect(v.count).toBe('0 / 4')
    expect(v.note).toBe('편성 없음 — 빈 파일로도 배치됩니다')
    expect(v.boardState).toBe('empty')
    expect(v.buttonState).toBe('ready')
    expect(v.stampOn).toBe(false)
  })

  it('(b) a partly filled board counts what is used', async () => {
    const { deployView } = await loadDeployButton()
    const v = deployView({ slots: ['b-r2-f03', null, 'b-r2-b03', null], deployed: false, run: 3, at })
    expect(v.used).toBe(2)
    expect(v.count).toBe('2 / 4')
    expect(v.note).toBe('편성 중 — 배치를 기다립니다')
    expect(v.boardState).toBe('partial')
    expect(v.buttonState).toBe('ready')
  })

  it('(c) a full board reads full and still deploys', async () => {
    const { deployView } = await loadDeployButton()
    const v = deployView({ slots: ['a', 'b', 'c', 'd'], deployed: false, run: 3, at })
    expect(v.boardState).toBe('full')
    expect(v.count).toBe('4 / 4')
    expect(v.buttonState).toBe('ready')
  })

  it('(d) a deployed file is locked, stamped and dated from the run it deployed for', async () => {
    const { deployView } = await loadDeployButton()
    const v = deployView({ slots: ['a', 'b', null, null], deployed: true, run: 3, at })
    expect(v.boardState).toBe('locked')
    expect(v.buttonState).toBe('deployed')
    expect(v.note).toBe('배치됨 — 이번 시행에서 잠김')
    expect(v.stampOn).toBe(true)
    // x7 — run 3 stamps ECHO-2, was ECHO-3: the series starts unnumbered, so a
    // run's number and its agent's number are off by one on purpose ((f) above).
    expect(v.stampLine).toBe('ECHO-2 · 08:50')
    expect(v.stampLine).toMatch(/^ECHO-\d+ · \d{2}:\d{2}$/)
  })

  it('(e) the stamp names the sitting, unpadded, whatever the run', async () => {
    const { deployView } = await loadDeployButton()
    // x7 — the FIRST sitting stamps a bare `ECHO` with no suffix at all, which
    // is the case a `/ECHO-\d+/` stamp regex would have missed. The stamp reads
    // the same `callsignOf` the file's own 식별 row does, so the plate on the
    // deploy zone and the name at the top of the page cannot disagree.
    expect(deployView({ slots: [], deployed: true, run: 1, at: '13:05' }).stampLine).toBe('ECHO · 13:05')
    expect(deployView({ slots: [], deployed: true, run: 10, at: '13:05' }).stampLine).toBe('ECHO-9 · 13:05')
  })
})

/* ══ [u4#c8] block-card — the card model and the pick channel ════════════ */

describe('[u4#c8] block-card owns the card model and the pick channel', () => {
  it('(a) SPECIES_DISPLAY carries the four species, ported from the design target', async () => {
    const { SPECIES_DISPLAY } = await loadBlockCard()
    expect(Object.keys(SPECIES_DISPLAY).sort()).toEqual(['emotion', 'fact', 'quote', 'selfnarr'])
    expect(SPECIES_DISPLAY.fact).toEqual({ ko: '사실', mark: '■', cls: 'sp-fact' })
    expect(SPECIES_DISPLAY.selfnarr).toEqual({ ko: '자기서술', mark: '◇', cls: 'sp-self' })
    expect(SPECIES_DISPLAY.emotion).toEqual({ ko: '감정', mark: '●', cls: 'sp-emo' })
    expect(SPECIES_DISPLAY.quote).toEqual({ ko: '인용', mark: '❝', cls: 'sp-quote' })
  })

  it('(b) a resolved sentence renders its own text, species and axis', async () => {
    const { blockCardModel } = await loadBlockCard()
    const sentence: Sentence = {
      id: 'b-r2-b03',
      text: '나는 계측 일지를 먼저 확인했다.',
      species: 'selfnarr',
      axis: '태도',
    }
    const model = blockCardModel(sentence.id, sentence)
    expect(model.id).toBe('b-r2-b03')
    expect(model.text).toBe(sentence.text)
    expect(model.species).toBe('selfnarr')
    expect(model.axis).toBe('태도')
    expect(model.ko).toBe('자기서술')
    expect(model.run).toBe(2)
  })

  it('(c) F1 — an unresolved id still renders a card, species derived from the channel', async () => {
    const { blockCardModel } = await loadBlockCard()
    const model = blockCardModel('b-r2-f03', null)
    expect(model.id).toBe('b-r2-f03')
    expect(model.species).toBe('fact')
    expect(model.ko).toBe('사실')
    expect(model.run).toBe(2)
    expect(model.text).toBe('(원문은 부검 기록에 있습니다)')
  })

  it('(d) species derives from the channel for every minted channel, never from text', async () => {
    const { blockCardModel } = await loadBlockCard()
    const expected: [string, Species][] = [
      ['b-r1-f01', 'fact'],
      ['b-r1-b02', 'selfnarr'],
      ['b-r1-n03', 'emotion'],
      ['b-r1-q04', 'quote'],
      ['b-r1-u05', 'quote'],
    ]
    for (const [id, species] of expected) expect(blockCardModel(id, null).species).toBe(species)
  })

  it('(e) an id that names no run does not throw — run is null', async () => {
    const { blockCardModel } = await loadBlockCard()
    const model = blockCardModel('t-0007', null)
    expect(model.id).toBe('t-0007')
    expect(model.run).toBeNull()
    expect(typeof model.text).toBe('string')
  })

  it('(f) the pick channel sets, reads, notifies and unsubscribes', async () => {
    const { pickedBlockId, setPickedBlockId, subscribePick } = await loadBlockCard()
    const seen: (string | null)[] = []
    const unsub = subscribePick((id) => seen.push(id))

    setPickedBlockId('b-r2-f03')
    expect(pickedBlockId()).toBe('b-r2-f03')
    setPickedBlockId(null)
    expect(pickedBlockId()).toBeNull()

    unsub()
    setPickedBlockId('b-r1-f01')
    expect(seen).toEqual(['b-r2-f03', null])
    setPickedBlockId(null)
  })
})

/* ══ [u4#c9] hard constraints, spot-pinned on u4's own files ═════════════ */

describe('[u4#c9] u4 sources hold the run-wide hard constraints', () => {
  it('(a) all five u4 sources are on disk', () => {
    expect(U4_SOURCES.filter((f) => !exists(f)).map(rel)).toEqual([])
  })

  it('(b) C8/inv 12 — nothing here imports engine or composer', () => {
    const bad = u4Sources()
      .flatMap((s) => [...s.text.matchAll(/from\s*['"]([^'"]+)['"]/g)].map((m) => `${s.file} → ${m[1]}`))
      .filter((entry) => /engine|composer/i.test(entry))
    expect(bad).toEqual([])
  })

  it('(c) C10/inv 1 — no <input>, no contenteditable, no free-text surface', () => {
    for (const s of u4Sources()) {
      expect(s.text, `${s.file} mints an input`).not.toMatch(/<input|createElement\(\s*['"](?:input|textarea)['"]/i)
      expect(s.text, `${s.file} names contenteditable`).not.toMatch(/contenteditable/i)
    }
  })

  it('(d) C4 — no localStorage anywhere in u4 (meta-state is sessionStorage)', () => {
    for (const s of u4Sources()) expect(s.text, `${s.file}`).not.toMatch(/localStorage/)
  })

  it('(e) C11/inv 8 — no colour, size or font literal outside tokens.css', () => {
    for (const s of u4Sources()) {
      expect(s.text, `${s.file} carries a hex colour`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(s.text, `${s.file} carries an rgb()/hsl() literal`).not.toMatch(/\b(?:rgba?|hsla?)\s*\(/)
      expect(s.text, `${s.file} carries a px literal`).not.toMatch(/\d+(?:\.\d+)?px/)
      expect(s.text, `${s.file} sets a font literal`).not.toMatch(/font-size|fontSize|font-family|fontFamily/)
    }
  })

  it('(f) C2/inv 9 — the toolchain stays devDeps-only, zero runtime deps', () => {
    const pkg = JSON.parse(read(path.join(REPO, 'package.json'))) as { dependencies?: Record<string, string> }
    expect(pkg.dependencies ?? {}).toEqual({})
  })

  it('(g) C13 — segment.ts and species.ts are consumed, never modified', () => {
    const touched = git('diff', '--name-only', 'HEAD', '--', 'src/shared/segment.ts', 'src/shared/species.ts')
    expect(touched.trim()).toBe('')
  })

  it('(h) c8 — u4 creates block-card.ts', () => {
    expect(exists(BLOCK_CARD_TS)).toBe(true)
  })

  it('(i) D3 — SLOT_CAP is the only 4 in u4: no bare slot-count literal elsewhere', () => {
    const board = stripComments(read(SLOT_BOARD_TS))
    expect(board).toMatch(/export const SLOT_CAP\s*=\s*4/)
    for (const s of u4Sources().filter((x) => x.file !== rel(SLOT_BOARD_TS))) {
      expect(s.text, `${s.file} hardcodes the slot cap instead of importing SLOT_CAP`).not.toMatch(
        /(?:slotCap|cap|slots?)\s*[:=]\s*4\b/,
      )
    }
  })

  it('(j) the window keeps u3\'s mount(host, driver) signature and imports no fixture module', () => {
    const win = stripComments(read(AGENT_FILE_TS))
    expect(win).toMatch(/export function mount\s*\(\s*host\s*:\s*HTMLElement\s*,\s*driver\s*:\s*FixtureDriver\s*\)/)
    expect(win, 'a window must not import a fixture module').not.toMatch(/driver\/fixtures\//)
  })
})

/* ══ U5.3 — a finished sitting's page ════════════════════════════════════ */

describe('[U5.3] filedModel is the same document, closed', () => {
  it('(a) it carries 식별 and a FILED 인수인계 사항, and nothing operable', async () => {
    const { filedModel } = await loadDossier()
    const sections = filedModel({ callsign: 'ECHO-1' })

    expect(sections.map((s) => s.title)).toEqual(['식별', '인수인계 사항'])
    expect(sections.map((s) => s.state)).toEqual(['fixed', 'filed'])
    // x5 — the note no longer counts anything. It used to print '배치 3건', and
    // the page below it now prints those three sentences as a paragraph, so the
    // count was the document telling the reader what the reader can see. What
    // the note owes is that the sitting is CLOSED — a past page must not read
    // like a file that can still be written to.
    expect(sections[1]!.note).toBeTruthy()
    expect(sections[1]!.note).not.toMatch(/\d/)
    expect(JSON.stringify(sections[0]!.rows)).toContain('ECHO-1')
  })

  it('(b) it is pure, takes no host, and names no document', async () => {
    const { filedModel } = await loadDossier()
    const input = Object.freeze({ callsign: 'ECHO-2' })
    const before = JSON.stringify({ callsign: input.callsign })

    const first = filedModel(input)
    const second = filedModel({ callsign: 'ECHO-2' })

    expect(JSON.stringify({ callsign: input.callsign })).toBe(before)
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
    expect(String(filedModel)).not.toMatch(/document/)
  })
})
