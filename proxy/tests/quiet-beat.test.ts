import { describe, expect, it } from "vitest";

import { CALL_SPECS } from "../src/calls.js";
import { renderCall } from "../src/prompt.js";

/**
 * A QUIET BEAT — a minute in which nothing authored happened on this run.
 *
 * They were rare and are now the common case. `exposure.extra_condition` is
 * honoured on the prompt as well as on the feed since #238, so a beat whose
 * every authored row belongs to a branch this run did not take hands the model
 * nothing: 멈춘회전문 goes from 2 such beats to 15 of 31 on a no-intervention
 * run. (The 2 predate the filter — the beats carrying G2 and G3 author no
 * timeline row of their own, so an unavailable gate empties them by the D3 rule
 * itself. The hole was already reachable in production.)
 *
 * What made that dangerous is the pairing this file exists to hold:
 *
 *   1. the slot rendered as a BARE LABEL, directly above `다시 서술하지 말고,
 *      모순되지도 마라` — an instruction with nothing to be about;
 *   2. the schema said `2~3개` and the validator refused an empty array, so
 *      producing something was a CONTRACT, not a choice;
 *   3. the only anchor left was the previous beats, so what came back was the
 *      previous beat continued — and it rode `feed.ts:40` onto the paper as
 *      `kind: 'event'`, the same mark and face as a row the author wrote.
 *
 * On these beats the invented line is not beside the record. It IS the record:
 * the beat's only other feed line is a symptom, and the fanfold stopped
 * printing those. So the two halves are tested together — a sentinel without
 * the permission only makes the invention informed.
 */

const quietSlots = {
  TIMELINE_TAIL: ["19:26 재시도 끝에 전화가 재연결되었다."],
  AGENT_UTTERANCE: "",
  FIXED_NPC_ACTION: "",
  SCENE_SYMPTOMS: ["(변화 없음)"],
  PRESENT_NPCS: [],
};

const loudSlots = { ...quietSlots, FIXED_NPC_ACTION: "천장 가운데가 내려오고 있다." };

const narration = CALL_SPECS.narration;

const descriptionOf = (slots: Record<string, unknown>): string => {
  const tool = narration.buildTool(slots) as unknown as {
    inputSchema: { properties: { timeline_entries: { description: string } } };
  };
  return tool.inputSchema.properties.timeline_entries.description;
};

const userMessage = (slots: Record<string, unknown>): string =>
  renderCall(
    { call_type: "narration", template_version: "v0.4", slots },
    { FLAW: "", INCIDENT: "", PRIORITY_LIST: [] },
  ).user;

describe("a quiet beat is sayable, and answerable with nothing", () => {
  it("says the silence out loud instead of printing a bare label", () => {
    const user = userMessage(quietSlots);
    expect(user).toContain("(없음 — 이번 비트에 기록된 사건은 없다)");
    // The label with nothing under it is the shape that was wrong. Assert the
    // ABSENCE of the empty section rather than the presence of the sentinel
    // alone — a sentinel rendered somewhere else would pass the line above.
    expect(user, "the section is still empty under its own header").not.toMatch(
      /\[이미 일어난 일[^\]]*\]\s*\n\s*\n/,
    );
  });

  it("leaves a beat that DID happen exactly as it was", () => {
    const user = userMessage(loudSlots);
    expect(user).toContain("천장 가운데가 내려오고 있다.");
    expect(user).not.toContain("(없음 — 이번 비트에 기록된 사건은 없다)");
  });

  it("accepts an empty timeline on a quiet beat — silence is not a fallback", () => {
    // Refusing it would undo the schema's own permission in the worst way: a
    // fallback prints `※ 회신 불량` on the paper and costs the beat its whole
    // narration, for a model that did what it was asked.
    expect(narration.validate({ timeline_entries: [], npc_lines: [] }, quietSlots)).toEqual([]);
  });

  it("still refuses an empty timeline where something DID happen", () => {
    expect(
      narration.validate({ timeline_entries: [], npc_lines: [] }, loudSlots),
    ).toContain("timeline_entries empty");
  });

  it("tells the model the empty array is the answer, not merely legal", () => {
    expect(descriptionOf(quietSlots)).toContain("빈 배열이 정답이다");
    expect(descriptionOf(quietSlots)).not.toContain("2~3개");
    expect(descriptionOf(loudSlots)).toContain("2~3개");
  });

  it("asks the same question in both places — the schema cannot permit what the validator refuses", () => {
    // The failure this guards is silent and expensive: a schema that allows an
    // empty array while the validator rejects it turns an obedient model into a
    // fallback on every quiet beat. Both read `quietBeat`; this holds them to
    // agreeing on the boundary cases a single predicate makes identical.
    for (const value of ["", "   ", undefined, null]) {
      const slots = { ...quietSlots, FIXED_NPC_ACTION: value };
      expect(descriptionOf(slots), `FIXED_NPC_ACTION=${String(value)}`).toContain("빈 배열이 정답이다");
      expect(
        narration.validate({ timeline_entries: [], npc_lines: [] }, slots),
        `FIXED_NPC_ACTION=${String(value)}`,
      ).toEqual([]);
    }
  });

  it("a quiet beat that DOES write something is held to the same shape as any other", () => {
    // The permission is to say nothing, not to say anything. An entry that is
    // present but blank is still breakage.
    expect(
      narration.validate({ timeline_entries: ["  "], npc_lines: [] }, quietSlots),
    ).toContain("timeline_entries has an empty entry");
  });
});
