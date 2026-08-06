# M1 — the callsign is per sitting: ECHO-1, ECHO-2, … a person per simulation

> plan-playtest.md **v7** · change list stamped against tree `14dd971` (2026-08-07),
> **assuming `g1-1`…`g1-4` are merged** (every earlier group-1 edit is
> line-count-preserving, so the line numbers below still hold; `report-view.ts:124`'s
> current text below is `g1-4`'s output). Stamp again if the branch moved.
> Executor: Sonnet-class session. Branch `playtest/g1-5-m1` off current `main`.
> One commit, message: `playtest(M1): callsign threads per run — ECHO-n`.
> Open a PR; merge nothing (§5.6). Before the first edit, confirm
> `git config user.email` resolves to the `alstjgg` account (repo hard rule 1).
>
> **Apply each file's edits in the order listed** — within a file they are ordered
> bottom-up so an applied edit never shifts the next edit's cited lines.

## Outcome

Every surface that names the agent derives the callsign from the run number —
`ECHO-n` — instead of the hardcoded `ECHO-1`: the AGENT FILE head and §0, the
LIVE FEED's radio label, and the 무전 기록's sub-line and signature. On the DEV
fixture (which opens on run 03) they all read `ECHO-3`; after NEW RUN they read
`ECHO-4`. A failed run becomes a dead agent, not a number.

## Scope

May modify (only these eight files):

- `src/client/components/dossier.ts` — `CALLSIGN` becomes `callsignOf(run)`;
  `DossierInput` gains `callsign`.
- `src/client/windows/agent-file.ts` — header node + dossier rebuild per run.
- `src/client/components/report-view.ts` — `brand(callsign)` for sub + signature.
- `src/client/windows/reports.ts` — calls `brand` on every `meta`.
- `src/client/components/run-feed.ts` — radio label's callsign half per run.
- `tests/windows/agent-file.test.ts` — the `dossierInput` helper gains the field.
- `tests/windows/live-feed.test.ts` — one pinned literal swaps.
- `e2e/agent-file.spec.ts` — the `.fh-v` expectation becomes the fixture's run.

Must NOT modify:

- Every `RUN nn` label — `announcer.ts:26`, `run-counter.ts`, `deploy-button.ts`,
  `report-archive.ts`, `run-feed.ts`'s header line (`HEAD_STOCK + RUN_PREFIX + …`),
  and the fixture `ARCHIVE` labels in `woodari-meta.ts:24-25`. Those are G3
  (group 6), not this unit.
- `src/client/components/slot-board.ts`, `block-card.ts`, `src/shared/*` — guarded
  by working-tree diff tests; this unit has no business there.

Tests turning red, and their disposition: `tests/windows/agent-file.test.ts`
(typecheck of the helper — **amended**, E14), `tests/windows/live-feed.test.ts:400`
(pinned literal — **amended**, E13), `e2e/agent-file.spec.ts:186` (**amended**, E15).
No working-tree diff guard covers this unit's files; commit before running suites
anyway, for uniformity with the other group-1 units.

Known duplication, deliberate: run-feed builds `` `ECHO-${…}` `` inline (E12)
instead of importing `callsignOf`, because the u5 unit is pinned by structure tests
(`live-feed.test.ts` SOURCES) and a new cross-component import is a bigger risk
than one duplicated format. G3 revisits that same `meta` case later.

## Change list

### `src/client/components/dossier.ts` (bottom-up: :92 → :36-37 → :18-19)

**E1 — `:92`**
current:
```ts
        ['호출부호', CALLSIGN],
```
replace with:
```ts
        ['호출부호', input.callsign],
```

**E2 — `:36-37`** (inside `DossierInput`)
current:
```ts
  /** §4's cap — read from `SLOT_CAP`, so note and board cannot drift (D3). */
  slotCap: number
```
replace with:
```ts
  /** §4's cap — read from `SLOT_CAP`, so note and board cannot drift (D3). */
  slotCap: number
  /** §0's 호출부호 — `ECHO-n` for the sitting on the desk (M1). */
  callsign: string
```

**E3 — `:18-19`**
current:
```ts
/** The agent's callsign — document art; the pack carries none (D4). */
export const CALLSIGN = 'ECHO-1'
```
replace with:
```ts
/** The sitting's callsign, `ECHO-n` — document art; the pack carries none (D4). */
export function callsignOf(run: number): string {
  return `ECHO-${Math.max(1, run)}`
}
```

### `src/client/windows/agent-file.ts` (bottom-up: :108-112 → :95 → :75-76 → :71-73 → :52 → :17)

**E4 — `:108-112`**
current:
```ts
    if (event.type !== 'meta') return
    run = event.run
    // D10 — the seam carries no `new_run` event; a changed run IS the unlock.
    if (committedRun !== null && event.run !== committedRun) board.unlock()
    sync()
```
replace with:
```ts
    if (event.type !== 'meta') return
    run = event.run
    // D10 — the seam carries no `new_run` event; a changed run IS the unlock.
    if (committedRun !== null && event.run !== committedRun) board.unlock()
    // M1 — §0's callsign is per sitting: a changed run re-prints the dossier.
    const next = buildDossier(dossierModel(dossierInput()), board.root)
    dossier.replaceWith(next)
    dossier = next
    sync()
```

**E5 — `:95`**
current:
```ts
  right.append(el('div', 'fh-k', '호출부호'), el('div', 'fh-v', CALLSIGN))
```
replace with:
```ts
  right.append(el('div', 'fh-k', '호출부호'), callsignLine)
```

**E6 — `:75-76`**
current:
```ts
  function sync(): void {
    docLine.textContent = `문서번호 ${PORTAL.portalCode}/AF/${slug}/${pad2(run)}`
```
replace with:
```ts
  function sync(): void {
    docLine.textContent = `문서번호 ${PORTAL.portalCode}/AF/${slug}/${pad2(run)}`
    callsignLine.textContent = callsignOf(run)
```

**E7 — `:71-73`**
current:
```ts
  function dossierInput(): DossierInput {
    return { slotCap: SLOT_CAP, clockBand: band, slotHost: board.root }
  }
```
replace with:
```ts
  function dossierInput(): DossierInput {
    return { slotCap: SLOT_CAP, callsign: callsignOf(run), clockBand: band, slotHost: board.root }
  }
```

**E8 — `:52`**
current:
```ts
  const docLine = el('div', 'fh-doc')
```
replace with:
```ts
  const docLine = el('div', 'fh-doc')
  const callsignLine = el('div', 'fh-v', callsignOf(run))
```

**E9 — `:17`**
current:
```ts
import { CALLSIGN, buildDossier, dossierModel } from '../components/dossier.ts'
```
replace with:
```ts
import { buildDossier, callsignOf, dossierModel } from '../components/dossier.ts'
```

### `src/client/components/report-view.ts` (bottom-up: return tail → :141-146 → :124 → interface tail)

**E10a — the returned object's tail** (currently `:285-289`)
current:
```ts
    round(): number | null {
      return current === null ? null : current.round
    },
  }
}
```
replace with:
```ts
    round(): number | null {
      return current === null ? null : current.round
    },

    brand(callsign: string): void {
      sigLine.textContent = callsign
      if (bodySub !== null) bodySub.textContent = `${callsign}${BODY_SUB_TAIL}`
    },
  }
}
```

**E10b — `:141-146`**
current:
```ts
  const sig = el('div', 'sig')
  sig.setAttribute('aria-hidden', 'true')
  sig.append(el('span', 'sig-line', 'ECHO-1'), el('span', 'sig-stamp', '검 인'))

  const docBody = el('article', 'doc doc-body')
  docBody.append(documentHead(BODY_HEAD), body, sig)
```
replace with:
```ts
  const sig = el('div', 'sig')
  sig.setAttribute('aria-hidden', 'true')
  const sigLine = el('span', 'sig-line', 'ECHO-1')
  sig.append(sigLine, el('span', 'sig-stamp', '검 인'))

  const docBody = el('article', 'doc doc-body')
  const bodyHead = documentHead(BODY_HEAD)
  const bodySub = bodyHead.querySelector('i')
  docBody.append(bodyHead, body, sig)
```

**E10c — `:124`** (this is `g1-4`'s output text)
current:
```ts
const BODY_HEAD = { no: '나', title: '무전 기록', sub: 'ECHO-1 송신 · 1인칭' }
```
replace with:
```ts
/** The callsign half of `나`'s sub and the signature re-brands per sitting (M1). */
const BODY_SUB_TAIL = ' 송신 · 1인칭'
const BODY_HEAD = { no: '나', title: '무전 기록', sub: `ECHO-1${BODY_SUB_TAIL}` }
```

**E10d — the `ReportView` interface tail** (currently `:104-106`)
current:
```ts
  /** The round currently on the page, or `null` before the first report. */
  round(): number | null
}
```
replace with:
```ts
  /** The round currently on the page, or `null` before the first report. */
  round(): number | null
  /** Re-brands the callsign surfaces — `나`'s sub and the signature (M1). */
  brand(callsign: string): void
}
```

### `src/client/windows/reports.ts` (bottom-up: :96-101 → :13-14)

**E11a — `:96-101`**
current:
```ts
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      sync()
      return
    }
```
replace with:
```ts
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      view.brand(callsignOf(event.run))
      sync()
      return
    }
```

**E11b — `:13-14`**
current:
```ts
import type { FixtureDriver } from '../driver/index.ts'
import { deriveMarks, mine } from '../components/minable-sentence.ts'
```
replace with:
```ts
import type { FixtureDriver } from '../driver/index.ts'
import { callsignOf } from '../components/dossier.ts'
import { deriveMarks, mine } from '../components/minable-sentence.ts'
```

### `src/client/components/run-feed.ts` (bottom-up: :244-246 → :232 → :197-201 → :84-88 → :78 → :59-60)

**E12a — `:244-246`**
current:
```ts
      case 'meta':
        stock.textContent = HEAD_STOCK + RUN_PREFIX + String(event.run)
        break
```
replace with:
```ts
      case 'meta':
        callsign = `ECHO-${Math.max(1, event.run)}`
        stock.textContent = HEAD_STOCK + RUN_PREFIX + String(event.run)
        break
```

**E12b — `:232`**
current:
```ts
    const node = feedLineModel(line)
```
replace with:
```ts
    const node = feedLineModel(line, callsign)
```

**E12c — `:197-201`**
current:
```ts
  let band = false
  let symptoms = 0
  let stamp = ''
  let answered = false
  let pending: { cls: FallbackClass; code: string } | null = null
```
replace with:
```ts
  let band = false
  let symptoms = 0
  let stamp = ''
  let answered = false
  let callsign = 'ECHO-1'
  let pending: { cls: FallbackClass; code: string } | null = null
```

**E12d — `:84-88`**
current:
```ts
    case 'radio':
      return envelope(kind, line.clock, [
        { p: 'label', text: RADIO_LABEL },
        { p: 'text', text: line.text },
      ])
```
replace with:
```ts
    case 'radio':
      return envelope(kind, line.clock, [
        { p: 'label', text: `${callsign}${RADIO_TAIL}` },
        { p: 'text', text: line.text },
      ])
```

**E12e — `:78`**
current:
```ts
export function feedLineModel(line: FeedLine): FeedNode {
```
replace with:
```ts
export function feedLineModel(line: FeedLine, callsign = 'ECHO-1'): FeedNode {
```

**E12f — `:59-60`**
current:
```ts
/** The radio call sign the reference prints above every ECHO transmission. */
const RADIO_LABEL = 'ECHO-1 · 무전'
```
replace with:
```ts
/** The radio label's fixed half — the callsign half arrives per sitting (M1). */
const RADIO_TAIL = ' · 무전'
```

### Test and e2e amendments

**E13 — `tests/windows/live-feed.test.ts:400`**
current:
```ts
      'ECHO-1 · 무전',
```
replace with:
```ts
      ' · 무전',
```

**E14 — `tests/windows/agent-file.test.ts:176-180`**
current:
```ts
const dossierInput = (): { slotCap: number; clockBand: string; slotHost: HTMLElement } => ({
  slotCap: 4,
  clockBand: '08:50 → 21:04',
  slotHost: HOST_STUB,
})
```
replace with:
```ts
const dossierInput = (): { slotCap: number; callsign: string; clockBand: string; slotHost: HTMLElement } => ({
  slotCap: 4,
  callsign: 'ECHO-1',
  clockBand: '08:50 → 21:04',
  slotHost: HOST_STUB,
})
```

**E15 — `e2e/agent-file.spec.ts:186`** (the DEV fixture opens on run 03 —
`woodari-meta.ts:19` — so the head reads `ECHO-3`)
current:
```ts
    await expect(page.locator(`${FILE} .fh-v`)).toHaveText('ECHO-1')
```
replace with:
```ts
    await expect(page.locator(`${FILE} .fh-v`)).toHaveText('ECHO-3')
```

## Invariants

- **The pack carries no callsign** (D4): `callsignOf` derives from the run number
  the seam already carries. Do not add a callsign to any pack, schema, or event.
- **The radio label is agent-channel, not NPC-channel** — the digit in `ECHO-3` is
  allowed there, exactly as `ECHO-1` was; do not add digits to any other feed text.
- **u5's structure tests** pin run-feed's Hangul literals and forbid listeners and
  membrane surfaces in the feed unit — the edits above add none of those. If a u5
  guard still goes red, stop and report (§5.7); do not restructure to appease it.
- **`RUN nn` stays `RUN nn`** everywhere this unit does not list — G3 owns those.

## Verification

Run in this order, from the repo root, after committing:

1. `npm run test` — expected: all green (including the amended live-feed and
   agent-file suites).
2. `npm run build` — expected: green.
3. `npm run test:e2e -- e2e/agent-file.spec.ts` — expected: green.
4. Behavioral (DEV): `npm run dev` — the AGENT FILE head `호출부호` and §0 both read
   `ECHO-3`; radio lines in LIVE FEED are labeled `ECHO-3 · 무전`; the 무전 기록's
   sub reads `ECHO-3 송신 · 1인칭` and its signature `ECHO-3`.

## Done when

- [ ] All edits applied exactly, in the listed per-file order; `git diff HEAD~1 --stat` shows exactly the eight listed files.
- [ ] Steps 1–3 green, in order, post-commit.
- [ ] The running DEV desk shows `ECHO-3` on all four surfaces (behavioural check 4).
- [ ] `grep -rn "CALLSIGN\b" src tests e2e` returns no hits (the constant is gone; only `callsignOf` remains).
- [ ] `grep -rn 'ECHO-1' src` returns only fallback defaults in `run-feed.ts` (`callsign = 'ECHO-1'` ×2) and `report-view.ts`'s initial nodes — no rendered surface hardcodes it unconditionally.
- [ ] PR opened from `playtest/g1-5-m1`; nothing merged.

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
