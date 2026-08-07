# T2 — the radio report fits the pause it arrives in: max_chars 1200 → 700

> plan-playtest.md **v9** · change list stamped against tree `a6e2a07`
> (2026-08-07, g1-1 merged) — the row re-verified byte-identical at handoff and
> **dry-run-verified** (applied to a scratch tree: `check` + full suite green).
> **Wave 1**: may develop and merge in parallel with `g1-2`, `g1-3`, `g4-1`
> (no shared files).
> Executor: Sonnet-class session. Branch `playtest/g1-6-t2` off current `main`.
> One commit, message: `playtest(T2): report_body max_chars 1200 -> 700`.
> Open a PR; merge nothing (§5.6). Before the first edit, confirm
> `git config user.email` resolves to the `alstjgg` account (repo hard rule 1).

## Outcome

Call 3's length policy asks for a report the player can actually read before the
next event: `report_body` is bounded at 700 characters (was 1200). The report
stays a mining vein (~15–20 sentences) and Call 3 gains latency margin under the
15 s model ceiling. This is the balance-as-data lever the policy file itself
promises ("값은 v0 초기치이며 게임플레이 실측 후 조정한다").

## Scope

May modify (only this file):

- `data/policy/report-guidance.json` — one value.

Must NOT modify:

- `facts.max_items` (8) and both `policy` prose strings in the same file — the
  prose is **prompt text** for Call 3; its wording is part of what was measured.
  (Its `자필 보고서` wording is prompt-side and deliberately not renamed by C4.)
- `min_chars` (300).
- `src/shared/report-guidance.ts` — the renderer reads whatever the file says.
- Anything under `tests/` — the temperament suite derives its expectations from
  the file (`tests/shared/temperament.test.ts:298-302`), and no suite pins `1200`
  (swept 2026-08-07).

Tests turning red: none expected.

## Change list

**E1 — `data/policy/report-guidance.json:11`**
current:
```json
    "length": { "min_chars": 300, "max_chars": 1200 },
```
replace with:
```json
    "length": { "min_chars": 300, "max_chars": 700 },
```

## Invariants

- **Balance-as-data** (/CLAUDE.md): the number changes in `data/`, never inline in
  logic — this edit is that rule in action; no code changes ride along.
- **Scenario-independent policy**: the file lives outside the pack on purpose; do
  not move it or copy values into a scenario.

## Verification

Run in this order, from the repo root, after committing:

1. `npm run check` — expected: green (`test:shared` re-derives the rendered
   guidance from the file).
2. `npm run test` — expected: green.
3. `npm run build` — expected: green.

**Author-side, post-merge (not the executor's):** one probe arm at the new cap to
re-check the stance-shift mechanism and re-record the Call-3 latency figure that
08-04 measured at ~1080 output tokens; plus one deployed-run read confirming the
무전 기록 lands at ≤700자. These two rows below are marked `[author]`.

## Done when

- [ ] Exactly one value changed in exactly one file.
- [ ] `npm run check`, `npm run test`, `npm run build` all green.
- [ ] `[author]` post-merge: a live report measures ≤700자 and remains mineable (sentence-per-judgment structure intact).
- [ ] `[author]` post-merge: one probe run at the new cap is recorded under `planning/dday-mechanism/runs`, with the latency note updated.
- [ ] PR opened from `playtest/g1-6-t2`; nothing merged.

## If this PRD is wrong

```
An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
```
