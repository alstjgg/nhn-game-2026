# super-pipeline — Frontend Modification Spec (frontend-mod)

> **Status: draft v2.1** — v2 revised 08-03 against the super-pipeline
> session's code-grounded review of v1; v2.1 tightens four bindings from the
> second review round (self-check gate semantics · per-unit discovery files ·
> browser-clock settle protocol · workflow-side glob enforcement). The review's verdict is accepted: v1 was
> fidelity *governance* (freeze, mandate reading, lens, lint) with no
> rendered pixel ever in front of an agent that could act on it, and its one
> pixel-touching mod extended demo-publish machinery that cannot run against
> a repo-root build. v2 centers the in-loop visual self-check (P0-C) and
> decouples capture from the demo publisher.
>
> Companion to [`super-pipeline-game-mod.md`](./super-pipeline-game-mod.md);
> same shape (priority-ordered mods, cut from the bottom), same division:
> design record here, implementation in the super-pipeline repo. Trigger:
> the DDAY client build ([`docs/plan-client-build.md`](../../docs/plan-client-build.md) ·
> [`docs/spec-client.md`](../../docs/spec-client.md)) ports a **finished
> reference implementation**
> ([`docs/design/phase2-ui/`](../../docs/design/phase2-ui/README.md)).

## 1. Why modify

Agents can't see rendered UI, and this build must be faithful to 1,946
lines of working HTML/CSS/JS. The harness's correction engine
(implement→verify loop, advisor, replan) is text-only: without mods, drift
is created inside the loop and can only be corrected by a human one wave
later. Failure modes: (1) agents redesign instead of porting; (2) fidelity
judged by code review alone; (3) the reference edited mid-run or vendored
wholesale as untyped JS. v1 guarded (1) only by mandated reading; v2 guards
it by **seeing**: reference pixels and build pixels in the same VERIFY
attempt, judged by the agent itself.

## 2. Prerequisites (project-side — not part of these mods)

- A spec binding the porting rule — spec-client §8 (CSS vendored+re-tokenized
  · JS rewritten in TS · markup ported).
- The reference renders standalone, no build — true by construction.
- Playwright as a dev dependency in the build repo (PRD provides it).
- **Capture hooks in the build itself** (plan-client-build u2): the fixture
  driver exposes clock pause/seed and an animation-freeze toggle, so
  captures are deterministic. The harness consumes these; it cannot invent
  them.

## 3. Modifications (priority-ordered, cut from the bottom)

### P0-A — `reference_globs` / `reference_refs` (hardened)

Read-mandatory input class, distinct from `frozen_globs` in wording and
enforcement:

- **Own guard text**, not `frozenNote('implement')` — the frozen wording
  ("extend via new files") reads as *don't copy from this*, the opposite of
  the porting rule. Reference wording: *"Read-only reference. Never edit.
  Copying/vendoring out of it into your unit is expected wherever the PRD's
  porting rule says so."*
- **Precedence rule in the guard text** (agent-facing, not just spec prose):
  *spec invariants > reference.* Where the reference itself violates an
  invariant — e.g. its Google-Fonts runtime load vs spec invariant 10 — port
  the compliant equivalent and log the deviation to DISCOVERY (P1-F). An
  agent holding "reference is normative" and "no third-party URL" must not
  deadlock.
- **Launch-time overlap validation — enforced in the workflow JS**, not the
  approval gate: glob-set intersection is pure string work, so the workflow
  computes (`reference_globs` ∪ `frozen_globs`) ∩ each unit's `file_globs`
  at startup and returns `{ error: 'glob_overlap', … }` **before spawning
  anything** — deterministic and resume-safe, which an LLM-followed gate
  checklist is not. The approval gate keeps a copy of the check as the
  friendly early warning. (An overlap otherwise hard-blocks a unit through
  fix→advisor→replan with no recovery — replanned sub-units inherit the
  parent's `file_globs`.)
- **Citation enforcement in the schema, not control flow** — there is no
  SPEC gate to bounce from. Units with `reference_refs` get
  `reference_citations: string[]` (`minItems: 1`) added to their SPEC
  schema; StructuredOutput validation forces the retry at the tool layer.
- **Slicing:** files ≤ ~300 lines ship whole (slicing machinery costs more
  than reading `index.html` or `data.js`). Only `desktop.css` is sliced,
  **selector-anchored** (the `.win--file` block, found by grep at read
  time), not line ranges (rot) or excerpt files (duplication).

### P0-B — `render_capture`: first-class capture config

**Not** an extension of the demo publisher (that step assumes
`demos/<slug>/package.json`, derives a Pages subpath from the dir name, and
dedups via `git log -- <dir>` — none of which fit a repo-root Vite build,
and `dir: "."` degenerates). Instead an independent config usable by unit
VERIFY and the wave boundary alike:

```
render_capture: {
  build_cmd,            # e.g. "npm run build"
  dist_dir | serve_cmd, # what to point the browser at
  viewport,             # [1280, 800] for this PRD
  shots: unit-authored  # see below
}
```

- **Shot lists are unit-authored**: whatever that unit's own Playwright
  spec can actually drive the UI into. The spec §6 state inventory is the
  *aspiration*; the gate is only what the unit can reach. (v1's "the §6
  inventory is the shot list" silently depended on the component-state
  harness, ranked last.)
- **Determinism contract — a settle protocol, not just a freeze
  stylesheet.** CSS freezing (`prefers-reduced-motion` + override sheet)
  covers animation/transition rules only; both UIs are **JS-timer-driven**
  (the reference's thread redraw at 800 ms, boot toast, ~9 s tally,
  typewriter chains at 11/130 ms, two rAF loops — a load-time capture
  misses the red thread entirely, the one element u8 exists to port). And
  the reference is frozen, so it cannot take hooks. Determinism therefore
  comes from the **browser side**: `page.clock.install()` → advance to a
  fixed virtual tick per shot → screenshot; same protocol for reference and
  build (the build's u2 hooks are a bonus for its own e2e, not the capture
  mechanism). Plus pinned viewport, and fonts symmetric with P0-C (same
  browser, same run).
- **Storage:** reuse the game-mod orphan-branch machinery
  (`super/demo-shots/<run_id>` + blob URLs in PR comments). Committing PNGs
  in unit worktrees is **forbidden** — they'd ride the squash-merge into the
  final main PR diff.
- **Cost cap:** ≤4 shots per VERIFY attempt per unit; wave-boundary
  side-by-sides are human-only (no LLM reads them).

### P0-C — Pre-rendered reference shots + in-loop visual self-check (new — the actual "agents can't see UI" fix)

- **At run start**, render the frozen reference once into
  `.claude/super/reference-shots/` (it's standalone HTML — no build). Each
  unit's `reference_refs` includes its 2–3 relevant reference PNGs: the
  agent sees its target instead of reading CSS and imagining it.
- **In VERIFY**, the agent captures its own build via `render_capture`,
  Reads both images (Claude Code renders PNGs visually), and judges
  divergence against the porting rule. **Gate semantics are bounded** so
  subjective image judgment never burns the escalation ladder (the flapping
  the mod refuses in automated pixel-diff must not re-enter through the
  agent's eye): findings are written to `failures.md` **every attempt** —
  that is where the in-loop correction value lives, since the next IMPLEMENT
  reads it — but the check contributes to `green=false` only on
  **enumerable structural divergence** (missing/extra `.win` region, absent
  §6 component, wrong paper stock), and **never on the final attempt**, so
  it can never be the reason a unit escalates. Taste stays out of the gate;
  drift stays in the loop.
- **Cost model, explicit:** the VERIFY agent reads ≤2 images per attempt
  (its shot + the reference shot). This is the only LLM image consumption
  in the mod; everything else is evidence for the human.
- Side effect: v1's font open-question is moot — reference and build shots
  come from the same browser session, so any font fallback is symmetric.

### P1-D — Structural + a11y asserts (the automatable slice)

Cheap non-flapping DOM/CSS assertions, authored as tests:

- Selector parity (five `.win` roots, taskbar, topbar) · no
  `<input>`/`contenteditable` in the player build · no digit in NPC-state
  channels (scoped to feed/symptom nodes — the driver seam makes them
  taggable) · no third-party URL in the built bundle · token-only styling
  (no color/size literals outside `tokens.css`).
- **a11y** (UX/a11y is a triggering lens; a drag/resize window UI with zero
  text inputs has real keyboard risk): every membrane op and window control
  keyboard-reachable · roles/landmarks on windows and taskbar · focus order.
- **Binding reality, stated plainly:** unit-scoped asserts ride their own
  unit's gate. Repo-wide asserts (third-party URL, token-only) bind fully
  only at the final acceptance unit — the harness forbids full-suite gates
  on earlier units. They are end-state guarantees, not continuous
  enforcement.

### P1-E — Design-fidelity review at the **unit PR**, not the final panel

Fidelity is per-window and lives where the captures live: the unit PR.
Primary home is a **Lead-review lens parameter** — evidence bar: named
deviations citing a reference file/line or a capture, never taste. Scope
honestly: super-lead has **no persona plumbing today** (its review call
passes unit id, acceptance criteria, file globs); this is a new parameter
threaded through the Lead prompt and `agents/super-lead.md`, not a registry
line. If also seated on the final panel: declare its family (visual-design)
and **pin it via the approval gate's user override** — unpinned, the seating
rules fill the three slots with Correctness + UX/a11y + Game-feel and
fidelity lands in `dropped[]`, handed to an integrator pass that has no
browser and no captures (failure mode 2 verbatim).

### P1-F — DISCOVERY plumbing (small, general, needed by the DoD)

The PRD's definition-of-done requires a populated `DISCOVERY.md`, but
nothing harness-side writes or aggregates it. **Contention-free shape**
(mirror the harness's own status.json rule — each unit writes only its own
file): units write `discovery/<unit-id>.md` in their worktree; the
integrator consolidates all of them into `DISCOVERY.md`. One shared
append-file across eleven serially-merged worktrees would conflict at
nearly every merge barrier, resolved by the merge agent, on the run's
second-most-important deliverable. Content: spec gaps, seam friction,
reference ambiguities, invariant-vs-reference deviations from P0-A's
precedence rule. For a run against a draft-status spec with an unratified
seam, spec friction is the expected outcome — this channel is the run's
real second deliverable.

### P2-G — Component-state harness

A dev-only page mounting each spec §6 component in every declared state.
Build **only if** P0-C self-checks prove insufficient — unit-authored shot
lists (P0-B) plus reference shots (P0-C) cover most of what this would add.

## 4. Where each modification lands (super-pipeline repo)

| Mod | Lands in |
|---|---|
| P0-A guard text + `reference_citations` | decomposer emission · SPEC schema builder |
| P0-A overlap validation | **workflow JS startup check** (`{error:'glob_overlap'}` before any spawn) · approval gate keeps an advisory copy |
| P0-B `render_capture` + settle protocol | new workflow capture module (independent of demo publisher; `page.clock.install()` settle) · orphan-branch storage reuse |
| P0-C reference shots + bounded self-check | run-start step (render reference once) · VERIFY-stage prompt + image reads · `failures.md` write path · final-attempt exemption |
| P1-D asserts | PRD-side test authoring guidance (the harness just runs unit gates) |
| P1-E fidelity lens | new persona parameter threaded through the Lead review prompt + `agents/super-lead.md` · lens registry entry with declared family |
| P1-F DISCOVERY plumbing | `discovery/<unit-id>.md` per-unit write instruction · integrator consolidation into `DISCOVERY.md` |
| P2-G state harness | nothing harness-side — a PRD work unit, if ever |

## 5. Division of labor implied

- **민서 (director):** implements these mods in the super-pipeline repo
  before the run · pins the fidelity lens at the approval gate if paneled ·
  judges wave-boundary side-by-sides · `/super-steer` on drift.
- **The build (plan-client-build):** provides the capture hooks (u2: clock
  pause/seed, animation freeze) · authors P1-D asserts as unit tests ·
  declares `reference_globs`/`frozen_globs` and playwright.
- **Harness:** everything in §4.

## 6. Resolved in v2 · still open

Resolved: font determinism (P0-C symmetry) · slicing (selector-anchored,
CSS only) · digit-assert scoping (driver-seam node tagging) · capture
determinism (P0-B settle protocol — browser virtual clock, since the frozen
reference can't take hooks) · artifact storage (orphan branch) · SPEC
citation mechanism (schema-level) · self-check gate semantics (structural-
only, never final-attempt) · DISCOVERY contention (per-unit files) ·
overlap enforcement home (workflow JS, gate advisory).

Open: the exact per-attempt image-read budget if MAX_FIX retries stack
(current cap: ≤2 reads × attempts — acceptable? measure in the first run) ·
integrator consolidation format for DISCOVERY (freeform vs structured) ·
the fixed virtual-tick table per shot (which tick shows the red thread,
the mid-tally frame, etc. — author with the first capture specs).
