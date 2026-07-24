# DISCOVERY — apothecary demo

Running log of spec gaps, UI-verification friction, and pipeline gaps
(first-class deliverable feeding the super-pipeline game-mod — PRD §7).

## u2 — Phase state machine (TEST agent, TDD-Red)

### Spec gap: no design.md/spec.md for this unit
`.claude/super/units/u2/` held no `design.md` or `spec.md` (low-complexity → DESIGN
skipped). The acceptance contract was pinned from PRD §1.1 (5-phase shell), §1.4
(overlap rhythm) and §2 (patience) and is expressed by the exported surface in
`src/state/index.ts`. Event names (`advance` / `proceedToCrafting` / `commit` /
`deliverOutcome` / `chooseDialogue`) and the identity-no-op convention for illegal
transitions are test-defined, not spec-defined — see `.claude/super/units/u2/tests.md`.

### Resumed-state note: suite is GREEN, not RED
This worktree is a resumed pipeline: u2's implementation is already committed
(`4db3a32 [u2] Add apothecary phase state machine (pure TS)`), so the pre-existing
TDD-Red suite (`tests/state/{machine,patience,overlap}.test.ts`, 77 assertions)
reports 77/77 passing. RED was not re-manufactured because that would require deleting
committed implementation — out of the TEST agent's scope and against the
no-history-destruction rule. The tests are non-vacuous (removing `src/state/index.ts`
breaks all three imports), so the RED guarantee holds by construction.

## u5 — Shared UI primitives (TEST agent, TDD-Red)

### Spec gap: no design.md/spec.md for this unit
This unit is a refined-DAG "Shared UI primitives" node that does not correspond to
PRD §6's u5 ("Outcome channels + overlap"). No `design.md`/`spec.md` was emitted for it,
so the TEST agent inferred and pinned the acceptance contract from PRD §1.2 (card-feel),
§1.3 (animation vocabulary) and §4.1/§4.5 (invariants). CSS keyframe/token names and the
card factory shape (`.card`, `.card--selected`, `<button>`/`role=button`) are test-defined,
not spec-defined — see `.claude/super/units/u5/tests.md`.

### Scope gap: e2e/cards.spec.ts needs a render surface not in the unit's file_globs
`e2e/cards.spec.ts` is the honest behavioral gate (real hover/press/selected + transitions),
but it requires the served page (`/`) to actually render `.card` primitives. The unit's
`file_globs` cover `src/ui/**`, `src/styles/*.css`, and the e2e spec — but **not**
`src/main.ts`, `index.html`, or `vite.config.ts`, which are what mount content onto the page.
As written, the demo entry (`src/main.ts`, owned by u1) renders only the scaffold shell, so
the e2e cannot see any card.

Resolution needed by the implementer/integrator (pick one):
- widen this unit's scope to let it surface a small primitives showcase on `/`
  (e.g. mount example cards into `#app`), or
- have a consuming screen unit (u3 conversation / u4 crafting) render real `.card`s and let
  cards.spec.ts run once such a screen is reachable at `/`.

The pure-static half of the contract (`tests/ui/cards.test.ts`, vitest) has **no** such
dependency and fully gates the CSS + card-factory source within the unit's own scope.

### Scope addition
Added `tests/ui/cards.test.ts` (vitest) — not enumerated in the unit's file_globs, but
consistent with PRD §5 ("tests live in demos/apothecary/tests/") and needed to gate the
CSS/source contract without a browser.

### Scope resolution (IMPLEMENT agent) — render surface wired via src/main.ts
Picked option 1 of the "Scope gap" above: u5 now surfaces a small primitives
showcase on `/`. Added `src/ui/showcase.ts` (`mountCardShowcase`) and a two-line
edit to `src/main.ts` (owned by u1, outside u5 file_globs) to mount example
`.card`s into `#app`. The edit is additive (import + one call) and leaves the
scaffold shell + smoke invariants intact (`#app` non-empty, no external requests).
The style layer is imported from `src/ui/card.ts`, so any card consumer pulls in
base tokens + card states + animation vocabulary. A later conversation/crafting
screen can drop the showcase mount and render domain cards instead.

### Review follow-up (PR #25, Lead) — main.ts touch flagged as a boundary concern
Lead review confirmed the code itself (card factory, CSS, motion) is type-safe and
GREEN across unit/e2e/build, but flagged the `src/main.ts` edit as crossing u5's
`file_globs` into u1-owned territory, and asked for an explicit call between:
(a) widening u5's `file_globs` to formally cover this edit, or (b) moving the render-surface
wiring to the integration stage / a consuming screen unit (u3 conversation / u4 crafting).

That decision is outside this unit's authority — `file_globs` are a decompose-phase
artifact only Lead/PM can amend, and this PR's author cannot resolve review threads.
Recorded here for the integrator to action explicitly, with the mitigating facts as of
this PR:
- the touch is 2 lines (one import, one call), additive, and already marked with a
  `TODO(u3/u4)` for removal once a real screen renders domain cards at `/`;
- u1's scaffold unit (#18) is already merged, so there is no live/concurrent edit to
  `main.ts` to conflict with at this moment — the residual risk is only at the u3/u4
  integration step, which will touch `main.ts` anyway to wire in real screens and can
  delete the showcase mount in the same edit;
- no index.html/vite.config.ts changes were made (those would have been a strictly
  larger boundary crossing with no equivalent self-cleaning path).

Given the physically single-entry nature of this Vite app (`index.html` → `src/main.ts`
is the only script tag), there was no way to satisfy the e2e gate's real-browser render
requirement without crossing into either `main.ts` or `index.html`; option (a) was the
smaller, self-documenting, self-removing crossing of the two. Flagging explicitly rather
than re-guessing so Lead/integrator can make the call the review asked for.

## u6 — Conversation screen (IMPLEMENT agent, TDD-Green)

### State anomaly (TEST agent, u6 — re-run seeding)
On entry the u6 worktree was at `progress.phase="setup"` yet already contained a
**complete, green** implementation from a prior attempt (conversation.ts, conversation.css,
the standalone harness, and the vite/tsconfig build wiring), alongside the RED spec
`e2e/conversation.spec.ts`. An incomplete reset left impl + tests coexisting.

Verification performed (non-destructive): I confirmed the test suite is an **honest RED**
by temporarily moving the implementation aside (impl files → /tmp, vite.config.ts +
tsconfig.json reverted to HEAD) and re-running — result **8 failed, 1 passed** (AC8 is a
vacuous asset-manifest guard, no raster portraits shipped), exactly matching tests.md.
Then restored the worktree to its original state — re-run **9 passed**. No work destroyed,
no implementation authored.

Handoff note for the orchestrator: `phase` is set to `test` per the TEST role, but the
IMPL(green) phase will find the feature already implemented and green — it should confirm,
not rebuild.

## u7 — Crafting screen (IMPLEMENT agent, TDD-Green)

Design §0 flagged four seam deltas vs. the greenfield spec; the build conformed to the
real u1–u3 contract. Recorded here (design §6 checklist):

- **D-1 · `data/crafting-config.json` authored here.** `data/ingredients.json` already
  existed (8 cards incl. gamcho/daechu/gukhwa/bakha) and was reused via the existing
  `loadIngredients()` — u7 authored none of it. The per-customer `OutcomeTable` is
  **injected** into `mountCrafting` (owned by the future app shell); u7 owns no customer data.
- **D-2 · Machine `commit` is payload-less.** `src/state/index.ts` is a pure
  `{phase,patience}` reducer with no session store, so u7 raises an injected
  `onCommit(result)` callback instead of calling a `commit(outcome,selection)` transition.
  The e2e harness (`e2e/harness/crafting/main.ts`) stands in for the app shell: it persists
  the result and flips a phase marker crafting → handover.
- **D-3 · Canonical outcome-key literals.** The method verbs `우리기/달이기/빻기` and
  declarations `정석/실험` u7 commits are matched **verbatim, case-sensitive** by the reused
  `resolveOutcome`/`canonicalKey`. Any future outcome-table author must match them byte-for-byte.
  They live in `data/crafting-config.json` (balance-as-data, N6), loaded + frozen by `config.ts`.
- **D-4 · Controlled cards, `card.ts` untouched.** `createCard` self-toggles, which can't
  express the ≤3-with-blocked-4th / single-select / two-state groups. u7 reuses the
  `.card`/`.card--selected` **CSS** vocabulary but renders controlled buttons from `view.ts`;
  `src/ui/card.ts` is left unmodified (OCP, no u5-test risk).

### Scope additions (files outside u7 file_globs, kept minimal + additive)
- `vite.config.ts` (u1-owned): added a second rollup input so `preview` serves the harness at
  `/e2e/harness/crafting/` from dist. `main` input unchanged → `/` still builds; all u5/smoke
  e2e stay green (19/19).
- `tsconfig.json` (u1-owned): added `"resolveJsonModule": true` so `config.ts` and the harness
  can statically import the balance JSON (no runtime fetch, N4). Additive, no behaviour change.
- `data/crafting-config.json` (new balance data) + `tests/screens/crafting/selection.test.ts`
  (TEST-agent-authored vitest slice) sit outside the crafting `src`/`e2e` globs but are
  consistent with the repo's balance-as-data + `demos/apothecary/tests/` conventions.

---

# u8/u9 — App shell + closing pass: the three deliverable lenses (PRD §7)

The per-unit notes above are the running log. This closing section synthesizes the
build across the required three lenses. It draws on friction that was actually hit
while wiring the two-customer shell (u8) and doing the juice/verification/ship pass
(u9) — not hypotheticals.

## 1. Spec gaps (ambiguities / underspecs)

- **No `design.md`/`spec.md` for low-complexity units.** u2 (state machine) and u5
  (shared primitives) shipped with the acceptance contract *inferred from the PRD and
  pinned by tests*, never written down as spec. Event names, the identity-no-op
  convention, CSS keyframe/token names, and the card-factory shape are all
  test-defined. That worked, but it means the tests ARE the spec — a reader can't
  distinguish "PRD requires this" from "an earlier agent chose this".
- **"handover" is a phase with no screen.** The §1.1 five-phase FSM
  (entrance/conversation/crafting/handover/outcome) reads like five screens, but
  `handover` is a transient machine beat between the crafting commit and outcome
  delivery — it renders nothing of its own. u9's "screenshot every phase" task had to
  *decide what that even means*; resolved by capturing the weighted `[건네기]`
  ready-to-commit beat as the handover frame. The spec never said handover has no UI.
- **Overlap trigger + notification lifecycle underspecified.** §1.4 says C1's outcome
  arrives "when C2's conversation begins" but not: level- vs edge-triggered (u2 chose
  level-triggered `>=`), nor whether the 재방문 card dismisses or persists. The demo
  *persists* it — visible in `06-door-note.png`, where C1's 재방문 card still floats
  beside C2's ending. Deliberate (both channels coexisting reads well), but a call the
  implementer made, not the spec.
- **Which outcome rows the demo drives toward is unspecified.** The e2e specs steer
  toward `entries[0]` of each table so the asserted/visible text is a *known* data
  value, not the fall-through `default`. Nothing in the PRD says the demo's canonical
  play-through should hit a specific row; picked for deterministic verification.
- **"dist must work under a Pages subpath" had no verification story.** It's a stated
  invariant (why `vite base:'./'` exists), but the obvious tool to check it —
  `vite preview` / `npm run preview`, which the e2e webServer already runs — only ever
  serves dist at the *root* `/`. The invariant that matters for the real deploy was, by
  construction, untestable with the in-repo tooling until u9 added a bespoke server.

## 2. UI-verification friction (green-but-unplayable risk)

- **The whole suite was green while every screenshot was unusable.** First screenshot
  pass fired `page.screenshot()` the instant each phase turned "visible". Every shot
  caught a mid-cross-fade frame: the outgoing phase still overlaid at partial opacity,
  staggered children half-faded, the 재방문 card barely materialized. 259 vitest +
  32 e2e assertions were all GREEN; the images were garbage. *No functional assertion
  can catch this* — it's a property of the rendered frame, not the DOM. Only opening
  the PNGs revealed it; the fix was a settle-wait before capture.
- **Playwright's "visible" ≠ a human's "visible".** Playwright treats `opacity:0`
  elements as visible and clickable (visibility keys off bounding box +
  `visibility`/`display`, not opacity). Convenient — staggered-entrance and mid-fade
  buttons never block `.click()`, so the juice pass didn't introduce flake — but it is
  *exactly why green ≠ seen*: the tool's notion of visible admits frames a human would
  call blank.
- **Screenshots were the single highest-leverage verification artifact.** They caught
  the cross-fade bug, confirmed the signature overlap actually *reads* (`05-overlap-
  revisit.png`: C1's 재방문 card floating over C2's live conversation — the mechanic,
  legible in one glance), and confirmed the Korean content renders with usable
  contrast. The e2e assertions proved DOM+state; only the image proved the thing was
  playable. For a UI demo, "capture every phase" belongs in the gate, not as polish.
- **What stills still miss: motion quality.** The juice (type-on, patience-drain
  colour shift, arrival-pop, commit-beat) is the point of §1.3 and is *invisible in a
  still frame*. A screenshot gate confirms layout + content + contrast; it says nothing
  about timing/easing/choreography. Judging feel needs live play or GIF/video capture —
  a gap the game-mod's GIF requirement targets.

## 3. Pipeline gaps (what the harness lacked for a UI demo)

- **The loop-until-green gate is blind.** It gates on build/test/typecheck/e2e *exit
  codes* — all binary, none visual. A unit reaches GREEN and can still ship an
  unreadable or half-rendered screen (see lens 2). The game-mod P0 "screenshots/GIFs on
  unit PRs" is confirmed necessary, not nice-to-have; screenshots should be captured
  **and attached to the PR automatically** (ideally snapshot-diffed), so a reviewer sees
  the frame the gate can't judge.
- **No subpath / deploy-verify step.** The e2e webServer runs `preview` at root, so the
  relative-asset invariant that governs the *actual* Pages deployment
  (`…/nhn-game-2026/demos/apothecary/`) was structurally unverified. u9 had to hand-roll
  an in-test static server that serves `dist/` under a deep prefix (`e2e/subpath.spec.ts`).
  The game-mod's deploy-verify step should serve dist under the *real* Pages base path,
  not root — otherwise base-path regressions ship green.
- **`file_globs` don't model a single-entry SPA.** Recurring across u5/u7/u8: every UI
  unit had to touch a shared entry surface (`src/main.ts`, `index.html`,
  `vite.config.ts`, `tsconfig.json`) that sat *outside its file_globs*, because a Vite
  SPA has one physical entry and a screen is only verifiable-at-`/` once wired into the
  shell. The decompose phase drew screen boundaries as if screens mounted independently;
  they don't. The harness had no way to express "this unit owns a screen AND its wiring
  into the shell", so each unit crossed the boundary ad hoc and flagged it for the
  integrator. Decompose should either grant screen units their shell-wiring seam, or
  make shell integration its own explicit unit.
- **No playtest / composition beat until the last unit.** Per-screen green arrived long
  before anything confirmed the screens *compose into a playable minute*. The honest
  end-to-end gate (`e2e/full-loop.spec.ts` — both customers, the overlap, the ending,
  zero console errors) had to be authored by hand as the closing unit. The game-mod's
  playtest agent should own this composition check continuously, not defer it to whoever
  builds last.

## Preview under a Pages subpath — verified command

`vite preview` alone serves dist at `/`. To reproduce the real Pages nesting manually
and confirm relative assets resolve (the `e2e/subpath.spec.ts` invariant):

```bash
npm run build
npx vite preview --outDir dist --base /nhn-game-2026/demos/apothecary/ --port 4173 --strictPort
# open http://localhost:4173/nhn-game-2026/demos/apothecary/
```

Verified: root `/` 302-redirects to the base subpath; the subpath serves `200` with
`#app` and boots with zero console errors. `e2e/subpath.spec.ts` automates the same
check headlessly (its own in-test server under a deep prefix), so it runs in the gate.

## Phase screenshots (u9)

`e2e/full-loop.spec.ts` captures one frame per phase to `e2e/artifacts/` (committed,
not gitignored) as it plays the real app at `/`:
`01-entrance` · `02-conversation` · `03-crafting` · `04-handover` (the weighted
`[건네기]` beat) · `05-overlap-revisit` (the §1.4 overlap: C1's 재방문 over C2's live
talk) · `06-door-note` (the 문앞 쪽지 ending).
