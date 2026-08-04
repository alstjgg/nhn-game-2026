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
import type { Page } from 'playwright/test'
import { hideDebugPane } from './fixtures/dev-surface.ts'

/** The five windows, in the taskbar order `window-registry.ts` emits. */
const WINDOW_IDS = ['w-feed', 'w-file', 'w-store', 'w-rep', 'w-tally'] as const

/** spec §5.2 `MembraneOp` — the entire player input vocabulary (inv 1 / C11). */
const MEMBRANE_OPS = ['slot', 'unslot', 'mine', 'deploy', 'new_run'] as const

/** Any control that claims to perform a membrane op, however it is marked up. */
const MEMBRANE_SELECTOR = MEMBRANE_OPS.map((op) => `[data-op="${op}"]`).join(', ')

/** NPC channels (spec §3 inv 2). The clock stamp `.fl-t` is chrome, excluded. */
const NPC_TEXT_SELECTOR = '.fl-npc .fl-c, .fl-symptom .fl-c'
/** Digit-bearing surfaces that are score or chrome, never NPC state. */
const EXCLUDED_DIGIT_SELECTOR = '.fl-t, .clk-digits, .tb-clock, .dd-value, .dd-runs, .ledger, .tly-table, .th-v, .tr-v'

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
  readonly where: string
  /** The `.win` id that owns this stop, or `(chrome)` for the persistent chrome. */
  readonly win: string
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
      const scrolled = (axis: 'scrollTop' | 'scrollLeft'): number => {
        let node: HTMLElement | null = el.parentElement
        let sum = 0
        while (node) {
          sum += node[axis]
          node = node.parentElement
        }
        return sum
      }
      return {
        top: Math.round(r.top + scrolled('scrollTop')),
        left: Math.round(r.left + scrolled('scrollLeft')),
        where: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${el.className || ''}`,
        win: el.closest('.win')?.id ?? '(chrome)',
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
  // selector: the sweep still visits every `.wc, .task, .win-bar, .rate-btn,
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
      for (const el of document.querySelectorAll<HTMLElement>('.wc, .task, .win-bar, .rate-btn, [data-op]')) {
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
    for (const held of measured.heldByPhase) {
      expect(held, 'a control with no layout box outside a phase-held window').toMatch(/^w-tally /)
    }
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
      const sameRow = Math.abs(cur.top - prev.top) < 8
      const forwards = sameRow ? cur.left >= prev.left : cur.top > prev.top
      expect(forwards, `tab stop ${i} (${cur.where}) goes backwards from ${prev.where} inside ${cur.win}`).toBe(true)
    }
  })

  test('a11y — the windows are tabbed in the order they are laid out on the desk', async ({ page }) => {
    // ── KNOWN DEFECT, OWNED BY u3 — quarantined, not weakened, not deleted ──
    // Tab visits the windows in registry/DOM order (feed · file · store · rep ·
    // tally) while `shell/layout.ts` places them feed(x14,y94) · rep(x369,y94) ·
    // file(x~880,y94) · store(x369,below) · tally(bottom band), i.e. visual order
    // feed · rep · file · store · tally. The fix is the `#desktop` child order in
    // u3's shell — production code this unit may not touch ([u9#c8]: tests only,
    // defects are reported). [u9#c6] equally forbids gating u9's own slice on
    // another unit's defect, so the assert runs UNCHANGED under `test.fail()`:
    // the body below still executes, the failure is still reported, and the
    // moment u3 reorders the desk this test fails as "expected to fail but
    // passed" — which forces this annotation off rather than letting it rot.
    // See discovery/u9.md › Seam friction.
    test.fail(
      true,
      'u3 defect: #desktop child order is registry order, the desk layout is not — discovery/u9.md',
    )
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
    const node = page.locator('#w-store')
    await node.locator('.wc-close').click()
    await expect(node).toBeHidden()
    const reachable = await node.evaluate((n) => {
      const s = getComputedStyle(n)
      return s.display !== 'none' && s.visibility !== 'hidden'
    })
    expect(reachable).toBe(false)
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
