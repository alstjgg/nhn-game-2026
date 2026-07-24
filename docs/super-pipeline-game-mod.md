# super-pipeline — Game Development Modification Spec

> Standalone spec for the modifications that let **super-pipeline** (the multi-agent harness in the
> sibling `../super-pipeline` repo) drive game development for the NHN AI Game Competition, so the
> team can focus on direction/기획 instead of implementation.
>
> **Scope:** every modification here lands **inside the super-pipeline repo** as a pure OCP extension
> (never touch `/pipeline`, `/goal`, etc.). Things the game repo must prepare are listed separately in
> §2 (Prerequisites) and are **not** part of these mods.
>
> Status: **draft — priorities to confirm; apothecary v2 is the validating dry-run (§7).**

## 1. Why modify

super-pipeline optimizes for *correctness* (SPEC→DESIGN→TEST→IMPLEMENT→VERIFY, loop-until-green,
independent review panels). Games additionally need *fun and feel*, which automated gates cannot
measure, plus a handful of competition-specific artifacts. The base harness already covers the
mechanical side of a web-game run:

- **Deploy/smoke at wave boundaries** exists as `demo_publish` (#9): builds `demos/<dir>`, smoke-tests
  (page loads / 0 console errors / root renders), posts to the dashboard PR.
- **End-to-end playability per unit** is already a gate — each unit's `acceptance_criteria` runs the
  author-written Playwright e2e specs against a self-served build.
- **Live direction** exists as the dashboard PR + `steer` polling + optional wave gates.

So the remaining work is **not** more deploy/smoke plumbing. It is: (a) making the running game
*visible for feel-review* cheaply, (b) giving reviewers a game-feel lens, (c) protecting the inputs
agents must not rewrite, (d) documenting how to run/verify the demo (incl. the human-owned live path),
and (e) turning the harness's own telemetry into the competition's AI-utilization document.

## 2. Prerequisites the harness assumes (project-side — not part of these mods)

These are the game team's responsibility and must be true **before** a run:

1. **Provided inputs are committed & smoke-verified.** Anything agents integrate against but must not
   invent — AI proxy/adapter/contract, tuning data, and the **generated asset pack** — is on `main`
   with every asset already in `assets-manifest.json` (competition rule 5). Agents do not generate
   assets during a run.
2. **The demo is a self-contained `demos/<slug>/`** with its own `package.json`, building to a
   **subpath-safe static `dist/`** (`base: './'`). No engine/framework at the repo root.
3. **`build.test` for the run is the deterministic stub-mode suite only.** No `@live`-tagged spec ever
   gates a unit or the final PR (agents have no API keys — competition rule 6).
4. **Live-AI correctness is owned by a human** via a manual `e2e/live-smoke.md` checklist. The harness
   proves the stub shell is green; it cannot exercise the live path.
5. **Pages deployment of the demo is a project deploy-workflow concern.** With workflow-source Pages
   that build only the root, add a step to `.github/workflows/deploy.yml` that builds `demos/<slug>`
   into a subpath (e.g. `dist/apothecary/`). The click-through link then goes live on merge to `main`;
   during a run only screenshots exist (Pages deploys from `main`, runs work on the integration branch).

## 3. Modifications (priority-ordered, cut from the bottom)

### P0-A — Gameplay capture in the wave-boundary demo step
Extend the existing `demo_publish` agent (`publishDemo()` / `P.demoPublish` in the workflow) so that,
after the static smoke, it runs the demo's **scripted playthrough headless** (convention: the demo's
own Playwright e2e emits an ordered screenshot set, e.g. `demos/<slug>/e2e/artifacts/*.png`) and
attaches that **image sequence** (a GIF if `ffmpeg` is available, else the ordered stills) to the
dashboard PR comment, alongside the smoke result. Falls back to today's single shot if no playthrough
exists. Observation-only (never blocks the run); model stays the mechanical tier.
*Why:* lets the director review the first-minute *feel* from the dashboard PR without pulling a branch.
Deterministic because the deployed/captured build is stub-mode.

### P0-B — "How to run & verify" section in the final PR
The final PR is the team's hand-off and directly feeds competition deliverables #1 and #3. Add a
mandatory **"실행 & 검증 (How to run)"** section to the final/integration PR body
(`authorFinalPrPrompt` + a new **§2d** in `commands/super-pr-create.md`, referenced from §2b when the
run has a demo dir). It must contain:
- **Deployed play link** (Pages subpath) when available — deliverable #1/#3.
- **Local stub run:** `cd demos/<slug> && npm ci && npm run dev`.
- **Local live run:** export keys → `npm run dev` → the exact in-game moment that exercises live AI
  (e.g. "customer 3 generates; watch the silhouette resolve into the portrait").
- **Pointer to `e2e/live-smoke.md`** (the human-owned live checklist).
- **The 30–60s gameplay path** to reproduce for the deliverable #2 video.

No new arg needed — trigger off the already-passed `demo_publish.dir`.

### P1-C — Game-feel review lens
Add a lens `Game-feel/Juice` (family `feel`) to the workflow lens registry (`FAMILY` map + the
registry table in `docs/super-pipeline-architecture.md` §6), to `super-decomposer`'s scoring guidance
(trigger signals: real-time input, animation/juice, difficulty curve, first-30-seconds clarity,
graceful-degradation feel), and to `super-final-reviewer` as a persona. Because panel selection is
family-capped and score-driven, `feel` competes like any other lens and will usually seat for a game
PRD. Evidence bar = concrete latency/feedback/readability observations, ideally drawn from the P0-A
captured playthrough or a local run. It reviews the **final** PR (feel is cross-cutting), consistent
with the existing panel design.

### P1-D — Frozen provided-inputs guard
Some provided files must be **extended but never rewritten** — above all the vendor-call path, the one
thing agents can't test. Add optional `frozen_globs` (emitted by the decomposer or listed in the PRD,
passed through the launcher). SETUP records them; the IMPLEMENT prompt forbids modifying frozen paths
(extend via new files only); VERIFY/standards-check adds a deterministic guard — a `git diff` touching
any frozen glob blocks the unit — and Lead review flags it. Cheap, general-purpose, surfaced by this
game class.

### P2-E — AI-utilization document auto-draft
`finalize()` already returns `model_routing`, `agent_calls`, `role_outcomes`, `escalations`, and
steer/gate/demo stats. Add an end-of-run agent (or extend the launcher's `report.md` step) that mines
`board.json` + backlog + those stats + the PR/commit `[AGENT:]` trail + `assets-manifest.json` and
drafts competition **deliverable #4** to `docs/deliverables/ai-utilization.draft.md`: architecture
narrative, key prompts/instructions, the orchestration story, agent-attribution evidence, and the
external-asset/license attribution table (straight from the manifest). A human polishes it to PDF.

## 4. Where each modification lands (super-pipeline repo)

| File | Modifications |
|---|---|
| `workflows/super-pipeline.workflow.js` | A (`publishDemo`/`P.demoPublish`), B (`authorFinalPrPrompt`), C (`FAMILY`/registry), D (frozen-glob plumbing in `P.setup`/`P.implement`/`P.verify`), E (`finalize`/report agent) |
| `commands/super-pr-create.md` | B (new §2d game-demo run-section) |
| `commands/super-pipeline.md` | D (launcher passes `frozen_globs`), keeps `demo_publish.dir` for A/B |
| `agents/super-decomposer.md` | C (game-feel lens scoring), D (emit `frozen_globs`) |
| `agents/super-final-reviewer.md` | C (game-feel persona) |
| `docs/super-pipeline-architecture.md` | C (lens registry table), D (guard note) |

## 5. Division of labor implied
- **Harness + agents run implementation.** Humans do not hand-write game code.
- **Member A (director):** PRD/GDD slices, `/super-steer` decisions, **feel judgment** from P0-A
  captured playthroughs + local live runs, review-panel reading.
- **Member B:** prepares & smoke-verifies the **provided inputs** (proxy/adapter/contract/tuning +
  asset pack) *before* the run, owns the `e2e/live-smoke.md` checklist and the project `deploy.yml`
  subpath step, plus content/prompt work.

## 6. Competition-facing payoff
- Agent-attributed commits/PRs (`[AGENT: ...]`) are living evidence for deliverable #4; **P2-E** turns
  them and the manifest into the draft document automatically.
- **P0-B**'s run-section feeds deliverables #1 (play link) and #3 (how-to-run); **P0-A** captures feed
  the #2 gameplay-video path.
- The asset manifest satisfies the mandatory license-attribution requirement.
- The harness itself *is* the "director of AI" narrative; these deliberate, game-aware extensions show
  orchestration design, not just tool usage.

## 7. Dry-run & open questions
- **Dry-run:** apothecary v2 validates the full loop against a real game repo. Its `DISCOVERY.md` v2
  (especially async-seam frictions) feeds the next harness iteration. Close the §2 prerequisites first
  — missing assets or an unscoped `build.test` would waste a multi-hour run.
- Capture format for P0-A: image sequence by default (portable), GIF only when `ffmpeg` is present.
- P1-D severity: hard-block in VERIFY (default) vs. flag-to-Lead only?
- P0-B link injection: auto-fill the deployed subpath (needs `demo_publish.pages_base` + subpath) vs.
  leave a manual placeholder in the run-section?
</content>
</invoke>
