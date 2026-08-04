# DISCOVERY

Findings the client build must **not** fix inline. `docs/` (specs, design
target) and the scenario pack are provided inputs — nothing here edits them.
Each unit appends under the section that fits; the integrator consolidates.

Entry form: `- [<unit>] <finding> — <impact> · <who resolves it>`.

## Spec gaps

- [u0] `src/shared/segment.ts` does not exist. `docs/spec-client.md` §5.4 states
  the report-body segmenter "lives in `src/shared/`, is called by engine,
  fixture generator, and probe alike (invariant 12 made structural), and carries
  a golden test", but `src/shared/` currently holds only `contracts.ts` and
  `datapack.ts`. Any unit that needs sentence-level segmentation of a report
  body has no shared implementation to call and must not mint a client-local one
  (that would break invariant 12) — it is blocked until the module lands.
  **RESOLVED 08-04 by PR #114 (merge 9740519), recorded by [u11].** The module
  landed on `main` and came in with the run base; its confirmed signature is
  `segmentReportBody(body: string): string[]`, and C13 makes it a provided input:
  consume it, never modify, stub, mock or patch it. The finding above is kept as
  written because it is why u2/u3 were blocked at the time.
- [u0] The physical **§3.7** pack-copy plugin is unbuilt. `spec-client.md` §2.1
  routes `data/scenario/<slug>/` into the browser "via the physical §3.7 copy
  plugin — **unbuilt**, see §9", and `vite.config.ts` carries no plugin at all.
  Consequence for this unit: the built `dist/` contains no scenario pack, so the
  e2e harness cannot boot a pack-driven build. Adding the plugin is explicitly
  out of scope here (u0 hard constraint c9) — whoever owns §3.7 adds it.
  **RESOLVED 08-04 by PR #114, recorded by [u11].** The plugin (`dday-data` in
  `vite.config.ts`) landed upstream and `npm run build` now emits
  `dist/data/{scenario,policy}`; `e2e/preview-smoke.spec.ts` verifies the built
  desk fetches its pack from there. Still upstream's file — this run owns no
  change to it — and see the `_schema/` finding under Seam friction.
- [u0] The PRD's "**memory-only**" persistence line
  (`docs/plan-client-build.md` §1, citing spec §7 #8) is **stale**. The ratified
  decision is `sessionStorage` for meta-state — `spec-physical-architecture.md`
  §1.1 (decided 08-03), echoed by `spec-client.md` §9 and §5.2. Units follow
  `sessionStorage`; `localStorage` stays forbidden either way. The PRD sentence
  is the thing that is wrong, not the spec.
- [u1] `.claude/super/units/u1/design.md` and `.../spec.md` are **stale**: both
  describe run `20260725-025242`'s u1 (the `demos/apothecary` stub AI adapter +
  boot factory), not this run's u1 (client stylesheets). Only `status.json` was
  refreshed for run `20260803-213143`. The TEST suite was written against
  `.claude/super/units/u1.md` (the contract) + the design reference slices, and
  ignores the stale DESIGN artifact — whoever owns the unit-artifact writer
  should stop reusing a unit dir across runs, or stamp `run_id` into design.md.

- [u11] **§7 #3 has no seam event to observe.** The item asks for the gate's
  judgment (delta → bucket → edge) to be observable in the debug pane while only
  its symptoms reach the player pane. Measured 08-04: the ratified §5.2 union in
  `src/shared/view-driver.ts` carries no judgment/gate event at all, so the pane
  can only show the raw stream the gate produced — `e2e/acceptance.spec.ts` #3
  asserts exactly that and nothing more. Minting an event type to close the gap
  would be inventing seam surface, which this unit may not do; whoever ratifies
  the next §5.2 revision decides whether a `judgment` event exists.
- [u11] **C16 — the sim-clock test hook is the FIRST of this unit's two
  production edits.** u2's charter promised "clock pause/seed + animation-freeze hooks" and
  only the freeze half shipped. `installClockHook` / `clockHookOf` / `ClockHook`
  now complete it on `driver/test-hooks.ts`, re-exported from the driver barrel
  and installed by `shell/boot.ts` onto `__shell.clock` behind
  `import.meta.env.DEV` — inv 11 still binds, and `e2e/preview-smoke.spec.ts`
  greps the built bundle for the name. It is what lets §7 #6 and the two TALLY
  captures REACH 21:04 instead of racing the clock at ×4. **This entry used to
  say "this unit's one production edit" and that was wrong**: the debug pane's
  skin (below, `src/client/debug/pane.{ts,css}` — u9d's module) is a second one,
  made under a carve-out rather than routed. C16 sanctions the hook; **C21**
  sanctions the other. The two entries contradicted each other until
  integration; corrected here so the count is honest · 민서.
- [u2f/u11] **Species is channel-derived, and the design target disagrees.**
  u2f recorded seven report sentences the reference hand-classifies against
  their channel (`b-r2-f02`/`b-r2-f07` as `quote`; `b-r1-b06`, `b-r2-b03`,
  `b-r2-b06`, `b-r3-b05`, `b-r3-b06` as `emotion`). spec-client §5.2 wins —
  species derives from the channel, never from classification — so the fixture
  ships `fact`/`selfnarr` and the reference's species column is read as
  decoration. Carried up here because it is a standing spec-vs-reference tension,
  not a u2f-local decision: channel `u` (Call-1 utterance → `quote`) exists as a
  fifth minted channel (C13) and any later classifier must not re-open it.
- [u11] **C5(e) — the DoD wording changed, and PR #110's body must say so.**
  "Full suite green, fixture mode" is now, honestly: a **dev-hosted** acceptance
  suite (§7 #1–#12 against `npm run dev`, because fixtures are DEV-only) plus a
  separate **preview smoke** against `npm run preview` for the artefact truths —
  pack from `dist/data/`, zero third-party requests, no debug or fixture code in
  the bundle, ~1 s load budget.

<!-- consolidated by the integrator from discovery/{u2f,u3,u4,u4s,u5,u6,u7,u9}.md
     (P1-F). Every per-unit entry is preserved; identical reports across units
     are merged into one bullet carrying all reporting unit ids. -->

- [u4] **`FixtureRun` cannot seed an initial store.** The design demo opens with
  two pre-slotted r2 blocks, but `createFixtureDriver` starts `slots={}` and the
  run file offers no seeding field, so u4 renders the opening (empty) store and
  reaches the two-slotted state only through ops (`window.__agentFile`, or the
  operator's drag/click). If the demo run is meant to open mid-편성, `FixtureRun`
  needs an initial-store field · seam owner.
- [u4] **`meta.carried` is `string[]`, not `Sentence[]`.** Carried blocks arrive
  as bare ids, so a carried block cannot be rendered with its own text until a
  `report` event re-introduces it. u4 covers it with the D13 index + the F1
  fallback card (`(원문은 부검 기록에 있습니다)`) — a normal opening state of a run,
  not an error path. Either `carried` carries sentences, or the seam ratifies the
  fallback as the intended reading · seam owner.
- [u4] **No `new_run` ViewEvent.** `MembraneOp` has `new_run`; the in-channel has
  no counterpart, so a deployed (locked) file has no explicit unlock signal. u4
  infers it (D10): a `meta` whose `run` differs from the run the file deployed
  for unlocks the board. An explicit event would not depend on `meta` being
  re-emitted · seam owner.
- [u4] **`Clock` exposes no `start`/`end`.** The `RUN nn · HH:MM` stamp needs the
  run's opening stamp, so the window re-reads the pack (`fetchScenarioIdentity`),
  duplicating the shell's own read. `Clock` exposing its band removes the second
  fetch · seam owner.
- [u4/u4s/u6] **`Sentence` carries no clock or source field**, so the reference
  card's `· at · src` provenance chips and the REPORTS fact column's time cannot
  be rendered. `win-reports.css` prints `.facts li` as `counter | .f-t |
  sentence` and the reference fills `.f-t` with the fact's `at` stamp; the §5.2
  shape is `{id, text, species, axis?}` and the fixture's `FactRow.at` never
  crosses the seam. The port renders an empty `.f-t` and the card prints `런 nn`
  alone rather than inventing a time. Whoever ratifies the next `report` shape
  decides whether the objective log carries its clock · seam owner.
- [u4s] **No "was slotted in an earlier run" flag exists at the seam**, so
  `archived-highlight` is derived from `meta.carried` membership (design D9). The
  e2e asserts carried ⇒ `.archived`, freshly-mined ⇒ not `.archived`.
- [u4s] **`cardStateOf` precedence had to be chosen** — `slotted` > `at-cap` >
  `archived` > `in-store`. `BlockCardState` is a single union and a full board
  outranks the archive mark because it is the state that blocks the interaction.
  Recorded because neither spec nor design ranks them.
- [u5] **`window.__feed` needs `seek` / `rate`, and the unit spec does not say
  so.** `.claude/super/units/u5/tests.md` lists `createRunFeed` with
  `{count, kinds, stamps}` only, but `e2e/live-feed.spec.ts:103,111` requires
  `__feed.seek(at)` and `__feed.rate(0|1|4)` — load-bearing, since design D13
  makes `seek` the only way to reach 21:04 inside an e2e budget. Both delegate to
  the driver clock ([u5#c6] forbids a window-owned timer), so the window file is
  their home. Fold them into the unit spec's export list · unit-spec owner.
- [u5] **`FALLBACK_CLASS` is a required export that cannot be imported.**
  `tests.md` requires `fallback-notice.ts` to export it ([u5#c5](a));
  `run-feed.ts:23` imports it, never uses it, and `tsc --noUnusedLocals` fails
  with TS6133 — so `npm run check` / `npm run build` disagree with a bare
  `vite build` about whether the unit builds. The export's consumer is the TEST,
  not `run-feed.ts`, and the unit spec reads as though the reverse were true.
- [u6] **The fixture streams one `report`, so the archive rail had nothing behind
  it.** `meta.archive` lists RUN 01/02 but `woodari-run03.ts` streams round 3
  only (u2f's own ruling), making [u6#c4] ("switching runs keeps mined and
  previously-slotted marks correct by id") untestable and every archived segment
  empty in the product. `demo-run.ts` composes the two missing `report` events
  from the fixture's own `reportOf(1)` / `reportOf(2)` exports — no content
  originates in u6. **The composition belongs in u2f's stream, not in a
  consumer**; when it moves there `demo-run.ts` collapses to
  `return fixtures.woodariRun03` and u6 needs no change · u2f.
- [u6] **The animation pump stops with the clock, and the report lands exactly
  then.** `fixture-driver.advance()` returns early on `!clock.running`, so
  `tickAnimations` never fires once the clock reaches the run's terminal minute —
  but the round report is released BY that minute
  (`release(clock.ended ? null : …)`), so a typewriter driven off
  `registerAnimation` (which §3 inv 5 and the no-own-timer guard require) would
  freeze on its first frame in real play. The e2e never saw it because every spec
  drains the stream first, at 08:50, with the clock still live. Worked around in
  `report-view.ts` with a `pumped()` predicate. **Owner action (u2/u11):** tick
  animations after the clock has stopped, or release the closing `report` one
  minute before the terminal stamp.
- [u7] **§5.1's `deploy` edge has no event.** The state machine names `BUILD →
  (deploy) RUN`, but `deploy` is a `MembraneOp` and the ratified seam echoes no
  event for it, so a write-free run state cannot see it. `shell/run-state.ts`
  uses the observable equivalent — the run has begun once the sim clock has left
  the minute the run opened on. A `deploy` echo (or a `run_start` event) lets the
  gate go away · seam owner.
- [u7] **`score` carries no per-axis prose, delta, baseline or verdict.**
  `{type:'score'; total; rows:{label; value:number}[]}` cannot express the
  reference's eight ruled lines (`진입 200 · 사망 7 · 부상 19` vs `기준 진입 812 …`,
  ▲/=/▼). u7 renders one row per `score.rows[]`, fills `.tr-b`/`.th-b` from the
  pack (`score.json` `units[].baseline`, matched by label) and prints every delta
  as `flat`, because nothing on the seam ranks a row against its baseline.
  Proposal: `rows:{label; value; text?; baseline?; delta?}` plus an optional
  `verdict` on `score`. The verdict stamp renders but stays empty until then; its
  cadence step still fires, so [u7#c2]'s timing is unaffected · seam owner.
- [u7] **The headline caption is not on the seam.** `score.total` arrives without
  saying what it counts; `windows/tally.ts` ports `사망 / 명` from the design
  target (`data.js TALLY.headline`) as a constant. A `headline` on the `score`
  event (or in `score.json`) would make it authored data · seam owner.
- [u7] **The loop fixture's `meta.archive` includes the run just opened.**
  `windows/reports.ts` (`railEntries`) already synthesises an unlabelled rail
  entry for any filed round the archive does not list, so during RUN 03 the rail
  already shows three entries and [u7#c5]'s `archive.length > railBefore` can
  only hold if the next run's archive lists the current run too. Side effect:
  after NEW RUN the rail selects the newly opened run, whose autopsy is empty
  until 21:04, where the reference selected the run just filed. If the run-loop
  manager settles the `meta.archive` semantics the other way, u6's `railEntries`
  should drop the synthesised entry in the same change.
- [u7] **The taskbar's `open` mark goes stale** when a unit toggles `.hidden`
  directly: `window-manager.ts` syncs the taskbar only from its own events and
  exposes no open/close API. A `desk.open(key)` / `desk.close(key)` on
  `WindowManager` would fix it for every unit that needs to raise a window · u3.
- [u3] **PLACEHOLDER boot stream (C3).** `shell/boot-run.ts` mints the
  `FixtureRun` the shell opens on — opening stamp `13:05` (the design target's
  own mid-run open) and a single `meta` event (`run 3`, `runs_left 7`). Marked
  PLACEHOLDER in code; no test asserts its values, only the relations between
  them. It is the only synthetic content the shell owns, and u2f's authored run
  replaces it.
- [u3] **`window.__shell` is a dev/test handle** (`{frame(), drain()}`, straight
  delegation to the driver), pinned by the TEST phase as the only way to prove
  the clock is driver-fed. **It ships in the player build today; u11 was to
  decide whether to gate it behind `import.meta.env.DEV`.** Measured by the
  integrator on the merged tree: `window.__shell={frame:…,drain:…}` is present in
  `dist/assets/index-*.js`, and `e2e/preview-smoke.spec.ts`'s inv-11 needle list
  (`debug-pane` · `woodari` · `createFixtureDriver` · `freezeAnimations` ·
  `installClockHook`) does not cover it. Invariant 11 as written binds the debug
  pane only, so this is an open decision rather than a proven violation.
  **RULED at integration (08-04), the way inv 11 rules the pane: a surface that
  exists to test the desk does not ship with the desk.** The whole
  `window.__shell = {…}` assignment now sits behind `import.meta.env.DEV` in
  `shell/boot.ts` (it previously wrapped only the C16 `clock` line, which is how
  `frame`/`drain` kept shipping), and `__shell` joins the inv-11 needle list so
  nothing can put it back unseen. No spec changes: the e2e unit host is a
  `--mode development` build, where the handle is still installed. Note this
  gates u3's handle ONLY — `__feed` / `__tally` / `__agentFile` / `__threads` are
  the same class of dev handle and are still in the player bundle, which is a
  wider decision than the one routed here · 민서 / u3.
- [u9] **PRD §4 and `units/u9.md` disagree on the fourth invariant.** PRD §4 names
  inv 1 · 2 · 10 · 8 for P1-D; `units/u9.md` c4 replaces inv 10 with **inv 12**
  (seam integrity) and never mentions inv 10. The suite follows the unit
  contract; nothing is lost (inv 10 is covered by
  `tests/assets/no-third-party-url.test.ts`), but the two documents should be
  reconciled.
- [u9] **inv 2 could not bind its real target at u9 time.** LIVE FEED
  (`src/client/windows/live-feed.ts`) was still a u3 stub, so no
  `.fl-npc`/`.fl-symptom` node existed at runtime; the assert is universally
  quantified over what exists and tightens by itself at u5. The same holds for
  the membrane-op a11y assert — `[data-op]` controls arrive with u4/u6/u7.
- [u9] **`vitest.config.ts` runs `environment: 'node'`**, so the "…and rendered
  DOM" clause of [u9#c1] and the selector-scoped clause of [u9#c2] cannot live in
  `tests/invariants/`. Their browser halves are in `e2e/a11y.spec.ts` (`inv 1 ·
  rendered DOM`, `inv 2 · rendered DOM`), the only browser file u9's globs allow.
  At u11 they may want their own spec files.

- [u1] **The design read-scope slice stops 5 lines short of the file.** The unit's
  reading scope lists `docs/design/phase2-ui/desktop.css` up to `549–612 (tally +
  toast)`, but the file is **617** lines: `#toast.on` (615) and `body.booting .win`
  (617) sit outside every listed slice. Both are load-bearing — the toast never
  shows without `.on`, and windows flash before the boot sweep without
  `body.booting` — and were ported anyway. Slice authors should end a range at the
  file's end, not at the last section heading · unit-spec owner.
  (`discovery/u1.md` §4)
- [u2] **§5.2 `meta` is explicitly provisional and the driver cannot narrow it.**
  The ratified fence carries `// exact meta shape settles when 윤석 builds the
  run-loop manager`, ported verbatim per [u2#c8]. The fixture driver therefore
  treats `meta` as an opaque pass-through with no clock stamp — it rides the stamp
  of the preceding stamped event (see the stamp-inheritance entry). If the run-loop
  manager later gives `meta` its own stamp, `stampOf()` needs one more branch ·
  윤석 / whoever ratifies the next §5.2 revision. (`discovery/u2.md` §2)

## Seam friction

- [u2] The u2 worktree carries no `.claude/super/units/u2.md` and no
  `units/u2/design.md`/`spec.md` — the unit's own contract and API design were
  not materialised on disk, only in the agent brief. Consequence: the TDD-Red
  suite had to **define** the fixture-driver runtime surface (`createFixtureDriver`,
  `createClock`, the freeze/seed hooks, `assertSeamClean`) rather than test an
  agreed one; that surface is written up in `.claude/super/units/u2/tests.md`.
  If a later unit disagrees with a name there, the tests move with it — the
  orchestrator owns re-materialising unit contracts into the worktree.
- [u2] §5.2 ratifies the seam types but nothing ratifies the **driver runtime**:
  §5.4 describes a fixture run file ("ordered `ViewEvent[]` … plus canned
  responses") without an interface, and §8 assigns the reference clock loop to
  the driver without naming its controls. `MS_PER_SIM_MIN = 105` and the
  ×1/×4/pause rates are ported verbatim from `docs/design/phase2-ui/app.js`;
  the pause/seed/animation-freeze hooks required by PRD §5 u2 have no spec text
  at all. Whoever owns the live driver should confirm the same shape before
  fixture and live modes are claimed pixel-identical (invariant 12).

- [u0] e2e runs against **`npm run dev`** (`--port 5174 --strictPort`), not
  `vite preview`. `preview` only serves an existing `dist/`, and — per the §3.7
  gap above — that `dist/` has no scenario pack, so a preview-served run cannot
  fetch one. The dev server also means the e2e gate never depends on a prior
  `npm run build`. **u11 must revisit this** when it binds the full acceptance
  suite: once §3.7 lands, the acceptance run should exercise the built site that
  judges actually see, and the `webServer` command should move to
  `npm run build && npm run preview`.
  **RESOLVED 08-04 by the C5 split (ruled 민서), recorded by [u11].** Not the way
  the entry expected, and the difference matters: the preview directive was about
  ARTEFACT TRUTHS, never about the fixture round. `driver/demo-run.ts` returns
  null when `!import.meta.env.DEV` (inv 11 / §5.4), so a player build boots an
  empty desk and the §7 round CANNOT run on it. C5(a) therefore hosts §7 #1–#8 on
  `npm run dev`, and C5(b) adds a separate `npm run preview` smoke for the built
  artefact. Both are wired as two Playwright projects with their own servers.
- [u0] `vitest run tests/scaffold` without a root `vitest.config.ts` also
  matches `demos/apothecary/tests/` and `demos/darkest-context/tests/`, so a
  per-unit slice would gate on unrelated demo suites. The root config now pins
  `include: ['tests/**/*.test.ts']` and excludes `demos/**` and `e2e/**`. Demo
  suites keep their own configs and are not run from the repo root.
- [u0] The Playwright runner is imported from `playwright/test`; `@playwright/test`
  is deliberately **not** a dependency (it is a thin re-export of the same runner
  that ships inside `playwright`). Keeping one package keeps the devDependency
  allowlist at `vitest` + `playwright`.
- [u0] `@types/node` was added as a devDependency beyond the PRD §2 pair: the
  structural suites and both runner configs read the repo from disk
  (`node:fs`, `node:path`, `process.env`) and do not type-check without it. It
  is test-only — `tsconfig.json` (the product build) still resolves `src/` with
  `types: ["vite/client"]`, and `tsconfig.core.json` is untouched.

- [u11] **REAL seam break `u2f-base/no-third-party-url-b` — the deploy artefact
  publishes authoring-only JSON Schemas.** The §3.7 pack-copy plugin copies
  `data/scenario/` wholesale, so `dist/data/scenario/_schema/*.json` ships ten
  `"$schema": "https://json-schema.org/draft/2020-12/schema"` identifiers and
  inv 10's dist grep reads them as third-party URLs. They are meta-schema
  IDENTIFIERS — never dereferenced, the same class of string as the `www.w3.org`
  XML namespace already on that suite's allowlist — and the schema files are
  frozen inputs. Reconciled test-side with a deliberately narrow exemption (the
  `$schema` keyword, in a file under `dist/data/`, and nothing else). **The real
  fix is not this unit's**: the published set should exclude `_schema/`, which is
  a `vite.config.ts` edit inside upstream's §3.7 plugin — routed to the plugin's
  owner (ledger owner `u0`; the plugin arrived with PR #114 and C20 freezes this
  run's base).
- [u11] **C19 bookkeeping — "base 7/13 red" is seven FILES, thirteen TESTS.**
  The raw record is `discovery/u2f.md` §5: "7 files / 13 tests already red before
  this unit". All thirteen were red; the seven is a file count. The ledger
  (`tests/acceptance/seam-ledger.ts`) reconstructs them test by test and lands on
  exactly those numbers, so `RED` reads 13 and `RED_FILES` keeps the 7 —
  a stricter completeness assert than the compressed reading, not a looser one.
- [u11] **C12/C17 re-aims — every stale unit-scoped assert, and the assert it
  re-aimed.** None was deleted, excluded or `.skip`ped; each measures its own
  unit's merge range through `tests/acceptance/unit-range.ts`:
  · `tests/scaffold/layout.test.ts` — u0's empty-modules census (2 asserts), now
    measured over u0's own `src/client/` diff.
  · `tests/scaffold/deps.test.ts` — u0's frozen-scripts assert; `check` gained
    `&& npm run test:shared` from upstream PR #114, not from u0.
  · `tests/styles/index-order.test.ts` — u1's nine-sheet manifest census and the
    "fonts.css slot left for u10" pair, measured on u1's own `index.css`.
  · `tests/styles/hard-constraints.test.ts` — u1's "no @font-face / no font file
    / no public/assets/fonts" trio, measured on the sheets u1 shipped.
  · `tests/styles/token-lint.test.ts` — the `@font-face` declaration site is
    exempted, exactly as u9's repo-wide inv-8 assert already exempts it (u9
    reported this defect and deliberately left it for the barrier).
  · `tests/assets/fonts-css.test.ts` — u10's "u1 sheets untouched" hash census
    was measuring **u3**'s later `shell.css` edit; now measures what u10's own
    merge touched under `styles/`.
  · `tests/driver/replay-order.test.ts` — u2's "fixtures/ holds two files", which
    u2f and u7 filled by contract (u2f flagged this itself, §1 of its DISCOVERY).
  · `tests/shell/shell-source.test.ts` — u3's "the windows are stubs", which u4–u7
    were commissioned to fill.
  · `tests/shell/no-free-text.test.ts` — u3's "nothing fakes a button": u6's
    mineable sentence is an inline phrase in flowing prose carrying the COMPLETE
    ARIA button pattern (role + tabindex + Enter/Space + aria-disabled). The
    assert now measures the intent — a node claiming the role must be focusable
    and key-operable — instead of banning the role outright.
  · `tests/scaffold/e2e-config.test.ts` — u0's `(a)` "exactly one project" and
    `(c)(d)(d2)` single-`webServer` shape, invalidated by the **C5 split**: the
    run now declares three hosts and `webServer` is an ARRAY. Re-aimed to the
    intent — chromium-only on every host, the 5174 unit host still a
    build+preview and never the dev server, the production `preview` host
    carrying no `--outDir`, exactly one dev host and it fenced to the DEV-only
    `acceptance`/`captures` specs, and a 1:1 agreement between every project's
    `baseURL` and a started server.
  · `tests/windows/tally.test.ts` — u7's `(g)` blanket
    `expect(config).not.toMatch(/npm run dev/)`, which after C5(a) contradicts a
    ruling (the §7 fixture round is DEV-only by inv 11 and can run nowhere
    else). Re-aimed to u7's actual intent: the host **u7's own specs** run on —
    the `chromium` project's 5174 server — is a real build, and the dev host is
    fenced away from it.
  · `tests/assets/no-third-party-url.test.ts` — u10's inv-10 grep rebuilt `dist/`
    from inside vitest, where `NODE_ENV=test` is inherited and beats `--mode`, so
    the artefact it greped was a DEV-flavoured bundle (fixtures included) and the
    one it LEFT BEHIND turned `tests/fixtures/dev-only.test.ts (d)` red on the
    next run. `NODE_ENV` is now pinned to `production` for that child build.
  · `tests/debug/flag-off-bundle.test.ts` — u9d's hermetic check build moved out
    of `dist/flag-off-check/` to `dist-flag-off/` (and pins `NODE_ENV` the same
    way). Nested under `dist/` it was greped by the inv-10 walk as if it were the
    artefact and raced that suite's `rm -rf dist` inside a single `vitest run`.

- [u11] **`npx vitest run` clobbered `dist/` — u4s finding 19, promoted from
  nuisance to gate failure by the C5 split, fixed test-side.** u4s recorded that
  a suite rebuilds into a `flag-off-check` layout and leaves no `dist/index.html`,
  "harmless for CI ordering today". C5(b) then made `dist/` a SERVED host
  (`npm run preview`), and the [u11#c4] order — `npm run build && npx vitest run
  && npx playwright test` — runs the clobbering suite between the build and the
  host that serves it. Two test-side builds were writing into `dist/`; both were
  made hermetic (above), so a full `vitest run` now leaves `dist/` exactly as
  `npm run build` produced it. No production module changed.
- [u11] **Real inv-8 break, fixed at the owning module: the debug pane's inline
  skin.** `src/client/debug/pane.ts` carried four hex literals and a `font:`
  shorthand in a template string (C11 / inv 8 admit none outside a stylesheet).
  The skin moved to `src/client/debug/pane.css`, all tokens, imported `?inline`
  and injected into the pane's own `<style>` — so the pane stays self-contained
  and still rides the flagged chunk out of the player build.

  **CARVE-OUT, and what this entry got wrong.** It read "Owner u9d; recorded here
  because u11 did not commission it", which describes REPORTING the break and
  routing it — and [u11#c8] says u11 reports and routes, never edits another
  unit's production module. The diff did the edit anyway: `pane.ts` lost its
  inline CSS template and `pane.css` is a new production file, both u9d's. The
  work is kept rather than backed out — reverting re-reds inv 8 at a module whose
  owning unit has already merged, and the fix is the one u9d would have made —
  but it is kept as an **explicit carve-out, not as routing**: u11 made TWO
  production edits (the C16 hook above and this skin), the second into another
  unit's module. The seam ledger still names u9d as the OWNER of the break, which
  is why `[u11#c14] (i)` stays green; ownership of the break and authorship of
  the fix are not the same thing.

  **Where the ruling lives (INT-10 follow-up).** This entry used to be the only
  place the carve-out existed, which made the change that needed the sanction the
  same change that asserted it. The ruling is now recorded where every other
  ruling of this run is — `.claude/super/CONSTRAINTS.md` **C21**, alongside C16's
  sanction of the other u11 production edit. C21 names the two paths
  (`src/client/debug/pane.{ts,css}`), scopes the carve-out to the single skin
  move, keeps the break's ownership with u9d, and states that this makes two
  sanctioned u11 production edits. Read C21 as the authority; this entry is the
  narrative · 민서 / u9d.
- [u11] **The DEV debug pane steals the pointer over the desk's bottom-left
  quadrant — a HARNESS-STATE artefact, ruled the same way C14/C15 rule it for
  captures.** `vite.config.ts` folds `__DEBUG_PANE__` to `mode !== 'production'`,
  so every e2e host except `preview` boots with u9d's pane mounted at
  `left:0; bottom:0; max-width:46vw; max-height:42vh`. Measured on the merged
  tree: LIVE FEED sits at 14,94 · 339×692, so its corner grip (337,770) and the
  lower third of its body are UNDER the pane, and a press there lands on a
  `<th>` of the pane's event table. That is what made u3's "every window resizes
  by its corner grip" and "a pointer press anywhere in a window raises it" read
  as port defects: with the pane hidden both pass unchanged, and the pane is
  absent from the player bundle by inv 11. `e2e/fixtures/dev-surface.ts` now
  hides it for the specs that MEASURE the desk (shell, a11y); `e2e/debug-pane.spec.ts`,
  which owns the pane's own contract, never calls it. No production change.
- [integration] **inv 11 covered one dev handle and missed its four siblings.**
  Closing INT-4 gated `window.__shell` behind `import.meta.env.DEV` and added
  `'__shell'` to `e2e/preview-smoke.spec.ts`'s inv-11 needle list — but the rule
  `shell/boot.ts:116` adopted in the same breath ("a surface that exists to test
  the desk does not ship with the desk") named a CLASS, and only one member of it
  was closed. Measured on a real `npm run build`: `dist/assets/index-*.js` still
  carried `window.__feed=`, `window.__tally=`, `window.__agentFile=` and
  `window.__threads=`, so the gate could see one handle and not the four next to
  it. All four assignments now fold away outside DEV
  (`windows/live-feed.ts`, `windows/tally.ts`, `windows/agent-file.ts`,
  `shell/boot.ts`) and all four names joined the needle list, so the check and the
  rule finally cover the same set. Two notes on the shape of the fix:
  `createThreadLayer()` carries the MOUNT side effect, so the call stays
  unconditional and only the returned handle is gated — `const threads = …; if
  (import.meta.env.DEV) window.__threads = threads`; and every spec that drives
  these handles keeps working untouched, because the e2e unit host and the dev
  hosts are `--mode development` builds (C5(a)/(b) — the preview smoke is the only
  host that sees a player build, and it is the one asserting their absence).
- [u11] **C12/C17 re-aims, second pass — the browser oracles the finished desk
  invalidated.** Same rule as the pass above: nothing deleted, excluded or
  `.skip`ped, each re-aim annotated `C17 / [u11#c12] — RE-AIMED` at its site.
  · `e2e/a11y.spec.ts` — (a) the five-region census now counts with
    `includeHidden`, because `#w-tally` boots `class="win hidden"` until 21:04
    and C15 rules that CORRECT; the count is still five. (b) the focus-indicator
    sweep reports a control with NO LAYOUT BOX as phase-held instead of counting
    it unringed — `el.focus()` is a no-op on `display:none`, so the three
    "failures" were the tally's own bar and its two controls. (c) `tabWalk`
    records positions in the surface's CONTENT frame: tabbing below the fold
    scrolls AGENT FILE's body (956 px of content in a 662 px window), and two
    stops read in different scroll states are not comparable.
  · `e2e/shell.spec.ts` — the same phase-held treatment for its focus-ring sweep.
  · `e2e/debug-pane.spec.ts` — "the desk keeps all five windows" now asserts the
    tally is ON THE DESK (attached, held only by its own phase class).
  · `e2e/red-thread.spec.ts` — the MID-drag endpoint is compared to what the
    WINDOW did, not to what the pointer asked for. u3's drag clamp
    (`window-manager.ts:105`, `maxY = innerHeight - height + EDGE_SLACK`) leaves
    AGENT FILE 54 px of downward travel at the finished arrangement, so a 60 px
    pull moves the window 54 px and a perfectly-tracking string measured 54.
  · `e2e/reports.spec.ts` — (a) the archive rail carries one segment per run the
    desk KNOWS (archive ∪ filed reports): u7's loop keeps the archive to the days
    BEFORE the current one and files the current day's report as it ends, so the
    rail is legitimately one longer after a drain. (b)(c) the two "switch runs"
    oracles now TAKE the second run through the loop (`fileAnotherRun` — drain →
    NEW RUN → drain) instead of assuming the fixture opens with two documents,
    and the "did the document change" step reads the rail's own selection,
    because u7's loop files the same autopsy every day and spec-client §5.2's
    amendment makes that correct ("same sentence = same block across runs").
  · `e2e/fonts.spec.ts` — see the payload entry below.
- [u8/u11] **The one test that was still skipping, and the guard that could not
  see it — both closed at integration (08-04).** C17 binds #110 to ship with no
  test excluded OR skipped. The tree carried exactly one skip:
  `e2e/red-thread.spec.ts`'s `test.skip(!scrolled, …)` — and its subject is
  [u8#c3] itself ("scrolling a source sentence out of its `.win-body` removes
  that path"), so the criterion went unexercised in the full playwright run.
  Two independent faults met here:
  · **the skip's stated reason was false, and it fired on EVERY run.** It read
    "the REPORTS body does not overflow in this run — nothing can scroll out of
    view". Measured on the finished desk: REPORTS overflows fine — the first two
    threaded sentences land in `article.doc.doc-facts`, scrollHeight 491 over
    clientHeight 298, 193 px of travel. What the setup scrolled was `.win-body`,
    and `.win-body` is `overflow-y: hidden`; `scrollTop` on it is a no-op, so the
    condition was unconditionally true and the case NEVER ran, on any machine, in
    any run. REPORTS puts its two documents in `article.doc` columns and those
    are the scrollers. The case now finds the sentence's own scroller and moves
    it the MINIMUM needed to lift that sentence past `body.top + THREAD_CLIP_PAD`
    — minimum, not to the end, because the second sentence sits below the first
    in the same column and must ride up and stay visible for the "count −1, no
    stray line" claim to mean anything. Every unreachable branch returns a reason
    and fails the setup assert, so an un-settable run is red, not green.
    Verified: 3/3 with `--repeat-each=3`.
  · `tests/acceptance/seam-reconcile.test.ts (m)` exempted "the conditional guard
    form" and its `DISABLED` regex required a quote straight after the paren —
    so `test.skip(cond, …)` could never match it BY CONSTRUCTION, and the ledger
    reported a clean tree while a criterion was being skipped. (m) now counts
    conditional skips too, against an explicit allowlist that is EMPTY. Anything
    added to it must name the criterion it leaves unmeasured and appear here.
- [u11] **C17 re-aims resolve their ranges through MERGE COMMITS, which a
  squash-merge to `main` destroys.** `tests/acceptance/unit-range.ts` finds a
  unit's range with `git log --merges` over the run's branch names, and roughly
  a dozen asserts across eight files measure against it. That is correct on this
  integration branch and on any merge-commit landing, but a **squash** of #110
  into `main` leaves no merge commits at all: `unitMerge` then throws "no merge
  for unit '<u>' is reachable from HEAD" and every re-aimed assert goes red on
  `main` — loudly, which is the intended failure mode, but it will look like a
  regression to whoever runs the suite there. Land #110 with a merge commit, or
  re-aim these to tags cut at each unit's landing before squashing · 민서.
  Related, and fixed here rather than recorded: `existedAtUnit` used to wrap the
  range resolution in `try/catch` and answer EVERY failure with "the path did not
  exist" — both callers assert `false`, so an unresolvable range, a shallow
  clone, a bad path or a missing git all read as PASS, and a green `vitest run`
  printed two `fatal: path … exists on disk, but not in 31b7687` lines while
  reporting 824/824. It now resolves the range outside the guard and probes with
  `ls-tree` (absent ⇒ exit 0 + empty output) instead of `cat-file -e` (exit 128
  for an absent path and a bad rev alike).
- [u11] **Font payload measured on the finished desk: 50 of 492 slices,
  ≈1.05 MB on first render — routed to u10, not absorbed.** u10 calibrated
  `e2e/fonts.spec.ts` against an EMPTY desk (24 files / 300 KB); u4–u7 then
  filled all five windows with 우는다리 prose, and a per-`unicode-range` sheet
  answers more Korean with more slices by design. The absolute budgets were
  therefore re-aimed to the property [u10#c4] names — subset loading, measured:
  every fetched slice's `unicode-range` covers a character the document actually
  renders, no slice is fetched twice, the set is a strict subset of the sheet,
  and every face is `font-display: swap` so none of it blocks the ~1 s document
  budget (which still binds, unchanged). The short-string oracle keeps its
  six-slice budget and now counts only what the probe caused, on its own family
  name and its own query tag — a probe that re-declares the SAME families
  re-resolves every slice the desk already uses, which made the old count
  unmeasurable. **Owner u10**: 1.05 MB of webfont behind first paint is a real
  payload question for the deploy, and it is recorded here rather than fixed at
  the barrier.
- [u11] **C18: the reporter's 6.8–10 s is covered by the TALLY count-up, not by
  a `waiting.for='report'` feed line — reference-faithful, not a seam break.**
  C18 names `waiting.for='report'`; the demo stream never opens one
  (`fixtures/woodari-run03.ts:152` sets one `WAIT_FOR = 'judgment'` for every
  wait row). The design this run ports says the same thing:
  `docs/design/phase2-ui/README.md:58-60` closes the day as "feed closes, TALLY
  opens and counts up over ~9 s → NEW RUN … files RUN 03's report into the
  archive", and [u7#c2] is written as "the count-up pacing ABSORBS the report
  call". So the latency describe asserts the client property C18 is about —
  whatever wait is open holds past 9 s, survives the 30 s worst case, and never
  becomes dead UI (no timeout, no spinner, no percentage) — and the count-up
  case covers the reporter's own window. The `report` phrasing stays implemented
  in `components/waiting-marker.ts` for a live driver that does open one. No
  pacing or seam redesign; nothing binds to fixture content (C3).
- [u11] **AGENT FILE overflows its window at 1280×800 — reported, not fixed
  (owner u4).** Measured on the merged tree: `#w-file` is 375×692 at 891,94
  while its `.win-body` holds 956 px of content, so the fourth slot and the
  DEPLOY button sit below the window's fold and are reached by scrolling the
  body (`overflow-y: auto`). Nothing is off-screen in the DESK sense that C9 /
  §7 #9 measure — every window fits the viewport — and the scroll is u4's own
  design (`e2e/red-thread.spec.ts:132-140` documents operators scrolling the
  board). Recorded because the reference shot shows the board and the button in
  one view, so a reviewer comparing shots will see the difference.

- [u2f] **u2's `[u2#c9] (p)` froze the fixtures directory.**
  `tests/driver/replay-order.test.ts:206` asserted the directory holds exactly
  `['minimal.ts','types.ts']`, and u2f's whole deliverable is four more modules
  in it (`index.ts`, `woodari-run03.ts`, `woodari-reports.ts`,
  `woodari-meta.ts`). Not fixed at u2f — another unit's test, outside its globs.
  The intent survives (u2 still ships only `types.ts` + `minimal.ts`, and
  `tests/fixtures/dev-only.test.ts` is the successor guard). Re-aimed at the u11
  barrier — see the C12/C17 ledger below.
- [u2f] **Measured seam baseline for C19.** Running the full suite at the run
  base (`super/20260803-213143`, detached worktree, same `node_modules`):
  **7 files / 13 tests already red before u2f** — `tests/scaffold/{layout,deps}`,
  `tests/styles/{index-order,hard-constraints,token-lint}`,
  `tests/assets/{fonts-css,no-third-party-url}`. At u2f HEAD it is 8 files / 14
  tests, and the single delta is exactly `[u2#c9] (p)` above; `npm run check`
  exits 0 and `vite build` succeeds. No visual check was run, by design — u2f
  ships no rendering surface.
- [u4s/u8] **BLOCKER (closed): `shell/boot-run.ts` imported `loadDemoRun` from a
  barrel that exports `demoRun`.** Vite threw at module evaluation, the graph
  never evaluated, and the desk rendered **zero `.win` frames** — verified at
  `45b51f9` with a probe (`.win` count 0). Every window-level e2e in the repo was
  red for a reason unrelated to the unit under test. u4s repaired it out of glob
  with a two-token edit (import `demoRun`), which also turned
  `tests/debug/flag-off-bundle.test.ts [u9d#c2] (a)/(b)` green — `vite build`
  itself had been broken. Whoever owns the demo-run seam owns the authoritative
  name; it must stay fixed.
- [u5/u6] **Two demo-run choosers were minted independently**, and the merged
  tree still carries both. u5 added `src/client/driver/demo-run.ts`
  (`demoRun(): Promise<FixtureRun | null>`, DEV-guarded dynamic import) and
  rewired `shell/boot.ts`; u6 independently added the same module under the name
  `loadDemoRun()` and rewired `boot-run.ts`. Both landed under `driver/` for the
  same reason: `tests/shell/shell-source.test.ts [C8/inv 12](b)` forbids a shell
  source naming a `driver/<not index>` specifier, while
  `tests/fixtures/dev-only.test.ts (b)` requires the fixtures to be reached by a
  dynamic import from outside `fixtures/` — only a loader inside `driver/`
  satisfies both. Measured by the integrator on the merged tree: `boot.ts` boots
  through `demoRunLoop()` (u7's run-loop fixture) and `boot-run.ts`'s `bootRun()`
  — which calls `demoRun()` — has **no importer left anywhere in `src/`,
  `tests/` or `e2e/`**. Keep one chooser, not two, and retire the dead one · u3.
- [u5] **`waiting active:false` is due one event BEFORE its answer.** `ViewEvent`s
  with no stamp inherit the last stamped event's (`fixture-driver.ts:49-67`), and
  u2f emits the closing `waiting active:false` before the reply line
  (`woodari-run03.ts:196`), so both carry the wait's own minute: at
  `seek('09:25')` the driver has already released "the wait is over" while the
  answer (09:26) is unreleased. Rendering that literally leaves no open marker at
  09:25, which [u5#c4] asserts must exist, so u5 treats the close as *armed* and
  takes the marker down when the next feed line lands. For literal semantics the
  fixture should emit the close AFTER the reply, or `waiting` should carry its
  own clock · u2f / seam owner.
- [u5] **The feed's tail follow needed measurement, not the reference's rAF.**
  `app.js:449` (`prefillFeed`) pins the scroll once inside a
  `requestAnimationFrame`; ported as-is, [u5#c7] fails by ~19 px in real Chrome
  because u10's self-hosted webfonts swap in AFTER the backlog lands and reflow
  the fanfold. [u5#c6] forbids a second rAF or any timer, so the port adds a
  `ResizeObserver` on `#feedList` that re-pins on a height change — it observes
  size and moves the scroll, lands no line, and the only clock in the window is
  still the driver's.
- [u7] **TALLY's band was 180 px against 415 px of content — closed by a
  cross-unit production edit.** `shell/layout.ts` (u3) handed TALLY
  `TALLY_RATIO = 0.26` of desk height (730×180 at 1280×800) while u7's mounted
  body measured `clientHeight 150 / scrollHeight 415`, so the ledger table,
  `.tly-wait` and `#btnNewRun` all rendered below the window's bottom edge.
  u7 could not compact the content (the height is spent by u1's shipped skin,
  and `win-tally.css` is sha256-pinned by `[u10#c8]`) nor restyle it
  ([u7#c9](d) bans inline geometry), so attempt 2 reverted `layout.ts` to the
  design reference (`app.js:122` — a 730-wide floating sheet, `TALLY_MAX_H 626`).
  u3's own deviation note said the band existed because [u3#c1] put all five
  windows on the desk at once; u7 mounts TALLY closed and opens it at 21:04, so
  that premise is gone. Measured after: `#w-tally` 730×626 at (275,110), body
  `clientHeight 596 == scrollHeight 596`. **This is u7's one cross-unit
  production edit** and it gives the other four windows ~180 px back.
- [u7] **`.tly-table tr` is invisible wherever CSS animations are suppressed.**
  The row's resting state is `opacity: 0` + `translateY(6px)` and only the
  `rowIn` keyframe brings it to 1, so an `*{animation:none!important}` sheet —
  which is how the deterministic capture protocol works — renders the ledger
  blank (confirmed at state `final`; under `prefers-reduced-motion: reduce` alone
  the rows compute `opacity 1`). No user-facing bug, but every deterministic
  screenshot of this window is unreadable. A static `opacity: 1` on
  `.tly-table tr.in` fixes it. The rule lives in u1's `win-tally.css`, pinned by
  `tests/assets/baseline/u1-styles-baseline.json` · u1 / u10.
- [u7] **`tests/debug/flag-off-bundle.test.ts` is not concurrency-safe.** It
  shells out to `vite build` and greps `dist/`, so it fails spuriously if any
  other process writes `dist/` at the same time — including a parallel
  `npm run build` in the same worktree. It cost one phantom regression on u7's
  pass. (u11 later moved its output to `dist-flag-off/`; a unique temp `--outDir`
  per invocation would close the rest.)
- [u7] **`[u0#c9]` in `tests/scaffold/isomorphism-guard.test.ts` is diff-shaped
  and over-triggers.** It asserts the ADDED lines of
  `git diff <merge-base>...HEAD -- vite.config.ts` match no
  `/cpSync|copyFile|data\/scenario/`; re-pointing the existing upstream plugin
  from a hard-coded `dist/` at the configured `build.outDir` re-enters that line
  as `+` and fires the guard, though the stated intent ("this run adds no copy
  plugin **of its own**") is not violated. Cleared in u7 attempt 2 by reverting
  `vite.config.ts` byte-for-byte and mirroring the plugin's OUTPUT instead
  (`tools/e2e/mirror-pack.mjs`), so this run owns no change to 윤석's plugin.
  The guard shape is still worth re-aiming · u0 / u11.
- [u7] **A DOM-only e2e suite cannot see an off-window control.** Every run-loop
  assertion is `toHaveCount` / `toHaveAttribute` / `.click()`, and Playwright
  auto-scrolls before clicking, so a control rendered entirely outside its window
  still passes `toBeEnabled()` + `.click()` — which is why the 180 px band above
  went unnoticed by the suite. A visibility assertion at the pinned viewport
  (e.g. `toBeInViewport()` on `#btnNewRun`) would close the gap for every window
  unit · testing-harness owner.
- [u4/u4s/u5/u6/u9] **Playwright's port 5174 + `reuseExistingServer` is shared by
  every parallel worktree, so a run can silently test another unit's tree.**
  Reproduced from both sides: u4's suite was fully green against u5's server
  while its own AGENT FILE body was empty; u5's "26/26 abort in `boot()`" turned
  26 green with no code change once the server was started from its own
  worktree, and a `curl` of `…/src/client/windows/live-feed.ts` on 5174 returned
  the u3 **stub**; u4 found 5174 held by u6's vite; u6 saw 3–4/24 from a stale
  server on the same port. Mitigation used at the time: `lsof -ti tcp:5174 | xargs
  kill`, or a throwaway config on a private port. A per-worktree port (or
  `--port` derived from the worktree) ends the class · harness owner.
  *(Integrator note: still live — the C5 split pins 5174/5175/5176 by name, and a
  leftover preview server from the u11 worktree had to be killed before this
  integration run could boot its own. u9d reported the same class from its side:
  four `#debug-pane` failures that were u9's tree answering on 5174, cleared by a
  throwaway config on port 5199 and by `CI=1` — `discovery/u9d.md` §D, so read this
  entry as [u4/u4s/u5/u6/u9/u9d].)*
- [u3/u4s/u5/u6/u9] **A built `dist/` renders an empty desk — by design, not a
  regression.** `demoRun()` returns `null` when `!import.meta.env.DEV`
  (spec-client §5.4 / inv 11), the boot falls back to `placeholderBootRun()` (one
  `meta`, no feed events), and all five windows render their frames with no
  content. Measured repeatedly: BLOCK STORE renders **0 cards** with
  `#storeEmpty.on` and every filter reading `0` against `vite preview`, versus
  **9 cards** (`전체 9 · 사실 5 · 자기서술 4`) against the dev server; REPORTS
  mounts with zero facts, zero body sentences and an empty rail; u9 additionally
  saw the desk fail to mount at all before the §3.7 plugin landed
  (`Unexpected token '<' … is not valid JSON` from the pack fetch). **Do not read
  an empty window on `dist/` as a rendering defect** — capture visual checks
  against the dev host. The desk has no player-build content path until a
  non-fixture run source exists · seam / §3.7 owner. (This is what C5(a)/(b)
  later split into a dev-hosted §7 round + a preview smoke.)
- [u4/u4s/u5/u6] **u3's "the windows are stubs in this unit" oracles fail by
  construction** once any window unit fills its file:
  `tests/shell/shell-source.test.ts [u3#c10] (a)/(b)` ("no window module renders
  content into its host" / "the window stubs stay small, <40 lines") and
  `e2e/shell.spec.ts:255` "window bodies are empty in this unit". Foreseen by
  u4's spec (D14) and hit identically by u4s, u5 and u6. Reconciled at the u11
  barrier (see the C12/C17 ledger) — the substantive half, "no window module
  renders content into its host", still passes for `live-feed.ts` because the DOM
  is built in `components/run-feed.ts`.
- [u3/u4s/u5] **u0's `src/client/` census oracle collides with every
  client-adding unit.** `tests/scaffold/layout.test.ts [u0#c8]` ("every file
  under `src/client/` is a `.gitkeep`, `main.ts`, or pre-existing") was already
  RED at the u3 branch point (u1's stylesheets + u2's driver modules) and every
  later unit adds to the list. Pure noise from there on; retired by re-aiming at
  the u11 barrier.
- [u4/u4s/u9] **DEFECT — focus order does not follow visual order at 1280×800.**
  Two distinct symptoms, one owner cluster: (a) u9 measured Tab visiting the
  windows in registry/DOM order (`feed·file·store·rep·tally`) while
  `shell/layout.ts` places them `feed·rep·file·store·tally`, so focus jumps left
  column → right column → middle-bottom → middle-top (u9 kept the assert verbatim
  under Playwright's `test.fail()` — an expected-failure marker, not a weakened
  assert, so it turns red the moment u3 fixes it); (b) u4 measured
  `e2e/a11y.spec.ts:278` "within each surface, focus order follows visual order"
  failing because AGENT FILE's ~956 px document scrolls inside a ~445 px body, so
  the viewport `top` of a later Tab stop lands ABOVE an earlier one although DOM
  and visual order are both correct. u4 predicted (b) would hit every
  content-bearing window (u4s · u5 · u6 · u7). u9's own suite missed (a) because
  `e2e/shell.spec.ts`'s tab-order assert scopes to `#topbar`. Suggested fix
  recorded then and applied at u11: measure each stop in its own surface's scroll
  coordinates. *(a) remains u3's — the `#desktop` child insertion order should
  follow `applyLayout()`'s geometry.*
- [u3] **`src/client/styles/shell.css` — 11 lines appended by u3**
  (`.skip-link`, `.skip-link:focus`). PRD §4 a11y / [u3#c5] needs a keyboard entry
  point that is not a window control, and a new stylesheet was not an option
  (`tests/styles/index-order.test.ts` pins index.css to exactly the nine u1
  sheets and forbids orphan sheets), so the rule went into the sheet that owns the
  chrome. Tokens only, no literals. **u1 should adopt it.**
- [u3] **The clock's progress fill is written as `style.setProperty('width', …)`**
  — everything else the shell writes is a custom property
  (`--x --y --w --h --z`, per `tests/styles/css-utils.ts` `RUNTIME_PROPS`), but
  that set is closed and `.clk-bar i` in u1's sheet declares `width:0%` +
  `transition:width .25s linear`, exactly as the reference's `paintClock()` does.
  If a `--fill` token is ever added to `RUNTIME_PROPS`, this moves onto it.
- [u3/u9] **Dead scaffold still on the tree: `src/client/placeholder.ts` and
  `src/client/style.css`.** u1 was to retire them; `main.ts` no longer imports
  either, but deleting another unit's files mid-run is worse than dead code and
  they are named in `tests/scaffold/layout.test.ts`'s PREEXISTING set. They carry
  raw colour/font/px literals (`#4fc3f7`, `20px system-ui`, `background:#0d1117`)
  — real inv-8 violations by the letter — and u9's inv-8 assert allowlists them
  and **proves** the exemption: the allowlist test fails the moment either file
  re-enters the player build graph. Someone should delete them at integration ·
  u0 / u3. *(Integrator note: both files are still on the merged tree.)*
- [u4] **Two oracle contradictions were fixed inside u4's own test files, with
  every assert intact.** (a) `e2e/agent-file.spec.ts`'s `pinnedIds()` selected
  `#w-file [data-block-id]`, which counts every filled slot twice (spec D9 puts
  the id on the `.slot` AND on its `.slot-pin`, u8's thread anchor), so
  `[u4#c4] (b)`'s `toEqual([SEEDS[0].id])` could never hold at the same time as
  `[u4#c6] (d)`; the helper is now scoped to `.slot-pin[data-block-id]`.
  (b) `tests/windows/agent-file.test.ts [u4#c2] (b)` forbade `/temperament/i`
  anywhere under `src/client/**` — but `driver/seam-guard.ts:11` names that key
  in `BANNED_EXACT` in order to REJECT any event carrying it (inv 12); the scan
  now skips that one named file, with the reason in the source.
- [u4] **Contract additions frozen for u4s / u8.** `slot-board.ts` exports
  `planOps(state, action)` (pure — the single decision point for
  slot/unslot/deploy), plus `boardState()` and `usedIds()` so `deploy-button.ts`
  reads the same rule rather than a copy; `SlotBoard` gained `deploy()`,
  `unlock()` and a no-argument `render()`. D7's surface (`place` · `clear` ·
  `isLocked` · `cells` · `SLOT_CAP` · `getSlotBoard`) is unchanged.
  `window.__agentFile` gained `pick(id)` beyond D12's five members, so the e2e
  can exercise a slot press before the BLOCK STORE exists.
- [u4s] **The BLOCK STORE's three non-default card states are class-level only.**
  `win-block-store.css` has no `.at-cap`, `.archived` or `:focus-visible` rule,
  so those states are distinguished by class + `aria-disabled` and are
  **visually identical to `in-store`** (confirmed by screenshot). The
  append-only, fully tokenised patch u4s proposed was blocked by
  `tests/assets/fonts-css.test.ts [u10#c8] (a)`, which hashes every u1 stylesheet
  against `tests/assets/baseline/u1-styles-baseline.json`, and (e), which forbids
  a new sheet — so ANY edit to a u1 sheet fails a then-green test. Patch kept
  verbatim in `discovery/u4s.md` §D13 · u1 / u10 after the hash census re-aim.
- [u4s] **The store WATCHES the board instead of being told, because there is no
  seam for it.** Mining lands in REPORTS (`driver.send({op:'mine'})`) and slotting
  lands in the AGENT FILE's board closure; neither may reach across to a sibling
  window (C8), and `SlotBoard` exposes no subscription. So the window repaints
  from a `MutationObserver` on `board.root` plus a `requestAnimationFrame` poll
  for `driver.store().mined`, each repaint guarded by a state stamp. If a later
  unit adds `SlotBoard.subscribe(...)` or a store-level change channel, this is
  the first consumer that should drop the observer.
- [u4s/u6] **Carried blocks print u4's F1 fallback text, not their sentence, and
  the RUN 01/02 archive documents are empty.** The nine `meta.carried` ids name
  RUN 01/02 report sentences and the RUN 03 stream carries no `report` for an
  earlier run, so `sentences` never resolves them and every carried card reads
  `(원문은 부검 기록에 있습니다)`. The design target shows the real text. Recorded as
  a **stream** gap (u2f), never fixed in the window — the store must not invent
  text it was not handed (inv 3). Both windows resolve the moment past-run
  reports reach the seam.
- [u9] **DEFECT — `tests/styles/token-lint.test.ts` (u1) was RED on the tree.**
  Its "font-family / font-size outside tokens.css are `var()`-driven" assert flags
  ~520 generated `@font-face { font-family: … }` declarations in u10's
  `styles/fonts.css`. A `@font-face` block DECLARES a face — it is what
  `--myeong` / `--mono` point at, not a consumption-site literal — so the lint
  needs an `@font-face` exemption, which u9's own
  `tests/invariants/style-as-data.test.ts` makes explicitly (`withoutFontFace()`,
  asserted to remove face declarations and nothing else). Left for the barrier
  ([u9#c8] forbids u9 editing u1's file); re-aimed at u11.
- [u9] **Playwright's dev server races on a cold first run.** The first
  `npx playwright test e2e/a11y.spec.ts` after a fresh checkout intermittently
  yields `net::ERR_CONNECTION_REFUSED` on `http://localhost:5174/nhn-game-2026/`
  for the later workers; the immediate re-run is clean. `webServer.url` is polled
  but Vite appears to answer before its `/nhn-game-2026/` base is mounted.
  Consider polling a real asset under the base path · harness owner.
- [u5] **Worktree hygiene.** `node_modules` was not linked into the unit
  worktree — `npm ci` had to be run before either runner would start, and it
  recurs for every agent entering a fresh worktree. Separately, at VERIFY time
  the whole unit was **uncommitted**, so `git diff --name-only <base>...HEAD` was
  empty and the frozen-path / reference-path guards passed **vacuously**; they
  were re-checked by hand and were genuinely clean, but the guard is blind to an
  uncommitted unit. Have the loop commit before VERIFY, or have the guard consult
  `git status` too · harness owner.

- [u8] **`page.clock` cannot drive the boot — deterministic captures are blocked
  repo-wide.** Playwright 1.62.1's `page.clock.install({time:0})` before navigation
  is what the capture protocol wants, so a screenshot lands on a fixed virtual
  tick. It does not work here: with the virtual clock installed the shell never
  publishes `window.__threads` / `window.__agentFile`, and pumping the clock in
  250 ms slices up to 10 s of virtual time does not release it — the capture times
  out at `waitForFunction`; without the clock the same sequence boots in ~2 s.
  Something in the boot chain advances on a real-time source the virtual clock does
  not drive. u8's VERIFY fell back to a fixed wall-clock settle and reported
  `settle: "wallclock"` rather than claim determinism it did not get. Not u8's code
  (the thread layer's redraw is synchronous and rAF-coalesced), but it blocks every
  deterministic capture in this repo until the boot's time source is fake-able ·
  whoever owns the boot's time source. (`discovery/u8.md` §14)
- [u8] **A filled slot below the AGENT FILE fold has no thread — by [u8#c3]'s own
  rule, and the desk's most memorable effect is invisible on arrival.** At the
  default arrangement the dossier stands above the board, so slot 1 sits at y≈657
  while the body ends at y≈576: the anchor is scrolled out of its own window,
  `visibleRect` returns null and no string is drawn. The suite scrolls the board
  into view (as the operator would) rather than bending the product code to draw to
  an invisible anchor. **Layout note for whoever owns the file window: the board is
  off-screen at 1280×800 until the operator scrolls** · window-layout owner.
  (`discovery/u8.md` §8)
- [u8] **The DEV debug pane's measured footprint.** `src/client/debug/pane.ts`
  paints an opaque event table over roughly `x 0–533, y 466–800` at 1280×800 — on
  top of the BLOCK STORE window and the desk floor, absent from the reference
  desktop and not gated behind anything visible in dev. It also is the sole
  offender named by the repo's `style-as-data` / `token-lint` colour-literal suites
  (`#080d12`, `#23343d`, `#7fb0c4`, `#cfe3ea`, `font:11px/1.35 ui-monospace`).
  Recorded because it silently degrades every full-desk capture. *(The literals
  were later moved to `src/client/debug/pane.css`; the pointer/paint overlap is
  carried in the [u11] pane entry above.)* (`discovery/u8.md` §15, `discovery/u7.md`
  VERIFY 2, `discovery/u9d.md` §H)
- [u1/u10] **Protocol — units wrote the root `DISCOVERY.md` directly.** u1's attempt
  1 appended 23 lines and u10's commit `126c192` appended 15 lines to the shared
  root file in addition to their own `discovery/<id>.md`. P1-F reserves
  `DISCOVERY.md` for the integrator precisely because one shared append-target
  conflicts at nearly every merge barrier. Both units asked the integrator to drop
  their direct hunks and consolidate from the per-unit files instead — which is what
  this document does · integrator / harness. (`discovery/u1.md` §8,
  `discovery/u10.md` §6.2)

- [u10] **Upstream's webfont slices are not disjoint — the partition is ours.**
  `tests/assets/unicode-range-coverage.test.ts` requires the slices of one Korean
  family/weight to be non-overlapping; Google's own sheet is not (each Korean
  weight ends with a "most common glyphs" slice and a `latin` slice that
  re-declare codepoints the numbered block slices already carry, and the cascade
  resolves each codepoint to the *last* face that claims it). So
  `tools/fonts/vendor-google-webfonts.mjs` bakes the cascade into the
  declarations — walking each family/weight backwards, a face keeps only what no
  later face claimed. Coverage is byte-for-byte upstream's; the declarations are
  a deliberate divergence from upstream's literal `unicode-range` strings, and
  re-running the vendor script is the only supported way to regenerate them ·
  u10, recorded for whoever next touches the sheet. (`discovery/u10.md` §2)
- [u4s] **A slotted card cannot start a drag, so "drag a card out of a slot"
  has no source at the seam.** `buildBlockCard` attaches `dragstart` only when
  `inSlot` is false, and the in-slot card is u4-owned DOM inside `slot-board.ts`
  which [u4s#c7] forbids u4s from editing; design D6's "click a slotted card to
  unslot" is likewise delegated to u4's `.slot-unset` button.
  `e2e/block-store.spec.ts` therefore drives that direction synthetically — id on
  a `DataTransfer`, `dragover`/`drop` on `#w-store .win-body`, the half u4s owns.
  If the design intends a real mouse drag out of a slot, u4's card builder needs
  `draggable` in the slotted branch · u4. (`discovery/u4s.md` §C 6)
- [u11] **`e2e/red-thread.spec.ts:201` was time-flaky under full-suite load —
  closed at u11 attempt 2, recorded so it is not re-derived.** The case asserted
  `toHaveCount(1)` on a re-drawn thread while the layer was still settling under
  six workers; the cause was the test's wait, not the thread layer, and the fix
  stayed test-side (`__shell.drain()` + a `pathData()` comparison). Green at
  230/230 on the integration branch · closed. (`discovery/u11.md` VERIFY 1 §2 /
  VERIFY 2)
- [u9] **All five window bodies were blank paper at u9's merge**, against a
  reference with full content — expected (u4–u8 were out of scope at that point,
  C1) and named only so a reader of that snapshot does not take the empty desk
  for a regression. Superseded on the integrated branch, where every pane
  renders · closed. (`discovery/u9.md` §3)
- [integration] **The closing tally's baseline has no seam to arrive on.** The
  §5.2 `score` event is `{ total; rows: { label; value }[] }` — no baseline text,
  no summary — while the reference ledger prints a 기준 column and
  `기준선 대비 — 무개입 하루가 기준이다` under the title. u7 answered that by
  having `windows/tally.ts` `fetch` `data/scenario/<slug>/score.json` directly;
  the final-PR review (R1) correctly rules that out on two counts —
  `architecture-map.md` §2.1 assigns `score.json` to the ENGINE and gives the
  view exactly one pack file (`meta.json`, :85), and inv 12 says a window
  consumes `ViewEvent`s only, so the fetch was a second in-channel
  `driver/seam-guard.ts` never saw. The fetch and its `baselineIndex()` helper
  are REMOVED (08-05) and the ledger now prints no baseline at all.
  `src/shared/view-driver.ts` states its own rule for the rest: "the only edit
  this module is allowed to make is prefixing `export` … if a shape here causes
  friction downstream, that goes to DISCOVERY, not into the type." So it goes
  here. **Ask of the seam owner:** either widen the `score` event
  (`rows[].baseline?: string`, plus the run's `baseline_summary`), or rule that
  the driver — which may read the pack — resolves `label → baseline` and hands
  the window a `ViewEvent`. Either is a one-line change in `windows/tally.ts`
  once it exists · open. (final-PR review, R1 on `windows/tally.ts:218`)
- [u3] **Inheritor note (u3):** the five window bodies are `overflow:auto`
  (`.paper`) except LIVE FEED's `.fanfold`, and `WINDOW_REGISTRY`
  (`shell/window-registry.ts`) is the only place that names the five windows —
  any unit adding a pane goes through it · u3. (`discovery/u3.md` §D 14)

## Reference ambiguities


- [u0] No deviation applied yet. This unit creates empty module directories only
  and ports nothing from `docs/design/phase2-ui/`; the §8 porting rule
  (CSS vendored & re-tokenized · JS rewritten in TS · markup structure ported)
  first binds at u1. Units that hit a reference-vs-invariant conflict record the
  compliant equivalent they shipped here.
- [u0] `spec-client.md` §2.1 lists `index.html` and `main.ts` on the `root` row
  of the `src/client/` table, while `index.html` actually lives at the repo root
  (Vite's entry). Read as: the client boot root is `src/client/main.ts`, reached
  from the repo-root `index.html` via `src/main.ts`. No file was moved.
- [u1] Invariant 8 / constraint C11 ("no color/size/font literal outside
  `tokens.css`") has no stated boundary for non-type lengths, while the design
  reference carries ~140 hex literals, ~100 `rgba()` calls, 20 distinct
  `font-size`s and free-form paddings. `tests/styles/token-lint.test.ts` encodes
  a bounded reading: **all** colors, `font`/`font-family`/`font-size`, and
  `padding`/`margin`/`gap` must be tokens; geometry lengths (`width`, `height`,
  `inset`, `border-width`, `top/left`) may stay literal. If the reviewer wants
  the stricter reading, the lint tightens in one place — 민서 decides.
- [u1] The contract allows "the same custom-property names **or** a documented
  rename map" but does not say where the map lives. The suite accepts
  `--old -> --new` (also `→`, `=>`) either in a `tokens.css` comment or in
  `src/client/styles/RENAME-MAP.md`.
- [u1] `--x/--y/--w/--h/--z/--delay` are written by the runtime (u3's
  WindowFrame), not by `tokens.css`. The var()-resolution lint allowlists exactly
  those six; if u3 adds a seventh runtime-written property the allowlist in
  `tests/styles/css-utils.ts` (`RUNTIME_PROPS`) must grow with it.
- [u3/TEST] `.claude/super/units/u3/{spec.md,design.md}` are leftovers from the
  previous run (20260725-025242, apothecary `pixelate`) and describe a different
  unit entirely. There is no DESIGN artefact for this run's u3, so the TEST phase
  pinned the API surface itself (`shell/layout.ts` `applyLayout(viewport)` as a
  pure function, `shell/window-registry.ts` `WINDOW_REGISTRY`, the five
  `windows/*.ts` `mount(host, driver)` stubs, and the dev-only `window.__shell`
  = `{ frame(), drain() }` handle) and recorded it in that directory's
  `tests.md`. The stale run's `tests.md` was moved to
  `.claude/super/archive/20260725-025242-u3/`.
- [u3/TEST] `tests/scaffold/layout.test.ts` › `[u0#c8] empty-modules-only census`
  (2 tests) is **already RED on the u3 branch point**, broken by the u1 (styles)
  and u2 (driver) merges: u0's census asserts every file under `src/client/` is a
  `.gitkeep` or `main.ts`. It is u0's file and not u3's to edit (C13: u3 gates on
  its own slice only). Someone must retire or re-scope that census — flagged for
  u11 / 민서.
- [u3/TEST] The shell's game clock cannot be verified as "driver-fed" from the
  DOM alone. The suite therefore requires a dev/test-only `window.__shell`
  handle exposing `frame()` (delegating to the driver) and `drain()`. It is the
  view-side analogue of u2's `test-hooks.ts` and must be excluded from the player
  build alongside the debug pane (inv 11).
- [u3/TEST] `data/scenario/우는다리/meta.json` carries `clock.end = "21:04+"`,
  which is not an `"HH:MM"` stamp and would throw in `driver/clock.ts`'s `mm()`.
  The shell must normalise it before it reaches the clock; the e2e suite asserts
  only that the topbar's terminal label *contains* `21:04`.
- [u10] The workflow pointed at `.claude/super/units/u10/design.md` as the API
  contract, but that file is **stale**: it describes a conversation beat engine
  (`beats.ts`, `mountConversation`) from an earlier run, not webfont self-hosting.
  `.claude/super/units/u10.md` is the contract actually followed. No DESIGN
  artefact exists for this unit; the RED suites encode the shape instead.
- [u10] Nothing imports `src/client/styles/index.css` yet (`src/client/main.ts`
  still mounts `placeholder.ts`, which imports `style.css`), so a page load
  fetches no webfont at all. `e2e/fonts.spec.ts` therefore replays the real
  `@font-face` blocks against the dev server at absolute same-origin URLs and
  drives `document.fonts.load(font, text)`. When u2/u3 mount the shell, the
  spec's third-party-request assertion covers the real render path unchanged.
- [u10] Font files must live under `public/assets/fonts/` and be referenced with
  a url whose tail is `assets/fonts/<path>.woff2` — the e2e spec maps that tail
  onto `<baseURL>assets/fonts/<path>`, which is how Vite serves `public/` under
  the `/nhn-game-2026/` base in both dev and build.
- [u9d] `.claude/super/units/u9d.md`, `.../u9d/design.md` and `.../u9d/spec.md` are
  **absent** in this worktree (`.claude/super/` holds only `progress.json`, and
  the directory is gitignored). The unit was worked from the orchestrator's
  inlined acceptance criteria plus `docs/spec-client.md` §2.1 / §3 inv 11–12 /
  §6 / §7; the pinned DOM + module contract lives in
  `.claude/super/units/u9d/tests.md` and in the header comments of the RED
  suites. Whoever reconciles contracts should treat those as the source of truth
  for this unit.
- [u9d] The unit's `file_globs` list `src/client/debug/**`, `vite.config.ts`,
  `tests/debug/**`, `e2e/debug-pane.spec.ts` — but the pane cannot mount without
  a **three-line, flag-guarded dynamic import in `src/client/main.ts`**
  (`if (__DEBUG_PANE__) void import('./debug/index.ts')…`). `index.html` and
  `vite.config.ts` are both closed to it (c6 forbids a plugin), so main.ts is the
  only integration point. The RED suite pins exactly that shape
  (`tests/debug/flag-off-bundle.test.ts` › 'the reference guard'); the scope gap
  is in the glob list, not in the design.
- [u9d] `window.__shell` (u3's dev handle) exposes `frame()` and `drain()` only —
  no `subscribe()`. The pane therefore reads the driver by polling `frame()`
  through that handle rather than subscribing, which keeps it inside inv 12
  (driver output only, no engine/composer import) but means it cannot observe
  `MembraneOp`s: the driver has no op-emission channel. Until one exists, the
  pane's op table is fed by its own observational `window.__debug.noteOp(op)` —
  a recorder that never forwards to the driver. Whoever adds op emission at the
  seam should re-point the table at it.
- [u9d] Contradictory guidance on the §3.7 pack-copy plugin: the unit's read
  scope says it "landed upstream with #114 — leave it exactly as it is", while
  `u9d.md` c6 says "must not add the pack-copy plugin". This worktree's base
  (508fcca) has an 8-line `vite.config.ts` with no `plugins` array at all, so
  neither statement is testable as an absence. `tests/debug/build-flag.test.ts`
  resolves it the only safe way: it does NOT ban a `plugins:` array (upstream may
  bring one), it bans this unit from pulling a copy-plugin PACKAGE
  (`viteStaticCopy`/`rollup-plugin-copy`), from adding `alias`, and from changing
  `base`. If #114 merges before integration, that suite stays green untouched.
- [u8] BLOCKER on this base: `src/client/shell/boot-run.ts:12` imports
  `loadDemoRun` from `driver/index.ts`, which exports the same function as
  `demoRun` (`driver/demo-run.ts:18`). The shell module throws at evaluation, so
  **no window mounts at all** — `e2e/shell.spec.ts` (u3's own, green at merge)
  fails identically, and every window-level e2e including `e2e/red-thread.spec.ts`
  is red for a reason unrelated to the unit under test. Introduced by the u5↔u6
  merge (45b51f9); both files are outside u8's globs. Whoever owns the demo-run
  seam picks the authoritative name. Detail in `discovery/u8.md` §1.
- [u8] Read-scope gap: the prompt's slice names "slot pin anchor nodes carrying
  data-block-id", but `slot-board.ts` writes the attribute on TWO nodes per
  filled slot (`.slot` l.180 and `.slot-pin` l.185). A node-count gate doubles
  every thread, so the RED suites pin one plan per DISTINCT id at both levels.
- [u8] `.claude/super/reference-shots/red-thread-overlay.png` (named in the
  prompt as the rendered reference) does not exist; the run's shots dir holds
  boot-scanline / shell-desktop / topbar only. The RED geometry is pinned to
  `docs/design/phase2-ui/app.js:566–602` verbatim instead. BUILD still owes the
  captured shot.

- [u2f] **No beat structure in the reference.** `data.js` is a flat 65-row feed;
  the seam wants `beat_start`/`beat_end`. Rule adopted: **a beat opens on every
  `event` line** (the fixed script event starts a beat) and closes on the line
  before the next one. §7 #2 (≤3 symptoms per beat, and beats with none) then
  falls out as a consequence rather than by hand-partitioning — but it is an
  inference. If the run-loop manager defines beats differently, this module
  follows it · 윤석.
- [u2f] **No `waiting` windows in the reference** either — only `wait` feed
  lines. Rule adopted: a `wait` line opens `waiting{for:'judgment'}` and the next
  `radio` (or the `fallback`, when no reply comes) closes it. `for` is always
  `'judgment'` because the demo's six waits are all the Call-1 window;
  `'narration'` / `'report'` are unexercised by this fixture.
- [u2f] **Fallback code vocabulary.** `ViewEvent.fallback.code` is `string` and
  spec-client §7 #7 only says "per engine §5 classes". Used `bedrock_timeout` —
  contract-calls' 504 row, the fallback-flagged status matching a Call-1 judgment
  timeout (engine §5, grade *fatal*, `default_stance` applied). If the engine
  mints its own code vocabulary rather than forwarding `x-fallback-code`, this
  constant follows it.
- [u2f] **19:40 has no authored id.** The 13 feed `event` rows that render a
  `timeline.json` event carry its `t*` id; 19:40 deliberately does not — `t16` at
  that clock is the phone-booth arrest while the reference line is the entry-cap
  outcome. Clock equality alone would have passed the id-scheme test, but an id
  naming a different sentence is the exact failure archive highlighting is keyed
  against, so 19:40 is minted `n` instead.
- [u2f] **One `report` event, not three.** The run has three round marks but the
  reference authors one report per *run*. Only the round-3 report (REPORT_R3) is
  streamed; rounds 1–2 of run 03 would need invented content, which §5.4 forbids.
  (See the archive-rail consequence under Spec gaps · u6.)
- [u2f/u6] **Unit contract files were absent from the worktree.**
  `.claude/super/units/u2f.md` and `.claude/super/units/u6.md` — both listed
  "READ FIRST" — do not exist in their worktrees (only `units/<id>/tests.md`
  does), so the acceptance criteria were read from the task prompt's truncated
  list plus `tests.md` and the RED test files, or from the main checkout. The
  prompt's criteria strings are cut mid-sentence with a `(full: …#cN)` pointer to
  a file that is not on disk · harness owner. (u1, u9, u9d and u10 report the same
  defect for `design.md`/`spec.md`.)
- [u9] **The u9 worktree carried no contract either**, and
  `units/u9/design.md` + `spec.md` in the main checkout are **stale**: they
  describe a portrait sprite-sheet component from the `demos/apothecary` dry-run,
  not this run's structural-assert suite. `units/u9/tests.md` is the only
  artifact this run produced for it. *Fix: stamp `run_id` into the unit dir, or
  clear it between runs* · harness owner.
- [u3] **The boot sweep is not verifiable under the P0-B settle contract.**
  `desktop-dressing.ts` drops `body.booting` on the windows' entry-animation
  `finish`; with `prefers-reduced-motion: reduce` + `animation:none!important`
  (both mandatory for a deterministic capture) that promise settles on the same
  virtual tick as navigation, so `boot-scanline` and `shell-desktop` capture
  byte-identical frames. If the sweep is meant to be an observable state, its
  hand-off has to be driver/clock-gated rather than `animationend`-gated ·
  whoever owns the sweep (u8).
- [u4] **A `#w-file` element screenshot cannot prove a slot/unslot repaint.**
  Because the dossier body scrolls internally, the empty board and the full board
  are byte-identical images unless §4 is scrolled into view first — confirmed
  independently of settle mode (virtual clock and wallclock produced identical
  bytes), so it is layout, not a paint stall. Any capture spec must
  `scrollIntoViewIfNeeded()` the §4 section before shooting the board.
- [u4s/u6/u7/u8] **Reference shots named in the units' read scopes did not
  exist.** `.claude/super/reference-shots/` held only `boot-scanline.png`,
  `shell-desktop-1280x800.png` and `topbar-clock-dday.png` for most of the run;
  `win-block-store.png`, `win-reports.png`, `win-tally.png`,
  `tally-countup-final.png` and `red-thread-overlay.png` were absent, so u4s, u6
  and u7 each fell back to rendering `docs/design/phase2-ui/index.html` itself
  under the same settle protocol (read-only, never written) or to the
  corresponding panel of the desk shot. **Any unit whose visual targets name a
  shot that does not exist should be flagged at planning time, not at verify
  time** · harness owner. *(Integrator note: all ten reference shots exist now —
  but `reference-shots/win-tally.png` and `reference-shots/tally-countup-final.png`
  are byte-identical (md5 `fae73d95db0ba1e71ede9756addabcb5`), so that P0-B pair
  compares one reference against two different build states.)*
- [u4s/u6] **`window-registry.ts`'s subtitles disagree with the reference.** The
  desk registry labels REPORTS `부검 — 시행 기록` where
  `docs/design/phase2-ui/index.html` says `부검 — 문장 채굴`, and the store
  `보관함 — 채굴한 문장` `■` where the reference has `블록 보관함 — 채굴된 문장` `▤`.
  The strings are u3's, outside both units' globs — one u11-side fix, pick one ·
  u3.
- [u4s] **`npx vitest run` clobbers `dist/`.** A suite rebuilds into a
  `flag-off-check` layout and leaves no `dist/index.html`, so any later
  `vite preview` 404s until `npm run build` is re-run. (Promoted from nuisance to
  gate failure by the C5 split and fixed test-side at u11 — see Seam friction.)

- [u0] **The reference shots are time-bearing, so a downstream visual check needs
  a *driven* clock, not merely a settled one.**
  `.claude/super/reference-shots/boot-scanline.png` shows live values (`SIM 13:18`,
  `D-DAY −07`, `RUN 03 / 10`). u0's capture used `page.clock.install({time:0})`
  before navigation plus `clock.runFor(1200)`, which sufficed for the rAF-driven
  placeholder (at tick 0 the canvas is blank), but any unit reproducing those
  values must reach the *driver* state behind them — a fixed virtual tick alone
  will not · every capture-owning unit. (`discovery/u0.md` verify §3; compare the
  [u8] `page.clock` finding under Seam friction, and C16's seed/advance hook,
  which is the answer this run shipped.)
- [u11] **The P0-B shot list cannot frame the AGENT FILE masthead and the red
  thread in the same shot.** `drawThread()` seats the run's first two blocks and
  then scrolls the last filled slot into view — [u8#c3]'s visible-rect
  requirement — which pushes the file's masthead (`문서번호 …` ·
  `현장 요원 운용 파일` · `호출부호 ECHO-1`) out of the window body before the
  shot. The element itself is fine: on a settled dev host `#w-file .fh-title`
  computes `visibility:visible` at `(913,157) 164×24` with `scrollTop === 0`. So
  on this build the reference's file header and the reference's thread are
  mutually exclusive framings; a spec that wants both needs a taller AGENT FILE
  body or a slot seeded high enough to need no scroll — a shot-list question,
  not a defect · shot-list owner. (`discovery/u11.md` VERIFY 2 §1)
- [u0] **`index.html`'s `<title>` was still "NHN Game 2026 — placeholder"** at
  u0, against a reference that is an NDSP-2 / 우는다리 case surface; u0 owns the
  file but the rename belongs to whoever mounts the shell. **RESOLVED on the
  integration branch** — `index.html:7` now reads
  `NDSP-2 · 우는다리 — 운영자 단말`. (`discovery/u0.md` verify §2)

## Invariant-vs-reference deviations

*P0-A precedence: where the design target and a spec invariant disagree, the
invariant wins and the compliant equivalent is recorded here.*

- [u2f] **Digit in an `npc` line (inv 2 / [u2f#c4]).** The reference's 20:22 line
  reads `영장 없이는 못 엽니다. ……20분만 줘요.` — a digit in NPC state, which the
  invariant forbids. Ported as the compliant equivalent `……스무 분만 줘요.` (the
  pack's own idiom: `스물한 시`, `열네 번`). Recorded in `provenance.test.ts`'s
  `PORTED_DEVIATIONS`.
- [u2f] **Species classification overridden by channel (spec-client §5.2).** The
  design target hand-classifies seven report sentences against their channel —
  `b-r2-f02` / `b-r2-f07` as `quote`, and `b-r1-b06` / `b-r2-b03` / `b-r2-b06` /
  `b-r3-b05` / `b-r3-b06` as `emotion`. "Species derives from the channel, never
  from classification" wins: they are `fact` and `selfnarr` in the fixture. The
  reference is a UI mock and its species column is decoration; the fixture's is
  load-bearing (contract-datapack E2 gates the solution path on it). *(Carried up
  under Spec gaps as the standing spec-vs-reference tension.)*
- [u3] **Webfonts (inv 10).** `docs/design/phase2-ui/index.html:7..9` loads three
  families from `fonts.googleapis.com` / `fonts.gstatic.com`; the port drops the
  three `<link>`s entirely and u10 self-hosts. Until then the chrome renders on
  `tokens.css`'s fallback stacks.
- [u3] **Wallpaper grid colours (C11 / inv 8).** The reference's two `<pattern>`
  grid paths carry `stroke="#3c4a58"` / `#33404d` inline; ported as
  `stroke="var(--blueprint)"` with the rect opacities lowered (.3 / .5) to keep
  the same weight. The blueprint's path geometry (`d`, `viewBox`,
  `stroke-width`) is drawing data, not style data, and stays as authored.
- [u3] **The desk opens on hold (rate 0), not at ×1.** The reference boots
  running; [u3#c3]'s "clock is driver-fed" check reads `__shell.frame()` and
  `#clockDigits` in two round trips and demands they agree, and at ×1 the sim
  advances a minute every 105 ms, so a running boot makes that check inherently
  racy. The desk opens paused with `❚❚` marked and the operator presses `▶` —
  defensible as product behaviour, but a deviation from the reference's opening
  state. `driver.advance(0)` still releases the opening minute's events.
- [u3] **The case name is `우는다리`, not `우는다리 · 윤슬교`.** The reference prints
  the site name from `data.js`; `data/scenario/우는다리/meta.json` has no site
  field (frozen this run), so only the pack-fed slug is rendered.
- [u3/u4/u5/u9] **Window chrome tab labels lose their run number.** The reference
  paints `LF-03` / `RP-02` / `AF-03` on each window's corner tab; the build paints
  `LF` / `RP` / `AF` / `BS` / `TL`. The run number is already in the shell via
  `run-counter.ts`. Shell-owned (`components/window-frame.ts`), outside all four
  reporting units' globs · u3.
- [u3] **TALLY's default position** was u3's one deliberate layout deviation (a
  bottom band instead of the reference's floating sheet, costing the three columns
  ~28 % of their height) because [u3#c1] boots all five windows at once. Reverted
  to the reference at u7 once TALLY mounted closed — see Seam friction.
- [u4] **Redaction bar widths: `px` → `%`, set as `flex-basis`, not `width`.**
  `app.js:226` writes `b.style.width = w + 'px'`; C11 / inv 8 forbids a size
  literal in component code and `tests/shell/shell-source.test.ts [C12/inv 8](c)`
  forbids `.style.width =` outright. `.redact` is a flex row, so each bar is
  sized by its basis as a ratio of the strip (`flex-basis: 46%` …), preserving the
  reference's 10-value rhythm (widths halved). No vendored CSS touched.
- [u4] **`animation-delay` is pinned to `0ms` when `animationsFrozen()`** so u2's
  freeze really pins the frame; the reference always staggers by 45 ms.
- [u4] **`.bc-src` loses `· at · src`.** The reference's card prints provenance;
  neither field is at the seam, so the slotted card prints only `런 nn`, parsed
  from the authored id (D13).
- [u4] **Inter-element whitespace.** Hand-authored markup separates elements with
  whitespace and reads as words; markup built node by node does not, and
  [u4#c1] (f) reads §3 as a sentence. `buildSection` interleaves whitespace-only
  text nodes, which a flex/grid container drops — nothing moves.
- [u4s] **No deal stagger in the BLOCK STORE.** `app.js renderStore` staggers with
  `c.style.animationDelay = i*40 + 'ms'` — an inline style literal, which C11 /
  inv 8 keeps in `tokens.css`. Ported as the compliant equivalent: no stagger,
  the sheet's own `cardIn` animation only.
- [u6] **The archive rail is a listbox, not a row of plain buttons.** `app.js`
  `renderArchive()` builds bare `<button class="arch">`s with no roles and no
  roving tabindex; PRD §4 a11y requires "a listbox-like control with an announced
  selection", so the port adds `role="listbox"` / `role="option"` /
  `aria-selected` / roving `tabindex` and ←/→/Home/End. The `.arch` / `.arch.on`
  skin is unchanged.
- [u6] **`.arch-note` is `aria-hidden`.** The reference appends it inside the
  rail; a non-`option` child of a `listbox` is an a11y violation, so it is hidden
  from the tree while keeping its flex position.
- [u6] **A space node between `RUN nn` and the time span.** The reference appends
  `<span>` and `<em>` adjacent, making `textContent` read `"RUN 0108:50 — 21:04"`
  — one unbroken digit run in the accessible name. A text node restores the word
  boundary; nothing visual changes.
- [u6] **Mining sends an op, and stops there.** The reference's `mine()` also
  calls `openWin('store')`, `renderStore()` and `toast()`; reaching a sibling
  window is forbidden (C8 / inv 12), so `mine()` returns id-keyed effect
  descriptors and the window plays only its own tear.
- [u6] **`.min` sentences are `<span role="button">`, not `<button>`.** Report
  body sentences are inline runs inside justified Korean prose and a real
  `<button>` cannot line-break across a justified column. This knowingly collided
  with u3's `[u3#c7] (b)` "nothing fakes a button" guard — u3's guard is about the
  *chrome's* controls, and the assert was re-aimed at the u11 barrier to the
  intent (a node claiming the role must be focusable and key-operable).
- [u7] **The TALLY settle is derived, not the reference literal.** `app.js
  runTally` waits `500 + rows*640 + 1400` ms = 7.9 s for the demo ledger — under
  its own README's "~9 s" and outside [u7#c2]'s `[7500, 10500]` band. `settleMs()`
  solves for the 9 s target and clamps to `[1400, 6000]`, so `run_end → final` is
  exactly `PACE.TOTAL_MS` for 3–9 rows. README §'Full loop' + c2 are normative;
  the arithmetic is not.
- [u7] **The cadence runs on an injected `Scheduler`, not the driver pump.** 21:04
  makes the driver's clock `ended` and `advance()` early-returns, so the
  reference's frame-callback cadence could never finish; `registerAnimation` /
  `tickAnimations` are deliberately not used here.
- [u7] **`newRun()`'s client-side arithmetic is not ported.** The reference does
  `S.run += 1; S.remaining = Math.max(0, S.remaining - 1)`; u7 sends
  `{op:'new_run'}` and repaints from the `meta` that comes back (§5.3).
- [u7] **The demo loop replays RUN 03's day.** Runs 04/05 reuse RUN 03's stream,
  report and score, with only the meta-state moving (counter, allotment, archive,
  one more carried block per run). No new Korean string is minted (C3).
- [u9] **Boot open-set deviation.** `e2e/a11y.spec.ts:boot()` waits for all five
  windows to be visible, because that was the shell's actual default at u9's merge
  and [u9#c6] requires the assert to be green on the tree as it exists. The
  reference (`shell-desktop-1280x800.png`) shows TALLY **closed** at boot, with a
  toast (`RUN 03 진행 중 · 13:05 — 부검 창의 문장을 늘러 채굴하세요`) occupying that
  band. Recorded rather than ported. *(u7 later mounted TALLY closed; the helper
  was re-aimed at u11 to count with `includeHidden`. The toast is still
  unported.)*
- [u9] **Window bodies were empty at u9's merge** — all five panes rendered blank
  paper against a reference with full content. Expected (u4–u8 were out of scope
  at that point) and named only so the blank desk is not read as a regression.
- [u1] **Adaptations logged under spec-client §8 ("pixel-exactness is not the
  bar").** (a) *Grey consolidation* — the reference carries several visually
  identical chrome greys (`#e4e7ea`/`#e2e8ed`/`#dfe6ec`/`#f0f3f6` → `--txt-hi`;
  `#c3ccd4`/`#a9b5c1`/`#a8b4bf` → `--txt-2`; `rgba(0,0,0,.022|.025|.028)` →
  `--sh-025`) which collapse onto one step of the scale; no colour is re-invented
  and every `tokens.css` literal still occurs in `desktop.css` (`[u1#c2] (c)`).
  (b) *`!important` removed, specificity used instead* — `.tr-i`/`.tr-b` padding
  becomes `.tly-table td.tr-i`/`td.tr-b`, and `.win.collapsed{height:auto}` drops
  its `!important`; required, because `24px!important` is not a token reference and
  the spacing lint rejects it. (c) *`#app{height:100%}` added in `base.css`* — the
  repo's `index.html` mounts into `<div id="app">` where the reference styles
  `<body>` directly. (d) `--kraft-2`, `--fanfold-bar`, `--highlight`, `--ink-2/-3`
  are declared but unreferenced — the reference does not use them either, and
  `[u1#c2] (a)` ("nothing dropped") requires them to survive.
  (`discovery/u1.md` §5)
- [u7] **TALLY's reveal is routed through the taskbar, not through `openWin()`.**
  The reference's `openWin()` unhid and raised in one call. The sheet overlaps the
  columns, so dropping `.hidden` alone would surface it *underneath* whichever
  window the operator last touched (`window-manager.focus()` raises `--z` on every
  pointerdown, and TALLY's registry z-floor is the lowest thing left by then). u7
  may not write `--z` (no inline geometry) and is handed no manager handle, so
  `show(true)` clicks this window's own taskbar button — the desk's public
  affordance — and falls back to the class when there is no taskbar (the unit tests
  mount bare). (`discovery/u7.md` IMPLEMENT attempt 2 §2)
