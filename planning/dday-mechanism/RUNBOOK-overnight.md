# Runbook — DDAY mechanism program, unattended overnight run

You are running the whole mechanism program — all 7 mechanisms, both lines —
unattended. 민서 reads the result in the morning. Work the phases in order.
**Produce evidence, not verdicts** — see "What you must not do".

> **Resume state, 2026-07-30 (second launch).** Phases 0 and 1 are **done and
> committed** — do not redo them, do not re-run their suites, never touch their
> `runs/` directories. Phase 0 authored five stance sets
> (`suites/OVERNIGHT-phase0-stance-sets.md`); Phase 1 ran P1a and P1b (both in
> `RUNLOG.md`, both creditable under A15). **Start at Phase 2.** Suites for
> Phases 3, 5 and 6 are already authored (`P3-edisc-J1.json`, `P5-elev-J8.json`,
> `P6-cstruct-J1.json`) — validate and use them; author the rest as you reach
> them. **A15 and A16 are now in force** (민서 enacted both in session): the
> comparability stop works by all-attempts recount, and rejected-field problems
> are `__soft__` — the validator keeps those calls, so expect discard rates near
> zero and never pool compliance rates with pre-A16 runs. Selftest is 27 checks.

**Your real constraint is context, not calls.** A call is ~5s and costs
pennies; the full program is ~400 calls and well under an hour of running. But
you will author ~15 suites, and the judgment that matters — reading a composed
prompt closely, diagnosing a failure honestly — is what degrades after a
context compaction. So:

- **Append to `RUNLOG.md` and commit after every phase**, before starting the
  next. Never carry a finding only in your head.
- **After any compaction, re-read `RUNLOG.md` before doing anything else.** It is
  the durable state; your memory of earlier phases is not.
- **If you cannot reconstruct why an earlier phase concluded what it did, stop
  and write the report.** A half-program with honest records beats a full one
  with confabulated ones. Stopping early is an acceptable outcome; the morning
  report has a slot for what you did not reach.

---

## 1. Read these first, in this order

| # | Document | Why |
|---|---|---|
| 1 | `planning/dday-mechanism/RUNLOG.md` | **Read before the plan.** Append-only layer that amends the plan with measured results. Where it carries an `A#` amendment, **it wins over the plan.** **A1–A16 are in force**; A9/A12/A13/A14 change what a valid probe looks like, A14 corrects a mistake this runbook itself used to make, and A15/A16 (enacted by 민서 2026-07-30) redefine the comparability stop and what counts as a discard |
| 2 | `docs/dday-mechanism-deep-test.md` | The test program. §2 principles · §3 integrity protocol · §6 screening · §7 template and run sheet · §8 operating procedure · §9 decision procedure. Everything not amended by the run log applies as written |
| 3 | `docs/dday-architecture-spec.md` | SoT for the game's core technology. Read §2–§4 and §9. Do **not** restate or amend it; a spec change is a spec change, never a run-log amendment |
| 4 | `infra/test-harness/README.md` | The runner: options, what it refuses, suite anatomy |
| 5 | `planning/dday-mechanism/suites/*.json` | Worked examples. Copy **`S1-stanceset-J1.json`** — the one configuration known to separate. `RB2` is the same probe with the stance set that failed, kept for contrast |
| 6 | `planning/dday-poc/poc-terror/slice-terror.json` | Source material: 9 gates (J1–J8, J2-dead), mineable sentences, temperament registry |
| 7 | `.claude/skills/read-mechanism-run/SKILL.md` | The read format 민서 will use on your results. You are not writing the read — but knowing what it needs tells you what to record |

`docs/dday-design-doc.md` is a teammate's working log, not authoritative. If it
conflicts with the spec, the spec wins.

## 2. Scope — all 7 mechanisms, two lines, one owner caveat

The program splits by channel lineage. You are running **both** lines tonight.

| Line | Mechanisms | Owner |
|---|---|---|
| C-BLOCK (3) | **C-BLOCK** channel — placebo (plan §8.7 step 4b) · credulity contingency (§4.1) · block-species coverage (§4.1) · **E-LEV** — is a known fact *deployed* in the utterance, not merely cited · **E-DISC** — degrading trust in an existing block (screening, §6.1) | 민서 |
| C-STRUCT (4) | **C-STRUCT** channel — priority reorder, axis 1–2 · **E-PATH** · **E-GOAL** (both are priority-manipulation candidates) · **E-CONT** — report contamination | 윤석 |
| Joint | **Interference axis** (C-BLOCK × C-STRUCT) — only after both lines' axis 1–2 | both |

**Mark everything on the C-STRUCT line `owner: 윤석 · authored unattended,
pending review`** — in the suite's `_authoring_provenance`, in the run-log entry,
and in the morning report. He did not make these authoring choices and must be
able to reject them rather than silently inherit them. The line split exists for
context continuity per channel; running it here is a convenience, not a transfer
of ownership.

**E-CONT cannot run.** It needs the report leg, and the harness has a `reporter`
call type with **no template** (`templates/reporter/` does not exist). Authoring
one is a build task, not a run — do not attempt it tonight. Record it as blocked.
This also blocks B3b legibility coding program-wide (§5.2).

The **negative control** (step 4c) is unassigned and block-shaped. It is Phase 2
below. Flag in the report that ownership needs settling.

## 3. Before you spend a single call

```bash
cd infra/test-harness
node lib/selftest.mjs                  # must pass; currently 27 checks
git rev-parse --abbrev-ref HEAD        # expect test/dday-e0-shape-revalidation
git config user.email                  # must resolve to the alstjgg account
```

`ANTHROPIC_API_KEY` is exported from `~/.zshrc` and a new session inherits it.
Confirm with `[ -n "$ANTHROPIC_API_KEY" ] && echo ok` — never print the value.

Then, for every probe, follow plan §7.3's order. The runner enforces steps 1–3;
step 3 (the reachability audit, §5.2 B1) it cannot, so you write it:

```bash
node run.mjs <suite> --print-prompt=live          # free — read it, every time
node run.mjs <suite> --dry-run --out=/tmp/dry-x   # free
node run.mjs <suite>                              # spends calls
```

`--print-prompt` is not optional. A9 exists because nobody read a composed
prompt closely enough to notice the timeline was leaking the block's content.

## 4. Phases

Run in order. Each phase gates the next. Commit after each phase.

### Phase 0 — Author a stance set per gate (paper, zero calls)

**Do not hunt for a mid-range gate. That premise is dead** — the 2026-07-30
overnight run burned 30 calls on it and halted. S1 then showed the operative
variable was never the gate's baseline share; it was the **stance set**. A9's
ceiling problem is saturation *on the stance the block pushes toward*. A baseline
that saturates 100% on some **other** stance is a clean floor and the best case
you can get (A14).

The S1 recipe, which took 공감 from 0/10 to 9/10 at p = 0.00006:

1. **Name the two readings** the block is supposed to switch the agent between.
   For `f_script` at J1: *a planned threat being delivered* versus *a coerced
   person being made to read*.
2. **Give each reading its own stance.** S1 worked because 경청 (let them finish,
   to learn more) and 공감 (turn toward the person) were split. RB2 failed because
   one option served both. A stance both readings would pick is an escape option
   and hides the mechanism (plan §5.1 axis 4).
3. **Behavior orientations with a short gloss** — `추궁 — 묻고, 답을 받아낸다`.
   Never canned utterances, never completed action descriptions (plan §1, A12).
   Four stances is plenty.
4. **Run the lint**, every suite, no exceptions:
   ```bash
   node infra/test-harness/lint-stances.mjs <suite.json>
   ```
   It flags labels reusing the fixture temperament's vocabulary. A common noun
   may be unavoidable; a word naming the clause's condition or its prescribed
   behaviour is not.
5. **A10 paper check** — name the axis the gate's dilemma sits on and check it
   against the base's leaning sections `[무게]` / `[내력]` / `[책임]`. A gate whose
   dilemma the base already answers cannot separate. Reject it here, for free.
6. **A8** — read the composed prompt and check whether the frozen timeline already
   implies the block's content. Scrub it, or declare it present in the sheet.

Output of this phase is suites, not calls. It is the phase that decides whether
the rest of the night produces anything.

### Phase 1 — C-BLOCK placebo (plan §8.7 step 4b) + the A12 control

At the **S1 configuration** — J1, the S1 stance set, K1, template v0.4. It is a
known-separating configuration; do not re-site it.

**1a — the placebo.** Add a third arm to S1: same slot, same length, same
fear-axis vocabulary, **referent misdirected to a bystander** (황보람 or 정해권,
not the caller — a fear sentence about the caller is semantically live and is not
a placebo). 10 calls. Credited = baseline 경청 · live 공감 · placebo 경청.

If the placebo also moves, discriminate on `because_referent` before calling it:
content misattributed to the caller means token-matching; the bystander named
correctly while the stance still shifts means referent bleed (plan §2, §8.6).
Then fire the pre-registered **credulity contingency** (§4.1) — re-run once with
the `[결함]` line removed (`CREDULITY` channel, already in `CHANNEL_SLOTS`) before
concluding keyword lock.

**1b — the surface-form control (A12).** S1 changed the stance wording *and* the
option set at once, so the lexical-chain hypothesis is weakened but not
controlled. Re-word all four S1 labels holding their meaning fixed, change nothing
else, run baseline + live at n=10. If 공감 still wins, A12 closes. 20 calls.

Hypotheses in **shift form only** (A1). Saturation clauses must name the
**predicted** stance (A14) — do not re-import the "≥80% on any stance" mistake.

Reading it: credited = baseline stable · live moves · placebo stable. If the
placebo also moves, discriminate on `because_referent` — content misattributed to
the live referent means token-matching; the bystander named correctly while the
stance still shifts means referent bleed (plan §2, §8.6). Record which; do not
call it either way without the referent evidence.

### Phase 2 — Negative control (step 4c; gates everything downstream)

Runs **before** screening, per plan §8.7's 4(b) → 4(c) → 4(d) order. Procedure is
plan §6.2. Author a mechanism **believed to be fake** — a block in a region the
judgment logic does not read, or one irrelevant on every axis any fixture
temperament watches. Check it against the axis registry (plan §7.1); accidental
axis alignment is what makes a fake mechanism real. Run the complete pipeline —
screening, placebo arm, N-run distribution — and pre-register the **inverted**
drop condition.

**If it returns "verified", STOP THE ENTIRE PROGRAM.** Run nothing else. Every
mechanism the pipeline has blessed is suspect. Put it at the top of the morning
report. This is the one result that halts everything.

### Phase 3 — E-DISC screening (§6.1, ~6 calls)

Cheap screen: can an injected block *degrade trust in an existing block*? Put a
block in the baseline (e.g. `f_internal`), then have the live arm inject one that
undermines it. 3 per arm.

§6.1's rule is binding: on failure, **write the diagnosis as a causal claim
before authoring the rewrite** ("it failed because X; if X, changing Y fixes
it"). One rewrite only. If the rewrite passes for a different reason, that is a
**drop, not a pass**. If the failure is illegible, drop immediately.

### Phase 4 — Block-species coverage (axis-1 obligation, §4.1)

Fact statements are one *species* of block, not the channel. At the **S1
configuration**, test three more species — **emotion description**, **NPC quote**,
**self-narration** — each with its own matched placebo. Live + placebo per species
at n=10; re-run the baseline once in this phase rather than reusing Phase 1's.

Each species must still carry the fear axis (law #1) and still name the caller,
or you are testing axis alignment rather than species.

### Phase 5 — E-LEV (§4.2)

Is a known fact *deployed* in the `utterance` as a bargaining card, not merely
cited in `because_block_ids`? J8 ("20초의 숨소리. 무엇을 말하는가?") suits this —
the agent speaks, and `f_namgihun` or `f_internal` are deployable. Author its
stance set through Phase 0 first; J8 has never been measured. baseline / live /
placebo at n=10.

E-LEV doubles as the feasibility test for execution grading: if the utterance
layer cannot be read reliably, the engine stays on stance-only fixed deltas.
Record that read either way.

### Phase 6 — C-STRUCT channel, axis 1–2 (윤석's line)

Mark everything from here through Phase 7 `owner: 윤석 · authored unattended,
pending review`.

C-STRUCT is *verified (initial)* only — 3/3 on a priority reversal, with no
placebo. It owes the same evidence C-BLOCK owes: a matched placebo and boundary
laws. The channel may touch **only** `PRIORITY_LIST`, as a permutation; no
wording change (plan §7.2, spec I7 — the player permutes proxy-authored content,
never writes into it). `CHANNEL_SLOTS['C-STRUCT']` enforces this.

At the S1 configuration: baseline / live (reordered) / placebo (a permutation
that should not matter — e.g. reordering two lines both irrelevant to the gate's
decision). n=10. The S1 stance set was built to separate a *fear* reading; if
C-STRUCT's two readings are different ones, Phase 0 that gate again rather than
inheriting a stance set built for another question.

### Phase 7 — E-PATH and E-GOAL (윤석's line)

Both are "reachable via C-STRUCT? via C-BLOCK?" questions (§4.2), so each needs
runs on both channels, and each needs its own Phase-0 stance set — the readings
E-PATH switches between are not the ones S1's set separates. E-PATH: does the ordering steer which source the agent
consults first? E-GOAL: does it change the objective pursued? baseline / live /
placebo per channel, same N.

Per-effect deliverable is one sentence (§4.2): *to build a \<effect\> gate, use
channel C with surface form Y; expected hit rate Z%; fails when \<boundary law\>.*
Write it with the numbers you measured, or write that you could not.

### Phase 8 — Interference axis, C-BLOCK × C-STRUCT (joint)

**Only if Phases 1–7 all completed.** Both channels on one gate. Watch for the
known escape-option effect (§5.1 axis 4): when the stance set contains an option
satisfying both conflicting pulls, the conflict never materialises — condition
conflicts are real only if the stance set forces a choice. If the gate offers an
escape, say so and treat a null result as unattributable rather than negative.

### Not runnable tonight — E-CONT

Report contamination needs the reporter call, and `templates/reporter/` does not
exist. Do not author a template unattended (it is a prompt-authoring decision
with axis-discipline implications, plan §7.1). Record as blocked, with the same
note against B3b.

## 5. Hard stops — halt and write the report

- Negative control returns "verified" (Phase 2).
- **Arm comparability, per A15 (supersedes the old >15-point rate rule):** still
  record the per-arm discard rate, but judge comparability by **recomputing the
  stance distribution over all attempts, including discarded payloads' stances**
  (from `calls-*.md`). Stop the probe only when the recount changes the reading.
  If a discard lands on a *pre*-stance field or carries no readable `stance`,
  fall back to the >15-point rate rule. Note that under A16 the rejected-field
  leak no longer discards at all, so most of what used to trip this stop cannot
  recur.
- **Total calls reach 600.** The full program is ~400; 600 means something is
  looping. Log what remains unrun.
- **You cannot reconstruct an earlier phase's reasoning after a compaction.**
  Re-read `RUNLOG.md` first; if it still does not hold together, stop.
- Selftest fails, or any response shows `foreign_tool_uses > 0` (§3 rule 2 —
  structurally impossible on this transport; if it fires, the transport changed).
- **A baseline saturates on the stance the block is predicted to push toward.**
  That is A9's real ceiling and no N fixes it — re-author the stance set (Phase 0)
  rather than spending calls. Saturation on any *other* stance is fine (A14).

## 6. Power check — run this before choosing N

```js
const C=(n,k)=>{if(k<0||k>n)return 0;let r=1;for(let i=0;i<k;i++)r=r*(n-i)/(i+1);return r;};
// arm1 = baseline (a hits, b misses), arm2 = live (c hits, d misses)
const fisher=(a,b,c,d)=>{const n1=a+b,n2=c+d,F=b+d,N=n1+n2;let p=0;
  for(let k=b;k<=Math.min(n1,F);k++)p+=C(n1,k)*C(n2,F-k)/C(N,F);return p;};
// e.g. baseline 50% vs live 100% at n=10 → p≈0.016 (fine)
//      baseline 80% vs live 100% at n=10 → p≈0.237 (underpowered — this is A9)
```

## 7. What you must not do

- **No blind coding tonight — deliberately dropped.** B3a exists to stop a human
  talking themselves into a coded result, and it earns its keep when a
  configuration is written up as a verdict card, not during a search where a wrong
  read costs one cheap re-run. The stance column is a categorical output the model
  emitted; counting it is not a judgment. If a probe's stance column separates, the
  belief column is colour — report it, flag that you coded it yourself, move on.
  Revisit B3a before anything goes in the spec.
- **Do not issue verdicts.** gate / texture / drop is a human call at spec
  compile with the card in front of them (§9.3), and ambiguity defaults to
  texture. Fill the verdict card's evidence rows; leave the verdict blank.
- **Do not enact `A#` amendments.** 민서 reviews each mechanism here, one by one.
  Write findings as **proposed** amendments in the run log under a
  `### A?-proposed · …` heading. The exception: if a finding changes how the *next*
  phase must be built, act on it and say plainly at the top of the entry that you
  did, and why.
- **Do not report a rate without its N or its raw sequence** (§9.2).
- **Do not call 3/3 or any small-N unanimity "verified"** — it is consistent with
  a true rate near 37% (§5.4).
- **Do not edit or delete an artifact, and never use `--force`.** Discarded and
  failed runs stay in place, flagged (§3 rule 5). A re-run gets a new experiment
  id.
- **Do not edit the plan or the spec.** Findings go in `RUNLOG.md` as new dated
  entries and new `A#` amendments. Append, never rewrite.
- **Do not put plan text, scenario internals, or prior results into suite
  slots** (§3 rule 3). The call gets the composed payload and nothing else.
- **Do not touch `main`, do not open a PR.** Commit to the current branch after
  each phase, message `test(dday): <phase> — <one line>`.
- **Do not start the interference axis (Phase 8) unless Phases 1–7 completed.**
- **Do not author a reporter template** (see E-CONT above).
- **Do not present 윤석's line as settled.** Every C-STRUCT-line artifact carries
  `authored unattended, pending review`.

## 8. The morning report

Write `planning/dday-mechanism/runs/OVERNIGHT-<YYYYMMDD>-summary.md`, and keep it
to one page:

1. **Headline** — did anything halt the program? (Phase 5 first.)
2. **One section per mechanism, in phase order** — 민서 reviews them one at a
   time, so each must stand alone: the experiment id to pass to
   `read-mechanism-run`, the arms, raw sequences, N, discard rate, and p where
   computed. Sequences, never rates alone. Say which stance each label maps to;
   a bare `c,c,d` is unreadable a day later.
3. **What each result licenses**, one line each — and explicitly, what it does
   not.
4. **Diagnosis chains** for anything that failed or got dropped (§6.1).
5. **New `A#` amendments** written, with one-line reasons.
6. **Blocked / unrun**, with why — including anything needing a human: blind
   coding, verdicts, the reporter template, E-CONT, negative-control ownership.
7. **윤석's line** — a separate short section listing every C-STRUCT-line result
   with its authoring choices spelled out, so he can reject the authoring rather
   than inherit it.
8. **Total calls spent**, and how far through the 8 phases you got.

Append the same run entries to `RUNLOG.md`. The summary is for the morning; the
run log is the durable record.
