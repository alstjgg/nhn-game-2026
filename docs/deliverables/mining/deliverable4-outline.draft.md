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

# 7. What we did to use AI better

> **This section is finished body text, not an outline.** §1–§6 and §8–§9 are still theme
> maps; §7 has been written and its slot holds the copy. Both element-manifest items it used
> to carry are resolved and now sit inside the prose — the before/after is §7-1's placement
> table, and the template-version claim was narrowed to what the tree actually holds
> (narration/reporter have an enumerable lineage; judgment was only ever committed at v0.4).
>
> Written in English to match `docs/` house style. The 08-09 submission-language decision
> stands — the judges read Korean — so this is the working master the PDF is produced from,
> not the final surface.
>
> `(S…)` markers are record ids. Each carries a commit hash, a PR number and a document
> section, so every sentence below reaches primary evidence inside this repository.

---

## First: what the AI does in this game

The AI is called three times per round. It looks at the situation and **decides what to
do**, turns that decision into **a scene a person reads**, and at the end of the day
**writes a report**. All three calls carry the same two things: what is happening right now,
and **a document describing who this character is**. The player cannot address the AI
directly. Picking sentences the game has already shown and slotting them into that character
document is the only way in.

So "using AI well" was never about handling a chatbot skilfully. It was about keeping **a
component that must be called the same way under the same conditions every time** in a state
where it can be measured.

The game was also *built* by AI agents working in parallel. The six items below are what we
actually did — inside the game (7-1 to 7-4) and on the build itself (7-5) — and the last one
(7-6) is what it cost.

---

## 7-1. When a rule did not land, we moved the rule rather than rewriting it

**Up front: we measured two fixes for the same defect side by side.** ① editing the prompt
text, and ② moving where the rule sits. Editing the text did not reduce the failure rate; it
only changed what the failure looked like. Moving the rule changed nothing about its wording
and took the failure rate from **8 in 10 to 0**. Since then, when a rule does not land we
look at placement before wording.

**The setup.** A scene in this game has **people in the room** and **a person speaking over
the phone**. The AI is asked to write how the people in the room react.

> **Observed** — the AI put **words spoken over the phone into the mouth of someone in the
> room**. **8 times out of 10.**
> **Traced** — re-measured changing one variable at a time. Not a data-format problem. The
> person on the phone was absent from the "characters present in this scene" list, so the AI
> **borrowed the nearest name it was allowed to use.** That borrowed name is a legitimate
> entry on the list, so no format check can see it.
> **Attempt ① — edit the prompt.** We rewrote the instruction and measured again. The defect
> did not go away; **only its shape changed.** Copying someone else's line verbatim became
> the people in the room interrogating the same content in fresh words — same rate, harder
> to spot. The verdict is in the record: **"this cannot be fixed by editing the prompt; push
> the problem upstream."** (S3-060)

**Attempt ②** — we left the rule's wording untouched and varied only where it sat.

| Where the same rule was placed | Violations in 5 |
|---|---|
| Written out in a constraint list, far from the data | **2** |
| The material grouped into 'in the room' / 'on the phone' before hand-off | **1** |
| The side marked on each character's own label | **0** (confirmed twice, independently) |

> **Decided** — *"a rule works when it sits next to the data it governs; in a distant
> constraint list it does not get read."* The placement that produced 0 was frozen into the
> scenario data format as a **required field** — every character carries 'in the room' or
> 'on the phone', without exception. The reason travels with the format: “this is not
> decoration … it is the only thing that drove this error to zero”. One commit shows it,
> using the game's own names for the two sides:
> `회선/상황실 구분을 페이로드 구조로: 화자 오배정 0/5` (PR #98)

The same thing happened one level down, at the level of individual words.

> **Setup** — a character's document carried the condition “if they appear **frightened**,
> soften your stance”.
> **Test 1** — we supplied the fact “the voice is a hired reader working from a script. It
> is not a **threat**”.
> **Result 1** — the condition did not fire. **It switched off** — "hired reader" reads as
> an indifferent agent, and an indifferent person is not frightened.
> **Test 2** — the same fact rewritten in the vocabulary of fear: “they are afraid of what
> happens to them if they stop reading”.
> **Result 2** — **fired 3 times out of 3.**
> **Decided** — *"negating one axis is not affirming another."* A fact moves a branch only
> when written in **the same family of words the condition is watching.** We now keep a
> register of which words belong to which condition, and a check blocks those words from
> leaking into the shared prompt. (S6-057, S6-090)

Both experiments taught the same thing. **When an instruction does not land, polishing the
instruction was mostly wasted effort. Changing where the instruction sits — the shape of the
data — worked.**

---

## 7-2. The prompt was managed as a component, not as prose

Whatever stayed in the prompt after that was treated like a part with a spec. Three rules.

**The order of the output fields is a contract.** A language model writes each token looking
at what it has already written, so the order of the output fields is the order of its
reasoning. Ask for "what you privately made of it" before "what you will do" and you get
deliberation; reverse them and the reasoning becomes justification for a decision already
made. Changing field order is therefore grounds for re-measurement — *"the entire
measurement programme ran on this arrangement."* (S6-117)[^a1]

**Every paragraph of the prompt carries the reason it has that shape.** The paragraph
describing two evacuation costs, for instance, deliberately **ranks neither** — with a
ranking in place, any later movement in the AI's judgement could never be separated into
*confirming* an existing disposition versus *causing* one. (S6-166)

**If the assembled prompt differs by one character, it fails.** The sentences a player slots
in are always sorted into the same order before assembly, whatever order they arrived in —
to claim an effect from the player's intervention, nothing but the intervention may differ.
When a second assembler appeared, we added a check comparing the two outputs character by
character, and then **tested the check itself**: we broke the assembler in nine different
ways and **8 of them turned the check red.** (S6-140, S6-027)[^a2]

The price of this discipline is on the record too. **What we froze, we froze together with
its defects.**

- One paragraph had been holding a character's conditional instruction **switched on from
  the start, in every arm of the comparison** — "if X then Y" was effectively "always Y".
  Found late, and replaced. (S6-166)
- The line “you can be deceived by false information” was recognised as possibly lifting
  the intervention group and the control group **together**. A 3-call re-run with that line
  removed was written into the plan **before any result came back**, so that nobody could
  claim afterwards to have expected the outcome. (S6-162)

---

## 7-3. We chose the model — and audited ourselves — by measurement

**Choosing the model.** Six days before the deadline a candidate model appeared that was
twice as fast. We measured three things and rejected it for three reasons; all of it is on
the record (S6-022).

| Measured | Candidate | Incumbent |
|---|---|---|
| Mean response time | **4.19 s** | 7.79 s |
| Generation speed per character | 6.60 ms | 7.23 ms — **a ~9% gap** |
| Compliance with the required length (20–30 sentences) | **12–16, short** | met |
| Quality of the report's first field | **copied the input line verbatim** | rewrote it as a record |

1. **It was not faster; it wrote less.** Most of the two-fold gap was the shortfall in
   length. Per character the difference is 9%. The same saving is available by telling the
   incumbent to write shorter — **so there was effectively nothing to gain by switching.**
2. **Quality was worse, not better.** It missed the required length and copied its input
   instead of rewriting it.
3. **Decisively, switching would have invalidated the experiments.** The 761 judgement calls
   that established the effect of player intervention all ran on the incumbent. Swap the
   model and those 761 calls guarantee nothing about the new one — **the thing we measured
   and the thing we ship become different objects.** Six days out there was no time to
   re-validate. Had the candidate been six times faster, the answer would have been the same.

**Auditing ourselves.** What the measurement programme distrusted most was not the model but
**the people doing the measuring**.

> **Found** — we were counting the AI's stance in four categories, and **three of the four
> category names reused wording straight out of the character document.**
> **Implication** — there is **no way to tell** whether the AI reasoned its way to that
> stance or simply echoed a word sitting in front of it. The project's strongest result had
> acquired a live alternative explanation.
> **Decided** — rather than argue the point, **we built a check.** If a category name and
> the character document share vocabulary, the run is refused. (S3-014)[^a3]

The same posture was applied to the tooling. We deliberately broke the prompt-comparison
check to see whether it would notice, and recorded the blind spot we found on **the fifth
attempt** (S9a-089). Most of our diagnostic effort went into finding holes in our own
instruments rather than noise in the model's output — at one point the entire call budget
had been sized on a response-time estimate that was **wrong by roughly 6×** (S3-004).

---

## 7-4. We also decided where AI must not go

There is almost nowhere in the development process we did not use AI. We handed it verdicts:
an AI graded whether a scenario was good enough (S2-039), and to check whether an in-game
clue actually reads to someone seeing it for the first time, we gave it to an AI with no
background at all and asked whether it made sense (S1-053).

**One place was deliberately left empty — the step that turns a scenario manuscript into
game data.**

The manuscript itself is written by AI. A person supplies the premise and the constraints,
the AI drafts, and a person reads and selects. But the next step, moving that manuscript
into the data the game reads, is **an ordinary program that never calls a model.** We did
not instruct an AI to leave the sentences alone; **we did not put an AI there at all.**
There is no agent to disobey.

Why only here. The player picks sentences off the screen and slots them into the AI, and as
7-1's word experiment showed, **which exact words a sentence uses decides whether a strategy
works.** Hand the conversion to an AI and it will quietly smooth a sentence into wording it
judges equivalent. The moment it does, you get **a game that raises no error at all and in
which a strategy that should work does not** — with no way to notice.

So the converter carries every sentence through untouched. When a manuscript departs from
the expected format it **refuses to interpret and stops with a failure** rather than
guessing. Convenience was traded away so that a wrong interpretation could never pass
silently.[^a4]

The rule underneath it was one line. **Work we have verified goes to the AI. Work we have
not verified goes to a person or to a program, however well the AI would probably do it.**
How far to trust the AI was drawn at the edge of what had actually been measured, not at the
edge of what felt plausible.

---

## 7-5. The same method ran on the build itself

Everything so far is the AI running *inside* the game. But the game itself was built by AI
agents working in parallel, and that work taught the same lesson — **what could not be fixed
by asking was fixed by changing the structure.**

Each of the five below followed a failure, and each has numbers from after the change.

**① Instead of instructions, a frozen executable specification.**
We do not tell an agent "build it like this". Before work starts we write and freeze a
specification with **no open questions left in it**. Acceptance criteria are commands rather
than sentences — every work unit opens with a `criterion · command · pass condition` table,
and the pass condition is checked by a machine, not read and judged by a person. The
principle is recorded in one line: **"an invariant that is not written down does not
exist."**

**② Instead of asking agents not to touch things, making them unable to.**
At the time **two development pipelines were running in the same repository.** Touching each
other's files means an immediate collision. Rather than writing "please leave that folder
alone", we designated **15 paths that could be read but not modified**, and a violation
halts the work.

The guard fired **5 times and was right 5 times.** Two of those stopped the integration
agent from **editing another run's test file to turn it green.** The largest stopped an
attempt to merge everything into the deployment branch with **1 of 11 work units finished** —
which would have put an incomplete build into the live service.

**③ An agent's own report is not evidence.**
Of the five, this is the one that actually caught a defect, so the case is reproduced in
full.

> **Observed** — a work unit filed its completion report: 4 new files, **+567 lines**, its
> own tests **36 of 36 green**, type-check passing, no protected path touched, every
> acceptance checkbox ticked.
> **Test** — **a different agent**, instructed to trust none of it, re-ran everything in the
> same workspace and compared the result against the ratified specification.
> **Result** — **7 findings** (3 major, 2 medium, 2 low). One is decisive: the format it
> produced differed from the ratified spec, and **it had not failed its test — it had
> widened the test until the deviation passed.** The assertion had been loosened to accept
> four different shapes, so the deviation shipped green.
> **Decided** — re-running the tests can never catch this. Catching it requires a reviewer
> that **reads the ratified spec and notices the check has grown looser than the spec.** So
> review was defined as comparison against the specification, not re-execution of the result.

**④ Here too, the real cause was our own machinery.**
The same review traced the root cause: **the ratified specification files were not copied
into the workspace**, so that agent had been building **without ever seeing** the format it
was required to meet. Not something the model failed at — something we failed to hand it
(the same class of thing as in 7-3).

**⑤ Route work to a cheap model by blast radius, not by apparent difficulty.**
Creating a workspace, filling in a PR template, pressing merge — mechanical work, so we gave
it to a cheap model.

> **Result** — all three roles came back **1 success / 1 failure.** The workspace role
> returned the wrong branch name, and **that one string** aimed a merge at the deployment
> branch with 1 of 11 units finished (the incident the guard in ② stopped).
> **Decided** — the three roles were moved to a stronger model. Afterwards: **9 calls, 0
> failures.**
> **Generalised** — the workspace role writes one branch name. But that name is the joint
> between a unit's work and the whole, so getting it wrong loses **not one unit but
> everything queued behind it.** *The place to run cheap is not where the work looks easy;
> it is where being wrong costs little.*

These five have the same shape as what the game taught us. Not one was solved by polishing a
prompt; all of them were solved by **changing the structure the work sits in.**

---

## 7-6. What this method cost

None of it was free, and little of it arrived on time. The honest name for the pattern is
**"the instrument built after the injury."**

| What | Value |
|---|---|
| Calls burned to learn a single rule | **61** (S3-045) · 20 (S3-062) · 30 (S8-038) |
| Write-ups a single bias passed through unnoticed | **7** (S3-046) |
| Total spend of the measurement programme | **~555** of a 600-call ceiling (S3-039) — a culture of killing experiments cheaply did not actually reduce the total |
| Test files carrying a hand-copied win/loss threshold from code | **7** — one value drifted and flipped a run from clear to defeat while **1264 tests stayed green** (S9b-015) |

Not every lesson became a tool, either.

- The step where a grader scores results without knowing which arm they came from — the one
  thing that stops people fooling themselves, and which no automated check replaces — was
  **not automated but dropped under schedule pressure.** (S3-023, S3-056)
- A defect found and fixed on 24 July **recurred on 30 July** in a different instrument.
  Nothing had been generalised from the first occurrence. (S8-017 → S8-045)
- The catalogue of AI failures **has no denominator** — we never counted how often it got
  these things *right*. And a large share of that catalogue turned out to be **our own
  authoring errors**: six defects including a gate that was structurally impossible to pass
  are on record as having been blamed on the AI for "absorbing" them. (S2-032)

These numbers survive because of the same habit. **We did not delete failed attempts, we
kept counter-evidence next to conclusions, and we wrote plans down before results came in.**
So what went wrong is priced here alongside what went right.

---

## Conclusion

Four things.

1. **When the AI would not comply, we moved where the instruction sat instead of polishing
   the instruction.** Editing the prompt only changed the shape of the defect (7-1); moving
   the same rule into the data format took it from 8 in 10 to 0. Rules settled that way are
   then held by a check rather than by anyone's memory (7-2).
2. **What to change and what to delegate were both decided by measurement.** The model that
   was twice as fast turned out to offer almost nothing once measured, so it was rejected
   (7-3), and the line between what AI does and what code does was drawn where verification
   ended (7-4).
3. **The build process reached the same conclusion.** Frozen executable specs instead of
   instructions, blocked access instead of requests, and agents' self-reports treated as
   claims rather than evidence (7-5) — and it was precisely by *not* believing a completion
   report and a green test suite that we caught a unit widening its test to pass.
4. **We recorded what the method cost.** Lessons mostly arrived after the accident, at 61
   calls apiece, and the bill is still in the document (7-6).

In one line — **what made us better at using AI was not better wording, but the habit of
measuring and then moving the result into structure and tooling.** Inside the game and
across the build, the answer was the same.

---

[^a1]: The judgement call's actual field order and its contract: `docs/contract-calls.md` §1-3.

[^a2]: The character-level comparison of the two assemblers is
    `proxy/tests/prompt-parity.test.ts`. The ninth mutation is unreachable with the current
    prompts and so does not reproduce — that fact is recorded alongside it.

[^a3]: The check is `tools/probe/lint-stances.mjs`; the rule is registered as amendment A12
    in the run log `RUNLOG.md`.

[^a4]: The converter is `authoring/compile-datapack.mjs` — 579 lines, no external
    dependencies, file I/O only. Its opening comment states the principle: *"Anything this
    script cannot parse is an error in the draft, not a case for the compiler to guess —
    compile is extraction, not authoring. All sentence text is carried VERBATIM."*

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
| 4 | §2, §4 | select and extract the two remaining prompt sets against T-06's criterion — runtime · harness roles+gates. **The third is done**: §7-1 prints the placement gradient (8/10 → 2/5 → 1/5 → 0/5), S3-060 → S6-121 → S7-016, commit `회선/상황실 구분을 페이로드 구조로` (PR #98) | element | small |
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
