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

/** Reveals the desk once every window's entry animation has settled. */
export function revealDesk(body: HTMLElement, windows: readonly HTMLElement[]): void {
  requestAnimationFrame(() => {
    const settled = windows.flatMap((node) => node.getAnimations().map((a) => a.finished))
    void Promise.all(settled)
      .catch(() => undefined)
      .then(() => body.classList.remove('booting'))
  })
}
