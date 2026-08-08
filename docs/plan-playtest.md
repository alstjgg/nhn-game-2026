# plan-playtest — 2026-08-05 playtest triage

> Source: 민서 playtest of the deployed Pages build (live proxy, 우는다리).
> Priority tiebreaker: **mechanism legibility** — the C-BLOCK loop (block choice →
> interpretation shift → stance change → visible result) must read clearly.
> Cut line against the ~08-10 deadline is §4. Rules live in /CLAUDE.md; state in status.md.
> Items marked **landed** are already on `main`; the citation is what to read, not what to do.
> Every remaining coordinate was re-audited 2026-08-08 against `fa49be6`, after
> waves 1–5 and the door merged. §§1–3 are grouped by **dependency and file
> collision**, not priority — priority lives only in §4.

## 0. Frame

A run is one whole day. The phase cycle is `RunPhase` at
`src/client/shell/run-state.ts:23` (`build | run | report | tally`), moved by the
reducer at `:98-141`; `:68-69` warns that the demo fixture's `round = run` is a
property of that fixture and not of the seam. Gates are beats inside a run;
reports are per round.

The day's bounds are authored at `data/scenario/우는다리/meta.json` (`clock.start`
`08:50`, `clock.end` `21:04+`) and read by `src/client/shell/pack.ts:26-32`, which
strips the `+`. The DEV fixture repeats them at
`src/client/driver/fixtures/woodari-run03.ts:223-224`, but the deployed build
never loads it — `src/client/driver/run-loop.ts:176-177` returns `null`
outside `import.meta.env.DEV`. **Editing the fixture changes nothing on the
played site.**

The client's `RUN nn` labels contradict the frame and are corrected in G3.

Gate structure must not reach the player. `docs/spec-client.md:113-115` carries
this as review-blocking **invariant 6** in §3, and the 08-03 decision log binds it
for the archive. §1.G items are defects against that rule, not feature requests —
and the surface includes anything fetchable from the deployed site, not only what
is drawn.

## 1. Items

### Landed — waves 1–5 and the door, all on `main` (`fa49be6`)

| id | item | landed |
|---|---|---|
| G1a·b·c | pack and gate-vocab leaks closed; guarded | `e270604` · `tests/scaffold/no-gate-vocab.test.ts` |
| G2 | fallback lines speak the transmission register | #156 |
| G4 | 행동 원칙 reads as a person | #159 |
| C2·C3·C4 | 인수인계 사항 · 교신 지침 · 현장 기록 / 무전 기록 | #164 |
| M1 | callsign per sitting — `callsignOf(run)`, `dossier.ts:19-21` | #166 |
| M2 | species tags off the display. **Display only:** `SPECIES_DISPLAY` itself survives at `block-card.ts:33` and is asserted by `agent-file.test.ts:611-617` | #162 |
| T2 | report `max_chars` → 100–350자 | #158 · #172 |
| U1 | reveal queue, delay priced by line length (`run-feed.ts` dials) | #169 · #171 |
| U3 | TALLY dissolved — 시행 결과 into 현장 기록, NEW RUN into DEPLOY | #174 |
| U5.2a | slotted highlight renders | `afe02d6` |
| U5.2b | `report` event carries the judged stance's `desc` (`view-driver.ts:29-30`) | #160 |
| O1 | the door — sign-in · terminal manual · desk reveal | #175 |
| — | riders: reporter v0.3 radio voice, facts ≤ 3 (#173) · beat-line stamp spread + 9 s report hold (#174) | |

### Also landed since that audit — wave A and the B′ units

| id | item | landed |
|---|---|---|
| U5.2b+ | `judged` carries `cited_ids`, filtered to deployed (`view-driver.ts:30`) | `bf5b6c2` |
| T1 | BLOCK STORE dissolved; `windows/` is three files | #18x |
| G3 | the rail says ECHO-n — `report-archive.ts:58` is `callsignOf(entry.run)` | #18x |
| O3 | radio SFX, and the 34-cue audio layer beside it (`plan-audio.md`) | #179 |
| W1·W3 | sitting stamp on resume · mining is one gesture | B′-1 |
| W2 | one sitting is one accumulating record | #190 |
| W4 | one DEPLOY, phase-gated; the transport row retired | #191 |
| hotfix | one click mines AND seats · 과거 배치 · the slot card is the sentence | #189 |

**Two live-path regressions came out of W4 and W1, and the browser suite cannot
see either** — `e2e/` drives the DEV fixture loop, and the fixture keeps one flat
store across runs where the live path rebuilds per day. Both are wave g12 (§3).

### Remaining — re-audited 2026-08-08

Ordered by lane (§2), not priority. Each block is a PRD's raw material.
**U5.2b+, T1, G3 and O3 below are landed** (table above); their text is kept as
the record of what was specified. T3 is landed except its prose (g12-4). O2 and
U5.1 are cut — see §4.

**U5.2b+ — the seam carries the citation (new unit, small).** U5.2c's "beside
the sentence that moved it" has **no data source today**: `judged` is
`{stance_id, desc}` only (`view-driver.ts:30`), and `because_block_ids` — a
required field of the live judgment response (`contracts.ts:118`; the proxy
schema enforces it, `proxy/src/calls.ts:94,111,131`; the fixture transport fills
it with all slotted ids, `transport/fixture.ts:39`) — dies at
`engine/index.ts:336-337`, where `submitStance` returns only `{stance_id, desc}`.
The unit widens the `submitStance` return and `judged` with
`because_ids: string[]`: `engine/index.ts:152,318,336-337` ·
`src/driver/ports.ts:56-58` · `src/driver/live-driver.ts:149,185,208` (parks
per-round, replays at round end) · `view-driver.ts:29-30` ·
`tests/driver/engine-judged-stance.test.ts:13`. No client fixture emits `judged`
at all (grep-verified) — whether `woodari-reports.ts` gains it here or in U5.2c
is the PRD's to decide.

**U5.2c — render the cause.** No client code reads `judged` (grep-verified);
`windows/reports.ts:195` rebuilds the report model field-by-field and drops it —
that line is where the work starts. Corrected paths: the view is
`components/report-view.ts` (**not** `windows/`) — `ReportModel :24`,
`RenderOptions :86-95` (`replay? :94`), `render() :244-271` (facts `:254`, body
`:263`). First-arrival is decided at `reports.ts:113-130` (`replayed :122`,
`drawDocument :124-130`); `createReportView` sits at `:102-111`. Marks:
`minable-sentence.ts:20` (`MinableState`), `:23-26` (`MarkSets`, two
`ReadonlySet<string>`), `sentenceState :71`, `sentenceClass :78`,
`sentenceNode :121`, `applyState :129` — "unused" is a new state beside these.
CSS lands beside `.min.slotted` at `win-reports.css:75-77` (`.min.mined`
`:71-74`, `tearFlash` `:78-80`). Use `desc`, never `label` — `매뉴얼 → 경청`
transmits nothing. Unused = slotted-but-not-cited, from `judged.because_ids`
against the round's slotted set — this is how a false lead surfaces without the
game saying "wrong". The false leads that ship are `gates.json`
`gates[].false_leads` — one string per gate, **7 total in aggregate**.
Guards this unit and O2 must both satisfy: `reports.test.ts:583` (seam types
come through the driver barrel, never `shared/view-driver`) and `:594-595`
(no `.style.` writes, no px/rem literals in TS — all motion is class+keyframe).

**O2 — first-mining pulse.** Still gated on the opening/manual conversation
closing (`g2-3` stamps then). The hook already exists: `reports.ts:122-130`
decides first arrival, `run` is tracked at `:88`/`:174`, and `run === 1` is a
refresh-stable predicate (run-state persists `meta` per tab) — no new
persistence. The pulse is a CSS class + keyframe (the `:594-595` guard; the only
existing `pulse` keyframes are unrelated shell/signin ones). **Shares five files
with U5.2c and U5.1** — `reports.ts` · `report-view.ts` · `minable-sentence.ts`
· `win-reports.css` · both reports test files — and the same regions
(`RenderOptions`, `drawDocument`), so it is never in their wave.

**T1 — BLOCK STORE dissolves into the report.** Deletes:
`windows/block-store.ts` (242 lines; the one function that moves is the
`carried` axis — `:47,:58-59,:72-77,:101,:217`), `components/species-filter.ts`
(block-store is its **only** importer, `block-store.ts:29-30` — fully dead
after), `styles/win-block-store.css`, `tests/windows/block-store.test.ts`,
`e2e/block-store.spec.ts`. Edits: `window-registry.ts:12,:39` (header `:3`'s
only-importer claim re-verified; `:4` still lists five units — fix in step),
`layout.ts:33,:50,:97`, `index.css:15`, `manual.ts:45` (names 보관함 — minimal
cut here; the full rewrite is MAN), and `windows/reports.ts` absorbs the carried
view (the archive rail already persists marks — `spec-client.md:152`). Test
blast radius, enumerated: `agent-file.test.ts:39,:730` — **the direct blocker**,
an untouched-file guard on `block-store.ts` that fails on deletion until the
commit empties it (§5.4) — `tests/shell/shell-utils.ts:26`,
`window-registry.test.ts:97` (both lists shrink together),
`tests/styles/css-utils.ts:22`, `stacking-context.test.ts:4-5,:146,:158`,
`tests/assets/baseline/u1-styles-baseline.json:10,:20`,
`e2e/shell.spec.ts:31,:219,:232,:542-571,:735`, `e2e/captures.spec.ts:115`
(+ its reference shot), and **the two ≥4-distinct-origins floors —
`tests/shell/apply-layout.test.ts:104` and `e2e/shell.spec.ts:360` — drop to 3
here, or T3's three-window desk fails them later.** Negative guards that merely
name block-store stay green: `live-feed.test.ts:450`, `reports.test.ts:605`,
`tally.test.ts:697`. `block-card.ts` survives untouched (see M2 in the landed
table).

**T3 — the three-window desk.** `layout.ts` only: rects `:80-99`, ratios
`:66-76`, and `DESK_ORDER :50` **moves with the rects** — the focus-order
quarantine is **lifted** (`e2e/a11y.spec.ts:534-561`; the live assert `:560`
compares tab order to rects row-major, 24 px row tolerance), so a mismatch is a
real red now, and `layout.ts:47`'s "quarantined" wording is stale. The file
header `:1-31` still tells the TALLY story and `:41` still seats BLOCK STORE —
rewrite them with the rects, and sweep the two other stale 21:04-TALLY comments
(`run-state.ts:4`, `layout.ts:26`). `window-manager.ts` reads both exports
generically (`:16,:231`) — no change.

**G3 — the rail stops saying RUN nn.** `report-archive.ts` coordinates all
hold: `ArchiveSegment.runLabel :25`, `OWN_PREFIX :31`, `REFUSED :34` (a deny
list — `ECHO-n` passes, and it is what keeps invariant 6), `RAIL_LABEL :37`,
`RAIL_NOTE :40`, `runLabelOf :43-45`, build site `:61-62`, render site `:152`,
header prose `:3-5`. The core swap is `runLabelOf` → `callsignOf(entry.run)`
(`dossier.ts:19-21`; the file currently imports only `el`, so it is one import).
Sites beyond the archive, corrected after U3/M1: `announcer.ts:26`
(`RUN_OPENED`), `run-counter.ts:27`, `deploy-button.ts:91` (**moved from
`:51`**; doc comment now `:48`), `agent-file.ts:40` (`RUN_CAPTION`, **new after
U3**, consumed `:204-:250`), `run-feed.ts:157` (`RUN_PREFIX`, **new**, painted
`:282`), and the fixture minters `woodari-meta.ts:24-25` ·
`fixtures/run-loop.ts:82-84` (`boot-run.ts:23-24` is comment-only). The PRD
decides which sites rename and which keep — the run-counter's `RUN 03/10`
allotment is D-DAY frame and arguably stays. Rail assertions live in **four
files, not seven**: `reports.test.ts:441-465,:484` (+ its local mirror
`:93-99`), `meta-and-archive.test.ts:17,:79`, `e2e/reports.spec.ts:141`
(digit-parse — survives `ECHO-n` as-is), with selector constants untouched
(`e2e/run-loop.spec.ts:44`, `e2e/fixtures/selectors.ts:65-66`). Spec:
`spec-client.md:113-115` — **invariant 6's own text cites `RUN 01 /…`, so it is
amended with the rename or the spec contradicts the rail** — plus `:152` and
`:305` (**not `:302`**). Non-rail `RUN nn` asserts (deploy stamp
`agent-file.test.ts:597-604`, run-counter `e2e/shell.spec.ts:449,:474`,
`preview-smoke.spec.ts:175`, synthetic fixtures in `tally.test.ts`) are
enumerated in Scope as touched-or-not.

**U5.1 — the archive becomes sittings; needs a new store.** Corrected path: the
append site is `src/runloop/run-loop.ts:118-121` (**not the client driver**),
surfaced as `archive` at `:131`; that module's own comment `:70-88` already
records why the schema cannot widen ("the ratified shape has nowhere to put a
number … not this module's to make"). `meta-state.ts:22,:59,:70,:96-97`;
`data/runs/_schema/meta-state.schema.json:32-36` under `:8`
`additionalProperties: false`; widening `MetaState` breaks **three** assertions
(`meta-schema.test.ts:70,:80,:88-89,:111`), and four more runloop suites read
`report_archive` (carry-over · store · meta-event · state-isolation). Shares
`report-archive.ts` — the same five symbols — with G3, and
`reports.ts`/`report-view.ts` with U5.2c/O2: strictly after both merge.

**O3 — three or four sounds.** Greenfield: zero audio code in `src/`
(grep-verified), so the play sites are decisions, audited here: **LOGIN** —
`sign-in.ts:223` (`is-auth`) with the readout ladder `:110-124`
(`STEP_MS = 190` at `:25`, runway `:224`); **hand-over** — `boot.ts:232-239`
(`await door; await openManual(…)` then `revealDesk`); **day-end** —
`agent-file.ts:232-234`, the ported `'tally'`-phase subscriber, fires once per
day close. Deploy's `'settling'` is *derived* (`deploy-button.ts:83`, a pure
view) — the wrong place; and a second `announce()` in the day-end tick clobbers
the live region (`agent-file.ts:238-241`) — a sound is safe there, an announce
is not. Every file gets its `assets-manifest.json` entry — generated
`{file, tool, prompt, license}`, sourced `{file, source, license, note}`; `file`
may be a directory (see the font entries `:178-183`). **Guard gap to close in
the same unit:** `no-third-party-url.test.ts:41`'s `TEXT_EXT` never opens audio
— today nothing forces audio self-hosted and nothing proves it ships (compare
the font positive assert `:98-102`).

**MAN — the manual's §1–§4 content (the opening/tutorial conversation).**
`manual.ts:25-64` is the whole surface — the header `:16-24` says "replace this
object wholesale"; `clauses()` iterates `sections`, so the section *count* is
free but the `{head, body}` keys are not; deleting `chop: '초안'` removes the
draft stamp. No test asserts the copy (grep-verified; only
`fonts-css.test.ts:180` names the two sheets) — the swap is unguarded both ways.
**Two placeholder bodies are already false**: `:46` "집계(TALLY)는 21:04에
열립니다" and `:57` "…집계가 열리고" describe the window U3 deleted. The content
teaches 책상 구성, so it lands after T1 (hard — 보관함 must not be taught) and
prefers T3 (soft — prose can avoid naming positions); what §3–§4 teach is the
C-BLOCK loop, the tiebreaker this document ranks by.

### Deferred (Won't — §4)

- **U2** (slot cap 4 → more): the mechanism risk stands — C-BLOCK was measured
  with **one** injected sentence (9/10 stance shift, one-sided Fisher
  p=0.0000595); raising the cap without a probe risks the claim days before
  submission. Pinned by `block-store.test.ts:366` (`SLOT_CAP` — note this file
  is deleted by T1, so the pin moves), `agent-file.test.ts:734-740`, and the
  `slot-board.ts` empty-diff guard.
- **C1** (paged dossier) → **U5.3** (a page per ECHO-n): the next step after
  the cut, not a cut casualty. `dossier.ts:85-120` is the section array; its
  coordinates get re-audited when picked up.
- **U4** resolved into O1 (landed) and O2.

## 1.5 The prerequisite — mostly landed

The predicate work `status.md` named on 08-05 is **three-quarters done**, and this
document's earlier dependency on it was stale:

- `data/scenario/우는다리/score.json` — **9 units, all 9 carrying predicates**
- `src/driver/scorer.ts:136` — `createScorer` returns a live `ScorerPort`
- both roots wired — `src/client/driver/live/bind.ts:84`, `tools/driver/run/bind.mjs:125`
- **still open:** meter binding — `characters.json` c2–c7, 12 of 14
  `meters[].variable` are `null` (as of the 08-06 audit; not re-checked 08-08)

U3 landed on it (#174); U5.2c is not gated on it.

What remains true is the grammar. A gate's key condition is a five-field record
(`src/shared/datapack.ts:153-158`: `id`, `axis`, `referent`, `species`,
`targets_clause`), authored at `gates.json` `gates[].key_conditions[]` — 9 of them
across 7 gates. `Sentence` is `{ id, text, species, axis? }`
(`src/shared/view-driver.ts:18`) — `axis` is **optional**, and there is **no
`referent`**. So matching a sentence to what it is *for* needs a referent the wire
does not carry. (Not to be confused with `because_referent`,
`src/shared/contracts.ts:113` — the judgment call's field, which is what a grep
for "referent" finds first.)

Across `gates.json` there are exactly two axes — **두려움** (×5) and **지워짐** (×4),
and `temperament.json` carries the same two. The whole scenario reduces to *who is
afraid, and what is being erased*. No surface teaches this; U5.2c and AGENT FILE §4
are where it would show.

## 2. Dependency order

Two kinds of edges. A **logic edge** (`──►`) is a real dependency: the later
unit's shape depends on what the earlier one landed. A **file edge** (`⇢`) is a
collision: the units are logically independent but touch the same files, so
§5.6's wave-parallel rule (pairwise-disjoint files) forbids sharing a wave, and
merge order becomes the dependency.

```
U5.2b+ ──► U5.2c ──┬──► O2      (O2 also waits on the MAN conversation closing)
                   └──► U5.1 ◄── G3
T1 ──► T3 ──► MAN (hard on T1, soft on T3)
O3      ← free-standing
```

File edges:

- **T1 ⇢ U5.2c** — both touch `windows/reports.ts`. T1 first: the carried view
  must exist before the render unit repaints the document.
- **G3 ⇢ U5.2c** — shared only in `tests/windows/reports.test.ts`; either order
  works, G3-first spares U5.2c a rebase.
- **U5.2c ⇢ O2 ⇢ U5.1** (pairwise) — all three live in the same six files.

**The REPORTS window is the convergence point.** `windows/reports.ts` ·
`components/report-view.ts` · `components/minable-sentence.ts` ·
`styles/win-reports.css` · `tests/windows/reports.test.ts` ·
`e2e/reports.spec.ts` are touched by U5.2c, O2 and U5.1 alike (and grazed by T1
and G3). That set is the serial spine; everything else parallelizes around it.

## 3. Waves

Grouped by file-disjointness, not priority — each wave's units run
concurrently, one worktree each (§5.6), merges serial within the wave.

1. **Wave A — four worktrees, all fireable now, pairwise disjoint:**
   **U5.2b+** (engine/driver/seam) · **T1** (client desk teardown) · **G3**
   (archive labels + spec) · **O3** (audio + manifest + guard). The MAN
   *conversation* runs alongside as a human thread; its unit waits for T1.
2. **Wave B — after A merges:** **U5.2c** (REPORTS render; re-authored on A's
   output, per §5.6) · **T3** (`layout.ts` only). Disjoint from each other.
3. **Wave C — after B:** **U5.1** · **MAN** (`manual.ts` only). Disjoint. If
   the opening conversation has closed, **O2** may take U5.1's slot — O2 and
   U5.1 collide, so one of them slips to wave D.
4. **Wave D:** whichever of O2 / U5.1 waited.

**Wave B′ (08-08, second playtest — supersedes waves B–D until it lands).**
민서's post-wave-A playtest reframed the loop: the day runs hands-off; at
close the player reads the sitting's ONE accumulated record, mines from it,
rebuilds the file, and DEPLOY starts the next day. Four root-cause scouts
mapped it (their reports are in the PR thread); the units:

1. **B′-1 — parallel, fired:** `g8-1/W1` (sessionStorage resume gains a build
   stamp — the ECHO-2 boot was a stale-tab resume; `store.ts`, `live/index.ts`,
   boot, vite define) · `g9-1/W3` (mining is one gesture — a second activation
   auto-seats via `board.place()`, refusals flash instead of vanishing, the
   two BLOCK-STORE-era hints rewritten).
2. **B′-2 — `W2`, after B′-1:** one sitting = one record. `reports.ts` keys
   documents by RUN and APPENDS rounds (the `report` event carries no run id —
   the window pairs it with the current `meta.run`); `railEntries`'s
   run/round keyspace collision dies; past sittings render read-only (their
   sentences are not in the current run's block store — presenting them as
   mineable was playtest bug #4's silent half); the terminal record files
   into its sitting's document; the feed gains a per-sitting `mark` divider.
3. **B′-3 — `W4`, after B′-2:** one DEPLOY, phase-gated. Disabled while the
   day runs (mining and file edits locked with it); enabled at close;
   clicking commits the file and opens the next day — the op pair is
   `deploy` into the OLD membrane (it becomes `carried`) then `new_run`,
   with the rebuild re-arming the carried set as the new run's deployed
   blocks in BOTH driver paths (the adapter clears `deployed` today, and the
   fixture `carry()` replays mine/slot but not deploy). Day 1 auto-starts
   (the button is born disabled): judges see motion inside the 60s budget,
   and ECHO-1 going in with an empty file is the fiction.

U5.2c re-authors after B′ lands (it renders into W2's per-sitting document).
T3 is unchanged by B′ and may ride either gap. O2/U5.1/MAN unchanged.

**Wave g12 (08-08, third playtest) — four units, one PR, all four parallel.**
민서's post-B′ session found two live-path regressions and one readability
defect. The units are pairwise file-disjoint, so all four develop concurrently
in their own worktrees and merge serially into one wave branch; the PRDs ride
the same PR as the code (the convention changed at #190 — docs and their code
travel together).

1. **H1** (`g12-1`, `live/adapter.ts`) — the committed agent file is replayed
   into the new day's **membrane**, not just its view mirror. `createMembrane`
   is per bound run, so W4's direct assignment left the opened day with an
   empty seat map: `unslot` answered `empty_slot` (a carried sentence could
   never be released, which dead-ends the loop once all four seats are full)
   and `membrane.deployed()` — what `composer.judgment` carries into Call 1 —
   was empty, so **every day after the first flew a file the model never
   received**. The carry also keeps the operator's seat numbers now instead of
   re-indexing the sorted carry list from 0.
2. **H2** (`g12-2`, `run-state.ts` · `live/index.ts` · `runloop/store.ts` ·
   `boot.ts`) — a page load starts a new sitting. The resume restored a
   sitting's identities and could not restore its report documents, which are
   persisted nowhere, so a refresh returned ECHO-n with n empty rail tabs.
   `spec-client` §7 #8 is amended with it; the audio mute key is not cleared.
3. **R1** (`g12-3`, `report-view.ts`) — one sitting's rounds break a line
   instead of running together. `ReportModel` records which ids open a round,
   so the break survives a redraw rather than living only in the append path.
4. **T3-prose** (`g12-4`, comments only) — what survived T1 (below).

MAN is held at 민서's word until after this wave. U5.2c follows as its own PR.

Two Shoulds (G3, O3) ride wave A in Must time — that is the point of grouping
by dependency: they are free parallel capacity on files nothing else wants, not
queue-jumpers. The Must line's serial spine (U5.2b+ → U5.2c; T1 → MAN) is
unaffected by them.

## 4. Cut line (~08-10; the deployed build stays green)

Everything in the old Must except two units is landed (§1's table). What
remains:

**Must:** U5.2b+ + U5.2c · T1 · MAN.

U5.2b+/c is the only place cause becomes visible — the tiebreaker this document
ranks by, and the last Must that changes what the game *says*. T1 is the last
Must that changes what the desk *is*. MAN is the opening/tutorial conversation
민서 wanted, now held against a live screen — the placeholder manual must not
ship to judges, and two of its placeholder lines are already false (§1 MAN).
The door itself landed (#175): e2e lanes skip it via `navigator.webdriver`,
`?signin=show` forces, `?signin=skip` bypasses; the membrane holds at the door
(the fields are spans).

**Should:** T3 (prose only — `g12-4`). G3 and O3 landed.

**Cut 08-08, at 민서's word:**

- **O2** (first-mining pulse) — dropped outright, not deferred. It shared all six
  REPORTS files with U5.2c and would have cost a serial wave to buy one debut
  animation; `g2-3`'s PRD is kept as the record of what was specified.
- **U5.1** (the archive becomes sittings) — down to Won't. Its player-visible
  outcome landed in **W2**, which re-keyed the client's rail by sitting and
  killed the run/round keyspace collision. What remained was widening
  `MetaState.report_archive` in the headless `src/runloop/` — a ratified JSON
  schema, three assertions and four suites of churn for something no judge can
  see, two days from the deadline.

T3 completes what T1 starts and is one file. G3 and O3 are wave-A free capacity
(§3). U5.1 stays down from Must: it needs a new persistence store, and M1 —
distinct callsigns per sitting, landed — carries most of the value it was
wanted for. O2 waits on the MAN conversation (`g2-3` stamps when it closes).

**Won't:** C1 · U5.3 · U2 (§1 Deferred — U5.3 is the next step rather than a
cut; U2 risks the mechanism claim without a probe).

## 5. Execution — authoring mini-PRDs for low-cost executors

> As of 2026-08-08 (v14). A PRD names the version it was written against.

The items above are not worked by hand and not worked one at a time. Each is
specified as a **mini-PRD** by a high-capability model, then executed by a
sub-agent on a low-cost model. The specification carries the expertise; the
executor supplies only mechanical edits. Everything here is a rule for the author
of the PRD, not for the executor — with one exception, §5.7, which the author
copies into every PRD.

**Maintaining this section is part of the job.** A high-capability model reading
this document — for any reason — revises §5 when it finds a rule that misfires, a
trap that is missing, or a template field that executors keep filling wrongly, and
bumps the version line. §5 is the only part of this document expected to change
without a playtest behind it.

### 5.1 The division

The author decides. The executor types. Every decision an executor would
otherwise have to make is a decision the PRD failed to make, and a low-cost model
resolves such gaps by inventing something plausible and consistent with nothing.

Author-owned, always resolved before handoff: which files change · the exact final
strings · naming · whether a test is updated or left alone · what counts as done.
Executor-owned: nothing but the edit and running the checks.

The division holds only while the PRD is right. Half the coordinates in this
document carried a defect before the audit, every one of them written
deliberately, so a wrong PRD is the expected case and not the exceptional one.
What follows from that is not that the executor gets discretion back:
**where the PRD does not match the tree, the executor stops.** Stopping is not a
decision, so the division stands — the author decides everything, and where the
author decided wrongly the executor notices and reports rather than repairs.
§5.7 is the block that says so.

### 5.2 Unit sizing

One PRD is one concern, one branch, and a diff a reviewer reads in a sitting.
Split anything that crosses a boundary between authored data, engine, and client —
U5.2b/U5.2c above is exactly that split — and U5.2b+ repeats it. The waves in
§3 are the intended firing order; a unit never spans two lanes of §2.

Do not hand an executor a unit whose first step is a search. If the PRD cannot
name the file, the PRD is not finished.

### 5.3 What the PRD must contain

```
# <unit id> — <one-line outcome>

## Outcome
One paragraph. What is true when this is done, in player-visible terms.

## Scope
Files this unit may modify — exact paths.
Files this unit must NOT modify, with the reason.
The test files this unit will turn red, and whether each is amended.

## Change list
Per edit: path:line · the exact current text · the exact replacement text.
Verbatim, not described. No regex, no "and similar occurrences".

## Invariants
The rules this unit could break without noticing (§5.4).

## Verification
Commands to run, and the expected result of each.
Observable checks a human repeats in the browser.

## Done when
A checklist of binary conditions. No judgment words.
At least one is behavioural — something the running game does, not an edit made.

## If this PRD is wrong
§5.7, verbatim.
```

Rules for the change list:

- **Open the file and confirm the line does what the citation claims.** A line
  containing the string is not necessarily the line that renders it; a doc comment
  above a function is not the function; a test's name is not its assertion.
- **Follow the value to where it dies.** A field authored in the pack may be
  dropped at a compile step and never reach the client — `stances[].desc` is, at
  `schedule.ts:109`. "It exists on disk" is not "an executor can use it".
- **Ask whether the file runs in the deployed build.** DEV-only fixtures typecheck
  and change nothing on the played site.
- State the replacement text in full, including Korean copy; an executor asked to
  "rename appropriately" invents a register that does not match the fiction.
- Enumerate every site. Accessibility duplicates, DEV fixtures and test literals
  all carry copies of UI strings.
- Where the change is a deletion, say what replaces it, including "nothing".
- **Cite a multi-line block by its first line.** Two PRDs cited a block by its
  last line; under §5.7 the executor then stops at the first edit, having done
  nothing. First line, always. (v8 — #152/#153 review.)
- **Scope a Done-when grep to the unit's files.** A repo-wide grep meets
  grandfathered sites and test comments — `published-data.test.ts:144` carries
  `객관 로그` in a comment forever — and then a binary condition can never go
  true. (v8.)
- **Every line number cites the stamped tree, and same-file edits are listed
  bottom-up.** An earlier edit in the same file moves every line below it; a
  citation read off a mid-application tree is wrong for the executor, who
  checks against the un-edited file. Bottom-up ordering keeps every row's
  line true at its turn; where the order must be top-down, the row says so
  and states the drift. (v10 — g1-2's E5 cited `:401` from a scratch tree
  where two earlier edits had already landed; the executor correctly stopped
  at `:399`.)

### 5.4 Repo traps to name in the PRD that touches them

- **Structure tests assert against the working tree, not file history.**
  `tests/windows/block-store.test.ts:561-567` requires `git diff -U0 HEAD --
  block-card.ts` to contain no `-` lines. Two siblings are a *different* shape —
  `agent-file.test.ts:723,729` and `block-store.test.ts:557-559` assert
  `git diff --name-only HEAD -- <file>` is **empty**, so they fail on any edit at
  all (`block-store.test.ts:557` guards `slot-board.ts`, which C2 and U2 both
  touch). **All of them are emptied by committing**, so only *uncommitted* work is
  caught. A PRD for deletion- or rename-shaped work must decide whether the
  assertion is amended, and fix whether verification runs before or after the
  commit.
- **A merge can commit a file nobody edited.** Anything untracked in the working
  tree when a conflict is resolved is swept into the merge commit — two scenario
  drafts reached this branch that way and left again in `e68d09d`. An executor
  resolving a merge stages by path and never `git add -A`; `git rm --cached` is
  the repair, taking the file off the branch while leaving it on disk. It pairs
  badly with the trap above: committing is what empties those assertions, so a
  merge commit can both hide an edit and add a file in one step.
- **`report-archive.ts`'s label guard is a deny list, and is not the thing to
  change.** `REFUSED = /gate|게이트/i` (`:34`) refuses gate vocabulary only —
  `ECHO-n` passes — and it is what keeps invariant 6. The on-screen label comes
  from `runLabelOf()` (`:43-45`), built from the run number and ignoring the label
  entirely.
- **A test can cover a branch the app cannot reach.** `tests/windows/reports.test.ts:264-278`
  seated a sentence that was slotted but not mined, which the engine forbids, so a
  dead CSS rule stayed green for weeks. When a PRD claims a state renders, it names
  the path that produces it.
- **A queue in the adapter halts the run.** `adapter.ts:194-196` `kick()` returns
  early while `pending` is non-empty; anything held there stops the engine
  stepping. Presentation pacing belongs downstream of `fanout`.
- **Layout is TypeScript, not CSS** (`layout.ts:65-111`), and `DESK_ORDER`
  (`:50`) must move with the rects or focus order regresses (WCAG 2.4.3).
- **`window-registry.ts` is the only module that imports `windows/`.** Removing a
  window means removing its registry row, or it still mounts.
- **Species derives from the id channel, never from classification**
  (`docs/spec-client.md` §5.2). The field is data; only its display is cosmetic.
- **The scenario is replaceable; the client must not learn 우는다리.** The game
  has to keep running when `write-scenario` produces a different pack. Scenario
  content reaches code only as data: clocks from `meta.json` through `pack.ts`,
  stance prose and false leads from the pack through the seam, score labels from
  the `score` event's rows. Frame copy (요원 · 무전 · 상황실 · ECHO-n) is
  game-owned and fine. Scenario literals already in the tree are grandfathered
  where they sit — a unit that rebuilds a surface does not mint new ones, and
  where the seam already carries the value as data, it reads the data. DEV
  fixtures are exempt: scenario-bound by nature, and they never ship
  (`run-loop.ts:176-177`).
- **`dist/` is a player surface.** Anything published is fetchable by URL, so the
  gate invariant applies to the pack as shipped. `publishedContentOf()`
  (`vite.config.ts:159-164`) strips design-only fields from `gates.json`,
  `score.json` **and `characters.json`**, and the build plugin and both guards
  call that one function, so no test can pass on bytes the deploy does not ship.
  `tests/scaffold/published-data.test.ts` holds all three strips to a
  no-consumer premise — `(g)`, `(h)`, `(i)` — and `no-gate-vocab.test.ts` scans
  every published string value at any depth. A PRD that adds a field to a pack
  decides whether it ships, and adds it to the strip and its premise check if
  not.
- **`button()` names a control through `title`, never `aria-label`**
  (`src/client/shell/dom.ts:28-33`) — and while visible text exists, the text is
  the accessible name and `title` is ignored; remove the text and `title` takes
  over. The a11y census reads `aria-label ?? title ?? textContent`. (v8.)
- **The dark shell types in `--txt-*`; `--pap-*` is ink for paper** — the two
  meet at ~1.3:1 on `--ink-0`, which is invisible. Shell overlays slot into an
  existing z ladder: `#grain` 900 · `#vignette` 901 · `#sweep` 902 · `#toast`
  950 · `.skip-link` 960. (v8.)
- **Two composition roots** must stay in step: `src/client/driver/live/bind.ts`
  and `tools/driver/run/bind.mjs`.
- **The membrane rule and invariant 6** (/CLAUDE.md, `docs/spec-client.md:113-115`)
  outrank any instruction in a PRD.

### 5.5 Verification

`npm run check` is the **type-and-data gate** — `tsc -p tsconfig.core.json` · `tsc`
· `typecheck:test` · `datapack:check` · **`datapack:lint -- data/scenario/우는다리`**
· `test:shared` (`node --test` over `tools/tests/*.mjs`). The `datapack:lint` step
is what a data edit (G1b, T2) trips.

**`check` does not run vitest.** Every vitest suite, including every structure test
in §5.4, runs only under `npm run test`. `npm run build` adds the Vite build and is
the only way to see what actually ships.

Client-facing units name all three. A unit that changes what reaches the browser
names `npm run build` and an inspection of `dist/`. A PRD whose verification is
only "it looks right" is not ready to hand over.

**One known intermittent red.** `tests/fixtures/dev-only.test.ts`'s
`(d) if a build exists, no fixture string reached it` failed twice in six full
runs on 08-06, then survived nine more — three of them after a fresh
`npm run build` — and has never failed in isolation.
`tests/assets/no-third-party-url.test.ts:81-82` removes `dist/` and rebuilds it
in `beforeAll` while `(d)` is scanning `dist/`, and that file's own comment
already records the two going red order-dependently inside a full run. The
`NODE_ENV` pin there addressed a stale dev-flavoured `dist/`; the delete-and-
rebuild race is untouched by it.

Not diagnosed, and stated as observed rather than explained: the failure is a
non-empty `hits`, which a partial read of a half-written `dist/` does not
obviously produce. Whoever fixes it captures the hit string first.

The rule for a PRD, which is narrow on purpose: a red in `(d)` **alone**, on a
unit that touched neither `dist/` nor `tests/fixtures/`, is re-run once before
it is reported, and is never repaired by the executor. Every other red goes back
under §5.7 unchanged. "Re-run it" is not a general licence — it applies to this
one test id and no other.

### 5.6 Handoff — the orchestrated pipeline (08-07, replacing the session relay)

The g2-1 pilot replaced the original handoff (separate executor sessions,
docs-PRs for stamps, stop-reports relayed by hand) with a single orchestrated
flow. The author fires the executor directly as a Sonnet-class subagent and
stays in the loop:

1. **Author** writes the PRD lean — a three-line header (plan version · the
   tree sha the citations bind to · branch · commit message) and the body
   sections of §5.3. No decision logs, dates, or attributions in the PRD:
   that history lives in git and the PR thread.
2. **Stamp** immediately before firing: every `path:line · current text` row
   re-verified against the sha in the header, same-file edits listed bottom-up
   (or the drift stated), the reference data files a suite *loads* swept along
   with suite sources (the g1-1 provenance stop), and the full change list
   **dry-run** on a scratch tree — apply, run the suites, revert (the g1-2 e2e
   catch and the g4-1 `BeatCursor` catch both came from dry runs, not from
   reading). A unit fired in wave B or later (§3) gets a re-authoring pass
   instead of a mechanical stamp, because its shape depends on what the prior
   wave landed — the 08-08 re-audit behind §1 is wave A's stamp input. The
   full apply-run-revert dry-run of the relay era is no longer mandatory: a
   stop now costs minutes, not a docs-PR cycle, and the g2-1 pilot showed a
   scratch dry-run can pass by environmental luck while the executor's own
   full-suite run finds the truth. The stamp keeps the cheap checks (line
   verification, loaded-data sweep, type-plausibility of new signatures); the
   full-suite proof belongs to the executor's verification and the author's
   re-verify.
3. **Executor** — one Sonnet subagent per PRD, in its own git worktree on the
   unit's branch. It executes the change list literally, runs the PRD's
   verification, and commits **one code commit**. It pushes nothing and opens
   no PR. §5.7's stop rule overrides everything: a stop-report returns to the
   author in-conversation (minutes, not a docs-PR cycle), and the author fixes
   the PRD and re-fires — the citations cannot go stale in between, because
   execution happens on the tree the stamp just verified.
4. **Author verifies**: diff against the change list row by row, full suites,
   and a local merge preview against then-current `main`. The author pushes
   and opens the PR; merges are 민서's. `main` stays deployable, and repo hard
   rules 1–6 apply to subagent commits exactly as to hand-written ones.

   **A wave is one PR, and it carries its own PRDs** (v14, 민서 08-08 —
   "docs and their codes will be one PR"; the docs-lane split of the relay
   era is retired). The wave branch opens with a docs commit carrying every
   PRD it is about to execute, the unit branches fork from *that*, and each
   executor's single code commit merges back into it serially. 윤석 then
   reviews each decision beside the diff that implements it instead of across
   two threads. This is sound only while the wave's units are **pairwise
   file-disjoint** — which §5.6's wave rule already requires — because that is
   what lets a unit that goes red be left out of the wave branch and shipped
   after, rather than holding the other three hostage. As-executed amendments
   are commits on the wave branch before the merge. A hotfix that must reach
   `main` before the rest of its wave still opens alone; nothing about one-PR
   waves outranks a broken deploy (hard rule 3).

Execution stays **wave-parallel, merge-serial**. Units whose files are
pairwise disjoint develop concurrently, one worktree each; a unit whose
stamped rows cite another unit's *output* waits for that unit's **merge** —
stacking branches is not used (see the #153 stranding). Before each merge the
author re-runs the PR's suite on a local merge preview. Playtest cadence
follows waves; feel values flagged in a PR are checked at that wave's game
check. Wave 4 was `g2-1` alone: `g2-2`/`g2-3` are deferred with O1/O2 (§4).

### 5.7 When the PRD is wrong

A PRD fails in three shapes, and only two of them are visible to the executor.

- **The citation does not match.** The change list says a path and line hold a
  string; they do not. §5.3's verbatim rule is what makes this fail loudly. The
  danger is the recovery: a low-cost model's default is to search for the string
  elsewhere and edit what it finds — the first step §5.2 forbids, arriving through
  the author's error instead of the author's omission.
- **The instruction is executable and wrong.** A PRD that said "render
  `stances[].desc`" would send an executor looking for a field that dies at
  `schedule.ts:109`; finding none, it reaches for `label`, which is the one thing
  U5.2c forbids. The executor is not malfunctioning. In the absence of the named
  value, being helpful *is* inventing.
- **The instruction is executable and breaks something.** U1 built into the
  adapter applies cleanly, typechecks, and passes every suite, because
  `kick()`'s early return at `adapter.ts:194-196` halts the run at runtime. No
  stop rule reaches this one — the executor was never confused. It is caught only
  by a Done-when condition stated as behaviour ("the run reaches 21:04"), which is
  why §5.3 requires one.

The block below goes in every PRD, verbatim, under `## If this PRD is wrong`.

```
An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
```

The last line is load-bearing. An executor that reads stopping as failure pushes
through, and the failure that reaches the author is a diff instead of a sentence.

On receiving such a report the author separates two causes, because the fixes
differ: the PRD was wrong when written (correct it and reissue), or the branch
moved under it (rebase and reissue against the reported commit). The executor
cannot tell these apart; the reported commit is what lets the author. Either way
the reissue is the committed file (§5.6), never a correction in chat.
