# g13-4 — U5.3: one page per ECHO-n, and flipping back reads what that agent flew

> plan-playtest v14 · citations bind to `59af325` · branch `playtest/g13-4-page-per-agent`
> commit message: `playtest(U5.3): the AGENT FILE keeps a page per agent — flipping back reads what they flew`

## Outcome

The AGENT FILE stops forgetting. When a sitting ends, the file the agent flew
becomes **a page of its own**, and the player turns back to it. ECHO-1's page
shows ECHO-1's 식별 and the sentences ECHO-1 was actually handed, read-only and
flagged 열람; the last page is always the agent who has not gone out yet, with
the live board and DEPLOY on it. A new sitting appends a page and opens on it.

The player can finally answer "what did I change between ECHO-2 and ECHO-3".

## Why (author-resolved — do not re-derive)

This is the second half of group 6, and C1 exists for it: *"the player cannot
compare this sitting against the last one until the previous file exists
somewhere on the desk."* C1 built the book with two pages and left the page list
a list. This unit fills it.

Without it the comparison surface the C-BLOCK loop depends on does not exist —
U5.2c will show which sentence moved *this* agent, and there is nothing to hold
it against, because the previous file is gone from the desk entirely.

## Design (author-resolved — do not re-derive)

**Where a past page's contents come from.** The client, not the seam. The
window already holds `sentences` (id → Sentence, filled from every `report`
event and never cleared) and the board's ids. Nothing needs to be added to the
seam, persisted, or fetched — which is what keeps this a client-only unit under
§5.2. H2 dropped the resume, so a session is exactly the span in which the
player deployed these files; a page that outlived the session would have nothing
to show anyway.

**Which agent flew which file — the one real judgement call.** A file is
committed twice per sitting in the general case, and the two commits belong to
*different* agents:

- The **opening** commit (`deployView` mode `'deploy'`, build phase) is the file
  the agent now on the desk is about to fly. It belongs to `run`.
- The **closing** commit (mode `'next'`) sends `deploy` to the **closing** run's
  membrane — W4's op order, and load-bearing — but what it carries is the file
  the operator built *after* 21:04, for the agent the next press opens. It
  belongs to the run the following `meta` names.

So there are exactly two write sites, and each is unambiguous without any
arithmetic on the authority's numbers ([u7#c3] forbids that):

1. `mode === 'deploy'` → `filed.set(run, …)`. In practice this fires for ECHO-1
   only: after a `new_run` the file arrives already committed, so the mode is
   never `'deploy'` again. Without it ECHO-1 would never get a page, which is
   the first comparison the player would want.
2. `meta` with `changedRun && board.isLocked()` → `filed.set(event.run, …)`.
   This is the **same re-pointing the stamp already does** on the two lines
   above it — `committedRun = event.run`. Page inventory and stamp date agree by
   construction because they are decided by the same branch.

Each run is written exactly once. A page is rendered as *past* only while
`flown < run`, so the current agent's own record is held but not shown twice.

**A past page must not anchor a red thread.** `thread-layer.ts:28` selects slot
anchors by `[data-block-id]`. `buildBlockCard` writes `data-block`, not
`data-block-id`, and a past page builds no `.slot` and no `.slot-pin` — so past
cards are invisible to the thread layer by construction. Do not add the
attribute for symmetry.

**A past page must not touch the board.** D7 is one desk, one file, one
`SlotBoard`. A past page builds its own host of read-only cards; `board.root` is
re-parented into the live page only, exactly as today.

**A new sitting opens on its own page.** `turn('last')` on a changed run. Left
alone, `viewing` would keep its index and the player would land on a past page
with no DEPLOY on it.

**A new section state, `'filed'`, rather than reusing `'operable'`.** Its flag is
열람 and its note says the sitting is over. Reusing `'operable'` would print
조작 가능 and "배치 후 잠금" on a page nothing can be done to.

## Scope

May modify:

- `src/client/components/dossier.ts` — the `'filed'` state and `filedModel`
- `src/client/windows/agent-file.ts` — the record, its two write sites, the page list
- `src/client/styles/win-agent-file.css` — the past page's card list
- `tests/windows/agent-file.test.ts` — the shadow types and `filedModel`'s own test
- `e2e/agent-file.spec.ts` — the behavioural claim

Must NOT modify:

- **`src/client/components/slot-board.ts` — and this one bites.**
  `tests/windows/block-store.test.ts:557-559` requires
  `git diff --name-only HEAD -- slot-board.ts` to be **empty**, so *any*
  uncommitted edit to it fails vitest during your own verification, before you
  ever reach the commit (§5.4). Importing `usedIds` **from** it is not a
  modification and is what this unit does.
- `src/client/components/block-card.ts` — `buildBlockCard`/`blockCardModel`/`pad2`
  are imported and used unchanged. F1's fallback text for an id the index cannot
  resolve is already theirs.
- `src/client/components/deploy-button.ts` · `src/client/shell/run-state.ts` ·
  `src/client/shell/thread-layer.ts` — untouched. If any goes red, stop and report.
- `src/client/shell/layout.ts` · `src/client/shell/window-registry.ts` — the desk
  and the window's identity are settled.

Test files this unit turns red, all **amended, not relaxed**:

- `tests/windows/agent-file.test.ts:131` — the shadow `DossierSection` declares
  three states; `'filed'` is a fourth. `:140` — `DossierModule` must name
  `filedModel` or the test cannot call it. (§5.3's shadow-type rule.)

Nothing else is expected to go red. Every existing `e2e/agent-file.spec.ts` test
boots at run 1 with nothing filed, so the file still has exactly two pages there
and `.pg-turn` `last()` still lands on the agent page. **If any of them goes red,
that is a genuine finding — stop and report it.**

## Change list

Five files, edits listed bottom-up within each file.

### E1 — `src/client/components/dossier.ts`

**E1a — `:166`.** Current text:

```
  if (section.state === 'operable') {
    node.append(...spaced(head, el('div', 'sect-body', section.note), slotHost))
    return node
  }
```

Replacement text:

```
  // A filed section renders exactly like an operable one — a note and a host —
  // and differs only in what the caller puts in that host and what the flag
  // says. U5.3's past pages hand it read-only cards; the live page hands the
  // operable section the one SlotBoard (D7).
  if (section.state === 'operable' || section.state === 'filed') {
    node.append(...spaced(head, el('div', 'sect-body', section.note), slotHost))
    return node
  }
```

**E1b — `:103`.** Current text:

```
/** Pure: one agent's own page — who they are, and what they were handed. */
export function agentModel(input: AgentInput): DossierSection[] {
  return [
    {
      title: '식별',
      state: 'fixed',
      rows: [
        ['호출부호', input.callsign],
        ['배치', '위기 대응실(상황실) · 비공개 직통 회선'],
        ['권한', '청취 · 조회 · 요청. 집행권 없음'],
      ],
    },
    {
      title: '인수인계 사항',
      state: 'operable',
      note: `주입 슬롯 ${input.slotCap}칸. 배치 후 잠금.`,
    },
  ]
}
```

Replacement text:

```
/** Pure: one agent's own page — who they are, and what they were handed. */
export function agentModel(input: AgentInput): DossierSection[] {
  return [
    {
      title: '식별',
      state: 'fixed',
      rows: [
        ['호출부호', input.callsign],
        ['배치', '위기 대응실(상황실) · 비공개 직통 회선'],
        ['권한', '청취 · 조회 · 요청. 집행권 없음'],
      ],
    },
    {
      title: '인수인계 사항',
      state: 'operable',
      note: `주입 슬롯 ${input.slotCap}칸. 배치 후 잠금.`,
    },
  ]
}

/**
 * Pure: a FINISHED agent's page — the same document, closed.
 *
 * U5.3. 식별 is identical in shape to the live agent's, because it is the same
 * document art with a different callsign; what changes is 인수인계 사항, which
 * is no longer something the operator can operate. It is a record of what went
 * out, and its flag says so.
 */
export function filedModel(input: FiledInput): DossierSection[] {
  return [
    {
      title: '식별',
      state: 'fixed',
      rows: [
        ['호출부호', input.callsign],
        ['배치', '위기 대응실(상황실) · 비공개 직통 회선'],
        ['권한', '청취 · 조회 · 요청. 집행권 없음'],
      ],
    },
    {
      title: '인수인계 사항',
      state: 'filed',
      note: `배치 ${input.deployed}건. 시행 종료 — 열람 전용.`,
    },
  ]
}
```

**E1c — `:66`.** Current text:

```
export interface OperableSection extends SectionHead {
  state: 'operable'
  note: string
}

export type DossierSection = RowsSection | FixedSection | SealedSection | OperableSection

const FLAG: Readonly<Record<DossierSection['state'], string>> = {
  fixed: '고정',
  sealed: '봉인',
  operable: '조작 가능',
}
```

Replacement text:

```
export interface OperableSection extends SectionHead {
  state: 'operable'
  note: string
}

/** U5.3 — an operable section whose sitting is over. Same shape, no gestures. */
export interface FiledSection extends SectionHead {
  state: 'filed'
  note: string
}

export type DossierSection =
  | RowsSection
  | FixedSection
  | SealedSection
  | OperableSection
  | FiledSection

const FLAG: Readonly<Record<DossierSection['state'], string>> = {
  fixed: '고정',
  sealed: '봉인',
  operable: '조작 가능',
  filed: '열람',
}
```

**E1d — `:38`.** Current text:

```
/** What one agent's page needs. The cover takes the clock band and nothing else. */
export interface AgentInput {
  /** 인수인계 사항's cap — read from `SLOT_CAP`, so note and board cannot drift (D3). */
  slotCap: number
  /** 식별's 호출부호 — `ECHO-n` for the agent this page belongs to (M1). */
  callsign: string
}
```

Replacement text:

```
/** What one agent's page needs. The cover takes the clock band and nothing else. */
export interface AgentInput {
  /** 인수인계 사항's cap — read from `SLOT_CAP`, so note and board cannot drift (D3). */
  slotCap: number
  /** 식별's 호출부호 — `ECHO-n` for the agent this page belongs to (M1). */
  callsign: string
}

/** What a finished agent's page needs — no cap, because nothing can be placed. */
export interface FiledInput {
  /** 식별's 호출부호 — the agent whose sitting this page records (M1). */
  callsign: string
  /** How many sentences went out with them. The cards themselves are the host's. */
  deployed: number
}
```

### E2 — `src/client/windows/agent-file.ts`

**E2a — `:372`.** Current text:

```
    if (event.type !== 'meta') return
    const changedRun = event.run !== run
    run = event.run
    // W4 — the unlock moved to the CLOSE (see the `'tally'` branch above): the
    // day's own report has to be minable into the file it was written for, and
    // that window is between 21:04 and the press. A new run therefore arrives
    // with the file already committed — it must stay locked, and only re-date
    // its stamp to the sitting it now serves.
    if (changedRun && board.isLocked()) {
      committedRun = event.run
      committedAt = opensAt
    }
    // M1 — §0's callsign is per sitting, so only a changed run re-prints the
    // dossier; an archive-only `meta` must not re-parent the live slot board.
    if (changedRun) turn()
```

Replacement text:

```
    if (event.type !== 'meta') return
    const changedRun = event.run !== run
    // U5.3 — the run the desk was showing until this event. Read BEFORE the
    // assignment below, and used only to tell the desk's FIRST meta apart from
    // a real change of sitting. It is a comparison, not a derivation: no number
    // here is computed from the authority's ([u7#c3]).
    const previous = run
    run = event.run
    // W4 — the unlock moved to the CLOSE (see the `'tally'` branch above): the
    // day's own report has to be minable into the file it was written for, and
    // that window is between 21:04 and the press. A new run therefore arrives
    // with the file already committed — it must stay locked, and only re-date
    // its stamp to the sitting it now serves.
    if (changedRun && board.isLocked()) {
      committedRun = event.run
      committedAt = opensAt
      // U5.3 — write site 2. The file committed at the close reached the
      // CLOSING run's membrane (W4's op order), but what it carries is the
      // file the operator built after 21:04 — the INCOMING agent's. So it is
      // filed under `event.run`, which is the same re-pointing the stamp does
      // on the two lines above: page inventory and stamp date cannot disagree,
      // because one branch decides both.
      filed.set(event.run, usedIds(board.cells()))
    }
    // M1 — §0's callsign is per sitting, so only a changed run re-prints the
    // dossier; an archive-only `meta` must not re-parent the live slot board.
    // U5.3 — …and a NEW sitting opens on its own page. The jump is conditional
    // because the desk's first meta is a changed run too (0 → 1), and C1 opens
    // the file on its COVER; an unconditional jump would open every boot on the
    // agent's page and take `e2e/agent-file.spec.ts`'s own `boot()` with it.
    if (changedRun) turn(previous > 0 ? 'last' : undefined)
```

**E2b — `:229`.** Current text:

```
    const last = built.length - 1
    const clamped = viewing < 0 ? 0 : viewing > last ? last : viewing
```

Replacement text:

```
    const last = built.length - 1
    // U5.3 — a new sitting opens on its own page, which is always the last one.
    // Left alone, `viewing` would keep the index it had and the operator would
    // land on a page with no DEPLOY on it. Assigned, never `Math.max`-ed.
    if (to === 'last') viewing = last
    const clamped = viewing < 0 ? 0 : viewing > last ? last : viewing
```

**E2c — `:220`.** Current text:

```
  /** Mounts the page being viewed, and nothing else. */
  function turn(): void {
    const built = pages()
```

Replacement text:

```
  /** Mounts the page being viewed, and nothing else. */
  function turn(to?: 'last'): void {
    const built = pages()
```

**E2d — `:208`.** Current text:

```
  /** The document, in order. Index 0 is the cover; the rest are agents. */
  function pages(): HTMLElement[] {
    const cover = el('div', 'file-page')
    cover.append(head, buildDossier(coverModel(band), board.root))

    const agent = el('div', 'file-page')
    agent.append(buildDossier(agentModel({ slotCap: SLOT_CAP, callsign: callsignOf(run) }), board.root))
    agent.append(zone.root)

    return [cover, agent]
  }
```

Replacement text:

```
  /**
   * A finished sitting's file — the cards that went out, read-only.
   *
   * U5.3. These are NOT slots: no `.slot`, no `.slot-pin`, and above all no
   * `data-block-id`, which is what `shell/thread-layer.ts:28` selects slot
   * anchors by. `buildBlockCard` writes `data-block`, so a past page is
   * invisible to the thread layer by construction — do not add the attribute
   * for symmetry. An id the index cannot resolve gets F1's fallback text from
   * `blockCardModel`, which is already its job.
   */
  function filedHost(ids: readonly string[]): HTMLElement {
    const host = el('div', 'filed-file')
    if (ids.length === 0) {
      host.append(el('div', 'filed-empty', FILED_EMPTY))
      return host
    }
    for (const [index, id] of ids.entries()) {
      const cell = el('div', 'filed-cell')
      cell.append(
        el('span', 'filed-no', pad2(index + 1)),
        buildBlockCard(blockCardModel(id, sentences.get(id) ?? null), { inSlot: true }),
      )
      host.append(cell)
    }
    return host
  }

  /**
   * The document, in order: the cover, then a page per finished agent, then the
   * agent on the desk.
   *
   * U5.3 — a record is shown as a PAST page only while its sitting is behind
   * the current one. The current agent's own file is recorded the moment it is
   * committed (it has to be — that is when it is knowable), and it is the live
   * page until the run moves on, so `flown >= run` is what keeps it from
   * appearing twice.
   */
  function pages(): HTMLElement[] {
    const cover = el('div', 'file-page')
    cover.append(head, buildDossier(coverModel(band), board.root))

    const past: HTMLElement[] = []
    for (const flown of [...filed.keys()].sort((a, b) => a - b)) {
      if (flown >= run) continue
      const ids = filed.get(flown) ?? []
      const page = el('div', 'file-page')
      page.append(
        buildDossier(filedModel({ callsign: callsignOf(flown), deployed: ids.length }), filedHost(ids)),
      )
      past.push(page)
    }

    const agent = el('div', 'file-page')
    agent.append(buildDossier(agentModel({ slotCap: SLOT_CAP, callsign: callsignOf(run) }), board.root))
    agent.append(zone.root)

    return [cover, ...past, agent]
  }
```

**E2e — `:175`.** Current text:

```
    if (currentView.mode === 'deploy') {
      board.deploy()
      startDay()
    }
```

Replacement text:

```
    if (currentView.mode === 'deploy') {
      board.deploy()
      // U5.3 — write site 1: the OPENING commit, which belongs to the agent on
      // the desk right now. In practice this is ECHO-1's alone — after a
      // `new_run` the file arrives already committed and this mode never comes
      // round again — and without it the first sitting would never get a page,
      // which is the first comparison the operator would reach for.
      filed.set(run, usedIds(board.cells()))
      startDay()
    }
```

**E2f — `:78`.** Current text:

```
  const sentences = new Map<string, Sentence>()
  let run = 0
```

Replacement text:

```
  const sentences = new Map<string, Sentence>()
  /**
   * U5.3 — what each sitting flew, by run. Written at exactly two sites (see
   * the two `filed.set` calls below), each of which knows its run without doing
   * arithmetic on the authority's numbers ([u7#c3]). Never persisted: H2 makes
   * a page load a new sitting, so the session is exactly the span these pages
   * are about.
   */
  const filed = new Map<number, string[]>()
  let run = 0
```

**E2g — `:70`.** Current text:

```
const FILE_TITLE = '현장 요원 운용 파일'
```

Replacement text:

```
const FILE_TITLE = '현장 요원 운용 파일'
/** U5.3 — what a past page says when that sitting went out with an empty file. */
const FILED_EMPTY = '배치된 문장 없음'
```

**E2h — `:27`.** Current text:

```
import { setPickedBlockId } from '../components/block-card.ts'
import { agentModel, buildDossier, callsignOf, coverModel } from '../components/dossier.ts'
import { SLOT_CAP, createSlotBoard } from '../components/slot-board.ts'
```

Replacement text:

```
import { blockCardModel, buildBlockCard, pad2, setPickedBlockId } from '../components/block-card.ts'
import { agentModel, buildDossier, callsignOf, coverModel, filedModel } from '../components/dossier.ts'
import { SLOT_CAP, createSlotBoard, usedIds } from '../components/slot-board.ts'
```

### E3 — `src/client/styles/win-agent-file.css`

Append these rules to the **end** of the file:

```

/* U5.3 — a finished sitting's page. The cards are the ones that went out: no
   `해제`, nothing to press, and no `data-block-id`, so no red thread reaches
   back into a page whose run is over. */
.filed-file{display:flex;flex-direction:column;gap:var(--space-8)}
.filed-cell{display:flex;align-items:flex-start;gap:var(--space-8);
  border:1px solid var(--sh-28);border-left:2px solid var(--sh-35);
  padding:var(--space-8) var(--space-10)}
.filed-no{font-family:var(--mono);font-size:var(--fs-8);letter-spacing:.1em;color:var(--faded)}
.filed-empty{font-size:var(--fs-8-5);color:var(--faded)}
```

### E4 — `tests/windows/agent-file.test.ts`

**E4a — append one test.** Put it at the **end** of the file, as its own
`describe` block:

```

/* ══ U5.3 — a finished sitting's page ════════════════════════════════════ */

describe('[U5.3] filedModel is the same document, closed', () => {
  it('(a) it carries 식별 and a FILED 인수인계 사항, and nothing operable', async () => {
    const { filedModel } = await loadDossier()
    const sections = filedModel({ callsign: 'ECHO-1', deployed: 3 })

    expect(sections.map((s) => s.title)).toEqual(['식별', '인수인계 사항'])
    expect(sections.map((s) => s.state)).toEqual(['fixed', 'filed'])
    // The count is the page's own, so a past page cannot claim a slot cap it
    // no longer has — `filedModel` takes no cap at all.
    expect(sections[1]!.note).toContain('3')
    expect(JSON.stringify(sections[0]!.rows)).toContain('ECHO-1')
  })

  it('(b) it is pure, takes no host, and names no document', async () => {
    const { filedModel } = await loadDossier()
    const input = Object.freeze({ callsign: 'ECHO-2', deployed: 0 })
    const before = JSON.stringify({ callsign: input.callsign, deployed: input.deployed })

    const first = filedModel(input)
    const second = filedModel({ callsign: 'ECHO-2', deployed: 0 })

    expect(JSON.stringify({ callsign: input.callsign, deployed: input.deployed })).toBe(before)
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
    expect(String(filedModel)).not.toMatch(/document/)
  })
})
```

**E4b — `:140`.** Current text:

```
interface DossierModule {
  coverModel(clockBand: string): DossierSection[]
  agentModel(input: { slotCap: number; callsign: string }): DossierSection[]
  buildDossier: unknown
}
```

Replacement text:

```
interface DossierModule {
  coverModel(clockBand: string): DossierSection[]
  agentModel(input: { slotCap: number; callsign: string }): DossierSection[]
  filedModel(input: { callsign: string; deployed: number }): DossierSection[]
  buildDossier: unknown
}
```

**E4c — `:131`.** Current text:

```
interface DossierSection {
  title: string
  state: 'fixed' | 'sealed' | 'operable'
```

Replacement text:

```
interface DossierSection {
  title: string
  // U5.3 — `'filed'` is the fourth state. This mirror is what `tsc` reads and
  // `vitest` does not (§5.3), so it goes out of step silently if left.
  state: 'fixed' | 'sealed' | 'operable' | 'filed'
```

### E5 — `e2e/agent-file.spec.ts`

Append one test at the **end** of the file, inside no existing `describe` — as
its own block:

```

/* ══ U5.3 — the sitting that ended is still on the desk ══════════════════ */

test.describe('[U5.3] a finished sitting becomes a page of its own', () => {
  test('[U5.3] (a) deploying, closing the day and opening the next appends a page', async ({ page }) => {
    await boot(page)
    // Two pages while ECHO-1 is the only agent: the cover and ECHO-1's own.
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('1 / 2')

    // Seeded and placed through `window.__agentFile`, like every other test in
    // this file — the suite drives the window's own handle and never blocks on
    // what REPORTS happens to be showing.
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await seed(page)
    await place(page, SEEDS[0].id, 0)
    await place(page, SEEDS[1].id, 1)

    // The OPENING commit — this is the file ECHO-1 flies, and write site 1.
    await page.locator('#btnDeploy').click()
    await expect(page.locator('#btnDeploy')).toHaveAttribute('data-state', 'deployed')

    // …then the day closes and the next press opens ECHO-2.
    await newRun(page)

    // Three pages now, and the file opened on the new agent's own.
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('3 / 3')
    await expect(page.locator(`${FILE} #btnDeploy`)).toHaveCount(1)

    // Turn back one: ECHO-1's page, read-only, carrying what ECHO-1 flew.
    await page.locator(`${FILE} .pg-nav .pg-turn`).first().click()
    await expect(page.locator(`${FILE} .pg-count`)).toHaveText('2 / 3')
    await expect(page.locator(`${FILE} .sect`).nth(0).locator('dd').first()).toHaveText('ECHO-1')
    await expect(page.locator(`${FILE} .sect`).nth(1).locator('.sect-flag')).toHaveText('열람')
    await expect(page.locator(`${FILE} .filed-cell`)).toHaveCount(2)
    await expect(page.locator(`${FILE} .filed-cell .bc-text`).first()).toHaveText(SEEDS[0].text)

    // A past page is not a board, carries no gesture, and anchors no thread.
    await expect(page.locator(`${FILE} #slotBoard`)).toHaveCount(0)
    await expect(page.locator(`${FILE} .slot-unset`)).toHaveCount(0)
    await expect(page.locator(`${FILE} [data-block-id]`)).toHaveCount(0)
  })
})
```

**The import this test needs.** The file currently imports only `expect`/`test`
and its types from `playwright/test`. Add exactly one import line for `newRun`
from `./fixtures/harness.ts`, beside the existing `playwright/test` import.
`seed`, `place`, `SEEDS`, `boot` and `FILE` are all this file's own and are
already in scope — do not import them, and do not import anything else.

**On the two seeded ids.** They are the suite's own seeds, not fixture content:
`.filed-cell .bc-text` reading back `SEEDS[0].text` is the claim itself — the
page shows what that agent was handed — and it is the same category as the
existing `data-block-id` assertions at `:255`. C3 is not touched.

## Invariants

- **The membrane rule.** A past page carries no `data-op` and sends no op. The
  five-op census in `e2e/a11y.spec.ts` must still find exactly its five.
- **One desk, one file, one board (D7).** `createSlotBoard` is still called
  once, and `board.root` is re-parented into the live agent's page only. A past
  page never receives it.
- **No red thread reaches a past page.** `thread-layer.ts:28` selects
  `[data-block-id]`; a past page emits none.
- **No arithmetic on the authority's numbers** ([u7#c3], `run-state.ts:8-9`).
  Neither write site derives a run — one uses `run`, the other `event.run`.
- **`Math.max` is banned outright in `agent-file.ts`** — `tests/windows/tally.test.ts`
  `(f)` blanket-scans this file for `/Math\.max\s*\(/`. `turn('last')` assigns
  `built.length - 1` directly and the existing clamp stays conditional. Do not
  reach for the call.
- **The models stay pure** — `agent-file.test.ts` asserts no model's source
  mentions `document`. `filedModel` builds no DOM; `filedHost` lives in the
  window, which is where the DOM belongs.
- **The scenario is replaceable.** No new scenario literal. `FILED_EMPTY` and
  `filedModel`'s note are frame copy, which is game-owned.
- **Geometry is custom properties only** — E3 is class rules, no `style.width`.

## Verification

- `npm run check` — passes.
- `npx vitest run` — the full suite passes. Expect **1601** (E4a adds two).
  Report the count you actually get.
- `npm run build` — passes.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `npm run check` clean, `npm run build` clean, full vitest green.
- [ ] `git diff --name-only HEAD` names exactly the five files in Scope. In
      particular `src/client/components/slot-board.ts` is **not** among them —
      if it is, `tests/windows/block-store.test.ts:557-559` is already red.
- [ ] `grep -n "data-block-id" src/client/windows/agent-file.ts` returns nothing.
- [ ] `grep -n "Math.max" src/client/windows/agent-file.ts` returns nothing.
- [ ] `npx vitest run tests/windows/tally.test.ts` is green **with that file
      unmodified**.
- [ ] **Behavioural:** in your report, state what `filedModel({callsign:
      'ECHO-1', deployed: 2})` actually returns — both titles, both states, both
      flags as `FLAG` maps them — read out of the test you added, not guessed.

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
