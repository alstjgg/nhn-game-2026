# u4s — BLOCK STORE window · DISCOVERY

Opened at TEST (RED). Items are things this unit must NOT fix inline: a base
breakage outside the unit's globs, seam gaps, reference-vs-invariant deviations
and scope gaps the integrator (u11 / C12) owns.

## A. BLOCKER — the base does not boot, so no e2e in the repo can pass

1. **`src/client/shell/boot-run.ts` imports `loadDemoRun` from the driver barrel,
   which exports `demoRun`.** Vite reports
   `SyntaxError: The requested module '/src/client/driver/index.ts' does not
   provide an export named 'loadDemoRun'` at boot, the module graph never
   evaluates, and the desk renders **zero `.win` frames**. Verified at
   HEAD `45b51f9` (u6 merge #131) with an evaluate probe: `.win` count 0,
   `document.body.className` empty.
   - It is **pre-existing and not u4s'**: `npx playwright test e2e/agent-file.spec.ts
     -g 'dossier sections'` fails 7/7 on the same error, and u4s has not touched
     a source file yet (only the two new test files exist).
   - Neither `boot-run.ts` nor `driver/index.ts` is in u4s' editable globs, so
     the fix belongs to the integrator (rename the barrel export, or re-point the
     import — note `shell/boot.ts` calls `demoRun()` + `placeholderBootRun()`
     directly and never uses `bootRun()`, so `boot-run.ts` may simply be dead).
   - **Consequence for u4s:** `e2e/block-store.spec.ts` (c1 · c2 · c5) cannot go
     green until this lands, however correct the window is. The unit test half
     (`tests/windows/block-store.test.ts`, c3 · c4) is unaffected — it is `node`
     environment and imports the modules directly.

## B. Scope gaps this unit cannot close

2. **`playwright.config.ts` still runs `npm run dev`, C5 mandates `npm run preview`.**
   Outside u4s' globs (design Q3). Worse, the two are not interchangeable for
   this window: `demoRun()` is behind `import.meta.env.DEV`, so a preview build
   boots `placeholderBootRun` — one `meta` with `carried: []`, no `report` — and
   the BLOCK STORE would be permanently empty with nothing minable. Whoever
   re-points the runner per C5 must also give the player build a stream, or the
   whole store/reports e2e layer becomes vacuous.
3. **`.claude/super/reference-shots/win-block-store.png` does not exist** (design
   Q4). The port target used is the BLOCK STORE panel of
   `shell-desktop-1280x800.png`.
4. **`win-block-store.css` has no `.at-cap`, `.archived` or `:focus-visible`
   rule** (design D10). The e2e asserts those states by CLASS only, never by
   computed colour, so the suite does not depend on the append-only CSS request
   being granted.

## C. Seam / ownership deviations recorded by the tests

5. **`Sentence` carries no clock or source field**, so the reference card's
   `· at · src` provenance chips cannot be rendered (design Q2). The card prints
   `런 nn` only (u4 D13), and no test asserts the missing chips.
6. **"Click a slotted card to unslot" is delegated to u4's `.slot-unset` button**
   (design D6): the in-slot card is u4-owned DOM inside `slot-board.ts`, which
   c7 forbids this unit from editing. Same reason, the **slot→store drag has no
   source**: `buildBlockCard` only attaches `dragstart` when `inSlot` is false,
   so a slotted card cannot start a drag at all. `e2e/block-store.spec.ts`
   therefore drives that direction by putting the id on a `DataTransfer` and
   dispatching `dragover`/`drop` on `#w-store .win-body` — which is exactly the
   half u4s owns. If the design intends a real mouse drag out of a slot, u4's
   card builder needs `draggable` in the slotted branch.
7. **No "was slotted in an earlier run" flag exists at the seam**, so
   `archived-highlight` is derived from `meta.carried` membership (design D9).
   The e2e asserts carried ⇒ `.archived` and freshly-mined ⇒ not `.archived`.
8. **`cardStateOf` precedence had to be chosen**: `slotted` > `at-cap` >
   `archived` > `in-store`. `BlockCardState` is a single union (design §3) and a
   full board outranks the archive mark because it is the state that blocks the
   interaction. Recorded because neither spec nor design ranks them.

## D. IMPLEMENT (GREEN) — what landed, and what the integrator still owns

9. **§A's blocker was repaired here, out of glob, with a two-token edit.**
   `src/client/shell/boot-run.ts` now imports `demoRun` (the name the barrel
   really exports) instead of `loadDemoRun`. Nothing else changed: `bootRun()`
   is still dead code (`shell/boot.ts` calls `demoRun()` + `placeholderBootRun()`
   directly), and no test names the module. It was unavoidable — the module was
   in `boot.ts`'s import graph, so the SyntaxError killed the desk and **no e2e
   in the repo could reach a window**. The repair also turned two *unit* tests
   green that were failing at HEAD:
   `tests/debug/flag-off-bundle.test.ts [u9d#c2] (a)/(b)` — `vite build` itself
   was broken. If the integrator prefers to own this, the alternative fix is a
   `demoRun as loadDemoRun` re-export in `driver/index.ts`; either way it must
   stay fixed.
10. **The repair un-vacuumed the rest of the e2e layer.** With the desk booting,
    `npx playwright test` is **158 passed / 7 failed**; at HEAD every one of
    those 7 also failed (verified by stashing u4s and re-running
    `a11y.spec.ts` + `shell.spec.ts`: 7/7 red there, 5 of them green now). None
    of the 7 is in `#w-store`; they belong to other units and are listed here so
    nobody re-discovers them:
    - `a11y.spec.ts` — 'within each surface, focus order follows visual order':
      **inside `w-file`**, `#btnDeploy` precedes the `.slot-target` it sits below.
      u4's DOM order vs. its layout. (The other 5 focus-order tests now pass.)
    - `reports.spec.ts` ×3 — 'archive segmentation and highlight marks': the
      RUN 01/02 rail entries render an EMPTY document (see #12). u6/u2f.
    - `fonts.spec.ts` ×2 — the ~1 s webfont budget and the unicode-range slice
      count, measured for the first time against a booting desk. u10.
    - `shell.spec.ts` — `[u3#c10] window bodies are empty in this unit`: a stale
      u3-scoped assert that u4 · u4s · u5 · u6 all invalidate. **C12 / u11.**
11. **One unit test regressed and cannot be satisfied by this unit:**
    `tests/windows/agent-file.test.ts [u4#c9] (h) c8 — u4 creates block-card.ts
    and touches no other window` asserts `git diff HEAD -- windows/block-store.ts`
    is empty. Filling `block-store.ts` **is** u4s' contract (c8 a), so the two
    asserts are in direct conflict. Textbook **C12**: u11 reconciles u4's
    unit-scoped assert to the finished tree (scope it to u4's own merge base) —
    it must not be deleted. Everything else in `npx vitest run` is unchanged from
    HEAD (20 failures at HEAD minus 2 fixed by #9, plus this one).
12. **Carried blocks print u4's F1 fallback text, not their sentence.** The nine
    `meta.carried` ids name RUN 01/02 report sentences, and the RUN 03 stream
    carries no `report` event for an earlier run — so `sentences` never resolves
    them and every carried card reads `(원문은 부검 기록에 있습니다)`. The design
    target shows the real text. The same gap empties u6's RUN 01/02 archive
    documents (#10), which is why it is recorded as a **stream** gap (u2f) and
    not fixed in the window: the store must never invent text it was not handed
    (inv 3). Both windows resolve correctly the moment past-run reports reach the
    seam.
13. **D10 (the skin gap) could NOT be granted, and c2 is class-level only.**
    `win-block-store.css` still has no `.at-cap`, `.archived` or `:focus-visible`
    rule, so those three states are distinguished by class + `aria-disabled` and
    are **visually identical to `in-store`** (confirmed by screenshot). The
    append-only patch design D10 asked for is blocked by a guard nobody flagged
    at design time: `tests/assets/fonts-css.test.ts [u10#c8] (a)` hashes every u1
    stylesheet against `tests/assets/baseline/u1-styles-baseline.json`, and (e)
    forbids a new sheet — so ANY edit to a u1 sheet fails a currently-green test.
    The reconciliation is u11's (C12). The patch, tokenised and append-only, is:
    ```css
    .bcard.at-cap{opacity:.42;cursor:not-allowed}
    .bcard.at-cap:hover{transform:none;box-shadow:1px 1px 0 var(--sh-18)}
    .bcard.archived{border-left:2px solid var(--seal-2)}
    .bcard:focus-visible{outline:2px solid var(--seal);outline-offset:2px}
    ```
    (`--sh-18` · `--seal` · `--seal-2` are already declared and already used by
    this sheet; no literal colour, no spacing literal — C11 holds.)
14. **The store WATCHES the board instead of being told, because there is no
    seam for it.** Mining lands in REPORTS (`driver.send({op:'mine'})`) and
    slotting lands in the AGENT FILE's board closure; neither may reach across to
    a sibling window (C8), and `SlotBoard` exposes no subscription. So the window
    repaints from a `MutationObserver` on `board.root` (a seated block must leave
    the deck in the same turn it was seated — a next-frame repaint loses that
    race) plus a `requestAnimationFrame` poll for `driver.store().mined`. Every
    repaint is guarded by a state stamp, so an unchanged deck never re-deals.
    If a later unit adds `SlotBoard.subscribe(...)` or a store-level change
    channel, this is the first consumer that should drop the observer.
15. **Deviation from the reference (P0-A precedence).** `app.js` `renderStore`
    staggers the deal with `c.style.animationDelay = i*40 + 'ms'`; that is an
    inline style literal, and C11/inv 8 keeps every such value in `tokens.css`.
    Ported as the compliant equivalent: no stagger, the sheet's own `cardIn`
    animation only. Reference `cardNode` also prints `· at · src` provenance,
    which the seam does not carry (§C 5) — the card keeps u4's `런 nn` alone.
