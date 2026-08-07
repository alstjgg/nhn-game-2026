// [e3] — test-side driving helpers. No production logic lives here.
import { buildSchedule } from '../../../src/engine/beat/schedule.ts'
import { createBeatDriver } from '../../../src/engine/beat/driver.ts'
import type { Beat } from '../../../src/engine/beat/schedule.ts'
import type { BeatDriver } from '../../../src/engine/beat/driver.ts'
import type { BeatPack } from '../../../src/engine/beat/ports.ts'
import { createRecordingAssembler, createRecordingState } from './recording-double.ts'
import type { RecordingAssembler, RecordingState } from './recording-double.ts'

export type Rig = {
  pack: BeatPack
  schedule: Beat[]
  state: RecordingState
  assembler: RecordingAssembler
  driver: BeatDriver
}

export function rig(
  pack: BeatPack,
  seed: Record<string, number | boolean> = {},
  symptoms: string[] = ['(변화 없음)'],
): Rig {
  const schedule = buildSchedule(pack.timeline, pack.gates)
  const state = createRecordingState(seed, symptoms)
  const assembler = createRecordingAssembler()
  const driver = createBeatDriver({ schedule, state, assembler, pack })
  return { pack, schedule, state, assembler, driver }
}

export function beatAt(schedule: Beat[], clock: string): Beat {
  const hit = schedule.find((b) => b.clock === clock)
  if (!hit) throw new Error(`no beat at ${clock}`)
  return hit
}

/**
 * Walks the whole run: gate beats get their authored `default_stance`, every
 * beat gets its effects applied, `onNarration` may record lines / read views.
 *
 * The gate test is `current().kind`, NOT the schedule's `Beat.kind`. Those two
 * part company when a gate's `availability` does not hold: the schedule keeps
 * the beat a gate beat (round membership is assigned off it, once, at build
 * time) while the cursor reports what the caller must actually do this beat.
 * `live-driver.ts` reads the cursor, so a harness reading the schedule would be
 * driving a run the product never drives — and would submit a stance for a gate
 * that is not being asked.
 */
export function driveAll(
  r: Rig,
  onNarration?: (driver: BeatDriver, beat: Beat) => void,
  beforeBeat?: (driver: BeatDriver, beat: Beat) => void,
): void {
  for (;;) {
    const cur = r.driver.current()
    const beat = r.schedule[cur.index]!
    if (beforeBeat) beforeBeat(r.driver, beat)
    if (cur.kind === 'gate') {
      r.driver.submitStance({ stance: beat.gate!.defaultStance, utterance: 'u' })
    }
    r.driver.applyBeatEffects()
    if (onNarration) onNarration(r.driver, beat)
    if (!r.driver.advance()) break
  }
}
