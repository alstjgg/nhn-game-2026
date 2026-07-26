# Apothecary live-AI smoke test

The live path uses the deployed API Gateway → Lambda → Bedrock service for the
C2 and C3 opening dialogue. Later dialogue is authored, and portraits are
bundled assets.

## Automated Lambda playthrough

Run the dedicated configuration:

```bash
cd demos/apothecary
npm run test:e2e:lambda
```

This test consumes two Bedrock dialogue requests. The regular
`npm run test:e2e` command never selects the Lambda spec.

The automated gate verifies:

- `GET /ai/health` returns `ok=true` and `dialogue=true`
- the app selects the live adapter
- C2 and C3 each use one successful `POST /ai/dialogue` response
- both response lines match the rendered UI
- both responses report `x-llm-fallback=false`
- no runtime portrait request is made
- no browser console or page error occurs
- the game reaches the closing screen

## Deployed Pages check

After deploying the client, play C1 → C2 → C3 → closing from the GitHub Pages
URL and confirm:

- the C2 and C3 opening dialogue renders normally
- the browser reports no CORS or mixed-content error
- each customer uses a bundled portrait
- the final note and closing screen are reachable

## Failure-path check

In a controlled environment, make Bedrock unavailable and repeat the game.
Confirm that authored dialogue is selected without an error screen, spinner,
or unhandled browser error.

## Record

| Date | Environment | Result | Notes |
|---|---|---|---|
| | | | |
