# Project Status

> Single source of truth for mutable project state. Updated freely, any session, any time.
> Rules live in /CLAUDE.md and do not repeat here. Newest information first.

## Status (2026-08-09) — the door is typed in, and the membrane is the mechanic

**The opening screen had one thing on it and that thing was already done.** Both
fields arrived pre-filled, `저장됨` sat to the right of the mask saying the
password was remembered, and LOGIN was live on the first frame with its highlight
sweeping across it every 3.6 s. A judge's first interaction with the game was a
formality — press the one hot button on a finished form. (민서, 08-09.)

**Now the operator types the card in.** The wells start empty; every press lands
one character, `OP-2291` and then eight mask glyphs; LOGIN is `disabled` until the
fifteenth. `저장됨` is gone with the claim it made — a field being entered by hand
cannot also be a field that was saved.

**WHAT was pressed never reaches WHAT appears, and that is the point rather than a
concession.** `doorFill(strokes: number)` is the whole state machine and its
signature is the guard: there is no parameter through which a pressed character
could travel, so mashing the keyboard still types the terminal's own badge number.
The membrane (spec-client §3 inv 1) is not merely *survived* at the door, it is
what the door is *about* — the player's hands are on this desk and their words are
not in it — which is why this screen can ask for fifteen keystrokes without
becoming a text field. The readout two beats later shows the pair resolving:
`사용자 조회 — OP-2291 tester_123 … 확인`.

**Three things the brief did not ask for and the screen could not ship without:**

- **A tap counts as a press.** There is no focused field here to summon a soft
  keyboard, so on a touch screen `keydown` never fires — a key-only door is a dead
  end for every phone that opens the deployed site. `pointerdown` on the layer is
  the same gesture by another instrument, and on a desktop it pays again: the
  player who reaches for the dead button is taught the mechanic by the character
  that appears when they press it.
- **An IME counts too.** Chrome hands `key: 'Process'` for a 두벌식 keystroke on
  some platforms — one press, no character. A plain "single-character key" rule
  gives a Korean operator a door that ignores them, on a Korean-language game.
- **The locked slab had to LOOK locked.** `pointer-events:none` was the whole of
  the old disabled state. `filter:grayscale(.95) brightness(.58)` drains the same
  button rather than painting a second one, so the armed state needs no
  declarations at all — dropping the attribute restores every value already there.

**The one orchestrated beat.** `siArm` fires on the fifteenth press: grey slab →
over-bright → the seal's resting red, 550 ms, with focus landing on it. Focus is
also the only announcement this door makes and the only one it owes. The animation
carries **no fill mode** deliberately — filled, it would pin `filter:none` and
`transform:none` for the rest of the door's life and `:hover`/`:active`, which are
nothing but a filter and a transform, would never be seen again.

**Light blue is where the terminal is listening.** `.si-field.is-armed` is one
class on one row and it moves the label, the well's ring and the caret together.
The lit colour is `--gauge-2` — the caret's own, and the gauges' — not the seal's
red: red on this desk means 관인, and a field waiting for a keystroke is an
instrument that is on, not an alarm. Same argument `coach.css` records for why the
onboarding mark stopped pulsing.

**A reduced-motion claim was written, tested, found false, and replaced with the
truth.** The caret is load-bearing for the first time, `base.css` collapses every
animation to a 1 ms pass, and `siBlink` ends on `opacity:0` — so the sheet gained
a `@media (prefers-reduced-motion)` restatement. The e2e test for it passed with
the block **deleted**: `siBlink` is *unfilled*, so opacity falls back to the `.85`
on `.si-caret` itself and the caret settles STILL rather than dark. That is the
opposite of `litPulse`, which was `animation … both`. The block is gone; a comment
records why there is none, and two guards now pin the absence it rests on (the
blink is unfilled; shown/hidden is `display`, never the opacity the blink uses).

**Verified:** `npm run check` clean · **1692** unit tests (109 files) · the
chromium e2e lane green · **18** new unit tests (`tests/shell/sign-in.test.ts`,
node-env: the arithmetic, the key rule, the two removals) · **16** new browser
tests (`e2e/signin.spec.ts`, the only spec that sees the door — `signInSkipped`
keys off `navigator.webdriver`, so `?signin=show` is the override). Screenshot-
verified against the **production** build on `vite preview`, at all five states.

**Two guards were verified red-then-green by breaking the thing they measure** —
the greyed slab, and the tap path. A third caught a real defect while being
written: `doorFill(NaN)` returned `armed: null` with two empty lines, because
`Math.min`/`Math.max` propagate NaN instead of clamping it — a door with no caret,
no character and no way forward. Unreachable from inside the module, reachable
through an exported contract that says `number`; `Number.isFinite` is the floor.

## Status (2026-08-08) — the loop the player operates, and two regressions only the live path could show

**The day now runs hands-off, and the operator's turn is at the close.** Four
units rebuilt the sitting (`plan-playtest.md` §1 U6): the resume carries a build
stamp so a stale tab is not a live sitting (`W1`); one sitting is one
accumulating record, keyed by RUN with rounds appended, which killed the
run/round keyspace collision in `railEntries` (`W2`); mining is one gesture —
a click mines *and* seats, and a refusal flashes instead of vanishing (`W3`);
and DEPLOY is one phase-gated press that commits the file and opens the next
day, which retired the ×1/×4/pause transport row with it (`W4`). A sitting's
rounds now break a line between them (`R1`). `main` is at #194.

**Two regressions shipped green through a 215-test browser suite, and the
reason is structural.** `e2e/` drives the DEV fixture loop, whose store is one
flat object surviving `new_run`; the live path rebuilds per day. Anything that
crosses a run boundary is therefore untested in the browser by construction.

- **The committed agent file never reached the model** (`H1`). `createMembrane`
  is per bound run, and `W4` re-armed the carried file in the live adapter's
  *view mirror* instead of the opened run's membrane. `unslot` answered
  `empty_slot`, so a carried sentence could not be released — the loop
  dead-ends once four seats arrive full — and `membrane.deployed()`, which is
  what `composer.judgment` carries into Call 1, was empty. **From day 2 onward
  on the live site, C-BLOCK was inert.** The fix replays the file as real
  `slot`/`deploy` ops, which the fixture loop's `carry()` always did.
- **A refresh returned a sitting that no longer existed** (`H2`). The resume
  restored callsign, counter and archive, and could not restore the filed
  report documents — they live in `windows/reports.ts` and are persisted
  nowhere — so F5 came back as ECHO-n with n empty rail tabs. A page load now
  starts a new sitting; `spec-client` §7 #8 is amended with it, and the audio
  mute key is deliberately not cleared.

**The rule this pays for:** a unit that changes what crosses a run boundary is
proved at the driver seam under vitest, never in the browser, and its Done-when
says so. The live path still has no end-to-end coverage at all — a real gap,
deliberately not closed before the deadline.

**Still open** — `plan-playtest.md` §3 carries the order, and it no longer
carries a cut line: everything listed there is meant to be built, and the two
items that are not (U2, O2) say so in place.

- **T3** — the desk is still three side-by-side columns, which is T1's shape,
  not T3's. T3 is two columns: REPORTS large on the left, the right split into
  LIVE FEED above and AGENT FILE below. REPORTS is where mining happens and
  where cause will render, and it currently has the middle of three narrow
  columns while the LIVE FEED ticker has the widest.
- **C1 → U5.3** — a page per ECHO-n, so the player can compare the file they
  gave one agent against the next. Today the previous sitting's file leaves the
  desk entirely when it is rebuilt, so nothing answers "what did I change, and
  what changed in the result". 민서 raised this ahead of U5.2c on 08-08: a
  citation is read once, a comparison is read every sitting after.
- **U5.2c** — render the cause. The seam already carries `cited_ids`.
- **The manual's §1–§4 content** — still placeholder, and two of its bodies are
  now false: they describe a 집계 window U3 deleted and a two-press day W4
  replaced.

## Status (2026-08-08) — the desk has sound, and it costs the opening paint nothing

**34 cues ship**, wired through one call in `boot.ts` step 4c. The whole layer is
an observer: it reads the §5.2 stream, the `[data-op]` census markers the five
membrane controls carry, the classes the window manager and the ledger set, the
fanfold's revealed lines and the report typewriter's own repaints. It sends no op
and no component imports it, so audio can be deleted or muted without touching
what is playable — which is also why `audio:check` is deliberately **not** in
`npm run check`. Plan, sources and per-criterion verification:
[plan-audio.md](./plan-audio.md); the mapping itself is law in
`data/policy/audio-map.json`.

**Nothing is fetched before the player's first gesture.** A browser suspends an
AudioContext built outside one, so the context, `audio-map.json` and every sample
wait for it — measured headless at **0 audio bytes at first paint**. The pack
then loads in three waves: the door's cues, the rest of the SFX, the two beds.
Unlocking happens at O1's door so its controls answer; the ambience waits for
`revealDesk` and retires 10 s later, because a room tone that plays out behind a
curtain is one nobody hears. The format is **AAC in MP4**: `decodeAudioData`
takes it in every desktop browser shipping today including Safari, and it does
not depend on an ffmpeg built with `libvorbis`.

**Everything sourced is CC0 or public domain**, so the game carries no mandatory
attribution. `assets-manifest.json`'s 34 audio rows are **generated** from the
builder's own source table (`npm run audio:manifest`), so provenance cannot drift
from what was built. The other half is synthesised by `tools/audio/synth.mjs` —
seeded and byte-reproducible, because the outputs are committed.

**Sizes:** 141.0 kB of SFX, 494.4 kB of ambience, ~7 kB of map.

**O3 coexists with this layer, moment by moment** (plan-audio §4.5). O3's
implementation (`shell/radio-sfx.ts`, merged in #179) keeps its three moments
and its no-assets approach — the carrier static under the LOGIN readout, the
squelch at the hand-over, and 21:04, where **the static swells and cuts, and
the silence after the cut is the cue**. This layer yields those three by data
(`door:login`, `boot` and `ending:collapse` bound `null`; the window observer
skips `.win-manual`) and does everything else, keeping the 2800 ms ledger lead
that guards the ending's silence. O3 reads this layer's `dday.audio.muted` key
before every burst, so the ♪ toggle is the desk's one mute. The yielded cues
ship in the pack; each rebind is a one-line map edit.

## Status (2026-08-06) — the deployed build was publishing its own answer key

**`dist/` is a player surface, and nothing was treating it as one.**
`copyPackData()` copied `data/scenario` and `data/policy` into `dist/`
recursively, so every authoring file sitting beside the parts the run fetches
shipped with them — `draft.md` above all, 44 kB carrying all eight gates with
their stances and outcomes, the key conditions, truths 1–5 and the
no-intervention line, readable at a URL on the live site. `vite.config.ts`'s own
rule said "By name, never `data/` wholesale"; it was honoured at directory
granularity and not at file granularity, and a recursive copy cannot express
"the pack, but not the source it was compiled from". It enumerates now: 22
published files → 8. `gates.json` has to ship, so its `standard_form` and
`branch_note` — which write a gate's answer out in prose — are stripped from the
published copy while the authored file keeps them.

**The same class of defect twice more, both caught by the guard the first one
motivated.** `tests/scaffold/published-data.test.ts` holds the allowlist to both
loaders' `PACK_FILES` and checks that no seam reads a stripped field. When
`main`'s score work merged into the playtest branch it added `score` to those
loaders — the scorer resolves `units[].predicates` at 21:04 — and the branch's
allowlist did not carry it, so the deployed client would have fetched a file the
build never copied. Publishing it raw would have re-opened the leak: its
`baseline_summary` states the no-intervention ending outright and
`attributed_gates` names the gates a unit hangs off. It ships stripped, on the
`gates.json` precedent; the scorer reads `id`, `label` and `predicates` and
derives the baseline by resolving the same predicates against the untouched day
rather than trusting the authored prose.

**`npm run check` runs no vitest**, which is why none of this was visible to the
gate most work runs. It is `tsc` (core + client) · `typecheck:test` ·
`datapack:check` · `test:shared`; every vitest suite, including every structural
guard, runs only under `npm run test`, and only `npm run build` shows what
actually ships. Any work that changes what reaches the browser has to run all
three.

**Also fixed:** `.min.slotted` — a highlight authored in u1 — had never rendered.
`sentenceState()` read `mined` before `slotted` and nothing can be slotted
without being mined, so the state was unreachable; and slotting repainted
nothing, because REPORTS subscribed to `meta`/`report` only while `slot` is a
membrane op. The suite covering it seated a slotted-but-unmined id, which the
engine forbids — it was covering a branch that could not execute.

**Playtest triage lives at [plan-playtest.md](./plan-playtest.md)** — 17 items
from the 08-05 session with dependency order and work groups, plus §5, the rule
set for specifying them as mini-PRDs for low-cost executors. (It carried a cut
line until 08-08; priority lives in §3's ordering now.)

**The 08-05 entry below is superseded on its central claim.** It says
`ScorerPort` is declared but unbuilt, neither composition root supplies one, and
all 8 units of `score.json` have `predicates: []`. None of that is true in the
working tree: `score.json` carries **9 units, all 9 with predicates**,
`src/driver/scorer.ts:136` builds the port, and both roots wire it
(`src/client/driver/live/bind.ts:84`, `tools/driver/run/bind.mjs:125`). It also
names the unbound meters "c3–c7"; `characters.json` actually leaves **c2–c7**
unbound, 12 of 14 `meters[].variable` null. Meter binding is the only part of
that worklist still open.

**Consequence for the playtest plan:** two of its must items — U3 (the ending)
and showing which sentence moved the agent — were sized as blocked on that work
and are not. What is still missing is a *field*, not a port: `Sentence` is
`{id, text, species, axis?}` (`src/shared/view-driver.ts:18`) with **no
`referent`**, while a gate's key condition is a five-field record carrying one
(`src/shared/datapack.ts:153-158`). Matching a sentence to what it is for needs a
referent the wire does not carry.

## Status (2026-08-05) — the tally ledger is empty, and the reason is authoring, not wiring

**Symptom:** `run_end` opens the TALLY sheet with no score rows — on the live
desk and the headless run alike. The wiring gap is real (`ScorerPort` is
declared in `src/driver/ports.ts` but neither composition root —
`src/client/driver/live/bind.ts`, `tools/driver/run/bind.mjs` — supplies one),
but wiring is not the blocker: **the data is.** Every one of the 8 units in
`data/scenario/우는다리/score.json` has `predicates: []`, and the schema calls
predicates a 하드닝 산출물 — empty is legal at compile time, and
`npm run datapack:lint` already FLAGs all eight as the hardening worklist. The
same worklist shows the character meters unbound (c3–c7: 통제욕 has no state
variable), and predicates need bound variables to read — same piece of work.

**Order of operations** (authoring + engine, not client): (1) bind the
character meters to state variables; (2) author the 8 units' predicates;
(3) implement a `ScorerPort` that evaluates them against `RunState`; (4) wire
it in the two composition roots. The view side is done waiting —
`components/score-tally.ts` renders rows, `windows/tally.ts` carries the
headline axis, and `score.json`'s `baseline_summary` is the 무개입 baseline the
ledger grades against.

**Also fixed on this branch:** `tools/driver/drive-run.mjs` guarded its
entrypoint with a bare `import.meta.main`, which is `undefined` below Node
22.18 — the CLI exited 0 having done nothing, and `test:shared` then failed 13
tests downstream on artifacts that were never written, pointing at missing data
rather than the cause. The guard now falls back to comparing
`pathToFileURL(realpathSync(process.argv[1]))` against `import.meta.url`. The
`realpathSync` is load-bearing: `import.meta.url` is always the resolved real
path while `argv[1]` is whatever the caller typed, so without it the fallback
reads false through a symlink — and `os.tmpdir()` is one on macOS, which made
the shipped-tree test fail in exactly the silent way the fallback removes.

**There is no longer a `import.meta.main` floor**, so `engines.node` is
`>=22.12` — the real dependency floor (vite 8 asks `^20.19 || >=22.12`, and
`--experimental-strip-types` in `test:shared` needs ≥22.6), not the 22.18/24.2
feature floor the bare guard imposed. `.nvmrc` pins 24, matching ci.yml's upper
job. Verified green on v22.16.0 — below the old floor, above the real one.
Deliberately NOT `engine-strict`: the failure below a dependency floor is a
loud install error, and the silent no-op that would have justified a hard block
is the thing this branch removes. CI's Node 22/24 both sit above either floor,
which is why CI could never catch the original.

## Status (2026-08-04) — the proxy is deployed, and the latency budget was wrong

**The tier has made real Bedrock calls.** `nhn-game-proxy` is live in
`ap-northeast-2`; all three call types answered through it. This closes the
08-03 entry's "**Not done: zero real Bedrock calls**".

Getting there took three IAM rounds, and each one was a real defect rather than
a fumble. The bootstrap stack was **reused for the artifact bucket and the OIDC
provider — correctly — but its execution role was reused too, and that role
carries a policy literally named `UpdateLlmLayerResources`**: no
`lambda:CreateFunction`, no `iam:CreateRole`, no `logs:CreateLogGroup`, and an
`apigateway` grant pinned to apothecary's existing API id. It was authored to
*update* one stack that already existed. `proxy/deploy/bootstrap.yaml` is the
second execution role, scoped to this stack's names; the genuinely account-wide
singletons stay shared. Two more actions surfaced only on a create path:
`apigateway:TagResource` (its own action, not covered by the HTTP verbs) and the
`logs:CreateLogDelivery` family (an HTTP API does not write its own access
logs — it registers a vended log delivery).

### First measurements — and the budget they broke

| call | model latency | notes |
|---|---|---|
| judgment | 3.14 · 3.18 · 3.38 · 4.03 s | ~2 490 input tokens; the tier itself adds 3–7 ms |
| narration | 3.59 s | first ever call; `npc_lines` kept id prefixes and the line/room split |
| reporter | 6.80 · 6.95 · 9.20 · 9.54 · 10.00 s | ~1 080 output tokens |

**The reporter did not fit.** Under the inherited 7 s model deadline, 2 of 3
calls returned `504 bedrock_timeout`, and the one that passed did so by writing
16 sentences where `REPORT_GUIDANCE` asks for 20–30 — it beat the clock by
breaking the contract. The three ceilings are now **15 s model < 18 s route <
20 s Lambda**, with the same 15 s bound in `proxy/src/config.ts` so the ordering
cannot be misconfigured from the environment. Re-measured: 5/5 pass, 23–35
sentences.

The old 7 s came from apothecary's "API Gateway waits 9 s, keep 2 s for
validation and fallback". The arithmetic was sound; the premise — that 7 s is
enough for a call this tier had never made — was never tested.

**Nova 2 Lite was measured and rejected.** Same rendered prompt, same
scenario, straight at Converse: 4.19 s mean vs haiku's 7.79 s. But per output
token it is only ~9 % faster (6.60 vs 7.23 ms/tok) — the gap is almost entirely
that it writes **less**: 12–16 sentences against the contract's 20–30, and its
`facts[0]` copied the input line verbatim where haiku rewrote it as a record.
The same saving is available from haiku by asking for a shorter report, which
makes model choice and length policy the same lever. Against that: Nova needs
the loose tool spec (apothecary's `structuredOutputMode` split existed for
exactly this), and every C-BLOCK measurement — 761 judgment calls, the
`p=0.0000595` result — is haiku. Switching would decouple the measured
mechanism from the shipped system six days before the deadline.

**Deploys are automated and hold no secret.** `.github/workflows/proxy-deploy.yml`
assumes `nhn-game-ci-proxy-github` over GitHub OIDC; the developer's 24-hour SSO
session is a *deploy-time* credential only, and nothing in the runtime path
authenticates to AWS at all — the browser posts to a public endpoint, and the
Lambda uses its own execution role. `deploy.yml` (Pages) is untouched.

**Still open:** the endpoint is public and unauthenticated (origin checking is
CORS, not security); the retry budget and the single-origin lock are both
recorded in [README §4](./README.md#4-open-cross-track-items).

## Status (2026-08-03)

**Client track claimed — 민서, minimal-first.** The client layer now has an
owner, closing the "largest schedule risk" row (README §4 ·
[plan-game-design.md](./plan-game-design.md) §7 risk 2 — both flip on their
next revision). Plan is two-phased: **Phase 1** = a minimal working UI that
renders engine output into something visible — its purpose is verifying the
engine, with the UI serving as the test base. **Phase 2** = enhancement
(typography/document-art direction per plan-game-design §6). The layer stays
intentionally minimalistic — there is no frontend developer or designer on
the team; it gives an idea of what could have been, not a blank. Next
artifact on this track: a **UI/UX spec & contract document** that becomes the
SSoT for implementation; until it lands, working decisions live in a local
(untracked) WORKLINE file on 민서's machine.

## Status (2026-08-03) — repo structure settled · the proxy is real

**`infra/` is gone, and `services/` with it.** One folder,
`infra/test-harness/`, was holding the production system prompts, the three
calls' output schemas, the payload composer's prototype, and an embryonic
full-run driver, so none of physical architecture §3.1's boundaries were visible
in the tree. Four roots now, split on what each thing actually is:

| Root | Job | Runs |
|---|---|---|
| `src/` | the browser bundle + isomorphic core | browser (+ Node for engine/composer) |
| `authoring/` | datapack compile · lint · type generation | Node, before anything else exists |
| `tools/` | probe runner · beat driver · shared libs | Node, never reachable from index.html |
| `proxy/` | the LLM tier — Lambda → Bedrock | AWS, outside the root install |

Experiment vocabulary (arm, channel, placebo, harness) is confined to
`tools/probe/`. Two undeployed backends moved to `planning/legacy-services/` —
nothing calls either, and the deployed `demos/apothecary/` runs stub-only.

**✅ Decision — the proxy renders both prompt layers** (physical §3.10). The
client posts `{call_type, template_version, slots}`; "user" there is the Messages
API message *role*, not the player. Rendering needs the slot renderers, and the
tool schema is built *from* a slot value, so the renderers and output schemas
followed the templates into `proxy/`. The call contract's executable form went
from three copies to one, and `src/shared/contracts.ts` narrows to the payload
envelope.

The cost is two renderers — the probe measures offline and cannot reach a
Lambda. `proxy/tests/prompt-parity.test.ts` holds them to byte identity;
mutation-tested, 8 of 9 renderer mutations turn it red and the 9th is unreachable
with the current templates.

**Verified across the move:** all three call types compose byte-identical system
and user messages before and after; probe selftest 44/44; proxy 36/36;
`npm run build` green. **Not done: zero real Bedrock calls** — no deploy, no AWS
smoke.

**Run records** go to `artifacts/runs/` and `artifacts/reports/`, committed — not
under `data/`, which is copied into `dist/` (§3.7) and would publish every
measured run to the web.

### TBD audit — what blocks running the tracks in parallel

The criterion is that any interface two work units cross must be specified before
the fan-out, or parallel agents each invent a different signature.

| Boundary | Specified | Missing |
|---|---|---|
| composer ↔ proxy | implemented, 36 tests | the HTTP envelope is in code and READMEs, not in a contract document; `src/shared/contracts.ts` still types the proxy-owned slots as client-supplied and is **stale** |
| state engine ↔ composer | call contracts §6 supplier map | the module interface entirely — no engine snapshot type, no `temperament.json` → prose renderer (the probe uses hand-written `.md` fixtures), and "round event assembler" appears once in a §6 diagram with no owner. **This is the blocker** |
| consumer rules | §6 "Consumer per output" maps where fields flow | what production does with a soft failure, who isolates `inner_note` to Call 3, who appends `timeline_entries` |
| `ui` | plan-game-design §6 brief, explicitly plan-tier | a spec, and the five U-owned parameters in architecture spec §9. The entry above claims the track and names a UI/UX spec & contract document as its next artifact — that is what closes this row |

Also open: the `dist/data` copy plugin (§3.7) still does not exist, and without a
`proxy` transport no measurement has crossed the tier that ships.

## Status (2026-08-02)

**시나리오 확정 + 첫 데이터팩 존재.** 우는다리로 확정(민서 결정), 데이터 트랙
P0가 컴파일러·lint·스키마와 함께 첫 팩을 냈고 **G1이 손으로 하드닝됐다** —
"선정된 초안의 G1"을 기다리던 최소 엔진의 전제 조건이 채워졌다. 남은 빈 필드는
`edge_predicates` 하나이며, 엔진 명세 §4.3이 그 어휘를 고정했다(빈 배열도
유효하므로 엔진 착수를 막지 않는다).

**두 트랙 경계에서 정본의 위치가 바뀌었다.** 데이터팩 타입의 정본은
`data/scenario/_schema/*.schema.json`이고 `src/shared/datapack.ts`는 그
전사다 — TS 타입은 런타임에 지워져 JSON을 검사하지 못하고, 팩은 엔진도 TS
빌드도 없는 시점(compile·lint)에 검증돼야 한다. `contracts.ts`가 계약 문서를
전사하는 것과 같은 구조다. 남은 비용은 전사 drift이며 생성 또는 lint 대조로
갚는다(물리 §3.1).

## Status (2026-08-01)

**Phase transition: demo → production.** DDAY is the selected concept (07-28
decision; the demo bake-off is superseded), so the real build happens at the
**repo root** — this supersedes the earlier `demos/dday/` scaffolding plan.
CLAUDE.md updated accordingly (PR #99). Demos stay deployed at `/<slug>/` as
competition history. Work runs as three tracks per
[plan-pipeline.md](./plan-pipeline.md): **data (민서)** ·
**architecture (윤석)** · **client (미배정)** — agreement works by document,
not discussion. The physical structure wrapping the layers is bound by
[spec-physical-architecture.md](./spec-physical-architecture.md) — tier split,
constraints, and the §3 repo layout are all in force. The minimal engine now
has a spec: [spec-engine.md](./spec-engine.md)
answers the request's five questions and closes call-contract open items
#4 and #5.

## Status (2026-07-30)

**DDAY 기본 메커니즘 확정 — C-BLOCK.** 실제 haiku 호출로 메커니즘 후보를
측정한 결과, 문장 블록 한 줄을 `[알려진 것]`에 주입하면 에이전트의 stance가
`경청 → 공감`으로 9/10 이동했다 (one-sided Fisher `p=0.0000595`). 이것이 게임의
core loop다 — 블록 선택 → 상황 해석 변화 → stance/행동 변화 → 플레이어가 확인.
우선순위 **순서** 조작(C-STRUCT)은 7개 구성·180개 유효 응답에서 목표 방향 효과가
없어 중단했다. **주의: C-BLOCK은 채택됐지만 검증 완료가 아니다** — placebo
control, program-wide negative control, blind coding이 남아 있다. 대외 문구는
"현재 가장 강한 실측 근거를 가진 기본 메커니즘"까지만 쓴다. 프로그램 진입점:
[planning/dday-mechanism/README.md](../planning/dday-mechanism/README.md).

**다음은 측정이 아니라 구현.** 만들 것이 무엇인지는 확정됐다. `demos/dday/`
스캐폴딩과 첫 60초 플레이 루프가 우선이고, 남은 검증 중 게임에 직접 영향을 주는
것은 placebo control 하나다.

## Status (2026-07-29)

**DDAY 컨셉 확정** — the 07-28 team meeting confirmed the D-Day 시뮬레이션 track
(replacing darkest-context as the main line). Scenario: 테러리스트의 전화 **축소
버전**; runtime model: haiku; presentation: text-detective, no spatial movement.
Compact/합성 and prompt-length limits are deferred to Phase-2. Work split
(~07-29 18:30): 윤석 = 기획 문서 (real project spec format), 민서 = 시나리오 축소
+ repo cleanup. **Track SoT: [dday-sot.md](../planning/dday-sot.md)** — start there; it maps
every document, test result, and open decision. Branch `concept/dday-simulation`,
PR #85 open to main.

## Status (2026-07-22)

**Demo phase.** Concept drafting is closed: the 2026-07-22 team meeting consolidated the
6 proposals into 3 tracks. Next, a simple playable demo is built per track under
`demos/<slug>/` (each demo picks its own minimal stack); the final concept is selected by
comparing the demos' plausibility. The repo root is still the engine-agnostic
Vite + TypeScript skeleton — no demo has been scaffolded yet.

## Active tracks

The demo concept tracks are closed — DDAY won. Current tracks are work lanes,
not concepts; owners, questions, and deliverables live in
[plan-pipeline.md](./plan-pipeline.md) §1:
**data (민서)** — formats and transformations · **architecture (윤석)** —
wiring and runtime · **client (민서, 08-03~)** — player-facing surface,
minimal-first.

## Next steps (priority order)

1. **Specify the composer ↔ engine boundary** — the engine snapshot type, the
   `temperament.json` → prose renderer, and where the round event assembler
   lives. See the TBD audit above: this is what blocks the three tracks running
   in parallel. (Root scaffolding is done — §3.8 steps 1–2 and 4 landed 08-03;
   `tsconfig.tools.json` is deferred until `tools/` has a `.ts` file, and the
   `data/` copy plugin is step 3, still open.)
2. **Minimal engine** (doubles as the W4 check) + Bedrock production path. **Its
   first datapack already exists** — `data/scenario/우는다리/`, lint ERROR 0,
   G1 hand-hardened (buckets, deltas, meter bindings to the spec's provisional
   `trust`/`fear`, symptom coverage passing actively). The engine no longer
   waits on anything data-side; target is engine spec §7 criterion 1, one full
   round on that pack. Unit fixtures for the §7 criteria live in test code, not
   in `data/` — including the edge-predicate branches, since G1 ships with an
   empty `edge_predicates` (valid per spec §4.3).
3. **Close the datapack handoff** (pipeline §2 stage 5) — the consuming half of
   [handoffs/datapack.md](./handoffs/datapack.md) §4: suite generator
   eats the G1 card, engine loads the pack. Two of its five items are answered
   by engine spec §4.2–4.3 (`effects` shape, routing vocabulary); one decision
   is open — where `REPORT_GUIDANCE` lives (data track proposes
   `data/policy/report-guidance.json`, outside the pack).
4. First-gate probe (P1), then full-run gameplay measurement (P2).
5. Client track (민서, claimed 08-03): first the **UI/UX spec & contract
   document** — it binds the §9 parameters owned by U (latency budget, report
   cadence ratification, slot count, block-pool curation) and unblocks beat
   granularity (engine spec §8) via the pause structure — then the phase-1
   minimal UI (engine-verification test base).

## Open TODOs

- Verify the exact submission deadline and video editing rules on the official
  competition page (deadline currently assumed ~2026-08-10).
- **Regenerate the nine reference shots — deferred until the UI settles**
  (민서, 2026-08-08). `e2e/reference-shots/` is a visual-regression baseline,
  and seven of its nine frames were rendered 2026-08-05 (`e98ac9e`): they still
  show four windows with the BLOCK STORE, the retired ×1/×4/pause transport
  row, and the AGENT FILE's old block-store slot cards. The `captures` suite
  pairs by NAME only — it never diffs pixels — so a stale baseline is green,
  not red. It costs nothing today and guards nothing either; the moment the UI
  stops moving it should be refreshed, because until then a real visual
  regression has no oracle. One command, run on a build of `main`:
  `CAPTURE_BASELINE=1 SHOT_OUT=e2e/reference-shots npx playwright test captures`
  (the name/count asserts still bind in that mode, so a refresh cannot quietly
  ship eight). The shots are renders of our own UI by our own harness, so they
  are deliberately NOT in `assets-manifest.json`.

## Decision log

- 2026-08-03 — **Removed blocks are discarded, recovered by re-mining**
  (민서·윤석 chat; recorded in spec-architecture §2.1). Slot composition is
  free at build time; no discard inventory. Every past report stays readable
  in the archive, with previously-slotted sentences highlighted; the
  archive's segmentation must not expose gate structure to the player.
  Presentation details bind with the UI pause structure (§9).

- 2026-08-02 — **docs/ reorganised onto three tiers: `spec-` / `contract-` /
  `plan-`.** `spec-` is the normative authority for its domain (breaking it makes
  a downstream artifact defective even if it works); `contract-` is a fixed
  interface between two named owners, carrying a map plus a pointer to where the
  machine-readable law lives; `plan-` is normative about the work rather than the
  artifact. Legend, document map, and the redirect table for old names:
  [docs/README.md](./README.md). Structural consequences: the pipeline document
  split into [plan-pipeline](./plan-pipeline.md) +
  [contract-datapack](./contract-datapack.md) (absorbing the lint ruleset) +
  [contract-run-artifacts](./contract-run-artifacts.md); the answered engine
  request and the 07-29 design doc moved to `planning/`; a live game-design
  document now exists at [plan-game-design](./plan-game-design.md). Two standing
  problems were fixed rather than renamed: call-contracts §8 had three revision
  requests the architecture spec had already absorbed, and cross-track requests
  were scattered across four documents with no single place to see them —
  docs/README.md §4 is now that place. **docs/ is written in English**: its
  primary readers are agents, and the Korean/English split ran straight through
  the binding set.
- 2026-08-02 — **데이터팩 타입의 정본은 JSON Schema**(`data/scenario/_schema/`),
  `src/shared/datapack.ts`는 전사다. 08-01의 "타입은 코드가 정본"을 뒤집는다 —
  근거는 강제 가능성이다: TS 타입은 런타임에 지워지고, 팩 검증은 엔진과 TS
  빌드가 없는 compile·lint 단계에서 일어나야 하며, "조건당 key example 2개
  이상" 같은 데이터 계약 규칙은 TS로 표현되지 않는다. 대가는 전사 drift이고
  생성 또는 lint 대조로 갚기로 한다. 같은 리비전에서 엔진 명세가 흡수한 것:
  스칼라·delta **정수** 규약(§1.3), flag write를 **스크립트 이벤트 전용**으로
  축소(§1.1), 스크립트 비트 순서 규칙(§4.2), **라우팅 어휘**(§4.3),
  `symptoms.json`을 하드닝 산출물로 스코핑(§2.2). 데이터 트랙 리뷰(#102) 반영.
  [물리 §3.1](./spec-physical-architecture.md) · [엔진 명세](./spec-engine.md).
- 2026-08-01 — **물리 아키텍처 §3 확정 + 최소 엔진 명세 v0.** 레이아웃은 plain
  folder (npm workspaces 미채택) + tsconfig 3벌 — `core`에서 `DOM` lib를 빼서
  isomorphism 제약을 **컴파일 에러로 강제**한다. 프록시는
  `planning/legacy-services/apothecary-llm-layer/`의 복제본이며 원본은 건드리지
  않는다. `src/shared/`는 파일로 소유를 가른다(`datapack.ts` 민서 /
  `contracts.ts` 윤석), **타입은 코드가 정본**(→ 08-02 항목이 뒤집음). 엔진
  명세는 요청서 §6의 다섯
  질문에 답하고 계약 v1 미결 #4·#5를 닫는다 — 변수 목록·타임라인 길이·재시도
  예산은 실측 전까지 **잠정**이다. 발견: §2 제약 3(데이터팩의 브라우저 도달)과
  5(`data/` 소재)가 현재 같이 서지 못하며, 빌드타임 복사로 해소했다.
  [물리 아키텍처](./spec-physical-architecture.md) §3 ·
  [엔진 명세](./spec-engine.md).
- 2026-08-01 — Phase transition declared: demo → production. DDAY is built at the
  repo root (supersedes the `demos/dday/` scaffolding plan); demos remain deployed
  as history. The root's physical layout is owned by the architecture track via
  [docs/spec-physical-architecture.md](./spec-physical-architecture.md) —
  tier split and constraints fixed; §3 layout filled on 08-01 (entry above).
- 2026-07-30 — DDAY 기본 메커니즘은 **C-BLOCK**(문장 블록 주입 → 해석 변화 →
  stance/행동 변화 → 확인 가능한 결과). C-STRUCT(우선순위 순서 재배열) 테스트는
  중단 — 8개 구성·190개 유효 응답 보존, 근거 표본 7개 구성·180개에서 목표 방향
  효과 없음. priority UI는 서사용으로 남길 수 있으나 순서 변경 효과를 약속하지
  않는다. C-STRUCT의 보편적 실패 판정이 아니라 program pause이며, 재개 조건은
  결정문 §6에 고정했다. 근거·한계·실험 계보:
  [MECHANISM-DIRECTION-DECISION.md](../planning/dday-mechanism/MECHANISM-DIRECTION-DECISION.md) ·
  [EVIDENCE](../planning/dday-mechanism/MECHANISM-DIRECTION-EVIDENCE.md).
- 2026-07-30 — 메커니즘 실측 문서 체계를 4단(DECISION / EVIDENCE / HANDOFF /
  RUNLOG)에서 3단(DECISION / EVIDENCE / RUNLOG) + 진입점 README로 통합.
  `CSTRUCT-J1-TEST-HANDOFF.md`는 중단된 계열의 handoff라 대상이 없어졌고,
  유일본이던 실험 계보는 EVIDENCE §5로 흡수했다. **raw artifact(`suites/`,
  `runs/`)와 RUNLOG의 append-only 성질은 손대지 않는다** — 재현성과 사후
  구성 변경 방지가 이 프로그램 신뢰도의 근거다.
- 2026-07-25 — No real-time image generation, in any concept: NPCs (appearance, problems,
  portraits) ship as pre-generated, manifested asset sets; only speech/dialogue text is
  generated at runtime. The runtime LLM layer is therefore single-provider (Bedrock only) —
  no gpt-image-1/OpenAI in deployment; apothecary's portrait endpoint is dev-time tooling.
- 2026-07-25 — LLM backend direction settled: stateless proxy, GitHub Pages → API Gateway →
  Lambda → Bedrock Converse, per `docs/llm-backend-aws-bedrock.md` (PR #48). PR #15's
  agent-arena API merged as a **superseded reference implementation** (at `services/agent-arena-api/`; archived to `planning/legacy-services/` on 08-03) — kept for
  history and salvage (closed-action validation, contract shapes), never deployed.
- 2026-07-25 — AWS account live and verified: personal account `141840355276`, IAM Identity
  Center (both members), CLI profile `nhn-game`, budget alarms, and both candidate models
  (Haiku 4.5 / Nova 2 Lite) answering real Converse calls via Global inference profiles.
  The common LLM layer is being built **before** the bake-off completes (plumbing is
  concept-agnostic); plan + account state in `docs/handoffs/llm-layer.md`.
- 2026-07-25 — Darkest Context: solo-tile 담당 (1:1 duel, jailbreak) is not player-assigned;
  the party elects one member via the shared council engine at walk-start (volunteer/nominate
  → deterministic engine tally; fallback = highest aptitude stat), then the elected unit's
  first tile judgment pre-fires — two wall-clock calls hidden behind the walk animation.
- 2026-07-25 — Track C renamed **Darkest Context** (slug `darkest-context`); consolidated
  concept spec at `docs/game-concept-darkest-context.md` (merges brief + example spec +
  PR #28 review). Decisions: combat/travel view fixed to DD-style side-scroll; cards
  split 3-way Prompt/Skill/MCP (all implemented as sheet prompts, engine executes
  effects); token stays pure currency (stamina idea rejected); jailbreak stays 담당 1기.
  Next artifact: demo PRD.

- 2026-07-22 — Blacksmith absorption executed: apothecary doc gains 단골 아크 (§5.8),
  [정석]/[실험] 조제 (§5.3), 연쇄 결과 (§5.5), 상태 원장 (§6); economy/능력 격차 and
  world-channel expansion dropped (see apothecary 부록 A). Blacksmith doc marked archive.
- 2026-07-22 — 6 concepts consolidated into 3 tracks: agent-roguelike + autobattler
  combined; apothecary absorbs blacksmith; doodle-lab absorbs placement.
- 2026-07-22 — Final concept chosen via demo bake-off, not on paper. The 기획서 template
  and paper-test workflow are retired; those files stay in `docs/` as unreferenced
  archive, and no merged 기획서 will be written.
- 2026-07-22 — Demo layout: `demos/<slug>/`, each with its own minimal stack; the final
  selected game is built at the repo root.
- 2026-07-22 — All 6 concept proposals (`docs/game-concept-*.md`) completed and merged
  before this meeting.
