# Writing a demo PRD for super-pipeline

> For the session drafting a demo PRD for another concept track (agent-arena /
> doodle-life). You don't need to understand the harness internals — you need to
> understand what it does with your document. Read this, then read the exemplar:
> **`demos/apothecary/PRD.md`** (built successfully by the harness on 2026-07-24).
> Copy its skeleton; change the content.

## 1. What the harness does with your PRD

`/super-pipeline <prd-path>` feeds the PRD to a **decomposer** that splits it into a
dependency DAG of work units. Units then run as **parallel agents in isolated git
worktrees**, each looping spec→test→implement→verify until its gate is green, opening
a PR reviewed by a 3-lens panel, then merging. Two consequences dominate everything:

1. **Agents cannot ask you questions mid-run.** Every ambiguity in the PRD becomes
   either an agent's improvisation or a stall. Resolve everything up front.
2. **The PRD is the reviewers' law.** Panel reviewers reject PRs against the PRD's
   invariants. An invariant not written down does not exist.

## 2. Required sections (and the lesson behind each)

Aim for 2–3 pages. Brevity is per-section, not per-document — dropping a section
below is how runs go wrong.

- **Header block** — stack, location (`demos/<slug>/`, self-contained, own
  `package.json`), and a **conflict order** that declares the concept doc
  *reference-only*: "nothing from it is in scope unless this PRD names it."
  Without this fence the decomposer wanders into the full game and generates a
  week of work.
- **Role & scope** — a numbered **must-prove list** (this IS the spec) and a hard
  **does-NOT-do list** naming the concept's own features you're cutting (mentor,
  meta-progression, save, audio…). Name them explicitly; "keep it minimal" cuts nothing.
- **Baked defaults** — every decision an agent would otherwise have to make:
  language of game text, exact counts (N customers/N enemies/N creatures), fallback
  behavior so nothing dead-ends, timing/trigger rules stated deterministically
  (event-driven, never wall-clock). The reducer PRD's rule: *an executable PRD
  ships no open ❔*.
- **Data shapes** — freeze the `data/*.json` file list and top-level fields;
  leave sub-structure to the implementer. This is also how the demo proves the LLM
  *slot* exists while the LLM stays **stubbed** (canned JSON — mandatory for demos;
  AI capability is already validated, and stubs keep the demo deployable with no
  proxy/secrets).
- **Invariants (review-blocking)** — numbered list. Repo-wide ones in §3 below,
  plus concept-specific ones.
- **Verification seams** — see §4. This section decides whether "loop-until-green"
  means anything.
- **Work-unit DAG hint** — a table: id, title, deps, complexity, **own-slice gate
  command**. It's a hint; the decomposer refines it (it split apothecary's 6 units
  into 9). One structural lesson from that refinement: **split shared UI primitives
  (cards/animation/CSS) into their own early unit** so parallel screen units don't
  each invent their own and collide at merge.
- **Definition of done** — build green, full e2e green, subpath smoke, assets
  manifested, and **`DISCOVERY.md` populated** (spec gaps + harness frictions —
  a first-class deliverable feeding the super-pipeline game-mod).

## 3. Repo invariants every demo PRD must carry

- **Membrane**: no free-text input UI to anything, ever (structured verbs only —
  for doodle-life, drawing strokes are structured input and fine; a text box is not).
- **No runtime network calls in the deployed build.** ~~LLM fully stubbed~~ —
  superseded after the v1 playtest: live AI is now expected in dev mode via the
  dev-proxy seam, with stub as the deployed floor. See
  `demo-playability-guide.md` (assets + live-AI patterns, lessons, checklist).
- **No game engine/framework** unless the track explicitly chose one; root repo
  untouched (everything in `demos/<slug>/`; only `assets-manifest.json` at root
  may gain entries — mandatory for every generated asset).
- **Balance-as-data**: all tunables in `data/` JSON, never inline.
- **Vite `base: './'`** — dist must work under a Pages subpath (the harness's
  `demo_publish` step builds `npm ci && npm run build` and smoke-checks the dist).
- **Reads as a game, not a form**: no native form controls for game verbs; no
  instant DOM swaps between phases.

## 4. Pitfalls that actually bit (or nearly did)

1. **Per-unit gate = that unit's own test slice, NEVER the whole suite.** The
   full-loop e2e stays red until the last unit; gating early units on it deadlocks
   the run. Only the final unit runs everything.
2. **Automated green must be honest for UI.** `tsc`+`vite build` green says nothing
   about the thing demos exist to prove. Use vitest for pure logic (FSM, loaders)
   and **Playwright** per-screen specs (page loads, zero console errors, phase
   reachable by click, named animations/classes fire) as the unit gates.
3. **Deterministic triggers only.** Anything time-delayed ("result arrives later")
   must be defined as an event trigger ("when phase X of entity N+1 begins"), or
   tests flake and agents burn loops.
4. **Every lookup needs a `default` fallback** so no player input combination
   dead-ends — cheapest way to make stub content feel emergent instead of brittle.

## 5. Exemplars & process notes

- **`demos/apothecary/PRD.md`** — the template. Same repo, same constraints.
- **`docs/handoffs/apothecary-demo-contract.md`** — the frozen build-interface facts
  (§"Demo build interface" applies verbatim to any `demos/<slug>/`).
- At the run's approval gate, enable **`demo_publish`** with your demo dir and
  **`wave_gate`**; expect screenshot fallback (this repo's Pages deploys via
  workflow, so no live subpath URL).
- Log every friction during the run — it's the evidence base for the harness
  game-mod, half the point of these runs.
