# g12-3 — R1: the record breaks between rounds

> plan-playtest v13 · citations bind to `f9bae7e` · branch `playtest/r1-round-break`
> commit message: `playtest(R1): one sitting's record breaks a line between its rounds`

## Outcome

A sitting's accumulated 무전 기록 puts each round's prose on its own line instead
of running every round together into one justified block. The break survives a
redraw — switching to another rail tab and back shows the same breaks, not one
undivided wall.

## Design (author-resolved — do not re-derive)

W2 made one sitting one document, appending each round's `report_body` into the
same `.rbody`. The sentences flow inline, so the boundary between rounds is
invisible.

The break cannot be inserted only at append time. `render()` redraws the whole
accumulated document from `ReportModel.report_body`, which is a flat list with no
round information in it — an append-only divider would vanish the first time the
operator switched rail tabs and came back. So the model records the boundary:
`ReportModel` grows an **optional** `opens: string[]`, the ids of the sentences
that open a round after the first, and both draw paths break before any id in it.

`opens` is optional and is **omitted entirely** on the first round of a sitting.
That is deliberate: `tests/windows/reports.test.ts:637` asserts
`accumulated(null, round)` `toEqual(round)`, and it must keep passing untouched.

The break itself is a class on an empty `<span>`, styled block-level in CSS —
never a `.style.` write and never a px literal in TS, which is what
`tests/windows/reports.test.ts` `(C11)` polices.

## Scope

May modify, only these three files:

- `src/client/components/report-view.ts`
- `src/client/styles/win-reports.css`
- `tests/windows/reports.test.ts` (E6 — one **added** test; change nothing else
  in this file)

Must NOT modify:

- `src/client/windows/reports.ts` — the window hands `accumulated()` its slices
  already; it needs no change, and another unit owns that file this wave.
- `src/client/components/minable-sentence.ts` — a break is not a sentence state.
- `e2e/reports.spec.ts` — author-verified.

Test files this unit turns red: **none is expected.** The existing `[w2]` block
(`tests/windows/reports.test.ts:631-690`) must stay green **untouched**. If any
of its six tests goes red, the `opens`-is-omitted rule above was not honoured —
stop and report under §5.7 rather than editing them.

## Change list

Same-file edits are listed **bottom-up**; apply in the order given.

### E1 — `src/client/components/report-view.ts:318-322`

Current text:

```
      const bodyNodes = model.report_body.map((sentence) => {
        const node = bind(sentence, marks)
        body.append(node, document.createTextNode(' '))
        return node
      })
```

Replacement text:

```
      const opens = new Set(model.opens ?? [])
      const bodyNodes = model.report_body.map((sentence) => {
        // R1 — a redraw rebuilds the whole sitting from a flat list, so the
        // round boundary has to come from the model. Appending the break only
        // in `append()` below would lose it the first time the operator left
        // this rail tab and came back.
        if (opens.has(sentence.id)) body.append(el('span', 'r-brk'))
        const node = bind(sentence, marks)
        body.append(node, document.createTextNode(' '))
        return node
      })
```

### E2 — `src/client/components/report-view.ts:289-293`

Current text:

```
      const grown = slice.report_body.map((sentence) => {
        const node = bind(sentence, marks)
        body.append(node, document.createTextNode(' '))
        return node
      })
```

Replacement text:

```
      // R1 — this round opens below the last one, not beside it. `append()` is
      // only ever reached for a round that is NOT the sitting's first (the
      // window draws whole for that one), so the break is unconditional here.
      body.append(el('span', 'r-brk'))
      const grown = slice.report_body.map((sentence) => {
        const node = bind(sentence, marks)
        body.append(node, document.createTextNode(' '))
        return node
      })
```

### E3 — `src/client/components/report-view.ts:93-100`

Current text:

```
export function accumulated(held: ReportModel | null, slice: ReportModel): ReportModel {
  if (held === null) return { round: slice.round, facts: [...slice.facts], report_body: [...slice.report_body] }
  return {
    round: slice.round,
    facts: [...held.facts, ...slice.facts],
    report_body: [...held.report_body, ...slice.report_body],
  }
}
```

Replacement text:

```
export function accumulated(held: ReportModel | null, slice: ReportModel): ReportModel {
  if (held === null) return { round: slice.round, facts: [...slice.facts], report_body: [...slice.report_body] }
  // R1 — the id that OPENS this round, remembered so a redraw can break before
  // it. Omitted on the first round rather than set empty: the document a
  // sitting starts with is the slice itself, and `(a)` in the `[w2]` block
  // asserts exactly that identity.
  const opening = slice.report_body[0]
  const opens = held.opens ?? []
  return {
    round: slice.round,
    facts: [...held.facts, ...slice.facts],
    report_body: [...held.report_body, ...slice.report_body],
    opens: opening === undefined ? [...opens] : [...opens, opening.id],
  }
}
```

### E4 — `src/client/components/report-view.ts:24-28`

Current text:

```
export interface ReportModel {
  round: number
  facts: Sentence[]
  report_body: Sentence[]
}
```

Replacement text:

```
export interface ReportModel {
  round: number
  facts: Sentence[]
  report_body: Sentence[]
  /**
   * R1 — ids in `report_body` that open a round after the sitting's first. The
   * record breaks a line before each. Absent on a single-round document.
   */
  opens?: string[]
}
```

### E5 — `src/client/styles/win-reports.css:58`

Current text:

```
.rbody .sent{display:inline}
```

Replacement text:

```
.rbody .sent{display:inline}
/* R1 — the break between two rounds of one sitting. An empty block in the
   justified flow: it ends the line and leaves one step of air, so a seven-round
   day reads as seven transmissions instead of one paragraph. */
.rbody .r-brk{display:block;height:var(--space-6)}
```

### E6 — `tests/windows/reports.test.ts:689`

Insert a new test immediately **before** the line that closes the `[w2]`
describe block. The current text of the last two lines of that block is:

```
  })
})
```

Replacement text:

```
  })

  it('(g) each round after the first records the id it opens on', async () => {
    const v = await view()
    const one = v.accumulated(null, { round: 0, facts: [], report_body: [s('b1'), s('b2')] })
    // A single-round document carries no boundary at all — `(a)` above pins
    // that identity, and a break before the very first sentence would open the
    // record with a blank line.
    expect(one.opens).toBeUndefined()

    const two = v.accumulated(one, { round: 1, facts: [], report_body: [s('b3')] })
    const three = v.accumulated(two, { round: 2, facts: [], report_body: [s('b4'), s('b5')] })
    expect(three.opens).toEqual(['b3', 'b4'])
    // The boundary is an id in the body, never an index into it: `render()`
    // rebuilds the flat list and matches by id, so an id that is not there is
    // simply no break rather than a break in the wrong place.
    expect(three.report_body.map((x) => x.id)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5'])
  })
})
```

## Invariants

- **C11 — no `.style.` writes and no px/rem literals in TS**
  (`tests/windows/reports.test.ts` guards this). The break is a class plus a CSS
  rule using an existing token; `--space-6` already appears in this stylesheet.
- **The `[w2]` block stays green untouched.** `opens` is omitted, never empty, on
  a first round.
- **`el` is already imported** in `report-view.ts`. Add no import.
- **The scenario is replaceable** — this unit mints no scenario literal and no
  copy at all.

## Verification

- `npm run check` — passes.
- `npx vitest run tests/windows/reports.test.ts` — green, including the new
  `(g)`, with the other six `[w2]` tests unmodified.
- `npx vitest run` — the full suite passes. Report the count.
- `npm run build` — passes.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `git diff --name-only` names exactly three files.
- [ ] `git diff tests/windows/reports.test.ts` contains no `-` line other than
      the one closing brace pair E6 re-writes.
- [ ] `grep -n "r-brk" src/client/components/report-view.ts` shows exactly two
      hits — one in `append()`, one in `render()`.
- [ ] `(g)` passes, and `three.opens` is `['b3','b4']` — the ids, not indices.
- [ ] Full vitest run is green.
- [ ] **Behavioural:** `(g)` proves the boundary survives accumulation, which is
      the property a redraw depends on — a model built by three appends still
      names both boundaries after the third.

## If this PRD is wrong

An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
