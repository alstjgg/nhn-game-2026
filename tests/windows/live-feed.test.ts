// [u5] LIVE FEED — the pure half of the window: the seven-kind mark table, the
// `FeedNode` model every line is projected through, and the source-level rules
// that keep the window a renderer.
//
// Covers [u5#c1] seven kinds map 1:1 · [u5#c3] no digit in npc/symptom nodes ·
// [u5#c9] renders only, never authors (source scan). The DOM half lives in
// `e2e/live-feed.spec.ts` — `vitest.config.ts` is `environment: 'node'` and C2
// forbids adding jsdom, so nothing here touches a document.
//
// Test titles are load-bearing: the unit's verification commands filter with
// `-t 'seven kinds map 1:1'` and `-t 'no digit in npc/symptom nodes'`. Do not
// rename a describe block without updating `.claude/super/units/u5.md`.
//
// SCOPE: unit-scoped. Every source scan below is bound by name to the files
// this unit owns (`SOURCES`), never to `src/**`.
//
// C3: the only fixture CONTENT this file names is structural (kinds, clocks,
// digits) — no synthetic literal is asserted, and the digit scan runs over
// u2f's real 우는다리 stream.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FeedKind, FeedLine, ViewEvent } from '../../src/shared/view-driver.ts'
import { woodariRun03 } from '../../src/client/driver/fixtures/index.ts'
import { MS_PER_SIM_MIN, hhmm, mm } from '../../src/client/driver/clock.ts'
import {
  FEED_MARKS,
  FEED_PACE,
  feedGapMs,
  feedLineModel,
  printsFeedLine,
  typedParts,
  typesOut,
} from '../../src/client/components/run-feed.ts'
import type { FeedNode, FeedPart } from '../../src/client/components/run-feed.ts'
import { typeDuration } from '../../src/client/components/typewriter.ts'
import { FALLBACK_CLASS, FALLBACK_LABEL } from '../../src/client/components/fallback-notice.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * The files this unit owns — every source scan is bound to this list.
 *
 * x6 — three, not four. `components/waiting-marker.ts` was deleted with the
 * waiting marker itself (민서, 08-09); see `[u5#c1] (l)` below for the contract
 * that replaced everything it carried.
 */
const SOURCES = [
  'src/client/components/run-feed.ts',
  'src/client/components/fallback-notice.ts',
  'src/client/windows/live-feed.ts',
] as const

const read = (relative: string): string => {
  const full = path.join(REPO, relative)
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : ''
}

/** Replace comment bodies with spaces — kills the prose, keeps the newlines. */
const blank = (text: string): string => {
  const keep = (s: string): string => s.replace(/[^\n]/g, ' ')
  return text
    .replace(/\/\*[\s\S]*?\*\//g, keep)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1: string) => p1 + keep(m.slice(p1.length)))
}

const code = (relative: string): string => blank(read(relative))

const LITERAL_RE = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g

/** String literals of a source, comments already blanked. */
const literals = (source: string): string[] => {
  const out: string[] = []
  for (const m of source.matchAll(LITERAL_RE)) {
    const raw = m[1] ?? m[2] ?? m[3]
    if (raw !== undefined) out.push(raw)
  }
  return out
}

const HANGUL = /[가-힣ᄀ-ᇿ㄰-㆏]/
const DIGIT = /\d/

/* ── the seven kinds, and the fixture stream they are proven against ─────── */

const KINDS: FeedKind[] = ['event', 'radio', 'npc', 'symptom', 'wait', 'fallback', 'mark']

/**
 * The kinds the fanfold DROPS — x6 took `wait`, x8 took `symptom`.
 *
 * At module scope since x11, because two blocks need it: `[u5#c1] (n)`/`(o)`
 * hold the drop shut, and the pacing block below has to know which queued
 * events print nothing in order to check that none of them costs the reader
 * anything. The source-side owner of the same list is `run-feed.ts`'s
 * `isUndrawn`, and `(o)` is what ties the two together.
 */
const UNDRAWN_KINDS: FeedKind[] = ['wait', 'symptom']

/**
 * Reference marks — `docs/design/phase2-ui/app.js:405`, ported verbatim.
 * `wait` and `mark` carry no mark by design (the rule carries `mark`'s; `wait`'s
 * was the breathing dots, and x6 removed the marker they belonged to).
 */
const REFERENCE_MARKS: Record<FeedKind, string> = {
  event: '▸',
  radio: '◈',
  npc: '—',
  symptom: '·',
  wait: '',
  fallback: '※',
  mark: '',
}

/**
 * The port's deviations from that table — one, x10 (민서, 08-10): the radio
 * prints NO mark. The `◈` sat in the gutter of a line that is already the only
 * thing on the paper in `--radio` at 700 weight, so the ink and the weight were
 * doing the marking twice; it went out with the `ECHO-n · 무전` caption that
 * used to head the same line ((i) below).
 *
 * It is kept as a DELTA against the reference rather than written into the table
 * so both halves stay provable: what the reference printed, and what this port
 * decided not to. `''` and not "absent" — that is what keeps the 21px mark
 * gutter reserved, and the radio's text on the common left edge.
 */
const MARK_DEVIATIONS: Partial<Record<FeedKind, string>> = { radio: '' }

const EXPECTED_MARKS: Record<FeedKind, string> = { ...REFERENCE_MARKS, ...MARK_DEVIATIONS }

const EVENTS: readonly ViewEvent[] = woodariRun03.events

const feedLines = (): FeedLine[] =>
  EVENTS.flatMap((e) => (e.type === 'feed' ? [e.line] : []))

const linesOfKind = (kind: FeedKind): FeedLine[] => feedLines().filter((l) => l.kind === kind)

/**
 * `feedLineModel`'s band argument is optional by contract — the band flip is
 * *instance* state (design D12 / app.js:434), never part of a line's identity.
 * The cast keeps this suite agnostic about the arity the builder settles on.
 */
type ModelFn = (line: FeedLine, band?: boolean) => FeedNode
const model = (line: FeedLine, band?: boolean): FeedNode =>
  (feedLineModel as unknown as ModelFn)(line, band)

/** Everything a node renders as text, in order — the stamp is NOT text. */
const nodeText = (node: FeedNode): string =>
  node.parts.map((p: FeedPart) => ('text' in p ? p.text : '')).join('')

/* ══ [u5#c1] the seven kinds map 1:1 ═════════════════════════════════════ */

describe('[u5#c1] seven kinds map 1:1', () => {
  it('(a) FEED_MARKS has exactly the seven FeedKind keys — no more, no fewer', () => {
    expect(Object.keys(FEED_MARKS).sort()).toEqual([...KINDS].sort())
  })

  it('(b) every mark is the reference mark (app.js:405) but the one declared deviation', () => {
    for (const kind of KINDS) {
      expect(`${kind}:${FEED_MARKS[kind]}`).toBe(`${kind}:${EXPECTED_MARKS[kind]}`)
    }
    // The deviation is DECLARED, not discovered: exactly one kind may differ
    // from the reference table, and it is the radio, and it differs by having
    // no mark at all. A second silent drift fails here rather than in review.
    const drifted = KINDS.filter((k) => FEED_MARKS[k] !== REFERENCE_MARKS[k])
    expect(drifted).toEqual(['radio'])
    expect(FEED_MARKS.radio).toBe('')
    expect(REFERENCE_MARKS.radio, 'what the reference printed, kept on the record').toBe('◈')
  })

  it('(c) FEED_MARKS is exactly keyed by FeedKind at the type level', () => {
    // Compile-time half of "an unknown kind is a type error": `tsc -p
    // tsconfig.test.json` rejects this file if the key set ever drifts.
    type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
    const keysAreExactlyFeedKind: Exact<keyof typeof FEED_MARKS, FeedKind> = true
    expect(keysAreExactlyFeedKind).toBe(true)
  })

  it('(d) every kind yields the reference classes `fl fl-<kind>` and its mark', () => {
    for (const kind of KINDS) {
      const node = model({ kind, clock: '08:50', text: '본문', speaker: '서지형' })
      expect(node.kind).toBe(kind)
      expect(node.classes).toContain('fl')
      expect(node.classes).toContain(`fl-${kind}`)
      expect(node.mark).toBe(EXPECTED_MARKS[kind])
    }
  })

  it('(e) the band is instance state, never baked into a line model', () => {
    const line: FeedLine = { kind: 'event', clock: '08:50', text: '본문' }
    expect(model(line).classes).not.toContain('band')
  })

  it('(f) every kind but `mark` carries the line clock as a stamp; `mark` is one column', () => {
    for (const kind of KINDS) {
      const node = model({ kind, clock: '09:25', text: '본문', speaker: '서지형' })
      if (kind === 'mark') expect(node.stamp).toBeNull()
      else expect(node.stamp).toBe('09:25')
    }
  })

  it('(g) an unknown kind is refused at runtime, never rendered as a fallback line', () => {
    const rogue = { kind: 'gossip', clock: '08:50', text: '본문' } as unknown as FeedLine
    expect(() => model(rogue)).toThrow()
  })

  it('(h) the model switch is exhaustive — a `never` guard, not a default render', () => {
    const source = code('src/client/components/run-feed.ts')
    expect(source).toMatch(/never/)
  })

  // x10 (민서, 08-10) — this used to read 'radio renders a label part plus the
  // line text, verbatim'. The label was the `ECHO-n · 무전` caption, and it is
  // gone: it repeated on every radio line a name the fanfold's header already
  // prints once per run. What is left to pin is its ABSENCE, which is a claim
  // the caption's own test cannot make — the utterance alone, no caption before
  // it, no mark beside it, and the U5.4 citation still free to follow it.
  it('(i) radio renders the utterance alone — no channel caption, no mark', () => {
    const line: FeedLine = { kind: 'radio', clock: '08:51', text: '회선 유지합니다.' }
    const node = model(line)
    expect(node.parts.map((p: FeedPart) => p.p)).toEqual(['text'])
    expect(nodeText(node)).toBe(line.text)
    expect(node.mark).toBe('')
    // Not merely "no `label` part": the caption may not come back wearing
    // another part type either.
    expect(nodeText(node)).not.toContain('무전')

    // The citation is untouched by any of this — it still rides after the text.
    const cited: FeedLine = { ...line, cited_slots: [0] }
    expect(model(cited).parts.map((p: FeedPart) => p.p)).toEqual(['text', 'cite'])
  })

  // x8 — the npc line is the AGENT RELAYING what was said, not a screenplay
  // slug (민서, 08-10). The speaker and the quote are unchanged and still
  // verbatim; what is new is the reported-speech tail that closes the sentence.
  it('(j) npc renders the speaker, the text inside a quote, and the relay tail last', () => {
    const line: FeedLine = { kind: 'npc', clock: '08:50', text: '막을 수 있다.', speaker: '서지형' }
    const node = model(line)
    const label = node.parts.find((p: FeedPart) => p.p === 'label')
    const quote = node.parts.find((p: FeedPart) => p.p === 'quote')
    expect(label && 'text' in label ? label.text : '').toContain('서지형')
    expect(quote && 'text' in quote ? quote.text : '').toBe(line.text)

    // Order is the sentence: name, then what was said, then the framing verb.
    expect(node.parts.map((p: FeedPart) => p.p)).toEqual(['label', 'quote', 'text'])
    // The frame closes the line — it is a suffix, never wrapped around the text.
    expect(nodeText(node)).toMatch(/라고 [가-힣]+다$/)
    // …and it did not get there by touching the run's own words.
    expect(nodeText(node)).toContain(line.text)
    expect(nodeText(node)).toContain(line.speaker!)
  })

  it('(k) mark renders its text inside a span (the ruled divider), no stamp column', () => {
    const line: FeedLine = { kind: 'mark', clock: '12:40', text: '라운드 1 종료 · 보고서 작성' }
    const node = model(line)
    expect(node.parts.some((p: FeedPart) => p.p === 'span')).toBe(true)
    expect(nodeText(node)).toContain(line.text)
  })

  // x6 — this used to read 'wait renders breathing dots — never a spinner,
  // never a percentage'. There is no marker to render any more (민서, 08-09), so
  // what is left to pin is the half that still matters: the projection stays
  // TOTAL over the frozen seam's every kind. `wait` is still a `FeedKind`
  // (`shared/view-driver.ts`, held by `seam-shapes.test.ts`), so a `wait` line
  // handed to the model must come back as an ordinary envelope rather than
  // throwing — the dropping happens downstream, in `createRunFeed`, and (o)
  // below is where that is pinned.
  it('(l) wait survives the model as a plain line — the projection stays total', () => {
    const line: FeedLine = { kind: 'wait', clock: '09:25', text: '본문' }
    const node = model(line)
    expect(node.kind).toBe('wait')
    expect(nodeText(node)).toBe('본문')
    // x7 — the `dots` PART TYPE is gone, not merely unused, so this can no
    // longer be a value check: `p.p === 'dots'` is now a type error, which is a
    // stronger guarantee than the runtime assertion it replaces. What is left
    // to assert is that a wait line projects to ordinary text parts and nothing
    // else — no marker machinery survives anywhere in the projection.
    expect(node.parts.every((p: FeedPart) => p.p === 'text')).toBe(true)
    expect(nodeText(node)).not.toMatch(/%/)
  })

  it('(m) every kind in the demo stream survives the model without loss of text', () => {
    for (const line of feedLines()) {
      expect(nodeText(model(line))).toContain(line.text)
    }
  })

  // x6 — SIX skins, not seven. The seventh was `.fl-wait`, and it went with the
  // marker: the sheet is read with its comments blanked so the header's own
  // account of the removal cannot answer this scan for it.
  //
  // x8 — FIVE now. `.fl-symptom` went the same way and for a reason of the same
  // shape (민서, 08-10): the line is dropped before the DOM, so a skin for it
  // could only ever be dead paint. Both undrawn kinds are banned by name below,
  // so either one growing a skin back is a failure and not a silence.
  //
  // x11 — hoisted to module scope (`UNDRAWN_KINDS`), unchanged in content.
  const UNDRAWN = UNDRAWN_KINDS

  it('(n) u1 skin selectors exist for all five DRAWN kinds — the port has somewhere to land', () => {
    const css = code('src/client/styles/win-live-feed.css')
    for (const kind of KINDS.filter((k) => !UNDRAWN.includes(k))) expect(css).toContain(`.fl-${kind}`)
    for (const kind of UNDRAWN) {
      expect(css, `the ${kind} skin came back — nothing may carry \`.fl-${kind}\``).not.toContain(
        `.fl-${kind}`,
      )
    }
  })

  // x6 — the contract that replaced the whole waiting-marker mechanism, and the
  // one thing that must not rot: a wait DRAWS NOTHING. Both doors are pinned,
  // because the seam has two — a `wait` FEED LINE off the stream, and a bare
  // `waiting` event that arrives without one. The marker used to answer both.
  //
  // Asserted at the source, not by counting `<li>`s: this suite is
  // `environment: 'node'` and C2 forbids adding jsdom, so the rendered count
  // belongs to `e2e/run-loop.spec.ts` (`latency`), which reads `#feedList` on a
  // real desk and holds it at zero. What is provable here is that neither door
  // reaches `append`.
  it('(o) neither door draws a line — `wait` and `symptom` are dropped, a `waiting` event lands nothing', () => {
    const source = code('src/client/components/run-feed.ts')

    // Door 1: `appendLine` returns before it can build a node — for BOTH
    // undrawn kinds, in one guard. x8 put `symptom` beside `wait` there.
    //
    // x11 — and the two kinds are now named in a PREDICATE rather than in the
    // `if` itself, because the reveal pump asks the same question a second time:
    // a line that prints nothing may not cost the reader any time
    // (`printsFeedLine`), and two lists of which kinds are undrawn would be two
    // ways for the paper and its clock to disagree about what a beat contains.
    // So the claim this assert carries is stronger than the one it replaces —
    // one owner, and every reader of it found by name.
    const owner = /const\s+(\w+)\s*=\s*\(line[^)]*\)\s*:\s*boolean\s*=>([^\n]*)/.exec(source)
    expect(owner, 'the undrawn-kind rule is no longer a predicate over a line').toBeTruthy()
    const [, ownerName = '', rule = ''] = owner ?? []
    for (const kind of UNDRAWN) {
      expect(rule, `the ${kind} line is no longer one of the undrawn kinds`).toMatch(
        new RegExp(`line\\.kind\\s*===\\s*'${kind}'`),
      )
    }

    const drop = new RegExp(`if\\s*\\(\\s*${ownerName}\\(line\\)\\s*\\)\\s*\\{([^}]*)\\}`).exec(source)
    expect(drop, 'nothing short-circuits on the undrawn kinds before `append` any more').toBeTruthy()
    const body = drop?.[1] ?? ''
    expect(body, 'the undrawn-kind guard stopped returning').toMatch(/\breturn\b/)

    // x8 — and it still moves the DESK CLOCK on its way out. A dropped line is a
    // minute the run reached, and the first cut of the symptom removal proved
    // what happens without this: the demo day's last minute belongs to a beat
    // whose only line is a symptom, so the top bar froze at 21:00 on a run that
    // reaches 21:04 and the 집계 line inherited the stale stamp. The guard is
    // cheap and the failure is silent, which is exactly when to pin it.
    //
    // x11 gives it a second job: it is why a symptom stays in the reveal QUEUE
    // instead of being filtered out at `receive`. The pump consumes it for free
    // and this line is what it is consumed FOR.
    expect(body, 'a dropped line no longer advances the desk clock').toMatch(/advanceStamp\s*\(/)

    // The second reader of the same owner — the pump. If these ever part
    // company, one half of the module refuses to print a line while the other
    // half charges the player time for it.
    const prints = /export function printsFeedLine[\s\S]*?\n}/.exec(source)
    expect(prints, '`printsFeedLine` is gone — the pump has no way to ask').toBeTruthy()
    expect(prints?.[0] ?? '', 'the pump stopped reading the drop rule').toContain(`${ownerName}(`)

    // And a symptom cannot come back in by the OTHER door it used to have: the
    // `(변화 없음)` builder was a second entry into `append` that bypassed
    // `appendLine` entirely, driven off `beat_end`. Both are gone.
    expect(source, 'the empty-symptom builder is back').not.toMatch(/emptySymptomModel/)
    expect(source, "`beat_end` is being watched again — it fed the `(변화 없음)` line").not.toMatch(
      /case 'beat_end':/,
    )

    // Door 2: the `waiting` case is inert — it may not append, and it may not
    // reach for a marker builder that no longer exists.
    //
    // x11 — `break` became `return false`, which is the same inertia stated one
    // layer down: `apply` now answers whether it put a line on the paper, and a
    // `waiting` edge answering `false` is what stops the pump charging time for
    // it. Anything that appended would have to answer `true`, so the assert
    // still catches a case that started drawing.
    const waiting = /case 'waiting':([\s\S]*?)(?=\n\s{6}case |\n\s{6}default)/.exec(source)
    expect(waiting, "the `waiting` case vanished from `apply` — it must stay, and stay empty").toBeTruthy()
    expect((waiting?.[1] ?? '').trim()).toBe('return false')

    // And nothing in the unit reaches for the deleted module at all.
    for (const file of SOURCES) {
      expect(`${file}:${/waiting-marker|waitingModel/.test(code(file))}`).toBe(`${file}:false`)
    }
    expect(read('src/client/components/waiting-marker.ts')).toBe('')
  })
})

/* ══ x11 — the paper types, and only a printed line costs time ════════════
   민서, 08-10. Three claims live here, and every one of them fails SILENTLY if
   it rots: a feed that charges time for events nobody sees just goes quiet; a
   flush that leaves the cursor mid-word only shows up as a truncated assertion
   somewhere else; and a drain count that never reaches zero hangs the ending
   with no error at all. None of them can be watched from `environment: 'node'`,
   so each is pinned either as pure arithmetic or at the source.
   ═══════════════════════════════════════════════════════════════════════ */

describe('x11 the reveal pump charges time for lines, never for events', () => {
  const RUN_FEED = 'src/client/components/run-feed.ts'

  /** The demo stream's printing events, counted independently of the module. */
  const printing = EVENTS.filter(
    (e) => e.type === 'score' || (e.type === 'feed' && !UNDRAWN_KINDS.includes(e.line.kind)),
  )

  it('(a) `printsFeedLine` answers true for exactly the events that put a line on paper', () => {
    const said = EVENTS.filter((e) => printsFeedLine(e))
    expect(said.length, 'the demo stream has no printing events at all — the scan is vacuous').toBeGreaterThan(0)
    expect(said).toEqual(printing)
  })

  it('(b) every kind of event the stream carries that prints nothing is free', () => {
    // The named cost of the old pump: a gate beat's `beat_start`, its four
    // `waiting` edges and its `beat_end` each bought a 600 ms floor, because
    // the delay was priced per QUEUED EVENT and everything that was not a feed
    // line priced at zero characters. Five or six of them a beat is about three
    // seconds of dead air between two lines that had something to say.
    const free = EVENTS.filter((e) => !printsFeedLine(e))
    const kinds = [...new Set(free.map((e) => e.type))].sort()
    expect(kinds, 'the stream stopped carrying non-printing events').not.toEqual([])
    expect(free.some((e) => e.type === 'feed'), 'no dropped feed line is in the stream').toBe(true)
    expect(kinds).toContain('waiting')
    expect(kinds).toContain('beat_start')
    expect(kinds).toContain('beat_end')
  })

  it('(c) the pump consumes the free events before it can spend a millisecond', () => {
    const source = code(RUN_FEED)
    const step = /const printNext = [\s\S]*?\n {2}\}/.exec(source)?.[0] ?? ''
    expect(step, 'the pump step is gone — nothing drains the queue at a pace').not.toBe('')

    // The free half is everything before the pump admits it is holding a line.
    const free = step.split('if (queue.length === 0) return')[0] ?? ''
    expect(free, 'the free drain no longer asks whether the head prints').toContain('printsFeedLine')
    expect(free, 'the free drain spends time on an event that prints nothing').not.toMatch(
      /(pauseMs|holdMs|typing)\s*=[^=]/,
    )

    // …and it cannot spin. Nothing here pushes to the queue, so the loop is
    // bounded by construction — but an unbounded synchronous loop inside an
    // animation tick is a frozen desk rather than a slow one, and the bound is
    // cheap enough that "by construction" is not the argument we rest on.
    expect(free, 'the free drain lost its loop bound').toMatch(/guard/)
    expect(/const flush = [\s\S]*?\n {2}\}/.exec(source)?.[0] ?? '', 'the flush lost its loop bound').toMatch(
      /guard/,
    )
  })

  it('(d) the desk-clock pause is proportional, opens above zero, and is capped', () => {
    expect(feedGapMs('', '08:50'), 'the first line of the day waits for nothing').toBe(0)
    expect(feedGapMs('08:50', '08:50'), 'two lines in one minute wait for nothing').toBe(0)
    expect(feedGapMs('09:25', '08:50'), 'a backwards stamp owes a negative pause').toBe(0)

    // Monotone up to the cap, and never past it.
    const OPEN = mm('08:00')
    let previous = 0
    for (let gap = 1; gap <= 120; gap += 1) {
      const ms = feedGapMs('08:00', hhmm(OPEN + gap))
      expect(ms).toBeGreaterThanOrEqual(previous)
      expect(ms).toBeLessThanOrEqual(feedGapMs('08:00', '12:00'))
      previous = ms
    }

    // The cap is not decoration: it binds INSIDE the shipped pack's own range.
    // `멈춘회전문` runs gaps of 0..33 sim-minutes and the demo fixture reaches
    // 89, so raw proportionality would put a thirty-fold spread on the pauses
    // of one day. Capped, the longest silence of the run is worth under four of
    // the shortest hops.
    const shortest = feedGapMs('08:50', '08:51')
    const longest = feedGapMs('08:50', '10:19')
    expect(longest / shortest, 'the pause spread grew past what a player will sit through').toBeLessThan(4)
    expect(longest, 'the cap stopped binding on the packs we ship').toBe(feedGapMs('08:50', '09:33'))
  })

  it('(e) the whole demo day of paper still fits inside the day of sim it prints', () => {
    // The one number the pacing block claims out loud, pinned to the constants
    // it is a function of — `slot-board.ts`'s note is the precedent, and the
    // reason is the same: a comment that states a total goes stale with the
    // numbers beside it, and this one is the argument that removing the crowd
    // divisor was affordable. What must hold is that a run drains inside its own
    // day at ×1 and that the pacing has not been quietly tuned down to a dump.
    //
    // x12 — "with room for the report holds" is struck from that sentence: the
    // holds are gone (`run-feed.ts`, where `REPORT_HOLD_MS` was) and the sum
    // below never charged for them anyway, so the margin this leaves is now
    // margin and nothing else. It is also the margin the report GATE spends —
    // REPORTS waits for the paper to reach a round before it draws it
    // (`shell/feed-reach.ts`), so the day's documents land a lag behind the
    // seam, and the lag is exactly what this bound keeps small.
    let at = ''
    let paper = 0
    for (const event of EVENTS) {
      // A dropped line still moves the desk clock, so it still moves the gap the
      // next printed line is priced against — and costs nothing itself.
      if (event.type === 'feed' && UNDRAWN_KINDS.includes(event.line.kind)) {
        at = event.line.clock
        continue
      }
      if (!printsFeedLine(event)) continue
      if (event.type !== 'feed') {
        // A `score` line reuses the last stamp (it carries none of its own), so
        // it owes no pause. It types like any other line; its length is
        // `tally-line.ts`'s business and not a fixture literal to assert here
        // (C3), so it is priced as a bare row.
        paper += FEED_PACE.msBetween
        continue
      }
      const node = model(event.line)
      paper += feedGapMs(at, event.line.clock)
      const chars = nodeText(node).length
      paper += typesOut(event.line.kind) ? typeDuration([chars], FEED_PACE) : FEED_PACE.msBetween
      // …and the desk clock moves only for a line that HAS a stamp: a `mark` is
      // one column wide and carries none, so the round divider does not reset
      // what the next line's pause is measured from. Read off the model rather
      // than off a rule restated here.
      at = node.stamp ?? at
    }
    const day = (mm(woodariRun03.end) - mm(woodariRun03.start)) * MS_PER_SIM_MIN
    expect(paper, 'the paper cannot keep up with the day it prints').toBeLessThan(day)
    expect(paper / day).toBeLessThan(0.8)
    expect(paper / day, 'the pacing collapsed — the day would print as a dump').toBeGreaterThan(0.4)
  })
})

describe('x11 a flush lands the whole line, and the drain reaches zero', () => {
  const RUN_FEED = 'src/client/components/run-feed.ts'
  const source = (): string => code(RUN_FEED)

  const PARTS: FeedPart[] = [
    { p: 'label', text: '서지형 ' },
    { p: 'quote', text: '막을 수 있다.' },
    { p: 'text', text: '라고 말한다' },
  ]
  const whole = PARTS.map((p) => p.text).join('')

  it('(a) the cursor shows a PREFIX of the line and nothing else, at every position', () => {
    for (let chars = 0; chars <= whole.length + 5; chars += 1) {
      const shown = typedParts(PARTS, chars).map((p) => p.text).join('')
      expect(shown).toBe(whole.slice(0, Math.min(chars, whole.length)))
    }
  })

  it('(b) a settled cursor is the parts themselves — the complete text, unaltered', () => {
    expect(typedParts(PARTS, whole.length)).toEqual(PARTS)
    expect(typedParts(PARTS, 0)).toEqual([])
    // A part not reached yet is ABSENT, never an empty one: an empty `<q>` still
    // renders its quote marks, so an npc line would open with a bare pair of
    // them and fill them afterwards — the frame arriving before the utterance.
    expect(typedParts(PARTS, 1).length).toBe(1)
  })

  it('(c) `flush` settles the typewriter as well as the queue', () => {
    // The promise every test and every e2e read after a flush is built on:
    // `textContent` is complete the instant it returns. `windows/live-feed.ts`
    // hands `flush` to `seek`, which is how e2e reaches the day's terminal.
    const flush = /const flush = [\s\S]*?\n {2}\}/.exec(source())?.[0] ?? ''
    expect(flush, 'the flush is gone').not.toBe('')
    expect(flush, 'a flush no longer settles the line that is typing').toMatch(/settleTyping\(\)/)
    // …and settling paints every part, rather than moving a cursor to the end.
    const settle = /const settleTyping = [\s\S]*?\n {2}\}/.exec(source())?.[0] ?? ''
    expect(settle, 'settling stopped painting the whole line').toMatch(/\.parts\.map\(partNode\)/)
  })

  it('(d) what the feed owes is queued events plus the line still typing', () => {
    const publish = /const publishPending = [\s\S]*?\n {2}\}/.exec(source())?.[0] ?? ''
    expect(publish, 'nothing publishes the outstanding count any more').toMatch(/publishFeedPending\(/)
    expect(publish, 'the count stopped counting the queue').toMatch(/queue\.length/)
    expect(publish, 'the count stopped counting the line being typed').toMatch(/typing/)
  })

  it('(e) every mutation of the backlog publishes it — the ending waits on this number', () => {
    // A count that stops being published is an ending that never comes down:
    // `shell/feed-drain.ts` resolves on the transition to zero and nothing else
    // wakes it. Each of these is a place the backlog changes size.
    for (const owner of ['const receive = ', 'const flush = ', 'const printNext = ', 'const settleTyping = ']) {
      const body = new RegExp(`${owner}[\\s\\S]*?\\n {2}\\}`).exec(source())?.[0] ?? ''
      expect(body, `${owner.trim()} is gone`).not.toBe('')
      expect(body, `${owner.trim()} changes the backlog without publishing it`).toMatch(/publishPending\(\)/)
    }
  })

  it('(f) the day ends by DRAINING — `run_end` is not a flush bypass any more', () => {
    const receive = /const receive = [\s\S]*?\n {2}\}/.exec(source())?.[0] ?? ''
    expect(receive, 'the subscriber is gone').not.toBe('')
    expect(receive, '`run_end` is dumping the backlog again — the ending would veil a wall').not.toMatch(
      /run_end/,
    )
    // The bypasses that must stay: a frozen pump never ticks, and reduced motion
    // is a promise that nothing animates.
    expect(receive, 'the frozen / reduced-motion bypass is gone — lines would never land').toMatch(
      /motionless\(\)/,
    )
  })

  it('(g) the pump and the settle watchdog draw the same line between PAUSED and ENDED', () => {
    // They did not, and that was the bug: `settle` flushed only a stopped desk
    // (`!running && !ended`) while the pump flushed anything not running, so
    // reaching 21:04 dumped the rest of the day in one frame.
    const src = source()
    expect(src, 'the paused/ended distinction lost its single owner').toMatch(
      /const halted = \(\): boolean => !driver\.clock\.running && !driver\.clock\.ended/,
    )
    const bare = src.match(/!driver\.clock\.running/g) ?? []
    expect(
      `${bare.length} readings of \`!clock.running\``,
      'something tests the clock without asking whether the run has ENDED',
    ).toBe('1 readings of `!clock.running`')
  })
})

/* ══ x11 — the live region pays for the typing ════════════════════════════ */

describe('x11 the typed half is hidden and the announced half is whole', () => {
  it('(a) the content column is aria-hidden and carries an sr-only twin', () => {
    // `#feedList` is a `role="log"` / `aria-live="polite"` region, and a node
    // whose text is rewritten every frame inside one can be re-announced per
    // character. The DOM shape is verified in `e2e/live-feed.spec.ts` against a
    // real desk; what is provable here is that the builder still writes it.
    const build = /function lineElement\([\s\S]*?\n\}/.exec(code('src/client/components/run-feed.ts'))?.[0] ?? ''
    expect(build, '`lineElement` is gone').not.toBe('')
    expect(build, 'the typing half is back in the live region').toMatch(
      /content\.setAttribute\('aria-hidden', 'true'\)/,
    )
    expect(build, 'the sr-only twin is gone — the region would announce nothing').toMatch(/SR_LINE_CLASS/)
    expect(build, 'the twin no longer carries the complete line').toMatch(/lineText\(node\)/)
    expect(build, '`.fl-c` lost its class or its mark — every e2e selector reads it').toMatch(/'fl-c'/)
  })

  it('(b) the sr-only recipe is EXTRACTED, not copied — one rule, and #toast still on it', () => {
    // Comments blanked: the sheet's own note names `.sr-only` while explaining
    // the extraction, and a scan that its prose can answer proves nothing.
    const shell = code('src/client/styles/shell.css')
    const rule = /([^{}\n]*\.sr-only[^{}]*)\{([^}]*)\}/.exec(shell)
    expect(rule, '`.sr-only` is not declared in shell.css').toBeTruthy()
    const [, selector = '', body = ''] = rule ?? []
    expect(selector, '#toast lost the recipe it owned first').toContain('#toast')
    // The three clauses that comment argues for at length.
    expect(body).toMatch(/position:\s*fixed/)
    expect(body).toMatch(/width:\s*1px/)
    expect(body).toMatch(/clip-path:\s*inset\(50%\)/)
    // Not `display:none` / `visibility:hidden` — either takes it out of the
    // accessibility tree and silences the very thing it exists for.
    expect(body).not.toMatch(/display:\s*none|visibility:\s*hidden/)
    // And nobody copied it: the feed's sheet declares no box for the twin.
    expect(code('src/client/styles/win-live-feed.css'), 'the recipe was duplicated into the feed sheet').not.toMatch(
      /\.fl-sr[^{}]*\{/,
    )
  })
})

/* ══ [u5#c3] no digit renders for NPC state (spec §3 inv 2 / I12) ═════════ */

describe('[u5#c3] no digit in npc/symptom nodes', () => {
  it('(a) the demo stream actually carries npc and symptom lines to scan', () => {
    expect(linesOfKind('npc').length).toBeGreaterThan(0)
    expect(linesOfKind('symptom').length).toBeGreaterThan(0)
  })

  it('(b) no npc node renders a digit in any text part', () => {
    const offenders = linesOfKind('npc')
      .map((line) => ({ line, text: nodeText(model(line)) }))
      .filter((x) => DIGIT.test(x.text))
      .map((x) => `${x.line.clock} — ${x.text}`)
    expect(offenders).toEqual([])
  })

  it('(c) no symptom node renders a digit in any text part', () => {
    const offenders = linesOfKind('symptom')
      .map((line) => ({ line, text: nodeText(model(line)) }))
      .filter((x) => DIGIT.test(x.text))
      .map((x) => `${x.line.clock} — ${x.text}`)
    expect(offenders).toEqual([])
  })

  it('(d) the clock stamp is a separate field — chrome, never inside an npc/symptom text part', () => {
    for (const kind of ['npc', 'symptom'] as const) {
      for (const line of linesOfKind(kind)) {
        const node = model(line)
        expect(node.stamp).toBe(line.clock)
        expect(nodeText(node)).not.toContain(line.clock)
      }
    }
  })

  // x8 — (e) was 'the empty-symptom state renders no digit either'. It measured
  // `emptySymptomModel`, the `(변화 없음)` line a silent beat printed; there is
  // no such line and no such builder (민서, 08-10). The claim survives the same
  // way the wait phrasings' did: a symptom cannot render a digit because a
  // symptom does not render, and `[u5#c1] (o)` holds both of its doors shut.
  //
  // (b)–(d) above are untouched and are NOT vacuous: `feedLineModel` still
  // projects a `symptom` line — the kind is on the frozen seam and the
  // projection must stay total — so the scan still runs over real fixture text.
  // What changed is only that `createRunFeed` never puts the result on paper.

  // x6 — (f) was 'the waiting marker renders no digit for any `for` (latency is
  // not a number)'. It measured the marker's three phrasings; there is no
  // marker. The claim it defended survives without it and is stronger for it:
  // latency is not a number because the desk shows NOTHING for a wait, so there
  // is no surface left that could ever count one. `(o)` in `[u5#c1]` holds that.

  it('(g) the fallback error code never reaches a text part — it is data', () => {
    const line: FeedLine = { kind: 'fallback', clock: '17:33', text: '회신 불량.' }
    const node = model(line)
    expect(nodeText(node)).toBe(line.text)
    expect(nodeText(node)).not.toContain('504')
  })
})

/* ══ [u5#c5] the component state table ════════════════════════════════════

   [u5#c4] — 'waiting phrasing is picked by `waiting.for`' — is GONE, x6. It
   pinned three diegetic phrasings (`무전 회신 대기 중` · `현장 상황 수신 대기 중`
   · `보고서 회신 대기 중`), the `……` lead and the breathing dots, all of which
   the marker no longer has because the marker no longer exists (민서, 08-09).

   What holds in its place: `waiting.for` picks NOTHING, because the client draws
   and says nothing for a wait at all. `[u5#c1] (o)` is the guard, and it is a
   stricter one — c4 could only ever check that the three phrasings differed,
   while (o) checks that neither door onto the paper is open.

   The `for` field itself is untouched on the frozen seam (`shared/view-driver.ts`,
   `tests/driver/seam-shapes.test.ts`), and `src/driver/live-driver.ts` still
   emits it; the ADAPTER's queue is built around the bracket. The originals that
   asked for the phrasings — `docs/design/phase2-ui/README.md`'s latency bullet
   and spec-client §3 inv 5, whose component table still lists a `WaitingMarker`
   — now describe a component with no implementation.
   ═══════════════════════════════════════════════════════════════════════ */

describe('[u5#c5] fallback class comes from the event, never from the text', () => {
  it('(a) the three engine §5 calls map to the three classes', () => {
    expect(FALLBACK_CLASS[1]).toBe('fatal')
    expect(FALLBACK_CLASS[2]).toBe('local')
    expect(FALLBACK_CLASS[3]).toBe('supply-cut')
  })

  it('(b) every class carries a label for the unpaired-event state', () => {
    for (const call of [1, 2, 3] as const) {
      const label = (FALLBACK_LABEL as unknown as Record<string, string>)[FALLBACK_CLASS[call]]
      expect(typeof label).toBe('string')
      expect((label ?? '').length).toBeGreaterThan(0)
      expect(DIGIT.test(label ?? '')).toBe(false)
    }
  })

  it('(c) the fixture pairs the 17:33 fallback event with a fallback feed line', () => {
    const i = EVENTS.findIndex((e) => e.type === 'fallback')
    expect(i).toBeGreaterThanOrEqual(0)
    const next = EVENTS.slice(i + 1).find((e) => e.type === 'feed')
    expect(next && next.type === 'feed' ? next.line.kind : '').toBe('fallback')
    expect(next && next.type === 'feed' ? next.line.clock : '').toBe('17:33')
  })

  it('(d) the run continues past the fallback — more feed lines follow it', () => {
    const i = EVENTS.findIndex((e) => e.type === 'fallback')
    const after = EVENTS.slice(i + 1).filter((e) => e.type === 'feed')
    expect(after.length).toBeGreaterThan(1)
  })
})

/* ══ [u5#c6] no private timer lives in this window ════════════════════════ */

describe('[u5#c6] lines land on the driver clock, not on a timer of their own', () => {
  it('(a) no setInterval / setTimeout anywhere in the unit', () => {
    for (const file of SOURCES) {
      expect(`${file}:${/setInterval|setTimeout/.test(code(file))}`).toBe(`${file}:false`)
    }
  })

  it('(b) three rAF in run-feed — prefill catch-up + the U1 settle watchdog pair', () => {
    for (const file of SOURCES) {
      const hits = (code(file).match(/requestAnimationFrame/g) ?? []).length
      const allowed = file.endsWith('run-feed.ts') ? 3 : 0
      expect(`${file}: ${hits} rAF (max ${allowed})`).toBe(
        `${file}: ${Math.min(hits, allowed)} rAF (max ${allowed})`,
      )
    }
  })

  it('(c) one reveal pump in run-feed (U1) — otherwise no animation hook, no clock', () => {
    for (const file of SOURCES) {
      const source = code(file)
      const hooks = (source.match(/registerAnimation/g) ?? []).length
      const allowed = file.endsWith('run-feed.ts') ? 2 : 0
      expect(`${file}: ${hooks} registerAnimation (max ${allowed})`).toBe(
        `${file}: ${Math.min(hooks, allowed)} registerAnimation (max ${allowed})`,
      )
      expect(source).not.toMatch(/new\s+Date\(|performance\.now\(/)
      expect(source).not.toMatch(/createClock\(/)
    }
  })

  it('(d) the only input is the driver seam — subscribe and frame', () => {
    const source = code('src/client/components/run-feed.ts')
    expect(source).toMatch(/\.subscribe\(/)
    expect(source).toMatch(/\.frame\(/)
  })
})

/* ══ [u5#c7] untouchable during a run ═════════════════════════════════════ */

describe('[u5#c7] the feed attaches nothing a player can touch', () => {
  it('(a) no listener a player can OPERATE is attached anywhere in the unit', () => {
    for (const file of SOURCES) {
      const source = code(file)
      // U2 narrowed this from "no listener at all". A listener and a control are
      // not the same thing, and c7 is about the second: the window prints
      // `열람 전용 — 이 창은 조작되지 않습니다`, so it offers no button, no
      // handle, no target. `scroll` is the one exception and is not a control —
      // it is passive, it only READS an offset this window already owns, and it
      // reaches nothing a player could not already do by scrolling the paper.
      // Every pointer and selection event stays banned outright.
      const all = (source.match(/addEventListener/g) ?? []).length
      const passive = (source.match(/addEventListener\(\s*'scroll'/g) ?? []).length
      expect(`${file}: ${all} listeners, ${passive} of them scroll`).toBe(
        `${file}: ${passive} listeners, ${passive} of them scroll`,
      )
      expect(`${file}:${/\bon(click|mousedown|pointerdown|select)\s*=/.test(source)}`).toBe(`${file}:false`)
    }
  })

  it('(a2) the unit builds no interactive element — nothing to operate exists', () => {
    // The guard that carries c7 now that (a) admits a passive read: whatever the
    // unit puts on screen, none of it is a control. A window with no button, no
    // link and no field cannot be operated however its listeners are written.
    for (const file of SOURCES) {
      const built = /el\(\s*'(button|a|input|select|textarea|label|form|details|summary)'|\bbutton\(/.test(code(file))
      expect(`${file}:${built}`).toBe(`${file}:false`)
    }
  })

  it('(b) no mining surface — no sentence_id, no .minable, no MembraneOp', () => {
    for (const file of SOURCES) {
      const source = code(file)
      expect(`${file}:${/sentence_id|sentenceId|minable/.test(source)}`).toBe(`${file}:false`)
      expect(`${file}:${/\.send\(|MembraneOp/.test(source)}`).toBe(`${file}:false`)
    }
  })
})

/* ══ [u5#c9] renders only — never derives or reformats sentence text ══════ */

describe('[u5#c9] the window renders, never authors', () => {
  it('(a) every unit file exists', () => {
    for (const file of SOURCES) expect(`${file}:${read(file).length > 0}`).toBe(`${file}:true`)
  })

  // x11 — NARROWED BY SHAPE, and this is the one exemption the rule has.
  //
  // The fanfold types its lines out (민서, 08-10), and what a typewriter draws is
  // a PREFIX of what it is about to draw. That is a `slice`, and there is no
  // spelling of it that is not one. What the rule was defending — that the
  // window never derives, pads, reformats or re-authors the run's own words —
  // survives intact, because the exemption is written as a shape rather than as
  // a file: `.text.slice(0, <identifier>)`, from zero, once, in the one module
  // that types. A middle, a pad, an upper-casing or a second slice all still
  // fail, and the complete text lands regardless of the cursor (`settleTyping`
  // repaints every part, and the sr-only twin has carried the whole line since
  // its first frame — see the x11 block below).
  it('(b) no string transform is applied to feed text or speaker — save the type cursor’s prefix', () => {
    const TRANSFORM =
      /\.(text|speaker)\s*\.\s*(slice|replace|replaceAll|trim|trimStart|trimEnd|split|toUpperCase|toLowerCase|padStart|padEnd|substring|substr|normalize|concat|repeat)\b/g
    const PREFIX = /\.text\.slice\(0,\s*[A-Za-z_$][\w$]*\)/g
    for (const file of SOURCES) {
      const source = code(file)
      const hits = source.match(TRANSFORM) ?? []
      const prefixes = source.match(PREFIX) ?? []
      // Every transform in the file is a type-cursor prefix …
      expect(`${file}: ${hits.length} transforms, ${prefixes.length} of them a prefix`).toBe(
        `${file}: ${prefixes.length} transforms, ${prefixes.length} of them a prefix`,
      )
      // … and only `run-feed.ts` may hold one, exactly one, ever.
      const allowed = file.endsWith('run-feed.ts') ? 1 : 0
      expect(`${file}: ${prefixes.length} prefix slices (max ${allowed})`).toBe(
        `${file}: ${Math.min(prefixes.length, allowed)} prefix slices (max ${allowed})`,
      )
    }
  })

  // x10 (민서, 08-10) — FIVE, not six, and not the same five it started with.
  // Two literals left and one arrived, in two separate changes that met here:
  // `' · 무전'` went with the radio's channel caption and `'(변화 없음)'` with
  // the empty-symptom line, so the window authors neither word any more; the
  // NPC relay frame `'라고 말한다'` is what took their place. The set shrinking
  // is itself part of the guard — do not put either departure back.
  it('(c) run-feed.ts authors exactly the five declared chrome literals', () => {
    const ALLOWED = new Set([
      '연속용지 · 상황실 무전 기록',
      '열람 전용 — 이 창은 조작되지 않습니다',
      // x8's NPC frame. Chrome, and the one piece of it that is a SENTENCE: the
      // feed is the agent's radio record, so an NPC's answer is printed as the
      // agent relaying it (`표기웅 “…”라고 말한다`) rather than as a screenplay
      // slug. It authors nothing about the scenario — the speaker and the line
      // are still the run's, verbatim, and (b) above holds that.
      //
      // `(변화 없음)` came OUT in the same change: the empty-symptom line that
      // was the only thing minting it is gone.
      '라고 말한다',
      // U5.4's citation mark. Chrome, not run text: it names a SLOT of the
      // operator's own file — the same word the AGENT FILE prints over those
      // slots — and authors nothing about the scenario.
      '인수인계',
      // U2's behind-indicator. Chrome about the VIEWPORT — it counts lines the
      // window has already printed and authors nothing about the run itself.
      '▾ 미열람 ${missed}줄',
    ])
    const hangul = literals(code('src/client/components/run-feed.ts')).filter((s) => HANGUL.test(s))
    expect(hangul.filter((s) => !ALLOWED.has(s))).toEqual([])
  })

  // x6 — (d) was 'waiting-marker.ts authors exactly the three WAIT_PHRASE
  // values'. The file it scanned is deleted, and the contract that replaced it
  // is that the unit authors NO wait copy at all: `(c)` above already fixes
  // run-feed.ts's chrome literals to a closed set that no longer contains one,
  // and the scan below says the same thing across every file the unit owns, so
  // a phrasing cannot creep back in under a different name.
  it('(d) no unit file authors a wait phrasing any more — the marker left no copy behind', () => {
    for (const file of SOURCES) {
      const said = literals(code(file)).filter((s) => /대기 중|회신 도착/.test(s))
      expect(`${file}: ${said.join(' · ')}`).toBe(`${file}: `)
    }
  })

  it('(e) fallback-notice.ts authors at most the three per-class labels', () => {
    const source = code('src/client/components/fallback-notice.ts')
    expect(source).toMatch(/FALLBACK_LABEL/)
    const hangul = new Set(literals(source).filter((s) => HANGUL.test(s)))
    expect(hangul.size).toBeLessThanOrEqual(3)
  })

  it('(f) live-feed.ts authors no player-visible text at all', () => {
    const hangul = literals(code('src/client/windows/live-feed.ts')).filter((s) => HANGUL.test(s))
    expect(hangul).toEqual([])
  })

  it('(g) the run number is never hardcoded — it arrives on the `meta` event (C3)', () => {
    for (const file of SOURCES) {
      expect(`${file}:${/RUN\s*0?\d/.test(code(file))}`).toBe(`${file}:false`)
    }
    expect(code('src/client/components/run-feed.ts')).toMatch(/'meta'|"meta"/)
  })
})

/* ══ import safety (C8 · inv 12 · u3's rule) ══════════════════════════════ */

describe('[u5#c10] the unit stays inside its seam', () => {
  it('(a) nothing imports engine, composer or a stylesheet', () => {
    for (const file of SOURCES) {
      const source = code(file)
      expect(`${file}:${/from\s+['"][^'"]*(engine|composer)[^'"]*['"]/.test(source)}`).toBe(`${file}:false`)
      expect(`${file}:${/\.css['"]/.test(source)}`).toBe(`${file}:false`)
    }
  })

  it('(b) no window imports a sibling window', () => {
    const source = code('src/client/windows/live-feed.ts')
    expect(source).not.toMatch(/from\s+['"]\.\/(agent-file|block-store|reports|tally)\.ts['"]/)
  })

  it('(c) no DOM is touched at module scope', () => {
    for (const file of SOURCES) {
      const top = code(file)
        .split('\n')
        .filter((l) => /^(const|let|var)\s/.test(l))
        .join('\n')
      expect(`${file}:${/document\.|window\./.test(top)}`).toBe(`${file}:false`)
    }
  })

  it('(d) live-feed.ts still exports the shell-facing `mount(host, driver)`', () => {
    expect(code('src/client/windows/live-feed.ts')).toMatch(/export function mount\s*\(/)
  })
})

/* ══ U5.4 — the citation mark ════════════════════════════════════════════ */

describe('[U5.4] the agent line names the slots that moved it', () => {
  it('(a) a cited radio line gains a cite part, numbered as the file numbers it', () => {
    const line: FeedLine = { kind: 'radio', clock: '09:26', text: '질문지를 덮겠습니다.', cited_slots: [1] }
    const node = feedLineModel(line)
    const cite = node.parts.find((p) => p.p === 'cite')
    // Slot 1 at the seam is 인수인계 02 on the paper — the AGENT FILE prints
    // `pad2(slot + 1)` and the two must not drift.
    expect(cite && 'text' in cite ? cite.text : '').toBe('인수인계 02')
  })

  it('(b) several slots read ascending, and an empty citation prints nothing', () => {
    const many: FeedLine = { kind: 'radio', clock: '16:43', text: '재분류를 요청합니다.', cited_slots: [2, 0] }
    const cite = feedLineModel(many).parts.find((p) => p.p === 'cite')
    expect(cite && 'text' in cite ? cite.text : '').toBe('인수인계 01 · 03')

    const none: FeedLine = { kind: 'radio', clock: '08:51', text: '회선 유지합니다.', cited_slots: [] }
    expect(feedLineModel(none).parts.some((p) => p.p === 'cite')).toBe(false)
    const absent: FeedLine = { kind: 'radio', clock: '08:51', text: '회선 유지합니다.' }
    expect(feedLineModel(absent).parts.some((p) => p.p === 'cite')).toBe(false)
  })
})
