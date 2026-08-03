// Client boot root (spec-client §2.1 root row, §5.1).
//
// Three lines by design: the skin u1 owns, and the shell boot u3 owns. The
// boot ORDER lives in `shell/boot.ts`; the scaffold placeholder render is
// retired here — nothing but the boot call belongs at this level.
import './styles/index.css'
import { bootShell } from './shell/boot.ts'

void bootShell()

// [u9d#c2] spec-client §3 invariant 11 — the developer pane, and the only
// reference to it anywhere. The guard is a build-time constant, so the player
// build folds it to `if (false)` and the bundler drops the dynamic import (and
// every module behind it) instead of emitting a chunk.
// One line so the boot root stays thin ([u0#c8]).
if (__DEBUG_PANE__) void import('./debug/index.ts').then((pane) => pane.startDebugPane())
