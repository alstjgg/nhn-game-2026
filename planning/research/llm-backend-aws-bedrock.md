# LLM 백엔드 단순화 및 AWS/Bedrock 배포 조사

**작성일:** 2026-07-25  
**담당:** 윤석  
**근거:** [2026-07-24 데모 중간 점검 회의록](./meeting-notes/2026-07-24-demo-mid-check.md)

## 1. 결론

Agent Arena 데모에는 상시 실행되는 Agent 서버가 필요하지 않다. 권장 구조는 다음과 같다.

```text
GitHub Pages 정적 프론트
        │ POST /v1/turn
        ▼
API Gateway HTTP API
        ▼
Lambda — 입력 검증, Prompt 조립, 3명 병렬 호출, 응답 검증
        ▼
Amazon Bedrock Runtime — Converse API
```

- **AWS 상시 EC2/Fargate 서버는 사용하지 않는다.** 고정 월 비용과 운영 대상만 늘어난다.
- **Bedrock Agents, AgentCore, 실제 MCP, Knowledge Base, RAG는 사용하지 않는다.**
- **세션 DB를 두지 않는다.** 프론트가 현재 턴의 압축된 게임 상태를 매번 보낸다.
- **게임 규칙과 판정은 프론트/게임 엔진에 둔다.** LLM은 닫힌 선택지 중 의도만 고른다.
- **MVP에서는 SSE를 사용하지 않는다.** 최종 JSON이 완성되어야 행동을 실행할 수 있으므로,
  토큰 스트림의 실익이 작다. 대기 시간은 이동·생각 중 연출로 가린다.
- Bedrock은 **서울 리전(`ap-northeast-2`)의 Lambda에서 Global inference profile**로 호출한다.
  게임 데이터에는 개인정보가 없으므로 처리 리전이 바뀌는 Global profile의 처리량 이점을 택한다.
- 모델은 코드에 고정하지 않고 환경 변수로 바꾼다. 1차 후보는
  **Claude Haiku 4.5**와 **Amazon Nova 2 Lite**다.

한 줄로 정리하면, **“Agent 백엔드”를 만들지 말고 “검증된 한 턴 결정을 반환하는 LLM
프록시”만 만든다.**

## 2. 현재 저장소 기준 판단

현재 저장소는 Vite + TypeScript 정적 프론트이며 GitHub Pages에 배포된다. 이 작업공간에는
Agent Arena 백엔드 구현이 없으므로 기존 서버를 리팩터링하는 것이 아니라, 아래의 최소 API
계약을 새로 정하는 것이 맞다.

GitHub Pages에서 Bedrock이나 외부 모델 API를 직접 호출하면 장기 자격 증명이 브라우저에
노출된다. 따라서 Lambda는 제거할 수 없는 최소 보안 경계다. 반대로 Lambda보다 두꺼운 Agent
서버는 현재 확정된 게임 규칙에 필요하지 않다.

## 3. 배포 방식 비교

| 방식 | 장점 | 문제 | 판정 |
|---|---|---|---|
| 브라우저 → Bedrock/모델 API 직접 호출 | 서버 코드 없음 | 정적 JS에 자격 증명 노출, 입력·비용 통제 불가 | 제외 |
| Lambda Function URL → Bedrock | 가장 적은 AWS 구성, URL 자체 추가 비용 없음 | `AuthType=NONE`이면 누구나 호출 가능하고 세밀한 제한 기능이 부족함 | 내부 스파이크만 |
| **API Gateway HTTP API → Lambda → Bedrock** | 무유휴 비용, CORS·라우팅·스로틀링, IAM으로 Bedrock 호출 | 최소한의 Lambda 코드와 배포 설정 필요 | **데모 권장** |
| EC2/Fargate Agent 서버 → 모델 API | 장시간 연결·복잡한 세션에 유리 | 고정 비용, 패치·프로세스 관리, 현재 기능에 과함 | 제외 |
| Lambda → 외부 Provider API | Bedrock에 없는 모델을 빠르게 사용 가능 | 별도 API 키 보관, Provider별 요청 형식과 과금 관리 | Bedrock 실패 시 대안 |

AWS 공식 문서도 단순 API에는 Function URL, API 관리·관찰·제한이 필요하면 API Gateway를
구분해 안내한다. Function URL을 `NONE` 인증으로 열면 모든 비인증 사용자가 호출할 수 있다.
공개 GitHub Pages 데모에는 API Gateway가 더 안전한 기본값이다.

## 4. 무엇을 백엔드에서 제거하고 무엇만 남길지

### 프론트/게임 엔진이 소유

- 맵, 전투 턴, 체력·스트레스·컨텍스트 게이지
- 장착 가능한 Prompt/Skill 카드 목록과 효과
- LLM이 고를 수 있는 `actionId`, `targetId` 후보
- 행동의 실제 수치 계산과 실행
- 적/NPC의 결정론 행동
- LLM 실패 시 기본 행동
- 화면 연출과 게임 로그

### Lambda가 소유

- 요청 크기, ID, 허용 카드·행동 후보 검증
- 카드 ID를 서버가 보유한 정식 Prompt 조각으로 변환
- 현재 상태를 짧은 Prompt로 조립
- 파티원 3명의 Bedrock 호출을 `Promise.all`로 병렬 실행
- 결과 스키마 및 `actionId`/`targetId` 허용 여부 검증
- 제한 시간 초과·모델 오류를 표준 실패 응답으로 변환
- 모델 ID, 지연, 입출력 토큰 수, 폴백 여부만 로그

### 넣지 않는 것

- 실제 MCP 서버와 Tool 실행
- Agent 세션·Memory·Context compaction 서버
- 대화 전문 저장용 DB
- Bedrock Agents/AgentCore/Flows/Knowledge Bases
- 서버 측 게임 규칙·전투 판정
- 범용 Provider 플러그인 프레임워크
- MVP의 SSE/WebSocket

Provider 교체 가능성은 아래 한 개 인터페이스면 충분하다.

```ts
interface DecisionProvider {
  decide(input: DecisionInput): Promise<AgentDecision>;
}
```

처음에는 `BedrockDecisionProvider` 하나만 구현하고, 실제 필요가 생겼을 때만 외부 Provider
구현을 추가한다.

## 5. 최소 API 계약

프론트는 자유 Prompt가 아니라 서버가 아는 ID와 닫힌 선택지만 보낸다.

```json
{
  "version": 1,
  "runId": "run-8f31",
  "turn": 4,
  "encounterId": "battle-slime-01",
  "state": {
    "partyHp": [8, 4, 10],
    "enemyHp": [6],
    "statusIds": ["ally-2:poison"]
  },
  "agents": [
    {
      "agentId": "guardian",
      "promptCardIds": ["cowardly", "protect-weak"],
      "skillIds": ["guard"]
    }
  ],
  "choices": [
    {"actionId": "attack", "targetIds": ["enemy-1"]},
    {"actionId": "guard", "targetIds": ["ally-1", "ally-2", "ally-3"]}
  ]
}
```

정상 응답은 게임 엔진이 바로 검증·실행할 수 있는 작은 객체다.

```json
{
  "decisions": [
    {
      "agentId": "guardian",
      "actionId": "guard",
      "targetId": "ally-2",
      "reasonCardId": "protect-weak",
      "quote": "내 뒤로 와. 이번 공격은 내가 막는다."
    }
  ],
  "meta": {
    "model": "claude-haiku-4.5",
    "latencyMs": 2380,
    "fallback": false
  }
}
```

핵심 제약은 다음과 같다.

1. `actionId`와 `targetId`는 요청에 포함된 후보 중 하나여야 한다.
2. `reasonCardId`는 해당 Agent가 실제 장착한 카드여야 한다.
3. `quote`는 화면용 한 문장으로 제한한다.
4. 서버는 잘못된 결과를 고치려고 두세 번 재호출하지 않는다. 한 번 검증에 실패하면 결정론
   폴백으로 넘겨 지연 상한을 지킨다.

## 6. Bedrock 사용 방식

### API

**Bedrock Runtime의 `Converse` API**를 사용한다. 모델마다 다른 원시 요청 형식을 직접 다루지
않고 동일한 메시지 인터페이스로 교체할 수 있다. 실제 Tool 실행이 없으므로 Agent API는 필요 없다.

MVP는 일반 `Converse` 한 번으로 완료한다. 나중에 토큰이 생성되는 장면 자체가 필요하다고
검증된 경우에만 `ConverseStream`과 Lambda 응답 스트리밍을 추가한다.

### 리전과 모델 ID

Lambda와 API Gateway는 `ap-northeast-2`에 둔다. 두 후보 모두 서울에서 Global profile 호출이
지원된다.

| 후보 | Global inference profile ID | 특징 |
|---|---|---|
| Claude Haiku 4.5 | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | 빠른 경량 모델, Structured Outputs 지원 |
| Amazon Nova 2 Lite | `global.amazon.nova-2-lite-v1:0` | 입력/출력이 더 저렴하고 빠른 일상 작업용 모델, Structured Outputs 미지원 |

초기 기본값은 **Claude Haiku 4.5**로 둔다. 이유는 `reasonCardId`, `actionId`, `targetId`를
엄격한 JSON 스키마로 받는 편이 백엔드 단순화에 직접 도움이 되기 때문이다. Nova 2 Lite는 같은
Converse 계약으로 벤치마크하고, 일반 Tool 호출 또는 JSON 검증만으로 충분히 안정적이면 비용
우위 때문에 교체한다.

### 추론 설정

- extended thinking/reasoning: 끔
- `maxTokens`: 120~200
- 온도: 0.2부터 측정 후 조정
- 시스템 Prompt: 게임 규칙이 아니라 역할, 장착 카드, 선택 규칙만 포함
- 응답: 가능한 경우 JSON Schema Structured Outputs
- 긴 대화 이력: 보내지 않음

Structured Outputs는 새 스키마의 최초 문법 컴파일에 수분이 걸릴 수 있고, 컴파일 결과가
24시간 캐시된다. **심사 시작 1시간 이내에 실제와 완전히 동일한 스키마로 워밍업 호출**을
해야 한다. 스키마를 요청마다 동적으로 만들지 말고, 선택 가능한 ID는 문자열 필드로 받은 뒤
Lambda에서 검증한다.

Prompt caching은 Haiku 4.5 기준 최소 캐시 구간이 4,096토큰이다. 이 게임의 Prompt는 그보다
짧게 유지하는 것이 우선이므로 MVP에서는 사용하지 않는다.

## 7. 지연 목표와 실패 처리

회의에서 “10초도 길다”는 의견이 있었으므로 아래 수치를 구현 기준으로 제안한다.

| 지표 | 목표 |
|---|---|
| p50 전체 응답 | 3초 이하 |
| p95 전체 응답 | 6초 이하 |
| Lambda 내부 모델 제한 시간 | 7초 |
| 플레이어가 보는 최대 대기 | 8초 |
| 8초 초과 | 즉시 결정론 폴백 |

한 턴에 파티원 3명을 순차 호출하지 않고 Lambda 안에서 병렬 호출한다. 벽시계는 약 3회 호출의
합이 아니라 가장 느린 1회에 가까워진다.

LLM을 호출할 필요가 없는 부분도 분리한다.

- 고정 적과 NPC 행동: 미리 저작하거나 정적 데이터로 캐시
- 이동 중 잡담: 미리 생성된 문장 풀에서 선택
- 승패와 피해량: 게임 엔진의 결정론 계산
- LLM 응답 대기: 걷기, 생각 말풍선, 타깃 스캔 연출

## 8. 예상 비용

2026-07-25 공개 요금 기준:

- Claude Haiku 4.5: 입력 $1 / 1M tokens, 출력 $5 / 1M tokens
- Amazon Nova 2 Lite: 입력 $0.30 / 1M tokens, 출력 $2.50 / 1M tokens
- Lambda 무료 사용량: 월 100만 요청, 400,000 GB-seconds

계획용 상한을 다음처럼 가정한다.

- 모델 1회: 입력 1,500 tokens + 출력 100 tokens
- 한 턴: 파티원 3회 병렬 호출
- 한 런: 판단 턴 6회 = 모델 호출 18회

| 항목 | Claude Haiku 4.5 | Nova 2 Lite |
|---|---:|---:|
| 모델 1회 | $0.0020 | $0.00070 |
| 한 런 18회 | $0.0360 | $0.0126 |
| 100런 | $3.60 | $1.26 |

100런을 512MB Lambda, 턴당 평균 4초로 계산하면 Lambda는 600회·1,200 GB-seconds다. 무료
사용량 밖이라고 가정해도 계산 비용은 약 $0.02 수준이다. API Gateway 600회도 무시 가능한
규모다. 실제 비용의 대부분은 서버가 아니라 Bedrock 토큰이다.

따라서 회의 중 언급된 “월 약 18,000원의 AWS 서버”는 필요하지 않다. 이 구조는 유휴 시
Lambda/API 비용이 없고, 사용한 모델 토큰만 주로 과금된다. 단, CloudWatch 로그 보관량과
데이터 전송에는 소액이 추가될 수 있다.

비용 식은 코드와 대시보드에도 그대로 남긴다.

```text
callCost =
  inputTokens  / 1,000,000 × inputPrice
  + outputTokens / 1,000,000 × outputPrice
```

## 9. 공개 데모의 보안·비용 안전장치

정적 사이트는 누구나 코드를 볼 수 있으므로 브라우저에 AWS 자격 증명, Bedrock API key,
Provider key를 넣지 않는다. CORS와 `Origin` 검사는 브라우저 오용을 줄일 뿐 인증 수단은 아니다.

최소 안전장치는 다음과 같다.

1. Lambda IAM Role에 `bedrock:InvokeModel`만 허용하고, Resource에는 선택한 inference
   profile과 그 profile이 라우팅할 수 있는 각 리전의 foundation model ARN을 함께 명시한다.
   `aws:InferenceProfileArn` 조건으로 해당 profile을 거친 호출만 허용한다.
2. 요청 본문 크기, Agent 수, 카드 수, 선택지 수, 출력 토큰을 서버에서 제한한다.
3. API Gateway route/stage throttling과 Lambda reserved concurrency를 낮게 설정한다.
4. AWS Budget/CloudWatch 알람을 설정한다.
5. 심사 기간 전후에는 API stage를 비활성화하거나 Lambda reserved concurrency를 0으로 둔다.
6. 프롬프트·응답 전문 대신 모델, 토큰, 지연, 오류 코드, 폴백 여부만 로그한다.
7. 완전한 일일 하드 캡이 필요할 때만 DynamoDB 원자 카운터를 추가한다. 이것은 세션 DB가
   아니라 비용 차단용 단일 카운터다.

API Gateway usage plan의 quota/throttling은 AWS 문서상 best-effort라 비용의 절대 상한으로
볼 수 없다. 공개 기간이 길다면 7번 또는 로그인/CAPTCHA 같은 별도 진입 제어가 필요하다.

## 10. 모델 선택 벤치마크

모델은 문서만 보고 확정하지 않고, 실제 Agent Arena 입력으로 고른다.

### 테스트 세트

- 전투, 퍼즐, 분기 이벤트 각 10개: 총 30개 상황
- 성격 카드가 행동을 바꿔야 하는 대비쌍 포함
- 모델별 각 상황 3회: 후보당 90회
- Prompt와 `maxTokens`는 동일하게 유지

### 기록할 값

- p50/p95 응답 시간
- 유효 JSON/Tool 호출 비율
- 허용된 행동·대상만 선택한 비율
- 장착된 `reasonCardId`를 인용한 비율
- 상황 대비쌍에서 행동이 실제로 달라진 비율
- 평균 입출력 토큰과 100런 예상 비용
- 타임아웃·폴백 비율

### 통과 기준

- p95 6초 이하
- 최종 유효 응답률 99% 이상
- 잘못된 행동/대상 실행 0건
- 장착하지 않은 카드 인용 0건
- 폴백 2% 미만

Haiku 4.5와 Nova 2 Lite가 모두 통과하면 더 저렴한 Nova 2 Lite를 선택한다. Nova가 스키마
오류·재시도 때문에 지연과 코드 복잡도를 늘리면 Haiku 4.5를 유지한다.

## 11. 구현 순서

### 0. 결정

- [ ] `POST /v1/turn` 요청·응답 스키마 확정
- [ ] 허용 행동과 `reasonCardId` 규칙 확정
- [ ] 지연 목표와 폴백 행동을 게임 담당과 합의

### 1. Bedrock 스파이크

- [ ] AWS 계정의 Bedrock 모델 접근 확인
- [ ] Anthropic 사용 시 최초 이용 양식 제출
- [ ] 서울 리전에서 두 Global inference profile 호출 확인
- [ ] 동일 30개 테스트로 Haiku 4.5/Nova 2 Lite 벤치마크
- [ ] 모델 1개 선택

### 2. 얇은 Lambda

- [ ] `DecisionProvider`와 Bedrock 구현
- [ ] 3명 병렬 호출
- [ ] 요청·응답 검증
- [ ] 7초 타임아웃과 폴백 응답
- [ ] 토큰·지연·오류 메타데이터 로그

### 3. AWS 배포

- [ ] `infra/`에 AWS SAM 템플릿 추가
- [ ] API Gateway HTTP API와 Lambda 생성
- [ ] 최소 권한 IAM, CORS, throttling 설정
- [ ] `MODEL_ID`, `MAX_TOKENS`, `MODEL_TIMEOUT_MS`, `ALLOWED_ORIGIN` 환경 변수화
- [ ] Application inference profile/tag로 프로젝트 비용 분리
- [ ] Budget/CloudWatch 알람 설정

### 4. 데모 검증

- [ ] GitHub Pages에서 실제 CORS 호출
- [ ] 100런 또는 목표 트래픽 부하 테스트
- [ ] p50/p95, 폴백률, 런당 비용 확인
- [ ] 동일 스키마 워밍업 호출 자동화
- [ ] 모델 장애 시 게임이 멈추지 않고 폴백하는지 확인
- [ ] 심사 종료 후 API 비활성화 절차 확인

## 12. 최종 결정 기록

| 질문 | 결정 |
|---|---|
| LLM 백엔드를 계속 둘 것인가? | 둔다. 단, 세션 없는 얇은 턴 결정 프록시로 축소한다. |
| 별도 Agent 서버가 필요한가? | 필요 없다. |
| AWS 상시 서버가 필요한가? | 필요 없다. API Gateway + Lambda를 사용한다. |
| Bedrock Agents/AgentCore가 필요한가? | 필요 없다. Bedrock Runtime만 사용한다. |
| 실제 MCP가 필요한가? | 필요 없다. 게임 규칙의 카드/열쇠 개념만 남긴다. |
| SSE가 필요한가? | MVP에는 필요 없다. 플레이 검증 후 선택적으로 추가한다. |
| 모델은 무엇인가? | Haiku 4.5를 초기값으로 두고 Nova 2 Lite와 벤치마크 후 확정한다. |
| 상태 저장이 필요한가? | MVP에는 없다. 프론트가 압축 상태를 매 요청에 포함한다. |
| 비용의 중심은 무엇인가? | 서버 월정액이 아니라 Bedrock 입출력 토큰이다. |

## 13. 공식 자료

- [Amazon Bedrock ConverseStream API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ConverseStream.html)
- [Bedrock API 호환성](https://docs.aws.amazon.com/bedrock/latest/userguide/models-api-compatibility.html)
- [Bedrock Structured Outputs](https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html)
- [Claude Haiku 4.5 모델 카드와 리전/ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-haiku-4-5.html)
- [Amazon Nova 2 Lite 모델 카드와 리전/ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html)
- [Amazon Bedrock 요금](https://aws.amazon.com/bedrock/pricing/)
- [Lambda HTTP 호출 방식 선택](https://docs.aws.amazon.com/lambda/latest/dg/apig-http-invoke-decision.html)
- [Lambda Function URL 접근 제어](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)
- [Lambda 응답 스트리밍](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html)
- [Lambda 요금](https://aws.amazon.com/lambda/pricing/)
- [API Gateway usage plan과 API key 주의사항](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)
- [Bedrock Application inference profile 비용 추적](https://docs.aws.amazon.com/bedrock/latest/userguide/cost-mgmt-application-inference-profiles.html)
- [Bedrock inference profile IAM 사전 조건](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-prereq.html)
- [Bedrock 호출 로그](https://docs.aws.amazon.com/bedrock/latest/userguide/model-invocation-logging.html)
- [Bedrock 모델 접근 절차](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
