// The demo loop with every `report` event WITHHELD — the day whose generation
// never files, which is the exact case `PACE.HOLD_CEIL` exists for.
//
// Why it has to exist: the authored loop files a report on every day, so the
// tally's LAPSE release is unreachable from a booted desk and the assert that
// the lapse is announced had nothing to run against (R2 on tally.ts:135). The
// reviewer reproduced the case by hand-deleting the event; this is that same
// deletion, committed, so a spec can drive it and the next timing change cannot
// re-silence the release for free.
//
// DEV/TEST only, like every module in this directory (§5.4): `driver/run-loop.ts`
// reaches it behind `import.meta.env.DEV` and the player build folds it away.
//
// It MINTS NOTHING (C3). The authored stream passes through with one event type
// filtered out, so no synthetic sentence can reach a rendered surface — what is
// removed is content, never added.
import type { FixtureRun } from './types.ts'
import { woodariRunLoop } from './run-loop.ts'

/** The demo loop's days, each stripped of the `report` its generation owed. */
export const noReportRunLoop: FixtureRun[] = woodariRunLoop.map((run) => ({
  ...run,
  events: run.events.filter((event) => event.type !== 'report'),
}))
