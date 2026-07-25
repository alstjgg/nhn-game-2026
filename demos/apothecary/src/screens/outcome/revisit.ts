// revisit.ts — the 재방문 (revisit) outcome channel (§1.4, signature overlap).
//
// Customer 1's outcome is DELAYED: it arrives as a result-arrival notification
// the moment customer 2's conversation begins, overlapping the next visit. The
// customer's portrait "returns" via the shared u5 `portrait-enter` animation and
// the notification banner pops in via its own `arrival-pop` beat — the arrival is
// always animated, never a silent insert (§4.6). All text is data-driven from the
// resolved Outcome (u3), so nothing here is hard-coded balance.
import type { Customer, Outcome } from '../../data/schema.ts';
import { cssUrl } from '../../ui/css-url.ts';
import { portraitCell } from '../../ui/portrait.ts';

export interface RevisitDeps {
  readonly customer: Customer;
  readonly outcome: Outcome;
  /**
   * The returning customer's sheet (PR #33, R3): the 56px box used to carry their
   * NAME as text, which wrapped mid-word (잠 못 드 / 는 서생) in the demo's
   * signature §1.4 frame. The name now has its own row and the box holds the face.
   * Omitted ⇒ the plain placeholder box, no text inside it.
   */
  readonly sheetUrl?: string;
  /** Palette/mirror variant, matching every other surface this face appears on. */
  readonly variant?: string;
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
  if (deps.sheetUrl !== undefined) {
    // Tier 0: the customer is back at the counter, not mid-argument.
    const cell = portraitCell(0, false);
    if (cell !== undefined) {
      portrait.classList.add('revisit-portrait--sheet');
      if (deps.variant !== undefined) portrait.dataset.variant = deps.variant;
      portrait.style.backgroundImage = cssUrl(deps.sheetUrl);
      portrait.style.backgroundSize = cell.backgroundSize;
      portrait.style.backgroundPosition = cell.backgroundPosition;
    }
  }

  // The name gets its OWN row in the text column: a 56px column is narrower than
  // any of these names and forced a mid-word break in the frame the demo is
  // proudest of.
  const column = document.createElement('div');
  column.className = 'revisit-column';

  const name = document.createElement('p');
  name.className = 'revisit-name';
  name.dataset.testid = 'revisit-name';
  name.textContent = customer.name;

  const text = document.createElement('p');
  text.className = 'revisit-text';
  text.dataset.testid = 'revisit-text';
  text.textContent = outcome.text;

  column.append(name, text);
  body.append(portrait, column);
  note.append(banner, body);
  container.appendChild(note);
  return note;
}
