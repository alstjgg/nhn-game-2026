# PRD — Engine / LLM build

> **For:** super-pipeline. **Owner:** 윤석 (architecture track).
> The counterpart to [plan-client-build.md](./plan-client-build.md), which is
> building the view layer in parallel **right now**. The two meet at the
> view-driver seam ([spec-client §5.2](./spec-client.md)) — ratified, and this
> build is the half that has never existed.
> Normative sources this PRD does **not** restate:
> [spec-engine](./spec-engine.md) · [contract-calls](./contract-calls.md) ·
> [contract-engine-composer](./contract-engine-composer.md) ·
> [spec-physical-architecture](./spec-physical-architecture.md) ·
> [architecture-map](./architecture-map.md).
>
> **Rev 2 (08-03, harness pass).** The unit content is unchanged; how it is
> **built** is not. Rev 1's dependency graph was eight near-serial waves with a
> maximum parallelism of two — the harness's fan-out could not engage, and the
> estimated wall clock was ~24h. Rev 2 lands the public surface as a skeleton in
> wave 1 and lets six units build against it concurrently (§1a), turns the
> build's real risk — determinism — into gate commands rather than review items
> (§5), and pins the harness configuration the run needs (§9). Same eleven units,
> five waves, ~12–16h.

## 1. What this build does

Everything to the left of the view-driver seam:

```
pack ─→ [engine] ─→ views ─→ [composer] ─→ CallRequest ─→ [transport] ─→ proxy
          │                                                    │
          └──→ FeedLine[] ──→ [live driver] ──→ ViewEvent ──→ (client, already built)
                                    ↑
                            [run-loop manager] ── meta events · sessionStorage
```

**Does NOT do:** any file under `src/client/` (the client build owns it —
touching it will collide mid-flight) · AWS deployment or a real Bedrock call
(next run; the transport is built and tested against a fixture provider) · any
edit to `docs/design/` or the scenario pack (findings → `DISCOVERY.md`) ·
`authoring/` · `tools/probe/`.

**Standing condition:** never **remove** anything from `tsconfig.core.json`'s
`include`, and never add a path alias. That file is the mechanical isomorphism
guard (physical §3.4–3.5); type stripping does not read `tsconfig.json`, so an
alias fails at run time in the headless driver rather than at build.

`include` already declares all six isomorphic folders — `src/transport`,
`src/driver`, and `src/runloop` landed with physical §3.1 (08-03), so **no unit
edits `tsconfig.core.json` at all**. It is a frozen input (§9). The client
build's `tests/scaffold/isomorphism-guard.test.ts` enforces this mechanically;
if that test does not yet assert all six folders, extending it is e0's job and
nobody else's.

### 1a. How it is built — skeleton first, then six units in parallel

The dependency chain in the module graph is real. The chain in the **build** is
not, and Rev 1 conflated them. Every signature this build needs is already
closed (§3, thirteen decisions), so the public surface can be *written down*
before any of it works:

**e0 lands the skeleton** — every exported type and every function signature for
`engine`, `composer`, `transport`, `driver`, and `runloop`, with bodies that
`throw new Error('unimplemented: <symbol>')`. `npm run check` is green against
it; nothing runs.

**Then e2·e3·e4·e5·e6·e8 build concurrently against that skeleton**, each
replacing its own slice. A unit that needs a neighbour takes it **by injection**
(§3, decision 15) and tests it with a double — which for the ordering
invariants is the stronger test anyway: a fake state core that records call
order proves "delta before predicate" directly, where a real one only proves the
outcome.

The harness is built for this. Its IMPLEMENT and VERIFY prompts already say that
*forward-oracle failures from stubs of downstream units are not this unit's
responsibility* — but that clause only pays off if the skeleton exists, which is
what e0 is for.

**e7 is where it first has to actually work.** It binds the five real modules and
is the run's first integration point; budget it as the highest-risk unit
alongside e3.

**The skeleton is frozen once e0 merges.** A signature that turns out wrong is a
`DISCOVERY.md` entry plus a steer on the dashboard PR — never a unilateral edit,
because five units are compiling against it at that moment.

## 2. Environment & gates

- Root Vite + tsc project. `npm run check` and `npm run build` must stay green at
  every unit boundary.
- **Unit tests are vitest at `tests/**/*.test.ts`** (`npm test`), type-checked by
  `tsconfig.test.json` (`npm run typecheck:test`). Both arrive with the client
  build. **No test file goes inside `src/`** — `tsconfig.core.json` stays a pure
  isomorphism guard with no test types in it.
- **Zero runtime dependencies** in `src/`, and **this run adds no dev dependency
  either**: vitest, playwright, and `@types/node` all arrive with the client
  build. `package.json` is a frozen input (§9).
- `proxy/` has its own install and its own gate: `cd proxy && npm run check`.
- Node ≥ 24 for anything under `tools/`; the Pages build stays on the pinned CI
  Node and must not require otherwise.

### 2a. Prerequisites — the run does not start until these are true

1. **[#114](https://github.com/alstjgg/nhn-game-2026/pull/114) is on `main`.**
   e0 consumes `src/shared/segment.ts` and `species.ts`, and this PRD's own
   contracts live in that PR.
2. **The client build's run is merged**, or its integration branch is the base.
   `src/shared/view-driver.ts` exists **only** on the client run's branch. Based
   off `main` without it, e0 will invent the file — precisely the second copy
   #114 was written to prevent — and the two will conflict later. So will
   vitest: without it there is no `npm test`, and the run's gate command would
   change underneath it mid-run.
3. **`npm run check` composes both halves.** #114 appends `test:shared`; the
   client branch predates it and adds `typecheck:test`. After both merges the
   script must read
   `tsc -p tsconfig.core.json && tsc && npm run typecheck:test && npm run datapack:check && npm run test:shared`.
   Verify this by hand before the run — a silently dropped clause disarms a gate
   for every unit.

## 3. Decisions already made — build to these, do not re-open

| # | Decision | Where |
|---|---|---|
| 1 | The proxy renders **both** prompt layers; the client posts `{call_type, template_version, slots}` | physical §3.10 · contract-calls §11 |
| 2 | `template_version` is **per call type** (judgment v0.4 · narration v0.3 · reporter v0.2) | contract-calls §11 |
| 3 | The engine exposes **slot-oriented views**, not a `RunState` snapshot | contract-engine-composer §1 |
| 4 | The **round event assembler is the engine's** | contract-engine-composer §5 |
| 5 | The engine emits `FeedLine[]`; the driver wraps them into `ViewEvent`s | contract-engine-composer §2.0 |
| 6 | Sentence ids are **engine-minted**; channels `f·b·n·q` plus **`u`** for Call 1's utterance; symptoms carry **no** id | contract-engine-composer §2.0 |
| 7 | `BLOCKS` arrives as a **set of ids**, composer sorts **lexicographically** | contract-engine-composer §3 |
| 8 | Fallbacks are graded fatal / local / supply-cut, with concrete per-call behaviour | spec-engine §5 |
| 9 | `PRESENT_NPCS` **may be empty**. Nothing validates that `npc_lines` is then empty — a foreign speaker is *soft*, and **the engine drops the line** on the way to the timeline | contract-calls §6 |
| 10 | A round **begins with a gate**; beats before the first gate belong to no round and get no report | spec-engine §3.1 |
| 11 | NPC meters beyond the bound pair are authoring annotation, **not** engine state | spec-engine §1.1a |
| 12 | meta-state lives in `sessionStorage` | physical §1.1 |
| 13 | Run-loop manager lives at `src/runloop/`, isomorphic (no DOM) | contract-engine-composer §9 |
| **14** | **e0's skeleton is the signature of record.** Once it merges, no unit changes an exported signature — a wrong one is a `DISCOVERY.md` entry and a steer, because five units are compiling against it | §1a |
| **15** | **Every cross-module dependency is injected**, never imported as a concrete module: the beat driver takes its state core, the live driver takes engine·composer·transport, the runloop takes its storage adapter. This is what makes the skeleton buildable-against — and it is the same seam the headless driver needs to substitute in e9 | §1a · contract-engine-composer §3 |
| **16** | **Determinism is a gate command, not a review item.** Every artifact this build emits — minted ids, composed payload bytes, run records — is verified by re-running and diffing, inside `acceptance_criteria` | §5 |

## 4. Work units

`deps` are **build** dependencies, not module dependencies — a unit that only
needs a neighbour's *signature* depends on e0, not on the neighbour.
`file_globs` are exclusive: two units in the same wave never write the same file.

| id | title | deps | complexity | file_globs |
|---|---|---|---|---|
| **e0** | **skeleton & seam types** — `src/shared/id.ts` (mint + parse for the **five** minted channels `f·b·n·q·u`; `t*` inherited from `timeline.json`, never minted) · the **full public surface** of `engine`/`composer`/`transport`/`driver`/`runloop` as exported types + `throw new Error('unimplemented: …')` bodies, per contract-engine-composer §2·§3·§9. **`segment.ts`, `species.ts`, `view-driver.ts`, `tsconfig.core.json` already exist — consume, never rewrite** | — | medium | `src/shared/id.ts` · `src/{engine,composer,transport,driver,runloop}/**` (skeleton files only) · `tests/shared/id.*` · `tests/scaffold/skeleton.*` |
| **e1** | `src/shared/temperament.ts` + `report-guidance.ts` — structured pack/policy → the prose the bare `{TEMPERAMENT}` / `{REPORT_GUIDANCE}` slots expect | — | low | `src/shared/{temperament,report-guidance}.ts` · `tests/shared/temperament.*` |
| **e2** | `src/engine/` state core: variable init from bound meters · delta journal · `applyEffects` · symptom renderer (§2.3 in full, including the three hard errors) | e0 | high | `src/engine/state/**` · `tests/engine/state/**` |
| **e3** | `src/engine/` beat & round driver: beat schedule from `timeline.json` × gate clocks · §4.1 and §4.2 ordering · round boundaries per decision 10 · `gateView`/`beatView`/`roundView`. Takes the state core **by injection** (decision 15) and proves ordering against a recording double | e0 | high | `src/engine/beat/**` · `tests/engine/beat/**` |
| **e4** | `src/engine/` feed + round assembler: `feed()` with minted ids per decision 6 · `EXPERIENCED` assembly · `inner_note` isolation | e0 | high | `src/engine/feed/**` · `tests/engine/feed/**` |
| **e5** | `src/composer/`: the three builders · block-id resolution + canonical sort · proxy-owned slots never emitted | e0·e1 | medium | `src/composer/**` · `tests/composer/**` |
| **e6** | transport at `src/transport/` + a fixture provider: `POST /dday/call`, the §11 status/fallback mapping, `VITE_PROXY_BASE_URL` unset ⇒ degraded not crashed | e0 | medium | `src/transport/**` · `tests/transport/**` |
| **e8** | `src/runloop/`: run counter · carried blocks · report archive · exposure depth · `meta` events · `sessionStorage` adapter behind an interface so headless can substitute | e0 | medium | `src/runloop/**` · `tests/runloop/**` |
| **e7** | live driver at `src/driver/`: binds engine + composer + transport for real, emits `ViewEvent`, consumes `MembraneOp`. **First integration point of the run** | e2·e3·e4·e5·e6 | high | `src/driver/**` · `src/engine/index.ts` · `src/composer/index.ts` · `tests/driver/engine-*.test.ts` |
| **e9** | `tools/driver/drive-run.mjs` → a full run headless on the same modules, writing a run record to `artifacts/runs/` per [contract-run-artifacts](./contract-run-artifacts.md) §1. **This closes pipeline stage 5** — the data track's consumption question ([handoffs/datapack](./handoffs/datapack.md) §4-5) has been open since 08-02 | e7·e8 | medium | `tools/driver/drive-run.mjs` · `tools/tests/run-record.*` · `artifacts/runs/**` |
| **e10** | acceptance: contract §8's **ten** criteria as one suite + the determinism gates of §5 + `npm run check`/`build` green + the probe's 44 and the proxy's 39 still passing | all | medium | `tests/acceptance/**` |

**Waves:** `[e0 ∥ e1] → [e2 ∥ e3 ∥ e4 ∥ e5 ∥ e6 ∥ e8] → [e7] → [e9] → [e10]`.

`tests/driver/*` already holds the client build's seam tests — e7 adds files
under that directory, and rewrites none of them.

**All three run-artifact schemas already exist** (`data/runs/_schema/`), so e8
and e9 have machine-checkable targets rather than prose ones. Validate against
them; do not hand-roll a shape.

### 4a. Acceptance criteria — the harness's green gate, one command each

| unit | criterion | verification |
|---|---|---|
| e0 | id round-trip against `SPECIES_OF` for all five minted channels; `t*` rejected by the minter | `npm test -- tests/shared/id.test.ts` |
| e0 | every symbol in contract §2·§3·§9 is exported and throws `unimplemented` | `npm test -- tests/scaffold/skeleton.test.ts` |
| e0 | the isomorphism guard still covers all six folders | `npm test -- tests/scaffold/isomorphism-guard.test.ts` |
| e1 | the four §4 invariants: byte-identical across Calls 1·3 · non-empty · **deterministic (rendered twice, deep-equal)** · renders its own header | `npm test -- tests/shared/temperament.test.ts` |
| e2 | §2.3 ordering · `min`-descending first match · `(변화 없음)` · digit → throw | `npm test -- tests/engine/state` |
| e3 | delta-before-predicate (§7-5) · effects-before-Call-2 · **no report for a pre-gate beat** · views are snapshots | `npm test -- tests/engine/beat` |
| e4 | contract §8 criteria 1·5·6·**8·9** as written | `npm test -- tests/engine/feed` |
| e4 | **id golden** — a fixed fixture beat's minted ids byte-identical to the committed golden (§5 D1) | `npm test -- tests/engine/feed/id.golden.test.ts` |
| e5 | contract §8 criteria 4·7·**10** (7 runs the payload through the proxy's own validators, offline; 10 is the same-set-same-bytes check) | `npm test -- tests/composer` |
| e5 | **prompt byte-parity unbroken** (§5 D3) | `cd proxy && npm test` |
| e6 | every §11 status/code row maps to the right outcome; a 4xx never sets fallback | `npm test -- tests/transport` |
| e8 | two runs, carry-over survives, archive grows, adapter swappable | `npm test -- tests/runloop` |
| e8 | emitted meta-state validates against `data/runs/_schema/meta-state.schema.json` | `npm test -- tests/runloop/meta-schema.test.ts` |
| e7 | one scripted round produces the ratified event order; ops round-trip | `npm test -- tests/driver` |
| e9 | one full `우는다리` run against the fixture provider; record validates against `data/runs/_schema/run-record.schema.json` | `node tools/driver/drive-run.mjs --pack 우는다리 --provider fixture --validate` |
| e9 | **the same run twice is byte-identical** (§5 D4) | `node tools/driver/drive-run.mjs --pack 우는다리 --provider fixture --determinism-check` |
| e10 | contract §8's ten criteria as one suite | `npm test -- tests/acceptance` |
| e10 | full suite · check · build · probe · proxy | `npm test && npm run check && npm run build && npm run probe:selftest && cd proxy && npm test` |

## 5. Determinism gates

The failure this build is actually exposed to is not a red test. It is an
artifact that drifts: *the engine mints `b-r<run>-b<nn>` by position, so
re-splitting one sentence renumbers every id after it, and archive highlighting —
keyed on those ids — silently points at the wrong text in every stored run.*
That is a property, and a property no test asserts is a property the harness's
loop-until-green cannot defend. So each one is a **command**, listed in §4a and
re-run by e10:

- **D1 — id stability.** A committed golden of a fixture beat's minted ids. e4.
- **D2 — segmentation stability.** `tools/tests/segment.golden.mjs`, already
  running inside `npm run check` (#114). No unit may weaken it.
- **D3 — prompt byte-parity.** `tools/lib/{compose,calls}.mjs` mirror the proxy's
  renderer and `proxy/tests/prompt-parity.test.ts` holds them to byte identity.
  Any renderer change fails it. e5 and e10.
- **D4 — run-record reproducibility.** `drive-run.mjs --determinism-check` runs
  the whole pipeline twice in-process against the fixture provider and diffs the
  records; exit non-zero on any difference. This is the strongest gate in the
  run — it covers ids, ordering, composition, and archive keying at once. e9.
- **D5 — schema conformance.** Run record and meta-state validate against
  `data/runs/_schema/*.json`. e8 and e9.

## 6. Verification that is not a unit's own slice

- **Contract §8 criterion 1** — every slot in call contracts §6 has exactly one
  supplier — is a test, not a review item. It fails the moment §6 gains a slot
  nobody assigned.
- **The probe must keep passing.** See D3 — that test is the gate.
- **No unit may weaken `tsconfig.core.json`.** A DOM reference inside
  `engine`/`composer`/`shared` must fail the build, not be worked around. The
  file is frozen (§9); the guard test is the mechanical check.
- **No unit adds a dependency.** `package.json` is frozen (§9).

## 7. Known-open, and what to do about each

Do **not** resolve these inside a unit. Record what you hit in `DISCOVERY.md`.

- **Temperament prose shape** (contract-engine-composer §4.1) — S + D own it. e1
  builds to the four invariants with a provisional shape marked as such in the
  source; the first real rendering is a paper check, not a unit test.
- **`meta` event exact shape** — ratified as a channel, not as a payload. e8
  fixes it and the client absorbs it by revision.
- **Timeline caps (6 lines) and the retry budget** are provisional until the A4
  latency measurement, which needs a deployed proxy. Build them as constants in
  one place; do not scatter the number.
- **Where a production soft flag is recorded** — the run record has `fallbacks[]`
  for failures and a soft flag is not one. e9 may need a slot; raise it, do not
  invent one.
- **A wrong skeleton signature** (new in Rev 2) — `DISCOVERY.md` plus a `[STEER]`
  comment on the dashboard PR. The Lead decides; a unit does not edit e0's
  surface unilaterally (decision 14).

## 8. Out of scope, stated so it is not drifted into

The client view layer · AWS deploy and the first real Bedrock call · the suite
generator (stage 4) · the policy bot and `metric-report` aggregation (stage 6) ·
gate graph and routing beyond `edge_predicates` as specified · scenario content
of any kind.

**Stage 5 is in and stage 6 is out, and the boundary is clean**: e9 produces the
run record, which is exactly what stage 6 consumes. Stage 6 is three scripted
policies × N runs — a measurement program with a pre-registration, not a build,
and running it before a real model is answered would measure the fixture.

## 9. Harness configuration

The run's launch arguments, decided here rather than at the approval gate.

**Base:** `main`, after both prerequisites in §2a. **`git_mode`:** full.

**`build`:** `test: npm test` · `typecheck: npm run check` ·
`build: npm run build`. (`check` occupies the typecheck slot deliberately — it is
the isomorphism gate, and it is what must never go red.)

**`frozen_globs`** — rewrite-forbidden provided inputs. Extension by new file is
allowed; modification is hard-blocked by VERIFY's `git diff` guard and flagged by
Lead review:

```
src/client/**
src/shared/view-driver.ts
src/shared/segment.ts
src/shared/species.ts
tsconfig.core.json
tsconfig.test.json
package.json
proxy/**
tools/lib/compose.mjs
tools/lib/calls.mjs
tools/probe/**
data/scenario/**
data/policy/**
data/runs/_schema/**
docs/**
```

Two of these deserve their reason stated. `proxy/` and `tools/lib/` are frozen
because D3 holds them to byte identity — a unit that "fixes" a renderer breaks
the probe silently. `package.json` is frozen because a mid-run dependency change
moves the gate command out from under every unit built before it.

**`review_lens_scores`** — this build has no playable surface, so the game-feel
lens scores near zero and the panel should not spend a seat on it:

| lens | score | why |
|---|---|---|
| Correctness/Logic | 9 | ordering invariants, fallback grading |
| Domain-fidelity | 9 | contract §8's ten criteria, species derivation, id semantics |
| Data-integrity/Migrations | 8 | run-record and meta-state schemas, carried blocks across runs, sessionStorage |
| Testing-quality | 7 | the determinism gates are this deliverable's spine |
| Architecture/Maintainability | 5 | physical §3.1 already fixes the layout |
| API/Compat | 5 | the seam is ratified, not up for design |
| Reliability/Observability | 4 | delta journal exists; no production surface yet |
| Security/AppSec | 3 | no new network surface beyond the frozen proxy |
| UX/a11y · Game-feel/Juice | 1 | nothing in this diff renders |

Applying the panel rules (one per family, one baseline) yields **Correctness ×
Skeptical breaker · Domain-fidelity × Standards enforcer · Data-integrity ×
Operator advocate**.

**`models`:** `implement`/`verify`/`leadReview` stay opus on e2·e3·e4·e5·e7 —
the ordering and numeric semantics are where this build's real bugs will be.
e0·e1·e6 may run sonnet on `implement`. `setup`/`openPR`/`merge`/`steer` haiku;
`unitRespond`/`integFix`/`replan` sonnet.

**`fast_tail`:** `{ after_wave: 2, gates_off: true }` — waves 1–2 keep the
barrier (e0's skeleton must be merged before anything compiles against it, and
wave 2 is the wide one), and e7·e9·e10 flow as a dependency pipeline.

**`wave_gate`:** off. Five waves × up to ~100 minutes of fail-open waiting is a
large share of the run's budget spent on polling. Supervision goes through the
dashboard PR and `/super-steer` instead.

**`demo_publish`:** off — nothing in this diff renders, so the wave-boundary
build-and-screenshot step has nothing to show. **`ai_report`:** on (competition
deliverable #4).

**What replaces the demo screenshot.** The one thing a human needs to *look at*
here is the Korean prose the composed calls produce, and e9 emits exactly that: a
full run's feed lines in a run record. At the last wave, post that record's feed
to the dashboard PR as a comment. It is the text twin of the gameplay capture,
and it is the only review anyone can do of whether this thing reads well.
