# G2 — LIVE FEED names a fault as transmission trouble, never as mechanism

> plan-playtest.md **v7** · change list stamped against tree `14dd971` (2026-08-07).
> Executor: Sonnet-class session. Branch `playtest/g1-1-g2` off current `main`.
> One commit, message: `playtest(G2): fallback lines speak the transmission register`.
> Open a PR; merge nothing (§5.6). Before the first edit, confirm
> `git config user.email` resolves to the `alstjgg` account (repo hard rule 1).

## Outcome

When an LLM call fails, the feed and the spoken toast describe a radio/transmission
fault — `회신 불량` · `네트워크 지연 중` · `서버 이상 — 요원과 재접선 시도 중` — one
line per severity, instead of naming the game's internal fallback mechanism
(`기본 응답으로 대체`). The player reads a broken radio, not a broken engine.

## Scope

May modify (only these four files):

- `src/client/components/fallback-notice.ts`
- `src/client/shell/announcer.ts`
- `src/client/driver/fixtures/woodari-run03.ts`
- `tests/windows/live-feed.test.ts`

Must NOT modify:

- `src/client/components/run-feed.ts` — it routes `FALLBACK_CLASS` and renders the
  label it is handed; no string of this unit lives there.
- `src/shared/view-driver.ts` / engine — the `fallback` event's shape (`call: 1|2|3`)
  is the seam this unit reads; it does not change.
- The `WAIT_*` strings (`무전 회신 대기 중` etc.) and `e2e/fixtures/selectors.ts` —
  waiting is not a fault.
- `RUN_OPENED` / `REPORT_FILED` / `RUN_CLOSED` in `announcer.ts` — other units own them.

Tests turning red, and their disposition: `tests/windows/live-feed.test.ts` (g) at
`:261-266` uses the old fatal string as its line data — **amended** (edit E5).
No other suite carries these strings (swept 2026-08-07).

## Change list

The class↔call pairing is fixed by `FALLBACK_CLASS` (`fallback-notice.ts:16-20`):
call 1 → `fatal`, call 2 → `local`, call 3 → `supply-cut`. The two maps below must
agree with that pairing; they intentionally duplicate the three strings (the feed
line and the spoken toast are separate surfaces, exactly as they duplicate today).

**E1 — `src/client/components/fallback-notice.ts:27-31`**
current:
```ts
export const FALLBACK_LABEL: Record<FallbackClass, string> = {
  fatal: '회신 실패 — 기본 응답으로 대체',
  local: '일부 회신 실패 — 해당 구간만 기본 응답',
  'supply-cut': '보급 중단 — 남은 회신은 기본 응답',
}
```
replace with:
```ts
export const FALLBACK_LABEL: Record<FallbackClass, string> = {
  fatal: '회신 불량',
  local: '네트워크 지연 중',
  'supply-cut': '서버 이상 — 요원과 재접선 시도 중',
}
```

**E2 — `src/client/shell/announcer.ts:29`**
current:
```ts
const FALLBACK = '회신 실패 — 기본 응답으로 대체'
```
replace with:
```ts
const FALLBACK: Record<1 | 2 | 3, string> = {
  1: '회신 불량',
  2: '네트워크 지연 중',
  3: '서버 이상 — 요원과 재접선 시도 중',
}
```

**E3 — `src/client/shell/announcer.ts:60-61`**
current:
```ts
    case 'fallback':
      return FALLBACK
```
replace with:
```ts
    case 'fallback':
      return FALLBACK[event.call]
```

**E4 — `src/client/driver/fixtures/woodari-run03.ts:95`**
current:
```ts
  { t: '17:33', kind: 'fallback', text: '회신 실패 — 기본 응답으로 대체. 요원은 상황실에 잔류.' },
```
replace with:
```ts
  { t: '17:33', kind: 'fallback', text: '회신 불량. 요원은 상황실에 잔류.' },
```

**E5 — `tests/windows/live-feed.test.ts:262`**
current:
```ts
    const line: FeedLine = { kind: 'fallback', clock: '17:33', text: '회신 실패 — 기본 응답으로 대체.' }
```
replace with:
```ts
    const line: FeedLine = { kind: 'fallback', clock: '17:33', text: '회신 불량.' }
```

## Invariants

- **Digit-free NPC-channel surfaces** (`fallback-notice.ts:22-26`'s own rule; guarded
  by `tests/invariants/no-digit-npc.test.ts`): the three new strings carry no digit.
  Do not "improve" them with codes or numbers.
- **New register only** — the words `기본 응답`, `대체`, `게이트`, `gate` must not
  appear in any replacement string (invariant 6 adjacency; §5.4).
- **Frame copy, not scenario copy** — the three lines name radio/server/agent, never
  우는다리 content (§5.4 scenario-replaceability trap).

## Verification

Run in this order, from the repo root, after committing:

1. `npm run test` — expected: all green, including `tests/windows/live-feed.test.ts`.
2. `npm run build` — expected: green (runs `check` first).
3. Behavioral (DEV): `npm run dev`, open the desk, in the browser console run
   `__feed.seek('17:34')` — the feed prints `회신 불량. 요원은 상황실에 잔류.` on the
   17:33 line.

## Done when

- [ ] All five edits applied exactly; no other line changed (`git diff --stat` shows 4 files).
- [ ] `npm run test` green; `npm run build` green.
- [ ] The DEV feed at 17:33 reads `회신 불량. 요원은 상황실에 잔류.` (behavioural check 3).
- [ ] The strings `기본 응답` and `회신 실패` appear nowhere under `src/` (`grep -rn '기본 응답\|회신 실패' src` is empty).
- [ ] PR opened from `playtest/g1-1-g2`; nothing merged.

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
