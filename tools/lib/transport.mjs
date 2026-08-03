// Transports. Pluggable so the same suite can run against the direct API now and
// a proxy endpoint later without touching suites or artifacts.
//
// Why this replaces the old subagent harness: a bare Messages API call is granted
// exactly one tool — the output schema — and has no filesystem, no repo, and no
// session context. Role isolation (deep-test plan §3 rule 1) becomes structural
// rather than a frontmatter setting that may or may not be honored. `tool_uses`
// against anything other than the output tool is therefore 0 by construction, and
// is still recorded per call so the invariant is visible in the data.

const API = 'https://api.anthropic.com/v1/messages';
const VERSION = '2023-06-01';

/** Direct Anthropic API. Key from env only — never a file, never a literal. */
async function anthropic({ system, user, tool, model, maxTokens, timeoutMs }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set (env only — see CLAUDE.md rule 6)');

  const body = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  };
  if (tool) {
    body.tools = [tool];
    body.tool_choice = { type: 'tool', name: tool.name };
  }

  const started = process.hrtime.bigint();
  let res;
  let text;
  try {
    res = await fetch(API, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': VERSION,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    text = await res.text();
  } catch (err) {
    return {
      ok: false,
      latency_s: elapsed(started),
      error: `transport: ${err.message}`,
    };
  }
  const latency_s = elapsed(started);

  if (!res.ok) {
    return { ok: false, latency_s, error: `anthropic ${res.status}: ${text.slice(0, 300)}` };
  }

  const json = JSON.parse(text);
  const blocks = json.content ?? [];
  const toolBlocks = blocks.filter((b) => b.type === 'tool_use');
  const output = toolBlocks.filter((b) => b.name === tool?.name);

  return {
    ok: true,
    latency_s,
    model_reported: json.model,
    stop_reason: json.stop_reason,
    usage: json.usage,
    // Anything the model called that is not the output schema. Structurally
    // impossible here; recorded so the impossibility is auditable.
    foreign_tool_uses: toolBlocks.length - output.length,
    output_tool_calls: output.length,
    payload: tool ? (output[0]?.input ?? null) : blocks.map((b) => b.text ?? '').join(''),
    raw: json,
  };
}

/**
 * Offline transport. Synthesizes a schema-valid payload so composition,
 * arm-diff, validation, and recording can all be exercised without a key or a
 * charge. Every record it produces is stamped dry_run:true — dry data must never
 * be mistakable for measured data.
 */
async function dryrun({ tool, model, dryPayload }) {
  const started = process.hrtime.bigint();
  const payload = dryPayload ?? (tool ? synthesize(tool.input_schema) : '(dry-run prose body)');
  return {
    ok: true,
    latency_s: elapsed(started),
    model_reported: model,
    stop_reason: tool ? 'tool_use' : 'end_turn',
    usage: null,
    foreign_tool_uses: 0,
    output_tool_calls: tool ? 1 : 0,
    payload,
    raw: { dry_run: true },
  };
}

/** Minimal schema-directed filler — enums take their first value. */
function synthesize(schema) {
  if (schema.enum) return schema.enum[0];
  switch (schema.type) {
    case 'object': {
      const out = {};
      for (const [k, v] of Object.entries(schema.properties ?? {})) out[k] = synthesize(v);
      return out;
    }
    case 'array':
      return [];
    case 'string':
      return `(dry-run ${schema.description?.slice(0, 24) ?? 'string'})`;
    default:
      return null;
  }
}

const elapsed = (startedNs) => Number(process.hrtime.bigint() - startedNs) / 1e9;

export const TRANSPORTS = { anthropic, dryrun };
