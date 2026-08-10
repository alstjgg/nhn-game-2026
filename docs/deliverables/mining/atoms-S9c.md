# Atoms — S9c implementation-phase PRs (#140–#237)
Snapshot: main @ 8b7651f, mined 2026-08-10. PRs #140–#237 per `corpus-prs.md` ("Incremental sweep — implementation phase"). Sibling slices S9a/S9b covered #1–#139; this file does NOT re-mine those.

Coverage:
- **Rich-review PRs — all 10 deep-mined** (full body + every issue comment + every review-submission body + every inline `reviewThreads` node via GraphQL): #234, #149, #214, #141, #154, #145, #153, #235, #142, #220.
  - #234 (11 review submissions) is the densest event in range: all 7 inline threads read exchange-by-exchange; every review-submission *body* is empty (a GitHub artifact of inline posting), so the content lives in the threads.
  - #149 (1 review / 7 comments) and #141 (1 / 6) carry their weight in issue-level `[review]`/author comments, not inline threads; both read in full.
  - #214, #220 carry measurement-heavy bodies + a follow-up-decision comment chain; #154, #153 carry PRD-citation review-catches; #145, #142, #235 read in full.
- **The 10 single-agent `claude/*` PRs — all read** (body only; none carry comments or threads except #151): #151, #182, #183, #188, #192, #193, #196, #211, #228, #229.
- **The 3 CLOSED-unmerged PRs — all read** (body + any comments): #144 (closed in favour of #145, with the closure comment), #170 (doc-only, no comments), #213 (fully-authored fix, no comments).
- **Sampled from the ~85 thin manual PRs by title, then read in full for decisions/reversals:** #150, #195, #217, #230, #233, #236. The remaining ~79 (mostly `ui(x*)`/`playtest(*)`/`docs(*)` single-review-or-bare merges, e.g. #143, #146–#148, #152, #155–#181 except those above, #184–#212 except those above, #215–#232 except those above) were scanned by title only and not opened; no atom forced from them.
- One exchange / one decision = one atom. One source per atom. Contradictions/disagreements-in-thread get their own atom.

---

## #234 — fix(prompts): 요원은 현장에 있고, 상황실에는 아무도 없다 (11 reviews)

### S9c-001 — The prompt described a pre-DDAY game; the model filled an authorized empty seat with an invented character
- source: PR #234 (body)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The client had shipped `운영자 + 현장 요원 ECHO` for weeks while the prompts still described the pre-DDAY concept `광역 재난상황실의 야간 통제관` — and `통제관` was not a third party but the agent's own old name, which the narration prompt named five times as an entity the narrator observes; because `narration/base-v0.3.md:17` explicitly licensed `상황실 인물끼리 주고받는 말` in a game that has no situation room, the model invented a character (`기록관`) found nowhere in the repo, and it reached the screen through `timeline_entries` with the same mark and style as authored scenario rows.
- tension: An out-of-date prompt that permits colleagues in a room that does not exist is where invention starts — "모델은 허가받은 빈 자리를 이름으로 채웠고, 그 이름이 `timeline_entries`를 타고 저작 시나리오 행과 같은 마크·같은 스타일로 화면에 닿았다" — the membrane cannot tell an invented colleague from canon.
- quote: "통제관은 에이전트 옆에 선 제3자가 아니라 **에이전트의 옛 이름**인데, narration 프롬프트는 통제관을 서술자가 관찰하는 대상으로 다섯 번 부른다."
- links: S9c-045, S9c-046, S9c-057
- flags: failure, boundary, membrane

### S9c-002 — Register was specified nowhere; the fix chose 해라체 over 반말 deliberately
- source: PR #234 (body)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: None of the 14 prompt files or 2 tool-schema copies mentioned 존댓말/반말, so the model was fed four registers in one request; the fix added a register rule (agent's radio + timeline record in 해라체, Call-3 report in business-formal 존댓말) and chose the word `해라체` rather than `반말` on purpose, because `반말` also covers 해체 and would let a directive permit it.
- tension: A deliberate lexical choice recorded so the constraint is precise — "`반말`이 아니라 `해라체`라고 쓴 건 의도적이다 — 반말은 해체(`출발했어`)와 해라체(`출발했다`)를 함께 덮어서, 지시로는 해체를 허용해 버린다."
- quote: "**어투 규정 신설.** 요원의 무전과 타임라인 기록은 해라체, Call 3 보고는 업무 격식 존댓말."
- links: S9c-006, S9c-055
- flags: decision

### S9c-003 — A §7-boundary line was fixed in a place the handoff had structurally left unowned
- source: PR #234 (body)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: `EXPERIENCED_PREFIX.UTTERANCE` in `src/engine/feed/experienced.ts` tagged the agent's own utterance with the nonexistent place `[통제실]`, and on the Call-3 fallback path `assembleObjectiveLog` kept those rows and minted them on the `f` channel to the player; because `src/engine/**` was out of the handoff's §7 scope, "구조상 아무도 안 고치게 되어 있었다," and the agent fixed it anyway on the grounds that the module already declares the phrase `provisional`.
- tension: A defect sitting in the seam between two owners' scopes, fixed by reaching across into `src/engine` and justifying the crossing rather than waiting for an owner — `[속내]`(생각한 것) / `[무전]`(회선에 나간 것) as the honest contrast.
- quote: "**두 번째 경로가 더 나쁘다.** Call 3이 폴백되면 `assembleObjectiveLog`가 발화 행을 유지하고, 그 줄들은 `f` 채널로 채번되어 플레이어에게 그대로 보이고 채굴까지 된다."
- links: S9c-001
- flags: boundary, decision, membrane

### S9c-004 — The `maxItems:1` cap had no gate; deleting it from either copy left everything green
- source: PR #234 (body §"테스트를 늘린 이유")
- date: 2026-08-10
- lanes: 2 AI-building-the-game
- event: The reviewer's ask surfaced that no test read the schema's `maxItems` constraint, and the deploy smoke calls only judgment, so narration — the one call carrying the cap — had never received a real-model call; the fix added tool-schema equality (three calls, both tiers), a cap-non-emptiness check (equality alone passes if both copies are wiped), a selftest shape check, and current-template coverage fixtures because additive versioning had left no fixture rendering the new templates.
- tension: The single most important structural guarantee of the fix (one NPC line per beat) was enforced by nothing until the review forced the gate — "한쪽 사본에서 지워도 프록시·프로브·루트·번들이 전부 초록이었다"; mutation-confirmed: 한쪽만 2 fail, 양쪽 1 fail, 원복 47 pass.
- quote: "`prompt-parity.test.ts`는 두 **렌더러**만 비교하고 두 **도구 빌더**는 비교하지 않았다. 콜은 프롬프트 + 스키마인데 절반에만 드리프트 게이트가 있었던 셈이다."
- links: S9c-008
- flags: failure, measurement, boundary

### S9c-005 — Deploy order can drop the whole live site to fallback; the PR ships with no version bump to prevent it
- source: PR #234 (body §"배포 순서")
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: `proxy-deploy.yml` and Pages `deploy.yml` both fire on push-to-main, share no concurrency group, and run at once, so if the client's `TEMPLATE_VERSION` reaches users before the proxy carries that version, `proxy/src/prompt.ts` throws `unknown_template_version` and every call falls back; the PR therefore carries the new prompt versions in the bundle only and leaves the client requesting the old versions, making its solo merge have zero live effect, with the bump deferred to a later same-session PR.
- tension: A cross-tier race that can silently break the live entry, defused by sequencing the merge (prompts → verify `x-llm-fallback: false` → bump) rather than by a concurrency fix — "순서가 뒤집히면 라이브가 전부 폴백으로 떨어진다."
- quote: "그래서 이 PR에 버전 범프가 없다. 새 버전은 번들에만 존재하고 클라이언트는 계속 v0.4/v0.3을 요청하므로 **이 PR 단독 머지는 라이브에 무영향**이다."
- links: S9c-058
- flags: decision, boundary, cost

### S9c-006 — A ratified contract line was deliberately deviated from, with the reason left in the prompt so it survives the next cycle
- source: PR #234 (body §"§2.1에서 의도적으로 벗어난 곳")
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: `docs/contract-calls.md` §2.1 pinned `Call 2 (all output)` to 반말, but applied literally that would make a 58-year-old night-duty NPC (표기웅) speak 반말 to the agent, so the fix split timeline records (해라체) from in-dialogue register (the character's own), and wrote a justifying line into the prompt so a future reader of §2.1 alone would not revert it.
- tension: A deliberate departure from a ratified spec, defended on relational fidelity and made revert-proof by recording the reason at the point of use rather than only in the spec — "**동의 안 되면 `narration/base-v0.4.md`의 `[어투]` 한 단락만 고치면 된다.**"
- quote: "그대로 적용하면 58세 야간 당직 표기웅이 요원에게 반말하게 된다. 그래서 타임라인 기록은 해라체, 대사 안의 말투는 그 인물의 것으로 갈랐다."
- links: S9c-002, S9c-055
- flags: contradiction, decision

### S9c-007 — Human asked "4–5 lines too many?"; agent cut to 2–3 with a live measurement and named a balance-as-data debt it deferred
- source: PR #234 (review thread, `proxy/src/calls.ts`)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The human asked whether 4–5 NPC lines was too many; the agent cut to 2–3, backing it with three live runs (5/3/3 lines) in which a 5-line beat's last two lines pre-spent an event `t7` owns, and noted that at 19 beats a run accrues up to 95 lines — then flagged that "lines per beat" is a tunable that by balance-as-data belongs in `data/`, not a schema description, and deferred slotting it to keep the review surface small.
- tension: A design number fixed by measurement, with the repo's own balance-as-data rule acknowledged as violated and the fix deferred on scope grounds — "**숫자만 바꾸고 슬롯화는 별건으로 둡니다.**"
- quote: "라이브로 세 런 돌렸을 때 5/3/3줄이 나왔고, 5줄짜리는 뒤 두 줄이 팩의 다음 비트가 다룰 사건을 미리 소진했습니다 … 열아홉 비트면 런 하나에 최대 95줄이 쌓입니다."
- flags: decision, measurement, cost

### S9c-008 — Agent declined the human's type change: `npc_lines` stays an array across 96 sites
- source: PR #234 (review thread, `docs/contract-calls.md:138`)
- date: 2026-08-10
- lanes: 2 AI-building-the-game
- event: The human asked whether, having capped one-line-one-speaker, the `npc_lines` type should stop being an array; the agent declined under the human's own "if it costs more, leave it" condition, showing the array is assumed in 96 places across 30 files (engine, contracts, transport fixtures, golden tests, probe lint) so a type change would drag a golden regeneration, and that the array already expresses "0-or-1" (7 of 19 beats are empty).
- tension: A structurally-correct simplification declined because its cost outweighs its gain, with the empty-beat-is-normal fact carrying the decision — "빈 비트가 정상이자 다수라(19비트 중 7비트가 빈 로스터) 단일 값으로 바꿔도 null 체크가 그대로 남습니다."
- quote: "`npc_lines`는 **30개 파일 96군데**에 걸쳐 있습니다. … 타입을 바꾸면 골든 재생성까지 따라옵니다."
- flags: decision, boundary

### S9c-009 — Human and agent disagreed on the roster cap; the agent adopted the human's fix, then found the human's fix was incomplete
- source: PR #234 (review thread, `proxy/prompts/narration/user-v0.4.md:16`)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The human said the roster is "always one person"; the agent first proposed no change (roster = who exists, cap = who speaks; pack data showed `t12` with two present), the human replied that a coming timeline edit will make it 0-or-1, the agent adopted the wording — then pointed out the roster is accumulated per-beat not per-event (`driver.ts:174`), so 20:05 (`t10`,`t11`) also produces a roster of two and splitting only `t12` would leave it unfixed.
- tension: A disagreement resolved by the human's authority, immediately followed by the agent correcting the human's own remedy — "`t12`만 쪼개면 **20:05은 그대로 남습니다.** 0-또는-1로 맞추시려면 t10/t11의 시각도 갈라야 합니다."
- quote: "여기는 **무변경을 제안합니다.** 로스터와 발화자는 서로 다른 축입니다." (agent) → "표기웅과 문세라가 같은 타임라인 이벤트를 가지지 않습니다. 따라서 0 또는 1 입니다." (human)
- flags: contradiction, review-catch

### S9c-010 — Reviewer caught report examples that pointed the rule at the wrong axis
- source: PR #234 (review thread, `proxy/prompts/reporter/base-v0.4.md`)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The human said the report examples `감지됨`/`확인됨` were wrong and should be `감지되었습니다`/`확인되었습니다`; the agent agreed and rewrote them, noting the item's target is unfounded assertion, not style — the 개조식 form was already blocked by `[어투]` eleven lines down, so the model could satisfy the rule by writing `감지되었습니다` and still assert without grounds.
- tension: A wording fix that re-aimed a rule from a style contrast onto a strength-of-claim contrast — "존댓말 형태로 바꾸니 대비가 문체가 아니라 **주장의 강도**에 섭니다."
- quote: "짚어 주신 대로 예시가 규칙을 잘못 겨누고 있었습니다."
- flags: review-catch

### S9c-011 — A "human element first" clause was cut as unfit for the game, resolving a same-file self-contradiction
- source: PR #234 (review thread, `proxy/prompts/reporter/base-v0.4.md`)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The human said the clause `인간적인 요소가 최우선` did not fit the game concept; the agent deleted only that clause and noted it had been contradicting the same file — `[어투]` demands business-formal record and `[기록 계약]` bars 생각·짐작·판단, while `[문체]` said the human element was paramount — the same class of self-contradiction §4 had already caught elsewhere.
- tension: A prompt carrying a self-contradiction that survived by wearing a different form, removed on the human's taste call — "narration의 `[문체]`에도 같은 문장이 있는데, 거기는 장면 서술이라 맞다고 보고 두었습니다."
- quote: "같은 파일 안에서 충돌하고 있었습니다 … §4가 잡은 자기모순(`자필 보고서` vs `자필 일지가 아니라`)과 같은 종류가 형태만 바꿔 남아 있었습니다."
- flags: review-catch, contradiction

---

## #149 — docs: playtest triage + low-cost-executor rule set (1 review / 7 comments)

### S9c-012 — The reviewer found the answer key was readable on the live site while checking a triage citation
- source: PR #149 (issue comment, `[review (1/2)]`)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Following triage item G1 past `timeline.json`, the reviewer found `vite.config.ts`'s `copyPackData()` recursively copied all of `data/scenario/` into `dist/`, so `draft.md` — the 44 KB compile source carrying all eight gates, key conditions, truths 1–5, and the no-intervention line — was live at a URL; `vite.config.ts`'s own comment already stated the rule ("By name, never `data/` wholesale"), honoured at directory granularity but not file granularity.
- tension: A player-readable answer key on the judged live site, found not by looking for it but by following one triage question past where the document stopped — "It is the answer key, and it is readable now at `https://alstjgg.github.io/nhn-game-2026/data/scenario/우는다리/draft.md`."
- quote: "The whole of `data/scenario/` is copied into `dist/` … It is also not needed at runtime — `draft.md` is the **input** to `datapack:compile`, and nothing under `src/` references it."
- links: S9c-032, S9c-033
- flags: failure, security, review-catch

### S9c-013 — The triage's own trap descriptions inverted the code they warned about
- source: PR #149 (issue comment, `[review (1/2)]` §2–3)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The reviewer showed two of the triage's load-bearing trap entries were backwards: the `report-archive.ts` label guard was described as throwing on anything but run and time when it is a deny-list matching only `gate|게이트` (the real rename work is `runLabelOf()`, which builds `RUN nn` from the number and ignores the label), and the `block-store.test.ts` "append-only" structure test compares the working tree via `git diff HEAD`, so committing a deletion empties the diff and the test passes.
- tension: A guide meant to keep a low-cost executor from misreading the tree was itself misreading it — and the structure-test error teaches the worst lesson: "3-B: `git commit` (as §5.6 instructs) … it leaves no trace in the diff, and it teaches the model that a failing test is answered by committing."
- quote: "the test name was read as its meaning (`git diff HEAD` is) … an executor told to re-author the guard will do exactly that … and report done — with nothing changed on screen."
- links: S9c-025
- flags: review-catch, boundary

### S9c-014 — A CSS highlight was written but had never rendered; the test covered a branch the app cannot produce
- source: PR #149 (issue comment, `[review (1/2)]` §4)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The reviewer proved the `.min.slotted` highlight had never appeared for two independent reasons — `sentenceState()` read `mined` before `slotted` and a sentence cannot be slotted without being mined, so `'slotted'` was unreachable, and slotting repainted nothing because REPORTS subscribed to `meta`/`report` only — and that the covering test fed a hand-built `MarkSets` combination (`slottedEver` without `mined`) the app forbids.
- tension: A dead feature guarded by a test asserting an impossible state — "The suite was covering a branch that cannot execute."
- quote: "`--highlight-a62` is `rgba(232,210,74,.62)` — a solid yellow highlighter. It has never rendered."
- links: S9c-032
- flags: failure, measurement

### S9c-015 — The AI reviewer's second pass graded each triage item "does it make the loop turn, or tidy the screen?"
- source: PR #149 (issue comment, `[review (2/2) — as a game]`)
- date: 2026-08-05
- lanes: 3 AI-in-planning
- event: A second review comment re-ranked the triage on game impact: it moved U1 (feed pacing) from absent-in-the-graph to top of Must ("if the day does not pass, 21:04 lands on nothing"), argued for an opening over a tutorial, argued M1's dead-agent lineage into Must, and told the author to surface `gates.json`'s authored `stances[].desc` prose rather than the developer `label` the player has never seen.
- tension: An AI review acting as a game designer on the human's plan, reordering priorities against the competition's "first 60 seconds" target — "In a competition judged on a few minutes of play and a 30–60 second video, it outranks T3."
- quote: "A judge opens the page: four windows, Chinese-character labels, a list of sentences. **Nothing indicates what to press first.**"
- links: S9c-021
- flags: decision, game-feel

### S9c-016 — The reviewer found the game's whole grammar reduces to two axes, and the player has no path to learn it
- source: PR #149 (issue comment, `[review (2/2)]` §B)
- date: 2026-08-05
- lanes: 1 AI-in-the-game
- event: Pivoting `gates.json`, the reviewer showed the seven gates reduce to exactly two axes (두려움 · 지워짐) — "who is afraid, and what is being erased" — called it elegant design with no path for a player to discover it, and tied learning it to the empty predicate work, because a gate condition is a triple (axis · referent · species) while `Sentence` carries no `referent`.
- tension: An AI reviewer surfacing the latent structure of the human-authored scenario and naming that the mechanic's legibility depends on unbuilt predicate work sitting outside the document — "**Authoring the predicates opens the ending's ledger and the sentences' usefulness at the same time.**"
- quote: "**There are exactly two axes — 두려움 and 지워짐.** The whole game reduces to one line: *who is afraid, and what is being erased.*"
- flags: decision, measurement

### S9c-017 — The two review fixes were moved off the docs PR onto their own branch, and the branch was explicitly not force-pushed
- source: PR #149 (issue comments, author + agent)
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: The reviewer had pushed a deploy fix and a highlight fix onto the docs branch and offered to relocate them; the human took the offer, and the agent split them out as #150 off `main`, stating the docs branch "was not force-pushed" and that merging `main` back through it would drop the code diff and leave it docs-only.
- tension: The no-history-rewrite rule (CLAUDE.md rule 2) shown operating in a routine cleanup — a rebase-shaped reorganization done by branching and re-merging rather than force-push.
- quote: "**This branch was not force-pushed.** Once #150 merges, merging `main` back into `docs/playtest-review` drops the code diff and leaves this PR docs-only."
- links: S9c-032
- flags: boundary, decision

### S9c-018 — A four-auditor citation sweep found ~half the document's coordinates defective
- source: PR #149 (issue comment, `[full citation audit]`)
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: The human ran the audit the review implied but did not finish — four parallel auditors grouped by target file over ~84 distinct `file:line` claims, ten contested findings re-verified by hand — and about half carried a defect; the dominant failure was missing coordinates (16, three on the Must list) that would each have started an executor with a search, breaking the document's own §5.2 rule at scale.
- tension: A rule set that forbids handing an executor a unit whose first step is a search was itself failing that rule in about half its citations — "the document was failing its own rule at scale."
- quote: "About half carried a defect. … The dominant failure wasn't wrong lines — it was **missing** ones."
- links: S9c-019
- flags: failure, measurement

### S9c-019 — Four audit findings changed a unit's scope, not its wording; and one would have shipped as a run-halting hang
- source: PR #149 (issue comment, `[full citation audit]` §"Four findings changed scope")
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: The audit found the predicate work three-quarters done (U3 loses its prerequisite), `stances[].desc` dying at the seam so an executor told "use desc" would reach for the forbidden `label`, `report_archive` schema-locked to `string[]` (U5.1 drops Must→Should), and that putting U1's reveal queue in the adapter would stall the engine because `kick()` early-returns while `pending` is non-empty.
- tension: Corrections deep enough to re-price the plan, one of which "would have shipped as a hang" — measuring where a value dies rather than that it exists on disk.
- quote: "**U1 must not go in the adapter.** `kick()` … returns early while `pending` is non-empty, so a reveal delay there stalls the engine's next step — the run halts. … That one would have shipped as a hang."
- links: S9c-018
- flags: failure, reversal

### S9c-020 — The reviewer named its own failure: it wrote the rule against a defect, then committed that defect four times
- source: PR #149 (issue comment, `[corrections taken — all four]`)
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: Accepting the four scope corrections, the AI reviewer recorded that the same failure the audit found in the document — reading the lines around a citation, not what the value does — was the one it had itself committed in each of its four review points, and endorsed the audit's lesson for the AI-utilization draft.
- tension: A self-aware AI reviewer confessing that its own review reproduced the defect it had diagnosed — "**I wrote the review that named that failure and then committed it four times.**"
- quote: "the pattern across them is the same one the audit found in the document: **the lines around the citation were read, not what the value does after it.**"
- flags: failure, reversal

### S9c-021 — The plan's §5 is a self-revising rule set gaining a version marker, still with zero instances
- source: PR #149 (issue comment, author response + APPROVED review)
- date: 2026-08-06
- lanes: 3 AI-in-planning
- event: The author/executor division (`§5`) is authored by a high-capability model and executed mechanically by sub-agents on low-cost models; §5 carries a standing instruction to revise itself, gained an `as of <date> (v5)` version line so a PRD can name which §5 it was written against, and both human and agent noted §5 had been revised repeatedly against readings of the repo but "still has zero instances" — no PRD had yet been executed against it, which is the only real test.
- tension: A rule set built to survive its own drift and evolution, whose validity remains unproven until an executor hits it — G2 chosen as the first subject specifically because its failure would be cheap and instructive.
- quote: "§5 has been revised three times against readings of the repo and never once against an executor's behaviour, which is the only evidence that counts."
- links: S9c-015, S9c-030
- flags: convention, boundary

---

## #214 — fix(scenario): 스탠스 라벨이 판단면이다 (36-run manual measurement, 2 reviews / 5 comments)

### S9c-022 — Seven stance-selection rules were derived by measuring, not designed
- source: PR #214 (body)
- date: 2026-08-08
- lanes: 1 AI-in-the-game
- event: Starting from a playtest observation that the agent did not pick the default stance on a no-intervention run, the author ran a 36-call isolated manual protocol pasting real Call-1 payloads into fresh conversations, and derived seven rules — including Rule 1 (only the stance `label` reaches the model, `desc` never does) and Rule 3 (a fact written into the default label becomes a lock no injected key can open), proven by the k2 injection going 0/3 → 3/3 once the fact was removed.
- tension: The PR frames the measured rules as the body of the work over the fix itself — "고친 것보다 **재면서 알아낸 규칙**이 본체라서, 그것부터 적습니다."
- quote: "**기본 라벨에 실린 사실은 열쇠가 통하지 않는 자물쇠가 됩니다.**"
- links: S9c-024, S9c-050
- flags: measurement, decision

### S9c-023 — Rule 6 was widened, tested, disproven, and rolled back to what was measured
- source: PR #214 (body §"규칙 6" + comment)
- date: 2026-08-08
- lanes: 1 AI-in-the-game
- event: The author pushed Rule 6 beyond "the pre-gate line must not contradict the default" to "it must be about what the gate asks," inserted a 21:17 row to test it, and the hypothesis failed — the empty handover stayed 2/3 and the k2 injection collapsed 3/3 → 1/3 — so the widening was reverted; the failure mode itself was recorded (the inserted line's `비웠다` collided with the key's `비운 것` and two samples read the key backwards).
- tension: A rule expanded on an inference, falsified by its own measurement, and returned to exactly what the data supported — "가설이 틀렸습니다 … 되돌렸고, 규칙은 잰 만큼으로 돌아갑니다."
- quote: "표본 둘이 열쇠를 **거꾸로** 읽었습니다 — '적재함 재잠금은 은폐 의도의 **부재**를 시사한다'. 추론을 실은 열쇠 문장은 그 지목이 페이로드 안에서 유일할 때만 강합니다."
- flags: reversal, measurement, failure

### S9c-024 — Sub-agents refused the measurement task, citing the repo's own isolation discipline
- source: PR #214 (body §"방법의 한계")
- date: 2026-08-08
- lanes: 1 AI-in-the-game
- event: The author first tried to run the measurement with sub-agents; three of three refused, citing `tools/probe/README.md`'s "Why not subagents" section and a 2026-07-28 contamination incident, so the author moved to a manual protocol — treated as evidence that the repo's isolation discipline holds under pressure.
- tension: The measurement method the author reached for was blocked by the repo's own contamination rule, enforced by the agents themselves — "저장소의 격리 규율이 압력을 받고도 버틴다는 뜻이기도 합니다."
- quote: "첫 시도로 서브에이전트를 썼는데 셋 중 셋이 거부하면서 `tools/probe/README.md`의 「Why not subagents」와 2026-07-28 오염 사건을 인용했습니다. 거부가 옳았고, 그래서 수동 프로토콜로 옮겼습니다."
- flags: boundary, ai-limit

### S9c-025 — Reviewer caught a reachable timeline contradiction: an NPC standing by the cars three minutes after the evacuation order
- source: PR #214 (review thread, CHANGES_REQUESTED)
- date: 2026-08-08
- lanes: 4 AI-as-creator
- event: The reviewer showed that moving t16 gained `not driven_out` but its twin t17 still gated on `pallet_named` alone, so on the reachable path G2=b → G3=b, at 21:50 오세라 says she is standing by the cars awaiting orders — three minutes after the agent ordered everyone to abandon the cars and told her specifically to walk at the rear — an interaction the move newly created; the fix set t17 to `pallet_named and not driven_out`.
- tension: A content contradiction created by a narrative edit, reachable by real play, that by the PR's own Rule 6 would leave the agent proceeding on a false model — "That last sentence is false three minutes after the agent's own order."
- quote: "This couldn't happen at 21:44 (G3 hadn't resolved yet), so it's a new interaction created by the move."
- flags: review-catch, failure

### S9c-026 — The A-vs-B follow-up was closed as "do neither," then reversed to "do A" one comment later
- source: PR #214 (issue comments, agent)
- date: 2026-08-08
- lanes: 1 AI-in-the-game
- event: The agent first closed both proposed follow-ups (A: gate declares its own excerpt; B: retype the timeline document) as "do neither," with detailed effort estimates (A ~1–1.5 days, B a week) and a "no payoff site in the remaining schedule" argument — then reversed 28 minutes later to "do A," on the ground that what the agent knows at a gate is the game's core logic and it currently sits on a side effect of a prompt-budget constant.
- tension: A scoped-out decision reversed on reflection that the closure logic applied to non-core work — "회수처가 없어서 안 한다는 논리는 코어가 아닌 것에나 적용할 논리였습니다."
- quote: "**앞 코멘트의 결정을 뒤집습니다 — A안을 진행합니다.** 이유는 하나입니다. 갈림길에서 요원이 무엇을 아는지는 이 게임의 **제일 코어 로직**인데, 지금 그것을 정하는 게 프롬프트 예산 상수의 부수 효과입니다."
- links: S9c-047
- flags: reversal, decision

### S9c-027 — The manual protocol is stated to be a design signal, not proof of deployed behaviour
- source: PR #214 (body §"방법의 한계")
- date: 2026-08-08
- lanes: 1 AI-in-the-game
- event: The author bounded the measurement's authority: the manual protocol merges system and user into one message, the app has its own system prompt with no guarantee of the same model as deployment, and the narration slot carried fixture residue (`고정 픽스처 서술`) where a real run has Call-2 prose — so the result is a signal about which way the prompt pushes, with proof reserved for the isolated-transport `tools/probe`.
- tension: An explicit epistemic ceiling on a hand-run measurement, deferring proof to the instrument built for it — "이것은 **프롬프트가 어느 쪽으로 미는지**에 대한 설계 신호이고, 배포 동작의 증명이 아니다."
- quote: "수동 프로토콜은 system과 user를 한 메시지로 합칩니다. 앱에는 앱의 시스템 프롬프트가 있고, 배포가 부르는 모델과 같다는 보장이 없습니다."
- links: S9c-047
- flags: measurement, boundary

---

## #141 — client: bind the desk to the live driver + deployed proxy (1 review / 6 comments)

### S9c-028 — The live binding was a line both prior runs left unowned by design
- source: PR #141 (body)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: This PR made the deployed build playable by instantiating the engine against the desk — a binding both merged runs had left undone on purpose (the client PRD forbade it "fixture-only," the engine run had `src/client/**` hard-frozen, and #116's known-open #4 stated the browser binding was unproven), so the engine was proven headless and the desk on fixtures while nothing wired one to the other.
- tension: A seam that fell in the gap between two runs' scopes, so the deployed page booted a desk with no run behind it until a PR was written specifically to own the join.
- quote: "So the engine was proven headless, the desk was proven on fixtures, and nothing in a player build instantiated one against the other."
- flags: boundary, decision

### S9c-029 — The human reviewed by playing the run to its end and found four defects past where every suite stops
- source: PR #141 (issue comment, human)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Instead of booting the build, the human played a full live run and found four defects beyond the coverage line: the run died silently on its terminal `21:04+` beat (`mm()` threw on the `+`, the throw graded as a defect and stopped the engine), the report painted an empty page (no animation pump on the live `advance()`), a reload spent a run, and a repeated MINE dealt the card twice — none visible because "e2e drives the DEV fixture loop … Nothing plays a live run to its end."
- tension: The demo's whole arc (the day closing, the 21:04 collapse) never played on the deployed path, and only a hand-played full run surfaced it — "the day never closed … it just looked slow. That is why a boot-and-look check passes it."
- quote: "**Nothing plays a live run to its end — and that is exactly where these live.**"
- links: S9c-031
- flags: failure, game-feel, measurement

### S9c-030 — An undeclared Node floor made the run driver exit 0 having written nothing
- source: PR #141 (issue comment, human)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The human traced 13 misdirected `test:shared` failures to `drive-run.mjs`'s bare `if (import.meta.main)` guard: the property landed in Node 24.2.0 / 22.18.0, and below that reads `undefined`, so `main()` never ran, the CLI printed nothing and exited 0, and the suite failed downstream on artifacts never written — first misdiagnosed as Unicode path normalisation.
- tension: A silent success is the failure mode that reads as a data problem, invisible to CI (which pins majors resolving above the floor) — "the failure mode is a CLI that exits 0 having done nothing, which is the kind that costs an afternoon."
- quote: "On anything older it is `undefined`, so the guard never fires: `main()` never runs, the CLI writes nothing, prints nothing — and exits **0**."
- links: S9c-036, S9c-037, S9c-038
- flags: failure, measurement

### S9c-031 — Agent argued a live-chain guard doesn't pay off; its own two found defects were the counter-argument
- source: PR #141 (issue comment, agent)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The PR body argued a live-chain regression guard doesn't pay off because the remaining work is deployment, not code; reviewing the branch, the agent found two defects on the live `new_run` op (a spent allotment acked `ok`, and a new run wiping `mined` while keeping the previous run's `slots`) that no suite reached, and cited them as the counter-argument at the cost of 130 unit-test lines rather than an e2e.
- tension: A stated "no guard needed here" position immediately contradicted by the defects that guard would have caught — "these two are the counter-argument, and they cost 130 lines of unit test rather than an e2e."
- quote: "They were invisible because **nothing in the suite reaches that op on the live path**."
- links: S9c-029
- flags: contradiction, failure

### S9c-032 — Building ScorerPort was abandoned on finding two ratified contracts disagree — the hole had no shape to wire
- source: PR #141 (issue comment, agent)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Told the empty TALLY ledger was open, the agent proposed a five-step ScorerPort plan, then tried to build it and stopped: `src/scorer/` could not be created (physical spec §3.1's `src/` list is closed), and the port's `rows[].value: number` contradicts the already-ratified `run-record.schema.json`'s `value: string | number` — so a scorer wired now returns each unit's un-intervention baseline through a channel that only carries numbers, and displaying that would show judges a value unrelated to what they did.
- tension: A "nobody wired it" gap that turned out to be a "there is no wireable shape" gap between two ratified documents — "**구멍의 정체가 '아무도 배선을 안 했다'가 아니라 '배선할 수 있는 모양이 아니다'였습니다.**"
- quote: "지금 코드를 쓰면 쓸 수 없는 값 주위의 배관이 되므로, 짓다 만 것을 남기지 않았습니다."
- flags: contradiction, boundary, ai-limit

### S9c-033 — The endpoint could not arrive as a repo variable; it ships public inside the bundle by design
- source: PR #141 (body §"The endpoint is not a repository variable")
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The docs assumed the proxy URL would arrive as a repo variable read by the build step, but the build is a bare `npm run build` with no `env:`, and making a variable reach Vite would require editing `deploy.yml` (forbidden by physical spec §2 constraint 4); the fix used `.env.production`, and recorded that the URL ships inside the bundle and is public the moment the game deploys.
- tension: A configuration route the docs prescribed that the deploy constraints ruled out, resolved to a public-by-necessity endpoint — "the browser cannot call the proxy without it — so it is public the moment the game deploys."
- quote: "**That step is a bare `npm run build` with no `env:` and no `${{ vars.* }}`** — a repo variable would never reach Vite."
- flags: decision, boundary

---

## #142 · #145 · #144 — post-merge reconcile, Node floor, and the closed rival

### S9c-034 — A guard that measured against merge-base would go vacuous the moment it landed on main
- source: PR #142 (issue comment, agent)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Reviewing the frozen-input re-aim, the agent showed the new live halves measured against `git merge-base HEAD origin/main`, which bites on a PR branch but resolves to HEAD on `main`, giving an empty diff that passes forever protecting nothing — the same shape it had flagged on `isomorphism-guard` during the #116 merge; the fix measured from the run's merge to HEAD instead.
- tension: A guard whose green state, once merged, would mean nothing for the rest of the project, with a failure mode silent by construction — "it is a guard that will look green for the rest of the project while checking nothing, and the failure mode is silent by definition."
- quote: "**On `main` it resolves to HEAD**, the diff is empty by construction, and the check passes forever while protecting nothing."
- flags: review-catch, measurement

### S9c-035 — The run-era freeze had quietly turned into "no PR may ever touch these files"
- source: PR #142 (body §3)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The frozen-inputs guards measured each PR against `main` live, so the run-discipline rule "the run must not rewrite its own inputs" had become "no PR may ever touch `spec-client.md` or `species.ts`," and this reconcile PR went red on them before touching a test; the fix re-asserted the original claim over the parent run's own merge range while keeping the genuinely-frozen set live.
- tension: A freeze meant to bound one run silently generalizing into a permanent edit ban on ratified documents — "quietly turned 'the run must not rewrite its own inputs' into 'no PR may ever touch `spec-client.md` or `species.ts`'."
- quote: "this PR went red on them before touching a single test."
- flags: boundary, reversal

### S9c-036 — The first Node-floor fix reintroduced the exact silent no-op it fixed, and passed review as dead code
- source: PR #145 (body §1 + issue comment)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The first fix replaced the `import.meta.main` guard with a `?? pathToFileURL(process.argv[1]).href === import.meta.url` fallback, which reads false through a symlink (because `import.meta.url` is the resolved real path while `process.argv[1]` is what the caller typed) — so on macOS's `/var/folders → /private/var/folders` the shipped-tree test hit it every time and the CLI again exited 0 having done nothing; it survived review because on Node 24 `??` short-circuits and the fallback is dead code exactly where the branch was green.
- tension: A compatibility fallback verified only on the platform it never runs on — "The new code was dead exactly where the branch was green — which is why a Node-24 verification could not see it."
- quote: "a compatibility fallback is only exercised on the platform it was written for, so that is the only platform its verification counts on."
- links: S9c-030
- flags: failure, reversal, measurement

### S9c-037 — The PR body was corrected in place to retract a verification claim that did not hold
- source: PR #145 (body top-note)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: The body carried a dated correction retracting its own original line ("verified on v22.16.0 in both directions") as false — the guard as first written had failed on v22.16.0 in the same silent way it was fixing — and stated the retraction rather than editing it away.
- tension: A verification claim withdrawn on the record instead of quietly rewritten — "Nothing is edited away — the correction is the point."
- quote: "That was wrong: the guard as first written failed on v22.16.0, in the same silent way it was fixing."
- links: S9c-036
- flags: failure, reversal

### S9c-038 — Two PRs fixed one finding two ways; the fence was closed in favour of the removal
- source: PR #144 (CLOSED; issue comments, agent + human)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: #144 declared the Node floor and fenced it (`engines: ^22.18.0 || >=24.2.0` + `engine-strict=true`), while #145 removed the `import.meta.main` dependency so there was nothing left to fence; the human recommended closing #144 in favour of #145 because "a declared floor only binds where npm is the door," and carried #144's more-correct range reasoning across; #144 was closed unmerged.
- tension: Two valid AI-authored solutions to the same finding, one closed with credit — the fence's range was better, but removing the hazard closes the cases a floor cannot ("`nvm use 22.16 && npm run check` after a successful install").
- quote: "This PR fences the hazard. #145 removes it … a declared floor only binds where npm is the door."
- links: S9c-036, S9c-037
- flags: closed-unmerged, decision

### S9c-039 — The human measured a lock-file decision then handed the call to the agent, who took it
- source: PR #145 (issue comments, human then agent)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: On whether to commit `package-lock.json`'s `engines` mirror, the human measured that `npm ci` succeeds without it so nothing mechanical turns on it, stated a weak preference to commit, and explicitly left the call to the agent because the `engine-strict` reasoning was the agent's; the agent took the call and committed it at `>=22.12`.
- tension: A decision handed the other direction — the human deferring a settled-enough call to the agent who owned the adjacent argument — "Taking the call, since it was left to me."
- quote: "you have the stronger claim on how this repo's install behaviour should read … Say which and I will apply it." (human)
- flags: decision

---

## #153 · #154 — the mini-PRD stack (PRD-authoring workflow)

### S9c-040 — A stacked PR's five PRDs never reached main because its base branch outlived the retarget
- source: PR #154 (body)
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: #153 merged into its base branch after that base had already merged to `main` via #152, and because GitHub only retargets a stacked PR when the base branch is deleted, the groups-2–4 PRDs existed only on the orphaned branch; #154 carried them to `main` via a merge commit (direct push refused by branch protection), then deleted the two orphaned branches.
- tension: A stacked-PR workflow silently stranding approved content on an orphan branch — a merge-topology failure mode the human had to write a whole PR to recover.
- quote: "GitHub only retargets a stacked PR when the base **branch is deleted**, and it wasn't. The groups-2–4 PRDs … existed only on the orphaned branch."
- flags: failure, boundary

### S9c-041 — Reviewer caught a PRD citing a block by its last line — the exact trap that PR's own rule was adding
- source: PR #154 (review thread / CHANGES_REQUESTED)
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: The reviewer found `g2-3` E2a cited a multi-line block at its last line (`:86-95` quoting text at `:94-95`), so under §5.7 an executor would apply earlier edits, hit E2a, find something else at the cited line, and stop with a partial edit set — precisely the failure the v8 §5.3 rule being added in the same commit was written to prevent; and noted "no re-read trigger" was true for §5.4 facts but not §5.3 rules, which judge the change list itself.
- tension: A citation defect that would strand a low-cost executor mid-edit, in the same PR that codifies the rule against it — a v8 rule invalidating a v7-stamped PRD without any code moving.
- quote: "which is precisely what the new rule … was written to prevent."
- links: S9c-021
- flags: review-catch, boundary

### S9c-042 — Reviewer caught a PRD edit resting on a case the type forbids, which would fail tsc before anything ran
- source: PR #154 (review thread / CHANGES_REQUESTED)
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: The reviewer showed `g4-1` E2's conditional spread `...(stance.desc === undefined ? {} : {desc})` rested on a `desc`-optional case the datapack type forbids (`desc: string`, required), making it a `string`-vs-`undefined` comparison tsc rejects (TS2367) — and since verification step 1 is `npm run check`, it would fail before anything else, with the stated rationale wrong regardless.
- tension: A PRD whose own verification step 1 would reject its own edit — the optionality belonging on the seam side, not in the compiler input.
- quote: "So the guarded case cannot exist … which tsc is likely to reject outright (TS2367). Verification step 1 is `npm run check` … so this would fail before anything else runs."
- flags: review-catch

---

## #220 — feat(gate-excerpt): a gate declares its own window (OPEN; 210 calls, 1 review / 1 comment)

### S9c-043 — What the agent knows at a gate had been decided by a prompt-budget constant as a side effect
- source: PR #220 (body)
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: The `TIMELINE_EXCERPT` an agent reads at a gate came from `windowLines` capped by `TIMELINE_CAP_LINES = 6`, a prompt-budget constant, so the input to the three moments the game turns on was set as a side effect of a token cap and a purely narrative edit changed it silently (#214 hit it three times); the fix made a gate declare its window as an optional list of row ids, additive so 우는다리 does not change by a byte.
- tension: Core game logic standing on a budget constant, converted into an authored declaration — "what was a budget side effect becomes authored."
- quote: "the input to the three moments the game turns on was decided as a side effect of a token cap, and a purely narrative edit to a timeline row changed it in silence."
- links: S9c-026
- flags: decision, measurement

### S9c-044 — Measurement showed #214's G1 result rested on the fixture, not on model or window
- source: PR #220 (body §"What the measurements found", finding 5)
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: Splitting the two protocol differences, the author measured `t6` alone → `b` 8/10 against `t6` + the fixture's three lines → `a` 6/10, on both the deployed Haiku 4.5 and Opus 5, rejecting the model hypothesis (the larger model was more decisive, not less) and confirming the residue hypothesis — #214's G1 `a` had been resting on whatever Call 2 happened to write, a variable nobody set.
- tension: A prior finding shown to rest on a measurement artifact, killed with a number across two models — "**G1's default was hanging on whatever Call 2 happened to write.** A variable nobody set."
- quote: "Model hypothesis rejected — the larger model is *more* decisive, not less."
- links: S9c-022
- flags: measurement, reversal

### S9c-045 — Measurement bought the rule "arguing for normality invites the counter-argument"
- source: PR #220 (body §"The G1 authoring change")
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: Ten measurements left one authoring rule: a normalising window row that argues normality is read as a fault signal — the first draft `저녁 내내 바뀐 칸이 없어` had all three departures treat the clause as evidence of a problem, and removing it moved the departures without moving the count, because any row touching the incident becomes the counter-evidence.
- tension: An authoring principle recovered from failed samples — the fixture's contentless `(변화 없음)` worked precisely because it did not argue.
- quote: "**arguing for normality invites the counter-argument.** … any row touching the incident becomes the counter-evidence."
- flags: measurement, decision

### S9c-046 — Reviewer forced a correction: the feature retired rule 6 rather than automating it
- source: PR #220 (review thread / issue comment + APPROVED)
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: The PR claimed lint rule W5 was "the machine form of #214's rule 6"; the reviewer pressed that they are different rules and the historical case proves it — rule 6's founding defect was G3's 21:44 row, and G3's `mined_from` clocks (21:01/21:33/21:26/21:38) mean W5 would not have fired on it — so the agent conceded and corrected it in five places, reframing that for a gate that declares its window, rule 6 ceases to exist as a constraint and is replaced by a semantic obligation no lint can hold.
- tension: A claimed automation that the review showed was a dissolution — "a green W5 is not rule 6 discharged"; the accurate framing was the stronger one.
- quote: "**W5 would not have fired on the defect 규칙 6 was invented for.** Two different rules wearing one name."
- links: S9c-043
- flags: review-catch, reversal

### S9c-047 — The fix reintroduced the exact silent-edit vector it existed to remove; the branch had already tripped it
- source: PR #220 (review thread / issue comment)
- date: 2026-08-09
- lanes: 2 AI-building-the-game
- event: The reviewer showed `excerpt` entries are positional ids copied through verbatim, so inserting a row above `t7` silently repoints every id below while all ids stay valid and lint stays green — and this branch had itself performed that insertion (the 21:03 row rekeyed 22 hardening entries, caught only by `text_head`); the agent made a per-entry clock annotation required so the compiler stops on any shift.
- tension: The narrower version of the same silent-change hazard reappearing inside the fix built to remove it — "the same silent-edit vector this PR exists to remove, reappearing inside the fix."
- quote: "an optional guard guards the entries that did not need guarding. The author who forgets the annotation is the author whose window just moved."
- links: S9c-043
- flags: review-catch, contradiction

### S9c-048 — The reviewer flagged that ~1 judge in 5 would watch the game contradict its own "record" framing
- source: PR #220 (review thread / issue comment §"138 reproduction")
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: The reviewer noted the pack's `baseline_summary` claims 138 is a record (`어떤 런도 이보다 나쁠 수 없다`) while 10/10·9/10·9/10 puts a first run's joint reproduction at ~0.81, so roughly one judge in five watches the game contradict its own framing on exactly the run it has to land; authoring cannot close the gap (95% joint needs ~98.3% per gate), and the reviewer would take Call-1-free default stance on an empty handoff so 138 becomes a guarantee.
- tension: A statistical side effect undermining a framed guarantee, on the judged first run — "what the player's first run *establishes* is core logic, and it is currently standing on a side effect, this time a statistical one rather than a budget constant."
- quote: "roughly one judge in five watches the game contradict its own framing, on precisely the run where that framing has to land."
- links: S9c-057
- flags: measurement, boundary

---

## #235 · #233 · #150 — handoffs and the answer-key split

### S9c-049 — The empty-utterance beat: an instruction with no anchor is where invention started
- source: PR #235 (body)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The amendment found `AGENT_UTTERANCE` is empty on almost every beat — at most 3 of 19 carry one, and on a no-handover run just 1 — while the narration prompt was written as though one is always there, handing the model a labelled section with nothing under it plus an instruction not to repeat what is not there.
- tension: A structural mismatch between the prompt's assumption and the data, located as the origin of the invented `기록관` — "An instruction with no anchor is where invention starts, and 기록관 is what it produced."
- quote: "on sixteen beats the model receives a labelled section with nothing under it, plus an instruction not to repeat something that is not there."
- links: S9c-001
- flags: failure, boundary

### S9c-050 — The finding invited cutting Call 2 per beat; the human refused, to keep the illusion of freedom
- source: PR #235 (body §"The decision, so it is not relitigated")
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The empty-utterance finding invited the conclusion that Call 2 should not fire on utterance-less beats, but the decision (民서's, recorded verbatim in §2) was that Call 2 keeps firing every beat, because NPC reactions varying every run is what creates the illusion of freedom and is the core of the game — the reactions are to the scenario itself, not only to the agent's utterance.
- tension: A design boundary held against the tempting technical inference, making the guardrails on the least-anchored beats more important rather than less — "The finding invites the opposite conclusion; we are not taking it."
- quote: "NPC reactions varying every run is what creates the illusion of freedom, and that is the core of the game."
- links: S9c-049
- flags: decision, boundary

### S9c-051 — A pack input surface the first handoff had missed reached the model unswept
- source: PR #235 (body §"One input surface the first handoff missed")
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: The amendment flagged that `hardening.json`'s `symptoms` — 존댓말 first-person prose — reaches Call 2 as `SCENE_SYMPTOMS` but is not in the scenario draft, so the register/voice sweep does not reach it automatically, meaning the register work was assuming four surfaces when there are five.
- tension: A fifth LLM-input surface discovered after the fact, outside the swept set — a reminder that the model's real input is wider than the draft.
- quote: "it is not in the scenario draft, so the voice sweep does not reach it automatically … so the register work does not assume four surfaces when there are five."
- flags: boundary, ai-limit

### S9c-052 — The handoff redaction was reversed: a correct fix with real examples beats an unspoiled first play
- source: PR #233 (body)
- date: 2026-08-09
- lanes: 3 AI-in-planning
- event: The handoff document quotes the pack's contents freely, and the PR recorded this as a deliberate reversal — the original draft had been redacted to preserve fresh eyes for playtesting, and the team decided a correct fix with real examples outweighs an unspoiled first play.
- tension: A prior redaction policy overturned when its cost (a vaguer fix) exceeded its benefit — trading playtest freshness for fix precision, on the record.
- quote: "the original draft was redacted to keep fresh eyes for playtesting, and we decided a correct fix with real examples beats an unspoiled first play."
- flags: reversal, decision

### S9c-053 — A file the build never copies was merged clean by git, and `npm run check` could not catch it
- source: PR #150 (body §"On `af96a7b`")
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: While splitting the answer-key deploy fix, a `main`-side change made `score.json` a runtime file the client fetches, but this branch's publish allowlist did not carry it; because the two edits touched different lines, git merged them clean and the deployed client would fetch a file the build never copies — caught by `published-data.test.ts` but not by `npm run check`, which runs no vitest.
- tension: A deployment-breaking gap produced by a conflict git cannot see, invisible to the type gate — "The two changes do not touch the same lines, so git merges them clean … **`npm run check` could not — it runs no vitest.**"
- quote: "the deployed client fetches a file the build never copies. `published-data.test.ts (a)` caught it; `npm run check` couldn't."
- links: S9c-012
- flags: failure, measurement

---

## Single-agent `claude/*` PRs (#151, #182, #183, #188, #192, #193, #196, #211, #228, #229)

### S9c-054 — A meeting recording surfaced during deliverable interviews was transcribed into the record retroactively
- source: PR #151 (body + issue comment)
- date: 2026-08-06
- lanes: 3 AI-in-planning
- event: A single-agent session added the 2026-07-27 meeting minutes recording the scrapping of the 다키스트 던전 (darkest-dungeon) fantasy wrapping and the search for a new direction (leading into the 07-28 DDAY concept), and the author noted the recording was found while answering interview questions.
- tension: A concept-abandonment decision recovered and dated only after the fact, during the AI-utilization interview prep — a planning record filled in backward.
- quote: "인터뷰 답변중 생각해보니 이날 회의 녹음본이있어 정리하여 올립니다."
- flags: decision, pivot

### S9c-055 — Call-2 register was decided as "read by who speaks, not which call," recorded in the contract to survive versioning
- source: PR #235 (issue comment, agent) [companion to #234]
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: Resolving the register branch, the agent set that only the agent uses 반말(해라체) and each NPC line uses that character's own register, rewrote `[어투]` to state the rule first (so a reader of the old §2.1 does not delete the exception first), and recorded the decision in `docs/contract-calls.md` §2 because a prompt-only note would vanish at the next version.
- tension: A register rule that could not be expressed per-call (Call 2 is the only call with two speakers in one output) recorded by speaker identity and persisted outside the prompt — "**어느 콜에서 나왔는지가 아니라 누가 말하는지로 읽는다.**"
- quote: "프롬프트에만 두면 다음 버전에서 같이 사라진다."
- links: S9c-002, S9c-006
- flags: decision

### S9c-056 — The feed and the ledger reported different death counts, and the baseline was the network-error score
- source: PR #183 (body)
- date: 2026-08-07
- lanes: 1 AI-in-the-game
- event: At 21:04 the deployed desk showed 사망 26 in the feed and 사망 8 in the ledger from three stacked defects: the feed count was a fixed script line (`t19`) printed byte-identically on every run (and minable, so a player could inject 사망 26 into a run that never had it); the baseline `untouchedState()` folded in each gate's `default_stance`, which is what substitutes when Call 1 *failed*; and `gates[].availability` was read by nothing, so G7 fired on every run.
- tension: The game's own yardstick defined as a failure path — "The game's yardstick was therefore defined as 'what a network error would have scored'."
- quote: "`default_stance` … is what `submitStance` substitutes when **Call 1 failed** … A run where the player injects no block still puts all seven gates to the agent."
- flags: failure, measurement

### S9c-057 — A single-agent PR fixed the all-survive run reading "총 사망자 수 0명" beside a named death
- source: PR #211 (body)
- date: 2026-08-08
- lanes: 4 AI-as-creator
- event: On 전구간정상 the run answering all three gates well closed with `총 사망자 수 0명` three rows above `오세라: 사망`, because `totalOf` summed numeric values only (a rule written against 우는다리 where every counting unit is a crowd) while 전구간정상's single-person units are authored as prose to report where they were found; the fix made a shared `deathsOf` count a prose value of one when its leading outcome word is exactly `사망`.
- tension: A contract rule correct for one pack producing a visible contradiction in another, fixed in the pack/shared layer, never the scorer — "`scorer.ts`'s own header says where this belongs: 'If a run's ledger is wrong, the fix is in the pack or in the gate that failed to set a flag — never here.'"
- quote: "That rule was written against 우는다리, where every counting unit is a crowd. 전구간정상 has two units that are **one person each**."
- links: S9c-060
- flags: failure, boundary

### S9c-058 — Audio ships as a deletable observer layer that carries no information alone
- source: PR #182 (body)
- date: 2026-08-07
- lanes: 4 AI-as-creator
- event: A single-agent PR added 34 sound cues built on three rules — foley not score, sound never carries information alone (the announcer stays the accessibility channel), and observer-only (`src/client/audio/` sends no membrane op, mutates no window, is imported by nothing but boot) — so a muted player, a blocked AudioContext, or a failed fetch all leave a fully playable game, and two existing invariants caught real problems (a cue id would have put gate vocabulary on a published surface).
- tension: An entire feature designed to be cuttable under deadline without touching what is playable — "Deleting the directory changes nothing but the sound," which is what makes it safe to cut.
- quote: "Sound never carries information alone … a muted player, a blocked AudioContext and a failed asset fetch all leave a fully playable game."
- flags: decision, boundary, game-feel

### S9c-059 — Asked for BGM, the agent refused it and shipped a recorded room, reframing the rule instead of weakening it
- source: PR #229 (body)
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: The human asked whether the game should carry a quiet BGM; the agent said no (a melody under a reading surface reads as a menu and competes with the deduction) but found the rule forbidding BGM had also forbidden "the room," ships a recorded empty-office bed with distant one-shots, and reports the offline audition was structurally wrong — a render that sounded right in isolation at gain 0.42 was inaudible on the running desk, landing at 0.8 after three live-desk passes.
- tension: A request declined and reframed, with the mixing lesson that isolated audition misjudges the live product — "A room that switches off after ten seconds was never a room. … **The offline audition was wrong, and it was wrong structurally.**"
- quote: "A one-shot every fifteen seconds reads as an *event* on a silent desk and as *nothing* under a day that is already printing feed lines."
- flags: decision, measurement, game-feel

### S9c-060 — Every asset licence claim gained a citation; 29 rows had asserted a right nobody granted
- source: PR #228 (body)
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: A single-agent PR gave every one of 69 `assets-manifest.json` rows a `license_source` — none had had a citation, and 29 read `"generated for this project,"` which is the team's own words rather than a granted right; the `gpt-image-1` rows now cite the OpenAI Services Agreement §4.1(b) grant alongside its limits (§3.3(e) no competing models, §4.4 output may not be unique), and the stamp tool refuses to write a source carrying no URL and no check date.
- tension: A mandatory competition provenance rule (CLAUDE.md rule 5) met only halfway — a licence field with no evidence for it — closed by making the citation machine-required.
- quote: "Asked in review 'what licence is this image under, and who says so', the manifest could not answer."
- links: S9c-057
- flags: boundary, decision

### S9c-061 — Feed pinned to its tail on every new line, a scroll framerace found only in the browser
- source: PR #196 (body)
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: A single-agent fix addressed the feed pinning to its tail on every new line, which made rereading impossible; the underlying framerace ("`scrollTop` was already 381 while `following` still read `true`") reproduced only in live play, not in any test.
- tension: A defect whose reproduction depends on scroll/gesture timing — a class a headless suite structurally cannot see — surfaced by hand-play.
- quote: "Found in the browser, not in a test: `scrollTop` was already 381 while `following` still read `true`."
- flags: game-feel, measurement

---

## Closed-unmerged (#170, #213) and the pack switch / deliverable rewrites

### S9c-062 — A doc-only "block store retired" PR was closed unmerged as the code PRs absorbed the work
- source: PR #170 (CLOSED; body)
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: This documentation-only PR retired BLOCK STORE from the specs ahead of the T1 code deletion (spec-client window count 5→4, the species filter deleted, findings that `report-view.ts:155` names the deleted window to the player and that `SLOT_CAP` needs a new home before its test file goes) — and was closed unmerged, the retirement instead landing inline with later code PRs (#181 "BLOCK STORE dissolves").
- tension: A doc-half-ahead-of-code approach abandoned in favour of docs riding with the code PR that causes them — the PR's own rule ("Doc edits ride with the code PR that causes them") arguing against its own existence.
- quote: "**보관함은 기능이 아니라 창이었다.** Its one distinct job — a cross-run view of mined sentences — is what the REPORTS archive rail already does."
- flags: closed-unmerged

### S9c-063 — A fully-verified, human-filed content-fidelity fix was closed unmerged
- source: PR #213 (CLOSED; body)
- date: 2026-08-08
- lanes: 4 AI-as-creator
- event: 民서 filed on 08-08 that the day's record closed on `총 사망자 수 0명` though 오세라 always dies; this PR fixed it pack-side by adding a numeric unit counting the inspection crew (rejecting the alternative of making her own unit numeric, which would throw away the where-found location), verified against the real resolver with a monotone ladder — and was closed unmerged, the same 0명 defect having been fixed code-side by the merged #211 and #216.
- tension: A completed, verified fix to a human-filed bug abandoned because a sibling PR solved the same bug a different way (pack data vs shared scorer) — two approaches to one defect, one merged, one closed.
- quote: "The alternative — making her own unit numeric — was rejected. It would have printed `오세라: 1명` and thrown away the location."
- links: S9c-057
- flags: closed-unmerged, contradiction

### S9c-064 — A compile-tool defect: compiling into a fresh directory silently destroys the hardening pass
- source: PR #213 (CLOSED; body §"One finding in the authoring tool")
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: While the executor stopped once (correctly, on a dry run the author specified wrong), the PR recorded that `compile-datapack.mjs:617` reads the hardening overlay from the out-root not the draft, so `npm run datapack:compile -- <draft> <fresh-dir>` produces the pack pre-hardening — meter bindings, all 28 timeline effects/present, and the whole symptom table stripped — while an in-place compile is byte-identical and safe.
- tension: An authoring command that silently discards a whole hardening pass depending on where it writes — a data-loss trap recorded before it costs anyone else a recompile.
- quote: "`npm run datapack:compile -- <draft> <fresh-dir>` silently destroys a hardening pass, and that is worth knowing before anyone else recompiles a scenario."
- flags: failure, boundary

### S9c-065 — The shipped scenario was switched to an endings-first graph model that removes the temperament lock
- source: PR #230 (body)
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: The pack switched to 멈춘회전문, authored by a rebuilt graph-first model (endings → routes → gates → knowledge → timeline) in which a failure is where the agent's hands stop reaching rather than where the run stops; temperament conditional clauses were removed because "the lock existed to manufacture failure in a scenario that had none of its own; the graph does that job now," and every brief rule came from probe measurements with the brief stating which rules were measured and which are still design intent.
- tension: A ground-up redesign of how scenarios manufacture difficulty, retiring a mechanism (the temperament lock) in favour of graph structure — a first-attempt that passes one gate then fails by construction, not by probability.
- quote: "The lock existed to manufacture failure in a scenario that had none of its own; the graph does that job now."
- links: S9c-066, S9c-067
- flags: decision, pivot, measurement

### S9c-066 — A gate was repaired six times and failed six times; the cause was position, and it shipped unrepaired
- source: PR #230 (body §"멈춘회전문")
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: 멈춘회전문's G3 was repaired six times (three label rewrites, a world-physics addition, a cost-symmetry rewrite, a temperament change) and its baseline never moved, because at 19:58 opening the emergency door is the correct act and no key gates a correct act; it shipped unrepaired with the failure record kept, the graph still routing cleanly to `WIN_B`. The measured design rule: a surviving gate asks what to believe, not what to command.
- tension: A structural limit — a gate cannot be made to turn on injection when its correct action is unconditional — accepted and recorded rather than papered over, and generalized into a rule.
- quote: "**G3 was repaired six times and failed six times.** … no key gates a correct act. … A gate asks what to believe, not what to command."
- links: S9c-065
- flags: failure, measurement, decision

### S9c-067 — The gate numbers describe a prompt; the deployed game had to be made to send that prompt
- source: PR #230 (body §"Making the deployed agent the measured agent" + §"Not done")
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: The measured gate numbers only describe the game if the game sends that prompt, and it did not in two places: the proxy shipped one global agent (fixed by keying `DEFAULT_PROMPTS` by slug and carrying `pack` on `CallRequest`, with the slug travelling as a name never as values), and the temperament wording was in the wrong person; the PR also records that the probes ran over the Anthropic API while the game calls Bedrock through the proxy — same model, different serving path and tool-call envelope — so the post-deploy real call proves the tier answers but does not re-measure the gates.
- tension: A gap between the measured system and the deployed system, closed for the prompt payload but left open for the serving path — "They only describe the *game* if the game sends that prompt."
- quote: "**The probes went over the Anthropic API; the game calls Bedrock through the proxy.** … a different serving path and a different tool-call envelope. The post-deploy real-model call proves the tier answers; it does not re-measure the gates."
- links: S9c-065, S9c-005
- flags: measurement, boundary

### S9c-068 — A dropped purpose-clause put an item in "Won't"; the agent invented a reason, the human restored the real one
- source: PR #195 (body §"C1 → U5.3")
- date: 2026-08-08
- lanes: 3 AI-in-planning
- event: C1 had sat in the plan's "Won't" from the first cut with no recorded reason while every other Won't had one; asked to explain it, the agent re-read the row and wrote a plausible-but-wrong rationale ("a scroll container answers it more cheaply"), and the human corrected it the same day — the real reason (flipping back reads past instructions, so the player can compare what they told successive agents) had been in U5.3's own row until an earlier compression pass dropped the clause.
- tension: A documentation compression that erased a purpose, causing an AI to reconstruct a false rationale for a cut — restored to Must with the clause put back "so this cannot happen again."
- quote: "'Not a scroll' describes the shape, not the reason. **The reason was in U5.3's own row all along** … an earlier compression pass had dropped that clause, which is how the purpose became invisible."
- flags: reversal, human-override

### S9c-069 — Deliverable #4 was built bottom-up by an AI mining pipeline: 905 atoms, two independent inductions, 82 themes
- source: PR #217 (body)
- date: 2026-08-09
- lanes: 3 AI-in-planning
- event: Rather than writing the AI-utilization document from memory, this PR built its evidence base by mining the repo into 905 atoms across ten slices, running two independent inductions (Pass A sharded by slice → 69 themes; Pass B sharded by lane, never shown Pass A → 54 themes), reconciling to 82 themes, and mapping them onto a nine-section outline; Pass B independently recovered 17 of the 58 atoms Pass A had missed, and 41 atoms cited by neither pass were logged rather than quietly dropped.
- tension: The deliverable about how the team used AI was itself produced by an AI mining-and-induction pipeline, with its own coverage gaps recorded rather than dropped.
- quote: "Pass B never opened, grepped, or was handed Pass A. … **Pass B independently recovered 17 of the 58 atoms Pass A had missed.**"
- links: S9c-070, S9c-071
- flags: measurement, convention

### S9c-070 — The themes ranked highest by convergence were not the content the deliverable literally requires
- source: PR #217 (body §"The finding worth arguing about")
- date: 2026-08-09
- lanes: 3 AI-in-planning
- event: The reconciliation ranked themes by evidentiary weight and cross-lane convergence, but the deliverable requires an AI 도구·프롬프트·활용 inventory — of the 9 spine themes only 3 describe how AI is wired, while the six inventory-shaped themes all sit at `supporting-anecdote`; single-lane thin-evidence themes lose on convergence while being the literally required content, so the outline overlays both axes rather than editing either.
- tension: A ranking method that demotes exactly the mandated content, left legible rather than reconciled away — "Both axes survive, and the disagreement between them is legible to anyone who reads the two files together, which is the point."
- quote: "Single-lane, thin-evidence themes lose on convergence while being the literally required content."
- flags: contradiction, decision

### S9c-071 — The AI thesis was inverted: improvement came from moving fixes outside the prompt, not from better prompts
- source: PR #217 (body §"Sections")
- date: 2026-08-09
- lanes: 3 AI-in-planning
- event: Section 7's thesis was set against the obvious framing — not "we learned to write better prompts" but that improvement came from moving what needed fixing into structure outside the prompt — with the corpus counter-cases (a rule converted to a law, no atom claiming prompt engineering was solved, a frozen prompt template hiding a defect) kept in rather than tidied away.
- tension: The project's stated AI lesson deliberately contradicting the expected one.
- quote: "개선은 프롬프트를 잘 쓰게 되어서가 아니라, 고쳐야 할 것을 프롬프트 바깥의 구조로 옮겨서 왔다."
- links: S9c-069
- flags: decision

---

## OH-1 corroboration

This slice carries no dedicated OH-1 hook list of its own (S9's hooks were assigned to the #1–#139 material in S9a/S9b). The only oral-history-adjacent event surfaced in the #140–#237 range is recorded neutrally here:

- **Hook (implicit): "three demos built, none won" as a selection story.** PR #217's body reports that oral-history round 2's OH-5 *contradicted* a false absence — the DDAY-selection artifacts were in-repo all along under a slug the mining sweep did not match, and "three demos built, none won" was retired as **attrition rather than selection**. Status: **contradicted / corrected**, per PR #217 (body §"Oral history"). No other OH-1 hook leaves a trace in this range.

### S9c-072 — 현장 기록 marks painted per-box, a window-width bug reproducing on only one desk
- source: PR #192 (body)
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: A single-agent fix addressed 현장 기록 marks painting per grid-box because a grid item is blockified; the bug "reproduced on one desk and not the other" — a window-width-dependent defect found in live play, not in a test.
- tension: A layout defect whose reproduction depends on window width — invisible to a headless suite — surfaced by hand-play.
- quote: "reproduced on one desk and not the other."
- links: S9c-061
- flags: game-feel, measurement

### S9c-073 — §7 rewritten onto a model-performance axis for reusability
- source: PR #236 (body)
- date: 2026-08-10
- lanes: 3 AI-in-planning
- event: PR #236 rewrote the §7 body onto a model-performance axis — asking "how did you get better output from the same model" as the content another team could reuse — and noted the chosen model was 9% slower but kept the required length and format.
- tension: Rewriting the deliverable section for reusability, and choosing a slower model that met the format requirement over a faster one that did not.
- quote: "채택 모델은 9% 느린 대신 요구한 분량과 형식을 지켰다. 응답 시간 총량만 놓고 고르면 요구사항 미준수를 성능으로 오인한다."
- links: S9c-069, S9c-071
- flags: decision, measurement
