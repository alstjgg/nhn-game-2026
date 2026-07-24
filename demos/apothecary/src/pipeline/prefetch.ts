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
  type DialogueBeat,
  type DialogueRequest,
  type PortraitRequest,
  type PortraitSheet,
} from '../ai/contract.ts';

/** The waiting beat from PRD §2.3: 25s and the customer walks in regardless. */
export const DEADLINE_MS = 25_000;

/** `fallback` means "this is the bundled pack's answer", not "an error occurred". */
export type TrackStatus = 'pending' | 'ready' | 'fallback';

export interface TrackState<T> {
  status: TrackStatus;
  value: T | null;
}

export interface PrefetchState {
  dialogue: TrackState<DialogueBeat>;
  portrait: TrackState<PortraitSheet>;
  /** True once neither track is pending any more. */
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
}

export interface PrefetchHandle {
  /** A fresh snapshot every call — mutating it cannot reach internal state. */
  getState(): PrefetchState;
  /** Fires on every track transition. Does not replay the current state. */
  subscribe(listener: (state: PrefetchState) => void): () => void;
  /** Customer left / app unmounted: in-flight work stops touching state. */
  cancel(): void;
}

/** Response gate for the portrait track (the dialogue one lives in contract.ts). */
export function isPortraitSheet(v: unknown): v is PortraitSheet {
  if (typeof v !== 'object' || v === null) return false;
  const sheet = v as Record<string, unknown>;
  return typeof sheet.b64 === 'string' && sheet.b64.length > 0 && typeof sheet.prompt === 'string';
}

interface Track<T> {
  status: TrackStatus;
  value: T | null;
  /** Set the moment this track's outcome is decided — the late-arrival gate. */
  claimed: boolean;
}

/**
 * A listener's exception is contained here: the pipeline must keep notifying the
 * remaining listeners, and §3-5 forbids surfacing the failure any further.
 */
function containListenerFault(_fault: unknown): void {
  return;
}

/** Turns a synchronously throwing adapter into a plain rejected promise. */
function call<T>(load: () => Promise<T>): Promise<T> {
  try {
    return load();
  } catch (fault) {
    return Promise.reject(fault);
  }
}

export function startPrefetch(options: PrefetchOptions): PrefetchHandle {
  const { adapter, fallbackAdapter, clock, request } = options;
  const deadlineMs = options.deadlineMs ?? DEADLINE_MS;

  const dialogue: Track<DialogueBeat> = { status: 'pending', value: null, claimed: false };
  const portrait: Track<PortraitSheet> = { status: 'pending', value: null, claimed: false };
  let cancelled = false;
  let listeners: ((state: PrefetchState) => void)[] = [];
  let releaseDeadline: CancelTimer = () => undefined;

  const snapshot = (): PrefetchState => ({
    dialogue: { status: dialogue.status, value: dialogue.value },
    portrait: { status: portrait.status, value: portrait.value },
    settled: dialogue.status !== 'pending' && portrait.status !== 'pending',
    cancelled,
  });

  const notify = (): void => {
    const state = snapshot();
    for (const listener of [...listeners]) {
      try {
        listener(state);
      } catch (fault) {
        containListenerFault(fault);
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

  const degrade = <T>(track: Track<T>, pack: () => Promise<T>, accepts: (v: unknown) => v is T): void => {
    if (cancelled || track.claimed) return;
    claim(track);
    call(pack).then(
      (v) => finish(track, 'fallback', accepts(v) ? v : null),
      () => finish(track, 'fallback', null),
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
