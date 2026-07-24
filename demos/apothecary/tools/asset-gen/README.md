# asset-gen — 약방 데모 고정 asset 팩 생성기

`demos/apothecary/assets/`에 들어갈 고정 asset 11장을 생성하는 도구.
스타일·시트 구성·픽셀 파이프라인은 [PRD §2.4](../../PRD.md)에 동결되어 있고,
이 스크립트는 그 스펙의 실행본이다. **파이프라인 런 중에 에이전트가 돌리는 물건이
아니다** — 런 전에 사람이 1회 실행한다.

## 요구사항

- Node 20+ (`fetch` 내장 버전)
- OpenAI API 키 — **개인 키만** (경진대회 규정상 회사 게이트웨이/계정 금지)
- 비용: 11콜, `gpt-image-1` quality=low ≈ **총 $0.2 안팎**, 소요 2–5분

## 실행

```bash
cd demos/apothecary/tools/asset-gen
npm install                                  # sharp (다운스케일 + 컬러키)
OPENAI_API_KEY=sk-... node generate-pack.mjs
```

키는 명령줄 환경변수로만 전달한다. **파일·리포·셸 rc에 저장 금지** (CLAUDE.md rule 6).

특정 asset만 재생성 (품질이 아쉬운 것만 다시 뽑을 때):

```bash
OPENAI_API_KEY=... node generate-pack.mjs --only equip-mortar
```

id 목록: `bg-shop` · `ui-bubble` · `ui-shelf` · `ingredients-1` · `ingredients-2` ·
`equip-teapot` · `equip-pot` · `equip-mortar` · `potions` ·
`fallback-portrait-1` · `fallback-portrait-2`

## 출력물

| 경로 | 내용 |
|---|---|
| `out-pack/<id>.png` | **최종 asset** — ÷4 다운스케일 완료, 스프라이트류는 마젠타 컬러키로 투명화 |
| `out-pack/raw/<id>.png` | 생성 원본 (1024/1536) — 재처리용 보관, 커밋하지 않음 |
| `out-pack/summary.md` | 시간/용량 로그 + **asset별 전체 프롬프트** (manifest 항목 작성용) |

## 생성 후 할 일 (체크리스트)

1. `out-pack/*.png` 눈으로 검수. 특히:
   - 재료 시트: 4열(재료 정체성) × 3행(가득/절반/바닥)이 열 단위로 유지되는가
   - 장비 시트: 4칸에서 기물 위치가 고정인가 (`steps(3)` 루프 애니메이션 전제)
   - 컬러키: 스프라이트 가장자리가 깨끗하게 뚫렸는가 (뚫림 불량 → `--only`로 재생성)
2. 통과분을 `demos/apothecary/assets/`로 복사 (`out-pack/` 자체는 커밋 금지).
3. 리포 루트 `assets-manifest.json`에 파일마다 항목 추가 — `summary.md`에 기록된
   프롬프트를 그대로 `prompt` 필드에 넣는다: `{file, tool: "gpt-image-1",
   prompt, license: "generated for this project"}` (CLAUDE.md rule 5, 예외 없음).
4. 커밋 후 v2 파이프라인 런 진행 (PRD가 assets/ 존재를 전제로 함).

## 파이프라인 개요 (왜 이렇게 뽑는가)

- 스타일 바이블(스타일 E)이 모든 호출의 접두어 → 배경·재료·손님이 같은 톤.
- 1024/1536으로 생성 → **공유 factor 4**로 다운스케일 → 진짜 픽셀 그리드가 생기고
  생성 아티팩트가 사라짐 → 브라우저가 `image-rendering: pixelated`로 확대.
  런타임 손님 시트도 클라이언트에서 같은 factor로 처리되므로 픽셀 밀도가 일치한다.
- 변경 asset(손님 표정 시트)은 이 도구가 아니라 **데모 런타임**이 NPC당 1콜로 생성
  (PRD §2.1/§2.3). 여기의 fallback 초상 2장은 그 타임아웃 대비용이다.
