# super-pipeline — Frontend Modification Spec (frontend-mod)

> **Status: draft for review — nothing implemented.** Companion to
> [`super-pipeline-game-mod.md`](./super-pipeline-game-mod.md); same shape
> (priority-ordered mods, cut from the bottom), same division: this document
> is the design record in the game repo; implementation lands in the
> super-pipeline repo. Trigger: the DDAY client build
> ([`docs/spec-client.md`](../../docs/spec-client.md)) starts from a
> **finished reference implementation**
> ([`docs/design/phase2-ui/`](../../docs/design/phase2-ui/README.md)) —
> a situation the harness has no first-class support for.

## 1. Why modify

The game-mod solved "agents can't *feel* gameplay". The frontend case is
adjacent but distinct: agents can't *see* rendered UI, and this build has a
**reference implementation the output must be faithful to** — 1,946 lines of
working HTML/CSS/JS that already embody the design decisions. Without
support, three failure modes are likely:

1. Agents redesign instead of porting — the reference is treated as
   inspiration, and the shipped UI drifts from the approved design.
2. Fidelity is judged by code review alone — a review panel reads CSS and
   pronounces it plausible; nobody compares rendered output to the target.
3. The reference gets edited or vendored wholesale — either it stops being a
   stable target mid-run, or 2,000 lines of untyped JS land in `src/client/`
   defeating the spec's typed-seam architecture.

## 2. Prerequisites (project-side — not part of these mods)

- A spec that assigns the reference a **binding porting rule** — done:
  spec-client §8 (CSS vendored+re-tokenized · JS rewritten in TS · markup
  structure ported).
- The reference renders standalone in a browser with no build — true of
  `docs/design/phase2-ui/` by construction.
- Playwright (or equivalent) available as a dev dependency in the build
  repo for screenshot capture — harness assumes it exists, PRD provides it.

## 3. Modifications (priority-ordered, cut from the bottom)

### P0-A — `reference_globs`: the read-mandatory input class

`frozen_globs` (game-mod P1-D) says *never rewrite*. A design reference
needs a stronger contract: **never edit, always read**. Add `reference_globs`
to the decomposer output / PRD front-matter:

- Files matching are **frozen** (guard reuses P1-D's mechanism) **and**
  every unit whose `context_refs` touch UI receives them as mandatory
  reading in its SPEC stage — a unit spec that doesn't cite the relevant
  reference section is bounced before DESIGN.
- The decomposer emits per-unit `reference_refs` (scoped, like
  `context_refs`): the LIVE FEED unit gets the feed markup + fanfold CSS
  slice, not all 1,946 lines.

### P0-B — Rendered-output capture at unit VERIFY and wave boundary

Extends game-mod P0-A (gameplay capture) to static rendering:

- Unit VERIFY gains a **screenshot step**: launch the built page (fixture
  mode), capture the unit's window/component states (the spec's §6 state
  inventory is the shot list), and attach captures to the unit PR.
- At wave boundaries, capture the reference (`index.html`) and the build
  side by side into the dashboard PR — the human (민서) judges fidelity
  from pixels, not prose. No automated pixel-diff gate: paper grain,
  animation timing, and font rasterization make it flap; the automation
  produces *evidence*, the human produces *judgment*.

### P1-C — Design-fidelity review lens

Registry lens alongside game-feel (game-mod P1-C). Trigger signals: PRD
declares `reference_globs` / frontend domain. Evidence bar: **concrete
deviations from the reference** — a named token (stock, accent, face) that
differs, a §6 component state with no implementation, a membrane violation
(`<input>` anywhere), a hard-coded style literal that bypasses
`styles/tokens.css`. Verdicts must cite reference file + line or capture
image, never taste ("looks off").

### P1-D — Structural-conformance checks (the automatable slice)

Cheap DOM/CSS assertions that don't flap, run in unit VERIFY loops:

- Selector parity: the built page contains the reference's structural
  landmarks (five `.win` roots, taskbar, topbar units) — catches dropped
  regions early.
- Constraint asserts as tests: no `<input>`/`contenteditable` in the player
  build (spec-client invariant 1) · no digit in NPC-state channels
  (invariant 2, fixture-driven) · no third-party URL in the built bundle
  (invariant 10) · token-only styling (lint: no hex literals outside
  `tokens.css`).

These are review-blocking invariants turned executable — the loop-until-green
engine can hold them without human eyes.

### P2-E — Component-state harness

A dev-only page that mounts each §6 component in every declared state
(the states column is the enumeration), used as the P0-B shot list and as
the reviewer's click-through. Effectively a zero-dependency storybook; only
worth building if P0-B captures prove insufficient on their own.

## 4. Where each modification lands (super-pipeline repo)

| Mod | Lands in |
|---|---|
| P0-A `reference_globs` / `reference_refs` | `agents/super-decomposer.md` (emission) · workflow guard (reuse P1-D frozen mechanism) |
| P0-B capture step | workflow VERIFY step + wave-boundary demo step (extend game-mod P0-A) |
| P1-C design-fidelity lens | decomposer lens registry + reviewer persona params |
| P1-D structural checks | unit TEST stage guidance (the PRD names the asserts; the harness just runs them) |
| P2-E state harness | nothing harness-side — a PRD work unit |

## 5. Division of labor implied

- **민서 (director):** fidelity judgment from P0-B captures · `/super-steer`
  when the port drifts · owns spec-client and this mod spec.
- **Harness (super-pipeline repo):** P0-A/P0-B/P1-C mechanics.
- **PRD:** declares `reference_globs` (`docs/design/phase2-ui/**`, the
  우는다리 pack, `assets-manifest.json` append-only) · names the P1-D
  asserts · provides playwright.

## 6. Open questions

1. Does P0-B run headless-deterministic enough on fonts? (Self-hosted fonts
   land mid-build — captures before that unit will rasterize with fallback
   faces; shot list should order font unit early or annotate.)
2. `reference_refs` slicing: by file region (line ranges) or by extracted
   excerpt files? Line ranges rot if the reference is ever regenerated;
   excerpts duplicate. Lean: line ranges + the reference frozen, so they
   cannot rot mid-run.
3. Is P1-D's "no digits" assert expressible without false positives (clock
   digits are legal chrome)? Likely needs a scoped selector (NPC-channel
   nodes only), which the view-driver seam makes taggable.
