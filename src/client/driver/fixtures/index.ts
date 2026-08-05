// The fixture barrel — spec-client §5.4. Fixture modules ship in DEV builds
// only: nothing outside this directory imports one statically, and the dev-only
// entry point reaches them behind an `import.meta.env.DEV` guard so the player
// build tree-shakes the whole demo away.
export type { FixtureRun, OpResponse } from './types.ts'
export { minimalRun } from './minimal.ts'

export { woodariRun03 } from './woodari-run03.ts'
export { RAW_BODY, reportOf } from './woodari-reports.ts'
export type { Report, Run } from './woodari-reports.ts'
export {
  ARCHIVE,
  CARRIED,
  RUN,
  RUNS_LEFT,
  WOODARI_BLOCKS,
  WOODARI_SCORE_ROWS,
  WOODARI_SCORE_BASELINE_TOTAL,
  WOODARI_SCORE_TOTAL,
  WOODARI_TALLY,
} from './woodari-meta.ts'
export type { StoredBlock, TallyRow } from './woodari-meta.ts'
