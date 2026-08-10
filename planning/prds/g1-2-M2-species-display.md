# M2 — species words come off the cards and the filter; the data stays

> plan-playtest.md **v10** · change list stamped against tree `a6e2a07`
> (2026-08-07, g1-1 merged; code identical at `87b7612`) — every row re-verified
> byte-identical at handoff, and the **whole change list was dry-run-verified**
> on a scratch tree: `npm run test` green but the documented pre-commit additive
> guard, `npm run test:e2e -- e2e/block-store.spec.ts` 25/25. The dry run caught
> a third species-word pin the original list missed — added as E5.
> **E5 citation corrected (08-07, after the first execution run):** the first
> stamp read E5's line off the scratch tree *after* E3/E4 had applied (`:401`);
> the stamped tree says `:399`. The executor's stop was correct. §5.3 (v10) now
> carries the rule: cite the stamped tree; same-file edits bottom-up, or the
> drift stated on the row.
> **Wave 1**: may develop and merge in parallel with `g1-3`, `g1-6`, `g4-1`
> (no shared files).
> Executor: Sonnet-class session. Branch `playtest/g1-2-m2` off current `main`.
> One commit, message: `playtest(M2): species tags off the display, data untouched`.
> Open a PR; merge nothing (§5.6). Before the first edit, confirm
> `git config user.email` resolves to the `alstjgg` account (repo hard rule 1).

## Outcome

Block cards and the store's filter buttons no longer print the species words
(`사실` · `자기서술` · `감정` · `인용`). The glyph marks (■ ◇ ● ❝), the colors, and
the counts stay; screen-reader names keep the full words. The `species` field
itself — data, wire type, id-channel derivation — is untouched.

## Scope

May modify (only these three files):

- `src/client/components/block-card.ts` — one line of the builder half.
- `src/client/components/species-filter.ts` — one line of the builder half.
- `e2e/block-store.spec.ts` — the locator helper and two assertions.

Must NOT modify:

- `SPECIES_DISPLAY` (`block-card.ts:33-38`) and `blockCardModel` — the table still
  feeds the marks, the classes, and the filter's accessible names, and four tests
  assert it as-is (`agent-file.test.ts:610-617`, `block-store.test.ts:285-295,575`).
- `species-filter.ts:76` (`option.ko`-based `label`) — `button()`
  (`src/client/shell/dom.ts:28-33`) sets it as **`title`**, not `aria-label`.
  Today the visible text is what names the button and `title` is ignored; once
  this unit removes the text, `title` becomes the button's accessible name (the
  accname last-resort fallback, and what `a11y.spec.ts:78`'s census reads).
  Removing it would leave unnamed buttons. Do not rename the attribute either —
  swapping `title` for `aria-label` is a `button()` change, out of scope here.
- `src/shared/species.ts`, `src/shared/segment.ts` — consume-only by contract;
  `agent-file.test.ts:722-725` asserts their diff is empty.
- `src/client/components/slot-board.ts`, `src/client/windows/block-store.ts` —
  guarded the same way (`agent-file.test.ts:727-730`, `block-store.test.ts:557-559`).
- Anything under `data/` or `authoring/` — the authored `사실`/`자기서술` vocabulary
  is pack data, not display.

Tests turning red, and their disposition:

- `tests/windows/block-store.test.ts:561-567` ("block-card.ts changes are pure
  additions") compares the **uncommitted working tree** against HEAD, so it is red
  between your edit and your commit and green after. That is why verification runs
  **after** the commit. The assertion itself is not amended.
- `e2e/block-store.spec.ts` — three sites match visible text this unit removes:
  the `hasText` locator (**E3**), the filter-row `toContainText(option.ko)`
  (**E4**), and the card-states `.bc-sp` ko assertion at `:399` (**E5**, found
  by the dry run). E5 inverts rather than deletes — the word being *gone* is
  this unit's outcome, so the suite asserts it.

## Change list

**E1 — `src/client/components/block-card.ts:160`**
current:
```ts
  tag.append(el('i', undefined, model.mark), document.createTextNode(model.ko))
```
replace with:
```ts
  tag.append(el('i', undefined, model.mark))
```

**E2 — `src/client/components/species-filter.ts:78`**
current:
```ts
    node.append(el('i', undefined, option.mark), document.createTextNode(option.ko))
```
replace with:
```ts
    node.append(el('i', undefined, option.mark))
```

**E3 — `e2e/block-store.spec.ts:191-193`**
current:
```ts
function filterButton(page: Page, ko: string): Locator {
  return page.locator(`${FILTER} button`, { hasText: ko })
}
```
replace with:
```ts
function filterButton(page: Page, ko: string): Locator {
  const label = ko === '전체' ? '전체 보기' : `${ko}만 보기`
  return page.locator(`${FILTER} button[title="${label}"]`)
}
```

**E4 — `e2e/block-store.spec.ts:313-316`**
current:
```ts
    for (const [index, option] of FILTERS.entries()) {
      await expect(buttons.nth(index)).toContainText(option.ko)
      await expect(buttons.nth(index)).toContainText(option.mark)
    }
```
replace with:
```ts
    for (const [index, option] of FILTERS.entries()) {
      const label = option.key === 'all' ? '전체 보기' : `${option.ko}만 보기`
      await expect(buttons.nth(index)).toHaveAttribute('title', label)
      await expect(buttons.nth(index)).toContainText(option.mark)
    }
```

**E5 — `e2e/block-store.spec.ts:399`** (inside "card states — every card prints
its authored id and its species mark"; the id and mark assertions above it stay.
`:399` is the **stamped tree's** line, like every citation in this document; by
the time you apply E5, E3 and E4 have each added one line above it, so in your
working tree the same line sits at `:401` — that is drift, not a mismatch. The
citation check is against the un-edited file: `git show HEAD:e2e/block-store.spec.ts`.)
current:
```ts
      await expect(node.locator('.bc-sp')).toContainText(option!.ko)
```
replace with:
```ts
      await expect(node.locator('.bc-sp')).not.toContainText(option!.ko)
```

Note: `filterCounts` (`e2e/block-store.spec.ts:196-204`) reads the **trailing number**
of each button's inner text; the buttons still render `mark + count`, so it needs no
change. Every other `filterButton(...)` call site goes through the E3 helper.

## Invariants

- **Species derives from the id channel, never from classification** (§5.4;
  `docs/spec-client.md` §5.2). This unit is display-only; the field, the wire type,
  and the model keep `ko` — only the two `document.createTextNode` prints go.
- **Accessibility**: every filter button keeps a non-empty accessible name
  (`전체 보기` / `<종>만 보기`), carried by `title`. Do not strip it, and do not
  add an `aria-label` "to be safe" — `a11y.spec.ts:78` reads
  `aria-label ?? title ?? textContent`, so `title` alone satisfies the census
  at `:282`/`:300`, and minting a second name source is a scope creep.

## Verification

Run in this order, from the repo root, **after committing** (the additive-only guard
on `block-card.ts` is red on an uncommitted tree by design):

1. `git add <the three files>` · commit.
2. `npm run test` — expected: all green, including `[u4s#c7]` in
   `tests/windows/block-store.test.ts`.
3. `npm run build` — expected: green.
4. `npm run test:e2e -- e2e/block-store.spec.ts` — expected: green.
5. Behavioral (DEV): `npm run dev` — mine any sentence in REPORTS; the card in
   BLOCK STORE shows a glyph tag (e.g. ◇) with **no species word**; the filter row
   shows five buttons as `glyph + count` only.

## Done when

- [ ] Both prints removed; helper + two assertions amended (E3–E5); no other line changed.
- [ ] `npm run test`, `npm run build`, and `npm run test:e2e -- e2e/block-store.spec.ts` green, in that order, post-commit.
- [ ] In the running DEV desk no card and no filter button displays `사실`, `자기서술`, `감정`, or `인용` (behavioural check 5).
- [ ] Filter buttons still expose `title` names ending `보기`.
- [ ] PR opened from `playtest/g1-2-m2`; nothing merged.

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
