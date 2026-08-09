# Handoff — scenario + client lane

Owner: 민서. Branch: `fix/feed-register` (off `main` @ `cb1a70d`).
Counterpart: [`feed-register-llm.md`](./feed-register-llm.md) — the prompt/proxy
half. It quotes the pack freely, so B will see some of the scenario before he
playtests; that was chosen over redacted examples deliberately.

Findings are from one playtest of the shipped 멈춘회전문 pack plus a read of the
feed, engine and composer surfaces.

---

## 1. The LIVE FEED prose is `timeline.json`, verbatim

Confirmed. `src/engine/feed/feed.ts` pushes `script.text` with no
transformation, and `run-feed.ts:19` states the invariant outright — *"`line.text`
and `line.speaker` reach the document untouched — nothing here slices, pads,
counts or reformats them."* The sentence you flagged is `t3`, character for
character.

So this is a manual sweep, and no amount of prompt work touches it.

### 1.1 Edit `draft.md`, never `timeline.json`

The pack is compiled: `npm run datapack:compile -- data/scenario/멈춘회전문/draft.md`.
I verified during the last cycle that recompiling reproduces the committed pack
byte-for-byte, so a hand-edit to `timeline.json` is overwritten on the next
compile and lost silently.

### 1.2 `hardening.json` will fight you

It stores a `text_head` guard per row — the first 12 characters:

```
"t3": { "time": "18:55", "text_head": "모르는 번호가 들어왔습", ... }
```

Any rewrite that changes a row's opening needs its `text_head` updated in the
same commit or `npm run datapack:lint -- data/scenario/멈춘회전문` fails. Same for
`time` if you move a row.

### 1.3 Four surfaces share the voice

Sweep them together or they will disagree:

| file | reaches the model? | reaches the player? |
|---|---|---|
| `timeline.json` `text` | yes — `TIMELINE_EXCERPT`, `TIMELINE_TAIL`, `EXPERIENCED` | yes — LIVE FEED `event` lines |
| `gates.json` `scene` | yes — becomes `FIXED_NPC_ACTION` on a gate beat with no co-timed row (`driver.ts:165-172`) | yes — the gate card |
| `gates.json` stance `label` | **yes** — `STANCE_SET` | yes |
| `gates.json` stance `desc` | **no** — stripped in `shared/contracts.ts` | yes |
| `symptoms.json` | yes — `SCENE_SYMPTOMS` | **no longer** (see §3.1) |

`desc` is the one free surface: it never reaches the model, so it can stay in
whatever register reads best on the card.

### 1.4 The voice change is not only cosmetic — it is half the Call 2 fix

Nearly every row is *reported speech from a phone call* (`…라고 물었습니다` /
`…라고 했습니다`). Call 2 is asked what follows. The natural dramatization of
reported Q&A is to re-stage it as live dialogue — and re-staging needs the
agent's half of the exchange, which only NPCs can carry. That is what produced
the three misattributed 표기웅 lines.

The existing authoring lint cannot catch this: `tools/probe/lint-beat.mjs`
looks for `?` and second-person address, and these rows have neither. The
documented failure mode was "a fixed event that asks the agent a question"; this
pack has found a quieter route to the same place.

So the sweep target is not just "reads better in Korean" — it is **rows that
do not invite the model to re-stage a conversation.** Member B is constraining
Call 2 from the prompt side; this is the other end of the same defect.

---

## 2. Register — what is yours in it

Member B owns the output register (Call 3 → 존댓말, Calls 1–2 → clipped radio
반말). Your side is the *input* register, because the model imitates what it is
fed. Today it is fed:

- `timeline.json` / `gates.json` `scene` — 존댓말, past-tense log voice
- `symptoms.json` — 존댓말, first person (`문세라가 제가 시킨 자리를 다시 물었습니다`)
- stance `label` — 해라체 (`…배수반을 보낸다`)
- `TEMPERAMENT` — 해라체

Four registers in one request. Whatever you land, land it consistently across
§1.3's table.

---

## 3. Client changes

### 3.1 Stop printing symptom lines

Decision: symptom lines leave the LIVE FEED entirely; `SCENE_SYMPTOMS` stays as
a Call 2 input so the model still knows how the NPC is behaving. `symptoms.json`
is untouched as data.

Everything to remove lives in `src/client/components/run-feed.ts`:

- `EMPTY_SYMPTOM` (`:92`) and `emptySymptomModel` (`:169`)
- the `beat_end` arm that calls it (`:511`) and the `symptoms` counter it reads
  (`:352`, `:494`, the `beat_start` reset at `:508`)
- the `symptom` case in `feedLineModel` — it shares an arm with `event` /
  `fallback` / `wait`, so this is removing the kind from the arm, not deleting a
  branch
- `FEED_MARKS.symptom` (`:37`)
- `.fl-symptom` rules in `src/client/styles/win-live-feed.css:70-72`

The `symptom` kind is on the frozen seam (`shared/view-driver.ts`, guarded by
`seam-shapes.test.ts`), so **leave the type alone** — do what x6 did for `wait`:
drop the line in `appendLine` before it reaches the DOM, and leave the kind
total in the projection. `run-feed.ts:151-155` and `:470-482` are the precedent,
including the comment explaining why.

Your reasoning for the record: the citation mark over the utterance
(`인수인계 01 · 03`, `run-feed.ts:140`) already tells the player their handover
reached the agent, which is the signal that matters. Symptoms reported a weaker
thing in the noisiest slot.

`(변화 없음)` goes with them — it printed on every beat that moved no meter,
which in this pack is most beats.

### 3.2 Reframe NPC quotes as the agent relaying

Target shape: `<name>가 "<line>"라고 한다` or a variant — reported speech in the
agent's radio voice, instead of the current screenplay form (`— 표기웅 "…"`).

**Put it in the renderer**, `feedLineModel`'s `npc` case (`run-feed.ts:144-148`),
not in the engine. I had argued for the engine so the mined block would carry
the speaker — that argument is dead: I verified `src/client/windows/live-feed.ts`
has **no mining affordance at all**. Mining exists only in `reports.ts`, over
Call 3's `f` and `b` sentences. `q` ids are absorbed into the block store and
are unreachable by the player. So block text is moot, the engine golden stays
untouched, and the change is wholly in your lane.

Use `speakerName`, not the id — `KeptNpcLine` already carries it.

Three tests move with it:

- **`[u5#c9] (c)`** (`tests/windows/live-feed.test.ts:466`) is the binding one:
  `run-feed.ts` may author exactly six Hangul literals, listed in an `ALLOWED`
  set. Your new fragments go in, `(변화 없음)` comes out.
- **`[u5#c9] (b)`** (`:459`) does **not** block you. It bans `.text.slice()`-style
  method calls; template interpolation is not in the list.
- **`(j)`** (`:180`) asserts the current label+quote part shape and needs
  rewriting.

One Korean detail the code will hit: the subject particle agrees with the
final consonant — 표기웅**이**, 문세라**가**, 하도경**이**. Selecting it means
inspecting the last codepoint of `speaker`, which is more authoring than this
module has ever done. If you'd rather not, a particle-free frame sidesteps it
entirely — `<name>의 대답 — "…"`, or `<name> — "…"라고 한다`. Cheaper and it keeps
`[u5#c9]`'s spirit intact.

`.fl-npc .fl-c b` styling (`win-live-feed.css:68`) needs revisiting either way —
the bold brown speaker label is a screenplay convention and it is the thing that
read wrong.

### 3.3 `TEMPLATE_VERSION` — yours to land, and it lands **second**

`src/composer/compose.ts:51`. Bump to whatever B publishes
(`judgment v0.5`, `narration v0.4`, `reporter v0.4`), then update
`docs/contract-calls.md` §10/§11 to match.

**Do not merge this in the same PR as the prompts.** `proxy-deploy.yml` and the
Pages `deploy.yml` both fire on push-to-main and run concurrently. If the
client asks for a version the proxy hasn't deployed yet,
`proxy/src/prompt.ts:19-25` throws `unknown_template_version` and every call on
the live site falls back. B's PR merges first; watch its proxy deploy finish
(it ends with a real model call asserting `x-llm-fallback: false`); then merge
this.

---

## 4. Decisions on record

| question | decision |
|---|---|
| Call 2's identity | Keep — NPCs responding to the agent. One NPC, one line, and it may not be a question or a request needing an answer. |
| enforcement | Prompt rule, strongly worded. No validator, no engine drop rule. Schema caps `npc_lines` at 1 so the model refuses to overproduce. |
| NPC display | Reframed as the agent relaying. Renderer-side. |
| symptoms | Stop printing. Keep as Call 2 input. |
| `(변화 없음)` | Gone. |
| probe re-measurement | Not doing it. Gate measurements stand as historical, taken against `judgment v0.4`. |
| mis-mining | Working as designed. A wrongly mined sentence is *supposed* to confuse the agent — that is the mechanic, not a bug, and nothing should be added to prevent it. |

---

## 5. Open

- **The unauthorable clock stamp.** A feed line was seen at a minute this pack
  cannot produce — `buildSchedule` (`src/engine/beat/schedule.ts`) creates beats
  only at authored clocks, and `hardening.json` confirms that minute is not one.
  Additionally, the gate beat nearest it has an empty `PRESENT_NPCS`
  (`driver.ts:174-182` builds the roster from co-timed rows, and that gate has
  none), so it could not have produced an NPC quote at all. Did not reproduce.
  Needs one screenshot with the minute legible before it is worth chasing.
- **G3 still has no default that holds** — six repairs, six failures, diagnosis
  positional rather than wording. Carried over from the previous cycle,
  untouched by this work, and not in scope here.
- **`proxy/events/call.json` still carries no `pack`**, so the post-deploy smoke
  exercises `defaultPromptFor`'s fallback rather than the lookup. Also carried
  over. Worth telling B if he ends up in that file.
