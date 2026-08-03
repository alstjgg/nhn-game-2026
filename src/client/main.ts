// Client boot root (spec-client §2.1 root row, §5.1).
//
// Three lines by design: the skin u1 owns, and the shell boot u3 owns. The
// boot ORDER lives in `shell/boot.ts`; the scaffold placeholder render is
// retired here — nothing but the boot call belongs at this level.
import './styles/index.css'
import { bootShell } from './shell/boot.ts'

void bootShell()
