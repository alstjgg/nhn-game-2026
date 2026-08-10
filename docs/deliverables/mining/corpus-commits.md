# Corpus manifest — commit history of `main`

Purpose: inventory of the commit corpus for the documentation-mining effort (AI-orchestration story extraction happens later; this file is inventory only).

Snapshot: main @ 5a3c388, 2026-08-04. Sweep marker for incremental updates: commits after 5a3c388 are unswept.

## 1. Overall shape

| View | Commits | Merge commits | Non-merge commits | First commit | Last commit |
|---|---|---|---|---|---|
| Full log (`git log 5a3c388`, incl. merged-branch commits) | 153 | 29 | 124 | 2026-07-20 21:32 (`d0d057d`) | 2026-08-04 17:13 (`5a3c388`) |
| First-parent view of main (`--first-parent`) | 65 | 24 | 41 | same | same |

- Of the 41 first-parent non-merge commits, 27 carry a `(#N)` suffix, i.e. they are GitHub squash-merges of PRs; 14 landed on main without a PR number in the subject.
- The 5 merge commits visible only in the full log are in-branch `Merge branch 'main' into ...` / `Merge origin/main ...` sync merges.

## 2. Authorship

Author identities (full log):

| Count | Author |
|---|---|
| 60 | C9Boom7 `<54443620+C9Boom7@users.noreply.github.com>` |
| 52 | MinSeo Park `<26458319+alstjgg@users.noreply.github.com>` |
| 39 | MinSeo Park `<13579wkd@naver.com>` |
| 2 | MinSeo Park `<alstjgg@users.noreply.github.com>` |

Committer identities (full log):

| Count | Committer |
|---|---|
| 62 | GitHub `<noreply@github.com>` (web-UI squash/merge) |
| 52 | MinSeo Park `<26458319+alstjgg@users.noreply.github.com>` |
| 37 | C9Boom7 `<54443620+C9Boom7@users.noreply.github.com>` |
| 2 | MinSeo Park `<alstjgg@users.noreply.github.com>` |

Corporate-email flag: **none found** — no corporate-domain addresses appear as author or committer. Notes for the record:

- MinSeo Park uses three distinct identities: the `alstjgg` GitHub noreply address in two forms, plus a personal `13579wkd@naver.com` address (39 commits, spanning 2026-07-21 → 2026-08-03). Personal, not corporate, but not the `alstjgg` noreply form the repo rule names.
- `C9Boom7` is the second personal GitHub account (team member B), also a noreply address.

## 3. AI attribution markers

- `[AGENT` markers in commit subjects/bodies: **0** (that marker convention lives on PRs, not commits).
- Commits with any AI co-author trailer: **120 of 153** (78%). Breakdown: 116 with a `Co-Authored-By: Claude *`, 5 with `Co-Authored-By: Codex <noreply@openai.com>`, 1 commit has both (`edafc86`).
- First-parent view: 39 of 65 commits carry an AI co-author trailer.
- Trailer spelling: `Co-Authored-By:` (82 occurrences) vs GitHub-squash spelling `Co-authored-by:` (69 occurrences). No other systematic trailer keys found (`docs:` shows up 14 times in trailer parsing but is body text, not a real trailer).

Per Claude-model variant (commits; no commit names two different Claude models, so these sum to 116):

| Count | Trailer identity |
|---|---|
| 47 | `Claude Fable 5 <noreply@anthropic.com>` |
| 28 | `Claude Opus 5 <noreply@anthropic.com>` |
| 16 | `Claude Opus 4.8 <noreply@anthropic.com>` |
| 12 | `Claude Opus 5 (1M context) <noreply@anthropic.com>` |
| 11 | `Claude Opus 4.8 (1M context) <noreply@anthropic.com>` |
| 2 | `Claude Sonnet 5 <noreply@anthropic.com>` |

Other co-author trailers seen:

| Count | Trailer identity | Note |
|---|---|---|
| 27 | `MinSeo Park <26458319+alstjgg@users.noreply.github.com>` | human co-author added by GitHub squash |
| 5 | `Codex <noreply@openai.com>` | OpenAI Codex-attributed commits (asset/tooling work, 07-23 → 07-25) |
| 2 | `Claude Agent <agent@example.com>` | placeholder identity, on `179fcf1` and `783246e` |
| 1 | `USER <user@[machine-local]>` | unconfigured machine-local placeholder |

## 4. Message conventions

Conventional-commit prefixes (full log; 29 `Merge ...` subjects excluded):

| Count | Prefix |
|---|---|
| 72 | `docs` |
| 17 | `feat` |
| 6 | `fix` |
| 6 | `chore` |
| 3 | `ci` |
| 1 | `test` |
| 1 | `refactor` |
| 11 | `[uN]` / `[run-...]` bracket-tagged (see below) |
| 4 | free-form (no prefix): `d0d057d`, `72f996e`, `383db23`, `2d5ea5d` |

Top scopes: `docs(dday)` 14, `docs(dday-client)` 5, `feat(darkest-context)` 4, `feat(apothecary)` 4, `docs(spec)` 4, `docs(darkest-context)` 4, `fix(proxy)` 3, `docs(apothecary)` 3. Two subject styles coexist: `type(scope): subject` (58) and `type(scope) — subject` (27, em-dash, dominant from 07-29 onward). 23 subjects contain Korean text.

Run-structured patterns (super-pipeline):

| Pattern | Count | Examples |
|---|---|---|
| `[uN]` unit-PR squash commits | 11 | `[u1]`…`[u9]` (u2/u3/u5 appear twice — resumed pipeline) |
| `[run-YYYYMMDD-HHMMSS]` final run merges | 2 | `9351e86`, `783246e` |
| `chore: super-pipeline run-... 시작 (대시보드 PR 시드)` | 1 | `6c786e9` |
| `IMPLEMENT (green)` phase tag | 1 | `98448be` |
| `DISCOVERY` in subject | 1 | `39555a0` |
| `VERIFY attempt N` | 0 | (present in later un-merged run branches, none on main @ 5a3c388) |
| scope-embedded unit id | 1 | `e924be1` `fix(apothecary/u3)` |

## 5. Chronological phase map

Commits per day (full log; first-parent in parentheses). Notes inferred from messages only.

| Date | Commits (fp) | Dominant activity |
|---|---|---|
| 2026-07-20 | 2 (2) | Repo genesis: Vite+TS scaffold, Pages deploy, first concept doc (Agent Ascension) |
| 2026-07-21 | 8 (2) | Competition requirements, CLAUDE.md, paper-prototype protocol/report, concept rewrite |
| 2026-07-22 | 20 (6) | Concept-doc template sweep (apothecary/doodle/blacksmith/placement/autobattler), meeting notes, CLAUDE.md↔status.md split |
| 2026-07-23 | 8 (4) | Concept consolidation (blacksmith→apothecary), apothecary demo PRD, Doodle Life replacement |
| 2026-07-24 | 23 (7) | First super-pipeline run: apothecary demo units u1–u9 built and merged; PRD v2 drafts |
| 2026-07-25 | 26 (17) | Asset-pack generators + live-AI seams (apothecary, darkest-context), Pages subpath CI, LLM backend/handoff docs |
| 2026-07-26 | 1 (1) | Apothecary v2 run final merge (live-AI seam) |
| 2026-07-27 | 1 (1) | Darkest Context playable demo run final merge |
| 2026-07-28 | 1 (1) | Apothecary dialogue Lambda deploy |
| 2026-07-29 | 5 (5) | Pivot to D-Day: concept + paper tests v1·v2, planning/ restructure, field-report concept, 정식 기획서 |
| 2026-07-30 | 2 (2) | D-Day architecture spec + first mechanism measurement (judgment schema flattening, breaking) |
| 2026-07-31 | 4 (4) | Mechanism deep-test verdict: C-BLOCK 채택 · C-STRUCT 중단, meeting notes, consolidation |
| 2026-08-01 | 3 (3) | LLM call contract v1 + harness, architecture spec v1, pipeline 3-track / phase-transition docs |
| 2026-08-02 | 11 (4) | Engine spec v0, root scaffold + module boundaries, data pipeline P0, docs renamed to spec/contract/plan scheme, Korean→English translation |
| 2026-08-03 | 31 (5) | Client-track spec/PRD sprint, structure refactor (dissolve infra/, proxy to root), engine-build PRD, proxy CI gate |
| 2026-08-04 | 7 (1) | Proxy deploy: SAM bootstrap, OIDC deploy from Actions, first real Bedrock calls, latency-budget correction |

## 6. Notable one-offs (identification only)

| SHA | Subject (verbatim, truncated) |
|---|---|
| `d0d057d` | Initial scaffold: Vite + TS placeholder, Pages deploy, docs |
| `edafc86` | docs: replace Doodle Lab concept with Doodle Life — whole-concept replacement, 302 deletions, Codex co-authored |
| `98448be` | [u2] IMPLEMENT (green): verify pure-TS phase FSM — resumed pipeline, no new code (#24) — second u2 commit |
| `e924be1` | fix(apothecary/u3): validate dialogueNodes/observationClues elements — post-run direct fix |
| `9351e86` | [run-20260725-025242] Add live-AI generation seam to the apothecary demo (v2) (#33) — run redo labelled v2; body records reverted changes |
| `783246e` | [run-20260726-075042] Ship the Darkest Context playable demo (#84) — carries placeholder `Claude Agent <agent@example.com>` trailer |
| `179fcf1` | feat(llm): deploy Apothecary dialogue Lambda (#81) — 558 deletions; same placeholder trailer |
| `8f93da5` | chore(planning-restructure) — 기획 잔재... (#87) (#88) — double PR reference in subject |
| `4be6cf8` | test(dday) — 메커니즘 첫 실측 · judgment 스키마 평탄화(breaking) — explicit breaking marker |
| `9ddf731` | docs(dday) — translate the Korean-bodied docs to agent-facing English — largest deletion (812 lines), doc-language flip |
| `b5bd1c3` | refactor(structure) — dissolve infra/, move the proxy to the root, own the prompts |
| `c00ed1a` | ci — apothecary workflow is manual-only, and points at the archive — demo decommissioned from auto-deploy |
| `cee7060` | feat — land the pack-copy plugin; let an unpeopled beat and a local origin through — gate loosening |
| `08ccc73` | fix(proxy) — the bundle smoke has been asserting a stub's 501 since the routes landed — long-silent test gap |
| `47e119e` | docs — the proxy has made real Bedrock calls, and the latency budget was wrong — self-correction of an earlier estimate |

No `revert`-subject commits and no explicit live-site hotfix commits exist in this range.

---

## Incremental sweep — implementation phase

Snapshot: **main @ 8b7651f, 2026-08-10** (previous sweep marker `5a3c388`, 2026-08-04). Range: `5a3c388..origin/main`. This section covers only the new commits; the section above is unchanged.

### 1. Overall shape

| View | Commits | Merge commits | Non-merge commits | First commit (commit date) | Last commit |
|---|---|---|---|---|---|
| Full log (`git log 5a3c388..origin/main`, incl. merged-branch commits) | 522 | 161 | 361 | 2026-08-03 21:57 | 2026-08-10 18:28 (`8b7651f`) |
| First-parent view of main (`--first-parent`) | 88 | ~85 | ~3 | same | same |

- The first-parent view is now almost entirely GitHub PR-merge commits: of 161 merges, **118 are `Merge pull request`** (squash/merge via web UI), plus 10 `Merge branch`, 11 `Merge remote`, 2 `Merge origin` (in-branch sync merges). The workflow shifted decisively to one-PR-per-change.
- PR numbers run to #235; the range spans roughly PR #110 → #235.
- First-parent earliest commit-date (2026-08-03) predates the `5a3c388` snapshot time (2026-08-04 17:13) because branches created earlier were merged into main after the snapshot.

### 2. Authorship

Author identities (full log):

| Count | Author |
|---|---|
| 297 | MinSeo Park `<26458319+alstjgg@users.noreply.github.com>` |
| 139 | C9Boom7 `<54443620+C9Boom7@users.noreply.github.com>` |
| 83 | MinSeo Park `<13579wkd@naver.com>` |
| 3 | MinSeo Park `<yeahimpark@gmail.com>` |

Committer identities (full log): 296 `26458319+alstjgg` noreply · 118 GitHub `<noreply@github.com>` · 106 C9Boom7 · 2 `yeahimpark@gmail.com`.

Corporate-email flag: **none found** — no corporate-domain address as author or committer.

- **NEW identity this sweep:** `MinSeo Park <yeahimpark@gmail.com>` (3 commits: `b5109e6`, `0f2a087`, `19e6a5e`, all 2026-08-04, discovery-consolidation / debug-pane work). Personal Gmail, **not corporate** — but it is a fourth MinSeo Park identity and **not** the `alstjgg` noreply form the repo rule names. Flag for the record.
- The `alstjgg` noreply form (`26458319+alstjgg@…`) is now dominant (297). The `13579wkd@naver.com` personal address continues (83). The bare `alstjgg@users.noreply.github.com` form seen in the prior sweep does not recur here.

### 3. AI attribution & model variants

- Commits carrying any Claude/Anthropic co-author trailer: **317 of 522** (61%). No non-Claude AI trailers (no Codex/OpenAI) appear in this range. No human co-author trailers appear (the GitHub-squash human-co-author habit dropped off).
- First-parent view: ~0 trailers — first-parent commits are PR-merge commits; trailers live in the squashed non-merge commits.
- `[AGENT` markers in commit subjects/bodies: **0** (unchanged convention — that marker lives on PRs).

Per Claude-model variant (per-commit, deduped; sums to 317):

| Count | Trailer identity |
|---|---|
| 137 | `Claude Opus 5 <noreply@anthropic.com>` |
| 116 | `Claude Opus 5 (1M context) <noreply@anthropic.com>` |
| 61 | `Claude Fable 5 <noreply@anthropic.com>` |
| 3 | `Claude Sonnet 5 <noreply@anthropic.com>` |

- The implementation phase consolidated onto the **Opus 5 family** (Opus 5 + its 1M-context variant = 253 of 317, 80%), with Fable 5 the secondary. The `Opus 4.8` and `Opus 4.8 (1M)` variants from the prior sweep **do not appear** — the fleet moved up a model generation.

### 4. AI-process markers (super-pipeline)

| Marker | Occurrences (full messages) | Note |
|---|---|---|
| `DISCOVERY` | 19 | `docs(discovery):` consolidation + per-unit verify notes; `DISCOVERY.md` protocol |
| `VERIFY` | 10 | of which `VERIFY attempt N` = 7 (`attempt 1`/`attempt 2` retry loops) |
| `[u…]` unit references | 94 (bodies) / 3 (subjects) | subjects: `[u2]`,`[u3]`,`[u10]`; bodies cross-cite units like `[u2#c9](p)` in review/discovery text |
| `run-2026…` run-id stamps | 4 | two runs: `run-20260803-213143`, `run-20260804-000518` (seed chore + branches) |
| `[run-…]` bracketed | 2 | final-run merge subjects |
| `STEER` | 2 | steer injections |
| `[AGENT` | 0 | — |
| `IMPLEMENT (green)` | 0 | phase tag not used in this range |

- Two super-pipeline runs land here (`super/20260803-213143` via PR #110, `super/20260804-000518` via PR #116), each with unit/extension sub-branches (`-u4s`, `-u7`, `-u8`, `-u11`, `-e7`, `-e9`, `-e10`) and a `review-fix/fix2/…` branch — the decompose → parallel-worktree → review-panel → loop-until-green shape is visible in the branch names.
- 3 revert commits (`f9b1638`, `8308a30`, `45d69ee`) — scenario/pack/tooling rollbacks, evidence of the verify loop catching regressions.

### 5. Implementation narrative (prose)

This sweep is the phase transition from planning/spec to **building and hardening the selected game, DDAY**. The two super-pipeline runs (Aug 3–5) stand up the engine: the tally/scorer, live-run driver wiring, and the DDAY report/feed surface. From Aug 6 onward the corpus becomes a dense **playtest-and-fix stream** — `playtest(gN-…)` / `playtest(wN)` / `playtest(U5.x)` waves (48 `playtest:` non-merge commits) iterating the desk chrome (two-column REPORTS/feed/AGENT-FILE layout, the `x1`–`x10` UI passes), the reveal-queue/feed pacing, the DEPLOY commit gesture, and audio (BGM room tone, radio cues, silent-wait-loop fixes). A distinct **prompt/scenario track** (Korean-bodied `feat/fix/docs(scenario)` and `fix(prompts)`) authors graph-first scenario packs (멈춘회전문, 전구간정상, 자유주제 cable-car collapse) and tunes the agent's default prompt, roster rules, and 해라체 register — the membrane-safe LLM input. A **proxy/live-AI track** splits default prompts per-pack, wires `bindLiveRun`, and guards build-vs-live-feed and the answer-key-in-published-pack deploy hazard. Threaded through is a **deliverables-mining track** (`docs(deliverables)` Phase 2/3 theme induction, `deliverables/mining` PR #217) — the effort this manifest feeds. Peak activity: 2026-08-08 (172 commits) during the playtest waves.

