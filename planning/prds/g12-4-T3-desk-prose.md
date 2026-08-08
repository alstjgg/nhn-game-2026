# g12-4 — T3: the desk's own comments describe the desk that exists

> plan-playtest v13 · citations bind to `f9bae7e` · branch `playtest/t3-desk-prose`
> commit message: `playtest(T3): the layout's prose describes the three-window desk it computes`

## Outcome

Nothing the player sees changes. `src/client/shell/layout.ts` stops telling a
reader about five windows, a BLOCK STORE column and a floating TALLY sheet — none
of which exist — and describes the three-column desk it actually returns. Two
other modules stop counting five windows and stop citing BLOCK STORE's markup
position as a live constraint.

T1 and T3 were planned as one unit that would move rects and lift a focus-order
quarantine. **Both already landed with T1**: `WINDOW_KEYS` and `DESK_ORDER` are
three long, `applyLayout` returns three full-height columns, both
≥4-distinct-origin floors already read `>= 3`
(`tests/shell/apply-layout.test.ts:104`, `e2e/shell.spec.ts:359`), and the
`test.fail` quarantine in `e2e/a11y.spec.ts` is gone. What was left of T3 is the
prose, and prose that contradicts the code is what this unit removes.

## Scope

May modify, only these four files:

- `src/client/shell/layout.ts`
- `src/client/driver/run-loop.ts`
- `src/client/styles/base.css`
- `src/client/styles/shell.css`

Must NOT modify:

- Any executable line anywhere. **Every edit in this unit is inside a comment.**
  If an edit would change a declaration, an expression or a CSS rule, the PRD is
  wrong — stop under §5.7.
- `src/client/shell/boot.ts` and `src/client/shell/run-state.ts` — their
  "five windows" and TALLY comments are fixed by another unit this wave.
- `src/client/windows/reports.ts`, `src/client/components/minable-sentence.ts`,
  `src/client/components/block-card.ts` — their BLOCK STORE references are
  provenance ("ported from", "T1 dissolved that window"), which is true history,
  and two of them belong to other units.
- `src/client/styles/tokens.css` and `src/client/styles/paper.css` — same reason:
  those name the stock a token was drawn for, which is still what it is.

Test files this unit turns red: **none.** No test asserts any of this text
(grep-verified). A red anywhere is a signal that an edit escaped a comment.

## Change list

Same-file edits are listed **bottom-up**; apply in the order given.

### E1 — `src/client/shell/layout.ts:37-49`

Current text:

```
/**
 * The desk's READING order — the order the arrangement below puts the windows
 * in on screen, row by row and left to right: LIVE FEED (x14) · REPORTS (x369)
 * · AGENT FILE (x891) on the top row, BLOCK STORE under REPORTS, and the TALLY
 * sheet, which is hidden until 21:04, last.
 *
 * `#desktop`'s child order follows THIS, not `WINDOW_KEYS`. Tab used to walk
 * the registry order (feed · file · store · rep) while the desk was laid out
 * feed · rep · file · store, so three of the four window transitions sent focus
 * somewhere the eye did not predict — WCAG 2.4.3 Focus Order (Level A), and the
 * defect `e2e/a11y.spec.ts` quarantined under `test.fail` because u9 was not
 * allowed to touch u3's shell. The registry/taskbar order is unchanged.
 */
```

Replacement text:

```
/**
 * The desk's READING order — the order the arrangement below puts the windows
 * in on screen, left to right in one row: LIVE FEED · REPORTS · AGENT FILE.
 *
 * `#desktop`'s child order follows THIS, not `WINDOW_KEYS`. Tab used to walk
 * the registry order while the desk was laid out in another, so window
 * transitions sent focus somewhere the eye did not predict — WCAG 2.4.3 Focus
 * Order (Level A). `e2e/a11y.spec.ts` quarantined that defect under
 * `test.fail` while u9 was forbidden from touching u3's shell; the quarantine
 * is lifted and the assert compares tab order to the rects row-major, so this
 * export drifting from the arrangement below is a real red. The
 * registry/taskbar order is unchanged.
 */
```

### E2 — `src/client/shell/layout.ts:32`

Current text:

```
/** The four desk windows, in the order the taskbar and the registry use. */
```

Replacement text:

```
/** The three desk windows, in the order the taskbar and the registry use. */
```

### E3 — `src/client/shell/layout.ts:1-31`

Current text:

```
// [u3#c2] The default desk arrangement — a pure function of the viewport.
//
// Ported from docs/design/phase2-ui/app.js `applyLayout()` (lines 98..122):
// the same column ratios (.265 / .395), the same 94px chrome band, the same
// .565 split between REPORTS and BLOCK STORE, the same 14/16px gutters. The
// reference read the ambient viewport and wrote straight into the DOM; here
// the viewport is an argument and the arrangement is the return value, so the
// desk can be computed — and asserted — without a DOM at all.
//
// TALLY IS A FLOATING SHEET AGAIN (u7, 08-04 — see discovery/u7.md).
// u3 originally deviated here: it parked TALLY in a 26 %-of-desk band under
// the three columns so that all five windows could tile at once ([u3#c1]).
// u7 ships the window's contents, and the band cannot hold them — at 1280×800
// it is 180 px tall against 415 px of ledger (head · headline · one rule per
// scored axis · verdict · the wait line and NEW RUN), so the ledger, the wait
// line and the window's only button all render below the frame. C9 forbids
// that ("nothing off-screen in the default layout"), u1's shipped `.tly-*`
// skin is sized for the reference's tall sheet, and u7 may write neither CSS
// nor inline geometry — so the band is not a fixable shape, and this file goes
// back to the reference's own arrangement (app.js line 122):
//
//   set('tally', max(20,(W-730)/2), TOP+16, 730, min(626, H-16))
//
// which is why the three columns take the whole desk height again. The premise
// of u3's deviation is gone with it: TALLY boots hidden (u7 mounts it closed)
// and comes up only at 21:04, so it buries nothing while the day is running,
// and it is the reference's "the tally owns the screen at end of run".
//
// Floors keep every box positive below the supported 1280×800 minimum (C9):
// out of support degrades, it never inverts.
```

Replacement text:

```
// [u3#c2] The default desk arrangement — a pure function of the viewport.
//
// Ported from docs/design/phase2-ui/app.js `applyLayout()` (lines 98..122):
// the same column ratios (.265 / .395), the same 94px chrome band, the same
// 14/16px gutters. The reference read the ambient viewport and wrote straight
// into the DOM; here the viewport is an argument and the arrangement is the
// return value, so the desk can be computed — and asserted — without a DOM at
// all.
//
// THREE COLUMNS, FULL HEIGHT (T1, 08-07). The desk this file lays out has held
// five windows, then four, and now three: u7 floated TALLY back out of the
// column band it was parked in, U3 dissolved TALLY into the AGENT FILE and the
// report, and T1 dissolved BLOCK STORE into REPORTS. What is left tiles without
// a special case — LIVE FEED, REPORTS and AGENT FILE side by side, each taking
// the whole desk height — so the arrangement below is the reference's own again
// and the .565 split that once cut REPORTS in half is gone with the window it
// made room for.
//
// `DESK_ORDER` below must move with these rects: the focus-order assert in
// `e2e/a11y.spec.ts` compares tab order to them row-major.
//
// Floors keep every box positive below the supported 1280×800 minimum (C9):
// out of support degrades, it never inverts.
```

### E4 — `src/client/driver/run-loop.ts:12`

Current text:

```
// - **the listener set** — `game-clock`, the five windows and the run counter
```

Replacement text:

```
// - **the listener set** — `game-clock`, the three windows and the run counter
```

### E5 — `src/client/styles/shell.css:156-157`

Current text:

```
/* no stacking context here — every .win must share one z-order, including the
   BLOCK STORE, which lives outside #desktop in the markup */
```

Replacement text:

```
/* no stacking context here — every .win must share the one runtime `--z`
   ladder the window manager writes. The rule outlived its original reason
   (BLOCK STORE used to sit outside #desktop in the markup; T1 dissolved it):
   `display:contents` is what keeps this element from creating one. */
```

### E6 — `src/client/styles/base.css:4-6`

Current text:

```
   Nothing here may create a stacking context: `.win` roots are z-ordered by a
   single runtime `--z` and BLOCK STORE lives outside `#desktop` in the markup,
   so html / body / #app must stay neutral (design README 'Notes').
```

Replacement text:

```
   Nothing here may create a stacking context: `.win` roots are z-ordered by a
   single runtime `--z` shared across the whole desk, so html / body / #app must
   stay neutral (design README 'Notes').
```

## Invariants

- **Comments only.** `git diff` for this unit must show no change to any line
  that is not inside a comment. This is the unit's whole safety property.
- **Layout is TypeScript, not CSS**, and `DESK_ORDER` must move with the rects.
  Neither moves here — E1 documents the coupling, it does not change it.
- **No stacking context may be created** in `base.css` or at `#desktop`. E5 and
  E6 rewrite the *reason* recorded beside those rules and touch neither rule.

## Verification

- `npm run check` — passes.
- `npx vitest run` — the full suite passes. Report the count.
- `npm run build` — passes.
- `git diff -U0 | grep -E '^[+-]' | grep -v '^[+-][+-]'` — read every line of the
  output and confirm each is a comment line (`//`, `/*`, ` * `, or inside a CSS
  comment block). Paste the count of changed lines in your report.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `git diff --name-only` names exactly four files.
- [ ] Every `+`/`-` line in the diff is inside a comment.
- [ ] `grep -rn "five windows" src/client/driver/run-loop.ts` returns nothing.
- [ ] `grep -n "four desk windows" src/client/shell/layout.ts` returns nothing.
- [ ] `grep -n "BLOCK STORE" src/client/styles/base.css` returns nothing.
- [ ] In `layout.ts` and `shell.css`, every surviving mention of "five windows"
      or "BLOCK STORE" is **provenance** — a clause about what the desk used to
      hold, inside the replacement text E3 and E5 prescribe. Read each one and
      confirm it is narrating history, not claiming a present fact. No mention
      may be load-bearing for a reader trying to understand the current desk.

      *(Amended after execution. These three items originally demanded the
      strings vanish outright from `layout.ts` — which contradicted E3's own
      prescribed replacement, since the whole point of that rewrite is to say
      the desk "has held five windows, then four, and now three". The executor
      applied E3 verbatim, reported both greps as literal failures, and refused
      to edit prescribed text to satisfy a checklist. That is exactly right: a
      Done-when condition that fights the change list is a defect in the
      document, and §5.3's own rule — scope a grep to what the unit actually
      claims — is what was missed here.)*
- [ ] Full vitest run is green.
- [ ] **Behavioural:** `npm run build` succeeds and the built bundle is unchanged
      in behaviour — run `npx vitest run tests/shell/apply-layout.test.ts` and
      confirm the arrangement it asserts is byte-identical to before this unit
      (it must pass without amendment).

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
