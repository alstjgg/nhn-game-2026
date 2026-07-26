// u15 — the two beats between screens (PRD §2.4, §2.5, INV-6).
//
// A composed run has two moments where one screen replaces another with no player click
// in between, and both are unreadable if the swap happens in the frame that produced
// them:
//
//   · ARRIVAL — the walk ends and the tile takes the slot. Without a beat the party is
//     never seen arriving anywhere; the fight simply appears.
//   · OUTCOME — a fight settles. 승리 on the board and the last bubbles in the log are
//     the payoff of the whole tile, and the reward screen would erase them instantly.
//
// Both are PRESENTATION, and both go through the Web Animations API: the swap follows a
// real animation on a real element, which is what "the screen changed" means. Nothing
// here advances the run — the FSM still moves only when it is handed `walkComplete` /
// `resolveTile` — and no `setTimeout` is armed, so `src/ai/stub.ts` remains the only
// module in `src/**` that owns a timer (INV-6).
//
// The two durations are motion design, not balance: they are the same register as the
// `--dc-dur-*` tokens the animation vocabulary already ships, and no rule reads them.

/** The party is seen arriving before the tile it walked onto takes the slot. */
const ARRIVAL_MS = 180;

/** How long a settled fight stays readable before its reward replaces it. */
const OUTCOME_MS = 640;

function play(
  element: HTMLElement,
  frames: readonly Keyframe[],
  durationMs: number,
  task: () => void,
): void {
  const animation = element.animate([...frames], {
    duration: durationMs,
    easing: 'ease-out',
    fill: 'none',
  });
  // Settled or cancelled, the swap still happens: a beat that could not play is a beat
  // the player did not get, never a run that stops (INV-7).
  void animation.finished.then(
    () => {
      task();
    },
    () => {
      task();
    },
  );
}

/** The walk dims as the party reaches the tile. */
export function afterArrival(element: HTMLElement, task: () => void): void {
  play(element, [{ opacity: 1 }, { opacity: 0.6 }], ARRIVAL_MS, task);
}

/** The colour drains out of a fight that is over. */
export function afterOutcome(element: HTMLElement, task: () => void): void {
  play(
    element,
    [{ filter: 'saturate(1)' }, { filter: 'saturate(0.55) brightness(0.85)' }],
    OUTCOME_MS,
    task,
  );
}
