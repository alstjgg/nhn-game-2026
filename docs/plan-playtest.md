# plan-playtest — 2026-08-05 playtest triage

> Source: 민서 playtest of the deployed Pages build (live proxy, 우는다리, tally empty).
> Tiebreaker for priority: **mechanism legibility** — the C-BLOCK loop (block choice →
> interpretation shift → stance change → visible result) must read clearly.
> Cut line against the ~08-10 deadline is §4. Rules live in /CLAUDE.md; state in status.md.

## 0. Two readings that change what the items are

**(a) "RUN" is not misdefined in the engine — it is mislabeled in the client.**
`src/runloop/run-loop.ts:30-45` already holds a run as one whole day (08:50→21:04)
with gates as beats inside it; `src/client/shell/run-state.ts:41-60` states
reports are per **round**, "never a run". The defect is that
`src/client/components/report-archive.ts:30-62` prints `RUN nn` over
round-scoped tabs. So G3 is a rename + archive-persistence job, not a
redefinition. This is the single largest cost saving in this document.

**(b) The gate-exposure items are invariant violations, not feature requests.**
The 08-03 decision log already binds "the archive's segmentation must not expose
gate structure to the player", and `docs/spec-client.md` §3 carries
review-blocking invariants. Everything in §1.G is a **bug** against a rule we
already wrote. They do not compete with feature work for schedule; they precede it.

## 1. Items

### G — Gate exposure (invariant violations)

| id | item | where | cost |
|---|---|---|---|
| G1 | LIVE FEED prints "갈림길(G1)의 자리" | vocabulary is `src/shared/datapack.ts:85,132,134,217` + `data/scenario/우는다리/timeline.json`; surfaced via `src/client/components/dossier.ts:102` | S |
| G2 | LIVE FEED prints "일부 회신 실패 — 해당 구간만 기본 응답" | `src/client/components/fallback-notice.ts:28-30`, announced at `src/client/shell/announcer.ts:29` | S |
| G3 | REPORTS tabs labeled `RUN01`… over round-scoped content | `src/client/components/report-archive.ts:30-62` (it *throws* if the label names anything but run+time — that guard must be re-authored, not bypassed) | M |
| G4 | AGENT FILE 행동원칙 says "매 갈림길에서", "하나의 태도를 고르고" | authored text in the datapack temperament/principles, rendered by `src/client/components/dossier.ts` | S |

G2 note: the fallback notice exists to tell the player the world got *less*
responsive, which is honest. Replace it with a diegetic degradation signal —
radio static, "회신 불량", a signal-strength mark — rather than deleting it. Silent
degradation makes an LLM failure read as a design choice, which is worse.

G3 note: three separate things are fused in this item and should be split at
implementation time — (i) the label vocabulary, (ii) whether a tab is a round or
a run, (iii) whether past runs persist (that part is U5.1, not G3).

### T — Text volume

| id | item | resolution | depends on |
|---|---|---|---|
| T1 | BLOCK STORE duplicates report sentences | remove the window; move its one real function (cross-run mined-sentence overview) into the report itself — highlight mined sentences and stamp the agent number that used them | U5.2 |
| T2 | Radio reports too long to read before the next event | `data/policy/report-guidance.json:11` is char-bounded (300–1200자); lower `max_chars`. Data-only change | — |
| T3 | Layout: 3 windows — REPORTS left (large), LIVE FEED top-right, AGENT FILE bottom-right | `src/client/shell/layout.ts:65-111` (grid is TS constants, not CSS) | T1 |

T2 caution: report length is an input to the measured mechanism, and shortening
it changes both what is mineable and the Call-3 latency figure recorded on
08-04. Change the number, then re-run one probe before trusting the run records.

### C — Concept / naming

| id | item | note |
|---|---|---|
| C1 | AGENT FILE becomes a **paged dossier**, not a scroll — p1 title/문서번호/임무/행동원칙/기질/보고지침, p2 식별/호출부호/알고있는 문장 | enables U5.3; touches `src/client/components/dossier.ts`, `slot-board.ts` |
| C2 | Rename "알고 있는 문장" → 행동 지침 / 임무 인수인계 사항 (operational framing) | `dossier.ts:107`, `slot-board.ts:1` |
| C3 | Rename "보고 지침" to match the new report concept (need not be the literal prompt) | `dossier.ts` |
| C4 | Rename 객관로그 → 현장 기록, 요원 보고서 → 무전 기록 | `src/client/components/report-view.ts:124`; note 객관로그 currently appears only in docs, the client says "facts/objective log" (`docs/spec-client.md:152`) |

C2/C3/C4 are pure copy and can all land in one commit. They are cheap and they
carry disproportionate weight for a judge, because naming is most of what makes
the fiction cohere in a text game.

### U — Usability

| id | item | resolution | risk |
|---|---|---|---|
| U1 | LIVE FEED dumps many lines at once | client-side **reveal queue** — one sentence at a time, paced. Do **not** change agent-log timestamps: those are engine data and feed the run artifacts | low |
| U2 | 4 slots too few → 10, and drag sentences rather than "cards" | `SLOT_CAP` at `src/client/components/slot-board.ts:19`; it is a U-owned §9 parameter (`docs/spec-client.md:149,362,387`), not a datapack field | **HIGH — see below** |
| U3 | Remove TALLY screen; merge NEW RUN into DEPLOY; show casualties/results in 현장 기록 as unmineable, visually distinct records | `src/client/windows/tally.ts:45-46,126-130`, `src/client/components/deploy-button.ts:43-97`, driver ops at `src/client/driver/live/adapter.ts:380-383` | med |
| U5.1 | REPORTS tabs → ECHO-1, ECHO-2…, each opening that past sitting's 현장 기록 + 무전 기록 | needs a persistent archive; `src/runloop/meta-state.ts` already has `report_archive` | med |
| U5.2 | Mined+deployed sentences highlighted in the report, with the agent number that used them | currently only greys out (`src/client/styles/win-reports.css:71-73`); state machine at `minable-sentence.ts:20-115` | — |
| U5.3 | AGENT FILE gains one page per ECHO-*; new simulation appends a page, flip back to read past instructions | depends on C1 | med |

**U2 is the one item in this document that can break the game's central claim.**
C-BLOCK was measured at **one** sentence injected into `[알려진 것]`
(9/10 stance shift, one-sided Fisher p=0.0000595). Ten simultaneous sentences is
untested: the effect may dilute, saturate, or become unattributable — and if the
player cannot tell *which* sentence moved the agent, the core loop stops being
legible, which is exactly the axis you chose as the tiebreaker. It also grows the
Call-1 prompt, and judgment already runs 3.1–4.0 s.
Recommendation: raise to **6**, not 10, and only after one probe arm at the new
cap. If the probe is not affordable before 08-10, ship 4 and note the cap as a
tuned parameter. A larger deck is a stronger *feeling* of agency and a weaker
*demonstration* of mechanism.

### M — Misc

| id | item | where |
|---|---|---|
| M1 | Agent callsign increments per re-run (ECHO-1, ECHO-2…) | `src/client/components/dossier.ts:19` is a hard constant `CALLSIGN = 'ECHO-1'`; also `run-feed.ts:60`, `report-view.ts:124,143` |
| M2 | Drop species tags ('자기서술') from mined sentences | tag is **derived from the block id channel**, not authored text (`src/shared/species.ts:8-20,45-52,78`, applied `block-card.ts:89-112`); hiding the label is a view change, but `species-filter.ts:22-52` filters on it — decide whether the filter goes too |

M1 is not cosmetic: it is the cheapest possible piece of U5. Distinct callsigns
per sitting are what make "these are different attempts" legible before any
archive UI exists.

## 2. Dependency order

```
G1, G2, G4, C2, C3, C4, M1, T2          ← no dependencies, all small
        │
M1 ──► U5.1 (ECHO tabs) ──┐
                          ├──► U5 history complete
C1 (paged dossier) ──► U5.3 ──┘
        │
U5.2 (report highlight + agent no.) ──► T1 (remove BLOCK STORE) ──► T3 (relayout)
        │
G3 (label/scope of report tabs) ──► U5.1
        │
U3 (kill TALLY, merge NEW RUN into DEPLOY) — independent, but touches the same
   driver op path as DEPLOY; do not run it in parallel with C1
U2 (slot cap) — independent of all of the above; gated on a probe, not on code
```

Two chains dominate: **M1 → U5.1** and **U5.2 → T1 → T3**. Everything else is
either free-standing or small. The critical path is the second chain, because T3
is the layout change and it cannot start until BLOCK STORE's function has a new
home.

## 3. What is actually one piece of work

Grouped for implementation, in the order I would ship them:

1. **Copy pass** — G1, G2, G4, C2, C3, C4, M1, T2. One branch. Removes every
   known gate leak and every naming mismatch, plus the callsign counter. Mostly
   string and data edits; touches no state.
2. **Report becomes the archive** — U5.2, then T1, then T3. This is the
   text-volume fix and the layout change, and it is the biggest visible
   improvement per hour spent.
3. **History** — G3 scope decision, U5.1, C1, U5.3. The paged dossier is the
   expensive half; U5.1 alone delivers most of the value.
4. **Flow** — U3. Removing the TALLY interstitial makes the loop continuous,
   which matters for a judge's first 60 seconds.
5. **Slot cap** — U2, probe first.

## 4. Cut line (~08-10, five days, deployed build must stay green)

**Ships by 08-10 (must):** group 1 entire · U5.2 · T1 · T3 · M1.
Rationale: group 1 is invariant repair and near-free; the T-chain is the fatigue
fix and the layout you drew. Without these the build is both leaking gate
structure and hard to read.

**Ships if time (should):** U5.1 · U3.
Both are real improvements to legibility and flow, neither is load-bearing for a
correct demo. U5.1 before U3 if only one fits.

**Post-deadline (won't):** C1 + U5.3 (paged dossier) · U2 (slot cap).
The dossier is a presentation rebuild competing directly with the T-chain for the
same hours, and it is the lower-value of the two. U2 is out not because it is
expensive but because raising the cap without a probe risks the mechanism claim
five days before submission — and the mechanism claim is the entry.

**Not in this document but competing for the same days:** predicate authoring +
`ScorerPort` (status.md 08-05). The tally ledger being empty is a correctness
hole in the scoring story; note that U3 *removes the TALLY window*, which means
those two efforts must agree on where scores surface before either starts.
That conflict is the one thing here that needs a decision from both members.

## 5. Open questions for 민서

1. U3 vs the empty-tally work: if TALLY dies, do run scores surface in 현장 기록,
   or does scoring drop from the demo entirely? Both are defensible; they are
   not both free.
2. G2: is a diegetic degradation signal acceptable, or should LLM failure be
   fully invisible to the player?
3. M2: does the species *filter* survive the tag removal, or does the whole
   species affordance go?
