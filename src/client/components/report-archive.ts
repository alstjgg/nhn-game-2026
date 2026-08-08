// [u6] ReportArchive — spec-client §3 inv 6 + §6 row `ReportArchive`.
//
// The rail is segmented by SITTING and TIME, and by nothing else: "no gate
// label appears on any player surface". The seam hands over `meta.archive` as
// `{run, label}` pairs, so the run number is the authority for the `ECHO-n`
// half (G3 — `callsignOf`) and the label contributes only its time span — a
// label that already
// carries its own prefix is normalised rather than doubled, and a label that
// smuggles a design-time marker is refused outright instead of being printed.
//
// Ported from docs/design/phase2-ui/app.js `renderArchive()` (line 484). The
// reference painted plain buttons and kept the selection in a module global;
// here the rail is a real listbox with a roving tabindex (PRD §4 a11y) and the
// selection is pushed back to the window through `onSelect`.
import { el } from '../shell/dom.ts'
import { callsignOf } from './dossier.ts'

/** One archived run as the seam carries it (`meta.archive[]`). */
export interface ArchiveEntry {
  run: number
  label: string
}

/**
 * One rail segment, ready to paint.
 *
 * x5 — a segment is a RUN and nothing else. The entry's `label` used to be
 * printed under the callsign as the tab's own subtitle, and what the live seam
 * actually puts in that field is the run id (`driver/live/index.ts` —
 * `${slug}-r${run}`), so the rail read `ECHO-1 / 전구간정상-r1`: the pack's slug
 * and the run number, on a tab already headed by the run number, in a window
 * whose whole rail is one scenario. The label is still VALIDATED below — inv 6
 * is about what may reach a player surface, and the cheapest way to keep that
 * true is to keep refusing a bad one even now that none of it is printed.
 */
export interface ArchiveSegment {
  run: number
  runLabel: string
  selected: boolean
}

/** Design-time run grouping. It never reaches a player surface (inv 6). */
const REFUSED = /gate|게이트/i

/**
 * The rail's accessible name — it is a list of filed runs, nothing more.
 *
 * x5 — both of these said `시행/시각`, and the tab no longer prints a 시각. A
 * label that names a column the rail does not have is worse than no label:
 * sighted or not, the reader goes looking for it.
 */
export const RAIL_LABEL = '보관 기록 · 시행'

/** The rail's own footnote, decorative and hidden from the listbox. */
export const RAIL_NOTE = '보관 기록 · 시행 순'

/**
 * One segment per archive entry, in stream order, with exactly one selected.
 * Throws when an entry's label carries anything but run and time.
 */
export function archiveSegments(
  archive: readonly ArchiveEntry[],
  activeRun: number,
): ArchiveSegment[] {
  return archive.map((entry) => {
    if (REFUSED.test(entry.label)) {
      throw new Error(`archive label for run ${entry.run} names more than run and time`)
    }
    return {
      run: entry.run,
      runLabel: callsignOf(entry.run),
      selected: entry.run === activeRun,
    }
  })
}

/**
 * Where ←/→/Home/End move the roving focus, or `null` when the key is not the
 * rail's to handle. Movement clamps at both ends — the rail does not wrap.
 */
export function railKeyIndex(count: number, current: number, key: string): number | null {
  if (count <= 0) return null
  const last = count - 1
  switch (key) {
    case 'ArrowRight':
      return Math.min(current + 1, last)
    case 'ArrowLeft':
      return Math.max(current - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}

/* ── the DOM side ────────────────────────────────────────────────────────── */

export interface ArchiveRail {
  readonly root: HTMLElement
  /** Rebuilds the segments; the active run keeps the selection. */
  render(archive: readonly ArchiveEntry[], activeRun: number): void
  /** Moves the announced selection and the roving tabindex to `run`. */
  select(run: number): void
  /** The runs the rail currently offers, in rail order. */
  runs(): number[]
}

export interface ArchiveRailOptions {
  onSelect(run: number): void
}

export function createArchiveRail(options: ArchiveRailOptions): ArchiveRail {
  const root = el('div', 'arch-rail')
  root.id = 'archRail'
  root.setAttribute('role', 'listbox')
  root.setAttribute('aria-label', RAIL_LABEL)

  let buttons: HTMLButtonElement[] = []
  let order: number[] = []

  function paintSelection(run: number): void {
    buttons.forEach((node, i) => {
      const on = order[i] === run
      node.classList.toggle('on', on)
      node.setAttribute('aria-selected', on ? 'true' : 'false')
      node.tabIndex = on ? 0 : -1
    })
  }

  function choose(run: number): void {
    paintSelection(run)
    options.onSelect(run)
  }

  root.addEventListener('keydown', (event: KeyboardEvent) => {
    const current = order.findIndex((_, i) => buttons[i]?.tabIndex === 0)
    const next = railKeyIndex(order.length, Math.max(0, current), event.key)
    if (next === null) return
    event.preventDefault()
    const run = order[next]
    if (run === undefined) return
    choose(run)
    buttons[next]?.focus()
  })

  return {
    root,

    render(archive: readonly ArchiveEntry[], activeRun: number): void {
      const segments = archiveSegments(archive, activeRun)
      root.replaceChildren()
      order = segments.map((s) => s.run)
      buttons = segments.map((segment) => {
        const node = el('button', 'arch')
        node.type = 'button'
        node.setAttribute('role', 'option')
        node.append(el('span', undefined, segment.runLabel))
        node.addEventListener('click', () => {
          choose(segment.run)
        })
        return node
      })
      root.append(...buttons)
      const note = el('div', 'arch-note', RAIL_NOTE)
      note.setAttribute('aria-hidden', 'true')
      root.append(note)
      paintSelection(activeRun)
    },

    select(run: number): void {
      paintSelection(run)
    },

    runs(): number[] {
      return [...order]
    },
  }
}
