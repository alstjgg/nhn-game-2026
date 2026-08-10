// The desk's EAR — what an operator hears, as against what `shell/announcer.ts`
// says out loud.
//
// The two are deliberately different channels with different jobs. The
// announcer is the accessibility surface: it carries state an operator cannot
// afford to miss. This module carries none — every cue below is redundant
// reinforcement of something already on screen, so a muted desk, a failed
// asset fetch and a browser that blocks the audio context all leave a game that
// is completely playable (plan-audio §2 rule 3). That is why nothing here
// throws and nothing here blocks boot.
//
// It is also a pure OBSERVER, never a third channel. It reads the ratified §5.2
// event stream through `driver.subscribe`, and it reads the DOM the windows
// already wrote — `[data-op]` (the membrane census marker each of the five
// controls carries), the `.hidden` class the window manager toggles, and the
// text the report typewriter paints. It sends no op, mutates no window, and no
// component imports it. Deleting this directory changes nothing but the sound.
//
// Wiring: `shell/boot.ts` calls `installAudio` once, after the desk exists.
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'
import { createMixer } from './mixer.ts'
import type { AudioMixer } from './mixer.ts'
import { FEED_TRIGGER, validateAudioMap } from './map.ts'
import type { AudioMap, Trigger } from './map.ts'
import { button } from '../shell/dom.ts'

/** Where the map lives. Published by `vite.config.ts`'s `POLICY_FILES`. */
const MAP_PATH = 'data/policy/audio-map.json'

/**
 * Survives a refresh with the rest of the desk's session state (physical §1.1).
 * Exported because it is the desk's ONE mute: `shell/radio-sfx.ts` (O3's
 * procedural cues) reads the same key, so the ♪ toggle silences both layers.
 */
export const MUTE_KEY = 'dday.audio.muted'

/** A radio line is bracketed: the channel opens, the line is read, it closes. */
const SQUELCH_CLOSE_MS = 260

/** Tally rows print one after another, not as a chord. */
const SCORE_ROW_MS = 90

/**
 * On the last day only, the ledger waits before it starts printing.
 *
 * The ending swells and then cuts, and **the silence after the cut is the
 * cue** — a tally tick landing in it destroys the only thing that cue does.
 * The swell itself lives in `shell/radio-sfx.ts` (O3's day-end static, 1.9 s,
 * fired on `run_end`); this lead is keyed to the DAY, not to the
 * `ending:collapse` binding, so the silence survives whichever layer draws
 * the sound.
 */
const ENDING_LEAD_MS = 2800

export interface AudioHandle {
  setMuted(muted: boolean): void
  muted(): boolean
  dispose(): void
  /** Present once the context is unlocked; the e2e suite waits on it. */
  mixer(): AudioMixer | null
}

export interface AudioDeps {
  driver: FixtureDriver
  /** The desk root the DOM cues delegate from — `#app`. */
  root: HTMLElement
  /** Where the mute toggle mounts — the clock's rate row. */
  controls: HTMLElement | null
  baseUrl: string
  fetch: typeof fetch
  storage: Storage | null
  /**
   * Resolves when the desk is what the player is looking at — after O1's
   * sign-in door and manual sheet have both been dismissed.
   *
   * x10 (08-10, 민서) — it gates THE WATCH DRONE'S WINDOW, and nothing else. It
   * used to gate the whole ambience, on the reasoning that an opening which
   * establishes and expires behind a curtain is an opening the player never
   * hears. That is still exactly right about the drone, whose ten seconds would
   * be spent before the operator finished typing their card in — and still wrong
   * about the room now that the room holds for the session, so the room opens on
   * the unlock instead. See `openTheRoom` in the unlock below.
   *
   * Omit it to open the drone's window on unlock too.
   */
  deskReady?: Promise<void>
}

export function installAudio(deps: AudioDeps): AudioHandle {
  let mixer: AudioMixer | null = null
  let map: AudioMap | null = null
  let muted = deps.storage?.getItem(MUTE_KEY) === '1'
  const teardown: (() => void)[] = []

  /**
   * The Watch drone's window — the one bed that is still an OPENING.
   *
   * A drone is broadband noise held under a screen the player reads for minutes
   * at a time, which stops registering as atmosphere and starts registering as
   * pressure that never lets up. So `ambience.playForMs` gives it a window: it
   * establishes the run and then gets out of the way.
   *
   * This flag is true only inside that window, and `beat_start` is gated on it
   * at BOTH ends: before, so the drone cannot start while the player is still at
   * the door (the run opens behind the curtain, and its first beat lands there);
   * after, so a later beat cannot bring it back.
   *
   * x10 (08-10, 민서) — it was `bedsLive` and it governed BOTH beds, because both
   * of them came up together at the desk. The room (the desk bed and the office
   * around it) now comes up at the door, on the unlock itself, and it holds for
   * the whole session — so it has no window and needs no latch, and this flag
   * narrowed to the one bed that still has both. See `openTheRoom` below for the
   * ruling that moved.
   */
  let watchLive = false

  /** `meta.runs_left` — 0 on the final day. `null` until the first `meta`. */
  let runsLeft: number | null = null
  /** Guards the ending against its own two trigger paths firing it twice. */
  let collapsed = false

  const endTheDay = (): void => {
    collapsed = true
    fire('ending:collapse')
    // The drone has no business continuing under it.
    mixer?.hold('watch', null)
  }

  /* ── the cue front door ────────────────────────────────────────────────── */

  // Every path below funnels through here, and every path below may run before
  // the first gesture. Dropping a cue that arrives early is deliberate: a
  // keystroke replayed two seconds after its character appeared is worse than
  // no keystroke.
  const fire = (trigger: Trigger): void => {
    if (mixer === null || map === null) return
    const cue = map.bindings[trigger]
    if (cue === undefined || cue === null) return
    mixer.play(cue)
  }

  const holdCue = (slot: string, trigger: Trigger | null): void => {
    if (mixer === null || map === null) return
    const cue = trigger === null ? null : (map.bindings[trigger] ?? null)
    mixer.hold(slot, cue)
  }

  /**
   * The office beyond the desk: one one-shot every `minMs`–`maxMs`, forever.
   *
   * The interval is re-rolled after each play rather than fixed, because a
   * keystroke burst landing on a metronome is the one thing that would give the
   * whole layer away — the ear finds a 14 s period inside about three cycles.
   * Same reason the cue is picked with a not-twice-running rule: three keyboard
   * variants heard back-to-back read as one keyboard with a stutter.
   *
   * Returns its own stop. Firing nothing (`sparse` null, or an empty list) is a
   * legal map, so the caller never has to check.
   */
  const startSparse = (sparse: AudioMap['ambience']['sparse']): (() => void) => {
    if (sparse === null || sparse.cues.length === 0) return () => {}
    const { cues, minMs, maxMs } = sparse
    let timer: ReturnType<typeof setTimeout> | null = null
    let previous = -1
    const wait = (): number => minMs + Math.random() * (maxMs - minMs)
    const tick = (): void => {
      let index = Math.floor(Math.random() * cues.length)
      if (index === previous && cues.length > 1) index = (index + 1) % cues.length
      previous = index
      const cue = cues[index]
      if (cue !== undefined) mixer?.play(cue)
      timer = setTimeout(tick, wait())
    }
    timer = setTimeout(tick, wait())
    return () => {
      if (timer !== null) clearTimeout(timer)
      timer = null
    }
  }

  /* ── the §5.2 stream ───────────────────────────────────────────────────── */

  // NOTE — `feed` is deliberately absent from this switch. U1's reveal queue
  // (`components/run-feed.ts`) buffers feed events and releases them one at a
  // time, so the event and the line the player sees are no longer the same
  // moment: a six-line fanout would fire six carriage returns at once against a
  // page that prints them out over several seconds. Feed cues ride the REVEAL
  // instead — see the observer below.
  //
  // x11 — the numbers that used to be quoted here (250–2400 ms apart, priced by
  // reading length) are gone, and not merely restated: the reveal is a
  // TYPEWRITER now (민서, 08-10), so a line's duration is its own length at a
  // fixed rate plus a pause that grows with the gap between stamps. Naming the
  // arithmetic twice is how the second copy goes stale, and this one had.
  //
  // Worth knowing for anyone tuning the cue: the observer fires on the `<li>`
  // ATTACHING, and a line now attaches EMPTY and fills. So a feed cue sounds as
  // the print head starts the line rather than when the line is readable —
  // which is what a carriage return is, and is why nothing here waits.
  const onEvent = (event: ViewEvent): void => {
    switch (event.type) {
      case 'waiting': {
        if (event.active) {
          // The gate lands first and the clock comes in under it — the 300 ms
          // of quiet between them is doing as much work as either sample
          // (plan-audio §4.1 #8).
          if (event.for === 'judgment') fire('wait:judgment')
          holdCue('wait', 'wait:open')
        } else {
          holdCue('wait', null)
        }
        break
      }
      // One per run — `run-loop.ts` emits exactly one `meta` when a day opens,
      // which is the same thing `shell/announcer.ts` says "RUN nn 시작" on.
      // `runs_left` is also the only thing on the seam that says which day is
      // the LAST one: it is `totalRuns - run_count`, so it reads 0 on the final
      // run and nowhere else. That is what the ending cue hangs off.
      case 'meta':
        runsLeft = event.runs_left
        collapsed = false
        fire('run:open')
        break
      case 'report':
        fire('event:report')
        break
      case 'fallback':
        fire(FALLBACK_TRIGGER[event.call])
        break
      case 'run_end':
        // Belt and braces: `score` is emitted only when a scorer was supplied
        // (`src/driver/live-driver.ts` `finish()`), and a last day that ends
        // with no ledger must still end with the bridge.
        if (runsLeft === 0 && !collapsed) endTheDay()
        fire('event:run_end')
        mixer?.hold('watch', null)
        break
      // The Watch bed rides the beats, not a game signal: it comes up when the
      // day starts moving and goes down when the day closes onto the tally,
      // which is exactly the stretch plan-audio §4.4 describes as "tension".
      case 'beat_start':
        if (map !== null && watchLive) mixer?.hold('watch', map.ambience.watch)
        break
      case 'score': {
        // The client cannot know a unit's polarity — fewer dead is better, more
        // gates cleared is better, and `score.json` says which is which nowhere
        // the view can read (invariant 12). So the tally does not sound
        // better/worse. It sounds MOVED: a row that differs from the untouched
        // day ticks up, a row the agent left where it was ticks down. That is
        // the fact the player is owed and the only one the seam carries.
        //
        // 21:04 on the last day. `score` is emitted immediately before
        // `run_end` (live-driver `finish()`), so this is the moment just ahead
        // of the tally — which is where the ending was asked to sit.
        const lead = runsLeft === 0 && !collapsed ? (endTheDay(), ENDING_LEAD_MS) : 0
        event.rows.forEach((row, i) => {
          if (row.baseline === null) return
          const moved = String(row.value) !== String(row.baseline)
          setTimeout(() => fire(moved ? 'score:up' : 'score:down'), lead + i * SCORE_ROW_MS)
        })
        break
      }
      default:
        break
    }
  }

  /* ── the DOM the windows already wrote ─────────────────────────────────── */

  /** The three call types degrade differently, so they do not sound the same. */
  const FALLBACK_TRIGGER: Record<1 | 2 | 3, Trigger> = {
    1: 'event:fallback:1', 2: 'event:fallback:2', 3: 'event:fallback:3',
  }

  const OP_TRIGGER: Record<string, Trigger> = {
    mine: 'op:mine', slot: 'op:slot', unslot: 'op:unslot',
    deploy: 'op:deploy', new_run: 'op:new_run',
  }

  const onClick = (ev: Event): void => {
    const target = ev.target
    if (!(target instanceof Element)) return
    const op = target.closest<HTMLElement>('[data-op]')?.dataset.op
    if (op !== undefined && OP_TRIGGER[op] !== undefined) {
      fire(OP_TRIGGER[op] as Trigger)
      return
    }
    // The portal's one press. It is also, always, the gesture that unlocks the
    // context — so it is the one click in the game that cannot sound
    // immediately, and `pendingPress` below is what pays that back.
    if (target.closest('.si-login')) return press('door:login')
    if (target.closest('button, .task')) press('ui:click')
  }

  /**
   * Fires a press cue, or remembers it if the mixer is still coming up.
   *
   * Everywhere else this module drops a cue that arrives before unlock, and
   * that is right: a keystroke replayed two seconds after its character
   * appeared is worse than no keystroke. A press is the exception, because the
   * press IS the unlock — dropping it means the first control the player ever
   * touches is the one control that never answers. It is held for one cue only
   * and only across the unlock; anything later takes the normal path.
   */
  let pendingPress: Trigger | null = null
  const press = (trigger: Trigger): void => {
    if (mixer !== null) fire(trigger)
    else pendingPress ??= trigger
  }

  let hovered: Element | null = null
  const onOver = (ev: Event): void => {
    const target = ev.target
    if (!(target instanceof Element)) return
    const control = target.closest('button, .task, [data-op]')
    if (control === hovered) return
    hovered = control
    if (control !== null) fire('ui:hover')
  }

  const onDragStart = (): void => fire('ui:drag')
  const onDrop = (): void => fire('ui:drop')

  deps.root.addEventListener('click', onClick, true)
  deps.root.addEventListener('mouseover', onOver, true)
  deps.root.addEventListener('dragstart', onDragStart, true)
  deps.root.addEventListener('drop', onDrop, true)
  teardown.push(() => {
    deps.root.removeEventListener('click', onClick, true)
    deps.root.removeEventListener('mouseover', onOver, true)
    deps.root.removeEventListener('dragstart', onDragStart, true)
    deps.root.removeEventListener('drop', onDrop, true)
  })

  // Windows: the manager shows and hides by toggling `.hidden` on the frame
  // root, so the drawer opens and closes off a class change. Observing beats a
  // callback here — the window manager has no audio-shaped hole in it, and this
  // module exists to not put one there.
  //
  // The frames are seeded here rather than on their first observed mutation.
  // Skipping a first sighting sounds safer and is wrong: closing a window IS
  // usually that frame's first class change. The desk already
  // exists when `installAudio` runs (boot step 4c is after step 4), so the
  // opening state is readable up front and every later change is real.
  const openState = new WeakMap<Element, boolean>()
  for (const win of deps.root.querySelectorAll('.win')) {
    openState.set(win, !win.classList.contains('hidden'))
  }
  const windows = new MutationObserver((records) => {
    for (const record of records) {
      const node = record.target
      if (!(node instanceof HTMLElement)) continue

      // The ledger landing. The count-up rolls the headline for ~9 s while the
      // row ticks all fire in its first second, so this is the full stop on the
      // day's verdict. `data-tally-state` goes `pending → counting → final` on
      // the ledger root (`components/score-tally.ts`), which is the landing,
      // observed rather than timed: nothing here needs to know what ~9 s means.
      if (record.attributeName === 'data-tally-state') {
        if (node.dataset.tallyState === 'final') fire('tally:final')
        continue
      }

      // x5b — the `win-manual` skip that used to sit here is gone with the
      // window it named: the onboarding sheet is a plate now (`shell/manual.ts`)
      // and carries no `.win`, so this guard already excludes it and the second
      // one was unreachable. The reason it was skipped still holds — the
      // hand-over is O3's moment, `shell/radio-sfx.ts` plays its squelch there,
      // and a drawer sliding under a radio squelch is one departure sounding
      // twice (coexistence decision).
      if (!node.classList.contains('win')) continue
      // `hidden` is how the manager puts a desk window away; `is-closing` is
      // how a late-arriving frame leaves (removed 460 ms later, the class is
      // the moment the player caused). Both are the same event to the ear.
      const open = !node.classList.contains('hidden') && !node.classList.contains('is-closing')
      if (openState.get(node) === open) continue
      openState.set(node, open)
      fire(open ? 'ui:window-open' : 'ui:window-close')
    }
  })

  // Windows that arrive AFTER boot. Seeding them on insertion is what stops the
  // observer above reading their first class change as an opening — an unseeded
  // frame looks like one that just became visible. Direct children only, so the
  // fanfold's lines and the report's repaints never reach this callback.
  //
  // x5b — the onboarding sheet used to be the one such arrival, appended
  // straight to `#app` at the hand-over and skipped here because both its edges
  // are O3's (it arrives under radio-sfx's login static and leaves on its
  // squelch). It is a plate now and carries no `.win`, so the `.win` test below
  // is the whole of it and the sheet is silent by construction.
  const arrivals = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement) || !node.classList.contains('win')) continue
        openState.set(node, true)
        fire('ui:window-open')
      }
    }
  })
  arrivals.observe(deps.root, { childList: true })
  teardown.push(() => arrivals.disconnect())
  windows.observe(deps.root, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-tally-state'],
  })
  teardown.push(() => windows.disconnect())

  /* ── the feed, as it is REVEALED ───────────────────────────────────────── */

  // Each revealed line is one `<li class="fl fl-<kind>">` appended to the
  // fanfold's list, and the kind in that class is the same `FeedKind` the seam
  // carries — `run-feed.ts` builds it as `fl-${kind}` and its own `kinds()`
  // accessor reads it back the same way. Riding the DOM means the cue inherits
  // U1's pacing for free, including the cases that bypass it: a seek, a paused
  // clock and `prefers-reduced-motion` all flush the queue whole, and the cue
  // cooldowns collapse that burst into a single sound rather than a machine gun.
  const FEED_CLASS = /\bfl-([a-z]+)\b/

  const feedList = deps.root.querySelector('#w-feed ol')
  const feedLines = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        const kind = FEED_CLASS.exec(node.className)?.[1]
        if (kind === undefined || !(kind in FEED_TRIGGER)) continue
        fire(FEED_TRIGGER[kind as keyof typeof FEED_TRIGGER])
        // The squelch is a pair around the line, not a single burst.
        if (kind === 'radio') setTimeout(() => fire('feed:radio-end'), SQUELCH_CLOSE_MS)
      }
    }
  })
  if (feedList !== null) feedLines.observe(feedList, { childList: true })
  teardown.push(() => feedLines.disconnect())

  /* ── the report typing itself out ──────────────────────────────────────── */

  // `components/report-view.ts` repaints one text node per typewriter tick. The
  // keystroke rides that repaint rather than a hook, so the component keeps its
  // own timing as the single source of truth and this file has no copy of
  // `MS_PER_CHAR` to fall out of step with.
  let charAccumulator = 0
  const typing = new MutationObserver((records) => {
    if (map === null) return
    for (const record of records) {
      if (record.type !== 'characterData') continue
      // U3 dissolved the TALLY window into this one: the end-of-day record is
      // an `article.terminal-record` appended INSIDE `doc-facts`, and its
      // count-up rewrites text the same way the typewriter does. Those are not
      // keystrokes — the ledger has its own `score:up`/`score:down` ticks, and
      // letting both sound would double every row.
      if (record.target.parentElement?.closest('.terminal-record')) continue
      charAccumulator += 1
      if (charAccumulator < map.typing.everyChars) continue
      charAccumulator = 0
      if (mixer !== null) mixer.play(map.typing.cue)
    }
  })
  teardown.push(() => typing.disconnect())

  /* ── the mute toggle ───────────────────────────────────────────────────── */

  // Its OWN class. The toggle sits in the row that used to hold the transport
  // and briefly wore `.rate-btn` to inherit that skin, which made it read as a
  // fourth rate to `game-clock.ts` and to the topbar census. W4 has since
  // retired the transport entirely, so this is the only control in the row —
  // and it keeps its own name for it.
  const toggle = button('snd-btn', '소리 켬/끔', '♪')
  const paintToggle = (): void => {
    toggle.classList.toggle('is-on', !muted)
    toggle.setAttribute('aria-pressed', muted ? 'false' : 'true')
    toggle.textContent = muted ? '♪̸' : '♪'
  }
  const setMuted = (next: boolean): void => {
    muted = next
    deps.storage?.setItem(MUTE_KEY, next ? '1' : '0')
    mixer?.setMuted(next)
    paintToggle()
  }
  toggle.addEventListener('click', () => setMuted(!muted))
  paintToggle()
  deps.controls?.append(toggle)
  teardown.push(() => toggle.remove())

  /* ── unlock ────────────────────────────────────────────────────────────── */

  // An AudioContext built outside a user gesture is born suspended, so the whole
  // pack — map included — waits for one. The judge who never clicks never pays
  // for a byte of it, which is the §6 load budget getting the best possible
  // answer rather than a merely acceptable one.
  const unlock = async (): Promise<void> => {
    document.removeEventListener('pointerdown', kick, true)
    document.removeEventListener('keydown', kick, true)
    try {
      const res = await deps.fetch(new URL(MAP_PATH, deps.baseUrl).href)
      if (!res.ok) throw new Error(`${res.status}`)
      const checked = validateAudioMap(await res.json())
      if ('error' in checked) throw new Error(checked.error)
      map = checked.map
    } catch (cause) {
      console.warn('audio: map unavailable — the desk stays silent', cause)
      return
    }
    mixer = createMixer({ map, baseUrl: deps.baseUrl, fetch: deps.fetch, muted })
    await mixer.ready
    fire('boot')
    if (pendingPress !== null) {
      fire(pendingPress)
      pendingPress = null
    }
    /**
     * The room: the desk bed, and the office sowing one-shots under it.
     *
     * x10 (08-10, 민서) — THIS NO LONGER WAITS FOR THE DESK, and the ruling it
     * reverses was written on this very line. It used to read: *"Both wait for
     * the desk (`deskReady`): the unlock above may have happened at the door,
     * and the opening belongs to the desk."* That was sound while the bed was an
     * OPENING — a thing that establishes, expires, and is therefore worth
     * spending where the player can hear it. 08-09's `deskHolds` made the desk
     * bed a ROOM that holds for the whole session instead, and a room the
     * operator signs into was already there before they arrived. Holding it
     * behind the sign-in plate and the manual sheet meant the first thing this
     * layer did with the room was start the fan a minute into the sitting.
     * 민서's call: the room is there from the login screen.
     *
     * "From the login screen" can only mean FROM THE FIRST GESTURE THERE. A
     * browser suspends an AudioContext built outside a user gesture, so there is
     * no sound on the first painted frame for any layer to ask for — which is
     * why this hangs off `unlock()` (the gesture) rather than off a timer, a
     * promise or a bare call at boot. The door is a good place for it: it asks
     * for fifteen keystrokes (`shell/sign-in.ts`) and sounds its own
     * `sfxKeyTick` on each, so the room comes up under the card the operator is
     * typing rather than out of nowhere.
     *
     * The bed is also ~490 kB and in the mixer's LAST load wave, so at the door
     * it is usually still in flight. `hold` remembers the intent and the
     * ambience pass honours it when the bytes land (`mixer.ts` `reHold`), so an
     * early open fades in late rather than being dropped.
     */
    const openTheRoom = (): void => {
      if (map === null || mixer === null) return
      if (map.ambience.desk !== null) mixer.hold('bed', map.ambience.desk)
      const stopSparse = startSparse(map.ambience.sparse)
      teardown.push(stopSparse)
      // A room that switches itself off after ten seconds was never a room,
      // which is what `deskHolds` says and why this is normally the end of it.
      // When the map says otherwise the bed and its office still retire on
      // `playForMs`, measured from HERE — the moment this bed started, which is
      // what `map.ts` has always said that window means ("how long any bed may
      // play, from unlock"). The drone's window is measured from the desk
      // instead, for the same reason: that is where the drone starts.
      const retireAfter = map.ambience.playForMs
      if (map.ambience.deskHolds || retireAfter === null) return
      const timer = setTimeout(() => {
        // `hold(slot, null)` fades over 0.6 s, so what retires recedes rather
        // than vanishing. The office goes with the bed — a room that keeps
        // humming while everybody in it stops moving is a worse artefact than
        // either half alone.
        mixer?.hold('bed', null)
        stopSparse()
      }, retireAfter)
      teardown.push(() => clearTimeout(timer))
    }

    /**
     * The Watch drone's window: it may come up on a `beat_start` from here until
     * `playForMs` is spent, and never again.
     *
     * This half still waits for the desk, and 민서's reversal above does not
     * reach it. Two things about the door would break it. Its life is ten
     * seconds, and ten seconds that start at the login screen are gone before
     * the operator has typed their card in — the drone would retire before the
     * desk it plays over exists, so the map's window would silence the cue
     * instead of shaping it. And the run opens behind the curtain: `boot.ts`
     * releases what is due at the opening minute, so a `beat_start` can land
     * while the door is still up, and an ungated latch would raise a drone under
     * the sign-in plate — the one place plan-audio §4.4 says a drone must not be.
     */
    const openTheWatchWindow = (): void => {
      if (map === null || mixer === null) return
      watchLive = true
      const retireAfter = map.ambience.playForMs
      if (retireAfter === null) return
      const timer = setTimeout(() => {
        watchLive = false
        mixer?.hold('watch', null)
      }, retireAfter)
      teardown.push(() => clearTimeout(timer))
    }

    // The room opens on the gesture that just unlocked the context — on every
    // path, with a door or without one, because the unlock is the only moment
    // both paths share. The drone's window waits for the desk when the caller
    // says where the desk is.
    openTheRoom()
    if (deps.deskReady === undefined) openTheWatchWindow()
    else void deps.deskReady.then(openTheWatchWindow)
    const reports = deps.root.querySelector('#w-rep .rep-grid')
    if (reports !== null) typing.observe(reports, { subtree: true, characterData: true })
  }

  const kick = (): void => void unlock()
  document.addEventListener('pointerdown', kick, true)
  document.addEventListener('keydown', kick, true)
  teardown.push(() => {
    document.removeEventListener('pointerdown', kick, true)
    document.removeEventListener('keydown', kick, true)
  })

  const unsubscribe = deps.driver.subscribe(onEvent)
  teardown.push(unsubscribe)

  return {
    setMuted,
    muted: () => muted,
    mixer: () => mixer,
    dispose() {
      for (const off of teardown) off()
      mixer?.dispose()
      mixer = null
    },
  }
}
