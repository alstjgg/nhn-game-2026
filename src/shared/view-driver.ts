/**
 * The view-driver seam — spec-client §5.2, ratified 08-03 with amendments.
 *
 * Everything the client consumes during a run is ONE ordered event stream;
 * everything it emits is one op stream. The run-loop manager's channel is
 * folded onto the same stream (`meta`, amendment d), so there is exactly one
 * in-channel and one out-channel.
 *
 * The block below is lifted from the ratified §5.2 fence unchanged: the only
 * edit this module is allowed to make is prefixing `export`. If a shape here
 * causes friction downstream, that goes to DISCOVERY, not into the type.
 *
 * Types only — no runtime value is emitted, nothing is imported, and the
 * module compiles under `tsconfig.core.json` (lib ES2023, types []).
 */

export type Species = 'fact' | 'selfnarr' | 'emotion' | 'quote';
export interface Sentence { id: string; text: string; species: Species; axis?: string }

export type FeedKind = 'event' | 'radio' | 'npc' | 'symptom' | 'wait' | 'fallback' | 'mark';
export interface FeedLine { kind: FeedKind; clock: string /* "HH:MM" */; text: string;
                     speaker?: string; sentence_id?: string /* set ⇢ minable */ }

export type ViewEvent =
  | { type: 'beat_start' | 'beat_end'; beat: number; clock: string }
  | { type: 'feed';     line: FeedLine }
  | { type: 'waiting';  active: boolean; for: 'judgment' | 'narration' | 'report' }
  | { type: 'fallback'; call: 1 | 2 | 3; code: string; beat: number }
  | { type: 'report';   round: number; facts: Sentence[]; report_body: Sentence[] }
  | { type: 'score';    total: number; rows: { label: string; value: number }[] }
  | { type: 'run_end';  run: number }
  | { type: 'meta';     run: number; runs_left: number; carried: string[];
                        archive: { run: number; label: string }[] };
                        // SETTLED 08-05: e8's run-loop manager emits exactly
                        // this shape (src/runloop/run-loop.ts, metaEvent());
                        // its MetaState is internal persistence, translated
                        // at the boundary — the seam shape never moved

export type MembraneOp =
  | { op: 'slot';    block_id: string; slot: number }
  | { op: 'unslot';  slot: number }
  | { op: 'mine';    sentence_id: string }
  | { op: 'deploy';  blocks: string[] }  // a SET — order carries no meaning
                                         // (architecture §2.1: content, not
                                         // order; the composer sorts
                                         // canonically before composing)
  | { op: 'new_run' };
