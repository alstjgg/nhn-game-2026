# 팀원 롤 기술서

## 1. 팀 구성

| 이름 | GitHub | 담당 역할 |
|---|---|---|
| 박민서 | `alstjgg` (저장소 소유자) | 기획 · 시나리오/데이터 · 클라이언트 개발 · AI 활용 |
| 차윤석 | `C9Boom7` | 시스템 아키텍처 · 엔진/백엔드 개발 · AI 활용 |

2인 팀이고 아트를 전담한 사람은 없다. 그래픽과 사운드를 비롯한 모든 에셋은 AI로 만들었거나
CC0·퍼블릭 도메인 소스를 가져다 썼으며, 출처는 `assets-manifest.json`과 AI 활용 기술
문서(#4)에 빠짐없이 적었다.

작업은 문서로 주인을 밝힌 세 트랙으로 나눴다. **데이터(민서)**, **아키텍처(윤석)**,
**클라이언트(민서)**.[^1]

## 2. 박민서 — 담당 영역

**기획·시나리오.** 게임 컨셉을 기획하고 페이퍼 테스트로 앞뒤를 맞춰봤다. 본편 시나리오
세 편 — 「우는다리」, 「전구간정상」, 그리고 지금 배포된 「멈춘회전문」 — 을 모두 쓰고
하드닝했다.[^2]

**시나리오 설계 모델.** 엔딩을 먼저 정하고 거기서 경로, 게이트, 게이트를 넘는 데 필요한
지식, 그 지식을 실어 나르는 타임라인 순으로 내려오는 저작 모델을 세운 뒤, 이를 집필 규칙으로
옮긴 브리프를 썼다. 개입하지 않으면 최악으로 끝난다는 게임의 전제가 확률이 아니라 이
구조에서 나온다.[^3]

**데이터 파이프라인.** 시나리오 초안을 게임 데이터팩으로 바꾸는 저작 체계를 전부 만들었다.
JSON Schema 정본, 결정론적 컴파일러, lint 룰셋, 시나리오 팩토리 스킬이 여기 속하고, 데이터
계약 문서도 이 트랙이 갖는다.[^4]

**게이트 실측.** 플레이어가 건넨 문장이 정말로 에이전트의 판단을 움직이는지 실제 모델
호출로 쟀다. arm마다 조건을 미리 등록하고 플라시보를 함께 돌렸으며, 배포본 시나리오의 게이트
세 개는 arm 36개, 호출 360번으로 측정했다. 여기서 나온 규칙이 집필 브리프의 근거가 됐다.[^5]

**클라이언트 전체.** 플레이어가 보고 만지는 화면은 전부 이쪽이다. UI/UX 스펙과 빌드
계획에서 시작해 셸과 윈도 매니저, CSS 토큰 체계, LIVE FEED·REPORTS·AGENT FILE 같은 핵심 창,
문장을 캐서 슬롯에 앉히는 조작과 DEPLOY 루프, 로그인 화면, 온보딩 안내, 엔딩 연출까지
만들었다.[^6]

## 3. 차윤석 — 담당 영역

**물리 아키텍처.** 저장소를 네 개의 루트로 가르고 티어를 분리했다. 브라우저와 Node 양쪽에서
도는 코드가 한쪽에만 있는 기능에 손대면 컴파일 단계에서 걸리도록 빌드를 잡았다.[^7]

**게임 엔진.** 상태 코어와 델타 저널, 페이로드 컴포저, 비트·라운드 드라이버, 재시도 예산과
fixture 강등을 다루는 transport, 런 루프 매니저, 종료 시점에 도는 스코어러를 만들었다.
에이전트가 이미 겪은 일과 아직 오지 않은 일을 갈라 모델에 넘기는 것도 이 층이 맡는다. 최소
엔진 스펙과 LLM 콜 계약 문서도 직접 썼다.[^8]

**LLM 백엔드.** GitHub Pages에서 API Gateway와 Lambda를 거쳐 Bedrock으로 가는 stateless
프록시를 설계하고 구현해 배포했다. OIDC 배포 파이프라인, 호출별 지연시간 예산, 세 콜의
프롬프트 렌더링과 툴 스키마가 모두 이 티어에 있다. 클라이언트에 API 키를 심지 않아도 되는
것, 측정용 프로브와 실제 서비스가 같은 문장을 보낸다는 보장이 여기서 나온다.[^9]

**오디오.** 큐 38개를 데이터로만 이어 붙인 사운드 레이어를 만들었다. 소리는 게임이 내보내는
사건을 지켜보고 울릴 뿐이라, 게임 코드를 건드리지 않고 통째로 켜고 끌 수 있다.[^10]

## 4. 공동 작업 영역

- **게임 메커니즘 검증** — 측정 하네스와 Call 2·3 구현은 윤석이, 실측과 딥테스트는 민서가,
  방향을 정한 결정 문서는 다시 윤석이 맡았다. 게임의 근거가 된 이 프로그램은 두 사람의 작업이
  맞물려야 굴러갔다.[^11]
- **LLM 프롬프트** — 게임이 모델에 실제로 보내는 문장이다. 판단 콜의 원안, 보고서 프롬프트
  개정, 시나리오별 기본 프롬프트 분리는 민서가 했다. 프롬프트를 프록시 티어로 옮겨 렌더러와
  툴 스키마를 세우고 프로브와의 일치를 지키는 일, 그리고 플레이테스트 뒤 세 콜을 어투 규정까지
  넣어 다시 쓴 일은 윤석이 했다.[^12]
- **AI 활용(멀티에이전트 오케스트레이션)** — PRD를 쪼개 워크트리마다 에이전트를 붙이고 PR
  리뷰 패널로 받는 super-pipeline 하네스를 두 사람 모두 자기 트랙의 큰 빌드에 썼다(민서:
  클라이언트 15유닛, 윤석: 엔진 11유닛).[^13]
- **제출 문서** — AI 활용 문서(#4)는 민서가 골격을, 윤석이 본문을 맡았다.[^14]

## 5. 협업·분업 방식

**합의는 대화가 아니라 문서로 한다.** 트랙 사이의 경계는 `spec-`(도메인 정본),
`contract-`(두 소유자가 함께 지키는 인터페이스), `plan-`(작업 계획) 세 층의 문서로 묶었다.
상대 트랙에 무언가 필요할 때도 말이 아니라 문서 개정으로 요청했다. 두 사람과 여러 에이전트가
동시에 움직이는데 서로를 기다리지 않으려면, 맞물리는 지점이 먼저 글로 굳어 있어야 하기
때문이다.[^15]

**경계는 소유로 나눈다.** 같은 디렉터리 안에서도 파일마다 주인이 다르다. `src/shared/`에서
`datapack.ts`는 민서, `contracts.ts`는 윤석 것이다. 경계를 넘는 변경은 코드만 고치지 않고
해당 계약 문서까지 함께 고쳐 낸다.[^16]

**두 트랙에 걸친 문제는 레인으로 쪼갠다.** 플레이테스트에서 결함을 찾으면 그대로 넘기지 않고,
어느 레인이 무엇을 고칠지 갈라놓은 핸드오프 문서를 쓴다. 최근 사례에서는 프롬프트와 프록시가
윤석 레인, 시나리오와 클라이언트가 민서 레인으로 갈렸고 각자 자기 쪽을 고쳤다. 한쪽에서 새로
알아낸 사실이 상대 레인의 전제를 흔들면 개정 문서를 따로 낸다.[^17]

**결정은 근거와 함께 박아둔다.** 리뷰에서 다시 뒤집히기 쉬운 판단은 핸드오프 문서 안에 왜
그렇게 가기로 했는지까지 적어 남긴다. 컨셉 선정이나 메커니즘 검증 종료처럼 굵은 결정은
회의록과 `status.md`의 결정 로그에 날짜와 함께 적는다.[^18]

**모든 변경은 PR로 들어간다.** `main`은 언제나 배포 가능한 상태로 둔다. 머지하면 곧바로
GitHub Pages로 나가기 때문이다. 커밋 이력 자체가 제출물이라 히스토리는 다시 쓰지 않으며,
에이전트가 낸 PR은 `[AGENT]`로 표시해 사람 작업과 구분한다.

---

## 출처

[^1]: `docs/plan-pipeline.md` §1 — 트랙별 소유자와 산출물 표.
[^2]: `planning/dday-scenario/` (초안·페이퍼 체크), `planning/paper-tests/`,
      `data/scenario/우는다리` · `전구간정상` · `멈춘회전문`.
[^3]: `planning/scenario-model.md`, `planning/scenario-writer-brief.md`.
[^4]: `authoring/` (컴파일러·lint), `data/scenario/_schema/`,
      `.claude/skills/write-scenario/`, `docs/contract-datapack.md`.
[^5]: `planning/dday-mechanism/` — `suites/` (미리 등록한 실험 구성), `runs/` (원본 응답과
      지표), `RUNLOG.md`. 측정 도구는 `tools/probe/`.
[^6]: `src/client/`, `docs/spec-client.md`, `docs/plan-client-build.md`.
[^7]: `docs/spec-physical-architecture.md` §3, `tsconfig.core.json`.
[^8]: `src/{engine,composer,driver,runloop,transport}/`, `tools/driver/`,
      `docs/spec-engine.md`, `docs/contract-calls.md`.
[^9]: `proxy/src/`, `.github/workflows/proxy-deploy.yml`,
       `proxy/tests/prompt-parity.test.ts` (프로브와 실제 서비스의 바이트 일치 검사).
[^10]: `data/policy/audio-map.json`, `tools/audio/`, `docs/plan-audio.md`.
[^11]: `planning/dday-mechanism/MECHANISM-DIRECTION-DECISION.md`,
       `MECHANISM-DIRECTION-EVIDENCE.md`.
[^12]: `proxy/prompts/` (세 콜의 base·user 템플릿 — judgment v0.5 · narration v0.4 ·
       reporter v0.4), `proxy/src/default-prompt.ts`, `proxy/src/calls.ts`.
[^13]: `planning/research/super-pipeline-game-mod.md`,
       `docs/deliverables/ai-utilization.draft.md`. 하네스 자체는 별도 저장소에 있다.
[^14]: `docs/deliverables/`.
[^15]: `docs/README.md` — 문서 3층의 정의와 문서 지도.
[^16]: `docs/spec-physical-architecture.md` §3.1 — 파일 단위 소유,
       `docs/contract-calls.md`.
[^17]: `docs/handoffs/` — `feed-register-llm.md` · `-client.md` · `-llm-amendment.md`
       (레인별 핸드오프와 개정).
[^18]: `planning/meetings/`, `docs/status.md` 결정 로그.
