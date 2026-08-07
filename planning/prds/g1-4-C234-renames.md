# C2+C3+C4 — the player's document vocabulary: 인수인계 사항 · 교신 지침 · 현장 기록 · 무전 기록

> plan-playtest.md **v10** · change list **re-stamped against tree `25f84d3`**
> (2026-08-07, wave 1 fully merged). **Wave 2**: `g1-5` waits for this unit's
> merge.
> **E7 re-cited (08-07, second execution run):** the earlier header claimed
> "line numbers hold — nothing in wave 1 touches this unit's files"; that was
> wrong — `g4-1` (#160) also edits `src/engine/index.ts`, and its E8a added
> four lines above the substitute body. E7 now cites `:179`. Every other row
> re-verified byte-identical at `25f84d3` (g1-3's dossier edit is
> line-for-line, so `:107/:113/:115` stand). The executor that stopped on the
> stale citation was correct.
> **08-07 amendment (resolves the earlier stamp-time flag):** E8's `'현장 기록'`
> traces to nothing the provenance haystack loads, and the FEED-bound
> `PORTED_DEVIATIONS` cannot sanction a `src:` field ((h) would demand it in
> the feed). E13 adds a `COPY_DEVIATIONS` table — haystack-only — and the
> **whole change list was dry-run-verified twice**, the second time on
> `25f84d3` itself: all thirteen edits applied, `check` green, and the only
> red suite pre-commit was the documented slot-board working-tree guard
> (green post-commit by design); 1620/1621 otherwise.
> Executor: Sonnet-class session. Branch `playtest/g1-4-c234` off current `main`.
> One commit (the plan binds C2–C4 to one commit), message:
> `playtest(C2-C4): 인수인계 사항 · 교신 지침 · 현장 기록 · 무전 기록`.
> Open a PR; merge nothing (§5.6). Before the first edit, confirm
> `git config user.email` resolves to the `alstjgg` account (repo hard rule 1).

## Outcome

The four player-facing document names change register, everywhere the player can
meet them: AGENT FILE §4 is `인수인계 사항` (was 알고 있는 문장), §5 is `교신 지침`
(was 보고 지침, with its body re-worded to match), and the two REPORTS documents
are `현장 기록` (was 객관 로그) and `무전 기록` (was 요원 보고서, sub `송신` for
`자필`). The engine's substitute report body — the one report the player reads when
Call 3 fails — speaks the same vocabulary. The Call-3 **prompt header** `[보고 지침]`
is a different string with the same spelling and does not change.

## Scope

May modify (only these eight files):

- `src/client/components/dossier.ts` — two titles, one body.
- `src/client/components/slot-board.ts` — the header comment only, kept in step.
- `src/client/components/report-view.ts` — the two document heads.
- `src/engine/index.ts` — the substitute report body string.
- `src/client/driver/fixtures/woodari-meta.ts` — five `src:` fields, kept in step.
- `tests/windows/agent-file.test.ts` — two title literals.
- `e2e/agent-file.spec.ts` — two title literals.
- `tests/fixtures/provenance.test.ts` — the copy-deviation record for E8 (E13).

Must NOT modify:

- `src/shared/report-guidance.ts` — the renderer of Call 3's `[보고 지침]` slot.
  The prompt header itself lives in `proxy/prompts/reporter/user-v0.2.md`, and
  `tests/shared/temperament.test.ts:333-343` pins both halves of the contract:
  (g) the template supplies the header, (h) the renderer must not mint a second.
  (`report-guidance.ts:3,7` are comments naming that header — they stay too.)
  Touching any of it changes what the model is asked, decoupling the shipped
  system from every C-BLOCK measurement.
- `authoring/lint-datapack.mjs:249` — `객관 로그` there is authored-datapack
  vocabulary the linter parses (`mined_from` classification), not display.
- `src/client/shell/window-registry.ts` — window ko/sub names (`부검`, `보관함`) are
  window naming, out of this unit's scope.
- `announcer.ts:30` (`보고서가 부검 창에 도착했습니다`) and `tally.ts` strings — the
  toast and the ledger are other units' surfaces (U3 deletes the latter).
- `run-feed.ts:120` (`연속용지 · 상황실 무전 기록`) — the feed's own header, already
  in the radio register.
- The `at: '보고서'` / `src: '보고서'` fixture fields in `woodari-meta.ts` — only the
  five `객관 로그` fields are renamed; the store that displays none of them is
  deleted by T1 later.

Tests turning red, and their disposition:

- `tests/windows/agent-file.test.ts:272-273` — **amended** (E9, E10).
- `e2e/agent-file.spec.ts:137-138` — **amended** (E11, E12).
- `tests/windows/block-store.test.ts:557-559` requires `git diff --name-only HEAD --
  slot-board.ts` to be **empty**, so it is red between your edit and your commit and
  green after — verification therefore runs **after** the commit. Not amended.
- `tests/fixtures/provenance.test.ts` (b)/(d) scan every Hangul literal in the
  fixture sources and the block-store fields for a trace to the loaded haystack;
  E8's `'현장 기록'` traces only via the deviation record — **amended** (E13).

## Change list

**E1 — `src/client/components/dossier.ts:107`**
current:
```ts
      title: '알고 있는 문장',
```
replace with:
```ts
      title: '인수인계 사항',
```

**E2 — `src/client/components/dossier.ts:113`**
current:
```ts
      title: '보고 지침',
```
replace with:
```ts
      title: '교신 지침',
```

**E3 — `src/client/components/dossier.ts:115`**
current:
```ts
      body: '라운드 종료 시 객관 항목 최대 8건과 1인칭 자필 보고서를 제출한다. 판단과 인상은 한 문장에 하나씩, 문장 단위로 완결되게 쓴다.',
```
replace with:
```ts
      body: '라운드 종료 시 현장 기록 최대 8건과 무전 기록 한 편을 송신한다. 판단과 인상은 한 문장에 하나씩, 문장 단위로 완결되게 쓴다.',
```

**E4 — `src/client/components/slot-board.ts:1`**
current:
```ts
// SlotBoard — §4 알고 있는 문장: the membrane the operator actually operates
```
replace with:
```ts
// SlotBoard — §4 인수인계 사항: the membrane the operator actually operates
```

**E5 — `src/client/components/report-view.ts:123`**
current:
```ts
const FACTS_HEAD = { no: '가', title: '객관 로그', sub: '일어난 것 · 관측된 것' }
```
replace with:
```ts
const FACTS_HEAD = { no: '가', title: '현장 기록', sub: '일어난 것 · 관측된 것' }
```

**E6 — `src/client/components/report-view.ts:124`**
current:
```ts
const BODY_HEAD = { no: '나', title: '요원 보고서', sub: 'ECHO-1 자필 · 1인칭' }
```
replace with:
```ts
const BODY_HEAD = { no: '나', title: '무전 기록', sub: 'ECHO-1 송신 · 1인칭' }
```

**E7 — `src/engine/index.ts:179`** (the comment on `:177` and the declaration on
`:178` stay)
current:
```ts
  '보고를 생성하지 못했다. 이 라운드의 기록은 객관 로그로 남는다.'
```
replace with:
```ts
  '무전이 끊겨 보고가 도착하지 않았다. 요원은 홀로 판단했다. 이 라운드는 현장 기록으로만 남는다.'
```

**E8 — `src/client/driver/fixtures/woodari-meta.ts:50,52,53,54,57`** — five edits,
each replacing `src: '객관 로그'` with `src: '현장 기록'` on its own line:

`:50` current:
```ts
  { id: 'b-r2-f03', run: 2, at: '09:40', src: '객관 로그', slot: 0 },
```
replace with:
```ts
  { id: 'b-r2-f03', run: 2, at: '09:40', src: '현장 기록', slot: 0 },
```
`:52` current:
```ts
  { id: 'b-r2-f02', run: 2, at: '09:27', src: '객관 로그', slot: null },
```
replace with:
```ts
  { id: 'b-r2-f02', run: 2, at: '09:27', src: '현장 기록', slot: null },
```
`:53` current:
```ts
  { id: 'b-r2-f07', run: 2, at: '13:05', src: '객관 로그', slot: null },
```
replace with:
```ts
  { id: 'b-r2-f07', run: 2, at: '13:05', src: '현장 기록', slot: null },
```
`:54` current:
```ts
  { id: 'b-r2-f05', run: 2, at: '12:00', src: '객관 로그', slot: null },
```
replace with:
```ts
  { id: 'b-r2-f05', run: 2, at: '12:00', src: '현장 기록', slot: null },
```
`:57` current:
```ts
  { id: 'b-r1-f01', run: 1, at: '08:50', src: '객관 로그', slot: null },
```
replace with:
```ts
  { id: 'b-r1-f01', run: 1, at: '08:50', src: '현장 기록', slot: null },
```

**E9 — `tests/windows/agent-file.test.ts:272`**
current:
```ts
      '알고 있는 문장',
```
replace with:
```ts
      '인수인계 사항',
```

**E10 — `tests/windows/agent-file.test.ts:273`**
current:
```ts
      '보고 지침',
```
replace with:
```ts
      '교신 지침',
```

**E11 — `e2e/agent-file.spec.ts:137`**
current:
```ts
      '알고 있는 문장',
```
replace with:
```ts
      '인수인계 사항',
```

**E12 — `e2e/agent-file.spec.ts:138`**
current:
```ts
      '보고 지침',
```
replace with:
```ts
      '교신 지침',
```

**E13 — `tests/fixtures/provenance.test.ts:40-43`** (the lines right after the
`PORTED_DEVIATIONS` table closes)
current:
```ts
] as const

const DEVIATED = PORTED_DEVIATIONS.map((d) => nfc(d.to))
const HAYSTACK = [...authoredTexts(), ...DEVIATED]
```
replace with:
```ts
] as const

/**
 * Non-FEED copy revisions that supersede design-target vocabulary (the target
 * is frozen — see PORTED_DEVIATIONS above). These feed the trace haystack for
 * (b)/(d) only; they are not feed lines, so (g)/(h) do not read them.
 */
const COPY_DEVIATIONS = [
  {
    from: '객관 로그',
    to: '현장 기록',
    reason: 'plan-playtest C4 / g1-4: the record reads as fieldwork; the frozen target keeps the old name',
  },
] as const

const DEVIATED = [...PORTED_DEVIATIONS, ...COPY_DEVIATIONS].map((d) => nfc(d.to))
const HAYSTACK = [...authoredTexts(), ...DEVIATED]
```

## Invariants

- **The prompt is not the display.** `[보고 지침]` in `src/shared/report-guidance.ts`
  must remain byte-identical; `npm run probe:selftest` and the temperament suite
  prove it. If any edit would touch a file under `src/shared/` or `proxy/`, stop —
  that is a defect in this document (§5.7).
- **Invariant 6**: none of the new names hints at gates or structure.
- **Frame copy, not scenario copy** (§5.4): the four names describe the game's
  frame; nothing 우는다리-specific enters code.
- E7's new string becomes mineable report sentences when Call 3 fails — it must
  stay digit-free and mechanism-free (it is: transmission register only).

## Verification

Run in this order, from the repo root, **after committing** (the `slot-board.ts`
guard at `block-store.test.ts:557` is red on an uncommitted tree by design):

1. `git add <the eight files>` · commit.
2. `npm run test` — expected: all green.
3. `npm run probe:selftest` — expected: selftest passes (the Call-3 prompt header
   was not touched).
4. `npm run build` — expected: green.
5. `npm run test:e2e -- e2e/agent-file.spec.ts` — expected: green.
6. Behavioral (DEV): `npm run dev` — REPORTS shows documents `가 현장 기록` and
   `나 무전 기록`; AGENT FILE §4 is `인수인계 사항`, §5 is `교신 지침` with the new
   body line.

## Done when

- [ ] All thirteen edits applied exactly; `git diff HEAD~1 --stat` shows exactly the eight listed files.
- [ ] Steps 2–5 green, in order, post-commit.
- [ ] The running DEV desk shows all four new names (behavioural check 6).
- [ ] `grep -n '알고 있는 문장\|요원 보고서' <the eight listed files>` returns no hits, and
      `grep -n '객관 로그' <the eight listed files>` hits **only** E13's `from:` line in
      `provenance.test.ts` — the deviation record needs the old name.
      (Do **not** sweep `src tests e2e` wholesale: `tests/scaffold/published-data.test.ts:144`
      carries `객관 로그` inside a comment about authored `mined_from` vocabulary, and
      `authoring/lint-datapack.mjs:249` and `data/scenario/` carry it as pack data — all
      three are grandfathered by this unit's Must-NOT and must stay.)
- [ ] `grep -n '보고 지침' src/shared/report-guidance.ts` still returns its two comment lines (`:3`, `:7`) — the file is unchanged.
- [ ] PR opened from `playtest/g1-4-c234`; nothing merged.

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
