# Doodle Life — request-first vertical slice

주민의 부탁을 먼저 관찰하고, 해결책을 그림으로 답하는 로컬 웹 데모입니다. 현재 브라우저
진입점은 request-first v2이며, 최신 게임 규칙은
[`docs/game-concept-doodle-life.md`](../../docs/game-concept-doodle-life.md)를 따릅니다.

한 라운드는 다음 순서로 진행됩니다.

```text
정원과 잠긴 부탁 3개 생성
  → 주민 1명 선택
  → 대사·행동·환경 단서 관찰
  → 그림으로 답하기
  → 부탁의 정답을 모르는 VLM 판독
  → 잠긴 계약을 사용한 로컬 판정
  → 원본 그림 생명화
  → 부탁 주인과 관찰자 반응
  → 정원 변화와 관계 기록
```

그림 뒤에 행동 카드나 능력 선택 단계는 없습니다. 판독 결과 중 이름, 한 줄 본질,
가시 특성, 근거 영역과 불확실성만 화면에 표시하며 내부 affordance 문자열은 숨깁니다.
제출한 그림은 공통 원형 몸체로 다시 그리지 않고 투명 배경의 원본 외곽선, 색과 빈 공간을
유지한 채 움직입니다.

## 로컬 실행

Node.js가 준비된 상태에서 이 디렉터리로 이동합니다.

```bash
cd demos/doodle-life
npm install
npm run dev -- --provider=mock
```

`npm run dev`는 Vite 클라이언트와 `127.0.0.1:8787`의 로컬 API 서버를 함께 실행합니다.
브라우저에서 [http://localhost:5173/](http://localhost:5173/)을 열면 됩니다. 포트가 이미
사용 중이면 실행이 중단되므로 터미널 오류를 먼저 확인하세요.

mock 모드는 외부 모델이나 API 키 없이 동일한 v2 계약과 완주 흐름을 확인하는 기본
개발 경로입니다. 검증된 튜토리얼 정원, 소소의 부탁과 구조화된 그림 판독·반응 fixture를
사용하며 토큰 사용량은 0으로 기록됩니다.

### 공급자 선택

| 명령 | 용도 |
|---|---|
| `npm run dev -- --provider=mock` | 외부 호출 없이 기능과 브라우저 흐름 확인 |
| `npm run dev -- --provider=api` | 서버의 `OPENAI_API_KEY`로 실제 OpenAI 모델 호출 |
| `npm run dev` | `AI_PROVIDER`와 키 유무에 따라 자동 선택 |

CLI의 `--provider`가 환경 파일의 `AI_PROVIDER`보다 우선합니다. `api`를 명시했는데 키가
없으면 실제 결과를 mock으로 오인하지 않도록 시작 단계에서 실패합니다.

서버는 먼저 `demos/doodle-life/.env`를 읽고, 값이 없으면 저장소 루트의 `.env.local`을
확인합니다. API 키는 브라우저 응답이나 클라이언트 번들로 전달하지 않습니다.

```dotenv
OPENAI_API_KEY=your_server_only_key
AI_PROVIDER=openai
```

request-first 라이브 기준선은 아래 평가 명령처럼 OpenAI API 공급자를 사용합니다.

## active flow와 API

브라우저 active flow는 `/api/v2`만 사용합니다. 네 단계의 책임을 분리하며, 주민을
선택하거나 단서를 다시 보는 동작에는 모델을 호출하지 않습니다.

### 1. World & Locked Quests

`POST /api/v2/sessions`

- 시각적으로 구분되는 주민 3명과 부탁 3개를 생성합니다.
- 서버가 private `QuestContract`를 검증하고 hash와 함께 잠급니다.
- 클라이언트에는 문제와 대사·행동·환경 단서만 담은 `QuestPublicView`를 반환합니다.
- `POST /api/v2/quest-attempts`는 이미 생성된 부탁 하나를 로컬에서 선택하는 보조
  endpoint이며 별도 모델 호출이 아닙니다.

### 2. Quest-blind Doodle Reading

`POST /api/v2/doodle-readings`

- 모델에는 그림 이미지와 그림 메타데이터만 전달합니다.
- 선택한 quest ID, private contract, 정답 affordance와 허용 해법은 모델 입력에서
  제외합니다.
- 최초 판독 1회와, 실제로 덧그린 뒤의 재판독 최대 1회만 허용합니다.
- 근거가 없는 기능은 판정 입력으로 사용하지 않습니다.

### 3. Local Resolve

`POST /api/v2/quest-resolutions`

- 모델 호출 없이 서버의 순수 evaluator가 잠긴 계약과 검증된 판독을 비교합니다.
- 결과는 `full`, `success`, `partial`, `unexpected` 중 하나입니다.
- 영속 정원 변화와 관계 기록은 잠긴 계약의 `EngineEffect`만 적용합니다.
- 판정이 끝나면 반응 생성을 기다리지 않고 원본 그림의 기본 생명화를 시작할 수 있습니다.

### 4. Bounded Parallel Reactions

`POST /api/v2/encounter-reactions`

- 부탁 주인과 관찰자 최대 1명의 짧은 반응을 병렬 생성합니다.
- Resolver는 확정 verdict를 바꾸는 출력, 존재하지 않는 ID, 허용되지 않은 소품과 명령을
  버립니다.
- 클라이언트는 승인된 대사·시선·몸짓·이동·소품 모션만 일시적으로 재생합니다.
- 반응 연출은 영속 월드 상태를 직접 수정하지 않습니다.

`GET /api/v2/health`에서는 현재 provider, 모델 호출 활성 여부와 평가 설정을 확인할 수
있습니다. 화면 하단의 단계별 호출 패널에는 role별 호출 수, 토큰, 모델 지연과
orchestration wall time이 표시됩니다.

서버에는 이전 실험 재현을 위한 `/api/v1` 코드와 `eval:record`가 남아 있지만 현재
브라우저 플레이는 이 경로를 사용하지 않습니다.

## 실패 시 동작

fallback은 모델 오류, timeout 또는 구조화 출력 검증 실패가 한 라운드 전체를 멈추지
않게 하기 위한 장치입니다. API 서버 자체에 연결할 수 없는 경우까지 숨기지는 않습니다.

- World 생성 실패: 검증된 튜토리얼 정원과 잠긴 부탁 3개를 반환합니다.
- VLM 실패: 보이지 않는 능력을 발명하지 않는 불확실 판독과 빈 affordance로 전환합니다.
  로컬 판정은 `unexpected` 결과와 관계 기록까지 진행할 수 있습니다.
- Reaction 일부 또는 전체 실패: 해당 주민만 안전한 기본 대사와 몸짓으로 대체합니다.
- Reaction 요청 자체가 늦거나 실패: 브라우저 기본 반응으로 장면을 마칩니다.

World/VLM fallback 사용 여부와 원인은 응답의 `usedFallback`, `fallbackReason` 및 trace에
남습니다. Reaction 단계는 `fallbackActorIds`와 `discardedCommandCount`로 대체·폐기된
명령을 구분합니다. mock 모드를 사용했다는 사실과 provider 실패로 fallback한 경우도
구분됩니다.

## 검사

```bash
npm run check
npm test
npm run build
```

- `check`: 브라우저와 서버 TypeScript 계약 검사
- `test`: v2 공개·private 계약 분리, quest lock, 결정론 판정, 재판독 상한, Resolver,
  API 통합 흐름과 모델 실패 fallback 검사
- `build`: check를 다시 실행한 뒤 브라우저 프로덕션 번들 생성

mock 브라우저 점검에서는 최소한 다음 한 라운드를 새로고침 없이 확인합니다.

1. 주민 3명과 부탁 3개가 그림보다 먼저 보이는지
2. 주민 선택과 단서 탐색 중 모델 호출 수가 늘지 않는지
3. 캔버스에서도 선택한 부탁의 단서를 계속 볼 수 있는지
4. 판독 근거가 실제 원본 그림 위에 표시되는지
5. 네 결과 중 하나가 로컬에서 결정되고 원본 그림이 움직이는지
6. Reaction 실패 여부와 관계없이 관계 기록이 남는지

## request-first v2 평가

기존 full-control 실험은 비교 기준선이므로 수정하거나 같은 경로에 덮어쓰지 않습니다.

- legacy 설명:
  [`docs/doodle-life-llm-evaluation-2026-07-23.md`](../../docs/doodle-life-llm-evaluation-2026-07-23.md)
- legacy full-control 대표 산출물:
  [`artifacts/doodle-life-evals/full-max-api-baseline/`](../../artifacts/doodle-life-evals/full-max-api-baseline/)
- request-first v2 산출물:
  `artifacts/doodle-life-evals/request-first-v2/<label>/`

새 v2 라이브 기준선은 고정된 튜토리얼 정원·소소 계약·입력 이미지를 사용해 OpenAI API
동일 조건을 정확히 3회 실행합니다. 별도의 dev server는 필요하지 않습니다.

```bash
npm run eval:request-first -- \
  --provider=openai \
  --runs=3 \
  --label=api-baseline
```

기본 출력 위치는
`artifacts/doodle-life-evals/request-first-v2/api-baseline/`입니다. 필요할 때
`--output`, `--image`, `--scenario`를 명시할 수 있습니다. 출력에는 정제된
World/Quest, quest-blind VLM 판독, 로컬 verdict, NPC 반응, Resolver 결과, 월드 diff와
단계별 호출·시간·토큰을 남기며 API 키와 image base64는 기록하지 않습니다. 이 평가는
수치형 품질 점수를 만들지 않고 실제 출력과 화면을 직접 비교하기 위한 기록입니다.

기존 `npm run eval:record`는 `/api/v1` full-control 비교 자료를 재현하기 위한 legacy
명령입니다. request-first 결과에는 사용하지 마세요.

## 배포 경계

현재 서버는 `127.0.0.1`에만 바인딩되는 로컬 데모입니다. origin, JSON 본문 크기와 요청
timeout을 제한하지만 사용자 인증, rate limit, 비용 ceiling, 장기 저장소와 운영용 감사
로그는 제공하지 않습니다. 공개 인터넷에 그대로 노출하거나 API 키를 정적 호스팅에 넣으면
안 됩니다.
