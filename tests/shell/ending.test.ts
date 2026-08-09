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
  TUNNEL_OCCUPANTS,
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
  it('(a) a day that closes on one death is the good ending', () => {
    // `total` is DEATHS (`src/driver/scorer.ts:140`), and 전구간정상's rescue
    // run closes on exactly one — 오세라, inside the ninth door. `score.json`'s
    // own variance note says so: "그 런의 집계도 총 사망자 수 1명으로 닫히고,
    // 그 한 사람은 오세라다."
    expect(endingKindOf({ total: 1, runsLeft: 4 })).toBe('good')
  })

  it('(b) …on any run of the allotment, not only the last', () => {
    for (const runsLeft of [4, 3, 2, 1, 0]) {
      expect(endingKindOf({ total: 1, runsLeft })).toBe('good')
    }
  })

  it('(c) a day that closes with the allotment spent is the bad ending', () => {
    expect(endingKindOf({ total: 137, runsLeft: 0 })).toBe('bad')
  })

  it('(d) the good ending wins when a day is both', () => {
    // The last run of the allotment, scored 1. It is a rescue that happened to
    // land on the final day, and the operator is owed the ending they earned.
    expect(endingKindOf({ total: 1, runsLeft: 0 })).toBe('good')
  })

  it('(e) an ordinary day earns nothing and the sitting continues', () => {
    for (const total of [0, 2, 41, 62, 96, 111, 136, 138]) {
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

  it('(g) a total of 0 is NOT the good ending', () => {
    // The rescue run scores 1, never 0 — the crowd-side unit reaching 0 still
    // adds 오세라 to the closing line. A 0 the seam could only produce from an
    // unscored or short ledger must not be read as the best day ever played
    // (`src/driver/scorer.ts` `scoreRecord`, which answers null for exactly
    // that case).
    expect(endingKindOf({ total: 0, runsLeft: 3 })).toBeNull()
  })
})

/* ══ 2 — the numbers the bad ending prints ════════════════════════════════ */

describe('[x6] the numbers', () => {
  /** 오세라's two authored outcomes, verbatim from `score.json` u2. */
  const OSERA_DEAD = '사망 · 아홉 번째 문 앞, 쇠사슬을 손으로 흔든 자세'
  const OSERA_ALIVE = '생존 · 갱구 밖 집결지에서 발견된다'

  /** A `score` event's numbers, as `numbersOf` takes them. */
  const day = (total: number, crowd: number, osera: string, chu: string) => ({
    total,
    rows: [
      { label: '터널에서 나오지 못한 사람', value: crowd },
      { label: '오세라', value: osera },
      { label: '차우진', value: chu },
    ],
  })

  it('(a) the tunnel holds the pack`s own figure', () => {
    // `data/scenario/전구간정상/meta.json`'s logline — "터널에 갇힌 341명" —
    // and `score.json` u1's `tallies`, which counts the other 340 around 차우진.
    expect(TUNNEL_OCCUPANTS).toBe(341)
  })

  it('(b) the toll printed is the toll the ledger closed on', () => {
    // Never recomputed. The operator watched 총 사망자 수 roll to this number
    // seconds before the veil; a plate that printed a different one would be
    // the single lie on it.
    expect(numbersOf(day(138, 136, OSERA_DEAD, '사망 · 하행 사점이 킬로 갓길')).deaths).toBe(138)
  })

  it('(c) the survivors exclude a death that was never in the tunnel', () => {
    // THE REGRESSION. `341 - total` looks right and is wrong by one person:
    // 오세라 is 터널 점검 용역 반장, not an occupant (`score.json` u1 —
    // "점검 용역 인원은 별도 단위"), so charging the crowd for her death
    // reports one fewer survivor than the pack's own arithmetic. The untouched
    // day is 341 − 136 crowd − 차우진 = 204, and it is 204 that the ending
    // must print, not 203.
    const baseline = numbersOf(day(138, 136, OSERA_DEAD, '사망 · 하행 사점이 킬로 갓길'))
    expect(baseline).toEqual({ walkedOut: 204, deaths: 138 })
  })

  it('(d) …and the two numbers are not meant to sum to the tunnel', () => {
    // The consequence of (c), stated so nobody "fixes" it back. The plate
    // counts the tunnel and then counts everyone — which is exactly what the
    // good ending does when it reads 341명이 걸어 나왔습니다 above 사망 1명.
    const baseline = numbersOf(day(138, 136, OSERA_DEAD, '사망 · 하행 사점이 킬로 갓길'))
    expect(baseline.walkedOut + baseline.deaths).toBe(TUNNEL_OCCUPANTS + 1)
  })

  it('(e) a day 오세라 walks out of charges the crowd for all of it', () => {
    // The 41 run — `score.json`: "41은 (G1 대조 · G2 추궁 · G3 호령) … 오세라는
    // 맨 뒤에서 걸어 나온다", and 차우진 lives too. Every death that day is an
    // occupant's, so nothing is subtracted and 341 − 41 = 300 walk out.
    expect(numbersOf(day(41, 41, OSERA_ALIVE, '생존 · 입건'))).toEqual({ walkedOut: 300, deaths: 41 })
  })

  it('(f) an unscored day prints no negative anywhere', () => {
    // Not reachable off a linted pack — the ladder tops out at 138 — but the
    // seam carries numbers, not a promise about their range, and "−7명이 갱구
    // 밖으로 걸어 나왔습니다" is the one failure an operator would remember.
    expect(numbersOf(day(400, 400, OSERA_DEAD, '사망 · 하행 사점이 킬로 갓길')).walkedOut).toBe(0)
    // A toll SMALLER than what stands outside the tunnel: the subtraction must
    // floor rather than wrap round into more survivors than there were people.
    expect(numbersOf({ total: 0, rows: [{ label: '오세라', value: OSERA_DEAD }] })).toEqual({
      walkedOut: TUNNEL_OCCUPANTS,
      deaths: 0,
    })
  })

  it('(g) it reads 사망 off the pack`s own word, not a second copy of the rule', () => {
    // `deathsOf` (`shared/predicates.ts`) is what `components/tally-line.ts`
    // sums the same rows with. A private restatement here is how the desk's two
    // readings of one row eventually disagree — so the outcome token is tested
    // through a value that only that rule gets right: 생존 leading, 사망 later
    // in the same string, which a naive `includes('사망')` would miscount.
    const tricky = numbersOf({
      total: 5,
      rows: [{ label: '오세라', value: '생존 · 사망자 수습을 돕는다' }],
    })
    expect(tricky.walkedOut).toBe(TUNNEL_OCCUPANTS - 5)
  })
})

/* ══ 3 — the copy ═════════════════════════════════════════════════════════ */

describe('[x6] the plates', () => {
  /**
   * The untouched day — `score.json`'s `baseline_summary`: 총 사망자 138명, of
   * which 136 are the crowd, one is 차우진 beside his own truck, and one is
   * 오세라 in front of the ninth door. 204 occupants walk out.
   */
  const numbers = numbersOf({
    total: 138,
    rows: [
      { label: '터널에서 나오지 못한 사람', value: 136 },
      { label: '오세라', value: '사망 · 아홉 번째 문 앞, 쇠사슬을 손으로 흔든 자세' },
      { label: '차우진', value: '사망 · 하행 사점이 킬로 갓길' },
    ],
  })

  /**
   * A day the operator dug the cargo out of — `score.json`: 96 on the crowd
   * side, and 차우진 lives because his load was named, so the closing line
   * reads 97. 245 walk out.
   */
  const other = numbersOf({
    total: 97,
    rows: [
      { label: '터널에서 나오지 못한 사람', value: 96 },
      { label: '오세라', value: '사망 · 아홉 번째 문 안쪽' },
      { label: '차우진', value: '생존 · 입건 · 개요서 적재물 칸이 채워진다' },
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
        lead: '341명이 갱구 밖으로 걸어 나왔습니다.',
        body: [
          '오세라는 여섯 번째 문부터 아홉 번째 문까지 열었고, 마지막 문 안쪽에 남았습니다.',
          '사망 1명 — 지금까지 확인된 최선의 기록입니다.',
        ],
      },
      {
        head: '훈련 강평',
        corner: '2 / 3',
        lead: '상황 전파가 제때 이루어졌습니다.',
        body: [
          '해원터널 참사의 원인은 상황 전파 지연이었습니다. 같은 정보가 이번에는 현장 요원에게 닿았습니다.',
          '운영자는 흩어진 기록을 모아 현장 요원에게 전달하고, 이것이 생환자 수를 결정합니다.',
        ],
      },
      {
        head: '임용 확정',
        corner: '3 / 3',
        lead: '평가를 통과하셨습니다.',
        body: [
          '본 단말의 모의 과정은 여기서 종료됩니다. 기록은 귀하의 인사 자료에 편입됩니다.',
          '해원터널에는 귀하가 없었지만, 다음 긴급 상황에는 있을 것입니다. 실제 회선에서 뵙겠습니다.',
        ],
      },
    ])
  })

  it('(d) the bad ending reads as authored, with the day`s own numbers in it', () => {
    expect(endingPlates('bad', numbers)).toEqual([
      {
        head: '시뮬레이션 종료',
        corner: '1 / 3',
        lead: '204명이 갱구 밖으로 걸어 나왔습니다.',
        body: [
          '나머지는 차량 안에 앉은 채, 안내 방송을 기다리고 있었습니다.',
          '사망 138명 — 시행 횟수가 모두 소진되었습니다.',
        ],
      },
      {
        head: '훈련 강평',
        corner: '2 / 3',
        lead: '상황 전파가 제때 이루어지지 않았습니다.',
        body: [
          '해원터널 참사의 원인은 상황 전파 지연이었습니다. 이번에도 같은 자리에서 지연이 반복되었습니다.',
          '운영자는 흩어진 기록을 모아 현장 요원에게 전달하고, 이것이 생환자 수를 결정합니다.',
        ],
      },
      {
        head: '평가 보류',
        corner: '3 / 3',
        lead: '평가가 보류되었습니다.',
        body: [
          '본 단말의 모의 과정은 여기서 종료됩니다. 동일 사건으로 재평가가 편성됩니다.',
          '해원터널의 기록은 그대로 남았습니다. 다음 시행에서 다시 뵙겠습니다.',
        ],
      },
    ])
  })

  it('(e) the bad ending`s numbers actually follow the day', () => {
    // (d) pins the shape; this pins that the two slots are SUBSTITUTED and not
    // authored into the string. A hard-coded 204/138 passes (d) forever.
    const plates = endingPlates('bad', other)
    expect(plates[0]!.lead).toBe('245명이 갱구 밖으로 걸어 나왔습니다.')
    expect(plates[0]!.body[1]).toBe('사망 97명 — 시행 횟수가 모두 소진되었습니다.')
  })

  it('(f) the good ending`s copy is fixed and reads no number off the day', () => {
    // It is the ONE outcome the pack authored end to end — 341 out, 오세라
    // inside the ninth door, 사망 1명 — so it must not drift with whatever the
    // seam happened to send.
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
