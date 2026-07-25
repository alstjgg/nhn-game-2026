import { defineConfig } from 'vitest/config';

// Unit slice = pure logic / file-config checks, no DOM.
// (DOM smoke lives in e2e/ under Playwright — PRD §5.)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
