export const APOTHECARY_VERB_COSTS = {
  indirect: 1,
  direct: 2,
  observe: 0,
  craft: 0,
} as const;

export const APOTHECARY_TIER_TONES = [
  "손님은 평온하고 협조적이다. 여유 있게 자기 이야기를 풀어놓는다.",
  "손님은 슬슬 흥미를 잃고 있다. 대답이 짧아지고 심드렁해진다.",
  "손님은 짜증이 나 있다. 말투가 퉁명스럽고 은근히 재촉한다.",
  "손님은 인내심이 바닥났다. 당장 약이나 내놓으라는 태도로 말을 끊으려 한다.",
] as const;

export const APOTHECARY_PERSONA_TRAITS = [
  "A wiry old fisherman with a sun-weathered face and a sparse grey beard, wearing a straw rain cape.",
  "A plump young scholar with ink-stained fingers, round cheeks and a horsehair hat slightly askew.",
  "A stern middle-aged seamstress with sharp eyes, a tight hair bun and a measuring string around her neck.",
  "A broad-shouldered blacksmith with soot-smudged cheeks, a singed leather apron and cropped hair.",
  "A frail elderly herb-picker with deep smile lines, a bent back and a woven basket strapped to one shoulder.",
  "A restless young peddler with quick eyes, patched travel clothes and a bundle of trinkets at the chest.",
  "Carries a small caged songbird and glances at it while speaking.",
  "Constantly fidgets with a wooden prayer-bead bracelet.",
  "Keeps a long thin smoking pipe tucked behind one ear.",
  "Clutches a folded letter with a broken wax seal.",
  "Has a sleepy cat draped over one shoulder like a scarf.",
] as const;

export const APOTHECARY_AILMENTS = [
  // Authored roster in demos/apothecary/data/customers.json.
  {
    problem: "며칠째 잠이 오지 않아요.",
    hiddenCause:
      "과거에 낙방한 아우에게 부칠 편지를 석 달째 쓰지 못하고 있다.",
  },
  {
    problem: "기침이 좀처럼 멎지 않아요.",
    hiddenCause:
      "새벽마다 냉기 도는 광에서 삯바느질을 하느라 몸이 상했다.",
  },
  // Procedural pool in demos/apothecary/data/generation.json.
  {
    problem: "며칠째 잠이 오지 않아요.",
    hiddenCause:
      "노름빚 독촉장이 와서 눕기만 하면 심장이 뛴다. 빚 이야기는 절대 먼저 꺼내지 않는다.",
  },
  {
    problem: "속이 더부룩하고 얹힌 것 같아요.",
    hiddenCause:
      "잔칫집에서 상한 전을 먹었는데, 그 집과의 의리 때문에 잔치 이야기를 얼버무린다.",
  },
  {
    problem: "머리가 지끈지끈 아파요.",
    hiddenCause:
      "눈이 침침해진 것을 숨기고 있다. 나이 탓이라는 말을 듣기 싫어 밤새 등잔불 아래 일한 이야기를 돌려 말한다.",
  },
  {
    problem: "기침이 멎지 않아요.",
    hiddenCause:
      "한밤중에 강을 건너다 물에 빠졌다. 왜 그 시간에 강에 있었는지는 말하기 곤란해한다.",
  },
  {
    problem: "온몸이 가렵고 두드러기가 나요.",
    hiddenCause:
      "몸에 안 받는 걸 알면서도 좋아하는 갑각류를 몰래 먹었다. 식탐을 들키기 싫어 음식 질문을 피한다.",
  },
] as const;
