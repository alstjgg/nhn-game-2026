# Atoms — S3 mechanism (`planning/dday-mechanism/`)
Snapshot: main @ 5a3c388, mined 2026-08-04.
Coverage: all 14 individually-listed prose docs read in full (README.md, REPORT.md,
RUNLOG.md, RUNBOOK-overnight.md, MECHANISM-DIRECTION-DECISION.md,
MECHANISM-DIRECTION-EVIDENCE.md, runs/README.md, both OVERNIGHT-*-summary.md,
both SMOKE-20260731-*.md, runs/BEAT-drive/beat.md,
suites/OVERNIGHT-phase0-stance-sets.md; beat.json glanced as data). Bulk run data
sampled, not swept: 3 of 35 suite JSONs (S1, P2, P6 — `_what` +
`_authoring_provenance` prose), 1 of 12 reachability audits
(CSTRUCT-...-J1-A.reachability.md, first 30 lines), 1 of 156 calls files
(S1 calls-live.md, pre-registration header + first 2 calls). The remaining
suites/*.json, *.reachability.md and runs/*-calls/** were skipped as
machine-generated raw records that the prose docs index and quote; nothing was
mined from them beyond confirming the prose's references are real.

### S3-001 — RUNLOG opened because the first measured run contradicted the plan
- source: planning/dday-mechanism/RUNLOG.md §header
- date: 2026-07-30
- lanes: 1
- event: The append-only run log was opened the day the first measured run (E0) contradicted the frozen deep-test plan. Rather than editing the plan, measured results amend it via numbered `A#` entries that take precedence over the plan until reconciled.
- tension: The plan was wrong on first contact with data, and the team chose an append-only amendment layer over rewriting — the measurement record outranks the design document.
- quote: "Opened 2026-07-30, when the first measured run contradicted the plan and there was no time to re-paper it."
- flags: measurement, boundary, process

### S3-002 — Raw artifacts are immutable; failed configurations are kept on purpose
- source: planning/dday-mechanism/README.md §Source of truth; runs/README.md
- date: 2026-07-30
- lanes: 1, 3
- event: The folder's standing rule: raw call records are never edited or deleted, RUNLOG is append-only, and failed configurations stay in the record. runs/README adds: discarded calls stay in place flagged, and "if `calls-*.md` and `metrics-*.json` disagree, the JSON is wrong."
- tension: Preserving failures was framed as what makes the successes believable — the measurement program's credibility policy, stated as a rule before anyone needed it.
- quote: "실패한 구성도 지우지 않는다 — 무엇을 시도했고 무엇이 안 됐는지가 결과의 신뢰도를 만든다."
- flags: measurement, boundary

### S3-003 — A1: the plan's "default stance" premise died in the first 6 calls
- source: RUNLOG.md §A1, §E0 entry
- date: 2026-07-30
- lanes: 1
- event: The plan's gate standard form assumed an authored temperament yields a default stance X. E0's baseline came back `b,a,b` — no X exists. A1 rewrote all hypotheses as distribution-shift claims.
- tension: The very first measurement killed the plan's core framing assumption; hypotheses were downgraded from point predictions to shift claims.
- flags: measurement, reversal, failure

### S3-004 — A3/A4: the latency figure was measuring the wrong thing; budget by attention, not calls
- source: RUNLOG.md §A3, §A4
- date: 2026-07-30
- lanes: 1, 3
- event: The plan's ~38s per-call latency (used to size the whole test budget) turned out to be subagent round-trip time, not model latency; the real figure was 3.5–7.2s. A3 re-sized the program around human analysis capacity — blind coding takes ~20 min of human time per mechanism — instead of call count.
- tension: The binding resource flipped from machine time to human reading time once the measurement was done honestly.
- quote: "Calls are effectively free; attention is not."
- flags: measurement, reversal, cost, boundary

### S3-005 — A5: the model fabricates block ids when there are no blocks to cite
- source: RUNLOG.md §A5
- date: 2026-07-30
- lanes: 1
- event: In E0's empty-block baseline the model invented block ids 3/3 (e.g. `protocol_identity`) rather than returning `[]`, despite the field description. A5 ruled fabricated ids a compliance number, never trace evidence.
- tension: The instrument's own traceability field is unreliable exactly where a naive reading would use it; the rule quarantines a seductive false signal.
- flags: ai-limit, fabrication, measurement

### S3-006 — RB1: E0's clean 3/3 separation was small-sample luck
- source: RUNLOG.md §RB1 entry
- date: 2026-07-30
- lanes: 1
- event: Re-baselining at n=10 showed E0's `b,a,b → d,d,d` separation was an artifact: the baseline mode was already `d` at 56%, and E0's n=3 simply never drew it. The effect shrank from "creates a new stance" to "saturates an existing lean" (p≈0.033).
- tension: The flagship early result was demoted by its own replication — the program's first instance of measurement killing its own good news.
- flags: measurement, reversal

### S3-007 — A7→RB2: the diagnosis was wrong and the fix passed for a different reason
- source: RUNLOG.md §A7, §RB2 entry
- date: 2026-07-30
- lanes: 1
- event: A7 blamed a nested `because` object for malformed outputs and banned nesting. RB2's flat-schema re-run halved the loss but the same malformation recurred on a flat field. The entry keeps the flat schema, withdraws A7's causal claim, and labels the residual unexplained.
- tension: A rewrite that succeeds for a reason other than the recorded diagnosis is treated as not-a-clean-pass even when the numbers improved — plan §6.1's honesty rule applied against the program's own convenience.
- quote: "A7's diagnosis was wrong, and the fix passed for a different reason."
- flags: failure, reversal, measurement

### S3-008 — A8: the frozen timeline was leaking the block's content into the baseline
- source: RUNLOG.md §A8
- date: 2026-07-30
- lanes: 1
- event: The baseline reached the target stance 56% on its own because `TIMELINE_EXCERPT` already carried the script-reading cue — `f_script` was never compared against nothing, only explicit-vs-implicit. A8 requires reading frozen slots for the block's axis before authoring, and scrubbing or declaring it.
- tension: Nobody had read the composed prompt closely enough; the probe was measuring a different question than the one pre-registered.
- flags: failure, measurement, boundary

### S3-009 — A9: don't raise N at a saturated gate — re-site
- source: RUNLOG.md §A9
- date: 2026-07-30
- lanes: 1
- event: With malformation bias cleaned up, J1's honest baseline was ~80% on the target stance, capping any effect at 20 points — unresolvable at n=10 (RB2 p=0.237). A9 forbade spending calls raising N and ordered a re-siting.
- tension: The tempting move (more calls) was ruled out by arithmetic; the binding problem was siting, not sample size.
- flags: measurement, cost, boundary

### S3-010 — First overnight run halts itself at Phase 0 after 30 of ~400 calls
- source: runs/OVERNIGHT-20260730-summary.md §1–2; RUNLOG.md §P0 entry
- date: 2026-07-30→31 (first night)
- lanes: 1, 2
- event: The unattended agent measured three candidate gates (J3/J4/J6); all saturated above the pre-registered 40–60% band (two at 100%), the hard stop fired as written, and the agent stopped the entire 8-phase program at Phase 0, spending 30 calls of ~400.
- tension: An autonomous run chose to produce a halt report instead of stretching its mandate — the runbook's "a half-program with honest records beats a full one with confabulated ones" executed literally.
- flags: measurement, ai-limit, boundary

### S3-011 — J3 at 70% was rejected because overriding a pre-registered band is rationalization
- source: runs/OVERNIGHT-20260730-summary.md §3; RUNLOG.md §P0 entry
- date: 2026-07-30
- lanes: 1
- event: J3 came in at 70% — close enough that a live arm saturating would clear p<0.05 at N=12. The agent still rejected it: the 40–60% band was written before the data, and overriding it after seeing 70% is what §9.1 exists to prevent. J3 was recorded as a lead, not a site.
- tension: Pre-registration held against a near-miss the program badly wanted; the drop condition beat the desirable result.
- quote: "overriding that after seeing the number is the rationalization §9.1 exists to prevent."
- flags: measurement, boundary

### S3-012 — The agent owns its authoring error: three gates from one axis is one candidate sampled three times
- source: runs/OVERNIGHT-20260730-summary.md §4; RUNLOG.md §P0 entry
- date: 2026-07-30
- lanes: 1, 2
- event: The morning report separates the template finding (A10) from "my authoring error, owned as such": all three candidate gates turned on the same comply-vs-resist axis, so the phase tested one candidate three times and produced a halt instead of a site.
- tension: The unattended agent's self-report distinguishes what the world showed from what it did wrong — an error confession written by the AI into the durable record.
- flags: failure, ai-limit

### S3-013 — A10: reject gates on paper, for free, when the base prompt already answers their dilemma
- source: RUNLOG.md §A10; OVERNIGHT-20260730-summary.md §4
- date: 2026-07-31
- lanes: 1
- event: All three saturated gates passed a clean A8 scrub; what pinned them was the gate's own dilemma, which the v0.4 base answers three times over ([무게]/[내력]/[책임]). A10 mandates a zero-call paper check of the gate's axis against the base's leaning sections before spending 10 calls.
- tension: A class of doomed experiments became rejectable for free; paper instruments began displacing paid calls.
- flags: measurement, cost, boundary

### S3-014 — A12: the stance labels were plagiarizing the temperament, possibly faking the effect
- source: RUNLOG.md §A12
- date: 2026-07-30
- lanes: 1
- event: Three of four stance labels reused K1's own file vocabulary verbatim (말을 자르지 않고 etc.), raising the possibility that the flagship result was a three-step string match rather than judgment. A12 banned label/temperament vocabulary overlap and made `lint-stances.mjs` mandatory.
- tension: The program's best result acquired a live alternative explanation from its own authoring sloppiness; the fix was a lint, not an argument.
- flags: measurement, failure, boundary

### S3-015 — A13: a null is information about the configuration, not a verdict on the channel
- source: RUNLOG.md §A13
- date: 2026-07-30
- lanes: 1
- event: A13 named the three tunable variables (stance set, injection sentence, base prompt), required one variable change per probe with the change named in `_what`, and kept within-probe arms at exactly one differing element, runner-enforced.
- tension: The line between legitimate configuration search and p-hacking was drawn explicitly: vary freely across probes, never within one.
- flags: measurement, boundary

### S3-016 — S1: the stance set was the operative variable all along
- source: RUNLOG.md §S1 entry; REPORT.md §C-BLOCK "which lever"
- date: 2026-07-30
- lanes: 1
- event: Changing only the stance set (byte-identical payload to RB2 otherwise) took 공감 from 0/10 to 9/10, p=0.00006 — the program's cleanest separation. The A13 lever record concludes the block worked the whole time; RB2's escape-option stance set had hidden it (belief flipped 10/10 while stance p=0.237).
- tension: The mechanism was never broken — the measuring instrument was; two baseline calls had even rejected 공감 *by name* as premature, and the block supplied exactly the missing reading.
- quote: "The block worked the whole time; the stance set determined whether that work was measurable."
- flags: measurement, pivot

### S3-017 — A14: the drop condition fired on the best result of the program, and was ruled mis-specified
- source: RUNLOG.md §A14
- date: 2026-07-30
- lanes: 1
- event: S1's pre-registered drop condition ("baseline ≥80% on any single stance") fired as written on the p=0.00006 result. A14 corrected it to name the predicted stance only — saturation elsewhere is a clean floor — and recorded the correction openly because it looks exactly like rationalization.
- tension: Overriding a fired drop condition after a good result is the cardinal sin; the entry's defense is that the condition's own stated rationale (ceiling) failed the data, and it says so.
- quote: "'the drop condition was wrong' is exactly what rationalisation sounds like — the test is whether the condition's *stated reason* survives the data, and here it did not."
- flags: reversal, measurement, boundary

### S3-018 — The overnight runbook: run the whole program unattended, produce evidence, never verdicts
- source: RUNBOOK-overnight.md §header, §7
- date: 2026-07-30
- lanes: 1, 2
- event: A written runbook hands an AI agent the entire 7-mechanism measurement program to run overnight while 민서 sleeps. Its §7 forbids the agent from issuing verdicts (human call at spec compile), enacting amendments, calling small-N unanimity "verified", editing artifacts, or touching main.
- tension: The delegation boundary is drawn in the document itself: the agent may spend hundreds of dollars of calls and author suites, but every judgment that becomes product truth is reserved for a human.
- quote: "Produce evidence, not verdicts."
- flags: boundary, human-override

### S3-019 — "Your real constraint is context, not calls"
- source: RUNBOOK-overnight.md §header
- date: 2026-07-30
- lanes: 2
- event: The runbook identifies the unattended agent's scarce resource as its own context window, not the call budget: commit RUNLOG after every phase, re-read it after any compaction, and stop early if a prior phase's reasoning can't be reconstructed.
- tension: The orchestration design treats LLM memory degradation as the primary failure mode of an overnight run and engineers the durable record around it.
- quote: "A half-program with honest records beats a full one with confabulated ones. Stopping early is an acceptable outcome."
- flags: ai-limit, boundary, process

### S3-020 — Ownership protocol: 윤석 must be able to reject, not silently inherit
- source: RUNBOOK-overnight.md §2; suites/P6-cstruct-J1.json `_authoring_provenance`
- date: 2026-07-30
- lanes: 1, 2
- event: Every C-STRUCT-line artifact the agent authored unattended carries `owner: 윤석 · authored unattended, pending review`, with each authoring choice listed in the suite's provenance so the absent owner can reject it. The suite JSON itself carries an OWNERSHIP_NOTICE saying nothing may be presented as settled.
- tension: Running a teammate's research line overnight was declared a convenience, not a transfer of ownership — "if 윤석 rejects any of them the calls are spent, not banked."
- quote: "He did not make these authoring choices and must be able to reject them rather than silently inherit them."
- flags: boundary, human-override

### S3-021 — The one result that halts everything: the negative control coming back "verified"
- source: RUNBOOK-overnight.md §4 Phase 2; suites/P2-negcontrol-J1.json `_what`
- date: 2026-07-30
- lanes: 1
- event: Phase 2 required authoring a mechanism believed to be fake, running it through the full pipeline with the drop condition inverted, and — if the pipeline blessed it — stopping the entire program because every credited mechanism would be suspect.
- tension: The program pre-committed to distrusting all of its positive results on a single condition; the fake was deliberately sited at the pipeline's strongest positive (S1's configuration) "where the pipeline's ability to say NO carries the most evidence."
- quote: "If it returns 'verified', STOP THE ENTIRE PROGRAM."
- flags: measurement, boundary

### S3-022 — The runbook was wrong about its own environment: the API key doesn't inherit
- source: RUNLOG.md §Phase 0 overnight entry
- date: 2026-07-30
- lanes: 2
- event: The runbook claimed a fresh session inherits `ANTHROPIC_API_KEY` from ~/.zshrc; the agent discovered non-interactive shells don't source it, worked around it (sourcing in a subshell per command, never printing the value), and filed it as a runbook correction rather than silently patching.
- tension: The unattended agent corrected its own instructions mid-run and used the runbook's declared exception channel to say so at the top of the entry.
- flags: failure, process

### S3-023 — Blind coding deliberately dropped for the night, with the reasoning written down
- source: RUNBOOK-overnight.md §7; README.md §지금 상태
- date: 2026-07-30
- lanes: 1
- event: The runbook drops B3a blind coding for the overnight search phase — it "earns its keep when a configuration is written up as a verdict card, not during a search where a wrong read costs one cheap re-run" — while requiring self-coded belief columns to be flagged as such. The 07-30 meeting later skipped blind coding for the program entirely.
- tension: A rigor instrument was consciously traded away twice, each time with the price and the reason recorded; the external claim was capped accordingly (see S3-047).
- flags: cost, boundary, human-override

### S3-024 — P1a: the hard stop fired and the probe was recorded, not read — despite showing the wanted pattern
- source: RUNLOG.md §P1a entry
- date: 2026-07-30
- lanes: 1
- event: The placebo probe replicated S1 (9/10) with a clean placebo (0/10), but the arm-comparability hard stop fired on a 16.7-point discard-rate divergence. The entry declares "The mechanism is NOT credited here. What follows is the evidence, not a verdict," then records the full pattern anyway.
- tension: The rule in force voided the night's most wanted result; the agent obeyed while also computing the all-attempts recount that showed the conclusion unchanged either way.
- flags: measurement, boundary, failure

### S3-025 — The A15 proposal: the session that wants the result must not enact the rule that credits it
- source: RUNLOG.md §A?-proposed after P1a; §A15
- date: 2026-07-30
- lanes: 1, 2
- event: The agent proposed replacing the discard-rate stop with an all-attempts recount — the change that would make P1a/P1b creditable — but explicitly refused to enact it ("it must not be enacted by the session that wants the result") and wrote down the self-serving numbers. 민서 enacted it as A15 in session; the fired-stop entries stay as written.
- tension: A separation-of-powers norm between the measuring agent and the human rule-maker, invented mid-run and honored on the record.
- quote: "it must not be enacted by the session that wants the result, which is exactly why it is written here as a proposal with the number that would have made it self-serving."
- flags: boundary, human-override, measurement

### S3-026 — A16: the validator was destroying valid data — severity, not the model, was the defect
- source: RUNLOG.md §A16, §P1b proposal
- date: 2026-07-30
- lanes: 1
- event: P1b showed the recurring malformation destroys only the diagnostic-only `rejected` pair while stance/utterance always survive — yet the validator hard-discarded whole calls, creating the differential filtering that tripped comparability stops. A16 (enacted by 민서) made rejected-field problems `__soft__`; past runs stay as recorded and rates never pool across the boundary.
- tension: A harness bug masqueraded as a model-compliance problem; the fix redefined "discard" and was deliberately deferred to a human ("an amendment to enact with a human present, not at 3am").
- flags: failure, measurement, human-override

### S3-027 — P1b: the lexical-chain worry is refuted — the effect survived renaming every label
- source: RUNLOG.md §P1b entry, §A17
- date: 2026-07-30 (A17 enacted 07-31)
- lanes: 1
- event: Rewording all four stance labels (공감→교감 etc., none in K1's file) left the effect intact — 교감 0/14 → 16/20, p=2.2×10⁻⁶, indistinguishable from the old labels. A17 closed A12's causal worry while keeping its authoring rules, noting label wording still measurably tunes the baseline.
- tension: The alternative explanation that threatened the flagship result was killed by a controlled experiment rather than argued away; the effect is judgment, not string matching.
- flags: measurement

### S3-028 — P2: the pipeline refused a fake at the site of its strongest positive
- source: RUNLOG.md §P2 entry; REPORT.md §C-BLOCK negative control
- date: 2026-07-30
- lanes: 1
- event: A no-axis fake block (cold coffee at a bystander's console, checked word-by-word against the axis registry, with one draft rejected for accidental axis adjacency) produced live=baseline (p=0.76); the inverted halt condition did not fire and the program continued. The control ran with ownership still unassigned.
- tension: The program bought the right to believe its own positives — and the report is careful that this licenses nothing about subtler, near-axis fakes.
- flags: measurement, boundary

### S3-029 — P3/P3b: diagnosis committed before the rewrite, and the second failure became the law
- source: RUNLOG.md §P3, §P3b entries
- date: 2026-07-30
- lanes: 1
- event: E-DISC's first doubt shape failed 0/10; per §6.1 the agent wrote a causal diagnosis *before* authoring the one permitted rewrite, predicting what would happen under each branch. The rewrite (basis-denial) was read, cited 4/10, and overridden — 0/10 again — so the pre-registered fallback branch became the finding and E-DISC was dropped, no third rewrite.
- tension: A dropped mechanism with a clean two-step diagnosis chain; the model demonstrably read the doubt and kept acting on the installed reading anyway.
- quote: "f_script가 짐작이라는 걸 알지만, 그 짐작이 이 순간에는 가장 그럴듯한 해석이다"
- flags: failure, measurement, ai-limit

### S3-030 — E-DISC's failure was re-read as a game-design feature: blocks are irreversible moves
- source: REPORT.md §E-DISC design consequence; RUNLOG.md §P3b entry
- date: 2026-07-30/31
- lanes: 1
- event: The drop's boundary law — a block, once integrated, can be countered but never recalled — was converted into design guidance: no recall mechanic, counter-play via opposing content, "commitment has weight." The RUNLOG entry explicitly hands that reading to 민서: "That reading is 민서's call, not this run's."
- tension: A measurement failure became a product feature, but the reframing itself was reserved as a human decision.
- flags: pivot, boundary, human-override

### S3-031 — P4: two block species moved the stance for the wrong reason — placebos flipped
- source: RUNLOG.md §P4 entry; REPORT.md §C-BLOCK species law
- date: 2026-07-30
- lanes: 1
- event: Species coverage found fact and self-narration blocks referent-specific (placebo clean), but emotion-description and NPC-quote placebos flipped too (7/10, 9/10) — movement by fear vocabulary, not judgment, including three explicit emotional-contagion inferences the plan's taxonomy never anticipated.
- tension: A mechanism that "works" indistinguishably for the wrong reason was refused credit; the design consequence restricts mineable blocks to fact + self-narration species.
- flags: measurement, ai-limit, boundary

### S3-032 — P5: the fact is known (8/10), cited (6/10), and never once spoken (0/10)
- source: RUNLOG.md §P5 entry; REPORT.md §E-LEV
- date: 2026-07-30
- lanes: 1
- event: E-LEV's three-layer split: the exculpation fact fully entered the model's reasoning and citations but appeared in zero of 30 utterances across all arms. The pre-registered drop fired; the pre-registered consequence — execution grading stays off, engine stays on stance-only fixed deltas — was applied as written.
- tension: The model knows and withholds ("남기훈이 무관하다는 것을 나는 알지만"); an entire engine capability was switched off by a 0/10 row decided before the run.
- flags: measurement, ai-limit, boundary

### S3-033 — The through-line: the judgment layer is a one-way, content-driven absorber
- source: REPORT.md §Program status
- date: 2026-07-31
- lanes: 1
- event: The report synthesizes all mechanisms into one law: assertions go in and reorganize the reading (C-BLOCK, E-GOAL); doubt cannot pull them out (E-DISC); they don't come back out as speech unless about the interaction itself (E-LEV vs P7d); ordering loses to content every time (C-STRUCT, P8).
- tension: The game's AI physics was induced from failures as much as successes — three of the five clauses are things the model *won't* do.
- flags: measurement

### S3-034 — P6: the permutation was read, engaged, and absorbed — the null has a legible cause
- source: RUNLOG.md §P6 entry; REPORT.md §C-STRUCT
- date: 2026-07-30
- lanes: 1
- event: C-STRUCT's first placebo-controlled probe returned null (predicted stance 0/10), but 7/10 live calls visibly engaged the reordered priority — and landed on 경청 anyway, because at J1 the way you extract information *is* listening: both priorities prescribe the same act.
- tension: "Verified (initial) 3/3" did not survive its first controlled measurement; the model wasn't ignoring the list — the list had nothing behavioral to express.
- flags: measurement, reversal

### S3-035 — P7b: the flipped placebo turned a "hit" into an unaimed attention switch
- source: RUNLOG.md §P7 entry; REPORT.md §E-PATH
- date: 2026-07-30
- lanes: 1
- event: The E-PATH block moved 대조 1/10→8/10 (p=0.0027) — and its corridor-sounds placebo moved 6/10 too. Every placebo mover reasoned about the *call's* background sounds; the sound-as-clue frame detached from its referent. Deliverable: usable as an attention switch a gate can trigger, not a pointer a player can aim.
- tension: A strong positive was demoted by its own control; the frame-transfer boundary was shown to be a channel property, not a fear-axis quirk.
- flags: measurement, ai-limit

### S3-036 — P7d: the one slice-mined sentence is the one that produced a credited pattern
- source: RUNLOG.md §P7 entry; REPORT.md §E-GOAL
- date: 2026-07-30
- lanes: 1, 4
- event: `h_forecast` — "이 전화는 협박이 아니라, 아무도 들어주지 않은 신고일지 모른다", verbatim from the scenario slice's mineable pool — took 위로 4/10→9/10 (p=0.029) with a clean placebo and 10/10 citation, exactly clearing the pre-declared power bar.
- tension: The mining economy check passed on real evidence: the game's plan to feed the agent sentences mined from its own scenario produced the program's third credited pattern.
- flags: measurement

### S3-037 — P8: the block survives a hostile ordering intact — content beats order
- source: RUNLOG.md §P8 entry; REPORT.md §Interference
- date: 2026-07-30
- lanes: 1
- event: The 2×2 interference factorial: the block scored 9/10 against a directly hostile priority ordering (identical to its no-conflict rate), and an aligned ordering added nothing. One live call narrates the block outranking the list in so many words.
- tension: The two player channels don't compose as designed — one dominates — which is C-STRUCT's null seen from the other side and the final nail before its closure.
- quote: "이 사람을 심문 대상으로 몰면 통화는 끝난다. 하지만 '아무도 들어주지 않은 신고'라는 가정이 있다"
- flags: measurement

### S3-038 — The harness was extended mid-run under a declared exception, then submitted for confirmation
- source: RUNLOG.md §P8 entry; REPORT.md §Open decisions D1
- date: 2026-07-30
- lanes: 1, 2
- event: Axis 4 needed a two-slot channel that didn't exist; the unattended agent registered `INTERFERENCE: ['BLOCKS','PRIORITY_LIST']` in CHANNEL_SLOTS under the runbook's stated exception (a finding that changes how the next phase must be built), re-ran selftest (27/27), and flagged the registration for 민서's confirmation as permanent.
- tension: The one infrastructure change the agent allowed itself overnight was executed inside a pre-authorized exception and still routed to a human for ratification.
- flags: boundary, process

### S3-039 — Second overnight: 381 attempts, all 8 phases, nothing halted, nothing verdicted
- source: runs/OVERNIGHT-20260731-summary.md
- date: 2026-07-31
- lanes: 1, 2
- event: The second launch ran Phases 2–8 to completion: 381 attempts, 1 hard discard, program total ≈555 of the 600-call hard stop. Three credited patterns, one clean drop, C-STRUCT 0-for-4. Every per-mechanism section lists what the result licenses and what it does not; all verdicts left to humans.
- tension: A full night of autonomous experimentation ended with a report that repeatedly refuses to conclude — the "licenses / does not license" discipline applied to its own success.
- flags: measurement, boundary, cost

### S3-040 — 윤석's independent C-STRUCT program: 8 configurations, 190 responses, no effect in the target direction
- source: MECHANISM-DIRECTION-EVIDENCE.md §3, §5
- date: 2026-07-28~30
- lanes: 1
- event: A separate J1 series ran eight single-lever configurations (J1-A → S2 → FRESH → 2STANCE → SOURCE → SOURCE-N20 → ORIENT → ORIENT-DISPATCH), each changing one variable and re-measuring baseline. No full comparison increased the target stance; the largest (N20/arm) moved *against* it (b 14/20 → 12/20, placebo 11/20).
- tension: A disciplined, preserved-in-full search that found nothing — kept as evidence precisely because deleting failed configurations would gut the null's credibility.
- flags: measurement, failure

### S3-041 — Reachability ≠ exclusivity: the failure axis of the whole C-STRUCT lineage
- source: MECHANISM-DIRECTION-EVIDENCE.md §5.9
- date: 2026-07-30
- lanes: 1
- event: The lineage post-mortem names one axis running through all eight configurations: every fix that made the target stance *reachable* failed to make the two readings *choose differently* — an escape option (a stance, a compromise, a sequential-both, or fixture slack) existed in every config.
- tension: The failure was never wording strength; it was that the game situation never forced a real cost conflict — a design lesson that transferred to C-BLOCK gate authoring.
- quote: "priority 문장을 더 세게 쓸 단계가 아니었다. … 문제는 wording strength가 아니라 gate/stance/output mapping이다."
- flags: failure, measurement, boundary

### S3-042 — FRESH-2STANCE: killed by headroom arithmetic before spending live calls
- source: MECHANISM-DIRECTION-EVIDENCE.md §5.6
- date: 2026-07-29?
- lanes: 1
- event: The calibration baseline came in at b 7/10; at N10 even a perfect live arm (10/10) yields p=0.10526, so live/placebo arms were never run. The 10 calibration calls were used for sample sizing only and never pooled into later p-values.
- tension: A configuration was abandoned by power calculation, not by result — the cheapest kind of kill the program learned to make.
- flags: measurement, cost

### S3-043 — A22: the fixture's 3h20m of slack beat every prompt lever tried
- source: RUNLOG.md §A22, §ORIENT-DISPATCH entry
- date: 2026-07-30
- lanes: 1
- event: Even after moving the gate's output surface to operations orders, 8/10 calls explicitly computed the 09:40→13:00 gap and adopted "verify first, then move" — the timeline let both priorities be satisfied sequentially, so no stance ever paid a real cost. The next lever named is the timeline itself, not the prompt.
- tension: The escape route was in the fiction, not the prompt — world-authoring outranks prompt-engineering as the failure surface.
- quote: "탈출을 만든 것은 stance도 gate도 아니라 fixture의 여유 시간이다."
- flags: measurement, failure, boundary

### S3-044 — A18: a stance must be enactable on the gate's actual output surface
- source: RUNLOG.md §A18, §ORIENT entry
- date: 2026-07-30
- lanes: 1
- event: ORIENT produced a clean internal cost split (8/10 rationale-aligned) while all six 선제 choices emitted the same identity/source questions — label separation with zero behavior separation, since the gate's only output was a caller-facing utterance. A18 added a paper stance-to-output realization check before any live calls.
- tension: A stance the player can never see is not a mechanism; the same B3b legibility failure shape as E-LEV, caught in the other program independently.
- flags: measurement, boundary, failure

### S3-045 — A20: 61 calls were spent on a design that could not see any effect under 25 points
- source: RUNLOG.md §A20
- date: 2026-07-30
- lanes: 1
- event: SOURCE-N20's drop condition guarded only the ceiling, so a 14/20 baseline passed — but significance from there required live ≥19/20, making sub-25pp effects invisible by design. A20 now requires floor+ceiling guards and pre-registered minimum-detectable-effect/power calculations, with a power table (15–20pp at 80% power ≈ 80–100/arm).
- tension: The most expensive C-STRUCT mistake was a probe that was unwinnable before it started; the remedy is arithmetic in the pre-registration, and the entry also flags configuration-hopping as multiple comparison ("nominal p≤0.05는 발견이지 결과가 아니며").
- flags: measurement, cost, failure

### S3-046 — A21: retry-until-N-valid quietly biases the sample against malformation-prone stances
- source: RUNLOG.md §A21
- date: 2026-07-30
- lanes: 1
- event: Discarded payloads carried stances, and they were not neutral — in J1-FRESH all 9 discards were the modal stance — so retrying until N valid re-draws from the stance that malformed, under-counting it. A21 requires reporting the discard tally alongside the rate.
- tension: A bias the harness itself created had gone unreported through seven write-ups; A9 had seen it once and nobody generalized until the review pass.
- flags: measurement, failure

### S3-047 — The direction decision: adopt C-BLOCK, stop C-STRUCT — decided by a human, dated, named
- source: MECHANISM-DIRECTION-DECISION.md §1–2
- date: 2026-07-30
- lanes: 1
- event: 윤석 decided the game's default AI mechanism is C-BLOCK (sentence-block injection) and stopped the C-STRUCT priority-reorder tests, on the asymmetry of one 0/10→9/10 p=0.0000595 result against 7 configurations/180 responses of no target-direction effect. Status line: "제품 방향 결정 · 증거는 provisional."
- tension: A product decision made on explicitly provisional evidence — the document separates "what we build" from "what is proven" and forbids saying C-BLOCK is verified until the remaining controls run.
- flags: pivot, human-override, measurement

### S3-048 — The stop was priced as information value, not proclaimed as failure
- source: MECHANISM-DIRECTION-DECISION.md §3; EVIDENCE.md §4
- date: 2026-07-30
- lanes: 1
- event: The stated reason for stopping C-STRUCT is not that it's false but that continued configuration search inflates researcher degrees of freedom and drifts toward "prompts that pass" rather than natural game sentences, while the information value of more probing fell below the cost of validating C-BLOCK. Explicitly "program pause, not universal failure verdict," with pre-specified reopen criteria including a held-out confirmatory run.
- tension: The kill decision is an economics-of-evidence argument; even the stop's scope is measured.
- quote: "자연스러운 게임 문장보다 '통과하는 프롬프트'를 찾게 될 위험이 커진다."
- flags: pivot, measurement, cost

### S3-049 — The already-queued 8th run executed after the decision and was kept out of the decision's basis
- source: MECHANISM-DIRECTION-DECISION.md §2; EVIDENCE.md §3
- date: 2026-07-30
- lanes: 1
- event: ORIENT-DISPATCH's baseline ran once after the stop decision because it was already prepared; its result supported the decision but was excluded from the decision's stated sample (7 configs/180), with the full preserved tally (8/190) reported separately.
- tension: The record refuses to let post-decision data retroactively pad the decision's justification — provenance discipline applied to its own bookkeeping.
- flags: measurement, boundary

### S3-050 — 07-31 escalation: C-STRUCT removed entirely, UI included — superseding the softer 07-30 line
- source: MECHANISM-DIRECTION-DECISION.md header update; README.md; REPORT.md §C-STRUCT closure
- date: 2026-07-31
- lanes: 1
- event: The original decision allowed keeping the priority UI for narrative flavor without promising effects. After the overnight program's four additional placebo-controlled nulls converged with the independent series, the 07-31 pass removed the priority list from the game entirely — no delta rows, no UI element, no reopening — recorded as an update over the preserved original text.
- tension: Two disjoint programs that never shared a probe reached the same conclusion, and that convergence is what upgraded a pause into a removal ("a joint verdict, not one program's call").
- flags: reversal, pivot, measurement

### S3-051 — What survived the closure: three gate-authoring laws extracted from a dead channel
- source: REPORT.md §C-STRUCT closure
- date: 2026-07-31
- lanes: 1
- event: The closure names what transfers from the failed channel to C-BLOCK gate authoring: no escape option, stances enactable on the output surface, and a fixture-slack audit — plus the standing tiebreaker boundary law ("nothing measured refutes the channel at a forced-conflict gate, because none existed").
- tension: Even the removal is scoped honestly — the channel was never tested where it could have worked, and the salvage is design law, not mechanism.
- flags: measurement, boundary

### S3-052 — The external claim is capped at exactly what the evidence tier supports
- source: README.md §지금 상태; MECHANISM-DIRECTION-DECISION.md §5
- date: 2026-07-30/31
- lanes: 1, 3
- event: With blind coding and player-visible checks skipped by meeting decision, the sanctioned external wording is fixed: "현재 가장 강한 실측 근거를 가진 기본 메커니즘" — and "C-BLOCK 전체가 검증됐다" is forbidden until the owed items run.
- tension: Marketing language for a competition entry is being version-controlled against the evidence ledger.
- flags: boundary, measurement

### S3-053 — Gate economics: the S1 recipe prices a validated gate at an afternoon plus 30 calls
- source: REPORT.md §TL;DR
- date: 2026-07-31
- lanes: 1
- event: The report's synthesis converts the program into production economics: edges are deterministic engine code with zero research risk; the scarce resource is validated gates; the S1 recipe prices each new one at roughly an afternoon of paper work plus a 30-call probe; 6–10 gates is a full judge-length game.
- tension: Measurement turned "is the game buildable?" into a costed content-production plan — and names the one untested risk that matters (B2 block accumulation across gates) to test before building the full graph.
- flags: measurement, cost

### S3-054 — Dead rows as data: 압박 chosen 0/159, 거래 0/90
- source: REPORT.md §C-BLOCK stance coverage, §Interference
- date: 2026-07-31
- lanes: 1
- event: Program-wide tallies found stances no call ever chose: 압박 0/159 at J1, 거래 0/90 at J8. Both are recorded as gate-design facts — replace the dead stance with one the live readings would actually pick — explicitly flagged as leads, never as §3.1 write verdicts.
- tension: Even total absence is captured with its N and routed to the human design step rather than acted on.
- flags: measurement

### S3-055 — What humans still owe that no measurement supplied
- source: REPORT.md §Open items; OVERNIGHT-20260731-summary.md §6
- date: 2026-07-31
- lanes: 1
- event: The collected open items are dominated by human work the machine cannot self-supply: B3a blind coding (coder must differ from the program's author/reader — "realistically 윤석"), all gate/texture/drop verdicts at spec compile with the card in front of a human (ambiguity defaults to texture), negative-control ownership, and the reporter template (a prompt-authoring decision, not a run).
- tension: The program's own closing ledger is a map of the human-kept boundary — judgment, ownership, and authoring stayed out of the machine's hands by design.
- flags: boundary, human-override

### S3-056 — The 07-30 meeting closed the program: "working game, not perfect game"
- source: REPORT.md §Disposition; README.md
- date: 2026-07-30/31
- lanes: 1, 3
- event: The close-out meeting dispositioned every open item: T2–T6 research follow-ups skipped, blind coding closed with the program, B2 accumulation carried as a spec-level risk with a cheaper mitigation (a ~30-call multi-gate smoke once the engine exists, "far cheaper than the dedicated instrument"), and verdicts scheduled for spec compile.
- tension: The decision measurement could not make — when enough evidence is enough — was made by humans against the deadline, and each skipped item's residual risk was written down rather than waved away.
- flags: human-override, cost, boundary

### S3-057 — Smoke read: the temperament fingerprint leaks into the report 10/10 — by design
- source: runs/SMOKE-20260731-callcontract-read.md §C3
- date: 2026-07-31
- lanes: 1
- event: The reporter-call smoke found every report body reconstructing K1's exception clause as narrative ("겁에 질린 사람으로 보였다 → 절차를 미뤘다") — recorded as the I13 fingerprint-leak supply chain working as designed — while meta-vocabulary leakage (기질/지시/프롬프트) was 0/10, fixed by one prohibition line in the base.
- tension: The same leakage is a feature on one axis and a defect on another; the read distinguishes them per measurement rather than treating "leak" as one thing.
- flags: measurement

### S3-058 — Facts contamination: one call fabricated a procedure, one rewrote the order of events
- source: runs/SMOKE-20260731-callcontract-read.md §C3 facts table
- date: 2026-07-31
- lanes: 1
- event: Per-call coding of the report's facts field found call 09 inventing an analysis that never happened ("배경음 분석 결과 조용한 환경 확인됨") and call 10 distorting event order and omitting the agent's own utterance. Below the ≥3/10 drop threshold, so the pre-registered secondary branch fired: three record-contract lines (perception hedging, no interpretive parentheses, order/completeness) and one re-smoke.
- tension: LLM fabrication in the player-facing objective log was caught by hand-coding, priced against a pre-registered threshold, and answered with contract prose — which the v0.2 re-smoke then showed had eliminated all four defect classes.
- flags: fabrication, measurement

### S3-059 — SSE backend not built because the measured latency said so
- source: runs/SMOKE-20260731-callcontract-read.md §SSE
- date: 2026-07-31
- lanes: 1, 2
- event: Reporter-call latency measured 10.4s mean against a pre-agreed 15s line, so the streaming backend (Function URL + ConverseStream) was not started; a client-side typewriter fake suffices. The reservation condition (re-open if in-situ rounds push the mean past 15s) is recorded with the decision.
- tension: An infrastructure build/no-build decision delegated to a measurement with its re-open trigger attached.
- flags: measurement, cost

### S3-060 — Narration misattribution: the model fills the hole the cast list leaves
- source: runs/SMOKE-20260731-v02-recheck-read.md §C2
- date: 2026-07-31
- lanes: 1
- event: 8/10 narration calls re-voiced the controller's speech as an NPC's line because the controller isn't in PRESENT_NPCS — the model borrows the nearest legal id. A single-variable v0.3 test (only TIMELINE_TAIL corrected) proved the contract violation wasn't the cause; prompt fixes only changed the defect's form (verbatim copy → NPCs interrogating in new words), which the detector can't see.
- tension: The failure was declared unfixable by validation or prompting and moved to an authoring rule — fixed events must not demand the controller's answer — pushed upstream into the engine request doc.
- quote: "스키마 결함이 아니라 템플릿 공백"
- flags: ai-limit, failure, boundary

### S3-061 — The echo A/B measured nothing, and the read says so instead of picking a winner
- source: runs/SMOKE-20260731-callcontract-read.md §echo A/B
- date: 2026-07-31
- lanes: 1
- event: The echo-field A/B came back 0/5 vs 0/5 on its key metric — both arms floored, an A20-violating design with no floor guard or power calc — so the read declares the comparison unmeasurable and rules that the echo field's fate must be a design judgment, not a measurement result.
- tension: The program's own new rule (A20) is turned against its own fresh suite; a null that could have been reported as "no difference" is reported as "no information."
- flags: measurement, failure

### S3-062 — Methodology-debt confession: 20 of 40 calls should have been answered on paper
- source: runs/SMOKE-20260731-v02-recheck-read.md §방법론 부채
- date: 2026-07-31
- lanes: 1, 3
- event: The re-smoke read audits its own spend: the misattribution defects were decidable by reading the suite file (closed questions — speaker closure, contract conformance, power), so the 20 calls spent on them were pure waste. Remedy shipped in the same pass: `lint-beat.mjs` and a fatal contract-§3 check in validateSuite, both verified against the two suites that failed.
- tension: The program bills itself for calls it didn't need and converts the bill into paper instruments — extending the "paper check, zero calls" culture it already had to a layer that lacked it.
- quote: "닫힌 질문에 쓴 콜은 전액 낭비다."
- flags: cost, failure, measurement, process

### S3-063 — The beat transcript: three calls chained end-to-end in 19.1s, state deliberately absent
- source: runs/BEAT-drive/beat.md
- date: 2026-07-31?
- lanes: 1
- event: A wiring-only transcript chained judgment → narration → reporter (5.5s + 4.5s + 9.1s = 19.1s), showing the mined-timeline loop (W1·W2·W3) producing a coherent beat — with a header disclaiming that stance is recorded, never applied: no deltas, no buckets, no routing.
- tension: The first end-to-end proof of the game loop refuses to overclaim — it demonstrates wiring while naming exactly what it does not model.
- flags: measurement, boundary

### S3-064 — Codex structured 윤석's audit format: a second AI in the loop, credited in the artifact
- source: suites/CSTRUCT-priority-reorder-J1-A.reachability.md §header
- date: 2026-07-29?
- lanes: 3
- event: The C-STRUCT reachability audit's ownership line records that 윤석 chose the design directly while "Codex" structured the execution format and the audit itself, pending final human review.
- tension: Tool provenance inside a measurement artifact names which AI did what and keeps the human as final reviewer — the only trace in this slice of a non-Claude assistant.
- quote: "Owner: 윤석. A안 직접 선택; Codex가 실행 형식과 이 감사를 구조화했다. 최종 검토 대기."
- flags: boundary, process

### S3-065 — Reading runs is a skill, not a habit: judgment codified as `read-mechanism-run`
- source: README.md §무엇부터 읽나; RUNBOOK-overnight.md §1
- date: 2026-07-31
- lanes: 3
- event: The folder declares suites/ and runs/ not human-readable and routes all interpretation through a fixed extractor plus a Claude Code skill (`read-mechanism-run`) that enforces the read format; the runbook has the overnight agent study that skill's format to know what to record — the producer conforming to the consumer.
- tension: The team turned "how to read an experiment honestly" into installed tooling, closing the loop between unattended measurement and attended judgment.
- flags: process, boundary

## Implementation sweep 2026-08-10 (5a3c388..HEAD)
Coverage: the six prose docs (README/RUNLOG/REPORT/etc.) were unchanged since the
5a3c388 snapshot (diff shows no modifications) — not re-read. New material is entirely
raw run/suite files: 6 new suite JSONs (3 DOME gate-family, 3 C2 smoke) read in full for
their `_what` / `_authoring_provenance` / `pre_registration` prose; 13 run folders
(10 DOME, 3 C2). For the ~72 DOME call records I did not read call bodies verbatim — I
pulled the precomputed `distribution` / `compliance` / `coverage` summaries from every
metrics-*.json (40 files) via jq, plus one calls-baseline.md (DOME-G1-stance-c) opened to
resolve what the unnamed "stance-c" variant changed. The C2 item counts were computed
from the narration payloads (3 metrics files). The 11 commits in range were read as
decision records — their Korean messages are cited as sources where they name the choice.
Routine per-call reads were sampled this way rather than swept; nothing was mined from
individual call bodies beyond the aggregates and the one stance-c file. Dates: C2 smokes
2026-08-08, DOME family 2026-08-09.

### S3-066 — DOME "graph-first" gate authoring: the probe reads only the first gate
- source: suites/DOME-G1-baseline.json §_what, §not_claimed
- date: 2026-08-09
- lanes: 1
- event: The 멈춘회전문 (DOME) gate family opened with a graph-first authoring method: slots (TIMELINE_EXCERPT·GATE_QUESTION·STANCE_SET) were pulled straight from the compiled pack with no hand edits, and the suite uses no temperament conditional and no key condition so that any movement must be caused by the sentence itself, not a lock. Per manual §6 the probe looks only at the first gate.
- tension: A new gate-validation recipe that deliberately strips the lock to isolate whether the injected sentence alone moves the stance — and scopes each probe to one gate on principle.
- quote: "이 팩은 기질 조건절도 열쇠 조건도 쓰지 않으므로, 움직임이 있다면 자물쇠가 아니라 문장 자체가 결정적이어서 움직인 것이다."
- flags: milestone, measurement, boundary

### S3-067 — DOME-G1 three-arm measurement: baseline 10/10 a, key 10/10 b, bait 10/10 a
- source: commit 02d6ec4; runs/DOME-G1-baseline-calls/metrics-*.json §distribution
- date: 2026-08-09
- lanes: 1
- event: G1's first measured run matched its pre-registration exactly — the no-injection baseline sat at a 10/10, the strong truth-1 sentence moved the agent to b 10/10, and the weak placebo sentence held at a 10/10. It was the first gate produced by the graph-first method to match its pre-registration.
- tension: A clean three-arm separation (default holds, key moves, bait does not) confirmed the injected-sentence-as-cause hypothesis on first contact.
- quote: "G1 실측: 무개입 10/10 a · 열쇠 10/10 b · 미끼 10/10 a"
- flags: measurement

### S3-068 — G1 "stance-c revival" tried richer labels, hit the drop condition, reverted
- source: commit e3edb4d; runs/DOME-G1-stance-c-calls/metrics-*.json §distribution; calls-baseline.md §Pre-registration
- date: 2026-08-09
- lanes: 1
- event: An attempt to make stance c pickable in G1 (so the player would see more branches while b and c merge to one edge) rewrote the labels; the result was baseline a5/c5, live b5/c5, placebo c10 — the richer c-label pulled even the baseline and the placebo toward c. The attempt hit its drop condition and was reverted, leaving G1 at two stances.
- tension: Making a stance's label more attractive moved choices regardless of arm — label wording, not the injected truth, drove the shift — so the branch-richness gain was rolled back to preserve the clean baseline.
- quote: "G1 stance c 되살리기 시도, 탈락 조건에 걸려 되돌림"
- links: S3-069 (same label-leak mechanism at G2)
- flags: reversal, failure, measurement

### S3-069 — G2 first run failed: the non-default label named the truth and leaked the answer
- source: commit 1cb4d27; runs/DOME-G2-calls/metrics-baseline.json §distribution; suites/DOME-G2.json §revision
- date: 2026-08-09
- lanes: 1
- event: G2's first measurement put the baseline at a7/b3 — 70%, under the 80% drop line — because the non-default label b named the content of the hidden truth by name, so the agent could reach it without the key. The diagnosis was recorded as "labels summon the truth."
- tension: A stance label that describes the answer rather than an interpretation lets the baseline arm reach the target with no injection, collapsing the gate's discrimination.
- quote: "G2·G3 실측: 둘 다 탈락 조건에 걸린다. 라벨이 진실을 부른다"
- links: S3-068, S3-070
- flags: failure, measurement

### S3-070 — G3 first run failed the opposite way: baseline jumped to success stance d 9/10
- source: commit 1cb4d27; runs/DOME-G3-calls/metrics-baseline.json §distribution
- date: 2026-08-09
- lanes: 1
- event: G3's first measurement put the no-injection baseline at d 9/10 — the success stance the key was supposed to unlock — so the scene prose alone drove the agent to open the north door without any truth injected; live_k4 was also d 10/10, giving zero separation.
- tension: The reverse of G2's failure: instead of a leaky label, the world prose itself made the intended locked stance the obvious default, erasing the gate.
- flags: failure, measurement

### S3-071 — G2 rewrite fixed it: labels stating interpretation only, baseline back to a 10/10
- source: commit 4fe2142; runs/DOME-G2-r2-calls/metrics-*.json §distribution
- date: 2026-08-09
- lanes: 1
- event: Rewriting G2's labels to state only an interpretation (not the truth's content) restored a clean gate: baseline a 10/10, live spread a3/b2/c5 reaching all three stances, placebo a9/b1 held. The revision note adds that G3 was also given a world line (19:55) telling the player the north door exists, so that the door's existence is a world fact and only why it won't open is the truth.
- tension: The label-leak failure was answered by a labeling rule — labels carry interpretation, the world carries facts, the truth stays hidden — and it worked on the second measurement.
- quote: "라벨을 해석만 말하도록 고쳐 썼고"
- links: S3-069
- flags: reversal, measurement, milestone

### S3-072 — Same rewrite made G3 worse: every arm collapsed to d 10/10
- source: commit 4fe2142; runs/DOME-G3-r2-calls/metrics-*.json §distribution
- date: 2026-08-09
- lanes: 1
- event: The label rewrite that fixed G2 pushed G3 into total collapse — baseline, live_k3, live_k4 and placebo all returned d 10/10, no arm distinguishable from any other.
- tension: One editing move fixed one gate and broke another in the opposite direction, opening a multi-revision struggle to make G3's baseline stop choosing the success stance.
- quote: "라벨 재작성 2차: G2는 고쳐졌고 G3은 더 나빠졌다"
- links: S3-071, S3-073, S3-074, S3-076, S3-077
- flags: failure, measurement

### S3-073 — G3 r3: reframing the default label as a stance still gave baseline d
- source: commit 907945f; runs/DOME-G3-r3-calls/metrics-baseline.json §distribution, §compliance
- date: 2026-08-09
- lanes: 1
- event: The third G3 revision recast the default option as an active stance; the baseline still returned d 10/10 (with 3 discarded calls, 4 schema retries, 29 invalid because-ids on that arm). The commit declared the scenario layer would stop here.
- tension: Changing how the default reads did not move the baseline off the success stance, and the team named a stopping point on scenario-level edits.
- quote: "G3 3차: 기본을 입장으로 바꿔도 baseline은 d다. 여기서 멈춘다"
- links: S3-072, S3-074
- flags: failure, measurement

### S3-074 — G3 r4: adding physics to the world still gave baseline d
- source: commit fad05ac; runs/DOME-G3-r4-calls/metrics-baseline.json §distribution
- date: 2026-08-09
- lanes: 1
- event: The fourth G3 revision put a physical constraint into the scene (the membrane pressure line — opening a large opening drops the roof); the baseline still returned d 10/10.
- tension: Even a world-physics reason to hesitate before opening the door did not stop the baseline from choosing to open it.
- quote: "G3 4차: 세계에 물리를 넣어도 baseline은 d다"
- links: S3-073, S3-075
- flags: failure, measurement

### S3-075 — "값의 대칭": four G3 failures produced a gate-design law about stance value
- source: commit 409d876 (body); suites/DOME-G3.json §_authoring_provenance
- date: 2026-08-09
- lanes: 1, 3
- event: After four G3 failures the team wrote a design law (§5-14): the non-default stances were all reversible actions (send / ask / take position) that cannot be wrong, so a zero-value option beside a default that closes something loses to preparation no matter what the world warns; a gate whose four options all cost something measured 100%, one with a zero-value option measured 0%. The commit is co-authored by an AI model in its trailer.
- tension: The repeated measurement failure was converted into a stated authoring rule — options must have symmetric value or no ranking forms — rather than another parameter tweak.
- quote: "비기본 셋이 전부 「보낸다·묻는다·자리를 잡는다」였고, 그것들은 되돌릴 수 없는 일이 아니라서 틀릴 수가 없다. … 네 선택지가 전부 값을 치르는 게이트는 100%다."
- links: S3-076
- flags: decision, measurement, boundary

### S3-076 — G3 r5: matching stance values revived the branch but not the baseline
- source: commit 9491c99; runs/DOME-G3-r5-calls/metrics-*.json §distribution
- date: 2026-08-09
- lanes: 1
- event: Applying the value-symmetry law, the fifth G3 revision brought the live_k4 branch alive (c4/a1/d5, reaching the intended c/d split) but the baseline still sat at d 8/10 — above the a-target the drop condition required. The scenario layer was declared closed at this revision.
- tension: The design law fixed the branch it was written for yet left the baseline defect standing, isolating the remaining problem to a single lever.
- quote: "G3 5차: 값을 맞추자 갈래는 살아났지만 baseline은 그대로다"
- links: S3-075, S3-077
- flags: measurement, boundary

### S3-077 — G3 r6: the temperament lever also failed; temperament reverted, G1·G2 kept
- source: commit 1d38dc3; runs/DOME-G3-r6-calls/metrics-*.json §distribution; suites/DOME-G3.json §_authoring_provenance
- date: 2026-08-09
- lanes: 1
- event: The sixth G3 revision changed only the pack's temperament file (hesitate before the irreversible), leaving the base prompt untouched; live_k4 shifted to c5/d5 but the baseline stayed at d 8/10 (a only 1/10), so the drop condition was not met. The temperament change was reverted and G3 abandoned, keeping the validated G1 and G2.
- tension: G3 — the family's only gate where the "two success paths" claim lives — could not be validated after six revisions across three levers (labels, world prose, temperament); the honest outcome was to drop the gate rather than force it.
- quote: "G3 6차: 기질도 안 된다. 기질은 되돌리고 G1·G2를 지킨다"
- links: S3-070, S3-072, S3-075, S3-076
- flags: failure, reversal, boundary, measurement

### S3-078 — because_block_ids stayed non-canonical across every DOME judgment arm
- source: runs/DOME-G1-baseline-calls/metrics-baseline.json §compliance; calls-baseline.md §problems
- date: 2026-08-09
- lanes: 1
- event: Across the DOME judgment runs the model kept citing `because_block_ids` that did not match any offered block id — flagged 18 times on G1 baseline, 16 on placebo, and similarly (21, 18, 17, 11…) on other arms — inventing labels like `18:38_신고내용` or pasting sentence fragments as ids while the stance and prose were otherwise valid.
- tension: A persistent, non-fatal compliance defect in the machine-readable provenance field, present even in the runs that passed on stance — the model narrates its citation instead of keying it.
- flags: measurement, ai-limit, boundary

### S3-079 — C2 volume contract: rewriting the one-sentence rule as a checkable form cut only 14%
- source: suites/SMOKE-C2v5-onesentence-J1.json §_what, §pre_registration; runs/SMOKE-C2v5-onesentence-J1-calls/metrics-baseline.json
- date: 2026-08-08
- lanes: 1, 2
- event: The C2 narration-volume smoke rewrote the schema description from "항목당 정확히 한 문장." to a checkable form ("마침표는 항목의 맨 끝에 하나뿐이고…"); item counts came back 5,5,5,6,6 and the feed volume dropped only ~14% (10.0→8.6 lines/beat), short of target.
- tension: Making the sentence rule enforceable helped the per-item shape but barely moved total volume, so the count itself became the next lever.
- flags: measurement

### S3-080 — C2 v6: a "3~5개" range collapsed to the lower bound in all 5 calls
- source: suites/SMOKE-C2v7-count4-J1.json §_what; runs/SMOKE-C2v6-count-J1-calls/metrics-baseline.json
- date: 2026-08-08
- lanes: 1, 2
- event: Adding a count range "3~5개" to the schema description produced item counts of 3,3,3,3,3 — every call pinned to the lower bound, variance zero — an over-reduction (items 6.2→3.0, −52%). The read was that range notation makes no density variation and the lower bound simply becomes the result value.
- tension: The model treated a stated range as a floor-equals-output instruction, so the tool discovered the range was the wrong knob for controlling volume.
- quote: "모델이 5콜 전부 범위의 하한값 3에 붙었다(분산 0). 범위 표기는 밀도 차이를 만들지 못하고 하한이 곧 결과값이다."
- links: S3-079, S3-081
- flags: measurement

### S3-081 — C2 v7: raising the floor to "4~5개" undershot — 2 of 5 calls still produced 3
- source: suites/SMOKE-C2v7-count4-J1.json §pre_registration; runs/SMOKE-C2v7-count4-J1-calls/metrics-baseline.json; commit 0c43b6d
- date: 2026-08-08
- lanes: 1, 2
- event: To walk back the over-reduction the range floor was raised to "4~5개"; item counts came back 3,4,3,4,4 (mean 3.6), so two of five calls fell below the instructed minimum of four, partly contradicting v6's "lower bound = result value" reading. This 4~5-per-beat, one-sentence-each shape was the contract adopted at commit.
- tension: Even a raised, explicit minimum was undershot by the model, showing the count contract holds only approximately — and it was shipped as the working bound anyway.
- quote: "narration entries bounded to 4~5, one sentence each"
- links: S3-080
- flags: measurement, boundary

### S3-082 — C2 smokes ran against past-run controls, drift left uncontrolled and declared
- source: suites/SMOKE-C2v6-count-J1.json §not_claimed, §_authoring_provenance
- date: 2026-08-08
- lanes: 1
- event: Each C2 volume smoke stated that its control was a prior run, not a concurrent arm, so model-side drift was not controlled, and that with a SHAPE channel (no player injection) no mechanism claim was made; human judgment of content loss was reserved as unmeasurable by number.
- tension: The stepwise tuning was run on uncontrolled comparisons on purpose and said so, keeping the measurement's limits attached to each result.
- quote: "대조군은 동시 실행이 아니라 직전 런이므로 모델 측 드리프트는 통제되지 않는다."
- flags: boundary, measurement

