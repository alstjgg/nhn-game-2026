# g10-1 — W2: one sitting, one record — the day's rounds accumulate into a single document

> plan-playtest v13 · citations bind to `991a550` · branch `playtest/w2-one-sitting-one-record`
> commit message: `playtest(W2): one sitting is one accumulating record — the rail is keyed by run, not by round`

## Outcome

민서's 08-08 playtest opened seven tabs for one day. A live day is seven
rounds and the seam types `report` with a **round**; the window filed one
document per round and then handed the round numbers to the rail as if they
were run numbers, so one sitting became seven ECHO-n tabs, the archive's real
runs collided with them, and past days' documents were swallowed.

After this unit a **sitting** — the run `meta` last named — owns exactly one
document. Each round's 현장 기록 and 무전 기록 are appended to it as they
arrive, replaying only the new slice, so the operator watches the day fill in.
The rail carries one entry per sitting, and every past sitting stays on it as a
stored record — its document, and the 집계표 that day earned.

Nothing about the fixture path changes shape: every fixture bakes
`round === run` and files one report per day, which is why the whole e2e suite
passed over this bug. That is also why the proof lives in **unit tests over a
pure accumulator**, not in e2e.

## Scope

May modify: `src/client/windows/reports.ts` ·
`src/client/components/report-view.ts` · `tests/windows/reports.test.ts`
(append only).

Must NOT modify: `src/client/components/report-archive.ts` (the rail is already
right — it labels whatever runs it is handed, via `callsignOf`); any fixture
under `src/client/driver/fixtures/` (their `round === run` is a fixture
property, not a bug — `tests/windows/tally.test.ts:521-540` rules on exactly
this); `src/client/components/minable-sentence.ts`; `e2e/**` (no e2e oracle
changes shape — see Invariants); `src/client/components/score-tally.ts`.

Known limits, deliberately out of scope: the accumulated document draws no
round separator — one sitting reads as one continuous report, which is the
point. A whole repaint (rail switch) does not re-replay; that is the existing
`replay: false` rule and it stays.

## Change list

**1. `src/client/components/report-view.ts`** — three edits, bottom-up.

1a. `:245` — current (the first line of the returned object literal):
```
  return {
    render(model: ReportModel, marks: MarkSets, options?: RenderOptions): void {
```
replace with:
```
  return {
    append(slice: ReportModel, whole: ReportModel, marks: MarkSets): void {
      // W2 — the sitting grows. The document already on the page is NOT
      // redrawn: the new round's rows are appended, `anchors` accumulates (so
      // `refresh` still repaints every sentence the day has filed), `current`
      // becomes the WHOLE sitting (so the mined tally counts all of it), and
      // the replay runs over the new slice alone.
      if (stopReplay !== null) stopReplay()
      stopReplay = null
      caret.remove()
      current = whole

      for (const sentence of slice.facts) {
        const node = bind(sentence, marks)
        node.textContent = sentence.text
        const row = el('li', 'min-row')
        row.append(el('span', 'f-t'), node)
        facts.append(row)
      }

      const grown = slice.report_body.map((sentence) => {
        const node = bind(sentence, marks)
        body.append(node, document.createTextNode(' '))
        return node
      })

      tally(marks)
      replay(slice.report_body, grown, true)
    },

    render(model: ReportModel, marks: MarkSets, options?: RenderOptions): void {
```

1b. `:97-99` — current:
```
export interface ReportView {
  /** Draws a round's two documents from scratch, replaying on first arrival. */
  render(model: ReportModel, marks: MarkSets, options?: RenderOptions): void
```
replace with:
```
export interface ReportView {
  /**
   * W2 — appends one round to the sitting already on the page. `slice` is the
   * new round alone (it is what replays); `whole` is the sitting including it,
   * which becomes the model the mined tally counts.
   */
  append(slice: ReportModel, whole: ReportModel, marks: MarkSets): void
  /** Draws a sitting's two documents from scratch, replaying on first arrival. */
  render(model: ReportModel, marks: MarkSets, options?: RenderOptions): void
```

1c. `:82` — current (the closing `}` of `minedCount`, followed by the DOM-side
banner):
```
}

/* ── the DOM side ────────────────────────────────────────────────────────── */
```
replace with:
```
}

/**
 * W2 — a sitting plus one more round. Pure, and the ONE place the growth rule
 * lives: both panes append in arrival order and the model's `round` becomes
 * the latest one filed. `held === null` is the sitting's first round.
 *
 * Kept here rather than in `windows/reports.ts` because it is the only part of
 * "one sitting, one record" that can be proved under vitest's node
 * environment — the window itself needs a DOM.
 */
export function accumulated(held: ReportModel | null, slice: ReportModel): ReportModel {
  if (held === null) return { round: slice.round, facts: [...slice.facts], report_body: [...slice.report_body] }
  return {
    round: slice.round,
    facts: [...held.facts, ...slice.facts],
    report_body: [...held.report_body, ...slice.report_body],
  }
}

/* ── the DOM side ────────────────────────────────────────────────────────── */
```

**2. `src/client/windows/reports.ts`** — six edits, bottom-up.

2a. `:225-228` — current (the tail of the `driver.subscribe` handler):
```
    if (event.type !== 'report') return
    filed.set(event.round, { round: event.round, facts: event.facts, report_body: event.report_body })
    active = event.round
    sync()
  })
```
replace with:
```
    if (event.type !== 'report') return
    // W2 — the seam types `report` with a ROUND, and a live day has seven of
    // them (`tests/driver/live-desk.test.ts:126`). The SITTING it belongs to is
    // the run `meta` last named; pairing the two here is what collapses seven
    // rail tabs into one accumulating document. A round is filed once — a
    // replayed stream must not double the day.
    const sitting = run
    const seen = rounds.get(sitting) ?? new Set<number>()
    if (seen.has(event.round)) return
    seen.add(event.round)
    rounds.set(sitting, seen)

    const held = filed.get(sitting) ?? null
    const slice: ReportModel = {
      round: event.round,
      facts: event.facts,
      report_body: event.report_body,
    }
    const whole = accumulated(held, slice)
    filed.set(sitting, whole)

    // The sitting already on the desk GROWS; any other case draws whole.
    if (held !== null && active === sitting) {
      replayed.add(`${sitting}:${event.round}`)
      view.append(slice, whole, marks())
      sync(false)
      return
    }
    active = sitting
    sync()
  })
```

2b. `:211-223` — current (the `score` branch):
```
    if (event.type === 'score') {
      // Unmineable by construction: no `.min` node, no `sentence_id` — this
      // is a terminal, autopsy-window record, not a source document.
      const docFacts = host.querySelector('article.doc-facts')
      if (docFacts === null) return
      record?.remove()
      record = el('article', 'terminal-record')
      record.setAttribute('aria-label', '시행 결과')
      docFacts.append(record)
      const tally = createScoreTally({ host: record })
      tally.open()
      tally.run(scoreModel(event))
      return
    }
```
replace with:
```
    if (event.type === 'score') {
      // Unmineable by construction: no `.min` node, no `sentence_id` — this
      // is a terminal, autopsy-window record, not a source document.
      //
      // W2 — the record belongs to its SITTING and is stored with it. It used
      // to be one element the next `score` replaced whole, so a past day's
      // document was read under the latest day's 집계표. Exactly one is ever
      // mounted: `mountRecord()` attaches the active sitting's and detaches
      // every other.
      if (host.querySelector('article.doc-facts') === null) return
      records.get(run)?.remove()
      const node = el('article', 'terminal-record')
      node.setAttribute('aria-label', '시행 결과')
      records.set(run, node)
      mountRecord()
      const tally = createScoreTally({ host: node })
      tally.open()
      tally.run(scoreModel(event))
      return
    }
```

2c. `:163-176` — current (the whole `sync` function):
```
  function sync(): void {
    const entries = railEntries(archive, [...filed.keys()])
    if (entries.length === 0) return
    if (active === null || !entries.some((entry) => entry.run === active)) {
      active = entries[entries.length - 1]?.run ?? null
    }
    if (active === null) return
    if (sameRail(entries, rendered)) rail.select(active)
    else {
      rail.render(entries, active)
      rendered = entries
    }
    drawDocument()
  }
```
replace with:
```
  /**
   * `draw: false` — the rail is reconciled but the document is left alone,
   * because `view.append()` has just grown it in place. Redrawing there would
   * blank the sitting and re-type it, which is the very thing the `replayed`
   * set exists to prevent (R4 on windows/reports.ts:90).
   */
  function sync(draw = true): void {
    const entries = railEntries(archive, [...filed.keys()])
    if (entries.length === 0) return
    if (active === null || !entries.some((entry) => entry.run === active)) {
      active = entries[entries.length - 1]?.run ?? null
    }
    if (active === null) return
    if (sameRail(entries, rendered)) rail.select(active)
    else {
      rail.render(entries, active)
      rendered = entries
    }
    if (draw) drawDocument()
  }
```

2d. `:155-161` — current (the whole `drawDocument` function):
```
  function drawDocument(): void {
    if (active === null) return
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
    const first = model.report_body.length > 0 && !replayed.has(model.round)
    if (first) replayed.add(model.round)
    view.render(model, marks(), { replay: first })
  }
```
replace with:
```
  function drawDocument(): void {
    if (active === null) return
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
    // W2 — the replay key is `sitting:round`, not the round alone: two
    // sittings both have a round 1, and the second one's arrival must not read
    // as "already replayed".
    const key = `${active}:${model.round}`
    const first = model.report_body.length > 0 && !replayed.has(key)
    if (first) replayed.add(key)
    view.render(model, marks(), { replay: first })
    mountRecord()
  }

  /** Exactly one record is on the page: the active sitting's, or none. */
  function mountRecord(): void {
    const docFacts = host.querySelector('article.doc-facts')
    if (docFacts === null) return
    for (const [sitting, node] of records) {
      if (sitting === active) {
        if (node.parentElement !== docFacts) docFacts.append(node)
      } else {
        node.remove()
      }
    }
  }
```

2e. `:153` — current:
```
  const replayed = new Set<number>()
```
replace with:
```
  const replayed = new Set<string>()
```

2f. `:80-92` — current:
```
  const filed = new Map<number, ReportModel>()
  let archive: ArchiveEntry[] = []
  let carried: string[] = []
  let rendered: ArchiveEntry[] = []
  let active: number | null = null

  // U3 — the terminal record's own identity, tracked the same way `meta`
  // already feeds the callsign below. There is ONE record: the next `score`
  // replaces it whole (design #1).
  let run = 0
  let slug = ''
  let title = ''
  let record: HTMLElement | null = null
```
replace with:
```
  // W2 — keyed by SITTING (the run), not by round. A live day files seven
  // reports into ONE of these entries.
  const filed = new Map<number, ReportModel>()
  /** Which rounds each sitting has already filed — a replayed stream files none twice. */
  const rounds = new Map<number, Set<number>>()
  let archive: ArchiveEntry[] = []
  let carried: string[] = []
  let rendered: ArchiveEntry[] = []
  let active: number | null = null

  // U3 — the terminal record's own identity, tracked the same way `meta`
  // already feeds the callsign below. W2 — one record per SITTING, stored with
  // it; `mountRecord()` keeps exactly one of them on the page.
  let run = 0
  let slug = ''
  let title = ''
  const records = new Map<number, HTMLElement>()
```

2g. `:26-27` — current:
```
import { createReportView } from '../components/report-view.ts'
import type { ReportModel } from '../components/report-view.ts'
```
replace with:
```
import { accumulated, createReportView } from '../components/report-view.ts'
import type { ReportModel } from '../components/report-view.ts'
```

**3. `tests/windows/reports.test.ts`** — append at the very end of the file:
```ts
/* ══ [w2] one sitting, one accumulating record ══════════════════════════ */

describe('[w2] a sitting accumulates its rounds into one document', () => {
  const s = (id: string): Sentence => ({ id, text: `${id} 문장`, species: 'fact' })

  it('(a) the first round of a sitting is the document', async () => {
    const v = await view()
    const round = { round: 0, facts: [s('f1')], report_body: [s('b1')] }
    expect(v.accumulated(null, round)).toEqual(round)
  })

  it('(b) each further round appends to both panes, in arrival order', async () => {
    const v = await view()
    const one = v.accumulated(null, { round: 0, facts: [s('f1')], report_body: [s('b1')] })
    const two = v.accumulated(one, { round: 1, facts: [s('f2')], report_body: [s('b2'), s('b3')] })

    expect(two.facts.map((x) => x.id)).toEqual(['f1', 'f2'])
    expect(two.report_body.map((x) => x.id)).toEqual(['b1', 'b2', 'b3'])
  })

  it('(c) the model carries the LATEST round filed — that is the replay key', async () => {
    const v = await view()
    const one = v.accumulated(null, { round: 0, facts: [], report_body: [s('b1')] })
    expect(v.accumulated(one, { round: 6, facts: [], report_body: [s('b2')] }).round).toBe(6)
  })

  it('(d) it mutates neither side — the held document and the slice are untouched', async () => {
    const v = await view()
    const held = { round: 0, facts: [s('f1')], report_body: [s('b1')] }
    const slice = { round: 1, facts: [s('f2')], report_body: [s('b2')] }
    v.accumulated(held, slice)
    expect(held.facts.map((x) => x.id)).toEqual(['f1'])
    expect(held.report_body.map((x) => x.id)).toEqual(['b1'])
    expect(slice.facts.map((x) => x.id)).toEqual(['f2'])
  })

  it('(e) a seven-round day is ONE document, and the mined tally counts all of it', async () => {
    const v = await view()
    const m = await minable()
    let doc: ReportModel | null = null
    for (let round = 0; round < 7; round += 1) {
      doc = v.accumulated(doc, {
        round,
        facts: [s(`f${round}`)],
        report_body: [s(`b${round}`)],
      })
    }
    expect(doc!.facts).toHaveLength(7)
    expect(doc!.report_body).toHaveLength(7)
    expect(v.minedCount(doc!, m.deriveMarks(store({ mined: ['f3', 'b5'] }), []))).toBe(2)
  })

  it('(f) the window keys its rail on the run, never on the round', () => {
    // The defect was `railEntries(archive, [...filed.keys()])` being handed
    // ROUND numbers. `filed` is now keyed by the sitting, and the only write
    // to it takes its key from the run `meta` last named.
    const window = scannedSources().find((s) => s.file.endsWith('windows/reports.ts'))
    expect(window, 'the REPORTS window is not in the scanned set').toBeTruthy()
    expect(window!.text, 'the report handler no longer names the sitting').toMatch(/const sitting = run/)
    expect(window!.text, 'a report is still filed under its round').not.toMatch(/filed\.set\(\s*event\.round/)
  })
})
```

Every helper this block uses is already in the file: `minable()` (`:126`),
`view()` (`:134`), `store()` (`:174`), `scannedSources()` (`:49`, and note it
returns **comment-stripped** text). `Sentence` is imported at `:23`;
`ReportModel` and `MarkSets` are local mirror interfaces at `:115` and `:69`.
**If any of these is missing or differently named, that is a stop.**

`ViewModule` (`:121-124`) must also gain a row — current:
```
interface ViewModule {
  typeCursor(state: TypeState, elapsedMs: number, lengths: readonly number[]): TypeState
  minedCount(model: ReportModel, marks: MarkSets): number
}
```
replace with:
```
interface ViewModule {
  typeCursor(state: TypeState, elapsedMs: number, lengths: readonly number[]): TypeState
  minedCount(model: ReportModel, marks: MarkSets): number
  accumulated(held: ReportModel | null, slice: ReportModel): ReportModel
}
```

## Invariants

- **The record survives every repaint.** `render()` calls
  `facts.replaceChildren()` on the `<ol>` only; the record is a sibling
  `<article>` inside `article.doc-facts`. Nothing in this unit may replace
  `article.doc-facts` itself.
- **Exactly one `#w-rep .terminal-record` is ever in the DOM** — pinned by
  `e2e/run-loop.spec.ts:141`, `:163`, `:214`, `:404` and
  `e2e/captures.spec.ts:281`. `mountRecord()` is the only mounter.
- **No e2e oracle changes shape.** Every fixture files ONE report per day with
  `round === run` (`src/client/driver/fixtures/run-loop.ts:115-121`,
  `woodari-run03.ts:228`), so `filed` keyed by run holds the same keys it held
  keyed by round, and the rail is identical. If any e2e test needs editing to
  pass, **stop and report** — it means the keying is wrong, not the oracle.
- **`round === run` is never asserted anywhere in client code** — the ruling at
  `tests/windows/tally.test.ts:521-540`. This unit PAIRS a round with the
  current run; it never equates them.
- **The window keeps no timer and reads no stream** (`e2e/reports.spec.ts:410-422`).
- **C11**: no px/rem literals, no `.style.` writes, no hex colours in these
  two `.ts` files (`tests/windows/reports.test.ts:603-609`).

## Verification

1. `npm run check` — green. 2. `npx vitest run` — green, including the new
`[w2]` describe. 3. `npm run build` — green. Do NOT run playwright (the author
runs it on the merge preview).

## Done when

- [ ] All three commands exit 0.
- [ ] `npx vitest run tests/windows/reports.test.ts` — all passing.
- [ ] `grep -n "filed.set" src/client/windows/reports.ts` shows the key is
      `sitting`, never `event.round`.
- [ ] `grep -c "accumulated" src/client/components/report-view.ts` prints at
      least 2 (the export and its doc), and `reports.ts` imports it.
- [ ] Exactly one code commit on `playtest/w2-one-sitting-one-record`, on top
      of the PRD commit already there. Nothing pushed, no PR opened.

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
