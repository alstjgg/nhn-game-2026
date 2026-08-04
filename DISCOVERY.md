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
- [u0] The physical **§3.7** pack-copy plugin is unbuilt. `spec-client.md` §2.1
  routes `data/scenario/<slug>/` into the browser "via the physical §3.7 copy
  plugin — **unbuilt**, see §9", and `vite.config.ts` carries no plugin at all.
  Consequence for this unit: the built `dist/` contains no scenario pack, so the
  e2e harness cannot boot a pack-driven build. Adding the plugin is explicitly
  out of scope here (u0 hard constraint c9) — whoever owns §3.7 adds it.
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
- [e10] `contract-engine-composer.md` §2.1 (and its echo in §8's open-items
  list) still warns that **`AGENT_UTTERANCE` is missing from call contracts
  §6's supplier table** — but that table now carries the row, and
  `tests/acceptance/fixtures/closure.ts` parses it out with no special case.
  The warning is stale, not the table — impact: a reader of §2.1 thinks a slot
  is unassigned when the closure proves it is not · the owner of
  `docs/contract-engine-composer.md` retracts §2.1 (`docs/**` is frozen here).
- [e10] §8-1's supplier union (`GateView ∪ BeatView ∪ RoundView ∪ ComposerDeps
  ∪ PROXY_OWNED_SLOTS`) has **no term for the player**, yet call contracts §6
  assigns `BLOCKS` to the player and the composer only *resolves* the ids it is
  handed. The executable closure adds an explicit sixth term,
  `PLAYER_SUPPLIED_SLOTS = ['BLOCKS']`, and counts doubling as engine-side ∩
  proxy-owned rather than set ∩ set — impact: none on `src/**`; §8's wording
  should name the player · whoever next edits that contract. See
  `discovery/e10.md` §2.

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

## Reference ambiguities

- [e5] `contract-engine-composer.md` §3 says the composer resolves block ids
  "through the block store the driver passes in", but the `ComposerDeps` literal
  in the same section carries only `reportGuidance` — and the views are frozen by
  §2, so the store cannot ride in one. Read as: the store is a **construction**
  dependency. `createComposer` takes
  `ComposerDeps & { reportGuidance: ReportGuidance; blocks: BlockStore }`; the
  same intersection narrows e0's `reportGuidance: unknown` to e1's canonical
  type without redeclaring it. Details and the reversal path: `discovery/e5.md`.
- [e5] The contract does not say what happens when an injected block id has no
  entry in the store. Read as: **throw**, resolve-all-then-emit, nothing partial
  emitted. Skip-and-continue would let two runs with "the same" block set compose
  different bytes, which is the property §8-10 exists to protect.
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
