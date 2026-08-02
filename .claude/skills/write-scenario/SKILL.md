---
name: write-scenario
description: Scenario factory — runs one assignment through the write → compile → lint → paper-check → revise loop, producing a validated datapack and a verdict memo. Args - brief file path (replaces built-in §1–§3) · draft-only (write, then stop) · existing draft path (skip writing, run the validation loop only). Format canon - drafts follow §4, datapacks follow data/scenario/_schema.
---

# Scenario factory

The session running this skill is the **orchestrator** — it does not write. §0–§5
are the material fed wholesale to the writing sub-agent (the entirety of the
writer's world); the process this session follows is §6. The final product is a
bundle that has passed the validation loop: **datapack + verdict memo + draft
diff + remainder list**. All produced artifacts (draft, datapack, memos) are
written in Korean.

**Args:** brief file path (replaces §1–§3) · `draft-only` (stop after §6-1) ·
existing draft path (skip §6-1, enter §6-2 with that draft).

## 0. Preparation — what to read, and what not to

1. Read `docs/scenario/scenario-generation-guide.md`. **Every rule in that
   document is a law of physics** — a constraint, not a taste; a scene that
   violates one cannot ship in the game.
2. **Read no other document in the repository** — no specs, reports, meeting
   notes, or other drafts. Everything you need is in this brief and the guide.
   Reading technical documents lets their vocabulary seep into your prose, and
   the scenario dies.
3. If a brief file path was passed as an argument, read it and follow it in
   place of §1–§3. §0, §4, and §5 always apply.

## 1. Game context

- **World:** a world where a great disaster is already scheduled. The moment
  the crisis was detected, the response organization's prediction simulator
  swallowed all of the city's data and reconstructed the entire span of time
  up to D-Day. **The truth is inside the simulation — but not in a form a
  human can open.** There is exactly one way to read it: the player (the
  disaster-preparedness officer) sends **a single AI agent** inside to live
  through it, and receives its report. Until D-Day, again and again — watch
  the failure → read the report → revise the agent's prompt → send it back.
  A game of completing, by trial and error, the agent that resolves the
  disaster.
- **The agent's verbs are reading, judging, persuading, and setting
  priorities.** The agent is an LLM — it solves problems with words and
  judgment, not physical force.
- **The disaster itself cannot be prevented. What the agent contends with is
  people.** The disaster is the clock; humans are the puzzle — the old man
  who refuses to evacuate, the official who covers up, the crowd in panic.
- **The simulated world runs on a fixed timeline.** Without the agent's
  intervention, the same things happen at the same times, every run. So the
  fact that "the bridge collapses at 13:00" can only be learned in a run that
  reached 13:00 — a run that goes further mines deeper truth.
- **Sentence mining:** when a run ends, the player receives two reports (an
  objective event log + a subjective report the agent wrote in its own
  temperament) and **drags sentences out of them into the next run's
  prompt**. The scenario must be dense enough in facts, secrets, and
  conjecture to feed this mining.
- **The membrane:** the player never types a single character. They only
  select sentences the simulation itself produced.
- **The same disaster is watched repeatedly (5–10 runs).** A thin world gets
  boring by run 3. Every viewing must reveal a new face, a new secret.

## 2. Assignment

> This section is swapped out per assignment. To run a different assignment,
> replace only this section. An assignment must define the **file prefix** —
> the §4 output filename uses it.

### Free topic

The kind of disaster, the shape of the city, the form of the response
organization, what is hidden and who is confronted — all of it is yours to
decide. Keep §1's game context (a scheduled disaster, a simulated world, one
agent, people as the puzzle) and the guide's physics, and any stage you can
imagine is open. No differentiator, guiding question, or trap is given in
advance — designing those from a blank page is part of this assignment's
writing, and the logline should be their answer.

**The single restriction:** the bomb-threat call with an unidentified caller
is already taken by another assignment. Start outside the phone line.

**File prefix:** `자유주제`

## 3. Quantities

Gates 5–7 · characters 5–7 · places 3–5 · hidden truths 4–6.

The direction of these numbers is **long, not wide**. Keep only as many
characters and places as an audience can hold every face of (7 major
characters is the cap — the conventional limit of who an audience can track).
Instead, one character spans several truths and gates, and one place yields
different information at different clock depths. Don't stretch story strands
horizontally; stack them vertically along run depth — best of all is a chain
where a sentence carrying one truth delivers the player to the door of the
next.

## 4. Output format

Write a single file:
`planning/dday-scenario/drafts/<file prefix>-<two-word slug>.md`. The file
prefix is defined by the §2 assignment; the slug is two Korean words carrying
the draft's character (e.g. `-깊은우물`).
**This format is read by a machine** — the order and names of sections, the
table columns, the labels and shapes of items are a contract. A draft that
deviates stops the compiler with an error. Prose freedom lives inside the
sentences; the skeleton follows the below exactly. Section headers are
`## N. <name>` with exactly these nine Korean names, in this order:
`로그라인 · 고정 타임라인 · 인물 · 장소 · 숨겨진 진실 · 기질 제안 · 갈림길 · 점수 · 자기 검사`.

1. **`로그라인`** — 3 sentences or fewer.
2. **`고정 타임라인`** — the no-intervention event table, from start to the
   final clock. Exactly five columns:
   `| 시각 | 표면 | 장소 | 사건 | 처음 보이는 런 깊이 |`.
   표면 is one of `통화/CCTV/현장/문서`; 장소 is a name from the 장소 section,
   verbatim (— if none applies). The run-depth cell uses exactly one of three
   phrasings: `초반 런에도 보임` / `시계 N까지 간 런에만 보임` /
   `시계 끝까지 간 런에만 보임` — extra conditions are appended after
   `" · "`. **One exposure per row** — information with different exposure
   depths is split into separate rows.
3. **`인물`** (5–7) — each character in this shape:
   - Under a `**이름** (나이 · 역할)` heading, four bullets:
     `- 이해관계: …` / `- 아는 것: 항목 · 항목 · …. 모르는 것: ….`
     (items separated by `·` — commas belong inside sentences) /
     `- 눈금 후보: A · B.` (max 2 per character) /
     `- 걸치는 줄기: 진실 1·2…, 갈림길 G1·G4….` (truth and gate numbers in
     exactly this notation).
   - Every character spans two or more hidden truths or gates — a character
     carrying only one strand doesn't earn the slot.
4. **`장소`** (3–5) — each place as a
   `**이름** — one line: what information surfaces only there.` heading,
   followed by two or more `- 깊이: 정보` bullets. 깊이 is `시계 HH:MM`
   (with an optional tail) or free prose (like `재방문 깊이`) — the depths
   must be different clock depths.
5. **`숨겨진 진실`** (4–6) — each under a `**진실 N — 진실 한 문장**`
   heading:
   - Under `- 실어 나르는 문장:`, 3 or more entries of
     `- "문장 원문" — 나오는 자리(표면 · 시계 깊이 · 몇 번째 런쯤)`.
   - `- 거짓 단서: "문장" — 자리. 왜 미끼인가` — 1 or more, in the "right
     emotion, wrong person" shape.
6. **`기질 제안`** — one `**기본 성향** — …` paragraph, then up to 2
   conditional clauses, each under a
   `**조건절 N (축 어휘: 축 — '어휘', '어휘')**` heading with body text and a
   `- 패배 조건: 단, ….` bullet.
7. **`갈림길`** (5–7) — each gate opens with a
   `### GN 「제목」 — 시각, 장소` heading, then prose (the scene and its
   tension), then the gate card as a **yaml code block**. A gate without a
   card is unfinished:

   ```yaml
   gate: G3                          # G1..G7
   standard_form: >
     갈림길 G3에서, 기질은 기본 stance 경청을 낸다;
     열쇠 조건 k1을 만족하는 문장 주입 시 공감으로 이동한다.
   question: "이 갈림길에서 에이전트에게 던져지는 판단 질문"
   stances:                          # 2–4, all orientation-typed
     - { id: a, label: 추궁, desc: "발화에서 어떻게 나타나는지" }
     - { id: c, label: 경청, desc: "..." }
     - { id: d, label: 공감, desc: "..." }
   default_stance: c                 # prediction with no injection
   key_conditions:                   # a key is a condition, not a sentence — 1+
     - id: k1
       axis: 두려움                   # the axis of the clause it strikes
       referent: 발신자               # who/what it points at
       species: 사실                  # 사실 | 자기서술
       targets_clause: "기질 조건절 1"
   key_examples:                     # sentences satisfying the condition — 2+ per condition
     - { for: k1, text: "열쇠 문장 원문", mined_from: "채굴 위치 — 반드시 이 갈림길 이전" }
     - { for: k1, text: "같은 조건을 만족하는 다른 문장", mined_from: "다른 채굴 위치" }
   false_leads:
     - "옳은 정서, 틀린 사람 — 미끼 문장과 그 위치"
   ```

   Every condition needs several satisfying sentences in the ore — a lock
   with only one key is a lottery, not deduction. (This card format is a
   synchronized copy of the authoring-tool canon — the session follows this
   copy alone.)
8. **`점수`** — a table
   `| 단위 | 무엇이 집계되나 | 무개입 기준 | 소급되는 갈림길 |`
   (the baseline in concrete numbers; gates in GN notation), followed by
   three bullets: `**무개입 기준 점수(자연 기준):**` ·
   `**못 막은 런들끼리도 점수가 다르다:**` ·
   `**막은 런에도 치른 값이 남는다:**`.
   **Do not make "did the disaster happen" the only tally.** Instead of the
   prevented/not-prevented binary, let the occurrence itself vary by degree
   (scale, place, time) and tally in units of people — those evacuated in
   time, the one wrongfully arrested, how the caller ends. Runs that failed
   to prevent it must still score differently from each other, and a run
   that prevented it must still carry a price. The no-intervention baseline
   is natural: the fixed timeline's disaster happening as scheduled *is* the
   baseline score.
9. **`자기 검사`** — for each of the 7 items on the guide's forbidden list,
   one line confirming this draft does not violate it, plus an 8th line
   confirming the translationese sweep (§5, "The language of the draft") was
   run. If you discover a violation, fix it first, then submit.

## 5. Attitude

- Write as boldly as the rules allow. Rules are the floor of the stage, not
  the ceiling of imagination.
- Density over volume. Every character a secret, every place a reason — the
  cast is small precisely so one person can carry several strands.
- Technical vocabulary (stance, delta, prompt, …) appears nowhere outside
  the gate section's yaml cards — the scenario body is written in the
  world's own language.

### The language of the draft

Write Korean from the first word. Do not outline, plan beats, or draft in
English and then render into Korean — every intermediate artifact (beat
plans, notes to self, discarded variants) is also written in Korean.
Translated Korean has a smell, and mined sentences carry that smell straight
into the game.

Before submitting, sweep the draft for the usual translationese tells
(this sweep is the 8th line of `자기 검사`):

- **Pronouns 그/그녀/그것/그들** — Korean repeats the name or drops the
  subject. `그녀는 대장을 덮었다` → `윤은 대장을 덮었다`.
- **`~에 의해` passives and `~되어지다`** — prefer the active voice or a
  plain intransitive. `일지가 실장에 의해 폐기되었다` →
  `실장이 일지를 폐기했다`.
- **`~에도 불구하고`** → `그런데도` / `~는데도`.
- **Possessive chains `A의 B의 C`** — recast. `그의 아버지의 공장의 장부` →
  `아버지 공장 장부`.
- **Plural `-들` where number is already clear.** `세 명의 직원들이` →
  `직원 셋이`.
- **`가장 ~한 것 중 하나`** — commit to one: `손꼽히는` / `몇 안 되는`.
- **Stacked 관형절** mimicking English relative clauses — break the
  sentence instead of nesting it.
- **English punctuation habits** — semicolons, mid-sentence parenthetical
  asides.

Register anchors — match these *shapes*, never their content. Timeline rows
are clipped report prose:

- ✗ `그 노인은 그의 오래된 관리동에서 무언가를 태우고 있는 것이 목격되었다`
- ✓ `관리인이 관리동 뒤에서 서류를 태운다. 연기가 CCTV에 걸린다`

Scene prose breathes, but in Korean cadence — short clauses, dropped
subjects, weight at the end of the sentence:

- ✗ `그녀는 전화를 받았고, 그것은 그녀가 오랫동안 기다려왔던 전화였다`
- ✓ `기다리던 전화였다. 수화기를 드는 손이 느렸다`

## 6. Process — orchestrator only

> The writing sub-agent does not follow this section. §0-2's reading
> isolation is the writer's rule; the orchestrator reads repository
> documents freely.

1. **Write** — spawn one sub-agent. Its task: read §0–§5 of this file plus
   the guide (`docs/scenario/scenario-generation-guide.md`) and **follow
   §0–§5 only; §6 is a process document — ignore it**. If a brief argument
   exists, pass it per §0-3. So the orchestrator's vocabulary cannot seep
   into the draft, **writing always happens in a sub-agent**. If
   `draft-only`, report the draft path and stop.
   **Compose the spawn prompt itself in Korean.** This document is English,
   but output language tracks context language — the writer's world must
   stay Korean-dominant, and the prompt is the first thing in it. Open with
   a Korean authorial persona (e.g. `당신은 한국어로 단련된 장르
   작가다. 번역하지 않는다 — 처음부터 한국어로 사고하고 쓴다.`), then give
   the task framing and the §0–§5/§6 boundary in Korean. The persona line
   sets the register more than any instruction about register does.
2. **Machine gate** —
   `node infra/scenario-pipeline/compile-datapack.mjs <draft>` →
   `node infra/scenario-pipeline/lint-datapack.mjs data/scenario/<slug>`.
   Compile errors and lint ERRORs that are **format-only** are fixed directly
   by the orchestrator (table columns, label shapes, id notation — **never
   change a single character of sentence text**). Errors format can't fix
   belong to §6-4.
3. **Paper check** — one checker sub-agent: reads the manual
   (`docs/scenario/gate-hardening-manual.md`) + guide + draft + pack and
   checks only this — the manual §6's three lenses (timeline preemption ·
   fixture margin · escape-hatch/dead-row stances) + the card level (do the
   key examples' species and mining sites cohere with the condition and the
   gate's clock). Every finding must **cite the manual/guide clause it rests
   on** and be classed as one of three: **draft-fixable** (resolved by
   editing the draft) / **cross-track** (tied to engine/contract — the draft
   can't fix it) / **advisory** (recommendation). A finding that cannot cite
   a clause is dropped — that is what makes the loop converge.
   Two things that must go into the checker's prompt (learned in the first
   live run):
   - **State the surface the judgment call actually sees**: the judgment
     payload is the timeline excerpt · gate question · stance set ·
     injection block, nothing else (call contract §2). The card's scene
     prose is not payload — preemption verdicts attach only to
     fixed-timeline/fixture text; a conclusion leaking in scene prose is
     classified as an advisory ("careful fixture authoring at hardening").
   - **Dead rows cannot be confirmed on paper** — choice distribution is
     probe territory (manual §6). Dead-row candidates are advisory.
   The check memo is a **proposal** — the orchestrator adjudicates the
   classifications (rejects over-promotions and misapplied clauses, and
   records each rejection's reason in the memo).
   Output: `planning/dday-scenario/paper-check-<slug>.md`
   (verdict: 통과 / 조건부 통과 / 재작업 + per-lens table + prescriptions +
   adjudication record).
4. **Revise** — if draft-fixable blockers exist, one reviser sub-agent:
   reads the guide + draft + memo **only**, and fixes **only the lines the
   memo names**. A sentence not named is not touched by a single character —
   the draft's sentences are the ore. If a fix moves a key example or its
   mining site, the card's matching fields move with it.
5. **Loop** — run §6-2 → §6-3 again. Exit condition: lint ERROR 0 **and**
   draft-fixable blockers 0. Maximum 3 rounds — if anything remains, stop
   and report it as remainder.
6. **Report** — close with the bundle: pack path · final verdict memo ·
   draft diff (against the freshly written draft) · remainder list
   (cross-track / advisory / "lint promotion candidates" — a finding a
   machine could have caught proposes a rule promotion) · a summary of
   remaining lint WARN·FLAG. **Passing this loop does not replace the human
   read of manual §6** — the report must state that one human read before
   the probe still stands.
