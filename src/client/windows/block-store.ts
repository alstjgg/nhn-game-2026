// [u3#c6] BLOCK STORE — the merge surface for m3, and nothing more.
//
// 채굴한 문장 보관함. u3 owns the frame; **u4s fills this file** and only this
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
