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

## Seam friction

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
