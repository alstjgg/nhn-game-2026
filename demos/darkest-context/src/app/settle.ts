// u17 — the settle flag (`[data-testid="app-shell"][data-settled]`).
//
// apothecary DISCOVERY §2, verbatim in effect: *the whole suite was green while every
// screenshot was unusable*. Every capture caught a mid-cross-fade frame, and no
// functional assertion can catch that — "is this frame worth looking at" is a property
// of the rendered frame, not of the DOM. Playwright's `toBeVisible()` is happy with an
// element at `opacity: 0`, so a capture needs something else to await.
//
// This is that something: `false` from the moment a phase change starts, `true` once
// nothing inside the screen slot is still moving.
//
// It is MEASURED, never timed. `Element.getAnimations({ subtree: true })` is asked what
// is actually running and the flag waits on those very animations to finish, so a screen
// that grew a slower entrance stays un-settled for exactly as long as it needs. Two
// things are deliberately not waited on:
//
//   · LOOPING animations (`breathe-bob`, `sprite-walk`, `bg-scroll`, …). A living scene
//     never stops moving; requiring it to would mean the flag never flips.
//   · a scene that will not converge. After `MAX_PASSES` re-checks the flag settles
//     anyway — a capture gate that can deadlock the run is worse than a slightly early
//     frame (INV-7).
//
// No timer is armed here either: the frame hop is a zero-length Web Animation on the
// SHELL, which is outside the slot and therefore invisible to the measurement itself.

/** How many times the slot may grow fresh animations before the flag gives up waiting. */
const MAX_PASSES = 16;

/** Long enough to cross one frame boundary, short enough to be free. */
const FRAME_MS = 1;

export interface SettleTracker {
  /** A phase change has started: the flag goes `false` until the slot stops moving. */
  begin: () => void;
}

const quiet = (animation: Animation): Promise<void> =>
  animation.finished.then(
    () => undefined,
    () => undefined,
  );

function nextFrame(element: HTMLElement): Promise<void> {
  return quiet(
    element.animate([{ opacity: 1 }, { opacity: 1 }], { duration: FRAME_MS, fill: 'none' }),
  );
}

/**
 * Animations the flag is willing to wait for: running, and destined to end. An infinite
 * iteration count reports `endTime: Infinity`, which is the whole filter.
 */
function pendingIn(slot: HTMLElement): Animation[] {
  return slot.getAnimations({ subtree: true }).filter((animation) => {
    if (animation.playState !== 'running') return false;
    const timing = animation.effect?.getComputedTiming();
    if (timing === undefined) return false;
    return Number.isFinite(Number(timing.endTime));
  });
}

export function createSettleTracker(shell: HTMLElement, slot: HTMLElement): SettleTracker {
  // Every `begin()` invalidates the watch before it: a phase that is replaced mid-entrance
  // must not have its predecessor announce the page as settled.
  let generation = 0;

  const watch = async (token: number): Promise<void> => {
    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      // One frame first, so animations the freshly mounted screen declares have started.
      await nextFrame(shell);
      if (token !== generation) return;

      const running = pendingIn(slot);
      if (running.length === 0) break;

      await Promise.all(running.map(quiet));
      if (token !== generation) return;
    }
    if (token === generation) shell.dataset.settled = 'true';
  };

  return {
    begin: () => {
      generation += 1;
      const token = generation;
      shell.dataset.settled = 'false';
      void watch(token);
    },
  };
}

/** A tracker for a shell that is not on the page — unit tests, harness pages. */
export const NO_SETTLE: SettleTracker = { begin: (): void => {} };
