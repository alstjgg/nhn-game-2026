// SHELL SEAM (AC4). The shell owns #app and nothing else: it renders the chrome
// plus one empty boot slot, and keeps a registry screens mount through.
//
// Why a registry: screen units run in parallel. If each had to wire itself into
// src/main.ts, every screen unit would edit one shared file (apothecary
// DISCOVERY §3). Here a screen module exports its own mount fn, calls
// registerScreen() on import, and main.ts never learns its name.

export type ScreenDeps = Record<string, unknown>;
export type ScreenUnmount = () => void;
export type ScreenMount = (container: HTMLElement, deps: ScreenDeps) => ScreenUnmount | void;

const screens = new Map<string, ScreenMount>();

/**
 * Claim a screen id. Throws on a duplicate: silent last-wins would let two
 * parallel units claim one id, pass their own gates, and break at integration.
 */
export function registerScreen(id: string, mount: ScreenMount): void {
  if (screens.has(id)) {
    throw new Error(`screen id already registered: ${id}`);
  }
  screens.set(id, mount);
}

export function hasScreen(id: string): boolean {
  return screens.has(id);
}

export function screenIds(): string[] {
  return [...screens.keys()];
}

/** Mount a registered screen into `container`, returning its unmount fn if any. */
export function mountScreen(
  id: string,
  container: HTMLElement,
  deps: ScreenDeps = {},
): ScreenUnmount | void {
  const mount = screens.get(id);
  if (!mount) {
    const known = screenIds().join(', ') || 'none';
    throw new Error(`unknown screen id: ${id} (registered: ${known})`);
  }
  return mount(container, deps);
}

/** Render the shell into `root` and return the boot slot screens mount into. */
export function mountShell(root: HTMLElement): HTMLElement {
  root.replaceChildren();

  const shell = document.createElement('div');
  shell.className = 'app-shell';
  shell.dataset.testid = 'app-shell';

  const banner = document.createElement('header');
  banner.className = 'app-shell__banner';

  const wordmark = document.createElement('span');
  wordmark.className = 'app-shell__wordmark';
  wordmark.textContent = 'DARKEST CONTEXT';

  // What the run IS, before the first fight starts. A judge landed straight in
  // 전투 · 턴 1 with no statement of the goal anywhere on the page; one sentence in
  // the chrome is on screen from the first painted frame, on every phase.
  const premise = document.createElement('p');
  premise.className = 'app-shell__premise';
  premise.dataset.testid = 'app-premise';
  premise.textContent =
    '세 용병은 각자의 신념대로 스스로 판단한다 — 컨텍스트가 한계에 닿기 전에 던전을 빠져나가라.';

  banner.append(wordmark, premise);

  const slot = document.createElement('main');
  slot.className = 'screen-slot';
  slot.dataset.testid = 'screen-slot';

  shell.append(banner, slot);
  root.append(shell);
  return slot;
}
