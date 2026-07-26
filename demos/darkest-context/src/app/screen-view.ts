// u15 — what the shell registry actually carries.
//
// A screen's constructor arguments are run state (the party, the gauge, the tile in
// play); the registry knows none of that and must not learn it, or every screen unit
// would be back to editing one shared file. So the value that crosses the seam is the
// FINISHED view: an element plus the two verbs the composition needs from it.
//
// `advance` is the engine half of a screen. A fight resolves turns, a council resolves
// one stance round — both are things the app plays out, and neither is a player click.
// A screen that only waits for the player (훈련장 · 휴식 · 종료) simply omits it.

export interface ScreenView {
  readonly element: HTMLElement;
  /**
   * Plays every engine-driven beat this view owns and resolves when it is waiting on
   * the player. Absent when the view has no engine half at all.
   */
  readonly advance?: () => Promise<void>;
  /** Released when the view leaves the slot. */
  readonly dispose?: () => void;
}

/**
 * The registry hands mounts a `Record<string, unknown>`; this is the one shape this
 * app ever puts in it. Structural, not nominal — the check is what a mount can prove
 * about a value it did not build.
 */
export function isScreenView(value: unknown): value is ScreenView {
  if (typeof value !== 'object' || value === null) return false;
  if (!('element' in value)) return false;
  const element = value.element;
  return typeof element === 'object' && element !== null && 'append' in element;
}
