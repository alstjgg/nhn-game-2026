# Atoms — S9b PR bodies + review threads (integration/dashboard PRs & manual/human PRs)
Snapshot: main @ 5a3c388, mined 2026-08-04. PRs #1–#139 per `corpus-prs.md`. Sibling miner S9a
covered the 76 unit PRs + 10 single-agent PRs + the 5 closed-unmerged manual PRs (#4, #10, #16,
#90, #99); this file does NOT re-mine those.

Coverage:
- **Integration/dashboard PRs — all 7 deep-mined** (full body + every issue comment + every inline
  review thread via GraphQL `reviewThreads`): #17, #33, #56, #68, #84, #110, #116.
  - #33 (60 review submissions), #68 (48), #116 (46) carry the panel review evidence — 17 / 13 / 18
    inline review threads respectively, all read exchange-by-exchange.
  - #17 and #56 carry no inline threads; their activity is issue-level checkpoint/steer comments.
  - #84 (the darkest-context main-merge PR) carries no comments/threads; body only.
- **`[STEER]` audit:** exactly **one** literal `[STEER]`-tagged comment exists across all 7 PRs —
  PR #56's "Process language: English" (S9b-011). The later runs' real-time human steering does not
  use the tag; it appears as approval-gate constraint blocks in the dashboard body (#110) and as
  `[AGENT: Lead]` correction/ruling comments crediting the human "민서" by name mid-run (#110, #116).
  Those are mined as steering atoms (S9b-040..046). "STEER item" also recurs inside #116 review
  threads as a label for work deferred to the first live-provider run.
- **Manual/human PRs** (#1–#3, #5–#9, #11–#15, #28–#29, #46, #48–#49, #54, #85, #87–#89, #91–#93,
  #95–#97, #100–#106, #108–#109, #114, #138–#139): swept by a delegated pass — deep-mined those with
  comment/review activity, sampled ~5 quiet ones, listed the rest skipped. Its atoms are numbered
  from S9b-101 and appear under the "## Manual/human PRs" heading below, with their own coverage note.
- One exchange / one decision = one atom. Empty review-submission bodies (GitHub artifacts of inline
  posting) ignored. A review thread that stayed open across a round before resolving differently is
  captured as two atoms (finding, then the reversal/deferral).

---

## Integration / dashboard PRs

### S9b-001 — The dashboard-PR-as-control-surface convention, stated in the first run
- source: PR #17 (body)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The first super-pipeline run's integration PR defined itself as a "living dashboard PR" that grows as unit PRs squash-merge, flips to Ready at the end, and must not be auto-merged; it listed the review panel, config (git_mode full, cost-optimized models), and two steering channels.
- tension: The convention that one PR doubles as backlog, live build status, steer inbox, and merge gate — the control surface the whole method runs through — is established here as a repeatable template, not an ad-hoc note.
- quote: "This is a **living dashboard PR**: it grows as unit PRs squash-merge into the integration branch, and flips to *Ready* at the end. **Do not merge to `main`** — the human merges after the run completes."
- links: S9b-011, S9b-040
- flags: convention, boundary

### S9b-002 — Steering advertised two ways; the human never types free-text to the pipeline mid-action
- source: PR #17 (body §"How to steer this run")
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The dashboard body told the operator to inject direction with `/super-steer "<지시>"` or by commenting on the PR, and to check status with `/super-status` (0 tokens).
- tension: The steering interface is itself structured — a slash command or a PR comment against a running multi-agent job — establishing the "comment on the dashboard = steer" equivalence that later runs lean on.
- quote: "Inject direction: `/super-steer \"<지시>\"` **or** comment on this PR."
- flags: convention

### S9b-003 — Demo agent posts per-wave build/smoke to the dashboard, but Pages can't publish a subpath mid-run
- source: PR #17 (issue comments, `[AGENT: Demo]` checkpoints after-wave-1/2)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The Demo agent posted a build+smoke checkpoint at each wave boundary; every one reported it could not publish to Pages because Pages is workflow-sourced from `main`, so only screenshots (pushed to a `super/demo-shots/*` branch) stand in for a live link during the run.
- tension: A structural limit of the deploy model (Pages builds only from `main`) means an in-flight run can never show a playable link — screenshots substitute, and this recurs on every later run.
- quote: "GitHub Pages configured for workflow build from `main` branch. Subpath publication requires branch-based configuration … Current setup prevents direct file commits to demo subpath."
- links: S9b-020
- flags: boundary, measurement

### S9b-004 — Usage limit hit mid-run; the harness re-churned merged units; the human finished them by hand
- source: PR #17 (issue comment, `[AGENT: Lead]` run-complete note)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: After wave 4 the harness hit the account usage limit and, on cross-session resume, re-ran already-merged units; per operator decision u8 and u9 were finished surgically on the branch by hand (commits `7a20701`, `39555a0`) rather than let the harness re-run settled work, and a loader hardening from the churn was cherry-picked.
- tension: A concrete human-override of the autonomous loop — the operator stopped the harness from redoing merged work and completed the last two units manually. The earliest recorded "the human took the wheel" moment.
- quote: "after wave 4 the harness hit the account usage limit and, on cross-session resume, re-churned already-merged units. Per operator decision, **u8 + u9 were finished surgically** on this branch … rather than let the harness re-run settled work."
- links: S9b-005, S9b-042
- flags: failure, human-override, cost

### S9b-005 — A run kept posting to a PR that was CLOSED; finalization needed a reopen
- source: PR #33 (issue comment, `[AGENT: Lead]` anomaly note)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: PR #33 was in state CLOSED (closed 06:04Z, never merged) while the run kept posting dashboard/demo comments to it; finalizing required `gh pr reopen 33` before `gh pr ready 33`, with the number and history intact and head unchanged.
- tension: The dashboard-as-control-surface convention has a failure mode — the surface can be closed out from under a still-running pipeline, and recovering it is a manual reopen the Lead had to flag as an anomaly.
- quote: "this PR was in state `CLOSED` … while the run kept posting dashboard/demo comments to it. Finalization therefore required `gh pr reopen 33` before `gh pr ready 33` — no new PR was created."
- flags: failure, anomaly

### S9b-006 — Integrator caught cross-unit contradictions the per-unit gates could not see
- source: PR #33 (body, "Post-merge integration fixes")
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Three post-merge integration commits fixed seams no single unit owned: two units shipped a portrait validator each (a strict b64-only copy shadowed by a re-export), a reduced-motion NFR gate had been counting a prose comment as a second `@media` guard, and `tier-variants.json` was missing rows so tier 0 and tier 3 rendered byte-identical for the fallback customer.
- tension: The integration pass exists precisely because green unit gates can each be locally correct and jointly wrong — a duplicated validator, a substring-counting NFR check, and a data gap that made two patience tiers identical.
- quote: "NFR4b now counts `@media` blocks in `app.css` instead of substring mentions (a prose comment was being read as a second reduced-motion guard)"
- links: S9b-031, S9b-055
- flags: boundary, integration-catch

### S9b-007 — The demo's central PoC claim is left explicitly unverified (no keys in the harness)
- source: PR #33 (body, DoD + "Known follow-ups")
- date: 2026-07-25
- lanes: 1 AI-in-the-game
- event: The run's whole thesis was "can a slow live LLM hide inside the game's rhythm", but the harness has no API key, so the silhouette-entry frame is "only observable in live mode" and was recorded `silhouette-entry=false` in DISCOVERY; the live path was handed to a human via `e2e/live-smoke.md`.
- tension: The harness can only warrant the deterministic stub shell; the live-AI behavior the run set out to prove is a human-owned verification step, and the artifact says so rather than faking it.
- quote: "a frame that is **only observable in live mode** … recorded as `silhouette-entry=false` in `DISCOVERY.md` §u14"
- links: S9b-036
- flags: boundary, ai-limit, measurement

### S9b-008 — R2 (security lens): the answer key and prompt scaffolding shipped in the client bundle
- source: PR #33 (review thread, `src/pipeline/persona.ts`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The Security/AppSec reviewer proved a default JSON import shipped the entire generation table — style bible, portrait format, patience tones, and `ailments[].hiddenCause` (the game's answer key) — into the modulepreloaded main-game chunk on the Pages site, and showed the two gates that looked like they covered it structurally could not.
- tension: A convention written three files away (`pixelate.ts`: "A default import … would ship the ENTIRE generation table … including the game's answer key") was violated by new code, and the guard that should have caught it built "this module alone" so it could never observe the real bundle.
- quote: "A guard that cannot observe the real bundle is false assurance, which is worse than no guard."
- links: S9b-009
- flags: failure, boundary, security, membrane

### S9b-009 — Lead agreed, moved the guard onto the real artifact, and the reviewer mutation-tested the fix
- source: PR #33 (review thread, `src/pipeline/persona.ts`, fix + verify)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The Lead switched to named imports and rewrote AC-13 to assert no `styleBible`/`portraitSheetFormat`/`tierTones` fragment appears in `dist/**`; the reviewer re-checked on the PR head, then reverted to a default import to confirm the new gate actually reddens on the regression before resolving.
- tension: The reviewer did not accept the fix report — it mutation-tested the new guard ("a new assertion that cannot fail is the same defect one layer up"), the recurring epistemic stance of this panel.
- quote: "I also mutation-tested the new guard rather than trusting it — reverted `persona.ts:16` to a default import, rebuilt, and ran AC-13's exact needle logic against the artifact"
- flags: verification, measurement

### S9b-010 — R2 found a live-payload CSS `url()` breakout that fetched an attacker URL
- source: PR #33 (review thread, `src/ui/portrait.ts`)
- date: 2026-07-25
- lanes: 1 AI-in-the-game
- event: The reviewer traced an untrusted `/ai/portrait` payload to a raw `url("…")` CSS sink, showed the schema check validated type-and-emptiness only, and reproduced Chromium actually issuing a request to `evil.example` from a crafted `b64` value; the Lead both tightened the schema gate and added an escaping `cssUrl()` sink.
- tension: PRD §3-2's "live output is validated before use" was violated in the exact file that owns the schema, and the membrane's structured-input promise does not by itself neutralize a value-shaped injection at the render sink.
- quote: "A portrait response can therefore make the client fetch an attacker-chosen URL (beacon → player IP/UA disclosed to a third party) and stack arbitrary extra `url()` layers on the portrait cell."
- flags: failure, security, boundary

### S9b-011 — THE steer: process output is English, in-game text stays Korean (the membrane, restated for language)
- source: PR #56 (issue comment, the sole `[STEER]`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The one literal `[STEER]` comment in the corpus told every agent that all process output (PR titles/bodies/comments, review threads, commit messages, DISCOVERY, code comments, test descriptions) must be English from that point, with an explicit exception: every player-facing authored Korean string stays Korean, enumerated file by file.
- tension: A human steering a running multi-agent pipeline in real time, drawing the exact process/product language boundary — "if a judge reads it while playing, it stays Korean; if a reviewer reads it in GitHub, it is English."
- quote: "**In short: if a judge reads it while playing, it stays Korean. If a reviewer or teammate reads it in GitHub, it is English.**"
- links: S9b-001, S9b-002
- flags: human-steers-running-pipeline, boundary, decision

### S9b-012 — Approved gate decision: the "provided" AI vendor path did not exist, so a unit built it in-run
- source: PR #56 (body, "Approved gate decisions")
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The dashboard recorded that the PRD assumed proxy/contract/live-adapter/ai-smoke were human-provided and pre-verified, but they did not exist on the branch; the human approved u2 porting them from the proven apothecary implementation, with the gate reduced to structure-only and real-key verification kept as a human step.
- tension: The PRD's premise was wrong about what already existed; rather than block, the human ratified an in-run scope expansion at the approval gate and recorded it as a decision.
- quote: "**AI vendor path is built in-run (u2).** The PRD assumed proxy / contract / live adapter / ai-smoke were human-provided and pre-verified; they do not exist on this branch."
- flags: decision, reversal, boundary

### S9b-013 — R2 (domain lens): live personas were composed from empty text for every hero
- source: PR #68 (review thread, `tests/ai/contract.test.ts`)
- date: 2026-07-26
- lanes: 1 AI-in-the-game
- event: The reviewer found `data/heroes.json` authored `defaultPrompt.lines` while the composer read `defaultPrompt.text ?? ''`, so live mode sent the model a blank persona row under each hero's id; the gate missed it because the fixture used a `{id,text}` shape the real data did not have and only checked for the literal `undefined`, which an empty string passes.
- tension: The demo's central live claim (personality reads from the sheet) rested on an empty sheet row, and the gate that "covered" it was written against a data shape that did not ship.
- quote: "the system prose asserts `아래 '행동 지침 시트'에 적힌 것만이 너의 성격이고 신념이다` and then hands the model nothing under the persona id … I read must-prove 1–2 as unproven in live mode."
- flags: failure, boundary, measurement

### S9b-014 — R2: a numeric-separator hole let any tunable launder past the no-inline-tunables gate
- source: PR #68 (review thread, `tests/data/loader.test.ts`)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The reviewer showed the repaired guard's deny-list regex used decimal digits while the sole offending literal was written `8_000` with a numeric separator, so the scan never fired; the same literal duplicated a `data/tuning.json` value it was supposed to source.
- tension: A review-blocking "balance-as-data" gate could be evaded by a single underscore, and the one file exploiting the hole was the only numeric-separator literal in `src/`.
- quote: "Drop the underscore and the guard fires; keep it and any tunable can be laundered past a review-blocking gate (`7_0`, `4_000`, `9_00` …)."
- flags: failure, boundary

### S9b-015 — R1: an inline `BUCKET_CONFIG` flipped a whole run clear→defeat while 1264 unit tests stayed green
- source: PR #68 (review thread, `src/app/game-context.ts`)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The Skeptical-breaker showed three run-outcome thresholds lived hardcoded in `src/` and were hand-copied into seven test files, so a one-character edit (`hurtBelowRatio: 0.5→0.9`) broke the run from clear to defeat while every one of 1264 unit tests passed and only the composed e2e gate caught it.
- tension: "Balance-as-data" was a comment, not an enforced property; every unit slice graded the constant against its own private copy, so drift was invisible to the whole unit suite.
- quote: "a one-token drift in a `src/` constant flips the whole run from **clear → defeat** while all 1264 unit tests stay green."
- links: S9b-006
- flags: failure, boundary, integration-catch

### S9b-016 — R1: `mirror_shield` was unreachable — the T3a puzzle was always answered wrong
- source: PR #68 (review thread, `data/decisions.json`)
- date: 2026-07-26
- lanes: 4 AI-as-creator
- event: The reviewer proved the authored 1-1-1 council split always resolved to the wrong option on a stat ladder, with or without the 「번역 렌즈」 hint, so one of eleven cards was dead content and the T2-draft "what you passed on hurts at T3" claim was false for the lens; the Lead authored the card-variant stance row the agenda never had.
- tension: A PRD claim ("all 11 cards reachable within one run") was contradicted by the shipped data, and the existing gate "bakes the wrong answer in as the expectation."
- quote: "If the intent really is 'the party gets it wrong no matter what', then §2.5's 11-card claim and the DoD line 'all unit acceptance criteria met' need to be corrected instead."
- flags: failure, contradiction, boundary

### S9b-017 — R3 BLOCKER: the shipped page was not playable — combat froze on turn 1 forever
- source: PR #68 (review thread, `src/app/director.ts`)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The Operator-advocate proved `advance()` was reachable only through `window.__app.drain()`, published only under `?gate=1`, so at `/` (the URL a judge opens) the fight never played a beat; the "3–5 minute run clears" proof ran entirely through a test-only API absent from the shipped page, yet every gate was green because the specs only asserted the combat screen mounted.
- tension: A green board ("1264 passed / 127 e2e passed") "is true and simultaneously tells us nothing about the human path" — the demo's headline proof was measured through a seam the player never gets.
- quote: "**The 3–5-minute run is proven only through a test-only API that does not exist on the page a judge loads.**"
- links: S9b-018
- flags: failure, boundary, measurement

### S9b-018 — Lead: "the shipped page now plays itself"; R3 replayed a full run at judge pace before resolving
- source: PR #68 (review thread, `src/app/director.ts`, fix + verify)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The Lead added an `autoAdvance` that drives the engine half of every screen (autoplay off under a gate, never pressing a player verb) and fixed the shipped page having silently been on TEST_PACE; R3 rebuilt and played a whole run clicking only player verbs — 3m34s door-to-door, first combat at 4.4s, zero errors — and ran the new no-seam gate to confirm it can't pass on a seam-driven page.
- tension: The fix had to make the page play itself without letting a test seam onto it — and the reviewer's acceptance came from a hand-played run, not the fix report's table.
- quote: "**3 min 34 s door to door, first combat at 4.4 s, zero page/console errors.** That is inside the 3–5 minute judging window on the human path, not only through the gate seam."
- flags: verification, game-feel

### S9b-019 — R3: bubble text was cream-on-cream at 1.31:1; root cause was a mis-sliced 9-slice frame
- source: PR #68 (review thread, `src/styles/assets.css`)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The Operator-advocate measured the decision line — "the single most important pixel in the demo" — at WCAG 1.31:1 after the u16 art pack was wired in; the Lead found the real cause was `border-image-slice: 12 fill` cutting the border art across the middle, fixed the slice, scoped the ink, and added a gate that decodes the page's own `border-image-source` centre pixel.
- tension: The committed review artifact `02-combat.png` hid the failure because it was captured at turn 1 with no bubble on screen, so the panel's own evidence set never showed the broken frame.
- quote: "The committed artifact `e2e/artifacts/02-combat.png` hides this because it was captured at 턴 1 with no bubble on screen yet, so the review set never shows the failure."
- flags: failure, game-feel, measurement

### S9b-020 — R1: `npm test` failed OPEN — the dist secret gate skipped itself on a clean checkout
- source: PR #68 (review thread, `package.json`)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The reviewer showed the INV-2 dist-secret assertion was guarded by `it.skipIf(!existsSync('dist'))` inside a describe literally named "the dist gate fails closed", so on a fresh clone it failed open — green with the check never run — and the PR body's "1264 passed" was that skip, its meaning changing with build order.
- tension: The one claim the repo most needs non-negotiable (no secrets in the deployed bundle) was silently unenforced whenever `dist/` was absent — "A gate whose result depends on whether someone ran `npm run build` earlier in the shell is not a gate."
- quote: "On a fresh clone there is no `dist/`, so it fails *open* — vitest reports green and the check never ran."
- flags: failure, boundary, measurement

### S9b-021 — R3: bubble attribution was positional and wrong; the fix report claimed it fixed while it hadn't
- source: PR #68 (review thread, `src/styles/combat.css`, round 2)
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: After a first fix moved bubbles off the sprites, R3 kept the thread open: `order` on a packed flex row fixed the sequence but not the position, so 46 live bubbles did not contain their own speaker and turn-2's first line printed over the wrong hero — and since the bubble carries no speaker name, position *is* the attribution, which must-prove 2 depends on.
- tension: The fix report and the CSS comment both asserted "each line hangs over its own speaker" while the running page contradicted them; the reviewer refused the claim on measured geometry and asked for positional grid columns plus a gate assertion.
- quote: "`src/styles/combat.css` even asserts the opposite in its own comment … and the fix report repeats it — so this would ship believed-fixed."
- links: S9b-022
- flags: failure, reversal, game-feel

### S9b-022 — Lead conceded the round-2 finding and rebuilt the rail as a grid on the line-up's own tracks
- source: PR #68 (review thread, `src/styles/combat.css`, round 3 resolve)
- date: 2026-07-27
- lanes: 2 AI-building-the-game
- event: The Lead agreed ("you were right, `order` fixed the sequence and left the position free"), made the rail a CSS grid deriving its tracks from the line-up's own origin/count/width/gap, extended the gate to assert each live bubble contains its own speaker's sprite centre-x, and verified the gate reds on the old layout; R3 re-measured 0/36 mis-attributed and resolved.
- tension: A three-round exchange where the reviewer's persistence overturned a "believed-fixed" claim and produced a drift-proof geometry — the panel functioning as an adversary the Lead ultimately deferred to.
- quote: "**Agreed — you were right, `order` fixed the sequence and left the position free. The rail is now a grid on the line-up's own tracks.**"
- links: S9b-021
- flags: reversal, verification, game-feel

### S9b-023 — The bake-off PR merged to main with unresolved review threads open by design
- source: PR #84 (body, DoD)
- date: 2026-07-27
- lanes: 2 AI-building-the-game
- event: The final darkest-context main-merge PR (#84) verified only the machine-checkable half in a clean worktree — typecheck, build, 1270 unit tests, secret gate, root build — and explicitly did not run the Playwright e2e or live path, listing "미해결 리뷰 스레드 0" as the one unchecked DoD box.
- tension: The main-merge PR is a thin re-attestation on top of the already-reviewed staging PR (#68); its own DoD leaves the e2e and live verification to the staging PR and a human, and merges anyway.
- quote: "**Not run here:** the Playwright e2e suite (`npm run test:e2e`) and the live-mode path … Both were green in the unit PRs; I verified the machine-checkable half listed in the table."
- flags: boundary, convention

### S9b-024 — R2: engine-side code leaked `inner_note` to the player as a certified, minable fact — a membrane breach
- source: PR #116 (review thread, `src/engine/index.ts`)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: The Domain-fidelity reviewer proved that on the Call-3 fallback path the agent's private `inner_note` entered `EXPERIENCED`, was minted on the certified `fact` channel, absorbed by the block store, shown in the objective-log UI, and carried into the next round's blocks — an authority path the contract's consumer table explicitly closes ("Never shown to the player directly; it leaks only through the report").
- tension: §8-5, the criterion that exists to catch exactly this, was green over a run where the breach was live, because the fixture provider echoed `EXPERIENCED` into `facts` and the shipped fallback did the same in engine code.
- quote: "the agent's private deliberation is (a) rendered in the objective-log UI, (b) mintable as a `fact` block, (c) carried into the **next** round's `BLOCKS` — an authority path §6's consumer table explicitly closes."
- links: S9b-025
- flags: failure, membrane, boundary

### S9b-025 — Lead closed the leak at two layers; R2 mutation-tested both and ruled on the contract reading
- source: PR #116 (review thread, `src/engine/index.ts`, resolve)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: The fix assembled the objective log without the note (structural) and withheld it at the mint boundary (model-side); R2 re-derived the breach with its own sentinel, then removed each guard in a scratch tree to confirm exactly the three new assertions redden, and ruled that the contract draws the filtering line in four places (§6 consumer table, §5 species split, W3 rule, and the frozen `report-guidance.json` policy).
- tension: The reviewer accepted the fix only after proving the defense-in-depth was not "a guard whose only adversary has been neutered", and recorded that the archive still carries `[속내]` a future report-viewer unit must re-filter.
- quote: "The membrane holds on both paths, under a live adversary, with the criterion that catches it now in the suite."
- links: S9b-024
- flags: verification, membrane, boundary

### S9b-026 — R1: the 876-green suite never ran the shipped composition root; the fix commit was not even pushed
- source: PR #116 (review thread, `tests/driver/engine-fixtures/rig.ts`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The Skeptical-breaker showed both integration rigs constructed a 223-line duplicate `createScriptedEngine` instead of the shipped `createEngine`, so 219 tests asserted against the copy and the least-reviewed code in the diff was reached only by one CLI; and the commit claiming to fix this (`0f56d0d`) was local-only — `git ls-remote` and `gh pr view --json headRefOid` both resolved to the earlier commit — so the PR body's verification was performed on a tree not under review.
- tension: This was "the finding the other six depended on" — the green board proved nothing about the shipped engine, and the claimed fix (plus the CI vitest step) wasn't in the PR at all.
- quote: "So the 166 driver tests and 53 acceptance tests assert against the copy, and `src/engine/index.ts`'s `createEngine` … is reached only by `tools/driver/run/bind.mjs`."
- links: S9b-027, S9b-046
- flags: failure, boundary, measurement

### S9b-027 — Lead pushed the fix; R1 mutation-tested by throwing inside the shipped root and watching 66 tests red
- source: PR #116 (review thread, `tests/driver/engine-fixtures/rig.ts`, resolve)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: After the fix was pushed, R1 confirmed `createScriptedEngine` was gone and both rigs import `createEngine`, then threw an error as the first statement of `createEngine` in a throwaway tree and watched 66 tests across both suites redden — proving the gate now has teeth — before resolving.
- tension: The reviewer's standard: reading that the rigs import the real root "is not proof that it executes", so it mutation-tested the claim.
- quote: "I mutation-tested it in a throwaway copy of the tree — `throw new Error(...)` as the first statement of `createEngine` … → 66 failed. This was the finding the other six depended on, and it holds."
- links: S9b-026
- flags: verification, measurement

### S9b-028 — R1 issued CHANGES REQUESTED as a plain comment because the panel shares the author's account
- source: PR #116 (issue comment, `[AGENT: R1] round 2 · CHANGES REQUESTED`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer posted its `changes_requested` verdict as an ordinary comment, noting `gh` refuses `--request-changes` because the review persona shares the PR author's GitHub account, and requested changes on two of seven threads (the `{who}` deferral and the recorder-half schema violation).
- tension: A mechanical constraint of running independent reviewer personas under one login — GitHub won't let an author request changes on their own PR — surfaced and worked around in the open, exposing the seams of the "independent panel" fiction.
- quote: "(Posted as a comment: `gh` refuses `--request-changes` because the panel shares the PR author's account. Verdict is `changes_requested`.)"
- links: S9b-045
- flags: boundary, anomaly

### S9b-029 — R1: a Call-1 fallback was byte-identical to a real judgment in the delta journal
- source: PR #116 (review thread, `src/engine/index.ts`, journal cause)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: The reviewer showed that when Call 1 failed and the engine substituted the default stance, the delta journal stamped the same `cause` a player-chosen stance would get, so the metric stage "cannot tell 'the model judged' from 'the model never answered and the engine substituted'" — and the string `fallback:call1` appeared nowhere in `src/`, so 876 tests never looked.
- tension: The journal — which the spec calls "the basis of attributability" — lied about whether the LLM had answered, on exactly the runs a measurement program most needs to distinguish.
- quote: "The metric stage / report viewer reading `run-record.beats[].deltas` cannot tell 'the model judged' from 'the model never answered and the engine substituted'. … the journal — the artefact §2.1 calls 'the basis of attributability' — lies."
- flags: failure, boundary, measurement

### S9b-030 — R1: an ok-200 with no `stance` silently became the default stance, uncounted — recorder half stayed open a round
- source: PR #116 (review thread, `src/driver/live-driver.ts`, rounds 1–2)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: The reviewer showed a parseable 200 lacking `stance` collapsed into the default with no fallback event and nothing in `fallbacks[]`; the Lead fixed the driver half but the recorder half stayed open — R1 proved that on the same input a full 19-beat run with seven correctly-recorded fallbacks then produced 7 schema violations and no artifact at all, because the recorder wrote `undefined` into `beats[].stance`.
- tension: The fix made the failure visible (progress) but on the same input destroyed the whole run artifact; the reviewer held the thread until the recorder wrote what the engine actually did.
- quote: "the end state on this input is: **a complete 19-beat run, seven correctly-recorded fallbacks, a correct `fallback:call1` journal — and no artifact on disk at all**, because of one field the engine could have supplied."
- flags: failure, reversal, boundary

### S9b-031 — R3: the driver recorded an `injected_blocks` treatment that never happened
- source: PR #116 (review thread, `tools/driver/run/bind.mjs`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The Data-integrity reviewer showed carry-over blocks were persisted, recorded as `injected_blocks`, and then dropped on the floor — never given to the block store or composer — so a stage-6 measurement grouping runs by `injected_blocks.length` would get a byte-identical control and treatment and attribute a null effect to the game mechanic.
- tension: "That is worse than a missing feature: it is a measurement that will confidently report the wrong answer" — the class of defect this whole mining exercise is meant to surface.
- quote: "A stage-6 measurement that groups runs by `injected_blocks.length` … reads a null effect, and attributes it to the game mechanic instead of to a driver that never wired the blocks in."
- flags: failure, boundary, measurement

### S9b-032 — R3: a run whose reporter never returned fabricated an empty report and wrote the invalid record to disk
- source: PR #116 (review thread, `tools/driver/run/record.mjs`, empty report)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer showed `calls.reportBody === null ? ''` turned "we never got a report" into "the report was empty" (illegal under `minLength:1`), and that without `--validate` the invalid record was written anyway; the ruling was that refusing loudly beats fabricating, because a fabricated record is indistinguishable at read time from a genuinely empty one.
- tension: "unmeasurable ≠ zero" — a corpus containing a fabricated record "is worse than a corpus missing a run, because the missing run is visible as an absence and the fabricated one is not."
- quote: "an illegal record that reads as 'the report was empty' corrupts the corpus in a way a missing run does not."
- flags: failure, boundary, fabrication

### S9b-033 — R3: running the gate silently overwrote the committed golden; nothing asserted its bytes
- source: PR #116 (review thread, `tools/tests/run-record.mjs`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer found the test invoked the CLI with no `--out`, so `npm run check` mutated the tracked `artifacts/runs/우는다리-fixture-r1.json` and never diffed against it, meaning the "golden" would silently follow any engine change; the fix pointed the test at a temp dir and added a compare-against-committed test that fails with the exact JSON path and regeneration command.
- tension: A committed reference sample that the gate rewrote instead of compared "is the opposite of what a committed artifact signals" — the calibration file for the whole measurement program was self-erasing.
- quote: "the committed record can change under any engine/composer/fixture edit and this suite stays green — the file simply becomes whatever the new code emits."
- flags: failure, boundary, measurement

### S9b-034 — R1: `{who}` substitution was an unwired dead seam; reviewer asked only for one line recording the deferral
- source: PR #116 (review thread, `src/engine/index.ts:180`, rounds 1–3)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer found a spec paragraph, a schema, a parameter, and the character data all in place for `{who}` substitution but nothing building the owner map, so the literal `{who}` would ship into a proxy-bound slot; the fix report was silent, R1 kept it open ("not fixed, not deferred, not mentioned"), and finally accepted a one-line deferral note in `discovery/e2.md` after verifying every factual claim in it.
- tension: "That is the shape a defect hides in for six months" — the reviewer explicitly did not ask for the feature, only that the deliberate gap be written down where the next reader will find it.
- quote: "**I am not asking for the feature.** … Either wire it … Or record the deferral … What it cannot stay is the current state — a spec paragraph, a schema, a parameter and the character data all in place, no wiring, and nothing written down."
- flags: boundary, ai-limit, decision

### S9b-035 — R2: the PR landed a second, structurally-identical `Species` declaration into a frozen glob it couldn't edit
- source: PR #116 (review thread, `src/shared/view-driver.ts`, rounds 1–3)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer flagged a duplicate `Species` union that `species.ts`'s own docstring said to delete the moment `view-driver.ts` landed — which this PR is the event that made true — then corrected its own round-1 severity claim by testing that `tsc` does catch the dangerous direction, and withdrew the fix request on finding both files were frozen globs; the resolution was a `discovery/` note recording that the precondition is spent.
- tension: A reviewer correcting its own overstated severity mid-thread ("I tested it instead of asserting it"), and settling for "recorded-not-fixed" because the only writable surface was a discovery note.
- quote: "the next person to read that docstring will be told to wait for a file that has already landed."
- flags: boundary, contradiction, reversal

### S9b-036 — R3: refusing beats fabricating, accepted here only because no shipped provider can reach it
- source: PR #116 (review thread, `tools/driver/run/record.mjs`, resolve)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Resolving the empty-report thread, R3 accepted a residual (the whole run is discarded on a Call-3 fallback, including the `fallbacks[]` that documents it) only because `PROVIDERS` is `{fixture}` and the throw is unreachable from any shipped invocation, and sized the real fix as a prerequisite of the first live-provider run.
- tension: The panel repeatedly accepts a known-wrong residual on the explicit condition that it becomes unacceptable "the day `--provider live` exists" — a deferral tied to a future capability, not waved through.
- quote: "the day `--provider live` exists, this stops being a residual and becomes silent data loss on exactly the runs worth studying."
- links: S9b-032
- flags: decision, boundary, measurement

### S9b-037 — R2: the A20 gate census asserted an invariant it did not hold; three gates ran in no CI job
- source: PR #116 (review thread, `tests/acceptance/gates.test.ts`, rounds 1–3)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer showed the "each gate was run and its result written down" census only `toContain`-ed command strings against a discovery doc (so it could read "not run" and stay green, and one prose line satisfied three checks), and that `npm run build`, `probe:selftest`, and the frozen-inputs check ran in no CI job; the resolution rewrote the docstring to "the record names each gate" and added the two missing CI steps.
- tension: A deliverable "whose entire claim is 'executable, not a review item'" asserted a guarantee it did not provide — and R2 corrected its own round-1 claim that `npm run build` "is not run anywhere" (it runs post-merge in `deploy.yml`, the workflow whose failure is a live-site outage).
- quote: "It proves the words were written, which is the failure mode the file says it prevents."
- flags: failure, boundary, measurement

### S9b-038 — R3 approved from the data-integrity lens while R1 requested changes on the same PR
- source: PR #116 (issue comments, R3 vs R1 round-2 verdicts)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: On the same commit, R3 (Data-integrity/Operator) posted "No blocking findings remain in my lens. Approving" while R1 (Correctness/Skeptical breaker) posted "CHANGES REQUESTED" on two threads and R2 (Domain-fidelity) resolved its threads recorded-not-fixed — three independent personas reaching three different dispositions.
- tension: The dynamic review panel's dispositions genuinely diverge: one seat approves, one requests changes, one accepts a documented residual, all on one PR — the disagreement is the mechanism working, not failing.
- quote: "No blocking findings remain in my lens. Approving from the data-integrity side" (R3) vs "Requesting changes on those two only." (R1)
- flags: panel-disagreement, boundary

### S9b-039 — The engine build's only reviewable output was Korean prose, posted in place of a screenshot
- source: PR #116 (issue comment, `[AGENT: Lead] What this run actually reads like`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Because nothing in the diff renders, the Lead posted the first 24 lines of a headless run's composed Korean output as the review surface, explaining that every real-content line came from authored data and every `고정 픽스처 …` line is a slot the LLM will fill — "the writing arrives when the proxy is deployed and the first real Bedrock call goes through — the next run."
- tension: A build with no UI substitutes a deterministic prose artifact for a demo screenshot, and is explicit that it proves plumbing, not writing quality — "what is proven here is that the **plumbing is deterministic and lands text in the right slots**, not that the writing is good."
- quote: "PRD §9 asks for this in place of a demo screenshot: nothing in this diff renders, so the only thing a human can review is the Korean prose the composed calls produce."
- flags: convention, boundary, measurement

### S9b-040 — The dashboard body carried the human's mid-run approval-gate constraints, dated and signed
- source: PR #110 (body, "게이트에서 확정된 구속 사항 (08-03, 민서)")
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The client-build dashboard body embedded a four-point block of binding constraints the human ("민서") fixed at the approval gate — persistence is sessionStorage not the PRD's stale "memory-only" line, placeholder fixtures must be marked, the e2e server is `npm run dev`, and no unit may touch `tsconfig.core.json`'s include — with the stale PRD line to be recorded in DISCOVERY.
- tension: This is the later-run steering mechanism: instead of a `[STEER]` comment, the human's real-time direction is baked into the dashboard body as dated, signed constraints, and one of them overrides the PRD ("PRD §1의 'memory-only' 줄은 **stale**이므로 따르지 않음").
- quote: "**persistence** — meta-state는 **sessionStorage** … PRD §1의 \"memory-only\" 줄은 **stale**이므로 따르지 않음."
- links: S9b-011, S9b-041
- flags: human-steers-running-pipeline, decision, reversal

### S9b-041 — The human drew a stop-line mid-run: everything past the segmenter was cut from this run
- source: PR #110 (body, "⚠ 이 런은 부분 런입니다 — segment.ts 정지선")
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The dashboard recorded that `src/shared/segment.ts` (owned by teammate 윤석) was absent from `origin/main`, so the decomposer split u2 into a segmenter-independent half and a segmenter-consuming half, and the human confirmed at the approval gate to exclude everything after that half from this run — 7 units in, 8 units behind the stop-line for a resume run — with the segmenter explicitly forbidden to be implemented/stubbed/mocked.
- tension: A human steering scope in real time around a missing teammate-owned file — cutting the run at a hard line rather than letting agents fill a seam they do not own.
- quote: "민서가 승인 게이트에서 **u2f 이후 전부를 이번 런에서 제외**하기로 확정했습니다. … 세그멘터는 **구현·스텁·목 금지** (권한은 윤석)."
- links: S9b-040
- flags: human-steers-running-pipeline, decision, boundary

### S9b-042 — The Capture agent misread a capture bug as a build divergence; the Lead corrected it, crediting the human's live-DOM measurement
- source: PR #110 (issue comment, `[AGENT: Lead] CORRECTION to the earlier [AGENT: Capture] tables`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The Capture agent's screenshot tables had documented black/missing shots as build divergence; the Lead corrected them as capture-side bugs (clock installed before goto, animation-freeze hiding tally rows as a false match, stale pre-unit checkpoints), confirmed by a manual real-clock boot by the human that showed all five windows mounting with fixture content.
- tension: An agent's automated evidence was wrong in a way that maligned the build, and it took a human's manual measurement plus a Lead correction to separate the harness defect from the artifact.
- quote: "The capture tables above **document a capture bug as if it were a build divergence.** They should not be read as evidence about the build."
- links: S9b-043
- flags: failure, human-override, measurement

### S9b-043 — The Lead retracted its own retraction: a `display:contents` mis-port hypothesis was withdrawn before it cost a search
- source: PR #110 (issue comment, `[AGENT: Lead] retraction on Finding 1`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Minutes after suggesting the window-shot failures might be a `display:contents` mis-port, the Lead withdrew the suggestion once the human measured the live DOM (every section had a real box and painted), reassigned the true cause to capture-harness timing, and recorded a legitimate workaround while ruling a second finding a genuine gap against a unit's charter.
- tension: A visible self-correction chain — hypothesis, human measurement, retraction "before it costs anyone a search" — distinguishing a real charter gap from a harness artifact in the open.
- quote: "My suggestion that the four `win-*` element-shot failures might be a `display:contents` mis-port was **wrong**, and I'm withdrawing it before it costs anyone a search."
- links: S9b-042
- flags: reversal, human-override, measurement

### S9b-044 — Mid-run rulings on test targeting were attributed to the human by name and date
- source: PR #110 (issue comment, "Also ruled (민서, 08-04) — C5 e2e target split")
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Inside the Lead correction, a ruling credited to the human split the e2e target: fixture-round acceptance runs against `npm run dev`, a separate preview smoke against `npm run preview`, and a demo-mode build was rejected because "fixture code in a shipped artifact is what inv 11 exists to prevent."
- tension: The steering record shows the human making fine-grained, dated calls about how the build is verified while the run is live — the "control surface" carrying human authorship inline.
- quote: "demo-mode build rejected — fixture code in a shipped artifact is what inv 11 exists to prevent."
- links: S9b-040
- flags: human-steers-running-pipeline, decision

### S9b-045 — The Lead flagged two commits added after the review panel signed off
- source: PR #116 (issue comment, "Two commits added after the review panel signed off")
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The Lead disclosed that after the panel signed off it added `5442558` (dropping 504 from the retry set, driven by the first-ever proxy deploy in #138 measuring real latencies) and `c9f4b07` (the suite "was not green" — `npm test` had been 2-failed since u1 because u0's empty-modules census was a scope guard later units were supposed to violate), stating "the approved diff is no longer the whole diff."
- tension: A post-approval honesty note that also confesses e10's acceptance criterion (a green full suite) "was reported green when it was not" — raising it rather than quietly making it true.
- quote: "**e10's acceptance criterion was a green full suite, and it was reported green when it was not.** Raising that rather than quietly making it true."
- links: S9b-028, S9b-046
- flags: failure, reversal, boundary

### S9b-046 — A standing spec/contract contradiction surfaced only when the proxy was first deployed and measured
- source: PR #116 (issue comment, `5442558` — 504 leaves the retry set)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: The first proxy deploy (#138) produced the latency measurement that engine spec §5 named as its retuning trigger, exposing that §5 said only hard validation failures trigger a re-call while call-contract §11 marked both 502 and 504 retryable; measured reporter latencies (6.8–10.0s) forced `MODEL_TIMEOUT_MS` 7s→15s, and a 7s pass that beat the clock "wrote 16 sentences where REPORT_GUIDANCE asks for 20–30 — it beat the clock by breaking the contract, not by being fast."
- tension: A cross-document contradiction that no test could catch until real Bedrock latencies arrived — resolved by keeping the spec (§5 right, §11 wrong) and revising both files in one commit so no window exists where code and spec disagree.
- quote: "A `504 bedrock_timeout` is not a validation failure — §5 was right and §11 was not."
- links: S9b-045
- flags: contradiction, measurement, decision

### S9b-047 — R2 (security) requested a stated decision on publishing test harnesses, not a silent side effect
- source: PR #33 (review thread, `demos/apothecary/vite.config.ts`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The reviewer found two rollup inputs shipped URL-parameter-driven e2e harness pages (with `window.__testClock`/`__testScript` hooks, including a `hold` state that freezes generation forever) into `dist/` next to the judged demo, and asked either to gate them behind the e2e flag or to state publishing them as a deliberate decision.
- tension: The reviewer explicitly separated "reduce the surface" from "prove an exploit" and insisted the outcome "should be a stated decision, not a side effect of two build-input lines."
- quote: "If publishing the harnesses is a deliberate choice … say so here with that reasoning and I'll resolve as 'won't do' — but it should be a stated decision, not a side effect."
- flags: boundary, security, decision

### S9b-048 — R1: a brand-new customer was invisible to every content invariant; a mutant kept the whole gate green
- source: PR #33 (review thread, `tests/data/content.test.ts`)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: The reviewer showed customer 3 (new content this run) never entered the list the balance suite iterates, so a data-only edit (`direct` cost 2→7 against a budget of 4) made the customer's second dialogue beat unreachable while 983/983 vitest and 101/101 playwright stayed green, and noted the tier-variant guard already used the merged-list pattern the cost invariants had not adopted.
- tension: "A brand-new customer that no balance invariant can see is exactly the kind of content the next tuning pass will break silently" — authored content outrunning the gates that guard it.
- quote: "The game is now broken in a way a player sees immediately … Not one assertion in either suite notices."
- flags: failure, boundary, measurement

### S9b-049 — R1: a quantised tier readout could not detect that observing spends patience — proven by mutation
- source: PR #33 (review thread, `e2e/conversation.spec.ts`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The reviewer showed a tier-equality assertion that replaced v1's deleted meter-sampling was insensitive to a 1-point spend, so a mutant making `observe` secretly cost 1 kept the whole gate green — including two tests whose names literally assert "without spending patience" — and traced a sibling substring-presence check certifying an insensitive replacement.
- tension: "Substring presence cannot tell a sensitive replacement from an insensitive one, and here it certified an insensitive one" — the same class the integrator had already had to fix once this run.
- quote: "Two tests whose names literally assert 'without spending patience' / 'for free' pass while observing spends patience on every press."
- flags: failure, boundary, measurement

### S9b-050 — R1: a load-flaky final-gate spec meant "110 playwright green" was a lucky sample, not a fact
- source: PR #33 (review thread, `e2e/full-loop.spec.ts`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The Skeptical-breaker showed the demo's headline end-to-end spec threw `Cannot fast-forward to the past` in 2 of 3 consecutive full-suite runs because `pauseClock` round-tripped a resumed fake clock; the fix made the pause forward-only, and R1 verified with a reverse mutant that reproduced the 2-red-in-3 signature, plus the datum that a single-spec stress run passed 8/8 and could not have caught it.
- tension: Under the loop-until-green protocol "a red here is indistinguishable from a real regression", so a race in the gate silently gambled the run's headline result on machine load.
- quote: "The PR's '110 playwright green' is a single lucky sample of that distribution, which is exactly why I do not take gate self-reports at face value."
- flags: failure, boundary, measurement

### S9b-051 — R3: the run's whole PoC beat (the door-idle wait) never happened at judge pace
- source: PR #33 (review thread, `src/app/index.ts`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The Operator-advocate measured that both async prefetches handed over to the bundled pack long before a human reached a door, so the door-idle waiting beat — the run's entire "can a slow LLM hide in the rhythm" thesis — was reachable only by rushing, and `07-waiting-beat.png` existed only through the fake clock; the fix gave the stub build a staged beat held on the injected clock.
- tension: "The Pages link and the 30–60s gameplay video cannot show the thing this run set out to prove" — the deployed path contradicted the PR body's own claim.
- quote: "A judge playing the link sees three customers arriving instantly … the exact opposite of the claim in the PR body."
- flags: failure, game-feel, boundary

### S9b-052 — R3: the forced handover ate the last line it triggered; the fix chose an affordance over a timer, on the record
- source: PR #33 (review thread, `src/screens/conversation/conversation.ts:467`, rounds 2–3)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: R3 kept a thread open after a partial fix, proving per-frame that six of twelve authored tier-3 lines lived only in a ~40ms window where a forced handover swapped phases mid-reveal; the Lead landed the reply on a proceed affordance rather than a timed hold, reasoning that a fixed hold "still races the reader" and that a clock hold would deadlock a fake-clock e2e spec.
- tension: A game-feel fix explicitly rejecting the reviewer's first-offered option (a timed hold) for the second (an affordance), with the timer-free choice defended as both pace-independent and load-bearing for the test harness.
- quote: "'his patience ran out' is the only outcome in the game the customer never gets to say out loud."
- flags: game-feel, reversal, decision

### S9b-053 — R3: three flat failures and a dead-stop ending were the taste left in a judge's mouth
- source: PR #33 (review thread, `data/fallback-npcs.json`)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: The Operator-advocate walked a plausible first attempt and found all three customers returned flat "no effect" notes with no near-miss tying the outcome to the clues uncovered, and a final frame with no affordance — "the demo doesn't end, it stops"; the Lead added a proportional near-miss and a closing beat, while being straight that the near-miss keys on the ingredient multiset, not on which clues were revealed.
- tension: The one honest reward loop (dig → understand → prescribe) was invisible at the only moment it should pay off, and the fix's own limit ("proportional to the ingredient half of the deduction, not to which clues were revealed") is stated rather than hidden.
- quote: "56 seconds in, the judge has read three 'no effect' notes and is looking at a static note with nothing to press. That is the taste left in their mouth when they go score the entry."
- flags: failure, game-feel, boundary

### S9b-054 — R2: turning a required `prompt` field optional silently weakened the asset-provenance guarantee
- source: PR #33 (review thread, `src/ai/contract.ts`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The reviewer flagged that relaxing the pre-existing required `prompt: string` to optional on a provided contract file bought no caller anything while quietly dropping the only machine-checkable image↔prompt tie that CLAUDE.md rule 5 (asset manifest provenance) exists for; the Lead restored it required.
- tension: A repo hard rule (every generated asset carries its prompt) had its compiler enforcement quietly removed by a signature relaxation on a file units were told to treat as given.
- quote: "`prompt` is the only machine-checkable tie between a generated image and the prompt that produced it — i.e. the provenance field CLAUDE.md rule 5 exists for."
- flags: boundary, reversal

### S9b-055 — R1: customer 1 and customer 3 wore a pixel-identical face; the fix's residual was stated plainly
- source: PR #33 (review thread, `src/app/roster.ts:151`)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: Two reviewers (R1 and R3) independently found a 2-entry portrait pool indexed over 3 slots collided so the third customer wore the first's face — visible in the PR's own stills — and that the required `Customer.portrait` field was dead data pointing at a nonexistent directory; the Lead wired the field and used a palette+mirror variant, disclosing that a genuinely new third sheet needs a human-run generator pass plus a manifest entry (rules 5/6) an agent cannot do.
- tension: An agent cannot generate a new asset in-run (it needs a human key and a manifest entry), so the "fix" is honestly the same base art re-paletted, and the residual — "it is still the same base art re-paletted and mirrored, not a new person" — is recorded, not papered over.
- quote: "A third *generated* sheet is not something this PR can add: the pack comes from `tools/asset-gen` (gpt-image-1, personal key, human-run) and every asset needs an `assets-manifest.json` entry."
- links: S9b-006
- flags: ai-limit, boundary, game-feel

### S9b-056 — R1: a non-finite `patienceCost` cleared the gate, survived the clamp as NaN, and froze the conversation
- source: PR #33 (review thread, `src/screens/conversation/conversation.ts:425`)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: The reviewer proved a `NaN` cost passed `isDialogueBeat` (which checked `typeof` only), survived the reducer's `Math.max(0, NaN)` clamp, then threw inside the click handler so the card stayed enabled and the beat froze permanently — two validators in the same run disagreeing about the same value, with nothing in the suite pinning it.
- tension: PRD §3-5 says degrade silently; this was "the opposite: a hard throw with no degrade", reachable through the documented renderer-facing gate the moment the frozen proxy is bypassed.
- quote: "Two validators in the same run disagree about the same value: `tierFor` treats non-finite as fatal, `isDialogueBeat` waves it through into the arithmetic that feeds `tierFor`."
- flags: failure, boundary

### S9b-057 — R2: combat never armed the INV-3 resolvability check the council half honoured — an asymmetric seam
- source: PR #68 (review thread, `src/combat/turn.ts`)
- date: 2026-07-26
- lanes: 1 AI-in-the-game
- event: The reviewer showed combat passed no `ValidationCtx`, so every adapter call ran shape-only and a stub entry citing an unequipped card was served instead of falling through, while a live answer citing an id outside the unit's sheet was "valid" so the retry never fired — and noted the declared `decideAll(…, ctx?)` signature took one ctx for a whole party when `sheetIds` are per unit, "so the parameter cannot be used correctly as declared."
- tension: A display invariant (every chip resolves to a real sheet item) was enforced on the council path and silently absent on the combat path, leaving the proxy tool enum as the only live gate for INV-3.
- quote: "INV-3 is a client-side display invariant; it should not depend on the server being the only gate."
- flags: failure, boundary, contradiction

### S9b-058 — R3: the one branching choice showed two cards with identical copy
- source: PR #68 (review thread, `src/screens/stage/walk.ts`)
- date: 2026-07-26
- lanes: 4 AI-as-creator
- event: The Operator-advocate found a single module-level `BRANCH_SENTENCE` printed under every fork card, so the run's only decision read "이 길로 간다." vs "이 길로 간다."; the Lead keyed a per-tile sentence off the destination kind so each card names its cost before it is pressed.
- tension: "This is the one moment in a 3–5 minute run where the player is asked to decide, and it is presented as 'unfinished screen'" — a content gap at the single interactive fork.
- quote: "A one-line differentiator here buys more perceived depth than any other single string in the demo."
- flags: game-feel, boundary

### S9b-059 — R3: the combat screen printed the personality as an essay above the fold, pre-empting the claim it was meant to prove
- source: PR #68 (review thread, `src/screens/combat/screen.ts`)
- date: 2026-07-26
- lanes: 1 AI-in-the-game
- event: The reviewer showed ~66% of the opening frame was static persona/stat prose with no goal statement and no numeric HP anywhere, so must-prove 2 (personality reads from behaviour) was pre-empted by printing the personality as prose, and the one thing a judge needs in 30 seconds — what am I looking at, what is at stake — was never said; the Lead added a premise line, made sheets on-demand, and surfaced HP/gauge numbers.
- tension: "Even a working run cannot demonstrate the claim: a judge who already read '겁이 많다' cannot be surprised by 피오나 hanging back" — the layout defeated the demo's central bet.
- quote: "the screen pre-empts that by printing the personality as an essay above the fold — so even a working run cannot demonstrate the claim."
- flags: failure, game-feel, boundary

### S9b-060 — R1: a bucket-id written where the stance-id belonged collapsed two player judgments into one attribution
- source: PR #116 (review thread, `src/engine/beat/driver.ts`)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: The reviewer showed the journal `cause` wrote the many-to-one `bucket.id` where spec §2.1 asks for the stance id, so two different player judgments sharing a bucket produced one attribution, and events landed as bare `t13` instead of `event:t13`, erasing the namespace — with the drift already visible in the committed artifact; the fix was verified by driving a two-stance bucket to confirm the collapse was gone, not merely renamed.
- tension: "§2.1's own rationale — 'a score or outcome you cannot explain is a bug' — is what this costs" — attributability, the artifact's whole purpose, was lossy in shipped engine code.
- quote: "Two different player judgments, one attribution."
- flags: failure, boundary, measurement

### S9b-061 — R2: EXPERIENCED and the timeline disagreed about the echo drop — a second, divergent log
- source: PR #116 (review thread, `src/engine/feed/experienced.ts`)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: The reviewer proved that on a script beat the two logs used different utterance contexts, so an NPC line equal to the gate utterance was kept on the timeline (minted, minable) and dropped from EXPERIENCED — making EXPERIENCED "a second log that differs from the timeline, and it differs by dropping player-visible material"; the fix carried each beat's own judgment so both paths classify identically, verified over the full 19-beat schedule with the adversary "turned up."
- tension: The contract's guarantee that a round's EXPERIENCED is reconstructible from the run record was violated in the exact direction §5's sentence is aimed at.
- quote: "`EXPERIENCED` is now a second log that differs from the timeline, and it differs by dropping player-visible material, which is the direction §5's sentence is aimed at."
- flags: failure, boundary

### S9b-062 — R1: a no-op flag write rendered its symptom twice; the fix was one line, verified with neighbours intact
- source: PR #116 (review thread, `src/engine/state/index.ts:158`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer showed the §2.3-1 "state did not move ⇒ no symptom" drop was applied to scalars only, so writing `true` onto an already-true flag told the player the seizure happened twice, and noted the shipped pack's authoring idiom (several actuators asserting one flag) put this one hardening pass away from live; the fix returned null on `before === after`, verified to keep the journal's record of the attempt and the neighbour symptom.
- tension: A per-entry vs per-type reasoning gap in symptom rendering, invisible to the datapack lint whose flag-reachability set is per-actuator.
- quote: "The player is told the seizure happened twice."
- flags: failure, boundary

### S9b-063 — R1: an archive index masqueraded as a run number, mislabelling every report after an abandoned run
- source: PR #116 (review thread, `src/runloop/run-loop.ts`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer showed `meta.archive[].run` was derived from the array index (`i+1`), which only holds if every started run also ended, so a page refresh mid-run — an ordinary path since `run_count` is persisted before the first beat — served run-3's report to the archive browser as run 2, corrupting mining provenance; accepted as a schema limit because `report_archive` is pinned to `string[]` in a frozen schema, with the provenance chain independently broken elsewhere.
- tension: An abandonment path "is ordinary, not exotic", and the honest fix needed a frozen-schema revision, so the reviewer accepted a labelled residual only after confirming the dangerous downstream chain was already severed.
- quote: "`run-3`'s report is served to the archive browser as **run 2** … mined as material from a run that never produced it."
- flags: failure, boundary, measurement

### S9b-064 — R3: a shipped CLI imported its schema walker from the test tree — a layering inversion
- source: PR #116 (review thread, `tools/driver/run/validate.mjs`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: After first stress-testing the walker with 27 malformed records and confirming it was not vacuous, the reviewer objected that the shipped `drive-run.mjs --validate` imported from `tests/`, so a pruned checkout (the measurement program's likely shape) failed with a bare module-not-found; the fix moved the walker to `tools/driver/run/` so one definition ships, verified on a `cp -R src tools data` prune.
- tension: CLAUDE.md's four-roots rule draws lines around `src/`/`tools/`/`proxy/`/`authoring/`, and "`tests/` is not one of the four, and this is the only production import that crosses into it" — a boundary the datapack A7 guard actually *blessed*.
- quote: "The decision not to hand-roll a second one was correct. The **home** is what I object to, and it is not cosmetic."
- flags: boundary, architecture

### S9b-065 — R2: a third, narrower id-grammar declaration would have failed on ids the shipped minter accepts
- source: PR #116 (review thread, `tests/acceptance/ids.test.ts`)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reviewer showed an acceptance test hand-copied the id grammar as `\d{2}` when the single minting site documents `\d{2,}` (a 100th sentence mints `f100`, not a collision), so §8-8 would go red on a well-formed id "for the opposite reason to the one it was written for"; the fix imported the pattern from the minter and pinned it with `ID_PATTERN.source` toContain `{2,}`.
- tension: The repo's own convention is "consume-don't-restate" the grammar, and this file restated it — differently — a recurring drift shape across three separate declarations flagged in this one PR (Species, id grammar, bucket census).
- quote: "§8-8 would then go red on an id the shipped engine considers well-formed — the criterion failing for the opposite reason to the one it was written for."
- flags: boundary, contradiction

---

## Manual/human PRs

Coverage (manual/human half): DEEP-MINED (body + issue comments + review submissions + inline
review threads) — #3, #7, #11, #12, #15, #28, #46, #48, #49, #54, #85, #87, #88, #89, #91, #92,
#93, #95, #96, #97, #100, #101, #102, #103, #104, #105, #106, #108, #109, #114, #138, #139.
SAMPLED (body only, to characterize the zero-activity manual-PR convention) — #1, #8, #9, #13, #29.
SKIPPED (zero-activity manual PRs, bodies unread) — #2, #5, #6, #14. NOT MINED (done by sibling
S9a) — #4, #10, #16, #90, #99. Manual-PR convention: docs/chores/planning/infra authored in
single Claude-Code or by-hand sessions under a personal login; bodies heavily structured
(What/Why/Verification/Merge-order/explicit "Not in scope"), almost always footer-tagged "🤖
Generated with Claude Code"; the human's own hand shows up in the reversals, the "human must
decide this" flags, and the review rebuttals — not in the drafting.

### S9b-101 — CLAUDE.md and the real competition rules land together
- source: PR #1 (body)
- date: 2026-07-20
- lanes: 3 AI-in-planning
- event: The first substantive PR replaced a setup placeholder with the real 5 deliverables and created CLAUDE.md — the permanent-rules charter (git identity, no main-history rewrite, deployable main, asset manifest, no secrets, membrane rule, proxy backend, balance-as-data, judge-experience target).
- tension: The rulebook the whole project (and every later agent) is bound by was written by hand up front, before any game existed; "how we orchestrate AI is judged" made the charter itself a deliverable.
- flags: boundary

### S9b-102 — Meta-docs split: CLAUDE.md = permanent rules, status.md = mutable state
- source: PR #8 (body)
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: A docs-only restructure removed the stale "Current phase" narrative from CLAUDE.md and created docs/status.md as "single source of truth for mutable state," leaving CLAUDE.md with only permanent rules plus a pointer.
- tension: Deliberate separation so that the charter changes only at phase transitions while day-to-day state churns freely — a division designed so agents reading CLAUDE.md never act on stale phase info.
- flags: boundary

### S9b-103 — Six concepts narrowed to three tracks
- source: PR #9 (body)
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: The 2026-07-22 concept-review meeting minutes recorded narrowing 6 game concepts to 3 integrated tracks (약사+대장장이 / 낙서 생명 연구소+자리좀봐주세요 / 에이전트 로그라이크+오토배틀러).
- tension: First selection gate; two concepts each get absorbed rather than killed outright, setting up the later absorption PRs (#12).
- quote: "6개 → 3개 통합 트랙 … 으로 좁힌 결정 사항 기록"
- flags: decision

### S9b-104 — Apothecary demo PRD: LLM fully stubbed, verification pre-specified
- source: PR #13 (body)
- date: 2026-07-23
- lanes: 3 AI-in-planning
- event: The apothecary demo PRD (five-phase customer loop, card-feel, data-driven from JSON) was written with the LLM "fully stubbed," and verification pinned to vitest (state machine) + Playwright per-screen slices with full-loop e2e gating only the final unit.
- tension: Human authored the exact contract and test regime the super-pipeline run would build against — LLM deferred entirely so the demo shell could be validated deterministically first.
- flags: boundary

### S9b-105 — demo_publish harness step was built, not cut
- source: PR #13 (body)
- date: 2026-07-23
- lanes: 2 AI-building-the-game
- event: The harness-session handoff recorded that the wave-end demo_publish step was "built (not cut), pure extension, installed live," enabled by the run via workflow args `"demo_publish": { "dir": "demos/apothecary" }`.
- tension: A capability was added to the super-pipeline harness (separate repo) as a pure extension rather than dropped — a small human/harness boundary decision recorded in the handoff.
- flags: boundary

### S9b-106 — Doodle Life cut; final candidates narrowed to two; Agent Arena simplified
- source: PR #29 (body)
- date: 2026-07-24
- lanes: 3 AI-in-planning
- event: The 07-24 demo mid-check minutes cut the Doodle Life track, narrowed to Apothecary + Agent Arena, and simplified Agent Arena from real MCP/Context reproduction to "a game about building an Agent" (augment cards, auto-advance branching, turn-based spectating).
- tension: Second selection gate under explicit schedule risk; scope of the AI mechanic deliberately shrunk to what the team could ship.
- quote: "Agent Arena는 실제 MCP/Context 재현 대신 \"Agent를 만드는 게임\"으로 단순화"
- flags: decision, pivot

### S9b-107 — Meeting minutes cleaned by hand: speaker mapping fixed from git authorship
- source: PR #29 (body)
- date: 2026-07-24
- lanes: 3 AI-in-planning
- event: The minutes-consolidation PR merged two overlapping draft versions into one, removed timestamps, fixed a phantom §8, and corrected the §5 speaker mapping "git authorship 기준으로" (Doodle Life/backend = 윤석, Apothecary/PRD = 민서).
- tension: AI-drafted minutes required a hand pass that used git authorship as ground truth to attribute who said what — an accuracy correction only a human/repo-aware step could make.
- flags: human-override

### S9b-108 — Paper test: "no wrong answer — outcomes are consequences, never fail-stamps"
- source: PR #3 (body §paper-test-shop-concepts-report)
- date: 2026-07-21
- lanes: 4 AI-as-creator
- event: The hand-played paper-prototype report (11 customers + 3 adversarial edge plays) passed all three hypotheses (LLM customer authoring, loop fun conditional on crafting depth, judgment fairness) and recorded a key correction.
- tension: A design law surfaced by physical play-testing, not by the model: the LLM-judged outcome must never be a "wrong answer."
- quote: "no \"wrong answer\" — outcomes are consequences, never fail-stamps."
- flags: decision, measurement

### S9b-109 — Concept-doc template written as an agent-executable writing guide
- source: PR #3 (body §game-concept-template)
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: A self-contained 10-section concept template was authored "so every concept proposal follows the same … structure for apples-to-apples comparison," with the apothecary doc as its reference implementation.
- tension: The human built a reusable scaffold for agents to fill, standardizing later concept docs rather than writing each freehand.
- flags: boundary

### S9b-110 — Party differentiation is build, not base model (agent-arena)
- source: PR #11 (review thread docs/agent-arena-brief.md, resolved)
- date: 2026-07-23
- lanes: 3 AI-in-planning
- event: 윤석 worried the strongest model (Fable) would "just win everything" if party members were different base models; 민서 rebutted that all party members share one base model and differ only by build (prompt cards / Skills / MCP), so "최강 모델이 다 이긴다" cannot structurally arise; difficulty is level-designed encounters. Restructured into a 3-layer doc (§4, abe3641).
- tension: A design-integrity dispute in the review thread — power axis relocated from model tier to player build, resolved in the doc.
- quote: "파티원의 차별화 축은 베이스 모델이 아니라 빌드야."
- flags: decision, boundary

### S9b-111 — Blacksmith absorbed into apothecary with explicit keep/drop criteria
- source: PR #12 (body)
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: Executed the 07-22 decision by keeping 3 blacksmith ideas (단골 아크, [정석]/[실험] declared-risk crafting, 연쇄 결과) and dropping 3 (경제/능력 격차, 세계 채널 확장, 흑막 루트), each with a stated reason, on the criterion "doesn't re-inflate the scope that forced the split."
- tension: Merge-not-kill executed against explicit criteria; scope discipline was the governing rule.
- flags: decision

### S9b-112 — Honest gap flagged: multi-visit continuity was never validated
- source: PR #12 (body §Honest gap)
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: The PR recorded that blacksmith's Test 2 (H4 multi-visit continuity) was abandoned, so open-ended AI campaign continuity is unvalidated — which is why §5.8 restricts arcs to pre-authored 2–4 visit 단막.
- tension: An unvalidated assumption was constrained rather than assumed away, and the gap was written into 부록 A rather than hidden.
- flags: ai-limit, boundary

### S9b-113 — Agent-arena LLM backend: membrane and no-secrets satisfied by construction
- source: PR #15 (body; review @alstjgg 2026-07-25)
- date: 2026-07-25
- lanes: 1 AI-in-the-game
- event: The verified LLM operating layer exposed only card IDs; keys, model names, prompts stayed server-owned, with model output constrained to allowedActions + deterministic fallback. Independent review checked out the branch: 146/146 keyless tests, full lifecycle over real HTTP, live-verified both providers (~$0.06).
- tension: Human reviewer independently reproduced the run before approving — "verified working," and confirmed the architecture "must never be exposed directly to browsers."
- quote: "Satisfies the membrane rule and the no-secrets rule by construction"
- flags: measurement, boundary

### S9b-114 — #15 closed as superseded, then reopened and merged to preserve the work
- source: PR #15 (issue comments @C9Boom7 2026-07-25 03:56 → 04:02)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: After the 07-25 architecture decision (stateless thin Lambda/Bedrock proxy), 윤석 deliberately closed #15 ("의도적으로 close합니다"), then six minutes later reversed: "결정 변경: … PR을 다시 열어 main에 병합합니다 … preserved/superseded reference work로 취급."
- tension: A live reversal within minutes — kill vs. preserve — resolved toward preserving verified/implementation history as reference, since commit history is a deliverable.
- quote: "결정 변경: 이 PR의 구현을 현재 배포 아키텍처로 채택하는 것은 아니지만 … PR을 다시 열어 main에 병합합니다."
- flags: reversal

### S9b-115 — Salvage list: what survives an abandoned architecture
- source: PR #15 (issue comment @alstjgg 2026-07-25 03:51)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: On superseding #15, the human enumerated exactly what feeds forward into the Lambda build (closed-action validation, turn-contract shapes, fail-closed config validation, non-root Docker pattern, live-smoke discipline) and voided the handoff's now-dead "Next work" (BFF, AWS host, provider alias).
- tension: Explicit boundary between discarded deployment model and salvaged principles — decision recorded rather than left implicit.
- flags: decision, boundary

### S9b-116 — Spec-by-example: "are we imagining the same game?"
- source: PR #28 (body)
- date: 2026-07-24
- lanes: 3 AI-in-planning
- event: A spec-by-example doc was layered on the integration brief because the brief alone "couldn't confirm we imagine the same game" — it fixed shape with real values (full prompt text, cards, API schema, turn walkthrough); numbers were pre-balancing, only form was up for agreement.
- tension: Human chose to agree on concrete form before PRD, treating shape-alignment (not numbers) as the review target.
- quote: "여기 수치는 전부 밸런싱 전 — 형태가 합의 대상이다."
- flags: boundary

### S9b-117 — Context gauge modeled as controlled hallucination via noise injection
- source: PR #28 (body §1)
- date: 2026-07-24
- lanes: 1 AI-in-the-game
- event: The spec defined a "시뮬레이션된 컨텍스트 게이지" where at 70%+ noise is injected into the situation summary — "통제된 환각" — as the game's answer to LLM context stress.
- tension: A model failure mode (hallucination) was turned into a deliberate, controlled game mechanic rather than fought.
- flags: decision

### S9b-118 — Prompt injection gamified as a monster theme
- source: PR #28 (body §5)
- date: 2026-07-24
- lanes: 1 AI-in-the-game
- event: Among open items, monsters themed as "프롬프트 임프 = 프롬프트 인젝션의 게임화"; jailbreak tiles frame the gatekeeper prompt as a difficulty knob. Reviewer added wishes in threads (환각상태의 모데카이, MCP 개념 이식, 토큰=스태미너).
- tension: The membrane rule's later carve-out (injection is performed by the player's agent, not player text) has its seed here as a game element.
- flags: boundary

### S9b-119 — #46 repositioned mid-flight: "not the deploy path, not deploy-ready"
- source: PR #46 (body blockquote; review @C9Boom7 05:36 CHANGES; @alstjgg 07:31)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: 윤석's architecture review said the standalone node:http + Docker server and direct vendor-key calls "배포 경계가 맞지 않습니다" with the adopted Lambda+Bedrock direction. 민서 accepted every point and rewrote title/body/headers to recast the PR as a handlers + adapter-seam PR, marking standalone "LOCAL FALLBACK ONLY — NOT the deployment target."
- tension: A feature PR presenting itself as the live-AI path was demoted to reusable seam under review pressure; author accepted the boundary wholesale.
- quote: "방향 전부 수용하고, PR을 \"배포 경로\"가 아니라 핸들러 + adapter seam PR로 재정의했습니다"
- flags: reversal, human-override

### S9b-120 — Handlers extracted verbatim so the live path is unchanged by construction
- source: PR #46 (body)
- date: 2026-07-25
- lanes: 2 AI-building-the-game
- event: Prompt composition + vendor calls were pulled out of ai-proxy.mjs "verbatim" into transport-agnostic (request)→{status,body} handlers, shared by dev proxy and standalone, and named as the shape llm-layer phase 1 ports into the Lambda wrapper; "Live path unchanged by construction (handlers moved verbatim)."
- tension: Refactor safety argued structurally (verbatim move) rather than by test coverage of behavior change.
- flags: boundary

### S9b-121 — Backend simplified to a session-less thin turn-decision proxy
- source: PR #48 (body)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: 윤석's research note concluded against a standing agent server in favor of a "세션 없는 얇은 턴-결정 프록시" (API Gateway → Lambda → Bedrock Runtime), with deploy comparison, minimal API contract, Bedrock Converse usage, latency/cost targets, public-demo guards, and a Haiku 4.5 vs Nova 2 Lite benchmark.
- tension: The runtime architecture direction was set by a human research note (off-repo investigation folded in), not by an agent build.
- flags: decision

### S9b-122 — Two independent tracks converging on one design read as strong evidence
- source: PR #48 (review @alstjgg 2026-07-25 03:44)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: Reviewing #48 against live API references, the human verified pricing/caching/inference-profile claims and noted the stateless proxy "independently converges on the same shape the apothecary track already uses … two tracks arriving at one design is strong evidence it's right."
- tension: Convergence of two separate design efforts used as a validity argument; caveat raised that #48's premise overlooked #15 ("research was done from main").
- quote: "two tracks arriving at one design is strong evidence it's right."
- flags: measurement, decision

### S9b-123 — styleBible frozen to candidate A verbatim; key-owner runs the generator
- source: PR #49 (body)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: The darkest-context asset generator froze styleBible to candidate A verbatim (provisional→frozen) and refuses to run if style is unfrozen; the human wrote the script but handed execution to the key owner ("실행 요청 (키 소유자)"), with raw outputs banned from commits and provenance attached as PR comments.
- tension: Human/agent-vs-key-holder boundary: generation is gated on a frozen style and a human with the API key; the script "스크립트는 수정 없이 실행만."
- flags: boundary, cost

### S9b-124 — llm-layer handoff: 11 binding decisions, real-time image generation cut
- source: PR #54 (body)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: The implementation handoff recorded verified AWS/Bedrock account state, 11 binding decisions, and a 5-phase build plan, plus a status.md decision-log entry killing real-time image generation (runtime is Bedrock-only, dialogue text only; NPC assets pre-generated and manifested).
- tension: A whole AI capability (runtime portrait generation) was cut project-wide and recorded before implementation started, so sessions wouldn't re-derive it.
- flags: decision

### S9b-125 — Review catches MODEL_ID vs single-profile IAM conflict; changes requested
- source: PR #54 (review @C9Boom7 CHANGES_REQUESTED 07:09; @alstjgg response 07:22)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: 윤석 flagged that env-var MODEL_ID switching conflicts with an IAM role scoped to one inference profile (Nova benchmark would fail AccessDenied), plus strict-schema cold-compilation latency risk and an understated Phase 4. 민서 resolved all: Decision 7 = template-owned allowlist of both profiles during benchmark then narrow to winner; Decision 12 = mandatory warm-up call with production schema; dynamic IDs kept out of schema enums.
- tension: A subtle infra correctness bug (IAM scope vs config-flip assumption) caught in review before any deploy; the only CHANGES_REQUESTED among these manual PRs.
- quote: "Changing models is therefore not purely an environment-variable operation; the IAM resource allowlist must also permit the target model."
- flags: failure, human-override, measurement

### S9b-126 — Personal AWS account details trimmed from the public handoff
- source: PR #54 (review @C9Boom7 non-blocking; response @alstjgg)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: Reviewer noted account IDs aren't secrets but personal payment method, root MFA/billing, permission-set assignments, legacy IAM username, and corporate-profile specifics don't belong in a public doc; author removed them and generalized the operational warning to "always pass --profile nhn-game."
- tension: A privacy/no-secrets boundary on a committed doc — the generic warning survives, the personal specifics don't.
- flags: boundary

### S9b-127 — DDAY enters as a new track candidate; approve-to-preserve
- source: PR #85 (body; issue comment @alstjgg 2026-07-28)
- date: 2026-07-28
- lanes: 3 AI-in-planning
- event: DDAY simulation entered as a new track candidate (concept + paper tests v1/v2). After concept confirmation, the author asked for approval purely to preserve the material as a legacy demo: "자료 보존을 위해서 PR Approve해주시면 감사하겠습니다."
- tension: PR approval used as an archival/preservation act, not a merge gate — history-as-deliverable again.
- flags: boundary

### S9b-128 — Reviewer wonders if the blind test already reveals the answer
- source: PR #85 (review thread V3-blind-questionnaire.md, unresolved)
- date: 2026-07-28
- lanes: 4 AI-as-creator
- event: On a blind questionnaire run, 윤석 commented "다 쓰고 보긴 한건데 이거 정답 아닌가요??" — questioning whether the paper test leaked its own answer.
- tension: Play-tester doubt that the mechanism-validation instrument was not actually blind — a seed of the later rigor around blind coding and controls.
- flags: measurement

### S9b-129 — Planning restructure via pure git-mv, 100% rename detection, links fixed
- source: PR #87 (body)
- date: 2026-07-28
- lanes: 3 AI-in-planning
- event: 139 planning files moved into planning/ as "순수 git mv 커밋으로 분리 — 139건 전부 100% rename 감지 (히스토리 보존)"; markdown relative-link check went from 64 broken to 0.
- tension: History preservation treated as a hard constraint (commit history is a deliverable), so moves were isolated as pure renames and links audited to zero.
- flags: boundary

### S9b-130 — #87 merged into a dead branch and never reached main; re-applied by cherry-pick
- source: PR #88 (body)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: #87 had based on concept/dday-simulation (#85's head) instead of main; since #85 was already squash-merged, "#87의 내용은 죽은 브랜치에만 남고 main에는 전혀 반영되지 않았다." #88 cherry-picked #87's squash commit onto main, resolving 3 conflicts caused by #81 (Lambda deploy) landing first.
- tension: A base-branch mistake silently dropped an entire merged PR from main; caught and repaired, with the conflict-resolution principle stated: "내용은 main의 최신본, 위치는 #87의 규칙."
- quote: "#87의 내용은 죽은 브랜치에만 남고 main에는 전혀 반영되지 않았다."
- flags: failure, reversal

### S9b-131 — Archived Lambda deploy job forced to workflow_dispatch to prevent accidental redeploy
- source: PR #89 (body §커밋 4; issue comment @C9Boom7)
- date: 2026-07-29
- lanes: 2 AI-building-the-game
- event: Archiving the apothecary LLM layer to services/, the deploy job was changed "workflow_dispatch 수동 전용으로 변경 — 아카이브 문서/링크 수정이 프로덕션 스택을 자동 재배포하는 사고 방지" while verify keeps running on PR/push. Reviewer noted leftover llm-layer.yml filename references in archive docs (non-blocker).
- tension: A live production stack was defused (auto-deploy → manual) precisely because doc edits could otherwise redeploy it — a safety boundary on infra.
- flags: boundary, failure

### S9b-132 — agent-arena-api kept in services/, not moved to planning/
- source: PR #89 (body §보류)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: The human declined to move services/agent-arena-api into the planning/ archive because it is working code with CI/SAM deploy, and CLAUDE.md/README already define services/ as the "superseded reference implementation" store: "코드베이스를 문서 보관소인 planning/으로 옮기면 오히려 규칙이 깨진다."
- tension: Boundary between "code archive" (services/) and "doc archive" (planning/) enforced against a tidy-everything impulse.
- flags: boundary

### S9b-133 — DDAY design doc written to modern-GDD research conventions
- source: PR #91 (body §작성 기준)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: The formal DDAY GDD was structured after researched industry GDD consensus (one-page vision first, core-loop→systems order, tables/diagrams over prose, living document), each principle citing a source (Codecks, GitBook, Stone Librande GDC 2010).
- tension: Doc form chosen from external research rather than invented; "긴 문서는 아무도 안 읽는다" as an explicit design constraint.
- flags: decision

### S9b-134 — Work order reversed: agent spec (WS A) before scenario trimming (WS B)
- source: PR #91 (body §새로 결정된 것 #1)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: The GDD reordered workstreams so agent spec precedes scenario adjustment, reasoning that scenario trimming's goal is narrowing agent interaction to clear outcomes, not cutting counts: "줄일 것은 개수가 아니라 모호함이므로"; the reduction numbers (인물 10·진실 4·게이트 6) were demoted from confirmed to baseline.
- tension: A sequencing decision grounded in a reason (ambiguity, not volume, is the target) rather than the choice alone.
- quote: "줄일 것은 개수가 아니라 모호함이므로, 무엇이 에이전트를 제어하는지 … 를 먼저 확인하고 그 결과를 자로 삼아 시나리오를 재단한다."
- flags: decision, pivot

### S9b-135 — Darkest-context code not inherited; only the design principle carries
- source: PR #91 (body §새로 결정된 것 #6)
- date: 2026-07-29
- lanes: 2 AI-building-the-game
- event: The GDD decided "darkest-context 코드는 승계하지 않는다 — 설계 원칙(\"의도만 LLM, 실행은 엔진\")만 승계하고 LLM Layer는 새로 구현," removing the concept §10 risk from the register.
- tension: Explicit human boundary between reusing principles vs reusing an earlier demo's code; a clean-rebuild decision.
- flags: decision, boundary

### S9b-136 — Architecture spec declared the single narrowable-only SSOT
- source: PR #92 (body §아키텍처 스펙)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: The DDAY architecture spec fixed the core tech as SSOT ("다른 산출물은 이걸 좁힐 수 없다"): gate graph with braid topology, attributable run score with no-intervention baseline anchoring, a fully deterministic state engine where "자유 텍스트는 상태 권한이 없다," a 4-call inventory, supply-chain wiring W1–W4, and invariants I1–I12.
- tension: The membrane made structural — free text has no state authority — and downstream docs may not narrow the spec.
- quote: "액추에이터 화이트리스트 2종 … 만 상태를 움직이고, 자유 텍스트는 상태 권한이 없다."
- flags: boundary, decision

### S9b-137 — Placebo control made mandatory for mechanism credit
- source: PR #92 (body §메커니즘 딥테스트 계획)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: The deep-test plan separated channel (where manipulation enters) from effect (reachability), and required a placebo arm — same axis vocabulary, only referent misaligned — where "라이브 팔이 움직이고 플라시보 팔이 안 움직여야 크레딧."
- tension: Experimental rigor imported into game-mechanism validation; a mechanism gets no credit without the placebo firing correctly.
- flags: measurement

### S9b-138 — Run-integrity protocol born from the 2026-07-28 fabrication incident
- source: PR #92 (body §메커니즘 딥테스트 계획)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: A run-integrity protocol (§3) was written as a response to "2026-07-28 날조 사건": enforced not by prompt instruction but by execution environment — `tools: []`, per-call `tool_uses` verification, author≠caller, raw preservation.
- tension: A prior AI fabrication failure produced a rule that isolation must be a transport property, not a request; "프롬프트 지시가 아니라 실행 환경으로 강제."
- quote: "런 무결성 프로토콜(§3) — 2026-07-28 날조 사건에서 나온 규칙."
- flags: failure, boundary

### S9b-139 — Tier A vs Tier B: an isolated 3/3 mechanism failed 5/5 in a full run
- source: PR #92 (body §메커니즘 딥테스트 계획)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: The plan split "모델이 반응하는가" (Tier A, texture only) from "우리 게임에서 작동하는가" (Tier B, requiring reachability audit / in-situ / blind coding / discoverability), citing that "이전 시리즈에서 격리 3/3 통과 메커니즘이 풀런 첫 게이트에서 5/5 실패했다."
- tension: Hard evidence that isolated success doesn't transfer to gameplay — gate eligibility requires Tier B, and Tier A alone is discounted.
- quote: "격리 3/3 통과 메커니즘이 풀런 첫 게이트에서 5/5 실패했다."
- flags: failure, measurement

### S9b-140 — Pipeline self-calibration: run a known-fake mechanism to catch a broken pipeline
- source: PR #92 (body §메커니즘 딥테스트 계획)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: The plan mandated pushing a negative-control mechanism believed fake through the whole pipeline: "\"verified\"가 나오면 파이프라인이 고장난 것이고 그때까지의 모든 판정이 의심된다."
- tension: A meta-check on the measurement apparatus itself — the pipeline is distrusted unless its negative control fails.
- flags: measurement

### S9b-141 — A human judges each run; default is texture when ambiguous
- source: PR #92 (body §메커니즘 딥테스트 계획)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: §9 fixed that "사람이 판정한다" via pre-registration sheets (drop condition mandatory), verdict cards carrying raw sequences and N (not ratios), and a gate/texture/drop trichotomy where "모호하면 기본값은 texture."
- tension: Human-kept judgment boundary — the final verdict on whether a mechanism works is a person's, biased conservative.
- quote: "gate/texture/drop 3택, 모호하면 기본값은 texture."
- flags: boundary, human-override

### S9b-142 — Temperament had leaked into a player-facing mechanic; pulled back and locked as I13
- source: PR #92 (issue comment @C9Boom7 12:45; @alstjgg 14:28; review thread resolved)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: 윤석 found four spots making temperament (which is confirmed hidden and immutable) player-selectable. 민서 removed the player-facing references, moved C-TEMP's validation to the agent-prompt (D) task, made temperament a byte-identical pre-registered fixture in probes, and recorded invariant I13 "so this drift cannot recur silently."
- tension: A confirmed design law (hidden temperament) had silently drifted into the spec; the fix was an invariant that makes the drift a mechanical failure.
- flags: reversal, boundary

### S9b-143 — Legacy sim-field agents removed; tools:[] was not being honored
- source: PR #92 (issue comment @alstjgg 13:23)
- date: 2026-07-29
- lanes: 2 AI-building-the-game
- event: Building the test runner exposed that the agent registry reported tools:[] definitions "as holding all tools, i.e. the access path behind the 2026-07-28 contamination incident." Fix: a zero-dependency Node runner making direct Messages API calls granted exactly one tool (the output schema), so "Isolation becomes a property of the transport, not a frontmatter setting." 11 legacy sim-field agents were moved (not deleted) next to their runs.
- tension: The subagent harness's tool-isolation setting was silently ineffective — the concrete mechanism behind the fabrication incident — forcing a rewrite to environment-enforced isolation.
- quote: "Isolation becomes a property of the transport, not a frontmatter setting"
- flags: failure, ai-limit, boundary

### S9b-144 — Approval withdrawn when the PR changed from docs-only to executable code
- source: PR #92 (review @C9Boom7 APPROVED 12:56 → CHANGES_REQUESTED 16:26)
- date: 2026-07-29
- lanes: 2 AI-building-the-game
- event: 윤석 approved the docs-only PR at 12:56, then after 5 commits added ~900 lines of harness code, re-reviewed: "PR 성격이 문서 전용에서 실행 코드 포함으로 바뀌었으므로 승인을 물리고 다시 봅니다," filing blockers B1 (artifact check runs after paid calls — violates raw-preservation rule 4) and B2 (broken /poc-paper-test-terror command still names unresolvable sim-field agents — the exact contamination path).
- tension: Reviewer discipline: a changed PR nature re-opens review; the code was found to itself violate the raw-data-preservation rule it existed to enforce.
- quote: "PR 성격이 문서 전용에서 실행 코드 포함으로 바뀌었으므로 승인을 물리고 다시 봅니다."
- flags: reversal, human-override

### S9b-145 — Two SSOTs on main disagree on the player's editable surface (2 regions vs 7)
- source: PR #92 (review @C9Boom7 CHANGES §H3; issue comment @alstjgg 15:15 post-merge TODO)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: 윤석 flagged that #91's design doc §4.1 (7 player-editable regions incl. a 가설 gamble) and this spec §6.1 (2 regions, "그 외 도달 불가") conflict silently because they live in different files; "스펙은 스스로 … 좁힐 수 없다 선언한 상황에서 기획서는 좁힌 게 아니라 넓혔습니다." He judged the 7-region design better and recommended the spec absorb it. 민서 filed an 8-item post-merge reconciliation TODO.
- tension: Two living SSOTs on main diverging with no merge conflict to flag it — the most dangerous kind — with the resolution direction (spec absorbs the richer design) decided in-thread.
- quote: "기획서는 좁힌 게 아니라 넓혔습니다."
- flags: contradiction, boundary

### S9b-146 — Judgment schema flattened (breaking); the defect was sitting live on main
- source: PR #93 (body §Breaking)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: The judgment output schema flattened nested because/rejected objects after the model returned `because` as a string containing literal parameter markup; malformation was arm-correlated (0/20 with a block, 10/29 without), "which makes the two arms differently-filtered samples and voids the comparison outright." Flattening cut loss 47%→17% but the signature recurred on a flat field, so "the nesting diagnosis is withdrawn, not confirmed."
- tension: A live breaking defect on main plus an honest retraction — the fix helped but the diagnosis didn't hold, and the residual stays unexplained.
- quote: "the nesting diagnosis is withdrawn, not confirmed. The residual is unexplained and still arm-correlated"
- flags: failure, measurement

### S9b-147 — The finding: the stance set was the operative variable (p=0.00006)
- source: PR #93 (body §The finding; issue comment @alstjgg 04:57 full read)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: A fear block looked inert for three runs (baseline 8/10 → live 10/10, p=0.237) because the stance set offered an escape option both readings wanted; it had flipped the agent's read of the caller 0/10→10/10 the whole time. Rebuilding the stance set to split 경청 from 공감, with a byte-identical payload apart from four labels, produced 공감 0/10→9/10, p=0.00006.
- tension: The mechanism worked all along but was invisible until the stance set — not the injection — was changed; the operative lever was reframed.
- quote: "The block was working the whole time. It flipped the agent's read of the caller completely … while the stance didn't move"
- flags: measurement, reversal

### S9b-148 — A12: labels must not reuse the fixture temperament's vocabulary
- source: PR #93 (body §The finding)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: Three of RB2's four stance labels were lifted from the fixture's own file, so "that \"result\" may have been a lexical chain rather than a judgment"; a lint (lint-stances.mjs) now checks this on every suite (amendment A12).
- tension: A confound (label/fixture vocabulary overlap) that could have manufactured a fake result, caught and mechanized into a lint.
- flags: measurement, ai-limit

### S9b-149 — A14: the 40–60% gate hunt was a wrong premise that cost 30 calls
- source: PR #93 (body; issue comment @alstjgg 04:57)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: "Saturation only matters on the stance you are pushing toward (A14). S1's baseline was 100% saturated and that was ideal. The earlier hunt for a 40–60% gate was a wrong premise and cost 30 calls."
- tension: A methodological assumption was falsified by the data at a measured cost, and logged as an amendment rather than buried.
- quote: "The earlier hunt for a 40–60% gate was a wrong premise and cost 30 calls."
- flags: failure, measurement, cost

### S9b-150 — Drop condition fired; the human deliberately did not apply it
- source: PR #93 (issue comment @alstjgg 04:57)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: S1's pre-registered drop condition ("baseline ≥80% on any single stance") fired at 100% saturation, but the human did not drop the run because the condition's stated rationale (saturation = inherited ceiling) was falsified by a 90-point distribution move; logged as A14 rather than silently corrected, "because \"the drop condition was wrong\" is what rationalisation sounds like."
- tension: Human overrode a pre-registered rule and held itself to a stricter standard (did the rule's own reason survive the data?) to guard against motivated reasoning.
- quote: "the test applied was whether the condition's own stated reason survived the data, and it didn't."
- flags: human-override, measurement

### S9b-151 — E-CONT blocked: needs a human prompt-authoring decision, not an unattended run
- source: PR #93 (body §What you need to do)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: E-CONT and B3b were blocked program-wide because templates/reporter/ didn't exist; the PR states "It's a prompt-authoring decision with axis-discipline implications, so it wants a human rather than an unattended run."
- tension: An explicit human-kept boundary — prompt authoring with methodological stakes is not delegated to an autonomous run.
- quote: "it wants a human rather than an unattended run."
- flags: boundary

### S9b-152 — The read-mechanism-run skill: no sampling is the whole point
- source: PR #93 (body §The read skill)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: A committed project skill (/read-mechanism-run) was shipped that reads every call in every arm with verbatim inner_note quotes and never samples: "a 2-of-10 excerpt hid it completely, and reading all twenty calls is what made it visible." It warns on >15-point arm discard divergence and flags fabricated because_block_ids.
- tension: The tool's design encodes a lesson — sampling hid the S1 finding — into a fixed reading format so future reads can't miss it.
- quote: "a 2-of-10 excerpt hid it completely, and reading all twenty calls is what made it visible."
- flags: measurement, boundary

### S9b-153 — Overnight mechanism run: 381 calls, 8 phases completed
- source: PR #95 (body)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: The full mechanism deep-test review shipped with an overnight run of 381 calls across all 8 phases, plus REPORT.md verdict cards and harness/suites/artifacts/runlog on the branch.
- tension: Scale of the automated measurement program that fed the mechanism-direction decision.
- flags: measurement

### S9b-154 — 07-30 meeting: mechanism verification closed, spec-first work begins
- source: PR #96 (body/title)
- date: 2026-07-30
- lanes: 3 AI-in-planning
- event: The 07-30 meeting minutes recorded the end of mechanism verification and the start of specification-first work ("메커니즘 검증 종료 · 명세-우선 착수").
- tension: Phase gate — the project pivots from validating the AI mechanic to specifying the engine around it.
- flags: decision

### S9b-155 — C-STRUCT removed completely, UI included
- source: PR #97 (body)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: The integration pass moved C-STRUCT from "ships as UI flavor" to "완전 제거 (UI 포함, 07-31 확정)," incorporating #94's independent 8-config / 190-response finding (SOURCE-N20: no effect even at n=20/arm; reachability ≠ exclusivity). Only H3 stayed alive pending spec-compile human judgment.
- tension: A candidate mechanism was fully killed (not even kept as flavor) once two independent programs agreed it didn't work.
- quote: "C-STRUCT: \"ships as UI flavor\" → 완전 제거 (UI 포함, 07-31 확정)"
- flags: decision, measurement

### S9b-156 — Architecture spec recompiled to pure normative prose; dead mechanism names removed
- source: PR #100 (body §1)
- date: 2026-07-31
- lanes: 1 AI-in-the-game
- event: Post-verification, the spec was "규범 서술로 전면 재컴파일" — dead mechanism names/dates/test IDs stripped from the body, evidence reduced to a single header pointer; §2.1 "The player channel" added the single injection channel + 4 laws (authenticated species, irreversible, content>order, cumulative budget).
- tension: The spec was cleaned so implementers read law, not the audit trail that produced it — evidence relocated to a pointer.
- flags: decision, boundary

### S9b-157 — Review: the gate-card schema has no canon; the manual can't express its own rule
- source: PR #100 (review @C9Boom7 COMMENTED 18:16; issue comment @alstjgg 18:32)
- date: 2026-07-31
- lanes: 4 AI-as-creator
- event: 윤석 found the hardening manual §5 schema (`key_block.text` as owner) contradicts its own §3.5 rule ("열쇠는 조건 클래스다 — 카드의 열쇠 문장은 대표 예시일 뿐이다"), and the three drafts had split into three formats. The write-scenario skill §4.7 already had the right shape. 민서 declared the manual §5 canonical, promoted key_conditions to owner with plural key_examples so §3.5(a) becomes machine-checkable.
- tension: A rule and its schema pointed opposite directions in one document; without a canon the lint couldn't be written — caught before the winning scenario's hardening.
- quote: "규칙과 스키마가 한 문서 안에서 반대 방향을 봅니다."
- flags: contradiction, boundary

### S9b-158 — Phase transition demo→production; review approval IS the consensus
- source: PR #101 (body §2)
- date: 2026-07-31
- lanes: 3 AI-in-planning
- event: The PR declared the demo→production transition — DDAY built at the repo root (replacing the planned demos/dday/ scaffolding), demos/ kept deployed as history — and stated "이 PR의 리뷰 승인이 곧 전환 합의입니다." Physical architecture skeleton fixed a 2-tier runtime and 5 constraints, leaving §3 layout unwritten for the architecture-track owner.
- tension: A PR merge used as the formal mechanism for a project-phase transition; a doc section deliberately left blank for another owner.
- quote: "이 PR의 리뷰 승인이 곧 전환 합의입니다"
- flags: decision, boundary

### S9b-159 — Three-track ownership fixed; policy-gap as the game-quality metric
- source: PR #101 (body §1)
- date: 2026-07-31
- lanes: 3 AI-in-planning
- event: The pipeline doc set three tracks — data (민서), architecture (윤석), client (unowned) — under "합의는 논의가 아니라 문서로 — 소유자의 명세가 곧 커뮤니케이션," and made policy gap (oracle−random) the central game-quality metric ("추리가 값을 하는가").
- tension: Ownership boundaries and a numeric definition of "is the deduction worth anything" set the coordination contract for parallel work.
- quote: "합의는 논의가 아니라 문서로 — 소유자의 명세가 곧 커뮤니케이션"
- flags: decision, boundary

### S9b-160 — Minimal engine spec v0: script beats unconditionally make Call 2
- source: PR #102 (body §2)
- date: 2026-08-01
- lanes: 1 AI-in-the-game
- event: 윤석's minimal engine spec fixed state model (trust/fear/clock/one flag with write/read/visible justification), a delta-journal + symptom renderer authored in symptoms.json, and made even script beats run Call 2 unconditionally — "조건부 경로는 최소 엔진이 실행해 보지 않는 분기를 만들고, 무조건 호출의 대가는 채굴 재료의 증가." Retry set to 1, "의도적으로 다릅니다" from the harness's 2 (measurement=sample loss, play=latency).
- tension: A deliberate cost tradeoff (extra calls buy testability + mining material) and a deliberate divergence from the measurement harness's retry policy.
- quote: "무조건 호출의 대가는 채굴 재료의 증가입니다."
- flags: decision, boundary

### S9b-161 — Types: JSON Schema is normative, not TS code — reversing #101/#103
- source: PR #102 (issue comment @alstjgg 08:27; @C9Boom7 08-02 03:27 §3)
- date: 2026-08-01
- lanes: 2 AI-building-the-game
- event: 민서 pushed back on physical §3.1's "types: code is the source of truth": a TS type is erased at runtime and can't check JSON, while JSON Schema is executable validation runnable before any engine exists. 윤석 accepted and inverted the rule (and #103's datapack.ts stub comment): schemas normative, datapack.ts a transcription — "무엇이 정본이냐가 아니라 무엇이 자기를 강제할 수 있느냐입니다."
- tension: A stated principle ("code is canon") reversed under a sharper argument about which artifact can enforce itself; the drift-guard question left open and assigned an owner.
- quote: "반대 논거가 비대칭이더군요 — 정본이 무엇이냐가 아니라 무엇이 자기를 강제할 수 있느냐입니다."
- flags: reversal, boundary

### S9b-162 — Three out-of-doc facts discovered while building the layout
- source: PR #102 (body §5)
- date: 2026-08-01
- lanes: 2 AI-building-the-game
- event: 윤석 recorded three facts found by construction: Vite serves only public/ so data/ never reaches dist/ (§2 constraints 3 & 5 can't both stand until a build-time copy fixes it); tsconfig paths aliases break the headless driver at runtime because Node's type-stripping ignores tsconfig; and root tsconfig's erasableSyntaxOnly/allowImportingTsExtensions were already load-bearing for Node running engine TS directly.
- tension: Spec claims that "아무도 밟지 않았을 뿐"—unstepped-on because no datapack existed yet—would fail silently the moment the first pack compiled; promoted to documented, enforced facts.
- flags: failure, measurement

### S9b-163 — Engine-spec review resolved by absorption, not throw-back
- source: PR #102 (issue comment @C9Boom7 08-02 03:27)
- date: 2026-08-02
- lanes: 1 AI-in-the-game
- event: On 민서's engine-spec review, 윤석 chose to absorb everything the spec could ("되던지는 대신 엔진 명세가 흡수할 수 있는 것은 흡수해서, 남은 데이터 개정 요청은 1건"), filling two of his own spec's holes (§4.2 effect application timing; §1.1 flag-write narrowing) and leaving exactly one revision request to the data track (integer/non-zero deltas).
- tension: Cross-track review handled by the owner absorbing fixes into his own spec rather than bouncing them back — minimizing coordination round-trips.
- quote: "되던지는 대신 엔진 명세가 흡수할 수 있는 것은 흡수해서, 남은 데이터 개정 요청은 1건입니다."
- flags: boundary

### S9b-164 — Root module boundary: DOM banned by compiler, not by review
- source: PR #103 (body §2단계)
- date: 2026-08-01
- lanes: 2 AI-building-the-game
- event: tsconfig.core.json (DOM removed from lib, types emptied) makes `document.querySelector` in src/engine a build failure (verified: TS2584), so "§2 제약 1 … 이 리뷰 코멘트가 아니라 빌드 실패가 됩니다." contracts.ts transcribed the #98 call contract verbatim ("새 결정은 없습니다: 문서와 어긋나면 둘 중 하나가 버그").
- tension: The isomorphism boundary enforced mechanically at compile time rather than trusting reviewers to catch DOM leakage.
- quote: "리뷰 코멘트가 아니라 빌드 실패가 됩니다."
- flags: boundary

### S9b-165 — console blocked as a deliberate side effect; don't widen the config for a print
- source: PR #103 (body §2단계 부작용)
- date: 2026-08-01
- lanes: 2 AI-building-the-game
- event: Removing DOM also blocked `console` in core; the PR kept it intentionally ("결정론 모듈은 반환값으로 관찰하고, per-beat delta journal이 이미 그 용도로 존재"), instructing observers to return values and print at the tools/client boundary: "print 하나 때문에 이 설정을 넓히지 마세요."
- tension: A pre-emptive boundary defense against future erosion — the loss of console is a feature, and the rationale is written into the tsconfig comment.
- quote: "print 하나 때문에 이 설정을 넓히지 마세요."
- flags: boundary

### S9b-166 — The datapack compiler is deterministic code, not an LLM — by design
- source: PR #104 (body)
- date: 2026-08-01
- lanes: 4 AI-as-creator
- event: compile-datapack.mjs parses the draft directly (zero deps, zero calls); rationale: "pack sentences are the mining vein — an LLM compiler's failure mode is silent paraphrase, which breaks key conditions (axis vocabulary!) in ways no schema or lint can see." Verified by diffing against a hand-compiled pack (10 residual diffs, all punctuation).
- tension: A deliberate refusal to use an LLM where its characteristic failure (paraphrase) would corrupt the exact thing (axis vocabulary) the game depends on — human-kept vs AI-delegated boundary drawn on failure-mode grounds.
- quote: "an LLM compiler's failure mode is silent paraphrase, which breaks key conditions (axis vocabulary!) in ways no schema or lint can see."
- flags: boundary, ai-limit

### S9b-167 — Scenario factory: write→compile→lint→paper-check→fix as an orchestrator skill
- source: PR #104 (body §Scenario factory)
- date: 2026-08-02
- lanes: 4 AI-as-creator
- event: write-scenario became an orchestrator skill: write (fresh subagent, contamination-isolated) → compile+lint (scripts) → paper check (subagent, closed checklist citing manual rules, classifying draft-fixable/cross-track/advisory) → scoped fixer → loop, max 3 rounds. Two checker-discipline rules and 2 lint rules (W3/W4) were promoted from the live 우는다리 run, "including one error introduced by the loop's own earlier fix."
- tension: AI generates candidate content in a bounded, isolated loop with human-authored guardrails; the loop caught an error it had itself introduced.
- flags: measurement, boundary

### S9b-168 — Review reproduces a silent lint hole: anyOf skipped, so new fields go unchecked
- source: PR #104 (issue comment @C9Boom7 07:20 §1; @alstjgg 07:44)
- date: 2026-08-02
- lanes: 4 AI-as-creator
- event: 윤석 ran the scripts rather than reading them and found the zero-dependency validator "skips it silently" for `anyOf` — the only two fields using it (timeline.effects, events.present) being the two added that round for the engine handoff, "the same two I signed off on in #102 as consumable as-is." A corrupted pack still gave ERROR 0; a missing key crashed with a stack trace. Fix took his (a)+(b): flatten to known grammar + make unknown keywords a loud error, which then caught `minimum` in another schema as a second never-enforced keyword.
- tension: The lint that exists to pull defects forward into authoring silently failed on exactly the newest, already-approved fields; caught only by a reviewer executing reproductions.
- quote: "all three are cases where lint passes and something goes silently wrong later … Loud failures aren't the problem. Silence is."
- flags: failure, measurement, ai-limit

### S9b-169 — The one hand-authored file was the one file nothing validated
- source: PR #104 (issue comment @C9Boom7 07:20 §2; @alstjgg 07:44 §2)
- date: 2026-08-02
- lanes: 4 AI-as-creator
- event: hardening.json (hand-written) had no schema, wasn't in the lint's FILES, and the compiler did `?? null` silently demoting a missing key; a `variable`→`vairable` typo produced output "byte-identical to the correct pack." Fixed by adding hardening.schema.json with additionalProperties:false and routing JSON.parse through die().
- tension: Human-authored input is exactly where typos live, yet it had zero of the three defenses the pipeline applied to machine-generated files.
- quote: "The one file a human writes by hand is the one file nothing validates"
- flags: failure, boundary

### S9b-170 — Positional-id time-guard defeated by two events sharing a time
- source: PR #104 (issue comment @C9Boom7 07:20 §3; @alstjgg 07:44 §3)
- date: 2026-08-02
- lanes: 4 AI-as-creator
- event: The overlay's drift guard checked `spec.time !== event.time`, but 우는다리's t4/t5 are both 10:40, so swapping them passes the guard and "a delta lands on the wrong event … surfaces only as cause and symptom drifting apart on screen." Fixed with a `text_head` startsWith check alongside time.
- tension: A guard against silent id drift had a hole the shipping pack already occupied; a data-integrity defect that would only appear on-screen as incoherence.
- flags: failure, measurement

### S9b-171 — datapack.ts made generated, not hand-kept, to close the drift gap structurally
- source: PR #104 (issue comment @alstjgg 07:24 §2)
- date: 2026-08-02
- lanes: 2 AI-building-the-game
- event: generate-datapack-types.mjs now emits datapack.ts from the schemas (zero deps, deterministic, `--check` exits 1 on drift), closing physical §3.1's known gap "the structural way you suggested: a generated transcription cannot disagree with its source."
- tension: The transcription-drift risk opened in S9b-161 resolved by generation rather than discipline.
- flags: boundary

### S9b-172 — docs/ switched to English because the primary reader is an agent
- source: PR #105 (body)
- date: 2026-08-02
- lanes: 3 AI-in-planning
- event: docs/ was reorganized into spec-/contract-/plan- tiers and rewritten in English "주 독자가 에이전트이고, 한/영 분리선이 바인딩 세트 한가운데(계약은 한국어, 그 계약이 기대는 스펙은 영어)를 지나고 있었습니다"; scenario content (symptom sentences, stance labels) and planning/ archives stay Korean. The engine spec's 521 lines were fully translated with anchors preserved, flagged so only the author could judge normative drift.
- tension: Language choice made explicitly around who consumes the doc — agents — while keeping human-facing creative content Korean.
- quote: "주 독자가 에이전트이고, 한/영 분리선이 바인딩 세트 한가운데 … 를 지나고 있었습니다."
- flags: decision, boundary

### S9b-173 — "Blocks are irreversible" was stale; a removed block is discarded, not shelved
- source: PR #106 (body §2)
- date: 2026-08-02
- lanes: 1 AI-in-the-game
- event: Housekeeping corrected spec-architecture §2.1: composition is free at build time (slot/unslot), and per the 08-03 민서·윤석 discussion a removed block is "discarded, not shelved (no discard inventory); recovery is re-mining from the always-readable report archive"; what stays irreversible is a deployed run's judgments. Also: 민서 claimed the client track (status.md).
- tension: A published invariant found stale and corrected; the irreversibility relocated from blocks to deployed judgments.
- flags: reversal

### S9b-174 — Client track document set + a frontend-design-skill design target
- source: PR #108 (body)
- date: 2026-08-03
- lanes: 4 AI-as-creator
- event: The client track landed spec-client.md (12 review-blocking invariants), plan-client-build.md (the PRD super-pipeline builds from), a tier-less architecture-map ("when it disagrees with a spec, the spec wins"), and docs/design/phase2-ui/ — "the client design target produced by the frontend-design skill (self-contained mockup on 우는다리 material)," its three webfonts manifested (SIL OFL 1.1).
- tension: A design skill generated the visual target from real game material; the doc set explicitly ranks spec over the derived map.
- flags: boundary

### S9b-175 — View-driver seam offered to the engine owner for ratification before the build run
- source: PR #108 (body §Requests to 윤석)
- date: 2026-08-03
- lanes: 3 AI-in-planning
- event: The PR asked 윤석 to ratify/amend the ViewEvent/MembraneOp seam types (which would then graduate to src/shared/), decide whether u0 may scaffold src/client/, and say who lands the pack-copy plugin — the client build blocked on his answers.
- tension: A cross-track dependency surfaced as explicit blocking requests-by-revision before a parallel agent run could start.
- flags: boundary

### S9b-176 — Seam ratified with 6 amendments; species derives from channel, never a classifier
- source: PR #108 (issue comment @C9Boom7 11:57)
- date: 2026-08-03
- lanes: 1 AI-in-the-game
- event: 윤석 ratified with 6 amendments (beat boundaries, waiting cause, fallback as event, meta folded into the stream, deploy.blocks is a set not a sequence, sentence-id scheme) and settled species from the channel: "f→fact, q→quote, b→selfnarr … No LLM, no heuristic; a classifier here would be a second, invisible authority over what a block is."
- tension: A membrane-adjacent decision — what a block is stays authored/derived, never model-classified, to avoid a hidden second authority.
- quote: "a classifier here would be a second, invisible authority over what a block is."
- flags: decision, boundary

### S9b-177 — Segmenter lives in shared with a golden test; the owner writes it first
- source: PR #108 (issue comments @C9Boom7 11:57, 12:17; @alstjgg 12:08)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The report segmenter was placed in src/shared/ (called by engine, fixture generator, probe) with a golden test making invariant 12 "structural rather than a review item." On the sequencing question, 윤석 chose (a): "I'll write src/shared/segment.ts and its golden test first; u2 builds fixtures against it rather than the other way round," to keep authority clean.
- tension: Ownership-of-authority boundary — the engine owner writes the shared primitive first so the client build can't fork a second copy.
- quote: "(a). I'll write src/shared/segment.ts and its golden test first"
- flags: boundary, decision

### S9b-178 — Persistence contradiction resolved to sessionStorage; both docs were one owner's
- source: PR #109 (body); PR #108 (issue comment §Flagged item)
- date: 2026-08-03
- lanes: 3 AI-in-planning
- event: physical §1 said meta-state lives in localStorage; game-design §6 said "no persistence — refresh resets." Both were 윤석's, "so this was never a question for the client track to wait on"; new §1.1 binds sessionStorage — survives a refresh (protects the multi-run spine) but dies with the tab (every judge starts clean, so "demo opens on run 3" staging holds).
- tension: A cross-doc contradiction that had blocked the client track was resolved by its single owner, freeing the view layer from staying memory-only.
- quote: "localStorage would drop a returning judge into someone else's run 4, breaking the \"demo opens on run 3\" staging"
- flags: contradiction, decision

### S9b-179 — Engine/LLM seam spec; segment.ts + species.ts land to pre-empt a second copy
- source: PR #114 (body §What lands as code)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: 윤석 landed src/shared/segment.ts + species.ts — "both were ratified in #108 as existing, and neither did" — because the client's u2 would otherwise "improvise a splitter inside src/client/, the second copy the ratification specifically guarded against." The segmenter's golden test matters because the engine mints ids by position, so re-splitting renumbers every downstream id and archive highlighting "silently points at the wrong text."
- tension: A ratified-but-nonexistent shared primitive was built just ahead of the parallel run that would have duplicated it wrongly.
- quote: "Left alone, u2 improvises a splitter inside src/client/ — the second copy the ratification specifically guarded against."
- flags: boundary, failure

### S9b-180 — Self-review finds a path-traversal file read in dev middleware; removed, not patched
- source: PR #114 (body §Reviewed before asking for review)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: Two rounds of self-review against main found `/data/policy/%2e%2e%2f%2e%2e%2fCLAUDE.md` returned CLAUDE.md because the prefix check ran on the still-encoded path; "Removed, not patched: with the whole plugin disabled the based URL still 200s, so Vite was serving data/ all along and the middleware was a hand-rolled file server for a capability that already existed."
- tension: A security hole in AI-written middleware, found by the author's own pre-review, whose deeper finding was that the vulnerable code was entirely redundant.
- quote: "Removed, not patched … the middleware was a hand-rolled file server for a capability that already existed."
- flags: failure, boundary

### S9b-181 — Engine PRD revised rev1→rev2: 8 serial waves collapsed to 5 via a skeleton-first unit
- source: PR #114 (issue comment @C9Boom7 14:59)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The engine-build PRD was revised because "Rev 1's dependency graph was eight near-serial waves with a maximum parallelism of two, so super-pipeline would have run it as a chain of eleven units behind eight review barriers — roughly 24h wall clock, with the harness's fan-out never engaging." Rev 2 adds an e0 skeleton unit (full public surface as unimplemented-throwing types) so six units build concurrently, ~12–16h.
- tension: A PRD restructured specifically to make the multi-agent harness's parallelism engage — the build graph decoupled from the serial module graph.
- quote: "super-pipeline would have run it as a chain of eleven units behind eight review barriers — roughly 24h wall clock, with the harness's fan-out never engaging."
- flags: decision, measurement

### S9b-182 — 13 decisions tabled closed, 4 tabled open, so parallel agents stop inventing
- source: PR #114 (body §What lands as specification)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: plan-engine-build.md tabled "13 decisions … as closed so parallel agents stop inventing signatures, and 4 tabled as open with instructions not to resolve them"; determinism checks were made runnable acceptance-criteria commands ("prose criteria do not gate anything"), and launch args (frozen_globs incl. proxy/** and package.json, review-lens scores) were pinned in the PRD.
- tension: The human pre-closes and pre-freezes exactly what autonomous agents would otherwise each guess differently — the orchestration boundary made explicit in the PRD.
- quote: "13 decisions tabled as closed so parallel agents stop inventing signatures, and 4 tabled as open with instructions not to resolve them"
- flags: boundary, decision

### S9b-183 — First proxy deploy done by hand, deliberately
- source: PR #138 (body §What this does)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The LLM tier (`nhn-game-proxy`, ap-northeast-2) was deployed for the first time and answered all three call types, closing status.md's standing "Not done: zero real Bedrock calls"; deployed "by hand first, deliberately: a stack that has never been created should not have its first run debugged through CI's feedback loop. The workflow here is a transcription of a sequence that is known to work."
- tension: Human-kept boundary on first infrastructure creation — CI's slow feedback loop is the wrong place to debug a never-created stack.
- quote: "a stack that has never been created should not have its first run debugged through CI's feedback loop."
- flags: boundary

### S9b-184 — The inherited exec role could update but not create; two failed deploys to find each grant
- source: PR #138 (body §Why a second bootstrap)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The reused execution role `nhn-game-llm-cloudformation-exec` carried policy `UpdateLlmLayerResources` with only Update* grants (no CreateFunction/CreateRole/CreateLogGroup/POST api), inherited via samconfig, "so the first deploy died at CREATE_FAILED and then at ROLLBACK_FAILED — it could not delete what it had not been allowed to create." Two further grants (apigateway:TagResource, logs:CreateLogDelivery) "each cost a failed deploy to find." Every failed attempt was deleted in full.
- tension: An IAM role authored to update one existing stack silently broke the first create-path deploy; each missing permission surfaced only by a failed deploy.
- quote: "the first deploy died at CREATE_FAILED and then at ROLLBACK_FAILED — it could not delete what it had not been allowed to create."
- flags: failure, cost

### S9b-185 — The latency budget was wrong; the one call that fit it did so by breaking the contract
- source: PR #138 (body §The latency budget was wrong)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: First real reporter call showed 7s budget = 1/3 pass (2× 504 bedrock_timeout); 15s = 5/5. "The call that passed under the old budget did not beat the clock by being fast — it beat it by breaking the contract" (16 sentences vs the required 20–30). Ceilings reordered to model 15s < route 18s < Lambda 20s so the tier returns its own labeled 504; the old 7s came from apothecary's arithmetic whose "premise — that 7 s covers a call this tier had never made — was never tested."
- tension: A tuning constant copied from another game was falsified by the first real measurement; the apparent pass was a contract violation.
- quote: "it beat it by breaking the contract."
- flags: failure, measurement

### S9b-186 — Nova 2 Lite measured and rejected: don't decouple the mechanism from the shipped model
- source: PR #138 (body §Nova 2 Lite)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: Nova 2 Lite (4.19s mean vs haiku 7.79s) was measured on a byte-identical prompt and rejected: it is only ~9% faster per token, "writes less — and what it writes less of is what the contract asks for," needs the loose tool spec (already voided one comparison), and every C-BLOCK measurement (761 judgment calls, p=0.0000595) is haiku. "Switching would decouple the measured mechanism from the shipped system six days before the deadline. … The model is haiku."
- tension: A faster model rejected because switching would break the tie between the validated mechanism and the shipped system near deadline — measurement over raw speed.
- quote: "Switching would decouple the measured mechanism from the shipped system six days before the deadline."
- flags: decision, measurement

### S9b-187 — OIDC deploy path with no stored credential; health probe can't prove IAM reaches the model
- source: PR #138 (body §Deploys hold no secret; review @alstjgg 07:23)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: proxy-deploy.yml assumes a role over GitHub OIDC ("no stored AWS credential, nothing that expires"); the post-deploy step makes a real model call because "/dday/health never touches Bedrock, so alone it cannot tell a working deploy from one whose IAM cannot reach the model." Reviewer flagged the OIDC assume path "has never actually run" — the by-hand deploy used an SSO session — and both fail closed (Pages unaffected), suggesting an immediate workflow_dispatch to prove it.
- tension: The credential-free deploy path and the deeper-than-health verification are designed but the OIDC trust hasn't fired once; failure modes fail closed.
- quote: "/dday/health never touches Bedrock, so alone it cannot tell a working deploy from one whose IAM cannot reach the model."
- flags: boundary, measurement

### S9b-188 — Public unauthenticated endpoint stated as a known trade, not hidden
- source: PR #138 (body §Known, and stated rather than hidden)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The PR states the endpoint is "public and unauthenticated. The origin check is CORS, not security — curl sets any origin it likes," with the real limits being throttling (2 rps/burst 4), MaxTokens, and budget alarms; a consequence recorded: a Node fetch sends no Origin → 403, so a headless run against the real model can't happen without widening AllowedOrigin.
- tension: A security limitation deliberately named as a reasonable competition trade rather than papered over — and the single-origin lock keeps fixture-first structural.
- quote: "The origin check is CORS, not security — curl sets any origin it likes."
- flags: boundary

### S9b-189 — The proxy deploy failed its own post-deploy check against the origin guard it shipped
- source: PR #139 (body)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: #138 "deployed cleanly and then failed its own post-deploy check" — the Health check step sent no Origin header, so the origin guard (which runs ahead of route dispatch) returned 403 before reaching the health branch. "Absent is not equal, and the guard is right to say so." The stack was serving correctly the whole time; the check was wrong. Still OPEN as of the snapshot.
- tension: A deploy verification broke against the very guard it had just deployed — the infrastructure was fine, the probe was mis-specified.
- quote: "Absent is not equal, and the guard is right to say so."
- flags: failure

### S9b-190 — A bash `set -e` bug hid the 403 body, making the failure read as opaque exit 22
- source: PR #139 (body §The change)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Both probe steps did `BODY="$(curl --fail-with-body …)"; echo "$BODY"`, which "under shell: bash -e dies at the assignment and never reaches its own echo. The 403 body said origin_forbidden in plain text and no log ever showed it." Fixed to "Assert after printing, never instead of it" — capture status and body, print, then assert with an explicit `test "$STATUS" = "200"`.
- tension: A shell idiom swallowed the diagnostic that would have explained the failure instantly; the fix makes the next failure diagnosable from the log alone.
- quote: "Assert after printing, never instead of it."
- flags: failure

### S9b-191 — The IAM→Bedrock path from CI is still unproven at the OPEN snapshot
- source: PR #139 (body §Verified)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The PR notes the "Real model call" step "never executed in run 30891089347 either, since Health check failed ahead of it, so the IAM → Bedrock path is still unproven; this merge is what first exercises it."
- tension: Two stacked unknowns (OIDC assume from S9b-187, and CI's IAM reaching Bedrock) remain unexercised; the fix's own merge is the first real test — captured mid-flight as an OPEN PR.
- flags: measurement, boundary

### S9b-192 — Origin literal made one drift point instead of two, with the reason written down
- source: PR #139 (body §The change)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The fix moved ALLOWED_ORIGIN into the workflow's env block "alongside the stack name, bucket and role arns, and both probes read it. It must equal samconfig.toml's AllowedOrigin override — that is now one drift point instead of two literals, and the comment says why the probes need it at all."
- tension: A small maintainability boundary — collapse duplicated literals to one source and document the coupling — applied even on a hotfix.
- flags: boundary
