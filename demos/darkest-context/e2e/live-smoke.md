# Live-mode smoke checklist (human-run)

Automated gates only ever see stub mode: agents have no key, and the deployed
build physically lacks the proxy. This checklist is the other half — the live
path a person walks once, before the bake-off (PRD §5, §7 "Live mode").

## Prerequisites — the automated gates come first

"Pre-bake-off" is an ordering claim: a human only walks this once the
machine-checkable half is already green. Run, in order:

1. `npm ci && npm run build` — the build the deployed demo ships.
2. `npm test` — the whole vitest suite.
3. `npm run test:e2e` — the whole Playwright suite in stub mode (`@live` specs
   are fenced out unless `LIVE=1`). Every PRD §5 must-prove a machine *can*
   judge is proven there; nothing below repeats one of them.
4. `node scripts/gate-secrets.mjs` — the `dist/` secret gate.
5. `node tools/ai-smoke/ai-smoke.mjs` PASSes (one real call per endpoint). That
   proves the vendor path; the items below prove the *game* on it.

If any of 1–4 is red, stop. A live smoke on a build that fails its own stub
gates tells you nothing about live mode.

```bash
cd demos/darkest-context
npm ci
ANTHROPIC_API_KEY=sk-ant-... npm run dev     # key lives only in this process
```

Open the dev URL and play a run. Tick each box; record the result table below.

## Checklist

- [ ] **Boot / health** — DevTools Network shows `GET /ai/health` answering
      `ok: true` with `models.decide = models.stance = claude-sonnet-5`, and the
      run boots in live mode (not the stub fallback).
- [ ] **Live decide** — in the first combat, each unit's turn fires a
      `POST /ai/decide`; the speech bubble text is not any line in
      `data/decisions.json`, and every bubble shows at least one `because` chip
      that resolves to a real sheet item when clicked.
- [ ] **Card changes behaviour** — equip a Prompt card (e.g. 「동료를 먼저」) on a
      unit, re-enter combat, and observe the decision or the cited `because`
      chip change for that unit. The card id appears in the sheet panel.
- [ ] **Gauge-noise turn** — push a unit to gauge ≥70 and observe the noise turn:
      the corrupted judgment shows in the bubble/decision while damage and HP on
      screen still follow real state (INV-4).
- [ ] **Silent fallback on network kill** — set DevTools to Offline (or stop the
      dev server) mid-run: play continues, the unit acts with its 직업 기본 행동
      and a "…" bubble, and **no error text is shown anywhere** (INV-7).
- [ ] **Timeout budget** — decisions land inside the 8000ms live budget; the
      round never visibly blocks waiting for one.
- [ ] **No prose leaves the client** — in the Network tab, the `/ai/decide` and
      `/ai/stance` request bodies contain only ids, numbers and short labels: no
      prompt, no tone, no sheet text (INV-1).
- [ ] **Bundle stays clean** — `npm run build && node scripts/gate-secrets.mjs`
      passes, and `dist/` contains no `/ai/` fetch and no `ANTHROPIC` token, so
      the deployed demo is stub-mode by construction (INV-2).

## Result table

| # | Check | Result (PASS / FAIL) | Notes (latency, screenshot, issue) |
| --- | --- | --- | --- |
| 1 | Boot / health | | |
| 2 | Live decide + because chips | | |
| 3 | Card changes behaviour | | |
| 4 | Gauge-noise turn | | |
| 5 | Network kill → silent stub fallback | | |
| 6 | Timeout budget (8000ms) | | |
| 7 | Request bodies structured only | | |
| 8 | dist bundle secret-free | | |

Date run: ____________  ·  Runner: ____________  ·  Commit: ____________

When something fails upstream, the proxy answers a bare
`upstream rejected the call (<status>)` — it never forwards the vendor body,
which can quote the key and the composed prose back (INV-2). The full detail,
with the key redacted, is printed in the **dev server's own terminal**; read it
there, not in DevTools.

A FAIL on 5 or 7 is release-blocking (INV-1 / INV-7). A FAIL on 3 means the
sheet-assembly rules in `data/prompting.json` are not reaching the model — start
at `composeDecidePrompt` in `server/ai-proxy.mjs`.
