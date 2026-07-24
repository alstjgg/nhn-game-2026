// card.ts — the shared .card primitive factory (u5, PRD §1.2 card-feel).
//
// A card is always an interactive button, never a native form control:
// the membrane rule (§4.1) and cards-never-forms (§4.5) forbid free-text and
// native select / input / textarea fields. The player commits choices by pressing cards,
// and selection is reflected both as the `.card--selected` class and via
// `aria-pressed` so the state is visible to CSS and assistive tech alike.
//
// Importing the style layer here means every consumer of the card primitive
// gets the token foundation, card states, and animation vocabulary for free.
import '../styles/base.css';
import '../styles/animations.css';
import '../styles/cards.css';

export interface CardOptions {
  /** Primary label shown on the card. */
  label: string;
  /** Optional secondary line (flavour / stats). */
  detail?: string;
  /** Initial selected state (default: false). */
  selected?: boolean;
  /** Called whenever the card's selected state toggles. */
  onToggle?: (selected: boolean) => void;
}

const SELECTED_CLASS = 'card--selected';

/** Build an interactive card control. */
export function createCard(options: CardOptions): HTMLButtonElement {
  const { label, detail, selected = false, onToggle } = options;

  const card = document.createElement('button');
  card.type = 'button';
  card.className = selected ? `card ${SELECTED_CLASS}` : 'card';
  card.setAttribute('aria-pressed', String(selected));

  const title = document.createElement('span');
  title.className = 'card__label';
  title.textContent = label;
  card.appendChild(title);

  if (detail !== undefined && detail !== '') {
    const sub = document.createElement('span');
    sub.className = 'card__detail';
    sub.textContent = detail;
    card.appendChild(sub);
  }

  card.addEventListener('click', () => {
    const next = card.classList.toggle(SELECTED_CLASS);
    card.setAttribute('aria-pressed', String(next));
    onToggle?.(next);
  });

  return card;
}
