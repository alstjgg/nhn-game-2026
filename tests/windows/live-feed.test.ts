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
import { FEED_MARKS, feedLineModel } from '../../src/client/components/run-feed.ts'
import type { FeedNode, FeedPart } from '../../src/client/components/run-feed.ts'
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

  it('(b) every mark is the reference mark (app.js:405), character for character', () => {
    for (const kind of KINDS) {
      expect(FEED_MARKS[kind]).toBe(REFERENCE_MARKS[kind])
    }
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
      expect(node.mark).toBe(REFERENCE_MARKS[kind])
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

  it('(i) radio renders a label part plus the line text, verbatim', () => {
    const line: FeedLine = { kind: 'radio', clock: '08:51', text: '회선 유지합니다.' }
    const node = model(line)
    expect(node.parts.some((p: FeedPart) => p.p === 'label')).toBe(true)
    expect(nodeText(node)).toContain(line.text)
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
  const UNDRAWN: FeedKind[] = ['wait', 'symptom']

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
    // The early return that tests `line.kind` — the module has several others
    // (`follow`, `reread`, the reveal pump), so the guard is found by what it
    // READS, not by being first.
    const drop = /if\s*\(([^)]*line\.kind[^)]*)\)\s*\{([^}]*)\}/.exec(source)
    expect(drop, 'nothing short-circuits on `line.kind` before `append` any more').toBeTruthy()
    const [, condition = '', body = ''] = drop ?? []
    expect(body, 'the undrawn-kind guard stopped returning').toMatch(/\breturn\b/)
    for (const kind of UNDRAWN) {
      expect(condition, `the ${kind} line no longer short-circuits before \`append\``).toMatch(
        new RegExp(`line\\.kind\\s*===\\s*'${kind}'`),
      )
    }

    // x8 — and it still moves the DESK CLOCK on its way out. A dropped line is a
    // minute the run reached, and the first cut of the symptom removal proved
    // what happens without this: the demo day's last minute belongs to a beat
    // whose only line is a symptom, so the top bar froze at 21:00 on a run that
    // reaches 21:04 and the 집계 line inherited the stale stamp. The guard is
    // cheap and the failure is silent, which is exactly when to pin it.
    expect(body, 'a dropped line no longer advances the desk clock').toMatch(/advanceStamp\s*\(/)

    // And a symptom cannot come back in by the OTHER door it used to have: the
    // `(변화 없음)` builder was a second entry into `append` that bypassed
    // `appendLine` entirely, driven off `beat_end`. Both are gone.
    expect(source, 'the empty-symptom builder is back').not.toMatch(/emptySymptomModel/)
    expect(source, "`beat_end` is being watched again — it fed the `(변화 없음)` line").not.toMatch(
      /case 'beat_end':/,
    )

    // Door 2: the `waiting` case is inert — it may not append, and it may not
    // reach for a marker builder that no longer exists.
    const waiting = /case 'waiting':([\s\S]*?)(?=\n\s{6}case |\n\s{6}default)/.exec(source)
    expect(waiting, "the `waiting` case vanished from `apply` — it must stay, and stay empty").toBeTruthy()
    expect((waiting?.[1] ?? '').trim()).toBe('break')

    // And nothing in the unit reaches for the deleted module at all.
    for (const file of SOURCES) {
      expect(`${file}:${/waiting-marker|waitingModel/.test(code(file))}`).toBe(`${file}:false`)
    }
    expect(read('src/client/components/waiting-marker.ts')).toBe('')
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

  it('(b) no string transform is applied to feed text or speaker', () => {
    const TRANSFORM =
      /\.(text|speaker)\s*\.\s*(slice|replace|replaceAll|trim|trimStart|trimEnd|split|toUpperCase|toLowerCase|padStart|padEnd|substring|substr|normalize|concat|repeat)\b/
    for (const file of SOURCES) {
      expect(`${file}:${TRANSFORM.test(code(file))}`).toBe(`${file}:false`)
    }
  })

  it('(c) run-feed.ts authors exactly the six declared chrome literals', () => {
    const ALLOWED = new Set([
      '연속용지 · 상황실 무전 기록',
      '열람 전용 — 이 창은 조작되지 않습니다',
      ' · 무전',
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
