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

The client build's version of this condition says "never touch `include`", which
was right for a build that adds no isomorphic folder. This one adds three
(`transport`, `driver`, `runloop` — physical §3.1, revised 08-03), and they are
**worthless outside the guard**: a DOM reference in the live driver has to fail
the build. Extending `include` is e0's job and nobody else's; removing an entry
is what stays forbidden.

## 2. Environment & gates

- Root Vite + tsc project. `npm run check` (tsc core + client + datapack drift)
  and `npm run build` must stay green at every unit boundary.
- Dev dependencies only, and only `vitest` if it is not already present from the
  client build. **Zero runtime dependencies** in `src/`.
- `proxy/` has its own install and its own gate: `cd proxy && npm run check`.
- Node ≥ 24 for anything under `tools/`; the Pages build stays on the pinned CI
  Node and must not require otherwise.

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

## 4. Work units

Dependencies are real; the waves at the end are illustrative.

| id | title | deps | verification (own slice) |
|---|---|---|---|
| **e0** | **extend `tsconfig.core.json`'s `include` with `src/transport`, `src/driver`, `src/runloop`** (physical §3.1) · `src/shared/` seam types: import `view-driver.ts` (client build owns the file — **consume, never edit**); `id.ts` — minting + parsing for the **five** minted channels (`f·b·n·q·u`); `t*` ids are inherited from `timeline.json`, never minted. **`segment.ts` and `species.ts` already exist** — consume them, do not rewrite | — | vitest: id round-trip against `SPECIES_OF`. The segmenter's golden already runs in `npm run check` |
| **e1** | `src/shared/temperament.ts` + `report-guidance.ts` — structured pack/policy → the prose the bare `{TEMPERAMENT}` / `{REPORT_GUIDANCE}` slots expect | — | vitest: the four §4 invariants (byte-identical across Calls 1·3 · non-empty · deterministic · renders its own header) |
| **e2** | `src/engine/` state core: variable init from bound meters · delta journal · `applyEffects` · symptom renderer (§2.3 in full, including the three hard errors) | e0 | vitest: §2.3 ordering, the `min`-descending first match, `(변화 없음)`, digit → throw |
| **e3** | `src/engine/` beat & round driver: beat schedule from `timeline.json` × gate clocks · §4.1 and §4.2 ordering · round boundaries per decision 10 · `gateView`/`beatView`/`roundView` | e2 | vitest: delta-before-predicate (§7-5) · effects-before-Call-2 · **no report for a pre-gate beat** · views are snapshots |
| **e4** | `src/engine/` feed + round assembler: `feed()` with minted ids per decision 6 · `EXPERIENCED` assembly · `inner_note` isolation | e0·e3 | vitest: contract §8 criteria 1·5·6·**8·9** as written |
| **e5** | `src/composer/`: the three builders · block-id resolution + canonical sort · proxy-owned slots never emitted | e1·e3 | vitest: contract §8 criteria 4·7·**10** (criterion 7 runs the payload through the proxy's own validators, offline; 10 is the same-set-same-bytes check) |
| **e6** | transport at `src/transport/` + a fixture provider: `POST /dday/call`, the §11 status/fallback mapping, `VITE_PROXY_BASE_URL` unset ⇒ degraded not crashed | e5 | vitest: every §11 status/code row maps to the right outcome; a 4xx never sets fallback |
| **e7** | live driver at `src/driver/`: binds engine + composer + transport, emits `ViewEvent`, consumes `MembraneOp` | e4·e5·e6 | vitest: one scripted round produces the ratified event order; ops round-trip |
| **e8** | `src/runloop/`: run counter · carried blocks · report archive · exposure depth · `meta` events · `sessionStorage` adapter behind an interface so headless can substitute | e7 | vitest: two runs, carry-over survives, archive grows, adapter swappable · **emitted meta-state validates against `data/runs/_schema/meta-state.schema.json`** |
| **e9** | `tools/driver/drive-run.mjs` → a full run headless on the same modules, writing a run record to `artifacts/runs/` per [contract-run-artifacts](./contract-run-artifacts.md) §1. **This closes pipeline stage 5** — the data track's consumption question ([handoffs/datapack](./handoffs/datapack.md) §4-5) has been open since 08-02 | e7·e8 | one full `우는다리` run against the fixture provider; record validates against `data/runs/_schema/run-record.schema.json` |
| **e10** | acceptance: contract §8's **ten** criteria as one suite + `npm run check`/`build` green + the probe's 44 and the proxy's 39 still passing | all | **full suite green — the only whole-suite gate** |

Waves: `[e0 ∥ e1] → [e2] → [e3] → [e4 ∥ e5] → [e6] → [e7] → [e8 ∥ e9] → [e10]`.

**All three run-artifact schemas already exist** (`data/runs/_schema/`), so e8
and e9 have machine-checkable targets rather than prose ones. Validate against
them; do not hand-roll a shape.

## 5. Verification that is not a unit's own slice

- **Contract §8 criterion 1** — every slot in call contracts §6 has exactly one
  supplier — is a test, not a review item. It fails the moment §6 gains a slot
  nobody assigned.
- **The probe must keep passing.** `tools/lib/{compose,calls}.mjs` mirror the
  proxy's renderer and `proxy/tests/prompt-parity.test.ts` holds them to byte
  identity. If a unit changes a renderer, that test is the gate.
- **No unit may weaken `tsconfig.core.json`.** A DOM reference inside
  `engine`/`composer`/`shared` must fail the build, not be worked around.

## 6. Known-open, and what to do about each

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

## 7. Out of scope, stated so it is not drifted into

The client view layer · AWS deploy and the first real Bedrock call · the suite
generator (stage 4) · the policy bot and `metric-report` aggregation (stage 6) ·
gate graph and routing beyond `edge_predicates` as specified · scenario content
of any kind.

**Stage 5 is in and stage 6 is out, and the boundary is clean**: e9 produces the
run record, which is exactly what stage 6 consumes. Stage 6 is three scripted
policies × N runs — a measurement program with a pre-registration, not a build,
and running it before a real model is answered would measure the fixture.
