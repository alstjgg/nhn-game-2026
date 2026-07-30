# CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20 — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against the source-grounding calibration suite.

**Owner: 윤석.** The owner approved continued testing; Codex excluded the
calibration sample and pre-registered an independent N20 comparison.

## 1. Entry and branch reachability

**Clean.** J1 is the first call, `BLOCKS` is empty, and both source and hazard
questions can be asked on the first turn.

## 2. Prompt identity

The complete execution surface is byte-identical to
`CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE.json`: base, K1, timeline,
blocks, gate, stances, priority text and three arm permutations. Only the
experiment id and planned sample size differ.

## 3. Calibration separation

The calibration sequence `a,b,a,b,a,a,b,a,b,b` is used only to size N. None of
its calls count in this experiment's baseline, distributions or exact tests.

## 4. Production status

The two-choice stance set remains a diagnostic without production delta rows.
This configuration is clean for isolated Tier-A comparison only, not B2
in-situ or the architecture write test.

## 5. Audit result

**Clean for an independent N20 comparison.** The new baseline's exact-power
hard stop gates live and placebo spending.
