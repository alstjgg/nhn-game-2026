# Theme record format (Phase 2)

Phase 2 induces themes from the 905 atoms and writes `theme-map.md`. It is the
last phase before a human selects, and the first phase allowed to *synthesise
across sources* — a thing Phase 1 forbade. Selection is still not its job:
Phase 2 proposes, records what argues against each proposal, and leaves
contradictions standing.

## Template

```
### T-<nn> — <short title>
- thesis: <1–2 sentences: the claim this theme makes about how AI was used here>
- lanes: <1 | 2 | 3 | 4 | cross>
- origin: <emergent | seed-confirmed:<seed> | seed-unevidenced:<seed>>
- support: <atom ids — at least 3, from at least 2 slices, else mark THIN>
- counter-evidence: <atom ids that complicate or contradict the thesis.
                     REQUIRED. "none found" is an explicit answer and a
                     suspicious one — say where you looked>
- gaps: <what the corpus cannot answer, and what could: a sweep, an interview,
         an off-repo artifact>
- oral-only: <claims resting on OH-1..OH-4 alone, with no written corroboration>
- fit: <#4 section | #2 video beat | #3 | #5 | none>
```

## Rules

- **Every claim cites atom ids.** A theme with prose but no ids is an opinion.
- **No new evidence enters at Phase 2.** If a theme needs an atom that does not
  exist, log it under `gaps` — do not mine ad hoc to prop up a thesis.
- **Seeds compete on equal footing.** 민서's three seeds enter as candidates, not
  as given. A seed nothing attaches to is reported
  `origin: seed-unevidenced` and kept in the map — the fact that a strongly-held
  intuition left no trace is itself a finding.
- **Contradictions are preserved**, as `counter-evidence`, never resolved by
  picking the nicer atom.
- **Cross-slice beats within-slice.** A theme carried entirely by S6 is usually a
  description of a document, not a theme. Mark single-slice themes THIN.
- **Oral-only claims are marked, never laundered.** OH-4 shows the oral channel
  can correct the written record; it does not make oral claims written ones.
- **No silent caps.** If a pass could not cover something, the map says so.

## Induction method — two independent passes, then reconcile

905 atoms do not fit one agent's working memory, and whichever way they are
sharded determines what clusters. So shard twice, differently, and reconcile:

- **Pass A — by slice.** Agents per slice group propose candidate themes from
  their atoms. Sees document-shaped and chronology-shaped patterns.
- **Pass B — by lane.** Agents per lane (1–4) read across all slices for their
  lane. Sees capability-shaped patterns that per-slice sharding cuts in half.
- **Reconciliation.** One pass merges A and B: themes found by both are strong;
  themes found by only one are kept and marked with which sharding produced them
  (an artefact of framing is a real risk, and naming it is cheaper than
  pretending it away).

The project already treats independent replication as a decision standard — two
separately designed measurement programs converging (S4-026) is cited in the
corpus as a methodological win. Phase 2 is where a framing error would propagate
into every downstream deliverable, so it earns the second pass.

## Inputs at launch

- 905 atoms in `atoms-S1..S9b.md`
- `oral-history.md` OH-1..OH-4
- seeds + the 2026-08-05 clarification, from the WORKLINE's Fixed decisions
- `coverage-audit-successes.md` (which slices were LIMIT-skewed and re-swept)

## Known input defects to carry in

- Atoms mined 2026-08-04 predate the bias revision; the balancing sweep patched
  the five worst slices only. S3/S6/S1 never got their NEUTRAL→WIN promotion.
- 117 commits and 4 PRs (incl. #110, #116) are past the snapshot and unmined.
  Phase 2 runs without them by design; the pre-Phase-3 sweep closes the gap.
- The S8 "Doodle Life cut pre-build" finding is **wrong** (see OH-4). Any theme
  about the demo phase must use the corrected three-demos sequence.
