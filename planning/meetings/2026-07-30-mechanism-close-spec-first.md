# 회의록 — 메커니즘 검증 종료 · 명세-우선 아키텍처 착수

**일시:** 2026-07-30 (목)

## TL;DR

메커니즘 검증 국면을 종료한다. C-STRUCT는 **완전 종료**, C-BLOCK에 남아 있던 추가
검증 대부분도 **생략** — 남은 기간(마감 ~08-10)에 완벽한 게임이 아니라 **작동하는
게임**을 만들기 위해서다. 다음 국면은 구현이 아니라 **명세**: 전체 아키텍처를 확정한
뒤에만 개발을 시작한다. 분담은 **윤석 = LLM Infrastructure / Call Inventory**,
**민서 = Scenario**.

---

## 1. 결정 사항

1. **C-STRUCT 완전 종료.** 양쪽 측정 프로그램(#94 · #95)이 독립적으로 같은 결론에
   수렴했다. "pause"가 아니라 종료이며, 검증되지 않은 매커니즘에 더 이상 콜을 쓰지
   않는다. *(추가: PR #94는 "pause + 재개 조건"으로, #95 REPORT는 "closed"로 적혀
   있다 — 문서 통합 패스에서 "closed"로 통일할 것.)*
2. **C-BLOCK 추가 검증 대부분 생략.**
   - (SKIP) 누적된 프롬프트가 작동하는지(B2 in-situ accumulation)는 검증하지 않는다.
   - (SKIP) 베이스라인 프롬프트 검증은 완료된 것으로 간주한다.
   - *(추가: 이 결정으로 REPORT.md "Open items — collected"의 시험 항목
     T1(B2 누적) · T2(credulity 재실행) · T3(near-axis control) ·
     T4(E-LEV) · T5(E-GOAL 2차 게이트) · T6(E-DISC 동시 주입)과
     휴먼 코딩 H1(B3a blind coding) · H2(B4)가 사실상 닫힌다.
     H3(§9.3 판정은 사람이 카드를 보고 내린다)만 살아 있다 — 이 회의가
     그 판정 자체였다고 볼 수 있다.)*
3. **명세-우선.** 절대 구현·개발·작업부터 시작하지 않는다. 전체 아키텍처를 확정한
   뒤에 개발을 시작한다.
4. **2-track 분담:** 윤석 — LLM Infrastructure / Call Inventory. 민서 — Scenario.

## 2. Project Layer

### 2-1. LLM Infrastructure / Call Inventory

기준 문서: [architecture-spec §4 Call inventory](../../docs/dday-architecture-spec.md#4-call-inventory)

**상황:** `planning/` 쪽 apothecary llm-layer 기반으로 call inventory의 **Call 1
(Judgment)은 이미 구현**되어 있다.

- **할 것 1** — 실제 구현 상태를 확인하고, Call 2(Narration/NPC) · Call 3(Reporter)이
  그 위에 구현 가능한지 검토.
- **할 것 2** — 당장 구현이 안 되면, 구현에 필요한 명세서가 무엇인지 정리.
- **할 것 4 (07-31 추가)** — **Call 2(Narration/NPC) 품질 확인.** Call 2는 스펙상
  load-bearing — 출력이 타임라인에 실려 채굴 대상(W2)이 되므로, 밋밋한 나레이션은
  메커니즘과 무관하게 공급망을 마르게 한다. 확인할 두 속성: 채굴 가능한 산출
  (mineable yield) · 게이트의 고정 NPC 행동을 위반하지 않는 서술(constraint
  compliance). 할 것 1의 구현 검토에 얹는다.
- **할 것 3** — **사실/생각·판단 분리 콜 검토.** 초기 의도: 객관로그에는 **사실**,
  자필 보고서에는 **생각**과 **판단**. 그렇다면 에이전트가 확인한 사실과, 사실을 보고
  내린 생각·판단을 구분하는 별도의 콜이 필요하다. 이 콜은 다른 콜과 달리 시나리오의
  객관적 사실들에 대한 사전 정보(이벤트 로그)를 입력으로 요구한다. **비용·구현
  단순성 검증 필요.**
  - 객관로그를 이벤트 로그 조립만으로 만들 수 없는 이유: NPC 발화처럼 LLM layer를
    타는 **사실**도 있기 때문.
  - 여러 방식을 논의했으나 아무것도 테스트되지 않았으므로, **방식 선정·검증까지
    윤석 담당.** 후보 3안:
    1. **별도 추출 콜** — Input: 자필 보고서 → Output: 추출된 객관 로그 + 추출
       후의 자필 보고서. 분리가 가장 깨끗하지만 라운드당 콜이 하나 늘고
       (비용·지연), 스펙 §4가 "Four call types exist; no others"를 못박고 있어
       **스펙 개정이 선행**되어야 한다.
    2. **Call 3 스키마 확장** — Reporter 출력 스키마에 `facts` 배열 필드를 추가해
       **한 콜 안에서** 사실/보고서를 분리. judgment 콜이 `inner_note`/`stance`/
       `utterance`를 스키마 필드로 분리하는 것과 같은 패턴이고, 이 패턴은 검증
       프로그램 전체에서 작동이 확인됐다. 콜 수·지연·비용 불변, 스펙 개정 불필요.
       리스크: 사실 추출의 품질이 보고서 생성과 한 프롬프트에 묶인다.
    3. **Fallback: 엔진 로그** — 1·2안 모두 실현 가능성이 낮다고 판단되면
       객관로그는 단순 엔진 로그(정해진 타임라인을 보여주는 정도)로 격하.
       LLM layer를 타는 사실(NPC 발화)은 객관로그에서 빠지는 것을 감수.
  - *(추가: 하네스에 `reporter` 콜 타입이 선언만 되고 미가동 상태다
    (`infra/test-harness/lib/calltypes.mjs`, `templates/reporter/` 부재로 E-CONT가
    blocked였음). 할 것 1에서 Call 3 검토 시 이 템플릿을 만들면 하네스에서 바로
    저비용 스모크 테스트가 가능하다.)*

### 2-2. Scenario

- **(COMPLETE)** Agent baseline prompt · Mechanism list & verification.
- 검증된 매커니즘 기반으로 **시나리오 축소 + 재생성**.
  - *(갱신 07-31: 재생성은 「재앙 시나리오 집필 브리프」로 여러 LLM 세션(모델별·
    시나리오별)에서 초안을 병렬 생성 → 팀이 비교해 최종 시나리오 선정 → 선정된
    시나리오의 게이트를 테스트하는 흐름. 브리프 기준: 게이트 5~7 · 인물 12~15 ·
    장소 5~8 · 숨겨진 진실 3~5.)*
- 시나리오에 귀속되는 것:
  - 게이트
  - 게이트별 스탠스
  - NPC 목록
  - NPC variable ([spec §3.1 qualification](../../docs/dday-architecture-spec.md#31-variable-qualification-and-candidate-pool))
- *(추가: 게이트 저작에는 검증 프로그램이 남긴 실전 레시피가 있다 — 두 해석을
  명명하고 각각 별개 스탠스를 갖게 한 뒤 lint-stances.mjs → A10 페이퍼 체크 →
  A8 프롬프트 정독. 그리고 양쪽 프로그램이 남긴 게이트 사망 원인 법칙: escape
  option(도달 가능한 도피 스탠스)과 fixture slack(고정 지문이 게이트보다 강함).)*
- **게이트 검증 수위 (07-31, 민서 결정): 첫 게이트 프로브.** 최종 시나리오 선정
  후 그 시나리오의 첫 게이트에 ~30콜 프로브 — 목적은 그 게이트 하나의 합격이
  아니라 **저작 레시피가 새 시나리오로 전이되는지** 확인(새 고정 지문 = escape
  option · fixture slack 리스크 리셋). 통과하면 나머지 게이트는 무료 체크(lint +
  페이퍼 체크 + 프롬프트 정독)만.
- *(추가: 재료 — 윤석의 `SENTENCE-POOL-DRAFT.md`(#94, 테러 시나리오 문장 풀
  123줄)가 게이트 저작의 원료다. `slice-terror.json` 미편입은 의도된 상태.)*

### 2-3. State Engine

기준 문서: [architecture-spec §3 State engine](../../docs/dday-architecture-spec.md#3-state-engine)

- 명세가 나오면 엔진을 만드는 게 아니라, **최소 규모 엔진에 필요한 것이 무엇인지
  먼저 요청**한 뒤 최소 규모 명세부터 정의한다.
  - 아마 **게이트 한 개 정도를 처리하는 엔진**이 되지 않을까 예상.
  - **Variables**: per-character scalars, knowledge flags, globals, route bookkeeping.
  - **Actuator whitelist**
  - **Per-beat delta journal** (state snapshot이 아니라).
- **우선순위 리스트 완전 제거 (07-31, 민서 결정):** C-STRUCT는 UI 연출로도 다시
  다루지 않는다. 최소 엔진의 actuator whitelist에서 priority-reorder 액추에이터
  제외, UI 작업량에서도 제외. *(주의: REPORT.md의 C-STRUCT closure 카드와 #94는
  "UI flavor로는 출하" 표현을 쓰고 있다 — 문서 통합 패스에서 "완전 제거"로 갱신할
  것.)*

### 2-4. UI/UX

- **UX는 조금 기획 필요.**
- **UI는 추후 합의** — 최대한 AI 사용 (Claude Design / gpt image).
- *(추가: 생성 에셋은 전부 `assets-manifest.json` 등록 대상 — 대회 필수 문서로
  들어간다(repo 하드 룰 5).)*

## 3. 기타

- **PR 머지 순서 합의 완료** — #94에 코멘트로 제안된 방식으로 머지 진행 예정
- **대회 재료:** 서로 독립 설계한 두 측정 프로그램이 같은 두 결론(C-BLOCK 채택 ·
  C-STRUCT 종료)에 수렴 — AI 활용 문서의 핵심 단락감.
- **Call 2(NPC 발화)는 스펙상 load-bearing** — 품질 확인은 윤석의 할 것 4로
  배정됨 (§2-1).

## 4. 열린 질문 — 전부 해소 (07-31, 민서)

- **Q3 — 우선순위 리스트 UI: 완전 제거.** C-STRUCT는 UI 연출로도 다시 다루지
  않는다 (§2-3에 반영).
- **Q4 — Call 2 품질 확인: 윤석 담당.** 할 것 4로 배정 (§2-1).
- **Q5 — 시나리오 규모: 집필 브리프가 규정** (게이트 5~7 · 인물 12~15 · 장소
  5~8). 브리프 문서는 레포에 두지 않고 시나리오 생성 세션이 보유. 최종 시나리오
  선정 시 그 초안과 함께 브리프를 planning/에 아카이브 권장 — AI 활용 문서(대회
  제출물)에 "생성 지시서 → 병렬 초안 → 선정" 과정을 기록할 재료가 된다.
- **Q6 — 아키텍처 확정 데드라인: ~08-02 (이번 주).** 이후 개발 시작.
