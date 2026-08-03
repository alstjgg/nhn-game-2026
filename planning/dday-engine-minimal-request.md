# 최소 엔진 요청서 — LLM 레이어가 엔진에 요구하는 것

> **ARCHIVE — answered, superseded as an authority.** This is the *request*
> half of the 07-30 meeting's §2-3 sequence (ask what is needed first, then
> spec the minimum). It was answered in full; build against the answer:
> [`docs/spec-engine.md`](../docs/spec-engine.md), which resolves all five
> questions of §6 and turns §7 into executable acceptance criteria.
>
> **One section here is still cited and still normative as evidence: §6.1**
> (beat-boundary constraint — a fixed event must not demand a reply from the
> controller). The *rule* now lives upstream in
> [`docs/spec-architecture.md`](../docs/spec-architecture.md) §4
> (Beat-boundary constraint); what §6.1 uniquely holds is the **measurement
> that established it** (speaker misassignment 8/10 → 4/5 under a
> single-variable probe → 0/5 once `PRESENT_NPCS` carried `side`) and the
> paths to the raw run artifacts. Evidence lives in `planning/` by convention,
> alongside `dday-mechanism/RUNLOG.md` and `runs/`, which is why this document
> was archived rather than dissolved. `tools/probe/lint-beat.mjs`
> cites §6.1 as the rationale it enforces.
>
> **Requester:** L (LLM Infrastructure). **Source documents:**
> [call contracts](../docs/contract-calls.md) §6 ·
> [architecture spec](../docs/spec-architecture.md) §3.
> **Scope:** only what one round of a single gate needs to run end to end.

---

## 1. 왜 이 요청서가 아키텍처 확정의 마지막 조각인가

콜 계약 v1이 확정되면서 세 콜의 입출력은 전부 못박혔다. 그런데 **그 입력 슬롯의
값을 만들어 주는 것이 엔진**이고, 지금은 스위트 JSON의 손저작이 그 자리를 대신하고
있다. 계약은 있고 공급자가 없는 상태다.

특히 하나는 **엔진 내부 구조가 없으면 원리적으로 만들 수 없다** — `SCENE_SYMPTOMS`
(아래 §4). 이것 때문에 "엔진을 나중에 붙인다"가 성립하지 않는다.

---

## 2. 엔진이 **공급**해야 하는 것

라운드 1회 동안 엔진이 채워야 하는 슬롯 전부. 타입은 계약 v1이 고정한 것이다.

### Call 1 — Judgment

| 슬롯 | 타입 | 엔진이 하는 일 |
|---|---|---|
| `TIMELINE_EXCERPT` | `string[]` | 현재까지의 타임라인에서 발췌. **몇 줄을 줄지는 엔진 정책** — 프롬프트 길이·지연에 직결(§6 질문 4) |
| `GATE_QUESTION` | `string` | 현재 게이트의 시나리오 데이터 조회 |
| `STANCE_SET` | `{id, label}[]` | 동일. 게이트별 콘텐츠이며 2개 이상 |

`FLAW`·`INCIDENT`·`PRIORITY_LIST`·`TEMPERAMENT`는 프록시/시나리오 소유다 — 엔진이
건드리지 않는다.

### Call 2 — Narration

| 슬롯 | 타입 | 엔진이 하는 일 |
|---|---|---|
| `TIMELINE_TAIL` | `string[]` | 타임라인 꼬리. **엔진이 이미 렌더한 고정 사건과 통제관 발화를 포함해야 한다** — 계약 v1 §3이 "이미 화면에 있는 것"을 전제로 쓰여 있다 |
| `AGENT_UTTERANCE` | `string` | 직전 Call 1 출력의 `utterance`를 그대로 전달 |
| `FIXED_NPC_ACTION` | `string` | 이번 비트의 고정 NPC 행동을 시나리오에서 조회. **이미 일어난 것으로 서술된 문장**이어야 한다(미래형 아님) |
| `SCENE_SYMPTOMS` | `string[]` | **delta journal → 증상 문장.** §4에서 따로 다룬다 |
| `PRESENT_NPCS` | `{id, name}[]` | 이번 비트의 등장 인물 조회 |

### Call 3 — Reporter

| 슬롯 | 타입 | 엔진이 하는 일 |
|---|---|---|
| `EXPERIENCED` | `string[]` | **라운드 이벤트 조립** — 스크립트 이벤트 + Call 2의 `timeline_entries`·`npc_lines` + Call 1의 `utterance`와 `inner_note`를 한 라운드 분량으로 모은다 |
| `TEMPERAMENT` | `string` | 시나리오 기질 (Call 1과 **같은 값**) |
| `REPORT_GUIDANCE` | `string` | `data/`의 분량·형식 정책 |

`inner_note`가 `EXPERIENCED`에 들어가는 것이 W1의 절반이다 — 이것이 빠지면 보고서가
에이전트의 속을 반영하지 못하고, 플레이어의 추리 재료가 사라진다.

### 2.1 조립의 구체안 — 드라이버가 손으로 짜 본 것

배선을 실제로 이어 본 결과(`tools/driver/drive-beat.mjs`, 원자료
`runs/BEAT-drive/`), 위 표가 "조립"이라고만 적은 부분이 이 정도로 구체적이어야
한다는 것이 드러났다. 엔진은 최소한 이만큼을 정해야 한다.

| 조립물 | 드라이버가 쓴 방식 | 엔진이 정해야 하는 것 |
|---|---|---|
| 타임라인 갱신 | `직전 타임라인 + 통제관 발화 + 고정 사건 + 나레이션 entries + npc_lines` 순서로 append | 이 순서가 맞는지, 비트 경계가 어디인지 |
| 통제관 발화의 렌더 형식 | `통제관: "<utterance>"` | 화자 표기 규약. 채굴 UI가 이 형식 위에서 블럭을 잘라낸다 |
| `EXPERIENCED` | `스크립트 + (속으로) inner_note + 나는 말했다: utterance + 고정 사건 + 나레이션 전부` | inner_note를 어떤 표지로 감쌀지, 라운드가 몇 비트인지 |
| 고정 사건 선택 | **하지 않았다** — 스위트 고정값을 그대로 썼다 | **엔진의 몫.** stance → bucket → edge → 다음 비트의 고정 사건 |

마지막 행이 이 드라이버와 엔진의 경계다. 드라이버는 stance를 **기록만** 하고
적용하지 않는다. 그것을 적용하는 순간 게임 엔진이 되고, 그건 이 요청서가 요청하는
대상이지 만드는 대상이 아니다.

*실측 한 줄*: 비트 1회 = 3콜 = **19.1s** (판단 5.5 · 나레이션 4.5 · 보고서 9.1).
프로덕션 페이로드도 프록시도 아니므로 지연 예산 재산정에는 쓰지 않는다(A4).

---

## 3. 엔진이 **소비**해야 하는 것

| 출력 | 엔진의 처리 |
|---|---|
| Call 1 `stance` | **유일한 상태 액추에이터 입력.** (게이트,스탠스) delta 적용 → bucket 해소 → 갱신된 상태로 edge 판정 (스펙 §3 순서 규칙) |
| Call 1 `utterance` | 타임라인에 렌더 + Call 2·3으로 전달 |
| Call 1 `inner_note` | **타임라인에 렌더하지 않는다.** Call 3의 `EXPERIENCED`로만 |
| Call 1 `because_*`·`rejected_*` | raw 로깅만. 게임 로직 입력 아님 |
| Call 2 `timeline_entries`·`npc_lines` | 타임라인에 렌더 → 채굴 대상(W2) |
| Call 3 `facts`·`report_body` | 저장 후 UI로. 엔진 상태와 무관 |

**상태 권한이 없는 것 (스펙 I3/W4)**: 위의 자유 텍스트 전부 —`utterance`,
`inner_note`, `timeline_entries`, `npc_lines`, `facts`, `report_body`. 엔진은 이것들을
읽고 상태를 바꾸지 않는다. 이 성질은 **테스트로 고정할 가치가 있다**(§7).

---

## 4. 엔진 내부에 반드시 있어야 하는 것 — delta journal

**요청의 핵심이자, 나중으로 미룰 수 없는 유일한 항목.**

`SCENE_SYMPTOMS`는 상태의 **레벨**이 아니라 **움직임**에서만 만들어진다. "숨이
가빠졌다"는 fear가 *이번 비트에 올랐다*를 알아야 쓸 수 있고, `fear = 70`이라는
스냅샷만 있으면 표현할 수 없다. 그래서 스펙 §3이 요구하는 것은 상태 스냅샷이 아니라
**비트별 delta journal**이다:

```
{ variable, before, after, cause }
```

여기서 파생되는 요구 두 가지:

1. **증상 렌더러** — journal 항목을 문장으로 바꾸는 결정론 함수. **숫자를 노출하지
   않는다**(스펙 I12). 계약 v1의 미결 #4가 이것이고, 계약이 요청하는 것은 다음
   셋뿐이다: 입력이 journal 항목 배열일 것, 출력이 `string[]`일 것, 같은 입력이 같은
   문장을 낼 것. 문장 저작 방식은 엔진/시나리오 소유.
2. **delta 적용 지점을 한 곳으로** (스펙 §3) — 지금은 실행 등급이 꺼져 있지만,
   나중에 ±α를 끼우려면 적용이 한 이음매에 모여 있어야 한다.

journal은 attributability의 근거이기도 하다 — 점수나 결과가 왜 그렇게 됐는지
설명하지 못하면 그건 버그라는 게 스펙 §2의 입장이다.

---

## 5. 최소 범위에서 **빠지는** 것

범위를 지키기 위해 명시한다. 아래는 지금 만들지 않는다.

- **게이트 그래프** — 게이트 1개면 된다. 다중 게이트 라우팅은 그 다음
- **run score / 엔딩 모델** — 시나리오 선정 후
- **실행 등급(grader)** — 런칭 시 OFF, E-LEV 판정도 "도달 불가"
- **priority-reorder 액추에이터** — C-STRUCT 종료로 **actuator whitelist에서 제외**
  (07-31 결정). 단 기본 프롬프트의 `[우선순위]` 섹션 자체는 존치하며, 이는 프록시
  소유라 엔진과 무관하다
- **세이브/로드, 리플레이**
- **변수 다수** — §3.1의 세 시험(write/read/visible)을 통과하는 최소 집합만.
  게이트 1개면 **스칼라 1~2개 + 플래그 몇 개**로 충분할 것으로 본다

---

## 6. 엔진이 답해 줘야 하는 질문

계약 쪽에서 결정할 수 없고 엔진 명세가 정해야 하는 것들.

1. **최소 변수 집합** — 게이트 1개에서 §3.1 후보 풀 중 무엇을 쓰는가. 각각이 세
   시험(액추에이터가 쓰는가 / 술어나 점수가 읽는가 / 증상으로 보이는가)을 통과하는지
   함께.
2. **증상 렌더러 계약** — journal 항목 → 문장의 구체적 형태. 한 비트에 최대 몇 문장?
   변화가 없는 비트는 빈 배열인가 "(변화 없음)"인가?
3. **콜 실패 시 거동** — 계약 v1 미결 #5. 판단 콜이 끝내 실패하면 기본 스탠스인가,
   비트를 건너뛰는가, 결정론 대체 경로인가? 나레이션·보고서 실패는? **이건 엔진과
   프록시가 함께 정해야 한다** — 프록시는 fallback 메타데이터를 실어 보낼 수 있다.
4. **타임라인 길이 정책** — `TIMELINE_EXCERPT`와 `TIMELINE_TAIL`에 몇 줄을 줄 것인가.
   프롬프트 길이가 지연을 좌우하므로 UI의 pause 구조와 함께 봐야 한다.
5. **라운드의 경계** — 보고서가 라운드당 1회이므로 "라운드"가 몇 비트인지 엔진이
   정의해야 한다. 게이트 1개 = 라운드 1개인가?

### 6.1 비트 경계에는 이미 실측된 제약이 하나 있다

질문 5를 풀 때 지켜야 하는 규칙. 추정이 아니라 프로브로 가른 것이다.

**통제관의 응답을 요구하는 고정 사건 뒤에서 비트를 끊지 않는다.**

Call 2는 `PRESENT_NPCS`의 인물만 말하게 할 수 있고 **통제관은 그 목록에 없다**
(통제관의 발화는 Call 1의 `utterance`다). 그런데 고정 사건이 통제관에게 답을
요구하면 — 예: 발신자가 "…듣고 있어요?"라고 **묻는다** — 대화에는 답할 사람이
필요하고, 모델은 쓸 수 있는 화자 중에서 그 구멍을 메운다. 발신자가 자기 질문에
답하거나(자문자답), 옆에 있던 NPC가 통제관 노릇을 시작한다.

*실측*: 화자 오배정이 v0.1 8/10 → v0.2(반응 생성 계약) 4/5 → v0.3 4/5. v0.3은
**단일 변수 프로브**였다 — 계약 위반이던 `TIMELINE_TAIL`(고정 사건 누락)만 시정하고
나머지를 바이트 동일하게 두었는데 오배정이 그대로 남았다. 원인이 프롬프트 저작이
아니라 비트 경계임을 이 대조가 가른다. 프롬프트 층위 개선은 형태만 바꿨다 — v0.1은
통제관 발화의 축자 복사였고, v0.3은 NPC가 새 대사로 심문한다.

*손상*: NPC가 통제관 자리를 차지하면 **그 발화가 상태를 움직이지 못한다**(I3/W4).
정해권이 대신 심문해서 정보를 얻어내면 서사는 진행되는데 상태는 그대로다 — 스토리와
상태가 갈리는, Call 2의 원래 하드 실패 모드와 같은 손상이다. 게다가 축자 일치만 보는
검출기로는 이 형태를 잡을 수 없다.

*따라서 저작 규칙*: 고정 사건은 **통제관의 응답을 요구하지 않는 형태**로 쓴다
(무언가가 일어나고, 인물들이 반응할 여지를 남기되, 질문을 통제관에게 던지지 않는다).
통제관의 답이 필요한 사건이라면 그것은 그 자체로 게이트이거나, 답이 다음 Call 1의
`utterance`가 되도록 비트를 이어 붙여야 한다.

**단, 이 규칙은 필요하지만 충분하지 않다.** 응답을 요구하지 않는 고정 사건으로 고쳐
재측정하니 자문자답은 완전히 사라졌지만(2/5 → 0/5) 상황실 인물이 회선 상대에게 말을
거는 형태는 2/5로 남았다 — 회선이 열려 있는 한 후속 질문의 자리가 계속 비어 있기
때문이다. 그쪽은 저작이 아니라 **페이로드 구조**로 막았다: 등장 인물을 `side`로
갈라(`line` / `room`) 렌더하고 역할 규칙을 그 라벨에 붙이면 0/5가 된다. 계약 v1 §3
참조. **엔진이 `PRESENT_NPCS`를 조립할 때 `side`를 반드시 채워야 하는 이유가 이것**
— 장식이 아니라 이 실패를 막는 유일하게 작동한 수단이다.

*원자료*: `planning/dday-mechanism/runs/SMOKE-C2v{2,3,4}-narration-J1-calls/`(원인 판별)
· `SMOKE-C2-roleboundary-J1-calls/`(수렴 확인).

---

## 7. 완성 판정 — 무엇이 되면 "최소 엔진"인가

게이트 1개에서 다음이 성립하면 이 요청은 충족된다.

1. **라운드 1회가 끝까지 돈다**: 엔진이 세 콜의 슬롯을 전부 채우고, 세 출력을 전부
   소비하고, 타임라인이 갱신되어 다음 라운드의 입력이 된다.
2. **delta journal이 비트마다 기록된다** — `{variable, before, after, cause}`.
3. **`SCENE_SYMPTOMS`가 journal에서 생성되고, 숫자가 한 개도 들어 있지 않다.**
4. **자유 텍스트가 상태를 움직이지 못한다** — 콜 출력의 자유 텍스트를 임의로 바꿔도
   라우팅과 상태가 동일하다는 테스트가 있다.
5. **순서 규칙이 지켜진다** — delta가 edge 술어보다 먼저 적용된다. 스펙 §3이 "그 자체로
   테스트할 가치가 있다"고 적어둔 항목이다(뒤집어도 결정론처럼 보이므로).
6. **같은 스탠스 + 같은 상태 → 같은 라우팅** (I6).

여기까지 되면 LLM 레이어는 손저작 스텁을 버리고 엔진에 붙을 수 있고, 그 시점에
**프로덕션 페이로드에서의 지연 실측**이 가능해진다 — RUNLOG A4가 요구하고 스펙 §4가
기다리고 있는 숫자다.

---

## 8. 이 요청서가 닫는 것 / 열어두는 것

**닫는다**: 계약 v1의 미결 #4(`SCENE_SYMPTOMS` 계약)와 #5(콜 실패 거동)는 위 §6의
질문 2·3으로 이관됐다 — 엔진 명세가 나오면 계약 쪽에 반영한다.

**열어둔다**: `facts` 시점(#1), 보고 주기 U 추인(#2), 보고서 분량(#3)은 UI 요구에
종속이므로 이 요청서의 대상이 아니다. UI/UX 기획과 함께 닫힌다.
