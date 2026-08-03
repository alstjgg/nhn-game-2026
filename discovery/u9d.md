# u9d — DISCOVERY (debug pane · build flag · flag-off exclusion)

run 20260803-213143 · IMPLEMENT attempt 1. Nothing below was fixed inline; each
item is a decision for the integrator or a later unit. (The TEST phase of this
unit appended its own notes straight into the root `DISCOVERY.md`; those are not
repeated here.)

## A. Oracle collisions with u0's scaffold guards

1. **`tests/scaffold/isomorphism-guard.test.ts` › `[u0#c9]` "git reports
   vite.config.ts unmodified".** u0 froze `vite.config.ts` with a
   `git status --porcelain -- vite.config.ts` assertion, while `u9d#c6` names
   this unit the *only* one permitted to edit that file (the `__DEBUG_PANE__`
   define). The two cannot both hold in a dirty tree. It is green again **once
   the change is committed** — `git status` compares against HEAD, so a
   committed edit reports clean — but any agent that runs the scaffold suite
   against an *uncommitted* u9d worktree will see it red. If u0's intent is
   "no §3.7 copy plugin" (its own describe title), the assertion should be
   narrowed to the source-level checks that follow it; the git check cannot
   express that intent. **Integrator decides.**
2. **`tests/scaffold/layout.test.ts` › `[u0#c8]` "main.ts is a thin boot root
   (<= 5 code statements)".** The census counts *lines*, not statements, so the
   flag guard had to be folded onto one line:
   `if (__DEBUG_PANE__) void import('./debug/index.ts').then((pane) => pane.startDebugPane())`.
   With the readable four-line block the boot root came to 8 lines and the
   assertion failed. Pre-existing and unrelated: the same file's other two
   `[u0#c8]` assertions ("every file under src/client/ is a .gitkeep or
   main.ts", "no stylesheet") are already red on the base commit — every unit
   from u1 on adds files there.

## B. Seam friction — the pane has no op channel to read

3. `window.__shell` (u3's dev handle) exposes `frame()` and `drain()` only, and
   the driver emits `ViewEvent`s but never echoes the `MembraneOp`s it is sent.
   So the pane's **events** table is a real mirror of driver output (polled off
   `frame()` on the animation frame — there is no `subscribe()` on the handle),
   while its **ops** table can only show what a caller hands it through
   `window.__debug.noteOp(op)`: an observation-only recorder that never forwards
   to the driver (inv 12). When an op-emission channel lands at the seam, the
   ops table should be re-pointed at it and `noteOp` retired.
4. Polling rather than subscribing is a deliberate consequence of §2.1: `debug/`
   may import `driver/` and `shared/` only, so the pane cannot take the driver
   instance from `shell/boot.ts` and must go through the published handle.

## C. Scope gap in the unit's `file_globs`

5. The globs are `src/client/debug/**`, `vite.config.ts`, `tests/debug/**`,
   `e2e/debug-pane.spec.ts` — but a build-flag-only pane cannot mount without a
   one-line, flag-guarded dynamic import in **`src/client/main.ts`**, and the
   RED suite pins exactly that shape (`flag-off-bundle.test.ts` › "the reference
   guard"). `index.html` is closed to it (inv 11 grep) and `vite.config.ts` may
   not carry a plugin (c6). The edit to `main.ts` is therefore load-bearing and
   intentional; the glob list is what is incomplete.

## D. Harness friction — the e2e port is shared across worktrees

6. `playwright.config.ts` hardcodes port 5174 with
   `reuseExistingServer: !process.env.CI`. Parallel worktrees of the same run
   (here: `…/u9`) hold that port, so `npx playwright test` from this worktree
   silently tested **another unit's app** and reported four failures on
   `#debug-pane`. Verified green by pointing a throwaway config at port 5199,
   then re-ran the canonical acceptance command with `CI=1` (which forces
   Playwright to boot the dev server from *this* worktree) once 5174 was free.
   Any agent or verifier running e2e in parallel needs `CI=1` plus a free port,
   or a per-worktree port. **Harness decides.**

## E. Pre-existing failures this unit did not cause

7. `e2e/fonts.spec.ts` (load budget, unicode-range slice count) fails identically
   with this unit's changes stashed — u10 territory. Likewise the two
   `[u0#c8]` census assertions in `tests/scaffold/layout.test.ts` and the
   `tests/styles/*` / `tests/assets/fonts-css.test.ts` reds.
