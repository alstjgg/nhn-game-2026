import { defineConfig } from 'vitest/config';

// Unit tests are pure logic / file-config checks — no DOM.
// (DOM smoke lives in e2e/ under Playwright.)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
