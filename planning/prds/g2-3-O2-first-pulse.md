# O2 — the first mining round trip plays once, first sitting only

> plan-playtest.md **v7** · change list stamped against tree `14dd971` (2026-08-07),
> **before group 1 merged** — `g1-5` edits `reports.ts`'s meta branch and
> `report-view.ts`, so this list is re-stamped after group 1 lands (the `reports.ts`
> current-text below is written against `g1-5`'s output where marked).
> Executor: Sonnet-class session. Branch `playtest/g2-3-o2` off current `main`.
> One commit, message: `playtest(O2): debut pulse on the first mining round trip`.
> Open a PR; merge nothing (§5.6). Confirm `git config user.email` resolves to the
> `alstjgg` account first (hard rule 1).
>
> **AMENDED 2026-08-07 for T1 — NOT EXECUTABLE AS WRITTEN.** This PRD was
> author-resolved while BLOCK STORE still existed, and its second half is not yet
> written. See "Amendment — the slot half" below before starting.

## Amendment — the slot half (2026-08-07)

T1 deletes BLOCK STORE. With the store present, tearing a sentence sent a card
flying to a visible window and **the destination taught itself**; after T1
nothing moves — the sentence changes state in place and its destination is a slot
in AGENT FILE, diagonally across the desk. A pulse on the sentence alone now
teaches step one and leaves the player stopped at step two, which is the failure
this unit exists to prevent.

**O2 is therefore a round trip:** the sentence pulses, and **on tear the empty
slot that receives it pulses too** — both once, first sitting only, off the same
latch.

What this amendment changes above: the title, the Outcome's last sentence, and
the first Design bullet's scope. What it does **not** change: the `run === 1`
latch, the `.tear` class precedent, the existing-tokens rule, and the
reduced-motion collapse — all four carry to the slot half unchanged.

**Still to author before this unit runs** (do not improvise it):

- The slot half's change list. The three-file Scope below is the sentence half
  only; the slot pulse lands on `src/client/components/slot-board.ts`, which the
  Scope currently forbids touching by omission.
- Ordering against T1. This unit's current text assumes the store exists (the
  Scope's note about the fixture, the Change list's `reports.ts` anchors). **T1
  merges first** (plan-playtest §2, §4).
- Whether the slot pulse fires on every empty slot or only the one that receives
  the tear.

Executor: if you reach the Change list without that authored, **stop and report
per §5.7**.

## Outcome

On the player's first sitting (run 1) only, when the first report arrives, the
first sentence of the 현장 기록 swells once — a single quiet pulse that says
"this is touchable" — and when it is torn, the slot that takes it answers with
the same pulse. Neither fires again: not on later rounds, not on later runs, not
on re-renders. Nothing else about mining changes.

## Design (author-resolved)

- The sentence pulse targets **the first facts anchor** (`model.facts[0]`'s
  node): the facts pane paints whole on arrival, while the report body
  typewrites for ~4 s — a pulse there would fire on an empty node. The slot
  pulse targets the receiving slot in AGENT FILE §4 (see the amendment above —
  its change list is unwritten).
- "First run only" is a latch in `windows/reports.ts` (`run === 1`, first report
  arrival, once) and **the slot half rides the same latch**. The DEV fixture
  opens on run 3, so neither pulse fires under e2e — zero spec amendments — and
  both are verified on the live desk. (The fixture's run 3 is unrelated to the
  player build opening on run 1; `run-loop.ts:176-177` keeps the fixture out of
  the deployed build.)
- The class rides the `.tear` precedent exactly: add class → finite
  `@keyframes` → self-remove on `animationend`. It is applied outside
  `sentenceClass()`, so a later `applyState` repaint simply clears it — accepted,
  as `.tear` already accepts.
- Colors via existing tokens (`--seal-a25`, `--seal-a13`); reduced motion
  collapses it to 1 ms via the global `base.css` rule — nothing to add.

## Scope

**This Scope covers the sentence half only** — the slot half adds at least
`src/client/components/slot-board.ts` and is unwritten (see the amendment).

May modify (the sentence half — only these three files):

- `src/client/windows/reports.ts`
- `src/client/components/report-view.ts`
- `src/client/styles/win-reports.css`

Must NOT modify:

- `src/client/components/minable-sentence.ts` — the state machine
  (`unmined | mined | slotted`) is untouched; the pulse is presentation, not a
  state.
- `tokens.css` — both colors already exist.
- Any test or e2e file — no suite pins sentence class lists exactly (verified
  2026-08-07), and the fixture's run 3 keeps the pulse out of e2e's sight.

Tests turning red: none expected. `tests/windows/reports.test.ts:250-256` counts
`.textContent` reads in the unit's sources — the edits below add none.

## Change list

**E1 — `src/client/windows/reports.ts`** (against `g1-5`'s landed text; re-stamp
will fix line numbers)

E1a — the mount state block (currently beginning `:35`):
current:
```ts
  const filed = new Map<number, ReportModel>()
  let archive: ArchiveEntry[] = []
```
replace with:
```ts
  const filed = new Map<number, ReportModel>()
  let run = 0
  let debuted = false
  let archive: ArchiveEntry[] = []
```

E1b — the meta branch (post-`g1-5` it carries the `view.brand` line):
current:
```ts
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      view.brand(callsignOf(event.run))
      sync()
      return
    }
```
replace with:
```ts
    if (event.type === 'meta') {
      run = event.run
      archive = [...event.archive]
      carried = [...event.carried]
      view.brand(callsignOf(event.run))
      sync()
      return
    }
```

E1c — `drawDocument` (currently `:72-78`):
current:
```ts
  function drawDocument(): void {
    if (active === null) return
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
    const first = model.report_body.length > 0 && !replayed.has(model.round)
    if (first) replayed.add(model.round)
    view.render(model, marks(), { replay: first })
  }
```
replace with:
```ts
  function drawDocument(): void {
    if (active === null) return
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
    const first = model.report_body.length > 0 && !replayed.has(model.round)
    if (first) replayed.add(model.round)
    // O2 — one pulse, first report of the first sitting, never again.
    const debut = first && run === 1 && !debuted
    if (debut) debuted = true
    view.render(model, marks(), { replay: first, debut })
  }
```

**E2 — `src/client/components/report-view.ts`**

E2a — `src/client/components/report-view.ts:94-95` (the tail of
`RenderOptions`), append one field:
current:
```ts
  replay?: boolean
}
```
replace with:
```ts
  replay?: boolean
  /** O2 — this render is the first report of the first sitting: pulse once. */
  debut?: boolean
}
```

E2b — inside `render()`, directly after the facts loop's closing brace
(the loop closes at `:253`; insert before the `body.replaceChildren()` line,
currently `:255`):
current:
```ts
      body.replaceChildren()
```
replace with:
```ts
      if (options?.debut === true) {
        const target = anchors[0]?.node
        if (target !== undefined) {
          target.classList.add('debut')
          target.addEventListener(
            'animationend',
            () => {
              target.classList.remove('debut')
            },
            { once: true },
          )
        }
      }

      body.replaceChildren()
```

**E3 — `src/client/styles/win-reports.css:78-80`** (the `.tear` block gains a
sibling below it)
current:
```css
.min.tear{animation:tearFlash .5s ease-out}
@keyframes tearFlash{0%{background:var(--seal-a55);box-shadow:0 0 0 4px var(--seal-a25)}
  100%{background:transparent;box-shadow:none}}
```
replace with:
```css
.min.tear{animation:tearFlash .5s ease-out}
@keyframes tearFlash{0%{background:var(--seal-a55);box-shadow:0 0 0 4px var(--seal-a25)}
  100%{background:transparent;box-shadow:none}}
.min.debut{animation:debutPulse 1.6s ease-out}
@keyframes debutPulse{0%,55%{background:transparent;box-shadow:none}
  70%{background:var(--seal-a25);box-shadow:0 0 0 3px var(--seal-a13)}
  100%{background:transparent;box-shadow:none}}
```

## Invariants

- **One pulse, ever**: the latch lives in the window, not the component — a
  re-render, a rail re-selection, a new round, a new run must all render without
  it.
- **Finite animation** (a11y no-infinite-loop guard) and **token colors only**.
- The pulse must not change hit targets, ids, or the mined/slotted state
  machinery — presentation only.

## Verification

Run in this order, from the repo root, after committing:

1. `npm run test` — expected: green.
2. `npm run build` — expected: green.
3. `npm run test:e2e -- e2e/reports.spec.ts` — expected: green unchanged (the
   fixture runs as run 3; the pulse must not appear).
4. Behavioral (live desk — the DEV fixture cannot show run 1): on a deployed or
   live-proxy session's first run, the first report's first 현장 기록 sentence
   pulses once ~1 s after the document lands, then never again — switch rails,
   let a second report arrive, start run 2: no pulse.

## Done when

- [ ] The slot half is authored and its files are listed in Scope (amendment).
- [ ] T1 is merged (the store is gone) before this unit's branch is cut.
- [ ] All edits applied; `git diff HEAD~1 --stat` shows exactly the listed files.
- [ ] Steps 1–3 green, in order.
- [ ] Behavioral check 4 confirmed on a live run (author-side is acceptable — mark it in the PR if deferred to the group game check).
- [ ] `grep -n 'debut' src/client/components/minable-sentence.ts` is empty — the state machine was not touched.
- [ ] PR opened from `playtest/g2-3-o2`; nothing merged.

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
