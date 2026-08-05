/**
 * The membrane — the player's whole out-channel, as a state machine.
 *
 * The rule this file exists to hold is the membrane rule itself: the player
 * never types at the model. Five structured ops arrive, and the only one that
 * reaches a payload is `deploy`, which carries **ids of sentences the engine
 * already minted** — never text.
 *
 * `deploy` is a SET (`view-driver.ts`: "order carries no meaning"). It is
 * de-duplicated and sorted by UTF-16 code unit here, and again by the composer;
 * two deploys of the same block set therefore compose byte-identical payloads
 * no matter what order the player clicked them in (contract §8-10).
 *
 * Nothing here throws (decision 10): an unknown op, an unmined block or an
 * unminable sentence is an `{ok:false, reason}` answer. A thrown op handler
 * would take the client down over a mis-click.
 */

import type { MembraneOp } from '../shared/view-driver.ts'
import type { MutableBlockStore, OpAck } from './ports.ts'

const OK: OpAck = { ok: true }

const deny = (reason: string): OpAck => ({ ok: false, reason })

export type Membrane = {
  submit(op: MembraneOp): OpAck
  /** The de-duplicated, canonically sorted block set the next Call 1 carries. */
  deployed(): string[]
  /** Block ids currently in slots, in ascending slot order. */
  slottedIds(): string[]
  /** True once the player asked to end the run. */
  ending(): boolean
}

export function createMembrane(blocks: MutableBlockStore): Membrane {
  const slots = new Map<number, string>()
  let deployedIds: string[] = []
  let ending = false

  const canonical = (ids: readonly string[]): string[] => [...new Set(ids)].sort()

  return {
    submit(op: MembraneOp): OpAck {
      switch (op.op) {
        case 'slot': {
          if (!blocks.has(op.block_id)) return deny('unknown_block')
          slots.set(op.slot, op.block_id)
          return OK
        }
        case 'unslot': {
          if (!slots.has(op.slot)) return deny('empty_slot')
          slots.delete(op.slot)
          return OK
        }
        case 'mine': {
          return blocks.mine(op.sentence_id) ? OK : deny('not_minable')
        }
        case 'deploy': {
          // Resolve-all-then-commit: a set with one unmined id changes nothing.
          for (const id of op.blocks) {
            if (!blocks.has(id)) return deny('unknown_block')
          }
          deployedIds = canonical(op.blocks)
          return OK
        }
        case 'new_run': {
          ending = true
          return OK
        }
        default:
          return deny('unknown_op')
      }
    },

    deployed: () => [...deployedIds],

    slottedIds: () =>
      [...slots.entries()].sort((left, right) => left[0] - right[0]).map(([, id]) => id),

    ending: () => ending,
  }
}
