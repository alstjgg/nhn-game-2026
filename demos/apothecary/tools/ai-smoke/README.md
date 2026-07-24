# ai-smoke — 라이브 AI 경로 사전 검증

v2 파이프라인 런의 에이전트는 API 키가 없어서 라이브 경로를 테스트하지 못한다.
그래서 **런 전에 사람이 이 스크립트를 1회 실행**해 실제 프록시
(`server/ai-proxy.mjs`)를 통과하는 dialogue 1콜 + portrait 1콜을 검증한다.
asset-gen과 같은 원칙: 개인 키만, 키는 명령줄 환경변수로만 (CLAUDE.md rule 6 —
파일·리포·셸 rc 저장 금지).

## 실행 (터미널 2개)

```bash
# 터미널 1 — 키를 실은 dev 서버 (키는 이 프로세스의 env에만 존재)
cd demos/apothecary
npm ci   # 최초 1회
ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... npm run dev

# 터미널 2 — 스모크 (의존성 없음, Node 20+)
cd demos/apothecary
node tools/ai-smoke/ai-smoke.mjs          # dev 서버 포트가 다르면 --port 5174
```

비용: dialogue 1콜(claude-sonnet-5) + portrait 1콜(gpt-image-1 low) ≈ **몇 센트**.

## 무엇을 검증하나

1. `/ai/health` — 두 키가 dev 서버 env에 실렸는지
2. `/ai/dialogue` — 실제 손님 대사 + 선택 카드 4장이 스키마대로 오는지,
   4개 verb(우회/직접/관찰/조제)가 모두 등장하는지
3. `/ai/portrait` — 4×2 표정 시트가 생성되는지 → `out/portrait-sheet.png`
   (커밋 금지, gitignore 됨)로 저장되니 **눈으로 스타일 E가 맞는지 확인**

`PASS`가 뜨면 라이브 경로 검증 완료 — v2 런을 발사해도 된다.
portrait 소요시간이 함께 출력되는데, 이 실측값이 PRD §2.3의 프리페치/25초
폴백 설계가 현실적인지 판단하는 근거가 된다 (1~2분대라도 정상: 프리페치 창이
직전 손님의 대화 전체이므로).

## 실패하면

- `dev 서버에 연결할 수 없음` → 터미널 1이 떠 있는지, 포트 확인
- `NO KEY` → 키를 `npm run dev` **앞에** 환경변수로 붙였는지 확인
- `HTTP 401/403` → 키 자체 문제 (개인 키인지, 크레딧 있는지)
- 스키마/verb 실패 → `out/`·출력 JSON을 그대로 복사해 이슈로 공유
