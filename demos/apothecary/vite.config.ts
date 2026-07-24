import { defineConfig } from 'vite';

// base: './' — dist must work under a Pages subpath (…/demos/apothecary/).
// Do NOT hardcode the repo-name base like the root config does; relative
// paths keep the demo self-contained.
export default defineConfig({
  base: './',
});
