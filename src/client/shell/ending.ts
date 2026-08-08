// The two ways the sitting ends — the curtain the portal drops on a day that
// closed for good.
//
// WHAT IT IS. The same plate the briefing uses, walked three times, on the far
// side of the shift instead of the near one: `shell/manual.ts` opens the
// sitting with 임용 → 시뮬레이션 대상 → 파견과 재시도, and this closes it with
// 시뮬레이션 종료 → 훈련 강평 → 임용 확정 (or 평가 보류). Reusing that plate is
// not economy — it is the portal keeping its word. The document that issued the
// terminal is the document that takes it back, so the operator recognises the
// hardware of the last screen from the first one, and the only thing that has
// changed between them is what it says.
//
// TWO ENDINGS, ONE TRIGGER EACH. GOOD is the day whose `score` closes on one
// death — the rescue run of pack 전구간정상, where everyone but 오세라 walks
// out. BAD is the day that closes with no runs left to spend. GOOD WINS when
// both land on the same day: an operator who saves the tunnel on their last
// try has passed, and the counter is not the thing being judged.
//
// IT IS AN OBSERVER, exactly like `shell/tutorial.ts` and `audio/index.ts`. It
// reads the §5.2 stream and the DOM, sends no op, mounts no control on the
// desk, and nothing imports it but one call at the bottom of `bootShell`. It
// does not touch `windows/reports.ts` or `components/score-tally.ts` — the
// ledger's landing is read off the `data-tally-state` attribute those modules
// already write, the way the ear reads it. Delete this module and the desk
// plays identically; it simply never stops.
//
// THE HELD BEAT is why the curtain does not ride the `score` event directly.
// The record takes some nine seconds to print itself out and roll its headline
// to the day's number, and a veil that rose on the event would rise across that
// count — the operator would be reading a plate about a number they never got
// to see. So the walk waits for the ledger to reach `final`, holds two more
// seconds with the finished number sitting alone on the desk, and only then
// covers it.
//
// ONCE PER PAGE LOAD, and the guard is a module-level flag rather than anything
// persisted: a judge who reloads gets a fresh sitting (H2, `run-state.ts`), and
// a sitting that can end is a sitting that can end again.
//
// Import-safe (u3 / inv 12): no DOM at module scope, no stylesheet import,
// nothing from engine or composer. The three-plate copy and the arithmetic
// under it are pure functions, so the whole of what this module SAYS is
// testable without a desk to say it on.
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'
import { button, el, must } from './dom.ts'

/* ── the numbers the copy is written against ─────────────────────────────── */

/**
 * How many people are inside the tunnel when the smoke starts.
 *
 * The pack's own figure, in two places: `data/scenario/전구간정상/meta.json`'s
 * logline (`터널에 갇힌 341명은 안내 방송을 믿고 차 안에 앉아 있다`) and
 * `score.json`'s u1 `tallies`, which counts only the other 340 because 차우진
 * is scored on an axis of his own. The ending needs the whole tunnel, not u1's
 * denominator, so it takes the logline's number.
 */
export const TUNNEL_OCCUPANTS = 341

/**
 * The death toll that means the tunnel was emptied — `score.json`'s u1 ladder
 * bottoms out at 0 with 오세라 still lost inside, so the best reachable day
 * closes on exactly one.
 */
const RESCUE_TOTAL = 1

/**
 * What the preview lanes count as the day's toll.
 *
 * `?ending=bad` opens the walk with no day behind it, so its two numbers have
 * to come from somewhere: this is the untouched day's toll, the one
 * `score.json`'s `baseline_summary` calls 총 사망자 138명 — 그날의 기록. A
 * preview of the losing ending showing the number the real event produced is
 * the most honest placeholder available, and it is never used on a real run.
 */
const PREVIEW_DEATHS = 138

/** The one control's two labels: the plates that advance, and the one that ends. */
export const ENDING_NEXT = '다음'
export const ENDING_CLOSE = '시뮬레이션 종료'

/** The pause between the ledger's last number and the veil. See the header. */
export const HELD_BEAT_MS = 2000

/**
 * How long the exit waits on `window.close()` before taking the other road.
 *
 * A browser refuses `close()` on a tab the script did not open, and it refuses
 * it silently — there is no error to catch and no promise to await, only a
 * window that is still there a moment later. So the reload is scheduled behind
 * a short grace period and cancels itself if the tab did in fact go.
 */
const CLOSE_GRACE_MS = 400

/* ── what a day earns ────────────────────────────────────────────────────── */

export type EndingKind = 'good' | 'bad'

export interface EndingNumbers {
  walkedOut: number
  deaths: number
}

/** One plate of the ending — the briefing's `ManualStep` plus its own counter. */
export interface EndingPlate {
  /** The plate's own title, left of the head. */
  head: string
  /** `1 / 3` — the head's meta slot, where the briefing keeps the same reading. */
  corner: string
  /** The one line set in white: what this plate is actually saying. */
  lead: string
  /** The lines under it, in the head's own grey. One paragraph each. */
  body: readonly string[]
}

/**
 * Which ending a CLOSED day earns, or `null` when the sitting simply continues.
 *
 * `runsLeft` is the trap here. `src/runloop/run-loop.ts` publishes it as
 * `max(0, totalRuns - run_count)`, which means it already reads 0 for the WHOLE
 * of the last run and not merely at its end — so the honest question is never
 * "did the counter just hit zero", it is "did a day close with the counter at
 * zero". That is why this takes the numbers of a day that has already closed
 * and nothing else: the caller does the waiting, this only judges.
 *
 * GOOD WINS. Both conditions are true of the day where the operator empties the
 * tunnel on their last attempt, and that day is a pass.
 */
export function endingKindOf(input: { total: number; runsLeft: number }): EndingKind | null {
  if (input.total === RESCUE_TOTAL) return 'good'
  // `<= 0` rather than `=== 0` — the seam clamps at zero already, and an
  // ending that failed to fire because a counter went one past it would be a
  // silent loss of the only screen this module owns.
  if (input.runsLeft <= 0) return 'bad'
  return null
}

/**
 * Survivors from the day's deaths — everyone the tunnel held, less the toll.
 *
 * Clamped at zero: the arithmetic is the ending's, not the seam's, and a
 * negative crowd is a sentence the plate must never print.
 */
export function numbersOf(deaths: number): EndingNumbers {
  return { walkedOut: Math.max(0, TUNNEL_OCCUPANTS - deaths), deaths }
}

/* ── the copy ────────────────────────────────────────────────────────────── */

/** A plate before its counter and its numbers are put in. */
interface PlateCopy {
  head: string
  lead: string
  body: readonly string[]
}

/**
 * THE GOOD ENDING (민서, 08-09). Replace these strings, not the module.
 *
 * Three beats, and the same white-line rule the briefing follows: a reader who
 * takes in only the three leads still leaves with 341명이 나왔다 → 전파가
 * 제때 되었다 → 임용되었다, which is the whole of what the day meant.
 *
 * It carries no substitution. The good day's numbers are not a variable — it is
 * the one day whose figures the pack itself fixes — so the copy states them.
 */
const GOOD_COPY: readonly PlateCopy[] = [
  {
    head: '시뮬레이션 종료',
    lead: '341명이 갱구 밖으로 걸어 나왔습니다.',
    body: [
      '오세라는 여섯 번째 문부터 아홉 번째 문까지 열었고, 마지막 문 안쪽에 남았습니다.',
      '사망 1명 — 지금까지 확인된 최선의 기록입니다.',
    ],
  },
  {
    head: '훈련 강평',
    lead: '상황 전파가 제때 이루어졌습니다.',
    body: [
      '해원터널 참사의 원인은 상황 전파 지연이었습니다. 같은 정보가 이번에는 현장 요원에게 닿았습니다.',
      '운영자는 흩어진 기록을 모아 현장 요원에게 전달하고, 이것이 생환자 수를 결정합니다.',
    ],
  },
  {
    head: '임용 확정',
    lead: '평가를 통과하셨습니다.',
    body: [
      '본 단말의 모의 과정은 여기서 종료됩니다. 기록은 귀하의 인사 자료에 편입됩니다.',
      '해원터널에는 귀하가 없었지만, 다음 긴급 상황에는 있을 것입니다. 실제 회선에서 뵙겠습니다.',
    ],
  },
]

/**
 * THE BAD ENDING (민서, 08-09). Replace these strings, not the module.
 *
 * `{walkedOut}` and `{deaths}` are filled from the day's own `score` event —
 * this ending is reachable on any of the ladder's losing days, so the plate
 * reports the toll the operator actually produced rather than a written-in
 * number. The second plate's strong sentence is deliberately the same in both
 * endings: what the operator does is the same job either way, and only the
 * sentence before it changes.
 */
const BAD_COPY: readonly PlateCopy[] = [
  {
    head: '시뮬레이션 종료',
    lead: '{walkedOut}명이 갱구 밖으로 걸어 나왔습니다.',
    body: [
      '나머지는 차량 안에 앉은 채, 안내 방송을 기다리고 있었습니다.',
      '사망 {deaths}명 — 시행 횟수가 모두 소진되었습니다.',
    ],
  },
  {
    head: '훈련 강평',
    lead: '상황 전파가 제때 이루어지지 않았습니다.',
    body: [
      '해원터널 참사의 원인은 상황 전파 지연이었습니다. 이번에도 같은 자리에서 지연이 반복되었습니다.',
      '운영자는 흩어진 기록을 모아 현장 요원에게 전달하고, 이것이 생환자 수를 결정합니다.',
    ],
  },
  {
    head: '평가 보류',
    lead: '평가가 보류되었습니다.',
    body: [
      '본 단말의 모의 과정은 여기서 종료됩니다. 동일 사건으로 재평가가 편성됩니다.',
      '해원터널의 기록은 그대로 남았습니다. 다음 시행에서 다시 뵙겠습니다.',
    ],
  },
]

/** The two slots any line may carry, and nothing else — an unknown one is left alone. */
const SLOT = /\{(walkedOut|deaths)\}/g

function fill(line: string, numbers: EndingNumbers): string {
  return line.replace(SLOT, (_match: string, key: string) =>
    String(key === 'deaths' ? numbers.deaths : numbers.walkedOut),
  )
}

/**
 * The three plates of one ending, counters written and numbers put in.
 *
 * Pure, and the whole of the ending's text: a test can read every sentence this
 * module will ever print without mounting anything. The counter is NOT in the
 * copy above — it rides the head's meta slot, the same slot the briefing and
 * the deploy confirmation both use, so it lands in one fixed column across all
 * three plates and reads as progress rather than as part of a title.
 */
export function endingPlates(kind: EndingKind, numbers: EndingNumbers): readonly EndingPlate[] {
  const copy = kind === 'good' ? GOOD_COPY : BAD_COPY
  return copy.map((plate, index) => ({
    head: plate.head,
    corner: `${index + 1} / ${copy.length}`,
    lead: fill(plate.lead, numbers),
    body: plate.body.map((line) => fill(line, numbers)),
  }))
}

/* ── who gets an ending ──────────────────────────────────────────────────── */

/**
 * `?ending=skip` forces it off, `?ending=good|bad` forces that walk on, and the
 * e2e lane is off by default.
 *
 * The default is the same one `shell/tutorial.ts` and `shell/sign-in.ts` argue
 * for, and it matters more here than in either: `navigator.webdriver` is every
 * spec under `e2e/`, those specs run days to their close, and this layer covers
 * the whole viewport and never lifts. The suite's contract is the desk — it
 * must never meet a curtain.
 */
export function endingSkipped(host: Window): boolean {
  const flag = new URLSearchParams(host.location.search).get('ending')
  if (flag === 'skip') return true
  if (flag === 'good' || flag === 'bad') return false
  return host.navigator.webdriver === true
}

/**
 * The ending a lane demands by name, or `null` to let the day decide.
 *
 * This is how a human reviews the work. Both endings sit behind a full sitting
 * — one of them behind a sitting that has to be WON — so a reviewer who had to
 * earn them would see each screen once an hour. Named here, the walk opens on
 * the hand-over with the preview toll in it and no score is waited on at all.
 */
export function endingForced(host: Window): EndingKind | null {
  const flag = new URLSearchParams(host.location.search).get('ending')
  if (flag === 'good' || flag === 'bad') return flag
  return null
}

/* ── the plate ───────────────────────────────────────────────────────────── */

/** The chrome the ending holds: the top bar and the desk under it. */
function holdChrome(on: boolean): void {
  for (const sel of ['#topbar', '#desktop']) {
    const node = document.querySelector(sel)
    if (!node) continue
    if (on) node.setAttribute('inert', '')
    else node.removeAttribute('inert')
  }
}

/**
 * Walks the three plates and resolves the moment the last one is answered.
 *
 * It resolves as the exit state goes on, not after it: the caller leaves the
 * page on that resolution, so the veil is already going out while the browser
 * is doing whatever it does about the tab.
 *
 * NOT DISMISSIBLE, and there is no Escape here — which is the one place this
 * departs from `shell/manual.ts`. Escape skips the BRIEFING because a keyboard
 * user must never be trapped in front of three paragraphs and because there is
 * a desk behind that plate to be let onto. There is nothing behind this one:
 * the sitting is over, the desk is inert, and every road out of this layer runs
 * through the button. So the walk stays fully keyboard-operable the only way it
 * can be — the control takes focus once and keeps it across all three steps,
 * so Enter three times is the whole ending — and no key is bound to a shortcut
 * that would have to invent an exit of its own.
 *
 * The plate is built ONCE and repainted in place, for the reasons `manual.ts`
 * gives: remounting would replay the entrance three times and would drop focus
 * off the control being pressed.
 */
export function openEnding(app: HTMLElement, kind: EndingKind, numbers: EndingNumbers): Promise<void> {
  const plates = endingPlates(kind, numbers)

  // The desk goes inert and STAYS inert. Nothing here puts it back: the only
  // continuations of this screen are a closed tab and a reload, and a desk that
  // became operable again behind the last plate would be offering a sitting
  // that has already been scored.
  holdChrome(true)

  const root = el('div', kind === 'good' ? 'end-good' : 'end-bad')
  root.id = 'ending'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-labelledby', 'end-head')
  root.setAttribute('aria-describedby', 'end-body')

  const plate = el('section', 'cf-plate end-plate')

  const led = el('span', 'cf-led')
  led.setAttribute('aria-hidden', 'true')
  const headLabel = el('b')
  headLabel.id = 'end-head'
  const counter = el('i')
  const head = el('div', 'cf-plate-hd')
  head.append(led, headLabel, counter)

  const body = el('div', 'cf-body end-body end-step')
  body.id = 'end-body'
  // The step changes under a reader who is not looking at the head, so the
  // region announces itself. `aria-describedby` above names this container
  // rather than one paragraph inside it, so the description follows the walk
  // instead of going stale on the first lead.
  body.setAttribute('aria-live', 'polite')

  const go = button('cf-btn cf-yes end-go', ENDING_NEXT, ENDING_NEXT)
  go.id = 'endingGo'
  const foot = el('div', 'cf-foot')
  foot.append(go)

  plate.append(head, body, foot)
  root.append(plate)
  app.append(root)

  let at = 0

  function paint(): void {
    const step = plates[at]
    if (step === undefined) return
    const last = at === plates.length - 1

    headLabel.textContent = step.head
    counter.textContent = step.corner
    body.replaceChildren(
      el('p', 'cf-ask', step.lead),
      ...step.body.map((line) => el('p', 'cf-note', line)),
    )

    go.textContent = last ? ENDING_CLOSE : ENDING_NEXT
    go.title = last ? ENDING_CLOSE : ENDING_NEXT
    // The op the press performs, so the walk is legible to a test and to the
    // reader of a DOM dump: three presses, and only the last one ends the
    // session.
    go.dataset.step = String(at + 1)
    go.dataset.op = last ? 'close' : 'next'

    // Re-trigger the step animation. Removing the class and reading a layout
    // property is what makes the SAME animation run again on an element that
    // was never detached — the plate persists across steps by design, so there
    // is no remount to restart it for us.
    body.classList.remove('end-step')
    void body.offsetWidth
    body.classList.add('end-step')
  }

  paint()
  requestAnimationFrame(() => go.focus())

  return new Promise<void>((resolve) => {
    let answered = false
    const advance = (): void => {
      if (answered) return
      if (at < plates.length - 1) {
        at += 1
        paint()
        return
      }
      answered = true
      // The veil goes out and the root STAYS in the document. `manual.ts`
      // removes its own after the exit animation because a desk is waiting
      // underneath; here there is nothing underneath that anyone is meant to
      // reach, and if the exit below is refused outright the honest screen to
      // be left on is the one that says the simulation is over.
      root.classList.add('end-out')
      resolve()
    }
    go.addEventListener('click', advance)
  })
}

/* ── waiting for the day to be over ──────────────────────────────────────── */

const sleep = (host: Window, ms: number): Promise<void> =>
  new Promise((resolve) => {
    host.setTimeout(resolve, ms)
  })

/**
 * Resolves on the first CLOSED day that earns an ending, with its numbers.
 *
 * Both halves of the judgement come off the §5.2 stream and neither is derived
 * here: `runs_left` is copied from the last `meta` (the client mirrors no state
 * and does no arithmetic on the authority's numbers — §5.3), and the toll is
 * the `score` event's own `total`. A day that earns nothing is simply not
 * resolved on: the sitting continues and the next `score` is judged the same
 * way.
 *
 * IT IS SEEDED FROM THE FRAME, and that is not belt-and-braces — it is the only
 * way this reads run 1 correctly. `subscribe` does not replay, and the opening
 * `meta` is emitted at `bootShell` step 5 (`driver.advance(0)`), while this
 * module is not installed until step 8 — on the far side of the door and the
 * briefing, which the boot awaits and an operator can sit in front of for
 * minutes. A listener bound there has already missed the only `meta` the first
 * day will ever send: the next one arrives with the SECOND day. So a `runsLeft`
 * that started at 0 and waited for the stream to correct it would still be 0
 * when day 1 closed, and every first day that did not empty the tunnel would
 * end the sitting on the spot. `frame().events` is the emitted stream to date
 * (`driver/fixture-driver.ts`), so the last `meta` in it is this day's.
 *
 * `null` until a `meta` has been seen at all, and a `null` never earns the bad
 * ending: a desk with no run loop behind it (the placeholder boot) has not spent
 * an allotment, it never had one.
 */
function earned(driver: FixtureDriver): Promise<{ kind: EndingKind; numbers: EndingNumbers }> {
  return new Promise((resolve) => {
    let runsLeft: number | null = null
    for (const event of driver.frame().events) {
      if (event.type === 'meta') runsLeft = event.runs_left
    }
    let done = false
    driver.subscribe((event: ViewEvent) => {
      if (done) return
      if (event.type === 'meta') {
        runsLeft = event.runs_left
        return
      }
      if (event.type !== 'score') return
      const kind = endingKindOf({ total: event.total, runsLeft: runsLeft ?? Number.POSITIVE_INFINITY })
      if (kind === null) return
      done = true
      resolve({ kind, numbers: numbersOf(event.total) })
    })
  })
}

/**
 * Resolves when the ledger lands — `data-tally-state="final"` on the record
 * root, which `components/score-tally.ts` sets at the end of its own cadence.
 *
 * Observed rather than timed, exactly as `audio/index.ts` observes the same
 * attribute for the same moment: nothing here needs to know what ~9 s means,
 * and a module that hard-coded the ledger's pacing would go quietly out of step
 * the first time that pacing was tuned. `attributeFilter` keeps the callback
 * off every other mutation the desk makes, which at this point in a day is most
 * of them.
 *
 * Deliberately no synchronous first look. The record for the day that just
 * closed has only just been mounted and is still `pending`; any element already
 * reading `final` when this is armed belongs to an earlier day, and an ending
 * that fired off a stale attribute would skip the count it exists to protect.
 */
function ledgerLanded(): Promise<void> {
  return new Promise((resolve) => {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const node = record.target
        if (!(node instanceof HTMLElement)) continue
        if (node.dataset.tallyState !== 'final') continue
        observer.disconnect()
        resolve()
        return
      }
    })
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-tally-state'],
    })
  })
}

/* ── the exit ────────────────────────────────────────────────────────────── */

/**
 * Leaves the terminal: close the tab, and failing that, go back to the door.
 *
 * `close()` is attempted first because it is the only exit that matches what
 * the plate just said — the session is over, the terminal is done. Browsers
 * refuse it on a tab the script did not open, which on GitHub Pages is every
 * tab, so the reload is the road actually taken: `sessionStorage` is cleared so
 * the sign-in door opens cold (the run slot `run-state.ts` owns lives there),
 * and the page comes back as a fresh sitting.
 *
 * Nothing in here may throw out of the press handler. A sandboxed frame throws
 * on `close()`, a private-mode `Storage` throws on `clear()`, and a navigation
 * the host refuses throws on `reload()` — none of which is a reason to leave an
 * operator staring at a button that did nothing visible.
 */
function leaveDesk(host: Window): void {
  try {
    host.close()
  } catch {
    // A refused close is the expected case, not an error worth reporting.
  }
  host.setTimeout(() => {
    if (host.closed) return
    try {
      host.sessionStorage.clear()
    } catch {
      // Private mode refuses the write; the reload below is still worth doing.
    }
    try {
      host.location.reload()
    } catch {
      // Nothing left to try. The `end-out` plate is what stays on screen.
    }
  }, CLOSE_GRACE_MS)
}

/* ── the walk ────────────────────────────────────────────────────────────── */

export interface EndingPorts {
  driver: FixtureDriver
  /** Resolves at the hand-over, when the desk is what the operator is looking at. */
  deskReady: Promise<void>
}

/**
 * ONCE PER PAGE LOAD, ever.
 *
 * Module scope rather than a closure, so it holds even if `installEnding` is
 * called twice, and it is set at the moment the veil is raised rather than at
 * install time so a lane that installs and never earns an ending is not
 * counted as having spent it.
 */
let raised = false

/** Stops the portal, drops the veil, and then leaves. */
async function raise(host: Window, driver: FixtureDriver, kind: EndingKind, numbers: EndingNumbers): Promise<void> {
  if (raised) return
  raised = true
  // The portal stops. The day is scored and the clock has nothing left to
  // advance, but a rate left running keeps the pump feeding a stream that is
  // over — and the desk under the veil should be as still as the plate says it
  // is.
  driver.clock.setRate(0)
  await openEnding(must('#app'), kind, numbers)
  leaveDesk(host)
}

/**
 * The whole of the ending, from the hand-over to the exit.
 *
 * The forced lane short-circuits everything: it waits for the desk to exist and
 * then raises the named walk on the preview toll, because a reviewer opening
 * `?ending=bad` is reviewing the PLATE and should not have to lose a tunnel
 * three times first.
 */
async function walkEnding(host: Window, ports: EndingPorts): Promise<void> {
  const { driver, deskReady } = ports

  const forced = endingForced(host)
  if (forced !== null) {
    await deskReady
    await raise(host, driver, forced, numbersOf(PREVIEW_DEATHS))
    return
  }

  // Armed BEFORE the hand-over is awaited — see `earned()`.
  const day = earned(driver)
  await deskReady
  const { kind, numbers } = await day

  // The day is scored; now let the record say so before covering it.
  await ledgerLanded()
  await sleep(host, HELD_BEAT_MS)
  await raise(host, driver, kind, numbers)
}

/**
 * Mounts the ending, unless this lane is not getting one.
 *
 * Fire-and-forget, and its failure is swallowed: this layer waits out an entire
 * sitting before it does anything at all, and an exception on the way to the
 * curtain must not take the desk that sitting is being played on. Nothing
 * downstream of this call depends on it having run — `bootShell` is finished by
 * the time it does.
 */
export function installEnding(host: Window, ports: EndingPorts): void {
  if (endingSkipped(host)) return
  void walkEnding(host, ports).catch((cause) => {
    console.error('the ending never arrived', cause)
  })
}
