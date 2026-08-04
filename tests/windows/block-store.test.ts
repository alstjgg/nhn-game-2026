// u4s — BLOCK STORE window: the model half (TDD RED, written before the build).
//
// SCOPE (unit-scoped, u4s): this suite reads only the three sources u4s owns —
// `windows/block-store.ts`, `components/species-filter.ts` and the ADDITIVE
// half of `components/block-card.ts` — plus the run-wide guards that name them.
//
// The suite runs under vitest `environment: 'node'` (u3/u4/u6 precedent, u4s
// design D0): **no DOM assert lives here** — every one of those is in
// `e2e/block-store.spec.ts`. `block-store.ts` therefore splits `pure core → DOM
// layer`, and only the core is imported below. Modules load through a dynamic
// `import()` off an absolute path (the `tests/windows/agent-file.test.ts`
// precedent) so a missing file fails one test with a readable message.
//
// Test titles are load-bearing — the unit's verification commands filter with
//   -t 'slot/unslot ops by id'   (c3)
//   -t 'no text-based identity'  (c4)
// Do not rename a describe without updating `.claude/super/units/u4s.md`.
//
// C3: nothing here asserts fixture CONTENT. The ids are the authored grammar
// `b-r<run>-<channel><nn>` that C3 itself freezes, and the Korean strings are
// design-target document art (`docs/design/phase2-ui/data.js` 29–36) or the
// spec-named empty-state copy — not fixture text.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { CLIENT, REPO, exists, importable, read, rel, stripComments } from '../shell/shell-utils.ts'
import type { MembraneOp, Sentence, Species } from '../../src/client/driver/index.ts'

/* ══ the three sources this unit owns ════════════════════════════════════ */

const COMPONENTS = path.join(CLIENT, 'components')
const BLOCK_STORE_TS = path.join(CLIENT, 'windows/block-store.ts')
const SPECIES_FILTER_TS = path.join(COMPONENTS, 'species-filter.ts')
const BLOCK_CARD_TS = path.join(COMPONENTS, 'block-card.ts')
/** u4's, and read-only to this unit (c7) — never in the owned list. */
const SLOT_BOARD_TS = path.join(COMPONENTS, 'slot-board.ts')

const U4S_SOURCES = [BLOCK_STORE_TS, SPECIES_FILTER_TS, BLOCK_CARD_TS]

/** `{ file, text }` for every u4s source on disk, comments stripped. */
function u4sSources(): { file: string; text: string }[] {
  return U4S_SOURCES.filter((f) => exists(f)).map((f) => ({ file: rel(f), text: stripComments(read(f)) }))
}

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' })
}

/* ══ the surfaces under test (u4s design.md §3) ══════════════════════════ */

type FilterKey = 'all' | Species

interface StoreBlock {
  id: string
  species: Species
  carried: boolean
}

interface SlotState {
  slots: readonly (string | null)[]
  deployed: boolean
}

type BlockCardState = 'in-store' | 'slotted' | 'at-cap' | 'archived'

interface StoreModelInput {
  mined: readonly string[]
  carried: readonly string[]
  resolve(id: string): Sentence | null
}

interface BlockStoreModule {
  buildStoreModel(input: StoreModelInput): StoreBlock[]
  visibleBlocks(blocks: readonly StoreBlock[], slots: readonly (string | null)[], filter: FilterKey): StoreBlock[]
  cardStateOf(block: StoreBlock, state: SlotState): BlockCardState
  canSlot(state: SlotState): boolean
  /** D1 — a thin wrapper over u4's `planOps`, never a second rule set. */
  slotOpFor(state: SlotState, id: string, slot: number): MembraneOp[]
  unslotOpFor(state: SlotState, id: string): MembraneOp[]
  mount: (host: HTMLElement, driver: unknown) => void
}

interface FilterOption {
  key: FilterKey
  ko: string
  mark: string
  count: number
}

interface SpeciesFilterModule {
  FILTER_ORDER: readonly FilterKey[]
  filterOptions(blocks: readonly { species: Species }[]): FilterOption[]
  buildSpeciesFilter: unknown
}

type SlotAction =
  | { kind: 'place'; blockId: string; slot: number }
  | { kind: 'clear'; slot: number }
  | { kind: 'deploy' }

interface SlotBoardModule {
  SLOT_CAP: number
  planOps(state: SlotState, action: SlotAction): { ops: MembraneOp[]; slots: (string | null)[]; deployed: boolean }
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
  /** u4's surface — must survive this unit untouched (c7). */
  SPECIES_DISPLAY: Readonly<Record<Species, { ko: string; mark: string; cls: string }>>
  UNRESOLVED_TEXT: string
  pad2(value: number): string
  blockCardModel(id: string, sentence: Sentence | null): BlockCardModel
  buildBlockCard: unknown
  pickedBlockId(): string | null
  setPickedBlockId(id: string | null): void
  subscribePick(cb: (id: string | null) => void): () => void
  /** u4s' additive export. */
  buildStoreCard: unknown
}

const loadStore = async (): Promise<BlockStoreModule> =>
  (await import(importable(BLOCK_STORE_TS))) as unknown as BlockStoreModule
const loadFilter = async (): Promise<SpeciesFilterModule> =>
  (await import(importable(SPECIES_FILTER_TS))) as unknown as SpeciesFilterModule
const loadBoard = async (): Promise<SlotBoardModule> =>
  (await import(importable(SLOT_BOARD_TS))) as unknown as SlotBoardModule
const loadCard = async (): Promise<BlockCardModule> =>
  (await import(importable(BLOCK_CARD_TS))) as unknown as BlockCardModule

/* ══ fixtures — authored ids only, no fixture content (C3) ═══════════════ */

const MINED = ['b-r3-f01', 'b-r3-n02', 'b-r3-u04'] as const
const CARRIED = ['b-r2-f03', 'b-r2-b03', 'b-r1-q05'] as const

const sentence = (id: string, text: string, species: Species): Sentence => ({ id, text, species })

/** Resolves the mined ids only — carried ids arrive as bare ids (u4 F1). */
const RESOLVED: Readonly<Record<string, Sentence>> = {
  'b-r3-f01': sentence('b-r3-f01', '기록된 한 문장.', 'fact'),
  'b-r3-n02': sentence('b-r3-n02', '기록된 한 문장.', 'emotion'),
  'b-r3-u04': sentence('b-r3-u04', '기록된 한 문장.', 'quote'),
}

const input = (over: Partial<StoreModelInput> = {}): StoreModelInput => ({
  mined: [...MINED],
  carried: [...CARRIED],
  resolve: (id) => RESOLVED[id] ?? null,
  ...over,
})

const state = (slots: (string | null)[], deployed = false): SlotState => ({ slots, deployed })
const ids = (blocks: readonly StoreBlock[]): string[] => blocks.map((b) => b.id)
const byId = (blocks: readonly StoreBlock[], id: string): StoreBlock => {
  const found = blocks.find((b) => b.id === id)
  expect(found, `the model carries no block for ${id}`).toBeTruthy()
  return found!
}

/* ══ [u4s#c1] the store model — membership · order · species ═════════════ */

describe('[u4s#c1] store model — membership, order and species', () => {
  it('(a) holds the union of mined and carried, once each', async () => {
    const { buildStoreModel } = await loadStore()
    const blocks = buildStoreModel(input())

    expect(new Set(ids(blocks))).toEqual(new Set([...MINED, ...CARRIED]))
    expect(ids(blocks)).toHaveLength(MINED.length + CARRIED.length)
  })

  it('(b) an id that is both mined and carried appears exactly once', async () => {
    const { buildStoreModel } = await loadStore()
    const blocks = buildStoreModel(input({ mined: ['b-r2-f03', ...MINED] }))

    expect(ids(blocks).filter((id) => id === 'b-r2-f03')).toHaveLength(1)
    expect(new Set(ids(blocks)).size).toBe(ids(blocks).length)
  })

  it('(c) each source keeps its own order — mined in mining order, carried in meta order', async () => {
    const { buildStoreModel } = await loadStore()
    const blocks = buildStoreModel(input())
    const order = ids(blocks)
    const keep = (subset: readonly string[]): string[] => order.filter((id) => subset.includes(id))

    expect(keep(MINED)).toEqual([...MINED])
    expect(keep(CARRIED)).toEqual([...CARRIED])
  })

  it('(d) species is the card model\'s, derived from the id channel — never from the text', async () => {
    const { buildStoreModel } = await loadStore()
    const { blockCardModel } = await loadCard()
    const blocks = buildStoreModel(input())

    for (const block of blocks) {
      const model = blockCardModel(block.id, input().resolve(block.id))
      expect(block.species, `${block.id} disagrees with blockCardModel`).toBe(model.species)
    }
    // The unresolved carried ids can only have come from their channel.
    expect(byId(blocks, 'b-r2-f03').species).toBe('fact')
    expect(byId(blocks, 'b-r2-b03').species).toBe('selfnarr')
    expect(byId(blocks, 'b-r1-q05').species).toBe('quote')
    expect(byId(blocks, 'b-r3-n02').species).toBe('emotion')
  })

  it('(e) an id that resolves to nothing still becomes a block (u4 F1)', async () => {
    const { buildStoreModel } = await loadStore()
    const blocks = buildStoreModel(input({ resolve: () => null }))

    expect(ids(blocks)).toHaveLength(MINED.length + CARRIED.length)
    expect(byId(blocks, 'b-r3-u04').species).toBe('quote')
  })

  it('(f) `carried` marks the ids the run opened holding, and only those', async () => {
    const { buildStoreModel } = await loadStore()
    const blocks = buildStoreModel(input())

    expect(blocks.filter((b) => b.carried).map((b) => b.id).sort()).toEqual([...CARRIED].sort())
    expect(blocks.filter((b) => !b.carried).map((b) => b.id).sort()).toEqual([...MINED].sort())
  })

  it('(g) an empty seam yields an empty deck, not a throw', async () => {
    const { buildStoreModel } = await loadStore()
    expect(buildStoreModel(input({ mined: [], carried: [] }))).toEqual([])
  })

  it('(h) the model is pure — a frozen input survives the call unchanged', async () => {
    const { buildStoreModel } = await loadStore()
    const mined = Object.freeze([...MINED])
    const carried = Object.freeze([...CARRIED])
    buildStoreModel(input({ mined, carried }))

    expect(mined).toEqual([...MINED])
    expect(carried).toEqual([...CARRIED])
  })
})

/* ══ [u4s#c1] the visible deck and the filter vocabulary ═════════════════ */

describe('[u4s#c1] visible deck and species filter', () => {
  it('(a) a slotted id leaves the deck — the store never shows the same block twice', async () => {
    const { buildStoreModel, visibleBlocks } = await loadStore()
    const blocks = buildStoreModel(input())
    const shown = visibleBlocks(blocks, ['b-r2-f03', null, null, null], 'all')

    expect(ids(shown)).not.toContain('b-r2-f03')
    expect(ids(shown)).toHaveLength(blocks.length - 1)
  })

  it('(b) `all` keeps model order', async () => {
    const { buildStoreModel, visibleBlocks } = await loadStore()
    const blocks = buildStoreModel(input())

    expect(ids(visibleBlocks(blocks, [null, null, null, null], 'all'))).toEqual(ids(blocks))
  })

  it('(c) a species filter shows that species and nothing else', async () => {
    const { buildStoreModel, visibleBlocks } = await loadStore()
    const blocks = buildStoreModel(input())

    for (const species of ['fact', 'selfnarr', 'emotion', 'quote'] as const) {
      const shown = visibleBlocks(blocks, [null, null, null, null], species)
      expect(shown.every((b) => b.species === species), `${species} leaked another species`).toBe(true)
      expect(ids(shown)).toEqual(ids(blocks.filter((b) => b.species === species)))
    }
  })

  it('(d) a filter that matches nothing returns an empty deck (the empty state\'s other cause)', async () => {
    const { buildStoreModel, visibleBlocks } = await loadStore()
    const blocks = buildStoreModel(input({ mined: ['b-r3-f01'], carried: [] }))

    expect(visibleBlocks(blocks, [null, null, null, null], 'emotion')).toEqual([])
  })

  it('(e) the filter offers 전체 plus the four species, in the design-target order', async () => {
    const { FILTER_ORDER, filterOptions } = await loadFilter()
    const { SPECIES_DISPLAY } = await loadCard()

    expect([...FILTER_ORDER]).toEqual(['all', 'fact', 'selfnarr', 'emotion', 'quote'])

    const options = filterOptions([])
    expect(options.map((o) => o.key)).toEqual([...FILTER_ORDER])
    expect(options[0]).toMatchObject({ key: 'all', ko: '전체', mark: '▤', count: 0 })
    for (const option of options.slice(1)) {
      const display = SPECIES_DISPLAY[option.key as Species]
      expect(option.ko, `${option.key} label drifted from u4's SPECIES_DISPLAY`).toBe(display.ko)
      expect(option.mark, `${option.key} mark drifted from u4's SPECIES_DISPLAY`).toBe(display.mark)
    }
  })

  it('(f) counts are taken over the whole set — a slotted block still counts', async () => {
    const { buildStoreModel } = await loadStore()
    const { filterOptions } = await loadFilter()
    const blocks = buildStoreModel(input())
    const counts = Object.fromEntries(filterOptions(blocks).map((o) => [o.key, o.count]))

    expect(counts['all']).toBe(blocks.length)
    expect(counts['fact']).toBe(2)
    expect(counts['selfnarr']).toBe(1)
    expect(counts['emotion']).toBe(1)
    expect(counts['quote']).toBe(2)
    // The count input is the model, not the visible deck: nothing about slots
    // may change it.
    expect(filterOptions(blocks).map((o) => o.count)).toEqual(Object.values(counts))
  })
})

/* ══ [u4s#c2] the four card states, decided once ═════════════════════════ */

describe('[u4s#c2] card states — in-store · slotted · at-cap · archived', () => {
  it('(a) a block sitting in a slot is `slotted`, whatever else is true of it', async () => {
    const { buildStoreModel, cardStateOf } = await loadStore()
    const blocks = buildStoreModel(input())
    const full = state(['b-r2-f03', 'b-r3-f01', 'b-r3-n02', 'b-r3-u04'])

    expect(cardStateOf(byId(blocks, 'b-r2-f03'), full)).toBe('slotted')
    expect(cardStateOf(byId(blocks, 'b-r3-f01'), full)).toBe('slotted')
  })

  it('(b) a full board puts every other card at-cap', async () => {
    const { buildStoreModel, cardStateOf } = await loadStore()
    const blocks = buildStoreModel(input())
    const full = state(['b-r3-f01', 'b-r3-n02', 'b-r3-u04', 'b-r1-q05'])

    expect(cardStateOf(byId(blocks, 'b-r2-f03'), full)).toBe('at-cap')
    // Precedence: a board that cannot take the card outranks the archive mark.
    expect(cardStateOf(byId(blocks, 'b-r2-b03'), full)).toBe('at-cap')
  })

  it('(c) a carried block that could still be slotted is `archived`', async () => {
    const { buildStoreModel, cardStateOf } = await loadStore()
    const blocks = buildStoreModel(input())

    expect(cardStateOf(byId(blocks, 'b-r2-b03'), state([null, null, null, null]))).toBe('archived')
  })

  it('(d) a block mined in this run, on an open board, is plain `in-store`', async () => {
    const { buildStoreModel, cardStateOf } = await loadStore()
    const blocks = buildStoreModel(input())

    expect(cardStateOf(byId(blocks, 'b-r3-f01'), state([null, null, null, null]))).toBe('in-store')
    expect(cardStateOf(byId(blocks, 'b-r3-f01'), state(['b-r3-n02', null, null, null]))).toBe('in-store')
  })

  it('(e) a deployed file puts the deck at-cap too — nothing is operable', async () => {
    const { buildStoreModel, cardStateOf } = await loadStore()
    const blocks = buildStoreModel(input())
    const locked = state(['b-r3-f01', null, null, null], true)

    expect(cardStateOf(byId(blocks, 'b-r3-n02'), locked)).toBe('at-cap')
    expect(cardStateOf(byId(blocks, 'b-r3-f01'), locked)).toBe('slotted')
  })

  it('(f) canSlot is false when the file is locked or the board is full, true otherwise', async () => {
    const { canSlot } = await loadStore()
    const { SLOT_CAP } = await loadBoard()

    expect(SLOT_CAP).toBe(4)
    expect(canSlot(state([null, null, null, null]))).toBe(true)
    expect(canSlot(state(['b-r3-f01', null, null, null]))).toBe(true)
    expect(canSlot(state(['b-r3-f01', 'b-r3-n02', 'b-r3-u04', 'b-r1-q05']))).toBe(false)
    expect(canSlot(state([null, null, null, null], true))).toBe(false)
    expect(canSlot(state(['b-r3-f01', null, null, null], true))).toBe(false)
  })
})

/* ══ [u4s#c3] the membrane ops, by id ════════════════════════════════════ */

describe('[u4s#c3] slot/unslot ops by id', () => {
  it('(a) slotting an empty seat emits exactly one {op:slot, block_id, slot}', async () => {
    const { slotOpFor } = await loadStore()

    expect(slotOpFor(state([null, null, null, null]), 'b-r3-f01', 2)).toEqual([
      { op: 'slot', block_id: 'b-r3-f01', slot: 2 },
    ])
  })

  it('(b) unslotting emits exactly one {op:unslot, slot} for the seat the id holds', async () => {
    const { unslotOpFor } = await loadStore()

    expect(unslotOpFor(state([null, 'b-r3-f01', null, null]), 'b-r3-f01')).toEqual([
      { op: 'unslot', slot: 1 },
    ])
  })

  it('(c) unslotting an id no slot holds is a no-op — zero ops', async () => {
    const { unslotOpFor } = await loadStore()

    expect(unslotOpFor(state([null, null, null, null]), 'b-r3-f01')).toEqual([])
    expect(unslotOpFor(state(['b-r3-n02', null, null, null]), 'b-r3-f01')).toEqual([])
  })

  it('(d) a deployed file absorbs everything — both helpers emit nothing', async () => {
    const { slotOpFor, unslotOpFor } = await loadStore()
    const locked = state(['b-r3-f01', null, null, null], true)

    expect(slotOpFor(locked, 'b-r3-n02', 1)).toEqual([])
    expect(unslotOpFor(locked, 'b-r3-f01')).toEqual([])
  })

  it('(e) both helpers delegate to u4\'s planOps — no second rule set (design D1)', async () => {
    const { slotOpFor, unslotOpFor } = await loadStore()
    const { planOps } = await loadBoard()

    const cases: SlotState[] = [
      state([null, null, null, null]),
      state(['b-r3-f01', null, null, null]),
      state(['b-r3-f01', 'b-r3-n02', null, null]),
      state(['b-r3-f01', 'b-r3-n02', 'b-r3-u04', 'b-r1-q05']),
    ]
    for (const current of cases) {
      for (let slot = 0; slot < 4; slot += 1) {
        expect(slotOpFor(current, 'b-r2-f03', slot)).toEqual(
          planOps(current, { kind: 'place', blockId: 'b-r2-f03', slot }).ops,
        )
      }
      for (const id of ['b-r3-f01', 'b-r3-n02', 'b-r2-f03']) {
        const seat = current.slots.indexOf(id)
        const expected = seat < 0 ? [] : planOps(current, { kind: 'clear', slot: seat }).ops
        expect(unslotOpFor(current, id)).toEqual(expected)
      }
    }
  })

  it('(f) an out-of-range seat emits nothing', async () => {
    const { slotOpFor } = await loadStore()

    expect(slotOpFor(state([null, null, null, null]), 'b-r3-f01', -1)).toEqual([])
    expect(slotOpFor(state([null, null, null, null]), 'b-r3-f01', 4)).toEqual([])
  })

  it('(g) the helpers are pure — they send nothing and mutate nothing', async () => {
    const { slotOpFor, unslotOpFor } = await loadStore()
    const slots = Object.freeze(['b-r3-f01', null, null, null]) as readonly (string | null)[]
    const current: SlotState = { slots, deployed: false }

    expect(() => slotOpFor(current, 'b-r3-n02', 1)).not.toThrow()
    expect(() => unslotOpFor(current, 'b-r3-f01')).not.toThrow()
    expect([...slots]).toEqual(['b-r3-f01', null, null, null])
  })

  it('(h) the same input yields deep-equal, non-shared op arrays (drag path === click path)', async () => {
    const { slotOpFor, unslotOpFor } = await loadStore()
    const open = state([null, 'b-r3-n02', null, null])

    const dragged = slotOpFor(open, 'b-r3-f01', 0)
    const clicked = slotOpFor(open, 'b-r3-f01', 0)
    expect(dragged).toEqual(clicked)
    expect(dragged).not.toBe(clicked)

    const droppedBack = unslotOpFor(open, 'b-r3-n02')
    const clickedOff = unslotOpFor(open, 'b-r3-n02')
    expect(droppedBack).toEqual(clickedOff)
    expect(droppedBack).not.toBe(clickedOff)
  })

  it('(i) SLOT_CAP is imported from u4, never re-declared (design X3)', () => {
    for (const { file, text } of u4sSources()) {
      if (file.endsWith('block-card.ts')) continue
      expect(text, `${file} re-declares the slot cap`).not.toMatch(/\b(?:const|let|var)\s+SLOT_CAP\b/)
    }
    const store = u4sSources().find((s) => s.file.endsWith('block-store.ts'))
    expect(store, 'block-store.ts is not on disk').toBeTruthy()
    if (store!.text.includes('SLOT_CAP')) {
      expect(store!.text).toMatch(/import\s*\{[^}]*SLOT_CAP[^}]*\}\s*from\s*['"][^'"]*slot-board\.ts['"]/)
    }
  })
})

/* ══ [u4s#c4] identity is the id, never the text ═════════════════════════ */

describe('[u4s#c4] no text-based identity', () => {
  it('(a) two blocks with byte-identical text stay two blocks, keyed by id', async () => {
    const { buildStoreModel, visibleBlocks } = await loadStore()
    const twins = ['b-r3-f01', 'b-r3-f02']
    const same = '같은 문장, 다른 출처.'
    const blocks = buildStoreModel({
      mined: twins,
      carried: [],
      resolve: (id) => sentence(id, same, 'fact'),
    })

    expect(ids(blocks)).toEqual(twins)
    expect(ids(visibleBlocks(blocks, ['b-r3-f01', null, null, null], 'all'))).toEqual(['b-r3-f02'])
  })

  it('(b) slotting the second twin carries the SECOND id (spec-client §3 inv 3)', async () => {
    const { slotOpFor, unslotOpFor } = await loadStore()

    expect(slotOpFor(state([null, null, null, null]), 'b-r3-f02', 0)).toEqual([
      { op: 'slot', block_id: 'b-r3-f02', slot: 0 },
    ])
    // …and the twin already seated is untouched by the other's unslot.
    expect(unslotOpFor(state(['b-r3-f01', 'b-r3-f02', null, null]), 'b-r3-f02')).toEqual([
      { op: 'unslot', slot: 1 },
    ])
  })

  it('(c) filtering reads the species field, never the text', async () => {
    const { buildStoreModel, visibleBlocks } = await loadStore()
    const blocks = buildStoreModel({
      mined: ['b-r3-f01', 'b-r3-n02'],
      carried: [],
      // The fact block's text NAMES the emotion species; the filter must not care.
      resolve: (id) => sentence(id, '감정 인용 자기서술', id.includes('-f') ? 'fact' : 'emotion'),
    })

    expect(ids(visibleBlocks(blocks, [null, null, null, null], 'emotion'))).toEqual(['b-r3-n02'])
    expect(ids(visibleBlocks(blocks, [null, null, null, null], 'fact'))).toEqual(['b-r3-f01'])
  })

  it('(d) no owned source ever READS textContent, innerText or nodeValue', () => {
    const sources = u4sSources()
    expect(sources.length, 'no u4s source is on disk').toBeGreaterThan(0)

    for (const { file, text } of sources) {
      expect(text, `${file} reads innerText`).not.toMatch(/\binnerText\b/)
      expect(text, `${file} reads nodeValue`).not.toMatch(/\bnodeValue\b/)
      expect(text, `${file} compares against textContent`).not.toMatch(
        /textContent\s*(?:===|!==|==|\.trim|\.includes|\.indexOf|\.startsWith)/,
      )
      expect(text, `${file} searches by textContent`).not.toMatch(
        /(?:indexOf|find|filter|includes|some)\s*\([^)]*textContent/,
      )
      // Any use that is not a plain write (`node.textContent = …`).
      expect(text, `${file} reads textContent into an expression`).not.toMatch(
        /[=(,[]\s*[A-Za-z_$][\w$.]*\.textContent\b(?!\s*=[^=])/,
      )
    }
  })

  it('(e) the drag payload is the authored id — nothing puts text on the wire', () => {
    for (const { file, text } of u4sSources()) {
      // Group 1 is everything after the MIME argument — the payload itself.
      for (const call of text.matchAll(/setData\(\s*['"][^'"]*['"]\s*,\s*([^)]*)\)/g)) {
        const payload = call[1] ?? ''
        expect(payload, `${file} puts a non-id payload on the drag channel`).toMatch(/\bid\b/i)
        expect(payload, `${file} puts sentence text on the drag channel`).not.toMatch(
          /\b(?:text|textContent|ko|label)\b/,
        )
      }
    }
  })
})

/* ══ [u4s#c7] u4's files are extended, never rewritten ═══════════════════ */

describe('[u4s#c7] u4 stays merged — block-card is additive, slot-board untouched', () => {
  it('(a) slot-board.ts is not modified by this unit', () => {
    expect(git('diff', '--name-only', 'HEAD', '--', rel(SLOT_BOARD_TS)).trim()).toBe('')
  })

  it('(b) block-card.ts changes are pure additions — no line is removed', () => {
    const diff = git('diff', '-U0', 'HEAD', '--', rel(BLOCK_CARD_TS))
    const removed = diff
      .split('\n')
      .filter((line) => line.startsWith('-') && !line.startsWith('---'))
    expect(removed, `block-card.ts removes lines: ${removed.join(' | ')}`).toEqual([])
  })

  it('(c) every u4 export on block-card.ts still exists and still behaves', async () => {
    const card = await loadCard()

    expect(typeof card.blockCardModel).toBe('function')
    expect(typeof card.buildBlockCard).toBe('function')
    expect(card.pad2(3)).toBe('03')
    expect(Object.keys(card.SPECIES_DISPLAY).sort()).toEqual(['emotion', 'fact', 'quote', 'selfnarr'])
    expect(card.blockCardModel('b-r2-f03', null)).toMatchObject({
      id: 'b-r2-f03',
      species: 'fact',
      run: 2,
      text: card.UNRESOLVED_TEXT,
    })

    const seen: (string | null)[] = []
    const off = card.subscribePick((id) => seen.push(id))
    card.setPickedBlockId('b-r3-f01')
    expect(card.pickedBlockId()).toBe('b-r3-f01')
    card.setPickedBlockId(null)
    off()
    card.setPickedBlockId('b-r3-n02')
    card.setPickedBlockId(null)
    expect(seen).toEqual(['b-r3-f01', null])
  })

  it('(d) block-card.ts exports the store-card decorator this unit adds', async () => {
    const card = await loadCard()
    expect(typeof card.buildStoreCard, 'buildStoreCard is not exported').toBe('function')
    expect((card.buildStoreCard as (...a: unknown[]) => unknown).length).toBe(2)
  })

  it('(e) the store window never emits a membrane op itself — it drives u4\'s board', () => {
    const store = u4sSources().find((s) => s.file.endsWith('block-store.ts'))
    expect(store, 'block-store.ts is not on disk').toBeTruthy()
    expect(store!.text, 'the store sends ops behind the board\'s back (design X2)').not.toMatch(
      /driver\.send\s*\(\s*\{\s*op\s*:\s*['"](?:slot|unslot)['"]/,
    )
    expect(store!.text).toMatch(/getSlotBoard|place\s*\(|clear\s*\(/)
  })
})

/* ══ [u4s#c8] the run-wide hard constraints, on this unit's sources ══════ */

describe('[u4s#c8] run-wide hard constraints hold for u4s', () => {
  it('(a) all three owned sources are on disk', () => {
    for (const file of U4S_SOURCES) expect(exists(file), `${rel(file)} is missing`).toBe(true)
  })

  it('(b) the window keeps u3\'s mount(host, driver) signature', async () => {
    const { mount } = await loadStore()
    expect(typeof mount).toBe('function')
    expect(mount.length).toBe(2)
  })

  it('(c) C8/inv 12 — nothing imports engine or composer, the seam is the barrel', () => {
    for (const { file, text } of u4sSources()) {
      expect(text, `${file} imports engine/composer`).not.toMatch(/from\s*['"][^'"]*(?:engine|composer)/)
      for (const spec of text.match(/from\s*['"]([^'"]*driver[^'"]*)['"]/g) ?? []) {
        expect(spec, `${file} reaches into driver/ past the barrel`).toMatch(/driver\/index\.ts/)
      }
    }
  })

  it('(d) C10/inv 1 — no <input>, no contenteditable, no free-text surface', () => {
    for (const { file, text } of u4sSources()) {
      expect(text, `${file} creates an input`).not.toMatch(/createElement\(\s*['"](?:input|textarea)['"]/)
      expect(text, `${file} names contenteditable`).not.toMatch(/contenteditable/i)
      expect(text, `${file} builds an input`).not.toMatch(/\bel\(\s*['"](?:input|textarea)['"]/)
    }
  })

  it('(e) C4 — meta-state is sessionStorage; localStorage appears nowhere', () => {
    for (const { file, text } of u4sSources()) {
      expect(text, `${file} uses localStorage`).not.toMatch(/localStorage/)
    }
  })

  it('(f) C11/inv 8 — no colour, size or font literal outside tokens.css', () => {
    for (const { file, text } of u4sSources()) {
      expect(text, `${file} carries a hex colour`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(text, `${file} carries a colour function`).not.toMatch(/\b(?:rgba?|hsla?)\s*\(/)
      expect(text, `${file} carries a px/rem literal`).not.toMatch(/['"`]\s*-?\d+(?:\.\d+)?(?:px|rem|em|pt)\b/)
      expect(text, `${file} writes an inline style`).not.toMatch(
        /\.style\.(?:color|background|backgroundColor|font|fontSize|width|height|padding|margin|border)\b/,
      )
    }
  })

  it('(g) C13 — segment.ts and species.ts are consumed, never modified', () => {
    const touched = git('diff', '--name-only', 'HEAD', '--', 'src/shared/segment.ts', 'src/shared/species.ts')
    expect(touched.trim()).toBe('')
  })

  it('(h) C2/inv 9 — the toolchain stays devDeps-only, zero runtime deps', () => {
    const pkg = JSON.parse(read(path.join(REPO, 'package.json'))) as { dependencies?: Record<string, string> }
    expect(pkg.dependencies ?? {}).toEqual({})
  })

  it('(i) the window imports no sibling window and no fixture module', () => {
    const store = u4sSources().find((s) => s.file.endsWith('block-store.ts'))
    expect(store, 'block-store.ts is not on disk').toBeTruthy()
    for (const spec of store!.text.match(/from\s*['"]([^'"]+)['"]/g) ?? []) {
      expect(spec, 'the store imports a sibling window').not.toMatch(
        /windows\/(?:live-feed|agent-file|reports|tally)/,
      )
      expect(spec, 'the store imports a fixture module').not.toMatch(/driver\/fixtures/)
    }
  })

  it('(j) no owned source touches the DOM at module scope (D0 — node can import it)', () => {
    for (const { file, text } of u4sSources()) {
      const topLevel = text
        .split('\n')
        .filter((line) => /^(?:const|let|var|document|window)\b/.test(line))
        .join('\n')
      expect(topLevel, `${file} touches the DOM at module scope`).not.toMatch(/\bdocument\.|\bwindow\./)
    }
  })
})
