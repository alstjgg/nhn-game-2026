// Prefetch orchestrator (PRD §2.3): while customer N is on screen, customer
// N+1's dialogue beat and portrait sheet are generated in parallel. Each track
// is independent — one can be ready while the other is still in flight, which
// is what lets the silhouette enter on dialogue alone.
//
// Two rules shape everything here:
//   §3-3 all waiting flows through the injected Clock — this module contains no
//        host timing call of any kind (a source scan enforces it).
//   §3-5 failures are silent. Adapter rejections, schema-invalid payloads and a
//        broken fallback pack all degrade the track; nothing throws out of this
//        module and no error text ever reaches the state.

import type { CancelTimer, Clock } from './clock.ts';
import type { AIAdapter } from '../ai/adapter.ts';
import {
  isDialogueBeat,
  isPortraitSheet,
  type DialogueBeat,
  type DialogueRequest,
  type PortraitRequest,
  type PortraitSheet,
} from '../ai/contract.ts';

/**
 * The waiting beat from PRD §2.3: 25s and the customer walks in regardless.
 * TODO(balance-as-data): this is a tuning knob (CLAUDE.md "balance-as-data:
 * all tunables ... live in data/"), not logic, and belongs in
 * data/generation.json once a unit's file_globs cover data/** — u5's do not.
 * Until then, boot wiring can already override it per-call via
 * PrefetchOptions.deadlineMs below instead of editing this constant. Flagged
 * on the u5 PR review thread for board follow-up.
 */
export const DEADLINE_MS = 25_000;

/** `fallback` means "this is the bundled pack's answer", not "an error occurred". */
export type TrackStatus = 'pending' | 'ready' | 'fallback';

/**
 * Discriminated on `status` so the compiler — not the caller — knows `value`
 * is non-null once a track is `ready`. `fallback` keeps `T | null` because a
 * broken fallback pack (AC4-e) is a real, renderer-visible state: "we tried
 * and even the bundled pack failed" is different from "still coming".
 */
export type TrackState<T> =
  | { status: 'pending'; value: null }
  | { status: 'ready'; value: T }
  | { status: 'fallback'; value: T | null };

export interface PrefetchState {
  dialogue: TrackState<DialogueBeat>;
  portrait: TrackState<PortraitSheet>;
  /**
   * True once neither track is pending any more, OR once cancel() has been
   * called. cancel() does not force an in-flight track's status to a
   * terminal value (it may still read 'pending' if the customer left while a
   * request was still outstanding — see cancel()'s doc comment) but the
   * whole prefetch stops mattering to any consumer at that point, so
   * `settled` treats cancellation itself as terminal too. Always check
   * `cancelled` first: a `pending` track alongside `cancelled: true` means
   * "abandoned", not "still coming".
   */
  settled: boolean;
  cancelled: boolean;
}

/** Both halves of one customer's generation, composed from game state only. */
export interface PrefetchRequest {
  dialogue: DialogueRequest;
  portrait: PortraitRequest;
}

export interface PrefetchOptions {
  /** Primary source: the live adapter when the proxy answered the boot probe. */
  adapter: AIAdapter;
  /** Bundled pack used when the primary is late, broken or off-schema. */
  fallbackAdapter: AIAdapter;
  clock: Clock;
  request: PrefetchRequest;
  /** Defaults to DEADLINE_MS; injected only by tests and tuning. */
  deadlineMs?: number;
  /**
   * Diagnostic escape hatch for a bug IN A SUBSCRIBER — not an AI failure;
   * those are §3-5's job to absorb silently. Defaults to a no-op so this
   * module still has zero host-API surface of its own. A throwing listener
   * never stops the remaining listeners from being notified either way; this
   * only controls whether the fault is reported anywhere. Boot wiring may
   * pass a console/telemetry sink so a crashing render/reducer doesn't just
   * vanish with the component silently going stale.
   */
  onListenerFault?: (fault: unknown, listener: (state: PrefetchState) => void) => void;
}

export interface PrefetchHandle {
  /** A fresh snapshot every call — mutating it cannot reach internal state. */
  getState(): PrefetchState;
  /**
   * Fires on every track transition. Does NOT replay the current state (by
   * design) and does not invoke the listener immediately either: a listener
   * attached after a track has already settled will never hear about it on
   * its own. REQUIRED PATTERN: read `getState()` to seed, THEN `subscribe()`
   * for updates from that point on — never subscribe alone and assume the
   * first callback is the current state. See the "N4 — subscribe() does not
   * replay" tests in prefetch.test.ts for a pinned example of both the
   * hazard and the correct pattern.
   */
  subscribe(listener: (state: PrefetchState) => void): () => void;
  /**
   * Customer left / app unmounted: suppresses every future state change and
   * callback. LIMITATION: this does NOT abort in-flight adapter work — the
   * live/fallback promises already in flight keep running to completion (or
   * their own timeout) with the result simply discarded here. AIAdapter has
   * no AbortSignal seam to cancel them through. Concretely, the current live
   * dialogue call has one 8.5s request budget and no retry; runtime portrait
   * generation rejects without making a request. Follow-up: thread an
   * AbortSignal through AIAdapter so cancel() can actually stop the dialogue
   * request, not just its effect on this module's state.
   */
  cancel(): void;
}

/**
 * Response gate for the portrait track. Re-exported from contract.ts's
 * `isPortraitSheet` — THE single gate shared with the live adapter and the
 * stub's own self-check (see contract.ts's doc comment). This module used to
 * carry its own b64-only copy, which meant a live/hosted portrait delivered
 * by `url` (b64 empty) was silently discarded here even though contract.ts's
 * gate — and `portraitSrc()` — already treat b64-empty-with-url as valid
 * (integration f1). Do not re-fork this check.
 */
export { isPortraitSheet };

interface Track<T> {
  status: TrackStatus;
  value: T | null;
  /** Set the moment this track's outcome is decided — the late-arrival gate. */
  claimed: boolean;
  /** Set the moment the fallback pack is requested — dedupes the request,
   *  independent of `claimed` (which now only flips once the pack *answers*;
   *  see degrade()). */
  packRequested: boolean;
}

/** Turns a synchronously throwing adapter into a plain rejected promise. */
function call<T>(load: () => Promise<T>): Promise<T> {
  try {
    return load();
  } catch (fault) {
    return Promise.reject(fault);
  }
}

/**
 * A misconfigured deadline must never silently disable live AI (it would be
 * the one failure §3-5's "always fail silently" stance should NOT cover):
 * anything that isn't a finite, positive number falls back to DEADLINE_MS.
 */
function sanitizeDeadline(raw: number | undefined): number {
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : DEADLINE_MS;
}

export function startPrefetch(options: PrefetchOptions): PrefetchHandle {
  const { adapter, fallbackAdapter, clock, request } = options;
  const deadlineMs = sanitizeDeadline(options.deadlineMs);
  const reportListenerFault = options.onListenerFault ?? (() => undefined);

  const dialogue: Track<DialogueBeat> = { status: 'pending', value: null, claimed: false, packRequested: false };
  const portrait: Track<PortraitSheet> = { status: 'pending', value: null, claimed: false, packRequested: false };
  let cancelled = false;
  let listeners: ((state: PrefetchState) => void)[] = [];
  let releaseDeadline: CancelTimer = () => undefined;

  const toState = <T>(track: Track<T>): TrackState<T> => {
    if (track.status === 'ready') return { status: 'ready', value: track.value as T };
    if (track.status === 'fallback') return { status: 'fallback', value: track.value };
    return { status: 'pending', value: null };
  };

  const snapshot = (): PrefetchState => ({
    dialogue: toState(dialogue),
    portrait: toState(portrait),
    // Cancellation is terminal for the whole prefetch even when an
    // individual track never got to decide its own outcome — see the
    // PrefetchState.settled doc comment.
    settled: (dialogue.status !== 'pending' && portrait.status !== 'pending') || cancelled,
    cancelled,
  });

  const notify = (): void => {
    const state = snapshot();
    for (const listener of [...listeners]) {
      try {
        listener(state);
      } catch (fault) {
        reportListenerFault(fault, listener);
      }
    }
  };

  /** Marks a track's outcome as decided; the deadline is moot once both are. */
  const claim = (track: Track<unknown>): void => {
    track.claimed = true;
    if (dialogue.claimed && portrait.claimed) releaseDeadline();
  };

  const finish = <T>(track: Track<T>, status: TrackStatus, value: T | null): void => {
    if (cancelled) return;
    track.status = status;
    track.value = value;
    notify();
  };

  /**
   * Requests the fallback pack (once — packRequested dedupes repeat calls
   * from a live rejection racing the deadline). Deliberately does NOT claim
   * the track until the pack actually answers: claiming at request-time
   * would treat "we asked the bundled pack" as "the customer is decided"
   * even though nothing has been shown yet, discarding a live result that
   * arrives while the pack is still in flight for no reason — AC3 only
   * requires that an ALREADY-DISPLAYED customer never gets swapped.
   */
  const degrade = <T>(track: Track<T>, pack: () => Promise<T>, accepts: (v: unknown) => v is T): void => {
    if (cancelled || track.claimed || track.packRequested) return;
    track.packRequested = true;
    call(pack).then(
      (v) => {
        if (cancelled || track.claimed) return; // a live result claimed it while the pack was in flight
        claim(track);
        finish(track, 'fallback', accepts(v) ? v : null);
      },
      () => {
        if (cancelled || track.claimed) return;
        claim(track);
        finish(track, 'fallback', null);
      },
    );
  };

  const startTrack = <T>(
    track: Track<T>,
    live: () => Promise<T>,
    pack: () => Promise<T>,
    accepts: (v: unknown) => v is T,
  ): void => {
    call(live).then(
      (v) => {
        if (cancelled || track.claimed) return; // late arrival: the customer is already decided
        if (!accepts(v)) {
          degrade(track, pack, accepts);
          return;
        }
        claim(track);
        finish(track, 'ready', v);
      },
      () => degrade(track, pack, accepts),
    );
  };

  const dialoguePack = (): Promise<DialogueBeat> => fallbackAdapter.dialogue(request.dialogue);
  const portraitPack = (): Promise<PortraitSheet> => fallbackAdapter.portrait(request.portrait);

  releaseDeadline = clock.after(deadlineMs, () => {
    degrade(dialogue, dialoguePack, isDialogueBeat);
    degrade(portrait, portraitPack, isPortraitSheet);
  });

  startTrack(dialogue, () => adapter.dialogue(request.dialogue), dialoguePack, isDialogueBeat);
  startTrack(portrait, () => adapter.portrait(request.portrait), portraitPack, isPortraitSheet);

  return {
    getState: snapshot,

    subscribe(listener: (state: PrefetchState) => void): () => void {
      listeners = [...listeners, listener];
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },

    cancel(): void {
      if (cancelled) return;
      cancelled = true;
      releaseDeadline();
      listeners = [];
    },
  };
}
