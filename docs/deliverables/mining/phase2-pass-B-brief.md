# Phase 2 · Pass B — theme induction sharded BY LANE

You are running **Pass B** of Phase 2 of the deliverable-mining track. Read this
whole file before doing anything. It is written to be your only context — assume
you know nothing about this project.

**Pass A has already run.** It sharded the same atoms by corpus *slice*; you
shard by *lane*. Its output sits in this directory as `theme-map-passA.md`.
**Do not open it. Do not grep it. Do not let a sub-agent read it.** Your
independence is the entire point of running two passes — a third reconciliation
step compares the two maps afterwards, and it has nothing to compare if you have
already seen one. If you find yourself reaching for it, that is the failure mode
this line exists to stop.

## Where you are

Repo: `nhn-game-2026`, a competition entry for the NHN AI Game Competition
(deadline 2026-08-10). Two people build a web game (**DDAY**, a text deduction
game); *how the team orchestrated AI* is judged alongside the game itself.

You are in the repo checkout at `~/Documents/GitHub/nhn-game-2026`, on branch
`deliverables/mining` (the separate worktree this track used earlier is gone —
if a doc still mentions `../nhn-game-2026-deliverables`, it is stale). **Work
only inside `docs/deliverables/mining/`.** Do not touch game code, do not switch
branches, do not go near `super/20260803-213143`.

**Account rule — hard, read it before your first tool call.** This session may be
running on a corporate AI subscription. Nothing you write may reveal that. No
corporate account name, username, email, domain, hostname, machine name, ticket
id, or internal-tool reference in your output file, in any commit message, or
anywhere else — see CLAUDE.md hard rule 1. Some atoms *discuss* the personal-vs-
corporate identity rule as evidence; quoting that is fine and expected. Naming an
actual corporate identifier is not.

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

Cluster the atoms into candidate themes, **sharded by lane — reading across all
ten slices for each lane** — and write
`docs/deliverables/mining/theme-map-passB.md`.

This is the whole reason Pass B exists. Slice-sharding cuts a capability in half
when it shows up in three different slices; lane-sharding sees the capability but
loses the chronology. Neither is right. You do lanes.

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

905 atoms will not fit usefully in one context. **Fan out sub-agents by lane**,
each sweeping all ten atom files for its lane and returning candidate themes in
`theme-format.md` shape with atom ids attached:

| agent | lane | what it hunts across every slice |
|---|---|---|
| B1 | 1 — AI-in-the-game | runtime LLM calls, the membrane rule, mechanism probes, latency-vs-quality, model selection |
| B2 | 2 — AI-building-the-game | super-pipeline, agent-authored PRs, review panels, worktree orchestration, harness failures |
| B3 | 3 — AI-in-planning | meeting summarization, doc drafting, spec writing, housekeeping (this mining track included) |
| B4 | 4 — AI-as-creator | scenario writing as a skill, datapack authoring, AI generating candidate 'fun' and humans judging it |
| B5 | cross / unlanded | atoms tagged `unclear`, `proposed:<new-lane>`, or that sit across two lanes — propose lane changes here |

Then **you** merge their returns into one map: fold duplicates, keep atom ids,
and flag any theme that only one lane-agent saw.

Give every sub-agent this instruction verbatim: *"Return candidate themes only.
Do not select, rank, or drop themes for being unimpressive. A boring theme with
solid atom support is worth more than an exciting one without."*

B5 matters more than its size suggests: the lane taxonomy is explicitly
**open-ended**. If the evidence says a lane should split, merge, or die, that is
a finding, not a deviation.

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

## Also read before you start

- `oral-history.md` — OH-1..OH-4, human memory of pre-repo decisions. Ranks below
  written sources on conflict, **except** where the repo never had the artifact
  (see OH-4). Mark oral-only claims; never launder them into written ones. OH-3
  is organized by activity (대화/검증/구현/재미) and maps unusually well onto
  lanes — useful to you specifically.
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
  PRs) postdate the corpus snapshot and are **not** in your atoms. This bites
  lane 2 hardest — say so wherever a lane-2 theme rests on review-panel evidence
  that the missing PRs could strengthen or overturn.

## Output

`docs/deliverables/mining/theme-map-passB.md`, starting with a header that states
what you covered, what you sampled, and what you skipped — no silent caps. Then
the theme records.

Commit nothing. Push nothing. Open no PR. The human reviews content first — that
gate has held for this whole track and holds for you.

When done, report: theme count, how many are THIN, how many seeds survived, any
proposed change to the lane taxonomy, and the three gaps you'd most want closed
before Phase 3.
