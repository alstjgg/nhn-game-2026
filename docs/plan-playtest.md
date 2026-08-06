# plan-playtest — 2026-08-05 playtest triage

> Source: 민서 playtest of the deployed Pages build (live proxy, 우는다리).
> Priority tiebreaker: **mechanism legibility** — the C-BLOCK loop (block choice →
> interpretation shift → stance change → visible result) must read clearly.
> Cut line against the ~08-10 deadline is §4. Rules live in /CLAUDE.md; state in status.md.
> Items marked **landed** are already on this branch; the citation is what to read, not what to do.
> Every coordinate below was audited against the working tree on 2026-08-06.

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
never loads it — `src/client/driver/fixtures/run-loop.ts:176-177` returns `null`
outside `import.meta.env.DEV`. **Editing the fixture changes nothing on the
played site.**

The client's `RUN nn` labels contradict the frame and are corrected in G3.

Gate structure must not reach the player. `docs/spec-client.md:113-115` carries
this as review-blocking **invariant 6** in §3, and the 08-03 decision log binds it
for the archive. §1.G items are defects against that rule, not feature requests —
and the surface includes anything fetchable from the deployed site, not only what
is drawn.

## 1. Items

### G — Gate exposure

| id | item | where | cost |
|---|---|---|---|
| G1a | **landed** (`e270604`) — the pack shipped whole, so `dist/data/scenario/우는다리/draft.md` (44 kB) was readable by URL | `vite.config.ts:45-73` enumerates by file; 22 published files → 8 | — |
| G1b | **landed** (`e270604`) — LIVE FEED printed `(갈림길 G1의 자리)` … `(갈림길 G6의 자리)`, six distinct strings | removed from `data/scenario/우는다리/timeline.json` **and** `draft.md`, or the next `datapack:compile` restores it | — |
| G1c | **landed** — two more leaks sat inside files entitled to ship: `gates.json:44` `key_examples[].mined_from` ("런 1 객관 로그 · 시계 09:40 — 다음 런의 G1 이전에 채굴 가능", 18 such values, 12 naming a gate) and `characters.json` `strands.gate_ids` | `tests/scaffold/no-gate-vocab.test.ts` scans every string value through `publishedContentOf()` (`vite.config.ts:159-164`); `gates[].gate` exempt by path and exact shape | — |
| G2 | LIVE FEED names the fault in mechanism terms | `src/client/components/fallback-notice.ts:27-31` — see below | S |
| G4 | AGENT FILE 행동 원칙 reads as a manual | hardcoded at `src/client/components/dossier.ts:102`, **not** authored in the datapack | S |
| G3 | REPORTS rail labels every segment `RUN nn` | `src/client/components/report-archive.ts` — see below | M |

**G2 is smaller than it looked, and wider.** `announcementOf(event)`
(`announcer.ts:54-69`) already receives the whole event, the fallback event
carries `call: 1 | 2 | 3` (`src/shared/view-driver.ts:28`), and `FALLBACK_CLASS`
(`fallback-notice.ts:16-20`) already maps call → severity. **No signature change
and no `announce()` call-site edits** — `announcer.ts:29` becomes a three-way map
keyed off `event.call` at `:60-61`. Four literals carry the fatal string:
`fallback-notice.ts:28`, `announcer.ts:29`,
`src/client/driver/fixtures/woodari-run03.ts:95` (a fifth variant with a tail,
which the e2e suite drives), and `tests/windows/live-feed.test.ts:262`.

New register — a **transmission** fault, never a reasoning or gate one:
`회신 불량` · `네트워크 지연 중` · `서버 이상 — 요원과 재접선 시도 중`. One line per
severity. A stretch where the radio was down is also a stretch where the agent
judged alone, and the report for it can say so.

**G3 is not a guard change.** `report-archive.ts:34` is `REFUSED = /gate|게이트/i`
— a deny list `ECHO-n` passes, and it is what keeps invariant 6. The on-screen
label is built by `runLabelOf(entry.run)` (`:43-45`) from the run **number**; the
entry's own label is never consulted for it. In-file: `runLabelOf` (`:43-45`),
`OWN_PREFIX` (`:31`), `RAIL_LABEL`/`RAIL_NOTE` (`:37`, `:40`),
`ArchiveSegment.runLabel` (`:25`) and its render site (`:152`).

The labels `OWN_PREFIX` exists to strip are minted at
`src/client/driver/fixtures/woodari-meta.ts:24-25` and
`src/client/driver/fixtures/run-loop.ts:82`. **Five further live `RUN nn` sites
sit outside `report-archive.ts`** — `src/client/shell/announcer.ts:26`
(`RUN_OPENED`, the spoken label on every `meta`),
`src/client/windows/tally.ts:54` (`RUN_CAPTION`, written at `:172,176`,
announced at `:173,179,324`), `src/client/components/run-counter.ts:27`, and
`src/client/components/deploy-button.ts:51`. Rename in the archive only and the
toast and the ledger still say `RUN nn`. Asserted across seven suites, including
`tests/windows/reports.test.ts:441-466` and
`tests/fixtures/meta-and-archive.test.ts:17,79` — the PRD's Scope must enumerate
them and say which are amended.

Archive persistence is U5.1, not this.

**G4 is a rewrite, not a deletion.** §2 행동 원칙 is the only place the player
reads who their agent is. Same information as a person — *"확인되지 않은 것을
단정하지 않는다. 판단이 필요한 순간에는 판단하고, 왜 그랬는지 남긴다."* Same cost.
`tests/windows/agent-file.test.ts:270` asserts the current title.

### T — Text volume

| id | item | resolution | depends on |
|---|---|---|---|
| T1 | BLOCK STORE duplicates report sentences | remove the window; its one distinct function — a cross-run view of mined sentences — moves into the report | U5.2a (landed) |
| T2 | Radio reports too long to read before the next event | lower `max_chars` in `data/policy/report-guidance.json:11` (300–1200자, character-bounded; rendered by `src/shared/report-guidance.ts:49-56`) | — |
| T3 | Layout: REPORTS left (large), LIVE FEED top-right, AGENT FILE bottom-right | `src/client/shell/layout.ts:33,50,65-111` | M |

**T1's sites:** `src/client/windows/block-store.ts` (deleted),
`src/client/shell/window-registry.ts:12,40` (the import and the mount — its
header says it is the only module that imports `windows/`),
`src/client/shell/layout.ts:33` (`WINDOW_KEYS` `'store'`), `:50` (`DESK_ORDER`),
`:107` (its rect), `src/client/styles/win-block-store.css`, and
`src/client/components/species-filter.ts`, whose only importer it is.

**T3 must move `DESK_ORDER` (`layout.ts:50`) with the rects.** `layout.ts:43-48`
records that a `DESK_ORDER`/`applyLayout` mismatch is the WCAG 2.4.3 focus-order
defect `e2e/a11y.spec.ts` quarantined. Moving REPORTS to the left column without
it regresses focus order.

T2 changes what is mineable and the Call-3 latency figure recorded on 08-04.
Re-run one probe after changing it.

### C — Concept and naming

| id | item | where |
|---|---|---|
| C1 | AGENT FILE becomes a paged dossier, not a scroll | `src/client/components/dossier.ts:85-120` (`dossierModel`, six sections §0–§5 in one array); `src/client/windows/agent-file.ts:76,88-96` |
| C2 | "알고 있는 문장" → 행동 지침 / 임무 인수인계 사항 | `dossier.ts:107` is the only rendered site |
| C3 | "보고 지침" renamed to match the report concept | `dossier.ts:113` |
| C4 | 객관 로그 → 현장 기록, 요원 보고서 → 무전 기록 | `src/client/components/report-view.ts:123` and `:124` |

- **C1's page inventory uses spaced forms on disk** — `행동 원칙`, `알고 있는 문장`,
  `보고 지침`. `문서번호` **does not exist anywhere in the tree**; it is new copy to
  be authored. `문서번호` and `호출부호` are built in the window, not the component
  (`agent-file.ts:76`, `:95`). Section order is asserted at
  `tests/windows/agent-file.test.ts:262-274` and `e2e/agent-file.spec.ts:129-139`.
- **C2's second anchor is a comment.** `slot-board.ts:1` is a source header
  (`// SlotBoard — §4 알고 있는 문장: …`) — editing it changes nothing on screen.
  Say whether it is kept in step. Test literals: `agent-file.test.ts:272`,
  `e2e/agent-file.spec.ts:137`.
- **C3 must not touch the prompt.** `[보고 지침]` is also the Call-3 prompt header
  at `src/shared/report-guidance.ts:3,7` — a different string, left alone. Tests:
  `agent-file.test.ts:273`, `e2e/agent-file.spec.ts:138`.
- **C4 has a third, player-facing site.** `src/engine/index.ts:175`
  `SUBSTITUTE_REPORT_BODY = '보고를 생성하지 못했다. 이 라운드의 기록은 객관 로그로
  남는다.'` — used at `:363` as the body the player reads when Call 3 fails. Also
  decide the non-rendered fixture fields `src: '객관 로그'`
  (`src/client/driver/fixtures/woodari-meta.ts:50,52,53,54,57`).

C2–C4 are copy and land in one commit.

### U — Usability

| id | item | resolution |
|---|---|---|
| U1 | LIVE FEED emits many lines at once, so time stutters instead of passing | reveal queue in `src/client/windows/live-feed.ts`, downstream of the adapter's fanout (`adapter.ts:155-158`) |
| U2 | 4 slots too few; drag sentences rather than cards | `SLOT_CAP` at `src/client/components/slot-board.ts:19`; a U-owned §9 parameter (`docs/spec-client.md:149,380,405`), not a datapack field |
| U3 | Remove TALLY; merge NEW RUN into DEPLOY; casualties and results in 현장 기록 as unmineable, visually distinct records | see below — the sites span four files |
| U4 | Nothing tells a judge what to press first | resolved into O1 and O2 |
| U5.1 | REPORTS tabs → ECHO-1, ECHO-2…, each opening that sitting's 현장 기록 + 무전 기록 | needs a **new store** — see below |
| U5.2a | **landed** (`afe02d6`) — the slotted highlight was written and never rendered | `src/client/components/minable-sentence.ts:55-74`, `src/client/windows/reports.ts:108-132`, `src/client/styles/win-reports.css:75-77` |
| U5.2b | Carry the agent's chosen stance to the client at all | engine seam — see below |
| U5.2c | Show that stance beside the sentence that moved it, and show unused sentences as unused | depends on U5.2b and M1 |
| U5.3 | AGENT FILE gains one page per ECHO-*; a new simulation appends a page | depends on C1 (`dossier.ts:85-120`) |

**U1 must not go in the adapter.** A pacing queue already exists there —
`adapter.ts:117` (`Pending`), `:160-166` (`absorb`), `:169-186` (`release`) — and
events release when `clock.minute` reaches their stamp, which is why same-minute
lines burst. But `kick()` (`:194-196`) returns early while `pending` is non-empty,
so a reveal delay added there **stalls the engine's next `step()` and the
prefetch — the run halts.** The queue belongs in the feed window, downstream of
`fanout`. Agent-log timestamps are engine data (`adapter.ts:111-115` `stampOf()`
reads `event.line.clock`; the same events feed `tools/driver/run/bind.mjs:128-130`)
and are never edited for pacing.

For 26 deaths to land at 21:04 the player has to have been there for the twelve
hours those people were alive. Pace can carry tension too — slow in quiet
stretches, quick when events crowd.

**U3's sites**, none of which the previous ranges covered:
`src/client/windows/tally.ts:45-48` (the NEW RUN strings, written at `:370`),
`:126-132` (construction), `:181` (re-enable), `:196-210` (the click handler that
actually sends at `:204`); `src/client/driver/live/adapter.ts:367-404` — the whole
`send`, with `:379` the `deploy` op being merged into and `:386-402` the `new_run`
guard; `src/client/components/deploy-button.ts:15-108` (the notes and
`DeployView`/`DeployState` a merged control must extend, through the stamp's
render at `:102-107`); and **`src/client/shell/window-registry.ts:42`, which is
what mounts TALLY** — leave it and the window still appears. Also
`layout.ts:33,50,75-80,100-102,109`, and a decision on whether `RunPhase 'tally'`
(`run-state.ts:23`, set at `:112-128`) stays.

**U2 is pinned by four assertions the executor will hit:**
`tests/windows/block-store.test.ts:366` (`expect(SLOT_CAP).toBe(4)`),
`tests/windows/agent-file.test.ts:734` (source regex),
`agent-file.test.ts:735-740` (forbids any other u4 source matching
`/(?:slotCap|cap|slots?)\s*[:=]\s*4\b/`), and
`tests/windows/block-store.test.ts:557-559`, which requires
`git diff --name-only HEAD -- slot-board.ts` to be **empty** — any uncommitted
edit to `slot-board.ts` fails it. That last one also catches C2.

The mechanism risk stands: C-BLOCK was measured with **one** sentence injected
into `[알려진 것]` (9/10 stance shift, one-sided Fisher p=0.0000595). At ten the
effect may dilute or saturate and attribution may be lost, which is the
legibility the loop depends on. Raise to 6 behind one probe arm, or hold at 4.

**U5.1 cannot extend `report_archive`.** `src/runloop/meta-state.ts:22` is
`report_archive: string[]` — run **ids**, an index for browsing, appended at
`run-loop.ts:118-119` and surfaced as `archive: {run,label}[]` at `:131`. Report
bodies are persisted nowhere, and `data/runs/_schema/meta-state.schema.json` is
`{"type":"array","items":{"type":"string"}}` under `additionalProperties: false`,
so widening it fails `tests/runloop/meta-schema.test.ts:88-89`. This unit adds a
separate store. `docs/spec-client.md:152` already specifies the rail (and `:302`
the component), so it is conformance, not a new feature.

**U5.2b is an engine-seam unit, not a client one.** The prose exists on disk and
dies before the client: `gates.json`'s `stances[].desc` (G1 stance `c` 경청 =
*"질문지를 덮는다 — 발신자의 말이 끝날 때까지 끊지 않고 자리를 내준다"*) is
**dropped at `src/engine/beat/schedule.ts:109`**, where `compileGate` maps
stances to `{ id, label }` only; `Stance` is `{ id: string; label: string }`
(`src/shared/contracts.ts:24`); and **no `ViewEvent` carries a stance at all**.
An executor told "use `desc`" finds no `desc` and reaches for `label` — exactly
what U5.2c forbids. This unit widens `Stance`, stops dropping `desc` in
`compileGate`, and adds the field to the §5.2 view-driver seam.

**U5.2c** renders it. Use `desc`, never `label`: `매뉴얼 → 경청` transmits nothing,
because the player has never seen either word. Sentences that fired nothing must
read as unused, or the player cannot learn which one worked — this is also how a
false lead surfaces without the game saying "wrong". **The false leads that ship
are `data/scenario/우는다리/gates.json`'s `gates[].false_leads`** — 7 strings, one
per gate. `truths.json` never ships (`vite.config.ts:38`) and `truths` is a banned
seam prefix (`src/shared/seam-keys.ts:36`). The agent-number stamp needs M1:
`MarkSets` (`minable-sentence.ts:23-26`) is two `Set<string>` with nowhere to
carry a number.

### O — Opening

| id | item | where |
|---|---|---|
| O1 | Play the 08:50 call before the desk appears: empty screen, radio only, then it cuts off and the windows come up | `src/client/main.ts:9` (`void bootShell()`), or between `boot.ts:118` (`holdDesk`) and `:216-219` (`revealDesk`) — the hold/reveal seam exists at `src/client/components/desktop-dressing.ts:15,20` |
| O2 | First report's first mineable sentence pulses once, first run only | `src/client/components/minable-sentence.ts:20,78-82,121-126` for the state; first-arrival is decided at `src/client/windows/reports.ts:95-108` / `report-view.ts:94` (`RenderOptions.replay`); new class beside `win-reports.css:75-77`, values in `tokens.css` (invariant 8) |
| O3 | Three or four sound effects — static, the phone, the silence at 21:04 | files under `public/assets/`; entry per file in `assets-manifest.json`'s `assets[]` — generated `{file, tool, prompt, license}`, sourced `{file, source, license, note}` (see the font entries) |

An opening is not a tutorial. Ten seconds establishes who the player is, what
they are for, and why it is urgent, and it is the first ten seconds of
deliverable #2. CLAUDE.md makes the first 60 seconds the optimization target and
nothing in the build addresses it. O1 must not build a second hold — the desk
already holds and reveals.

### M — Misc

| id | item | where |
|---|---|---|
| M1 | Agent callsign increments per simulation (ECHO-1, ECHO-2…) | `dossier.ts:19` (`CALLSIGN = 'ECHO-1'`), consumed at `:92` and `src/client/windows/agent-file.ts:95`; a per-run callsign threads through `DossierInput` (`dossier.ts:35-42`). Other literals: `run-feed.ts:60`, `report-view.ts:124,143` |
| M2 | Species tags ('자기서술') removed from display, and from the dataset where possible | the literal is `SPECIES_DISPLAY` at `components/block-card.ts:33-38`; the render M2 removes is `:158-161`; the filter prints it twice at `components/species-filter.ts:76,78` |

- **M1's assertions:** `e2e/agent-file.spec.ts:186`, `tests/windows/live-feed.test.ts:400`.
  M1 is the cheapest piece of U5 — `RUN 01` is a number and reads as "my second
  attempt"; `ECHO-2` is a person, which makes a failed run a dead agent.
- **M2's importer list was wrong.** Only `components/slot-board.ts:16` and
  `windows/block-store.ts:26` import `blockCardModel`, and `block-store.ts:75`
  reads `.species` (data, for the filter) — never `.ko`.
  `components/species-filter.ts:18` imports `SPECIES_DISPLAY` directly;
  `components/deploy-button.ts:10` and `windows/agent-file.ts:16` import `pad2`
  and touch species not at all. Assertions: `agent-file.test.ts:614,632`.
- **The `species` field is data, not decoration.** It is minted from the id
  channel (`src/shared/id.ts:68,91`) off the channel→species map at
  `src/shared/species.ts:43-70` (with `AUTHORED_SPECIES` `:76`, `CERTIFIED` `:79`),
  typed on the wire (`view-driver.ts:17-18`), and set by the engine
  (`src/engine/feed/report.ts:65,71`). The authored `key_conditions[].species` in
  `data/scenario/우는다리/gates.json` is a **separate Korean vocabulary**
  (`사실` | `자기서술`, `datapack.ts:157`) sharing no value with the wire union.
  Display removal is unconditional; field removal is only available if those
  consumers are retired with it.

## 1.5 The prerequisite — mostly landed

The predicate work `status.md` named on 08-05 is **three-quarters done**, and this
document's earlier dependency on it was stale:

- `data/scenario/우는다리/score.json` — **9 units, all 9 carrying predicates**
- `src/driver/scorer.ts:136` — `createScorer` returns a live `ScorerPort`
- both roots wired — `src/client/driver/live/bind.ts:84`, `tools/driver/run/bind.mjs:125`
- **still open:** meter binding — `characters.json` c2–c7, 12 of 14
  `meters[].variable` are `null`

So **U3 and U5.2c are no longer gated on it.**

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

```
G2, G4, C2, C3, C4, M1, M2, T2, U1, U3, O1, O2, O3      ← no dependencies
        │
M1 ──► U5.1                    M1 ──► U5.2c
G3 ──► U5.1                    U5.2b (seam: carry `desc`) ──► U5.2c
C1 ──► U5.3
        │
U5.2a (landed) ──► T1 ──► T3
U2 ──► probe at the new cap
```

`U5.2a` landing and the scorer landing between them removed both of the previous
graph's long chains. **U3 is now free-standing**, and the critical path is
`U5.2b → U5.2c`, which crosses the engine/client boundary and is therefore two
units by §5.2.

## 3. Work groups

1. **Copy pass** — G2, G4, C2, C3, C4, M1, M2, T2. Strings and data only.
2. **Time** — U1, then O1/O2. The day has to pass before anything about it reads.
3. **Ending** — U3. No longer waits on anything.
4. **Cause** — U5.2b (seam), then U5.2c (render).
5. **Report becomes the archive** — T1 → T3.
6. **History** — G3, U5.1, then C1 → U5.3.
7. **Polish** — O3.
8. **Slot cap** — U2, probe first.

## 4. Cut line (~08-10; the deployed build stays green)

**Must:** U1 · group 1 (G2, G4, C2, C3, C4, M1, M2, T2) · O1 · U3 · U5.2b + U5.2c · T1.

U1 leads: a day that arrives in bursts is skipped rather than lived, and 21:04
then lands on nothing. O1 is must because the competition is judged on minutes of
play and a 30–60 s video and there is no first ten seconds. U5.2b+c is the only
place cause becomes visible, which is the tiebreaker this document ranks by — and
it grew an engine-seam half, so it starts earlier than its old position implied.
U3 moves up because the scorer landed and it now blocks on nothing.

**Should:** T3 · U5.1 · O2 · O3.

**U5.1 moved down from must.** It was sized as a client change; it needs a new
persistence store, because `report_archive` is an index of run ids and its schema
forbids widening. M1 alone — distinct callsigns per sitting — carries most of the
value it was wanted for, and M1 is in the copy pass.

**Won't:** C1 · U5.3 · U2.
U5.3 is the next step rather than a cut. U2 is deferred because raising the cap
without a probe risks the mechanism claim four days before submission.

## 5. Execution — authoring mini-PRDs for low-cost executors

> As of 2026-08-06 (v4). A PRD names the version it was written against.

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
U5.2b/U5.2c above is exactly that split. The work groups in §3 are the intended
unit boundaries.

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

### 5.6 Handoff

Each PRD is a file, committed before the executor starts — an inline prompt is lost
when the process dies. The executor works on its own branch, opens a PR, and merges
nothing. Review is by the author, against the Done-when checklist. `main` stays
deployable, and repo hard rules 1–6 apply to executor commits exactly as to
hand-written ones.

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
