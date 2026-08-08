# g13-3 — the AGENT FILE is not resizable, by pointer or by key

> plan-playtest v14 · **DRAFT — stamp against `main` before firing** · branch `playtest/g13-3-file-not-resizable`
> commit message: `playtest(g13-3): the AGENT FILE is a fixed sheet — no grip, no keyboard resize`

**Author's note (read first).** The design below is fully resolved and is not
the executor's to revisit. The change list is written from a session that ran
out of context before it could verify every anchor verbatim. **Every row marked
`STAMP` must be re-read against the tree and rewritten as exact current text
before this PRD is handed to an executor.** §5.6's stamp step is not optional
here; it is the reason this file says DRAFT.

## Outcome

The AGENT FILE cannot be resized. It has no corner grip, and Shift+arrow on its
title bar does nothing. It still drags, collapses, closes and raises exactly as
it does today, and so do the other two windows — REPORTS and LIVE FEED keep both
their grip and their keyboard resize.

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
- `src/client/components/window-frame.ts` — build no grip when the flag is off
- `src/client/shell/window-manager.ts` — gate the Shift+arrow branch on the flag
- `e2e/shell.spec.ts` · `e2e/a11y.spec.ts` · `e2e/red-thread.spec.ts`

Must NOT modify:

- `src/client/shell/layout.ts` — the arrangement is settled; this unit changes
  what a gesture can do to it, not the arrangement.
- `e2e/acceptance.spec.ts` — its resize test targets REPORTS (`:401`) and is
  unaffected. If it goes red, stop and report.
- `src/client/windows/agent-file.ts` — the window's contents are not this unit's
  business.

Test files this unit turns red, all **amended, not relaxed**:

- `e2e/shell.spec.ts:138` — asserts every window has exactly one grip. Becomes
  two-of-three, naming the file as the exception and why.
- `e2e/shell.spec.ts:169,:180` — resize loops over all windows; they skip the
  file.
- `e2e/a11y.spec.ts:402,:409,:479` — the `.win-grip` census and keyboard sweep
  drop from three grips to two.
- `e2e/red-thread.spec.ts:555` — **re-aimed onto REPORTS**, see below.

## The red-thread re-aim (the one real judgement call)

`[u8#c2] "a resize by the grip re-draws within a frame"` grips `#w-file` and
reads the thread's **slot** endpoint. With no grip on the file that claim cannot
exist. It is re-aimed onto **REPORTS**, gripping `#w-rep` and reading the
**source** endpoint — the same criterion (a resize redraws within a frame) on the
window that can still do it. `endpointsOf(d)[0]` is the source end;
`[1]` is the slot end.

This test is currently **RED on `playtest/wave-g13`** for an unrelated reason
(T3 put the file's grip 14px from the viewport edge, so its +120 drag carried the
slot off-screen). Do not try to fix that; the re-aim retires it. If the re-aimed
test fails on REPORTS, that is a genuine finding — stop and report it.

## Change list

### E1 — `STAMP` — `src/client/shell/window-registry.ts`

Add `resizable: false` to the AGENT FILE's entry only. Read the file, find the
window-definition type and the file's row, and write both edits verbatim. The
flag defaults to resizable when absent, so REPORTS and LIVE FEED need no edit.

### E2 — `src/client/components/window-frame.ts:64-67`

Current text (verified 08-08):

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

`WindowFrame.grip` becomes `HTMLButtonElement | null` — **`STAMP`**: find its
declaration (it was at `:20`) and widen it, then fix every consumer `tsc` names.

### E3 — `src/client/shell/window-manager.ts:145-149`

Current text (verified 08-08):

```
      if (event.shiftKey) {
        resize(frame, rect.width + delta[0], rect.height + delta[1])
        return
      }
```

Replacement text:

```
      // Shift+arrow resizes — except on a fixed sheet, which resizes by no
      // means at all. Gating it here rather than desk-wide is deliberate: this
      // branch exists BECAUSE pointer-only resize left clipped content
      // unreachable by keyboard (WCAG 2.1.1), so a window that still resizes by
      // pointer must keep it.
      if (event.shiftKey) {
        if (frame.def.resizable === false) return
        resize(frame, rect.width + delta[0], rect.height + delta[1])
        return
      }
```

### E4 — `STAMP` — the title bar's accessible name

The bar announces the keyboard path. On a fixed sheet it must not promise a
gesture that does nothing. Find where the bar's `title`/accessible name is built
(`window-frame.ts`, near the bar), and drop the Shift+방향키 clause when
`def.resizable === false`. Write both strings verbatim; do not invent copy —
reuse the existing wording minus that clause.

### E5-E8 — `STAMP` — the four e2e amendments

Listed under Scope with their line numbers. Each is mechanical once read:
the grip census expects two, the resize loops skip `#w-file`, and
`red-thread.spec.ts:555` grips `#w-rep` and compares `endpointsOf(d)[0]`.
**Read each one and write it verbatim before firing.**

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

## Verification

- `npm run check` · `npx vitest run` (expect **1599**) · `npm run build`.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `grep -c "win-grip" ...` — the desk builds exactly two grips.
- [ ] Full vitest green at 1599.
- [ ] **Behavioural:** in a node one-liner or scratch test, show the AGENT FILE's
      definition carries `resizable: false` and the other two do not. Delete any
      scratch file before committing.
- [ ] `git diff --name-only` names exactly the six Scope files.

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
