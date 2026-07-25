// index.ts — the app shell / sequencer (PRD §1.1 five-phase FSM, §1.4 overlap,
// §2.3 async generation pipeline).
//
// Single page, NO routing: phases are DOM states swapped inside #app, and every
// swap ANIMATES (§4.6). The shell drives the roster (u13's `roster.ts`) through
// the fixed shell — entrance → conversation → crafting → handover → outcome —
// and delivers each customer's outcome on the channel data assigns it:
//   • customer 1 → 재방문: a DELAYED result-arrival notification that fires the
//     instant customer 2's conversation begins (the signature overlap).
//   • every later customer → 문앞 쪽지: the note at the door.
//
// The overlap is deterministic, driven by the u2 predicate `isOutcomeDue(...)`
// evaluated on the two machines' phases — NOT a wall-clock timer.
//
// Async generation (§2.3) is wired here and nowhere else:
//   • the moment customer N's conversation begins, customer N+1's dialogue seed
//     and portrait sheet start prefetching (u5) through the ONE injected adapter;
//   • a customer whose dialogue is ready walks in — as a backlit silhouette when
//     only the portrait is still coming, resolving in place when it lands;
//   • a customer whose dialogue is not ready yet gets the door-idle beat, which
//     ends the moment the track leaves `pending` — either the generation landed
//     or u5's injected-clock deadline handed over to the bundled pack. Silently.
//
// The only timers in this module are animation-cleanup fallbacks; no generation
// wait is ever scheduled here (§3-3 — all of it flows through the injected clock
// inside u5's prefetch).
import './app.css';

import {
  createMachine,
  reduce,
  isOutcomePending,
  isOutcomeDue,
  type MachineState,
} from '../state/index.ts';
import { loadIngredients } from '../data/loader.ts';
import type { Ingredient, Outcome } from '../data/schema.ts';
import type { AIAdapter } from '../ai/adapter.ts';
import type { DialogueBeat } from '../ai/contract.ts';
import type { Clock } from '../pipeline/clock.ts';
import { startPrefetch, type PrefetchHandle, type PrefetchState } from '../pipeline/prefetch.ts';
import { mountConversation, type ConversationHandle } from '../screens/conversation/conversation.ts';
import { mountCrafting } from '../screens/crafting/index.ts';
import { mountWaiting } from '../screens/waiting/waiting.ts';
import { renderEntrance } from './entrance.ts';
import { mountRevisitNotification } from '../screens/outcome/revisit.ts';
import { renderDoorNote } from '../screens/outcome/note.ts';
import { renderClosing } from '../screens/outcome/closing.ts';
import { createCard } from '../ui/card.ts';
import {
  buildRoster,
  conversationOptionsFor,
  portraitUrlFor,
  CLOSING_LABEL,
  CLOSING_LINE,
  CONTINUE_LABEL,
  DOOR_IDLE_HOLD_MS,
  REOPEN_LABEL,
  WAITING_LINE,
  type RosterEntry,
} from './roster.ts';

import ingredientsData from '../../data/ingredients.json';

/** Fallback so a missed animationend never strands an exiting screen on stage. */
const EXIT_FALLBACK_MS = 500;

/**
 * The one slot whose result is DELAYED (§1.4): the shop's first customer, whose
 * 재방문 lands on top of the next visit. Every later result arrives at once.
 */
const DELAYED_SLOT = 0;

/** Everything the shell is handed from outside — boot wiring owns all of it. */
export interface AppDeps {
  /** The ONE adapter instance the whole app shares (the boot factory picks it). */
  readonly adapter: AIAdapter;
  /** The injected timing seam every generation wait flows through (§3-3). */
  readonly clock: Clock;
  /** Uniform per-slot deadline override (the e2e harness scripts it). */
  readonly deadlineMs?: number;
  /** The generated slot's deadline — boot picks the live or the stub value. */
  readonly generatedDeadlineMs?: number;
  /**
   * How long the door-idle beat is held when the next customer's generation has
   * already fallen back to the bundled pack (default: the data value). The e2e
   * harnesses set 0 so a scripted flow is never gated on a staged beat.
   */
  readonly doorIdleHoldMs?: number;
}

/** One started prefetch, as the test hook reports it. */
interface PrefetchProbe {
  readonly customerId: string;
  readonly dialogue: string;
  readonly portrait: string;
  readonly startedAtPhase: string;
}

/** Optional test hook the e2e gate reads to assert app state deterministically. */
interface AppTestApi {
  readonly customer1Phase: string;
  readonly customer2Phase: string;
  readonly customer1OutcomeDelivered: boolean;
  readonly adapterMode: string;
  readonly rosterIds: string[];
  readonly waiting: boolean;
  readonly fallbackUsed: boolean;
  readonly prefetch: PrefetchProbe[];
}

interface PrefetchRecord {
  readonly slot: number;
  readonly customerId: string;
  /** Which customer's phase the prefetch was started in (§2.3's trigger). */
  readonly startedAtPhase: string;
  readonly handle: PrefetchHandle;
}

export function mountApp(container: HTMLElement, deps: AppDeps): void {
  // ── Data (build-time imports; no runtime fetch — §4.2) ──────────────────
  const ingredients: Ingredient[] = loadIngredients(ingredientsData);
  const roster: RosterEntry[] = buildRoster({
    deadlineMs: deps.deadlineMs,
    generatedDeadlineMs: deps.generatedDeadlineMs,
  });
  if (roster.length === 0) {
    throw new Error('app shell requires at least one customer in the roster');
  }

  // ── One phase machine per roster slot (u2). Reassigned on each transition;
  // the getters below always read the live bindings. ────────────────────────
  const machines: MachineState[] = roster.map((entry) => createMachine(entry.customer.patienceBudget));
  const outcomes: (Outcome | null)[] = roster.map(() => null);
  const prefetches: PrefetchRecord[] = [];
  /**
   * The sheet URL each slot's face was last painted with. The conversation is
   * where a portrait resolves, and the crafting screen / the 재방문 overlay must
   * show the SAME face (PR #33, R3) — they mount after the fact, so the shell
   * remembers rather than re-deciding.
   */
  const paintedSheetUrls: (string | null)[] = roster.map(() => null);
  const doorIdleHoldMs = deps.doorIdleHoldMs ?? DOOR_IDLE_HOLD_MS;
  let waitingNow = false;

  // ── DOM scaffold ─────────────────────────────────────────────────────────
  const root = document.createElement('main');
  root.className = 'apothecary-app';
  const stage = document.createElement('div');
  stage.className = 'stage';
  stage.dataset.testid = 'stage';
  // The overlay layer floats the 재방문 notification ABOVE the live customer-2
  // conversation — that spatial overlap IS the mechanic (§1.4).
  const overlayLayer = document.createElement('div');
  overlayLayer.className = 'overlay-layer';
  overlayLayer.dataset.testid = 'overlay-layer';
  root.append(stage, overlayLayer);
  container.replaceChildren(root);

  // Expose a read-only test hook (mirrors the crafting harness's window.__crafting).
  const api: AppTestApi = {
    get customer1Phase() {
      return machines[0].phase;
    },
    get customer2Phase() {
      return machines[1].phase;
    },
    get customer1OutcomeDelivered() {
      return machines[0].phase === 'outcome';
    },
    get adapterMode() {
      return deps.adapter.mode;
    },
    get rosterIds() {
      return roster.map((entry) => entry.customer.id);
    },
    get waiting() {
      return waitingNow;
    },
    get fallbackUsed() {
      return prefetches.some((record) => {
        const state = record.handle.getState();
        return state.dialogue.status === 'fallback' || state.portrait.status === 'fallback';
      });
    },
    get prefetch() {
      return prefetches.map((record): PrefetchProbe => {
        const state = record.handle.getState();
        return {
          customerId: record.customerId,
          dialogue: state.dialogue.status,
          portrait: state.portrait.status,
          startedAtPhase: record.startedAtPhase,
        };
      });
    },
  };
  (window as unknown as { __app: AppTestApi }).__app = api;

  /**
   * Clears the overlap overlay (재방문 notification) whenever the stage moves
   * to a new phase. The notification exists to overlap the ONE live
   * conversation it was mounted during (§1.4) — left unmounted, it lingers
   * through every later phase (the following waiting beat, the next
   * customer's whole conversation, even the door-note ending; f2). It is not
   * pinned to any single roster slot, so this lives in the shared swap path
   * rather than any one phase function.
   */
  function clearOverlay(): void {
    const lingering = Array.from(overlayLayer.children) as HTMLElement[];
    for (const node of lingering) {
      node.classList.add('revisit-notification--exit');
      const drop = (): void => node.remove();
      node.addEventListener('animationend', drop, { once: true });
      window.setTimeout(drop, EXIT_FALLBACK_MS);
    }
  }

  /**
   * Swap the stage to a fresh screen, animating the old one out and the new one
   * in (§4.6 — never an instant swap). Returns the new wrapper so the caller can
   * mount a screen into it.
   */
  function swapStage(): HTMLElement {
    clearOverlay();
    const outgoing = stage.firstElementChild as HTMLElement | null;
    if (outgoing) {
      outgoing.classList.remove('phase-enter');
      outgoing.classList.add('phase-exit');
      const drop = (): void => outgoing.remove();
      outgoing.addEventListener('animationend', drop, { once: true });
      window.setTimeout(drop, EXIT_FALLBACK_MS);
    }
    const wrapper = document.createElement('section');
    wrapper.className = 'phase phase-enter';
    stage.appendChild(wrapper);
    return wrapper;
  }

  /** A stage swap that carries one customer's phase identity (test hooks + CSS). */
  function swapPhase(customerId: string, phase: string): HTMLElement {
    const wrapper = swapStage();
    wrapper.dataset.customer = customerId;
    wrapper.dataset.phase = phase;
    wrapper.dataset.testid = `phase-${customerId}-${phase}`;
    return wrapper;
  }

  // ── §2.3 prefetch ─────────────────────────────────────────────────────────

  /**
   * Start customer `slot`'s generation. Called the instant the PREVIOUS
   * customer's conversation begins — never earlier (nothing is generated before
   * the shop is actually in a conversation) and never twice for the same slot.
   * Fire-and-forget by construction: `startPrefetch` returns synchronously and
   * nothing here awaits it, so the conversation that triggered it cannot be
   * delayed by a single tick (FR-6 / NFR-3).
   */
  function startPrefetchFor(slot: number, startedAtPhase: string): void {
    const entry = roster[slot];
    if (entry === undefined) return;
    if (prefetches.some((record) => record.slot === slot)) return;
    prefetches.push({
      slot,
      customerId: entry.customer.id,
      startedAtPhase,
      handle: startPrefetch({
        adapter: deps.adapter,
        fallbackAdapter: entry.packAdapter,
        clock: deps.clock,
        request: entry.request,
        deadlineMs: entry.deadlineMs,
      }),
    });
  }

  function prefetchFor(slot: number): PrefetchRecord | undefined {
    return prefetches.find((record) => record.slot === slot);
  }

  /**
   * Bring customer `slot` on. The dialogue track decides HOW they arrive: ready
   * (or already handed over to the bundled pack) and they walk in; still pending
   * and the shop plays the door-idle beat until it isn't. Slot 0 has no prefetch
   * at all — there is no customer before it — so it simply walks in.
   */
  function beginVisit(slot: number): void {
    const record = prefetchFor(slot);
    if (record === undefined) {
      startEntrance(slot);
      return;
    }
    const status = record.handle.getState().dialogue.status;
    if (status === 'pending') {
      playWaitingBeat(slot, record);
      return;
    }
    if (status === 'fallback' && doorIdleHoldMs > 0) {
      // Nothing left to wait FOR — the generation already handed over to the
      // bundled pack — but the shop's own beat is what makes the next arrival read
      // as staging instead of an instant swap (PR #33, R3). Held for a fixed,
      // felt duration on the INJECTED clock (§3-3), so this schedules no timer of
      // its own and the e2e harnesses can zero or script it.
      playStagedDoorBeat(slot);
      return;
    }
    startEntrance(slot);
  }

  /**
   * The door-idle beat as STAGING: same screen, same ambient line, no readout —
   * only the end condition differs (a fixed hold instead of a track transition).
   * A generation that is READY still walks straight in; this is the "the customer
   * you are about to meet was already generated" case, which is every case on the
   * deployed stub build.
   */
  function playStagedDoorBeat(slot: number): void {
    const wrapper = swapStage();
    wrapper.dataset.phase = 'waiting';
    const beat = mountWaiting(wrapper, { line: WAITING_LINE });
    waitingNow = true;
    deps.clock.after(doorIdleHoldMs, () => {
      waitingNow = false;
      beat.settle();
      startEntrance(slot);
    });
  }

  /**
   * The door-idle beat (§2.3): ambient staging, no readout, no countdown, no
   * error text — the player never learns anything is late. It ends on the
   * prefetch's own transition, so the 25s ceiling is u5's injected-clock
   * deadline and this module schedules nothing.
   */
  function playWaitingBeat(slot: number, record: PrefetchRecord): void {
    const wrapper = swapStage();
    wrapper.dataset.phase = 'waiting';
    const beat = mountWaiting(wrapper, { line: WAITING_LINE });
    waitingNow = true;

    let settled = false;
    let unsubscribe: (() => void) | null = null;
    const open = (state: PrefetchState): void => {
      if (settled || state.dialogue.status === 'pending') return;
      settled = true;
      if (unsubscribe !== null) unsubscribe();
      waitingNow = false;
      // The door opens and the customer arrives in the same beat: this module
      // owns no clock, so it cannot stagger the two (waiting.ts's contract).
      beat.settle();
      startEntrance(slot);
    };
    // Subscribe FIRST, then seed from the current state, so a transition landing
    // between the two can neither be missed nor delivered twice (`settled`).
    unsubscribe = record.handle.subscribe(open);
    open(record.handle.getState());
  }

  /** The dialogue seed this slot's prefetch produced, if it produced one. */
  function seedFor(slot: number): DialogueBeat | undefined {
    const record = prefetchFor(slot);
    if (record === undefined) return undefined;
    return record.handle.getState().dialogue.value ?? undefined;
  }

  /**
   * Paint the portrait into the mounted conversation. A sheet that is already
   * decided lands a microtask later — before the browser paints a frame, so the
   * silhouette is never seen; one still in flight arrives whenever it arrives,
   * resolving INSIDE the panel it already occupies (u9's `setSheet` is a class
   * swap plus two background properties), so a mid-conversation arrival is a
   * repaint and cannot reflow the screen.
   */
  function applyPortrait(slot: number, paint: (url: string) => void): void {
    const entry = roster[slot];
    const record = prefetchFor(slot);
    const paintUrl = (url: string): void => {
      paintedSheetUrls[slot] = url;
      paint(url);
    };
    const paintFrom = (state: PrefetchState | null): void => {
      const sheet = state === null ? null : state.portrait.value;
      // Never rejects (portraitUrlFor degrades silently), so nothing here can
      // surface an unhandled rejection.
      void portraitUrlFor(entry, sheet).then(paintUrl);
    };
    if (record === undefined) {
      paintFrom(null);
      return;
    }
    let painted = false;
    let unsubscribe: (() => void) | null = null;
    const arrive = (state: PrefetchState): void => {
      if (painted || state.portrait.status === 'pending') return;
      painted = true;
      if (unsubscribe !== null) unsubscribe();
      paintFrom(state);
    };
    unsubscribe = record.handle.subscribe(arrive);
    arrive(record.handle.getState());
  }

  // ── Phase track (one code path for every roster slot) ─────────────────────

  function startEntrance(slot: number): void {
    const entry = roster[slot];
    const wrapper = swapPhase(entry.customer.id, 'entrance');
    const entrance = renderEntrance(wrapper, entry.customer, () => {
      machines[slot] = reduce(machines[slot], { type: 'advance' }); // entrance → conversation
      startConversation(slot);
    });
    // The arrival has a subject: the framed panel enters as the silhouette and
    // resolves into the same sheet the conversation will keep showing. A portrait
    // still in flight simply stays unlit — which is the designed §2.3 beat.
    applyPortrait(slot, (url) => entrance.setPortraitSheet(url));
  }

  function startConversation(slot: number): void {
    const entry = roster[slot];
    // Read at the conversation→crafting handoff (below): the conversation screen
    // owns its own patience machine, so its tier is the only place the mood the
    // customer ends on can come from.
    let liveConversation: ConversationHandle | null = null;
    const wrapper = swapPhase(entry.customer.id, 'conversation');
    let advanced = false;
    /**
     * Mirror the conversation's phase onto this slot's app machine. The
     * conversation screen owns its OWN machine, so the app's copy only moves when
     * it is told to — and it is told twice on the forced path (the phase report,
     * then the handover). The second call is a D3 identity no-op, which is why
     * this can be the ONE place the event is dispatched.
     */
    const mirrorCrafting = (): void => {
      machines[slot] = reduce(machines[slot], { type: 'proceedToCrafting' });
    };
    const toCrafting = (): void => {
      if (advanced) return; // one handover per conversation, however it was reached
      advanced = true;
      mirrorCrafting();
      startCrafting(slot, liveConversation?.tier ?? 0);
    };
    const conversation = mountConversation(
      wrapper,
      entry.customer,
      {
        // The handover — from any of the three endings (craft card, natural end,
        // forced end) — is the player's press, never a phase report.
        onComplete: toCrafting,
        // Patience hit zero (u2 F3). The stage does NOT swap here (PR #33, R3):
        // the screen keeps the customer's 한계 line up behind its proceed
        // affordance, and swapping now would delete the reply that press earned
        // mid-type. Only the app machine moves, so `window.__app` and the overlap
        // predicate read the truth while the conversation is still on stage.
        onPhaseChange: mirrorCrafting,
      },
      conversationOptionsFor(seedFor(slot)),
    );
    liveConversation = conversation;
    applyPortrait(slot, (url) => conversation.setPortraitSheet(url));

    // ── §2.3 PREFETCH TRIGGER ─────────────────────────────────────────────
    // The moment this conversation begins, the NEXT customer starts generating.
    startPrefetchFor(slot + 1, `${entry.customer.id}:conversation`);

    // ── SIGNATURE OVERLAP (§1.4) ──────────────────────────────────────────
    // Ask the u2 predicate whether the previous customer's delayed outcome is
    // now due. Level-triggered on the two machines' phases — deterministic, NO
    // timer. Same phases ⇒ same answer.
    maybeDeliverDelayedOutcome(slot);
  }

  function startCrafting(slot: number, tier: number): void {
    const entry = roster[slot];
    const wrapper = swapPhase(entry.customer.id, 'crafting');
    mountCrafting(wrapper, {
      ingredients,
      customerId: entry.customer.id,
      outcomeTable: entry.outcomeTable,
      // The customer is standing at the counter while the remedy is prepared, at
      // the mood the conversation left them in (PR #33, R3).
      portrait: {
        sheetUrl: paintedSheetUrls[slot] ?? entry.bundledPortraitUrl,
        tier,
        ...(entry.portraitVariant === undefined ? {} : { variant: entry.portraitVariant }),
      },
      onCommit: (result) => {
        outcomes[slot] = result.outcome;
        machines[slot] = reduce(machines[slot], { type: 'commit' }); // crafting → handover
        if (slot === DELAYED_SLOT) {
          // DELAY delivery: this machine parks at 'handover'
          // (isOutcomePending === true) while the next visit begins. The overlap
          // predicate decides when the result is finally due.
          beginVisit(slot + 1);
          return;
        }
        machines[slot] = reduce(machines[slot], { type: 'deliverOutcome' }); // → outcome
        startOutcome(slot);
      },
    });
  }

  function maybeDeliverDelayedOutcome(slot: number): void {
    const previous = slot - 1;
    if (previous !== DELAYED_SLOT) return;
    const pending = outcomes[previous];
    const due = isOutcomeDue({
      customer1OutcomePending: isOutcomePending(machines[previous]), // 'handover' ⇒ true
      customer2Phase: machines[slot].phase, // '>= conversation' ⇒ has begun
    });
    if (!due || pending === null) return;
    machines[previous] = reduce(machines[previous], { type: 'deliverOutcome' });
    // 재방문 channel: the delayed result arrives over the live conversation.
    const returning = roster[previous];
    mountRevisitNotification(overlayLayer, {
      customer: returning.customer,
      outcome: pending,
      sheetUrl: paintedSheetUrls[previous] ?? returning.bundledPortraitUrl,
      ...(returning.portraitVariant === undefined ? {} : { variant: returning.portraitVariant }),
    });
  }

  /**
   * 문앞 쪽지 channel. When another customer is still on the roster, the note
   * carries the explicit affordance that invites them in (FR-9): the shop never
   * advances on a timer, so the player decides when the next visit starts.
   */
  function startOutcome(slot: number): void {
    const outcome = outcomes[slot];
    if (outcome === null) return;
    const entry = roster[slot];
    const wrapper = swapPhase(entry.customer.id, 'outcome');
    // The note gets its OWN element inside the phase wrapper: `renderDoorNote`
    // stamps `door-note` as the testid of whatever it is handed, so nesting is
    // what lets the phase keep its own `phase-<id>-outcome` identity while the
    // note keeps the hook every outcome spec reads. The child reuses the `.phase`
    // layout box because the door-note rules (centring, gap) are written against it.
    const note = document.createElement('div');
    note.className = 'phase';
    wrapper.append(note);
    renderDoorNote(note, { customer: entry.customer, outcome });
    const next = slot + 1;
    if (roster[next] === undefined) {
      // The LAST customer's note: the day gets a closing beat rather than ending
      // on a frame with nothing to press (PR #33, R3). Same explicit-affordance
      // rule as FR-9 — the shop never advances on a timer.
      let closed = false;
      const close = createCard({
        label: CLOSING_LABEL,
        onToggle: (selected) => {
          if (!selected || closed) return;
          closed = true;
          startClosing();
        },
      });
      close.dataset.testid = 'close-shop';
      note.append(close);
      return;
    }
    let invited = false;
    const invite = createCard({
      label: CONTINUE_LABEL,
      onToggle: (selected) => {
        if (!selected || invited) return;
        invited = true;
        beginVisit(next);
      },
    });
    invite.dataset.testid = 'continue-to-next';
    note.append(invite);
  }

  /**
   * The day's last beat: the lamp comes down, the door closes, and the one
   * affordance left starts the day again. The replay is a fresh mount of the same
   * seeded run (§NFR-6), so it replays identically — deliberate, not a reset.
   */
  function startClosing(): void {
    const wrapper = swapStage();
    wrapper.dataset.phase = 'closing';
    wrapper.dataset.testid = 'phase-closing';
    const beat = document.createElement('div');
    beat.className = 'phase';
    wrapper.append(beat);
    renderClosing(beat, {
      line: CLOSING_LINE,
      reopenLabel: REOPEN_LABEL,
      onReopen: () => mountApp(container, deps),
    });
  }

  // Kick off the sequence.
  beginVisit(0);
}
