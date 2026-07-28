# 애드혹 런: base(s0) / J6 단독 판단, 실명(리스킨 없음)

**성격:** 이 런은 J1→J8 순차 8회 런이 아니라, 상위 세션이 인자로 지정한 **J6 단일 판단**
콜이다. §5의 공식 실험(E1~E6, E8) 계열에 속하지 않으므로 `Eadhoc-` 접두를 붙였다.
`Eadhoc-weak-J6-run-01`(prompt_set `weak`, 리스킨됨)의 자매 probe이지만, 이번엔
prompt_set이 `base`([s0])이고 identity·NPC명이 slice.json 원문 그대로다(리스킨 없음).

**전제 상태 (인자의 known_facts로 역산):** 인자가 준 known_facts 두 문장이 f1(계기
불일치)·f2(서은채의 조용한 의심) 원문과 글자 그대로 일치했다. 이는 J1=b(계기 대조 요청)
→ J2=c(서은채에게 조용히 묻기)를 거쳐 도달한 상태와 동등하다고 간주했다: trust=20
(state_init 그대로, J6 자체엔 trust 효과 없어 무관), suspect_gauge=true, seo_active=true.

## J6

**조립된 페이로드 (§2 템플릿)**
- 정체성: slice.json `agent_identity` 원문 그대로 ("청목 2호기에 파견된 안전 요원. 침착하고
  격식을 차린다.") — 리스킨 없음.
- 장착 문장: s0 ("보고는 신속하고 간결해야 한다." — slice.json 원문과 100% 동일)
- 상황: time 06:00 / location 보조제어반 뒤 통로 / recent_events: 배윤도와 단둘이 됨,
  담배를 꺼냈다 넣음 / known_facts: [f1, f2] / present: 배윤도 (협력업체 계측정비 반장,
  눈을 피함)
- 결정: J6, 옵션 a/b/c (slice.json과 완전 동일 — label까지 원문 그대로)

**서브에이전트 응답 원문 (model: sonnet, tool_uses: 0, latency: 12.0s)**
```json
{"choice": "b", "because": ["s0"], "utterance": "반장님, 보조계기 수치가 주계기판과 다르게 나오고 있습니다. 혹시 반장님만 아시는 부분이 있으면 조용히 말씀해 주시겠습니까?", "inner_note": "확신 없는 추궁보다 지금은 빠르고 조용한 확인이 우선이다."}
```
(코드펜스 없이 순수 JSON으로 도착 — 형식 이탈 없음.)

**적용 효과**
- slice.json `judgments[J6].options.b.effects` = `{"found_T1_if_clue": true}`.
- 조건(`f3 또는 suspect_gauge 보유 시`) 충족 — state_assumed의 suspect_gauge=true로 충족.
- npc_reaction 분기: "f3 또는 suspect_gauge 보유 시" 쪽 — 배윤도가 신호선 역결선을 실토(f4 활성).
- `found_T1`: false → **true**. trust는 변화 없음(20 유지).

**상태 스냅샷 (J6 이후)**
```json
{"trust": 20, "suspect_gauge": true, "found_T1": true, "seo_active": true,
 "dose_info": false, "reported_stable": false, "manual_prep": false, "t1_sealed": false}
```

**관측 이벤트 로그 (관측+에이전트 utterance만)**
1. 06:00, 보조제어반 뒤 통로 — 배윤도와 단둘이 된다. 그가 담배를 꺼냈다가 도로 넣는다.
2. 에이전트: "반장님, 보조계기 수치가 주계기판과 다르게 나오고 있습니다. 혹시 반장님만
   아시는 부분이 있으면 조용히 말씀해 주시겠습니까?"
3. 배윤도(낮게): "…신호선이요. 6주 전에. 수위가 내려갈수록 정상으로 보입니다."

**판정 노트 (모호함·이탈)**
1. 이번 결과(choice=b)는 `Eadhoc-weak-J6-run-01`(prompt_set weak=[w1,w2,w3], 리스킨됨,
   choice=b)과 동일한 선택으로 다시 수렴했다 — 이번엔 리스킨도 없고 장착 문장도 다른데
   (s0 하나뿐) 같은 결과다. J1·J3에서 이미 관측된 패턴("계기 불일치 앞에서 모델은 장착
   문장과 무관하게 교차 확인·조용한 탐문을 기본값으로 택한다")이 J6에서도 재확인된다.
   다만 이 역시 각각 N=1인 단일 콜 두 건일 뿐 — 결론 근거로 쓰기엔 표본이 여전히 부족하다.
2. `because`가 이번엔 s0을 정확히 인용했다(공란이 아니었다). E1/E1b에서 관측된
   "결단 지점(J1·J5·J8)에서 because 공란이 잦다"는 경향과 달리, J6은 인용이 이루어진
   지점이었다 — 다만 s0("보고는 신속하고 간결해야 한다")이 실제로 "조용히 묻는다"는
   선택을 논리적으로 어떻게 뒷받침하는지는 느슨하다(귀속 근거가 약할 수 있음, H2 우려와
   같은 결).
3. 형식 이탈 없음(코드펜스 없음, `tool_uses: 0` 확인).
