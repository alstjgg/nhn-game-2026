# G4 — §2 행동 원칙 reads as a person, not a manual

> plan-playtest.md **v7** · change list stamped against tree `14dd971` (2026-08-07),
> assuming `g1-1` and `g1-2` are merged. Stamp again if the branch moved.
> Executor: Sonnet-class session. Branch `playtest/g1-3-g4` off current `main`.
> One commit, message: `playtest(G4): 행동 원칙 rewritten as a person`.
> Open a PR; merge nothing (§5.6). Before the first edit, confirm
> `git config user.email` resolves to the `alstjgg` account (repo hard rule 1).

## Outcome

AGENT FILE §2 행동 원칙 carries the same information as a person instead of an
operating manual: the agent does not assert the unverified, judges when judgment
is required, and leaves the why. As a side effect the word `갈림길` — gate
vocabulary — leaves this shipped client surface.

## Scope

May modify (only this file):

- `src/client/components/dossier.ts` — one line.

Must NOT modify:

- `dossier.ts:100` (`title: '행동 원칙'`) — the title stays; the tests and the e2e
  suite assert it (`agent-file.test.ts:270`, `e2e/agent-file.spec.ts:135`).
- `dossier.ts:107` and `:113` — those titles belong to the next unit (`g1-4`).
- Any test or e2e file — no suite asserts the §2 **body**, so nothing turns red
  (swept 2026-08-07).

Tests turning red: none expected.

## Change list

**E1 — `src/client/components/dossier.ts:102`**
current:
```ts
      body: '판단은 관측된 것에서만 세운다. 요구되지 않은 확언을 하지 않는다. 매 갈림길에서 하나의 태도를 고르고, 고른 이유를 보고서에 남긴다.',
```
replace with:
```ts
      body: '확인되지 않은 것을 단정하지 않는다. 판단이 필요한 순간에는 판단하고, 왜 그랬는지 남긴다.',
```

## Invariants

- **Invariant 6** (gate structure never reaches the player): the replacement must
  not name gates, 갈림길, rounds, or any mechanism term. The given copy is final —
  do not rephrase it.
- **Frame copy, not scenario copy**: no 우는다리 content (§5.4).

## Verification

Run in this order, from the repo root, after committing:

1. `npm run test` — expected: all green (the titles assert at
   `agent-file.test.ts:267-274` is untouched by this unit).
2. `npm run build` — expected: green.
3. Behavioral (DEV): `npm run dev` — AGENT FILE §2's body reads exactly the new
   two-sentence copy.

## Done when

- [ ] Exactly one line changed in exactly one file (`git diff HEAD~1 --stat` shows `dossier.ts | 1 +`… one file).
- [ ] `npm run test` green; `npm run build` green.
- [ ] The running DEV desk shows the new §2 body under the unchanged title `행동 원칙`.
- [ ] `grep -n '갈림길' src/client/components/dossier.ts` is empty.
- [ ] PR opened from `playtest/g1-3-g4`; nothing merged.

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
