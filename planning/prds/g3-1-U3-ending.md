# U3 — the day ends on the desk: TALLY dissolves into 현장 기록 and DEPLOY

> plan-playtest.md **v11** · stamped against `e9388b6` · branch `playtest/g3-1-u3` ·
> one commit: `playtest(U3): TALLY dissolves — results into 현장 기록, NEW RUN into DEPLOY`.

## Outcome

There is no TALLY window. At 21:04 the day's results — casualties and the scored
rows against the untouched-day baseline — appear **inside the 현장 기록** (REPORTS)
as a visually distinct, unmineable terminal record, with the same ~9 s count-up
that absorbs the report call. The DEPLOY control at the foot of the AGENT FILE
carries the day's turn: after the run closes and the report arrives (or the 30 s
ceiling lapses), the same control becomes **NEW RUN — 다음 시행 · 08:50으로**;
pressing it opens the next day. On the last day it says the allotment is spent.
The taskbar shows four windows.

## Design (author-resolved)

1. **`score-tally.ts` survives whole and moves house.** REPORTS subscribes to
   `score` and appends `<article class="terminal-record" aria-label="시행 결과">`
   into its own host's facts document (`host.querySelector('article.doc-facts')`,
   built by `report-view.ts:142`), after `#factsList`, then mounts
   `createScoreTally({ host: article })` and drives `open()` + `run(model)`.
   The count-up, `PACE`, `settleRelease`, and their entire test suite (`[u7#c2]`)
   survive unchanged. The record renders no `.min` node and no `sentence_id` —
   unmineable by construction. There is ONE record: the next `score` replaces
   the article whole; it persists on the desk between days, as a record in an
   autopsy window naturally would. `report-view.ts` is NOT edited — its
   `render()` replaces only `#factsList`'s and the body's children
   (`report-view.ts:253`), so a sibling article inside `.doc-facts` survives
   repaints.
2. **`run-state` moves its home, not its shape.** `createRunState(driver)` is
   instantiated today at `tally.ts:117` — its only call site. It moves into
   `windows/agent-file.ts`'s mount. `run-state.ts` itself is untouched: the
   reducer keeps the `'tally'` phase (now meaning "the day is closed, awaiting
   the turn"), so `[u7#c1]`'s suite stays green with zero diff.
3. **The merged control.** `DeployState` gains `closed?: boolean`,
   `releasable?: boolean`, `spent?: boolean`, `nextAt?: string` — **optional
   with absent-means-false/`''` defaults**, so `[u4#c4]`'s existing
   `deployView()` call sites and its typed mirror
   (`tests/windows/agent-file.test.ts:155-159,557+`) compile and pass
   untouched; `DeployView` gains
   `mode: 'deploy' | 'settling' | 'next' | 'spent'`, `mainLabel: string`,
   `subLine: string`. `deployView()` (`deploy-button.ts:43`) resolves the mode:
   `spent → 'spent'` · `closed && !releasable → 'settling'` ·
   `closed && releasable → 'next'` · otherwise today's two states map to
   `'deploy'`. The zone builder (`buildDeployZone`, `:64`) swaps the button's
   `bd-main`/`bd-sub` text and `deploy.dataset.op` per mode (`'next'`/`'spent'`
   → `new_run`, else `deploy`; today's literals sit at `:76-77`). The `NEW RUN`
   strings move in verbatim from `tally.ts:46-48` (`'NEW RUN'` · `'다음 시행 · '`
   · `'으로'`); `nextAt` = the identity `start` that `agent-file.ts:131` already
   fetches. Disable-before-send and refusal rendering (`SPENT`) move from
   `tally.ts`'s click handler (`:196-210`) into agent-file's wiring.
4. **`counted` is redefined without a cross-window channel** (C8). It was "the
   ledger's count-up finished", delivered by `onFinal` in the same window. Now:
   `counted` = a `score` event was seen **and** `PACE.TOTAL_MS` has elapsed
   since (one `setTimeout` in agent-file — the same wall-clock idiom the ported
   hold already uses). `PACE` (incl. `PACE.HOLD_CEIL`, `score-tally.ts:78`) and
   `settleRelease` are imported from `score-tally.ts` — imports of its exports
   are consumption, not modification.
5. **The wait line and the spoken lines move with the control.** The deploy
   zone's note (`#deployState`) shows `……보고서 정리 중` while settling; the
   announces keep `SAY_HOLD_TAIL`/`SAY_FILED_TAIL`/`SAY_LAPSED_TAIL`
   (`tally.ts:79-81`) and `SPENT` (`:57`) verbatim, so the a11y toast needles
   (`보고서 정리 중`, `보고서가 도착하지 않았습니다`) hold. `부검 창` wording
   inside `FILED_TAIL`/`LAPSED_TAIL` stays as-is.
6. **The announcer's close line** (`announcer.ts:35`, unasserted anywhere)
   becomes `'시뮬레이션 종료 — 결과는 현장 기록으로'`.
7. **The red-thread suppression dies with the sheet.** `thread-layer.ts:130-135`
   fed `tallyOpen` by querying `#w-tally`; the sheet no longer exists and the
   record (inside REPORTS) does not own the screen. `thread-layer` now passes
   `tallyOpen: false` with a one-line comment; its `TALLY` const (`:35`) is
   deleted. `red-thread.ts` and its suite are untouched (the field's removal is
   ledgered for u8's next pass, not this unit).
8. **The e2e run-state reads move to `__agentFile`.** The `__tally` DEV handle
   (`tally.ts:109,376`) dies with the file; `window.__agentFile`
   (`agent-file.ts:142`, DEV-gated, already a preview-smoke needle) gains
   `phase()` and `meta()` reading the moved run-state store. The record's
   `data-tally-state` is read off the DOM directly (`#w-rep .terminal-record`),
   never via a handle.

## Scope

May modify:

- `src/client/windows/tally.ts` — **deleted** · `src/client/windows/reports.ts` ·
  `src/client/windows/agent-file.ts` · `src/client/components/deploy-button.ts`
- `src/client/shell/window-registry.ts` · `src/client/shell/layout.ts` ·
  `src/client/shell/announcer.ts` (one string) · `src/client/shell/thread-layer.ts`
- `src/client/styles/win-tally.css` (deleted) · `win-reports.css` · `index.css`
- `docs/spec-client.md` — only the rows in E27 (normative: flagged for 윤석 in
  the PR).
- The test/e2e files enumerated in E10–E26, exactly as enumerated.
- `tests/assets/baseline/u1-styles-baseline.json` · `e2e/reference-shots/`
  (two shots replaced — E25).

Must NOT modify:

- `src/client/shell/run-state.ts` — byte-identical; only the instantiation site
  moves.
- `src/client/components/score-tally.ts` — consumed as-is (importing its
  exports is fine). If a change there seems needed, stop and report.
- `src/client/components/red-thread.ts` and `tests/components/red-thread.test.ts`
  — the `tallyOpen` field stays; only `thread-layer.ts`'s feeding of it changes.
- `src/client/components/report-view.ts` — the record is a sibling its render
  cycle never touches.
- `src/client/driver/live/adapter.ts` · `src/client/driver/fixtures/run-loop.ts`
  — both drivers' `new_run` behavior is the contract the control rides.
- Explicit no-edit rows (verified harmless — do not "clean up"):
  `tests/invariants/no-digit-npc.test.ts` (the digit-exclusion list at `:48-58`
  is class-based and the `.tly-*` classes survive relocated),
  `tests/driver/clock-hook-determinism.test.ts:188` (`'__tally'` in a name
  filter — dead but harmless), the sibling-import ban regexes at
  `tests/windows/live-feed.test.ts:450` / `tests/windows/reports.test.ts:605` /
  `tests/windows/block-store.test.ts:672` (a dead alternative in a ban regex
  bans nothing extra), `e2e/preview-smoke.spec.ts:121` (`'__tally'` stays a
  needle — it now guards the handle's permanent absence),
  `e2e/fonts.spec.ts:304` and `e2e/block-store.spec.ts:250-263` (comments),
  `tests/debug/seam-only.test.ts:106`, `tests/windows/agent-file.test.ts`
  (design #3's optional fields keep every call site and the typed mirror
  valid; the file has no timer or import scan the port could trip) and
  `e2e/agent-file.spec.ts` (its `#deployState`/`#btnDeploy` asserts are all
  build-phase, where `deploy` mode reproduces today's two states exactly).

## Change list — src (same-file edits bottom-up)

**E1 — `src/client/windows/tally.ts`: delete the file** — after harvesting per
design: `:196-210` click wiring → agent-file · `:143-182` hold/settle block
(first line `:143` `  let settled = false`) → agent-file · `:117`
`  const store = createRunState(driver)` → agent-file's mount · strings
`:79-81` (`SAY_HOLD_TAIL`/`SAY_FILED_TAIL`/`SAY_LAPSED_TAIL`), `:57` (`SPENT`),
`:50-55` (`FILED_TAIL`/`LAPSED_TAIL`, verbatim), `:46-48` (`NEW_RUN_MAIN`/
`NEW_RUN_SUB`/`NEW_RUN_SUB_TAIL`), `:42-43` (`HEADLINE_LABEL`/`HEADLINE_UNIT` —
these two go to reports.ts; the record's headline copy, relocated not
re-minted) → their new homes per design #3/#5.

**E2 — `src/client/shell/window-registry.ts`** — bottom-up: `:42` the tally row
(first text `  { key: 'tally', id: 'w-tally', en: 'TALLY',`) removed; `:14`
`import { mount as mountTally } from '../windows/tally.ts'` removed.

**E3 — `src/client/shell/layout.ts`** — bottom-up: `:109` the `tally:` rect row ·
`:100-102` the tally box math (`tallyW`/`tallyH`) · `:76-80` `TALLY_W` (`:76`),
`TALLY_INSET` (`:78`), `TALLY_MAX_H` (`:80`) with their doc lines ·
`:50` `DESK_ORDER` drops `'tally'` · `:33` `WINDOW_KEYS` drops `'tally'`.

**E4 — `src/client/shell/announcer.ts:35`**
current: `const RUN_CLOSED = '시뮬레이션 종료 · 집계 개시'`
becomes: `const RUN_CLOSED = '시뮬레이션 종료 — 결과는 현장 기록으로'`

**E5 — `src/client/shell/thread-layer.ts`** — bottom-up: `:130`
`    const tally = root.querySelector(TALLY)` deleted and `:135`
`      tallyOpen: tally !== null && !tally.classList.contains(HIDDEN),` becomes
`      tallyOpen: false, // the TALLY sheet is gone (U3) — field ledgered for u8`;
`:35` `const TALLY = '#w-tally'` deleted (and `HIDDEN` only if it loses its
last use — check first).

**E6 — `src/client/components/deploy-button.ts`** — per design #3: the
interfaces (`:19-40`) gain the listed fields; `deployView()` (`:43`) resolves
`mode`/`mainLabel`/`subLine`; `buildDeployZone` (`:64`) applies them (today's
hardcoded label/op at `:76-77` become mode-driven). Follow the file's existing
update idiom for re-rendering on state change.

**E7 — `src/client/windows/agent-file.ts`** — mounts `createRunState(driver)`;
ports the hold/settle block and click wiring per E1, with `counted` per design
#4; drives the merged control through `deployView()`; `#deployState` carries
the settling note; `__agentFile` (`:142`) gains `phase()`/`meta()` per design
#8. New imports: `createRunState` from `../shell/run-state.ts`; `PACE`,
`settleRelease` from `../components/score-tally.ts`.

**E8 — `src/client/windows/reports.ts`** — subscribes `score`; builds the
terminal record per design #1 from the event's own `total`/`baseline_total`/
`rows` (never a pack read — inv 12); headline copy from E1's `:42-43` harvest.

**E9 — CSS** — `win-tally.css` deleted; its `.tly-*` rules that `score-tally`
renders (`tly-head`/`tly-doc`/`tly-sub`/`tly-headline`/`tly-table` and the
`th-*`/`tr-*`/`rowIn` rules) **move** into `win-reports.css` scoped under
`.terminal-record`, plus a `.terminal-record{...}` frame (inset ledger stock,
existing `--space-*`/color tokens, top rule); the sheet-frame/foot/
`btn-newrun`/`tly-wait` rules die with the file; `index.css:18`
`@import './win-tally.css';` removed.

## Change list — tests (vitest)

**E10 — `tests/shell/shell-utils.ts`** — bottom-up: `:28` `  tally: 'tally.ts',`
leaves `WINDOW_MODULES`; `:19` `WINDOW_KEYS` drops `'tally'`; `:18` comment
five→four. (Every five-window count in `window-registry.test.ts` derives from
this — verified: that file hardcodes no `5`, no `'tally'`.)

**E11 — `tests/shell/window-registry.test.ts`** — titles only: `:43`
`describe('[u3#c6] the five window stubs exist'` and `:49` `it('(b) windows/
holds exactly the five modules and no barrel'` — five→four; comments `:3`/`:5`.

**E12 — `tests/styles/css-utils.ts:25`** — `  'win-tally.css',` leaves
`WINDOW_SHEETS`.

**E13 — `tests/styles/stacking-context.test.ts:158`** — `'win-tally.css'`
leaves the inline offenders list.

**E14 — `tests/assets/baseline/u1-styles-baseline.json`** — the
`"win-tally.css"` sha row (`:13`) and the `"./win-tally.css"` indexImports row
(`:24`) removed. **E14a — `tests/assets/fonts-css.test.ts`** — test (c)'s
title `keeps u1’s nine imports` → `eight` (title only; the assertion compares
against the amended baseline).

**E15 — `tests/windows/tally-utils.ts`** — `:20` `TALLY_TS` becomes
`export const AGENT_FILE_TS = path.join(CLIENT, 'windows/agent-file.ts')`;
`:23` `UNIT_FILES = [RUN_STATE_TS, SCORE_TALLY_TS, AGENT_FILE_TS]`. Rename the
references throughout `tally.test.ts`.

**E16 — `tests/windows/tally.test.ts`** — dispositions by block (titles are
load-bearing; keep the `[u7#cN]` markers):
- `[u7#c1]` (`:81-184`) and `[u7#c2]` (`:383-536`): unchanged (they test
  run-state and score-tally, both untouched).
- `[u7#c3]` (`:188-290`): (g) `:259` retargets `sourceOf(AGENT_FILE_TS)` — the
  disable-before-send scan reads agent-file now; (f)/(h)/(i) work off
  `UNIT_FILES`/`RUN_STATE_TS` and follow E15 automatically.
- `[u7#c6]` (`:540-623`): unchanged (scans `UNIT_FILES` via `offenders()`).
- `[u7#c9]` (`:639-727`): (d) `:668-670` reads `win-reports.css` instead of
  `win-tally.css` and requires
  `['.terminal-record', '.tly-head', '.tly-table', '.tr-b', '.th-b']`
  (`.btn-newrun`/`.tly-wait` died); (i) `:724`
  `expect(registry).toContain('windows/tally.ts')` →
  `not.toContain('windows/tally.ts')` (`:725`'s score-tally absence assert
  stays).
- ownership (`:730-738`): the array `:733-735` swaps
  `'src/client/windows/tally.ts'` → `'src/client/windows/agent-file.ts'`.
- If a test here resists these dispositions in a way not described, stop and
  report rather than improvise.

## Change list — e2e

**E17 — `e2e/fixtures/selectors.ts`** — bottom-up: the tally block `:93-100`
becomes the record block:
```ts
/* ── terminal record (U3) ────────────────────────────────────────────────── */
export const RECORD = {
  root: '#w-rep .terminal-record',
  ledger: '#w-rep .terminal-record[data-tally-state]',
  rows: '#w-rep .terminal-record .tly-table tr',
  big: '#w-rep .terminal-record #tlyBig',
  control: '#w-file #btnDeploy',
} as const
```
(the old export name `TALLY` dies; importers retarget) · `:19` `WINDOW_IDS`
drops `'w-tally'` · `:13` `  tally: '#w-tally',` leaves `WIN`.
(Ids verified at stamp: the control is `#btnDeploy` — `deploy-button.ts:74`;
the note is `#deployState` — `:68`.)

**E18 — `e2e/fixtures/harness.ts`** — `awaitTallyReveal` (`:123-137`) →
`awaitRecordFinal`: one locator wait,
`await expect(page.locator('#w-rep .terminal-record')).toHaveAttribute('data-tally-state', 'final', { timeout: 40_000 })`
(the `__tally` handle polls die; the doc block `:96-122` shrinks to match);
`expectTallyOpen` (`:148-150`) deleted; `tallyPhase()`/`tallyState()`
(`:193-215`) retarget `__agentFile.phase()` and the record's DOM attribute;
`newRun()` (`:273-280`) drives the merged control: await mode `next`
(`[data-op="new_run"]` on the control) enabled, click, await it returning to
`deploy`. All importers of the renamed helpers retarget.

**E19 — `e2e/run-loop.spec.ts`** — consts `:36-41`: rebind `LEDGER`/`ROWS`/
`BIG` to E17's `RECORD.*`, `NEW_RUN` to the merged control, `WAIT` to
`'#w-file #deployState'`, drop `TALLY`; `phase()`/`meta()` (`:69-82`) read
`__agentFile`; the "shuts TALLY" test (`:170`) asserts instead that after the
click the control returns to `deploy` mode and the record persists; `:113`
asserts `RECORD.root` count 1 after drain (not at boot); the rAF poll `:126`
retargets `#w-rep .terminal-record[data-tally-state="final"]`; the latency
test (`:524`) retargets the same selectors. Title drift ("TALLY window" →
"terminal record") is allowed here; `[uN#cN]` markers stay.

**E20 — `e2e/red-thread.spec.ts`** — `takeNextRun` (`:151-162`) rewrites to
the merged-control sequence (await record final · await control `new_run`
enabled · click · await control back to `deploy`); the tally-suppression test
(`:442-454`, clicks `[data-win="tally"]`) is **deleted** with design #7, its
`expectTallyOpen` import (`:26`) goes with it; the diagnostic snapshot
(`:276-278`) drops its `tally:` field.

**E21 — `e2e/reports.spec.ts`** — `fileAnotherRun` (`:122-133`) and the inline
click (`:397-399`) retarget the merged control (same sequence as E20); the
`:433`/`:581` raise-REPORTS comments update (the record lands in REPORTS —
raising it is the point now, not a workaround).

**E22 — `e2e/a11y.spec.ts`** — `:31` `WINDOW_IDS` four ids; the census test
(`:322`, assert `:358-361`) becomes a **union of two scans**: one while the
desk is in build phase (the control shows `deploy`), one after `drain()` lands
the record (the control shows `new_run`) — the union must equal all five ops;
one physical control never shows both at one instant; `:477` the `heldByPhase`
allowance → `expect(measured.heldByPhase).toEqual([])` (no window is
phase-held); the lapse-drill test (`:236-266`) retargets the merged control
and `#deployState` (the `?drill=tally-lapse` boot itself is driver-side and
unchanged); `:42`'s digit-excluded selector stays.

**E23 — `e2e/debug-pane.spec.ts`** — `:37` four ids; the hidden-window
allowance (`:177-185`, tally-only) → no window may be hidden.

**E24 — `e2e/shell.spec.ts`** — bottom-up: `:731` allowance → `heldByPhase`
must be empty; `:648` control arithmetic `5 * 2 + 5 + 3` → `4 * 2 + 4 + 3`;
`:633-638` regions count 5→4, the C15/C17 comment dies; `:597` comment;
`:374-376` the origins floor stays `4` (four windows, four columns — reword
the comment); `:367` title five→four; `:229-230` counts 5→4; `:134-135` title
and count 5→4; `:44-47` `DESK_WINDOWS` filter and `SHEET_STANDIN` die (all
windows are desk windows — fold their uses); `:27-43` comment block updates.

**E25 — `e2e/captures.spec.ts`** — `:117-118` become
`{ name: 'terminal-record', selector: '#w-rep .terminal-record', seedAt: '21:04' }` ·
`{ name: 'terminal-record-final', selector: '#w-rep .terminal-record', seedAt: '21:04', holdMs: 11_000 }`;
the seed guard (`:282`) retargets the record's presence; the pair (`:359`) →
`['terminal-record.png', 'terminal-record-final.png']`; in
`e2e/reference-shots/`: delete `win-tally.png` and `tally-countup-final.png`,
regenerate via the file's own refresh mode
(`CAPTURE_BASELINE=1 SHOT_OUT=e2e/reference-shots npx playwright test captures`),
then `git checkout` the eight untouched basenames so the diff is exactly the
two new files (the manifest asserts names, not bytes).

**E26 — `e2e/acceptance.spec.ts`** — the `TALLY` import (`:35`) → `RECORD`;
asserts `:266-279` retarget (`RECORD.root` presence replaces the not-hidden
check; the `tallyPhase` poll and `RECORD.ledger`/`RECORD.big` asserts keep
their shape); the `__tally` handle waits (`:331`/`:345`) → `__agentFile`;
`newRun` calls (`:231`/`:314`/`:428`) ride E18's harness retarget unchanged.

## Change list — spec (normative; flag for 윤석)

**E27 — `docs/spec-client.md`** — bottom-up: `:367` unchanged (the ~9 s
count-up survives — verify the sentence still reads true) · `:342` `All five
windows drag,` → four · `:304` the `ScoreTally` row's context column notes the
`.terminal-record` host · `:301` the `ReportView` row's `loading-behind-tally`
wording → behind the terminal record · `:168-169` the run states keep the
`TALLY` phase, reworded: the phase's two surfaces are the terminal record
(REPORTS) and the merged control (AGENT FILE) · `:163` boot fence five→four ·
`:153` the TALLY §4 row folds into the REPORTS row (score count-up · run
summary now inside 현장 기록; the new-run control moves to the AGENT FILE
row) · `:143` five→four · `:110`/`:101` prose stays true (the tally count-up
is the record's now) — touch only if a sentence becomes false · `:81` `the
five windows` → four · `:38-39` the §2 list drops TALLY (four windows; scoring
folds into REPORTS).

## Invariants

- **Inv 6 / inv 12**: the record renders from the `score` event only — no gate
  names, no pack read from a view.
- **Membrane census**: every op keeps a marked control — `deploy` and `new_run`
  share one control across its modes; the census unions two phases (E22).
- **Digits**: score digits stay inside the surviving `.tly-*`/`.th-v`/`.tr-v`
  selectors — the exclusion list is untouched (see no-edit rows).
- **Scenario-replaceable**: `nextAt` from the identity fetch; `사망`/`명` and
  all NEW RUN/wait/announce copy relocate verbatim (grandfathered literals).
- `main` stays deployable: the PR merges only when steps 1–3 below are green.

## Verification

1. `npm run check` then the full vitest suite — green after the enumerated
   amendments.
2. `npm run build` — green; `dist/` carries no `w-tally` markup.
3. Full e2e (`npx playwright test`) — green, captures included.
4. Behavioral (DEV): run a full day — at 21:04 the 현장 기록 gains the record
   and counts up ~9 s; the AGENT FILE control turns `NEW RUN 다음 시행 ·
   08:50으로` once the report lands; pressing it opens the next day; on the
   last day it prints `잔여 시행 없음 — 마지막 집계입니다` and goes dead; no
   fifth window or taskbar button anywhere.

## Done when

- [ ] `windows/tally.ts` and `win-tally.css` are gone; four windows mount; the
      desk lays out without a tally rect.
- [ ] Steps 1–3 green, in order, post-commit.
- [ ] The full behavioral sequence in check 4, including the spent state.
- [ ] No `.min` node and no `sentence_id` inside `.terminal-record`.
- [ ] `git grep -n "w-tally\|__tally\|btnNewRun" -- src/` returns nothing.
- [ ] One code commit on `playtest/g3-1-u3`; nothing pushed, no PR (the author
      pushes and opens the wave PR).

## If this PRD is wrong

```
An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and commit nothing. A report of this kind is a completed
run, not a failed one.
```
