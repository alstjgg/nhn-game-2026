/**
 * The default prompt — this tier's own contribution to every Call 1.
 *
 * Call contracts §6 assigns `FLAW`, `INCIDENT`, and `PRIORITY_LIST` to "the
 * default prompt authored by the D task", supplied by the proxy. They are
 * therefore NOT accepted from the client: a payload carrying them is ignored,
 * because honouring it would let a client rewrite the agent's character. That
 * is why the lookup below is keyed by pack and not simply passed in — the
 * client may name which agent it wants, never author one.
 *
 * ⚠️ PROVISIONAL VALUES. Each entry is copied verbatim from the suite that
 * measured the pack it is keyed to, so the deployed agent matches the one the
 * evidence describes. The D task owns the authored replacements. Changing a
 * line here changes the measured system — treat it as a shape change, not a
 * copy edit, and re-probe the pack whose entry moved.
 *
 * ⚠️ RESOLVED (08-09): these ARE per-scenario. The note this replaces said "if
 * a second scenario wants a different flaw, this becomes a lookup keyed by
 * pack, and the payload has to name the pack" — 멈춘회전문 is that scenario,
 * and `CallRequest.pack` is that name.
 */

export type DefaultPromptSlots = {
  FLAW: string;
  INCIDENT: string;
  PRIORITY_LIST: string[];
};

const freeze = (slots: {
  FLAW: string;
  INCIDENT: string;
  PRIORITY_LIST: string[];
}): DefaultPromptSlots =>
  Object.freeze({
    ...slots,
    PRIORITY_LIST: Object.freeze([...slots.PRIORITY_LIST]) as unknown as string[],
  }) as DefaultPromptSlots;

/**
 * One agent per scenario, keyed by datapack slug.
 *
 * 전구간정상 — from `planning/dday-mechanism/suites/CSTRUCT-priority-reorder-J1-A.json`,
 * the suite the mechanism program measured C-BLOCK on.
 *
 * 멈춘회전문 — from the three DOME suites (`DOME-G1-baseline`, `DOME-G2`,
 * `DOME-G3`), which carry these three slots identically. Its priorities are a
 * pair rather than a list of four because that pack's gates are questions of
 * what to believe and what to ask next: a four-item ranking of response
 * postures answers a question those gates do not put.
 */
export const DEFAULT_PROMPTS: Readonly<Record<string, DefaultPromptSlots>> =
  Object.freeze({
    전구간정상: freeze({
      FLAW: "[결함] 너는 잘못된 정보에 속을 수 있다.",
      INCIDENT: "[내력] 삼 년 전 겨울, 네가 서둘러 내린 판단 하나가 아직 남아 있다.",
      PRIORITY_LIST: [
        "확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄인다.",
        "대응이 늦어져 피해가 커질 위험을 먼저 줄인다.",
        "판단을 마친 뒤 근거를 시간순으로 정리한다.",
        "외부에 공유하기 전 사건 시각을 명확히 남긴다.",
      ],
    }),
    멈춘회전문: freeze({
      FLAW: "[결함] 너는 회선 저쪽 사람이 자기에게 불리한 것을 빼고 말할 수 있다는 것을 자주 잊는다.",
      INCIDENT: "[내력] 지난겨울, 네가 접수 분류를 한 칸 낮춰 적은 신고가 하나 있었다.",
      PRIORITY_LIST: [
        "회선을 유지한다 — 끊기면 아무것도 알 수 없다",
        "확인되지 않은 것을 확정된 것처럼 올리지 않는다",
      ],
    }),
  });

/**
 * What a request naming no pack — or naming one this deploy has never heard of
 * — is served.
 *
 * It falls back rather than failing, and that is a deliberate trade with a real
 * cost. The two tiers deploy on separate triggers (Pages on merge, SAM by
 * hand), so a client can reach a proxy that predates its slug. Rejecting would
 * turn that window into "every Call 1 fails and every gate takes its default
 * stance" — the game still runs, but it stops being a game. Falling back keeps
 * it playable with the incumbent agent, which is wrong in character and right
 * in shape.
 *
 * What stops that from becoming permanent and invisible is on the root side:
 * `tests/shared/default-prompt-coverage.test.ts` fails when `PACK_SLUG` has no
 * entry here, so the mismatch is caught at merge and never at a judge's screen.
 */
export const FALLBACK_PACK = "전구간정상";

/** The incumbent. Kept as a named export — parity tests compose against it. */
export const DEFAULT_PROMPT: DefaultPromptSlots = DEFAULT_PROMPTS[FALLBACK_PACK]!;

/** Total: every input yields an agent. See `FALLBACK_PACK` for why. */
export function defaultPromptFor(pack?: string): DefaultPromptSlots {
  if (pack === undefined) return DEFAULT_PROMPT;
  return DEFAULT_PROMPTS[pack] ?? DEFAULT_PROMPT;
}
