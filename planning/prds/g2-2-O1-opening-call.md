# O1 — the day opens on the call, not on the desk

> plan-playtest.md **v7** · change list stamped against tree `14dd971` (2026-08-07).
> Group 1 does not touch these files; re-stamp is expected to be line-numbers only.
> Executes after `g2-1` (same files untouched; order is for the game check).
> Executor: Sonnet-class session. Branch `playtest/g2-2-o1` off current `main`.
> One commit, message: `playtest(O1): the 08:50 call plays before the desk reveals`.
> Open a PR; merge nothing (§5.6). Confirm `git config user.email` resolves to the
> `alstjgg` account first (hard rule 1).

## Outcome

A fresh load opens on a bare dark screen. The day's first transmission — the
08:50 lines the driver has already released — types onto it, line by line. Then
it cuts, and the desk reveals exactly as it does today. Any key or click skips.
Ten seconds that say who you are, what this is, and why it is urgent — the first
ten seconds of deliverable #2.

## Design (author-resolved)

- **No second hold is built.** The sequence threads into `bootShell()` between
  the run opening (`driver.clock.setRate(0)`, `boot.ts:189`) and the pump/reveal
  block (`:214-219`). The existing `holdDesk`/`revealDesk` seam is untouched;
  the overlay simply resolves before `revealDesk` is reached.
- The lines come from `driver.frame().events` — the events already released at
  the opening minute (boot runs `driver.start(); driver.advance(0)` first). The
  overlay renders the `feed` events among them (kinds `event`/`npc`/`radio`),
  speaker included. **Nothing is hardcoded from 우는다리** — a different pack's
  opening minute plays its own lines (§5.4 scenario-replaceability).
- **`navigator.webdriver === true` skips the overlay entirely.** Every Playwright
  boot (about fifty across the e2e suite) sees today's exact timings; no e2e
  helper changes. `prefers-reduced-motion` also skips (the CSS collapse would
  flash it anyway; skipping is the honest version).
- Timing is plain `setTimeout` inside the component — this is shell territory,
  outside the u5 timer bans. Constants in-file: `LINE_MS = 1600` per line,
  `LINGER_MS = 1800` after the last, cut on first `keydown`/`pointerdown`.
- Colors and fonts come from **existing** tokens; no token is added. The screen
  is `--ink-0` (#08090c) and the type is the `--txt-*` family — the light-ink
  set the dark shell already uses. Not `--pap-*`: that is the dark ink for the
  windows' paper stock (`.rbody` uses `--pap-2`), and on this screen it reads at
  about 1.3:1. Red is out for the same reason — `--seal` is ~1.9:1 on black.
  Element rules live in `shell.css` (`tokens.css` declares, never paints). All
  animation is finite (the a11y no-infinite-loop guard).

## Scope

May modify (only these three files):

- `src/client/components/opening-call.ts` — **new file**.
- `src/client/shell/boot.ts` — one import, one await.
- `src/client/styles/shell.css` — the `#opening` rules.

Must NOT modify:

- `src/client/styles/tokens.css` — every token this unit needs already exists
  (`--ink-0`, `--txt`, `--txt-hi`, `--mono`, `--fs-12`, `--space-22`). Minting a
  near-duplicate of `--ink-0` is not this unit's business.
- `src/client/components/desktop-dressing.ts` — the hold/reveal seam stays as is.
- `index.html` — the overlay is built and removed by the component.
- Any e2e file — the webdriver gate exists so none needs to change.
- Any window or driver file.

Tests turning red, and their disposition: none expected. `tests/styles/token-lint.test.ts`
scans colors and passes as long as every color in the new rules is a `var()` — it is.
`tests/styles/stacking-context.test.ts` was audited (2026-08-07) and does **not**
cover this rule: its `(c)` guard is scoped to window-root bodies and `(d)` to the
per-window skin sheets, so a literal `z-index` in `shell.css` is exactly what
`#grain:900`, `#toast:950` and `#topbar:500` already do. If it goes red anyway,
**stop and report per §5.7**; do not amend it on your own.

## Change list

**E1 — new file `src/client/components/opening-call.ts`**, exactly:
```ts
// OpeningCall — O1: the day's first transmission plays on a bare screen before
// the desk reveals (plan-playtest §1). The lines are the driver's own already-
// released opening-minute events — nothing here knows the scenario.
//
// Skipped whole under automation (`navigator.webdriver`) and under
// prefers-reduced-motion; the boot then behaves exactly as before this file
// existed. Any key or pointer press cuts to the desk.
import type { ViewEvent } from '../driver/index.ts'
import { el } from '../shell/dom.ts'

/** Real ms each line holds the screen, and the linger after the last. */
const LINE_MS = 1600
const LINGER_MS = 1800

/** The feed kinds the opening plays — the call itself, not the bookkeeping. */
const OPENING_KINDS = new Set(['event', 'npc', 'radio'])

export function playOpening(body: HTMLElement, events: readonly ViewEvent[]): Promise<void> {
  if (navigator.webdriver) return Promise.resolve()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve()

  const lines = events.flatMap((event) =>
    event.type === 'feed' && OPENING_KINDS.has(event.line.kind) ? [event.line] : [],
  )
  if (lines.length === 0) return Promise.resolve()

  return new Promise((resolve) => {
    const overlay = el('div')
    overlay.id = 'opening'
    const paper = el('div', 'op-lines')
    overlay.append(paper)
    body.append(overlay)

    const timers: ReturnType<typeof setTimeout>[] = []
    const done = (): void => {
      for (const timer of timers) clearTimeout(timer)
      window.removeEventListener('keydown', done)
      window.removeEventListener('pointerdown', done)
      overlay.remove()
      resolve()
    }
    window.addEventListener('keydown', done)
    window.addEventListener('pointerdown', done)

    lines.forEach((line, index) => {
      timers.push(
        setTimeout(() => {
          const row = el('p', 'op-line')
          if (line.speaker !== undefined && line.speaker.length > 0) {
            row.append(el('b', undefined, line.speaker), document.createTextNode(' '))
          }
          row.append(document.createTextNode(line.text))
          paper.append(row)
        }, index * LINE_MS),
      )
    })
    timers.push(setTimeout(done, lines.length * LINE_MS + LINGER_MS))
  })
}
```

**E2 — `src/client/shell/boot.ts:187`** (the run-opening block; the three lines
below start at `:187` and `setRate(0)` is `:189`)
current:
```ts
  driver.start()
  driver.advance(0)
  driver.clock.setRate(0)
```
replace with:
```ts
  driver.start()
  driver.advance(0)
  driver.clock.setRate(0)

  // O1 — the opening minute plays on the bare screen; automation skips it.
  await playOpening(body, driver.frame().events)
```

**E3 — `src/client/shell/boot.ts`, the import block** — add one line beside the
other component imports (the executor places it with the existing
`desktop-dressing` import, alphabetical within the group):
```ts
import { playOpening } from '../components/opening-call.ts'
```

**E4 — `src/client/styles/shell.css`** — appended at the end of the file:
```css
/* ══ O1 — the opening call, before the desk ═════════════════════════════ */
#opening{position:fixed;inset:0;z-index:955;background:var(--ink-0);
  display:flex;align-items:center;justify-content:center}
#opening .op-lines{max-width:620px;padding:var(--space-22);font-family:var(--mono);
  font-size:var(--fs-12);line-height:1.9;color:var(--txt)}
#opening .op-line{animation:opLine .9s ease-out both}
#opening .op-line b{color:var(--txt-hi);font-weight:700;letter-spacing:.06em}
@keyframes opLine{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:none}}
```
(If any of `--ink-0`, `--txt`, `--txt-hi` does not exist in `tokens.css`, stop
and report per §5.7 — do not substitute a color.)

`955` is chosen, not free: `#toast` sits at `950` (`shell.css:213`) and the
overlay must cover it, while `.skip-link` at `960` must stay reachable above the
overlay. Do not round it to 999.

## Invariants

- **Scenario-replaceable**: the overlay renders whatever the pack's opening
  minute released — no clock literal, no line literal, no speaker literal.
- **The membrane**: display only; the overlay accepts no input except the skip.
- **No second hold**: `holdDesk`/`revealDesk` and `body.booting` are untouched.
- Finite animations only; colors only via tokens.

## Verification

Run in this order, from the repo root, after committing:

1. `npm run test` — expected: green.
2. `npm run build` — expected: green.
3. `npm run test:e2e` — expected: green **with unchanged timings** (webdriver
   skips the overlay; if boot-dependent specs slow down or fail, stop per §5.7).
4. Behavioral (DEV, a normal browser): `npm run dev` — dark screen, the 08:50
   lines type in with the caller named, then the desk reveals on its own; reload
   and press a key mid-overlay — it cuts straight to the desk.

## Done when

- [ ] One new file, two edited; `git diff HEAD~1 --stat` shows exactly the three listed files — `tokens.css` is **not** among them.
- [ ] Steps 1–3 green, in order.
- [ ] The behavioral sequence in check 4 plays as described, and the desk after it behaves exactly as before (▶ still starts the day).
- [ ] `grep -n '08:50\|서지형' src/client/components/opening-call.ts` is empty — no scenario literal.
- [ ] PR opened from `playtest/g2-2-o1`; nothing merged.

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
