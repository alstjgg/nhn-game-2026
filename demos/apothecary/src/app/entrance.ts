// entrance.ts — the first of the five phases (§1.1). A customer arrives at the
// counter: their portrait ENTERS via the shared u5 `portrait-enter` animation
// (never an instant insert) and states their problem, then a single greet
// affordance advances the FSM (entrance → conversation). The portrait is a CSS
// placeholder (design D9 — no raster shipped), matching the conversation screen.
import type { Customer } from '../data/schema.ts';

/**
 * Render the entrance screen for one customer into `wrapper`. `onGreet` is the
 * host's advance hook (dispatches the machine `advance` event).
 */
export function renderEntrance(
  wrapper: HTMLElement,
  customer: Customer,
  onGreet: () => void,
): void {
  wrapper.classList.add('entrance-screen');

  const portrait = document.createElement('div');
  portrait.className = 'portrait anim-portrait-enter';
  portrait.dataset.testid = 'entrance-portrait';
  portrait.setAttribute('role', 'img');
  portrait.setAttribute('aria-label', customer.name);
  const name = document.createElement('span');
  name.className = 'portrait__name';
  name.textContent = customer.name;
  portrait.appendChild(name);

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

  wrapper.append(portrait, problem, greet);
}
