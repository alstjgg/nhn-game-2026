import { PublicError } from "./errors.js";
import type { CallType } from "./types.js";

/**
 * The three calls of [call contracts v1](../../docs/contract-calls.md):
 * which slots each fills, and the output schema it forces.
 *
 * This is the production home of what `tools/lib/calls.mjs` holds for the probe.
 * The schemas moved here with the templates (physical architecture §3.10): the
 * tool schema is built *from slot values* — `stance` enumerates `STANCE_SET` —
 * so it belongs wherever slots are consumed, which is now this tier.
 *
 * ⚠️ **Field order inside `properties` is the generation order.** `judgment`
 * fixes inner_note → stance → because_referent → because_block_ids →
 * rejected_stance → rejected_reason → utterance for a reason (deep-test plan
 * §7.1): the pre-stance note is deliberation, the post-stance fields are
 * post-hoc readouts. `reporter` fixes facts first (the extraction anchor) and
 * report_body last (the SSE tail). Reordering is a shape change and costs a
 * re-validation run.
 *
 * ⚠️ **Every field is a scalar or an array of scalars — no nested objects.** In
 * RB1 (2026-07-30) the model emitted a nested object as a string with the inner
 * keys hoisted, on 7 of 17 baseline attempts, and the malformation was
 * arm-correlated — which voids the comparison. Nested objects are banned here.
 */

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type CallTool = {
  name: string;
  description: string;
  inputSchema: JsonValue;
};

export type CallSpec = {
  /** Slot names the renderer must fill. An unfilled slot is a 500, not a blank. */
  slots: string[];
  /** Per-request tool schema. Throws PublicError(400) on slots it cannot build from. */
  buildTool(slots: Record<string, unknown>): CallTool;
  /** Response → hard problems. A non-empty list means fall back. */
  validate(input: unknown, slots: Record<string, unknown>): string[];
};

const idsOf = (v: unknown, key = "id"): string[] =>
  (Array.isArray(v) ? v : [])
    .map((s) => (s as Record<string, unknown>)?.[key])
    .filter((s): s is string => typeof s === "string" && s.length > 0);

const bad = (message: string) =>
  new PublicError(400, "invalid_slots", message);

const isFilled = (v: unknown): boolean =>
  typeof v === "string" && v.trim().length > 0;

/**
 * Nothing authored happened in this beat on this run.
 *
 * `buildTool` and `validate` both ask it, and they must get the same answer or
 * the schema would permit a shape the validator then refuses — a fallback for a
 * model that obeyed. One predicate rather than the condition twice.
 *
 * `isFilled` is deliberately not reused: it asks whether a slot the CLIENT sent
 * is usable, and answers false for a non-string. This asks whether the beat is
 * quiet, and a missing slot is quiet in exactly the same way an empty one is.
 */
const quietBeat = (slots: Record<string, unknown>): boolean =>
  String(slots.FIXED_NPC_ACTION ?? "").trim().length === 0;

const judgment: CallSpec = {
  slots: [
    "FLAW",
    "INCIDENT",
    "PRIORITY_LIST",
    "TEMPERAMENT",
    "TIMELINE_EXCERPT",
    "BLOCKS",
    "GATE_QUESTION",
    "STANCE_SET",
  ],

  buildTool(slots) {
    const ids = idsOf(slots.STANCE_SET);
    if (ids.length < 2) throw bad("slots.STANCE_SET needs >= 2 {id,label} stances.");
    if (new Set(ids).size !== ids.length) throw bad("slots.STANCE_SET has duplicate ids.");
    return {
      name: "judgment",
      description: "이 게이트에서의 판단을 제출한다. 정확히 한 번만 호출한다.",
      inputSchema: {
        type: "object",
        properties: {
          inner_note: {
            type: "string",
            description:
              "고르기 전에 지나간 생각. 1~3문장. 무엇이 눈에 걸렸고 무엇을 재었는지.",
          },
          stance: { type: "string", enum: ids, description: "고른 스탠스의 id." },
          because_referent: {
            type: "string",
            description:
              "고른 뒤에 쓴다 — 이 판단이 향한 사람 또는 대상을 이름으로 지목한다. 1~2문장. 누구를 두고 이렇게 했는지가 반드시 드러나야 한다.",
          },
          because_block_ids: {
            type: "array",
            items: { type: "string" },
            description: "판단의 근거가 된 [알려진 것] 블럭의 id. 근거가 없으면 빈 배열.",
          },
          rejected_stance: {
            type: "string",
            enum: ids,
            description: "고르지 않은 것 가운데 가장 가까웠던 하나의 id.",
          },
          rejected_reason: { type: "string", description: "그것을 왜 버렸는지 한 줄." },
          utterance: {
            type: "string",
            description:
              "실제로 회선에 나가는 무전. 한두 문장. 사무적으로, 짧게 끊고 해라체로 끝맺는다 — `출발했다.`는 맞고 `출발했습니다.`(존댓말)도 `출발했어.`(해체)도 틀리다. 문장 조각도 좋다.",
          },
        },
        required: [
          "inner_note",
          "stance",
          "because_referent",
          "because_block_ids",
          "rejected_stance",
          "rejected_reason",
          "utterance",
        ],
      },
    };
  },

  validate(input, slots) {
    if (!input || typeof input !== "object") return ["response was not an object"];
    const value = input as Record<string, unknown>;
    const problems: string[] = [];
    const ids = idsOf(slots.STANCE_SET);

    if (!isFilled(value.inner_note)) problems.push("inner_note empty");
    if (typeof value.stance !== "string" || !ids.includes(value.stance)) {
      problems.push(`stance "${String(value.stance)}" not in stance set`);
    }
    if (!isFilled(value.because_referent)) problems.push("because_referent empty");
    if (!Array.isArray(value.because_block_ids)) {
      problems.push("because_block_ids not an array");
    }
    if (!isFilled(value.utterance)) problems.push("utterance empty");

    // Deliberately NOT hard: a hallucinated block id, and a rejected_stance that
    // equals stance or arrives malformed. Those are observations about the model
    // (probe run log A16), and the probe records them rather than retrying. Here
    // they must not trigger a fallback either — the fields are diagnostics-only
    // (call contracts §6, "Consumer per output") and never reach the player.
    return problems;
  },
};

const NPC_LINE = /^(\S+):\s*(.+)$/;

const narration: CallSpec = {
  slots: [
    "TIMELINE_TAIL",
    "AGENT_UTTERANCE",
    "FIXED_NPC_ACTION",
    "SCENE_SYMPTOMS",
    "PRESENT_NPCS",
  ],

  buildTool(slots) {
    // An EMPTY roster is legal, and it is not an edge case: 7 of 우는다리's 19
    // beats are `surface: "document"` — a report arriving, a log screen — where
    // nobody is present because nobody speaks. Requiring >= 1 made 37% of that
    // pack unrunnable against engine spec §3.1 ("script beats run Call 2 without
    // exception"), and the only way to satisfy it would be to invent presence,
    // which also licenses the model to have someone speak in an empty room.
    // Found 2026-08-03 by running the pack through the real handler.
    const roster = idsOf(slots.PRESENT_NPCS);
    // A QUIET beat: nothing authored happened in this minute on this run. The
    // renderer says so out loud (`prompt.ts`'s FIXED_NPC_ACTION sentinel), and
    // this is the other half — without it the sentinel only makes the invention
    // informed. `2~3개` plus a validator that refuses an empty array is a
    // CONTRACT TO WRITE, so a beat with no anchor left the model two sentences
    // to produce and only the previous beats to produce them from; what came
    // back rode `feed.ts:40` onto the paper as `kind: 'event'`, the same mark
    // and the same face as a row the author wrote. On these beats the invented
    // line is not beside the record — it IS the record, because the beat's only
    // other line is a symptom and the fanfold stopped printing those (x8).
    //
    // So silence becomes sayable. The base prompt has told the model since v0.4
    // that "비어 있다고 채우지 않는다"; until now the schema contradicted it.
    const quiet = quietBeat(slots);
    return {
      name: "narration",
      description: "이 비트의 반응을 기록한다. 정확히 한 번만 호출한다.",
      inputSchema: {
        type: "object",
        properties: {
          timeline_entries: {
            type: "array",
            items: { type: "string" },
            description: quiet
              ? "이번 비트에는 기록된 사건이 없다. 앞 비트를 이어 붙여 채우지 않는다 — 쓸 것이 없으면 빈 배열이 정답이다. 그래도 쓸 것이 있다면(장면의 변화가 무언가를 말하고 있다면) 한 항목은 한 문장이고, 현장에서 남기는 짧은 기록이라 해라체로 끝맺는다."
              : "고정 사건에 뒤따르는 반응과 장면의 결. 2~3개. 한 항목은 한 문장이다 — 마침표는 항목의 맨 끝에 하나뿐이고, 항목 안에서 두 문장을 잇지 않는다. 이미 타임라인에 있는 것(고정 사건·요원 발화)은 다시 쓰지 않는다. 현장에서 남기는 짧은 기록이다 — 해라체로 끝맺는다.",
          },
          // `maxItems: 1` is the ONE mechanical half of the misattribution fix
          // (handoff §3.3). The rest is prompt wording, deliberately: the player
          // ruled that a refused beat is worse than an imperfect one, so there
          // is no validator and no drop reason for a wrong-but-legal speaker.
          // The cap only stops OVERPRODUCTION — three lines in one beat, which
          // is what put the agent's own questions in 표기웅's mouth — by making
          // the schema refuse it rather than truncating after the fact.
          npc_lines: {
            type: "array",
            items: { type: "string" },
            maxItems: 1,
            description: roster.length
              ? '이 비트의 대사. 많아야 한 줄이고, 말하는 사람도 한 명뿐이다. 항목은 "인물id: 대사" 형식이며 [현장의 인물]에 있는 id만 쓴다. 되묻지 않는다 — 물음이거나 요원의 대답을 요구하는 말은 쓸 수 없다. 대사가 없는 비트가 정상이다. 없으면 빈 배열.'
              : "이 비트에는 아무도 없다. 반드시 빈 배열을 쓴다.",
          },
        },
        required: ["timeline_entries", "npc_lines"],
      },
    };
  },

  validate(input, slots) {
    if (!input || typeof input !== "object") return ["response was not an object"];
    const value = input as Record<string, unknown>;
    const problems: string[] = [];

    // Read from the SLOTS, the same question `buildTool` asked — a beat with no
    // authored event may legally come back with nothing. Refusing it here would
    // undo the schema's permission in the worst possible way: a fallback, which
    // prints `※ 회신 불량` on the paper and costs the beat its whole narration,
    // for a model that did exactly what it was asked to do.
    //
    // An empty array is still refused everywhere else, because everywhere else
    // there IS something to react to and silence is a dropped beat.
    const quiet = quietBeat(slots);
    if (!Array.isArray(value.timeline_entries)) {
      problems.push("timeline_entries not an array");
    } else if (!value.timeline_entries.length && !quiet) {
      problems.push("timeline_entries empty");
    } else if (value.timeline_entries.some((e) => !isFilled(e))) {
      problems.push("timeline_entries has an empty entry");
    }

    if (!Array.isArray(value.npc_lines)) {
      problems.push("npc_lines not an array");
    } else if (value.npc_lines.some((line) => !NPC_LINE.test(String(line ?? "")))) {
      // A missing "id:" prefix is form breakage — the line cannot be attributed,
      // so it cannot go on the timeline and W2 mining is dead on it.
      problems.push('npc_lines entry has no "id: 대사" prefix');
    }

    // An invented speaker is NOT hard here. The probe records it as an
    // observation; production drops the offending line (call contracts §3), and
    // dropping one line is not a reason to discard a whole beat.
    return problems;
  },
};

const reporter: CallSpec = {
  // The reporter reads the SAME temperament the judgment call reads (game spec
  // §4). One source — two copies would drift apart silently.
  slots: ["TEMPERAMENT", "EXPERIENCED", "REPORT_GUIDANCE"],

  buildTool() {
    return {
      name: "reporter",
      description: "이번 라운드의 기록을 남긴다. 정확히 한 번만 호출한다.",
      inputSchema: {
        type: "object",
        properties: {
          facts: {
            type: "array",
            items: { type: "string" },
            description:
              "객관 기록. 이 라운드에 실제로 일어났거나 관찰된 것만, 한 항목에 한 문장. 생각·해석·평가 금지. 업무 격식 존댓말로 쓴다.",
          },
          report_body: {
            type: "string",
            description:
              "무전 상황 보고 (markdown). 교신 말미에 본부로 보내는 짧은 구두 보고 — 무엇이 걸렸고, 왜 그렇게 판단했는지. 업무 격식 존댓말로 쓴다.",
          },
        },
        required: ["facts", "report_body"],
      },
    };
  },

  validate(input) {
    if (!input || typeof input !== "object") return ["response was not an object"];
    const value = input as Record<string, unknown>;
    const problems: string[] = [];

    if (!Array.isArray(value.facts)) problems.push("facts not an array");
    // A round always contains observable events (EXPERIENCED is never empty),
    // so an empty facts array is form breakage, not an observation.
    else if (!value.facts.some(isFilled)) problems.push("facts empty");
    else if (value.facts.some((f) => !isFilled(f))) problems.push("facts has an empty entry");

    if (!isFilled(value.report_body)) problems.push("report_body empty");
    return problems;
  },
};

export const CALL_SPECS: Record<CallType, CallSpec> = {
  judgment,
  narration,
  reporter,
};
