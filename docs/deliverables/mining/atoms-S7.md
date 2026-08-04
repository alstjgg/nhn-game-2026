# Atoms — S7 data/ + artifacts/ prose
Snapshot: worktree HEAD bbb6a06 (corpus manifest snapshot: main @ 5a3c388), mined 2026-08-04.
Coverage: `data/policy/report-guidance.json` read in full; all 10 scenario schemas and
all 3 run schemas — every `title`/`description` prose field extracted and read
(machine-extracted, so nothing skipped); 우는다리 pack: meta.json, gates.json,
temperament.json, hardening.json, score.json read in full, truths.json read to tr3,
places.json/characters.json sampled (heads), timeline.json/symptoms.json structure
confirmed but prose not read line-by-line — their sentences are compiled verbatim from
draft.md, whose full text is S2's to mine (byte-identical copy, see S7-004).
`artifacts/` does not exist at this snapshot (corpus manifest note confirmed).
`data/scenario/우는다리/draft.md` read only to §2 — content mining of the draft belongs
to S2; only its provenance-as-data is atomized here.

### S7-001 — A policy JSON that explains why it lives outside the datapack
- source: data/policy/report-guidance.json (`purpose` field)
- date: 2026-08-02 (agreement cited in the field; committed in #104)
- lanes: 1
- event: The report length/format policy for Call 3 (Reporter) was shipped as a standalone data file whose `purpose` field records its own architecture decision: it is scenario-independent, so it lives outside the datapack ("putting it in the pack would duplicate it per scenario"), and its values are v0 initial guesses to be tuned after gameplay measurement — balance-as-data.
- tension: The prompt layer's tunables carry their own rationale and their own admission of unmeasuredness inside the data file itself — the decision record is the artifact.
- quote: "시나리오 무관 정책이라 데이터팩 밖에 산다 — 팩에 넣으면 시나리오마다 복제된다 (핸드오프 §3-4, 08-02 합의). 값은 v0 초기치이며 게임플레이 실측(파이프라인 §5) 후 조정한다 — balance-as-data."
- flags: design-record, boundary

### S7-002 — The report prompt is engineered to grow next run's ammunition
- source: data/policy/report-guidance.json (`report_body.policy`)
- date: 2026-08-02
- lanes: 1
- event: The Reporter call's writing policy instructs the agent to write judgments one per sentence, self-contained, with explicit judgment markers ("…라고 나는 판단한다") — because those sentences are the mining vein for the next run: the self-description species of key condition can only be harvested here.
- tension: A prompt-layer instruction whose real customer is the game loop, not the reader — the AI's prose style is regulated so its output stays machine-harvestable as future injection material.
- quote: "이 문장들이 다음 런의 채굴 광맥이다(열쇠 조건의 자기서술 종은 여기서만 나온다)."
- links: S7-009, S7-019
- flags: design-record

### S7-003 — Facts and judgment split into two channels with different trust rules
- source: data/policy/report-guidance.json (`facts.policy`)
- date: 2026-08-02
- lanes: 1
- event: The same policy file splits Call 3 output: `facts` (max 8, one sentence each) may contain only what actually happened or was observed, while speculation and judgment are exiled to `report_body`.
- tension: A data-encoded fabrication firewall — the LLM is given a lane where invention is banned and a lane where hedged judgment is required, instead of one blob where the two would blur.
- quote: "실제로 일어났거나 관찰된 것만 적는다 — 추측과 판단은 report_body의 몫이다."
- flags: boundary, fabrication

### S7-004 — Provenance: the pack carries its source draft byte-for-byte
- source: data/scenario/우는다리/draft.md (sha1 5f396cb8 = planning/dday-scenario/drafts/테러리스트의전화-우는다리.md); commit ff33795 (#104)
- date: 2026-08-02
- lanes: 4
- event: The compiled 우는다리 datapack ships with a byte-identical copy of the 43 KB scenario draft it was compiled from, duplicating the file already in planning/. (Known duplication — recorded here as provenance only; the draft's content is S2's corpus.)
- tension: The compile pipeline keeps its input inside its output directory, making every pack self-auditing against its source — at the price of a deliberate byte-identical duplicate in the repo.
- links: S2 (draft content), S7-013
- flags: provenance

### S7-005 — The only human-written file in the pack is the only one armored against typos
- source: data/scenario/_schema/hardening.schema.json (top-level description)
- date: 2026-08-02 (#104 review 2)
- lanes: 4
- event: The hardening overlay — the single hand-authored file in an otherwise compiler-generated pack — got `additionalProperties:false` at every level, specifically so a key typo ("vairable") explodes as a schema violation instead of silently degrading to null; existence of referenced ids is left to the compiler, which dies on unknowns.
- tension: An inversion of the usual trust story: the pipeline's paranoia is aimed at the *human* contributor, because everything machine-generated is deterministic and only the hand-written layer can carry typos. The rule traces to a PR review finding (#104 리뷰 2).
- quote: "팩에서 유일하게 사람이 직접 쓰는 파일 — 그래서 유일하게 오타가 가능한 파일이다 (#104 리뷰 2)."
- flags: boundary, human-limit, review-driven

### S7-006 — Positional ids double-guarded: time AND text-head must both match
- source: data/scenario/_schema/hardening.schema.json (timeline description); data/scenario/우는다리/hardening.json (text_head fields)
- date: 2026-08-02 (#104 review 3)
- lanes: 4
- event: Timeline overlay entries address events by position (t·N), so the compiler cross-checks both the event's time and a `text_head` prefix (`startsWith`, die on mismatch) — catching the case where two same-time rows swap places, which a time check alone would miss. The shipped 우는다리 overlay carries truncated Korean sentence heads ("첫 전화(28초). \"") as anchors.
- tension: A drift class discovered in review (#104 리뷰 3) was closed by making prose itself the checksum — narrative first-words serve as machine-verified anchors between human draft order and compiled data.
- flags: design-record, review-driven

### S7-007 — Symptom sentences are the only path from state to screen; numbers are banned
- source: data/scenario/_schema/symptoms.schema.json (description, entryList.text)
- date: 2026-08-02
- lanes: 1
- event: The symptoms schema declares itself the sole channel through which state change reaches the screen (contract §1 rule 5 — no number exposure), with lint I12 banning digits in symptom sentences and coverage/ordering lints ensuring every direction of change has a bottom-band sentence.
- tension: The membrane extended to the *output* side: the player never sees a meter, only authored prose like "발신자의 호흡이 얕아졌다" — and the ban is enforced by lint on data, not by hoping the prompt behaves.
- quote: "상태 변화가 화면에 닿는 유일한 통로(계약 §1 규칙 5 — 숫자 노출 금지)."
- links: S7-017
- flags: boundary, design-record

### S7-008 — "The key is a condition class — not a sentence"
- source: data/scenario/_schema/gates.schema.json (key_conditions description); data/scenario/우는다리/gates.json (key_conditions)
- date: 2026-08-02
- lanes: 1
- event: Gate keys — the things a player's injected sentence must satisfy to move the agent off its default stance — are encoded as condition classes (axis × referent × attestation species: fact vs self-description), never as literal target sentences; the shipped pack types every key this way (e.g. G1: 두려움 × 발신자 × 사실).
- tension: The core unlock mechanic refuses string matching by design: any mined sentence satisfying the class works, which is what makes structured blocks a real replacement for free text rather than a password guess.
- quote: "열쇠는 조건 클래스다(축 × 지목 × 인증 종) — 문장이 아니다"
- links: S7-002, S7-009, S7-010
- flags: design-record, boundary

### S7-009 — Every key must be mineable before its gate — solvability is a lint rule
- source: data/scenario/_schema/gates.schema.json (key_examples, mined_from); data/scenario/우는다리/gates.json (key_examples)
- date: 2026-08-02
- lanes: 4
- event: Each key condition must carry ≥2 example sentences (lint-counted per condition), and each example's `mined_from` must name a source reachable before that gate ("반드시 이 게이트 이전") — e.g. G1's key is minable from the 09:40 voice-analysis log of a prior run. The shipped pack annotates every example with run-depth and clock.
- tension: "The puzzle is solvable" — normally a playtest discovery — is turned into a schema obligation checked by a machine before any run happens.
- quote: "채굴 위치 — 반드시 이 게이트 이전"
- flags: design-record, measurement

### S7-010 — Axis vocabulary is a lock's metallurgy: leakage dulls it, and lint checks
- source: data/scenario/_schema/temperament.schema.json (axis_vocabulary description); data/scenario/우는다리/temperament.json
- date: 2026-08-02
- lanes: 1, 4
- event: Each temperament clause declares its axis's reserved vocabulary (두려움/겁/겁에 질리다…), which lint A12 checks for collisions with the rest of the world's wording — especially stance labels — because if the axis words are common elsewhere, the lock goes dull (injections trigger too easily or ambiguously).
- tension: Whether the prompt mechanism stays sharp is treated as a data property with an automated conflict check, not as prompt-engineering folklore.
- quote: "이 축의 전유 어휘. 세계의 다른 곳(특히 stance 라벨)에 흔하면 자물쇠가 무뎌진다(가이드 §4-2)"
- flags: design-record

### S7-011 — Decoys are a required schema field: "right emotion, wrong person"
- source: data/scenario/_schema/gates.schema.json (false_leads); data/scenario/우는다리/gates.json + truths.json (false_leads entries)
- date: 2026-08-02
- lanes: 4
- event: Every gate and truth carries `false_leads` — sentences engineered to match the key's emotional axis but point at the wrong referent (e.g. for G1: the caretaker's fear instead of the caller's), each annotated with why it fails. The pattern is named in the schema itself: "옳은 정서, 틀린 사람."
- tension: Player error is authored, not emergent: the data format demands that each lock ship with its own near-miss bait, making "almost right" a designed experience with a paper trail.
- quote: "옳은 정서, 틀린 사람 — 미끼 문장과 위치"
- flags: design-record

### S7-012 — "Truth is a supply chain, not a declaration"
- source: data/scenario/_schema/truths.schema.json (description); data/scenario/우는다리/truths.json (tr2)
- date: 2026-08-02
- lanes: 4
- event: The truths registry requires every hidden truth to be backed by ≥3 carrier sentences, each with a `where` locating it by surface, clock depth, and approximate run number; it also issues the pack-wide sentence ids. The 우는다리 pack annotates tr2's collapse-log carrier with "실패한 런조차 가장 깊은 진실을 캐 온다" (even a failed run mines the deepest truth).
- tension: Narrative revelation is modeled as logistics — a truth without provisioned carriers is schema-invalid, and even total player failure is budgeted to pay out information.
- quote: "진실은 선언이 아니라 공급망이다(가이드 §3)."
- links: S7-009
- flags: design-record

### S7-013 — Compile passes what lint flags: incompleteness is tracked state, not a blocker
- source: data/scenario/_schema/gates.schema.json (description, buckets/edge_predicates); score.schema.json; symptoms.schema.json; timeline.schema.json (effects)
- date: 2026-08-02
- lanes: 4
- event: Across the schemas, hardening outputs (buckets, edge_predicates, score predicates, symptom skeletons, timeline effects) are allowed to compile as empty/null, with lint responsible for flagging "하드닝 미완" — a deliberate two-stage split where the compiler certifies shape and lint certifies doneness.
- tension: The pipeline institutionalizes shipping half-finished packs legibly: instead of blocking on completeness, it makes every gap machine-visible, so drafts can flow through the toolchain while their debt stays flagged.
- quote: "buckets·edge_predicates는 하드닝 산출물 — 컴파일은 빈 배열로 통과시키고 린트가 '하드닝 미완'을 플래그한다(pipeline §3)."
- flags: design-record

### S7-014 — The metric schema encodes how the game could be proven boring
- source: data/runs/_schema/metric-report.schema.json (descriptions)
- date: 2026-08-02
- lanes: 3
- event: The gameplay-measurement report schema fixes its format before the first run (per pipeline §5) and bakes falsification criteria into field descriptions: `score_variance` "≈0이면 게이트가 장식" (gates are decoration), `near_miss_trace_rate` low means the warmer/colder loop is dead, `policy_gap` = oracle minus random, and unmeasurable metrics must be null, not 0 — "측정 불가 ≠ 효과 없음" (RUNLOG A20).
- tension: The data format itself names the ways the design could turn out to be fake fun — before any measurement exists — including a measurement-integrity rule imported from a prior run-log amendment about not conflating "couldn't measure" with "no effect".
- quote: "측정 불가한 지표는 null — 0과 null을 구분한다(측정 불가 ≠ 효과 없음, RUNLOG A20)."
- flags: measurement, design-record

### S7-015 — The run-record schema ships with its own open questions flagged ⚠
- source: data/runs/_schema/run-record.schema.json (reached_clock, score, fallbacks descriptions)
- date: 2026-08-02
- lanes: 3
- event: The run-record schema binds only the surfaces a run leaves ("엔진 내부는 엔진 소유"), cites which existing contract owns each field, records LLM-call failures as a first-class `fallbacks` ledger (proxy `x-fallback-code`), and marks unresolved semantics in-line: reached_clock carries "⚠ 런 종료 조건 자체는 엔진 미결", and score's null-allowance is explicitly "그 보류" (that deferral).
- tension: The schema refuses to pretend decisions were made — undecided engine semantics are shipped as annotated warnings inside the data contract rather than resolved by the data track overstepping its boundary.
- flags: boundary, design-record

### S7-016 — Speaker misattribution solved by a data field, not a prompt plea
- source: data/scenario/_schema/timeline.schema.json (present description)
- date: 2026-08-02
- lanes: 1
- event: Timeline events carry `present[]` with a mandatory `side` per character (line = across the phone line, room = in the situation room), feeding Call 2's PRESENT_NPCS slot; the schema states side is "not decoration" but the only means that drove speaker misassignment to zero.
- tension: A concrete LLM failure mode (narration putting words in the wrong mouth) was fixed structurally — a two-value enum in the datapack — and the schema preserves the causal claim that nothing softer worked.
- quote: "side는 장식이 아니다(콜 계약 §3: line=회선 너머 · room=상황실 안 — 화자 오배정을 0으로 만든 유일한 수단)."
- flags: design-record, ai-limit

### S7-017 — A ban on zero and decimals, with the engine-mechanical reason attached
- source: data/scenario/_schema/gates.schema.json (buckets.deltas description); timeline.schema.json (effects.deltas)
- date: 2026-08-02
- lanes: 1, 4
- event: Delta values must be non-zero integers, and the schema description explains why in engine terms: symptom lookup matches integer min-bands, so a decimal delta never triggers any sentence and a zero delta silently drops from render; lint E8 enforces the ban.
- tension: Balance-as-data with its failure physics documented at the point of authoring — an author who types 0.5 would produce a change invisible to the player, and the schema tells them so before lint catches it.
- quote: "증상 룩업이 정수 min 구간 매치라 소수는 어떤 문장에도 안 걸리고 0은 렌더 탈락. 0 금지는 린트 E8이 잡는다."
- flags: design-record

### S7-018 — Every temperament clause must carry its own defeat condition
- source: data/scenario/_schema/temperament.schema.json (defeat_condition); data/scenario/우는다리/temperament.json (cl1, cl2)
- date: 2026-08-02
- lanes: 1
- event: The temperament format requires each conditional clause to include a defeat condition ("단, …할 때는 그렇지 않다" — e.g. cl2's erasure clause yields when the erasure turns out to be a mere IT error), alongside a prose default disposition that defines the no-intervention agent's judgment habits; Call 1 and Call 3 read the same file.
- tension: The player-facing exploit surface is balanced inside the data: every lock the player can pick has an authored counter-case, preventing a single injected sentence from becoming a universal skeleton key.
- quote: "단, 이미 확인된 사실과 어긋날 때는 그렇지 않다."
- flags: design-record

### S7-019 — Narrative prose is classified as ore: "the sentence that becomes a mining vein"
- source: data/scenario/_schema/timeline.schema.json (text description); data/runs/_schema/run-record.schema.json (timeline, report_body as 채굴 표면 W2/W3)
- date: 2026-08-02
- lanes: 1
- event: The schema for timeline event text describes it as "사건 서술 원문 — 채굴 광맥이 되는 문장", and the run-record schema tags its rendered timeline and the agent's handwritten report as mining surfaces (W2, W3) — the places future injectable blocks are harvested from.
- tension: Across the data layer, fiction is consistently typed as a resource with named extraction surfaces; the game's writing is stored in a form whose primary consumer is the mining loop, closing the circle with the membrane: the player composes only from what the world (and the AI's own reports) already said.
- links: S7-002, S7-007, S7-012
- flags: design-record
