# Phase 2 · Pass A — theme induction sharded BY SLICE

> **Executed 2026-08-05.** Output: `theme-map-passA.md` — 141 candidate themes folded
> to 66, all 905 atoms read in full. This brief is kept as the record of what Pass A
> was told, so its wording is deliberately *not* updated after the fact. Two things in
> it are known to be stale: the track no longer runs in the `../nhn-game-2026-deliverables`
> worktree (it is a branch in the main checkout), and its claim that PRs #110/#116 are
> absent from the atoms is wrong for S9b — Pass A caught this itself and says so in its
> own header. Also standing for any re-run: CLAUDE.md hard rule 1 — a session may run on
> a corporate AI subscription, but no corporate identifier may appear in anything written.

You are running **Pass A** of Phase 2 of the deliverable-mining track. Read this
whole file before doing anything. It is written to be your only context — assume
you know nothing about this project.

## Where you are

Repo: `nhn-game-2026`, a competition entry for the NHN AI Game Competition
(deadline 2026-08-10). Two people build a web game (**DDAY**, a text deduction
game); *how the team orchestrated AI* is judged alongside the game itself.

You are in a git worktree at `../nhn-game-2026-deliverables`, on branch
`deliverables/mining`. **Work only inside `docs/deliverables/mining/`.** Do not
touch game code, do not switch branches, do not go near
`super/20260803-213143` or the main checkout — other sessions are building the
game in parallel right now.

## What this track is for

Competition deliverable **#4** is a technical document about how the team used
AI. Rather than write it from memory, the project's own history was mined for
evidence, bottom-up, in phases:

- **Phase 0** — corpus map (`corpus-files.md`, `corpus-commits.md`, `corpus-prs.md`)
- **Phase 1** — atom mining: 905 "story atoms" in `atoms-S1.md` … `atoms-S9b.md`,
  each `{source, date, event, tension, quote, lane, flags}`, no selection applied
- **Phase 2 — you are here.** Induce themes from those atoms.
- **Phase 3** — a human selects/merges/kills themes. First selection happens there.
- **Phase 4** — story bank. **Phase 5** — assembly into #4.

## Your job

Cluster the atoms into candidate themes, **sharded by corpus slice**, and write
`docs/deliverables/mining/theme-map-passA.md`.

**Read `docs/deliverables/mining/theme-format.md` first** — it defines the theme
record template and the rules. Follow it exactly. The rules that matter most:

- Every claim cites atom ids. A theme with prose but no ids is an opinion.
- `counter-evidence` is a REQUIRED field. "None found" is an explicit answer and
  a suspicious one — say where you looked.
- No new evidence enters at Phase 2. If a theme needs an atom that doesn't
  exist, log it under `gaps`; do not go mine sources ad hoc to prop up a thesis.
- Contradictions are preserved, never resolved by picking the nicer atom.
- Selection is Phase 3's job, not yours. Propose; don't prune to a tidy set.

## Use sub-agents — this is required, not optional

905 atoms will not fit usefully in one context, and reading them serially will
degrade the later slices. **Fan out sub-agents, one per slice group**, each
returning candidate themes in `theme-format.md` shape with atom ids attached:

| agent | slices | what lives there |
|---|---|---|
| A1 | S1 | 9 game concepts + briefs (56 atoms) |
| A2 | S2 | scenarios, PoC, the fabrication incident (70) |
| A3 | S3 | mechanism-direction evidence (65) |
| A4 | S4 + S5 | meetings/handoffs (86) + research/legacy (54) |
| A5 | S6 | docs, status.md history, repo prose (198 — the biggest) |
| A6 | S7 + S8 | data/artifacts prose (19) + commit history (77) |
| A7 | S9a | unit-PR review threads (109) |
| A8 | S9b | integration review + PR history (171) |

Then **you** merge their returns into one map: fold duplicates, keep the atom
ids, and mark any theme carried by a single slice as THIN.

Give every sub-agent this instruction verbatim: *"Return candidate themes only.
Do not select, rank, or drop themes for being unimpressive. A boring theme with
solid atom support is worth more than an exciting one without."*

## Seed themes — they compete, they are not given

The human director holds three prior hypotheses. Treat them as candidates on
equal footing with what emerges from the atoms. If nothing attaches, report
`origin: seed-unevidenced` and keep it in the map — a strongly-held intuition
that left no trace is itself a finding.

1. 닫힌 환경에서의 최대의 자유도 — maximum freedom inside a closed environment
2. '게임'으로 느껴지기 위한 속도감 — pacing/speed as a technique serving the
   illusion of freedom (NOT the illusion itself — clarified 2026-08-05)
3. 끝까지 AI가 하지 못하는 것: "재미있나를 판단하는 것" — judging whether
   something is fun is the thing AI never got to do

The illusion of freedom is the **design goal**, achieved by a closed game graph +
deterministic rule-based state engine. This is the "membrane rule": the player
never types free text to an LLM, but does communicate with it through structured
game elements.

## The four lanes

Atoms are tagged with these. Lanes may split, merge, or die — say so if the
evidence demands it.

1. **AI-in-the-game** — runtime LLM calls, the membrane, mechanism probes
2. **AI-building-the-game** — super-pipeline: agent-authored PRs, review panels,
   parallel agents in git worktrees
3. **AI-in-planning** — meeting summarization, doc drafting, housekeeping
4. **AI-as-creator** — scenario writing as a reproducible skill; AI generates
   candidate 'fun', humans judge it

## Also read before you start

- `oral-history.md` — OH-1..OH-4, human memory of pre-repo decisions. Ranks below
  written sources on conflict, **except** where the repo never had the artifact
  (see OH-4). Mark oral-only claims; never launder them into written ones.
- `coverage-audit-successes.md` — the corpus was mined under a failure-weighted
  bias, measured at 0.29 wins per limit, then partly rebalanced. Slices S3, S6
  and S1 never got their correction pass. Expect wins to be under-represented
  there and do not mistake that for evidence they didn't happen.

## Known defects in your input — carry them, don't fix them

- **S8's "Doodle Life cut pre-build" finding is wrong.** Three demos were built;
  Doodle Life was never deployed to the repo and survives only as screenshots
  (OH-4). Any demo-phase theme uses: three demos built → none won → a fourth new
  concept (DDAY) won.
- 117 commits and 4 PRs (including #110 and #116, the two largest integration
  PRs) postdate the corpus snapshot and are **not** in your atoms. Phase 2 runs
  without them by design; a sweep before Phase 3 closes the gap. Note anywhere
  this absence could change a theme.

## Output

`docs/deliverables/mining/theme-map-passA.md`, starting with a header that states
what you covered, what you sampled, and what you skipped — no silent caps. Then
the theme records.

Commit nothing. Push nothing. Open no PR. The human reviews content first — that
gate has held for this whole track and holds for you.

When done, report: theme count, how many are THIN, how many seeds survived, and
the three gaps you'd most want closed before Phase 3.
