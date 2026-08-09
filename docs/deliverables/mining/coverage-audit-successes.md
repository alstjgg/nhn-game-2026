# Coverage Audit — Did the failure-weighted bias under-sample WINS?

**Read-only audit, dated 2026-08-05.** No atom file was modified; this document is the
only artifact written. It measures valence balance across the already-mined corpus
(`atoms-S1.md` … `atoms-S9b.md`, 835 atoms) to inform a re-sweep decision. It is a
measurement, **not** a re-mine.

## Method

Each atom was placed in exactly one bucket from its `tension` / `event` / `flags`:

- **WIN** — a success, an impressive/valuable AI output, a capability that worked, a
  discovery worth adopting, a measurement that produced a usable positive finding.
- **LIMIT** — a failure, reversal-because-wrong, human-override/rescue, a boundary the
  AI couldn't cross, fabrication, or a cost/shortcoming.
- **NEUTRAL** — descriptive process / architecture / convention / provenance with no
  clear win or limit valence.

Classification is judgment-based and approximate; the ratios and skew *directions* are
the load-bearing output, not per-atom precision. A deliberate rule was applied to the
big ambiguous class — pure design-record / "boundary" rules (architecture, membrane,
directory layout, language-of-record) were scored **NEUTRAL** unless the tension
foregrounded either a concrete positive outcome (WIN) or a concrete AI shortcoming
(LIMIT). This is conservative: it keeps WIN reserved for genuine positive evidence and
does not inflate either side.

## Per-slice table

| Slice | Atoms | WIN | LIMIT | NEUTRAL | WIN:LIMIT |
|-------|------:|----:|------:|--------:|----------:|
| S1 — concept phase | 56 | 8 | 17 | 31 | 0.47 |
| S2 — PoC / fabrication incident | 70 | 21 | 17 | 32 | **1.24** |
| S3 — RUNLOG mechanism program | 65 | 13 | 21 | 31 | 0.62 |
| S4 — planning minutes / handoffs | 74 | 3 | 10 | 61 | 0.30 |
| S5 — super-pipeline game-mod record | 41 | 2 | 11 | 28 | 0.18 |
| S6 — status/spec/CLAUDE.md consolidation | 198 | 11 | 20 | 167 | 0.55 |
| S7 — data/ + artifacts/ prose | 19 | 1 | 0 | 18 | n/a (no limits) |
| S8 — commit-history mining | 62 | 2 | 24 | 36 | 0.08 |
| S9a — unit-PR review threads | 93 | 1 | 40 | 52 | 0.025 |
| S9b — final-panel review + PR history | 157 | 3 | 62 | 92 | 0.048 |
| **CORPUS TOTAL** | **835** | **65** | **222** | **548** | **0.29** |

Corpus reads roughly **3.4 LIMITs per WIN**. LIMITs outnumber WINs in every slice
except S2. The finding is consistent with the old "failures over successes" bias: wins
were captured when they were unavoidable (a p-value, a shipped milestone) but the
softer wins — capabilities that worked, techniques worth copying, the review method
*succeeding* — were largely recorded as NEUTRAL design-records or folded into the
LIMIT that they resolved.

## Slices most skewed toward LIMIT (re-sweep candidates)

### 1. S9a — unit-PR review threads (0.025; 1 WIN : 40 LIMIT) — SWEEP
The whole slice is "review caught a defect," each captured as a failure. The huge
under-sampled win is that **the multi-agent review panel demonstrably works** — it
repeatedly catches real defects a green suite passed. Present in source, framed as loss:
- **S9a-031** — Lead mutation-tests the tests and finds two mutations pass 92/92. Captured
  as "gate vacuous (failure)"; the win is *mutation testing as a verification technique
  that works* and became the panel's standard tool.
- **S9a-059** — six of eight jars cut across cell boundaries, caught by screenshot when
  tests were green ("테스트 GREEN ≠ 화면 OK"). Framed as the jar defect; the win is that
  *pixel-measurement review catches what unit tests structurally cannot*.
- **S9a-089** — the human mutation-tests an agent's own drift gate with its five mutations.
  Framed neutrally; it is direct evidence the *trust-inversion protocol works both ways*.
- **S9a-026** — a default JSON import that would ship the answer key, caught by executing
  the build. Framed as "fabrication-risk"; the win is *build-execution review holds the
  membrane*.

### 2. S9b — final-panel review + PR history (0.048; 3 WIN : 62 LIMIT) — SWEEP
Same shape as S9a in its review half, plus a PR-history half rich in neutral decisions.
Under-sampled wins:
- **S9b-038** — one seat approves, one requests changes, one accepts a documented residual
  on one PR: "the disagreement is the mechanism working, not failing." A clear method WIN,
  captured as `boundary`.
- **S9b-018 / S9b-027 / S9b-025** — the Lead's fixes verified by hand-played judge-pace
  runs and by mutation-testing the new guard (throw inside the shipped root → 66 tests red).
  The *defense-in-depth verification succeeding* is the win, buried under the defect it closed.
- **S9b-113** — the agent-arena LLM backend, membrane + no-secrets satisfied by construction,
  independently reproduced by a human as "verified working." A near-clean WIN, thinly stated.
- **S9b-167** — the scenario-factory loop caught an error it had itself introduced: a
  self-correcting authoring capability, captured as `measurement`.

### 3. S8 — commit-history mining (0.08; 2 WIN : 24 LIMIT) — SWEEP
Only two explicit wins (S8-040 p=0.00006; S8-041 C-BLOCK adopted) against 24 harness
bugs, security leaks, IAM failures and provenance smudges. Milestone/capability wins were
demoted to NEUTRAL "decisions":
- **S8-029** — the UI primitive layer *physically cannot build a text-entry control*; the
  membrane is enforced by construction. A design win, captured neutrally.
- **S8-050** — an 812-line Korean→English translation (the largest single deletion), i.e.
  an AI-executed capability, captured as `decision`.
- **S8-043 / S8-034** — the write-scenario skill (AI-as-creator made reproducible) and the
  pre-registered placebo-controlled experiment design — both worth-adopting practices,
  captured neutrally. Also **S8-001** (deploy verified day one) and **S8-032** (a fourth AI
  concept built, benchmarked, and shelved in one commit — raw AI throughput).

### 4. S5 — super-pipeline game-mod record (0.18; 2 WIN : 11 LIMIT) — SWEEP
The design record explains WHY the harness was modified, and the reasons are AI-limit
statements, so the *mods that work* read as rationale for limits.
- **S5-005** — a Game-feel/Juice review lens made to *compete for panel seats*, bounded by
  an evidence bar. A genuine design innovation worth adopting; captured as `design-record`.
- **S5-022** — provider failure never blocks the game (deterministic understudy for every
  call). A robust, copyable pattern; neutral.
- **S5-033** — "Personality is Prompt, trained skill is Skill, held object is MCP": the API's
  own ontology mapped onto the item system. An inventive design bet; neutral.
- (Wins already captured: S5-007 self-drafting deliverable, S5-028 8/8 live at ~6 cents.)

### 5. S4 — planning minutes / handoffs (0.30; 3 WIN : 10 LIMIT) — SWEEP (lighter)
Dominated by NEUTRAL decisions; genuine AI-in-planning and lane-4 wins sit unmarked.
- **S4-008** — the 07-24 minutes are a machine-processed artifact of a 91-minute recording:
  an AI-in-planning capability, captured as `artifact`.
- **S4-026** — two independently designed measurement programs converged (replication used
  as a decision standard). A methodological win, neutral.
- **S4-051 / S4-063 / S4-030** — demo_publish extension landing cleanly inside its timebox,
  and parallel-LLM drafting + human selection producing usable art and scenarios (lane 4
  working). Captured as `decision`.

## Slices where wins are already adequately represented (no sweep)

- **S2 — PoC / fabrication incident (1.24, WIN-rich).** Despite housing the corpus's worst
  failure (the fabricating subagent), the slice already balances it with mechanism-discovery
  wins: S2-017 (temperament is the control stick), S2-021, S2-028/S2-029 (the thesis gets its
  empirical statement), S2-039 (keep the LLM judge — accepted an off-script solution),
  S2-058/S2-068. **No re-sweep needed.**
- **S7 — data/ + artifacts/ prose.** Not LIMIT-skewed (zero LIMITs); it is a design-record
  slice. Its wins (S7-003 data-encoded fabrication firewall, S7-008 key-as-condition-class,
  S7-016 speaker-misattribution driven to zero) mostly sit as NEUTRAL design-records rather
  than being *mis-weighted toward failure*. A success-balancing sweep is **not** the right
  instrument here; at most a light re-read to promote clearly-adoptable techniques from
  NEUTRAL to WIN. **No failure-balancing sweep needed.**

## Borderline / optional

- **S3 (0.62)** and **S6 (0.55)** are moderately LIMIT-leaning but each already carries real
  wins (S3-016/S3-027/S3-028/S3-047; S6-037/S6-054/S6-121/S6-174) and, in S6's case, an
  enormous NEUTRAL design-record mass that is descriptive rather than failure-framed. A
  targeted pass to lift adoptable techniques out of NEUTRAL would help both, but neither is
  a priority next to S9a/S9b/S8.
- **S1 (0.47)** is mildly skewed; the concept-phase wins (S1-023 judge accepted an off-script
  solution, S1-038–S1-043 the membrane/lane-4 construction) are present. Low priority.

## Recommendation

Run a **success-oriented balancing sweep on S9a, S9b, and S8 first** (the review-thread and
commit-history slices, where the method *working* is the single largest un-mined win), then
**S5 and S4**. Skip S2 and skip a failure-balancing sweep of S7. Treat S3/S6/S1 as optional
NEUTRAL→WIN promotion passes. The corpus-wide 0.29 WIN:LIMIT ratio confirms the old bias
under-sampled wins materially; the re-sweep should target the specific atoms named above
rather than re-mining the sources wholesale.
