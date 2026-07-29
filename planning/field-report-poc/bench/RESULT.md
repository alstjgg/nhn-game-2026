<!-- 자동 생성: bench.mjs · region=ap-northeast-2 · samples=5 · 2026-07-28T14:05:15.118Z -->

| 모델 | 공급자 | 추론강도 | 기전 | 양식 | n | 지연 p50 | min~max | 출력토큰 | 실패 누락률 | 허위 달성주장 | JSON 준수 | 에러 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Claude Haiku 4.5 | Anthropic | 낮음 | thinking | 칸 없음 | 5 | 2239ms | 2208~2415ms | 153 | 0% | 0% | 100% | 0 |
| Claude Haiku 4.5 | Anthropic | 낮음 | thinking | v1 느슨 | 5 | 2706ms | 2477~2811ms | 219 | 0% | 0% | 100% | 0 |
| Claude Haiku 4.5 | Anthropic | 낮음 | thinking | v2 강제 | 5 | 2916ms | 2680~8121ms | 262 | 0% | 0% | 100% | 0 |
| Claude Haiku 4.5 | Anthropic | 보통 | thinking | 칸 없음 | 5 | 14588ms | 12345~26870ms | 1916 | 20% | 0% | 80% | 0 |
| Claude Haiku 4.5 | Anthropic | 보통 | thinking | v1 느슨 | 5 | 13582ms | 10421~18781ms | 1701 | 0% | 0% | 100% | 0 |
| Claude Haiku 4.5 | Anthropic | 보통 | thinking | v2 강제 | 5 | 12035ms | 9825~16869ms | 1361 | 0% | 0% | 100% | 0 |
| Claude Sonnet 4.6 | Anthropic | 낮음 | effort | 칸 없음 | 5 | 3220ms | 2667~4164ms | 129 | 0% | 0% | 100% | 0 |
| Claude Sonnet 4.6 | Anthropic | 낮음 | effort | v1 느슨 | 5 | 4372ms | 4230~4634ms | 220 | 0% | 0% | 100% | 0 |
| Claude Sonnet 4.6 | Anthropic | 낮음 | effort | v2 강제 | 5 | 5092ms | 4640~6306ms | 265 | 0% | 0% | 80% | 0 |
| Claude Sonnet 4.6 | Anthropic | 보통 | effort | 칸 없음 | 5 | 3325ms | 3019~4046ms | 148 | 0% | 0% | 100% | 0 |
| Claude Sonnet 4.6 | Anthropic | 보통 | effort | v1 느슨 | 5 | 5156ms | 4556~5287ms | 244 | 0% | 0% | 100% | 0 |
| Claude Sonnet 4.6 | Anthropic | 보통 | effort | v2 강제 | 5 | 5618ms | 4677~6292ms | 284 | 0% | 0% | 100% | 0 |
| Amazon Nova 2 Lite | Amazon | — | none | 칸 없음 | 5 | 969ms | 799~1053ms | 124 | 0% | 0% | 100% | 0 |
| Amazon Nova 2 Lite | Amazon | — | none | v1 느슨 | 5 | 1104ms | 1040~1298ms | 168 | 0% | 0% | 100% | 0 |
| Amazon Nova 2 Lite | Amazon | — | none | v2 강제 | 5 | 1242ms | 1188~1639ms | 173 | 0% | 0% | 100% | 0 |
| Amazon Nova Micro | Amazon | — | none | 칸 없음 | 5 | 657ms | 618~1036ms | 164 | 0% | 0% | 100% | 0 |
| Amazon Nova Micro | Amazon | — | none | v1 느슨 | 5 | 864ms | 626~1333ms | 195 | 20% | 0% | 100% | 0 |
| Amazon Nova Micro | Amazon | — | none | v2 강제 | 5 | 852ms | 692~1117ms | 242 | 0% | 0% | 100% | 0 |

합격선 — 칸없음/느슨 누락률 ≥ 70% · 강제 누락률 ≤ 10% · JSON 준수 ≥ 95%.
누락률 = 산문이 실패를 전혀 드러내지 않은 비율. raw/ 에서 육안 검수 필수.
