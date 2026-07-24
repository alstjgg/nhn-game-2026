import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { aiProxy } from './server/ai-proxy.mjs';

// base: './' — dist must work under a Pages subpath (…/demos/apothecary/) and
// for the nested e2e harness pages, so every emitted asset URL stays relative.
// Do NOT hardcode the repo-name base like the root config does; relative paths
// keep the demo self-contained.
//
// Multi-page build: the demo home (index.html) plus the standalone e2e harness
// pages that drive individual screens in a real browser. Each screen unit that
// needs a harness adds its index.html here as a build input so `preview` serves
// it at the same path the e2e specs `goto` (design D10).
const input = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base: './',
  // Dev-only AI proxy (PRD §2.1): /ai/health, /ai/dialogue, /ai/portrait.
  // `apply: 'serve'` inside the plugin keeps it out of builds and preview,
  // so the deployed demo is stub-mode by construction — no secrets anywhere.
  plugins: [aiProxy()],
  build: {
    rollupOptions: {
      input: {
        main: input('./index.html'),
        conversation: input('./e2e/harness/conversation/index.html'),
        crafting: input('./e2e/harness/crafting/index.html'),
      },
    },
  },
});
