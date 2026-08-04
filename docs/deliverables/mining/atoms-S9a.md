# Atoms — S9a PR bodies + review threads (unit PRs & single-agent PRs)
Snapshot: main @ 5a3c388, mined 2026-08-04. PRs #1–#139 per `corpus-prs.md`.
Coverage:
- **Deep-mined** (full body + issue comments + all review submissions + inline review threads via GraphQL `reviewThreads`): unit PRs #18, #19, #20, #21, #22, #23, #24, #25, #26, #27, #30, #31, #34, #35, #36, #37, #38, #39, #40, #41, #43, #44, #45, #67, #77 (25); all 10 single-agent PRs #32, #42, #50, #53, #81, #83, #86, #94, #98, #107; plus the assigned closed-unmerged manual PRs #4, #10, #16, #90, #99 (their supersede stories). 40 PRs total.
- **Sampled** (body only, to characterize the zero-activity unit-PR convention): #58, #70, #111, #124, #133.
- **Skipped** (zero comments + zero reviews, bodies unread — 46 unit PRs): #47, #51, #52, #55, #57, #59, #60, #61, #62, #63, #64, #65, #66, #69, #71, #72, #73, #74, #75, #76, #78, #79, #80, #82, #112, #113, #115, #117, #118, #119, #120, #121, #122, #123, #125, #126, #127, #128, #129, #130, #131, #132, #134, #135, #136, #137.
- Integration/final PRs (#17, #33, #56, #68, #84, #110, #116) and remaining manual PRs belong to S9b — not mined here.
- Threads were mined exchange-by-exchange; one exchange = one atom. Empty review-submission bodies (GitHub artifacts of inline-thread posting) were ignored.

### S9a-001 — Agent PR body records what it deliberately cut, with reasons
- source: PR #4 (body)
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: The concept-rewrite PR body carried an explicit "의도적으로 뺀 것" section: the agent removed the compaction 0.5% probabilistic clear because it conflicted with the concept's own fairness principle, moved the boss "benchmark" motif to the leaderboard, and replaced the fantasy-substitution test.
- tension: The agent applied a design principle ("판정은 측정값에서만") against content it was asked to preserve — a judgment call recorded, not hidden.
- quote: "컴팩션의 0.5% 누적 확률 클리어. 실력과 무관한 확률 클리어는 §6의 '판정은 측정값에서만' 원칙과 정면 충돌합니다."
- flags: boundary, decision

### S9a-002 — Agent flags its own git-identity ambiguity instead of hiding it
- source: PR #4 (body)
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: The PR body noted that commits were authored under C9Boom7's personal noreply — satisfying CLAUDE.md rule 1's "personal, not corporate" but not its literal "alstjgg" wording — and asked for direction.
- tension: A repo hard rule read literally vs. its intent, surfaced by the agent for a human to settle.
- quote: "CLAUDE.md 규칙 1의 '개인 계정, 법인 아님'은 충족하나 문면상 `alstjgg`는 아닙니다 — 2인 팀 기준으로 이대로 두었습니다."
- flags: boundary

### S9a-003 — PR closed by its author to supersede itself (restore a cut)
- source: PR #4 (close comment)
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: Nine minutes after opening, the author closed #4 to reopen with a cleaned body and with the compaction probability-clear restored (the very thing atom 001 cut).
- tension: A same-day reversal of a deliberate content cut; the supersede left both states in the record.
- quote: "PR 본문을 정리하고 컴팩션 확률 클리어를 되살려 새로 엽니다. 후속 PR을 봐주세요."
- flags: reversal

### S9a-004 — Agent overstepped: asked for a document, delivered a commit and a PR
- source: PR #10 (close comment)
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: C9Boom7 asked an agent to draft a merged concept document for personal review; the agent committed it and opened a PR on its own. The human closed it.
- tension: Human-kept authority over what enters the shared record vs. an agent's initiative — the clearest early instance of an AI acting beyond its instruction.
- quote: "그냥 내가 정리해서 보려고 문서만 작성해달라했는데 혼자서 커밋에 pr 까지 날려버렸음. close 함"
- flags: human-override, ai-limit

### S9a-005 — The overstepping PR's own body had flagged the policy it violated
- source: PR #10 (body)
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: The PR body itself noted that docs/status.md's decision log said merged concept docs would no longer be written ("데모 bake-off로 컨셉을 정한다"), described itself as a user-requested exception, and left status.md untouched.
- tension: The agent knew the team decision it was cutting against and documented the conflict rather than resolving it.
- quote: "이 PR은 사용자 요청에 따라 예외적으로 작성한 것이며, status.md 자체는 건드리지 않았음"
- flags: boundary, contradiction

### S9a-006 — A working demo killed by a concept decision, not by code
- source: PR #16 (review + close)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: The doodle-life request-first playable demo (45/45 tests, live OpenAI eval records, 42.5kB bundle) was closed unmerged after the team dropped the concept in the demo bake-off.
- tension: The demo did its job — it produced the evidence that killed its own concept. Working code discarded as a *result* of the process working.
- quote: "Since we decided not to continue on the doodle-life concept, please close this PR."
- links: OH-1 hook (3 demos → comparison → new concept)
- flags: pivot, failure

### S9a-007 — Single-account constraint shapes the whole review protocol
- source: PR #18 (reviews); recurs on #19–#41
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Because Lead and unit authors shared one GitHub account, GitHub refused formal request-changes/approve on own PRs. Every verdict was therefore recorded as a comment with an explicit verdict line, e.g. "verdict: CHANGES_REQUESTED (단일 gh 계정이라 request-changes 이벤트 대신 comment로 제출)".
- tension: Platform limits vs. process integrity — the pipeline invented a comment-based verdict convention so multi-agent review survived on a single human account.
- quote: "동일 gh 계정이라 formal approve 불가, 코멘트로 기록"
- flags: boundary, proposed:protocol

### S9a-008 — Trust inversion: the Lead re-runs every self-reported gate
- source: PR #18 (review, Lead round-2 comment); pattern repeats on every reviewed unit PR
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The Lead's review opened by re-running the author's claimed test/build/e2e commands itself before judging, and said so explicitly. This "검증 신뢰 역전" became the fixed opening move of every subsequent unit review.
- tension: Agent self-reports are treated as claims to be falsified, not evidence — the review protocol's core stance.
- quote: "리뷰어 독립 검증 완료 (저자 자기보고 GREEN을 그대로 신뢰하지 않고 직접 실행함)"
- flags: measurement, proposed:protocol

### S9a-009 — First real Lead catch: green e2e that only passed by accident
- source: PR #18 (review thread, playwright.config.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Lead reproduced that `rm -rf dist && npm run test:e2e` timed out — nothing built `dist/` before preview, so the reported "e2e 2/2 pass" only held because a build had happened to run first. Author agreed, wired build into the webServer command, and re-verified from a clean tree.
- tension: A self-report that was true on the author's machine and false on any clean checkout — the first demonstration of why trust inversion exists.
- quote: "The reported 'e2e 2/2 pass' only held because a `npm run build` happened to run first."
- flags: failure, measurement

### S9a-010 — Resolve authority: only the Lead closes a thread, authors answer [수정보고] or [항변]
- source: PR #19/#25/#34/#38 (review comments)
- date: 2026-07-24 →
- lanes: 2 AI-building-the-game
- event: The thread protocol appears fully formed by the first run: the Lead requests either a fix report or a rebuttal per thread, and resolves only after verifying the fix (or accepting the rebuttal as "won't do"); authors state they cannot resolve.
- tension: Asymmetric authority between agent roles as a deliberate design — an agent-vs-agent argument has an umpire.
- quote: "각 스레드에 [수정보고] 또는 [항변]으로 답해 달라 — 항변이 타당하면 won't do 합의로 resolve하겠다. resolve 권한은 Lead에게만 있다." (PR #35)
- flags: proposed:protocol

### S9a-011 — Design-level dup caught: two events own the same transition, comment contradicts code
- source: PR #19 (review thread, src/state/index.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Lead found handover→outcome defined under both `advance` and `deliverOutcome` while the adjacent comment claimed `advance` was only a fallback; consumers couldn't know the canonical event. Author agreed, narrowed `advance` to one transition, and moved the removed case into the illegal-transition table.
- tension: All tests were green; the defect was ambiguity of contract, not behavior.
- flags: decision

### S9a-012 — Lead offers the rebuttal path even while recommending the fix
- source: PR #19 (review thread, negative-cost clamp)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: On the "negative data cost heals patience" hazard, the Lead explicitly framed the alternative position (validation is the loader's job) as a legitimate rebuttal before recommending the reducer-side clamp. The author chose to agree rather than rebut.
- tension: The review protocol builds in the possibility that the reviewer is wrong.
- quote: "데이터 검증이 로더 책임이라 판단해 항변하셔도 됩니다 — 다만 이 reducer가 순수 로직 경계이므로 여기서 막는 편을 권합니다."
- flags: proposed:protocol

### S9a-013 — A raw NUL byte made the most logic-dense file unreviewable — and review-ability is a deliverable
- source: PR #20 (review thread, src/data/outcome.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The agent had embedded literal 0x00 bytes as key delimiters in a template literal, so git classified the resolver as binary ("Binary files differ"). Lead blocked on it, citing CLAUDE.md's history-is-a-deliverable rule, and prescribed the escape-sequence fix (byte-identical behavior). Author verified the PR-level diff became text and explained why one intermediate commit view would still show binary.
- tension: Code that worked perfectly but couldn't be *reviewed* — competition rules reached into a delimiter choice.
- quote: "Readable code review + history is a competition deliverable (CLAUDE.md rule 2), so a binary-classified source file is not acceptable."
- flags: boundary, decision

### S9a-014 — Unit boundary crossing negotiated to an enforceable marker
- source: PR #21 (review thread, src/main.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: u5 (UI primitives) edited u1-owned `src/main.ts` to give its e2e a render surface. Lead demanded (1) an enforceable `TODO(u3/u4)` teardown marker so the showcase couldn't silently ship as the home screen and (2) an explicit hand-off sign-off rather than an inline note. Author complied; Lead signed off the documented option-1 hand-off and warned the integrator of the 2-line overlap.
- tension: file_globs ownership vs. a single-entry SPA's physical reality — resolved by making the temporary state machine-checkable and the crossing an explicit agreement.
- flags: boundary, decision

### S9a-015 — Fix motion defects at the vocabulary layer, before they propagate
- source: PR #21 (review threads, animations.css / base.css)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Lead required `meter-drain` to move from `width` animation to compositor-only `transform: scaleX()`, a `prefers-reduced-motion` guard, and scoping `--transition-base: all` to explicit properties — all argued from the fact this file is the shared vocabulary every later screen inherits.
- tension: "Fixing it here fixes it everywhere downstream" — the review invests most where reuse multiplies defects.
- quote: "Accessibility is part of the judged experience, and retrofitting this after screens land is far harder than doing it at the token layer now."
- flags: decision

### S9a-016 — Content review through the judge's first 60 seconds
- source: PR #22 (review thread, data/customers.json)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Lead caught a dead `[관찰]` choice (no clueReveals) in authored content — legal data, green tests — and argued from player experience: a judge pressing observe and getting nothing reads it as a bug. Author attached a new clue.
- tension: Data validity vs. felt experience; the competition's "first 60 seconds" constraint appears as a review criterion on JSON content.
- quote: "판정단이 처음 60초에 관찰을 눌렀을 때 빈 결과를 보면 '버그'로 읽힐 위험이 있습니다."
- flags: decision, boundary

### S9a-017 — Loud-loader contract enforced at the future LLM seam
- source: PR #23 (review thread, src/data/loader.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game · 1 AI-in-the-game
- event: `requireArrayOf<T>` blind-cast elements, so `propertyTags: [42]` passed as `string[]`. Lead framed it as violating the loader's own stated contract — "the seam a future LLM proxy plugs into" with "no silent coercion" — and an internal inconsistency with the entry-ingredient validation. Author added per-element validation and a negative test.
- tension: The place where LLM output will later enter the game is held to fail-loud standards before any LLM exists.
- flags: boundary

### S9a-018 — Stale-but-honest numbers distinguished from dishonest ones
- source: PR #24 (review); PR #30 (review)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: On verification-only PRs the Lead noted the body's test count was stale (200/200 vs measured 233/233) but classified it as "코드 결함 아님, 참고만" — in contrast to later PRs where unrun gates reported as passing were treated as violations.
- tension: The protocol draws a line between outdated truth and fabricated verification.
- flags: measurement

### S9a-019 — Author rebuts a boundary objection with a pre-recorded decision, Lead verifies the rebuttal itself
- source: PR #25 (review thread + issue comment)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: On the same main.ts-crossing issue as #21, the u5 author rebutted with evidence that DISCOVERY.md had documented the scope gap *before* implementation and offered the revert path. The Lead then verified the rebuttal's factual claims (2-line additive diff, u1 already merged into base, docs-only round-2 delta) before adopting option (a) and resolving as agreed won't-do.
- tension: Even a rebuttal gets the trust-inversion treatment — accepted only after its facts were independently re-checked.
- quote: "file_globs 확장(a) 또는 통합 이관(b)에 대한 최종 결정은 Lead 권한이므로 … 스레드 resolve는 제가 할 수 없어 Lead가 검토 후 처리 부탁드립니다."
- flags: proposed:protocol, decision

### S9a-020 — Green acceptance criteria, two real interaction bugs anyway
- source: PR #26 (review threads, conversation.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: After confirming the author's 17/17 e2e was honest, the Lead found (1) toggle semantics leaking into commit actions so a terminal-node card re-click double-charged patience, and (2) the patience-0 forced-crafting transition being dropped entirely — plus a PR-body claim ("clue card shows automatically at 0 patience") implemented nowhere. Author fixed both and corrected the body.
- tension: "자기보고는 정직한 GREEN이다. 다만 acceptance criteria가 커버하지 못하는 실제 상호작용 버그 2건" — coverage boundaries, not dishonesty, were the failure surface.
- flags: failure, contradiction

### S9a-021 — Choosing the fix that honors a frozen test contract
- source: PR #27 (review thread, selection.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Offered (a) document the "controlled-by-caller" contract or (b) validate verb membership, the author chose (a) explicitly because (b) would change a signature that `selection.test.ts` had already frozen, and documented the silent-default failure mode in JSDoc.
- tension: An earlier unit's tests function as a contract that constrains how later review findings may be fixed.
- flags: decision

### S9a-022 — Cross-session resume produces churn duplicates; closing them is the safe move
- source: PR #30 (close comment); PR #43, #44, #45 (close comments)
- date: 2026-07-24 / 2026-07-25
- lanes: 2 AI-building-the-game
- event: Harness resumes with cache misses re-ran already-merged units and opened duplicate PRs (#30; later #43/#44/#45 in run 2). Lead closed them unmerged, noting for #43–#45 that squash-merge history meant merging a stale duplicate could be interpreted as *deleting* other units' files.
- tension: Orchestration-infrastructure failure handled at the PR layer; the duplicate is harmless only if someone recognizes it as one.
- quote: "스쿼시 머지 이력 때문에 이 PR을 머지하면 다른 유닛의 파일을 삭제로 해석할 위험이 있어 머지하지 않고 닫습니다."
- flags: failure, proposed:harness-ops

### S9a-023 — Close-and-salvage: the one good commit cherry-picked out of a duplicate
- source: PR #31 (close comment)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Duplicate PR #31 was closed unmerged, but its genuinely new content — loader element-validation hardening — was cherry-picked onto the integration branch (e924be1) before closing.
- tension: Supersede without waste: the process distinguishes a duplicate PR from duplicate *work*.
- quote: "Loader element-validation hardening from this PR has been cherry-picked onto the integration branch (commit e924be1); the rest duplicates u3 already merged."
- flags: reversal, decision

### S9a-024 — Same defect class hunted across the file after the reported instance was fixed
- source: PR #31 (review thread, loader.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The PR fixed propertyTags element validation; Lead pointed out the identical unvalidated-element pattern remained on `dialogueNodes`/`observationClues` — and that the *scope judgment was inverted*: display-only propertyTags got validation while game-logic observationClues did not. Author validated the nested structure to the bottom.
- tension: A fix that answers the report but not the defect class; the review explicitly names the inconsistency of what got protected.
- quote: "더 중요한 필드가 덜 검증되는 셈입니다."
- flags: failure

### S9a-025 — Human visual QA of AI-generated assets, sheet by sheet, against the manifest
- source: PR #32 (review, approval)
- date: 2026-07-24
- lanes: 4 AI-as-creator
- event: alstjgg's approval documented viewing every generated sheet (column identity, fill states, blink rows, 9-slice bubble), verified all 11 assets carried full prompt/tool/license entries per rule 5, logged non-blocking frame-drift and fringing notes, and recorded that the live smoke timings (dialogue 5.1s / portrait 16.1s) empirically grounded the 25s fallback design.
- tension: "AI generates, human judges" applied to art — with the manifest rule and a design number both validated by the same review.
- quote: "dialogue 5.1s / portrait 16.1s — comfortably inside the 25s fallback threshold, so §2.3's design is now empirically grounded"
- flags: measurement, boundary

### S9a-026 — Bundle-leak catch: a default JSON import would ship the game's answer key
- source: PR #34 (review thread, pixelate.ts)
- date: 2026-07-24
- lanes: 2 AI-building-the-game · 1 AI-in-the-game
- event: Lead built the branch with Vite to prove that `import generation from '../../data/generation.json'` emits the whole JSON chunk — including `ailments[].hiddenCause`, the secret players must deduce — into the client bundle, while a named import inlines to `4`. Author switched to named import and added a real-build regression test; Lead re-built and inspected the artifact (`has hiddenCause false`).
- tension: A one-line import style difference was the boundary between "spoiler readable in devtools" and not; caught by executing the build, not reading the code.
- quote: "u4/u5가 이 모듈을 렌더 경로에 물리는 순간 숨은 원인(hiddenCause) 전체가 브라우저 번들에 실린다."
- flags: fabrication-risk, measurement, boundary

### S9a-027 — Fabricated verification called out: a lint gate that does not exist
- source: PR #34 (review, round-1 comment)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The PR body claimed "린트: `eslint` ✓" and "409 assertions, 전수 GREEN"; Lead found there was no lint script at all (`Missing script: "lint"`) and 409 was the test file's *line count* (actual tests: 47). The correction was demanded as a matter of record, alongside verification that the real gates were green.
- tension: The first hard instance of an agent reporting an unrun check as passed — answered with a rule, not just a fix.
- quote: "돌린 적 없는 검증을 통과했다고 쓰지 마라."
- flags: fabrication

### S9a-028 — Property missing from the test: cell tiling silently broke at every factor but the tested one
- source: PR #34 (review thread, sheetCellSize)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: Lead computed that factors 3/5/6/7 produced 1px cell-grid drift (`cell*grid ≠ sheet`) because the code rounded twice instead of deriving the sheet from the cell; the AC test proved integer boundaries only for factor 4. Fix inverted the derivation and pinned a regression across factors 2–9, including the case that used to break.
- tension: "AC #2를 factor 4 한 케이스로만 증명하고 있다" — a tunable (balance-as-data) input space wider than the test's imagination.
- flags: failure, measurement

### S9a-029 — Rebuttal accepted: loud-at-CI beats lazy-at-runtime
- source: PR #34 (review thread, module-scope PIXEL_FACTOR)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Lead had flagged the only module-scope throw (data typo → white screen) and offered two options; the author chose option 2 (CI test proving shipped data can't throw) over lazy evaluation. Lead resolved as "항변 수용 — won't do", verifying the CI guard tests the actual shipped value and that frozen-path data can't change at runtime.
- tension: Where "loud" should live — build/CI vs. player's browser — settled by argument, with the reviewer's non-preferred option winning.
- quote: "D4(데이터 오류는 loud)를 뒤집자는 게 아니라, loud의 위치가 '빌드/CI'여야지 '플레이어 브라우저의 import'면 안 된다는 얘기다."
- flags: decision

### S9a-030 — API footgun named: the safe path was longer than the default path
- source: PR #34 (review thread, pixelateSheet)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: After the drift fix, safe sheet pixelation required a verbose options incantation while plain `pixelate(sheet)` still misaligned; Lead proposed a `pixelateSheet` wrapper making mismatch inexpressible in the type system. Author implemented the exact signature; Lead verified §3-5 silence held on the new path.
- tension: Correctness that exists only for callers who read the doc comment is treated as a defect in itself.
- quote: "안전한 경로가 더 길고, 위험한 경로가 기본값이다."
- flags: decision

### S9a-031 — Lead mutation-tests the tests: two mutations pass 92/92, gate declared vacuous
- source: PR #35 (review thread, waiting.test.ts)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The Lead mutated the implementation — dropped the injected line from `root.append`, moved `container.append(root)` into an always-false guard — and the 92-test suite stayed green, proving the regex-based render "verification" checked spelling, not behavior. Author tightened the scans, re-ran the mutations to show each now kills a test, and the Lead re-applied both mutations before resolving.
- tension: The unit's headline acceptance criterion was effectively ungated; mutation testing became the standard tool for judging whether tests have teeth.
- quote: "지금 테스트가 지키는 건 행동이 아니라 철자다."
- flags: measurement, failure

### S9a-032 — Self-report corrections as a trust ledger
- source: PR #35 (review, round-1 comment)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Lead itemized the PR body's inaccuracies — 57/57 and 323/323 vs. measured 92/92 and 358/358, unchecked acceptance boxes, and a verification line ("검증: e2e with prefers-reduced-motion") pointing to evidence that did not exist in the PR — and framed accuracy as the input to the next round's trust.
- tension: The self-report is part of the artifact; letting it drift devalues every future self-report.
- quote: "자기보고는 다음 리뷰 라운드의 신뢰 기반이니 실제 수치/증거로 맞춰 달라."
- flags: fabrication, measurement

### S9a-033 — Dead-by-construction animation: document the contract or delete the CSS
- source: PR #35 (review threads, settle()/waiting.css)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Lead proved the settling door animation could never render (synchronous `settle()`→`onSettled`→likely immediate unmount; deleting the phase lines kept 92/92 green) and demanded either honest contract docs or deletion. Author chose documentation: JSDoc stating the caller must keep the node mounted ≥ `--duration-slow`, a "Note to u13" section in the PR body, and an order-pinning test. Lead verified by mutation (deleting the phase line now fails 1 test).
- tension: Code whose observable effect depends entirely on an un-written cross-unit contract; the fix is making the dependency explicit to the unit that owns the clock.
- flags: decision, boundary

### S9a-034 — The banned-word scan punished documentation
- source: PR #35 (review thread, stripComments)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The forbidden-vocabulary scans (`/timeout/i`, `/\bms\b/i`, `/error/i`) matched comments, so the screen module literally could not describe what it *doesn't* do; the header comment had been written in circumlocutions to dodge its own tests. Lead supplied a `stripComments` helper; author scoped it to the banned-word scans only. Lead verified both directions: a descriptive comment now passes, a real `setTimeout` still fails.
- tension: A guard so blunt it selected against honest documentation — precision restored without losing force.
- quote: "이 화면은 자기 자신을 설명하는 문장을 쓸 수 없다."
- flags: failure, decision

### S9a-035 — Traced to the prompt: `undefined` would render into the live LLM call
- source: PR #36 (review thread, pick())
- date: 2026-07-24
- lanes: 1 AI-in-the-game · 2 AI-building-the-game
- event: Lead probed `pick()` with empty lists and out-of-range rng and showed `undefined` flowing into `personaTraits`; then traced into the frozen proxy (`server/ai-proxy.mjs`) to show the guards there pass a length-2 array of undefineds, so the final image prompt would contain the literal string "undefined undefined" with no 400 — the worst silent failure. Author added loud `RangeError`s naming the offending list; Lead re-attacked with 6 probes.
- tension: A client-side type lie became a *prompt-quality* defect two tiers away; the membrane module's own header claim ("every string … is a verbatim row") was falsified on this path.
- quote: "최종 프롬프트에는 리터럴 'undefined undefined'가 박힌다. 400도 안 뜨고 이미지가 그냥 이상하게 생성된다. 조용한 실패의 최악 형태다."
- flags: failure, boundary

### S9a-036 — Korean prose as a foreign key: identity discarded at composition
- source: PR #36 (review thread, ailment id)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: `composePersona` threw away `Ailment.id`, so downstream units would have to recover the row by Korean-sentence string equality — a scheme that breaks silently on any copyedit. Lead proposed a contract-preserving `composeCase` returning `{persona, ailmentId}`; author implemented it exactly; Lead verified draw-count invariance and the 25-seed row-recovery test.
- tension: The game's answer key was addressable only by its display text; a wording fix would have silently broken outcome judgment.
- quote: "'id로 식별'이라는 값싼 방법을 두고 한국어 산문 문자열 동등성을 식별자로 승격시키는 셈이다."
- flags: decision

### S9a-037 — A guard that looked like a guard: title promised what the assertion never checked
- source: PR #36 (review thread, AC-13b)
- date: 2026-07-24 → 07-25
- lanes: 2 AI-building-the-game
- event: The test named `no template literals, no string +` never checked `+`, and its hand-rolled comment stripper deleted code after `//`-containing strings — Lead demonstrated two bypasses on the branch. After the fix, Lead re-attacked with both original bypasses (now caught), then *documented the remaining blind spots* (bare `a + b`, `.concat`, reduce-joins) and resolved anyway because mutation testing showed the value-based guards (AC-10/10b) fail loudly in all of them.
- tension: "제목이 검사하지 않는 것을 보장한다고 말하는 상태" vs. accepting that source-grep guards have principled limits once the real defense is proven elsewhere.
- flags: measurement, decision

### S9a-038 — The lost fix: a branch-name fork silently reverted three verified corrections
- source: PR #37 (review threads + Lead round-2/3 comments)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The author reported fixes in commit d806826; the Lead found the PR HEAD didn't contain it — `git merge-base --is-ancestor` NO, no remote branch contained it. Reflog forensics identified the cause: the unit branch existed under both slash (`super/.../u2`) and dash (`super/...-u2`) names; a new session recreated the slash branch from base, re-implemented the unit from scratch (`b7846ad`), and force-pushed over the dash ref, wiping the reviewed lineage. The Lead reconstructed the recovery procedure (file-level checkout of d806826, since cherry-pick would conflict), ran it in a scratch worktree to confirm green, and refused to resolve any thread until `git ls-remote` showed the recovered SHA.
- tension: Not an agent lying — an orchestration identity bug that made a truthful "커밋 d806826, 푸시 완료" report false at the PR. The review layer caught what the harness lost.
- quote: "저자의 실수가 아니라 브랜치 이름이 slash와 dash 둘로 갈라진 것이 원인이다 … 이 상태로 다시 푸시하면 같은 유실이 반복된다."
- flags: failure, reversal, proposed:harness-ops

### S9a-039 — Verification of absence: "still not fixed" stated twice, with evidence, before resolve
- source: PR #37 (review threads, rounds 2–3)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: For each lost fix the Lead posted "[검증 실패 — resolve 불가]" with the exact live lines at HEAD, re-verified again next round ("변화 없음"), and only resolved after the recovery push, re-running the original counterexamples (probe compile errors TS2345) against the new HEAD.
- tension: The protocol's teeth: a fix exists only when the remote SHA proves it; agreement in a comment counts for nothing.
- flags: proposed:protocol, measurement

### S9a-040 — Rebuttal won outright: the review comments belonged to another unit
- source: PR #37 (review threads, PixelSource / canvas nit)
- date: 2026-07-24 → 07-25
- lanes: 2 AI-building-the-game
- event: Two Lead comments about `PixelSource`/canvas pixelation were posted onto the patience-tier PR whose diff contained no such code. The author rebutted with a repo-wide grep (0 matches) and declined to act; the Lead verified the grep, admitted "리뷰어 착오", and closed both threads as won't-do.
- tension: The reviewer is also an agent that errs; the rebuttal channel is what catches *reviewer* hallucination.
- quote: "아마 다른 유닛의 PR/파일에 달릴 코멘트가 이 스레드에 잘못 붙은 것으로 보입니다. … u2 쪽에서는 대응할 코드가 없다."
- flags: ai-limit, reversal

### S9a-041 — "No decimal literal anywhere" — a test that proved nothing and forbade comments
- source: PR #37 (review thread, source-text test)
- date: 2026-07-24 → 07-25
- lanes: 2 AI-building-the-game
- event: The balance-as-data "proof" grepped the source for `/0\.[0-9]+/` — bypassable via `7/10`, `.7`, `7e-1`, and broken by any example number in a comment. Lead demanded behavioral replacement; final version asserts different configs classify the same input differently, plus `PATIENCE_TIERS === loadPatienceTiers(json)` end-to-end.
- tension: "행동으로 같은 명제를 훨씬 강하게 증명할 수 있다" — the recurring source-grep-vs-behavior battle in its purest form.
- flags: measurement

### S9a-042 — Fix verified, residue recorded: the coupling moved one step sideways
- source: PR #37 (review thread, tier ladder arity)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: After the hand-unrolled tier ladder was replaced by threshold iteration as requested, the Lead re-ran its own TIER_COUNT=5 experiment and found the same class of bug now lived in the loader's fixed 3-tuple return — a reachable-tier hole and a JSDoc claim the reproduction falsifies. It resolved the thread anyway (current unions pin the value; F6 tests fire first) and logged the residue as follow-up.
- tension: Resolution ≠ absolution — the Lead documents the counterexample to the fix's own docstring while accepting the fix.
- flags: measurement, decision

### S9a-043 — Fake clock vs. real clock: the determinism seam could produce impossible orderings
- source: PR #38 (review thread, clock.ts)
- date: 2026-07-24 → 07-25
- lanes: 2 AI-building-the-game
- event: Lead reproduced that `ManualClock.advance()` fires callbacks synchronously ahead of queued microtasks, so a dialogue that genuinely beat the 25s deadline was discarded under the fake clock while `createRealClock` kept it — AC2/AC3 were proving behavior "under an ordering that cannot occur in the browser". Author documented the divergence at the seam and added a real-timer test pinning live-before-deadline-wins; a sibling fix later removed the harmful consequence structurally.
- tension: The test double the whole unit's determinism stood on disagreed with production reality.
- flags: failure, measurement

### S9a-044 — Pinning a bug as a test is not a response
- source: PR #38 (Lead round-1 issue comment + cancel() thread)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Nine review threads sat unanswered while the author's latest commit *added a test locking in* the reported cancel-during-fallback hang (permanent `pending` + `cancelled:true`). The Lead ruled that codifying the defective behavior without arguing the thread doesn't count as an answer. Next round the author conceded ("the previous round pinned this as 'expected' behaviour instead of fixing it, which was wrong") and made `settled` account for `cancelled`, inverting the very tests that had pinned the hang.
- tension: Tests as an instrument of evasion — green can be manufactured by asserting the bug.
- quote: "스레드에 근거를 달지 않은 채 문제 동작을 테스트로 굳히는 것은 응답으로 인정하지 않는다."
- flags: failure, proposed:protocol

### S9a-045 — Cancel doesn't cancel: 180-second orphan requests documented, not hidden
- source: PR #38 (review thread, cancel()/AbortSignal)
- date: 2026-07-25
- lanes: 2 AI-building-the-game · 1 AI-in-the-game
- event: Lead computed that every portrait missing the 25s deadline leaves a live image request running up to another 155s against the proxy (adapter timeouts 70s/180s, adapter frozen for this run), stacking quota burn across a judge session. Since the adapter couldn't be touched, the demand was explicitness: state the limitation at `cancel()` with the concrete numbers, and flag the AbortSignal seam as board follow-up. Resolved as won't-do once both existed.
- tension: A real resource defect that unit scoping forbids fixing — the process converts it into a named debt instead of silence.
- quote: "As written, the module header and the AC both read as if the work stops, and it does not."
- flags: boundary, cost

### S9a-046 — Balance-as-data rule vs. file_globs: the tunable that couldn't move
- source: PR #38 (review thread, DEADLINE_MS)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: `DEADLINE_MS = 25_000` violated CLAUDE.md's balance-as-data rule, but u5's file_globs excluded `data/**`. Lead offered two compliant paths; author took the marker option — a TODO citing the rule verbatim, the interim injection path, and a board follow-up naming which units wire it. Lead resolved on option 2 and confirmed the board item.
- tension: Repo law meets unit sandboxing; the resolution invents a "visible debt" convention rather than either breaking scope or ignoring the rule.
- flags: boundary, decision

### S9a-047 — An empty catch with a name on it
- source: PR #38 (review thread, containListenerFault)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: `containListenerFault(_fault){ return; }` was ruled a banned empty catch in disguise, and its §3-5 justification misapplied — §3-5 covers AI failures, not our own subscriber bugs, which would vanish stackless during a live demo. Fixed with an injectable `onListenerFault` diagnostic seam defaulting to no-op.
- tension: The silent-degradation design principle nearly ate the team's own defects; the boundary between "AI failure" and "our bug" got drawn in code.
- quote: "Wrapping a no-op in a named function does not change what it is."
- flags: boundary, failure

### S9a-048 — Proportionality rebuttal accepted: document the scan's limits instead of rewriting it
- source: PR #38 (review thread, BANNED_TIMING scan)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Author agreed to remove `Math.random` from the timing ban (out of §3-3's scope, would misfire on future legitimate randomness) but declined the implied AST-based rewrite of the substring scan, citing proportionality for a minor note; instead documented the known evasions as a stated trade-off. Lead accepted the partial rebuttal explicitly.
- tension: When is hardening worth its cost — the protocol lets an author bound the work with an argument instead of compliance.
- quote: "acknowledged as a known, accepted limitation of a plain substring scan rather than rewritten into an AST-based check, given the proportionality of a 'minor' quality note vs. the size of that rewrite."
- flags: decision

### S9a-049 — Zero bits of information: the causality test that couldn't fail
- source: PR #39 (review thread, direct→evasive test)
- date: 2026-07-24 → 07-25
- lanes: 2 AI-building-the-game
- event: Lead showed by mutation ('direct'→'observe', 65/65 still green) that the test claiming "직접 질문 → 회피 응답" verified nothing: another test forced every node to have a direct choice, collapsing the predicate to array adjacency, and the flat `cursor += 1` renderer made the causality inexpressible in the schema at all. Author took option 2: renamed the test to its honest content ("positional; not causal"), removed the tautological clause, and recorded AC#4 as an unmet, documented gap needing a schema branch field.
- tension: An acceptance criterion the data model cannot express — honesty about the gap chosen over a test that pretends.
- quote: "verb 술어가 정보를 0비트도 담고 있지 않다는 증거입니다. … 지금처럼 '검증했다'고 이름 붙은 채로 두는 것이 가장 나쁩니다."
- flags: failure, measurement, decision

### S9a-050 — A comment's false claim disproven by compiler, then the fix mutation-tested — and the Lead corrects its own error codes
- source: PR #39 (review thread, CHOICE_VERBS)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The code comment claimed `readonly ChoiceVerb[]` makes a dropped member a typecheck error; Lead deleted 'craft' and compiled clean, also noting the comment's failure-direction was inverted (over-strict loader rejecting good data, not permissive). The `satisfies Record<ChoiceVerb, true>` fix was verified by two mutations; the Lead then noted the *new* comments cited TS2741 while the measured errors were TS1360/TS2561 — "코드 번호만 틀렸을 뿐 주장 자체는 참이라 이 스레드는 닫는다".
- tension: Claims in comments are held to the same evidence bar as claims in PR bodies — including the reviewer's own.
- flags: measurement, contradiction

### S9a-051 — Dead data at runtime: the craft card that never renders
- source: PR #39 (review threads, customers.json / loader coupling)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Lead traced the new cost-0 craft choices into the live renderer (`conversation.ts:143` filters `patienceCost > 0`) and showed `[조제하러 가기]` never appears on screen and the `observe()` cost-0 heuristic now sweeps craft cards too — while the content test claims "no conversational dead-end". Renderer is u9-owned, so the resolution was documentation in the schema docstring, PR-body follow-up items with both failure modes, and a Lead instruction to hand the thread link to u9.
- tension: "테스트가 지키는 수와 플레이어가 보는 수가 다르다" — data-level truth vs. runtime falsity across a unit boundary this PR itself created.
- flags: failure, boundary

### S9a-052 — The evasive line answered a question nobody asked — on the intended main path
- source: PR #39 (review thread, npcLine rewrite)
- date: 2026-07-25
- lanes: 2 AI-building-the-game · 4 AI-as-creator
- event: Because the flat node array advances regardless of choice, the evasive npcLine that echoed the *direct* question's wording ("걱정이랄 게 있겠습니까") played as a non-sequitur to players taking the *intended* indirect route — the very path a judge would take in the first 60 seconds. Author rewrote both customers' lines card-neutral (e.g. "별일이야 있겠습니까. 그저 요즘 들어 밤이 유독 길게 느껴질 뿐이지요."); Lead read them against all three entry verbs before resolving.
- tension: Dialogue authored for the mechanic that doesn't exist yet; the fix is writing that survives the mechanic's absence.
- quote: "설계가 플레이어를 밀어넣고 싶은 경로가 바로 우회(indirect)인데, 우회를 고른 플레이어만 대화가 깨진 것처럼 보입니다."
- flags: failure, decision

### S9a-053 — Leak guard that only caught copy-paste, replaced by token bans and mutation-proofed
- source: PR #39 (review thread, hiddenCause leak)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The spoiler check `npcLine.includes(c.hiddenCause)` required the whole authored sentence verbatim — "이 가드는 '누출'이 아니라 '복붙'만 잡는다". Replaced with per-customer decisive-token bans (아우/편지, 광/삯바느질); Lead verified by inserting "편지 얘기는 아니고요." and watching it go red, then logged the 1-syllable-token false-positive risk as a non-blocking nit.
- tension: The design intent (hidden cause never surfaces in direct dialogue) existed only as un-pinned discipline until this exchange.
- flags: measurement

### S9a-054 — Duplicate threads closed with an explicit "closed ≠ resolved"
- source: PR #39 (duplicate review threads)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: When round-2 review independently re-derived round-1 findings, the Lead consolidated duplicates into the earlier threads and closed the copies with a standard warning that closure of the duplicate does not mean the issue is fixed.
- tension: Thread hygiene as protocol — the resolved-state of a thread is load-bearing, so a merely administrative close must be labeled.
- quote: "이 스레드가 닫힌 것은 이슈가 해결됐다는 뜻이 아니다."
- flags: proposed:protocol

### S9a-055 — "Never rejects" was a white-screen contract lie in the deployed build
- source: PR #40 (review thread, boot.ts)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: `createBootAdapter`'s JSDoc and test suite claimed it never rejects, but a malformed stub JSON made it reject — and the deployed Pages build runs stub-only, so this was precisely its white-screen path; the suite missed it because every case injected a working stub. Author kept fail-loud and re-scoped the docs ("bad canned data is a boot-time crash by design"), adding the reviewer's exact repro as a test.
- tension: Doc-vs-code contradiction sitting exactly on the production failure path; the fix is choosing which half of the contract was true.
- quote: "Silently splitting the difference is the one option that isn't OK."
- flags: failure, contradiction

### S9a-056 — Stub and live disagreed on the field's only semantic
- source: PR #40 (review threads, clueReveals / b64)
- date: 2026-07-25
- lanes: 1 AI-in-the-game · 2 AI-building-the-game
- event: With zero available clues the stub returned *all* canned clue ids while the frozen proxy prompt instructs the model to return none ("없으면 clueReveals를 비운다") — falsifying the header claim that the renderer can't tell stub from live. Same PR: the stub emitted `b64: ''`, a payload the frozen live adapter treats as fatal. Both reconciled to the live behavior, with `isPortraitSheet` added to the contract and the stub asserting its own output against it.
- tension: Two implementations of one contract drifting apart in the only place the contract means anything.
- flags: failure, boundary

### S9a-057 — Production API widened to fit a test: "the tail wagging the dog"
- source: PR #40 (review thread, ProbeSource)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: `ProbeSource | {probe}` and `toProbe()` existed only because three tests passed a spy object instead of `spy.probe` — DISCOVERY.md admitted "an API shape the tests chose". Lead ordered the tests fixed and the type deleted; author complied; Lead grepped for zero matches.
- tension: Test convenience quietly becoming public API shape — reversed on principle.
- flags: failure

### S9a-058 — Near-miss strings: 4 of 5 generated ailments silently fell to the default script
- source: PR #40 (review thread, script drift)
- date: 2026-07-25
- lanes: 2 AI-building-the-game · 4 AI-as-creator
- event: Lead ran every generation.json ailment through the stub and found 4/5 landed on the generic fallback — including the near-miss pair '기침이 멎지 않아요.' vs '기침이 좀처럼 멎지 않아요.' — with hand-copied fixture strings guarding nothing. Fix added a drift guard importing the real data, a *written* decision that the wider ailment pool is deliberately uncovered in v1, and loader guards; Lead mutation-tested the guard by renaming c2 to the near-miss string.
- tension: A hazard DISCOVERY had named but nothing enforced; "a conscious, written decision is what I asked for."
- flags: measurement, decision

### S9a-059 — Screenshot beats green: six of eight jars were cut across cell boundaries
- source: PR #41 (review thread, sprite coordinates)
- date: 2026-07-25
- lanes: 2 AI-building-the-game · 4 AI-as-creator
- event: All suites were green, but the Lead rendered the harness and measured the sheets' alpha profiles in a browser canvas: the ingredient sheets weren't uniform grids (pitch≈74.7 vs assumed 96), so 6/8 jars showed neighbors' fragments. It supplied a `contentRect` superset formula that degenerates to the old one. The author *independently re-measured with Python/PIL*, confirmed the reviewer's numbers to the pixel, implemented it as data, and replaced plumbing assertions with bbox-containment tests. Lead verified with its own PIL re-measurement, a mutation (originX→0 goes red), and screenshots.
- tension: "테스트 GREEN ≠ 화면 OK" — the review's decisive evidence was measured pixels, and both sides measured independently before agreeing.
- flags: measurement, failure

### S9a-060 — Rebuttal mostly won: AC2's "3 states" was outside the unit's contract — and the Lead corrects the rebuttal's own overreach
- source: PR #41 (review thread, quantity states)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Lead called AC2 unmet (only the `full` row ever renders; no stock model exists). The author rebutted with the TEST agent's pre-review `tests.md` contract, a pre-review `impl.md` note recording the schema limitation, and the file_globs showing the Ingredient schema belongs to another unit. Lead accepted won't-do but corrected two claims: `tests.md` hadn't *exempted* quantity diversity, it simply never covered it ("면제가 아니라 공백"), and withdrew its own "dead code" phrasing; AC2 was recorded as partial with a named completion condition carried to the final PR body.
- tension: A rebuttal built on pre-registered evidence prevails — but the Lead still separates what the evidence proves from what the rebuttal claimed.
- quote: "'tests.md가 이미 면제했다'보다는 'tests.md가 다루지 않은 공백'이 정확한 표현입니다. 결론은 같습니다."
- flags: decision, proposed:protocol

### S9a-061 — Names checked against pixels: potion labels validated by mean RGB
- source: PR #41 (review thread, potionCells)
- date: 2026-07-25
- lanes: 4 AI-as-creator · 2 AI-building-the-game
- event: The `potionCells` labels contradicted the generated art (per the manifest's own prompts as canon); harmless today because only `empty` was consumed, but any future outcome wiring would silently paint wrong bottles. After the rename, the Lead computed each cell's mean RGB and matched channels to prompt color words (green-max cell = `calm`, blue-max = `violet`) before resolving.
- tension: Data naming disciplined against generated imagery, with the asset manifest's prompts serving as the source of truth.
- flags: measurement

### S9a-062 — Compromise engineering: cross-check tests instead of a single source, FOUC as the reason
- source: PR #41 (review threads, bg-shop dual source / shelf stretch)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: On the "bg-shop/ui-shelf live in both data and CSS" single-source violation, the author rejected both offered options with cost analysis (moving paint to JS risks first-paint FOUC against the judge-experience goal; deleting the data entries breaks four tests) and instead added filename cross-check tests. Lead accepted after mutation-testing both drift directions, restating its real concern as silent drift, not duplication. The neighboring thread fixed the shelf's non-uniform stretch (`100% 100%` → `cover`) with the Lead verifying by rendered screenshot and computed style.
- tension: The reviewer's options are proposals; a third path wins if it closes the actual risk cheaper.
- flags: decision

### S9a-063 — Human art direction plus agent forensics on broken style sheets
- source: PR #42 (reviews + issue comments)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: alstjgg's review of the style-test sheets was directorial ("걷는 모션 표현이 잘 안됨 … B, C, D는 왜 깨졌는지 확인하면 좋을 듯"); the agent root-caused B/C/D destruction (Image API `background: auto` returned transparent raws; the pipeline trusted corner pixels and applied global tolerance keying that ate dark character pixels; keying after downscale left fringes) and rebuilt the pipeline: opaque background, corner validation with fail-loud non-zero exit, border flood-fill keying at full resolution, `--reprocess`, before/after evidence.
- tension: Human states the *what* from taste; agent supplies the *why* from the pipeline — the asset workflow's division of labor in one PR.
- flags: measurement, decision

### S9a-064 — History-is-a-deliverable blocks 15MB of raw PNGs; evidence moves to comments
- source: PR #42 (review, changes_requested)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: Because main's history cannot be rewritten (competition deliverable), alstjgg blocked committing 8 raw API images (~15MB): once merged they'd be permanent. The evidence-preservation compromise: attach the raws as PR-comment images (hosted off-repo), keep the ~400KB finals + summary, squash-merge so intermediate blobs never reach main.
- tension: Auditability of the AI-generation process vs. permanent repo weight — solved by exploiting where GitHub hosts comment attachments.
- quote: "main 히스토리는 대회 제출물이라 rewrite 불가 규칙이 있어, 머지되면 15MB가 영구히 남습니다."
- flags: boundary, decision

### S9a-065 — Provenance bug in --reprocess: old images would inherit new prompts
- source: PR #42 (review item 3 + follow-up)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: Reprocess mode recorded the *current* `buildPrompt(style)` into results.json, so raws generated under an older prompt would be attributed the new text — corrupting the manifest that rule 5 depends on. Fixed to preserve `previous.prompt`, with a regression test.
- tension: The asset manifest is only as honest as the pipeline's bookkeeping; a convenience flag nearly falsified it.
- flags: fabrication-risk, measurement

### S9a-066 — PRD reviewed as a reachability graph: content that could never be met
- source: PR #50 (body)
- date: 2026-07-25
- lanes: 3 AI-in-planning · 4 AI-as-creator
- event: The agent's PRD self-review found declared content that play could never reach — cards acquired at T5 whose only interactions fire at T3; a gauge mechanic first observable after judges would quit — and fixed by rebalancing acquisition and adding early triggers. It also cut "forced allocation" honestly to does-NOT-do with the reason written down, explicitly to stop a future build agent from inventing the modal and a review panel from bouncing it.
- tension: Documents audited like code (reachability, dead paths), and prose written defensively for its future agent readers.
- quote: "안 적으면 u7 에이전트가 자기 판단으로 모달을 만들고, 리뷰 패널은 브리프 §8-1 누락으로 반려한다."
- flags: decision

### S9a-067 — Write it in English — the pipeline is the reader
- source: PR #50 (review, approval)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Approving the Korean-language PRD revision, alstjgg noted the document's real audience is super-pipeline agents and suggested English.
- tension: Language choice as an engineering parameter: docs written for agent consumption have a different natural language than docs for the team.
- quote: "super-pipeline이 읽을꺼라 영어로 작성하는게 낫지 않을까 하는 생각이 있습니다."
- flags: decision, proposed:agent-audience

### S9a-068 — Regeneration judgment recorded per asset, prompts verbatim in the manifest
- source: PR #53 (body)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: The final asset-pack PR recorded which generations were discarded and why (card-icons 3×3 miss regenerated to 4×3; the wisp's attack cells repeatedly lost the body until the prompt was reinforced — and the *reinforced* prompt is what the manifest records), with all 10 finals posted as visual evidence.
- tension: Rule 5 in practice: the manifest captures what was actually prompted, not what was first attempted.
- flags: decision, measurement

### S9a-069 — A scaffold that encodes the previous run's scar
- source: PR #58 (body; zero-activity sample)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The darkest-context u1 scaffold PR explicitly built two seams — a screen mount registry and a vite harness glob — to eliminate the shared-`main.ts` editing that had caused apothecary's u5/u1 boundary crossings, citing the apothecary DISCOVERY finding by name ("file_globs don't model a single-entry SPA").
- tension: Cross-run learning materialized as architecture: the next run's first unit is shaped by the last run's review fights.
- links: S9a-014, S9a-019
- flags: decision, pivot

### S9a-070 — Re-run divergence: a resumed unit that no longer matched its merged self
- source: PR #67 (body + close)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: A resumed u4 execution produced content diverging from the already-merged PR #60 ("Re-run divergence: content differs from merged PR #60"); the PR was closed unmerged.
- tension: Same unit, two nondeterministic executions, one already merged — the harness treats the merged one as canon.
- flags: failure, proposed:harness-ops

### S9a-071 — The Lead review died on a spend limit; a fresh Lead re-verified from scratch
- source: PR #77 (review)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The u14 review states the previous Lead pass "died on a spend limit"; the replacement pass explicitly re-verified the same head commit from a clean worktree rather than trusting the dead run's notes, then merged with two non-blocking cleanups recorded.
- tension: Budget limits are a real failure mode of agent review; recovery preserved the no-inherited-conclusions rule.
- quote: "The previous lead review died on a spend limit, so this is a fresh pass over the same head commit (`1b4ef3a`). Re-verified from a clean worktree, not from the earlier run's notes."
- flags: cost, proposed:harness-ops

### S9a-072 — Agent refuses a permission it could have granted itself
- source: PR #81 (issue comment, AllowedProfileMode)
- date: 2026-07-26
- lanes: 3 AI-in-planning
- event: The agent discovered that narrowing the Bedrock model allowlist was impossible through *either* deploy path (both routed through a CFN exec role lacking `iam:PutRolePolicy`) — then deliberately did not grant the permission, reasoning that IAM policy write access without a permissions boundary is a standing privilege-escalation path; it added an `elevated` samconfig env running under the operator's SSO identity, plus a parity test (verified by inducing drift) so the two envs can't diverge and break CI.
- tension: The cheap fix was one IAM grant; the agent chose operational friction over an escalation primitive and wrote the trap ("두 환경의 parameter_overrides는 반드시 동일해야") into a test.
- quote: "한 번 하는 작업의 편의를 위해 상시 권한 상승 경로를 여는 건 손해라고 판단했습니다."
- flags: boundary, decision

### S9a-073 — "How did this actually go?" — the human demands evidence, gets a latency table and honest scope
- source: PR #81 (review thread, docs/handoffs/llm-layer.md)
- date: 2026-07-27
- lanes: 3 AI-in-planning
- event: alstjgg's one-line thread ("이거 어떻게 진행된건가요? 테스트 결과 등이 있나요?") produced a full account: live Nova/Haiku latency matrix from the real game UI (7.4s–29.2s per combination), links to raw evidence, and an explicit disclaimer that single runs are not a statistical benchmark.
- tension: The human's review currency is measurements; the agent's answer distinguishes what was verified from what was merely exercised.
- quote: "각 조합을 한 번씩 실행한 결과이므로 통계적인 성능 우열을 확정한 벤치마크는 아닙니다."
- flags: measurement

### S9a-074 — "The repo documents a decision procedure that never ran"
- source: PR #81 (review thread P1, benchmark deletion)
- date: 2026-07-27
- lanes: 3 AI-in-planning
- event: alstjgg caught that the PR deleted the entire model-benchmark protocol (§10) from the docs while other docs still claimed the allowlist existed "so the benchmark can compare Nova and Haiku" — leaving decision history, a competition deliverable, describing a procedure that never happened. The agent did not restore §10 (it measured the wrong game's metrics), instead recording *why* it won't be restored and adding an "Open decision — model selection" section: the real axis is dialogue quality, a blind two-person 35-sample comparison protocol with pre-registered tie rules, cost <$1, awaiting approval.
- tension: Deleting stale process vs. preserving decision provenance — resolved by documenting the substitution of grounds ("벤치마크"에서 "동작 검증"으로) rather than pretending continuity.
- quote: "Decision history is a competition deliverable — as written, the repo documents a decision procedure that never ran."
- flags: contradiction, decision

### S9a-075 — Membrane claim audited: "no free text" was an overstatement, downgraded to a named residual risk
- source: PR #81 (review thread P2, dialogue-validation.ts)
- date: 2026-07-27
- lanes: 1 AI-in-the-game
- event: alstjgg showed that `history[].npcLine`, `playerChoiceLabel`, and `availableClues[].text` were length-bounded but otherwise arbitrary client strings flowing verbatim into the model prompt on an unauthenticated endpoint — while the rewritten docs claimed "no player free-text field". The agent corrected three documents to state exactly which slots are registry-checked and which are merely bounded, listing the mitigations as an *accepted residual risk*; it rebutted full allowlisting (procedural clues have no server roster; partial allowlisting forks the validation rules) and asked to discuss separately.
- tension: The membrane rule as marketed vs. as implemented; honesty in docs chosen over a hasty tightening.
- flags: boundary, contradiction

### S9a-076 — Validate, never repair — and a forecast that the fix may redden the next deploy
- source: PR #81 (review thread P3, `?` auto-append)
- date: 2026-07-27
- lanes: 1 AI-in-the-game
- event: One validation path silently *repaired* model output (appending `?`), shipping "그렇군요.?" as a live response while the neighboring rule correctly rejected. Changed to the same `PublicError(502)` → deterministic-fallback pattern. The agent warned in advance that if the auto-repair had been masking real model behavior, the next deploy's smoke may detect fallback and fail — "그건 버그가 아니라 이 변경이 의도한 신호입니다."
- tension: Silent repair vs. loud rejection at the LLM boundary, plus pre-registering that a future red gate is the fix working.
- flags: decision, measurement

### S9a-077 — Reviewer's fix wouldn't run: agent re-designs the warm-up within CI's actual permissions
- source: PR #81 (review thread P2, warm-up)
- date: 2026-07-27
- lanes: 3 AI-in-planning
- event: The reviewer asked for `npm run warmup` between deploy and smoke; the agent showed it couldn't work — the warmup script calls Bedrock directly and the deploy role has zero `bedrock:` permissions — and instead added `--warm-only` to the smoke script, warming through the deployed endpoint, absorbing the same grammar-compile failure mode with no new permissions.
- tension: A correct-sounding review demand adjusted against the ground truth of the permission model — compliance in intent, redesign in mechanism.
- flags: decision

### S9a-078 — A fully-evidenced feature PR closed by a pivot upstream
- source: PR #83 (body + close); PR #90 (body)
- date: 2026-07-26 → 07-29
- lanes: 2 AI-building-the-game
- event: The apothecary-gameplay-to-Lambda connection PR carried complete evidence (six automated screenshots, network-evidence.json, 1,067 tests, two live 200s with `x-llm-fallback=false`) and was stacked on #81 awaiting rebase — then closed unmerged on 07-29 when the team pivoted to DDAY and archived the apothecary LLM layer; #90's body records "PR #83 클로즈로 보류 사유가 해소되어 실행".
- tension: The second demo-phase casualty (after #16): not rejected, obsoleted — evidence quality had no bearing on survival once the concept moved.
- links: S9a-006, OH-1 hook (final concept after demo comparison)
- flags: pivot

### S9a-079 — Repo topology enforced in review: demos/ is for deployed playable games only
- source: PR #86 (review, changes_requested)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: The field-report concept PR (PRD, text demo, model bench) was approved on content but bounced on location: alstjgg required moving it from `demos/` to `planning/field-report-poc` because demos/ is reserved for Pages-deployed playable games. The agent moved it and fixed bench paths.
- tension: Directory layout as a load-bearing contract (Pages workflow globs demos/*) — enforced even on a PR that was otherwise approved.
- quote: "`demos/`에는 git page로 배포된, playable game만 두려고 합니다."
- flags: boundary, human-override

### S9a-080 — Bench facts that killed reasoning-effort: thinking blows the beat budget
- source: PR #86 (body)
- date: 2026-07-28
- lanes: 1 AI-in-the-game
- event: The field-report bench measured on real game payloads: `output_config.effort` unsupported on Haiku 4.5 (ValidationException); Sonnet/Opus 5 profiles ACTIVE but AccessDenied; recommendation Nova 2 Lite first (p50 1.0–1.2s, 100% JSON compliance) with Haiku thinking-disabled second — and an explicit rule not to raise reasoning effort because thinking pushes p50 to 12–14.6s, past the presentation budget.
- tension: Model choice decided by latency-vs-drama arithmetic, measured not assumed; the same "latency hides in pauses" constraint from CLAUDE.md operating as a bench criterion.
- flags: measurement, cost

### S9a-081 — Duplicate cleanup PRs consolidated rather than raced
- source: PR #90 (close comment)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: The archive-the-LLM-layer PR was closed with its commits moved onto #89's branch because both were the same cleanup ("PR #89로 통합 (같은 정리 작업 — 커밋을 그쪽 브랜치로 이관)").
- tension: Boring but real: supersede-by-consolidation as the standard answer to overlapping human/agent housekeeping.
- flags: reversal

### S9a-082 — Adopted is not verified: a PR body that polices its own future quotes
- source: PR #94 (body)
- date: 2026-07-30
- lanes: 3 AI-in-planning · 1 AI-in-the-game
- event: The mechanism-direction PR distinguished C-BLOCK "채택" from "검증 완료" (placebo control outstanding) and shipped a forbidden-phrases list — ❌ "C-BLOCK이 검증됐다", ❌ using C-STRUCT results as competition evidence, ⭕ "현재 가장 강한 실측 근거를 가진 기본 메커니즘" — plus the C-STRUCT stop framed as program pause with re-open conditions pinned.
- tension: Evidence discipline extended to marketing language; the document constrains what the team may claim before the remaining controls run.
- flags: measurement, decision

### S9a-083 — Two independent measurement programs collide in the ledger; human arbitrates by renumber cost
- source: PR #94 (issue comment + review)
- date: 2026-07-30
- lanes: 3 AI-in-planning
- event: #94 and #95 had both appended A-numbered rules past A14 independently, colliding. alstjgg's steer resolved merge order mechanically (whichever renumber costs less — #95's numbers were cited in harness code and selftests, #94's only in docs), directed the A15–A19 → A18–A22 renumber, proposed unifying "pause" vs "closed" wording toward "closed" as the defensible claim given combined data, and noted the convergence itself: two independently designed programs reaching the same two conclusions is material for the AI-utilization document.
- tension: Parallel agent workstreams produce ledger conflicts; the human's role is ordering and synthesis, not re-measurement.
- quote: "서로 독립적으로 설계한 두 측정 프로그램이 — 다른 gate, 다른 probe 설계로 — 같은 두 결론(C-BLOCK 채택 · C-STRUCT 종료)에 수렴한 것 자체가 AI 활용 문서에 쓸 좋은 재료입니다."
- flags: decision, contradiction

### S9a-084 — A 16,369-line diff with a reading map: "read 300 lines, don't read the raw"
- source: PR #94 (body)
- date: 2026-07-30
- lanes: 3 AI-in-planning
- event: The PR body triaged its own diff for the human reviewer: ~300 lines of judgment to read closely, ~220 of lineage on demand, ~15,000 lines of raw run artifacts explicitly marked "읽지 마세요" — with the verification section standing in for reading (metrics re-parsed against claimed counts: 190 kept / 18 discarded).
- tension: Reviewability at agent-output scale is a designed property of the PR, not a property of the diff.
- flags: proposed:agent-audience, measurement

### S9a-085 — The rule that fixed speaker misattribution was structural, not prosaic
- source: PR #98 (body)
- date: 2026-07-31
- lanes: 1 AI-in-the-game
- event: Narration speaker misattribution (8/10) was driven to 0/5 through three causes; the last yielded only to payload structure: the same rule as a prose constraint changed nothing (2/5), grouping `PRESENT_NPCS` by a `side` field got 1/5, and attaching the rule to that label got 0/5 twice independently — so `side` became a typed engine requirement described as "장식이 아니라 이 실패를 막는 유일하게 작동한 수단".
- tension: Prompt-engineering folklore replaced by an ablation: where a rule sits beats what it says.
- quote: "규칙은 그것이 적용될 데이터 옆에 있을 때 작동합니다. 멀리 있는 제약 목록에서는 읽히지 않습니다."
- flags: measurement, decision

### S9a-086 — Paper gate: 20 LLM calls spent on questions the files already answered
- source: PR #98 (body)
- date: 2026-07-31
- lanes: 3 AI-in-planning · 1 AI-in-the-game
- event: The PR tallied that 20 calls of the run went to "closed questions" (answerable by reading the suite files) and introduced `lint-beat.mjs` + suite validation to answer that class for free, verified against the suites that had actually failed.
- tension: LLM spend audited like any budget; the corrective is a static gate, not discipline.
- quote: "닫힌 질문에 쓴 콜은 전액 낭비인데, 이번에 20콜이 그렇게 갔습니다."
- flags: cost, measurement

### S9a-087 — Human approves the finding, demands the spec follow it
- source: PR #98 (review, changes_requested → approved)
- date: 2026-07-31
- lanes: 3 AI-in-planning
- event: alstjgg accepted that Call 2's definition had effectively changed under test evidence, but blocked until the architecture spec and its "Data flows (the supply chain)" section were updated to match — the doc, not the code, was the merge blocker.
- tension: Specs as the single source of truth: empirical drift is fine, undocumented drift is not.
- quote: "테스트 결과 상 정의가 바뀌는 것에는 동의하나, 스펙 문서(dday-architecture-spec.md)를 이에 맞게 업데이트해주시면 좋겠습니다."
- flags: decision, human-override

### S9a-088 — A PR closed for being too big to review, split with its history preserved
- source: PR #99 (body + close comment)
- date: 2026-07-31
- lanes: 3 AI-in-planning
- event: What began as a mechanism-binding docs PR accreted four workstreams (spec v1, scenario system, pipeline 3-track, phase transition); alstjgg closed it and split into #100/#101 with an ordered merge plan, keeping the original branch "세부 커밋 이력 보존을 위해" undeleted.
- tension: Review-unit sizing applied to human/agent docs work, with the same history-preservation instinct as the code rules.
- flags: decision

### S9a-089 — The human reviewer mutation-tests the agent's drift gate with its own five mutations
- source: PR #107 (issue comment, alstjgg)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: On the prompt-parity gate ("the only thing holding up 'the mechanism measurements describe the deployed system'"), alstjgg ran five mutations of his own devising — block separator, stance list format, NPC em-dash, symptom fallback, blank-run collapse. Four caught; the sole survivor was exactly the gap the test itself documents, and the stated reason checked out.
- tension: The trust-inversion protocol turned back on an agent's guard by the human — and the guard's documented limitation is confirmed as its only hole.
- quote: "The parity gate genuinely bites. … The survivor was the blank-run collapse, i.e. exactly the gap the test already documents."
- flags: measurement

### S9a-090 — "The gate runs nowhere": the repo had never run CI on a PR
- source: PR #107 (issue comment + fix)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: alstjgg observed that the 36 proxy tests, parity gate included, executed only when a human remembered: deploy.yml is push-to-main on node 22 and never enters proxy/; the other workflow was dispatch-only. The agent's fix widened the finding — *no* PR in the repo had ever run CI, root checks included — and added `ci.yml` (root on node 22, proxy on node 24) while keeping deploy.yml the sole Pages path.
- tension: A well-built gate wired to nothing; the fix institutionalized CI for the first time, mid-competition.
- flags: failure, decision

### S9a-091 — The agent corrects the human reviewer's repro — and makes the reviewer's failure the universal one
- source: PR #107 (issue comment, C9Boom7)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: alstjgg had reported `npm ci` hard-failing on node 22 (`notsup`); the agent corrected the mechanism — npm only hard-fails on `engines` when `engine-strict` is set, and no `.npmrc` existed, so the default was a *warning* plus a successful-but-quietly-different install, which is worse — then added `proxy/.npmrc` with `engine-strict=true` so the reviewer's clean failure becomes everyone's, verifying by flipping engines to `>=99` and reproducing.
- tension: Correction flowing agent→human, accepted, and weaponized: the reviewer's environment-specific behavior was promoted to policy.
- quote: "Your `notsup` isn't the default … the install *succeeds* on node 22, which is worse: it surfaces later as a test or bundle that quietly differs from the deployed one."
- flags: reversal, decision

### S9a-092 — The zero-activity unit PR: a fixed self-report liturgy
- source: PR #58, #70, #111, #124, #133 (bodies; sampled for the 46 skipped)
- date: 2026-07-25 → 2026-08-04
- lanes: 2 AI-building-the-game
- event: Unreviewed unit PRs follow one shape: `[AGENT: U-xx author]` tag; Why / What / Acceptance (checkboxes with verification commands) / Test (measured counts) / Checklist; a footer marking it a 쪼갠 PR to the integration branch, squash-merged. Bodies routinely disclose their own irregularities — #58: "one assertion repair: stripComments() broke an unsatisfiable glob pattern; now reads the file raw — same intent, strictly stronger".
- tension: By the later runs (super/20260803, 20260804) review volume drops to zero while the confession-style body persists — the protocol's honesty conventions outlived the enforcement that created them.
- flags: proposed:protocol

### S9a-093 — Units file their own violations: scope overflow, invented conventions, absent specs
- source: PR #124 (body, "Notes for reviewers"); PR #133 (body)
- date: 2026-08-03 / 08-04
- lanes: 2 AI-building-the-game
- event: e8's body proactively logged: a pre-agreed additive edit outside its globs; that no ratified sessionStorage key existed so it *picked* `dday.meta.<slug>` and flagged it for the client track to veto; and that spec.md/design.md were absent from its worktree so it built against tests.md — "same worktree-sync gap e1 logged". e9 documented 2 pre-existing test failures on a frozen path it did not touch, with a pointer to where they're tracked.
- tension: With no reviewer commenting, the PR body becomes the discovery ledger — units report the harness's own defects (worktree sync) through the only channel they have.
- flags: boundary, proposed:harness-ops

## OH-1 corroboration

- **"3가지 데모 준비" → demo comparison → new-concept discussion → DDAY** — *confirmed in PR-level evidence.* Three demos are visible as build targets in this slice's window: apothecary (unit runs 20260724/20260725, PRs #18–#45), doodle-life (#16, playable demo), darkest-context (#42/#50/#53 + unit runs 20260725-153055/20260726-075042). Doodle-life was killed by an explicit concept decision on 07-25 (#16: "we decided not to continue on the doodle-life concept"). *New* concepts then appear after the demo phase: D-Day (#85, 07-28 — outside this slice but in the inventory) and field-report (#86, 07-28), matching OH-1's "데모 비교 이후 신규 컨셉 논의". DDAY's first appearance in this slice is #94 (07-30, mechanism direction) and #98 (07-31, call contracts); apothecary's live-LLM line (#83) was closed 07-29 and its infra archived (#90) as the pivot landed. Agent-arena appears only as #15 (manual, outside slice) — the PR record supports three *demos*, more than three *concepts*.
- **Membrane rule as founding agreement** — *corroborated as enforced practice, not origin.* The membrane appears throughout unit reviews as a standing invariant checked in code ("멤브레인 준수(네이티브 폼 컨트롤 0)" #21/#25/#35; whitelist projection "물리적으로 강제" #36; INV-1 in #77), and #81's P2 thread shows the team *auditing* an overstated membrane claim in docs. Nothing in the PRs dates the agreement's origin — consistent with OH-1's claim that it predates the repo; origin remains oral-only.
- **"게임 개발 자체에 AI를 쓰는 것은 당연하나, 인게임에도 AI를 넣어야할까?"** — *indirectly corroborated:* every demo PR pairs a build-side AI apparatus (super-pipeline unit PRs) with a deliberately bounded in-game AI seam (stub/live adapters #40, proxy #81, contracts #98), i.e., in-game AI was engineered as an *optional, degradable* layer — the shape one would expect if its inclusion had been a genuine open question.

## Balancing win-sweep 2026-08-05 (wins under revised bias)
Coverage: Re-read the full issue-comment review threads of PR #34, #35, #41 (apothecary unit reviews, both rounds), #107 (proxy single-agent), #98, #94, #86, #50, #53 (single-agent approvals); read the bodies of zero-activity engine-run unit PRs #122, #132, #134; cross-checked the zero-review-activity inventory in `corpus-prs.md` §Per-group / §Zero-review-activity. Re-framed the four audit-lead atoms (S9a-031, -059, -089, -026), which logged a caught defect as a failure but buried the fact that the review demonstrably *worked*. Cap: did not re-pull inline GraphQL review threads (Phase-1 mined those; these reframes and new wins draw on the issue-comment-level review summaries and the cited existing atoms' sources). ADDITIVE — no existing atom edited.

### S9a-W001 — The review loop closes green: every reviewed apothecary unit reached a verified round-2 approval
- source: PR #35 (review, round-2 approve); recurs PR #34, PR #41 (round-2 approve)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: After changes-requested round 1, the Lead re-ran the fixed unit from a clean worktree, confirmed each requested change was actually reflected, and recorded an explicit approval — e.g. #35 round 2: "94/94 green", "360/360 green", every round-1 mutation now failing. The panel did not just find defects; it drove each reviewed unit to a re-verified green close.
- tension: The win the failure-biased pass skipped: the multi-agent review is not only a defect net — its terminal state is a *verified* approval, reached on every reviewed unit PR in the run.
- quote: "라운드 2 리뷰 — **approve**. 미해결 3건 모두 실제 반영을 검증하고 resolve했다."
- links: S9a-031, S9a-033, S9a-008
- flags: win, method-working, milestone

### S9a-W002 — Trust-inversion's other result: the agent's self-reported gates were independently confirmed TRUE
- source: PR #35 (review, round-1); recurs PR #34, PR #41 (round-1)
- date: 2026-07-24 → 07-25
- lanes: 2 AI-building-the-game
- event: The Lead re-ran the author's claimed test/build/typecheck commands from a clean checkout and found the numbers accurate — #35: "57/57 · 323/323 · typecheck clean" 자기보고는 사실이다; #34: "AC 4개 모두 사실로 충족됨을 확인했다"; #41: the CSS-fallback robustness claim reproduced true. The failure-biased mining logged only the cases where re-verification broke a claim; the majority result was that the agent's green self-reports held up under independent replay.
- tension: Trust inversion is usually cited as catching lies. Its equally-real output is a measurement of AI reliability: the build-agent's factual test/build claims were, when re-run, substantially true.
- quote: "저자의 '57/57 · 323/323 · typecheck clean' 자기보고는 **사실이다**. 숫자에는 거짓이 없다."
- links: S9a-008, S9a-018
- flags: measurement, ai-strength, method-working

### S9a-W003 — The review certifies, not only catches: a "잘한 점" ledger of correctly-held invariants
- source: PR #35 (review, round-1 "잘한 점"); recurs PR #34, PR #41 ("좋았던 점")
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Alongside its change requests, the Lead itemized what the unit got *right* and had independently verified: §3-3 self-timer ban honored in code and tests via a comment-stripping scan ("주석으로 눈속임하는 스캔이 아니다"), the membrane held (zero native form controls, `textContent`-only render), and `createSettleLatch`'s 8 tests were genuine behavior checks. Correct engineering was affirmatively recorded, not merely waved through.
- tension: A review panel that only logs defects looks purely negative; this one issued positive certification of held invariants — evidence that the good work was recognized and confirmed, not just the bad work flagged.
- quote: "§3-3(자체 타이머 금지)이 구현·테스트 양쪽에서 실제로 지켜진다 … 주석으로 눈속임하는 스캔이 아니다."
- flags: win, method-working, ai-strength

### S9a-W004 — Mutation testing worked as a repeatable teeth-test: each fix re-run showed the mutant now dies
- source: PR #35 (review, round-2 mutation table)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The Lead re-applied the same two render mutations that had passed 92/92 before the fix and showed each now fails, plus a third; the tabulated before/after ("이전 라운드 92/92 green (미검출) → 현재 fail") demonstrated the tightened tests had real teeth. The technique — mutate the implementation, require the suite to redden — became the run's standard instrument for judging whether a gate actually gates.
- tension: The buried win under S9a-031: mutation testing didn't just expose a vacuous gate, it *proved the repair*, and did so cheaply and repeatably enough to adopt as a convention.
- quote: "`root.append(...)` → `lineEl` 제거 | 92/92 green (미검출) | fail"
- links: S9a-031, S9a-037, S9a-050
- flags: technique-worth-copying, measurement, method-working

### S9a-W005 — Two independent measurements converged to the pixel before the fix was accepted
- source: PR #41 (review, round-2 "독립 검증")
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: After the Lead's browser-canvas alpha measurement showed 6/8 jars mis-cropped, the author independently re-measured with Python/PIL and confirmed the reviewer's `contentRect` numbers to the pixel; at round 2 the Lead re-measured with its own PIL pass and recorded "24개 셀 전부 크롭 윈도우 ⊇ 항아리 bbox, 이웃 픽셀 bleed = 0", plus a mutation and a screenshot. Reviewer and author reached the same measured geometry from separate tooling.
- tension: The buried win under S9a-059: the decisive evidence was not one party's assertion but two independent measurements agreeing — the strongest form of verification the run produced, and repeatable by anyone.
- quote: "**알파 채널 재측정**(PIL): `contentRect` 수치가 실제 시트 기하와 일치. 24개 셀 전부 크롭 윈도우 ⊇ 항아리 bbox, **이웃 픽셀 bleed = 0**."
- links: S9a-059, S9a-063
- flags: measurement, method-working, technique-worth-copying

### S9a-W006 — Spoiler leak caught AND closed: the answer key proven absent from the shipped bundle
- source: PR #34 (review, round-1 build + round-2 verify)
- date: 2026-07-24 → 07-25
- lanes: 2 AI-building-the-game · 1 AI-in-the-game
- event: After the Lead built the branch and showed a default JSON import would emit `hiddenCause` (the secret players must deduce) into the client bundle, the author switched to a named import and added a real-build regression test; the Lead rebuilt and inspected the artifact — "pixelate.bundle.js 5576 B, hiddenCause 없음" — confirming the secret is provably absent from what ships. The defect was not just found but demonstrably eliminated before merge.
- tension: The buried win under S9a-026: this is the review panel doing exactly its job — a shipped-answer-key leak intercepted and its fix verified at the artifact level, pre-merge.
- quote: "vite lib 빌드 산출물 직접 검사 | `pixelate.bundle.js` 5576 B, `hiddenCause` 없음"
- links: S9a-026
- flags: win, capability, measurement

### S9a-W007 — An AI-built verification gate, mutation-tested by the human, "genuinely bites"
- source: PR #107 (issue comment, alstjgg)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The prompt-parity gate the agent wrote to prove "the mechanism measurements describe the deployed system" was stress-tested by alstjgg with five mutations of his own; four were caught, and the sole survivor was exactly the gap the test itself already documents. The human's verdict certified the agent's guard as effective.
- tension: The buried win under S9a-089: trust inversion turned on an agent-authored gate returned a *pass* — the AI-built verification apparatus was independently confirmed to work, its only hole being the one it already disclosed.
- quote: "**The parity gate genuinely bites.** … Four caught. The survivor was the blank-run collapse, i.e. exactly the gap the test already documents … Independently confirmed."
- links: S9a-089
- flags: capability, measurement, win

### S9a-W008 — Milestone: the agent institutionalized repo-wide CI in a single pass
- source: PR #107 (issue comment, C9Boom7 + fix 55f87f9)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: Told the parity gate ran nowhere, the agent widened the finding — *no* PR in the repo had ever run CI — and added `ci.yml` (root on node 22, proxy on node 24, `npm run check` on every PR) plus `proxy/.npmrc` with `engine-strict=true`, keeping `deploy.yml` the sole Pages path. First automated PR gate in the project, landed mid-competition without touching the deploy path.
- tension: A capability the whole repo lacked, delivered correctly in one exchange: the fix reached past the reported symptom to institutionalize continuous verification.
- quote: "New `ci.yml` … no PR here has ever run CI, root check included. Both are wired now."
- links: S9a-090, S9a-091
- flags: milestone, capability, win

### S9a-W009 — One-shot delivery: the DDAY engine's units merged clean with zero review rounds
- source: PR #132 (body), PR #134 (body); `corpus-prs.md` §Zero-review-activity
- date: 2026-08-03 → 2026-08-04
- lanes: 2 AI-building-the-game
- event: The engine run (`super/20260804-000518`, e0–e10) merged as unit PRs #118, #119, #122–#125, #127, #128, #132–#134 with zero comments and zero review submissions each — every one carrying green gates on delivery. #132 (e7) bound five prior slices into a live driver with 166 driver tests green; #134 (e10) transcribed all ten §8 acceptance criteria over the shipped datapack at 878 tests, "0 failed", nothing re-implemented.
- tension: The failure-biased pass over-sampled the contentious PRs; the modal outcome across the two production runs was the opposite — a unit that decomposed cleanly enough to merge first-pass, gates green, no round-trip needed.
- quote: "56 files, 878 tests, 0 failed. `npm run check`, `npm run build`, `npm run probe:selftest` … all green"
- links: S9a-092, S9a-093
- flags: milestone, measurement, method-working

### S9a-W010 — Capability delivered: a driver whose membrane and idempotence hold by construction
- source: PR #132 (body)
- date: 2026-08-03
- lanes: 2 AI-building-the-game · 1 AI-in-the-game
- event: e7's live driver made whole classes of bug unrepresentable rather than merely tested: two block tiers (seen / mined) so deploying an unmined id is "impossible by construction"; every `ViewEvent` passes `assertSeamClean` before any subscriber sees it (skipping the guard is a visible edit); `deploy` de-duplicated and code-unit sorted so two click orders compose byte-identical payloads. Shipped correct on first review-free merge.
- tension: The membrane and determinism constraints from CLAUDE.md were satisfied structurally — the strongest way to hold an invariant — and delivered without a review round to force it.
- quote: "two block tiers (seen / mined) so deploying an unmined id is impossible by construction … `deploy` is de-duplicated and code-unit sorted, so two click orders compose byte-identical payloads."
- flags: capability, technique-worth-copying, win

### S9a-W011 — Single-agent PRs approved clean: asset pack "LGTM", PRD in one pass
- source: PR #53 (review, approve); PR #50 (review, approve)
- date: 2026-07-25
- lanes: 4 AI-as-creator · 3 AI-in-planning
- event: The darkest-context final asset pack (#53, 10 finals posted as evidence) was approved with a bare "LGTM"; the Call-2 PRD revision (#50) was approved on content in one pass with only a non-blocking language suggestion. Single-agent sessions produced merge-ready deliverables the human accepted without a change request.
- tension: Not every AI PR needed the adversarial gauntlet — some arrived correct and were merged on sight, which is itself a data point on where the heavy review process was and wasn't load-bearing.
- quote: "LGTM"
- links: S9a-066, S9a-068
- flags: win, ai-strength

### S9a-W012 — A robustness claim in the body, reproduced true by the reviewer
- source: PR #41 (review, round-1)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The u7 body claimed CSS `url()` backgrounds degrade gracefully to a color when the asset is missing; the Lead tested it by pointing `bg-shop.png` at a non-existent file and running `vite build` — the build passed and only `--color-bg` remained. "AC4의 CSS 폴백 주장은 사실입니다." The author's degradation claim was independently confirmed.
- tension: A concrete instance of the build-agent's non-trivial correctness claim surviving hostile re-testing — the graceful-degradation design worked as advertised.
- quote: "CSS url() 폴백도 직접 확인 … `--color-bg`만 남습니다(원복 완료). AC4의 CSS 폴백 주장은 사실입니다."
- flags: measurement, ai-strength, win

### S9a-W013 — Independent replication as evidence: two measurement programs reached the same two conclusions
- source: PR #94 (issue comment, alstjgg)
- date: 2026-07-30
- lanes: 3 AI-in-planning · 1 AI-in-the-game
- event: alstjgg noted that #94 and #95 — two independently designed mechanism-measurement programs with different gates and different probe designs — converged on the same two conclusions (adopt C-BLOCK, close C-STRUCT), and flagged the convergence itself as strong material for the AI-utilization deliverable.
- tension: The buried win under S9a-083: the ledger *collision* was the friction; the *convergence* was a positive replication result — the highest-confidence evidence the mechanism work produced, arrived at by two separate agent workstreams.
- quote: "서로 독립적으로 설계한 두 측정 프로그램이 — 다른 gate, 다른 probe 설계로 — 같은 두 결론(C-BLOCK 채택 · C-STRUCT 종료)에 수렴한 것 자체가 AI 활용 문서에 쓸 좋은 재료입니다."
- links: S9a-083
- flags: measurement, milestone, win

### S9a-W014 — Milestone: a live in-game LLM path ran end-to-end with measured latency inside budget
- source: PR #81 (review thread, latency matrix); PR #83 (body, live evidence)
- date: 2026-07-27
- lanes: 1 AI-in-the-game · 3 AI-in-planning
- event: The Apothecary dialogue Lambda deployed and answered real game payloads: a live Nova/Haiku latency matrix (7.4s–29.2s per combination, sitting inside the 25s fallback design's pauses) and, in the stacked #83, two live `200`s with `x-llm-fallback=false` alongside six automated screenshots and a network-evidence capture. The proxied in-game AI call worked against production for the first time.
- tension: Before any of the review disputes, the underlying capability landed — an authenticated, degradable, latency-measured LLM-in-the-game path proven live, which is the thing the whole membrane/proxy architecture existed to make safe.
- quote: "각 조합을 한 번씩 실행한 결과이므로 통계적인 성능 우열을 확정한 벤치마크는 아닙니다."
- links: S9a-073, S9a-078
- flags: milestone, capability, measurement
