import { APOTHECARY_VERB_COSTS } from "../data/apothecary.js";
import type {
  DialogueBeat,
  DialogueRequest,
} from "./dialogue-types.js";

export function deterministicDialogueFallback(
  request: DialogueRequest,
): DialogueBeat {
  const clueId = request.availableClues[0]?.id;
  return {
    npcLine: `${request.customer.problem} 그래서 약방을 찾아왔어요.`,
    choices: [
      {
        label: "요즘 마음에 걸리는 일이 있으신가요?",
        verb: "indirect",
        patienceCost: APOTHECARY_VERB_COSTS.indirect,
      },
      {
        label: "숨기고 계신 사정이 있나요?",
        verb: "direct",
        patienceCost: APOTHECARY_VERB_COSTS.direct,
      },
      {
        label: "[관찰] 손님의 안색을 살핀다",
        verb: "observe",
        patienceCost: APOTHECARY_VERB_COSTS.observe,
        ...(clueId ? { clueReveals: [clueId] } : {}),
      },
      {
        label: "[조제하러 가기]",
        verb: "craft",
        patienceCost: APOTHECARY_VERB_COSTS.craft,
      },
    ],
  };
}
