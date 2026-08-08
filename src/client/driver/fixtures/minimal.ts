// The minimal synthetic fixture: enough stream to exercise ordering, clock
// gating and the canned-op set, and nothing else. Deliberately content-free —
// the authored demo fixture (design target RUN 03 regenerated against the
// scenario, §5.4) is a separate unit and never belongs here.
import type { FixtureRun } from './types.ts'

export const minimalRun: FixtureRun = {
  id: 'minimal',
  start: '13:05',
  end: '13:09',
  events: [
    { type: 'beat_start', beat: 1, clock: '13:05' },
    { type: 'feed', line: { kind: 'event', clock: '13:05', text: 'synthetic event line' } },
    // x6 — KEPT, and now the only reason it is here: since the waiting marker was
    // removed this pair is a wait that must render nothing at all, and a bracket
    // with no feed line beside it is exactly the shape the live driver emits.
    { type: 'waiting', active: true, for: 'judgment' },
    { type: 'waiting', active: false, for: 'judgment' },
    {
      type: 'feed',
      line: {
        kind: 'radio',
        clock: '13:07',
        text: 'synthetic radio line',
        speaker: 'SPEAKER',
        sentence_id: 'm-s01',
      },
    },
    { type: 'beat_end', beat: 1, clock: '13:08' },
    {
      type: 'report',
      round: 1,
      facts: [{ id: 'm-r1-f01', text: 'synthetic fact', species: 'fact' }],
      report_body: [{ id: 'm-r1-b01', text: 'synthetic body', species: 'selfnarr' }],
    },
    { type: 'score', total: 0, baseline_total: 0, rows: [{ label: 'synthetic', value: 0, baseline: 0 }] },
    { type: 'meta', run: 1, runs_left: 0, carried: [], archive: [] },
    { type: 'run_end', run: 1 },
  ],
  responses: {
    slot: { ok: true },
    unslot: { ok: true },
    mine: { ok: true },
    deploy: { ok: true },
    new_run: { ok: true },
  },
}
