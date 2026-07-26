# Apothecary Lambda/Bedrock Gameplay Verification — 2026-07-26

## Result

The automated C1 → C2 → C3 → closing playthrough passed against the deployed
API Gateway → Lambda → Bedrock Nova path.

- CloudFormation stack: `UPDATE_COMPLETE`
- Lambda state: `Active`
- C2 and C3 dialogue responses: HTTP 200
- `x-llm-fallback`: `false` for both responses
- API `npcLine` values matched the rendered UI
- Dialogue requests per playthrough: 2
- Runtime portrait requests: 0
- Browser console errors: 0
- Playwright page errors: 0
- Closing screen reached

The machine-readable trace is
[network-evidence.json](../../demos/apothecary/e2e/artifacts/live-lambda-2026-07-26/network-evidence.json).

## Verified runtime

| Item | Value |
|---|---|
| Region | `ap-northeast-2` |
| Stack | `nhn-game-llm-layer` |
| API Gateway | `zcyeajmv11` |
| Lambda | `nhn-game-llm-layer-turn` |
| Bedrock model | `global.amazon.nova-2-lite-v1:0` |
| Allowed origin | `https://alstjgg.github.io` |
| Dialogue endpoint | `POST /ai/dialogue` |
| Health endpoint | `GET /ai/health` |

## Automated checks

```bash
cd demos/apothecary
npm run test:e2e:lambda
```

The Playwright run passed one complete game in 15.6 seconds. It advanced
without waiting for the API responses in test code, so the result also verifies
that in-game prefetching applies the pending C2 and C3 responses correctly.

| Customer | Request ID | Fallback | UI match |
|---|---|---:|---:|
| C2 — coughing woman | `BHcZxjcWoE0EMrg=` | false | true |
| C3 — indigestion peddler | `BHcaKhfNIE0EM_A=` | false | true |

Additional checks:

- Health returned HTTP 200 with `dialogue=true` and `portrait=false`
- Exactly two `/ai/dialogue` requests were made
- No `/ai/portrait` request was made
- The final shop-closing state was reached

## Screenshots

| Step | Evidence |
|---|---|
| C1 entrance | [01-c1-entrance.png](../../demos/apothecary/e2e/artifacts/live-lambda-2026-07-26/01-c1-entrance.png) |
| C2 live dialogue | [02-c2-live-dialogue.png](../../demos/apothecary/e2e/artifacts/live-lambda-2026-07-26/02-c2-live-dialogue.png) |
| Revisit overlay | [03-overlap-revisit.png](../../demos/apothecary/e2e/artifacts/live-lambda-2026-07-26/03-overlap-revisit.png) |
| C3 live dialogue | [04-c3-live-dialogue.png](../../demos/apothecary/e2e/artifacts/live-lambda-2026-07-26/04-c3-live-dialogue.png) |
| Final note | [05-final-note.png](../../demos/apothecary/e2e/artifacts/live-lambda-2026-07-26/05-final-note.png) |
| Closing | [06-closing.png](../../demos/apothecary/e2e/artifacts/live-lambda-2026-07-26/06-closing.png) |

## Runtime scope

- C1 starts prefetching the C2 opening dialogue.
- C2 starts prefetching the C3 opening dialogue.
- Bedrock generates the first line and four choices for C2 and C3.
- Later dialogue beats use the authored deck.
- Portraits use pre-generated manifest assets.

## Remaining production checks

1. Repeat the full playthrough from the deployed GitHub Pages site.
2. Run a deliberate Bedrock-failure playthrough to verify deterministic
   fallback behavior.
3. Decide the public-launch authentication and cost limits.
