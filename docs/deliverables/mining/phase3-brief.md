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

**Provenance is not symmetric — do not assign it by atom ids.** Measured on the two
finished maps: every one of B's 54 themes shares ≥2 atom ids with some A theme, while
**7 A themes share ≥2 with none** (A T-23, T-31, T-33, T-34, T-49, T-65, T-66). That
is an artefact of citation density, not of agreement — A cites 847 of the 905 atoms
and B cites 459, so B's evidence sits almost entirely inside A's. If you assign
provenance from id overlap you will emit `B-only: 0` and mislabel every genuinely
capability-shaped B finding as `both`. **`B-only` must be judged on the *thesis*** —
does A anywhere assert this claim? — with the id sets used only to find the candidate,
never to settle it. `A-only` is the one provenance the id test can support directly.

**Stage 2 — Human selection (the human, on the merged map).** The director
selects / merges / kills. **Locked: evidence bar, no cap** — keep every theme that
clears the bar (≥3 atom ids from ≥2 slices, or an explicit THIN / oral-only
justification); merge true duplicates; kill only themes that are unsupported,
spurious, or fully subsumed by another. **Do not prune to a tidy set or to a target
count.** Selection is the human's call; your job is to make the merged map and its
evidence legible enough that the call is cheap.

**Stage 2 also assigns `#4-role:` — rank, do not prune.** The evidence bar cannot by
itself select: *every* theme in both passes already clears ≥3-atoms-from-≥2-slices (0
exceptions in A, 0 in B). So "keep everything that clears the bar" keeps essentially
everything, `killed` comes out near-empty, and the merged ~75 themes arrive at Phase 5
unranked — which silently moves the real selection to assembly, days before the
deadline, under the worst possible time pressure. The fix is to rank without killing,
which leaves "no cap" fully intact. Every kept theme gets exactly one:

- `#4-role: spine` — the document's load-bearing argument. A reader who read only these
  would understand how this team orchestrated AI. Expect few; be stingy here.
- `#4-role: section` — earns its own subsection.
- `#4-role: supporting-anecdote` — a paragraph or an example inside someone else's
  section. Most themes land here, and that is not a demotion.
- `#4-role: archive` — true, evidenced, and not going in #4. Kept in the map because
  the mining record is itself a deliverable; killing it would lose evidence, and this
  label is what lets us *not* kill it.

Assigning `archive` is not the same as `killed` and must never be used as a soft kill:
`killed` means the claim did not survive scrutiny, `archive` means it survived and does
not fit the document. Phase 5 inherits an outline; Phase 4 still banks stories from
`spine` and `section` first.

**Output — one artifact: `theme-map-final.md`.** The reconciled + selected map. Each
theme carries:
- `verdict:` — `kept` | `merged-into:T-xx` | `killed` — with a one-line reason
- `provenance:` — `both` | `A-only` | `B-only`
- `#4-role:` — `spine` | `section` | `supporting-anecdote` | `archive` (on every `kept` theme)
- all atom ids, `counter-evidence`, `gaps`, `oral-only`, `fit`, and THIN mark, carried through
This is the **sole input to Phase 4.** (Locked.)

## Locked decisions (2026-08-06 director discussion)

1. **Reconcile first, then the human selects.** Stage 1 produces the merged map;
   Stage 2 is human selection on it.
2. **Evidence bar, no cap.** No target count; keep everything that clears the bar.
   **Amended 2026-08-06:** rank the kept set with `#4-role:` (spine / section /
   supporting-anecdote / archive). This does not reintroduce a cap — nothing is pruned
   and nothing is killed for want of room — it exists because the bar alone selects
   nothing when every theme already clears it, and an unranked map defers the whole
   selection to assembly.
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

1. **Extract, don't read — and extract *per record*.** From each map pull, per theme,
   `{id, title, lanes, atom-id set}` by walking records from their `### T-nn` header,
   attributing ids only to the record they sit inside. Cheap; no LLM reasoning needed.
   **Do not grep either map whole-file for atom ids.** `theme-map-passA.md` carries a
   post-hoc audit block *above* T-01 that lists the 58 ids Pass A failed to cite —
   verbatim. A whole-file grep therefore returns a perfect 905/905 and silently reads
   that list of *misses* as citations. Per-record extraction is not a style preference
   here; whole-file extraction produces a confidently wrong answer.
2. **Compute overlap mechanically — by containment, not Jaccard.** The two maps are
   asymmetric by construction (A: 847 ids over 69 themes, median 23 per theme; B: 459
   over 54, median 10.5), and Jaccard punishes that asymmetry hard. Measured: the
   *obviously* identical pair — A T-01 and B T-01, both "the membrane" — scores only
   **0.30**, and the whole 69×54 grid tops out at **0.56**. Any Jaccard cut low enough
   to admit the membrane admits hundreds of junk pairs. Use the **containment
   coefficient** `|A∩B| / min(|A|,|B|)`, which is asymmetry-robust, and **rank rather
   than threshold**: take each B theme's top-3 A candidates by containment and let the
   reading agent pick. A bare "≥2 shared ids" cut is far too loose — it yields **284**
   candidate pairs, with B's T-54 matching 21 different A themes and T-15/T-37 matching
   13 each. That is a hairball, not a matching. Emit: ranked candidate pairs,
   A-orphans, B-orphans.
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

- **`theme-map-passA.md`'s own header is stale — trust the body, not the cover.** Pass
  A's session was cut short by a token limit mid-fold and its header was never revised.
  It says the map folds to **66** themes; there are **69** records, T-01…T-69 (68
  substantive + T-35, a deliberate merge tombstone). It says **"zero atoms left
  uncovered"**; **58 of the 905 are cited nowhere in it.** Both numbers are corrected in
  a dated audit block at the top of the file — read that block before the header. What
  the audit could *not* fault is the part you depend on: zero fabricated atom ids, all
  ten slices represented, every record carrying its fields, no `counter-evidence: none
  found`. The interruption cost that pass its bookkeeping, not its content.
- **41 atoms are cited by neither map. Nobody currently owns them.** Pass A missed 58;
  Pass B, working blind, independently recovered 17 of those — the replication paying
  off, and a fact worth keeping for #4. The remaining **41** are cited by no theme in
  either pass: S9b×17, S9a×8, S6×7, S1×3, S4×3, S8×3. That residue is concentrated in
  the PR-thread slices, i.e. exactly where the unmined #110/#116 material lives, so it
  is very likely one gap and not two. **You are still forbidden to re-mine** (§What NOT
  to do stands) — record the 41 as a known residue in the final map's front matter and
  hand it to the pre-Phase-5 sweep. Do not let it quietly become 4.5% of the corpus that
  no phase ever looked at.
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

theme count after reconciliation (both / A-only / B-only split, and on what basis
`B-only` was assigned — thesis, not ids); how many the human kept / merged / killed,
and the `#4-role:` split (how many spine / section / supporting-anecdote / archive);
whether any seed moved (survived / confirmed / killed); which passB taxonomy proposals
carried forward; that the 41-atom residue is recorded in the final map's front matter;
and the top gaps still open for the pre-Phase-5 sweep (#110/#116 chief among them).
