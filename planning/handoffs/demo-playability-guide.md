# Making a demo playable: image assets + live AI

> For the session preparing another concept track's demo (agent-arena /
> doodle-life) for a pipeline run. Companion to `demo-prd-guide.md` — that one
> gets you a green run; this one exists because **apothecary v1 ran fully green
> through the harness and still failed its playtest**. Everything here was
> learned fixing that. Exemplars (all in-repo, live-verified): apothecary
> `PRD.md §2.1–2.4`, `server/ai-proxy.mjs`, `src/ai/`, `tools/asset-gen/`,
> `tools/ai-smoke/`, `data/generation.json`.

## 0. The v1 lesson — and the one principle

v1's playtest verdict: CSS-placeholder art and canned dialogue meant the demo
**didn't demo the game**. "그래픽 엔진 가동이 되냐가 관건" — whether the
graphics/AI machinery actually runs IS the PoC question, and the deliberately
stubbed parts turned out to be the point. The fix was not more units; it was
two categories of **provided inputs** prepared by humans before the run:

**Principle: agents integrate; humans provide what agents can't verify.**
Pipeline agents have no API keys, and LLM/image output is non-deterministic —
so nothing touching a vendor API can be gated inside the run. Don't extend the
harness to cope (we considered it; wrong move — the harness's value is
determinism). Instead, build and live-verify every vendor-touching piece by
hand before the run, hand it in like game data, and let units consume it
behind deterministic stubs.

## 1. Image assets

1. **Assets are provided inputs.** Generate the pack before the run (human
   runs a committed script once); the PRD lists an asset table (file, layout,
   render technique) and rules: *missing file → keep the CSS fallback for that
   slot + log to DISCOVERY.md; agents never generate assets in-run.*
2. **Freeze a style bible first, cheaply.** Run a human-in-the-loop style
   test: 3–5 candidate style strings, one low-quality sheet each, human picks
   the winner. Freeze it as **one sentence prepended to every image call**,
   pack and runtime alike — that's what keeps background, items, and
   runtime-generated NPCs in one visual register. (Ours: strict low-res pixel
   art — pixel styles also survive downscaling best.)
3. **Sheets, not images.** Pack every variant of one subject into one grid in
   one call: expressions×blink as 4×2, quantity states as 4×3, animation
   frames as 2×2, sliced via CSS `background-position`. **One call per subject,
   ever** — character consistency across separate calls does not exist, so a
   character split over two calls is two different characters. (Also rejected
   for this reason: blank-face base + face-part compositing on the client —
   registration/seams fail across calls, and it isn't even cheaper.)
4. **Generate motion almost never.** Only blink earned generated frames (one
   closed-eye row — cheap, high liveliness). Everything else is CSS on a
   static cell: `steps(N)` loops for equipment, transforms for breathing/
   fidget. Requires prompts that pin subject position identical across cells.
5. **Pixel pipeline:** generate at 1024/1536 → downscale by one shared factor
   (we use 4) → a true pixel grid emerges, generation artifacts vanish, files
   shrink → browser upscales with `image-rendering: pixelated`. Runtime
   generations get the same treatment client-side (offscreen canvas) so their
   density matches the pack.
6. **Never ask the model for transparency.** Sprites: flat magenta background
   → offline color-key to alpha. Portraits: keep the background, render inside
   a framed card panel; silhouette/unrevealed states are CSS `filter`, not
   separate images.
7. **Tooling pattern** (copy `tools/asset-gen/`): zero-config script + Korean
   runbook so the teammate holding keys can run it; keys via command-line env
   var only (rule 6); `--only <id>` for re-rolls; script logs the exact prompt
   per asset into a summary → that text goes verbatim into
   `assets-manifest.json` (rule 5, no exceptions); raw outputs never committed.

## 2. Live LLM infra

1. **Dev-proxy pattern — no separate server.** A Vite dev-middleware plugin
   exposes `/ai/*` endpoints; keys are read from **server-side `process.env`**
   per request. `apply: 'serve'` means the production build physically lacks
   the live path → the deployed Pages demo is stub-mode **by construction**,
   and a client-side secret is structurally impossible (still gate on a
   `dist/` secret-grep).
2. **One schema, two adapters.** `AIAdapter` with live and stub impls behind
   a boot health probe (~800ms). The renderer cannot tell modes apart; every
   live response is validated with the same validator as stub data (one retry
   → silent per-beat stub fallback — degradation never shows error UI).
3. **All timing through the adapter.** Simulated latency is adapter config;
   `setTimeout` in game logic is banned. This single rule is what keeps the
   run's tests deterministic while the real thing is slow and jittery.
4. **Membrane holds at the seam.** The client sends only structured fields
   (trait strings from a data table, the card the player clicked). Prompt
   prose is composed server-side in the proxy. Balance numbers (patience
   costs etc.) are stamped from `data/` by the proxy — never model-chosen.
   Use forced tool-use for structured output; don't parse prose.
5. **Latency is a design input, not a bug.** Budget real numbers (dialogue
   ~2–5s, image sheets tens of seconds to minutes) and hide them in the
   game's rhythm: prefetch entity N+1 the moment N's scene starts; let late
   images arrive as a designed state (silhouette that resolves); a themed
   waiting beat with a hard timeout → bundled fallback. Never a spinner.
6. **Split verification by who can do it.** Automated gates: stub-only.
   Live path: a committed smoke script (`tools/ai-smoke/` pattern — one real
   call per endpoint **through the actual proxy**, two terminals, a few
   cents) run by the key-holder BEFORE the run, plus a manual live checklist
   before the bake-off. Then shrink the run's AI unit to "stub adapter + boot
   wiring + tests" — the biggest risk we removed was a unit whose author
   could never execute its own code.
7. **Stub quality floor.** The deployed demo runs stub-mode forever, so stub
   content must be worth playing on its own (write it to paper-prototype
   quality). Live AI is the demo's proof; stub is what judges on bad wifi get.

## 3. Pre-launch checklist (order matters)

1. Style test run by key-holder → style bible frozen into data.
2. Asset pack generated → human-reviewed (sheet cell alignment! position
   drift breaks `steps()` and slicing) → copied into the demo → manifested.
3. Proxy + contract + adapter committed; `ai-smoke` reports PASS.
4. PRD marks all of the above as **provided inputs** ("integrate, don't
   rewrite; don't generate assets in-run") and keeps every unit gate
   stub-mode.
5. Launch. Log every friction to DISCOVERY.md — harness game-mod evidence.

> Supersedes `demo-prd-guide.md` §3 "no runtime network calls / LLM fully
> stubbed" — that was v1-era doctrine and is exactly what the playtest failed.
> Current rule: **no network calls in the deployed build; live AI in dev via
> the dev-proxy seam; stub is the floor, not the spec.**
