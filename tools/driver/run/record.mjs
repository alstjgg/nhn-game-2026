// The recorder proper — the transport wrapper, the event reducer, the record
// assembly and the byte-diff. Nothing here computes anything the engine already
// computed; every field below is a copy of something a seam handed over.

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
 * The record, in `RECORD_KEYS` order. `policy` and `score` are `null` by
 * contract (decisions 5 and 6), not for want of a value.
 */
export function assembleRecord({ runId, packSlug, policy, reduced, journals, calls, carried }) {
  const deltasByBeat = new Map(journals.map((journal) => [journal.beat, journal.deltas]))

  return {
    run_id: runId,
    pack_slug: packSlug,
    policy: policy ?? null,
    reached_clock: reduced.reachedClock,
    injected_blocks: carried.map((block) => ({
      id: block.id,
      text: block.text,
      mined_from_run: block.mined_from_run ?? null,
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
      facts: calls.facts === null ? [] : [...calls.facts],
      report_body: calls.reportBody === null ? '' : calls.reportBody,
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
