// [u9d#c6] The debug pane's build flag, declared for the type-checker.
//
// The value itself is a vite `define` (see `vite.config.ts`): a literal the
// bundler constant-folds, so `if (__DEBUG_PANE__)` in `src/client/main.ts`
// becomes `if (false)` in the player build and the guarded dynamic import — and
// with it every module under `src/client/debug/` — is dropped whole
// (spec-client §3 invariant 11).
//
// An ambient declaration file on purpose: `moduleDetection: "force"` exempts
// declaration files, so this stays a global script and `main.ts` can name the
// flag without importing anything from the pane (which would pin it into the
// bundle and defeat the exclusion).
declare const __DEBUG_PANE__: boolean
