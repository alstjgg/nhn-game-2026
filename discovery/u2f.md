# u2f — DISCOVERY

Things this unit must NOT fix inline. Appended by IMPLEMENT (attempt 1).

## 1. Cross-unit conflict — u2's `[u2#c9] (p)` freezes the fixtures directory

`tests/driver/replay-order.test.ts:206` asserts

```ts
expect(fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.ts')).sort())
  .toEqual(['minimal.ts', 'types.ts'])
```

u2f's whole deliverable is four more modules in exactly that directory
(`index.ts`, `woodari-run03.ts`, `woodari-reports.ts`, `woodari-meta.ts`), so the
assertion goes red the moment this unit lands. **Not fixed here**: the file is
another unit's test and outside this unit's `file_globs`, and weakening someone
else's guard from inside a downstream branch is exactly the edit a merge barrier
exists to arbitrate.

The *intent* of u2's guard ("u2 does not author demo fixture content") survives
untouched — u2 still ships only `types.ts` + `minimal.ts`, and u2f's own
`tests/fixtures/dev-only.test.ts` is the successor guard for the directory (no
static `woodari-*` import outside `fixtures/`, DEV-guarded dynamic import, no
fixture string in `dist/`). **Integrator action:** at the u2 ∪ u2f barrier,
re-point `(p)` at that intent — e.g. assert that the non-`woodari` modules are
exactly `['index.ts', 'minimal.ts', 'types.ts']` and that `minimal.ts` still
carries no 우는다리 material (its sibling `(q)` case, which still passes).

## 2. Invariant-vs-reference deviations applied (P0-A precedence)

1. **Digit in an `npc` line (inv 2 / `[u2f#c4]`).** The reference's 20:22 line
   reads `영장 없이는 못 엽니다. ……20분만 줘요.` — a digit in NPC state, which the
   invariant forbids. Ported as the compliant equivalent
   `……스무 분만 줘요.` (the pack's own idiom: `스물한 시`, `열네 번`). One
   deviation, recorded in `provenance.test.ts`'s `PORTED_DEVIATIONS`.
2. **Species classification overridden by channel (spec-client §5.2).** The
   design target hand-classifies seven report sentences against their channel —
   `b-r2-f02` / `b-r2-f07` as `quote`, and `b-r1-b06` / `b-r2-b03` / `b-r2-b06` /
   `b-r3-b05` / `b-r3-b06` as `emotion`. "Species derives from the channel, never
   from classification" wins: they are `fact` and `selfnarr` here. The reference
   is a UI mock and its species column is decoration; the fixture's is load-
   bearing (contract-datapack E2 gates the solution path on it).

## 3. Reference ambiguities resolved, and the reasoning that resolved them

- **No beat structure in the reference.** `data.js` is a flat 65-row feed; the
  seam wants `beat_start`/`beat_end`. Rule adopted: **a beat opens on every
  `event` line** (the fixed script event is what starts a beat) and closes on the
  line before the next one. It satisfies §7 #2 (≤3 symptoms per beat, and beats
  with none) as a *consequence* rather than by hand-partitioning, but it is an
  inference — if the run-loop manager (윤석) defines beats differently, this is
  the module that must follow it.
- **No `waiting` windows in the reference** either — only `wait` feed lines.
  Rule adopted: a `wait` line opens `waiting{for:'judgment'}`, and the next
  `radio` (or the `fallback`, when no reply comes) closes it. `for` is always
  `'judgment'` because the demo's six waits are all the Call-1 window;
  `'narration'` / `'report'` are unexercised by this fixture.
- **Fallback code vocabulary.** `ViewEvent.fallback.code` is `string` and
  spec-client §7 #7 only says "per engine §5 classes". Used
  `bedrock_timeout` — contract-calls' 504 row, the fallback-flagged status that
  matches a Call-1 judgment timeout (engine §5, grade *fatal*, `default_stance`
  applied). If the engine ends up minting its own code vocabulary rather than
  forwarding `x-fallback-code`, this constant follows it.
- **19:40 has no authored id.** The 13 feed `event` rows that render a
  `timeline.json` event carry its `t*` id. 19:40 deliberately does **not**:
  `t16` at that clock is the phone-booth arrest, while the reference line is the
  entry-cap outcome. Clock equality alone would have passed the id-scheme test,
  but an id that names a different sentence is the exact failure archive
  highlighting is keyed against — so 19:40 is minted `n` instead.
- **One `report` event, not three.** The run has three round marks, but the
  reference authors one report per *run*. Only the round-3 report (REPORT_R3) is
  streamed; rounds 1–2 of run 03 would need invented content, which §5.4 forbids.

## 4. Read-scope note

`.claude/super/units/u2f.md` — the unit's own full contract, listed first in the
read scope as "READ FIRST" — **does not exist in this worktree** (only
`.claude/super/units/u2f/tests.md` is present, and no `u2f*.md` exists anywhere
under the run root). The acceptance criteria were therefore read from the task
prompt's truncated list plus `tests.md` and the eight RED test files, which
between them pin every AC. Flagging it in case the same truncation hit other
units: the criteria strings in the prompt are cut mid-sentence with a
`(full: …#cN)` pointer to a file that is not on disk.
