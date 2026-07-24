// revisit.ts — the 재방문 (revisit) outcome channel (§1.4, signature overlap).
//
// Customer 1's outcome is DELAYED: it arrives as a result-arrival notification
// the moment customer 2's conversation begins, overlapping the next visit. The
// customer's portrait "returns" via the shared u5 `portrait-enter` animation and
// the notification banner pops in via its own `arrival-pop` beat — the arrival is
// always animated, never a silent insert (§4.6). All text is data-driven from the
// resolved Outcome (u3), so nothing here is hard-coded balance.
import type { Customer, Outcome } from '../../data/schema.ts';

export interface RevisitDeps {
  readonly customer: Customer;
  readonly outcome: Outcome;
}

/**
 * Mount the revisit notification into the overlay layer (which floats above the
 * live customer-2 conversation — that is the overlap). Returns the node so the
 * host can dismiss it later if it wants; the demo leaves it pinned.
 */
export function mountRevisitNotification(
  container: HTMLElement,
  deps: RevisitDeps,
): HTMLElement {
  const { customer, outcome } = deps;

  const note = document.createElement('div');
  note.className = 'revisit-notification anim-portrait-enter';
  note.dataset.testid = 'revisit-notification';
  note.dataset.channel = outcome.channel;
  note.setAttribute('role', 'status');
  note.setAttribute('aria-live', 'polite');

  // The result-arrival notification banner — names the returning customer and
  // the channel (재방문), sourced from data.
  const banner = document.createElement('div');
  banner.className = 'arrival-notification';
  banner.dataset.testid = 'arrival-notification';
  banner.textContent = `${outcome.channel} · ${customer.name}`;

  const body = document.createElement('div');
  body.className = 'revisit-notification__body';

  const portrait = document.createElement('div');
  portrait.className = 'portrait revisit-portrait anim-portrait-enter';
  portrait.dataset.testid = 'revisit-portrait';
  portrait.setAttribute('role', 'img');
  portrait.setAttribute('aria-label', customer.name);
  const name = document.createElement('span');
  name.className = 'portrait__name';
  name.textContent = customer.name;
  portrait.appendChild(name);

  const text = document.createElement('p');
  text.className = 'revisit-text';
  text.dataset.testid = 'revisit-text';
  text.textContent = outcome.text;

  body.append(portrait, text);
  note.append(banner, body);
  container.appendChild(note);
  return note;
}
