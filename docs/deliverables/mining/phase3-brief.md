# Phase 3 — reconcile, then select: from two theme maps to `theme-map-final.md`

Read this whole file before doing anything. It is written to be your only context
— assume you know nothing about this project. No cold-start reading of other docs
is required beyond the inputs listed in §Inputs.

## Where you are

Repo `nhn-game-2026`, a competition entry for the NHN AI Game Competition (deadline
2026-08-10). Two people build a web game (**DDAY**, a text deduction game); *how the
team orchestrated AI* is judged alongside the game. Deliverable **#4** is a technical
document about how the team used AI. Rather than write it from memory, the project's
own history is being mined for evidence, bottom-up, in phases. **You are Phase 3.**

**Branch / checkout caveat — read before any file op.** The mining artifacts live on
the `deliverables/mining` branch under `docs/deliverables/mining/`. The primary
working checkout is frequently occupied by a super-pipeline run sitting on *other*
branches, so `docs/deliverables/mining/` may be absent from the working tree. **Do
not switch the busy checkout's branch.** Work through a dedicated worktree:
`git worktree add <path> deliverables/mining` (remove it when done). If you only need
to read, `git show deliverables/mining:docs/deliverables/mining/<file>`. **Work only
inside `docs/deliverables/mining/`.** Do not touch game code, the proxy, or any
`super/*` branch.

**Account rule — hard.** This session may run on a corporate AI subscription. Nothing
you write may reveal it: no corporate account name, username, email, domain,
hostname, machine name, ticket id, or internal-tool reference in any file, commit
message, or output. `git config user.email` must resolve to the personal `alstjgg`
account; grep the staged diff before any commit. Themes/atoms that *discuss* the
personal-vs-corporate rule are fine to quote; naming an actual corporate identifier
is not. (CLAUDE.md hard rule 1.)

## The phase map

- Phase 0 — corpus map. Phase 1 — 905 story atoms (`atoms-S1..S9b.md`).
- Phase 2 — theme induction in **two independent passes**, sharded differently so the
  sharding artefacts cancel: **Pass A (by slice)** → `theme-map-passA.md`, sees
  document- and chronology-shaped patterns; **Pass B (by lane)** → `theme-map-passB.md`,
  sees capability-shaped patterns that per-slice sharding cuts in half. The passes were
  forbidden to see each other.
- **Phase 3 — you.** Reconcile the two, then the human selects. First selection happens here.
- Phase 4 — story bank. Phase 5 — assembly into #4.

## Your job — two stages

**Stage 1 — Reconcile A and B into one deduped map (agent work).** Merge the two maps.
For every theme, record whether it was found by **both** passes (strongest signal),
**A-only** (a slice/document-shaped pattern B's lane view missed), or **B-only** (a
capability-shaped pattern A's slice view cut in half). Fold duplicates; keep **all**
atom ids from both; preserve contradictions and THIN marks; **never resolve a
contradiction by picking the nicer atom.** A theme only one sharding produced is a
possible framing artefact — keep it and name it, do not delete it. (This is the
reconciliation step defined in `theme-format.md`.)

**Stage 2 — Human selection (the human, on the merged map).** The director
selects / merges / kills. **Locked: evidence bar, no cap** — keep every theme that
clears the bar (≥3 atom ids from ≥2 slices, or an explicit THIN / oral-only
justification); merge true duplicates; kill only themes that are unsupported,
spurious, or fully subsumed by another. **Do not prune to a tidy set or to a target
count.** Selection is the human's call; your job is to make the merged map and its
evidence legible enough that the call is cheap.

**Output — one artifact: `theme-map-final.md`.** The reconciled + selected map. Each
theme carries:
- `verdict:` — `kept` | `merged-into:T-xx` | `killed` — with a one-line reason
- `provenance:` — `both` | `A-only` | `B-only`
- all atom ids, `counter-evidence`, `gaps`, `oral-only`, `fit`, and THIN mark, carried through
This is the **sole input to Phase 4.** (Locked.)

## Locked decisions (2026-08-06 director discussion)

1. **Reconcile first, then the human selects.** Stage 1 produces the merged map;
   Stage 2 is human selection on it.
2. **Evidence bar, no cap.** No target count; keep everything that clears the bar.
3. **Taxonomy deferred to Phase 5 assembly.** Phase 3 does **not** decide passB's
   lane-taxonomy proposals (new lane *AI-orchestrating-AI*; new/widened lane
   *documents-as-machine-interface*; split lane 2 → harness-impl / live-ops; the
   orthogonal *human-kept ↔ AI-delegated* axis; the 3↔4 boundary rule). Carry them
   forward verbatim in a `Taxonomy — carried to assembly` appendix; do **not** let
   them change how themes merge.
4. **One artifact: `theme-map-final.md`** (not annotate-in-place, not a separate shortlist).

## Reconciliation method — atom-id-overlap first (this IS the token strategy)

Do **not** read all 905 atoms, and do **not** load both full maps into one context to
eyeball-match. Instead:

1. **Extract, don't read.** From each map pull, per theme, `{id, title, lanes, atom-id
   set}` — a grep/script over the `support:` and `counter-evidence:` lines. Cheap; no
   LLM reasoning needed.
2. **Compute overlap mechanically.** Two themes (one A, one B) whose atom-id sets
   substantially overlap (e.g. ≥2 shared ids, or Jaccard above a threshold) are
   candidate matches. Emit: matched pairs, A-orphans, B-orphans.
3. **Read only what you must.** An agent reads the *prose* of matched pairs to
   confirm / merge and write the unified thesis; reads orphans to classify and keep
   as A-only / B-only. Fetch a single atom body only when a merge is genuinely
   ambiguous — `grep -n "S4-021" atoms-S4.md`, never a full-file read.
4. **Shard by cluster only if needed.** If the paired set is too large for one
   context, group by topic (membrane · review-panel · scenario-authoring ·
   planning-docs · deploy/ops · seeds · cross-cutting) and reconcile one cluster per
   sub-agent, each returning unified records; merge their returns yourself.

`theme-map-passB.md` is ~1460 lines; `theme-map-passA.md` is large (~250 KB). The
overlap-first approach means you never hold both in full — only two id-tables plus the
prose of the pairs actually in question.

## Inputs

- `theme-map-passA.md`, `theme-map-passB.md` — the two maps. **Both are now fair
  game**; the independence rule was Phase 2's only. Read passB's header for its
  convergence/seen-by tagging and its `H. Single-source flags` and `G. Taxonomy
  proposals` sections — they front-run part of your reconciliation.
- `theme-format.md` — record template + rules (the reconciliation step lives here).
- `oral-history.md` — OH-1..OH-4, **plus any new OH-n from the Round-2 interview**
  (see §Parallel track). Ingest whatever has landed.
- The three seeds + the 2026-08-05 clarification. **All three survived Pass B** — carry
  them; a seed nothing attaches to stays `seed-unevidenced`, which is itself a finding.
- `coverage-audit-successes.md` — which slices were LIMIT-skewed / re-swept.

## Carried corrections & defects (do not re-litigate; carry them)

- **Doodle Life was a fully built demo, not screenshots.** It survives as **closed
  (unmerged) PR #16** (`demos/doodle-life/` + `artifacts/doodle-life-evals/`, closed
  2026-07-25) — never deployed to `main`. This sharpens the method-finding behind
  passB T-12: repo-mining that reads only `main` + merged history under-counts
  **closed PRs**, not merely uncommitted work. **Corrected demo set:** apothecary +
  darkest-context (merged) + **doodle-life (closed PR #16)** → none won → DDAY (a
  fourth, new concept). Any demo-phase theme uses this. (Supersedes OH-4's "only
  screenshots survive" and the gap notes in passB T-12 / T-46.)
- **#110 / #116 + 117 post-snapshot commits remain unmined — deferred by the director
  to the end of the track** (implementation is live now). Phase 3 runs without them.
  Where a theme (mostly the lane-2 review-panel / integration themes: passB
  T-22/T-23/T-28/T-32/T-35/T-37) rests on evidence those PRs could strengthen or
  overturn, **keep the `gaps` flag** on the merged theme. A pre-Phase-5 sweep closes it.
- **Mining bias:** S3/S6/S1 never got the wins-rebalance pass; wins are under-
  represented there (win-sweep `-W` atoms partly correct it). Do not read under-
  representation as absence.
- **Production-model in-play measurement gap is dropped** as a blocker (director call);
  keep it only as a per-theme gap note where passB already carries it.

## Parallel track — the Round-2 interview (feeds Phase 3, does not block it)

`interview-prompts.md` Round 2 targets the load-bearing oral-only claims passB
surfaced — chiefly the **DDAY-selection record-gap** (how DDAY was chosen after the
demo bake-off, from outside the concept funnel; S4-021 has no minutes). Answers land
as new OH-n blocks in `oral-history.md`. **If they exist when you run, ingest them**
(an answer may promote an `oral-only` claim toward written, or fill a `gaps` line); if
not, proceed and leave the gap noted. Mark oral-only claims; never launder oral into
written.

## What NOT to do

- Do not re-mine the atoms or add new evidence. Phase 3 synthesizes; it does not mine.
- Do not decide the taxonomy (deferred to Phase 5).
- Do not prune to a tidy set (evidence bar, no cap).
- Do not commit to `main`, do not push, do not open a PR. Commit the merged/final map
  to `deliverables/mining` (via worktree) only if the director asks; otherwise present
  for review. The review-first gate has held for this whole track.

## Token budget — methods in one place

- Overlap-first reconciliation (above): two id-tables + only-the-pairs-in-question,
  never both full maps in one context.
- Fetch atom bodies by id on demand (`grep -n`), never full atom-file reads.
- Shard by theme-cluster with sub-agents only if the paired set overflows one context;
  otherwise do it in a single pass.
- This brief is self-contained — a fresh session needs no other cold-start reading.
- Emit only the final artifact; do not echo the full merged map into chat.

## When done, report

theme count after reconciliation (both / A-only / B-only split); how many the human
kept / merged / killed; whether any seed moved (survived / confirmed / killed); which
passB taxonomy proposals carried forward; and the top gaps still open for the
pre-Phase-5 sweep (#110/#116 chief among them).
