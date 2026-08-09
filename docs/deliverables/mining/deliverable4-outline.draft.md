# Deliverable #4 — outline (DRAFT)

Revised 2026-08-08 to the **director's decided section structure**. This maps
`theme-map-final.md`'s 82 themes onto that structure and turns the remainder into a
bounded element/mining list. Phase 3's `#4-role:` ranks stay in the map unedited; this
file is the overlay.

## Two director's rulings recorded here

1. **The `#4-role:` axis is overridden.** Phase 3 ranked on evidentiary weight and
   cross-lane convergence; this document's axis is **AI 도구·프롬프트·활용 내역**.
   Structural consequence, measured: of the 9 `spine` themes only 3 describe how AI is
   wired (T-01, T-14, T-28), while the six inventory-shaped themes (T-06, T-07, T-73,
   T-74, T-75, T-76) all sat at `supporting-anecdote` — four of them carrying
   `fit: #4 section` from Pass B. Single-lane, `THIN` themes lose on convergence while
   being the literally required content.
2. **The multi-agent review panel worked** (director, 2026-08-08). T-27 ("activity
   decayed to zero while its conventions persisted") is **not** overturned — it is
   **rescoped to the mined window**, which is defensible because Pass B's own header
   records the corpus boundary as fuzzy exactly where #110/#116 panel material sits.
   **Obligation this creates:** §4 must cite one concrete instance of review biting
   (`ai-utilization.draft.md` §A3.3 already holds it) and must say the decay observation
   is snapshot-scoped. Asserting it worked without either is the one move that would
   make the section attackable.

## How to read the section contents

Where the director's outline says a section **"will include"** something, that is
**additive**: the listed diagrams, code files and inventories are required *in addition to*
the themes mapped below, never in place of them. Nothing in the theme columns is dropped by
a director's list being shorter than it.

## Layer distinction

- **Themes** — `theme-map-final.md`. **Elements** — prompt text, diagrams, payloads,
  routing tables, counts. Stores: `ai-utilization.draft.md` (2 of 5 runs), `data/`,
  `assets-manifest.json`, the repo.

**Status keys:** `solid` · `oral-pending-sweep` (marker must not be lost) · `unmined` ·
`element-only` (no theme needed — go get it).

---

# 1. Overview — 아키텍처와 서론

ToC · introduction · **the 4-layer architecture with components**.

**Themes carried:** T-01 the membrane (stated here as the cross-cutting rule, demonstrated
in §2) · T-71 the distrust-spine, as the framing sentence that makes four lanes read as
one document · T-02 the illusion of freedom, one line only — the design goal the
architecture serves.

**Element manifest**
- 4-layer diagram with components `element-only`
- one-line-per-lane map so the reader knows what §2–§6 are
- honest limits stated once, up front rather than buried: the endpoint is public and
  unauthenticated ("origin checking is CORS, not security", S6-024), the concurrency kill
  switch ships unset (S4-074), no absolute monthly cost ceiling (S5-025)

Status: **solid**.

---

# 2. AI-in-Game

**Scope (director, 2026-08-08): the call inventory only.** This section is AI as a
*shipped runtime component*. Everything where AI was used to **derive** what ships — the
mechanism measurement program — is its own section, **§3 AI-as-Researcher**. The section
titles name *what AI was being used as*, not which subsystem the work concerns.

One-beat loop flow · multi-loop mining flow diagram · **call inventory** ·
**input/output payloads** · **runtime prompts** (deliverable-required).

**Themes — the runtime shape:** T-74 runtime proxy — Pages→APIGW→Lambda→Bedrock Converse,
stateless, secret-free, and the stack explicitly rejected (agents, RAG, memory, streaming,
always-on servers, browser-to-Bedrock), each on a named ground · T-75 prompts and tunables
as data; a zero-LLM deterministic compiler, because a silent paraphrase would break
vocabulary-aligned keys invisibly · T-52 every model call has a deterministic understudy —
the game is designed to survive the AI's absence · T-51 latency as a design input,
sidestepped by diegetic waiting · T-82 solvability and quality as schema/lint obligations:
open content, closed protocol

**Themes — the rules the payloads encode.** These stay here rather than travelling with
the measurement program, because each is *readable off the call inventory itself*:
T-03 truth belongs to the engine; the model performs and is fenced off the solution path
on purpose — visible in what the payload withholds · T-04 the AI physics was induced
empirically, and most of its clauses are things the model *won't* do — visible as
prohibitions in the prompt · T-05 three independent control axes — visible as payload
fields. **What they are is here; how they were derived is §3.**

**Element manifest**
- one-beat loop diagram · multi-loop mining flow diagram `element-only`
- call inventory + I/O payload schemas `element-only`
- **runtime prompt excerpts** — selection criterion from T-06: print the excerpts where
  *field order as contract* and *placement as a measured variable* are visible, not the
  longest template

**Bound that must be stated, not hidden:** no production-model in-play measurement exists.
Every mechanism result is sonnet/haiku over frozen fixtures; first Bedrock calls 08-04.

Status: **solid**.

---

# 3. AI-as-Researcher — 무엇을 만들지를 AI로 측정해서 정했다

*(Its own section by director ruling, 2026-08-08, placed between the runtime and the build.
AI used as a **researcher**: agents ran the probe suites that derived the game's AI physics.
The physics itself ships and is described in §2; this is how it was arrived at.
Chronologically it precedes both build phases — `planning/dday-mechanism/`, mid-to-late
July.)*

Separating it earns something the merged version could not say: **this is the only lane
where AI produced knowledge rather than artifacts**, and the discipline around it — a
program that generates numbers and then refuses to use them — is the least imitable thing
in the document. Buried inside "developer" it reads as tooling; standing alone it reads as
method.

**Themes:** T-38 the overnight delegation — an agent may spend the budget and author the
suites, but never issue a verdict · T-32 pre-registration held against the team's own
wishes · T-33 replication and placebo controls repeatedly demoted the program's own best
results · T-34 two independently designed programs converging is what licensed the
decision · T-36 admissibility — a program that produces numbers and then refuses to use
them, with the refusal encoded in tooling rather than willpower · T-72 under measurement,
over-convergence is as fatal as noise · T-37 nulls converted into design law: the dead
channel paid for the live one · T-13 provenance, not plausibility — the fabrication
incident and the criterion that caught it · T-08 "the model is honest" as a measured
negative result, and the two places it does not hold

**Element manifest**
- probe/suite counts; the C-STRUCT 0-for-4 and three-credited-patterns figures
- **owed single lookup:** did S3-052's controls ever run? It decides the exact wording #4
  is allowed to use about C-BLOCK — and #4 is itself outward-facing text about C-BLOCK
  (T-19)

**Bound carried from §2:** every result in this program is sonnet/haiku over frozen
fixtures. The program measured the model it could reach, not the model that ships.

Status: **solid**.

---

# 4. AI-as-Developer  ← 최대 섹션

The director's two implementation phases. **The phase split is itself a finding** — the
corpus cannot contain it (it postdates the snapshot), and for a document about *directing*
AI, "the orchestration mode changed under deadline, and here is why" is stronger than
pretending one mode ran throughout.

## 4a. Phase 1 — super-pipeline
Harness engineering · the workflow · the multi-agent panel review.

**Themes:** T-28 the specification is the orchestration instrument, and its primary reader
is an agent (the densest agreement in the map) · T-14 isolation must be structural, never
configured — forbidden states made unrepresentable · T-76 state lives on disk and GitHub,
never in a context window; anti-context-rot is what lets multi-hour autonomy exist · T-21
a review institution invented under a platform constraint · T-22 disagreement is the
mechanism — and the panel's independence has visible seams · T-24 the integration pass
catches a defect class per-unit review structurally cannot · T-23 loop-until-green has
four terminal states and three of them are not "fixed" · T-25 parallel-agent failure modes
shaped the architecture: seams before fan-out, frozen inputs, visible debt · T-30 the
harness was extended, never forked · T-26 the PR layer is where the orchestrator's own
failures surface · T-56 what the method cost, in the units the record actually kept

**Verification cluster** — T-09 trust inversion: a self-report is a claim, never evidence ·
T-10 "테스트 GREEN ≠ 화면 OK" and mutation testing as the antidote · T-11 execution beats
reading · T-17 anti-fabrication engineering: the design assumes the agent will claim
success

**Required by ruling 2:** cite the concrete instance of review biting, and scope T-27's
decay observation to the mined window.

## 4b. Phase 2 — manual parallel working
**Themes: none yet — this is the mode shift.** Measured 2026-08-08: the map was built with
117 post-snapshot commits outstanding; there are now **373 commits since 08-01, 260 since
08-04**, across ~PRs #150–#196, and the recent work is `playtest/*` waves and `claude/*`
single-session branches rather than harness runs.

Adjacent themes that reach into it: T-55 exploration got cheap enough to be disposable —
until the spec-first decree stopped it · T-48 where the human actually enters · T-47 the
human-kept list.

**RESERVED — Spec-driven Development: 결국은 인간 전문가가 중요하다.**
> 백엔드는 백엔드 개발자가 있어서 개발 명세가 명확했다 → 파이프라인도 금방 개발.
> 프론트엔드는 개발자가 없어서 온전히 AI에 맡겼다 → 파이프라인 24시간 이상, 완성품도
> 이상했다.
>
> **Zero atom support today.** Nearest neighbours are adjacent, not the same claim:
> T-28's **S9a-093** (units built against `tests.md` because `spec.md`/`design.md` were
> absent from the worktree — the agent-reader pipeline failed to deliver the documents it
> designed for), T-29 (writing the spec found the bugs), **S5-012** (frontend-mod v1,
> "governance without a rendered pixel", fully reversed).
>
> Path: **OH-6 first** (oral, free), then wall-clock for the three runs
> `ai-utilization.draft.md` never covered — `20260724-145432`, `20260725-153055`,
> `20260803-213143`. The 24-hour figure is an **element** and is measurable; the
> human-expert thesis is a **theme** and needs atoms.
> Status: **oral-pending-sweep.**

**Element manifest (§4 whole)**
- harness workflow diagram; wave/worktree topology `element-only`
- **harness prompts** — per-role mission statements, gate contracts → draft §A2.1/§A2.2
  `element-only` *(distinct from §2's runtime prompts and §7's before/after — three
  different prompt uses, do not duplicate)*
- agent-authored `[AGENT: …]` byline evidence → draft §A4
- per-run wall-clock and agent invocation counts → draft §A1.2/§A1.4
- the phase-2 shape: PR/commit counts, branch naming, wave structure `element-only`

---

# 5. AI-as-Creator

`/write-scenario` skill · data preprocessing code files · scenario preprocessing diagram.

**Themes:** T-41 AI generates candidates, deterministic code certifies them — the scenario
factory as a reproducible skill · T-40 generate many in parallel, a human picks, the
winner is frozen as data · T-42 measured model behaviour became a writer's rulebook —
authoring as physics · T-84 authoring for the machine, not the reader: fiction typed as
mineable ore, including deliberate poison · T-83 the one hand-authored file is the one
armored against typos — the pipeline's paranoia is aimed at the human · T-81 the AI
writer's deviation from the brief, kept as a gift · T-45 authored content outran the gates
that guard it · T-43 self-evaluation was made a required deliverable, and was insufficient

**Element manifest**
- the `/write-scenario` skill definition `element-only`
- preprocessing diagram; one draft → datapack → lint trace end to end
- the deliberate-poison example, quoted

Status: **solid** — the best-evidenced lane after lane 1, and the most immediately legible
as "AI 활용".

---

# 6. AI-as-Housekeeper

**Themes:** T-77 meeting records as AI artifacts — transcription → structured minutes,
human-corrected, sometimes absent · T-78 handoff documents have a lifecycle · T-79 project
state split by mutation-rate: a permanent charter (CLAUDE.md) and a freely-updated journal
(status.md) · T-80 agents draft design docs and specs to researched industry conventions;
the human directs by requiring rebuttal · T-15 normative lives in the artifact that can
enforce itself · T-29 planning documents audited like code, and the spec set drifted
against itself · T-50 dissent kept as a first-class column · T-62 provenance recorded as
data — legible and leaky

**Moved out, deliberately → §9.** T-61 (the process was engineered to leave evidence, and
the deliverable partly assembled itself) and T-63 (a repo-mined history is blind exactly
where the biggest decisions were made) do not belong under "housekeeper" — filed as chores
they read as chores. See §9.

Status: **solid**.

---

# 7. Utilizing AI — 어떻게 더 잘 쓰게 만들었나

**Section thesis (director-approved inversion):** 개선은 프롬프트를 잘 쓰게 되어서가
아니라, 고쳐야 할 것을 프롬프트 바깥의 구조로 옮겨서 왔다.

Required, or the section contradicts its own citations: T-07's thesis is literally
*"converted into a law rather than a better prompt"*, and T-06's counter-evidence closes
with **"No atom in the corpus claims prompt engineering was solved"** — the frozen template
was frozen around latent defects (S6-166: a clause silently making a conditional
unconditional across every arm).

**6a. 데이터 계약으로 규칙을 강제한다** — T-75 (balance-as-data extended to the AI layer) ·
T-82 (open content, closed protocol). Keep the leak: run-outcome thresholds lived
hardcoded in `src/` and hand-copied into seven test files, so a one-token drift flipped a
run clear→defeat while 1264 tests stayed green (S9b-015); a numeric-separator hole
(`8_000`) let a tunable launder past the no-inline gate (S9b-014).

**6b. 규칙을 프롬프트 밖으로 꺼낸다** — T-07 (the seven-item measured failure catalogue:
attribution inversion, vocabulary-axis blindness, speaker misassignment, contradiction
absorption, degenerate convergence, rational over-caution, contract-violating compliance) ·
T-06 (field order is a contract because generation is autoregressive; *placement* of a
rule is a measured variable; byte-identity as an acceptance criterion) · T-42

**6c. 모델을 측정으로 고른다** — T-73. Lead with the sharp fact: **the two live systems
reached opposite picks from the same measured-speed argument** (apothecary → Nova, DDAY →
haiku), because the binding constraint differed — and the decisive clause, *the shipped
model must be the model the mechanism was measured on, or the science is void.*

**6d. 비용과 지연** — T-54 ("calls are effectively free; attention is not") · T-53 the
judge's clock as the project's budget unit · T-51 · T-74's rejected-stack list

**6e. 개선이 굴러가는 방식** — T-16 incident → rule → gate → lint · T-12 the instrument was
the least trustworthy part of the system · T-64 refusal as an instrument: untested
capability is forbidden capability

**Keep the counter-case** — it is what makes this read as engineering rather than doctrine:
the team did *not* universally refuse AI in the pipeline. The LLM judge was kept (S2-039);
a blind-reader AI validated clue legibility (S1-053). "Code certifies, never AI" was
applied only where paraphrase is fatal.

**Element manifest**
- one **before/after** of a rule moving out of the prompt and into a schema or gate — the
  single most persuasive artifact in this section, and it does not exist yet as an excerpt
- template version history (v0.4 referenced at S6-166, never enumerated) — gather or drop
  the claim
- cost/latency figures `element-only`

---

# 8. What is left to the Human

**Themes:** T-46 the verdict stayed human — and agents judged feel anyway · T-47 the
human-kept list, and its rule: *work whose failure mode is silent* · T-48 where the human
actually enters — topology, arbitration, taste, "show me the evidence"; almost never code ·
T-19 claims fenced to what was tested · T-49 two humans reviewing each other: the manual-PR
adversarial channel · T-70 the membrane was a two-directors settlement, and the record
preserves the disagreement · T-60 nothing is erased — append-only, reversals annotated in
place, dead doctrine stays visible

**Must be timestamped, not stated as a constant.** The map is explicit that the boundary
*migrated*: blind coding was dropped, the V3/E5′ verdict was never delivered, an agent
rewrote NPC dialogue on taste grounds and it was accepted. OH-5 supplies the practice-side
instance the map lacked — a human played the Doodle Life demo to the end and killed the
track on a fun verdict, over a live technical rebuttal — **oral-pending-sweep**.

Status: **solid** with the migration caveat mandatory.

---

# 9. Ending — proposed

**TBD in the director's outline. Proposal: the reflexive close, plus the required
attribution appendix.**

**9a. 이 문서 자체가 방법의 산출물이다** — T-61 (the process was engineered to leave
evidence, and the deliverable partly assembled itself: the machine draft, the committed
mining directory, this outline) · T-63 (a repo-mined history is blind exactly where the
biggest decisions were made — with its two live instances, OH-4 and OH-5's
`dday-simulation` slug miss). Pass B proposed an entire new lane for this reflexive layer
and called it *arguably the centre of deliverable #4*. Ending on the method's own blind
spot is the most credible move available and costs nothing.

**9b. 외부 에셋 · 오픈소스 출처 — REQUIRED, and currently homeless.**
> `docs/competition.md` §4 requires **external asset / open-source attributions** as the
> deliverable's second mandatory element. It has no section in the decided outline.
> `assets-manifest.json` already carries **35 complete entries** (`file`, `tool`, `prompt`,
> `license`), so this is the one required half that is finished — dropping it would be an
> unforced error. Appendix is fine; absence is not.
> Add: models/services used at runtime and in the build.
> Status: **solid, element-only, no mining.**

---

# Carried to #3, not #4

`archive` is not a kill. True, evidenced, belongs to the intro/guide document:
T-65 (two people, three weeks, no artist — incapacity as an active design force) · T-66
(boundaries argued from other games' corpses and market data) · T-67 (the feared failure
mode was illegibility, not error) · T-69 (the team named the deliverable's thesis while
still choosing the game) · T-57 / T-58 (the concept funnel — and per OH-5 "three demos
built, none won" is retired: one track killed by a play verdict, one by a process accident,
one displaced by enthusiasm; the funnel did not select, attrition did) · T-68 (should the
machinery show) · T-44 (paper tests) · T-31 / T-59 · T-18 / T-20

---

# Remaining work this outline generates

| # | where | what | kind | cost |
|---|---|---|---|---|
| 1 | §4b | **OH-6** — the spec-driven / human-expert account, recorded as oral | interview | free |
| 2 | §4b | wall-clock + agent counts for the three uncovered runs | element | small |
| 3 | §4b | characterise phase 2 from the commit/PR shape (373 commits, ~#150–#196, branch naming) | thin-evidence theme | small |
| 4 | §2, §4, §7 | select and extract the three prompt sets against T-06's criterion — runtime · harness roles+gates · one before/after | element | small |
| 5 | §1–§6 | the diagrams: 4-layer, one-beat loop, multi-loop mining, harness workflow, scenario preprocessing | element | medium — the real cost |
| 6 | §3 | did S3-052's controls run? (decides #4's C-BLOCK wording) | single lookup | trivial |
| 7 | §4a | the one review-bit instance + T-27 rescoping sentence | element | trivial |

**Dropped by ruling 2:** the verdict census over #110/#116. It was the only expensive item
on the previous list.

**Not on this list, deliberately:** a general mining pass over the implementation lane.
373 commits since 08-01 and still growing daily is larger than the corpus that produced all
905 atoms, and it is a moving target two days from the deadline. Item 3 takes what that
material is actually needed for.

**Affordability.** With the deadline at ~08-10 and deliverables #2, #3, #5 plus
feature-completeness also outstanding, items 1–4, 6 and 7 are cheap; **item 5 (diagrams) is
the real cost** and is now the critical path for §1–§6. If the budget tightens, write §4b
from oral evidence carrying the `oral-pending-sweep` marker — a bank entry that loses that
marker launders oral into written, which this track has forbidden since Phase 1.
