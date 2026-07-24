// showcase.ts — mounts a small strip of live .card primitives onto the demo
// page so the shared UI vocabulary is visible/exercisable at `/` (the render
// surface the e2e gate needs — see DISCOVERY "Scope gap"). Later screen units
// (conversation / crafting) replace this with real domain cards; until then
// this proves the primitives are wired end-to-end in a browser.
import { createCard } from './card.ts';

interface Sample {
  label: string;
  detail: string;
}

const SAMPLES: readonly Sample[] = [
  { label: '말린 국화', detail: '진정 · 쓴맛' },
  { label: '감초 뿌리', detail: '조화 · 단맛' },
  { label: '용의 비늘', detail: '희귀 · 열기' },
];

/** Append a shelf of example cards into the given container. */
export function mountCardShowcase(container: HTMLElement): void {
  const shelf = document.createElement('div');
  shelf.className = 'card-shelf';
  for (const sample of SAMPLES) {
    shelf.appendChild(createCard(sample));
  }
  container.appendChild(shelf);
}
