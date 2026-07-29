# AI 활용 기술 문서 (draft) — deliverable #4

> **Status: machine-drafted, not final.** Auto-drafted from one super-pipeline run's telemetry by the
> harness's end-of-run report agent (super-pipeline-game-mod spec §3 P2-E). Every number and link below
> was read from run state, GitHub, or the repo — nothing is estimated. Gaps are marked `<!-- TODO -->`
> for the human polisher; do not delete a TODO by guessing.
>
> **Scope of this draft:** run `20260725-025242` only — the apothecary demo's v2 (live-AI seam) build.
> It is one run of several. Not covered here: the v1 shell run `20260724-145432` (PR #17), the
> concurrent `darkest-context` run `20260725-153055` (PRs #56–#67), and all manual Claude Code sessions
> (docs, setup, asset generation). Deliverable #4 must eventually cover the **whole project**, so this
> file is a section draft, not the document.
>
> Written in English to match `docs/` house style. <!-- TODO: decide the submission language (judges are
> Korean; the PRD and most run artifacts are Korean) and whether this becomes a standalone PDF or a
> section of one. -->
>
> Requirement source: `docs/competition.md` §"Required deliverables (5)" → #4 must contain
> (a) a technical explanation of AI usage — architecture, key prompts and instructions — and
> (b) external asset / open-source attributions.

### Open items for the human (the `<!-- TODO -->` markers, listed visibly)

1. Submission language + whether this is its own PDF or a section (front matter).
2. Exact model ids behind the opus/sonnet/haiku tier aliases, if they should be named (§1.3).
3. Total tokens and wall-clock for the whole run — only the final segment's 2.1M was captured (§1.4).
4. What the judges receive as "key prompts": inline excerpts, a public harness repo, or vendored prompts (§2).
5. The GitHub-side review evidence for `u9`–`u14` is missing — those six Lead reviews exist only in run
   state (`review.json`, `git_mode: "local"`). Decide how to present that (§3.3).
6. Three of the four minor integration findings were not persisted (§3.3).
7. The one skipped demo-publish attempt (`after-wave-5`) has no recorded reason (§3.4).
8. Deliverable #5's per-member split — this draft only fixes the human/agent boundary (§3.5).
9. `15db1c8` has no assistant co-author trailer, unlike the other 22 run commits (§4.3).
10. The asset table covers the apothecary demo only, and there is **no open-source/npm license
    attribution yet** — deliverable #4 requires both (§5).
11. List every AI tool the project used (code agents, `gpt-image-1`, anything else), not just this run's (§5).
12. Coverage: this draft is one run. The v1 run, the `darkest-context` run, and manual sessions are not in it.

---

## 1. Architecture — how AI was orchestrated

### 1.1 The shape

The game is not written by a person prompting a chat window. It is written by a **multi-agent harness**
(`super-pipeline`, our own tool, kept in a sibling repo) that turns one frozen PRD into merged, reviewed,
deployable code. The orchestration shape of a run:

```
PRD (frozen)
  │
  ▼  decompose ......... 1 agent reads the PRD once → dependency DAG of work-units + review-lens scores
  ▼  wave-parallel build  per unit, in its own git worktree + branch:
  │                       SPEC → DESIGN → SETUP → TEST → IMPLEMENT → VERIFY → open PR
  ▼  unit PR review ..... Lead (≠ the implementer) reviews each unit PR, re-running the author's claims
  │                       itself; author rebuts or fixes; only the Lead may resolve a thread;
  │                       0 unresolved threads → squash-merge into the integration branch
  ▼  merge barrier ...... merges are serialized one at a time, rebased onto the latest integration head
  ▼  integration ........ a separate integrator agent re-runs the FULL suite on the integration branch
  │                       and hunts cross-unit contradictions the per-unit gates cannot see
  ▼  final review ....... 3 independent reviewer agents (R1/R2/R3), each a different lens × disposition,
  │                       review the integration→main PR. The Lead authored it, so the Lead **cannot**
  │                       resolve; only the reviewer who opened a thread may close it.
  ▼  human merge ........ the final PR is never merged by an agent.
```

Two invariants make this more than "an LLM in a loop":

1. **State lives on disk and on GitHub, never in a context window.** Every agent is spawned fresh, reads
   only the slice it needs (`.claude/super/`, `gh pr diff`), writes its result back to disk/PR, and dies.
   That is why a run can last hours without context rot — and why the PR trail below exists at all.
2. **Verification trust is inverted.** Reviewers, the integrator, and the panel are instructed never to
   believe a "GREEN" self-report; they re-run the tests themselves. This run's telemetry shows that
   working (§3.3).

### 1.2 This run's numbers

| Fact | Value |
|---|---|
| Run id | `20260725-025242` |
| PRD | `demos/apothecary/PRD.md` v2 (brownfield on the v1 shell — run `20260724-145432`, PR #17) |
| Integration branch → base | `super/20260725-025242` → `main` |
| Mode | `thorough`, `git_mode=full` (real PRs, real reviews, real merges) |
| Work-units | 14 (`u1`…`u14`) across 4 milestones |
| Waves (parallelism) | 6 waves: **8** ∥ then **2** ∥ then 1, 1, 1, 1 |
| Review lenses scored | 13 → 3 seated as the final panel, 9 handed to the integrator's 2nd pass |
| Frozen provided-input globs | 11 (vendor-call path, tuning data, asset pack, whole repo root) |
| Unit PRs merged | 14/14 (+ 1 restore PR #47) |
| Final PR | [#33](https://github.com/alstjgg/nhn-game-2026/pull/33) — open, human-merge only |
| Integration verdict | green (0 critical / 0 major / 4 minor findings) |

Integration evidence, re-run by the Lead on integration head `3c5cffa` (not taken from unit authors):

| Gate | Result |
|---|---|
| Unit tests | `vitest run tests/` — 23 files, **983 passed** |
| E2E | `npx playwright test` — **101 passed** in 11 files (1.1m); 0 `@live` specs (fence intact) |
| Typecheck | `tsc --noEmit` + `tsc --noEmit -p tsconfig.test.json` — exit 0 |
| Build | `tsc && vite build` — exit 0, `dist` 1.4M |
| Secret scan | `grep -rlE 'ANTHROPIC|OPENAI|sk-ant|api[_-]?key' dist` — clean |
| Lint | **skipped** — no lint gate configured (`build_commands.lint=null`; no lint script in `demos/apothecary/package.json`) |
| Standards check | zero `as any`, zero `@ts-ignore`/`@ts-expect-error`, zero `console.log`/`debugger` in `src/`, zero empty catch |

After the final panel's two review rounds the suite grew with the fixes: **1034 vitest** and
**111 Playwright** green at head `15db1c8`.

### 1.3 Role → model routing

Roles are routed to different model tiers by cost/risk. Quality-gate roles (`verify`, `leadReview`,
`integrate`, `finalReview`) are deliberately kept on the strongest tier — a cheap gate that passes
everything looks like success and would poison the harness's own learning signal.

| Role | Tier | Role | Tier |
|---|---|---|---|
| spec | opus | merge | haiku |
| design | opus | integrate | opus |
| setup | haiku | integFix | sonnet |
| test | opus | advisor | opus |
| implement | opus | replan | sonnet |
| verify | opus | steer | haiku |
| openPR | haiku | finalAuthor | opus |
| leadReview | opus | finalReview | opus |
| unitRespond | sonnet | finalRespond | opus |

<!-- TODO: map the tier aliases (opus/sonnet/haiku) to the exact model ids that actually served this run,
if the submission should name them. The run state records tiers only; do not guess version numbers. -->

Four units were marked `high` complexity by the decomposer (`u5`, `u9`, `u10`, `u13`) and carried a
per-unit override pinning `implement`+`verify` to the top tier; `u14` pinned `verify`.

### 1.4 Agent invocations (final resumed segment)

**82 agent invocations**, 0 recorded failures:

| Role | Calls | Role | Calls |
|---|---|---|---|
| reconcile | 2 | demoPublish | 6 |
| steer | 6 | integrate | 4 |
| design | 6 | integFix | 3 |
| setup | 6 | finalAuthor | 1 |
| test | 6 | finalReview | 9 |
| implement | 6 | finalRespond | 2 |
| verify | 6 | aiReport | 1 |
| openPR | 6 | | |
| leadReview | 6 | | |
| merge | 6 | | |

`role_outcomes` for this segment: `spec 6/0`, `design 6/0`, `setup 6/0`, `test 6/0`, `implement 6/0`,
`openPR 6/0`, `unitRespond 6/0`, `merge 6/0`, `integFix 1/0`, `finalAuthor 1/0`, `finalRespond 1/0`
(ok/fail). Escalations: **0**. Steer: 6 polls, 0 directives. Gates: 0 (wave-gating disabled for this
run). Demo publish: 6 attempts, 5 published, 1 skipped, 0 failed, 5 captured.

Tokens for this segment: **2,116,680**.

> **Read the "6" honestly.** These counts cover the *third and final* segment of the run, which rebuilt
> only `u9`–`u14` (6 units) — `u1`–`u8` had already merged in earlier segments and were skipped by the
> reconcile step. The run was interrupted twice (§3.1), and the earlier segments' call/token counts were
> not captured. <!-- TODO: total tokens and total wall-clock for the whole run are unknown; segment 1+2
> counts were lost when those workflow runs were interrupted. Either state "≥2.1M tokens for the final
> segment" or reconstruct from the account's usage records. -->

### 1.5 The membrane (design constraint the architecture enforces)

Project rule: **the player never types free text to an LLM.** Everything sent to a model is composed
from structured game elements. In this run that is `u4`, the persona-brief composer: a trait table plus
game state is assembled into a `DialogueRequest`/`PortraitRequest` — there is no text input anywhere in
the UI. The rule was given to the review panel as an explicit reviewer concern (R2: "every string going
to the LLM is assembled from data tables / game state; has a free-text input path appeared?") and the
panel found no violation. The player-facing consequence of the same design is the run's actual PoC
question: **a slow live model hides inside the game's rhythm** — the next customer is generated while the
current one is being served, with a diegetic door-idle beat and a silent 25 s fallback instead of a
spinner.

---

## 2. Key prompts and instructions

The prompts are not ad-hoc chat messages; they are versioned role definitions. They live in the sibling
harness repo, **not in this repo**: `super-pipeline/agents/*.md` (4 role definitions) and
`super-pipeline/workflows/super-pipeline.workflow.js` (1012 lines — the per-phase prompt bodies and the
deterministic control flow), plus `super-pipeline/docs/super-pipeline-architecture.md`.

<!-- TODO: decide what the judges actually receive — (a) verbatim excerpts inline in the PDF,
(b) the harness repo made public and linked, or (c) the harness vendored into this repo. Deliverable #4
asks for "key prompts and instructions", so at least the four role missions and the DoD contract below
should appear verbatim. -->

### 2.1 Per-role mission (quoted from the role definitions)

| Role | Mission (verbatim, abridged) |
|---|---|
| **super-decomposer** | "Given one PRD, you split it into a **dependency DAG of work-units** that multiple agents can implement in parallel, and score **lenses** for final-review panel selection. **You do not implement, write tests, or make design decisions.**" |
| **super-lead** (3 modes: unit-PR reviewer / final-PR author / final-review responder) | "You are super-pipeline's **Lead** — the main agent responsible for the change as a whole. … **Every invocation is fresh context** — read only what you need from `gh`/disk, leave results on the PR/disk." |
| **super-final-reviewer** (×3 personas) | "You are an **independent reviewer** of the final main PR … a **different party** from the Lead who authored it … **You never edit code**. … **Distrust self-reports**: never take the PR body's integration results, DoD checks, or 'green' claims at face value. For anything in your `focus` area, **run/reproduce the verification yourself** before resolving a thread." |
| **super-integrator** | "Units can each be green in isolation yet break or contradict each other **when combined**. … **You never fix code yourself** — report the spots needing fixes in structured form. … Only facts you confirmed by running the full suite **yourself** feed the green verdict." |

Every agent prompt also carries a shared "prefer symbol tools, never read code files whole" block — a
context-efficiency instruction, not a style preference: it is what keeps a multi-hour run inside its
context budget.

### 2.2 Gate contracts (enforced in code, not in prose)

- **Per-unit pipeline:** `SPEC → DESIGN → SETUP → TEST → IMPLEMENT → VERIFY → openPR → leadReview →
  resolve-loop → squash-merge`. No barrier between units — unit A can be implementing while unit B is
  still speccing.
- **Merge barrier:** merges into the integration branch are serial, one at a time, each rebased onto the
  current head; a conflict spawns a fix agent rather than stopping the run.
- **Resolve-authority asymmetry** (the anti-self-approval rule):
  unit PR → only the **Lead** (reviewer) may resolve; the author may only rebut or fix.
  final PR → only **R1/R2/R3** (the reviewer who opened the thread) may resolve; the **Lead cannot**.
  Terminal condition = *zero dangling threads*, not "the author says it's done".
- **Frozen provided-inputs guard** (`frozen_globs`): some inputs may be extended but never rewritten —
  above all the vendor-call path, the one thing agents cannot test. SETUP records the globs, IMPLEMENT is
  forbidden to touch them, and **VERIFY hard-blocks**: if `git diff --name-only <integration>...HEAD`
  touches a frozen glob, `green=false` even when every acceptance criterion passes. Lead review flags it
  independently as a second defence. This run's 11 frozen globs:
  `demos/apothecary/server/ai-proxy.mjs`, `demos/apothecary/src/ai/adapter.ts`,
  `demos/apothecary/data/generation.json`, `demos/apothecary/assets/**`, `demos/apothecary/tools/**`,
  `assets-manifest.json`, and the repo root's `src/**`, `data/**`, `public/**`, `docs/**`, `.github/**`.
- **Global DoD** (the run does not stop until all of it holds): per-unit tests green · types 0 · lint 0 ·
  integration suite green (integrator) · every unit's `acceptance_criteria` met (binary) · zero NEVER-rule
  violations (`as any` / `@ts-ignore` / empty catch / deleted tests) · zero unresolved threads on unit and
  final PRs · build succeeds.
- **Escalation ladder** (instead of stalling): VERIFY fails → IMPLEMENT retry (inner) → **advisor**
  rewrites the approach and `design.md` (middle) → **replanner** re-decomposes the unit into independent
  sub-units (outer) → only then `blocked`. Failures append to `units/<id>/failures.md` so retries and the
  advisor cannot repeat the same mistake.
- **Demo publish** is observation-only and never blocks the run.

### 2.3 The review panel is composed per PRD, not fixed

The decomposer scored 13 lenses for relevance to *this* PRD; a deterministic rule then seated three
reviewers — at most one per lens *family*, the top-scoring lens mandatory, and **three different
dispositions** so the panel cannot groupthink. Seated:

| | Focus (score) | Disposition | Evidence bar (verbatim) |
|---|---|---|---|
| **R1** | Correctness/Logic (5) | Skeptical breaker | "구체적 입력→잘못된 출력 repro/반례를 제시하지 못하면 finding으로 올리지 않는다" (no finding without a concrete input→wrong-output repro) |
| **R2** | Security/AppSec (4) | Standards/invariant enforcer | "위반된 불변식과 그 지점(파일·줄)을 지목해야 통과" (name the violated invariant and the exact file·line) |
| **R3** | Game-feel/Juice (5) | Operator/user advocate | "플레이어가 실제로 겪는 순간(초·프레임 단위)으로 서술하지 못하면 올리지 않는다" (describe it as a moment the player actually experiences, in seconds/frames) |

Testing-quality also scored 5 but shares R1's family, so its concerns were **written into R1's concern
list explicitly** (not silently dropped), and the nine unseated lenses were handed to the integrator's
second pass. Game-feel/Juice is a lens we added to the harness for this project class
(`docs/super-pipeline-game-mod.md` §3 P1-C) — a game's first 60 seconds is a reviewable property, so it
gets a reviewer with subpoena power over the build.

---

## 3. Orchestration story — what actually happened

### 3.1 Two interruptions, two different recoveries (recorded, not hidden)

| When | Cause | Effect | Recovery |
|---|---|---|---|
| ~03:30 KST | account session usage limit | 66 agents done, 40 failed; wave-1 unit PRs open, none merged. `u7` implement ×6 **plus the advisor and the replanner** all died on the limit — not real engineering failures | same-session resume (`resumeFromRunId`): the unchanged prefix replays from cache, only the limit-killed agents re-run |
| ~15:00 KST | operator stopped the run | `u1`–`u8` merged, `u9`–`u14` not started | **new session, fresh workflow run** (`wf_cfa9a33f-7c2`) seeded with `u1..u8` as already-merged. `resumeFromRunId` deliberately **not** used |

The second choice was forced by a real harness bug found in this run: resuming a *stopped* run across
sessions misses the cache, re-runs already-merged units, and opens duplicate PRs — and because unit PRs
squash-merge, a duplicate PR **deletes its sibling units' files** on merge. Three duplicate PRs (**#43,
#44, #45**) were caught and closed, and one real casualty occurred: `u4`'s final content was dropped by a
stale-branch merge and had to be restored by [#47](https://github.com/alstjgg/nhn-game-2026/pull/47)
(`82e01df`, "restore u4 final content dropped by stale-branch force-push"). The bug was written up
(`super-pipeline/docs/bug-resume-rechurn.md`), fixed in the harness (super-pipeline PR #2 — a Reconcile
step that seeds merged units instead of removing them from the backlog), and the fix was exercised on the
restart: reconcile ran twice, skipped `u1`–`u8`, and **0 duplicate PRs** appeared in the final segment.
A side benefit of restoring the true DAG: `u9` and `u10` became parallel, where the stale wave plan had
serialized them.

This is the honest cost line of an autonomous harness: **the failures were operational (limits, resume
caching, a stale branch), not the model losing the plot.** Every one of them is recorded in
`.claude/super/board.json` (`interruptions`, `notes`, `duplicate_prs_closed`, `resume_recipe`).

### 3.2 Escalations, steering, gates

- **Escalations:** 0 in the final segment. The middle rung (**advisor**) and outer rung (**replanner**)
  *were* invoked in segment 1 on `u7` after repeated implement/verify failures — and were themselves
  killed by the usage limit before finishing; on resume `u7` went green without escalation and merged as
  [#41](https://github.com/alstjgg/nhn-game-2026/pull/41). So the ladder was exercised but never
  concluded. No unit ever reached `blocked`.
- **Steering:** the harness opens the final PR as a **draft dashboard at the start of the run**, and that
  PR doubles as the interrupt channel: between waves a cheap `steer` agent polls for new comments and
  classifies them as directives (injected into not-yet-started work) or questions (answered on the board).
  6 polls ran, 5 comment ids were processed, **0 directives and 0 questions** were found — the only
  comments were the harness's own demo posts, which the poller correctly did not mistake for human
  instructions (`.claude/super/steer.json`). The operator steered this run by *stopping* it instead
  (§3.1), and by pre-resolving one blocking open question by hand (see below).
- **Wave gates:** disabled (`wave_gate: false`) — 0 gates, 0 approvals, 0 timeouts. The run was allowed to
  go wave-to-wave unattended.
- **Human decisions that shaped the run** are recorded as `resolved_decisions` in
  `.claude/super/backlog.json` (8 entries), including: freezing the whole repo root plus the vendor path;
  cutting `u1`'s scope after the PRD's DAG hint disagreed with what was already on disk; allowing a
  "forward oracle" (a merged unit whose caller arrives later in `u13`) so two units never edit the app
  shell at once; deciding the deployed stub build still plays **three** customers so judges can actually
  observe the waiting beat and the silent fallback; and resolving `u11`'s blocking open question OQ-1
  (the 0→3 patience-tier ladder is unreachable with one customer) with a ≤5-line backward-compatible
  `?customer=` test-harness knob plus explicit permission to overrun one file glob, logged in
  `DISCOVERY.md`.

### 3.3 Review actually bit — twice

**Unit level (Lead vs. implementer).** On `u1`–`u8` the review happened on GitHub: **205 inline review
comments** across the eight PRs — 146 from the Lead, 59 rebuttals/fix-reports from the unit authors —
with round-1 verdicts of `changes_requested` on every PR that reached a verdict, and round-2 approvals on
#35, #39, #41. Two mechanical realities are worth recording because they show up in the artifacts: the
Lead posts its verdict as a **comment** rather than a formal review state ("GitHub refuses
`--request-changes`/`--approve` on a PR owned by the same account" — the whole run authenticates as one
`gh` account), and `u4`–`u8` were finally merged by hand during the pre-resume cleanup, with re-verification
deferred to the integrator and the final panel (`board.notes`).

For `u9`–`u14` the six Lead reviews **do exist and are substantive — but on disk, not on GitHub**:
`.claude/super/units/<id>/review.json`, each recording `git_mode: "local"`, a `changes_requested` verdict,
independent re-runs of the author's claims, a frozen-path guard result, and out-of-glob edit assessments.
**41 findings** total (u9 8, u10 5, u11 7, u12 4, u13 9, u14 8) and `submitted_comments` counts of
8/5/7/4/9/0 — yet GraphQL confirms PRs #51, #52, #55, #57, #62, #64 carry **0 review threads, 0 reviews,
0 comments**. <!-- TODO: the GitHub-side review evidence for u9–u14 is missing (harness degraded to local
review recording mid-run). If the deliverable leans on "reviews are visible in the PR trail", say plainly
that six unit reviews are recorded in run state instead, or attach the review.json files. -->

What the disk reviews contain is exactly what the "distrust self-reports" instruction asks for, e.g.
`u13`: two fresh detached worktrees — one at the PR head, one at the base — "used to prove which failures
are u13's"; `u14`: the reviewer noticed GitHub's diff was inflated because the branch merged u13's
*branch* commit while the integration branch carries u13 as a *squash*, so it diffed tree-to-tree and
verified the 14 re-listed files were byte-identical, reducing the real delta to 11 files.

**Final level (independent panel vs. Lead).** On PR #33: **17 threads / 53 comments over 3 rounds.**

| Round | What happened |
|---|---|
| 1 (11:54–12:06Z) | R2 opened 4 threads, R1 4, R3 8 — 16 findings |
| Lead fixes (12:54Z) | 16 `[fix report]` replies, nothing rebutted, in 3 commits: `08ac96f` (R2), `488c9b2` (R1), `7d4db61` (R3) |
| 2 (13:01–13:26Z) | R2 verified & resolved 4/4. R1 verified 4/4 **and opened a new one**: the final-gate e2e was load-flaky (`page.clock.pauseAt(now)` on a resumed fake clock lands in the past — "2 of 3 consecutive unmutated runs went red … the PR's '110 playwright green' is a single lucky sample of that distribution"). R3 verified 7/8 and held one open with a per-frame trace: the tier-3 line was readable for "~2–3 frames" because the forced handover swapped the screen out from under it |
| Lead fixes (13:46Z) | `15db1c8` — the forced handover now waits on the player's press instead of a timer (with the reasoning for rejecting R3's own suggested fixed 0.8–1.2 s hold on the record), and the clock pause became forward-only with the invariant asserted in the helper |
| 3 (13:54–14:06Z) | R3 re-measured on its own build (313/313 sampled frames at full opacity) and resolved. R1 reproduced on its own clean worktree — 4 consecutive full-suite greens, `--repeat-each=8 --workers=8` under load, **plus a reverse mutant** restoring the old line to prove the fix was the cause and not a quiet machine — and resolved |

Both reviewers explicitly refused to grade on the author's numbers ("my own tree, my own mutants, not
your report"; "I rebuilt `7d4db61` from scratch … every claim below is from my own playthrough"). Three
substantive findings were R3's game-feel calls — repeated faces, `[건네기]` out of frame at 1280×720, a
missing door beat — i.e. the "juice" lens found real judge-visible defects that a correctness-only panel
would have passed. The panel also refused to close two residuals by fiat: a genuinely new third portrait
sheet needs a human generator pass **plus an `assets-manifest.json` entry** (repo rules 5/6), and the
live-AI paths (silhouette entry, the real 25 s fence) "remain unverified here: no keys."

The integrator's second pass (covering the nine unseated lenses) returned green with 4 minor findings.
The documented one is a consistency defect worth keeping in the deliverable because it is the kind of
thing only cross-unit review catches: `u3`'s comment in `pixelate.ts` claims a named import prevents the
generation table (including the game's answer key) from shipping in the client bundle, but integrated,
`persona.ts` and `ai/stub.ts` both **default-import** `generation.json`, so the real bundle carries it —
while the guard test stayed green because it bundles `pixelate.ts` alone. The correct fix is to fix the
claim and widen the test, not to remove the data (the trait table is genuinely needed client-side in stub
mode). <!-- TODO: the other 3 minor integration findings were not captured in `.claude/super/integration.json`
(only `findings_count: {critical 0, major 0, minor 4}` persisted). Retrieve them from the workflow return
value or re-run the integrator if they must be listed. -->

### 3.4 Demo publishing — the run showed its work as pictures

At every wave boundary a cheap `demoPublish` agent built the demo, smoke-tested it, ran the demo's own
scripted Playwright playthrough, pushed the ordered screenshots to a side branch
(`super/demo-shots/20260725-025242`) and posted them to the dashboard PR — so a human could judge the
*feel* of the first minute from the PR, without checking out a branch. 6 attempts → **5 published, 1
skipped, 0 failed, 5 captured**. Published checkpoints: `after-wave-2` (`ebc099f`), `after-wave-3`
(`6ac432b`), `after-wave-4` (`9ea0eda`), `after-wave-6` (`180adf7`), `before-final-review` (`3c5cffa`,
smoke pass, 6 stills). Each post records smoke result (page loads / zero console errors / `#app` renders /
no external requests) and the base commit. GIFs were not produced — `ffmpeg` was unavailable, so the step
fell back to ordered stills, as specified. <!-- TODO: the one skipped attempt posted no comment; the
missing checkpoint label is `after-wave-5`, and the skip reason is not recorded in run state. -->

The final PR body also carries the mandatory "how to run & verify" section (deployed play link, local
stub run, local live run with the exact in-game moment that exercises live AI, the human-owned
`e2e/live-smoke.md` checklist, and the 30–60 s path to reproduce for the deliverable #2 video) — that
section exists precisely to feed deliverables #1 and #3.

### 3.5 Division of labour between humans and agents

Per `docs/super-pipeline-game-mod.md` §5, and as executed: **agents wrote the game code — humans did not
hand-write it.** The humans owned (a) the PRD and its frozen provided inputs — the AI proxy, the adapter
seam, the contract, the tuning data, the generated asset pack, all handed to the run as read-only inputs;
(b) run-time decisions: the 8 `resolved_decisions`, the two interruption calls, the manual merge cleanup
and the `u4` restore; (c) the live-AI checklist that no agent can run because it needs API keys; and (d)
the final merge to `main`, which the harness is forbidden to do. <!-- TODO: deliverable #5 (team roles)
needs the per-member split (Member A director / Member B provided inputs + live smoke + deploy); this
draft only establishes the human/agent boundary. -->

---

## 4. Agent attribution evidence

Every unit's PR body opens with an `[AGENT: …]` marker naming the role that wrote it, and every review
comment names the reviewing role. This is a live audit trail, not a claim.

### 4.1 Unit PRs (author = the unit's implementation agent)

| Unit | PR | Marker | Merged (UTC) |
|---|---|---|---|
| u1 stub adapter + boot factory | [#40](https://github.com/alstjgg/nhn-game-2026/pull/40) | `[AGENT: U-u1 author]` | 01:07:57 |
| u2 patience→expression tier classifier | [#37](https://github.com/alstjgg/nhn-game-2026/pull/37) | `[AGENT: U-u2 author]` | 01:09:43 |
| u3 client-side pixelation utility | [#34](https://github.com/alstjgg/nhn-game-2026/pull/34) | `[AGENT: U-u3 author]` | 01:11:41 |
| u4 persona brief composer (the membrane) | [#36](https://github.com/alstjgg/nhn-game-2026/pull/36) | `[AGENT: U-u4]` | 02:45:53 |
| u4 restore (post-merge repair) | [#47](https://github.com/alstjgg/nhn-game-2026/pull/47) | — | 02:50:46 |
| u5 prefetch orchestrator + injected clock | [#38](https://github.com/alstjgg/nhn-game-2026/pull/38) | `[AGENT: U-u5]` | 02:52:08 |
| u6 multi-verb Choice schema + stub content | [#39](https://github.com/alstjgg/nhn-game-2026/pull/39) | `[AGENT: U-u6 author]` | 02:51:21 |
| u7 asset-pack sprites + shop/crafting skin | [#41](https://github.com/alstjgg/nhn-game-2026/pull/41) | `[AGENT: U-u7 author]` | 02:52:15 |
| u8 door-idle waiting-beat screen | [#35](https://github.com/alstjgg/nhn-game-2026/pull/35) | `[AGENT: U-u8 author]` | 02:52:23 |
| u9 portrait: sheet slicing, blink, silhouette | [#52](https://github.com/alstjgg/nhn-game-2026/pull/52) | `[AGENT: U-u9 author]` | 06:16:46 |
| u10 adapter-driven multiverb beat engine | [#51](https://github.com/alstjgg/nhn-game-2026/pull/51) | `[AGENT: U-u10 author]` | 06:19:15 |
| u11 patience meter → diegetic expression tier | [#55](https://github.com/alstjgg/nhn-game-2026/pull/55) | `[AGENT: U-u11 author]` | 07:04:00 |
| u12 tier-toned customer lines | [#57](https://github.com/alstjgg/nhn-game-2026/pull/57) | `[AGENT: U-u12 author]` | 07:51:14 |
| u13 async pipeline wired into the app shell | [#62](https://github.com/alstjgg/nhn-game-2026/pull/62) | `[AGENT: U-u13 author]` | 09:13:52 |
| u14 full-loop golden gate + deliverable audit | [#64](https://github.com/alstjgg/nhn-game-2026/pull/64) | `[AGENT: U-u14 author]` | 10:23:09 |

Final PR: [#33](https://github.com/alstjgg/nhn-game-2026/pull/33) — `[AGENT: Lead]`.

### 4.2 Review trail (representative permalinks)

Unit-PR review, Lead vs. implementer:

- Lead round-1 verdict, u8 — https://github.com/alstjgg/nhn-game-2026/pull/35#issuecomment-5073446583
- Lead round-2 approval after verifying each fix, u8 — https://github.com/alstjgg/nhn-game-2026/pull/35#issuecomment-5075916756
- Lead round-2 approval, u7 ("I did not trust the self-reports — I re-ran and re-measured everything") — https://github.com/alstjgg/nhn-game-2026/pull/41#issuecomment-5075989497
- Lead round-2 approval, u6, recording that a single `gh` account cannot `--approve` its own PR — https://github.com/alstjgg/nhn-game-2026/pull/39#issuecomment-5075897111
- Lead re-verification finding no change, u2 — https://github.com/alstjgg/nhn-game-2026/pull/37#issuecomment-5075879617

Final-PR panel, independent reviewers vs. the Lead:

- R1 round-2: verifies 4 fixes with its own mutants, opens a new load-flakiness finding — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5078607475
- R3 round-2: rebuilt and replayed at judge pace, 7 of 8 resolved, 1 held with a per-frame trace — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5078653716
- Lead answering all 16 round-1 threads with a commit-by-panel table — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5078556707
- Lead `[fix report]` explaining why it took R3's second option over the timed hold — https://github.com/alstjgg/nhn-game-2026/pull/33#discussion_r3650265033
- R3 closing that thread on its own re-measurement — https://github.com/alstjgg/nhn-game-2026/pull/33#discussion_r3650275188
- R1 closing the flakiness thread with 4 greens **and a reverse mutant** — https://github.com/alstjgg/nhn-game-2026/pull/33#discussion_r3650292753
- Lead anomaly note to the human reviewer (the dashboard PR had been closed mid-run and was reopened) — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5078360954

Demo-publish posts (`[AGENT: Demo]`), one per wave boundary:

- after-wave-2 — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5077290395
- after-wave-3 — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5077427257
- after-wave-4 — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5077589661
- after-wave-6 — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5078141864
- before-final-review — https://github.com/alstjgg/nhn-game-2026/pull/33#issuecomment-5078344111

### 4.3 Commit trail

The run's commits sit on `super/20260725-025242`, from the dashboard seed `af58c00` to `15db1c8`.
Unit commits carry the unit id in the subject (`[u2] Add patience-tier expression classifier`,
`feat(apothecary): wire the async generation pipeline into the app shell (u13) (#62)`, …); the
integration and post-review fixes are the seven `fix(apothecary): …` commits (`618138b`, `46bfb42`,
`3c5cffa`, `08ac96f`, `488c9b2`, `7d4db61`, `15db1c8`).

Attribution is also in the commit trailers. Every merged unit commit carries
`Co-authored-by: MinSeo Park <26458319+alstjgg@users.noreply.github.com>` (repo rule 1: commits are
attributed to the personal account, never a corporate identity) **plus** an assistant co-author trailer —
`Co-authored-by: Claude Opus 5 (1M context) <noreply@anthropic.com>` on 21 of the 23 run commits, and
`Claude Fable 5 <noreply@anthropic.com>` on the `u4` restore `82e01df`. `15db1c8` carries no assistant
trailer. <!-- TODO: `15db1c8` (the last panel-fix commit) is missing its co-author trailer; note it or
leave the inconsistency documented — history must not be rewritten (repo rule 2). -->

Commit history itself is a deliverable (#1: "full source code in the same repository, with commit history
preserved"), so nothing here was squashed away after the fact: unit PRs squash-merge **into the
integration branch**, and the integration branch reaches `main` as one reviewed PR with the trail above
intact.

---

## 5. External assets & licenses

Verbatim from `assets-manifest.json` (repo rule 5: every external or AI-generated asset gets an entry
with file, tool, prompt, and license — this table *is* that file). All 11 assets in the apothecary demo
were generated for this project; prompts are quoted in full because deliverable #4 asks for the
instructions given to AI.

| File | Tool | License | Prompt |
|---|---|---|---|
| `demos/apothecary/assets/bg-shop.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Wide interior scene: a small back-alley Korean apothecary shop seen from the shopkeeper's side, wooden counter along the bottom edge, shelves of labeled jars and bundles of dried herbs hanging above, entrance door centered in the back wall, warm lantern light, dusk visible through the window. No people, no text. |
| `demos/apothecary/assets/ui-bubble.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. A single empty speech bubble for a retro game dialogue UI: rounded rectangle with a small tail pointing down-left, thick dark outline of even width on all sides (suitable for 9-slice scaling), plain parchment-colored fill. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/ui-shelf.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. A wooden apothecary shelf panel with two rows of empty slots and small drawers below, front view, warm dark wood with brass handles, designed as a UI backdrop panel for item slots. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/ingredients-1.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Item sprite sheet: a 4x3 grid of small glass apothecary jars. Each COLUMN is one herbal ingredient — column 1: sliced licorice root (감초, pale yellow slices); column 2: dried red jujube dates (대추); column 3: fresh ginger root pieces (생강); column 4: dried yellow chrysanthemum flowers (국화). Each ROW is a fill state — top row: jar full; middle row: jar half full; bottom row: jar nearly empty with only scraps. Identical jar shape, size and position in every cell. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/ingredients-2.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Item sprite sheet: a 4x3 grid of small glass apothecary jars. Each COLUMN is one herbal ingredient — column 1: dried white balloon-flower roots (도라지); column 2: chalky white poria mushroom chunks (백복령); column 3: small glossy brown jujube seeds (산조인); column 4: fresh green mint leaves (박하). Each ROW is a fill state — top row: jar full; middle row: jar half full; bottom row: jar nearly empty with only scraps. Identical jar shape, size and position in every cell. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/equip-teapot.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Sprite sheet: a 2x2 grid of the same small round clay teapot used for steeping herbal tea. Top-left: idle, lid closed, no steam. Top-right: steeping frame 1, a faint steam wisp. Bottom-left: steeping frame 2, two steam wisps rising. Bottom-right: steeping frame 3, strong curling steam and a soft warm glow. Identical teapot position and scale in all four cells. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/equip-pot.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Sprite sheet: a 2x2 grid of the same traditional dark earthenware medicine-brewing pot (약탕관) sitting over a small flame, used for decocting herbs. Top-left: idle, no flame, lid on. Top-right: decocting frame 1, small flame, first bubbles. Bottom-left: decocting frame 2, steady flame, bubbling liquid visible at the rim. Bottom-right: decocting frame 3, strong flame, rolling boil with steam. Identical pot position and scale in all four cells. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/equip-mortar.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Sprite sheet: a 2x2 grid of the same heavy stone mortar with a wooden pestle, used for grinding herbs. Top-left: idle, pestle resting inside the mortar. Top-right: grinding frame 1, pestle lifted high. Bottom-left: grinding frame 2, pestle striking down into the mortar. Bottom-right: grinding frame 3, pestle down with a small puff of herb powder rising. Identical mortar position and scale in all four cells. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/potions.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Item sprite sheet: a 3x2 grid of the same small corked glass medicine bottle. Top-left: empty bottle. Top-middle: filled with a calm pale-green remedy. Top-right: filled with a deep brown herbal decoction. Bottom-left: filled with a strange glowing violet experimental brew with tiny sparkles. Bottom-middle: filled with a murky grey-brown failed sludge. Bottom-right: the bottle wrapped in cloth and twine as a finished package. Identical bottle shape, size and position in every cell. Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels. |
| `demos/apothecary/assets/fallback-portrait-1.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Character sheet: a 4x2 grid of eight bust portraits of the SAME person, identical framing, scale and head position in every cell, shoulders-up, facing the viewer. Four columns, one expression per column — column 1: calm and neutral; column 2: indifferent, losing interest; column 3: irritated, frowning; column 4: fed up, about to walk out. Two rows: the top row has eyes open; the bottom row repeats the exact same portrait as the cell above but with eyes closed mid-blink, everything else identical. Flat single-color background in all cells. No gridlines, no borders, no text, no labels. A stout middle-aged merchant man with a tired smile, short beard, worn travel coat and a shoulder bag. |
| `demos/apothecary/assets/fallback-portrait-2.png` | gpt-image-1 | generated for this project | Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Character sheet: a 4x2 grid of eight bust portraits of the SAME person, identical framing, scale and head position in every cell, shoulders-up, facing the viewer. Four columns, one expression per column — column 1: calm and neutral; column 2: indifferent, losing interest; column 3: irritated, frowning; column 4: fed up, about to walk out. Two rows: the top row has eyes open; the bottom row repeats the exact same portrait as the cell above but with eyes closed mid-blink, everything else identical. Flat single-color background in all cells. No gridlines, no borders, no text, no labels. An elderly woman with a kind wrinkled face, grey hair in a neat bun, dark shawl over a hanbok-style jacket. |

Manifest note, verbatim: *"Tracks third-party assets and their licenses, separate from our MIT-licensed
code. One entry per external asset. Required before shipping any asset we did not create."*

Open items for this section:

- The run **did not** add any asset: `assets-manifest.json` and `demos/apothecary/assets/**` were frozen
  inputs, and the guard confirmed clean on every review. The third portrait sheet R3 asked for was
  explicitly **left to a human generator pass plus a manifest entry** rather than being smuggled in.
- <!-- TODO: this table covers the apothecary demo only. Before submission, extend it to every asset in
  the repo (other demo tracks, root `public/assets/`, fonts, audio) and add open-source dependency
  attribution (npm licenses for the shipped bundle) — deliverable #4 requires external **asset and
  open-source** attributions, and this manifest currently tracks assets only. -->
- <!-- TODO: `gpt-image-1` is the generation tool of record for these assets; the model/harness used for
  the code (§1.3) is a separate disclosure. The competition asks that "tools used and how they were used
  must be documented" — list every tool the project used (code agents, image generation, any others),
  not just this run's. -->

---

## Appendix — where the evidence lives

| Evidence | Path / URL |
|---|---|
| Run state (board, backlog, panel, integration, steer, demo) | `.claude/super/*.json` (gitignored by repo rule 4 — **not** in the repo; copy out anything the PDF cites) |
| Per-unit spec/design/review/verify records | `.claude/super/units/<id>/` |
| Frozen PRD for this run | `.claude/super/prd.md` (and `demos/apothecary/PRD.md`) |
| Harness role prompts + orchestrator | sibling repo `super-pipeline/agents/*.md`, `super-pipeline/workflows/super-pipeline.workflow.js` |
| Harness architecture write-up | `super-pipeline/docs/super-pipeline-architecture.md` |
| Game-specific harness extensions (this project's mods) | `docs/super-pipeline-game-mod.md` |
| Resume bug found by this run | `super-pipeline/docs/bug-resume-rechurn.md` |
| Run journal written by the agents themselves | `demos/apothecary/DISCOVERY.md` |
| Human-owned live-AI checklist (needs keys) | `demos/apothecary/e2e/live-smoke.md` |
| Asset manifest | `assets-manifest.json` |
| Playthrough stills captured during the run | branch `super/demo-shots/20260725-025242`, `demos/apothecary/e2e/artifacts/*.png` |
