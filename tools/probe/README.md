# tools/probe

Probe runner for DDAY test programs. Zero dependencies, plain Node ≥24.

First consumer is the [mechanism deep-test plan](../../docs/plan-mechanism-test.md)
— see its §8 for the operating procedure. The runner is built to outlive that
program: [**EXTENDING.md**](./EXTENDING.md) covers pointing it at other tests,
with worked recipes and what each planned test still needs.

## What is and is not in here

Experiment vocabulary — arm, channel, pre-registration, placebo, drop condition
— lives **only** under `probe/`. What used to sit beside it and does not belong
to an experiment has moved out:

| Was | Now | Why |
|---|---|---|
| `templates/*/base-*.md` | `proxy/prompts/` | the production system layer; call contracts §6 makes the proxy its supplier |
| `templates/*/user-*.md` | `proxy/prompts/` | the proxy renders both layers (physical §3.10) |
| `templates/*/temperament/` | `fixtures/temperament/` | probe fixtures. The production source of truth is `data/scenario/<slug>/temperament.json` |
| `lib/compose.mjs` | `tools/lib/compose.mjs` | prototype of `src/composer/`, shared with the driver |
| `lib/calltypes.mjs` | `tools/lib/calls.mjs` | the three calls' contracts, shared with the driver |
| `lib/transport.mjs` | `tools/lib/transport.mjs` | shared with the driver |
| `drive-beat.mjs` | `tools/driver/` | a full-run driver in embryo, not a probe |
| `CHANNEL_SLOTS` + `verifyArmDiff` | `lib/armdiff.mjs` | probe-only; a production composer has no second arm |

## Why not subagents

The prior program ran judgment calls as Claude Code subagents with `tools: []` in
frontmatter. Three problems, all structural:

1. **`tools: []` was not reliably honored.** The agent registry reported those
   definitions as having *all* tools — i.e. filesystem access — which is the exact
   vector behind the 2026-07-28 contamination incident that plan §3 exists to
   prevent. Role isolation was a setting, not a guarantee.
2. **A subagent cannot be forced through a tool-use schema.** Forcing needs a
   tool; `tools: []` removes tools. So the "production call shape" that plan §8
   step 4a re-validates was unreachable, and the workaround was text JSON —
   which the model wrapped in a code fence 74/74 times.
3. **Latency and model were unmeasurable.** The Agent tool reports neither, so
   prior metrics recorded `"model": "haiku"` — an alias, not a reproducible id.

A direct Messages API call fixes all three. It is granted exactly one tool (the
output schema) and has no filesystem, no repo, and no session context, so
isolation is a property of the transport rather than a frontmatter field. Latency
is wall-clocked; the model id is pinned in the suite and echoed back by the API.

The old definitions are archived, not deleted, next to the runs they produced:
`planning/dday-poc/poc/agents/` (v1, sonnet) and
`planning/dday-poc/poc-terror/agents/` (v2, haiku).

## Quickstart

```bash
node tools/probe/lib/selftest.mjs                                    # offline, no key
node tools/probe/run.mjs <suite.json> --print-prompt=live            # eyeball the payload, free
node tools/probe/run.mjs <suite.json> --dry-run --out=/tmp/dry       # whole pipeline, no charge
export ANTHROPIC_API_KEY=...                             # env only, never a file
node tools/probe/run.mjs <suite.json>                                # spends calls
```

Do the first three before the fourth every time. `--print-prompt` is the cheapest
bug-catcher in the program: most authoring mistakes are visible in the composed
text.

Paper lints, also free — run them on the suite before any of the above:

```bash
node tools/probe/lint-stances.mjs <suite.json>   # stance labels vs the fixture temperament (A12)
node tools/probe/lint-beat.mjs <suite.json>      # narration: speaker closure · beat boundary · I12
```

Both flag rather than block. Why these come first, and the full list of free
checks, is in [EXTENDING.md § Paper gates](./EXTENDING.md#paper-gates--run-these-before-spending-a-call)
— the short version is that a question the suite file already answers should
never be bought with a call.

### Options

| flag | effect |
|---|---|
| `--dry-run` | no network, no key, no charge; synthesized payloads, every record stamped `dry_run: true` |
| `--print-prompt=ARM` | compose one arm, print system + user, exit |
| `--arm=NAME` | run one arm instead of all |
| `--n=N` | override `pre_registration.n_per_arm` |
| `--out=DIR` | artifact directory (default `planning/dday-mechanism/runs/<EXP>-calls`) |
| `--max-retries=N` | schema retries per call slot (default 2) |
| `--force` | replace existing artifacts — only for a run that aborted |

## What it refuses to do

The run sheet (plan §7.3) is enforced, not suggested. A run aborts before
spending a single call if:

- **the pre-registration is incomplete** — no hypothesis, no `n_per_arm`, or no
  `drop_condition` means no run (§9.1). Writing the drop condition before the
  data is free; it is also the only thing standing between a result and a
  rationalization.
- **the model is an unpinned alias** — `"haiku"` is rejected, `"claude-haiku-4-5-20251001"` accepted.
- **there is no `baseline` arm.**
- **the arm diff is dirty** — every arm is composed twice, once with its
  channel's permitted slots replaced by a sentinel, and the sentinel versions
  must be byte-identical. This is plan §7.3 step 2's "verified by diff, not by
  intention" made mechanical: if a probe varies anything outside its channel's
  slot, the result would be unattributable, so the runner stops.

A missing `placebo` arm warns rather than blocks — a shape re-validation
legitimately has none, and the pre-registration sheet is the authority.

Per call it records `latency_s`, `stop_reason`, `schema_retries`,
`foreign_tool_uses`, the pinned and reported model, template version, and
temperament id. A response that fails hard validation is **discarded, re-called,
and kept in place** flagged (§3 rule 2, §7.3 step 4). A hallucinated block id is
recorded as *soft* — it is data about the mechanism, so retrying would erase the
observation.

## What it deliberately does not do

No verdicts, no pass/fail, no flip rates in the summary. It prints raw stance
sequences because that is what the verdict card wants (§9.2), and because blind
coding (§5.2 B3) has to happen before any gate/texture/drop call. Aggregation
that hides N behind a percentage is the failure mode this program is built
against.

It also does not do reachability audits (B1) or discoverability probes (B4) —
both are paper instruments with zero calls.

## Suite anatomy

Suites are data, under `planning/dday-mechanism/suites/`. See
`E0-shape-revalidation.json` for a worked one.

```jsonc
{
  "experiment": "E0-shape-revalidation",   // artifact directory name
  "call_type": "judgment",                 // key in tools/lib/calls.mjs
  "channel": "C-BLOCK",                    // decides which slots may vary
  "template_version": "v0.4",
  "model": "claude-haiku-4-5-20251001",    // pinned
  "temperament": "k1",                     // fixtures/temperament/<id>.md
  "pre_registration": {
    "hypothesis": "…gate standard form…",
    "n_per_arm": 3,
    "drop_condition": "…the result that would make us drop this…",
    "contingencies": ["…"]
  },
  "slots": { /* shared, frozen across arms */ },
  "arms": {
    "baseline": { "BLOCKS": [] },
    "live":     { "BLOCKS": [{ "id": "f_script", "text": "…" }] },
    "placebo":  { "BLOCKS": [{ "id": "f_placebo", "text": "…" }] }
  }
}
```

An arm entry overrides `slots`. That override *is* the injection, and it is what
the diff check polices — so an arm may only override slots its channel owns
(`CHANNEL_SLOTS` in `lib/armdiff.mjs`, mirroring plan §7.2).

## Adding a test type

Summary below; the full guide with worked recipes is [EXTENDING.md](./EXTENDING.md).

A test type is a **(call type × suite)** pair. Suites are data and need no code.
A new *call type* is one entry in `tools/lib/calls.mjs` plus the two prompt files:

```js
const myCall = {
  promptDir: 'mycall',            // <proxy>/prompts/mycall/base-*.md + data/prompts/mycall/user-*.md
  slots: ['TEMPERAMENT', /* … */],// composer errors on any slot left unfilled
  buildTool(suite) { /* tool schema, or null for prose output */ },
  validate(payload, { suite, arm }) { /* → problem strings; __soft__ = record, don't retry */ },
  summarize(payload, { suite, arm }) { /* → fields for metrics-*.json */ },
  dryRunPayload(suite, arm) { /* optional offline stand-in */ },
};
```

`run.mjs`, the arm-diff check, the recorder, and the CLI are untouched. The
`narration` and `reporter` call types are wired this way (templates at
`prompts/narration/` and `prompts/reporter/`, both v0.1) — their contracts,
and the decisions behind their field lists, live in
[docs/contract-calls.md](../../docs/contract-calls.md). First smoke
suites: `planning/dday-mechanism/suites/SMOKE-C2*-narration-J1.json` and
`SMOKE-C3-reporter-J1.json`.

Two things to keep in mind when adding one:

- **Field order in `input_schema.properties` is the generation order.** `judgment`
  fixes `inner_note → stance → because_referent → because_block_ids →
  rejected_stance → rejected_reason → utterance` for a reason
  (§7.1): the pre-stance note is deliberation, the post-stance fields are
  post-hoc readouts. Reordering is a shape change and needs a re-validation run.
- **Register a channel → slot mapping** in `CHANNEL_SLOTS`, or the diff check
  will refuse the suite rather than silently permit everything.
