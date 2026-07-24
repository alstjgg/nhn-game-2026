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
