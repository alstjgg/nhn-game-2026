# asset-gen — Darkest Context 데모 asset 도구

`demos/darkest-context/assets/` 팩 생성의 1단계인 **스타일 테스트** 도구.
시트 구성·픽셀 파이프라인은 [PRD §2.8](../../PRD.md)에 동결되어 있다.
**파이프라인 런 중에 에이전트가 돌리는 물건이 아니다** — 런 전에 사람이 실행한다.

## 진행 순서 (playability guide §3)

1. **스타일 테스트** (`style-test.mjs`, 이 문서) — 후보 4종 × 1시트 → 사람이 승자 선택
2. 승자 문장을 `data/generation.json`의 `styleBible`로 동결
3. 본 팩 생성기(`generate-pack.mjs`, 스타일 확정 후 작성) — 10콜 → 검수 → `assets/` 복사 → manifest
4. proxy/adapter + `ai-smoke` PASS → 런 시작

## 스타일 테스트 요구사항

- Node 20+ (`fetch` 내장 버전)
- OpenAI API 키 — **개인 키만** (경진대회 규정상 회사 게이트웨이/계정 금지)
- 비용: 4콜, `gpt-image-1` quality=low ≈ **총 $0.1 안팎**, 소요 1–3분

## 실행

```bash
cd demos/darkest-context/tools/asset-gen
npm install                                  # sharp (다운스케일 + 컬러키)
OPENAI_API_KEY=sk-... node style-test.mjs
```

키는 명령줄 환경변수로만 전달한다. **파일·리포·셸 rc에 저장 금지** (CLAUDE.md rule 6).

특정 후보만 재생성:

```bash
OPENAI_API_KEY=... node style-test.mjs --only C
```

## 후보 4종

테스트 대상은 전 팩에서 가장 깨지기 쉬운 포맷인 **피오나 4×3 영웅 시트**
(걷기 사이클 위치 고정 + 게이지 4단 포즈 + 액션 셀 + 마젠타 컬러키).

| id | 방향 |
|---|---|
| A | apothecary Style E 그대로 — 데모 간 톤 통일 베이스라인 |
| B | Style E + 고딕 던전 팔레트 (횃불 그림자, 웜 액센트 1색) |
| C | 다크 판타지 고대비 — 굵은 검정 외곽선, 탈채도 + 핏빛 액센트 |
| D | 1-bit 계열 — 4색 고딕 팔레트, 실루엣 극대화, 디더링 |

## 판정 체크리스트

`out-style/preview.html`을 열고 (÷4 + 컬러키 + pixelated 적용본) 비교:

1. **걷기 행**: 4프레임에서 몸통 위치가 고정인가 (`steps(4)` 루프 전제 — 최우선)
2. **게이지 행**: 4포즈가 "점점 무너지는 정신 상태"로 순서대로 읽히는가 (스프라이트 크기에서!)
3. **액션 행**: 공격/방어/피격/쓰러짐이 구분되는가 — 특히 방어 (must-prove #2)
4. 컬러키: 가장자리가 깨끗하게 뚫렸는가 (어두운 스타일일수록 마젠타 잔티 확인)
5. 캐릭터가 12칸에서 동일 인물로 유지되는가

승자가 나오면: 해당 스타일 문장을 알려주면 `data/generation.json` 동결 + 본 팩
생성기 작성으로 이어간다. 애매하면 `--only`로 재생성 1–2회까지는 싸다.

## 출력물

| 경로 | 내용 |
|---|---|
| `out-style/<A–D>.png` | ÷4 다운스케일 + 마젠타 컬러키 적용본 (게임에 실릴 형태) |
| `out-style/raw/<A–D>.png` | 생성 원본 1536×1024 — 재처리용, 커밋하지 않음 |
| `out-style/preview.html` | 4후보 나란히 비교 (pixelated 확대) |
| `out-style/summary.md` | 시간 로그 + 후보별 전체 프롬프트 |

`out-style/`은 커밋하지 않는다. 테스트 시트는 데모에 실리지 않으므로
`assets-manifest.json` 항목도 불필요 — 승자 시트를 본 팩에 그대로 쓰게 되는 경우에만
그때 manifest에 올린다.
