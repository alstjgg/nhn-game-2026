// u4 — AGENT FILE window: the rendered document.
//
// Covers [u4#c1] the dossier's sections · [u4#c4] the deploy stamp and the lock
// · [u4#c6] membrane ops by keyboard alone · [x7] the headed pages and the
// cover's reveal.
//
// x7 — "the sealed §3 included" left this line with 기질 itself. The cover is
// three fixed sections now (`components/dossier.ts`) and the sealed section is
// out of the product entirely; what stood here as [u4#c1] (f) is deleted below,
// with the note that records where it went.
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
import { confirmDeploy, drain, newRun } from './fixtures/harness.ts'

const FILE = '#w-file'
const CAP = 4
/** x7 — the cover's own escape hatch; present only while it is still printing. */
const SKIP = `${FILE} #coverSkip`
/** The doc number every page is headed with — `PORTAL.portalCode` is `ERR-2`. */
const DOC_LINE = /^문서번호 ERR-2\/AF\/[^/]+$/
/**
 * x7 — the callsign, ACCEPTING THE FIRST AGENT.
 *
 * The series renumbered (`components/dossier.ts`): run 1 is `ECHO`, run 2 is
 * `ECHO-1`. A `/^ECHO-\d+$/` here would have failed on the one agent the
 * operator meets first, and it was pinning document art this suite does not own
 * — which agent a page is about is what these tests are for, not how the
 * document numbers them.
 */
const CALLSIGN = /^ECHO(?:-\d+)?$/

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

/**
 * Boot the desk and wait until the AGENT FILE has rendered its cover.
 *
 * C1 — one page is mounted at a time, so five sections never share a DOM. The
 * window opens on the cover and its three; a test that wants 식별 or
 * 인수인계 사항 turns the page itself.
 *
 * x7 — …and it LANDS the cover, which is not optional here. The cover types
 * itself out on first arrival, and THIS LANE DOES NOT FREEZE ANIMATIONS —
 * `playwright.config.ts` calls no freeze, `fixtures/harness.ts` freezes only
 * inside `freezeAt` (a capture-side stylesheet, not the driver gate), and this
 * helper asks for no reduced motion. Verified rather than assumed, because the
 * assumption was the other way round: without this press every assert against
 * cover copy below would be racing a reveal.
 *
 * The press is the operator's own way past it rather than a wait, so the
 * control is exercised by every test in the file. `landCover` is a no-op once
 * the reveal is spent, which is what makes it safe to call unconditionally.
 */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator(FILE)).toBeVisible()
  await expect(page.locator(`${FILE} .sect`)).toHaveCount(3)
  await landCover(page)
  await page.waitForFunction(() => (window as unknown as Handles).__agentFile !== undefined)
}

/** Press 건너뛰기 if the cover is still printing itself; else leave it alone. */
/**
 * Lands the cover's reveal by pressing 건너뛰기 — SYNTHETICALLY, and that is the
 * whole subtlety (x7).
 *
 * `.click()` on the locator dispatches a REAL pointer event, and Chromium
 * decides `:focus-visible` from the last interaction modality. Once the page has
 * seen a real pointer, a programmatic `.focus()` no longer paints the UA ring —
 * so `[u4#c6] (f)`, which censuses every membrane control's ring off exactly
 * such a `.focus()`, went red for every `.slot-unset` on the page the moment
 * `boot()` started pressing this. The control was fine; the gesture had moved
 * the browser's heuristic out from under the census.
 *
 * That test already documents the rule in its own comment and turns the file's
 * page the same way for the same reason. `boot()` runs before every test in
 * this suite, so it has to hold the same line — an in-page `click()` activates
 * the button and leaves the modality where it was.
 */
async function landCover(page: Page): Promise<void> {
  const skip = page.locator(SKIP)
  if ((await skip.count()) === 0) return
  await skip.evaluate((node) => (node as HTMLElement).click())
  await expect(skip, 'the skip stayed on the page after it was pressed').toHaveCount(0)
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

/**
 * The pack slug the CLIENT actually asked the server for.
 *
 * RE-AIMED (08-09). Both callers used to read `#caseName`, which carried the
 * slug until `ui(x2)` (#212) pointed it at `PACK_DISPLAY_NAME` — a display name
 * that is `전 구간 정상` where the slug is `전구간정상`, and which `shell/pack.ts`
 * says outright is "DELIBERATELY not derived from `PACK_SLUG` — there is no
 * rule". So the chrome stopped being a slug source, silently: `(d)` compared
 * the doc number against a string with spaces in it, and `(e)` fetched
 * `data/scenario/전 구간 정상/meta.json`, got the dev server's index.html and
 * died parsing it as JSON. Neither is caught by CI, which runs the `preview`
 * project alone.
 *
 * The boot request is the honest replacement. It is not a literal (C3), it is
 * not the display name, and it is not the doc line either — which matters,
 * because `(d)` exists to check the doc line against an INDEPENDENT source.
 * `performance` is read rather than a request listener so there is no ordering
 * race with `boot()`'s own `goto`.
 */
async function packSlug(page: Page): Promise<string> {
  const url = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) => /\/data\/scenario\/[^/]+\/meta\.json(\?|$)/.test(name)) ?? '',
  )
  const found = /\/data\/scenario\/([^/]+)\/meta\.json(\?|$)/.exec(url)
  expect(found, `no pack meta.json request was observed: ${url}`).not.toBeNull()
  return decodeURIComponent(found![1]!)
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
  test('[u4#c1] (a) the cover and the agent page carry the ratified titles and flags', async ({ page }) => {
    await boot(page)
    // C1 — one page is mounted at a time, so the five sections are read across
    // two: the cover's three, then the agent's two. `.sect-no` is gone.
    //
    // x7 — three, and all of them 고정. 행동 원칙 folded into the orders and the
    // sealed 기질 left the product outright, taking 봉인 with it: the cover is
    // the case, the posting and the comms discipline, and every one of them is
    // something the operator may read and may not touch.
    const sects = page.locator(`${FILE} .win-body .sect`)
    await expect(sects).toHaveCount(3)
    await expect(sects.locator('h4')).toHaveText(['사건 개요', '현장 요원 임무', '현장 요원 교신 지침'])
    await expect(page.locator(`${FILE} .sect-no`)).toHaveCount(0)
    await expect(sects.locator('.sect-flag')).toHaveText(['고정', '고정', '고정'])
    await expect(page.locator(`${FILE} .sect.sealed`)).toHaveCount(0)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await expect(sects).toHaveCount(2)
    await expect(sects.locator('h4')).toHaveText(['식별', '인수인계 사항'])
    await expect(sects.locator('.sect-flag')).toHaveText(['고정', '조작 가능'])
  })

  test('[u4#c1] (b) 식별 is a three-row identity table', async ({ page }) => {
    await boot(page)
    // C1 — 식별 opens the AGENT's page, not the document.
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    const rows = page.locator(`${FILE} .sect`).nth(0).locator('dl.sect-rows')
    await expect(rows).toHaveCount(1)
    await expect(rows.locator('dt')).toHaveCount(3)
    await expect(rows.locator('dd')).toHaveCount(3)
    await expect(rows.locator('dt').first()).toHaveText('호출부호')
  })

  // x4 — RE-AIMED. This used to read "exactly four numbered slots", and four
  // permanent boxes are exactly what 민서 took out on 08-08: the file is a
  // handover the operator WRITES, so it prints as one paragraph of seated
  // sentences, and the empty seats are read off `#slotCount` below rather than
  // standing there as boxes. What the case still holds is everything that was
  // load-bearing about the old assert — the board is on the agent's page, a
  // seated sentence is numbered, and the number is painted by the skin.
  test('[u4#c1] (c) 인수인계 사항 holds the slot board — a numbered paragraph, one blank when empty', async ({
    page,
  }) => {
    await boot(page)
    // C1 — the board is on the agent's page, second of that page's two
    // sections. It was index 4 of six in one scrolling dossier.
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    const board = page.locator(`${FILE} .sect`).nth(1).locator('#slotBoard')
    await expect(board).toHaveCount(1)

    // Empty: one blank, and it says what the file is for.
    await expect(board.locator('.slot')).toHaveCount(1)
    await expect(board.locator('.slot-blank')).toHaveCount(1)
    await expect(board.locator('.slot.filled')).toHaveCount(0)
    await expect(board.locator('.slot-blank .slot-empty')).toHaveText(
      '다음 요원에게 인수인계할 사항을 기록에서 가져오세요',
    )
    // …centred both ways in its panel, which is what makes it a blank sheet
    // rather than a left-aligned label.
    expect(
      await board.locator('.slot-blank').evaluate((n) => {
        const s = getComputedStyle(n as HTMLElement)
        return { justify: s.justifyContent, align: s.alignItems, text: s.textAlign }
      }),
    ).toEqual({ justify: 'center', align: 'center', text: 'center' })

    // Two seated: two runs, numbered, and the blank is gone.
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)
    const seats = board.locator('.slot.filled')
    await expect(seats).toHaveCount(2)
    await expect(board.locator('.slot-blank')).toHaveCount(0)
    expect(await seats.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.slot))).toEqual([
      '0',
      '1',
    ])
    expect(await seats.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.no))).toEqual([
      '01',
      '02',
    ])
    // The numbering is painted by the vendored skin, not by a text node.
    expect(
      await seats.evaluateAll((nodes) =>
        nodes.map((n) => getComputedStyle(n as HTMLElement, '::before').content.replace(/["']/g, '')),
      ),
    ).toEqual(['01', '02'])
    // And it is a PARAGRAPH: the seats are inline runs the flow can break
    // inside, not blocks stacked in a grid.
    expect(
      await seats.evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n as HTMLElement).display)),
    ).toEqual(['inline', 'inline'])
    // The cap is still readable — `#slotCount`, a few lines down. This is the
    // one surface that says how many seats are left now.
    await expect(page.locator('#slotCount')).toHaveText(`2 / ${CAP}`)
  })

  test('[u4#c1] (d) the case slug and doc number come from the pack, never a literal', async ({ page }) => {
    await boot(page)
    const doc = page.locator(`${FILE} .fh-doc`)
    // C1 — the number names the DOCUMENT, which spans every agent, so it has
    // no run segment. It used to end `/01`, `/02`, …
    await expect(doc).toHaveText(DOC_LINE)
    // The slug the client fetched the pack under, not the chrome's display
    // name — see `packSlug`. Still an independent source: the doc line is
    // built by `windows/agent-file.ts` from the fetched identity, and this
    // comes off the network.
    const slug = await packSlug(page)
    expect(slug.length).toBeGreaterThan(0)
    await expect(doc).toHaveText(new RegExp(`/AF/${slug}$`))
    await expect(page.locator(`${FILE} .fh-title`)).toHaveText('현장 요원 운용 파일')
    // …and the callsign left the header outright. `.fh-v` is gone: a header
    // that always names the CURRENT agent would contradict the page the moment
    // the player turned back to an earlier one. It is 식별's first row now.
    await expect(page.locator(`${FILE} .fh-v`)).toHaveCount(0)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    const identity = page.locator(`${FILE} .sect`).nth(0).locator('dl.sect-rows')
    // x7 — was `toHaveText('ECHO-3')`. The fixture desk opens at run 3 and the
    // ECHO series renumbered under it (run 1 is `ECHO` now), so the literal
    // asserted the document's own numbering from a suite that owns none of it —
    // and `agent-file.test.ts` already pins that numbering at the source. What
    // this case is actually about is the doc line, and what 식별 owes it is a
    // callsign at all.
    await expect(identity.locator('dd').first()).toHaveText(CALLSIGN)
  })

  // x6 — RE-AIMED. This used to assert that 임무 printed the pack's clock band;
  // 임무 is a posting order now and a posting order does not print the shift's
  // hours (the topbar clock does, and `(d)` above still holds the window to a
  // pack-fed value — its doc number). What replaced it is the property the
  // rewrite actually depends on and that no unit test can see: the cover's
  // clauses are authored one per line, and they reach the page that way.
  // x7 — RE-AIMED, not weakened. x6 wrote this against a body that carried its
  // authored `\n`s into one `.sect-body`; the cover prints a LINE PER ELEMENT
  // now (`components/dossier.ts`, and the reveal below pauses between those
  // elements), so a `toContain('\n')` would have failed on the very rewrite
  // that made the property MORE true. The claim is unchanged — a posting order's
  // clauses reach the page one per line, and no unit test can see that — so it
  // is asserted against the rendering instead of against one encoding of it:
  // either the break is still a character, or each clause is an element that
  // starts its own row. Both are line breaks; neither is justified prose.
  test('[u4#c1] (e) the cover keeps its authored line breaks', async ({ page }) => {
    await boot(page)
    // C1 — 사건 개요 opens the cover, so it is index 0. It was index 1 while 식별
    // sat above it in one scrolling dossier; 식별 is on the agent's page now.
    const opening = page.locator(`${FILE} .sect`).nth(0).locator('.sect-body')
    const broken = await opening.evaluate((node) => ({
      newlines: (node.textContent ?? '').split('\n').length - 1,
      rows: [...node.children].map((kid) => Math.round(kid.getBoundingClientRect().top)),
      // The sheet is what lets an authored `\n` print at all. Collapsed to
      // `normal`, clauses written that way run together into justified prose
      // and the section reads as a manual again.
      whiteSpace: getComputedStyle(node).whiteSpace,
    }))
    const perElement = broken.rows.length > 1 && new Set(broken.rows).size === broken.rows.length
    expect(
      broken.newlines > 0 || perElement,
      'the cover ran its clauses together — neither an authored break nor a line per element',
    ).toBe(true)
    if (broken.newlines > 0) expect(broken.whiteSpace).toBe('pre-line')
    // A clause per line means the block is taller than a single line of it.
    const box = await opening.boundingBox()
    const line = await opening.evaluate((node) => parseFloat(getComputedStyle(node).lineHeight))
    expect(box!.height).toBeGreaterThan(line * 2)
  })

  // DELETED (x7) — `[u4#c1] (f) 기질 is a redaction`.
  //
  // It asserted the strip's bars, their percentage `flex-basis` (inv 8) and the
  // sealed notice's exact copy, on `.sect.sealed`. There is no sealed section:
  // 기질 is off the cover and appears nowhere else, so the section it guarded
  // has left the product rather than moved. Nothing replaces it here, because
  // there is nothing left to assert — what stands in its place is the one line
  // in `(a)` above, `.sect.sealed` toHaveCount(0), which fails the day a
  // redaction comes back unannounced. The model-side half of the same claim
  // ([u4#c2] in `tests/windows/agent-file.test.ts`) is the sibling's to settle.

  test('[u4#c1] (g) the file opens unstamped, with an empty board', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
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
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
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
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)

    await slot(page, 1).locator('.slot-unset').click()
    await expect(page.locator('#slotCount')).toHaveText('1 / 4')
    // x4 — a released seat leaves the paragraph outright; it used to stay behind
    // as an empty box carrying no `data-block-id`. Absence is the assert now.
    await expect(slot(page, 1)).toHaveCount(0)
    expect(await pinnedIds(page)).toEqual([SEEDS[0].id])

    await slot(page, 0).locator('.slot-unset').click()
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'empty')
    expect(await pinnedIds(page)).toEqual([])
    // …and the blank comes back, because an empty file is the one state that
    // needs telling.
    await expect(page.locator(`${FILE} .slot-blank`)).toHaveCount(1)
  })

  test('[u4#c4] (c) DEPLOY stamps the file and locks it for the run', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    for (const [i, s] of SEEDS.entries()) await place(page, s.id, i)

    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)

    const stamp = page.locator('#deployStamp')
    await expect(stamp).toHaveClass(/\bon\b/)
    await expect(stamp).toBeVisible()
    // x5b — 파견, matching the plate that authorised it and the line the desk
    // says out loud (`slot-board.ts`'s `announcementOfAction`). `#deployState`
    // below still reads 배치됨: that is the file's own STATE, not the act.
    await expect(stamp.locator('span')).toHaveText('파 견 완 료')
    // x7 — `ECHO(-n)?`: the first agent is plain `ECHO`. See `CALLSIGN` above.
    await expect(stamp.locator('em')).toHaveText(/^ECHO(?:-\d+)? · \d{2}:\d{2}$/)

    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'locked')
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'deployed')
    await expect(page.locator('#btnDeploy')).toBeDisabled()
    await expect(page.locator('#deployState')).toHaveText('배치됨 — 이번 시행에서 잠김')
    await expect(page.locator(`${FILE} .slot-unset`)).toHaveCount(0)
  })

  test('[u4#c4] (d) a locked file absorbs every further op', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)
    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)
    await expect(page.locator('#btnDeploy')).toBeDisabled()

    const before = await pinnedIds(page)
    await place(page, SEEDS[2].id, 2)
    await page.evaluate(() => {
      ;(window as unknown as Handles).__agentFile!.clear(0)
    })
    expect(await pinnedIds(page)).toEqual(before)
    await expect(page.locator('#slotCount')).toHaveText('2 / 4')
    await expect(page.locator('#deployStamp em')).toHaveText(/^ECHO(?:-\d+)? · \d{2}:\d{2}$/)
  })

  test('[u4#c4] (e) the deployed SET reaches the seam, order carrying no meaning', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[1].id, 0)
    await place(page, SEEDS[0].id, 2)
    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)
    await expect(page.locator('#btnDeploy')).toBeDisabled()

    const store = await seamStore(page)
    expect(new Set(store.deployed)).toEqual(new Set([SEEDS[0].id, SEEDS[1].id]))
    expect(store.slots).toEqual({ 0: SEEDS[1].id, 2: SEEDS[0].id })
    expect(await page.evaluate(() => (window as unknown as Handles).__agentFile!.deployed())).toBe(true)
  })

  test('[u4#c4] (f) an empty file deploys too — the stamp does not need blocks', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)
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

  // x4 — RE-AIMED for the paragraph. The rule is unchanged (the file's controls
  // walk in DOM order and end on DEPLOY); what changed is how many there are,
  // because three empty boxes no longer sit in the tab ring waiting for a pick
  // the desk has no way to arm any more. Both states are walked: the empty file,
  // whose one blank is the `slot` op's control, and a written one, where every
  // stop is a real release.
  test('[u4#c6] (b) Tab walks the slots then the deploy button, in DOM order', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)

    const walk = async (steps: number): Promise<string[]> => {
      const seen: string[] = [await page.evaluate(DESCRIBE_ACTIVE)]
      for (let i = 0; i < steps; i += 1) {
        await page.keyboard.press('Tab')
        seen.push(await page.evaluate(DESCRIBE_ACTIVE))
      }
      return seen
    }

    // Empty: the blank, then the button.
    await page.locator(`${FILE} .slot-blank .slot-target`).focus()
    expect(await walk(1)).toEqual(['slot-target@0', '#btnDeploy'])

    // Written out of order — seats 1 and 3 — and the walk still follows the
    // paragraph, which is slot order, not the order they were seated in.
    await place(page, SEEDS[0].id, 3)
    await place(page, SEEDS[1].id, 1)
    await slot(page, 1).locator('.slot-unset').focus()
    expect(await walk(2)).toEqual(['slot-unset@1', 'slot-unset@3', '#btnDeploy'])
  })

  test('[u4#c6] (c) every membrane control carries a non-empty accessible name', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
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

  // x4 — both keys still drive both ops, but there is ONE blank to place
  // through, so the sequence cycles it instead of walking four boxes: Enter
  // seats, Enter releases, Space seats, Space releases. The claim — every
  // membrane op on this window is reachable by keyboard alone, on both keys —
  // is exactly the one it was.
  test('[u4#c6] (d) Enter and Space slot, unslot and deploy — keyboard alone', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    const blank = page.locator(`${FILE} .slot-blank .slot-target`)

    // Enter places the armed pick into the first free seat.
    await pick(page, SEEDS[0].id)
    await blank.focus()
    await page.keyboard.press('Enter')
    await expect(slot(page, 0)).toHaveAttribute('data-block-id', SEEDS[0].id)
    await expect(page.locator('#slotCount')).toHaveText('1 / 4')

    // Enter releases it, and the blank comes back.
    await slot(page, 0).locator('.slot-unset').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'empty')
    await expect(blank).toHaveCount(1)

    // Space places the next one.
    await pick(page, SEEDS[1].id)
    await blank.focus()
    await page.keyboard.press('Space')
    await expect(slot(page, 0)).toHaveAttribute('data-block-id', SEEDS[1].id)

    // Space releases it too.
    await slot(page, 0).locator('.slot-unset').focus()
    await page.keyboard.press('Space')
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'empty')
  })

  test('[u4#c6] (e) Space on DEPLOY deploys, keyboard alone', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await pick(page, SEEDS[0].id)
    // x4 — the blank seats into the first free seat, so this lands at 0. It used
    // to name seat 2, which only meant anything while four boxes stood there.
    await page.locator(`${FILE} .slot-blank .slot-target`).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#slotCount')).toHaveText('1 / 4')

    await page.locator('#btnDeploy').focus()
    await page.keyboard.press('Space')
    // x2 — and the confirmation plate is answered by keyboard too, or this
    // claim would quietly become "keyboard alone up to the last press".
    // `openConfirm` focuses 아니오, so 예 is one Tab away.
    await expect(page.locator('#confirmNo')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.locator('#confirmYes')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#confirm')).toHaveCount(0)
    await expect(page.locator('#deployStamp')).toHaveClass(/\bon\b/)
    await expect(page.locator('#btnDeploy')).toBeDisabled()
    await expect(page.locator(`${FILE} .slots`)).toHaveAttribute('data-state', 'locked')
  })

  test('[u4#c6] (f) every membrane control paints a visible focus ring', async ({ page }) => {
    await boot(page)
    // Turned WITHOUT a real input event, deliberately. Chromium decides
    // `:focus-visible` from the last interaction modality, and this census reads
    // the UA ring off a programmatic `.focus()`. A real pointer click moves the
    // page out of the "no interaction yet" state the census has always relied
    // on, and every slot control then reports no ring — a fact about the
    // gesture, not about the control. (`#btnDeploy` hides this: it carries a
    // permanent `box-shadow`, so it satisfies the check either way.) A
    // synthetic click inside the page turns the leaf and leaves the heuristic
    // where it was.
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().evaluate((n) => (n as HTMLElement).click())
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

/* ══ U5.3 — the sitting that ended is still on the desk ══════════════════ */

test.describe('[U5.3] a finished sitting becomes a page of its own', () => {
  test('[U5.3] (a) deploying, closing the day and opening the next appends a page', async ({ page }) => {
    await boot(page)
    // Two pages while ECHO-1 is the only agent: the cover and ECHO-1's own.
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('1 / 2')

    // Seeded and placed through `window.__agentFile`, like every other test in
    // this file — the suite drives the window's own handle and never blocks on
    // what REPORTS happens to be showing.
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)

    // The OPENING commit — this is the file this agent flies, and write site 1.
    //
    // The callsign is READ off 식별, never assumed. The fixture desk opens at
    // run 3, not run 1 — `(d)` above reads it off the page — so a hardcoded
    // ECHO-1 here
    // asserted a property of an imagined fixture instead of one of the page,
    // and C3 forbids exactly that. What the claim actually needs is that the
    // page turned back to names the agent that just flew, whoever it was.
    const flying = await page.locator(`${FILE} .sect`).nth(0).locator('dd').first().textContent()
    expect(flying, '식별 carries no callsign to fly').toMatch(CALLSIGN)
    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'deployed')

    // …then the day closes and the next press opens the following agent.
    await newRun(page)

    // Three pages now, and the file opened on the new agent's own — a different
    // agent from the one that just went out.
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('3 / 3')
    await expect(page.locator(`${FILE} #btnDeploy`)).toHaveCount(1)
    await expect(page.locator(`${FILE} .sect`).nth(0).locator('dd').first()).not.toHaveText(flying!)

    // Turn back one: the page of the agent that flew, read-only, still theirs.
    await page.locator(`${FILE} .pg-nav .pg-turn`).first().click()
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('2 / 3')
    await expect(page.locator(`${FILE} .sect`).nth(0).locator('dd').first()).toHaveText(flying!)
    await expect(page.locator(`${FILE} .sect`).nth(1).locator('.sect-flag')).toHaveText('열람')
    // x5 — one paragraph, not two bordered cells. The claim is unchanged: the
    // page holds exactly what that sitting flew, in order, and it reads the
    // sentences themselves rather than an id or a placeholder. Both spans are
    // checked, so a paragraph that lost a sentence still fails.
    await expect(page.locator(`${FILE} .filed-cell`)).toHaveCount(0)
    await expect(page.locator(`${FILE} .filed-para`)).toHaveCount(1)
    await expect(page.locator(`${FILE} .filed-s`)).toHaveCount(2)
    await expect(page.locator(`${FILE} .filed-s`).first()).toHaveText(SEEDS[0].text)
    await expect(page.locator(`${FILE} .filed-s`).last()).toHaveText(SEEDS[1].text)
    // …and no slot number survived the boxes.
    await expect(page.locator(`${FILE} .filed-no`)).toHaveCount(0)

    // A past page is not a board, carries no gesture, and anchors no thread.
    await expect(page.locator(`${FILE} #slotBoard`)).toHaveCount(0)
    await expect(page.locator(`${FILE} .slot-unset`)).toHaveCount(0)
    await expect(page.locator(`${FILE} [data-block-id]`)).toHaveCount(0)
  })

  /**
   * H3 (08-09) — WHEN the page turns, which (a) above could not see.
   *
   * (a) closes the day and presses in one helper call (`newRun`), so it read the
   * same three pages whether they appeared at 21:04 or a press later. They
   * appeared a press later, and that press is where a whole sitting went wrong:
   * the operator mined the day's report into a file headed with the callsign of
   * the agent who had just come home, pressed, and watched the page they had
   * been working on re-head itself to the NEXT agent while a second page
   * carrying the same callsign appeared behind it. Over an allotment the pages
   * they built on read ECHO-1, ECHO-1, ECHO-2, ECHO-3 — the last agent never got
   * a page to be outfitted on at all (measured against the shipped build, 08-09).
   *
   * So the claim is about the close and nothing else: at 21:04, before any
   * press, the day that ended is a record and the file in hand is the next
   * agent's.
   */
  test('[H3] (b) the page turns when the day settles, and the press names it', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[0].id, 0)

    const callsign = (): Promise<string | null> =>
      page.locator(`${FILE} .sect`).nth(0).locator('dd').first().textContent()
    const flying = await callsign()
    expect(flying, '식별 carries no callsign to fly').toMatch(CALLSIGN)

    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'deployed')
    // Still two pages while the day runs: the agent on the desk has not landed.
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('2 / 2')

    // 21:04 — and NO press. `drain` is `newRun` without its click.
    await drain(page)
    await expect(page.locator('#w-file #btnDeploy')).toHaveAttribute('data-op', 'new_run', {
      timeout: 30_000,
    })

    // The document grew a page and the desk turned to it, all before the press.
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('3 / 3')
    // …and it is UNNAMED. H3's second half (08-09, 민서): the page opens with
    // its 호출부호 row blank, because the run loop has not issued the next
    // callsign and the desk will not print a name it cannot promise to send.
    // The press is what fills it in — asserted at the bottom of this test.
    expect(await callsign(), 'the incoming page was headed before anyone was sent').toBe('')
    // …and it is the file that agent flew, handed on intact — this is what the
    // operator revises, not a blank board. Asserted on the BOARD's text rather
    // than by counting `[data-block-id]`: a seated sentence carries that
    // attribute on more than one node (the cell and its thread anchor, see
    // `(e) the pin anchor writes data-block-id from the model`), and the claim
    // here is about the handover being present, not about its markup.
    await expect(page.locator(`${FILE} #slotBoard`)).toContainText(SEEDS[0].text)

    // One page back: the sitting that just ended, read-only, holding what went
    // out with it.
    await page.locator(`${FILE} .pg-nav .pg-turn`).first().click()
    await expect(page.locator(`${FILE} .sect`).nth(0).locator('dd').first()).toHaveText(flying!)
    await expect(page.locator(`${FILE} .filed-s`)).toHaveCount(1)
    await expect(page.locator(`${FILE} .filed-s`).first()).toHaveText(SEEDS[0].text)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()

    // The press commits it — and turns nothing. Same page count: the document
    // grew when the day settled, not when the operator pressed.
    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-op', 'deploy', { timeout: 20_000 })
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('3 / 3')

    // …and NOW the page has an occupant. The name types itself on across the
    // press (`typeCallsign`), so this polls rather than reading once: what is
    // being asserted is that the blank page ends up named, and named with an
    // agent who is neither the one who flew nor a repeat of them.
    await expect
      .poll(async () => await callsign(), { timeout: 20_000 })
      .toMatch(CALLSIGN)
    expect(await callsign(), 'the new page was headed by the agent who already flew').not.toBe(flying)
  })
})

/* ══ x7 · the document is headed, and the cover prints itself ═════════════
   Two claims, both about the page BEFORE anything is pressed: every sheet of
   the file says which file it is, and the cover is something the operator is
   made to read rather than something they are handed whole.
   ═══════════════════════════════════════════════════════════════════════ */

test.describe('[x7] every page is headed, and the cover types itself out', () => {
  /**
   * The head was on the COVER alone, and that is the defect this pins.
   *
   * `pages()` built one `.file-head` element in the window's closure and
   * appended it to page 0; the filed pages and the agent's page got none, so a
   * reader who turned past the cover was holding unheaded sheets. The naive fix
   * is the trap: appending that same node to three pages MOVES it, and the last
   * page built would be the only one with a head — which looks right in whatever
   * page the test happens to check and is wrong on every other. So this walks
   * the WHOLE document, and it drives a third page into existence first, because
   * two pages cannot tell a per-page head from a moved one.
   */
  test('[x7] (a) 문서번호 and 현장 요원 운용 파일 head every page of the file', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    // A filed page, so the document is three sheets: cover · a sitting that is
    // over · the agent on the desk.
    await newRun(page)

    const counted = (await page.locator(`${FILE} .pg-count`).textContent()) ?? ''
    const total = Number(counted.split('/')[1]?.trim() ?? '0')
    expect(total, `the file did not grow a filed page: ${counted}`).toBeGreaterThanOrEqual(3)

    const prev = page.locator(`${FILE} .pg-nav .pg-turn`).first()
    const next = page.locator(`${FILE} .pg-nav .pg-turn`).last()
    // Back to the cover, bounded — never `while (isEnabled)`, which is an
    // infinite loop on the day the control stops disabling itself.
    for (let i = 0; i < total; i += 1) if (await prev.isEnabled()) await prev.click()
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText(`1 / ${total}`)

    for (let i = 0; i < total; i += 1) {
      // Exactly one: a head per page, and one page mounted at a time (C1).
      await expect(page.locator(`${FILE} .file-head`), `page ${i + 1} is not headed`).toHaveCount(1)
      await expect(page.locator(`${FILE} .fh-doc`)).toHaveText(DOC_LINE)
      await expect(page.locator(`${FILE} .fh-title`)).toHaveText('현장 요원 운용 파일')
      if (i < total - 1) await next.click()
    }
  })

  /**
   * The reveal itself — booted RAW, because `boot()` above presses the skip.
   *
   * What is asserted is the shape of it and not its pace: the cover arrives
   * incomplete, the title block does not, the one control lands it, and the
   * control leaves with the job. Timings are never equalities here — the reveal
   * is decoration and a loaded CI box must not turn a beat into a red build.
   */
  test('[x7] (b) the cover arrives a character at a time, and 건너뛰기 lands it whole', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator(FILE)).toBeVisible()
    await expect(page.locator(`${FILE} .sect`)).toHaveCount(3)

    const skip = page.locator(SKIP)
    await expect(skip, 'the cover offered no way past its own reveal').toBeVisible()
    await expect(skip).toHaveText('건너뛰기')
    // A real button, or the desk's a11y census fails it — and a div with a
    // click handler is exactly what that census exists to catch.
    expect(await skip.evaluate((node) => node.tagName.toLowerCase())).toBe('button')
    expect(
      await skip.evaluate((node) => getComputedStyle(node).textDecorationLine),
      'the skip is not underlined',
    ).toContain('underline')

    // The dossier is still printing; the title block never does.
    const dossier = page.locator(`${FILE} #dossier`)
    const printing = ((await dossier.textContent()) ?? '').length
    await expect(page.locator(`${FILE} .fh-doc`)).toHaveText(DOC_LINE)
    await expect(page.locator(`${FILE} .fh-title`)).toHaveText('현장 요원 운용 파일')

    await skip.click()
    await expect(skip, 'the spent control stayed on the page').toHaveCount(0)

    const whole = ((await dossier.textContent()) ?? '').length
    expect(whole, 'the skip printed no more of the cover than was already there').toBeGreaterThan(printing)
    // …and it is FINISHED, not merely further on: nothing more arrives after it.
    await page.waitForTimeout(1_200)
    expect(((await dossier.textContent()) ?? '').length).toBe(whole)

    // Keyboard alone reaches it, which is the half a mouse test cannot see.
    await page.goto('./')
    await expect(page.locator(SKIP)).toBeVisible()
    await page.locator(SKIP).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(SKIP)).toHaveCount(0)
  })

  /**
   * The two contracts that are NOT skips.
   *
   * `prefers-reduced-motion: reduce` and the determinism gate are answered by
   * the same `motionless()` the callsign reveal uses, and both mean the same
   * thing here: the document is whole from the first paint and no character of
   * it is ever typed. The control is not offered either — a skip for a reveal
   * that never runs is a dead button.
   */
  test('[x7] (c) under reduced motion the cover is whole, and nothing types', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')
    await expect(page.locator(FILE)).toBeVisible()
    await expect(page.locator(`${FILE} .sect`)).toHaveCount(3)

    const dossier = page.locator(`${FILE} #dossier`)
    const first = ((await dossier.textContent()) ?? '').length
    // Substantial, not merely equal to itself a moment later: a cover blanked
    // by a reveal that then never ran would also be stable.
    expect(first, 'the cover came up empty under reduced motion').toBeGreaterThan(100)
    await expect(page.locator(SKIP), 'a skip was offered for a reveal that never runs').toHaveCount(0)

    await page.waitForTimeout(1_200)
    expect(
      ((await dossier.textContent()) ?? '').length,
      'the cover was still arriving under reduced motion',
    ).toBe(first)
  })
})

/* ══ x2 · the confirmation plate ══════════════════════════════════════════
   The press asks before it commits. What is asserted here is the SHAPE of the
   question — that it is a question and not a window, that it has exactly two
   ways out, and that the one that says no leaves the desk untouched.
   ═══════════════════════════════════════════════════════════════════════ */

const PLATE = '#confirm'

/**
 * The driver's clock fields, read straight off `window.__shell`.
 *
 * `harness.ts`'s own `Frame` models the SEAM (events + store) and does not
 * carry the clock, so the clock half is read here the way `shell.spec.ts`
 * reads it. What it is for: W4 made a committed file the one thing that starts
 * the day, which makes the clock the honest witness to whether a refused
 * commit committed anything.
 */
async function clockFrame(page: Page): Promise<{ minute: number; rate: number }> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { frame(): unknown } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    return handle.frame() as never
  })
}

test.describe('[x2] DEPLOY asks before it commits', () => {
  test('[x2] (a) the press raises a centred plate that is not a window', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await page.locator('#btnDeploy').click()

    const plate = page.locator(PLATE)
    await expect(plate).toBeVisible()
    // A question, not furniture: no `.win` skin, no title-bar controls, and it
    // never enters the taskbar the window manager owns.
    await expect(page.locator(`${PLATE} .win`)).toHaveCount(0)
    await expect(page.locator(`${PLATE} .win-ctl`)).toHaveCount(0)
    await expect(page.locator(`${PLATE} .win-grip`)).toHaveCount(0)
    await expect(page.locator('#taskbar .task', { hasText: '배치 확인' })).toHaveCount(0)
    await expect(plate).toHaveAttribute('role', 'alertdialog')
    await expect(plate).toHaveAttribute('aria-modal', 'true')

    // Centred on the screen — the plate's midpoint is the viewport's. Measured
    // once it has SETTLED: `cfRise` opens from `translateY(14px)`, and a box
    // read mid-animation is the entry, not the position.
    await page.locator(`${PLATE} .cf-plate`).evaluate(async (n) => {
      await Promise.all(n.getAnimations().map((a) => a.finished))
    })
    const box = (await page.locator(`${PLATE} .cf-plate`).boundingBox())!
    const view = page.viewportSize()!
    expect(Math.abs(box.x + box.width / 2 - view.width / 2), 'the plate is off-centre horizontally').toBeLessThan(2)
    expect(Math.abs(box.y + box.height / 2 - view.height / 2), 'the plate is off-centre vertically').toBeLessThan(2)
  })

  test('[x2] (b) it offers exactly two answers and no way to dismiss it', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await page.locator('#btnDeploy').click()

    const buttons = page.locator(`${PLATE} button`)
    await expect(buttons).toHaveCount(2)
    // x5 — the answers NAME THE ACT. 예 / 아니오 answered a question about the
    // operator's own work ('인수인계 사항을 잘 작성하셨나요?'), where the honest
    // answer at the moment you press DEPLOY is always 예; 취소 / 파견 answer what
    // the plate now states. The plate also names the agent it is about to send.
    await expect(page.locator('#confirmNo')).toHaveText('취소')
    await expect(page.locator('#confirmYes')).toHaveText('파견')
    await expect(page.locator('#cf-body')).toContainText(/ECHO(?:-\d+)?/)
    // 취소 holds the focus: the reflex keystroke on an irreversible act must
    // not be the one that confirms it.
    await expect(page.locator('#confirmNo')).toBeFocused()
    // The desk behind it cannot be reached while the question is up.
    await expect(page.locator('#desktop')).toHaveAttribute('inert', '')
    await expect(page.locator('#topbar')).toHaveAttribute('inert', '')
  })

  test('[x2] (c) 아니오 closes the plate and commits nothing', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[0].id, 0)

    const held = (await clockFrame(page)).minute
    await page.locator('#btnDeploy').click()
    await confirmDeploy(page, 'no')

    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator('#deployStamp')).not.toHaveClass(/\bon\b/)
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'ready')
    await expect(page.locator('#btnDeploy')).toBeEnabled()
    await expect(page.locator(`${FILE} .slots`)).not.toHaveAttribute('data-state', 'locked')
    // W4 — a committed file is the only thing that starts the day, so a refused
    // commit leaves the clock exactly where it was.
    expect((await clockFrame(page)).rate, 'the day started on a refused commit').toBe(0)
    expect((await clockFrame(page)).minute).toBe(held)
    expect((await seamStore(page)).deployed, 'a refused commit reached the seam').toEqual([])
    // …and the desk is handed back.
    await expect(page.locator('#desktop')).not.toHaveAttribute('inert', '')
  })

  test('[x2] (d) Escape answers 아니오 — a modal with no exit is a keyboard trap', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await page.locator('#btnDeploy').click()
    await expect(page.locator(PLATE)).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator('#deployStamp')).not.toHaveClass(/\bon\b/)
    await expect(page.locator('#btnDeploy')).toBeEnabled()
  })

  test('[x2] (e) 예 closes the plate and the commit lands', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await page.locator('#btnDeploy').click()
    await confirmDeploy(page)

    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator('#deployStamp')).toHaveClass(/\bon\b/)
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'deployed')
    await expect.poll(async () => (await clockFrame(page)).rate, { timeout: 2000 }).toBe(1)
  })

  test('[x2] (f) the plate opens no free-text surface (spec-client §3 inv 1)', async ({ page }) => {
    await boot(page)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await page.locator('#btnDeploy').click()
    await expect(page.locator(PLATE)).toBeVisible()

    await expect(page.locator(`${PLATE} input, ${PLATE} textarea, ${PLATE} select, ${PLATE} form`)).toHaveCount(0)
    expect(
      await page.locator(PLATE).evaluate((n) => n.querySelectorAll('[contenteditable]').length),
    ).toBe(0)
  })
})
