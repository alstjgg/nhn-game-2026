// [u4] AGENT FILE — 요원 파일 · 프롬프트 편성 (spec-client §4).
//
// The window assembles four components and owns nothing else: the ruled file
// head, the §0–§5 dossier, the deploy zone and the stamp. The membrane state
// lives in the SlotBoard (one owner, `components/slot-board.ts`); the run state
// this file keeps is the two things the seam tells it — the current run, and
// the run it deployed for.
//
// Import-safe by contract (u3): no DOM at module scope, no stylesheet import,
// no sibling window import, nothing from engine or composer (C8 / inv 12), and
// no fixture module — carried ids resolve through the report index (D13).
import type { FixtureDriver, Sentence } from '../driver/index.ts'
import { el } from '../shell/dom.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { pad2, setPickedBlockId } from '../components/block-card.ts'
import { buildDossier, callsignOf, dossierModel } from '../components/dossier.ts'
import type { DossierInput } from '../components/dossier.ts'
import { SLOT_CAP, createSlotBoard } from '../components/slot-board.ts'
import { buildDeployStamp, buildDeployZone, deployView } from '../components/deploy-button.ts'

/** The dev/test handle, exactly as `shell/boot.ts` exposes `window.__shell`. */
export interface AgentFileHandle {
  slots(): (string | null)[]
  place(blockId: string, slot: number): void
  clear(slot: number): void
  deployed(): boolean
  /** Seeds the id→Sentence index a `report` event would otherwise fill. */
  index(sentence: Sentence): void
  /** Arms the pick channel a slot press consumes. */
  pick(blockId: string | null): void
}

declare global {
  interface Window {
    __agentFile?: AgentFileHandle
  }
}

const FILE_TITLE = '현장 요원 운용 파일'

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  const sentences = new Map<string, Sentence>()
  let run = 0
  let slug = ''
  let opensAt = driver.clock.at()
  let band = ''
  let committedRun: number | null = null
  let committedAt: string | null = null

  const docLine = el('div', 'fh-doc')
  const callsignLine = el('div', 'fh-v', callsignOf(run))

  const board = createSlotBoard({
    emit: (op) => driver.send(op).ok,
    resolve: (blockId) => sentences.get(blockId) ?? null,
    onChange: () => {
      // R5 — the stamp is dated once, at the moment the file closed.
      if (board.isLocked() && committedRun === null) {
        committedRun = run
        committedAt = opensAt
      }
      if (!board.isLocked()) {
        committedRun = null
        committedAt = null
      }
      sync()
    },
  })

  function dossierInput(): DossierInput {
    return { slotCap: SLOT_CAP, callsign: callsignOf(run), clockBand: band, slotHost: board.root }
  }

  function sync(): void {
    docLine.textContent = `문서번호 ${PORTAL.portalCode}/AF/${slug}/${pad2(run)}`
    callsignLine.textContent = callsignOf(run)
    const view = deployView({
      slots: board.cells(),
      deployed: board.isLocked(),
      run: committedRun ?? run,
      at: committedAt ?? opensAt,
    })
    zone.render(view)
    stamp.render(view)
  }

  const zone = buildDeployZone(() => board.deploy())
  const stamp = buildDeployStamp()
  let dossier = buildDossier(dossierModel(dossierInput()), board.root)

  const head = el('div', 'file-head')
  const left = el('div', 'fh-left')
  left.append(docLine, el('div', 'fh-title', FILE_TITLE))
  const right = el('div', 'fh-right')
  right.append(el('div', 'fh-k', '호출부호'), callsignLine)
  head.append(left, right)

  host.append(stamp.root, head, dossier, zone.root)

  driver.subscribe((event) => {
    if (event.type === 'report') {
      for (const sentence of [...event.facts, ...event.report_body]) {
        sentences.set(sentence.id, sentence)
      }
      board.render()
      return
    }
    if (event.type !== 'meta') return
    const changedRun = event.run !== run
    run = event.run
    // D10 — the seam carries no `new_run` event; a changed run IS the unlock.
    if (committedRun !== null && event.run !== committedRun) board.unlock()
    // M1 — §0's callsign is per sitting, so only a changed run re-prints the
    // dossier; an archive-only `meta` must not re-parent the live slot board.
    if (changedRun) {
      const next = buildDossier(dossierModel(dossierInput()), board.root)
      dossier.replaceWith(next)
      dossier = next
    }
    sync()
  })

  // D2 — identity is pack-fed, never a literal. The structure is already up;
  // this re-prints it with the two fields the pack owns. A pack the shell has
  // already read cannot fail here, and if it did the head simply stays unnamed.
  void fetchScenarioIdentity()
    .then((identity) => {
      slug = identity.slug
      opensAt = identity.start
      band = `${identity.start} → ${identity.end}`
      const next = buildDossier(dossierModel(dossierInput()), board.root)
      dossier.replaceWith(next)
      dossier = next
      sync()
    })
    .catch(() => undefined)

  // DEV/TEST only — see `shell/boot.ts`'s note on `window.__shell` (inv 11).
  if (import.meta.env.DEV) {
    window.__agentFile = {
      slots: () => board.cells(),
      place: (blockId, slot) => board.place(blockId, slot),
      clear: (slot) => board.clear(slot),
      deployed: () => board.isLocked(),
      index: (sentence) => {
        sentences.set(sentence.id, sentence)
        board.render()
      },
      pick: (blockId) => setPickedBlockId(blockId),
    }
  }

  sync()
}
