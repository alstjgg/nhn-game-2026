// [e7] — the wiring the live-driver suites would otherwise repeat six times,
// plus the doubles and stream readers they assert through.
//
// Deliberately NOT re-tested downstream of here: the beat schedule (e3), the
// feed builders (e4), the composer's slot assembly (e5) and the transport's
// status grading (e6) each carry their own suite. These files assert what the
// DRIVER adds — the ordered ViewEvent stream, the MembraneOp round-trip, and
// the leak guarantee.
//
// The engine itself is the shipped `createEngine` (`src/engine/index.ts`),
// not a rig-local rebuild of it — `EngineHandle` is a structural superset of
// `EnginePort`, so it plugs in unchanged.
import { createFixtureProvider } from '../../../src/transport/index.ts'
import type { ScorerPort } from '../../../src/driver/ports.ts'
import type { Transport, TransportResult } from '../../../src/transport/index.ts'
import { createComposer } from '../../../src/composer/compose.ts'
import { createBlockStore, createLiveDriver } from '../../../src/driver/index.ts'
import type {
  BeatCursor,
  ComposerPort,
  EnginePort,
  LiveDriver,
  MutableBlockStore,
  ReportSentences,
} from '../../../src/driver/ports.ts'
import { createEngine } from '../../../src/engine/index.ts'
import type { GateView, BeatView, RoundView } from '../../../src/engine/index.ts'
import type {
  CallRequest,
  CallResponse,
  CallType,
  JudgmentResponse,
  NarrationResponse,
  ReporterResponse,
} from '../../../src/shared/contracts.ts'
import type { FeedLine, ViewEvent } from '../../../src/shared/view-driver.ts'
import type { EnginePack } from './pack.ts'
import { reportGuidance, scriptedRound } from './pack.ts'

// ── transports ───────────────────────────────────────────────────────────────

export type SpyTransport = Transport & {
  /** Every `CallRequest` the driver composed, in the order it sent them. */
  sent: CallRequest[]
  types(): CallType[]
}

export function spyOn(inner: Transport): SpyTransport {
  const sent: CallRequest[] = []
  return {
    mode: inner.mode,
    sent,
    types: () => sent.map((request) => request.call_type),
    async send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>> {
      sent.push(request)
      return inner.send(request)
    },
  }
}

/**
 * Fails past the retry budget on `only` (or on everything when it is omitted),
 * with the `x-llm-fallback` outcome shape e6 grades a 504 into.
 */
export function failingTransport(
  only?: CallType,
  code = 'LLM_TIMEOUT',
  responses?: Partial<CallResponse>,
): SpyTransport {
  const fixture = createFixtureProvider(responses)
  const sent: CallRequest[] = []
  return {
    mode: 'live',
    sent,
    types: () => sent.map((request) => request.call_type),
    async send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>> {
      sent.push(request)
      if (only !== undefined && request.call_type !== only) return fixture.send(request)
      return {
        ok: false,
        call_type: request.call_type,
        fallback: true,
        code,
        status: 504,
        requestId: null,
        attempts: 2,
        error: null,
      }
    },
  }
}

/**
 * A transport that **succeeds** and hands back a body the driver cannot use:
 * the fixture's own response with one required field removed.
 *
 * This is the case `!result.ok` cannot see — the proxy answered 200, the call
 * "landed", and the field the call exists to produce is not there. Built by
 * deleting a key off a real body rather than by declaring a fake one, so the
 * result stays a genuine `CallResponse[T]` minus exactly one field.
 */
export function unusableTransport(only: CallType, drop: string): SpyTransport {
  const fixture = createFixtureProvider()
  const sent: CallRequest[] = []
  return {
    mode: 'live',
    sent,
    types: () => sent.map((request) => request.call_type),
    async send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>> {
      sent.push(request)
      const result = await fixture.send(request)
      if (!result.ok || request.call_type !== only) return result
      const body = { ...result.body }
      delete (body as Record<string, unknown>)[drop]
      return { ...result, body }
    },
  }
}

// ── the call-order recorder (A6 · A7) ────────────────────────────────────────

export type CallRecord = { name: string; value: unknown }

export type Recorder = {
  log: CallRecord[]
  names(): string[]
  /** Index of the LAST entry named `name`; −1 when it never ran. */
  last(name: string): number
  /** Index of the FIRST entry named `name`; −1 when it never ran. */
  first(name: string): number
}

export function createRecorder(): Recorder {
  const log: CallRecord[] = []
  return {
    log,
    names: () => log.map((entry) => entry.name),
    last: (name) => log.map((entry) => entry.name).lastIndexOf(name),
    first: (name) => log.findIndex((entry) => entry.name === name),
  }
}

/** Wraps an `EnginePort`, recording every call the driver makes and what it returned. */
export function recordEngine(inner: EnginePort, recorder: Recorder): EnginePort {
  const note = <T,>(name: string, value: T): T => {
    recorder.log.push({ name, value })
    return value
  }
  return {
    current: (): BeatCursor => inner.current(),
    gateView: (): GateView => note('engine.gateView', inner.gateView()),
    beatView: (): BeatView => note('engine.beatView', inner.beatView()),
    roundView: (): RoundView => note('engine.roundView', inner.roundView()),
    feed: (): FeedLine[] => inner.feed(),
    submitStance(response: JudgmentResponse | null): void {
      recorder.log.push({ name: 'engine.submitStance', value: response })
      inner.submitStance(response)
    },
    applyBeatEffects(): void {
      recorder.log.push({ name: 'engine.applyBeatEffects', value: null })
      inner.applyBeatEffects()
    },
    applyNarration(response: NarrationResponse | null): void {
      recorder.log.push({ name: 'engine.applyNarration', value: response })
      inner.applyNarration(response)
    },
    applyReport(response: ReporterResponse | null): ReportSentences {
      recorder.log.push({ name: 'engine.applyReport', value: response })
      return inner.applyReport(response)
    },
    advance: (): boolean => inner.advance(),
  }
}

export function recordComposer(inner: ComposerPort, recorder: Recorder): ComposerPort {
  return {
    judgment(view: GateView, blockIds: string[]): CallRequest {
      recorder.log.push({ name: 'composer.judgment', value: view })
      return inner.judgment(view, blockIds)
    },
    narration(view: BeatView): CallRequest {
      recorder.log.push({ name: 'composer.narration', value: view })
      return inner.narration(view)
    },
    reporter(view: RoundView): CallRequest {
      recorder.log.push({ name: 'composer.reporter', value: view })
      return inner.reporter(view)
    },
  }
}

export function recordTransport(inner: Transport, recorder: Recorder): Transport {
  return {
    mode: inner.mode,
    async send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>> {
      recorder.log.push({ name: `transport.send:${request.call_type}`, value: request })
      return inner.send(request)
    },
  }
}

// ── the rig ──────────────────────────────────────────────────────────────────

export type Rig = {
  driver: LiveDriver
  blocks: MutableBlockStore
  engine: EnginePort
  transport: Transport
  events: ViewEvent[]
}

export type RigOptions = {
  pack?: EnginePack
  run?: number
  transport?: Transport
  responses?: Partial<CallResponse>
  /** The port itself — one definition, so a widened seam reaches the rig too. */
  scorer?: ScorerPort
  /** Wrap the constructed collaborators — used by the recording and leak suites. */
  wrapEngine?: (engine: EnginePort) => EnginePort
  wrapComposer?: (composer: ComposerPort) => ComposerPort
  wrapTransport?: (transport: Transport) => Transport
}

export function makeRig(options: RigOptions = {}): Rig {
  const pack = options.pack ?? scriptedRound()
  const blocks = createBlockStore()
  const baseEngine = createEngine({ pack, run: options.run })
  const engine = options.wrapEngine ? options.wrapEngine(baseEngine) : baseEngine
  const baseComposer = createComposer({ reportGuidance: reportGuidance(), blocks })
  const composer = options.wrapComposer ? options.wrapComposer(baseComposer) : baseComposer
  const baseTransport = options.transport ?? createFixtureProvider(options.responses)
  const transport = options.wrapTransport ? options.wrapTransport(baseTransport) : baseTransport

  const driver = createLiveDriver({
    engine,
    composer,
    transport,
    blocks,
    run: options.run ?? 1,
    scorer: options.scorer,
  })

  const events: ViewEvent[] = []
  driver.subscribe((event) => events.push(event))

  return { driver, blocks, engine, transport, events }
}

/** The safety stop — a driver that never finishes is a bug, not a hang. */
const MAX_STEPS = 64

/** Drives the run to its end and returns every `ViewEvent`, in emission order. */
export async function drain(rig: Rig): Promise<ViewEvent[]> {
  for (let i = 0; i < MAX_STEPS; i += 1) {
    const more = await rig.driver.step()
    if (!more) return rig.events
  }
  throw new Error(`the driver did not finish within ${MAX_STEPS} steps`)
}

// ── stream readers ───────────────────────────────────────────────────────────

export type Span = { beat: number; from: number; to: number }

/** `beat_start` … `beat_end` index spans, in stream order. */
export function beatSpans(events: ViewEvent[]): Span[] {
  const spans: Span[] = []
  let open: { beat: number; from: number } | null = null
  events.forEach((event, index) => {
    if (event.type === 'beat_start') {
      if (open !== null) throw new Error(`beat ${event.beat} opened while ${open.beat} was open`)
      open = { beat: event.beat, from: index }
    } else if (event.type === 'beat_end') {
      if (open === null) throw new Error(`beat_end ${event.beat} with no open beat`)
      if (open.beat !== event.beat) throw new Error(`beat_end ${event.beat} closed ${open.beat}`)
      spans.push({ beat: event.beat, from: open.from, to: index })
      open = null
    }
  })
  if (open !== null) throw new Error('a beat was never closed')
  return spans
}

/**
 * One token per event, collapsing the payload away: `waiting` keeps its `for`
 * and its edge, `feed` keeps its kind. This is the shape A1/A2 assert.
 */
export function shape(events: ViewEvent[]): string[] {
  return events.map((event) => {
    if (event.type === 'waiting') return `waiting:${event.for}:${event.active ? 'on' : 'off'}`
    if (event.type === 'feed') return `feed:${event.line.kind}`
    if (event.type === 'fallback') return `fallback:${event.call}`
    return event.type
  })
}

export function typesOf(events: ViewEvent[]): ViewEvent['type'][] {
  return events.map((event) => event.type)
}

export function feedLines(events: ViewEvent[]): FeedLine[] {
  return events.flatMap((event) => (event.type === 'feed' ? [event.line] : []))
}

/** Every string reachable from a value — the leak suite's haystack. */
export function allStrings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) node.forEach((item) => allStrings(item, out))
  else if (node !== null && typeof node === 'object') {
    for (const value of Object.values(node)) allStrings(value, out)
  }
  return out
}

/** A judgment response whose private half is uniquely traceable. */
export function sentinelJudgment(): JudgmentResponse {
  return {
    inner_note: 'SENTINEL-INNER-NOTE',
    stance: 'hold',
    because_referent: 'SENTINEL-BECAUSE-REFERENT',
    because_block_ids: ['SENTINEL-BECAUSE-BLOCK-ID'],
    rejected_stance: 'SENTINEL-REJECTED-STANCE',
    rejected_reason: 'SENTINEL-REJECTED-REASON',
    utterance: '기록을 남긴다.',
  }
}

export const SENTINELS: readonly string[] = [
  'SENTINEL-INNER-NOTE',
  'SENTINEL-BECAUSE-REFERENT',
  'SENTINEL-BECAUSE-BLOCK-ID',
  'SENTINEL-REJECTED-STANCE',
  'SENTINEL-REJECTED-REASON',
]
