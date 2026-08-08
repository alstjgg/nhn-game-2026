# g13-3 — the AGENT FILE is not resizable, by pointer or by key

> plan-playtest v14 · citations bind to `773ee92` · branch `playtest/g13-3-file-not-resizable`
> commit message: `playtest(g13-3): the AGENT FILE is a fixed sheet — no grip, no keyboard resize`

## Outcome

The AGENT FILE cannot be resized. It has no corner grip, and Shift+arrow on its
title bar does nothing — its title bar no longer offers the gesture either. It
still drags, collapses, closes and raises exactly as it does today, and so do the
other two windows — REPORTS and LIVE FEED keep both their grip and their keyboard
resize.

## Why (author-resolved — do not re-derive)

The file is a document, not a pane. Its two pages are sized to fit the window
exactly (T3 sized the right column from them: cover 413px, agent page ~490,
against a 511px body), so **any shrink clips them** — and what clips first is the
page-turn control, which is the only way to reach page 2. That is C9 ("nothing
off-screen in the default layout") re-entering through a gesture instead of
through the layout. Sizing the window right protects the default; removing the
gesture removes the whole class.

**Two scope decisions, stated because both are easy to get wrong:**

1. **Keyboard resize goes only for THIS window.** `window-manager.ts`'s
   Shift+arrow branch exists because resize was pointer-only and a keyboard
   operator could not reach clipped content (WCAG 2.1.1, Level A). Removing it
   desk-wide while REPORTS and LIVE FEED still resize by pointer would recreate
   exactly that violation. A window that resizes by neither means is consistent;
   a window that resizes by mouse only is not.
2. **Plain-arrow MOVE stays.** Moving is a different function from resizing, and
   pointer-drag-move stays too. Only the `event.shiftKey` branch is gated.

## Scope

May modify:

- `src/client/shell/window-registry.ts` — the AGENT FILE's definition gains the flag
- `src/client/components/window-frame.ts` — build no grip when the flag is off, and drop the bar's resize promise
- `src/client/shell/window-manager.ts` — gate both resize paths on the flag
- `e2e/shell.spec.ts` · `e2e/a11y.spec.ts` · `e2e/red-thread.spec.ts`

Must NOT modify:

- `src/client/shell/layout.ts` — the arrangement is settled; this unit changes
  what a gesture can do to it, not the arrangement.
- `e2e/acceptance.spec.ts` — its resize test targets REPORTS (`:401`) and is
  unaffected. If it goes red, stop and report.
- `src/client/windows/agent-file.ts` — the window's contents are not this unit's
  business.

Test files this unit turns red, all **amended, not relaxed**:

- `e2e/shell.spec.ts:129` — the chrome census asserts every window has exactly
  one grip. Becomes two-of-three, naming the file as the exception and why.
- `e2e/shell.spec.ts:165` — the resize loop runs over all three windows; it skips
  the file.
- `e2e/red-thread.spec.ts:555` — **re-aimed onto REPORTS**, see below.

Test files this unit touches but does **not** turn red, stated so the executor
does not go looking for a red that is not there:

- `e2e/a11y.spec.ts:401` — its grip census is `> 0`, not `=== 3`, so two grips
  pass it unchanged. E5 **adds** the sheet's own half of WCAG 2.1.1 to it: no
  grip on `#w-file`, no Shift promise in its bar name, and Shift+arrow measurably
  doing nothing. That claim is this unit's whole rationale and is currently
  pinned nowhere.
- `e2e/a11y.spec.ts:479` — the focus sweep's selector list carries `.win-grip`
  and visits whatever is there. Two grips is not fewer than it demands.
  **Unchanged.**
- `e2e/shell.spec.ts:178` — the resize-clamp test targets `#w-rep` alone, not the
  loop. **Unchanged.** (The draft of this PRD said `:180` was a loop. It is not.)

## The red-thread re-aim (the one real judgement call)

`[u8#c2] "a resize by the grip re-draws within a frame"` grips `#w-file` and
reads the thread's **slot** endpoint. With no grip on the file that claim cannot
exist. It is re-aimed onto **REPORTS**, gripping `#w-rep` and reading the
**source** endpoint — the same criterion (a resize redraws within a frame) on the
window that can still do it. `endpointsOf(d)[0]` is the source end; `[1]` is the
slot end (`red-thread.spec.ts:214-221`, and `planFor` puts the source pin at
`right(rect) - 6`, so widening REPORTS moves it).

The re-aimed drag is **horizontal only**, and that is load-bearing. REPORTS is
full column height — `layout.ts` gives it `y 94, h 692` at 1280×800, so its
16px grip sits at `y 770..786` against a 800px floor. The original `+90`
downward would have dragged the pointer off the viewport. `+120, 0` keeps it on
the desk and still moves the source end, because REPORTS' body widens under a
justified paragraph.

This test is currently **RED on `playtest/wave-g13`** for an unrelated reason
(T3 put the file's grip 14px from the viewport edge, so its +120 drag carried the
slot off-screen). Do not try to fix that; the re-aim retires it. If the re-aimed
test fails on REPORTS, that is a genuine finding — stop and report it.

## Change list

Six files, edits listed bottom-up within each file.

### E1 — `src/client/shell/window-registry.ts`

**E1a — `:37`.** Current text:

```
  { key: 'file', id: 'w-file', en: 'AGENT FILE', ko: '요원 파일', sub: '요원 파일 — 프롬프트 편성', tab: 'AF', stock: 'paper kraft', mount: mountAgentFile },
```

Replacement text:

```
  { key: 'file', id: 'w-file', en: 'AGENT FILE', ko: '요원 파일', sub: '요원 파일 — 프롬프트 편성', tab: 'AF', stock: 'paper kraft', resizable: false, mount: mountAgentFile },
```

**E1b — `:29`.** Current text:

```
  /** Whether the window carries the live dot (LIVE FEED does). */
  live?: boolean
  /** The window's own contents — a stub until its unit lands. */
  mount: (host: HTMLElement, driver: FixtureDriver) => void
```

Replacement text:

```
  /** Whether the window carries the live dot (LIVE FEED does). */
  live?: boolean
  /**
   * A fixed sheet: no corner grip, no Shift+arrow resize. Absent means
   * resizable, so only the window that opts out says so. The AGENT FILE does —
   * its two pages are sized to its body, so any shrink clips the page-turn
   * control off the window and takes page 2 with it (C9).
   */
  resizable?: boolean
  /** The window's own contents — a stub until its unit lands. */
  mount: (host: HTMLElement, driver: FixtureDriver) => void
```

### E2 — `src/client/components/window-frame.ts`

**E2a — `:64`.** Current text:

```
  const grip = button('win-grip', `${def.en} 창 크기 조절 — 제목 표시줄에서 Shift+방향키`, '')
  grip.tabIndex = -1

  root.append(tab, bar, body, grip)
  return { def, root, bar, body, grip, collapse, close }
```

Replacement text:

```
  // A window may be a fixed sheet. The AGENT FILE is: its pages are sized to
  // its body, so any shrink clips the page-turn control off the window and
  // takes page 2 with it (C9). A sheet that cannot be resized cannot be
  // clipped by a gesture.
  const grip = def.resizable === false ? null : button('win-grip', `${def.en} 창 크기 조절 — 제목 표시줄에서 Shift+방향키`, '')
  if (grip) grip.tabIndex = -1

  root.append(tab, bar, body, ...(grip ? [grip] : []))
  return { def, root, bar, body, grip, collapse, close }
```

**E2b — `:33`.** Current text:

```
  const bar = el('header', 'win-bar')
  bar.tabIndex = 0
  // The bar is the window's ONE geometry handle from the keyboard: arrow keys
  // move it, Shift+arrow resizes it (R2 on window-frame.ts:55 — resize was
  // pointer-only, WCAG 2.1.1). Both are named here, because a keyboard path
  // nobody is told about is not a path.
  bar.setAttribute('aria-label', `${def.en} 창 이동 — 방향키로 옮기고, Shift+방향키로 크기를 조절합니다`)
```

Replacement text:

```
  const bar = el('header', 'win-bar')
  bar.tabIndex = 0
  // The bar is the window's ONE geometry handle from the keyboard: arrow keys
  // move it, Shift+arrow resizes it (R2 on window-frame.ts:55 — resize was
  // pointer-only, WCAG 2.1.1). Both are named here, because a keyboard path
  // nobody is told about is not a path — and by the same rule a fixed sheet
  // must not name the one gesture it does not have. Moving is not resizing, so
  // the move clause is what stays.
  bar.setAttribute(
    'aria-label',
    def.resizable === false
      ? `${def.en} 창 이동 — 방향키로 옮깁니다`
      : `${def.en} 창 이동 — 방향키로 옮기고, Shift+방향키로 크기를 조절합니다`,
  )
```

**E2c — `:20`.** Current text:

```
  readonly grip: HTMLButtonElement
```

Replacement text:

```
  readonly grip: HTMLButtonElement | null
```

### E3 — `src/client/shell/window-manager.ts`

**E3a — `:159`.** Current text:

```
  function wireResize(frame: WindowFrame): void {
    frame.grip.addEventListener('pointerdown', (event: PointerEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = frame.root.getBoundingClientRect()
      const sx = event.clientX
      const sy = event.clientY
      frame.grip.setPointerCapture(event.pointerId)

      const onMove = (ev: PointerEvent): void => {
        resize(frame, rect.width + ev.clientX - sx, rect.height + ev.clientY - sy)
      }
      const onUp = (): void => {
        frame.grip.removeEventListener('pointermove', onMove)
        frame.grip.removeEventListener('pointerup', onUp)
      }
      frame.grip.addEventListener('pointermove', onMove)
      frame.grip.addEventListener('pointerup', onUp)
    })
  }
```

Replacement text:

```
  function wireResize(frame: WindowFrame): void {
    // A fixed sheet builds no grip, so there is nothing to wire. The pointer
    // path and the keyboard path leave together: a window that resized by mouse
    // only would be the WCAG 2.1.1 failure the Shift+arrow branch above was
    // added to fix. Bound to a local `const` because a narrowed readonly
    // property does not stay narrowed inside these callbacks.
    const grip = frame.grip
    if (grip === null) return
    grip.addEventListener('pointerdown', (event: PointerEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = frame.root.getBoundingClientRect()
      const sx = event.clientX
      const sy = event.clientY
      grip.setPointerCapture(event.pointerId)

      const onMove = (ev: PointerEvent): void => {
        resize(frame, rect.width + ev.clientX - sx, rect.height + ev.clientY - sy)
      }
      const onUp = (): void => {
        grip.removeEventListener('pointermove', onMove)
        grip.removeEventListener('pointerup', onUp)
      }
      grip.addEventListener('pointermove', onMove)
      grip.addEventListener('pointerup', onUp)
    })
  }
```

**E3b — `:141`.** Current text:

```
      // Shift+arrow RESIZES where arrow moves (R2 on window-frame.ts:55): resize
      // was pointer-only, and two of the four booted windows ship clipped — the
      // block deck is 843 px tall inside a 257 px body — so a keyboard operator
      // could not see the deck at all (WCAG 2.1.1, Level A). Same MIN_W/MIN_H
      // clamp as the drag; the bar's accessible name says so.
      if (event.shiftKey) {
        resize(frame, rect.width + delta[0], rect.height + delta[1])
        return
      }
```

Replacement text:

```
      // Shift+arrow RESIZES where arrow moves (R2 on window-frame.ts:55): resize
      // was pointer-only, and two of the four booted windows ship clipped — the
      // block deck is 843 px tall inside a 257 px body — so a keyboard operator
      // could not see the deck at all (WCAG 2.1.1, Level A). Same MIN_W/MIN_H
      // clamp as the drag; the bar's accessible name says so.
      //
      // A fixed sheet is the one exception, and it is gated HERE rather than
      // desk-wide for exactly the reason above: this branch exists BECAUSE a
      // pointer-only resize left clipped content unreachable, so a window that
      // still resizes by pointer must keep it. The sheet resizes by neither.
      if (event.shiftKey) {
        if (frame.def.resizable === false) return
        resize(frame, rect.width + delta[0], rect.height + delta[1])
        return
      }
```

### E4 — `e2e/shell.spec.ts`

**E4a — `:165`.** Current text:

```
  test('window ops — every window resizes by its corner grip', async ({ page }) => {
    for (const w of WINDOWS) {
      const node = win(page, w.id)
      const before = await box(node)
      await dragFrom(page, await box(node.locator('.win-grip')), 50, 40)
```

Replacement text:

```
  test('window ops — every window resizes by its corner grip, except the sheet', async ({ page }) => {
    for (const w of WINDOWS) {
      // g13-3 — the AGENT FILE is a fixed sheet: it builds no grip, and the
      // census above pins that per window. Skipping it here is the shape of
      // that decision, not a relaxation of this claim — `a11y.spec.ts` holds
      // the other half, that the sheet does not resize from the keyboard
      // either.
      if (w.id === 'w-file') continue
      const node = win(page, w.id)
      const before = await box(node)
      await dragFrom(page, await box(node.locator('.win-grip')), 50, 40)
```

**E4b — `:129`.** Current text:

```
  test('window ops — every window carries the WindowFrame chrome', async ({ page }) => {
    for (const w of WINDOWS) {
      const node = win(page, w.id)
      await expect(node.locator('.win-tab')).toHaveCount(1)
      await expect(node.locator('.win-bar')).toHaveCount(1)
      await expect(node.locator('.win-bar h2')).toHaveCount(1)
      await expect(node.locator('.win-ctl .wc-min')).toHaveCount(1)
      await expect(node.locator('.win-ctl .wc-close')).toHaveCount(1)
      await expect(node.locator('.win-body')).toHaveCount(1)
      await expect(node.locator('.win-grip')).toHaveCount(1)
    }
  })
```

Replacement text:

```
  test('window ops — every window carries the WindowFrame chrome', async ({ page }) => {
    for (const w of WINDOWS) {
      const node = win(page, w.id)
      await expect(node.locator('.win-tab')).toHaveCount(1)
      await expect(node.locator('.win-bar')).toHaveCount(1)
      await expect(node.locator('.win-bar h2')).toHaveCount(1)
      await expect(node.locator('.win-ctl .wc-min')).toHaveCount(1)
      await expect(node.locator('.win-ctl .wc-close')).toHaveCount(1)
      await expect(node.locator('.win-body')).toHaveCount(1)
      // g13-3 — two of three. The AGENT FILE is a fixed sheet and builds no
      // grip: its two pages are sized to its body, so any shrink clips the
      // page-turn control and takes page 2 off the window with it (C9). The
      // count is pinned PER WINDOW, not summed, so a grip appearing on the
      // sheet and a grip vanishing from the other two both read here.
      await expect(node.locator('.win-grip')).toHaveCount(w.id === 'w-file' ? 0 : 1)
    }
  })
```

### E5 — `e2e/a11y.spec.ts:401`

Current text:

```
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
```

Replacement text:

```
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
```

### E6 — `e2e/red-thread.spec.ts:555`

Current text:

```
  test('endpoints track windows during drag — a resize by the grip re-draws within a frame', async ({
    page,
  }) => {
    const grip = await box(page, `${FILE} .win-grip`)
    const before = await slotEndpoint(page)
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(grip.x + 120, grip.y + 90)
    await page.waitForTimeout(50)
    const during = await slotEndpoint(page)
    expect(before[0] !== during[0] || before[1] !== during[1]).toBe(true)
    await page.mouse.up()
  })
```

Replacement text:

```
  test('endpoints track windows during drag — a resize by the grip re-draws within a frame', async ({
    page,
  }) => {
    // RE-AIMED (g13-3). This gripped the AGENT FILE, which is a fixed sheet
    // now and has no grip at all, so the claim moves to a window that can still
    // do it. REPORTS carries the SOURCE end of the thread, so the read is
    // `endpointsOf(d)[0]` — `[1]` is the slot end, which a REPORTS resize does
    // not touch.
    //
    // The drag is HORIZONTAL only. REPORTS is full column height since T1
    // (`layout.ts` gives it y 94 · h 692 at 1280×800), so its 16px grip sits
    // ~14px above the viewport floor and a downward drag would carry the
    // pointer off the desk — the same geometry that made the FILE version of
    // this test red. Widening the window widens the justified body, which is
    // what moves the source pin (`right(rect) - 6`).
    const grip = await box(page, `${REP} .win-grip`)
    const [before] = endpointsOf(await threadPath(page))
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(grip.x + 120, grip.y + grip.height / 2)
    await page.waitForTimeout(50)
    const [during] = endpointsOf(await threadPath(page))
    expect(before[0] !== during[0] || before[1] !== during[1]).toBe(true)
    await page.mouse.up()
  })
```

## Invariants

- **WCAG 2.1.1** — no window may resize by pointer without a keyboard
  equivalent. This unit removes both from one window; it must not remove one
  from any window.
- **`button()` names a control through `title`** (`shell/dom.ts:28-33`), and the
  grip has no visible text, so its `title` IS its accessible name.
- **The frame is shared by all three windows.** Anything not gated on the flag
  changes REPORTS and LIVE FEED too.
- **The membrane is untouched.** The grip carries no `data-op`; the five-op
  census must be unchanged.
- **`window-registry.ts`'s shadow type.** `tests/shell/window-registry.test.ts:28`
  declares a private `interface WindowDef` mirror. It asserts no exact key set,
  so `resizable` needs no entry there — but do not "fix" the mirror to match, and
  if a `tsc` error names it, that is a stop under §5.7.

## Verification

- `npm run check` · `npx vitest run` (expect **1599** — no vitest suite changes)
  · `npm run build`.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `npm run check` clean, `npm run build` clean.
- [ ] Full vitest green at **1599** — the same count as before this unit.
- [ ] **Behavioural:** the running client's registry says exactly one window is a
      fixed sheet. Write this scratch file, run it, then **delete it before
      committing** (a full `vitest run` would otherwise report 1601):

      ```bash
      cat > tests/scratch-g13-3.test.ts <<'EOF'
      import { describe, it, expect } from 'vitest'
      import { WINDOW_REGISTRY } from '../src/client/shell/window-registry.ts'

      describe('g13-3 scratch', () => {
        it('only the AGENT FILE is a fixed sheet', () => {
          expect(WINDOW_REGISTRY.filter((w) => w.resizable === false).map((w) => w.key)).toEqual(['file'])
          expect(WINDOW_REGISTRY.filter((w) => w.resizable !== false).map((w) => w.key)).toEqual(['feed', 'rep'])
        })
      })
      EOF
      npx vitest run tests/scratch-g13-3.test.ts
      rm tests/scratch-g13-3.test.ts
      ```

- [ ] `grep -n "win-grip" src/client/components/window-frame.ts` shows the class
      name on exactly one line, and that line is the `def.resizable === false ?`
      ternary.
- [ ] `git diff --name-only HEAD` names exactly these six files and nothing else:
      `src/client/shell/window-registry.ts` · `src/client/components/window-frame.ts` ·
      `src/client/shell/window-manager.ts` · `e2e/shell.spec.ts` ·
      `e2e/a11y.spec.ts` · `e2e/red-thread.spec.ts`.
- [ ] `git status --short` shows no `tests/scratch-g13-3.test.ts`, and the two
      untracked files under `planning/dday-scenario/drafts/` are still untracked.

## If this PRD is wrong

An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
