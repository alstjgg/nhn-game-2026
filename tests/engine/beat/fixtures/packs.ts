// [e3] — hand-built minimal datapacks. spec §3: the real 우는다리 pack is frozen
// and read-only; only `schedule.test.ts` touches it, and only its schedule.
// Everything with authored effects/predicates is a fixture, because the real
// pack is pre-hardening (every `effects` is `{deltas:{},flags:{}}`).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Timeline, Gates, Characters, Temperament } from '../../../../src/shared/datapack.ts'
import type { BeatPack } from '../../../../src/engine/beat/ports.ts'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
export const PACK_DIR = path.join(REPO, 'data/scenario/우는다리')

type Ev = Timeline['events'][number]
type G = Gates['gates'][number]

/** Read a file of the frozen pack. Read-only — nothing here writes to it. */
export function realPart<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(PACK_DIR, name), 'utf8')) as T
}

export function realPack(): BeatPack {
  return {
    timeline: realPart<Timeline>('timeline.json'),
    gates: realPart<Gates>('gates.json'),
    characters: realPart<Characters>('characters.json'),
    temperament: realPart<Temperament>('temperament.json'),
  }
}

export function ev(id: string, time: string, opts: Partial<Ev> = {}): Ev {
  return {
    id,
    time,
    effects: opts.effects === undefined ? { deltas: {}, flags: {} } : opts.effects,
    present: opts.present === undefined ? [] : opts.present,
    surface: opts.surface ?? 'call',
    place_id: null,
    text: opts.text ?? `${id}-text`,
    // F4 · `exposure.extra_condition` — honoured rather than pinned to null, so
    // a fixture can author a row that only some branches see. Everything that
    // does not ask for one still gets the unconditional row it always got.
    exposure: opts.exposure ?? { visible_from: null, extra_condition: null },
  }
}

export function gate(id: string, clock: string, opts: Partial<G> = {}): G {
  return {
    gate: id,
    title: null,
    clock,
    place_id: null,
    availability: opts.availability ?? null,
    scene: opts.scene ?? `${id}-scene`,
    branch_note: null,
    standard_form: 'std',
    question: opts.question ?? `${id}-question`,
    stances: opts.stances ?? [
      { id: 'a', label: 'A', desc: 'a-desc' },
      { id: 'b', label: 'B', desc: 'b-desc' },
    ],
    default_stance: opts.default_stance ?? 'a',
    key_conditions: [],
    key_examples: [],
    predicted_shift: null,
    false_leads: [],
    buckets: opts.buckets ?? [{ id: 'ba', stances: ['a', 'b'], deltas: {}, flags: {} }],
    edge_predicates: opts.edge_predicates ?? [],
  }
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

export function pack(events: Ev[], gates: G[] = []): BeatPack {
  return {
    timeline: { events },
    gates: { gates },
    characters: CHARACTERS,
    temperament: TEMPERAMENT,
  }
}

// ── A1 / A2 · delta-before-predicate ────────────────────────────────────────
// trust seeds at 50; the chosen stance's bucket carries +15; the predicates ask
// for >= 55. Post-delta ⇒ n_trusted. Pre-delta ⇒ n_plain. The two answers differ,
// which is the only thing that makes A1's ordering observable in an outcome.
export const TRUST_SEED = { trust: 50 } as const

export function trustPack(): BeatPack {
  return pack(
    [ev('x1', '09:00', { text: 'gate-co-timed', present: [{ char_id: 'c1', side: 'line' }] })],
    [
      gate('G1', '09:00', {
        buckets: [
          { id: 'heard', stances: ['a'], deltas: { trust: 15 }, flags: {} },
          { id: 'pressed', stances: ['b'], deltas: { trust: -20 }, flags: {} },
        ],
        edge_predicates: ['trust >= 55 -> n_trusted', 'else -> n_plain'],
      }),
    ],
  )
}

// ── A4 · multi-event order at one clock ─────────────────────────────────────
// Mirrors 우는다리's 10:40 (t4 then t5) with effects the real pre-hardening pack
// does not yet carry, so the applied order is distinguishable.
export function multiEventPack(): BeatPack {
  return pack([
    ev('t4', '10:40', { effects: { deltas: { alpha: 1 }, flags: { fa: true } } }),
    ev('t5', '10:40', { effects: { deltas: { beta: 2 }, flags: { fb: true } } }),
  ])
}

// ── F4 · `availability` — a gate that is only asked on some branches ────────
//
// Two gates. The first sets `opened` through its `b` bucket; the second is
// available only where that flag is set, so one pack drives both answers
// depending on the stance the caller submits at 09:00.
//
// `unhardened` is the third case and the one that keeps this inert for packs
// that have not opted in: prose in the slot (우는다리's G7 carries 특정
// 가지에서만) is not a predicate, and the gate must still be asked.
export function availabilityPack(unhardened = false): BeatPack {
  return pack(
    [ev('a1', '09:00'), ev('a2', '10:00')],
    [
      gate('G1', '09:00', {
        buckets: [
          { id: 'shut', stances: ['a'], deltas: {}, flags: {} },
          { id: 'open', stances: ['b'], deltas: {}, flags: { opened: true } },
        ],
      }),
      gate('G2', '10:00', { availability: unhardened ? '특정 가지에서만' : 'opened' }),
    ],
  )
}

// ── F4 · `exposure.extra_condition` — a ROW that only some branches see ─────
//
// The gate's sibling, shaped the way the shipped packs actually author it: one
// gate at 09:00 whose `b` bucket sets `opened`, then a co-timed EXCLUSIVE PAIR
// at 10:00 — one row for the branch that opened, one for the branch that did
// not, each naming its own person. Exactly one of them happened on any run.
//
// The pair is the whole point. A beat that hands both halves to Call 2 is not
// merely showing a line too many: `FIXED_NPC_ACTION` is introduced to the model
// as what has already happened and must not be contradicted, so the two rows
// arrive as one run in which the branch was both taken and not taken.
//
// `unhardened` is the inert case, and it is the same argument `availability`
// makes: prose in the slot is not a predicate (우는다리's t5 says 현장(관리동)을
// 들여다본 런에만 보임), so the row must still be shown rather than deleted from
// every run of a pack nobody hardened.
export function exposurePack(unhardened = false): BeatPack {
  const opened = unhardened ? '열린 가지에서만' : 'opened'
  return pack(
    [
      ev('x1', '09:00'),
      ev('x2', '10:00', {
        text: 'opened-row',
        present: [{ char_id: 'c1', side: 'line' }],
        exposure: { visible_from: null, extra_condition: opened },
      }),
      ev('x3', '10:00', {
        text: 'shut-row',
        present: [{ char_id: 'c2', side: 'room' }],
        exposure: { visible_from: null, extra_condition: 'not opened' },
      }),
    ],
    [
      gate('G1', '09:00', {
        buckets: [
          { id: 'shut', stances: ['a'], deltas: {}, flags: {} },
          { id: 'open', stances: ['b'], deltas: {}, flags: { opened: true } },
        ],
      }),
    ],
  )
}

// ── One person, two co-timed rows — the roster must still count one ─────────
//
// Both rows are unconditional and both name `c1`; a pack splits a minute like
// this whenever one person does two things in it. The narration prompt states
// that at most one person is on the roster, so a second entry for the same
// character is read at the far end as a second person in the room.
export function twinRosterPack(): BeatPack {
  return pack([
    ev('t1', '09:00', { text: 'first', present: [{ char_id: 'c1', side: 'line' }] }),
    ev('t2', '09:00', { text: 'second', present: [{ char_id: 'c1', side: 'line' }] }),
  ])
}

// ── A5 · null effects ───────────────────────────────────────────────────────
export function nullEffectsPack(): BeatPack {
  return pack([ev('n1', '10:00', { effects: null, present: [{ char_id: 'c2', side: 'room' }] })])
}

// ── A8 / D8 · one gate + one trailing script beat = one whole round ─────────
export function roundPack(): BeatPack {
  return pack(
    [
      ev('g1e', '09:00', { text: 'gate-beat-text', present: [{ char_id: 'c1', side: 'line' }] }),
      ev('s1', '09:30', { text: 'script-beat-text', present: [{ char_id: 'c2', side: 'room' }] }),
    ],
    [gate('G1', '09:00')],
  )
}

// ── A9 · line windowing ─────────────────────────────────────────────────────
/** `n` script beats at 01:00, 02:00, … — no gates, so no rounds and no reports. */
export function linesPack(n: number): BeatPack {
  const events: Ev[] = []
  for (let i = 0; i < n; i += 1) {
    const hh = String(i + 1).padStart(2, '0')
    events.push(ev(`L${i}`, `${hh}:00`))
  }
  return pack(events)
}

/** Same, but with a gate on the LAST beat — lets a test read TIMELINE_EXCERPT. */
export function linesPackWithTrailingGate(n: number): BeatPack {
  const base = linesPack(n)
  const last = base.timeline.events[n - 1]!
  return pack(base.timeline.events, [gate('GX', last.time)])
}
