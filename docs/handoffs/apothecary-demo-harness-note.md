# Harness note — apothecary demo batch (2026-07-23)

> Outcome from the harness-tweak session (`super-pipeline`, branch `harness/wave-gate`).
> Status: **BUILT** (not cut). Installed to `~/.claude/` — live for the run session.

## What was built

**#9 `demo_publish`** — an opt-in wave-end step in `super-pipeline.workflow.js`, implemented
as a pure extension in the same pattern as #7 (wave gate) and #8 (fast tail). No existing
stage was modified; validated against a throwaway static `dist/` fixture, not the real demo.

Behavior (matches the contract's "required behavior" section):

- **Input**: `args.demo_publish = { "dir": "<repo-relative demo dir>", "pages_base": "<optional Pages base URL>" }`.
  The directory is a parameter — `demos/apothecary/` is just this batch's value.
- **When**: after each wave's merge barrier (`demo:after-wave-N`) and once after integration
  (`demo:before-final-review`). Runs **before** the wave gate, so a gate supervisor sees the
  demo link when deciding `[GATE-OK]`. Skips cheaply if the demo dir isn't merged yet
  (`demo_dir_absent`) or its last commit is unchanged (dedup via `.claude/super/demo-publish.json`).
- **What the agent does**: builds `npm ci && npm run build` in an integration-branch worktree
  (never touches `repo_root`), smoke-checks per the contract (page loads / no console errors /
  root element — falls back to honest `smoke='static-only'` if no headless browser), then publishes:
  1. If Pages deploys from a **branch**: commits `dist/` under the demo **subpath only** on that
     branch — root Pages deploy untouched (contract's OUT rule respected in the prompt as a hard rule).
  2. Otherwise: screenshots pushed to a `super/demo-shots/<run_id>` branch, blob URLs posted.
  3. Last resort: posts the local preview command and reports `published=false`.
- **Where the human looks**: a `[AGENT: Demo]` comment on the dashboard PR with URL/screenshots,
  smoke result, and the source commit hash.
- **Failure is non-blocking**: observation-only; the run continues and `finalize` reports a
  `demo: { attempts, published, skipped, failed }` stat.
- Requires `git_mode=full` + dashboard PR (like steer/gate); otherwise logs a warning and stays off.

## How the run session uses it

At the approval gate (launcher Step 4/6), include in the workflow `args`:

```json
"demo_publish": { "dir": "demos/apothecary" }
```

(Optionally `"pages_base": "https://<pages-host>/nhn-game-2026/"` if known.) The launcher doc
(`commands/super-pipeline.md`) now lists the option, the `args` field, the `board.json` field,
and the resume rule (reload `demo_publish` identically from board — cache stability).

**The updated harness is already installed** (`bun run install:global` ran; backup at
`~/.claude/backups/super-pipeline-2026-07-23T08-28-00-166Z`). No further action needed to activate.

## Validation done

- `scripts/test-demo-publish.ts` (new, added to `bun run validate`): call placement
  (2 wave boundaries + before-final = 3 calls on a 2-wave DAG), ordering
  (merge → demo → gate → steer; demo before final author), prompt contract (parameterized dir,
  dashboard PR number, `[AGENT: Demo]`, root-deploy-untouched rule, `npm ci && npm run build`),
  stats, failure-tolerant completion, off-by-default, inactive warning in local mode.
- Full `bun run validate` green (37 unit tests + 5 control-flow scripts) and the existing
  `test-wave-gate.ts` / `test-fast-tail.ts` still pass unchanged.
- Throwaway static fixture (scratchpad): `npm ci && npm run build` → `dist/index.html` with a
  root element and relative asset path — the exact command sequence the agent prompt uses.

## Caveats

- Changes are on branch `harness/wave-gate` in `super-pipeline`, **uncommitted** (commit wasn't
  in scope for this session). The installed `~/.claude/` copy is what the run uses, so the batch
  is unaffected; commit before the next harness edit to avoid losing the diff.
- Screenshot capture depends on a headless browser being available to the agent; the prompt has
  explicit fallbacks so the step degrades to a preview-command comment rather than lying about smoke.
- If the game repo's Pages deploys via a GitHub **workflow** (not a branch), option (a) is
  impossible by design — expect the screenshot/fallback path.
