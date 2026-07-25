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

## u1 — Stub adapter + boot factory (IMPLEMENT agent)

### Spec gap: no design.md/spec.md for this unit
`.claude/super/units/u1/` held only `tests.md` (the TDD-Red contract). The exported
surface of `src/ai/stub.ts` (`loadStubDialogue` / `selectScript` / `beatIndexFor` /
`resolveBeat` / `stableHash` / `pickPortraitUrl`) and of `src/ai/boot.ts`
(`chooseMode` / `createBootAdapter`) is therefore **test-defined**, pinned from
PRD §2.1 (800ms probe → live/stub) and §2.3 (latency only through the adapter).

### The boot probe accepts a function *or* an object exposing one
`tests/ai/boot.test.ts` passes the whole `fakeProbe()` spy (`{probe, args}`) as
`deps.probe` in the AC15 cases, and the bare `spy.probe` function elsewhere. Rather
than fail those cases, `BootDeps.probe` is typed `ProbeSource = HealthProbe |
{ probe: HealthProbe }` and normalized by `toProbe()`. Harmless for production
(u13 passes `probeHealth` directly), but it is an API shape the *tests* chose.

### Portrait assets are ES-imported, so the pool is hashed at build time
`assets/fallback-portrait-{1,2}.png` are `import`ed (not string paths) so Vite
emits and fingerprints them. Under vitest the import resolves to a path containing
the plain filename; in `dist` it becomes `assets/fallback-portrait-1-<hash>.png`.
Any future assertion on a portrait URL must not assume the un-hashed name outside
unit tests. Note the sheets only land in `dist` once u13 wires the adapter in —
this unit deliberately leaves `src/main.ts` / `src/app/index.ts` untouched, so
`stub.ts` is not yet in the bundle graph.

### `data/stub-dialogue.json` states no patienceCost
Cards carry `verb` only; the cost is stamped from `data/generation.json.verbCosts`
at load time (single tuning source, AC5). The script `problem` keys are byte-exact
matches of `data/customers.json` — `selectScript` does no trimming or fuzzy
matching, so renaming a customer's problem silently drops that script to `fallback`.
A test now imports the real `data/customers.json` and pins that every seeded
customer resolves to its own script (see PR #40 review follow-up below).

### Review follow-up (PR #40, Lead) — 8 threads, all fixed
Lead flagged eight issues against this unit's original cut. All eight were
accepted and fixed (no rebuttals):
- **`createBootAdapter` contract vs. reality.** JSDoc/AC16 claimed "never
  rejects", but a malformed `stubConfig.data` made it reject via `createStub`'s
  fail-loud data guard. Resolved by keeping fail-loud (consistent with D3) and
  correcting the doc + tests: AC16 now scopes "never rejects" to probe/live
  failures only; a new AC16b pins that bad canned data propagates.
- **`clueRevealsFor` leaked all canned ids when `availableClues` was empty**,
  contradicting the frozen proxy's rule ("없으면 clueReveals를 비운다"). The
  early-return special case is gone; an empty list now filters to `[]` like
  any other case.
- **The observe-card fallback could substitute a clue from a different
  customer's script** (label/clue drift), because the substitution was
  positional (`availableClues[0]`) with no script awareness. Fixed by
  restricting the fallback to clue ids that appear somewhere in the SAME
  script (`scriptClueIds`).
- **`BootDeps.probe` was widened to `HealthProbe | { probe: HealthProbe }`**
  only to accommodate three tests passing the whole probe spy instead of
  `spy.probe`. Reverted to `HealthProbe` only; the three call sites now pass
  `.probe` like every other test in the file.
- **Stub `PortraitSheet`s (`b64: ''`) were never checked against the same
  gate the live adapter enforces** (non-empty `b64` OR `url`). Added
  `isPortraitSheet` to `contract.ts` (mirrors `isDialogueBeat`'s role) and had
  the stub assert its own `dialogue()`/`portrait()` output against the shared
  validators before returning — the file header's "same contract validators
  as the live path" claim is now actually true, not just documented.
- **`data/generation.json`'s ailment strings can near-miss `data/customers.json`'s
  and silently fall to the generic default script**, with no test catching a
  rename. Added a drift-guard test that imports the real `customers.json` and
  asserts every seeded problem resolves to its own script; documented (in
  `selectScript`'s JSDoc) that `generation.json`'s wider ailment pool is NOT
  covered by canned scripts in v1 by design — future customer-generation work
  must extend the scripts or accept the fallback consciously.
- **The JSON key `default` mapped to a TS field named `fallback`.** Renamed
  the JSON key to `fallback` (data file + fixtures + tests) so the two names
  match; also added loader guards for an empty `scripts` array, duplicate
  `problem` keys, and an empty `problem` on a non-fallback script.
- **Two source-text greps (`stub.ts` has exactly one `setTimeout`; no
  `Math.random`/`Date.now` substring) stood in for behavioral assertions**,
  passing on real violations and breaking on harmless refactors. Replaced
  with a fake-timers test asserting exactly one real timer per call (and that
  it resolves), and a many-trials/cross-instance determinism test.

## u3 contract correction — `PixelContext.drawImage(source: never)` → `source: unknown`

The u3 spec §2 declared the injected-context method as
`drawImage(source: never, dx, dy, dw, dh): void`. A parameter typed `never` accepts no
argument at all, so `pixelate`'s own single call site cannot compile:

```
error TS2345: Argument of type 'T' is not assignable to parameter of type 'never'.
  Type 'PixelSource' is not assignable to type 'never'.
```

`src/ui/pixelate.ts` therefore declares `drawImage(source: unknown, …)`. This is a pure
widening of a brand-new interface (no consumer existed yet), and method-shorthand
bivariance keeps real `CanvasRenderingContext2D` / `OffscreenCanvasRenderingContext2D`
structurally assignable, so the default factory needs no cast. All load-bearing names
(`pixelate`, `PIXEL_FACTOR`, `SHEET_COLUMNS`, `SHEET_ROWS`, `downscaledSize`,
`sheetCellSize`, `PixelateOptions.createCanvas`) are unchanged.

## u3 — PixelSource contract

Review follow-up (PR #34, Lead thread on `pixelate.ts:39`, resolve pending on the
broken cross-reference this section now closes).

`PixelSource = {width, height}` is deliberately the WEAKEST type that satisfies the
module's own size math, so DOM-free unit tests can inject plain object fakes without
touching `CanvasImageSource`. That weakness is not free: a real browser call site that
passes something with matching `width`/`height` but that isn't actually drawable will
make `ctx.drawImage` throw, which `pixelate`'s own §3-5 try/catch swallows — the caller
gets `source` back, unchanged and silently. There is no console signal by design.
Consumer-facing contract:

- Only pass real `CanvasImageSource`-compatible values (`ImageBitmap`, `<img>`,
  `<canvas>`, etc.) at real call sites. `{width, height}` fakes are for tests only.
- `result === source` is the ONLY detection signal for "this did not get pixelated,"
  whether the cause was a bad wire-up, no canvas support in the environment, or an
  invalid `factor`/`size` override. There is nothing more specific to inspect.
- Sheet images specifically: call `pixelateSheet(sheet, options)`, not
  `pixelate(sheet, options)`. The plain `pixelate` default (`downscaledSize`) rounds
  the whole image independently of the 4×2 cell grid and can drift a pixel from
  `sheetCellSize`'s own tiling at factors other than 4/2 — `pixelateSheet` closes that
  footgun by always deriving its target size from `sheetPixelSize`. See the doc
  comments on both functions.

Canvas → CSS conversion responsibility (the open question from the same thread):
**out of scope for u3.** `pixelate`/`pixelateSheet` return a `PixelCanvas`
(`HTMLCanvasElement`/`OffscreenCanvas`), not a URL. PRD §2.4's render path
(`background-position`/`border-image`) needs a string CSS can reference, which means
converting the canvas via `toDataURL`/`convertToBlob` + `URL.createObjectURL` — and
whichever unit performs that conversion also owns calling `URL.revokeObjectURL` when
the sheet is replaced or the screen unmounts, to avoid leaking blob URLs. u3 does not
do this conversion or own that lifecycle; it is the render-path unit's (u4/u5)
responsibility.

## u3 — TEST phase re-entered on a green unit

The TEST (TDD-red) phase was dispatched for u3 while the unit was already at
`phase: verify / status: green` (head `b93778c`), with `src/ui/pixelate.ts` and a
47-test `tests/ui/pixelate.test.ts` committed and passing. No `design.md`/`spec.md`
existed (DESIGN skipped as low-complexity) and no `tests.md` had been written.

A literal RED was therefore unreachable without deleting shipped implementation.
The phase instead audited the 47 existing tests against the four acceptance criteria
and appended 38 tests for the real gaps (default-canvas-factory discovery, `getContext`
throwing, throwing size setters, determinism, `sheetPixelSize` D4 validation, membrane
scan). Each new block was proven non-vacuous by mutating the implementation, observing
RED, and restoring it byte-identically. See `.claude/super/units/u3/tests.md`.

Scope gap worth flagging to the decomposer: the read-scope for a re-entered phase should
say whether the unit already has an implementation, so the agent does not plan for a
greenfield RED.

## u9 — TEST phase: no contract file, and the timing seams were out of scope

The read-scope pointed at `.claude/super/prd.md` and
`.claude/super/units/u9/{design,spec}.md`. None of the three exist in this worktree
(`.claude/super/` is gitignored — rule 4 — and only `progress.json` was seeded), so the
PRD paragraphs were read from the tracked `demos/apothecary/PRD.md` (§2.1 sheet/model
paragraph, §2.2 tier columns, §2.3 generated-frames / framed-panel / no-`setTimeout`
paragraphs) instead. With no DESIGN output to follow, `tests/ui/portrait.test.ts` and
`e2e/portrait.spec.ts` *are* the API contract for u9; it is written out in
`.claude/super/units/u9/tests.md` so the BUILD agent has one place to read it.

Two dependencies the read-scope omitted, both required by AC2's "injected clock/rng
only, no `setTimeout` in the module": `src/pipeline/clock.ts` (`Clock` / `CancelTimer` /
`createManualClock`, the existing §3-3 seam and the only file allowed to touch host
timers) and `src/pipeline/persona.ts` (`Rng` / `createRng`, the seeded-determinism
seam). The blink schedule has to be built on those two rather than on a new seam, or the
codebase ends up with two timing conventions.

Also worth flagging to the decomposer: this worktree had no `node_modules`, so the TEST
phase ran `npm ci` in `demos/apothecary/` before either verification command could run.

## u9 — BUILD phase: two things the contract implies but never states

1. **`page.evaluate` cannot see the spec module's helpers.** `e2e/portrait.spec.ts`
   drives the harness through a spec-side `const api = () => window.__portrait`, but a
   function handed to `page.evaluate` is compiled *in the page*, so `api()` only resolves
   if the PAGE defines that name. The harness therefore publishes the same handle twice:
   `window.__portrait` (what the spec waits for after navigation) and a global `api()`
   accessor (what it calls from inside `evaluate`). Worth writing into the harness pattern
   (design D10) so the next screen unit does not rediscover it as 13 identical
   `ReferenceError: api is not defined` failures.
2. **The first blink cannot come from the rng.** `startBlinking`'s contract (no blink on
   mount; `advance(BLINK_INTERVAL_MS[1])` then `advance(BLINK_DURATION_MS[0] - 1)` must
   still be mid-blink under seed 99) is only satisfiable if the first close is booked at
   the interval MAXIMUM instead of a drawn value — with a drawn first interval, seed 99
   closes at 3781ms and has long reopened by 6000ms. That reads fine as design (an
   arriving portrait holds a steady gaze for the full window before the randomized loop
   starts) and every later blink is fully seed-driven, but it is a behavioural decision the
   tests pin implicitly rather than state.
3. **AC4b vs. a filter transition.** Reading the computed `filter` immediately after the
   silhouette class is dropped returns the transition's *start* value, so a
   `transition: filter` on the arrival direction can never satisfy "not still darkening".
   The arrival is therefore carried by `@keyframes portrait-resolve` (animations outrank
   transitions, and the keyframes re-state `brightness(1)` so the lighting releases at
   once); the declared filter transition carries the reverse, dimming direction.

## u10 — Multiverb beat engine (TEST agent, TDD-Red)

### Spec gap: `BeatSourceOptions` (S1) cannot satisfy the S9 normalizer
Spec §1.2 S1 fixes `BeatSourceOptions` as `{ adapter?, seeded, buildRequest?, patienceTier? }`,
but S9 — the load-bearing clue-id normalization — needs two things that surface carries no
door for: the customer's own clue table (`customer.observationClues`, to drop the u1
vocabulary's foreign ids) and the set of clues already on the shelf (steps 2–3 substitute
only *unrevealed* clues). Design §4's `BeatContext`/`normalizeClueReveals` both take them, so
the omission is in S1's option list, not in the intent. The RED tests pin two additional
**optional** fields in the design's own vocabulary — `customer?: Customer` and
`revealed?: () => ReadonlySet<string>` — rather than smuggling the clue table through
`buildRequest`. BUILD should treat those two names as contract.

### Test-defined: `history.length === cursor`
Neither S1 nor S7 says who tracks conversation history, yet the u1 stub adapter picks its
beat with `beatIndexFor(history.length, beatCount)` (`src/ai/stub.ts:212`). If the beat source
sends an empty history every pull, every beat renders the *same* line and the pre-existing
e2e AC7 ("committing a choice advances to a different line") goes red. The RED suite therefore
pins that the request for beat *i* carries `history.length === i`. Whether the labels come from
an injected getter or from the source's own bookkeeping is BUILD's call (u12 co-owns tone).

### AC1g is a node gate, so cursor monotonicity is pinned on the source
Design D6 puts the out-of-order guard in `conversation.ts` (`renderBeat`'s token), but spec §4
gates AC1g with vitest, and `beats.ts` is the only node-testable half. The RED suite reads AC1g
as a property of the source: concurrent `next()` calls must each claim their own cursor and
resolve in cursor order even when the adapter resolves in reverse. The DOM-side token is still
needed for S6; it is simply not what AC1g can observe.

### Read-scope gaps (carried from spec §4b, re-confirmed)
The assigned read scope omitted files the TEST phase had to open as narrow slices:
`src/ai/adapter.ts` (`AIAdapter` / `AIUnavailableError` — the failure contract the fakes
imitate), `src/ai/stub.ts` (`StubAdapterConfig` + `beatIndexFor` — see above),
`src/data/schema.ts` (`Choice`/`Customer`/`ObservationClue` shapes), `vitest.config.ts`
(`environment: 'node'` — the reason every DOM assertion lives in Playwright) and
`data/{customers,stub-dialogue}.json` (the two disjoint clue vocabularies S9 exists for).

### Pipeline friction: worktree has no `node_modules`
`npx vitest run` in a fresh super-worktree fails at config load (`Cannot find package 'vitest'`)
because `demos/apothecary/node_modules` is not shared across worktrees. `npm ci` (~10s) is a
required first step for any agent whose verification command runs in `demos/apothecary`; worth
folding into the harness's worktree setup so every unit does not rediscover it.

### Q3 (from spec §3), unresolved by design: `observe-btn` vs observe card
Two affordances now reveal the same clues. u10 keeps both (e2e AC6/AC9 drive the button and no
unit may delete it), and the RED suite pins that they cannot diverge — the button must not
duplicate what the card revealed. Consolidation is a u11/u14 decision.

## u10 — Multiverb beat engine (IMPLEMENT agent, TDD-Green)

### RED suite carried a fixture-reader bug that hid behind a real failure
The appended e2e block's `harnessCustomer()` helper read
`JSON.parse(data/customers.json).customers[0]`, but that file is a **bare array** of
customers (which is exactly what `loadCustomers` validates and what every other reader
assumes). The helper therefore threw a `TypeError` before AC13 reached a single assertion
— indistinguishable, in the RED report, from the missing implementation. BUILD fixed the
reader only (accepts either shape, asserts the list is non-empty); no assertion was
weakened. Worth noting for the pipeline: a RED failure whose message is a `TypeError`
inside a fixture helper is not evidence that the *feature* is missing, and the TEST phase
cannot tell the difference without running the helper against real data once.

### Spec-vs-reality: `patienceCost` was load-bearing in TWO places, not one
Migrating dispatch to `verb` (S2b) needed both the choice-card filter
(`patienceCost > 0`) **and** the persistent `[관찰]` button's reveal loop
(`patienceCost === 0`) rewritten — the second one is easy to miss because it reads like a
cost check rather than a verb test, and it silently became "reveal the clues of every free
card, including `craft`" the moment `craft` shipped as a second zero-cost verb.

### The tail of a speech bubble does not survive a 9-slice
`assets/ui-bubble.png` (256×256, frozen) draws the bubble box at x 28–227 / y 47–178 with
a tail hanging to y 211. A 9-slice can preserve corners, not a feature in the middle of an
edge: any bottom slice large enough to contain the tail stretches it across the whole
bottom edge. Landed slices (`56 40 88 38 fill`, border box at half scale) keep the tail
readable as a bottom-left bump, verified by screenshot rather than by assertion — the e2e
can only prove that *a* tuned 9-slice is applied, never that it looks like a bubble.

## u11 — Diegetic patience (BUILD agent, TDD-Green)

### The unit's base was stale: u9 + u10 had to be merged into the worktree first
`design.md` §5 predicted this ("rebase onto u2+u9+u10 **before** Phase 1"), and it was
real: the worktree branched at u8, while u9 (`src/ui/portrait.ts`, PR #52) and u10 (the
multiverb beat engine, PR #51) had already merged into the integration branch. Without the
merge, three of this unit's ACs are unreachable by construction (`portrait-cell` and
`choice-card[data-verb=direct]` simply do not exist), and — worse — the TDD-Red spec edits
had been authored against the *pre-u10* `e2e/conversation.spec.ts`. Pipeline lesson: a unit
whose wave depends on an earlier wave needs its worktree re-based **at hand-off**, not at
BUILD's discretion; the RED report's pass/fail counts are otherwise measured against a tree
that will never be built on.

### Approved-deletion scope was written before u10 existed, and u10 widened it
The run's only sanctioned deletions were `conversation.spec.ts` AC5/AC6 + the terminal-node
`scaleX` samples and one line of `full-loop.spec.ts`. But u10 *appended* three more meter
assertions to the same file — AC12's drain probe, AC13's zero-cost probe, and AC17, whose
own comment reads "DELETE 금지: the patience meter is u11's to remove, not u10's". All three
were re-expressed against `data-tier` in this unit (AC17 inverted rather than dropped: it now
pins that the multiverb hand reports patience through *exactly one* readout, never zero and
never two). Nothing was deleted without a replacement landing beside it, but the spec's
"only permitted deletions" list was stale the moment u10 merged.

### AC6's zero-reflow assertion is only satisfiable if nothing else is animating or scrolling
`AC6` samples the portrait cell/frame `getBoundingClientRect()` at mount and re-compares it
after every tier change. Two implementation-visible consequences, neither of them about
tiers:
1. **The u5 `portrait-enter` keyframe animates `transform`.** At mount it is still easing
   (measured: ~80 ms in, scale ≈ 0.9916 of final), so the first sample is a mid-flight box
   and *every* later sample differs. Fixed by making the framed panel a fixture of the
   counter — `transform: none !important` on the host keeps the fade (and the
   `animationName === 'portrait-enter'` contract AC2 pins) while the panel never slides.
   `!important` is the only cascade level that outranks an animation; this is what it is for.
2. **Viewport-relative coordinates mean a page scroll reads as a reflow.** Stacking the
   256 px-tall u9 panel above the bubble, the 4-card hand, `[관찰]` and the clue shelf made
   the harness page 732 px tall in a 720 px viewport, so Playwright scrolled 12 px to click a
   card and the portrait's `y` moved. Fixed by laying the screen out as portrait *beside*
   dialogue (549 px total) — which is also the better read: a page that scrolls on a card
   press drags the customer's face off the counter mid-conversation.

### Out-of-glob edit (design D7): the harness needed a customer/budget knob
`e2e/harness/conversation/main.ts` (u10's file) grew `?customer=<id>&budget=<n>`. Only two
beats exist per customer ⇒ at most two paid commits ⇒ at most three of the four tiers are
observable in one run, so the 0→3 ladder needs two runs with different budgets. The knob is a
harness-boundary substitution (`{ ...customer, patienceBudget: n }`) with a byte-identical
default, so it moves the ladder out of `data/customers.json` — a content file other specs pin.

## u12 — Tier tone content (IMPLEMENT agent, TDD-Green)

### RED-oracle correction: only ONE tier bump per run can repaint a line
`e2e/patience.spec.ts`'s new AC12 ladder test drove **two** paid commits and required the
`npc-line` text to change on each. The tier attribute does move twice (c1, budget 5: 0 → 1 → 2 —
u11's tests pass on exactly that), but a *line* is only re-authored when a beat is painted, and
`source.total === seeded.length === 2` for both shipped customers, so `conversation.ts:368`
stops advancing after the second commit: the tier rises while the spent hand — and its line —
freeze. The second iteration therefore polled forever on `line !== beforeLine`.

Fixed in the test, not by weakening it: the first commit keeps every original assertion
(non-empty, ≠ tier-0 line, ≠ previous line, present in the D-3b union index at the observed
`data-tier`), and the terminal commit is now asserted as what it actually is — the tier rises,
the frozen line stays byte-identical, is non-empty, and is still the authored variant for the
tier it was *painted* at. spec §4 AC12's own bar ("≥ 2 distinct tiers observed in one
play-through") is met by `[0, 1, 2]`.

The general lesson for the harness: a screen-level oracle must be written against the beat
budget the content ships (2 dialogue nodes ⇒ 2 paints), not against the tier ladder the
patience arithmetic allows (up to 4 tiers). The two are independent, and only the smaller one
bounds what the DOM can show.

## u13 — App-shell async wiring (TEST agent, TDD-Red)

### Scope gap: the FR-12 timer allowlist needs a second entry it cannot own
FR-12/AC-8 fix the source-scan allowlist at exactly one item — `src/app/index.ts` ×
`EXIT_FALLBACK_MS`. A scan of the shipped tree finds a **second** missed-`animationend`
guard, `src/screens/crafting/index.ts:120` × `BEAT_FALLBACK_MS` (600ms, commit-beat
cleanup, added by the crafting unit). It is the same class of timer the exception exists
for — not a generation wait — and `src/screens/crafting/**` is outside u13's file globs,
so u13 can neither remove nor relocate it. `e2e/generation.spec.ts`'s AC-8 allowlist is
therefore a two-row `file × constant-name` table instead of one row. The scan still fails
on any other `setTimeout|setInterval|requestIdleCallback` in `src/app/**`/`src/screens/**`,
which is the invariant the criterion is actually protecting.

### Scope gap (G-5, confirmed): the source scans live in the e2e spec
The unit's stated verification command includes `npx vitest run tests/pipeline/`, but
`tests/**` belongs to u5 and is outside u13's globs. FR-2/FR-12/NFR-5/NFR-6 are pinned in
`e2e/generation.spec.ts` with `node:fs` instead (overlap.spec's `readFileSync` precedent).

### Upstream signature corrections the RED spec was written against
- u9 exposes `mountPortrait()` / `PortraitHandle.setSheet(url)` / `handle.silhouette`, not
  the `createPortrait()` / `arrive(sheet)` / `setSilhouette()` names design §0 assumed. The
  spec asserts on the DOM contract instead (`portrait-cell`, `--silhouette` class,
  `filter: brightness(0)`), so it survives either naming.
- Holding the injected adapter's `dialogue()` unconditionally would freeze the customer
  ON STAGE too: `beats.ts` `next()` awaits the adapter before painting. The harness
  contract in the spec header therefore scopes `?dialogue=hold&portrait=hold` to
  **prefetch** calls (plus `?holdFor=<customerId>`), which is also what makes FR-6's
  non-blocking assertion meaningful rather than vacuous.

## u13 — App-shell async wiring (BUILD agent, TDD-Green)

### Where the injected adapter is (and is not) used — the seam that makes FR-6 true
The app calls the boot adapter **only from the prefetch pipeline**. A mounted conversation
gets its own one-shot *replay* adapter (`roster.ts` `createSeedAdapter`) carrying the beat
the prefetch already fetched, and plays the authored deck for every later beat through
`beats.ts`'s documented per-beat degradation. So "a pending prefetch cannot block input"
is a structural property, not a timing hope — the screen has nothing to await. This is also
what lets the e2e harness script `hold` semantics per prefetch without freezing the
customer on stage (the gap the TEST agent flagged above).

### u5's portrait gate rejects the stub/pack sheet shape
`pipeline/prefetch.ts` has its own `isPortraitSheet` that requires a **non-empty `b64`**,
while `ai/contract.ts`'s validator (and `portraitSrc`) accept a `url`-only sheet — which is
exactly what the stub adapter and the bundled pack return. Consequence: in stub mode the
portrait track always settles as `fallback` with `value: null`. The shell therefore treats
"decided but valueless" as "use this slot's bundled pool sheet" (`roster.ts`
`portraitUrlFor`), which is the same image the pack was offering, so nothing is lost. If u5
ever relaxes that gate to the contract's own validator, the pack's sheet flows through
unchanged and this branch simply stops firing. `prefetch.ts` is outside u13's file globs.

### Simulated generation latency is what makes the deployed demo show the pipeline
Boot hands the canned adapter a simulated latency (`data/fallback-npcs.json`
`simulatedGenerationMs`, 30s) that is deliberately longer than every deadline, so the
deployed stub build plays the *real* async choreography instead of pretending generation is
instant: seeded slots quietly fall back to their bundled content after a short grace
(`seededDeadlineMs`, 1200ms — invisible, it elapses during the previous visit), and the
generated third slot plays the door-idle beat until `stubDeadlineMs` (8000ms) hands over to
the pack. Measured drive spans on this machine: customer 1 conversation→customer 2 entrance
3.5s, customer 2 conversation→continue click 3.7s, leaving ~4.3s of door beat in the gate.
NOTE for the reader: with an ≤8s cap (G-4) a *human* pace never reaches the door beat in
stub mode — they finish customer 2 long after the pack has answered. The beat is a bounded
wait, not a scripted cutscene; live mode is where a real generation actually fills it.

### Deadlines are per slot, and the mode branch lives in boot (not in the shell)
AC-11's scan forbids an adapter-mode comparison anywhere under `src/app/**`/`src/screens/**`,
so `src/main.ts` (boot wiring, outside the scan) picks `liveDeadlineMs` vs `stubDeadlineMs`
and injects it; `roster.ts` applies it to the generated slot only. The harness overrides
every slot with `?deadline=<ms>`.

### `renderDoorNote` claims the testid of whatever element it is handed
`src/screens/outcome/note.ts` stamps `data-testid="door-note"` on its target, so mounting it
straight onto the phase wrapper (v1's wiring) *erased* `phase-<id>-outcome`. u13 needs both
hooks, so the note now renders into a child of the phase wrapper; the child carries the
`.phase` class because door-note's own rules (centring, gap) are written against that
layout box, and `src/app/app.css` is outside u13's globs.

### Upstream hand-off guards u13 necessarily supersedes (3 unit assertions, tests/** is out of glob)
All three are per-unit "I did not touch the file u13 owns" receipts, and each names u13 (or
the harness count) as what retires it. u13 cannot edit them — `tests/**` is outside its file
globs — and they are structurally unfixable from inside this unit:
1. `tests/ai/boot.test.ts` › AC20 "main.ts does not import the boot factory **yet**" — u13's
   whole job is that import. (Its sibling assertion about `app/index.ts` still passes: the
   shell is handed a built adapter and never imports the factory.)
2. `tests/ui/portrait.test.ts` › u9 AC5 "vite.config.ts … adds exactly one (4 total)" — the
   generation harness page is a 5th build input, and it must be a build input to be served
   from `dist/` at the path the spec navigates to.
3. `tests/screens/conversation/callbacks.test.ts` › "leaves src/app/index.ts untouched (u13
   owns the wiring)" — a `git status` assertion on the file this unit rewires. Its other
   assertions in that file were kept green on purpose: `ConversationOptions` still declares
   exactly `{beatSource, adapter}` (the portrait seam is the *return* handle, not a new
   option), and `src/app/index.ts` still mentions no beat-source/adapter factory by name.

### Not wired by u13 (follow-ups, deliberately out of scope)
- **Idle blinking in the app.** `mountPortrait` runs the u9 blink loop only when handed a
  clock + rng, and the conversation screen's option bag is frozen by the guard above, so the
  deployed conversation portraits are still. The component and its e2e gate already cover
  the behaviour; wiring it needs one more (additive) conversation option.
- **Runtime pixelation is live-only in practice.** `roster.ts` sends a generated (`b64`)
  sheet through `pixelateSheet` before it reaches the cell, per §2.4; bundled pool sheets
  ship pre-downscaled and are used verbatim. In stub mode no sheet ever takes the first path.
