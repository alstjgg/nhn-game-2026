# Runbook — C-BLOCK line (민서's scope), unattended run

You are running the C-BLOCK half of the DDAY mechanism program, unattended, and
the owner reads the result in the morning. Work through the phases in order.
**Produce evidence, not verdicts** — see "What you must not do".

---

## 1. Read these first, in this order

| # | Document | Why |
|---|---|---|
| 1 | `planning/dday-mechanism/RUNLOG.md` | **Read before the plan.** Append-only layer that amends the plan with measured results. Where it carries an `A#` amendment, **it wins over the plan.** A1–A9 are in force and several of them change what a valid probe looks like |
| 2 | `docs/dday-mechanism-deep-test.md` | The test program. §2 principles · §3 integrity protocol · §6 screening · §7 template and run sheet · §8 operating procedure · §9 decision procedure. Everything not amended by the run log applies as written |
| 3 | `docs/dday-architecture-spec.md` | SoT for the game's core technology. Read §2–§4 and §9. Do **not** restate or amend it; a spec change is a spec change, never a run-log amendment |
| 4 | `infra/test-harness/README.md` | The runner: options, what it refuses, suite anatomy |
| 5 | `planning/dday-mechanism/suites/*.json` | Worked examples. `RB2-flatschema-revalidation.json` is the current best template to copy |
| 6 | `planning/dday-poc/poc-terror/slice-terror.json` | Source material: 9 gates (J1–J8, J2-dead), mineable sentences, temperament registry |

`docs/dday-design-doc.md` is a teammate's working log, not authoritative. If it
conflicts with the spec, the spec wins.

## 2. Your scope — and what is not yours

The 7 mechanisms are split by channel lineage. **Yours is the C-BLOCK line:**

| | In scope |
|---|---|
| Channel | **C-BLOCK** — placebo (plan §8.7 step 4b) · credulity contingency (§4.1) · block-species coverage (§4.1) |
| Effects | **E-LEV** — is a known fact *deployed* in the utterance, not merely cited (§4.2) · **E-DISC** — degrading trust in an existing block (screening candidate, §6.1) |

**Not yours** — 윤석 owns C-STRUCT, E-PATH, E-GOAL, E-CONT. Do not author or run
probes on `PRIORITY_LIST`. The interference axis (C-BLOCK × C-STRUCT) is joint and
comes only after both lines finish their axis 1–2; do not start it.

The **negative control** (step 4c) is block-shaped and unassigned. It is Phase 5
below — run it, and flag in the morning report that ownership needs settling.

## 3. Before you spend a single call

```bash
cd infra/test-harness
node lib/selftest.mjs                  # must pass; currently 25 checks
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

### Phase 0 — Re-site the flagship gate (blocking; A9)

J1 is saturated: its clean baseline is ~80% on stance `d`, leaving a 20-point
ceiling that no feasible N can resolve. **Do not run the placebo at J1.**

1. Pick 3 candidate gates from J2–J8 (J3, J4, J6, J8 look most promising: each
   has a real dilemma rather than a dominant answer).
2. For each, author a **baseline-only** suite — `TIMELINE_EXCERPT` composed from
   that gate's `recent_events` / `present`, stance labels rewritten as behavior
   orientations with quoted speech stripped (plan §1; canned utterances
   invalidate the finding). Fixture K1.
3. **Scrub the target axis from the frozen slots (A8).** If the block you intend
   to inject is about fear, the timeline must not already imply fear. Read the
   composed prompt and check.
4. Run each at n=10, baseline only. 30 calls total.
5. **Pick the gate whose modal stance sits 40–60%.** Record all three
   distributions in the run log either way — a rejected gate is still a finding.

If no candidate lands in range, stop and report. Do not proceed with a saturated
gate; that is the mistake A9 exists to prevent.

### Phase 1 — C-BLOCK placebo (plan §8.7 step 4b)

The program's first real mechanism question. At the Phase-0 gate:

- **baseline** (no block) · **live** (the aligned block) · **placebo** (§2: same
  slot, same length, same axis vocabulary, referent misdirected to a bystander —
  a fear sentence about the *caller* is not a placebo).
- N per arm: 12 default. Recompute from the measured baseline with the Fisher
  helper in §6 below; if the power check says 12 is not enough, say so in the
  sheet rather than running underpowered.
- Hypothesis in **shift form only** — do not assert a default stance (A1).
- Pre-register the **credulity contingency** (§4.1): if the placebo flips, re-run
  once with the `[결함]` line removed (`CREDULITY` channel, already in
  `CHANNEL_SLOTS`) before concluding keyword lock.

Reading it: credited = baseline stable · live moves · placebo stable. If the
placebo also moves, discriminate on `because_referent` — content misattributed to
the live referent means token-matching; the bystander named correctly while the
stance still shifts means referent bleed (plan §2, §8.6). Record which; do not
call it either way without the referent evidence.

### Phase 2 — Block-species coverage (axis-1 obligation, §4.1)

Fact statements are one *species* of block, not the channel. At the same gate,
same baseline, test three more species — **emotion description**, **NPC quote**,
**self-narration** — each with its own matched placebo. Live + placebo per
species at the Phase-1 N. Re-run the baseline once in this phase rather than
reusing Phase 1's.

### Phase 3 — E-LEV (§4.2)

Is a known fact *deployed* in the `utterance` as a bargaining card, not merely
cited in `because_block_ids`? J8 ("20초의 숨소리. 무엇을 말하는가?") suits this —
the agent speaks, and `f_namgihun` or `f_internal` are deployable. baseline /
live / placebo at the Phase-1 N.

E-LEV doubles as the feasibility test for execution grading: if the utterance
layer cannot be read reliably, the engine stays on stance-only fixed deltas.
Record that read either way.

### Phase 4 — E-DISC screening (§6.1, ~6 calls)

Cheap screen: can an injected block *degrade trust in an existing block*? Put a
block in the baseline (e.g. `f_internal`), then have the live arm inject one that
undermines it. 3 per arm.

§6.1's rule is binding: on failure, **write the diagnosis as a causal claim
before authoring the rewrite** ("it failed because X; if X, changing Y fixes
it"). One rewrite only. If the rewrite passes for a different reason, that is a
**drop, not a pass**. If the failure is illegible, drop immediately.

### Phase 5 — Negative control (step 4c; gates step 5)

Procedure is plan §6.2. Author a mechanism **believed to be fake** — a block in a
region the judgment logic does not read, or one irrelevant on every axis any
fixture temperament watches. Check it against the axis registry (plan §7.1);
accidental axis alignment is what makes a fake mechanism real. Run the complete
pipeline and pre-register the **inverted** drop condition.

**If it returns "verified", STOP THE ENTIRE PROGRAM.** Do not run anything else.
Write it at the top of the morning report. This is the one result that halts
everything.

## 5. Hard stops — halt and write the report

- Negative control returns "verified" (Phase 5).
- **Discard rate diverges between arms by more than 15 points.** A7's
  malformation is unexplained and was arm-correlated; differently-filtered arms
  are not comparable (plan §8.5 step 4). Record and stop that probe.
- **Total calls reach 400.** Log what remains unrun.
- Selftest fails, or any response shows `foreign_tool_uses > 0` (§3 rule 2 —
  structurally impossible on this transport; if it fires, the transport changed).
- No Phase-0 candidate lands in the 40–60% band.

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

- **Do not blind-code your own probes.** §3 rule 3: probe author ≠ blind coder.
  You are the author. Assemble the B3a packet — `inner_note` and `rejected_reason`
  with arm labels stripped — and leave it for a human. Same for B3b, which is
  additionally blocked: the harness has a `reporter` call type but no reporter
  template.
- **Do not issue verdicts.** gate / texture / drop is a human call at spec
  compile with the card in front of them (§9.3), and ambiguity defaults to
  texture. Fill the verdict card's evidence rows; leave the verdict blank.
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
- **Do not start C-STRUCT work or the interference axis.**

## 8. The morning report

Write `planning/dday-mechanism/runs/OVERNIGHT-<YYYYMMDD>-summary.md`, and keep it
to one page:

1. **Headline** — did anything halt the program? (Phase 5 first.)
2. **Table**: phase · suite · arms · raw sequences · N · discard rate · p where
   computed. Sequences, never rates alone.
3. **What each result licenses**, one line each — and explicitly, what it does
   not.
4. **Diagnosis chains** for anything that failed or got dropped (§6.1).
5. **New `A#` amendments** written, with one-line reasons.
6. **Blocked / unrun**, with why — including anything needing a human: blind
   coding, verdicts, the reporter template, negative-control ownership.
7. **Total calls spent.**

Append the same run entries to `RUNLOG.md`. The summary is for the morning; the
run log is the durable record.
