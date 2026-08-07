# g5-1 — T1: BLOCK STORE dissolves — the report is the pick surface

> plan-playtest v12 · citations bind to `fa49be6` · branch `playtest/g5-1-t1-store`
> commit message: `playtest(T1): BLOCK STORE dissolves — a mined sentence in REPORTS is the pick`

## Outcome

The BLOCK STORE window is gone. The desk is three windows. The core loop
survives whole through one moved affordance: **clicking (or Enter on) a mined
sentence in REPORTS arms the pick**, and the AGENT FILE's existing seat button
consumes it — the slot board stays the only membrane owner, and no new op path
appears. Everything else the store showed is already elsewhere: carried
sentences render as slotted marks in the archived reports, and the file's
`n / 4` count carries the at-cap signal. REPORTS takes the store's share of the
middle column, full height.

Design facts the edits rest on (verified 08-08): the store sends **zero**
membrane ops — its header says so (`block-store.ts:10-16`); its two real jobs
are rendering the deck and arming `pickedBlockId`. Deleting it breaks exactly
one loop-critical path — nothing else arms the pick — and that is what the
REPORTS edit restores.

## Scope

Files deleted (each replaced by nothing):
- `src/client/windows/block-store.ts`
- `src/client/components/species-filter.ts` (block-store was its only importer)
- `src/client/styles/win-block-store.css`
- `tests/windows/block-store.test.ts`
- `e2e/block-store.spec.ts`
- `e2e/reference-shots/win-block-store.png`

Files modified:
- `src/client/windows/reports.ts` · `src/client/components/minable-sentence.ts`
- `src/client/shell/window-registry.ts` · `src/client/shell/layout.ts`
- `src/client/styles/index.css` · `src/client/shell/manual.ts`
- `tests/shell/shell-utils.ts` · `tests/styles/css-utils.ts`
- `tests/styles/stacking-context.test.ts` · `tests/assets/baseline/u1-styles-baseline.json`
- `tests/assets/fonts-css.test.ts` · `tests/styles/index-order.test.ts`
- `tests/windows/agent-file.test.ts`
- `tests/shell/apply-layout.test.ts` · `tests/windows/slot-cap.test.ts` (**new**)
- `e2e/fixtures/selectors.ts` · `e2e/fixtures/harness.ts` · `e2e/shell.spec.ts`
- `e2e/a11y.spec.ts` · `e2e/captures.spec.ts` · `e2e/acceptance.spec.ts`
- `e2e/run-loop.spec.ts` · `e2e/reports.spec.ts`

Must NOT modify:
- `src/client/components/block-card.ts` — M2 removed the species *display*
  only; `SPECIES_DISPLAY` (`:33`) is still exported and asserted
  (`agent-file.test.ts:611-617`). `buildBlockCard`, `pad2`,
  `setPickedBlockId`/`pickedBlockId` all stay.
- `src/client/components/slot-board.ts` — the membrane owner, untouched;
  `agent-file.test.ts` and `block-store.test.ts` both guard it, and the
  surviving guard stays.
- `src/client/shell/window-manager.ts` — reads `WINDOW_KEYS`/`DESK_ORDER`
  generically.
- `tests/windows/reports.test.ts:605` and `tests/windows/live-feed.test.ts:450`,
  `tests/windows/tally.test.ts:697` — negative guards that merely *name*
  block-store in a regex; they stay green and stay put.

Consciously dropped, not re-homed (each has surviving coverage): the store's
at-cap card styling (the file's `n / 4` count carries the signal), the
deployed-lock e2e drive (planOps' refusal is unit-covered), drop-to-store
unslot (a duplicate of `.slot-unset`), the deck census and empty-state copy,
and the species filter (deliberately retired).

Shared-file note: `tests/windows/agent-file.test.ts` is also edited by g6-1
(`:596-605`) — regions far apart; the author reconciles at merge.

## Change list

Per file; same-file edits bottom-up. Deletions first.

**D1–D6.** Delete the six files listed in Scope. `git rm` each.

**1. `src/client/windows/reports.ts`**

1a. `:105-111` — current:
```
    onMine: (id: string) => {
      const outcome = mine(id, marks())
      for (const op of outcome.ops) driver.send(op)
      view.refresh(marks())
      for (const effect of outcome.effects) view.tear(effect.tear)
    },
```
replace with:
```
    onMine: (id: string) => {
      const m = marks()
      // T1 — the report is the pick surface: a mined sentence arms the pick
      // channel and the AGENT FILE's seat consumes it. `slot-board.ts` stays
      // the only membrane owner; no op is sent from here.
      if (sentenceState(id, m) === 'mined') {
        setPickedBlockId(id)
        return
      }
      const outcome = mine(id, m)
      for (const op of outcome.ops) driver.send(op)
      view.refresh(marks())
      for (const effect of outcome.effects) view.tear(effect.tear)
    },
```

1b. `:22-23` — current:
```
import { deriveMarks, mine } from '../components/minable-sentence.ts'
import type { MarkSets } from '../components/minable-sentence.ts'
```
replace with:
```
import { deriveMarks, mine, sentenceState } from '../components/minable-sentence.ts'
import type { MarkSets } from '../components/minable-sentence.ts'
```

1c. `:31` — current:
```
import { pad2 } from '../components/block-card.ts'
```
replace with:
```
import { pad2, setPickedBlockId } from '../components/block-card.ts'
```

**2. `src/client/components/minable-sentence.ts`** — `:129-133`, current:
```
export function applyState(node: HTMLElement, state: MinableState): void {
  node.className = sentenceClass(state)
  if (state === 'mined') node.setAttribute('aria-disabled', 'true')
  else node.removeAttribute('aria-disabled')
}
```
replace with:
```
export function applyState(node: HTMLElement, state: MinableState): void {
  node.className = sentenceClass(state)
  // T1 — a mined sentence is the pick control, not a dead end; the spent
  // state is `slotted`, whose click is the no-op.
  if (state === 'slotted') node.setAttribute('aria-disabled', 'true')
  else node.removeAttribute('aria-disabled')
}
```

**3. `src/client/shell/window-registry.ts`**

3a. `:39` — current:
```
  { key: 'store', id: 'w-store', en: 'BLOCK STORE', ko: '보관함', sub: '보관함 — 채굴한 문장', tab: 'BS', stock: 'paper card-stock', mount: mountBlockStore },
```
replace with nothing.

3b. `:12` — current:
```
import { mount as mountBlockStore } from '../windows/block-store.ts'
```
replace with nothing.

**4. `src/client/shell/layout.ts`**

4a. `:90-99` — current (first line `  const colH = deskH`):
```
  const colH = deskH
  const hRep = px(colH * REP_RATIO)
  const hStore = Math.max(MIN_H, colH - hRep - GUTTER)

  return {
    feed: { x: GUTTER, y: TOP, w: colA, h: colH },
    rep: { x: xB, y: TOP, w: colB, h: hRep },
    store: { x: xB, y: TOP + hRep + GUTTER, w: colB, h: hStore },
    file: { x: xC, y: TOP, w: colC, h: colH },
  }
```
replace with:
```
  const colH = deskH

  return {
    feed: { x: GUTTER, y: TOP, w: colA, h: colH },
    rep: { x: xB, y: TOP, w: colB, h: colH },
    file: { x: xC, y: TOP, w: colC, h: colH },
  }
```

4b. `:71-74` — current:
```
const COL_A_RATIO = 0.265
const COL_B_RATIO = 0.395
/** REPORTS' share of the middle column's height; BLOCK STORE takes the rest. */
const REP_RATIO = 0.565
```
replace with:
```
const COL_A_RATIO = 0.265
const COL_B_RATIO = 0.395
```

4c. `:50` — current:
```
export const DESK_ORDER: readonly WindowKey[] = ['feed', 'rep', 'file', 'store']
```
replace with:
```
export const DESK_ORDER: readonly WindowKey[] = ['feed', 'rep', 'file']
```

4d. `:33` — current:
```
export const WINDOW_KEYS = ['feed', 'file', 'store', 'rep'] as const
```
replace with:
```
export const WINDOW_KEYS = ['feed', 'file', 'rep'] as const
```
(The stale TALLY/BLOCK STORE prose in the header `:1-31` and `:41` is T3's to
rewrite with the rects — leave it.)

**5. `src/client/styles/index.css:15`** — current:
```
@import './win-block-store.css';
```
replace with nothing.

**6. `src/client/shell/manual.ts:44-46`** — current (inside §2 책상 구성):
```
        '무전(LIVE FEED)은 하루를 실시간으로 받아 적습니다. 부검(REPORTS)은 지나간 시행의 기록입니다. ' +
        '보관함(BLOCK STORE)에는 기록에서 채굴한 문장이 쌓입니다. 요원 파일(AGENT FILE)은 요원을 편성하는 자리이고, ' +
        '집계(TALLY)는 21:04에 열립니다.',
```
replace with:
```
        '무전(LIVE FEED)은 하루를 실시간으로 받아 적습니다. 부검(REPORTS)은 지나간 시행의 기록이고, ' +
        '기록에서 채굴한 문장을 집어 요원 파일의 빈 칸에 앉힙니다. 요원 파일(AGENT FILE)은 요원을 편성하는 자리입니다.',
```
(This body is placeholder copy slated for wholesale replacement by MAN; this
edit only stops it naming two windows that no longer exist.)

**7. `tests/shell/shell-utils.ts`**

7a. `:26` — current:
```
  store: 'block-store.ts',
```
replace with nothing.

7b. `:19` — current:
```
export const WINDOW_KEYS = ['feed', 'file', 'store', 'rep'] as const
```
replace with:
```
export const WINDOW_KEYS = ['feed', 'file', 'rep'] as const
```

**8. `tests/styles/css-utils.ts:20-25`** — current:
```
export const WINDOW_SHEETS = [
  'win-agent-file.css',
  'win-block-store.css',
  'win-live-feed.css',
  'win-reports.css',
] as const
```
replace with:
```
export const WINDOW_SHEETS = [
  'win-agent-file.css',
  'win-live-feed.css',
  'win-reports.css',
] as const
```

**9. `tests/styles/stacking-context.test.ts`**

9a. `:158` — current:
```
    const offenders = ['win-block-store.css', ...['win-agent-file.css', 'win-live-feed.css', 'win-reports.css']]
```
replace with:
```
    const offenders = ['win-agent-file.css', 'win-live-feed.css', 'win-reports.css']
```

9b. `:146` — current:
```
  it('(c) no window-root rule pins a literal z-index (BLOCK STORE must not float)', () => {
```
replace with:
```
  it('(c) no window-root rule pins a literal z-index (no window may float)', () => {
```

9c. `:3-7` — current:
```
// `#desktop` keeps `display:contents` and creates no stacking context of its
// own; BLOCK STORE lives OUTSIDE `#desktop` in the markup, so any context on
// `#desktop` (or on a .win ancestor) would make BLOCK STORE always paint on top
// and break window focus ordering. Every `.win` must be z-ordered by the same
// runtime `--z` custom property.
```
replace with:
```
// `#desktop` keeps `display:contents` and creates no stacking context of its
// own; a context on `#desktop` (or on a .win ancestor) would pin one window
// permanently on top and break window focus ordering. Every `.win` must be
// z-ordered by the same runtime `--z` custom property. (BLOCK STORE, the
// window that once sat outside `#desktop`, was retired by T1.)
```

**10. `tests/assets/baseline/u1-styles-baseline.json`** — two rows, bottom-up.

10a. `:20` — current:
```
    "./win-block-store.css",
```
replace with nothing.

10b. `:10` — current:
```
    "win-block-store.css": "cd42869edb3c94f9b7b7dc4318595dbb34fcfe3ebe0a784af466d31947c08b8f",
```
replace with nothing.

**11. `tests/assets/fonts-css.test.ts`** — the baseline shrinks, so the
u10-range checks need the same treatment U3's `win-tally.css` trim got.
(Corrected after a §5.7 stop: the first issue of this PRD claimed `(f)` needed
no edit — wrong; `(f)` reads `dirAtUnit('u10', …)`, a **frozen git snapshot of
u10's own merge**, where `win-block-store.css` always exists, so trimming the
baseline row makes it read as a spurious addition. The carve-out below mirrors
the file's own `win-tally.css` precedent.) Two edits, bottom-up.

11a. `:207-214` — current (line numbers as the tree stands after edit 10):
```
  it('(f) fonts.css is the only file this unit adds under src/client/styles', () => {
    const added = dirAtUnit('u10', 'src/client/styles')
      .filter((f) => f.endsWith('.css'))
      // The baseline lost its win-tally.css row when U3 retired the live
      // sheet; at u10's own merge it was still a u1 file, not a u10 addition.
      .filter((f) => !Object.keys(baseline().sha256).includes(f) && f !== 'win-tally.css')
    expect(added).toEqual(['fonts.css'])
  })
```
replace with:
```
  it('(f) fonts.css is the only file this unit adds under src/client/styles', () => {
    const added = dirAtUnit('u10', 'src/client/styles')
      .filter((f) => f.endsWith('.css'))
      // The baseline lost its win-tally.css row when U3 retired the live
      // sheet, and its win-block-store.css row when T1 retired that one; at
      // u10's own merge both were still u1 files, not u10 additions.
      .filter(
        (f) =>
          !Object.keys(baseline().sha256).includes(f) &&
          f !== 'win-tally.css' &&
          f !== 'win-block-store.css',
      )
    expect(added).toEqual(['fonts.css'])
  })
```

11b. `:181` — current:
```
  it('(c) index.css keeps u1’s eight imports, in order, unremoved', () => {
```
replace with:
```
  it('(c) index.css keeps u1’s surviving imports, in order, unremoved', () => {
```

**24. `tests/styles/index-order.test.ts:40-49`** — (added after the same §5.7
stop: this file was missing from the first issue's Scope entirely.) The C17
pin derives u1's **frozen** import set from the **live** `WINDOW_SHEETS`
constant, which edit 8 shrinks — the derivation is the bug, so the frozen set
is hard-coded. The hard-coded order equals what the current derivation
produces today, so no order-sensitive assert moves. `WINDOW_SHEETS` stays
imported (still used at `:82`). Current:
```
/**
 * U3 (playtest g3-1) — `WINDOW_SHEETS` (css-utils.ts) now reflects the
 * CURRENT four window sheets: `win-tally.css` was retired when TALLY
 * dissolved into REPORTS and AGENT FILE. The block below pins u1's OWN
 * historical merge — nine sheets on disk, five of them window skins — which
 * is frozen by definition (it reads `fileAtUnit('u1', …)`) and must not move
 * just because a later unit retired one of the five.
 */
const U1_WINDOW_SHEETS = [...WINDOW_SHEETS, 'win-tally.css']
```
replace with:
```
/**
 * U3 (playtest g3-1) retired `win-tally.css`; T1 (playtest g5-1) retired
 * `win-block-store.css` — `WINDOW_SHEETS` (css-utils.ts) now reflects the
 * CURRENT three window sheets. The block below pins u1's OWN historical
 * merge — nine sheets on disk, five of them window skins — which is frozen
 * by definition (it reads `fileAtUnit('u1', …)`) and must not move just
 * because later units retired two of the five. Hard-coded rather than
 * derived: a frozen set must not track a live constant.
 */
const U1_WINDOW_SHEETS = [
  'win-agent-file.css',
  'win-block-store.css',
  'win-live-feed.css',
  'win-reports.css',
  'win-tally.css',
]
```

**12. `tests/windows/agent-file.test.ts`**

12a. `:728-731` — current:
```
  it('(h) c8 — u4 creates block-card.ts and touches no other window', () => {
    expect(exists(BLOCK_CARD_TS)).toBe(true)
    expect(git('diff', '--name-only', 'HEAD', '--', rel(BLOCK_STORE_TS)).trim()).toBe('')
  })
```
replace with:
```
  it('(h) c8 — u4 creates block-card.ts', () => {
    expect(exists(BLOCK_CARD_TS)).toBe(true)
  })
```

12b. `:39` — current:
```
const BLOCK_STORE_TS = path.join(CLIENT, 'windows/block-store.ts')
```
replace with nothing.

**13. `tests/shell/apply-layout.test.ts:104`** — current:
```
    expect(origins.size).toBeGreaterThanOrEqual(4)
```
replace with:
```
    expect(origins.size).toBeGreaterThanOrEqual(3)
```

**14. `tests/windows/slot-cap.test.ts`** — new file (the U2 pin lived in the
deleted suite), exactly:
```ts
// U2 is deferred (plan-playtest §1 Deferred): the C-BLOCK effect was measured
// at ONE injected sentence — the cap does not move without a probe behind it.
// This pin survived tests/windows/block-store.test.ts, which T1 retired.
import { describe, it, expect } from 'vitest'
import { SLOT_CAP } from '../../src/client/components/slot-board.ts'

describe('[t1] the slot cap pin', () => {
  it('SLOT_CAP is 4 until a probe moves it (U2)', () => {
    expect(SLOT_CAP).toBe(4)
  })
})
```

**15. `e2e/fixtures/selectors.ts:73-79`** — current:
```
/* ── store + slots (items 5, 10) ─────────────────────────────────────────── */
export const STORE = {
  list: '#w-store #storeList',
  empty: '#w-store #storeEmpty',
  filter: '#w-store #storeFilter',
  card: '#w-store #storeList .bcard',
} as const
```
replace with:
```
/* ── slots (items 5, 10) ─────────────────────────────────────────────────── */
```

**16. `e2e/fixtures/harness.ts:242-246`** — current:
```
/** Seats `blockId` in `slot` through the store card, keyboard-free. */
export async function slotBlock(page: Page, blockId: string, slot = 0): Promise<void> {
  await page.locator(`#w-store #storeList .bcard[data-block="${blockId}"]`).click()
  await page.locator(`#w-file .slot[data-slot="${slot}"]`).click()
}
```
replace with:
```
/** Seats `blockId` in `slot`: pick it in REPORTS, seat it in the file (T1). */
export async function slotBlock(page: Page, blockId: string, slot = 0): Promise<void> {
  await page.locator(`#w-rep [data-sentence-id="${blockId}"]`).first().click()
  await page.locator(`#w-file .slot[data-slot="${slot}"]`).click()
}
```

**17. `e2e/shell.spec.ts`** — bottom-up.

17a. `:735` — current:
```
    const node = win(page, 'w-store')
```
replace with:
```
    const node = win(page, 'w-feed')
```

17b. `:542-571` — the test whose first line is
`  test('single stacking context — raising BLOCK STORE puts it above AGENT FILE', async ({ page }) => {`
— replace the **whole test block** (through its closing `  })`) with:
```
  test('single stacking context — raising REPORTS puts it above AGENT FILE', async ({ page }) => {
    const rep = win(page, 'w-rep')
    const file = win(page, 'w-file')

    // Park REPORTS on top of AGENT FILE so the two genuinely overlap.
    const fileBox = await box(file)
    const repBar = await box(rep.locator('.win-bar'))
    const repBox = await box(rep)
    await dragFrom(
      page,
      repBar,
      fileBox.x + 40 - repBox.x,
      fileBox.y + 40 - repBox.y,
    )

    const probe = { x: fileBox.x + 90, y: fileBox.y + 90 }
    const topAt = async (): Promise<string> =>
      page.evaluate(
        (p) => document.elementFromPoint(p.x, p.y)?.closest('.win')?.id ?? 'none',
        probe,
      )

    await rep.locator('.win-bar').click({ position: { x: 20, y: 8 } })
    expect(await topAt()).toBe('w-rep')

    await file.locator('.win-bar').click({ position: { x: 20, y: 8 } })
    expect(await topAt()).toBe('w-file')

    await rep.locator('.win-bar').click({ position: { x: 20, y: 8 } })
    expect(await topAt()).toBe('w-rep')
  })
```

17c. `:360` — current:
```
    expect(origins.size).toBeGreaterThanOrEqual(4)
```
replace with:
```
    expect(origins.size).toBeGreaterThanOrEqual(3)
```

17d. `:232-236` — current (opening of the raise-before-hide test):
```
    const store = win(page, 'w-store')
    const task = page.locator('.task[data-win="store"]')

    // Focus something else, so BLOCK STORE is open but not focused.
    await win(page, 'w-file').locator('.win-bar').click()
```
replace with:
```
    const store = win(page, 'w-feed')
    const task = page.locator('.task[data-win="feed"]')

    // Focus something else, so LIVE FEED is open but not focused.
    await win(page, 'w-file').locator('.win-bar').click()
```
(The rest of that test reads through the `store`/`task` locals and needs no
further edit.)

17e. `:219-220` — current (opening of the taskbar-reopen test):
```
    const node = win(page, 'w-store')
    const task = page.locator('.task[data-win="store"]')
```
replace with:
```
    const node = win(page, 'w-feed')
    const task = page.locator('.task[data-win="feed"]')
```

17f. `:215` — current:
```
    await expect(page.locator('.task')).toHaveCount(4)
```
replace with:
```
    await expect(page.locator('.task')).toHaveCount(3)
```

17g. `:31` — current:
```
  { key: 'store', id: 'w-store' },
```
replace with nothing.

**18. `e2e/a11y.spec.ts`** — bottom-up.

18a. `:584` — current:
```
    const node = page.locator('#w-store')
```
replace with:
```
    const node = page.locator('#w-feed')
```

18b. `:403-424` — in the resize test, five lines carry `#w-store`; each becomes
`#w-rep`. Current lines and replacements, bottom-up:
- `:424` `    const topAfter = await page.locator('#w-store').evaluate((n) => Math.round(n.getBoundingClientRect().top))`
  → same text with `'#w-rep'`.
- `:422` `    const topBefore = await page.locator('#w-store').evaluate((n) => Math.round(n.getBoundingClientRect().top))`
  → same text with `'#w-rep'`.
- `:410` `      page.locator('#w-store').evaluate((n) => {`
  → same text with `'#w-rep'`.
- `:403` `    const bar = page.locator('#w-store .win-bar')`
  → same text with `'#w-rep .win-bar'`.

18c. `:362-363` — current (inside the membrane census drive):
```
    await raiseWindow(page, 'store')
    await page.locator('#storeList .bcard').first().click()
```
replace with (the first click on the line above mined the sentence; the second
click on the same anchor arms the pick):
```
    await page.locator('[data-op="mine"]').first().click()
```

18d. `:31` — current:
```
const WINDOW_IDS = ['w-feed', 'w-file', 'w-store', 'w-rep'] as const
```
replace with:
```
const WINDOW_IDS = ['w-feed', 'w-file', 'w-rep'] as const
```

**19. `e2e/captures.spec.ts:115`** — current:
```
      { name: 'win-block-store', selector: '#w-store' },
```
replace with nothing. (`e2e/reference-shots/win-block-store.png` is deleted in
D6; the manifest test asserts names one-for-one, so both sides shrink
together.)

**20. `e2e/acceptance.spec.ts`** — bottom-up.

20a. `:236` — current:
```
    await expect(page.locator(`${STORE.list} .bcard[data-block="${id}"]`)).toHaveCount(1)
```
replace with nothing.

20b. `:35` — current:
```
  STORE,
```
replace with nothing. (If any other `STORE.` reference remains in this file
after 20a, that is a stop — report it.)

**21. `e2e/run-loop.spec.ts`** — two edits, bottom-up. (Corrected after a
§5.7 stop: this file imports nothing from `./fixtures/harness.ts` — its
helpers are local — so `raiseWindow` needs a new import line, given below.)

21a. `:360-363` — current:
```
    const onDesk = await page
      .locator('#w-store [data-block]')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.block ?? ''))
    for (const id of onDesk) expect(emitted.carried, `${id} is on the desk but not in meta.carried`).toContain(id)
```
replace with:
```
    await raiseWindow(page, 'rep')
    await page.locator('#w-rep .arch-rail [role="option"]').first().click()
    for (const id of emitted.carried) {
      await expect(
        page.locator(`#w-rep [data-sentence-id="${id}"]`).first(),
        `${id} is carried but shows no slotted mark in the filed report`,
      ).toHaveClass(/\bslotted\b/)
    }
```

21b. `:17-18` — current:
```
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
```
replace with:
```
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
import { raiseWindow } from './fixtures/harness.ts'
```

**22. `e2e/reports.spec.ts`** — two edits.

22a. `:22` — current:
```
import { awaitRecordFinal, raiseWindow } from './fixtures/harness.ts'
```
replace with:
```
import { awaitRecordFinal, mineFirst, raiseWindow, slotBlock } from './fixtures/harness.ts'
```
(Corrected after a §5.7 stop: `frame` is deliberately NOT imported —
`e2e/reports.spec.ts:78` already declares its own local
`async function frame(page: Page): Promise<Frame>` reading
`window.__shell.frame()`, and the appended tests in 22b bind to that local
declaration. `mineFirst` and `slotBlock` have no local declarations —
verified — so only they are imported.)

22b. Append at the very end of the file:
```
/* ── T1 — the report is the pick surface; the store window is gone ───────── */

test.describe('slotting from the report (T1)', () => {
  test('clicking a mined sentence then a seat slots it, by id', async ({ page }) => {
    const id = await mineFirst(page)
    await slotBlock(page, id, 0)
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBe(id)
    await raiseWindow(page, 'rep')
    await expect(page.locator(`${REP} [data-sentence-id="${id}"]`).first()).toHaveClass(/\bslotted\b/)
  })

  test('a11y — slotting and unslotting complete with the keyboard alone, zero pointer events', async ({ page }) => {
    const id = await mineFirst(page)
    await page.evaluate(() => {
      const win = window as unknown as { __pointerEvents?: number }
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
    await page.locator(`${REP} [data-sentence-id="${id}"]`).first().focus()
    await page.keyboard.press('Enter')
    await page.locator('#w-file .slot[data-slot="0"] .slot-target').focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBe(id)
    await page.locator('#w-file .slot[data-slot="0"] .slot-unset').focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBeUndefined()
    await expect(page.locator(`${REP} [data-sentence-id="${id}"]`).first()).toHaveClass(/\bmined\b/)
    expect(
      await page.evaluate(() => (window as unknown as { __pointerEvents?: number }).__pointerEvents),
      'the keyboard path fired a pointer event',
    ).toBe(0)
  })
})
```

**23. `e2e/reports.spec.ts` — the mined-aria test.** The test at `:617`
(`test('a11y — a mined sentence announces itself as disabled and re-mining is a no-op', …`)
asserts `aria-disabled` on a mined anchor (`:623`), which edit 2 just moved to
`slotted`. Replace the test's title line and the single assert line:
- `:623` — current:
```
    await expect(node).toHaveAttribute('aria-disabled', 'true')
```
replace with:
```
    await expect(node).not.toHaveAttribute('aria-disabled', 'true')
```
- `:617` — current:
```
  test('a11y — a mined sentence announces itself as disabled and re-mining is a no-op', async ({ page }) => {
```
replace with:
```
  test('a11y — a mined sentence stays enabled (it is the pick) and re-mining is a no-op', async ({ page }) => {
```
(The rest of that test asserts the mine op is not doubled — still true: the
second activation arms the pick and sends nothing.)

**25. `e2e/fixtures/selectors.ts`** — (added after a §5.7 stop: this file
carries a SECOND window vocabulary independent of the `STORE` block item 15
retired — the `WINDOWS` object and its `WINDOW_IDS`, consumed by
`e2e/acceptance.spec.ts:417`'s loop over `Object.values(WINDOWS)`.) Two
edits, bottom-up.

25a. `:18` — current:
```
export const WINDOW_IDS = ['w-feed', 'w-file', 'w-rep', 'w-store'] as const
```
replace with:
```
export const WINDOW_IDS = ['w-feed', 'w-file', 'w-rep'] as const
```

25b. `:11` — current:
```
  store: '#w-store',
```
replace with nothing.

**26. `e2e/debug-pane.spec.ts:37`** — (same stop: this file's own local
window inventory, driving its loop at `:173`.) Current:
```
const WINDOW_IDS = ['w-feed', 'w-file', 'w-store', 'w-rep'] as const
```
replace with:
```
const WINDOW_IDS = ['w-feed', 'w-file', 'w-rep'] as const
```

## Invariants

- **`planOps` stays the only membrane rule set** (`slot-board.ts:11-12` — a
  second `slot`-op sender desyncs the board). The REPORTS edit arms the pick
  and sends nothing.
- **`window-registry.ts` is the only module importing `windows/`** — removing
  the row and the import together is what keeps the window from mounting.
- **`DESK_ORDER` moves with the rects** (WCAG 2.4.3; the a11y focus-order
  assert is live, not quarantined).
- **Structure tests assert the working tree** — `agent-file.test.ts`'s
  remaining `git diff` guards are emptied by committing; run the suites
  **after** `git rm`/edits are staged-committed if a diff-guard reds on the
  uncommitted tree (plan §5.4).
- **A merge commits untracked files** — stage by path, never `git add -A`.
- **The membrane rule** — no free-text surface appears.

## Verification

1. `npm run check` — green.
2. `npx vitest run` — green (if a `git diff` structure guard is red before the
   commit exists, commit first, then re-run — §5.4).
3. `npm run build` — green; `grep -rn "block-store\|w-store" dist/assets/*.js`
   prints nothing.

The full Playwright pass is the **author's**, run serially on the merge
preview (four executors sharing ports would collide). Do not run `npx
playwright test` in this worktree.

## Done when

- [ ] `npm run check`, `npx vitest run`, `npm run build` all exit 0.
- [ ] `git ls-files | grep -i "block-store\|species-filter"` prints nothing.
- [ ] (Corrected wording after a §5.7 stop.)
      `grep -rn "w-store\|block-store" src/ tests/ e2e/ --include="*.ts"`
      prints **no executable-code line** — every survivor is either one of the
      three negative-guard regexes named in Scope (`reports.test.ts:605`,
      `live-feed.test.ts:450`, `tally.test.ts:697`), a frozen-history pin this
      PRD itself added (items 11a, 14, 24), or a prose comment. In particular
      `e2e/debug-pane.spec.ts` and `e2e/fixtures/selectors.ts` contain **zero**
      hits.
- [ ] Behavioural: in a served build (`?signin=skip`), the desk shows three
      windows; after a report files, clicking a sentence mines it, clicking it
      again then clicking an empty seat in AGENT FILE seats it, and the seat's
      `.slot-unset` returns it to mined.
- [ ] Exactly one code commit on `playtest/g5-1-t1-store`, nothing pushed.

## As executed — author amendments after the merge-preview e2e (08-08)

The executor's run stopped four times, each a PRD defect (items 21, 22a, 11/24,
25/26 record the corrections). After the wave-A merge preview, three author
commits landed on the branch beyond the change list:

- `8762ec4` — shell/preview-smoke three-window arithmetic (5 count sites + one
  title); the appended slotting tests gained the `boot + drain + raiseWindow`
  beforeEach they were missing; the carried test's DOM half was **retired to
  U5.1** (report bodies from pre-boot runs are persisted nowhere, so no
  document can carry the marks yet) — the seam round-trip asserts stay.
- `2ec0f02` — `harness.boot()`'s shared four-window census (it gated every
  [dev]-lane spec) and captures' mount gate count three.
- `01b38ff` — acceptance #9 drags REPORTS **up** (full-height REPORTS puts the
  corner grip below an 800px viewport when dragged down); the shot manifest
  counts nine references.

Follow-up, non-blocking: the nine reference shots are name-paired, not
pixel-compared, and are now visually stale (three windows, ECHO labels) —
regenerate with `CAPTURE_BASELINE=1 SHOT_OUT=e2e/reference-shots npx
playwright test captures` after the wave merges.

## If this PRD is wrong

```
An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
```
