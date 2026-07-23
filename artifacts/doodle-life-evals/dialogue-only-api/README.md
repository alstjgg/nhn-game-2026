# Doodle Life 실행 기록 — dialogue-only-api

이 문서는 품질 점수나 평가 척도를 포함하지 않는다. 아래 값과 생성 원문을 직접 보고 판단하기 위한 실행 증거다.

## 조건

- Provider: `openai`
- Autonomy: `dialogue-only`
- Flow: `newcomer`
- 반복: 3회
- 고정 시나리오: `eval-doodle-life-dialogue-only-v1`

## 관측 결과

| Run | 상태 | 결과 | 호출 | 총 토큰 | orchestration wall ms | 단계별 실제 경과 |
|---:|---|---|---:|---:|---:|---|
| 1 | cold | 성공 | 3 | 18,373 | 96,598 | bootstrap 53880ms → doodle-birth 40796ms → newcomer-arrived 1949ms |
| 2 | warm | 성공 | 3 | 18,732 | 102,509 | bootstrap 49221ms → doodle-birth 51359ms → newcomer-arrived 1946ms |
| 3 | warm | 성공 | 3 | 17,893 | 96,046 | bootstrap 52826ms → doodle-birth 41377ms → newcomer-arrived 1856ms |

구조화 출력 성공 3회, 실패 0회.
성공 실행 wall time 원값: [96598,102509,96046].
성공 실행 총 토큰 원값: [18373,18732,17893].

각 `run-XX` 폴더에는 trace, 초기/상호작용 전후 world, 낙서 판독, NPC intent, 제안 장면, critic 결과, 최종 장면과 실행 타임라인이 저장되어 있다. 이미지 base64와 인증 정보는 저장하지 않았다.
