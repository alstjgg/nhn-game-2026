# Agent Arena API 통합 가이드

> 게임 백엔드가 Agent Arena API를 호출하는 전체 흐름. 요청·응답 스키마의 권위는
> [`openapi.yaml`](../services/agent-arena-api/openapi.yaml), 서버 실행·환경변수는
> [서비스 README](../services/agent-arena-api/README.md), 배포·BFF 경계의 상세는
> [백엔드 핸드오프](./handoffs/agent-arena-llm-backend.md)를 본다.

## 0. 빠른 참조

| 순서 | Endpoint | Idempotency-Key | 용도 |
|---|---|---|---|
| 1 | `GET /v1/capabilities` | — | 사용 가능 모델·카드·harness 조회 |
| 2 | `POST /v1/runs` | 필수 | run + agent 3기 생성 |
| 3 | `PUT /v1/runs/{runId}/agents/{agentId}/loadout` | — | (선택) 카드 장착 변경 |
| 4 | `POST /v1/runs/{runId}/turns` | 필수 | turn 실행 — `202` 비동기 |
| 5 | `GET /v1/turns/{turnId}/events` | — | SSE 진행 스트림 |
| 6 | `GET /v1/turns/{turnId}` | — | **최종 권위 결과** |
| 7 | `POST /v1/runs/{runId}/agents/{agentId}/compact` | 필수 | (선택) context 압축 |
| 8 | `POST /v1/runs/{runId}/agents/{agentId}/clear` | 필수 | (선택) context 초기화 |

세 가지 원칙:

- **최종 판단은 항상 `GET /v1/turns/{turnId}`에서 읽는다.** SSE는 진행 표시·재연결용
  sanitized telemetry다.
- **서버 간 내부 API다.** 브라우저는 직접 호출하지 않는다 (§11).
- **모델은 의도만 고른다.** `allowedActions` 밖의 행동은 확정될 수 없고, 실제 상태 변경은
  게임 엔진이 수행한다.

## 1. 사용 경계

- 브라우저가 아는 것: 모델 alias와 허용된 카드 ID뿐.
- 서버에만 있는 것: provider API key, 실제 모델명, MCP URL·token, provider Skill ID.
- 인증은 고정 `Bearer` key — GitHub Pages나 JS 번들에 넣지 않는다. 공개 게임에서는
  Game API/BFF가 사용자를 인증하고 내부 key로 대신 호출한다 (§11).

로컬 예제 전용 값:

```bash
export ARENA_API_BASE=http://127.0.0.1:8790
export ARENA_API_TOKEN=dev-local-key
```

## 2. 공통 규칙 — 인증과 멱등성

`/healthz`(생존)와 `/readyz`(준비)만 인증이 없다. 나머지 전부:

```http
Authorization: Bearer <server-owned-token>
Content-Type: application/json
```

변경 요청 4종(run 생성 · turn 생성 · compact · clear)은 길이 8~200자의
`Idempotency-Key`가 필수다.

```http
Idempotency-Key: run-20260724-0001
```

- 같은 key + 같은 요청 재전송 → 최초 결과가 replay된다 (`replayed: true`).
- 같은 key + 다른 요청 → `409 idempotency_conflict`.
- 네트워크 timeout 후 **새 key로 바로 재시도하지 않는다** — 먼저 기존 key로 replay하거나
  turn 조회로 권위 상태를 확인한다 (§10).

## 3. capabilities — 모델·카드 조회

```bash
curl -H "Authorization: Bearer $ARENA_API_TOKEN" "$ARENA_API_BASE/v1/capabilities"
```

| 응답 필드 | 확인할 것 |
|---|---|
| `modelProfiles[].id` | 클라이언트가 보낼 모델 alias |
| `modelProfiles[].implemented` / `configured` | run에는 **둘 다 `true`**인 profile만 사용 |
| `modelProfiles[].liveVerified` | 운영자가 기록한 live 검증 근거 (개별 요청 성공 보장 아님) |
| `modelProfiles[].supports` | streaming · MCP · Skill · compact 지원 여부 |
| `registry.promptCards` / `skillCards` / `mcpCards` | 장착 가능한 카드 |
| `registry.harnesses` | token · tool call · timeout 제한 |

실제 provider 모델명과 provider resource ID는 응답에 포함되지 않는다.

기본 alias:

| Alias | Provider | 용도 |
|---|---|---|
| `mock-arena` | mock | API key 없는 로컬·CI 테스트 |
| `openai-arena` | OpenAI | 실제 OpenAI Responses 호출 |
| `claude-arena` | Anthropic | 실제 Claude Messages 호출 |

harness 선택: 일반 turn은 `starter-4000`, hosted MCP/Skill을 쓰는 run은 `agentic-4000`.

## 4. run 생성 — 파티 agent 3기

규칙:

- 한 run에는 **서로 다른 ID의 agent 정확히 3기**가 필요하다.
- 모델 profile과 harness는 run 생성 시 고정 — 바꾸려면 새 run.
- 각 agent의 `promptCardIds` · `skillCardIds` · `mcpCardIds`는 **비어 있어도 세 배열 모두**
  보낸다.

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
      { "agentId": "guardian", "promptCardIds": ["protect-weakest-v1"], "skillCardIds": [], "mcpCardIds": [] },
      { "agentId": "solver",   "promptCardIds": ["answer-briefly-v1"],  "skillCardIds": ["risk-check-v1"], "mcpCardIds": [] },
      { "agentId": "scout",    "promptCardIds": ["avoid-high-risk-v1"], "skillCardIds": [], "mcpCardIds": [] }
    ]
  }'
```

응답의 `runId`, 각 `agentId` · `arenaSessionId` · `generation`을 게임 서버의 세션
레코드에 저장한다:

```json
{
  "runId": "run_...",
  "modelProfileId": "mock-arena",
  "cardsVersion": "2026-07-23.1",
  "replayed": false,
  "agents": [
    { "agentId": "guardian", "arenaSessionId": "as_...", "generation": 1 },
    { "agentId": "solver",   "arenaSessionId": "as_...", "generation": 1 },
    { "agentId": "scout",    "arenaSessionId": "as_...", "generation": 1 }
  ]
}
```

## 5. turn 실행

게임 엔진이 현재 공개 상태와 실행 가능한 closed action 목록을 보낸다. 규칙:

- 각 `actionId`는 중복 불가.
- target이 없는 action도 `"targetIds": []`를 반드시 포함.
- 한 run에서 동시에 turn 하나만 — 이전 turn이 끝나기 전의 새 turn·loadout·compact·clear는
  `409 run_busy`.

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
      "publicState": { "enemyId": "enemy-1", "guardianHp": 42, "solverHp": 20, "scoutHp": 35 }
    },
    "allowedActions": [
      { "actionId": "attack", "targetIds": ["enemy-1"] },
      { "actionId": "defend", "targetIds": ["guardian", "solver", "scout"] },
      { "actionId": "wait",   "targetIds": [] }
    ]
  }'
```

서버는 provider 완료를 기다리지 않고 `202`를 반환한다:

```json
{ "turnId": "turn_...", "status": "queued", "replayed": false, "eventsUrl": "/v1/turns/turn_.../events" }
```

`eventsUrl`은 상대 경로 — `ARENA_API_BASE`(또는 내부 service origin)와 결합해 쓴다.

## 6. SSE 진행 스트림

```bash
curl -N -H "Authorization: Bearer $ARENA_API_TOKEN" "$ARENA_API_BASE/v1/turns/TURN_ID/events"
```

```text
id: 7
event: agent.tool.completed
data: {"turnId":"turn_...","sequence":7,"type":"agent.tool.completed","createdAt":"...","data":{"agentId":"solver"}}
```

event 종류: `turn.queued` · `turn.started` · `agent.started` · `agent.context.warning` ·
`agent.output.delta` · `agent.tool.started` · `agent.tool.completed` · `agent.tool.failed` ·
`agent.usage.final` · `agent.decision.accepted` · `agent.fallback` · `agent.completed` ·
`turn.completed` · `turn.failed`

동작 규칙:

- `turn.completed`/`turn.failed` 후 서버가 stream을 닫는다.
- stream은 sanitized다: hidden reasoning·credential 미포함, `agent.output.delta`는 원문
  대신 **문자 수만** 전달.
- 새 event가 없으면 15초 간격 SSE comment heartbeat가 올 수 있다.
- 재연결: 마지막 `sequence`를 `Last-Event-ID` header 또는 `?after=<sequence>`로 전달
  (둘 다 있으면 header 우선). 서버가 그 이후의 persisted event부터 replay한다.

브라우저의 기본 `EventSource`는 `Authorization` header를 못 붙이므로, 내부 Bearer API를
직접 테스트할 때는 `fetch()` streaming을 쓴다:

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
  const response = await fetch(`${apiBase}${eventsUrl}?after=${after}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
  });
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

공개 게임에서는 브라우저가 내부 token을 가지면 안 된다 — Game API/BFF가 SSE를 proxy하거나
HttpOnly cookie 기반 공개 stream을 제공한다 (§11).

## 7. 최종 결과 조회 — 권위

```bash
curl -H "Authorization: Bearer $ARENA_API_TOKEN" "$ARENA_API_BASE/v1/turns/TURN_ID"
```

상태는 `queued` · `running` · `completed` · `failed`. 완료 응답에는 party 순서대로 세
agent 결과가 들어간다:

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
        { "type": "function", "name": "arena_risk_check", "status": "completed", "durationMs": 3 }
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

| 필드 | 의미 |
|---|---|
| `decision` | 게임 엔진이 **다시 검증한 뒤** 적용할 의도 |
| `usage.source` | provider 실측값인지 mock 값인지 |
| `context.gauge` | 현재 **추정** context 점유율 — 정확한 provider window가 아님. 실측 token은 `usage`를 쓴다 |
| `toolTrace` | function · MCP · Skill이 실제 실행됐는지 |
| `fallbackUsed` | provider 실패·검증 실패로 deterministic fallback이 쓰였는지 |

top-level `status`가 `completed`여도 agent별 `fallbackUsed`는 `true`일 수 있다 —
**개별 결과를 반드시 확인한다.**

## 8. loadout — MCP·Skill 장착

MCP와 Skill은 provider resource ID·URL이 아닌 **registry 카드 ID**로 선택한다.

| Card ID | 종류 | 의미 |
|---|---|---|
| `risk-check-v1` | function Skill | 서버가 직접 실행하는 risk tool |
| `arena-tactics-v1` | hosted Skill | provider에 고정 버전으로 등록된 Skill |
| `calculator-mcp-v1` | read-only MCP | allowlist의 `calculate` tool |

사전 확인 (`/v1/capabilities`): hosted Skill의 `configuredProviders.<provider>: true`,
MCP 카드 `configured: true`, 선택 모델의 `skills: true` · `remoteMcp: true`.

run 생성 때 넣거나, idle 상태에서 agent 하나씩 변경한다. 본문에 `agentId`는 넣지 않는다 —
route의 `{agentId}`가 대상이다:

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

- 변경은 기존 context와 generation을 유지하며 **다음 turn부터** 적용된다. 모델·harness는
  불변.
- 카드가 loadout에 있다는 것 ≠ 실행됐다는 것 — turn 결과의 `toolTrace`로 확인한다
  (`{"type": "mcp", "name": "arena-calculator.calculate", "status": "completed"}`).
- unknown · 미설정 · provider 미지원 · write-capable MCP 카드는 **fail-closed**로 거절.

## 9. compact와 clear

둘 다 agent 단위, `Idempotency-Key` 필수, 본문은 생략하거나 `{}`.

| | compact | clear |
|---|---|---|
| 언제 | soft limit 접근, `agent.context.warning` 수신 | context를 완전히 리셋하고 싶을 때 |
| 효과 | context 요약으로 게이지 감소 | 이전 provider history 제거, **새 generation** 시작 |
| 유지되는 것 | 전체 history의 요약본 | run · 모델 · harness · 현재 loadout · 게임 상태 |
| 응답 mode | `native` · `explicit-summary-fallback` · `mock-native` | — (`generation` 증가, `gauge: 0`) |

```bash
curl -X POST \
  -H "Authorization: Bearer $ARENA_API_TOKEN" \
  -H "Idempotency-Key: compact-solver-0001" \
  -H "Content-Type: application/json" \
  "$ARENA_API_BASE/v1/runs/RUN_ID/agents/solver/compact" -d '{}'
```

clear도 같은 형식이다 (`.../clear`). 다른 두 agent의 context는 영향받지 않는다.

**compact의 crash 경계:** compact는 provider 호출이 발생할 수 있어, 실패·timeout 시 비용이
이미 발생했는지 알 수 없는 경우가 있다. 이때 같은 key를 무조건 재호출하지 말고
`409 operation_outcome_unknown`을 처리한다 — 새 key는 명시적으로 새 provider 호출을
의도할 때만 쓴다.

## 10. 오류 처리

모든 오류는 sanitized envelope:

```json
{ "error": { "code": "idempotency_conflict", "message": "...", "traceId": "http_..." } }
```

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

## 11. 공개 배포 경계 — 요약

```text
GitHub Pages (공개 값은 VITE_GAME_API_BASE_URL 하나뿐)
  -> 공개 Game API/BFF (사용자 인증 · quota · run/session 소유권 검증 · SSE proxy)
     -> 비공개 Agent Arena API (내부 Bearer key)
        -> OpenAI / Claude / MCP / hosted Skill
```

Pages build에 절대 넣지 않는 것: `OPENAI_API_KEY` · `ANTHROPIC_API_KEY` ·
`ARENA_API_KEYS` · `ARENA_CONTEXT_ENCRYPTION_KEY` · provider Skill ID/version ·
MCP credential.

Agent Arena API는 Bearer key fingerprint를 owner 경계로 쓴다. BFF가 내부 key 하나를
공유한다면 **BFF의 사용자별 run/session 소유권 검증이 필수**다 — 없으면 공개 사용자 간
격리가 보장되지 않는다.

BFF 책임 목록, AWS 단일 서버 구성, GitHub Actions 분리, secret 주입 방식 등 배포 상세는
[핸드오프의 배포 경계 섹션](./handoffs/agent-arena-llm-backend.md#github-pages-deployment-boundary)이
단일 출처다.

## 12. 통합 체크리스트

- [ ] `/readyz`가 `200`인가
- [ ] `/v1/capabilities`에서 선택 profile과 카드가 configured 상태인가
- [ ] run에 서로 다른 agent ID 세 개를 넣었는가
- [ ] 모델과 harness를 run 시작 전에 확정했는가
- [ ] 모든 변경 요청에 고유 idempotency key를 넣었는가
- [ ] turn의 `allowedActions`가 게임 엔진의 현재 합법 action과 일치하는가
- [ ] SSE reconnect sequence를 저장하는가
- [ ] 최종 판단은 반드시 `GET /v1/turns/{turnId}`에서 읽는가
- [ ] `fallbackUsed` · `usage.source` · `context.gauge` · `toolTrace`를 기록하는가
- [ ] context 압박 시 compact와 clear를 구분해 사용하는가
- [ ] 브라우저 bundle에 provider key나 내부 Bearer key가 없는가
- [ ] 공개 Game API에서 사용자별 quota와 run/session 소유권을 검증하는가
