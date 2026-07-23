# Doodle Life 실행 기록 — full-max-api-baseline

이 문서는 품질 점수나 평가 척도를 포함하지 않는다. 아래 값과 생성 원문을 직접 보고 판단하기 위한 실행 증거다.

## 조건

- Provider: `openai`
- Autonomy: `full-max`
- Flow: `newcomer`
- 반복: 3회
- 고정 시나리오: `eval-doodle-life-full-max-v1`

## 관측 결과

| Run | 상태 | 결과 | 호출 | 총 토큰 | orchestration wall ms | 단계별 실제 경과 |
|---:|---|---|---:|---:|---:|---|
| 1 | cold | 실패 | 2 | 12,509 | 102,704 | bootstrap 53419ms → doodle-birth 49298ms → newcomer-arrived 51487ms 실패 |
| 2 | warm | 실패 | 1 | 7,725 | 54,759 | bootstrap 54765ms → doodle-birth 48827ms 실패 |
| 3 | warm | 성공 | 8 | 61,647 | 173,029 | bootstrap 57478ms → doodle-birth 45331ms → newcomer-arrived 70247ms |

구조화 출력 성공 1회, 실패 2회.
성공 실행 wall time 원값: [173029].
성공 실행 총 토큰 원값: [61647].

각 `run-XX` 폴더에는 trace, 초기/상호작용 전후 world, 낙서 판독, NPC intent, 제안 장면, critic 결과, 최종 장면과 실행 타임라인이 저장되어 있다. 이미지 base64와 인증 정보는 저장하지 않았다.
