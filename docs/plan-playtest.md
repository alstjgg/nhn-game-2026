# plan-playtest — 2026-08-05 playtest triage

> Source: 민서 playtest of the deployed Pages build (live proxy, 우는다리).
> Priority tiebreaker: **mechanism legibility** — the C-BLOCK loop (block choice →
> interpretation shift → stance change → visible result) must read clearly.
> Cut line against the ~08-10 deadline is §4. Rules live in /CLAUDE.md; state in status.md.

## 0. Frame

A run is one whole day, 08:50→21:04 (`src/runloop/run-loop.ts:30-45`). Gates are
beats inside a run; reports are per round (`src/client/shell/run-state.ts:41-60`).
The client's `RUN nn` labels contradict this and are corrected in G3.

Gate structure must not reach the player. The 08-03 decision log binds this for
the archive, and `docs/spec-client.md` §3 carries it as a review-blocking
invariant. §1.G items are defects against that rule, not feature requests.

## 1. Items

### G — Gate exposure

| id | item | where | cost |
|---|---|---|---|
| G1 | LIVE FEED prints "갈림길(G1)의 자리" | vocabulary at `src/shared/datapack.ts:85,132,134,217` + `data/scenario/우는다리/timeline.json`; surfaced via `src/client/components/dossier.ts:102` | S |
| G2 | LIVE FEED prints "일부 회신 실패 — 해당 구간만 기본 응답" | `src/client/components/fallback-notice.ts:28-30`; duplicated for screen readers at `src/client/shell/announcer.ts:29` | S |
| G3 | REPORTS tabs labeled `RUN01`… over round-scoped content | `src/client/components/report-archive.ts:30-62`; its label guard rejects anything but run+time and must be re-authored | M |
| G4 | AGENT FILE 행동원칙 says "매 갈림길에서", "하나의 태도를 고르고" | authored temperament/principles text in the datapack, rendered by `src/client/components/dossier.ts` | S |

G2 keeps the notice and changes only its register: it names a **transmission**
fault, never a reasoning or gate one — `회신 불량` · `네트워크 지연 중` ·
`서버 이상 — 요원과 재접선 시도 중`. Each of the three severities (fatal / local /
supply-cut) gets its own line, and `announcer.ts:29` changes with it.

G3 splits at implementation into label vocabulary, tab scope (round vs run), and
archive persistence. The third is U5.1.

### T — Text volume

| id | item | resolution | depends on |
|---|---|---|---|
| T1 | BLOCK STORE duplicates report sentences | remove the window; its one distinct function — a cross-run view of mined sentences — moves into the report itself | U5.2 |
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
| C4 | 객관로그 → 현장 기록, 요원 보고서 → 무전 기록 | `src/client/components/report-view.ts:124` |

C2–C4 are copy and land in one commit.

### U — Usability

| id | item | resolution |
|---|---|---|
| U1 | LIVE FEED emits many lines at once | client-side reveal queue, one sentence at a time, paced. Agent-log timestamps are engine data feeding the run artifacts and do not change |
| U2 | 4 slots too few; drag sentences rather than cards | `SLOT_CAP` at `src/client/components/slot-board.ts:19`; a U-owned §9 parameter (`docs/spec-client.md:149,362,387`), not a datapack field |
| U3 | Remove TALLY; merge NEW RUN into DEPLOY; casualties and results appear in 현장 기록 as unmineable, visually distinct records | `src/client/windows/tally.ts:45-46,126-130`, `src/client/components/deploy-button.ts:43-97`, driver ops at `src/client/driver/live/adapter.ts:380-383` |
| U5.1 | REPORTS tabs → ECHO-1, ECHO-2…, each opening that sitting's 현장 기록 + 무전 기록 | needs a persistent archive; `src/runloop/meta-state.ts` carries `report_archive` |
| U5.2 | Mined and deployed sentences highlighted in the report, stamped with the agent number that used them | currently only greys out (`src/client/styles/win-reports.css:71-73`); state machine at `components/minable-sentence.ts:20-115` |
| U5.3 | AGENT FILE gains one page per ECHO-*; a new simulation appends a page, and flipping back reads past instructions | depends on C1 |

U3 carries two layers of score across: the headline 사망 count
(`tally.ts:42`) and the rows, which are the 8 units of
`data/scenario/우는다리/score.json` graded against its `baseline_summary`. Both
land in 현장 기록; the death count is the last line of the day. `ScorerPort` and
the unit predicates are the upstream work (status.md 08-05) and are unaffected by
where the output draws — building the scorer straight into 현장 기록 avoids
building it into TALLY first.

U2 raises a mechanism risk. C-BLOCK was measured with **one** sentence injected
into `[알려진 것]` (9/10 stance shift, one-sided Fisher p=0.0000595). At ten
simultaneous sentences the effect may dilute or saturate, and the player may not
be able to attribute the shift to a specific sentence — which is the legibility
the core loop depends on. It also grows the Call-1 prompt, already 3.1–4.0 s.
Raise to 6 behind one probe arm at the new cap, or hold at 4 and record the cap
as a tuned parameter.

### M — Misc

| id | item | where |
|---|---|---|
| M1 | Agent callsign increments per simulation (ECHO-1, ECHO-2…) | `src/client/components/dossier.ts:19` holds `CALLSIGN = 'ECHO-1'` as a constant; also `run-feed.ts:60`, `report-view.ts:124,143` |
| M2 | Species tags ('자기서술') removed from display, and from the dataset where possible | label comes from `blockCardModel().ko` (`components/block-card.ts:106-121`), which `slot-board.ts`, `agent-file.ts` and `deploy-button.ts` also import; the species filter (`components/species-filter.ts`) is used only by BLOCK STORE and goes with T1 |

M1 is the cheapest piece of U5: distinct callsigns make separate attempts
legible before any archive UI exists.

M2's `species` field is minted from the id channel (`src/shared/id.ts:68,91`),
typed on the wire (`src/shared/view-driver.ts:18`), set by the engine
(`src/engine/feed/report.ts:65,71`) and authored in `gates.json`
(`key_conditions[].species`). Display removal is unconditional; field removal is
only available if those consumers are retired with it.

## 2. Dependency order

```
G1, G2, G4, C2, C3, C4, M1, M2, T2      ← no dependencies, all small
        │
M1 ──► U5.1 ──┐
G3 ──► U5.1   ├──► U5 history complete
C1 ──► U5.3 ──┘
        │
U5.2 ──► T1 ──► T3
        │
ScorerPort + unit predicates ──► U3
U2 ──► probe at the new cap (independent of everything above)
```

Two chains dominate: **M1 → U5.1** and **U5.2 → T1 → T3**. The second is the
critical path, because T3 is the layout change and cannot start until BLOCK
STORE's function has a new home.

## 3. Work groups

1. **Copy pass** — G1, G2, G4, C2, C3, C4, M1, M2, T2. One branch; strings and
   data only, no state touched.
2. **Report becomes the archive** — U5.2 → T1 → T3. The text-volume fix and the
   layout change; largest visible gain per hour.
3. **Ending** — U3, on top of `ScorerPort`.
4. **History** — G3 scope, U5.1, then C1 → U5.3.
5. **Slot cap** — U2, probe first.

## 4. Cut line (~08-10; the deployed build stays green)

**Must:** group 1 · U5.2 · T1 · T3 · U3.
Group 1 closes every known gate leak at near-zero cost. The T-chain is the
fatigue fix and the layout above. U3 makes the loop continuous and gives the
scorer its surface.

**Should:** U5.1.
Real legibility gain, not load-bearing for a correct demo.

**Won't:** C1 · U5.3 · U2.
The paged dossier competes directly with the T-chain for the same hours at lower
value. U2 is deferred because raising the cap without a probe risks the
mechanism claim five days before submission.
