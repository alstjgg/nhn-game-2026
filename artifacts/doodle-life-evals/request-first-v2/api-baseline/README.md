# Request-first v2 · OpenAI API baseline

고정된 tutorial garden, 잠긴 `quest_soso_last_note`, 동일한 실제 브라우저 그림으로
OpenAI API를 정확히 3회 실행한 기록이다. 품질 점수는 포함하지 않는다.

| Run | VLM name | Verdict | Critical path | Tokens | Fallback |
|---|---|---:|---:|---:|---:|
| 01 | 잔물결 매듭 | `full` | 27.657s | 5,678 | 없음 |
| 02 | 살랑마루 | `partial` | 23.860s | 5,415 | 없음 |
| 03 | 마름날개 | `success` | 25.659s | 5,597 | 없음 |

- 평균 critical path: 25.725s
- 평균 VLM wall time: 20.541s
- 평균 병렬 reaction wall time: 5.175s
- 평균 토큰: 5,563
- 모델 호출: 회차당 3회
- 계약 hash: 세 회차 모두 그림 전후 동일
- quest-blind 금지 키, image base64, API key 저장: 없음

![실제 API 3회 결과 요약](./api-result-overview.jpg)

상세 설명과 화면은
[`docs/doodle-life-request-first-evaluation-2026-07-24.md`](../../../../docs/doodle-life-request-first-evaluation-2026-07-24.md),
실험 조건은 [`manifest.json`](./manifest.json), 원시 집계는
[`summary.json`](./summary.json)을 본다. 화면의 HTML 원본은
[`report.html`](./report.html)이다.

World & Locked Quests는 세 회차의 조건을 같게 유지하기 위해 검증된 fixture로
고정했으므로 이 기록에는 신규 정원의 라이브 생성 시간이 포함되지 않는다.
