# proxy

DDAY's runtime LLM tier: API Gateway → Lambda → Bedrock (haiku). Holds the only
secret in the system, and owns the system prompt layer.

Outside the root install by design (physical architecture §3.3): its own
`package.json`, its own lockfile, its own deploy. `deploy.yml` globs `demos/*/`
and the root, so nothing here can break GitHub Pages.

```bash
cd proxy
npm install
npm run check          # typecheck + tests
npm run sam:validate
```

## State: the call path is wired; it has never touched real Bedrock

Started as a copy of `apothecary-llm-layer` (physical architecture §3.6), which
is a stack that has actually run. What came across works and is under test:

| Real today | File |
|---|---|
| cold-start config validation, fail-closed | `src/config.ts` |
| origin check · content-type gate · body-size limit · base64 bodies | `src/handler.ts` |
| error envelope with `x-request-id`, `x-llm-fallback` | `src/handler.ts` |
| request-envelope validation (`call_type`, `template_version`, `slots`) | `src/handler.ts` |
| SAM stack, IAM for the haiku global profile, log groups, throttling | `template.yaml` |
| post-build bundle smoke | `scripts/bundle-smoke.cjs` |
| **rendering both prompt layers from slot values** | `src/prompt.ts` |
| **the three output schemas + validation** | `src/calls.ts` |
| **Bedrock Converse, forced through the schema** | `src/provider.ts` |

30 tests, all offline. **What has not happened: a single real Bedrock call.**
The provider is a faithful port of one that ran in production, and it is covered
by mocks, but nothing here has been deployed or smoke-tested against AWS. Treat
`npm run aws:preflight` → `sam:build` → `sam:smoke` → deploy as unstarted work.

### The prompt-parity gate

`tests/prompt-parity.test.ts` composes real probe suites through **both**
renderers — `tools/lib/compose.mjs` and `src/prompt.ts` — and requires byte
identity of the system and user messages.

This is the only thing keeping "the mechanism measurements describe the deployed
system" true. The probe cannot call a Lambda offline, so two renderers exist;
edit one and not the other and every measurement silently decouples from what
ships. It is also the one place code here reaches into `tools/` — for the runtime
that is forbidden (physical §3.2), but a drift gate has to see both sides, and
esbuild bundles only `src/handler.ts`, so nothing crosses into the Lambda.

⚠️ Probe channels that inject into a proxy-owned slot — C-STRUCT
(`PRIORITY_LIST`), CREDULITY (`FLAW`), D-INCIDENT (`INCIDENT`) — cannot be run
through this tier at all: it ignores those slots from a client by construction.
Reproducing them against production needs a deploy-time parameter.

### Fallbacks are the engine's, not this tier's

Engine spec §5 gives each call type a fallback, and two of the three need data
only the engine has: Call 1 must use `gates.json`'s authored `default_stance`
(picking the first of the set would be an undeclared baseline — architecture spec
§6.2), and Call 3 fills `facts` from the engine's objective log. Only Call 2's
could be built here. So all three stay on the engine side and this tier reports
failure instead: a non-2xx carrying `x-llm-fallback: true` and `x-fallback-code`.
A malformed *request* is deliberately not flagged that way — otherwise the engine
would absorb a client bug with an authored default and it would never surface.

### `prompts/` is inlined at build time

`src/prompt-bundle.generated.ts` is generated from the `.md` files
(`npm run prompts:bundle`). SAM builds with esbuild, which bundles the module
graph and not the prompts directory, so a runtime `readFileSync` would work
locally and return ENOENT in the Lambda. `--check` runs inside `npm run check`,
so editing a prompt without regenerating fails before deploy — the same gate
`src/shared/datapack.ts` has.

## What changed from the original

- **Haiku only** (game spec §4). The `AllowedProfileMode` parameter, its `Rules`
  block, the four Nova IAM statements, and the `structuredOutputMode` branch are
  gone. The samconfig `[elevated]` profile went with them — it existed solely to
  rewrite the execution role when that parameter changed.
- **One route, not three.** `POST /dday/call` with `call_type` in the body. The
  three call types share auth, validation, timeout, and fallback, and differ only
  in an output schema; three routes would be three copies with one line changed.
- **Bigger limits.** A reporter body is 20–30 sentences and a judgment payload
  carries a timeline excerpt plus mined blocks, so `MAX_TOKENS` goes to 4096 and
  `MAX_BODY_BYTES` to 256 KiB.
- **No `data/` registry.** Apothecary allowlisted game data server-side; DDAY's
  scenario data ships to the browser by design (physical §2 constraint 3).
- **Bootstrap stack reused.** The OIDC provider, deploy roles, and artifact
  bucket are the existing ones — `deploy/github-actions-bootstrap.yaml` was
  deliberately *not* copied. Standing up a second bootstrap is how you get two
  sources of truth for one AWS account.

## `prompts/` — the system layer

```
prompts/<call>/base-v*.md      judgment · narration · reporter
```

Call contracts §6 assigns `FLAW`, `INCIDENT`, and `PRIORITY_LIST` to "the default
prompt authored by the D task", supplied by the **proxy**. These files are that
prompt. Two consequences:

1. **They never enter the browser bundle.** The datapack is readable in devtools
   by design (physical §2 constraint 3); the system prompt is not, and that
   property is worth keeping.
2. **They are not versioned by the client.** `template_version` in a payload
   selects which `base-v*.md` to use; adding a version is a proxy deploy, not a
   bundle rebuild.

The **user layer** lives here too — `prompts/<call>/user-v*.md`. The client posts
slot values and this tier renders both layers (physical architecture §3.10), so
no prompt text reaches the browser at all.

`tools/probe/` and `tools/driver/` read `prompts/` off disk directly. That is a
filesystem read from a sibling directory, not a module import; it ends when the
`proxy` transport lands in `tools/lib/transport.mjs`.
