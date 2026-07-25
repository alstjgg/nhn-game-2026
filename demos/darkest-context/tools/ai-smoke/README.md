# ai-smoke — pre-run verification of the live AI path

Pipeline agents have no API key, so they can never execute the vendor call. This
tool is how a **person** verifies it, once, before trusting the live half of the
seam — and how **agents** still gate the structure around it without a key.

Both halves run the shipped code: the tool imports `server/ai-proxy.mjs` and
`src/ai/contract.ts` directly, so a composed prompt or a schema gate seen here is
the one the dev server uses.

## Dry run (no key, no dev server, no cost)

```bash
cd demos/darkest-context
node tools/ai-smoke/ai-smoke.mjs --dry-run
```

Prints, for `/ai/decide` and `/ai/stance`: the structured request body the client
posts (ids, numbers, short labels only — the membrane, INV-1), the forced tool
schema with its `because` enum, and the prose the proxy composes server-side.
Exit code 0 means the structure is sound. `--dry-run` never prints the key, and
does not care whether one is exported.

Until u4 ships `data/heroes.json` / `data/cards.json`, the tool falls back to
`tools/ai-smoke/dry-run-fixture.json` and says so in its first lines.

## Live run (personal key, two terminals)

```bash
# Terminal 1 — dev server carrying the key. The key exists only in this
# process's env: never in a file, the repo, or a shell rc (CLAUDE.md rule 6).
cd demos/darkest-context
npm ci                                  # first time only
ANTHROPIC_API_KEY=sk-ant-... npm run dev

# Terminal 2 — one real call per endpoint
cd demos/darkest-context
node tools/ai-smoke/ai-smoke.mjs        # --port 5174 if vite picked another port
```

Checks, in order:

1. `GET /ai/health` — is `ANTHROPIC_API_KEY` in the dev server's env, and which
   models are wired (`claude-sonnet-5` for both endpoints)
2. `POST /ai/decide` — one real combat decision, gated by the shared
   `isAgentDecision` validator, `because` ids resolved against the sheet
3. `POST /ai/stance` — the same for a council vote

Cost: two `claude-sonnet-5` calls, a fraction of a cent. `PASS` means the live
path works end to end; run `e2e/live-smoke.md` next for the in-game checks.

Requires Node 22.18+ (the tool and the proxy import `src/ai/contract.ts`
directly, which relies on Node's built-in TypeScript type stripping).

## When it fails

- `cannot reach the dev server` → terminal 1 is not up, or the port differs
- `the dev server process has no ANTHROPIC_API_KEY` → the key must be exported
  **in front of** `npm run dev`, not in terminal 2
- `HTTP 401/403` → the key itself (personal key? credit left?)
- `HTTP 503 … ai data unavailable` → `data/heroes.json` / `data/cards.json` are
  missing; the proxy refuses to guess rows
- `answer failed the shared schema gate` → paste the printed body into an issue;
  it means the tool schema and the validator disagree
