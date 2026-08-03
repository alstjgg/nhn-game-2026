# Plan — Client View-Layer Build (the PRD super-pipeline builds from)

> **Tier:** `plan-` — normative about the work, not the artifact: who builds
> what, in what order, and how it is verified. "PRD" names its function as
> the harness's build input; `plan-` names its authority.
> **Owner:** 민서 · **Language:** TypeScript (vanilla, zero runtime deps) ·
> **Build target:** `src/client/` in this repo, in-place.
>
> This is the PRD the super-pipeline harness builds from. It **references and
> consumes** the specs — it never redefines them. Conflict order:
> [`spec-architecture.md`](./spec-architecture.md) → engine/datapack/calls/run-artifact
> laws → [`spec-physical-architecture.md`](./spec-physical-architecture.md) →
> [`spec-client.md`](./spec-client.md) → **this PRD**.
> The client spec carries the contract detail (I/O, twelve review-blocking
> invariants, window set, seams, component inventory, acceptance); this PRD
> adds only what a build run needs: environment, provided inputs, work-unit
> hints, gates.
>
> **Harness mods assumed:** the frontend-mod
> ([`planning/research/super-pipeline-frontend-mod.md`](../planning/research/super-pipeline-frontend-mod.md))
> P0-A (`reference_globs`), P0-B (`render_capture`), P0-C (reference shots +
> in-loop visual self-check) and P1-F (DISCOVERY plumbing) are implemented in
> the super-pipeline repo **before this run** (민서 runs that implementation
> separately).

---

## 1. Role & scope

Build the client view layer defined by [`spec-client.md`](./spec-client.md)
§1: shell + five windows + membrane + view-driver seam + fixture mode, styled
per the design target ([`docs/design/phase2-ui/`](./design/phase2-ui/README.md),
spec §8 porting rule: **CSS vendored & re-tokenized · JS rewritten in TS ·
markup structure ported**).

**Does NOT do (run-level):** the live driver's engine/composer binding
(engine does not exist yet; build to the seam, fixture-only) · any edit to
`docs/` specs, the design target, or the scenario pack (findings →
`DISCOVERY.md`) · resolving the persistence contradiction (memory-only per
spec §7 #8; do not introduce `localStorage`).

## 2. Environment & gates

- Repo root Vite + tsc project (`npm run dev / build / preview`,
  CLAUDE.md). Add **dev** dependencies only: `vitest`, `playwright`.
- **Build gate:** `npm run build` green.
- **Test gate:** `npx vitest run` (unit/structural) · `npx playwright test`
  (e2e fixture run-through). Per-unit gate = that unit's own test slice;
  only the final acceptance unit gates on the full suite.
- **Minimum viewport: 1280×800** (bound here per spec §4). Desktop only.

## 3. Provided inputs

| Class | Globs | Rule |
|---|---|---|
| `reference_globs` (frontend-mod P0-A) | `docs/design/phase2-ui/**` | never edit · **mandatory reading**, sliced per unit |
| `frozen_globs` | `data/scenario/우는다리/**` · `data/scenario/_schema/**` · `docs/*.md` (all specs/contracts) | never edit; spec findings → `DISCOVERY.md` |
| guarded | `assets-manifest.json` | edits limited to: re-pointing the three existing webfont entries + appending new entries. Never remove or rewrite others |
| resolved upstream (PR #108 review) | seam **ratified** (spec §5.2 amendments) · `src/` tree + tsconfig split **already exist** · pack-copy plugin lands with 윤석 (fixture mode does not wait on it) | one standing condition: **no unit may touch `tsconfig.core.json`'s `include` or add path aliases** — it is the mechanical isomorphism guard |

## 4. Invariants

Spec-client §3's twelve invariants are the review bar, verbatim — reviewers
block on them, and the P1-D structural asserts (§5 u9) turn four of them
into tests: no free-text surface (inv 1) · no digit in NPC channels, scoped
to feed/symptom nodes (inv 2) · no third-party URL in the built bundle
(inv 10) · no color/size literals outside `styles/tokens.css` (inv 8) —
plus a11y asserts (keyboard-reachable membrane ops and window controls,
roles/landmarks, focus order). Unit-scoped asserts ride their own unit's
gate; **repo-wide asserts bind fully only at u11** (no full-suite gates on
earlier units).

## 5. Work-unit DAG (build hint — the decomposer refines)

| id | title | deps | verification (own slice) | reference/context scope |
|---|---|---|---|---|
| **u0** | `src/client/` internal scaffold (module dirs per spec §2.1, entry wiring) — the `src/` tree and tsconfig split already exist; **must not touch `tsconfig.core.json` or add path aliases** (윤석's condition, 08-03) | — | `npm run build` on empty modules | physical §3.8 · spec §2.1 |
| **u1** | `styles/tokens.css` + vendored per-window skins from `desktop.css`, re-tokenized (inv 8) | u0 | vitest: token-only lint passes | `desktop.css` (whole) |
| **u2** | seam types → `src/shared/view-driver.ts` (**ratified shapes verbatim**, spec §5.2) · `driver/`: fixture driver · **fixture files regenerated from `우는다리`, sentence ids per the ratified scheme (`b-r<run>-<channel><nn>`, channel-derived species)** · **clock pause/seed + animation-freeze hooks** (for the build's own e2e determinism; harness captures use frontend-mod P0-B's browser-clock settle protocol) | u0 | vitest: fixture replay ordering; hooks pin a frame | spec §5.2·§5.4 · `data.js` (as content source only) |
| **u3** | shell: topbar (clock · D-DAY · case) · taskbar · window manager · `applyLayout` | u1 | playwright: 5 windows drag/resize/collapse at 1280×800 | `index.html` topbar/win markup · `app.js` window-manager + layout notes |
| **u4** | AGENT FILE + BLOCK STORE windows (membrane ops: slot/unslot/deploy; dossier incl. sealed §3) | u2·u3 | vitest: ops emitted with ids; playwright: stamp/lock | reference dossier + card markup/CSS |
| **u5** | LIVE FEED window (7 line kinds · clock-landed lines · typewriter replay · diegetic waiting) | u2·u3 | playwright: fixture round renders in order, `(변화 없음)`, `※` fallback | reference fanfold markup · feed-kind mapping note |
| **u6** | REPORTS window (facts/report_body · mining tear · archive rail, run/time segmentation) | u2·u3 | vitest: mine op carries authored id; playwright: highlight marks | reference reports markup/CSS |
| **u7** | TALLY + run loop (score count-up ~9 s · new_run · counter/pips · carried blocks) | u4–u6 | playwright: full-run loop to next BUILD | reference tally markup · spec §5.1 states |
| **u8** | RedThread overlay (slot ↔ source by id, re-draw on drag) | u4·u6 | playwright: thread endpoints track windows | reference threads svg + notes |
| **u9** | debug pane (build flag, inv 11) + **P1-D structural-assert suite** (§4) | u3 | vitest suite green; flag-off bundle grep-clean | spec §3 invariants |
| **u10** | webfont self-hosting: 3 families as per-`unicode-range` slices → `public/assets/fonts/` + local CSS · re-point manifest entries | u1 | playwright: zero third-party requests; build size check | spec §9 asset note · manifest |
| **u11** | e2e acceptance: spec §7 items 1–12 as the playwright suite + captures for P0-B | all | **full suite green** (the only whole-suite gate) | spec §7 |

Waves (illustrative): `[u0] → [u1 ∥ u2] → [u3] → [u4 ∥ u5 ∥ u6] →
[u7 ∥ u8 ∥ u9 ∥ u10] → [u11]`.

**Review:** design-fidelity applies at the **unit-PR Lead review** (frontend-
mod P1-E — where the captures are); if also seated on the final panel, 민서
pins it at the approval gate. Game-feel (game-mod P1-C) triggers on the
panel. Evidence bar everywhere: named deviations citing reference file/line
or a capture, never taste.

## 6. Definition of done

`npm run build` green · u11 full suite green (= spec-client §7, all twelve,
fixture mode) · P0-B captures attached to the dashboard PR (reference vs
build, per window) · the three manifest font entries re-pointed, nothing else
touched · `DISCOVERY.md` populated (spec gaps, seam friction, reference
ambiguities — logged, never fixed inline) · no edit anywhere in
`reference_globs`/`frozen_globs`.
