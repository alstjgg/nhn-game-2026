// [u11#c14] C19 — the u2f seam-measurement ledger.
//
// C19 makes classifying every one of u2f's base measurements a review-blocking
// job: a STALE unit-scoped assert is re-aimed under C12/C17; a REAL seam break
// is fixed at its OWNING unit and logged in DISCOVERY. Folding a real break into
// the stale bucket to clear the board is the violation C19 names.
//
// `seam-reconcile.test.ts` holds the asserts, so filling the ledger in can never
// soften a check.
//
// ── the raw record, and what "7/13" turned out to mean ────────────────────────
//
// C19 quotes u2f's VERIFY as "base 7/13 red". The raw record IS in the repo —
// `discovery/u2f.md` §5, written by u2f's own VERIFY:
//
//   "Baseline established by running the full suite at the run base … **7 files
//    / 13 tests already red before this unit** — tests/scaffold/{layout,deps},
//    tests/styles/{index-order,hard-constraints,token-lint},
//    tests/assets/{fonts-css,no-third-party-url} (all u0/u1/u10 barrier oracles)."
//
// So "7/13" is *seven files / thirteen tests*, not *seven of thirteen*: all
// thirteen were red, spread across seven files. Reconstructed test by test
// below, the counts land exactly on that record — 13 rows, 7 distinct files —
// and `RED` therefore reads 13, with the file count kept as `RED_FILES` so the
// "7" is still measured rather than lost. This makes the completeness assert
// STRICTER than the compressed reading would have (thirteen rows must be
// accounted for as red, not seven); nothing here is relaxed to go green, and the
// correction itself is logged in DISCOVERY.md.
//
// Rules the asserts enforce, stated once here so a row is written correctly:
//   · `class: 'STALE'` ⇒ `target` names the test FILE that was re-aimed, and
//     that file must exist and say so (C17: never delete, never `.skip`).
//   · `class: 'REAL'`  ⇒ `owner` names the unit that owns the fix (`u4`, `u7`, …)
//     AND `DISCOVERY.md` carries a line naming this row's `id`.

export type SeamClass = 'STALE' | 'REAL'

export interface SeamRow {
  /** Stable key for the check, e.g. `u2f#c3` or `tests/fixtures/id-scheme`. */
  readonly id: string
  /** The exact verification command re-run to measure it. */
  readonly verify: string
  /** Was this one of the reds u2f recorded on its base? */
  readonly wasRed: boolean
  readonly class: SeamClass
  /** STALE → the re-aimed test file. REAL → a one-line statement of the break. */
  readonly target: string
  /** The test file the measurement was taken in — the "7 files" half of the record. */
  readonly measuredIn: string
  /** REAL only — the unit that owns the fix (never u11 itself; [u11#c8]). */
  readonly owner?: string
}

/** How many checks u2f's VERIFY measured, and how many were red. */
export const MEASURED = 13
export const RED = 13
/** …spread across this many files — the "7" in C19's compressed "7/13". */
export const RED_FILES = 7

const SCAFFOLD_LAYOUT = 'tests/scaffold/layout.test.ts'
const SCAFFOLD_DEPS = 'tests/scaffold/deps.test.ts'
const INDEX_ORDER = 'tests/styles/index-order.test.ts'
const HARD_CONSTRAINTS = 'tests/styles/hard-constraints.test.ts'
const TOKEN_LINT = 'tests/styles/token-lint.test.ts'
const FONTS_CSS = 'tests/assets/fonts-css.test.ts'
const NO_THIRD_PARTY = 'tests/assets/no-third-party-url.test.ts'

export const SEAM_LEDGER: readonly SeamRow[] = [
  // ── tests/scaffold/layout.test.ts — u0's census, invalidated by u1–u10 ─────
  {
    id: 'u2f-base/layout-census-files',
    verify: `npx vitest run ${SCAFFOLD_LAYOUT}`,
    wasRed: true,
    class: 'STALE',
    target: SCAFFOLD_LAYOUT,
    measuredIn: SCAFFOLD_LAYOUT,
  },
  {
    id: 'u2f-base/layout-census-styles',
    verify: `npx vitest run ${SCAFFOLD_LAYOUT}`,
    wasRed: true,
    class: 'STALE',
    target: SCAFFOLD_LAYOUT,
    measuredIn: SCAFFOLD_LAYOUT,
  },

  // ── tests/scaffold/deps.test.ts — u0's frozen scripts, moved by upstream ───
  {
    id: 'u2f-base/deps-frozen-scripts',
    verify: `npx vitest run ${SCAFFOLD_DEPS}`,
    wasRed: true,
    class: 'STALE',
    target: SCAFFOLD_DEPS,
    measuredIn: SCAFFOLD_DEPS,
  },

  // ── tests/styles/index-order.test.ts — u1's manifest census vs u10's sheet ─
  {
    id: 'u2f-base/index-order-tail-skins',
    verify: `npx vitest run ${INDEX_ORDER}`,
    wasRed: true,
    class: 'STALE',
    target: INDEX_ORDER,
    measuredIn: INDEX_ORDER,
  },
  {
    id: 'u2f-base/index-order-nine-sheets',
    verify: `npx vitest run ${INDEX_ORDER}`,
    wasRed: true,
    class: 'STALE',
    target: INDEX_ORDER,
    measuredIn: INDEX_ORDER,
  },
  {
    id: 'u2f-base/index-order-fonts-slot-import',
    verify: `npx vitest run ${INDEX_ORDER}`,
    wasRed: true,
    class: 'STALE',
    target: INDEX_ORDER,
    measuredIn: INDEX_ORDER,
  },
  {
    id: 'u2f-base/index-order-fonts-slot-file',
    verify: `npx vitest run ${INDEX_ORDER}`,
    wasRed: true,
    class: 'STALE',
    target: INDEX_ORDER,
    measuredIn: INDEX_ORDER,
  },

  // ── tests/styles/hard-constraints.test.ts — "fonts belong to u10", after u10 ─
  {
    id: 'u2f-base/hard-constraints-font-face',
    verify: `npx vitest run ${HARD_CONSTRAINTS}`,
    wasRed: true,
    class: 'STALE',
    target: HARD_CONSTRAINTS,
    measuredIn: HARD_CONSTRAINTS,
  },
  {
    id: 'u2f-base/hard-constraints-font-file',
    verify: `npx vitest run ${HARD_CONSTRAINTS}`,
    wasRed: true,
    class: 'STALE',
    target: HARD_CONSTRAINTS,
    measuredIn: HARD_CONSTRAINTS,
  },
  {
    id: 'u2f-base/hard-constraints-public-fonts',
    verify: `npx vitest run ${HARD_CONSTRAINTS}`,
    wasRed: true,
    class: 'STALE',
    target: HARD_CONSTRAINTS,
    measuredIn: HARD_CONSTRAINTS,
  },

  // ── tests/styles/token-lint.test.ts — the @font-face declaration site ──────
  {
    id: 'u2f-base/token-lint-font-values',
    verify: `npx vitest run ${TOKEN_LINT}`,
    wasRed: true,
    class: 'STALE',
    target: TOKEN_LINT,
    measuredIn: TOKEN_LINT,
  },

  // ── tests/assets/fonts-css.test.ts — u10's baseline vs u3's later shell.css ─
  {
    id: 'u2f-base/fonts-css-u1-hashes',
    verify: `npx vitest run ${FONTS_CSS}`,
    wasRed: true,
    class: 'STALE',
    target: FONTS_CSS,
    measuredIn: FONTS_CSS,
  },

  // ── tests/assets/no-third-party-url.test.ts — the one REAL one ─────────────
  {
    id: 'u2f-base/no-third-party-url-b',
    verify: `npx vitest run ${NO_THIRD_PARTY}`,
    wasRed: true,
    class: 'REAL',
    target:
      'the deploy artefact publishes authoring-only JSON Schemas: the §3.7 pack-copy plugin ' +
      'copies data/scenario/ wholesale, so dist/data/scenario/_schema/ ships ten meta-schema ' +
      '$schema identifiers that inv 10 then reads as third-party URLs',
    measuredIn: NO_THIRD_PARTY,
    owner: 'u0',
  },
]
