import { globSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Dev-only AI middleware (PRD §2.1). The plugin declares `apply: 'serve'`, so
// `vite build` / `vite preview` physically lack it: the deployed demo carries
// no proxy and no key, and the dist secret grep stays clean (INV-2).
import { aiProxy } from './server/ai-proxy.mjs';

// base: './' — dist ships to GitHub Pages under a NESTED path
// (…/nhn-game-2026/demos/darkest-context/), so every emitted asset URL must stay
// relative. Never hardcode the repo-name base the root config uses: relative
// paths keep the demo self-contained and let e2e serve dist under any prefix
// (INV-8, PRD §4-8; apothecary DISCOVERY §3 "No subpath / deploy-verify step").
const root = dirname(fileURLToPath(import.meta.url));

// PARALLELISM SEAM (AC3). Build inputs are DISCOVERED, never listed: the demo
// home plus one standalone page per directory under the harness glob below.
// A later screen unit drops in its own directory and gets a build input + a
// preview URL for free — it must NEVER edit this file. That removes the
// coupling apothecary DISCOVERY §3 flagged as "file_globs don't model a
// single-entry SPA". Naming a page literally here would restore it.
const HARNESS_PAGES = 'e2e/harness/*/index.html';

const harnessInputs = Object.fromEntries(
  globSync(HARNESS_PAGES, { cwd: root })
    .map((rel) => resolve(root, rel))
    .sort()
    .map((abs) => [`harness-${basename(dirname(abs))}`, abs]),
);

export default defineConfig({
  base: './',
  plugins: [aiProxy()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        ...harnessInputs,
      },
    },
  },
});
