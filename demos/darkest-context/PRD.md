# Darkest Context Demo — PRD v1 (does the spectating stand up?)

> **Owner:** 민서 · **Stack:** Vite + TypeScript + DOM/CSS — no game engine, no framework ·
> **Location:** `demos/darkest-context/` (self-contained, own `package.json`). Repo root untouched.
>
> **This is a GREENFIELD run.** Conflict order: this PRD → concept doc
> (`docs/game-concept-darkest-context.md`, **reference-only**) → examples spec
> (`docs/agent-arena-examples.md`, **reference-only**). Nothing from the reference docs is in
> scope unless this PRD names it. The concept is deliberately specced at max scope there;
> the demo slice is cut **here**.

---

## 1. PoC question & must-prove list

The bake-off question: **"is watching a party of card-built agents fun for 3–5 minutes —
even fully stubbed?"** The LLM slot must exist (adapter + schema), but every judgment in
this demo is canned JSON from `data/`. No network, no keys, no proxy.

**Must-prove list (this IS the spec):**

1. **Attribution (귀속)** — every agent decision renders as `{action, say, because[]}`;
   `because` chips resolve to actual sheet items (default prompt / equipped cards), and
   equipping a high-intensity card **visibly flips** a unit's behavior with the card cited.
   Authored flagship flips: 피오나+「겁이 없다」 (shield-hugger → first to charge),
   가렛+「원한」 (target switches to `last_hit_by`). Both e2e-asserted.
2. **Personality reads in stationary turn-based combat** — no unit movement; action choice +
   speech bubble alone must make 피오나's fear legible on screen (opening turn: she defends
   while unhurt, bubble + `because: [fiona.default]`).
3. **Tile rhythm** — 전진 → 이벤트 → 전진 carries a full run in 3–5 minutes; the first
   combat starts **within 60s of page load** at default tunables (hard rule, e2e-asserted).
4. **Context gauge drama** — at ≥70% the engine feeds that unit a *corrupted* situation
   (canned noise variant: a phantom enemy in her bubble) while execution stays on real
   state. Gauge is engine-managed numbers; noise is authored, deterministic, level-designable.
5. **Membrane + player verbs** — the player only clicks: 분기 선택 · 카드 드래프트 · 장착
   (강제 배분) · 휴식 선택 · 재시작. Zero typing, zero free text.

**Does NOT do** (concept features explicitly cut from this demo): live LLM / any runtime
network call · roster 선발 screen (party fixed at 3, §2.2) · 토큰/상점/보물상자/뇌물 (no
currency at all) · 탈옥/교섭 · 1대1 결투 · 인선 회의 · 보스전 vs 상대 에이전트 파티 ·
회의 라운드2 반론 (council is 1 stance round + vote) · 프롬프트 임프류 저주-카드 강제
장착 · 귀속 리포트 화면 (per-decision chips only) · save/audio/routing/meta-progression ·
balance tuning · runtime randomness of any kind · **binary assets** (CSS-only look; the
root `assets-manifest.json` gains no entries this run).

## 2. Architecture & baked defaults

### 2.1 Decision adapter — the stubbed LLM seam

- `src/ai/contract.ts`: shared decision schema `{action: string, target?: string,
  say: string, because: string[]}` + validator. `src/ai/adapter.ts`: `DecisionAdapter`
  interface (`decide(request)`, plus config for simulated latency). **Stub impl only** —
  a live impl is out of scope, but everything the renderer consumes must flow through the
  interface so live can be swapped in later without touching screens.
- **Stub keying with fallback chain:** the engine computes a deterministic **situation
  bucket** per call — enumerated set, frozen: `opening | ally_hurt | self_hurt |
  enemy_low | gauge_noise | default`. Lookup order in `data/decisions.json`:
  `(unitId, bucket, equippedCardId)` → `(unitId, bucket)` → `(unitId, "default")`. The
  card-specific tier is where the flagship flips live. **Every unit has a `default` entry
  for every action context** — no combination may dead-end.
- **All timing through the adapter.** Simulated latency is adapter config from
  `data/tuning.json` (default 900ms; 0 in unit tests; scripted values in e2e). If a
  decision exceeds `decisionTimeoutMs` (default 3000), the engine executes that unit's
  직업 기본 행동 (기사: 방어 · 사제: 대기 · 사기꾼: 회피) with a "…" bubble. The game
  never blocks on a decision. No `setTimeout` sprinkled in game logic.
- Enemies do **not** use the adapter: monsters run authored deterministic behavior tables
  in `data/encounters.json` (e.g. 스팸 골렘 always hits lowest-HP hero; 환각 정령 always
  gauge-attacks the highest-gauge hero).

### 2.2 Party, cards, sheets

- **Party fixed:** 가렛(방패기사) · 피오나(순례 사제) · 셀레네(은퇴한 사기꾼), stats and
  default prompts verbatim from the examples spec §2 (`data/heroes.json` carries all 4
  heroes incl. 모데카이 so the roster data is complete; the demo run hardcodes these 3).
- **Card pool — exactly 11:** Prompt 5 (「겁이 없다」 「원한」 「동료를 먼저」 「승부사」
  「연민」) · Skill 2 (「이단 베기」 「도발」) · MCP 4 (「화염 두루마리」(1회용 광역)
  「치유 물약」(1회용 회복) 「거울 방패」(지속) 「번역 렌즈」(퍼즐 힌트 1회)). Texts and
  effects from examples spec §3; numbers live in `data/cards.json`.
- **Slots per unit:** Prompt 3 · Skill 2 · MCP 3. **Forced-allocation rule (baked):** a
  granted/drafted card must be equipped to someone immediately; if the target's slots are
  full, the player picks an equipped card to discard, or forfeits the new card. Both
  choices are cards, not dialogs.
- Sheet assembly (system-prompt metaphor): base persona + equipped card sentences +
  stats. Rendered in a unit detail panel opened by clicking the unit; the items cited by
  that unit's most recent `because` are highlighted there.

### 2.3 Map, pacing, chatter

- **Fixed 8-tile map, 1 branch** (`data/map.json`):
  `T1 전투(스팸 골렘 ×1)` → `T2 훈련장` → **branch** → path A: `T3a 퍼즐(수수께끼 골렘)`
  → `T4a 훈련장` / path B: `T3b 선택이벤트(쓰러진 상인)` → `T4b 휴식` → rejoin →
  `T5 전투(스팸 골렘 + 환각 정령)` → `T6 휴식` → `T7 최종 전투(스팸 골렘 ×2 + 환각 정령)`.
- **Auto-advance:** the party walks (background scrolls on the single side-view stage);
  arrival at a tile fires its event. Player input only at the branch card pair. Walk
  duration is `data/` tunable (default 4s; 0 in tests). **Tile transitions are event-driven**
  (walk-complete event → event fires) — never wall-clock in logic or tests.
- **Chatter:** during walks, 2–3 canned bubble exchanges play from a pool in
  `data/decisions.json`, selected **deterministically by tile index** (no randomness).
  Runtime LLM chatter is out of scope.

### 2.4 Combat — turn-based, stationary, deterministic

- Side-scroll line view: heroes left, enemies right, nobody moves; bubbles above heads.
- Turn loop: engine builds each hero's request (real state, or corrupted copy at
  gauge ≥70) → parallel adapter calls → engine executes all intents in **민첩 descending
  order** with **fixed damage values** from `data/` (no dice, no RNG anywhere).
- Base actions always available: `strike | defend | guard_ally`; Skill/MCP cards register
  additional actions. Consumables decrement in the engine.
- **Context gauge** (per unit, 0–100, HUD as a tinted vial — numbers in `data/tuning.json`):
  피격 +10 · 환각 정령 attack +25 · 퍼즐 오답 +15 (all party). Tiers: <40 none ·
  40–70 presentation only (bubble stutter, delayed-reply acting) · ≥70 **noise injection**
  — the adapter request is swapped to the canned `gauge_noise` variant (e.g. 피오나 sees a
  phantom `spam_golem_2`; her bubble says so; execution still targets real entities —
  attacking a phantom renders as "허공을 벤다") · 100 judgment skipped, 직업 기본 행동
  forced, fixed bubble.
- Victory → reward card(s) + forced allocation (§2.2). Defeat (all heroes at 0 HP) →
  defeat screen → 재시작 (fresh run). Both screens reachable, e2e-asserted.
- **Rewards baked:** T1 → fixed grant 「도발」. T2 훈련장 → 3택1 from
  [「겁이 없다」 「이단 베기」 「치유 물약」]. T4a 훈련장 → 3택1 from
  [「원한」 「동료를 먼저」 「화염 두루마리」]. T3a 퍼즐 정답 → 「거울 방패」; 오답 →
  gauge +15 all, no card. T3b 구한다 → 「연민」; 지나친다 → nothing. T5 → 3택1 from
  [「승부사」 「치유 물약」 「번역 렌즈」]. T7 → run clear screen.

### 2.5 Council engine — 퍼즐 · 선택이벤트 (shared)

One engine, two skins. Flow (baked, simplified from concept): engine presents an authored
agenda + closed options (`data/council.json`) → **one stance round** (parallel adapter
calls; canned stances per unit per agenda, card-variant entries allowed — 셀레네+「승부사」
changes her vote on the merchant) → majority vote; tie → highest agenda-related stat casts
the deciding vote. **The player cannot intervene** — watching your party's values decide
is the tile's point. 퍼즐: 수수께끼 골렘, 3 options, authored answer; 「번역 렌즈」 (if
equipped on anyone) reveals a hint line before the vote. 선택이벤트: 쓰러진 상인,
구한다/지나친다.

### 2.6 훈련장 · 휴식 (no adapter calls)

- **훈련장:** 3 cards fan out → player picks 1 → picks a unit → forced allocation (§2.2).
- **휴식:** two option cards. ① 생각정리 — every unit's gauge −50. ② **Clear** — every
  unit's gauge → 0, but one equipped Prompt card (deterministic pick: the earliest-equipped
  one; no RNG) is forgotten — "기억까지 지워진다". Safe trim vs gamble, in two clicks.

### 2.7 Stub quality floor

The canned pool is the demo. `data/decisions.json` must cover every (unit × bucket) with
a default, plus the named card-variant entries (§1-1, §2.5), written to the tone bar of
the concept doc's §4.1 turn walkthrough (in-character Korean, one sentence, no
translationese). All game text is Korean. Chatter pool ≥ 12 exchanges.

## 3. Data shapes (files frozen; sub-structure to the implementer)

`data/heroes.json` (4 heroes: stats, default prompt text+id, base skill, 직업 기본 행동) ·
`data/cards.json` (11 cards: type, text, engine hook, slot kind) ·
`data/map.json` (8 tiles: id, kind, branch links, walk duration ref) ·
`data/encounters.json` (monster stats, deterministic behavior tables, per-tile rosters) ·
`data/decisions.json` (canned decisions keyed unit×bucket×card?, council stances, chatter
pool) · `data/council.json` (agendas, options, answers, rewards) · `data/tuning.json`
(gauge numbers, damage, latency sim, timeout, walk duration, slot counts). All tunables
live here — never inline.

## 4. Invariants (review-blocking)

1. **Membrane** — no text input UI anywhere; no `<input>`/`<textarea>`/`contenteditable`
   for game verbs (e2e-asserted).
2. **Attribution** — every displayed agent decision carries ≥1 `because` id; every chip
   resolves to a real sheet item; unresolvable ids fail validation.
3. **Intent-LLM / execution-engine split** — adapter output is only an enumerated action
   id (+target, say, because); all numbers and state changes are engine-side. Gauge noise
   corrupts **judgment input only**; execution always runs on real state.
4. **Stub schema = live schema** — everything the renderer consumes crosses the
   `DecisionAdapter` interface and passes the shared validator.
5. **All timing through the adapter / `data/` tunables** — no game-logic `setTimeout`,
   no `Math.random` at runtime (fully deterministic).
6. **The game never waits on a decision** — timeout → 직업 기본 행동 + "…" bubble.
7. Repo-wide: no engine/framework · balance-as-data · Vite `base: './'` subpath-safe
   dist · reads as a game, not a form (no native form controls for verbs; no instant DOM
   swaps between phases) · no runtime network calls · root untouched.

## 5. Verification seams

- **All gates run stub mode** with adapter latency 0 (unit) or scripted (e2e) —
  deterministic by construction (no RNG, event-driven transitions).
- vitest for pure logic: data loaders/validators, adapter keying + fallback chain +
  timeout, combat turn resolution, gauge/noise thresholds, council vote/tie-break, run FSM.
- Playwright per-screen specs are the unit gates: page loads with zero console errors,
  phase reachable by click, named animations/classes fire, `because` chips render and
  resolve, the 피오나 flip is observable, the pacing rule (§1-3) holds at default tunables.
- **Per-unit gate = that unit's own test slice only.** The full-run e2e gates only the
  final unit.

## 6. Work-unit DAG hint (decomposer refines)

| id | title | deps | complexity | own-slice gate |
|---|---|---|---|---|
| u1 | Data schemas + loaders + validators for all `data/*.json`, incl. authored content pass (§2.7) | — | standard | `vitest run tests/data/` |
| u2 | Shared UI primitives: side-view stage, unit panels + sheet detail, speech bubble + because chips, card component, gauge/HUD, animation vocabulary | — | standard | `playwright test e2e/primitives.spec.ts` |
| u3 | Decision adapter (stub): contract, keying/fallback chain, latency sim, timeout → default action | u1 | standard | `vitest run tests/adapter/` |
| u4 | Run FSM + map: auto-advance, walk scroll + chatter, branch choice, event firing, clear/defeat screens | u1,u2 | standard | `vitest run tests/run/` + `playwright test e2e/map.spec.ts` |
| u5 | Combat: turn loop, deterministic execution, gauge + noise injection, rewards handoff | u1,u2,u3 | high | `vitest run tests/combat/` + `playwright test e2e/combat.spec.ts` |
| u6 | Council engine + 퍼즐/선택이벤트 screens | u1,u2,u3 | standard | `playwright test e2e/council.spec.ts` |
| u7 | 훈련장 + forced allocation + 휴식 (생각정리/Clear) | u1,u2 | standard | `playwright test e2e/equip.spec.ts` |
| u8 | Full-run integration + juice pass + full e2e (incl. §1 must-proves) + DISCOVERY.md | u4,u5,u6,u7 | standard | full suite + `npm run build` |

## 7. Definition of done

`npm ci && npm run build` green · full vitest + Playwright suite green · dist smoke under
a Pages subpath (`base: './'`) · a full run is playable start → clear in 3–5 min and
start → first combat < 60s · both flagship attribution flips observable and asserted ·
no text-input elements in the DOM · `assets-manifest.json` untouched (no binary assets
this run) · `DISCOVERY.md` populated (spec gaps + harness frictions — first-class
deliverable feeding the super-pipeline game-mod).
