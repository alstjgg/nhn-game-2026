/**
 * Barrel for `src/engine/feed/` — the pure builders behind the engine's views.
 *
 * This folder depends on `src/shared/` and on itself, and on nothing else. It
 * is **not** re-exported from `src/engine/index.ts`; wiring these builders into
 * `Engine.feed()` belongs to the unit that implements the engine's body.
 */

export { createIdAllocator } from './id-alloc.ts'
export type { IdAllocator } from './id-alloc.ts'

export { classifyNpcLines } from './drops.ts'
export type { NpcClassification, NpcLineContext } from './drops.ts'

export { buildFeed } from './feed.ts'

export { buildReportSentences, withholdInnerNote } from './report.ts'
export type { ReportSentences } from './report.ts'

export {
  assembleExperienced,
  assembleObjectiveLog,
  roundSlots,
  EXPERIENCED_PREFIX,
} from './experienced.ts'

export { PROXY_OWNED_SLOTS, COMPOSER_DEP_SLOTS } from './slots.ts'

export type {
  BeatFeedInput,
  DropReason,
  DropRecord,
  FeedResult,
  KeptNpcLine,
  ReportInput,
  RoundBeatInput,
  RoundInput,
  RoundSlots,
  ScriptLine,
  TemperamentPack,
} from './types.ts'
