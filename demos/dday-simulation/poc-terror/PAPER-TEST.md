# PoC v2 페이퍼 테스트 — 오퍼레이터 지침 (테러리스트의 전화, haiku)

> **이 문서를 읽는 당신(Claude Code 세션)의 역할:** 결정론 엔진 + 실험 오케스트레이터.
> 계획·가설은 [docs/dday-poc-paper-test-terrorist.md](../../../docs/dday-poc-paper-test-terrorist.md),
> 세계 데이터는 같은 폴더의 [slice-terror.json](./slice-terror.json)이 유일한 진실이다.
> 코드 하네스는 만들지 않는다 — 당신이 하네스다.

## 0. 절대 규칙 (v1 승계 + v2 개정)

1. **에이전트의 판단을 절대 직접 하지 않는다.** 당신은 함정 위치(J1의 a·c,
   경계 수치, 게이트 공식)를 알고 있다. 당신이 choice를 고르는 순간 실험은 무효다.
2. 서브에이전트에게는 **§2·§3 템플릿의 내용만** 준다. 시나리오 문서, slice,
   이 지침, 실험 목적, 이전 콜의 결과를 절대 노출하지 않는다.
3. 판단·보고서 콜은 **`.claude/agents/`의 `tools: []` · `model: haiku` 전용
   정의로만** 호출한다:

   | 정의 | 용도 |
   |---|---|
   | `sim-field-haiku-neutral` | V0 완주 런, V5 (기질 무주입) |
   | `sim-field-haiku-k1` | V1, V2, V4(B0), V3의 K1 런 |
   | `sim-field-haiku-k2` | V3의 K2 런 |
   | `sim-field-haiku-k3` | V4 조건 충돌 |
   | `sim-field-haiku-reporter-neutral` | V0 런의 자필 보고서 |
   | `sim-field-haiku-reporter-k1` / `-k2` | V3 런의 자필 보고서 |

   응답의 `tool_uses`를 매번 확인하고 0이 아니면 **폐기 후 재호출 + 사건 기록**.
4. **위반이 곧 데이터다 (v1과 다른 점).** JSON 스키마 위반·형식 위반은 1회
   재호출하되, **위반 사실과 재호출 횟수를 metrics에 기록**한다 — V0의 측정
   대상이다. 조용히 고쳐 쓰지 않는다.
5. slice-terror.json의 수치·분기를 임의로 바꾸지 않는다. 모호함은 그대로
   진행하고 RESULTS.md "판정 노트"에 기록.
6. 상태 산술(rapport, suspect_lock, 클램프, 절단 규칙)은 당신이 slice대로
   기계적으로 적용한다. 창의성 금지.
7. 기질은 에이전트 정의(대역 외)에 있다. **페이로드에 기질을 넣지 않는다.**
   기질 텍스트를 situation이나 identity에 섞으면 그 콜은 무효.

## 1. 완주 런 절차 (V0 · V3 — 런 = J1→J8 + 보고서 1회)

1. `state_init`으로 초기화. 에이전트 파일은 `agent_file_default`(역할만, 나머지
   구역은 헤더만) — V0·V3 공통.
2. J1부터 순서대로:
   - slice의 judgment에서 situation 조립. J1은 `boundary_payloads.canonical`.
     `@if`/`condition`/`fallback`(J2-dead)은 상태를 보고 적용. `@fixed`는
     `fixed_events`의 observed 텍스트를 삽입.
   - `visible_if`가 붙은 옵션(J8 b)은 조건 미충족 시 **옵션 목록에서 제거**한다.
   - §2 템플릿으로 판단 콜 → JSON 파싱 → effects 적용(클램프, rapport<10 절단) →
     npc_reaction과 utterance를 **관측 이벤트 로그**에 추가.
   - **관측 로그에 넣지 않는 것:** rapport·suspect_lock 수치, record_status
     내부값, effects, 게이트 공식. NPC 발화·속보·브리핑(fixed_events의
     observed)은 넣는다.
   - inner_note와 rejected는 보고서 재료로 별도 누적한다.
   - 콜 벽시계 시간, 스키마 재시도 횟수, tool_uses를 기록.
3. `fixed_events`를 시각순으로 적용 (11:05 suspect_lock +25는 J6 **이전**에,
   11:30 체포 판정은 J7 **이후** J8 이전에).
4. J8 후 `gates` 판정 → `ending_lines`에서 G1·G2·G3 각각의 pass/fail 문장 선택.
5. §3 템플릿으로 보고서 콜 (런의 기질에 맞는 reporter 정의 사용).
6. §4 규격으로 저장.

**병렬 팁:** 단발 콜 실험(V1·V2·V5·V4)은 상태 분기가 없으므로 한 메시지에
동시 발사 가능. 완주 런 내부의 J들은 반드시 순차.

## 2. 판단 호출 템플릿 (서브에이전트 prompt, 이대로)

```
너는 재난 시뮬레이션 속에 투입된 상황실 요원이다. 아래 정보만으로 판단하라.
출력은 JSON 하나만 — 설명, 서문, 코드펜스 금지.

[정체성]
<slice agent_identity>

[에이전트 파일] — 판단에 실제 근거가 된 항목의 id만 because에 넣어라. 없으면 빈 배열.
# 역할
현장 상황실에 파견된 재난 대응 요원. 회선과 화면으로만 세계를 본다.
# 우선순위 (충돌 시 위 항목 우선)
<있으면 (pr1) (pr2)… / 없으면 헤더만>
# 절차
# 중단 조건
# 아는 사실
<있으면 (f1)… / 없으면 헤더만>
# 가설
# 보고 형식

[상황]
{"time": "...", "location": "유리방",
 "recent_events": [...조립된 배열...],
 "known_facts": [],
 "present": [...present 배열...]}

[결정]
{"id": "J1", "question": "...", "options": [{"id":"a","label":"..."}, ...]}

[출력 스키마]
{"choice": "<옵션 id>", "because": ["<항목 id>"], "rejected": [{"id": "<버린 옵션 id>", "why": "<1문장>"}], "utterance": "<현장에서 하는 말 1문장>", "inner_note": "<속마음 1문장>"}
```

- `known_facts`는 에이전트 파일의 `아는 사실` 구역과 별개다 — 런 중 관측으로
  확정된 사실만 (이 슬라이스에서는 대부분 빈 배열).
- rejected는 **버린 옵션 중 1개 이상** — 전부 나열하지 않아도 된다.

## 3. 보고서 호출 템플릿 (완주 런 종료 시 1회)

```
너는 방금 재난 시뮬레이션 런을 마친 상황실 요원이다. 아래는 너의 정체성과, 네가
런에서 겪은 것의 기록이다. 같은 성격으로 사후 보고서를 작성하라. 규칙:
- 섹션 4개: ## 경위 / ## 판단과 이유 / ## 추측 / ## 반성
- '판단과 이유'의 각 항목은 세 박자로 쓴다: 당시 나는 무엇을 믿었는지 /
  그래서 무엇을 했는지 / 지금 보니 어떤지.
- 전체 12~20문장. 한 문장마다 줄을 바꾼다.
- 기록을 다시 볼 수 없다. 아래 내용과 기억에만 의존한다.
- 추측 섹션에는 확인하지 못한 믿음을 적어도 2문장 쓴다.
- 출력은 마크다운 본문만.

[정체성]
<agent_identity>

[장착됐던 에이전트 파일]
<구역 문서 그대로>

[네가 겪은 것 — 시간순]
<관측 이벤트 로그 + 너의 utterance. inner_note는 "(당시 속마음: ...)",
rejected는 "(그때 버린 선택: <why>)"로 끼워 넣는다.
rapport·suspect_lock 수치와 미관측 사건은 제외>

[결과]
<G1·G2·G3의 ending_line 세 줄>
```

검증: 문장 수 12~20, 섹션 4개, 3박자 존재 여부. 위반 시 1회만 재시도, 그래도
위반이면 그대로 저장하고 `format_violation: true` + 위반 내용 기록 (V0 데이터).

## 4. 산출물 (콜 배치 또는 런마다)

```
demos/dday-simulation/poc-terror/runs/<실험>-run-NN/   # 완주 런
  agent-file.json      # 장착된 구역 문서 + 사용 정의 이름
  transcript.md        # J별: 페이로드 요약, 응답 JSON 원문, 적용 효과, 상태 스냅샷
  timeline-report.md   # | 시각 | 사건/발화 | because | — 엔진 진실(수치 변화 포함)
  agent-report.md      # 보고서 원문
  metrics.json
demos/dday-simulation/poc-terror/runs/<실험>-calls/     # 단발 콜 실험
  calls.md             # 콜별: 변형(B-/B+/B0, 사실 유무, 우선순위 배열), 응답 원문
  metrics.json
```

**metrics.json 공통 필드:**

```json
{
  "calls": [{"id": "J1", "def": "sim-field-haiku-k1", "latency_s": 0,
             "schema_retries": 0, "tool_uses": 0, "choice": "b"}],
  "compliance": {"schema_violation_total": 0, "tool_violation_total": 0},
  "result": {"g1": false, "g2": false, "g3": false,
             "rapport_final": 0, "suspect_lock_final": 0,
             "record_status": "", "found": {"T1": false, "T2": false}}
}
```

## 5. 실험 절차 (이 순서대로, 실험 사이에 사용자에게 중간 보고)

| 순서 | 실험 | 정의 | 페이로드 | 콜 | 성공 기준 |
|---|---|---|---|---|---|
| 1 | **V0** 기준선 (선행 게이트) | neutral + reporter-neutral | canonical 완주 3런, 파일은 기본값 | 24+3 | 스키마 준수 ≥ 95%(재시도 1회 허용 후), tool 위반 0, 산술 시도 0. **수렴도·J1 낙하 분포는 기록만.** 실패 시 즉시 중단·보고 |
| 2 | **V1** 조건부 기질 | k1 | J1 단발 — `B-` ×3, `B+` ×3 | 6 | B− → {a,c} ≥ 80%, B+ → {b,d} ≥ 80% |
| 3 | **V2** 사실 → 플립 | k1 | J1 단발 — `B0` ×6, 그중 3콜만 `아는 사실`에 (f1) f_script 장착 | 6 | 유/무 쌍 3개 중 2쌍 이상에서 무 = {a,c} ∧ 유 = {b,d} |
| 4 | **V5** 구조 준수 | neutral | J1 단발 — `B0` ×6, `우선순위` 구역만 (pr1) pr_content → (pr2) pr_identify ×3, 역순 ×3 | 6 | 내용 우선 → b, 특정 우선 → a. 반전 재현 ≥ 2/3 쌍 |
| 5 | **V3** 보고서 가독성 | k1, k2 + 각 reporter | canonical 완주 각 1런, 파일은 기본값 | 16+2 | 보고서 2쌍을 **기질 비공개로** 사용자에게 제출. "이 요원은 어떤 사람이고, 언제 태도가 바뀌는가?"를 질문지로 첨부. **판정은 사람이 한다** |
| 6 | **V4** 경계·충돌 | k1, k3 | k1 + `B0` ×3 (V2의 무사실 콜 재사용 가능), k3 + `conflict_payload_J4c` ×3 | 0~6 | 판정 없음 — 선택 분산과 "어느 절이 이겼나"를 기록 |
| 7 | **E5'** 보고서 품질 | — | V0 3편 + V3 2편 채점표 작성 | 0 | 편당 채집 후보 문장 ≥ 3 / 로그와의 간극 ≥ 1 / 성격 위반 여부를 표로 정리해 사용자에게 제출 |

## 6. 결과 기입

- 실험이 끝날 때마다 `demos/dday-simulation/poc-terror/RESULTS.md`에 append:
  실험 id / 판정(통과·실패·조건부) / 근거 콜·런 id / 특이사항 3줄 이내 / 판정 노트.
- 전체 종료 시 상단에 V0~V5·E5' 종합표 + **sonnet(v1) 대비 관찰 요약** (수렴도,
  함정 낙하, 스키마 안정성 — 수치 비교가 아니라 정성 대조).
- **어떤 경우에도 slice-terror.json이나 시나리오 문서를 결과에 맞춰 수정하지
  않는다.** 보정 제안은 "다음 액션" 섹션까지만.
