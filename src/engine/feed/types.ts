/**
 * The feed builders' input and output shapes.
 *
 * Owner: e4. These are the seam types `buildFeed` / `buildReportSentences` /
 * `assembleExperienced` speak, and nothing else in the repo declares them —
 * `src/engine/index.ts` (e0's skeleton) owns the *view* types, this file owns
 * the *builder* types the views will eventually be assembled from.
 *
 * Two rules are encoded here rather than remembered:
 *
 * 1. **`inner_note` is a field of `RoundInput` and of nothing else.** The beat
 *    input carries `Pick<JudgmentResponse, 'utterance'>`, not the whole
 *    response, so `buildFeed` cannot reach the note even if a caller shoves it
 *    into the object (contract-engine-composer §8-5).
 * 2. **Everything the builders read is `readonly`.** They are pure functions of
 *    their input (physical §3.2); widening to `readonly` makes an accidental
 *    write a compile error instead of a determinism bug.
 */

import type { FeedLine } from '../../shared/view-driver.ts'
import type {
  JudgmentResponse,
  NarrationResponse,
  PresentNpc,
  ReporterResponse,
} from '../../shared/contracts.ts'
import type { Temperament } from '../../shared/datapack.ts'

/**
 * contract-engine-composer §2's temperament slot, aliased to the datapack shape
 * rather than re-declared — the same aliasing `src/engine/index.ts` does, and
 * for the same reason. `src/engine/feed/` may not import `src/engine/index.ts`
 * (A12: this folder depends on `src/shared/` and itself), so the alias is taken
 * from the one authoring source both sides already share.
 */
export type TemperamentPack = Temperament

/** An authored `timeline.json` script event. Its id is inherited, never minted. */
export type ScriptLine = { id: string; text: string }

/** The three soft-defect rows an `npc_lines` entry can trip (call contracts §6). */
export type DropReason = 'foreign_speaker' | 'missing_prefix' | 'echoes_utterance'

/** A line the engine dropped on the way to the timeline. Diagnostic, never rendered. */
export type DropRecord = { raw: string; reason: DropReason; index: number }

/** A surviving `npc_lines` entry, parsed. Carries no id — minting happens after. */
export type KeptNpcLine = { speakerId: string; speakerName: string; text: string }

/** What one beat hands the feed builder. */
export type BeatFeedInput = {
  /** Beat time is an input, never computed here — there is no clock in the engine. */
  clock: string
  /** Authored script events for this beat, verbatim. */
  scriptLines?: readonly ScriptLine[]
  /** Gate beat only, and only the one field the timeline may see. */
  judgment?: Pick<JudgmentResponse, 'utterance'>
  narration?: Pick<NarrationResponse, 'timeline_entries' | 'npc_lines'>
  present: readonly PresentNpc[]
  /** The symptom renderer's output. Fixed authored sentences — never minted. */
  symptoms?: readonly string[]
}

export type FeedResult = { lines: FeedLine[]; drops: DropRecord[] }

/**
 * Call 3's two minted fields, widened to `readonly`. The element types are
 * taken from `ReporterResponse` so a contract change lands here too.
 */
export type ReportInput = {
  readonly facts: readonly ReporterResponse['facts'][number][]
  readonly report_body: ReporterResponse['report_body']
}

/**
 * What the round assembler reads from one beat. No clock, no symptoms: §5's
 * table.
 *
 * `judgment` is here for one reason: the npc-line drop rules are a function of
 * **this beat's** utterance (`''` on a script beat), and contract §5 requires
 * `EXPERIENCED` to be the timeline's own ordering rather than "a second,
 * divergent log". Reading the round's gate utterance on every beat made the two
 * classifiers disagree, and a line the timeline kept then vanished from the
 * round.
 */
export type RoundBeatInput = Pick<
  BeatFeedInput,
  'scriptLines' | 'narration' | 'present' | 'judgment'
>

export type RoundInput = {
  /** The round's gate beat. `inner_note` lives here and reaches Call 3 only. */
  gate: { utterance: string; inner_note: string }
  beats: readonly RoundBeatInput[]
  /** Passed by reference to Call 3 — never copied, never re-rendered (§8-6). */
  temperament: TemperamentPack
}

/** The two slots the round view supplies, assembled at e4's seam. */
export type RoundSlots = { EXPERIENCED: string[]; TEMPERAMENT: TemperamentPack }
