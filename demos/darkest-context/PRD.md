# Darkest Context Demo — PRD v1 (live judgment in the tile rhythm)

> **Owner:** 민서 · **Stack:** Vite + TypeScript + DOM/CSS — no game engine, no framework ·
> **Location:** `demos/darkest-context/` (self-contained, own `package.json`). Repo root
> untouched except `assets-manifest.json` entries for the provided asset pack.
>
> **This is a GREENFIELD run** on the apothecary-v2 playbook
> (`docs/handoffs/demo-playability-guide.md`): vendor-touching pieces and image assets are
> **PROVIDED INPUTS** — built and live-verified by humans before the run
> (`server/ai-proxy.mjs`, `src/ai/contract.ts`, `src/ai/adapter.ts` live impl,
> `data/generation.json`, `assets/` pack, `tools/ai-smoke/` PASS). Agents **integrate
> against them and may extend the contract, but do not rewrite vendor-call code and never
> generate assets in-run.** Conflict order: this PRD → provided inputs → concept doc
> (`docs/game-concept-darkest-context.md`, **reference-only**) → merged brief
> (`docs/agent-arena-brief.md`, **reference-only**) → examples spec
> (`docs/agent-arena-examples.md`, **reference-only**). Nothing from the reference docs is
> in scope unless this PRD names it; the demo slice is cut here. (The brief's three open
> decisions are settled by this PRD: 강제 배분 **cut** §1 · cutline §2.4 · 자동 전진 §2.4.)

---

## 1. PoC question & must-prove list

The bake-off question: **"can live, card-composed LLM judgment run inside the tile
rhythm — surprising yet card-attributable, latency hidden, silently degradable?"**
Stub mode is the quality floor, not the spec: the deployed Pages build is stub-mode by
construction (§2.1) and must be worth playing, but live dev mode is the demo's proof —
canned decisions cannot prove criterion 1, because an authored flip is never *unexpected*.

**Must-prove list (this IS the spec):**

1. **Attribution (귀속), live** — in dev mode every party decision comes from a real LLM
   as `{action, say, because[]}`; `because` chips resolve to actual sheet items (default
   prompt / equipped cards), and equipping a high-intensity card visibly changes behavior
   with the card cited. **Stub floor:** authored flips — 피오나+「겁이 없다」
   (shield-hugger → first to charge), 가렛+「원한」 (retargets `last_hit_by`) — exist in
   the canned pool and are e2e-asserted.
2. **Personality reads in stationary turn-based combat** — no unit movement; action choice +
   speech bubble alone must make 피오나's fear legible on screen (opening turn: she defends
   while unhurt, bubble + `because: [fiona.default]`).
3. **Tile rhythm** — 전진 → 이벤트 → 전진 carries a full run in 3–5 minutes; the first
   combat starts **within 60s of page load** at default tunables (hard rule, e2e-asserted).
4. **Context gauge drama** — at ≥70% the unit judges a *corrupted* situation. Live mode:
   the engine poisons the structured snapshot before prompt composition and the model
   honestly judges bad input (a phantom enemy in her bubble); stub mode: canned
   `gauge_noise` variants. Execution always runs on real state. Gauge is engine-managed
   numbers — deterministic, level-designable. **Observable in T1:** 스팸 골렘's 도배 hits
   concentrate the gauge on one hero, so at default tunables at least one unit reaches ≥70
   inside the first combat (§2.5, e2e-asserted) — a judge must never finish the demo
   without seeing a noise turn.
5. **Mode-blind renderer** — boot health probe picks live or stub behind one `AIAdapter`
   interface; the renderer cannot tell modes apart; live output passes the same validator
   as stub data; degradation is silent.
6. **Membrane + player verbs** — the player only clicks: 분기 선택 · 카드 드래프트 · 장착
   (자유 배정) · 휴식 선택 · 재시작. Zero typing, zero free text.

**Does NOT do** (concept features explicitly cut from this demo): network calls **in the
deployed build** (dev-proxy only, §2.1) · API keys in the bundle or repo · in-run asset
generation (pack is a provided input, §2.8) · roster 선발 screen (party fixed at 3, §2.3) ·
토큰/상점/보물상자/뇌물 (no currency at all) · 탈옥/교섭 · 1대1 결투 · 인선 회의 · 보스전
vs 상대 에이전트 파티 · 회의 라운드2 반론 (council is 1 stance round + vote) ·
**강제 배분 (the discard choice when slots are full)** — the brief §8-1 signature, but it
does not hold at demo scale: one run grants at most 5 cards against 3 units × 8 = 24 slots,
so slots never fill. Narrowing slots or widening card influx is balance tuning, not this
demo's PoC question → **drafted cards are freely assigned to any unit** (examples spec §4.4
훈련장 grammar as-is). 저주성 Prompt cards (「허세」 「수다스러움」) are cut with it — without
a full-slot puzzle to absorb the bitterness, a curse is just a weak card ·
프롬프트 임프 (a monster force-equipping a curse card) · 귀속 리포트 screen (per-decision
chips only) · **live response cache** (the brief §6 [조합 × 맥락 버킷] interpretation cache —
at 7 tiles cost is not the problem, so it goes) · save/audio/routing/meta-progression ·
balance tuning · **randomness in outcomes** (damage dice · probabilistic rewards · random
encounters — randomness breaks ties and nothing else, §2.2) ·
runtime LLM chatter (design-time pool only).

## 2. Architecture & baked defaults

### 2.1 AI access — dev-proxy pattern (hard security rule; provided inputs)

- A **Vite dev-server middleware** (plugin in `vite.config.ts`, `apply: 'serve'`) exposes
  `POST /ai/decide` (combat turn), `POST /ai/stance` (council), `GET /ai/health`. Keys are
  read from **server-side `process.env`** per request; they never appear in the bundle,
  the repo, or `import.meta.env`. The production build physically lacks the middleware →
  **the deployed Pages demo is stub-mode by construction** — instant load, no secrets.
  Gate: `ANTHROPIC|OPENAI` must not appear in `dist/`.
- **Membrane at the seam:** the client sends only structured fields — unit id, equipped
  card ids, the engine-built situation snapshot. Prompt prose is composed **server-side**
  from sheet-assembly rules and tone in `data/generation.json`; balance numbers are
  stamped from `data/`, never model-chosen. Forced tool-use for structured output — no
  prose parsing.
- Model: decisions/stances → `claude-sonnet-5`. One retry on schema-invalid output, then
  silent per-call stub fallback. Every live response is validated with the same validator
  as stub data.
- **Proxy, contract, adapter live-impl, and `data/generation.json` are provided inputs**,
  smoke-verified pre-run via `tools/ai-smoke/`. Unit u3 builds only the stub impl + boot
  wiring on this seam — no agent owns code it cannot execute.

### 2.2 Decision adapter — one schema, two impls

- `src/ai/contract.ts`: decision schema `{action: string, target?: string, say: string,
  because: string[]}` + shared validator. `src/ai/adapter.ts`: `AIAdapter` interface —
  **live** (fetch `/ai/*`) and **stub** (canned `data/` JSON + configurable simulated
  latency). Boot: probe `/ai/health` (800ms timeout) → live if ok, else stub.
- **Stub keying with fallback chain** (stub-side only; live sends the full request): the
  engine computes a deterministic **situation bucket** — enumerated set, frozen:
  `opening | ally_hurt | self_hurt | enemy_low | gauge_noise | default`. Lookup order in
  `data/decisions.json`: `(unitId, bucket, equippedCardId)` → `(unitId, bucket)` →
  `(unitId, "default")`. The card-specific tier is where the authored flips live.
  **Every unit has a `default` entry for every action context** — no combination dead-ends.
- **All timing through the adapter.** Simulated latency is adapter config from
  `data/tuning.json` (stub default 900ms; 0 in unit tests; scripted in e2e). Decision
  timeout is **per mode**: stub 3000ms · live 8000ms (live calls budget 2–5s; the
  gauge-tier "delayed-reply acting" and sequential bubble playback absorb the wait).
  Timeout → that unit's 직업 기본 행동 (기사: 방어 · 사제: 대기 · 사기꾼: 회피) with a
  "…" bubble. The game never blocks on a decision. No `setTimeout` in game logic.
- Per-unit calls fire **in parallel** (wall-clock ≈ 1 call per turn). Enemies never use
  the adapter: monsters run authored deterministic behavior tables in
  `data/encounters.json` (스팸 골렘 hits lowest-HP hero; 환각 정령 gauge-attacks the
  highest-gauge hero).
- **Single tie-break seam (repo-wide in this demo):** every numeric tie — target
  selection, execution order, the council's deciding vote — resolves through **one
  injectable `tieBreak(candidates, ctx)` utility**. Two policies, chosen at boot alongside
  the adapter mode:
  - **`index`** — lowest array index in the owning `data/*.json` file (party:
    `data/heroes.json`; enemies: that encounter's roster order). **The default under
    automated gates (vitest/Playwright) and in stub mode** — e2e needs idempotence to run
    without flake.
  - **`random`** — **seeded RNG**, the default in live mode. A tie should genuinely be
    random; index order manufactures fake patterns ("가렛 always gets hit first"). The seed
    is drawn once at run start and kept in run state, so one run stays reproducible.
  - `Math.random` appears **only in seed creation** — never called directly anywhere in
    game logic, a single grep-able point (invariant 6).

### 2.3 Party, cards, sheets

- **Party fixed:** 가렛(방패기사) · 피오나(순례 사제) · 셀레네(은퇴한 사기꾼), stats and
  default prompts verbatim from the examples spec §2 (`data/heroes.json` carries all 4
  heroes incl. 모데카이 so the roster data is complete; the demo run — and the asset
  pack — cover only these 3).
- **Card pool — exactly 11:** Prompt 5 (「겁이 없다」 「원한」 「동료를 먼저」 「승부사」
  「연민」) · Skill 2 (「이단 베기」 「도발」) · MCP 4 (「화염 두루마리」(1회용 광역)
  「치유 물약 ×3」(**a 3-charge consumable** — the one-shot heal, three times)
  「거울 방패」(지속) 「번역 렌즈」(퍼즐 힌트 1회)). Texts and effects from examples spec §3;
  numbers live in `data/cards.json`. 저주성 Prompt cards (「허세」 「수다스러움」) are cut —
  §1 does-NOT-do.
- **Slots per unit:** Prompt 3 · Skill 2 · MCP 3.
- **Drafts are 3택1; equipping is free assignment.** The player always picks both the card
  and the unit it goes on — the engine never grants a specific card and never chooses the
  target. **Full-slot handling is out of scope for this demo** (강제 배분 cut, §1
  does-NOT-do): a run's card influx (5 at most) sits far below the slot total (3 units ×
  8 = 24), so slots never fill. The slot UI shows remaining capacity; no discard flow is
  built.
- **Duplicate pickups allowed:** a card that sits in two reward pools may be held twice.
  But **the same card cannot be equipped twice on one unit** — that unit is disabled in the
  target picker.
- Sheet assembly (system-prompt metaphor): base persona + equipped card sentences + stats.
  In live mode this composition happens in the proxy from structured ids; in stub mode it
  exists as the same data structure for the detail panel. Clicking a unit opens its sheet;
  items cited by its most recent `because` are highlighted.

### 2.4 Map, pacing, chatter

- **Fixed map — 9 tile entries, 1 branch, 7 tiles per run** (`data/map.json`):
  `T1 전투(스팸 골렘 ×1)` → `T2 훈련장` → **branch** → path A: `T3a 퍼즐(수수께끼 골렘)`
  → `T4a 훈련장` / path B: `T3b 선택이벤트(쓰러진 상인)` → `T4b 휴식` → rejoin →
  `T5 전투(스팸 골렘 + 환각 정령)` → `T6 휴식` → `T7 최종 전투(스팸 골렘 ×2 + 환각 정령)`.
- **Auto-advance:** the party walks (background strip scrolls on the single side-view
  stage); arrival fires the tile event. Player input only at the branch card pair. Walk
  duration is `data/` tunable (default 4s; 0 in tests). **Tile transitions are
  event-driven** (walk-complete event → event fires) — never wall-clock in logic or tests.
  In live mode the walk doubles as latency cover: the engine may prefire the first combat
  request on walk start.
- **Chatter:** during walks, 2–3 canned bubble exchanges play from a pool in
  `data/decisions.json`, selected **deterministically by tile index** (no randomness).

### 2.5 Combat — turn-based, stationary, deterministic execution

- Side-scroll line view: heroes left, enemies right, nobody moves; bubbles above heads.
- Turn loop: engine builds each hero's structured snapshot (real state, or corrupted copy
  at gauge ≥70) → parallel adapter calls → engine executes all intents in **민첩
  descending order** (ties → §2.2 `tieBreak`) with **fixed damage values** from `data/`
  (no dice, no RNG in outcomes — in live mode the LLM chooses *which* enumerated action,
  never any number; randomness breaks ties and nothing else).
- Base actions always available: `strike | defend | guard_ally`; Skill/MCP cards register
  additional actions. Consumables decrement in the engine.
- **Context gauge** (per unit, 0–100, HUD as a tinted vial — numbers in `data/tuning.json`):
  피격 +10 · **a 스팸 골렘 hit adds +10 more as 도배** (+20 total — 스팸 골렘 is the
  monster that fills your context with garbage) · 환각 정령 attack +25 · 퍼즐 오답 +15
  (all party). **The only relief is a 휴식 tile** (§2.7) — path A has none until T6. That
  is not a bug but the branch's designed risk: you carry gauge in exchange for more cards.
  **Early-drama requirement (design rule, e2e-asserted):** 스팸 골렘 keeps hitting the
  lowest-HP hero, so gauge concentrates on one unit — at default tunables **at least one
  unit must reach ≥70 inside the T1 combat**, the observation point for must-prove 4. Tune
  it with HP/damage numbers; if it drifts, adjust `data/tuning.json` only (the rule is
  fixed). Tiers: <40 none ·
  40–70 presentation only (bubble stutter, delayed-reply acting — also the live latency
  mask) · ≥70 **noise injection** — the snapshot handed to the adapter is corrupted (e.g.
  피오나 sees a phantom `spam_golem_2`; her bubble says so; execution still targets real
  entities — attacking a phantom renders as "허공을 벤다"). Gauge tier also selects the
  hero 대기-포즈 cell (§2.8) · **100 → judgment skipped, 직업 기본 행동 forced, fixed
  bubble.** The 100 tier is not failure handling or an exception — it is **authored
  drama**: watching an agent whose context blew out stop judging and repeat its base action
  is itself part of the spectacle. (Observation item: whether spectating dies when 100
  persists for several turns — measured at the bake-off, logged in DISCOVERY.md. Relief is
  the 휴식 tile's value, so no other cushion is added.)
- Victory → reward card(s) + free assignment (§2.3). Defeat (all heroes at 0 HP) →
  defeat screen → 재시작 (fresh run). Both screens reachable, e2e-asserted.
- **Rewards baked** (all 11 cards reachable within one run; any card with an interaction
  appears **before** the tile that uses it):
  - T1 승리 → fixed grant 「도발」.
  - **T2 훈련장 → 3택1 from [「겁이 없다」 「승부사」 「번역 렌즈」]** — the
    branch-preparation draft. The personality flip (§1-1) / the merchant council line
    (§2.6) / the puzzle hint (§2.6) each hook into one of T3's two forks, and two of the
    three must be given up — so what you passed on hurts immediately at T3. This is where
    the brief §3 claim "분기 선택이 빌드와 상호작용한다" lives.
  - T3a 퍼즐 정답 → 「거울 방패」 / 오답 → gauge +15 all, no card.
  - T3b 구한다 → 「연민」 / 지나친다 → nothing.
  - T4a 훈련장 → 3택1 from [「원한」 「동료를 먼저」 「화염 두루마리」]. T4b is 휴식, so the
    asymmetry — **path A pays in cards, path B in gauge relief** — is what the branch is
    worth.
  - T5 승리 → 3택1 from [「이단 베기」 「치유 물약 ×3」 「승부사」] (a second shot at
    「승부사」 if it was passed over at T2 — the merchant council is behind you, so here it
    reads only as combat temperament).
  - T7 → run clear screen.

### 2.6 Council engine — 퍼즐 · 선택이벤트 (shared)

One engine, two skins. Flow (baked, simplified from concept): engine presents an authored
agenda + closed options (`data/council.json`) → **one stance round** (parallel adapter
calls via `/ai/stance` in live mode; canned stances per unit per agenda in stub, with
card-variant entries — 셀레네+「승부사」 changes her vote on the merchant) → majority
vote; tie → highest agenda-related stat casts the deciding vote (stat ties → §2.2
`tieBreak` — with a 3-unit party a 1-1-1 split on a 3-option 퍼즐 really happens). **The
player cannot
intervene** — watching your party's values decide is the tile's point. 퍼즐: 수수께끼
골렘, 3 options, authored answer; 「번역 렌즈」 (if equipped on anyone) reveals a hint
line before the vote. 선택이벤트: 쓰러진 상인, 구한다/지나친다. **Both card interactions
(셀레네+「승부사」 flipping her vote · the 「번역 렌즈」 hint) are obtainable in the T2 draft,
so natural play reaches them** (§2.5) — no authored content is unreachable.

### 2.7 훈련장 · 휴식 (no adapter calls)

- **훈련장:** 3 cards fan out → player picks 1 → picks a unit → free assignment (§2.3).
  훈련장 **does not touch the gauge at all** — it only hands out cards (gauge relief is the
  휴식 tile's value, and "training empties your context" makes no sense in-concept).
- **휴식:** two option cards. ① 생각정리 — every unit's gauge −50. ② **Clear** — every
  unit's gauge → 0, but one equipped Prompt card (deterministic pick: the earliest-equipped
  one across the party; no RNG) is forgotten — "기억까지 지워진다". **If no Prompt card is
  equipped at all, only the gauge goes to 0** — no warning, no error text; the fallback is
  silent (invariant 7). Safe trim vs gamble, in two clicks.

### 2.8 Asset pack (provided input) + pixel pipeline

**Style bible:** frozen pre-run via a human-in-the-loop style test (3–5 candidate strings,
one cheap sheet each, human picks); stored in `data/generation.json` and prepended to
every image call. Pixel-art register expected (survives downscaling best). **Pixel
pipeline:** generate at 1024/1536 → downscale by shared factor **4** → browser upscales
with `image-rendering: pixelated`. Sprites are generated on flat magenta and color-keyed
to transparency offline (never ask the model for transparency). One call per subject,
ever — variants live as grid sheets sliced via CSS `background-position`.

`demos/darkest-context/assets/` contents:

| asset | layout | render |
|---|---|---|
| 던전 배경 | 1 image, horizontally tileable strip | walk-scroll background |
| 영웅 3종 (가렛·피오나·셀레네) | 1 sheet each, **4×3** — row 1: 걷기 사이클 4프레임 (위치 고정) · row 2: 게이지 tier 대기 포즈 4종 (평온/불안/한계/폭주) · row 3: 액션 4종 (공격/방어/피격/쓰러짐) | side-view full-body sprite; walk = CSS `steps(4)` loop during scroll, 대기 포즈 cell ← gauge tier (§2.5), 액션 cell은 전투 연출 + 개별 HP 0 = 쓰러짐 |
| 몬스터 2종 (스팸 골렘 · 환각 정령) | 1 sheet each, **2×3**: idle · 피격 · 사망(잔해) + 공격 3프레임 | attack = CSS `steps(3)` loop |
| 말풍선 frame | 1 image | CSS `border-image` 9-slice |
| 카드 frame | 1 image | CSS `border-image` 9-slice; Prompt/Skill/MCP 구분은 CSS tint |
| 카드 아이콘 | 1 sheet, 4×3 — 11종 카드 아이콘 + 카드 뒷면 1 | `background-position`, frame 안에 합성 |
| 게이지 vial | 1 sheet, 4 states | `background-position` |

Provided before the run; every file already has an `assets-manifest.json` entry at repo
root (rule 5). **If a listed file is missing at build time, agents keep the CSS fallback
for that slot and log it in DISCOVERY.md — never generate assets during the run.** All
other motion (breathing bob, fidget, 고게이지 걷기 tint/흔들림 overlay) is CSS
transforms/keyframes on static cells — 걷기 중 게이지 표현은 별도 프레임이 아니라 CSS
overlay + vial HUD로 처리한다.

### 2.9 Stub quality floor

The deployed demo runs stub-mode forever, so the canned pool must be worth playing on its
own. `data/decisions.json` covers every (unit × bucket) with a default, plus the named
card-variant entries — 피오나+「겁이 없다」 · 가렛+「원한」 (§1-1) · 셀레네+「승부사」
(§2.6) — written to the tone bar of the concept doc's §4.1 turn
walkthrough (in-character Korean, one sentence, no translationese). All game text is
Korean. Chatter pool ≥ 12 exchanges.

## 3. Data shapes (files frozen; sub-structure to the implementer)

`data/heroes.json` (4 heroes: stats, default prompt text+id, base skill, 직업 기본 행동) ·
`data/cards.json` (11 cards: type, text, engine hook, slot kind) ·
`data/map.json` (9 tile entries: id, kind, branch links, walk duration ref) ·
`data/encounters.json` (monster stats, deterministic behavior tables, per-tile rosters) ·
`data/decisions.json` (canned decisions keyed unit×bucket×card?, council stances, chatter
pool) · `data/council.json` (agendas, options, answers, rewards) ·
`data/generation.json` (**provided input**: style bible, sheet-assembly prose rules, tier
tones) · `data/tuning.json` (gauge numbers, damage, latency sim, per-mode timeouts, walk
duration, slot counts, draft pick count, per-mode `tieBreak` policy). All tunables live
here — never inline.

## 4. Invariants (review-blocking)

1. **Membrane** — no text input UI anywhere; no `<input>`/`<textarea>`/`contenteditable`
   for game verbs (e2e-asserted). Client → proxy traffic is structured fields only; prose
   composition is server-side.
2. **No secrets client-side** — keys only in dev-middleware `process.env`; grep-able:
   `ANTHROPIC|OPENAI` must not appear in `dist/`.
3. **Attribution** — every displayed agent decision carries ≥1 `because` id; every chip
   resolves to a real sheet item; unresolvable ids fail validation.
4. **Intent-LLM / execution-engine split** — adapter output is only an enumerated action
   id (+target, say, because); all numbers and state changes are engine-side. Gauge noise
   corrupts **judgment input only**; execution always runs on real state.
5. **Stub schema = live schema** — everything the renderer consumes crosses the
   `AIAdapter` interface and passes the shared validator; the renderer is mode-blind.
6. **All timing through the adapter / `data/` tunables** — no game-logic `setTimeout`.
   **Randomness is confined to tie-breaking**: outcomes (damage, targets-by-rule, rewards,
   chatter, council answers) are never random; numeric ties go through the single
   `tieBreak()` seam (§2.2) whose policy is `index` under automated gates and seeded
   `random` in live mode. `Math.random` appears in exactly one place — seed creation —
   and nowhere else (grep-able).
7. **The game never waits on a decision** — per-mode timeout → 직업 기본 행동 + "…"
   bubble. **Graceful degradation is silent** — fallbacks never show error text.
8. Repo-wide: no engine/framework · balance-as-data · Vite `base: './'` subpath-safe
   dist · reads as a game, not a form (no native form controls for verbs; no instant DOM
   swaps between phases) · no network calls in the deployed build · root untouched except
   manifest entries.

## 5. Verification seams

- **All automated gates run stub mode** with adapter latency 0 (unit) or scripted (e2e)
  **and `tieBreak` policy `index`** — deterministic by construction (event-driven
  transitions, no random outcomes). The `random` policy gets its own unit test with a
  fixed seed; nothing else in the suite ever sees it.
- vitest for pure logic: data loaders/validators, adapter keying + fallback chain +
  timeout, combat turn resolution, gauge/noise thresholds, council vote/tie-break, run FSM.
- Playwright per-screen specs are the unit gates: page loads with zero console errors,
  phase reachable by click, named animations/classes fire, `because` chips render and
  resolve, the 피오나 stub flip is observable, the pacing rule (§1-3) holds at default
  tunables, assets render (or CSS fallback if missing).
- **Two gates that exist because the content would otherwise be unreachable:**
  ① at least one unit reaches gauge ≥70 inside the T1 combat and a noise turn renders (§2.5).
  ② the 「번역 렌즈」 / 「승부사」 council interactions are observed in T2-acquire →
  T3-fire order (§2.6).
- **Live mode is gated by `e2e/live-smoke.md`** — a manual checklist (keys exported →
  `npm run dev` → live combat decisions observed with because chips; a card equip changes
  live behavior; gauge-noise turn observed; kill network mid-run → silent stub fallback).
  Optional `@live`-tagged Playwright specs run only when keys are present; CI/agents never
  require them.
- **Per-unit gate = that unit's own test slice only.** The full-run e2e gates only the
  final unit.

## 6. Work-unit DAG hint (decomposer refines)

| id | title | deps | complexity | own-slice gate |
|---|---|---|---|---|
| u1 | Data schemas + loaders + validators for all `data/*.json`, incl. authored content pass (§2.9) | — | standard | `vitest run tests/data/` |
| u2 | Shared UI primitives: side-view stage, unit panels + sheet detail, speech bubble + because chips, card component, gauge/HUD, animation vocabulary | — | standard | `playwright test e2e/primitives.spec.ts` |
| u3 | AI adapter integration on the provided seam (§2.1–2.2): stub impl (keying/fallback/latency), boot probe wiring, adapter tests, no-secrets check | u1 | standard | `vitest run tests/adapter/` + `npm run build` + dist grep clean |
| u4 | Run FSM + map: auto-advance, walk scroll + chatter, branch choice, event firing + prefire hook, clear/defeat screens | u1,u2 | standard | `vitest run tests/run/` + `playwright test e2e/map.spec.ts` |
| u5 | Combat: turn loop, deterministic execution (incl. the §2.2 `tieBreak` seam), gauge + 스팸 도배 + noise injection, rewards handoff | u1,u2,u3 | high | `vitest run tests/combat/` + `playwright test e2e/combat.spec.ts` |
| u6 | Council engine + 퍼즐/선택이벤트 screens | u1,u2,u3 | standard | `playwright test e2e/council.spec.ts` |
| u7 | 훈련장 (3택1 + free assignment · no duplicate card on one unit) + 휴식 (생각정리/Clear, no-Prompt-card fallback) | u1,u2 | standard | `playwright test e2e/equip.spec.ts` |
| u8 | Asset pack integration across all screens (bg/sprites/frames/vial + pixel rendering) | u2 | standard | `playwright test e2e/assets.spec.ts` + manifest check |
| u9 | Full-run integration + juice pass + full e2e (incl. §1 must-proves) + `e2e/live-smoke.md` + DISCOVERY.md | u4,u5,u6,u7,u8 | standard | full stub-mode suite + `npm run build` |

## 7. Definition of done

**Stub mode (automated):** `npm ci && npm run build` green · full vitest + Playwright
suite green · dist smoke under a Pages subpath (`base: './'`) · dist secret-grep clean ·
a full run playable start → clear in 3–5 min and start → first combat < 60s · stub
attribution flips observable and asserted · no text-input elements in the DOM · assets
integrated + manifested (or CSS fallback + DISCOVERY.md note per missing file).
**Live mode (manual, before bake-off):** `live-smoke.md` checklist passes end-to-end with
real keys — live decisions with because chips, a card-equip behavior change, a gauge-noise
turn, and silent stub fallback on network kill all observed. `DISCOVERY.md` populated
(spec gaps + harness frictions — first-class deliverable feeding the super-pipeline
game-mod).
