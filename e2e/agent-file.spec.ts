// u4 — AGENT FILE window: the rendered document.
//
// Covers [u4#c1] the dossier §0–§5 (sealed §3 included) · [u4#c4] the deploy
// stamp and the lock · [u4#c6] membrane ops by keyboard alone.
//
// Test titles are load-bearing: the unit's verification commands filter with
// `-g 'dossier sections'`, `-g 'deploy stamp locks the file'` and
// `-g 'a11y membrane ops'`. Do not rename a describe block without updating
// `.claude/super/units/u4.md`.
//
// The suite drives the window through `window.__agentFile` (the `window.__shell`
// precedent) rather than through the block store, so it never blocks on u4s:
// `index()` seeds the id→Sentence map, `pick()` arms the pick channel a slot
// click/keypress consumes, and `place`/`clear` delegate to the same SlotBoard
// the mouse does. Nothing here asserts fixture CONTENT (C3) — the block ids are
// the frozen authored grammar, the clock band is read out of the pack at
// runtime, and every other literal is design-target document art.
//
// It must pass against BOTH servers (dev today, `npm run preview` once u11
// re-points `playwright.config.ts` per C5) — nothing below assumes a dev server.
import { expect, test } from 'playwright/test'
import type { Locator, Page } from 'playwright/test'

const FILE = '#w-file'
const CAP = 4

/** Seedable sentences — authored id grammar `b-r<run>-<channel><nn>` (C3). */
const SEEDS = [
  { id: 'b-r2-f03', text: '계측 일지 3권이 관리동에서 반출됐다.', species: 'fact', axis: '관측' },
  { id: 'b-r2-b03', text: '나는 다리의 소리를 먼저 의심했다.', species: 'selfnarr', axis: '태도' },
  { id: 'b-r1-f01', text: '08:50 개통식 인파가 진입을 시작했다.', species: 'fact' },
  { id: 'b-r1-b02', text: '나는 회선을 끊지 않았다.', species: 'selfnarr' },
] as const

interface AgentFileHandle {
  slots(): (string | null)[]
  place(id: string, slot: number): void
  clear(slot: number): void
  deployed(): boolean
  index(sentence: { id: string; text: string; species: string; axis?: string }): void
  pick(id: string | null): void
}

/** The store snapshot the shell's own handle exposes (`window.__shell`). */
interface SeamStore {
  slots: Record<number, string>
  deployed: string[]
}

type Handles = { __agentFile?: AgentFileHandle; __shell?: { frame(): { store: SeamStore } } }

/** Boot the desk and wait until the AGENT FILE has rendered its dossier. */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator(FILE)).toBeVisible()
  await expect(page.locator(`${FILE} .sect`)).toHaveCount(6)
  await page.waitForFunction(() => (window as unknown as Handles).__agentFile !== undefined)
}

/** Seed every id→Sentence the suite slots, so cards resolve without u4s/u2f. */
async function seed(page: Page): Promise<void> {
  await page.evaluate((sentences) => {
    const handle = (window as unknown as Handles).__agentFile
    if (!handle) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
    for (const s of sentences) handle.index(s)
  }, SEEDS as unknown as { id: string; text: string; species: string; axis?: string }[])
}

async function place(page: Page, id: string, slot: number): Promise<void> {
  await page.evaluate(
    ({ id: blockId, slot: index }) => {
      ;(window as unknown as Handles).__agentFile!.place(blockId, index)
    },
    { id, slot },
  )
}

async function pick(page: Page, id: string | null): Promise<void> {
  await page.evaluate((blockId) => {
    ;(window as unknown as Handles).__agentFile!.pick(blockId)
  }, id)
}

/** The driver's own view of what the file deployed — through `window.__shell`. */
async function seamStore(page: Page): Promise<SeamStore> {
  return page.evaluate(() => {
    const shell = (window as unknown as Handles).__shell
    if (!shell) throw new Error('window.__shell is not exposed by the shell boot')
    return shell.frame().store
  })
}

/** The pack's own clock band — the source §1 and the topbar both read. */
async function packClock(page: Page): Promise<{ start: string; end: string }> {
  return page.evaluate(async () => {
    const slug = document.querySelector('#caseName')?.textContent ?? ''
    const url = new URL(`data/scenario/${slug}/meta.json`, document.baseURI)
    const raw = (await (await fetch(url)).json()) as { clock: { start: string; end: string } }
    const strip = (s: string): string => s.replace(/\+$/, '')
    return { start: strip(raw.clock.start), end: strip(raw.clock.end) }
  })
}

/**
 * Every pinned `data-block-id` the file currently shows, in DOM order — one per
 * filled slot.
 *
 * Scoped to the pin ANCHOR (`.slot-pin`, u8's RedThread attachment point)
 * because a filled slot carries the id twice by contract: on the `.slot` itself
 * and on its pin (u4 spec D9, asserted by (a) below and by [u4#c6] (d)). An
 * unscoped `[data-block-id]` would count each filled slot twice and contradict
 * those asserts; the anchors are the ids "the file shows".
 */
async function pinnedIds(page: Page): Promise<string[]> {
  return page.locator(`${FILE} .slot-pin[data-block-id]`).evaluateAll((nodes) =>
    nodes.map((n) => (n as HTMLElement).dataset.blockId ?? ''),
  )
}

function slot(page: Page, index: number): Locator {
  return page.locator(`${FILE} .slot[data-slot="${index}"]`)
}

/* ══ [u4#c1] ════════════════════════════════════════════════════════════ */

test.describe('dossier sections', () => {
  test('[u4#c1] (a) §0–§5 render in order with their titles and flags', async ({ page }) => {
    await boot(page)
    const sects = page.locator(`${FILE} .win-body .sect`)
    await expect(sects).toHaveCount(6)
    await expect(sects.locator('.sect-no')).toHaveText(['§0', '§1', '§2', '§3', '§4', '§5'])
    await expect(sects.locator('h4')).toHaveText([
      '식별',
      '임무',
      '행동 원칙',
      '기질',
      '인수인계 사항',
      '교신 지침',
    ])
    await expect(sects.locator('.sect-flag')).toHaveText([
      '고정',
      '고정',
      '고정',
      '봉인',
      '조작 가능',
      '고정',
    ])
  })

  test('[u4#c1] (b) §0 is a three-row identity table', async ({ page }) => {
    await boot(page)
    const rows = page.locator(`${FILE} .sect`).nth(0).locator('dl.sect-rows')
    await expect(rows).toHaveCount(1)
    await expect(rows.locator('dt')).toHaveCount(3)
    await expect(rows.locator('dd')).toHaveCount(3)
    await expect(rows.locator('dt').first()).toHaveText('호출부호')
  })

  test('[u4#c1] (c) §4 holds the slot board — exactly four numbered slots', async ({ page }) => {
    await boot(page)
    const board = page.locator(`${FILE} .sect`).nth(4).locator('#slotBoard')
    await expect(board).toHaveCount(1)
    const slots = board.locator('.slot')
    await expect(slots).toHaveCount(CAP)
    expect(
      await slots.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.slot)),
    ).toEqual(['0', '1', '2', '3'])
    expect(
      await slots.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.no)),
    ).toEqual(['01', '02', '03', '04'])
    // The numbering is painted by the vendored skin, not by a text node.
    const printed = await slots
      .first()
      .evaluate((n) => getComputedStyle(n, '::before').content.replace(/["']/g, ''))
    expect(printed).toBe('01')
  })

  test('[u4#c1] (d) the case slug and doc number come from the pack, never a literal', async ({ page }) => {
    await boot(page)
    const doc = page.locator(`${FILE} .fh-doc`)
    await expect(doc).toHaveText(/^문서번호 NDSP-2\/AF\/[^/]+\/\d{2}$/)
    const slug = (await page.locator('#caseName').textContent())?.trim() ?? ''
    expect(slug.length).toBeGreaterThan(0)
    await expect(doc).toHaveText(new RegExp(`/AF/${slug}/\\d{2}$`))
    await expect(page.locator(`${FILE} .fh-title`)).toHaveText('현장 요원 운용 파일')
    await expect(page.locator(`${FILE} .fh-v`)).toHaveText('ECHO-3')
  })

  test('[u4#c1] (e) §1 prints the pack\'s own clock band', async ({ page }) => {
    await boot(page)
    const { start, end } = await packClock(page)
    expect(start).toMatch(/^\d{2}:\d{2}$/)
    expect(end).toMatch(/^\d{2}:\d{2}$/)
    await expect(page.locator(`${FILE} .sect`).nth(1).locator('.sect-body')).toContainText(
      `${start} → ${end}`,
    )
  })

  test('[u4#c1] (f) §3 is a redaction — bars and the sealed note, no temperament text', async ({ page }) => {
    await boot(page)
    const sealed = page.locator(`${FILE} .sect.sealed`)
    await expect(sealed).toHaveCount(1)
    await expect(sealed.locator('.redact i')).toHaveCount(10)
    await expect(sealed.locator('.sealed-note')).toHaveText(
      '열람 불가 — 운영자 권한으로 접근되지 않는 구획입니다. (봉인 I13)',
    )
    // Nothing but the header and the sealed copy is readable inside §3.
    const text = ((await sealed.textContent()) ?? '').replace(/\s+/g, ' ').trim()
    expect(text).toBe('§3 기질 봉인 열람 불가 — 운영자 권한으로 접근되지 않는 구획입니다. (봉인 I13)')
  })

  test('[u4#c1] (g) the file opens unstamped, with an empty board', async ({ page }) => {
    await boot(page)
    await expect(page.locator('#deployStamp')).not.toHaveClass(/\bon\b/)
    await expect(page.locator('#deployStamp')).toBeHidden()
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'empty')
    await expect(page.locator(`${FILE} [data-block-id]`)).toHaveCount(0)
  })
})

/* ══ [u4#c4] ════════════════════════════════════════════════════════════ */

test.describe('deploy stamp locks the file', () => {
  test('[u4#c4] (a) empty · partial · full are all reachable before deploy', async ({ page }) => {
    await boot(page)
    await seed(page)

    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'empty')
    await expect(page.locator('#slotCount')).toHaveText('0 / 4')
    await expect(page.locator('#deployState')).toHaveText('편성 없음 — 빈 파일로도 배치됩니다')
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'ready')
    await expect(page.locator('#btnDeploy')).toBeEnabled()

    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'partial')
    await expect(page.locator('#slotCount')).toHaveText('2 / 4')
    await expect(page.locator('#deployState')).toHaveText('편성 중 — 배치를 기다립니다')
    await expect(slot(page, 0)).toHaveAttribute('data-block-id', SEEDS[0].id)
    await expect(slot(page, 0).locator('.slot-pin')).toHaveAttribute('data-block-id', SEEDS[0].id)

    await place(page, SEEDS[2].id, 2)
    await place(page, SEEDS[3].id, 3)
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'full')
    await expect(page.locator('#slotCount')).toHaveText('4 / 4')
    await expect(page.locator('#btnDeploy')).toBeEnabled()
  })

  test('[u4#c4] (b) unslotting walks the board back down', async ({ page }) => {
    await boot(page)
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)

    await slot(page, 1).locator('.slot-unset').click()
    await expect(page.locator('#slotCount')).toHaveText('1 / 4')
    await expect(slot(page, 1)).not.toHaveAttribute('data-block-id', /./)
    expect(await pinnedIds(page)).toEqual([SEEDS[0].id])

    await slot(page, 0).locator('.slot-unset').click()
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'empty')
    expect(await pinnedIds(page)).toEqual([])
  })

  test('[u4#c4] (c) DEPLOY stamps the file and locks it for the run', async ({ page }) => {
    await boot(page)
    await seed(page)
    for (const [i, s] of SEEDS.entries()) await place(page, s.id, i)

    await page.locator('#btnDeploy').click()

    const stamp = page.locator('#deployStamp')
    await expect(stamp).toHaveClass(/\bon\b/)
    await expect(stamp).toBeVisible()
    await expect(stamp.locator('span')).toHaveText('배 치 완 료')
    await expect(stamp.locator('em')).toHaveText(/^RUN \d{2} · \d{2}:\d{2}$/)

    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'locked')
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'deployed')
    await expect(page.locator('#btnDeploy')).toBeDisabled()
    await expect(page.locator('#deployState')).toHaveText('배치됨 — 이번 시행에서 잠김')
    await expect(page.locator(`${FILE} .slot-unset`)).toHaveCount(0)
  })

  test('[u4#c4] (d) a locked file absorbs every further op', async ({ page }) => {
    await boot(page)
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)
    await page.locator('#btnDeploy').click()
    await expect(page.locator('#btnDeploy')).toBeDisabled()

    const before = await pinnedIds(page)
    await place(page, SEEDS[2].id, 2)
    await page.evaluate(() => {
      ;(window as unknown as Handles).__agentFile!.clear(0)
    })
    expect(await pinnedIds(page)).toEqual(before)
    await expect(page.locator('#slotCount')).toHaveText('2 / 4')
    await expect(page.locator('#deployStamp em')).toHaveText(/^RUN \d{2} · \d{2}:\d{2}$/)
  })

  test('[u4#c4] (e) the deployed SET reaches the seam, order carrying no meaning', async ({ page }) => {
    await boot(page)
    await seed(page)
    await place(page, SEEDS[1].id, 0)
    await place(page, SEEDS[0].id, 2)
    await page.locator('#btnDeploy').click()
    await expect(page.locator('#btnDeploy')).toBeDisabled()

    const store = await seamStore(page)
    expect(new Set(store.deployed)).toEqual(new Set([SEEDS[0].id, SEEDS[1].id]))
    expect(store.slots).toEqual({ 0: SEEDS[1].id, 2: SEEDS[0].id })
    expect(await page.evaluate(() => (window as unknown as Handles).__agentFile!.deployed())).toBe(true)
  })

  test('[u4#c4] (f) an empty file deploys too — the stamp does not need blocks', async ({ page }) => {
    await boot(page)
    await page.locator('#btnDeploy').click()
    await expect(page.locator('#deployStamp')).toHaveClass(/\bon\b/)
    await expect(page.locator('#slotCount')).toHaveText('0 / 4')
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'locked')
    const store = await seamStore(page)
    expect(store.deployed).toEqual([])
  })
})

/* ══ [u4#c6] ════════════════════════════════════════════════════════════ */

/** `#id` for a control, else `class@slot` — enough to pin the tab sequence. */
const DESCRIBE_ACTIVE = (): string => {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return 'none'
  if (el.id) return `#${el.id}`
  const cls = el.classList.contains('slot-target')
    ? 'slot-target'
    : el.classList.contains('slot-unset')
      ? 'slot-unset'
      : el.className
  const owner = el.closest('.slot') as HTMLElement | null
  return owner ? `${cls}@${owner.dataset.slot}` : cls
}

test.describe('a11y membrane ops', () => {
  test('[u4#c6] (a) the file offers no free-text surface at all', async ({ page }) => {
    await boot(page)
    await expect(page.locator(`${FILE} input, ${FILE} textarea, ${FILE} select, ${FILE} [contenteditable]`)).toHaveCount(0)
    const editable = await page
      .locator(`${FILE} *`)
      .evaluateAll((nodes) => nodes.filter((n) => (n as HTMLElement).isContentEditable).length)
    expect(editable).toBe(0)
  })

  test('[u4#c6] (b) Tab walks the slots then the deploy button, in DOM order', async ({ page }) => {
    await boot(page)
    await seed(page)
    await place(page, SEEDS[0].id, 1)

    await slot(page, 0).locator('.slot-target').focus()
    const seen: string[] = [await page.evaluate(DESCRIBE_ACTIVE)]
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab')
      seen.push(await page.evaluate(DESCRIBE_ACTIVE))
    }
    expect(seen).toEqual([
      'slot-target@0',
      'slot-unset@1',
      'slot-target@2',
      'slot-target@3',
      '#btnDeploy',
    ])
  })

  test('[u4#c6] (c) every membrane control carries a non-empty accessible name', async ({ page }) => {
    await boot(page)
    await seed(page)
    await place(page, SEEDS[0].id, 0)

    const unnamed = await page
      .locator(`${FILE} .slot-target, ${FILE} .slot-unset, ${FILE} #btnDeploy`)
      .evaluateAll((nodes) =>
        nodes
          .filter((n) => {
            const el = n as HTMLElement
            const name = el.getAttribute('aria-label') ?? el.getAttribute('title') ?? el.textContent ?? ''
            return name.trim().length === 0
          })
          .map((n) => (n as HTMLElement).className),
      )
    expect(unnamed).toEqual([])
  })

  test('[u4#c6] (d) Enter and Space slot, unslot and deploy — keyboard alone', async ({ page }) => {
    await boot(page)
    await seed(page)

    // Enter places the armed pick.
    await pick(page, SEEDS[0].id)
    await slot(page, 0).locator('.slot-target').focus()
    await page.keyboard.press('Enter')
    await expect(slot(page, 0)).toHaveAttribute('data-block-id', SEEDS[0].id)

    // Space places the next one.
    await pick(page, SEEDS[1].id)
    await slot(page, 1).locator('.slot-target').focus()
    await page.keyboard.press('Space')
    await expect(slot(page, 1)).toHaveAttribute('data-block-id', SEEDS[1].id)
    await expect(page.locator('#slotCount')).toHaveText('2 / 4')

    // Enter unslots.
    await slot(page, 0).locator('.slot-unset').focus()
    await page.keyboard.press('Enter')
    await expect(slot(page, 0)).not.toHaveAttribute('data-block-id', /./)

    // Space unslots.
    await slot(page, 1).locator('.slot-unset').focus()
    await page.keyboard.press('Space')
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'empty')
  })

  test('[u4#c6] (e) Space on DEPLOY deploys, keyboard alone', async ({ page }) => {
    await boot(page)
    await seed(page)
    await pick(page, SEEDS[0].id)
    await slot(page, 2).locator('.slot-target').focus()
    await page.keyboard.press('Enter')

    await page.locator('#btnDeploy').focus()
    await page.keyboard.press('Space')
    await expect(page.locator('#deployStamp')).toHaveClass(/\bon\b/)
    await expect(page.locator('#btnDeploy')).toBeDisabled()
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'locked')
  })

  test('[u4#c6] (f) every membrane control paints a visible focus ring', async ({ page }) => {
    await boot(page)
    await seed(page)
    await place(page, SEEDS[0].id, 0)

    const unringed = await page
      .locator(`${FILE} .slot-target, ${FILE} .slot-unset, ${FILE} #btnDeploy`)
      .evaluateAll((nodes) =>
        nodes
          .filter((n) => {
            const el = n as HTMLElement
            el.focus()
            const s = getComputedStyle(el)
            const ringed = s.outlineStyle === 'auto' || (s.outlineStyle !== 'none' && s.outlineWidth !== '0px')
            return !(ringed || s.boxShadow !== 'none')
          })
          .map((n) => (n as HTMLElement).className),
      )
    expect(unringed).toEqual([])
  })
})
