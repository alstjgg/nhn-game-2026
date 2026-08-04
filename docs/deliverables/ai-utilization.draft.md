# AI 활용 기술 문서 (draft) — deliverable #4

> **Document status: an accumulating machine-draft.** This file holds **one section per
> super-pipeline run**, each auto-drafted at end of run by the harness's report agent
> (super-pipeline-game-mod spec §3 P2-E) from that run's own telemetry, run state, GitHub, and the
> repo. Nothing is estimated; gaps are `<!-- TODO -->` for the human polisher. Sections are appended,
> and a *different* run's section is never touched. The one exception is a run that is drafted twice
> because it was interrupted and later resumed: its own section is rewritten in place at final
> completion, and says so at the top. Part A is such a section.
>
> Requirement source: `docs/competition.md` §"Required deliverables (5)" → #4 must contain
> (a) a technical explanation of AI usage — architecture, key prompts and instructions — and
> (b) external asset / open-source attributions.

### Run index

| Run | What it built | Part | End state |
|---|---|---|---|
| `20260804-000518` | Engine / LLM build — everything left of the view-driver seam (DDAY, repo root) | **A** | **complete** — 11 of 11 units merged, integration `green: true`, 0 acceptance criteria unmet; final PR **not opened** (agent blocked on the standing "ask before opening a PR" preference) |
| `20260725-025242` | apothecary demo v2 (live-AI seam) | **B** | complete; final PR [#33](https://github.com/alstjgg/nhn-game-2026/pull/33) open for human merge |

<!-- TODO: runs with no section here yet — 20260724-145432 (apothecary v1 shell, PR #17),
20260725-153055 (darkest-context, PRs #56–#67), 20260803-213143 (client view layer, PR #110 — ran
concurrently with Part A and is referenced throughout it), and every manual Claude Code session
(docs, setup, asset generation). Deliverable #4 must cover the whole project. -->

<!-- TODO (document-level): submission language — judges are Korean, the PRDs and most run artifacts
are Korean, these drafts are English to match docs/ house style. Also decide whether this becomes a
standalone PDF or a section of one. -->

---

# Part A — run `20260804-000518` (Engine / LLM build)

> Auto-drafted by the report agent at end of run.
>
> **This section replaces an interim draft written at 02:13 KST**, when the run had stalled at 1 of
> 11 units. The run was resumed and completed: all 11 units are merged and the integration branch is
> green. The stall is *not* deleted from the record — it is §A3.1, because a harness that recovers
> from its own orchestration bug is better evidence than one that never hits one. The earlier draft's
> claims about "the run ended in wave 1" are superseded by this section.

## A1. Architecture — how AI was orchestrated

### A1.1 The shape

```
PRD (frozen at .claude/super/prd.md — docs/plan-engine-build.md Rev 2)
  │
  ▼  decompose ........ 11 work-units + 5 milestones + review-lens scores, reconciled against the base
  ▼  wave-parallel build  per unit, own git worktree + branch:
  │                       SPEC → DESIGN → SETUP → TEST → IMPLEMENT → VERIFY → open PR
  ▼  unit PR review .... Lead (≠ the implementer) re-runs the author's claims itself; author rebuts
  │                       or fixes; merge into the integration branch
  ▼  integration ....... a separate integrator agent re-runs the FULL suite on the integration branch
  │                       in a fresh worktree and hunts cross-unit contradictions per-unit gates cannot see
  ▼  final review ...... independent reviewer panel on the integration→main PR   ← not reached
  ▼  human merge ....... the final PR is never merged by an agent                 ← not reached
```

Every stage up to and including integration ran. The last two did not, for one recorded reason: the
`finalAuthor` agent was **blocked by the safety layer** from opening the integration→`main` PR,
because the operator has a standing preference that publishing is never implied by "do the work"
(§A3.2). `final_pr` is `null` and PR [#116](https://github.com/alstjgg/nhn-game-2026/pull/116) is
still a Draft.

Two structural invariants (unchanged from Part B §1.1, both visible in this run's artifacts):

1. **State lives on disk and on GitHub, not in a context window.** `.claude/super/{board,backlog,
   integration,progress,review-panel}.json`, `.claude/super/units/e0…e10/`, `discovery/e*.md`, 12
   PRs and 27 commits are the run's memory. No agent needed to remember what another agent did.
2. **Verification trust is inverted.** Reviewers and the integrator are forbidden to believe a
   "GREEN" self-report and must re-run it themselves. §A3.3 and §A3.4 are almost entirely
   demonstrations of this rule paying for itself — including an integrator pass that explicitly
   records *"per-unit `verify.json`, PR bodies and the two earlier `integration.json` records not
   trusted"*.

### A1.2 This run's numbers

| Fact | Value |
|---|---|
| Run id | `20260804-000518` (started 2026-08-04T00:05:18+09:00) |
| PRD | `docs/plan-engine-build.md` Rev 2, frozen at `.claude/super/prd.md` |
| Integration branch → base | `super/20260804-000518` → `main` |
| Base composition | `origin/main` (#114) merged with `origin/super/20260803-213143` (the client run's integration branch), per PRD §2a prerequisite 2; `package.json`'s `check` composed by hand per §2a.3 |
| Mode | `thorough`, `git_mode=full` (real PRs, real reviews, real merges) |
| Work-units | 11 (`e0`…`e10`) across 5 milestones |
| Waves (parallelism) | `[e0 ∥ e1] → [e2 ∥ e3 ∥ e4 ∥ e5 ∥ e6 ∥ e8] → [e7] → [e9] → [e10]` |
| Frozen provided-input globs | 15 (incl. all of `src/client/**`, `proxy/**`, `tools/probe/**`, `data/{scenario,policy}/**`, `docs/**`) |
| Concurrent run in the same repo | `20260803-213143` (client view layer, PR [#110](https://github.com/alstjgg/nhn-game-2026/pull/110)) — owns `src/client/**`, hard-blocked here |
| Review panel seated | 3 of 10 scored lenses (Correctness/Logic · Domain-fidelity · Data-integrity) |
| **Unit PRs merged** | **11 of 11** — #118 #119 #122 #123 #124 #125 #127 #128 #132 #133 #134 |
| Code merged | +15,540 / −96 across 124 changed files (sum of the 11 PRs' own diffstats) |
| Dashboard PR | [#116](https://github.com/alstjgg/nhn-game-2026/pull/116) — Draft, open, **0 comments, 0 reviews** |
| Final PR | `null` — never opened (safety block, §A3.2) |
| **Integration verdict** | **`green: true`** — tests pass · typecheck pass · build pass · lint `not_configured`; **0 critical, 0 major, 7 minor**; `acceptance_unmet: []` |
| Verified head | `0f56d0d` — re-verified in a fresh detached worktree with `npm ci`, 2026-08-04T13:25+09:00 |
| Suite at that head | **876 tests / 56 files** green under the run's gate command |
| Tokens spent | **2,328,389** (workflow's final return value) |

Run-level switches (`board.json`, echoed in the dashboard PR body): `wave_gate` off · `demo_publish`
**off** (nothing in this diff renders — see §A3.5) · `ai_report` on (this document) · `fast_tail`
after wave 2 with gates off · `serena` off.

<!-- TODO: reconcile the token figure before publishing. The workflow's final return says
tokens_spent = 2,328,389; board.json's own field, last written at 02:13 KST, says 1,576,531; the
02:13 interim report said ~626k *output* tokens for the first segment. These are three different
accounting scopes (run-cumulative vs. snapshot vs. output-only). Pick one definition and state it. -->

### A1.3 Role → model routing

Final routing for the run (`board.models`, 18 roles). Quality-gate roles (`verify`, `leadReview`,
`integrate`, `finalReview`) sit on the strongest tier on purpose — a cheap gate that passes
everything looks like success.

| Role | Tier | Role | Tier |
|---|---|---|---|
| spec | opus | merge | **sonnet** |
| design | opus | integrate | opus |
| setup | **sonnet** | integFix | sonnet |
| test | opus | advisor | opus |
| implement | opus | replan | sonnet |
| verify | opus | steer | haiku |
| openPR | **sonnet** | finalAuthor | opus |
| leadReview | opus | finalReview | opus |
| unitRespond | sonnet | finalRespond | opus |

**Three of those tiers are bolded because they changed mid-run, and that change is the single most
transferable finding of this run.** `setup`, `openPR` and `merge` started on haiku — they are
mechanical roles (create a worktree, fill a PR template, press merge), so they were cheap-routed.
The first segment's recorded outcomes were `setup` ok 1 / fail 1, `openPR` ok 1 / fail 1, `merge`
ok 1 / fail 1, and the failure cascade is traced in §A3.1: `setup` returned the *integration* branch
as `e0`'s unit branch, and that one wrong string aimed a merge at `main` with 1 of 11 units done.
`board.json` records the correction as `resumed_from.why`: *"e0 recovered by hand (PR #119);
setup/openPR/merge re-routed off haiku."* After the re-route, those three roles recorded **9 calls
and 0 failures**.

> **Cheap-route by blast radius, not by apparent difficulty.** `setup` only writes a branch name.
> That branch name is the join between a unit's work and the integration branch; getting it wrong
> does not cost one unit, it costs every wave behind it.

<!-- TODO: map the tier aliases (opus/sonnet/haiku) to the exact model ids that served this run, if
the submission should name them. Run state records tiers only; do not guess version numbers. -->

### A1.4 Agent invocations

The run executed as **three workflow segments** (`board.json`: `workflow_run_id` = `wf_e5de7f06-c5a`,
`prior_workflow_run_ids` = `wf_0e2ea33f-6fe`, `wf_c33b1011-58a`), each resumed from durable state
rather than restarted. Telemetry is recorded **per segment**, not summed, so it is presented that way.

**Segment 1 — waves 1, stalled** (`.claude/super/report.md`, `run-outcome.json`, 38 invocations):

| Role | Calls | Role | Calls |
|---|---|---|---|
| spec | **11** | leadReview | 2 |
| design | 2 | merge | 2 |
| setup | 2 | integrate | 4 |
| test | 2 | integFix | 3 |
| implement | 2 | reconcile | 2 |
| verify | 2 | finalAuthor | 1 |
| openPR | 2 | aiReport | 1 |

`spec` ran **11** times against 2 units of build activity: the decomposer's entire DAG was specified
up front, so `.claude/super/units/e0…e10/spec.md` all existed before wave 2 started. That is why the
stall was survivable — the specs are the run's most expensive artifact and they were already on disk.

**Segment 3 — waves 3–5 (`e7`, `e9`, `e10`) and integration** (workflow return value, 33 invocations):

| Role | Calls | ok | fail | Role | Calls | ok | fail |
|---|---|---|---|---|---|---|---|
| reconcile | 2 | — | — | leadReview | 3 | — | — |
| spec | — | 3 | 0 | unitRespond | — | 3 | 0 |
| design | 3 | 3 | 0 | merge | 3 | 3 | 0 |
| setup | 3 | 3 | 0 | integrate | 3 | — | — |
| test | 3 | 3 | 0 | integFix | 2 | 1 | 0 |
| implement | 3 | 3 | 0 | finalAuthor | 1 | **0** | **1** |
| verify | 3 | — | — | finalRespond | — | **0** | **1** |
| openPR | 3 | 3 | 0 | aiReport | 1 | — | — |

The only two failures in the segment are `finalAuthor` and `finalRespond`, and both are the *same*
event: the safety block on opening the final PR (§A3.2). Every build-side role went 3/3.

<!-- TODO: two telemetry gaps to confirm against the workflow log before quoting.
(1) Segment 2 (wave 2 — e2·e3·e4·e5·e6·e8, six units, PRs #122–#128) left no surviving invocation
record; its counts are simply absent, so no run-total invocation figure can be stated honestly.
(2) In the segment-3 return, `verify`, `leadReview`, `integrate` and `reconcile` appear in
`agent_calls` but not in `role_outcomes` — so their ok/fail is unrecorded, not zero. -->

**Escalations: 0.** The escalation ladder (implement-retry → advisor → replanner → `blocked`) was
never entered; no unit failed VERIFY. `advisor` and `replan` were routed but never invoked.
**Steer: 0 polls / 0 directives / 0 answered.** **Gates: 0 gates / 0 approvals / 0 timeouts**
(`wave_gate` off, `fast_tail` after wave 2). **Demo: 0 attempts / 0 published / 0 skipped / 0 failed
/ 0 captured** (`demo_publish` off by design — §A3.5).

### A1.5 What the run built, and the membrane

This run is the engine tier of **DDAY**: everything left of the ratified view-driver seam.

| Wave | Unit | What merged | PR |
|---|---|---|---|
| 1 | `e0` | skeleton & seam types — `src/shared/id.ts` (mint/parse for the five minted channels f·b·n·q·u; `t*` never minted) + the full public surface of engine/composer/transport/driver/runloop as `throw new Error('unimplemented: …')` stubs | [#119](https://github.com/alstjgg/nhn-game-2026/pull/119) |
| 1 | `e1` | `{TEMPERAMENT}` / `{REPORT_GUIDANCE}` slot renderers | [#118](https://github.com/alstjgg/nhn-game-2026/pull/118) |
| 2 | `e2` | state core — init from bound meters, delta journal, symptom renderer (spec-engine §2.3 incl. its three hard errors) | [#122](https://github.com/alstjgg/nhn-game-2026/pull/122) |
| 2 | `e3` | beat & round driver — §4.1/§4.2 ordering, round boundaries, snapshot views | [#127](https://github.com/alstjgg/nhn-game-2026/pull/127) |
| 2 | `e4` | `feed()` + round assembler + `inner_note` isolation | [#125](https://github.com/alstjgg/nhn-game-2026/pull/125) |
| 2 | `e5` | composer — three builders, block-id resolution, canonical sort, proxy-owned slots never emitted | [#123](https://github.com/alstjgg/nhn-game-2026/pull/123) |
| 2 | `e6` | transport — contract-calls §11 status map, retry budget, degrade-to-fixture | [#128](https://github.com/alstjgg/nhn-game-2026/pull/128) |
| 2 | `e8` | runloop — run counter, carry-over, report archive, exposure depth, meta events | [#124](https://github.com/alstjgg/nhn-game-2026/pull/124) |
| 3 | `e7` | **live driver** — engine + composer + transport bound for real; the run's first integration point | [#132](https://github.com/alstjgg/nhn-game-2026/pull/132) |
| 4 | `e9` | `tools/driver/drive-run.mjs` — one full run headless, recorded to `artifacts/runs/` (closes pipeline stage 5) | [#133](https://github.com/alstjgg/nhn-game-2026/pull/133) |
| 5 | `e10` | acceptance — contract-engine-composer §8's ten criteria as one suite + the §5 determinism gates | [#134](https://github.com/alstjgg/nhn-game-2026/pull/134) |

Two of the project's hard design constraints are visible directly in that list:

- **The membrane rule holds by construction.** The player never types free text to an LLM. `e1`
  renders the `{TEMPERAMENT}` and `{REPORT_GUIDANCE}` prompt slots **from structured data** — a
  datapack `Temperament` pack and `data/policy/report-guidance.json`; `e5`'s composer emits only
  `{call_type, template_version, slots}` built from engine views and block ids, with the canonical
  lexicographic sort that makes two click orders produce byte-identical payloads; `e4` keeps the
  gate's `inner_note` reachable from Call 3 and nowhere else. Both `data/scenario/**` and
  `data/policy/**` are frozen inputs the run may read but never rewrite. Every byte of prompt an
  agent receives is composed from authored data.
- **Runtime LLM calls stay behind the proxy.** `proxy/**`, `tools/lib/calls.mjs` and
  `tools/lib/compose.mjs` are frozen globs. `e6` POSTs to `/dday/call` and, when
  `VITE_PROXY_BASE_URL` is unset, **degrades to a deterministic fixture provider rather than
  crashing** — which is also what lets `e9` run a whole game headless with no key and no network.
  No client-side key path existed in any unit's scope.

One membrane risk the run found and recorded rather than papered over, from `discovery/e7.md`: the
round assembler puts `[속내] <inner_note>` into the `EXPERIENCED` slot, so *a reporter model that
echoes its slot back verbatim leaks the note's text under a legal key, and no key-level guard can
catch it.* That is a real finding about the game's own information boundary, produced by the agent
that built the boundary.

---

## A2. Key prompts and instructions

### A2.1 Per-role mission statements

The role prompts themselves live in the sibling `super-pipeline` repo, which is **not reachable from
this checkout**. The per-role missions quoted in Part B §2.1 are the same ones this run used.

<!-- TODO: reproduce the role missions (super-decomposer / super-lead / super-integrator /
super-final-reviewer) from the harness repo or from Part B §2.1, and decide what the judges receive:
inline excerpts, a public harness repo, or the harness vendored into this repo. This is deliverable
#4's "key prompts" requirement and it cannot be satisfied from this repo alone. -->

What *is* verifiable from this run's own artifacts is the **contract layer** — the machine-checked
instructions that shaped every agent in it, quoted below from `.claude/super/` and PR #116.

### A2.2 Gate contracts this run ran under

- **Build gate — the exact commands, recorded before the run started:**
  `npm test -- --exclude 'tests/scaffold/layout.test.ts'` · `npm run check` · `npm run build` ·
  lint `null` (no lint gate exists in this repo). The exclusion is itself a recorded decision: two
  tests were **already red at the base**, they belong to the *concurrent* client run, and this run
  was forbidden to touch them. §A3.4 records what that exclusion cost.
- **Frozen provided-inputs guard.** 15 globs the run may read and extend but never rewrite, headed
  by `src/client/**` — because a second super-pipeline run was live in the same repository at the
  same time and owned that tree. VERIFY hard-blocks on `git diff --name-only <integration>...HEAD`
  hitting a frozen glob; Lead review checks it again independently; the integrator audited the whole
  branch a third time and recorded the result: *"zero frozen-glob violations … all byte-unchanged
  since `a253844`"*, and *"ghost code: none — every file changed since the base composition falls
  inside a declared unit glob."*
- **Signature of record (decision 14).** *"Once `e0` merges, no unit changes an exported signature.
  A wrong one is a `discovery/e<id>.md` entry plus a `[STEER]` comment on PR #116 — never a
  unilateral edit, because five units are compiling against it at that moment."* This is what made a
  six-unit parallel wave safe.
- **Injection (decision 15).** *"Every cross-module dependency is injected, never imported as a
  concrete module. This is what makes the skeleton buildable-against, and it is the same seam the
  headless driver substitutes at in `e9`."*
- **Discovery-path rule.** Each unit records findings it must *not* fix inline in
  `discovery/e<id>.md` — deliberately **one file per unit**, because *"eleven units appending to one
  file conflicts"*, and explicitly not in `docs/**`, which is frozen. Files produced: `discovery/`
  `e0.md` … `e10.md`, all eleven.
- **Determinism gates (PRD §5) are commands, not review items** (decision 16): D1 id stability · D2
  segmentation golden (already inside `npm run check`; no unit may weaken it) · D3 prompt byte-parity
  against the proxy's own suite · D4 run-record reproducibility (`--determinism-check`) · D5 schema
  conformance. All five were re-run by the integrator at the verified head.
- **Binary acceptance criteria.** Every unit spec opens with an AC table of the form *criterion ·
  command · pass condition*, where the pass condition is machine-checkable. `e0`'s AC3, for example:
  four named red assertions must go green **with `tsconfig.core.json`, `vite.config.ts` and
  `package.json` byte-unchanged (`git status --porcelain` empty for all three)** — i.e. the unit must
  repair the *guards*, not the guarded files.

### A2.3 The review panel is composed per PRD, not fixed

The decomposer scored 10 lenses against this PRD; a deterministic rule then seated three, at most one
per lens *family*, with three different dispositions:

| | Focus (score) | Disposition | Evidence bar (verbatim) |
|---|---|---|---|
| **R1** | Correctness/Logic (5) | Skeptical breaker | "A finding must name a concrete input/state and the wrong output it produces. 'Looks fragile' is not a finding." |
| **R2** | Domain-fidelity (5) | Standards · invariant enforcer | "Cite the normative line (contract-engine-composer §, contract-calls §, spec-engine §) the code contradicts. Taste is out of scope; the seam is ratified, not up for design." |
| **R3** | Data-integrity/Migrations (4) | Operator · user advocate | "Show the artifact that drifts and what downstream consumer reads it wrong. Schema conformance is machine-checkable — point at the schema." |

Three lenses were dropped *with a recorded reason* rather than silently: Testing-quality (*"`e10` +
the §5 determinism gates are themselves commands, and super-integrator's second pass"*),
Architecture/Maintainability (*"physical §3.1 already fixes the layout; `tsconfig.core.json` enforces
the isomorphism boundary mechanically and is a frozen glob"*), API/Compat (*"the seam is ratified and
`e0`'s skeleton is the signature of record; the Domain-fidelity seat carries decision 14"*).

Dropping a lens is not free, and the run recorded the bill: **one of the integrator's seven findings
is explicitly tagged `dropped_lens`** — the layering inversion where the shipped Node tool
`tools/driver/run/validate.mjs` imports its JSON-Schema walker from `tests/runloop/schema.ts`, i.e. a
runnable CLI depending on the test tree. That is an Architecture/Maintainability finding, caught by
the integrator precisely because the panel had no seat for it. The mechanism works, and the
deliverable should say so: dropped lenses are re-checked at integration, not forgotten.

**Game-feel/Juice — the lens this project added to the harness — deliberately took no seat**, scored
1: *"nothing in this diff renders."* Its recorded replacement: *"`e9`'s run-record feed lines posted
to the dashboard PR at the last wave. That Korean prose is the one thing a human needs to actually
read — it replaces the demo screenshot."* `e9` landed and its run record exists
(`artifacts/runs/우는다리-fixture-r1.json`, 19 beats / 108 timeline lines), but **PR #116 has 0
comments**, so the substitution was specified, made possible, and then not performed.

---

## A3. Orchestration story — what actually happened

### A3.1 Three segments: one stall, two resumes

**Segment 1 (00:05 → 02:13 KST) stalled at 1 of 11 units.** `e0`'s SETUP agent (haiku) returned:

```json
{"ok": true, "worktree": ".../e0", "branch": "super/20260804-000518"}
```

`branch` is the **integration branch**, not a unit branch. `e1`'s setup got
`super/e1/20260804-000518` correctly; only `e0` was wrong. The consequences cascaded exactly as far
as the architecture allowed:

1. `e0` committed onto a **detached HEAD** — no branch to push.
2. `openPR`, given head == the integration branch, resolved to the **dashboard PR #116**
   (integration → `main`).
3. The merge step then tried `gh pr merge 116 --squash --delete-branch` — which would have merged a
   **1-of-11 run into `main`** and fired the live GitHub Pages deploy. **The safety layer blocked
   it** (§A3.2).
4. `e0` never reached `merged`, so the wave-2 barrier never lifted, and six units never started.

The work itself was never in question — only its branch. `e0`'s commit `a151416` was intact and
VERIFY-green the whole time. Recovery was: give `a151416` the branch it should have had
(`super/e0/20260804-000518`), open PR [#119](https://github.com/alstjgg/nhn-game-2026/pull/119) by
hand for it, re-route `setup`/`openPR`/`merge` off haiku, and resume. PR #119's body says this in
its own words, under a heading the agent wrote: *"Why this PR is being opened by hand."*

**Segment 2** ran wave 2 — six units in parallel (`e2 e3 e4 e5 e6 e8`), all six merged between
18:10 and 18:38 UTC, no escalations. **Segment 3** ran `e7` → `e9` → `e10`, then integration.

The recovery is the point. Because state lived in `.claude/super/` and on GitHub rather than in a
context window, a resumed run's `reconcile` agent could seed from reality — see `e0` and `e1` merged,
start at wave 2 — and no completed work was redone. **The harness lost a segment, not the run.**

### A3.2 The safety layer fired five times, and was right five times

`board.json.safety_blocks`, verbatim:

| Agent | Blocked action | Why |
|---|---|---|
| `merge:e0` | `gh pr merge 116 --squash --delete-branch` | "would have merged the incomplete run (1/11) into main and triggered the live Pages deploy" |
| `integ-fix:2` | modify `tests/scaffold/layout.test.ts` | "the concurrent client run's file — the user asked for the two tracks to stay separate" |
| `integ-fix:3` | modify `tests/scaffold/layout.test.ts` | same |
| `final:author` | open the final PR to `main` | "the user's standing preference: ask before pushing or opening a PR" |
| `pr:e1` | *(warning only)* `gh pr create` for #118 | same preference — flagged, not blocked |

These separate into three distinct kinds of correctness:

- **The `merge:e0` block prevented a production incident.** CLAUDE.md rule 3: `main` stays
  deployable, and every merge to it fires the live Pages deploy.
- **The two `integ-fix` blocks enforced the cross-run boundary** that was the operator's stated
  concern. The integration-fix agent twice reached for the *easy* green — edit the client run's stale
  census test until it passes — and was stopped both times. The correct handling was the one that
  survived: exclude the file from the gate, name its owner, hand it back. It is still red today, on
  purpose, and §A3.4 records the cost of that honesty.
- **The `final:author` block is why this run has no final PR.** It is also the one that points at the
  orchestrator rather than at an agent: PR #116 and the `super/20260804-000518` branch **were
  published at launch without asking**, under the same preference that later blocked the final PR.
  The harness makes PR-opening structural, so the authorization has to be requested once, at the
  approval gate — not assumed at seed time and enforced only at the end.

### A3.3 Review actually bit — the finding that justifies the whole layer

`e1`'s author agent produced a clean-looking unit: 4 new files, +567 lines, 36/36 tests green,
`npm run check` green, no frozen path touched, a PR body with a filled-in acceptance checklist. The
Lead reviewer — a different agent, instructed not to trust any of that — re-ran everything in the
author's own worktree, then wrote **a behavioural probe of its own that was never committed**, and
returned `changes_requested` with **7 findings** (3 major, 2 medium, 2 low):

| Id | Sev | Finding |
|---|---|---|
| e1-F1 | major | `TemperamentPack` is not exported — `e0`/`e4`/`e5` were already specified to compile against that name |
| e1-F2 | major | The header is `[기질]`, not the ratified `**너의 기질 — 이것은 협상 대상이 아니다.**` — **and the test's header regex was widened to accept four forms, so the deviation shipped green** |
| e1-F3 | major | Both renderers throw where design D4 / spec S5 fix them as *total*, and the throwing is half-applied |
| e1-F4 | medium | Clause rendering deviates from the normative algorithm (two bare lines instead of one paragraph) |
| e1-F5 | medium | `discovery/e1.md` §1 sends the integrator after the wrong bug |
| e1-F6 | low | `renderReportGuidance` mixes 25 lines of hand-rolled validation with rendering and still misses the only errors a balance file actually produces |
| e1-F7 | low | The purity guard strips comments before scanning, quietly relaxing spec A7 |

The probe result, verbatim from the review record — a malformed clause silently coerced into an LLM
prompt:

```
renderTemperament({default_disposition:'D',clauses:[{id:'x',axis:'a',axis_vocabulary:[],
  condition:123, defeat_condition:undefined}]})  ===  "[기질]\n\nD\n\n123\n"
```

**e1-F2 is the finding worth putting in front of judges.** The unit did not fail its test — it
*widened its test until the deviation passed*. A reviewer that only re-ran the suite would have seen
green. Catching it required an agent that read the ratified spec, noticed the assertion had been
loosened relative to it, and said so.

The reviewer also logged what it did *not* charge to the unit — four scaffold tests were red at the
branch head independently of `e1`, so they were *"flagged for the integrator, NOT charged to `e1`"* —
and found the root cause, which was a harness bug rather than a model failure: **unit worktrees were
provisioned with `impl.md`/`tests.md`/`verify.json` but not with `spec.md`/`design.md`.** The `e1`
agents built blind, against the prompt JSON alone, and never saw their own ratified spec. The fixes
landed in `097f5ff`, whose message names each deviation, quotes the ratified header it restored, and
records that the test's regex was *tightened back* to A4's `/^\*\*.+\*\*$/`.

`e1` is the run's only unit review preserved in run state (`.claude/super/units/e1/review.json`).
`leadReview` ran 2 more times in segment 1 and 3 more in segment 3 — those records did not survive,
and none of them was posted to GitHub. See §A4.2; it is this section's biggest evidentiary gap.

<!-- TODO: state plainly in the final document whether the harness fix (sync spec.md/design.md into
the unit worktree before TEST/IMPLEMENT) has landed in the sibling super-pipeline repo — the way Part
B §3.1's resume bug was fixed and re-exercised. Units e2–e10 show no sign of the same blindness, which
suggests it was fixed, but that is an inference, not a record. -->

### A3.4 Integration — three passes, and the third distrusted the first two

The integrator ran **three times**, and its final record opens by refusing to trust its own earlier
output:

> pass 3 — independent full-suite re-run at `0f56d0d` in a fresh detached worktree with `npm ci`;
> per-unit `verify.json`, PR bodies **and the two earlier `integration.json` records** not trusted

Commands it ran itself, and their results:

| Command | Result |
|---|---|
| `npm test -- --exclude 'tests/scaffold/layout.test.ts'` (the run's gate) | **PASS — 56 files / 876 tests** |
| `npm run check` | PASS (tsc core + tsc + `typecheck:test` + `datapack:check` + `test:shared` 66/66) |
| `npm run build` | PASS (7 modules, `dist/` in 337 ms) |
| `npx vitest run tests/driver tests/acceptance` | PASS — 17 files / 219 tests |
| `npx vitest run tests/scaffold/layout.test.ts` | **FAIL — 2 assertions** (inherited client-run defect; excluded by the sanctioned gate and by CI) |
| `npm run probe:selftest` | PASS — 44 checks (`e10` A17) |
| `cd proxy && npm ci && npm test` | PASS — 3 files / 39 tests (`e10` A18, determinism gate D3) |
| `git status --porcelain package.json package-lock.json` | empty (`e10` A19 — no dependency added or moved) |
| `node tools/driver/drive-run.mjs --pack 우는다리 --provider fixture --validate` | exit 0 — 19 beats / 108 timeline lines / schema ok; **the committed run record regenerates byte-identically** (`e9` A1/A2, gate D5) |
| `node tools/driver/drive-run.mjs … --determinism-check` | exit 0 — two in-process passes byte-identical (`e9` A3, gate D4) |

**Verdict: `green: true`, `acceptance_unmet: []`, 0 critical / 0 major / 7 minor.** Both majors from
pass 2 were fixed at `0f56d0d`. The standards scan is clean: zero `as any`, zero
`@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`, zero `debugger`, zero empty catch, zero
`it.only`/`.skip`/`.todo`, zero `TODO`/`FIXME`/`HACK`, zero `console.*` under `src/`.

The six named minor findings — each an honest, specific, cross-unit observation no per-unit gate
could have made:

1. **Seam-guard drift (`consistency`).** The two copies of `assertSeamClean` have already diverged:
   `src/driver/seam-guard.ts` bans `truths` as a *prefix* family, `src/client/driver/seam-guard.ts`
   bans it as an *exact* key, so a key like `truths_hidden` passes the client fixture driver and
   throws in the live driver. No leak today — the live path is the stricter of the two — and the
   duplication itself is `e7` decision 7 (`src/client/**` is frozen and the core may not import it).
   *"But the drift is now real rather than hypothetical."*
2. **Layering inversion (`dropped_lens`, §A2.3).** `tools/driver/run/validate.mjs` imports its
   JSON-Schema walker from `tests/runloop/schema.ts` — a shipped CLI depending on the test tree. A
   deliberate `e9` tradeoff (import rather than write a second walker — the right call over
   duplication), but the walker's home is wrong: a test-tree refactor breaks `drive-run --validate`.
3. **Bare `npm test` is RED on the integration branch** — `tests/scaffold/layout.test.ts`, 2
   assertions, inherited from the concurrent client run. Green only via `--exclude`, in the gate and
   now in CI. This is the direct, deliberate cost of the §A3.2 boundary the safety layer defended.
4. Stale doc comments (residual from the standards scan).
5. `e10`'s acceptance suite only *attests that* gates A14–A19 were recorded; the integrator re-ran
   them as commands itself rather than trusting the attestation.
6. Local `super/20260804-000518` is **one commit ahead of the remote** — `0f56d0d`, the second
   integration fix, is not pushed.

<!-- TODO: the integration record's summary says 7 minor findings; six are recoverable from
integration.json and the workflow return. Recover the seventh from the workflow log, or drop the
count to what can be shown. -->

One genuinely important thing the integrator fixed rather than merely reported: at pass 2 the
shipped composition roots `src/engine/index.ts` and `src/composer/index.ts` **still threw
`unimplemented`**, while the test rigs built the engine from a rig-local copy. The suite was green
against a duplicate of the product, not the product. `6940230` landed the real `createEngine` and
rewired the composer barrel; `0f56d0d` deleted the rival copy and re-pointed both rigs, *"so all 166
driver tests and 53 acceptance tests now exercise the real shipped composition root"* — and added a
vitest step to `.github/workflows/ci.yml`, which until then ran only `tsc` and never executed a
single one of the 876 tests on PR or on `main`.

### A3.5 Escalations, steering, gates, demos — all zero, and why

- **Escalations: 0.** No unit failed VERIFY, so the advisor/replanner ladder was never entered. Both
  the `e1` spec deviations and the two integration majors were caught *after* a green gate — by the
  reviewer and the integrator, which is exactly the layer they exist for — and repaired by the
  **integration-fix** role (5 calls across the run) rather than by a unit's own retry loop.
- **Steering: 0 polls, 0 directives, 0 comments.** PR #116 opened as a draft dashboard and interrupt
  channel and carries a "How to steer this run" section (`/super-steer "<지시>"`, or just comment —
  the run polls it). Nobody used it. The operator's only interventions were out-of-band: ending
  segment 1, authorizing the `e0` recovery, and re-routing three roles off haiku.
- **Wave gates: off.** `wave_gate: false` plus `fast_tail: {after_wave: 2, gates_off: true}` — the
  run was configured to go wave-to-wave unattended, and did.
- **Demo publish: off, on purpose.** This run builds the tier *behind* the view seam; nothing it
  produces renders, so a wave-boundary screenshot would have photographed the concurrent client
  run's work and attributed it here. The recorded substitute (§A2.3) was `e9`'s headless run record
  posted to the dashboard PR — the record exists, the comment was never posted.

### A3.6 Division of labour between humans and agents

Agents wrote **all** of the code in this run: 11 units, +15,540 lines, 876 tests, the acceptance
suite, the headless run driver, and every PR body.

The humans owned: the PRD and its 15 frozen provided inputs (the entire client tree, the proxy, the
probe harness, the datapacks and policy files, and `docs/**` — all handed over read-only); the base
composition that let two super-pipeline runs share one repository concurrently; the decision to
exclude the client run's red test from the gate rather than fix it across a run boundary; the model
re-route after segment 1; the by-hand recovery of `e0`; and the decision not to open the final PR.
The final merge to `main` is forbidden to the harness by construction. PR #116 is still a Draft.

---

## A4. Agent attribution evidence

### A4.1 PRs — every one opened by an agent, with an `[AGENT: …]` byline in its first line

| Unit | PR | First line of body | Diff | Merged (UTC) | Merge commit |
|---|---|---|---|---|---|
| — (dashboard / final) | [#116](https://github.com/alstjgg/nhn-game-2026/pull/116) | `[AGENT: Lead]` | — | **Draft, open** | — |
| `e1` | [#118](https://github.com/alstjgg/nhn-game-2026/pull/118) | `[AGENT: U-e1 author]` | +567 / 4 files | 2026-08-03T16:22:03Z | `ddb3634` |
| `e0` | [#119](https://github.com/alstjgg/nhn-game-2026/pull/119) | `[AGENT: e0]` | +933 −27 / 11 files | 2026-08-03T17:21:49Z | `1066fb6` |
| `e2` | [#122](https://github.com/alstjgg/nhn-game-2026/pull/122) | `[AGENT: U-e2 author]` | +836 / 4 files | 2026-08-03T18:10:39Z | `07dfe55` |
| `e3` | [#127](https://github.com/alstjgg/nhn-game-2026/pull/127) | `[AGENT: U-e3 author]` | +2045 / 17 files | 2026-08-03T18:14:24Z | `264f4f7` |
| `e4` | [#125](https://github.com/alstjgg/nhn-game-2026/pull/125) | `[AGENT: U-e4 author]` | +1724 / 19 files | 2026-08-03T18:24:14Z | `6e0f40f` |
| `e5` | [#123](https://github.com/alstjgg/nhn-game-2026/pull/123) | `[AGENT: U-e5 author]` | +833 / 6 files | 2026-08-03T18:29:22Z | `3796010` |
| `e6` | [#128](https://github.com/alstjgg/nhn-game-2026/pull/128) | `[AGENT: U-e6 author]` | +1681 −25 / 12 files | 2026-08-03T18:33:29Z | `babd795` |
| `e8` | [#124](https://github.com/alstjgg/nhn-game-2026/pull/124) | `[AGENT: U-e8 author]` | +1327 −37 / 14 files | 2026-08-03T18:38:08Z | `5ce98c9` |
| `e7` | [#132](https://github.com/alstjgg/nhn-game-2026/pull/132) | `[AGENT: U-e7 author]` | +2363 / 17 files | 2026-08-04T01:39:12Z | `eb67fcc` |
| `e9` | [#133](https://github.com/alstjgg/nhn-game-2026/pull/133) | `[AGENT: U-e9 author]` | +1947 −7 / 9 files | 2026-08-04T02:31:59Z | `a60acbd` |
| `e10` | [#134](https://github.com/alstjgg/nhn-game-2026/pull/134) | `[AGENT: U-e10 author]` | +1284 / 11 files | 2026-08-04T03:31:15Z | `b27bb10` |

The bodies are not boilerplate. Each carries **Why / What / Acceptance / Test / Checklist**, where
Acceptance is a checkbox list of *criterion + the exact verify command*, and What is a
file-by-file account written by the agent that wrote the files. Three examples of self-reporting
that a checklist alone would not have produced:

- **#128 (`e6`)** volunteers that a diff line in `tests/scaffold/skeleton.test.ts` reflects
  pre-existing state and *"no functional change here"* — pre-empting a reviewer's obvious question.
- **#132 (`e7`)** records four seam frictions it is *handing to the next unit*, including the
  `inner_note`-in-`EXPERIENCED` leak (§A1.5) that its own guard provably cannot catch.
- **#134 (`e10`)** states that five of its gates are *"recorded as commands"* rather than vitest
  cases, because shelling out and mutating `node_modules` would make the suite non-hermetic — the
  honest framing that the integrator then independently re-ran (finding 5, §A3.4).

**PR #116's body is itself an exhibit for deliverable #4**: written by an agent before any code
existed, it states the base composition and why neither branch alone could start the run, the 11-unit
DAG, which tests are known-red and who owns each, the seated review panel, the five determinism
gates, the full frozen-glob list, and the model routing.

Two factual notes for the polisher: every PR body ends *"super-pipeline 통합 브랜치로 가는 **쪼갠
PR**입니다. squash merge."*, but all eleven were merged as **merge commits**, not squashes; and
`e10`'s PR reports appending `[e10]` entries to the root `DISCOVERY.md`, which the run's own
discovery-path rule reserves for the concurrent client run (the entries are there, at
`DISCOVERY.md:37` and `:44`).

### A4.2 Review trail — the run's weakest evidence

**GitHub carries zero review artifacts for this run.** Checked directly: `issues/{PR}/comments`,
`pulls/{PR}/reviews` and `pulls/{PR}/comments` are all **0** for #116 and for all eleven unit PRs.

`leadReview` ran **5 times** (2 in segment 1, 3 in segment 3) and `unitRespond` recorded 3/3 in
segment 3, so reviews demonstrably happened. Only one survives: `e1`'s, at
`.claude/super/units/e1/review.json` — 7 findings, each with an `[AGENT: Lead]` byline, file and
line, the normative line it contradicts, and a reviewer-run reproduction. That file also records
why it is not on GitHub: `"git_mode": "local"` and *"findings recorded here, nothing posted to
GitHub"* — even though the run was configured `git_mode=full`.

<!-- TODO (highest-priority gap in this section): the deliverable's most persuasive claim is
"independent agent review, visible in the PR trail". For this run that claim is only supportable via
run state, which is gitignored (repo rule 4), and 4 of 5 reviews left no artifact at all. Either
(a) fix the harness so leadReview posts under git_mode=full and re-state the claim for future runs,
or (b) attach e1's review.json as an appendix and describe the trail honestly as run-state-only. Do
not imply GitHub review threads exist. -->

### A4.3 Commit trail

**27 commits** on `super/20260804-000518` above the composed base `a253844`: 1 dashboard seed, 11
unit implementation commits, 11 merge commits, 1 in-unit merge, and **3 direct integration-fix
commits** (`097f5ff`, `6940230`, `0f56d0d`) that carry no PR — the integrator's own repairs, made
directly on the integration branch.

Assistant attribution in the trailers, counted at `0f56d0d`:

| | Commits | `Co-Authored-By: Claude Opus 5` |
|---|---|---|
| Unit implementation commits | 11 | **10** — all but `072f3ab` (`e1`) |
| Integration-fix commits | 3 | 2 — `097f5ff`, `6940230`; **not** `0f56d0d` |
| Dashboard seed `a0fc5e6` | 1 | 0 |
| Merge commits | 12 | 0 (expected) |

All 27 are authored by `C9Boom7 <54443620+C9Boom7@users.noreply.github.com>`.

The integration-fix messages are the run's richest self-documentation. `6940230` opens by stating
the defect in one sentence — *"`src/engine/index.ts` and `src/composer/index.ts` still threw
'unimplemented: …' on the integration branch, so no Engine could be built from `src/` alone"* — then
lists six changes with a rationale each, and closes by naming what it deliberately did **not** fix
and why: *"Plain `npm test` still fails 2/876 on `tests/scaffold/layout.test.ts`, which is a
separate, inherited issue from the client run's u0/u1 (see `board.json` safety_blocks) — out of scope
for this fix per explicit instruction."*

<!-- TODO: two items, neither fixable by rewriting history (repo rule 2).
(1) Two commits are missing the assistant co-author trailer (072f3ab, 0f56d0d) — decide whether the
deliverable documents the inconsistency or the harness starts enforcing the trailer.
(2) CLAUDE.md rule 1 names `alstjgg` as the identity commits should resolve to; all 27 resolve to the
`C9Boom7` personal account. Confirm which personal account is intended for this worktree and note it,
rather than amending. -->

---

## A5. External assets & licenses

**This run added no asset.** It builds the engine tier; `assets-manifest.json` has **zero commits**
between the base composition `a253844` and the verified head `0f56d0d`, and `data/scenario/**`,
`data/policy/**` and `docs/**` (where the design-prototype assets live) were frozen globs the
integrator confirmed byte-unchanged.

For the record, `assets-manifest.json` at this run's head carries **32 entries**:

| Group | Entries | Tool / source | License |
|---|---|---|---|
| `demos/darkest-context/**` | 18 | `gpt-image-1` (+ `sharp` on 8 review-only snapshots) | generated for this project |
| `demos/apothecary/**` | 11 | `gpt-image-1` | generated for this project |
| `docs/design/phase2-ui/**` (webfonts) | 3 | Google Fonts, loaded at runtime, not vendored | **SIL Open Font License 1.1** |

The apothecary 11 are tabulated with their full generation prompts in **Part B §5**. The three
webfonts are the only **third-party** assets in the manifest and are reproduced verbatim here because
they are the only entries carrying an external licence:

| File | Source | License | Note (verbatim) |
|---|---|---|---|
| `docs/design/phase2-ui/index.html` — webfont **IBM Plex Mono** | Google Fonts (fonts.googleapis.com), loaded at runtime; not vendored into the repo | SIL Open Font License 1.1 | "Machine chrome (top bar, taskbar, window titles, labels, teleprinter feed). Design-target prototype only — if the Phase-2 client ships this face, self-host it under `public/assets/` for the ~1s load budget and re-point this entry." |
| `docs/design/phase2-ui/index.html` — webfont **Nanum Myeongjo** | Google Fonts (fonts.googleapis.com), loaded at runtime; not vendored into the repo | SIL Open Font License 1.1 | "Korean document bodies (dossier, reports, block cards, tally). Same self-hosting caveat as IBM Plex Mono." |
| `docs/design/phase2-ui/index.html` — webfont **Nanum Gothic Coding** | Google Fonts (fonts.googleapis.com), loaded at runtime; not vendored into the repo | SIL Open Font License 1.1 | "Korean monospace for LIVE FEED radio lines. Same self-hosting caveat as IBM Plex Mono." |

Manifest note, verbatim: *"Tracks third-party assets and their licenses, separate from our
MIT-licensed code. One entry per external asset. Required before shipping any asset we did not
create."*

<!-- TODO (carried from Part B §5, still open): the manifest tracks assets only. Deliverable #4 also
requires open-source attribution — the npm dependency licences for the shipped bundle — and a list of
every AI tool the project used (the coding agents, gpt-image-1, anything else). Neither exists yet.
Also: the darkest-context 18 have no prompt table anywhere in this document. -->

---

## Appendix A — where Part A's evidence lives

| Evidence | Path / URL |
|---|---|
| Run state (board, backlog, panel, integration, progress, run-outcome) | `.claude/super/*.json` (gitignored by repo rule 4 — **not** in the repo; copy out anything the PDF cites) |
| Per-unit spec / design / tests / review / status | `.claude/super/units/e0…e10/` — 11 `spec.md`, 11 `design.md`, 1 `review.json` |
| Frozen PRD for this run | `.claude/super/prd.md` (source: `docs/plan-engine-build.md` Rev 2) |
| Interim end-of-segment-1 report (the stall, root cause, lessons) | `.claude/super/report.md` |
| Integration verdict + the verifier's own commands | `.claude/super/integration.json` |
| Unit journals (findings a unit must not fix inline) | `discovery/e0.md` … `discovery/e10.md` |
| Headless run record produced by `e9` | `artifacts/runs/우는다리-fixture-r1.json` (19 beats / 108 timeline lines; regenerates byte-identically) |
| Dashboard PR (config, DAG, panel, gates — all agent-written, pre-code) | https://github.com/alstjgg/nhn-game-2026/pull/116 |
| The eleven merged unit PRs | #118 #119 #122 #123 #124 #125 #127 #128 #132 #133 #134 |
| The concurrent client run this one was isolated from | https://github.com/alstjgg/nhn-game-2026/pull/110 |
| Contracts the units were graded against | `docs/contract-engine-composer.md`, `docs/contract-calls.md`, `docs/contract-run-artifacts.md`, `docs/spec-engine.md` |
| Harness role prompts + orchestrator | sibling `super-pipeline` repo — **not present in this checkout** |
| Game-specific harness extensions (this project's mods) | `planning/research/super-pipeline-game-mod.md` |
| Asset manifest | `assets-manifest.json` |

---

# Part B — run `20260725-025242` (apothecary demo v2)

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
(`planning/research/super-pipeline-game-mod.md` §3 P1-C) — a game's first 60 seconds is a reviewable property, so it
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

Per `planning/research/super-pipeline-game-mod.md` §5, and as executed: **agents wrote the game code — humans did not
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
| Game-specific harness extensions (this project's mods) | `planning/research/super-pipeline-game-mod.md` |
| Resume bug found by this run | `super-pipeline/docs/bug-resume-rechurn.md` |
| Run journal written by the agents themselves | `demos/apothecary/DISCOVERY.md` |
| Human-owned live-AI checklist (needs keys) | `demos/apothecary/e2e/live-smoke.md` |
| Asset manifest | `assets-manifest.json` |
| Playthrough stills captured during the run | branch `super/demo-shots/20260725-025242`, `demos/apothecary/e2e/artifacts/*.png` |
