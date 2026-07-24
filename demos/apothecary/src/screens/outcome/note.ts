// note.ts — the 문앞 쪽지 (note at the door) outcome channel (§1.1 outcome phase).
//
// Customer 2's outcome is the demo's end screen: a note left at the door whose
// text is the resolved Outcome (u3) — pure data, no hard-coded balance. The
// screen enters via the shared u5 `portrait-enter` animation so the ending is
// revealed, never instantly swapped in (§4.6).
import type { Customer, Outcome } from '../../data/schema.ts';

export interface DoorNoteDeps {
  readonly customer: Customer;
  readonly outcome: Outcome;
}

/** Mount the 문앞 쪽지 end screen into `wrapper`. */
export function renderDoorNote(wrapper: HTMLElement, deps: DoorNoteDeps): void {
  const { outcome } = deps;

  wrapper.classList.add('door-note');
  wrapper.dataset.testid = 'door-note';
  wrapper.dataset.channel = outcome.channel;

  const heading = document.createElement('p');
  heading.className = 'door-note__heading';
  heading.dataset.testid = 'door-note-heading';
  // The channel label is data (outcome.channel === '문앞 쪽지'); the framing
  // verb is presentation, not balance.
  heading.textContent = `${outcome.channel}가 도착했다`;

  const paper = document.createElement('div');
  paper.className = 'door-note__paper';
  const text = document.createElement('p');
  text.className = 'door-note__text';
  text.dataset.testid = 'door-note-text';
  text.textContent = outcome.text;
  paper.appendChild(text);

  wrapper.append(heading, paper);
}
