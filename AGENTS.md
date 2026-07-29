# AGENTS.md — nhn-game-2026

Guidance for Codex (and any non-Claude agent) sessions working in this repository.

**Read [CLAUDE.md](./CLAUDE.md) first — every rule there applies verbatim to your
session.** That file is the single source of the repo's permanent rules (git identity,
history, deploy, asset manifest, membrane rule, layout, commands); where it says
"Claude Code", read it as "your session". This file intentionally holds no copy of
those rules — a previous full copy drifted, so it was reduced to this pointer.

Then read [docs/status.md](./docs/status.md) for the current phase, active work, and
next steps **before starting any work**.

Codex-specific notes:

- `.claude/` holds Claude-Code-specific harness files (subagent definitions, slash
  commands, and gitignored `.claude/super/` runtime state). Don't run, edit, or
  commit anything under `.claude/super/`; treat the rest as another tool's config —
  keep it intact.
