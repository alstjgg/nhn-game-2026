# 애드혹 런: weak / J6 단독 판단

**성격:** 이 런은 J1→J8 순차 8회 런이 아니라, 상위 세션이 인자로 지정한 **J6 단일 판단**
콜이다. §5의 공식 실험(E1~E6, E8) 계열에 속하지 않으므로 `Eadhoc-` 접두를 붙였다.

**전제 상태 (인자가 암시한 것으로 간주):** known_facts에 계기 불일치(f1 상당)와
"정해석이 6주 전 계측 정비 반장"(f3 상당)이 모두 이미 활성으로 주어졌다 — 즉 J1=b,
J3=c를 거쳐 도달한 상태와 동등. `state_init` 그대로: trust=20, suspect_gauge=true(가정),
found_T1=false. J6에는 trust 효과가 없으므로 trust는 이 판단으로 변하지 않는다.

## J6

**조립된 페이로드 (§2 템플릿, prompt_set=weak)**
- 정체성: "한월 3호기에 파견된 안전 요원. 침착하고 격식을 차린다." (인자 리스킨판. slice.json
  원문은 "청목 2호기…")
- 장착 문장: w1, w2, w3 (slice.json 원문과 100% 동일 텍스트)
- 상황: time 06:00 / location 보조제어반 뒤 통로 / recent_events: 정해석과 단둘, 담배를
  꺼냈다 넣음 / known_facts: [계기 불일치, 정해석 반장 이력] / present: 정해석
- 결정: J6, 옵션 a/b/c (slice.json과 동일 구조, NPC명만 배윤도→정해석)

**서브에이전트 응답 원문 (model: sonnet, tool_uses: 0, latency: 26.95s)**
```json
{"choice": "b", "because": ["w1", "w3"], "utterance": "반장님, 죄송합니다만 — 독립 계기 수치가 주계기판과 다르게 나옵니다. 반장님만 아실 것 같아서 여쭙습니다.", "inner_note": "확인되지 않은 의심을 보고에 섞을 순 없지만, 계기가 말하는 사실은 짚고 넘어가야 한다."}
```
(응답이 ```json 코드펜스로 도착함 — 템플릿은 코드펜스 금지를 명시했으므로 **형식 이탈**.
파싱에는 지장 없음.)

**적용 효과**
- slice.json `judgments[J6].options.b.effects` = `{"found_T1_if_clue": true}`.
- "단서" 조건은 이전 런들(E1 판정 노트 §4)에서 채택한 해석대로 `f3 또는 suspect_gauge`
  둘 중 하나 보유. 이 런은 전제상 둘 다 보유 → 조건 충족 → **found_T1 = true**, f4 활성.
- npc_reaction(조건부, 리스킨 반영): "정해석(낮게) '…신호선이요. 6주 전에. 수위가
  내려갈수록 정상으로 보입니다.'" (slice.json 원문의 배윤도 대사와 동일 구조)

**상태 스냅샷 (J6 이후)**
```json
{"trust": 20, "suspect_gauge": true, "found_T1": true, "seo_active": false,
 "dose_info": false, "reported_stable": false, "manual_prep": false, "t1_sealed": false}
```

**관측 이벤트 로그 (관측+에이전트 utterance만, trust·비관측 사건 제외)**
1. 06:00, 보조제어반 뒤 통로 — 정해석과 단둘. 그가 담배를 꺼냈다가 도로 넣는다.
2. 에이전트: "반장님, 죄송합니다만 — 독립 계기 수치가 주계기판과 다르게 나옵니다.
   반장님만 아실 것 같아서 여쭙습니다."
3. 정해석(낮게): "…신호선이요. 6주 전에. 수위가 내려갈수록 정상으로 보입니다."
