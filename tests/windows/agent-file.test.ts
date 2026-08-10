// u4 — AGENT FILE window: the model half.
//
// SCOPE (unit-scoped, u4): this suite reads only the five sources u4 owns
// (`components/{block-card,slot-board,dossier,deploy-button}.ts` +
// `windows/agent-file.ts`) plus repo-level guards C2/C13 that name them.
//
// x10 widens that by exactly one file: `styles/win-agent-file.css`, the window's
// own sheet, read as TEXT off disk and never imported (the
// `tests/shell/sign-in.test.ts` idiom — that suite reads `signin.css` for the
// same kind of claim). It is here because x10's DEPLOY cue is a contract split
// across the two: the sheet decides which half of the cycle the animation ends
// on, and under `prefers-reduced-motion` that keyframe is the only state a
// reduced-motion operator ever sees. A node-env run cannot watch it blink, but it
// can prove the declaration that decides what the blink settles as — which is the
// half that can silently ship a DEPLOY button that looks dead.
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
  /**
   * x10's pure core for the mining hold: whether a handover of these sentences
   * types at all. `revealHandover`'s early return IS this call, so the two paths
   * that paint no character (an empty file, a desk asking for no motion) are the
   * paths on which nothing can be held.
   */
  handoverTypes(texts: readonly string[], motionless: boolean): boolean
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

/* ══ x10 — the cue on the second page's DEPLOY, and the cover's own pace ═══ */

const WIN_FILE_CSS = path.join(CLIENT, 'styles/win-agent-file.css')

/** The window's sheet: comments out, whitespace flattened. */
function sheet(): string {
  return stripComments(read(WIN_FILE_CSS)).replace(/\s+/g, ' ')
}

/** The window's source, comments out — the same text every scan above reads. */
function windowSource(): string {
  return stripComments(read(AGENT_FILE_TS))
}

/** One rule's declaration block, by literal selector (regex-escaped by the caller). */
function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${escaped}\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
}

/**
 * The DURATION out of an `animation:` shorthand — the first time-valued token.
 *
 * Positional and not named, because that is how the shorthand works: the first
 * `<time>` is the duration and the second, if any, is the delay. Nothing else in
 * either cue's shorthand (`dzCue`/`pgCue`, `linear`, `infinite`, `both`) can be
 * mistaken for one, so this is exact rather than approximate.
 */
function cueDuration(rule: string): string {
  const animation = /animation:\s*([^;}]+)/.exec(rule)?.[1] ?? ''
  return animation.trim().split(/\s+/).find((p) => /^-?(?:\d+(?:\.\d+)?|\.\d+)m?s$/.test(p)) ?? ''
}

/** One `@keyframes` block's steps, in declared order. */
function keyframeSteps(css: string, name: string): { sel: string; decl: string }[] {
  const block = new RegExp(`@keyframes\\s+${name}\\s*\\{((?:[^{}]*\\{[^{}]*\\})*)\\s*\\}`).exec(css)
  if (block === null) return []
  return [...block[1]!.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    sel: m[1]!.trim(),
    decl: m[2]!.trim(),
  }))
}

describe('[x10] the DEPLOY cue is one 1 s cycle and it ends ACTIVATED', () => {
  it('(a) the blink is one 1 s pass, looping, filled, and never alternating', () => {
    const rule = /\.btn-deploy\.is-cued\{([^}]*)\}/.exec(sheet())?.[1] ?? ''
    expect(rule, 'win-agent-file.css no longer cues the control at all').not.toBe('')
    const animation = /animation:\s*([^;}]+)/.exec(rule)?.[1] ?? ''

    expect(animation).toMatch(/\bdzCue\b/)
    // 1 s IS THE WHOLE CYCLE — there and back inside 1000 ms (민서, 08-10). A VALUE
    // CHANGE AND NOT A RE-AIM: this shipped at `.5s`, 민서 read the built page and
    // ruled it too fast, and the claim being made is the one it always was — the
    // DECLARED duration is the whole cycle they asked for, not half of one. The
    // absence of `alternate` is still asserted and not assumed, because `1s …
    // infinite alternate` is a TWO-second round trip wearing a 1 s number, exactly
    // as `.5s … alternate` was a 1 s round trip wearing a 0.5 s one. It is the shape
    // anyone reaching for a two-state pulse writes first, at any duration.
    expect(animation, 'the cue is no longer a one-second cycle').toMatch(/(^|\s)1s(\s|$)/)
    expect(animation, 'an alternating cue is a 2 s round trip wearing a 1 s number').not.toMatch(
      /alternate/,
    )
    expect(animation, 'a cue that does not loop is not a cue').toMatch(/\binfinite\b/)
    // FILLED, and this is the other half of the reduced-motion contract. `base.css`
    // collapses every animation to a single 1 ms pass, and an UNFILLED cue would
    // then hand `background` back to the cascade — to `.btn-deploy`'s own
    // graphite, the DEACTIVATED look — leaving a live DEPLOY button that reads as
    // dead for exactly the operator who asked for less movement. `signin.css`'s
    // `siBlink` needs the opposite keyword for the same reason (its element's own
    // value is the LIT one); both comments say so, and both are guarded.
    expect(animation, 'an unfilled cue settles on the deactivated background').toMatch(
      /\b(both|forwards)\b/,
    )
  })

  it('(b) the keyframes end on the ACTIVATED look and start on the deactivated one', () => {
    const css = sheet()
    const steps = keyframeSteps(css, 'dzCue')
    // Two states, held flat — not a walk through intermediate colours. A third
    // step would mean the cue had become a gradient, and a signal lamp is not one.
    expect(steps.map((s) => s.sel), 'the cue is no longer two flat halves').toEqual([
      '0%,49.9%',
      '50%,100%',
    ])

    // THE ORDERING IS THE CONTRACT. Under the reduced-motion collapse the element
    // lands on its 100% keyframe and stays there, so 100% must be the activated
    // state. Reversing these two for symmetry is the one edit this guard exists to
    // catch — it would look like tidying and would ship a dead-looking control.
    const last = steps[steps.length - 1]
    expect(last?.sel, 'the last keyframe is not the one at 100%').toContain('100%')

    // …and "activated" / "deactivated" are pinned to the rules that DEFINE them,
    // never to a token spelled twice: the lit half is the background `:hover`
    // paints, the dark half is the one `.btn-deploy` itself declares. Re-skin the
    // button and this guard follows it.
    const activated = /\.btn-deploy:hover:not\(:disabled\)\{[^}]*background:(var\(--[\w-]+\))/.exec(css)?.[1]
    const deactivated = /\.btn-deploy\{[^}]*background:(var\(--[\w-]+\))/.exec(css)?.[1]
    expect(activated, 'the control has no hover background to call its activated look').toBeTruthy()
    expect(deactivated, 'the control has no resting background to call its deactivated look').toBeTruthy()
    expect(last?.decl, 'the cue does not end on the activated look').toContain(`background:${activated}`)
    expect(steps[0]?.decl, 'the cue does not start on the deactivated look').toContain(
      `background:${deactivated}`,
    )
  })

  it('(c) the page condition and the latch live in the window, never in the pure view', () => {
    const win = windowSource()

    // D1 — `deployView` stays pure and page-blind. Whether the mounted page is
    // page 2 of 2 is the document's geometry, and a view model that learned it to
    // decide a colour would be deciding layout from state it has no business
    // holding. So the condition is computed in `turn()`, where both numbers are.
    expect(
      stripComments(read(DEPLOY_BUTTON_TS)),
      'the pure view model learned the document’s page geometry',
    ).not.toMatch(/is-cued|SecondPage|cueSpent/)
    expect(win).toMatch(/classList\.toggle\('is-cued'/)
    expect(win, 'the cue no longer rides page index 1 of 2').toMatch(
      /liveOnSecondPage\s*=\s*clamped === 1 && clamped === last/,
    )

    // Every clause of the cue, named. Each one is a way for the blink to be
    // wrong rather than merely misplaced: on a page it is not on, after the press
    // that spent it, on a day in flight (`settling` / `next` / `spent`), or on a
    // control that cannot be pressed at all.
    const body = /function paintCue\(\)[^{]*\{([\s\S]*?)\n {2}\}/.exec(win)?.[1] ?? ''
    expect(body, 'paintCue is gone — some other writer owns the class now').not.toBe('')
    for (const clause of ['liveOnSecondPage', '!cueSpent', "mode === 'deploy'", '!deployBtn.disabled']) {
      expect(body, `the cue no longer gates on ${clause}`).toContain(clause)
    }
  })

  it('(d) the press latch is a latch — set once, never re-armed', () => {
    const win = windowSource()
    expect(win, 'nothing spends the cue any more').toMatch(/cueSpent\s*=\s*true/)
    // The ONLY `= false` is the declaration. 민서, 08-10: the press ends the blink
    // and the 배치 확인 plate it raises may be answered 취소 — a cue recomputed
    // from live state would come back the moment the question came down, which is
    // the desk repeating a request it already had an answer to.
    const cleared = [...win.matchAll(/cueSpent\s*=\s*false/g)]
    expect(cleared, 'the latch is re-armed somewhere — the cue must not return this session').toHaveLength(1)
    expect(win).toMatch(/let cueSpent = false/)
  })
})

/* ══ x10 — the cue on the page turn ═══════════════════════════════════════════
 *
 * 민서, 08-10: *"After the cover typing is finished, wait 1 second. If the user
 * does not click the next page button during that 1 second, blink a transparent
 * box with a red borderline around the next page button. Same cycle as the DEPLOY
 * button blink (1 second)."*
 *
 * The same split as the DEPLOY cue, so the same two halves are guarded: the sheet
 * decides what the box IS and which half of the cycle it settles on, and the window
 * decides WHEN — and both halves can ship a silent failure a node-env run is the
 * only cheap place to catch. The one that would hurt most is the reduced-motion
 * collapse landing on the invisible keyframe: the mark would simply not exist for
 * the operator who has already had the whole reveal taken away from them.
 */
describe('[x10] the page-turn cue marks the way out of the cover', () => {
  it('(a) the two cues share one cycle — the arrow blinks at the DEPLOY rate', () => {
    const css = sheet()
    const deploy = cueDuration(ruleBody(css, '.btn-deploy.is-cued'))
    const turn = cueDuration(ruleBody(css, '.pg-next.is-cued::after'))

    expect(deploy, 'the DEPLOY cue has no duration to compare against').not.toBe('')
    expect(turn, 'win-agent-file.css no longer cues the page turn at all').not.toBe('')
    // "SAME CYCLE AS THE DEPLOY BUTTON BLINK" was the request, so the two are
    // compared to each other and not both to a literal: 민서 has already moved this
    // number once (0.5 s → 1 s, same day), and the thing that must survive the next
    // move is that the desk blinks at ONE rate. Two surfaces cueing at two speeds is
    // a desk with two pulses, which reads as two unrelated alarms.
    expect(turn, 'the two cues no longer share a cycle').toBe(deploy)
    expect(turn, 'the shared cycle is no longer the 1 s 민서 ruled').toBe('1s')

    const rule = ruleBody(css, '.pg-next.is-cued::after')
    expect(rule).toMatch(/\bpgCue\b/)
    expect(rule, 'an alternating cue is a 2 s round trip wearing a 1 s number').not.toMatch(
      /alternate/,
    )
    expect(rule, 'a cue that does not loop is not a cue').toMatch(/\binfinite\b/)
    expect(rule, 'an unfilled cue hands the mark back to the cascade').toMatch(/\b(both|forwards)\b/)
  })

  it('(b) the keyframes end on the VISIBLE state, so reduced motion leaves a static mark', () => {
    const steps = keyframeSteps(sheet(), 'pgCue')
    // Two states held flat, the same hard cut `dzCue` makes — a third step would
    // mean the box had started fading in and out, and a mark is not a breath.
    expect(steps.map((s) => s.sel), 'the cue is no longer two flat halves').toEqual([
      '0%,49.9%',
      '50%,100%',
    ])
    // THE ORDERING IS THE CONTRACT, exactly as it is for `dzCue`. `base.css`
    // collapses every animation to one 1 ms pass with `animation-iteration-count:1`,
    // which lands the element on its 100% keyframe and leaves it there. So 100% must
    // be the DRAWN state: reversed for symmetry with anything, a reduced-motion
    // operator would get no mark at all — and that is the operator who never saw the
    // cover type itself out either, so the arrow is the only thing left telling them
    // the document continues.
    expect(steps.at(-1)?.sel, 'the last keyframe is not the one at 100%').toContain('100%')
    expect(steps.at(-1)?.decl, 'the cue settles INVISIBLE under reduced motion').toMatch(
      /opacity:\s*1\b/,
    )
    expect(steps[0]?.decl, 'the cue no longer starts unmarked').toMatch(/opacity:\s*0\b/)
  })

  it('(c) it is a transparent box around the arrow, and it borrows neither the focus channel nor the layout', () => {
    const css = sheet()
    const box = ruleBody(css, '.pg-next.is-cued::after')

    // A BOX, drawn AROUND the button: a border and no fill, so the arrow's own face
    // shows through unchanged. `background` here would make it a plate over the
    // control rather than a mark around it.
    expect(box).toMatch(/\bborder:[^;]*var\(--seal-2\)/)
    expect(box, 'the cue paints a fill — the arrow must show through').not.toMatch(/background/)
    expect(box).toMatch(/content:''/)

    // NOT `outline`, and this is the whole reason the cue is a pseudo-element.
    // `.pg-turn` is a focusable control and the desk's focus channel IS `outline`
    // wherever it is drawn by hand (`confirm.css`, `signin.css`, `coach.css`);
    // `.pg-turn` takes the UA's. A cue in that channel makes a focused arrow and a
    // hinted arrow the same object — and worse, an ANIMATED property outranks every
    // author declaration, so the cue would SUPPRESS the focus ring for its whole run.
    for (const rule of [box, ruleBody(css, '.pg-next')]) {
      expect(rule, 'the cue borrows the focus channel').not.toMatch(/outline/)
    }

    // IT CANNOT MOVE ANYTHING. Out of flow, so neither the arrow's box nor
    // `.pg-nav`'s row can feel it; `pointer-events:none` so the 2 px of overhang
    // does not widen what the operator can click or reach over `.pg-count`.
    expect(box).toMatch(/position:absolute/)
    expect(box).toMatch(/pointer-events:none/)
    // …and the containing block is the ONLY thing added to the button itself. A
    // second declaration here is a live control being re-styled by a hint.
    expect(ruleBody(css, '.pg-next').replace(/\s+/g, ''), '.pg-next gained a declaration beyond its containing block').toBe(
      'position:relative',
    )
    // The cue is on the pseudo-element and nowhere else: no rule paints the BUTTON
    // when it is cued, which is what keeps every one of its own properties — border,
    // background, transform, outline — with the cascade.
    expect(css, 'a rule cues the button itself, not the box around it').not.toMatch(
      /\.pg-next\.is-cued\{/,
    )
  })

  it('(d) the wait, the arm and the paint are one each, and the arm declines the third landing', () => {
    const win = windowSource()

    // ONE WAIT, named, and it is a constant rather than a literal in a `setTimeout`.
    expect(win, 'the 1 s wait before the cue is gone or is no longer a bare number').toMatch(
      /const PG_CUE_ARM_MS = 1000/,
    )

    // ONE WRITER of the class, and it is not the DEPLOY cue's. Both toggles exist,
    // each exactly once, each on its own control — a single writer for both would
    // have to know two page geometries and two latches.
    expect([...win.matchAll(/pgNext\.classList\.toggle\('is-cued'/g)]).toHaveLength(1)
    expect([...win.matchAll(/deployBtn\.classList\.toggle\('is-cued'/g)]).toHaveLength(1)

    // Every clause of the paint, named. Each is a way for the mark to be wrong
    // rather than merely misplaced: over a reveal that is still printing, on a page
    // that is not the cover, after the press that spent it, or on an arrow that
    // cannot be pressed at all.
    const paint = /function paintPgCue\(\)[^{]*\{([\s\S]*?)\n {2}\}/.exec(win)?.[1] ?? ''
    expect(paint, 'paintPgCue is gone — some other writer owns the class now').not.toBe('')
    for (const clause of ['pgCueArmed', '!pgCueSpent', 'coverDone', 'viewing === 0', '!pgNext.disabled']) {
      expect(paint, `the page-turn cue no longer gates on ${clause}`).toContain(clause)
    }

    // ONE ARM, and it is reached from exactly the two places the cover becomes
    // readable — `landCover()` and `mountCover()`. Three occurrences: the
    // declaration and those two calls.
    const arm = /function armPgCue\(\)[^{]*\{([\s\S]*?)\n {2}\}/.exec(win)?.[1] ?? ''
    expect(arm, 'armPgCue is gone — the wait is armed somewhere else now').not.toBe('')
    expect([...win.matchAll(/\barmPgCue\b/g)], 'the arm gained or lost a call site').toHaveLength(3)
    expect(win).toMatch(/function landCover\(\)[^{]*\{[\s\S]*?armPgCue\(\)/)
    expect(win).toMatch(/function mountCover\(page: HTMLElement\)[^{]*\{[\s\S]*?armPgCue\(\)/)

    // …AND IT DECLINES `landCover`'s THIRD CALLER. `turn()` lands the reveal
    // whenever a page other than the cover is mounted, and that operator has already
    // made the gesture the cue would be asking for. `turn()` assigns `viewing`
    // before it reaches that branch, so the page test inside the arm is what refuses
    // it — this is the guard that keeps the cue off a desk whose page is turned.
    expect(arm, 'the arm no longer refuses a landing made on another page').toContain('viewing !== 0')
    expect(arm, 'the arm no longer refuses a reveal that is still printing').toContain('!coverDone')
    // Idempotent: both call sites can fire repeatedly (every mount of the cover is
    // one), so the wait must not be restartable and the latches must be honoured.
    for (const clause of ['pgCueArmed', 'pgCueSpent', 'pgCueTimer !== null']) {
      expect(arm, `the arm no longer refuses on ${clause}`).toContain(clause)
    }
    expect([...win.matchAll(/pgCueArmed\s*=\s*true/g)], 'the wait ends in more than one place').toHaveLength(1)
  })

  it('(e) the two cues are spent by two different presses, and neither latch re-arms', () => {
    const win = windowSource()

    // TWO LATCHES, DECLARED SEPARATELY. Overloading `cueSpent` would mean the page
    // turn retired the DEPLOY cue — and the turn is what MOUNTS the page that cue
    // lives on, so following the first hint would take the second one away.
    expect(win).toMatch(/let cueSpent = false/)
    expect(win).toMatch(/let pgCueSpent = false/)

    // Each is set exactly once, and the only `= false` is its declaration: a cue
    // recomputed from live state comes back the moment the state does, which is the
    // desk repeating a request it already had an answer to (민서, 08-10).
    expect([...win.matchAll(/pgCueSpent\s*=\s*true/g)]).toHaveLength(1)
    expect(
      [...win.matchAll(/pgCueSpent\s*=\s*false/g)],
      'the page-turn latch is re-armed somewhere — the cue must not return this session',
    ).toHaveLength(1)

    // …and they are spent by the two presses that own them. The regions are the two
    // handlers, sliced out of the source so that "the DEPLOY press spends the DEPLOY
    // cue" is a fact about where the line sits and not about how many of each string
    // the file contains.
    const nextAt = win.indexOf("pgNext.addEventListener('click'")
    // The mount of the window's three children, which is the next statement after
    // the two arrow listeners. Named in full because a bare `host.append(` also
    // matches `filedHost`'s own local `host`, several hundred lines earlier.
    const appendAt = win.indexOf('host.append(stamp.root')
    expect(nextAt, 'the page-turn handler is gone').toBeGreaterThan(-1)
    expect(appendAt, 'the window no longer mounts its own nav').toBeGreaterThan(nextAt)
    const turnPress = win.slice(nextAt, appendAt)
    expect(turnPress, 'the page turn no longer spends its own cue').toContain('pgCueSpent = true')
    // Case is what separates the two names — `pgCueSpent` carries a capital `C`, so
    // a lower-case `cueSpent` here would be the DEPLOY latch and nothing else.
    expect(turnPress, 'the page turn spends the DEPLOY cue as well').not.toContain('cueSpent')

    const zoneAt = win.indexOf('buildDeployZone(')
    const stampAt = win.indexOf('buildDeployStamp()')
    expect(zoneAt, 'the deploy handler is gone').toBeGreaterThan(-1)
    expect(stampAt).toBeGreaterThan(zoneAt)
    const deployPress = win.slice(zoneAt, stampAt)
    expect(deployPress, 'the DEPLOY press no longer spends its own cue').toContain('cueSpent = true')
    expect(deployPress, 'the DEPLOY press spends the page-turn cue as well').not.toContain('pgCueSpent')
  })
})

describe('[x10] the cover’s own pace', () => {
  /** One of the reveal's four local constants. */
  function beat(name: string): number {
    const m = new RegExp(`const ${name}\\s*=\\s*(\\d+)`).exec(windowSource())
    return m === null ? Number.NaN : Number(m[1])
  }

  it('(a) a character is quicker than a word, a word than a line, and the lead beat leads', () => {
    // NOT the numbers themselves — they have moved twice in two days (22 → 45 → 36
    // per character) and `e2e/agent-file.spec.ts` deliberately asserts "the shape
    // of it and not its pace" for the same reason. What must hold whatever the
    // rates are is the ORDER: the reveal reads as dictation because the pause
    // after a word is longer than the one after a character and the pause after a
    // line is longer again, and the lead is longer than any of them because it is
    // staging rather than a rate — it is what makes the page be seen blank first.
    const perChar = beat('COVER_MS_PER_CHAR')
    const word = beat('COVER_MS_WORD')
    const line = beat('COVER_MS_LINE')
    const lead = beat('COVER_LEAD_MS')
    for (const [name, value] of [
      ['COVER_MS_PER_CHAR', perChar],
      ['COVER_MS_WORD', word],
      ['COVER_MS_LINE', line],
      ['COVER_LEAD_MS', lead],
    ] as const) {
      expect(Number.isFinite(value), `${name} is gone or is no longer a bare number`).toBe(true)
    }
    expect(perChar).toBeLessThan(word)
    expect(word).toBeLessThan(line)
    expect(line).toBeLessThan(lead)
    // …and the desk's own READING pace is still the faster of the two models: the
    // cover is a document the operator is being slowed down over, the feed is a
    // radio arriving at reading speed (`components/typewriter.ts`, 11 ms).
    expect(perChar).toBeGreaterThan(11)
  })

  it('(b) the series name in the cover’s prose is machine print, and only there', () => {
    // x10, 민서 — ECHO is a callsign, which on this desk is a FIXED value the
    // form prints, so it takes `--mono` like the 호출부호 row does and not the
    // 명조 of the sentence around it. A bare `var()`, per inv 8.
    expect(sheet(), 'the cover’s ECHO is back in the body’s serif').toMatch(
      /\.rd-echo\{[^}]*font-family:var\(--mono\)/,
    )
    // …and the swap reaches exactly one surface, which is what made it safe to
    // declare on the class rather than scoped to the cover: `callsignMarked` in
    // dossier.ts is the only emitter of `rd-echo` in the unit.
    const emitters = u4Sources().filter((s) => /'rd-echo'/.test(s.text)).map((s) => s.file)
    expect(emitters, 'a second surface emits rd-echo — scope the face to the cover').toEqual([
      rel(DOSSIER_TS),
    ])
  })
})

/* ══ x10 — the handover reveal: its own pace, and the mining hold ═════════ */
//
// Two rulings from 민서 on 08-10, both about the same reveal:
//
//   "Mining should be disabled when the previous ECHO's 인수인계 사항 is being
//    typed out."
//   "let's speed up the type speed of this one."
//
// The second is the delicate one. `components/typewriter.ts` is SHARED — the
// REPORT body replay types on the same arithmetic — so a faster handover had to
// become a parameter rather than new constants, and what the block below pins is
// that the parameter did its job: the handover moved, the report did not, and
// there is still exactly one typewriter on the desk. REPORTS' side of the hold
// (the refusal, and the `aria-disabled` that announces it) is asserted in
// `tests/windows/reports.test.ts` under the same `[x10]` heading.

const TYPEWRITER_TS = path.join(COMPONENTS, 'typewriter.ts')
const WOODARI_REPORTS_TS = path.join(CLIENT, 'driver/fixtures/woodari-reports.ts')

interface TypePace {
  msPerChar: number
  msBetween: number
}

interface TypewriterModule {
  READING_PACE: TypePace
  TYPE_START: { sentence: number; chars: number; done: boolean }
  typeCursor(
    state: { sentence: number; chars: number; done: boolean },
    elapsedMs: number,
    lengths: readonly number[],
    pace?: TypePace,
  ): { sentence: number; chars: number; done: boolean }
  typeDuration(lengths: readonly number[], pace?: TypePace): number
}

interface WoodariReports {
  reportOf(run: 1 | 2 | 3): { facts: Sentence[]; report_body: Sentence[] }
}

const loadTypewriter = async (): Promise<TypewriterModule> =>
  (await import(importable(TYPEWRITER_TS))) as unknown as TypewriterModule

/** The board's source, comments out — the same text every u4 scan reads. */
function boardSource(): string {
  return stripComments(read(SLOT_BOARD_TS))
}

/** The handover's two numbers, read off the board rather than restated here. */
function handoverPace(): TypePace {
  const m = /const HANDOVER_PACE:\s*TypePace\s*=\s*\{\s*msPerChar:\s*(\d+),\s*msBetween:\s*(\d+)\s*\}/.exec(
    boardSource(),
  )
  return { msPerChar: m === null ? Number.NaN : Number(m[1]), msBetween: m === null ? Number.NaN : Number(m[2]) }
}

/**
 * The median length of a report sentence in the shipped pack fixture.
 *
 * Read, never authored (C3): what the assertions below use it for is a RATIO and
 * a check that the board's own comment still states the total its constants
 * produce — neither of which pins what the fixture says.
 */
async function medianSentenceLength(): Promise<number> {
  const pack = (await import(importable(WOODARI_REPORTS_TS))) as unknown as WoodariReports
  const lengths: number[] = []
  for (const run of [1, 2, 3] as const) {
    const report = pack.reportOf(run)
    for (const s of [...report.facts, ...report.report_body]) lengths.push(s.text.length)
  }
  expect(lengths.length, 'no fixture report sentence to measure — the scan is vacuous').toBeGreaterThan(20)
  lengths.sort((a, b) => a - b)
  return lengths[Math.floor(lengths.length / 2)]!
}

describe('[x10] the handover types at its own pace', () => {
  it('(a) the pace is an ARGUMENT — the same cursor, run at two rates', async () => {
    const t = await loadTypewriter()
    const fast = handoverPace()
    const lengths = [34, 34, 34, 34]

    expect(Number.isFinite(fast.msPerChar), 'HANDOVER_PACE is gone or no longer two bare numbers').toBe(true)
    expect(Number.isFinite(fast.msBetween)).toBe(true)

    // Faster on both axes, and faster at every point of the replay — not merely
    // shorter overall, which a bigger between-sentence pause could still be.
    expect(fast.msPerChar).toBeLessThan(t.READING_PACE.msPerChar)
    expect(fast.msBetween).toBeLessThan(t.READING_PACE.msBetween)
    for (const elapsed of [60, 200, 700, 1_500]) {
      const slow = t.typeCursor(t.TYPE_START, elapsed, lengths)
      const quick = t.typeCursor(t.TYPE_START, elapsed, lengths, fast)
      const at = (c: { sentence: number; chars: number }): number => c.sentence * 1_000 + c.chars
      expect(at(quick), `the handover is not ahead of the report at ${elapsed} ms`).toBeGreaterThan(at(slow))
    }

    // …and it is the SAME machine: it still settles on `done` instead of running
    // off the end, at the new rate as at the old one ([u6#c2]).
    const end = t.typeCursor(t.TYPE_START, 60_000, lengths, fast)
    expect(end.done).toBe(true)
    expect(t.typeCursor(end, 60_000, lengths, fast)).toEqual(end)
    expect(t.typeCursor(t.TYPE_START, 0, [], fast).done).toBe(true)
  })

  it('(b) roughly HALF the reading pace — and the board’s note still states the total it produces', async () => {
    const t = await loadTypewriter()
    const fast = handoverPace()
    const median = await medianSentenceLength()
    const four = [median, median, median, median]
    const before = t.typeDuration(four)
    const after = t.typeDuration(four, fast)

    // 민서 asked for "roughly half"; the band is what "roughly" is allowed to
    // mean, and it is deliberately wide enough that the next reading of the pace
    // does not have to be exactly 0.5 to be honest.
    expect(after / before).toBeGreaterThan(0.45)
    expect(after / before).toBeLessThan(0.6)

    // THE NOTE IS PINNED TO THE ARITHMETIC. `windows/agent-file.ts`'s cover pace
    // carries the argument in full: a comment stating a total is a function of the
    // constants beside it, and the cover's went stale for two days claiming
    // fifteen seconds for a page that took 22.5. If this fails, recompute the two
    // figures in `HANDOVER_PACE`'s note — do not delete them.
    const note = read(SLOT_BOARD_TS)
    const claimed = (re: RegExp): number => {
      const m = re.exec(note)
      return m === null ? Number.NaN : Number(m[1])
    }
    expect(claimed(/median (\d+)/), 'the note’s median is not the fixture’s any more').toBe(median)
    expect(claimed(/cost (\d+) ms at the reading pace/), 'the note’s BEFORE total is stale').toBe(before)
    expect(claimed(/and (\d+) ms at this one/), 'the note’s AFTER total is stale').toBe(after)
  })

  it('(c) the SHAPE survives the speed-up: the pause is still worth about a dozen characters', async () => {
    const t = await loadTypewriter()
    const fast = handoverPace()
    // A rate halved with the pause left where it was turns every row boundary
    // into a stop. The two numbers move together, so the pause stays worth the
    // same reading — a dozen characters of the rate beside it, within a couple.
    const chars = (p: TypePace): number => p.msBetween / p.msPerChar
    expect(Math.abs(chars(fast) - chars(t.READING_PACE))).toBeLessThan(2)
    // …and it is still a pause at all, which is what makes four sentences read as
    // four rather than as one long string.
    expect(fast.msBetween).toBeGreaterThan(fast.msPerChar)
  })

  it('(d) ONE typewriter: the board names a pace, it does not fork the arithmetic', () => {
    const board = boardSource()
    // The call is the shared one, three arguments plus the pace.
    expect(board, 'the reveal no longer runs the shared cursor').toMatch(
      /typeCursor\(\s*TYPE_START,\s*elapsed,\s*lengths,\s*HANDOVER_PACE\s*\)/,
    )
    expect(board, 'the board imports the typewriter').toMatch(/from '\.\/typewriter\.ts'/)
    // And it holds no second copy of the model: no cursor arithmetic of its own,
    // no per-character reduction, no rival constants.
    expect(board, 'the board mints a rival pace constant').not.toMatch(/MS_PER_CHAR|MS_BETWEEN/)
    expect(board, 'the board does its own per-character arithmetic').not.toMatch(
      /msPerChar\s*[*+]|Math\.floor\([^)]*msPerChar/,
    )
    // The one pace in the file is the one the reveal passes.
    expect((board.match(/HANDOVER_PACE/g) ?? []).length, 'HANDOVER_PACE is declared and used exactly once').toBe(2)
  })

  it('(e) the watchdog counts frames since the last TICK — the pace cannot destabilise it', () => {
    const board = boardSource()
    expect(board).toMatch(/const WATCHDOG_FRAMES\s*=\s*(\d+)/)
    // It is not derived from the reveal's duration, so a faster reveal leaves it
    // exactly where it was: the pump resets the counter on every tick and the rAF
    // chain raises it, which is the same fact ("nothing is pumping this") at any
    // rate. A watchdog scaled off the pace would have to move with every reading
    // of it, and would still be measuring the wrong thing.
    expect(board, 'the pump no longer resets the watchdog').toMatch(/sinceTick = 0/)
    expect(board, 'the watchdog no longer counts frames').toMatch(/sinceTick \+= 1/)
    const watchAt = board.indexOf('const watch =')
    expect(watchAt).toBeGreaterThan(-1)
    expect(board.slice(watchAt), 'the watchdog is derived from the pace').not.toMatch(
      /HANDOVER_PACE|typeDuration/,
    )
  })
})

describe('[x10] the reveal holds the tear, and cannot hold it for ever', () => {
  it('(a) handoverTypes is the reveal’s own early return — an empty or motionless handover types nothing', async () => {
    const { handoverTypes } = await loadSlotBoard()
    const texts = ['첫 문장.', '둘째 문장.']
    expect(handoverTypes(texts, false)).toBe(true)
    // The two paths that return before a character is ever painted. Nothing is
    // typing on either, so nothing may be held on either.
    expect(handoverTypes([], false), 'an empty file is handed on empty').toBe(false)
    expect(handoverTypes(texts, true), 'reduced motion / the determinism gate').toBe(false)
    expect(handoverTypes([], true)).toBe(false)
  })

  it('(b) …and the reveal has no second copy of that condition', () => {
    const board = boardSource()
    const revealAt = board.indexOf('function revealHandover(')
    expect(revealAt, 'revealHandover is gone').toBeGreaterThan(-1)
    const body = board.slice(revealAt)
    const guardAt = body.indexOf('handoverTypes(')
    const armedAt = body.indexOf('reveal = { row: 0')
    expect(guardAt, 'revealHandover no longer asks handoverTypes').toBeGreaterThan(-1)
    expect(armedAt, 'the reveal no longer arms its cursor').toBeGreaterThan(-1)
    // The cursor is armed AFTER the predicate, so `reveal` — and therefore the
    // hold — is null on both early-return paths by construction.
    expect(guardAt).toBeLessThan(armedAt)
    expect(body.slice(0, armedAt), 'the early return re-states the condition instead of calling it').not.toMatch(
      /texts\.length === 0 \|\| motionless\(\)/,
    )
  })

  it('(c) the hold IS the reveal’s cursor — there is no latch to leave switched on', () => {
    const board = boardSource()
    // Derived, in one expression. A stored boolean would need an exit for every
    // way a reveal can end, and a gate stuck ON leaves the operator unable to
    // mine for the rest of the sitting.
    expect(board, 'isRevealing is no longer derived from the reveal cursor').toMatch(
      /isRevealing:\s*\(\)\s*=>\s*reveal !== null/,
    )
    expect(board, 'a second piece of state answers the hold').not.toMatch(
      /\b(?:revealing|holding|gated)\s*=\s*(?:true|false)/,
    )
    // Every end of a reveal runs `endReveal()`, and `endReveal` is the only place
    // the cursor is cleared: the last character and the watchdog both land through
    // `land()`, and a replaced reveal clears the old one on the way in.
    expect(board).toMatch(/function endReveal\(\)[\s\S]{0,200}reveal = null/)
    expect((board.match(/reveal = null/g) ?? []).length, 'the cursor is cleared outside endReveal()').toBe(1)
    expect(board).toMatch(/const land = \(\)[\s\S]{0,120}endReveal\(\)/)
    expect(board).toMatch(/function revealHandover\([\s\S]{0,80}?\{\s*endReveal\(\)/)
    // The watchdog's own exit is `land()` — the case where the driver's pump is
    // not running at all, and the one that must not be able to strand the hold.
    const watchAt = board.indexOf('const watch =')
    expect(board.slice(watchAt), 'the watchdog no longer lands the reveal').toMatch(/sinceTick > WATCHDOG_FRAMES[\s\S]{0,80}land\(\)/)
  })

  it('(d) the hold publishes ONE BIT — the reveal’s progress is still nobody’s business', async () => {
    const { planOps, SLOT_CAP } = await loadSlotBoard()
    const board = boardSource()
    // `isRevealing()` answers a boolean and nothing else: no row, no character
    // count, no percentage. The reveal is DRAWING state (see the note on `reveal`),
    // and the file holds what it holds throughout — which is why DEPLOY is not
    // gated and `cells()` is untouched.
    expect(board, 'cells() no longer answers the whole handover').toMatch(/cells:\s*\(\)\s*=>\s*\[\.\.\.slots\]/)
    expect(board, 'the board publishes the reveal’s progress').not.toMatch(
      /(?:revealRow|revealChars|revealProgress|isRevealing:\s*\(\)\s*=>\s*reveal[.?])/,
    )
    // …and no op reads it: the planner is pure and knows nothing of a reveal, so a
    // `deploy` mid-type still commits the whole file (u4 D1).
    expect(String(planOps)).not.toMatch(/reveal/)
    const plan = planOps({ slots: ['b-r2-f03', null, null, null], deployed: false }, { kind: 'deploy' })
    expect(plan.ops).toEqual([{ op: 'deploy', blocks: ['b-r2-f03'] }])
    expect(plan.slots).toHaveLength(SLOT_CAP)
  })

  it('(e) the AGENT FILE pushes nothing and waits on nothing — the reveal stays a drawing', () => {
    const win = windowSource()
    const at = win.indexOf('board.revealHandover()')
    expect(at, 'the settle no longer reveals the handover').toBeGreaterThan(-1)
    // No continuation: `revealHandover(onDone)` is deliberately un-passed here, so
    // nothing in the run loop is hostage to an animation (`typeCallsign`'s note).
    expect(win, 'the settle now waits on the reveal').not.toMatch(/board\.revealHandover\(\s*\(\)/)
    // And the window does not reach into REPORTS to tell it about the hold: the
    // board is asked, never told (C8).
    expect(win, 'the AGENT FILE pushes the hold at a sibling window').not.toMatch(/repaintMines|windows\/reports/)
  })
})
