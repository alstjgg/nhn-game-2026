// [e10] the two rigs the acceptance suite drives, both over the real 우는다리
// pack and the real merged `src/**` slice.
//
// Nothing here re-implements a rule. The schedule builder, the state core, the
// beat driver, the id allocator, the feed builders, the round assembler, the
// composer, the block store, the live driver and the fixture provider are all
// imported and run unmodified; what this file adds is the pack read (the engine
// is pure of `fs`, so somebody upstream has to do it), the two adapters e3's
// ports ask for, and two recorders that watch seams without changing them.
//
// e7's `createScriptedEngine` is reused rather than copied: it is the one
// existing `EnginePort` over the merged leaves, it is parameterised by pack, and
// §8's criteria are about what that port and its collaborators produce — not
// about a second binding written for this suite.
//
// The pack is the frozen 우는다리 datapack, deliberately: §8-2 asks for a beat
// whose effect moves `trust`, §8-8 for a run that generates lines on every
// channel, and §8-5 for a real Call 1 → Call 3 trace. A hand-built fixture
// could satisfy each of those and still leave the shipped scenario broken.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSchedule } from '../../../src/engine/beat/schedule.ts'
import { createBeatDriver } from '../../../src/engine/beat/driver.ts'
import type { Beat } from '../../../src/engine/beat/schedule.ts'
import type { BeatDriver } from '../../../src/engine/beat/driver.ts'
import type { DeltaEntry, RoundAssemblerPort, StateCorePort } from '../../../src/engine/beat/ports.ts'
import { applyEffects, initState, renderSymptoms } from '../../../src/engine/state/index.ts'
import { createComposer } from '../../../src/composer/compose.ts'
import type { BlockStore } from '../../../src/composer/compose.ts'
import { createBlockStore, createLiveDriver } from '../../../src/driver/index.ts'
import type { ComposerPort, MutableBlockStore } from '../../../src/driver/ports.ts'
import { createFixtureProvider } from '../../../src/transport/index.ts'
import type { Transport, TransportResult } from '../../../src/transport/index.ts'
import type { GateView, BeatView, RoundView } from '../../../src/engine/index.ts'
import type { Composer } from '../../../src/composer/index.ts'
import type { CallRequest, CallType } from '../../../src/shared/contracts.ts'
import type {
  Characters,
  Gates,
  Symptoms,
  Temperament,
  Timeline,
} from '../../../src/shared/datapack.ts'
import type { ReportGuidance } from '../../../src/shared/report-guidance.ts'
import type { FeedLine, ViewEvent } from '../../../src/shared/view-driver.ts'
import { createScriptedEngine } from '../../driver/engine-fixtures/scripted-engine.ts'
import type { EnginePack } from '../../driver/engine-fixtures/pack.ts'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../..')

/** The shipped scenario. §8's criteria are about this pack, not about a stand-in. */
export const PACK_SLUG = '우는다리'

/**
 * The two ids §8-10 names. Both are minted by the run below — `n02` is the
 * second `timeline_entries` line of Call 2, `f01` the first fact of Call 3 —
 * and `composerRig()` mines them, so a rename in the id grammar breaks this
 * loudly instead of leaving the criterion comparing two empty block arrays.
 */
export const BLOCK_PAIR: readonly [string, string] = ['b-r1-n02', 'b-r1-f01']

/** The driver must terminate; a run that does not is a bug, not a hang. */
const MAX_STEPS = 128

const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8')) as unknown

/**
 * The pack, parsed. The datapack types are authored in `src/shared/datapack.ts`
 * (generated from `data/scenario/_schema` and gated by `npm run check`'s
 * type-drift step), so the assertions below are the one place the JSON meets
 * them — exactly what `tools/driver/run/pack.mjs` does for the headless runner.
 */
export function loadPack(): EnginePack {
  const dir = path.join(REPO, 'data', 'scenario', PACK_SLUG)
  return {
    timeline: readJson(path.join(dir, 'timeline.json')) as Timeline,
    gates: readJson(path.join(dir, 'gates.json')) as Gates,
    characters: readJson(path.join(dir, 'characters.json')) as Characters,
    temperament: readJson(path.join(dir, 'temperament.json')) as Temperament,
    symptoms: readJson(path.join(dir, 'symptoms.json')) as Symptoms,
  }
}

/** `data/policy/report-guidance.json` — §6's supplier for `REPORT_GUIDANCE`. */
export function loadGuidance(): ReportGuidance {
  return readJson(path.join(REPO, 'data', 'policy', 'report-guidance.json')) as ReportGuidance
}

// ── the view rig (§8-2 · §8-3) ───────────────────────────────────────────────

/**
 * e3's `StateCorePort` over e2's pure functions, plus the beat boundary the
 * driver's `advance()` needs. Same adapter shape the headless binder uses; the
 * rules are `applyEffects` / `renderSymptoms`', never this file's.
 */
function createStateCore(pack: EnginePack): StateCorePort & { openBeat(): void } {
  const state = initState(pack.characters)
  let entries: DeltaEntry[] = []

  return {
    applyDeltas(deltas, cause) {
      entries.push(...applyEffects(state, { deltas }, cause))
    },
    applyFlags(flags, cause) {
      entries.push(...applyEffects(state, { flags }, cause))
    },
    read: (variable) => state.scalars[variable] ?? 0,
    readFlag: (id) => state.flags[id] ?? false,
    journal: () => [...entries],
    renderSymptoms: () => renderSymptoms(entries, pack.symptoms),
    snapshot: () => ({ ...state.scalars, ...state.flags }),
    openBeat(): void {
      entries = []
    },
  }
}

/**
 * The beat driver, its schedule, and a read of the state behind it.
 *
 * §8-3 needs the state snapshot as well as the next view: a view that handed
 * back a live handle would let a mutation reach engine state, and comparing
 * only the next view would miss it if the same corrupted handle were returned
 * twice.
 */
export type ViewRig = BeatDriver & {
  schedule: Beat[]
  snapshot(): Record<string, number | boolean>
}

export function viewRig(): ViewRig {
  const pack = loadPack()
  const schedule = buildSchedule(pack.timeline, pack.gates)
  const state = createStateCore(pack)

  // §8-2 and §8-3 read `gateView`/`beatView` only; the assembler is here
  // because `createBeatDriver` requires one, and it is the real one.
  const beats: Beat[] = schedule
  const assembler: RoundAssemblerPort = { experienced: () => [] }
  const driver = createBeatDriver({ schedule, state, assembler, pack })

  const advance = (): boolean => {
    const moved = driver.advance()
    state.openBeat()
    return moved
  }

  return { ...driver, advance, schedule: beats, snapshot: () => state.snapshot() }
}

export type ViewKeys = { GateView: string[]; BeatView: string[]; RoundView: string[] }

/**
 * §8-1/K3 — the three view key sets as the RUNTIME produces them.
 *
 * Read off live view values rather than off the contract's own code block: a
 * doc-vs-doc closure stays green while the implementation quietly drops a slot,
 * which is the failure the criterion is aimed at.
 */
export function viewKeys(): ViewKeys {
  const rig = viewRig()
  let gate: string[] | null = null
  let beat: string[] | null = null
  let round: string[] | null = null

  for (let guard = 0; guard <= rig.schedule.length; guard += 1) {
    if (rig.phase() === 'stance') {
      const authored = rig.schedule[rig.current().index]?.gate
      if (authored === undefined || authored === null) {
        throw new Error('phase is `stance` on a beat that carries no gate')
      }
      if (gate === null) gate = Object.keys(rig.gateView())
      rig.submitStance({ stance: authored.defaultStance, utterance: '발화' })
    }
    rig.applyBeatEffects()
    if (beat === null) beat = Object.keys(rig.beatView())
    if (round === null && rig.phase() === 'report') round = Object.keys(rig.roundView())
    if (gate !== null && beat !== null && round !== null) break
    if (!rig.advance()) break
  }

  if (gate === null || beat === null || round === null) {
    throw new Error(`${PACK_SLUG} did not yield all three views — the rig assumption broke`)
  }
  return { GateView: gate, BeatView: beat, RoundView: round }
}

// ── the run rig (§8-4 · §8-5 · §8-6 · §8-7 · §8-8 · §8-9 · §8-10) ────────────

/** One response body, flattened to a bag of values so a trace can scan it. */
export type DrivenResponse = { call_type: CallType; body: Record<string, unknown> }

/** What one full run of the pack handed to the two seams this suite watches. */
export type Driven = {
  /** Every `CallRequest` the composer built, in send order. */
  requests: CallRequest[]
  /** Every response body the provider returned, in the same order. */
  responses: DrivenResponse[]
  /** Every emitted `FeedLine`, in emission order. */
  feed: FeedLine[]
  /** The whole `ViewEvent` stream. */
  events: ViewEvent[]
}

type Recording = {
  transport: Transport
  requests: CallRequest[]
  responses: DrivenResponse[]
}

/**
 * Seam 2 — the transport, watched. The inner result passes through untouched:
 * a wrapper that reshaped it would be a second provider, and §8-5's trace would
 * then be tracing this file instead of the engine.
 */
function recordingTransport(inner: Transport): Recording {
  const requests: CallRequest[] = []
  const responses: DrivenResponse[] = []

  return {
    requests,
    responses,
    transport: {
      mode: inner.mode,
      async send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>> {
        requests.push(request)
        const result = await inner.send(request)
        if (result.ok) responses.push({ call_type: result.call_type, body: { ...result.body } })
        return result
      },
    },
  }
}

/** Everything one run produced, including the two handles `composerRig` needs. */
type Run = Driven & {
  blocks: MutableBlockStore
  guidance: ReportGuidance
  /** The `GateView` Call 1 of the first gate was composed from. */
  gateView: GateView
}

async function runOnce(): Promise<Run> {
  const pack = loadPack()
  const guidance = loadGuidance()
  const blocks = createBlockStore()
  const engine = createScriptedEngine({ pack, run: 1 })
  const inner = createComposer({ blocks, reportGuidance: guidance })
  const recorder = recordingTransport(createFixtureProvider())

  let firstGate: GateView | null = null
  const composer: ComposerPort = {
    judgment(view: GateView, blockIds: string[]): CallRequest {
      if (firstGate === null) firstGate = view
      return inner.judgment(view, blockIds)
    },
    narration: (view: BeatView): CallRequest => inner.narration(view),
    reporter: (view: RoundView): CallRequest => inner.reporter(view),
  }

  const driver = createLiveDriver({
    engine,
    composer,
    transport: recorder.transport,
    blocks,
    run: 1,
  })

  const events: ViewEvent[] = []
  driver.subscribe((event) => events.push(event))

  let steps = 0
  while (await driver.step()) {
    steps += 1
    if (steps > MAX_STEPS) throw new Error(`the run did not finish within ${MAX_STEPS} steps`)
  }

  if (firstGate === null) throw new Error(`${PACK_SLUG} reached no gate — the run composed no Call 1`)

  return {
    requests: recorder.requests,
    responses: recorder.responses,
    feed: events.flatMap((event) => (event.type === 'feed' ? [event.line] : [])),
    events,
    blocks,
    guidance,
    gateView: firstGate,
  }
}

/**
 * One full run of the pack against the offline fixture provider.
 *
 * Deliberately NOT memoised: §8-8 and §8-9 compare two runs, and a cached run
 * compared against itself would pass whatever the allocator did.
 */
export async function driveRound(): Promise<Driven> {
  return runOnce()
}

export type ComposerRig = {
  composer: Composer
  gateView: GateView
  /** The two ids of `BLOCK_PAIR`, mined and resolvable. */
  blockIds: readonly [string, string]
}

/**
 * §8-10's rig: a composer whose store really holds `b-r1-n02` and `b-r1-f01`.
 *
 * The store's `get` reads the MINED tier only (driver decision 8), so the pair
 * has to be mined, not merely emitted — and mining an id the run never produced
 * fails here rather than turning the criterion into a comparison of two empty
 * `BLOCKS` arrays.
 */
export async function composerRig(): Promise<ComposerRig> {
  const run = await runOnce()
  for (const id of BLOCK_PAIR) {
    if (!run.blocks.mine(id)) {
      throw new Error(`the run never emitted ${id} — §8-10's named pair is not in the store`)
    }
  }
  const store: BlockStore = run.blocks
  return {
    composer: createComposer({ blocks: store, reportGuidance: run.guidance }),
    gateView: run.gateView,
    blockIds: BLOCK_PAIR,
  }
}
