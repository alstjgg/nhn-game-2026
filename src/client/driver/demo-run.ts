// The demo run, offered to the boot sequence — DEV builds only.
//
// The shell opens the desk on a PLACEHOLDER stream (`shell/boot-run.ts`): one
// `meta` event and nothing else, written while the authored run was still
// blocked. It no longer is, and a desk whose stream is empty cannot show a
// window's contents at all — so the driver offers the authored 우는다리 RUN 03
// here, and the boot takes it when it is there.
//
// The offer is guarded rather than direct because spec-client §5.4 keeps the
// fixtures in DEV builds only: the demo is reached through a dynamic import
// behind `import.meta.env.DEV`, so a player build folds the branch away, keeps
// the placeholder, and tree-shakes the whole demo out of the bundle. This is
// the ONLY module that chooses, and it lives under `driver/` so that the shell
// still reaches the seam through the barrel and never into it (C8 / inv 12).
import type { FixtureRun } from './fixtures/types.ts'

/** The authored demo run in a DEV build; `null` in a player build. */
export async function demoRun(): Promise<FixtureRun | null> {
  if (!import.meta.env.DEV) return null
  const demo = await import('./fixtures/woodari-run03.ts')
  return demo.woodariRun03
}
