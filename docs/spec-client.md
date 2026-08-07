# Spec — Client (View Layer)

> **Tier:** `spec-` — normative authority for the client domain. Owner: 민서 ·
> **Language:** TypeScript (vanilla, **zero runtime dependencies**) · **Home:**
> `src/client/` — the only place DOM exists; nothing imports it
> ([physical §3.1–3.2](./spec-physical-architecture.md)).
> **Status: draft v3.2** — v3.1 + the post-merge revision (08-05, PRs #110 +
> #116 on main): the §5.2 seam is implemented on both sides (fixture driver
> and e7's live driver in `src/driver/`), the run-loop manager exists (e8,
> `src/runloop/`), the `meta` shape settled **unchanged**, the sentence-id
> channel set gained `u`, and the §3.7 pack-copy plugin is built.
> v3.1 was v3 + 윤석's PR #108 ratification: the §5.2 seam ratified with six
> amendments, persistence resolved (`sessionStorage`), scaffolding and
> pack-copy answered (§9).
>
> This document **references and consumes** the laws it sits under — it never
> redefines them. Conflict order:
> `spec-architecture.md → spec-engine.md / contract-calls.md /
> contract-datapack.md / contract-run-artifacts.md → physical spec → this
> document → [`plan-client-build.md`](./plan-client-build.md)`.
> Who-talks-to-what and the datapack consumption map live in
> [`architecture-map.md`](./architecture-map.md), not here.

---

## 1. Role & scope

The client renders the operator's desktop: it displays a run as it plays,
carries the player's entire input surface (the membrane), and doubles as the
**engine's verification test base** — every input it consumes can come from
fixtures, so the full UI runs offline (which is how it was built before
engine and proxy landed, and how it is still tested).

1. **Shell.** Persistent chrome (portal identity · game clock → 21:04 with
   progress bar and rate control · D-DAY counter + run pips) · taskbar ·
   window manager (drag / resize / collapse / close-to-taskbar; default
   layout computed from the viewport).
2. **Four windows**, one per loop surface (§4): AGENT FILE (build) · BLOCK
   STORE (build) · LIVE FEED (watch) · REPORTS (autopsy; scoring folds in here).
3. **The membrane.** All player input reduces to exactly
   `slot · unslot · mine · deploy · new_run` (§5.2). Nothing else ever
   crosses; no free-text surface exists.
4. **Display of engine output, never computation of it.** Feed lines,
   symptom sentences, reports, and score arrive as data through the
   view-driver seam (§5.2); the client renders and animates but never
   derives game state.
5. **Fixture mode.** A fixture driver replays a scripted run (§5.4) with no
   proxy, no key, no engine — the same seam the live driver implements
   unchanged (§5.4).

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
| in | `data/scenario/<slug>/` as static JSON (fetch at boot; reaches the browser via the physical §3.7 copy plugin — built, verified by the preview smoke: the pack loads from `dist/data/`) | [contract-datapack](./contract-datapack.md); per-file consumers: [architecture-map §2.1](./architecture-map.md) |
| in | `ViewEvent` stream ← view driver (fixture, or e7's live driver in `src/driver/` — headless-proven; the browser binding is the wiring step) | §5.2 — **ratified 08-03 (PR #108)**, types at `src/shared/view-driver.ts` |
| in | run/meta view (`meta` events **on the same stream**, amendment d): run counter · carried blocks · report archive ← run-loop manager (e8, `src/runloop/`) via the driver | §5.2 · [contract-run-artifacts](./contract-run-artifacts.md); stored in `sessionStorage` (§9) |
| out | `MembraneOp` stream → driver (deploy carries the slotted set = the next Call 1 `BLOCKS`) | §5.2 · [contract-calls §6](./contract-calls.md) supplier map |
| out | nothing else — no network beyond the pack fetch (and, live mode, calls made by the composer, not by the client) · no disk writes | [physical §2](./spec-physical-architecture.md) |

### 2.1 Code layout (`src/client/` — boundaries fixed, sub-split free)

Import direction ([physical §3.1, revised 08-03](./spec-physical-architecture.md)):
`client → driver → composer → engine → shared`; **nothing imports client**.
The live driver is **not** a `src/client/` module — it landed as its own tier,
`src/driver/` (e7), DOM-free and headless-proven. Inside `src/client/`:

| Module | Holds | May import |
|---|---|---|
| `driver/` | fixture driver + fixture run files · the run-loop binding · (wiring step) `live-run.ts`, the boot-time binding that instantiates `src/driver/`'s live driver in the player build. Seam types are **not** here — they live in `src/shared/view-driver.ts` (ratified, §5.2) | `shared`; and — as the only `src/client/` module allowed past the seam (invariant 12) — the below-seam tiers the live binding composes: `src/driver/` · `src/runloop/` · `src/transport/` |
| `shell/` | topbar (clock · D-DAY · case) · taskbar · window manager · layout | `driver` types |
| `windows/` | the four windows, one module each | `components`, `driver` types |
| `components/` | the §6 inventory | — |
| `styles/` | `tokens.css` (**all** design tokens: paper stocks, the two accents, type scale — style-as-data) · per-window skins | — |
| `debug/` | debug pane — build-flag only, **excluded from the player build** | `driver` |
| root | `index.html` · `main.ts` (boot, §5.1) | everything above |

Build gate: CI (`.github/workflows/ci.yml`) runs the full stack on every
PR — `npm run check` · the entire vitest suite (no exclusions) · `npm run
build` · the probe self-test · the preview smoke on a real production
build. The full Playwright suite (dev-host acceptance, captures) stays a
manual pre-merge gate.

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
    only; above the seam, no module outside `src/client/driver/` may import
    engine, composer, or any below-seam tier — and in the player build
    graph, only driver modules ever reach engine or composer. (Below the
    seam, edges among `engine · composer · transport · driver · runloop`
    are the architecture itself, not a breach — the 08-05 re-aim in
    `tests/invariants/seam-integrity.test.ts`.) This is what keeps fixture
    and live modes pixel-identical.

---

## 4. Screens — the window set

An **operator's desktop**: persistent chrome plus four windows. One page, no
routing. Desktop only; minimum viewport bound in the PRD.

| Region | Loop role | Holds |
|---|---|---|
| **Chrome** (persistent top bar) | orientation | portal identity (portal name · operator · case) · game clock → 21:04 with progress bar and rate control (×1/×4/pause) · D-DAY counter + run pips · taskbar |
| **AGENT FILE** | Build | the dossier: §0–§2 fixed sections · §3 기질 sealed (invariant 4) · §4 known-blocks slots (cap: dev value 4 — §9) · deploy control (also carries the day's turn once the run closes — merged NEW RUN) |
| **BLOCK STORE** | Build | mined sentences as cards (authored id + species/axis tags) · species filter |
| **LIVE FEED** | Watch | the run feed in seven line kinds (§6 `RunFeed`) · diegetic waiting marker; untouchable during a run |
| **REPORTS** | Autopsy | two documents side by side: facts (objective log) · report_body (typewriter replay) · sentence mining (click → store) · **archive rail** — every past report readable, previously-slotted sentences highlighted (invariant 6) · at run end, a terminal record inside the facts document: score count-up (absorbs the report call; paced ~9 s) · run summary |

---

## 5. Runtime & seams

### 5.1 Boot order

```
fetch data/scenario/<slug>/*.json → parse against src/shared/datapack.ts types
  → build shell (topbar · taskbar) + four windows → applyLayout(viewport)
  → connect driver: fixture (default until proxy lands) | live
  → BUILD state (file unlocked) — the idle loop starts here
```

Run states: `BUILD → (deploy) → RUN → (per round) REPORT → … → (21:04)
TALLY → (new_run) BUILD`, D-DAY decrementing until the last run. `TALLY` names
the phase, not a window: the day is closed, awaiting the turn, and its two
surfaces are the terminal record (REPORTS) and the merged deploy/NEW RUN
control (AGENT FILE).

### 5.2 The view-driver seam (**ratified 08-03 with amendments** — 윤석,
PR #108 review; types land in `src/shared/view-driver.ts`)

Everything the client consumes during a run is **one** ordered event stream;
everything it emits is one op stream. The run-loop manager's channel is
folded into the same stream (`meta` — amendment d), so there is exactly one
in-channel and one out-channel.

```ts
type Species = 'fact' | 'selfnarr' | 'emotion' | 'quote';
interface Sentence { id: string; text: string; species: Species; axis?: string }

type FeedKind = 'event' | 'radio' | 'npc' | 'symptom' | 'wait' | 'fallback' | 'mark';
interface FeedLine { kind: FeedKind; clock: string /* "HH:MM" */; text: string;
                     speaker?: string; sentence_id?: string /* set ⇢ minable */ }

type ViewEvent =
  | { type: 'beat_start' | 'beat_end'; beat: number; clock: string }
  | { type: 'feed';     line: FeedLine }
  | { type: 'waiting';  active: boolean; for: 'judgment' | 'narration' | 'report' }
  | { type: 'fallback'; call: 1 | 2 | 3; code: string; beat: number }
  | { type: 'report';   round: number; facts: Sentence[]; report_body: Sentence[];
                        judged?: { stance_id: string; desc: string; cited_ids: string[] } }
  | { type: 'score';    total: number; baseline_total: number;
                        rows: { label: string; value: string | number;
                                baseline: string | number | null }[] }
                        // AMENDED 08-05 (amendment g): a scored unit's value
                        // may be a WORD — `score.json` tallies outcomes as
                        // often as counts, and contract-run-artifacts' record
                        // has always typed the same field `string | number`.
                        // `total` does NOT widen: it is the 사망 count the
                        // tally headline counts up, and a run with no scorer
                        // emits no `score` event rather than an empty one
                        // AMENDED 08-05 (amendment h): every row carries what
                        // the UNTOUCHED day scored on the same axis, and the
                        // headline carries its total. The tally's own subtitle
                        // is 기준선 대비 — 무개입 하루가 기준이다, and it could
                        // not keep that promise: the baseline lives in the pack
                        // and inv 12 lets no view surface read one, so the
                        // tally hardcoded `baseline: null` and every delta
                        // printed `=`. `null` on a row means that axis did
                        // not resolve on the untouched day
  | { type: 'run_end';  run: number }
  | { type: 'meta';     run: number; runs_left: number; carried: string[];
                        archive: { run: number; label: string }[] };
                        // SETTLED 08-05: e8's run-loop manager emits exactly
                        // this shape (src/runloop/run-loop.ts, metaEvent());
                        // its MetaState is internal persistence, translated
                        // at the boundary — the seam shape never moved

type MembraneOp =
  | { op: 'slot';    block_id: string; slot: number }
  | { op: 'unslot';  slot: number }
  | { op: 'mine';    sentence_id: string }
  | { op: 'deploy';  blocks: string[] }  // a SET — order carries no meaning
                                         // (architecture §2.1: content, not
                                         // order; the composer sorts
                                         // canonically before composing)
  | { op: 'new_run' };
```

Amendment notes (all 윤석, PR #108):

- **Beat boundaries** give the pause structure its attachment point — this
  is what lets [contract-run-artifacts §3](./contract-run-artifacts.md)'s
  deferred beat-granularity slot finally bind.
- **`waiting.for`** picks the diegetic phrasing; the three waits are
  different animals under latency rules 2 and 4–5.
- **`fallback` is an event, not just a feed kind**: engine §5 grades
  failures (fatal / local / supply-cut) and the run record keeps
  `{beat, call, code}` — `FallbackNotice` renders per class. The `fallback`
  `FeedKind` remains as its on-feed rendering.
- **Sentence identity is engine-minted**: `b-r<run>-<channel><nn>` with
  channels `f` (facts) · `b` (report body) · `n` (Call 2 narration) · `q`
  (NPC line) · `u` (Call 1 utterance — the controller's own line, added at
  the engine build); authored script lines keep `timeline.json`'s `t*` ids
  and are run-independent (same sentence = same block across runs, which is
  what makes archive highlighting behave). The report-body segmenter lives
  in `src/shared/`, is called by engine, fixture generator, and probe alike
  (invariant 12 made structural), and carries a golden test. **Species
  derives from the channel, never from classification** — the channel→species
  map the ratification named but never wrote down is now written down:
  `src/shared/species.ts` (`f`→fact and `b`→selfnarr certified; `n`→emotion,
  `q`→quote, `u`→quote uncertified — the certified/uncertified split is
  load-bearing, contract-datapack E2).

What never appears in `ViewEvent`: `inner_note` · `because_*` /
`rejected_*` · temperament · truths beyond exposure
([contract-calls §6](./contract-calls.md) consumer map · I8 · I13). The
driver, not the windows, is where that guarantee is enforced (invariant 12).

### 5.3 State ownership

| State | Owner | Client's part |
|---|---|---|
| game state (meters, gates, journal) | engine | none — not even mirrored |
| run counter · carried blocks · report archive | run-loop manager (meta-state, `sessionStorage` — §9) | display + membrane ops against it; arrives as `meta` events |
| window geometry · focus · collapsed set · archive-rail selection · animation state | **client** | in-memory only — cosmetic state legitimately resets on refresh |
| mining/slotted marks on sentences | derived from meta-state by id | render only |

### 5.4 Fixture mode

A fixture run file is an ordered `ViewEvent[]` with clock stamps plus canned
responses for each `MembraneOp` the script expects (deploy → the scripted
run; mine → acknowledged into the store). Fixture files live under
`driver/fixtures/` and ship only in dev builds. The demo fixture is the
design target's RUN 03 material regenerated against `우는다리` — authored
sentences with real ids, never lorem.

The same seam, live: e7's live driver (`src/driver/`) binds engine +
composer + transport and forwards ops — proven headless (a complete
우는다리 run replays byte-identical through `tools/driver/drive-run.mjs`);
windows cannot tell the difference (invariant 12). What remains is the
browser binding: nothing in the player bundle instantiates it yet (engine
run known-open #4 — the wiring step).

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
| `ReportView` | facts (objective log) · report_body · loading-behind the terminal record | white bond paper, red margin rule on the report side |
| `MinableSentence` | unmined · mined · previously-slotted (archive highlight) | tear: red flash, strike-through, `채굴` marginal note; card animates to store |
| `ReportArchive` | per-run sections (run/time segmented — no gate labels) | archive rail (`RUN 01 / 08:50 — 21:04`); mined and slotted marks persist |
| `ScoreTally` | pending (absorbing report latency) · final | ruled-ledger count-up paced ~9 s; hosted in REPORTS' `.terminal-record` |
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
8. Refresh mid-run: the multi-run meta-state (counter, archive, carried
   blocks) survives via `sessionStorage`; closing the tab starts clean
   (윤석's resolution, §9). Window geometry and other cosmetic state may
   reset.

**Shell (the desktop half):**

9. All four windows drag, resize, collapse, and close to the taskbar; the
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

**Resolved by 윤석's PR #108 ratification (08-03):**

- **View-driver seam** — ratified with six amendments, recorded in §5.2;
  types land in `src/shared/view-driver.ts`. The sentence-id scheme
  (engine-minted, channel-derived species, shared segmenter with golden
  test) is part of the ratification.
- **Persistence** — `sessionStorage` for meta-state: survives refresh (the
  multi-run loop isn't destroyed by F5), dies with the tab (every judge
  starts clean — `localStorage` would break the run-3 demo staging). 윤석
  revises physical §1 and game-design §6; §7 #8 binds it here.
- **`src/` scaffolding** — already done (physical §3.8 step 1: the four
  `src/` dirs and the `tsconfig`/`tsconfig.core` split exist). **Condition
  on the build: never touch `tsconfig.core.json`'s `include` or add path
  aliases** — that file is the mechanical isomorphism guard.
- **Pack-to-browser copy plugin** — landed (physical §3.7; it copies
  `scenario/` + `policy/` by name, never `data/` wholesale). The preview
  smoke gates it in CI: the pack loads from `dist/data/` on a real build.

**Owned elsewhere — pointed at, not restated:**

- §9 U-owned parameters (latency budget · report cadence · slot count ·
  block-pool curation · gate-eligibility floor) —
  [architecture §9](./spec-architecture.md); they bind by revision of this
  document when their moments arrive.
- Temperament transport seam · report-guidance absorption —
  [contract-calls](./contract-calls.md).
