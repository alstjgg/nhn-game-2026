/**
 * The three builders — engine view (+ the player's injected block ids) → the
 * `CallRequest` the bundle POSTs to the proxy.
 *
 * Contract: [engine ⟷ composer](../../docs/contract-engine-composer.md) §3 (the
 * three builders, `BLOCKS` as a *set* of ids), §4 (`{TEMPERAMENT}` is the one
 * pre-rendered slot), §7 (no scenario read — every value arrives through a
 * view), and [call contracts](../../docs/contract-calls.md) §6/§11 (supplier per
 * slot; the wire shape).
 *
 * Three properties this file exists to hold:
 *
 * 1. **Proxy-owned slots are never emitted.** `FLAW` · `INCIDENT` ·
 *    `PRIORITY_LIST` belong to the default prompt the proxy owns; they are
 *    absent from `JudgmentSlots` by construction, so a client cannot rewrite
 *    the agent's character.
 * 2. **Same block set ⇒ same bytes.** Ids are de-duplicated and sorted by
 *    UTF-16 code unit — locale-free, so a C-BLOCK comparison cannot drift
 *    between two machines. `localeCompare` / `Intl` are banned here.
 * 3. **Purity.** No clock, no randomness, no I/O, no DOM; every array is
 *    rebuilt as a fresh literal so a later mutation of the source view cannot
 *    reach an already-composed payload.
 *
 * `src/composer/index.ts` (the barrel) is e0's and is rewired by a later unit;
 * this module is additive.
 */

import type { GateView, BeatView, RoundView } from '../engine/index.ts'
import type { Composer, ComposerDeps } from './index.ts'
import type {
  Block,
  CallRequest,
  CallType,
  JudgmentSlots,
  NarrationSlots,
  ReporterSlots,
} from '../shared/contracts.ts'
import type { ReportGuidance } from '../shared/report-guidance.ts'
import { renderTemperament } from '../shared/temperament.ts'
import { renderReportGuidance } from '../shared/report-guidance.ts'

/**
 * How the composer reaches block text. Contract §3: the composer "resolves ids
 * to text through the block store the driver passes in" — so the store is a
 * construction dependency, not a view field (views are the engine's and frozen
 * by §2). See `discovery/e5.md`.
 */
export type BlockStore = { get(id: string): Block | undefined }

/**
 * One template version per call type — both prompt layers exist at each.
 *
 * x12 (민서, 08-10) — bumped onto the prompts PR #234 published: the fiction the
 * client has been shipping for weeks (운영자 + 현장 요원 ECHO) and the one the
 * prompts described (광역 재난상황실의 야간 통제관) were two different games, and
 * this line is what finally picks the second one up. `judgment v0.5` /
 * `narration v0.4` / `reporter v0.4` carry the recast, the register split
 * (Call 3 존댓말, Calls 1–2 clipped 해라체), the one-NPC-one-line rule and the
 * branch for a beat where the agent said nothing — which is most of them
 * (`driver.ts:133`, and `docs/handoffs/feed-register-llm-amendment.md` for why).
 *
 * IT LANDS SECOND, AND THIS IS THE SECOND. `proxy-deploy.yml` and the Pages
 * `deploy.yml` both fire on push-to-main and run concurrently, so a client that
 * asks for a version the proxy has not deployed yet makes `proxy/src/prompt.ts`
 * throw `unknown_template_version` on every call — not a soft fallback, the
 * whole desk. The prompts merged in #234 and their proxy deploy went green
 * before this moved. Versions are additive and the old ones are still in the
 * bundle, so the ordering only ever costs a delay, never a break.
 */
export const TEMPLATE_VERSION: Readonly<Record<CallType, string>> = Object.freeze({
  judgment: 'v0.5',
  narration: 'v0.4',
  reporter: 'v0.4',
})

/** Everything `createComposer` needs: e0's deps, narrowed, plus the store. */
export type ComposerRuntimeDeps = ComposerDeps & {
  reportGuidance: ReportGuidance
  blocks: BlockStore
  /**
   * The datapack slug this composer's runs are playing.
   *
   * Not a scenario READ — contract §7 bars the composer from opening the
   * datapack, and this does not open it. It is the pack's name, arriving the
   * same way `reportGuidance` does: as a construction dependency the driver
   * threads in. It travels on the wire so the proxy can pick which agent
   * answers (see `CallRequest.pack`), and it is required rather than optional
   * so a caller that forgets it is a type error here and not a silently
   * mismatched agent in production.
   */
  pack: string
}

/**
 * Canonical block resolution: de-duplicate → sort by UTF-16 code unit → resolve.
 *
 * Resolve-all-then-emit. An unresolved id throws before any `CallRequest` is
 * built, so nothing partial escapes: the engine mints the ids and the driver
 * owns the store, so a miss is a bug in this run — not a player action — and
 * silently dropping it would corrupt a block-set comparison invisibly.
 */
function resolveBlocks(store: BlockStore, ids: readonly string[]): Block[] {
  const canonical = [...new Set(ids)].sort()
  const resolved: Block[] = []
  for (const id of canonical) {
    const found = store.get(id)
    if (found === undefined) {
      throw new Error(`unknown block id: ${id}`)
    }
    resolved.push({ id, text: found.text })
  }
  return resolved
}

export function createComposer(deps: ComposerRuntimeDeps): Composer {
  const { blocks, reportGuidance, pack } = deps

  return {
    judgment(view: GateView, blockIds: string[]): CallRequest {
      const resolved = resolveBlocks(blocks, blockIds)
      const slots: JudgmentSlots = {
        TEMPERAMENT: renderTemperament(view.TEMPERAMENT),
        TIMELINE_EXCERPT: [...view.TIMELINE_EXCERPT],
        BLOCKS: resolved,
        GATE_QUESTION: view.GATE_QUESTION,
        STANCE_SET: view.STANCE_SET.map((stance) => ({
          id: stance.id,
          label: stance.label,
        })),
      }
      return {
        call_type: 'judgment',
        template_version: TEMPLATE_VERSION.judgment,
        pack,
        slots,
      }
    },

    narration(view: BeatView): CallRequest {
      const slots: NarrationSlots = {
        TIMELINE_TAIL: [...view.TIMELINE_TAIL],
        AGENT_UTTERANCE: view.AGENT_UTTERANCE,
        FIXED_NPC_ACTION: view.FIXED_NPC_ACTION,
        SCENE_SYMPTOMS: [...view.SCENE_SYMPTOMS],
        PRESENT_NPCS: view.PRESENT_NPCS.map((npc) => ({
          id: npc.id,
          name: npc.name,
          side: npc.side,
        })),
      }
      return {
        call_type: 'narration',
        template_version: TEMPLATE_VERSION.narration,
        pack,
        slots,
      }
    },

    reporter(view: RoundView): CallRequest {
      const slots: ReporterSlots = {
        EXPERIENCED: [...view.EXPERIENCED],
        TEMPERAMENT: renderTemperament(view.TEMPERAMENT),
        REPORT_GUIDANCE: renderReportGuidance(reportGuidance),
      }
      return {
        call_type: 'reporter',
        template_version: TEMPLATE_VERSION.reporter,
        pack,
        slots,
      }
    },
  }
}
