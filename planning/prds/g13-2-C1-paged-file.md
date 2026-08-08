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

---

# Amendment 1 (after the executor's §5.7 stop)

Three defects, all in this document. Apply these **in place of** E12a/E12b's
remainders and before E13; everything E1–E11 applied is correct and stays.

Cited line numbers are the **worktree as the executor left it** — E1–E12b
already applied. Same-file edits are bottom-up.

## What was wrong

1. **E12a reordered the sections and left the assertion that reads them.** Its
   spliced array produced 식별 · 임무 · 행동 원칙 · 기질 · 교신 지침 · 인수인계 사항
   while the untouched remainder of the test still expects the old order. The
   splice was the wrong idea outright: under two pages there is no six-section
   sequence to preserve. A2d asserts the two models separately.
2. **E12c could not be followed for `(a)` and `(d)`.** Both read `slotCap` and
   `clockBand` out of ONE object, and no single model takes both. They are
   rewritten verbatim here rather than surveyed.
3. **`Math.max` is banned outright in `agent-file.ts`.** `tests/windows/tally.test.ts`
   `(f)` blanket-scans this file for `/Math\.max\s*\(/` to stop a driver-fed
   number being clamped. A page index is not one, but the guard is a source
   scan and is right to be blunt. A1 clamps with conditionals instead, so the
   guard stays intact and `tally.test.ts` is **not** touched — it remains out of
   scope, and if it is still red after A1, stop and report.

Also: the local shadow type at `:131` still declares `no: string`. §5.3's own
rule — sweep the test files' shadow types — was written after R1 hit this and
was still missed here. A2a fixes it.

## A1 — `src/client/windows/agent-file.ts:223`

Current text:

```
    const clamped = Math.max(0, Math.min(viewing, built.length - 1))
```

Replacement text:

```
    // Clamped with conditionals, never `Math.max`: `tally.test.ts` (f) bans
    // that call outright in this file so a driver-fed number (`run`,
    // `runs_left`, `carried`, `archive`) cannot be quietly clamped. A page
    // index is none of those, but the guard is a blanket source scan and it is
    // right to be — the cheap way to keep it honest is not to reach for the
    // call at all.
    const last = built.length - 1
    const clamped = viewing < 0 ? 0 : viewing > last ? last : viewing
```

## A2 — `tests/windows/agent-file.test.ts`, bottom-up

### A2d — the whole of test `(e)`, `:266-296`

Replace from `  it('(e) the two models carry the ratified titles and flags, and no numbers', async () => {`
through its closing `  })` — that is, everything the executor wrote for E12a
plus the remainder that followed it — with:

```
  it('(e) the two models carry the ratified titles and flags, and no numbers', async () => {
    const { coverModel, agentModel } = await loadDossier()
    const cover = coverModel(BAND)
    const agent = agentModel({ slotCap: 4, callsign: 'ECHO-1' })

    // C1 — the document reads the cover first, then the agent's own page. The
    // six sections are the same six; what changed is which page each sits on,
    // and that none of them carries a `§n` any more. There is deliberately no
    // assertion about a combined six-section order — there is no such order.
    expect(
      [...cover, ...agent].every((s) => !('no' in s)),
      'a section still carries a number',
    ).toBe(true)

    expect(cover.map((s) => s.title)).toEqual(['임무', '행동 원칙', '기질', '교신 지침'])
    expect(cover.map((s) => s.state)).toEqual(['fixed', 'fixed', 'sealed', 'fixed'])
    expect(agent.map((s) => s.title)).toEqual(['식별', '인수인계 사항'])
    expect(agent.map((s) => s.state)).toEqual(['fixed', 'operable'])

    // 임무 renders the pack-fed clock band, never a literal (c1/D2).
    expect(cover[0]!.body).toContain('08:50 → 21:04')
    // 인수인계 사항's note reads the cap, so the two cannot drift.
    expect(agent[1]!.note).toContain('4')
    // 식별 carries the callsign it was handed (M1).
    expect(JSON.stringify(agent[0]!.rows)).toContain('ECHO-1')
  })
```

### A2c — test `(d)`, `:245-255`

Current text:

```
  it('(d) dossierModel is pure — frozen input in, deep-equal input out, no document', async () => {
    const { dossierModel } = await loadDossier()
    const input = Object.freeze(dossierInput())
    const before = JSON.stringify({ slotCap: input.slotCap, clockBand: input.clockBand })

    const first = dossierModel(input)
    const second = dossierModel(dossierInput())

    expect(JSON.stringify({ slotCap: input.slotCap, clockBand: input.clockBand })).toBe(before)
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
    expect(String(dossierModel)).not.toMatch(/document/)
```

Replacement text:

```
  it('(d) both models are pure — frozen input in, deep-equal input out, no document', async () => {
    const { coverModel, agentModel } = await loadDossier()
    const input = Object.freeze({ slotCap: 4, callsign: 'ECHO-1' })
    const before = JSON.stringify({ slotCap: input.slotCap, callsign: input.callsign })

    const firstAgent = agentModel(input)
    const secondAgent = agentModel({ slotCap: 4, callsign: 'ECHO-1' })
    const firstCover = coverModel(BAND)
    const secondCover = coverModel(BAND)

    expect(JSON.stringify({ slotCap: input.slotCap, callsign: input.callsign })).toBe(before)
    expect(JSON.stringify(secondAgent)).toBe(JSON.stringify(firstAgent))
    expect(JSON.stringify(secondCover)).toBe(JSON.stringify(firstCover))
    expect(String(agentModel)).not.toMatch(/document/)
    expect(String(coverModel)).not.toMatch(/document/)
```

The rest of `(d)` — the `buildDossier`-precedence check on the source — is
correct as it stands and is **not** touched.

### A2b — test `(a)`, `:203-212`

Current text:

```
    const { dossierModel } = await loadDossier()
    const input = dossierInput()
    const sections = dossierModel(input)
```

Replacement text:

```
    const { coverModel, agentModel } = await loadDossier()
    const input = { slotCap: 4, callsign: 'ECHO-1' }
    const sections = [...coverModel(BAND), ...agentModel(input)]
```

Then, in the same test, two literals:

- `'§3 must be modelled as a sealed section'` → `'기질 must be modelled as a sealed section'`
- `expect(Object.keys(sealed!).sort()).toEqual(['bars', 'body', 'no', 'state', 'title'])`
  → `expect(Object.keys(sealed!).sort()).toEqual(['bars', 'body', 'state', 'title'])`

### A2a-ii — the helper, `:176-184`

Current text:

```
/** A DOM-free stand-in for the §4 host — `dossierModel` must never touch it. */
const HOST_STUB = Object.freeze({ __hostStub: true }) as unknown as HTMLElement

const dossierInput = (): { slotCap: number; callsign: string; clockBand: string; slotHost: HTMLElement } => ({
  slotCap: 4,
  callsign: 'ECHO-1',
  clockBand: '08:50 → 21:04',
  slotHost: HOST_STUB,
})
```

Replacement text:

```
/** A DOM-free stand-in for the 인수인계 사항 host — no model may touch it. */
const HOST_STUB = Object.freeze({ __hostStub: true }) as unknown as HTMLElement
```

If `HOST_STUB` has no remaining reference after this, leave it in place anyway —
deleting it is not this unit's business and an unused const is not an error
here. If `tsc` disagrees, report rather than deleting more.

### A2a — the shadow type, `:131-139`

Current text:

```
interface DossierSection {
  no: string
  title: string
```

Replacement text:

```
interface DossierSection {
  title: string
```

## A3 — `src/client/components/dossier.ts`, bottom-up

Four doc comments name the dossier's own `§n`. **References to `spec-client §N`
are a different document's sections and stay exactly as they are.**

**A3d — `:134`.** Current: `` * would run its words together (`§3기질봉인열람 불가…`). The separators are ``
→ replace `` `§3기질봉인열람 불가…` `` with `` `기질봉인열람 불가…` ``.

**A3c — `:78`.** Current: `/** §1's mission line: the band is the pack's, the sentence is the design target's. */`
→ `/** 임무's mission line: the band is the pack's, the sentence is the design target's. */`

**A3b — `:9`.** Current: `// §3 기질 is SEALED BY CONSTRUCTION (spec-client §3 inv 4 / I13): `SealedSection``
→ replace the leading `§3 기질` with `기질`. Leave `(spec-client §3 inv 4 / I13)` untouched.

**A3a — `:1`.** Current: `// Dossier — the AGENT FILE's §0–§5, the document the operator reads`
→ `// Dossier — the AGENT FILE's sections, the document the operator reads`

## A4 — corrected Done-when

The `§` grep in the original Done-when could never go true: it matches
`spec-client §3` and `spec-client §4`, which this unit must not change. It is
replaced by:

- [ ] `grep -n "§[0-5]" src/client/components/dossier.ts | grep -v "spec-client"`
      returns nothing.
- [ ] `grep -rn "dossierModel\|DossierInput\|dossierInput" src/ tests/ e2e/` returns
      nothing.
- [ ] `npx vitest run tests/windows/tally.test.ts` is green **with that file
      unmodified** — A1 is what keeps it so.

Every other Done-when line stands, and E13 is still to do.

---

# Amendment 2 — `HOST_STUB` goes

A2a-ii said to leave `HOST_STUB` even if unused, and to report if `tsc`
disagreed. It disagreed: `noUnusedLocals` is on and `typecheck:test` fails with
TS6133. That instruction was wrong — it was written to stop scope creep, but
`HOST_STUB` is not incidental leftovers. It was a DOM-free stand-in for the slot
host, and no model takes a slot host any more: `agentModel` is `{slotCap,
callsign}`, `coverModel` is a string. It is dead by this unit's own design, so
removing it is this unit's business after all.

## B1 — `tests/windows/agent-file.test.ts:176-177`

Current text:

```
/** A DOM-free stand-in for the 인수인계 사항 host — no model may touch it. */
const HOST_STUB = Object.freeze({ __hostStub: true }) as unknown as HTMLElement
```

Replacement: **nothing.** Delete both lines, and the blank line left behind if
one results.

If any reference to `HOST_STUB` survives elsewhere in the file, do NOT delete it
— stop and report instead, because then the premise above is wrong.

Then continue: **E13**, the full Verification, the Done-when as corrected by A4,
and the single commit.

---

# Amendment 3 — E13's six remainders, specified

E13's criterion ("reaches the slot board or DEPLOY → add one click, else stop")
was too narrow. It covered the 13 tests that address the board by a stable
selector and misses every test that addresses a section **by index**, or that
reads an element C1 moved or deleted. The survey that found them is correct;
here are the six, verbatim.

The page turn is the same expression already used in the 13:
`await page.locator(\`${FILE} .pg-nav .pg-turn\`).last().click()`. Cover-page
tests need no turn — the window opens on the cover.

Bottom-up.

## C3f — `(f)`, `:191` and `:201`

Title, current: `test('[u4#c1] (f) §3 is a redaction — bars and the sealed note, no temperament text', async ({ page }) => {`
→ replace `§3` with `기질`.

Line `:199` comment, current: `    // Nothing but the header and the sealed copy is readable inside §3.`
→ replace `§3` with `기질`.

Line `:201`, current:

```
    expect(text).toBe('§3 기질 봉인 열람 불가 — 운영자 권한으로 접근되지 않는 구획입니다. (봉인 I13)')
```

Replacement:

```
    expect(text).toBe('기질 봉인 열람 불가 — 운영자 권한으로 접근되지 않는 구획입니다. (봉인 I13)')
```

`.sect.sealed` is on the cover, which is the page the window opens on. **No page
turn.**

## C3e — `(e)`, `:181-188`

Current text:

```
  test('[u4#c1] (e) §1 prints the pack\'s own clock band', async ({ page }) => {
    await boot(page)
    const { start, end } = await packClock(page)
    expect(start).toMatch(/^\d{2}:\d{2}$/)
    expect(end).toMatch(/^\d{2}:\d{2}$/)
    await expect(page.locator(`${FILE} .sect`).nth(1).locator('.sect-body')).toContainText(
      `${start} → ${end}`,
    )
```

Replacement text:

```
  test('[u4#c1] (e) 임무 prints the pack\'s own clock band', async ({ page }) => {
    await boot(page)
    const { start, end } = await packClock(page)
    expect(start).toMatch(/^\d{2}:\d{2}$/)
    expect(end).toMatch(/^\d{2}:\d{2}$/)
    // C1 — 임무 opens the cover, so it is index 0. It was index 1 while 식별
    // sat above it in one scrolling dossier; 식별 is on the agent's page now.
    await expect(page.locator(`${FILE} .sect`).nth(0).locator('.sect-body')).toContainText(
      `${start} → ${end}`,
    )
```

## C3d — `(d)`, `:170-179`

Current text:

```
  test('[u4#c1] (d) the case slug and doc number come from the pack, never a literal', async ({ page }) => {
    await boot(page)
    const doc = page.locator(`${FILE} .fh-doc`)
    await expect(doc).toHaveText(/^문서번호 NDSP-2\/AF\/[^/]+\/\d{2}$/)
    const slug = (await page.locator('#caseName').textContent())?.trim() ?? ''
    expect(slug.length).toBeGreaterThan(0)
    await expect(doc).toHaveText(new RegExp(`/AF/${slug}/\\d{2}$`))
    await expect(page.locator(`${FILE} .fh-title`)).toHaveText('현장 요원 운용 파일')
    await expect(page.locator(`${FILE} .fh-v`)).toHaveText('ECHO-3')
  })
```

Replacement text:

```
  test('[u4#c1] (d) the case slug and doc number come from the pack, never a literal', async ({ page }) => {
    await boot(page)
    const doc = page.locator(`${FILE} .fh-doc`)
    // C1 — the number names the DOCUMENT, which spans every agent, so it has
    // no run segment. It used to end `/01`, `/02`, …
    await expect(doc).toHaveText(/^문서번호 NDSP-2\/AF\/[^/]+$/)
    const slug = (await page.locator('#caseName').textContent())?.trim() ?? ''
    expect(slug.length).toBeGreaterThan(0)
    await expect(doc).toHaveText(new RegExp(`/AF/${slug}$`))
    await expect(page.locator(`${FILE} .fh-title`)).toHaveText('현장 요원 운용 파일')
    // …and the callsign left the header outright. `.fh-v` is gone: a header
    // that always names the CURRENT agent would contradict the page the moment
    // the player turned back to an earlier one. It is 식별's first row now.
    await expect(page.locator(`${FILE} .fh-v`)).toHaveCount(0)
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    const identity = page.locator(`${FILE} .sect`).nth(0).locator('dl.sect-rows')
    await expect(identity.locator('dd').first()).toHaveText('ECHO-3')
  })
```

## C3c — `(c)`, `:151-153`

Current text:

```
  test('[u4#c1] (c) §4 holds the slot board — exactly four numbered slots', async ({ page }) => {
    await boot(page)
    const board = page.locator(`${FILE} .sect`).nth(4).locator('#slotBoard')
```

Replacement text:

```
  test('[u4#c1] (c) 인수인계 사항 holds the slot board — exactly four numbered slots', async ({ page }) => {
    await boot(page)
    // C1 — the board is on the agent's page, second of that page's two
    // sections. It was index 4 of six in one scrolling dossier.
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    const board = page.locator(`${FILE} .sect`).nth(1).locator('#slotBoard')
```

The rest of `(c)` is correct and is **not** touched.

## C3b — `(b)`, `:142-144`

Current text:

```
  test('[u4#c1] (b) §0 is a three-row identity table', async ({ page }) => {
    await boot(page)
    const rows = page.locator(`${FILE} .sect`).nth(0).locator('dl.sect-rows')
```

Replacement text:

```
  test('[u4#c1] (b) 식별 is a three-row identity table', async ({ page }) => {
    await boot(page)
    // C1 — 식별 opens the AGENT's page, not the document.
    await page.locator(`${FILE} .pg-nav .pg-turn`).last().click()
    const rows = page.locator(`${FILE} .sect`).nth(0).locator('dl.sect-rows')
```

## C3a — `boot()`, `:52-56`

The helper every test in the file runs first, and the reason none of them can
pass yet.

Current text:

```
/** Boot the desk and wait until the AGENT FILE has rendered its dossier. */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator(FILE)).toBeVisible()
  await expect(page.locator(`${FILE} .sect`)).toHaveCount(6)
```

Replacement text:

```
/**
 * Boot the desk and wait until the AGENT FILE has rendered its cover.
 *
 * C1 — one page is mounted at a time, so six sections never share a DOM. The
 * window opens on the cover and its four; a test that wants 식별 or
 * 인수인계 사항 turns the page itself.
 */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator(FILE)).toBeVisible()
  await expect(page.locator(`${FILE} .sect`)).toHaveCount(4)
```

## C3g — after these, finish the unit

E13 is then complete. Run the full Verification, work the Done-when as corrected
by A4, and make the single commit. If a seventh site turns up that none of the
above covers, stop and report it — the survey has been right three times.
