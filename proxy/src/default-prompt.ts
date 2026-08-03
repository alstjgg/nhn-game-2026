/**
 * The default prompt — this tier's own contribution to every Call 1.
 *
 * Call contracts §6 assigns `FLAW`, `INCIDENT`, and `PRIORITY_LIST` to "the
 * default prompt authored by the D task", supplied by the proxy. They are
 * therefore NOT accepted from the client: a payload carrying them is ignored,
 * because honouring it would let a client rewrite the agent's character.
 *
 * ⚠️ PROVISIONAL VALUES. These are copied verbatim from the suite the mechanism
 * program measured C-BLOCK on
 * (`planning/dday-mechanism/suites/CSTRUCT-priority-reorder-J1-A.json`), so the
 * deployed agent matches the one the evidence describes. The D task owns the
 * authored replacements. Changing a line here changes the measured system —
 * treat it as a shape change, not a copy edit.
 *
 * ⚠️ Also unsettled: whether these are per-scenario. Today one datapack exists
 * and the values are global. If a second scenario wants a different flaw, this
 * becomes a lookup keyed by pack, and the payload has to name the pack.
 */

export type DefaultPromptSlots = {
  FLAW: string;
  INCIDENT: string;
  PRIORITY_LIST: string[];
};

export const DEFAULT_PROMPT: DefaultPromptSlots = Object.freeze({
  FLAW: "[결함] 너는 잘못된 정보에 속을 수 있다.",
  INCIDENT:
    "[내력] 삼 년 전 겨울, 네가 서둘러 내린 판단 하나가 아직 남아 있다.",
  PRIORITY_LIST: Object.freeze([
    "확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄인다.",
    "대응이 늦어져 피해가 커질 위험을 먼저 줄인다.",
    "판단을 마친 뒤 근거를 시간순으로 정리한다.",
    "외부에 공유하기 전 사건 시각을 명확히 남긴다.",
  ]) as unknown as string[],
}) as DefaultPromptSlots;
