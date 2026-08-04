import { cpSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
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
 */
const PUBLISHED = ['scenario', 'policy']

function copyPackData(): Plugin {
  // The bundle's own output directory, resolved: `dist/` for the deployed
  // build, and whatever `--outDir` names for a build that is not the deploy —
  // the e2e runner serves one such build (C5) and it needs the pack too.
  let outDir = join(process.cwd(), 'dist')
  return {
    name: 'dday-data',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    // build only: copy into the bundle's outDir, which for the deploy is dist/
    closeBundle() {
      for (const dir of PUBLISHED) {
        const from = join(process.cwd(), 'data', dir)
        if (existsSync(from)) {
          cpSync(from, join(outDir, 'data', dir), { recursive: true })
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
