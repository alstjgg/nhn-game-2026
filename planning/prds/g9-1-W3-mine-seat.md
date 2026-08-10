# g9-1 — W3: mining is one gesture — a mined sentence seats itself, and a refusal is shown

> plan-playtest v13 · citations bind to `21b2593` · branch `playtest/g9-1-w3-mine`
> commit message: `playtest(W3): a second activation seats the mined sentence — visible affordance, surfaced refusals`

## Outcome

The core gesture becomes playable: click a sentence to mine it; click it again
and it seats itself in the first free slot of the AGENT FILE. No pick channel,
no second window to know about. A refused action — board locked, no free seat,
or a denied op — nudges the sentence visibly instead of doing nothing (the
08-08 playtest's "does not work" was three silent failures). The mined
sentence looks actionable (`cursor:pointer`), and the two hints that still
named the deleted BLOCK STORE tell the truth. `slot-board.ts` stays the only
membrane owner: seating goes through `board.place()` → `planOps`.

## Scope

May modify: `src/client/windows/reports.ts` ·
`src/client/components/report-view.ts` · `src/client/components/slot-board.ts`
(`:22` string only) · `src/client/styles/win-reports.css` ·
`e2e/fixtures/harness.ts` (`slotBlock`) · `e2e/reports.spec.ts` (the T1
keyboard test only).

Must NOT modify: `src/client/components/block-card.ts` (the pick channel
stays for the dev handle; only reports.ts stops using it) ·
`src/client/components/minable-sentence.ts` · `e2e/a11y.spec.ts` (the census
drive still ends with an attached unslot — the second mine-click now seats,
and the later slot-target click is a harmless no-op) · `e2e/acceptance.spec.ts`
(it asserts `Object.values(slots)` and rides `slotBlock`, which this unit
re-points).

Known limits, deliberately out of scope (W2/W4 own them): sentences from a
PREVIOUS sitting's document are still unmineable — the flash now makes that
visible instead of silent; W2 makes past documents read-only. The
deploy-locks-the-board-for-the-day hazard is W4's.

## Change list

**1. `src/client/windows/reports.ts`** — two edits, bottom-up.

1a. `:105-119` — current (the whole `onMine` handler):
```
    onMine: (id: string) => {
      const m = marks()
      // T1 — the report is the pick surface: a mined sentence arms the pick
      // channel and the AGENT FILE's seat consumes it. `slot-board.ts` stays
      // the only membrane owner; no op is sent from here.
      if (sentenceState(id, m) === 'mined') {
        setPickedBlockId(id)
        return
      }
      const outcome = mine(id, m)
      for (const op of outcome.ops) driver.send(op)
      view.refresh(marks())
      for (const effect of outcome.effects) view.tear(effect.tear)
    },
```
replace with:
```
    onMine: (id: string) => {
      const m = marks()
      // W3 — one gesture: a second activation seats the mined sentence in
      // the first free slot. `slot-board.ts` stays the only membrane owner
      // (`place()` runs planOps); a refusal is SHOWN, never swallowed.
      if (sentenceState(id, m) === 'mined') {
        const board = getSlotBoard()
        const slots = driver.store().slots
        const seat = [...Array(SLOT_CAP).keys()].find((i) => slots[i] === undefined)
        if (board === null || seat === undefined || board.isLocked()) {
          view.flash(id)
          return
        }
        board.place(id, seat)
        if (board.cells()[seat] !== id) view.flash(id)
        return
      }
      const outcome = mine(id, m)
      const landed = outcome.ops.every((op) => driver.send(op).ok)
      view.refresh(marks())
      if (!landed) {
        view.flash(id)
        return
      }
      for (const effect of outcome.effects) view.tear(effect.tear)
    },
```

1b. `:31` — current:
```
import { pad2, setPickedBlockId } from '../components/block-card.ts'
```
replace with:
```
import { pad2 } from '../components/block-card.ts'
import { getSlotBoard, SLOT_CAP } from '../components/slot-board.ts'
```

**2. `src/client/components/report-view.ts`** — three edits, bottom-up.

2a. Inside the returned view object, directly after the `tear(id)` method's
closing brace (the method that flashes the tear effect — locate the literal
`tear(` method in the `return {` block; cite check: the object also carries
`render`, `refresh`, `round`, `brand`), insert:
```ts
    flash(id: string): void {
      const node = anchors.find((a) => a.getAttribute('data-sentence-id') === id)
      if (node === undefined) return
      node.classList.remove('refused')
      void node.offsetWidth
      node.classList.add('refused')
    },
```
If the returned object carries no `tear` method, that is a stop.

2b. In the `ReportView` interface (`:97-108`), directly after the `tear`
member's line, insert:
```ts
  /** W3 — nudge one sentence: the action was refused, and the desk says so. */
  flash(id: string): void
```
If the interface carries no `tear` member, that is a stop.

2c. `:162` — current:
```
    document.createTextNode('문장을 누르면 뜯어내 블록 보관함으로 보냅니다 · '),
```
replace with:
```
    document.createTextNode('문장을 누르면 뜯어내고, 한 번 더 누르면 요원 파일의 빈 칸에 앉습니다 · '),
```

**3. `src/client/components/slot-board.ts:22`** — current:
```
const EMPTY_HINT = '문장 카드를 끌어 놓거나, 카드를 고른 뒤 이 칸을 누르세요'
```
replace with:
```
const EMPTY_HINT = '부검 창에서 문장을 채굴해 한 번 더 누르면 이 칸에 앉습니다'
```

**4. `src/client/styles/win-reports.css`** — two edits, bottom-up.

4a. Directly after the `@keyframes tearFlash` block (`:78-80`), insert:
```
.min.refused{animation:refusedNudge .3s ease}
@keyframes refusedNudge{25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
```

4b. `:71` — current (first line of the `.min.mined` rule):
```
.min.mined{color:var(--pap-5);cursor:default;
```
replace with:
```
.min.mined{color:var(--pap-5);cursor:pointer;
```

**5. `e2e/fixtures/harness.ts`** — the `slotBlock` helper (comment + function,
cited by the comment line `/** Seats `blockId` in `slot`: pick it in REPORTS, seat it in the file (T1). */`)
— current:
```
/** Seats `blockId` in `slot`: pick it in REPORTS, seat it in the file (T1). */
export async function slotBlock(page: Page, blockId: string, slot = 0): Promise<void> {
  await page.locator(`#w-rep [data-sentence-id="${blockId}"]`).first().click()
  await page.locator(`#w-file .slot[data-slot="${slot}"]`).click()
}
```
replace with:
```
/** Seats `blockId`: one more activation of the mined sentence auto-seats it (W3). */
export async function slotBlock(page: Page, blockId: string, _slot = 0): Promise<void> {
  await page.locator(`#w-rep [data-sentence-id="${blockId}"]`).first().click()
}
```

**6. `e2e/reports.spec.ts`** — in the `slotting from the report (T1)` describe,
the keyboard test's seat step dies (after auto-seat, slot 0 is filled and
`.slot-target` no longer exists there). The two lines — current:
```
    await page.locator('#w-file .slot[data-slot="0"] .slot-target').focus()
    await page.keyboard.press('Enter')
```
replace with nothing (the Enter on the sentence itself now seats it; the
following `expect.poll` on `slots[0]` is the assert and stays).

## Invariants

- **`planOps` stays the only membrane rule set** — reports.ts calls
  `board.place()`, never `driver.send({op:'slot'})`.
- **The refusal check reads `board.cells()`**, the board's own post-apply
  state — never the DOM and never a timing guess.
- **No `.style.` writes, no px/rem literals in TS** (`reports.test.ts:594-595`)
  — the flash is a class + keyframe.
- The membrane rule: no input surface appears.

## Verification

1. `npm run check` — green. 2. `npx vitest run` — green. 3. `npm run build` —
green. Do NOT run playwright (author runs it on the merge preview).

## Done when

- [ ] All three commands exit 0.
- [ ] `grep -n "setPickedBlockId" src/client/windows/reports.ts` prints nothing.
- [ ] `grep -c "flash" src/client/components/report-view.ts` prints at least 3
      (interface row, implementation, and the class write).
- [ ] Behavioural (author's browser pass + 민서's playtest): in a served build,
      click a sentence → 채굴; click it again → it appears in the file's first
      free seat; with the board locked, the second click nudges the sentence
      instead of doing nothing.
- [ ] Exactly one code commit on `playtest/g9-1-w3-mine`, nothing pushed.

## As executed (08-08)

One §5.7-class defect, caught by the executor at verification: the dictated
`flash` body treated `anchors` as elements — it is `{sentence, node}[]` — and
produced four TS2339s. The executor applied the change list verbatim and
reported rather than patching; the author amendment (`437e982`) walks the
Anchor pair. Everything else landed as written (`c265ddb`).

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
