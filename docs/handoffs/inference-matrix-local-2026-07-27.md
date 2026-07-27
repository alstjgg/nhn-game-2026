# 로컬 게임 추론 모델/강도 실호출 결과 (2026-07-27)

## 결론

로컬 게임 UI에서 Amazon Nova 2 Lite와 Claude Haiku 4.5를 선택하고,
각 모델을 `낮음`과 `중간` 추론 강도로 한 번씩 AWS Bedrock에 실제
호출했다. 네 요청 모두 HTTP 200, `x-llm-fallback: false`, UI 대사 일치로
완료됐으며 게임도 마지막 영업 종료 화면까지 진행됐다.

테스트 환경은 로컬 Vite 게임과 로컬 HTTP 어댑터를 사용했지만, 대화 생성은
mock이 아니라 `ap-northeast-2`의 AWS Bedrock Converse API를 호출했다.
Anthropic 사용 약관 동의와 Claude Haiku 4.5 모델 사용 권한도 같은 계정에서
활성화한 뒤 실행했다. 인증 정보는 결과 파일에 기록하지 않았다.

## 실행 결과

| 베이스 모델 | 추론 강도 | 고객/입력 | 지연 | 입력 토큰 | 출력 토큰 | fallback | UI 일치 |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| Nova 2 Lite | 낮음 | C2 / 기침 | 7,423 ms | 2,024 | 996 | 없음 | 일치 |
| Nova 2 Lite | 중간 | C3 / 소화 불량 | 29,155 ms | 2,022 | 4,650 | 없음 | 일치 |
| Claude Haiku 4.5 | 낮음 | C2 / 기침 | 18,914 ms | 1,889 | 3,046 | 없음 | 일치 |
| Claude Haiku 4.5 | 중간 | C3 / 소화 불량 | 8,851 ms | 1,906 | 892 | 없음 | 일치 |

각 모델별 한 게임에서 낮음은 C2, 중간은 C3 대화 prefetch에 적용했다.
따라서 같은 강도의 모델 간 비교에는 같은 입력이 사용됐지만, 낮음과 중간은
서로 다른 고객 입력이다. 각 조합을 한 번만 측정했으므로 위 수치는 연결과
UI 반영을 검증하는 실행 증거이며 성능 우열을 통계적으로 결론내리는
벤치마크는 아니다.

## 실제 생성 대사

- Nova 2 Lite / 낮음:
  `요즘 기침이 계속 나와서 밤을 잘 못 자네요.`
- Nova 2 Lite / 중간:
  `요즘은 속이 더부룩하고 얹히는 느낌이 계속 되네요.`
- Claude Haiku 4.5 / 낮음:
  `기침이 좀처럼 멎지 않아요. 요즘 밤마다 더 심해서요.`
- Claude Haiku 4.5 / 중간:
  `사흘 전부터 자꾸만 더부룩한데 어제부턴 트림도 자꾸 나와요.`

## 증적

원본 JSON에는 요청의 `inference.modelId`와 `reasoningEffort`, 전체 응답,
응답 헤더, UI 표시 대사, 요청 수, 콘솔/페이지 오류, 마지막 화면 완료 여부가
들어 있다.

- [Nova 원본 실행 증적](../../demos/apothecary/e2e/artifacts/local-inference-matrix-2026-07-27/nova-2-lite-evidence.json)
- [Nova 낮음 UI](../../demos/apothecary/e2e/artifacts/local-inference-matrix-2026-07-27/nova-2-lite-low-c2.png)
- [Nova 중간 UI](../../demos/apothecary/e2e/artifacts/local-inference-matrix-2026-07-27/nova-2-lite-medium-c3.png)
- [Haiku 원본 실행 증적](../../demos/apothecary/e2e/artifacts/local-inference-matrix-2026-07-27/claude-haiku-4-5-evidence.json)
- [Haiku 낮음 UI](../../demos/apothecary/e2e/artifacts/local-inference-matrix-2026-07-27/claude-haiku-4-5-low-c2.png)
- [Haiku 중간 UI](../../demos/apothecary/e2e/artifacts/local-inference-matrix-2026-07-27/claude-haiku-4-5-medium-c3.png)

낮음 화면에서 패널의 현재 선택이 `중간`으로 보이는 것은 다음 C3 prefetch
설정을 먼저 바꾼 뒤 C2의 낮음 응답이 화면에 등장하기 때문이다. 같은 패널의
실행 기록과 JSON 증적에는 C2 요청이 `낮음`으로 명시돼 있다.

## 실행 명령과 판정

```bash
cd demos/apothecary
npm run test:e2e:inference-local -- --grep "Claude Haiku"
npm run test:e2e:inference-local -- --grep "Amazon Nova"
```

- Claude Haiku 4.5: 1 test passed, 낮음/중간 실제 요청 각 1건
- Amazon Nova 2 Lite: 1 test passed, 낮음/중간 실제 요청 각 1건
- 모델별 `dialogueRequestCount`: 2
- 두 실행 모두 `completedClosing: true`
- 두 실행 모두 `consoleErrors: []`, `pageErrors: []`
- portrait 호출은 사전 생성 자산을 사용해 0건

Haiku의 추론 응답은 Bedrock structured output JSON schema를 사용한다.
최초 스키마 준비 호출은 35,731 ms였고, 이후 게임 실측은 위 표와 같다.
지연 변동을 실제로 관찰할 수 있도록 배포 기본 제한은 API Gateway 24초보다
짧게 유지하고, 비용이 발생하는 이 로컬 검증 설정에만 60~70초 제한을 둔다.

## 회귀 검사

- Lambda 계층: TypeScript 검사 및 Vitest 58/58 통과
- 게임 계층: TypeScript 검사 및 Vitest 1,072/1,072 통과
- 프로덕션 Vite 빌드 통과
- `sam validate --lint` 통과
- 번들 smoke 통과 (`health` 200, 잘못된 dialogue JSON 400)
- 기본 Playwright E2E 112/112 통과
