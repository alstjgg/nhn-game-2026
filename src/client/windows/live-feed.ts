// [u3#c6] LIVE FEED — the merge surface for m3, and nothing more.
//
// 실시간 무전 피드. u3 owns the frame; **u5 fills this file** and only this
// file, so no later unit has to touch a shared barrel or index.html. The body
// the shell hands over stays empty in this unit ([u3 · c10]).
//
// Import-safe by contract: no DOM at module scope, no stylesheet import, no
// sibling window import, nothing from engine or composer (C8 / inv 12).
import type { FixtureDriver } from '../driver/index.ts'

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  void host
  void driver
}
