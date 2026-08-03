# planning/

기획 단계(2026-07-21 ~ 07-28)에서 생산된 자료의 보관소. **DDAY 컨셉 확정**
(07-28 미팅)까지의 과정 기록이며, 이후에는 참조 전용이다 — 현재 상태와 살아있는
문서는 [docs/](../docs/) (시작점: [status.md](../docs/status.md)).

DDAY 트랙의 확정 시점 기록·문서 지도는 [dday-sot.md](./dday-sot.md).

> ⚠️ **`docs/` was renamed on 2026-08-02** onto a `spec-` / `contract-` / `plan-`
> scheme. Files in this archive still link to the old names **on purpose** — these
> are records, and their append-only character is protected by a decision in
> `docs/status.md`. If a `../docs/dday-*.md` link here does not resolve, look it
> up in the redirect table: [docs/README.md](../docs/README.md) §6.

| 폴더 | 내용 |
|---|---|
| `concepts/` | 게임 컨셉 문서 9편 + 템플릿 + darkest-context 브리프 |
| `dday-scenarios/` | DDAY 재앙 시나리오 초안 5편 + 집필 브리프 |
| `paper-tests/` | 페이퍼 테스트 계획 (상점 컨셉, DDAY PoC v1·v2) |
| `dday-poc/` | DDAY PoC 실측 전체 — slice 데이터, RESULTS, 런 원자료 (재현 불가) |
| `research/` | LLM 백엔드(Bedrock)·agent-arena API 리서치 + super-pipeline 게임 확장 스펙 |
| `meetings/` | 미팅 기록 |
| `handoffs/` | 세션 간 핸드오프 문서 |
| `legacy-services/` | 배포되지 않는 백엔드 2종 (apothecary-llm-layer · agent-arena-api) — 참조 전용 |

플레이어블 데모는 루트 `demos/`에 있다 (배포 워크플로가 스캔하는 위치).
