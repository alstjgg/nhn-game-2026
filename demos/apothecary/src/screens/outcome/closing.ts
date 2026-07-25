// closing.ts — the day's closing beat (PR #33, R3).
//
// The shop's last frame used to be a door note with nothing to press: the demo
// did not end, it stopped. This is the deliberate final beat — the shopkeeper
// lowers the lamp and closes the door — plus the one affordance that lets a judge
// play the day again (the run is seeded, so a replay is identical by design).
//
// All copy is INJECTED from data/fallback-npcs.json (§2.3): this screen authors
// nothing and owns no clock — the reopen action is the host's.
export interface ClosingDeps {
  /** The closing line, verbatim from data. */
  readonly line: string;
  /** Label of the replay affordance. */
  readonly reopenLabel: string;
  /** Host hook: start the day again. */
  readonly onReopen: () => void;
}

/** Mount the closing beat into `wrapper`. Returns the element for the host. */
export function renderClosing(wrapper: HTMLElement, deps: ClosingDeps): HTMLElement {
  wrapper.classList.add('closing');
  wrapper.dataset.testid = 'closing';

  const line = document.createElement('p');
  line.className = 'closing__line';
  line.dataset.testid = 'closing-line';
  line.textContent = deps.line;

  const reopen = document.createElement('button');
  reopen.type = 'button';
  reopen.className = 'app-button';
  reopen.dataset.testid = 'closing-reopen';
  reopen.textContent = deps.reopenLabel;
  reopen.addEventListener('click', deps.onReopen);

  wrapper.append(line, reopen);
  return wrapper;
}
