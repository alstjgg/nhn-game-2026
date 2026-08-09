// [x6] the two endings — `shell/ending.ts`.
//
// Two suites, and the split is the same one `tutorial-observer.test.ts` makes:
// what a node-env run can actually prove, and what it can only prove
// STRUCTURALLY. The plate itself is DOM and its behaviour is asserted in
// `e2e/ending.spec.ts`, in a browser, where a veil is a thing you can see.
//
// What is proved HERE is the half that decides whether the ending is CORRECT
// rather than whether it is pretty:
//
//  1. **Which ending a closed day earns.** `endingKindOf` is the whole trigger,
//     and it is worth pinning in a suite that runs on every commit, because the
//     input it reads is a trap: `runs_left` is `max(0, total - run_count)` and
//     `startRun` is what moves `run_count`, so it already reads 0 for the WHOLE
//     of the last run (`src/runloop/run-loop.ts:140`). "the allotment is spent"
//     is therefore a fact about a day that has CLOSED, never an edge to watch
//     for, and a future reader who re-derives this from the field name alone
//     will fire the bad ending at the top of run 5 instead of the bottom.
//  2. **The numbers the bad ending prints.** They are the only thing on either
//     plate that is not authored, so they are the only thing that can be wrong.
//  3. **The copy.** Both endings' text is the deliverable — the plates are the
//     last thing a judge reads, and a typo in them is not recoverable by the
//     time anyone notices. Pinned verbatim.
//  4. **That the ending can only WATCH.** Same contract as the onboarding walk
//     and `audio/index.ts` (plan-audio §2): it reads the §5.2 stream and the
//     DOM, sends no op, and nothing imports it but the boot. A curtain that
//     could send `new_run` would be a second hand on the membrane.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { CLIENT, SHELL_DIR, exists, read, rel, walk } from './shell-utils.ts'
import {
  ENDING_CLOSE,
  ENDING_NEXT,
  SITE_OCCUPANTS,
  endingKindOf,
  endingPlates,
  numbersOf,
} from '../../src/client/shell/ending.ts'

const ENDING_TS = path.join(SHELL_DIR, 'ending.ts')
const BOOT_TS = path.join(SHELL_DIR, 'boot.ts')

/** Every client `.ts`, source text and repo-relative path. */
function clientFiles(): { file: string; src: string }[] {
  return walk(CLIENT)
    .filter((p) => p.endsWith('.ts'))
    .map((p) => ({ file: rel(p), src: read(p) }))
}

/** Comments stripped, so a rule fires on code and never on the note above it. */
function code(p: string): string {
  return read(p)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

/* ══ 1 — which ending a closed day earns ══════════════════════════════════ */

describe('[x6] the trigger', () => {
  it('(a) a day that closes on no deaths at all is the good ending', () => {
    // `total` is DEATHS (`src/driver/scorer.ts:140`), and 멈춘회전문's two
    // winning routes both close on zero. `score.json`'s variance note says so:
    // "두 성공 경로 모두 사람 쪽 값이 0이다. … 값은 사람 수가 아니라 다른 칸에
    // 남는다."
    expect(endingKindOf({ total: 0, runsLeft: 4 })).toBe('good')
  })

  it('(b) …on any run of the allotment, not only the last', () => {
    for (const runsLeft of [4, 3, 2, 1, 0]) {
      expect(endingKindOf({ total: 0, runsLeft })).toBe('good')
    }
  })

  it('(c) a day that closes with the allotment spent is the bad ending', () => {
    expect(endingKindOf({ total: 12, runsLeft: 0 })).toBe('bad')
  })

  it('(d) the good ending wins when a day is both', () => {
    // The last run of the allotment, scored 0. It is a rescue that happened to
    // land on the final day, and the operator is owed the ending they earned.
    expect(endingKindOf({ total: 0, runsLeft: 0 })).toBe('good')
  })

  it('(e) an ordinary day earns nothing and the sitting continues', () => {
    // 멈춘회전문's own ladder, minus its floor: 207 untouched, 57 after the
    // headcount, 12 after the west sleeve. Nothing between them ends a sitting.
    for (const total of [1, 3, 12, 21, 57, 185, 206, 207]) {
      expect(endingKindOf({ total, runsLeft: 3 }), `total ${total} ended the sitting`).toBeNull()
    }
  })

  it('(f) the allotment is SEEDED from the frame, never waited for', () => {
    // The regression this pins cost run 1 its whole sitting. `subscribe` does
    // not replay (`driver/fixture-driver.ts`), and the opening `meta` is emitted
    // at `bootShell` step 5 while this module is installed at step 8 — behind
    // the door and the briefing, both of which the boot awaits. A `runsLeft`
    // that started at zero and waited on the stream to correct it was still
    // zero when day 1 closed, because the next `meta` does not arrive until day
    // 2 — so every first day that did not empty the tunnel ended the sitting on
    // the spot with 시행 횟수가 모두 소진되었습니다 and four runs unplayed.
    //
    // Source-level, because `earned()` is module-private and the suite has no
    // DOM to mount a driver against. What it holds is the SHAPE of the fix: the
    // emitted stream is read before the subscription is bound.
    const src = code(ENDING_TS)
    expect(src, 'the ending no longer seeds itself from the frame').toMatch(/frame\s*\(\s*\)\s*\.events/)
    const seed = src.indexOf('frame()')
    const bind = src.indexOf('driver.subscribe')
    expect(seed, 'the frame is read but never before the subscription').toBeGreaterThan(-1)
    expect(seed, 'the seed moved behind the subscription').toBeLessThan(bind)
  })

  it('(g) a total of 0 IS the good ending, and this pack cannot double-check it', () => {
    // INVERTED at the 멈춘회전문 switch (08-10), and worth stating as a loss
    // rather than editing quietly. Under 전구간정상 the rescue closed on 1, so
    // this test could also stand guard over a hazard it got for free: a 0 that
    // the seam produced from an unscored or short ledger must not read as the
    // best day ever played. Here 0 is the win, so the two cases are no longer
    // distinguishable at this seam and that second duty is gone.
    //
    // What still holds it is upstream and was always the real defence:
    // `src/driver/scorer.ts` `scoreRecord` returns null — not a total of 0 —
    // when no unit resolved, so a short ledger emits no `score` event at all
    // and never reaches `endingKindOf`.
    expect(endingKindOf({ total: 0, runsLeft: 3 })).toBe('good')
  })
})

/* ══ 2 — the numbers the bad ending prints ════════════════════════════════ */

describe('[x6] the numbers', () => {
  /** 문세라's authored outcomes, verbatim from `score.json` u3. */
  const SERA_DEAD = '사망 · 집결지 세 번째 명단'
  const SERA_ALIVE = '생존 · 발목이 부러진 채 북측으로 걸어 나온다'

  /** A `score` event's numbers, as `numbersOf` takes them. */
  const day = (total: number, dome: number, airlock: number, sera: string) => ({
    total,
    rows: [
      { label: '돔 안에 있던 사람', value: dome },
      { label: '남측 에어락 통로에 갇힌 사람', value: airlock },
      { label: '문세라', value: sera },
      { label: '표기웅', value: '아무것도 남지 않음' },
    ],
  })

  it('(a) the dome holds the pack`s own figure', () => {
    // `score.json` u1's `tallies` states the whole and then narrows it:
    // 그날 안에 있던 736명 가운데 문세라는 자기 단위에서 집계되므로 이 수는
    // 나머지 735명만 센다.
    expect(SITE_OCCUPANTS).toBe(736)
  })

  it('(b) the toll printed is the toll the ledger closed on', () => {
    // Never recomputed. The operator watched 총 사망자 수 roll to this number
    // seconds before the veil; a plate that printed a different one would be
    // the single lie on it.
    expect(numbersOf(day(207, 185, 21, SERA_DEAD)).deaths).toBe(207)
  })

  it('(c) the survivors are the dome minus the toll, and the two numbers sum', () => {
    // Every scored death on this pack happened among the 736 — 문세라 is
    // 인솔 겸 심판 and is inside from the first minute — so nothing is held out
    // of the subtraction. The untouched day: 736 − 207 = 529.
    //
    // This is the fact that CHANGED at the switch. Under 전구간정상 the plate's
    // two numbers deliberately did not sum, because 오세라 walked into the
    // tunnel and was never one of its 341. Anyone reading that history in
    // `SCORED_OUTSIDE_THE_SITE` should not conclude the sum here is a bug.
    const baseline = numbersOf(day(207, 185, 21, SERA_DEAD))
    expect(baseline).toEqual({ walkedOut: 529, deaths: 207 })
    expect(baseline.walkedOut + baseline.deaths).toBe(SITE_OCCUPANTS)
  })

  it('(d) a day 문세라 walks out of is counted the same way', () => {
    // The west-sleeve run — `score.json`: 돔 안 9 · 통로 3, and she comes out
    // of the loading bay last. 736 − 12 = 724.
    expect(numbersOf(day(12, 9, 3, SERA_ALIVE))).toEqual({ walkedOut: 724, deaths: 12 })
  })

  it('(e) the rescue day empties the dome', () => {
    expect(numbersOf(day(0, 0, 0, SERA_ALIVE))).toEqual({ walkedOut: 736, deaths: 0 })
  })

  it('(f) an unscored day prints no negative anywhere', () => {
    // Not reachable off a linted pack — the ladder tops out at 207 — but the
    // seam carries numbers, not a promise about their range, and "−7명이 눈밭
    // 으로 걸어 나왔습니다" is the one failure an operator would remember.
    expect(numbersOf(day(900, 900, 0, SERA_DEAD)).walkedOut).toBe(0)
  })

  it('(g) the hold-out subtraction is inert on this pack, and that is deliberate', () => {
    // `SCORED_OUTSIDE_THE_SITE` is empty here, so `numbersOf`'s `deathsOf` loop
    // never fires and a row reading 사망 moves nothing but the total. Stated
    // rather than assumed: the mechanism is kept for a pack whose named person
    // stands outside the crowd, and on THIS pack it is untested by construction
    // — `deathsOf` itself is covered in `tests/shared/predicates.test.ts`.
    const withADeadNamedRow = numbersOf({
      total: 5,
      rows: [{ label: '문세라', value: SERA_DEAD }],
    })
    expect(withADeadNamedRow.walkedOut).toBe(SITE_OCCUPANTS - 5)
  })
})

/* ══ 3 — the copy ═════════════════════════════════════════════════════════ */

describe('[x6] the plates', () => {
  /**
   * The untouched day — `score.json`'s `baseline_summary`: 돔 안 185명 ·
   * 에어락 통로 21명 · 문세라 사망, 총 사망 207명. 529 walk out.
   */
  const numbers = numbersOf({
    total: 207,
    rows: [
      { label: '돔 안에 있던 사람', value: 185 },
      { label: '남측 에어락 통로에 갇힌 사람', value: 21 },
      { label: '문세라', value: '사망 · 집결지 세 번째 명단' },
      { label: '표기웅', value: '아무것도 남지 않음' },
    ],
  })

  /**
   * A day the operator pressed the headcount on and nothing more —
   * `score.json`: 44 inside, 12 in the airlock passage, and 문세라 is found in
   * the passage. 680 walk out.
   */
  const other = numbersOf({
    total: 57,
    rows: [
      { label: '돔 안에 있던 사람', value: 44 },
      { label: '남측 에어락 통로에 갇힌 사람', value: 12 },
      { label: '문세라', value: '사망 · 남측 에어락 통로에서 발견된다' },
      { label: '표기웅', value: '아무것도 남지 않음' },
    ],
  })

  it('(a) each ending is three plates, counted in the head`s meta slot', () => {
    for (const kind of ['good', 'bad'] as const) {
      const plates = endingPlates(kind, numbers)
      expect(plates).toHaveLength(3)
      expect(plates.map((p) => p.corner)).toEqual(['1 / 3', '2 / 3', '3 / 3'])
    }
  })

  it('(b) every plate is one lead and two paragraphs under it', () => {
    for (const kind of ['good', 'bad'] as const) {
      for (const plate of endingPlates(kind, numbers)) {
        expect(plate.lead.length).toBeGreaterThan(0)
        expect(plate.body).toHaveLength(2)
      }
    }
  })

  it('(c) the good ending reads as authored', () => {
    expect(endingPlates('good', numbers)).toEqual([
      {
        head: '시뮬레이션 종료',
        corner: '1 / 3',
        lead: '736명이 눈밭으로 걸어 나왔습니다.',
        body: [
          '문세라는 코트에 남은 아이들을 마지막까지 세었고, 살아서 나왔습니다.',
          '사망 0명 — 지금까지 확인된 최선의 기록입니다.',
        ],
      },
      {
        head: '훈련 강평',
        corner: '2 / 3',
        lead: '안에 사람이 있다는 것이 제때 확인되었습니다.',
        body: [
          '한내돔 참사의 원인은 아무도 인원을 세지 않은 것이었습니다. 같은 질문이 이번에는 제때 회선에 올랐습니다.',
          '운영자는 흩어진 기록을 모아 현장 요원에게 전달하고, 이것이 생환자 수를 결정합니다.',
        ],
      },
      {
        head: '임용 확정',
        corner: '3 / 3',
        lead: '평가를 통과하셨습니다.',
        body: [
          '본 단말의 모의 과정은 여기서 종료됩니다. 기록은 귀하의 인사 자료에 편입됩니다.',
          '한내돔에는 귀하가 없었지만, 다음 긴급 상황에는 있을 것입니다. 실제 회선에서 뵙겠습니다.',
        ],
      },
    ])
  })

  it('(d) the bad ending reads as authored, with the day`s own numbers in it', () => {
    expect(endingPlates('bad', numbers)).toEqual([
      {
        head: '시뮬레이션 종료',
        corner: '1 / 3',
        lead: '529명이 눈밭으로 걸어 나왔습니다.',
        body: [
          '나머지는 회전문 앞에 선 채, 문이 한 번에 두 사람씩 도는 것을 보고 있었습니다.',
          '사망 207명 — 시행 횟수가 모두 소진되었습니다.',
        ],
      },
      {
        head: '훈련 강평',
        corner: '2 / 3',
        lead: '안에 사람이 있다는 것이 제때 확인되지 않았습니다.',
        body: [
          '한내돔 참사의 원인은 아무도 인원을 세지 않은 것이었습니다. 이번에도 같은 자리에서 확인이 늦었습니다.',
          '운영자는 흩어진 기록을 모아 현장 요원에게 전달하고, 이것이 생환자 수를 결정합니다.',
        ],
      },
      {
        head: '평가 보류',
        corner: '3 / 3',
        lead: '평가가 보류되었습니다.',
        body: [
          '본 단말의 모의 과정은 여기서 종료됩니다. 동일 사건으로 재평가가 편성됩니다.',
          '한내돔의 기록은 그대로 남았습니다. 다음 시행에서 다시 뵙겠습니다.',
        ],
      },
    ])
  })

  it('(e) the bad ending`s numbers actually follow the day', () => {
    // (d) pins the shape; this pins that the two slots are SUBSTITUTED and not
    // authored into the string. A hard-coded 529/207 passes (d) forever.
    const plates = endingPlates('bad', other)
    expect(plates[0]!.lead).toBe('679명이 눈밭으로 걸어 나왔습니다.')
    expect(plates[0]!.body[1]).toBe('사망 57명 — 시행 횟수가 모두 소진되었습니다.')
  })

  it('(f) the good ending`s copy is fixed and reads no number off the day', () => {
    // Both winning routes close on the same two figures — 736 out, 사망 0명 —
    // so the copy states them and must not drift with whatever the seam
    // happened to send.
    expect(endingPlates('good', other)).toEqual(endingPlates('good', numbers))
  })

  it('(g) the walk`s two button labels', () => {
    expect(ENDING_NEXT).toBe('다음')
    expect(ENDING_CLOSE).toBe('시뮬레이션 종료')
  })
})

/* ══ 4 — the ending can only watch ════════════════════════════════════════ */

describe('[x6] the ending is an observer', () => {
  it('(a) src/client/shell/ending.ts exists', () => {
    expect(exists(ENDING_TS)).toBe(true)
  })

  it('(b) exactly one module imports it, and it is the shell boot', () => {
    const importers = clientFiles()
      .filter(({ src }) => /from\s+'\.{1,2}\/(shell\/)?ending\.ts'/.test(src))
      .map(({ file }) => file)
    expect(importers).toEqual([rel(BOOT_TS)])
  })

  it('(c) the boot mounts it, and does not await it', () => {
    const src = code(BOOT_TS)
    expect(src, 'boot.ts never calls installEnding').toMatch(/installEnding\s*\(/)
    // The ending outlives boot by however long the sitting lasts. An `await`
    // here would hold the desk it is waiting to close.
    expect(src).not.toMatch(/await\s+installEnding/)
  })

  it('(d) it sends no membrane op', () => {
    const src = code(ENDING_TS)
    expect(src, 'the ending reaches the op channel').not.toMatch(/\.send\s*\(/)
    for (const op of ['slot', 'unslot', 'deploy', 'mine', 'new_run']) {
      expect(src, `the ending mints a '${op}' op`).not.toMatch(new RegExp(`['"\`]${op}['"\`]`))
    }
  })

  it('(e) it reaches the seam through the driver barrel, never into it', () => {
    const specs = [...code(ENDING_TS).matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!)
    for (const spec of specs) {
      expect(spec, `${spec} reaches past the barrel`).not.toMatch(/driver\/(?!index\.ts$)[\w-]+/)
    }
  })

  it('(f) it never repaints the ledger it is waiting on', () => {
    // The hand-off is `data-tally-state="final"`, which `components/
    // score-tally.ts` owns. The ending READS it. A curtain that wrote to the
    // record would be deciding when the day was counted.
    const src = code(ENDING_TS)
    expect(src).not.toMatch(/dataset\.tallyState\s*=/)
    expect(src).not.toMatch(/createScoreTally/)
  })
})
