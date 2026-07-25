// The speech bubble — a unit's decision, plus the chips that say why (PRD §2.5).
//
// INV-3 (attribution) is enforced at construction: a displayed decision with an
// empty `because` cannot be built at all. Each chip carries its `data-item-id`, so
// the sheet can prove every chip resolves to a real sheet row.

export interface BubbleOptions {
  unitId: string;
  /** The one in-character line the unit says. */
  say: string;
  /** Sheet-item ids this decision cites. At least one (INV-3). */
  because: readonly string[];
  /**
   * Optional id → short label map, so a chip reads as game text instead of an id.
   * Unmapped ids fall back to the id itself rather than rendering nothing.
   */
  labels?: Readonly<Record<string, string>>;
}

export function createBubble(options: BubbleOptions): HTMLElement {
  const { unitId, say, because, labels } = options;

  const ids = [...(because ?? [])];
  if (ids.length === 0) {
    throw new TypeError(
      `a displayed decision must carry at least one because id (INV-3), unit "${unitId}"`,
    );
  }
  const blank = ids.find((id) => typeof id !== 'string' || id === '');
  if (blank !== undefined) {
    throw new TypeError(`a because id must be a non-empty string, unit "${unitId}"`);
  }

  const bubble = document.createElement('div');
  bubble.className = 'dc-bubble slot-bubble-frame anim-bubble-in';
  bubble.dataset.unitId = unitId;

  const line = document.createElement('p');
  line.className = 'dc-bubble__say';
  line.textContent = say;

  const chips = document.createElement('div');
  chips.className = 'dc-bubble__chips';
  for (const id of ids) {
    const chip = document.createElement('span');
    chip.className = 'dc-chip';
    chip.dataset.itemId = id;
    chip.textContent = labels?.[id] ?? id;
    chips.append(chip);
  }

  bubble.append(line, chips);
  return bubble;
}
