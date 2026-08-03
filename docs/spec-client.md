# Spec — Client (View Layer)

> **Tier:** `spec-` — normative authority for the client domain. Owner: 민서 ·
> **Language:** TypeScript (vanilla, **zero runtime dependencies**) · **Home:**
> `src/client/` — the only place DOM exists; nothing imports it
> ([physical §3.1–3.2](./spec-physical-architecture.md)).
> **Status: draft v3, not yet committed.**
>
> This document **references and consumes** the laws it sits under — it never
> redefines them. Conflict order:
> `spec-architecture.md → spec-engine.md / contract-calls.md /
> contract-datapack.md / contract-run-artifacts.md → physical spec → this
> document → [`prd-client-view-layer.md`](./prd-client-view-layer.md)`.
> Who-talks-to-what and the datapack consumption map live in
> [`architecture-map.md`](./architecture-map.md), not here.

---

## 1. Role & scope

The client renders the operator's desktop: it displays a run as it plays,
carries the player's entire input surface (the membrane), and doubles as the
**engine's verification test base** — every input it consumes can come from
fixtures, so the full UI runs offline before engine and proxy land.

1. **Shell.** Persistent chrome (portal identity · game clock → 21:04 with
   progress bar and rate control · D-DAY counter + run pips) · taskbar ·
   window manager (drag / resize / collapse / close-to-taskbar; default
   layout computed from the viewport).
2. **Five windows**, one per loop surface (§4): AGENT FILE (build) · BLOCK
   STORE (build) · LIVE FEED (watch) · REPORTS (autopsy) · TALLY (score).
3. **The membrane.** All player input reduces to exactly
   `slot · unslot · mine · deploy · new_run` (§5.2). Nothing else ever
   crosses; no free-text surface exists.
4. **Display of engine output, never computation of it.** Feed lines,
   symptom sentences, reports, and score arrive as data through the
   view-driver seam (§5.2); the client renders and animates but never
   derives game state.
5. **Fixture mode.** A fixture driver replays a scripted run (§5.4) with no
   proxy, no key, no engine — the seam the real engine later implements
   unchanged.

**Does NOT do:** compute state, judge gates, render symptoms from the delta
journal (engine-side, [engine §2.3](./spec-engine.md)) · compose or send LLM
calls (composer/proxy) · own run artifacts (run record ← engine, meta-state
← run-loop manager) · persist anything beyond its own window geometry until
the persistence contradiction resolves (§9) · accept typed text (membrane,
CLAUDE.md).

---

## 2. I/O contract

| Dir | What | Law |
|---|---|---|
| in | `data/scenario/<slug>/` as static JSON (fetch at boot; reaches the browser via the physical §3.7 copy plugin — **unbuilt**, see §9) | [contract-datapack](./contract-datapack.md); per-file consumers: [architecture-map §2.1](./architecture-map.md) |
| in | `ViewEvent` stream ← view driver (fixture or live engine) | §5.2 — **proposed seam, ratification with 윤석 pending** |
| in | run/meta view: run counter · carried blocks · report archive ← run-loop manager (fixture-simulated until it exists) | [contract-run-artifacts](./contract-run-artifacts.md); storage open (§9) |
| out | `MembraneOp` stream → driver (deploy carries the slotted set = the next Call 1 `BLOCKS`) | §5.2 · [contract-calls §6](./contract-calls.md) supplier map |
| out | nothing else — no network beyond the pack fetch (and, live mode, calls made by the composer, not by the client) · no disk writes | [physical §2](./spec-physical-architecture.md) |

### 2.1 Code layout (`src/client/` — boundaries fixed, sub-split free)

Import direction ([physical §3.2](./spec-physical-architecture.md)):
`client → composer → engine → shared`; **nothing imports client**. Inside
`src/client/`:

| Module | Holds | May import |
|---|---|---|
| `driver/` | `ViewEvent`/`MembraneOp` types · fixture driver + fixture run files · (later) live driver binding engine+composer | `shared`; live driver only: `engine`, `composer` |
| `shell/` | topbar (clock · D-DAY · case) · taskbar · window manager · layout | `driver` types |
| `windows/` | the five windows, one module each | `components`, `driver` types |
| `components/` | the §6 inventory | — |
| `styles/` | `tokens.css` (**all** design tokens: paper stocks, the two accents, type scale — style-as-data) · per-window skins | — |
| `debug/` | debug pane — build-flag only, **excluded from the player build** | `driver` |
| root | `index.html` · `main.ts` (boot, §5.1) | everything above |

Build gate: `npm run build` (tsc + vite) green; the automated test gate is
bound in the PRD, not here.

---

## 3. Invariants (review-blocking)

1. **Membrane** — no `<input>`, no `contenteditable`, no free-text surface,
   anywhere in the player build. Player input is the five `MembraneOp`s and
   window management only.
2. **I12** — no digit ever renders for NPC state. Symptom sentences arrive as
   data and are displayed verbatim; the tally's numbers are score, not state.
3. **I1** — mining hands over the **authored sentence id**, never screen
   text. Card ↔ sentence matching (store, slots, archive highlight, red
   thread) is by id.
4. **I13** — temperament never reaches the view. The dossier's §3 기질 block
   renders as sealed redaction *by construction* (no temperament data is in
   any client input).
5. **Latency rules 1–6** ([architecture §4](./spec-architecture.md)) bind
   every waiting surface: deterministic lines render instantly · waiting is
   diegetic, never a spinner · the tally count-up absorbs the whole report
   call · the typewriter is client-driven replay of a completed response ·
   mid-action play never blocks.
6. **Archive segmentation** — the report archive is segmented by run/time
   (`RUN 01 / 08:50 — 21:04`); **no gate label** appears on any player
   surface (08-03 decision, architecture §2.1).
7. **Fixture-first** — every feature must be exercisable in fixture mode. A
   feature only demonstrable against the live proxy is review-rejected.
8. **Style-as-data** — colors, paper stocks, type faces/sizes, spacing live
   in `styles/tokens.css` as custom properties; no literal color/size in
   component code. (The balance-as-data instinct applied to skin.)
9. **Zero runtime dependencies** — `package.json` gains no runtime deps;
   dev/build tooling is free.
10. **Assets manifested** — every external asset (today: three webfont
    families) has an `assets-manifest.json` entry (CLAUDE.md rule 5); fonts
    are **self-hosted** under `public/assets/` — the player build makes no
    third-party network request (§9 asset note).
11. **Debug pane excluded from the player build** — the flag-off build
    contains none of its code (I12 binds the player surface; the pane is
    developer tooling).
12. **Driver seam integrity** — windows and components consume `ViewEvent`s
    only; no module outside `driver/` may import engine or composer. This is
    what keeps fixture and live modes pixel-identical.

---

## 4. Screens — the window set

An **operator's desktop**: persistent chrome plus five windows. One page, no
routing. Desktop only; minimum viewport bound in the PRD.

| Region | Loop role | Holds |
|---|---|---|
| **Chrome** (persistent top bar) | orientation | portal identity (portal name · operator · case) · game clock → 21:04 with progress bar and rate control (×1/×4/pause) · D-DAY counter + run pips · taskbar |
| **AGENT FILE** | Build | the dossier: §0–§2 fixed sections · §3 기질 sealed (invariant 4) · §4 known-blocks slots (cap: dev value 4 — §9) · deploy control |
| **BLOCK STORE** | Build | mined sentences as cards (authored id + species/axis tags) · species filter |
| **LIVE FEED** | Watch | the run feed in seven line kinds (§6 `RunFeed`) · diegetic waiting marker; untouchable during a run |
| **REPORTS** | Autopsy | two documents side by side: facts (objective log) · report_body (typewriter replay) · sentence mining (click → store) · **archive rail** — every past report readable, previously-slotted sentences highlighted (invariant 6) |
| **TALLY** | Score | score count-up at run end (absorbs the report call; paced ~9 s) · run summary · new-run control |

---

## 5. Runtime & seams

### 5.1 Boot order

```
fetch data/scenario/<slug>/*.json → parse against src/shared/datapack.ts types
  → build shell (topbar · taskbar) + five windows → applyLayout(viewport)
  → connect driver: fixture (default until proxy lands) | live
  → BUILD state (file unlocked) — the idle loop starts here
```

Run states: `BUILD → (deploy) → RUN → (per round) REPORT → … → (21:04)
TALLY → (new_run) BUILD`, D-DAY decrementing until the last run.

### 5.2 The view-driver seam (**proposed** — graduates to `src/shared/`
types on ratification with 윤석; until then fixture-shaped, not law)

Everything the client consumes during a run is one ordered event stream;
everything it emits is one op stream. Shapes (TypeScript, illustrative
field-level detail — names final, optionality to ratify):

```ts
type Species = 'fact' | 'selfnarr' | 'emotion' | 'quote';
interface Sentence { id: string; text: string; species: Species; axis?: string }

type FeedKind = 'event' | 'radio' | 'npc' | 'symptom' | 'wait' | 'fallback' | 'mark';
interface FeedLine { kind: FeedKind; clock: string /* "HH:MM" */; text: string;
                     speaker?: string; sentence_id?: string /* set ⇢ minable */ }

type ViewEvent =
  | { type: 'feed';    line: FeedLine }
  | { type: 'waiting'; active: boolean }                    // diegetic marker on/off
  | { type: 'report';  round: number; facts: Sentence[]; report_body: Sentence[] }
  | { type: 'score';   total: number; rows: { label: string; value: number }[] }
  | { type: 'run_end'; run: number };

type MembraneOp =
  | { op: 'slot';    block_id: string; slot: number }
  | { op: 'unslot';  slot: number }
  | { op: 'mine';    sentence_id: string }
  | { op: 'deploy';  blocks: string[] }                     // = next Call 1 BLOCKS
  | { op: 'new_run' };
```

What never appears in `ViewEvent`: `inner_note` · `because_*` /
`rejected_*` · temperament · truths beyond exposure
([contract-calls §6](./contract-calls.md) consumer map · I8 · I13). The
driver, not the windows, is where that guarantee is enforced (invariant 12).

### 5.3 State ownership

| State | Owner | Client's part |
|---|---|---|
| game state (meters, gates, journal) | engine | none — not even mirrored |
| run counter · carried blocks · report archive | run-loop manager (meta-state) | display + membrane ops against it |
| window geometry · focus · collapsed set · archive-rail selection · animation state | **client** | in-memory; survives-refresh question follows the §9 persistence resolution |
| mining/slotted marks on sentences | derived from meta-state by id | render only |

### 5.4 Fixture mode

A fixture run file is an ordered `ViewEvent[]` with clock stamps plus canned
responses for each `MembraneOp` the script expects (deploy → the scripted
run; mine → acknowledged into the store). Fixture files live under
`driver/fixtures/` and ship only in dev builds. The demo fixture is the
design target's RUN 03 material regenerated against `우는다리` — authored
sentences with real ids, never lorem.

The same seam, live: the driver binds engine + composer and forwards ops;
windows cannot tell the difference (invariant 12).

---

## 6. Component inventory

| Component | States to design | Form (design target) |
|---|---|---|
| `RunCounter` | n runs left · last run | topbar D-DAY value + run pips |
| `GameClock` | ticking · paused · terminal (21:04) | topbar digits + progress fill bar + rate control (×1/×4/pause) |
| `BlockCard` | in-store · slotted · at-cap (disabled) · archived-highlight | index-card stock, punch hole, species mark |
| `BlockStore` | empty ("nothing mined yet") · populated · filtered | card-tray window + species filter |
| `SlotBoard` | empty · partial · full · locked (deployed) | dossier §4 slots; each filled slot pinned by red thread to its source sentence |
| `DeployButton` | ready · deployed (locked) | 배치 stamp; locked = stamped over the file |
| `RunFeed` | line kinds: `event · radio · npc · symptom · wait · fallback · mark` | green-bar fanfold printout, lines landing on the game clock |
| `WaitingMarker` | active (diegetic phrasing) | `……무전 회신 대기 중` with breathing dots — never a spinner |
| `ReportView` | facts (objective log) · report_body · loading-behind-tally | white bond paper, red margin rule on the report side |
| `MinableSentence` | unmined · mined · previously-slotted (archive highlight) | tear: red flash, strike-through, `채굴` marginal note; card animates to store |
| `ReportArchive` | per-run sections (run/time segmented — no gate labels) | archive rail (`RUN 01 / 08:50 — 21:04`); mined and slotted marks persist |
| `ScoreTally` | pending (absorbing report latency) · final | ruled-ledger count-up paced ~9 s |
| `FallbackNotice` | per engine §5 fallback classes | `※` feed line |
| `WindowFrame` | focused · collapsed · closed-to-taskbar · dragging · resizing | title bar, tab, corner grip; taskbar toggles and raises |
| `RedThread` | idle · re-drawing on window drag | literal thread + pins, slot ↔ source sentence, matched by authored id |
| desktop dressing | — (no data states) | blueprint wallpaper, grain/vignette, one-shot boot scanline |
| `DebugPane` | flag-off (absent) · flag-on | raw tables; dev build only (invariant 11) |

Empty, loading (= diegetic waiting), and error (= fallback) states are part
of each component's definition, not afterthoughts.

---

## 7. Acceptance

Against `data/scenario/우는다리/`, in fixture mode, in a browser.

**Engine-verification (the test-base half):**

1. Pack loads; chrome shows title, counter, clock.
2. A full round plays: script beats and the gate beat render in stream
   order; symptom lines number ≤3 per beat; no digit appears anywhere on
   the player surface (invariant 2); empty symptom set renders `(변화 없음)`.
3. The gate's judgment applies: the fixture stance's delta→bucket→edge
   result is observable (debug pane) and its symptoms visible (player pane).
4. The round report renders after the round's last beat, exactly once.
5. A sentence mined from the report appears in the store, slots into the
   next run's composition, and the deploy op carries its canonical id
   (debug pane).
6. Terminal clock reached → score renders.
7. A forced `fallback` feed line renders per engine §5, and the run
   continues.
8. Refresh behavior matches whatever resolves the persistence contradiction
   (§9); until then, fixture runs may keep state in memory only.

**Shell (the desktop half):**

9. All five windows drag, resize, collapse, and close to the taskbar; the
   default layout fits the minimum viewport with nothing off-screen.
10. Red threads connect every filled slot to its source sentence by authored
    id, and re-draw during window drag.
11. The three webfonts are self-hosted under `public/assets/` (no runtime
    third-party request), their `assets-manifest.json` entries re-pointed;
    page load stays within the ~1 s budget.
12. No free-text surface exists anywhere in the player build (invariant 1),
    and the flag-off build contains no debug-pane code (invariant 11).

---

## 8. The design target (binding)

The build target is
[`docs/design/phase2-ui/`](./design/phase2-ui/README.md)
(`index.html · desktop.css · app.js · data.js` — open directly in a browser;
demo data is authored `우는다리` material, opening mid-run at RUN 03). Its
**structure and skin are normative; pixel-exactness is not.**

What it fixes: the operator's-desktop metaphor (dark machine-room desktop,
paper-stock windows — kraft dossier · green-bar fanfold · white bond · ruled
ledger · index cards) · the type system (IBM Plex Mono for machine chrome,
Nanum Myeongjo for Korean document bodies, Nanum Gothic Coding for radio
lines) · two accents only (graphite ink · 관인-red) · the red-thread evidence
board · the ~9 s tally count-up · the boot scanline.

Porting rule: **CSS may be vendored and adapted** (`desktop.css` →
`styles/`, re-tokenized per invariant 8); **JS logic is rewritten in TS**
against §5's seams (the reference's clock loop and `data.js` are the
fixture driver's job, not the view's); markup structure is ported. Its
README's implementation notes (viewport layout algorithm, single stacking
context, feed-kind mapping) are part of the target.

---

## 9. Decisions bound here · open items owned elsewhere

**Bound by this document:** framework = vanilla TS, zero runtime deps
(08-03) · slot-cap dev value 4 (until the §9 parameter binds) · webfont
self-hosting is an acceptance item (§7 #11), with the subsetting approach
left to the PRD (recommendation: mirror Google's per-`unicode-range` Korean
slices so LLM-generated text never hits a missing glyph).

**Owned elsewhere — pointed at, not restated:**

- Persistence contradiction (localStorage vs refresh-resets) — 윤석's
  [physical §1](./spec-physical-architecture.md) vs
  [game design §6](./plan-game-design.md); §7 #8 absorbs either resolution.
- §9 U-owned parameters (latency budget · report cadence · slot count ·
  block-pool curation · gate-eligibility floor) —
  [architecture §9](./spec-architecture.md); they bind by revision of this
  document when their moments arrive.
- Pack-to-browser copy plugin —
  [physical §3.7](./spec-physical-architecture.md) (윤석).
- `src/` scaffolding — [physical §3.8](./spec-physical-architecture.md).
- Temperament transport seam · report-guidance absorption —
  [contract-calls](./contract-calls.md).
- **View-driver seam ratification** (§5.2) — proposed here; becomes
  `src/shared/` types (or a `contract-`) after 윤석 reviews, since the live
  driver is where his engine meets this spec.
