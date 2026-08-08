// Desktop dressing — the boot sweep's hand-off to the desk.
//
// u1's skin hides every `.win` while `<body>` carries `booting`, so the desk
// is not on screen half-drawn while the scanline runs (shell.css:
// `body.booting .win{visibility:hidden}`). The reference dropped the class at
// the end of its synchronous boot because its windows were already in the
// markup; ours are built at boot, so the class comes off when their entry
// animation has finished and their boxes are final.
//
// Everything else in the dressing — wallpaper, grain, vignette, sweep, the
// thread and toast hosts — is static markup in index.html and pure CSS. u8
// draws into those hosts; nothing here touches them.

/** Puts the desk under the boot sweep. Call before the windows are built. */
export function holdDesk(body: HTMLElement): void {
  body.classList.add('booting')
}

/**
 * Reveals the desk once every window's entry animation has settled, and
 * resolves when it has.
 *
 * ENTRY animations only — an animation that never ends has no `finished` to
 * wait for, and waiting on one holds the curtain for ever. That was a latent
 * bug the whole time (`.win` carries `winIn`, which is finite, so nothing had
 * ever tripped it) and x3 tripped it: the onboarding walk marks a window with
 * an infinite pulse, and its first mark lands in the microtask between this
 * call and the frame below. The desk stayed hidden until the mark came off
 * eight seconds later — an opening nobody saw, behind a curtain nobody could
 * lift.
 *
 * The returned promise is what `shell/boot.ts` hands the walk as its
 * `deskReady`: a mark on a window that is still `visibility:hidden` is a mark
 * on nothing, so the walk starts when the desk is actually on screen.
 */
export function revealDesk(body: HTMLElement, windows: readonly HTMLElement[]): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      const settled = windows.flatMap((node) =>
        node
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished),
      )
      void Promise.all(settled)
        .catch(() => undefined)
        .then(() => {
          body.classList.remove('booting')
          resolve()
        })
    })
  })
}
