import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { aiProxy } from './server/ai-proxy.mjs';
import { resolveBuildInputs } from './vite.build-inputs.ts';

// base: './' — dist must work under a Pages subpath (…/demos/apothecary/) and
// for the nested e2e harness pages, so every emitted asset URL stays relative.
// Do NOT hardcode the repo-name base like the root config does; relative paths
// keep the demo self-contained.
//
// Multi-page build: the demo home (index.html) plus — ONLY under `E2E=1` — the
// standalone e2e harness pages that drive individual screens in a real browser.
// `playwright.config.ts` builds with that flag so `preview` serves each harness at
// the path its spec `goto`s (design D10); every other build (CI, the Pages deploy)
// emits the demo home alone, so no URL-parameter-driven build of the game with
// internal test hooks is ever published (PR #33, R2). The rule itself lives in
// ./vite.build-inputs.ts and is unit-tested there.
const input = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base: './',
  // Dev-only AI proxy (PRD §2.1): /ai/health, /ai/dialogue, /ai/portrait.
  // `apply: 'serve'` inside the plugin keeps it out of builds and preview,
  // so the deployed demo is stub-mode by construction — no secrets anywhere.
  plugins: [aiProxy()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.entries(resolveBuildInputs(process.env)).map(([name, path]) => [name, input(path)]),
      ),
    },
  },
});
