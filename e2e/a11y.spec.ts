// [u9#c5] PRD §4 a11y asserts — the P1-D structural suite's browser half.
//
// Three things the PRD names:
//   • membrane ops (slot · unslot · mine · deploy · new_run) and window
//     controls are keyboard-reachable;
//   • landmarks/roles are present on the chrome and on each window;
//   • focus order follows visual order at 1280×800.
//
// It also carries the RENDERED-DOM half of inv 1 and inv 2. vitest runs in
// `environment: 'node'` (`vitest.config.ts`), so `tests/invariants/*` can only
// read source from disk; the "…and rendered DOM" clause of [u9#c1] and the
// selector-scoped clause of [u9#c2] can only be honoured in a browser, and
// this file is the only browser file u9 owns.
//
// SCOPE (P1-D scoping rule, [u9#c6]): **unit-scoped, forward-binding**. u4–u8
// are out of scope for this run (C1: blocked on `src/shared/segment.ts`), so no
// membrane-op control exists on the desk yet. The membrane asserts are
// therefore written as *universally quantified over whatever exists*: every
// `[data-op]` control found must be keyboard-reachable, and the census assert
// records how many were found rather than demanding five. They pass on the
// tree at u9's merge and tighten by themselves the moment u4/u6/u7 land.
//
// Titles are load-bearing — [u9#c5]'s verification runs this whole file, and
// `-g` filters in later units may target these describe names.
import { expect, test } from 'playwright/test'
import { awaitRecordFinal, drain, raiseWindow, turnToAgent } from './fixtures/harness.ts'
import type { Page } from 'playwright/test'
import { hideDebugPane } from './fixtures/dev-surface.ts'

/** The four windows, in the taskbar order `window-registry.ts` emits. */
const WINDOW_IDS = ['w-feed', 'w-file', 'w-rep'] as const

/** spec §5.2 `MembraneOp` — the entire player input vocabulary (inv 1 / C11). */
const MEMBRANE_OPS = ['slot', 'unslot', 'mine', 'deploy', 'new_run'] as const

/** Any control that claims to perform a membrane op, however it is marked up. */
const MEMBRANE_SELECTOR = MEMBRANE_OPS.map((op) => `[data-op="${op}"]`).join(', ')

/** NPC channels (spec §3 inv 2). The clock stamp `.fl-t` is chrome, excluded. */
const NPC_TEXT_SELECTOR = '.fl-npc .fl-c, .fl-symptom .fl-c'
/** Digit-bearing surfaces that are score or chrome, never NPC state. */
/* x4 — the ledger's table became record lines; the exclusion follows the
   selectors that actually carry score digits. Kept in step with
   `EXCLUDED_SELECTORS` in `tests/invariants/no-digit-npc.test.ts`. */
const EXCLUDED_DIGIT_SELECTOR = '.fl-t, .clk-digits, .tb-clock, .dd-value, .dd-runs, .ledger, .tly-lines, .tly-line'

// C15 / C17 / [u11#c12] — RE-AIMED (08-04), never deleted. This helper waited
// for all FIVE windows to be VISIBLE. `#w-tally` boots `class="win hidden"` and
// comes up only at 21:04 — u7 made it a floating sheet again and C15 rules that
// display:none-by-class before its phase is CORRECT behaviour, not a bug. So the
// wait is now: every window is ATTACHED, and every window not held by its phase
// is visible. Nothing is skipped; the desk census below still counts all five.
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  for (const id of WINDOW_IDS) {
    const window = page.locator(`#${id}`)
    await expect(window).toBeAttached()
    if (!(await window.evaluate((n) => n.classList.contains('hidden')))) await expect(window).toBeVisible()
  }
  // C14 / [u11#c12] — the DEV-only debug pane covers the desk's bottom-left
  // quadrant and steals the pointer there. See `fixtures/dev-surface.ts`.
  await hideDebugPane(page)
  await turnToAgent(page)
}

interface ControlMeta {
  readonly tag: string
  readonly role: string | null
  readonly tabindex: string | null
  readonly name: string
  readonly disabled: boolean
  readonly where: string
}

/** Tag / role / accessible-name census for a selector, in DOM order. */
async function census(page: Page, selector: string): Promise<ControlMeta[]> {
  return page.locator(selector).evaluateAll((nodes) =>
    nodes.map((n) => ({
      tag: n.tagName.toLowerCase(),
      role: n.getAttribute('role'),
      tabindex: n.getAttribute('tabindex'),
      name: (n.getAttribute('aria-label') ?? n.getAttribute('title') ?? n.textContent ?? '').trim(),
      disabled: (n as HTMLButtonElement).disabled === true,
      where: `${n.tagName.toLowerCase()}${n.id ? `#${n.id}` : ''}.${n.className || '(no class)'}`,
    })),
  )
}

interface TabStop {
  readonly top: number
  readonly left: number
  /** The same position in the VIEWPORT frame, un-normalised. */
  readonly vtop: number
  readonly vleft: number
  readonly where: string
  /** The `.win` id that owns this stop, or `(chrome)` for the persistent chrome. */
  readonly win: string
  /**
   * The nearest scrolling ancestor, named. Two stops are only comparable in the
   * content frame when this matches — see `tabWalk` and the ordering assert.
   */
  readonly scroller: string
}

/**
 * Press Tab until the sequence wraps, recording each stop's owning surface and
 * position. Uses the real key, so anything that reorders the sequence — a
 * positive `tabindex`, a focus trap, a roving handler — shows up here.
 */
async function tabWalk(page: Page, limit = 60): Promise<TabStop[]> {
  await page.locator('body').click({ position: { x: 2, y: 2 } })
  const stops: TabStop[] = []
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const r = el.getBoundingClientRect()
      // C17 / [u11#c12] — RE-AIMED (08-04): positions are recorded in the
      // surface's CONTENT frame, not the viewport's. Tabbing into a control
      // below the fold scrolls its window body (AGENT FILE's body is
      // 956 px tall inside a 662 px window), so two stops read in different
      // scroll states are not comparable — the later one can measure a SMALLER
      // viewport `top` than the earlier one and read as "backwards" while the
      // visual order is in fact forwards. Adding the scroller's offset back
      // undoes the scroll and compares like with like; the ordering rule below
      // is untouched.
      //
      // x1 (08-08) — AND THE FRAME IS ONLY SHARED WHEN THE SCROLLER IS. That
      // normalisation assumed one scroll container per window. The AGENT FILE
      // now has two: `.file-sheet` scrolls the page, and the `.pg-nav` strip
      // under it is pinned OUTSIDE it (`win-agent-file.css`, x1). Adding the
      // sheet's offset to `#btnDeploy` and nothing to `.pg-turn` puts them in
      // different frames, and the deploy button — genuinely above the strip —
      // read as below it. So the stop records its scroller, and the ordering
      // rule falls back to the viewport frame across a scroller boundary: both
      // stops were measured while focused, and focus scrolls its own element
      // into view, so the viewport rect at that instant IS the visual position.
      const scrolled = (axis: 'scrollTop' | 'scrollLeft'): number => {
        let node: HTMLElement | null = el.parentElement
        let sum = 0
        while (node) {
          sum += node[axis]
          node = node.parentElement
        }
        return sum
      }
      const name = (node: Element): string =>
        `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${node.className || ''}`
      const scrollerOf = (): string => {
        let node: HTMLElement | null = el.parentElement
        while (node) {
          const cs = getComputedStyle(node)
          if (
            /auto|scroll/.test(cs.overflowY + cs.overflowX) &&
            (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)
          ) {
            return name(node)
          }
          node = node.parentElement
        }
        return '(document)'
      }
      return {
        top: Math.round(r.top + scrolled('scrollTop')),
        left: Math.round(r.left + scrolled('scrollLeft')),
        vtop: Math.round(r.top),
        vleft: Math.round(r.left),
        where: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${el.className || ''}`,
        win: el.closest('.win')?.id ?? '(chrome)',
        scroller: scrollerOf(),
      }
    })
    if (!stop) break
    if (stops.length > 1 && stop.where === stops[0]!.where) break
    stops.push(stop)
  }
  return stops
}

test.use({ viewport: { width: 1280, height: 800 } })

/* ══ landmarks and roles ═════════════════════════════════════════════════ */

test.describe('a11y — landmarks and roles', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('a11y — the chrome exposes banner, navigation and main exactly once each', async ({ page }) => {
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('main')).toHaveCount(1)
    const nav = page.getByRole('navigation')
    await expect(nav).toHaveCount(1)
    await expect(nav).toHaveAttribute('aria-label', /\S/)
  })

  test('a11y — every window is a landmark region with a non-empty accessible name', async ({ page }) => {
    const windows = await census(page, '.win')
    expect(windows).toHaveLength(WINDOW_IDS.length)
    // The role may be implicit: a named `<section>` IS a region. What matters
    // is the computed role, so the count is read through the role selector.
    //
    // C15 / C17 / [u11#c12] — RE-AIMED (08-04), never deleted, and NOT loosened:
    // the count is still all five. `includeHidden` is what keeps it at five now
    // that `#w-tally` boots `class="win hidden"` and comes up at 21:04 — C15
    // rules that display:none-by-class before its phase is CORRECT behaviour, so
    // the fifth window is counted where it is instead of being dropped from the
    // a11y contract. `e2e/shell.spec.ts` carries the same re-aim.
    await expect(page.getByRole('region', { includeHidden: true })).toHaveCount(WINDOW_IDS.length)

    const named = await page.locator('.win').evaluateAll((nodes) =>
      nodes.map((n) => ({
        id: n.id,
        tag: n.tagName.toLowerCase(),
        role: n.getAttribute('role'),
        label: n.getAttribute('aria-label'),
        labelledby: n.getAttribute('aria-labelledby'),
      })),
    )
    for (const w of named) {
      const isRegion = w.role === 'region' || w.tag === 'section'
      expect(isRegion, `${w.id} is a <${w.tag}> with role=${w.role} — not a region`).toBe(true)
      const hasName = (w.label ?? '').trim().length > 0 || (w.labelledby ?? '').trim().length > 0
      // A `<section>` without an accessible name is NOT exposed as a region —
      // the implicit role only applies when the element is named.
      expect(hasName, `${w.id} has no accessible name, so its region role collapses`).toBe(true)
    }
  })

  test('a11y — decorative chrome is hidden from assistive tech', async ({ page }) => {
    for (const id of ['#wallpaper', '#threads', '#grain', '#vignette', '#sweep']) {
      const node = page.locator(id)
      if ((await node.count()) === 0) continue
      await expect(node).toHaveAttribute('aria-hidden', 'true')
    }
  })

  test('a11y — the live region announces politely, never assertively', async ({ page }) => {
    const toast = page.locator('#toast')
    await expect(toast).toHaveAttribute('role', 'status')
    await expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  // ADDED 08-05 (R2 on index.html:125): the assert above measured the region's
  // ATTRIBUTES on a node nothing ever wrote to — 30 s of a live run produced
  // zero mutations, so the announcement channel read as tested while carrying
  // nothing at all. This one observes an actual announcement.
  test('a11y — the live region actually carries the run’s announcements', async ({ page }) => {
    const toast = page.locator('#toast')
    await expect(toast, 'the desk opened a run and announced nothing').not.toBeEmpty({ timeout: 15_000 })

    const said: string[] = []
    said.push((await toast.textContent()) ?? '')
    // Drive the run to its close: the wait, the fallback, the filed report and
    // the tally all have to reach an operator who is not watching pixels. Via
    // the harness, so this spec is inside the u7 gap rule rather than beside it.
    await drain(page)
    await expect
      .poll(async () => ((await toast.textContent()) ?? '') !== said[0], { timeout: 15_000 })
      .toBe(true)
  })

  // ADDED 08-05 (R2 on pre-U3 windows/tally.ts:135): the assert above rides the
  // STREAM, and every line it can observe comes off a `ViewEvent`. The day's
  // hold is the desk's own — it opens on the run's close and releases up to
  // 30 s later on a decision no event carries — so it announced nothing at
  // either end. An operator got the close, then ~30 s of silence
  // indistinguishable from a hung desk, then a tab stop appearing and the
  // control's note flipping to the opposite meaning, both mute. This pins
  // BOTH ends of that hold.
  //
  // `?drill=tally-lapse` (shell/boot.ts, DEV only) boots the demo loop with its
  // `report` events withheld — the day whose generation never files, which the
  // authored loop never produces and which is the whole reason `HOLD_CEIL`
  // exists. The 30 s wait is the real ceiling, deliberately: the failure this
  // guards against is a TIMING change that re-silences the release, so the test
  // waits on the clock the product ships with.
  test('a11y — the day’s hold, and the lapse that ends it, are announced', async ({ page }) => {
    test.setTimeout(150_000)
    const toast = page.locator('#toast')
    const wait = page.locator('#w-file #deployState')
    const newRun = page.locator('#w-file #btnDeploy')

    await page.goto('./?drill=tally-lapse')
    await page.waitForFunction(() => Boolean((window as { __shell?: unknown }).__shell))
    await hideDebugPane(page)
    // C1 — `#deployState` and `#btnDeploy` are on the agent's page; the file
    // opens on its cover. This test drives the desk by URL, not through boot().
    await turnToAgent(page)

    // Drive the day to its close; the terminal record counts up on its own
    // ~9 s cadence, unrelated to whether the report has filed. The harness
    // `drain` waits it out to `final`.
    await drain(page)

    // (1) the hold is a fact an operator can HEAR, not only a line on the control.
    await expect(toast, 'the desk closed the run and held it in silence').toContainText('보고서 정리 중', {
      timeout: 20_000,
    })
    await expect(wait).toHaveText('……보고서 정리 중')
    await expect(newRun, 'NEW RUN is offered while the hold is still up').toBeDisabled()

    // (2) …and so is the release. The control's note changing to the opposite
    // meaning is not an announcement: `#deployState` is a plain node with no
    // live-region ancestor, which is exactly why the toast has to carry this.
    await expect(toast, 'the hold lapsed and the desk said nothing').toContainText(
      '보고서가 도착하지 않았습니다',
      { timeout: 60_000 },
    )
    await expect(wait).toContainText('보고서는 아직 부검 창에 없습니다')
    await expect(newRun, 'the day was never handed back').toBeEnabled()
  })
})

/* ══ keyboard reach ══════════════════════════════════════════════════════ */

test.describe('a11y — keyboard reach', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('a11y — every window control is a real button with a name and a tab stop', async ({ page }) => {
    const controls = await census(page, '.win .wc, .task')
    expect(controls.length, 'no window control found — the census is vacuous').toBeGreaterThan(0)
    for (const c of controls) {
      expect(c.tag, `${c.where} is not a <button>`).toBe('button')
      expect(c.name.length, `${c.where} has no accessible name`).toBeGreaterThan(0)
      expect(
        c.tabindex === null || Number(c.tabindex) >= 0,
        `${c.where} is removed from the tab order`,
      ).toBe(true)
    }
  })

  test('a11y — every membrane-op control is keyboard-operable', async ({ page }) => {
    // Universally quantified: passes with zero controls today (u4–u8 are out of
    // scope for this run, C1) and binds the moment the first one appears.
    const ops = await census(page, MEMBRANE_SELECTOR)
    for (const c of ops) {
      const nativelyFocusable = c.tag === 'button' || c.tag === 'a'
      expect(
        nativelyFocusable || (c.tabindex !== null && Number(c.tabindex) >= 0),
        `${c.where} performs a membrane op but cannot be reached from the keyboard`,
      ).toBe(true)
      expect(c.name.length, `${c.where} has no accessible name`).toBeGreaterThan(0)
      if (!nativelyFocusable) {
        expect(c.role, `${c.where} is not a <button> and declares no role`).toBe('button')
      }
    }
  })

  test('a11y — no membrane op is mouse-only (no drag-only or hover-only affordance)', async ({ page }) => {
    const dragOnly = await page.locator(MEMBRANE_SELECTOR).evaluateAll((nodes) =>
      nodes
        .filter((n) => n.getAttribute('draggable') === 'true')
        .filter((n) => n.tagName.toLowerCase() !== 'button' && n.getAttribute('tabindex') === null)
        .map((n) => `${n.tagName.toLowerCase()}.${n.className}`),
    )
    expect(dragOnly, 'a membrane op is reachable only by dragging').toEqual([])
  })

  // ADDED 08-05 (R2 on line 35): `MEMBRANE_SELECTOR` matched nothing in the
  // shipped desk, so the three asserts above were universally quantified over
  // the EMPTY set and reported green. The five controls now carry `data-op`,
  // and this census makes a missing one fail the suite instead of emptying it.
  // The desk is driven first: `mine` only exists once a report has been filed.
  //
  // U3 — `deploy` and `new_run` share ONE physical control across its modes
  // (design #3), so no single instant shows both ops. The census is a union
  // of two scans: build phase, where the control reads `deploy`, and after
  // `drain()` lands the terminal record, where it reads `new_run`.
  test('a11y — all five membrane ops have a marked, keyboard-operable control', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await hideDebugPane(page)
    // The reload restarts the boot, and under a loaded worker pool `__shell`
    // can lag the first paint — draining before it exists threw, intermittently.
    // Same wait idiom as red-thread's boot(): gate on the handle, then drive.
    await page.waitForFunction(
      () => (window as unknown as { __shell?: unknown }).__shell !== undefined,
    )
    // C1 — the reload re-opens the file on its cover, so `slot`/`unslot` are
    // not in the document until it is turned. boot()'s own turn was undone by
    // the reload above.
    await turnToAgent(page)

    const opsOf = (): Promise<string[]> =>
      page
        .locator(MEMBRANE_SELECTOR)
        .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute('data-op') ?? ''))])
    const beforeDrain = await opsOf()

    await page.evaluate(() => {
      const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
      if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
      handle.drain()
    })
    // U3 — no more sheet to reveal; wait the record out to final instead.
    await awaitRecordFinal(page)
    await expect(page.locator('[data-op="mine"]').first()).toBeAttached({ timeout: 15_000 })

    // `unslot` only exists once a seat is filled, so the desk is driven first.
    // ONE activation does it (08-08): the sentence is torn out and seated in
    // the same gesture, and it is `aria-disabled` afterwards — a second click
    // here would hang on a control that correctly refuses. Driving it is the
    // point: a census taken before the operator has done anything is exactly
    // the empty one this replaces.
    //
    // x4 — the two are scanned on OPPOSITE sides of that activation, because
    // the AGENT FILE's blank is gone the moment the file has a line in it: the
    // four permanent boxes became one paragraph and one blank, and the blank is
    // the `slot` op's control. So `slot` is censused while the file is still
    // empty and `unslot` after the sentence lands. Both still have to exist —
    // neither assert is dropped, only ordered.
    //
    // Each window is RAISED before it is used — a click that lands under
    // another focused window does nothing. See `raiseWindow`.
    await expect(page.locator('[data-op="slot"]').first()).toBeAttached({ timeout: 15_000 })
    await raiseWindow(page, 'rep')
    await page.locator('[data-op="mine"]').first().click()
    await raiseWindow(page, 'file')
    await expect(page.locator('[data-op="unslot"]').first()).toBeAttached({ timeout: 15_000 })

    const afterDrain = await opsOf()
    const found = [...new Set([...beforeDrain, ...afterDrain])].sort()
    expect(found, 'a membrane op has no marked control on the desk').toEqual([...MEMBRANE_OPS].sort())

    for (const c of await census(page, MEMBRANE_SELECTOR)) {
      const nativelyFocusable = c.tag === 'button' || c.tag === 'a'
      expect(
        nativelyFocusable || (c.tabindex !== null && Number(c.tabindex) >= 0),
        `${c.where} performs a membrane op but cannot be reached from the keyboard`,
      ).toBe(true)
      if (!nativelyFocusable) {
        expect(c.role, `${c.where} is not a <button> and declares no role`).toBe('button')
      }
    }
  })

  // ADDED 08-05 (R2 on window-frame.ts:55): resize was pointer-only and the grip
  // was an `aria-hidden` div assistive tech could not even discover, while two
  // of the four booted windows ship clipped — the block deck is 843 px tall
  // inside a 257 px body. WCAG 2.1.1 (Level A). The path is the ALTERNATIVE R2
  // named: Shift+arrow on the title bar, announced in the bar's own name, so the
  // desk does not gain a fifth tab stop per window that the focus-order contract
  // could not place.
  test('a11y — window resize has a keyboard path, and it is announced', async ({ page }) => {
    const grips = await census(page, '.win-grip')
    expect(grips.length, 'the desk has no resize grip — the census is vacuous').toBeGreaterThan(0)
    for (const g of grips) {
      expect(g.tag, `${g.where} is not a <button>`).toBe('button')
      expect(g.name.length, `${g.where} has no accessible name`).toBeGreaterThan(0)
    }
    const hidden = await page
      .locator('.win-grip')
      .evaluateAll((nodes) => nodes.filter((n) => n.getAttribute('aria-hidden') === 'true').length)
    expect(hidden, 'the resize grip is hidden from assistive tech').toBe(0)

    // g13-3 — the AGENT FILE is a fixed sheet, and BOTH halves are pinned here
    // because only both together keep 2.1.1: a window that resized by pointer
    // and not by key would be the very violation this test was added for. So
    // the sheet must have no grip to drag, no Shift promise in the name its bar
    // announces, and no resize when the key is actually pressed.
    await expect(page.locator('#w-file .win-grip')).toHaveCount(0)
    expect(
      (await page.locator('#w-file .win-bar').getAttribute('aria-label')) ?? '',
      'the fixed sheet advertises a resize path it does not have',
    ).not.toMatch(/Shift/)
    const sheetH = async (): Promise<number> =>
      page.locator('#w-file').evaluate((n) => Math.round(n.getBoundingClientRect().height))
    const sheetBefore = await sheetH()
    await page.locator('#w-file .win-bar').focus()
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')
    expect(await sheetH(), 'Shift+ArrowDown resized the fixed sheet').toBe(sheetBefore)

    const bar = page.locator('#w-rep .win-bar')
    expect(
      (await bar.getAttribute('aria-label')) ?? '',
      'the bar does not announce its resize path — an undiscoverable path is not a path',
    ).toMatch(/Shift/)

    const boxOf = async (): Promise<{ w: number; h: number }> =>
      page.locator('#w-rep').evaluate((n) => {
        const r = n.getBoundingClientRect()
        return { w: Math.round(r.width), h: Math.round(r.height) }
      })
    const before = await boxOf()
    await bar.focus()
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')
    const after = await boxOf()
    expect(after.h, 'Shift+ArrowDown on the focused bar did not resize the window').toBeGreaterThan(before.h)

    // …and plain arrows still MOVE, unchanged.
    const topBefore = await page.locator('#w-rep').evaluate((n) => Math.round(n.getBoundingClientRect().top))
    await page.keyboard.press('ArrowDown')
    const topAfter = await page.locator('#w-rep').evaluate((n) => Math.round(n.getBoundingClientRect().top))
    expect(topAfter, 'the arrow-key move path regressed').toBeGreaterThan(topBefore)
  })

  test('a11y — collapse and close work from the keyboard, and the taskbar restores', async ({ page }) => {
    const node = page.locator('#w-rep')
    await node.locator('.wc-min').focus()
    await page.keyboard.press('Enter')
    await expect(node).toHaveClass(/\bcollapsed\b/)

    await node.locator('.wc-close').focus()
    await page.keyboard.press('Enter')
    await expect(node).toBeHidden()

    await page.locator('.task[data-win="rep"]').focus()
    await page.keyboard.press('Enter')
    await expect(node).toBeVisible()
  })

  // C15 / C17 / [u11#c12] — RE-AIMED (08-04), never deleted and not narrowed by
  // selector: the sweep still visits every `.wc, .task, .win-bar, .snd-btn,
  // [data-op]` in the document. What changed is that a control with NO LAYOUT
  // BOX is now reported as such instead of being counted as unringed. The three
  // that failed were `#w-tally`'s own bar and its two window controls: the tally
  // boots `class="win hidden"` and comes up at 21:04, and a `display:none`
  // element cannot take focus at all — `el.focus()` is a no-op there, so the
  // before/after snapshot could only ever be identical. C15 rules that state
  // CORRECT behaviour, and this suite's own "a hidden window contributes no tab
  // stop" pins the same thing from the other side. The oracle is unchanged for
  // every control the operator can actually reach.
  test('a11y — every focusable control paints a visible focus indicator', async ({ page }) => {
    await page.keyboard.press('Tab')
    const measured = await page.evaluate(() => {
      const snap = (el: Element): string => {
        const s = getComputedStyle(el)
        return `${s.outlineStyle}|${s.outlineWidth}|${s.outlineColor}|${s.boxShadow}`
      }
      const unringed: string[] = []
      const heldByPhase: string[] = []
      let reachable = 0
      // `.win-grip` joined the sweep on 08-05 with its keyboard path (R2 on
      // window-frame.ts:55) — a control the operator can now reach has to ring.
      for (const el of document.querySelectorAll<HTMLElement>(
        // `.rate-btn` is gone with W4's transport row; `.snd-btn` (the mute
        // toggle) is what stands in that row now, and it keeps the coverage.
        '.wc, .task, .win-bar, .win-grip, .snd-btn, [data-op]',
      )) {
        const name = `${el.tagName.toLowerCase()}.${el.className}`
        if (el.getClientRects().length === 0) {
          heldByPhase.push(`${el.closest('.win')?.id ?? '(no window)'} ${name}`)
          continue
        }
        reachable += 1
        const before = snap(el)
        el.focus()
        const after = snap(el)
        el.blur()
        if (after === before || /^none\|0px/.test(after)) unringed.push(name)
      }
      return { unringed, heldByPhase, reachable }
    })
    expect(measured.reachable, 'no reachable control was measured — the sweep is vacuous').toBeGreaterThan(0)
    expect(measured.unringed, 'these controls give no visible focus feedback').toEqual([])
    // U3 — no window is phase-held any more (TALLY is gone); every control on
    // the desk has a layout box from boot.
    expect(measured.heldByPhase).toEqual([])
  })
})

/* ══ focus order ═════════════════════════════════════════════════════════ */

test.describe('a11y — focus order follows visual order at 1280x800', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('a11y — real Tab traversal walks the chrome, then one window at a time', async ({ page }) => {
    // Walks the document with the actual key, not a querySelectorAll guess, so
    // a stray `tabindex` that reorders the sequence is caught.
    //
    // "Visual order" on a windowed desktop is per-surface, not per-page: the
    // chrome first, then each window as a contiguous block. A sequence that
    // interleaves two windows is the failure this catches.
    const stops = await tabWalk(page)
    expect(stops.length, 'Tab reached nothing — the desk has no keyboard entry point').toBeGreaterThan(3)

    const groups: { win: string; from: number; to: number }[] = []
    for (const [i, s] of stops.entries()) {
      const last = groups[groups.length - 1]
      if (last && last.win === s.win) last.to = i
      else groups.push({ win: s.win, from: i, to: i })
    }
    const seen = new Set<string>()
    for (const g of groups) {
      expect(seen.has(g.win), `focus returns to ${g.win} after leaving it — the block is not contiguous`).toBe(false)
      seen.add(g.win)
    }
    expect(groups[0]!.win, 'the chrome is not the first thing Tab reaches').toBe('(chrome)')
  })

  test('a11y — within each surface, focus order follows visual order', async ({ page }) => {
    const stops = await tabWalk(page)
    for (let i = 1; i < stops.length; i += 1) {
      const prev = stops[i - 1]!
      const cur = stops[i]!
      if (cur.win !== prev.win) continue
      // Content frame inside one scroller, viewport frame across two — see the
      // note in `tabWalk`. Mixing the frames is what makes a stop read backwards
      // when it is not.
      const shared = cur.scroller === prev.scroller
      const curTop = shared ? cur.top : cur.vtop
      const prevTop = shared ? prev.top : prev.vtop
      const curLeft = shared ? cur.left : cur.vleft
      const prevLeft = shared ? prev.left : prev.vleft
      const sameRow = Math.abs(curTop - prevTop) < 8
      const forwards = sameRow ? curLeft >= prevLeft : curTop > prevTop
      expect(forwards, `tab stop ${i} (${cur.where}) goes backwards from ${prev.where} inside ${cur.win}`).toBe(true)
    }
  })

  test('a11y — the windows are tabbed in the order they are laid out on the desk', async ({ page }) => {
    // ── QUARANTINE LIFTED 08-05 (final-PR review, R2 on this line) ──
    // The assert below is EXACTLY as u9 wrote it; what changed is the desk. u9
    // could only report the defect (tests only, [u9#c8]) — Tab walked the
    // registry order feed · file · store · rep while `shell/layout.ts` placed
    // the windows feed · rep · file · store, so three of the four window
    // transitions sent focus somewhere the eye did not predict (WCAG 2.4.3,
    // Level A). The integration PR is where that constraint lifts:
    // `shell/layout.ts` now exports `DESK_ORDER` and `window-manager.ts` appends
    // `#desktop`'s children in it. The `test.fail()` annotation is therefore
    // gone rather than the assert.
    const stops = await tabWalk(page)
    const order: string[] = []
    for (const s of stops) if (s.win !== '(chrome)' && !order.includes(s.win)) order.push(s.win)
    expect(order.length, 'Tab never reached a window').toBeGreaterThan(1)

    const origins = await page.locator('.win').evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect()
        return { id: n.id, top: Math.round(r.top), left: Math.round(r.left) }
      }),
    )
    const visual = origins
      .filter((o) => order.includes(o.id))
      .sort((a, b) => (Math.abs(a.top - b.top) < 24 ? a.left - b.left : a.top - b.top))
      .map((o) => o.id)
    expect(order, 'the tab sequence does not follow the desk layout').toEqual(visual)
  })

  test('a11y — no positive tabindex anywhere (it would override visual order)', async ({ page }) => {
    const positive = await page.locator('[tabindex]').evaluateAll((nodes) =>
      nodes
        .filter((n) => Number(n.getAttribute('tabindex')) > 0)
        .map((n) => `${n.tagName.toLowerCase()}.${n.className} tabindex=${n.getAttribute('tabindex')}`),
    )
    expect(positive).toEqual([])
  })

  test('a11y — nothing is off-screen at 1280x800 (C10 / PRD §2)', async ({ page }) => {
    const offscreen = await page.locator('.win, #topbar, #taskbar').evaluateAll((nodes) =>
      nodes
        .filter((n) => getComputedStyle(n).display !== 'none')
        .map((n) => ({ id: n.id || n.className, r: n.getBoundingClientRect() }))
        .filter((x) => x.r.left < 0 || x.r.top < 0 || x.r.right > 1280 || x.r.bottom > 800)
        .map((x) => `${x.id} @ ${Math.round(x.r.left)},${Math.round(x.r.top)} ${Math.round(x.r.right)}x${Math.round(x.r.bottom)}`),
    )
    expect(offscreen).toEqual([])
  })

  test('a11y — a hidden window contributes no tab stop', async ({ page }) => {
    const node = page.locator('#w-feed')
    await node.locator('.wc-close').click()
    await expect(node).toBeHidden()
    const reachable = await node.evaluate((n) => {
      const s = getComputedStyle(n)
      return s.display !== 'none' && s.visibility !== 'hidden'
    })
    expect(reachable).toBe(false)
  })
})

/* ══ reduced motion ══════════════════════════════════════════════════════ */

// ADDED 08-05 (R2 on styles/shell.css:41): the client honoured
// `prefers-reduced-motion` in exactly one place (the reports typewriter) out of
// 21 `animation:` declarations, six of them `infinite` — a full-viewport grain
// overlay stepping every 7 s and a taskbar alert pulsing every second, with no
// in-game motion toggle either. WCAG 2.2.2 (Pause, Stop, Hide, Level A).
test.describe('a11y — the desk stops moving when the operator asks it to', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('a11y — no animation loops forever under prefers-reduced-motion', async ({ page }) => {
    await boot(page)
    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
      'the context did not actually ask for reduced motion — the check is vacuous',
    ).toBe(true)

    // Give the 1 ms collapse a beat to finish, then look for anything still going.
    await page.waitForTimeout(250)
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running')
        .map((a) => {
          const effect = a.effect as KeyframeEffect | null
          const target = effect?.target as Element | null
          const iterations = effect?.getTiming().iterations ?? 1
          return {
            name: (a as unknown as { animationName?: string }).animationName ?? '(unnamed)',
            where: target ? `${target.tagName.toLowerCase()}.${target.className}` : '(no target)',
            iterations,
          }
        })
        .filter((a) => a.iterations === Infinity)
        .map((a) => `${a.name} on ${a.where}`),
    )
    expect(running, 'these animations still loop forever with Reduce Motion set').toEqual([])
  })

  test('a11y — the desk is still legible: the reveals landed on their end state', async ({ page }) => {
    await boot(page)
    // `animation:none` would have left every `… both` reveal at its invisible
    // opening keyframe. Every booted window must still be painted.
    const invisible = await page.locator('.win:not(.hidden)').evaluateAll((nodes) =>
      nodes
        .filter((n) => Number(getComputedStyle(n).opacity) < 0.9)
        .map((n) => `${n.id} opacity=${getComputedStyle(n).opacity}`),
    )
    expect(invisible, 'reduced motion hid the desk instead of stilling it').toEqual([])
  })
})

/* ══ inv 1 · rendered DOM ════════════════════════════════════════════════ */

test.describe('inv 1 · rendered DOM — no free-text surface reaches the player', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('inv 1 — the rendered document contains no input, textarea, select or form', async ({ page }) => {
    await expect(page.locator('input, textarea, select, form')).toHaveCount(0)
  })

  test('inv 1 — nothing in the rendered document is contenteditable', async ({ page }) => {
    await expect(page.locator('[contenteditable]')).toHaveCount(0)
    const editable = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('*')]
        .filter((n) => n.isContentEditable)
        .map((n) => `${n.tagName.toLowerCase()}.${n.className}`),
    )
    expect(editable).toEqual([])
    expect(await page.evaluate(() => document.designMode)).toBe('off')
  })

  test('inv 1 — the desk survives typing: keystrokes change no text node', async ({ page }) => {
    // The membrane is not "there is no input tag", it is "the player cannot
    // author text". Type into the focused desk and prove nothing absorbed it.
    const before = await page.locator('#app').innerText()
    await page.locator('body').click({ position: { x: 4, y: 4 } })
    await page.keyboard.type('감염병 보고서 초안')
    await page.keyboard.press('Enter')
    const after = await page.locator('#app').innerText()
    expect(after, 'typed text was absorbed by the desk').toBe(before)
  })
})

/* ══ inv 2 · rendered DOM ════════════════════════════════════════════════ */

test.describe('inv 2 · rendered DOM — no digit renders for NPC state', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('inv 2 — no digit renders inside an NPC or symptom line', async ({ page }) => {
    // Scoped BY SELECTOR: `.fl-npc .fl-c` / `.fl-symptom .fl-c` only. The
    // per-line clock stamp `.fl-t` is a sibling and is not read.
    const offenders = await page.locator(NPC_TEXT_SELECTOR).evaluateAll((nodes) =>
      nodes
        .map((n) => (n.textContent ?? '').trim())
        .filter((t) => /[0-9０-９]/.test(t)),
    )
    expect(offenders, 'an NPC channel rendered a digit (spec §3 inv 2)').toEqual([])
  })

  test('inv 2 — the exclusion is by selector: scoped and excluded nodes never overlap', async ({ page }) => {
    const overlap = await page.evaluate(
      ({ scoped, excluded }) => {
        const inScope = new Set(document.querySelectorAll(scoped))
        return [...document.querySelectorAll(excluded)]
          .filter((n) => inScope.has(n))
          .map((n) => `${n.tagName.toLowerCase()}.${n.className}`)
      },
      { scoped: NPC_TEXT_SELECTOR, excluded: EXCLUDED_DIGIT_SELECTOR },
    )
    expect(overlap, 'an excluded surface was inside the NPC scope').toEqual([])
  })

  test('inv 2 — the scoped query is well-formed and the exclusion list resolves', async ({ page }) => {
    // Guards against a typo silently emptying the scope: both selectors must
    // parse, and the excluded list must still match the chrome that carries
    // the clock (which is on screen from boot).
    const counts = await page.evaluate(
      ({ scoped, excluded }) => ({
        scoped: document.querySelectorAll(scoped).length,
        excluded: document.querySelectorAll(excluded).length,
      }),
      { scoped: NPC_TEXT_SELECTOR, excluded: EXCLUDED_DIGIT_SELECTOR },
    )
    expect(counts.scoped).toBeGreaterThanOrEqual(0)
    expect(counts.excluded, 'the exclusion list matches nothing — it is not doing its job').toBeGreaterThan(0)
  })
})
