# Handoff — LLM lane: prompts, tool schemas, proxy

Owner: Member B. Branch to work from: `fix/feed-register` (off `main` @ `cb1a70d`).

This quotes the shipped 멈춘회전문 pack freely, because the defects are not
legible without the actual text. You will see some of the scenario. That is a
deliberate trade — a redacted example is a worse instruction than a spoiled
playthrough.

Findings are from one playtest of the shipped pack plus a read of the prompt and
call surfaces. Grouped by cause, not by the symptom that surfaced them.

**Cast, so the examples parse.** 표기웅 — the site's night duty officer, the
original caller. 문세라 — a youth-team coach inside the building. 하도경 — a
former maintenance engineer, reached by phone. All three are on the far end of a
line; none of them is in the room with the agent.

---

## 1. The root cause: the prompts describe a different game than the client does

This is behind three of the four defects. Fix it first; several other items
collapse into it.

| | says the agent is | says the player is |
|---|---|---|
| `src/client/**` (`dossier.ts`, `manual.ts`, `confirm.ts`, `tutorial.ts`) | **현장 요원 ECHO** — dispatched to the site, reachable only over the radio | **운영자** — at the desk, cannot go, cannot speak to anyone but the agent |
| `proxy/prompts/judgment/base-v0.4.md:1`, `proxy/prompts/reporter/base-v0.3.md:1` | **광역 재난상황실의 야간 통제관** — takes the calls, sits in a situation room with colleagues | (no player exists in this fiction) |
| `proxy/prompts/narration/base-v0.3.md:1-2` | a **third-person 서술자** who "is not a character" and transcribes the scene "from off-screen" | (no player) |

The prompt fiction is the pre-DDAY concept and was never migrated when the game
became 운영자 + 현장 요원. The client has been shipping the new fiction for weeks;
the prompts never moved.

### 1.1 통제관 is the agent, under its old name

`judgment/base-v0.4.md:1` — `[역할] 너는 광역 재난상황실의 야간 통제관이다.`

The client calls that same entity 현장 요원 ECHO (`dossier.ts:184`,
`callsignOf`). One agent, two names. The model, reading its own role name in
the third person across the narration prompt (`narration/base-v0.3.md:12-18`
mentions 통제관 five times as an entity the narrator observes), narrates a
통제관 standing near the agent. There is no such person.

### 1.2 기록관 does not exist

The player reported a **기록관** appearing repeatedly across beats. I grepped the
repository: **zero** hits in `data/`, `proxy/prompts/`, or `src/`. The only
occurrences anywhere are in `planning/field-report-poc/text-demo/data/` — an
unrelated proof-of-concept from two years ago, not loaded by anything.

It is invented, and the prompt invites it. `narration/base-v0.3.md:17-18`:

```
  일이고, 통제관의 다음 말은 이 기록에 없다. 상황실 인물끼리 주고받는 말과
  각자의 혼잣말은 얼마든지 좋다. 회선 너머의 상대는 통제관에게 말한다.
```

"Chatter between people in the situation room is perfectly fine." There is no
situation room and there are no colleagues — the agent is alone in the field.

**How it reaches the screen, and why it is worse than it looks.** The roster
constraint (`PRESENT_NPCS`) binds **only** `npc_lines`; `classifyNpcLines`
(`src/engine/feed/drops.ts:62-66`) drops any line whose speaker id is not on the
roster, so `기록관: …` would be dropped. But `timeline_entries` is unconstrained
prose, and it renders as `kind: 'event'` — **the same mark and the same style as
authored scenario rows** (`run-feed.ts:33-41`, `feed.ts`). The player has no way
to distinguish an invented colleague from canon.

### 1.3 Task — recast the role in all three base prompts

One agent, alone, in the field, on a radio to the 운영자 at the desk. No
situation room. No colleagues. No one else in earshot. Everyone the agent talks
to is on the far end of a line.

Files: `proxy/prompts/judgment/base-v0.4.md`, `proxy/prompts/reporter/base-v0.3.md`,
`proxy/prompts/narration/base-v0.3.md` — as **new versions** (see §5).

Rename fallout outside the prompt files, all of which say 통제관 and all of which
must move together:

- `proxy/src/prompt.ts:86` — `line: "회선 너머 — 통제관에게만 말한다"`
- `tools/lib/compose.mjs:61` — the byte-identical twin of the above
- `tools/probe/lib/selftest.mjs:306` — asserts that exact header string
- `tools/probe/lint-beat.mjs:77` — `const CONTROLLER = /^(통제관|나|플레이어)$/`

---

## 2. Speech register is specified nowhere

REPORTS and the LIVE FEED arrive in a mix of 존댓말 and 반말, sometimes within
one round.

**Cause: no prompt, no tool-field description, and no policy file states an
output speech level.** All fourteen files under `proxy/prompts/` and both
tool-schema copies — not one line about register.

What the model actually receives is four registers in one request:

| slot | source | as it arrives |
|---|---|---|
| `TIMELINE_EXCERPT` / `TIMELINE_TAIL` / `EXPERIENCED` | `timeline.json` | `한내돔 야간 당직 표기웅이 신고했습니다. 천장 가운데가 처지고 물이 떨어진다고 했고…` — 존댓말, past-tense log |
| `SCENE_SYMPTOMS` | `symptoms.json` | `문세라가 제가 시킨 자리를 다시 물었습니다. 두 번 물었고…` — 존댓말, **first person** (`제가` = the agent) |
| `STANCE_SET` | `gates.json` labels | `달리 볼 근거가 없으므로, 신고 내용 그대로 시설 누수로 접수하고 배수반을 보낸다` — 해라체 |
| `TEMPERAMENT` | `temperament.json` | `너는 회선 저쪽이 말한 것을 그대로 받아 적는 데서 시작하는 사람이다` — 해라체 |

Plus every base prompt is itself 해라체 — instructions *to* the model, which it
sometimes mirrors into output.

The scenario side of that table is being fixed in the other lane. Your side is
to state the target explicitly.

### 2.1 The register rules

Agreed with the player, not up for renegotiation:

- **Call 3 (reporter) — `facts` and `report_body`: business-formal 존댓말.**
  It is a formal record that persists into the archive and is read back later.
- **Call 1 (`utterance`) and Call 2 (all output): business-formal but clipped
  radio 반말.** The agent is transmitting, not writing. Sentence fragments are
  explicitly allowed as a shortening device. `출발했습니다.` is wrong;
  `출발했다.` and `출발.` are both right.

State this in the base prompts *and* in the per-field descriptions in
`proxy/src/calls.ts` — field descriptions reach the model too, and today they
carry contradictory framing (§4).

### 2.2 `data/policy/report-guidance.json`

Lives in the player's tree, but its **content is yours** — it fills Call 3's
`REPORT_GUIDANCE` slot verbatim.

`report_body.policy` currently reads:

```
무전 상황 보고 — 자필 일지가 아니라 교신 말미의 짧은 구두 보고다. 간결한 1인칭
구어로, 한 문장에 판단 하나씩, 문장 단위로 완결되게 말한다 …
```

`간결한 1인칭 구어` is actively licensing the drift you are being asked to
remove. It needs the 존댓말 rule.

Leave `facts.max_items` and `length.min_chars`/`max_chars` alone — balance
values, tuned separately.

---

## 3. Call 2 produces dialogue that belongs to the agent

**What the player saw.** Three consecutive quoted lines in the LIVE FEED, all
attributed to 표기웅, all at the same minute:

```
표기웅  "당, 당 어디서부터 처지는데요?"
표기웅  "가운데 말고? 가장자리는? 그곳도 물이…"
표기웅  "아, 네. 당직자는 다른 분들하고 연락 안 되세요?"
```

All three are the **agent's** half of the call. The first two are the questions
an operator asks a caller who has just reported a sagging roof — 표기웅 is the
one who can see it, so he cannot be asking where it sags. The third is decisive:
it asks whether **the 당직자** can reach anyone else, and 표기웅 *is* the 당직자.
It asks him about himself in the third person.

**This is a known, previously measured failure.** `tools/probe/lint-beat.mjs:6-18`
documents it: the agent speaks in the scene material but is not in
`PRESENT_NPCS`, so Call 2 has no legal slot for that speech; the model puts it
somewhere anyway, and an NPC takes the agent's seat. Measured at **4 of 5**.

It did not reproduce on the player's rerun. **That is expected and does not
clear it** — 4/5 was never 5/5.

The engine's only guard is `classifyNpcLines` (`src/engine/feed/drops.ts`): it
drops a missing prefix, an unknown speaker id, or a verbatim echo of the
utterance. `표기웅` is a legal speaker and the text is not an echo, so all three
lines passed. It **cannot** detect a legal speaker saying the wrong person's
line, and it never will — that is a semantic judgement.

### 3.1 There is a second trigger, specific to this pack, and it is the common one

`lint-beat` catches the documented trigger — "a fixed event that asks the agent
a question" — by looking for `?` and second-person address (`:53-57`).
**This pack has neither**, and it still fails, because nearly every row is
*reported speech from a phone call*:

```
t3  "모르는 번호가 들어왔습니다. 문세라라고 했고, 회전문 앞에 줄이 섰는데
     한 번에 두 사람씩만 돈다고 했습니다."
t4  "표기웅에게 안에 몇 명이냐고 다시 물었습니다. 대답이 한 박자 늦게
     돌아왔고 정리 중이라고 했습니다."
```

Declarative, no `?`, no second person — clean by the lint. But Call 2 is told to
write what follows, and the natural dramatization of reported Q&A is to re-stage
it as live dialogue. Re-staging needs the agent's half. Only NPCs can carry it.
The pack's own voice guarantees the failure across most beats, invisibly to the
existing lint.

`t4` is the exact material behind the screenshot: a row that *narrates* the
agent asking 표기웅 a question. The model dramatized it and had nobody but
표기웅 to give the question to.

The scenario voice is being rewritten in the other lane. Your side is the
contract.

### 3.2 Task — constrain the reply, in the prompt

Agreed shape:

- **At most one NPC speaks, and at most one line.** Not "one NPC who may say
  several" — one line, total. Zero is legal and common: 7 of this pack's 19
  beats have an empty roster (`presentNpcs`, `driver.ts:174-182`, builds the
  roster from co-timed rows and several beats have none).
- **The line must not be a question, and must not be a request that needs the
  agent to answer.** The NPC is *responding to* the agent's utterance; the
  exchange closes on that response.

The player's decision, explicitly: **enforce this as a rule inside the prompt,
strongly worded — not as an external validator.** Do not add a check to
`narration.validate` and do not add a drop reason to `drops.ts`. A refused beat
or a silently-dropped line is worse than an imperfect one.

### 3.3 Task — make the schema refuse overproduction

The one mechanical part. `npc_lines` has no cap today and the model emits
several per beat (three, in the screenshot). Set `maxItems: 1` on the
`npc_lines` array schema so the model refuses to overproduce rather than us
truncating after the fact.

Files: `proxy/src/calls.ts` (the `narration` spec's `buildTool`, around the
`roster.length ? … : …` description) **and** `tools/lib/calls.mjs`. See §5 on
byte parity.

Context, not action: the client will change how a quote is *displayed* — from
the screenplay form above to the agent relaying it
(`표기웅이 "…"라고 한다`). Presentational only; your contract is unchanged. Call 2
still writes the NPC's own words.

---

## 4. The reporter contradicts itself inside one request

`proxy/src/calls.ts`, the `reporter` spec's `report_body` description:

```
"자필 보고서 (markdown). 생각과 판단의 자리 — 무엇이 걸렸고, 왜 그렇게 판단했는지."
```

`proxy/prompts/reporter/base-v0.3.md:21-24`:

```
- 무전 상황 보고. 자필 일지가 아니라 교신 말미에 남기는 짧은 구두 보고다 —
  무엇이 마음에 걸렸고, 왜 그렇게 판단했고, 무엇이 아직 걸리는지를 간결한
  육성으로 남긴다. 마크다운으로 쓴다.
```

Both reach the model in the same call. One asks for a handwritten report; the
other says explicitly it is *not* a handwritten log. This alone is very likely
contributing to the register drift in §2 — the model is being asked for two
different documents and picks a voice per attempt.

The prompt was updated to 무전 상황 보고 at v0.3; the tool description was left
at the v0.1 wording. Make all three surfaces agree: base prompt, tool-field
description, `report-guidance.json`. Given the new fiction (§1) and the register
rule (§2.1), "무전 상황 보고, business-formal 존댓말" is the coherent choice, but
the call is yours.

---

## 5. Mechanics you need before you touch anything

### Byte parity is enforced

`tools/lib/compose.mjs` and `tools/lib/calls.mjs` are held **byte-identical** to
`proxy/src/prompt.ts` and `proxy/src/calls.ts` by
`proxy/tests/prompt-parity.test.ts`. Any edit to one is an edit to both. This is
what lets the offline probe measurements stand for what production sends — don't
route around it.

### Prompt versions are additive

`proxy/prompts/<call>/<layer>-<version>.md` compiles into
`proxy/src/prompt-bundle.generated.ts` via
`proxy/scripts/generate-prompt-bundle.mjs`. Old versions stay in the bundle. Add
new files rather than editing in place:

- `judgment/base-v0.5.md` + `judgment/user-v0.5.md`
- `narration/base-v0.4.md` + `narration/user-v0.4.md`
- `reporter/base-v0.4.md` + `reporter/user-v0.4.md`

Then regenerate. The client selects versions through `TEMPLATE_VERSION`
(`src/composer/compose.ts:51`) — **that bump is the other lane's, and it must
land after yours.**

An unknown version is not a soft failure: `proxy/src/prompt.ts:19-25` throws
`unknown_template_version` and every call falls back.

### Deploy ordering — this one can break the live site

`proxy-deploy.yml` (filtered to `paths: proxy/**`) and the Pages `deploy.yml`
both fire on push-to-main and **run concurrently**. If the client's
`TEMPLATE_VERSION` reaches users before the proxy has that version, every call
throws and the whole desk runs on fallbacks.

**Merge your prompts first. The version bump merges second, separately.** The
proxy deploy ends with a real model call asserting `x-llm-fallback: false`, so
you will know your half landed.

### Local test constraint

`proxy/` requires **Node ≥ 24** and `@aws-sdk/client-bedrock-runtime`. On Node 22
`npm ci` in `proxy/` fails with `notsup` and `proxy/tests/*` cannot run locally.
CI's `proxy` job runs on Node 24 and is a required check on `main`, so it will
verify your work even if you can't run it on your machine.

---

## 6. Decisions already made — do not relitigate

| question | decision |
|---|---|
| Call 2's identity | Keep. It is NPCs responding to the agent's utterance. Not recast as the agent's own narration. |
| how many NPC lines | At most one NPC, at most one line. |
| no-question rule | Prompt rule, strongly worded. **Not** an external validator. |
| overproduction | Schema refuses it (`maxItems: 1`). |
| symptoms | Stop *printing* them (client change). `SCENE_SYMPTOMS` stays as a Call 2 input — keep reading it. |
| `(변화 없음)` | Removed from the display. Client-side sentinel, not yours. |
| mis-mining | Working as designed. A wrongly mined sentence is *supposed* to confuse the agent. Nothing should be added to prevent it. |
| probe re-measurement | **Not doing it.** The gate measurements (F1 207 / F2 57 / F3 12 / WIN 0) were taken against `judgment v0.4` and are accepted as historical. Bumping to v0.5 invalidates their provenance and we are explicitly fine with that. Do not schedule a re-run. |

---

## 7. Not your lane

Listed so you don't fix them and collide:

- `data/scenario/멈춘회전문/**` — the scenario rewrite (voice, prose, the
  reported-speech problem in §3.1)
- `src/client/**` — the LIVE FEED renderer, symptom-line removal, the NPC
  display reframe
- `src/composer/compose.ts` — the `TEMPLATE_VERSION` bump (yours to
  *coordinate*, theirs to land, and it lands second)
- `src/engine/**` — untouched by this work

## 8. One unresolved observation

The screenshot's three lines carry a stamp of **18:39**. This pack cannot author
that minute — `buildSchedule` (`src/engine/beat/schedule.ts:85-116`) creates
beats only at authored clocks, and around there the pack has `t1` 18:38, `t2`
18:40, `G1` 18:41. `hardening.json` confirms all three.

Worse for the obvious theory: `G1` has no co-timed row, so `presentNpcs` returns
an **empty roster** for it, and an empty roster makes `npc_lines` structurally
impossible (`calls.ts` switches the field description to
`"이 비트에는 아무도 없다. 반드시 빈 배열을 쓴다."`). So those quotes cannot have
come from the gate beat either.

Did not reproduce. Probably not your lane — no prompt or proxy code touches
stamps — but if you see a stamp that looks off during your playtest, screenshot
it with the minute visible. That would be the second data point.
