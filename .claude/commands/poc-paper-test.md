---
description: D-Day 시뮬레이션 PoC 페이퍼 테스트 실행 (오퍼레이터 모드)
---

planning/dday-poc/poc/PAPER-TEST.md 를 읽고, 그 지침을 **문자 그대로** 따라
페이퍼 테스트를 실행하라. 세계 데이터는 planning/dday-poc/poc/slice.json.

- 인자가 주어지면 해당 실험만 실행: $ARGUMENTS (예: E1, 또는 "E1 E2 E3")
- 인자가 없으면 PAPER-TEST.md §5의 순서대로 전부 실행하되, 각 실험이 끝날 때마다
  중간 보고를 하고 계속한다. 킬샷 실험(E1·E4·E5)이 실패 기준에 걸리면 즉시 멈추고
  보고한다.
- 절대 규칙(§0)을 요약하면: 판단은 반드시 새 서브에이전트(model: sonnet)가 하고,
  서브에이전트에게는 템플릿 페이로드 외 어떤 컨텍스트도 주지 않으며, 너는 상태
  산술과 기록만 한다. slice.json 수치 변경 금지.
- 산출물은 planning/dday-poc/poc/runs/ 와 RESULTS.md 에 남긴다.
