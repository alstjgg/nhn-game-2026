# Overnight run — 2026-07-30 → 07-31 · morning report

Runbook: `planning/dday-mechanism/RUNBOOK-overnight.md`. Durable record:
`RUNLOG.md` (this is the summary; the run log is the evidence).

## 1. Headline — the program halted at Phase 0

**A hard stop fired: no Phase-0 candidate gate landed in the 40–60% band.**
All three candidates saturated. Per the runbook's §5 hard-stop list and Phase 0's
own instruction ("if no candidate lands in range, stop and report"), **Phases 1–8
were not run.** 30 calls spent of a ~400-call program.

Nothing worse fired. The negative control (the one result that would indict every
mechanism the pipeline has blessed) was never reached, so **it is unrun, not
clean** — no conclusion either way. `foreign_tool_uses` was 0 on all 30 calls, so
the §3 rule-2 transport invariant held.

## 2. Results

| Phase | Suite | Arms | Raw sequence | N | Discards | p |
|---|---|---|---|---|---|---|
| 0 | `P0-gate-siting-J3` | baseline only | `c,a,a,c,c,c,c,c,c,a` | 10 | 0/10 (0%) | 0.047 † |
| 0 | `P0-gate-siting-J4` | baseline only | `b,b,b,b,b,b,b,b,b,b` | 10 | 0/10 (0%) | 1.00 † |
| 0 | `P0-gate-siting-J6` | baseline only | `b,b,b,b,b,b,b,b,b,b` | 10 | 0/10 (0%) | 1.00 † |

Tallies: J3 `c 7 · a 3` (mode 70%) · J4 `b 10` (100%) · J6 `b 10` (100%).
Latency 4.0–7.8s, means 5.5/5.9/6.5s, prompts 1,278–1,299 chars.
Fabricated `because_block_ids`: 19 · 26 · 18 (A5 — a compliance number in a
no-block arm, not a traceability failure).

† Not a measured comparison — these are *projected* p-values for a hypothetical
live arm saturating to 100%, computed with the runbook §6 Fisher helper (which
reproduced both of its worked examples exactly). J3 would clear p<0.05 only at
N≥12; J4 and J6 are undetectable at any N (10/12/20/25/40 all give p = 1.0).
**No live arm was run. Nothing here compares two arms.**

## 3. What this licenses — and what it does not

- **Licenses:** J4 and J6 are unusable as flagship sites under K1/v0.4, and J3 is
  above the pre-registered ceiling. A9's saturation problem is **not a J1 quirk**
  — it reproduced on the first two gates tried, harder than at J1 (100% vs 80%).
- **Licenses:** the transport and schema are healthy — 0 discards, 0 retries, 0
  foreign tool uses across 30 calls.
- **Does not license:** any statement about C-BLOCK, C-STRUCT, or any effect.
  No live arm, no placebo, no mechanism was tested tonight. Law #1 remains
  exactly as provisional as it was yesterday.
- **Does not license:** "the gates are saturated." Three gates on **one axis**
  were tested (see §4). Gates on other axes are untested, not rejected.
- **Does not license:** re-siting at J3. 70% is outside the band I pre-registered
  before the calls; overriding that after seeing the number is the
  rationalization §9.1 exists to prevent. J3 is recorded as the best *lead*.

## 4. Diagnosis chain — why all three saturated

**Causal claim (§6.1 form), written from the free output, not inferred:**

> They saturated because all three gates ask the same question, and the v0.4 base
> already answers it. J3 (defy the 실장's hold on the trace result), J4 (defy the
> 실장's 허위신고 filing) and J6 (defy the 수사팀's arrest push) all turn on
> *comply with the institution vs. resist premature closure*. The base answers
> that three times before the gate is asked — **[무게]** (both costs are yours),
> **[내력]** (a haste-regret incident still with you), **[책임]** (you will have
> to explain this judgment). The `inner_note`s say it in those words: *"이 판단의
> 무게를 누군가 나중에 묻을 것이기 때문"*, *"성급한 단정은 되돌릴 수 없다"*.
> If that is the cause, a candidate gate whose dilemma sits on an axis the base
> does *not* lean should land mid-range.

Two things follow, and they are separable:

1. **A finding about the template** (A10) — A8's scrub covers the *block's* axis;
   it does not cover the *gate's*. All three suites passed a clean A8 scrub and
   saturated anyway. Plan §7.1's own section law predicted this shape for
   [역할]'s protective lean; it recurs on the accountability axis.
2. **My authoring error, owned as such** — I drew three candidates from one axis.
   That is one candidate sampled three times, and it is why the phase produced a
   halt instead of a site. A correct Phase 0 would have spread candidates across
   axes (e.g. J2's *press-the-caller-or-not*, which is on K1's own fear axis and
   which I passed over).

Nothing was dropped or rewritten: the drop condition fired as written, first run,
no rewrite attempted (§6.1's one-rewrite allowance was not spent).

## 5. New amendments

- **A10 — the saturating axis is the gate's, and the base answers it three
  times.** Because a clean A8 scrub was not sufficient: check the gate's own
  dilemma against [무게]/[내력]/[책임] on paper, free, before spending 10 calls,
  and draw candidates from different axes.
- **A11 — RB2's residual malformation did not reproduce.** Because 0/30 discards
  against RB2's 2/12 (p = 0.077, suggestive not significant) changes probe
  sizing: do not budget for a ~17% loss, and do not treat the residual as closed.

## 6. Blocked / unrun — and what needs a human

| Item | Status | Why |
|---|---|---|
| Phases 1, 2, 4, 6, 8 | **Unrun** | Each is sited "at the Phase-0 gate". There is no Phase-0 gate |
| Phases 3, 5 (E-DISC, E-LEV) | **Unrun** | Not gate-blocked, but plan §8.7 orders 4(b)→4(c)→4(d): screening must not run before the negative control. Running them would have violated the order on its own |
| **Negative control (Phase 2)** | **Unrun — ownership still unsettled** | Runbook §2 flags it as unassigned and block-shaped. It gates everything downstream and nobody owns it |
| **E-CONT** | **Blocked (build task)** | Needs the report leg; `templates/reporter/` does not exist. Not authored — a reporter template is a prompt-authoring decision with axis-discipline implications (§7.1), not an unattended one |
| **B3b legibility coding** | **Blocked program-wide** | Same missing reporter template (§5.2) |
| **B3a blind coding** | **Not applicable tonight** | A single-arm baseline measurement has no arm labels to strip, so there is no packet to assemble — same position as E0 |
| **All verdicts** | **Human call** | gate/texture/drop is decided at spec compile with the card in front of you (§9.3); ambiguity defaults to texture. No verdict is issued here |

**Decision waiting for 민서:** whether Phase 0 gets a second round against
different-axis candidates (A10 says pick them on paper first), or whether the
flagship probe re-sites by scrubbing the base instead of moving the gate — the
latter is a template change and therefore a D-task/A-spec question, not a run-log
amendment.

## 7. 윤석's line (C-STRUCT)

**Nothing was authored and nothing was run on the C-STRUCT line.** Phases 6 and 7
(C-STRUCT axis 1–2, E-PATH, E-GOAL) were never reached, so there are no
unattended authoring choices for 윤석 to review or reject. The `owner: 윤석 ·
authored unattended, pending review` marking was not needed and appears nowhere.

One thing does carry to his line, from A6: C-STRUCT sits on the same baseline
C-BLOCK does, so **the saturation problem is shared, not C-BLOCK's alone.** A
C-STRUCT probe sited at J4 or J6 would have hit the same 100% ceiling. A10
applies to his gate selection unchanged.

## 8. Totals

- **30 calls spent** (3 gates × 10, baseline only). Budget hard stop is 600 —
  never approached. Zero discarded, zero failed, zero retried.
- **Phase 0 of 8 reached.** Phase 0 completed its job — it was built to reject
  saturated sites before the placebo is authored, and it rejected three.
- No artifact was edited or deleted; `--force` was never used; `main` was not
  touched and no PR was opened. **One commit** tonight (`b5143b4`) on
  `test/dday-e0-shape-revalidation` — one phase reached, one commit, as the
  commit-per-phase rule implies.
