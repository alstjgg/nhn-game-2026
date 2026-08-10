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

/**
 * The `code` on a `fallback` the DRIVER minted rather than the transport.
 *
 * The transport's codes come off the wire (contract-calls §11: `bedrock_timeout`,
 * `invalid_model_output`, `network_error`, …). This one has no status behind it
 * — the proxy answered 200 and the payload was still unusable — so it is its own
 * code rather than a borrowed one, and a run record can tell the two apart.
 */
export const UNUSABLE_PAYLOAD_CODE = 'unusable_payload'

function readJudgment(body: AnyBody): CallResponse['judgment'] | null {
  return 'stance' in body ? body : null
}

function readNarration(body: AnyBody): CallResponse['narration'] | null {
  return 'timeline_entries' in body ? body : null
}

function readReporter(body: AnyBody): CallResponse['reporter'] | null {
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
      const raw = lines[i]
      if (raw === undefined) continue
      // U5.4 — the agent's own line is the only one that can carry a citation,
      // and it carries the one parked by the gate beat that produced it.
      let line = raw
      if (raw.kind === 'radio' && pendingCitedSlots !== null) {
        if (pendingCitedSlots.length > 0) line = { ...raw, cited_slots: pendingCitedSlots }
        pendingCitedSlots = null
      }
      blocks.absorbLine(line)
      emit({ type: 'feed', line })
    }
    cursor = lines.length
  }

  /**
   * One transport round-trip inside its `waiting` bracket, narrowed by `read`.
   * Returns the usable body, or `null` — the engine decides what `null` means.
   *
   * **Two ways to get `null`, and both are fallbacks.** The call can fail to
   * land (`!result.ok`), or it can land and come back unusable — a 200 whose
   * body is missing the one field this call exists to produce. The engine's §5
   * recovery is identical either way, and that is precisely why the DIFFERENCE
   * has to be recorded here: the run record's `fallbacks` is the only place a
   * substituted stance is separable from a chosen one, and a driver that
   * emitted nothing for the second case left the record asserting that the
   * model judged a gate it never judged.
   *
   * `read` runs inside the bracket so decision 5 still holds — the `fallback`
   * lands between the bracket's two edges, whichever way the call went wrong.
   */
  async function call<T>(
    number: CallNumber,
    request: CallRequest,
    read: (body: AnyBody) => T | null,
  ): Promise<T | null> {
    const waitingFor = WAITING_FOR[number]
    emit({ type: 'waiting', active: true, for: waitingFor })
    const result = await transport.send(request)
    const usable = result.ok ? read(result.body) : null
    if (!result.ok) {
      emit({ type: 'fallback', call: number, code: result.code, beat: beatIndex })
    } else if (usable === null) {
      emit({ type: 'fallback', call: number, code: UNUSABLE_PAYLOAD_CODE, beat: beatIndex })
    }
    emit({ type: 'waiting', active: false, for: waitingFor })
    return usable
  }

  /**
   * U5.2b — the judged stance per round, in the author's words; U5.2b+ adds
   * `cited_ids`, the citation filtered to deployed ids (§5.2 `judged`).
   */
  const judgedStances = new Map<
    number,
    { stance_id: string; desc: string; cited_ids: string[] }
  >()

  /**
   * U5.4 — a ONE-SHOT handoff from the gate beat to the flush that follows it.
   *
   * `flush()` sees feed lines, not beats, so the citation is parked here by the
   * gate branch and consumed by the next radio line. It is cleared on that
   * line whether or not it had any slots, so a later beat's utterance can never
   * inherit an earlier round's citation.
   */
  let pendingCitedSlots: number[] | null = null

  /** Fires exactly once, whichever path reaches the end of the run. */
  function finish(): void {
    if (finished) return
    finished = true
    ended = true
    if (scorer !== undefined) {
      const score = scorer.score()
      // Forwarded whole. The driver decides WHEN a score is emitted (decision
      // 3: only when a scorer was supplied, and immediately before `run_end`);
      // what a score IS belongs to the port.
      emit({
        type: 'score',
        total: score.total,
        baseline_total: score.baseline_total,
        rows: score.rows,
      })
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
        const blocks = membrane.deployed()
        // x14 — AN AGENT HANDED NOTHING IS NOT ASKED. Every gate's authored
        // `standard_form` already claims this outcome — `아무것도 넘겨받지 않은
        // 요원은 기본 stance a를 낸다` — and nothing made it true: the claim went
        // to a model as one option among four, and the model reached past it
        // often enough that G3's stances had to be rewritten to stop it. A run
        // the player has not touched resolves by construction now, the same way
        // every time.
        //
        // Checked HERE and not in the composer because this is the only place
        // that can skip a call rather than shape one: `judgment()` is pure, so
        // a composer that knew would still have to be sent.
        //
        // `call()` never runs on this path, so no `fallback` event is minted
        // and the paper stays clean — an unasked call must not print `※ 회신
        // 불량`. The engine draws the same distinction in the journal, which is
        // why this is `submitBaseline()` and not `submitStance(null)`.
        const unshaped = blocks.length === 0
        const response = unshaped
          ? null
          : await call(1, composer.judgment(engine.gateView(), blocks), readJudgment)
        // U5.2b — the engine resolves chosen-vs-default (§5 recovery is its
        // move); keep its words for the round's report event. U5.2b+ — keep
        // the citation too, filtered to ids the player deployed: the model
        // selects among the player's own blocks and cannot mint an id onto
        // the seam (`because_*` itself stays a banned key family there).
        const judged = unshaped ? engine.submitBaseline() : engine.submitStance(response)
        if (beat.roundIndex !== null && judged !== null) {
          const deployed = new Set(blocks)
          const citedIds =
            response === null
              ? []
              : response.because_block_ids.filter((id) => deployed.has(id))
          judgedStances.set(beat.roundIndex, { ...judged, cited_ids: citedIds })
          // U5.4 — the same citation, resolved to the slot numbers the AGENT
          // FILE prints, for the radio line this beat is about to flush. A
          // fabricated id was already dropped by the filter above; one that
          // survives it but sits in no slot drops here. Either way the mark is
          // absent rather than wrong.
          pendingCitedSlots = citedIds
            .map((id) => membrane.slotOf(id))
            .filter((slot): slot is number => slot !== null)
            .sort((left, right) => left - right)
        }
      }

      engine.applyBeatEffects()
      flush()

      engine.applyNarration(await call(2, composer.narration(engine.beatView()), readNarration))
      flush()

      emit({ type: 'beat_end', beat: beat.index, clock: beat.clock })

      if (beat.isRoundLast && beat.roundIndex !== null) {
        const reporter = await call(3, composer.reporter(engine.roundView()), readReporter)
        const report = engine.applyReport(reporter)
        blocks.absorbSentences(report)
        const judged = judgedStances.get(beat.roundIndex)
        emit({
          type: 'report',
          round: beat.roundIndex,
          facts: report.facts,
          report_body: report.report_body,
          ...(judged === undefined ? {} : { judged }),
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
