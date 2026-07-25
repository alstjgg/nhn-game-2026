// vite.build-inputs.ts — which HTML entry points a build emits.
//
// The deployed artifact is the demo home and nothing else. The e2e harness pages
// (design D10) drive individual screens through URL parameters and install
// internal hooks (`window.__testClock` / `__testScript`), so publishing them next
// to the judged demo would put a parameter-driven build of the game — including
// states whose purpose is to freeze generation forever — on the Pages site
// (PR #33, R2 on vite.config.ts:29). They are therefore built ONLY when the e2e
// gate asks for them: `playwright.config.ts` sets `E2E=1` for its webServer build.
//
// Pure and dependency-free (no vite import) so the rule itself is unit-testable.

/** Harness pages, by rollup input name → HTML path relative to the demo root. */
export const HARNESS_INPUTS: Readonly<Record<string, string>> = Object.freeze({
  conversation: './e2e/harness/conversation/index.html',
  crafting: './e2e/harness/crafting/index.html',
  portrait: './e2e/harness/portrait/index.html',
  generation: './e2e/harness/generation/index.html',
});

/** The one entry every build emits. */
export const MAIN_INPUT: Readonly<Record<string, string>> = Object.freeze({
  main: './index.html',
});

/**
 * The build's rollup inputs for an environment. `E2E=1` (the e2e gate) adds the
 * harness pages; anything else — a plain `npm run build`, CI, the Pages deploy —
 * gets the demo home alone.
 */
export function resolveBuildInputs(
  env: Readonly<Record<string, string | undefined>>,
): Record<string, string> {
  return env.E2E === '1' ? { ...MAIN_INPUT, ...HARNESS_INPUTS } : { ...MAIN_INPUT };
}
