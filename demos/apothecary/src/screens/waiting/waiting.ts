// waiting.ts — the door-idle beat (PRD §2.3).
//
// Ambient staging shown while the next customer is on the way: a lamp behind the
// door, drifting dust, and one injected line of copy. It is scenery, not a
// readout — PRD §3 invariant 5 keeps quiet degradation quiet, so this screen
// shows no machine state whatsoever and owns no clock (§3-3).
//
// The beat ends only when the caller says so: `settle()` opens the door and
// fires `onSettled` exactly once. u13's pipeline is the sole caller and the sole
// owner of duration; nothing here schedules itself.
import '../../styles/base.css';
import './waiting.css';

export interface WaitingDeps {
  /** Ambient line, rendered verbatim. u8 owns no copy of its own. */
  readonly line: string;
  /** Invoked once, only from settle(). */
  readonly onSettled?: () => void;
}

export interface WaitingHandle {
  readonly root: HTMLElement;
  /**
   * Caller-initiated end of the beat. Synchronously flips `root` to
   * `data-phase="settling"` (door widens, seam brightens — see waiting.css)
   * and fires `onSettled` once, in the same tick: this screen owns no
   * clock (§3-3), so it cannot stagger those two effects itself.
   *
   * Contract for the caller (u13's pipeline, the sole caller): the settling
   * visual only paints if `root` stays mounted for at least
   * `--duration-slow` after this call returns. Calling `destroy()` from
   * inside `onSettled` unmounts before the browser paints a frame, so the
   * transition never becomes visible — that is expected, not a bug here,
   * and holding the node mounted long enough is on the caller.
   */
  settle(): void;
  /** Detach root; idempotent; disarms the latch so settle() can no longer fire. */
  destroy(): void;
}

export interface SettleLatch {
  /** True once settle() has fired the callback. */
  readonly settled: boolean;
  /** Fire onSettled at most once; no-op once settled or sealed. */
  settle(): void;
  /** Permanently disarm — settle() after seal() never fires. */
  seal(): void;
}

/**
 * A pure, DOM-free once-only gate. Caller-driven by construction: it holds no
 * schedule of any kind, so it can never fire on its own.
 */
export function createSettleLatch(onSettled?: () => void): SettleLatch {
  let settled = false;
  let sealed = false;

  return {
    get settled(): boolean {
      return settled;
    },
    settle(): void {
      if (settled || sealed) {
        return;
      }
      // Marked before the call so a throwing callback cannot re-arm the gate.
      settled = true;
      onSettled?.();
    },
    seal(): void {
      sealed = true;
    },
  };
}

/** Decorative dust specks; each gets an index the stylesheet staggers on. */
const MOTE_COUNT = 3;

/**
 * Build the purely decorative scenery — hidden from assistive tech.
 *
 * Deliberately does NOT paint its own door or lamp shape: u7's pixel-art
 * `bg-shop.png` (src/styles/base.css) already paints a door and a hanging
 * lantern behind every screen, so a second, flat CSS door/lamp drawn on top
 * of it read as a rendering glitch in judge-facing screenshots (f3). This
 * scene only adds the light-seam (grounded on the scene box itself, not a
 * door shape) and the drifting dust motes — ambient accents that layer onto
 * the painted art instead of competing with it.
 */
function buildScene(): HTMLElement {
  const scene = document.createElement('div');
  scene.className = 'waiting__scene';
  scene.setAttribute('aria-hidden', 'true');

  const seam = document.createElement('span');
  seam.className = 'waiting__door-seam';
  scene.append(seam);

  for (let i = 0; i < MOTE_COUNT; i += 1) {
    const mote = document.createElement('span');
    mote.className = 'waiting__mote';
    mote.style.setProperty('--i', String(i));
    scene.append(mote);
  }

  return scene;
}

/**
 * Mount the door-idle beat as a child of `container` (never clearing it) and
 * hand back the caller's only controls over it.
 */
export function mountWaiting(container: HTMLElement, deps: WaitingDeps): WaitingHandle {
  const root = document.createElement('section');
  root.className = 'waiting';
  root.dataset.testid = 'waiting';
  root.dataset.phase = 'idle';

  const lineEl = document.createElement('p');
  lineEl.className = 'waiting__line';
  lineEl.dataset.testid = 'waiting-line';
  lineEl.textContent = deps.line;

  root.append(buildScene(), lineEl);
  container.append(root);

  const latch = createSettleLatch(deps.onSettled);

  return {
    root,
    settle(): void {
      root.dataset.phase = 'settling';
      latch.settle();
    },
    destroy(): void {
      latch.seal();
      root.remove();
    },
  };
}
