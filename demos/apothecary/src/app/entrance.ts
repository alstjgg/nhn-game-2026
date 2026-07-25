// entrance.ts — the first of the five phases (§1.1). A customer arrives at the
// counter: their portrait ENTERS via the shared u5 `portrait-enter` animation
// (never an instant insert) and states their problem, then a single greet
// affordance advances the FSM (entrance → conversation).
//
// The arrival has a VISUAL SUBJECT (PR #33, R3): it used to be three lines of
// centred text on the shop background — "the customer walks in" with nobody
// arriving. It now mounts u9's framed panel, which enters as the backlit
// silhouette and resolves into the sheet the host paints (immediately when the
// portrait is already decided, whenever it lands otherwise) — the same panel, the
// same choreography and the same face the conversation continues with.
import type { Customer } from '../data/schema.ts';
import { mountPortrait, type PortraitHandle } from '../ui/portrait.ts';

/** What the host keeps hold of: the panel, so a late sheet can still resolve. */
export interface EntranceHandle {
  /** Paint an already-pixelated sheet, resolving the silhouette in place. */
  setPortraitSheet(url: string): void;
}

/**
 * Render the entrance screen for one customer into `wrapper`. `onGreet` is the
 * host's advance hook (dispatches the machine `advance` event).
 */
export function renderEntrance(
  wrapper: HTMLElement,
  customer: Customer,
  onGreet: () => void,
): EntranceHandle {
  wrapper.classList.add('entrance-screen');

  const portrait = document.createElement('div');
  portrait.className = 'portrait entrance-portrait anim-portrait-enter';
  portrait.dataset.testid = 'entrance-portrait';
  portrait.setAttribute('role', 'img');
  portrait.setAttribute('aria-label', customer.name);
  const panel: PortraitHandle = mountPortrait(
    portrait,
    customer.portraitVariant === undefined ? {} : { variant: customer.portraitVariant },
  );

  const name = document.createElement('p');
  name.className = 'entrance-screen__name';
  name.dataset.testid = 'entrance-name';
  name.textContent = customer.name;

  const problem = document.createElement('p');
  problem.className = 'entrance-screen__problem';
  problem.dataset.testid = 'entrance-problem';
  problem.textContent = customer.problem;

  const greet = document.createElement('button');
  greet.type = 'button';
  greet.className = 'app-button';
  greet.dataset.testid = 'entrance-greet';
  greet.textContent = '[손님을 맞이한다]';
  greet.addEventListener('click', onGreet);

  wrapper.append(portrait, name, problem, greet);

  return {
    setPortraitSheet(url: string): void {
      panel.setSheet(url);
    },
  };
}
