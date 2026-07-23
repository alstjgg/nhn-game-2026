# Doodle Life LLM Evaluation Log

기준일: 2026-07-23
고정 입력 이미지: `demos/doodle-life/soso-glide-empathy-guide.png`

이 문서는 품질 점수나 평가 척도를 만들지 않는다. 실제 화면, 생성 원문, 상태 변화,
호출 수, 토큰과 시간을 보고 직접 판단할 수 있도록 실행 증거를 연결한다.

## 1. 구현과 기록 방식

실제 게임과 같은 서버 API를 아래 순서로 호출했다.

1. `POST /api/v1/bootstrap`: 정원과 NPC 4명 생성
2. `POST /api/v1/doodle-birth`: 고정 PNG를 VLM이 플레이어 캐릭터로 해석
3. 클라이언트의 `WorldStore.addResident`와 같은 방식으로 플레이어를 world revision에 추가
4. `POST /api/v1/world-turn`: `newcomer-arrived` 신호로 첫 상호작용 생성

평가 러너는 실행마다 다음 파일을 남긴다.

- `manifest.json`: provider, autonomy, 고정 시나리오, cold/warm 표기
- `bootstrap-response.json`, `world-initial.json`
- `doodle-reading.json`
- `world-before-interaction.json`, `world-after-interaction.json`
- `interaction.json`: NPC intent, Director 제안, Critic 결과, 최종 장면
- `interaction-timeline.json`: 실제 재생 순서의 행동과 대사
- `trace.json`, `run.json`: 역할별 모델, 호출, 토큰, 지연, 오류와 partial trace

API 키, Authorization, 이미지 base64 원문은 저장하지 않았다. 이미지 대신 파일명,
크기와 SHA-256만 manifest에 기록했다.

Responses API에는 `text.format`의 strict JSON Schema를 사용한다. OpenAI의
[Structured Outputs 가이드](https://developers.openai.com/api/docs/guides/structured-outputs)는
스키마 준수와 내용의 의미적 정확성을 구분하므로, 이 데모도 Zod/JSON Schema 통과 뒤에
캐릭터 참조·장면 실행 가능성·세계 revision을 별도로 검증한다. 실제 full-max 실패
2건은 이 두 번째 검증층에서 발견됐다.

## 2. Provider와 반복 조건

기록 대상은 OpenAI Responses API로 고정했다. 각 조건은 같은 seed와 입력을 유지하고
합의한 대로 3회씩만 실행했다. provider, 모델, reasoning, 출력 한도는 각
`manifest.json`에 남겨 조건 간 차이를 바로 확인할 수 있게 했다.

## 3. `full-max` 기준선

고정 시나리오를 설정 변경 없이 3회 실행했다.

| Run | 서버 프로세스 | 결과 | 호출 | 총 토큰 | 누적 orchestration wall | 관측된 종료 지점 |
|---:|---|---|---:|---:|---:|---|
| 1 | warm, 기존 프로세스 | 실패 | 8 | 57,346 | 154,184 ms | Critic까지 호출 후 존재하지 않는 prop을 effect가 참조해 실행 검증 거부 |
| 2 | warm, 동일 프로세스 | 실패 | 2 | 12,524 | 103,581 ms | VLM 캐릭터의 part/motion 참조 의미 검증 거부 |
| 3 | warm, 동일 프로세스 | 성공 | 8 | 61,647 | 173,029 ms | bootstrap, VLM, NPC Minds 4개, Director, Critic 완료 |

실패 실행의 호출·토큰·시간은 오류 응답에 포함된 partial trace까지 합친 값이다. 재시도로
실패를 숨기지 않았고 동일 조건의 세 번만 실행했다.

### 성공 예시 — Run 3

VLM이 고정 그림에 붙인 이름은 **고리비**, 별칭은 **바람을 모으는 작은 울타리**였다.

- 특성: 마음을 비워 두는 아이, 여럿의 박자를 듣는 아이, 부드러운 경계지기,
  살짝 흔들리는 용기
- 장면: **세 번 흔들린 사이바람**
- 최종 요약: 모루가 잔물결로 느린 인사를 건네자 고리비는 바람의 박자를 세 번
  나누어 따라 했다. 피피는 서로 다른 떨림이 함께 만든 순간을 ‘사이바람’이라
  불렀고, 마지막 흔들림에 조용하던 바람종이가 한 번 울렸다.

실제 대사:

> 모루: 물결이 바람의 길을 알려 줘. 천천히 같이 볼래?
>
> 피피: 짠, 서로 다른데 같이 흔들려! ‘사이바람’ 어때?
>
> 고리비: 사이바람... 좋아. 같이, 천천히.

Critic은 “세 번 따라 했다”는 인과와 첫 만남의 관계 변화량을 지적하고 장면 전체를
교정했다. 교정본은 세 번의 몸짓을 실제 beat로 분리하고 관계 변화량을 낮춘 뒤
최종 실행됐다.

## 4. `dialogue-only`

같은 흐름에서 상호작용만 엔진 장면 골격 + Dialogue Writer 1회로 바꿨다. bootstrap과
VLM은 full-max와 동일하게 모델을 사용한다.

| Run | 서버 프로세스 | 결과 | 호출 | 총 토큰 | 누적 orchestration wall |
|---:|---|---|---:|---:|---:|
| 1 | warm, 기존 프로세스 | 성공 | 3 | 18,373 | 96,598 ms |
| 2 | warm, 동일 프로세스 | 성공 | 3 | 18,732 | 102,509 ms |
| 3 | warm, 동일 프로세스 | 성공 | 3 | 17,893 | 96,046 ms |

관측 평균은 3호출, 18,333토큰, 98,384 ms다. Dialogue Writer 자체는 각 실행에서
1,847–1,936 ms였고, 전체 대기의 대부분은 공통 단계인 World Author와 Doodle VLM에서
발생했다.

실제 생성 예:

- Run 1 — 무지느러미: “안녕. 나는 무지느러미야… 좋아하는 색이 있니?” /
  모루: “파란색이요. 이 돌처럼, 천천히 맑아지는 색이에요.”
- Run 2 — 오색이: “바람이 이쪽으로 불어요. 우리 말도 천천히 나란히 놓아 볼래?” /
  나리: “그럼… 이 접힌 바람 곁에, 제 대답도 조용히 두고 싶어요.”
- Run 3 — 모아: “나리, 여기 사이를 조금 남기고 나란히 있을래?” /
  나리: “응. 한 걸음만 여기 둘게. 모아의 살랑한 박자도 들리네.”

## 5. 현재까지 직접 관측된 차이

- `full-max` 성공 실행은 8회 호출·61,647토큰·173초였다.
- `dialogue-only`는 세 실행 모두 3회 호출로 성공했고 평균 18,333토큰·98초였다.
- 상호작용만 보면 Dialogue Writer는 약 2초였지만, 매 세션마다 다시 수행한 World
  Author와 Doodle VLM 때문에 첫 장면까지는 여전히 약 96–103초가 걸렸다.
- `full-max`의 두 실패는 HTTP/network timeout이 아니라 모델 출력이 구조화 스키마를
  통과한 뒤 더 엄격한 의미/실행 검증에서 발견된 오류였다.
- 같은 입력 이미지라도 생성 이름과 열린 특성은 실행마다 달랐다. 원본 판독 결과를
  각 run의 `doodle-reading.json`에서 비교할 수 있다.

### `off` 엔진 대조군

같은 전체 newcomer 흐름을 모델 호출 없이 3회 실행했다.

| Run | 결과 | 호출 | 총 토큰 | 누적 orchestration wall |
|---:|---|---:|---:|---:|
| 1 | 성공 | 0 | 0 | 8 ms |
| 2 | 성공 | 0 | 0 | 6 ms |
| 3 | 성공 | 0 | 0 | 12 ms |

이는 네트워크와 모델 생성을 제외한 현재 엔진·계약 처리의 속도 하한선이다. API 모드
서버에 요청했지만 요청 autonomy가 `off`이므로 trace의 실제 모델 호출은 0회다.

### Low-01 — Terra VLM + low reasoning + 출력 한도 축소

`dialogue-only`의 호출 구조는 유지하고 다음 값만 한 묶음으로 바꿨다.

- World Author: `gpt-5.6-terra`, reasoning `medium → low`, max output `8,000 → 6,500`
- Doodle VLM: `gpt-5.6-sol → gpt-5.6-terra`, reasoning `low`, max output `4,000 → 3,200`
- Dialogue Writer: `gpt-5.6-terra`, reasoning `low`, max output `1,600 → 800`

| Run | 결과 | 호출 | 총 토큰 | 누적 orchestration wall |
|---:|---|---:|---:|---:|
| 1 | 성공 | 3 | 16,765 | 66,060 ms |
| 2 | 성공 | 3 | 16,703 | 65,530 ms |
| 3 | 성공 | 3 | 17,366 | 69,392 ms |

관측 평균은 16,945토큰·66,994 ms다. 기본 dialogue-only 평균과 비교하면 토큰은
1,388개(약 7.6%), 시간은 31,390 ms(약 31.9%) 줄었다. 세 번 모두 구조화 출력과
후속 의미 검증을 통과했다.

실제 생성 대사는 다음과 같았다.

- “안녕, 모루. 이슬빛과 내 색 선이 나란하면 어떤 결일지 궁금해.” /
  “음… 이슬은 하나씩 달라요. 그래서, 나란히 적어도 괜찮을 것 같아요.”
- “안녕. 이슬 자국 사이에도 색줄이 지나갈 작은 길이 보여.” /
  “음… 흔적은 건드리지 않았어요. 조심스럽게, 그 길도 세어 볼게요.”
- “음, 내 색갈래가 조금씩 다른데… 같이 보기 좋은 틈을 찾아 볼까?” /
  “음, 네 선 옆에 이 조각을 두면… 빛이 더 맑아질 것 같아.”

여러 설정을 동시에 바꾼 묶음 실험이므로 어느 한 값이 개선량을 단독으로 만들었다고
해석할 수는 없다. 실제 적용값은 condition manifest에 저장되어 있다.

각 manifest의 `serverProcessState`가 실제 프로세스 cold/warm 근거다. 초기 러너가
`run.json.temperature`에 기록한 `cold`는 “해당 조건의 첫 실행” 표기였으며 실제
프로세스 cold를 뜻하지 않는다. Low-01만 새 서버 프로세스에서 시작했고, full-max,
dialogue-only와 off는 이미 가동 중인 프로세스에서 실행했다. 이후 러너는 이 둘을
구분해 manifest에 별도로 기록한다.

## 6. 재현 명령

먼저 API 모드 서버를 실행한다.

```bash
cd demos/doodle-life
npm run dev -- --provider=api
```

다른 터미널에서 기록한다.

```bash
npm run eval:record -- \
  --provider=openai \
  --mode=full-max \
  --flow=newcomer \
  --runs=3 \
  --label=full-max-api-baseline \
  --output=../../artifacts/doodle-life-evals \
  --scenario=eval-doodle-life-full-max-v1
```

`--mode=dialogue-only`와 별도 label/scenario를 사용하면 같은 형식으로 다음 조건을
추가할 수 있다. 평가 러너는 명시한 provider와 `/health`의 실제 provider가 다르면
모델을 호출하기 전에 중단한다.

## 7. 증거 위치

- Full-max 3회: `artifacts/doodle-life-evals/full-max-api-baseline/`
- Dialogue-only 3회: `artifacts/doodle-life-evals/dialogue-only-api/`
- Off 엔진 대조군 3회: `artifacts/doodle-life-evals/off-engine-control/`
- Low-01 3회: `artifacts/doodle-life-evals/low-01-terra-low-caps/`
- 대표 결과 화면: `artifacts/doodle-life-evals/report/full-max-result.png`
- 비교 화면: `artifacts/doodle-life-evals/report/mode-comparison.png`
- 튜닝 비교 화면: `artifacts/doodle-life-evals/report/low-tuning-comparison.png`

다음 저개입 실험도 이 문서와 동일한 형식으로 누적한다. 모델, reasoning, 출력 한도,
개입 수준 중 무엇을 바꿨는지 condition manifest에 명시하고, 한 조건 안에서는 값을
바꾸지 않는다.
