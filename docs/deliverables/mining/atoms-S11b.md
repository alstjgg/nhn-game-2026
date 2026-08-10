# Atoms — S11b implementation build-record (client + PRDs)

Snapshot: main @ 5a3c388..HEAD (8b7651f), mined 2026-08-10.
Coverage: The 21 client discovery files under `discovery/` (u0, u1, u2, u2f, u3,
u4, u4s, u5, u6, u7, u8, u9, u9d, u10, u11) were read **in full** — every
IMPLEMENT/TEST/VERIFY section. The e-files (e0–e10,
`live-provider-prerequisites.md`) under `discovery/` are engine/proxy discovery
and out of this slice's scope (client + PRDs), so they were not mined here.
Of the 30 PRDs under `planning/prds/`, **four were read in full** (g1-1, g2-1,
g10-1, and g13-2 head), and the header + Outcome + Scope + Design sections
(first ~40 lines) of the other 26 were read; the inner change-lists of those 26
were sampled, not exhaustively read. Because every g-PRD follows one fixed
template, decisions and scope live in the sections read; deep edit-by-edit
detail in the unread change-lists is the known gap. No OH-1 hooks are assigned
to this slice, so there is no corroboration section.

---

### S11b-001 — u0 created repo-root `DISCOVERY.md`, contradicting the append-only harness rule
- source: discovery/u0.md §"Harness-vs-contract conflict"
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The agent instructions said to append to `discovery/<unit-id>.md` and never write `DISCOVERY.md` directly, but u0's acceptance criterion c6 and `tests/scaffold/discovery.test.ts` required the repo-root `DISCOVERY.md` to exist with three seeded run sections. u0 resolved in favour of the contract and created `DISCOVERY.md` as the run-wide append target.
- tension: A direct conflict between the standing harness protocol and the unit's own acceptance test, decided per-unit in favour of the test.
- quote: "u0 therefore **creates** `DISCOVERY.md` as the run-wide append target — that file *is* this unit's deliverable."
- flags: contradiction, decision

### S11b-002 — u0's read-scope did not include sections it needed to write its own entries
- source: discovery/u0.md §"Read-scope miss"
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The sliced read-scope for u0 omitted `docs/plan-client-build.md` §1–§2 and `docs/spec-physical-architecture.md` §1.1, both needed to write the c6 discovery entries accurately (the memory-only/`sessionStorage` contradiction and the "dev deps only" rule). The agent opened those sections anyway.
- tension: The decomposition handed a unit a read-scope narrower than the unit's own deliverable required.
- flags: failure, boundary

### S11b-003 — The `[u0#c8]` empty-modules census failed by construction the moment any client file landed
- source: discovery/u2.md §1
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `tests/scaffold/layout.test.ts` › `[u0#c8] empty-modules-only census` asserted `src/client/**` held nothing but `.gitkeep`/`main.ts`/pre-existing files. It was authored while u0 was alone on the tree; u1's stylesheets, u2's driver modules, and every later window unit invalidate it by contract. Left failing across u1, u2, u3, u5, u9d, u10.
- tension: A scaffold-stage guard that becomes a permanent red the moment the work it guards against is done as designed; every downstream unit records it as noise for the integrator to retire.
- links: S11b-001; recurs in u1 §2, u3 §12, u5 §4, u9d §A, u10 §4
- flags: contradiction, boundary

### S11b-004 — The reference's third-party webfonts were replaced with self-hosted equivalents (inv 10)
- source: discovery/u10.md §1
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `docs/design/phase2-ui/index.html` loaded three families from `fonts.googleapis.com`/`fonts.gstatic.com`; spec-client §3 inv 10 forbids any third-party request, so u10 ported the compliant equivalent — the same eleven faces, the same per-`unicode-range` slicing, vendored under `public/assets/fonts/`. u1 and u3 independently dropped the same `<link>`s under the P0-A precedence rule (invariant beats reference).
- tension: A named invariant overrode the design reference; the deviation was applied identically by three separate units.
- links: recurs in u1 §1, u3 §A.1
- flags: decision, boundary

### S11b-005 — u10 baked the CSS cascade into font declarations because upstream slices were not disjoint
- source: discovery/u10.md §2
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `tests/assets/unicode-range-coverage.test.ts` required non-overlapping slices per Korean family/weight, but Google's own sheet overlaps (a "most common glyphs" slice plus a `latin` slice re-declare codepoints the block slices carry). `tools/fonts/vendor-google-webfonts.mjs` walks each family/weight backwards so a face keeps only what no later face claimed — coverage byte-identical to upstream, declarations a true partition.
- tension: A deliberate divergence from upstream's literal `unicode-range` strings to satisfy a repo test; re-running the vendor script is the only supported regeneration.
- flags: decision

### S11b-006 — Chrome greys were consolidated onto one token step; "pixel-exactness is not the bar"
- source: discovery/u1.md §5
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The reference carried several visually identical chrome greys (`#e4e7ea`/`#e2e8ed`/`#dfe6ec`/`#f0f3f6` → `--txt-hi`, etc.); u1 collapsed them onto one step of the token scale, removed `!important` in favour of specificity, and logged the adaptations under spec-client §8. Every literal in `tokens.css` still occurs in `desktop.css` (enforced by `[u1#c2] (c)`).
- tension: Fidelity to a design reference was deliberately traded for token-scale discipline, under an explicit spec clause permitting it.
- quote: "pixel-exactness is not the bar"
- flags: decision

### S11b-007 — The seam left `styles/index.css` unwired; none of u1's ten sheets reached the bundle
- source: discovery/u1.md §7
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `main.ts` still imported `./placeholder.ts` and called `mountPlaceholder()`; no module imported `./styles/index.css`, so `npm run build` emitted only the 0.38 kB placeholder sheet. `main.ts` was outside u1's `file_globs`, so u1 could not wire it; u1's rendered self-check was recorded as `visual: "not-run"`.
- tension: A unit shipped ten correct stylesheets that no reachable render could exercise, because the file that mounts the shell belonged to a unit not in this slice.
- flags: failure, boundary

### S11b-008 — u2 invented stamp-inheritance because the spec named clock stamps on only three of eight events
- source: discovery/u2.md §3
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: §5.4 called a fixture run "an ordered `ViewEvent[]` with clock stamps", but only `beat_start`/`beat_end`/`feed.line` carried a stamp. To keep stream order inviolable while gating on the clock, u2 made an unstamped event inherit the due minute of the last stamped event before it — a driver-side convention the spec does not state.
- tension: The only reading that satisfied both "stream order" and "clock stamps" was a convention the agent had to invent and flag for ratification.
- quote: "This is the only reading that satisfies both 'stream order' and 'clock stamps' — but it is a driver-side convention the spec does not state."
- flags: decision, boundary

### S11b-009 — u2 made the sim clock pumped, not self-driving, to keep the driver view-agnostic
- source: discovery/u2.md §4
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The reference drove the sim clock from the browser's frame callback with wall-clock-seeded globals; u2 exposed `advance(realMs)` holding an accumulator per clock instance instead, because a DOM frame callback in `driver/` is a seam violation (`import-direction.test.ts` case (j)) and `[u2#c5]` requires a pinnable frame a wall-clock loop cannot give.
- tension: The reference's drive mechanism was rejected to satisfy the seam invariant and deterministic testability, keeping the animation freeze a real gate rather than an honour system.
- flags: decision

### S11b-010 — u2f ported a digit-bearing NPC line as spelled-out Korean to satisfy inv 2
- source: discovery/u2f.md §2.1
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The reference's 20:22 line read `영장 없이는 못 엽니다. ……20분만 줘요.` — a digit in NPC state, which inv 2 forbids. u2f ported the compliant equivalent `……스무 분만 줘요.` using the pack's own idiom, recorded in `provenance.test.ts`'s `PORTED_DEVIATIONS`.
- tension: A single invariant forced a copy change to authored scenario content, tracked as a sanctioned deviation rather than a silent edit.
- quote: "……스무 분만 줘요."
- links: S11b-032 (same deviation later re-sanctioned by PRD g1-1)
- flags: boundary, decision

### S11b-011 — u2f classified report sentences by channel, overriding the reference's hand-classification
- source: discovery/u2f.md §2.2
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The design target hand-classified seven report sentences against their channel (`b-r2-f02`/`b-r2-f07` as `quote`; five others as `emotion`). u2f applied "species derives from the channel, never from classification" and made them `fact` and `selfnarr` — because the reference's species column is decoration while the fixture's is load-bearing (contract-datapack E2 gates the solution path on it).
- tension: The reference and the seam rule disagreed on how a sentence's species is decided; the rule won because the fixture's species is used by a test, not shown.
- flags: decision, contradiction

### S11b-012 — The unit's own contract file was absent from the worktree across many units
- source: discovery/u2f.md §4
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `.claude/super/units/u2f.md`, listed "READ FIRST" in the read scope, did not exist in the worktree — only `tests.md` was present, and the prompt's acceptance-criteria strings were cut mid-sentence with a `(full: …#cN)` pointer to a file not on disk. The criteria were reconstructed from `tests.md` plus the eight RED test files. u6, u9, u10 logged the same absence.
- tension: A recurring harness defect: the artifact each unit was told to read first was not delivered into the worktree, forcing agents to reconstruct their contract from tests.
- links: recurs in u6 §7, u9 §A.1, u10 §5
- flags: failure

### S11b-013 — u3 opened the desk paused, not running, deviating from the reference's opening state
- source: discovery/u3.md §A.4
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The reference booted running at ×1; u3 opened the desk paused with `❚❚` marked so the operator presses `▶`, because `[u3#c3]`'s "clock is driver-fed" check reads `__shell.frame()` and `#clockDigits` in two round trips and demands equality — racy at ×1 where the sim advances a minute every 105 ms. `driver.advance(0)` still releases the opening minute's events before the hold.
- tension: A deviation from the reference's opening state, justified both as product behaviour and as the only way to make a two-read equality check non-racy.
- flags: decision, reversal

### S11b-014 — u3 gave TALLY a bottom band instead of the reference's floating sheet, then u7 reverted it
- source: discovery/u3.md §A.3
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The reference floated TALLY as a 730-wide sheet over the desk, booting it hidden; u3's acceptance ([u3#c1]) required all five windows visible at once, so a floating sheet would bury BLOCK STORE. u3 gave TALLY the band under the three columns, costing them ~28% height, and noted the reference's arrangement could return if a later unit re-hid TALLY until run end.
- tension: A layout deviation forced by an acceptance criterion, explicitly flagged as reversible — which u7 then reversed.
- links: S11b-024 (u7's revert)
- flags: decision, boundary

### S11b-015 — A built `dist/` could not boot: the scenario pack was copied nowhere
- source: discovery/u3.md §E.16
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `shell/pack.ts` fetches `data/scenario/<slug>/meta.json` relative to `document.baseURI`, but `vite build` copied nothing from `data/`, so `vite preview` answered 404 and the shell threw before the desk built. VERIFY copied the pack into `dist/` for the capture only; the §3.7 pack-copy plugin was left unowned. "Only the dev server can run the app."
- tension: The build artifact was non-bootable for the whole run because the plugin that copies scenario data into `dist/` had no owning unit.
- links: recurs in u4s §E.17, u5 §12, u6 §8, u8 §13, u9 §D.1
- flags: failure, boundary

### S11b-016 — u4 could not seed an opening store, so carried blocks render a fallback card
- source: discovery/u4.md §A.1–A.2
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The design demo opens with two pre-slotted r2 blocks, but `createFixtureDriver` starts `slots={}` and the run file offered no seeding field; `meta.carried` is `string[]`, not `Sentence[]`, so a carried block cannot render its own text until a `report` re-introduces it. u4 rendered the empty opening state and covered carried ids with a fallback card, `(원문은 부검 기록에 있습니다)`.
- tension: The seam shape could not express the design's opening state, so a fallback text stood in — recorded as needing either a `carried: Sentence[]` seam change or ratification of the fallback.
- links: S11b-018 (same fallback surfaces in the store)
- flags: boundary

### S11b-017 — u4 fixed a self-contradictory oracle inside its own test files
- source: discovery/u4.md §B.5
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `e2e/agent-file.spec.ts`'s `pinnedIds()` selected `#w-file [data-block-id]`, which counted every filled slot twice (the `.slot` and its `.slot-pin` both carry the id per spec D9), so `[u4#c4] (b)`'s `toEqual([SEEDS[0].id])` could never hold while `[u4#c4] (a)`/`[u4#c6] (d)` also required both anchors. u4 scoped the helper to `.slot-pin[data-block-id]`; no assertion changed.
- tension: Two acceptance criteria were mutually unsatisfiable through a shared helper; the unit repaired the helper without weakening any assert.
- flags: contradiction

### S11b-018 — Carried blocks printed fallback text instead of their sentence in the built store
- source: discovery/u4s.md §D.12
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The nine `meta.carried` ids named RUN 01/02 report sentences, but the RUN 03 stream carried no `report` event for an earlier run, so every carried card read `(원문은 부검 기록에 있습니다)` while the design showed the real text. u4s refused to invent text (inv 3), recording it as a stream gap (u2f) that also empties u6's RUN 01/02 archive; both windows resolve once past-run reports reach the seam.
- tension: A visible content gap held open on principle — the window must never invent text it was not handed — rather than patched at the surface.
- links: S11b-016, S11b-021
- flags: boundary, failure

### S11b-019 — The base tree could not boot: `loadDemoRun` vs `demoRun` export mismatch
- source: discovery/u4s.md §A.1, §D.9
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `shell/boot-run.ts` imported `loadDemoRun` from the driver barrel, which exports `demoRun`; Vite threw `does not provide an export named 'loadDemoRun'`, the module graph never evaluated, and the desk rendered zero `.win` frames. u4s repaired it out-of-glob with a two-word edit (importing `demoRun`), which also turned two `vite build` unit tests green. u8 later re-fixed the same break at the consumer end.
- tension: A cross-unit merge (u5↔u6, `45b51f9`) shipped a rename on one side of a seam and the old name on the other, breaking every window e2e until an unrelated downstream unit repaired it.
- links: S11b-025 (u8 re-fixes it)
- flags: failure

### S11b-020 — u5's `FALLBACK_CLASS` was a required export no source consumed, breaking `npm run build`
- source: discovery/u5.md §3
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `tests.md` required `fallback-notice.ts` to export `FALLBACK_CLASS`; `run-feed.ts:23` imported it, never used it, and `tsc`'s `noUnusedLocals` failed `npm run check` (and `npm run build`) on TS6133 — while `npx vite build` alone was clean, so the two disagreed on whether the unit built.
- tension: A test-only export required by the contract collided with a strict-TS rule, making "does it build" answer differently depending on which build command ran.
- flags: failure, contradiction

### S11b-021 — A built `dist/` renders every window empty by design; captures must use the dev server
- source: discovery/u5.md §12
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: VERIFY captured shots against both `vite preview` over `dist/` and the dev server: on `dist/` the LIVE FEED (and all five windows) rendered head and frame but zero lines, because `demoRun()` returns `null` when `import.meta.env.DEV` is false and the boot falls back to `placeholderBootRun()` (one `meta`, no `feed`). The emptiness is global across all five windows — the tell that it is the data source, not any one window.
- tension: The player build had no content path at all; a reviewer reading a `dist/` capture would misread the intended emptiness as a rendering defect.
- quote: "Do not read an empty window on `dist/` as a rendering defect."
- flags: boundary, measurement

### S11b-022 — The shared Playwright port 5174 silently served other worktrees' code
- source: discovery/u5.md §10
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `playwright.config.ts` pinned `PORT = 5174` with `reuseExistingServer: !CI`; six unit worktrees ran off the same port, so `npx playwright test` could be served another worktree's tree. u5's attempt-1 "26/26 abort in `boot()`" turned 26 green on re-run with no code change, and a `curl` of the module path returned a sibling worktree's u3 stub.
- tension: A whole class of ghost pass/fail results came from parallel worktrees colliding on one hard-coded port; recorded by u4, u6, u9d too.
- links: recurs in u4 §14, u6 §7, u9d §D
- flags: failure

### S11b-023 — u6 composed the two missing archive reports from the fixture's own exports
- source: discovery/u6.md §2
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `meta.archive` listed RUN 01 and RUN 02, but `woodari-run03.ts` streamed only round 3's `report` (u2f's "one report per run" ruling), so the archive rail's purpose was untestable and every archived segment opened empty. u6 composed the two missing `report` events in `demo-run.ts` from `woodari-reports.ts`'s own `reportOf(1)`/`reportOf(2)` exports — no content originating in the unit — flagging that the composition belongs in u2f's stream.
- tension: A consumer unit synthesised missing stream content from existing fixture exports to make its own feature demonstrable, while marking the composition as living in the wrong layer.
- flags: decision, boundary

### S11b-024 — u7 reverted TALLY to a floating sheet by editing u3's `layout.ts` out of glob
- source: discovery/u7.md §"IMPLEMENT attempt 2" #1
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: TALLY's band was 180 px against 415 px of ledger content, clipping the table, wait line and `#btnNewRun`. u7 could not compact its own content (u1's skin is sha256-pinned) nor restyle it, so it edited `src/client/shell/layout.ts` (u3's file) to restore the reference's floating 730-wide sheet — the one cross-unit production edit u7 makes, which gives every other window ~180 px back.
- tension: The premise behind u3's deviation (all five windows visible) was gone once u7 mounted TALLY closed, so u7 reverted to the reference — but only by editing another unit's file, since no other file could supply the height.
- links: S11b-014
- flags: reversal, boundary

### S11b-025 — u8 re-fixed the boot break, and corrected the red-thread endpoint from the design's decision B
- source: discovery/u8.md §5, §7
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: u8 re-pointed `boot-run.ts` to import `demoRun` (one word) so the desk booted, then found `design.md` §2 B's preferred `.slot-pin` anchor was wrong: the reference (`app.js:583`) reads the slotted CARD, not the pin. u8's adapter collects `[data-block-id]` in document order and folds by id (cell first, pin folded away), keeping design B's one-thread-per-id point while dropping its wrong anchor.
- tension: The unit's own design document specified the wrong DOM anchor; the agent corrected it against the reference under P0-A precedence rather than implement it as written.
- links: S11b-019
- flags: reversal, decision

### S11b-026 — A virtual clock could not drive the boot, blocking deterministic captures repo-wide
- source: discovery/u8.md §14
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The capture protocol wanted `page.clock.install({time:0})` before navigation for a fixed virtual tick, but with the virtual clock installed the shell never published `window.__threads`/`__agentFile`, and pumping 250 ms slices up to 10 s did not release it — the capture timed out. VERIFY fell back to a wall-clock settle and reported `settle: "wallclock"` rather than claim determinism.
- tension: Something in the boot chain advances on a real-time source the fake clock does not drive, blocking every deterministic capture in the repo until the boot's time source is made fakeable.
- flags: failure, measurement

### S11b-027 — The DEV debug pane painted over a third of the desk in every previewed build
- source: discovery/u8.md §15
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `src/client/debug/pane.ts` painted an opaque event table over roughly `x 0–533, y 466–800` at 1280×800, over the BLOCK STORE window and the desk floor, not gated behind anything visible in dev; it is also the sole offender named by the repo's color-literal suites (`#080d12`, `#23343d`, `#7fb0c4`, `#cfe3ea`). Recorded by u7 and u9d too.
- tension: A debug surface silently degrades every full-desk capture and is the only file failing the token-lint color suites, yet cannot move its palette into `tokens.css` (inv 11 forbids the pane reaching the player sheet).
- links: recurs in u7 VERIFY, u9d §G, u11 §1
- flags: boundary

### S11b-028 — u9 shipped no production code and quarantined a real defect under `test.fail()`
- source: discovery/u9.md §B.1
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: u9's structural-assert suite is barred from writing production code ([u9#c8]) and from gating on another unit's defect ([u9#c6]). Finding that focus order does not follow visual order at 1280×800 (a u3 defect), it kept the assert verbatim under Playwright's `test.fail()` — an expected-failure marker that turns red as "expected to fail but passed" once u3 fixes it.
- tension: A test-only unit found a genuine defect it was forbidden to fix or skip, and encoded it as a self-clearing quarantine rather than a deletion.
- flags: decision, boundary

### S11b-029 — The PRD and the unit contract disagreed on which invariant u9 must guard
- source: discovery/u9.md §A.2
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: PRD §4 named inv 1, inv 2, inv 10 and inv 8 for P1-D; `units/u9.md` c4 replaced inv 10 with inv 12 (seam integrity) and never mentioned inv 10. The suite followed the unit contract, noting nothing was lost (inv 10 is covered by u10's `no-third-party-url.test.ts`) but that the two sources should be reconciled.
- tension: Two authoritative planning documents specified different invariant sets for the same unit; the agent chose the unit file and flagged the conflict.
- flags: contradiction

### S11b-030 — u9d's debug pane was the only new failure in the token-lint color suite, and could not be fixed the usual way
- source: discovery/u9d.md §G.10
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: `token-lint.test.ts` `[u1#c1] (c)` went red on `src/client/debug/pane.ts`'s four color literals — the only new full-suite failure relative to the parent commit. It cannot be fixed by moving the palette into `tokens.css` (that sheet ships in the player build; inv 11 forbids the pane reaching it), so the resolution is either a `debug/**` lint exclusion or a `debug/`-local palette constant.
- tension: An inv 8 lint globs all of `src/client/**/*.ts` and predates the `debug/` tree, catching a DEV-only surface that inv 11 deliberately keeps out of the player build.
- flags: contradiction, boundary

### S11b-031 — u11 owned the consolidated `DISCOVERY.md` and re-aimed stale unit-scoped asserts without deleting any
- source: discovery/u11.md §"Stale unit-scoped asserts re-aimed"
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: [u11#c6] made populating and correcting `DISCOVERY.md` u11's deliverable; the unit re-aimed six e2e suites (a11y, shell, debug-pane, red-thread, reports, fonts) so each assert measured the intent on the finished tree (region census with `includeHidden`, focus positions in the surface's content frame, rail = archive ∪ filed runs, subset-loading instead of empty-desk absolutes). Each site carries a `C17 / [u11#c12] — RE-AIMED` note; none was deleted or skipped.
- tension: The integration unit's job was to reconcile forward-scoped asserts to reality across nine files outside its declared `file_globs` — recorded so the overlap does not read as a stray edit.
- flags: decision, boundary

### S11b-032 — u11 found the capture protocol froze the boot sweep, blanking all ten build shots
- source: discovery/u11.md §"VERIFY attempt 1" #1, close-out #1
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `shell.css:172` hides every `.win` behind `body.booting`, dropped by a timer that `page.clock.install()` freezes; `e2e/captures.spec.ts` installed the clock before the sweep passed, so all ten build shots rendered an empty desk (`body.className === "booting"`, every `.win` `visibility:hidden`). The fix waited for the hand-over before freezing, and made the guards assert `booting` is gone and no `.win` computes `visibility:hidden` before shooting. Result: 10/10 shots, 0 clipped.
- tension: The deterministic-capture protocol paused the very animation its own reveal logic awaited, and element-count/bounding-box guards could not detect a blank shot because `visibility:hidden` keeps both.
- quote: "a capture spec that pauses animations must not pause the ones its own reveal logic awaits"
- flags: failure, measurement

### S11b-033 — The red-thread flake was diagnosed to the TALLY being up, not the thread layer
- source: discovery/u11.md §"close-out" #2
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Attempt 1 guessed the desk "keeps ticking between two reads"; instrumenting the failure to report the deciding state showed `#w-tally` carried no `hidden` class — the TALLY was up, and `planThreads` returns `[]` while it is ([u8#c1]). The e2e's own `boot()` drains to the terminal (where u7 opens the tally) and the file then fought the run state by closing it by hand. Re-aimed to exit via `#btnNewRun`; the drag describe went from 9 reds in 15 to 30 green in 30.
- tension: A flaky test was misdiagnosed once; reporting the state that decides the outcome, rather than "the thing is not there", turned a three-attempt guess into a one-run fix — and the cause was a stale test helper, not the product.
- quote: "an oracle that reports only *\"the thing is not there\"* costs several runs per diagnosis"
- flags: measurement, reversal

### S11b-034 — The ~1 s font budget was measuring the test scheduler, not the build
- source: discovery/u11.md §"VERIFY attempt 1" #4
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `e2e/fonts.spec.ts`'s `nav.duration` is wall-clock and ran on one of three concurrent web servers: same bytes read ~700 ms alone, 1168 ms in a full-suite run, 1278 ms with two suites at once. `NAV_BUDGET_MS` stayed 1000; the assert was re-aimed to read the best of five fresh navigations. The underlying fact was routed to u10: the finished desk's first render pulls ~1.05 MB across 50 slices.
- tension: A wall-clock budget sat close enough to its limit that machine contention decided pass/fail; the fix isolated the signal without widening the budget, and the real payload question was handed to the owning unit.
- flags: measurement, boundary

### S11b-035 — The g-PRDs are surgical single-commit units with an explicit "if this PRD is wrong, stop" protocol
- source: planning/prds/g1-1-G2-fallback-register.md §"If this PRD is wrong"
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: Every g-PRD names an executor ("Sonnet-class session"), a branch, exactly one commit with a fixed message, "Open a PR; merge nothing", and a pre-edit `git config user.email` check against the `alstjgg` account. Each ends with a boundary block instructing the executor to stop at the first cited-text mismatch and report — not search, adapt, or skip ahead — and declares such a report "a completed run, not a failed one".
- tension: The PRD format constrains an autonomous executor to exact, verifiable edits and treats a documented refusal to proceed on a stale citation as success rather than failure.
- quote: "An edit whose stated current text is not at the cited path and line is a defect in this document, not a puzzle to solve. Do not search for the text elsewhere."
- flags: boundary, requirement

### S11b-036 — PRD headers declare wave membership and cross-unit merge dependencies to drive parallelism
- source: planning/prds/g1-2-M2-species-display.md §header; g1-3, g1-4, g4-1 headers
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: PRD headers state wave and parallelism explicitly — g1-2's "**Wave 1**: may develop and merge in parallel with `g1-3`, `g1-6`, `g4-1` (no shared files)" — and encode ordering by shared file ("`g1-4` waits for this unit's **merge** (shared `dossier.ts`)"; g1-5 "runs alone"; g2-1/g2-3 "stamp after this unit merges").
- tension: The planning layer hand-authored the dependency DAG and parallelisation directly into each PRD header, keyed on file-disjointness, rather than leaving the harness to infer it.
- quote: "**Wave 1**: may develop and merge in parallel with `g1-3`, `g1-6`, `g4-1` (no shared files)."
- flags: decision, requirement

### S11b-037 — PRD change-lists were dry-run-verified on a scratch tree before handoff, catching missed edits
- source: planning/prds/g1-2-M2-species-display.md §header
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: g1-2's header records the "whole change list was dry-run-verified" on a scratch tree (`npm run test` green, `e2e/block-store.spec.ts` 25/25), and the dry run "caught a third species-word pin the original list missed — added as E5". g4-1 and g1-5 similarly report applying the full list to a scratch tree, verifying, then reverting.
- tension: PRD authoring included executing the edits before writing them down, using the trial run to find omissions the manual list missed.
- flags: measurement, decision

### S11b-038 — A PRD citation drifted by two lines; the executor's stop was ruled correct
- source: planning/prds/g1-2-M2-species-display.md §header (E5 correction); g1-4 §header (E7)
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: g1-2's E5 was first stamped off a scratch tree after E3/E4 had applied (`:401`); the real stamped tree said `:399`, and the executor stopped on the mismatch — "The executor's stop was correct." g1-4's E7 was re-cited after a false "line numbers hold" claim proved wrong: `g4-1` also edited `src/engine/index.ts`, shifting the target to `:179`.
- tension: The exact-citation protocol caught its own author's stamping errors, and the planning record explicitly vindicates the executor who refused to proceed on a wrong line number.
- quote: "The executor that stopped on the stale citation was correct."
- flags: failure, decision

### S11b-039 — g5-1 deleted the BLOCK STORE window entirely; the report became the pick surface
- source: planning/prds/g5-1-T1-store-dissolves.md §Outcome, §Scope
- date: 2026-08-08
- lanes: 3 AI-in-planning
- event: The BLOCK STORE window was removed — six files deleted, including `windows/block-store.ts`, `species-filter.ts`, `win-block-store.css` and its e2e spec and reference shot. The core loop survived through one moved affordance: clicking a mined sentence in REPORTS arms the pick, and the AGENT FILE's seat button consumes it; the slot board stays the only membrane owner and no new op path appears.
- tension: A whole window shipped by u4s was cut, justified by the store sending zero membrane ops — its only loop-critical job (arming the pick) was relocated into REPORTS.
- quote: "The BLOCK STORE window is gone. The desk is three windows."
- flags: pivot, decision

### S11b-040 — g3-1 removed the TALLY window; results dissolve into REPORTS and DEPLOY carries the turn
- source: planning/prds/g3-1-U3-ending.md §Outcome, §Design
- date: 2026-08-08
- lanes: 3 AI-in-planning
- event: The TALLY window was eliminated: at 21:04 the scored results appear inside the 현장 기록 (REPORTS) as an unmineable terminal record with the same ~9 s count-up, and the AGENT FILE's DEPLOY control becomes `NEW RUN — 다음 시행 · 08:50으로`. `score-tally.ts` "survives whole and moves house"; `run-state.ts` keeps its `'tally'` phase so `[u7#c1]` stays green with zero diff. The taskbar shows four windows.
- tension: A second window (the subject of u7's heaviest layout struggle) was dissolved, its logic relocated intact so the existing test suite stayed green — a scope cut framed as re-housing, not rewrite.
- flags: pivot, decision

### S11b-041 — g1-6 changed a single balance-as-data value: report `max_chars` 1200 → 700
- source: planning/prds/g1-6-T2-report-length.md §Outcome, §Scope
- date: 2026-08-07
- lanes: 3 AI-in-planning
- event: A one-value edit to `data/policy/report-guidance.json` bounded Call 3's `report_body` at 700 characters (was 1200) so the report fits the pause it arrives in and Call 3 gains latency margin under the 15 s ceiling. `facts.max_items`, both prose strings (prompt text that "is part of what was measured"), `min_chars`, and all tests were left untouched; no suite pinned `1200`.
- tension: The whole unit is one tunable moving in `data/`, exercising the balance-as-data rule the policy file itself promises ("값은 v0 초기치이며 게임플레이 실측 후 조정한다").
- quote: "값은 v0 초기치이며 게임플레이 실측 후 조정한다"
- flags: decision, measurement

### S11b-042 — g8-1/g9-1/g11-1 originate as fixes to 민서's 08-08 playtest failures
- source: planning/prds/g8-1-W1-sitting-stamp.md, g9-1-W3-mine-seat.md, g11-1-W4-one-deploy.md §Outcome
- date: 2026-08-08
- lanes: 3 AI-in-planning
- event: Three PRDs cite the same playtest: W1 — "민서's playtest opened on ECHO-2" (uncleared `sessionStorage`); W3 — the 08-08 "does not work" was three silent failures in the core mine-and-seat gesture; W4 quotes 민서 directly on the one-button loop. Each converts a specific playtest observation into a scoped single-commit fix.
- tension: The implementation-phase PRD stream is driven by a human's hands-on playtest, with the player's own words carried into the PRD as the requirement.
- quote: "The Agent File has the DEPLOY button at first. Then, when the simulation finishes, it turns to NEW RUN. No need for two buttons."
- flags: requirement, failure

### S11b-043 — g15-1 chose attribution-without-explanation after declining three reasoning-rendering alternatives
- source: planning/prds/g15-1-U54-cited-slot-annotation.md §Why
- date: 2026-08-08
- lanes: 1 AI-in-the-game
- event: 민서's 08-08 ruling declined three alternatives that rendered the agent's reasoning (the stance `desc` counterfactual, the rejected stance, and `inner_note`/`rejected_reason` verbatim); the agent's feed line instead carries only the slot numbers it cited (`인수인계 02`). The choice was backed by a measurement over 110 live-arm probe calls carrying a deployed block: 88.2% cite only real deployed ids, 9.1% only fabricated, 2.7% nothing, 0% mixed — so a fabricated id resolves to no slot and prints no mark.
- tension: A design decision about what the LLM's output reveals to the player was made on measured citation-fidelity data; the failure mode of the model (fabricated ids) is silence, not a lie.
- quote: "the player should deduce the how, not be told it."
- flags: decision, measurement

### S11b-044 — g12-4 (T3 desk-prose) is a comment-only unit; any executable change means the PRD is wrong
- source: planning/prds/g12-4-T3-desk-prose.md §Outcome, §Scope
- date: 2026-08-08
- lanes: 3 AI-in-planning
- event: The unit changes nothing the player sees: it rewrites `layout.ts` and three other files' comments to describe the three-window desk that exists instead of five windows, a BLOCK STORE column and a floating TALLY. Scope forbids changing any executable line — "**Every edit in this unit is inside a comment.** If an edit would change a declaration, an expression or a CSS rule, the PRD is wrong — stop." The originally-planned T1+T3 rect/quarantine work "already landed with T1".
- tension: A dedicated unit exists solely to make stale in-code prose match the code, after scope cuts (g5-1, g3-1) left comments describing windows that no longer exist.
- flags: decision, boundary

### S11b-045 — hf2 is proved only at the driver seam under vitest, invisible to the whole e2e suite
- source: planning/prds/hf2-past-sentences-stay-minable.md §Why, §Design
- date: 2026-08-08
- lanes: 3 AI-in-planning
- event: A past sitting's sentence being unminable on a later day was a membrane-level refusal (`bindLiveRun` builds a fresh `createBlockStore()` per run; `seedCarried` seeds only deployed blocks). The fix seeds past sentences into the store's `seen` tier only — minable without becoming deployed, so the membrane rule holds. Because the DEV fixture loop's store is one flat object surviving `new_run`, mining a past sentence already works there — "the same blind spot that hid H1 and H2. This unit is proved at the driver seam under vitest and nowhere else."
- tension: A live-path bug was structurally invisible to the browser suite because the fixture differs from the live driver; a green e2e run "says nothing about it".
- quote: "This unit is proved at the driver seam under vitest and nowhere else — a green browser suite says nothing about it."
- flags: boundary, failure
