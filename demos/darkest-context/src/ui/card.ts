// The card primitive — Prompt / Skill / MCP (PRD §2.3, §2.8).
//
// A card is always a real <button>. That is the membrane (INV-1) in one line: the
// player commits by pressing a card, never by typing, so there is no native
// text-entry control anywhere in this layer. Selection is mirrored as both the
// `.dc-card--selected` class and `aria-pressed`, so CSS and assistive tech read
// the same state.
//
// The three types are told apart by CSS tint (`.dc-card--<type>` → `--dc-tint-*`),
// and the frame + icon arrive through the asset slots — the card never names a file.

import { CARD_TYPES, isCardType, type CardType } from './types.ts';

export interface CardOptions {
  /** Stable card id (data/cards.json). Surfaces as `data-card-id`. */
  id: string;
  type: CardType;
  /** The card's name, e.g. 「도발」. */
  title: string;
  /** The sentence this card adds to a unit's persona. */
  sentence: string;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
}

const SELECTED = 'dc-card--selected';

export function createCard(options: CardOptions): HTMLButtonElement {
  const { id, type, title, sentence, selected = false, onToggle } = options;

  if (!isCardType(type)) {
    throw new TypeError(
      `unknown card type: ${String(type)} (expected ${CARD_TYPES.join(' | ')})`,
    );
  }
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`card id must be a non-empty string, got ${String(id)}`);
  }

  const card = document.createElement('button');
  card.type = 'button';
  card.className = `dc-card dc-card--${type} slot-card-frame${selected ? ` ${SELECTED}` : ''}`;
  card.dataset.cardId = id;
  card.dataset.cardType = type;
  card.setAttribute('aria-pressed', String(selected));

  const icon = document.createElement('span');
  icon.className = 'dc-card__icon slot-card-icon';
  icon.setAttribute('aria-hidden', 'true');

  const titleEl = document.createElement('span');
  titleEl.className = 'dc-card__title';
  titleEl.textContent = title;

  const sentenceEl = document.createElement('span');
  sentenceEl.className = 'dc-card__sentence';
  sentenceEl.textContent = sentence;

  card.append(icon, titleEl, sentenceEl);

  card.addEventListener('click', () => {
    const next = card.classList.toggle(SELECTED);
    card.setAttribute('aria-pressed', String(next));
    onToggle?.(next);
  });

  return card;
}
