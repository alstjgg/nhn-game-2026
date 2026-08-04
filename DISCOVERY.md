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
- [u11] **C16 — the sim-clock test hook is this unit's one production edit.**
  u2's charter promised "clock pause/seed + animation-freeze hooks" and only the
  freeze half shipped. `installClockHook` / `clockHookOf` / `ClockHook` now
  complete it on `driver/test-hooks.ts`, re-exported from the driver barrel and
  installed by `shell/boot.ts` onto `__shell.clock` behind `import.meta.env.DEV`
  — inv 11 still binds, and `e2e/preview-smoke.spec.ts` greps the built bundle
  for the name. It is what lets §7 #6 and the two TALLY captures REACH 21:04
  instead of racing the clock at ×4.
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
  and still rides the flagged chunk out of the player build. Owner u9d; recorded
  here because u11 did not commission it.
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
