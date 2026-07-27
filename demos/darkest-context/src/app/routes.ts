// u15 — the route table (PRD §2.2, §2.4).
//
// Two facts live here and nowhere else:
//
//   ① WHICH screens exist — `SCREEN_IDS`, and the only `registerScreen()` call site in
//      `src/**`. Screen units export a factory; nothing else in the app may claim an id.
//   ② WHICH screen plays a tile — `screenIdForTile`, keyed by the authored tile kind of
//      `data/map.json`. An unauthored kind throws: a silent default would strand the run
//      on a blank slot with nothing to press.
//
// Registration is node-safe on purpose (the unit slice runs without a `document`):
// registering stores a mount FUNCTION and renders nothing. What that function receives
// is the finished `ScreenView` the director built for this mount — see `screen-view.ts`
// for why the constructed view, and not the screen's constructor arguments, is what
// crosses the registry seam.

import { hasScreen, registerScreen } from './shell.ts';
import { isScreenView } from './screen-view.ts';

/** The six screens one composed run mounts. `stage` and `end` are phase screens. */
export const SCREEN_IDS = Object.freeze([
  'stage',
  'combat',
  'training',
  'council',
  'rest',
  'end',
] as const);

export type ScreenId = (typeof SCREEN_IDS)[number];

/** PRD §2.4 tile kinds → the screen that plays them. */
const TILE_KIND_SCREENS = new Map<string, ScreenId>([
  ['combat', 'combat'],
  ['combat_final', 'combat'],
  ['training', 'training'],
  ['puzzle', 'council'],
  ['choice', 'council'],
  ['rest', 'rest'],
]);

/**
 * The screen that plays a tile of this kind.
 *
 * Takes a plain string rather than the authored union: tiles are authored in JSON and
 * data can outrun the type, so an unknown kind has to be a runtime failure.
 *
 * @throws Error when no screen is routed for `kind`.
 */
export function screenIdForTile(kind: string): ScreenId {
  const screenId = TILE_KIND_SCREENS.get(kind);
  if (screenId === undefined) {
    throw new Error(
      `no screen routes tile kind '${kind}' (routed: ${[...TILE_KIND_SCREENS.keys()].join(', ')})`,
    );
  }
  return screenId;
}

/**
 * Claims every screen id on the u1 registry. Idempotent — a second call is a no-op
 * rather than a duplicate-id throw, so a re-entered boot cannot break the app.
 */
export function registerRoutes(): void {
  for (const id of SCREEN_IDS) {
    if (hasScreen(id)) continue;
    registerScreen(id, (container, deps) => {
      const view = deps.view;
      if (!isScreenView(view)) {
        throw new Error(`screen '${id}': mount needs deps.view to be a ScreenView`);
      }
      container.append(view.element);
      return () => {
        view.element.remove();
        view.dispose?.();
      };
    });
  }
}
