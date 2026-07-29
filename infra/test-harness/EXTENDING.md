# Extending the harness

The mechanism deep-test is the first program to use this runner, not the last.
This is how to point it at a different test without forking it.

## Mental model

A test is a **(call type × suite)** pair.

| | what it is | where it lives | changing it costs |
|---|---|---|---|
| **suite** | one probe: gate, arms, N, pre-registration | `planning/<program>/suites/*.json` | data only, no code |
| **call type** | one shape of model call: schema, validation, summary | one entry in `lib/calltypes.mjs` + `templates/<dir>/` | ~40 lines |
| **probe kind** | which slots a probe may vary across arms | one entry in `CHANNEL_SLOTS` | 1 line |
| **transport** | how the call reaches a model | one function in `lib/transport.mjs` | ~40 lines |

Everything else — the pre-registration gate, the arm-diff check, the call loop,
the recorder, the CLI — is shared and should not need touching. If a new test
makes you want to edit `run.mjs`, that is worth a second look: it usually means
the thing belongs in a call type instead.

## Recipe A — a new probe, same call type

The common case. Copy a suite, change the data, run it. No code.

```bash
cp planning/dday-mechanism/suites/E0-shape-revalidation.json \
   planning/dday-mechanism/suites/E1-cblock-placebo.json
# edit: experiment, pre_registration, arms (add placebo)
node run.mjs ../../planning/dday-mechanism/suites/E1-cblock-placebo.json --print-prompt=placebo
```

The one thing to get right is `channel`: it decides which slots the arms are
allowed to differ in. Anything else varying across arms aborts the run.

## Recipe B — a new call type

Worked example: the **reporter** call, needed when E-CONT screening tests whether
the agent's self-written report absorbs a contradiction. It emits prose, not a
stance, so it has no tool.

1. Add `templates/reporter/base-v0.4.md` and `user-v0.4.md` with `{SLOT}` markers.
2. Fill in the `reporter` entry already stubbed in `lib/calltypes.mjs`:

```js
const reporter = {
  templateDir: 'reporter',
  slots: ['TEMPERAMENT', 'EXPERIENCED'],
  buildTool: () => null,                    // null ⇒ prose output, no tool forcing
  validate: (text) => {
    const problems = [];
    if (!String(text ?? '').trim()) problems.push('empty report body');
    if (!/^##/m.test(text)) problems.push('no section headings');
    return problems;                        // prefix __soft__ to record without retrying
  },
  summarize: (text) => ({
    body_chars: text.length,
    sentence_count: text.split(/[.!?。]\s/).length,   // feeds the mineability log (§5.3)
  }),
};
```

3. Nothing else changes. `--dry-run` works immediately; add `dryRunPayload` only
   if the generic filler produces something your validator rejects.

**Field order is load-bearing** for tool-output call types. `judgment` fixes
`inner_note → stance → because → rejected → utterance` because the pre-stance
note is deliberation and the post-stance fields are post-hoc readouts. Reordering
is a shape change and needs a re-validation run, not just a code review.

## Recipe C — a new probe kind

Register the slots it may vary:

```js
export const CHANNEL_SLOTS = {
  'C-BLOCK': ['BLOCKS'],
  'MY-PROBE': ['SOME_SLOT'],
};
```

An unregistered `channel` is refused rather than defaulted to "anything goes" —
a permissive default would silently disable the arm-diff check, which is the
harness's main guarantee.

## Recipe D — a new transport

When the proxy backend exists, add it beside `anthropic` and `dryrun`:

```js
async function proxy({ system, user, tool, model, timeoutMs }) { /* … */ }
export const TRANSPORTS = { anthropic, dryrun, proxy };
```

Return the same shape: `{ ok, latency_s, model_reported, stop_reason,
foreign_tool_uses, output_tool_calls, payload, raw }`. Then select it in
`run.mjs` where `transportName` is decided.

Switching transports is a **shape change** — it can alter the generation regime,
so it carries one re-validation probe, exactly as the subagent → API switch did.

## What each planned test needs

| Test | Needs | Effort |
|---|---|---|
| C-BLOCK placebo, negative control, screening (E-DISC/E-CONT judgment leg) | suites | data only |
| **D task** (agent prompt test) — base A/B, temperament lint, conditional compliance, clause collision | suites declaring `D-TEMP` / `D-INCIDENT` | data only; both channels already registered |
| Scenario paper test (workstream P, per-gate isolation) | one suite per gate | data only |
| E-CONT report leg | the `reporter` call type (Recipe B) | ~40 lines |
| Narration call | a `narration` call type | ~40 lines |
| **B2 in-situ full run** | multi-gate sequencing + state carried between calls | see below |

### The one real gap: in-situ runs

Everything above is single-call. B2 needs a *sequence* of gates where each
judgment updates state that conditions the next — which is the deterministic
state engine from the architecture spec, not a test harness concern.

Do not grow `run.mjs` into a game engine. When B2 arrives, the right shape is a
thin driver that owns the state and calls this harness once per gate, reusing
`composeArm` and the recorder. The harness stays a probe runner; the driver owns
the run.

## Invariants a new test type must not break

These are why the harness exists rather than a script per probe. If an extension
needs to violate one, that is a finding to raise, not a flag to add.

1. **No call without a complete pre-registration** — hypothesis, N, drop
   condition. Enforced in `lib/suite.mjs`.
2. **Arms differ only in the declared slot**, verified by diff and not by
   intention.
3. **Models are pinned.** Aliases are rejected; the id is recorded per call
   alongside what the API echoed back.
4. **Artifacts are append-only.** Discards and failures stay in place, flagged.
   The runner refuses to overwrite.
5. **No verdicts in the tooling.** Raw sequences out; humans decide, after blind
   coding.
6. **Dry-run output is stamped** `dry_run: true` and never lands in a `runs/`
   directory.

## Deliberately not abstracted

- **Prompt composition is string templating with `{SLOT}` markers.** No
  conditionals, no loops, no partials. A prompt you cannot read in full by eye
  is a prompt whose diffs you cannot verify — and `--print-prompt` is the
  cheapest bug-catcher in the program.
- **No retry-until-valid on soft problems.** A hallucinated block id is data
  about the mechanism; retrying would erase the observation.
- **No aggregation beyond counts.** Rates, flip percentages, and pass/fail live
  on the verdict card written by a human, because N=3 behind a percentage is how
  a program talks itself into "verified".
