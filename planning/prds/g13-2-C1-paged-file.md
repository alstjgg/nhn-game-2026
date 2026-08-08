# g13-2 — C1: the AGENT FILE is a paged document

> plan-playtest v14 · citations bind to `2ed3557` · branch `playtest/c1-paged-file`
> commit message: `playtest(C1): the AGENT FILE is a paged document — a cover, then a page per agent`

## Outcome

The AGENT FILE stops being one scrolling dossier and becomes a document the
player turns pages in. **Page 1** is the cover: the document number, the title
현장 요원 운용 파일, and the four sections that are true of every agent — 임무 ·
행동 원칙 · 기질 · 교신 지침. **Page 2** is the agent currently on the desk: 식별
and 인수인계 사항, with the DEPLOY control beneath them. The player reads the
cover, turns forward, sees who the agent is and what they have been handed, and
presses DEPLOY.

Section numbers (`§0`–`§5`) are gone everywhere. The titles carry it.

This unit builds the book with **two** pages. U5.3 makes past agents into pages
of their own; nothing here may anticipate that beyond leaving the page list a
list.

## Design (author-resolved — do not re-derive)

- **Two page models, not one.** `dossierModel` splits into `coverModel(band)`
  → 임무 · 행동 원칙 · 기질 · 교신 지침, and `agentModel(input)` → 식별 ·
  인수인계 사항. Neither takes the other's inputs.
- **No section numbers.** `SectionHead.no` is deleted, and `buildSection` stops
  emitting `.sect-no`. The CSS rule for it goes with it.
- **The document number loses its run segment.** `NDSP-2/AF/<slug>`, not
  `…/<slug>/01`. One document spans every agent, so a number that changes each
  run describes something else.
- **The window header is gone.** `문서번호` and the title move onto the cover
  page; the 호출부호 line is deleted outright, because a header that always
  names the current agent contradicts whatever page is open. 식별 carries the
  callsign now.
- **DEPLOY sits on the last page**, inside it, after 인수인계 사항 — not at the
  window level. In this unit the last page is the only agent page.
- **The stamp stays at window level.** `buildDeployStamp()` renders over the
  whole file and is not part of any page.
- **Turning a page swaps the mounted page**, it does not scroll to it. One page
  is in the DOM at a time; `.win-body` is `overflow:hidden` and gains no scroll
  container in this unit.
- **The flip control is two `button()`s and a counter** (`‹` · `2 / 2` · `›`),
  disabled at the ends. Buttons rather than divs because `shell/dom.ts`'s
  `button()` is what the desk uses everywhere and it costs nothing; no arrow-key
  paging, no roving tabindex — this is not the archive rail.
- **The flip control carries no `data-op`.** It is not a membrane op and must
  stay out of the five-op census (`e2e/a11y.spec.ts`).

## Scope

May modify, only:

- `src/client/components/dossier.ts`
- `src/client/windows/agent-file.ts`
- `src/client/styles/win-agent-file.css`
- `tests/windows/agent-file.test.ts`
- `e2e/agent-file.spec.ts`

Must NOT modify:

- `src/client/components/slot-board.ts` — the board is unchanged and there is
  still exactly one of it (D7). It is mounted into 인수인계 사항 as today.
- `src/client/components/deploy-button.ts` — the control is unchanged; only
  where its root is appended moves.
- `src/client/shell/layout.ts` — another unit owns it this wave.
- `src/client/shell/window-registry.ts` — the window's identity is unchanged.

Test files this unit turns red, both **amended, not relaxed**:

- `tests/windows/agent-file.test.ts` — `:226`, `:231`, `:263-266` assert `§`
  numbers and a six-section model. E7 rewrites them onto the two models.
- `e2e/agent-file.spec.ts:127-145` — asserts six `.sect` in one view with
  `.sect-no` text. E8 rewrites it onto the two pages.

## Change list

Same-file edits are listed **bottom-up**; apply in the order given, file by
file, and finish `dossier.ts` before starting `agent-file.ts`.

### E1 — `src/client/components/dossier.ts:143-152`

Current text:

```
function buildSection(section: DossierSection, slotHost: HTMLElement): HTMLElement {
  const node = el('div', `sect ${section.state}`)
  const head = el('div', 'sect-hd')
  head.append(
    ...spaced(
      el('span', 'sect-no', section.no),
      el('h4', undefined, section.title),
      el('span', 'sect-flag', FLAG[section.state]),
    ),
  )
```

Replacement text:

```
function buildSection(section: DossierSection, slotHost: HTMLElement): HTMLElement {
  const node = el('div', `sect ${section.state}`)
  const head = el('div', 'sect-hd')
  // C1 — no `§n`. The titles are distinct words and carry the document on
  // their own; a number that has to be kept in step with a page order is one
  // more thing that can contradict the page it is printed on.
  head.append(
    ...spaced(el('h4', undefined, section.title), el('span', 'sect-flag', FLAG[section.state])),
  )
```

### E2 — `src/client/components/dossier.ts:88-124`

Current text is the whole `dossierModel` function, from its doc comment
`/** Pure: the six sections §0–§5, in order. */` through the closing `}` of the
function at line 124.

Replacement text:

```
/** Pure: the cover's sections — everything true of every agent, in order. */
export function coverModel(clockBand: string): DossierSection[] {
  return [
    { title: '임무', state: 'fixed', body: missionBody(clockBand) },
    {
      title: '행동 원칙',
      state: 'fixed',
      body: '확인되지 않은 것을 단정하지 않는다. 판단이 필요한 순간에는 판단하고, 왜 그랬는지 남긴다.',
    },
    { title: '기질', state: 'sealed', body: SEALED_COPY, bars: [...SEALED_BARS] },
    {
      title: '교신 지침',
      state: 'fixed',
      body: '라운드 종료 시 현장 기록 최대 8건과 무전 기록 한 편을 송신한다. 판단과 인상은 한 문장에 하나씩, 문장 단위로 완결되게 쓴다.',
    },
  ]
}

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

### E3 — `src/client/components/dossier.ts:48-51`

Current text:

```
interface SectionHead {
  no: string
  title: string
}
```

Replacement text:

```
interface SectionHead {
  title: string
}
```

### E4 — `src/client/components/dossier.ts:37-46`

Current text:

```
export interface DossierInput {
  /** §4's cap — read from `SLOT_CAP`, so note and board cannot drift (D3). */
  slotCap: number
  /** §0's 호출부호 — `ECHO-n` for the sitting on the desk (M1). */
  callsign: string
  /** §1's pack-fed band, `"HH:MM → HH:MM"`; empty until the pack answers. */
  clockBand: string
  /** §4's host. Opaque to the model — only `buildDossier` ever touches it. */
  slotHost: HTMLElement
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
```

### E5 — `src/client/windows/agent-file.ts:193-202`

Current text:

```
  let dossier = buildDossier(dossierModel(dossierInput()), board.root)

  const head = el('div', 'file-head')
  const left = el('div', 'fh-left')
  left.append(docLine, el('div', 'fh-title', FILE_TITLE))
  const right = el('div', 'fh-right')
  right.append(el('div', 'fh-k', '호출부호'), callsignLine)
  head.append(left, right)

  host.append(stamp.root, head, dossier, zone.root)
```

Replacement text:

```
  // C1 — the file is a document with pages, and exactly one page is mounted.
  // Page 0 is the cover: the document's own number and title, then everything
  // true of every agent. Page 1 is the agent on the desk, and it is the last
  // page, which is where the DEPLOY control lives — the last page is the agent
  // who has not gone out yet. U5.3 appends a page per agent after this one; the
  // only thing this unit owes it is that `pages` is a list.
  const head = el('div', 'file-head')
  const left = el('div', 'fh-left')
  left.append(docLine, el('div', 'fh-title', FILE_TITLE))
  head.append(left)

  const sheet = el('div', 'file-sheet')
  const pgPrev = button('pg-turn', '이전 장', '‹')
  const pgNext = button('pg-turn', '다음 장', '›')
  const pgCount = el('span', 'pg-count')
  const nav = el('div', 'pg-nav')
  nav.append(pgPrev, pgCount, pgNext)

  let viewing = 0

  /** The document, in order. Index 0 is the cover; the rest are agents. */
  function pages(): HTMLElement[] {
    const cover = el('div', 'file-page')
    cover.append(head, buildDossier(coverModel(band), board.root))

    const agent = el('div', 'file-page')
    agent.append(buildDossier(agentModel({ slotCap: SLOT_CAP, callsign: callsignOf(run) }), board.root))
    agent.append(zone.root)

    return [cover, agent]
  }

  /** Mounts the page being viewed, and nothing else. */
  function turn(): void {
    const built = pages()
    const clamped = Math.max(0, Math.min(viewing, built.length - 1))
    viewing = clamped
    sheet.replaceChildren(built[clamped]!)
    pgCount.textContent = `${clamped + 1} / ${built.length}`
    pgPrev.disabled = clamped === 0
    pgNext.disabled = clamped === built.length - 1
  }

  pgPrev.addEventListener('click', () => {
    viewing -= 1
    turn()
  })
  pgNext.addEventListener('click', () => {
    viewing += 1
    turn()
  })

  host.append(stamp.root, sheet, nav)
```

### E6 — `src/client/windows/agent-file.ts:132-134`

Current text:

```
  function sync(): void {
    docLine.textContent = `${DOC_CAPTION}${PORTAL.portalCode}/AF/${slug}/${pad2(run)}`
    callsignLine.textContent = callsignOf(run)
```

Replacement text:

```
  function sync(): void {
    // C1 — one document across every agent, so the number names the document
    // and not the run. The run used to be its last segment.
    docLine.textContent = `${DOC_CAPTION}${PORTAL.portalCode}/AF/${slug}`
```

### E7 — `src/client/windows/agent-file.ts:126-128`

Current text:

```
  function dossierInput(): DossierInput {
    return { slotCap: SLOT_CAP, callsign: callsignOf(run), clockBand: band, slotHost: board.root }
  }
```

Replacement text: **delete these three lines and the blank line after them.**
Both models are now built at their page, from `band` and `callsignOf(run)`
directly.

### E8 — `src/client/windows/agent-file.ts:107`

Current text:

```
  const callsignLine = el('div', 'fh-v', callsignOf(run))
```

Replacement text: **delete this line.** The callsign is 식별's, on the agent's
own page.

### E9 — the two rebuild sites

Both call `buildDossier(dossierModel(dossierInput()), board.root)` and replace a
`dossier` node that no longer exists. Both become `turn()`.

**E9a** — `src/client/windows/agent-file.ts:347-357`, inside the identity
`.then()`. Current text:

```
      band = `${identity.start} → ${identity.end}`
      const next = buildDossier(dossierModel(dossierInput()), board.root)
      dossier.replaceWith(next)
      dossier = next
      sync()
```

Replacement text:

```
      band = `${identity.start} → ${identity.end}`
      turn()
      sync()
```

**E9b** — `src/client/windows/agent-file.ts:341-346`. Current text:

```
    if (changedRun) {
      const next = buildDossier(dossierModel(dossierInput()), board.root)
      dossier.replaceWith(next)
      dossier = next
    }
```

Replacement text:

```
    if (changedRun) turn()
```

### E10 — imports in `src/client/windows/agent-file.ts`

The file imports `buildDossier`, `dossierModel`, `callsignOf` and a
`DossierInput` type from `../components/dossier.ts`, and `button` is not yet
imported from `../shell/dom.ts`. Read the import block at the top of the file
and make it import `agentModel`, `buildDossier`, `callsignOf` and `coverModel`
from `../components/dossier.ts` — **no** `DossierInput`, **no** `dossierModel` —
and add `button` to the existing `../shell/dom.ts` import beside `el`. If
`pad2` becomes unused, remove it from its import too; if it is still used
elsewhere in the file, leave it. Change no other import.

### E11 — `src/client/styles/win-agent-file.css`

Two edits. **E11a** — delete the `.sect-no` rule. Current text:

```
.sect-no{font-size:var(--fs-11);font-weight:700;color:var(--seal-2);letter-spacing:.05em}
```

Replacement: **nothing.** The element is gone.

**E11b** — append these rules to the end of the file:

```

/* C1 — the file is a document with pages. One page is mounted at a time; the
   nav is a strip at the foot of the window, outside the page it turns. */
.file-sheet{flex:1;min-height:0}
.pg-nav{display:flex;align-items:center;justify-content:center;gap:var(--space-10);
  padding:var(--space-6) 0 var(--space-2);border-top:1px solid var(--sh-28)}
.pg-turn{font-size:var(--fs-13);line-height:1;color:var(--pap-3);background:transparent;
  border:1px solid var(--sh-28);border-radius:2px;padding:var(--space-1) var(--space-8);cursor:pointer}
.pg-turn:disabled{opacity:.35;cursor:default}
.pg-count{font-size:var(--fs-8-5);letter-spacing:.16em;color:var(--faded)}
```

### E12 — `tests/windows/agent-file.test.ts`

Three assertions name `§` or the six-section model. Amend them, bottom-up.

**E12a** — `:263-266`. Current text:

```
  it('(e) the six sections are §0–§5 with the ratified titles and flags', async () => {
    const { dossierModel } = await loadDossier()
    const sections = dossierModel(dossierInput())
    expect(sections.map((s) => s.no)).toEqual(['§0', '§1', '§2', '§3', '§4', '§5'])
```

Replacement text:

```
  it('(e) the two models carry the ratified titles and flags, and no numbers', async () => {
    const { coverModel, agentModel } = await loadDossier()
    const sections = [
      ...agentModel({ slotCap: 4, callsign: 'ECHO-1' }).slice(0, 1),
      ...coverModel(BAND),
      ...agentModel({ slotCap: 4, callsign: 'ECHO-1' }).slice(1),
    ]
    // C1 — the sections are the same six in the same reading order; what is
    // gone is `§n`, and the split between the cover and the agent's own page.
    expect(sections.every((s) => !('no' in s)), 'a section still carries a number').toBe(true)
```

**E12b** — `:223-231`. Current text:

```
    const { dossierModel } = await loadDossier()
    const sealed = dossierModel(dossierInput()).find((s) => s.state === 'sealed')!
```

…through…

```
    expect(strings.sort()).toEqual(['sealed', SEALED_COPY, '기질', '§3'].sort())
```

Replace `dossierModel(dossierInput())` with `coverModel(BAND)` on the first
line, drop `'§3'` from the expected array on the last, and change the
destructured import on the line above from `{ dossierModel }` to
`{ coverModel }`. Line `:226` — `expect(sealed.no).toBe('§3')` — is **deleted**;
the section has no number to assert.

**E12c** — the `ViewModule`-style declaration at `:142` and the `dossierInput()`
helper it serves. Current text at `:142`:

```
  dossierModel(input: { slotCap: number; clockBand: string; slotHost: HTMLElement }): DossierSection[]
```

Replacement text:

```
  coverModel(clockBand: string): DossierSection[]
  agentModel(input: { slotCap: number; callsign: string }): DossierSection[]
```

Then define `const BAND = '08:50 → 21:04'` beside it, and update every other
`dossierModel(...)` call in this file to whichever of the two models carries
the section it is testing — `coverModel(BAND)` for 임무 · 행동 원칙 · 기질 ·
교신 지침, `agentModel({ slotCap: 4, callsign: 'ECHO-1' })` for 식별 ·
인수인계 사항. **If a call site tests a section that is now split across both
models and cannot be rewritten this way, stop and report it rather than
guessing.**

### E13 — `e2e/agent-file.spec.ts:127-145`

Current text begins:

```
  test('[u4#c1] (a) §0–§5 render in order with their titles and flags', async ({ page }) => {
    await boot(page)
    const sects = page.locator(`${FILE} .win-body .sect`)
    await expect(sects).toHaveCount(6)
    await expect(sects.locator('.sect-no')).toHaveText(['§0', '§1', '§2', '§3', '§4', '§5'])
```

Replacement text:

```
  test('[u4#c1] (a) the cover and the agent page carry the ratified titles and flags', async ({ page }) => {
    await boot(page)
    // C1 — one page is mounted at a time, so the six sections are read across
    // two: the cover's four, then the agent's two. `.sect-no` is gone.
    const sects = page.locator(`${FILE} .win-body .sect`)
    await expect(sects).toHaveCount(4)
    await expect(sects.locator('h4')).toHaveText(['임무', '행동 원칙', '기질', '교신 지침'])
    await expect(page.locator(`${FILE} .sect-no`)).toHaveCount(0)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    await expect(sects).toHaveCount(2)
    await expect(sects.locator('h4')).toHaveText(['식별', '인수인계 사항'])
```

Then finish the test with the flag assertions for the two pages —
`['고정', '고정', '봉인', '고정']` on the cover and `['고정', '조작 가능']` on the
agent page — replacing the single six-element flag assertion that follows.
**Every other test in this file that reaches the slot board or DEPLOY must now
turn to the agent page first**; find them, add the same single click, and say in
your report which tests you touched. If any of them cannot be fixed by that one
click, stop and report rather than restructuring it.

## Invariants

- **The membrane rule.** The flip control sends no op and carries no `data-op`.
  The five-op census in `e2e/a11y.spec.ts` must still find exactly its five.
- **One board, one file (D7).** `createSlotBoard` is called once and
  `board.root` is mounted into 인수인계 사항 on the agent page. Rebuilding pages
  re-parents that same node; it is never cloned and never built twice.
- **`button()` names a control through `title`, never `aria-label`**
  (`shell/dom.ts:28-33`), and while visible text exists the text wins. `‹` and
  `›` are the visible text, so the accessible names are those glyphs unless the
  title is what the census reads — which is why both carry a real `title`.
- **Geometry is custom properties only** — never `style.width`
  (`tests/shell/shell-source.test.ts` [C12/inv 8]). Every rule above is CSS.
- **`dossierModel` was pure and its replacements stay pure** — frozen input in,
  deep-equal input out, and the source may not mention `document`
  (`agent-file.test.ts:242-252`).
- **The scenario is replaceable.** No new scenario literal is minted; 임무's
  band still comes from the pack through `band`.

## Verification

- `npm run check` — passes.
- `npx vitest run tests/windows/agent-file.test.ts` — green.
- `npx vitest run` — the full suite passes. Report the count.
- `npm run build` — passes.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `git diff --name-only` names exactly the five files in Scope.
- [ ] `grep -rn "§0\|§1\|§2\|§3\|§4\|§5" src/client/components/dossier.ts` returns
      nothing.
- [ ] `grep -rn "dossierModel\|DossierInput" src/ tests/ e2e/` returns nothing.
- [ ] `grep -n "sect-no" src/client/styles/win-agent-file.css src/client/components/dossier.ts`
      returns nothing.
- [ ] `grep -n "AF/\${slug}/" src/client/windows/agent-file.ts` returns nothing —
      the document number has no run segment.
- [ ] Full vitest run is green.
- [ ] **Behavioural:** state in your report which page the window opens on, how
      many pages `pgCount` reports, and that `pgPrev` is disabled on page 1 and
      `pgNext` disabled on the last — read out of the unit test you add or out
      of a scratch jsdom mount, not guessed.

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
