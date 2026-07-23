# Agent Arena API 통합 사용 가이드

이 문서는 게임 백엔드가 Agent Arena API를 호출하는 전체 흐름을 설명한다.
정확한 요청·응답 스키마의 기준은
[`openapi.yaml`](../services/agent-arena-api/openapi.yaml)이며, 서버 실행과
환경변수 설정은
[`services/agent-arena-api/README.md`](../services/agent-arena-api/README.md)를
참조한다.

## 1. 사용 경계

Agent Arena API는 브라우저에 직접 공개할 API가 아니라 서버 간 내부
API로 설계되어 있다.

- 브라우저는 모델 alias와 허용된 카드 ID만 선택한다.
- OpenAI/Claude API key, 실제 모델명, MCP URL·token, provider Skill ID는
  Agent Arena 서버에만 존재한다.
- 현재 인증은 고정 `Bearer` key 방식이다. 이 key를 GitHub Pages나
  JavaScript 번들에 넣으면 안 된다.
- 공개 게임에서는 Game API/BFF가 사용자를 인증하고, Agent Arena API를
  내부 key로 대신 호출해야 한다.

로컬 예제에서만 다음 값을 사용한다.

```bash
export ARENA_API_BASE=http://127.0.0.1:8790
export ARENA_API_TOKEN=dev-local-key
```

프로덕션에서는 실제 key를 셸 기록, 프런트엔드 환경변수, 로그 또는
GitHub Pages artifact에 남기지 않는다.

## 2. 전체 호출 순서

```text
GET  /v1/capabilities
POST /v1/runs
PUT  /v1/runs/{runId}/agents/{agentId}/loadout   선택
POST /v1/runs/{runId}/turns
GET  /v1/turns/{turnId}/events                   SSE
GET  /v1/turns/{turnId}                          최종 결과
POST /v1/runs/{runId}/agents/{agentId}/compact   선택
POST /v1/runs/{runId}/agents/{agentId}/clear     선택
```

`GET /v1/turns/{turnId}`가 항상 최종 권위 데이터다. SSE는 진행 상황을
표시하고 재연결하기 위한 sanitized telemetry다.

## 3. 공통 헤더

`/healthz`와 `/readyz`를 제외한 모든 API에 인증이 필요하다.

```http
Authorization: Bearer <server-owned-token>
Content-Type: application/json
```

다음 변경 요청에는 길이 8~200자의 `Idempotency-Key`도 필요하다.

- run 생성
- turn 생성
- compact
- clear

```http
Idempotency-Key: run-20260724-0001
```

같은 key와 같은 요청을 재전송하면 최초 결과가 replay된다. 같은 key를
다른 요청에 사용하면 `409 idempotency_conflict`가 반환된다.

## 4. 서버 상태 확인

인증 없이 프로세스 생존과 준비 상태를 확인할 수 있다.

```bash
curl "$ARENA_API_BASE/healthz"
curl "$ARENA_API_BASE/readyz"
```

```json
{"status":"ok"}
```

```json
{"status":"ready"}
```

## 5. 사용 가능한 모델과 카드 조회

run을 만들기 전에 공개 alias와 설정 상태를 조회한다.

```bash
curl \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  "$ARENA_API_BASE/v1/capabilities"
```

응답에서 확인할 값은 다음과 같다.

- `modelProfiles[].id`: 클라이언트가 보낼 모델 alias
- `modelProfiles[].implemented`: adapter가 구현되어 있는지
- `modelProfiles[].configured`: 현재 서버에서 실제 호출 가능한지
- `modelProfiles[].liveVerified`: 운영자가 기록한 live 검증 근거
- `modelProfiles[].supports`: streaming, MCP, Skill, compact 지원 상태
- `registry.promptCards`: Prompt 카드
- `registry.skillCards`: function 또는 hosted Skill 카드
- `registry.mcpCards`: read-only MCP 카드
- `registry.harnesses`: token, tool call, timeout 제한

실제 provider 모델명과 provider resource ID는 응답에 포함되지 않는다.
run에는 `implemented: true`이면서 `configured: true`인 profile만 사용한다.
`liveVerified`는 운영 증거이지 개별 요청 성공을 보장하는 값은 아니다.

현재 기본 alias는 다음과 같다.

| Alias | Provider | 용도 |
|---|---|---|
| `mock-arena` | mock | API key 없는 로컬·CI 테스트 |
| `openai-arena` | OpenAI | 실제 OpenAI Responses 호출 |
| `claude-arena` | Anthropic | 실제 Claude Messages 호출 |

일반 turn은 `starter-4000`, hosted MCP/Skill을 사용하는 run은
`agentic-4000` harness가 적합하다.

## 6. run과 세 개의 agent session 생성

한 run에는 서로 다른 ID를 가진 정확히 세 agent가 필요하다. 모델
profile과 harness는 run
생성 시 고정되며, 모델을 바꾸려면 새 run을 만들어야 한다.

각 agent의 `promptCardIds`, `skillCardIds`, `mcpCardIds`는 비어 있더라도
세 배열을 모두 보내야 한다.

```bash
curl -X POST \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  -H "Idempotency-Key: run-demo-0001" \
  -H "Content-Type: application/json" \
  "$ARENA_API_BASE/v1/runs" \
  -d '{
    "modelProfileId": "mock-arena",
    "harnessId": "starter-4000",
    "party": [
      {
        "agentId": "guardian",
        "promptCardIds": ["protect-weakest-v1"],
        "skillCardIds": [],
        "mcpCardIds": []
      },
      {
        "agentId": "solver",
        "promptCardIds": ["answer-briefly-v1"],
        "skillCardIds": ["risk-check-v1"],
        "mcpCardIds": []
      },
      {
        "agentId": "scout",
        "promptCardIds": ["avoid-high-risk-v1"],
        "skillCardIds": [],
        "mcpCardIds": []
      }
    ]
  }'
```

응답:

```json
{
  "runId": "run_...",
  "modelProfileId": "mock-arena",
  "cardsVersion": "2026-07-23.1",
  "replayed": false,
  "agents": [
    {
      "agentId": "guardian",
      "arenaSessionId": "as_...",
      "generation": 1
    },
    {
      "agentId": "solver",
      "arenaSessionId": "as_...",
      "generation": 1
    },
    {
      "agentId": "scout",
      "arenaSessionId": "as_...",
      "generation": 1
    }
  ]
}
```

`runId`, 각 `agentId`, `arenaSessionId`, `generation`을 게임 서버의
세션 레코드에 저장한다.

## 7. turn 요청

게임 엔진이 현재 공개 상태와 실행 가능한 closed action을 전달한다.
모델은 이 목록에 없는 action을 확정할 수 없으며, 실제 상태 변경은
게임 엔진이 수행한다.

각 `actionId`는 중복되면 안 되고, target이 없는 action도
`"targetIds": []`를 반드시 포함한다.

```bash
curl -X POST \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  -H "Idempotency-Key: turn-demo-0001" \
  -H "Content-Type: application/json" \
  "$ARENA_API_BASE/v1/runs/RUN_ID/turns" \
  -d '{
    "stageId": "combat-01",
    "turnNumber": 1,
    "event": {
      "type": "combat",
      "summary": "The enemy prepares an area attack.",
      "publicState": {
        "enemyId": "enemy-1",
        "guardianHp": 42,
        "solverHp": 20,
        "scoutHp": 35
      }
    },
    "allowedActions": [
      {
        "actionId": "attack",
        "targetIds": ["enemy-1"]
      },
      {
        "actionId": "defend",
        "targetIds": ["guardian", "solver", "scout"]
      },
      {
        "actionId": "wait",
        "targetIds": []
      }
    ]
  }'
```

서버는 provider 호출 완료를 기다리지 않고 `202`를 반환한다.

```json
{
  "turnId": "turn_...",
  "status": "queued",
  "replayed": false,
  "eventsUrl": "/v1/turns/turn_.../events"
}
```

`eventsUrl`은 상대 경로이므로 `ARENA_API_BASE` 또는 내부 service origin과
결합해서 사용한다.

한 run에서는 동시에 하나의 turn만 실행할 수 있다. 이전 turn이 끝나기
전에 새 turn, loadout 변경, compact 또는 clear를 요청하면 `409`가
발생할 수 있다.

## 8. SSE로 진행 상황 받기

터미널에서는 다음과 같이 확인할 수 있다.

```bash
curl -N \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  "$ARENA_API_BASE/v1/turns/TURN_ID/events"
```

SSE block은 다음 형태다.

```text
id: 7
event: agent.tool.completed
data: {"turnId":"turn_...","sequence":7,"type":"agent.tool.completed","createdAt":"...","data":{"agentId":"solver"}}
```

주요 event:

- `turn.queued`
- `turn.started`
- `agent.started`
- `agent.context.warning`
- `agent.output.delta`
- `agent.tool.started`
- `agent.tool.completed`
- `agent.tool.failed`
- `agent.usage.final`
- `agent.decision.accepted`
- `agent.fallback`
- `agent.completed`
- `turn.completed`
- `turn.failed`

`turn.completed` 또는 `turn.failed`가 전달되면 서버가 stream을 닫는다.
모델의 원문 hidden reasoning이나 provider credential은 stream에 포함되지
않는다. `agent.output.delta`도 원문 대신 문자 수만 전달된다. 장시간 새
event가 없으면 15초 간격의 SSE comment heartbeat가 올 수 있다.

### 브라우저에서 Bearer SSE 읽기

기본 `EventSource`는 임의의 `Authorization` header를 설정할 수 없다.
현재 내부 Bearer API를 직접 테스트할 때는 `fetch()` streaming을 사용한다.

```ts
type ArenaSseEvent = {
  turnId: string;
  sequence: number;
  type: string;
  createdAt: string;
  data: Record<string, unknown>;
};

export async function streamArenaTurn(
  apiBase: string,
  eventsUrl: string,
  token: string,
  after: number,
  onEvent: (event: ArenaSseEvent) => void,
): Promise<number> {
  const response = await fetch(
    `${apiBase}${eventsUrl}?after=${after}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
    },
  );
  if (!response.ok || response.body === null) {
    throw new Error(`SSE failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastSequence = after;

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const dataLine = block
        .split("\n")
        .find((line) => line.startsWith("data: "));
      if (dataLine !== undefined) {
        const event = JSON.parse(dataLine.slice(6)) as ArenaSseEvent;
        lastSequence = event.sequence;
        onEvent(event);
      }
      boundary = buffer.indexOf("\n\n");
    }

    if (done) {
      return lastSequence;
    }
  }
}
```

연결이 끊기면 마지막 `sequence`를 `Last-Event-ID` header 또는
`?after=<sequence>`로 전달한다. 두 값이 모두 있으면 header가 우선한다.
서버는 해당 sequence 이후의 persisted event부터 replay한다.

공개 GitHub Pages 게임에서는 브라우저가 이 내부 token을 가져서는 안
된다. Game API/BFF가 SSE를 proxy하거나 HttpOnly cookie 기반 공개
session stream을 제공해야 한다.

## 9. 최종 turn 결과 조회

SSE 사용 여부와 무관하게 최종 결과는 다음 API로 확인한다.

```bash
curl \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  "$ARENA_API_BASE/v1/turns/TURN_ID"
```

상태는 `queued`, `running`, `completed`, `failed` 중 하나다. 완료 응답에는
party 순서대로 세 agent 결과가 들어간다.

```jsonc
{
  "turnId": "turn_...",
  "runId": "run_...",
  "status": "completed",
  "results": [
    {
      "agentId": "solver",
      "arenaSessionId": "as_...",
      "decision": {
        "actionId": "defend",
        "targetId": "solver",
        "speech": "I will defend.",
        "reasonSummary": "Lower-risk legal action.",
        "attributedCardIds": ["risk-check-v1"]
      },
      "usage": {
        "inputTokens": 412,
        "cachedInputTokens": 0,
        "outputTokens": 54,
        "reasoningTokens": null,
        "totalTokens": 466,
        "source": "provider_measured"
      },
      "context": {
        "estimatedActiveTokens": 620,
        "budgetTokens": 4000,
        "gauge": 0.155,
        "measurement": "estimated_after_output",
        "compactedThisTurn": false
      },
      "toolTrace": [
        {
          "type": "function",
          "name": "arena_risk_check",
          "status": "completed",
          "durationMs": 3
        }
      ],
      "latencyMs": 850,
      "fallbackUsed": false,
      "traceId": "trace_..."
    }
    // guardian과 scout 결과가 같은 형식으로 이어진다.
  ],
  "createdAt": "...",
  "startedAt": "...",
  "completedAt": "..."
}
```

확인 기준:

- `decision`: 게임 엔진이 다시 검증한 뒤 적용할 의도
- `usage.source`: provider 측정값인지 mock 값인지
- `context.gauge`: 현재 추정 context 점유율
- `toolTrace`: function, MCP, Skill의 실제 실행 여부
- `fallbackUsed`: provider 실패나 검증 실패로 deterministic fallback이
  사용됐는지

`context`는 정확한 provider context window가 아니라 서버 추정치다.
실시간 token 사용량은 `usage`의 provider 측정값을 사용한다.
top-level `status`가 `completed`여도 agent별 `fallbackUsed`는 `true`일 수
있으므로 반드시 개별 결과를 확인한다.

## 10. MCP와 Skill loadout 적용

MCP와 Skill은 provider resource ID나 URL이 아닌 registry card ID로
선택한다.

현재 예시 카드:

| Card ID | 종류 | 의미 |
|---|---|---|
| `risk-check-v1` | function Skill | 서버가 직접 실행하는 risk tool |
| `arena-tactics-v1` | hosted Skill | provider에 고정 버전으로 등록된 Skill |
| `calculator-mcp-v1` | read-only MCP | allowlist의 `calculate` tool |

먼저 `/v1/capabilities`에서 다음을 확인한다.

- hosted Skill의 현재 provider가 `configuredProviders.<provider>: true`
- MCP 카드가 `configured: true`
- 선택 모델이 `skills: true`, `remoteMcp: true`

run 생성 때 바로 넣거나, idle 상태에서 agent 한 명의 loadout을 바꿀 수
있다.

loadout 본문에는 `agentId`를 넣지 않는다. route의 `{agentId}`가 대상을
결정한다.

```bash
curl -X PUT \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$ARENA_API_BASE/v1/runs/RUN_ID/agents/solver/loadout" \
  -d '{
    "promptCardIds": ["answer-briefly-v1"],
    "skillCardIds": ["arena-tactics-v1"],
    "mcpCardIds": ["calculator-mcp-v1"]
  }'
```

응답:

```json
{
  "runId": "run_...",
  "agentId": "solver",
  "arenaSessionId": "as_...",
  "generation": 1,
  "loadout": {
    "promptCardIds": ["answer-briefly-v1"],
    "skillCardIds": ["arena-tactics-v1"],
    "mcpCardIds": ["calculator-mcp-v1"]
  }
}
```

loadout 변경은 기존 agent context와 generation을 유지하며 다음 turn부터
적용된다. 모델 profile과 harness는 바뀌지 않는다.

카드가 loadout에 있다는 사실과 실제 실행은 구분해야 한다. turn 결과의
`toolTrace`에서 다음과 같이 확인한다.

```json
[
  {
    "type": "mcp",
    "name": "arena-calculator.calculate",
    "status": "completed"
  },
  {
    "type": "skill",
    "name": "Arena Tactics",
    "status": "completed"
  }
]
```

unknown, 미설정, provider 미지원, write-capable MCP 카드는 fail-closed로
거절된다.

## 11. context compact

context가 soft limit에 접근하거나 `agent.context.warning`을 받으면 해당
agent만 compact할 수 있다.

본문은 생략하거나 빈 JSON object만 보낼 수 있다.

```bash
curl -X POST \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  -H "Idempotency-Key: compact-solver-0001" \
  -H "Content-Type: application/json" \
  "$ARENA_API_BASE/v1/runs/RUN_ID/agents/solver/compact" \
  -d '{}'
```

```json
{
  "runId": "run_...",
  "agentId": "solver",
  "arenaSessionId": "as_...",
  "generation": 1,
  "compactionMode": "native",
  "context": {
    "estimatedActiveTokens": 540,
    "budgetTokens": 4000,
    "gauge": 0.135,
    "measurement": "estimated_after_output",
    "compactedThisTurn": true,
    "compactionMode": "native"
  },
  "replayed": false
}
```

가능한 mode:

- `native`
- `explicit-summary-fallback`
- `mock-native`

compact는 provider 호출이 발생할 수 있으며 실패·timeout 시 비용이 이미
발생했는지 알 수 없는 경우가 있다. 이런 crash 경계에서는 같은 key를
무조건 재호출하지 않고 `409 operation_outcome_unknown`을 처리한다.

## 12. context clear

clear는 해당 agent의 이전 provider history를 제거하고 새 generation을
시작한다. run, 모델, harness, 현재 loadout과 게임 상태는 유지된다.
본문은 생략하거나 빈 JSON object만 보낼 수 있다.

```bash
curl -X POST \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  -H "Idempotency-Key: clear-solver-0001" \
  -H "Content-Type: application/json" \
  "$ARENA_API_BASE/v1/runs/RUN_ID/agents/solver/clear" \
  -d '{}'
```

```json
{
  "runId": "run_...",
  "agentId": "solver",
  "arenaSessionId": "as_new_...",
  "generation": 2,
  "context": {
    "estimatedActiveTokens": 0,
    "budgetTokens": 4000,
    "gauge": 0,
    "measurement": "estimated_after_output",
    "compactedThisTurn": false
  },
  "replayed": false
}
```

다음 turn은 generation 2의 빈 context에서 시작한다. 다른 두 agent의
context는 영향을 받지 않는다.

## 13. 오류 처리

모든 오류는 sanitized envelope를 사용한다.

```json
{
  "error": {
    "code": "idempotency_conflict",
    "message": "Idempotency key was already used with a different request.",
    "traceId": "http_..."
  }
}
```

클라이언트가 구분해야 할 대표 상태:

| HTTP | 예시 code | 처리 |
|---:|---|---|
| 400 | `invalid_request`, `idempotency_key_required` | 요청 수정 |
| 401 | `unauthorized` | 공개 session 또는 내부 인증 확인 |
| 403 | `origin_forbidden` | 서버 CORS allowlist 확인 |
| 404 | `run_not_found`, `turn_not_found`, `session_not_found` | 저장된 ID 확인 |
| 409 | `run_busy`, `idempotency_conflict`, `operation_outcome_unknown` | 기존 작업 조회 후 재시도 판단 |
| 413 | `request_too_large` | public state·summary 축소 |
| 415 | `unsupported_media_type` | JSON content type 사용 |
| 422 | `unknown_model_profile`, `unknown_card`, `skill_not_configured`, `mcp_not_configured` | capabilities와 서버 설정 확인 |
| 429 | `rate_limited` | backoff와 세션 quota 적용 |
| 502 | `compact_failed` | compact 결과와 provider 상태 확인 |
| 504 | `provider_timeout` | 동일 idempotency key의 결과 상태 확인 |

네트워크 timeout이 발생했다고 곧바로 새 idempotency key로 같은 작업을
중복 실행하면 안 된다. 먼저 기존 key로 replay하거나 turn 조회 API로
권위 상태를 확인한다.

## 14. GitHub Pages 게임에서 사용하는 방법

GitHub Pages에는 다음 공개 값만 빌드한다.

```env
VITE_GAME_API_BASE_URL=https://api.example.com
```

다음 값은 Pages build에 절대 넣지 않는다.

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARENA_API_KEYS`
- `ARENA_CONTEXT_ENCRYPTION_KEY`
- provider Skill ID/version
- MCP credential

권장 호출 구조:

```text
GitHub Pages
  -> 공개 Game API/BFF
     -> 비공개 Agent Arena API
        -> OpenAI / Claude / MCP / hosted Skill
```

Game API/BFF의 책임:

- 사용자 로그인, CAPTCHA 또는 데모 접근 정책
- 짧은 수명의 공개 session token/HttpOnly cookie
- 사용자별 runId·agent session 소유권 확인
- IP·사용자·세션별 rate limit
- turn 수, token, 모델, MCP/Skill 카드 quota
- Agent Arena API 내부 Bearer key 보관
- SSE proxy 또는 cookie 기반 공개 event stream

현재 Agent Arena API는 Bearer key fingerprint를 owner 경계로 사용한다.
BFF가 하나의 내부 key를 공유한다면 BFF가 사용자별 run/session mapping을
반드시 검증해야 한다. 그렇지 않으면 공개 사용자 간 격리가 보장되지
않는다.

한 대의 AWS 서버로 시작할 때는 다음 구성이 단순하다.

```text
Caddy/Nginx :443
  -> Game API/BFF container
  -> private Docker network의 agent-arena-api:8790
  -> /app/data 영구 volume
```

GitHub Actions는 프런트엔드 Pages 배포와 backend image 배포를 분리한다.
provider key는 GitHub Pages나 Docker image에 넣지 않고 AWS
Secrets Manager/SSM 또는 서버의 권한 제한 env 파일에서 실행 시점에
주입한다. AWS 배포 권한은 가능하면 GitHub OIDC의 단기 credential을
사용한다.

현재 SQLite WAL 저장소는 단일 backend instance와 영구 volume에
적합하다. 다중 instance로 확장할 때는 PostgreSQL과 분산 queue로
이관한다.

## 15. 통합 체크리스트

- `/readyz`가 `200`인가
- `/v1/capabilities`에서 선택 profile과 카드가 configured 상태인가
- run에 서로 다른 agent ID 세 개를 넣었는가
- 모델과 harness를 run 시작 전에 확정했는가
- 모든 변경 요청에 고유 idempotency key를 넣었는가
- turn의 `allowedActions`가 게임 엔진의 현재 합법 action과 일치하는가
- SSE reconnect sequence를 저장하는가
- 최종 판단은 반드시 `GET /v1/turns/{turnId}`에서 읽는가
- `fallbackUsed`, `usage.source`, `context.gauge`, `toolTrace`를 기록하는가
- context 압박 시 compact와 clear를 구분해 사용하는가
- 브라우저 bundle에 provider key나 내부 Bearer key가 없는가
- 공개 Game API에서 사용자별 quota와 run/session 소유권을 검증하는가
