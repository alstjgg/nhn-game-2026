# plan-playtest — 2026-08-05 playtest triage

> Source: 민서 playtest of the deployed Pages build (live proxy, 우는다리).
> Priority tiebreaker: **mechanism legibility** — the C-BLOCK loop (block choice →
> interpretation shift → stance change → visible result) must read clearly.
> Cut line against the ~08-10 deadline is §4. Rules live in /CLAUDE.md; state in status.md.
> Items marked **landed** are already on this branch; the citation is what to read, not what to do.

## 0. Frame

A run is one whole day. The seam that fixes this is `src/client/shell/run-state.ts:41-60`,
which defines the phase cycle and warns that the demo fixture's `round = run` is a
property of that fixture and not of the seam; the 08:50 and 21:04 stamps are
authored in `src/client/driver/fixtures/woodari-run03.ts:222-223`. Gates are
beats inside a run; reports are per round. The client's `RUN nn` labels
contradict this and are corrected in G3.

Gate structure must not reach the player. The 08-03 decision log binds this for
the archive, and `docs/spec-client.md` §3 carries it as review-blocking
invariant 6. §1.G items are defects against that rule, not feature requests —
and the surface it applies to includes anything fetchable from the deployed
site, not only what is drawn on screen.

## 1. Items

### G — Gate exposure

| id | item | where | cost |
|---|---|---|---|
| G1a | **landed** (`e270604`) — the pack shipped whole, so `dist/data/scenario/우는다리/draft.md` (44 kB, every gate, key condition and truth) was readable by URL | `vite.config.ts` enumerates by file; 22 published files → 8 | — |
| G1b | **landed** (`e270604`) — LIVE FEED printed `(갈림길 Gn의 자리)` on six timeline lines | removed from `data/scenario/우는다리/timeline.json` **and** from `draft.md`, or the next `datapack:compile` restores it | — |
| G1c | No guard on gate *vocabulary* inside the files that do ship | `tests/scaffold/published-data.test.ts` guards which files ship, not what is inside them. New scan over build output and player-facing pack fields, on the `no-digit-npc.test.ts` pattern | M |
| G2 | LIVE FEED names the fault in mechanism terms | `src/client/components/fallback-notice.ts:27-31` carries three severities; `src/client/shell/announcer.ts:29` is a **second literal** and holds the fatal string only | M |
| G3 | REPORTS rail labels every segment `RUN nn` | `src/client/components/report-archive.ts` — see below | M |
| G4 | AGENT FILE 행동 원칙 reads as a manual: "매 갈림길에서 하나의 태도를 고르고" | hardcoded at `src/client/components/dossier.ts:102`, **not** authored in the datapack | S |

**G2** keeps the notice and changes its register: it names a **transmission**
fault, never a reasoning or gate one — `회신 불량` · `네트워크 지연 중` ·
`서버 이상 — 요원과 재접선 시도 중`. Each of the three severities gets its own
line, so `announcer.ts` needs a severity parameter and its call sites updated.
This is not an S. A stretch where the radio was down is also a stretch where the
agent judged alone, and the report for it can say so.

**G3 is not a guard change.** `report-archive.ts:34` is `REFUSED = /gate|게이트/i`
— a deny list that `ECHO-n` passes untouched, and it is what keeps invariant 6.
The on-screen label is built by `runLabelOf(entry.run)` (`:43-45`) from the run
**number**, and the entry's own label is never consulted for it. A rename
touches `runLabelOf`, `OWN_PREFIX` (`:31`), `RAIL_LABEL`/`RAIL_NOTE` (`:37`,
`:40`), and `ArchiveSegment.runLabel` (`:25`) with its render site. Archive
persistence is U5.1, not this.

**G4 is a rewrite, not a deletion.** §2 행동 원칙 is the only place the player
reads who their agent is. Same information as a person rather than a procedure —
*"확인되지 않은 것을 단정하지 않는다. 판단이 필요한 순간에는 판단하고, 왜
그랬는지 남긴다."* Same cost as deleting it.

### T — Text volume

| id | item | resolution | depends on |
|---|---|---|---|
| T1 | BLOCK STORE duplicates report sentences | remove the window; its one distinct function — a cross-run view of mined sentences — moves into the report itself | U5.2a |
| T2 | Radio reports too long to read before the next event | lower `max_chars` in `data/policy/report-guidance.json:11` (currently 300–1200자, character-bounded) | — |
| T3 | Layout: REPORTS left (large), LIVE FEED top-right, AGENT FILE bottom-right | `src/client/shell/layout.ts:65-111` — the grid is TS constants, not CSS | T1 |

T2 changes what is mineable and the Call-3 latency figure recorded on 08-04.
Re-run one probe after changing it.

### C — Concept and naming

| id | item | where |
|---|---|---|
| C1 | AGENT FILE becomes a paged dossier, not a scroll — p1 문서번호·임무·행동원칙·기질·보고지침, p2 식별·호출부호·알고있는 문장 | `src/client/components/dossier.ts`, `slot-board.ts` |
| C2 | "알고 있는 문장" → 행동 지침 / 임무 인수인계 사항 | `dossier.ts:107`, `slot-board.ts:1` |
| C3 | "보고 지침" renamed to match the report concept; need not be the literal prompt | `dossier.ts` |
| C4 | 객관 로그 → 현장 기록, 요원 보고서 → 무전 기록 | `src/client/components/report-view.ts:123` and `:124` respectively |

C2–C4 are copy and land in one commit.

### U — Usability

| id | item | resolution |
|---|---|---|
| U1 | LIVE FEED emits many lines at once, so time stutters instead of passing | client-side reveal queue, one sentence at a time. Agent-log timestamps are engine data feeding the run artifacts and do not change |
| U2 | 4 slots too few; drag sentences rather than cards | `SLOT_CAP` at `src/client/components/slot-board.ts:19`; a U-owned §9 parameter (`docs/spec-client.md:149,362,387`), not a datapack field |
| U3 | Remove TALLY; merge NEW RUN into DEPLOY; casualties and results appear in 현장 기록 as unmineable, visually distinct records | `src/client/windows/tally.ts:45-46,126-130`, `src/client/components/deploy-button.ts:43-97`, driver ops at `src/client/driver/live/adapter.ts:380-383` |
| U4 | Nothing tells a judge what to press first | §1.O below |
| U5.1 | REPORTS tabs → ECHO-1, ECHO-2…, each opening that sitting's 현장 기록 + 무전 기록 | needs a persistent archive; `src/runloop/meta-state.ts` carries `report_archive`. `docs/spec-client.md:152` already specifies the rail, so this is conformance |
| U5.2a | **landed** (`afe02d6`) — the slotted highlight was written and never rendered | `.min.slotted` was unreachable (`mined` read first, and nothing can be slotted unmined) and slotting repainted nothing |
| U5.2b | The slotted sentence shows what the agent did, and unused sentences show that they did nothing | depends on M1 — see below |
| U5.3 | AGENT FILE gains one page per ECHO-*; a new simulation appends a page, and flipping back reads past instructions | depends on C1 |

**U1 is the day passing.** For 26 deaths to land at 21:04, the player has to have
been there for the twelve hours those people were alive; a burst of lines is a
day skipped rather than lived. Pace can also carry tension — slow in quiet
stretches, quick when events crowd, and slowing just before the 09:25 call tells
the player something is coming before the text does.

**U5.2b is where cause becomes visible**, and without it the loop reads as dice.
Put the agent's behaviour next to the sentence that moved it. The prose already
exists: `gates.json`'s `stances[].desc` is authored human-readable —
*"질문지를 덮는다 — 발신자의 말이 끝날 때까지 끊지 않고 자리를 내준다"*. Use
`desc`, never `label`: `매뉴얼 → 경청` transmits nothing, because the player has
never seen either word. Sentences that fired nothing must read as unused, or the
player cannot learn which one worked — this is also how a false lead
(`truths.json`, `false_leads`) surfaces without the game saying "wrong".
The stamp needs M1 first: `MarkSets` is two `Set<string>` with nowhere to carry
a number, and `dossier.ts:19` still holds `CALLSIGN = 'ECHO-1'` as a constant.

**U2 raises a mechanism risk.** C-BLOCK was measured with **one** sentence
injected into `[알려진 것]` (9/10 stance shift, one-sided Fisher p=0.0000595).
At ten simultaneous sentences the effect may dilute or saturate, and the player
may not be able to attribute the shift to a specific sentence — which is the
legibility the core loop depends on. It also grows the Call-1 prompt, already
3.1–4.0 s. Raise to 6 behind one probe arm at the new cap, or hold at 4 and
record the cap as a tuned parameter.

### O — Opening

| id | item | where |
|---|---|---|
| O1 | Play the 08:50 call before the desk appears: empty screen, radio only, then it cuts off and the windows come up | new boot step ahead of `src/client/shell/boot.ts` |
| O2 | First report's first mineable sentence pulses once, first run only | `src/client/components/minable-sentence.ts` |
| O3 | Three or four sound effects — static, the phone, the silence at 21:04 | each needs an `assets-manifest.json` entry (hard rule 5) |

An opening is not a tutorial. Ten seconds establishes who the player is, what
they are for, and why it is urgent, and it is also the first ten seconds of
deliverable #2. CLAUDE.md makes the first 60 seconds the optimization target and
nothing in the build currently addresses it.

### M — Misc

| id | item | where |
|---|---|---|
| M1 | Agent callsign increments per simulation (ECHO-1, ECHO-2…) | `src/client/components/dossier.ts:19` holds `CALLSIGN = 'ECHO-1'` as a constant; also `run-feed.ts:60`, `report-view.ts:124,143` |
| M2 | Species tags ('자기서술') removed from display, and from the dataset where possible | label comes from `blockCardModel().ko` (`components/block-card.ts:106-121`), imported by `components/slot-board.ts`, `components/species-filter.ts`, `components/deploy-button.ts`, `windows/agent-file.ts` and `windows/block-store.ts`; the filter is used only by BLOCK STORE and goes with T1 |

M1 is not cosmetic. `RUN 01` is a number and reads as "my second attempt";
`ECHO-2` is a person, which makes a failed run a dead agent and repetition a
lineage the player accumulated.

M2's `species` field is minted from the id channel (`src/shared/id.ts:68,91`),
typed on the wire (`src/shared/view-driver.ts:18`), set by the engine
(`src/engine/feed/report.ts:65,71`) and authored in `gates.json`
(`key_conditions[].species`). Display removal is unconditional; field removal is
only available if those consumers are retired with it.

## 1.5 The prerequisite this document does not own

`Sentence` is `{ id, text, species, axis }` (`src/shared/view-driver.ts:18`) —
there is **no `referent`**. A gate's key condition is a triple of axis ·
referent · species, so deciding what a sentence is *for* needs referent
matching, and that is the predicate work `status.md` names (bind the character
meters, author the 8 units' predicates, `ScorerPort`, wire both composition
roots).

That work is the shared prerequisite of **U3** and **U5.2b**, two items below.
It also opens the game's grammar to the player: across `gates.json` there are
exactly two axes — 두려움 and 지워짐 — so the whole scenario reduces to *who is
afraid, and what is being erased*. No surface teaches this today, and none needs
inventing: U5.2b's report highlighting and AGENT FILE §4 are where it would show.
Owner and date for the predicate work belong in `status.md`, not here.

## 2. Dependency order

```
G1c, G2, G4, C2, C3, C4, M1, M2, T2, U1, O1, O2, O3   ← no dependencies
        │
M1 ──► U5.1 ──┐
G3 ──► U5.1   ├──► U5 history complete
C1 ──► U5.3 ──┘
M1 ──► U5.2b
        │
U5.2a (landed) ──► T1 ──► T3
        │
predicates + ScorerPort (§1.5) ──► U3
                              └──► U5.2b
U2 ──► probe at the new cap
```

U5.2a landing frees the `T1 → T3` chain to start now; it no longer waits on M1,
because the stamp split out as U5.2b.

## 3. Work groups

1. **Copy pass** — G2, G4, C2, C3, C4, M1, M2, T2. Strings and data only.
2. **Time** — U1, then O1/O2. The day has to pass before anything else about it
   reads.
3. **Report becomes the archive** — T1 → T3, with U5.2b when M1 lands.
4. **Ending** — U3, on the predicate work in §1.5.
5. **History** — G3, U5.1, then C1 → U5.3.
6. **Guards and polish** — G1c, O3.
7. **Slot cap** — U2, probe first.

## 4. Cut line (~08-10; the deployed build stays green)

**Must:** U1 · group 1 (G2, G4, C2, C3, C4, M1, M2, T2) · O1 · U5.2b · M1+U5.1 ·
T1 · U3.
U1 leads because a day that does not pass makes 21:04 land on nothing. O1 is
must because the competition is judged on minutes of play and a 30–60 s video,
and there is currently no first ten seconds. U5.2b is the only place cause
becomes visible, which is the tiebreaker this document ranks by.

**Should:** T3 · G1c · O2 · O3.
T3 is the layout drawing — real, but it tidies the screen rather than making the
loop turn. G1c guards a defect already fixed.

**Won't:** C1 · U5.3 · U2.
U5.3 is the next step rather than a cut: it is the natural post-submission move.
U2 is deferred because raising the cap without a probe risks the mechanism claim
five days before submission.

## 5. Execution — authoring mini-PRDs for low-cost executors

> As of 2026-08-06 (v2). A PRD names the version it was written against.

The items above are not worked by hand and not worked one at a time. Each is
specified as a **mini-PRD** by a high-capability model, then executed by a
sub-agent on a low-cost model. The specification carries the expertise; the
executor supplies only mechanical edits. Everything in this section is a rule
for the author of the PRD, not for the executor.

**Maintaining this section is part of the job.** A high-capability model reading
this document — for any reason — revises §5 when it finds a rule that misfires,
a trap that is missing, or a template field that executors keep filling wrongly,
and bumps the version line above. §5 is the only part of this document that is
expected to change without a playtest behind it.

### 5.1 The division

The author decides. The executor types. Every decision an executor would
otherwise have to make is a decision the PRD failed to make, and a low-cost
model resolves such gaps by inventing something plausible and consistent with
nothing.

Author-owned, always resolved before handoff: which files change · the exact
final strings · naming · whether a test is updated or left alone · what counts
as done. Executor-owned: nothing but the edit and running the checks.

### 5.2 Unit sizing

One PRD is one concern, one branch, and a diff a reviewer reads in a sitting.
Split anything that crosses a boundary between authored data, engine, and
client. The work groups in §3 are the intended unit boundaries.

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
```

Rules for the change list. **Open the file and confirm the line does what the
citation claims** — a line that merely contains the string is not necessarily
the line that renders it, and a doc comment above a function is not the
function. State the replacement text in full, including Korean copy; an
executor asked to "rename appropriately" will invent a register that does not
match the fiction. Where a string appears more than once, enumerate every site —
the second literal in `src/client/shell/announcer.ts` is the one most often
missed, and it does not always carry every variant of the string it duplicates.
Where the change is a deletion, say what replaces it, including "nothing".

### 5.4 Repo traps to name in the PRD that touches them

- **Structure tests assert against the working tree, not file history.**
  `tests/windows/block-store.test.ts:561-567` requires
  `git diff -U0 HEAD -- block-card.ts` to contain no `-` lines;
  `agent-file.test.ts:727` is the same shape. **Committing empties the diff and
  the test passes**, so only *uncommitted* deletions are caught. A PRD for
  deletion-shaped work must (a) decide and state whether the assertion is
  amended, and (b) fix whether verification runs before or after the commit.
  Leave either open and the executor either deletes the assertion or commits its
  way to green.
- **`report-archive.ts`'s label guard is a deny list, and is not the thing to
  change.** `REFUSED = /gate|게이트/i` (`:34`) refuses gate vocabulary only —
  `ECHO-n` passes — and it is what keeps invariant 6. The on-screen label comes
  from `runLabelOf()` (`:43-45`), built from the run number and ignoring the
  label entirely. A unit that re-authors the guard passes `tsc`, passes the
  tests, and changes nothing on screen.
- **A test can cover a branch the app cannot reach.** `[u6#c5] (a)` seated a
  sentence that was slotted but not mined, which the engine forbids, so a dead
  CSS rule stayed green for weeks. When a PRD claims a state is rendered, it
  names the path that produces it.
- **Layout is TypeScript, not CSS** — `src/client/shell/layout.ts:65-111`.
- **Species derives from the id channel, never from classification**
  (`docs/spec-client.md` §5.2). The field is data; only its display is cosmetic.
- **Agent-log timestamps are engine data** feeding the run artifacts. Presentation
  pacing is a client-side queue and never a timestamp edit.
- **`dist/` is a player surface.** Anything published is fetchable by URL, so the
  gate invariant applies to the pack as shipped, not only to what is drawn.
  `vite.config.ts` publishes by file and strips design-only fields from
  `gates.json` and `score.json`; `tests/scaffold/published-data.test.ts` holds
  both to the premise that no seam reads what is stripped.
- **Two composition roots** must stay in step: `src/client/driver/live/bind.ts`
  and `tools/driver/run/bind.mjs`.
- **The membrane rule and the gate invariant** (/CLAUDE.md, `docs/spec-client.md` §3)
  outrank any instruction in a PRD. Restate them in units that touch player-facing
  text.

### 5.5 Verification

`npm run check` is the **type gate** — `tsc` over core and client,
`typecheck:test`, `datapack:check`, and `test:shared` (`node --test` over
`tools/tests/*.mjs`). **It does not run vitest.** Every vitest suite, including
every structure test in §5.4, runs only under `npm run test`. `npm run build`
adds the Vite build and is the only way to see what actually ships.

Client-facing units name both commands. A unit that changes what reaches the
browser names `npm run build` and an inspection of `dist/`. A PRD whose
verification is only "it looks right" is not ready to hand over.

### 5.6 Handoff

Each PRD is a file, committed before the executor starts — an inline prompt is
lost when the process dies. The executor works on its own branch, opens a PR,
and merges nothing. Review is by the author, against the Done-when checklist.
`main` stays deployable, and repo hard rules 1–6 apply to executor commits
exactly as to hand-written ones.
