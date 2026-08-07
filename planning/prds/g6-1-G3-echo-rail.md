# g6-1 — G3: the desk stops saying `RUN nn` — the sitting speaks as `ECHO-n`

> plan-playtest v12 · citations bind to `fa49be6` · branch `playtest/g6-1-g3-echo`
> commit message: `playtest(G3): RUN nn labels become the sitting's callsign — ECHO-n`

## Outcome

Every player-facing label that named a sitting as `RUN nn` now names it by its
callsign, `ECHO-n` — the REPORTS archive rail, the spoken run-opened
announcement, the AGENT FILE's deploy stamp, its settle notes, and the LIVE
FEED's fanfold head. `RUN 01` is a number and reads as "my second attempt";
`ECHO-2` is a person, which makes a failed run a dead agent. The run-counter's
D-DAY allotment (`RUN 03` over the pips) deliberately keeps `RUN`: it counts
attempts, not people. Invariant 6 is untouched — `ECHO-n` passes the deny list
by design.

## Scope

May modify:
- `src/client/components/report-archive.ts`
- `src/client/shell/announcer.ts`
- `src/client/components/deploy-button.ts`
- `src/client/windows/agent-file.ts`
- `src/client/components/run-feed.ts`
- `docs/spec-client.md` (invariant 6's example, `:113-115`, and the
  `ReportArchive` row, `:305`)
- `tests/windows/reports.test.ts` (`:441-451` only)
- `tests/windows/agent-file.test.ts` (`:596-605` only)
- `e2e/agent-file.spec.ts` (`:276`, `:300` only)

Must NOT modify:
- `src/client/components/run-counter.ts` — the allotment counter keeps `RUN`
  (decision above); `e2e/shell.spec.ts:449,:474` and
  `e2e/preview-smoke.spec.ts:175` pin it and stay green unchanged.
- `src/client/driver/fixtures/woodari-meta.ts:24-25` and
  `src/client/driver/fixtures/run-loop.ts:82-84` — the fixture labels keep
  their `RUN 01 / …` prefix; `OWN_PREFIX` exists to strip it, and
  `tests/fixtures/meta-and-archive.test.ts:17,:79` pins their format.
- `report-archive.ts`'s `OWN_PREFIX` (`:31`) and `REFUSED` (`:34`) — the strip
  regex still targets the fixture prefix, and the deny list is what keeps
  invariant 6.
- `src/client/shell/boot-run.ts` — `:23-24` is a comment only.
- `e2e/reports.spec.ts` — `:141` parses digits out of the option label;
  `ECHO-1` still yields `1`, so it stays green unchanged.

Tests turned red then amended: `tests/windows/reports.test.ts` (b) at `:441`,
`tests/windows/agent-file.test.ts` (d)/(e) at `:596-605`,
`e2e/agent-file.spec.ts:276,:300`.

Shared-file note: `tests/windows/agent-file.test.ts` is also edited by g5-1
(`:39`, `:727-731`) — regions 100+ lines apart; the author reconciles at merge.

## Change list

Per file, same-file edits bottom-up.

**1. `src/client/components/report-archive.ts`**

1a. `:150-151` — current (comment above the render line):
```
        // The space is load-bearing: `RUN 01` and the span must read as two
        // words in the accessible name, not as one run of digits.
```
replace with:
```
        // The space is load-bearing: `ECHO-1` and the span must read as two
        // words in the accessible name, not as one run of digits.
```

1b. `:61` — current:
```
      runLabel: runLabelOf(entry.run),
```
replace with:
```
      runLabel: callsignOf(entry.run),
```

1c. `:42-45` — current:
```
/** `RUN nn`, zero-padded, derived from the run NUMBER and not from the label. */
function runLabelOf(run: number): string {
  return `RUN ${String(run).padStart(2, '0')}`
}
```
replace with nothing, and collapse the doubled blank line this leaves between
`REFUSED`'s block and the next docstring (`callsignOf` arrives by import).

1d. `:14` — current:
```
import { el } from '../shell/dom.ts'
```
replace with:
```
import { el } from '../shell/dom.ts'
import { callsignOf } from './dossier.ts'
```

1e. `:3-6` — current:
```
// The rail is segmented by RUN and TIME, and by nothing else: "no gate label
// appears on any player surface". The seam hands over `meta.archive` as
// `{run, label}` pairs, so the run number is the authority for the `RUN nn`
// half and the label contributes only its time span — a label that already
```
replace with:
```
// The rail is segmented by SITTING and TIME, and by nothing else: "no gate
// label appears on any player surface". The seam hands over `meta.archive` as
// `{run, label}` pairs, so the run number is the authority for the `ECHO-n`
// half (G3 — `callsignOf`) and the label contributes only its time span — a
// label that already
```

**2. `src/client/shell/announcer.ts`**

2a. `:26` — current:
```
const RUN_OPENED = (run: number) => `RUN ${String(run).padStart(2, '0')} 시작`
```
replace with:
```
const RUN_OPENED = (run: number) => `${callsignOf(run)} 교신 시작`
```

2b. `:21` — current:
```
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'
```
replace with:
```
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'
import { callsignOf } from '../components/dossier.ts'
```

**3. `src/client/components/deploy-button.ts`**

3a. `:91` — current:
```
    stampLine: `RUN ${pad2(state.run)} · ${state.at}`,
```
replace with:
```
    stampLine: `${callsignOf(state.run)} · ${state.at}`,
```

3b. `:48` — current:
```
  /** `"RUN 03 · 08:50"` — the run the file was committed for. */
```
replace with:
```
  /** `"ECHO-3 · 08:50"` — the sitting the file was committed for. */
```

3c. `:20` — current (`:91` was `pad2`'s only use in this file — verified):
```
import { pad2 } from './block-card.ts'
```
replace with:
```
import { callsignOf } from './dossier.ts'
```

**4. `src/client/windows/agent-file.ts`** (the file already imports
`callsignOf` at `:28`; `pad2` stays imported — `:134` still uses it)

4a. `:248-251` — current:
```
      const runLabel = pad2(store.get().meta.run)
      setTimeout(() => {
        if (!settled) announce(`${RUN_CAPTION}${runLabel}${SAY_HOLD_TAIL}`)
      }, PACE.OPEN_DELAY)
```
replace with:
```
      const who = callsignOf(store.get().meta.run)
      setTimeout(() => {
        if (!settled) announce(`${who}${SAY_HOLD_TAIL}`)
      }, PACE.OPEN_DELAY)
```

4b. `:200-213` — current (first line `    settled = true`):
```
    settled = true
    dropHold()
    const runLabel = pad2(store.get().meta.run)
    if (release === 'filed') {
      settleNote = `${RUN_CAPTION}${runLabel}${FILED_TAIL}`
      sync()
      announce(`${RUN_CAPTION}${runLabel}${SAY_FILED_TAIL}`)
    } else {
      // …and the lapse is SAID, above all: it is the release nothing else on
      // the desk echoes, and the one that hands back a degraded day.
      settleNote = `${RUN_CAPTION}${runLabel}${LAPSED_TAIL}`
      sync()
      announce(`${RUN_CAPTION}${runLabel}${SAY_LAPSED_TAIL}`)
    }
```
replace with:
```
    settled = true
    dropHold()
    const who = callsignOf(store.get().meta.run)
    if (release === 'filed') {
      settleNote = `${who}${FILED_TAIL}`
      sync()
      announce(`${who}${SAY_FILED_TAIL}`)
    } else {
      // …and the lapse is SAID, above all: it is the release nothing else on
      // the desk echoes, and the one that hands back a degraded day.
      settleNote = `${who}${LAPSED_TAIL}`
      sync()
      announce(`${who}${SAY_LAPSED_TAIL}`)
    }
```

4c. `:40` — current:
```
const RUN_CAPTION = 'RUN '
```
replace with nothing.

**5. `src/client/components/run-feed.ts`**

5a. `:282` — current:
```
        stock.textContent = HEAD_STOCK + RUN_PREFIX + String(event.run)
```
replace with (`callsign` is assigned on the line directly above, `:281`):
```
        stock.textContent = HEAD_STOCK + HEAD_SEP + callsign
```

5b. `:156-157` — current:
```
/** The run the header names arrives on the `meta` event, never from here (C3). */
const RUN_PREFIX = ' · RUN '
```
replace with:
```
/** The sitting the header names arrives on the `meta` event, never from here (C3). */
const HEAD_SEP = ' · '
```

**6. `docs/spec-client.md`**

6a. `:305` — current:
```
| `ReportArchive` | per-run sections (run/time segmented — no gate labels) | archive rail (`RUN 01 / 08:50 — 21:04`); mined and slotted marks persist |
```
replace with:
```
| `ReportArchive` | per-run sections (run/time segmented — no gate labels) | archive rail (`ECHO-1 08:50 — 21:04`); mined and slotted marks persist |
```

6b. `:113-115` — current:
```
6. **Archive segmentation** — the report archive is segmented by run/time
   (`RUN 01 / 08:50 — 21:04`); **no gate label** appears on any player
   surface (08-03 decision, architecture §2.1).
```
replace with:
```
6. **Archive segmentation** — the report archive is segmented by run/time
   (`ECHO-1 08:50 — 21:04` — the sitting's callsign, G3); **no gate label**
   appears on any player surface (08-03 decision, architecture §2.1).
```

**7. `tests/windows/reports.test.ts:441-452`** — current (whole `it` block):
```
  it('(b) the run label is `RUN nn`, zero-padded, derived from the number', async () => {
    const a = await archive()
    const segments = a.archiveSegments(
      [
        { run: 1, label: '08:50 — 21:04' },
        { run: 12, label: '09:10 — 21:04' },
      ],
      1,
    )
    expect(segments[0]!.runLabel).toBe('RUN 01')
    expect(segments[1]!.runLabel).toBe('RUN 12')
  })
```
replace with:
```
  it("(b) the run label is the sitting's callsign, derived from the number", async () => {
    const a = await archive()
    const segments = a.archiveSegments(
      [
        { run: 1, label: '08:50 — 21:04' },
        { run: 12, label: '09:10 — 21:04' },
      ],
      1,
    )
    expect(segments[0]!.runLabel).toBe('ECHO-1')
    expect(segments[1]!.runLabel).toBe('ECHO-12')
  })
```
(The sibling test `(c)` at `:454-466` is untouched: it asserts the span strip
and the no-doubling regex, both of which still hold.)

**8. `tests/windows/agent-file.test.ts:596-605`** — current:
```
    expect(v.stampOn).toBe(true)
    expect(v.stampLine).toBe('RUN 03 · 08:50')
    expect(v.stampLine).toMatch(/^RUN \d{2} · \d{2}:\d{2}$/)
  })

  it('(e) the run number is zero-padded to two digits, whatever the run', async () => {
    const { deployView } = await loadDeployButton()
    expect(deployView({ slots: [], deployed: true, run: 1, at: '13:05' }).stampLine).toBe('RUN 01 · 13:05')
    expect(deployView({ slots: [], deployed: true, run: 10, at: '13:05' }).stampLine).toBe('RUN 10 · 13:05')
  })
```
replace with:
```
    expect(v.stampOn).toBe(true)
    expect(v.stampLine).toBe('ECHO-3 · 08:50')
    expect(v.stampLine).toMatch(/^ECHO-\d+ · \d{2}:\d{2}$/)
  })

  it('(e) the stamp names the sitting, unpadded, whatever the run', async () => {
    const { deployView } = await loadDeployButton()
    expect(deployView({ slots: [], deployed: true, run: 1, at: '13:05' }).stampLine).toBe('ECHO-1 · 13:05')
    expect(deployView({ slots: [], deployed: true, run: 10, at: '13:05' }).stampLine).toBe('ECHO-10 · 13:05')
  })
```

**9. `e2e/agent-file.spec.ts`** — two single-line edits, bottom-up.

9a. `:300` — current:
```
    await expect(page.locator('#deployStamp em')).toHaveText(/^RUN \d{2} · \d{2}:\d{2}$/)
```
replace with:
```
    await expect(page.locator('#deployStamp em')).toHaveText(/^ECHO-\d+ · \d{2}:\d{2}$/)
```

9b. `:276` — current:
```
    await expect(stamp.locator('em')).toHaveText(/^RUN \d{2} · \d{2}:\d{2}$/)
```
replace with:
```
    await expect(stamp.locator('em')).toHaveText(/^ECHO-\d+ · \d{2}:\d{2}$/)
```

## Invariants

- **Invariant 6 / the deny list.** `REFUSED = /gate|게이트/i` is untouched;
  `ECHO-n` passes it by design. Do not "improve" the guard.
- **`callsignOf` is the single derivation** (`dossier.ts:19-21`,
  `` `ECHO-${Math.max(1, run)}` ``). Never inline a second
  `` `ECHO-${…}` `` template in the files this unit touches — import.
  (`run-feed.ts:281` already carries a pre-M1 inline copy; it is not this
  unit's to consolidate. Leave it.)
- **The scenario stays replaceable.** `ECHO-n` is game-owned frame copy
  (plan-playtest §5.4); nothing scenario-specific is minted here.
- **The membrane rule** — no free-text surface appears or changes.

## Verification

1. `npm run check` — green.
2. `npx vitest run` — green (the two amended suites included).
3. `npm run build` — green.

(The author runs the full e2e pass on the merge preview; this unit's two e2e
rows are regex loosenings that cannot pass against the old strings.)

## Done when

- [ ] `npm run check`, `npx vitest run`, `npm run build` all exit 0.
- [ ] Scoped grep:
      `grep -n "RUN " src/client/components/report-archive.ts src/client/shell/announcer.ts src/client/components/deploy-button.ts src/client/windows/agent-file.ts src/client/components/run-feed.ts`
      prints exactly two survivors — `report-archive.ts:29`'s `OWN_PREFIX` doc
      comment and `:31`'s regex (both strip the fixture prefix) — and nothing
      else.
- [ ] Behavioural: in the built game (`npm run build && npm run preview`,
      DEV fixture via `?signin=skip`), the archive rail's first option reads
      `ECHO-1 <time span>`, the deploy stamp reads `ECHO-n · HH:MM`, and the
      LIVE FEED head reads `연속용지 · 상황실 무전 기록 · ECHO-n`.
- [ ] Exactly one code commit on `playtest/g6-1-g3-echo`, nothing pushed.

## As executed — author amendment after the merge-preview e2e (08-08)

The Scope's no-edit claims held for `e2e/reports.spec.ts:141` (digit-parse)
but missed six other rail oracles keyed on `RUN nn`: label regexes at
`reports.spec.ts:456` and `run-loop.spec.ts:346`, and four `hasText` option
filters at `reports.spec.ts:506,:530,:544,:548` that matched nothing after the
rename and timed out. Author commit `1eeb14b` moves all six to
`` `ECHO-${n}\b` ``. The Done-when grep row's survivor count was also wrong
(the `OWN_PREFIX` comment sits at `:32` after edits, and two prose comments in
`announcer.ts:19` / `deploy-button.ts:13` match `"RUN "` harmlessly).

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
