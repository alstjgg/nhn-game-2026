import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Project-site pathing for GitHub Pages: https://alstjgg.github.io/nhn-game-2026/
// If the repo is renamed, update this to match the new name.

/**
 * Physical architecture §3.7 — datapacks are authored at `data/` (constraint 5)
 * and must reach the browser (constraint 3), but Vite serves `public/` only.
 *
 * **By name, never `data/` wholesale.** `data/` is inputs; anything that ever
 * lands there as an *output* would otherwise be published on the next deploy,
 * and `artifacts/` exists so that never has to be remembered (§3.9).
 *
 * **Build only — there is deliberately no dev middleware.** Vite's dev server
 * already serves the project root, so `data/` is reachable at `npm run dev`
 * without any help; a middleware here would add a second, hand-rolled file
 * server for capability that already exists. The first version had one, and its
 * prefix check ran on the still-encoded path — `%2e%2e%2f` passed the check and
 * then decoded into a traversal out of `data/`. Removed rather than patched:
 * the safest hand-rolled file server is the one that is not written.
 *
 * **By name means by FILE, not by directory.** This copied `data/scenario` and
 * `data/policy` recursively, which published every authoring surface sitting
 * beside the six files the run reads — `draft.md` above all, 44 kB carrying
 * every gate, key condition and truth in the case. The answer key was one URL
 * away from anyone who opened the deployed site. A directory allowlist cannot
 * express "the pack, but not the authoring source it was compiled from"; a file
 * allowlist can, so this enumerates.
 */

/**
 * The scenario parts the run fetches, per pack. Kept identical to `PACK_FILES`
 * in `src/client/driver/live/pack.ts` and `tools/driver/run/pack.mjs` —
 * `tests/invariants/published-data.test.ts` fails when the three drift.
 *
 * `places` / `truths` / `hardening` / `draft.md` are authoring surfaces no seam
 * consumes, and `_schema/` is authoring-time validation. None of them ship.
 *
 * `score` joined the loaders with the scorer (#146) — `createScorer` resolves
 * `units[].predicates` at 21:04 — so it ships too, stripped by
 * `stripScoreNotes` below.
 */
const PACK_PARTS = [
  'meta',
  'timeline',
  'gates',
  'characters',
  'temperament',
  'symptoms',
  'score',
] as const

/** Scenario-independent policy the run fetches, relative to `data/`. */
const POLICY_FILES = ['policy/report-guidance.json'] as const

/** `data/scenario/<slug>/` — every directory that is a pack, `_schema/` aside. */
function packSlugs(scenarioDir: string): string[] {
  if (!existsSync(scenarioDir)) return []
  return readdirSync(scenarioDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
}

/** Every `data/`-relative path the deployed client is allowed to request. */
export function publishedDataFiles(root: string = process.cwd()): string[] {
  const scenarioDir = join(root, 'data', 'scenario')
  const scenario = packSlugs(scenarioDir).flatMap((slug) =>
    PACK_PARTS.map((part) => `scenario/${slug}/${part}.json`),
  )
  return [...scenario, ...POLICY_FILES]
}

/**
 * Authored fields that ship inside a needed file but say how the mechanism
 * works. `gates.json` has to reach the browser — the engine reads it every run
 * — and `standard_form` reads "갈림길 G1에서, 기질은 기본 stance 매뉴얼 응대를
 * 낸다; 열쇠 조건 k1을 만족하는 문장 주입 시 경청으로 이동한다", which is the
 * answer to that gate written out. `branch_note` is the same for outcomes.
 *
 * Neither is read at runtime — `src/shared/datapack.ts:143-144` declares their
 * types and nothing consumes them — so the deployed copy drops them and the
 * authored file keeps them. `tests/scaffold/published-data.test.ts (g)` holds
 * this to the no-consumer premise: if a seam ever starts reading one, the
 * stripping has to be reconsidered rather than silently breaking it.
 */
const DESIGN_ONLY_FIELDS = ['standard_form', 'branch_note'] as const

/** Strips `DESIGN_ONLY_FIELDS` from every gate. Shape-preserving otherwise. */
export function stripDesignNotes(raw: string): string {
  const pack = JSON.parse(raw) as { gates?: unknown }
  const gates = Array.isArray(pack.gates) ? pack.gates : []
  for (const gate of gates) {
    if (gate === null || typeof gate !== 'object') continue
    for (const field of DESIGN_ONLY_FIELDS) delete (gate as Record<string, unknown>)[field]
  }
  return `${JSON.stringify(pack, null, 2)}\n`
}

/**
 * The same problem in `score.json`, which the scorer made a published file.
 *
 * Only `id`, `label` and `predicates` are read — `src/driver/scorer.ts:94-105`
 * resolves the predicates for the value and resolves them AGAIN against the
 * untouched day for the baseline, deliberately not trusting the authored
 * `baseline` prose ("812명 진입, 사망 24 · 부상 71" is four numbers in one
 * sentence and no run produces it as a value).
 *
 * What the rest says is the ending. `baseline_summary` states the
 * no-intervention outcome outright — "사망 26 · 부상 71 · 오인 구금 1건 …
 * 은폐 유지" — and `attributed_gates` names the gates a unit hangs off (`["G6",
 * "G7", "G4"]`), which is gate structure on a fetchable URL and the same
 * invariant-6 leak this build closed elsewhere.
 */
const SCORE_UNIT_DESIGN_FIELDS = ['tallies', 'baseline', 'attributed_gates'] as const
const SCORE_TOP_DESIGN_FIELDS = ['baseline_summary', 'variance_notes'] as const

/** Strips the authored-for-a-human fields from `score.json`. Shape-preserving. */
export function stripScoreNotes(raw: string): string {
  const pack = JSON.parse(raw) as { units?: unknown } & Record<string, unknown>
  for (const field of SCORE_TOP_DESIGN_FIELDS) delete pack[field]
  const units = Array.isArray(pack.units) ? pack.units : []
  for (const unit of units) {
    if (unit === null || typeof unit !== 'object') continue
    for (const field of SCORE_UNIT_DESIGN_FIELDS) delete (unit as Record<string, unknown>)[field]
  }
  return `${JSON.stringify(pack, null, 2)}\n`
}

function copyPackData(): Plugin {
  return {
    name: 'dday-data',
    // build only: copy into dist/, which is what deploy.yml publishes
    closeBundle() {
      const root = process.cwd()
      for (const rel of publishedDataFiles(root)) {
        const from = join(root, 'data', rel)
        if (!existsSync(from)) {
          throw new Error(`dday-data: ${rel} is fetched by the client but absent from data/`)
        }
        const to = join(root, 'dist', 'data', rel)
        mkdirSync(dirname(to), { recursive: true })
        if (rel.endsWith('/gates.json')) {
          writeFileSync(to, stripDesignNotes(readFileSync(from, 'utf8')), 'utf8')
        } else if (rel.endsWith('/score.json')) {
          writeFileSync(to, stripScoreNotes(readFileSync(from, 'utf8')), 'utf8')
        } else {
          copyFileSync(from, to)
        }
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: '/nhn-game-2026/',
  plugins: [copyPackData()],

  // [u9d#c6] spec-client §3 invariant 11 — the debug pane is build-flag only.
  // A `define` and not an env lookup on purpose: the value is a literal the
  // bundler constant-folds, so the `if (__DEBUG_PANE__)` guard in
  // `src/client/main.ts` becomes `if (false)` in the player build and the
  // guarded dynamic import is dropped whole. A runtime check would leave the
  // pane's code in the bundle, flag or no flag.
  define: {
    __DEBUG_PANE__: JSON.stringify(mode !== 'production'),
  },

  server: {
    // The client posts to a same-origin path, so the browser sends the dev
    // origin the proxy is configured to accept. In production
    // `VITE_PROXY_BASE_URL` points at API Gateway instead (call contracts §11).
    proxy: { '/dday': { target: 'http://localhost:8787', changeOrigin: false } },
  },
}))
