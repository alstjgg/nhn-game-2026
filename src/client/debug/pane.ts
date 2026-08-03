// The debug pane's DOM — spec-client §6 `DebugPane`, §2.1 (`debug/` reads the
// driver and nothing else).
//
// Two raw tables and nothing more: no prose, no formatting, no interpretation.
// The payload column is `JSON.stringify` of the record minus its discriminant,
// so what the seam actually carried is on screen byte for byte. Invariant 1
// holds even flag-on — the pane owns no writable surface, so every node here is
// a table part; nothing is ever built from an HTML string either, which keeps
// event text (operator-facing prose) out of the parser.
import type { MembraneOp, ViewEvent } from '../driver/index.ts'

/** The pane's root element id — one of the two markers inv 11 greps for. */
export const PANE_ID = 'debug-pane'

/** The pane's module marker — the other one, carried as `data-pane`. */
export const PANE_MARKER = 'nhn:debug-pane'

const EVENT_COLUMNS = ['seq', 'clock', 'type', 'payload'] as const
const OP_COLUMNS = ['seq', 'op', 'payload'] as const

/** What the clock column shows for an event the seam gave no stamp. */
const NO_STAMP = '—'

const CSS = `
#debug-pane{position:fixed;left:0;bottom:0;z-index:9000;box-sizing:border-box;
  max-width:46vw;max-height:42vh;overflow:auto;padding:6px;
  background:#080d12;color:#cfe3ea;font:11px/1.35 ui-monospace,monospace}
#debug-pane table{border-collapse:collapse;width:100%;margin-bottom:6px}
#debug-pane th,#debug-pane td{border:1px solid #23343d;padding:1px 4px;
  text-align:left;vertical-align:top;white-space:pre}
#debug-pane th{color:#7fb0c4;font-weight:400}
#debug-pane td{max-width:34em;overflow:hidden;text-overflow:ellipsis}
`

/** One cell, tagged with the column it belongs to. */
function cell(column: string, text: string): HTMLTableCellElement {
  const td = document.createElement('td')
  td.dataset.debugCell = column
  td.textContent = text
  return td
}

function dataRow(cells: readonly (readonly [string, string])[]): HTMLTableRowElement {
  const tr = document.createElement('tr')
  tr.dataset.debugRow = ''
  for (const [column, text] of cells) tr.append(cell(column, text))
  return tr
}

/** An empty table says so with a row, so "no records" reads apart from "broken". */
function emptyRow(span: number): HTMLTableRowElement {
  const tr = document.createElement('tr')
  tr.dataset.debugEmpty = ''
  const td = document.createElement('td')
  td.colSpan = span
  td.textContent = NO_STAMP
  tr.append(td)
  return tr
}

interface Table {
  readonly root: HTMLTableElement
  readonly body: HTMLTableSectionElement
  readonly columns: readonly string[]
}

function buildTable(name: string, columns: readonly string[]): Table {
  const root = document.createElement('table')
  root.dataset.debugTable = name
  const head = document.createElement('thead')
  const headRow = document.createElement('tr')
  for (const column of columns) {
    const th = document.createElement('th')
    th.textContent = column
    headRow.append(th)
  }
  head.append(headRow)
  const body = document.createElement('tbody')
  root.append(head, body)
  return { root, body, columns }
}

function fill(table: Table, rows: readonly HTMLTableRowElement[]): void {
  table.body.replaceChildren(...(rows.length === 0 ? [emptyRow(table.columns.length)] : rows))
}

/** The record minus its discriminant, raw. */
function payloadOf(record: object, discriminant: string): string {
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key !== discriminant) rest[key] = value
  }
  return JSON.stringify(rest)
}

/** The seam's own stamp, unformatted — or a dash when the event carries none. */
function stampOf(event: ViewEvent): string {
  if ('clock' in event) return event.clock
  if ('line' in event) return event.line.clock
  return NO_STAMP
}

export interface PaneView {
  /** Repaints both tables from the records handed in. Reads nothing itself. */
  render(events: readonly ViewEvent[], ops: readonly MembraneOp[]): void
}

/** Mounts the pane as a direct child of `host` — never inside the desk. */
export function mountPane(host: HTMLElement): PaneView {
  const root = document.createElement('section')
  root.id = PANE_ID
  root.dataset.pane = PANE_MARKER

  const style = document.createElement('style')
  style.textContent = CSS

  const events = buildTable('events', EVENT_COLUMNS)
  const ops = buildTable('ops', OP_COLUMNS)

  root.append(style, events.root, ops.root)
  host.append(root)

  return {
    render(eventList, opList) {
      fill(
        events,
        eventList.map((event, index) =>
          dataRow([
            ['seq', String(index + 1)],
            ['clock', stampOf(event)],
            ['type', event.type],
            ['payload', payloadOf(event, 'type')],
          ]),
        ),
      )
      fill(
        ops,
        opList.map((op, index) =>
          dataRow([
            ['seq', String(index + 1)],
            ['op', op.op],
            ['payload', payloadOf(op, 'op')],
          ]),
        ),
      )
    },
  }
}
