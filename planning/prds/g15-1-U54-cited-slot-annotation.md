# g15-1 — U5.4: the agent's line names the slots that moved it

> plan-playtest v14 · citations bind to `9a6b396` (`origin/main`) · branch `playtest/g15-1-cited-slot-annotation`
> commit message: `playtest(U5.4): the agent's radio line names the slots that moved it`

## Outcome

When the agent speaks on the LIVE FEED, its line carries a seal-red mark naming
the **slot numbers** of the sentences it cited — `인수인계 02`, or
`인수인계 01 · 03` when it cited more than one. The player learns their mining
reached the agent and which of their four sentences did it. They are told
nothing about *how*: to work that out they read the slot in the AGENT FILE and
judge the agent's conduct themselves.

Nothing is said about the stance. No model prose reaches the screen.

## Why (author-resolved — do not re-derive)

민서's ruling, 08-08, after reviewing three alternatives that all rendered the
agent's reasoning (the stance `desc` counterfactual, the rejected stance, and
`inner_note`/`rejected_reason` verbatim). All three were declined: **the player
should deduce the how, not be told it.** Attribution without explanation is the
whole design — it makes the player read their own file against the agent's
behaviour, which is the loop C-BLOCK is built on.

Two consequences that make this the strongest of the four:

- **It cannot lie.** The citation is filtered against the membrane, so a
  fabricated id resolves to no slot and prints no mark. Measured over 110
  live-arm probe calls carrying a deployed block: 88.2% cite only real deployed
  ids, 9.1% cite only fabricated ones, 2.7% cite nothing, 0% mixed. The failure
  mode is silence.
- **It side-steps the fallback ambiguity.** On a Call 1 fallback
  `engine/index.ts:325` sets `utterance = ''`, and `feed/feed.ts:35` pushes a
  radio line only when the utterance is non-empty. A fallback round produces no
  line to annotate, so "cited nothing" and "the call never landed" never have to
  be told apart.

**The mark is not cleared between sittings.** The feed already never clears —
`run-feed.ts:386` handles `meta` by re-labelling the header callsign and nothing
else — so an old day's `인수인계 02` stays on the paper above a new day's lines.
That is 민서's ruling and it is free: the LIVE FEED is read-only past reference,
and a player who does not know slot numbers are per-day is not the audience.

## Design (author-resolved — do not re-derive)

- **Slot numbers cross the seam, not block ids.** `driver/membrane.ts:37`
  already keeps `slots: Map<number, string>` because `unslot` validates against
  it. The driver resolves ids to slots, so the LIVE FEED needs nothing from the
  AGENT FILE and C8 / inv 12 (no sibling-window import) never arises.
- **The field is `cited_slots`, never `because_*`.** `shared/seam-keys.ts` bans
  the `because_` family and `FeedLine` crosses the seam. This is the same rename
  U5.2b+ made for `cited_ids`.
- **The engine does not change.** `live-driver.ts` already computes the filtered
  citation at the gate beat, *before* the flush that emits the radio line. The
  annotation is attached on the way out.
- **One mark per line**, slots ascending, joined by ` · `, numbered
  `pad2(slot + 1)` so they read exactly as the AGENT FILE prints them.
- **The mark carries no `sentence_id`, no `data-op`, and is not minable.** It is
  not a membrane control and must stay out of the five-op census.
- **No mark at all when the list is empty.** Not an empty span, not a dash.

## Scope

May modify:

- `docs/spec-client.md` — the ratified §5.2 fence only (see the trap below)
- `src/shared/view-driver.ts` — `FeedLine` gains the field
- `src/driver/membrane.ts` — a slot lookup over the map it already keeps
- `src/driver/live-driver.ts` — annotate the radio line in `flush()`
- `src/client/driver/fixtures/woodari-run03.ts` — the fixture's own citation
- `src/client/components/run-feed.ts` — the model and the DOM
- `src/client/styles/win-live-feed.css` — the mark
- `tests/driver/membrane-slots.test.ts` — **new file**
- `tests/windows/live-feed.test.ts` · `e2e/live-feed.spec.ts`

Must NOT modify:

- `src/engine/**` — the engine is untouched by design. If anything under it goes
  red, stop and report.
- `src/client/driver/live/adapter.ts` — it forwards the event whole and only
  reads `line.clock` (`:113`), so the field survives the fanout unchanged.
- `tools/driver/run/bind.mjs` — the second composition root. It builds a
  `FeedLine` only for a line its own comment says is *"never emitted, never
  enters the feed and never reaches"* the seam (`:45-46`), so an optional field
  does not reach it.
- `src/client/components/slot-board.ts` — `block-store.test.ts:557-559` requires
  its `git diff --name-only HEAD` to be **empty**, so any uncommitted edit fails
  vitest during your own verification (§5.4).

Test files this unit turns red, both **amended, not relaxed**:

- `tests/driver/seam-shapes.test.ts` — red the moment E1 and E2 are out of step
  with each other, and green again when both have landed. **Not edited.** If it
  is still red with both applied, stop and report.
- `tests/windows/live-feed.test.ts:420` — `(c) run-feed.ts authors exactly the
  five declared chrome literals` is an **allow-list of every Korean string this
  file may contain**, and `인수인계` is a sixth. E9a adds it and says why. This
  is the guard doing its job, not an obstacle: a new player-visible string in
  this file is exactly what it exists to make someone declare.

### The trap that decides this unit

**`FeedLine` is a ratified shape, and the spec is what the test reads.**
`tests/driver/seam-shapes.test.ts` lifts the ```ts fence out of
`docs/spec-client.md` §5.2 and compares it structurally to
`src/shared/view-driver.ts` — comments stripped, whitespace normalised. Editing
the seam without editing the fence turns that suite red, and editing the fence
without the seam does too. **They change together, in the same commit, or not at
all.** E1 and E2 are that pair. The precedent is `judged`, added to both by
U5.2b+ and visible in the fence at `spec-client.md:195`.

## Change list

Nine files, edits listed bottom-up within each file. **Do E1 and E2 together
before running anything** — either alone is red.

### E1 — `docs/spec-client.md:186`

Current text:

```
interface FeedLine { kind: FeedKind; clock: string /* "HH:MM" */; text: string;
                     speaker?: string; sentence_id?: string /* set ⇢ minable */ }
```

Replacement text:

```
interface FeedLine { kind: FeedKind; clock: string /* "HH:MM" */; text: string;
                     speaker?: string; sentence_id?: string /* set ⇢ minable */;
                     cited_slots?: number[] /* U5.4 — slot numbers, driver-resolved */ }
```

### E2 — `src/shared/view-driver.ts:21`

Current text:

```
export interface FeedLine { kind: FeedKind; clock: string /* "HH:MM" */; text: string;
                     speaker?: string; sentence_id?: string /* set ⇢ minable */ }
```

Replacement text:

```
export interface FeedLine { kind: FeedKind; clock: string /* "HH:MM" */; text: string;
                     speaker?: string; sentence_id?: string /* set ⇢ minable */;
                     cited_slots?: number[] /* U5.4 — slot numbers, driver-resolved */ }
```

### E3 — `src/driver/membrane.ts`

**E3a — `:78`.** Current text:

```
    slottedIds: () =>
      [...slots.entries()].sort((left, right) => left[0] - right[0]).map(([, id]) => id),
```

Replacement text:

```
    slottedIds: () =>
      [...slots.entries()].sort((left, right) => left[0] - right[0]).map(([, id]) => id),

    slotOf: (blockId: string) => {
      for (const [slot, id] of slots) if (id === blockId) return slot
      return null
    },
```

**E3b — `:30`.** Current text:

```
  /** Block ids currently in slots, in ascending slot order. */
  slottedIds(): string[]
```

Replacement text:

```
  /** Block ids currently in slots, in ascending slot order. */
  slottedIds(): string[]
  /**
   * The slot a block sits in, or `null` if it sits in none — U5.4's whole
   * lookup. The map is already here because `unslot` validates against it; a
   * citation naming a block the operator never seated resolves to `null` and
   * prints nothing, which is the failure mode that keeps the mark honest.
   */
  slotOf(blockId: string): number | null
```

### E4 — `src/driver/live-driver.ts`

**E4a — `:195`.** Current text:

```
        if (beat.roundIndex !== null && judged !== null) {
          const deployed = new Set(membrane.deployed())
          judgedStances.set(beat.roundIndex, {
            ...judged,
            cited_ids:
              response === null
                ? []
                : response.because_block_ids.filter((id) => deployed.has(id)),
          })
        }
```

Replacement text:

```
        if (beat.roundIndex !== null && judged !== null) {
          const deployed = new Set(membrane.deployed())
          const citedIds =
            response === null
              ? []
              : response.because_block_ids.filter((id) => deployed.has(id))
          judgedStances.set(beat.roundIndex, { ...judged, cited_ids: citedIds })
          // U5.4 — the same citation, resolved to the slot numbers the AGENT
          // FILE prints, for the radio line this beat is about to flush. A
          // fabricated id was already dropped by the filter above; one that
          // survives it but sits in no slot drops here. Either way the mark is
          // absent rather than wrong.
          pendingCitedSlots = citedIds
            .map((id) => membrane.slotOf(id))
            .filter((slot): slot is number => slot !== null)
            .sort((left, right) => left - right)
        }
```

**E4b — `:152`.** Current text:

```
  const judgedStances = new Map<
    number,
    { stance_id: string; desc: string; cited_ids: string[] }
  >()
```

Replacement text:

```
  const judgedStances = new Map<
    number,
    { stance_id: string; desc: string; cited_ids: string[] }
  >()

  /**
   * U5.4 — a ONE-SHOT handoff from the gate beat to the flush that follows it.
   *
   * `flush()` sees feed lines, not beats, so the citation is parked here by the
   * gate branch and consumed by the next radio line. It is cleared on that
   * line whether or not it had any slots, so a later beat's utterance can never
   * inherit an earlier round's citation.
   */
  let pendingCitedSlots: number[] | null = null
```

**E4c — `:103`.** Current text:

```
  function flush(): void {
    const lines = engine.feed()
    for (let i = cursor; i < lines.length; i += 1) {
      const line = lines[i]
      if (line === undefined) continue
      blocks.absorbLine(line)
      emit({ type: 'feed', line })
    }
    cursor = lines.length
  }
```

Replacement text:

```
  function flush(): void {
    const lines = engine.feed()
    for (let i = cursor; i < lines.length; i += 1) {
      const raw = lines[i]
      if (raw === undefined) continue
      // U5.4 — the agent's own line is the only one that can carry a citation,
      // and it carries the one parked by the gate beat that produced it.
      let line = raw
      if (raw.kind === 'radio' && pendingCitedSlots !== null) {
        if (pendingCitedSlots.length > 0) line = { ...raw, cited_slots: pendingCitedSlots }
        pendingCitedSlots = null
      }
      blocks.absorbLine(line)
      emit({ type: 'feed', line })
    }
    cursor = lines.length
  }
```

### E5 — `src/client/driver/fixtures/woodari-run03.ts`

**E5a — `:173`.** Current text:

```
const lineOf = (row: FeedRow, seq: Map<Channel, number>): FeedLine => {
  const line: FeedLine = { kind: row.kind, clock: row.t, text: row.text }
  if (row.who !== undefined) line.speaker = row.who
```

Replacement text:

```
const lineOf = (row: FeedRow, seq: Map<Channel, number>): FeedLine => {
  const line: FeedLine = { kind: row.kind, clock: row.t, text: row.text }
  if (row.who !== undefined) line.speaker = row.who
  if (row.cited !== undefined) line.cited_slots = row.cited
```

**E5b — `:57`.** Current text:

```
  { t: '09:26', kind: 'radio', text: '질문지를 덮겠습니다. 이 사람은 요구를 하러 전화한 게 아닙니다.' },
```

Replacement text:

```
  { t: '09:26', kind: 'radio', text: '질문지를 덮겠습니다. 이 사람은 요구를 하러 전화한 게 아닙니다.', cited: [1] },
```

**E5c — `:89`.** Current text:

```
  { t: '16:43', kind: 'radio', text: '이 통화를 협박이 아니라 구조 결함 신고로 재분류할 것을 요청합니다.' },
```

Replacement text:

```
  { t: '16:43', kind: 'radio', text: '이 통화를 협박이 아니라 구조 결함 신고로 재분류할 것을 요청합니다.', cited: [0, 2] },
```

**E5d — `:41`.** Current text:

```
interface FeedRow {
  t: string
  kind: FeedKind
  text: string
  who?: string
}
```

Replacement text:

```
interface FeedRow {
  t: string
  kind: FeedKind
  text: string
  who?: string
  /** U5.4 — slot indices this line cited, 0-based as the seam carries them. */
  cited?: number[]
}
```

### E6 — `src/client/components/run-feed.ts`

**E6a — `:203`.** Current text:

```
function partNode(part: FeedPart): Node {
  switch (part.p) {
    case 'label':
      return el('b', undefined, part.text)
```

Replacement text:

```
function partNode(part: FeedPart): Node {
  switch (part.p) {
    case 'cite':
      return el('span', 'fl-cite', part.text)
    case 'label':
      return el('b', undefined, part.text)
```

**E6b — `:85`.** Current text:

```
    case 'radio':
      return envelope(kind, line.clock, [
        { p: 'label', text: `${callsign}${RADIO_TAIL}` },
        { p: 'text', text: line.text },
      ])
```

Replacement text:

```
    case 'radio': {
      const parts: FeedPart[] = [
        { p: 'label', text: `${callsign}${RADIO_TAIL}` },
        { p: 'text', text: line.text },
      ]
      // U5.4 — the slots the agent cited, named the way the AGENT FILE names
      // them. It says WHICH sentence reached the agent and nothing about how:
      // the operator reads the slot and judges the conduct themselves. An
      // absent or empty citation prints no mark at all — never an empty one.
      const slots = line.cited_slots ?? []
      if (slots.length > 0) {
        const numbered = [...slots].sort((a, b) => a - b).map((s) => String(s + 1).padStart(2, '0'))
        parts.push({ p: 'cite', text: `${CITE_LABEL} ${numbered.join(' · ')}` })
      }
      return envelope(kind, line.clock, parts)
    }
```

**E6c — `:43`.** Current text:

```
export type FeedPart =
  | { p: 'text' | 'label' | 'quote' | 'span'; text: string }
  | { p: 'dots' }
```

Replacement text:

```
export type FeedPart =
  | { p: 'text' | 'label' | 'quote' | 'span' | 'cite'; text: string }
  | { p: 'dots' }

/**
 * U5.4 — the citation mark's fixed half. `인수인계` because that is the section
 * of the AGENT FILE the slots live in; the operator reads the same word in both
 * windows and the number is the whole cross-reference.
 */
const CITE_LABEL = '인수인계'
```

### E7 — `src/client/styles/win-live-feed.css`

Append to the **end** of the file:

```

/* U5.4 — the citation mark on the agent's own line. Seal red, which on this
   desk already means "a sentence of yours": the mined mark, the deploy stamp
   and the red thread are all this colour. It is a READOUT, not a control —
   no pointer affordance, no membrane op, nothing to press. */
.fl-cite{font-family:var(--mono);font-size:var(--fs-8);letter-spacing:.1em;
  color:var(--seal);vertical-align:super;margin-left:var(--space-6);white-space:nowrap}
```

### E8 — `tests/driver/membrane-slots.test.ts` — **new file**

Create it with exactly this content:

```
// U5.4 — the slot lookup the radio-line citation is resolved through.
//
// The membrane already kept `slots` so `unslot` could validate against it; this
// pins the reader U5.4 added over it, and above all pins what happens to a
// block the operator never seated — the case that decides whether the mark can
// ever be wrong.
import { describe, it, expect } from 'vitest'
import { createMembrane } from '../../src/driver/membrane.ts'
// `MutableBlockStore` is `import type`-d INTO membrane.ts from `./ports.ts` and
// is therefore not re-exported by it. It comes from ports.ts or nowhere.
import type { MutableBlockStore } from '../../src/driver/ports.ts'

const store = (): MutableBlockStore =>
  ({ has: () => true, absorbLine: () => undefined }) as unknown as MutableBlockStore

describe('[U5.4] the membrane resolves a block id to its slot', () => {
  it('(a) a seated block reports the slot it sits in', () => {
    const membrane = createMembrane(store())
    membrane.submit({ op: 'slot', block_id: 'b-r3-f01', slot: 2 })
    expect(membrane.slotOf('b-r3-f01')).toBe(2)
  })

  it('(b) a block the operator never seated resolves to null', () => {
    const membrane = createMembrane(store())
    membrane.submit({ op: 'slot', block_id: 'b-r3-f01', slot: 0 })
    // The citation case that matters: the model minted an id, so it names no
    // slot, so the line carries no mark. Absent, never wrong.
    expect(membrane.slotOf('b-r3-f99')).toBe(null)
  })

  it('(c) an unslotted block stops resolving', () => {
    const membrane = createMembrane(store())
    membrane.submit({ op: 'slot', block_id: 'b-r3-f01', slot: 1 })
    membrane.submit({ op: 'unslot', slot: 1 })
    expect(membrane.slotOf('b-r3-f01')).toBe(null)
  })
})
```

**If `createMembrane`'s signature or `MutableBlockStore`'s shape does not admit
this stub, stop and report rather than reshaping the stub.**

### E9 — `tests/windows/live-feed.test.ts`

Two edits. **E9a is not optional and is not a relaxation** — the guard exists so
that every player-visible Korean string in `run-feed.ts` is declared, and this
unit declares one more on purpose.

**E9a — `:420`.** Current text:

```
  it('(c) run-feed.ts authors exactly the five declared chrome literals', () => {
    const ALLOWED = new Set([
      '연속용지 · 상황실 무전 기록',
      '열람 전용 — 이 창은 조작되지 않습니다',
      '(변화 없음)',
      ' · 무전',
```

Replacement text:

```
  it('(c) run-feed.ts authors exactly the six declared chrome literals', () => {
    const ALLOWED = new Set([
      '연속용지 · 상황실 무전 기록',
      '열람 전용 — 이 창은 조작되지 않습니다',
      '(변화 없음)',
      ' · 무전',
      // U5.4's citation mark. Chrome, not run text: it names a SLOT of the
      // operator's own file — the same word the AGENT FILE prints over those
      // slots — and authors nothing about the scenario.
      '인수인계',
```

**E9b — append at the end of the file:**

```

/* ══ U5.4 — the citation mark ════════════════════════════════════════════ */

describe('[U5.4] the agent line names the slots that moved it', () => {
  it('(a) a cited radio line gains a cite part, numbered as the file numbers it', () => {
    const line: FeedLine = { kind: 'radio', clock: '09:26', text: '질문지를 덮겠습니다.', cited_slots: [1] }
    const node = feedLineModel(line)
    const cite = node.parts.find((p) => p.p === 'cite')
    // Slot 1 at the seam is 인수인계 02 on the paper — the AGENT FILE prints
    // `pad2(slot + 1)` and the two must not drift.
    expect(cite && 'text' in cite ? cite.text : '').toBe('인수인계 02')
  })

  it('(b) several slots read ascending, and an empty citation prints nothing', () => {
    const many: FeedLine = { kind: 'radio', clock: '16:43', text: '재분류를 요청합니다.', cited_slots: [2, 0] }
    const cite = feedLineModel(many).parts.find((p) => p.p === 'cite')
    expect(cite && 'text' in cite ? cite.text : '').toBe('인수인계 01 · 03')

    const none: FeedLine = { kind: 'radio', clock: '08:51', text: '회선 유지합니다.', cited_slots: [] }
    expect(feedLineModel(none).parts.some((p) => p.p === 'cite')).toBe(false)
    const absent: FeedLine = { kind: 'radio', clock: '08:51', text: '회선 유지합니다.' }
    expect(feedLineModel(absent).parts.some((p) => p.p === 'cite')).toBe(false)
  })
})
```

**`FeedLine` and `feedLineModel` are already imported by this file** — `:25` and
`:30`. Add no import. If either is not in scope, stop and report.

### E10 — `e2e/live-feed.spec.ts`

Append at the **end** of the file:

```

/* ══ U5.4 — the citation mark ════════════════════════════════════════════ */

test.describe('[U5.4] the agent line names the slots that moved it', () => {
  test('[U5.4] (a) a cited radio line carries the slot mark, an uncited one does not', async ({ page }) => {
    await boot(page)
    // Release the day up to the fixture's cited line (09:26).
    await page.evaluate(() => {
      const handle = (window as unknown as { __feed?: { seek(at: string): void } }).__feed
      if (!handle) throw new Error('window.__feed is not exposed by the LIVE FEED window')
      handle.seek('09:30')
    })

    const cites = page.locator(`${LIST} li.fl-radio .fl-cite`)
    await expect(cites.first()).toHaveText('인수인계 02')

    // The 08:51 radio line cites nothing and must carry no mark — the mark is
    // absent, not empty.
    const firstRadio = page.locator(`${LIST} li.fl-radio`).first()
    await expect(firstRadio.locator('.fl-cite')).toHaveCount(0)

    // It is a readout, not a control: no membrane op rides it.
    await expect(page.locator(`${LIST} .fl-cite[data-op]`)).toHaveCount(0)
  })
})
```

## Invariants

- **The seam and the spec fence change together.** `seam-shapes.test.ts` reads
  `docs/spec-client.md` §5.2 and compares it to `src/shared/view-driver.ts`.
  Either edit alone is red.
- **`because_*` never crosses.** `shared/seam-keys.ts` bans the family and
  `tests/driver/seam-leak-guard.test.ts` scans the seam's own source text for
  it. The field is `cited_slots`; no raw response field is forwarded.
- **The membrane rule.** The mark carries no `data-op` and no `sentence_id`; the
  five-op census in `e2e/a11y.spec.ts` must still find exactly its five, and the
  mark must not become minable.
- **The scenario is replaceable.** `인수인계` is frame copy, game-owned. No
  scenario literal is minted; the fixture's `cited` values are slot indices.
- **The engine is untouched.** Nothing under `src/engine/` is in Scope.
- **Geometry and colour come from tokens** — `--seal`, `--mono`, `--fs-8`,
  `--space-6`, all already defined in `tokens.css`.

## Verification

- `npm run check` — passes.
- `npx vitest run` — expect **1604** (1599 on `main` + E8's three + E9's two).
  Report the count you actually get.
- `npm run build` — passes.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `npm run check` clean, `npm run build` clean, full vitest green at 1604.
- [ ] `npx vitest run tests/driver/seam-shapes.test.ts tests/driver/seam-leak-guard.test.ts`
      is green — the pair that proves E1 and E2 stayed in step.
- [ ] `grep -rn "because_" src/shared/view-driver.ts src/client/components/run-feed.ts`
      returns nothing.
- [ ] `git diff --name-only HEAD` names exactly the nine Scope files and nothing
      else. `src/engine/` appears nowhere in it.
- [ ] **Behavioural:** in your report, state what `feedLineModel` returns for
      `{ kind: 'radio', clock: '09:26', text: 'x', cited_slots: [2, 0] }` — the
      full `parts` array — read out of the test you added, not guessed.

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
