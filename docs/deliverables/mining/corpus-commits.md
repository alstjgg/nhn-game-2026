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

Corporate-email flag: **none found** — no `linecorp.com` (or other corporate-domain) addresses appear as author or committer. Notes for the record:

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
| 1 | `USER <user@AL02375929.local>` | machine-local placeholder |

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
