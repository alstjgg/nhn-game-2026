// [e7] — the scripted run the live-driver suites drive.
//
// Hand-built, like e3's and e5's fixtures: the frozen 우는다리 pack is
// pre-hardening (every `effects` is empty) and reading it would make these
// suites depend on scenario content they are not about. What IS real here is
// everything downstream — the schedule builder, the state core, the beat
// driver, the feed builders, the composer and the transport all run unmodified.
//
// One gate beat at 09:00 plus one trailing script beat at 09:30 = exactly one
// whole round, which is the smallest run that exercises all three calls.
import type { Characters, Gates, Symptoms, Temperament, Timeline } from '../../../src/shared/datapack.ts'
import type { BeatPack } from '../../../src/engine/beat/ports.ts'
import type { ReportGuidance } from '../../../src/shared/report-guidance.ts'

export type EnginePack = BeatPack & { symptoms: Symptoms }

type Ev = Timeline['events'][number]
type G = Gates['gates'][number]

export const CHARACTERS: Characters = {
  characters: [
    {
      id: 'c1',
      name: '신고자',
      age: null,
      role: 'caller',
      interest: 'i',
      knows: [],
      doesnt_know: [],
      meters: [],
      strands: { truth_ids: [], gate_ids: [] },
    },
    {
      id: 'c2',
      name: '실장',
      age: null,
      role: 'chief',
      interest: 'i',
      knows: [],
      doesnt_know: [],
      meters: [],
      strands: { truth_ids: [], gate_ids: [] },
    },
  ],
}

export const TEMPERAMENT: Temperament = {
  default_disposition: '기록된 것을 믿는다.',
  clauses: [
    {
      id: 'cl1',
      axis: '두려움',
      axis_vocabulary: ['떨림', '숨'],
      condition: '겁먹은 목소리를 만나면',
      defeat_condition: '단, 서류가 반대일 때는 그렇지 않다',
    },
  ],
}

/** No authored deltas anywhere, so the renderer always answers "(변화 없음)". */
export const SYMPTOMS: Symptoms = { flags: {} }

function ev(id: string, time: string, opts: Partial<Ev> = {}): Ev {
  return {
    id,
    time,
    effects: opts.effects === undefined ? { deltas: {}, flags: {} } : opts.effects,
    present: opts.present === undefined ? [] : opts.present,
    surface: opts.surface ?? 'call',
    place_id: null,
    text: opts.text ?? `${id}-text`,
    exposure: { visible_from: null, extra_condition: null },
  }
}

function gate(id: string, clock: string): G {
  return {
    gate: id,
    title: null,
    clock,
    place_id: null,
    availability: null,
    scene: `${id}-scene`,
    branch_note: null,
    standard_form: 'std',
    question: `${id}-question`,
    stances: [
      { id: 'hold', label: '보류한다', desc: 'a-desc' },
      { id: 'escalate', label: '올린다', desc: 'b-desc' },
    ],
    default_stance: 'hold',
    key_conditions: [],
    key_examples: [],
    predicted_shift: null,
    false_leads: [],
    buckets: [{ id: 'ba', stances: ['hold', 'escalate'], deltas: {}, flags: {} }],
    edge_predicates: [],
  }
}

/** One gate beat (09:00) + one trailing script beat (09:30) — one whole round. */
export function scriptedRound(): EnginePack {
  return {
    timeline: {
      events: [
        ev('t1', '09:00', { text: '남측 관측소가 신호를 놓쳤다.', present: [{ char_id: 'c1', side: 'line' }] }),
        ev('t2', '09:30', { text: '실장이 회선을 열었다.', present: [{ char_id: 'c2', side: 'room' }] }),
      ],
    },
    gates: { gates: [gate('G1', '09:00')] },
    characters: CHARACTERS,
    temperament: TEMPERAMENT,
    symptoms: SYMPTOMS,
  }
}

/**
 * Two whole rounds. Round 0's report therefore lands on a beat that is NOT the
 * run's last, which is the only way to observe "the run continues after a
 * failed Call 3".
 */
export function twoRounds(): EnginePack {
  return {
    timeline: {
      events: [
        ev('t1', '09:00', { text: '남측 관측소가 신호를 놓쳤다.', present: [{ char_id: 'c1', side: 'line' }] }),
        ev('t2', '09:30', { text: '실장이 회선을 열었다.', present: [{ char_id: 'c2', side: 'room' }] }),
        ev('t3', '10:00', { text: '두 번째 보고가 들어왔다.', present: [{ char_id: 'c1', side: 'line' }] }),
        ev('t4', '10:30', { text: '회선이 닫혔다.', present: [{ char_id: 'c2', side: 'room' }] }),
      ],
    },
    gates: { gates: [gate('G1', '09:00'), gate('G2', '10:00')] },
    characters: CHARACTERS,
    temperament: TEMPERAMENT,
    symptoms: SYMPTOMS,
  }
}

/** A script beat BEFORE the first gate — it belongs to no round (decision 10). */
export function leadingScriptRun(): EnginePack {
  return {
    timeline: {
      events: [
        ev('t0', '08:30', { text: '당직이 교대했다.', present: [{ char_id: 'c2', side: 'room' }] }),
        ev('t1', '09:00', { text: '남측 관측소가 신호를 놓쳤다.', present: [{ char_id: 'c1', side: 'line' }] }),
      ],
    },
    gates: { gates: [gate('G1', '09:00')] },
    characters: CHARACTERS,
    temperament: TEMPERAMENT,
    symptoms: SYMPTOMS,
  }
}

/** Two script beats and no gate at all — the "no round, no report" case. */
export function gatelessRun(): EnginePack {
  return {
    timeline: {
      events: [ev('t1', '09:00'), ev('t2', '09:30')],
    },
    gates: { gates: [] },
    characters: CHARACTERS,
    temperament: TEMPERAMENT,
    symptoms: SYMPTOMS,
  }
}

/** Policy, not scenario — a literal, so these suites read no file. */
export function reportGuidance(): ReportGuidance {
  return {
    id: 'report-guidance',
    version: 'v0.1',
    purpose: '라운드 기록을 남긴다.',
    facts: { max_items: 5, policy: '관찰된 것만 쓴다.' },
    report_body: {
      format: 'markdown',
      length: { min_chars: 200, max_chars: 800 },
      policy: '판단의 이유를 쓴다.',
    },
  }
}
