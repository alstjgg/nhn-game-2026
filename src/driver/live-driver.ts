/**
 * The live driver — engine + composer + transport, bound for real, speaking the
 * §5.2 seam: `ViewEvent`s out, `MembraneOp`s in.
 *
 * The whole file is one ordering, and the ordering is the contract:
 *
 * ```
 * beat_start
 *   gate beat only:  waiting(judgment,on) → [fallback] → waiting(judgment,off)
 *   engine.applyBeatEffects()            → feed…        (the pre-narration flush)
 *   waiting(narration,on) → [fallback]   → waiting(narration,off)
 *   engine.applyNarration()              → feed…        (the post-narration flush)
 * beat_end
 *   round's last beat:  waiting(report,on) → [fallback] → waiting(report,off) → report
 * ```
 *
 * Four properties it holds, each of which is a test:
 *
 * 1. **It wraps, never mints** (decision 1). `engine.feed()` returns this beat's
 *    lines with ids already minted; the driver keeps a cursor and emits only the
 *    tail on each flush. That cursor is what splits a beat into the two flushes.
 * 2. **`beatView()` is never taken early** (contract §6, spec-engine §4.2). It is
 *    read inline as Call 2's argument, after the beat's effects have landed —
 *    never held from an earlier beat, never captured before `applyBeatEffects`.
 * 3. **`waiting` brackets the transport call only** (decision 4). Composition is
 *    synchronous and unobservable, so leaving it outside the bracket keeps the
 *    pause structure independent of composer timing. A failed call emits its
 *    `fallback` *inside* the bracket (decision 5) and the run continues.
 * 4. **Recovery is the engine's, never the driver's** (spec-engine §5). The
 *    driver branches once, on `result.ok`, and hands the engine `null` — it does
 *    not know what a default stance is, and `gateView()` does not expose one.
 *
 * No `meta` event is emitted here (decision 2): the dependency direction is
 * runloop → driver, so that channel is folded on above this module.
 */

import type { CallRequest, CallResponse, CallType } from '../shared/contracts.ts'
import type { MembraneOp, ViewEvent } from '../shared/view-driver.ts'
import type {
  BlockStore,
  LiveDriver,
  LiveDriverDeps,
  OpAck,
  ViewListener,
} from './ports.ts'
import { createBlockStore } from './blocks.ts'
import { createEmitter } from './emitter.ts'
import { createMembrane } from './membrane.ts'

/** Which pause the player is shown, per call number (§5.2's `for`). */
const WAITING_FOR = {
  1: 'judgment',
  2: 'narration',
  3: 'report',
} as const

type CallNumber = 1 | 2 | 3

/** Any of the three response bodies — narrowed below by the field only it has. */
type AnyBody = CallResponse[CallType]

function readJudgment(body: AnyBody | null): CallResponse['judgment'] | null {
  if (body === null) return null
  return 'stance' in body ? body : null
}

function readNarration(body: AnyBody | null): CallResponse['narration'] | null {
  if (body === null) return null
  return 'timeline_entries' in body ? body : null
}

function readReporter(body: AnyBody | null): CallResponse['reporter'] | null {
  if (body === null) return null
  return 'report_body' in body ? body : null
}

export function createLiveDriver(deps: LiveDriverDeps): LiveDriver {
  const { engine, composer, transport, scorer } = deps
  const blocks = deps.blocks ?? createBlockStore()
  const membrane = createMembrane(blocks)
  const emitter = createEmitter()
  const run = deps.run ?? 1

  /** How many of this beat's feed lines have already been emitted (decision 1). */
  let cursor = 0
  let beatIndex = 0
  let ended = false
  let finished = false
  let stepping = false

  const emit = (event: ViewEvent): void => {
    emitter.emit(event)
  }

  /** Emits the tail of this beat's feed and moves the cursor past it. */
  function flush(): void {
    const lines = engine.feed()
    for (let i = cursor; i < lines.length; i += 1) {
      const line = lines[i]
      if (line === undefined) continue
      blocks.absorbLine(line)
      emit({ type: 'feed', line })
    }
    cursor = lines.length
  }

  /**
   * One transport round-trip inside its `waiting` bracket. Returns the body, or
   * `null` when the call did not land — the engine decides what `null` means.
   */
  async function call(number: CallNumber, request: CallRequest): Promise<AnyBody | null> {
    const waitingFor = WAITING_FOR[number]
    emit({ type: 'waiting', active: true, for: waitingFor })
    const result = await transport.send(request)
    if (!result.ok) {
      emit({ type: 'fallback', call: number, code: result.code, beat: beatIndex })
    }
    emit({ type: 'waiting', active: false, for: waitingFor })
    return result.ok ? result.body : null
  }

  /** Fires exactly once, whichever path reaches the end of the run. */
  function finish(): void {
    if (finished) return
    finished = true
    ended = true
    if (scorer !== undefined) {
      const score = scorer.score()
      emit({ type: 'score', total: score.total, rows: score.rows })
    }
    emit({ type: 'run_end', run })
  }

  async function step(): Promise<boolean> {
    if (ended) return false
    stepping = true
    try {
      const beat = engine.current()
      beatIndex = beat.index
      cursor = 0
      emit({ type: 'beat_start', beat: beat.index, clock: beat.clock })

      if (beat.kind === 'gate') {
        const judgment = await call(1, composer.judgment(engine.gateView(), membrane.deployed()))
        engine.submitStance(readJudgment(judgment))
      }

      engine.applyBeatEffects()
      flush()

      const narration = await call(2, composer.narration(engine.beatView()))
      engine.applyNarration(readNarration(narration))
      flush()

      emit({ type: 'beat_end', beat: beat.index, clock: beat.clock })

      if (beat.isRoundLast && beat.roundIndex !== null) {
        const reporter = await call(3, composer.reporter(engine.roundView()))
        const report = engine.applyReport(readReporter(reporter))
        blocks.absorbSentences(report)
        emit({
          type: 'report',
          round: beat.roundIndex,
          facts: report.facts,
          report_body: report.report_body,
        })
      }

      if (membrane.ending() || !engine.advance()) {
        finish()
        return false
      }
      return true
    } finally {
      stepping = false
    }
  }

  return {
    subscribe(fn: ViewListener): () => void {
      return emitter.subscribe(fn)
    },

    submit(op: MembraneOp): OpAck {
      const ack = membrane.submit(op)
      // `new_run` between beats has nobody to end the run for it; mid-beat, the
      // step in flight closes it out at its own end so the round is not severed.
      if (ack.ok && op.op === 'new_run' && !stepping) finish()
      return ack
    },

    step,

    blocks(): BlockStore {
      return blocks
    },

    slottedIds(): string[] {
      return membrane.slottedIds()
    },
  }
}
