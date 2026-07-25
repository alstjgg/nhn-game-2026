# Initial prompt snapshot

2026-07-25 최초 실행 결과를 프롬프트·Image API 파라미터·키잉 로직 수정 전에
그대로 보존했다.

- model: `gpt-image-1`
- size: `1536x1024`
- quality: `low`
- API `background`: 미지정 (`auto`)
- 처리: 4배 다운스케일 후 전역 톨러런스 컬러키
- `A.png`–`D.png`: 게임 크기 비교본
- API 원본 4장은 저장소 용량을 늘리지 않도록 제거하고 PR #42 코멘트에 첨부
- `preview.html`, `summary.md`: 당시 비교 페이지와 전체 프롬프트

이 스냅샷은 B/C/D의 배경·팔레트 오염과 기존 키잉 결함을 재현하는 기준 자료이므로
후속 생성 결과로 덮어쓰지 않는다.
