# Handoff — Datapack (first real exchange across the track boundary)

> **Kind:** handoff, not a spec or a contract. It has a **lifetime**: it closes
> when pipeline §2 stage 5 closes, and then becomes a record.
> **This document is the data track's half.** The architecture track's half is
> consumption confirmation (suite generator · engine load) — §4 is that checklist.
> **Target pack:** `data/scenario/우는다리/` — lint ERROR 0, **G1–G7 hardened**
> (buckets · `predicted_shift` · beat rosters · event effects · symptoms). Every
> remaining FLAG hangs on a §4 vocabulary or state-model question.
> **Scenario selection:** 우는다리, fixed 08-01 (민서's decision).

## 1. Engine load — consumer and status, per file

| File | What the engine/composer reads | Status |
|---|---|---|
| `gates.json` | G1–G7: stance set · `default_stance` (call-failure fallback + probe prediction) · `predicted_shift` · buckets (deltas + **flags**) | ✅ All gates hardened. Call-facing gates (G1 · G4 · G7) carry trust/fear deltas; structural gates (G2 · G3 · G5 · G6) emit flags (§3-5). `edge_predicates` is an empty array — awaiting the routing vocabulary (§4-2) |
| `characters.json` | Meter **variable bindings**: c1 서지형 `trust` (initial 40) · `fear` (initial 55) | ✅ Matched to the provisional variable names in engine spec §1.1 — rebinding touches the overlay only. c2–c7 meters are unbound (§4-6) |
| `symptoms.json` | Symptom renderer lookup (engine spec §2.2 format) | ✅ Covers all 4 reachable (variable, direction) pairs plus `set` sentences for all 16 flags — coverage lint passing actively |
| `timeline.json` | Fixed-event rendering · exposure gating · `effects` · `present` | ✅ Beat rosters filled for all events (t1–t19). Effects: the 5 world-changing events (shredding t13 · detention t14 · arrest t16 · opening t17 · rupture t18) carry flags; the other 14 are explicitly no-effect (`{}` — as the draft's self-check 5 requires) |
| `temperament.json` | `TEMPERAMENT` for Calls 1 and 3 (same file) | ✅ |
| `meta.json` / `places.json` / `truths.json` / `score.json` | Clock · places · oracle metadata · terminal tally | ✅ (score `predicates` remains a hardening leftover) |

Every file is consumable as a parsed object — **the engine never reads a file**
(physical architecture §3.2). Loading belongs to `client` (fetch) and `tools`
(fs).

## 2. Suite generator — gate card → probe suite mapping

Human-verified against the G1 card. Every field the generator consumes exists:

| Suite slot / arm | Pack source |
|---|---|
| `GATE_QUESTION` | `gates[].question` |
| `STANCE_SET` (`{id, label}`) | Projection of `gates[].stances`, dropping `desc` |
| Baseline distribution prediction | `gates[].default_stance` + `predicted_shift` |
| Live injection arm | `gates[].key_examples` (≥2 per condition — guaranteed by lint E5) |
| Placebo arm (same axis, misdirected referent) | `gates[].false_leads` |
| `TIMELINE_EXCERPT` fixture | Events in `timeline.events` with `time ≤ gate clock` that are visible in one run under the exposure conditions — for G1 (09:25): t1 · t2 |
| Temperament fixture | `temperament.json` (the harness uses md fixtures, so the generator assembles prose: `default_disposition` + conditional clauses) |

## 3. Composer slots ⟷ pack — decided and discovered while checking against contract §6

1. **`FIXED_NPC_ACTION` := that beat's fixed event `text`** (binding decision).
   The contract's requirements — a sentence describing something as already
   having happened, demanding no reply from the controller (§6.1 is the
   authoring rule; `lint-beat` checks it) — are satisfied by the timeline event
   sentence as-is. No separate field is created.
2. **`PRESENT_NPCS` := `timeline.events[].present`** (added v0.3). `{char_id,
   side}` — `side` (line/room) is the only measure that drove speaker
   misassignment to zero, so it lives in the data. The hardening overlay fills
   it; lint checks the character references.
3. **Non-character speaker caution**: the caller in t6 (11:07, anonymous tip) is
   not a character and therefore not in `present` — contract §3's soft handling
   (drop speakers outside the roster) is the safety net, and the event text
   already carries the content of the tip.
4. **`REPORT_GUIDANCE` had no home.** The contract said only "a length and
   format policy in `data/`", and it is neither a datapack file (it is
   scenario-independent) nor any existing file. Resolved in §4-4.
5. **`flags` slot added to buckets** (datapack contract v0.4 decision). The
   outcome of a structural gate (G2 · G3 · G5 · G6) is world state, not the
   caller's meters — they emit flags like `logs_saved`, `originals_read`,
   `entry_capped`, using the same boolean model as timeline `effects.flags`.
   Conditional outcomes (G6's cancel holding only when `logs_saved` is set) are
   **not** encoded in buckets — that resolution belongs to edge predicates and
   the engine.

## 4. Checklist — updated with the 08-02 reply (#102)

1. ~~Confirm the shape of `timeline.events[].effects`~~ **✅ Approved.** Engine
   spec §1.2 gained an actuator → data-location table, and §4.2 fixed the
   application order: effects → journal → symptoms → Call 2.
   **One follow-up:** the reply narrowed §1.1's flag write to script events only,
   on the premise that buckets had no `flags` slot — but v0.4 created that slot
   the same day (§3-5). Whether to re-widen §1.1 is 윤석's call. The minimal
   engine is unaffected (G1's buckets emit no flags).
2. ~~Routing vocabulary~~ **✅ Answered.** Engine spec §4.3 added: one predicate
   per line, `<variable> <comparison> <integer> -> <node>`, 5 comparisons, flags
   as `== true`, a mandatory final `else`, first-true top-to-bottom, and **an
   empty array is valid and means end-of-run** (so G1 can enter the engine empty).
   The syntax is provisional — **authoring `edge_predicates` opens only once node
   names arrive with the gate graph.** Whether score `predicates` and promoted
   exposure conditions use the same language is undecided.
3. ~~`datapack.ts` = a transcription of `_schema/`~~ **✅ Accepted → resolved
   (08-02).** The drift guard was solved by generation:
   `generate-datapack-types.mjs` emits `datapack.ts` from `_schema/`, and
   `--check` exits 1 on drift. The "known gap" in physical architecture §3.1 is
   closed; `npm run check` passes.
4. ~~Home for `REPORT_GUIDANCE`~~ **✅ Agreed → authored (08-02)** —
   `data/policy/report-guidance.json` v0 (facts ≤ 8 single-sentence items ·
   `report_body` 300–1200 characters of markdown · a judgment-marker policy that
   protects the 자기서술 vein). Values to be tuned after measurement.
5. **Consumption confirmation, execution (OPEN):** does the suite generator eat
   the G1 card, and does the engine load this pack and complete engine spec §7
   criterion 1 (one full round)? **Stage 5 closes when both pass.**
6. **Variable binding for c2–c7 meters (OPEN):** engine spec §1.1's state model is
   provisionally trust/fear only, so NPC meters were left unbound (12 FLAGs).
   This is a decision: widen the state model, or spec it out of v0. (The reply
   was written before the v0.4 commit and did not see this item.)

**One revision request received — handled:** deltas are non-zero integers
(engine spec §1.3 · §6-3). The schema was tightened to `integer` and lint E8 was
added (including the zero ban). Consistent with engine spec §2.3-1's decision
that `magnitude 0` drops out of rendering.
