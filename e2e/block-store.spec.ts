// u4s — BLOCK STORE window: the rendered deck (TDD RED, written before the build).
//
// vitest runs `environment: 'node'`, so everything that needs a real document
// lives here (u4s design D0). The pure half is `tests/windows/block-store.test.ts`.
//
// Covers [u4s#c1] store states (empty · populated · filtered) · [u4s#c2] the
// four BlockCard states · [u4s#c3] drag/click slotting and drop-to-unslot ·
// [u4s#c5] a11y.
//
// Test titles are load-bearing — the unit's verification commands filter with
// `-g 'store states'`, `-g 'card states'` and `-g 'a11y'`. The slotting block is
// named `slotting` and is covered by the c6 full-file run. Do not rename a
// describe without updating `.claude/super/units/u4s.md`.
//
// C3 (placeholder fixtures retired): NOTHING here asserts fixture CONTENT.
// Membership is read back out of the driver's own stream through
// `window.__shell.frame()`, so the suite binds to whatever run the shell boots.
// The only literals are the authored id grammar (which C3 freezes), the
// design-target species vocabulary (`docs/design/phase2-ui/data.js` 29–36) and
// the spec-named empty-state copy.
//
// It must pass against BOTH servers (dev today, `npm run preview` once the
// config is re-pointed per C5) — nothing below assumes a dev server, but a run
// whose stream carries no blocks at all is reported as such rather than passing
// vacuously.
import { expect, test } from 'playwright/test'
import { raiseWindow } from './fixtures/harness.ts'
import type { Locator, Page } from 'playwright/test'

/* ── seam shapes this suite reads back ───────────────────────────────────── */

interface Sentence {
  id: string
  text: string
  species: string
  axis?: string
}

interface MetaEvent {
  type: 'meta'
  run: number
  carried: string[]
}

interface ReportEvent {
  type: 'report'
  round: number
  facts: Sentence[]
  report_body: Sentence[]
}

interface Frame {
  events: { type: string; [k: string]: unknown }[]
  store: { mined: string[]; slots: Record<number, string>; deployed: string[] }
}

interface Handles {
  __shell?: { frame(): Frame; drain(): void }
  __agentFile?: {
    slots(): (string | null)[]
    place(id: string, slot: number): void
    clear(slot: number): void
    deployed(): boolean
    pick(id: string | null): void
  }
  __pointerEvents?: number
}

/* ── selectors ───────────────────────────────────────────────────────────── */

const STORE = '#w-store'
const BODY = `${STORE} .win-body`
const FILTER = `${STORE} #storeFilter`
const LIST = `${STORE} #storeList`
const EMPTY = `${STORE} #storeEmpty`
const CARD = `${LIST} .bcard`
const FILE = '#w-file'
const SLOT = `${FILE} .slot`
const REP = '#w-rep'

const EMPTY_COPY = '아직 채굴한 문장이 없습니다.'
const CAP = 4

/** The design-target vocabulary — `전체` first, then the four species in order. */
const FILTERS = [
  { key: 'all', ko: '전체', mark: '▤' },
  { key: 'fact', ko: '사실', mark: '■' },
  { key: 'selfnarr', ko: '자기서술', mark: '◇' },
  { key: 'emotion', ko: '감정', mark: '●' },
  { key: 'quote', ko: '인용', mark: '❝' },
] as const

/** The ratified channel→species map (`src/shared/species.ts`), id-derived. */
const CHANNEL_SPECIES: Record<string, string> = {
  f: 'fact',
  b: 'selfnarr',
  n: 'emotion',
  q: 'quote',
  u: 'quote',
}

const AUTHORED_ID = /^b-r\d+-([a-z])\d+$/

/* ── shell handles ───────────────────────────────────────────────────────── */

async function frame(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const handle = (window as unknown as Handles).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    return handle.frame()
  })
}

async function drain(page: Page): Promise<void> {
  await page.evaluate(() => {
    const handle = (window as unknown as Handles).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    handle.drain()
  })
}

async function place(page: Page, id: string, slot: number): Promise<void> {
  await page.evaluate(
    ({ id: blockId, slot: index }) => {
      const handle = (window as unknown as Handles).__agentFile
      if (!handle) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
      handle.place(blockId, index)
    },
    { id, slot },
  )
}

/** Boot the desk and wait until the BLOCK STORE has dealt its opening deck. */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator(STORE)).toBeVisible()
  await expect(page.locator(FILTER)).toHaveCount(1)
  await expect(page.locator(LIST)).toHaveCount(1)
  await expect(page.locator(EMPTY)).toHaveCount(1)
  await page.waitForFunction(() => (window as unknown as Handles).__agentFile !== undefined)
}

/* ── the deck, as the seam and as the screen ─────────────────────────────── */

function metaOf(f: Frame): MetaEvent | null {
  const metas = f.events.filter((e) => e.type === 'meta') as unknown as MetaEvent[]
  return metas.length > 0 ? (metas[metas.length - 1] ?? null) : null
}

function reportsOf(f: Frame): ReportEvent[] {
  return f.events.filter((e) => e.type === 'report') as unknown as ReportEvent[]
}

/** Every id the store should hold right now: carried ∪ mined, no duplicates. */
function membership(f: Frame): string[] {
  const carried = metaOf(f)?.carried ?? []
  return [...new Set([...carried, ...f.store.mined])]
}

function slottedIds(f: Frame): string[] {
  return Object.values(f.store.slots).filter((id) => typeof id === 'string' && id.length > 0)
}

/** Species by the same rule the client uses: the sentence's, else the channel's. */
function speciesOf(id: string, sentences: Map<string, Sentence>): string {
  const known = sentences.get(id)
  if (known) return known.species
  const channel = AUTHORED_ID.exec(id)?.[1] ?? ''
  return CHANNEL_SPECIES[channel] ?? 'fact'
}

function sentenceIndex(f: Frame): Map<string, Sentence> {
  const index = new Map<string, Sentence>()
  for (const report of reportsOf(f)) {
    for (const s of [...report.facts, ...report.report_body]) index.set(s.id, s)
  }
  return index
}

/** The ids the deck currently shows, in DOM order. */
async function deckIds(page: Page): Promise<string[]> {
  return page.locator(CARD).evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.block ?? ''))
}

function card(page: Page, id: string): Locator {
  return page.locator(`${LIST} .bcard[data-block="${id}"]`)
}

function filterButton(page: Page, ko: string): Locator {
  return page.locator(`${FILTER} button`, { hasText: ko })
}

/** `전체 9` → 9. The count is the trailing number the reference prints. */
async function filterCounts(page: Page): Promise<Record<string, number>> {
  const labels = await page.locator(`${FILTER} button`).allInnerTexts()
  const counts: Record<string, number> = {}
  for (const [index, label] of labels.entries()) {
    const digits = label.match(/(\d+)\s*$/)
    expect(digits, `filter button ${index} prints no count: ${label}`).not.toBeNull()
    counts[FILTERS[index]!.key] = Number(digits![1])
  }
  return counts
}

/** A synthetic HTML5 drag from a real card, through the card's own dragstart. */
async function dragCardTo(page: Page, id: string, target: string): Promise<string> {
  return page.evaluate(
    ({ id: blockId, target: selector }) => {
      const source = document.querySelector<HTMLElement>(`.bcard[data-block="${blockId}"]`)
      const drop = document.querySelector<HTMLElement>(selector)
      if (!source) throw new Error(`no card on screen for ${blockId}`)
      if (!drop) throw new Error(`no drop target for ${selector}`)
      const data = new DataTransfer()
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
      const payload = data.getData('text/plain')
      drop.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
      drop.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
      return payload
    },
    { id, target },
  )
}

/**
 * A drop carrying `id` onto `target`. Used for the slot→store direction: the
 * in-slot card is u4's DOM and carries no dragstart of its own (design D6), so
 * the payload is put on the wire here instead of being read off a card.
 */
async function dropOn(page: Page, id: string, target: string): Promise<void> {
  await page.evaluate(
    ({ id: blockId, target: selector }) => {
      const drop = document.querySelector<HTMLElement>(selector)
      if (!drop) throw new Error(`no drop target for ${selector}`)
      const data = new DataTransfer()
      data.setData('text/plain', blockId)
      drop.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
      drop.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    },
    { id, target },
  )
}

/** Mine one report sentence through the REPORTS window, and return its id. */
async function mineOne(page: Page): Promise<string> {
  // DRAIN FIRST, focus second. `driver.drain()` releases the whole remaining
  // stream — `run_end` included — so TALLY opens as a floating sheet. Raising
  // REPORTS before the drain therefore left the sheet on top of it, and the
  // sentence click below was intercepted:
  //
  //   <div class="tly-head">…</div> from <section id="w-tally" …> subtree
  //   intercepts pointer events
  //
  // It surfaced as a FLAKE rather than a failure because whether the sheet
  // covered the one sentence this helper picks depended on where that sentence
  // sat. Focusing after the drain raises REPORTS above the sheet for good, which
  // is the window manager doing exactly what a bar click asks of it.
  await drain(page)

  // `drain()` opens TALLY over the desk; REPORTS has to be raised from the
  // taskbar before the sentence click, or the sheet intercepts it.
  await raiseWindow(page, 'rep')

  const f = await frame(page)
  const held = new Set(membership(f))
  const candidate = reportsOf(f)
    .flatMap((r) => [...r.facts, ...r.report_body])
    .find((s) => !held.has(s.id))
  expect(candidate, 'the stream carries no unmined sentence — nothing to mine').toBeTruthy()
  await page.locator(`${REP} [data-sentence-id="${candidate!.id}"]`).first().click()
  await expect
    .poll(async () => (await frame(page)).store.mined)
    .toContain(candidate!.id)
  return candidate!.id
}

/* ══ [u4s#c1] store states — empty · populated · filtered ════════════════ */

test.describe('store states', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('store states — the opening deck is exactly the seam\'s membership, one card per id', async ({
    page,
  }) => {
    const f = await frame(page)
    const expected = membership(f).filter((id) => !slottedIds(f).includes(id))
    expect(expected.length, 'the boot run carries no blocks — the deck assert is vacuous').toBeGreaterThan(0)

    const shown = await deckIds(page)
    expect(new Set(shown)).toEqual(new Set(expected))
    expect(shown).toHaveLength(expected.length)
    expect(new Set(shown).size, 'a block is dealt twice').toBe(shown.length)
  })

  test('store states — the empty state carries the spec copy and stays off while cards are dealt', async ({
    page,
  }) => {
    await expect(page.locator(EMPTY)).toHaveText(EMPTY_COPY)
    await expect(page.locator(CARD)).not.toHaveCount(0)
    await expect(page.locator(EMPTY)).not.toHaveClass(/\bon\b/)
    await expect(page.locator(EMPTY)).toBeHidden()
  })

  test('store states — the filter offers 전체 plus the four species, in the design-target order', async ({
    page,
  }) => {
    const buttons = page.locator(`${FILTER} button`)
    await expect(buttons).toHaveCount(FILTERS.length)
    for (const [index, option] of FILTERS.entries()) {
      await expect(buttons.nth(index)).toContainText(option.ko)
      await expect(buttons.nth(index)).toContainText(option.mark)
    }
  })

  test('store states — counts are taken over the whole set, slotted blocks included', async ({ page }) => {
    const f = await frame(page)
    const total = membership(f).length
    expect(total, 'the boot run carries no blocks — the count assert is vacuous').toBeGreaterThan(0)

    const before = await filterCounts(page)
    expect(before['all']).toBe(total)

    const target = (await deckIds(page))[0]!
    await place(page, target, 0)
    await expect(card(page, target)).toHaveCount(0)

    const after = await filterCounts(page)
    expect(after, 'slotting a block changed a filter count').toEqual(before)
    expect(await deckIds(page)).toHaveLength(total - 1)
  })

  test('store states — a species filter shows that species and nothing else', async ({ page }) => {
    const f = await frame(page)
    const index = sentenceIndex(f)
    const counts = await filterCounts(page)
    let filtered = 0

    for (const option of FILTERS.slice(1)) {
      await filterButton(page, option.ko).click()
      const shown = await deckIds(page)
      for (const id of shown) {
        expect(speciesOf(id, index), `${id} is not ${option.key}`).toBe(option.key)
      }
      if (shown.length > 0) filtered += 1
      expect(shown.length).toBeLessThanOrEqual(counts[option.key]!)
    }
    expect(filtered, 'no species filter matched anything — the filter assert is vacuous').toBeGreaterThan(0)
  })

  test('store states — a filter that matches nothing shows the empty state and no cards', async ({
    page,
  }) => {
    const counts = await filterCounts(page)
    const barren = FILTERS.slice(1).find((option) => counts[option.key] === 0)
    expect(barren, 'every species has a block — the empty-by-filter assert is vacuous').toBeTruthy()

    await filterButton(page, barren!.ko).click()
    await expect(page.locator(CARD)).toHaveCount(0)
    await expect(page.locator(EMPTY)).toHaveClass(/\bon\b/)
    await expect(page.locator(EMPTY)).toBeVisible()
    await expect(page.locator(EMPTY)).toHaveText(EMPTY_COPY)

    await filterButton(page, '전체').click()
    await expect(page.locator(CARD)).not.toHaveCount(0)
    await expect(page.locator(EMPTY)).toBeHidden()
  })

  test('store states — mining a sentence deals one new card, keyed by its id', async ({ page }) => {
    const before = (await deckIds(page)).length
    const mined = await mineOne(page)

    await expect(card(page, mined)).toHaveCount(1)
    await expect.poll(async () => (await deckIds(page)).length).toBe(before + 1)
  })
})

/* ══ [u4s#c2] card states — in-store · slotted · at-cap · archived ═══════ */

test.describe('card states', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('card states — every card prints its authored id and its species mark', async ({ page }) => {
    const index = sentenceIndex(await frame(page))
    const shown = await deckIds(page)
    expect(shown.length, 'nothing is dealt — the card assert is vacuous').toBeGreaterThan(0)

    for (const id of shown) {
      expect(id, `${id} is not an authored id`).toMatch(AUTHORED_ID)
      const node = card(page, id)
      await expect(node.locator('.bc-id')).toHaveText(id.toUpperCase())
      const option = FILTERS.find((o) => o.key === speciesOf(id, index))
      await expect(node.locator('.bc-sp')).toContainText(option!.mark)
      await expect(node.locator('.bc-sp')).toContainText(option!.ko)
    }
  })

  test('card states — the card is index-card stock with a punch hole (u1 skin)', async ({ page }) => {
    await expect(page.locator(BODY)).toHaveClass(/\bcard-stock\b/)
    const punch = await page.locator(CARD).first().evaluate((node) => {
      const before = getComputedStyle(node, '::before')
      return { content: before.content, width: before.width, radius: before.borderTopLeftRadius }
    })
    expect(punch.content, 'the card has no ::before punch hole').not.toBe('none')
    expect(Number.parseFloat(punch.width)).toBeGreaterThan(0)
    expect(punch.radius, 'the punch hole is not round').not.toBe('0px')
  })

  test('card states — a slotted block leaves the deck and renders in-slot', async ({ page }) => {
    const target = (await deckIds(page))[0]!
    await place(page, target, 0)

    await expect(card(page, target)).toHaveCount(0)
    const slotted = page.locator(`${SLOT}[data-slot="0"] .bcard[data-block="${target}"]`)
    await expect(slotted).toHaveCount(1)
    await expect(slotted).toHaveClass(/\bin-slot\b/)
  })

  test('card states — a full board disables every card left in the deck (at-cap)', async ({ page }) => {
    const deck = await deckIds(page)
    expect(deck.length, 'the deck cannot fill the board — the at-cap assert is vacuous').toBeGreaterThan(CAP)
    for (let slot = 0; slot < CAP; slot += 1) await place(page, deck[slot]!, slot)

    const remaining = await deckIds(page)
    expect(remaining.length).toBeGreaterThan(0)
    for (const id of remaining) {
      await expect(card(page, id)).toHaveClass(/\bat-cap\b/)
      await expect(card(page, id)).toHaveAttribute('aria-disabled', 'true')
      expect(await card(page, id).evaluate((n) => (n as HTMLElement).draggable)).toBe(false)
    }
  })

  test('card states — a carried block wears the archived highlight, a freshly mined one does not', async ({
    page,
  }) => {
    const carried = metaOf(await frame(page))?.carried ?? []
    expect(carried.length, 'the run opens holding nothing — the archived assert is vacuous').toBeGreaterThan(0)
    for (const id of carried) await expect(card(page, id)).toHaveClass(/\barchived\b/)

    const mined = await mineOne(page)
    await expect(card(page, mined)).not.toHaveClass(/\barchived\b/)
  })

  test('card states — the four states are told apart by class, never by text', async ({ page }) => {
    const deck = await deckIds(page)
    expect(deck.length).toBeGreaterThan(CAP)
    const carriedIds = metaOf(await frame(page))?.carried ?? []

    // in-store vs archived, on an open board.
    const carried = carriedIds[0]
    const fresh = deck.find((id) => !carriedIds.includes(id))
    if (carried !== undefined) await expect(card(page, carried)).toHaveClass(/\barchived\b/)
    if (fresh !== undefined) await expect(card(page, fresh)).not.toHaveClass(/\barchived\b/)

    // slotted — the card is gone from the deck and flat in the slot.
    await place(page, deck[0]!, 0)
    await expect(card(page, deck[0]!)).toHaveCount(0)
    await expect(page.locator(`${SLOT}[data-slot="0"] .bcard`)).toHaveClass(/\bin-slot\b/)
    await expect(page.locator(`${SLOT}[data-slot="0"] .bcard`)).not.toHaveClass(/\bat-cap\b/)

    // at-cap — the state is a class on the deck's cards, not a message.
    for (let slot = 1; slot < CAP; slot += 1) await place(page, deck[slot]!, slot)
    await expect(card(page, deck[CAP]!)).toHaveClass(/\bat-cap\b/)
  })
})

/* ══ [u4s#c3] slotting — drag · click · drop-to-unslot · lock ════════════ */

test.describe('slotting', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('slotting — clicking a card then a slot seats it, by id', async ({ page }) => {
    const target = (await deckIds(page))[0]!
    await page.locator(`${STORE} .win-bar`).click()
    await card(page, target).click()
    await expect(card(page, target)).toHaveClass(/\bpicked\b/)

    await page.locator(`${SLOT}[data-slot="1"]`).click()
    await expect.poll(async () => (await frame(page)).store.slots[1]).toBe(target)
    await expect(card(page, target)).toHaveCount(0)
    expect(slottedIds(await frame(page))).toEqual([target])
  })

  test('slotting — dragging a card onto a slot seats it, and the wire carries the id', async ({ page }) => {
    const target = (await deckIds(page))[1]!
    const payload = await dragCardTo(page, target, `${SLOT}[data-slot="2"]`)

    expect(payload, 'the drag channel does not carry the authored id').toBe(target)
    await expect.poll(async () => (await frame(page)).store.slots[2]).toBe(target)
    await expect(card(page, target)).toHaveCount(0)
  })

  test('slotting — dropping a slotted card back on the store unslots it', async ({ page }) => {
    const target = (await deckIds(page))[0]!
    await place(page, target, 0)
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBe(target)

    await dropOn(page, target, BODY)
    await expect.poll(async () => slottedIds(await frame(page))).toEqual([])
    await expect(card(page, target)).toHaveCount(1)
  })

  test('slotting — dropping an id no slot holds changes nothing', async ({ page }) => {
    const deck = await deckIds(page)
    await place(page, deck[0]!, 0)
    const before = (await frame(page)).store.slots

    await dropOn(page, deck[1]!, BODY)
    expect((await frame(page)).store.slots).toEqual(before)
    await expect(card(page, deck[1]!)).toHaveCount(1)
  })

  test('slotting — releasing a slot from the board returns the card to the deck', async ({ page }) => {
    const target = (await deckIds(page))[0]!
    await place(page, target, 0)
    await expect(card(page, target)).toHaveCount(0)

    await page.locator(`${SLOT}[data-slot="0"] .slot-unset`).click()
    await expect.poll(async () => slottedIds(await frame(page))).toEqual([])
    await expect(card(page, target)).toHaveCount(1)
  })

  test('slotting — a deployed file locks the deck: no click, no drag, no drop moves anything', async ({
    page,
  }) => {
    const deck = await deckIds(page)
    await place(page, deck[0]!, 0)
    await page.locator(`${FILE} #btnDeploy`).click()
    await expect.poll(async () => (await frame(page)).store.deployed.length).toBeGreaterThan(0)

    const before = (await frame(page)).store.slots
    const locked = deck[1]!
    await expect(card(page, locked)).toHaveAttribute('aria-disabled', 'true')
    expect(await card(page, locked).evaluate((n) => (n as HTMLElement).draggable)).toBe(false)

    // Dispatched rather than clicked: a refusing handler must be REACHED and
    // then do nothing, so actionability must not be what stops the op.
    await card(page, locked).dispatchEvent('click')
    await expect(card(page, locked)).not.toHaveClass(/\bpicked\b/)
    await page.locator(`${SLOT}[data-slot="1"]`).dispatchEvent('click')
    await dropOn(page, deck[0]!, BODY)

    expect((await frame(page)).store.slots, 'a locked file still moved a block').toEqual(before)
  })

  test('slotting — the filter keeps working while the file is locked', async ({ page }) => {
    await place(page, (await deckIds(page))[0]!, 0)
    await page.locator(`${FILE} #btnDeploy`).click()
    await expect.poll(async () => (await frame(page)).store.deployed.length).toBeGreaterThan(0)

    await page.locator(`${STORE} .win-bar`).click()
    await filterButton(page, '사실').click()
    await expect(filterButton(page, '사실')).toHaveAttribute('aria-pressed', 'true')
  })
})

/* ══ [u4s#c5] a11y — the pointer is optional ═════════════════════════════ */

test.describe('a11y', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('a11y — every card is a keyboard-reachable button with a pressed state', async ({ page }) => {
    const target = (await deckIds(page))[0]!
    const node = card(page, target)

    await expect(node).toHaveAttribute('role', 'button')
    await expect(node).toHaveAttribute('tabindex', '0')
    await expect(node).toHaveAttribute('aria-pressed', 'false')

    await node.focus()
    await expect(node).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(node).toHaveAttribute('aria-pressed', 'true')
    await expect(node).toHaveClass(/\bpicked\b/)

    await page.keyboard.press(' ')
    await expect(node).toHaveAttribute('aria-pressed', 'false')
    await expect(node).not.toHaveClass(/\bpicked\b/)
  })

  test('a11y — exactly one card is armed at a time', async ({ page }) => {
    const deck = await deckIds(page)
    await card(page, deck[0]!).focus()
    await page.keyboard.press('Enter')
    await card(page, deck[1]!).focus()
    await page.keyboard.press('Enter')

    await expect(page.locator(`${LIST} .bcard[aria-pressed="true"]`)).toHaveCount(1)
    await expect(card(page, deck[1]!)).toHaveAttribute('aria-pressed', 'true')
  })

  test('a11y — slotting and unslotting complete with the keyboard alone, zero pointer events', async ({
    page,
  }) => {
    await page.evaluate(() => {
      const win = window as unknown as Handles
      win.__pointerEvents = 0
      for (const type of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup']) {
        document.addEventListener(
          type,
          (event) => {
            // A keyboard-activated button fires a click with no coordinates;
            // only a real pointer carries them.
            const pointer = event as MouseEvent
            if (pointer.detail > 0 || pointer.clientX > 0 || pointer.clientY > 0) {
              win.__pointerEvents = (win.__pointerEvents ?? 0) + 1
            }
          },
          true,
        )
      }
    })

    const target = (await deckIds(page))[0]!
    await card(page, target).focus()
    await page.keyboard.press('Enter')

    await page.locator(`${SLOT}[data-slot="0"] .slot-target`).focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBe(target)

    await page.locator(`${SLOT}[data-slot="0"] .slot-unset`).focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => slottedIds(await frame(page))).toEqual([])
    await expect(card(page, target)).toHaveCount(1)

    expect(
      await page.evaluate(() => (window as unknown as Handles).__pointerEvents),
      'the keyboard path fired a pointer event',
    ).toBe(0)
  })

  test('a11y — the filter is a button group with exactly one pressed button, in sync with .on', async ({
    page,
  }) => {
    await expect(page.locator(FILTER)).toHaveAttribute('role', 'group')
    await expect(page.locator(FILTER)).toHaveAttribute('aria-label', /.+/)

    const buttons = page.locator(`${FILTER} button`)
    await expect(buttons).toHaveCount(FILTERS.length)
    for (let index = 0; index < FILTERS.length; index += 1) {
      await expect(buttons.nth(index)).toHaveAttribute('type', 'button')
    }
    await expect(page.locator(`${FILTER} button[aria-pressed="true"]`)).toHaveCount(1)
    await expect(page.locator(`${FILTER} button.on`)).toHaveCount(1)
    await expect(page.locator(`${FILTER} button.on`)).toHaveAttribute('aria-pressed', 'true')

    await filterButton(page, '사실').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(`${FILTER} button[aria-pressed="true"]`)).toHaveCount(1)
    await expect(filterButton(page, '사실')).toHaveAttribute('aria-pressed', 'true')
    await expect(filterButton(page, '사실')).toHaveClass(/\bon\b/)
    await expect(filterButton(page, '전체')).not.toHaveClass(/\bon\b/)
  })

  test('a11y — the store surface carries no free-text input (inv 1)', async ({ page }) => {
    await expect(page.locator(`${STORE} input, ${STORE} textarea`)).toHaveCount(0)
    await expect(page.locator(`${STORE} [contenteditable]`)).toHaveCount(0)
  })
})
