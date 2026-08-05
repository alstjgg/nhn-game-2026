# Deliverable mining — method and corpus

This directory is the working record of how deliverable #4 (the AI utilization
technical document, `docs/competition.md` §4) is being **built**: the project's
own history — documents, commit log, PR review threads — is mined by AI agents
for decisions, reversals, failures, and boundaries, from the "AI director" POV
the competition judges on. Themes are induced bottom-up from that evidence, and
only then is the document written.

The directory is committed on purpose. The mining process is itself an instance
of the thing deliverable #4 documents — AI used for planning-and-housekeeping
work — and committing it keeps the process auditable: every later sweep records
what it covered, and every claim in the final document traces back to a source
listed here.

## Method (six phases)

| phase | what | output |
|---|---|---|
| 0 | **Corpus map** — enumerate every mining target | `corpus-files.md`, `corpus-commits.md`, `corpus-prs.md` (this snapshot) |
| 1 | **Atom mining** — parallel agents sweep each slice, extracting story atoms `{source, date, event, tension/decision, quote, lane}`; no selection, boring atoms kept | `atoms-S*.md` per slice |
| 2 | **Theme induction** — cluster atoms bottom-up; pre-existing theme hypotheses compete on equal footing and are reported "unevidenced" if nothing attaches; each theme carries supporting atoms, counter-evidence, and gaps | theme map |
| 3 | **Theme review** — human selects/merges/kills; first moment selection happens | reviewed theme set |
| 4 | **Story bank** — per theme, a narrative with every claim linked to evidence (SHA / PR # / doc §) | story bank |
| 5 | **Assembly** — merge into deliverable #4's structure (subsuming the machine-drafted `../ai-utilization.draft.md` and its open TODOs); feed #2/#3/#5 | the document |

Extraction bias (revised 2026-08-05): the full arc weighted equally —
successes and failures, impressive AI output and human-held boundaries,
discoveries and shortcomings — because deliverable #4's reader is a game
company evaluating AI for its own adoption, not only a judge of an "AI
director." Decisions over descriptions; the reason behind a choice beats the
choice itself.

## Lanes (open-ended)

Atoms are tagged with the lane of AI use they evidence. Starting set — lanes
may split, merge, or die as evidence accumulates:

1. **AI-in-the-game** — runtime LLM calls, the membrane rule, mechanism probes
2. **AI-building-the-game** — super-pipeline: agent-authored PRs, review panels, worktree orchestration
3. **AI-in-planning** — meeting summarization, doc drafting, housekeeping (including this directory)
4. **AI-as-creator** — scenario writing and preprocessing as a Claude Code skill; AI generates candidate 'fun', humans judge it

## Corpus slices

| slice | contents |
|---|---|
| S1 | `planning/concepts/` — the 9 game concepts + briefs |
| S2 | scenarios + PoC — `planning/dday-scenarios/`, `planning/dday-scenario/`, `planning/dday-poc/`, `planning/field-report-poc/`, `planning/paper-tests/` |
| S3 | `planning/dday-mechanism/` — mechanism-direction evidence and decision |
| S4 | `planning/meetings/`, `planning/handoffs/` |
| S5 | `planning/research/`, `planning/legacy-services/` |
| S6 | `docs/` (incl. `status.md` history) + planning root-level docs + repo-root prose |
| S7 | prose inside `data/` and `artifacts/` |
| S8 | commit history of `main` (see `corpus-commits.md`) |
| S9 | PR bodies + review threads (see `corpus-prs.md`) |
| S10 | oral history — team-memory accounts of pre-repo / off-repo decisions (see `oral-history.md`); ranks below written sources on conflict, but is the only source for causal ordering of the founding decisions |

## Sweep protocol

The game is still being built while mining runs, so the corpus moves. Every
manifest carries a snapshot marker: the `main` commit SHA, the date, and — for
PRs — the latest **merge timestamp** covered. Never the highest PR number. PR
numbers record when a PR was *opened*, not when it landed: at the 2026-08-04
snapshot the marker read "PRs after #139 are unswept", but #110 and #116 both
merged *after* that snapshot, so a number-ordered marker silently excluded the
two largest integration PRs in the corpus. Incremental sweeps mine everything
merged after the marker timestamp, then advance it — the final sweep happens
immediately before Phase 5 assembly.

Known blind spots at the current snapshot:
- atoms mined 2026-08-04 were captured under an earlier *failure-weighted*
  extraction bias (revised 2026-08-05); successes and impressive AI output may
  be under-sampled until a balancing sweep runs (audited before deciding);
- work in flight on active super-pipeline run branches (lands on main later);
- the super-pipeline harness's sibling repo — deliberately out of corpus; its
  design record inside this repo (`planning/research/super-pipeline-game-mod.md`)
  stands in for it;
- AI-assisted meeting work that may be recorded outside the repo.

## Language

English structure and prose; Korean sources are quoted verbatim.
