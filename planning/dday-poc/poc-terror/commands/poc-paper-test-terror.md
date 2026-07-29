---
description: D-Day 시뮬레이션 PoC v2 페이퍼 테스트 실행 — 테러리스트의 전화 슬라이스, haiku (오퍼레이터 모드)
---

> **아카이브 (2026-07-30) — 실행하지 말 것.** 이 커맨드가 §0에서 강제하는
> `sim-field-haiku-*` 에이전트 정의는 `planning/dday-poc/poc-terror/agents/`로
> 이동해 더 이상 서브에이전트로 해석되지 않는다. 해석 실패 상태로 실행하면
> 임의 대체 호출이 일어날 수 있고, 그것이 정확히 §0/현행 §3이 막는 오염
> 경로다. 이 프로그램은 종료됐고, 현행 테스트 하네스는 `infra/test-harness/`다.
> 이 파일은 당시 런 기록(`runs/`)의 자기 서술용으로만 보존한다.

planning/dday-poc/poc-terror/PAPER-TEST.md 를 읽고, 그 지침을 **문자 그대로**
따라 페이퍼 테스트를 실행하라. 세계 데이터는
planning/dday-poc/poc-terror/slice-terror.json.

- 인자가 주어지면 해당 실험만 실행: $ARGUMENTS (예: V0, 또는 "V1 V2 V5")
- 인자가 없으면 PAPER-TEST.md §5의 순서대로 전부 실행하되, 각 실험이 끝날
  때마다 중간 보고를 하고 계속한다. **V0은 선행 게이트다** — 실패 기준에
  걸리면 즉시 멈추고 보고한다. 킬샷(V1·V2·V3)이 실패해도 즉시 멈추고 보고.
- 절대 규칙(§0) 요약: 판단·보고서는 반드시 `sim-field-haiku-*` 전용 정의
  (tools: [], model: haiku)로만 호출하고, 응답의 tool_uses가 0인지 매번
  확인한다. 페이로드에 기질·실험 목적·slice를 노출하지 않는다. 스키마 위반은
  고쳐 쓰지 말고 기록한다(그 자체가 V0 데이터다). 너는 상태 산술과 기록만
  한다. slice 수치 변경 금지.
- 산출물은 planning/dday-poc/poc-terror/runs/ 와 RESULTS.md 에 남긴다.
