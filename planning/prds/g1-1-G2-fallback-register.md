# G2 — LIVE FEED names a fault as transmission trouble, never as mechanism

> plan-playtest.md **v8** · change list stamped against tree `de9e03a`
> (2026-08-07) — every row re-verified byte-identical at handoff.
> **Amended same day** after the first execution run stopped correctly at
> verification: the old fatal string also lives in the frozen design target,
> which `tests/fixtures/provenance.test.ts` pins the fixture to. E6 added;
> all rows re-verified at `fa1cfa9`.
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

May modify (only these five files):

- `src/client/components/fallback-notice.ts`
- `src/client/shell/announcer.ts`
- `src/client/driver/fixtures/woodari-run03.ts`
- `tests/windows/live-feed.test.ts`
- `tests/fixtures/provenance.test.ts`

Must NOT modify:

- `src/client/components/run-feed.ts` — it routes `FALLBACK_CLASS` and renders the
  label it is handed; no string of this unit lives there.
- `src/shared/view-driver.ts` / engine — the `fallback` event's shape (`call: 1|2|3`)
  is the seam this unit reads; it does not change.
- The `WAIT_*` strings (`무전 회신 대기 중` etc.) and `e2e/fixtures/selectors.ts` —
  waiting is not a fault.
- `RUN_OPENED` / `REPORT_FILED` / `RUN_CLOSED` in `announcer.ts` — other units own them.
- `docs/design/phase2-ui/data.js` — the old fatal string survives there at `:145`,
  and that is correct: `docs/design/` is a **frozen path**. Two guards red on any
  edit, uncommitted or committed (`tests/fixtures/dev-only.test.ts` (e2)/(f),
  `tests/acceptance/discovery-and-frozen-guard.test.ts` (n)). The design target is
  history; copy revisions are recorded as deviations (E6), never written back.

Tests turning red, and their disposition:

- `tests/windows/live-feed.test.ts` (g) at `:261-266` uses the old fatal string as
  its line data — **amended** (edit E5).
- `tests/fixtures/provenance.test.ts` (b)/(c)/(g) pin the fixture to the frozen
  design target's FEED, which still carries the old fatal line — **amended** (edit
  E6): the copy change is recorded in `PORTED_DEVIATIONS`, the table this suite
  provides for exactly this case. After E6, (h) also asserts the old string is gone
  from the fixture — E4 already makes that true.

No other suite carries these strings or compares the fixture FEED to the design
target (`segmenter-golden` reads only REPORT material; re-swept 2026-08-07,
this time including the reference data files the suites load, not only the
suites themselves).

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

**E6 — `tests/fixtures/provenance.test.ts:19-30`**
current:
```ts
/**
 * The ONLY sanctioned divergence from the design target (spec D3 row 3):
 * inv 2 forbids a digit in an `npc` line, so 20:22's `20분` is spelled out.
 * Every other reference line is ported verbatim.
 */
const PORTED_DEVIATIONS = [
  {
    from: '영장 없이는 못 엽니다. ……20분만 줘요.',
    to: '영장 없이는 못 엽니다. ……스무 분만 줘요.',
    reason: 'inv 2 / [u2f#c4]: no digit may appear in an `npc` line text',
  },
] as const
```
replace with:
```ts
/**
 * The sanctioned divergences from the design target. The target itself is
 * frozen (`docs/design/` — [u2f#c10] in dev-only.test.ts), so a copy revision
 * that supersedes a reference line is recorded here, never written back.
 *  1. spec D3 row 3: inv 2 forbids a digit in an `npc` line, so 20:22's
 *     `20분` is spelled out.
 *  2. plan-playtest G2 (g1-1, 08-07): the fatal-fallback line stays in
 *     fiction instead of narrating the mechanism.
 * Every other reference line is ported verbatim.
 */
const PORTED_DEVIATIONS = [
  {
    from: '영장 없이는 못 엽니다. ……20분만 줘요.',
    to: '영장 없이는 못 엽니다. ……스무 분만 줘요.',
    reason: 'inv 2 / [u2f#c4]: no digit may appear in an `npc` line text',
  },
  {
    from: '회신 실패 — 기본 응답으로 대체. 요원은 상황실에 잔류.',
    to: '회신 불량. 요원은 상황실에 잔류.',
    reason: 'plan-playtest G2 / g1-1: fallback copy stays in fiction; the frozen target keeps the old line',
  },
] as const
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

- [ ] All six edits applied exactly; no other line changed (`git diff --stat` shows 5 files; `docs/design/phase2-ui/data.js` is NOT among them).
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
