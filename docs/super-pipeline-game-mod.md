# super-pipeline — Game Development Modification Spec

> Planning document. Describes what to add to super-pipeline so it can drive game development
> for the NHN AI Game Competition, letting the team focus on direction/기획 instead of implementation.
> Status: **draft — priorities and scope to be confirmed before any implementation.**

## Why modify

super-pipeline optimizes for *correctness* (SPEC→DESIGN→TEST→IMPLEMENT→VERIFY, loop-until-green).
Games additionally require *fun and feel*, which tests cannot measure. The modification adds:
(a) ways for agents to observe the running game, (b) ways for humans to judge feel cheaply,
(c) game-specific artifacts (assets, tuning data), and (d) automatic evidence collection for the
competition's AI utilization document.

The base harness is proven (worked hands-off during Devagotchi) — modifications are **pure
extensions** (OCP, same philosophy as the existing repo: don't touch `/pipeline`, `/goal`, etc.).

## Proposed additions (priority-ordered, cut from the bottom)

### P0 — must have
1. **Deploy-verify step** — every wave ends with a GitHub Pages deploy + smoke test (page loads,
   canvas renders, no console errors). Guarantees a playable link exists at all times; eliminates
   week-3 deploy panic. Likely lives in the workflow's wave-end hook + a small script.
2. **Playtest agent** — headless-browser (Playwright) agent that loads the deployed build, sends
   scripted inputs, screenshots key states, and files a "playability report" on the unit PR.
   Extends VERIFY from "tests green" to "tests green + game is reachable/playable end-to-end."
3. **Screenshot/GIF capture in unit PRs** — playtest agent attaches gameplay captures to PRs so
   the human director reviews *visually* from the dashboard PR without pulling branches.

### P1 — strong value
4. **GDD-as-PRD template** — a game design doc format the super-decomposer handles well:
   core loop / entities / states / screens / tuning parameters / juice checklist. Improves
   decomposition quality; becomes the standing input format for daily PRD slices.
5. **Game-designer reviewer persona** — new panel disposition focused on game feel heuristics:
   input latency, feedback/juice, readability, difficulty curve, first-30-seconds clarity.
6. **Balance-as-data convention** — all tunables (speeds, costs, spawn rates, timings) live in
   JSON/TS data files, never inline. Enables tuning PRs without logic changes, and a possible
   later "balance agent."
7. **Asset-gen unit type** — a work-unit class that generates assets (image-gen / sound-gen),
   commits them, and appends `{file, tool, prompt, license}` to `assets-manifest.json`.
   The manifest directly feeds the competition's mandatory attribution section.

### P2 — nice to have
8. **Auto-drafted AI 기술 문서** — end-of-project agent that mines board.json, prompts, PR/commit
   history, and the asset manifest, then drafts the AI utilization PDF content.
9. **Daily director's build** — end-of-day summary posted to the dashboard PR: playable link,
   changelog, open questions. Supports the 2h/day cadence: play 20 min → `/super-steer` → write
   next PRD slice.

## Division of labor implied
- **Harness + agents run implementation.** Humans do not hand-write game code.
- **Member A (director):** GDD/PRD slices, steer decisions, feel judgments, panel review reading.
- **Member B:** owns backend components if runtime LLM is chosen (proxy server), plus playtesting
  and content/prompt work. Exact lane still open.

## Competition-facing payoff (why this doubles as the entry's story)
- Commit/PR history is agent-attributed (`[AGENT: ...]`) — living evidence for the AI doc.
- The harness itself *is* the "director of AI" narrative; the game-mod additions show deliberate
  orchestration design, not just tool usage.
- Asset manifest satisfies the mandatory license attribution requirement automatically.

## Open questions
- Which P1 items make the cut given the 3-week budget?
- Playtest agent input scripting: hardcoded input sequences vs. simple goal-driven exploration?
- Does the game-mod live in the super-pipeline repo (as new unit types/personas) or as a
  project-local overlay in the game repo's `.claude/`?
- Dry-run plan: feed the harness a trivial game PRD ("Pong on Pages") on day 1 to validate the
  full loop against a game repo before committing to it.
