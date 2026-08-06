# U3 — the day ends on the desk: TALLY dissolves into 현장 기록 and DEPLOY

> plan-playtest.md **v7** · authored 2026-08-07 against tree `14dd971`.
> **Executes after group 2 merges.** Product-code citations below were verified
> against today's tree; the §"Stamp scope" periphery (tests · e2e · spec rows) is
> enumerated with anchors but is re-verified line-by-line at stamp time — two
> groups land in between, and G2 has already moved `announcer.ts`'s lines.
> Executor: Sonnet-class session. Branch `playtest/g3-1-u3` off current `main`.
> One commit, message: `playtest(U3): TALLY dissolves — results into 현장 기록, NEW RUN into DEPLOY`.
> Open a PR; merge nothing (§5.6). Confirm `git config user.email` resolves to the
> `alstjgg` account first (hard rule 1).

## Outcome

There is no TALLY window. At 21:04 the day's results — casualties and the scored
rows against the untouched-day baseline — appear **inside the 현장 기록** as a
visually distinct, unmineable terminal record, with the same ~9 s count-up that
absorbs the report call. The DEPLOY control at the foot of the AGENT FILE
carries the day's turn: after the run closes and the report arrives (or the
30 s ceiling lapses), the same control becomes **NEW RUN — 다음 시행 · 08:50으로**;
pressing it opens the next day. On the last day it says the allotment is spent.
The taskbar shows four windows.

## Design (author-resolved)

1. **`score-tally.ts` survives whole and moves house.** REPORTS subscribes to
   `score` and, on the run's end, appends `<article class="terminal-record">`
   after the facts list inside the 현장 기록 document, then mounts
   `createScoreTally({ host, onFinal })` into it. The count-up, pacing constants,
   `settleRelease`, and their entire test suite (`[u7#c2]`) survive unchanged.
   The record renders no `.min` node and no `sentence_id` — unmineable by
   construction.
2. **`run-state` moves its home, not its shape.** `createRunState(driver)` is
   instantiated today inside `tally.ts:117` — its only call site. It moves into
   `windows/agent-file.ts`'s mount. `run-state.ts` itself is untouched: the
   reducer keeps the `'tally'` phase (now meaning "the day is closed, awaiting
   the turn"), so `[u7#c1]`'s pure-reducer suite stays green with zero diff.
3. **The merged control.** `DeployState` gains the post-run facts
   (`closed`, `releasable`, `spent`, `nextAt`); `deployView()` gains
   `mode: 'deploy' | 'settling' | 'next' | 'spent'`. The button's `data-op`
   swaps `deploy` ↔ `new_run` with the mode (both drivers already answer
   `{op:'new_run'}` with a synchronous ok/refusal; the adapter needs no change).
   Disable-before-send and refusal-rendering (`SPENT`) move from `tally.ts`'s
   click handler into the control. The hold machinery
   (`armHold`/`dropHold`/`settle`, `PACE.HOLD_CEIL`) moves from `tally.ts` into
   `agent-file.ts` almost verbatim.
4. **`counted` is redefined without a cross-window channel** (C8: no window
   reaches into a sibling). It was "the ledger's count-up finished", delivered
   by `onFinal` inside the same window. Now: `counted` = a `score` event was
   seen **and** `PACE.TOTAL_MS` has elapsed since (one `setTimeout` in
   agent-file — the same wall-clock idiom `tally.ts` already uses for the hold).
   `settleRelease({counted, filed, lapsed})` stays the pure decision it is.
5. **The wait line and the spoken lines move with the control.** The deploy
   zone's note shows `……보고서 정리 중` while settling; the announces keep the
   `SAY_HOLD_TAIL` / `SAY_FILED_TAIL` / `SAY_LAPSED_TAIL` / `SPENT` copy so the
   a11y toast assertions keep their needles (`보고서 정리 중`,
   `보고서가 도착하지 않았습니다`). `부검 창` wording inside `FILED_TAIL`/`LAPSED_TAIL`
   is kept as-is (the REPORTS window's ko name is untouched by this unit).
6. **The announcer's close line** (`RUN_CLOSED`, unasserted anywhere) becomes:
   `'시뮬레이션 종료 — 결과는 현장 기록으로'`.
7. **Removal surface**: `windows/tally.ts` deleted · `window-registry.ts:42`
   row removed (`WindowKey` narrows) · `layout.ts` drops `'tally'` from
   `WINDOW_KEYS`/`DESK_ORDER`, the tally rect, and `TALLY_W`/`TALLY_INSET`/
   `TALLY_MAX_H` · `win-tally.css` deleted, with the `.tly-*` selectors that
   `score-tally` renders (`tly-head`/`tly-headline`/`tly-table`/`tly-verdict`/
   `rowIn`) **moved** into `win-reports.css` scoped under `.terminal-record`,
   and the frame/foot/`btn-newrun` rules dropped · the `@import` row leaves
   `index.css` · the `__tally` DEV handle is replaced by the record's own
   `data-tally-state` attribute, which `score-tally` already paints.

## Scope

May modify:

- `src/client/windows/tally.ts` — **deleted**.
- `src/client/windows/reports.ts` · `src/client/windows/agent-file.ts` ·
  `src/client/components/deploy-button.ts`
- `src/client/shell/window-registry.ts` · `src/client/shell/layout.ts` ·
  `src/client/shell/announcer.ts` (one string)
- `src/client/styles/win-tally.css` (deleted) · `win-reports.css` ·
  `win-agent-file.css` · `index.css`
- `docs/spec-client.md` — the normative rows enumerated in Stamp scope.
- The tests and e2e files enumerated in Stamp scope.

Must NOT modify:

- `src/client/shell/run-state.ts` — the reducer, the `'tally'` phase, and the
  persistence stay byte-identical; only the instantiation site moves.
- `src/client/components/score-tally.ts` — consumed as-is. If a change there
  seems needed, stop and report per §5.7.
- `src/client/driver/live/adapter.ts` — the plan once listed it; the audit shows
  its `new_run` guard already serves a merged control (disable-before-send +
  refusal answer). The §5.4 `kick()` trap stands: do not touch this file.
- `src/client/driver/fixtures/run-loop.ts` — both drivers' `new_run` behavior is
  the contract the control rides.

## Change list — product core (verified 2026-08-07; line numbers re-stamped)

The full verbatim rows are issued at stamp time against the post-group-2 tree.
The anchors below are the verified shape of each edit:

- `window-registry.ts:42` — the tally row (verbatim on file) is removed;
  `import { mount as mountTally } ...` at `:14` goes with it.
- `layout.ts:33` `WINDOW_KEYS = ['feed', 'file', 'store', 'rep', 'tally']` →
  drops `'tally'`; `:50` `DESK_ORDER` likewise; `:76-80` the three `TALLY_*`
  consts and `:100-102` the tally box math and `:109` the `tally:` rect row are
  removed.
- `announcer.ts` — `RUN_CLOSED = '시뮬레이션 종료 · 집계 개시'` (at `:31` today,
  shifted by G2's map) → `'시뮬레이션 종료 — 결과는 현장 기록으로'`.
- `deploy-button.ts:19-40` — `DeployView` gains `mode`, `mainLabel`, `subLine`;
  `DeployState` gains `closed: boolean`, `releasable: boolean`, `spent: boolean`,
  `nextAt: string`. `deployView()` resolves the mode:
  `spent → 'spent'` · `closed && !releasable → 'settling'` ·
  `closed && releasable → 'next'` · otherwise today's two states. The builder
  swaps `bd-main`/`bd-sub` text and `deploy.dataset.op` per mode
  (`'next'`/`'spent'` → `new_run`, else `deploy`); `NEW_RUN` strings move in
  from `tally.ts:46-48` (`'NEW RUN'` · `'다음 시행 · '` · `'으로'`), with
  `nextAt` = the identity's `start` that `agent-file.ts` already fetches.
- `agent-file.ts` — mounts `createRunState(driver)`; ports `tally.ts:143-182`'s
  hold/settle block (with `counted` per design #4 and the four announce strings
  `SAY_HOLD_TAIL`/`SAY_FILED_TAIL`/`SAY_LAPSED_TAIL`/`SPENT` verbatim from
  `tally.ts:57,79-81`); wires the merged button's click:
  disable → `driver.send({ op: 'new_run' })` → on refusal print `SPENT` +
  announce, mirroring `tally.ts:196-210`.
- `reports.ts` — subscribes `score`; on it builds the terminal record from the
  event's own `total`/`baseline_total`/`rows` (never from a pack read — inv 12),
  appends `.terminal-record` after the facts list, mounts
  `createScoreTally({host, onFinal})` (its `onFinal` is unused by the control —
  design #4 — but keeps the ledger's own `final` paint), and marks the article
  `aria-label="시행 결과"`. A second `score` in one round replaces the record.
- CSS — `win-reports.css` gains `.terminal-record{...}` (inset ledger stock,
  `--space-*`/token colors, top rule) and the relocated `.tly-*` rules scoped
  `.terminal-record .tly-...`; `win-agent-file.css` gains nothing (the button
  reuses `.btn-deploy`/`.bd-main`/`.bd-sub`).

## Stamp scope — enumerated periphery, line-verified at stamp time

- **vitest**: `tests/windows/tally.test.ts` — `[u7#c1]` (reducer) and `[u7#c2]`
  (score-tally cadence) survive; `[u7#c3]`'s tally.ts source scans, `[u7#c6]`,
  `[u7#c9]`, and the `:730` `UNIT_FILES` assert are rewritten against the new
  homes (`agent-file.ts` carries the disable-before-send scan target).
  `tests/shell/window-registry.test.ts` (five→four, `:43,49,97,102,114`) ·
  `tests/shell/shell-utils.ts:19,28` · `tests/styles/css-utils.ts:25`
  (sheet list) · `tests/styles/stacking-context.test.ts:158` ·
  `tests/invariants/no-digit-npc.test.ts:182-206` — the digit-allowed selector
  list swaps `.tly-*`-in-`#w-tally` for `.terminal-record` in `#w-rep`.
- **e2e**: `fixtures/harness.ts:123-137` `awaitTallyReveal` → awaits
  `#w-rep .terminal-record[data-tally-state="final"]`; `expectTallyOpen`
  (`:148-150`) retired; `drain()` keeps folding the new wait. `a11y.spec.ts:31`
  and `debug-pane.spec.ts:37` `WINDOW_IDS` → four ids; `shell.spec.ts:33` row;
  `a11y.spec.ts:477` / `shell.spec.ts:731` (the phase-held-window allowance —
  no window is phase-held now); `a11y.spec.ts:34,361` membrane census — resolved
  at stamp after reading how the census snapshots ops (the control's `data-op`
  swaps by mode; the census must accept the swap or scan both phases);
  `run-loop.spec.ts` / `red-thread.spec.ts` (`takeNextRun`) /
  `reports.spec.ts` / `block-store.spec.ts` / `acceptance.spec.ts` — NEW RUN
  clicks retarget `#w-file #btnDeploy` in mode `next`; `captures.spec.ts` — the
  two tally reference shots (`win-tally`, `tally-countup-final`) become
  terminal-record shots; `preview-smoke.spec.ts:116,121` — `__tally` leaves the
  needle list's subjects (the handle no longer exists).
- **spec-client.md** (normative — flagged for 윤석's review in the PR): `:38-39`
  and `:143`/`:341` five→four windows; `:153` the TALLY §4 row folds into the
  REPORTS row (terminal record); `:168-169` §5.1 keeps the TALLY **phase**,
  reworded to name its two surfaces (terminal record + merged control); `:303`
  `ScoreTally` row's host; `:366` unchanged (the ~9 s count-up survives).

## Invariants

- **Invariant 6**: the record renders score labels from the `score` event only —
  no gate names, no pack read from a view (inv 12).
- **Membrane census**: the desk must expose a control for every op —
  `deploy` and `new_run` both live on the merged button across its modes.
- **Digits**: score digits are allowed only inside the record's selectors —
  extend the exclusion list, never relax the scan.
- **Scenario-replaceable**: `nextAt` comes from the identity fetch; `사망`/`명`
  headline copy moves verbatim from `tally.ts:42-43` (grandfathered literal,
  relocated not re-minted).
- `main` stays deployable: this PR merges only when the full suite and the e2e
  suite are green.

## Verification

1. `npm run test` — green after the enumerated amendments.
2. `npm run build` — green; `dist/` contains no `w-tally` markup.
3. `npm run test:e2e` — full suite green after the enumerated amendments.
4. Behavioral (DEV): run a full day — at 21:04 the 현장 기록 gains the results
   record and counts up ~9 s; the AGENT FILE's control turns into
   `NEW RUN 다음 시행 · 08:50으로` once the report lands; pressing it opens the
   next day (dossier reads the next callsign); on the loop's last day the
   control prints `잔여 시행 없음 — 마지막 집계입니다` and goes dead; no fifth
   window or taskbar button exists anywhere.

## Done when

- [ ] `windows/tally.ts` and `win-tally.css` are gone; four windows mount; the desk lays out without a tally rect.
- [ ] Steps 1–3 green, in order, post-commit.
- [ ] The full behavioral sequence in check 4, including the spent state on the final day.
- [ ] Record sentences cannot be mined (no `.min`, no `sentence_id` inside `.terminal-record`).
- [ ] `git grep -n "w-tally\|__tally\|btnNewRun"` over `src/` returns nothing.
- [ ] PR opened from `playtest/g3-1-u3`; nothing merged.

## If this PRD is wrong

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
