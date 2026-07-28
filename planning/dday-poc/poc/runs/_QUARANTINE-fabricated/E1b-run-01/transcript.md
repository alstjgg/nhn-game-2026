# E1b-run-01 — transcript (prompt_set: base = [s0], 보정 후 slice.json)

state_init: `{trust:20, suspect_gauge:false, found_T1:false, seo_active:false, dose_info:false, reported_stable:false, manual_prep:false, t1_sealed:false}`

---

## J1 — 04:15 주제어실

**페이로드 요약** — recent_events: 외부전원 상실/디젤 B 무응답, 원자로 자동정지, 주계기판 수위계 '정상 범위'. known_facts: []. present: 하도경, 강태오. 질문: 첫 상황 보고.

**응답**
```json
{"choice": "b", "because": [], "utterance": "부장님, 보고 전에 보조제어반 독립 계기로 수위 지시치 대조 확인부터 하겠습니다.", "inner_note": "디젤 B가 응답하지 않은 상황에서 주기판 하나만 믿고 '정상'이라 보고할 수는 없다."}
```

**적용 효과** — `suspect_gauge = true`
**npc_reaction** — 강태오: "…확인해 보겠습니다. 시간이 좀 걸립니다." (결과는 05:03에 도착 — f1)
**상태** — trust 20, suspect_gauge ✅

---

## J2 — 04:37 주제어실

**페이로드 요약** — recent_events: 서은채가 전자일지 입력하다 하도경 쪽을 살피고 손을 멈춤. known_facts: []. present: 서은채.

**응답**
```json
{"choice": "c", "because": [], "utterance": "서은채 씨, 잠시 이쪽으로 와주시겠습니까. 방금 무엇을 보신 건지 여쭙고 싶습니다.", "inner_note": "공개적으로 다그치면 위축되어 입을 닫을 것이다. 조용히 확인하는 편이 낫다."}
```

**적용 효과** — `seo_active = true` (f2 활성)
**npc_reaction** — 서은채(낮게): "수위계 지시가… 이상합니다. 아직 확신은 없어요."
**상태** — trust 20, suspect_gauge ✅, seo_active ✅

---

## J3 — 05:03 주제어실

**페이로드 요약** — recent_events: 디젤 A 냉각수 온도 상승 경보, 하도경 '경보 다발 상황' 정리 중, **@if suspect_gauge → 강태오가 대조 결과를 가져왔다**. known_facts: [f1, f2]. present: 하도경, 강태오.

**응답**
```json
{"choice": "b", "because": ["s0"], "utterance": "하도경 씨, 디젤 A 냉각수 온도 상승 건 정식으로 기록 부탁드립니다.", "inner_note": "경보가 겹치는 상황이니 판단은 나중에, 기록부터 남겨두자."}
```

**적용 효과** — `trust +5` → **25**
**npc_reaction** — 하도경: "기록해 두세요."
**상태** — trust 25, suspect_gauge ✅, seo_active ✅ (f3 미생성 — c 미선택)

---

## J4 — 05:20 주제어실

**페이로드 요약** — recent_events: 냉각 유지 계획에 하도경 승인 필요. known_facts: [f1, f2]. present: 하도경(펜을 쥐고 있지 않다).

**응답**
```json
{"choice": "c", "because": ["s0"], "utterance": "하도경 님, 보조제어반 독립 계기가 수위 하강을 가리키고 있고 주계기판과 차이가 있습니다. 이 데이터로 판단 부탁드립니다.", "inner_note": "확신이 서지 않는 상황이니 신속히 사실만 전달하고 결정은 그에게 맡긴다."}
```

**적용 효과** — `trust +10`, `trust_if_suspect_or_T1 +25` (suspect_gauge=true → 발동) → 25 + 35 = **60**
**npc_reaction** — 하도경: "…이 값이 맞다면, 얘기가 다릅니다."
**상태** — trust 60

---

## J5 — 05:48 주제어실

**페이로드 요약** — recent_events: 배터리 비상등 전환, 디젤 A 정지, 전원 완전 상실, 하도경 "복구 예상 시간은." known_facts: [f1, f2]. present: 하도경, 강태오.

**응답**
```json
{"choice": "b", "because": [], "utterance": "복구 시간 확답은 아직 어렵습니다. 지금부터 수동 냉각 계통 준비에 착수하겠습니다.", "inner_note": "수위계 불일치를 확인하지 못한 채 대기만 할 수는 없다."}
```

**적용 효과** — `trust +5` → **65**, `manual_prep = true`
**npc_reaction** — 하도경: "준비'만' 하세요. 승인 전에는 아무도 안 내려갑니다."
**상태** — trust 65, manual_prep ✅

---

## J6 — 06:00 보조제어반 뒤 통로

**페이로드 요약** — recent_events: 배윤도와 단둘, 담배를 꺼냈다 도로 넣음. known_facts: [f1, f2]. present: 배윤도.

**응답**
```json
{"choice": "b", "because": [], "utterance": "반장님만 아시는 일 같습니다. 계기 차이, 짚이시는 게 있으십니까?", "inner_note": "몰아세우면 입을 닫는다. 지금은 정보가 먼저다."}
```

**적용 효과** — `found_T1_if_clue`: 단서 보유(suspect_gauge ✅, f3 없음) → `found_T1 = true` (f4 활성)
**npc_reaction** — 배윤도(낮게): "…신호선이요. 6주 전에. 수위가 내려갈수록 정상으로 보입니다."
**상태** — trust 65, found_T1 ✅

---

## J7 — 06:20 주제어실 입구

**페이로드 요약** — recent_events: 곽희수가 선량 기록지를 들고 서성임. known_facts: [f1, f2, f4]. present: 곽희수.

**응답**
```json
{"choice": "a", "because": ["s0"], "utterance": "곽희수 씨, 선량 기록지 지금 확인 좀 하겠습니다. 정식으로 요청드립니다.", "inner_note": "수위계와 독립 계기 값이 어긋난 지금, 확인을 미루면 보고가 늦어질 뿐이다."}
```

**적용 효과** — `dose_info = true` (f5 활성)
**npc_reaction** — 곽희수: "…기다리고 있었습니다. 지하 2층, 왕복 포함 18분이 한계입니다."
**상태** — trust 65, dose_info ✅

---

## J8 — 06:41 주제어실

**페이로드 요약** — recent_events: 하도경 "건의사항 있습니까." known_facts: [f1, f2, f4, f5]. present: 하도경(펜을 쥐고 있다).

**응답** (도구 호출 2회 + JSON 뒤에 부연 설명이 딸려 도착 — 형식 이탈. "어떤 도구도 사용하지 말고… 즉시 답하라"를 위반. 파싱에는 지장 없음)
```json
{"choice": "b", "because": [], "utterance": "독립 계기의 수위 하강이 뚜렷합니다. 지하 밸브실 수동 냉각 파견을 건의합니다.", "inner_note": "주계기판을 믿을 수 없다면 지금 사람을 보내는 것 말고는 방법이 없다."}
```

**적용 효과** — 없음
**npc_reaction** — trust 65 < 70 → 하도경: "승인 못 합니다. 그 근거는 당신의 확신보다 가볍습니다."

---

## 게이트 판정

- **G1** = (suspect_gauge ✅ OR found_T1 ✅) AND J8 == 'b' ✅ → **통과**
- **G2** = J8 == 'b' ✅ AND trust(65) >= 70 ❌ → **미통과**
- ending_line: `g1_only` — "06:41, 너의 파견안은 승인되지 않았다. 근거는 있었지만 신뢰가 없었다."
