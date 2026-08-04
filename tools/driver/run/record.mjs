// The recorder proper — the transport wrapper, the event reducer, the record
// assembly and the byte-diff. Nothing here computes anything the engine already
// computed; every field below is a copy of something a seam handed over.

import { isAuthoredSentenceId, tryParseSentenceId } from '../../../src/shared/id.ts'

/**
 * The run-record's key order, taken from the schema's `required[]` verbatim
 * (decision 3). Serialization is compared byte for byte, so this order is part
 * of the identity of a run, not a formatting preference.
 */
export const RECORD_KEYS = [
  'run_id',
  'pack_slug',
  'policy',
  'reached_clock',
  'injected_blocks',
  'beats',
  'timeline',
  'reports',
  'score',
  'fallbacks',
]

/** decision 3 — the compared byte string. */
export const serializeRecord = (record) => `${JSON.stringify(record, null, 2)}\n`

/**
 * Seam 2. Wraps a `Transport` and writes down the two payloads the record
 * quotes verbatim: Call 1's `stance` and Call 3's `facts` / `report_body`.
 * The inner result is passed through untouched — a wrapper that reshaped it
 * would be a second transport.
 *
 * `report_body` is copied off the response body, never rejoined from the
 * segmented `Sentence[]` the seam carries: the split is lossy about blank lines
 * and a rejoin would silently rewrite the mining surface.
 */
export function recordingTransport(inner) {
  const calls = { stance: null, facts: null, reportBody: null }

  return {
    calls,
    transport: {
      mode: inner.mode,
      async send(request) {
        const result = await inner.send(request)
        if (result.ok && request.call_type === 'judgment') {
          calls.stance = result.body.stance
        }
        if (result.ok && request.call_type === 'reporter') {
          calls.facts = [...result.body.facts]
          calls.reportBody = result.body.report_body
        }
        return result
      },
    },
  }
}

/**
 * Seam 1. `ViewEvent[]` (plus the binder's `gate_stance` annotation) → the
 * four run-shaped things the stream carries. `beats[]` here has no `deltas`:
 * those are read off the engine's journal, not derived from the stream.
 */
export function reduceEvents(events) {
  const beats = []
  const timeline = []
  const fallbacks = []
  let current = null
  let reachedClock = null

  for (const event of events) {
    switch (event.type) {
      case 'beat_start': {
        current = { beat: event.beat, clock: event.clock, gate: null, stance: null }
        beats.push(current)
        if (event.clock !== null && event.clock !== undefined) reachedClock = event.clock
        break
      }
      case 'gate_stance': {
        if (current !== null) {
          current.gate = event.gate
          current.stance = event.stance
        }
        break
      }
      case 'feed': {
        // decision 7 — every emitted line, no kind filter; empties dropped.
        if (event.line.text.length > 0) timeline.push(event.line.text)
        break
      }
      case 'fallback': {
        fallbacks.push({ beat: event.beat, call: event.call, code: event.code })
        break
      }
      default:
        break
    }
  }

  return { beats, timeline, fallbacks, reachedClock }
}

/**
 * D-3 — the journal's `before`/`after` are `number | boolean`, the schema pins
 * them to `number`. Flags are coerced at this boundary rather than dropped:
 * dropping them would cost attributability, which is the journal's whole point.
 */
const asNumber = (value) => (typeof value === 'boolean' ? (value ? 1 : 0) : value)

const asDelta = (entry) => ({
  variable: entry.variable,
  before: asNumber(entry.before),
  after: asNumber(entry.after),
  cause: entry.cause,
})

/**
 * `injected_blocks[].mined_from_run` — provenance, read off the id, never
 * assumed (review finding B).
 *
 * The schema requires the field and documents `null` as "mined from the script
 * timeline", so `block.mined_from_run ?? null` — over a `Block` that is
 * `{id, text}` and nothing else — asserted *script provenance* for every
 * carried block, including ones minted by a previous run. A definite wrong
 * answer is worse than a loud one.
 *
 * Provenance is recoverable without widening any frozen type, because the id
 * carries it: `src/shared/id.ts`'s grammar is `b-r<run>-<channel><nn>` for a
 * minted sentence and `t<n>` for an authored script event. So:
 *
 *   - authored id  → `null`, which is now *true* rather than a default;
 *   - minted id    → the archived `run_id` of the run named in the id;
 *   - anything else, or a minting run absent from the archive → throw. The
 *     recorder does not guess a run id (same rule as `reached_clock`, D-4).
 *
 * The archive is the run loop's `report_archive`: every run that ended is in
 * it, and only a run that ended can have handed a block to the carry-over.
 * `run_id`s are matched on the `-r<n>` suffix decision 2 mints them with.
 */
export function provenanceOf(block, archive) {
  if (isAuthoredSentenceId(block.id)) return null

  const parsed = tryParseSentenceId(block.id)
  if (parsed === null) {
    throw new Error(
      `injected block ${JSON.stringify(block.id)} belongs to neither the minted nor the ` +
        'authored id family — refusing to record a provenance for it',
    )
  }

  const found = archive.find((runId) => {
    const match = /-r([0-9]+)$/.exec(runId)
    return match !== null && Number(match[1]) === parsed.run
  })
  if (found === undefined) {
    throw new Error(
      `injected block ${JSON.stringify(block.id)} was minted in run ${parsed.run}, which is ` +
        `not in the report archive [${archive.join(', ')}] — refusing to invent a run id`,
    )
  }
  return found
}

/**
 * The record, in `RECORD_KEYS` order. `policy` and `score` are `null` by
 * contract (decisions 5 and 6), not for want of a value.
 */
export function assembleRecord({
  runId,
  packSlug,
  policy,
  reduced,
  journals,
  calls,
  carried,
  archive = [],
}) {
  const deltasByBeat = new Map(journals.map((journal) => [journal.beat, journal.deltas]))

  // Review finding C. `reports` is the Call 3 payload verbatim (A12) and
  // `report_body` has `minLength: 1` in the schema, so a run whose reporter
  // call never landed has no report to record — `{facts: [], report_body: ''}`
  // was a fabrication that no schema accepts and that stage 6 would read as a
  // real, empty report. The fallback itself is already in `fallbacks[]`.
  if (calls.facts === null || calls.reportBody === null) {
    throw new Error(
      `run ${runId}: Call 3 never landed — refusing to record an empty report ` +
        '(the failure is in fallbacks[]; rejoining the segmented sentences is banned by A12)',
    )
  }

  return {
    run_id: runId,
    pack_slug: packSlug,
    policy: policy ?? null,
    reached_clock: reduced.reachedClock,
    injected_blocks: carried.map((block) => ({
      id: block.id,
      text: block.text,
      mined_from_run: provenanceOf(block, archive),
    })),
    beats: reduced.beats.map((beat) => ({
      beat: beat.beat,
      clock: beat.clock,
      gate: beat.gate,
      stance: beat.stance,
      deltas: (deltasByBeat.get(beat.beat) ?? []).map(asDelta),
    })),
    timeline: [...reduced.timeline],
    reports: {
      facts: [...calls.facts],
      report_body: calls.reportBody,
    },
    score: null,
    fallbacks: reduced.fallbacks.map((entry) => ({
      beat: entry.beat,
      call: entry.call,
      code: entry.code,
    })),
  }
}

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The first differing JSON path between two records, or `null` when they agree.
 * A path, never a dump (decision 4): a whole-record diff of a 200-beat run is
 * unreadable and buries the one field that moved.
 *
 * Key *order* is a difference too — it is part of the compared byte string.
 */
export function firstDiff(left, right, path = '$') {
  if (Object.is(left, right)) return null

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return `${path}: length ${left.length} ≠ ${right.length}`
    }
    for (let i = 0; i < left.length; i += 1) {
      const found = firstDiff(left[i], right[i], `${path}[${i}]`)
      if (found !== null) return found
    }
    return null
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)
    if (JSON.stringify(leftKeys) !== JSON.stringify(rightKeys)) {
      return `${path}: key order ${leftKeys.join(',')} ≠ ${rightKeys.join(',')}`
    }
    for (const key of leftKeys) {
      const found = firstDiff(left[key], right[key], `${path}.${key}`)
      if (found !== null) return found
    }
    return null
  }

  return `${path}: ${JSON.stringify(left)} ≠ ${JSON.stringify(right)}`
}
