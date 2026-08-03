// Client boot root (spec-client §2.1 root row, §5.1).
//
// Scaffold stage: the shell/window/driver modules are still empty, so boot
// keeps the pre-existing placeholder render alive. u1 retires `placeholder.ts`
// and mounts the real shell here. Keep this file a thin boot root — nothing
// but the mount call belongs at this level.
import { mountPlaceholder } from './placeholder.ts'

mountPlaceholder()
