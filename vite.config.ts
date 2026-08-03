import { cpSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
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
 */
const PUBLISHED = ['scenario', 'policy']

function serveData(): Plugin {
  return {
    name: 'dday-data',
    // dev: serve data/ off disk, so a pack edit needs no restart
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0] ?? ''
        if (!PUBLISHED.some((d) => path.startsWith(`/data/${d}/`))) return next()
        const file = join(process.cwd(), decodeURIComponent(path))
        if (!existsSync(file)) return next()
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(readFileSync(file))
      })
    },
    // build: copy into dist/, which is what deploy.yml publishes
    closeBundle() {
      for (const dir of PUBLISHED) {
        const from = join(process.cwd(), 'data', dir)
        if (existsSync(from)) {
          cpSync(from, join(process.cwd(), 'dist', 'data', dir), { recursive: true })
        }
      }
    },
  }
}

export default defineConfig({
  base: '/nhn-game-2026/',
  plugins: [serveData()],
  server: {
    // The client posts to a same-origin path, so the browser sends the dev
    // origin the proxy is configured to accept. In production
    // `VITE_PROXY_BASE_URL` points at API Gateway instead (call contracts §11).
    proxy: { '/dday': { target: 'http://localhost:8787', changeOrigin: false } },
  },
})
